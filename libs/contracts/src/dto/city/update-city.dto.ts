import { IsString, IsNumber, IsOptional, IsObject, IsBoolean, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCityDto {
  @ApiPropertyOptional({
    description: 'City name',
    example: 'Kodi',
    minLength: 1,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'City population',
    example: 247548,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  population?: number;

  @ApiPropertyOptional({
    description: 'Timezone identifier (IANA timezone)',
    example: 'Europe/Berlin',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { areaCode: '0431', postalCode: '24103' },
  })
  @IsObject()
  @IsOptional()
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Whether the city is active. Setting to false performs a soft delete.',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Unique key identifier for the city',
    example: 'kodi',
  })
  @IsString()
  @IsOptional()
  key?: string;
}
