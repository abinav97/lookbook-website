"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Outfit } from "@/lib/types";
import OutfitCard from "./OutfitCard";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";
import { SEASONS, OCCASIONS, type Season } from "@/lib/constants";

type SeasonFilter = "all" | Season;

const SEASON_OPTIONS: { value: SeasonFilter; label: string }[] = [
  { value: "all", label: "ALL" },
  ...SEASONS.map((s) => ({ value: s, label: s.toUpperCase() })),
];

const OCCASION_OPTIONS = ["all", ...OCCASIONS];

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
        <div className="flex flex-col sm:flex-row sm:flex-nowrap sm:items-center gap-6 mb-12">
          {/* Season filter */}
          <div className="flex items-start sm:items-center gap-2" role="group" aria-labelledby="filter-season">
            <span id="filter-season" className="text-[9px] tracking-[0.15em] text-text-muted shrink-0 pt-1.5 sm:pt-0">
              SEASON
            </span>
            <div className="flex flex-wrap sm:flex-nowrap gap-1">
              {SEASON_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={seasonFilter === s.value}
                  onClick={() => setSeasonFilter(s.value)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.12em] border transition-colors duration-300 whitespace-nowrap ${
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
          <div className="flex items-start sm:items-center gap-2" role="group" aria-labelledby="filter-occasion">
            <span id="filter-occasion" className="text-[9px] tracking-[0.15em] text-text-muted shrink-0 pt-1.5 sm:pt-0">
              OCCASION
            </span>
            <div className="flex flex-wrap sm:flex-nowrap gap-1">
              {OCCASION_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={occasionFilter === o}
                  onClick={() => setOccasionFilter(o)}
                  className={`px-3 py-1.5 text-[10px] tracking-[0.12em] border transition-colors duration-300 whitespace-nowrap ${
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
      <p className="mb-8 text-[10px] tracking-[0.15em] text-text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "LOOK" : "LOOKS"}
      </p>

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
            type="button"
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
