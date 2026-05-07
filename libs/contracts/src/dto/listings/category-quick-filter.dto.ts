import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CategoryQuickFilterDto {
  @ApiProperty({
    example: 'nearby',
    description: 'Unique identifier for the quick filter (e.g., "nearby", "see-all")',
  })
  @IsString()
  key: string;

  @ApiProperty({
    example: 'Nearby',
    description: 'Display label for the quick filter',
  })
  @IsString()
  label: string;

  @ApiProperty({
    example: 0,
    description: 'Display order for sorting quick filters',
  })
  @IsNumber()
  order: number;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/quick-filters/shopping-nearby.webp',
    description: 'Image URL for the quick filter',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 1500,
    description: 'Default radius in meters for distance-based filters (e.g., "nearby")',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  radiusMeters?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether results should be sorted by distance when this filter is active',
  })
  @IsOptional()
  sortByDistance?: boolean;
}
