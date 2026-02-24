import { getOutfits, getOutfitBySlug, getClosetItemById } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import OutfitDetailClient from "@/components/lookbook/OutfitDetailClient";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getOutfits().map((outfit) => ({ slug: outfit.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const outfit = getOutfitBySlug(slug);
  if (!outfit) return { title: "Not Found" };
  return {
    title: outfit.title,
    description: outfit.description || `${outfit.title} — a curated look.`,
  };
}

export default async function OutfitDetailPage({ params }: Props) {
  const { slug } = await params;
  const outfit = getOutfitBySlug(slug);
  if (!outfit) notFound();

  const tagItems = outfit.images.flatMap((img) =>
    img.tags.map((tag) => ({
      tag,
      item: getClosetItemById(tag.closetItemId),
    }))
  );

  return <OutfitDetailClient outfit={outfit} tagItems={tagItems} />;
}
