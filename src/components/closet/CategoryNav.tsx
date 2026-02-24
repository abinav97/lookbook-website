"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClosetCategory, CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  categories: ClosetCategory[];
  counts: Record<string, number>;
}

export default function CategoryNav({ categories, counts }: CategoryNavProps) {
  const pathname = usePathname();
  const isAll = pathname === "/closet";

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block w-48 flex-shrink-0 sticky top-28 self-start">
        <div className="flex flex-col gap-0.5">
          <Link
            href="/closet"
            className={cn(
              "text-[11px] tracking-[0.15em] py-2 transition-colors duration-300",
              isAll
                ? "text-text font-medium"
                : "text-text-muted hover:text-text"
            )}
          >
            ALL PIECES
            <span className="ml-2 text-text-muted/60">{Object.values(counts).reduce((a, b) => a + b, 0)}</span>
          </Link>

          <div className="h-px bg-border my-2" />

          {categories.map((cat) => {
            const isActive = pathname === `/closet/${cat}`;
            return (
              <Link
                key={cat}
                href={`/closet/${cat}`}
                className={cn(
                  "text-[11px] tracking-[0.15em] py-1.5 transition-colors duration-300 flex justify-between",
                  isActive
                    ? "text-text font-medium"
                    : "text-text-muted hover:text-text"
                )}
              >
                <span>{CATEGORY_LABELS[cat].toUpperCase()}</span>
                <span className="text-text-muted/50">{counts[cat] || 0}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile horizontal pills */}
      <div className="lg:hidden scroll-x flex gap-2 mb-8 -mx-[var(--page-margin)] px-[var(--page-margin)]">
        <Link
          href="/closet"
          className={cn(
            "flex-shrink-0 px-4 py-2 text-[10px] tracking-[0.12em] border transition-colors duration-300",
            isAll
              ? "bg-text text-bg border-text"
              : "border-border text-text-muted hover:border-text hover:text-text"
          )}
        >
          ALL
        </Link>
        {categories.map((cat) => {
          const isActive = pathname === `/closet/${cat}`;
          return (
            <Link
              key={cat}
              href={`/closet/${cat}`}
              className={cn(
                "flex-shrink-0 px-4 py-2 text-[10px] tracking-[0.12em] border transition-colors duration-300 whitespace-nowrap",
                isActive
                  ? "bg-text text-bg border-text"
                  : "border-border text-text-muted hover:border-text hover:text-text"
              )}
            >
              {CATEGORY_LABELS[cat].toUpperCase()}
            </Link>
          );
        })}
      </div>
    </>
  );
}
