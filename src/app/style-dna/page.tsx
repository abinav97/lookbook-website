import {
  getAllColorPalettes,
  getCategoryStats,
  getOutfits,
  getClosetItems,
} from "@/lib/data";
import type { Metadata } from "next";
import StyleDNAClient from "@/components/style-dna/StyleDNAClient";

export const metadata: Metadata = {
  title: "Style DNA",
  description:
    "A data-driven look at personal style. Color palettes, wardrobe composition, and style patterns.",
};

export default function StyleDNAPage() {
  const allColors = getAllColorPalettes();
  const categoryStats = getCategoryStats();
  const outfits = getOutfits();
  const closetItems = getClosetItems();

  // Season breakdown
  const seasonCounts = outfits.reduce(
    (acc, o) => {
      acc[o.season] = (acc[o.season] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <StyleDNAClient
      allColors={allColors}
      categoryStats={categoryStats}
      seasonCounts={seasonCounts}
      totalOutfits={outfits.length}
      totalItems={closetItems.length}
    />
  );
}
