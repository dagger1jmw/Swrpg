// Building duel fighters from the game state (rolls.md §1: effective levels from the real skill levels, wounds,
// rust, Spent and fatigue). Pure; reads other features only through their selectors.
import { SITH_ACADEMIES, SPARRING_DEFAULT_BY_RANK, type SparringMode } from '../../data/combat.config';
import { MINION_KINDS, beskarChanceAt } from '../../data/npcGen.config';
import { nextFloat, seedRng } from '../../engine/rng';
import { CANON_BY_ID } from '../../data/canonNpcs';
import { FORM_IDS } from '../../data/skills';
import { DROID_MINION_KINDS, HEAVY_MINION_KINDS } from '../../data/forceResistance.config';
import { forceResistanceOf, speciesForceTraits } from '../../engine/combatForce';
import { stubLightPhilosophy, STUB_PLAYER_SHATTERSENSE } from '../../data/stubs';
import { TERRAIN_BY_ID } from '../../data/terrain';
import { TERRAIN_HAZARD_EVERY } from '../../data/combat.config';
import type { TerrainHazard } from '../../engine/terrainHazard';
import { loadoutFor, weaponSkillKind, type Loadout } from '../../data/weapons';
import type { MatchupSituation } from '../../data/formMatchups';
import { dateFromAbsDay } from '../../engine/calendar';
import type { DuelContext, Fighter } from '../../engine/duel';
import { capacities } from '../../engine/fatigue';
import { minionInputs, minionWeaponLevel } from '../../engine/npcGen';
import { maxVitality } from '../../engine/vitality';
import type { Wound } from '../../engine/wounds';
import type { LastingInjury } from '../../engine/lasting';
import type { GameState } from '../../state/gameState';
import { selectArchetype, selectCharacter, selectPath } from '../character/selectors';
import { selectLasting, selectMaxVitality, selectVitality, selectWounds } from '../health/selectors';
import { selectCurrentLocation } from '../locations/selectors';
import { npcLevelsFor, selectNpc, selectNpcGen, selectNpcLevels } from '../npcs/selectors';
import { selectCapacities, selectGriefMult, selectLevelExact, selectPerformance, selectRust, selectStateOfMind } from '../progression/selectors';
import { selectRank } from '../ranks/selectors';

/** The fighting skill for a loadout: the best of the given forms for sabers, blaster, melee, or Agility unarmed. */
function fightingSkill(loadout: Loadout, levelOf: (id: string) => number, preferredForm: string | null): { skillId: string; form: string | null } {
  const kind = weaponSkillKind(loadout.weapon);
  if (kind === 'form') {
    if (preferredForm && levelOf(preferredForm) > 0) return { skillId: preferredForm, form: preferredForm };
    let best = 'shiiCho';
    for (const f of FORM_IDS) if (f !== 'jarKai' && levelOf(f) > levelOf(best)) best = f;
    return { skillId: best, form: best };
  }
  if (kind === 'blaster') return { skillId: 'blaster', form: null };
  if (kind === 'melee') return { skillId: 'melee', form: null };
  return { skillId: 'agility', form: null };
}

/** The player's state of mind as a combat modifier key (rolls §5); lingering grief counts when nothing stronger is active. */
function combatState(s: GameState): string | null {
  const st = selectStateOfMind(s);
  if (st !== 'neutral' && st !== 'distracted') return st;
  return selectGriefMult(s) < 1 ? 'grief' : null;
}

export function buildPlayerFighter(s: GameState): Fighter {
  const c = selectCharacter(s);
  const loadout = loadoutFor(selectArchetype(s), selectRank(s));
  const { skillId, form } = fightingSkill(loadout, (id) => selectLevelExact(s, id), c.mainFormId);
  const caps = selectCapacities(s);
  return {
    id: 'pc',
    name: c.name,
    skillId,
    level: selectPerformance(s, skillId),
    rust: selectRust(s, skillId),
    form,
    weapon: loadout.weapon,
    armor: loadout.armor,
    saberResistant: loadout.saberResistant,
    forceSense: selectLevelExact(s, 'forceSense'),
    willpower: selectLevelExact(s, 'willpower'),
    agility: selectPerformance(s, 'agility'),
    endurance: selectPerformance(s, 'endurance'),
    shatterpoint: STUB_PLAYER_SHATTERSENSE ? selectLevelExact(s, 'forceSense') : 0,
    lightSide: stubLightPhilosophy(selectPath(s)),
    minion: false,
    stateOfMind: combatState(s),
    stance: 'balanced',
    vitality: selectVitality(s),
    maxVitality: selectMaxVitality(s),
    wounds: selectWounds(s),
    lasting: selectLasting(s),
    meters: { p: s.health.meters.p, f: s.health.meters.f, m: s.health.meters.m },
    caps: { p: caps.p, f: caps.f },
    position: 0,
    disarmedFor: 0,
    insightUsed: false,
    shatterpointUsed: false,
    out: false,
    engagedElsewhere: false,
    dead: false,
    pendingManeuver: null,
    forceResistance: forceResistanceOf((id) => selectLevelExact(s, id)),
    forceTraits: speciesForceTraits(c.speciesId),
    weaponHand: c.dominantHand,
  };
}

function fighterFromLevels(id: string, name: string, levels: Readonly<Record<string, number>>, loadout: Loadout, opts: { minion: boolean; vitalityLost: number; wounds: readonly Wound[]; lasting: readonly LastingInjury[]; shatterpoint: number; lightSide: boolean }): Fighter {
  const lv = (k: string): number => levels[k] ?? 0;
  const { skillId, form } = fightingSkill(loadout, lv, null);
  const caps = capacities(lv('endurance'), lv('willpower'), lv('forceControl'));
  const maxV = maxVitality({ endurance: lv('endurance'), strength: lv('strength'), bodyAbility: Math.max(lv('forceSpeed'), lv('forceJump')) });
  return {
    id,
    name,
    skillId,
    level: lv(skillId),
    rust: 0,
    form,
    weapon: loadout.weapon,
    armor: loadout.armor,
    saberResistant: loadout.saberResistant,
    forceSense: lv('forceSense'),
    willpower: lv('willpower'),
    agility: lv('agility'),
    endurance: lv('endurance'),
    shatterpoint: opts.shatterpoint,
    lightSide: opts.lightSide,
    minion: opts.minion,
    stateOfMind: null,
    stance: 'balanced',
    vitality: Math.max(0, maxV - opts.vitalityLost),
    maxVitality: maxV,
    wounds: opts.wounds,
    lasting: opts.lasting,
    meters: { p: 0, f: 0 },
    caps: { p: caps.p, f: caps.f },
    position: 0,
    disarmedFor: 0,
    insightUsed: false,
    shatterpointUsed: false,
    out: false,
    engagedElsewhere: false,
    dead: false,
    pendingManeuver: null,
    forceResistance: forceResistanceOf(lv),
  };
}

export function buildNpcFighter(s: GameState, npcId: string): { fighter: Fighter; rank: string | null } {
  const npc = selectNpc(s, npcId)!;
  const gen = selectNpcGen(s, npcId)!;
  const levels = selectNpcLevels(s, npcId);
  const canon = npc.canonId ? CANON_BY_ID.get(npc.canonId) : undefined;
  const archetype = canon?.archetype ?? gen.archetype;
  let loadout = loadoutFor(archetype, gen.rank);
  // Mandalorian armor (D-158): canon armor, else a beskar roll by era, seeded per NPC.
  if (archetype === 'mandalorian') {
    const beskar = canon?.armor ? canon.armor === 'beskar' : nextFloat(seedRng(`${gen.seed}:beskar`))[0] < beskarChanceAt(dateFromAbsDay(s.clock.now.day).year);
    loadout = { ...loadout, saberResistant: beskar };
  }
  const fighter = fighterFromLevels(npcId, npc.name, levels, loadout, {
    minion: false,
    vitalityLost: npc.health?.vitalityLost ?? 0,
    wounds: (npc.health?.wounds ?? []) as Wound[],
    lasting: (npc.health?.lasting ?? []) as LastingInjury[],
    shatterpoint: canon?.specialTalents?.includes('ShatterSense') ? (levels['forceSense'] ?? 0) : 0,
    lightSide: gen.path === 'jedi',
  });
  return { fighter: { ...fighter, forceTraits: speciesForceTraits(npc.speciesId) }, rank: gen.rank };
}

export function buildMinionFighter(s: GameState, kindId: string, grade: number, index: number, fightId: string, beskar = false): Fighter {
  const kind = MINION_KINDS.find((k) => k.id === kindId) ?? MINION_KINDS[0]!;
  const inputs = minionInputs(kindId, grade, `${fightId}:${kindId}:${index}`);
  const base = npcLevelsFor(inputs, 'human', inputs.age, s.clock.now.day);
  // The kind's weapon-skill profile (D-195): the main weapon always has a trained level.
  const w = minionWeaponLevel(kindId, grade);
  const levels = w ? { ...base, [w.skill]: Math.max(base[w.skill] ?? 0, w.level) } : base;
  const loadout: Loadout = { weapon: kind.weapon, armor: kind.armor, saberResistant: kind.saberResistant === true || (kind.saberResistant === 'byEra' && beskar) };
  const f = fighterFromLevels(`${fightId}:${kindId}:${index}`, `${kind.label} ${index + 1}`, levels, loadout, { minion: true, vitalityLost: 0, wounds: [], lasting: [], shatterpoint: 0, lightSide: false });
  const v = f.maxVitality * kind.vitalityMult;
  const droid = DROID_MINION_KINDS.includes(kind.id);
  return { ...f, vitality: v, maxVitality: v, coordination: kind.coordination, ...(kind.accuracy ? { accuracy: kind.accuracy } : {}), ...(droid ? { forceTraits: speciesForceTraits('droid'), forceResistance: 0 } : {}), ...(HEAVY_MINION_KINDS.includes(kind.id) ? { bodySize: 'heavy' as const } : {}) };
}

/** The duel context from the terrain tags and stakes (rolls §5, D-144). */
export function buildContext(_s: GameState, terrainTags: readonly string[], stakes: string, sparring: SparringMode | null): DuelContext {
  const situations = new Set<MatchupSituation>();
  let footing = 0;
  let positionAttempt = 0;
  const hazards: TerrainHazard[] = [];
  let cover = false;
  let forceNegated = false;
  for (const t of terrainTags) {
    const tag = TERRAIN_BY_ID.get(t);
    if (!tag) continue;
    if (tag.situation) situations.add(tag.situation);
    if (tag.footing) footing = Math.min(footing, tag.footing);
    if (tag.positionAttempt) positionAttempt = Math.min(positionAttempt, tag.positionAttempt);
    if (tag.hazard) hazards.push({ ...tag.hazard, label: tag.label });
    if (tag.cover) cover = true;
    if (tag.forceNegation) forceNegated = true;
  }
  // A sparring bout rolls its terrain once; a real fight every TERRAIN_HAZARD_EVERY exchanges (D-185).
  return { sparring, situations: [...situations], footing, dyingRiskStakes: stakes === 'lethal' || stakes === 'serious', hazards, positionAttempt, hazardEvery: stakes === 'spar' ? null : TERRAIN_HAZARD_EVERY, ...(cover ? { cover } : {}), ...(forceNegated ? { forceNegated } : {}) };
}

/** Sparring mode (D-144): the rank's default, or the academy mode for the Sith at an academy in its years. */
export function sparringModeFor(s: GameState): SparringMode {
  const rank = selectRank(s);
  if (selectPath(s) === 'sith') {
    const loc = selectCurrentLocation(s);
    const place = `${loc?.name ?? ''} ${loc?.region ?? ''}`.toLowerCase();
    const bby = -dateFromAbsDay(s.clock.now.day).year;
    if (SITH_ACADEMIES.some((a) => bby <= a.fromBby && bby >= a.toBby && place.includes(a.location.replace('-v', ' v').replace('-', ' ')))) return 'academy';
  }
  return SPARRING_DEFAULT_BY_RANK[rank] ?? 'trainingSaber';
}

