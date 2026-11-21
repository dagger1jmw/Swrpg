// The Force XP rework trial switch (harness only; docs-v2/testing/force-xp-trial.md). Unset or "off", the game's M4
// drill ladder runs. "collect" leaves the game's rules on and records each Force session's challenge factor and each
// day's trims (the neutral-start measurement). "on" runs the prototype (src/engine/forceXpTrial.ts) with its defaults;
// a comma list of key=value overrides follows, e.g. "on,trickle=0.2,units=10". Imported for its side effect by the
// lifetime harness, so every worker of a parallel run reads the same environment.
import { FORCE_XP_TRIAL } from '../../src/engine/forceXpTrial';
import { PROFILE_COUNTS } from './precogTrial';

/** Potential by lifetime profile for the trial (precognition trial counts, plus the Orgus Din case's 7,000: a design default, lore batch 2). */
export const FORCE_XP_COUNTS: Readonly<Record<string, number>> = { ...PROFILE_COUNTS, orgus: 7_000, orgusavg: 10_000 };

export function applyForceXpTrial(spec: string | undefined): string {
  const parts = (spec ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  const mode = parts[0] ?? 'off';
  FORCE_XP_TRIAL.enabled = mode === 'on';
  FORCE_XP_TRIAL.collect = mode === 'collect';
  if (mode !== 'on' && mode !== 'collect' && mode !== 'off') throw new Error(`FORCE_XP: unknown mode "${mode}"`);
  for (const part of parts.slice(1)) {
    const [k, v] = part.split('=');
    const n = Number(v);
    if (!Number.isFinite(n)) throw new Error(`FORCE_XP: bad part "${part}"`);
    if (k === 'trickle') FORCE_XP_TRIAL.trickle = n;
    else if (k === 'units') FORCE_XP_TRIAL.unitsPerHour = n;
    else throw new Error(`FORCE_XP: unknown key "${k}"`);
  }
  return mode === 'off' ? 'off' : `force-xp ${mode}${parts.length > 1 ? ` ${parts.slice(1).join(',')}` : ''}`;
}

/** Sets the lifetime player's count from the profile seed ("orgus-s3" -> orgus). */
export function setForceXpCount(seed: string): void {
  FORCE_XP_TRIAL.counts['pc'] = FORCE_XP_COUNTS[seed.replace(/-.*$/, '')] ?? FORCE_XP_TRIAL.defaultCount;
}

export const FORCE_XP_LABEL = applyForceXpTrial(process.env['FORCE_XP']);
