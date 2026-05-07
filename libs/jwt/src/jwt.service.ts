import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { LoggerService } from '@kodi/logger';
import { ConfigService } from '@kodi/config';
import { roleToNumber } from '@kodi/rbac';

export interface CityAssignment {
  cityId: string;
  role: number;
  canManageAdmins: boolean;
}

export interface TokenPayload {
  sub: string; // user id
  email?: string; // Optional for guest users
  role: number; // Role as number: 1=SUPER_ADMIN, 2=CITY_ADMIN, 3=CITIZEN
  type: 'access' | 'refresh';
  isGuest?: boolean; // Flag to indicate guest user
  deviceId?: string; // Device ID for guest users
  cityId?: string; // Current/selected city ID (for UI)
  cityIds?: string[]; // All city IDs user has access to (deprecated, use cityAssignments)
  selectedCityId?: string; // Currently selected city in UI
  cityAssignments?: CityAssignment[]; // User's city assignments with roles and permissions
  permissions?: string[]; // User permissions (e.g., ['users:read', 'cities:write'])
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class JwtTokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor(
    private readonly jwtService: NestJwtService,
    private readonly logger: LoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext(JwtTokenService.name);
    this.accessTokenSecret = this.configService.jwtSecret;
    this.refreshTokenSecret = this.configService.jwtRefreshSecret;
    this.accessTokenExpiry = this.configService.jwtExpiresIn;
    this.refreshTokenExpiry = this.configService.jwtRefreshExpiresIn;
  }

  /**
   * Generate access token
   */
  async generateAccessToken(
    userId: string,
    email: string | null,
    role: string | number,
    options?: {
      isGuest?: boolean;
      deviceId?: string;
      cityId?: string;
      cityIds?: string[];
      selectedCityId?: string;
      cityAssignments?: CityAssignment[];
      permissions?: string[];
    },
  ): Promise<string> {
    // Convert role to number if it's a string
    const roleNumber = typeof role === 'string' ? roleToNumber(role) : role;

    // Convert cityAssignments roles to numbers if needed
    const cityAssignments = options?.cityAssignments?.map((assignment) => ({
      ...assignment,
      role: typeof assignment.role === 'string' ? roleToNumber(assignment.role) : assignment.role,
    }));

    const payload: TokenPayload = {
      sub: userId,
      ...(email && { email }),
      role: roleNumber,
      type: 'access',
      ...(options?.isGuest && { isGuest: options.isGuest }),
      ...(options?.deviceId && { deviceId: options.deviceId }),
      ...(options?.cityId && { cityId: options.cityId }),
      ...(options?.cityIds && { cityIds: options.cityIds }),
      ...(options?.selectedCityId && { selectedCityId: options.selectedCityId }),
      ...(cityAssignments && { cityAssignments }),
      ...(options?.permissions && { permissions: options.permissions }),
    };

    return this.jwtService.sign(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiry as any,
    });
  }

  /**
   * Generate refresh token
   */
  async generateRefreshToken(
    userId: string,
    email: string | null,
    role: string | number,
    options?: {
      isGuest?: boolean;
      deviceId?: string;
      cityId?: string;
      cityIds?: string[];
      selectedCityId?: string;
      cityAssignments?: CityAssignment[];
      permissions?: string[];
    },
  ): Promise<string> {
    // Convert role to number if it's a string
    const roleNumber = typeof role === 'string' ? roleToNumber(role) : role;

    // Convert cityAssignments roles to numbers if needed
    const cityAssignments = options?.cityAssignments?.map((assignment) => ({
      ...assignment,
      role: typeof assignment.role === 'string' ? roleToNumber(assignment.role) : assignment.role,
    }));

    const payload: TokenPayload = {
      sub: userId,
      ...(email && { email }),
      role: roleNumber,
      type: 'refresh',
      ...(options?.isGuest && { isGuest: options.isGuest }),
      ...(options?.deviceId && { deviceId: options.deviceId }),
      ...(options?.cityId && { cityId: options.cityId }),
      ...(options?.cityIds && { cityIds: options.cityIds }),
      ...(options?.selectedCityId && { selectedCityId: options.selectedCityId }),
      ...(cityAssignments && { cityAssignments }),
      ...(options?.permissions && { permissions: options.permissions }),
    };

    return this.jwtService.sign(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiry as any,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  async generateTokenPair(
    userId: string,
    email: string | null,
    role: string | number,
    options?: {
      isGuest?: boolean;
      deviceId?: string;
      cityId?: string;
      cityIds?: string[];
      selectedCityId?: string;
      cityAssignments?: CityAssignment[];
      permissions?: string[];
    },
  ): Promise<TokenPair> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, role, options),
      this.generateRefreshToken(userId, email, role, options),
    ]);

    // Parse expiry time to seconds
    const expiresIn = this.parseExpiryToSeconds(this.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  /**
   * Verify access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.accessTokenSecret,
      });

      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      this.logger.error('Failed to verify access token', error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Verify refresh token
   */
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.refreshTokenSecret,
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      return payload;
    } catch (error) {
      this.logger.error('Failed to verify refresh token', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token: string): any {
    return this.jwtService.decode(token);
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900; // 15 minutes default
    }
  }
}
