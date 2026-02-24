"use client";

import { ClosetCategory, ClosetItem, CATEGORY_LABELS } from "@/lib/types";
import CategoryNav from "./CategoryNav";
import ClosetItemCard from "./ClosetItemCard";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";

interface ClosetCategoryClientProps {
  category: ClosetCategory;
  items: ClosetItem[];
  categories: ClosetCategory[];
  counts: Record<string, number>;
}

export default function ClosetCategoryClient({
  category,
  items,
  categories,
  counts,
}: ClosetCategoryClientProps) {
  const label = CATEGORY_LABELS[category];

  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      {/* Page header */}
      <ScrollFadeIn>
        <div className="mb-12 max-w-xl">
          <p className="text-[10px] tracking-[0.2em] text-text-muted mb-3">
            ABI&apos;S CLOSET
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.02em]">
            {label}
          </h1>
          <p className="text-text-muted text-sm mt-4 leading-relaxed">
            {items.length} {items.length === 1 ? "piece" : "pieces"} in this category.
          </p>
        </div>
      </ScrollFadeIn>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-16">
        <CategoryNav categories={categories} counts={counts} />

        <div className="flex-1 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {items.map((item, i) => (
              <ClosetItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
