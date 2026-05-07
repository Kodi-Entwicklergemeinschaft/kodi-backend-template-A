import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, Min, Max, IsNumber } from 'class-validator';

export class TagFilterDto {
  @ApiPropertyOptional({ example: 1, description: 'Page number (1-indexed)', minimum: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, description: 'Items per page', minimum: 1, maximum: 100 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ example: 'DESTINATION_ONE', description: 'Filter by provider' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    example: 'museum',
    description: 'Search term applied to external value or label',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
