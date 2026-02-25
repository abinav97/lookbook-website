"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Outfit, OutfitTag, ClosetItem, OutfitImage } from "@/lib/types";
import { formatSeasonYear } from "@/lib/utils";

import ScrollFadeIn from "@/components/ui/ScrollFadeIn";

interface TagWithItem {
  tag: OutfitTag;
  item: ClosetItem | undefined;
}

interface OutfitDetailClientProps {
  outfit: Outfit;
  tagItems: TagWithItem[];
}

/** Extract the caption portion after " — " from an alt string */
function getDetailCaption(alt: string): string | null {
  const sep = alt.indexOf(" — ");
  return sep !== -1 ? alt.slice(sep + 3) : null;
}

export default function OutfitDetailClient({
  outfit,
  tagItems,
}: OutfitDetailClientProps) {
  const heroImage = outfit.images[0];
  const detailImages = outfit.images.slice(1);
  const hasDetails = detailImages.length > 0;
  const colors = outfit.colorPalette || ["#C4A882", "#8B7355"];
  const gradient = `linear-gradient(160deg, ${colors.join(", ")})`;

  // Get unique items for the "items in this look" section
  const uniqueItems = tagItems.reduce<ClosetItem[]>((acc, { item }) => {
    if (item && !acc.find((i) => i.id === item.id)) acc.push(item);
    return acc;
  }, []);

  return (
    <div className="pb-20">
      {/* ============================================ */}
      {/* HERO IMAGE */}
      {/* ============================================ */}
      <section className="relative">
        <div className="relative w-full max-w-4xl mx-auto">
          <motion.div
            className="relative w-full"
            style={{ background: gradient }}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {heroImage?.src ? (
              <img
                src={heroImage.src}
                alt={heroImage.alt}
                className="w-full h-auto block"
              />
            ) : (
              <div style={{ aspectRatio: `${heroImage?.width || 800}/${heroImage?.height || 1200}` }} />
            )}
          </motion.div>

          <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      </section>

      {/* ============================================ */}
      {/* DETAIL PHOTOS — editorial strip */}
      {/* ============================================ */}
      {hasDetails && (
        <section className="px-[var(--page-margin)] pt-12 md:pt-16">
          <ScrollFadeIn>
            <div className="section-divider mb-8">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                THE DETAILS
              </span>
            </div>
          </ScrollFadeIn>

          <DetailGallery images={detailImages} colors={colors} />
        </section>
      )}

      {/* ============================================ */}
      {/* OUTFIT INFO */}
      {/* ============================================ */}
      <section className="px-[var(--page-margin)] pt-12 md:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: metadata */}
          <div className="lg:col-span-5">
            <ScrollFadeIn>
              <Link
                href="/lookbook"
                className="text-[10px] tracking-[0.15em] text-text-muted hover:text-text transition-colors duration-300 mb-6 inline-block"
              >
                &larr; BACK TO LOOKBOOK
              </Link>

              <h1 className="font-serif text-4xl md:text-5xl font-light tracking-[0.02em] mt-4">
                {outfit.title}
              </h1>

              <div className="flex items-center gap-4 mt-4 text-[10px] tracking-[0.12em] text-text-muted">
                <span>{formatSeasonYear(outfit.season, outfit.date)}</span>
              </div>

              {outfit.description && (
                <p className="text-text-muted text-sm leading-relaxed mt-6 max-w-md">
                  {outfit.description}
                </p>
              )}

              {/* Occasion tags */}
              <div className="flex gap-2 mt-6">
                {outfit.occasion.map((occ) => (
                  <span
                    key={occ}
                    className="px-3 py-1 text-[9px] tracking-[0.12em] text-text-muted border border-border"
                  >
                    {occ.toUpperCase()}
                  </span>
                ))}
              </div>

              {/* Color palette */}
              {outfit.colorPalette && outfit.colorPalette.length > 0 && (
                <div className="mt-8">
                  <p className="text-[9px] tracking-[0.15em] text-text-muted mb-3">
                    COLOR PALETTE
                  </p>
                  <div className="flex gap-1.5">
                    {outfit.colorPalette.map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 border border-border"
                        style={{ background: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </ScrollFadeIn>
          </div>

          {/* Right: items in this look */}
          <div className="lg:col-span-7">
            <ScrollFadeIn delay={0.15}>
              <div className="section-divider">
                <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                  ITEMS IN THIS LOOK
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                {uniqueItems.map((item, i) => (
                  <motion.div
                    key={item.id}
                    className="group"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.08,
                      duration: 0.5,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {/* Item image or gradient fallback */}
                    <div className="aspect-square mb-2 relative overflow-hidden">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={`${item.name}${item.brand ? ` by ${item.brand}` : ""}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="absolute inset-0"
                          style={{
                            background: item.colorHex
                              ? `linear-gradient(135deg, ${item.colorHex}, ${item.colorHex}BB)`
                              : "linear-gradient(135deg, #C4A882, #8B7355)",
                          }}
                        />
                      )}
                      <div
                        className="absolute inset-0 opacity-[0.05] pointer-events-none"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                        }}
                      />
                    </div>
                    <p className="text-[12px] font-medium text-text leading-snug">
                      {item.name}
                    </p>
                    {item.brand && (
                      <p className="text-[10px] tracking-[0.06em] text-text-muted mt-0.5">
                        {item.brand}
                      </p>
                    )}
                    <Link
                      href={`/closet/${item.category}#${item.id}`}
                      className="text-[9px] tracking-[0.1em] text-accent-dark hover:text-accent transition-colors mt-1 inline-block"
                    >
                      VIEW IN CLOSET &rarr;
                    </Link>
                  </motion.div>
                ))}
              </div>
            </ScrollFadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Detail Gallery — asymmetric editorial grid
   ───────────────────────────────────────────────── */
function DetailGallery({
  images,
  colors,
}: {
  images: OutfitImage[];
  colors: string[];
}) {
  // Determine layout based on number of detail shots
  if (images.length === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <DetailImage image={images[0]} colors={colors} index={0} />
      </div>
    );
  }

  if (images.length === 2) {
    // Asymmetric two-up: staggered with different sizes
    return (
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start max-w-5xl mx-auto">
        <div className="md:col-span-7">
          <DetailImage image={images[0]} colors={colors} index={0} />
        </div>
        <div className="md:col-span-5 md:mt-16">
          <DetailImage image={images[1]} colors={colors} index={1} />
        </div>
      </div>
    );
  }

  // 3+ images: staggered masonry-style grid
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-start max-w-5xl mx-auto">
      {images.map((img, i) => (
        <div
          key={i}
          className={i % 2 === 1 ? "mt-8 md:mt-12" : ""}
        >
          <DetailImage image={img} colors={colors} index={i} />
        </div>
      ))}
    </div>
  );
}

function DetailImage({
  image,
  colors,
  index,
}: {
  image: OutfitImage;
  colors: string[];
  index: number;
}) {
  const caption = getDetailCaption(image.alt);
  const fallbackGradient = `linear-gradient(135deg, ${colors.join(", ")})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div className="relative overflow-hidden group">
        <motion.div
          className="relative w-full"
          style={{
            aspectRatio: `${image.width}/${image.height}`,
            background: fallbackGradient,
          }}
          whileHover={{ scale: 1.03 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {image.src && (
            <img
              src={image.src}
              alt={image.alt}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Subtle noise overlay */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </div>

      {caption && (
        <p className="text-[10px] tracking-[0.12em] text-text-muted mt-3 italic">
          {caption}
        </p>
      )}
    </motion.div>
  );
}
