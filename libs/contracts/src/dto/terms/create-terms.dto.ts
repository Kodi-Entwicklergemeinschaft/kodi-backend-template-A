import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTermsDto {
  @ApiProperty({
    description: 'Version number (custom format like "2024-01")',
    example: '2024-01',
  })
  @IsString()
  version: string;

  @ApiProperty({ description: 'Terms title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Terms content (HTML/markdown)' })
  @IsString()
  content: string;

  @ApiProperty({
    description: 'Locale code (e.g., "en", "de", "ar")',
    example: 'en',
  })
  @IsString()
  locale: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is latest version (only one should be true per locale)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isLatest?: boolean;

  @ApiPropertyOptional({
    description: 'Grace period in days (default: 7)',
    example: 7,
    minimum: 0,
    maximum: 365,
  })
  @IsInt()
  @Min(0)
  @Max(365)
  @IsOptional()
  gracePeriodDays?: number;

  @ApiPropertyOptional({
    description:
      'City ID for city-specific terms (null or omit for general terms applicable to all cities)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsString()
  @IsOptional()
  cityId?: string | null;
}
