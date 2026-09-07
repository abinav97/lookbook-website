#!/usr/bin/env node
/**
 * Fill src/data/advisor-demos.json with real results so the demo chips on
 * /before-you-buy answer instantly and cost nothing per visitor.
 * Three model calls (about $0.15 worst case). Needs a running site with the key.
 *
 *   BASE_URL=http://localhost:3000 node scripts/precompute-demos.mjs
 */
import fs from "fs";
import path from "path";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const file = path.join(ROOT, "src/data/advisor-demos.json");
const demos = JSON.parse(fs.readFileSync(file, "utf8"));
for (const d of demos) {
  const body = { description: d.description };
  if (d.imagePath) {
    const p = path.join(ROOT, "public", d.imagePath);
    const ext = path.extname(p).slice(1).toLowerCase();
    body.image = { mediaType: ext === "jpg" ? "image/jpeg" : `image/${ext}`, data: fs.readFileSync(p).toString("base64") };
  }
  const res = await fetch(`${BASE}/api/advise`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const json = await res.json();
  if (!res.ok || !json.advice) { console.error(`${d.id}: ${res.status} ${json.error ?? ""}`); continue; }
  d.result = json;
  console.log(`${d.id}: ${json.advice.verdict} (${json.meta.latencyMs}ms, $${json.meta.estimatedCostUsd})`);
}
fs.writeFileSync(file, JSON.stringify(demos, null, 2) + "\n");
console.log("written", path.relative(ROOT, file));
