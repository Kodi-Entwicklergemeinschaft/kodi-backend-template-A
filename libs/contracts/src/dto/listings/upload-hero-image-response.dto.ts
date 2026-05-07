import { ApiProperty } from '@nestjs/swagger';
import { ListingResponseDto } from './listing-response.dto';

export class UploadHeroImageResponseDto {
  @ApiProperty({
    description: 'Updated listing with new hero image URL',
    type: ListingResponseDto,
  })
  listing: ListingResponseDto;

  @ApiProperty({
    description: 'URL of the uploaded hero image',
    example: 'https://storage.example.com/listings/listing123/hero.webp',
  })
  imageUrl: string;
}
