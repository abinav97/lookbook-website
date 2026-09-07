"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { OutfitTag, ClosetItem } from "@/lib/types";
import { cn } from "@/lib/utils";

interface HotspotsProps {
  tags: OutfitTag[];
  items: Record<string, ClosetItem | undefined>;
}

/**
 * Editorial photo hotspots: a quiet marker on each tagged garment. Hover on
 * desktop, tap on touch. One card open at a time; Escape or an outside tap
 * closes it. Cards are positioned relative to the photo so they never leave
 * the frame on small screens.
 */
export default function Hotspots({ tags, items }: HotspotsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [small, setSmall] = useState(false);
  const baseId = useId();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const update = () => setSmall(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest("[data-hotspot]")) setOpenId(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [openId]);

  const visible = tags.filter((t) => items[t.closetItemId]);
  if (visible.length === 0) return null;

  return (
    <div className="absolute inset-0 z-20" aria-label="Tagged pieces in this photo" role="group">
      {visible.map((tag) => {
        const item = items[tag.closetItemId]!;
        const isOpen = openId === tag.id;
        const cardId = `${baseId}-${tag.id}`;
        const flip = tag.position.x > 55;
        const { x, y } = tag.position;

        // Card placement: beside the marker on wider screens, beneath it and
        // clamped inside the photo on phones.
        const cardStyle: React.CSSProperties = small
          ? {
              left: `clamp(0px, calc(${x}% - 7rem), calc(100% - 14rem))`,
              top: y > 78 ? undefined : `calc(${y}% + 1.25rem)`,
              bottom: y > 78 ? `calc(${100 - y}% + 1.25rem)` : undefined,
            }
          : {
              top: `${y}%`,
              transform: "translateY(-50%)",
              ...(flip
                ? { right: `calc(${100 - x}% + 1.25rem)` }
                : { left: `calc(${x}% + 1.25rem)` }),
            };

        return (
          <div key={tag.id} data-hotspot>
            <button
              type="button"
              aria-label={`${item.name}${item.brand ? ` by ${item.brand}` : ""}`}
              aria-expanded={isOpen}
              aria-controls={cardId}
              onMouseEnter={() => !small && setOpenId(tag.id)}
              onClick={() => setOpenId(tag.id)}
              className="absolute -translate-x-1/2 -translate-y-1/2 p-3 group/dot"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span
                className={cn(
                  "block w-3 h-3 rounded-full border border-white/80 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition-transform duration-300",
                  isOpen ? "scale-125 bg-white" : "tag-pulse group-hover/dot:scale-125"
                )}
              />
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={cardId}
                  role="dialog"
                  aria-label={item.name}
                  className="absolute w-56 bg-bg/95 backdrop-blur-md border border-border shadow-sm z-30"
                  style={cardStyle}
                  onMouseLeave={() => !small && setOpenId(null)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-14 h-14 flex-shrink-0 relative overflow-hidden bg-bg-alt">
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt=""
                          width={56}
                          height={56}
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0" style={{ background: item.colorHex || "#C4A882" }} />
                      )}
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <p className="text-xs font-medium text-text leading-snug">{item.name}</p>
                      {item.brand && (
                        <p className="text-[10px] tracking-[0.08em] text-text-muted mt-0.5">{item.brand}</p>
                      )}
                      <Link
                        href={`/closet/${item.category}#${item.id}`}
                        className="text-[9px] tracking-[0.12em] text-accent-dark hover:text-accent transition-colors mt-1.5"
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
      })}
    </div>
  );
}
