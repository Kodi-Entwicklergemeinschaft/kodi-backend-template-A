import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';

export class UploadCategoryIconResponseDataDto {
  @ApiProperty({
    description: 'Updated category with new icon URL',
    type: CategoryResponseDto,
  })
  category: CategoryResponseDto;

  @ApiProperty({
    description: 'URL of the uploaded icon',
    example: 'https://storage.example.com/categories/cat123/icon.webp',
  })
  iconUrl: string;
}

export class UploadCategoryIconResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: UploadCategoryIconResponseDataDto })
  data: UploadCategoryIconResponseDataDto;

  @ApiProperty({ example: 'Category icon uploaded successfully' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/categories/c1a2b3c4-d5e6-7890-abcd-ef1234567890/icon' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
