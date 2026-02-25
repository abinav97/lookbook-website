#!/usr/bin/env node
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import https from 'https';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DATA_PATH = path.resolve('src/data/closet-items.json');
const BG = { r: 240, g: 240, b: 240, alpha: 1 };

function download(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Generating cream sherwani with DALL-E 3...');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: 'Professional e-commerce product photograph of a plain cream-colored sherwani (traditional Indian men\'s long coat/tunic). Simple, elegant, no embroidery, clean solid cream/off-white fabric. Mandarin collar, button front, knee-length. Displayed on ghost mannequin on clean light gray (#F0F0F0) background. Studio lighting, no model visible, no text, no logos, no branding.',
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0].url;
  console.log('Revised prompt:', response.data[0].revised_prompt.substring(0, 120) + '...');

  const rawBuf = await download(imageUrl);

  // Find item ID
  const items = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  const item = items.find(i => i.name === 'Embroidered Cream Sherwani');
  if (!item) { console.error('Item not found!'); return; }

  const outPath = path.resolve(`public/items/${item.id}.webp`);

  await sharp(rawBuf)
    .resize(800, 800, { fit: 'contain', background: BG })
    .flatten({ background: { r: 240, g: 240, b: 240 } })
    .webp({ quality: 80 })
    .toFile(outPath);

  // Update JSON
  item.images = [`/items/${item.id}.webp`];
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2) + '\n');

  const stats = fs.statSync(outPath);
  console.log(`Done! Saved ${outPath} (${(stats.size / 1024).toFixed(0)}KB)`);
}

main().catch(console.error);
