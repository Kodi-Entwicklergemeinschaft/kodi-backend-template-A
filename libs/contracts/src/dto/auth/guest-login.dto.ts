import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DevicePlatform {
  IOS = 'IOS',
  ANDROID = 'ANDROID',
}

export class GuestLoginDto {
  @ApiProperty({
    description: 'Native device identifier from mobile app (iOS IDFV or Android ID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.IOS,
  })
  @IsEnum(DevicePlatform)
  devicePlatform: DevicePlatform;

  @ApiPropertyOptional({
    description: 'Additional device metadata for fingerprinting',
    example: {
      osVersion: '17.0',
      appVersion: '1.0.0',
      deviceModel: 'iPhone 14',
    },
  })
  @IsObject()
  @IsOptional()
  deviceMetadata?: {
    osVersion?: string;
    appVersion?: string;
    deviceModel?: string;
    [key: string]: any;
  };
}
