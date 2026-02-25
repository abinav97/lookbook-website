"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ClosetItem } from "@/lib/types";
import { getItemOutfitCount, getOutfitsForItem } from "@/lib/data";
import { formatSeasonYear } from "@/lib/utils";

interface ClosetItemCardProps {
  item: ClosetItem;
  index?: number;
}

export default function ClosetItemCard({ item, index = 0 }: ClosetItemCardProps) {
  const outfitCount = getItemOutfitCount(item.id);
  const [showOutfits, setShowOutfits] = useState(false);
  const outfits = showOutfits ? getOutfitsForItem(item.id) : [];

  return (
    <motion.div
      id={item.id}
      className="group cursor-pointer"
      onClick={() => outfitCount > 0 && setShowOutfits(!showOutfits)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{
        duration: 0.5,
        delay: (index % 4) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Item image or gradient fallback */}
      <div className="relative overflow-hidden aspect-square mb-3">
        {item.images?.[0] ? (
          <motion.img
            src={item.images[0]}
            alt={`${item.name}${item.brand ? ` by ${item.brand}` : ""}`}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : (
          <motion.div
            className="absolute inset-0"
            style={{
              background: item.colorHex
                ? `linear-gradient(135deg, ${item.colorHex}, ${item.colorHex}CC)`
                : "linear-gradient(135deg, #C4A882, #8B7355)",
            }}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        )}

        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Outfit count badge — clickable */}
        {outfitCount > 0 && (
          <button
            onClick={() => setShowOutfits(!showOutfits)}
            className="absolute bottom-2 right-2 text-[9px] tracking-[0.1em] text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5 hover:bg-black/50 transition-colors duration-300 cursor-pointer"
          >
            {outfitCount} {outfitCount === 1 ? "LOOK" : "LOOKS"}
          </button>
        )}
      </div>

      {/* Details */}
      <h4 className="text-[13px] font-medium text-text leading-snug group-hover:text-accent-dark transition-colors duration-300">
        {item.name}
      </h4>
      {item.brand && (
        <p className="text-[10px] tracking-[0.1em] text-text-muted mt-0.5">
          {item.brand}
        </p>
      )}
      {item.color && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <span
            className="block w-2.5 h-2.5 rounded-full border border-border"
            style={{ background: item.colorHex || "#ccc" }}
          />
          <span className="text-[10px] text-text-muted">{item.color}</span>
        </div>
      )}

      {/* Expandable outfit panel */}
      <AnimatePresence>
        {showOutfits && outfits.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-[9px] tracking-[0.15em] text-text-muted mb-2">
                APPEARS IN
              </p>
              <div className="flex flex-col gap-2">
                {outfits.map((outfit) => {
                  const colors = outfit.colorPalette || ["#C4A882", "#8B7355"];
                  return (
                    <Link
                      key={outfit.id}
                      href={`/lookbook/${outfit.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-2.5 group/outfit"
                    >
                      <div className="w-10 h-12 shrink-0 relative overflow-hidden">
                        {outfit.images[0]?.src ? (
                          <img
                            src={outfit.images[0].src}
                            alt={outfit.title}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `linear-gradient(135deg, ${colors.join(", ")})`,
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-text truncate group-hover/outfit:text-accent-dark transition-colors duration-300">
                          {outfit.title}
                        </p>
                        <p className="text-[9px] tracking-[0.08em] text-text-muted">
                          {formatSeasonYear(outfit.season, outfit.date)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
