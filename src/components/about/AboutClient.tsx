"use client";

import { motion } from "motion/react";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";

export default function AboutClient() {
  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <ScrollFadeIn>
          <p className="text-[10px] tracking-[0.25em] text-text-muted mb-6">
            ABOUT
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.02em] leading-tight">
            The person
            <br />
            behind the looks.
          </h1>
        </ScrollFadeIn>

        {/* Portrait */}
        <ScrollFadeIn delay={0.15}>
          <div className="mt-12 relative overflow-hidden aspect-[3/2] max-w-2xl">
            <motion.img
              src="/abi-portrait.jpg"
              alt="Abi"
              className="absolute inset-0 w-full h-full object-cover object-center"
              initial={{ scale: 1.05 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 1,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </div>
        </ScrollFadeIn>

        {/* Bio */}
        <ScrollFadeIn delay={0.2}>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <p className="text-[10px] tracking-[0.2em] text-text-muted">
                BIO
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="text-text text-base leading-relaxed">
                I&apos;m Abi — a person who believes that how you dress is a form
                of creative expression worth documenting. This lookbook is a
                living portfolio: part personal style diary, part technical
                showcase, part love letter to the intersection of fashion and
                technology.
              </p>
              <p className="text-text-muted text-sm leading-relaxed mt-4">
                Every outfit is photographed, tagged, and catalogued. Each piece
                in my closet is cross-referenced across every look it appears in.
                The result is a searchable, visual archive of personal style —
                and a demonstration of what&apos;s possible when fashion thinking
                meets product thinking.
              </p>
            </div>
          </div>
        </ScrollFadeIn>

        {/* Philosophy */}
        <ScrollFadeIn delay={0.1}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <p className="text-[10px] tracking-[0.2em] text-text-muted">
                PHILOSOPHY
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="text-text text-base leading-relaxed">
                I gravitate toward pieces that are considered, not conspicuous.
                The wardrobe is built on versatile staples that can shift between
                contexts — work to weekend, casual to evening — through
                thoughtful layering and small details rather than dramatic
                costume changes.
              </p>
              <p className="text-text-muted text-sm leading-relaxed mt-4">
                Structure over trend. But never so rigid that it becomes a uniform.
              </p>
            </div>
          </div>
        </ScrollFadeIn>

        {/* This Project */}
        <ScrollFadeIn delay={0.1}>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
              <p className="text-[10px] tracking-[0.2em] text-text-muted">
                THIS PROJECT
              </p>
            </div>
            <div className="md:col-span-8">
              <p className="text-text text-base leading-relaxed">
                Built with Next.js, Tailwind CSS, and Motion. Every outfit is
                stored as structured data with tagged items, color palettes, and
                metadata. The closet is auto-sorted by garment type. The Style
                DNA page generates analytics from real wardrobe data.
              </p>
              <p className="text-text-muted text-sm leading-relaxed mt-4">
                The entire site is statically generated and deployable as a
                portfolio. It&apos;s designed to demonstrate both an eye for style
                and the technical ability to build the tools that serve it.
              </p>
            </div>
          </div>
        </ScrollFadeIn>

        {/* Contact / Links */}
        <ScrollFadeIn delay={0.1}>
          <div className="mt-20 border-t border-border pt-12">
            <div className="section-divider">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                CONNECT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-8">
              {[
                {
                  label: "EMAIL",
                  value: "abinav@wharton.upenn.edu",
                  href: "mailto:abinav@wharton.upenn.edu",
                },
                {
                  label: "LINKEDIN",
                  value: "linkedin.com/in/abinav-bharadwaj",
                  href: "https://www.linkedin.com/in/abinav-bharadwaj/",
                },
              ].map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="group block"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <p className="text-[9px] tracking-[0.2em] text-text-muted mb-1">
                    {link.label}
                  </p>
                  <p className="text-sm text-text group-hover:text-accent-dark transition-colors duration-300">
                    {link.value}
                  </p>
                </motion.a>
              ))}
            </div>
          </div>
        </ScrollFadeIn>
      </div>
    </div>
  );
}
