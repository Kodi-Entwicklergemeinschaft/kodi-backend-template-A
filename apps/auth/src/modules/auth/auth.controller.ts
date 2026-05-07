import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import {
  LoginDto,
  LoginResponseDto,
  LoginUnauthorizedErrorResponseDto,
  RefreshTokenDto,
  RefreshTokenResponseDto,
  RefreshTokenUnauthorizedErrorResponseDto,
  AssignCityAdminDto,
  AssignCityAdminResponseDto,
  AuthForbiddenErrorResponseDto,
  AuthNotFoundErrorResponseDto,
  ValidateTokenResponseDto,
  AuthUnauthorizedErrorResponseDto,
  LogoutResponseDto,
  GetUserCitiesResponseDto,
  GetSessionsResponseDto,
  RevokeSessionResponseDto,
  SessionNotFoundErrorResponseDto,
  RevokeAllSessionsResponseDto,
  GuestLoginDto,
  GuestLoginResponseDto,
  ConvertGuestDto,
  ConvertGuestResponseDto,
  ValidationErrorResponseDto,
  ConflictErrorResponseDto,
  GuestValidationErrorResponseDto,
  EmailVerificationRequiredErrorResponseDto,
} from '@kodi/contracts';
import { Public, JwtAuthGuard, GetCurrentUser } from '@kodi/jwt';
import { SuperAdminOnly, AdminOnlyGuard } from '@kodi/rbac';
import { GetLanguage } from '@kodi/i18n';

@ApiTags('auth')
@Controller()
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'User login',
    description:
      "Authenticate user with email and password. If the user's email is not verified, a 403 response will be returned with instructions to verify the email. Use the 'rememberMe' field to extend session duration to 30 days (default is 7 days).",
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      emailLogin: {
        summary: 'Login with email',
        value: {
          email: 'user@example.com',
          password: 'password123',
        },
      },
      rememberMeLogin: {
        summary: 'Login with remember me enabled',
        value: {
          email: 'user@example.com',
          password: 'password123',
          rememberMe: true,
        },
        description:
          'When rememberMe is true, the session will be kept for 30 days instead of 7 days',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials - user not found, inactive, or incorrect password',
    type: LoginUnauthorizedErrorResponseDto,
    examples: {
      accountNotFound: {
        summary: 'Account not found',
        value: {
          errorCode: 'ACCOUNT_NOT_FOUND',
          message:
            'No account found with email address: user@example.com. Please check your email or register for a new account.',
          email: 'user@example.com',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/login',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 401,
        },
      },
      accountInactive: {
        summary: 'Account inactive',
        value: {
          errorCode: 'ACCOUNT_INACTIVE',
          message: 'Your account is inactive. Please contact support for assistance.',
          email: 'user@example.com',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/login',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 401,
        },
      },
      invalidCredentials: {
        summary: 'Invalid password',
        value: {
          errorCode: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password. Please check your credentials and try again.',
          email: 'user@example.com',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/login',
          method: 'POST',
          requestId: 'req_1234567890_abc123',
          statusCode: 401,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description:
      'Email verification required - user must verify their email address before logging in',
    type: EmailVerificationRequiredErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @GetLanguage() detectedLanguage?: string,
    @Req() req?: Request,
  ) {
    const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || req?.socket.remoteAddress;
    const userAgent = req?.headers['user-agent'];
    return this.authService.login(dto, detectedLanguage, ipAddress as string, userAgent);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description:
      'Log out the current user from the current device. To logout from all devices, use the revoke-all-sessions endpoint.',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: LogoutResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async logout(
    @GetCurrentUser('userId') userId: string,
    @GetCurrentUser('deviceId') deviceId: string,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.logout(userId, deviceId, ipAddress as string, userAgent);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using refresh token',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: RefreshTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: RefreshTokenUnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken, dto.deviceId);
  }

  @Post('validate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Validate token', description: 'Validate the current JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    type: ValidateTokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async validate(@GetCurrentUser() user: any) {
    return {
      valid: true,
      user,
    };
  }

  @Post('assign-city-admin')
  @SuperAdminOnly()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign city admin',
    description: 'Assign a user as admin for a specific city (Super Admin only)',
  })
  @ApiBody({
    type: AssignCityAdminDto,
    examples: {
      assignCityAdmin: {
        summary: 'Assign as City Admin',
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174001',
          cityId: '123e4567-e89b-12d3-a456-426614174002',
          role: 2, // CITY_ADMIN
        },
      },
      assignCitizen: {
        summary: 'Change back to Citizen',
        value: {
          userId: '123e4567-e89b-12d3-a456-426614174001',
          cityId: '123e4567-e89b-12d3-a456-426614174002',
          role: 3, // CITIZEN
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'City admin assigned successfully',
    type: AssignCityAdminResponseDto,
    content: {
      'application/json': {
        example: {
          success: true,
          data: {
            success: true,
            assignment: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              userId: '123e4567-e89b-12d3-a456-426614174001',
              cityId: '123e4567-e89b-12d3-a456-426614174002',
              role: 2,
              canManageAdmins: true,
              assignedBy: '123e4567-e89b-12d3-a456-426614174003',
              createdAt: '2024-01-01T00:00:00.000Z',
            },
          },
          message: 'City admin assigned successfully',
          timestamp: '2024-01-01T00:00:00.000Z',
          path: '/assign-city-admin',
          statusCode: 201,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
    type: AuthForbiddenErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User or city not found',
    type: AuthNotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async assignCityAdmin(@Body() dto: AssignCityAdminDto, @GetCurrentUser() user: any) {
    return this.authService.assignCityAdmin(dto, user.userId, user.role);
  }

  @Get('cities')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user cities',
    description: 'Get all cities assigned to the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user cities',
    type: GetUserCitiesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getUserCities(@GetCurrentUser('userId') userId: string) {
    return this.authService.getUserCities(userId);
  }

  @Get('sessions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user sessions',
    description: 'Get all active sessions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user sessions',
    type: GetSessionsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getSessions(@GetCurrentUser('userId') userId: string) {
    return this.authService.getSessions(userId);
  }

  @Post('sessions/:sessionId/revoke')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Revoke session', description: 'Revoke a specific session by ID' })
  @ApiParam({ name: 'sessionId', description: 'Session ID to revoke' })
  @ApiResponse({
    status: 200,
    description: 'Session revoked successfully',
    type: RevokeSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: SessionNotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @GetCurrentUser('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSession(userId, sessionId);
  }

  @Post('sessions/revoke-all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revoke all sessions',
    description: 'Revoke all active sessions for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions revoked successfully',
    type: RevokeAllSessionsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@GetCurrentUser('userId') userId: string) {
    return this.authService.revokeAllSessions(userId);
  }

  @Post('guest')
  @Public()
  @ApiOperation({
    summary: 'Create guest session',
    description:
      'Create or retrieve a guest user session for mobile app (iOS/Android). Uses native device identifiers (iOS IDFV, Android ID) that persist across app reinstalls.',
  })
  @ApiBody({ type: GuestLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Guest session created or retrieved successfully',
    type: GuestLoginResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: GuestValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async createGuest(@Body() dto: GuestLoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.createGuestSession(dto, ipAddress as string, userAgent);
  }

  @Post('guest/register')
  @Public()
  @ApiOperation({
    summary: 'Convert guest to registered user',
    description:
      'Convert a guest user account to a registered user account. All guest data (favorites, listings) is automatically migrated.',
  })
  @ApiBody({ type: ConvertGuestDto })
  @ApiResponse({
    status: 200,
    description: 'Guest converted to registered user successfully',
    type: ConvertGuestResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: GuestValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid guest user',
    type: AuthUnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists',
    type: ConflictErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async convertGuest(@Body() dto: ConvertGuestDto, @Req() req: Request) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.authService.convertGuestToRegistered(dto, ipAddress as string, userAgent);
  }
}
