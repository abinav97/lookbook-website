/**
 * Helpers for the responsive image variants produced by
 * scripts/optimize-images.mjs. The JSON data keeps the canonical
 * `/outfits/<slug>.jpg` path; these helpers derive the srcSet from it.
 */

const OUTFIT_WIDTHS = [480, 960, 1600] as const;
const PORTRAIT_WIDTHS = [640, 1280] as const;

function toSrcSet(src: string, widths: readonly number[]): string {
  const base = src.replace(/\.(jpe?g|png|webp)$/i, "");
  return widths.map((w) => `${base}-${w}.webp ${w}w`).join(", ");
}

/** srcSet for an outfit photo path such as `/outfits/lisbon-layers.jpg`. */
export function outfitSrcSet(src: string): string {
  return toSrcSet(src, OUTFIT_WIDTHS);
}

/** A single small variant, for thumbnails. */
export function outfitThumb(src: string): string {
  return `${src.replace(/\.(jpe?g|png|webp)$/i, "")}-480.webp`;
}

export const PORTRAIT_SRC = "/portrait/abi-portrait.jpg";
export const PORTRAIT_SRCSET = toSrcSet(PORTRAIT_SRC, PORTRAIT_WIDTHS);

/** `sizes` presets matching the site's layouts (page margin is 8vw each side). */
export const SIZES = {
  hero: "100vw",
  grid3: "(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 84vw",
  featuredLarge: "(min-width: 768px) 49vw, 84vw",
  featuredSmall: "(min-width: 768px) 35vw, 84vw",
  detailHero: "(min-width: 896px) 896px, 100vw",
  detailGallery: "(min-width: 768px) 40vw, 84vw",
  portrait: "(min-width: 768px) 672px, 84vw",
} as const;
