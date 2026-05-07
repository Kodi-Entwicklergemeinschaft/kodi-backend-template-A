import { Injectable, Optional } from '@nestjs/common';
import { CategoryQuickFilterDto } from '@kodi/contracts';
import { PrismaCityService } from '@kodi/prisma';
import {
  getQuickFiltersForCategory,
  getQuickFiltersForCity,
  QuickFilterConfig,
} from './category-quick-filters.config';
import { I18nService } from '@kodi/i18n';
import { ConfigService } from '@kodi/config';

@Injectable()
export class CategoryQuickFiltersService {
  constructor(
    @Optional() private readonly cityPrisma: PrismaCityService | null,
    private readonly i18nService: I18nService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get city slug from cityId by querying the city database.
   * Falls back to cityId if city not found or slug unavailable.
   */
  private async getCitySlug(cityId: string): Promise<string> {
    if (!this.cityPrisma) {
      // If PrismaCityService is not available, fall back to cityId
      return cityId.toLowerCase();
    }

    try {
      const city = await this.cityPrisma.city.findUnique({
        where: { id: cityId },
        select: { name: true },
      });

      // Derive a slug-style key from the city name (e.g. "Kodi" -> "kodi")
      if (city?.name) {
        return city.name.toLowerCase().replace(/\s+/g, '-');
      }

      // Last resort: use cityId (not ideal, but won't break)
      return cityId.toLowerCase();
    } catch (error) {
      // If city database query fails, fall back to cityId
      return cityId.toLowerCase();
    }
  }

  /**
   * Get quick filters for a specific root category in a city.
   *
   * @param cityId - City identifier
   * @param rootCategorySlug - Root category slug (e.g., 'shopping', 'events')
   * @returns Array of quick filter DTOs with translated labels
   */
  async getQuickFiltersForCategory(
    cityId: string,
    rootCategorySlug: string,
  ): Promise<CategoryQuickFilterDto[]> {
    const citySlug = await this.getCitySlug(cityId);
    const configs = getQuickFiltersForCategory(citySlug, rootCategorySlug);

    return this.translateQuickFilters(configs);
  }

  /**
   * Get all quick filters for a city, grouped by root category slug.
   *
   * @param cityId - City identifier
   * @returns Record mapping root category slugs to their quick filter DTOs
   */
  async getQuickFiltersForCity(cityId: string): Promise<Record<string, CategoryQuickFilterDto[]>> {
    const citySlug = await this.getCitySlug(cityId);
    const cityConfigs = getQuickFiltersForCity(citySlug);

    const result: Record<string, CategoryQuickFilterDto[]> = {};

    for (const [categorySlug, configs] of Object.entries(cityConfigs)) {
      result[categorySlug] = await this.translateQuickFilters(configs);
    }

    return result;
  }

  /**
   * Translate quick filter labels based on current request language.
   * Falls back to config label if translation not available.
   */
  private async translateQuickFilters(
    configs: QuickFilterConfig[],
  ): Promise<CategoryQuickFilterDto[]> {
    const locale = this.i18nService.getLanguage();
    const defaultLocale = this.configService.get<string>('i18n.defaultLanguage', 'en');

    // If no locale or locale matches default, return configs as-is
    if (!locale || locale === defaultLocale) {
      return configs.map((config) => ({
        key: config.key,
        label: config.label,
        order: config.order,
        imageUrl: config.imageUrl,
        radiusMeters: config.radiusMeters,
        sortByDistance: config.sortByDistance,
      }));
    }

    // Translate labels using i18n service
    // Translation keys follow pattern: `quickFilter.${key}.label`
    const translatedConfigs = await Promise.all(
      configs.map(async (config) => {
        const translationKey = `quickFilter.${config.key}.label`;
        let label = config.label;

        try {
          // Try to get translation via i18n service
          const translated = this.i18nService.translate(translationKey);
          if (translated && translated !== translationKey) {
            label = translated;
          }
        } catch (error) {
          // If translation fails, use original label
        }

        return {
          key: config.key,
          label,
          order: config.order,
          imageUrl: config.imageUrl,
          radiusMeters: config.radiusMeters,
          sortByDistance: config.sortByDistance,
        };
      }),
    );

    return translatedConfigs;
  }
}
