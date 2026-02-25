"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Outfit } from "@/lib/types";
import { formatSeasonYear } from "@/lib/utils";

interface OutfitCardProps {
  outfit: Outfit;
  index?: number;
}

export default function OutfitCard({ outfit, index = 0 }: OutfitCardProps) {
  const image = outfit.images[0];
  const tagCount = image?.tags.length || 0;
  const colors = outfit.colorPalette || ["#C4A882", "#8B7355"];
  const gradient = `linear-gradient(145deg, ${colors.join(", ")})`;
  const aspectRatio = image ? `${image.width}/${image.height}` : "3/4";

  return (
    <motion.div
      className="masonry-item group"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.6,
        delay: (index % 3) * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Link href={`/lookbook/${outfit.slug}`} className="block relative overflow-hidden">
        {/* Image / Gradient placeholder */}
        <div
          className="w-full relative overflow-hidden"
          style={{ aspectRatio }}
        >
          {/* Real photo or gradient fallback */}
          <motion.div
            className="absolute inset-0"
            style={{ background: gradient }}
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {image?.src && (
              <img
                src={image.src}
                alt={image.alt}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
          </motion.div>

          {/* Tag count badge */}
          {tagCount > 0 && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] tracking-[0.12em] text-text font-medium z-10">
              {tagCount} {tagCount === 1 ? "ITEM" : "ITEMS"}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-500 flex items-end justify-start p-6 z-10">
            <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
              <p className="font-serif text-white text-2xl tracking-[0.06em] font-light">
                {outfit.title}
              </p>
              <p className="text-white/70 text-[10px] tracking-[0.15em] mt-1.5">
                {formatSeasonYear(outfit.season, outfit.date)} &middot;{" "}
                {outfit.occasion.map((o) => o.toUpperCase()).join(" / ")}
              </p>
            </div>
          </div>
        </div>

        {/* Card info below image */}
        <div className="pt-3 pb-1">
          <h3 className="font-serif text-lg tracking-[0.04em] font-light text-text">
            {outfit.title}
          </h3>
          <p className="text-[10px] tracking-[0.12em] text-text-muted mt-0.5">
            {formatSeasonYear(outfit.season, outfit.date)}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
