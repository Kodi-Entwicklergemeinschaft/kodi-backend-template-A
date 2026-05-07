import { ApiProperty } from '@nestjs/swagger';
import { GetProfileResponseDto } from './users-response.dto';

export class UploadProfilePhotoResponseDto {
  @ApiProperty({
    description: 'Updated user profile with new photo URL',
    type: GetProfileResponseDto,
  })
  profile: GetProfileResponseDto;

  @ApiProperty({
    description: 'URL of the uploaded profile photo',
    example: 'https://storage.example.com/users/user123/profile-photo.webp',
  })
  photoUrl: string;
}
