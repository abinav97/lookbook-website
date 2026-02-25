#!/usr/bin/env node
/**
 * Process user photos: background removal → resize 800x800 → uniform #f0f0f0 gray → WebP
 */

import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const RAW_DIR = path.resolve('public/items/raw');
const ITEMS_DIR = path.resolve('public/items');
const DATA_PATH = path.resolve('src/data/closet-items.json');
const BG = { r: 240, g: 240, b: 240, alpha: 1 };
const FLATTEN_BG = { r: 240, g: 240, b: 240 };

// Map raw filenames to item names in closet-items.json
const FILE_TO_ITEM = {
  'sage-scarf.jpg': 'Sage Embroidered Scarf',
  'head-scarf.jpg': 'Floral Head Scarf',
  'brown-blazer.jpg': 'Brown Leather Blazer',
  'braves-cap.jpg': 'Atlanta Braves Baseball Cap',
  'graphic-tee.jpg': 'White Graphic Tee',
  'allsaints.jpg': 'Pastel Tie-Dye Camp Collar Shirt',
  'tassel-loafers.jpg': 'Navy Tassel Loafers',
};

async function processPhoto(rawPath, itemId) {
  const filename = path.basename(rawPath);

  // Read raw photo
  const inputBuf = fs.readFileSync(rawPath);
  console.log(`  Read ${(inputBuf.length / 1024 / 1024).toFixed(1)}MB`);

  // Run background removal on full-res for best quality
  console.log(`  Removing background...`);
  const blob = new Blob([inputBuf], { type: 'image/jpeg' });
  const result = await removeBackground(blob);
  const arrayBuf = await result.arrayBuffer();
  const pngBuf = Buffer.from(arrayBuf);
  console.log(`  BG removed (${(pngBuf.length / 1024).toFixed(0)}KB transparent PNG)`);

  // Resize and flatten onto uniform gray
  const outPath = path.join(ITEMS_DIR, `${itemId}.webp`);
  await sharp(pngBuf)
    .resize(800, 800, { fit: 'contain', background: BG })
    .flatten({ background: FLATTEN_BG })
    .webp({ quality: 80 })
    .toFile(outPath);

  const stats = fs.statSync(outPath);
  console.log(`  Saved ${outPath} (${(stats.size / 1024).toFixed(0)}KB)`);
}

async function main() {
  const items = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));

  console.log(`\nProcessing ${rawFiles.length} photos\n`);

  let successCount = 0;

  for (let i = 0; i < rawFiles.length; i++) {
    const filename = rawFiles[i];
    const itemName = FILE_TO_ITEM[filename];

    if (!itemName) {
      console.log(`[${i + 1}/${rawFiles.length}] ${filename} — no mapping, skipping\n`);
      continue;
    }

    const dataItem = items.find(item => item.name === itemName);
    if (!dataItem) {
      console.log(`[${i + 1}/${rawFiles.length}] ${filename} → "${itemName}" — NOT FOUND in data\n`);
      continue;
    }

    console.log(`[${i + 1}/${rawFiles.length}] ${filename} → ${itemName} (${dataItem.id})`);

    try {
      await processPhoto(path.join(RAW_DIR, filename), dataItem.id);
      dataItem.images = [`/items/${dataItem.id}.webp`];
      successCount++;
      console.log(`  ✓ Done\n`);
    } catch (err) {
      console.log(`  ✗ Failed: ${err.message}\n`);
    }
  }

  // Save updated JSON
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2) + '\n');
  console.log(`Done! ${successCount}/${rawFiles.length} processed. closet-items.json updated.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
