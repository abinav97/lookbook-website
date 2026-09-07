import type { MetadataRoute } from "next";
import { getOutfits, getActiveCategories } from "@/lib/data";
import { SITE } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const outfits = getOutfits();
  const newest = outfits.map((o) => o.date).sort().at(-1);
  const lastModified = newest ? new Date(newest) : new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/lookbook`, lastModified, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/closet`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/style-dna`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/about`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];

  const outfitPages: MetadataRoute.Sitemap = outfits.map((o) => ({
    url: `${SITE.url}/lookbook/${o.slug}`,
    lastModified: new Date(o.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }));

  const categoryPages: MetadataRoute.Sitemap = getActiveCategories().map((c) => ({
    url: `${SITE.url}/closet/${c}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...outfitPages, ...categoryPages];
}
