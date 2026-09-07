import type { Advice } from "./schema";

/**
 * Deterministic safeguard against unsupported claims. Every closet id the
 * model cites must exist; anything else is removed and counted. Confidence
 * is lowered when references were dropped, and an empty, ungrounded answer
 * is turned into an "unclear" verdict rather than shown as advice.
 */
export interface GroundResult {
  advice: Advice;
  droppedItemIds: string[];
  droppedUnlocks: number;
}

export function groundAdvice(raw: Advice, knownIds: ReadonlySet<string>): GroundResult {
  const dropped = new Set<string>();
  const keep = <T extends { itemId: string }>(refs: T[]) =>
    refs.filter((r) => {
      const ok = knownIds.has(r.itemId);
      if (!ok) dropped.add(r.itemId);
      return ok;
    });

  const duplicates = dedupe(keep(raw.duplicates));
  const pairsWith = dedupe(keep(raw.pairsWith));

  let droppedUnlocks = 0;
  const unlocks = raw.unlocks
    .map((u) => {
      const ids = u.itemIds.filter((id) => {
        const ok = knownIds.has(id);
        if (!ok) dropped.add(id);
        return ok;
      });
      return { ...u, itemIds: [...new Set(ids)] };
    })
    .filter((u) => {
      const ok = u.itemIds.length >= 1;
      if (!ok) droppedUnlocks += 1;
      return ok;
    });

  let confidence = raw.confidence;
  const droppedCount = dropped.size + droppedUnlocks;
  if (droppedCount >= 3 && confidence === "high") confidence = "medium";
  if (droppedCount >= 5) confidence = "low";

  let verdict = raw.verdict;
  let caveats = [...raw.caveats];
  const hasEvidence = duplicates.length + pairsWith.length + unlocks.length > 0;
  if (!hasEvidence && verdict !== "unclear" && raw.candidate) {
    verdict = "unclear";
    confidence = "low";
    caveats = [
      "The advisor could not connect this piece to anything owned; treat the verdict as unreliable.",
      ...caveats,
    ].slice(0, 4);
  }

  return {
    advice: { ...raw, verdict, duplicates, pairsWith, unlocks, confidence, caveats },
    droppedItemIds: [...dropped],
    droppedUnlocks,
  };
}

function dedupe<T extends { itemId: string }>(refs: T[]): T[] {
  const seen = new Set<string>();
  return refs.filter((r) => (seen.has(r.itemId) ? false : (seen.add(r.itemId), true)));
}
