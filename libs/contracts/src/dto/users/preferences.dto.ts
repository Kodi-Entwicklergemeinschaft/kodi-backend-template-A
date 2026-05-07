import { IsBoolean, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsletterSubscriptionDto } from '../integrations/newsletter-subscription-response.dto';

const SUPPORTED_LANGUAGES = ['de', 'en', 'dk', 'no', 'se', 'ar', 'fa', 'tr', 'ru', 'uk'] as const;

export class UpdatePreferencesDto {
  @ApiPropertyOptional({
    description: 'Subscribe or unsubscribe from newsletter',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  newsletterSubscribed?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user accepts push notifications for favorite event reminders',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Preferred language code (ISO 639-1)',
    example: 'de',
    enum: SUPPORTED_LANGUAGES,
  })
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LANGUAGES, {
    message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
  })
  preferredLanguage?: string;
}

// Data payload for preferences
export class PreferencesDataDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiPropertyOptional({
    description: 'Newsletter subscription information',
    type: NewsletterSubscriptionDto,
  })
  newsletterSubscription?: NewsletterSubscriptionDto | null;

  @ApiProperty({
    description: 'Whether push notifications are enabled for favorite event reminders',
    example: true,
    type: Boolean,
  })
  notificationsEnabled: boolean;

  @ApiPropertyOptional({
    description: 'Preferred language code (ISO 639-1)',
    example: 'de',
    enum: SUPPORTED_LANGUAGES,
  })
  preferredLanguage?: string | null;

  @ApiProperty({
    description: 'Timestamp of last update',
    example: '2025-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}

// Full response wrapper for GET /me/preferences
export class GetPreferencesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PreferencesDataDto })
  data: PreferencesDataDto;

  @ApiProperty({
    example: 'Preferences retrieved successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/preferences' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

// Full response wrapper for PATCH /me/preferences
export class UpdatePreferencesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PreferencesDataDto })
  data: PreferencesDataDto;

  @ApiProperty({
    example: 'Preferences updated successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/preferences' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
