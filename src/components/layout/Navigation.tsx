"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import MobileMenu from "./MobileMenu";

const NAV_LINKS = [
  { href: "/lookbook", label: "LOOKBOOK" },
  { href: "/closet", label: "CLOSET" },
  { href: "/style-dna", label: "STYLE DNA" },
  { href: "/about", label: "ABOUT" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navBg = scrolled || !isHome;
  const textColor = isHome && !scrolled ? "text-white" : "text-text";

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-500 ${
          navBg ? "bg-bg/95 backdrop-blur-md border-b border-border" : "bg-transparent"
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <nav className="flex items-center justify-between px-[var(--page-margin)] h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className={`font-serif text-lg md:text-xl tracking-[0.25em] font-light ${textColor} transition-colors duration-500 hover:opacity-70`}>
            ABI&apos;S LOOKBOOK
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-[11px] tracking-[0.18em] font-light transition-colors duration-300 ${
                    textColor
                  } hover:opacity-70`}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-px bg-accent"
                      layoutId="nav-underline"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={`md:hidden flex flex-col gap-[5px] p-2 ${textColor} transition-colors duration-500`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <motion.span
              className="block w-5 h-px bg-current"
              animate={menuOpen ? { rotate: 45, y: 3 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
            <motion.span
              className="block w-5 h-px bg-current"
              animate={menuOpen ? { rotate: -45, y: -3 } : { rotate: 0, y: 0 }}
              transition={{ duration: 0.3 }}
            />
          </button>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
