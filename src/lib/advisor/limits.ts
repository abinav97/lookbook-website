/**
 * Request caps and the spend math behind them.
 *
 * Pricing (Claude Opus 5, first-party API): input $5/M, output $25/M,
 * cache read $0.50/M, cache write $6.25/M.
 *
 * Per-request token profile
 *   system prompt + closet context  ~6,500 tokens  (cached after the first call)
 *   candidate image (≤1024px)       ~1,600 tokens
 *   description + framing           ~300 tokens
 *   output incl. adaptive thinking  ≤ MAX_OUTPUT_TOKENS (2,500)
 *
 * Worst case (cache miss, max output):
 *   (6,500 + 1,600 + 300) × $5/M  = $0.042
 *   2,500 × $25/M                 = $0.0625
 *   total                         ≈ $0.105  -> WORST_CASE_USD_PER_REQUEST
 * Typical (cache hit, ~1,200 output tokens): ≈ $0.045.
 *
 * Caps (env-overridable):
 *   ADVISOR_DAILY_CAP    default 40  -> ≤ 40 × $0.105 = $4.20 per day per warm instance
 *   ADVISOR_IP_CAP       default 8   -> one visitor cannot spend more than $0.84 a day
 *   ADVISOR_LIFETIME_CAP default 500 -> ≤ $52.50 worst case per instance.
 *     Production recommendation: 350 (≤ $36.75 worst case), which stays under
 *     the agreed $40 Console spend limit even on a single long-lived instance.
 *
 * Counters live in process memory. On Vercel that means per warm instance, so
 * they are a strong brake, not an accounting system. The hard ceiling is the
 * spend limit set on the Anthropic Console workspace that owns the key; set it
 * to $40 there. ADVISOR_ENABLED=false is the kill switch.
 */

export const PRICE = { inputPerM: 5, outputPerM: 25, cacheReadPerM: 0.5, cacheWritePerM: 6.25 } as const;

export const MAX_OUTPUT_TOKENS = 2500;
export const WORST_CASE_USD_PER_REQUEST = 0.105;

export function estimateCostUsd(u: {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}): number {
  const usd =
    (u.inputTokens * PRICE.inputPerM +
      u.outputTokens * PRICE.outputPerM +
      (u.cacheReadTokens ?? 0) * PRICE.cacheReadPerM +
      (u.cacheWriteTokens ?? 0) * PRICE.cacheWritePerM) /
    1_000_000;
  return Math.round(usd * 10000) / 10000;
}

export interface LimitConfig {
  dailyCap: number;
  ipCap: number;
  lifetimeCap: number;
}

export function limitConfigFromEnv(env: NodeJS.ProcessEnv = process.env): LimitConfig {
  const num = (v: string | undefined, d: number) => {
    const n = Number(v);
    return v !== undefined && Number.isFinite(n) && n >= 0 ? n : d;
  };
  return {
    dailyCap: num(env.ADVISOR_DAILY_CAP, 40),
    ipCap: num(env.ADVISOR_IP_CAP, 8),
    lifetimeCap: num(env.ADVISOR_LIFETIME_CAP, 500),
  };
}

export type LimitDecision =
  | { allowed: true; remainingToday: number }
  | { allowed: false; reason: "daily" | "ip" | "lifetime"; retryAfterSeconds: number };

/** In-memory limiter with an injectable clock so it can be unit-tested. */
export class RequestLimiter {
  private day = "";
  private dailyCount = 0;
  private lifetimeCount = 0;
  private perIp = new Map<string, number>();

  constructor(private config: LimitConfig, private now: () => Date = () => new Date()) {}

  private roll(date: Date) {
    const day = date.toISOString().slice(0, 10);
    if (day !== this.day) {
      this.day = day;
      this.dailyCount = 0;
      this.perIp.clear();
    }
  }

  private secondsToMidnight(date: Date): number {
    const next = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1);
    return Math.max(1, Math.ceil((next - date.getTime()) / 1000));
  }

  /** Check and, if allowed, consume one request. */
  take(ip: string): LimitDecision {
    const date = this.now();
    this.roll(date);
    if (this.lifetimeCount >= this.config.lifetimeCap) {
      return { allowed: false, reason: "lifetime", retryAfterSeconds: 24 * 3600 };
    }
    if (this.dailyCount >= this.config.dailyCap) {
      return { allowed: false, reason: "daily", retryAfterSeconds: this.secondsToMidnight(date) };
    }
    const used = this.perIp.get(ip) ?? 0;
    if (used >= this.config.ipCap) {
      return { allowed: false, reason: "ip", retryAfterSeconds: this.secondsToMidnight(date) };
    }
    this.perIp.set(ip, used + 1);
    this.dailyCount += 1;
    this.lifetimeCount += 1;
    return { allowed: true, remainingToday: this.config.dailyCap - this.dailyCount };
  }

  /** Give a request back (the upstream call failed before any billing). */
  refund(ip: string) {
    const used = this.perIp.get(ip) ?? 0;
    if (used > 0) this.perIp.set(ip, used - 1);
    if (this.dailyCount > 0) this.dailyCount -= 1;
    if (this.lifetimeCount > 0) this.lifetimeCount -= 1;
  }

  snapshot() {
    this.roll(this.now());
    return {
      day: this.day,
      usedToday: this.dailyCount,
      dailyCap: this.config.dailyCap,
      usedLifetime: this.lifetimeCount,
      lifetimeCap: this.config.lifetimeCap,
    };
  }
}

// One limiter per server process (per warm instance on Vercel).
declare global {
  var __advisorLimiter: RequestLimiter | undefined;
}
export function getLimiter(): RequestLimiter {
  if (!globalThis.__advisorLimiter) globalThis.__advisorLimiter = new RequestLimiter(limitConfigFromEnv());
  return globalThis.__advisorLimiter;
}
