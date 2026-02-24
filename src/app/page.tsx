import { getFeaturedOutfits, getCollections, getOutfits } from "@/lib/data";
import HomeClient from "@/components/home/HomeClient";

export default function Home() {
  const featured = getFeaturedOutfits();
  const collections = getCollections();
  const allOutfits = getOutfits();

  return (
    <HomeClient
      featured={featured}
      collections={collections}
      totalOutfits={allOutfits.length}
    />
  );
}
