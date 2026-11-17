// Model and call configuration (architecture §6, §7; D-68). All values are Settings defaults.
import type { CallType, ThinkingSetting } from './provider';

/**
 * Ordered model list per call type (D-80). The first is used; on an exhausted daily quota the
 * call moves to the next one until the Pacific midnight reset.
 * Narrative: 3.8-flash (D-79), then 3.5-flash-lite, the fastest model with its own daily quota.
 */
export const DEFAULT_MODEL_LISTS: Record<CallType, readonly string[]> = {
  narrative: ['gemini-3.8-flash', 'gemini-3.5-flash-lite'],
  intent: ['gemini-3.5-flash-lite'],
  summary: ['gemini-3.5-flash-lite'],
  ooc: ['gemini-3.5-flash-lite'],
}

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

/** JSON overhead (choices, scene, events, keys) added on top of the narrative cap (D-58). */
export const JSON_OVERHEAD_TOKENS = 300;
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
