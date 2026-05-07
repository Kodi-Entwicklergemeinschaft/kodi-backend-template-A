import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class ReorderSubServiceItemDto {
  @ApiProperty({ description: 'CategorySubService record ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'New display order' })
  @IsInt()
  @Min(0)
  displayOrder: number;
}

export class ReorderSubServicesDto {
  @ApiProperty({ type: [ReorderSubServiceItemDto], description: 'Items with new display orders' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderSubServiceItemDto)
  items: ReorderSubServiceItemDto[];
}
