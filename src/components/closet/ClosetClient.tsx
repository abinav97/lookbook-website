"use client";

import { ClosetCategory, ClosetItem, CATEGORY_LABELS } from "@/lib/types";
import CategoryNav from "./CategoryNav";
import ClosetItemCard from "./ClosetItemCard";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";

interface ClosetClientProps {
  grouped: Record<string, ClosetItem[]>;
  categories: ClosetCategory[];
  counts: Record<string, number>;
  totalCount: number;
}

export default function ClosetClient({
  grouped,
  categories,
  counts,
  totalCount,
}: ClosetClientProps) {
  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      {/* Page header */}
      <ScrollFadeIn>
        <div className="mb-12 max-w-xl">
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.02em]">
            Abi&apos;s Closet
          </h1>
          <p className="text-text-muted text-sm mt-4 leading-relaxed">
            {totalCount} pieces, tagged across every look. Sorted by type,
            cross-referenced by outfit.
          </p>
        </div>
      </ScrollFadeIn>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-16">
        <CategoryNav categories={categories} counts={counts} />

        <div className="flex-1 min-w-0">
          {Object.entries(grouped).map(([category, items]) => (
            <section key={category} id={category} className="mb-16">
              <ScrollFadeIn>
                <div className="section-divider">
                  <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                    {CATEGORY_LABELS[category as ClosetCategory]?.toUpperCase() ||
                      category.toUpperCase()}
                  </span>
                </div>
              </ScrollFadeIn>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 mt-6">
                {items.map((item, i) => (
                  <ClosetItemCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
