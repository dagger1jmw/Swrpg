// Automatic model fallback on an exhausted daily quota (D-80). Each call type has an ordered model
// list in Settings. A model counts as exhausted for the rest of the Pacific day when the API
// answered with a daily-quota 429, or when the usage meter shows its requests-per-day limit
// reached. The router picks the first model in the list that is not exhausted; after the Pacific
// midnight reset the first model is used again. Per-minute 429s never cause a fallback. One API
// key only. Pure functions plus a small stateful router; wall-clock time is injected.
import type { ModelLimits } from './models.config';
import { AiError, type CallType } from './provider';
import { pacificDate, summarizeUsage, type UsageLog } from './usage';

/** model -> Pacific date (YYYY-MM-DD) on which its daily quota was exhausted. */
export type QuotaState = Record<string, string>;

export type SkipReason = 'dailyQuota' | 'rpdReached';

export interface ModelChoice {
  model: string;
  /** The first model in the list (the one used when nothing is exhausted). */
  primary: string;
  skipped: { model: string; reason: SkipReason }[];
  /** Every model in the list is exhausted today; the primary is used anyway (the API decides). */
  allExhausted: boolean;
}

export function isExhaustedToday(quota: QuotaState, model: string, nowMs: number): boolean {
  return quota[model] === pacificDate(nowMs);
}

export function chooseModel(
  list: readonly string[],
  quota: QuotaState,
  usage: UsageLog,
  limits: Readonly<Record<string, ModelLimits>>,
  nowMs: number,
): ModelChoice {
  const primary = list[0];
  if (primary === undefined) throw new Error('chooseModel: empty model list');
  const skipped: ModelChoice['skipped'] = [];
  for (const model of list) {
    if (isExhaustedToday(quota, model, nowMs)) {
      skipped.push({ model, reason: 'dailyQuota' });
      continue;
    }
    const rpd = limits[model]?.rpd;
    if (rpd !== undefined && summarizeUsage(usage, model, limits[model] ?? {}, nowMs).requestsToday >= rpd) {
      skipped.push({ model, reason: 'rpdReached' });
      continue;
    }
    return { model, primary, skipped, allExhausted: false };
  }
  return { model: primary, primary, skipped, allExhausted: true };
}

/** Marks the model exhausted for today and drops entries from earlier days. */
export function markExhausted(quota: QuotaState, model: string, nowMs: number): QuotaState {
  const today = pacificDate(nowMs);
  const kept = Object.fromEntries(Object.entries(quota).filter(([, d]) => d === today));
  return { ...kept, [model]: today };
}

/** A 429 the API says is a per-day quota. Per-minute and unidentified 429s are not. */
export function isDailyQuotaError(e: unknown): boolean {
  return e instanceof AiError && e.kind === 'rateLimit' && e.quotaScope === 'day';
}

/** "gemini-3.8-flash" -> "Flash", "gemini-3.5-flash-lite" -> "Flash-Lite"; other IDs unchanged. */
export function friendlyModelName(model: string): string {
  if (/flash-lite/i.test(model)) return 'Flash-Lite';
  if (/flash/i.test(model)) return 'Flash';
  return model;
}

const CALL_LABELS: Record<CallType, string> = { narrative: '', intent: 'Intent: ', summary: 'Summary: ', ooc: 'OOC: ' };

/** Header notices, one per call type that is currently on a fallback model. */
export function fallbackNotices(
  lists: Readonly<Record<CallType, readonly string[]>>,
  quota: QuotaState,
  usage: UsageLog,
  limits: Readonly<Record<string, ModelLimits>>,
  nowMs: number,
): string[] {
  const out: string[] = [];
  for (const callType of Object.keys(lists) as CallType[]) {
    const list = lists[callType];
    if (!list.length) continue;
    const c = chooseModel(list, quota, usage, limits, nowMs);
    const prefix = CALL_LABELS[callType];
    if (c.allExhausted && list.length > 0 && c.skipped.length > 0) {
      out.push(`${prefix}${friendlyModelName(c.primary)} daily limit reached and no fallback left; requests may fail until reset`);
    } else if (c.model !== c.primary) {
      out.push(`${prefix}${friendlyModelName(c.primary)} daily limit reached; using ${friendlyModelName(c.model)} until reset`);
    }
  }
  return out;
}

export interface ModelRouter {
  choose(callType: CallType): ModelChoice;
  markExhausted(model: string): void;
  notices(): string[];
}

export interface RouterDeps {
  getLists(): Readonly<Record<CallType, readonly string[]>>;
  getLimits(): Readonly<Record<string, ModelLimits>>;
  getUsage(): UsageLog;
  getQuota(): QuotaState;
  setQuota(q: QuotaState): void;
  now(): number;
}

export function createModelRouter(d: RouterDeps): ModelRouter {
  return {
    choose: (callType) => chooseModel(d.getLists()[callType], d.getQuota(), d.getUsage(), d.getLimits(), d.now()),
    markExhausted: (model) => d.setQuota(markExhausted(d.getQuota(), model, d.now())),
    notices: () => fallbackNotices(d.getLists(), d.getQuota(), d.getUsage(), d.getLimits(), d.now()),
  };
}
