import {
  getClosetItemsByCategory,
  getActiveCategories,
  getClosetItemsGroupedByCategory,
} from "@/lib/data";
import { ClosetCategory, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/types";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ClosetCategoryClient from "@/components/closet/ClosetCategoryClient";

type Props = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  const categories = getActiveCategories();
  return categories.map((cat) => ({ category: cat }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const label = CATEGORY_LABELS[category as ClosetCategory];
  if (!label) return { title: "Not Found" };
  return {
    title: `${label} — Abi's Closet`,
    description: `Browse ${label.toLowerCase()} in Abi's wardrobe.`,
  };
}

export default async function ClosetCategoryPage({ params }: Props) {
  const { category: categoryParam } = await params;
  const category = categoryParam as ClosetCategory;
  if (!CATEGORY_ORDER.includes(category)) notFound();

  const items = getClosetItemsByCategory(category);
  if (items.length === 0) notFound();

  const categories = getActiveCategories();
  const grouped = getClosetItemsGroupedByCategory();
  const counts: Record<string, number> = {};
  for (const [cat, catItems] of Object.entries(grouped)) {
    counts[cat] = catItems.length;
  }

  return (
    <ClosetCategoryClient
      category={category}
      items={items}
      categories={categories}
      counts={counts}
    />
  );
}
