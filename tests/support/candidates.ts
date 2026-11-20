// Tuning switches for npm run mortals (D-267): a run sets them from the CANDIDATE environment variable, "now" (the
// adopted rules: the non-saber mortal band at 30 and fight readiness on), or a "+"-joined list of: b<margin> (the
// non-saber mortal band at that margin, e.g. b25; b0 is off) and noready (fight readiness off). Candidates (a) and (d)
// were not adopted and are gone (their code is in commit 7cf3a63; (a) is recorded for M6).
import { NONSABER_MORTAL } from '../../src/data/health.config';
import { READINESS } from './lifetime';

export const ADOPTED = { minMargin: 30, readiness: true } as const;

export function applyCandidate(spec: string | undefined): string {
  const parts = (spec ?? 'now').split('+').map((x) => x.trim()).filter((x) => x && x !== 'now');
  const b = parts.find((x) => /^b\d+$/.test(x));
  NONSABER_MORTAL.minMargin = b ? Number(b.slice(1)) : ADOPTED.minMargin;
  READINESS.enabled = parts.includes('noready') ? false : ADOPTED.readiness;
  const unknown = parts.filter((x) => x !== 'noready' && !/^b\d+$/.test(x));
  if (unknown.length) throw new Error(`unknown candidate ${unknown.join(', ')}`);
  return parts.length ? parts.join('+') : 'now';
}
