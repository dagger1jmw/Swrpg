// Mortal-wound candidates (Jared, 2026-11-20; D-267, measured only): a run sets them from the CANDIDATE environment
// variable, "now" (none), or a "+"-joined list of: a (danger sense softens a killing blow), b<margin> (a non-saber hit
// is mortal only from that margin, e.g. b30), c (fight readiness: no optional fight past a meter's capacity), d (the
// disengage "clearly stronger" rule without the profile's fatigue). Every switch is off by default.
import { PRECOG_SOFTEN } from '../../src/data/combat.config';
import { NONSABER_MORTAL } from '../../src/data/health.config';
import { PLAYER_WITHDRAWAL, READINESS } from './lifetime';

export function applyCandidate(spec: string | undefined): string {
  const parts = (spec ?? 'now').split('+').map((x) => x.trim()).filter((x) => x && x !== 'now');
  PRECOG_SOFTEN.enabled = parts.includes('a');
  const b = parts.find((x) => /^b\d+$/.test(x));
  NONSABER_MORTAL.minMargin = b ? Number(b.slice(1)) : 0;
  READINESS.enabled = parts.includes('c');
  PLAYER_WITHDRAWAL.strongerIgnoresFatigue = parts.includes('d');
  const unknown = parts.filter((x) => !['a', 'c', 'd'].includes(x) && !/^b\d+$/.test(x));
  if (unknown.length) throw new Error(`unknown candidate ${unknown.join(', ')}`);
  return parts.length ? parts.join('+') : 'now';
}
