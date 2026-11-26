// Captivity (Jared, 2026-11-24; D-471): one record for a prisoner of a fight or a blockade. The engine alone ends it: an
// escape the player attempts (a check against the captors' security), a rescue by allies (a daily chance), a real fight won
// while held, or the limit (released, ransomed or transferred). The narrator only tells it.
import { z } from 'zod';
import {
  BLOCKADE_SECURITY,
  CAPTIVITY_LIMIT_DAYS,
  CREW_ROLES,
  ESCAPE,
  ESCAPE_SKILLS,
  FIGHT_SECURITY,
  LIMIT_WEIGHTS,
  RANSOM_CREDITS,
  RESCUE,
  RESCUING_FACTIONS,
  SECURITY_RANGE,
  TRANSFER,
} from '../../data/captivity.config';
import type { BlockadeState } from '../../data/blockades';
import { isSkillId } from '../../data/skills';
import { gradeMargin, type CheckCard } from '../../engine/rolls';
import { nextFloat, type RngState } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import { selectCharacter } from '../character/selectors';
import { selectNpcs } from '../npcs/selectors';
import { selectPerformance } from '../progression/selectors';

export const CAPTIVITY_ENDS = ['escaped', 'rescued', 'foughtFree', 'released', 'ransomed'] as const;
export type CaptivityEnd = (typeof CAPTIVITY_ENDS)[number];

export const captivitySchema = z.object({
  source: z.enum(['fight', 'blockade', 'battle', 'customs']),
  /** The fight or the blockade. */
  sourceId: z.string(),
  group: z.string(),
  kind: z.string().nullable(),
  names: z.array(z.string()),
  weapon: z.string().nullable(),
  /** The captors' security, as a check rating. */
  security: z.number().min(0),
  /** The last fight when the character was taken: only a later one can free them. */
  sinceFight: z.string().nullable(),
  /** When the character was taken (absolute seconds): a run's hours may still be passing. */
  atAbs: z.number(),
  /** The present term's start day (a transfer starts a new one). */
  termDay: z.number().int(),
  transfers: z.number().int().min(0),
  /** Extra security from failed attempts, and the first day another may be tried. */
  penalty: z.number().min(0),
  nextTryDay: z.number().int(),
  rescueDay: z.number().int(),
});
export type Captivity = z.infer<typeof captivitySchema>;

export const captivityNewsSchema = z.object({ text: z.string().max(300), toldTurn: z.number().int().nullable() });
export type CaptivityNews = z.infer<typeof captivityNewsSchema>;

const clamp = (x: number): number => Math.min(SECURITY_RANGE.max, Math.max(SECURITY_RANGE.min, x));
/** A blockade's picket strength and alertness carry over to the cells. */
export const blockadeSecurity = (s: BlockadeState): number => clamp(BLOCKADE_SECURITY.base + (s.strength - 3 + (s.alertness - 3)) * BLOCKADE_SECURITY.perPoint);
export const fightSecurity = (standing: number, named: boolean): number => clamp(FIGHT_SECURITY.base + Math.min(FIGHT_SECURITY.maxCaptors, standing) * FIGHT_SECURITY.perCaptor + (named ? FIGHT_SECURITY.named : 0));

export function beginCaptivity(a: Pick<Captivity, 'source' | 'sourceId' | 'group' | 'kind' | 'names' | 'weapon' | 'security' | 'atAbs' | 'sinceFight'>): Captivity {
  const day = Math.floor(a.atAbs / 86_400);
  return { ...a, termDay: day, transfers: 0, penalty: 0, nextTryDay: day, rescueDay: day };
}

/** The rating an escape has to beat now. */
export const escapeRating = (c: Captivity): number => clamp(c.security + c.penalty);
/** What the player tries with: the named skill when it is one of the ways out, else their best. */
export function escapeSkill(s: GameState, named: string | undefined): string {
  if (named && ESCAPE_SKILLS.includes(named)) return named;
  return [...ESCAPE_SKILLS].filter(isSkillId).sort((a, b) => selectPerformance(s, b) - selectPerformance(s, a))[0]!;
}

export interface EscapeOutcome {
  free: boolean;
  /** A decisive escape takes the impounded ship too. */
  withShip: boolean;
  captivity: Captivity;
}
export function applyEscape(c: Captivity, card: Pick<CheckCard, 'success' | 'margin'>, day: number): EscapeOutcome {
  if (card.success) return { free: true, withShip: card.margin >= ESCAPE.shipMargin, captivity: c };
  const grade = gradeMargin(card.margin);
  const add = grade === 'bad failure' ? ESCAPE.badPenalty : grade === 'clear failure' ? ESCAPE.clearPenalty : 0;
  const wait = grade === 'bad failure' ? ESCAPE.badWaitDays : ESCAPE.perDays;
  return { free: false, withShip: false, captivity: { ...c, penalty: Math.min(ESCAPE.maxPenalty, c.penalty + add), nextTryDay: day + wait } };
}

/** The daily chance that allies come: the player's side, their master, and the friends they have (more for a crew). */
export function rescueChance(s: GameState, c: Captivity): number {
  const ch = selectCharacter(s);
  const side = ch.start?.faction ?? (ch.path === 'jedi' ? 'jediOrder' : ch.path === 'sith' ? 'sithEmpire' : '');
  let p = RESCUING_FACTIONS.includes(side) ? RESCUE.faction : 0;
  if (s.ranks.masterId && s.npcs.byId[s.ranks.masterId]?.status === 'active') p += RESCUE.master;
  const friends = selectNpcs(s)
    .filter((n) => n.status === 'active' && n.id !== s.ranks.masterId && !c.names.includes(n.name))
    .map((n) => ({ n, v: s.relationships.byNpcId[n.id]?.value ?? 0 }))
    .filter((x) => x.v >= RESCUE.friendFrom)
    .sort((a, b) => b.v - a.v)
    .slice(0, RESCUE.maxFriends);
  for (const { n, v } of friends) p += (v >= RESCUE.closeFrom ? RESCUE.closeFriend : RESCUE.friend) * (CREW_ROLES.includes(n.role) ? RESCUE.crewFactor : 1);
  const factor = Math.min(RESCUE.maxFactor, Math.max(RESCUE.minFactor, 1 + (RESCUE.securityAt - escapeRating(c)) / 50));
  return Math.min(RESCUE.dailyCap, p * factor);
}

export type DayResult = { captivity: Captivity; rng: RngState } | { ended: CaptivityEnd; rng: RngState } | { transferred: Captivity; rng: RngState };

/** One day held: allies may come; at the limit the captors decide. */
export function captivityDay(s: GameState, c: Captivity, day: number, rng: RngState): DayResult {
  let r = rng;
  let u: number;
  const chance = rescueChance(s, c);
  if (chance > 0) {
    [u, r] = nextFloat(r);
    if (u < chance) return { ended: 'rescued', rng: r };
  }
  if (day - c.termDay < CAPTIVITY_LIMIT_DAYS) return { captivity: { ...c, rescueDay: day }, rng: r };
  const canMove = c.transfers < TRANSFER.max;
  const total = LIMIT_WEIGHTS.released + LIMIT_WEIGHTS.ransomed + (canMove ? LIMIT_WEIGHTS.transferred : 0);
  [u, r] = nextFloat(r);
  const x = u * total;
  if (x < LIMIT_WEIGHTS.released) return { ended: 'released', rng: r };
  if (x < LIMIT_WEIGHTS.released + LIMIT_WEIGHTS.ransomed) return { ended: 'ransomed', rng: r };
  return { transferred: { ...c, security: clamp(c.security + TRANSFER.securityUp), transfers: c.transfers + 1, termDay: day, rescueDay: day, penalty: 0, nextTryDay: day }, rng: r };
}

export { RANSOM_CREDITS };

export const END_TEXT: Readonly<Record<CaptivityEnd, string>> = {
  escaped: 'the player character escaped',
  rescued: 'allies of the player character broke them out',
  foughtFree: 'the player character fought their way free',
  released: 'the captors let the player character go',
  ransomed: 'the player character was ransomed (a debt)',
};

/** Held now (a run's hours may still be passing: the record begins at its end). */
export const isHeld = (s: GameState): boolean => s.world.captivity !== null;
