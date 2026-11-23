// Goal check (Phase B, D-451): the Coruscant -> Tython move costs the Average no visible Force skill gains. The era
// profile's Average (from 3,671 BBY) runs twice: at the Order seat by date (moves to Tython in 3,650) and in the
// Coruscant Temple all life. Prints the Force Control and Force Sense XP gained per calendar year and the Force factor.
import { it } from 'vitest';
import { dateFromAbsDay } from '../../src/engine/calendar';
import { selectTrainingConditions } from '../../src/features/progression/training';
import type { GameState } from '../../src/state/gameState';
import { AVERAGE } from '../lifetime/profiles';
import { runLifetime, type LifeProfile } from '../support/lifetime';

const START = { year: -3671, month: 1, day: 1 };
const ERA: LifeProfile = { ...AVERAGE, padawanAge: 13, seed: process.env['SEED'] ?? 'era3661' };

function perYear(p: LifeProfile): Record<number, { xp: number; factor: number; site: string }> {
  const out: Record<number, { xp: number; factor: number; site: string }> = {};
  let last = 0;
  const fx = (s: GameState): number => (s.progression.skills['forceControl']?.xp ?? 0) + (s.progression.skills['forceSense']?.xp ?? 0);
  runLifetime(p, 22, {
    startDate: START,
    onDay: (s) => {
      const y = -dateFromAbsDay(s.clock.now.day).year;
      const row = (out[y] ??= { xp: 0, factor: 0, site: '' });
      const now = fx(s);
      row.xp += now - last;
      last = now;
      const c = selectTrainingConditions(s);
      row.factor = c.forceFactor;
      row.site = c.site ?? '-';
    },
  });
  return out;
}

it('Tython move', () => {
  const moving = perYear(ERA);
  const coruscant: LifeProfile = { ...ERA, places: [{ from: 0, to: 1000, name: 'the Jedi Temple', region: 'Coruscant' }] };
  delete (coruscant as { seat?: unknown }).seat;
  const staying = perYear(coruscant);
  for (const y of Object.keys(moving).map(Number).sort((a, b) => b - a)) {
    const m = moving[y]!;
    const st = staying[y]!;
    console.info(`[tython] ${y} BBY: seat ${m.site} x${m.factor} FC+FS XP ${m.xp.toFixed(0)} | Coruscant all life x${st.factor} ${st.xp.toFixed(0)} | diff ${(((m.xp - st.xp) / Math.max(1, st.xp)) * 100).toFixed(1)}%`);
  }
}, 3_600_000);
