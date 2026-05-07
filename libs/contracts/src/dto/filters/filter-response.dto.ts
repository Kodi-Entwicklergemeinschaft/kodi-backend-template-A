import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FilterResponseDto {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({
    example: 'DESTINATION_ONE',
    description: 'Source provider identifier',
  })
  provider: string;

  @ApiProperty({
    example: 'category',
    description: 'Filter field type (e.g., "category", "cuisine_type", "feature")',
  })
  field: string;

  @ApiProperty({
    example: 'Gastro',
    description: 'Listing type this filter belongs to',
  })
  listingType: string;

  @ApiProperty({
    example: 'Bar',
    description: 'Original value from external API',
  })
  value: string;

  @ApiPropertyOptional({
    example: 'Bar',
    description: 'Display label (translated if locale was specified)',
  })
  label?: string | null;

  @ApiProperty({ example: true, description: 'Whether the filter is active' })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-02T00:00:00.000Z' })
  updatedAt: string;
}

export class FilterListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class FilterListResponseDto {
  @ApiProperty({ type: [FilterResponseDto] })
  items: FilterResponseDto[];

  @ApiProperty({ type: FilterListMetaDto })
  meta: FilterListMetaDto;
}
