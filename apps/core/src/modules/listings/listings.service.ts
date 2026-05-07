import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { StorageService } from '@kodi/storage';
import { ConfigService } from '@kodi/config';
import { TranslationService } from '@kodi/translations';
import { I18nService } from '@kodi/i18n';
import {
  Prisma,
  ListingMediaType,
  ListingModerationStatus,
  ListingRecurrenceFreq,
  ListingSourceType,
  ListingStatus,
  ListingVisibility,
  UserRole,
  CategoryType,
} from '@prisma/client-core';
import {
  CreateListingDto,
  ListingCategoryDto,
  ListingCategoryReferenceDto,
  ListingCityDto,
  ListingCityReferenceDto,
  ListingFilterDto,
  ListingMediaDto,
  ListingMediaInputDto,
  ListingModerationActionDto,
  ListingModerationDto,
  ListingResponseDto,
  ListingTagReferenceDto,
  ListingTimeIntervalDto,
  ListingTimeIntervalExceptionDto,
  ListingTimeIntervalExceptionInputDto,
  ListingTimeIntervalInputDto,
  UpdateListingDto,
  Weekday,
} from '@kodi/contracts';

const listingWithRelations = Prisma.validator<Prisma.ListingDefaultArgs>()({
  include: {
    categories: {
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
    },
    cities: true,
    media: true,
    timeIntervals: true,
    timeIntervalExceptions: true,
    tags: {
      include: {
        tag: true,
      },
    },
  },
});

type ListingWithRelations = Prisma.ListingGetPayload<typeof listingWithRelations>;

@Injectable()
export class ListingsService {
  private static readonly KODIER_WOCHE_CATEGORY_SLUGS = [
    'kodier-woche',
    'kodier-woche-events',
    'kodier-woche-eventareale',
  ];

  private kodierWocheCategoryIdsCache: string[] | null = null;

  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly logger: LoggerService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
    private readonly translationService: TranslationService,
    private readonly i18nService: I18nService,
  ) {
    this.logger.setContext(ListingsService.name);
  }

  private isAdmin(roles: UserRole[] = []) {
    return roles.includes(UserRole.SUPER_ADMIN) || roles.includes(UserRole.CITY_ADMIN);
  }

  /**
   * Resolve the Kodier Woche category slugs to their category IDs.
   * Cached in memory after the first lookup since slugs are effectively immutable.
   */
  private async getKodierWocheCategoryIds(): Promise<string[]> {
    if (this.kodierWocheCategoryIdsCache) {
      return this.kodierWocheCategoryIdsCache;
    }

    const categories = await this.prisma.category.findMany({
      where: { slug: { in: ListingsService.KODIER_WOCHE_CATEGORY_SLUGS } },
      select: { id: true },
    });

    this.kodierWocheCategoryIdsCache = categories.map((c) => c.id);
    return this.kodierWocheCategoryIdsCache;
  }

  /**
   * Enforce the Kodier Woche temporal window on the filter when any of the
   * Kodier Woche categories is requested. The bounds come from
   * DO_KW_STARTDATE / DO_KW_ENDDATE env variables and are clamped against
   * any user-supplied upcomingAfter / upcomingBefore values, so the result
   * never escapes the festival window but users can still narrow inside it.
   */
  private async applyKodierWocheTemporalBounds(filter: ListingFilterDto): Promise<void> {
    if (!filter.categoryIds?.length) {
      return;
    }

    const kwIds = await this.getKodierWocheCategoryIds();
    if (kwIds.length === 0) {
      return;
    }

    const isKodierWocheRequest = filter.categoryIds.some((id) => kwIds.includes(id));
    if (!isKodierWocheRequest) {
      return;
    }

    const kwStart = this.configService.get<string>('DO_KW_STARTDATE');
    const kwEnd = this.configService.get<string>('DO_KW_ENDDATE');

    if (kwStart) {
      const startMs = new Date(kwStart).getTime();
      if (!Number.isNaN(startMs)) {
        const userMs = filter.upcomingAfter ? new Date(filter.upcomingAfter).getTime() : -Infinity;
        filter.upcomingAfter = new Date(Math.max(startMs, userMs)).toISOString();
      }
    }

    if (kwEnd) {
      const endMs = new Date(kwEnd).getTime();
      if (!Number.isNaN(endMs)) {
        const userMs = filter.upcomingBefore ? new Date(filter.upcomingBefore).getTime() : Infinity;
        filter.upcomingBefore = new Date(Math.min(endMs, userMs)).toISOString();
      }
    }
  }

  private slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Normalize search term by replacing common punctuation with spaces.
   * This allows matching "L Oistreia" with "L'Oistreia", "L-Oistreia", etc.
   */
  private normalizeSearchTerm(term: string): string {
    return (
      term
        .toLowerCase()
        .trim()
        // Replace common punctuation marks with spaces
        .replace(/[''""`´]/g, ' ') // Apostrophes and quotes
        .replace(/[-–—]/g, ' ') // Hyphens and dashes
        .replace(/[.:';]/g, ' ') // Periods, colons, semicolons, and apostrophes
        .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
        .trim()
    );
  }

  /**
   * Generate search variations from a term to handle punctuation differences.
   * Returns an array of search patterns including original and normalized versions.
   */
  private generateSearchVariations(term: string): string[] {
    const trimmed = term.trim();
    const normalized = this.normalizeSearchTerm(term);
    const variations = new Set<string>();

    // Add original term
    variations.add(trimmed);

    // Add normalized version
    if (normalized !== trimmed.toLowerCase()) {
      variations.add(normalized);
    }

    // Generate variations with common punctuation
    const punctuationMarks = ["'", "'", '"', '"', '`', '´', '-', '–', '—', '.', ':', ';'];
    for (const mark of punctuationMarks) {
      // Replace spaces with punctuation
      const withPunctuation = normalized.replace(/\s+/g, mark);
      if (withPunctuation !== trimmed) {
        variations.add(withPunctuation);
      }
    }

    return Array.from(variations);
  }

  private async ensureUniqueSlug(baseSlug: string, currentId?: string) {
    let candidate = baseSlug;
    let counter = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await this.prisma.listing.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing || existing.id === currentId) {
        return candidate;
      }

      candidate = `${baseSlug}-${counter++}`;
    }
  }

  private toNumber(value?: Prisma.Decimal | number | null) {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return value;
    }

    return Number(value);
  }

  private toJson(value?: unknown): Prisma.InputJsonValue | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value as Prisma.InputJsonValue;
  }

  private deriveEventDatesFromIntervals(intervals?: ListingTimeIntervalInputDto[]): {
    start?: Date | null;
    end?: Date | null;
  } {
    if (!intervals || intervals.length === 0) {
      return { start: null, end: null };
    }

    const starts = intervals.map((interval) => new Date(interval.start).getTime());
    const ends = intervals.map((interval) => new Date(interval.end).getTime());

    return {
      start: new Date(Math.min(...starts)),
      end: new Date(Math.max(...ends)),
    };
  }

  /**
   * Get the headerBackgroundColor from parent categories.
   * - If a category has a parent, use the parent's headerBackgroundColor
   * - If a category has no parent, use its own headerBackgroundColor
   * - Returns the first non-null color found
   */
  private getHeaderBackgroundColor(listing: ListingWithRelations): string | null {
    for (const lc of listing.categories) {
      const category = lc.category as any;
      if (!category) continue;

      // If category has a parent, use parent's headerBackgroundColor
      if (category.parent?.headerBackgroundColor) {
        return category.parent.headerBackgroundColor;
      }

      // If category has no parent (it's a top-level category), use its own headerBackgroundColor
      if (!category.parentId && category.headerBackgroundColor) {
        return category.headerBackgroundColor;
      }
    }

    return null;
  }

  private mapListing(
    listing: ListingWithRelations,
    options: { isFavorite?: boolean } = {},
  ): ListingResponseDto {
    const isFavorite = options.isFavorite ?? false;
    const effectiveHeroImageUrl = this.computeEffectiveHeroImageUrl(listing);
    const headerBackgroundColor = this.getHeaderBackgroundColor(listing);
    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      summary: listing.summary,
      content: listing.content,
      status: listing.status,
      moderationStatus: listing.moderationStatus,
      visibility: listing.visibility,
      isFeatured: listing.isFeatured,
      featuredUntil: listing.featuredUntil?.toISOString() ?? null,
      publishAt: listing.publishAt?.toISOString() ?? null,
      expireAt: listing.expireAt?.toISOString() ?? null,
      languageCode: listing.languageCode,
      sourceUrl: listing.sourceUrl,
      heroImageUrl: effectiveHeroImageUrl,
      headerBackgroundColor,
      metadata: listing.metadata as Record<string, unknown> | null,
      viewCount: listing.viewCount,
      likeCount: listing.likeCount,
      shareCount: listing.shareCount,
      isFavorite,
      createdByUserId: listing.createdByUserId,
      lastEditedByUserId: listing.lastEditedByUserId,
      reviewedBy: listing.reviewedBy,
      reviewedAt: listing.reviewedAt?.toISOString() ?? null,
      reviewNotes: listing.reviewNotes,
      sourceType: listing.sourceType,
      externalSource: listing.externalSource,
      externalId: listing.externalId,
      syncHash: listing.syncHash,
      contentChecksum: listing.contentChecksum,
      lastSyncedAt: listing.lastSyncedAt?.toISOString() ?? null,
      ingestedAt: listing.ingestedAt?.toISOString() ?? null,
      ingestedByService: listing.ingestedByService,
      ingestNotes: listing.ingestNotes,
      primaryCityId: listing.primaryCityId,
      venueName: listing.venueName,
      address: listing.address,
      geoLat: this.toNumber(listing.geoLat),
      geoLng: this.toNumber(listing.geoLng),
      timezone: listing.timezone,
      contactPhone: listing.contactPhone,
      contactEmail: listing.contactEmail,
      website: listing.website,
      eventStart: listing.eventStart?.toISOString() ?? null,
      eventEnd: listing.eventEnd?.toISOString() ?? null,
      isAllDay: listing.isAllDay,
      organizerName: listing.organizerName,
      organizerContact: listing.organizerContact,
      registrationUrl: listing.registrationUrl,
      onlineAppointmentUrl: listing.onlineAppointmentUrl,
      isArchived: listing.isArchived,
      archivedAt: listing.archivedAt?.toISOString() ?? null,
      archivedBy: listing.archivedBy,
      createdAt: listing.createdAt.toISOString(),
      updatedAt: listing.updatedAt.toISOString(),
      categories: listing.categories.map<ListingCategoryDto>((category) => ({
        id: category.id,
        categoryId: category.categoryId,
        name: category.category?.name,
        slug: category.category?.slug,
        type: category.category?.type ?? null,
        parentId: category.category?.parentId ?? null,
      })),
      cities: listing.cities.map<ListingCityDto>((city) => ({
        id: city.id,
        cityId: city.cityId,
        isPrimary: city.isPrimary,
        displayOrder: city.displayOrder,
      })),
      media: listing.media
        .sort((a, b) => a.order - b.order)
        .map<ListingMediaDto>((media) => ({
          id: media.id,
          type: media.type,
          url: media.url,
          altText: media.altText,
          caption: media.caption,
          order: media.order,
          metadata: media.metadata as Record<string, unknown> | null,
        })),
      timeIntervals: listing.timeIntervals
        .sort((a, b) => a.start.getTime() - b.start.getTime())
        .map<ListingTimeIntervalDto>((interval) => ({
          id: interval.id,
          weekdays: (interval.weekdays as unknown as Weekday[]) ?? undefined,
          start: interval.start.toISOString(),
          end: interval.end.toISOString(),
          tz: interval.tz,
          freq: interval.freq,
          interval: interval.interval,
          repeatUntil: interval.repeatUntil?.toISOString() ?? null,
          metadata: interval.metadata as Record<string, unknown> | null,
        })),
      timeIntervalExceptions: listing.timeIntervalExceptions
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .map<ListingTimeIntervalExceptionDto>((exception) => ({
          id: exception.id,
          date: exception.date.toISOString(),
          opensAt: exception.opensAt,
          closesAt: exception.closesAt,
          isClosed: exception.isClosed,
          metadata: exception.metadata as Record<string, unknown> | null,
        })),
      tags:
        listing.tags?.map((listingTag) => ({
          id: listingTag.id,
          tagId: listingTag.tagId,
          provider: listingTag.tag?.provider ?? '',
          externalValue: listingTag.tag?.externalValue ?? '',
          label: listingTag.tag?.label ?? null,
          languageCode: listingTag.tag?.languageCode ?? null,
        })) ?? [],
    };
  }

  /**
   * Compute the effective hero image URL for a listing.
   * Falls back to a default placeholder image constructed from Hetzner storage env vars:
   *   https://{HETZNER_STORAGE_DEFAULT_BUCKET}.{HETZNER_STORAGE_ENDPOINT_HOST}/{DEFAULT_LISTING_IMAGE_KEY}
   */
  private computeEffectiveHeroImageUrl(listing: ListingWithRelations): string | null {
    if (listing.heroImageUrl) {
      return listing.heroImageUrl;
    }
    const key = this.configService.get<string>('DEFAULT_LISTING_IMAGE_KEY');
    const endpoint = this.configService.get<string>('HETZNER_STORAGE_ENDPOINT');
    const bucket = this.configService.get<string>('HETZNER_STORAGE_DEFAULT_BUCKET');
    if (!key || !endpoint || !bucket) return null;
    try {
      const { protocol, hostname } = new URL(endpoint);
      return `${protocol}//${bucket}.${hostname}/${key}`;
    } catch {
      return null;
    }
  }

  /**
   * Apply translations to listing fields based on current request language
   */
  private async applyListingTranslations(
    listing: ListingWithRelations,
    dto: ListingResponseDto,
  ): Promise<ListingResponseDto> {
    const locale = this.i18nService.getLanguage();
    const defaultLocale = this.configService.get<string>('i18n.defaultLanguage', 'en');

    // Get source language from listing
    const listingSourceLocale =
      listing.languageCode || this.configService.get<string>('i18n.defaultLanguage', 'en');

    // If no locale requested, or locale matches listing's source language, return original DTO
    // (no translation needed if the requested language is the same as the listing's original language)
    if (!locale || locale === listingSourceLocale) {
      return dto;
    }

    const [title, summary, content] = await Promise.all([
      this.translationService.getTranslation(
        'listing',
        listing.id,
        'title',
        locale,
        dto.title,
        listingSourceLocale,
      ),
      this.translationService.getTranslation(
        'listing',
        listing.id,
        'summary',
        locale,
        dto.summary ?? '',
        listingSourceLocale,
      ),
      this.translationService.getTranslation(
        'listing',
        listing.id,
        'content',
        locale,
        dto.content,
        listingSourceLocale,
      ),
    ]);

    // Translate tag labels using shared Tag translations (one Translation per tag)
    let translatedTags = dto.tags;
    if (listing.tags && listing.tags.length > 0) {
      translatedTags = await Promise.all(
        listing.tags.map(async (listingTag, index) => {
          const tag = listingTag.tag;
          if (!tag) {
            return (
              dto.tags?.[index] ?? {
                id: listingTag.id,
                tagId: listingTag.tagId,
                provider: '',
                externalValue: '',
                label: null,
                languageCode: null,
              }
            );
          }

          const tagSourceLocale = tag.languageCode || defaultLocale;
          const fallbackLabel = tag.label || tag.externalValue;

          // Only translate tag if requested locale differs from tag's source locale
          // If locale matches tag's source language, use original label (no translation needed)
          let label = fallbackLabel;
          if (locale && locale !== tagSourceLocale) {
            label = await this.translationService.getTranslation(
              'tag',
              tag.id,
              'label',
              locale,
              fallbackLabel,
              tagSourceLocale,
            );
          }

          return {
            id: listingTag.id,
            tagId: tag.id,
            provider: tag.provider,
            externalValue: tag.externalValue,
            label,
            languageCode: tagSourceLocale,
          };
        }),
      );
    }

    return {
      ...dto,
      title,
      summary,
      content,
      tags: translatedTags,
    };
  }

  /**
   * Batch translate a list of listings. One DB query for all translations
   * (listing fields + tag labels combined).
   */
  private async applyListingTranslationsBatch(
    listings: Array<{ listing: ListingWithRelations; dto: ListingResponseDto }>,
  ): Promise<ListingResponseDto[]> {
    const locale = this.i18nService.getLanguage();
    const defaultLocale = this.configService.get<string>('i18n.defaultLanguage', 'en');

    if (!locale) {
      return listings.map(({ dto }) => dto);
    }

    // Collect all entities that need translation (listings + tags)
    const entities: Array<{ entityType: string; entityId: string }> = [];
    for (const { listing } of listings) {
      const listingSourceLocale = listing.languageCode || defaultLocale;
      if (locale === listingSourceLocale) continue;

      entities.push({ entityType: 'listing', entityId: listing.id });

      if (listing.tags) {
        for (const listingTag of listing.tags) {
          const tag = listingTag.tag;
          if (tag) {
            const tagSourceLocale = tag.languageCode || defaultLocale;
            if (locale !== tagSourceLocale) {
              entities.push({ entityType: 'tag', entityId: tag.id });
            }
          }
        }
      }
    }

    // One query for all translations
    const translationMap = await this.translationService.prefetchTranslations(entities, locale);

    // Apply synchronously from map
    return listings.map(({ listing, dto }) => {
      const listingSourceLocale = listing.languageCode || defaultLocale;
      if (locale === listingSourceLocale) return dto;

      const title = this.translationService.getTranslationFromMap(
        translationMap,
        'listing',
        listing.id,
        'title',
        locale,
        dto.title,
        listingSourceLocale,
      );
      const summary = this.translationService.getTranslationFromMap(
        translationMap,
        'listing',
        listing.id,
        'summary',
        locale,
        dto.summary ?? '',
        listingSourceLocale,
      );
      const content = this.translationService.getTranslationFromMap(
        translationMap,
        'listing',
        listing.id,
        'content',
        locale,
        dto.content,
        listingSourceLocale,
      );

      let translatedTags = dto.tags;
      if (listing.tags && listing.tags.length > 0) {
        translatedTags = listing.tags.map((listingTag, index) => {
          const tag = listingTag.tag;
          if (!tag) {
            return (
              dto.tags?.[index] ?? {
                id: listingTag.id,
                tagId: listingTag.tagId,
                provider: '',
                externalValue: '',
                label: null,
                languageCode: null,
              }
            );
          }

          const tagSourceLocale = tag.languageCode || defaultLocale;
          const fallbackLabel = tag.label || tag.externalValue;

          let label = fallbackLabel;
          if (locale !== tagSourceLocale) {
            label = this.translationService.getTranslationFromMap(
              translationMap,
              'tag',
              tag.id,
              'label',
              locale,
              fallbackLabel,
              tagSourceLocale,
            );
          }

          return {
            id: listingTag.id,
            tagId: tag.id,
            provider: tag.provider,
            externalValue: tag.externalValue,
            label,
            languageCode: tagSourceLocale,
          };
        });
      }

      return { ...dto, title, summary, content, tags: translatedTags };
    });
  }

  private async getFavoriteListingIds(userId: string, listingIds: string[]): Promise<Set<string>> {
    if (!listingIds.length) {
      return new Set();
    }

    const favorites = await this.prisma.userFavorite.findMany({
      where: {
        userId,
        listingId: {
          in: listingIds,
        },
      },
      select: { listingId: true },
    });

    return new Set(favorites.map((favorite) => favorite.listingId));
  }

  private async syncListingCategories(
    tx: Prisma.TransactionClient,
    listingId: string,
    categories?: ListingCategoryReferenceDto[],
  ) {
    if (categories === undefined) {
      return;
    }

    if (!categories.length) {
      await tx.listingCategory.deleteMany({ where: { listingId } });
      return;
    }

    const categoryIds = categories.map((category) => category.categoryId);

    await tx.listingCategory.deleteMany({
      where: {
        listingId,
        categoryId: {
          notIn: categoryIds,
        },
      },
    });

    await Promise.all(
      categories.map((category) =>
        tx.listingCategory.upsert({
          where: {
            listingId_categoryId: {
              listingId,
              categoryId: category.categoryId,
            },
          },
          update: {},
          create: {
            ...(category.id ? { id: category.id } : {}),
            listingId,
            categoryId: category.categoryId,
          },
        }),
      ),
    );
  }

  private async syncListingCities(
    tx: Prisma.TransactionClient,
    listingId: string,
    cities?: ListingCityReferenceDto[],
  ) {
    if (cities === undefined) {
      return;
    }

    if (!cities.length) {
      await tx.listingCity.deleteMany({ where: { listingId } });
      return;
    }

    const cityIds = cities.map((city) => city.cityId);

    await tx.listingCity.deleteMany({
      where: {
        listingId,
        cityId: {
          notIn: cityIds,
        },
      },
    });

    await Promise.all(
      cities.map((city, index) =>
        tx.listingCity.upsert({
          where: {
            listingId_cityId: {
              listingId,
              cityId: city.cityId,
            },
          },
          update: {
            isPrimary: city.isPrimary ?? index === 0,
            displayOrder: city.displayOrder ?? index,
          },
          create: {
            ...(city.id ? { id: city.id } : {}),
            listingId,
            cityId: city.cityId,
            isPrimary: city.isPrimary ?? index === 0,
            displayOrder: city.displayOrder ?? index,
          },
        }),
      ),
    );
  }

  private async syncListingMedia(
    tx: Prisma.TransactionClient,
    listingId: string,
    mediaItems?: ListingMediaInputDto[],
  ) {
    if (mediaItems === undefined) {
      return;
    }

    if (!mediaItems.length) {
      await tx.listingMedia.deleteMany({ where: { listingId } });
      return;
    }

    const mediaIds = mediaItems.filter((item) => item.id).map((item) => item.id as string);

    if (mediaIds.length) {
      await tx.listingMedia.deleteMany({
        where: {
          listingId,
          id: {
            notIn: mediaIds,
          },
        },
      });
    } else {
      await tx.listingMedia.deleteMany({ where: { listingId } });
    }

    await Promise.all(
      mediaItems.map((media, index) => {
        if (media.id) {
          return tx.listingMedia.update({
            where: { id: media.id },
            data: {
              type: media.type,
              url: media.url,
              altText: media.altText,
              caption: media.caption,
              order: media.order ?? index,
              metadata: this.toJson(media.metadata),
            },
          });
        }

        return tx.listingMedia.create({
          data: {
            listingId,
            type: media.type,
            url: media.url,
            altText: media.altText,
            caption: media.caption,
            order: media.order ?? index,
            metadata: this.toJson(media.metadata),
          },
        });
      }),
    );
  }

  /**
   * Create a single listing media record
   */
  async createListingMedia(
    listingId: string,
    media: {
      type: ListingMediaType;
      url: string;
      altText?: string;
      caption?: string;
      order?: number;
      metadata?: any;
    },
  ): Promise<ListingMediaDto> {
    const created = await this.prisma.listingMedia.create({
      data: {
        listingId,
        type: media.type,
        url: media.url,
        altText: media.altText,
        caption: media.caption,
        order: media.order ?? 0,
        metadata: this.toJson(media.metadata),
      },
    });

    return this.mapListingMedia(created);
  }

  async deleteListingMedia(
    listingId: string,
    mediaId: string,
    _userId: string,
    _roles: UserRole[],
  ): Promise<void> {
    // Verify listing exists
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    // Get media record
    const media = await this.prisma.listingMedia.findFirst({
      where: { id: mediaId, listingId },
    });

    if (!media) {
      throw new NotFoundException({
        message: 'Media not found',
        errorCode: 'LISTING_MEDIA_NOT_FOUND',
      });
    }

    // Delete file from storage
    try {
      const key = this.extractKeyFromUrl(media.url);
      const bucket = this.configService.storageConfig.defaultBucket;
      if (bucket) {
        await this.storageService.deleteFile({ bucket, key });
      }
    } catch (error) {
      this.logger.warn(`Failed to delete media file ${mediaId}`, error);
    }

    // Delete DB record
    await this.prisma.listingMedia.delete({
      where: { id: mediaId },
    });
  }

  async deleteListingMediaBatch(
    listingId: string,
    mediaIds: string[],
    _userId: string,
    _roles: UserRole[],
  ): Promise<string[]> {
    const uniqueIds = Array.from(new Set(mediaIds.filter(Boolean)));

    if (uniqueIds.length === 0) {
      throw new BadRequestException('No media IDs provided');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const mediaRecords = await this.prisma.listingMedia.findMany({
      where: { listingId, id: { in: uniqueIds } },
    });

    if (mediaRecords.length !== uniqueIds.length) {
      const foundIds = new Set(mediaRecords.map((media) => media.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException({
        message: 'One or more media items were not found for this listing',
        errorCode: 'LISTING_MEDIA_NOT_FOUND',
        missingIds,
      });
    }

    const bucket = this.configService.storageConfig.defaultBucket;
    for (const media of mediaRecords) {
      if (!bucket) {
        this.logger.warn('Storage bucket is not configured; skipping file deletion');
        break;
      }

      try {
        const key = this.extractKeyFromUrl(media.url);
        await this.storageService.deleteFile({ bucket, key });
      } catch (error) {
        this.logger.warn(`Failed to delete media file ${media.id}`, error);
      }
    }

    await this.prisma.listingMedia.deleteMany({
      where: { id: { in: uniqueIds } },
    });

    return uniqueIds;
  }

  async deleteListingHeroImage(
    listingId: string,
  ): Promise<{ listing: ListingResponseDto; removedImageUrl?: string | null }> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, heroImageUrl: true },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (!listing.heroImageUrl) {
      throw new BadRequestException('Listing does not have a hero image to delete');
    }

    const bucket = this.configService.storageConfig.defaultBucket;
    if (!bucket) {
      throw new BadRequestException('Storage bucket is not configured');
    }

    try {
      const key = this.extractKeyFromUrl(listing.heroImageUrl);
      await this.storageService.deleteFile({ bucket, key });
    } catch (error) {
      this.logger.warn(`Failed to delete hero image for listing ${listingId}`, error);
    }

    await this.prisma.listing.update({
      where: { id: listingId },
      data: { heroImageUrl: null },
    });

    const refreshed = await this.getListingById(listingId);

    return {
      listing: refreshed,
      removedImageUrl: listing.heroImageUrl,
    };
  }

  private extractKeyFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Extract pathname and remove leading slash and bucket name
      // Format: /bucket-name/listings/listingId/media/file.ext
      const pathname = urlObj.pathname;
      // Remove leading slash and first segment (bucket name)
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length > 1) {
        return parts.slice(1).join('/');
      }
      return pathname.replace(/^\/[^\/]+\//, '');
    } catch (error) {
      this.logger.warn(`Failed to parse URL: ${url}`, error);
      // Fallback: try to extract from pathname directly
      return url.split('?')[0].replace(/^https?:\/\/[^\/]+\//, '');
    }
  }

  private mapListingMedia(media: any): ListingMediaDto {
    return {
      id: media.id,
      type: media.type,
      url: media.url,
      altText: media.altText,
      caption: media.caption,
      order: media.order,
      metadata: media.metadata as Record<string, unknown> | null,
    };
  }

  private async syncListingTimeIntervals(
    tx: Prisma.TransactionClient,
    listingId: string,
    intervals?: ListingTimeIntervalInputDto[],
  ) {
    if (intervals === undefined) {
      return;
    }

    if (!intervals.length) {
      await tx.listingTimeInterval.deleteMany({ where: { listingId } });
      return;
    }

    const intervalIds = intervals
      .filter((interval) => interval.id)
      .map((interval) => interval.id as string);

    if (intervalIds.length) {
      await tx.listingTimeInterval.deleteMany({
        where: {
          listingId,
          id: {
            notIn: intervalIds,
          },
        },
      });
    } else {
      await tx.listingTimeInterval.deleteMany({ where: { listingId } });
    }

    await Promise.all(
      intervals.map((interval) => {
        const payload = {
          weekdays: interval.weekdays ?? [],
          start: new Date(interval.start),
          end: new Date(interval.end),
          tz: interval.tz,
          freq: interval.freq ?? ListingRecurrenceFreq.NONE,
          interval: interval.interval ?? 1,
          repeatUntil: interval.repeatUntil ? new Date(interval.repeatUntil) : null,
          metadata: this.toJson(interval.metadata),
        };

        if (interval.id) {
          return tx.listingTimeInterval.update({
            where: { id: interval.id },
            data: payload,
          });
        }

        return tx.listingTimeInterval.create({
          data: {
            listingId,
            ...payload,
          },
        });
      }),
    );
  }

  private async syncListingTimeIntervalExceptions(
    tx: Prisma.TransactionClient,
    listingId: string,
    exceptions?: ListingTimeIntervalExceptionInputDto[],
  ) {
    if (exceptions === undefined) {
      return;
    }

    if (!exceptions.length) {
      await tx.listingTimeIntervalException.deleteMany({ where: { listingId } });
      return;
    }

    const exceptionIds = exceptions
      .filter((exception) => exception.id)
      .map((exception) => exception.id as string);

    if (exceptionIds.length) {
      await tx.listingTimeIntervalException.deleteMany({
        where: {
          listingId,
          id: {
            notIn: exceptionIds,
          },
        },
      });
    } else {
      await tx.listingTimeIntervalException.deleteMany({ where: { listingId } });
    }

    await Promise.all(
      exceptions.map((exception) => {
        const payload = {
          date: new Date(exception.date),
          opensAt: exception.opensAt,
          closesAt: exception.closesAt,
          isClosed: exception.isClosed ?? false,
          metadata: this.toJson(exception.metadata),
        };

        if (exception.id) {
          return tx.listingTimeIntervalException.update({
            where: { id: exception.id },
            data: payload,
          });
        }

        return tx.listingTimeIntervalException.create({
          data: {
            listingId,
            ...payload,
          },
        });
      }),
    );
  }

  /**
   * Sync tags for a listing from manual creation/update
   * Links existing tags to the listing by tag ID (similar to categories)
   */
  private async syncListingTags(
    tx: Prisma.TransactionClient,
    listingId: string,
    tags?: ListingTagReferenceDto[],
  ) {
    if (tags === undefined) {
      return;
    }

    if (!tags.length) {
      await tx.listingTag.deleteMany({ where: { listingId } });
      return;
    }

    const tagIds = tags.map((tag) => tag.tagId);

    await tx.listingTag.deleteMany({
      where: {
        listingId,
        tagId: {
          notIn: tagIds,
        },
      },
    });

    await Promise.all(
      tags.map((tag) =>
        tx.listingTag.upsert({
          where: {
            listingId_tagId: {
              listingId,
              tagId: tag.tagId,
            },
          },
          update: {},
          create: {
            ...(tag.id ? { id: tag.id } : {}),
            listingId,
            tagId: tag.tagId,
          },
        }),
      ),
    );
  }

  async createListing(
    userId: string,
    roles: UserRole[],
    dto: CreateListingDto,
  ): Promise<ListingResponseDto> {
    const isAdmin = this.isAdmin(roles);
    // Generate slug from title (slug is auto-generated, not provided during creation)
    const baseSlug = this.slugify(dto.title) || this.slugify(`listing-${Date.now()}`);
    const slug = await this.ensureUniqueSlug(baseSlug);

    const visibility = isAdmin
      ? (dto.visibility ?? ListingVisibility.PUBLIC)
      : ListingVisibility.PUBLIC;
    const sourceType = dto.sourceType ?? ListingSourceType.MANUAL;
    const isFeatured = isAdmin ? (dto.isFeatured ?? false) : false;
    // For admin-created listings, default publishAt to now if not provided (auto-publish)
    const publishAt = isAdmin ? (dto.publishAt ? new Date(dto.publishAt) : new Date()) : undefined;
    const expireAt = isAdmin && dto.expireAt ? new Date(dto.expireAt) : undefined;
    const featuredUntil = isAdmin && dto.featuredUntil ? new Date(dto.featuredUntil) : undefined;
    const primaryCity =
      dto.cities?.find((city) => city.isPrimary) ??
      (dto.cities && dto.cities.length > 0 ? { cityId: dto.cities[0].cityId } : undefined);

    // Determine source language: use provided languageCode, or fall back to Accept-Language header, or default
    // If languageCode is null or not present, use Accept-Language header value
    const sourceLanguage =
      dto.languageCode ??
      this.i18nService.getLanguage() ??
      this.configService.get<string>('i18n.defaultLanguage', 'en');

    // Auto-approve listings created by admins (SUPER_ADMIN or CITY_ADMIN)
    const autoApproved = isAdmin;
    const listingStatus = autoApproved ? ListingStatus.APPROVED : ListingStatus.PENDING;
    const moderationStatus = autoApproved
      ? ListingModerationStatus.APPROVED
      : ListingModerationStatus.PENDING;

    const data: Prisma.ListingCreateInput = {
      slug,
      title: dto.title,
      summary: dto.summary,
      content: dto.content,
      status: listingStatus,
      moderationStatus: moderationStatus,
      visibility,
      isFeatured,
      featuredUntil,
      publishAt,
      expireAt,
      languageCode: sourceLanguage,
      sourceUrl: dto.sourceUrl,
      metadata: this.toJson(dto.metadata),
      createdByUserId: userId,
      lastEditedByUserId: userId,
      reviewedBy: autoApproved ? userId : undefined,
      reviewedAt: autoApproved ? new Date() : undefined,
      reviewNotes: autoApproved ? 'Auto-approved (created by admin)' : undefined,
      sourceType,
      externalSource: isAdmin ? dto.externalSource : undefined,
      externalId: isAdmin ? dto.externalId : undefined,
      syncHash: isAdmin ? dto.syncHash : undefined,
      contentChecksum: isAdmin ? dto.contentChecksum : undefined,
      lastSyncedAt: isAdmin && dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : undefined,
      ingestedAt: isAdmin && dto.ingestedAt ? new Date(dto.ingestedAt) : undefined,
      ingestedByService: isAdmin ? dto.ingestedByService : undefined,
      ingestNotes: isAdmin ? dto.ingestNotes : undefined,
      primaryCityId: primaryCity?.cityId,
      venueName: dto.venueName,
      address: dto.address,
      geoLat: dto.geoLat !== undefined ? new Prisma.Decimal(dto.geoLat) : undefined,
      geoLng: dto.geoLng !== undefined ? new Prisma.Decimal(dto.geoLng) : undefined,
      timezone: dto.timezone,
      contactPhone: dto.contactPhone,
      contactEmail: dto.contactEmail,
      website: dto.website,
      eventStart: dto.eventStart ? new Date(dto.eventStart) : undefined,
      eventEnd: dto.eventEnd ? new Date(dto.eventEnd) : undefined,
      isAllDay: dto.isAllDay ?? false,
      organizerName: dto.organizerName,
      organizerContact: dto.organizerContact,
      registrationUrl: dto.registrationUrl,
      isArchived: false,
      archivedAt: undefined,
      archivedBy: undefined,
      categories: dto.categories?.length
        ? {
            create: dto.categories.map((category) => ({
              // id is not provided during creation (ListingCategory IDs are auto-generated)
              category: {
                connect: {
                  id: category.categoryId,
                },
              },
            })),
          }
        : undefined,
      cities: dto.cities?.length
        ? {
            create: dto.cities.map((city, index) => ({
              // id is not provided during creation (ListingCity IDs are auto-generated)
              cityId: city.cityId,
              isPrimary: city.isPrimary ?? index === 0,
              displayOrder: city.displayOrder ?? index,
            })),
          }
        : undefined,
      timeIntervals: dto.timeIntervals?.length
        ? {
            create: dto.timeIntervals.map((interval) => ({
              // id is not provided during creation (ListingTimeInterval IDs are auto-generated)
              weekdays: interval.weekdays ?? [],
              start: new Date(interval.start),
              end: new Date(interval.end),
              tz: interval.tz,
              freq: interval.freq ?? ListingRecurrenceFreq.NONE,
              interval: interval.interval ?? 1,
              repeatUntil: interval.repeatUntil ? new Date(interval.repeatUntil) : undefined,
              metadata: this.toJson(interval.metadata),
            })),
          }
        : undefined,
      timeIntervalExceptions: dto.timeIntervalExceptions?.length
        ? {
            create: dto.timeIntervalExceptions.map((exception) => ({
              // id is not provided during creation (ListingTimeIntervalException IDs are auto-generated)
              date: new Date(exception.date),
              opensAt: exception.opensAt,
              closesAt: exception.closesAt,
              isClosed: exception.isClosed ?? false,
              metadata: this.toJson(exception.metadata),
            })),
          }
        : undefined,
    };

    // Auto-generate eventStart/eventEnd from timeIntervals if not explicitly provided
    if (
      dto.eventStart === undefined &&
      dto.eventEnd === undefined &&
      dto.timeIntervals &&
      dto.timeIntervals.length > 0
    ) {
      const derivedDates = this.deriveEventDatesFromIntervals(dto.timeIntervals);
      data.eventStart = derivedDates.start ?? undefined;
      data.eventEnd = derivedDates.end ?? undefined;
    }

    const listing = await this.prisma.listing.create({
      data,
      include: listingWithRelations.include,
    });

    // Sync tags if provided
    if (dto.tags !== undefined) {
      await this.prisma.$transaction(async (tx) => {
        await this.syncListingTags(tx, listing.id, dto.tags as ListingTagReferenceDto[]);
      });
    }

    // Refresh listing with tags
    const listingWithTags = await this.prisma.listing.findUnique({
      where: { id: listing.id },
      include: listingWithRelations.include,
    });

    if (!listingWithTags) {
      throw new NotFoundException(`Listing ${listing.id} not found`);
    }

    const listingDto = this.mapListing(listingWithTags);
    return this.applyListingTranslations(listingWithTags, listingDto);
  }

  async updateListing(listingId: string, userId: string, roles: UserRole[], dto: UpdateListingDto) {
    const isAdmin = this.isAdmin(roles);
    const slug = dto.slug
      ? await this.ensureUniqueSlug(this.slugify(dto.slug), listingId)
      : undefined;
    const primaryCity =
      dto.cities?.find((city) => city.isPrimary) ??
      (dto.cities && dto.cities.length > 0 ? { cityId: dto.cities[0].cityId } : undefined);

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.listing.findUnique({
        where: { id: listingId },
      });

      if (!existing) {
        throw new NotFoundException('Listing not found');
      }

      if (!isAdmin && existing.createdByUserId !== userId) {
        throw new ForbiddenException('You can only update listings you created');
      }

      const updateData: Prisma.ListingUpdateInput = {
        lastEditedByUserId: userId,
      };

      if (slug) {
        updateData.slug = slug;
      }

      if (dto.title !== undefined) {
        updateData.title = dto.title;
      }

      if (dto.summary !== undefined) {
        updateData.summary = dto.summary;
      }

      if (dto.content !== undefined) {
        updateData.content = dto.content;
      }

      if (dto.languageCode !== undefined) {
        updateData.languageCode = dto.languageCode;
      } else if (!existing.languageCode) {
        // If no languageCode exists and none provided, set from current request language
        const sourceLanguage =
          this.i18nService.getLanguage() ||
          this.configService.get<string>('i18n.defaultLanguage', 'en');
        updateData.languageCode = sourceLanguage;
      }

      if (dto.sourceUrl !== undefined) {
        updateData.sourceUrl = dto.sourceUrl;
      }

      if (dto.metadata !== undefined) {
        updateData.metadata = this.toJson(dto.metadata);
      }

      if (dto.venueName !== undefined) {
        updateData.venueName = dto.venueName;
      }

      if (dto.address !== undefined) {
        updateData.address = dto.address;
      }

      if (dto.geoLat !== undefined) {
        updateData.geoLat = new Prisma.Decimal(dto.geoLat);
      }

      if (dto.geoLng !== undefined) {
        updateData.geoLng = new Prisma.Decimal(dto.geoLng);
      }

      if (dto.timezone !== undefined) {
        updateData.timezone = dto.timezone;
      }

      if (dto.contactPhone !== undefined) {
        updateData.contactPhone = dto.contactPhone;
      }

      if (dto.contactEmail !== undefined) {
        updateData.contactEmail = dto.contactEmail;
      }

      if (dto.website !== undefined) {
        updateData.website = dto.website;
      }

      if (dto.eventStart !== undefined) {
        updateData.eventStart = dto.eventStart ? new Date(dto.eventStart) : null;
      }

      if (dto.eventEnd !== undefined) {
        updateData.eventEnd = dto.eventEnd ? new Date(dto.eventEnd) : null;
      }

      // Auto-generate eventStart/eventEnd from timeIntervals if neither is explicitly set
      if (
        dto.eventStart === undefined &&
        dto.eventEnd === undefined &&
        dto.timeIntervals !== undefined
      ) {
        const derivedDates = this.deriveEventDatesFromIntervals(dto.timeIntervals);
        updateData.eventStart = derivedDates.start ?? null;
        updateData.eventEnd = derivedDates.end ?? null;
      }

      if (dto.isAllDay !== undefined) {
        updateData.isAllDay = dto.isAllDay;
      }

      if (dto.organizerName !== undefined) {
        updateData.organizerName = dto.organizerName;
      }

      if (dto.organizerContact !== undefined) {
        updateData.organizerContact = dto.organizerContact;
      }

      if (dto.registrationUrl !== undefined) {
        updateData.registrationUrl = dto.registrationUrl;
      }

      if (dto.isFeatured !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update featured listings');
        }
        updateData.isFeatured = dto.isFeatured;
      }

      if (dto.featuredUntil !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can set featured until date');
        }
        updateData.featuredUntil = dto.featuredUntil ? new Date(dto.featuredUntil) : null;
      }

      if (dto.publishAt !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can set publishAt');
        }
        updateData.publishAt = dto.publishAt ? new Date(dto.publishAt) : null;
      }

      if (dto.expireAt !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can set expireAt');
        }
        updateData.expireAt = dto.expireAt ? new Date(dto.expireAt) : null;
      }

      if (dto.visibility !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can change visibility');
        }
        updateData.visibility = dto.visibility;
      }

      if (dto.status !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can change status');
        }
        updateData.status = dto.status;
      }

      if (dto.moderationStatus !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can change moderation status');
        }
        updateData.moderationStatus = dto.moderationStatus;
      } else if (!isAdmin) {
        updateData.moderationStatus = ListingModerationStatus.PENDING;
      }

      if (!isAdmin) {
        updateData.status = ListingStatus.PENDING;
        updateData.reviewNotes = null;
        updateData.reviewedBy = null;
        updateData.reviewedAt = null;
      } else if (dto.reviewNotes !== undefined) {
        updateData.reviewNotes = dto.reviewNotes;
      }

      if (dto.externalSource !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update external metadata');
        }
        updateData.externalSource = dto.externalSource;
      }

      if (dto.externalId !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update external metadata');
        }
        updateData.externalId = dto.externalId;
      }

      if (dto.syncHash !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update sync hash');
        }
        updateData.syncHash = dto.syncHash;
      }

      if (dto.contentChecksum !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update content checksum');
        }
        updateData.contentChecksum = dto.contentChecksum;
      }

      if (dto.lastSyncedAt !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update sync timestamps');
        }
        updateData.lastSyncedAt = dto.lastSyncedAt ? new Date(dto.lastSyncedAt) : null;
      }

      if (dto.ingestedAt !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update ingestion metadata');
        }
        updateData.ingestedAt = dto.ingestedAt ? new Date(dto.ingestedAt) : null;
      }

      if (dto.ingestedByService !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update ingestion metadata');
        }
        updateData.ingestedByService = dto.ingestedByService;
      }

      if (dto.ingestNotes !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update ingestion metadata');
        }
        updateData.ingestNotes = dto.ingestNotes;
      }

      if (dto.sourceType !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update source type');
        }
        updateData.sourceType = dto.sourceType;
      }

      if (dto.isArchived !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can archive listings');
        }
        updateData.isArchived = dto.isArchived;
        if (dto.isArchived) {
          updateData.archivedAt = dto.archivedAt ? new Date(dto.archivedAt) : new Date();
          updateData.archivedBy = dto.archivedBy ?? userId;
        } else {
          updateData.archivedAt = null;
          updateData.archivedBy = null;
        }
      } else if (dto.archivedAt !== undefined || dto.archivedBy !== undefined) {
        if (!isAdmin) {
          throw new ForbiddenException('Only admins can update archive metadata');
        }
        if (dto.archivedAt !== undefined) {
          updateData.archivedAt = dto.archivedAt ? new Date(dto.archivedAt) : null;
        }
        if (dto.archivedBy !== undefined) {
          updateData.archivedBy = dto.archivedBy;
        }
      }

      if (primaryCity) {
        updateData.primaryCityId = primaryCity.cityId;
      } else if (dto.cities && dto.cities.length === 0) {
        updateData.primaryCityId = null;
      }

      await tx.listing.update({
        where: { id: listingId },
        data: updateData,
      });

      await this.syncListingCategories(tx, listingId, dto.categories);
      await this.syncListingCities(tx, listingId, dto.cities);
      // Media should not be updated via this endpoint - use upload/delete endpoints instead
      await this.syncListingTimeIntervals(tx, listingId, dto.timeIntervals);
      await this.syncListingTimeIntervalExceptions(tx, listingId, dto.timeIntervalExceptions);
      await this.syncListingTags(tx, listingId, dto.tags);

      const refreshed = await tx.listing.findUnique({
        where: { id: listingId },
        include: listingWithRelations.include,
      });

      if (!refreshed) {
        throw new NotFoundException('Listing not found after update');
      }

      const listingDto = this.mapListing(refreshed);
      return this.applyListingTranslations(refreshed, listingDto);
    });
  }

  async getListingById(listingId: string, userId?: string): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: listingWithRelations.include,
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    let isFavorite = false;
    if (userId) {
      const favoriteIds = await this.getFavoriteListingIds(userId, [listing.id]);
      isFavorite = favoriteIds.has(listing.id);
    }

    const dto = this.mapListing(listing, { isFavorite });
    return this.applyListingTranslations(listing, dto);
  }

  async getListingBySlug(slug: string, userId?: string): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { slug },
      include: listingWithRelations.include,
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    let isFavorite = false;
    if (userId) {
      const favoriteIds = await this.getFavoriteListingIds(userId, [listing.id]);
      isFavorite = favoriteIds.has(listing.id);
    }

    const dto = this.mapListing(listing, { isFavorite });
    return this.applyListingTranslations(listing, dto);
  }

  /**
   * Calculate bounding box for distance filtering.
   * Returns min/max lat/lng that approximate a circle of given radius.
   */
  private calculateBoundingBox(
    centerLat: number,
    centerLng: number,
    radiusMeters: number,
  ): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
    // Convert radius to degrees (approximate)
    // 1 degree latitude ≈ 111,000 meters
    const latDelta = radiusMeters / 111000;
    // Longitude delta depends on latitude
    const lngDelta = radiusMeters / (111000 * Math.cos((centerLat * Math.PI) / 180));

    return {
      minLat: centerLat - latDelta,
      maxLat: centerLat + latDelta,
      minLng: centerLng - lngDelta,
      maxLng: centerLng + lngDelta,
    };
  }

  /**
   * Calculate distance between two points using Haversine formula.
   * Returns distance in meters.
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const earthRadius = 6371000; // meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  /**
   * Sort events by temporal priority:
   * 1. Ongoing events (started but not ended) - sorted by eventStart asc
   * 2. Current/Today events (starting today but not yet started) - sorted by eventStart asc
   * 3. Future events (starting after today) - sorted by eventStart asc
   * Non-event listings (no eventStart) and past events are excluded from the result.
   */
  private sortEventsByTemporalPriority(rows: ListingWithRelations[]): ListingWithRelations[] {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const getEventPriority = (listing: ListingWithRelations): number => {
      if (!listing.eventStart) {
        return 4; // No event date
      }

      const eventStart = new Date(listing.eventStart);
      const eventEnd = listing.eventEnd ? new Date(listing.eventEnd) : null;

      // Ongoing: started and not yet ended
      if (eventStart <= now && (eventEnd === null || eventEnd > now)) {
        return 1;
      }

      // Current/Today: starts today but hasn't started yet
      if (eventStart >= todayStart && eventStart < todayEnd && eventStart > now) {
        return 2;
      }

      // Future: starts after today
      if (eventStart >= todayEnd) {
        return 3;
      }

      // Past events (ended)
      return 5;
    };

    // Exclude non-event listings (priority 4) and past events (priority 5)
    const filtered = rows.filter((listing) => {
      const priority = getEventPriority(listing);
      return priority >= 1 && priority <= 3;
    });

    return filtered.sort((a, b) => {
      const priorityA = getEventPriority(a);
      const priorityB = getEventPriority(b);

      // Sort by priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Within the same priority, sort by eventStart ascending (soonest first)
      const startA = a.eventStart ? new Date(a.eventStart).getTime() : Infinity;
      const startB = b.eventStart ? new Date(b.eventStart).getTime() : Infinity;
      return startA - startB;
    });
  }

  private buildListingWhere(
    filter: ListingFilterDto = {} as ListingFilterDto,
    searchListingIds?: string[],
  ): Prisma.ListingWhereInput {
    const where: Prisma.ListingWhereInput = {};
    const andConditions: Prisma.ListingWhereInput[] = [];

    // Search handling: includes original fields and translated content matches
    // Uses normalized search to handle punctuation variations (e.g., "L Oistreia" matches "L'Oistreia")
    if (filter.search) {
      const searchTerm = filter.search.trim();
      const searchVariations = this.generateSearchVariations(searchTerm);
      const searchConditions: Prisma.ListingWhereInput[] = [];

      // Search each variation in title, summary, and content fields
      for (const variation of searchVariations) {
        searchConditions.push(
          { title: { contains: variation, mode: 'insensitive' } },
          { summary: { contains: variation, mode: 'insensitive' } },
          { content: { contains: variation, mode: 'insensitive' } },
        );
      }

      // Include listings found via translated content search
      if (searchListingIds && searchListingIds.length > 0) {
        searchConditions.push({ id: { in: searchListingIds } });
      }

      where.OR = searchConditions;
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.moderationStatus) {
      where.moderationStatus = filter.moderationStatus;
    }

    if (filter.visibility) {
      where.visibility = filter.visibility;
    }

    if (filter.sourceType) {
      where.sourceType = filter.sourceType;
    }

    if (filter.isFeatured !== undefined) {
      where.isFeatured = filter.isFeatured;
    }

    if (filter.languageCodes?.length) {
      where.languageCode = { in: filter.languageCodes };
    }

    if (filter.cityIds?.length) {
      where.cities = {
        some: {
          cityId: {
            in: filter.cityIds,
          },
        },
      };
    }

    // Category filtering is independent of quickFilter - "see-all" is a UI hint,
    // not a special backend behavior. If categoryIds are provided, always apply them.
    if (filter.categoryIds?.length) {
      where.categories = {
        some: {
          categoryId: {
            in: filter.categoryIds,
          },
        },
      };
    }

    // Quick filter (Filter model) filtering - narrow listings by filter IDs
    if (filter.filterIds?.length) {
      where.filters = {
        some: {
          filterId: {
            in: filter.filterIds,
          },
        },
      };
    }

    // Handle "nearby" quick filter with distance-based filtering
    if (
      filter.quickFilter === 'nearby' &&
      filter.userLat !== undefined &&
      filter.userLng !== undefined
    ) {
      const radiusMeters = filter.radiusMeters ?? null;

      if (radiusMeters !== null) {
        const bbox = this.calculateBoundingBox(filter.userLat, filter.userLng, radiusMeters);

        andConditions.push({
          AND: [
            {
              geoLat: {
                not: null,
                gte: new Prisma.Decimal(bbox.minLat),
                lte: new Prisma.Decimal(bbox.maxLat),
              },
            },
            {
              geoLng: {
                not: null,
                gte: new Prisma.Decimal(bbox.minLng),
                lte: new Prisma.Decimal(bbox.maxLng),
              },
            },
          ],
        });
      } else {
        // No radius: only require non-null coordinates for distance sorting
        andConditions.push({
          AND: [{ geoLat: { not: null } }, { geoLng: { not: null } }],
        });
      }
    }

    if (filter.publishAfter || filter.publishBefore) {
      andConditions.push({
        publishAt: {
          ...(filter.publishAfter ? { gte: new Date(filter.publishAfter) } : {}),
          ...(filter.publishBefore ? { lte: new Date(filter.publishBefore) } : {}),
        },
      });
    }

    if (filter.upcomingAfter || filter.upcomingBefore) {
      const upcomingConditions: Prisma.ListingWhereInput[] = [];

      upcomingConditions.push({
        eventStart: {
          ...(filter.upcomingAfter ? { gte: new Date(filter.upcomingAfter) } : {}),
          ...(filter.upcomingBefore ? { lte: new Date(filter.upcomingBefore) } : {}),
        },
      });

      const intervalFilter: Prisma.ListingTimeIntervalWhereInput = {};

      if (filter.upcomingAfter) {
        intervalFilter.end = { gte: new Date(filter.upcomingAfter) };
      }

      if (filter.upcomingBefore) {
        intervalFilter.start = { lte: new Date(filter.upcomingBefore) };
      }

      if (Object.keys(intervalFilter).length) {
        upcomingConditions.push({
          timeIntervals: {
            some: intervalFilter,
          },
        });
      }

      andConditions.push({
        OR: upcomingConditions,
      });
    }

    if (andConditions.length) {
      where.AND = andConditions;
    }

    return where;
  }

  async listListings(filter: ListingFilterDto = {} as ListingFilterDto, userId?: string) {
    const noLimit = filter.noLimit === true;
    const page = noLimit ? 1 : filter.page && filter.page > 0 ? filter.page : 1;
    const pageSizeCandidate = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 20;
    const pageSize = noLimit ? 500 : Math.min(pageSizeCandidate, 100);
    const skip = (page - 1) * pageSize; // 0 when noLimit (page=1)

    // Kodier Woche categories must only ever return data inside the festival
    // window (DO_KW_STARTDATE / DO_KW_ENDDATE). Any user-supplied dates are
    // clamped into the window, so callers can narrow further but never escape it.
    await this.applyKodierWocheTemporalBounds(filter);

    // Search in translations table for matching listing IDs (for translated content search)
    // Uses normalized search to handle punctuation variations
    let translatedListingIds: string[] = [];
    if (filter.search) {
      const searchTerm = filter.search.trim();
      const searchVariations = this.generateSearchVariations(searchTerm);
      const locale = this.i18nService.getLanguage();

      // Only search translations for the current user's locale to ensure relevant results
      if (locale) {
        // Search for all variations in translations
        const translationConditions: Prisma.TranslationWhereInput[] = searchVariations.map(
          (variation) =>
            ({
              entityType: 'listing',
              field: { in: ['title', 'summary', 'content'] },
              locale: locale,
              value: { contains: variation, mode: 'insensitive' as const },
            }) as Prisma.TranslationWhereInput,
        );

        const matchingTranslations = await this.prisma.translation.findMany({
          where: {
            OR: translationConditions,
          },
          select: { entityId: true },
          distinct: ['entityId'],
        });
        translatedListingIds = matchingTranslations
          .map((t) => t.entityId)
          .filter((id): id is string => id !== null);
      }
    }

    const where = this.buildListingWhere(filter, translatedListingIds);

    const allowedSortFields = new Set([
      'createdAt',
      'publishAt',
      'eventStart',
      'updatedAt',
      'featuredUntil',
    ]);
    const sortByField =
      filter.sortBy && allowedSortFields.has(filter.sortBy) ? filter.sortBy : 'createdAt';
    const sortDirection = filter.sortDirection ?? 'desc';

    // For "nearby" filter, we'll sort by distance after fetching
    // So we don't set orderBy here if sorting by distance
    const shouldSortByDistance =
      filter.quickFilter === 'nearby' &&
      filter.userLat !== undefined &&
      filter.userLng !== undefined;

    // For event sorting, we need to fetch all records and sort in memory
    const shouldSortByEventPriority = filter.eventSort === true;

    const orderBy: Prisma.ListingOrderByWithRelationInput = {};
    if (!shouldSortByDistance && !shouldSortByEventPriority) {
      (orderBy as Record<string, unknown>)[sortByField] = sortDirection;
    }

    // Determine if we need in-memory sorting (distance or event priority)
    const needsInMemorySorting = shouldSortByDistance || shouldSortByEventPriority;

    // Fetch more results if sorting in memory (we'll filter and sort in memory),
    // otherwise rely on database-level pagination.
    // For event sorting, we need to fetch all records to ensure correct pagination
    const fetchLimit = needsInMemorySorting ? (noLimit ? 500 : 1000) : pageSize;

    let rows: ListingWithRelations[];
    let total: number;

    if (needsInMemorySorting) {
      // No DB-level pagination, we need all records to sort correctly
      [rows, total] = await Promise.all([
        this.prisma.listing.findMany({
          where,
          include: listingWithRelations.include,
          take: fetchLimit,
          ...(Object.keys(orderBy).length > 0 ? { orderBy } : {}),
        }),
        this.prisma.listing.count({ where }),
      ]);
    } else {
      // Standard DB-level pagination
      [rows, total] = await Promise.all([
        this.prisma.listing.findMany({
          where,
          include: listingWithRelations.include,
          orderBy,
          skip,
          take: pageSize,
        }),
        this.prisma.listing.count({ where }),
      ]);
    }

    // Sort by distance if needed
    let sortedRows = rows;
    let actualTotal = total;
    if (shouldSortByDistance && filter.userLat !== undefined && filter.userLng !== undefined) {
      const radiusMeters = filter.radiusMeters ?? null;
      const itemsWithDistance = rows
        .map((row) => {
          const lat = this.toNumber(row.geoLat);
          const lng = this.toNumber(row.geoLng);
          let distance: number | null = null;

          if (lat !== null && lng !== null) {
            distance = this.calculateDistance(filter.userLat!, filter.userLng!, lat, lng);
          }

          return { row, distance };
        })
        .filter(
          (item) =>
            item.distance !== null && (radiusMeters === null || item.distance <= radiusMeters),
        );

      // Filter out expired events and events without eventStart (only for EVENT type listings)
      const now = new Date();
      const validEvents = itemsWithDistance.filter((item) => {
        const listing = item.row;

        // Check if this listing is an event type
        const isEventListing = listing.categories?.some(
          (lc) => lc.category?.type === CategoryType.EVENT,
        );

        // Only apply event filtering to event listings
        if (!isEventListing) {
          return true; // Keep non-event listings
        }

        // For event listings, remove events without eventStart
        if (!listing.eventStart) {
          return false;
        }

        const eventStart = new Date(listing.eventStart);
        const eventEnd = listing.eventEnd ? new Date(listing.eventEnd) : null;

        // Remove expired events
        // If eventEnd exists, check if it's in the past
        // If no eventEnd, check if eventStart is in the past
        if (eventEnd) {
          return eventEnd >= now;
        } else {
          return eventStart >= now;
        }
      });

      // Update total to reflect actual filtered count
      actualTotal = validEvents.length;

      // Sort by distance (ascending) - nearest listings first
      // Note: We intentionally do NOT apply event priority sorting here
      // because "nearby" filter means distance is the primary sort criteria
      const distanceSortedRows = validEvents
        .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
        .map((item) => item.row);

      // Apply pagination after sorting
      sortedRows = distanceSortedRows.slice(skip, skip + pageSize);
    } else if (shouldSortByEventPriority) {
      // Sort by event temporal priority and apply pagination
      const eventSortedRows = this.sortEventsByTemporalPriority(rows);
      actualTotal = eventSortedRows.length;
      sortedRows = eventSortedRows.slice(skip, skip + pageSize);
    }

    let favoriteIds: Set<string> | undefined;
    if (userId) {
      favoriteIds = await this.getFavoriteListingIds(
        userId,
        sortedRows.map((row) => row.id),
      );
    }

    const items = await this.applyListingTranslationsBatch(
      sortedRows.map((row) => ({
        listing: row,
        dto: this.mapListing(row, { isFavorite: favoriteIds?.has(row.id) ?? false }),
      })),
    );
    const totalPages = Math.max(1, Math.ceil(actualTotal / pageSize));

    return {
      items,
      meta: {
        page,
        pageSize,
        total: actualTotal,
        totalPages,
      },
    };
  }

  async moderateListing(
    listingId: string,
    moderatorId: string,
    moderationDto: ListingModerationDto,
  ): Promise<ListingResponseDto> {
    const now = new Date();
    const existing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        publishAt: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Listing not found');
    }

    const updateData: Prisma.ListingUpdateInput = {
      moderationStatus: moderationDto.moderationStatus,
      reviewNotes: moderationDto.reviewNotes ?? null,
      reviewedBy: moderatorId,
      reviewedAt: now,
      lastEditedByUserId: moderatorId,
    };

    switch (moderationDto.moderationStatus) {
      case ListingModerationStatus.APPROVED:
        updateData.status = moderationDto.publishStatus ?? ListingStatus.APPROVED;
        updateData.isArchived = false;
        if (
          !existing.publishAt &&
          (moderationDto.publishStatus === ListingStatus.APPROVED || !moderationDto.publishStatus)
        ) {
          updateData.publishAt = now;
        }
        break;
      case ListingModerationStatus.REJECTED:
        updateData.status = ListingStatus.REJECTED;
        break;
      case ListingModerationStatus.CHANGES_REQUESTED:
        updateData.status = ListingStatus.PENDING;
        break;
      case ListingModerationStatus.ARCHIVED:
        updateData.status = ListingStatus.DELETED;
        updateData.isArchived = true;
        updateData.archivedAt = now;
        updateData.archivedBy = moderatorId;
        break;
      default:
        updateData.status = moderationDto.publishStatus ?? ListingStatus.PENDING;
    }

    const listing = await this.prisma.listing.update({
      where: { id: listingId },
      data: updateData,
      include: listingWithRelations.include,
    });

    const listingDto = this.mapListing(listing);
    return this.applyListingTranslations(listing, listingDto);
  }

  async submitListingForReview(listingId: string, userId: string): Promise<ListingResponseDto> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    if (listing.createdByUserId !== userId) {
      throw new ForbiddenException('You can only submit your own listings');
    }

    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        status: ListingStatus.PENDING,
        moderationStatus: ListingModerationStatus.PENDING,
        reviewNotes: null,
        reviewedBy: null,
        reviewedAt: null,
        lastEditedByUserId: userId,
      },
      include: listingWithRelations.include,
    });

    const updatedListing = updated as ListingWithRelations;
    const listingDto = this.mapListing(updatedListing);
    return this.applyListingTranslations(updatedListing, listingDto);
  }

  async approveListing(listingId: string, moderatorId: string, body: ListingModerationActionDto) {
    return this.moderateListing(listingId, moderatorId, {
      moderationStatus: ListingModerationStatus.APPROVED,
      publishStatus: body.publishStatus ?? ListingStatus.APPROVED,
      reviewNotes: body.reviewNotes,
    });
  }

  async requestListingChanges(
    listingId: string,
    moderatorId: string,
    body: ListingModerationActionDto,
  ) {
    return this.moderateListing(listingId, moderatorId, {
      moderationStatus: ListingModerationStatus.CHANGES_REQUESTED,
      publishStatus: body.publishStatus ?? ListingStatus.PENDING,
      reviewNotes: body.reviewNotes,
    });
  }

  async rejectListing(listingId: string, moderatorId: string, reviewNotes?: string) {
    return this.moderateListing(listingId, moderatorId, {
      moderationStatus: ListingModerationStatus.REJECTED,
      publishStatus: ListingStatus.REJECTED,
      reviewNotes,
    });
  }

  async archiveListing(listingId: string, moderatorId: string, reviewNotes?: string) {
    return this.moderateListing(listingId, moderatorId, {
      moderationStatus: ListingModerationStatus.ARCHIVED,
      publishStatus: ListingStatus.DELETED,
      reviewNotes,
    });
  }

  async toggleFavorite(userId: string, listingId: string, isFavorite: boolean) {
    this.logger.log(
      `${isFavorite ? 'Adding' : 'Removing'} favorite: userId=${userId}, listingId=${listingId}`,
    );

    try {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        include: listingWithRelations.include,
      });

      if (!listing) {
        throw new NotFoundException({
          message: 'Listing not found',
          errorCode: 'LISTING_NOT_FOUND',
        });
      }

      if (isFavorite) {
        // Add favorite
        const favorite = await this.prisma.userFavorite.upsert({
          where: {
            userId_listingId: {
              userId,
              listingId,
            },
          },
          update: {},
          create: {
            userId,
            listingId,
          },
          include: {
            listing: {
              include: listingWithRelations.include,
            },
          },
        });

        this.logger.log(`Favorite added successfully: ${favorite.id}`);
        const favListing = favorite.listing as ListingWithRelations;
        const listingDto = await this.applyListingTranslations(
          favListing,
          this.mapListing(favListing, { isFavorite: true }),
        );
        return {
          id: favorite.id,
          userId: favorite.userId,
          listingId: favorite.listingId,
          listing: listingDto,
          createdAt: favorite.createdAt,
        };
      } else {
        // Remove favorite
        const favorite = await this.prisma.userFavorite.findUnique({
          where: {
            userId_listingId: {
              userId,
              listingId,
            },
          },
        });

        if (!favorite) {
          throw new NotFoundException('Favorite not found');
        }

        await this.prisma.userFavorite.delete({
          where: {
            userId_listingId: {
              userId,
              listingId,
            },
          },
        });

        this.logger.log(`Favorite removed successfully`);
        const message = this.i18nService.translate('success.LISTING_FAVORITE_REMOVED');
        return { success: true, message };
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException({
          message: 'Listing already in favorites',
          errorCode: 'LISTING_ALREADY_IN_FAVORITES',
        });
      }
      this.logger.error(`Failed to ${isFavorite ? 'add' : 'remove'} favorite`, error);
      throw error;
    }
  }

  async addFavorite(userId: string, listingId: string) {
    this.logger.log(`Adding favorite: userId=${userId}, listingId=${listingId}`);

    try {
      const listing = await this.prisma.listing.findUnique({
        where: { id: listingId },
        include: listingWithRelations.include,
      });

      if (!listing) {
        throw new NotFoundException({
          message: 'Listing not found',
          errorCode: 'LISTING_NOT_FOUND',
        });
      }

      const favorite = await this.prisma.userFavorite.upsert({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
        update: {},
        create: {
          userId,
          listingId,
        },
        include: {
          listing: {
            include: listingWithRelations.include,
          },
        },
      });

      this.logger.log(`Favorite added successfully: ${favorite.id}`);
      const addedListing = favorite.listing as ListingWithRelations;
      const listingDto = await this.applyListingTranslations(
        addedListing,
        this.mapListing(addedListing, { isFavorite: true }),
      );
      return {
        id: favorite.id,
        userId: favorite.userId,
        listingId: favorite.listingId,
        listing: listingDto,
        createdAt: favorite.createdAt,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException({
          message: 'Listing already in favorites',
          errorCode: 'LISTING_ALREADY_IN_FAVORITES',
        });
      }
      this.logger.error('Failed to add favorite', error);
      throw error;
    }
  }

  async removeFavorite(userId: string, listingId: string) {
    this.logger.log(`Removing favorite: userId=${userId}, listingId=${listingId}`);

    try {
      const favorite = await this.prisma.userFavorite.findUnique({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      });

      if (!favorite) {
        throw new NotFoundException({
          message: 'Favorite not found',
          errorCode: 'LISTING_FAVORITE_NOT_FOUND',
        });
      }

      await this.prisma.userFavorite.delete({
        where: {
          userId_listingId: {
            userId,
            listingId,
          },
        },
      });

      this.logger.log(`Favorite removed successfully`);
      const message = this.i18nService.translate('success.LISTING_FAVORITE_REMOVED');
      return { success: true, message };
    } catch (error: any) {
      this.logger.error('Failed to remove favorite', error);
      throw error;
    }
  }

  async getUserFavorites(userId: string, filter: ListingFilterDto = {} as ListingFilterDto) {
    this.logger.log(`Getting favorites for userId: ${userId}`, filter);

    const noLimit = filter.noLimit === true;
    const page = noLimit ? 1 : filter.page && filter.page > 0 ? filter.page : 1;
    const pageSizeCandidate = filter.pageSize && filter.pageSize > 0 ? filter.pageSize : 20;
    const pageSize = noLimit ? 500 : Math.min(pageSizeCandidate, 100);
    const skip = (page - 1) * pageSize;

    let translatedListingIds: string[] = [];
    if (filter.search) {
      const searchTerm = filter.search.trim();
      const searchVariations = this.generateSearchVariations(searchTerm);
      const locale = this.i18nService.getLanguage();

      if (locale) {
        const translationConditions: Prisma.TranslationWhereInput[] = searchVariations.map(
          (variation) =>
            ({
              entityType: 'listing',
              field: { in: ['title', 'summary', 'content'] },
              locale: locale,
              value: { contains: variation, mode: 'insensitive' as const },
            }) as Prisma.TranslationWhereInput,
        );

        const matchingTranslations = await this.prisma.translation.findMany({
          where: {
            OR: translationConditions,
          },
          select: { entityId: true },
          distinct: ['entityId'],
        });
        translatedListingIds = matchingTranslations
          .map((t) => t.entityId)
          .filter((id): id is string => id !== null);
      }
    }

    const listingWhere = this.buildListingWhere(filter, translatedListingIds);

    const where: Prisma.UserFavoriteWhereInput = {
      userId,
      ...(Object.keys(listingWhere).length > 0 ? { listing: listingWhere } : {}),
    };

    const allowedSortFields = new Set([
      'createdAt',
      'publishAt',
      'eventStart',
      'updatedAt',
      'featuredUntil',
    ]);
    const sortByField =
      filter.sortBy && allowedSortFields.has(filter.sortBy) ? filter.sortBy : 'createdAt';
    const sortDirection = filter.sortDirection ?? 'desc';

    const shouldSortByDistance =
      filter.quickFilter === 'nearby' &&
      filter.userLat !== undefined &&
      filter.userLng !== undefined;

    const shouldSortByEventPriority = filter.eventSort === true;

    const useDefaultFavoriteOrder =
      !shouldSortByDistance &&
      !shouldSortByEventPriority &&
      (!filter.sortBy || !allowedSortFields.has(filter.sortBy));

    const useListingDbOrder =
      !shouldSortByDistance &&
      !shouldSortByEventPriority &&
      Boolean(filter.sortBy && allowedSortFields.has(filter.sortBy));

    const needsInMemorySorting = shouldSortByDistance || shouldSortByEventPriority;

    const fetchLimit = needsInMemorySorting ? (noLimit ? 500 : 1000) : pageSize;

    let orderByForQuery: Prisma.UserFavoriteOrderByWithRelationInput | undefined;
    if (!needsInMemorySorting) {
      if (useListingDbOrder) {
        orderByForQuery = {
          listing: {
            [sortByField]: sortDirection,
          } as Prisma.ListingOrderByWithRelationInput,
        };
      } else if (useDefaultFavoriteOrder) {
        orderByForQuery = { createdAt: 'desc' };
      }
    }

    type FavoriteRow = Prisma.UserFavoriteGetPayload<{
      include: {
        listing: typeof listingWithRelations;
      };
    }>;

    let favoritesForResponse: FavoriteRow[];
    let actualTotal: number;

    if (!needsInMemorySorting) {
      const [favorites, total] = await Promise.all([
        this.prisma.userFavorite.findMany({
          where,
          include: {
            listing: {
              include: listingWithRelations.include,
            },
          },
          orderBy: orderByForQuery,
          skip,
          take: pageSize,
        }),
        this.prisma.userFavorite.count({ where }),
      ]);
      favoritesForResponse = favorites;
      actualTotal = total;
    } else {
      const [favoritesBatch, totalCount] = await Promise.all([
        this.prisma.userFavorite.findMany({
          where,
          include: {
            listing: {
              include: listingWithRelations.include,
            },
          },
          take: fetchLimit,
        }),
        this.prisma.userFavorite.count({ where }),
      ]);

      actualTotal = totalCount;

      if (shouldSortByDistance && filter.userLat !== undefined && filter.userLng !== undefined) {
        const radiusMeters = filter.radiusMeters ?? null;
        const itemsWithDistance = favoritesBatch
          .map((f) => {
            const row = f.listing as ListingWithRelations;
            const lat = this.toNumber(row.geoLat);
            const lng = this.toNumber(row.geoLng);
            let distance: number | null = null;

            if (lat !== null && lng !== null) {
              distance = this.calculateDistance(filter.userLat!, filter.userLng!, lat, lng);
            }

            return { f, distance };
          })
          .filter(
            (item) =>
              item.distance !== null && (radiusMeters === null || item.distance <= radiusMeters),
          );

        const now = new Date();
        const validEvents = itemsWithDistance.filter((item) => {
          const listing = item.f.listing as ListingWithRelations;

          const isEventListing = listing.categories?.some(
            (lc) => lc.category?.type === CategoryType.EVENT,
          );

          if (!isEventListing) {
            return true;
          }

          if (!listing.eventStart) {
            return false;
          }

          const eventStart = new Date(listing.eventStart);
          const eventEnd = listing.eventEnd ? new Date(listing.eventEnd) : null;

          if (eventEnd) {
            return eventEnd >= now;
          }
          return eventStart >= now;
        });

        actualTotal = validEvents.length;

        const distanceSortedFavorites = validEvents
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
          .map((item) => item.f);

        favoritesForResponse = distanceSortedFavorites.slice(skip, skip + pageSize);
      } else if (shouldSortByEventPriority) {
        const rows = favoritesBatch.map((f) => f.listing as ListingWithRelations);
        const sortedListings = this.sortEventsByTemporalPriority(rows);
        const listingIdToFavorite = new Map(favoritesBatch.map((f) => [f.listingId, f]));
        const orderedFavorites = sortedListings
          .map((l) => listingIdToFavorite.get(l.id))
          .filter((f): f is FavoriteRow => f !== undefined);

        actualTotal = orderedFavorites.length;
        favoritesForResponse = orderedFavorites.slice(skip, skip + pageSize);
      } else {
        favoritesForResponse = favoritesBatch.slice(skip, skip + pageSize);
      }
    }

    const items = await this.applyListingTranslationsBatch(
      favoritesForResponse.map((f) => {
        const listing = f.listing as ListingWithRelations;
        return {
          listing,
          dto: this.mapListing(listing, { isFavorite: true }),
        };
      }),
    );

    const totalPages = Math.max(1, Math.ceil(actualTotal / pageSize));

    return {
      items,
      meta: {
        page,
        pageSize,
        total: actualTotal,
        totalPages,
      },
    };
  }
}
