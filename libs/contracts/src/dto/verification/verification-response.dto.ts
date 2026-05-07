import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Verify Token Response
export class VerifyTokenResponseDataDto {
  @ApiProperty({ example: true, description: 'Whether the verification was successful' })
  verified: boolean;

  @ApiProperty({ example: 'EMAIL', enum: ['EMAIL', 'SMS'], description: 'Type of verification' })
  type: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email address or phone number that was verified',
  })
  identifier: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'User ID' })
  userId: string;

  @ApiProperty({
    example: '2024-01-01T12:00:00.000Z',
    description: 'Timestamp when verification was completed',
  })
  verifiedAt: Date;
}

export class VerifyTokenResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: VerifyTokenResponseDataDto })
  data: VerifyTokenResponseDataDto;

  @ApiProperty({ example: 'Email verified successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/verification/verify' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

// Send Verification Response
export class SendVerificationResponseDataDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Verification token ID',
  })
  id: string;

  @ApiProperty({ example: 'EMAIL', enum: ['EMAIL', 'SMS'], description: 'Type of verification' })
  type: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email address or phone number' })
  identifier: string;

  @ApiProperty({
    example: '2024-01-02T00:00:00.000Z',
    description: 'Expiration timestamp for the verification link',
  })
  expiresAt: Date;

  @ApiProperty({
    example: 'Verification link sent to your email',
    description: 'Informational message',
  })
  message: string;
}

export class SendVerificationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: SendVerificationResponseDataDto })
  data: SendVerificationResponseDataDto;

  @ApiProperty({ example: 'Verification email sent successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/verification/send' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

// Cancel Verification Response
export class CancelVerificationResponseDataDto {
  @ApiProperty({ example: true, description: 'Whether the cancellation was successful' })
  cancelled: boolean;

  @ApiProperty({
    example: 'Verification has been cancelled. If this was not you, your account may be at risk.',
    description: 'Cancellation message',
  })
  message: string;
}

export class CancelVerificationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CancelVerificationResponseDataDto })
  data: CancelVerificationResponseDataDto;

  @ApiProperty({ example: 'Verification cancelled successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/verification/cancel' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

// Error Response DTOs
export class VerificationNotFoundErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Invalid verification token', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/verification/verify', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;
}

export class VerificationBadRequestErrorResponseDto {
  @ApiProperty({ example: 'BAD_REQUEST', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'This verification link has already been used',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/verification/verify', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;
}

export class VerificationExpiredErrorResponseDto {
  @ApiProperty({ example: 'UNPROCESSABLE_ENTITY', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'Verification link has expired. Please request a new verification email.',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/verification/verify', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 422, description: 'HTTP status code' })
  statusCode: number;
}
