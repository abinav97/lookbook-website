# Abi's Lookbook: product story

Working document. It grows with each phase and becomes the portfolio case study.

## 1. The problem

Most people who care about clothes still buy badly. Purchases are driven by novelty and
the moment, not by what the item will do inside the wardrobe they already own. The
evidence is in this closet's own data: of 65 documented pieces, 49 appear in exactly one
of 21 looks across four years, while a single pair of light-wash jeans appears in seven.

The lookbook began as a personal style archive. The product thesis is that the archive is
also the ground truth a purchase decision needs, and that a model reasoning over it can
answer "should I buy this?" in a way generic advice cannot.

## 2. Users and jobs

- **Abi** (primary): before buying, know whether an item duplicates something owned,
  what it pairs with, and what it unlocks.
- **Visitors** (friends, fashion contacts, hiring managers): browse the looks, and see a
  thoughtful, working example of AI applied to a real wardrobe rather than a chatbot.

## 3. Audit findings (September 2026)

Full audit before any change. The deployed site matched the repository exactly.

| Area | Finding | Resolution |
|---|---|---|
| Performance | Lookbook grid served 21 original phone JPEGs, ~61 MB per visit, no lazy loading, no dimensions | Build-time pipeline: 480/960/1600 WebP + JPEG fallback, srcset/sizes, lazy loading, width/height. Initial load now ~1.4 MB, full scroll ~3.9 MB at retina |
| Security | `/admin` shipped publicly; stored an API key in localStorage and called the model from the browser | Route renders 404 unless `ENABLE_ADMIN=true` at build time |
| Privacy | 10 unprocessed source photos (~60 MB) publicly served from `/items/raw` | Moved out of `public/` |
| Robustness | Entrance animations serialized `opacity:0` into server HTML; content invisible until JS ran | First paint renders at rest; animations run on later navigations and respect reduced motion |
| Accessibility | Clickable divs, no pressed/expanded states, no skip link, no focus styles | Real buttons with ARIA state, skip link, focus-visible, live region for results |
| SEO | No sitemap, robots, canonical, or OG image | All added; each look uses its own photo as og:image |
| Measurement | Analytics never merged; zero recorded visits | Vercel Web Analytics plus a two-event custom vocabulary |
| Testing | None | Vitest suite (43 today: data integrity, helpers, insights, advisor grounding and caps, scorer), Playwright smoke suite at desktop and mobile (26), export checker for broken links and page weight |
| Dead weight | Unused component, unused collections data, unused helpers, unused dependency, template assets, five one-off scripts | Deleted after verifying zero references |
| Design | Home hero was a flat gradient | Featured look's photograph |

## 4. Alternatives considered for the AI feature

- **Explainable Style DNA** (evidence-linked profile of taste). Credible, cheap, static.
  Deferred: it explains data rather than helping a decision. Natural second phase.
- **Closet-constrained outfit builder.** Strong demo, but on a 65-item closet it competes
  with the lookbook instead of extending it. Not pursued.
- **Natural-language closet search.** Filtering already solves this at this scale. Rejected.
- **Cost-per-wear.** Requires price and wear data that do not exist. Rejected.

Chosen: **"Should I buy this?"**, a purchase-decision assistant grounded in the actual
closet and documented looks. Details in section 6 once designed.

## 5. Decision log

- 2026-09-07 (Phase 2): The tag positions in the data were unusable (every marker at
  x≈50). Rather than drop hotspots, all 96 positions were re-placed against a grid overlay
  of each photo. The hotspot layer is keyboard-reachable and clamps its card inside the
  photo on phones.
- 2026-09-07 (Phase 2): Wardrobe utility is computed by pure functions in
  `src/lib/insights.ts` and unit-tested against the real data. The same functions will
  feed the assistant's grounding context, so the numbers on the site and in the prompt
  cannot drift apart.
- 2026-09-07 (Phase 2): The assistant gets a first-class route and nav entry
  (`/before-you-buy`) before it exists, with an honest "in development" state rather than
  a fake demo. The entry point is quiet on the home page: one hairline block.
- 2026-09-07 (Phase 2): `sharp` moved to runtime dependencies so a production install
  that omits dev packages still runs the image step on Vercel.

- 2026-09-07: Keep static export through the foundation phase; move to Vercel's Next.js
  runtime only when a server route is needed to hold the model API key.
- 2026-09-07: Photos stay tracked at full resolution in `assets/`; derivatives are
  generated at build time rather than committed, so the repo does not grow with each
  format change.
- 2026-09-07: Scroll-reveal animation is disabled on first paint by design. A visible
  page beats a flourish for anyone on a slow connection or a crawler.
- 2026-09-07: TagIndicator (photo hotspots) kept in the codebase although unused; it is
  the next editorial feature to wire up.

## 6. Signature feature design: Before You Buy

**Job.** Before spending money on a piece, know whether it duplicates something owned,
what it pairs with, and what it would unlock, judged against this closet and how it has
actually been worn.

**Journey.** `/before-you-buy` -> show the piece (photo, description, or one of three
examples) -> a verdict with receipts -> follow a cited piece into the closet, or ask about
another. One screen, no account, no history.

**Architecture (the smallest that gives a credible result).**

- One Next.js route handler, `POST /api/advise`, Node runtime, 60 s budget. Pages stay
  statically prerendered; this is the only server code, and the only reason static export
  was dropped.
- Claude Opus 5 with adaptive thinking at medium effort and a Zod-typed structured output.
  Server-side refusal fallback is enabled so a classifier decline is retried on
  Anthropic's recommended model rather than surfacing as an error.
- The whole closet, every documented look, and the wardrobe-utility numbers are rendered
  deterministically into the system prompt (about 6.5k tokens) and cached. No vector
  store: 65 items fit in context, and the model needs all of them to reason about
  duplication and pairing.
- A deterministic grounding pass runs on every answer: any cited item id that does not
  exist is removed and counted, confidence is lowered when references were dropped, and an
  answer with no surviving evidence becomes an `unclear` verdict with a caveat. The UI
  shows how many references were removed.
- Photos are resized to 1024 px on the device (which also strips EXIF), sent once, and not
  stored by the site. Server logs carry token counts and latency only, never the
  description or the image.

**Output contract.** verdict (buy / maybe / pass / unclear), a twelve-word headline,
two-to-three-sentence reasoning, what the candidate was read as, duplicates already
owned, pieces it pairs with, up to three looks it would unlock (built from owned ids),
the gap it fills, confidence, and caveats about what a photo cannot tell.

**States.** Idle, thinking (with the honest "ten to thirty seconds"), verdict, paused
(no key or kill switch), allowance used up (429 with Retry-After), photo too large, not a
photo, declined, no verdict, upstream failure. All share the editorial Notice block.

**Spend control and the math.** Opus 5 pricing: $5 / $25 per million input / output
tokens, cache reads $0.50. Worst case per request: (6,500 + 1,600 + 300) input tokens =
$0.042 plus 2,500 output tokens = $0.0625, about **$0.105**. Typical with a cache hit and
~1,200 output tokens: about $0.045. Defaults: 40 requests per day (at most $4.20/day), 8 per
IP per day (at most $0.84 per visitor), 500 lifetime (at most $52.50) per warm instance.
Counters are in process memory, so on Vercel they are per warm instance: a strong brake
rather than an accounting system. The hard $60 ceiling is the spend limit on the Anthropic
Console workspace that owns the key; `ADVISOR_ENABLED=false` is the kill switch.

**Latency.** Expected 8 to 30 seconds. Non-streaming by design: a structured verdict
that appears whole reads better than JSON fragments, and the loading state says how long
it takes.

## 7. Evaluation and measurement

**Evaluation set** (`eval/candidates.json`, 16 candidates): four near-duplicates of
owned pieces (loafers, jeans, Sambas, chain), five plausible gap-fillers (overcoat,
burgundy knit, oxford, suede chelsea, flannel trousers), three off-wardrobe novelties
(neon shorts, sequin blazer, tie-dye hoodie), a second navy suit, a vague description,
and two non-garment images (the portrait, a rooftop scene).

**Deterministic scoring** (`scripts/lib/score.mjs`, unit-tested): verdict within the
expected set; every cited id exists; expected duplicates found; minimum grounded
pairings; expected pairings present; unlock counts and well-formedness; candidate
null/not-null; caveats present; headline length; reasoning present. `npm run eval` runs
the set against a running site (about $1 per run) and writes the run plus its score to
`eval/runs/`.

**Results (7 September 2026, `claude-opus-5`, adaptive thinking, effort medium,
max 2,500 output tokens, structured output, server-side refusal fallback, client
timeout 50 s with no retry).** Seven full runs over the 16-then-17-case set, archived in
`eval/baselines/` with raw responses, scores, and a note on what changed before each run:

| Run | Fully passing | Checks | Non-200 | p50 / p90 / max (s) | Spend |
|---|---|---|---|---|---|
| 01 baseline | 9 / 16 | 101 / 110 | 0 | 15.4 / 22.5 / 23.2 | $0.48 |
| 02 prompt + scorer; schema length parse-fatal | 13 / 17 | 112 / 116 | 3 (unknown) | 12.7 / 19.4 / 21.1 | $0.36 |
| 03 lengths as guidance, 422 on parse failure, clamps, "you", occasion vocabulary | 17 / 17 | 142 / 142 | 0 | 12.8 / 23.4 / 75.5 | $0.49 |
| 04 no unverified counts or look attributions | 17 / 17 | 143 / 143 | 0 | 13.4 / 20.7 / 22.4 | $0.50 |
| 05 piece names beside ids in the looks list | 16 / 17 | 142 / 143 | 0 | 12.8 / 19.9 / 19.9 | $0.52 |
| 06 ranked utility table; candidate null only when unclear | 11 / 17 | 102 / 108 | 5 (rate_limited) | 16.3 / 21.6 / 22.0 | $0.41 |
| 07 same code as 06, fresh instance | 15 / 17 | 131 / 133 | 1 (upstream) | 14.7 / 21.8 / 25.0 | $0.44 |
| 08 final: same code as 06, fresh instance, local caps raised so no limiter could interfere | 16 / 17 | 142 / 143 | 0 | 14.3 / 20.9 / 21.6 | $0.52 |

**Run 08 is the definitive final baseline.** Grounding was 100% in every run: across 132
verdicts the model never cited an item id that does not exist. Verdict agreement with
the expected set was 100% in every run from 02 onward. Run 08's single miss is a
13-word headline on the light-wash-jeans duplicate ("You already live in the Light Wash
Jeans; this is the same jean"); the verdict, duplicate, and grounding were all correct.
Forcing shorter headlines with truncation would damage the prose, and further prompt
pressure would be tuning to the fixture, so it is recorded as accepted variance.

What the baseline exposed, and what changed (each change was followed by a full rerun):

- Raw item ids leaked into prose in most answers. A prompt rule plus a deterministic
  safety net that substitutes piece names for ids in every prose field. Zero leaks since.
- Six headlines ran 13 to 14 words. Tightening the schema's character cap made three
  answers fail to parse (constrained decoding does not enforce string length), so prose
  limits are now guidance in the prompt, a parse failure maps to the "no verdict" state
  instead of a 500, and array sizes are clamped after the fact.
- The model guessed a pronoun for Abi once and invented an occasion ("training") once.
  The prompt addresses Abi as "you" and restricts occasions to the site vocabulary.
- Demo texts contained a fabricated count ("a fifth pair of shorts") and two wrong
  look attributions. The prompt forbids unverified counts and attributions, and the
  looks list now shows piece names beside ids so the model does not cross-reference.
- Demo texts misranked categories ("tops repeat least" when shirts and jackets are at
  zero). The utility block is now a ranked table with percentages and an explicit
  "lowest re-use" line. The next generation ranked them correctly.
- Two evaluation cases were mis-specified: the "portrait" is a photo of a worn suit
  jacket and the model read it correctly. They were relabelled, and a synthetic
  non-garment image was added; the model returns "unclear" with a null candidate for it.
- One opinionated check (a specific pair of jeans) became a structural one (a top must
  pair with a bottom); the neon-shorts unlock ceiling went from one to two after the
  model argued a functional training use.

Latency: p50 about 13 to 15 s, p90 about 21 to 22 s; 2 of 132 calls exceeded 50 s. Those fail
gracefully inside Vercel's 60 s function budget and refund the allowance. Follow-ups:
enable Fluid compute for a longer budget, or evaluate effort "low".

Cost: about 7,100 to 8,500 cached tokens read per call; uncached input 40 to 60 tokens
for text and about 900 with a photo. Average $0.029 per verdict. Total evaluation and
demo spend for this phase: about $4.06 (evaluation $3.71, demos $0.35).

**Demo examples** (`src/data/advisor-demos.json`, precomputed from real inference):
black loafers again (pass, high), burgundy merino crewneck (buy, medium), neon shorts
(maybe, medium). Every factual claim in the three texts was checked by hand against the
closet and look data. Two phrases were corrected by hand to the exact figures and the
edits are recorded in the fixture's `edits` field: the neon-shorts gap line now gives
pants' exact rank (3 of 12 re-worn, sixth of ten), and the burgundy reasoning names hats
alongside shirts and jackets at zero re-use. A later regeneration of the neon-shorts
text was rejected because it called the charcoal pair "the only shorts in the closet". The UI serves the examples with no inference
and no allowance consumed, and the precomputed path still works when the advisor is
paused.

**Analytics events**: `advisor_submitted` (mode), `advisor_result` (verdict,
confidence, latency, demo), `advisor_error` (kind), `advisor_feedback` (useful, verdict).
Success metrics: submissions per visit to the page, share of verdicts marked useful,
share of `unclear` verdicts on garment inputs (should be low), error rate, p50 latency.

Foundation-phase measurements:

| Metric | Before | After |
|---|---|---|
| Lookbook page weight, full scroll | ~61 MB | ~3.9 MB (retina), ~1.4 MB initial |
| Static export size | 138 MB | 28 MB |
| Broken internal links in export | not measured | 0 of 38 pages |
| Automated tests | 0 | 43 unit + 26 browser smoke |
| Publicly exposed admin | yes | no |

## 8. Limitations and next steps

- Git history still contains the original photos and raw sources; the clone is ~120 MB.
  A history rewrite would fix it but is destructive and was deliberately not done.
  **Safe follow-up plan** (only with explicit approval, after the feature branches are
  merged): (1) confirm no other clones or open PRs; (2) on a fresh clone run
  `git filter-repo --path raw-photos --path public/items/raw --invert-paths` to drop the
  raw sources, and optionally `--path-glob 'public/outfits/*' --invert-paths` for the
  pre-pipeline copies now living in `assets/`; (3) verify the tree still builds; (4)
  force-push `main`, then re-clone locally and reconnect Vercel's Git integration if its
  cached commit is gone; (5) keep the pre-rewrite clone as a backup for a week. Expected
  result: clone size under 30 MB.
- Vercel deployment: `sharp` is now a runtime dependency and the image step runs in
  `prebuild`, so the standard `npm install && npm run build` on Vercel produces the
  images. The first deploy of the branch should still be watched; if the build log shows
  no "Optimized images" line, the `prebuild` hook did not run.
- Dependency audit reports issues in the build-time image tooling (sharp/libvips chain);
  nothing affected ships to the browser. Fixing requires a major sharp bump.
- Done since the audit: photo hotspots, wardrobe-utility view, About rewritten in the site's editorial voice (the case-study detail stays in this document),
  and the purchase assistant behind a single server route with an evaluated prompt.
- Next: enable Fluid compute (or evaluate effort "low") to remove the rare 50 s timeout;
  move request caps to a shared store (Upstash or Vercel KV) if traffic ever justifies it;
  collect the useful yes/no signal and read it against verdict type before touching the
  prompt again; the approval-gated git history cleanup above.
