import demosData from "@/data/advisor-demos.json";
import type { AdviceResponse } from "./schema";

export interface AdvisorDemo {
  id: string;
  label: string;
  description: string;
  /** Optional candidate photo, as a site-relative path under public/. */
  imagePath?: string;
  /** Precomputed by scripts/precompute-demos.mjs; null until then. */
  result: AdviceResponse | null;
  /** Hand corrections applied to the generated text, each strictly supported by the data. */
  edits?: string[];
}

export function getDemos(): AdvisorDemo[] {
  return demosData as unknown as AdvisorDemo[];
}

export function getDemo(id: string): AdvisorDemo | undefined {
  return getDemos().find((d) => d.id === id);
}

/** What the browser needs to render the demo chips (no results, no base64). */
export interface DemoSummary {
  id: string;
  label: string;
  description: string;
  imagePath?: string;
  precomputed: boolean;
}
export function getDemoSummaries(): DemoSummary[] {
  return getDemos().map((d) => ({
    id: d.id,
    label: d.label,
    description: d.description,
    imagePath: d.imagePath,
    precomputed: Boolean(d.result),
  }));
}
