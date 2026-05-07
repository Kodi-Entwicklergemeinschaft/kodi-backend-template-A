/**
 * Category Assets Mapping
 *
 * Maps category slugs to their corresponding asset files, display names, colors, and display order.
 * This file is used by seed scripts to populate category styling fields.
 */

// Base URL for assets (adjust based on your CDN/storage setup)
// For now, using relative paths that can be resolved to full URLs by the frontend
export const ASSETS_BASE_URL = process.env.ASSETS_BASE_URL || '/assets';

export interface CategoryAssetMapping {
  slug: string;
  /**
   * File name inside scripts/assets/categories after processing.
   */
  imageFileName: string;
  /**
   * Icon SVG file name inside scripts/assets/icons folder.
   */
  iconFileName?: string;
  displayName?: string; // Kodi-specific display name
  subtitle?: string;
  description?: string;
  headerBackgroundColor?: string;
  contentBackgroundColor?: string;
  displayOrder?: number; // For city categories
  visibility?: 'PUBLIC' | 'CITIZEN' | 'GUEST_ONLY';
}

/**
 * Mapping of category slugs to their asset files and styling
 * Based on Musterbilder folder structure
 */
export const CATEGORY_ASSETS: Record<string, CategoryAssetMapping> = {
  // Kodier Woche (display order 0 — first in city category list)
  'kodier-woche': {
    slug: 'kodier-woche',
    imageFileName: 'kodier-woche.webp',
    iconFileName: 'kodier-woche.webp',
    displayName: 'KODIER WOCHE',
    subtitle: '20 -28 Juni 2026',
    description: 'Deine KiWo Erlebniswelt',
    headerBackgroundColor: '#00223f',
    contentBackgroundColor: '#00223f',
    displayOrder: 0,
  },

  // Kodier Verwaltung - "KODIER VERWALTUNG"
  'kodier-verwaltung': {
    slug: 'kodier-verwaltung',
    imageFileName: 'kodier-verwaltung.webp',
    iconFileName: 'show-me-more.svg',
    displayName: 'KODIER VERWALTUNG',
    subtitle: 'Ämterübersicht',
    description: 'Was erledige ich wo?',
    headerBackgroundColor: '#728ABB',
    contentBackgroundColor: '#FCE7F3',
    displayOrder: 1,
    visibility: 'CITIZEN',
  },

  // Tours - "YOUR WAY THROUGH KODI" / "DEIN WEG DURCH KODI" (guest only)
  tours: {
    slug: 'tours',
    imageFileName: 'tours.webp',
    iconFileName: 'tours.svg',
    displayName: 'YOUR WAY THROUGH KODI',
    subtitle: 'Blue line',
    description: '67 activities in your city',
    headerBackgroundColor: '#00A1A3', // Green
    contentBackgroundColor: '#D1FAE5',
    displayOrder: 2,
    visibility: 'GUEST_ONLY',
  },

  // Food & Drink - "EATING & DRINKING"
  'food-and-drink': {
    slug: 'food-and-drink',
    imageFileName: 'food-and-drink.webp',
    iconFileName: 'food-and-drink.svg',
    displayName: 'EATING & DRINKING',
    subtitle: "Kodi's diverse restaurant scene",
    description: 'North German and international cuisine',
    headerBackgroundColor: '#B0CB52', // Red
    contentBackgroundColor: '#FEE2E2',
    displayOrder: 3,
  },

  // Shopping - "SHOP TO YOUR HEART'S CONTENT"
  shopping: {
    slug: 'shopping',
    imageFileName: 'shopping.webp',
    iconFileName: 'shopping.svg',
    displayName: "SHOP TO YOUR HEART'S CONTENT",
    subtitle: 'Over 400 stores',
    description: 'In your city center',
    headerBackgroundColor: '#E30059', // Orange
    contentBackgroundColor: '#FFEDD5',
    displayOrder: 4,
  },

  // Culture - "KODI CULTURE"
  culture: {
    slug: 'culture',
    imageFileName: 'culture.webp',
    iconFileName: 'culture.svg',
    displayName: 'KODI CULTURE',
    subtitle: 'Diverse, from the sea to museums',
    description: 'Art, history, music, water',
    headerBackgroundColor: '#728ABB', // Pink
    contentBackgroundColor: '#FCE7F3',
    displayOrder: 5,
  },

  // Show Me More - "SHOW ME MORE" / "ZEIGE MIR MEHR" (visible to guests and citizens)
  'show-me-more': {
    slug: 'show-me-more',
    imageFileName: 'show-me-more.webp',
    iconFileName: 'show-me-more.svg',
    displayName: 'SHOW ME MORE',
    subtitle: 'Everything at a glance',
    description: 'Discover your city with your filters',
    headerBackgroundColor: '#0EA5E9', // Sky blue
    contentBackgroundColor: '#E0F2FE',
    displayOrder: 6,
    visibility: 'PUBLIC',
  },

  // News
  news: {
    slug: 'news',
    imageFileName: 'news.webp',
    displayName: 'News',
    subtitle: 'Latest updates',
    description: 'Latest news and official announcements for your city.',
    headerBackgroundColor: '#1E3A8A', // Blue
    contentBackgroundColor: '#EFF6FF',
    displayOrder: 7,
  },

  // Events
  events: {
    slug: 'events',
    imageFileName: 'events.webp',
    displayName: 'Events',
    subtitle: "What's on",
    description: 'Events, festivals and activities happening in your city.',
    headerBackgroundColor: '#7C3AED', // Purple
    contentBackgroundColor: '#F3E8FF',
    displayOrder: 8,
  },

  // Kodier Woche Events (sub-service of kodier-woche, not shown in city category list)
  'kodier-woche-events': {
    slug: 'kodier-woche-events',
    imageFileName: 'kodier-woche-events.webp',
    iconFileName: 'kodier-woche-events.webp',
    displayName: 'KODIER WOCHE EVENTS',
    headerBackgroundColor: '#00223f',
    contentBackgroundColor: '#00223f',
  },

  // Kodier Woche Eventareale (MAP sub-service — same D1 data, own image)
  'kodier-woche-eventareale': {
    slug: 'kodier-woche-eventareale',
    imageFileName: 'kodier-woche-eventareale.webp',
    iconFileName: 'kodier-woche-eventareale.webp',
    headerBackgroundColor: '#00223f',
    contentBackgroundColor: '#00223f',
  },

  // Food & Drink subcategories
  'food-cafes-bakeries': {
    slug: 'food-cafes-bakeries',
    imageFileName: 'food-cafes-bakeries.webp',
  },
  'food-bars-nightlife': {
    slug: 'food-bars-nightlife',
    imageFileName: 'food-bars-nightlife.webp',
  },
  'food-fish-restaurants': {
    slug: 'food-fish-restaurants',
    imageFileName: 'food-fish-restaurants.webp',
  },
  'food-vegetarian-vegan': {
    slug: 'food-vegetarian-vegan',
    imageFileName: 'food-vegetarian-vegan.webp',
  },

  // Shopping subcategories
  'shopping-city-center': {
    slug: 'shopping-city-center',
    imageFileName: 'shopping-city-center.webp',
  },
  'shopping-clothing': {
    slug: 'shopping-clothing',
    imageFileName: 'shopping-clothing.webp',
  },
  'shopping-conscious-shopping': {
    slug: 'shopping-conscious-shopping',
    imageFileName: 'shopping-conscious-shopping.webp',
  },
  'shopping-for-children': {
    slug: 'shopping-for-children',
    imageFileName: 'shopping-for-children.webp',
  },

  // Culture subcategories
  'culture-excursions': {
    slug: 'culture-excursions',
    imageFileName: 'culture-excursions.webp',
  },
  'culture-on-foot': {
    slug: 'culture-on-foot',
    imageFileName: 'culture-on-foot.webp',
  },
  'culture-bike-tours': {
    slug: 'culture-bike-tours',
    imageFileName: 'culture-bike-tours.webp',
  },
  'culture-museums': {
    slug: 'culture-museums',
    imageFileName: 'culture-museums.webp',
  },
};

export interface CityHeaderMapping {
  key: string;
  primary: string;
  alternatives: string[];
}

/**
 * City header image mapping
 * Primary image for Kodi city header
 */
export const CITY_HEADER_IMAGE: Record<string, CityHeaderMapping> = {
  kodi: {
    key: 'kodi',
    primary: 'city-header-kodi-1.webp',
    alternatives: ['city-header-kodi-2.webp', 'city-header-kodi-3.webp'],
  },
};

/**
 * Get asset URL for a category image (local file path)
 * Note: After upload to storage, this will return storage URLs instead
 */
export function getCategoryImageUrl(fileName: string): string {
  // If fileName is already a full URL (from storage), return as-is
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  // Otherwise, assume it's in the new categories/ folder structure
  return `${ASSETS_BASE_URL}/categories/${fileName}`;
}

/**
 * Get asset URL for a category icon (local file path)
 * Note: After upload to storage, this will return storage URLs instead
 */
export function getCategoryIconUrl(fileName: string): string {
  // If fileName is already a full URL (from storage), return as-is
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
    return fileName;
  }
  // Otherwise, assume it's in the icons/ folder structure
  return `${ASSETS_BASE_URL}/icons/${fileName}`;
}

/**
 * Get city header image URL (local file path)
 * Note: After upload to storage, this will return storage URLs instead
 */
export function getCityHeaderImageUrl(cityName: string): string | null {
  const cityMapping = CITY_HEADER_IMAGE[cityName.toLowerCase() as keyof typeof CITY_HEADER_IMAGE];
  if (!cityMapping) return null;
  // If primary is already a full URL (from storage), return as-is
  if (cityMapping.primary.startsWith('http://') || cityMapping.primary.startsWith('https://')) {
    return cityMapping.primary;
  }
  // Otherwise, assume it's in the new city-headers/ folder structure
  return `${ASSETS_BASE_URL}/city-headers/${cityMapping.primary}`;
}
