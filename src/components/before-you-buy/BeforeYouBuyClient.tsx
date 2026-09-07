"use client";

import Link from "next/link";
import ScrollFadeIn from "@/components/ui/ScrollFadeIn";
import Advisor, { type ItemLite } from "./Advisor";
import type { DemoSummary } from "@/lib/advisor/demos";

interface Workhorse {
  id: string;
  name: string;
  category: string;
  image?: string;
  looks: number;
}

interface BeforeYouBuyClientProps {
  demos: DemoSummary[];
  itemMap: Record<string, ItemLite>;
  totalItems: number;
  totalLooks: number;
  categories: number;
  wornOnce: number;
  workhorses: Workhorse[];
}

const STEPS = [
  {
    n: "01",
    title: "Show it the piece",
    body: "A photo from the fitting room, a product page, or a plain description. That is all it needs.",
  },
  {
    n: "02",
    title: "It reads the closet",
    body: "Every piece owned, every look documented, and the Style DNA behind them are the only context it works from.",
  },
  {
    n: "03",
    title: "A verdict, with receipts",
    body: "What it duplicates, what it pairs with, the looks it would unlock, and what it cannot tell from the photo.",
  },
];

export default function BeforeYouBuyClient({
  demos,
  itemMap,
  totalItems,
  totalLooks,
  categories,
  wornOnce,
  workhorses,
}: BeforeYouBuyClientProps) {
  const sources = [
    { label: "THE CLOSET", value: `${totalItems} pieces`, sub: `${categories} categories`, href: "/closet" },
    { label: "THE LOOKBOOK", value: `${totalLooks} looks`, sub: "Fall 2021 to Fall 2025", href: "/lookbook" },
    { label: "STYLE DNA", value: `${wornOnce} worn once`, sub: "wardrobe utility", href: "/style-dna#utility" },
  ];

  return (
    <div className="pt-28 md:pt-36 pb-16 px-[var(--page-margin)]">
      {/* Header */}
      <ScrollFadeIn>
        <div className="mb-16 max-w-2xl">
          <p className="text-[10px] tracking-[0.25em] text-text-muted mb-6">BEFORE YOU BUY</p>
          <h1 className="font-serif text-4xl md:text-6xl font-light tracking-[0.02em] leading-tight">
            Should I buy this?
          </h1>
          <p className="text-text-muted text-sm md:text-base mt-6 leading-relaxed max-w-xl">
            A second opinion on a purchase, grounded in what is already in the closet. Not a
            trend feed and not a chatbot: it answers one question with evidence from the pieces
            owned and the looks they have already made.
          </p>
        </div>
      </ScrollFadeIn>

      {/* The tool */}
      <ScrollFadeIn>
        <section className="mb-24" aria-label="Ask the closet">
          <Advisor demos={demos} items={itemMap} />
        </section>
      </ScrollFadeIn>

      {/* Why */}
      <ScrollFadeIn>
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-20" aria-labelledby="byb-why">
          <div className="md:col-span-4">
            <h2 id="byb-why" className="text-[10px] tracking-[0.2em] text-text-muted">WHY</h2>
          </div>
          <div className="md:col-span-8 max-w-xl">
            <p className="font-serif text-2xl md:text-3xl font-light leading-snug text-text">
              {wornOnce} of {totalItems} pieces in this closet have appeared in exactly one
              documented look.
            </p>
            <p className="text-text-muted text-sm leading-relaxed mt-4">
              Most of those were bought on the strength of the piece alone, not on what it would
              do next to everything else. The archive already holds the answer; the assistant
              reads it before the purchase instead of after.{" "}
              <Link href="/style-dna#utility" className="text-accent-dark hover:text-text transition-colors">
                See the wardrobe utility data &rarr;
              </Link>
            </p>
          </div>
        </section>
      </ScrollFadeIn>

      {/* How */}
      <ScrollFadeIn>
        <section className="mb-20" aria-labelledby="byb-how">
          <h2 id="byb-how" className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">HOW IT WORKS</span>
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mt-10">
            {STEPS.map((s) => (
              <li key={s.n} className="border-t border-border pt-5">
                <p className="font-serif text-3xl font-light text-accent-dark">{s.n}</p>
                <p className="font-serif text-xl font-light text-text mt-3">{s.title}</p>
                <p className="text-text-muted text-sm leading-relaxed mt-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </ScrollFadeIn>

      {/* Grounding */}
      <ScrollFadeIn>
        <section className="mb-20" aria-labelledby="byb-grounding">
          <h2 id="byb-grounding" className="section-divider">
            <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">WHAT IT IS GROUNDED IN</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {sources.map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="group border border-border p-6 hover:border-text transition-colors duration-300"
              >
                <p className="text-[9px] tracking-[0.2em] text-text-muted">{s.label}</p>
                <p className="font-serif text-2xl font-light text-text mt-3 group-hover:text-accent-dark transition-colors">
                  {s.value}
                </p>
                <p className="text-[10px] tracking-[0.1em] text-text-muted mt-1">{s.sub.toUpperCase()}</p>
              </Link>
            ))}
          </div>

          {workhorses.length > 0 && (
            <div className="mt-10">
              <p className="text-[9px] tracking-[0.2em] text-text-muted mb-4">
                THE PIECES IT LEANS ON MOST
              </p>
              <ul className="grid grid-cols-4 gap-3 max-w-xl">
                {workhorses.map((w) => (
                  <li key={w.id}>
                    <Link href={`/closet/${w.category}#${w.id}`} className="group block">
                      <div className="relative aspect-square overflow-hidden bg-bg-alt">
                        {w.image ? (
                          <img
                            src={w.image}
                            alt={w.name}
                            width={800}
                            height={800}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                        ) : null}
                      </div>
                      <p className="text-[10px] text-text-muted mt-1.5 leading-snug">
                        {w.name} &middot; {w.looks} looks
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </ScrollFadeIn>

      <ScrollFadeIn>
        <p className="text-text-muted text-sm leading-relaxed max-w-xl">
          How this was built, and why:{" "}
          <Link href="/about#story" className="text-accent-dark hover:text-text transition-colors">
            the product story &rarr;
          </Link>
        </p>
      </ScrollFadeIn>
    </div>
  );
}
