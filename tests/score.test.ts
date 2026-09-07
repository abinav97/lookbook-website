import { describe, it, expect } from "vitest";
// The scorer is plain ESM so the eval script and the tests share one implementation.
import { scoreCandidate, summarize } from "../scripts/lib/score.mjs";

const known = new Set(["a", "b", "c"]);
const advice = (over: Record<string, unknown> = {}) => ({
  advice: {
    verdict: "pass",
    headline: "Already in the closet, twice over",
    reasoning: "You own it.",
    candidate: { name: "x", category: "shoes", color: "black", formality: "smart" },
    duplicates: [{ itemId: "a", why: "" }],
    pairsWith: [{ itemId: "b", why: "" }, { itemId: "c", why: "" }],
    unlocks: [{ title: "Look", occasion: "dinner", itemIds: ["b"], why: "" }],
    gapFilled: null,
    confidence: "high",
    caveats: ["fit"],
    ...over,
  },
});

describe("scoreCandidate", () => {
  it("passes a fully compliant answer", () => {
    const r = scoreCandidate(
      { id: "t", expect: { verdict: ["pass"], duplicatesInclude: ["a"], minPairs: 2, minUnlocks: 1, candidateNotNull: true, minCaveats: 1 } },
      advice(),
      known
    );
    expect(r.passed).toBe(r.total);
  });
  it("flags wrong verdicts, ungrounded ids, missing duplicates, and long headlines", () => {
    const r = scoreCandidate(
      { id: "t", expect: { verdict: ["buy"], duplicatesInclude: ["c"] } },
      advice({ pairsWith: [{ itemId: "ghost", why: "" }], headline: "one two three four five six seven eight nine ten eleven twelve thirteen" }),
      known
    );
    const failed = r.checks.filter((c) => !c.pass).map((c) => c.name);
    expect(failed).toEqual(expect.arrayContaining(["verdict", "grounding", "duplicates", "shape.headline"]));
  });
  it("scores an error response as a single failed check", () => {
    const r = scoreCandidate({ id: "t", expect: { verdict: ["pass"] } }, { error: "disabled" }, known);
    expect(r).toMatchObject({ passed: 0, total: 1 });
  });
  it("summarizes per-check pass rates", () => {
    const s = summarize([
      scoreCandidate({ id: "1", expect: { verdict: ["pass"] } }, advice(), known),
      scoreCandidate({ id: "2", expect: { verdict: ["buy"] } }, advice(), known),
    ]);
    expect(s.candidates).toBe(2);
    expect(s.candidatesFullyPassing).toBe(1);
    expect((s.byCheck as Record<string, { pass: number; total: number }>).verdict).toEqual({ pass: 1, total: 2 });
  });
});
