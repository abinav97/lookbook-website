import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  getOutfits,
  getClosetItems,
  getClosetItemById,
  getFeaturedOutfits,
  getActiveCategories,
  getOutfitRefsForItem,
  getItemOutfitCount,
} from "@/lib/data";
import { CATEGORY_ORDER } from "@/lib/types";
import { OCCASIONS, SEASONS } from "@/lib/constants";

const ROOT = path.resolve(__dirname, "..");
const exists = (p: string) => fs.existsSync(path.join(ROOT, p));

describe("outfit data integrity", () => {
  const outfits = getOutfits();

  it("has unique ids and slugs", () => {
    expect(new Set(outfits.map((o) => o.id)).size).toBe(outfits.length);
    expect(new Set(outfits.map((o) => o.slug)).size).toBe(outfits.length);
  });

  it("uses only known seasons and occasions", () => {
    for (const o of outfits) {
      expect(SEASONS).toContain(o.season);
      for (const occ of o.occasion) expect(OCCASIONS).toContain(occ);
      expect(o.occasion.length).toBeGreaterThan(0);
    }
  });

  it("has an ISO date and a colour palette on every look", () => {
    for (const o of outfits) {
      expect(o.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(o.colorPalette?.length ?? 0).toBeGreaterThanOrEqual(3);
      for (const c of o.colorPalette ?? []) expect(c).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it("every tag points at a real closet item with a valid position", () => {
    for (const o of outfits) {
      for (const img of o.images) {
        for (const tag of img.tags) {
          expect(getClosetItemById(tag.closetItemId), `${o.slug}: ${tag.closetItemId}`).toBeDefined();
          expect(tag.position.x).toBeGreaterThanOrEqual(0);
          expect(tag.position.x).toBeLessThanOrEqual(100);
          expect(tag.position.y).toBeGreaterThanOrEqual(0);
          expect(tag.position.y).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("every photo has a source file in assets/ and positive dimensions", () => {
    for (const o of outfits) {
      for (const img of o.images) {
        expect(img.src.startsWith("/outfits/")).toBe(true);
        expect(exists(path.join("assets", img.src)), `${o.slug}: ${img.src}`).toBe(true);
        expect(img.width).toBeGreaterThan(0);
        expect(img.height).toBeGreaterThan(0);
        expect(img.alt.length).toBeGreaterThan(0);
      }
    }
  });

  it("has at least four featured looks for the home page grid", () => {
    expect(getFeaturedOutfits().length).toBeGreaterThanOrEqual(4);
  });
});

describe("closet data integrity", () => {
  const items = getClosetItems();

  it("has unique ids and valid categories", () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    for (const i of items) expect(CATEGORY_ORDER).toContain(i.category);
  });

  it("every item image file exists under public/items", () => {
    for (const i of items) {
      for (const src of i.images) {
        expect(exists(path.join("public", src)), `${i.id}: ${src}`).toBe(true);
      }
    }
  });

  it("every item appears in at least one look", () => {
    for (const i of items) {
      expect(getItemOutfitCount(i.id), i.id).toBeGreaterThan(0);
    }
  });

  it("active categories are a subset of the ordered category list, in order", () => {
    const active = getActiveCategories();
    const idx = active.map((c) => CATEGORY_ORDER.indexOf(c));
    expect(idx.every((n) => n >= 0)).toBe(true);
    expect([...idx].sort((a, b) => a - b)).toEqual(idx);
  });

  it("outfit refs carry what the closet card needs and nothing heavy", () => {
    const refs = getOutfitRefsForItem("item-shared-light-wash-jeans");
    expect(refs.length).toBeGreaterThan(1);
    for (const r of refs) {
      expect(r).toEqual(
        expect.objectContaining({ slug: expect.any(String), title: expect.any(String), date: expect.any(String) })
      );
      expect(r).not.toHaveProperty("images");
    }
  });
});
