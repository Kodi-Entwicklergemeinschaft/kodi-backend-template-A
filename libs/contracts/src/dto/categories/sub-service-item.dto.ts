import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TileCityDto } from '../tiles/tile-response.dto';
import { CategoryResponseDto } from '../listings/category-response.dto';

export enum SubServiceItemType {
  TILE = 'TILE',
  CATEGORY = 'CATEGORY',
  MAP = 'MAP',
}

export enum CategoryViewType {
  LISTINGS = 'LISTINGS',
  SUB_SERVICES = 'SUB_SERVICES',
}

export class SubServiceItemDto {
  @ApiProperty({ description: 'CategorySubService record ID' })
  id: string;

  @ApiProperty({ enum: SubServiceItemType, description: 'Discriminator: TILE, CATEGORY, or MAP' })
  itemType: SubServiceItemType;

  @ApiProperty({
    description:
      'Sort order for this sub-service in lists. For TILE items, equals CategorySubService.displayOrder when set, otherwise the linked tile’s displayOrder.',
  })
  displayOrder: number;

  // === Unified fields (both types) ===

  @ApiProperty({ description: 'Referenced Tile.id or Category.id' })
  itemId: string;

  @ApiProperty({ description: 'URL-friendly slug' })
  slug: string;

  @ApiProperty({ description: 'Display name (Tile.header or Category.name)' })
  name: string;

  @ApiPropertyOptional({
    description: 'Subtitle (Tile.subheader or Category.subtitle)',
    nullable: true,
  })
  subtitle: string | null;

  @ApiPropertyOptional({ description: 'Description text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Main image URL (Tile.backgroundImageUrl or Category.imageUrl)',
    nullable: true,
  })
  imageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Icon URL (Tile.iconImageUrl or Category.iconUrl)',
    nullable: true,
  })
  iconUrl: string | null;

  @ApiPropertyOptional({ description: 'Header background color in hex', nullable: true })
  headerBackgroundColor: string | null;

  @ApiPropertyOptional({ description: 'Content background color in hex', nullable: true })
  contentBackgroundColor: string | null;

  @ApiProperty({ description: 'Whether the item is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp (ISO 8601)' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt: string;

  // === Tile-only fields (null when itemType is CATEGORY or MAP) ===

  @ApiPropertyOptional({ description: 'Website URL (tiles only)', nullable: true })
  websiteUrl: string | null;

  @ApiPropertyOptional({ description: 'Open in external browser (tiles only)', nullable: true })
  openInExternalBrowser: boolean | null;

  @ApiPropertyOptional({ description: 'Publish date (tiles only, ISO 8601)', nullable: true })
  publishAt: string | null;

  @ApiPropertyOptional({ description: 'Expiration date (tiles only, ISO 8601)', nullable: true })
  expireAt: string | null;

  @ApiPropertyOptional({ description: 'Creator user ID (tiles only)', nullable: true })
  createdByUserId: string | null;

  @ApiPropertyOptional({ description: 'Last editor user ID (tiles only)', nullable: true })
  lastEditedByUserId: string | null;

  @ApiPropertyOptional({
    description: 'City assignments (tiles only)',
    nullable: true,
    type: [TileCityDto],
  })
  @Type(() => TileCityDto)
  cities: TileCityDto[] | null;

  // === Category-only fields (null when itemType is TILE) ===

  @ApiPropertyOptional({ description: 'Category type (categories only)', nullable: true })
  type: string | null;

  @ApiPropertyOptional({ description: 'Parent category ID (categories only)', nullable: true })
  parentId: string | null;

  @ApiPropertyOptional({
    description: 'View type of the sub-category (categories only)',
    nullable: true,
  })
  viewType: string | null;

  @ApiPropertyOptional({
    description: 'Children categories (categories only)',
    nullable: true,
    type: [CategoryResponseDto],
  })
  @Type(() => CategoryResponseDto)
  children: CategoryResponseDto[] | null;

  @ApiPropertyOptional({
    description: 'Whether user has favorited a listing in this category (categories only)',
    nullable: true,
  })
  isFavorite: boolean | null;
}
