import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client-users';

export class DeviceDto {
  @ApiProperty({
    description: 'Device ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Device identifier from client',
    example: 'device-uuid-123',
  })
  deviceId?: string;

  @ApiProperty({
    description: 'Device platform',
    enum: DevicePlatform,
    example: DevicePlatform.IOS,
  })
  platform: DevicePlatform;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.2.3',
  })
  appVersion?: string;

  @ApiPropertyOptional({
    description: 'Operating system version',
    example: 'iOS 17.0',
  })
  osVersion?: string;

  @ApiPropertyOptional({
    description: 'Device language',
    example: 'en',
  })
  language?: string;

  @ApiPropertyOptional({
    description: 'City ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  cityId?: string;

  @ApiProperty({
    description: 'Last seen timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  lastSeenAt: string;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;
}

export class DeviceListResponseDataDto {
  @ApiProperty({
    description: 'List of devices',
    type: [DeviceDto],
  })
  devices: DeviceDto[];
}

export class DeviceListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DeviceListResponseDataDto })
  data: DeviceListResponseDataDto;

  @ApiProperty({ example: 'Devices retrieved successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/devices' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class RegisterDeviceResponseDataDto {
  @ApiProperty({
    description: 'Registered device',
    type: DeviceDto,
  })
  device: DeviceDto;
}

export class RegisterDeviceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: RegisterDeviceResponseDataDto })
  data: RegisterDeviceResponseDataDto;

  @ApiProperty({ example: 'Device registered successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/devices' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class DeleteDeviceResponseDataDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
  })
  success: boolean;
}

export class DeleteDeviceResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DeleteDeviceResponseDataDto })
  data: DeleteDeviceResponseDataDto;

  @ApiProperty({ example: 'Device deleted successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/me/devices/:deviceId' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
