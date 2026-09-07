#!/usr/bin/env node
/**
 * Run the evaluation set against a running site and score the results.
 *
 *   BASE_URL=http://localhost:3000 node scripts/eval-advisor.mjs          # run + score
 *   node scripts/eval-advisor.mjs --score eval/runs/<file>.json           # re-score a saved run
 *   node scripts/eval-advisor.mjs --only dup-black-loafers                # subset
 *
 * Each live candidate is one model call (worst case ~$0.105, typically ~$0.05).
 * Results are written to eval/runs/<timestamp>.json with a score file beside it.
 */
import fs from "fs";
import path from "path";
import { scoreCandidate, summarize } from "./lib/score.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const args = process.argv.slice(2);
const scoreOnly = args.includes("--score") ? args[args.indexOf("--score") + 1] : null;
const only = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;

const candidates = JSON.parse(fs.readFileSync(path.join(ROOT, "eval/candidates.json"), "utf8"));
const knownIds = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/closet-items.json"), "utf8")).map((i) => i.id));

function loadImage(imagePath) {
  const file = path.join(ROOT, "public", imagePath);
  const ext = path.extname(file).slice(1).toLowerCase();
  return { mediaType: ext === "jpg" ? "image/jpeg" : `image/${ext}`, data: fs.readFileSync(file).toString("base64") };
}

async function run() {
  const outputs = [];
  let usd = 0;
  for (const c of candidates) {
    if (only && c.id !== only) continue;
    const body = {};
    if (c.description) body.description = c.description;
    if (c.imagePath) body.image = loadImage(c.imagePath);
    const started = Date.now();
    const res = await fetch(`${BASE}/api/advise`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({ error: "bad_json" }));
    const ms = Date.now() - started;
    usd += json?.meta?.estimatedCostUsd ?? 0;
    console.log(`${res.status} ${c.id.padEnd(28)} ${String(ms).padStart(6)}ms  ${(json?.advice?.verdict ?? json?.error ?? "").padEnd(8)} $${(json?.meta?.estimatedCostUsd ?? 0).toFixed(3)}`);
    outputs.push({ id: c.id, status: res.status, response: json });
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(ROOT, "eval/runs", `${stamp}.json`);
  fs.writeFileSync(file, JSON.stringify({ base: BASE, ranAt: stamp, estimatedUsd: usd, outputs }, null, 2));
  console.log(`\nSaved ${path.relative(ROOT, file)}  (estimated spend $${usd.toFixed(3)})`);
  return file;
}

function score(file) {
  const run = JSON.parse(fs.readFileSync(file, "utf8"));
  const results = run.outputs.map((o) => scoreCandidate(candidates.find((c) => c.id === o.id), o.response, knownIds));
  const summary = summarize(results);
  fs.writeFileSync(file.replace(/\.json$/, ".score.json"), JSON.stringify({ summary, results }, null, 2));
  console.log("\nScore");
  console.log(`  candidates fully passing: ${summary.candidatesFullyPassing}/${summary.candidates}`);
  console.log(`  checks passed:            ${summary.checksPassed}/${summary.checksTotal}`);
  for (const [name, b] of Object.entries(summary.byCheck)) console.log(`  ${name.padEnd(20)} ${b.pass}/${b.total}`);
  for (const r of results) for (const c of r.checks) if (!c.pass) console.log(`  x ${r.id}: ${c.name} ${c.detail}`);
}

const file = scoreOnly ? path.resolve(scoreOnly) : await run();
score(file);
