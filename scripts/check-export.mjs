#!/usr/bin/env node
/**
 * check-export.mjs — post-build checks over the static export in out/.
 *
 *  1. Broken links: every internal href/src/srcset in every HTML file must
 *     resolve to a file in out/.
 *  2. Page weight: for each HTML page, sum the bytes a ~1024px-wide viewport
 *     would fetch (HTML + JS chunks + CSS + images, picking the 960w variant
 *     when a srcset is present) and fail if any page exceeds the budget.
 *
 * Usage: node scripts/check-export.mjs [--budget-kb=3000]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const budgetArg = process.argv.find((a) => a.startsWith("--budget-kb="));
const BUDGET_KB = budgetArg ? Number(budgetArg.split("=")[1]) : 1500;

if (!fs.existsSync(OUT)) {
  console.error("out/ not found — run `npm run build` first.");
  process.exit(1);
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (entry.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

function resolveInternal(url) {
  const clean = decodeURIComponent(url.split("#")[0].split("?")[0]);
  if (!clean.startsWith("/")) return null; // external or relative
  const candidates = [
    path.join(OUT, clean),
    path.join(OUT, `${clean}.html`),
    path.join(OUT, clean, "index.html"),
  ];
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? false;
}

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');

let broken = 0;
const report = [];

for (const file of walk(OUT)) {
  const html = fs.readFileSync(file, "utf8");
  const page = "/" + path.relative(OUT, file).replace(/index\.html$/, "").replace(/\.html$/, "");
  const initial = new Set([file]);
  const lazy = new Set();

  // Links (broken-link check) and non-image assets
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const url = decode(m[1]);
    if (!url.startsWith("/")) continue;
    const resolved = resolveInternal(url);
    if (resolved === false) {
      broken++;
      console.log(`BROKEN  ${page}  ->  ${url}`);
    } else if (resolved && /\.(js|css|ico)$/.test(resolved)) {
      initial.add(resolved);
    }
  }

  // Images: one entry per <img>, honouring srcset (960w) and loading="lazy"
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    const tag = m[0];
    const src = decode(tag.match(/\bsrc="([^"]+)"/)?.[1] ?? "");
    const srcset = decode(tag.match(/\bsrcset="([^"]+)"/i)?.[1] ?? "");
    const isLazy = /loading="lazy"/.test(tag);
    let pick = src.startsWith("/") ? resolveInternal(src) : null;
    if (pick === false) {
      broken++;
      console.log(`BROKEN  ${page}  ->  ${src} (img)`);
      pick = null;
    }
    for (const cand of srcset.split(",").filter(Boolean)) {
      const [url, w] = cand.trim().split(/\s+/);
      const resolved = resolveInternal(url);
      if (resolved === false) {
        broken++;
        console.log(`BROKEN  ${page}  ->  ${url} (srcset)`);
      } else if (w === "960w" && resolved) {
        pick = resolved;
      }
    }
    if (pick) (isLazy ? lazy : initial).add(pick);
  }

  const size = (set) => [...set].reduce((n, f) => n + fs.statSync(f).size, 0);
  const initialKb = Math.round(size(initial) / 1024);
  const fullKb = Math.round((size(initial) + size(lazy)) / 1024);
  report.push({ page, kb: initialKb, fullKb });
}

report.sort((a, b) => b.kb - a.kb);
console.log("\nPage weight at ~1024px/2x, heaviest initial load first (initial / full-scroll):");
for (const r of report.slice(0, 8))
  console.log(`  ${String(r.kb).padStart(6)} KB / ${String(r.fullKb).padStart(6)} KB  ${r.page}`);
const over = report.filter((r) => r.kb > BUDGET_KB);

console.log(`\n${report.length} pages checked, ${broken} broken link(s), ${over.length} page(s) over the ${BUDGET_KB} KB initial-load budget`);
if (broken || over.length) process.exit(1);
