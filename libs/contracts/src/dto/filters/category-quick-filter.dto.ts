import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

// --- Query DTO ---

export class CategoryQuickFilterQueryDto {
  @ApiPropertyOptional({
    example: 'en',
    description: 'Locale for translated labels (e.g., "en", "de", "dk")',
  })
  @IsOptional()
  @IsString()
  locale?: string;
}

// --- Response DTOs ---

export class CategoryQuickFilterItemDto {
  @ApiProperty({ example: 'f1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Bar', description: 'Original filter value from API' })
  value: string;

  @ApiProperty({
    example: 'Bar',
    description: 'Display label (translated if locale was specified)',
  })
  label: string;

  @ApiPropertyOptional({
    example: 'Bars & Pubs',
    description: 'Display name override from CategoryFilter mapping (null means use label)',
  })
  displayName?: string | null;

  @ApiProperty({ example: 0, description: 'Sort order within the heading' })
  displayOrder: number;
}

export class CategoryQuickFilterHeadingDto {
  @ApiProperty({ example: 'Betriebsart', description: 'Heading name for the filter group' })
  name: string;

  @ApiProperty({ type: [CategoryQuickFilterItemDto] })
  filters: CategoryQuickFilterItemDto[];
}

export class CategoryQuickFilterGroupDto {
  @ApiPropertyOptional({
    example: 'Orte & Tätigkeiten von Interesse (POI)',
    description: 'Group name (null for categories without extra grouping)',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({ type: [CategoryQuickFilterHeadingDto] })
  headings: CategoryQuickFilterHeadingDto[];
}

export class CategoryQuickFilterResponseDto {
  @ApiProperty({ type: [CategoryQuickFilterGroupDto] })
  groups: CategoryQuickFilterGroupDto[];
}
