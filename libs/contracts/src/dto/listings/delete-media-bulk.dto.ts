import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DeleteMediaItemDto {
  @ApiProperty({
    description: 'Unique identifier of the media asset to delete',
    example: 'med_01J3MJG0YX6FT5PB9SJ9Y2KQW4',
  })
  @IsUUID()
  id: string;
}

export class DeleteMediaBulkResponseDto {
  @ApiProperty({
    description: 'IDs of media assets that were deleted',
    type: [String],
    example: ['med_01J3MJG0YX6FT5PB9SJ9Y2KQW4', 'med_01J3MJG0YX6FT5PB9SJ9Y2KQW5'],
  })
  deletedIds: string[];

  @ApiProperty({
    description: 'Total number of media assets deleted',
    example: 2,
  })
  deletedCount: number;
}
