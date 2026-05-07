#!/usr/bin/env ts-node
/**
 * Upload Tile Assets to Object Storage
 *
 * This script uploads tile background and icon images to object storage
 * and updates the database with the public URLs.
 *
 * Prerequisites:
 *   1. Ensure tiles are seeded in the database (or will be seeded)
 *   2. Set storage environment variables (HETZNER_STORAGE_*)
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/upload-tile-assets.ts [--skip-existing]
 *
 * Options:
 *   --skip-existing: Skip uploading if imageUrl is already set in database
 */

import 'tsconfig-paths/register';

import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient as CorePrismaClient } from '@prisma/client-core';
import { TILE_ASSETS } from './assets/tile-assets-mapping';
import sharp from 'sharp';

const SKIP_EXISTING = process.argv.includes('--skip-existing');

// Initialize S3 client for Hetzner Object Storage
function createS3Client() {
  const endpoint = process.env.HETZNER_STORAGE_ENDPOINT;
  const accessKeyId = process.env.HETZNER_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.HETZNER_STORAGE_SECRET_ACCESS_KEY;
  const region = process.env.HETZNER_STORAGE_REGION || 'fsn1';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Storage credentials not configured. Please set HETZNER_STORAGE_ENDPOINT, HETZNER_STORAGE_ACCESS_KEY_ID, and HETZNER_STORAGE_SECRET_ACCESS_KEY environment variables.',
    );
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

// Generate public URL
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
  } catch (error) {
    return `${endpoint}/${bucket}/${key}`;
  }
}

// Process image using sharp (same as FileUploadService)
async function processImage(
  inputBuffer: Buffer,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 85,
): Promise<Buffer> {
  let image = sharp(inputBuffer);
  const metadata = await image.metadata();

  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }

  return image.webp({ quality }).toBuffer();
}

async function uploadTileImage(
  s3Client: S3Client,
  bucket: string,
  tileId: string,
  filePath: string,
  imageType: 'background' | 'icon',
): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const processedBuffer = await processImage(fileBuffer);

  const key = `tiles/${tileId}/${imageType}.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/webp',
      ACL: 'public-read',
      CacheControl: 'no-cache',
      Metadata: {
        originalName: path.basename(filePath),
        processed: 'true',
        imageType,
      },
    }),
  );

  return generatePublicUrl(bucket, key);
}

async function main() {
  console.log('☁️  Upload Tile Assets to Object Storage');
  console.log('==========================================\n');

  if (SKIP_EXISTING) {
    console.log('⏭️  SKIP_EXISTING mode: Will skip tiles with existing imageUrl\n');
  }

  const assetsDir = path.join(__dirname, 'assets');
  const tilesDir = path.join(assetsDir, 'tiles');

  // Check directory exists
  if (
    !(await fs
      .access(tilesDir)
      .then(() => true)
      .catch(() => false))
  ) {
    console.error('❌ Tiles directory not found. Please ensure scripts/assets/tiles/ exists.');
    process.exit(1);
  }

  // Initialize services
  const s3Client = createS3Client();
  const bucket = process.env.HETZNER_STORAGE_DEFAULT_BUCKET;
  if (!bucket) {
    throw new Error('HETZNER_STORAGE_DEFAULT_BUCKET is not configured');
  }

  const corePrisma = new CorePrismaClient();

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Upload tile images
  console.log('📦 Uploading tile images...\n');
  for (const [slug, asset] of Object.entries(TILE_ASSETS)) {
    const backgroundPath = path.join(tilesDir, asset.backgroundFileName);
    const iconPath = asset.iconFileName ? path.join(tilesDir, asset.iconFileName) : null;

    // Check if files exist
    const backgroundExists = await fs
      .access(backgroundPath)
      .then(() => true)
      .catch(() => false);
    const iconExists = iconPath
      ? await fs
          .access(iconPath)
          .then(() => true)
          .catch(() => false)
      : false;

    if (!backgroundExists) {
      console.log(
        `⚠️  Background file not found: ${asset.backgroundFileName} (tile: ${asset.slug})`,
      );
      errorCount++;
      continue;
    }

    if (iconPath && !iconExists) {
      console.log(`⚠️  Icon file not found: ${asset.iconFileName} (tile: ${asset.slug})`);
      errorCount++;
      continue;
    }

    try {
      // Find tile by slug (dynamic lookup)
      const tile = await corePrisma.tile.findUnique({
        where: { slug },
        select: { id: true, backgroundImageUrl: true, iconImageUrl: true },
      });

      if (!tile) {
        console.log(
          `⚠️  Tile not found in database: ${slug}. You may need to run seed:tiles first.`,
        );
        errorCount++;
        continue;
      }

      const tileId = tile.id;

      // Skip if already uploaded
      const hasBackground = !!tile.backgroundImageUrl;
      const hasIcon = !!tile.iconImageUrl;
      const needsIcon = !!iconPath && iconExists;
      if (SKIP_EXISTING && hasBackground && (!needsIcon || hasIcon)) {
        console.log(`⏭️  Skipping ${slug} (already has imageUrls)`);
        skippedCount++;
        continue;
      }

      console.log(`📤 Uploading ${slug}...`);

      // Upload background image
      let backgroundImageUrl = tile.backgroundImageUrl;
      if (!backgroundImageUrl || !SKIP_EXISTING) {
        backgroundImageUrl = await uploadTileImage(
          s3Client,
          bucket,
          tileId,
          backgroundPath,
          'background',
        );
        console.log(`  ✓ Background uploaded: ${backgroundImageUrl}`);
      } else {
        console.log(`  ⏭️  Background skipped (already exists)`);
      }

      // Upload icon image (only if iconFileName is provided)
      let iconImageUrl: string | null = tile.iconImageUrl;
      if (needsIcon) {
        if (!iconImageUrl || !SKIP_EXISTING) {
          iconImageUrl = await uploadTileImage(s3Client, bucket, tileId, iconPath!, 'icon');
          console.log(`  ✓ Icon uploaded: ${iconImageUrl}`);
        } else {
          console.log(`  ⏭️  Icon skipped (already exists)`);
        }
      } else {
        iconImageUrl = null;
      }

      // Update database
      await corePrisma.tile.update({
        where: { id: tileId },
        data: {
          backgroundImageUrl,
          iconImageUrl,
        },
      });

      uploadedCount++;
    } catch (error) {
      console.error(
        `  ❌ Failed to upload ${slug}:`,
        error instanceof Error ? error.message : error,
      );
      errorCount++;
    }
  }

  // Summary
  console.log('\n\n📊 Upload Summary');
  console.log('================');
  console.log(`✓ Uploaded: ${uploadedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  await corePrisma.$disconnect();

  console.log('\n✅ Upload complete!');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
