import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptTermsDto {
  @ApiProperty({
    description: 'Terms of use ID to accept',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  termsId: string;

  @ApiPropertyOptional({
    description: 'Locale for the terms (optional, defaults to user locale)',
    example: 'en',
  })
  @IsString()
  @IsOptional()
  locale?: string;
}
