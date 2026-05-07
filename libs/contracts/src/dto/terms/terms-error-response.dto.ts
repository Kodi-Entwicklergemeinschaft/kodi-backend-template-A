import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TermsValidationErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Validation failed', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/terms/accept', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Validation error details',
    example: {
      message: [
        'termsId must be a UUID',
        'termsId must be a string',
        'termsId should not be empty',
      ],
    },
  })
  details?: {
    message?: string[];
  };
}

export class TermsNotAcceptedErrorResponseDto {
  @ApiProperty({ example: 'TERMS_NOT_ACCEPTED', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'You must accept the terms of use to continue',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/api/users', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 403, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Terms ID that needs to be accepted',
  })
  termsId: string;

  @ApiProperty({ example: '2024-01', description: 'Latest terms version' })
  version: string;
}

export class TermsNotFoundErrorResponseDto {
  @ApiProperty({ example: 'TERMS_NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'Terms of use not found',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/terms/latest', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;
}
