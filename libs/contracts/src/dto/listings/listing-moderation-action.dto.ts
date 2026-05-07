import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ListingStatus } from '@prisma/client-core';

export class ListingModerationActionDto {
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @IsOptional()
  @IsEnum(ListingStatus)
  publishStatus?: ListingStatus;
}
