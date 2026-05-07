import { ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client-core';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { CategoryViewType } from '../categories/sub-service-item.dto';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    description: 'Category name',
    example: 'Community Events',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'community-events',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the category',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Short subtitle for the category',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Category type',
    enum: CategoryType,
  })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({
    description: 'Parent category ID (for subcategories, set to null to remove parent)',
    example: 'parent-category-id',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'View type for the category',
    enum: CategoryViewType,
  })
  @IsOptional()
  @IsEnum(CategoryViewType)
  viewType?: CategoryViewType;

  @ApiPropertyOptional({
    description: 'Header background color in hex format',
    example: '#7C3AED',
  })
  @IsOptional()
  @IsString()
  headerBackgroundColor?: string | null;

  @ApiPropertyOptional({
    description: 'Content background color in hex format',
    example: '#F3E8FF',
  })
  @IsOptional()
  @IsString()
  contentBackgroundColor?: string | null;
}
