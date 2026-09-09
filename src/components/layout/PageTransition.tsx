"use client";

import { motion } from "motion/react";
import { ReactNode } from "react";
import { useEntrance } from "@/lib/motion";

export default function PageTransition({ children }: { children: ReactNode }) {
  const initial = useEntrance({ opacity: 0, y: 12 });

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
