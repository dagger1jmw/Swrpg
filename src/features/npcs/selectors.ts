import { uniqueAliasMatch } from '../../engine/aliases';
import { ageInYears } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import { archetypeDef } from '../../data/archetypes';
import { CANON_BY_ID } from '../../data/canonNpcs';
import { DEFAULT_AGE, DEFAULT_AGE_BY_ROLE } from '../../data/npcGen.config';
import { FORM_IDS } from '../../data/skills';
import { SPECIES_BY_ID } from '../../data/species';
import { DAYS_PER_YEAR, dateFromAbsDay } from '../../engine/calendar';
import { canonScale, npcVariance, rollNpcInputs } from '../../engine/npcGen';
import { computeCreation, ranksFor } from '../character/selectors';
import type { Npc, NpcGen } from './npcs';

export const selectNpcs = (s: GameState): Npc[] => Object.values(s.npcs.byId);
export const selectNpc = (s: GameState, id: string): Npc | null => s.npcs.byId[id] ?? null;
export const selectNpcAge = (s: GameState, id: string): number | null => {
  const n = s.npcs.byId[id];
  return n && n.birthDay !== null ? ageInYears(n.birthDay, s.clock.now.day) : null;
};
/** An NPC's own ID, or the unique NPC whose name/aliases match exactly (D-13). */
export const resolveNpcRef = (s: GameState, ref: string): string | null => {
  if (ref.startsWith('npc:')) return s.npcs.byId[ref] ? ref : null;
  return uniqueAliasMatch(selectNpcs(s), (n) => [n.name, ...n.aliases], ref)?.id ?? null;
};

// ---- Generation and levels (npc-generation.md §1-6; M5) ----

/** The species table id for an entity species id (camelCase -> the species table's snake_case); Human when unknown. */
export function creationSpecies(id: string): string {
  if (SPECIES_BY_ID.has(id)) return id;
  const snake = id.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  return SPECIES_BY_ID.has(snake) ? snake : 'human';
}

/** The NPC's age at the current date; unknown birth days use the role default (D-151). */
export function selectNpcAgeOrDefault(s: GameState, id: string): number {
  const n = s.npcs.byId[id];
  if (!n) return DEFAULT_AGE;
  return n.birthDay !== null ? (s.clock.now.day - n.birthDay) / DAYS_PER_YEAR : DEFAULT_AGE_BY_ROLE[n.role] ?? DEFAULT_AGE;
}

/** Stored generation inputs, or the ones generation would store (deterministic: campaign seed + NPC ID, D-143 G). */
export function selectNpcGen(s: GameState, id: string): NpcGen | null {
  const n = s.npcs.byId[id];
  if (!n) return null;
  if (n.gen) return n.gen;
  const year = dateFromAbsDay(s.clock.now.day).year;
  return rollNpcInputs({ campaignSeed: s.meta.campaignId, npcId: id, role: n.role, faction: n.factionId, age: selectNpcAgeOrDefault(s, id), year });
}

const levelCache = new Map<string, Readonly<Record<string, number>>>();
const CACHE_MAX = 400;

/** Closed-form levels for generation inputs at an age (character creation's closed form, with the NPC's variance). */
export function npcLevelsFor(gen: NpcGen, speciesId: string, age: number, today: number): Readonly<Record<string, number>> {
  const key = JSON.stringify([gen, speciesId, Math.round(age * 100) / 100]);
  const hit = levelCache.get(key);
  if (hit) return hit;
  const birthDay = Math.round(today - age * DAYS_PER_YEAR);
  const species = creationSpecies(speciesId);
  const startAge = Math.min(gen.startAge, Math.max(0, age - 0.01));
  const base = { name: 'npc', birthDay, startDay: today, speciesId: species, path: gen.path, archetype: gen.archetype, trainingStartAge: startAge, talents: gen.talents, warYears: gen.warYears, dominantHand: 'right' as const, npc: true, variance: gen.minionGrade === null ? (k: string) => npcVariance(gen.seed, k) : undefined };
  let r = computeCreation({ ...base, rank: gen.rank });
  if (!r.levels || Object.keys(r.levels).length === 0 || r.errors.length) {
    // The role's rank may not fit the age (a young "Knight"); fall back to the highest rank that fits.
    const fit = ranksFor(gen.path, age);
    const best = fit[fit.length - 1];
    if (best) r = computeCreation({ ...base, rank: best.id });
  }
  const levels = r.levels ?? {};
  if (levelCache.size >= CACHE_MAX) levelCache.delete(levelCache.keys().next().value!);
  levelCache.set(key, levels);
  return levels;
}

/** The canon growth curve: the archetype's highest main level at an age (default start age, no variance). */
function canonGrowth(archetype: string, path: NpcGen['path'], speciesId: string, today: number): (age: number) => number {
  const def = archetypeDef(archetype);
  return (age: number) => {
    const gen: NpcGen = { archetype, path, talents: {}, startAge: def.startAge, warYears: 0, rank: path === 'career' ? 'career' : 'none', seed: `canon:${archetype}`, minionGrade: 1 };
    const lv = npcLevelsFor(gen, speciesId, Math.max(def.startAge + 0.01, age), today);
    return Math.max(0, ...Object.entries(lv).filter(([k]) => FORM_IDS.includes(k) || k === def.main).map(([, v]) => v));
  };
}

/**
 * An NPC's levels now (npc-generation §4): canon NPCs use their sheet scaled to the date (D-152, D-155); everyone else
 * the closed form from the generation inputs. Recomputed from the current date, so NPCs age and grow (test 4).
 */
export function selectNpcLevels(s: GameState, id: string): Readonly<Record<string, number>> {
  const n = s.npcs.byId[id];
  if (!n) return {};
  if (n.devLevels) return n.devLevels;
  const canon = n.canonId ? CANON_BY_ID.get(n.canonId) : undefined;
  if (canon) {
    const bby = -dateFromAbsDay(s.clock.now.day).year;
    const ratio = canonScale(canon, bby, canonGrowth(canon.archetype, archetypeDef(canon.archetype).path, canon.speciesId, s.clock.now.day));
    return Object.fromEntries(Object.entries(canon.levels).map(([k, v]) => [k, v * ratio]));
  }
  const gen = selectNpcGen(s, id);
  return gen ? npcLevelsFor(gen, n.speciesId, selectNpcAgeOrDefault(s, id), s.clock.now.day) : {};
}

export const selectNpcLevel = (s: GameState, id: string, skillId: string): number => selectNpcLevels(s, id)[skillId] ?? 0;
