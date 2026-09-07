"use client";

import { motion } from "motion/react";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";
import { PORTRAIT_SRC, PORTRAIT_SRCSET, SIZES } from "@/lib/images";
import { useEntrance } from "@/lib/motion";
import Link from "next/link";
import { SITE } from "@/lib/site";

interface AboutClientProps {
  totalLooks: number;
  totalItems: number;
  wornOnce: number;
  workhorse?: { name: string; looks: number };
}

export default function AboutClient({ totalLooks, totalItems, wornOnce, workhorse }: AboutClientProps) {
  const zoomIn = useEntrance({ scale: 1.05 });
  const riseIn = useEntrance({ opacity: 0, y: 10 });

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
              src={PORTRAIT_SRC}
              srcSet={PORTRAIT_SRCSET}
              sizes={SIZES.portrait}
              width={1280}
              height={852}
              alt="Abi adjusting a shirt cuff, photographed from the chest down"
              className="absolute inset-0 w-full h-full object-cover object-center"
              initial={zoomIn}
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

        {/* The product story */}
        <div id="story" className="mt-20 border-t border-border pt-12 scroll-mt-28">
          <ScrollFadeIn>
            <div className="section-divider">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                THE PRODUCT STORY
              </span>
            </div>
          </ScrollFadeIn>

          {[
            {
              label: "THE PROBLEM",
              lead: `${wornOnce} of the ${totalItems} pieces in this closet have appeared in exactly one documented look.`,
              body: (
                <>
                  Most people who care about clothes still buy on the strength of the piece alone,
                  not on what it will do next to everything they already own. The evidence is in my
                  own data: {totalLooks} looks over four years, and the majority of purchases wore
                  once on camera.
                  {workhorse && (
                    <> Meanwhile one pair of {workhorse.name.toLowerCase()} carries {workhorse.looks} of them.</>
                  )}{" "}
                  <Link href="/style-dna#utility" className="text-accent-dark hover:text-text transition-colors">
                    The utility data &rarr;
                  </Link>
                </>
              ),
            },
            {
              label: "THE THESIS",
              lead: "The archive is the ground truth a purchase decision needs.",
              body: (
                <>
                  A lookbook that tags every piece to every look is a wear history. Reasoning over
                  it, rather than over generic style advice, is what makes an honest answer to
                  &ldquo;should I buy this?&rdquo; possible. The judgment involved is semantic and
                  visual: formality, silhouette, colour, season, duplication. That is a job for a
                  model grounded in this closet, not for a filter.
                </>
              ),
            },
            {
              label: "WHAT IS BUILT",
              lead: "Fashion first. The product thinking sits underneath.",
              body: (
                <>
                  Every look is photographed and tagged, with{" "}
                  <Link href="/lookbook/statement-suit" className="text-text border-b border-border hover:border-text transition-colors">
                    hotspots on the garments
                  </Link>
                  . Every piece in the{" "}
                  <Link href="/closet" className="text-text border-b border-border hover:border-text transition-colors">
                    closet
                  </Link>{" "}
                  links back to the looks it appears in.{" "}
                  <Link href="/style-dna" className="text-text border-b border-border hover:border-text transition-colors">
                    Style DNA
                  </Link>{" "}
                  turns that graph into wardrobe-utility insight. And{" "}
                  <Link href="/before-you-buy" className="text-text border-b border-border hover:border-text transition-colors">
                    Before You Buy
                  </Link>{" "}
                  is the assistant built on top of it.
                </>
              ),
            },
            {
              label: "HOW IT IS BUILT",
              lead: "The smallest architecture that gives a credible result.",
              body: (
                <>
                  Next.js and TypeScript, outfits and pieces as typed JSON, a build-time image
                  pipeline, and a test suite that checks the data and the pages on desktop and
                  mobile. The assistant will run behind a single server route with the model key
                  held privately and the whole closet passed as context. No vector database, no
                  agent framework, nothing uploaded is retained.
                </>
              ),
            },
            {
              label: "DECISIONS",
              lead: "A few calls worth explaining.",
              body: (
                <ul className="flex flex-col gap-2 list-none">
                  <li>Photographs render before JavaScript does. A visible page beats an entrance animation.</li>
                  <li>The site stays static until a feature genuinely needs a server. The assistant is the first.</li>
                  <li>Every claim the assistant makes must cite a piece or a look that exists. Anything it cannot see, it says so.</li>
                  <li>The full write-up, audit, and evaluation approach live with the source.</li>
                </ul>
              ),
            },
          ].map((block, i) => (
            <ScrollFadeIn key={block.label} delay={i * 0.05}>
              <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8">
                <div className="md:col-span-4">
                  <p className="text-[10px] tracking-[0.2em] text-text-muted">{block.label}</p>
                </div>
                <div className="md:col-span-8">
                  <p className="font-serif text-2xl md:text-[1.7rem] font-light leading-snug text-text">
                    {block.lead}
                  </p>
                  <div className="text-text-muted text-sm leading-relaxed mt-4">{block.body}</div>
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>

        {/* Contact / Links */}
        <ScrollFadeIn delay={0.1}>
          <div className="mt-20 border-t border-border pt-12">
            <div className="section-divider">
              <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">
                CONNECT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-8">
              {[
                {
                  label: "EMAIL",
                  value: SITE.email,
                  href: `mailto:${SITE.email}`,
                },
                {
                  label: "LINKEDIN",
                  value: SITE.linkedinLabel,
                  href: SITE.linkedin,
                },
                {
                  label: "SOURCE",
                  value: SITE.githubLabel,
                  href: SITE.github,
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
                  initial={riseIn}
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
