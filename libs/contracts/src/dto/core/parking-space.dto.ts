import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParkingLocationDto {
  @ApiProperty({ example: 54.3233, description: 'Latitude' })
  latitude: number;

  @ApiProperty({ example: 10.1394, description: 'Longitude' })
  longitude: number;

  @ApiPropertyOptional({ example: 'Holstenstraße 1, 24103 Kodi', description: 'Full address' })
  address?: string;
}

export class ParkingCapacityDto {
  @ApiProperty({ example: 100, description: 'Total parking spaces' })
  total: number | null;

  @ApiProperty({ example: 45, description: 'Available parking spaces' })
  available: number | null;

  @ApiProperty({ example: 55, description: 'Occupied parking spaces' })
  occupied: number | null;

  @ApiPropertyOptional({ example: 0.55, description: 'Occupancy ratio (0-1)' })
  occupancy?: number | null;
}

export class VehicleSlotsDto {
  @ApiPropertyOptional({
    description: 'Four-wheeler vehicle slots information',
    example: { availableSlotNumber: 20, totalSlotNumber: 50, occupiedSlotNumber: 30 },
  })
  fourWheeler?: {
    availableSlotNumber?: number;
    totalSlotNumber?: number;
    occupiedSlotNumber?: number;
  } | null;

  @ApiPropertyOptional({
    description: 'Two-wheeler vehicle slots information',
    example: { availableSlotNumber: 10, totalSlotNumber: 20, occupiedSlotNumber: 10 },
  })
  twoWheeler?: {
    availableSlotNumber?: number;
    totalSlotNumber?: number;
    occupiedSlotNumber?: number;
  } | null;

  @ApiPropertyOptional({
    description: 'Unclassified vehicle slots information',
    example: { availableSpotNumber: 5, totalSpotNumber: 10, occupiedSpotNumber: 5 },
  })
  unclassified?: {
    availableSpotNumber?: number;
    totalSpotNumber?: number;
    occupiedSpotNumber?: number;
  } | null;
}

export class ParkingPricingDto {
  @ApiProperty({ example: 0.05, description: 'Price rate per minute' })
  ratePerMinute: number;

  @ApiProperty({ example: 'EUR', description: 'Currency code' })
  currency: string;
}

export class ParkingSpaceDto {
  @ApiProperty({ example: 'parking-001', description: 'Parking space ID' })
  id: string;

  @ApiProperty({ example: 'parking-site-123', description: 'Parking site ID from Mobilithek API' })
  parkingSiteId: string;

  @ApiPropertyOptional({ example: 'Parkhaus Altstadt', description: 'Parking space name' })
  name?: string | null;

  @ApiPropertyOptional({
    example: 'Multi-story parking garage in city center',
    description: 'Description',
  })
  description?: string | null;

  @ApiProperty({ type: ParkingLocationDto, description: 'Location information' })
  location: ParkingLocationDto;

  @ApiProperty({ type: ParkingCapacityDto, description: 'Capacity information' })
  capacity: ParkingCapacityDto;

  @ApiPropertyOptional({ type: VehicleSlotsDto, description: 'Vehicle type slots information' })
  vehicleSlots?: VehicleSlotsDto;

  @ApiProperty({
    example: 'open',
    enum: ['open', 'closed', 'unknown'],
    description: 'Current status',
  })
  status: string | null;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Last update timestamp' })
  lastUpdate: Date;

  @ApiPropertyOptional({ type: ParkingPricingDto, description: 'Pricing information' })
  pricing?: ParkingPricingDto | null;

  @ApiPropertyOptional({ description: 'Additional metadata from API' })
  metadata?: any;
}

export class ParkingSpacesResponseDto {
  @ApiProperty({ type: [ParkingSpaceDto], description: 'List of parking spaces' })
  spaces: ParkingSpaceDto[];

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', description: 'Data last updated timestamp' })
  lastSyncAt: string;

  @ApiProperty({ example: 25, description: 'Total number of parking spaces' })
  total: number;
}
