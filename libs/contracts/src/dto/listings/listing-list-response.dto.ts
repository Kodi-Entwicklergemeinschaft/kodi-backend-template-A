import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListingResponseDto } from './listing-response.dto';

export class ListingsPaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Current page number (1-indexed)' })
  page: number;

  @ApiProperty({ example: 20, description: 'Number of items returned per page' })
  pageSize: number;

  @ApiProperty({ example: 120, description: 'Total number of listings matching the filters' })
  total: number;

  @ApiProperty({ example: 6, description: 'Total number of available pages' })
  totalPages: number;
}

export class ListListingsResponseDto {
  @ApiProperty({
    type: [ListingResponseDto],
    description: 'Listings returned for the current page',
  })
  @Type(() => ListingResponseDto)
  items: ListingResponseDto[];

  @ApiProperty({ type: ListingsPaginationMetaDto })
  @Type(() => ListingsPaginationMetaDto)
  meta: ListingsPaginationMetaDto;
}
