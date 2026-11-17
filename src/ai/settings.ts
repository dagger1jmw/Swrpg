// Settings and usage storage (architecture §2 "Outside GameState", D-24): device-local, never in
// saves or exports. Backed by any localStorage-like store, injected for tests.
import { z } from 'zod';
import { DEFAULT_LIMITS, DEFAULT_MODELS } from './models.config';
import type { CallType } from './provider';
import { EMPTY_USAGE_LOG, type UsageLog } from './usage';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SETTINGS_KEY = 'swrpg-v2:settings';
const USAGE_KEY = 'swrpg-v2:usage';

const limitsSchema = z.object({
  rpm: z.number().int().positive().optional(),
  tpm: z.number().int().positive().optional(),
  rpd: z.number().int().positive().optional(),
});

export const settingsSchema = z.object({
  apiKey: z.string().nullable(),
  models: z.object({ intent: z.string().min(1), narrative: z.string().min(1), summary: z.string().min(1), ooc: z.string().min(1) }),
  limits: z.record(z.string(), limitsSchema),
  autoRetry: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

export function defaultSettings(): Settings {
  return { apiKey: null, models: { ...DEFAULT_MODELS }, limits: structuredClone(DEFAULT_LIMITS) as Settings['limits'], autoRetry: true };
}

/** Trims and checks an API key; returns an error message or the cleaned key. */
export function validateApiKey(input: string): { key: string } | { error: string } {
  const key = input.trim();
  if (!key) return { error: 'Enter a Gemini API key.' };
  if (/\s/.test(key)) return { error: 'The key must not contain spaces.' };
  if (key.length < 20) return { error: 'That key looks too short.' };
  return { key };
}

export function loadSettings(store: KeyValueStore): Settings {
  const defaults = defaultSettings();
  try {
    const raw = store.getItem(SETTINGS_KEY);
    if (!raw) return defaults;
    const parsed = settingsSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return defaults;
    // New default models' limits appear without overwriting the player's edits.
    return { ...parsed.data, limits: { ...defaults.limits, ...parsed.data.limits } };
  } catch {
    return defaults;
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  store.setItem(SETTINGS_KEY, JSON.stringify(settingsSchema.parse(settings)));
}

export function withModel(settings: Settings, callType: CallType, model: string): Settings {
  return { ...settings, models: { ...settings.models, [callType]: model } };
}

const usageLogSchema = z.object({
  days: z.record(z.string(), z.object({ date: z.string(), requests: z.number(), inputTokens: z.number() })),
  recent: z.array(z.object({ model: z.string(), at: z.number(), inputTokens: z.number() })),
});

export function loadUsage(store: KeyValueStore): UsageLog {
  try {
    const raw = store.getItem(USAGE_KEY);
    const parsed = raw ? usageLogSchema.safeParse(JSON.parse(raw)) : null;
    return parsed?.success ? parsed.data : EMPTY_USAGE_LOG;
  } catch {
    return EMPTY_USAGE_LOG;
  }
}

export function saveUsage(store: KeyValueStore, log: UsageLog): void {
  store.setItem(USAGE_KEY, JSON.stringify(log));
}
