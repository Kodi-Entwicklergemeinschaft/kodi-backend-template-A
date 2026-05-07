import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client-users';

export class RegisterDeviceDto {
  @ApiPropertyOptional({
    description: 'Device identifier from client (optional, for multi-device support)',
    example: 'device-uuid-123',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;

  @ApiProperty({
    description: 'Firebase Cloud Messaging token',
    example: 'fcm-token-abc123xyz',
  })
  @IsString()
  fcmToken: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.IOS,
  })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.2.3',
  })
  @IsString()
  @IsOptional()
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'Operating system version',
    example: 'iOS 17.0',
  })
  @IsString()
  @IsOptional()
  osVersion?: string;

  @ApiPropertyOptional({
    description: 'Device language (ISO 639-1 code)',
    example: 'en',
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({
    description: 'City ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  cityId?: string;
}
