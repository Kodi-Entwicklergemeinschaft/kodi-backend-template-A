#!/usr/bin/env ts-node
/**
 * City Categories Seeding Script
 *
 * Seeds city categories for Kodi with English display names.
 * This script creates CityCategory records linking the Kodi city to all available categories
 * with localized display names.
 *
 * Prerequisites:
 * 1. Run Prisma migrations: npm run prisma:migrate
 * 2. Regenerate Prisma client: npm run prisma:generate
 * 3. Ensure categories are seeded: npm run seed:categories
 * 4. Ensure Kodi city exists: npm run seed:initial-admin
 * 5. Ensure CORE_DATABASE_URL and CITY_DATABASE_URL env vars are set
 *
 * Run: npm run seed:city-categories
 * Or: npx ts-node -r tsconfig-paths/register scripts/seed-city-categories.ts
 */

import 'tsconfig-paths/register';

import { PrismaClient as CityPrismaClient } from '@prisma/client-city';
import {
  PrismaClient as CorePrismaClient,
  UserRole,
  CategoryVisibility,
  CategoryViewType,
  SubServiceItemType,
} from '@prisma/client-core';
import {
  CATEGORY_ASSETS,
  getCityHeaderImageUrl,
  getCategoryIconUrl,
} from './assets/category-assets-mapping';

const cityPrisma = new CityPrismaClient();
const corePrisma = new CorePrismaClient();
const DEFAULT_CITY_CATEGORY_LANGUAGE = 'en';

// English display names for categories in Kodi (UPPERCASE for main categories)
const KODI_DISPLAY_NAMES: Record<string, string> = {
  // Main categories (UPPERCASE; list order matches city displayOrder)
  'kodier-woche': 'KODIER WOCHE',
  'kodier-woche-events': 'KODIER WOCHE EVENTS',
  'kodier-verwaltung': 'KODIER VERWALTUNG',
  tours: 'YOUR WAY THROUGH KODI',
  'food-and-drink': 'EATING & DRINKING',
  shopping: "SHOP TO YOUR HEART'S CONTENT",
  culture: 'KODI CULTURE',
  'show-me-more': 'SHOW ME MORE',
  events: 'EVENTS',

  // Food & Drink subcategories
  'food-cafes-bakeries': 'Cafés',
  'food-bars-nightlife': 'Bars & Pubs',
  'food-fish-restaurants': 'Fish Restaurants',
  'food-vegetarian-vegan': 'Vegetarian & Vegan',

  // Shopping subcategories
  'shopping-city-center': 'City Center',
  'shopping-clothing': 'Clothing',
  'shopping-conscious-shopping': 'Conscious Shopping',
  'shopping-for-children': 'For Children',

  // Culture subcategories
  'culture-excursions': 'Excursion Destinations',
  'culture-on-foot': 'Explore on Foot',
  'culture-bike-tours': 'Bike Tours',
  'culture-museums': 'Museums',

  // Show Me More subcategories (German names)
  'show-me-more-kodier-stadtgebiet': 'Kodier Stadtgebiet',
  'show-me-more-kodigutschein': 'KodiGutschein',
  'show-me-more-region-kodier-forde': 'Region Kodier Förde',
  'show-me-more-blaue-linie': 'Blaue Linie',
  'show-me-more-sonstiges': 'Sonstiges',
  'show-me-more-altstadt': 'Altstadt',
  'show-me-more-holtenauer-strasse': 'Holtenauer Straße',
  'show-me-more-melting-pot': 'Melting Pot',
  'show-me-more-sonstige': 'Sonstige',
  'show-me-more-sehenswertes': 'Sehenswertes',
  'show-me-more-kultur': 'Kultur',
  'show-me-more-damen': 'Damen',
  'show-me-more-museen-sammlungen': 'Museen/Sammlungen',
  'show-me-more-wassersport': 'Wassersport',
  'show-me-more-handwerk': 'Handwerk',
  'show-me-more-kulturzentrum': 'Kulturzentrum',
};

// German translations for Kodi city categories (exact translations we want, not from DeepL)
const KODI_GERMAN_TRANSLATIONS: Record<
  string,
  { displayName: string; subtitle?: string; description?: string }
> = {
  // Main categories
  'kodier-woche': {
    displayName: 'KODIER WOCHE',
    subtitle: '20 -28 Juni 2026',
    description: 'Deine KiWo Erlebniswelt',
  },
  'kodier-woche-events': {
    displayName: 'KODIER WOCHE EVENTS',
  },
  'kodier-verwaltung': {
    displayName: 'KODIER VERWALTUNG',
    subtitle: 'Ämterübersicht',
    description: 'Was erledige ich wo?',
  },
  tours: {
    displayName: 'DEIN WEG DURCH KODI',
    subtitle: 'Blaue Linie',
    description: '67 Aktivitäten in deiner Stadt',
  },
  'food-and-drink': {
    displayName: 'ESSEN & TRINKEN',
    subtitle: 'Kodier Restaurantvielfalt',
    description: 'Norddeutsche und internationale Küche',
  },
  shopping: {
    displayName: 'NACH HERZENSLUST SHOPPEN',
    subtitle: 'Über 400 Geschäfte',
    description: 'In deiner Innenstadt',
  },
  culture: {
    displayName: 'KODIER KULTUR',
    subtitle: 'Facettenreich von Meer bis Museen',
    description: 'Kunst, Geschichte, Musik, Wasser',
  },
  'show-me-more': {
    displayName: 'ZEIGE MIR MEHR',
    subtitle: 'Alles auf einen Blick',
    description: 'Entdecke deine Stadt mit deinen Filtern',
  },
  events: {
    displayName: 'VERANSTALTUNGEN',
    subtitle: 'Was ist los',
    description: 'Veranstaltungen, Feste und Aktivitäten in deiner Stadt',
  },

  // Food & Drink subcategories
  'food-cafes-bakeries': { displayName: 'Cafés' },
  'food-bars-nightlife': { displayName: 'Bars & Kneipen' },
  'food-fish-restaurants': { displayName: 'Fischrestaurants' },
  'food-vegetarian-vegan': { displayName: 'Vegetarisch & Vegan' },

  // Shopping subcategories
  'shopping-city-center': { displayName: 'Innenstadt' },
  'shopping-clothing': { displayName: 'Kleidung' },
  'shopping-conscious-shopping': { displayName: 'Bewusst Einkaufen' },
  'shopping-for-children': { displayName: 'Für Kinder' },

  // Culture subcategories
  'culture-excursions': { displayName: 'Ausflugsziele' },
  'culture-on-foot': { displayName: 'Zu Fuß erleben' },
  'culture-bike-tours': { displayName: 'Fahrradtouren' },
  'culture-museums': { displayName: 'Museen' },

  // Show Me More subcategories
  'show-me-more-kodier-stadtgebiet': { displayName: 'Kodier Stadtgebiet' },
  'show-me-more-kodigutschein': { displayName: 'KodiGutschein' },
  'show-me-more-region-kodier-forde': { displayName: 'Region Kodier Förde' },
  'show-me-more-blaue-linie': { displayName: 'Blaue Linie' },
  'show-me-more-sonstiges': { displayName: 'Sonstiges' },
  'show-me-more-altstadt': { displayName: 'Altstadt' },
  'show-me-more-holtenauer-strasse': { displayName: 'Holtenauer Straße' },
  'show-me-more-melting-pot': { displayName: 'Melting Pot' },
  'show-me-more-sonstige': { displayName: 'Sonstige' },
  'show-me-more-sehenswertes': { displayName: 'Sehenswertes' },
  'show-me-more-kultur': { displayName: 'Kultur' },
  'show-me-more-damen': { displayName: 'Damen' },
  'show-me-more-museen-sammlungen': { displayName: 'Museen/Sammlungen' },
  'show-me-more-wassersport': { displayName: 'Wassersport' },
  'show-me-more-handwerk': { displayName: 'Handwerk' },
  'show-me-more-kulturzentrum': { displayName: 'Kulturzentrum' },
};

// Slugs of categories (and their subcategories) that should be seeded for Kodi
// Main category order follows CATEGORY_ASSETS displayOrder (Kodier Woche first).
const KODI_ALLOWED_CATEGORY_SLUGS: string[] = [
  // Main categories
  'kodier-woche', // 0 - Kodier Woche (top)
  'kodier-verwaltung', // 1 - KODIER VERWALTUNG
  'tours', // 2 - DEIN WEG DURCH KODI
  'food-and-drink', // 3 - ESSEN & TRINKEN
  'shopping', // 4 - NACH HERZENSLUST SHOPPEN
  'culture', // 5 - KODIER KULTUR
  'show-me-more', // 6 - ZEIGE MIR MEHR
  'events', // 7 - Events

  // Food & Drink subcategories
  'food-cafes-bakeries',
  'food-bars-nightlife',
  'food-fish-restaurants',
  'food-vegetarian-vegan',

  // Shopping subcategories
  'shopping-city-center',
  'shopping-clothing',
  'shopping-conscious-shopping',
  'shopping-for-children',

  // Culture subcategories
  'culture-excursions',
  'culture-on-foot',
  'culture-bike-tours',
  'culture-museums',

  // Show Me More subcategories
  'show-me-more-kodier-stadtgebiet',
  'show-me-more-kodigutschein',
  'show-me-more-region-kodier-forde',
  'show-me-more-blaue-linie',
  'show-me-more-sonstiges',
  'show-me-more-altstadt',
  'show-me-more-holtenauer-strasse',
  'show-me-more-melting-pot',
  'show-me-more-sonstige',
  'show-me-more-sehenswertes',
  'show-me-more-kultur',
  'show-me-more-damen',
  'show-me-more-museen-sammlungen',
  'show-me-more-wassersport',
  'show-me-more-handwerk',
  'show-me-more-kulturzentrum',
];

async function getKodiCityId(): Promise<string> {
  const city = await cityPrisma.city.findFirst({
    where: {
      name: 'Kodi',
      country: 'Germany',
      state: 'Schleswig-Holstein',
    },
    select: { id: true },
  });

  if (!city) {
    throw new Error('Kodi city not found. Please run npm run seed:initial-admin first.');
  }

  return city.id;
}

async function getAllCategories() {
  return await corePrisma.category.findMany({
    where: {
      isActive: true,
      slug: {
        in: KODI_ALLOWED_CATEGORY_SLUGS,
      },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      parentId: true, // Include parentId to check if it's a main category
    },
  });
}

async function seedCityCategories(cityId: string, addedBy?: string) {
  console.log('🌱 Starting city categories seeding for Kodi...');

  const categories = await getAllCategories();
  console.log(`📋 Found ${categories.length} active categories`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const category of categories) {
    const assetMapping = CATEGORY_ASSETS[category.slug];
    // For Kodi, prefer city-specific display names; fall back to generic asset mapping or category name
    const displayName =
      KODI_DISPLAY_NAMES[category.slug] || assetMapping?.displayName || category.name;
    const displayOrder = assetMapping?.displayOrder ?? 99; // Default to end if not specified (0 is valid for top)
    const subtitle = assetMapping?.subtitle || null;
    const description = assetMapping?.description || null;

    // Only set colors for main categories (categories without a parent)
    // Subcategories should have null colors
    const isMainCategory = category.parentId === null;
    const headerBackgroundColor = isMainCategory
      ? assetMapping?.headerBackgroundColor || null
      : null;
    const contentBackgroundColor = isMainCategory
      ? assetMapping?.contentBackgroundColor || null
      : null;

    // Get icon URL if available (only for main categories with icons)
    const iconUrl =
      isMainCategory && assetMapping?.iconFileName
        ? getCategoryIconUrl(assetMapping.iconFileName)
        : null;

    // Visibility: default to PUBLIC unless explicitly set in asset mapping
    const visibility: CategoryVisibility =
      (assetMapping?.visibility as CategoryVisibility) || CategoryVisibility.PUBLIC;

    try {
      const existing = await corePrisma.cityCategory.findUnique({
        where: {
          cityId_categoryId: {
            cityId,
            categoryId: category.id,
          },
        },
      });

      // Preserve existing storage icon URL if it's already set (starts with http/https)
      let finalIconUrl: string | null = null;
      if (
        existing?.iconUrl &&
        (existing.iconUrl.startsWith('http://') || existing.iconUrl.startsWith('https://'))
      ) {
        finalIconUrl = existing.iconUrl;
      } else {
        finalIconUrl = iconUrl;
      }

      // Set languageCode to 'de' for show-me-more subcategories and kodier-verwaltung
      const isShowMeMoreSubcategory = category.slug.startsWith('show-me-more-');
      const isGermanCategory =
        isShowMeMoreSubcategory ||
        category.slug === 'kodier-verwaltung' ||
        category.slug === 'kodier-woche';
      const cityCategoryLanguageCode = isGermanCategory
        ? 'de'
        : (existing?.languageCode ?? DEFAULT_CITY_CATEGORY_LANGUAGE);

      if (existing) {
        await corePrisma.cityCategory.update({
          where: { id: existing.id },
          data: {
            displayName,
            subtitle,
            description,
            languageCode: cityCategoryLanguageCode,
            displayOrder,
            headerBackgroundColor,
            contentBackgroundColor,
            iconUrl: finalIconUrl,
            visibility,
            isActive: true,
            addedBy,
          },
        });
        updated++;
        console.log(
          `↻ Updated city category: ${category.name} → "${displayName}" (order: ${displayOrder}, visibility: ${visibility}, lang: ${cityCategoryLanguageCode})`,
        );
      } else {
        await corePrisma.cityCategory.create({
          data: {
            cityId,
            categoryId: category.id,
            languageCode: cityCategoryLanguageCode,
            displayName,
            subtitle,
            description,
            displayOrder,
            headerBackgroundColor,
            contentBackgroundColor,
            iconUrl: finalIconUrl,
            visibility,
            isActive: true,
            addedBy,
          },
        });
        created++;
        console.log(
          `✓ Created city category: ${category.name} → "${displayName}" (order: ${displayOrder}, visibility: ${visibility}, lang: ${cityCategoryLanguageCode})`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing category ${category.name}:`,
        error instanceof Error ? error.message : error,
      );
      skipped++;
    }
  }

  return { created, updated, skipped };
}

async function seedCityCategoryTranslations(cityId: string) {
  console.log('\n🌍 Seeding German translations for city categories...');

  // Get all city categories for this city
  const cityCategories = await corePrisma.cityCategory.findMany({
    where: { cityId, isActive: true },
    include: { category: { select: { id: true, slug: true } } },
  });

  let translationsCreated = 0;
  let translationsUpdated = 0;

  for (const cityCategory of cityCategories) {
    const germanTranslation = KODI_GERMAN_TRANSLATIONS[cityCategory.category.slug];
    if (!germanTranslation) continue;

    // The service uses 'city-category' as entityType and '{cityId}:{categoryId}' as entityId
    // Field names: 'name' (for displayName), 'subtitle', 'description'
    const entityType = 'city-category';
    const entityId = `${cityId}:${cityCategory.category.id}`;

    const fields: Array<{ field: string; value: string }> = [
      { field: 'name', value: germanTranslation.displayName }, // Service looks for 'name', not 'displayName'
      { field: 'subtitle', value: germanTranslation.subtitle },
      { field: 'description', value: germanTranslation.description },
    ].filter((f): f is { field: string; value: string } => Boolean(f.value));

    for (const { field, value } of fields) {
      try {
        const existing = await corePrisma.translation.findUnique({
          where: {
            entityType_entityId_field_locale: {
              entityType,
              entityId,
              field,
              locale: 'de',
            },
          },
        });

        if (existing) {
          await corePrisma.translation.update({
            where: { id: existing.id },
            data: {
              value,
              source: 'MANUAL',
              updatedAt: new Date(),
            },
          });
          translationsUpdated++;
        } else {
          await corePrisma.translation.create({
            data: {
              entityType,
              entityId,
              field,
              locale: 'de',
              sourceLocale: 'en', // English is the source language
              value,
              source: 'MANUAL',
            },
          });
          translationsCreated++;
        }
        console.log(`  ✓ ${cityCategory.category.slug}.${field} (${entityType}:${entityId})`);
      } catch (error) {
        console.error(
          `❌ Error saving translation for ${cityCategory.category.slug}.${field}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  console.log(
    `✓ German translations created: ${translationsCreated}, updated: ${translationsUpdated}`,
  );
  return { created: translationsCreated, updated: translationsUpdated };
}

/**
 * Sets kodier-woche category viewType to SUB_SERVICES and creates CategorySubService records:
 *   0 - Kodier Woche Events (kodier-woche-events category, list view)
 *   1 - EVENTAREALE (kodier-woche-eventareale category, MAP view — own image, same D1 data)
 *   2 - Auslastungskarte (tile)
 *   3 - Kodier-Woche-Service (tile)
 *
 * Idempotent: uses upsert on the unique (categoryId, itemType, itemId) constraint.
 * Prerequisite: seed:tiles must have run first (tiles are looked up by slug).
 */
async function seedKodierWocheSubServices() {
  console.log('\n🎪 Seeding Kodier Woche sub-services...');

  // Set kodier-woche viewType to SUB_SERVICES
  const kodierWoche = await corePrisma.category.findUnique({
    where: { slug: 'kodier-woche' },
    select: { id: true },
  });
  if (!kodierWoche) {
    console.warn('⚠ kodier-woche category not found — skipping sub-services seeding');
    return;
  }

  await corePrisma.category.update({
    where: { id: kodierWoche.id },
    data: { viewType: CategoryViewType.SUB_SERVICES },
  });
  console.log('✓ Set kodier-woche viewType = SUB_SERVICES');

  // Resolve kodier-woche-events category id (used for CATEGORY sub-service)
  const kodierWocheEventsCategory = await corePrisma.category.findUnique({
    where: { slug: 'kodier-woche-events' },
    select: { id: true },
  });
  if (!kodierWocheEventsCategory) {
    console.error(
      '✗ kodier-woche-events category not found — run seed:categories first. Aborting sub-services seeding.',
    );
    return;
  }

  // Resolve kodier-woche-eventareale category id (used for MAP sub-service)
  const kodierWocheEventarealeCategory = await corePrisma.category.findUnique({
    where: { slug: 'kodier-woche-eventareale' },
    select: { id: true },
  });
  if (!kodierWocheEventarealeCategory) {
    console.warn('⚠ kodier-woche-eventareale category not found — run seed:categories first');
  }

  // Remove old 'events' sub-service link if it exists (replaced by kodier-woche-events)
  const eventsCategory = await corePrisma.category.findUnique({
    where: { slug: 'events' },
    select: { id: true },
  });
  if (eventsCategory) {
    await corePrisma.categorySubService.deleteMany({
      where: {
        categoryId: kodierWoche.id,
        itemType: SubServiceItemType.CATEGORY,
        itemId: eventsCategory.id,
      },
    });
    console.log('✓ Removed old events sub-service link');
  }

  // Remove old MAP sub-service pointing to kodier-woche-events (replaced by kodier-woche-eventareale)
  if (kodierWocheEventarealeCategory) {
    await corePrisma.categorySubService.deleteMany({
      where: {
        categoryId: kodierWoche.id,
        itemType: SubServiceItemType.MAP,
        itemId: kodierWocheEventsCategory.id,
      },
    });
    console.log('✓ Removed old MAP sub-service link (kodier-woche-events → kodier-woche-eventareale)');
  }

  // Resolve tile ids by slug
  const auslastungskarteTile = await corePrisma.tile.findUnique({
    where: { slug: 'auslastungskarte' },
    select: { id: true },
  });
  if (!auslastungskarteTile) {
    console.warn('⚠ auslastungskarte tile not found — run seed:tiles first');
  }

  const kodierWocheServiceTile = await corePrisma.tile.findUnique({
    where: { slug: 'kodier-woche-service' },
    select: { id: true },
  });
  if (!kodierWocheServiceTile) {
    console.warn('⚠ kodier-woche-service tile not found — run seed:tiles first');
  }

  const subServices: Array<{
    itemType: SubServiceItemType;
    itemId: string;
    displayOrder: number;
    displayName?: string;
  }> = [];

  if (kodierWocheEventsCategory) {
    subServices.push({
      itemType: SubServiceItemType.CATEGORY,
      itemId: kodierWocheEventsCategory.id,
      displayOrder: 0,
    });
  }
  if (kodierWocheEventarealeCategory) {
    subServices.push({
      itemType: SubServiceItemType.MAP,
      itemId: kodierWocheEventarealeCategory.id,
      displayOrder: 1,
      displayName: 'EVENTAREALE',
    });
  }
  if (auslastungskarteTile) {
    subServices.push({
      itemType: SubServiceItemType.TILE,
      itemId: auslastungskarteTile.id,
      displayOrder: 2,
    });
  }
  if (kodierWocheServiceTile) {
    subServices.push({
      itemType: SubServiceItemType.TILE,
      itemId: kodierWocheServiceTile.id,
      displayOrder: 3,
    });
  }

  let created = 0;
  let updated = 0;

  for (const entry of subServices) {
    const existing = await corePrisma.categorySubService.findUnique({
      where: {
        categoryId_itemType_itemId: {
          categoryId: kodierWoche.id,
          itemType: entry.itemType,
          itemId: entry.itemId,
        },
      },
    });

    if (existing) {
      await corePrisma.categorySubService.update({
        where: { id: existing.id },
        data: { displayOrder: entry.displayOrder, isActive: true, displayName: entry.displayName ?? null },
      });
      updated++;
      console.log(
        `↻ Updated sub-service: ${entry.itemType} ${entry.itemId} (order ${entry.displayOrder})`,
      );
    } else {
      await corePrisma.categorySubService.create({
        data: {
          categoryId: kodierWoche.id,
          itemType: entry.itemType,
          itemId: entry.itemId,
          displayOrder: entry.displayOrder,
          isActive: true,
          displayName: entry.displayName ?? null,
        },
      });
      created++;
      console.log(
        `✓ Created sub-service: ${entry.itemType} ${entry.itemId} (order ${entry.displayOrder})`,
      );
    }
  }

  console.log(`✓ Kodier Woche sub-services: created ${created}, updated ${updated}`);
}

/**
 * Seeds manual English Translation rows for Kodier Woche sub-service entities
 * (base Category + Tile records, not CityCategory).
 *
 * These categories/tiles are stored in German (languageCode='de') so the translation
 * pipeline needs a locale='en' row to serve the correct English name immediately,
 * without waiting for DeepL async auto-translation.
 *
 * entityType 'category' / field 'name'|'subtitle'|'description'
 * entityType 'tile'     / field 'header'|'subheader'|'description'
 */
async function seedKodierWocheSubServiceTranslations() {
  console.log('\n🌍 Seeding English translations for Kodier Woche sub-service items...');

  type SubServiceTranslation = {
    slug: string;
    entityType: 'category' | 'tile';
    fields: Record<string, string>;
  };

  const items: SubServiceTranslation[] = [
    {
      slug: 'kodier-woche-events',
      entityType: 'category',
      fields: { name: 'KODIER WOCHE EVENTS' },
    },
    {
      slug: 'kodier-woche-eventareale',
      entityType: 'category',
      fields: { name: 'EVENTAREALE' },
    },
    {
      slug: 'auslastungskarte',
      entityType: 'tile',
      fields: { header: 'AUSLASTUNGSKARTE' },
    },
    {
      slug: 'kodier-woche-service',
      entityType: 'tile',
      fields: { header: 'SERVICEKARTE' },
    },
  ];

  let created = 0;
  let updated = 0;

  for (const item of items) {
    // Resolve entity id
    let entityId: string | null = null;
    if (item.entityType === 'category') {
      const cat = await corePrisma.category.findUnique({
        where: { slug: item.slug },
        select: { id: true },
      });
      entityId = cat?.id ?? null;
    } else {
      const tile = await corePrisma.tile.findUnique({
        where: { slug: item.slug },
        select: { id: true },
      });
      entityId = tile?.id ?? null;
    }

    if (!entityId) {
      console.warn(`⚠ ${item.slug} not found — skipping translations`);
      continue;
    }

    for (const [field, value] of Object.entries(item.fields)) {
      try {
        const existing = await corePrisma.translation.findUnique({
          where: {
            entityType_entityId_field_locale: {
              entityType: item.entityType,
              entityId,
              field,
              locale: 'en',
            },
          },
        });

        if (existing) {
          await corePrisma.translation.update({
            where: { id: existing.id },
            data: { value, source: 'MANUAL', updatedAt: new Date() },
          });
          updated++;
          console.log(`  ↻ ${item.slug}.${field} (en) = "${value}"`);
        } else {
          await corePrisma.translation.create({
            data: {
              entityType: item.entityType,
              entityId,
              field,
              locale: 'en',
              sourceLocale: 'de',
              value,
              source: 'MANUAL',
            },
          });
          created++;
          console.log(`  ✓ ${item.slug}.${field} (en) = "${value}"`);
        }
      } catch (error) {
        console.error(
          `❌ Error saving translation for ${item.slug}.${field}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  console.log(`✓ Sub-service English translations: created ${created}, updated ${updated}`);
}

async function seed() {
  try {
    const cityId = await getKodiCityId();
    console.log(`✓ Found Kodi city (ID: ${cityId})`);

    // Update city header image if not set
    const city = await cityPrisma.city.findUnique({
      where: { id: cityId },
      select: { headerImageUrl: true },
    });

    // Preserve existing storage URL if it's already set (starts with http/https)
    if (
      !city?.headerImageUrl ||
      (!city.headerImageUrl.startsWith('http://') && !city.headerImageUrl.startsWith('https://'))
    ) {
      const headerImageUrl = getCityHeaderImageUrl('kodi');
      if (headerImageUrl) {
        await cityPrisma.city.update({
          where: { id: cityId },
          data: { headerImageUrl },
        });
        console.log(`✓ Set city header image: ${headerImageUrl}`);
      }
    } else {
      console.log(`ℹ City header image already set (storage URL): ${city.headerImageUrl}`);
    }

    // Optionally get a city admin ID to set as addedBy
    const cityAdmin = await corePrisma.userCityAssignment.findFirst({
      where: {
        cityId,
        role: UserRole.CITY_ADMIN,
        isActive: true,
      },
      select: { userId: true },
    });

    const addedBy = cityAdmin?.userId;

    const summary = await seedCityCategories(cityId, addedBy);

    // Seed German translations for city categories
    const translationSummary = await seedCityCategoryTranslations(cityId);

    // Seed Kodier Woche sub-services (tiles must be seeded first via seed:tiles)
    await seedKodierWocheSubServices();

    // Seed manual English translations for sub-service base entities
    await seedKodierWocheSubServiceTranslations();

    console.log('\n📊 Seeding summary:');
    console.log(`  • City categories created: ${summary.created}`);
    console.log(`  • City categories updated: ${summary.updated}`);
    console.log(`  • City categories skipped: ${summary.skipped}`);
    console.log(`  • German translations created: ${translationSummary.created}`);
    console.log(`  • German translations updated: ${translationSummary.updated}`);
    console.log('\n🎉 City categories seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding city categories:', error);
    throw error;
  } finally {
    await Promise.allSettled([cityPrisma.$disconnect(), corePrisma.$disconnect()]);
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
