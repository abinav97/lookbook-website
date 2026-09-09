import type { Outfit } from "./types";

export type Season = Outfit["season"];

export const SEASONS: Season[] = ["spring", "summer", "fall", "winter"];

/** Occasion vocabulary shared by the lookbook filters and the tagging tool. */
export const OCCASIONS = [
  "casual",
  "work",
  "dinner",
  "evening",
  "weekend",
  "brunch",
  "date",
  "travel",
] as const;
