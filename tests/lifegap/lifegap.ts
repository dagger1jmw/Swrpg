// m9-release A15 (report only): the progression gap with missions on. The six archetype lives of the lifetime suite (archetypeLife.ts,
// the same profiles and seeds), once with duty off (as test:all runs them) and once with LIFETIME_MISSIONS=on (duty on, its missions
// played by the duty player). Nothing here changes a progression number: npm run lifegap, then LIFETIME_MISSIONS=on npm run lifegap.
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { missionStats } from '../support/lifetime';
import type { Job } from '../support/parallelRuns';
import { runArchetype } from '../lifetime/archetypeLife';

export const GAP_ARCHETYPES = ['jediGuardian', 'jediConsular', 'jediSentinel', 'sithWarrior', 'sithInquisitor', 'soldier'] as const;

export interface GapRow {
  id: string;
  mode: string;
  startAge: number;
  /** The main specialty's level at these ages (the day loop's year-end values). */
  main: Record<number, number>;
  forceSense: Record<number, number>;
  missions: typeof missionStats;
  seconds: number;
}

const AGES = [20, 25, 30, 35, 41];

export const GAP_JOBS: Job<GapRow>[] = GAP_ARCHETYPES.map((id, i) => ({
  order: i,
  cost: id === 'soldier' ? 1 : 2,
  run: () => {
    const a = ARCHETYPE_BY_ID.get(id)!;
    for (const k of Object.keys(missionStats) as (keyof typeof missionStats)[]) missionStats[k] = 0;
    const t = Date.now();
    const r = runArchetype(a);
    const main: Record<number, number> = {};
    const fs: Record<number, number> = {};
    for (const age of AGES) {
      const i = age - a.startAge - 1;
      if (r.mainByYear[i] !== undefined) main[age] = Math.round(r.mainByYear[i]! * 100) / 100;
      const l = r.levelsByYear[i];
      if (l?.['forceSense'] !== undefined) fs[age] = Math.round(l['forceSense'] * 100) / 100;
    }
    return { id, mode: process.env['LIFETIME_MISSIONS'] === 'on' ? 'missions on' : 'missions off', startAge: a.startAge, main, forceSense: fs, missions: { ...missionStats }, seconds: Math.round((Date.now() - t) / 1000) };
  },
}));
