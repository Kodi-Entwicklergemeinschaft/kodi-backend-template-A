import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BaseTagErrorResponseDto {
  @ApiProperty({ example: 'TAG_ERROR_CODE', description: 'Error code identifier' })
  errorCode: string;

  @ApiProperty({ example: 'Detailed error message', description: 'Human-readable message' })
  message: string;

  @ApiProperty({ example: '2025-11-24T10:05:00.000Z', description: 'Timestamp of the error' })
  timestamp: string;

  @ApiProperty({ example: '/tags', description: 'Request path that caused the error' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method used' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request identifier' })
  requestId: string;

  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;
}

export class TagBadRequestErrorResponseDto extends BaseTagErrorResponseDto {
  @ApiProperty({ example: 'TAG_ALREADY_EXISTS' })
  errorCode: string;

  @ApiProperty({ example: 'Tag already exists for this provider' })
  message: string;

  @ApiProperty({ example: 400 })
  statusCode: number;
}

export class TagUnauthorizedErrorResponseDto extends BaseTagErrorResponseDto {
  @ApiProperty({ example: 'UNAUTHORIZED' })
  errorCode: string;

  @ApiProperty({ example: 'Authentication token missing or invalid' })
  message: string;

  @ApiProperty({ example: 401 })
  statusCode: number;
}

export class TagForbiddenErrorResponseDto extends BaseTagErrorResponseDto {
  @ApiProperty({ example: 'FORBIDDEN' })
  errorCode: string;

  @ApiProperty({ example: 'Only admins can manage tags' })
  message: string;

  @ApiProperty({ example: 403 })
  statusCode: number;
}

export class TagValidationErrorResponseDto extends BaseTagErrorResponseDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  errorCode: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiPropertyOptional({
    example: {
      message: ['provider should not be empty', 'externalValue should not be empty'],
    },
  })
  details?: {
    message?: string[];
    [key: string]: any;
  };
}

export class TagNotFoundErrorResponseDto extends BaseTagErrorResponseDto {
  @ApiProperty({ example: 'TAG_NOT_FOUND' })
  errorCode: string;

  @ApiProperty({ example: 'Tag not found' })
  message: string;

  @ApiProperty({ example: 404 })
  statusCode: number;
}
