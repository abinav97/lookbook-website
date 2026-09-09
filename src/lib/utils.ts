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
