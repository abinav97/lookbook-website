#!/usr/bin/env node

/**
 * generate-images.mjs
 *
 * Fetches real product images from URLs or generates via DALL-E 3 as fallback.
 * Images are saved to public/items/ and closet-items.json is updated.
 *
 * Usage:
 *   npm run generate-images                        # Process all missing
 *   npm run generate-images -- --dry-run            # Preview sources only
 *   npm run generate-images -- --id=item-xxx        # Process one item
 *   npm run generate-images -- --category=shoes     # One category only
 *   npm run generate-images -- --force              # Reprocess ALL
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
import OpenAI from "openai";
import sharp from "sharp";

// ─── Config ────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

config({ path: path.join(ROOT, ".env.local") });

const ITEMS_JSON = path.join(ROOT, "src/data/closet-items.json");
const OUTPUT_DIR = path.join(ROOT, "public/items");
const IMAGE_SIZE = "1024x1024";
const OUTPUT_WIDTH = 800;
const WEBP_QUALITY = 80;
const MAX_CONCURRENT = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

// ─── CLI Flags ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");
const ONLY_ID = getArg("--id");
const ONLY_CATEGORY = getArg("--category");

function getArg(flag) {
  const arg = args.find((a) => a.startsWith(`${flag}=`));
  return arg ? arg.split("=")[1] : null;
}

// ─── OpenAI Client (deferred) ──────────────────────────────────────

let openai = null;
function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "Error: OPENAI_API_KEY not found. Create .env.local with:\n  OPENAI_API_KEY=sk-..."
      );
      process.exit(1);
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ─── URL Image Fetching ────────────────────────────────────────────

/**
 * Try to fetch the product image from a purchase URL.
 * Extracts og:image meta tag from the page HTML.
 * Returns the image buffer or null if it fails.
 */
async function fetchProductImage(purchaseUrl) {
  try {
    // Fetch the product page
    const response = await fetch(purchaseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      log.warn(`    Page returned ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Try og:image first (most reliable for e-commerce)
    let imageUrl = extractMeta(html, 'property="og:image"') ||
                   extractMeta(html, "property='og:image'") ||
                   extractMeta(html, 'name="og:image"');

    // Fallback: twitter:image
    if (!imageUrl) {
      imageUrl = extractMeta(html, 'name="twitter:image"') ||
                 extractMeta(html, 'property="twitter:image"');
    }

    if (!imageUrl) {
      log.warn(`    No og:image found on page`);
      return null;
    }

    // Handle relative URLs
    if (imageUrl.startsWith("//")) {
      imageUrl = "https:" + imageUrl;
    } else if (imageUrl.startsWith("/")) {
      const urlObj = new URL(purchaseUrl);
      imageUrl = urlObj.origin + imageUrl;
    }

    log.dim(`    Found image: ${imageUrl.slice(0, 80)}...`);

    // Download the image
    const imgResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!imgResponse.ok) {
      log.warn(`    Image download failed: ${imgResponse.status}`);
      return null;
    }

    const buffer = Buffer.from(await imgResponse.arrayBuffer());

    // Validate it's actually an image
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || metadata.width < 100) {
      log.warn(`    Image too small (${metadata.width}px)`);
      return null;
    }

    return buffer;
  } catch (error) {
    log.warn(`    URL fetch failed: ${error.message}`);
    return null;
  }
}

/** Extract content from a meta tag */
function extractMeta(html, attrMatch) {
  // Match both content="..." orders
  const patterns = [
    new RegExp(`<meta[^>]+${attrMatch}[^>]+content="([^"]+)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]+)"[^>]+${attrMatch}`, "i"),
    new RegExp(`<meta[^>]+${attrMatch}[^>]+content='([^']+)'`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── DALL-E Prompt Templates ───────────────────────────────────────

const BASE_SUFFIX =
  "Professional e-commerce product photograph, isolated on clean light gray (#F0F0F0) background, studio lighting, soft even shadows, no model, no mannequin, no text, no logos, no branding visible, no price tags, high quality commercial photography";

const CATEGORY_PROMPTS = {
  jackets:
    "A {color} {name} laid flat with arms slightly spread, photographed from above at a slight angle, showing full garment shape and texture",
  blazers:
    "A {color} {name} shown on an invisible mannequin form (ghost mannequin style), front view, button detail visible, lapels crisp",
  tops: "A {color} {name} neatly folded or laid flat, photographed from above, showing the front design and fabric texture",
  shirts:
    "A {color} {name} laid flat with collar visible, slightly unbuttoned at top, sleeves arranged neatly",
  pants:
    "A pair of {color} {name} folded neatly showing the full length from waist to hem, photographed from above",
  skirts:
    "A {color} {name} shown flat or slightly draped, photographed from above showing full silhouette",
  dresses:
    "A {color} {name} shown on an invisible mannequin (ghost mannequin style), front view, full length visible",
  shoes:
    "A pair of {color} {name} shown in 3/4 profile view at a slight angle, one shoe slightly in front of the other",
  hats: "A {color} {name} shown from a 3/4 front angle, slightly tilted to show the shape and crown",
  bags: "A {color} {name} shown upright from a 3/4 front angle, handles visible, slightly angled to show depth",
  accessories:
    "A {color} {name} arranged artfully, shown in close-up detail",
  jewelry:
    "A {color} {name} photographed in close-up macro style with shallow depth of field, showing fine detail and material luster",
  other: "A {color} {name} shown clearly from an appealing angle",
};

const PROMPT_OVERRIDES = {
  "item-1771887596161-2":
    "Black leather motorcycle pants with bold orange flame graphic design running along both legs, laid flat, photographed from above",
  "item-1771888369546-1":
    "A cream-colored puffer jacket with an all-over computer keyboard key print pattern, zip front, shown on invisible mannequin from front view",
  "item-1771889104255-0":
    "An embroidered cream sherwani (Indian formal long coat) with intricate gold and cream threadwork on the front panel, shown on invisible mannequin, front view",
  "item-1771889104255-1":
    "A pair of burgundy churidar pants (traditional Indian fitted trousers with gathered fabric at the ankles), neatly arranged flat",
  "item-1771889104255-2":
    "A pair of burgundy mojari shoes (traditional Indian pointed-toe slip-on shoes with curved tips), shown in 3/4 profile",
  "item-shared-sacai-blazer-low":
    "A pair of white and gray low-top sneakers with a deconstructed layered sole design and double laces, shown in 3/4 profile view",
  "item-1771888795068-0":
    "A pastel peach and blue tie-dye camp collar shirt with relaxed fit, laid flat showing the open collar and full pattern",
  "item-1771887908949-1":
    "A polo shirt with pastel color block panels in peach, blue, cream and yellow, laid flat showing the collar and button placket",
  "item-1771888932436-1":
    "A cream polo shirt with contrasting green collar and green sleeve trim, laid flat showing the collar detail",
  "item-1771890586081-6":
    "A pair of gold monogram letter cufflinks with engraved initials, photographed in close-up macro style showing the polished gold surface and detail",
  "item-1771864195524-1":
    "A navy blue motorsport racing team jacket with subtle design elements, zip front, shown on invisible mannequin from front view",
  "item-1771864195524-0":
    "A black athletic dri-fit baseball cap with a curved brim, shown from a 3/4 front angle",
  "item-1771864777486-0":
    "A cream and light blue baseball cap with a red embroidered letter on the front, shown from 3/4 front angle",
  "item-1771890871135-0":
    "A black sports team baseball cap, classic style, shown from 3/4 front angle",
  "item-shared-orange-lens-sunglasses":
    "A pair of black frame sunglasses with bright orange tinted lenses, shown from the front at a slight angle",
};

// ─── Prompt Builder ────────────────────────────────────────────────

function buildPrompt(item, includeBrand = true) {
  if (PROMPT_OVERRIDES[item.id]) {
    return `${PROMPT_OVERRIDES[item.id]}. ${BASE_SUFFIX}`;
  }

  const template = CATEGORY_PROMPTS[item.category] || CATEGORY_PROMPTS.other;
  const nameContainsColor =
    item.color && item.name.toLowerCase().includes(item.color.toLowerCase());
  const colorPrefix = nameContainsColor ? "" : (item.color || "") + " ";

  let prompt = template
    .replace("{color} ", colorPrefix)
    .replace("{name}", item.name);

  if (includeBrand && item.brand) {
    prompt += `. The item is in a ${item.brand}-inspired style`;
  }

  prompt += ". " + BASE_SUFFIX;
  return prompt;
}

// ─── DALL-E Generation ─────────────────────────────────────────────

async function generateWithDalle(prompt, item) {
  const client = getOpenAI();
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: IMAGE_SIZE,
        quality: "standard",
        response_format: "url",
      });

      const imageUrl = response.data[0].url;
      const revisedPrompt = response.data[0].revised_prompt;
      if (revisedPrompt) {
        log.dim(`    Revised: ${revisedPrompt.slice(0, 90)}...`);
      }

      // Download and return as buffer
      const imgResponse = await fetch(imageUrl);
      return Buffer.from(await imgResponse.arrayBuffer());
    } catch (error) {
      const isContentPolicy =
        error?.error?.code === "content_policy_violation" ||
        error?.message?.includes("content_policy");

      if (isContentPolicy && attempt === 1) {
        log.warn(`    Content policy issue, retrying without brand...`);
        const noBrandPrompt = buildPrompt({ ...item, brand: undefined }, false);
        return generateWithDalle(noBrandPrompt, item);
      }

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        log.warn(`    Attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}

// ─── Image Processing ──────────────────────────────────────────────

async function processAndSave(buffer, itemId) {
  const outputPath = path.join(OUTPUT_DIR, `${itemId}.webp`);

  await sharp(buffer)
    .resize(OUTPUT_WIDTH, OUTPUT_WIDTH, { fit: "cover", position: "center" })
    .webp({ quality: WEBP_QUALITY })
    .toFile(outputPath);

  const stats = fs.statSync(outputPath);
  return { path: `/items/${itemId}.webp`, sizeKB: (stats.size / 1024).toFixed(1) };
}

// ─── Unified Item Processor ────────────────────────────────────────

/**
 * Download a direct image URL. Much more reliable than page scraping.
 * User adds "imageUrl" field to closet-items.json with the direct image link
 * (right-click product image → Copy Image Address).
 */
async function fetchDirectImage(imageUrl) {
  try {
    const response = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      log.warn(`    Direct image download failed: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    // Validate it's an actual image
    const metadata = await sharp(buffer).metadata();
    if (!metadata.width || metadata.width < 50) {
      log.warn(`    Image too small or invalid`);
      return null;
    }

    log.dim(`    Downloaded: ${metadata.width}x${metadata.height} ${metadata.format}`);
    return buffer;
  } catch (error) {
    log.warn(`    Direct image fetch failed: ${error.message}`);
    return null;
  }
}

async function processItem(item) {
  let buffer = null;
  let source = "";

  // Strategy 1: Direct image URL (most reliable)
  if (item.imageUrl) {
    log.info(`    Fetching image: ${item.imageUrl.slice(0, 70)}...`);
    buffer = await fetchDirectImage(item.imageUrl);
    if (buffer) source = "url";
  }

  // Strategy 2: Try og:image from purchase page URL
  if (!buffer && item.purchaseUrl) {
    log.info(`    Trying page: ${item.purchaseUrl.slice(0, 60)}...`);
    buffer = await fetchProductImage(item.purchaseUrl);
    if (buffer) source = "url";
  }

  // Strategy 3: Fall back to DALL-E
  if (!buffer) {
    if (item.imageUrl || item.purchaseUrl) {
      log.warn(`    URLs failed, falling back to DALL-E...`);
    }
    const prompt = buildPrompt(item);
    log.dim(`    DALL-E prompt: ${prompt.slice(0, 90)}...`);
    buffer = await generateWithDalle(prompt, item);
    source = "dalle";
  }

  const result = await processAndSave(buffer, item.id);
  return { ...result, source };
}

// ─── Concurrency Control ───────────────────────────────────────────

async function processBatch(items, concurrency, fn) {
  const results = [];
  const failures = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const item = items[i];
      try {
        const result = await fn(item, i);
        results.push(result);
      } catch (error) {
        log.error(`  Failed: ${item.name} — ${error.message}`);
        failures.push({ item, error: error.message });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return { results, failures };
}

// ─── Logging ───────────────────────────────────────────────────────

const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warn: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.error(`\x1b[31m${msg}\x1b[0m`),
  dim: (msg) => console.log(`\x1b[2m${msg}\x1b[0m`),
  bold: (msg) => console.log(`\x1b[1m${msg}\x1b[0m`),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  log.bold("\n  Closet Item Image Generator\n");

  // 1. Read items
  const items = JSON.parse(fs.readFileSync(ITEMS_JSON, "utf-8"));
  log.info(`  Loaded ${items.length} items from closet-items.json`);

  // 2. Ensure output dir
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 3. Filter
  let toProcess = items.filter((item) => {
    if (ONLY_ID) return item.id === ONLY_ID;
    if (ONLY_CATEGORY) return item.category === ONLY_CATEGORY;
    if (FORCE) return true;
    const filePath = path.join(OUTPUT_DIR, `${item.id}.webp`);
    return !fs.existsSync(filePath) || !(item.images && item.images.length > 0);
  });

  const withDirectImg = toProcess.filter((i) => i.imageUrl).length;
  const withPageUrl = toProcess.filter((i) => !i.imageUrl && i.purchaseUrl).length;
  const withoutAny = toProcess.length - withDirectImg - withPageUrl;

  log.info(`  ${toProcess.length} items to process (${items.length - toProcess.length} already done)`);
  if (withDirectImg > 0) log.info(`    ${withDirectImg} with direct image URL`);
  if (withPageUrl > 0) log.info(`    ${withPageUrl} with purchase page URL (will try og:image)`);
  if (withoutAny > 0) log.info(`    ${withoutAny} without URL (will use DALL-E ~$${(withoutAny * 0.04).toFixed(2)})`);
  console.log();

  if (toProcess.length === 0) {
    log.success("  All items already have images. Use --force to reprocess.");
    return;
  }

  // 4. Dry run
  if (DRY_RUN) {
    log.bold("  DRY RUN — previewing sources:\n");
    toProcess.forEach((item, i) => {
      const source = item.imageUrl
        ? `Image URL: ${item.imageUrl.slice(0, 60)}`
        : item.purchaseUrl
          ? `Page URL: ${item.purchaseUrl.slice(0, 60)}`
          : `DALL-E`;
      console.log(`  ${i + 1}. ${item.name} (${item.category})`);
      log.dim(`     Source: ${source}`);
      if (!item.imageUrl && !item.purchaseUrl) {
        log.dim(`     Prompt: ${buildPrompt(item).slice(0, 100)}...`);
      }
      console.log();
    });
    log.info(`\n  Estimated cost: ~$${(withoutAny * 0.04).toFixed(2)} (${withDirectImg + withPageUrl} from URL, ${withoutAny} from DALL-E)\n`);
    return;
  }

  // 5. Process
  const startTime = Date.now();
  let completed = 0;
  let fromUrl = 0;
  let fromDalle = 0;

  const { results, failures } = await processBatch(
    toProcess,
    MAX_CONCURRENT,
    async (item) => {
      log.info(`  [${completed + 1}/${toProcess.length}] ${item.name}`);

      const result = await processItem(item);

      completed++;
      if (result.source === "url") fromUrl++;
      else fromDalle++;

      const sourceLabel = result.source === "url" ? "URL" : "DALL-E";
      log.success(`  [${completed}/${toProcess.length}] Saved (${sourceLabel}): ${result.path} (${result.sizeKB} KB)`);

      return { itemId: item.id, path: result.path };
    }
  );

  // 6. Update JSON
  const updatedItems = items.map((item) => {
    const result = results.find((r) => r.itemId === item.id);
    if (result) {
      return { ...item, images: [result.path] };
    }
    if (!item.images) {
      return { ...item, images: [] };
    }
    return item;
  });

  fs.writeFileSync(ITEMS_JSON, JSON.stringify(updatedItems, null, 2) + "\n");

  // 7. Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log();
  log.bold("  Summary");
  log.success(`  Processed: ${results.length} images`);
  if (fromUrl > 0) log.info(`    From URLs: ${fromUrl}`);
  if (fromDalle > 0) log.info(`    From DALL-E: ${fromDalle}`);
  if (failures.length > 0) {
    log.error(`  Failed: ${failures.length} items`);
    failures.forEach((f) => log.error(`    - ${f.item.name}: ${f.error}`));
  }
  log.info(`  Time: ${elapsed}s`);
  log.info(`  Est. cost: ~$${(fromDalle * 0.04).toFixed(2)}`);
  console.log();
}

main().catch((err) => {
  log.error(`\n  Fatal error: ${err.message}`);
  process.exit(1);
});
