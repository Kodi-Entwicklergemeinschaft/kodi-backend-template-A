import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TileCityDto {
  @ApiProperty({
    description: 'TileCity ID',
    example: 'tile_city_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  id: string;

  @ApiProperty({
    description: 'City ID',
    example: 'city_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  cityId: string;

  @ApiProperty({
    description: 'Whether this is the primary city',
    example: true,
  })
  isPrimary: boolean;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  displayOrder: number;
}

export class TileResponseDto {
  @ApiProperty({
    description: 'Tile ID',
    example: 'tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  id: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'kodi-gift-card-promo',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Background image URL',
    example: 'https://example.com/images/tile-background.jpg',
    nullable: true,
  })
  backgroundImageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Icon image URL',
    example: 'https://example.com/images/tile-icon.png',
    nullable: true,
  })
  iconImageUrl: string | null;

  @ApiPropertyOptional({
    description: 'Header background color in hex format',
    example: '#1E40AF',
    nullable: true,
  })
  headerBackgroundColor: string | null;

  @ApiProperty({
    description: 'Header text',
    example: 'Kodigutschein',
  })
  header: string;

  @ApiPropertyOptional({
    description: 'Subheader text',
    example: 'Ein Gutschein, so viele Möglichkeiten',
    nullable: true,
  })
  subheader: string | null;

  @ApiPropertyOptional({
    description: 'Description/content text',
    example: 'Der KodiGutschein steht für bunte Vielfalt...',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Content background color in hex format',
    example: '#3B82F6',
    nullable: true,
  })
  contentBackgroundColor: string | null;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://www.kodi.de/gutschein',
    nullable: true,
  })
  websiteUrl: string | null;

  @ApiProperty({
    description: 'Whether to open website in external browser',
    example: false,
  })
  openInExternalBrowser: boolean;

  @ApiProperty({
    description: 'Display order',
    example: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Whether the tile is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Whether activating this tile sends a broadcast push notification',
    example: false,
  })
  sendNotification: boolean;

  @ApiProperty({
    description:
      'True if this tile is linked as a sub-service on at least one category (CategorySubService with itemType TILE)',
    example: false,
  })
  subServices: boolean;

  @ApiPropertyOptional({
    description: 'Publish date/time (ISO 8601)',
    example: '2025-01-20T09:00:00.000Z',
    nullable: true,
  })
  publishAt: string | null;

  @ApiPropertyOptional({
    description: 'Expiration date/time (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
    nullable: true,
  })
  expireAt: string | null;

  @ApiPropertyOptional({
    description: 'User ID who created the tile',
    example: 'user_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
    nullable: true,
  })
  createdByUserId: string | null;

  @ApiPropertyOptional({
    description: 'User ID who last edited the tile',
    example: 'user_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
    nullable: true,
  })
  lastEditedByUserId: string | null;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601)',
    example: '2025-01-20T09:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601)',
    example: '2025-01-20T09:15:00.000Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'Associated cities',
    type: [TileCityDto],
  })
  cities: TileCityDto[];
}
