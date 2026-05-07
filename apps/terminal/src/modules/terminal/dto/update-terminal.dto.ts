import { IsString, IsEnum, IsOptional, IsUUID, IsObject, IsBoolean } from 'class-validator';
import { TerminalStatus } from './create-terminal.dto';

export class UpdateTerminalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsUUID()
  @IsOptional()
  cityId?: string;

  @IsObject()
  @IsOptional()
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  @IsEnum(TerminalStatus)
  @IsOptional()
  status?: TerminalStatus;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
