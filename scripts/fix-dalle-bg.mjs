#!/usr/bin/env node
/**
 * Fix DALL-E generated images to use uniform #f0f0f0 background.
 * Runs bg removal then re-composites onto exact gray.
 */

import { removeBackground } from '@imgly/background-removal-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const ITEMS_DIR = path.resolve('public/items');
const BG = { r: 240, g: 240, b: 240, alpha: 1 };
const FLATTEN_BG = { r: 240, g: 240, b: 240 };

// DALL-E generated items (excluding ones replaced by user photos)
const DALLE_ITEMS = [
  'item-1771862436917-3.webp',   // Taupe Wide-Leg Trousers
  'item-1771863385130-4.webp',   // Charcoal Tailored Shorts
  'item-1771888456725-1.webp',   // White Dress Shirt
  'item-1771888648991-3.webp',   // White Base Layer Tee
  'item-shared-white-crew-socks.webp', // White Crew Socks
  'item-shared-gold-ring.webp',  // Gold Ring
  'item-1771889104255-1.webp',   // Burgundy Churidar Pants
  'item-1771863385130-2.webp',   // White Linen Short Sleeve Shirt
  'item-1771889104255-2.webp',   // Burgundy Mojari Shoes
  'item-1771889104255-0.webp',   // Cream Sherwani
];

async function processImage(filename) {
  const filePath = path.join(ITEMS_DIR, filename);
  const tempPath = filePath.replace('.webp', '-temp.webp');

  const inputBuf = fs.readFileSync(filePath);
  const blob = new Blob([inputBuf], { type: 'image/webp' });
  const result = await removeBackground(blob);
  const arrayBuf = await result.arrayBuffer();
  const pngBuf = Buffer.from(arrayBuf);

  await sharp(pngBuf)
    .resize(800, 800, { fit: 'contain', background: BG })
    .flatten({ background: FLATTEN_BG })
    .webp({ quality: 80 })
    .toFile(tempPath);

  fs.renameSync(tempPath, filePath);
  const stats = fs.statSync(filePath);
  return stats.size;
}

async function main() {
  console.log(`\nFixing ${DALLE_ITEMS.length} DALL-E images to uniform #f0f0f0\n`);

  for (let i = 0; i < DALLE_ITEMS.length; i++) {
    const filename = DALLE_ITEMS[i];
    process.stdout.write(`[${i + 1}/${DALLE_ITEMS.length}] ${filename}...`);
    try {
      const size = await processImage(filename);
      console.log(` ✓ (${(size / 1024).toFixed(0)}KB)`);
    } catch (err) {
      console.log(` ✗ ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main().catch(console.error);
