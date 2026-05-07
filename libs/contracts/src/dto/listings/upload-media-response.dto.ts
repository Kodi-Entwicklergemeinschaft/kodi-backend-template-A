import { ApiProperty } from '@nestjs/swagger';
import { ListingMediaDto } from './listing-response.dto';

export class UploadMediaResponseDto {
  @ApiProperty({
    description: 'List of created media records',
    type: [ListingMediaDto],
  })
  media: ListingMediaDto[];
}
