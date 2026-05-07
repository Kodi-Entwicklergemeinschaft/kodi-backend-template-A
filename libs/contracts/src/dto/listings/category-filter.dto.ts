import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsUUID,
} from 'class-validator';
import { CategoryType } from '@prisma/client-core';
import { Transform } from 'class-transformer';

const transformBooleanParam = (value: any): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

const transformArrayParam = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export class CategoryFilterDto {
  @ApiPropertyOptional({
    description: 'Search term to filter categories by name, description, or subtitle',
    example: 'events',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category type',
    enum: CategoryType,
    example: CategoryType.EVENT,
  })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({
    description: 'Filter by parent category ID',
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description:
      'When true (default), only returns root/main categories with subcategories nested in children array. Set to false to get all categories in a flat list.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => transformBooleanParam(value))
  rootOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => transformBooleanParam(value))
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by category IDs',
    type: [String],
    example: ['c1a2b3c4-d5e6-7890-abcd-ef1234567890'],
  })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => transformArrayParam(value))
  @IsUUID(undefined, { each: true })
  categoryIds?: string[];

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
    example: 'name',
    enum: ['name', 'type', 'createdAt', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['name', 'type', 'createdAt', 'updatedAt'])
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsString()
  @IsEnum(['asc', 'desc'])
  sortDirection?: 'asc' | 'desc';
}
