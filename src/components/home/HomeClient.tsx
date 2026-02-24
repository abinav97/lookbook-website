"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Outfit, Collection } from "@/lib/types";
import { formatDateShort } from "@/lib/utils";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";

interface HomeClientProps {
  featured: Outfit[];
  collections: Collection[];
  totalOutfits: number;
}

export default function HomeClient({
  featured,
  collections,
  totalOutfits,
}: HomeClientProps) {
  const heroOutfit = featured[0];
  const heroColors = heroOutfit?.colorPalette || ["#C19A6B", "#36454F", "#1A1A1A"];
  const heroGradient = `linear-gradient(160deg, ${heroColors[0]}CC, ${heroColors[1] || heroColors[0]}99, ${heroColors[2] || "#1A1A1A"})`;

  return (
    <div>
      {/* ============================================ */}
      {/* HERO — Full viewport, editorial cover */}
      {/* ============================================ */}
      <section className="relative h-screen flex items-end overflow-hidden">
        {/* Background gradient */}
        <motion.div
          className="absolute inset-0"
          style={{ background: heroGradient }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />

        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Hero content */}
        <div className="relative z-10 px-[var(--page-margin)] pb-16 md:pb-24 w-full">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <p className="text-white/50 text-[10px] tracking-[0.3em] mb-4">
              A LIVING PORTFOLIO
            </p>
          </motion.div>

          <motion.h1
            className="font-serif text-white text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-[0.9] tracking-[0.02em]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            Abi&apos;s
            <br />
            <span className="tracking-[0.06em]">Lookbook</span>
          </motion.h1>

          <motion.div
            className="flex items-center gap-8 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            <Link
              href="/lookbook"
              className="text-white text-[11px] tracking-[0.2em] border-b border-white/40 pb-1 hover:border-white transition-colors duration-300"
            >
              EXPLORE LOOKS
            </Link>
            <Link
              href="/closet"
              className="text-white/60 text-[11px] tracking-[0.2em] hover:text-white transition-colors duration-300"
            >
              OPEN CLOSET
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            className="flex gap-12 mt-12 text-white/40 text-[10px] tracking-[0.15em]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <span>{totalOutfits} LOOKS</span>
            <span>{collections.length} COLLECTIONS</span>
            <span>EST. 2025</span>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <motion.div
            className="w-px h-8 bg-white/30"
            animate={{ scaleY: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      {/* ============================================ */}
      {/* FEATURED LOOKS — Editorial grid */}
      {/* ============================================ */}
      <section className="px-[var(--page-margin)] py-20 md:py-32">
        <ScrollFadeIn>
          <div className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
              FEATURED LOOKS
            </span>
          </div>
        </ScrollFadeIn>

        {/* Asymmetric editorial grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--grid-gutter)] mt-10">
          {featured.slice(0, 4).map((outfit, i) => {
            const colors = outfit.colorPalette || ["#C4A882", "#8B7355"];
            const gradient = `linear-gradient(145deg, ${colors.join(", ")})`;
            // Asymmetric sizing: first item large, others smaller
            const colSpan =
              i === 0
                ? "md:col-span-7 md:row-span-2"
                : i === 1
                ? "md:col-span-5"
                : "md:col-span-5";
            const aspect = i === 0 ? "aspect-[3/4]" : "aspect-[4/3]";

            return (
              <ScrollFadeIn
                key={outfit.id}
                className={colSpan}
                delay={i * 0.1}
              >
                <Link
                  href={`/lookbook/${outfit.slug}`}
                  className="group block relative overflow-hidden"
                >
                  <div className={`relative ${aspect} overflow-hidden`}>
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: gradient }}
                      whileHover={{ scale: 1.04 }}
                      transition={{
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {outfit.images[0]?.src && (
                        <img
                          src={outfit.images[0].src}
                          alt={outfit.images[0].alt}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                    </motion.div>
                    {/* Hover overlay with info */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all duration-600 flex items-end p-6">
                      <div className="translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <p className="font-serif text-white text-xl md:text-2xl font-light tracking-[0.04em]">
                          {outfit.title}
                        </p>
                        <p className="text-white/60 text-[10px] tracking-[0.12em] mt-1">
                          {formatDateShort(outfit.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-serif text-lg font-light tracking-[0.04em]">
                      {outfit.title}
                    </h3>
                    <p className="text-[10px] tracking-[0.1em] text-text-muted mt-0.5">
                      {outfit.season.toUpperCase()} &middot;{" "}
                      {outfit.occasion[0]?.toUpperCase()}
                    </p>
                  </div>
                </Link>
              </ScrollFadeIn>
            );
          })}
        </div>

        <ScrollFadeIn className="mt-12 text-center">
          <Link
            href="/lookbook"
            className="inline-block text-[11px] tracking-[0.2em] text-text-muted border-b border-border pb-1 hover:text-text hover:border-text transition-colors duration-300"
          >
            VIEW ALL LOOKS &rarr;
          </Link>
        </ScrollFadeIn>
      </section>

      {/* ============================================ */}
      {/* COLLECTIONS */}
      {/* ============================================ */}
      <section className="bg-bg-alt py-20 md:py-32">
        <div className="px-[var(--page-margin)]">
          <ScrollFadeIn>
            <div className="section-divider">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                COLLECTIONS
              </span>
            </div>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-10">
            {collections.map((collection, i) => {
              const collectionGradient =
                i === 0
                  ? "linear-gradient(135deg, #C19A6B, #36454F, #1A1A1A)"
                  : "linear-gradient(135deg, #9CAF88, #556B2F, #3F5277)";

              return (
                <ScrollFadeIn key={collection.id} delay={i * 0.15}>
                  <div className="group">
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <motion.div
                        className="absolute inset-0"
                        style={{ background: collectionGradient }}
                        whileHover={{ scale: 1.03 }}
                        transition={{
                          duration: 0.7,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                      <div
                        className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                      />
                      {/* Season label on image */}
                      <div className="absolute top-5 left-5 text-white/60 text-[9px] tracking-[0.2em]">
                        {collection.season?.toUpperCase()}
                      </div>
                    </div>
                    <div className="mt-4">
                      <h3 className="font-serif text-2xl md:text-3xl font-light tracking-[0.04em]">
                        {collection.title}
                      </h3>
                      <p className="text-sm text-text-muted mt-2 max-w-md leading-relaxed">
                        {collection.description}
                      </p>
                      <p className="text-[10px] tracking-[0.12em] text-text-muted mt-3">
                        {collection.outfitIds.length} LOOKS
                      </p>
                    </div>
                  </div>
                </ScrollFadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* CLOSET TEASER */}
      {/* ============================================ */}
      <section className="px-[var(--page-margin)] py-20 md:py-32">
        <ScrollFadeIn>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[10px] tracking-[0.25em] text-text-muted mb-6">
              THE CLOSET
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light tracking-[0.02em] leading-tight">
              Every piece,
              <br />
              catalogued.
            </h2>
            <p className="text-text-muted text-sm mt-6 leading-relaxed max-w-md mx-auto">
              Explore the individual items that build each look.
              Tagged, categorised, and cross-referenced across every outfit.
            </p>
            <Link
              href="/closet"
              className="inline-block mt-8 text-[11px] tracking-[0.2em] text-text border-b border-text pb-1 hover:text-accent hover:border-accent transition-colors duration-300"
            >
              EXPLORE ABI&apos;S CLOSET &rarr;
            </Link>
          </div>
        </ScrollFadeIn>
      </section>
    </div>
  );
}
