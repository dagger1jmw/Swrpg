// Token estimates (D-26, D-86): tokens = characters / ratio, with the ratio calibrated per model
// from Gemini's usageMetadata.promptTokenCount. Pure; the caller stores the ratios
// (localStorage, outside saves like the usage meter).
import { DEFAULT_CHARS_PER_TOKEN, RATIO_CALIBRATION } from './context.config';

export type TokenRatios = Record<string, number>;

export function ratioFor(ratios: TokenRatios, model: string): number {
  const r = ratios[model];
  return typeof r === 'number' && Number.isFinite(r) ? r : DEFAULT_CHARS_PER_TOKEN;
}

export function makeEstimator(ratio: number): (text: string) => number {
  return (text: string) => Math.ceil(text.length / ratio);
}

/** Folds one observation (characters sent, prompt tokens reported) into the model's ratio. */
export function calibrate(ratios: TokenRatios, model: string, chars: number, promptTokens: number): TokenRatios {
  if (!(chars > 0 && promptTokens > 0)) return ratios;
  const observed = chars / promptTokens;
  const prev = ratioFor(ratios, model);
  const next = Math.min(RATIO_CALIBRATION.max, Math.max(RATIO_CALIBRATION.min, prev * (1 - RATIO_CALIBRATION.weight) + observed * RATIO_CALIBRATION.weight));
  return { ...ratios, [model]: Math.round(next * 1000) / 1000 };
}

export function parseRatios(raw: string | null): TokenRatios {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw) as unknown;
    if (typeof v !== 'object' || v === null) return {};
    return Object.fromEntries(Object.entries(v).filter(([, x]) => typeof x === 'number' && Number.isFinite(x))) as TokenRatios;
  } catch {
    return {};
  }
}
