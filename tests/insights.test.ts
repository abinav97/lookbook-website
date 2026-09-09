import { describe, it, expect } from "vitest";
import { computeItemUsage, computeUtilityInsights, serviceYears } from "@/lib/insights";
import { getOutfits, getClosetItems } from "@/lib/data";
import type { Outfit, ClosetItem } from "@/lib/types";

const item = (id: string, category: ClosetItem["category"] = "tops"): ClosetItem => ({
  id, name: id, category, images: [],
});
const look = (id: string, date: string, itemIds: string[]): Outfit => ({
  id, slug: id, title: id, date, season: "fall", occasion: ["casual"],
  images: [{ src: `/outfits/${id}.jpg`, alt: id, width: 3, height: 4,
    tags: itemIds.map((cid, i) => ({ id: `${id}-t${i}`, closetItemId: cid, position: { x: 50, y: 50 } })) }],
});

describe("computeItemUsage", () => {
  it("counts a look once per item even if tagged twice in it", () => {
    const items = [item("a"), item("b")];
    const outfits = [look("l1", "2024-01-01", ["a", "a", "b"]), look("l2", "2022-06-01", ["a"])];
    const usage = computeItemUsage(outfits, items);
    expect(usage.find((u) => u.item.id === "a")).toMatchObject({ looks: 2, dates: ["2022-06-01", "2024-01-01"] });
    expect(usage.find((u) => u.item.id === "b")?.looks).toBe(1);
  });

  it("ignores tags that point at unknown items", () => {
    const usage = computeItemUsage([look("l1", "2024-01-01", ["ghost"])], [item("a")]);
    expect(usage[0].looks).toBe(0);
  });
});

describe("computeUtilityInsights", () => {
  const items = [item("a", "pants"), item("b", "pants"), item("c", "shoes"), item("d", "hats")];
  const outfits = [
    look("l1", "2021-10-01", ["a", "c"]),
    look("l2", "2023-05-01", ["a", "b", "c"]),
    look("l3", "2025-01-01", ["a", "d"]),
  ];
  const ins = computeUtilityInsights(outfits, items, { topN: 2 });

  it("builds the distribution and worn-once share", () => {
    expect(ins.distribution).toEqual({ 3: 1, 2: 1, 1: 2 });
    expect(ins.wornOnce).toBe(2);
    expect(ins.wornOnceShare).toBeCloseTo(0.5);
    expect(ins.multiLook).toBe(2);
    expect(ins.avgItemsPerLook).toBeCloseTo(7 / 3);
  });

  it("ranks workhorses by look count, limited to topN", () => {
    expect(ins.workhorses.map((w) => w.item.id)).toEqual(["a", "c"]);
  });

  it("computes category reuse share, most reused first", () => {
    expect(ins.categoryReuse[0]).toMatchObject({ category: "shoes", items: 1, reused: 1, share: 1 });
    expect(ins.categoryReuse.find((c) => c.category === "pants")).toMatchObject({ items: 2, reused: 1, share: 0.5 });
  });

  it("finds the longest-serving items by year span", () => {
    expect(ins.longestServing[0].item.id).toBe("a");
    expect(serviceYears(ins.longestServing[0].dates)).toBe("2021–2025");
    expect(serviceYears(["2023-01-01"])).toBe("2023");
  });
});

describe("real data sanity", () => {
  it("matches the numbers used in the product story", () => {
    const ins = computeUtilityInsights(getOutfits(), getClosetItems());
    expect(ins.totalItems).toBe(65);
    expect(ins.totalLooks).toBe(21);
    expect(ins.wornOnce).toBe(49);
    expect(ins.workhorses[0].item.name).toBe("Light Wash Jeans");
    expect(ins.workhorses[0].looks).toBe(7);
  });
});
