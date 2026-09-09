import { z } from "zod";

/**
 * Contract between the model and the site. Every item reference is a closet
 * item id; the grounding pass (ground.ts) drops anything that does not
 * exist, so the UI can only ever render pieces that are really owned.
 */

export const VERDICTS = ["buy", "maybe", "pass", "unclear"] as const;
export type Verdict = (typeof VERDICTS)[number];

/**
 * Prose lengths are guidance (in the descriptions and the system prompt), not
 * parse-fatal constraints: constrained decoding does not enforce string
 * length, and a verdict that runs a few words long is still a verdict.
 * Structural limits (enums, array sizes) are clamped in ground.ts.
 */
const ItemRef = z.object({
  itemId: z.string().describe("A closet item id from the CLOSET list, exactly as written."),
  why: z.string().describe("One sentence, editorial, specific to this piece. Name pieces, never ids."),
});

export const AdviceSchema = z.object({
  verdict: z.enum(VERDICTS).describe(
    "buy = earns its place; maybe = depends on a stated condition; pass = duplicate or off-wardrobe; unclear = cannot judge from the input."
  ),
  headline: z.string().describe("At most twelve words, no dashes. A verdict a magazine editor would write. Name pieces, never ids."),
  reasoning: z
    .string()
    .describe("Two or three sentences grounded in the closet and prior looks. Name pieces by name, never by id. No generic advice."),
  candidate: z
    .object({
      name: z.string(),
      category: z.string(),
      color: z.string(),
      formality: z.string().describe("e.g. casual, smart casual, tailored, occasion"),
    })
    .nullable()
    .describe("What the input appears to be. null when the input is not a garment or accessory."),
  duplicates: z
    .array(ItemRef)
    .max(3)
    .describe(
      "Only owned pieces that make the candidate redundant: same job, same register. Leave empty when nothing owned does; near-misses belong in pairsWith or nowhere."
    ),
  pairsWith: z.array(ItemRef).min(0).max(5).describe("Owned pieces it would genuinely work with."),
  unlocks: z
    .array(
      z.object({
        title: z.string().describe("Short editorial look title."),
        occasion: z.string().describe("One of: casual, work, dinner, evening, weekend, brunch, date, travel."),
        itemIds: z.array(z.string()).min(1).max(5).describe("Owned closet item ids that complete the look with the candidate."),
        why: z.string(),
      })
    )
    .max(3)
    .describe("New looks the candidate makes possible using owned pieces. Empty if it adds nothing."),
  gapFilled: z
    .string()
    .nullable()
    .describe("The specific wardrobe gap it fills, referencing the utility data, or null."),
  confidence: z.enum(["high", "medium", "low"]),
  caveats: z
    .array(z.string())
    .max(4)
    .describe("What cannot be judged from the input: fit, fabric, price, exact colour, etc."),
});

export type Advice = z.infer<typeof AdviceSchema>;

/** Shape returned to the browser after grounding. */
export interface AdviceResponse {
  advice: Advice;
  grounding: {
    droppedItemIds: string[];
    droppedUnlocks: number;
  };
  meta: {
    model: string;
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    estimatedCostUsd: number;
    demo?: boolean;
  };
}

export const MAX_DESCRIPTION_CHARS = 400;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // decoded bytes
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const RequestSchema = z
  .object({
    description: z.string().trim().max(MAX_DESCRIPTION_CHARS).optional(),
    image: z
      .object({
        mediaType: z.enum(ALLOWED_IMAGE_TYPES),
        data: z.string().min(16).describe("base64, no data: prefix"),
      })
      .optional(),
    demoId: z.string().max(40).optional(),
  })
  .refine((r) => Boolean(r.description) || Boolean(r.image) || Boolean(r.demoId), {
    message: "Provide a description, an image, or a demo id.",
  });

export type AdviseRequest = z.infer<typeof RequestSchema>;
