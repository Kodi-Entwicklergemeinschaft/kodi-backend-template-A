import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Base City DTO
export class CityDto {
  @ApiProperty({
    description: 'City ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'City name',
    example: 'Kodi',
  })
  name: string;

  @ApiProperty({
    description: 'Country name or code',
    example: 'Germany',
  })
  country: string;

  @ApiPropertyOptional({
    description: 'State or province name',
    example: 'Schleswig-Holstein',
    nullable: true,
  })
  state?: string | null;

  @ApiProperty({
    description: 'Latitude coordinate (decimal degrees)',
    example: 54.3233,
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate (decimal degrees)',
    example: 10.1394,
  })
  longitude: number;

  @ApiPropertyOptional({
    description: 'City population',
    example: 247548,
    nullable: true,
  })
  population?: number | null;

  @ApiPropertyOptional({
    description: 'Timezone identifier (IANA timezone)',
    example: 'Europe/Berlin',
    nullable: true,
  })
  timezone?: string | null;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    example: { areaCode: '0431', postalCode: '24103' },
    nullable: true,
  })
  metadata?: any;

  @ApiPropertyOptional({
    description: 'Header image URL for the city',
    example: 'https://cdn.example.com/cities/city-id/header.webp',
    nullable: true,
  })
  headerImageUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Dark logo URL for the city',
    example: 'https://cdn.example.com/cities/city-id/dark-logo.webp',
    nullable: true,
  })
  darkLogoUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Light logo URL for the city',
    example: 'https://cdn.example.com/cities/city-id/light-logo.webp',
    nullable: true,
  })
  lightLogoUrl?: string | null;

  @ApiPropertyOptional({
    description: 'Unique key identifier for the city',
    example: 'kodi',
    nullable: true,
  })
  key?: string | null;

  @ApiPropertyOptional({
    description: 'Parent city ID for hierarchical relationships',
    example: '123e4567-e89b-12d3-a456-426614174001',
    nullable: true,
  })
  parentCityId?: string | null;

  @ApiProperty({
    description: 'Whether the city is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp (ISO 8601)',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: string;
}

// Data DTOs (inner data)
export class CityResponseDataDto extends CityDto {}

export class CityListResponseDataDto {
  @ApiProperty({
    description: 'List of cities',
    type: [CityDto],
  })
  items: CityDto[];
}

export class DeleteCityResponseDataDto {
  @ApiProperty({ example: 'City deleted successfully' })
  message: string;
}

// Wrapped Response DTOs
export class CreateCityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CityResponseDataDto })
  data: CityResponseDataDto;

  @ApiProperty({ example: 'City created successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/' })
  path: string;

  @ApiProperty({ example: 201 })
  statusCode: number;
}

export class UpdateCityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CityResponseDataDto })
  data: CityResponseDataDto;

  @ApiProperty({ example: 'City updated successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/123e4567-e89b-12d3-a456-426614174000' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class GetCityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CityResponseDataDto })
  data: CityResponseDataDto;

  @ApiProperty({ example: 'City retrieved successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/123e4567-e89b-12d3-a456-426614174000' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class ListCitiesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CityListResponseDataDto })
  data: CityListResponseDataDto;

  @ApiProperty({ example: 'Cities retrieved successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class DeleteCityResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DeleteCityResponseDataDto })
  data: DeleteCityResponseDataDto;

  @ApiProperty({ example: 'City deleted successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/123e4567-e89b-12d3-a456-426614174000' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}
