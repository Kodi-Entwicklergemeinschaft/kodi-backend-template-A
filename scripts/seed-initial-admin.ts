#!/usr/bin/env ts-node
/**
 * Initial Admin Seeding Script
 *
 * Seeds:
 *  - Super Admin user (users database)
 *  - City record (city database)
 *  - City Admin user linked to the city (users database)
 *  - User city assignment for the City Admin with management permissions (core database)
 *
 * Prerequisites:
 * 1. Run all Prisma migrations: npm run prisma:migrate
 * 2. Generate Prisma clients: npm run prisma:generate
 * 3. Ensure CORE_DATABASE_URL, USERS_DATABASE_URL, and CITY_DATABASE_URL env vars are set
 *
 * Required env vars (no defaults — must be supplied before running):
 *   SUPER_ADMIN_EMAIL      - Email for the super admin account
 *   SUPER_ADMIN_PASSWORD   - Password for the super admin account (min 8 chars)
 *   CITY_ADMIN_EMAIL       - Email for the city admin account
 *   CITY_ADMIN_PASSWORD    - Password for the city admin account (min 8 chars)
 *
 * Optional env vars:
 *   SUPER_ADMIN_USERNAME   - Username for super admin (default: "superadmin")
 *   CITY_ADMIN_USERNAME    - Username for city admin (default: "cityadmin")
 *
 * Run: npm run seed:initial-admin
 */

import 'tsconfig-paths/register';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

import { PrismaClient as UsersPrismaClient, UserRole as UsersUserRole } from '@prisma/client-users';
import { PrismaClient as CityPrismaClient } from '@prisma/client-city';
import { PrismaClient as CorePrismaClient, UserRole as CoreUserRole } from '@prisma/client-core';
import { getCityHeaderImageUrl } from './assets/category-assets-mapping';

// ─────────────────────────────────────────────────────────────────────────────
// Storage Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if storage credentials are configured
 */
function isStorageConfigured(): boolean {
  return Boolean(
    process.env.HETZNER_STORAGE_ENDPOINT &&
      process.env.HETZNER_STORAGE_ACCESS_KEY_ID &&
      process.env.HETZNER_STORAGE_SECRET_ACCESS_KEY &&
      process.env.HETZNER_STORAGE_DEFAULT_BUCKET,
  );
}

/**
 * Initialize S3 client for Hetzner Object Storage
 */
function createS3Client(): S3Client | null {
  const endpoint = process.env.HETZNER_STORAGE_ENDPOINT;
  const accessKeyId = process.env.HETZNER_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.HETZNER_STORAGE_SECRET_ACCESS_KEY;
  const region = process.env.HETZNER_STORAGE_REGION || 'fsn1';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: false,
  });
}

/**
 * Generate public URL for an object in storage
 */
function generatePublicUrl(bucket: string, key: string): string {
  const endpoint = process.env.HETZNER_STORAGE_ENDPOINT;
  if (!endpoint) {
    throw new Error('HETZNER_STORAGE_ENDPOINT is not configured');
  }

  try {
    const endpointUrl = new URL(endpoint);
    const hostname = endpointUrl.hostname;
    const domainParts = hostname.split('.');
    if (domainParts.length < 2) {
      return `${endpoint}/${bucket}/${key}`;
    }
    return `${endpointUrl.protocol}//${bucket}.${hostname}/${key}`;
  } catch {
    return `${endpoint}/${bucket}/${key}`;
  }
}

/**
 * Upload city logo to object storage
 * @param cityId - The city ID to use in the storage path
 * @returns The public URL of the uploaded logo, or null if upload fails
 */
async function uploadCityLogo(cityId: string): Promise<string | null> {
  if (!isStorageConfigured()) {
    console.warn('⚠️  Storage not configured. Skipping logo upload.');
    return null;
  }

  const s3Client = createS3Client();
  if (!s3Client) {
    console.warn('⚠️  Could not create S3 client. Skipping logo upload.');
    return null;
  }

  const bucket = process.env.HETZNER_STORAGE_DEFAULT_BUCKET!;
  const logoPath = path.join(__dirname, 'assets', 'logos', 'kodi_logo.png');

  try {
    // Check if logo file exists
    await fs.access(logoPath);
  } catch {
    console.warn(`⚠️  Logo file not found at ${logoPath}. Skipping logo upload.`);
    return null;
  }

  try {
    const fileBuffer = await fs.readFile(logoPath);
    const key = `cities/${cityId}/logo.png`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: 'image/png',
        ACL: 'public-read',
        Metadata: {
          originalName: 'kodi_logo.png',
          width: '180',
          height: '180',
        },
      }),
    );

    const publicUrl = generatePublicUrl(bucket, key);
    console.log(`✓ Uploaded city logo: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.warn('⚠️  Failed to upload city logo:', error);
    return null;
  }
}

const usersPrisma = new UsersPrismaClient();
const cityPrisma = new CityPrismaClient();
const corePrisma = new CorePrismaClient();

type SeedResult = {
  superAdminId: string;
  cityId: string;
  cityAdminId: string;
};

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Required environment variable ${name} is not set. ` +
        'Set it before running this seed script.',
    );
  }
  return value;
}

const SUPER_ADMIN_EMAIL = requireEnv('SUPER_ADMIN_EMAIL');
const SUPER_ADMIN_PASSWORD = requireEnv('SUPER_ADMIN_PASSWORD');
const CITY_ADMIN_EMAIL = requireEnv('CITY_ADMIN_EMAIL');
const CITY_ADMIN_PASSWORD = requireEnv('CITY_ADMIN_PASSWORD');

async function ensureSuperAdmin(): Promise<string> {
  const email = SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const username = process.env.SUPER_ADMIN_USERNAME?.trim() || 'superadmin';
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);

  const existing = await usersPrisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    await usersPrisma.user.update({
      where: { id: existing.id },
      data: {
        username,
        role: UsersUserRole.SUPER_ADMIN,
        firstName: 'Super',
        lastName: 'Admin',
        emailVerified: true,
        isActive: true,
        password: hashedPassword,
      },
    });
    console.log(`↻ Updated Super Admin user (${email})`);
    return existing.id;
  }

  const created = await usersPrisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      role: UsersUserRole.SUPER_ADMIN,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      isActive: true,
    },
    select: { id: true },
  });

  console.log(`✓ Created Super Admin user (${email})`);
  return created.id;
}

async function ensureKodiCity(): Promise<string> {
  const name = 'Kodi';
  const key = 'kodi';
  const country = 'Germany';
  const state = 'Schleswig-Holstein';
  const headerImageUrl = getCityHeaderImageUrl('kodi');

  // Check if city exists first to get ID for logo upload
  const existing = await cityPrisma.city.findFirst({
    where: {
      name,
      country,
      state,
    },
    select: { id: true, headerImageUrl: true, metadata: true },
  });

  // For existing city, use existing ID; for new city, we'll create first then upload logo
  let cityId: string;
  let logoUrl: string | null = null;

  if (existing) {
    cityId = existing.id;

    // Check if logo is already uploaded (in metadata)
    const existingMetadata = existing.metadata as Record<string, unknown> | null;
    const existingEmailTheme = existingMetadata?.emailTheme as Record<string, unknown> | null;
    const existingLogoUrl = existingEmailTheme?.logoUrl as string | undefined;

    // Only upload logo if not already set
    if (!existingLogoUrl || !existingLogoUrl.startsWith('http')) {
      logoUrl = await uploadCityLogo(cityId);
    } else {
      logoUrl = existingLogoUrl;
      console.log(`ℹ City logo already set: ${logoUrl}`);
    }
  } else {
    // Create city first to get ID, then upload logo
    const created = await cityPrisma.city.create({
      data: {
        name,
        key,
        country,
        state,
        latitude: 54.3233,
        longitude: 10.1228,
        timezone: 'Europe/Berlin',
        population: 246601,
        isActive: true,
        headerImageUrl,
        metadata: {},
      },
      select: { id: true },
    });
    cityId = created.id;
    console.log('✓ Created city record for Kodi');

    // Upload logo for newly created city
    logoUrl = await uploadCityLogo(cityId);
  }

  // Build email theme with logo configuration
  const emailTheme = {
    appName: 'mein.Kodi',
    appNameDisplay: 'mein.Kodi',
    primaryColor: '#009EE0',
    secondaryColor: '#00223f',
    accentColor: '#009EE0',
    greetingKey: 'kodi', // Uses 'emails.verification.greetingKodi' translation (e.g., "Willkommen bei mein.Kodi")
    logoUrl: logoUrl,
    logoWidth: 90,
    logoHeight: 90,
    emailTheme: {
      headerBackgroundColor: '#00223f',
      footerBackgroundColor: '#009EE0',
      buttonColor: '#ffffff',
      buttonTextColor: '#009EE0',
    },
  };

  if (existing) {
    // Preserve existing storage URL if it's already set (starts with http/https)
    const shouldUpdateHeaderImage =
      !existing.headerImageUrl ||
      (!existing.headerImageUrl.startsWith('http://') &&
        !existing.headerImageUrl.startsWith('https://'));

    await cityPrisma.city.update({
      where: { id: existing.id },
      data: {
        key,
        latitude: 54.3233,
        longitude: 10.1228,
        timezone: 'Europe/Berlin',
        population: 246601,
        isActive: true,
        metadata: {
          emailTheme,
        },
        ...(shouldUpdateHeaderImage && headerImageUrl ? { headerImageUrl } : {}),
      },
    });
    console.log('↻ Updated city record for Kodi with email theme, logo, and key');
    if (shouldUpdateHeaderImage && headerImageUrl) {
      console.log(`  • Header image set: ${headerImageUrl}`);
    }
    if (logoUrl) {
      console.log(`  • Logo URL: ${logoUrl}`);
    }
  } else {
    // Update the newly created city with email theme
    await cityPrisma.city.update({
      where: { id: cityId },
      data: {
        metadata: {
          emailTheme,
        },
      },
    });
    console.log('✓ Updated city record for Kodi with email theme and logo');
    if (headerImageUrl) {
      console.log(`  • Header image: ${headerImageUrl}`);
    }
    if (logoUrl) {
      console.log(`  • Logo URL: ${logoUrl}`);
    }
  }

  return cityId;
}

async function ensureCityAdmin(cityId: string): Promise<string> {
  const email = CITY_ADMIN_EMAIL.trim().toLowerCase();
  const username = process.env.CITY_ADMIN_USERNAME?.trim() || 'cityadmin';
  const hashedPassword = await bcrypt.hash(CITY_ADMIN_PASSWORD, 12);

  const existing = await usersPrisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    await usersPrisma.user.update({
      where: { id: existing.id },
      data: {
        username,
        role: UsersUserRole.CITY_ADMIN,
        cityId,
        firstName: 'Kodi',
        lastName: 'Admin',
        emailVerified: true,
        isActive: true,
        password: hashedPassword,
      },
    });
    console.log(`↻ Updated City Admin user (${email})`);
    return existing.id;
  }

  const created = await usersPrisma.user.create({
    data: {
      email,
      username,
      password: hashedPassword,
      role: UsersUserRole.CITY_ADMIN,
      cityId,
      firstName: 'Kodi',
      lastName: 'Admin',
      emailVerified: true,
      isActive: true,
    },
    select: { id: true },
  });

  console.log(`✓ Created City Admin user (${email})`);
  return created.id;
}

async function ensureCityAssignment(cityAdminId: string, cityId: string, assignedBy?: string) {
  await corePrisma.userCityAssignment.upsert({
    where: {
      userId_cityId: {
        userId: cityAdminId,
        cityId,
      },
    },
    update: {
      role: CoreUserRole.CITY_ADMIN,
      canManageAdmins: true,
      isActive: true,
      assignedBy,
    },
    create: {
      userId: cityAdminId,
      cityId,
      role: CoreUserRole.CITY_ADMIN,
      canManageAdmins: true,
      isActive: true,
      assignedBy,
    },
  });
  console.log('✓ Ensured city admin assignment in core database');
}

async function seed(): Promise<SeedResult> {
  console.log('🌱 Starting initial admin seeding...');

  const superAdminId = await ensureSuperAdmin();
  const cityId = await ensureKodiCity();
  const cityAdminId = await ensureCityAdmin(cityId);

  await ensureCityAssignment(cityAdminId, cityId, superAdminId);

  return { superAdminId, cityId, cityAdminId };
}

seed()
  .then(async (result) => {
    console.log('\n📊 Seeding summary:');
    console.log(`  • Super Admin ID: ${result.superAdminId}`);
    console.log(`  • City ID: ${result.cityId}`);
    console.log(`  • City Admin ID: ${result.cityAdminId}`);
    console.log('\n🎉 Initial admin seeding completed successfully!');
  })
  .catch((error) => {
    console.error('❌ Error during initial admin seeding:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await Promise.allSettled([
      usersPrisma.$disconnect(),
      cityPrisma.$disconnect(),
      corePrisma.$disconnect(),
    ]);
  });
