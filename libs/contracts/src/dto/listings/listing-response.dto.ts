import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  CategoryType,
  ListingMediaType,
  ListingModerationStatus,
  ListingRecurrenceFreq,
  ListingSourceType,
  ListingStatus,
  ListingVisibility,
} from '@prisma/client-core';
import { Weekday } from './listing-create.dto';

export class ListingCategoryDto {
  @ApiProperty({ example: 'lc1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'c1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  categoryId: string;

  @ApiPropertyOptional({ example: 'Community Events' })
  name?: string;

  @ApiPropertyOptional({ example: 'community-events' })
  slug?: string;

  @ApiPropertyOptional({ enum: CategoryType, example: CategoryType.EVENT })
  type?: CategoryType | null;

  @ApiPropertyOptional({ example: 'p1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  parentId?: string | null;
}

export class ListingCityDto {
  @ApiProperty({ example: 'lct1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q' })
  cityId: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: 1 })
  displayOrder: number;
}

export class ListingMediaDto {
  @ApiProperty({ example: 'lm1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ enum: ListingMediaType, example: ListingMediaType.IMAGE })
  type: ListingMediaType;

  @ApiProperty({ example: 'https://cdn.example.com/listings/hero.jpg' })
  url: string;

  @ApiPropertyOptional({ example: 'Community cleanup event photo' })
  altText?: string | null;

  @ApiPropertyOptional({ example: 'Volunteers cleaning up the park' })
  caption?: string | null;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiPropertyOptional({ example: { width: 1920, height: 1080 } })
  metadata?: Record<string, unknown> | null;
}

export class ListingTimeIntervalDto {
  @ApiProperty({ example: 'lti1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiPropertyOptional({
    example: [Weekday.MONDAY, Weekday.WEDNESDAY, Weekday.FRIDAY],
    isArray: true,
  })
  weekdays?: Weekday[];

  @ApiProperty({ example: '2025-01-20T09:00:00.000Z' })
  start: string;

  @ApiProperty({ example: '2025-01-20T17:00:00.000Z' })
  end: string;

  @ApiProperty({ example: 'America/New_York' })
  tz: string;

  @ApiProperty({ enum: ListingRecurrenceFreq, example: ListingRecurrenceFreq.WEEKLY })
  freq: ListingRecurrenceFreq;

  @ApiProperty({ example: 1 })
  interval: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  repeatUntil?: string | null;

  @ApiPropertyOptional({ example: { note: 'Holiday schedule' } })
  metadata?: Record<string, unknown> | null;
}

export class ListingTimeIntervalExceptionDto {
  @ApiProperty({ example: 'ltie1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: '2025-12-25' })
  date: string;

  @ApiPropertyOptional({ example: '10:00:00' })
  opensAt?: string | null;

  @ApiPropertyOptional({ example: '14:00:00' })
  closesAt?: string | null;

  @ApiProperty({ example: false })
  isClosed: boolean;

  @ApiPropertyOptional({ example: { reason: 'Holiday hours' } })
  metadata?: Record<string, unknown> | null;
}

export class ListingTagDto {
  @ApiProperty({ example: 'ltg1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'tag1a2b3c4-d5e6-7890-abcd-ef1234567890' })
  tagId: string;

  @ApiProperty({ example: 'DESTINATION_ONE' })
  provider: string;

  @ApiProperty({ example: 'Ausstellung' })
  externalValue: string;

  @ApiPropertyOptional({ example: 'Exhibition' })
  label?: string | null;

  @ApiPropertyOptional({ example: 'de' })
  languageCode?: string | null;
}

export class ListingResponseDto {
  @ApiProperty({ example: 'lst_01J3MJG0YX6FT5PB9SJ9Y2KQW4' })
  id: string;

  @ApiProperty({ example: 'community-cleanup-day' })
  slug: string;

  @ApiProperty({ example: 'Community Cleanup Day' })
  title: string;

  @ApiPropertyOptional({ example: 'Join neighbors to clean up the central park.' })
  summary?: string | null;

  @ApiProperty({ example: '<p>Bring gloves and reusable bags.</p>' })
  content: string;

  @ApiProperty({ enum: ListingStatus, example: ListingStatus.PENDING })
  status: ListingStatus;

  @ApiProperty({ enum: ListingModerationStatus, example: ListingModerationStatus.PENDING })
  moderationStatus: ListingModerationStatus;

  @ApiProperty({ enum: ListingVisibility, example: ListingVisibility.PUBLIC })
  visibility: ListingVisibility;

  @ApiProperty({ example: false })
  isFeatured: boolean;

  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z' })
  featuredUntil?: string | null;

  @ApiPropertyOptional({ example: '2025-01-20T09:00:00.000Z' })
  publishAt?: string | null;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  expireAt?: string | null;

  @ApiPropertyOptional({ example: 'en' })
  languageCode?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/original-source' })
  sourceUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/listings/hero.jpg' })
  heroImageUrl?: string | null;

  @ApiPropertyOptional({
    example: '#7C3AED',
    description:
      "Header background color from the parent category. If the listing belongs to multiple categories with different parents, one is selected. If a category has no parent, the category's own headerBackgroundColor is used.",
  })
  headerBackgroundColor?: string | null;

  @ApiPropertyOptional({ example: { tags: ['cleanup', 'volunteer'] } })
  metadata?: Record<string, unknown> | null;

  @ApiProperty({
    type: [ListingTagDto],
    description:
      'Tags associated with this listing. Tags are normalized entities shared across listings and translated once per tag.',
  })
  @Type(() => ListingTagDto)
  tags: ListingTagDto[];

  @ApiProperty({ example: 150 })
  viewCount: number;

  @ApiProperty({ example: 25 })
  likeCount: number;

  @ApiProperty({ example: 10 })
  shareCount: number;

  @ApiProperty({ example: false })
  isFavorite: boolean;

  @ApiPropertyOptional({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  createdByUserId?: string | null;

  @ApiPropertyOptional({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  lastEditedByUserId?: string | null;

  @ApiPropertyOptional({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  reviewedBy?: string | null;

  @ApiPropertyOptional({ example: '2025-01-20T10:00:00.000Z' })
  reviewedAt?: string | null;

  @ApiPropertyOptional({ example: 'Approved for publication' })
  reviewNotes?: string | null;

  @ApiProperty({ enum: ListingSourceType, example: ListingSourceType.MANUAL })
  sourceType: ListingSourceType;

  @ApiPropertyOptional({ example: 'external-system' })
  externalSource?: string | null;

  @ApiPropertyOptional({ example: 'ext_12345' })
  externalId?: string | null;

  @ApiPropertyOptional({ example: 'abc123def456' })
  syncHash?: string | null;

  @ApiPropertyOptional({ example: 'xyz789uvw012' })
  contentChecksum?: string | null;

  @ApiPropertyOptional({ example: '2025-01-20T08:00:00.000Z' })
  lastSyncedAt?: string | null;

  @ApiPropertyOptional({ example: '2025-01-20T08:00:00.000Z' })
  ingestedAt?: string | null;

  @ApiPropertyOptional({ example: 'integration-service' })
  ingestedByService?: string | null;

  @ApiPropertyOptional({ example: 'Imported from external source' })
  ingestNotes?: string | null;

  @ApiPropertyOptional({ example: 'city_01HZXTY0YK3H2V4C5B6N7P8Q' })
  primaryCityId?: string | null;

  @ApiPropertyOptional({ example: 'Central Park' })
  venueName?: string | null;

  @ApiPropertyOptional({ example: '123 Main St, City, State 12345' })
  address?: string | null;

  @ApiPropertyOptional({ example: 40.7128 })
  geoLat?: number | null;

  @ApiPropertyOptional({ example: -74.006 })
  geoLng?: number | null;

  @ApiPropertyOptional({ example: 'America/New_York' })
  timezone?: string | null;

  @ApiPropertyOptional({ example: '+1-555-123-4567' })
  contactPhone?: string | null;

  @ApiPropertyOptional({ example: 'contact@example.com' })
  contactEmail?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  website?: string | null;

  @ApiPropertyOptional({ example: '2025-01-20T09:00:00.000Z' })
  eventStart?: string | null;

  @ApiPropertyOptional({ example: '2025-01-20T17:00:00.000Z' })
  eventEnd?: string | null;

  @ApiProperty({ example: false })
  isAllDay: boolean;

  @ApiPropertyOptional({ example: 'Community Organization' })
  organizerName?: string | null;

  @ApiPropertyOptional({ example: 'organizer@example.com' })
  organizerContact?: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/register' })
  registrationUrl?: string | null;

  @ApiPropertyOptional({ example: 'https://terminvergabe.kodi.de/tevis-va/' })
  onlineAppointmentUrl?: string | null;

  @ApiProperty({ example: false })
  isArchived: boolean;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  archivedAt?: string | null;

  @ApiPropertyOptional({ example: 'user_01HZXTY0YK3H2V4C5B6N7P8Q' })
  archivedBy?: string | null;

  @ApiProperty({ example: '2025-01-20T09:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2025-01-20T09:15:00.000Z' })
  updatedAt: string;

  @ApiProperty({
    type: [ListingCategoryDto],
    description: 'Categories associated with this listing',
  })
  @Type(() => ListingCategoryDto)
  categories: ListingCategoryDto[];

  @ApiProperty({ type: [ListingCityDto], description: 'Cities associated with this listing' })
  @Type(() => ListingCityDto)
  cities: ListingCityDto[];

  @ApiProperty({ type: [ListingMediaDto], description: 'Media files associated with this listing' })
  @Type(() => ListingMediaDto)
  media: ListingMediaDto[];

  @ApiProperty({
    type: [ListingTimeIntervalDto],
    description: 'Time intervals for recurring events',
  })
  @Type(() => ListingTimeIntervalDto)
  timeIntervals: ListingTimeIntervalDto[];

  @ApiProperty({
    type: [ListingTimeIntervalExceptionDto],
    description: 'Exceptions to recurring time intervals',
  })
  @Type(() => ListingTimeIntervalExceptionDto)
  timeIntervalExceptions: ListingTimeIntervalExceptionDto[];
}

export class ListingNotFoundErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Listing not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2025-11-12T09:48:33.872Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({
    example: '/listings/79abffae-cdfe-4833-8cde-d1656e4920e9x',
    description: 'Request path',
  })
  path: string;

  @ApiProperty({ example: 'GET', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1762940913872_stt9cnmii', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details from the original exception',
    example: {
      error: 'Not Found',
      statusCode: 404,
    },
    type: 'object',
    additionalProperties: true,
  })
  details?: {
    error?: string;
    statusCode?: number;
    [key: string]: any;
  };
}

export class FavoriteNotFoundErrorResponseDto {
  @ApiProperty({ example: 'NOT_FOUND', description: 'Error code' })
  errorCode: string;

  @ApiProperty({ example: 'Favorite not found', description: 'Error message' })
  message: string;

  @ApiProperty({ example: '2025-11-12T09:48:33.872Z', description: 'Error timestamp' })
  timestamp: string;

  @ApiProperty({
    example: '/favorites/123e4567-e89b-12d3-a456-426614174000',
    description: 'Request path',
  })
  path: string;

  @ApiProperty({ example: 'DELETE', description: 'HTTP method' })
  method: string;

  @ApiProperty({ example: 'req_1762940913872_stt9cnmii', description: 'Request ID for tracing' })
  requestId: string;

  @ApiProperty({ example: 404, description: 'HTTP status code' })
  statusCode: number;

  @ApiPropertyOptional({
    description: 'Additional error details from the original exception',
    example: {
      error: 'Not Found',
      statusCode: 404,
    },
    type: 'object',
    additionalProperties: true,
  })
  details?: {
    error?: string;
    statusCode?: number;
    [key: string]: any;
  };
}
