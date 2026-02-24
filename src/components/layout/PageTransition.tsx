"use client";

import { motion } from "motion/react";
import { ReactNode, useEffect, useState } from "react";

export default function PageTransition({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't apply initial hidden state on server render — keeps content visible
  // until JS hydrates, then Motion handles the animation
  return (
    <motion.div
      initial={mounted ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
