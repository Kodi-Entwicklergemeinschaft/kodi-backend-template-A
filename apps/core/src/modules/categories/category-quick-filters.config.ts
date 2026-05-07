/**
 * Quick filter configuration per city and root category.
 * Keys are in the format: `${citySlug}/${rootCategorySlug}`
 *
 * Example: 'kodi/shopping' means quick filters for Shopping category in Kodi city.
 */
export type QuickFilterConfigKey = `${string}/${string}`;

export interface QuickFilterConfig {
  key: string;
  label: string; // Default label in source language (will be translated via i18n)
  order: number;
  imageUrl?: string; // Image URL for the quick filter (storage URL after upload)
  radiusMeters?: number;
  sortByDistance?: boolean;
}

/**
 * Quick filter configurations by city slug and root category slug.
 *
 * Structure: Record<citySlug, Record<rootCategorySlug, QuickFilterConfig[]>>
 *
 * For now, we define a `default` configuration that is used for all cities
 * unless a city-specific configuration is provided. This avoids relying on
 * city slugs and guarantees quick filters are available.
 */
/**
 * Quick filter image URLs by category and filter key.
 * These are local asset paths that will be replaced with storage URLs after upload.
 */
const QUICK_FILTER_IMAGES: Record<string, Record<string, string>> = {
  shopping: {
    nearby: 'https://kodi.nbg1.your-objectstorage.com/quick-filters/shopping/nearby.webp',
    'see-all': 'https://kodi.nbg1.your-objectstorage.com/quick-filters/shopping/see-all.webp',
  },
  'food-and-drink': {
    nearby: 'https://kodi.nbg1.your-objectstorage.com/quick-filters/food-and-drink/nearby.webp',
    'see-all': 'https://kodi.nbg1.your-objectstorage.com/quick-filters/food-and-drink/see-all.webp',
  },
  culture: {
    nearby: 'https://kodi.nbg1.your-objectstorage.com/quick-filters/culture/nearby.webp',
    'see-all': 'https://kodi.nbg1.your-objectstorage.com/quick-filters/culture/see-all.webp',
  },
};

function getQuickFilterImageUrl(categorySlug: string, filterKey: string): string | undefined {
  return QUICK_FILTER_IMAGES[categorySlug]?.[filterKey];
}

const QUICK_FILTER_CONFIGS: Record<string, Record<string, QuickFilterConfig[]>> = {
  // Default quick filters for all cities
  default: {
    shopping: [
      {
        key: 'nearby',
        label: 'Nearby',
        order: 0,
        imageUrl: getQuickFilterImageUrl('shopping', 'nearby'),
        radiusMeters: 1500,
        sortByDistance: true,
      },
      {
        key: 'see-all',
        label: 'See all',
        order: 999,
        imageUrl: getQuickFilterImageUrl('shopping', 'see-all'),
      },
    ],
    events: [
      {
        key: 'nearby',
        label: 'Nearby',
        order: 0,
        imageUrl: getQuickFilterImageUrl('events', 'nearby'),
        radiusMeters: 1500,
        sortByDistance: true,
      },
      {
        key: 'see-all',
        label: 'See all',
        order: 999,
        imageUrl: getQuickFilterImageUrl('events', 'see-all'),
      },
    ],
    'food-and-drink': [
      {
        key: 'nearby',
        label: 'Nearby',
        order: 0,
        imageUrl: getQuickFilterImageUrl('food-and-drink', 'nearby'),
        radiusMeters: 1500,
        sortByDistance: true,
      },
      {
        key: 'see-all',
        label: 'See all',
        order: 999,
        imageUrl: getQuickFilterImageUrl('food-and-drink', 'see-all'),
      },
    ],
    culture: [
      {
        key: 'nearby',
        label: 'Nearby',
        order: 0,
        imageUrl: getQuickFilterImageUrl('culture', 'nearby'),
        radiusMeters: 1500,
        sortByDistance: true,
      },
      {
        key: 'see-all',
        label: 'See all',
        order: 999,
        imageUrl: getQuickFilterImageUrl('culture', 'see-all'),
      },
    ],
    'show-me-more': [
      {
        key: 'nearby',
        label: 'Nearby',
        order: 0,
        imageUrl: getQuickFilterImageUrl('show-me-more', 'nearby'),
        radiusMeters: 1500,
        sortByDistance: true,
      },
      {
        key: 'see-all',
        label: 'See all',
        order: 999,
        imageUrl: getQuickFilterImageUrl('show-me-more', 'see-all'),
      },
    ],
    'kodier-woche-events': [
      {
        key: 'nearby',
        label: 'Nearby',
        order: 0,
        imageUrl: getQuickFilterImageUrl('kodier-woche-events', 'nearby'),
        sortByDistance: true,
      },
      {
        key: 'see-all',
        label: 'See all',
        order: 999,
        imageUrl: getQuickFilterImageUrl('kodier-woche-events', 'see-all'),
      },
    ],
  },
};

/**
 * Get quick filter configurations for a city and root category.
 *
 * @param citySlug - City slug (e.g., 'kodi')
 * @param rootCategorySlug - Root category slug (e.g., 'shopping', 'events')
 * @returns Array of quick filter configurations, or empty array if none configured
 */
export function getQuickFiltersForCategory(
  citySlug: string,
  rootCategorySlug: string,
): QuickFilterConfig[] {
  const normalizedCitySlug = citySlug.toLowerCase();
  const cityConfigs =
    QUICK_FILTER_CONFIGS[normalizedCitySlug] ?? QUICK_FILTER_CONFIGS.default ?? {};

  return cityConfigs[rootCategorySlug] || [];
}

/**
 * Get all quick filter configurations for a city.
 *
 * @param citySlug - City slug (e.g., 'kodi')
 * @returns Record mapping root category slugs to their quick filter configurations
 */
export function getQuickFiltersForCity(citySlug: string): Record<string, QuickFilterConfig[]> {
  const normalizedCitySlug = citySlug.toLowerCase();
  return QUICK_FILTER_CONFIGS[normalizedCitySlug] ?? QUICK_FILTER_CONFIGS.default ?? {};
}
