import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ListingModerationStatus, ListingStatus } from '@prisma/client-core';

export class ListingModerationDto {
  @IsEnum(ListingModerationStatus)
  moderationStatus: ListingModerationStatus;

  @IsOptional()
  @IsEnum(ListingStatus)
  publishStatus?: ListingStatus;

  @IsOptional()
  @IsString()
  reviewNotes?: string;
}
