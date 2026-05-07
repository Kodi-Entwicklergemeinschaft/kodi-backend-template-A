import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CategoryType,
  ListingMediaType,
  ListingRecurrenceFreq,
  ListingSourceType,
  ListingVisibility,
} from '@prisma/client-core';

export enum Weekday {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

export class CreateListingCategoryReferenceDto {
  @ApiProperty({
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'UUID of the category to associate with this listing',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ enum: CategoryType, example: CategoryType.EVENT })
  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;
}

export class ListingCategoryReferenceDto {
  @ApiPropertyOptional({ example: 'lc1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890',
    description: 'UUID of the category to associate with this listing',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ enum: CategoryType, example: CategoryType.EVENT })
  @IsOptional()
  @IsEnum(CategoryType)
  categoryType?: CategoryType;
}

export class CreateListingCityReferenceDto {
  @ApiProperty({
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'Identifier of the city to associate with this listing',
  })
  @IsString()
  @IsNotEmpty()
  cityId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is the primary city for the listing',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order for sorting cities',
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class ListingCityReferenceDto {
  @ApiPropertyOptional({ example: 'lct1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'Identifier of the city to associate with this listing',
  })
  @IsString()
  cityId: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this is the primary city for the listing',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order for sorting cities',
  })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

export class CreateListingTagReferenceDto {
  @ApiProperty({
    example: 'tag_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'UUID of the tag to associate with this listing',
  })
  @IsUUID()
  tagId: string;
}

export class ListingTagReferenceDto {
  @ApiPropertyOptional({ example: 'ltg1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: 'tag_01HZXTY0YK3H2V4C5B6N7P8Q',
    description: 'UUID of the tag to associate with this listing',
  })
  @IsUUID()
  tagId: string;
}

export class CreateListingMediaInputDto {
  @ApiProperty({
    enum: ListingMediaType,
    example: ListingMediaType.IMAGE,
    description: 'Type of media file',
  })
  @IsEnum(ListingMediaType)
  type: ListingMediaType;

  @ApiProperty({
    example: 'https://cdn.example.com/listings/hero.jpg',
    description: 'URL of the media file',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    example: 'Community cleanup event photo',
    description: 'Alternative text for accessibility',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    example: 'Volunteers cleaning up the park',
    description: 'Caption for the media',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order for sorting media',
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    example: { width: 1920, height: 1080 },
    description: 'Additional metadata for the media',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListingMediaInputDto {
  @ApiPropertyOptional({ example: 'lm1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    enum: ListingMediaType,
    example: ListingMediaType.IMAGE,
    description: 'Type of media file',
  })
  @IsEnum(ListingMediaType)
  type: ListingMediaType;

  @ApiProperty({
    example: 'https://cdn.example.com/listings/hero.jpg',
    description: 'URL of the media file',
  })
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    example: 'Community cleanup event photo',
    description: 'Alternative text for accessibility',
  })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({
    example: 'Volunteers cleaning up the park',
    description: 'Caption for the media',
  })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order for sorting media',
  })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({
    example: { width: 1920, height: 1080 },
    description: 'Additional metadata for the media',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateListingTimeIntervalInputDto {
  @ApiPropertyOptional({
    example: [Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY],
    isArray: true,
    description: 'Days of the week when this interval applies',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  weekdays?: Weekday[];

  @ApiProperty({
    example: '2025-01-20T09:00:00.000Z',
    description: 'Start date and time of the interval',
  })
  @IsDateString()
  start: string;

  @ApiProperty({
    example: '2025-01-20T17:00:00.000Z',
    description: 'End date and time of the interval',
  })
  @IsDateString()
  end: string;

  @ApiProperty({
    example: 'America/New_York',
    description: 'Timezone identifier (IANA format)',
  })
  @IsString()
  tz: string;

  @ApiProperty({
    enum: ListingRecurrenceFreq,
    example: ListingRecurrenceFreq.WEEKLY,
    description: 'Recurrence frequency',
  })
  @IsEnum(ListingRecurrenceFreq)
  freq: ListingRecurrenceFreq;

  @ApiPropertyOptional({
    example: 1,
    description: 'Interval between recurrences (e.g., every 2 weeks)',
  })
  @IsOptional()
  @IsNumber()
  interval?: number;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Date when recurrence should stop',
  })
  @IsOptional()
  @IsDateString()
  repeatUntil?: string;

  @ApiPropertyOptional({
    example: { note: 'Holiday schedule' },
    description: 'Additional metadata for the time interval',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListingTimeIntervalInputDto {
  @ApiPropertyOptional({ example: 'lti1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    example: [Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY],
    isArray: true,
    description: 'Days of the week when this interval applies',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Weekday, { each: true })
  weekdays?: Weekday[];

  @ApiProperty({
    example: '2025-01-20T09:00:00.000Z',
    description: 'Start date and time of the interval',
  })
  @IsDateString()
  start: string;

  @ApiProperty({
    example: '2025-01-20T17:00:00.000Z',
    description: 'End date and time of the interval',
  })
  @IsDateString()
  end: string;

  @ApiProperty({
    example: 'America/New_York',
    description: 'Timezone identifier (IANA format)',
  })
  @IsString()
  tz: string;

  @ApiProperty({
    enum: ListingRecurrenceFreq,
    example: ListingRecurrenceFreq.WEEKLY,
    description: 'Recurrence frequency',
  })
  @IsEnum(ListingRecurrenceFreq)
  freq: ListingRecurrenceFreq;

  @ApiPropertyOptional({
    example: 1,
    description: 'Interval between recurrences (e.g., every 2 weeks)',
  })
  @IsOptional()
  @IsNumber()
  interval?: number;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Date when recurrence should stop',
  })
  @IsOptional()
  @IsDateString()
  repeatUntil?: string;

  @ApiPropertyOptional({
    example: { note: 'Holiday schedule' },
    description: 'Additional metadata for the time interval',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateListingTimeIntervalExceptionInputDto {
  @ApiProperty({
    example: '2025-12-25',
    description: 'Date of the exception (YYYY-MM-DD format)',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: '10:00:00',
    description: 'Opening time for this exception (HH:mm:ss format)',
  })
  @IsOptional()
  @IsString()
  opensAt?: string;

  @ApiPropertyOptional({
    example: '14:00:00',
    description: 'Closing time for this exception (HH:mm:ss format)',
  })
  @IsOptional()
  @IsString()
  closesAt?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the location is closed on this date',
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    example: { reason: 'Holiday hours' },
    description: 'Additional metadata for the exception',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ListingTimeIntervalExceptionInputDto {
  @ApiPropertyOptional({ example: 'ltie1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: '2025-12-25',
    description: 'Date of the exception (YYYY-MM-DD format)',
  })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: '10:00:00',
    description: 'Opening time for this exception (HH:mm:ss format)',
  })
  @IsOptional()
  @IsString()
  opensAt?: string;

  @ApiPropertyOptional({
    example: '14:00:00',
    description: 'Closing time for this exception (HH:mm:ss format)',
  })
  @IsOptional()
  @IsString()
  closesAt?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the location is closed on this date',
  })
  @IsOptional()
  @IsBoolean()
  isClosed?: boolean;

  @ApiPropertyOptional({
    example: { reason: 'Holiday hours' },
    description: 'Additional metadata for the exception',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class CreateListingDto {
  // slug is auto-generated from title, not provided during creation

  @ApiProperty({
    example: 'Community Cleanup Day',
    description: 'Title of the listing',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Join neighbors to clean up the central park.',
    description: 'Brief summary (max 280 characters)',
    maxLength: 280,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  summary: string;

  @ApiProperty({
    example: '<p>Please bring gloves and reusable bags.</p>',
    description: 'Full content of the listing (HTML supported)',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: 'en',
    description: 'Language code (ISO 639-1)',
  })
  @IsOptional()
  @IsString()
  languageCode?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/original-source',
    description: 'URL of the original source',
  })
  @IsOptional()
  @IsUrl()
  sourceUrl?: string;

  @ApiPropertyOptional({
    example: { tags: ['cleanup', 'volunteer'] },
    description: 'Additional metadata as key-value pairs',
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the listing should be featured',
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({
    example: '2025-02-01T00:00:00.000Z',
    description: 'Date until which the listing should remain featured',
  })
  @IsOptional()
  @IsDateString()
  featuredUntil?: string;

  @ApiPropertyOptional({
    example: '2025-01-20T09:00:00.000Z',
    description: 'Date and time when the listing should be published',
  })
  @IsOptional()
  @IsDateString()
  publishAt?: string;

  @ApiPropertyOptional({
    example: '2025-12-31T23:59:59.000Z',
    description: 'Date and time when the listing should expire',
  })
  @IsOptional()
  @IsDateString()
  expireAt?: string;

  @ApiPropertyOptional({
    enum: ListingVisibility,
    example: ListingVisibility.PUBLIC,
    description: 'Visibility level of the listing',
  })
  @IsOptional()
  @IsEnum(ListingVisibility)
  visibility?: ListingVisibility;

  @ApiPropertyOptional({
    enum: ListingSourceType,
    example: ListingSourceType.MANUAL,
    description: 'Source type of the listing',
  })
  @IsOptional()
  @IsEnum(ListingSourceType)
  sourceType?: ListingSourceType;

  @ApiPropertyOptional({
    example: 'external-system',
    description: 'Name of the external source system',
  })
  @IsOptional()
  @IsString()
  externalSource?: string;

  @ApiPropertyOptional({
    example: 'ext_12345',
    description: 'External identifier from the source system',
  })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({
    example: 'abc123def456',
    description: 'Hash for synchronization purposes',
  })
  @IsOptional()
  @IsString()
  syncHash?: string;

  @ApiPropertyOptional({
    example: 'xyz789uvw012',
    description: 'Checksum of the content for change detection',
  })
  @IsOptional()
  @IsString()
  contentChecksum?: string;

  @ApiPropertyOptional({
    example: '2025-01-20T08:00:00.000Z',
    description: 'Last synchronization timestamp',
  })
  @IsOptional()
  @IsDateString()
  lastSyncedAt?: string;

  @ApiPropertyOptional({
    example: '2025-01-20T08:00:00.000Z',
    description: 'Timestamp when the listing was ingested',
  })
  @IsOptional()
  @IsDateString()
  ingestedAt?: string;

  @ApiPropertyOptional({
    example: 'integration-service',
    description: 'Service that ingested this listing',
  })
  @IsOptional()
  @IsString()
  ingestedByService?: string;

  @ApiPropertyOptional({
    example: 'Imported from external source',
    description: 'Notes about the ingestion process',
  })
  @IsOptional()
  @IsString()
  ingestNotes?: string;

  @ApiProperty({
    type: [CreateListingCategoryReferenceDto],
    description: 'Categories to associate with this listing',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateListingCategoryReferenceDto)
  categories: CreateListingCategoryReferenceDto[];

  @ApiProperty({
    type: [CreateListingCityReferenceDto],
    description:
      'Cities to associate with this listing. At least one city with cityId is required.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateListingCityReferenceDto)
  cities: CreateListingCityReferenceDto[];

  @ApiPropertyOptional({
    type: [CreateListingTagReferenceDto],
    description: 'Tags to associate with this listing',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateListingTagReferenceDto)
  tags?: CreateListingTagReferenceDto[];

  @ApiPropertyOptional({
    type: [CreateListingTimeIntervalInputDto],
    description: 'Time intervals for recurring events',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateListingTimeIntervalInputDto)
  timeIntervals?: CreateListingTimeIntervalInputDto[];

  @ApiPropertyOptional({
    type: [CreateListingTimeIntervalExceptionInputDto],
    description: 'Exceptions to recurring time intervals',
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateListingTimeIntervalExceptionInputDto)
  timeIntervalExceptions?: CreateListingTimeIntervalExceptionInputDto[];

  @ApiPropertyOptional({
    example: 'Central Park',
    description: 'Name of the venue where the event takes place',
  })
  @IsOptional()
  @IsString()
  venueName?: string;

  @ApiPropertyOptional({
    example: '123 Main St, City, State 12345',
    description: 'Physical address of the venue',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 40.7128,
    description: 'Latitude coordinate of the venue',
  })
  @IsOptional()
  @IsNumber()
  geoLat?: number;

  @ApiPropertyOptional({
    example: -74.006,
    description: 'Longitude coordinate of the venue',
  })
  @IsOptional()
  @IsNumber()
  geoLng?: number;

  @ApiPropertyOptional({
    example: 'America/New_York',
    description: 'Timezone of the venue (IANA format)',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    example: '+1-555-123-4567',
    description: 'Contact phone number',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    example: 'contact@example.com',
    description: 'Contact email address',
  })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({
    example: 'https://example.com',
    description: 'Website URL',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    example: '2025-01-20T09:00:00.000Z',
    description: 'Event start date and time',
  })
  @IsOptional()
  @IsDateString()
  eventStart?: string;

  @ApiPropertyOptional({
    example: '2025-01-20T17:00:00.000Z',
    description: 'Event end date and time',
  })
  @IsOptional()
  @IsDateString()
  eventEnd?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the event lasts all day',
  })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    example: 'Community Organization',
    description: 'Name of the event organizer',
  })
  @IsOptional()
  @IsString()
  organizerName?: string;

  @ApiPropertyOptional({
    example: 'organizer@example.com',
    description: 'Contact information for the organizer',
  })
  @IsOptional()
  @IsString()
  organizerContact?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/register',
    description: 'URL for event registration',
  })
  @IsOptional()
  @IsUrl()
  registrationUrl?: string;
}
