import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { AdviceSchema, type Advice, type AdviseRequest } from "./schema";
import { buildSystemBlocks } from "./context";
import { MAX_OUTPUT_TOKENS, estimateCostUsd } from "./limits";

export const MODEL = "claude-opus-5";

export interface ModelResult {
  advice: Advice;
  usage: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWriteTokens: number };
  latencyMs: number;
  estimatedCostUsd: number;
}

export class AdvisorError extends Error {
  constructor(public kind: "refusal" | "truncated" | "unparseable" | "upstream", message: string) {
    super(message);
  }
}

let client: Anthropic | null = null;
function getClient() {
  if (!client) client = new Anthropic({ timeout: 55_000, maxRetries: 1 });
  return client;
}

/** One call, one verdict. The key is read from ANTHROPIC_API_KEY on the server only. */
export async function adviseWithModel(req: AdviseRequest): Promise<ModelResult> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (req.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: req.image.mediaType, data: req.image.data },
    });
  }
  content.push({
    type: "text",
    text:
      (req.description
        ? `Candidate piece, as described by Abi: "${req.description}"`
        : "Candidate piece, shown in the photo above.") + "\n\nGive the verdict for this specific wardrobe.",
  });

  const started = Date.now();
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium", format: betaZodOutputFormat(AdviceSchema) },
      system: buildSystemBlocks(),
      messages: [{ role: "user", content }],
      // Safety classifiers can decline; re-run on Anthropic's recommended fallback server-side.
      fallbacks: "default",
      betas: ["server-side-fallback-2026-07-01"],
    });
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new AdvisorError("upstream", `${err.status ?? "?"} ${err.name}`);
    }
    throw err;
  }
  const latencyMs = Date.now() - started;

  if (response.stop_reason === "refusal") throw new AdvisorError("refusal", "The model declined this request.");
  if (response.stop_reason === "max_tokens") throw new AdvisorError("truncated", "The answer ran past the output budget.");
  const advice = response.parsed_output;
  if (!advice) throw new AdvisorError("unparseable", "The model did not return a valid verdict.");

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
    cacheWriteTokens: response.usage.cache_creation_input_tokens ?? 0,
  };
  return { advice, usage, latencyMs, estimatedCostUsd: estimateCostUsd(usage) };
}
