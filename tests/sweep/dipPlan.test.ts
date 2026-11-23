// Diagnosis probe 2 (item 2): conditional rests taken or skipped in the planner's projection, and the trims, per year.
import { it } from 'vitest';
import { selectCapacities } from '../../src/features/progression/selectors';
import { selectMeters } from '../../src/features/health/selectors';
import { planDay, selectActiveRoutine, selectFillCredit } from '../../src/features/routines/selectors';
import { gated, AVERAGE } from '../lifetime/profiles';
import { runLifetime } from '../support/lifetime';
import { ACTIVITY_BY_ID } from '../../src/data/activities';
import { INTENSITY } from '../../src/data/progression.config';

it('plan probe', () => {
  const rows: Record<number, { days: number; trimmedDays: number; trimH: number; rests: number; taken: number; skippedNear: number; pAtRest: number }> = {};
  runLifetime(gated(AVERAGE), 33, {
    onDay: (s, { age }) => {
      if (age < 22) return;
      const plan = planDay(s, selectActiveRoutine(s), selectFillCredit(s));
      if (!plan.trainingDay) return;
      const y = Math.floor(age);
      const r = (rows[y] ??= { days: 0, trimmedDays: 0, trimH: 0, rests: 0, taken: 0, skippedNear: 0, pAtRest: 0 });
      r.days += 1;
      const t = plan.notes.find((n) => n.startsWith('fill trimmed by '));
      if (t) {
        r.trimmedDays += 1;
        r.trimH += Number(t.split(' ')[3]);
      }
      // Walk the plan's physical meter the simple way (loads x intensity), noting p/cap at each conditional rest.
      const caps = selectCapacities(s);
      let p = selectMeters(s).p;
      for (const it of plan.items) {
        if (it.kind === 'rest') {
          if (!(it as { conditional?: boolean }).conditional) continue;
          r.rests += 1;
          r.pAtRest += p / caps.p;
          if (p / caps.p > 0.7) {
            r.taken += 1;
            p = Math.max(0, p - 0.75 * (it as { hours: number }).hours);
          } else if (p / caps.p > 0.6) r.skippedNear += 1;
          continue;
        }
        if (it.kind !== 'train') continue;
        const b = it as { activityId: string; hours: number; intensity: keyof typeof INTENSITY };
        const act = ACTIVITY_BY_ID.get(b.activityId);
        if (act) p = Math.max(0, p + act.load.p * INTENSITY[b.intensity].load * b.hours);
      }
    },
  });
  for (const [y, r] of Object.entries(rows))
    console.info(`[rest] ${y}: training days ${r.days}, trimmed ${r.trimmedDays} (${r.trimH} h), conditional rests ${r.rests}, taken ${r.taken}, skipped at p 0.6-0.7 ${r.skippedNear}, mean p/cap at a rest ${(r.pAtRest / Math.max(1, r.rests)).toFixed(3)}`);
}, 3_600_000);
