import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  ServiceUnavailableException,
  Inject,
} from '@nestjs/common';
import { firstValueFrom, timeout } from 'rxjs';
import { PrismaUsersService } from '@kodi/prisma';
import { PermissionService, roleToNumber } from '@kodi/rbac';
import { RABBITMQ_CLIENT, RabbitMQPatterns, RmqClientWrapper } from '@kodi/rabbitmq';
import { LoggerService } from '@kodi/logger';
import { UserRole } from '@prisma/client-core';
import { UserType, DevicePlatform } from '@prisma/client-users';
import * as bcrypt from 'bcrypt';
import {
  CreateUserDto,
  UpdateUserDto,
  RegisterDto,
  UpdateProfileDto,
  ChangePasswordDto,
  UserFilterDto,
  UserSortDirection,
  UpdatePreferencesDto,
} from '@kodi/contracts';
import { SagaOrchestratorService } from '@kodi/saga';
import { ErrorCode } from '@kodi/errors';
import { I18nService } from '@kodi/i18n';

@Injectable()
export class UsersService {
  private readonly logger: LoggerService;

  constructor(
    private readonly prisma: PrismaUsersService,
    private readonly permissionService: PermissionService,
    @Inject(RABBITMQ_CLIENT) private readonly client: RmqClientWrapper,
    private readonly sagaOrchestrator: SagaOrchestratorService,
    private readonly i18nService: I18nService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext(UsersService.name);
  }

  /**
   * Register a new user (public endpoint)
   * Uses Saga pattern if cityId is provided (multi-service transaction)
   */
  async register(dto: RegisterDto, language?: string) {
    // Validate required fields for registration (only email and password are required)
    if (!dto.email || !dto.password) {
      throw new ConflictException({ errorCode: ErrorCode.REGISTRATION_FIELDS_REQUIRED });
    }

    // Normalize email to lowercase for case-insensitive uniqueness
    const normalizedEmail = dto.email.toLowerCase().trim();
    this.logger.log(`Registering user: ${normalizedEmail}`);

    // Check if user already exists by email (case-insensitive lookup for backward compatibility)
    const existingUserByEmail = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingUserByEmail) {
      throw new ConflictException({ errorCode: ErrorCode.DUPLICATE_EMAIL });
    }

    // Check if username already exists (only if username is provided)
    if (dto.username) {
      const existingUserByUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUserByUsername) {
        throw new ConflictException({ errorCode: ErrorCode.DUPLICATE_USERNAME });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // If cityId is provided, use Saga pattern for distributed transaction
    if (dto.cityId) {
      return this.registerWithCity(dto, hashedPassword, language);
    }

    // Simple case: just create user (no city assignment)
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        username: dto.username || null,
        password: hashedPassword,
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        salutationCode: dto.salutationCode || null,
        hasVehicle: dto.hasVehicle ?? false,
        role: UserRole.CITIZEN,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        createdAt: true,
      },
    });

    // Emit user created event
    this.client.emit(RabbitMQPatterns.USER_CREATED, {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      cityId: null, // No city selected
      timestamp: new Date().toISOString(),
      preferredLanguage: language,
    });

    this.logger.log(`User registered successfully: ${user.id}`);
    return user;
  }

  /**
   * Register user with city assignment using Saga pattern
   */
  private async registerWithCity(dto: RegisterDto, hashedPassword: string, language?: string) {
    // Normalize email to lowercase for case-insensitive uniqueness
    const normalizedEmail = dto.email.toLowerCase().trim();

    const sagaId = await this.sagaOrchestrator.createSaga('USER_REGISTRATION', [
      {
        stepId: 'CREATE_USER',
        service: 'users',
        action: 'CREATE_LOCAL',
        payload: {
          email: normalizedEmail,
          username: dto.username || null,
          password: hashedPassword,
          firstName: dto.firstName || null,
          lastName: dto.lastName || null,
          role: UserRole.CITIZEN,
        },
        compensation: {
          action: 'DELETE_USER',
          payload: { userId: '{{result.id}}' },
        },
      },
      {
        stepId: 'ASSIGN_CITY',
        service: 'core',
        action: 'CREATE_USER_CITY_ASSIGNMENT',
        payload: {
          userId: '{{steps.CREATE_USER.result.id}}',
          cityId: dto.cityId,
          role: UserRole.CITIZEN,
        },
        compensation: {
          action: 'REMOVE_USER_CITY_ASSIGNMENT',
          payload: {
            userId: '{{steps.CREATE_USER.result.id}}',
            cityId: dto.cityId,
          },
        },
      },
    ]);

    try {
      // Step 1: Create user (local operation)
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          username: dto.username || null,
          password: hashedPassword,
          firstName: dto.firstName || null,
          lastName: dto.lastName || null,
          salutationCode: dto.salutationCode || null,
          hasVehicle: dto.hasVehicle ?? false,
          role: UserRole.CITIZEN,
          emailVerified: false,
        },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          salutationCode: true,
          hasVehicle: true,
          createdAt: true,
        },
      });

      const step1Result = await this.sagaOrchestrator.executeStep(sagaId, user);
      if (step1Result.completed) {
        throw new Error('Unexpected saga completion after step 1');
      }

      // Step 2: Assign city via core service
      if (!dto.cityId) {
        throw new Error('City ID is required for city assignment');
      }

      try {
        await firstValueFrom(
          this.client
            .send<
              { id: string; userId: string; cityId: string },
              { userId: string; cityId: string; role: UserRole }
            >(RabbitMQPatterns.CORE_CREATE_USER_CITY_ASSIGNMENT, {
              userId: user.id,
              cityId: dto.cityId,
              role: UserRole.CITIZEN,
            })
            .pipe(timeout(10000)),
        );

        await this.sagaOrchestrator.executeStep(sagaId, { success: true });
      } catch (error) {
        // Step 2 failed - compensate
        this.logger.error(`City assignment failed for user ${user.id}, compensating...`, error);
        await this.sagaOrchestrator.failStep(sagaId, error.message);

        // Compensate: Delete user
        const compensationSteps = await this.sagaOrchestrator.compensate(sagaId);
        for (const compStep of compensationSteps) {
          if (compStep.stepId === 'CREATE_USER') {
            // Delete the created user
            await this.prisma.user.delete({ where: { id: user.id } });
          }
        }

        await this.sagaOrchestrator.markCompensated(sagaId);
        throw new ConflictException('Failed to assign city. User registration rolled back.');
      }

      // Emit user created event
      this.client.emit(RabbitMQPatterns.USER_CREATED, {
        userId: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        cityId: dto.cityId || null, // Include cityId if provided
        timestamp: new Date().toISOString(),
        preferredLanguage: language,
      });

      this.logger.log(`User registered successfully with city assignment: ${user.id}`);
      return user;
    } catch (error) {
      // If it's already been handled by compensation, rethrow
      if (error instanceof ConflictException) {
        throw error;
      }

      // Unexpected error - try to compensate
      this.logger.error(`User registration failed: ${error.message}`, error);
      await this.sagaOrchestrator.failStep(sagaId, error.message);
      throw error;
    }
  }

  async findAll(filterDto?: UserFilterDto) {
    const page = filterDto?.page && filterDto.page > 0 ? filterDto.page : 1;
    const limitCandidate = filterDto?.limit && filterDto.limit > 0 ? filterDto.limit : 10;
    const limit = Math.min(limitCandidate, 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      userType: UserType.REGISTERED,
    };

    // Build AND conditions array for combining filters
    const andConditions: any[] = [];

    // Handle isActive filter - convert string to boolean if needed
    // Query parameters come as strings, so we need to parse them
    let isActiveValue: boolean | undefined = undefined;

    // Get the raw value from filterDto
    const rawIsActive = filterDto?.isActive;

    if (rawIsActive !== undefined && rawIsActive !== null && rawIsActive !== '') {
      if (typeof rawIsActive === 'string') {
        const lowerValue = rawIsActive.toLowerCase().trim();
        if (lowerValue === 'true') {
          isActiveValue = true;
        } else if (lowerValue === 'false') {
          isActiveValue = false;
        }
        // If it's a string but not 'true' or 'false', keep as undefined
      } else if (typeof rawIsActive === 'boolean') {
        isActiveValue = rawIsActive;
      } else if (typeof rawIsActive === 'number') {
        isActiveValue = rawIsActive !== 0;
      }
    }

    // Apply isActive filter
    // By default, show both active and deleted users
    // If isActive is explicitly true, show only active and not deleted
    // If isActive is explicitly false, show only inactive/deleted
    if (isActiveValue === true) {
      // Only active and not deleted users
      andConditions.push({
        isActive: true,
        deletedAt: null,
      });
    } else if (isActiveValue === false) {
      // Only inactive/deleted users
      andConditions.push({
        OR: [{ isActive: false }, { deletedAt: { not: null } }],
      });
    }
    // If isActive is undefined/null, don't filter by isActive or deletedAt (show all)

    // Add search functionality
    if (filterDto?.search) {
      const searchTerm = filterDto.search.trim();
      andConditions.push({
        OR: [
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { username: { contains: searchTerm, mode: 'insensitive' } },
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    // Combine all conditions with AND if we have any
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (filterDto?.sortBy) {
      orderBy[filterDto.sortBy] = filterDto.sortDirection || UserSortDirection.DESC;
    } else {
      // Default sorting by createdAt descending
      orderBy.createdAt = UserSortDirection.DESC;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          salutationCode: true,
          hasVehicle: true,
          isActive: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Convert role to number for each user (like login API does)
    const usersWithNumberRole = users.map((user) => ({
      ...user,
      role: roleToNumber(user.role),
    }));

    return {
      users: usersWithNumberRole,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Find users by city ID
   */
  async findByCity(cityId: string, page = 1, limit = 100) {
    const effectivePage = page > 0 ? page : 1;
    const effectiveLimit = Math.min(limit > 0 ? limit : 100, 100);
    const skip = (effectivePage - 1) * effectiveLimit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          cityId,
          isActive: true,
          deletedAt: null,
          userType: UserType.REGISTERED,
        },
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          salutationCode: true,
          hasVehicle: true,
          cityId: true,
          preferredLanguage: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({
        where: {
          cityId,
          isActive: true,
          deletedAt: null,
          userType: UserType.REGISTERED,
        },
      }),
    ]);

    return {
      users,
      total,
      page: effectivePage,
      limit: effectiveLimit,
      pages: Math.ceil(total / effectiveLimit),
    };
  }

  /**
   * Find all active users (paginated)
   */
  async findAllActive(page = 1, limit = 100) {
    const effectivePage = page > 0 ? page : 1;
    const effectiveLimit = Math.min(limit > 0 ? limit : 100, 100);
    const skip = (effectivePage - 1) * effectiveLimit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          userType: UserType.REGISTERED,
        },
        skip,
        take: effectiveLimit,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          firstName: true,
          lastName: true,
          salutationCode: true,
          hasVehicle: true,
          cityId: true,
          preferredLanguage: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.user.count({
        where: {
          isActive: true,
          deletedAt: null,
          userType: UserType.REGISTERED,
        },
      }),
    ]);

    return {
      users,
      total,
      page: effectivePage,
      limit: effectiveLimit,
      pages: Math.ceil(total / effectiveLimit),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        userType: true,
        deviceId: true,
        devicePlatform: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        cityId: true,
        preferredLanguage: true,
        notificationsEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    // Convert role to number (like login API does)
    return {
      ...user,
      role: roleToNumber(user.role),
    };
  }

  /**
   * Find user by email (for internal/RabbitMQ use)
   * Returns user with password for authentication purposes
   * Uses case-insensitive lookup for backward compatibility with existing mixed-case emails
   */
  async findByEmail(email: string) {
    // Normalize email to lowercase for case-insensitive lookup
    const normalizedEmail = email.toLowerCase().trim();
    // Use findFirst with case-insensitive mode to support existing mixed-case emails
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find user by username (for internal/RabbitMQ use)
   * Returns user with password for authentication purposes
   */
  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        role: true,
        firstName: true,
        lastName: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(dto: CreateUserDto, language?: string) {
    // Normalize email to lowercase for case-insensitive uniqueness
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if user already exists by email (case-insensitive lookup for backward compatibility)
    const existingUserByEmail = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingUserByEmail) {
      throw new ConflictException({ errorCode: ErrorCode.DUPLICATE_EMAIL });
    }

    const user = await this.prisma.user.create({
      data: {
        ...dto,
        email: normalizedEmail,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        createdAt: true,
      },
    });

    this.client.emit(RabbitMQPatterns.USER_CREATED, {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString(),
      preferredLanguage: language,
    });

    this.logger.log(`User created: ${user.id}`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Check existence

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        updatedAt: true,
      },
    });

    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User updated: ${id}`);
    return user;
  }

  async delete(id: string) {
    await this.findOne(id); // Check existence

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.client.emit(RabbitMQPatterns.USER_DELETED, {
      userId: id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User deleted: ${id}`);
    return { message: 'User deleted successfully' };
  }

  /**
   * Restore a deleted/inactive user (Super Admin only)
   */
  async restore(id: string) {
    // Find user including deleted ones
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        deletedAt: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ errorCode: ErrorCode.AUTH_USER_NOT_FOUND });
    }

    // Check if user is already active and not deleted
    if (user.isActive && !user.deletedAt) {
      throw new BadRequestException({ errorCode: ErrorCode.USER_ALREADY_ACTIVE });
    }

    // Restore user (set deletedAt to null and isActive to true)
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });

    // Emit user updated event
    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: id,
      action: 'USER_RESTORED',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User restored: ${id}`);
    return { message: 'User restored successfully' };
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string) {
    this.logger.log(`Getting profile for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        profilePhotoUrl: true,
        preferredLanguage: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get city assignments from core service via RabbitMQ
    const cityAssignments = await firstValueFrom(
      this.client
        .send<
          Array<{ cityId: string; role: UserRole; canManageAdmins: boolean; createdAt: Date }>,
          { userId: string }
        >(RabbitMQPatterns.CORE_GET_USER_ASSIGNMENTS, { userId })
        .pipe(timeout(10000)),
    );

    return {
      ...user,
      role: roleToNumber(user.role),
      cityAssignments: cityAssignments.map((assignment) => ({
        ...assignment,
        role: roleToNumber(assignment.role),
      })),
    };
  }

  /**
   * Update current user profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    this.logger.log(`Updating profile for user: ${userId}`);

    // Validate preferredLanguage if provided
    if (dto.preferredLanguage) {
      const supportedLanguages = this.i18nService.getSupportedLanguages();
      if (!supportedLanguages.includes(dto.preferredLanguage)) {
        throw new BadRequestException(
          `Unsupported language: ${dto.preferredLanguage}. Supported languages: ${supportedLanguages.join(', ')}`,
        );
      }
    }

    const updateData: any = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.salutationCode !== undefined) updateData.salutationCode = dto.salutationCode;
    if (dto.hasVehicle !== undefined) updateData.hasVehicle = dto.hasVehicle;
    if (dto.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = dto.profilePhotoUrl;
    if (dto.preferredLanguage !== undefined) updateData.preferredLanguage = dto.preferredLanguage;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        profilePhotoUrl: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });

    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Profile updated for user: ${userId}`);
    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    this.logger.log(`Changing password for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Guest users don't have passwords
    if (!user.password) {
      throw new UnauthorizedException('Guest users cannot change password. Please register first.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Password changed for user: ${userId}`);
    return { message: 'Password changed successfully' };
  }

  /**
   * Create a new guest user
   * Checks for existing guest with same deviceId and devicePlatform to prevent duplicates
   */
  async createGuest(
    deviceId: string,
    devicePlatform: DevicePlatform,
    _deviceMetadata?: Record<string, any>,
  ) {
    this.logger.log(`Creating guest user for device: ${deviceId} (${devicePlatform})`);

    // Check if guest already exists for this device
    const existingGuest = await this.prisma.user.findFirst({
      where: {
        deviceId,
        devicePlatform,
        userType: UserType.GUEST,
        deletedAt: null,
      },
    });

    if (existingGuest) {
      this.logger.log(
        `Guest user already exists for device: ${deviceId}, returning existing guest`,
      );
      return {
        id: existingGuest.id,
        guestId: existingGuest.guestId,
        deviceId: existingGuest.deviceId,
        devicePlatform: existingGuest.devicePlatform,
        userType: existingGuest.userType,
        createdAt: existingGuest.createdAt,
      };
    }

    // Generate unique guest ID
    const guestId = `guest_${deviceId}_${Date.now()}`;

    // Create new guest user
    const guestUser = await this.prisma.user.create({
      data: {
        guestId,
        deviceId,
        devicePlatform,
        userType: UserType.GUEST,
        role: UserRole.CITIZEN,
        email: null,
        username: null,
        password: null,
        isActive: true,
      },
      select: {
        id: true,
        guestId: true,
        deviceId: true,
        devicePlatform: true,
        userType: true,
        createdAt: true,
      },
    });

    // Emit user created event
    this.client.emit(RabbitMQPatterns.USER_CREATED, {
      userId: guestUser.id,
      userType: 'GUEST',
      deviceId,
      devicePlatform,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Guest user created successfully: ${guestUser.id}`);

    return guestUser;
  }

  /**
   * Find guest user by device ID and platform
   * Used for session restoration when app reopens
   */
  async findByDeviceId(deviceId: string, devicePlatform: DevicePlatform) {
    this.logger.log(`Finding guest user by device: ${deviceId} (${devicePlatform})`);

    const guestUser = await this.prisma.user.findFirst({
      where: {
        deviceId,
        devicePlatform,
        userType: UserType.GUEST,
        deletedAt: null,
      },
      select: {
        id: true,
        guestId: true,
        deviceId: true,
        devicePlatform: true,
        userType: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return guestUser;
  }

  /**
   * Convert guest user to registered user
   * All data linked by userId automatically transfers (favorites, listings, etc.)
   */
  async convertGuestToUser(guestUserId: string, dto: RegisterDto) {
    this.logger.log(`Converting guest user to registered: ${guestUserId}`);

    // Validate required fields (only email and password are required)
    if (!dto.email || !dto.password) {
      throw new ConflictException({ errorCode: ErrorCode.REGISTRATION_FIELDS_REQUIRED });
    }

    // Get guest user
    const guestUser = await this.prisma.user.findUnique({
      where: { id: guestUserId },
    });

    if (!guestUser) {
      throw new NotFoundException('Guest user not found');
    }

    if (guestUser.userType !== UserType.GUEST) {
      throw new ConflictException('User is not a guest user');
    }

    // Normalize email to lowercase for case-insensitive uniqueness
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if email already exists (case-insensitive lookup for backward compatibility)
    const existingUserByEmail = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingUserByEmail) {
      throw new ConflictException({ errorCode: ErrorCode.DUPLICATE_EMAIL });
    }

    // Check if username already exists (only if username is provided)
    if (dto.username) {
      const existingUserByUsername = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });

      if (existingUserByUsername) {
        throw new ConflictException({ errorCode: ErrorCode.DUPLICATE_USERNAME });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Update user record (same userId, so data auto-migrates)
    const registeredUser = await this.prisma.user.update({
      where: { id: guestUserId },
      data: {
        email: normalizedEmail,
        username: dto.username || null,
        password: hashedPassword,
        firstName: dto.firstName || null,
        lastName: dto.lastName || null,
        salutationCode: dto.salutationCode || null,
        hasVehicle: dto.hasVehicle ?? false,
        userType: UserType.REGISTERED,
        emailVerified: false,
        migratedFromGuestId: guestUser.guestId, // Store original guest ID for historical tracking
        guestId: null, // Clear guestId since user is no longer a guest
        // Keep deviceId and devicePlatform for reference, but can be cleared if needed
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        userType: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        migratedFromGuestId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Emit user created event (since this is effectively a new registration)
    this.client.emit(RabbitMQPatterns.USER_CREATED, {
      userId: registeredUser.id,
      email: registeredUser.email,
      firstName: registeredUser.firstName,
      lastName: registeredUser.lastName,
      timestamp: new Date().toISOString(),
    });

    // Also emit user updated event for tracking
    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: registeredUser.id,
      action: 'GUEST_TO_USER_CONVERSION',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Guest user converted to registered user successfully: ${registeredUser.id}`);
    return registeredUser;
  }

  /**
   * Mark user's email as verified
   */
  async markEmailAsVerified(userId: string) {
    this.logger.log(`Marking email as verified for user: ${userId}`);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    // Emit user updated event
    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: user.id,
      action: 'EMAIL_VERIFIED',
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Email verified for user: ${userId}`);
    return user;
  }

  /**
   * Request password reset - sends email with reset link
   */
  async requestPasswordReset(email: string, language?: string) {
    this.logger.log(`Password reset requested for email: ${email}`);

    // Translate the message using i18nService
    const message =
      this.i18nService.translate('success.PASSWORD_RESET_IF_EXISTS', undefined, language) ||
      'If an account with that email exists, a password reset link has been sent.';

    // Find user by email
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not (security best practice)
      this.logger.warn(`Password reset requested for non-existent email: ${email}`);
      return { message };
    }

    // Emit password reset requested event
    this.client.emit(RabbitMQPatterns.PASSWORD_RESET_REQUESTED, {
      userId: user.id,
      email: user.email,
      metadata: {
        firstName: user.firstName,
        lastName: user.lastName,
        preferredLanguage: language,
      },
    });

    this.logger.log(`Password reset email queued for user: ${user.id}`);
    return { message };
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string, _language?: string) {
    this.logger.log(`Password reset attempt with token`);

    // Verify token via notification service
    let tokenData;
    try {
      tokenData = await firstValueFrom(
        this.client
          .send<{
            valid: boolean;
            userId: string;
            email: string;
            resetTokenId: string;
          }>(RabbitMQPatterns.PASSWORD_RESET_VERIFY, { token })
          .pipe(timeout(10000)),
      );
    } catch (error) {
      this.logger.error('Failed to verify password reset token', error);
      throw new BadRequestException('Invalid or expired password reset token');
    }

    if (!tokenData || !tokenData.valid) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.prisma.user.update({
      where: { id: tokenData.userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    this.client.emit(RabbitMQPatterns.PASSWORD_RESET_MARK_USED, {
      token,
    });

    // Emit password reset completed event
    this.client.emit(RabbitMQPatterns.PASSWORD_RESET_COMPLETED, {
      userId: tokenData.userId,
      email: tokenData.email,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Password reset completed for user: ${tokenData.userId}`);
    return {
      message: 'Password has been reset successfully',
    };
  }

  /**
   * Update user role
   * Used when assigning city admin or updating roles via core service
   */
  async updateUserRole(userId: string, role: string, updatedBy?: string) {
    this.logger.log(`Updating user role: userId=${userId}, role=${role}, updatedBy=${updatedBy}`);

    // Normalize role
    const normalizedRole = role.toUpperCase() as UserRole;

    // Verify user exists
    await this.findOne(userId);

    // Update user role
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: normalizedRole },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        firstName: true,
        lastName: true,
        salutationCode: true,
        hasVehicle: true,
        updatedAt: true,
      },
    });

    // Emit user updated event
    this.client.emit(RabbitMQPatterns.USER_UPDATED, {
      userId: user.id,
      action: 'ROLE_UPDATED',
      newRole: normalizedRole,
      updatedBy,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`User role updated successfully: userId=${userId}, newRole=${normalizedRole}`);
    return {
      success: true,
      user,
    };
  }

  /**
   * Get all active devices for a user
   * @param userId - The user ID to get devices for
   * @param includeToken - Whether to include FCM token (only for internal service calls)
   */
  async getDevices(userId: string, includeToken: boolean = false) {
    this.logger.log(`Getting devices for userId: ${userId} (includeToken: ${includeToken})`);

    const devices = await this.prisma.userDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });

    return devices.map((device) => ({
      id: device.id,
      deviceId: device.deviceId,
      platform: device.platform,
      appVersion: device.appVersion,
      osVersion: device.osVersion,
      language: device.language,
      cityId: device.cityId,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
      // Include FCM token only for internal service calls (not exposed in public API)
      ...(includeToken && device.fcmToken ? { fcmToken: device.fcmToken } : {}),
    }));
  }

  /**
   * Register or update a device for a user
   */
  async registerDevice(
    userId: string,
    data: {
      deviceId?: string;
      fcmToken: string;
      platform: DevicePlatform;
      appVersion?: string;
      osVersion?: string;
      language?: string;
      cityId?: string;
    },
  ) {
    this.logger.log(`Registering device for userId: ${userId}, platform: ${data.platform}`);

    // Check if device with this FCM token already exists
    const existingByToken = await this.prisma.userDevice.findUnique({
      where: { fcmToken: data.fcmToken },
    });

    // If token exists (for same user or different user), reuse the same row
    if (existingByToken) {
      // Reuse the existing row - transfer ownership to new user if needed
      const device = await this.prisma.userDevice.update({
        where: { fcmToken: data.fcmToken },
        data: {
          userId, // Transfer ownership to the new user
          deviceId: data.deviceId || existingByToken.deviceId,
          platform: data.platform,
          appVersion: data.appVersion,
          osVersion: data.osVersion,
          language: data.language,
          cityId: data.cityId,
          isActive: true,
          lastSeenAt: new Date(),
        },
      });

      this.logger.log(`Device registered (reused existing): ${device.id}`);
      return {
        id: device.id,
        deviceId: device.deviceId,
        platform: device.platform,
        appVersion: device.appVersion,
        osVersion: device.osVersion,
        language: device.language,
        cityId: device.cityId,
        lastSeenAt: device.lastSeenAt,
        createdAt: device.createdAt,
      };
    }

    // If deviceId provided, check for existing device with same deviceId (for ANY user)
    // This handles the case where a different user logs in on the same physical device
    let existingByDeviceId: { id: string; userId: string } | null = null;
    if (data.deviceId) {
      const found = await this.prisma.userDevice.findFirst({
        where: {
          deviceId: data.deviceId,
        },
        select: {
          id: true,
          userId: true,
        },
      });
      existingByDeviceId = found;
    }

    // Determine which device to update/create
    let device;
    if (existingByDeviceId) {
      // Update existing device - transfer ownership to new user if needed
      device = await this.prisma.userDevice.update({
        where: { id: existingByDeviceId.id },
        data: {
          userId, // Transfer ownership to new user
          fcmToken: data.fcmToken,
          platform: data.platform,
          appVersion: data.appVersion,
          osVersion: data.osVersion,
          language: data.language,
          cityId: data.cityId,
          isActive: true,
          lastSeenAt: new Date(),
        },
      });

      if (existingByDeviceId.userId !== userId) {
        this.logger.log(
          `Device ${data.deviceId} transferred from user ${existingByDeviceId.userId} to user ${userId}`,
        );
      }
    } else {
      // Create new device
      device = await this.prisma.userDevice.create({
        data: {
          userId,
          deviceId: data.deviceId,
          fcmToken: data.fcmToken,
          platform: data.platform,
          appVersion: data.appVersion,
          osVersion: data.osVersion,
          language: data.language,
          cityId: data.cityId,
          isActive: true,
          lastSeenAt: new Date(),
        },
      });
    }

    this.logger.log(`Device registered: ${device.id}`);
    return {
      id: device.id,
      deviceId: device.deviceId,
      platform: device.platform,
      appVersion: device.appVersion,
      osVersion: device.osVersion,
      language: device.language,
      cityId: device.cityId,
      lastSeenAt: device.lastSeenAt,
      createdAt: device.createdAt,
    };
  }

  /**
   * Delete (deactivate) a device
   * Accepts either the database id or the client deviceId
   */
  async deleteDevice(userId: string, deviceId: string) {
    this.logger.log(`Deleting device for userId: ${userId}, deviceId: ${deviceId}`);

    // Try to find by client deviceId first (most common case)
    let device = await this.prisma.userDevice.findFirst({
      where: {
        deviceId,
        userId,
      },
    });

    // If not found by deviceId, try by database id (for backward compatibility)
    if (!device) {
      device = await this.prisma.userDevice.findFirst({
        where: {
          id: deviceId,
          userId,
        },
      });
    }

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    await this.prisma.userDevice.update({
      where: { id: device.id },
      data: { isActive: false },
    });

    this.logger.log(`Device deactivated: ${device.id}`);
    return { success: true };
  }

  /**
   * Get all topic subscriptions for a user
   */
  async getTopicSubscriptions(userId: string) {
    this.logger.log(`Getting topic subscriptions for userId: ${userId}`);

    const subscriptions = await this.prisma.userTopicSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return subscriptions.map((sub) => ({
      id: sub.id,
      topicKey: sub.topicKey,
      cityId: sub.cityId,
      createdAt: sub.createdAt,
    }));
  }

  /**
   * Subscribe user to a topic
   */
  async subscribeTopic(
    userId: string,
    data: {
      topicKey: string;
      cityId?: string;
    },
  ) {
    this.logger.log(`Subscribing user ${userId} to topic: ${data.topicKey}`);

    const subscription = await this.prisma.userTopicSubscription.upsert({
      where: {
        userId_topicKey: {
          userId,
          topicKey: data.topicKey,
        },
      },
      update: {
        cityId: data.cityId,
        isActive: true,
      },
      create: {
        userId,
        topicKey: data.topicKey,
        cityId: data.cityId,
        isActive: true,
      },
    });

    this.logger.log(`Topic subscription created/updated: ${subscription.id}`);
    return {
      id: subscription.id,
      topicKey: subscription.topicKey,
      cityId: subscription.cityId,
      createdAt: subscription.createdAt,
    };
  }

  /**
   * Unsubscribe user from a topic
   */
  async unsubscribeTopic(userId: string, topicKey: string) {
    this.logger.log(`Unsubscribing user ${userId} from topic: ${topicKey}`);

    const subscription = await this.prisma.userTopicSubscription.findUnique({
      where: {
        userId_topicKey: {
          userId,
          topicKey,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Topic subscription not found');
    }

    await this.prisma.userTopicSubscription.update({
      where: {
        userId_topicKey: {
          userId,
          topicKey,
        },
      },
      data: { isActive: false },
    });

    this.logger.log(`Topic subscription deactivated: ${topicKey}`);
    return { success: true };
  }

  /**
   * Get available salutations by language/locale
   */
  async getSalutations(locale?: string) {
    const effectiveLocale = locale || 'en';
    this.logger.log(`Getting salutations for locale: ${effectiveLocale}`);

    const salutations = await this.prisma.salutation.findMany({
      where: {
        locale: effectiveLocale,
        isActive: true,
      },
      select: {
        code: true,
        label: true,
        locale: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // If no salutations found for the locale, fallback to English
    if (salutations.length === 0 && effectiveLocale !== 'en') {
      this.logger.warn(
        `No salutations found for locale: ${effectiveLocale}, falling back to English`,
      );
      return this.prisma.salutation.findMany({
        where: {
          locale: 'en',
          isActive: true,
        },
        select: {
          code: true,
          label: true,
          locale: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });
    }

    return salutations;
  }

  /**
   * Get user preferences (notifications, language, newsletter status)
   */
  async getPreferences(userId: string): Promise<{
    userId: string;
    newsletterSubscription: any | null;
    notificationsEnabled: boolean;
    preferredLanguage: string | null;
    updatedAt: string;
  }> {
    this.logger.log(`Getting preferences for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notificationsEnabled: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ errorCode: 'AUTH_USER_NOT_FOUND' });
    }

    // Newsletter subscription status would need to be fetched from integration service
    // For now, return null as we don't have a GET endpoint for it
    return {
      userId: user.id,
      newsletterSubscription: null,
      notificationsEnabled: user.notificationsEnabled ?? true,
      preferredLanguage: user.preferredLanguage ?? null,
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  /**
   * Permanently delete the current user's account
   * This is an irreversible operation that removes all user data
   */
  async permanentDeleteAccount(userId: string) {
    this.logger.log(`Permanently deleting account for user: ${userId}`);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ errorCode: ErrorCode.AUTH_USER_NOT_FOUND });
    }

    // Delete all related data in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete user devices
      await tx.userDevice.deleteMany({
        where: { userId },
      });

      // Delete topic subscriptions
      await tx.userTopicSubscription.deleteMany({
        where: { userId },
      });

      // Permanently delete the user
      await tx.user.delete({
        where: { id: userId },
      });
    });

    // Emit user deleted event
    this.client.emit(RabbitMQPatterns.USER_DELETED, {
      userId,
      email: user.email,
      permanent: true,
      timestamp: new Date().toISOString(),
    });

    this.logger.log(`Account permanently deleted for user: ${userId}`);
    return { message: 'Account permanently deleted successfully' };
  }

  /**
   * Update user preferences (newsletter subscription, notification preferences, and/or language)
   */
  async updatePreferences(
    userId: string,
    email: string,
    dto: UpdatePreferencesDto,
  ): Promise<{
    userId: string;
    newsletterSubscription: any | null;
    notificationsEnabled: boolean;
    preferredLanguage: string | null;
    updatedAt: string;
  }> {
    this.logger.log(`Updating preferences for user: ${userId}`);

    // Check if user exists and get email for newsletter subscription
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!existingUser) {
      throw new NotFoundException({ errorCode: 'AUTH_USER_NOT_FOUND' });
    }

    // Use email from database if not provided (JWT might not have it)
    const userEmail = email || existingUser.email;

    const newsletterSubscription: any | null = null;
    let notificationsEnabled: boolean | undefined = undefined;
    let preferredLanguage: string | null | undefined = undefined;

    // Handle newsletter subscription if provided
    if (dto.newsletterSubscribed !== undefined) {
      if (dto.newsletterSubscribed) {
        // Validate email exists for newsletter subscription
        if (!userEmail) {
          throw new BadRequestException(
            'Email is required for newsletter subscription. Please update your profile with an email address first.',
          );
        }

        // Newsletter subscription is not available in this deployment
        throw new ServiceUnavailableException({
          errorCode: 'NEWSLETTER_NOT_AVAILABLE',
          message: 'Newsletter subscription is not available.',
        });
      } else {
        // Unsubscribe from newsletter (if needed in the future)
        this.logger.log(`Newsletter unsubscribe requested for user: ${userId}`);
        // Note: Unsubscribe functionality can be added later if needed
      }
    }

    // Build update data object
    const updateData: any = {};

    // Handle notification preferences if provided
    if (dto.notificationsEnabled !== undefined) {
      updateData.notificationsEnabled = dto.notificationsEnabled;
    }

    // Handle language preference if provided
    if (dto.preferredLanguage !== undefined) {
      // Validate language
      const supportedLanguages = this.i18nService.getSupportedLanguages();
      if (!supportedLanguages.includes(dto.preferredLanguage)) {
        throw new BadRequestException(
          `Unsupported language: ${dto.preferredLanguage}. Supported languages: ${supportedLanguages.join(', ')}`,
        );
      }
      updateData.preferredLanguage = dto.preferredLanguage;
    }

    // Update user if there are any database fields to update
    if (Object.keys(updateData).length > 0) {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          notificationsEnabled: true,
          preferredLanguage: true,
          updatedAt: true,
        },
      });

      notificationsEnabled = user.notificationsEnabled;
      preferredLanguage = user.preferredLanguage;

      // Emit user updated event
      this.client.emit(RabbitMQPatterns.USER_UPDATED, {
        userId: user.id,
        action: 'PREFERENCES_UPDATED',
        notificationsEnabled: user.notificationsEnabled,
        preferredLanguage: user.preferredLanguage,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get current preferences if not being updated
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          notificationsEnabled: true,
          preferredLanguage: true,
          updatedAt: true,
        },
      });

      if (user) {
        notificationsEnabled = user.notificationsEnabled;
        preferredLanguage = user.preferredLanguage;
      }
    }

    // Get updated user to get the latest updatedAt timestamp
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notificationsEnabled: true,
        preferredLanguage: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException({ errorCode: 'AUTH_USER_NOT_FOUND' });
    }

    this.logger.log(`Preferences updated for user: ${userId}`);
    return {
      userId: user.id,
      newsletterSubscription,
      notificationsEnabled: notificationsEnabled ?? user.notificationsEnabled ?? true,
      preferredLanguage: preferredLanguage ?? user.preferredLanguage ?? null,
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
