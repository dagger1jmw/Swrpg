// Settings and usage storage (architecture §2 "Outside GameState", D-24): device-local, never in
// saves or exports. Backed by any localStorage-like store, injected for tests.
import { parseRatios, type TokenRatios } from './tokenRatio';
import { z } from 'zod';
import type { QuotaState } from './fallback';
import { DEFAULT_LIMITS, DEFAULT_MODEL_LISTS, FLASH_ROUTING } from './models.config';
import type { CallType } from './provider';
import { EMPTY_USAGE_LOG, type UsageLog } from './usage';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const SETTINGS_KEY = 'swrpg-v2:settings';
const USAGE_KEY = 'swrpg-v2:usage';
const QUOTA_KEY = 'swrpg-v2:quota';

const limitsSchema = z.object({
  rpm: z.number().int().positive().optional(),
  tpm: z.number().int().positive().optional(),
  rpd: z.number().int().positive().optional(),
});

const modelListSchema = z.array(z.string().min(1)).min(1).max(5);

export const settingsSchema = z.object({
  apiKey: z.string().nullable(),
  /** Ordered model list per call type: the first is used; later ones are daily-quota fallbacks (D-80). */
  modelLists: z.object({ intent: modelListSchema, narrative: modelListSchema, summary: modelListSchema, ooc: modelListSchema }),
  limits: z.record(z.string(), limitsSchema),
  autoRetry: z.boolean(),
  /**
   * Ship battles (m8-ship-life Part A2, D-518): narrate every battle turn through the narrator, not only the big moments and
   * the end. Off by default (each turn is then an AI call); absent in settings saved before it.
   */
  narrateEveryBattleTurn: z.boolean().optional(),
  /** Flash for the big moments (opt-1 D, D-531): on by default; absent in settings saved before it (= on). */
  flashRouting: z.boolean().optional(),
  /** The model the big moments use (default FLASH_ROUTING.model). */
  premiumModel: z.string().min(1).optional(),
});

export type Settings = z.infer<typeof settingsSchema>;

/** Settings saved before D-80 had one model per call type. */
const legacySettingsSchema = settingsSchema.omit({ modelLists: true }).extend({
  models: z.object({ intent: z.string().min(1), narrative: z.string().min(1), summary: z.string().min(1), ooc: z.string().min(1) }),
});

/** The defaults those settings were created with (D-68), to tell an untouched default from a choice. */
const D68_DEFAULTS: Record<CallType, string> = {
  narrative: 'gemini-3.6-flash',
  intent: 'gemini-3.5-flash-lite',
  summary: 'gemini-3.5-flash-lite',
  ooc: 'gemini-3.5-flash-lite',
};

/** An untouched old default becomes the new default list; a model the player chose stays first. */
export function migrateLegacyModels(models: Record<CallType, string>): Settings['modelLists'] {
  const lists = {} as Settings['modelLists'];
  for (const ct of Object.keys(DEFAULT_MODEL_LISTS) as CallType[]) {
    const old = models[ct];
    const defaults = DEFAULT_MODEL_LISTS[ct];
    lists[ct] = old === D68_DEFAULTS[ct] ? [...defaults] : [old, ...defaults.filter((m) => m !== old)];
  }
  return lists;
}

export function defaultSettings(): Settings {
  return {
    apiKey: null,
    modelLists: structuredClone(DEFAULT_MODEL_LISTS) as Settings['modelLists'],
    limits: structuredClone(DEFAULT_LIMITS) as Settings['limits'],
    autoRetry: true,
    narrateEveryBattleTurn: false,
    flashRouting: FLASH_ROUTING.on,
    premiumModel: FLASH_ROUTING.model,
  };
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
    const json: unknown = JSON.parse(raw);
    const parsed = settingsSchema.safeParse(json);
    let settings: Settings;
    if (parsed.success) settings = parsed.data;
    else {
      const legacy = legacySettingsSchema.safeParse(json);
      if (!legacy.success) return defaults;
      const { models, ...rest } = legacy.data;
      settings = { ...rest, modelLists: migrateLegacyModels(models) };
    }
    // New default models' limits appear without overwriting the player's edits.
    return { ...settings, limits: { ...defaults.limits, ...settings.limits } };
  } catch {
    return defaults;
  }
}

export function saveSettings(store: KeyValueStore, settings: Settings): void {
  store.setItem(SETTINGS_KEY, JSON.stringify(settingsSchema.parse(settings)));
}

/** The first model of a call type's list (used when no fallback is active). */
export function primaryModel(settings: Settings, callType: CallType): string {
  return settings.modelLists[callType][0] ?? DEFAULT_MODEL_LISTS[callType][0]!;
}

/** Puts `model` first in the call type's list, keeping the rest of the order as fallbacks. */
export function withPrimaryModel(settings: Settings, callType: CallType, model: string): Settings {
  const rest = settings.modelLists[callType].filter((m) => m !== model);
  return { ...settings, modelLists: { ...settings.modelLists, [callType]: [model, ...rest] } };
}

export function withModelList(settings: Settings, callType: CallType, list: readonly string[]): Settings {
  const clean = [...new Set(list.map((m) => m.trim()).filter(Boolean))];
  return clean.length ? { ...settings, modelLists: { ...settings.modelLists, [callType]: clean } } : settings;
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

const quotaSchema = z.record(z.string(), z.string());

/** Models whose daily quota was exhausted, with the Pacific date (D-80). */
export function loadQuota(store: KeyValueStore): QuotaState {
  try {
    const raw = store.getItem(QUOTA_KEY);
    const parsed = raw ? quotaSchema.safeParse(JSON.parse(raw)) : null;
    return parsed?.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function saveQuota(store: KeyValueStore, quota: QuotaState): void {
  store.setItem(QUOTA_KEY, JSON.stringify(quota));
}

const RATIOS_KEY = 'swrpg-v2:tokenRatios';

/** Calibrated characters-per-token per model (D-86); device data, outside saves like usage. */
export function loadTokenRatios(store: KeyValueStore): TokenRatios {
  try {
    return parseRatios(store.getItem(RATIOS_KEY));
  } catch {
    return {};
  }
}

export function saveTokenRatios(store: KeyValueStore, ratios: TokenRatios): void {
  store.setItem(RATIOS_KEY, JSON.stringify(ratios));
}
