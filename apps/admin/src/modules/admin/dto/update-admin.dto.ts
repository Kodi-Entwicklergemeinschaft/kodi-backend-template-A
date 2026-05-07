import { IsEmail, IsEnum, IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';
import { AdminRole } from './create-admin.dto';

export class UpdateAdminDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsEnum(AdminRole)
  @IsOptional()
  role?: AdminRole;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
