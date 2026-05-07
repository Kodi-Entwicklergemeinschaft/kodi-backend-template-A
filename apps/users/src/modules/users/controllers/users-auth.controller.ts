import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import {
  RegisterDto,
  RegisterResponseDto,
  ValidationErrorResponseDto,
  GuestValidationErrorResponseDto,
  ConflictErrorResponseDto,
  NotFoundErrorResponseDto,
  BadRequestErrorResponseDto,
  CreateGuestDto,
  ConvertGuestDto,
} from '@kodi/contracts';
import { Public, JwtAuthGuard } from '@kodi/jwt';
import { GetLanguage } from '@kodi/i18n';
import { AdminOnlyGuard } from '@kodi/rbac';

@ApiTags('Users - Auth')
@Controller()
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
export class UsersAuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @Public()
  @ApiOperation({
    summary: 'Register new user',
    description: 'Create a new user account (public endpoint)',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User already exists',
    type: ConflictErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto, @GetLanguage() language: string) {
    return this.usersService.register(dto, language);
  }

  @Post('guest')
  @Public()
  @ApiOperation({
    summary: 'Create guest user (internal)',
    description:
      'Create a new guest user for mobile device (internal endpoint, typically called by auth service)',
  })
  @ApiBody({ type: CreateGuestDto })
  @ApiResponse({
    status: 201,
    description: 'Guest user created or retrieved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: GuestValidationErrorResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async createGuest(@Body() dto: CreateGuestDto) {
    return this.usersService.createGuest(dto.deviceId, dto.devicePlatform, dto.deviceMetadata);
  }

  @Post('guest/convert')
  @Public()
  @ApiOperation({
    summary: 'Convert guest to registered user',
    description:
      'Convert a guest user account to a registered user account with automatic data migration',
  })
  @ApiBody({ type: ConvertGuestDto })
  @ApiResponse({
    status: 200,
    description: 'Guest user converted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation failed',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Guest user not found',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email or username already exists',
    type: ConflictErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async convertGuest(@Body() dto: ConvertGuestDto) {
    return this.usersService.convertGuestToUser(dto.guestUserId, {
      email: dto.email,
      username: dto.username,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      cityId: dto.cityId,
    });
  }

  @Post('reset-password/request')
  @Public()
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Request a password reset email to be sent',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent (if account exists)',
  })
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() body: { email: string }, @GetLanguage() language: string) {
    return this.usersService.requestPasswordReset(body.email, language);
  }

  @Post('reset-password/confirm')
  @Public()
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using the token from the email',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: { type: 'string' },
        newPassword: { type: 'string', minLength: 8 },
      },
      required: ['token', 'newPassword'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
    type: BadRequestErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() body: { token: string; newPassword: string },
    @GetLanguage() language: string,
  ) {
    return this.usersService.resetPassword(body.token, body.newPassword, language);
  }
}
