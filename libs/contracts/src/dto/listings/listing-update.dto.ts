import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  CreateListingDto,
  ListingCategoryReferenceDto,
  ListingCityReferenceDto,
  ListingTagReferenceDto,
  ListingTimeIntervalInputDto,
  ListingTimeIntervalExceptionInputDto,
} from './listing-create.dto';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ListingModerationStatus, ListingStatus, ListingSourceType } from '@prisma/client-core';

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @ApiPropertyOptional({
    example: 'community-cleanup-day',
    description: 'URL-friendly slug for the listing',
  })
  @IsOptional()
  @IsString()
  slug?: string;
  @ApiPropertyOptional({
    enum: ListingStatus,
    example: ListingStatus.PENDING,
    description: 'Status of the listing',
  })
  @IsOptional()
  @IsEnum(ListingStatus)
  status?: ListingStatus;

  @ApiPropertyOptional({
    enum: ListingModerationStatus,
    example: ListingModerationStatus.PENDING,
    description: 'Moderation status of the listing',
  })
  @IsOptional()
  @IsEnum(ListingModerationStatus)
  moderationStatus?: ListingModerationStatus;

  @ApiPropertyOptional({
    example: 'Approved for publication',
    description: 'Review notes from the moderator',
  })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the listing is archived',
  })
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Date and time when the listing was archived',
  })
  @IsOptional()
  @IsDateString()
  archivedAt?: string;

  @ApiPropertyOptional({
    example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'User ID of the person who archived the listing',
  })
  @IsOptional()
  @IsString()
  archivedBy?: string;

  @ApiPropertyOptional({
    enum: ListingSourceType,
    example: ListingSourceType.MANUAL,
    description: 'Source type of the listing',
  })
  @IsOptional()
  @IsEnum(ListingSourceType)
  sourceType?: ListingSourceType;

  @ApiPropertyOptional({
    type: [ListingCategoryReferenceDto],
    description: 'Categories to associate with this listing (with id for updates)',
  })
  @IsOptional()
  @IsArray()
  categories?: ListingCategoryReferenceDto[];

  @ApiPropertyOptional({
    type: [ListingCityReferenceDto],
    description: 'Cities to associate with this listing (with id for updates)',
  })
  @IsOptional()
  @IsArray()
  cities?: ListingCityReferenceDto[];

  @ApiPropertyOptional({
    type: [ListingTimeIntervalInputDto],
    description: 'Time intervals for recurring events (with id for updates)',
  })
  @IsOptional()
  @IsArray()
  timeIntervals?: ListingTimeIntervalInputDto[];

  @ApiPropertyOptional({
    type: [ListingTimeIntervalExceptionInputDto],
    description: 'Exceptions to recurring time intervals (with id for updates)',
  })
  @IsOptional()
  @IsArray()
  timeIntervalExceptions?: ListingTimeIntervalExceptionInputDto[];

  @ApiPropertyOptional({
    type: [ListingTagReferenceDto],
    description: 'Tags to associate with this listing (with id for updates)',
  })
  @IsOptional()
  @IsArray()
  tags?: ListingTagReferenceDto[];
}
