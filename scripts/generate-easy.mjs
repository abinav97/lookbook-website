#!/usr/bin/env node
/**
 * Generate DALL-E images for items that are generic/basic enough to look good.
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import OpenAI from 'openai';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import https from 'https';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const ITEMS_DIR = path.resolve('public/items');
const DATA_PATH = path.resolve('src/data/closet-items.json');
const BG = { r: 240, g: 240, b: 240, alpha: 1 };
const FLATTEN_BG = { r: 240, g: 240, b: 240 };

// Items DALL-E can handle well — with custom prompts
const ITEMS_TO_GENERATE = [
  {
    name: 'Taupe Wide-Leg Trousers',
    prompt: 'Professional e-commerce product photograph of taupe wide-leg trousers, neatly folded flat lay on clean light gray background. Studio lighting, no model, no text, no logos, no branding. High-end fashion retailer style.',
  },
  {
    name: 'Charcoal Tailored Shorts',
    prompt: 'Professional e-commerce product photograph of charcoal gray tailored dress shorts, neatly laid flat on clean light gray background. Studio lighting, no model, no text, no logos, no branding. High-end fashion retailer style.',
  },
  {
    name: 'White Dress Shirt',
    prompt: 'Professional e-commerce product photograph of a crisp white dress shirt, neatly folded flat lay on clean light gray background. Classic fit, spread collar, button-front. Studio lighting, no model, no text, no logos, no branding.',
  },
  {
    name: 'White Base Layer Tee',
    prompt: 'Professional e-commerce product photograph of a plain white crew neck t-shirt, neatly laid flat on clean light gray background. Basic cotton tee, no graphics. Studio lighting, no model, no text, no logos, no branding.',
  },
  {
    name: 'White Crew Socks',
    prompt: 'Professional e-commerce product photograph of a pair of plain white crew-length cotton socks, neatly arranged on clean light gray background. Studio lighting, no model, no text, no logos.',
  },
  {
    name: 'Gold Ring',
    prompt: 'Professional e-commerce jewelry photograph of a simple plain gold band ring, macro close-up on clean light gray background. Polished yellow gold, studio lighting with soft reflections. No text, no branding.',
  },
  {
    name: 'Burgundy Churidar Pants',
    prompt: 'Professional e-commerce product photograph of burgundy churidar pants (fitted Indian-style trousers with gathered ankles), neatly laid flat on clean light gray background. Rich burgundy fabric. Studio lighting, no model, no text, no branding.',
  },
  {
    name: 'White Linen Short Sleeve Shirt',
    prompt: 'Professional e-commerce product photograph of a white linen short-sleeve button-up shirt, relaxed summer fit, neatly laid flat on clean light gray background. Studio lighting, no model, no text, no logos, no branding.',
  },
  {
    name: 'Brown Leather Blazer',
    prompt: 'Professional e-commerce product photograph of a brown leather blazer jacket, rich chocolate brown, on ghost mannequin on clean light gray background. Studio lighting, no model visible, no text, no logos, no branding.',
  },
  {
    name: 'Navy Tassel Loafers',
    prompt: 'Professional e-commerce product photograph of navy blue leather tassel loafers, 3/4 angle view showing both shoes on clean light gray background. Classic men\'s dress shoe style. Studio lighting, no text, no branding.',
  },
  {
    name: 'Burgundy Mojari Shoes',
    prompt: 'Professional e-commerce product photograph of burgundy mojari shoes (traditional Indian pointed-toe jutti slippers), 3/4 angle view showing both shoes on clean light gray background. Rich burgundy with subtle embroidery. Studio lighting, no text, no branding.',
  },
];

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

async function generateImage(item) {
  // Call DALL-E 3
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: item.prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
  });

  const imageUrl = response.data[0].url;
  const revisedPrompt = response.data[0].revised_prompt;
  console.log(`  Revised prompt: ${revisedPrompt.substring(0, 100)}...`);

  // Download the generated image
  const rawBuf = await download(imageUrl);

  // Process with sharp
  const processed = await sharp(rawBuf)
    .resize(800, 800, { fit: 'contain', background: BG })
    .flatten({ background: FLATTEN_BG })
    .webp({ quality: 80 })
    .toBuffer();

  return processed;
}

async function main() {
  // Load items data
  const items = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

  console.log(`\nGenerating ${ITEMS_TO_GENERATE.length} images with DALL-E 3\n`);

  let successCount = 0;

  for (let i = 0; i < ITEMS_TO_GENERATE.length; i++) {
    const genItem = ITEMS_TO_GENERATE[i];
    const progress = `[${i + 1}/${ITEMS_TO_GENERATE.length}]`;

    // Find matching item in data
    const dataItem = items.find(item => item.name === genItem.name);
    if (!dataItem) {
      console.log(`${progress} ${genItem.name} — NOT FOUND in data, skipping`);
      continue;
    }

    const outPath = path.join(ITEMS_DIR, `${dataItem.id}.webp`);

    // Skip if already has an image
    if (dataItem.images && dataItem.images.length > 0 && fs.existsSync(path.join('public', dataItem.images[0]))) {
      console.log(`${progress} ${genItem.name} — already has image, skipping`);
      continue;
    }

    console.log(`${progress} ${genItem.name}`);

    try {
      const imgBuf = await generateImage(genItem);
      fs.writeFileSync(outPath, imgBuf);
      const stats = fs.statSync(outPath);
      console.log(`  ✓ Saved (${(stats.size / 1024).toFixed(0)}KB)\n`);

      // Update the item in data
      dataItem.images = [`/items/${dataItem.id}.webp`];
      successCount++;

      // Small delay to respect rate limits
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.log(`  ✗ Failed: ${err.message}\n`);

      // If content policy rejection, retry without specific details
      if (err.message.includes('content_policy')) {
        console.log(`  Retrying with generic prompt...`);
        try {
          genItem.prompt = genItem.prompt.replace(/brand|logo|specific/gi, '').replace(/\([^)]*\)/g, '');
          const imgBuf = await generateImage(genItem);
          fs.writeFileSync(outPath, imgBuf);
          console.log(`  ✓ Retry succeeded\n`);
          dataItem.images = [`/items/${dataItem.id}.webp`];
          successCount++;
        } catch (retryErr) {
          console.log(`  ✗ Retry also failed: ${retryErr.message}\n`);
        }
      }
    }
  }

  // Write updated data
  fs.writeFileSync(DATA_PATH, JSON.stringify(items, null, 2) + '\n');
  console.log(`\nDone! ${successCount}/${ITEMS_TO_GENERATE.length} generated. closet-items.json updated.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
