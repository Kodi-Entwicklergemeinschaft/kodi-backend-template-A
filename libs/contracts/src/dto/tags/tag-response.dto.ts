import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'tag_01HZXTY0YK3H2V4C5B6N7P8Q' })
  id: string;

  @ApiProperty({
    example: 'MANUAL',
    description: 'Source system identifier (e.g., MANUAL, DESTINATION_ONE)',
  })
  provider: string;

  @ApiProperty({ example: 'Ausstellung', description: 'Original value from provider' })
  externalValue: string;

  @ApiPropertyOptional({ example: 'Exhibition', description: 'Display label for UI' })
  label?: string | null;

  @ApiPropertyOptional({ example: 'de', description: 'Source language of the tag data' })
  languageCode?: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-02T00:00:00.000Z' })
  updatedAt: string;
}

export class TagListMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;

  @ApiProperty({ example: 42 })
  total: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class TagListResponseDto {
  @ApiProperty({ type: [TagResponseDto] })
  items: TagResponseDto[];

  @ApiProperty({ type: TagListMetaDto })
  meta: TagListMetaDto;
}
