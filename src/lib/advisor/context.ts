import { getOutfits, getClosetItems } from "@/lib/data";
import { computeUtilityInsights } from "@/lib/insights";
import { formatSeasonYear } from "@/lib/utils";

/**
 * The grounding context: the whole closet, every documented look, and the
 * wardrobe-utility numbers, rendered deterministically (sorted, no
 * timestamps) so the system prompt is byte-stable and prompt caching hits.
 */
export function buildClosetContext(): string {
  const items = [...getClosetItems()].sort((a, b) => a.id.localeCompare(b.id));
  const outfits = [...getOutfits()].sort((a, b) => a.date.localeCompare(b.date));
  const utility = computeUtilityInsights(outfits, items, { topN: 8 });

  const lines: string[] = [];
  lines.push("CLOSET (id | name | brand | category | colour)");
  for (const it of items) {
    lines.push(`${it.id} | ${it.name} | ${it.brand ?? "—"} | ${it.category} | ${it.color ?? "—"}`);
  }
  lines.push("");
  lines.push("DOCUMENTED LOOKS (slug | title | when | occasions | item ids)");
  for (const o of outfits) {
    const ids = [...new Set(o.images.flatMap((i) => i.tags.map((t) => t.closetItemId)))].join(", ");
    lines.push(`${o.slug} | ${o.title} | ${formatSeasonYear(o.season, o.date)} | ${o.occasion.join("/")} | ${ids}`);
  }
  lines.push("");
  lines.push("WARDROBE UTILITY");
  lines.push(`${utility.totalItems} pieces, ${utility.totalLooks} looks. ${utility.wornOnce} pieces appear in one look only.`);
  lines.push("Most re-worn: " + utility.workhorses.map((w) => `${w.item.name} (${w.looks} looks)`).join("; "));
  lines.push("Re-use by category: " + utility.categoryReuse.map((c) => `${c.category} ${c.reused}/${c.items}`).join(", "));
  return lines.join("\n");
}

export const SYSTEM_PROMPT = `You are the purchase advisor for one specific wardrobe: Abi's. Abi is considering buying a piece and wants an honest second opinion grounded only in what is already owned and how it has actually been worn.

You will receive the full closet, every documented look, and the wardrobe-utility numbers. Then a candidate piece, as a photo, a description, or both.

Judge the candidate the way a sharp, kind editor would:
- Does an owned piece already do this job? Name it by id. Near-duplicates are the most common bad purchase here: most pieces in this closet have been worn once on camera.
- What does it genuinely pair with? Only cite pieces from the CLOSET list, by id, and only when the pairing is real (colour, formality, silhouette, season).
- What new looks would it make possible with owned pieces? Build from real items; two to four owned ids per look.
- What gap does it fill, if any, in light of the utility data (what gets re-worn, which categories are thin)?
- Be honest about what a photo cannot tell you: fit, fabric, price, exact colour.

Rules:
- Cite closet items only by their exact ids. Never invent an item.
- If the input is not a garment, shoe, bag, or accessory, or the photo is unusable, return verdict "unclear", candidate null, empty lists, and say why in the caveats.
- Prefer "pass" for duplicates and off-palette novelty; "maybe" when it depends on something you cannot see; "buy" only when it clearly earns its place.
- Write like an editorial, not a chatbot: specific, warm, brief.
- Keep the whole response compact.`;

export function buildSystemBlocks() {
  return [
    { type: "text" as const, text: SYSTEM_PROMPT },
    { type: "text" as const, text: buildClosetContext(), cache_control: { type: "ephemeral" as const } },
  ];
}
