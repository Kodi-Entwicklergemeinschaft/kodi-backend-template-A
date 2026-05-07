import {
  IsOptional,
  IsArray,
  IsString,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum TileSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  PUBLISH_AT = 'publishAt',
  DISPLAY_ORDER = 'displayOrder',
}

export enum TileSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

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

export class TileFilterDto {
  @ApiPropertyOptional({
    description: 'Search term to filter tiles by header, subheader, or description',
    example: 'gift card',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter by category ID — returns only tiles linked as sub-services of that category',
    example: 'cat_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter by city IDs',
    type: [String],
    example: ['city_01J3MJG0YX6FT5PB9SJ9Y2KQW4'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  cityIds?: string[];

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => transformBooleanParam(value))
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter tiles published after this date (ISO 8601)',
    example: '2025-01-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter tiles published before this date (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  publishBefore?: string;

  @ApiPropertyOptional({
    description: 'Filter tiles that expire after this date (ISO 8601)',
    example: '2025-01-20T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  expireAfter?: string;

  @ApiPropertyOptional({
    description: 'Filter tiles that expire before this date (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expireBefore?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size for pagination',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: TileSortBy,
    example: TileSortBy.DISPLAY_ORDER,
  })
  @IsOptional()
  @IsEnum(TileSortBy)
  sortBy?: TileSortBy;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: TileSortDirection,
    example: TileSortDirection.ASC,
  })
  @IsOptional()
  @IsEnum(TileSortDirection)
  sortDirection?: TileSortDirection;
}
