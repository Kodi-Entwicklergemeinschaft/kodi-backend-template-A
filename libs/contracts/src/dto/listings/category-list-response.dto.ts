import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryResponseDto } from './category-response.dto';

export class CategoryListMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  pageSize: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  totalPages: number;
}

export class CategoryListResponseDto {
  @ApiProperty({
    description: 'List of categories',
    type: [CategoryResponseDto],
  })
  @Type(() => CategoryResponseDto)
  items: CategoryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: CategoryListMetaDto,
  })
  @Type(() => CategoryListMetaDto)
  meta: CategoryListMetaDto;
}
