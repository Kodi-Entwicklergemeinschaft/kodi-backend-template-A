import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CityNotFoundErrorResponseDto {
  @ApiProperty({ example: 'CITY_NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'City not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/123e4567-e89b-12d3-a456-426614174000', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details',
    example: {
      cityId: '123e4567-e89b-12d3-a456-426614174000',
    },
  })
  details?: {
    cityId?: string;
    [key: string]: any;
  };
}
