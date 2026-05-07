import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client-users';

export class UpdateUserDto {
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
    description: 'Whether the user has a vehicle',
    example: false,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  hasVehicle?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the user account is active',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    example: UserRole.CITIZEN,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
