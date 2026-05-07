import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateSubServiceDto {
  @ApiPropertyOptional({
    description:
      'Override sort order for this link; set null to clear and inherit tile order in API (TILE)',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number | null;

  @ApiPropertyOptional({ description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Override the display name of the referenced tile or category. Set to empty string to clear.',
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}
