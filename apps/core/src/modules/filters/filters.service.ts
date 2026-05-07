import { Injectable } from '@nestjs/common';
import { PrismaCoreService } from '@kodi/prisma';
import { LoggerService } from '@kodi/logger';
import { RedisService } from '@kodi/redis';
import { TranslationService } from '@kodi/translations';
import { I18nService } from '@kodi/i18n';
import {
  FilterQueryDto,
  FilterListResponseDto,
  FilterResponseDto,
  CategoryQuickFilterResponseDto,
  CategoryQuickFilterGroupDto,
  CategoryQuickFilterHeadingDto,
  CategoryQuickFilterItemDto,
} from '@kodi/contracts';
import { Prisma, Filter } from '@prisma/client-core';

@Injectable()
export class FiltersService {
  private static readonly CACHE_PREFIX_QUICK_FILTERS = 'quickfilters:';
  private static readonly CACHE_TTL_QUICK_FILTERS = 1800; // 30 minutes

  constructor(
    private readonly prisma: PrismaCoreService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
    private readonly translationService: TranslationService,
    private readonly i18nService: I18nService,
  ) {
    this.logger.setContext(FiltersService.name);
  }

  async listFilters(query: FilterQueryDto): Promise<FilterListResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const pageSizeCandidate = query.pageSize && query.pageSize > 0 ? query.pageSize : 20;
    const pageSize = Math.min(pageSizeCandidate, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.FilterWhereInput = {};

    if (query.field) {
      where.field = query.field;
    }

    if (query.listingType) {
      where.listingType = query.listingType;
    }

    if (query.provider) {
      where.provider = query.provider;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { value: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
        { label: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.filter.findMany({
        where,
        orderBy: { value: 'asc' },
        skip,
        take: pageSize,
      }),
      this.prisma.filter.count({ where }),
    ]);

    const mappedItems = await this.mapFiltersBatch(items, query.locale);

    return {
      items: mappedItems,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  async getCategoryQuickFilters(
    categoryId: string,
    locale?: string,
  ): Promise<CategoryQuickFilterResponseDto> {
    // Check cache
    const cacheKey = `${FiltersService.CACHE_PREFIX_QUICK_FILTERS}${categoryId}:${locale || 'default'}`;
    const cached = await this.redis.get<CategoryQuickFilterResponseDto>(cacheKey);
    if (cached) return cached;

    const categoryFilterRecords = await this.prisma.categoryFilter.findMany({
      where: {
        categoryId,
        isActive: true,
        filter: { isActive: true },
      },
      include: { filter: true },
      orderBy: [{ group: 'asc' }, { heading: 'asc' }, { displayOrder: 'asc' }],
    });

    // Pre-fetch all filter translations in one query
    let translationMap: import('@kodi/translations').TranslationMap = new Map();
    if (locale) {
      const entities = categoryFilterRecords
        .filter((cf) => locale !== (cf.filter.languageCode || 'de'))
        .map((cf) => ({ entityType: 'Filter', entityId: cf.filter.id }));
      translationMap = await this.translationService.prefetchTranslations(entities, locale);
    }

    // Group by group -> heading -> filters
    const groupMap = new Map<string, Map<string, CategoryQuickFilterItemDto[]>>();

    for (const cf of categoryFilterRecords) {
      const groupKey = cf.group || '__default__';
      const headingKey = cf.heading;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, new Map());
      }
      const headingMap = groupMap.get(groupKey)!;

      if (!headingMap.has(headingKey)) {
        headingMap.set(headingKey, []);
      }

      // Resolve label with translation if needed
      let label = cf.displayName || cf.filter.label || cf.filter.value;
      if (locale && locale !== (cf.filter.languageCode || 'de')) {
        const translatedLabel = this.translationService.getTranslationFromMap(
          translationMap,
          'Filter',
          cf.filter.id,
          'label',
          locale,
          cf.filter.label || cf.filter.value,
          cf.filter.languageCode || 'de',
        );
        if (translatedLabel) {
          label = cf.displayName || translatedLabel;
        }
      }

      headingMap.get(headingKey)!.push({
        id: cf.filter.id,
        value: cf.filter.value,
        label,
        displayName: cf.displayName,
        displayOrder: cf.displayOrder,
      });
    }

    // Build response structure
    const groups: CategoryQuickFilterGroupDto[] = [];

    for (const [groupKey, headingMap] of groupMap) {
      const headings: CategoryQuickFilterHeadingDto[] = [];

      for (const [headingName, filters] of headingMap) {
        const translatedHeading = this.translateHeadingOrGroup('heading', headingName, locale);
        headings.push({
          name: translatedHeading,
          filters: filters.sort((a, b) => a.displayOrder - b.displayOrder),
        });
      }

      const displayGroupKey = groupKey === '__default__' ? null : groupKey;
      const translatedGroup = displayGroupKey
        ? this.translateHeadingOrGroup('group', displayGroupKey, locale)
        : null;

      groups.push({
        name: translatedGroup,
        headings,
      });
    }

    // Sort: null group first, then alphabetically
    groups.sort((a, b) => {
      if (a.name === null) return -1;
      if (b.name === null) return 1;
      return a.name.localeCompare(b.name);
    });

    const result = { groups };
    await this.redis.set(cacheKey, result, FiltersService.CACHE_TTL_QUICK_FILTERS);
    return result;
  }

  /**
   * Translate heading or group name via i18n.
   * Returns original string when locale is not provided or translation not found.
   */
  private translateHeadingOrGroup(type: 'heading' | 'group', key: string, locale?: string): string {
    if (!locale) {
      return key;
    }
    const translationKey = `quickFilter.${type}.${key}`;
    const translated = this.i18nService.translate(translationKey, undefined, locale);
    return translated !== translationKey ? translated : key;
  }

  private async mapFilter(filter: Filter, locale?: string): Promise<FilterResponseDto> {
    let label = filter.label;

    // Resolve translated label if a locale is specified and it differs from source
    if (locale && locale !== (filter.languageCode || 'de')) {
      try {
        const translatedLabel = await this.translationService.getTranslation(
          'Filter',
          filter.id,
          'label',
          locale,
          filter.label || filter.value,
          filter.languageCode || 'de',
        );
        if (translatedLabel) {
          label = translatedLabel;
        }
      } catch (err) {
        this.logger.warn(`Failed to get translation for filter ${filter.id}: ${err}`);
      }
    }

    return {
      id: filter.id,
      provider: filter.provider,
      field: filter.field,
      listingType: filter.listingType,
      value: filter.value,
      label,
      isActive: filter.isActive,
      createdAt: filter.createdAt.toISOString(),
      updatedAt: filter.updatedAt.toISOString(),
    };
  }

  /**
   * Batch translate filters list. One DB query for all translations.
   */
  private async mapFiltersBatch(filters: Filter[], locale?: string): Promise<FilterResponseDto[]> {
    // Pre-fetch translations if locale provided
    let translationMap: import('@kodi/translations').TranslationMap = new Map();
    if (locale) {
      const entities = filters
        .filter((f) => locale !== (f.languageCode || 'de'))
        .map((f) => ({ entityType: 'Filter', entityId: f.id }));
      translationMap = await this.translationService.prefetchTranslations(entities, locale);
    }

    return filters.map((filter) => {
      let label = filter.label;

      if (locale && locale !== (filter.languageCode || 'de')) {
        const translatedLabel = this.translationService.getTranslationFromMap(
          translationMap,
          'Filter',
          filter.id,
          'label',
          locale,
          filter.label || filter.value,
          filter.languageCode || 'de',
        );
        if (translatedLabel) {
          label = translatedLabel;
        }
      }

      return {
        id: filter.id,
        provider: filter.provider,
        field: filter.field,
        listingType: filter.listingType,
        value: filter.value,
        label,
        isActive: filter.isActive,
        createdAt: filter.createdAt.toISOString(),
        updatedAt: filter.updatedAt.toISOString(),
      };
    });
  }
}
