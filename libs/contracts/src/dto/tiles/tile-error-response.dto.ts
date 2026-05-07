import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TileNotFoundErrorResponseDto {
  @ApiProperty({ example: 'TILE_NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Tile not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/tiles/tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4', description: 'Request path' })
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
      tileId: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
    },
  })
  details?: {
    tileId?: string;
    slug?: string;
    [key: string]: any;
  };
}

export class TileForbiddenErrorResponseDto {
  @ApiProperty({ example: 'TILE_ACCESS_DENIED', description: 'Error code' })
  errorCode: string;

  @ApiProperty({
    example: 'You do not have permission to perform this action on tiles',
    description: 'Error message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({ example: '/tiles', description: 'Request path' })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1234567890_abc123', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 403, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details',
    example: {
      reason: 'Only admins can create tiles',
      requiredRole: 'CITY_ADMIN or SUPER_ADMIN',
    },
  })
  details?: {
    reason?: string;
    requiredRole?: string;
    [key: string]: any;
  };
}
