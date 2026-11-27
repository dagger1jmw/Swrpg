// One life per archetype, shared by two checks (opt-1 G, D-534): npc test 7 (the day loop matches the closed form within +/-2 levels
// at 25 years; was archetypeCase.ts, split over three files) and the Force Sense pace (Force Sense within the gap of Force Control at
// Knight, 25, and Master, 40; D-495, was forceSense.test.ts, six lives in one file). Both ran the same archetype's default routine with
// the same profile and differed only in the seed and the length, so one run to the longer length serves both: the runner reads its
// length only as the loop's bound, so the first 25 years of a longer life are the 25-year life itself. Each archetype has its own file
// (vitest runs a file's tests one after another in one worker, so a file per life spreads them over the workers).
import { beforeAll, expect, it } from 'vitest';
import { ARCHETYPE_BY_ID, type ArchetypeDef } from '../../src/data/archetypes';
import { FORCE_SENSE_TRACK, FORM_TRANSFER_SHARE, K } from '../../src/data/progression.config';
import { CATEGORY_RULES, SKILL_BY_ID } from '../../src/data/skills';
import { closedFormLevel, formXps, phasesFor } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { CLOSED_FORM_CURRICULUM } from '../../src/data/initiateCurriculum';
import { runLifetime, type LifeResult } from '../support/lifetime';
import { archetypeSeat, schedule } from './profiles';

const PLAN = { soresu: 2, ataru: 1 };
/** npc test 7's horizon. */
export const ARCHETYPE_YEARS = 25;
/** The Force Sense checks: Knight at 25, Master at 40. */
const FS_AGES = [['Knight', 25], ['Master', 40]] as const;

function closedHighestForm(a: ArchetypeDef, startAge: number, age: number, order: boolean): number {
  const xp = formXps({
    formPaces: a.formPaces,
    k: K,
    startAge,
    age,
    padawanAge: order ? 12 : startAge,
    knightAge: order ? 25 : startAge,
    onePhase: !order,
    padawanPlan: PLAN,
    knightPlan: PLAN,
    mult: () => 1,
    transferShare: FORM_TRANSFER_SHARE,
    // The Jedi Initiate lightsaber curriculum (D-459).
    ...(a.path === 'jedi' ? { curriculum: CLOSED_FORM_CURRICULUM } : {}),
  });
  return levelExact(Math.max(0, ...Object.values(xp)));
}

/** The archetype's closed-form main level at 25 years (npc test 7). */
function closedMain(a: ArchetypeDef, order: boolean): number {
  if (a.main === '$mainForm') return closedHighestForm(a, a.startAge, a.startAge + ARCHETYPE_YEARS, order);
  const row = CATEGORY_RULES[SKILL_BY_ID.get(a.main)!.category].ageRow;
  return closedFormLevel({
    row,
    startAge: a.startAge,
    age: a.startAge + ARCHETYPE_YEARS,
    // The career youth phase (D-461).
    phases: phasesFor({ initiate: a.paces.initiate?.[a.main], padawan: a.paces.padawan?.[a.main], knight: a.paces.knight?.[a.main], ...(a.youthPaces ? { youth: a.youthPaces[a.main] } : {}) }, { padawanAge: 12, knightAge: 25 }, !order),
  });
}

/**
 * The archetype's life on its default routine (npc test 7's profile and seed): to 41 for a Force archetype (the Master check at
 * 40), else npc test 7's 25 years; Force Control and Force Sense tracked.
 */
export function runArchetype(a: ArchetypeDef): LifeResult {
  const order = a.path === 'jedi' || a.path === 'sith';
  const years = a.path === 'career' ? ARCHETYPE_YEARS : Math.max(ARCHETYPE_YEARS, 41 - a.startAge);
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
      seed: a.id,
      // Jedi and Sith archetypes keep the Average's one real mission a year from Padawan (D-143 A, D-159): without real fights the
      // drill ceiling holds every form at 40.
      ...(order ? { fights: schedule([{ from: 12, to: 200, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]) } : {}),
      // D-445, D-451: Order archetypes live at their Order's seat by date, as the Average does, so a generated NPC matches a player of
      // the same life (Jedi: the Coruscant Temple; Sith: the Korriban academy, then Dromund Kaas; profiles.ts).
      ...archetypeSeat(a.path),
    },
    years,
    { track: ['forceControl', 'forceSense'] },
  );
}

/** The archetype's file: its one life, npc test 7, and the Force Sense check (a Force archetype) or "a career has none". */
export function archetypeLife(id: string): void {
  const a = ARCHETYPE_BY_ID.get(id)!;
  const order = a.path === 'jedi' || a.path === 'sith';
  let r: LifeResult;
  beforeAll(() => {
    r = runArchetype(a);
  }, 600_000);

  it(`${a.name}: the day loop matches the closed form within +/-2 levels at ${ARCHETYPE_YEARS} years (npc test 7)`, () => {
    const closed = closedMain(a, order);
    const day = r.mainByYear[ARCHETYPE_YEARS - 1]!;
    console.info(`[archetype] ${a.id}: day loop ${day.toFixed(2)} closed ${closed.toFixed(2)}`);
    expect(Math.abs(day - closed), `${a.id}: day loop ${day.toFixed(2)} vs closed ${closed.toFixed(2)}`).toBeLessThanOrEqual(2);
  });

  if (a.path === 'career') {
    it(`${a.name}: no Force Sense (a career has none; D-495)`, () => {
      expect(r.levelsByYear[7]!['forceSense'] ?? 0).toBe(0);
    });
    return;
  }
  it(`${a.name}: Force Sense within the gap of Force Control at Knight and at Master (D-495)`, () => {
    for (const [rank, age] of FS_AGES) {
      const l = r.levelsByYear[age - a.startAge - 1]!;
      console.info(`[forceSense] ${a.id} ${rank} (${age}): Force Control ${l['forceControl']!.toFixed(1)}, Force Sense ${l['forceSense']!.toFixed(1)}`);
      expect(l['forceControl']! - l['forceSense']!, `${a.id} ${rank}`).toBeLessThanOrEqual(FORCE_SENSE_TRACK.gap);
      // The Lord's and the Knight's minimum (D-496).
      expect(l['forceSense']!, `${a.id} ${rank}`).toBeGreaterThanOrEqual(40);
    }
  });
}
