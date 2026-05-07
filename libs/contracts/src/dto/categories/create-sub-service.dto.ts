import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum CreateSubServiceItemType {
  TILE = 'TILE',
  CATEGORY = 'CATEGORY',
  MAP = 'MAP',
}

export class CreateSubServiceDto {
  @ApiProperty({ enum: CreateSubServiceItemType, description: 'Type of item to assign' })
  @IsEnum(CreateSubServiceItemType)
  itemType: CreateSubServiceItemType;

  @ApiProperty({ description: 'ID of the Tile or Category to assign' })
  @IsUUID()
  @IsString()
  itemId: string;

  @ApiPropertyOptional({
    description:
      'Optional override for this link’s sort order. Omit or null to store no override; tile sub-services then use the tile’s displayOrder in category API responses.',
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number | null;

  @ApiPropertyOptional({
    description:
      "Override the display name of the referenced tile or category. When set, this name is shown instead of the item's own name.",
  })
  @IsOptional()
  @IsString()
  displayName?: string;
}
