// Lifetime harness (M4; progression-targets §6 test 1, progression-numbers §20 test 1; D-49). Runs a
// calibration profile through the REAL game: a GameState from createInitialState, the player's routine
// (routines feature + scheduler), and advanceByRoutine (the montage day loop, every §10 hook in order).
// Rank changes at the profile's ages use the engine rankSet event (D-131, until M7); combat comes from
// scripted fights through fightResolved (combat-xp.md, stub STUB_SCRIPTED_COMBAT until M5).
// Replaces the M3 test-only profile runner.
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { levelExact } from '../../src/engine/curve';
import { selectLevelExact, selectPerformance } from '../../src/features/progression/selectors';
import type { Priority } from '../../src/features/routines/selectors';
import { advanceByRoutine, nextWakeAbs } from '../../src/state/advanceRoutine';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { GameEvent } from '../../src/state/types';

export const DAYS = 368;
const WAKE = 6 * 3600;

export type Talents = Partial<Record<'combat' | 'force' | 'physical' | 'mind', 'none' | 'gifted' | 'prodigy' | 'exceptional'>>;

export interface Fight {
  stakes: 'spar' | 'skirmish' | 'serious' | 'lethal';
  outcome: 'won' | 'lost' | 'fled' | 'truce';
  /** Exchanges by the skill used ('$main' = the profile's main form). */
  exchanges: number;
  gap: number;
  skillId?: string;
  forceUses?: { abilityId: string; count: number; gap: number };
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
}

const START_DAY = absDayFromDate({ year: -3700, month: 1, day: 1 });

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
  let discarded = 0;
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
    // Scripted fights in the morning, before the day's routine (combat-xp.md, D-127).
    const fights = p.fights?.(age, day) ?? [];
    if (fights.length) {
      const evs: GameEvent[] = fights.map((f) => {
        const skillId = f.skillId === undefined || f.skillId === '$main' ? p.mainForm : f.skillId;
        return {
          type: 'fightResolved',
          stakes: f.stakes,
          outcome: f.outcome,
          exchanges: Array.from({ length: f.exchanges }, () => ({ skillId, gap: f.gap })),
          forceUses: f.forceUses ? Array.from({ length: f.forceUses.count }, () => ({ abilityId: f.forceUses!.abilityId, gap: f.forceUses!.gap })) : [],
        };
      });
      const r = applyEvents(REGISTRY, s, evs, { source: 'engine' });
      if (r.rejected.length) throw new Error(`fight rejected: ${r.rejected[0]!.reason}`);
      for (const k of mainKeys()) yearFightXp[k] = (yearFightXp[k] ?? 0) + (r.state.progression.skills[k]?.xp ?? 0) - (s.progression.skills[k]?.xp ?? 0);
      s = r.state;
    }
    const until = nextWakeAbs(s.clock.now.day * 86_400 + s.clock.now.second + 1, WAKE);
    const r = advanceByRoutine(REGISTRY, s, { untilAbs: until, reason: 'lifetime' });
    if (r.rejected.length) throw new Error(`rejected: ${JSON.stringify(r.rejected[0])}`);
    for (const a of r.applied) {
      if (a.event.type !== 'activityResolved') continue;
      const tr = (a.event['transfer'] as Record<string, number> | undefined) ?? {};
      for (const [f, x] of Object.entries(tr)) {
        transfers[f] = { age, xp: x };
        yearXp[f] = (yearXp[f] ?? 0) - x;
      }
      for (const n of a.notes) if (n.startsWith('4.0x')) discarded += 1;
    }
    s = r.state;
    for (const d of r.days) maxDayEndF = Math.max(maxDayEndF, d.endF);
    for (const k of mainKeys()) yearXp[k] = (yearXp[k] ?? 0) + (s.progression.skills[k]?.xp ?? 0) - (before[k]?.xp ?? 0);

    const ageEnd = p.startAge + (day + 1) / DAYS;
    const lvl = mainLevel(s);
    for (const t of [21, 41, 61, 81, 101]) if (milestones[t] === undefined && lvl >= t) milestones[t] = (day + 1) / DAYS;
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
  return { xp, milestones, yearMain, yearCombat, cross, mainByYear, levelsByYear, transfers, maxDayEndF, discarded, state: s };
}
