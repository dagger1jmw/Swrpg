// m9-tune2 addendum 3 (report only; npx vitest run --config vitest.measure.config.ts tests/measure/tiredFight.measure.ts): the same live
// fight and the same spar at rest, at moderate strain, near the hard limit, and pushing through from rest, 1,000 runs each. Per run:
// form XP, Willpower XP and Endurance XP (M 1.0, the combat branch of computeXp), the exchanges until the hard limit, the injuries by
// worst severity, and (live) the deaths. The fighter is a Knight with Soresu 60 (Willpower 50); the live fight is a lethal duel with a
// Sith duelist of the same level who fights to kill; the spar is a training-saber session with a peer of the same level.
import { it } from 'vitest';
import { PHYSICAL_COLLAPSE, SEVERITIES } from '../../src/data/health.config';
import { strikeIntentFor } from '../../src/data/combat.config';
import { xpForLevel } from '../../src/engine/curve';
import { computeCombatXp, fightExchanges } from '../../src/engine/combatXp';
import { runUntilBeat, startDuel, strainOf, type DuelContext, type DuelState, type Fighter } from '../../src/engine/duel';
import { seedRng, type RngState } from '../../src/engine/rng';
import { newSession, runSession } from '../../src/engine/sparSession';
import { buildPlayerFighter } from '../../src/features/combat/build';
import type { GameState } from '../../src/state/gameState';
import { base } from '../support/schemaSituations';
import { duelistFighter } from '../support/lifetime';

const RUNS = 1000;
const STRAIN: Record<string, { strain: number; push: boolean }> = {
  rest: { strain: 0, push: false },
  moderate: { strain: 1.0, push: false },
  'moderate, pushing': { strain: 1.0, push: true },
  'near the hard limit': { strain: 3.8, push: false },
  'pushing from rest': { strain: 0, push: true },
};

function knight(): GameState {
  const s = base();
  const skills = { ...s.progression.skills, soresu: { xp: xpForLevel(60), rust: 0, lastPracticedDay: null }, willpower: { xp: xpForLevel(50), rust: 0, lastPracticedDay: null }, endurance: { xp: xpForLevel(50), rust: 0, lastPracticedDay: null } };
  return { ...s, progression: { ...s.progression, skills } } as GameState;
}

interface Tally { form: number; will: number; end: number; exchanges: number; toLimit: number[]; injuries: Record<string, number>; deaths: number; collapses: number }

function measure(live: boolean, mode: { strain: number; push: boolean }): Tally {
  const s = knight();
  const p0 = buildPlayerFighter(s);
  const t: Tally = { form: 0, will: 0, end: 0, exchanges: 0, toLimit: [], injuries: {}, deaths: 0, collapses: 0 };
  let rng: RngState = seedRng(`tired-${live}-${mode.strain}-${mode.push}`);
  for (let i = 0; i < RUNS; i++) {
    const a: Fighter = { ...p0, meters: { ...p0.meters, p: p0.caps.p * mode.strain }, ...(mode.push ? { pushing: true } : {}), ...(live ? {} : { weapon: 'trainingSaber' as const }) };
    const opp = { ...duelistFighter('sith', p0.level, p0.maxVitality), intent: strikeIntentFor(live ? 'sithWarrior' : 'jediGuardian', live ? 'lethal' : 'spar', false, null), ...(live ? {} : { weapon: 'trainingSaber' as const }) };
    const ctx: DuelContext = live ? { sparring: null, situations: [], footing: 0, dyingRiskStakes: true } : { sparring: 'trainingSaber', situations: [], footing: 0, dyingRiskStakes: false };
    const start = startDuel(a, [opp], rng);
    let d: DuelState;
    let bouts: number[] = [];
    if (live) d = runUntilBeat(start, ctx, 0, 'toEnd', 400).state;
    else {
      const r = runSession(start, newSession(), ctx, 0);
      d = r.duel;
      bouts = r.session.bouts.map((b) => b.exchanges);
    }
    rng = d.rng;
    const ex = fightExchanges(d.log, { skillAt: () => 'soresu', boutLengths: bouts, willpower: a.willpower });
    const outcome = d.end?.winner === 'A' ? 'won' : d.end?.winner === 'B' ? 'lost' : 'fled';
    const xp = computeCombatXp({ session: { stakes: live ? 'lethal' : 'spar', outcome, exchanges: ex, forceUses: [] }, m: () => 1, physicalWeights: () => ({}), clamp: (_k, w) => ({ credited: w, discarded: 0 }) }).credited;
    t.form += xp['soresu'] ?? 0;
    t.will += xp['willpower'] ?? 0;
    t.end += xp['endurance'] ?? 0;
    t.exchanges += ex.length;
    // Exchanges until the hard limit: the first exchange that starts past it (the fighter collapses there).
    const k = d.log.findIndex((r) => (r.strainA ?? 0) >= PHYSICAL_COLLAPSE.hardLimit);
    if (k >= 0 || strainOf(d.a) > PHYSICAL_COLLAPSE.hardLimit) t.toLimit.push(k >= 0 ? k : d.log.length);
    if (strainOf(d.a) > PHYSICAL_COLLAPSE.hardLimit) t.collapses += 1;
    const fresh = d.a.wounds.slice(a.wounds.length);
    const worst = fresh.reduce((w, x) => Math.max(w, SEVERITIES.indexOf(x.severity)), -1);
    const key = worst < 0 ? 'none' : SEVERITIES[worst]!;
    t.injuries[key] = (t.injuries[key] ?? 0) + 1;
    if (d.a.dead) t.deaths += 1;
  }
  return t;
}

it('tired fights and spars (m9-tune2 addendum 3e)', { timeout: 600_000 }, () => {
  for (const live of [true, false]) {
    for (const [name, mode] of Object.entries(STRAIN)) {
      const t = measure(live, mode);
      const pct = (n: number) => `${((100 * n) / RUNS).toFixed(1)}%`;
      const lim = t.toLimit.length ? `${(t.toLimit.reduce((x, y) => x + y, 0) / t.toLimit.length).toFixed(1)} (reached in ${pct(t.toLimit.length)})` : 'never';
      console.info(`[tired] ${live ? 'live lethal duel' : 'training-saber spar'} | ${name} | form XP ${(t.form / RUNS).toFixed(3)} | Willpower XP ${(t.will / RUNS).toFixed(3)} | Endurance XP ${(t.end / RUNS).toFixed(3)} | exchanges ${(t.exchanges / RUNS).toFixed(1)} | to the hard limit ${lim} | collapsed ${pct(t.collapses)} | injuries ${Object.entries(t.injuries).map(([k, v]) => `${k} ${pct(v)}`).join(', ')}${live ? ` | deaths ${pct(t.deaths)}` : ''}`);
    }
  }
});
