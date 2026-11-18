// Lifetime harness (M4; progression-targets §6 test 1, progression-numbers §20 test 1; D-49). Runs a
// calibration profile through the REAL game: a GameState from createInitialState, the player's routine
// (routines feature + scheduler), and advanceByRoutine (the montage day loop, every §10 hook in order).
// Rank changes at the profile's ages use the engine rankSet event (D-131, until M7). Combat (M5, D-143 B): each
// scheduled fight is a real duel through the duel engine against a generated opponent at the scripted gap (a Force-
// using duelist, or a group of trooper minions), with a rolled outcome; the player's wounds and Vitality go through
// health (healthSynced; a Dying profile is always stabilized), and combat XP, E and CI come from the real duel log
// through fightResolved. Replaces the M4 scripted fights (STUB_SCRIPTED_COMBAT). Care after a wounding fight (D-162, a
// harness input): in a profile's war years a bacta tank for the worst new wound (x4; the tank days replace the routine),
// otherwise Order and military profiles get 30 days of medical care. Spars may be against 2-3 partners (D-163).
import { TEST_YEAR } from './dates';
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { levelExact } from '../../src/engine/curve';
import { selectE, selectLevelExact, selectPerformance } from '../../src/features/progression/selectors';
import type { Priority } from '../../src/features/routines/selectors';
import { advanceByRoutine, nextWakeAbs } from '../../src/state/advanceRoutine';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameEvent } from '../../src/state/types';
import { SPARRING_DEFAULT_BY_RANK } from '../../src/data/combat.config';
import { HEAL_MULT } from '../../src/data/health.config';
import { sparGroupLevel } from '../../src/engine/appliedExperience';
import { baseHealDays } from '../../src/engine/healing';
import { advanceTime } from '../../src/state/advanceTime';
import { MINION_KINDS } from '../../src/data/npcGen.config';
import { runUntilBeat, startDuel, type DuelContext, type Fighter } from '../../src/engine/duel';
import { capacity } from '../../src/engine/fatigue';
import { forceCapacity } from '../../src/engine/forceMeter';
import { buildPlayerFighter } from '../../src/features/combat/build';

export const DAYS = 368;
const WAKE = 6 * 3600;

export type Talents = Partial<Record<'combat' | 'force' | 'physical' | 'mind', 'none' | 'gifted' | 'prodigy' | 'exceptional'>>;

export interface Fight {
  stakes: 'spar' | 'skirmish' | 'serious' | 'lethal';
  /** The opponent's level advantage over the profile's fighting form (negative = weaker). */
  gap: number;
  /** A Force-using duelist (default), or a minion group of a kind from MINION_KINDS (npcGen.config). */
  opponent?: string;
  /** Minions in the group (default 3). */
  count?: number;
  /** A spar against this many partners at once, each at the gap (D-163 group sparring; default 1). */
  partners?: number;
  /** The form fought with ('$main' or absent = the profile's main form). */
  skillId?: string;
}

export interface LifeProfile {
  archetype: string;
  path: 'jedi' | 'sith' | 'outsider' | 'career';
  /** '$highestForm' or a skill id: the milestones' main specialty. */
  main: string;
  startAge: number;
  padawanAge: number;
  knightAge: number;
  daysPerYear: number;
  effort: 'easy' | 'standard' | 'push';
  talents?: Talents;
  /** Trained XP at the start (e.g. a known Force ability). */
  startingXp?: Record<string, number>;
  /** Focus shares (clamp share and the Knight+ default fill); empty = the archetype template. */
  focusWeights?: Record<string, number>;
  mainForm: string;
  secondForm: string;
  formPlan?: { padawan: Record<string, number>; knight: Record<string, number> };
  /** The routine's priorities per rank row (null / absent = the archetype default template). */
  priorities?: Partial<Record<'initiate' | 'padawan' | 'knight', Priority[] | null>>;
  fillSource?: { kind: 'peers' } | { kind: 'solo' } | null;
  seed: string;
  /** Scripted fights for a training day (age = years since birth). */
  fights?: (age: number, day: number) => Fight[];
  /** War years [from, to): wounding fights get a bacta tank instead of medical care (D-162). */
  warAges?: readonly (readonly [number, number])[];
}

export interface LifeResult {
  xp: Record<string, number>;
  milestones: Record<number, number>;
  /** Main-specialty XP per year (the most-trained form's for form profiles), transfers excluded. */
  yearMain: number[];
  /** Combat part of yearMain. */
  yearCombat: number[];
  cross: Record<string, number>;
  mainByYear: number[];
  /** Level of every tracked skill at each whole year. */
  levelsByYear: Record<string, number>[];
  transfers: Record<string, { age: number; xp: number }>;
  maxDayEndF: number;
  discarded: number;
  state: GameState;
  /** D-143 J reports: main-form E when the main milestones 41 and 61 are crossed; the share of drill XP banked. */
  eAtMilestone: Record<number, number>;
  bankShare: number;
  /** Days with a moderate-or-worse wound, per year of age (war healing check). */
  woundedDaysByAge: Record<number, number>;
  /** Days spent in a bacta tank instead of the routine (D-162). */
  tankDays: number;
  /** The day with the highest day-end tiredness: its age and the plan's notes (training-routines test 5). */
  maxDay: { age: number; endF: number; fought: boolean; notes: string[] } | null;
}

const START_DAY = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });

export function profileState(p: LifeProfile): GameState {
  const plan = p.formPlan ?? { padawan: { [p.mainForm]: 2, [p.secondForm]: 1 }, knight: { [p.mainForm]: 2, [p.secondForm]: 1 } };
  const rank = rankFor(p, p.startAge);
  const s = createInitialState<GameState>(REGISTRY, {
    campaignId: `life-${p.seed}`,
    branchId: 'b',
    seed: p.seed,
    start: { day: START_DAY, second: WAKE },
    character: {
      name: p.seed,
      birthDay: START_DAY - Math.round(p.startAge * DAYS),
      path: p.path,
      archetype: p.archetype,
      mainFormId: p.mainForm,
      secondFormId: p.secondForm,
      formPlan: plan,
      trainingStartAge: p.startAge,
      ...(p.talents ? { talents: p.talents } : {}),
      ...(p.focusWeights ? { focusWeights: p.focusWeights } : {}),
    },
    rank,
    ...(p.startingXp ? { startingXp: p.startingXp } : {}),
  });
  return setRoutine(p, s, rank);
}

const LADDER = { jedi: ['initiate', 'padawan', 'knight'], sith: ['acolyte', 'apprentice', 'lord'] } as const;

/** The rank at an age: the Jedi or Sith ladder at the profile's rank ages; others have none. */
function rankFor(p: LifeProfile, age: number): string {
  if (p.path !== 'jedi' && p.path !== 'sith') return 'none';
  const l = LADDER[p.path];
  return age >= p.knightAge ? l[2] : age >= p.padawanAge ? l[1] : l[0];
}

/** The profile's routine for a rank (the player sets it; a rank change is a new routine). */
function setRoutine(p: LifeProfile, s: GameState, rank: string): GameState {
  const row = rank === 'initiate' || rank === 'acolyte' ? 'initiate' : rank === 'padawan' || rank === 'apprentice' ? 'padawan' : 'knight';
  const routine = { ...s.routines.active, effort: p.effort, daysPerWeek: (7 * p.daysPerYear) / DAYS, priorities: p.priorities?.[row] ?? null, fillSource: p.fillSource ?? null, wakeSecond: WAKE };
  return applyEvents(REGISTRY, s, [{ type: 'routineSet', routine }], { source: 'player' }).state;
}

/** Per-run fight statistics (reported by the lifetime tests, D-143 J). */
export const fightStats = { fights: 0, won: 0, lost: 0, wounds: 0, stabilized: 0 };

/** A minion of a kind at a level (the kind's weapon, armor, coordination and Vitality; npc-generation §6, D-158). */
function minionFighter(kindId: string, id: string, level: number, beskar: boolean): Fighter {
  const k = MINION_KINDS.find((x) => x.id === kindId) ?? MINION_KINDS[0]!;
  const v = 47 * k.vitalityMult;
  return {
    ...duelistFighter(id, level, v),
    skillId: k.weapon === 'melee' ? 'melee' : 'blaster',
    form: null,
    weapon: k.weapon,
    armor: k.armor,
    saberResistant: k.saberResistant === true || (k.saberResistant === 'byEra' && beskar),
    forceSense: 0,
    minion: true,
    coordination: k.coordination,
    ...(k.accuracy ? { accuracy: k.accuracy } : {}),
    caps: { p: capacity(30), f: 0 },
  };
}

/** A Force-using duelist at a level: form level = Force Sense = level, the same Vitality model as the profile. */
function duelistFighter(id: string, level: number, vitality: number): Fighter {
  return {
    id,
    name: id,
    skillId: 'soresu',
    level,
    rust: 0,
    form: 'shiiCho',
    weapon: 'lightsaber',
    armor: 'none',
    saberResistant: false,
    forceSense: level,
    willpower: Math.max(20, level * 0.8),
    agility: level * 0.7,
    endurance: level * 0.7,
    shatterpoint: 0,
    lightSide: false,
    minion: false,
    stateOfMind: null,
    stance: 'balanced',
    vitality,
    maxVitality: vitality,
    wounds: [],
    lasting: [],
    meters: { p: 0, f: 0 },
    caps: { p: capacity(level * 0.7), f: forceCapacity(level, level * 0.8) },
    position: 0,
    disarmedFor: 0,
    insightUsed: false,
    shatterpointUsed: false,
    out: false,
    engagedElsewhere: false,
    dead: false,
    pendingManeuver: null,
  };
}

/** One real duel (D-143 B): the engine resolves it; health and progression apply it through their events. */
function realFight(s0: GameState, p: LifeProfile, f: Fight, n: number, age: number): { s: GameState; tankDays: number } {
  let s = s0;
  let player = buildPlayerFighter(s);
  const form = f.skillId === undefined || f.skillId === '$main' ? p.mainForm : f.skillId;
  if (player.form !== null && selectLevelExact(s, form) > 0) player = { ...player, form, skillId: form, level: selectPerformance(s, form) };
  const level = player.level + f.gap;
  const opponents =
    f.opponent && f.opponent !== 'duelist'
      ? Array.from({ length: f.count ?? 3 }, (_, i) => minionFighter(f.opponent!, `m${n}-${i}`, level, i % 5 < 3))
      : Array.from({ length: f.stakes === 'spar' ? (f.partners ?? 1) : 1 }, (_, i) => duelistFighter(`d${n}-${i}`, level, player.maxVitality));
  const sparring = f.stakes === 'spar' ? (SPARRING_DEFAULT_BY_RANK[s.ranks.rank] ?? 'trainingSaber') : null;
  if (sparring === 'trainingSaber') player = { ...player, weapon: 'trainingSaber' };
  const ctx: DuelContext = { sparring, situations: [], footing: 0, dyingRiskStakes: f.stakes === 'lethal' || f.stakes === 'serious' };
  const r = runUntilBeat(startDuel(player, sparring === 'trainingSaber' ? opponents.map((o) => (o.weapon === 'lightsaber' ? { ...o, weapon: 'trainingSaber' as const } : o)) : opponents, s.meta.rngState), ctx, s.clock.now.day, 'toEnd', 3000);
  const d = r.state;
  s = { ...s, meta: { ...s.meta, rngState: d.rng } };
  const outcome = d.end?.winner === 'A' ? 'won' : d.end?.winner === 'B' ? 'lost' : 'fled';
  if (outcome === 'won') fightStats.won += 1;
  else fightStats.lost += 1;
  const newWounds = d.a.wounds.slice(player.wounds.length);
  fightStats.wounds += newWounds.length;
  const events: GameEvent[] = [];
  const max = player.maxVitality;
  events.push({ type: 'healthSynced', vitalityLost: Math.max(0, max - d.a.vitality), addWounds: newWounds, meters: { p: d.a.meters.p, f: d.a.meters.f }, cause: 'lifetime duel' });
  const exchanges = d.log.filter((x) => x.kind !== 'force').map((x) => ({ skillId: form, gap: x.effB - x.effA }));
  // A spar with several partners counts as one at the strongest's level + 10 per extra (D-163).
  const opponentGap = f.stakes === 'spar' ? sparGroupLevel(opponents.map((o) => o.level)) - player.level : f.gap;
  if (exchanges.length) events.push({ type: 'fightResolved', stakes: f.stakes, outcome, exchanges, forceUses: [], opponentGap });
  const applied = applyEvents(REGISTRY, s, events, { source: 'engine' });
  if (applied.rejected.length) throw new Error(`fight rejected: ${applied.rejected[0]!.reason}`);
  s = applied.state;
  // A Dying profile is always stabilized (Jared, D-143 B: a medic is present).
  if (s.health.dying) {
    s = applyEvents(REGISTRY, s, [{ type: 'woundsStabilized', by: 'a field medic' }], { source: 'engine' }).state;
    fightStats.stabilized += 1;
  }
  // Care after a wounding fight (D-162): in war years a bacta tank long enough for the worst new wound at x4 (the tank
  // days replace the routine); otherwise Order and military profiles get medical care (Temple healers; x2 healing).
  const serious = newWounds.filter((w) => w.severity !== 'minor');
  let tankDays = 0;
  if (serious.length && (p.warAges ?? []).some(([a, b]) => age >= a && age < b)) {
    const hours = Math.ceil((Math.max(...serious.map((w) => baseHealDays(w))) * 24) / HEAL_MULT.bacta);
    s = applyEvents(REGISTRY, s, [{ type: 'careStarted', kind: 'bacta', hours }], { source: 'engine' }).state;
    tankDays = Math.ceil(hours / 24);
  } else if (serious.length && p.path !== 'outsider') {
    s = applyEvents(REGISTRY, s, [{ type: 'careStarted', kind: 'medical', hours: 30 * 24 }], { source: 'engine' }).state;
  }
  if (s.health.death) throw new Error(`profile ${p.seed} died in fight ${n}`);
  return { s, tankDays };
}

export function runLifetime(p: LifeProfile, years: number, opts: { crossLevels?: Record<string, number[]>; track?: string[] } = {}): LifeResult {
  let s = profileState(p);
  const total = Math.round(years * DAYS);
  const isFormMain = p.main === '$highestForm';
  const mainLevel = (st: GameState): number => (isFormMain ? Math.max(0, ...FORM_IDS.map((f) => levelExact(st.progression.skills[f]?.xp ?? 0))) : levelExact(st.progression.skills[p.main]?.xp ?? 0));
  const milestones: Record<number, number> = {};
  const cross: Record<string, number> = {};
  const yearMain: number[] = [];
  const yearCombat: number[] = [];
  const mainByYear: number[] = [];
  const levelsByYear: Record<string, number>[] = [];
  const transfers: Record<string, { age: number; xp: number }> = {};
  let maxDayEndF = 0;
  let drillTotal = 0;
  let bankedTotal = 0;
  const eAtMilestone: Record<number, number> = {};
  const woundedDaysByAge: Record<number, number> = {};
  let discarded = 0;
  let tankDays = 0;
  let tankDayCount = 0;
  let maxDay: LifeResult['maxDay'] = null;
  let yearXp: Record<string, number> = {};
  let yearFightXp: Record<string, number> = {};
  const track = opts.track ?? [];
  const crossLevels = opts.crossLevels ?? {};
  const levelOf = (st: GameState, k: string): number =>
    k === 'highestForm' ? Math.max(0, ...FORM_IDS.map((f) => selectLevelExact(st, f))) : k.startsWith('perf:') ? selectPerformance(st, k.slice(5)) : selectLevelExact(st, k);
  const mainKeys = (): string[] => (isFormMain ? [...FORM_IDS] : [p.main]);

  for (let day = 0; day < total; day++) {
    const age = p.startAge + day / DAYS;
    // Rank ages (D-131 rankSet; ranks are story-granted from M7).
    {
      const want = rankFor(p, age);
      if (s.ranks.rank !== want) s = setRoutine(p, applyEvents(REGISTRY, s, [{ type: 'rankSet', rank: want }], { source: 'engine' }).state, want);
    }
    const before = { ...s.progression.skills };
    // Fights in the morning, before the day's routine: real duels (D-143 B).
    const fights = tankDays > 0 ? [] : (p.fights?.(age, day) ?? []);
    for (const f of fights) {
      const before = s;
      const fr = realFight(s, p, f, (fightStats.fights += 1), age);
      s = fr.s;
      tankDays = Math.max(tankDays, fr.tankDays);
      for (const k of mainKeys()) yearFightXp[k] = (yearFightXp[k] ?? 0) + (s.progression.skills[k]?.xp ?? 0) - (before.progression.skills[k]?.xp ?? 0);
    }
    const until = nextWakeAbs(s.clock.now.day * 86_400 + s.clock.now.second + 1, WAKE);
    if (tankDays > 0) {
      // A day in the bacta tank (D-162): no routine, wake to wake at rest.
      s = advanceTime(REGISTRY, s, { seconds: until - (s.clock.now.day * 86_400 + s.clock.now.second), reason: 'bacta tank', source: 'timeElapsed', occupation: 'rest' }).state;
      tankDays -= 1;
      tankDayCount += 1;
    }
    const r = s.clock.now.day * 86_400 + s.clock.now.second >= until ? null : advanceByRoutine(REGISTRY, s, { untilAbs: until, reason: 'lifetime' });
    if (r?.rejected.length) throw new Error(`rejected: ${JSON.stringify(r.rejected[0])}`);
    for (const a of r?.applied ?? []) {
      if (a.event.type !== 'activityResolved') continue;
      const tr = (a.event['transfer'] as Record<string, number> | undefined) ?? {};
      for (const [f, x] of Object.entries(tr)) {
        transfers[f] = { age, xp: x };
        yearXp[f] = (yearXp[f] ?? 0) - x;
      }
      for (const n of a.notes) if (n.startsWith('4.0x')) discarded += 1;
      const banked = (a.event['banked'] as Record<string, number> | undefined) ?? {};
      const cred = a.event['credited'] as Record<string, number>;
      for (const f of FORM_IDS) {
        drillTotal += (cred[f] ?? 0) + (banked[f] ?? 0);
        bankedTotal += banked[f] ?? 0;
      }
    }
    if (r) s = r.state;
    for (const d of r?.days ?? []) {
      if (d.endF > maxDayEndF) maxDay = { age, endF: d.endF, fought: fights.length > 0, notes: d.notes };
      maxDayEndF = Math.max(maxDayEndF, d.endF);
    }
    for (const k of mainKeys()) yearXp[k] = (yearXp[k] ?? 0) + (s.progression.skills[k]?.xp ?? 0) - (before[k]?.xp ?? 0);

    const ageEnd = p.startAge + (day + 1) / DAYS;
    const lvl = mainLevel(s);
    for (const t of [21, 41, 61, 81, 101]) {
      if (milestones[t] === undefined && lvl >= t) {
        milestones[t] = (day + 1) / DAYS;
        const best = FORM_IDS.reduce((b, f) => ((s.progression.skills[f]?.xp ?? 0) > (s.progression.skills[b]?.xp ?? 0) ? f : b), p.mainForm);
        eAtMilestone[t] = selectE(s, best);
      }
    }
    if (s.health.wounds.some((w) => w.severity !== 'minor')) woundedDaysByAge[Math.floor(age)] = (woundedDaysByAge[Math.floor(age)] ?? 0) + 1;
    for (const [k, ts] of Object.entries(crossLevels)) {
      const l = levelOf(s, k);
      for (const t of ts) if (cross[`${k}>=${t}`] === undefined && l >= t) cross[`${k}>=${t}`] = ageEnd;
    }
    if ((day + 1) % DAYS === 0) {
      const best = Object.entries(yearXp).sort((a, b) => b[1] - a[1])[0];
      yearMain.push(best ? best[1] : 0);
      yearCombat.push(best ? (yearFightXp[best[0]] ?? 0) : 0);
      yearXp = {};
      yearFightXp = {};
      mainByYear.push(lvl);
      levelsByYear.push(Object.fromEntries(track.map((k) => [k, levelOf(s, k)])));
    }
  }
  const xp = Object.fromEntries(Object.entries(s.progression.skills).map(([k, v]) => [k, v.xp]));
  return { xp, milestones, yearMain, yearCombat, cross, mainByYear, levelsByYear, transfers, maxDayEndF, discarded, state: s, eAtMilestone, bankShare: drillTotal > 0 ? bankedTotal / drillTotal : 0, woundedDaysByAge, tankDays: tankDayCount, maxDay };
}
