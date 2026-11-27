// opt-1 F: the save's size at the start, after 250 days and after a year of time skips, and the skip's speed per game day
// (reports/opt-1.md F). A Jedi Knight in 3,661 BBY on the default routine, skipping in steps of 30 days through the real turn
// resolver (interruptions stop a skip early; the loop goes on from where it stopped). Writes JSON to SAVE_OUT.
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { intentSchema } from '../../src/ai/schemas/intent';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import { resolveTurn } from '../../src/turn/resolve';
import { base } from '../support/schemaSituations';

const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: 'timeSkip', requestedSpan: { amount: days, unit: 'days' } });
const sizes = (s: GameState) => ({ save: JSON.stringify(s).length, paceWindow: JSON.stringify(s.progression.paceWindow).length });

it('save size and skip speed', () => {
  let s = base();
  const start = s.clock.now.day;
  const out: Record<string, unknown> = { start: sizes(s) };
  let ms = 0;
  let turns = 0;
  for (const target of [250, 365]) {
    while (s.clock.now.day - start < target) {
      const left = target - (s.clock.now.day - start);
      const t = performance.now();
      const r = resolveTurn(REGISTRY, s, skip(Math.min(30, Math.max(7, left))));
      ms += performance.now() - t;
      turns++;
      if (r.state.clock.now.day === s.clock.now.day) break;
      s = r.state;
    }
    const days = s.clock.now.day - start;
    out[`after ${target}`] = { days, turns, msPerDay: Math.round((10 * ms) / days) / 10, ...sizes(s) };
  }
  writeFileSync(process.env['SAVE_OUT'] ?? 'save-size.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out));
}, 1_800_000);
