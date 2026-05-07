import { IsUUID, IsNumber, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCityAdminDto {
  @ApiProperty({
    description: 'User ID to assign as city admin',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'City ID to assign admin to',
    example: '123e4567-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  cityId: string;

  @ApiProperty({
    description: 'Role to assign: 1=SUPER_ADMIN, 2=CITY_ADMIN, 3=CITIZEN',
    example: 2,
    enum: [1, 2, 3],
  })
  @IsNumber()
  @IsIn([1, 2, 3], { message: 'Role must be 1 (SUPER_ADMIN), 2 (CITY_ADMIN), or 3 (CITIZEN)' })
  @IsNotEmpty()
  role: number;
}
