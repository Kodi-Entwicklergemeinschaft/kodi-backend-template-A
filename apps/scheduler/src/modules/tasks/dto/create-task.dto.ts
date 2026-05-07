import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  cronExpression: string;

  @IsObject()
  @IsOptional()
  payload?: any;
}
