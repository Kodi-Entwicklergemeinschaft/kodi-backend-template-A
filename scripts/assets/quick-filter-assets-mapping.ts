/**
 * Quick Filter Assets Mapping
 *
 * Maps quick filter keys to their images per category.
 * This file is used by seed/upload scripts to manage quick filter images.
 */

export const ASSETS_BASE_URL = process.env.ASSETS_BASE_URL || '/assets';

export interface QuickFilterAssetMapping {
  imageFileName: string;
}

/**
 * Quick filter images by category and filter key.
 *
 * Structure: Record<categorySlug, Record<filterKey, QuickFilterAssetMapping>>
 */
export const QUICK_FILTER_ASSETS: Record<string, Record<string, QuickFilterAssetMapping>> = {
  // Shopping quick filters
  shopping: {
    nearby: { imageFileName: 'shopping-nearby.webp' },
    'see-all': { imageFileName: 'shopping-see-all.webp' },
  },

  // Food & Drink quick filters
  'food-and-drink': {
    nearby: { imageFileName: 'food-and-drink-nearby.webp' },
    'see-all': { imageFileName: 'food-and-drink-see-all.webp' },
  },

  // Culture quick filters
  culture: {
    nearby: { imageFileName: 'culture-nearby.webp' },
    'see-all': { imageFileName: 'culture-see-all.webp' },
  },

  // Events quick filters (uses culture images as fallback for now)
  events: {
    nearby: { imageFileName: 'culture-nearby.webp' },
    'see-all': { imageFileName: 'culture-see-all.webp' },
  },

  // Show Me More quick filters (uses culture images as fallback for now)
  'show-me-more': {
    nearby: { imageFileName: 'culture-nearby.webp' },
    'see-all': { imageFileName: 'culture-see-all.webp' },
  },
};

/**
 * Get quick filter image URL for a category and filter key.
 *
 * @param categorySlug - Category slug (e.g., 'shopping', 'food-and-drink')
 * @param filterKey - Quick filter key (e.g., 'nearby', 'see-all')
 * @returns Image URL or null if not found
 */
export function getQuickFilterImageUrl(categorySlug: string, filterKey: string): string | null {
  const categoryAssets = QUICK_FILTER_ASSETS[categorySlug];
  if (!categoryAssets) return null;

  const filterAsset = categoryAssets[filterKey];
  if (!filterAsset) return null;

  // If already a full URL (from storage), return as-is
  if (
    filterAsset.imageFileName.startsWith('http://') ||
    filterAsset.imageFileName.startsWith('https://')
  ) {
    return filterAsset.imageFileName;
  }

  return `${ASSETS_BASE_URL}/quick-filters/${filterAsset.imageFileName}`;
}

/**
 * Get all quick filter image URLs for a category.
 *
 * @param categorySlug - Category slug
 * @returns Record mapping filter keys to their image URLs
 */
export function getQuickFilterImagesForCategory(
  categorySlug: string,
): Record<string, string | null> {
  const categoryAssets = QUICK_FILTER_ASSETS[categorySlug];
  if (!categoryAssets) return {};

  const result: Record<string, string | null> = {};
  for (const filterKey of Object.keys(categoryAssets)) {
    result[filterKey] = getQuickFilterImageUrl(categorySlug, filterKey);
  }
  return result;
}
