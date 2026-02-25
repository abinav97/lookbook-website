#!/usr/bin/env node
/**
 * Fix items damaged by overzealous background removal.
 * Re-downloads from original imageUrl and processes with sharp only (no bg removal).
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const ITEMS_DIR = path.resolve('public/items');
const BG_COLOR = { r: 240, g: 240, b: 240, alpha: 1 };
const FLATTEN_BG = { r: 240, g: 240, b: 240 };

const ITEMS_TO_FIX = [
  {
    id: 'item-1771890586081-2',
    name: 'Red Silk Scarf',
    imageUrl: 'https://annetouraine.com/cdn/shop/products/Floral-red-orange-french-silk-scarves-scarf-twill-paris-custom-designer-square_3_800x.jpg?v=1523446291',
  },
  {
    id: 'item-1771863790940-1',
    name: 'Black Turtleneck',
    imageUrl: 'https://pangaia.com/cdn/shop/files/Mens_Merino_Knit_Turtle_Neck_Black-1.png?crop=center&height=1999&v=1755512218&width=1500',
  },
  {
    id: 'item-1771887596161-2',
    name: 'Black Leather Pants with Orange Flames',
    imageUrl: 'https://u-mercari-images.mercdn.net/photos/m46223088468_1.jpg?width=2560&quality=75&_=1739749772',
  },
  {
    id: 'item-shared-adidas-sambas',
    name: 'Adidas Sambas',
    imageUrl: 'https://www.stadiumgoods.com/cdn/shop/files/ka70r5kp5h62pyxhhjzomhqgq3ag.png?crop=center&height=480&v=1726887541&width=480',
  },
  {
    id: 'item-shared-prada-sunglasses',
    name: 'Prada Sunglasses',
    imageUrl: 'https://assets2.sunglasshut.com/cdn-record-files-pi/a999a47d-4189-41d0-bb4d-ac7c00f1ab63/bdc03154-86b7-4c16-9212-ac7f004f60bc/0PR_17WS__1AB5S0__STD__noshad__qt.png?impolicy=SGH_bgtransparent&width=320',
  },
];

function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

async function processItem(item) {
  const outPath = path.join(ITEMS_DIR, `${item.id}.webp`);

  console.log(`  Downloading from ${new URL(item.imageUrl).hostname}...`);
  const rawBuf = await download(item.imageUrl);
  console.log(`  Downloaded ${(rawBuf.length / 1024).toFixed(0)}KB`);

  // Process with sharp: resize to 800x800, contain within frame, flatten onto #f0f0f0
  await sharp(rawBuf)
    .resize(800, 800, { fit: 'contain', background: BG_COLOR })
    .flatten({ background: FLATTEN_BG })
    .webp({ quality: 80 })
    .toFile(outPath);

  const stats = fs.statSync(outPath);
  console.log(`  Saved ${outPath} (${(stats.size / 1024).toFixed(0)}KB)`);
}

async function main() {
  console.log(`\nFixing ${ITEMS_TO_FIX.length} damaged items (no background removal)\n`);

  for (const item of ITEMS_TO_FIX) {
    console.log(`[${item.name}] (${item.id})`);
    try {
      await processItem(item);
      console.log(`  ✓ Done\n`);
    } catch (err) {
      console.log(`  ✗ Failed: ${err.message}\n`);
    }
  }

  console.log('All done!');
}

main();
