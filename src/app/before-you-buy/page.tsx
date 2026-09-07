import type { Metadata } from "next";
import { getOutfits, getClosetItems, getActiveCategories } from "@/lib/data";
import { computeUtilityInsights } from "@/lib/insights";
import BeforeYouBuyClient from "@/components/before-you-buy/BeforeYouBuyClient";
import { getDemoSummaries } from "@/lib/advisor/demos";
import type { ItemLite } from "@/components/before-you-buy/Advisor";

export const metadata: Metadata = {
  title: "Before You Buy",
  description:
    "A second opinion on a purchase, grounded in the closet and the looks it has already made.",
  alternates: { canonical: "/before-you-buy" },
};

export default function BeforeYouBuyPage() {
  const outfits = getOutfits();
  const items = getClosetItems();
  const utility = computeUtilityInsights(outfits, items, { topN: 4 });
  const itemMap: Record<string, ItemLite> = {};
  for (const it of items) itemMap[it.id] = { name: it.name, brand: it.brand, category: it.category, image: it.images?.[0] };
  return (
    <BeforeYouBuyClient
      demos={getDemoSummaries()}
      itemMap={itemMap}
      totalItems={items.length}
      totalLooks={outfits.length}
      categories={getActiveCategories().length}
      wornOnce={utility.wornOnce}
      workhorses={utility.workhorses.map((w) => ({
        id: w.item.id,
        name: w.item.name,
        category: w.item.category,
        image: w.item.images?.[0],
        looks: w.looks,
      }))}
    />
  );
}
