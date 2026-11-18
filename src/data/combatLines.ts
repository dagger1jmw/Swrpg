// Code-template lines for quiet beats (Jared, D-143): a quiet beat makes no AI call, so the feed shows the roll
// cards plus one short line from these templates. {pc} is the player character's name, {opp} the opponent's.
// The line picked is seeded (the duel's RNG), so a replay shows the same text. Keep them short and number-free.
import type { BeatReason } from './combat.config';

/** `up` = the swing or miss favours the player; `down` = it favours the opponent. */
export type LineSide = 'up' | 'down' | 'even';

export const QUIET_LINES: Readonly<Partial<Record<BeatReason, Readonly<Record<LineSide, readonly string[]>>>>> = {
  trackSwing: {
    up: [
      '{pc} presses forward; {opp} gives ground.',
      '{pc} finds the rhythm and drives {opp} back a step.',
      'Blade on blade, {pc} takes the initiative.',
    ],
    down: [
      '{opp} forces {pc} onto the back foot.',
      '{opp} presses hard; {pc} gives ground.',
      '{pc} parries late as {opp} takes the initiative.',
    ],
    even: ['The exchange settles; neither side gives an inch.', 'They circle, measuring each other.'],
  },
  periodic: {
    up: ['{pc} keeps the pressure on.', '{pc} holds the upper hand for now.'],
    down: ['{opp} keeps {pc} pinned in defense.', '{pc} is still looking for an opening.'],
    even: ['The duel grinds on, evenly matched.', 'Neither fighter can break through.'],
  },
  strikeMissed: {
    up: ['{pc} lunges for the opening, but {opp} recovers in time.', "{pc}'s strike is turned aside at the last instant."],
    down: ['{opp} strikes, but {pc} gets the blade up in time.', "{pc} slips {opp}'s attack by a hair."],
    even: ['A strike, a parry; nothing lands.'],
  },
  strikeAbsorbed: {
    up: ["{pc}'s blow lands, but {opp} rides it out and stays in the fight.", '{pc} scores a glancing hit; {opp} shrugs it off.'],
    down: ["{opp}'s blow lands; {pc} staggers but keeps the guard up.", '{opp} scores a glancing hit on {pc}.'],
    even: ['A glancing hit, nothing more.'],
  },
};

/** Fills {pc} and {opp}. */
export function fillLine(template: string, pc: string, opp: string): string {
  return template.replaceAll('{pc}', pc).replaceAll('{opp}', opp);
}
