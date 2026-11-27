// m9-release A15, m9-tune A (report only): the progression gap with missions on. The six archetype lives of the lifetime suite
// (archetypeLife.ts, the same profiles; seed 0 is npc test 7's own seed, seeds 1-19 are "<id>-<n>"), once with duty off (as test:all
// runs them) and once with LIFETIME_MISSIONS=on (duty on, its missions played by the duty player). Nothing here changes a progression
// number: npm run lifegap, then LIFETIME_MISSIONS=on npm run lifegap. SEEDS (default 20) narrows it for a look, never for a tuning
// decision (CLAUDE.md rule 6).
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { FORM_IDS } from '../../src/data/skills';
import { levelExact } from '../../src/engine/curve';
import { missionStats, resetMissionStats } from '../support/lifetime';
import type { Job } from '../support/parallelRuns';
import { runArchetype } from '../lifetime/archetypeLife';

export const GAP_ARCHETYPES = ['jediGuardian', 'jediConsular', 'jediSentinel', 'sithWarrior', 'sithInquisitor', 'soldier'] as const;
export const GAP_SEEDS = Number(process.env['SEEDS'] ?? 20);

export interface GapRow {
  id: string;
  seed: number;
  mode: string;
  startAge: number;
  /** The main specialty's level at these ages (the day loop's year-end values). */
  main: Record<number, number>;
  forceSense: Record<number, number>;
  /** m9-tune A1: each form's level and XP at the life's end, and the levels of the skills the stage checks read. */
  forms: Record<string, { level: number; xp: number }>;
  skills: Record<string, number>;
  missions: typeof missionStats;
  seconds: number;
}

const AGES = [20, 25, 30, 35, 41];
/** The skills mission stages read (missions.config APPROACHES), reported at the life's end. */
export const STAGE_SKILLS = ['charisma', 'investigation', 'stealth', 'tracking', 'piloting', 'tactics', 'intelligence', 'agility', 'willpower', 'forceSense', 'repair'] as const;
const r2 = (x: number): number => Math.round(x * 100) / 100;
const rounded = (o: Record<string, number>): Record<string, number> => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Math.round(v)]));

export const GAP_JOBS: Job<GapRow>[] = GAP_ARCHETYPES.flatMap((id, i) =>
  Array.from({ length: GAP_SEEDS }, (_, n) => ({
    order: i * 1000 + n,
    cost: id === 'soldier' ? 1 : 2,
    run: (): GapRow => {
      const a = ARCHETYPE_BY_ID.get(id)!;
      resetMissionStats();
      const t = Date.now();
      const r = runArchetype(a, n === 0 ? a.id : `${a.id}-${n}`);
      const main: Record<number, number> = {};
      const fs: Record<number, number> = {};
      for (const age of AGES) {
        const k = age - a.startAge - 1;
        if (r.mainByYear[k] !== undefined) main[age] = r2(r.mainByYear[k]!);
        const l = r.levelsByYear[k];
        if (l?.['forceSense'] !== undefined) fs[age] = r2(l['forceSense']);
      }
      const sk = r.state.progression.skills;
      const forms: GapRow['forms'] = {};
      for (const f of FORM_IDS) if ((sk[f]?.xp ?? 0) > 0) forms[f] = { level: r2(levelExact(sk[f]!.xp)), xp: Math.round(sk[f]!.xp) };
      const skills = Object.fromEntries(STAGE_SKILLS.map((k) => [k, r2(levelExact(sk[k]?.xp ?? 0))]));
      const m = missionStats;
      return {
        id,
        seed: n,
        mode: process.env['LIFETIME_MISSIONS'] === 'on' ? 'missions on' : 'missions off',
        startAge: a.startAge,
        main,
        forceSense: fs,
        forms,
        skills,
        missions: { ...m, types: { ...m.types }, dutyFormXp: Math.round(m.dutyFormXp), routineHours: Math.round(m.routineHours), routineFormXp: Math.round(m.routineFormXp), dutyXpBy: rounded(m.dutyXpBy), routineFormXpBy: rounded(m.routineFormXpBy) },
        seconds: Math.round((Date.now() - t) / 1000),
      };
    },
  })),
);

/** The run's means per life (the report's tables): main by age, Force Sense at 41, each form's level and XP, stage skills, mission counts. */
export function summarize(rows: readonly GapRow[]): Record<string, unknown>[] {
  const mean = (xs: readonly number[]): number => (xs.length ? r2(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const out: Record<string, unknown>[] = [];
  for (const id of GAP_ARCHETYPES) {
    const rs = rows.filter((r) => r.id === id);
    if (!rs.length) continue;
    const keysOf = (pick: (r: GapRow) => Record<string, unknown>): string[] => [...new Set(rs.flatMap((r) => Object.keys(pick(r))))];
    const avg = (pick: (r: GapRow) => Record<string, number>): Record<string, number> => Object.fromEntries(keysOf(pick).map((k) => [k, mean(rs.map((r) => pick(r)[k] ?? 0))]));
    const sorted41 = rs.map((r) => r.main[41] ?? r.main[35] ?? 0).sort((a, b) => a - b);
    out.push({
      id,
      seeds: rs.length,
      main: avg((r) => r.main),
      main41Range: [sorted41[0], sorted41[sorted41.length - 1]],
      forceSense41: mean(rs.map((r) => r.forceSense[41] ?? 0)),
      formLevel: avg((r) => Object.fromEntries(Object.entries(r.forms).map(([k, v]) => [k, v.level]))),
      formXp: avg((r) => Object.fromEntries(Object.entries(r.forms).map(([k, v]) => [k, v.xp]))),
      skills: avg((r) => r.skills),
      missions: mean(rs.map((r) => r.missions.missions)),
      failure: mean(rs.map((r) => r.missions.failure)),
      cutShort: mean(rs.map((r) => r.missions.cutShort)),
      dutyDays: mean(rs.map((r) => r.missions.dutyDays)),
      dutyFormXp: mean(rs.map((r) => r.missions.dutyFormXp)),
      dutyXpBy: avg((r) => r.missions.dutyXpBy),
      routineHours: mean(rs.map((r) => r.missions.routineHours)),
      routineFormXp: mean(rs.map((r) => r.missions.routineFormXp)),
      routineFormXpBy: avg((r) => r.missions.routineFormXpBy),
      types: avg((r) => r.missions.types),
      seconds: mean(rs.map((r) => r.seconds)),
    });
  }
  return out;
}
