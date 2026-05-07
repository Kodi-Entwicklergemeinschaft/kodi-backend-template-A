import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsUUID,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address (required for registration)',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @ApiProperty({
    description: 'User password (required for registration)',
    example: 'password123',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({
    description:
      'Username (alphanumeric and underscores, 3-30 characters). Optional - can be set later via profile update.',
    example: 'johndoe',
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username must contain only letters, numbers, and underscores',
  })
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({
    description: 'User first name. Optional - can be set later via profile update.',
    example: 'John',
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'User last name. Optional - can be set later via profile update.',
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
    description: 'Whether the user has a vehicle',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  hasVehicle?: boolean;

  @ApiPropertyOptional({
    description: 'City ID to associate with user',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  cityId?: string;
}
