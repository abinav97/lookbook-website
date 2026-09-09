#!/usr/bin/env node
/**
 * optimize-images.mjs
 *
 * Turns the full-resolution photographs in assets/ into web-ready
 * derivatives under public/. Runs automatically before `next dev` and
 * `next build` (see package.json "predev" / "prebuild").
 *
 *   assets/outfits/<slug>.jpg  ->  public/outfits/<slug>.jpg        (1600px JPEG fallback + OG image)
 *                                  public/outfits/<slug>-480.webp
 *                                  public/outfits/<slug>-960.webp
 *                                  public/outfits/<slug>-1600.webp
 *   assets/abi-portrait.jpg    ->  public/portrait/abi-portrait.jpg (+ 640/1280 webp)
 *
 * EXIF orientation is baked in (phone photos are stored rotated).
 * Outputs are skipped when they are newer than their source, so repeat
 * runs are fast. Use --force to regenerate everything.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORCE = process.argv.includes("--force");

export const OUTFIT_WIDTHS = [480, 960, 1600];
export const PORTRAIT_WIDTHS = [640, 1280];
const WEBP_QUALITY = 78;
const JPEG_QUALITY = 80;

const JOBS = [
  {
    srcDir: path.join(ROOT, "assets/outfits"),
    outDir: path.join(ROOT, "public/outfits"),
    widths: OUTFIT_WIDTHS,
    fallbackWidth: 1600,
  },
  {
    srcDir: path.join(ROOT, "assets"),
    outDir: path.join(ROOT, "public/portrait"),
    widths: PORTRAIT_WIDTHS,
    fallbackWidth: 1280,
    only: ["abi-portrait.jpg"],
  },
];

function isFresh(out, srcStat) {
  if (FORCE) return false;
  try {
    return fs.statSync(out).mtimeMs >= srcStat.mtimeMs;
  } catch {
    return false;
  }
}

async function processFile(srcPath, outDir, widths, fallbackWidth) {
  const base = path.basename(srcPath, path.extname(srcPath));
  const srcStat = fs.statSync(srcPath);
  const targets = [
    ...widths.map((w) => ({ out: path.join(outDir, `${base}-${w}.webp`), w, fmt: "webp" })),
    { out: path.join(outDir, `${base}.jpg`), w: fallbackWidth, fmt: "jpeg" },
  ];
  const todo = targets.filter((t) => !isFresh(t.out, srcStat));
  if (todo.length === 0) return { base, generated: 0 };

  // .rotate() with no args applies EXIF orientation, then strips the tag.
  const pipeline = sharp(srcPath).rotate();
  await Promise.all(
    todo.map(({ out, w, fmt }) => {
      const p = pipeline.clone().resize({ width: w, withoutEnlargement: true });
      return fmt === "webp"
        ? p.webp({ quality: WEBP_QUALITY }).toFile(out)
        : p.jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toFile(out);
    })
  );
  return { base, generated: todo.length };
}

async function main() {
  let total = 0;
  const started = Date.now();
  for (const job of JOBS) {
    if (!fs.existsSync(job.srcDir)) continue;
    fs.mkdirSync(job.outDir, { recursive: true });
    const files = fs
      .readdirSync(job.srcDir)
      .filter((f) => /\.(jpe?g|png)$/i.test(f))
      .filter((f) => !job.only || job.only.includes(f));
    for (const file of files) {
      const { base, generated } = await processFile(
        path.join(job.srcDir, file),
        job.outDir,
        job.widths,
        job.fallbackWidth
      );
      if (generated) {
        total += generated;
        console.log(`  ${base}: ${generated} file(s)`);
      }
    }
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    total ? `Optimized images: ${total} files in ${secs}s` : `Images up to date (${secs}s)`
  );
}

main().catch((err) => {
  console.error("optimize-images failed:", err);
  process.exit(1);
});
