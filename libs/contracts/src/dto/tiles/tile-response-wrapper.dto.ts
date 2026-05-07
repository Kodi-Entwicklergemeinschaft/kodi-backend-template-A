import { ApiProperty } from '@nestjs/swagger';
import { TileResponseDto } from './tile-response.dto';
import { TileListMetaDto } from './tile-list-response.dto';

// Data DTOs (inner data)
export class TileResponseDataDto extends TileResponseDto {}

export class TileListResponseDataDto {
  @ApiProperty({
    description: 'List of tiles',
    type: [TileResponseDto],
  })
  items: TileResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: TileListMetaDto,
  })
  meta: TileListMetaDto;
}

export class DeleteTileResponseDataDto {
  @ApiProperty({ example: 'Tile deleted successfully' })
  message: string;
}

// Wrapped Response DTOs
export class CreateTileResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TileResponseDataDto })
  data: TileResponseDataDto;

  @ApiProperty({ example: 'Tile created successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles' })
  path: string;

  @ApiProperty({ example: 201 })
  statusCode: number;
}

export class UpdateTileResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TileResponseDataDto })
  data: TileResponseDataDto;

  @ApiProperty({ example: 'Tile updated successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles/tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class GetTileResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TileResponseDataDto })
  data: TileResponseDataDto;

  @ApiProperty({ example: 'Tile retrieved successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles/tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class ListTilesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: TileListResponseDataDto })
  data: TileListResponseDataDto;

  @ApiProperty({ example: 'Tiles retrieved successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles' })
  path: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}

export class DeleteTileResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DeleteTileResponseDataDto })
  data: DeleteTileResponseDataDto;

  @ApiProperty({ example: 'Tile deleted successfully', description: 'Success message' })
  message: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/tiles/tile_01J3MJG0YX6FT5PB9SJ9Y2KQW4' })
  path: string;

  @ApiProperty({ example: 204 })
  statusCode: number;
}
