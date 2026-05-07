import { ApiProperty } from '@nestjs/swagger';
import { TileResponseDto } from './tile-response.dto';

export class TileListMetaDto {
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

export class TileListResponseDto {
  @ApiProperty({
    description: 'List of tiles',
    type: [TileResponseDto],
  })
  items: TileResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: TileListMetaDto,
  })
  meta: TileListMetaDto;
}
