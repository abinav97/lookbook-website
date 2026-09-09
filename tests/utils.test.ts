import { describe, it, expect } from "vitest";
import { formatSeasonYear, slugify, cn } from "@/lib/utils";
import { outfitSrcSet, outfitThumb, PORTRAIT_SRCSET } from "@/lib/images";

describe("formatSeasonYear", () => {
  it("renders editorial season + year", () => {
    expect(formatSeasonYear("fall", "2021-10-15")).toBe("Fall 2021");
    expect(formatSeasonYear("winter", "2024-12-14")).toBe("Winter 2024");
  });
});

describe("slugify", () => {
  it("lowercases, strips punctuation, hyphenates", () => {
    expect(slugify("Sunset Rooftop!")).toBe("sunset-rooftop");
    expect(slugify("  Denim_on  Denim ")).toBe("denim-on-denim");
  });
});

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, undefined, "b", null)).toBe("a b");
  });
});

describe("image helpers", () => {
  it("derives the responsive srcSet from the canonical jpg path", () => {
    expect(outfitSrcSet("/outfits/lisbon-layers.jpg")).toBe(
      "/outfits/lisbon-layers-480.webp 480w, /outfits/lisbon-layers-960.webp 960w, /outfits/lisbon-layers-1600.webp 1600w"
    );
    expect(outfitThumb("/outfits/lisbon-layers.jpg")).toBe("/outfits/lisbon-layers-480.webp");
    expect(PORTRAIT_SRCSET).toContain("/portrait/abi-portrait-640.webp 640w");
  });
});
