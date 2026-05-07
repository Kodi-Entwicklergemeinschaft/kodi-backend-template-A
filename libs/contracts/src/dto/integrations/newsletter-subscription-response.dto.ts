import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NewsletterSubscriptionDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: '3054763209', description: 'EMS contact ID' })
  emsContactId: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'CONFIRMED', 'ACTIVE', 'UNSUBSCRIBED'],
    description: 'Subscription status',
  })
  status: string;

  @ApiProperty({ example: true, description: 'Whether the EMS event was triggered' })
  emsEventTriggered: boolean;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z' })
  subscribedAt: string;

  @ApiPropertyOptional({ example: '2025-01-17T19:42:44.000Z' })
  confirmedAt?: string | null;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z' })
  updatedAt: string;
}

export class NewsletterSubscriptionResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: NewsletterSubscriptionDto })
  data: NewsletterSubscriptionDto;

  @ApiProperty({ example: 'Newsletter subscription created successfully' })
  message: string;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/newsletter/subscribe' })
  path: string;

  @ApiProperty({ example: 201, description: 'HTTP status code' })
  statusCode: number;
}

export class NewsletterSubscriptionConflictErrorResponseDto {
  @ApiProperty({ example: 'CONFLICT', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'User is already subscribed to the newsletter',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/newsletter/subscribe', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 409, description: 'HTTP status code' })
  statusCode: number;
}

export class NewsletterSubscriptionValidationErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Validation failed', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/newsletter/subscribe', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details containing validation error messages',
    example: {
      message: ['Please enter a valid email address.', 'userId must be a UUID'],
    },
    type: 'object',
    additionalProperties: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  })
  details?: {
    message?: string[];
    [key: string]: any;
  };
}

export class NewsletterSubscriptionInternalErrorResponseDto {
  @ApiProperty({ example: 'INTERNAL_SERVER_ERROR', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'Failed to subscribe to newsletter',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2025-01-17T19:42:44.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/newsletter/subscribe', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 500, description: 'HTTP status code' })
  statusCode: number;
}
