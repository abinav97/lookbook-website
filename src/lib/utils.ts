export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function formatSeasonYear(season: string, dateString: string): string {
  const year = new Date(dateString).getFullYear();
  return `${season.charAt(0).toUpperCase() + season.slice(1)} ${year}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSeasonEmoji(season: string): string {
  const map: Record<string, string> = {
    spring: "\u{1F338}",
    summer: "\u{2600}\u{FE0F}",
    fall: "\u{1F342}",
    winter: "\u{2744}\u{FE0F}",
  };
  return map[season] || "";
}
