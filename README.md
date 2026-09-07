# Abi's Lookbook

A living fashion portfolio at [abislookbook.com](https://abislookbook.com): 21 documented looks
(Fall 2021 to Fall 2025), the 65 closet pieces behind them, and the cross-references between
the two. Every outfit is tagged to real items; every item links back to the looks it appears in.

The site is also a product case study. See [docs/product-story.md](docs/product-story.md) for
the problem, decisions, and evaluation approach.

## Stack

- Next.js 15 (App Router, static export), React 19, TypeScript strict
- Tailwind CSS v4 (`@theme inline` in `src/app/globals.css`), Motion for animation
- Data lives in JSON under `src/data/` and is typed by `src/lib/types.ts`
- Vercel hosting with Web Analytics

## Develop

```bash
npm install
npm run dev          # generates responsive images, then starts Next on :3000
```

Photos are kept at full resolution in `assets/` and converted to web-ready WebP/JPEG
variants under `public/outfits` and `public/portrait` by `scripts/optimize-images.mjs`.
That step runs automatically before `dev` and `build`; run `npm run images -- --force`
to regenerate everything.

## Check

```bash
npm run check        # lint, type-check, unit tests, production build, export checks
```

- `npm test` runs the Vitest suite in `tests/` (data integrity, helpers)
- `npm run test:e2e` runs the Playwright smoke suite at desktop and mobile widths against
  the dev server, using the Chrome already installed on the machine
- `npm run check:export` scans `out/` for broken internal links and reports per-page
  weight, failing if any page's initial load exceeds 1.5 MB

## Add a look

1. Drop the photo in `assets/outfits/<slug>.jpg` (phone originals are fine; EXIF orientation is handled).
2. Add the outfit to `src/data/outfits.json` and any new pieces to `src/data/closet-items.json`.
   Tags reference closet item ids and hold a position in percent.
3. Optionally run the local tagging tool: `ENABLE_ADMIN=true npm run dev` and open `/admin`.
   It is never included in production builds.
4. `npm run check`, then commit.

Product images for closet items come from `npm run generate-images` (see
`scripts/generate-images.mjs`; needs `OPENAI_API_KEY` in `.env.local`) or from
`scripts/process-photos.mjs` for your own photos placed in `raw-photos/`.

## Layout

```
src/app/            routes and metadata (sitemap.ts, robots.ts included)
src/components/     feature-scoped components; "use client" only where interactive
src/lib/            data access, types, image + motion + analytics helpers
src/data/           outfits.json, closet-items.json
assets/             source photography (tracked)
public/items/       generated product images (tracked)
public/outfits/     generated from assets/ at build time (ignored)
scripts/            image pipeline and export checks
tests/              Vitest
docs/               product story and decision log
```
