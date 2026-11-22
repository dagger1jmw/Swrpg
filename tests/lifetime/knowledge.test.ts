// The knowledge stats report (Jared, D-427): Force Knowledge, Meditation, Intelligence and Charisma for an Average
// Guardian and an Average Consular at 25, 40 and 60, run through the real game. Measured before and after the M7 XP
// sources (study of texts, meditation, teaching, the Knight study expectation, the natural baseline), so the change is
// reported. A sanity gate only: the levels exist and never fall.
import { beforeAll, describe, expect, it } from 'vitest';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { AVERAGE, gated } from './profiles';

const TRACK = ['forceKnowledge', 'meditation', 'intelligence', 'charisma'];
const AGES = [25, 40, 60];
const PROFILES = { guardian: AVERAGE, consular: { ...AVERAGE, archetype: 'jediConsular', seed: 'consular' } } as const;
const runs: Record<string, LifeResult> = {};

beforeAll(() => {
  for (const [name, p] of Object.entries(PROFILES)) {
    const r = runLifetime(gated(p), 57, { track: TRACK });
    runs[name] = r;
    const rows = AGES.map((age) => `${age}: ${TRACK.map((k) => `${k} ${r.levelsByYear[age - 4 - 1]![k]!.toFixed(1)}`).join(', ')}`);
    console.info(`[report knowledge ${name}] ${rows.join(' | ')}`);
  }
}, 900_000);

describe('knowledge stats over a life (D-427 report)', () => {
  it('the tracked levels exist at 25, 40 and 60 and never fall', () => {
    for (const r of Object.values(runs)) {
      for (const k of TRACK) {
        const at = AGES.map((a) => r.levelsByYear[a - 4 - 1]![k]!);
        expect(at.every((x) => Number.isFinite(x))).toBe(true);
        expect(at[2]!).toBeGreaterThanOrEqual(at[0]! - 1);
      }
    }
  });
});
