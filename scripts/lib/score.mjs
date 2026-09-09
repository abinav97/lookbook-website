/**
 * Deterministic scoring for advisor outputs. No model involved: every check
 * is a rule over the JSON the route returned and the closet data.
 *
 *   verdict            returned verdict is in the expected set
 *   grounding          every cited item id exists in the closet
 *   duplicates         expected duplicate ids were found (or at least N found)
 *   pairs.min/include  enough grounded pairings; expected ids present anywhere
 *   unlocks.*          min/max respected; each unlock has ≥1 owned id and an occasion
 *                      from the site's vocabulary
 *   candidate.*        null / not-null as expected
 *   caveats.min        at least N caveats
 *   pairs.categories   pairings/unlocks include at least one piece of each listed category
 *   shape.*            headline ≤ 12 words, reasoning non-empty, no raw item ids in prose
 */
export const OCCASIONS = ["casual", "work", "dinner", "evening", "weekend", "brunch", "date", "travel"];

export function scoreCandidate(candidate, response, knownIds, categories = new Map()) {
  const e = candidate.expect ?? {};
  const a = response?.advice;
  const checks = [];
  const add = (name, pass, detail = "") => checks.push({ name, pass: Boolean(pass), detail });

  if (!a) {
    add("response", false, response?.error ?? "no advice");
    return { id: candidate.id, checks, passed: 0, total: checks.length };
  }
  if (e.verdict) add("verdict", e.verdict.includes(a.verdict), `${a.verdict} not in [${e.verdict}]`);

  const cited = [
    ...a.duplicates.map((d) => d.itemId),
    ...a.pairsWith.map((p) => p.itemId),
    ...a.unlocks.flatMap((u) => u.itemIds),
  ];
  const unknown = cited.filter((id) => !knownIds.has(id));
  add("grounding", unknown.length === 0, unknown.join(","));

  if (e.duplicatesInclude) {
    const found = a.duplicates.map((d) => d.itemId);
    const missing = e.duplicatesInclude.filter((id) => !found.includes(id));
    add("duplicates", missing.length === 0, `missing ${missing.join(",")}`);
  }
  if (e.minDuplicates != null) add("duplicates.min", a.duplicates.length >= e.minDuplicates, `${a.duplicates.length}`);
  if (e.minPairs != null) add("pairs.min", a.pairsWith.length >= e.minPairs, `${a.pairsWith.length} < ${e.minPairs}`);
  if (e.pairsInclude) {
    const ids = new Set([...a.pairsWith.map((p) => p.itemId), ...a.unlocks.flatMap((u) => u.itemIds)]);
    const missing = e.pairsInclude.filter((id) => !ids.has(id));
    add("pairs.include", missing.length === 0, `missing ${missing.join(",")}`);
  }
  if (e.pairsCategoriesInclude) {
    const cats = new Set([...a.pairsWith.map((p) => p.itemId), ...a.unlocks.flatMap((u) => u.itemIds)].map((id) => categories.get(id)));
    const missing = e.pairsCategoriesInclude.filter((c) => !cats.has(c));
    add("pairs.categories", missing.length === 0, `missing ${missing.join(",")}`);
  }
  if (e.minUnlocks != null) add("unlocks.min", a.unlocks.length >= e.minUnlocks, `${a.unlocks.length}`);
  if (e.maxUnlocks != null) add("unlocks.max", a.unlocks.length <= e.maxUnlocks, `${a.unlocks.length}`);
  add("unlocks.wellformed", a.unlocks.every((u) => u.itemIds.length >= 1 && u.occasion && u.title), "");
  if (a.unlocks.length > 0)
    add("unlocks.occasionVocab", a.unlocks.every((u) => OCCASIONS.includes(u.occasion)), a.unlocks.map((u) => u.occasion).join(","));
  if (e.candidateNull) add("candidate.null", a.candidate === null, "");
  if (e.candidateNotNull) add("candidate.notNull", a.candidate !== null, "");
  if (e.minCaveats != null) add("caveats.min", a.caveats.length >= e.minCaveats, `${a.caveats.length}`);
  add("shape.headline", a.headline.trim().split(/\s+/).length <= 12, a.headline);
  add("shape.reasoning", a.reasoning.trim().length > 0, "");
  const prose = [a.headline, a.reasoning, a.gapFilled ?? "", ...a.caveats, ...a.duplicates.map((d) => d.why), ...a.pairsWith.map((p) => p.why), ...a.unlocks.flatMap((u) => [u.title, u.why])].join(" ");
  add("shape.noIdsInProse", !/item-[a-z0-9-]+/i.test(prose), (prose.match(/item-[a-z0-9-]+/gi) ?? []).slice(0, 3).join(","));

  const passed = checks.filter((c) => c.pass).length;
  return { id: candidate.id, checks, passed, total: checks.length };
}

export function summarize(results) {
  const byCheck = {};
  for (const r of results) {
    for (const c of r.checks) {
      const b = (byCheck[c.name] ??= { pass: 0, total: 0 });
      b.total += 1;
      if (c.pass) b.pass += 1;
    }
  }
  const passed = results.reduce((n, r) => n + r.passed, 0);
  const total = results.reduce((n, r) => n + r.total, 0);
  const allPass = results.filter((r) => r.passed === r.total).length;
  return { candidates: results.length, candidatesFullyPassing: allPass, checksPassed: passed, checksTotal: total, byCheck };
}
