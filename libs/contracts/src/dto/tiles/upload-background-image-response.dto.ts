import { ApiProperty } from '@nestjs/swagger';
import { TileResponseDto } from './tile-response.dto';

export class UploadBackgroundImageResponseDataDto {
  @ApiProperty({
    description: 'Updated tile with new background image URL',
    type: TileResponseDto,
  })
  tile: TileResponseDto;

  @ApiProperty({
    description: 'URL of the uploaded background image',
    example: 'https://storage.example.com/tiles/tile123/background.webp',
  })
  imageUrl: string;
}

export class UploadBackgroundImageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UploadBackgroundImageResponseDataDto })
  data: UploadBackgroundImageResponseDataDto;

  @ApiProperty({
    example: 'Background image uploaded successfully',
    description: 'Success message',
  })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles/tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4/background-image' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
