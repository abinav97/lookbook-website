import outfitsData from "@/data/outfits.json";
import closetItemsData from "@/data/closet-items.json";
import {
  Outfit,
  ClosetItem,
  ClosetCategory,
  CATEGORY_ORDER,
  OutfitRef,
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

export function toOutfitRef(outfit: Outfit): OutfitRef {
  const img = outfit.images[0];
  return {
    id: outfit.id,
    slug: outfit.slug,
    title: outfit.title,
    season: outfit.season,
    date: outfit.date,
    image: img ? { src: img.src, alt: img.alt } : undefined,
    colorPalette: outfit.colorPalette,
  };
}

export function getOutfitRefsForItem(itemId: string): OutfitRef[] {
  return getOutfitsForItem(itemId).map(toOutfitRef);
}

export function getOutfitsForItem(itemId: string): Outfit[] {
  return getOutfits().filter((outfit) =>
    outfit.images.some((image) =>
      image.tags.some((tag) => tag.closetItemId === itemId)
    )
  );
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
