// The archetype pace measurement on the real day loop (D-431). Each archetype's default routine runs through the game
// (tests/support/lifetime.ts) for 60 years from its start age, with the Average's rank ages (Padawan 12, Knight 25) and,
// for the Order paths, the Average's one real mission a year from Padawan (as npc test 7 runs it). A phase's pace is the
// trained XP the skill gained in that phase per age-weighted year of its own age row, divided by R = K x 41^1.75 / A_ref
// (D-119), so the closed form reproduces the loop's level; lightsaber forms are measured per source (the Initiate forms
// class, the master session, the solo hour, the fill with fights and bank releases) on the technique row. Replaces the
// docs-v2/calc model as the source of the paces (the calc model has no daily-life blocks, scaled Padawan hours or Sith
// rows). Run: npm run paces (writes node_modules/.cache/swrpg-paces/<id>.json; tests/paces/print.test.ts prints them).
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ARCHETYPE_BY_ID } from '../../src/data/archetypes';
import { CAREER_YOUTH_TO, K } from '../../src/data/progression.config';
import { CATEGORY_RULES, FORM_IDS, SKILL_BY_ID } from '../../src/data/skills';
import { ageIntegral } from '../../src/engine/ageFactor';
import { referenceRate } from '../../src/engine/closedForm';
import { INITIATE_CURRICULUM, surveyShares } from '../../src/data/initiateCurriculum';
import { runLifetime } from '../support/lifetime';
import { archetypeSeat, schedule } from '../lifetime/profiles';

export const PACE_YEARS = 60;
/** The form plan of the measured lives (Soresu 2 h, Ataru 1 h, as npc test 7). */
export const PACE_PLAN = { soresu: 2, ataru: 1 } as const;
export const PACE_RANK_AGES = { padawan: 12, knight: 25 } as const;
export const PACE_DIR = join('node_modules', '.cache', 'swrpg-paces');

export interface MeasuredPaces {
  id: string;
  k: number;
  paces: Partial<Record<'initiate' | 'padawan' | 'knight', Record<string, number>>>;
  formPaces: Partial<Record<'initiate' | 'padawan' | 'knight', Record<string, number>>>;
  /** The main specialty's loop level at 25 years (npc test 7's check). */
  mainAt25: number;
  /** The career youth phase's paces (D-461): from the start age to CAREER_YOUTH_TO. */
  youthPaces?: Record<string, number>;
}

const r3 = (x: number): number => Math.round(x * 1000) / 1000;

export function measureArchetype(id: string): MeasuredPaces {
  const a = ARCHETYPE_BY_ID.get(id)!;
  const order = a.path === 'jedi' || a.path === 'sith';
  // The career youth phase (D-461): a career starting before CAREER_YOUTH_TO is measured over two spans.
  const youth = a.path === 'career' && a.startAge < CAREER_YOUTH_TO;
  const padawanAge = order ? PACE_RANK_AGES.padawan : a.startAge;
  const knightAge = order ? PACE_RANK_AGES.knight : a.startAge;
  const life = runLifetime(
    {
      archetype: a.id,
      path: a.path,
      main: a.main === '$mainForm' ? '$highestForm' : a.main,
      startAge: a.startAge,
      padawanAge,
      knightAge,
      daysPerYear: 300,
      effort: 'standard',
      mainForm: 'soresu',
      secondForm: 'ataru',
      seed: a.id,
      ...(order ? { fights: schedule([{ from: 12, to: 200, perYear: 1, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 }]) } : {}),
      // D-445, D-451: Order archetypes live at their Order's seat by date, as the Average does, so a generated NPC matches a
      // player of the same life (Jedi: the Coruscant Temple; Sith: the Korriban academy, then Dromund Kaas; profiles.ts).
      ...archetypeSeat(a.path),
    },
    PACE_YEARS,
    { phaseXp: true, ...(youth ? { youthTo: CAREER_YOUTH_TO } : {}) },
  );
  const R = referenceRate(K);
  const end = a.startAge + PACE_YEARS;
  const ranges = youth
    ? ({ initiate: [a.startAge, CAREER_YOUTH_TO], padawan: [CAREER_YOUTH_TO, CAREER_YOUTH_TO], knight: [CAREER_YOUTH_TO, end] } as const)
    : ({ initiate: [a.startAge, Math.max(a.startAge, padawanAge)], padawan: [Math.max(a.startAge, padawanAge), Math.max(a.startAge, knightAge)], knight: [Math.max(a.startAge, knightAge), end] } as const);
  const out: MeasuredPaces = { id, k: K, paces: {}, formPaces: {}, mainAt25: life.mainByYear[24] ?? 0 };
  for (const ph of ['initiate', 'padawan', 'knight'] as const) {
    const [x, y] = ranges[ph];
    if (y - x < 0.25) continue;
    const xp = life.phaseXp![ph];
    const paces: Record<string, number> = {};
    const forms: Record<string, number> = {};
    // The sources are scaled so the closed form reproduces the main form's own gain (the highest form, which the
    // milestones and rank minimums read): the closed form shares a phase's sources out by the plan (an Initiate's all to
    // Shii-Cho; a Padawan's master session to the main form, the fill by plan hours; a Knight's fill by plan hours),
    // while on the loop the main form also takes the fights' XP and the drills spill into the other forms.
    const mainForm = ph === 'initiate' && order ? 'shiiCho' : 'soresu';
    const mainShare: Record<string, number> = ph === 'initiate' && order ? { order: 1, fill: 1 } : ph === 'padawan' ? { master: 1, solo: 0, fill: PACE_PLAN.soresu / 3 } : { fill: PACE_PLAN.soresu / 3 };
    const mainXp = Math.max(0, xp[mainForm] ?? 0);
    const toMain = Object.entries(xp).filter(([k, v]) => k.startsWith('src:') && v > 0).reduce((t, [k, v]) => t + v * (mainShare[k.slice(4)] ?? 0), 0);
    // The Jedi Initiate lightsaber curriculum (D-459): Form I trains from the gate age, alone to the survey age, then with
    // its survey share, so its pace is read over those effective years (the closed form's curriculum mirrors it).
    const cur = ph === 'initiate' && a.path === 'jedi';
    const g = Math.max(x, INITIATE_CURRICULUM.gateAge);
    const sv = Math.min(y, Math.max(g, INITIATE_CURRICULUM.surveyFromAge));
    const formYears = cur ? ageIntegral('technique', g, sv) + (surveyShares()['shiiCho'] ?? 0) * ageIntegral('technique', sv, y) : ageIntegral('technique', x, y);
    for (const [k, v] of Object.entries(xp)) {
      if (k.startsWith('src:')) {
        if (v > 0 && toMain > 0 && formYears > 0) forms[k.slice(4)] = r3(((v * mainXp) / toMain) / formYears / R);
        continue;
      }
      if (FORM_IDS.includes(k) || v <= 0) continue;
      const def = SKILL_BY_ID.get(k);
      if (!def) continue;
      paces[k] = r3(v / ageIntegral(CATEGORY_RULES[def.category].ageRow, x, y) / R);
    }
    if (youth && ph === 'initiate') out.youthPaces = paces;
    else out.paces[ph] = paces;
    if (Object.keys(forms).length) out.formPaces[ph] = forms;
  }
  mkdirSync(PACE_DIR, { recursive: true });
  writeFileSync(join(PACE_DIR, `${id}.json`), JSON.stringify(out, null, 1));
  return out;
}
