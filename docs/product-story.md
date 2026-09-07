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
| Testing | None | Vitest data-integrity suite; export checker for broken links and page weight |
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

- 2026-09-07: Keep static export through the foundation phase; move to Vercel's Next.js
  runtime only when a server route is needed to hold the model API key.
- 2026-09-07: Photos stay tracked at full resolution in `assets/`; derivatives are
  generated at build time rather than committed, so the repo does not grow with each
  format change.
- 2026-09-07: Scroll-reveal animation is disabled on first paint by design. A visible
  page beats a flourish for anyone on a slow connection or a crawler.
- 2026-09-07: TagIndicator (photo hotspots) kept in the codebase although unused; it is
  the next editorial feature to wire up.

## 6. Signature feature design

To be written in the next phase.

## 7. Evaluation and measurement

To be written with the feature. Foundation-phase measurements:

| Metric | Before | After |
|---|---|---|
| Lookbook page weight, full scroll | ~61 MB | ~3.9 MB (retina), ~1.4 MB initial |
| Static export size | 138 MB | 28 MB |
| Broken internal links in export | not measured | 0 of 38 pages |
| Unit tests | 0 | 15 |
| Publicly exposed admin | yes | no |

## 8. Limitations and next steps

- Git history still contains the original photos and raw sources; the clone is ~120 MB.
  A history rewrite would fix it but is destructive and was deliberately not done.
- Dependency audit reports issues in the build-time image tooling (sharp/libvips chain);
  nothing affected ships to the browser. Fixing requires a major sharp bump.
- Next: wire the photo hotspots, add a wardrobe-utility view to Style DNA, reframe About
  as the product story, then build the purchase assistant behind a server route.
