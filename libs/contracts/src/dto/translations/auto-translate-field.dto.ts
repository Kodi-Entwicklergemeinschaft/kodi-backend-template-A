import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';

export class AutoTranslateFieldDto {
  @ApiProperty({
    description: 'Entity type (e.g., "listing", "city", "category")',
    example: 'listing',
  })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({
    description: 'Entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({
    description: 'Field name to translate (e.g., "title", "description")',
    example: 'title',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    description: 'Source locale (language of the original text)',
    example: 'en',
  })
  @IsString()
  @IsNotEmpty()
  sourceLocale: string;

  @ApiProperty({
    description: 'Target locales to translate to',
    example: ['de', 'dk', 'no'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  targetLocales: string[];

  @ApiProperty({
    description: 'Source text to translate',
    example: 'Welcome to our city',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Hash of the source text for change detection',
    example: 'a1b2c3d4e5f6...',
    required: false,
  })
  @IsString()
  @IsOptional()
  sourceHash?: string;

  @ApiProperty({
    description: 'Number of requeue attempts (for rate limit handling)',
    example: 0,
    required: false,
    default: 0,
  })
  @IsOptional()
  requeueAttempts?: number;
}
