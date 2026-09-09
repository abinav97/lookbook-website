import { describe, it, expect } from "vitest";
import { groundAdvice, humanizeIds } from "@/lib/advisor/ground";
import { RequestLimiter, estimateCostUsd, limitConfigFromEnv, WORST_CASE_USD_PER_REQUEST, MAX_OUTPUT_TOKENS } from "@/lib/advisor/limits";
import { RequestSchema, AdviceSchema, type Advice } from "@/lib/advisor/schema";
import { buildClosetContext, SYSTEM_PROMPT } from "@/lib/advisor/context";
import { getClosetItems } from "@/lib/data";
import { getDemos } from "@/lib/advisor/demos";

const base: Advice = {
  verdict: "buy",
  headline: "A quiet workhorse in waiting",
  reasoning: "It pairs with the jeans and the loafers.",
  candidate: { name: "Burgundy crewneck", category: "tops", color: "burgundy", formality: "smart casual" },
  duplicates: [],
  pairsWith: [
    { itemId: "item-shared-light-wash-jeans", why: "Contrast." },
    { itemId: "item-ghost-1", why: "Invented." },
    { itemId: "item-shared-light-wash-jeans", why: "Repeated." },
  ],
  unlocks: [
    { title: "Sunday lunch", occasion: "brunch", itemIds: ["item-shared-light-wash-jeans", "item-ghost-2"], why: "Easy." },
    { title: "Nothing real", occasion: "dinner", itemIds: ["item-ghost-3"], why: "All invented." },
  ],
  gapFilled: null,
  confidence: "high",
  caveats: ["Fit unknown."],
};
const known = new Set(getClosetItems().map((i) => i.id));

describe("groundAdvice", () => {
  it("removes unknown ids, dedupes, drops empty unlocks, and reports what it removed", () => {
    const g = groundAdvice(base, known);
    expect(g.advice.pairsWith.map((p) => p.itemId)).toEqual(["item-shared-light-wash-jeans"]);
    expect(g.advice.unlocks).toHaveLength(1);
    expect(g.advice.unlocks[0].itemIds).toEqual(["item-shared-light-wash-jeans"]);
    expect(g.droppedItemIds.sort()).toEqual(["item-ghost-1", "item-ghost-2", "item-ghost-3"]);
    expect(g.droppedUnlocks).toBe(1);
    expect(g.advice.confidence).toBe("medium"); // 4 drops: high -> medium
  });

  it("turns an evidence-free verdict into unclear with a caveat", () => {
    const g = groundAdvice({ ...base, pairsWith: [{ itemId: "nope", why: "" }], unlocks: [] }, known);
    expect(g.advice.verdict).toBe("unclear");
    expect(g.advice.confidence).toBe("low");
    expect(g.advice.caveats[0]).toMatch(/could not connect/);
  });

  it("replaces raw item ids in prose with piece names, everywhere prose appears", () => {
    const names = new Map([["item-shared-light-wash-jeans", "Light Wash Jeans"]]);
    expect(humanizeIds("Wear item-shared-light-wash-jeans with it.", names)).toBe("Wear Light Wash Jeans with it.");
    expect(humanizeIds("no ids here", names)).toBe("no ids here");
    const leaky: Advice = {
      ...base,
      headline: "Pairs with item-shared-light-wash-jeans",
      pairsWith: [{ itemId: "item-shared-light-wash-jeans", why: "item-shared-light-wash-jeans is the anchor." }],
      unlocks: [{ title: "Denim day", occasion: "weekend", itemIds: ["item-shared-light-wash-jeans"], why: "With item-shared-light-wash-jeans." }],
      caveats: ["Unknown item-ghost-9 stays as is."],
    };
    const g = groundAdvice(leaky, known, names);
    expect(g.advice.headline).toBe("Pairs with Light Wash Jeans");
    expect(g.advice.pairsWith[0].why).toBe("Light Wash Jeans is the anchor.");
    expect(g.advice.unlocks[0].why).toBe("With Light Wash Jeans.");
    expect(g.advice.caveats[0]).toBe("Unknown item-ghost-9 stays as is.");
  });

  it("clamps structural sizes even if the model overshoots", () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => ({ itemId: "item-shared-light-wash-jeans", why: `${i}` }));
    const g = groundAdvice(
      { ...base, duplicates: [{ itemId: "item-shared-adidas-sambas", why: "" }, { itemId: "item-shared-gold-ring", why: "" }, { itemId: "item-shared-prada-sunglasses", why: "" }, { itemId: "item-shared-black-loafers", why: "" }], pairsWith: many(9), unlocks: Array.from({ length: 5 }, () => base.unlocks[0]), caveats: ["1", "2", "3", "4", "5", "6"] },
      known
    );
    expect(g.advice.duplicates.length).toBeLessThanOrEqual(3);
    expect(g.advice.pairsWith.length).toBeLessThanOrEqual(5);
    expect(g.advice.unlocks.length).toBeLessThanOrEqual(3);
    expect(g.advice.caveats.length).toBeLessThanOrEqual(4);
  });

  it("leaves a fully grounded answer untouched", () => {
    const clean: Advice = { ...base, pairsWith: [base.pairsWith[0]], unlocks: [{ ...base.unlocks[0], itemIds: ["item-shared-light-wash-jeans"] }] };
    const g = groundAdvice(clean, known);
    expect(g.advice).toEqual(clean);
    expect(g.droppedItemIds).toEqual([]);
  });
});

describe("RequestLimiter", () => {
  const at = (iso: string) => new Date(iso);
  it("enforces the per-ip cap, then the daily cap, and resets at UTC midnight", () => {
    let now = at("2026-09-07T10:00:00Z");
    const l = new RequestLimiter({ dailyCap: 3, ipCap: 2, lifetimeCap: 100 }, () => now);
    expect(l.take("a")).toMatchObject({ allowed: true, remainingToday: 2 });
    expect(l.take("a")).toMatchObject({ allowed: true, remainingToday: 1 });
    expect(l.take("a")).toMatchObject({ allowed: false, reason: "ip" });
    expect(l.take("b")).toMatchObject({ allowed: true, remainingToday: 0 });
    const d = l.take("c");
    expect(d).toMatchObject({ allowed: false, reason: "daily" });
    if (!d.allowed) expect(d.retryAfterSeconds).toBe(14 * 3600);
    now = at("2026-09-08T00:00:01Z");
    expect(l.take("a")).toMatchObject({ allowed: true });
    expect(l.snapshot()).toMatchObject({ day: "2026-09-08", usedToday: 1, usedLifetime: 4 });
  });

  it("enforces the lifetime cap across days and honours refunds", () => {
    let now = at("2026-09-07T10:00:00Z");
    const l = new RequestLimiter({ dailyCap: 10, ipCap: 10, lifetimeCap: 2 }, () => now);
    l.take("a");
    l.take("a");
    expect(l.take("a")).toMatchObject({ allowed: false, reason: "lifetime" });
    l.refund("a");
    expect(l.take("a")).toMatchObject({ allowed: true });
    now = at("2026-09-09T10:00:00Z");
    expect(l.take("z")).toMatchObject({ allowed: false, reason: "lifetime" });
  });

  it("reads caps from the environment with safe defaults", () => {
    expect(limitConfigFromEnv({} as unknown as NodeJS.ProcessEnv)).toEqual({ dailyCap: 40, ipCap: 8, lifetimeCap: 500 });
    expect(limitConfigFromEnv({ ADVISOR_DAILY_CAP: "5", ADVISOR_IP_CAP: "x", ADVISOR_LIFETIME_CAP: "-1" } as unknown as NodeJS.ProcessEnv)).toEqual({ dailyCap: 5, ipCap: 8, lifetimeCap: 500 });
  });
});

describe("spend math", () => {
  it("worst case per request stays under the documented figure and the default caps fit the ceiling", () => {
    const worst = estimateCostUsd({ inputTokens: 8400, outputTokens: MAX_OUTPUT_TOKENS });
    expect(worst).toBeLessThanOrEqual(WORST_CASE_USD_PER_REQUEST);
    const cfg = limitConfigFromEnv({} as unknown as NodeJS.ProcessEnv);
    expect(cfg.dailyCap * WORST_CASE_USD_PER_REQUEST).toBeLessThanOrEqual(4.2);
    expect(cfg.lifetimeCap * WORST_CASE_USD_PER_REQUEST).toBeLessThan(60);
  });
  it("prices cache reads at a tenth of input", () => {
    expect(estimateCostUsd({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 })).toBe(0.5);
  });
});

describe("request and advice schemas", () => {
  it("requires at least one input and rejects unknown image types", () => {
    expect(RequestSchema.safeParse({}).success).toBe(false);
    expect(RequestSchema.safeParse({ description: "a coat" }).success).toBe(true);
    expect(RequestSchema.safeParse({ image: { mediaType: "image/gif", data: "x".repeat(20) } }).success).toBe(false);
    expect(RequestSchema.safeParse({ demoId: "burgundy-knit" }).success).toBe(true);
  });
  it("validates a well-formed advice object", () => {
    expect(AdviceSchema.safeParse(base).success).toBe(true);
    expect(AdviceSchema.safeParse({ ...base, verdict: "yes" }).success).toBe(false);
    // Long prose is guidance, not a parse failure (constrained decoding does not enforce string length).
    expect(AdviceSchema.safeParse({ ...base, headline: "x".repeat(120) }).success).toBe(true);
  });
});

describe("grounding context", () => {
  it("is deterministic, lists every item and look, and stays within the cacheable budget", () => {
    const a = buildClosetContext();
    const b = buildClosetContext();
    expect(a).toBe(b);
    for (const it of getClosetItems()) expect(a).toContain(it.id);
    expect(a).toContain("lisbon-layers");
    expect(a).toContain("WARDROBE UTILITY");
    const roughTokens = (SYSTEM_PROMPT.length + a.length) / 3.5;
    expect(roughTokens).toBeGreaterThan(512); // above the Opus 5 cache minimum
    expect(roughTokens).toBeLessThan(9000); // within the budgeted ~6.5k
  });
});

describe("demos", () => {
  it("have unique ids and, when precomputed, only cite real pieces", () => {
    const demos = getDemos();
    expect(new Set(demos.map((d) => d.id)).size).toBe(demos.length);
    for (const d of demos) {
      if (!d.result) continue;
      const g = groundAdvice(d.result.advice, known);
      expect(g.droppedItemIds).toEqual([]);
    }
  });
});

describe("timeout handling contract", () => {
  it("a client timeout is an APIError, so the route maps it to 'upstream' (502) and refunds", async () => {
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const err = new Anthropic.APIConnectionTimeoutError({ message: "Request timed out." });
    expect(err instanceof Anthropic.APIError).toBe(true);
    // Route budget must exceed the client timeout so the failure is ours, not the platform's.
    const route = await import("fs").then((fs) => fs.readFileSync("src/app/api/advise/route.ts", "utf8"));
    const client = await import("fs").then((fs) => fs.readFileSync("src/lib/advisor/client.ts", "utf8"));
    const maxDuration = Number(route.match(/maxDuration = (\d+)/)?.[1]);
    const timeoutMs = Number(client.match(/timeout: (\d[\d_]*)/)?.[1].replace(/_/g, ""));
    expect(maxDuration).toBe(60);
    expect(timeoutMs).toBeLessThan(maxDuration * 1000);
    expect(client).toMatch(/maxRetries: 0/);
  });
});
