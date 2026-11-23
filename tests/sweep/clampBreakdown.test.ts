// Report probe (D-457, Jared): a profile's XP per hour in a skill against the Average's, by multiplier, for the year
// starting at each probe age (gated seed). Per training session with the skill as a primary, the engine's own rate:
// XP / window hour = (effective h / h) x intensity XP x challenge x outcome x M (computeXp: xp = effH x I x c x o x share x
// M on hours h x share), and M = talent x cross-talent x instruction x age x state x species (x place, accelerated,
// review). Factors are hours-weighted geometric means, so their product is the sessions' geometric-mean rate. "window"
// is the pace window's own rate (training, combat, synergy, secondary use: what the clamp compares).
// SKILL (default soresu), AGES (default 15,25,40), PROFILE (default obiwan).
import { it } from 'vitest';
import { INTENSITY } from '../../src/data/progression.config';
import { rateAvg } from '../../src/engine/paceClamp';
import { ANAKIN, AVERAGE, gated, LUKE, OBIWAN } from '../lifetime/profiles';
import { runLifetime, type LifeProfile } from '../support/lifetime';

const SKILL = process.env['SKILL'] ?? 'soresu';
const AGES = (process.env['AGES'] ?? '15,25,40').split(',').map(Number);
const PROFILES: Record<string, LifeProfile> = { obiwan: OBIWAN, anakin: ANAKIN, luke: LUKE, average: AVERAGE };
const FACTORS = ['effective', 'intensity', 'challenge', 'outcome', 'talent', 'crossTalent', 'instruction', 'age', 'state', 'species', 'place', 'accelerated', 'review'] as const;
type Factor = (typeof FACTORS)[number];

interface Bucket {
  hours: number;
  log: Record<Factor, number>;
  logRate: number;
  bySource: Record<string, { hours: number; logInstr: number }>;
}

function probe(p: LifeProfile): { buckets: Record<number, Bucket>; window: Record<number, { xp: number; hours: number }>; discarded: Record<string, number>; discardedByAge: Record<number, Record<string, number>> } {
  const buckets: Record<number, Bucket> = {};
  const discardedByAge: Record<number, Record<string, number>> = {};
  const r = runLifetime(gated(p), Math.max(...AGES) + 1 - p.startAge + 0.01, {
    paceRates: true,
    onRoutineDays: (days, { age }) => {
      const a = Math.floor(age);
      for (const d of days)
        for (const ss of d.sessions) {
          for (const [k, v] of Object.entries(ss.discarded ?? {})) (discardedByAge[a] ??= {})[k] = (discardedByAge[a]?.[k] ?? 0) + v;
          const sp = ss.factors?.speed[SKILL];
          if (!AGES.includes(a) || !sp || !ss.factors || ss.hours <= 0) continue;
          const b = (buckets[a] ??= { hours: 0, log: Object.fromEntries(FACTORS.map((f) => [f, 0])) as Record<Factor, number>, logRate: 0, bySource: {} });
          const f: Record<Factor, number> = {
            effective: ss.factors.effectiveHours / ss.hours,
            intensity: INTENSITY[ss.factors.intensity as keyof typeof INTENSITY].xp,
            challenge: ss.challenge ?? 1,
            outcome: ss.factors.outcomeMult,
            talent: sp.talent,
            crossTalent: sp.crossTalent,
            instruction: sp.instruction,
            age: sp.age,
            state: sp.state,
            species: sp.species,
            place: sp.place,
            accelerated: sp.accelerated,
            review: sp.review,
          };
          const h = ss.hours;
          b.hours += h;
          for (const k of FACTORS) b.log[k] += h * Math.log(Math.max(1e-9, f[k]));
          b.logRate += h * Math.log(Math.max(1e-9, f.effective * f.intensity * f.challenge * f.outcome * sp.m));
          const src = `${ss.activityId}${ss.fill ? ' (fill)' : ''}`;
          const s = (b.bySource[src] ??= { hours: 0, logInstr: 0 });
          s.hours += h;
          s.logInstr += h * Math.log(sp.instruction);
        }
    },
  });
  const window: Record<number, { xp: number; hours: number }> = {};
  for (const a of AGES) {
    const row = r.paceRates?.[a - p.startAge]?.[SKILL];
    if (row) window[a] = row;
  }
  return { buckets, window, discarded: r.discardedBySkill, discardedByAge };
}

it('clamp breakdown', () => {
  const name = process.env['PROFILE'] ?? 'obiwan';
  const t0 = Date.now();
  const me = probe(PROFILES[name]!);
  const avg = probe(AVERAGE);
  const g = (b: Bucket | undefined, k: Factor): number => (b && b.hours > 0 ? Math.exp(b.log[k] / b.hours) : NaN);
  const rate = (b: Bucket | undefined): number => (b && b.hours > 0 ? Math.exp(b.logRate / b.hours) : NaN);
  for (const a of AGES) {
    const m = me.buckets[a];
    const v = avg.buckets[a];
    const wm = me.window[a];
    const wv = avg.window[a];
    const table = rateAvg(SKILL, a);
    console.info(`[breakdown] ${name} ${SKILL} year from ${a}: sessions ${m?.hours.toFixed(0) ?? 0} h (Average ${v?.hours.toFixed(0) ?? 0} h)`);
    console.info(`[breakdown]   session rate ${rate(m).toFixed(3)} XP/h vs Average ${rate(v).toFixed(3)} = x${(rate(m) / rate(v)).toFixed(2)}`);
    console.info(`[breakdown]   window rate ${wm ? (wm.xp / wm.hours).toFixed(3) : '-'} XP/h (${wm?.xp.toFixed(0)} XP / ${wm?.hours.toFixed(0)} h) vs Average ${wv ? (wv.xp / wv.hours).toFixed(3) : '-'} (gated seed), table ${table.toFixed(3)}: x${wm ? (wm.xp / wm.hours / table).toFixed(2) : '-'} of the table (cap x4.00)`);
    for (const k of FACTORS) {
      const x = g(m, k);
      const y = g(v, k);
      if (Math.abs(x - 1) < 1e-9 && Math.abs(y - 1) < 1e-9) continue;
      console.info(`[breakdown]   ${k.padEnd(12)} ${x.toFixed(3)} vs ${y.toFixed(3)} = x${(x / y).toFixed(3)}`);
    }
    const srcs = (b: Bucket | undefined): string => Object.entries(b?.bySource ?? {}).map(([k, s]) => `${k} ${s.hours.toFixed(0)} h x${Math.exp(s.logInstr / s.hours).toFixed(3)}`).join('; ');
    console.info(`[breakdown]   teacher by block: ${srcs(m)} | Average: ${srcs(v)}`);
    console.info(`[breakdown]   discarded that year: ${JSON.stringify(me.discardedByAge[a] ?? {})}`);
  }
  console.info(`[breakdown] ${name} discarded over the run, per skill (training and combat): ${JSON.stringify(Object.fromEntries(Object.entries(me.discarded).map(([k, v]) => [k, Math.round(v)])))}`);
  console.info(`[breakdown] Average discarded over the run: ${JSON.stringify(Object.fromEntries(Object.entries(avg.discarded).map(([k, v]) => [k, Math.round(v)])))}`);
  console.info(`[breakdown-runtime] ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}, 3_600_000);
