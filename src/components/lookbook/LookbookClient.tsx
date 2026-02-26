"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Outfit } from "@/lib/types";
import OutfitCard from "./OutfitCard";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";

type SeasonFilter = "all" | "spring" | "summer" | "fall" | "winter";

const SEASONS: { value: SeasonFilter; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "spring", label: "SPRING" },
  { value: "summer", label: "SUMMER" },
  { value: "fall", label: "FALL" },
  { value: "winter", label: "WINTER" },
];

const OCCASIONS = ["all", "casual", "work", "dinner", "evening", "weekend", "brunch", "date", "travel"];

interface LookbookClientProps {
  outfits: Outfit[];
}

export default function LookbookClient({ outfits }: LookbookClientProps) {
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>("all");
  const [occasionFilter, setOccasionFilter] = useState("all");

  const filtered = useMemo(() => {
    return outfits.filter((outfit) => {
      if (seasonFilter !== "all" && outfit.season !== seasonFilter) return false;
      if (
        occasionFilter !== "all" &&
        !outfit.occasion.includes(occasionFilter)
      )
        return false;
      return true;
    });
  }, [outfits, seasonFilter, occasionFilter]);

  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      {/* Page header */}
      <ScrollFadeIn>
        <div className="mb-16 max-w-xl">
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.02em]">
            Lookbook
          </h1>
          <p className="text-text-muted text-sm mt-4 leading-relaxed">
            Every outfit, documented. A visual diary of considered dressing.
          </p>
        </div>
      </ScrollFadeIn>

      {/* Filters */}
      <ScrollFadeIn delay={0.1}>
        <div className="flex flex-col sm:flex-row gap-6 mb-12">
          {/* Season filter */}
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-[9px] tracking-[0.15em] text-text-muted shrink-0 pt-1.5 sm:pt-0">
              SEASON
            </span>
            <div className="flex flex-wrap gap-1">
              {SEASONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSeasonFilter(s.value)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.12em] border transition-colors duration-300 ${
                    seasonFilter === s.value
                      ? "bg-text text-bg border-text"
                      : "border-border text-text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion filter */}
          <div className="flex items-start sm:items-center gap-2">
            <span className="text-[9px] tracking-[0.15em] text-text-muted shrink-0 pt-1.5 sm:pt-0">
              OCCASION
            </span>
            <div className="flex flex-wrap gap-1">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasionFilter(o)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.12em] border transition-colors duration-300 ${
                    occasionFilter === o
                      ? "bg-text text-bg border-text"
                      : "border-border text-text-muted hover:border-text hover:text-text"
                  }`}
                >
                  {o.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollFadeIn>

      {/* Results count */}
      <div className="mb-8 text-[10px] tracking-[0.15em] text-text-muted">
        {filtered.length} {filtered.length === 1 ? "LOOK" : "LOOKS"}
      </div>

      {/* Masonry grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${seasonFilter}-${occasionFilter}`}
          className="masonry-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filtered.map((outfit, i) => (
            <OutfitCard key={outfit.id} outfit={outfit} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="font-serif text-2xl font-light text-text-muted">
            No looks match these filters.
          </p>
          <button
            onClick={() => {
              setSeasonFilter("all");
              setOccasionFilter("all");
            }}
            className="mt-4 text-[11px] tracking-[0.15em] text-accent-dark hover:text-text transition-colors"
          >
            CLEAR FILTERS
          </button>
        </div>
      )}
    </div>
  );
}
