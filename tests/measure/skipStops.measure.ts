// opt-2 D4 (reports/opt-2.md): what stops a year's time skip in 3,661 BBY, per seed. A Jedi Knight (and a Padawan and a soldier)
// asks to skip a year, then asks again from wherever the skip stopped, until a year has passed; every stop is recorded with its
// reason. Writes JSON to SKIP_OUT. On demand: npx vitest run --config vitest.measure.config.ts skipStops
import { writeFileSync } from 'node:fs';
import { it } from 'vitest';
import { intentSchema } from '../../src/ai/schemas/intent';
import { seedRng } from '../../src/engine/rng';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import { resolveTurn } from '../../src/turn/resolve';
import { base } from '../support/schemaSituations';

const skip = (days: number) => intentSchema.parse({ actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: 'timeSkip', requestedSpan: { amount: days, unit: 'days' } });
const SEEDS = 20;
/** A mission's days in the harness (invented; in play the narrator's thread decides). */
const MISSION_DAYS = 14;
const WHO: Record<string, () => GameState> = {
  knight: () => base(),
  padawan: () => base({ rank: 'padawan' }),
  soldier: () => base({ path: 'career', archetype: 'soldier', army: true }),
};

it('skip stops in a year of 3,661 BBY', () => {
  const out: Record<string, { stops: number[]; reasons: Record<string, number> }> = {};
  for (const [who, make] of Object.entries(WHO)) {
    const stops: number[] = [];
    const reasons: Record<string, number> = {};
    for (let i = 0; i < SEEDS; i++) {
      let s = make();
      s = { ...s, meta: { ...s.meta, rngState: seedRng(`skip-${who}-${i}`) } };
      const start = s.clock.now.day;
      let n = 0;
      for (let guard = 0; guard < 400 && s.clock.now.day - start < 365; guard++) {
        const left = 365 - (s.clock.now.day - start);
        const r = resolveTurn(REGISTRY, s, skip(left));
        const why = r.draft.timeAdvanced?.interrupted;
        if (r.state.clock.now.day === s.clock.now.day) {
          // A stop that moved no day (a home day, a pending choice): count it and step a day as the player would.
          reasons[`(no day) ${why ?? 'none'}`] = (reasons[`(no day) ${why ?? 'none'}`] ?? 0) + 1;
          const r2 = resolveTurn(REGISTRY, r.state, skip(1));
          if (r2.state.clock.now.day === s.clock.now.day) break;
          s = r2.state;
          n++;
          continue;
        }
        s = r.state;
        // A mission (opt-2 D): the harness plays it out as the story would: its days pass, then its thread is resolved.
        if (s.duty?.status === 'mission' && s.duty.mission) {
          const m = s.duty.mission;
          s = resolveTurn(REGISTRY, s, skip(MISSION_DAYS)).state;
          const t = Object.values(s.threads.byId).find((x) => x.title === m.threadTitle && x.status === 'open');
          if (t) s = applyEvents(REGISTRY, s, [{ type: 'threadResolved', threadRef: t.id, outcome: 'resolved', note: 'done' }], { source: 'ai' }).state;
          s = applyEvents(REGISTRY, s, [{ type: 'timeElapsed', seconds: 1800, reason: 'reporting back' }], { source: 'ai' }).state;
        }
        if (why !== undefined && s.clock.now.day - start < 365) {
          n++;
          const key = why.replace(/"[^"]*"/g, '"…"').replace(/^A mission assignment: .*/, 'A mission assignment').slice(0, 70);
          reasons[key] = (reasons[key] ?? 0) + 1;
        }
      }
      stops.push(n);
    }
    out[who] = { stops: stops.sort((a, b) => a - b), reasons };
  }
  writeFileSync(process.env['SKIP_OUT'] ?? 'skip-stops.json', JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1));
}, 3_600_000);
