// opt-2 D2 (reports/opt-2.md): a simulated year's mission spacing for a Padawan, a Knight and a soldier, in peace and in war,
// from the duty roll itself (missionChance with each one's median). A mission lasts MISSION_DAYS here (a harness figure, invented:
// in play the narrator's thread and the trip home decide). 20 seeds x 10 years each. Writes JSON to SPACING_OUT.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { MISSION_ROLL, MISSION_SCALE_BY_CAREER, MISSION_SCALE_BY_RANK } from '../../src/data/duty.config';
import { nextFloat, seedRng } from '../../src/engine/rng';
import { missionChance } from '../../src/features/duty/rules';

const MISSION_DAYS = 14;
const WHO: Record<string, number> = { padawan: MISSION_SCALE_BY_RANK['padawan']!, knight: MISSION_SCALE_BY_RANK['knight']!, soldier: MISSION_SCALE_BY_CAREER['soldier']! };

it('mission spacing', () => {
  const out: Record<string, unknown> = {};
  for (const [who, scale] of Object.entries(WHO)) {
    for (const era of ['peace', 'war'] as const) {
      const median = (era === 'war' ? MISSION_ROLL.medianWar : MISSION_ROLL.medianPeace) * scale;
      const gaps: number[] = [];
      const perYear: number[] = [];
      for (let seed = 0; seed < 20; seed++) {
        let rng = seedRng(`spacing-${who}-${era}-${seed}`);
        for (let year = 0; year < 10; year++) {
          let day = 0;
          let off = 0;
          let n = 0;
          while (day < 365) {
            day++;
            off++;
            let u: number;
            [u, rng] = nextFloat(rng);
            if (u < missionChance(off, median)) {
              gaps.push(off);
              n++;
              day += MISSION_DAYS;
              off = 0;
            }
          }
          perYear.push(n);
        }
      }
      gaps.sort((a, b) => a - b);
      perYear.sort((a, b) => a - b);
      const q = (a: number[], p: number) => a[Math.min(a.length - 1, Math.floor(p * a.length))]!;
      out[`${who} ${era}`] = { median, gapP10: q(gaps, 0.1), gapMedian: q(gaps, 0.5), gapP90: q(gaps, 0.9), past60: Math.round((100 * gaps.filter((g) => g > 60).length) / gaps.length), missionsPerYearMedian: q(perYear, 0.5), missionsRange: [perYear[0], perYear[perYear.length - 1]] };
    }
  }
  writeFileSync(process.env['SPACING_OUT'] ?? 'mission-spacing.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
});
