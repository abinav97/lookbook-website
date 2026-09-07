import {
  getClosetItemsGroupedByCategory,
  getActiveCategories,
  getClosetItems,
  getOutfitRefsForItem,
} from "@/lib/data";
import type { OutfitRef } from "@/lib/types";
import type { Metadata } from "next";
import ClosetClient from "@/components/closet/ClosetClient";

export const metadata: Metadata = {
  title: "Abi's Closet",
  description:
    "Every piece in the wardrobe, catalogued and categorised. Explore the items behind the looks.",
};

export default function ClosetPage() {
  const grouped = getClosetItemsGroupedByCategory();
  const categories = getActiveCategories();
  const allItems = getClosetItems();

  const counts: Record<string, number> = {};
  for (const [cat, items] of Object.entries(grouped)) {
    counts[cat] = items.length;
  }
  const appearsIn: Record<string, OutfitRef[]> = {};
  for (const item of allItems) {
    appearsIn[item.id] = getOutfitRefsForItem(item.id);
  }

  return (
    <ClosetClient
      grouped={grouped}
      categories={categories}
      counts={counts}
      appearsIn={appearsIn}
      totalCount={allItems.length}
    />
  );
}
