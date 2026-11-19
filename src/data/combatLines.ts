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
  clarify: {
    up: ['{pc} waits for an opening. What do you do: a stance, a feint, a strike, a move?'],
    down: ['{pc} gives ground, waiting. What do you do: a stance, a feint, a strike, a move?'],
    even: ['{pc} and {opp} circle. What do you do: a stance, a feint, a strike, a move?'],
  },
  minionHit: {
    up: ["{pc}'s blade catches {opp}, who keeps fighting.", '{opp} staggers from the hit and stays in the fight.'],
    down: ["{pc}'s blade catches {opp}, who keeps fighting."],
    even: ['{opp} is hit but stays up.'],
  },
  minionDown: {
    up: ['{pc} cuts through {opp}.', "{opp} goes down under {pc}'s blade.", '{pc} drops {opp} and turns to the next.'],
    down: ['{pc} cuts through {opp}.'],
    even: ['{opp} goes down.'],
  },
  strikeAbsorbed: {
    up: ["{pc}'s blow lands, but {opp} rides it out and stays in the fight.", '{pc} scores a glancing hit; {opp} shrugs it off.'],
    down: ["{opp}'s blow lands; {pc} staggers but keeps the guard up.", '{opp} scores a glancing hit on {pc}.'],
    even: ['A glancing hit, nothing more.'],
  },
};

/**
 * Quiet lines when the opponent (or the player) fights with a ranged weapon (D-216; combat pass 2 issue 24): no blade on
 * blade, no blows from a shooter. Beats not listed here fall back to QUIET_LINES.
 */
export const QUIET_LINES_RANGED: Readonly<Partial<Record<BeatReason, Readonly<Record<LineSide, readonly string[]>>>>> = {
  trackSwing: {
    up: ['{pc} closes the distance; {opp} gives ground.', '{pc} turns the fire aside and pushes forward.', '{pc} takes the initiative under fire.'],
    down: ['{opp} pins {pc} down with fire.', '{opp} keeps up the fire; {pc} gives ground.', '{pc} is driven back as {opp} takes the initiative.'],
    even: ['Shots and deflections; neither side gives an inch.', 'They trade fire and footing, measuring each other.'],
  },
  periodic: {
    up: ['{pc} keeps the pressure on.', '{pc} holds the upper hand for now.'],
    down: ['{opp} keeps {pc} pinned under fire.', '{pc} is still looking for an opening.'],
    even: ['The firefight grinds on, evenly matched.', 'Neither side can break through.'],
  },
  strikeMissed: {
    up: ['{pc} goes for the opening, but {opp} gets clear in time.', "{pc}'s strike at {opp} finds nothing."],
    down: ['{opp} fires, but {pc} is not hit.', "{opp}'s shot does not find {pc}."],
    even: ['A shot, a strike; nothing lands.'],
  },
  minionHit: {
    up: ['{pc} catches {opp}, who keeps fighting.', '{opp} staggers from the hit and stays in the fight.'],
    down: ['{pc} catches {opp}, who keeps fighting.'],
    even: ['{opp} is hit but stays up.'],
  },
  minionDown: {
    up: ['{opp} goes down.', '{pc} drops {opp} and turns to the next.'],
    down: ['{opp} goes down.'],
    even: ['{opp} goes down.'],
  },
  strikeAbsorbed: {
    up: ['{pc} lands a glancing hit; {opp} keeps fighting.'],
    down: ["{opp}'s shot grazes {pc}, who keeps fighting.", '{opp} scores a glancing hit on {pc}.'],
    even: ['A glancing hit, nothing more.'],
  },
};

/** Fills {pc} and {opp}. */
export function fillLine(template: string, pc: string, opp: string): string {
  return template.replaceAll('{pc}', pc).replaceAll('{opp}', opp);
}
