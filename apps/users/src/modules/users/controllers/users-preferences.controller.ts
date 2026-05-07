import { Controller, Get, Patch, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { UsersService } from '../users.service';
import {
  UpdatePreferencesDto,
  UpdatePreferencesResponseDto,
  GetPreferencesResponseDto,
  UnauthorizedErrorResponseDto,
  NotFoundErrorResponseDto,
  BadRequestErrorResponseDto,
  ConflictErrorResponseDto,
} from '@kodi/contracts';
import { GetCurrentUser, JwtAuthGuard } from '@kodi/jwt';
import { AdminOnlyGuard } from '@kodi/rbac';
import { SuccessMessage } from '@kodi/interceptors';

@ApiTags('Users - Preferences')
@Controller('me/preferences')
@UseGuards(JwtAuthGuard, AdminOnlyGuard)
@ApiBearerAuth('JWT-auth')
export class UsersPreferencesController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @SuccessMessage('PREFERENCES_RETRIEVED')
  @ApiOperation({
    summary: 'Get user preferences',
    description:
      'Get all user preferences including notification preferences, preferred language, and newsletter subscription status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preferences retrieved successfully',
    type: GetPreferencesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: NotFoundErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async getPreferences(@GetCurrentUser('userId') userId: string) {
    const result = await this.usersService.getPreferences(userId);
    return {
      userId: result.userId,
      newsletterSubscription: result.newsletterSubscription,
      notificationsEnabled: result.notificationsEnabled,
      preferredLanguage: result.preferredLanguage,
      updatedAt: result.updatedAt,
    };
  }

  @Patch()
  @SuccessMessage('PREFERENCES_UPDATED')
  @ApiOperation({
    summary: 'Update user preferences',
    description:
      'Update user preferences including notification preferences, preferred language, and/or newsletter subscription. All fields are optional.',
  })
  @ApiBody({ type: UpdatePreferencesDto })
  @ApiResponse({
    status: 200,
    description: 'Preferences updated successfully',
    type: UpdatePreferencesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid language code or validation failed',
    type: BadRequestErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    type: UnauthorizedErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    type: NotFoundErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'User is already subscribed to the newsletter',
    type: ConflictErrorResponseDto,
  })
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @GetCurrentUser('userId') userId: string,
    @GetCurrentUser('email') email: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const result = await this.usersService.updatePreferences(userId, email, dto);
    return {
      userId: result.userId,
      newsletterSubscription: result.newsletterSubscription,
      notificationsEnabled: result.notificationsEnabled,
      preferredLanguage: result.preferredLanguage,
      updatedAt: result.updatedAt,
    };
  }
}
