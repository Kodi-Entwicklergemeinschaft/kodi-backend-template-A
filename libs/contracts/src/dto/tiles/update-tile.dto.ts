import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CreateTileDto,
  OPTIONAL_TILE_HEX_COLOR_PATTERN,
  TileCityReferenceDto,
} from './create-tile.dto';

export class UpdateTileDto extends PartialType(CreateTileDto) {
  @ApiPropertyOptional({
    description: 'URL-friendly slug for the tile',
    example: 'kodi-gift-card-promo',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Header background color in hex format (empty string = no color)',
  })
  @IsOptional()
  @IsString()
  @Matches(OPTIONAL_TILE_HEX_COLOR_PATTERN, {
    message: 'headerBackgroundColor must be a valid hex color code or empty',
  })
  headerBackgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Header text for the tile',
  })
  header?: string;

  @ApiPropertyOptional({
    description: 'Subheader text for the tile',
  })
  subheader?: string;

  @ApiPropertyOptional({
    description: 'Description/content text for the tile',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Content (description) background color in hex format (empty string = no color)',
  })
  @IsOptional()
  @IsString()
  @Matches(OPTIONAL_TILE_HEX_COLOR_PATTERN, {
    message: 'contentBackgroundColor must be a valid hex color code or empty',
  })
  contentBackgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Optional website URL to link to',
  })
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether to open the website in external browser',
  })
  openInExternalBrowser?: boolean;

  @ApiPropertyOptional({
    description: 'Display order for sorting tiles',
  })
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the tile is active',
  })
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether activating this tile should trigger a broadcast push notification',
  })
  @IsBoolean()
  @IsOptional()
  sendNotification?: boolean;

  @ApiPropertyOptional({
    description:
      'Transient flag: when true, a broadcast FCM topic notification is sent on activation. Never persisted to DB.',
  })
  @IsBoolean()
  @IsOptional()
  broadcastNotification?: boolean;

  @ApiPropertyOptional({
    description: 'Publish date/time (ISO 8601)',
  })
  publishAt?: string;

  @ApiPropertyOptional({
    description: 'Expiration date/time (ISO 8601)',
  })
  expireAt?: string;

  @ApiPropertyOptional({
    description: 'Cities to associate with this tile',
    type: [TileCityReferenceDto],
  })
  cities?: TileCityReferenceDto[];
}
