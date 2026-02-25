import { getFeaturedOutfits, getOutfits } from "@/lib/data";
import HomeClient from "@/components/home/HomeClient";

export default function Home() {
  const featured = getFeaturedOutfits();
  const allOutfits = getOutfits();

  return (
    <HomeClient
      featured={featured}
      totalOutfits={allOutfits.length}
    />
  );
}
