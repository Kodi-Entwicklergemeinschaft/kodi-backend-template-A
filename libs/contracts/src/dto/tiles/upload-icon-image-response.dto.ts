import { ApiProperty } from '@nestjs/swagger';
import { TileResponseDto } from './tile-response.dto';

export class UploadIconImageResponseDataDto {
  @ApiProperty({
    description: 'Updated tile with new icon image URL',
    type: TileResponseDto,
  })
  tile: TileResponseDto;

  @ApiProperty({
    description: 'URL of the uploaded icon image',
    example: 'https://storage.example.com/tiles/tile123/icon.webp',
  })
  imageUrl: string;
}

export class UploadIconImageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UploadIconImageResponseDataDto })
  data: UploadIconImageResponseDataDto;

  @ApiProperty({ example: 'Icon image uploaded successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles/tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4/icon-image' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
