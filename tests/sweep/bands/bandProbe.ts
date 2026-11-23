// The canon Force Knowledge and Meditation bands re-measure (D-429 [2]: "re-measured once the XP sources exist"; Jared,
// D-461). Each Order archetype's npc-test-7 life (Padawan 12, Knight 25, one mission a year from Padawan, its Order's
// seat by date: the life generated NPCs reproduce), read at the midpoint of each standing's span: 32.5 (Knight / Lord,
// 25-40), 50 (Master / Darth, 40-60), 70 (the Councils, 60-80). One JSON line per life; tests/sweep/bands/*.test.ts shard it.
import { it } from 'vitest';
import { ARCHETYPE_BY_ID } from '../../../src/data/archetypes';
import { runLifetime } from '../../support/lifetime';
import { archetypeSeat, schedule } from '../../lifetime/profiles';

export const BAND_AGES = [32.5, 50, 70] as const;
const TRACK = ['forceKnowledge', 'meditation'];

export function bandShard(id: string, seeds: readonly number[]): void {
  for (const n of seeds)
    it(`bands ${id} s${n}`, () => {
      const t0 = Date.now();
      const a = ARCHETYPE_BY_ID.get(id)!;
      const r = runLifetime(
        {
          archetype: a.id,
          path: a.path,
          main: a.main === '$mainForm' ? '$highestForm' : a.main,
          startAge: a.startAge,
          padawanAge: 12,
          knightAge: 25,
          daysPerYear: 300,
          effort: 'standard',
          mainForm: 'soresu',
          secondForm: 'ataru',
          seed: `${a.id}-s${n}`,
          fights: schedule([{ from: 12, to: 200, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]),
          ...archetypeSeat(a.path),
        },
        Math.max(...BAND_AGES) - a.startAge + 0.01,
        { track: TRACK },
      );
      const at: Record<string, Record<string, number>> = {};
      for (const age of BAND_AGES) {
        // levelsByYear[i] is the level at the end of training year i + 1 (age startAge + i + 1); interpolate.
        const x = age - a.startAge - 1;
        const i = Math.floor(x);
        const f = x - i;
        at[age] = Object.fromEntries(TRACK.map((k) => [k, r.levelsByYear[i]![k]! * (1 - f) + (r.levelsByYear[i + 1]?.[k] ?? r.levelsByYear[i]![k]!) * f]));
      }
      console.info(`[band] ${JSON.stringify({ id, seed: n, at, s: Math.round((Date.now() - t0) / 1000) })}`);
    }, 3_600_000);
}
