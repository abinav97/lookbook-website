export type ClosetCategory =
  | "jackets"
  | "blazers"
  | "tops"
  | "shirts"
  | "pants"
  | "skirts"
  | "dresses"
  | "shoes"
  | "hats"
  | "bags"
  | "accessories"
  | "jewelry"
  | "other";

export interface OutfitTag {
  id: string;
  closetItemId: string;
  position: { x: number; y: number };
  label?: string;
}

export interface OutfitImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  tags: OutfitTag[];
}

export interface Outfit {
  id: string;
  slug: string;
  title: string;
  date: string;
  season: "spring" | "summer" | "fall" | "winter";
  occasion: string[];
  description?: string;
  images: OutfitImage[];
  colorPalette?: string[];
  featured?: boolean;
  collectionId?: string;
}

export interface ClosetItem {
  id: string;
  name: string;
  brand?: string;
  category: ClosetCategory;
  subcategory?: string;
  color?: string;
  colorHex?: string;
  images: string[];
  purchaseUrl?: string;
  notes?: string;
}

export interface Collection {
  id: string;
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  season?: string;
  outfitIds: string[];
}

export const CATEGORY_LABELS: Record<ClosetCategory, string> = {
  jackets: "Jackets",
  blazers: "Blazers",
  tops: "Tops",
  shirts: "Shirts",
  pants: "Pants",
  skirts: "Skirts",
  dresses: "Dresses",
  shoes: "Shoes",
  hats: "Hats",
  bags: "Bags",
  accessories: "Accessories",
  jewelry: "Jewelry",
  other: "Other",
};

export const CATEGORY_ORDER: ClosetCategory[] = [
  "jackets",
  "blazers",
  "tops",
  "shirts",
  "dresses",
  "skirts",
  "pants",
  "shoes",
  "bags",
  "hats",
  "accessories",
  "jewelry",
  "other",
];
