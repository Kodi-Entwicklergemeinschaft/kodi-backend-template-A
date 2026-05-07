import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client-core';
import { CategoryViewType } from '../categories/sub-service-item.dto';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CategoryCityAssignmentDto {
  @ApiProperty({
    description: 'City ID to assign the category to',
    example: '22a7b284-76aa-43a7-a3ec-797f0c045182',
  })
  @IsUUID()
  cityId: string;
}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Community Events',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'community-events',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the category',
    example: 'Discover and participate in local community events',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Short subtitle for the category',
    example: 'Connect with your community',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subtitle?: string;

  @ApiPropertyOptional({
    description: 'Category type',
    enum: CategoryType,
    example: CategoryType.EVENT,
  })
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;

  @ApiPropertyOptional({
    description: 'Parent category ID (for subcategories)',
    example: 'parent-category-id',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'View type for the category',
    enum: CategoryViewType,
    default: CategoryViewType.LISTINGS,
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
  headerBackgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Content background color in hex format',
    example: '#F3E8FF',
  })
  @IsOptional()
  @IsString()
  contentBackgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Array of cities to assign this category to',
    type: [CategoryCityAssignmentDto],
    example: [{ cityId: '22a7b284-76aa-43a7-a3ec-797f0c045182' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryCityAssignmentDto)
  cities?: CategoryCityAssignmentDto[];
}
