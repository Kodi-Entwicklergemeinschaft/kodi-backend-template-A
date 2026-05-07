import { ApiProperty } from '@nestjs/swagger';

export class ConvertedUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'johndoe' })
  username: string;

  @ApiProperty({
    example: 3,
    enum: [1, 2, 3],
    description: 'User role: 1=SUPER_ADMIN, 2=CITY_ADMIN, 3=CITIZEN',
  })
  role: number;

  @ApiProperty({ example: 'REGISTERED', enum: ['GUEST', 'REGISTERED'] })
  userType: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'guest_550e8400-e29b-41d4-a716-446655440000', required: false })
  migratedFromGuestId?: string;
}

export class ConvertGuestResponseDataDto {
  @ApiProperty({ type: ConvertedUserDto })
  user: ConvertedUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({
    example: true,
    description: 'Indicates if guest data (favorites, listings) was automatically migrated',
  })
  dataMigrated: boolean;
}

export class ConvertGuestResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: ConvertGuestResponseDataDto })
  data: ConvertGuestResponseDataDto;

  @ApiProperty({ example: 'Guest converted successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/guest/register' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
