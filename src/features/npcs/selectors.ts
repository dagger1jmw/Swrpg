import { isDying, isIncapacitated, type Wound } from '../../engine/wounds';
import { withForceSpeed } from '../../data/canon/sheetScale';
import { uniqueAliasMatch } from '../../engine/aliases';
import { ageInYears } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import { archetypeDef } from '../../data/archetypes';
import { CANON_BY_ID } from '../../data/canonNpcs';
import { DEFAULT_AGE, DEFAULT_AGE_BY_ROLE } from '../../data/npcGen.config';
import { FORM_IDS, SKILLS } from '../../data/skills';
import { ageFromTraining, speciesDef, speciesTableId, trainingAge } from '../../data/species';
import { DAYS_PER_YEAR, dateFromAbsDay } from '../../engine/calendar';
import { npcVariance, rollNpcInputs } from '../../engine/npcGen';
import { ageLoss, bodyAge, isPhysicalStat } from '../../engine/ageing';
import { PRIME_H } from '../../data/ageing.config';
import { CLASS_HEROES, PAST_SHEET } from '../../data/canon/growthCap';
import { bodyCapAt } from '../../engine/species';
import { isOutsideForce } from '../../engine/speed';
import { canonLevelsAt, canonLevelsDiverged, type CanonStatDeps } from '../../engine/canonStats';
import { canonFallBby, canonLivedAgeAt, canonRankAt, withoutDeath } from '../../engine/canonRoster';
import { ROLE_RANK } from '../../data/npcGen.config';
import type { CanonNpc, RankSpan } from '../../data/canon/types';
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
  return speciesTableId(id);
}

/** The NPC's age at the current date; unknown birth days use the role default (D-151). */
export function selectNpcAgeOrDefault(s: GameState, id: string): number {
  const n = s.npcs.byId[id];
  if (!n) return DEFAULT_AGE;
  return n.birthDay !== null ? (s.clock.now.day - n.birthDay) / DAYS_PER_YEAR : DEFAULT_AGE_BY_ROLE[n.rankRole ?? n.role] ?? DEFAULT_AGE;
}

/** Stored generation inputs, or the ones generation would store (deterministic: campaign seed + NPC ID, D-143 G). */
export function selectNpcGen(s: GameState, id: string): NpcGen | null {
  const n = s.npcs.byId[id];
  if (!n) return null;
  if (n.gen) return n.gen;
  const year = dateFromAbsDay(s.clock.now.day).year;
  return rollNpcInputs({ campaignSeed: s.meta.campaignId, npcId: id, role: n.role, ...(n.rankRole ? { rankRole: n.rankRole } : {}), faction: n.factionId, age: selectNpcAgeOrDefault(s, id), year, species: n.speciesId });
}

const levelCache = new Map<string, Readonly<Record<string, number>>>();
const CACHE_MAX = 400;

/** Closed-form levels for generation inputs at an age (character creation's closed form, with the NPC's variance). */
export function npcLevelsFor(gen: NpcGen, speciesId: string, age: number, today: number, phases?: { padawanAge: number; knightAge: number }, insideForce = false, sheetedWillpower = false, sheeted = false): Readonly<Record<string, number>> {
  const key = JSON.stringify([gen, speciesId, Math.round(age * 100) / 100, phases ? [phases.padawanAge, phases.knightAge].map((x) => (Number.isFinite(x) ? x : -1)) : null, insideForce, sheetedWillpower, sheeted]);
  const hit = levelCache.get(key);
  if (hit) return hit;
  const birthDay = Math.round(today - age * DAYS_PER_YEAR);
  const species = creationSpecies(speciesId);
  // D-447, D-453: the outside-the-Force block reads the real species (an unknown species is built on the human body), with
  // a canon figure's exception (Onimi).
  const outsideForce = isOutsideForce(speciesId, insideForce);
  // The archetype's start age is a training age: a Chiss or a Hutt child starts at its own years (D-474).
  const startAge = Math.min(ageFromTraining(speciesDef(species), gen.startAge), Math.max(0, age - 0.01));
  const base = { name: 'npc', birthDay, startDay: today, speciesId: species, path: gen.path, archetype: gen.archetype, trainingStartAge: startAge, talents: gen.talents, warYears: gen.warYears, dominantHand: 'right' as const, npc: true, variance: gen.minionGrade === null ? (k: string) => npcVariance(gen.seed, k) : undefined, ...(phases ? { phases } : {}), ...(outsideForce ? { outsideForce } : {}), ...(sheetedWillpower ? { sheetedWillpower } : {}), ...(sheeted ? { sheeted } : {}) };
  let r = computeCreation({ ...base, rank: gen.rank });
  if (!r.levels || Object.keys(r.levels).length === 0 || r.errors.length) {
    // The role's rank may not fit the age (a young "Knight"); fall back to the highest rank that fits.
    const fit = ranksFor(gen.path, trainingAge(speciesDef(species), age));
    const best = fit[fit.length - 1];
    if (best) r = computeCreation({ ...base, rank: best.id });
  }
  const levels = r.levels ?? {};
  if (levelCache.size >= CACHE_MAX) levelCache.delete(levelCache.keys().next().value!);
  levelCache.set(key, levels);
  return levels;
}

// ---- Canon figures (D-414): rank-shaped generator lines and growth, for src/engine/canonStats.ts ----

const PADAWAN_PHASE = (r: RankSpan): boolean => r.role === 'padawan' || r.title === 'apprentice';
const TRAINEE_ROLES: readonly string[] = ['initiate', 'padawan', 'sithAcolyte', 'darkAcolyte'];
/** The Knight phase: a Knight, Master or Lord, or any adult role a Force-user holds after training (an Overseer, an agent). */
const KNIGHT_PHASE = (r: RankSpan): boolean => r.title !== 'apprentice' && !TRAINEE_ROLES.includes(r.role);

/**
 * The creation rank at `bby` and the phase ages a canon figure's rank spans give. Spans starting after `asOfBby` are
 * not known yet (a campaign's figure grows from its start without its later canon promotions).
 */
function canonShape(canon: CanonNpc, bby: number, asOfBby: number): { rank: string; phases?: { padawanAge: number; knightAge: number } } {
  const def = archetypeDef(canon.archetype);
  if (def.path === 'career' || def.path === 'outsider') return { rank: 'career' };
  const known = canon.ranks.filter((r) => r.fromBby >= asOfBby);
  const firstAge = (f: (r: RankSpan) => boolean): number => {
    const r = known.filter(f).sort((a, b) => b.fromBby - a.fromBby)[0];
    return r ? canon.birthBby - r.fromBby : Infinity;
  };
  const knightAge = firstAge(KNIGHT_PHASE);
  const pad = firstAge(PADAWAN_PHASE);
  const padawanAge = Number.isFinite(pad) ? pad : Number.isFinite(knightAge) ? Math.max(0, knightAge - 6) : Infinity;
  const at = canonRankAt({ ...canon, ranks: known }, Math.max(bby, asOfBby));
  const young = def.path === 'sith' ? 'acolyte' : 'initiate';
  const adult = def.path === 'sith' ? 'lord' : 'knight';
  const rank = at ? (at.title === 'apprentice' ? 'apprentice' : (ROLE_RANK[at.role] ?? (KNIGHT_PHASE(at) ? adult : young))) : young;
  return { rank, phases: { padawanAge, knightAge } };
}

/** A canon figure's body age at a date (D-472): its lived age, slowed by the Force Control of its nearest sheet (or the generator's line). */
export function canonBodyAge(canon: CanonNpc, bby: number, lineForceControl: number): number {
  const near = canon.anchors.filter((a) => a.levels['forceControl'] !== undefined).sort((a, b) => Math.abs(a.bby - bby) - Math.abs(b.bby - bby))[0];
  return bodyAge(speciesDef(speciesTableId(canon.speciesId)), canonLivedAgeAt(canon, bby), near?.levels['forceControl'] ?? lineForceControl);
}

/** The cap past a figure's sheet (D-503, D-504): from the sheet, or from when one sheeted in training becomes a full member. */
function pastSheet(canon: CanonNpc, sheetBby: number): { from: number; most: number } {
  const early = CLASS_HEROES.includes(canon.canonId) || canonLivedAgeAt(canon, sheetBby) < PAST_SHEET.earlyBefore;
  return { from: canonFullMemberBy(canon, sheetBby), most: early ? PAST_SHEET.early : PAST_SHEET.most };
}
/** The sheet's date, or the first rank after it that is no trainee's; a trainee for life is never one. */
export function canonFullMemberBy(canon: Pick<CanonNpc, 'ranks' | 'deathBby'>, sheetBby: number): number {
  const at = canonRankAt(canon as CanonNpc, sheetBby);
  if (!at || KNIGHT_PHASE(at)) return sheetBby;
  return Math.max(-Infinity, ...canon.ranks.filter((r) => r.fromBby < sheetBby && KNIGHT_PHASE(r)).map((r) => r.fromBby));
}

/** The dark powers of a figure who was a Jedi: none before the fall (Jared, D-503). */
const DARK_POWERS: readonly string[] = SKILLS.filter((s) => s.kind === 'forceAbility' && s.side === 'dark').map((s) => s.id);
function withoutDarkPowers(levels: Readonly<Record<string, number>>): Record<string, number> {
  return Object.fromEntries(Object.entries(levels).map(([k, v]) => [k, DARK_POWERS.includes(k) ? 0 : v]));
}
const beforeFall = (canon: CanonNpc, bby: number): boolean => {
  const fall = canonFallBby(canon);
  return fall !== null && bby > fall;
};

/** The engine's dependencies for one canon figure (memoized per date): the generator line, growth G and lived age. */
function canonDeps(canon: CanonNpc, today: number, asOfBby = -Infinity): CanonStatDeps {
  const def = archetypeDef(canon.archetype);
  const lines = new Map<string, Readonly<Record<string, number>>>();
  const line = (bby: number, variance: boolean): Readonly<Record<string, number>> => {
    const k = `${bby}:${variance}`;
    const hit = lines.get(k);
    if (hit) return hit;
    const shape = canonShape(canon, bby, asOfBby);
    const gen: NpcGen = { archetype: canon.archetype, path: def.path, talents: {}, startAge: def.startAge, warYears: 0, rank: shape.rank, seed: variance ? `canon:${canon.canonId}` : `canon:${canon.archetype}`, minionGrade: variance ? null : 1 };
    const age = canon.fixed ? 60 : canonLivedAgeAt(canon, bby);
    const lv = npcLevelsFor(gen, canon.speciesId, Math.max(def.startAge + 0.01, age), today, shape.phases, canon.insideForce === true, canon.anchors.some((a) => a.levels['willpower'] !== undefined), canon.anchors.length > 0);
    lines.set(k, lv);
    return lv;
  };
  return {
    pastSheet: (sheetBby) => pastSheet(canon, sheetBby),
    // A figure with a sheet takes the plain line for what its sheet leaves to the game: no luck of the draw (D-494).
    lineAt: (bby) => line(bby, canon.anchors.length === 0),
    growthAt: (bby) => Math.max(0, ...Object.entries(line(bby, false)).filter(([k]) => FORM_IDS.includes(k) || k === def.main).map(([, v]) => v)),
    livedAgeAt: (bby) => canonLivedAgeAt(canon, bby),
    retentionAt: (stat, bby) => (isPhysicalStat(stat) ? 1 - ageLoss(stat, canonBodyAge(canon, bby, line(bby, false)['forceControl'] ?? 0)) : 1),
    // An immortal's body is held at its prime (D-494).
    capAt: (stat, bby) => (isPhysicalStat(stat) ? bodyCapAt(creationSpecies(canon.speciesId), stat, canon.fixed ? PRIME_H : canonBodyAge(canon, bby, line(bby, false)['forceControl'] ?? 0)) : null),
  };
}

/**
 * The game's progression line for a canon figure at a date (tools and tests; the stat-scale conversion, D-423): the
 * closed form for its archetype, rank spans and lived age, with the given talents and no variance. Not its anchors.
 */
export function canonProgressionLineAt(canon: CanonNpc, bby: number, today: number, talents: NpcGen['talents'] = {}): Readonly<Record<string, number>> {
  const def = archetypeDef(canon.archetype);
  const shape = canonShape(canon, bby, -Infinity);
  const gen: NpcGen = { archetype: canon.archetype, path: def.path, talents, startAge: def.startAge, warYears: 0, rank: shape.rank, seed: `canon:${canon.archetype}`, minionGrade: 1 };
  const age = canon.fixed ? 60 : canonLivedAgeAt(canon, bby);
  return npcLevelsFor(gen, canon.speciesId, Math.max(def.startAge + 0.01, age), today, shape.phases, canon.insideForce === true, false, canon.anchors.length > 0);
}

/** A story NPC's per-character exception to the outside-the-Force block (D-453): its canon figure's flag (Onimi). */
export const npcInsideForce = (n: { canonId?: string | null | undefined }): boolean => (n.canonId ? CANON_BY_ID.get(n.canonId)?.insideForce === true : false);

/** A story NPC's other exceptions to its species' Force traits (D-473). */
export const npcOwnForceTraits = (n: { canonId?: string | null | undefined }): CanonNpc['ownForceTraits'] => (n.canonId ? CANON_BY_ID.get(n.canonId)?.ownForceTraits : undefined);

/**
 * A canon figure off its canon line from a day (D-419, D-504, D-506): it grows from what it was then, by the ranks begun by
 * then. Tools and tests call it directly.
 */
export function canonLevelsOffLine(canon: CanonNpc, offDay: number, today: number): Record<string, number> {
  const nowBby = -dateFromAbsDay(today).year;
  const left = -dateFromAbsDay(offDay).year;
  const onCourse = canonFigureLevelsAt(canon, nowBby, today);
  const course = canonDeps(canon, today);
  return canonLevelsDiverged(canonFigureLevelsAt(canon, left, offDay), onCourse, course.growthAt, canonDeps(canon, today, left).growthAt, left, nowBby, course.retentionAt);
}

/** A canon figure's levels at a date from its anchors (D-414), outside a campaign (tools and tests). */
export function canonFigureLevelsAt(canon: CanonNpc, bby: number, today: number): Record<string, number> {
  const levels = { ...withForceSpeed(canon, canon.archetype, canonLevelsAt(canon, bby, canonDeps(canon, today))) };
  return beforeFall(canon, bby) ? withoutDarkPowers(levels) : levels;
}

/**
 * An NPC's levels now (npc-generation §4): canon NPCs use their sheet scaled to the date (D-152, D-155); everyone else
 * the closed form from the generation inputs. Recomputed from the current date, so NPCs age and grow (test 4).
 */
export function selectNpcLevels(s: GameState, id: string): Readonly<Record<string, number>> {
  const n = s.npcs.byId[id];
  if (!n) return {};
  if (n.devLevels) return n.devLevels;
  const onRecord = n.canonId ? CANON_BY_ID.get(n.canonId) : undefined;
  // A figure in play past the death on record is alive in this campaign (D-467): it keeps what it held.
  const canon = onRecord?.deathBby !== undefined && -dateFromAbsDay(s.clock.now.day).year < onRecord.deathBby ? withoutDeath(onRecord) : onRecord;
  if (canon) {
    // D-504: a figure on its canon course is what its sheets, ranks and lived age make it at the date, whenever the campaign
    // began. One that has diverged (killed, captured, turned, removed from its post; D-419) grows from what it was that day, by
    // the rank spans begun by then.
    const today = s.clock.now.day;
    const nowBby = -dateFromAbsDay(today).year;
    const onCourse = canonFigureLevelsAt(canon, nowBby, today);
    // A recorded change to its training does the same (D-506): the earlier of the two days counts.
    const offDay = Math.min(n.canonDiverged?.day ?? Infinity, n.canonTraining?.day ?? Infinity);
    if (!Number.isFinite(offDay) || canon.fixed) return onCourse;
    return canonLevelsOffLine(canon, offDay, today);
  }
  const gen = selectNpcGen(s, id);
  const levels = gen ? npcLevelsFor(gen, n.speciesId, selectNpcAgeOrDefault(s, id), s.clock.now.day) : {};
  // A figure the lore knows with no sheet in the game (Sidious) is a canon Force user too (D-497).
  return gen && n.canonId ? withForceSpeed(null, gen.archetype, levels) : levels;
}

export const selectNpcLevel = (s: GameState, id: string, skillId: string): number => selectNpcLevels(s, id)[skillId] ?? 0;

/** A named NPC out of the fight (m8-audit A4, the wounded commander): dying or incapacitated by its wounds, or dead. */
export function selectNpcOutOfFight(s: GameState, id: string): boolean {
  const n = s.npcs.byId[id];
  if (!n) return false;
  if (n.status === 'deceased') return true;
  const w = (n.health?.wounds ?? []) as Wound[];
  return isDying(w) || isIncapacitated(w);
}
