#!/usr/bin/env ts-node
/**
 * Kodier Verwaltung Listings Import Script
 *
 * Reads the Ämterübersicht Excel file and imports rows as listings
 * under the "kodier-verwaltung" category. Geocodes addresses via
 * OpenStreetMap Nominatim API.
 *
 * Prerequisites:
 * 1. Run all Prisma migrations: npm run prisma:migrate
 * 2. Generate Prisma clients: npm run prisma:generate
 * 3. Ensure CORE_DATABASE_URL and CITY_DATABASE_URL env vars are set
 * 4. Run npm run seed:initial-admin (Kodi city must exist)
 * 5. Run npm run seed:categories (kodier-verwaltung category must exist)
 *
 * Run: npm run seed:kodier-verwaltung
 *
 * Optional env vars:
 *   EXCEL_PATH - Override default path to the Excel file
 */

import 'tsconfig-paths/register';

import * as path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient as CorePrismaClient, ListingSourceType, Prisma } from '@prisma/client-core';
import { PrismaClient as CityPrismaClient } from '@prisma/client-city';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma clients
// ─────────────────────────────────────────────────────────────────────────────

const corePrisma = new CorePrismaClient();
const cityPrisma = new CityPrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORY_SLUG = 'kodier-verwaltung';
const EXTERNAL_SOURCE = 'kodier-verwaltung-excel';
const NOMINATIM_DELAY_MS = 1100;
const NOMINATIM_USER_AGENT = 'KodiMicroservices/1.0 (seed-script)';

const DEFAULT_EXCEL_PATH = path.resolve(__dirname, '..', 'data', 'Ämterübersicht.xlsx');

// Column indices (0-based) from the Excel header row (row index 2)
const COL = {
  AMT: 0,
  BEREICH: 1,
  LINK: 2,
  OEFFNUNGSZEITEN: 3,
  TELEFON: 4,
  EMAIL: 5,
  NAVIGATION: 6,
  BARRIEREFREIER_ZUGANG: 7,
  PUBLIKUMSVERKEHR: 9, // Online-Dienst (Publikumsverkehr may have moved/merged)
  ONLINE_TERMIN: 8, // Online-Terminbuchng - appointment booking URL (index 9 is Online-Dienst)
  SONSTIGES: 10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cellStr(row: unknown[], index: number): string | null {
  const val = row[index];
  if (val === undefined || val === null) return null;
  const str = String(val).trim();
  return str.length > 0 ? str : null;
}

/** Regex to extract German phone number from text (e.g. "Tel. +49 431 901-1007" or "0431 901-3666") */
const PHONE_PATTERN = /(?:\+49\s?)?0?\d{2,5}[\s\-]\d{3,}[\s\-]?\d{2,}/;

/**
 * Extract first phone number from cell. Returns only a valid number or null.
 * Handles: "Label\nNumber", "Label, Tel. +49 431 901-1007", multiple numbers.
 */
function extractFirstPhone(value: string | null): string | null {
  if (!value) return null;
  const lines = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  // First try: find line that starts with 0 or + (standalone number)
  const standaloneLine = lines.find((line) => /^[0+]\d/.test(line));
  if (standaloneLine) return standaloneLine;
  // Second try: extract number from within a line (e.g. "Pressesprecherin Kerstin Graupner, Tel. +49 431 901-1007")
  for (const line of lines) {
    const match = line.match(PHONE_PATTERN);
    if (match) return match[0].trim();
  }
  return null;
}

/**
 * Extract first email from cell that may have multiple values.
 */
function extractFirstEmail(value: string | null): string | null {
  if (!value) return null;
  const lines = value.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (lines.length === 0) return null;
  const emailLine = lines.find((line) => /\S+@\S+\.\S+/.test(line));
  return emailLine ?? lines[0];
}

/**
 * Get hyperlink URL from a cell in the worksheet.
 * Excel stores URLs in cell.l.Target; cell.v is the display label.
 * Returns the URL if present, otherwise null.
 */
function getCellHyperlinkUrl(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
): string | null {
  const addr = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
  const cell = sheet[addr];
  if (!cell?.l?.Target) return null;
  const url = String(cell.l.Target).trim();
  return url.length > 0 ? url : null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// Geocoding cache – avoids duplicate Nominatim calls for the same address
// ─────────────────────────────────────────────────────────────────────────────

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const normalised = address.replace(/\(.*?\)/g, '').trim();

  if (geocodeCache.has(normalised)) {
    return geocodeCache.get(normalised)!;
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', normalised);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      console.warn(`  ⚠ Nominatim returned ${response.status} for "${normalised}"`);
      geocodeCache.set(normalised, null);
      return null;
    }

    const results = (await response.json()) as Array<{ lat: string; lon: string }>;
    if (results.length === 0) {
      console.warn(`  ⚠ No geocoding result for "${normalised}"`);
      geocodeCache.set(normalised, null);
      return null;
    }

    const coords = {
      lat: parseFloat(results[0].lat),
      lng: parseFloat(results[0].lon),
    };
    console.log(`  📍 Geocoded "${normalised}" → ${coords.lat}, ${coords.lng}`);
    geocodeCache.set(normalised, coords);
    return coords;
  } catch (err: any) {
    console.warn(`  ⚠ Geocoding failed for "${normalised}": ${err?.message}`);
    geocodeCache.set(normalised, null);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Content builder – generates HTML from available metadata
// ─────────────────────────────────────────────────────────────────────────────

function buildContent(row: {
  openingHours: string | null;
  accessibility: string | null;
  publicAccess: string | null;
  publicAccessUrl?: string | null;
  notes: string | null;
  contactDetails?: string | null;
}): string {
  const sections: string[] = [];

  if (row.openingHours) {
    sections.push(
      `<h3>Öffnungszeiten</h3><p>${row.openingHours.replace(/\n/g, '<br>')}</p>`,
    );
  }
  if (row.accessibility) {
    sections.push(
      `<h3>Barrierefreier Zugang</h3><p>${row.accessibility.replace(/\n/g, '<br>')}</p>`,
    );
  }
  if (row.publicAccess || row.publicAccessUrl) {
    const linkContent = row.publicAccessUrl
      ? `<a href="${row.publicAccessUrl}" target="_blank" rel="noopener noreferrer" style="font-size: 1.75rem;">${row.publicAccess || row.publicAccessUrl}</a>`
      : (row.publicAccess ?? '');
    sections.push(`<h3>Online-Dienst</h3><p>${linkContent}</p>`);
  }
  if (row.notes) {
    sections.push(`<h3>Sonstiges</h3><p>${row.notes.replace(/\n/g, '<br>')}</p>`);
  }
  if (row.contactDetails) {
    sections.push(
      `<h3>Kontakt</h3><p>${row.contactDetails.replace(/\n/g, '<br>')}</p>`,
    );
  }

  return sections.length > 0 ? sections.join('\n') : '';
}

// ─────────────────────────────────────────────────────────────────────────────
// Ensure unique slug in the database
// ─────────────────────────────────────────────────────────────────────────────

async function ensureUniqueSlug(baseSlug: string, currentId?: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await corePrisma.listing.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === currentId) {
      return candidate;
    }

    candidate = `${baseSlug}-${counter++}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helpers
// ─────────────────────────────────────────────────────────────────────────────

async function getKodiCityId(): Promise<string> {
  const city = await cityPrisma.city.findFirst({
    where: { name: 'Kodi', country: 'Germany', state: 'Schleswig-Holstein' },
    select: { id: true },
  });

  if (!city) {
    throw new Error('Kodi city not found. Please run npm run seed:initial-admin first.');
  }

  return city.id;
}

async function getCategoryId(): Promise<string> {
  const category = await corePrisma.category.findUnique({
    where: { slug: CATEGORY_SLUG },
    select: { id: true },
  });

  if (!category) {
    throw new Error(
      `Category "${CATEGORY_SLUG}" not found. Please run npm run seed:categories first.`,
    );
  }

  return category.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main import logic
// ─────────────────────────────────────────────────────────────────────────────

interface SeedSummary {
  created: number;
  updated: number;
  skipped: number;
  geocoded: number;
  geocodeFailed: number;
  geocodeFailedList: Array<{ address: string; title: string }>;
}

async function importListings(): Promise<SeedSummary> {
  const excelPath = process.env.EXCEL_PATH || DEFAULT_EXCEL_PATH;
  console.log(`📂 Reading Excel file: ${excelPath}`);

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: true,
  });

  // Data starts at row index 3 (0=meta header, 1=blank, 2=column headers, 3+=data)
  const dataRows = rows.slice(3);
  console.log(`📊 Found ${dataRows.length} data rows in sheet "${sheetName}"\n`);

  const categoryId = await getCategoryId();
  const cityId = await getKodiCityId();
  console.log(`🏷️  Category ID: ${categoryId}`);
  console.log(`🏙️  Kodi City ID: ${cityId}\n`);

  const summary: SeedSummary = {
    created: 0,
    updated: 0,
    skipped: 0,
    geocoded: 0,
    geocodeFailed: 0,
    geocodeFailedList: [],
  };

  let needsGeoDelay = false;

  // Process in reverse order so first sheet row gets inserted last → most recent createdAt → appears at top (API sorts by createdAt desc)
  for (let i = dataRows.length - 1; i >= 0; i--) {
    const row = dataRows[i] as unknown[];
    const excelRowIndex = 3 + i; // Data starts at row 4 (0-based index 3)

    const amt = cellStr(row, COL.AMT);
    const bereich = cellStr(row, COL.BEREICH);

    if (!amt && !bereich) {
      summary.skipped++;
      continue;
    }

    // Interchanged: Bereich -> title (label), Amt -> summary
    const title = bereich || amt || 'Unbekanntes Amt';
    const summaryText = amt || null;
    // Link column: extract URL from hyperlink (cell.l.Target), not the display label (cell.v)
    const website = getCellHyperlinkUrl(sheet, excelRowIndex, COL.LINK);
    const link = website ?? cellStr(row, COL.LINK); // Fallback to label if no hyperlink
    const openingHours = cellStr(row, COL.OEFFNUNGSZEITEN);
    const phoneRaw = cellStr(row, COL.TELEFON);
    const emailRaw = cellStr(row, COL.EMAIL);
    const phone = extractFirstPhone(phoneRaw);
    const email = extractFirstEmail(emailRaw);
    // When phone has multiple values or "Label\nNumber" pattern, add full cell to description
    const contactDetails =
      phoneRaw && (phoneRaw.includes('\n') || phoneRaw.includes('\r'))
        ? phoneRaw
        : null;
    const navigation = cellStr(row, COL.NAVIGATION);
    const accessibility = cellStr(row, COL.BARRIEREFREIER_ZUGANG);
    const publicAccess = cellStr(row, COL.PUBLIKUMSVERKEHR);
    const publicAccessUrl = getCellHyperlinkUrl(sheet, excelRowIndex, COL.PUBLIKUMSVERKEHR);
    // Online-Terminbuchung: extract URL from hyperlink, fallback to cell text if it looks like a URL
    const onlineTerminUrl = getCellHyperlinkUrl(sheet, excelRowIndex, COL.ONLINE_TERMIN);
    const onlineTerminText = cellStr(row, COL.ONLINE_TERMIN);
    const onlineTermin =
      onlineTerminUrl ??
      (onlineTerminText && /^https?:\/\//i.test(onlineTerminText.trim())
        ? onlineTerminText.trim()
        : null);
    const notes = cellStr(row, COL.SONSTIGES);

    // Build slug and externalId from Amt + Bereich
    const slugBase = slugify([amt, bereich].filter(Boolean).join(' '));
    const externalId = slugBase;

    // Geocode address if present
    let geoLat: number | null = null;
    let geoLng: number | null = null;

    if (navigation) {
      if (needsGeoDelay) {
        await sleep(NOMINATIM_DELAY_MS);
      }
      const coords = await geocodeAddress(navigation);
      if (coords) {
        geoLat = coords.lat;
        geoLng = coords.lng;
        summary.geocoded++;
      } else {
        summary.geocodeFailed++;
        summary.geocodeFailedList.push({ address: navigation, title });
      }
      needsGeoDelay = true;
    }

    const metadata: Record<string, string> = {};
    if (openingHours) metadata.openingHours = openingHours;
    if (accessibility) metadata.accessibilityInfo = accessibility;
    if (publicAccess) metadata.publicAccess = publicAccess;
    if (notes) metadata.notes = notes;

    const metadataJson: Prisma.InputJsonValue | undefined =
      Object.keys(metadata).length > 0 ? metadata : undefined;

    const content = buildContent({
      openingHours,
      accessibility,
      publicAccess,
      publicAccessUrl,
      notes,
      contactDetails,
    });

    // Check for existing listing by externalSource + externalId
    const existing = await corePrisma.listing.findFirst({
      where: { externalSource: EXTERNAL_SOURCE, externalId },
      select: { id: true, slug: true },
    });

    if (existing) {
      // Update existing listing
      await corePrisma.listing.update({
        where: { id: existing.id },
        data: {
          title,
          summary: summaryText,
          content,
          sourceUrl: link,
          website,
          contactPhone: phone,
          contactEmail: email !== 'nein' ? email : null,
          address: navigation,
          geoLat: geoLat ?? undefined,
          geoLng: geoLng ?? undefined,
          onlineAppointmentUrl: onlineTermin,
          metadata: metadataJson,
          languageCode: 'de',
        },
      });

      // Delete stale translations so they reflect updated content on next read
      await corePrisma.translation.deleteMany({
        where: {
          entityType: 'listing',
          entityId: existing.id,
          field: { in: ['title', 'summary', 'content'] },
        },
      });

      summary.updated++;
      console.log(`↻ Updated [${i + 1}/${dataRows.length}]: ${title}${bereich ? ' - ' + bereich : ''}`);
    } else {
      // Create new listing
      const slug = await ensureUniqueSlug(slugBase);

      await corePrisma.listing.create({
        data: {
          slug,
          title,
          summary: summaryText,
          content,
          status: 'APPROVED',
          moderationStatus: 'APPROVED',
          visibility: 'PUBLIC',
          sourceType: ListingSourceType.API_IMPORT,
          externalSource: EXTERNAL_SOURCE,
          externalId,
          sourceUrl: link,
          website,
          languageCode: 'de',
          publishAt: new Date(),
          contactPhone: phone,
          contactEmail: email !== 'nein' ? email : null,
          address: navigation,
          geoLat: geoLat ?? undefined,
          geoLng: geoLng ?? undefined,
          onlineAppointmentUrl: onlineTermin,
          metadata: metadataJson,
          primaryCityId: cityId,
          categories: {
            create: { categoryId },
          },
          cities: {
            create: { cityId, isPrimary: true },
          },
        },
      });

      summary.created++;
      console.log(`✓ Created [${i + 1}/${dataRows.length}]: ${title}${bereich ? ' - ' + bereich : ''}`);
    }
  }

  return summary;
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

importListings()
  .then((summary) => {
    console.log('\n📊 Import summary:');
    console.log(`  • Created: ${summary.created}`);
    console.log(`  • Updated: ${summary.updated}`);
    console.log(`  • Skipped (empty rows): ${summary.skipped}`);
    console.log(`  • Geocoded: ${summary.geocoded}`);
    console.log(`  • Geocode failed: ${summary.geocodeFailed}`);
    if (summary.geocodeFailedList.length > 0) {
      console.log('\n⚠️  Addresses without geolocation:');
      summary.geocodeFailedList.forEach(({ address, title }, idx) => {
        console.log(`  ${idx + 1}. ${title}`);
        console.log(`     Address: ${address.replace(/\n/g, ' ')}`);
      });
    }
    console.log('\n🎉 Kodier Verwaltung import completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Error during import:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([corePrisma.$disconnect(), cityPrisma.$disconnect()]);
  });
