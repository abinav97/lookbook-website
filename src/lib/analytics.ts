"use client";

import { track as vercelTrack } from "@vercel/analytics";

/**
 * Custom event vocabulary. Keep this list small and stable: every event
 * here should map to a question we actually want answered.
 */
export const EVENTS = {
  filterApplied: "filter_applied", // { kind: "season" | "occasion", value }
  closetExpand: "closet_appears_in", // { itemId, count }
  advisorSubmitted: "advisor_submitted", // { mode: "image" | "text" | "both" | "demo" }
  advisorResult: "advisor_result", // { verdict, confidence, latencyMs, demo }
  advisorError: "advisor_error", // { kind }
  advisorFeedback: "advisor_feedback", // { useful, verdict }
} as const;

type EventName = (typeof EVENTS)[keyof typeof EVENTS];
type Props = Record<string, string | number | boolean>;

/** Fire-and-forget; never throws, never blocks rendering. */
export function track(event: EventName, props?: Props) {
  try {
    vercelTrack(event, props);
  } catch {
    /* analytics must never break the page */
  }
}
