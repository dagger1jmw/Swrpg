// Model and call configuration (architecture §6, §7; D-68). All values are Settings defaults.
import type { CallType, ThinkingSetting } from './provider';

/**
 * Ordered model list per call type (D-80). The first is used; on an exhausted daily quota the
 * call moves to the next one until the Pacific midnight reset.
 * Narrative: 3.8-flash (D-79), then 3.5-flash-lite, the fastest model with its own daily quota.
 */
export const DEFAULT_MODEL_LISTS: Record<CallType, readonly string[]> = {
  // With Flash routing on (opt-1 D, D-531; the default) an ordinary story turn runs this list with Flash moved to the end, so
  // Flash-Lite is the main model and Flash is kept for the big moments (FLASH_ROUTING) and as the last fallback.
  narrative: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
  intent: ['gemini-3.5-flash-lite'],
  summary: ['gemini-3.5-flash-lite'],
  ooc: ['gemini-3.5-flash-lite'],
}

/**
 * Flash for the big moments (opt-1 D, D-531): with the setting on, an ordinary story turn uses the narrative list without this model,
 * and a turn the code marks as a big moment (src/turn/premium.ts) or a chapter summary tries it first. When its day is spent (a
 * daily-quota reply, or its requests-per-day limit on the meter) the router falls through to the rest of the list. One call per turn
 * still. Settings can turn it off or name another model.
 */
export const FLASH_ROUTING = { on: true, model: 'gemini-3.8-flash' } as const;

/** Suggested in the header picker when the Flash daily quota runs low (fastest; thinner prose, D-78). */
export const FALLBACK_NARRATIVE_MODEL = 'gemini-3.5-flash-lite';

/** Offered in the model pickers; any other model ID can be typed in Settings. */
export const KNOWN_MODELS: readonly string[] = ['gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-4-hydrogen'];

export interface ModelLimits {
  rpm?: number | undefined;
  tpm?: number | undefined;
  rpd?: number | undefined;
}

/**
 * Free-tier defaults from a third-party snapshot of the AI Studio rate-limit page (Oct 2026),
 * UNVERIFIED until Jared checks his project's limits in AI Studio (D-68). Editable in Settings.
 */
export const DEFAULT_LIMITS: Record<string, ModelLimits> = {
  'gemini-3.6-flash': { rpm: 5, tpm: 250_000, rpd: 20 },
  'gemini-3.8-flash': { rpm: 5, tpm: 250_000, rpd: 20 },
  'gemini-3.5-flash-lite': { rpm: 10, tpm: 250_000, rpd: 500 },
  'gemini-4-hydrogen': {},
};

export interface CallSettings {
  temperature: number;
  /** For narrative calls the per-level cap (pacing.config) is used instead. */
  maxOutputTokens: number;
  thinking?: ThinkingSetting;
}

export const CALL_SETTINGS: Record<CallType, CallSettings> = {
  intent: { temperature: 0.2, maxOutputTokens: 600, thinking: { level: 'low' } },
  narrative: { temperature: 0.9, maxOutputTokens: 1000, thinking: { level: 'low' } },
  summary: { temperature: 0.3, maxOutputTokens: 1500, thinking: { level: 'low' } },
  ooc: { temperature: 0.5, maxOutputTokens: 1000, thinking: { level: 'low' } },
};

/* The JSON overhead on top of the narrative cap (D-58's flat 300) is sized per turn since opt-1 E: src/turn/outputBudget.ts. */
/** Headroom for thinking tokens, which count against maxOutputTokens on Gemini (D-68 live test). */
export const THINKING_HEADROOM_TOKENS = 1024;
/** The one automatic retry after truncation gets this much more budget (D-16). */
export const TRUNCATION_RETRY_FACTOR = 1.5;
/** Composed response schemas must stay under this many characters of JSON (architecture §3). */
export const SCHEMA_SIZE_CAP_CHARS = 12_000;
/** The usage meter warns at this fraction of a limit (architecture §7). */
export const USAGE_WARN_FRACTION = 0.8;
/** A model request with no reply after this long is aborted and shown as an error with Retry. */
export const REQUEST_TIMEOUT_MS = 90_000;

/**
 * Gemini overload (D-240; combat pass 3: about 100 replies of 503 "high demand" in one session). A 5xx reply or a
 * timeout is retried on the same model up to `retries` times, waiting baseMs x factor^(n-1) (capped at maxMs) with
 * +/- jitter, then tried once on the next model in the call type's fallback order; after that the turn shows Retry.
 * The same TurnDraft is used throughout (the dice never change), and none of these count on the usage meter (D-226).
 * Design defaults: 2 s, 4 s, 8 s, about 14 s in all.
 */
/**
 * Overload retries (D-240). m8-fixes E2 (Jared, 26 Nov 2026): a busy reply (a 5xx) on the first model switches to the next model at
 * once (`busyRetries` 0) instead of after three retries; the next model, the last one tried, keeps the retries. A timeout (no
 * reply at all) keeps the old path on every model: `retries` with backoff, then the next model.
 */
export const OVERLOAD_RETRY = { retries: 3, busyRetries: 0, baseMs: 2000, factor: 2, maxMs: 10_000, jitter: 0.25, nextModel: true } as const;

/** The wait before overload retry n (1-based), with jitter from u in [0, 1). */
export function overloadDelayMs(n: number, u: number, cfg: { baseMs: number; factor: number; maxMs: number; jitter: number } = OVERLOAD_RETRY): number {
  const raw = Math.min(cfg.maxMs, cfg.baseMs * cfg.factor ** (n - 1));
  return Math.round(raw * (1 - cfg.jitter + 2 * cfg.jitter * u));
}
