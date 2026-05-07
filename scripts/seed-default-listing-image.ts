#!/usr/bin/env ts-node
/**
 * Seed Default Listing Image to Object Storage
 *
 * This script uploads the default listing placeholder image to Hetzner Object Storage.
 * This is a one-time deployment seed for the default listing fallback image.
 *
 * Prerequisites:
 *   Set storage environment variables (HETZNER_STORAGE_*)
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register scripts/seed-default-listing-image.ts
 *
 * Behavior:
 *   - Idempotent: safe to run multiple times (overwrites existing file in bucket)
 *   - No database changes: pure asset deployment
 */

import 'tsconfig-paths/register';

import * as fs from 'fs/promises';
import * as path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

async function main() {
  console.log('☁️  Seed Default Listing Image to Object Storage');
  console.log('=============================================\n');

  const assetsDir = path.join(__dirname, 'assets', 'defaults');
  const imagePath = path.join(assetsDir, 'listing-placeholder.webp');

  // Check file exists
  const fileExists = await fs
    .access(imagePath)
    .then(() => true)
    .catch(() => false);

  if (!fileExists) {
    console.error(
      '❌ Listing placeholder image not found at scripts/assets/defaults/listing-placeholder.webp',
    );
    process.exit(1);
  }

  // Initialize S3 client
  const s3Client = createS3Client();
  const bucket = process.env.HETZNER_STORAGE_DEFAULT_BUCKET;
  if (!bucket) {
    throw new Error('HETZNER_STORAGE_DEFAULT_BUCKET is not configured');
  }

  try {
    console.log('📤 Uploading listing placeholder image...\n');

    const fileBuffer = await fs.readFile(imagePath);
    const key = 'defaults/listing-placeholder.webp';

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: 'image/webp',
        ACL: 'public-read',
        Metadata: {
          originalName: 'listing-placeholder.webp',
          purpose: 'default-listing-fallback',
        },
      }),
    );

    const publicUrl = generatePublicUrl(bucket, key);
    console.log(`✓ Uploaded: ${publicUrl}`);

    console.log('\n✅ Seed complete!');
  } catch (error) {
    console.error(
      '❌ Failed to upload:',
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
