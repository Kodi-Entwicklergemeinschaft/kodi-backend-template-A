import { IsString, IsNumber, IsOptional, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty({
    description: 'City name',
    example: 'Kodi',
    minLength: 1,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Country name or code',
    example: 'Germany',
    minLength: 1,
  })
  @IsString()
  country: string;

  @ApiPropertyOptional({
    description: 'State or province name',
    example: 'Schleswig-Holstein',
  })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({
    description: 'Latitude coordinate (decimal degrees)',
    example: 54.3233,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate (decimal degrees)',
    example: 10.1394,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

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
    description: 'Unique key identifier for the city',
    example: 'kodi',
  })
  @IsString()
  @IsOptional()
  key?: string;
}
