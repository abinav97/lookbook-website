"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import Notice from "@/components/ui/Notice";
import { track, EVENTS } from "@/lib/analytics";
import { useEntrance } from "@/lib/motion";
import { fileToDataUrl, resizeImage, splitDataUrl } from "@/lib/image-client";
import type { AdviceResponse } from "@/lib/advisor/schema";
import type { DemoSummary } from "@/lib/advisor/demos";
import { MAX_DESCRIPTION_CHARS } from "@/lib/advisor/schema";

export interface ItemLite {
  name: string;
  brand?: string;
  category: string;
  image?: string;
}

interface AdvisorProps {
  demos: DemoSummary[];
  items: Record<string, ItemLite>;
}

type Phase =
  | { kind: "idle" }
  | { kind: "loading"; demo: boolean }
  | { kind: "result"; data: AdviceResponse }
  | { kind: "error"; code: string; retryAfter?: number };

const LOADING_LINES = [
  "Reading the closet.",
  "Checking every documented look.",
  "Weighing the verdict.",
];

const VERDICT_LABEL: Record<string, string> = {
  buy: "BUY",
  maybe: "MAYBE",
  pass: "PASS",
  unclear: "UNCLEAR",
};

export default function Advisor({ demos, items }: AdvisorProps) {
  const [description, setDescription] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [status, setStatus] = useState<{ enabled: boolean; remainingToday: number; dailyCap: number } | null>(null);
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/advise")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => s && setStatus(s))
      .catch(() => {});
  }, []);

  const canSubmit = (description.trim().length > 0 || imageDataUrl !== null) && phase.kind !== "loading";

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setPhase({ kind: "error", code: "not_an_image" });
      return;
    }
    try {
      const raw = await fileToDataUrl(file);
      const resized = await resizeImage(raw, 1024);
      setImageDataUrl(resized);
      setPhase({ kind: "idle" });
    } catch {
      setPhase({ kind: "error", code: "not_an_image" });
    }
  }, []);

  async function submit(body: Record<string, unknown>, demo: boolean) {
    setFeedback(null);
    setPhase({ kind: "loading", demo });
    track(EVENTS.advisorSubmitted, {
      mode: demo ? "demo" : imageDataUrl && description.trim() ? "both" : imageDataUrl ? "image" : "text",
    });
    try {
      const res = await fetch("/api/advise", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.advice) {
        const code = json.error ?? `http_${res.status}`;
        track(EVENTS.advisorError, { kind: code });
        setPhase({ kind: "error", code, retryAfter: Number(res.headers.get("Retry-After")) || undefined });
        return;
      }
      const data = json as AdviceResponse;
      track(EVENTS.advisorResult, {
        verdict: data.advice.verdict,
        confidence: data.advice.confidence,
        latencyMs: data.meta.latencyMs,
        demo: Boolean(data.meta.demo),
      });
      setPhase({ kind: "result", data });
      if (!data.meta.demo) setStatus((s) => (s ? { ...s, remainingToday: Math.max(0, s.remainingToday - 1) } : s));
      requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch {
      track(EVENTS.advisorError, { kind: "network" });
      setPhase({ kind: "error", code: "network" });
    }
  }

  function submitOwn() {
    if (!canSubmit) return;
    const body: Record<string, unknown> = {};
    if (description.trim()) body.description = description.trim();
    if (imageDataUrl) {
      const { mediaType, data } = splitDataUrl(imageDataUrl);
      body.image = { mediaType, data };
    }
    submit(body, false);
  }

  function reset() {
    setPhase({ kind: "idle" });
    setDescription("");
    setImageDataUrl(null);
    setFeedback(null);
  }

  return (
    <div>
      {/* ------------------------------------------------ input panel */}
      <div className="border border-border">
        <div className="grid grid-cols-1 md:grid-cols-12">
          {/* Photo */}
          <div className="md:col-span-5 p-6 md:p-8 md:border-r border-border">
            <p className="text-[9px] tracking-[0.25em] text-text-muted mb-4">THE CANDIDATE</p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const f = e.dataTransfer.files[0];
                if (f) handleFile(f);
              }}
              className={`relative block aspect-[4/3] border border-dashed cursor-pointer transition-colors duration-300 overflow-hidden ${
                dragging ? "border-accent bg-accent/5" : "border-border hover:border-text-muted"
              }`}
            >
              {imageDataUrl ? (
                <img src={imageDataUrl} alt="Your candidate piece" className="absolute inset-0 w-full h-full object-contain bg-bg-alt" />
              ) : (
                <span className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                  <span className="font-serif text-xl font-light text-text">Drop a photo of it here</span>
                  <span className="text-[10px] tracking-[0.15em] text-text-muted mt-2">OR TAP TO CHOOSE · JPEG, PNG, WEBP</span>
                </span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
            </label>
            {imageDataUrl && (
              <button
                type="button"
                onClick={() => setImageDataUrl(null)}
                className="mt-3 text-[10px] tracking-[0.15em] text-text-muted hover:text-text transition-colors"
              >
                REMOVE PHOTO
              </button>
            )}
          </div>

          {/* Description + actions */}
          <div className="md:col-span-7 p-6 md:p-8 flex flex-col">
            <label htmlFor="advisor-description" className="text-[9px] tracking-[0.25em] text-text-muted mb-4 block">
              OR DESCRIBE IT
            </label>
            <textarea
              id="advisor-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_DESCRIPTION_CHARS))}
              placeholder="Burgundy merino crewneck, slim fit, about $140"
              rows={3}
              className="w-full bg-transparent border-b border-border focus:border-text focus:outline-none text-base font-light text-text placeholder:text-text-muted/50 py-2 resize-none leading-relaxed"
            />
            <div className="flex justify-between text-[9px] tracking-[0.12em] text-text-muted mt-2">
              <span>A photo, a description, or both.</span>
              <span>
                {description.length}/{MAX_DESCRIPTION_CHARS}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              <button
                type="button"
                onClick={submitOwn}
                disabled={!canSubmit}
                className="px-7 py-3 text-[11px] tracking-[0.2em] bg-text text-bg hover:bg-accent-dark transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-text"
              >
                ASK THE CLOSET
              </button>
              <span className="text-[10px] tracking-[0.12em] text-text-muted">
                {status === null
                  ? " "
                  : status.enabled
                  ? `${status.remainingToday} OF ${status.dailyCap} VERDICTS LEFT TODAY`
                  : "LIVE VERDICTS ARE OFF · THE EXAMPLES STILL WORK"}
              </span>
            </div>

            {/* Demos */}
            {demos.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-[9px] tracking-[0.25em] text-text-muted mb-3">OR TRY ONE OF THESE</p>
                <ul className="flex flex-wrap gap-2">
                  {demos.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => submit({ demoId: d.id }, true)}
                        disabled={phase.kind === "loading"}
                        className="px-4 py-2 text-[10px] tracking-[0.12em] border border-border text-text-muted hover:border-text hover:text-text transition-colors duration-300 disabled:opacity-40"
                      >
                        {d.label.toUpperCase()}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-auto pt-6 text-[9px] tracking-[0.1em] text-text-muted/80 leading-relaxed">
              Photos are resized on your device, sent once to the model, and not stored by this site.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ states */}
      <div ref={resultRef} className="scroll-mt-28" aria-live="polite">
        <AnimatePresence mode="wait">
          {phase.kind === "loading" && <Loading key="loading" demo={phase.demo} />}
          {phase.kind === "error" && <ErrorState key="error" code={phase.code} retryAfter={phase.retryAfter} onReset={reset} />}
          {phase.kind === "result" && (
            <Result
              key="result"
              data={phase.data}
              items={items}
              feedback={feedback}
              onFeedback={(v) => {
                setFeedback(v);
                track(EVENTS.advisorFeedback, { useful: v === "yes", verdict: phase.data.advice.verdict });
              }}
              onReset={reset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- loading */
function Loading({ demo }: { demo: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => Math.min(n + 1, LOADING_LINES.length - 1)), 3500);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      className="mt-10 border border-border px-6 py-12 md:px-10 md:py-14 text-center max-w-xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
    >
      <p className="text-[9px] tracking-[0.25em] text-text-muted mb-4">{demo ? "EXAMPLE" : "THINKING"}</p>
      <p className="font-serif text-2xl md:text-3xl font-light text-text">{LOADING_LINES[i]}</p>
      <div className="mt-8 h-px bg-border overflow-hidden">
        <motion.div
          className="h-full bg-accent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <p className="text-[10px] tracking-[0.12em] text-text-muted mt-4">USUALLY TEN TO THIRTY SECONDS</p>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- errors */
function ErrorState({ code, retryAfter, onReset }: { code: string; retryAfter?: number; onReset: () => void }) {
  const copy: Record<string, { label: string; title: string; body: string }> = {
    disabled: {
      label: "PAUSED",
      title: "Live verdicts are switched off for now.",
      body: "The examples above still answer instantly, and the closet, looks, and Style DNA are all live.",
    },
    rate_limited: {
      label: "ALLOWANCE",
      title: "Today's verdicts are used up.",
      body: retryAfter
        ? `The allowance resets in about ${Math.max(1, Math.round(retryAfter / 3600))} hour${retryAfter > 5400 ? "s" : ""}. The examples still work.`
        : "Try again tomorrow. The examples still work.",
    },
    image_too_large: { label: "TOO LARGE", title: "That photo is too large to send.", body: "Try a smaller image, or describe the piece instead." },
    not_an_image: { label: "NOT A PHOTO", title: "That file isn't an image.", body: "JPEG, PNG or WebP, please." },
    refusal: { label: "DECLINED", title: "The advisor won't weigh in on that one.", body: "Try a different photo or a plainer description." },
    truncated: { label: "TOO LONG", title: "The answer ran out of room.", body: "Try again; a shorter description helps." },
    unparseable: { label: "NO VERDICT", title: "The advisor couldn't settle on an answer.", body: "Try again, or add a short description to the photo." },
    invalid_request: { label: "INPUT", title: "Add a photo or a description first.", body: "" },
  };
  const c = copy[code] ?? {
    label: "SOMETHING WENT WRONG",
    title: "The closet didn't answer.",
    body: "Usually a hiccup upstream. Try again in a moment.",
  };
  return (
    <motion.div className="mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <Notice label={c.label} title={c.title} tone={code === "disabled" || code === "rate_limited" ? "neutral" : "error"} action={{ label: "START AGAIN", onClick: onReset }}>
        {c.body}
      </Notice>
    </motion.div>
  );
}

/* ---------------------------------------------------------------- result */
function Result({
  data,
  items,
  feedback,
  onFeedback,
  onReset,
}: {
  data: AdviceResponse;
  items: Record<string, ItemLite>;
  feedback: "yes" | "no" | null;
  onFeedback: (v: "yes" | "no") => void;
  onReset: () => void;
}) {
  const initial = useEntrance({ opacity: 0, y: 12 });
  const { advice, meta, grounding } = data;
  const dropped = grounding.droppedItemIds.length + grounding.droppedUnlocks;
  const item = (id: string) => items[id];

  return (
    <motion.section
      className="mt-12"
      initial={initial}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-labelledby="verdict-heading"
    >
      <div className="section-divider">
        <span className="text-[10px] tracking-[0.25em] text-text-muted font-light">THE VERDICT</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 mt-8">
        {/* Verdict column */}
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-[10px] tracking-[0.2em] border border-text text-text">
              {VERDICT_LABEL[advice.verdict] ?? advice.verdict.toUpperCase()}
            </span>
            <span className="text-[9px] tracking-[0.15em] text-text-muted">{advice.confidence.toUpperCase()} CONFIDENCE</span>
          </div>
          <h2 id="verdict-heading" className="font-serif text-3xl md:text-4xl font-light leading-tight text-text mt-5">
            {advice.headline}
          </h2>
          <p className="text-text-muted text-sm md:text-base leading-relaxed mt-5">{advice.reasoning}</p>
          {advice.candidate && (
            <p className="text-[10px] tracking-[0.12em] text-text-muted mt-6">
              READ AS · {advice.candidate.name.toUpperCase()} · {advice.candidate.color.toUpperCase()} · {advice.candidate.formality.toUpperCase()}
            </p>
          )}
          {advice.gapFilled && (
            <div className="mt-8">
              <p className="text-[9px] tracking-[0.2em] text-text-muted mb-2">THE GAP IT FILLS</p>
              <p className="text-sm text-text leading-relaxed">{advice.gapFilled}</p>
            </div>
          )}
          {advice.caveats.length > 0 && (
            <div className="mt-8">
              <p className="text-[9px] tracking-[0.2em] text-text-muted mb-2">WHAT IT CANNOT TELL</p>
              <ul className="flex flex-col gap-1.5">
                {advice.caveats.map((c, i) => (
                  <li key={i} className="text-sm text-text-muted leading-relaxed">
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Evidence column */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          {advice.duplicates.length > 0 && (
            <EvidenceGroup label="ALREADY OWNED" refs={advice.duplicates} item={item} />
          )}
          {advice.pairsWith.length > 0 && <EvidenceGroup label="PAIRS WITH" refs={advice.pairsWith} item={item} />}
          {advice.unlocks.length > 0 && (
            <div>
              <p className="text-[9px] tracking-[0.2em] text-text-muted mb-4">IT WOULD UNLOCK</p>
              <ul className="flex flex-col gap-6">
                {advice.unlocks.map((u, i) => (
                  <li key={i} className="border-t border-border pt-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="font-serif text-xl font-light text-text">{u.title}</p>
                      <span className="text-[9px] tracking-[0.15em] text-text-muted shrink-0">{u.occasion.toUpperCase()}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <div className="w-14 h-14 border border-dashed border-border flex items-center justify-center text-[8px] tracking-[0.1em] text-text-muted text-center leading-tight px-1">
                        THE
                        <br />
                        CANDIDATE
                      </div>
                      {u.itemIds.map((id) => (
                        <ItemThumb key={id} id={id} item={item(id)} />
                      ))}
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed mt-3">{u.why}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {advice.duplicates.length + advice.pairsWith.length + advice.unlocks.length === 0 && (
            <p className="text-sm text-text-muted leading-relaxed">Nothing in the closet could be tied to this piece.</p>
          )}
        </div>
      </div>

      {/* Footer: provenance, feedback, reset */}
      <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <p className="text-[9px] tracking-[0.12em] text-text-muted leading-relaxed">
          {meta.demo ? "PRECOMPUTED EXAMPLE · " : ""}
          {meta.model.toUpperCase()} · {(meta.latencyMs / 1000).toFixed(1)}S · ABOUT ${meta.estimatedCostUsd.toFixed(3)}
          {dropped > 0 && (
            <>
              {" "}
              · {dropped} UNSUPPORTED REFERENCE{dropped === 1 ? "" : "S"} REMOVED
            </>
          )}
        </p>
        <div className="flex items-center gap-5 text-[10px] tracking-[0.15em]">
          <span className="text-text-muted">USEFUL?</span>
          {(["yes", "no"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onFeedback(v)}
              aria-pressed={feedback === v}
              className={`border-b pb-0.5 transition-colors ${
                feedback === v ? "text-text border-text" : "text-text-muted border-transparent hover:text-text"
              }`}
            >
              {v.toUpperCase()}
            </button>
          ))}
          <button type="button" onClick={onReset} className="ml-2 text-accent-dark hover:text-text transition-colors">
            ANOTHER PIECE &rarr;
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function EvidenceGroup({
  label,
  refs,
  item,
}: {
  label: string;
  refs: { itemId: string; why: string }[];
  item: (id: string) => ItemLite | undefined;
}) {
  return (
    <div>
      <p className="text-[9px] tracking-[0.2em] text-text-muted mb-4">{label}</p>
      <ul className="flex flex-col gap-4">
        {refs.map((r) => {
          const it = item(r.itemId);
          if (!it) return null;
          return (
            <li key={r.itemId} className="flex gap-4 items-start">
              <ItemThumb id={r.itemId} item={it} />
              <div className="min-w-0">
                <Link
                  href={`/closet/${it.category}#${r.itemId}`}
                  className="text-[12px] font-medium text-text hover:text-accent-dark transition-colors"
                >
                  {it.name}
                </Link>
                {it.brand && <p className="text-[10px] tracking-[0.08em] text-text-muted">{it.brand}</p>}
                <p className="text-sm text-text-muted leading-relaxed mt-1">{r.why}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ItemThumb({ id, item }: { id: string; item?: ItemLite }) {
  if (!item) return null;
  return (
    <Link href={`/closet/${item.category}#${id}`} className="block w-14 h-14 shrink-0 relative overflow-hidden bg-bg-alt" title={item.name}>
      {item.image ? (
        <img src={item.image} alt={item.name} width={56} height={56} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
    </Link>
  );
}
