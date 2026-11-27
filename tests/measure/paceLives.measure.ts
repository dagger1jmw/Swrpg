// opt-1 F: seeded lives for the pace window's old-v-new comparison (reports/opt-1.md). Each life's XP per skill and the XP the
// 4.0x clamp discarded, written to PACE_LIVES_OUT. Run once at the old code and once at the new one and compare (reports/opt-1.md F
// has the numbers); tests/features/paceWindowStore.test.ts checks the store itself against the old reader.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { archetypeDef } from '../../src/data/archetypes';
import { ANAKIN, AVERAGE, LUKE_ACCELERATED } from '../lifetime/profiles';
import { runLifetime, type LifeProfile } from '../support/lifetime';
import { archetypeSeat, schedule } from '../lifetime/profiles';

const order = (id: string, years: number, seed: string): [string, LifeProfile, number] => {
  const a = archetypeDef(id);
  const o = a.path === 'jedi' || a.path === 'sith';
  return [
    `${id} ${years}y`,
    {
      archetype: a.id,
      path: a.path,
      main: a.main === '$mainForm' ? '$highestForm' : a.main,
      startAge: a.startAge,
      padawanAge: o ? 12 : a.startAge,
      knightAge: o ? 25 : a.startAge,
      daysPerYear: 300,
      effort: 'standard',
      mainForm: 'soresu',
      secondForm: 'ataru',
      seed,
      ...(o ? { fights: schedule([{ from: 12, to: 200, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]) } : {}),
      ...archetypeSeat(a.path),
    },
    years,
  ];
};

export const PACE_LIVES: readonly [string, LifeProfile, number][] = [
  order('jediGuardian', 12, 'pace-a'),
  order('sithWarrior', 10, 'pace-b'),
  order('soldier', 8, 'pace-c'),
  ['anakin 12y', { ...ANAKIN, seed: 'pace-d' }, 12],
  // Lives where the 4.0x clamp fires (the Average from its first weeks; Luke on the accelerated path).
  ['average 8y', { ...AVERAGE, seed: 'pace-e' }, 8],
  ['luke accelerated 4y', { ...LUKE_ACCELERATED, seed: 'pace-f' }, 4],
];

it('pace lives', () => {
  const out: Record<string, { xp: Record<string, number>; discarded: number; discardedBySkill: Record<string, number>; ms: number }> = {};
  for (const [name, p, years] of PACE_LIVES) {
    const t = performance.now();
    const r = runLifetime(p, years);
    out[name] = { xp: r.xp, discarded: r.discarded, discardedBySkill: r.discardedBySkill, ms: Math.round(performance.now() - t) };
    console.log(name, Math.round(performance.now() - t), 'ms', r.discarded.toFixed(2));
  }
  writeFileSync(process.env['PACE_LIVES_OUT'] ?? 'pace-lives.json', JSON.stringify(out, null, 1));
}, 3_600_000);
