// Report probe (D-474): a long-lived species on the day loop against its closed form, training counted in real years.
// The npc-test-7 life (Guardian, Padawan 12, Knight 25, a mission a year). Prints; asserts nothing. SEED picks the seed.
import { it } from 'vitest';
import { npcLevelsFor } from '../../src/features/npcs/selectors';
import { runLifetime } from '../support/lifetime';
import { archetypeSeat, schedule } from '../lifetime/profiles';

const SKILLS = ['soresu', 'ataru', 'forceControl', 'forceSense', 'willpower', 'strength', 'agility', 'endurance'];
it('long lives', () => {
  const species = process.env['SPECIES'] ?? 'wookiee';
  const years = Number(process.env['YEARS'] ?? 196);
  const seed = `long-${process.env['SEED'] ?? '0'}`;
  const r = runLifetime(
    { archetype: 'jediGuardian', path: 'jedi', speciesId: species, main: '$highestForm', startAge: 4, padawanAge: 12, knightAge: 25, daysPerYear: 300, effort: 'standard', mainForm: 'soresu', secondForm: 'ataru', seed, fights: schedule([{ from: 12, to: 1000, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]), ...archetypeSeat('jedi') },
    years,
    { track: [...SKILLS, 'perf:strength', 'perf:agility', 'perf:endurance'] },
  );
  const gen = { archetype: 'jediGuardian', path: 'jedi' as const, talents: {}, startAge: 4, warYears: 0, rank: 'knight', seed: 'x', minionGrade: 1 };
  for (const age of [30, 45, 60, 80, 100, 130, 160, 200]) {
    const l = r.levelsByYear[age - 5];
    if (!l) continue;
    const c = npcLevelsFor(gen, species, age, 1_000_000);
    console.info(`[long] ${species} ${seed} age ${age} | ${SKILLS.map((k) => `${k} ${l[k]!.toFixed(1)} / ${(c[k] ?? 0).toFixed(1)}`).join(' | ')}`);
  }
}, 3_600_000);
