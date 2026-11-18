// Duel simulation helpers for the rolls.md §8 tables (M5 step 3). Reference fighters: equal-Vitality Force users
// (a Knight's 63.5 Vitality, Endurance 50, Willpower 50), level = form level = Force Sense, lightsabers, no armor.
import type { DuelContext, Fighter } from '../../src/engine/duel';
import { runUntilBeat, startDuel, type SideId } from '../../src/engine/duel';
import { capacity, forceCapacity } from '../../src/engine/fatigue';
import { seedRng } from '../../src/engine/rng';

export function forceUser(id: string, level: number, over: Partial<Fighter> = {}): Fighter {
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
    willpower: 50,
    agility: 50,
    endurance: 50,
    shatterpoint: 0,
    lightSide: false,
    minion: false,
    stateOfMind: null,
    stance: 'balanced',
    vitality: 63.5,
    maxVitality: 63.5,
    wounds: [],
    lasting: [],
    meters: { p: 0, f: 0 },
    caps: { p: capacity(50), f: forceCapacity(level, 50) },
    position: 0,
    disarmedFor: 0,
    insightUsed: false,
    shatterpointUsed: false,
    out: false,
    engagedElsewhere: false,
    dead: false,
    pendingManeuver: null,
    ...over,
  };
}

export const REAL: DuelContext = { sparring: null, situations: [], footing: 0, dyingRiskStakes: true };

export interface SimStats {
  winRateA: number;
  medianExchanges: number;
}

/** n seeded duels of A against B (fresh fighters each time); A's win rate and the median exchange count. */
export function simulate(make: () => { a: Fighter; b: Fighter; surprise?: SideId | null; setup?: (s: ReturnType<typeof startDuel>) => ReturnType<typeof startDuel> }, n: number, seed: string, ctx: DuelContext = REAL): SimStats {
  let wins = 0;
  const lengths: number[] = [];
  let rng = seedRng(seed);
  for (let i = 0; i < n; i++) {
    const { a, b, surprise = null, setup } = make();
    let s = startDuel(a, [b], rng, surprise);
    if (setup) s = setup(s);
    const r = runUntilBeat(s, ctx, 0, 'toEnd', 2000);
    rng = r.state.rng;
    if (r.state.end?.winner === 'A') wins++;
    lengths.push(r.state.exchange);
  }
  lengths.sort((x, y) => x - y);
  return { winRateA: wins / n, medianExchanges: lengths[Math.floor(n / 2)]! };
}
