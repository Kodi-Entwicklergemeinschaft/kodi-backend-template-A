import { IsString, IsEnum, IsOptional, IsUUID, IsObject } from 'class-validator';

export enum TerminalStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  OFFLINE = 'OFFLINE',
}

export class CreateTerminalDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsUUID()
  cityId: string;

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
}
