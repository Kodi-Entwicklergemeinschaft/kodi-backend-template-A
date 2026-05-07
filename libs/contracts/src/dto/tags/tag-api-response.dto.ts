import { ApiProperty } from '@nestjs/swagger';
import { TagListResponseDto } from './tag-response.dto';
import { TagResponseDto } from './tag-response.dto';

class TagResponseEnvelope {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Tag created successfully' })
  message: string;

  @ApiProperty({ example: '2025-11-24T10:01:25.720Z' })
  timestamp: string;

  @ApiProperty({ example: '/tags' })
  path: string;

  @ApiProperty({ example: 201 })
  statusCode: number;
}

export class TagSingleApiResponseDto extends TagResponseEnvelope {
  @ApiProperty({ type: TagResponseDto })
  data: TagResponseDto;
}

export class TagListApiResponseDto extends TagResponseEnvelope {
  @ApiProperty({ type: TagListResponseDto })
  data: TagListResponseDto;
}

export class TagDeleteDataDto {
  @ApiProperty({ example: '30bbe1c5-9992-431c-8adb-f154fcbfedbe' })
  id: string;
}

export class TagDeleteApiResponseDto extends TagResponseEnvelope {
  @ApiProperty({ type: TagDeleteDataDto })
  data: TagDeleteDataDto;
}
