import { IsString, IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTermsDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isLatest?: boolean;

  @ApiPropertyOptional({
    description: 'Grace period in days',
    minimum: 0,
    maximum: 365,
  })
  @IsInt()
  @Min(0)
  @Max(365)
  @IsOptional()
  gracePeriodDays?: number;
}
