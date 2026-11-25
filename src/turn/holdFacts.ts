// A hold and its escape in words (Jared, 2026-11-25; D-496): the RESOLVED block, the STATE lines, the choices, and how fast
// a duel reads. Narration only; the engine's result is in features/combat/holds.ts. Pure.
import type { Choice } from '../ai/schemas/compose';
import { DUEL_PACE } from '../data/duelPace';
import { STEP_LABELS, SUPPORT_LABELS, type EscapeStep, type HoldSetting } from '../data/holds';
import type { HoldTurn } from '../features/combat/selectors';
import { selectNpc } from '../features/npcs/selectors';
import type { GameState } from '../state/gameState';
import type { CombatDraft } from './combatTurn';

const PLACE: Readonly<Record<HoldSetting, string>> = { interior: 'aboard, with blast doors', building: 'indoors, with ordinary doors', hangar: 'a hangar', street: 'streets', open: 'open ground' };
const RESULT = { done: 'done', late: 'NOT DONE (the time ran out)', notHere: 'NOT POSSIBLE here' } as const;

/** The hold turn's ground truth: the duel and the escape, told together. */
export function describeHold(h: HoldTurn): string[] {
  const held = h.bought === null ? (h.end === 'drivenOff' ? `${h.foe} breaks off and withdraws: nobody follows` : h.end === 'foeDown' ? `${h.foe} is beaten: nobody follows` : `${h.holder} and ${h.foe} are still fighting, neither past the other, and nobody follows`) : `after ${h.exchanges} exchange${h.exchanges === 1 ? '' : 's'}, about ${Math.round(h.bought)} seconds, ${h.end === 'slipped' ? `${h.foe} breaks away from ${h.holder} and is past them, unbeaten` : h.end === 'past' ? `${h.foe} strikes ${h.holder} aside and is past them` : `${h.foe} is past ${h.holder}`}`;
  const fate = h.holderFate === 'dead' ? `${h.holder} is killed` : h.holderFate === 'captured' ? `${h.holder} is beaten and taken alive` : h.holderFate === 'left' ? `${h.holder} is beaten and left where they fell` : `${h.holder} is still standing`;
  const lines = [
    `HOLD (ground truth; the engine's, and fixed before the player said what they do): ${h.holder} holds ${h.foe} off while the player character gets away (${PLACE[h.setting]}). Tell the duel and the escape together, as they happen, from this and nothing else; the player learns the outcome through your narration.`,
    `The duel: ${held}; ${fate}. Hits, in order: ${h.hits.length ? h.hits.join('; ') : 'none'}. Never make it longer or shorter, and add no hit, wound or word of how it might have gone.`,
    `The escape, step by step: ${h.plan.steps.length ? h.plan.steps.map((s) => `${STEP_LABELS[s.step]}: ${RESULT[s.result]}${s.seconds && s.result === 'done' ? ` (${s.seconds} s)` : ''}`).join('; ') : 'the player character does nothing to get away'}.`,
  ];
  if (h.chase) lines.push(h.chase.end === 'caught' ? `On foot: ${h.foe} is faster or stronger and runs them down.` : `On foot: they get out of ${h.foe}'s sight and senses${h.chase.concealed ? ', hidden in the Force' : ''}.`);
  if (h.lose) lines.push(h.lose.lost ? `${h.foe} loses them.` : `${h.foe} finds them again.`);
  if (h.escaped) lines.push(h.door !== null ? `Outcome: they are away for now, behind the door. ${h.foe} needs about ${h.door} seconds more to come through it: the player character is not safe while they stay here. Do not bring ${h.foe} through; the engine says when.` : h.bought === null || h.plan.end === 'away' ? 'Outcome: the player character gets away.' : `Outcome: the player character loses ${h.foe} for now. It is not certain: ${h.foe} may find the trail later, and only the engine says when.`);
  else lines.push(`Outcome: ${h.foe} is on the player character. End there, at the moment before they fight: no blow falls yet.`);
  if (h.felt) lines.push(`The player character is Force-sensitive and feels ${h.holder} die, at the moment it happens in the story, wherever they are by then.`);
  return lines;
}

/** STATE while a hold is under way: no word of how it goes, since nobody has been told. */
export function holdLine(s: GameState): string | null {
  const h = s.combat.hold;
  if (!h) return null;
  const holder = selectNpc(s, h.holderId)?.name ?? h.holderId;
  const foe = selectNpc(s, h.foeId)?.name ?? h.foeId;
  return `HOLD: ${holder} has engaged ${foe} so that the player character can get away (${PLACE[h.setting]}). How long it lasts is settled and unknown to everyone: never tell or hint at how the duel goes, or end it. The player's next action is the escape.`;
}

export function pursuitLine(s: GameState): string | null {
  const list = (s.combat.pursuits ?? []).map((p) => `${selectNpc(s, p.foeId)?.name ?? p.foeId} ${p.kind === 'barred' ? 'is cutting through a closed door after the player character' : `has lost the player character and is searching${p.support && p.support !== 'lone' ? `, ${SUPPORT_LABELS[p.support]}` : ''}`}`);
  return list.length ? `PURSUED: ${list.join('; ')}. Only the engine says when they come through or find the trail.` : null;
}

const CHOICES: Readonly<Record<HoldSetting, readonly { label: string; plan: EscapeStep[] }[]>> = {
  interior: [
    { label: 'Get through the blast door, close it and wreck the console', plan: ['reachExit', 'sealDoor', 'wreckConsole'] },
    { label: 'Run for it', plan: ['reachExit', 'run', 'evasive'] },
  ],
  building: [
    { label: 'Get out and bar the door behind you', plan: ['reachExit', 'sealDoor'] },
    { label: 'Run for it', plan: ['reachExit', 'run', 'evasive'] },
  ],
  hangar: [
    { label: 'Get to a ship and take off', plan: ['reachShip', 'startShip'] },
    { label: 'Get out of the hangar and close the door behind you', plan: ['reachExit', 'sealDoor', 'wreckConsole'] },
  ],
  street: [
    { label: 'Get to a vehicle and go', plan: ['vehicle'] },
    { label: 'Run, twisting through the streets', plan: ['run', 'evasive'] },
  ],
  open: [
    { label: 'Run, never in a straight line', plan: ['run', 'evasive'] },
    { label: 'Run, hiding your presence in the Force', plan: ['run', 'evasive', 'conceal'] },
  ],
};

/** The escape choices the player always has while someone holds the foe off; typed plans are read like any other action. */
export function holdChoices(s: GameState): Choice[] {
  const h = s.combat.hold;
  if (!h || s.combat.active) return [];
  return CHOICES[h.setting].filter((c) => !c.plan.includes('conceal') || s.character.path !== 'career').map((c) => ({ label: c.label, intent: { actionType: 'other' as const, escapePlan: [...c.plan] } }));
}

/** How fast the swords of this duel read (D-496): by the weaker blade's level, since it takes two to keep the pace. */
export function duelPace(c: CombatDraft): string | null {
  const blades = c.fighters.filter((f) => f.id === 'pc' || (!f.out && !f.engagedElsewhere));
  if (blades.length < 2 || !blades.every((f) => f.weapon === 'lightsaber' || f.weapon === 'trainingSaber')) return null;
  const rec = c.narrate.filter((r) => r.kind !== 'force');
  if (!rec.length) return null;
  const level = rec.reduce((a, r) => a + Math.min(r.effA, r.effB), 0) / rec.length;
  const band = DUEL_PACE.find((b) => level >= b.from)!;
  return `Pace: ${band.text}. Narration only: the blows past the ones listed are parried, dodged or miss.`;
}
