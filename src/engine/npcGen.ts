// NPC generation inputs (npc-generation.md §2-6; D-151, D-155, D-157). Pure. Code picks the archetype and rolls the
// talents and the per-skill variance; the AI supplies only name, species, faction, role and approximate age. The
// seed is a hash of the campaign seed and the NPC's ID (D-143 G), so generation order never matters. Levels are
// recomputed from the current date with the closed form (the npcs feature calls character creation's closed form).
import { archetypeDef, type CharacterPath } from '../data/archetypes';
import {
  COMBATANT_ROLES,
  DEFAULT_ARCHETYPE,
  FACTION_ARCHETYPE,
  MINION_KINDS,
  MINION_YEARS,
  MINION_WEAPON_PROFILE,
  SOLDIER_BLASTER_PACE,
  NPC_SEED_SALT,
  NPC_VARIANCE_SIGMA,
  ORDER_ROLES,
  ROLE_ARCHETYPES,
  SPECIES_ARCHETYPE,
  ROLE_RANK,
  TALENT_ROLL_ORDERS,
} from '../data/npcGen.config';
import { WAR_YEAR_SHARE, WARS } from '../data/wars';
import type { TalentLevel } from '../data/progression.config';
import { TALENT_DOMAINS, type TalentDomain } from '../data/skills';
import { nextFloat, seedRng, type RngState } from './rng';
import { closedFormLevel, phasesFor } from './closedForm';

export const npcSeed = (campaignSeed: string, npcId: string): string => `${NPC_SEED_SALT}:${campaignSeed}:${npcId}`;

export interface NpcGenInputs {
  archetype: string;
  path: CharacterPath;
  talents: Partial<Record<TalentDomain, TalentLevel>>;
  startAge: number;
  warYears: number;
  rank: string;
  seed: string;
  /** Minion grade 1-5, or null for a named NPC. */
  minionGrade: number | null;
}

function pickWeighted<T>(rng: RngState, list: readonly (readonly [T, number])[]): [T, RngState] {
  const [u, next] = nextFloat(rng);
  let x = u * list.reduce((a, [, w]) => a + w, 0);
  for (const [v, w] of list) {
    if (x < w) return [v, next];
    x -= w;
  }
  return [list[list.length - 1]![0], next];
}

/**
 * War years: the overlap of the NPC's adult service years (from 16 or the training start) with the wars of its faction (the one
 * dated list, data/wars.ts), times its archetype's share (opt-2 A2: front line every year, support half, non-combat none).
 */
export function warYearsFor(role: string, faction: string, age: number, startAge: number, year: number, archetype?: string): number {
  if (!COMBATANT_ROLES.includes(role)) return 0;
  const share = archetype === undefined ? 1 : (WAR_YEAR_SHARE[archetype] ?? 0);
  if (share === 0) return 0;
  const serviceFrom = year - (age - Math.max(16, startAge));
  let total = 0;
  for (const w of WARS) {
    if (!w.factions.includes(faction)) continue;
    const from = Math.max(serviceFrom, -w.fromBby);
    const to = Math.min(year, -w.toBby);
    if (to > from) total += to - from;
  }
  return total * share;
}

export function rollNpcInputs(input: { campaignSeed: string; npcId: string; role: string; rankRole?: string; faction: string; age: number; year: number; species?: string }): NpcGenInputs {
  const seed = npcSeed(input.campaignSeed, input.npcId);
  let rng = seedRng(seed);
  let archetype = (input.species ? SPECIES_ARCHETYPE[input.species]?.[input.role] : undefined) ?? FACTION_ARCHETYPE[input.faction]?.[input.role];
  if (!archetype) {
    const list = ROLE_ARCHETYPES[input.role];
    if (list) [archetype, rng] = pickWeighted(rng, list);
    else archetype = DEFAULT_ARCHETYPE;
  }
  const def = archetypeDef(archetype);
  const dist = ORDER_ROLES.includes(input.role) ? TALENT_ROLL_ORDERS.order : TALENT_ROLL_ORDERS.other;
  const talents: Partial<Record<TalentDomain, TalentLevel>> = {};
  for (const d of TALENT_DOMAINS) {
    let t: TalentLevel;
    [t, rng] = pickWeighted(rng, dist);
    if (t !== 'none') talents[d] = t;
  }
  const [u] = nextFloat(rng);
  const [lo, hi] = def.startRange;
  const startAge = Math.min(input.age, lo + u * (hi - lo));
  // An era-corrected role keeps the original role's rank (D-320).
  const rank = ROLE_RANK[input.rankRole ?? input.role] ?? (def.path === 'career' ? 'career' : 'none');
  return { archetype, path: def.path, talents, startAge, warYears: warYearsFor(input.role, input.faction, input.age, startAge, input.year, archetype), rank, seed, minionGrade: null };
}

/** Per-skill variance exp(N(0, 0.12)), seeded by the NPC and the skill (npc-generation §1). */
export function npcVariance(seed: string, skillId: string): number {
  const [u1, r1] = nextFloat(seedRng(`${seed}:var:${skillId}`));
  const [u2] = nextFloat(r1);
  const z = Math.sqrt(-2 * Math.log(Math.max(1e-12, u1))) * Math.cos(2 * Math.PI * u2);
  return Math.exp(NPC_VARIANCE_SIGMA * z);
}

/** A minion's grade (1-5) from its kind's chances (npc-generation §6). */
export function rollMinionGrade(rng: RngState, kindId: string): [number, RngState] {
  const kind = MINION_KINDS.find((k) => k.id === kindId) ?? MINION_KINDS[0]!;
  return pickWeighted(rng, kind.grades.map((p, i) => [i + 1, p] as const));
}

/** Minion inputs: the grade sets years trained (2, 5, 10, 15, 20) at pace 1.0, no talents, no variance. */
export function minionInputs(kindId: string, grade: number, seed: string): NpcGenInputs & { age: number } {
  const kind = MINION_KINDS.find((k) => k.id === kindId) ?? MINION_KINDS[0]!;
  const years = MINION_YEARS[Math.max(0, Math.min(4, grade - 1))]!;
  const def = archetypeDef(kind.archetype);
  const startAge = def.path === 'career' ? 17 : def.startAge;
  return { archetype: kind.archetype, path: def.path, talents: {}, startAge, warYears: 0, rank: def.path === 'career' ? 'career' : def.path === 'sith' ? 'acolyte' : 'initiate', seed, minionGrade: grade, age: startAge + years };
}

/**
 * A minion's main-weapon level from its kind's profile (D-195): null when the kind's archetype measures the skill;
 * else the closed form of the kind's pace over the grade's years (technique row, one phase).
 */
export function minionWeaponLevel(kindId: string, grade: number): { skill: 'blaster' | 'melee'; level: number } | null {
  const p = MINION_WEAPON_PROFILE[kindId];
  if (!p || p.source === 'archetype') return null;
  const inp = minionInputs(kindId, grade, 'weapon');
  const pace = p.share * SOLDIER_BLASTER_PACE;
  return { skill: p.skill, level: closedFormLevel({ row: 'technique', startAge: inp.startAge, age: inp.age, phases: phasesFor({ knight: pace }, { padawanAge: inp.startAge, knightAge: inp.startAge }, true) }) };
}
