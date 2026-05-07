import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyTokenDto {
  @ApiProperty({
    example: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    description: 'Verification token received via email link',
  })
  @IsString()
  token: string;
}
