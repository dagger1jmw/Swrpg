// Phase paces per archetype (D-67 decision, closed form with measured phase factors;
// npc-generation §1, §3). Each archetype runs its own default routine through the day model:
// Jedi and Sith use the Order requirements (ranks.md §1a; Sith use the Jedi rows until M7,
// D-42) with Padawan / apprentice at 12 and Knight / Lord at 20.5; careers fill the whole
// budget by shares. pace(skill, phase) = credited XP of the skill in that phase per
// age-weighted year of the skill's own age row, divided by R, the Average profile's mean
// main-form rate over ages 4-20 (so A_ref stays A(technique, 4, 20) = 17.98).
// Run: node docs-v2/calc/archetype-paces.mjs
import { CATEGORY_AGE_ROW, A, EXP } from './model.mjs';
import { runProfile, solveK, AVERAGE, ORDER_REQS, focusShares, FORMS } from './progression-sim.mjs';
import { ARCHETYPES, ARCHETYPE_PATH, SKILLS, shares } from './activities.mjs';

const YEARS = 60;
const NO_REQS = { initiate: [], padawan: [], knight: [] };

export function archetypeProfile(id) {
  const w = ARCHETYPES[id];
  const main = Object.keys(w)[0];
  const [path, startAge] = ARCHETYPE_PATH[id];
  const order = path === 'jedi' || path === 'sith';
  return {
    ...AVERAGE,
    name: id,
    startAge,
    shares: shares(w),
    knightShares: focusShares(w, main, 0.5),
    orderReqs: order ? ORDER_REQS : NO_REQS,
    padawanAge: order ? AVERAGE.padawanAge : startAge,
    knightAge: order ? AVERAGE.knightAge : startAge,
    main,
    path,
  };
}

function phaseRanges(p) {
  const end = p.startAge + YEARS;
  return {
    initiate: [p.startAge, Math.max(p.startAge, p.padawanAge)],
    padawan: [Math.max(p.startAge, p.padawanAge), Math.max(p.startAge, p.knightAge)],
    knight: [Math.max(p.startAge, p.knightAge), end],
  };
}

/**
 * R: XP per age-weighted year at pace 1.0. Defined (D-119) as K * 41^1.75 / A_ref so that
 * level = 41 * (sum of pace * A / A_ref)^(1/1.75) is exactly level-from-XP; before, R was measured
 * from the Average's main-form rate.
 */
export function referenceRate(K) {
  return (K * Math.pow(41, EXP)) / A('technique', 4, 20);
}

/** Form-XP sources per phase (D-118): the Order forms block, the master session, the solo hour, fill. */
export const FORM_SOURCES = { initiate: ['order', 'fill'], padawan: ['master', 'solo', 'fill'], knight: ['fill'] };

export function archetypePaces(id, K, R = referenceRate(K)) {
  const p = archetypeProfile(id);
  const { phaseXp } = runProfile(p, K, YEARS);
  const ranges = phaseRanges(p);
  const out = {};
  const forms = {};
  for (const [ph, [a, b]] of Object.entries(ranges)) {
    if (b - a < 0.25) continue;
    out[ph] = {};
    forms[ph] = {};
    for (const s of Object.keys(SKILLS)) {
      if (FORMS.includes(s)) continue;
      const xp = (phaseXp[ph][s] ?? 0) + (s === 'Willpower' ? phaseXp[ph].WillpowerFatigue ?? 0 : 0);
      if (xp <= 0) continue;
      out[ph][s] = xp / A(CATEGORY_AGE_ROW[SKILLS[s]], a, b) / R;
    }
    // Forms: the pace of all form XP from each source (shared out by the form plan in the closed form).
    for (const src of FORM_SOURCES[ph]) {
      const xp = phaseXp[ph]['src:' + src] ?? 0;
      if (xp > 0) forms[ph][src] = xp / A('technique', a, b) / R;
    }
  }
  return { main: p.main, path: p.path, startAge: p.startAge, paces: out, formPaces: forms };
}

if (process.argv[1]?.endsWith('archetype-paces.mjs')) {
  // D-133: K stays at the decided 11.683 (the src day loop meets the 16.0-year Adept with it); set
  // CALC_K to measure at another K, or CALC_K=solve to re-solve it here.
  const K = process.env.CALC_K === 'solve' ? solveK(AVERAGE) : Number(process.env.CALC_K ?? 11.683);
  const R = referenceRate(K);
  console.log(`K = ${K.toFixed(3)}, R (XP per age-weighted year at pace 1 = K * 41^1.75 / A_ref) = ${R.toFixed(1)}\n`);
  const all = {};
  for (const id of Object.keys(ARCHETYPES)) {
    const r = archetypePaces(id, K, R);
    all[id] = r;
    console.log(`### ${id} (${r.path}, start ${r.startAge}, main ${r.main})`);
    console.log('| Skill | ' + Object.keys(r.paces).join(' | ') + ' |');
    console.log('|---|' + Object.keys(r.paces).map(() => '---|').join(''));
    const skills = [...new Set(Object.values(r.paces).flatMap((x) => Object.keys(x)))];
    for (const s of skills) console.log(`| ${s} | ${Object.keys(r.paces).map((ph) => (r.paces[ph][s] ?? 0).toFixed(3)).join(' | ')} |`);
    for (const ph of Object.keys(r.formPaces)) for (const [src, v] of Object.entries(r.formPaces[ph])) console.log(`| forms (${ph}, ${src}) | ${v.toFixed(3)} |`);
    console.log('');
  }
  const round = (o) => Object.fromEntries(Object.entries(o).map(([ph, x]) => [ph, Object.fromEntries(Object.entries(x).map(([s, v]) => [s, +v.toFixed(3)]))]));
  console.log('JSON (copy into src/data/archetypes.ts):');
  console.log(JSON.stringify(Object.fromEntries(Object.entries(all).map(([id, r]) => [id, { paces: round(r.paces), formPaces: round(r.formPaces) }]))));
}
