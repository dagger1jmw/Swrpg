// npc-generation test 7 (M3, now on the real loop; Knight at 25 since D-426/D-431, as the paces are measured): each archetype's default routine, run through the
// routine day loop for 25 years, matches its closed form within +/-2 levels in the main specialty (the
// highest form for form archetypes), so no NPC or created character has a level the player could not
// earn. Split over three files so vitest runs them in parallel.
import { expect, it } from 'vitest';
import { ARCHETYPE_BY_ID, type ArchetypeDef } from '../../src/data/archetypes';
import { FORM_TRANSFER_SHARE, K } from '../../src/data/progression.config';
import { CATEGORY_RULES, SKILL_BY_ID } from '../../src/data/skills';
import { closedFormLevel, formXps, phasesFor } from '../../src/engine/closedForm';
import { levelExact } from '../../src/engine/curve';
import { CLOSED_FORM_CURRICULUM } from '../../src/data/initiateCurriculum';
import { runLifetime } from '../support/lifetime';
import { archetypeSeat, schedule } from './profiles';

const PLAN = { soresu: 2, ataru: 1 };
const YEARS = 25;

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
        knightAge: order ? 25 : a.startAge,
        daysPerYear: 300,
        effort: 'standard',
        mainForm: 'soresu',
        secondForm: 'ataru',
        seed: a.id,
        // Jedi and Sith archetypes keep the Average's one real mission a year from Padawan (D-143 A, D-159): without real
        // fights the drill ceiling holds every form at 40.
        ...(order ? { fights: schedule([{ from: 12, to: 200, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]) } : {}),
        // D-445, D-451: Order archetypes live at their Order's seat by date, as the Average does, so a generated NPC matches a
        // player of the same life (Jedi: the Coruscant Temple; Sith: the Korriban academy, then Dromund Kaas; profiles.ts).
        ...archetypeSeat(a.path),
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
        // The career youth phase (D-461).
        phases: phasesFor({ initiate: a.paces.initiate?.[a.main], padawan: a.paces.padawan?.[a.main], knight: a.paces.knight?.[a.main], ...(a.youthPaces ? { youth: a.youthPaces[a.main] } : {}) }, { padawanAge: 12, knightAge: 25 }, !order),
      });
    }
    const day = r.mainByYear[YEARS - 1]!;
    console.info(`[archetype] ${a.id}: day loop ${day.toFixed(2)} closed ${closed.toFixed(2)}`);
    expect(Math.abs(day - closed), `${a.id}: day loop ${day.toFixed(2)} vs closed ${closed.toFixed(2)}`).toBeLessThanOrEqual(2);
  }, 600_000);
}
