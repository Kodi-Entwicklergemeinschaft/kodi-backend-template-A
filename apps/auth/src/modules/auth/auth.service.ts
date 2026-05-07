import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  HttpException,
  Inject,
} from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import { PrismaAuthService } from '@kodi/prisma';
import { PermissionService, roleToNumber, numberToRole } from '@kodi/rbac';
import { JwtTokenService, CityAssignment } from '@kodi/jwt';
import { RedisService } from '@kodi/redis';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { UserRole } from '@prisma/client-core';
import { AuthAction, AuthProvider, TokenType } from '@prisma/client-auth';
import * as bcrypt from 'bcrypt';
import { LoginDto, AssignCityAdminDto, GuestLoginDto, ConvertGuestDto } from '@kodi/contracts';
import { SagaOrchestratorService } from '@kodi/saga';

@Injectable()
export class AuthService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prismaAuth: PrismaAuthService, // For sessions and audit logs (own database)
    private readonly permissionService: PermissionService,
    private readonly jwtService: JwtTokenService,
    private readonly redis: RedisService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly sagaOrchestrator: SagaOrchestratorService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(AuthService.name);
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string | null,
    action: AuthAction,
    success: boolean,
    failureReason?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>,
  ) {
    try {
      await this.prismaAuth.authAuditLog.create({
        data: {
          userId,
          action,
          success,
          failureReason,
          ipAddress,
          userAgent,
          metadata: metadata ? metadata : undefined,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
      // Don't throw - audit logging failure shouldn't break auth flow
    }
  }

  /**
   * Store session (for future OAuth/BIND_ID support)
   */
  private async storeSession(
    userId: string,
    tokenType: TokenType,
    expiresAt: Date,
    provider: AuthProvider = AuthProvider.LOCAL,
    metadata?: Record<string, any>,
    deviceId?: string,
    devicePlatform?: string,
  ) {
    try {
      await this.prismaAuth.session.create({
        data: {
          userId,
          tokenType,
          expiresAt,
          provider,
          metadata: metadata ? metadata : undefined,
          deviceId: deviceId || null,
          devicePlatform: (devicePlatform as any) || null,
        },
      });
    } catch (error) {
      this.logger.error('Failed to store session', error);
      // Don't throw - session storage failure shouldn't break auth flow
    }
  }

  /**
   * Check terms acceptance status (non-blocking)
   * Returns default values if check fails or times out
   * Locale is used to get the correct terms ID for the user's language
   */
  private async checkTermsAcceptance(
    userId: string,
    cityAssignments: CityAssignment[],
    locale?: string,
  ): Promise<{
    requiresTermsAcceptance: boolean;
    termsId: string | null;
    latestVersion: string | null;
    gracePeriodEndsAt: string | null;
  }> {
    const defaultTermsInfo = {
      requiresTermsAcceptance: false,
      termsId: null,
      latestVersion: null,
      gracePeriodEndsAt: null,
    };

    try {
      const cityId = cityAssignments.length > 0 ? cityAssignments[0].cityId : null;
      const TERMS_CHECK_TIMEOUT = 500;

      const acceptanceCheck = await firstValueFrom(
        this.client
          .send<
            { hasAccepted: boolean; termsId: string | null; gracePeriodEndsAt: Date | null },
            { userId: string; locale?: string; cityId?: string | null }
          >(RabbitMQPatterns.TERMS_CHECK_ACCEPTANCE, {
            userId,
            locale, // Pass user's locale to check correct language terms
            cityId,
          })
          .pipe(timeout(TERMS_CHECK_TIMEOUT)),
      );

      if (acceptanceCheck.hasAccepted) {
        return defaultTermsInfo;
      }

      // User hasn't accepted terms - get latest terms version in their language
      try {
        const latestTerms = await firstValueFrom(
          this.client
            .send<any, { locale?: string; cityId?: string | null }>(
              RabbitMQPatterns.TERMS_GET_LATEST,
              {
                locale, // Pass user's locale to get correct language terms
                cityId,
              },
            )
            .pipe(timeout(TERMS_CHECK_TIMEOUT)),
        );

        return {
          requiresTermsAcceptance: true,
          termsId: latestTerms?.id || acceptanceCheck.termsId,
          latestVersion: latestTerms?.version || null,
          gracePeriodEndsAt: acceptanceCheck.gracePeriodEndsAt
            ? new Date(acceptanceCheck.gracePeriodEndsAt).toISOString()
            : null,
        };
      } catch (error) {
        // If we can't get latest terms, return what we have from acceptance check
        return {
          requiresTermsAcceptance: true,
          termsId: acceptanceCheck.termsId,
          latestVersion: null,
          gracePeriodEndsAt: acceptanceCheck.gracePeriodEndsAt
            ? new Date(acceptanceCheck.gracePeriodEndsAt).toISOString()
            : null,
        };
      }
    } catch (error) {
      // Terms check failed or timed out - return defaults (non-blocking)
      this.logger.debug('Terms acceptance check failed or timed out', { userId, locale, error });
      return defaultTermsInfo;
    }
  }

  /**
   * Login user - Using Saga pattern for distributed transaction
   * Login is now email-only since username is optional
   */
  async login(dto: LoginDto, locale?: string, ipAddress?: string, userAgent?: string) {
    this.logger.log(`Login attempt for email: ${dto.email}, locale: ${locale || 'default'}`);

    let failureReason: string | undefined;

    try {
      // Step 1: Find user from users service via RabbitMQ (email only)
      let user: any;

      try {
        user = await firstValueFrom(
          this.client
            .send<any, { email: string }>(RabbitMQPatterns.USER_FIND_BY_EMAIL, {
              email: dto.email,
            })
            .pipe(timeout(10000)),
        );
      } catch (error) {
        this.logger.error('Error sending request to users service', error);
        throw error;
      }

      if (!user) {
        failureReason = `Account not found with email: ${dto.email}`;
        this.logger.warn(`Login failed - Account not found for email: ${dto.email}`);
        await this.createAuditLog(
          null,
          AuthAction.LOGIN,
          false,
          failureReason,
          ipAddress,
          userAgent,
          { email: dto.email },
        );
        throw new UnauthorizedException({
          errorCode: 'ACCOUNT_NOT_FOUND',
          message: `No account found with email address: ${dto.email}. Please check your email or register for a new account.`,
          email: dto.email,
        });
      }

      if (!user.isActive) {
        failureReason = `Account is inactive for email: ${dto.email}`;
        this.logger.warn(
          `Login failed - Account inactive for email: ${dto.email}, userId: ${user.id}`,
        );
        await this.createAuditLog(
          user.id,
          AuthAction.LOGIN,
          false,
          failureReason,
          ipAddress,
          userAgent,
          { email: dto.email },
        );
        throw new UnauthorizedException({
          errorCode: 'ACCOUNT_INACTIVE',
          message: `Your account is inactive. Please contact support for assistance.`,
          email: dto.email,
        });
      }

      // Check email verification (fail fast if email exists and not verified)
      // This check must happen BEFORE password validation to prevent information leakage
      // IMPORTANT: Check email verification status BEFORE password validation
      this.logger.debug(
        `User found: id=${user.id}, email=${user.email}, emailVerified=${user.emailVerified}, isActive=${user.isActive}`,
      );

      // If user has an email, it MUST be verified before login
      if (user.email) {
        // Explicitly check if emailVerified is not true (handles false, null, undefined)
        if (user.emailVerified !== true) {
          this.logger.log(
            `Blocking login - email not verified: userId=${user.id}, email=${user.email}, emailVerified=${user.emailVerified}`,
          );

          // Automatically resend verification email if token is expired
          try {
            await firstValueFrom(
              this.client
                .send<
                  any,
                  {
                    userId: string;
                    email: string;
                    firstName?: string;
                    lastName?: string;
                    preferredLanguage?: string;
                  }
                >(RabbitMQPatterns.VERIFICATION_RESEND, {
                  userId: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  preferredLanguage: locale,
                })
                .pipe(timeout(5000)),
            );
            this.logger.log(`Auto-resent verification email for unverified user: ${user.id}`);
          } catch (error) {
            // If error is VERIFICATION_ALREADY_SENT, that's expected (token still valid)
            // Otherwise log as warning - verification resend is best effort
            if (error?.response?.errorCode === 'VERIFICATION_ALREADY_SENT') {
              this.logger.debug(
                `Verification email already sent and not expired for user ${user.id}`,
              );
            } else {
              this.logger.warn(
                `Failed to auto-resend verification email for user ${user.id}`,
                error,
              );
            }
          }

          failureReason = 'Email not verified';
          await this.createAuditLog(
            user.id,
            AuthAction.LOGIN,
            false,
            failureReason,
            ipAddress,
            userAgent,
          );
          throw new ForbiddenException({
            errorCode: 'EMAIL_VERIFICATION_REQUIRED',
            message:
              'Please verify your email address before logging in. A verification email has been sent to your email address.',
            details: {
              userId: user.id,
              email: user.email,
              resendVerificationEndpoint: '/api/notification/verification/resend',
            },
          });
        }
      }

      // Verify password (only if email is verified or user has no email)
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      if (!isPasswordValid) {
        failureReason = `Invalid password for email: ${dto.email}`;
        this.logger.warn(
          `Login failed - Invalid password for email: ${dto.email}, userId: ${user.id}`,
        );
        await this.createAuditLog(
          user.id,
          AuthAction.LOGIN,
          false,
          failureReason,
          ipAddress,
          userAgent,
          { email: dto.email },
        );
        throw new UnauthorizedException({
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password. Please check your credentials and try again.',
          email: dto.email,
        });
      }

      // Step 2: Load user's city assignments from core service via RabbitMQ
      const dbAssignments = await firstValueFrom(
        this.client
          .send<
            Array<{ cityId: string; role: UserRole; canManageAdmins: boolean }>,
            { userId: string }
          >(RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS, { userId: user.id })
          .pipe(timeout(10000)),
      );

      const cityAssignments: CityAssignment[] = dbAssignments.map((a) => ({
        cityId: a.cityId,
        role: roleToNumber(a.role),
        canManageAdmins: a.canManageAdmins,
      }));

      // Determine highest role for permissions (use auth role or highest assignment role)
      const roleHierarchy = [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.CITIZEN];
      const userRoleIndex = roleHierarchy.indexOf(user.role as UserRole);
      const assignmentRoles = dbAssignments.map((a) => a.role);
      const highestAssignmentIndex =
        assignmentRoles.length > 0
          ? Math.min(...assignmentRoles.map((r) => roleHierarchy.indexOf(r)))
          : roleHierarchy.length - 1;

      const effectiveRole =
        userRoleIndex >= 0 && userRoleIndex < highestAssignmentIndex
          ? user.role
          : assignmentRoles.length > 0
            ? roleHierarchy[highestAssignmentIndex]
            : UserRole.CITIZEN;

      const permissions = await this.permissionService.getUserPermissions(
        effectiveRole as UserRole,
      );

      // Generate a deviceId if not provided (for multi-device support)
      const deviceId =
        dto.deviceId || `device_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Generate tokens with city context and permissions
      const selectedCityId = cityAssignments.length > 0 ? cityAssignments[0].cityId : undefined;
      const tokens = await this.jwtService.generateTokenPair(user.id, user.email, user.role, {
        selectedCityId,
        cityAssignments: cityAssignments.length > 0 ? cityAssignments : undefined,
        permissions: permissions.length > 0 ? permissions : undefined,
        deviceId,
      });

      // Store refresh token in Redis with device-specific key (multi-device support)
      // Use 30 days if rememberMe is true, otherwise 7 days
      const refreshTokenExpiry = dto.rememberMe
        ? 30 * 24 * 60 * 60 // 30 days for remember me
        : 7 * 24 * 60 * 60; // 7 days for regular login
      await this.redis.set(
        `refresh_token:${user.id}:${deviceId}`,
        tokens.refreshToken,
        refreshTokenExpiry,
      );

      // Store session in auth database (for audit and future OAuth/BIND_ID)
      const expiresAt = new Date(Date.now() + refreshTokenExpiry * 1000);
      await this.storeSession(user.id, TokenType.JWT, expiresAt, AuthProvider.LOCAL, {
        rememberMe: dto.rememberMe || false,
        deviceId,
      });

      // Create audit log for successful login
      await this.createAuditLog(user.id, AuthAction.LOGIN, true, undefined, ipAddress, userAgent, {
        tokenType: 'JWT',
        rememberMe: dto.rememberMe || false,
        refreshTokenExpiry: refreshTokenExpiry,
      });

      this.logger.log(`User logged in successfully: ${user.id}`);

      // Check terms acceptance status (non-blocking - don't fail login if terms service is slow)
      // Pass user's locale so they get the correct terms ID for their language
      const finalTermsInfo = await this.checkTermsAcceptance(user.id, cityAssignments, locale);

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: roleToNumber(user.role),
          userType: 'REGISTERED',
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ...tokens,
        ...finalTermsInfo,
      };
    } catch (error) {
      // Re-throw HTTP exceptions (UnauthorizedException, ForbiddenException) as-is
      if (error instanceof HttpException) {
        throw error;
      }
      // Log and convert other errors to UnauthorizedException
      failureReason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Login error for email: ${dto.email}`, error);
      await this.createAuditLog(
        null,
        AuthAction.LOGIN,
        false,
        failureReason,
        ipAddress,
        userAgent,
        { email: dto.email },
      );
      throw new UnauthorizedException({
        errorCode: 'LOGIN_ERROR',
        message: 'An error occurred during login. Please try again later.',
        email: dto.email,
      });
    }
  }

  /**
   * Logout user
   * @param deviceId - If provided, only logout from specific device. Otherwise logout from all devices.
   */
  async logout(userId: string, deviceId?: string, ipAddress?: string, userAgent?: string) {
    this.logger.log(`Logging out user: ${userId}, device: ${deviceId || 'all'}`);

    if (deviceId) {
      // Logout specific device only
      await this.redis.del(`refresh_token:${userId}:${deviceId}`);
    } else {
      // Logout all devices - delete all tokens for this user
      await this.redis.delPattern(`refresh_token:${userId}:*`);
      // Also try legacy key format for backward compatibility
      await this.redis.del(`refresh_token:${userId}`);
    }

    // Revoke active sessions
    const whereClause: any = {
      userId,
      revokedAt: null,
    };

    if (deviceId) {
      whereClause.deviceId = deviceId;
    }

    await this.prismaAuth.session.updateMany({
      where: whereClause,
      data: {
        revokedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(userId, AuthAction.LOGOUT, true, undefined, ipAddress, userAgent);

    // Could also add access token to blacklist here
    // await this.redis.set(`blacklist:${accessToken}`, '1', tokenTtl);

    return {
      message: 'Logged out successfully',
    };
  }

  /**
   * Refresh tokens
   * @param providedDeviceId - Optional device ID (extracted from token if not provided)
   */
  async refreshTokens(refreshToken: string, providedDeviceId?: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyRefreshToken(refreshToken);

      // Get deviceId from token payload or use provided one
      const deviceId = payload.deviceId || providedDeviceId;

      // Check if refresh token exists in Redis (device-specific key for multi-device support)
      let storedToken: string | null = null;
      if (deviceId) {
        storedToken = await this.redis.get<string>(`refresh_token:${payload.sub}:${deviceId}`);
      }
      // Fallback for legacy tokens without deviceId
      if (!storedToken) {
        storedToken = await this.redis.get<string>(`refresh_token:${payload.sub}`);
      }
      if (!storedToken || storedToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Get user from users service via RabbitMQ
      const user = await firstValueFrom(
        this.client
          .send<any, { id: string }>(RabbitMQPatterns.USER_FIND_BY_ID, { id: payload.sub })
          .pipe(timeout(10000)),
      );

      if (!user || !user.isActive) {
        await this.createAuditLog(
          payload.sub,
          AuthAction.TOKEN_REFRESH,
          false,
          'User not found or inactive',
        );
        throw new UnauthorizedException('User not found or inactive');
      }

      // Check if user is a guest
      const isGuest = payload.isGuest || user.userType === 'GUEST';

      // Load user's city assignments from core service via RabbitMQ (only for registered users)
      let cityAssignments: CityAssignment[] = [];
      let permissions: string[] = [];
      let selectedCityId: string | undefined;

      if (!isGuest) {
        const dbAssignments = await firstValueFrom(
          this.client
            .send<
              Array<{ cityId: string; role: UserRole; canManageAdmins: boolean }>,
              { userId: string }
            >(RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS, { userId: user.id })
            .pipe(timeout(10000)),
        );

        cityAssignments = dbAssignments.map((a) => ({
          cityId: a.cityId,
          role: roleToNumber(a.role),
          canManageAdmins: a.canManageAdmins,
        }));

        // Determine effective role for permissions
        const roleHierarchy = [UserRole.SUPER_ADMIN, UserRole.CITY_ADMIN, UserRole.CITIZEN];
        const userRoleIndex = roleHierarchy.indexOf(user.role as UserRole);
        const assignmentRoles = dbAssignments.map((a) => a.role);
        const highestAssignmentIndex =
          assignmentRoles.length > 0
            ? Math.min(...assignmentRoles.map((r) => roleHierarchy.indexOf(r)))
            : roleHierarchy.length - 1;

        const effectiveRole =
          userRoleIndex >= 0 && userRoleIndex < highestAssignmentIndex
            ? user.role
            : assignmentRoles.length > 0
              ? roleHierarchy[highestAssignmentIndex]
              : UserRole.CITIZEN;

        permissions = await this.permissionService.getUserPermissions(effectiveRole as UserRole);
        selectedCityId = cityAssignments.length > 0 ? cityAssignments[0].cityId : undefined;
      }

      // Use deviceId from payload, provided value, or user record
      const effectiveDeviceId = deviceId || user.deviceId;

      // Generate new tokens with appropriate flags
      const tokens = await this.jwtService.generateTokenPair(
        user.id,
        user.email || null, // Can be null for guest users
        user.role,
        {
          isGuest,
          deviceId: effectiveDeviceId,
          selectedCityId,
          cityAssignments: cityAssignments.length > 0 ? cityAssignments : undefined,
          permissions: permissions.length > 0 ? permissions : undefined,
        },
      );

      // Update refresh token in Redis with device-specific key (multi-device support)
      // Guest users get 30 days, registered users get 7 days
      const refreshTokenExpiry = isGuest ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      const redisKey = effectiveDeviceId
        ? `refresh_token:${user.id}:${effectiveDeviceId}`
        : `refresh_token:${user.id}`;
      await this.redis.set(redisKey, tokens.refreshToken, refreshTokenExpiry);

      // Update session expiry
      const expiresAt = new Date(Date.now() + refreshTokenExpiry * 1000);
      await this.storeSession(
        user.id,
        TokenType.REFRESH,
        expiresAt,
        AuthProvider.LOCAL,
        { deviceId: effectiveDeviceId },
        effectiveDeviceId,
        user.devicePlatform,
      );

      // Create audit log
      await this.createAuditLog(user.id, AuthAction.TOKEN_REFRESH, true);

      this.logger.log(`Tokens refreshed for user: ${user.id}`);

      return tokens;
    } catch (error) {
      this.logger.error('Failed to refresh tokens', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Assign city admin (Super Admin or City Admin with canManageAdmins permission)
   */
  async assignCityAdmin(
    dto: AssignCityAdminDto,
    requesterId: string,
    requesterRole?: number | string,
  ) {
    this.logger.log(`Assigning city admin: ${dto.userId} to city: ${dto.cityId}`);

    // Normalize role (handle both string and number formats from JWT)
    let normalizedRole: UserRole;
    if (requesterRole !== undefined) {
      const roleNumber = typeof requesterRole === 'number' ? requesterRole : null;
      normalizedRole = roleNumber !== null ? numberToRole(roleNumber) : (requesterRole as UserRole);
    } else {
      // Fallback: fetch from database if role not provided (shouldn't happen with updated controller)
      const requester = await firstValueFrom(
        this.client
          .send<any, { id: string }>(RabbitMQPatterns.USER_FIND_BY_ID, { id: requesterId })
          .pipe(timeout(10000)),
      );

      if (!requester) {
        throw new UnauthorizedException('Requester not found');
      }

      const roleNumber = typeof requester.role === 'number' ? requester.role : null;
      normalizedRole =
        roleNumber !== null ? numberToRole(roleNumber) : (requester.role as UserRole);
    }

    this.logger.debug(
      `Assign city admin - Requester role check: userId=${requesterId}, role=${normalizedRole}, rawRole=${requesterRole}`,
    );

    // Super admins can always manage city admins, skip permission check
    const isSuperAdmin = normalizedRole === UserRole.SUPER_ADMIN;
    if (isSuperAdmin) {
      this.logger.log(
        `Super Admin detected - bypassing permission check for userId=${requesterId}`,
      );
    } else {
      // Check if requester can manage city admins for this city
      this.logger.debug(
        `Not a Super Admin - checking canManageCityAdmins for userId=${requesterId}, cityId=${dto.cityId}`,
      );
      const canManage = await this.permissionService.canManageCityAdmins(requesterId, dto.cityId);
      if (!canManage) {
        throw new ForbiddenException('Insufficient permissions to assign city admins');
      }
    }

    // Verify target user exists via users service
    const user = await firstValueFrom(
      this.client
        .send<any, { id: string }>(RabbitMQPatterns.USER_FIND_BY_ID, { id: dto.userId })
        .pipe(timeout(10000)),
    );

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Get requester's assignments for permission check
    // Super admins can grant canManageAdmins to city admins they assign
    // Convert role number to enum for comparison (2 = CITY_ADMIN)
    const targetRole = numberToRole(dto.role);
    let canGrantManageAdmins = false;
    if (isSuperAdmin) {
      canGrantManageAdmins = targetRole === UserRole.CITY_ADMIN;
    } else {
      const requesterAssignments = await this.permissionService.getUserCityAssignments(requesterId);
      const requesterAssignment = requesterAssignments.find((a) => {
        return a.cityId === dto.cityId || a.canManageAdmins;
      });
      canGrantManageAdmins =
        requesterAssignment?.canManageAdmins === true && targetRole === UserRole.CITY_ADMIN;
    }

    // Assign city admin via core service
    const assignment = await firstValueFrom(
      this.client
        .send<
          { id: string; userId: string; cityId: string; role: UserRole },
          AssignCityAdminDto & { assignedBy: string; canGrantManageAdmins: boolean }
        >(RabbitMQPatterns.CORE_ASSIGN_CITY_ADMIN, {
          ...dto,
          assignedBy: requesterId,
          canGrantManageAdmins,
        })
        .pipe(timeout(15000)),
    );

    this.logger.log(`City admin assigned successfully: ${assignment.id}`);

    return assignment;
  }

  /**
   * Get user's accessible cities
   */
  async getUserCities(userId: string) {
    this.logger.log(`Getting cities for user: ${userId}`);

    // Get user cities from core service via RabbitMQ
    const assignments = await firstValueFrom(
      this.client
        .send<
          Array<{ cityId: string; role: UserRole; canManageAdmins: boolean; createdAt: Date }>,
          { userId: string }
        >(RabbitMQPatterns.CORE_GET_USER_CITIES, { userId })
        .pipe(timeout(10000)),
    );

    return assignments;
  }

  /**
   * Get user's managed cities (including child cities)
   */
  async getUserManagedCities(userId: string): Promise<string[]> {
    // Get user cities from core service via RabbitMQ
    const assignments = await firstValueFrom(
      this.client
        .send<
          Array<{ cityId: string }>,
          { userId: string; role: UserRole }
        >(RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS, { userId, role: UserRole.CITY_ADMIN })
        .pipe(timeout(10000)),
    );

    return assignments.map((a) => a.cityId);
  }

  /**
   * Get user's active sessions
   */
  async getSessions(userId: string) {
    this.logger.log(`Getting sessions for user: ${userId}`);

    const sessions = await this.prismaAuth.session.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      select: {
        id: true,
        tokenType: true,
        provider: true,
        expiresAt: true,
        createdAt: true,
        metadata: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions;
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    this.logger.log(`Revoking session ${sessionId} for user: ${userId}`);

    // Verify session belongs to user
    const session = await this.prismaAuth.session.findFirst({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found or already revoked');
    }

    // Revoke session
    await this.prismaAuth.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    // If it's a refresh token session, remove from Redis
    if (session.tokenType === TokenType.JWT || session.tokenType === TokenType.REFRESH) {
      await this.redis.del(`refresh_token:${userId}`);
    }

    // Create audit log
    await this.createAuditLog(userId, AuthAction.LOGOUT, true, undefined, undefined, undefined, {
      sessionId,
      action: 'session_revoked',
    });

    this.logger.log(`Session ${sessionId} revoked successfully`);

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllSessions(userId: string) {
    this.logger.log(`Revoking all sessions for user: ${userId}`);

    // Revoke all active sessions
    const result = await this.prismaAuth.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // Remove refresh token from Redis
    await this.redis.del(`refresh_token:${userId}`);

    // Create audit log
    await this.createAuditLog(userId, AuthAction.LOGOUT, true, undefined, undefined, undefined, {
      action: 'all_sessions_revoked',
      sessionsRevoked: result.count,
    });

    this.logger.log(`Revoked ${result.count} sessions for user: ${userId}`);

    return {
      message: 'All sessions revoked successfully',
      sessionsRevoked: result.count,
    };
  }

  /**
   * Create guest session for mobile app
   * Checks for existing guest with same deviceId and devicePlatform, creates if not exists
   */
  async createGuestSession(dto: GuestLoginDto, ipAddress?: string, userAgent?: string) {
    this.logger.log(`Creating guest session for device: ${dto.deviceId} (${dto.devicePlatform})`);

    try {
      // Check if guest already exists for this device
      let guestUser = await firstValueFrom(
        this.client
          .send<any, { deviceId: string; devicePlatform: string }>(
            RabbitMQPatterns.USER_FIND_BY_DEVICE,
            {
              deviceId: dto.deviceId,
              devicePlatform: dto.devicePlatform,
            },
          )
          .pipe(timeout(10000)),
      );

      // If no guest exists, create one
      if (!guestUser) {
        guestUser = await firstValueFrom(
          this.client
            .send<any, { deviceId: string; devicePlatform: string; deviceMetadata?: any }>(
              RabbitMQPatterns.USER_CREATE_GUEST,
              {
                deviceId: dto.deviceId,
                devicePlatform: dto.devicePlatform,
                deviceMetadata: dto.deviceMetadata,
              },
            )
            .pipe(timeout(10000)),
        );
      }

      // Generate tokens with guest flag
      const tokens = await this.jwtService.generateTokenPair(
        guestUser.id,
        null, // No email for guests
        UserRole.CITIZEN,
        {
          isGuest: true,
          deviceId: guestUser.deviceId,
        },
      );

      // Store refresh token in Redis with device-specific key (consistent with refreshTokens)
      // Use guestUser.deviceId to match the value embedded in the JWT token
      const refreshTokenExpiry = 30 * 24 * 60 * 60; // 30 days for guest sessions
      await this.redis.set(
        `refresh_token:${guestUser.id}:${guestUser.deviceId}`,
        tokens.refreshToken,
        refreshTokenExpiry,
      );

      // Store session in auth database with device info
      const expiresAt = new Date(Date.now() + refreshTokenExpiry * 1000);
      await this.storeSession(
        guestUser.id,
        TokenType.JWT,
        expiresAt,
        AuthProvider.LOCAL,
        {
          ...dto.deviceMetadata,
        },
        dto.deviceId,
        dto.devicePlatform,
      );

      // Create audit log
      await this.createAuditLog(
        guestUser.id,
        AuthAction.LOGIN,
        true,
        undefined,
        ipAddress,
        userAgent,
        {
          userType: 'GUEST',
          deviceId: dto.deviceId,
          devicePlatform: dto.devicePlatform,
        },
      );

      // Check terms acceptance for guest (non-blocking)
      const termsInfo = await this.checkTermsAcceptance(guestUser.id, []);

      this.logger.log(`Guest session created successfully: ${guestUser.id}`);

      return {
        user: {
          id: guestUser.id,
          guestId: guestUser.guestId,
          deviceId: guestUser.deviceId,
          devicePlatform: guestUser.devicePlatform,
          userType: 'GUEST',
        },
        ...tokens,
        requiresTermsAcceptance: termsInfo.requiresTermsAcceptance,
        termsId: termsInfo.termsId,
        latestVersion: termsInfo.latestVersion,
        gracePeriodEndsAt: termsInfo.gracePeriodEndsAt,
      };
    } catch (error) {
      this.logger.error('Failed to create guest session', error);
      throw error;
    }
  }

  /**
   * Convert guest user to registered user
   * All data linked by userId automatically transfers (favorites, listings, etc.)
   */
  async convertGuestToRegistered(dto: ConvertGuestDto, ipAddress?: string, userAgent?: string) {
    this.logger.log(`Converting guest to registered user: ${dto.guestUserId}`);

    try {
      // Verify guest user exists
      const guestUser = await firstValueFrom(
        this.client
          .send<any, { id: string }>(RabbitMQPatterns.USER_FIND_BY_ID, { id: dto.guestUserId })
          .pipe(timeout(10000)),
      );

      if (!guestUser || guestUser.userType !== 'GUEST') {
        throw new UnauthorizedException('Invalid guest user');
      }

      // Convert guest to registered user via users service
      const registeredUser = await firstValueFrom(
        this.client
          .send<
            any,
            {
              guestUserId: string;
              email: string;
              username?: string | null;
              password: string;
              firstName?: string | null;
              lastName?: string | null;
              cityId?: string;
            }
          >(RabbitMQPatterns.USER_CONVERT_GUEST, {
            guestUserId: dto.guestUserId,
            email: dto.email,
            username: dto.username || null,
            password: dto.password,
            firstName: dto.firstName || null,
            lastName: dto.lastName || null,
            cityId: dto.cityId,
          })
          .pipe(timeout(15000)),
      );

      // Load user's city assignments from core service (if any)
      let cityAssignments: CityAssignment[] = [];
      try {
        const dbAssignments = await firstValueFrom(
          this.client
            .send<
              Array<{ cityId: string; role: UserRole; canManageAdmins: boolean }>,
              { userId: string }
            >(RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS, { userId: registeredUser.id })
            .pipe(timeout(10000)),
        );

        cityAssignments = dbAssignments.map((a) => ({
          cityId: a.cityId,
          role: roleToNumber(a.role),
          canManageAdmins: a.canManageAdmins,
        }));
      } catch (error) {
        // No city assignments, that's fine
        this.logger.debug('No city assignments found for converted user');
      }

      // Get permissions
      const permissions = await this.permissionService.getUserPermissions(
        registeredUser.role as UserRole,
      );

      // Generate new tokens for registered user
      const selectedCityId = cityAssignments.length > 0 ? cityAssignments[0].cityId : undefined;
      const tokens = await this.jwtService.generateTokenPair(
        registeredUser.id,
        registeredUser.email,
        registeredUser.role,
        {
          isGuest: false,
          selectedCityId,
          cityAssignments: cityAssignments.length > 0 ? cityAssignments : undefined,
          permissions: permissions.length > 0 ? permissions : undefined,
        },
      );

      // Update refresh token in Redis
      const refreshTokenExpiry = 7 * 24 * 60 * 60; // 7 days for registered users
      await this.redis.set(
        `refresh_token:${registeredUser.id}`,
        tokens.refreshToken,
        refreshTokenExpiry,
      );

      // Update session expiry
      const expiresAt = new Date(Date.now() + refreshTokenExpiry * 1000);
      await this.storeSession(registeredUser.id, TokenType.JWT, expiresAt, AuthProvider.LOCAL);

      // Create audit log
      await this.createAuditLog(
        registeredUser.id,
        AuthAction.REGISTRATION_ATTEMPT,
        true,
        undefined,
        ipAddress,
        userAgent,
        {
          action: 'GUEST_TO_USER_CONVERSION',
          migratedFromGuestId: registeredUser.migratedFromGuestId,
        },
      );

      this.logger.log(`Guest converted to registered user successfully: ${registeredUser.id}`);

      return {
        user: {
          id: registeredUser.id,
          email: registeredUser.email,
          username: registeredUser.username,
          role: roleToNumber(registeredUser.role),
          userType: registeredUser.userType,
          firstName: registeredUser.firstName,
          lastName: registeredUser.lastName,
          migratedFromGuestId: registeredUser.migratedFromGuestId,
        },
        ...tokens,
        dataMigrated: true, // All data automatically migrated
      };
    } catch (error) {
      this.logger.error('Failed to convert guest to registered user', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to convert guest user');
    }
  }
}
