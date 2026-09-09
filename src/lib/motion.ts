"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Entrance animations are a flourish, not content. Two rules keep them safe:
 *
 * 1. The first paint of any page must be fully visible. Motion's `initial`
 *    prop is serialized into the SSR HTML as `opacity:0`, which blanks the
 *    page for anyone whose JavaScript is slow, blocked, or whose
 *    IntersectionObserver never fires. So on the very first hydration we
 *    render at the resting state and only animate on later client-side
 *    navigations (when the user has already seen the site work).
 * 2. `prefers-reduced-motion` disables entrance animation entirely.
 *
 * Usage: `initial={useEntrance({ opacity: 0, y: 30 })}`.
 */

let hydratedOnce = false;

export function useEntrance<T>(hidden: T): T | false {
  const reduced = useReducedMotion();
  const [animate] = useState(() => hydratedOnce);

  useEffect(() => {
    hydratedOnce = true;
  }, []);

  if (reduced || !animate) return false;
  return hidden;
}
