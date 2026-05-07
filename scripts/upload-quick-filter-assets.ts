#!/usr/bin/env ts-node
/**
 * Upload Quick Filter Assets to Object Storage
 *
 * This script uploads quick filter images to object storage and outputs
 * the URLs to update in category-quick-filters.config.ts.
 *
 * Prerequisites:
 *   1. Ensure quick filter images exist in scripts/assets/quick-filters/
 *   2. Set storage environment variables (HETZNER_STORAGE_*)
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/upload-quick-filter-assets.ts
 */

import 'tsconfig-paths/register';

import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { QUICK_FILTER_ASSETS } from './assets/quick-filter-assets-mapping';

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

// Process image using sharp
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

// Check if object exists in S3
async function objectExists(s3Client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (error) {
    return false;
  }
}

async function uploadQuickFilterImage(
  s3Client: S3Client,
  bucket: string,
  categorySlug: string,
  filterKey: string,
  filePath: string,
): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const processedBuffer = await processImage(fileBuffer);

  const key = `quick-filters/${categorySlug}/${filterKey}.webp`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: processedBuffer,
      ContentType: 'image/webp',
      ACL: 'public-read',
      Metadata: {
        originalName: path.basename(filePath),
        processed: 'true',
        category: categorySlug,
        filter: filterKey,
      },
    }),
  );

  return generatePublicUrl(bucket, key);
}

async function main() {
  console.log('☁️  Upload Quick Filter Assets to Object Storage');
  console.log('================================================\n');

  if (SKIP_EXISTING) {
    console.log('⏭️  SKIP_EXISTING mode: Will skip images that already exist in storage\n');
  }

  const assetsDir = path.join(__dirname, 'assets');
  const quickFiltersDir = path.join(assetsDir, 'quick-filters');

  // Check directory exists
  if (
    !(await fs
      .access(quickFiltersDir)
      .then(() => true)
      .catch(() => false))
  ) {
    console.error('❌ Quick filters directory not found at:', quickFiltersDir);
    process.exit(1);
  }

  // Initialize S3 client
  const s3Client = createS3Client();
  const bucket = process.env.HETZNER_STORAGE_DEFAULT_BUCKET;
  if (!bucket) {
    throw new Error('HETZNER_STORAGE_DEFAULT_BUCKET is not configured');
  }

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Track uploaded URLs for config update
  const uploadedUrls: Record<string, Record<string, string>> = {};

  console.log('📦 Uploading quick filter images...\n');

  // Get unique image files to upload (avoid duplicates for events/show-me-more which share culture images)
  const uniqueFiles = new Map<string, { categorySlug: string; filterKey: string }>();

  for (const [categorySlug, filters] of Object.entries(QUICK_FILTER_ASSETS)) {
    for (const [filterKey, asset] of Object.entries(filters)) {
      const fileName = asset.imageFileName;
      if (!uniqueFiles.has(fileName)) {
        uniqueFiles.set(fileName, { categorySlug, filterKey });
      }
    }
  }

  // Upload unique files
  for (const [fileName, { categorySlug, filterKey }] of uniqueFiles) {
    const filePath = path.join(quickFiltersDir, fileName);

    // Check if file exists
    if (
      !(await fs
        .access(filePath)
        .then(() => true)
        .catch(() => false))
    ) {
      console.log(`⚠️  File not found: ${fileName}`);
      continue;
    }

    try {
      const key = `quick-filters/${categorySlug}/${filterKey}.webp`;

      // Skip if already exists
      if (SKIP_EXISTING && (await objectExists(s3Client, bucket, key))) {
        console.log(`⏭️  Skipping ${categorySlug}/${filterKey} (already exists)`);
        const url = generatePublicUrl(bucket, key);
        if (!uploadedUrls[categorySlug]) uploadedUrls[categorySlug] = {};
        uploadedUrls[categorySlug][filterKey] = url;
        skippedCount++;
        continue;
      }

      console.log(`📤 Uploading ${categorySlug}/${filterKey}...`);
      const imageUrl = await uploadQuickFilterImage(
        s3Client,
        bucket,
        categorySlug,
        filterKey,
        filePath,
      );

      if (!uploadedUrls[categorySlug]) uploadedUrls[categorySlug] = {};
      uploadedUrls[categorySlug][filterKey] = imageUrl;

      console.log(`  ✓ Uploaded: ${imageUrl}`);
      uploadedCount++;
    } catch (error) {
      console.error(
        `  ❌ Failed to upload ${categorySlug}/${filterKey}:`,
        error instanceof Error ? error.message : error,
      );
      errorCount++;
    }
  }

  // Now map the shared images (events and show-me-more use culture images)
  for (const [categorySlug, filters] of Object.entries(QUICK_FILTER_ASSETS)) {
    if (!uploadedUrls[categorySlug]) uploadedUrls[categorySlug] = {};

    for (const [filterKey, asset] of Object.entries(filters)) {
      if (uploadedUrls[categorySlug][filterKey]) continue;

      // Find the URL from the source category
      const fileName = asset.imageFileName;
      for (const [srcCategory, srcFilters] of Object.entries(uploadedUrls)) {
        for (const [srcFilter, srcUrl] of Object.entries(srcFilters)) {
          const srcFileName = QUICK_FILTER_ASSETS[srcCategory]?.[srcFilter]?.imageFileName;
          if (srcFileName === fileName) {
            uploadedUrls[categorySlug][filterKey] = srcUrl;
            break;
          }
        }
      }
    }
  }

  // Summary
  console.log('\n\n📊 Upload Summary');
  console.log('================');
  console.log(`✓ Uploaded: ${uploadedCount}`);
  console.log(`⏭️  Skipped: ${skippedCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  // Output URLs for config update
  console.log('\n\n📝 Update QUICK_FILTER_IMAGES in category-quick-filters.config.ts:');
  console.log('====================================================================\n');
  console.log('const QUICK_FILTER_IMAGES: Record<string, Record<string, string>> = {');

  for (const [categorySlug, filters] of Object.entries(uploadedUrls)) {
    console.log(`  '${categorySlug}': {`);
    for (const [filterKey, url] of Object.entries(filters)) {
      console.log(`    '${filterKey}': '${url}',`);
    }
    console.log('  },');
  }

  console.log('};');

  console.log('\n✅ Upload complete!');
  console.log('\n💡 Copy the above QUICK_FILTER_IMAGES object to update your config.');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
