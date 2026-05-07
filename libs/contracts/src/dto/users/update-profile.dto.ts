import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description:
      'User salutation code (e.g., "MR", "MRS", "MS", "DR", "PROF"). Use GET /salutations to fetch available options.',
    example: 'MR',
  })
  @IsString()
  @IsOptional()
  salutationCode?: string;

  @ApiPropertyOptional({
    description: 'Profile photo URL',
    example: 'https://storage.example.com/users/user123/profile-photo.webp',
  })
  @IsString()
  @IsOptional()
  profilePhotoUrl?: string;

  @ApiPropertyOptional({
    description: 'Preferred language code (ISO 639-1, e.g., en, de, ar)',
    example: 'en',
  })
  @IsString()
  @IsOptional()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    description: 'Whether the user has a vehicle',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  hasVehicle?: boolean;
}
