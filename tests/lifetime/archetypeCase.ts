// npc-generation test 7 (M3, now on the real loop): each archetype's default routine, run through the
// routine day loop for 25 years, matches its closed form within +/-2 levels in the main specialty (the
// highest form for form archetypes), so no NPC or created character has a level the player could not
// earn. Split over three files so vitest runs them in parallel.
import { expect, it } from 'vitest';
import { ARCHETYPE_BY_ID, type ArchetypeDef } from '../../src/data/archetypes';
import { FORM_TRANSFER_SHARE, K } from '../../src/data/progression.config';
import { CATEGORY_RULES, SKILL_BY_ID } from '../../src/data/skills';
import { closedFormLevel, formXps, phasesFor } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { runLifetime } from '../support/lifetime';

const PLAN = { soresu: 2, ataru: 1 };
const YEARS = 25;

function closedHighestForm(a: ArchetypeDef, startAge: number, age: number, order: boolean): number {
  const xp = formXps({
    formPaces: a.formPaces,
    k: K,
    startAge,
    age,
    padawanAge: order ? 12 : startAge,
    knightAge: order ? 20.5 : startAge,
    onePhase: !order,
    padawanPlan: PLAN,
    knightPlan: PLAN,
    mult: () => 1,
    transferShare: FORM_TRANSFER_SHARE,
  });
  return levelExact(Math.max(0, ...Object.values(xp)));
}

export function archetypeCase(id: string): void {
  const a = ARCHETYPE_BY_ID.get(id)!;
  it(`${a.name}: the day loop matches the closed form within +/-2 levels at ${YEARS} years`, () => {
    const order = a.path === 'jedi' || a.path === 'sith';
    const r = runLifetime(
      {
        archetype: a.id,
        path: a.path,
        main: a.main === '$mainForm' ? '$highestForm' : a.main,
        startAge: a.startAge,
        padawanAge: order ? 12 : a.startAge,
        knightAge: order ? 20.5 : a.startAge,
        daysPerYear: 300,
        effort: 'standard',
        mainForm: 'soresu',
        secondForm: 'ataru',
        seed: a.id,
      },
      YEARS,
    );
    let closed: number;
    if (a.main === '$mainForm') closed = closedHighestForm(a, a.startAge, a.startAge + YEARS, order);
    else {
      const row = CATEGORY_RULES[SKILL_BY_ID.get(a.main)!.category].ageRow;
      closed = closedFormLevel({
        row,
        startAge: a.startAge,
        age: a.startAge + YEARS,
        phases: phasesFor({ initiate: a.paces.initiate?.[a.main], padawan: a.paces.padawan?.[a.main], knight: a.paces.knight?.[a.main] }, { padawanAge: 12, knightAge: 20.5 }, !order),
      });
    }
    const day = r.mainByYear[YEARS - 1]!;
    expect(Math.abs(day - closed), `${a.id}: day loop ${day.toFixed(2)} vs closed ${closed.toFixed(2)}`).toBeLessThanOrEqual(2);
  }, 600_000);
}
