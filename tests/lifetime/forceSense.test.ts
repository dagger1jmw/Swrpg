// Force Sense keeps pace with Force Control on the real day loop (Jared, 2026-11-25; D-495): a player of each Force
// archetype on its default routine, to Knight (25) and to Master (40), and a career, which has none.
import { expect, it } from 'vitest';
import { ARCHETYPES, archetypeDef } from '../../src/data/archetypes';
import { FORCE_SENSE_TRACK } from '../../src/data/progression.config';
import { runLifetime } from '../support/lifetime';
import { archetypeSeat, schedule } from './profiles';

const run = (id: string, years: number) => {
  const a = archetypeDef(id);
  const order = a.path === 'jedi' || a.path === 'sith';
  return runLifetime(
    {
      archetype: a.id,
      path: a.path,
      main: a.main === '$mainForm' ? '$highestForm' : a.main,
      startAge: a.startAge,
      padawanAge: order ? 12 : a.startAge,
      knightAge: order ? 25 : a.startAge,
      daysPerYear: 300,
      effort: 'standard',
      mainForm: 'soresu',
      secondForm: 'ataru',
      seed: `fs-${id}`,
      ...(order ? { fights: schedule([{ from: 12, to: 200, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]) } : {}),
      ...archetypeSeat(a.path),
    },
    years,
    { track: ['forceControl', 'forceSense'] },
  );
};

it.each(ARCHETYPES.filter((a) => a.path !== 'career').map((a) => a.id))(
  '%s: within the gap at Knight and at Master',
  (id) => {
    const start = archetypeDef(id).startAge;
    const r = run(id, 41 - start);
    for (const [rank, age] of [['Knight', 25], ['Master', 40]] as const) {
      const l = r.levelsByYear[age - start - 1]!;
      console.info(`[forceSense] ${id} ${rank} (${age}): Force Control ${l['forceControl']!.toFixed(1)}, Force Sense ${l['forceSense']!.toFixed(1)}`);
      expect(l['forceControl']! - l['forceSense']!, `${id} ${rank}`).toBeLessThanOrEqual(FORCE_SENSE_TRACK.gap);
      // The Lord's and the Knight's minimum (D-496).
      expect(l['forceSense']!, `${id} ${rank}`).toBeGreaterThanOrEqual(40);
    }
  },
  600_000,
);

it('a soldier has none', () => {
  expect(run('soldier', 8).levelsByYear[7]!['forceSense'] ?? 0).toBe(0);
}, 600_000);
