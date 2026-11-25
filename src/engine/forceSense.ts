// Force Sense as a core Force stat (Jared, 2026-11-25; D-495; progression-numbers §22). Whatever trains a Force user's
// control of the Force trains the senses too: each point of Force Control XP also gives Force Sense XP, at a share that
// rises with how far Force Sense is behind, from 0 (as close as the Jedi routines keep it) to all of it at the gap (Sith closer). Since a lower level
// needs less XP, Force Sense is never further behind than the gap. Own training adds to it, so seers still lead. No hours
// move: nothing else gains or loses XP. Only for Force users (no career). Pure.
import { FORCE_SENSE_TRACK } from '../data/progression.config';
import { levelExact } from './curve';

/** The share of Force Control XP that also goes to Force Sense, by their levels. */
export function senseShare(sense: number, control: number, sith = false): number {
  const { free, gap } = sith ? FORCE_SENSE_TRACK.sith : FORCE_SENSE_TRACK;
  return Math.min(1, Math.max(0, (control - sense - free) / (gap - free)));
}

/** Force Sense XP that comes with a gain of Force Control XP. */
export const senseGain = (senseXp: number, controlXp: number, controlGain: number, sith = false): number => (controlGain > 0 ? senseShare(levelExact(senseXp), levelExact(controlXp), sith) * controlGain : 0);

/** Steps per stretch of the closed form's sum. */
const STEPS = 64;

/**
 * The closed form of the same rule: Force Sense XP after a life, from Force Control's and Force Sense's own XP at the end of
 * each stretch (rank phases), each grown evenly over its stretch.
 */
export function trackedSenseXp(stretches: readonly { control: number; own: number }[], sith = false): number {
  let control = 0;
  let own = 0;
  let sense = 0;
  for (const s of stretches) {
    const dc = (Math.max(control, s.control) - control) / STEPS;
    const d = (Math.max(own, s.own) - own) / STEPS;
    for (let i = 0; i < STEPS; i++) {
      control += dc;
      sense += d;
      sense += senseGain(sense, control, dc, sith);
    }
    own = Math.max(own, s.own);
  }
  return sense;
}
