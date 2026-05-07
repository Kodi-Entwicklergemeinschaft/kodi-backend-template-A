import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

export class DeleteHeroImageResponseDto {
  @ApiProperty({
    description: 'Listing after the hero image has been removed',
    type: ListingResponseDto,
  })
  listing: ListingResponseDto;

  @ApiProperty({
    description: 'URL of the hero image that was deleted',
    example: 'https://cdn.example.com/listings/listing123/hero.webp',
    nullable: true,
  })
  removedImageUrl?: string | null;
}
