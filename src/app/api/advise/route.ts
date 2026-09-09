import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { RequestSchema, MAX_IMAGE_BYTES, type AdviceResponse, type AdviseRequest } from "@/lib/advisor/schema";
import { groundAdvice } from "@/lib/advisor/ground";
import { getLimiter, WORST_CASE_USD_PER_REQUEST } from "@/lib/advisor/limits";
import { adviseWithModel, AdvisorError, MODEL } from "@/lib/advisor/client";
import { getClosetItems } from "@/lib/data";
import { getDemo } from "@/lib/advisor/demos";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const enabled = () => process.env.ADVISOR_ENABLED !== "false" && Boolean(process.env.ANTHROPIC_API_KEY);

/** Base64 of a 4 MB image is ~5.4 MB; allow JSON overhead and reject anything larger before parsing. */
const MAX_BODY_BYTES = 6 * 1024 * 1024;

/**
 * Vercel sets x-vercel-forwarded-for from the connection it terminated, so it
 * cannot be spoofed by the client. x-forwarded-for is client-supplied on the
 * first hop, so when we must fall back to it we take the LAST entry (the one
 * added by the nearest trusted proxy), never the first.
 */
function clientIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").map((s) => s.trim()).filter(Boolean).at(-1) ?? "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function loadDemoImage(imagePath: string): AdviseRequest["image"] | undefined {
  try {
    const file = path.join(process.cwd(), "public", imagePath);
    const ext = path.extname(file).slice(1).toLowerCase();
    const mediaType = (ext === "jpg" ? "image/jpeg" : `image/${ext}`) as "image/jpeg" | "image/png" | "image/webp";
    return { mediaType, data: fs.readFileSync(file).toString("base64") };
  } catch {
    return undefined;
  }
}

/** Status for the UI: is live inference available, and how much of today's cap is left. */
export async function GET() {
  const snap = getLimiter().snapshot();
  return NextResponse.json({
    enabled: enabled(),
    model: MODEL,
    remainingToday: Math.max(0, snap.dailyCap - snap.usedToday),
    dailyCap: snap.dailyCap,
  });
}

export async function POST(req: Request) {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_request", detail: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const input: AdviseRequest = parsed.data;

  // Precomputed demo: no inference, no cap consumed.
  if (input.demoId) {
    const demo = getDemo(input.demoId);
    if (!demo) return NextResponse.json({ error: "unknown_demo" }, { status: 404 });
    if (demo.result) return NextResponse.json({ ...demo.result, meta: { ...demo.result.meta, demo: true } });
    // No precomputed result yet: run it live with the demo's inputs.
    input.description = demo.description;
    input.image = demo.imagePath ? loadDemoImage(demo.imagePath) : undefined;
  }

  if (input.image) {
    const bytes = Math.floor((input.image.data.length * 3) / 4);
    if (bytes > MAX_IMAGE_BYTES) return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }

  if (!enabled()) return NextResponse.json({ error: "disabled" }, { status: 503 });

  const limiter = getLimiter();
  const ip = clientIp(req);
  const decision = limiter.take(ip);
  if (!decision.allowed) {
    return NextResponse.json(
      { error: "rate_limited", reason: decision.reason },
      { status: 429, headers: { "Retry-After": String(decision.retryAfterSeconds) } }
    );
  }

  // Only refund allowance for failures that happened before Anthropic billed the call.
  let billed = false;
  try {
    const result = await adviseWithModel(input);
    billed = true;
    const closet = getClosetItems();
    const known = new Set(closet.map((i) => i.id));
    const names = new Map(closet.map((i) => [i.id, i.name]));
    const grounded = groundAdvice(result.advice, known, names);

    // Metadata only. Never log the description or the image.
    console.info(
      JSON.stringify({
        evt: "advise",
        verdict: grounded.advice.verdict,
        confidence: grounded.advice.confidence,
        dropped: grounded.droppedItemIds.length + grounded.droppedUnlocks,
        latencyMs: result.latencyMs,
        tokens: result.usage,
        usd: result.estimatedCostUsd,
        worstCaseUsd: WORST_CASE_USD_PER_REQUEST,
        remainingToday: decision.remainingToday,
        hasImage: Boolean(input.image),
      })
    );

    const payload: AdviceResponse = {
      advice: grounded.advice,
      grounding: { droppedItemIds: grounded.droppedItemIds, droppedUnlocks: grounded.droppedUnlocks },
      meta: {
        model: MODEL,
        latencyMs: result.latencyMs,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
        cacheReadTokens: result.usage.cacheReadTokens,
        estimatedCostUsd: result.estimatedCostUsd,
      },
    };
    return NextResponse.json(payload);
  } catch (err) {
    if (err instanceof AdvisorError) {
      if (err.kind === "upstream") limiter.refund(ip);
      console.warn(JSON.stringify({ evt: "advise_error", kind: err.kind, message: err.message }));
      return NextResponse.json({ error: err.kind }, { status: err.kind === "upstream" ? 502 : 422 });
    }
    if (!billed) limiter.refund(ip);
    console.error(JSON.stringify({ evt: "advise_error", kind: "unknown", billed, message: (err as Error).message }));
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
