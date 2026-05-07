import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'Ausstellung',
    description: 'Original value from the provider used as unique key',
  })
  @IsString()
  @IsNotEmpty()
  externalValue: string;

  @ApiPropertyOptional({
    example: 'Exhibition',
    description: 'Display label shown in the UI (defaults to externalValue)',
  })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({
    example: 'de',
    description: 'Language code of the tag data (ISO 639-1)',
  })
  @IsOptional()
  @IsString()
  languageCode?: string;
}
