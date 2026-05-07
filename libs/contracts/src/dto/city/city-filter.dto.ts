import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const transformBooleanParam = (value: any): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

export enum CitySortBy {
  NAME = 'name',
  COUNTRY = 'country',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
}

export enum CitySortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

export class CityFilterDto {
  @ApiPropertyOptional({
    description: 'Filter cities by country name or code',
    example: 'Germany',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter cities by unique key',
    example: 'kodi',
  })
  @IsOptional()
  @IsString()
  key?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => transformBooleanParam(value))
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: CitySortBy,
    default: CitySortBy.NAME,
  })
  @IsOptional()
  @IsEnum(CitySortBy)
  sortBy?: CitySortBy;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: CitySortDirection,
    default: CitySortDirection.ASC,
  })
  @IsOptional()
  @IsEnum(CitySortDirection)
  sortDirection?: CitySortDirection;
}
