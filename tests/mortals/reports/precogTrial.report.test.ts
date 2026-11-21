// Report only (docs-v2/testing/precog-m6-trial.md): precognition by rank under the PRECOG_M6 trial, or the M5 rule when it
// is off. Equal-level duels between the duel-table reference fighters (forceUser: level = form = Force Sense, Willpower
// 50, average Jedi Potential), 4,000 a row, plus the rolls §8 table pairs (A at 50 + gap vs B at 50). Per row: duels,
// median length, the share of fighter-duels whose senses went dark (running on will) and the median exchange it
// happened, the end-of-duel pool share and strain (medians), the worst tier reached, and precognition triggers per
// exchange with the M5 meter fraction at the end (the unit conversion's evidence).
import { it } from 'vitest';
import { runUntilBeat, startDuel, type DuelState, type Fighter } from '../../../src/engine/duel';
import { forceFraction } from '../../../src/engine/forceMeter';
import { seedRng } from '../../../src/engine/rng';
import { applyCandidate } from '../../support/candidates';
import { REAL, forceUser } from '../../support/duelSim';

const candidate = applyCandidate(process.env['CANDIDATE']);
const N = 4_000;
const TIERS = ['fresh', 'taxed', 'strained', 'exhausted', 'onWill'];

const median = (xs: readonly number[]): number => {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)]!;
};
const pct = (x: number): string => (x * 100).toFixed(1);

function row(label: string, la: number, lb: number, seed: string): string {
  let rng = seedRng(seed);
  const lengths: number[] = [];
  const darkAt: number[] = [];
  const poolEnd: number[] = [];
  const strainEnd: number[] = [];
  const worst = [0, 0, 0, 0, 0];
  let fighters = 0;
  let dark = 0;
  let darkA = 0;
  let triggers = 0;
  let exchanges = 0;
  for (let i = 0; i < N; i++) {
    const s0: DuelState = startDuel(forceUser('A', la), [forceUser('B', lb)], rng, null);
    const r = runUntilBeat(s0, REAL, 0, 'toEnd', 2000);
    rng = r.state.rng;
    lengths.push(r.state.exchange);
    exchanges += r.state.exchange;
    for (const rec of r.records) for (const n of rec.notes ?? []) if (/: precognition/.test(n)) triggers++;
    const all: Fighter[] = [r.state.a, ...r.state.opponents];
    for (const f of all) {
      fighters++;
      strainEnd.push(forceFraction(f.meters.f, f.caps.f));
      const t = f.precogTrial;
      if (!t) continue;
      poolEnd.push(t.poolMax > 0 ? t.pool / t.poolMax : 0);
      worst[t.worstTier]! += 1;
      if (t.dark) {
        dark++;
        if (f.id === 'A') darkA++;
        if (t.darkAt !== null) darkAt.push(t.darkAt);
      }
    }
  }
  const tiers = worst.map((w, k) => `${TIERS[k]} ${pct(w / fighters)}`).join(' ');
  return `${label}: median ${median(lengths)}; dark ${pct(dark / fighters)}% of fighters (A ${pct(darkA / N)}%), median at exchange ${median(darkAt)}; end pool ${pct(median(poolEnd))}%, end strain ${median(strainEnd).toFixed(2)}; worst tier ${tiers}; triggers/exchange ${(triggers / Math.max(1, exchanges)).toFixed(3)}`;
}

it('precognition by rank (PRECOG_M6 trial or M5)', () => {
  const rows = [
    row('Padawan 25 v 25', 25, 25, 'pt25'),
    row('Padawan 35 v 35', 35, 35, 'pt35'),
    row('Padawan 30 v Knight 45', 30, 45, 'pt30v45'),
    row('Knight 45 v 45', 45, 45, 'pt45'),
    row('Senior Knight 55 v 55', 55, 55, 'pt55'),
    row('Master 70 v 70', 70, 70, 'pt70'),
    row('Master 85 v 85', 85, 85, 'pt85'),
    row('Master 100 v 100', 100, 100, 'pt100'),
    ...[0, 5, 10, 20, 30, 40, 60].map((g) => row(`table gap ${g} (${50 + g} v 50)`, 50 + g, 50, `ptg${g}`)),
  ];
  console.info(`[precog-trial] ${candidate}:\n  ${rows.join('\n  ')}`);
}, 0);
