import type { Metadata } from "next";
import AboutClient from "@/components/about/AboutClient";
import { getOutfits, getClosetItems } from "@/lib/data";
import { computeUtilityInsights } from "@/lib/insights";

export const metadata: Metadata = {
  title: "About",
  description:
    "Abi, the archive of looks and pieces behind this lookbook, and why it exists.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const outfits = getOutfits();
  const items = getClosetItems();
  const utility = computeUtilityInsights(outfits, items, { topN: 1 });
  return (
    <AboutClient
      totalLooks={outfits.length}
      totalItems={items.length}
      wornOnce={utility.wornOnce}
      workhorse={utility.workhorses[0] ? { name: utility.workhorses[0].item.name, looks: utility.workhorses[0].looks } : undefined}
    />
  );
}
