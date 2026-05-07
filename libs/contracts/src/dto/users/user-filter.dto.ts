import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum UserSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  EMAIL = 'email',
  USERNAME = 'username',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
}

export enum UserSortDirection {
  ASC = 'asc',
  DESC = 'desc',
}

const transformBooleanParam = ({ value }: { value: any }): boolean | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase().trim();
    if (lowerValue === 'true') {
      return true;
    }
    if (lowerValue === 'false') {
      return false;
    }
    // If it's a string but not 'true' or 'false', return undefined
    return undefined;
  }
  // For numbers: 0 = false, anything else = true
  if (typeof value === 'number') {
    return value !== 0;
  }
  return Boolean(value);
};

export class UserFilterDto {
  @ApiPropertyOptional({
    description: 'Search term to filter users by email, username, first name, or last name',
    example: 'john',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'Filter by active status. Defaults to showing all users. Set to true for only active users, or false for only inactive/deleted users.',
    example: 'true',
    oneOf: [{ type: 'string' }, { type: 'boolean' }],
  })
  @IsOptional()
  isActive?: string | boolean;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    enum: UserSortBy,
    example: UserSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(UserSortBy)
  sortBy?: UserSortBy;

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: UserSortDirection,
    example: UserSortDirection.DESC,
  })
  @IsOptional()
  @IsEnum(UserSortDirection)
  sortDirection?: UserSortDirection;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size for pagination',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
