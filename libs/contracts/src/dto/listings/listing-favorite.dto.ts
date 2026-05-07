import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsUUID } from 'class-validator';
import { ListingResponseDto } from './listing-response.dto';
import { ListingFilterDto } from './listing-filter.dto';

export class AddFavoriteDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Identifier of the listing to add or remove from favorites',
  })
  @IsUUID()
  listingId: string;

  @ApiProperty({
    example: true,
    description: 'Set to true to add favorite, false to remove favorite',
  })
  @IsBoolean()
  isFavorite: boolean;
}

export class FavoriteListingDto {
  @ApiProperty({ example: 'fav_01J3M9Z0YK3H2V4C5B6N7P8Q' })
  id: string;

  @ApiPropertyOptional({
    example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'Identifier of the user who created the favorite (only returned on creation)',
  })
  userId?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  listingId: string;

  @ApiProperty({
    type: ListingResponseDto,
    description: 'Snapshot of the associated listing when the favorite was created',
  })
  @Type(() => ListingResponseDto)
  listing: ListingResponseDto;

  @ApiProperty({
    example: '2025-01-15T10:30:00.000Z',
    description: 'Timestamp when the favorite entry was created',
  })
  createdAt: string;
}

export class AddFavoriteResponseDto extends FavoriteListingDto {
  @ApiProperty({
    example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'Identifier of the user who favorited the listing',
  })
  userId!: string;
}

export class RemoveFavoriteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: 'Favorite removed successfully',
    description: 'Confirmation message describing the operation outcome',
  })
  message: string;
}

/** Query params mirror {@link ListingFilterDto} for listing-scoped filters on the user's favorites. */
export class FavoriteFilterDto extends ListingFilterDto {}
