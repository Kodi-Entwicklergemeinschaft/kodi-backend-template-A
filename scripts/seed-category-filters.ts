#!/usr/bin/env ts-node
/**
 * Seed script: Category Quick Filters
 *
 * Creates CategoryFilter mappings that link Filter records to Category records
 * with display metadata (heading, group, displayOrder).
 *
 * Uses (provider, field, listingType, value) to reference filters instead of IDs,
 * so the seed works across environments where filter IDs differ.
 *
 * If a filter does not exist, it is created automatically before linking.
 *
 * Idempotent: uses upsert on the unique (categoryId, filterId) constraint.
 *
 * Usage: npm run seed:category-filters
 */

import 'tsconfig-paths/register';
import { PrismaClient as CorePrismaClient } from '@prisma/client-core';

const prisma = new CorePrismaClient();

const PROVIDER = 'DESTINATION_ONE';

/** Filter reference by composite key - environment-agnostic */
interface FilterKey {
  field: string;
  listingType: string;
  value: string;
}

/** Resolve filter key to filter ID from database */
async function findFilterId(key: FilterKey): Promise<string | null> {
  const filter = await prisma.filter.findUnique({
    where: {
      provider_field_listingType_value: {
        provider: PROVIDER,
        field: key.field,
        listingType: key.listingType,
        value: key.value,
      },
    },
  });
  return filter?.id ?? null;
}

/** Find filter by key, or create it if not found. Returns { id, created }. */
async function findOrCreateFilterId(
  key: FilterKey,
): Promise<{ id: string; created: boolean }> {
  const existingId = await findFilterId(key);
  if (existingId) return { id: existingId, created: false };

  const created = await prisma.filter.create({
    data: {
      provider: PROVIDER,
      field: key.field,
      listingType: key.listingType,
      value: key.value,
      label: key.value,
      languageCode: 'de',
      isActive: true,
    },
  });
  return { id: created.id, created: true };
}

// --- Filter keys (field, listingType, value) - organized by heading ---

// =============================================================================
// FOOD & DRINK (Gastro category)
// =============================================================================
const FOOD_AND_DRINK_MAPPINGS = [
  {
    heading: 'Betriebsart',
    filterKeys: [
      { field: 'category', listingType: 'Gastro', value: 'KodiGutschein' },
      { field: 'category', listingType: 'Gastro', value: 'Bar' },
      { field: 'category', listingType: 'Gastro', value: 'Restaurant' },
      { field: 'category', listingType: 'Gastro', value: 'Café' },
      { field: 'category', listingType: 'Gastro', value: 'Eisdiele/Eiscafé' },
      { field: 'category', listingType: 'Gastro', value: 'Fischlokal' },
      { field: 'category', listingType: 'Gastro', value: 'Pub' },
      { field: 'category', listingType: 'Gastro', value: 'Kneipe' },
      { field: 'category', listingType: 'Gastro', value: 'Bistro' },
      { field: 'category', listingType: 'Gastro', value: 'Schiffsgastronomie' },
      { field: 'category', listingType: 'Gastro', value: 'Hotelrestaurant' },
      { field: 'category', listingType: 'Gastro', value: 'Sportsbar' },
      { field: 'category', listingType: 'Gastro', value: 'Weinstube' },
      { field: 'category', listingType: 'Gastro', value: 'Brauerei' },
      { field: 'feature', listingType: 'Gastro', value: 'Lieferservice' },
      { field: 'category', listingType: 'Gastro', value: 'Mensa' },
      { field: 'category', listingType: 'Gastro', value: 'Discothek' },
    ] as FilterKey[],
  },
  {
    heading: 'Küche',
    filterKeys: [
      { field: 'cuisine_type', listingType: 'Gastro', value: 'deutsch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'international' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'italienisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'mediterran' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'asiatisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'japanisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'türkisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'französisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'indisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'regionale Küche' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'vegetarisch' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'vegan' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'sonstiges' },
      { field: 'cuisine_type', listingType: 'Gastro', value: 'griechisch' },
    ] as FilterKey[],
  },
  {
    heading: 'Lage',
    filterKeys: [
      { field: 'feature', listingType: 'Gastro', value: 'Lage/Location' },
      { field: 'feature', listingType: 'Gastro', value: 'Kodier Innenstadt' },
      { field: 'feature', listingType: 'Gastro', value: 'Altstadt' },
      { field: 'feature', listingType: 'Gastro', value: 'Holtenauer Straße' },
      { field: 'feature', listingType: 'Gastro', value: 'Region Kodier Förde' },
    ] as FilterKey[],
  },
];

// =============================================================================
// SHOPPING (POI category)
// =============================================================================
const SHOPPING_MAPPINGS = [
  {
    heading: 'Bewusst einkaufen',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Wochenmarkt' },
      { field: 'category', listingType: 'POI', value: 'Nachhaltig' },
      { field: 'category', listingType: 'POI', value: 'KodiGutschein' },
      { field: 'category', listingType: 'POI', value: 'Flohmarkt' },
      { field: 'category', listingType: 'POI', value: 'Vegan' },
    ] as FilterKey[],
  },
  {
    heading: 'Geschäfte',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Spielzeug' },
      { field: 'category', listingType: 'POI', value: 'Drogerie & Beauty' },
      { field: 'category', listingType: 'POI', value: 'Elektronik' },
      { field: 'category', listingType: 'POI', value: 'Geschenke & Souvenirs' },
      { field: 'category', listingType: 'POI', value: 'Genuss & Spezialitäten' },
      { field: 'category', listingType: 'POI', value: 'Bücher & Zeitschriften' },
      { field: 'category', listingType: 'POI', value: 'Interior & Möbel' },
      { field: 'category', listingType: 'POI', value: 'Hobby & Bastelbedarf' },
      { field: 'category', listingType: 'POI', value: 'Gesundheits- & Medizinbedarf' },
      { field: 'category', listingType: 'POI', value: 'Souvenirs' },
      { field: 'category', listingType: 'POI', value: 'Lebensmitteleinzelhandel' },
      { field: 'category', listingType: 'POI', value: 'Lebensmittel' },
      { field: 'category', listingType: 'POI', value: 'Schul- & Bürobedarf' },
      { field: 'category', listingType: 'POI', value: 'Geldautomaten/-institute' },
      { field: 'category', listingType: 'POI', value: 'Tankstellen' },
      { field: 'category', listingType: 'POI', value: 'Sonstiges' },
      { field: 'category', listingType: 'POI', value: 'Hofladen' },
      { field: 'category', listingType: 'POI', value: 'Reisegepäck & Koffer' },
      { field: 'category', listingType: 'POI', value: 'Accessoires & Taschen' },
      { field: 'category', listingType: 'POI', value: 'Optik & Akustik' },
      { field: 'category', listingType: 'POI', value: 'Handwerk' },
      { field: 'category', listingType: 'POI', value: 'Manufakturen' },
      { field: 'category', listingType: 'POI', value: 'Pop-up Stores' },
      { field: 'category', listingType: 'POI', value: 'Metzger' },
      { field: 'category', listingType: 'POI', value: 'Bäcker' },
      { field: 'category', listingType: 'POI', value: 'Schuhe & Lederwaren' },
      { field: 'category', listingType: 'POI', value: 'Sport & Outdoor' },
      { field: 'category', listingType: 'POI', value: 'Gesundheit' },
      { field: 'category', listingType: 'POI', value: 'Schmuck & Accessoires' },
      { field: 'category', listingType: 'POI', value: 'Wohnen' },
      { field: 'category', listingType: 'POI', value: 'Kultur' },
      { field: 'category', listingType: 'POI', value: 'Sonstige' },
      { field: 'category', listingType: 'POI', value: 'Click&Collect' },
    ] as FilterKey[],
  },
  {
    heading: 'Bekleidung',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Damen' },
      { field: 'category', listingType: 'POI', value: 'Herren' },
      { field: 'category', listingType: 'POI', value: 'Schuhe' },
      { field: 'category', listingType: 'POI', value: 'Baby & Kind' },
    ] as FilterKey[],
  },
  {
    heading: 'Lage',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Altstadt' },
      { field: 'category', listingType: 'POI', value: 'Holtenauer Straße' },
      { field: 'category', listingType: 'POI', value: 'Shoppingcenter' },
      { field: 'category', listingType: 'POI', value: 'Kodier Stadtgebiet' },
      { field: 'category', listingType: 'POI', value: 'Region Kodier Förde' },
      { field: 'category', listingType: 'POI', value: 'Kodier Innenstadt' },
    ] as FilterKey[],
  },
];

// =============================================================================
// CULTURE & KODI (POI + Tour category)
// =============================================================================
const CULTURE_MAPPINGS = [
  {
    heading: 'Ausflugsziele',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Aussichtspunkte' },
      { field: 'category', listingType: 'POI', value: 'Museen/Sammlungen' },
      { field: 'category', listingType: 'POI', value: 'Historische Stätten' },
      { field: 'category', listingType: 'POI', value: 'Kreuz-/Fährterminals' },
      { field: 'category', listingType: 'POI', value: 'Schiffsanleger' },
      { field: 'category', listingType: 'POI', value: 'Brauereien' },
      { field: 'category', listingType: 'POI', value: 'Sternwarte' },
      { field: 'category', listingType: 'POI', value: 'Freizeitpark' },
      { field: 'category', listingType: 'POI', value: 'Erlebnispark' },
      { field: 'category', listingType: 'POI', value: 'Erlebnisangebot' },
      { field: 'category', listingType: 'POI', value: 'Zoo/Tierpark' },
      { field: 'category', listingType: 'POI', value: 'Industrie-/Werksbesichtigung' },
      { field: 'category', listingType: 'POI', value: 'Weihnachtsmärkte' },
      { field: 'category', listingType: 'POI', value: 'Leuchtturm' },
      { field: 'category', listingType: 'POI', value: 'Denkmäler' },
      { field: 'category', listingType: 'POI', value: 'Sehenswertes' },
      { field: 'category', listingType: 'POI', value: 'Kirchen/Klöster' },
      { field: 'category', listingType: 'POI', value: 'Nostalgie-/Freizeitbahn' },
      { field: 'category', listingType: 'POI', value: 'Höhle/Tropfsteinhöhle' },

    ] as FilterKey[],
  },
  {
    heading: 'Unterhaltung',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Theater' },
      { field: 'category', listingType: 'POI', value: 'Kino' },
      { field: 'category', listingType: 'POI', value: 'Casino' },
      { field: 'category', listingType: 'POI', value: 'Jugendtreffs' },
      { field: 'category', listingType: 'POI', value: 'Freilichtbühnen/-theater' },
      { field: 'category', listingType: 'POI', value: 'Sportstätten/Stadion' },
      { field: 'category', listingType: 'POI', value: 'Kulturzentrum' },
      { field: 'category', listingType: 'POI', value: 'Disko/Club' },
      { field: 'category', listingType: 'POI', value: 'Festspiele' },
      { field: 'category', listingType: 'POI', value: 'Sommertheater-Übertragung' },
      { field: 'category', listingType: 'POI', value: 'Eventlocation' },
    ] as FilterKey[],
  },
  {
    heading: 'Sport & Freizeit',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Wassersport' },
      { field: 'category', listingType: 'POI', value: 'Segeln' },
      { field: 'category', listingType: 'POI', value: 'Reiten' },
      { field: 'category', listingType: 'POI', value: 'Klettern' },
      { field: 'category', listingType: 'POI', value: 'Minigolf' },
      { field: 'category', listingType: 'POI', value: 'Fitness' },
      { field: 'category', listingType: 'POI', value: 'SUP-Spot' },
      { field: 'category', listingType: 'POI', value: 'Surf-Spot' },
      { field: 'category', listingType: 'POI', value: 'Beachvolleyball' },
      { field: 'category', listingType: 'POI', value: 'Golf' },
      { field: 'category', listingType: 'POI', value: 'Tennis/Squash' },
      { field: 'category', listingType: 'POI', value: 'Funsport' },
      { field: 'category', listingType: 'POI', value: 'Fußball' },
      { field: 'category', listingType: 'POI', value: 'Inline-Skating' },
      { field: 'category', listingType: 'POI', value: 'Kegeln/Bowling' },
      { field: 'category', listingType: 'POI', value: 'Kinderspielplätze' },
      { field: 'category', listingType: 'POI', value: 'Kutschenfahrten' },
      { field: 'category', listingType: 'POI', value: 'Angeln/Fischen' },
      { field: 'category', listingType: 'POI', value: 'Schießsport' },
      { field: 'category', listingType: 'POI', value: 'Eislauf/Eishalle' },
    ] as FilterKey[],
  },
  {
    heading: 'Erholung & Gesundheit',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Gesundheit' },
      { field: 'category', listingType: 'POI', value: 'Hallenbäder/Erlebnisbäder' },
      { field: 'category', listingType: 'POI', value: 'Freibäder' },
      { field: 'category', listingType: 'POI', value: 'Seen' },
      { field: 'category', listingType: 'POI', value: 'Thermen' },
      { field: 'category', listingType: 'POI', value: 'Saunalandschaften' },
      { field: 'category', listingType: 'POI', value: 'SPA-Einrichtungen' },
      { field: 'category', listingType: 'POI', value: 'Parks/Gärten' },
      { field: 'category', listingType: 'POI', value: 'Badestellen Ostsee' },
      { field: 'category', listingType: 'POI', value: 'Strand' },
      { field: 'category', listingType: 'POI', value: 'Kurmittelhäuser' },
    ] as FilterKey[],
  },
];

// =============================================================================
// TOURS (Dein Weg durch Kodi)
// =============================================================================
const TOURS_MAPPINGS = [
  {
    heading: 'Mobil & Service',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Tourist-Information' },
      { field: 'category', listingType: 'POI', value: 'Bahnhof' },
      { field: 'category', listingType: 'POI', value: 'Bushaltestellen' },
      { field: 'category', listingType: 'POI', value: 'Taxi' },
      { field: 'category', listingType: 'POI', value: 'Fähren' },
      { field: 'category', listingType: 'POI', value: 'Schiffsanleger' },
      { field: 'category', listingType: 'POI', value: 'Parkmöglichkeiten' },
      { field: 'category', listingType: 'POI', value: 'Autoverleih' },
      { field: 'category', listingType: 'POI', value: 'Kreuz-/Fährterminals' },
      { field: 'category', listingType: 'POI', value: 'Kreuzfahrer' },
      { field: 'category', listingType: 'POI', value: 'Bootsverleih' },
      { field: 'category', listingType: 'POI', value: 'freies WLAN' },
      { field: 'category', listingType: 'POI', value: 'geführte Touren' },
      { field: 'category', listingType: 'POI', value: 'Campingplatz' },
      { field: 'category', listingType: 'POI', value: 'Hafen' },
      { field: 'category', listingType: 'POI', value: 'öffentliche Toilette' },
      { field: 'category', listingType: 'POI', value: 'Busunternehmen' },
      { field: 'category', listingType: 'POI', value: 'Flughafen/Flugplatz' },
      { field: 'category', listingType: 'POI', value: 'Picknick-Service' },
      { field: 'category', listingType: 'POI', value: 'Verpflegungsautomat' },
    ] as FilterKey[],
  },
  {
    heading: 'eMobilität',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'eBike Verleihstation' },
      { field: 'category', listingType: 'POI', value: 'eBike Ladestation' },
      { field: 'category', listingType: 'POI', value: 'eTankstelle' },
    ] as FilterKey[],
  },
  {
    heading: 'interaktiv',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Audioguide' },
      { field: 'category', listingType: 'POI', value: 'Webcams' },
      { field: 'category', listingType: 'POI', value: 'Panoramen' },
      { field: 'category', listingType: 'POI', value: 'Videos' },
    ] as FilterKey[],
  },
  {
    heading: 'Öffentliche Gebäude',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Rathaus' },
      { field: 'category', listingType: 'POI', value: 'Landtag' },
      { field: 'category', listingType: 'POI', value: 'Kirchen/Klöster' },
      { field: 'category', listingType: 'POI', value: 'Schulen' },
      { field: 'category', listingType: 'POI', value: 'Hochschule' },
      { field: 'category', listingType: 'POI', value: 'Zimmervermittlung' },
      { field: 'category', listingType: 'POI', value: 'Krankenhäuser' },
      { field: 'category', listingType: 'POI', value: 'Bücherei' },
      { field: 'category', listingType: 'POI', value: 'Stadthalle/Tagungszentrum' },
      { field: 'category', listingType: 'POI', value: 'Kindergärten' },
      { field: 'category', listingType: 'POI', value: 'Ärzte' },
      { field: 'category', listingType: 'POI', value: 'Polizei' },
      { field: 'category', listingType: 'POI', value: 'Feuerwehr' },
    ] as FilterKey[],
  },
  {
    heading: 'Blaue Linie',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Blaue Linie' },
    ] as FilterKey[],
  },
  {
    heading: 'Lage',
    filterKeys: [
      { field: 'category', listingType: 'POI', value: 'Kodier Stadtgebiet' },
      { field: 'category', listingType: 'POI', value: 'Region Kodier Förde' },
      { field: 'category', listingType: 'POI', value: 'Holtenauer Straße' },
      { field: 'category', listingType: 'POI', value: 'Shoppingcenter' },
      { field: 'category', listingType: 'POI', value: 'Altstadt' },
    ] as FilterKey[],
  },
];

// =============================================================================
// SHOW-ME-MORE (aggregates all headings, grouped by POI vs Gastro)
// =============================================================================
const SHOW_ME_MORE_MAPPINGS = [
  // --- Orte & Tätigkeiten von Interesse (POI) ---
  // Sorted alphabetically by heading
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Ausflugsziele',
    filterKeys: CULTURE_MAPPINGS.find((m) => m.heading === 'Ausflugsziele')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Bekleidung',
    filterKeys: SHOPPING_MAPPINGS.find((m) => m.heading === 'Bekleidung')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Bewusst einkaufen',
    filterKeys: SHOPPING_MAPPINGS.find((m) => m.heading === 'Bewusst einkaufen')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Blaue Linie',
    filterKeys: TOURS_MAPPINGS.find((m) => m.heading === 'Blaue Linie')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'eMobilität',
    filterKeys: TOURS_MAPPINGS.find((m) => m.heading === 'eMobilität')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Erholung & Gesundheit',
    filterKeys: CULTURE_MAPPINGS.find((m) => m.heading === 'Erholung & Gesundheit')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Geschäfte',
    filterKeys: SHOPPING_MAPPINGS.find((m) => m.heading === 'Geschäfte')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'interaktiv',
    filterKeys: TOURS_MAPPINGS.find((m) => m.heading === 'interaktiv')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Lage',
    filterKeys: SHOPPING_MAPPINGS.find((m) => m.heading === 'Lage')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Mobil & Service',
    filterKeys: TOURS_MAPPINGS.find((m) => m.heading === 'Mobil & Service')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Öffentliche Gebäude',
    filterKeys: TOURS_MAPPINGS.find((m) => m.heading === 'Öffentliche Gebäude')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Sport & Freizeit',
    filterKeys: CULTURE_MAPPINGS.find((m) => m.heading === 'Sport & Freizeit')!.filterKeys,
  },
  {
    group: 'Orte & Tätigkeiten von Interesse (POI)',
    heading: 'Unterhaltung',
    filterKeys: CULTURE_MAPPINGS.find((m) => m.heading === 'Unterhaltung')!.filterKeys,
  },
  // --- Gastronomien (Restaurants) ---
  {
    group: 'Gastronomien (Restaurants)',
    heading: 'Betriebsart',
    filterKeys: FOOD_AND_DRINK_MAPPINGS.find((m) => m.heading === 'Betriebsart')!.filterKeys,
  },
  {
    group: 'Gastronomien (Restaurants)',
    heading: 'Küche',
    filterKeys: FOOD_AND_DRINK_MAPPINGS.find((m) => m.heading === 'Küche')!.filterKeys,
  },
  {
    group: 'Gastronomien (Restaurants)',
    heading: 'Lage',
    filterKeys: FOOD_AND_DRINK_MAPPINGS.find((m) => m.heading === 'Lage')!.filterKeys,
  },
];

// =============================================================================
// KODIER WOCHE EVENTS
// =============================================================================
const KODIER_WOCHE_EVENTS_MAPPINGS = [
  {
    heading: 'Lage',
    filterKeys: [
      'Schilksee',
      'Regattabahn Schilksee',
      'Vaasahalle',
      'Olympiazentrum Kodi-Schilksee',
      'Internationale Willer Balloon Sail',
      'Spiellinie Krusenkoppel',
      'Freilichtbühne Krusenkoppel',
      'Fördebühne',
      'Caribbean Island',
      'RADIO BOB! ROCKCAMP',
      'Woderkant Festival',
      'Bayernzelt',
      'Schlaumachwiese',
      'kodier uni live',
      'Kodier Woche Erlebniswelten',
      'Together Kodi',
      'Junge Bühne',
      'Playground',
      'MUDDI Markt',
      'Kodier-Woche-Hoftheater',
      'Rathausbühne',
      'Bühne Alter Markt',
      'SunExpress OCEAN Funpark',
      'Malle Bühne',
      'Kodier Heimathafen',
      'Kleine Hörn Bühne',
    ].map((value) => ({ field: 'manual', listingType: 'Event', value })) as FilterKey[],
  },
];

// Category slug to mapping configuration
interface CategoryFilterSeedEntry {
  heading: string;
  group?: string;
  filterKeys: FilterKey[];
}

const CATEGORY_FILTER_MAP: Record<string, CategoryFilterSeedEntry[]> = {
  'food-and-drink': FOOD_AND_DRINK_MAPPINGS,
  shopping: SHOPPING_MAPPINGS,
  culture: CULTURE_MAPPINGS,
  tours: TOURS_MAPPINGS,
  'show-me-more': SHOW_ME_MORE_MAPPINGS,
  'kodier-woche-events': KODIER_WOCHE_EVENTS_MAPPINGS,
};

async function seed() {
  console.log('🌱 Seeding Category Quick Filters...');

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let filtersCreated = 0;

  for (const [categorySlug, mappings] of Object.entries(CATEGORY_FILTER_MAP)) {
    // Look up category by slug
    const category = await prisma.category.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      console.log(`  ⚠️  Category "${categorySlug}" not found, skipping`);
      continue;
    }

    console.log(`\n  📁 Category: ${category.name} (${categorySlug})`);

    for (const mapping of mappings) {
      const headingLabel = mapping.group
        ? `${mapping.group} > ${mapping.heading}`
        : mapping.heading;

      for (let i = 0; i < mapping.filterKeys.length; i++) {
        const key = mapping.filterKeys[i];
        const { id: filterId, created } = await findOrCreateFilterId(key);
        if (created) filtersCreated++;

        try {
          const existing = await prisma.categoryFilter.findUnique({
            where: {
              categoryId_filterId: {
                categoryId: category.id,
                filterId,
              },
            },
          });

          if (existing) {
            await prisma.categoryFilter.update({
              where: { id: existing.id },
              data: {
                heading: mapping.heading,
                group: mapping.group || null,
                displayOrder: i,
                isActive: true,
              },
            });
            totalUpdated++;
          } else {
            await prisma.categoryFilter.create({
              data: {
                categoryId: category.id,
                filterId,
                heading: mapping.heading,
                group: mapping.group || null,
                displayOrder: i,
                isActive: true,
              },
            });
            totalCreated++;
          }
        } catch (err: any) {
          console.log(
            `    ⚠️  Error for filter ${filterId} (${key.value}): ${err.message}`,
          );
          totalSkipped++;
        }
      }

      console.log(
        `    ✅ ${headingLabel}: ${mapping.filterKeys.length} filters`,
      );
    }
  }

  console.log(`\n🎉 Category Quick Filters seeded!`);
  console.log(
    `   CategoryFilters - Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped: ${totalSkipped}`,
  );
  if (filtersCreated > 0) {
    console.log(`   Filters created (missing): ${filtersCreated}`);
  }
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
