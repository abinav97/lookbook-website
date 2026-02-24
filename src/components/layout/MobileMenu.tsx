"use client";

import Link from "next/link";
import { motion } from "motion/react";

const LINKS = [
  { href: "/lookbook", label: "Lookbook" },
  { href: "/closet", label: "Closet" },
  { href: "/style-dna", label: "Style DNA" },
  { href: "/about", label: "About" },
];

interface MobileMenuProps {
  onClose: () => void;
}

export default function MobileMenu({ onClose }: MobileMenuProps) {
  return (
    <motion.div
      className="fixed inset-0 z-40 bg-bg flex flex-col justify-center px-[var(--page-margin)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <nav className="flex flex-col gap-2">
        {LINKS.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{
              duration: 0.5,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <Link
              href={link.href}
              onClick={onClose}
              className="block font-serif text-5xl sm:text-6xl font-light text-text tracking-[0.08em] py-3 hover:text-accent transition-colors duration-300"
            >
              {link.label}
            </Link>
          </motion.div>
        ))}
      </nav>

      <motion.div
        className="mt-16 flex flex-col gap-3 text-text-muted text-xs tracking-[0.15em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <span>A LIVING LOOKBOOK</span>
        <span>BY ABI</span>
      </motion.div>
    </motion.div>
  );
}
