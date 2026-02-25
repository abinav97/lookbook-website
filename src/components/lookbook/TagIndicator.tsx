"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { OutfitTag, ClosetItem } from "@/lib/types";
import Link from "next/link";

interface TagIndicatorProps {
  tag: OutfitTag;
  item: ClosetItem | undefined;
}

export default function TagIndicator({ tag, item }: TagIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!item) return null;

  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${tag.position.x}%`, top: `${tag.position.y}%` }}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      onClick={() => setIsOpen(!isOpen)}
    >
      {/* Pulsing dot */}
      <div className="relative cursor-pointer">
        <span className="block w-3 h-3 rounded-full bg-white/90 border border-white/40 tag-pulse" />
        <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: "2s" }} />
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute left-4 top-1/2 -translate-y-1/2 ml-2 w-56 bg-white/95 backdrop-blur-md border border-border shadow-sm z-30"
            initial={{ opacity: 0, x: -8, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -8, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex gap-3 p-3">
              {/* Color swatch as item thumbnail */}
              <div
                className="w-12 h-12 flex-shrink-0"
                style={{ background: item.colorHex || "#C4A882" }}
              />
              <div className="flex flex-col justify-center min-w-0">
                <p className="text-xs font-medium text-text truncate">
                  {item.name}
                </p>
                {item.brand && (
                  <p className="text-[10px] tracking-[0.08em] text-text-muted mt-0.5">
                    {item.brand}
                  </p>
                )}
                <Link
                  href={`/closet/${item.category}#${item.id}`}
                  className="text-[9px] tracking-[0.12em] text-accent-dark hover:text-accent transition-colors mt-1"
                >
                  VIEW IN CLOSET &rarr;
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
