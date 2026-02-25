#!/usr/bin/env node
/**
 * Batch background removal script
 * Processes ALL product images through @imgly/background-removal-node
 * then re-composites onto uniform #f0f0f0 gray background
 */

import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ITEMS_DIR = path.resolve('public/items');
const BG_COLOR = { r: 240, g: 240, b: 240, alpha: 1 };
const FLATTEN_BG = { r: 240, g: 240, b: 240 };

async function processImage(filePath) {
  const filename = path.basename(filePath);
  const tempPath = filePath.replace('.webp', '-temp.webp');

  try {
    // Read existing image
    const inputBuf = fs.readFileSync(filePath);

    // Remove background
    const blob = new Blob([inputBuf], { type: 'image/webp' });
    const result = await removeBackground(blob);
    const arrayBuf = await result.arrayBuffer();
    const pngBuf = Buffer.from(arrayBuf);

    // Resize and flatten onto uniform gray background
    await sharp(pngBuf)
      .resize(800, 800, { fit: 'contain', background: BG_COLOR })
      .flatten({ background: FLATTEN_BG })
      .webp({ quality: 80 })
      .toFile(tempPath);

    // Replace original
    fs.renameSync(tempPath, filePath);

    const stats = fs.statSync(filePath);
    return { success: true, size: stats.size };
  } catch (err) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    return { success: false, error: err.message };
  }
}

async function main() {
  const files = fs.readdirSync(ITEMS_DIR)
    .filter(f => f.endsWith('.webp'))
    .map(f => path.join(ITEMS_DIR, f));

  console.log(`\nFound ${files.length} images to process\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = path.basename(file);
    const progress = `[${i + 1}/${files.length}]`;

    process.stdout.write(`${progress} Processing ${filename}...`);

    const result = await processImage(file);

    if (result.success) {
      console.log(` ✓ (${(result.size / 1024).toFixed(0)}KB)`);
      successCount++;
    } else {
      console.log(` ✗ ${result.error}`);
      failCount++;
    }
  }

  console.log(`\nDone! ${successCount} succeeded, ${failCount} failed`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
