import { ApiProperty } from '@nestjs/swagger';

export class DeleteMediaResponseDto {
  @ApiProperty({ example: 'Media deleted successfully' })
  message: string;
}
