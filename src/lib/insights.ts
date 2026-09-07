import type { ClosetItem, Outfit, ClosetCategory } from "./types";

/**
 * Wardrobe-utility insights derived from the outfit/item graph. Pure
 * functions over the data so they can be unit-tested and reused by the
 * Style DNA page, the About story, and (later) the purchase assistant's
 * grounding context.
 */

export interface ItemUsage {
  item: ClosetItem;
  looks: number;
  /** ISO dates of the looks it appears in, ascending */
  dates: string[];
}

export interface UtilityInsights {
  totalItems: number;
  totalLooks: number;
  /** items by number of looks they appear in, e.g. { 1: 49, 2: 8 } */
  distribution: Record<number, number>;
  wornOnce: number;
  wornOnceShare: number; // 0..1
  multiLook: number;
  avgItemsPerLook: number;
  /** most re-used items, descending by look count then name */
  workhorses: ItemUsage[];
  /** share of a category's items that appear in more than one look */
  categoryReuse: { category: ClosetCategory; items: number; reused: number; share: number }[];
  /** items whose looks span the widest range of years */
  longestServing: ItemUsage[];
}

export function computeItemUsage(outfits: Outfit[], items: ClosetItem[]): ItemUsage[] {
  const byId = new Map<string, ItemUsage>(
    items.map((item) => [item.id, { item, looks: 0, dates: [] }])
  );
  for (const outfit of outfits) {
    const seen = new Set<string>();
    for (const image of outfit.images) {
      for (const tag of image.tags) {
        if (seen.has(tag.closetItemId)) continue;
        seen.add(tag.closetItemId);
        const usage = byId.get(tag.closetItemId);
        if (!usage) continue;
        usage.looks += 1;
        usage.dates.push(outfit.date);
      }
    }
  }
  for (const u of byId.values()) u.dates.sort();
  return [...byId.values()];
}

export function computeUtilityInsights(
  outfits: Outfit[],
  items: ClosetItem[],
  { topN = 6 }: { topN?: number } = {}
): UtilityInsights {
  const usage = computeItemUsage(outfits, items);

  const distribution: Record<number, number> = {};
  for (const u of usage) distribution[u.looks] = (distribution[u.looks] ?? 0) + 1;

  const wornOnce = usage.filter((u) => u.looks === 1).length;
  const multiLook = usage.filter((u) => u.looks > 1).length;

  const tagsPerLook = outfits.map(
    (o) => new Set(o.images.flatMap((i) => i.tags.map((t) => t.closetItemId))).size
  );
  const avgItemsPerLook =
    outfits.length === 0 ? 0 : tagsPerLook.reduce((a, b) => a + b, 0) / outfits.length;

  const byLooks = (a: ItemUsage, b: ItemUsage) =>
    b.looks - a.looks || a.item.name.localeCompare(b.item.name);
  const workhorses = [...usage].filter((u) => u.looks > 1).sort(byLooks).slice(0, topN);

  const catMap = new Map<ClosetCategory, { items: number; reused: number }>();
  for (const u of usage) {
    const c = catMap.get(u.item.category) ?? { items: 0, reused: 0 };
    c.items += 1;
    if (u.looks > 1) c.reused += 1;
    catMap.set(u.item.category, c);
  }
  const categoryReuse = [...catMap.entries()]
    .map(([category, c]) => ({ category, ...c, share: c.items ? c.reused / c.items : 0 }))
    .sort((a, b) => b.share - a.share || b.items - a.items);

  const span = (u: ItemUsage) =>
    u.dates.length < 2 ? 0 : yearOf(u.dates[u.dates.length - 1]) - yearOf(u.dates[0]);
  const longestServing = [...usage]
    .filter((u) => span(u) > 0)
    .sort((a, b) => span(b) - span(a) || byLooks(a, b))
    .slice(0, 3);

  return {
    totalItems: items.length,
    totalLooks: outfits.length,
    distribution,
    wornOnce,
    wornOnceShare: items.length ? wornOnce / items.length : 0,
    multiLook,
    avgItemsPerLook,
    workhorses,
    categoryReuse,
    longestServing,
  };
}

export function yearOf(isoDate: string): number {
  return Number(isoDate.slice(0, 4));
}

/** Years an item has been in service, e.g. "2021–2025" or "2023". */
export function serviceYears(dates: string[]): string {
  if (dates.length === 0) return "";
  const first = yearOf(dates[0]);
  const last = yearOf(dates[dates.length - 1]);
  return first === last ? `${first}` : `${first}–${last}`;
}
