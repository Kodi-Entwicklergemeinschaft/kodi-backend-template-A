import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Login Error Responses
export class LoginUnauthorizedErrorResponseDto {
  @ApiProperty({
    example: 'ACCOUNT_NOT_FOUND',
    description: 'Error code',
    enum: ['ACCOUNT_NOT_FOUND', 'ACCOUNT_INACTIVE', 'INVALID_CREDENTIALS', 'LOGIN_ERROR'],
  })
  errorCode: string;

  @ApiProperty({
    example:
      'No account found with email address: user@example.com. Please check your email or register for a new account.',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address used for login attempt',
  })
  email: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/login', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 401, description: 'HTTP status code' })
  statusCode: number;
}

export class LoginUserDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  email?: string;

  @ApiProperty({ example: 'johndoe', required: false })
  username?: string;

  @ApiProperty({
    example: 3,
    enum: [1, 2, 3],
    description: 'User role: 1=SUPER_ADMIN, 2=CITY_ADMIN, 3=CITIZEN',
  })
  role: number;

  @ApiProperty({ example: 'REGISTERED', enum: ['GUEST', 'REGISTERED'] })
  userType: string;

  @ApiProperty({ example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  lastName?: string;
}

export class LoginResponseDataDto {
  @ApiProperty({ type: LoginUserDto })
  user: LoginUserDto;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken: string;

  @ApiProperty({ example: 900, description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether user needs to accept terms of use',
  })
  requiresTermsAcceptance?: boolean;

  @ApiPropertyOptional({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Terms ID that needs to be accepted',
  })
  termsId?: string | null;

  @ApiPropertyOptional({
    example: '2024-01',
    description: 'Latest terms version',
  })
  latestVersion?: string | null;

  @ApiPropertyOptional({
    example: '2024-01-08T00:00:00.000Z',
    description: 'Grace period end date (if within grace period)',
  })
  gracePeriodEndsAt?: string | null;
}

export class LoginResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: LoginResponseDataDto })
  data: LoginResponseDataDto;

  @ApiProperty({ example: 'Login successful', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/login' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
