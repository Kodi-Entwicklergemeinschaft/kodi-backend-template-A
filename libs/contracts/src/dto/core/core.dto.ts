import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CoreStatusMemoryUsageDto {
  @ApiProperty({ example: 53248000 })
  rss: number;

  @ApiProperty({ example: 10240000 })
  heapTotal: number;

  @ApiProperty({ example: 8234567 })
  heapUsed: number;

  @ApiProperty({ example: 123456 })
  external: number;

  @ApiProperty({ example: 4096 })
  arrayBuffers: number;
}

export class CoreStatusResponseDto {
  @ApiProperty({ example: 'core', description: 'Name of the microservice' })
  service: string;

  @ApiProperty({
    example: 125.347,
    description: 'Service uptime in seconds at the time of the request',
  })
  uptime: number;

  @ApiProperty({
    example: '2025-01-15T10:45:12.345Z',
    description: 'Timestamp when the status payload was generated',
  })
  timestamp: string;

  @ApiProperty({ type: CoreStatusMemoryUsageDto })
  memory: CoreStatusMemoryUsageDto;
}

export class CoreOperationRequestDto {
  @ApiProperty({
    example: 'sync.cityAssignments',
    description: 'Operation identifier that downstream consumers understand',
  })
  @IsString()
  operation: string;

  @ApiPropertyOptional({
    example: { cityId: 'city_01HZXTY0YK3H2V4C5B6N7P8Q', force: true },
    description: 'Optional payload with operation-specific parameters',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}

export class CoreOperationResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 'Operation queued for execution',
    description: 'Human readable outcome message',
  })
  message: string;

  @ApiProperty({
    example: '1705324512345',
    description: 'Identifier that can be used to trace the queued operation',
  })
  operationId: string;
}
