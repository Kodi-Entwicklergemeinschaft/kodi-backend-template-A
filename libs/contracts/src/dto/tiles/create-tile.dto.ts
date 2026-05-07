import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsNumber,
  ValidateNested,
  IsArray,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Empty string = no color. @IsOptional() does not skip validation for "" — only for undefined/null. */
export const OPTIONAL_TILE_HEX_COLOR_PATTERN = /^$|^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export class CreateTileCityReferenceDto {
  @ApiProperty({
    description: 'City ID to associate with the tile',
    example: 'city_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @IsString()
  cityId: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary city for the tile',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Display order for this city association',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class TileCityReferenceDto {
  @ApiPropertyOptional({
    description: 'Existing TileCity ID for updates',
    example: 'tile_city_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    description: 'City ID to associate with the tile',
    example: 'city_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @IsString()
  cityId: string;

  @ApiPropertyOptional({
    description: 'Whether this is the primary city for the tile',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    description: 'Display order for this city association',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateTileDto {
  @ApiPropertyOptional({
    description: 'Header background color in hex format (empty string = no color)',
    example: '#1E40AF',
  })
  @IsOptional()
  @IsString()
  @Matches(OPTIONAL_TILE_HEX_COLOR_PATTERN, {
    message: 'headerBackgroundColor must be a valid hex color code or empty',
  })
  headerBackgroundColor?: string;

  @ApiProperty({
    description: 'Header text for the tile',
    example: 'Kodigutschein',
  })
  @IsString()
  header: string;

  @ApiPropertyOptional({
    description: 'Subheader text for the tile',
    example: 'Ein Gutschein, so viele Möglichkeiten',
  })
  @IsOptional()
  @IsString()
  subheader?: string;

  @ApiPropertyOptional({
    description: 'Description/content text for the tile',
    example:
      'Der KodiGutschein steht für bunte Vielfalt und kann bei über 120 lokalen Geschäften eingelöst werden.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Content (description) background color in hex format (empty string = no color)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(OPTIONAL_TILE_HEX_COLOR_PATTERN, {
    message: 'contentBackgroundColor must be a valid hex color code or empty',
  })
  contentBackgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Optional website URL to link to',
    example: 'https://www.kodi.de/gutschein',
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether to open the website in external browser (true) or in-app browser (false)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  openInExternalBrowser?: boolean;

  @ApiPropertyOptional({
    description: 'Display order for sorting tiles',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({
    description: 'Whether the tile is active',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Whether activating this tile should trigger a broadcast push notification',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sendNotification?: boolean;

  @ApiPropertyOptional({
    description: 'Cities to associate with this tile',
    type: [CreateTileCityReferenceDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateTileCityReferenceDto)
  @IsArray()
  cities?: CreateTileCityReferenceDto[];
}
