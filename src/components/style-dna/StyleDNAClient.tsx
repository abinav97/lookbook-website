"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { ClosetCategory, CATEGORY_LABELS } from "@/lib/types";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";
import { useEntrance } from "@/lib/motion";
import Link from "next/link";
import type { UtilityInsights } from "@/lib/insights";
import { serviceYears } from "@/lib/insights";

interface StyleDNAClientProps {
  allColors: string[];
  categoryStats: { category: ClosetCategory; count: number }[];
  seasonCounts: Record<string, number>;
  totalOutfits: number;
  totalItems: number;
  utility: UtilityInsights;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export default function StyleDNAClient({
  allColors,
  categoryStats,
  seasonCounts,
  totalOutfits,
  totalItems,
  utility,
}: StyleDNAClientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const riseIn = useEntrance({ opacity: 0, y: 15 });
  const popIn = useEntrance({ opacity: 0, scale: 0.8 });
  const slideIn = useEntrance({ opacity: 0, x: -20 });
  const growIn = useEntrance({ scaleX: 0 });
  const totalCatItems = categoryStats.reduce((a, b) => a + b.count, 0);

  // Color constellation canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Deduplicate colors
    const unique = [...new Set(allColors)];

    // Plot each color as a dot positioned by hue (x) and lightness (y)
    unique.forEach((hex) => {
      const hsl = hexToHSL(hex);
      const x = (hsl.h / 360) * rect.width;
      const y = (1 - hsl.l / 100) * rect.height;
      const radius = 6 + hsl.s * 0.12;

      // Glow
      ctx.beginPath();
      ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
      ctx.fillStyle = hex + "20";
      ctx.fill();

      // Dot
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = hex;
      ctx.fill();

      // Border
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = hex + "60";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [allColors]);

  const seasonLabels: Record<string, string> = {
    spring: "Spring",
    summer: "Summer",
    fall: "Fall",
    winter: "Winter",
  };

  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      {/* Header */}
      <ScrollFadeIn>
        <div className="mb-16 max-w-2xl">
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.02em]">
            Style DNA
          </h1>
          <p className="text-text-muted text-sm mt-4 leading-relaxed">
            A data-driven portrait of personal style. Patterns, palettes, and
            the numbers behind the wardrobe.
          </p>
        </div>
      </ScrollFadeIn>

      {/* Quick stats */}
      <ScrollFadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {[
            { label: "TOTAL LOOKS", value: totalOutfits },
            { label: "CLOSET PIECES", value: totalItems },
            { label: "UNIQUE COLORS", value: [...new Set(allColors)].length },
            { label: "CATEGORIES", value: categoryStats.length },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={riseIn}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="font-serif text-4xl md:text-5xl font-light text-text">
                {stat.value}
              </p>
              <p className="text-[9px] tracking-[0.2em] text-text-muted mt-2">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </ScrollFadeIn>

      {/* ============================================ */}
      {/* WARDROBE UTILITY */}
      {/* ============================================ */}
      <ScrollFadeIn>
        <section className="mb-20" id="utility" aria-labelledby="utility-heading">
          <h2 id="utility-heading" className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
              WARDROBE UTILITY
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mt-8">
            {/* Narrative + distribution */}
            <div className="lg:col-span-5">
              <p className="font-serif text-2xl md:text-3xl font-light leading-snug text-text">
                {utility.totalItems} pieces. {utility.wornOnce} of them have appeared in exactly
                one documented look.
              </p>
              <p className="text-text-muted text-sm leading-relaxed mt-4 max-w-md">
                The other {utility.multiLook} carry the rest of the lookbook. Re-use is the
                honest measure of whether a purchase earned its place, and it is the question
                the wardrobe still answers badly.
              </p>

              {/* Distribution: one segment per look-count */}
              <div className="mt-8">
                <p className="text-[9px] tracking-[0.2em] text-text-muted mb-3">
                  PIECES BY NUMBER OF LOOKS
                </p>
                <div
                  className="flex h-2 w-full overflow-hidden border border-border bg-bg-alt"
                  role="img"
                  aria-label={Object.entries(utility.distribution)
                    .map(([looks, n]) => `${n} pieces in ${looks} ${Number(looks) === 1 ? "look" : "looks"}`)
                    .join(", ")}
                >
                  {Object.entries(utility.distribution)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([looks, n], i, arr) => (
                      <motion.div
                        key={looks}
                        className="h-full border-r border-bg last:border-r-0"
                        style={{
                          width: `${(n / utility.totalItems) * 100}%`,
                          background: `color-mix(in srgb, var(--accent) ${Math.round(((i + 1) / arr.length) * 100)}%, var(--bg-alt))`,
                          transformOrigin: "left",
                        }}
                        initial={growIn}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      />
                    ))}
                </div>
                <dl className="flex flex-wrap gap-x-5 gap-y-1 mt-3">
                  {Object.entries(utility.distribution)
                    .sort((a, b) => Number(a[0]) - Number(b[0]))
                    .map(([looks, n]) => (
                      <div key={looks} className="flex items-baseline gap-1.5">
                        <dt className="text-[9px] tracking-[0.15em] text-text-muted">
                          {looks} {Number(looks) === 1 ? "LOOK" : "LOOKS"}
                        </dt>
                        <dd className="font-serif text-lg font-light text-text">{n}</dd>
                      </div>
                    ))}
                </dl>
              </div>

              {/* Category reuse */}
              <div className="mt-8">
                <p className="text-[9px] tracking-[0.2em] text-text-muted mb-3">
                  SHARE OF PIECES RE-WORN, BY CATEGORY
                </p>
                <ul className="flex flex-col gap-1.5">
                  {utility.categoryReuse.slice(0, 5).map((c) => (
                    <li key={c.category} className="flex items-center justify-between text-[10px] tracking-[0.12em]">
                      <span className="text-text-muted">{CATEGORY_LABELS[c.category].toUpperCase()}</span>
                      <span className="text-text">
                        {c.reused}/{c.items} &middot; {Math.round(c.share * 100)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Workhorses */}
            <div className="lg:col-span-7">
              <p className="text-[9px] tracking-[0.2em] text-text-muted mb-4">THE WORKHORSES</p>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-8">
                {utility.workhorses.map((w, i) => (
                  <motion.li
                    key={w.item.id}
                    initial={riseIn}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link href={`/closet/${w.item.category}#${w.item.id}`} className="group block">
                      <div className="relative aspect-square overflow-hidden bg-bg-alt mb-2">
                        {w.item.images?.[0] ? (
                          <img
                            src={w.item.images[0]}
                            alt={w.item.name}
                            width={800}
                            height={800}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="absolute inset-0" style={{ background: w.item.colorHex || "#C4A882" }} />
                        )}
                        <span className="absolute bottom-2 right-2 text-[9px] tracking-[0.1em] text-white/90 bg-black/35 backdrop-blur-sm px-2 py-0.5">
                          {w.looks} LOOKS
                        </span>
                      </div>
                      <p className="text-[12px] font-medium text-text leading-snug group-hover:text-accent-dark transition-colors">
                        {w.item.name}
                      </p>
                      <p className="text-[10px] tracking-[0.08em] text-text-muted mt-0.5">
                        {w.item.brand ? `${w.item.brand} · ` : ""}
                        {serviceYears(w.dates)}
                      </p>
                    </Link>
                  </motion.li>
                ))}
              </ul>

              <p className="text-text-muted text-sm leading-relaxed mt-8 max-w-md">
                {utility.longestServing[0] && (
                  <>
                    The longest-serving piece, the{" "}
                    <Link
                      href={`/closet/${utility.longestServing[0].item.category}#${utility.longestServing[0].item.id}`}
                      className="text-text border-b border-border hover:border-text transition-colors"
                    >
                      {utility.longestServing[0].item.name.toLowerCase()}
                    </Link>
                    , has been in rotation since {serviceYears(utility.longestServing[0].dates).slice(0, 4)}.{" "}
                  </>
                )}
                This is the gap the purchase assistant is built to close.{" "}
                <Link
                  href="/before-you-buy"
                  className="text-[11px] tracking-[0.15em] text-accent-dark hover:text-text transition-colors whitespace-nowrap"
                >
                  BEFORE YOU BUY &rarr;
                </Link>
              </p>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ============================================ */}
      {/* COLOR UNIVERSE */}
      {/* ============================================ */}
      <ScrollFadeIn>
        <section className="mb-20">
          <div className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
              COLOR UNIVERSE
            </span>
          </div>
          <p className="text-text-muted text-sm mt-4 mb-8 max-w-md leading-relaxed">
            Every color extracted from every outfit, mapped by hue and brightness.
            Clusters reveal the tones that define the wardrobe.
          </p>

          <div className="relative bg-bg-alt border border-border overflow-hidden" style={{ height: "300px" }}>
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: "block" }}
            />
            {/* Axis labels */}
            <div className="absolute bottom-2 left-3 text-[8px] tracking-[0.1em] text-text-muted/50">
              WARM
            </div>
            <div className="absolute bottom-2 right-3 text-[8px] tracking-[0.1em] text-text-muted/50">
              COOL
            </div>
            <div className="absolute top-2 left-3 text-[8px] tracking-[0.1em] text-text-muted/50">
              DARK
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.1em] text-text-muted/50">
              HUE SPECTRUM &rarr;
            </div>
          </div>

          {/* Color swatches row */}
          <div className="flex flex-wrap gap-1 mt-4">
            {[...new Set(allColors)].map((color, i) => (
              <motion.div
                key={`${color}-${i}`}
                className="w-6 h-6 border border-border"
                style={{ background: color }}
                initial={popIn}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                title={color}
              />
            ))}
          </div>
        </section>
      </ScrollFadeIn>

      {/* ============================================ */}
      {/* WARDROBE COMPOSITION */}
      {/* ============================================ */}
      <ScrollFadeIn>
        <section className="mb-20">
          <div className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
              WARDROBE COMPOSITION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-8">
            {/* Category bars */}
            <div className="flex flex-col gap-4">
              {categoryStats.map((stat, i) => {
                const pct = totalCatItems > 0 ? (stat.count / totalCatItems) * 100 : 0;
                return (
                  <motion.div
                    key={stat.category}
                    initial={slideIn}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex justify-between mb-1.5">
                      <span className="text-[10px] tracking-[0.12em] text-text-muted">
                        {CATEGORY_LABELS[stat.category].toUpperCase()}
                      </span>
                      <span className="text-[10px] tracking-[0.08em] text-text-muted">
                        {stat.count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-bg-alt border border-border overflow-hidden">
                      <motion.div
                        className="h-full bg-accent"
                        initial={growIn}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 + i * 0.06, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{ transformOrigin: "left", width: `${pct}%` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Season breakdown */}
            <div>
              <p className="text-[10px] tracking-[0.15em] text-text-muted mb-6">
                SEASONAL DISTRIBUTION
              </p>
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(seasonLabels).map(([key, label], i) => {
                  const count = seasonCounts[key] || 0;
                  const pct = totalOutfits > 0 ? Math.round((count / totalOutfits) * 100) : 0;
                  return (
                    <motion.div
                      key={key}
                      className="border border-border p-5"
                      initial={riseIn}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08, duration: 0.5 }}
                    >
                      <p className="font-serif text-3xl font-light">{pct}%</p>
                      <p className="text-[10px] tracking-[0.15em] text-text-muted mt-1">
                        {label.toUpperCase()}
                      </p>
                      <p className="text-[10px] text-text-muted/60 mt-0.5">
                        {count} {count === 1 ? "look" : "looks"}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </ScrollFadeIn>

      {/* ============================================ */}
      {/* STYLE NARRATIVE */}
      {/* ============================================ */}
      <ScrollFadeIn>
        <section className="mb-8">
          <div className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
              STYLE SIGNATURE
            </span>
          </div>

          <div className="max-w-2xl mt-8">
            <blockquote className="font-serif text-2xl md:text-3xl font-light leading-relaxed text-text tracking-[0.01em]">
              &ldquo;The approach is intentional without being rigid: classic
              pieces remixed across seasons, dressed up or down by context
              rather than costume.&rdquo;
            </blockquote>
            <p className="text-[10px] tracking-[0.15em] text-text-muted mt-6">
              &mdash;ABI
            </p>
          </div>
        </section>
      </ScrollFadeIn>
    </div>
  );
}
