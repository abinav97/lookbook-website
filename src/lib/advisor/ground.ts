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

export function groundAdvice(
  raw: Advice,
  knownIds: ReadonlySet<string>,
  names: ReadonlyMap<string, string> = new Map()
): GroundResult {
  const dropped = new Set<string>();
  const keep = <T extends { itemId: string }>(refs: T[]) =>
    refs.filter((r) => {
      const ok = knownIds.has(r.itemId);
      if (!ok) dropped.add(r.itemId);
      return ok;
    });

  const duplicates = dedupe(keep(raw.duplicates)).slice(0, 3);
  const pairsWith = dedupe(keep(raw.pairsWith)).slice(0, 5);

  let droppedUnlocks = 0;
  const unlocks = raw.unlocks
    .map((u) => {
      const ids = u.itemIds.filter((id) => {
        const ok = knownIds.has(id);
        if (!ok) dropped.add(id);
        return ok;
      });
      return { ...u, itemIds: [...new Set(ids)].slice(0, 5) };
    })
    .filter((u) => {
      const ok = u.itemIds.length >= 1;
      if (!ok) droppedUnlocks += 1;
      return ok;
    })
    .slice(0, 3);

  let confidence = raw.confidence;
  const droppedCount = dropped.size + droppedUnlocks;
  if (droppedCount >= 3 && confidence === "high") confidence = "medium";
  if (droppedCount >= 5) confidence = "low";

  let verdict = raw.verdict;
  let caveats = raw.caveats.slice(0, 4);
  const hasEvidence = duplicates.length + pairsWith.length + unlocks.length > 0;
  if (!hasEvidence && verdict !== "unclear" && raw.candidate) {
    verdict = "unclear";
    confidence = "low";
    caveats = [
      "The advisor could not connect this piece to anything owned; treat the verdict as unreliable.",
      ...caveats,
    ].slice(0, 4);
  }

  // Prose must never show raw ids. Replace any known id with the piece's name.
  const say = (text: string) => humanizeIds(text, names);
  return {
    advice: {
      ...raw,
      verdict,
      headline: say(raw.headline),
      reasoning: say(raw.reasoning),
      gapFilled: raw.gapFilled === null ? null : say(raw.gapFilled),
      duplicates: duplicates.map((d) => ({ ...d, why: say(d.why) })),
      pairsWith: pairsWith.map((p) => ({ ...p, why: say(p.why) })),
      unlocks: unlocks.map((u) => ({ ...u, title: say(u.title), why: say(u.why) })),
      confidence,
      caveats: caveats.map(say),
    },
    droppedItemIds: [...dropped],
    droppedUnlocks,
  };
}

/** "item-shared-black-loafers" -> "Black Leather Horsebit Loafers" wherever an id appears in prose. */
export function humanizeIds(text: string, names: ReadonlyMap<string, string>): string {
  if (names.size === 0 || !text.includes("item-")) return text;
  return text.replace(/item-[a-z0-9-]+/gi, (id) => names.get(id) ?? id);
}

function dedupe<T extends { itemId: string }>(refs: T[]): T[] {
  const seen = new Set<string>();
  return refs.filter((r) => (seen.has(r.itemId) ? false : (seen.add(r.itemId), true)));
}
