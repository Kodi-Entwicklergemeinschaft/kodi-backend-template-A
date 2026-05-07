import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';

export class UploadCategoryImageResponseDataDto {
  @ApiProperty({
    description: 'Updated category with new image URL',
    type: CategoryResponseDto,
  })
  category: CategoryResponseDto;

  @ApiProperty({
    description: 'URL of the uploaded image',
    example: 'https://storage.example.com/categories/cat123/image.webp',
  })
  imageUrl: string;
}

export class UploadCategoryImageResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UploadCategoryImageResponseDataDto })
  data: UploadCategoryImageResponseDataDto;

  @ApiProperty({ example: 'Category image uploaded successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/categories/c1a2b3c4-d5e6-7890-abcd-ef1234567890/image' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
