// The accelerated-path check (Jared, D-418; progression-numbers §21). Luke on the accelerated path, with an exceptional
// teacher (the master stub: the x1.15 cap of the teacher factor) at a Force-rich place (Dagobah), reaches the level of a
// powerful Knight in about 4 years: an outlier, not calibration data. The bonus (ACCELERATED_PATH) is a first guess;
// this run reports the numbers it is tuned from. The 4.0x calibration and the averages are not changed for it.
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { paceFloorYears } from './checks';
import { LUKE_ACCELERATED, gated } from './profiles';

/** "A powerful Knight" (stats spec §bands: 40 a new Knight, 60 a Master): about 55 in the main Force skill and blade. */
export const POWERFUL_KNIGHT = 55;
const TRACK = ['forceControl', 'forceSense', 'djemSo', 'forceSpeed', 'forceKnowledge', 'meditation', 'intelligence', 'willpower'];
let r: LifeResult;
beforeAll(() => {
  r = runLifetime(gated(LUKE_ACCELERATED), 6, { track: TRACK });
  const rows = r.levelsByYear.map((o, i) => `${19 + i + 1}: ${TRACK.map((k) => `${k} ${o[k]!.toFixed(1)}`).join(', ')}`);
  console.info(`[report luke-accelerated] milestones ${JSON.stringify(r.milestones)} discarded ${r.discarded.toFixed(0)} XP; the 4.0x floor from 19: 41 at ${paceFloorYears(19, 41).toFixed(2)} y, 55 at ${paceFloorYears(19, 55).toFixed(2)} y\n${rows.join('\n')}`);
}, 600_000);

describe('Luke on the accelerated path (D-418)', () => {
  it('goes past the 4.0x ceiling (the only condition allowed to)', () => {
    expect(r.milestones[41]!).toBeLessThan(paceFloorYears(19, 41));
  });
  it('reaches a powerful Knight (about 55) in Force Control and the blade in about 4 years (3-5)', () => {
    const at = (k: string, years: number): number => r.levelsByYear[years - 1]![k]!;
    expect(at('forceControl', 5)).toBeGreaterThanOrEqual(POWERFUL_KNIGHT);
    expect(at('djemSo', 5)).toBeGreaterThanOrEqual(POWERFUL_KNIGHT);
    expect(at('forceControl', 3)).toBeLessThan(POWERFUL_KNIGHT + 10);
  });
  it('leaves knowledge and meditation low (no study on the path)', () => {
    const y4 = r.levelsByYear[3]!;
    expect(y4['forceKnowledge']!).toBeLessThan(25);
    expect(y4['meditation']!).toBeLessThan(25);
  });
});
