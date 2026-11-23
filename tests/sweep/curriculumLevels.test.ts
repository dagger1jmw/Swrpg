// Report probe (D-459, Jared): the Average's levels in Forms I-VI, Force Control and Force Knowledge at given ages (gated
// seed; AGES default 6,8,10,12,25), and the age the Initiate saber gate opened. Run before and after the curriculum change.
import { it } from 'vitest';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { AVERAGE, gated } from '../lifetime/profiles';
import { runLifetime } from '../support/lifetime';

const AGES = (process.env['AGES'] ?? '6,8,10,12,25').split(',').map(Number);
const SKILLS = ['shiiCho', 'makashi', 'soresu', 'ataru', 'shien', 'djemSo', 'niman', 'forceControl', 'forceKnowledge', 'forceSense'];

it('curriculum levels', () => {
  const t0 = Date.now();
  const rows: string[] = [];
  let gateAge: number | null = null;
  const left = [...AGES];
  runLifetime(gated(AVERAGE), Math.max(...AGES) - AVERAGE.startAge + 0.01, {
    onDay: (s, { age }) => {
      if (gateAge === null && (s.progression.skills['shiiCho']?.xp ?? 0) > 0) gateAge = age;
      while (left.length && age >= left[0]!) {
        const a = left.shift()!;
        rows.push(`[levels] age ${a}: ${SKILLS.map((k) => `${k} ${selectLevelExact(s, k).toFixed(1)}`).join(' | ')}`);
      }
    },
  });
  console.info(`[levels] first Form I XP at age ${gateAge === null ? '-' : (gateAge as number).toFixed(2)}`);
  for (const r of rows) console.info(r);
  console.info(`[levels-runtime] ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}, 3_600_000);
