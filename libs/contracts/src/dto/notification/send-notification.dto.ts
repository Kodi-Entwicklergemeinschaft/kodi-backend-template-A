import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Notification type',
    enum: ['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'ALERT', 'EVENT_REMINDER'],
    example: 'INFO',
  })
  @IsEnum(['INFO', 'WARNING', 'ERROR', 'SUCCESS', 'ALERT', 'EVENT_REMINDER'])
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ALERT' | 'EVENT_REMINDER';

  @ApiProperty({
    description: 'Notification channel',
    enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP'],
    example: 'EMAIL',
  })
  @IsEnum(['EMAIL', 'SMS', 'PUSH', 'IN_APP'])
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';

  @ApiPropertyOptional({
    description: 'Notification subject',
    example: 'Welcome to our platform',
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    description: 'Notification content',
    example: 'This is a test notification',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'City ID for city-specific Firebase project',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'FCM-specific data payload',
    example: { action: 'open_screen', screen: 'notifications' },
  })
  @IsObject()
  @IsOptional()
  fcmData?: { [key: string]: string };

  @ApiPropertyOptional({
    description: 'Translation key for multi-language support (e.g., notifications.welcome.title)',
    example: 'notifications.welcome.title',
  })
  @IsString()
  @IsOptional()
  translationKey?: string;

  @ApiPropertyOptional({
    description:
      'Parameters for translation interpolation (e.g., { appName: "Kodi", firstName: "John" })',
    example: { appName: 'Kodi', firstName: 'John', cityName: 'Berlin' },
  })
  @IsObject()
  @IsOptional()
  translationParams?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional metadata for the notification',
    example: { recipientEmail: 'user@example.com' },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
