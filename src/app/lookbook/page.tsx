import { getOutfits } from "@/lib/data";
import type { Metadata } from "next";
import LookbookClient from "@/components/lookbook/LookbookClient";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Browse the full collection of curated outfits.",
};

export default function LookbookPage() {
  const outfits = getOutfits();
  return <LookbookClient outfits={outfits} />;
}
