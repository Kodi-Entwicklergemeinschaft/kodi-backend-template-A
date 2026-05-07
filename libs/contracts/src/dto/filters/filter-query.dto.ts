import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsOptional, IsString, IsBoolean, IsNumber, Min, Max } from 'class-validator';

const transformBooleanParam = (value: unknown) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

export class FilterQueryDto {
  @ApiPropertyOptional({
    example: 'category',
    description: 'Filter by field type (e.g., "category", "cuisine_type", "feature")',
  })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional({
    example: 'Gastro',
    description: 'Filter by listing type (e.g., "Gastro", "POI", "Event", "Tour")',
  })
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({
    example: 'DESTINATION_ONE',
    description: 'Filter by provider',
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by active status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => transformBooleanParam(value))
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'bar',
    description: 'Search term applied to filter value or label',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Locale for translated labels (e.g., "en", "de", "dk")',
  })
  @IsOptional()
  @IsString()
  locale?: string;

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
}
