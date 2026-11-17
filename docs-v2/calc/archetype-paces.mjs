// Phase paces per archetype (D-67 decision, closed form with measured phase factors;
// npc-generation §1, §3). Each archetype runs its own default routine through the day model:
// Jedi and Sith use the Order requirements (ranks.md §1a; Sith use the Jedi rows until M7,
// D-42) with Padawan / apprentice at 12 and Knight / Lord at 20.5; careers fill the whole
// budget by shares. pace(skill, phase) = credited XP of the skill in that phase per
// age-weighted year of the skill's own age row, divided by R, the Average profile's mean
// main-form rate over ages 4-20 (so A_ref stays A(technique, 4, 20) = 17.98).
// Run: node docs-v2/calc/archetype-paces.mjs
import { CATEGORY_AGE_ROW, A } from './model.mjs';
import { runProfile, solveK, AVERAGE, ORDER_REQS, focusShares } from './progression-sim.mjs';
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

/** R: the Average's mean main-form XP per age-weighted year over ages 4-20. */
export function referenceRate(K) {
  const { phaseXp } = runProfile(AVERAGE, K, 17);
  const rI = phaseXp.initiate.mainForm / A('technique', 4, AVERAGE.padawanAge);
  const rP = phaseXp.padawan.mainForm / A('technique', AVERAGE.padawanAge, AVERAGE.knightAge);
  return (rI * A('technique', 4, 12) + rP * A('technique', 12, 20)) / A('technique', 4, 20);
}

export function archetypePaces(id, K, R = referenceRate(K)) {
  const p = archetypeProfile(id);
  const { phaseXp } = runProfile(p, K, YEARS);
  const ranges = phaseRanges(p);
  const out = {};
  for (const [ph, [a, b]] of Object.entries(ranges)) {
    if (b - a < 0.25) continue;
    out[ph] = {};
    for (const s of Object.keys(SKILLS)) {
      const xp = (phaseXp[ph][s] ?? 0) + (s === 'Willpower' ? phaseXp[ph].WillpowerFatigue ?? 0 : 0);
      if (xp <= 0) continue;
      out[ph][s] = xp / A(CATEGORY_AGE_ROW[SKILLS[s]], a, b) / R;
    }
  }
  return { main: p.main, path: p.path, startAge: p.startAge, paces: out };
}

if (process.argv[1]?.endsWith('archetype-paces.mjs')) {
  const K = solveK(AVERAGE);
  const R = referenceRate(K);
  console.log(`K = ${K.toFixed(3)}, R (Average main-form XP per age-weighted year, ages 4-20) = ${R.toFixed(1)}\n`);
  const all = {};
  for (const id of Object.keys(ARCHETYPES)) {
    const r = archetypePaces(id, K, R);
    all[id] = r;
    console.log(`### ${id} (${r.path}, start ${r.startAge}, main ${r.main})`);
    console.log('| Skill | ' + Object.keys(r.paces).join(' | ') + ' |');
    console.log('|---|' + Object.keys(r.paces).map(() => '---|').join(''));
    const skills = [...new Set(Object.values(r.paces).flatMap((x) => Object.keys(x)))];
    for (const s of skills) console.log(`| ${s} | ${Object.keys(r.paces).map((ph) => (r.paces[ph][s] ?? 0).toFixed(3)).join(' | ')} |`);
    console.log('');
  }
  console.log('JSON (copy into src/data/archetypes.ts):');
  console.log(JSON.stringify(Object.fromEntries(Object.entries(all).map(([id, r]) => [id, Object.fromEntries(Object.entries(r.paces).map(([ph, o]) => [ph, Object.fromEntries(Object.entries(o).map(([s, v]) => [s, +v.toFixed(3)]))]))]))));
}
