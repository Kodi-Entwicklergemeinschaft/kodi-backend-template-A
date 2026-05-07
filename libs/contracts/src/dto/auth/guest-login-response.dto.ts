import { ApiProperty } from '@nestjs/swagger';

export class GuestUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'guest_550e8400-e29b-41d4-a716-446655440000' })
  guestId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  deviceId: string;

  @ApiProperty({ example: 'IOS', enum: ['IOS', 'ANDROID'] })
  devicePlatform: string;

  @ApiProperty({ example: 'GUEST', enum: ['GUEST', 'REGISTERED'] })
  userType: string;
}

export class GuestLoginResponseDataDto {
  @ApiProperty({ type: GuestUserDto })
  user: GuestUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Token expiration time in seconds' })
  expiresIn: number;
}

export class GuestLoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: GuestLoginResponseDataDto })
  data: GuestLoginResponseDataDto;

  @ApiProperty({ example: 'Guest login successful', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/guest' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
