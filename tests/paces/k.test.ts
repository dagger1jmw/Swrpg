// K re-solve (D-431): the Average (gated seed) through the day loop; prints when the highest form crosses 41 and the K
// that puts the highest form's XP at 16.0 years exactly on level 41 (K' = XP / 41^1.75). Iterate: set K, run again.
// Also prints the rank-minimum stats (D-426: the Knight minimums are the Average at 24, the Master's main specialty the
// Average at 40, D-437). Run: npm run ksolve.
import { it } from 'vitest';
import { CURVE_EXP, K } from '../../src/data/progression.config';
import { FORM_IDS } from '../../src/data/skills';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { DAYS, runLifetime } from '../support/lifetime';
import { AVERAGE, gated } from '../lifetime/profiles';

it('K solve', () => {
  let xpAt16 = 0;
  const at: Record<number, string> = {};
  const r = runLifetime(gated(AVERAGE), 37, {
    onDay: (s, { day, age }) => {
      if (day + 1 === Math.round(16 * DAYS)) xpAt16 = Math.max(...FORM_IDS.map((f) => s.progression.skills[f]?.xp ?? 0));
      for (const a of [24, 40]) {
        if (at[a] === undefined && age >= a) {
          const hf = Math.max(...FORM_IDS.map((f) => selectLevelExact(s, f)));
          at[a] = `highest form ${hf.toFixed(1)}, forceControl ${selectLevelExact(s, 'forceControl').toFixed(1)}, forceSense ${selectLevelExact(s, 'forceSense').toFixed(1)}, willpower ${selectLevelExact(s, 'willpower').toFixed(1)}`;
        }
      }
    },
  });
  console.info(`[k] K ${K}: 21 at ${r.milestones[21]?.toFixed(3)}, 41 at ${r.milestones[41]?.toFixed(3)}; highest form XP at 16.0 ${xpAt16.toFixed(1)}; K' ${(xpAt16 / Math.pow(41, CURVE_EXP)).toFixed(3)}`);
  console.info(`[k] Average at 24: ${at[24]}; at 40: ${at[40]}`);
}, 900_000);
