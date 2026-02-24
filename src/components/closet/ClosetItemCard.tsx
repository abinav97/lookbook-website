"use client";

import { motion } from "motion/react";
import { ClosetItem } from "@/lib/types";
import { getItemOutfitCount } from "@/lib/data";

interface ClosetItemCardProps {
  item: ClosetItem;
  index?: number;
}

export default function ClosetItemCard({ item, index = 0 }: ClosetItemCardProps) {
  const outfitCount = getItemOutfitCount(item.id);

  return (
    <motion.div
      className="group cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{
        duration: 0.5,
        delay: (index % 4) * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {/* Item swatch / placeholder */}
      <div className="relative overflow-hidden aspect-square mb-3">
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

        {/* Noise overlay */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Outfit count overlay */}
        {outfitCount > 0 && (
          <div className="absolute bottom-2 right-2 text-[9px] tracking-[0.1em] text-white/80 bg-black/30 backdrop-blur-sm px-2 py-0.5">
            {outfitCount} {outfitCount === 1 ? "LOOK" : "LOOKS"}
          </div>
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
    </motion.div>
  );
}
