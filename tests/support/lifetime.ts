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
import { selectCapacities, selectE, selectLevelExact, selectPerformance } from '../../src/features/progression/selectors';
import type { Priority } from '../../src/features/routines/selectors';
import { advanceByRoutine, nextWakeAbs } from '../../src/state/advanceRoutine';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameEvent } from '../../src/state/types';
import { SPARRING_DEFAULT_BY_RANK, moraleFor, strikeIntentFor, withdrawChanceFor } from '../../src/data/combat.config';
import { HEAL_MULT, SEVERITIES } from '../../src/data/health.config';
import { sparGroupLevel } from '../../src/engine/appliedExperience';
import { baseHealDays } from '../../src/engine/healing';
import { advanceTime } from '../../src/state/advanceTime';
import { MINION_KINDS } from '../../src/data/npcGen.config';
import { currentTarget, disengageContest, fighterEffectiveLevel, runUntilBeat, startDuel, type DuelContext, type DuelState, type ExchangeRecord, type Fighter } from '../../src/engine/duel';
import { FORCE_USER_MIN_LEVEL } from '../../src/data/forceResistance.config';
import { capacity } from '../../src/engine/fatigue';
import { forceCapacity } from '../../src/engine/forceMeter';
import { buildPlayerFighter } from '../../src/features/combat/build';
import { newSession, runSession, sessionOutcome } from '../../src/engine/sparSession';
import { setPlayerCount } from './precogTrial';
import { setForceXpCount } from './forceXpTrial';
import { resetForceXpTrial, summarizeForceXpTrial, type ForceXpTrialSummary } from '../../src/features/progression/forceXpTrialHook';
import { FORCE_XP_TRIAL } from '../../src/engine/forceXpTrial';

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
  /** A spar's mode instead of the rank default (e.g. 'academy': Sith live blades and real wounds, D-144). */
  sparringMode?: 'trainingSaber' | 'controlled' | 'academy';
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
  /** This life's mortal wounds taken and Dying states entered, its disengages and its Sith opponents' withdrawals (reporting only). */
  fightStats?: { mortal: number; dying: number; withdrew: number; sithWithdrew: number; skipped: number; precogFights: number; precogDark: number; precogDarkOpp: number; precogOpp: number };
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
  /** The same over days with no serious or lethal fight (D-159 amended, Jared: the gate checks routine overload, not fight exhaustion). */
  maxDayEndFNoSeriousFight: number;
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
  /** The profile's training start age (the D-235 pace floor counts from it). */
  startAge: number;
  /** The Force XP trial's report (harness only; present while FORCE_XP is collect or on). */
  forceXpTrial?: ForceXpTrialSummary;
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
export const fightStats = { fights: 0, won: 0, lost: 0, wounds: 0, stabilized: 0, mortal: 0, withdrew: 0, sithWithdrew: 0, skipped: 0, precogFights: 0, precogDark: 0, precogDarkOpp: 0, precogOpp: 0 };

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
    // Morale by the kind (D-256), as a generated minion has it.
    morale: moraleFor(k.archetype, k.id),
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
    // A Force-using duelist (Jedi or Sith) breaks late (D-256; half yield, half flee).
    morale: { group: 'late', surrender: 0.5 },
  };
}

/**
 * The profile plays as a sensible Jedi (Jared, D-264; harness input, design defaults): in a real fight it tries to
 * disengage (the game's contest, engine/duel.ts disengageContest) at a beat when it is severely wounded in this fight
 * (a severe or worse wound, or a sever), near Spent (Vitality at nearSpent of its maximum or less) while losing on the
 * track (advantage losingTrack or worse), or facing a clearly stronger opponent (the current one's effective level
 * stronger or more above its own). Legends: Obi-Wan pulling back from Grievous. A failed contest fights on to the next
 * beat; a won one ends the fight as fled.
 */
export const PLAYER_WITHDRAWAL = { nearSpent: 0.2, losingTrack: -2, stronger: 10, enabled: true };

export function withdrawReason(d: DuelState, woundsBefore: number): 'severe' | 'nearSpent' | 'stronger' | null {
  const a = d.a;
  const fresh = a.wounds.slice(woundsBefore);
  if (fresh.some((w) => w.severed || SEVERITIES.indexOf(w.severity) >= SEVERITIES.indexOf('severe'))) return 'severe';
  if (a.vitality <= a.maxVitality * PLAYER_WITHDRAWAL.nearSpent && d.advantage <= PLAYER_WITHDRAWAL.losingTrack) return 'nearSpent';
  const t = currentTarget(d);
  return t !== null && fighterEffectiveLevel(t) - fighterEffectiveLevel(a) >= PLAYER_WITHDRAWAL.stronger ? 'stronger' : null;
}
export const wantsToWithdraw = (d: DuelState, woundsBefore: number): boolean => withdrawReason(d, woundsBefore) !== null;
/** Disengages by trigger and opponent (reporting only): "stronger vs battleDroid" -> count. */
export const withdrawLog: Record<string, number> = {};

/** A real fight beat by beat with the withdrawal rule; with no attempt it is the same fight as running to the end. */
export function fightWithWithdrawal(start: DuelState, ctx: DuelContext, day: number, label = ''): DuelState {
  let d = start;
  for (let guard = 0; guard < 3000 && !d.end; guard++) {
    const run = runUntilBeat(d, ctx, day, 'beat', 3000);
    d = run.state;
    recordMortals(d, run.records);
    const why = d.end || !PLAYER_WITHDRAWAL.enabled ? null : withdrawReason(d, start.a.wounds.length);
    if (!why) continue;
    const c = disengageContest(d);
    d = c.duel;
    if (c.ok) {
      d = { ...d, end: { winner: null, reason: 'stopped' } };
      withdrawLog[`${why} vs ${label}`] = (withdrawLog[`${why} vs ${label}`] ?? 0) + 1;
    }
  }
  return d;
}

/**
 * Fight readiness (Jared, D-267; harness realism): the harness does not start an optional fight (any fight outside
 * the profile's war years: missions, spars, peacetime duels) while a fatigue meter is past its capacity, as a sensible
 * Jedi would not take a mission exhausted. Scheduled war fights still happen.
 */
export const READINESS = { enabled: true };
const inWar = (p: LifeProfile, age: number): boolean => (p.warAges ?? []).some(([a, b]) => age >= a && age < b);
function pastCapacity(s: GameState): boolean {
  const c = selectCapacities(s);
  const m = s.health.meters;
  return m.p > c.p || m.f > c.f || (m.m ?? 0) > c.m;
}

/** One mortal wound taken by the profile, with its context (the D-267 diagnosis; reporting only). */
export interface MortalEvent {
  age: number;
  rank: string;
  stakes: string;
  /** The scheduled opponent: a minion kind, or duelist. */
  kind: string;
  weapon: string;
  forceUser: boolean;
  intent: string;
  margin: number;
  quality: string;
  part: string;
  /** The profile's meters over capacity at the fight's start and right after the hit. */
  start: { p: number; f: number; m: number };
  atHit: { p: number; f: number; m: number };
}
export const mortalEvents: MortalEvent[] = [];
let fightContext: Omit<MortalEvent, 'weapon' | 'forceUser' | 'intent' | 'margin' | 'quality' | 'part' | 'atHit'> & { caps: { p: number; f: number; m: number } } | null = null;

function recordMortals(d: DuelState, records: readonly ExchangeRecord[]): void {
  if (!fightContext) return;
  const ctx = fightContext;
  for (const r of records) {
    if (!r.hit || r.hit.avoided || r.hit.by !== 'B' || r.hit.redirected || r.hit.severity !== 'mortal') continue;
    const o = d.opponents.find((x) => x.id === r.targetId);
    const ratio = (v: number, c: number): number => (c > 0 ? Math.round((v / c) * 100) / 100 : 0);
    mortalEvents.push({
      age: ctx.age,
      rank: ctx.rank,
      stakes: ctx.stakes,
      kind: ctx.kind,
      weapon: o?.weapon ?? '?',
      forceUser: Math.max(o?.forceSense ?? 0, o?.forceResistance ?? 0) >= FORCE_USER_MIN_LEVEL,
      intent: o?.intent ?? 'none',
      margin: Math.round(r.margin * 10) / 10,
      quality: r.hit.quality,
      part: r.hit.part,
      start: ctx.start,
      atHit: { p: ratio(d.a.meters.p, ctx.caps.p), f: ratio(d.a.meters.f, ctx.caps.f), m: ratio(d.a.meters.m ?? 0, ctx.caps.m) },
    });
  }
}

/** One real duel (D-143 B): the engine resolves it; health and progression apply it through their events. */
function realFight(s0: GameState, p: LifeProfile, f: Fight, n: number, age: number): { s: GameState; tankDays: number } {
  let s = s0;
  let player = buildPlayerFighter(s);
  const form = f.skillId === undefined || f.skillId === '$main' ? p.mainForm : f.skillId;
  if (player.form !== null && selectLevelExact(s, form) > 0) player = { ...player, form, skillId: form, level: selectPerformance(s, form) };
  const level = player.level + f.gap;
  // Strike intent (D-260), as the game sets it: a minion by its kind's archetype; a Force-using duelist of the other order
  // (a Sith against a Jedi profile kills; a Jedi against a Sith profile disarms, and kills in lethal stakes); a sparring
  // partner is of the profile's own order.
  const kindArch = MINION_KINDS.find((k) => k.id === f.opponent)?.archetype ?? 'soldier';
  const ownJedi = p.path !== 'sith' && p.path !== 'career';
  const duelistArch = f.stakes === 'spar' ? (ownJedi ? 'jediGuardian' : 'sithWarrior') : ownJedi ? 'sithWarrior' : 'jediGuardian';
  // A Sith duelist withdraws when losing (D-263), as the game sets it for a named Sith; nobody here wants the profile
  // alive, so no capture (D-262).
  const opponents =
    f.opponent && f.opponent !== 'duelist'
      ? Array.from({ length: f.count ?? 3 }, (_, i) => ({ ...minionFighter(f.opponent!, `m${n}-${i}`, level, i % 5 < 3), intent: strikeIntentFor(kindArch, f.stakes, false, null) }))
      : Array.from({ length: f.stakes === 'spar' ? (f.partners ?? 1) : 1 }, (_, i) => ({ ...duelistFighter(`d${n}-${i}`, level, player.maxVitality), intent: strikeIntentFor(duelistArch, f.stakes, false, null), ...(f.stakes !== 'spar' && withdrawChanceFor(duelistArch) > 0 ? { withdraw: withdrawChanceFor(duelistArch) } : {}) }));
  const sparring = f.stakes === 'spar' ? (f.sparringMode ?? SPARRING_DEFAULT_BY_RANK[s.ranks.rank] ?? 'trainingSaber') : null;
  if (sparring === 'trainingSaber') player = { ...player, weapon: 'trainingSaber' };
  const ctx: DuelContext = { sparring, situations: [], footing: 0, dyingRiskStakes: f.stakes === 'lethal' || f.stakes === 'serious' };
  const start = startDuel(player, sparring === 'trainingSaber' ? opponents.map((o) => (o.weapon === 'lightsaber' ? { ...o, weapon: 'trainingSaber' as const } : o)) : opponents, s.meta.rngState);
  // A spar is a session of bouts up to 34 exchanges (D-168); a real fight runs to its end, or until the profile
  // disengages (D-264).
  {
    const c = selectCapacities(s);
    const m = s.health.meters;
    const r = (v: number, cap: number): number => (cap > 0 ? Math.round((v / cap) * 100) / 100 : 0);
    fightContext = { age: Math.floor(age), rank: s.ranks.rank, stakes: f.stakes, kind: f.opponent ?? 'duelist', start: { p: r(m.p, c.p), f: r(m.f, c.f), m: r(m.m ?? 0, c.m) }, caps: { p: c.p, f: c.f, m: c.m } };
  }
  const sess = sparring ? runSession(start, newSession(), ctx, s.clock.now.day) : null;
  const d = sess ? sess.duel : fightWithWithdrawal(start, ctx, s.clock.now.day, `${f.opponent ?? 'duelist'} ${f.stakes} at age ${Math.floor(age)}`);
  if (!sess) {
    if (d.end?.reason === 'stopped') fightStats.withdrew += 1;
    if (d.opponents.some((o) => o.yielded === 'withdrew')) fightStats.sithWithdrew += 1;
    // The M6 precognition trial (harness only): real fights in which the profile, or a Force-using opponent, reached
    // running on will (senses dark) mid-fight.
    if (d.a.precogTrial) {
      fightStats.precogFights += 1;
      if (d.a.precogTrial.dark) fightStats.precogDark += 1;
    }
    for (const o of d.opponents) {
      if (!o.precogTrial || o.forceSense < FORCE_USER_MIN_LEVEL) continue;
      fightStats.precogOpp += 1;
      if (o.precogTrial.dark) fightStats.precogDarkOpp += 1;
    }
  }
  s = { ...s, meta: { ...s.meta, rngState: d.rng } };
  const outcome = sess ? sessionOutcome(sess.session) : d.end?.winner === 'A' ? 'won' : d.end?.winner === 'B' ? 'lost' : 'fled';
  if (outcome === 'won') fightStats.won += 1;
  else fightStats.lost += 1;
  const newWounds = d.a.wounds.slice(player.wounds.length);
  fightStats.wounds += newWounds.length;
  fightStats.mortal += newWounds.filter((w) => w.severity === 'mortal').length;
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
  const statsBefore = { ...fightStats };
  setPlayerCount(p.seed);
  setForceXpCount(p.seed);
  resetForceXpTrial();
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
  let maxDayEndFNoSeriousFight = 0;
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
    const scheduled = tankDays > 0 ? [] : (p.fights?.(age, day) ?? []);
    const fights: Fight[] = [];
    for (const f of scheduled) {
      // Fight readiness (candidate c, measured only): an optional fight (outside the war years) is skipped while a
      // meter is past its capacity.
      if (READINESS.enabled && !inWar(p, age) && pastCapacity(s)) {
        fightStats.skipped += 1;
        continue;
      }
      fights.push(f);
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
      if (!fights.some((f) => f.stakes === 'serious' || f.stakes === 'lethal')) maxDayEndFNoSeriousFight = Math.max(maxDayEndFNoSeriousFight, d.endF);
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
  // This life's mortal wounds and Dying states (every Dying profile is stabilized, so the stabilizations count them).
  const fights = { mortal: fightStats.mortal - statsBefore.mortal, dying: fightStats.stabilized - statsBefore.stabilized, withdrew: fightStats.withdrew - statsBefore.withdrew, sithWithdrew: fightStats.sithWithdrew - statsBefore.sithWithdrew, skipped: fightStats.skipped - statsBefore.skipped, precogFights: fightStats.precogFights - statsBefore.precogFights, precogDark: fightStats.precogDark - statsBefore.precogDark, precogDarkOpp: fightStats.precogDarkOpp - statsBefore.precogDarkOpp, precogOpp: fightStats.precogOpp - statsBefore.precogOpp };
  return { xp, milestones, yearMain, yearCombat, cross, mainByYear, levelsByYear, transfers, maxDayEndF, maxDayEndFNoSeriousFight, discarded, state: s, eAtMilestone, bankShare: drillTotal > 0 ? bankedTotal / drillTotal : 0, woundedDaysByAge, tankDays: tankDayCount, maxDay, startAge: p.startAge, fightStats: fights, ...(FORCE_XP_TRIAL.enabled || FORCE_XP_TRIAL.collect ? { forceXpTrial: summarizeForceXpTrial() } : {}) };
}
