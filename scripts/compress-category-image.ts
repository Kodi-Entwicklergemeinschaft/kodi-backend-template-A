#!/usr/bin/env ts-node
/**
 * Compress Category Image
 *
 * Compresses a PNG/JPEG image to WebP format for use in scripts/assets/categories.
 * Matches the processing used by upload-category-assets.ts (max 1920x1080, quality 85).
 *
 * Usage: npx ts-node -r tsconfig-paths/register scripts/compress-category-image.ts <slug>
 * Example: npx ts-node -r tsconfig-paths/register scripts/compress-category-image.ts kodier-verwaltung
 */

import 'tsconfig-paths/register';

import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';

const slug = process.argv[2] || 'kodier-verwaltung';
const categoriesDir = path.join(__dirname, 'assets', 'categories');

async function compressImage() {
  const inputPath = path.join(categoriesDir, `${slug}.png`);
  const outputPath = path.join(categoriesDir, `${slug}.webp`);

  try {
    await fs.access(inputPath);
  } catch {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  console.log(`📦 Compressing ${slug}.png → ${slug}.webp...`);

  const inputBuffer = await fs.readFile(inputPath);
  const outputBuffer = await sharp(inputBuffer)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  await fs.writeFile(outputPath, outputBuffer);

  const inputStats = await fs.stat(inputPath);
  const outputStats = await fs.stat(outputPath);
  console.log(
    `✓ Compressed: ${(inputStats.size / 1024).toFixed(1)} KB → ${(outputStats.size / 1024).toFixed(1)} KB`,
  );
  console.log(`✓ Saved: ${outputPath}`);
}

compressImage().catch((err) => {
  console.error(err);
  process.exit(1);
});
