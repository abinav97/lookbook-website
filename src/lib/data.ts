import outfitsData from "@/data/outfits.json";
import closetItemsData from "@/data/closet-items.json";
import collectionsData from "@/data/collections.json";
import {
  Outfit,
  ClosetItem,
  Collection,
  ClosetCategory,
  CATEGORY_ORDER,
} from "./types";

export function getOutfits(): Outfit[] {
  return outfitsData as Outfit[];
}

export function getOutfitBySlug(slug: string): Outfit | undefined {
  return getOutfits().find((o) => o.slug === slug);
}

export function getFeaturedOutfits(): Outfit[] {
  return getOutfits().filter((o) => o.featured);
}

export function getOutfitsBySeason(
  season: Outfit["season"]
): Outfit[] {
  return getOutfits().filter((o) => o.season === season);
}

export function getClosetItems(): ClosetItem[] {
  return closetItemsData as ClosetItem[];
}

export function getClosetItemById(id: string): ClosetItem | undefined {
  return getClosetItems().find((item) => item.id === id);
}

export function getClosetItemsByCategory(
  category: ClosetCategory
): ClosetItem[] {
  return getClosetItems().filter((item) => item.category === category);
}

export function getClosetItemsGroupedByCategory(): Record<
  ClosetCategory,
  ClosetItem[]
> {
  const items = getClosetItems();
  const grouped = {} as Record<ClosetCategory, ClosetItem[]>;

  for (const cat of CATEGORY_ORDER) {
    const catItems = items.filter((item) => item.category === cat);
    if (catItems.length > 0) {
      grouped[cat] = catItems;
    }
  }

  return grouped;
}

export function getItemOutfitCount(itemId: string): number {
  const outfits = getOutfits();
  let count = 0;
  for (const outfit of outfits) {
    for (const image of outfit.images) {
      if (image.tags.some((tag) => tag.closetItemId === itemId)) {
        count++;
        break;
      }
    }
  }
  return count;
}

export function getOutfitsForItem(itemId: string): Outfit[] {
  return getOutfits().filter((outfit) =>
    outfit.images.some((image) =>
      image.tags.some((tag) => tag.closetItemId === itemId)
    )
  );
}

export function getCollections(): Collection[] {
  return collectionsData as Collection[];
}

export function getCollectionBySlug(slug: string): Collection | undefined {
  return getCollections().find((c) => c.slug === slug);
}

export function getActiveCategories(): ClosetCategory[] {
  const items = getClosetItems();
  const activeSet = new Set(items.map((item) => item.category));
  return CATEGORY_ORDER.filter((cat) => activeSet.has(cat));
}

export function getAllColorPalettes(): string[] {
  const outfits = getOutfits();
  const colors: string[] = [];
  for (const outfit of outfits) {
    if (outfit.colorPalette) {
      colors.push(...outfit.colorPalette.map((c) => c.toUpperCase()));
    }
  }
  return colors;
}

export function getCategoryStats(): { category: ClosetCategory; count: number }[] {
  const grouped = getClosetItemsGroupedByCategory();
  return Object.entries(grouped).map(([category, items]) => ({
    category: category as ClosetCategory,
    count: items.length,
  }));
}
