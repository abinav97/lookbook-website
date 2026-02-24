"use client";

import { motion } from "motion/react";

interface ImageRevealProps {
  colors?: string[];
  aspectRatio?: string;
  className?: string;
  alt?: string;
}

export default function ImageReveal({
  colors = ["#C4A882", "#8B7355"],
  aspectRatio = "3/4",
  className = "",
  alt = "Outfit photo",
}: ImageRevealProps) {
  const gradient =
    colors.length >= 2
      ? `linear-gradient(135deg, ${colors.join(", ")})`
      : `linear-gradient(135deg, ${colors[0]}, ${colors[0]}88)`;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio }}>
      {/* Gradient placeholder acting as the "photo" */}
      <motion.div
        className="absolute inset-0"
        style={{ background: gradient }}
        initial={{ scale: 1.1 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-multiply pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Reveal curtain */}
      <motion.div
        className="absolute inset-0"
        style={{ background: colors[0] || "#C4A882", transformOrigin: "right" }}
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 0.8,
          delay: 0.15,
          ease: [0.77, 0, 0.175, 1],
        }}
      />

      <span className="sr-only">{alt}</span>
    </div>
  );
}
