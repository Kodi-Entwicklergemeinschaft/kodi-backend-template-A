import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryRequestStatus, CategoryType, CategoryVisibility } from '@prisma/client-core';
import { Transform, Type } from 'class-transformer';
import { SubServiceItemDto, CategoryViewType } from '../categories/sub-service-item.dto';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CategoryResponseDto {
  @ApiProperty({ example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Community Events' })
  name: string;

  @ApiProperty({ example: 'community-events' })
  slug: string;

  @ApiPropertyOptional({
    example: 'Discover and participate in local community events',
    description: 'Detailed description of the category',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Connect with your community',
    description: 'Short subtitle for the category',
  })
  subtitle?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/categories/cat123/image.webp',
    description: 'Category banner/hero image URL',
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/categories/cat123/icon.webp',
    description: 'Category icon image URL',
  })
  iconUrl?: string | null;

  @ApiPropertyOptional({
    example: '#7C3AED',
    description: 'Header background color in hex format',
  })
  headerBackgroundColor?: string | null;

  @ApiPropertyOptional({
    example: '#F3E8FF',
    description: 'Content background color in hex format',
  })
  contentBackgroundColor?: string | null;

  @ApiPropertyOptional({
    enum: CategoryType,
    example: CategoryType.EVENT,
  })
  type?: CategoryType | null;

  @ApiPropertyOptional({ example: 'parent-category-id' })
  parentId?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-01-01T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-10T08:30:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({
    description: 'View type: LISTINGS shows listing cards, SUB_SERVICES shows sub-service items',
    enum: ['LISTINGS', 'SUB_SERVICES'],
  })
  viewType?: CategoryViewType;

  @ApiPropertyOptional({
    description: 'Sub-service items (only present when viewType is SUB_SERVICES)',
    type: [SubServiceItemDto],
  })
  @Type(() => SubServiceItemDto)
  subServices?: SubServiceItemDto[];

  @ApiPropertyOptional({
    type: [CategoryResponseDto],
    description: 'Subcategories nested under this category',
  })
  @Type(() => CategoryResponseDto)
  children?: CategoryResponseDto[];

  @ApiPropertyOptional({
    example: true,
    description:
      'Indicates this is a virtual quick filter node (not a real DB category). When true, use quickFilter to determine behavior instead of categoryId.',
  })
  @IsOptional()
  isQuickFilter?: boolean;

  @ApiPropertyOptional({
    example: 'nearby',
    description:
      'Quick filter value for virtual nodes (e.g., "nearby", "see-all"). Only present when isQuickFilter is true. Use this value as the quickFilter parameter in listing requests.',
  })
  @IsOptional()
  @IsString()
  quickFilter?: string;

  @ApiPropertyOptional({
    example: 1500,
    description:
      'Search radius in meters for distance-based quick filters (e.g., "nearby"). Only present when isQuickFilter is true and the filter supports distance.',
  })
  @IsOptional()
  @IsNumber()
  radiusMeters?: number | null;

  @ApiPropertyOptional({
    example: 0,
    description:
      'Display order for sorting quick filters. Only present when isQuickFilter is true. Lower values appear first.',
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Indicates if any listing in this category (or its children) is favorited by the logged-in user. Only present when user is authenticated.',
  })
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;
}

export class CityCategoryResponseDto {
  @ApiProperty({
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'Category identifier (categoryId)',
  })
  id: string;

  @ApiProperty({ example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q' })
  cityId: string;

  @ApiPropertyOptional({
    example: 'Local Events',
    description: 'Custom name for this city category. Falls back to category name if not set.',
  })
  name?: string | null;

  @ApiPropertyOptional({
    example: 'Discover and participate in local community events',
    description:
      'Custom description for this city category. Falls back to category description if not set.',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Connect with your community',
    description:
      'Custom subtitle for this city category. Falls back to category subtitle if not set.',
  })
  subtitle?: string | null;

  @ApiProperty({
    example: 1,
    description: 'Display order for sorting categories in the city',
  })
  displayOrder: number;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/city-categories/city123/cat456/image.webp',
    description: 'Custom background image URL for this city category',
  })
  imageUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/city-categories/city123/cat456/icon.webp',
    description: 'Custom icon URL for this city category',
  })
  iconUrl?: string | null;

  @ApiPropertyOptional({
    example: '#7C3AED',
    description: 'Header background color in hex format for this city category',
  })
  headerBackgroundColor?: string | null;

  @ApiPropertyOptional({
    example: '#F3E8FF',
    description: 'Content background color in hex format for this city category',
  })
  contentBackgroundColor?: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiPropertyOptional({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  addedBy?: string | null;

  @ApiProperty({ example: '2025-01-05T09:15:00.000Z' })
  addedAt: string;

  @ApiProperty({ type: CategoryResponseDto })
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;
}

export class AssignCategoryToCityDto {
  @ApiProperty({
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'Identifier of the category to assign to the city',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'Local Events',
    description: 'Custom name for this city category. If not provided, uses the category name.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}

export class RequestCategoryDto {
  @ApiProperty({
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'Identifier of the category the city admin is requesting',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    example: 'We need this category to organize local volunteer opportunities.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class CategoryRequestResponseDto {
  @ApiProperty({ example: 'cr1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q' })
  cityId: string;

  @ApiProperty({ example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  categoryId: string;

  @ApiProperty({ enum: CategoryRequestStatus, example: CategoryRequestStatus.PENDING })
  status: CategoryRequestStatus;

  @ApiProperty({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  requestedBy: string;

  @ApiProperty({ example: '2025-01-05T09:15:00.000Z' })
  requestedAt: string;

  @ApiPropertyOptional({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  handledBy?: string | null;

  @ApiPropertyOptional({ example: '2025-01-06T11:45:00.000Z' })
  handledAt?: string | null;

  @ApiPropertyOptional({
    example: 'Approved because the category aligns with community goals.',
  })
  notes?: string | null;

  @ApiProperty({ type: CategoryResponseDto })
  @Type(() => CategoryResponseDto)
  category: CategoryResponseDto;
}

export class ResolveCategoryRequestDto {
  @ApiProperty({
    enum: CategoryRequestStatus,
    example: CategoryRequestStatus.APPROVED,
    description: 'Resolution status for the category request',
  })
  @IsEnum(CategoryRequestStatus)
  status: CategoryRequestStatus;

  @ApiPropertyOptional({
    example: 'Approved - category already exists in our taxonomy.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateCityCategoryDisplayNameDto {
  @ApiPropertyOptional({
    example: 'Local Events',
    description: 'Custom name for this city category. Set to null to use default category name.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string | null;

  @ApiPropertyOptional({
    example: 'Discover and participate in local community events',
    description: 'Custom description for this city category. Set to null to use default.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiPropertyOptional({
    example: 'Connect with your community',
    description: 'Custom subtitle for this city category. Set to null to use default.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  subtitle?: string | null;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order for sorting categories in the city',
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({
    example: '#7C3AED',
    description: 'Header background color in hex format for this city category',
  })
  @IsOptional()
  @IsString()
  headerBackgroundColor?: string | null;

  @ApiPropertyOptional({
    example: '#F3E8FF',
    description: 'Content background color in hex format for this city category',
  })
  @IsOptional()
  @IsString()
  contentBackgroundColor?: string | null;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether this city category is active. Set to false to hide the category in this city.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 'PUBLIC',
    description:
      'Category visibility level. PUBLIC = visible to everyone. CITIZEN = visible only to authenticated registered users. GUEST_ONLY = visible only to guests/anonymous, hidden from logged-in users.',
    enum: CategoryVisibility,
  })
  @IsOptional()
  @IsEnum(CategoryVisibility)
  visibility?: CategoryVisibility;
}

export class CategoryRequestFilterDto {
  @ApiPropertyOptional({
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'Filter requests for a specific city',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    enum: CategoryRequestStatus,
    example: CategoryRequestStatus.PENDING,
    description: 'Filter requests by their current status',
  })
  @IsOptional()
  @IsEnum(CategoryRequestStatus)
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value))
  status?: CategoryRequestStatus;
}

export class CategoryNotFoundErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Category not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2025-11-12T09:48:33.872Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({
    example: '/categories/c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'Request path',
  })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1762940913872_stt9cnmii', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details from the original exception',
    example: {
      error: 'Not Found',
      statusCode: 404,
    },
    type: 'object',
    additionalProperties: true,
  })
  details?: {
    error?: string;
    statusCode?: number;
    [key: string]: any;
  };
}

export class CategoryAssignmentNotFoundErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'City/category assignment not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2025-11-12T09:48:33.872Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({
    example:
      '/categories/cities/city_01HZXTY0YK3H2V4C5B6N7P8Q/categories/c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'Request path',
  })
  path: string;

  @ApiProperty({ example: 'DELETE', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1762940913872_stt9cnmii', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details from the original exception',
    example: {
      error: 'Not Found',
      statusCode: 404,
    },
    type: 'object',
    additionalProperties: true,
  })
  details?: {
    error?: string;
    statusCode?: number;
    [key: string]: any;
  };
}

export class CategoryRequestNotFoundErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Category request not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2025-11-12T09:48:33.872Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({
    example: '/categories/requests/cr1a2b3c4-d5e6-7890-abcd-ef1234567890/resolve',
    description: 'Request path',
  })
  path: string;

  @ApiProperty({ example: 'POST', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1762940913872_stt9cnmii', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details from the original exception',
    example: {
      error: 'Not Found',
      statusCode: 404,
    },
    type: 'object',
    additionalProperties: true,
  })
  details?: {
    error?: string;
    statusCode?: number;
    [key: string]: any;
  };
}
