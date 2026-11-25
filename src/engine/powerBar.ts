// The power bar in a fight (D-489, D-491). A fighter above the player's bar (Fighter.aboveBar) is never killed, put down,
// maimed, broken or worn out by them: a blow that would do it lands as a lighter wound, and they break off. The fight is
// then not won, however the rolls went.
import { INCAPACITATED_LOAD, WOUND_LOAD } from '../data/health.config';
import type { DuelState, Fighter } from './duel';
import { isDying, isIncapacitated, woundLoad, type Wound } from './wounds';

/** The heaviest bands that can leave a fighter standing, with the top of each (health §5). */
const LIGHTER = [['severe', 34], ['moderate', 19], ['minor', 9]] as const;

/** The wound as a fighter above the bar takes it, and whether the blow would have ended them: then they break off. */
export function barWound(f: Pick<Fighter, 'wounds'>, w: Wound): { wound: Wound | null; breaksOff: boolean } {
  const all = [...f.wounds, w];
  if (!isDying(all) && !isIncapacitated(all) && !w.severed) return { wound: w, breaksOff: false };
  const { severed: _limb, ...rest } = w;
  const room = INCAPACITATED_LOAD - 1 - woundLoad(f.wounds);
  for (const [severity, W] of LIGHTER) if (WOUND_LOAD[severity] <= room) return { wound: { ...rest, severity, W: Math.min(w.W, W) }, breaksOff: true };
  return { wound: null, breaksOff: true };
}

export const breakOff = (f: Fighter): Fighter => ({ ...f, dead: false, out: true, yielded: 'withdrew' });

/** A fight the player's side "won" while someone above the bar faced them is not won: they broke off. */
export function barEnd(s: DuelState): DuelState {
  if (s.end?.winner !== 'A') return s;
  const above = s.opponents.filter((o) => o.aboveBar && !o.engagedElsewhere);
  if (!above.length) return s;
  return { ...s, opponents: s.opponents.map((o) => (above.includes(o) ? breakOff(o) : o)), end: { winner: null, reason: 'brokeOff' } };
}
