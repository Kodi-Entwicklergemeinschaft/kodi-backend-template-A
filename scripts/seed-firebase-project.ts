#!/usr/bin/env ts-node
/**
 * Firebase Project Seeding Script
 *
 * Seeds or updates a Firebase project configuration for a specific city (or the default Kodi app).
 *
 * Usage examples:
 *   # Seed Kodi staging project using service account JSON
 *   npx ts-node -r tsconfig-paths/register scripts/seed-firebase-project.ts \
 *     --cityId=15f0b1d4-4f6b-4ac7-b9f5-6e4c1c2c9c0b \
 *     --projectId=kodi-staging \
 *     --projectName="Kodi Staging" \
 *     --credentialsPath=./kodi-staging-firebase-adminsdk-fbsvc-f777e13f48.json
 *
 *   # Seed default Kodi project (no city, mark as default)
 *   npx ts-node -r tsconfig-paths/register scripts/seed-firebase-project.ts \
 *     --projectId=kodi-app \
 *     --projectName="Kodi Default" \
 *     --credentialsPath=/secure/path/service-account.json \
 *     --isDefault
 */

import 'tsconfig-paths/register';
import { PrismaClient } from '@prisma/client-notification';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

type SeedOptions = {
  cityId?: string | null;
  projectId: string;
  projectName: string;
  credentialsPath: string;
  isDefault: boolean;
  metadata?: Record<string, any>;
};

const prisma = new PrismaClient();

function printUsage(): void {
  console.log(`
Usage:
  ts-node scripts/seed-firebase-project.ts [options]

Required options:
  --projectId=<firebase-project-id>
  --projectName="<human readable name>"
  --credentialsPath=<path-to-service-account-json>

Optional flags:
  --cityId=<city-id>               City that owns this Firebase project (omit for Kodi default)
  --isDefault                      Mark this project as the Kodi app default (cityId must be omitted)
  --metadata='{"region":"europe-west1"}'

Examples:
  ts-node scripts/seed-firebase-project.ts --cityId=abc --projectId=my-city --projectName="City Prod" --credentialsPath=./city.json
  ts-node scripts/seed-firebase-project.ts --projectId=kodi --projectName="Kodi Default" --credentialsPath=./default.json --isDefault
`);
}

function parseArgs(): SeedOptions {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const options: Record<string, string | boolean> = {};

  for (const arg of args) {
    if (!arg.startsWith('--')) {
      continue;
    }

    const trimmed = arg.slice(2);
    if (trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      options[key] = valueParts.join('=');
    } else {
      options[trimmed] = true;
    }
  }

  const projectId = (options.projectId as string) || '';
  const projectName = (options.projectName as string) || '';
  const credentialsPath = (options.credentialsPath as string) || '';
  const cityIdRaw = (options.cityId as string) || undefined;
  const isDefault = Boolean(options.isDefault);
  const metadataRaw = options.metadata as string | undefined;

  if (!projectId || !projectName || !credentialsPath) {
    console.error('❌ Missing required options.');
    printUsage();
    process.exit(1);
  }

  if (isDefault && cityIdRaw) {
    console.error(
      '❌ "--isDefault" cannot be combined with "--cityId". Default project must not be bound to a city.',
    );
    process.exit(1);
  }

  let metadata: Record<string, any> | undefined;
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch (error) {
      console.error('❌ Failed to parse metadata JSON:', error);
      process.exit(1);
    }
  }

  return {
    cityId: cityIdRaw === 'null' ? null : cityIdRaw,
    projectId,
    projectName,
    credentialsPath,
    isDefault,
    metadata,
  };
}

function loadCredentials(filePath: string): Record<string, any> {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`❌ Credentials file not found: ${resolvedPath}`);
    process.exit(1);
  }

  try {
    const raw = fs.readFileSync(resolvedPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`❌ Failed to read credentials file ${resolvedPath}:`, error);
    process.exit(1);
  }
}

function encryptCredentials(credentials: Record<string, any>, keySource: string): string {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(keySource, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  });
}

async function main() {
  const options = parseArgs();
  const credentials = loadCredentials(options.credentialsPath);

  const encryptionKey =
    process.env.FCM_ENCRYPTION_KEY ||
    process.env.FCM_DEFAULT_ENCRYPTION_KEY ||
    'default-key-change-in-production';

  const encryptedCredentials = encryptCredentials(credentials, encryptionKey);

  const payload = {
    cityId: options.cityId ?? null,
    projectId: options.projectId,
    projectName: options.projectName,
    credentials: encryptedCredentials as unknown as Record<string, any>,
    isActive: true,
    isDefault: options.isDefault ?? false,
    metadata: options.metadata ?? undefined,
  };

  console.log('🌱 Seeding Firebase project configuration...');
  console.log(`   City ID     : ${payload.cityId ?? '(default)'}`);
  console.log(`   Project ID  : ${payload.projectId}`);
  console.log(`   Project Name: ${payload.projectName}`);
  if (payload.isDefault) {
    console.log('   Marked as default Kodi project');
  }

  const upsertResult = await prisma.firebaseProject.upsert({
    where: {
      cityId: payload.cityId ?? undefined,
    },
    update: {
      projectId: payload.projectId,
      projectName: payload.projectName,
      credentials: payload.credentials,
      isActive: payload.isActive,
      isDefault: payload.isDefault,
      metadata: payload.metadata,
    },
    create: payload,
  });

  console.log('\n✅ Firebase project saved successfully:');
  console.log(`   Record ID : ${upsertResult.id}`);
  console.log(`   Updated At: ${upsertResult.updatedAt.toISOString()}`);
}

main()
  .catch((error) => {
    console.error('❌ Failed to seed Firebase project:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
