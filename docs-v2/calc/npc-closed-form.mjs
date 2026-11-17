// NPC closed form (npc-generation.md §1). D-43 added the age learning factor as an exact
// piecewise-linear integral; the D-67 decision (M3) adds measured phase paces for every skill,
// including the main one (archetype-paces.mjs), because the day loop's main-form rate differs
// by rank phase (Initiate 2 h of forms, Padawan 3 h+, Knight+ half of a full budget).
// Run: node docs-v2/calc/npc-closed-form.mjs
import { ageFactor, levelFromXp, A } from './model.mjs';
import { runProfile, solveK, AVERAGE } from './progression-sim.mjs';
import { archetypePaces, referenceRate } from './archetype-paces.mjs';

export { A };
// Reference: the Average profile, technique row, ages 4-20 (41 in 16.0 years).
export const A_REF = A('technique', 4, 20);

// D-43 form with one constant pace (kept for the history comparison).
export function closedForm({ row = 'technique', startAge, age, pace = 1, warYears = 0 }) {
  const a = A(row, startAge, age) + 0.3 * warYears * ageFactor(row, age);
  return 41 * Math.pow(Math.max(0, (pace * a) / A_REF), 1 / 1.75);
}

/**
 * Phase-pace closed form. phases: [{from, to, pace}] (ages; the last may have to = Infinity).
 * level = 41 * ((sum of pace * A(row, phase within [start, age]) + 0.3 * war years * pace now *
 *   a(row, age)) / A_REF)^(1/1.75). Each phase pace is capped at 4.0.
 */
export function closedFormPhased({ row = 'technique', startAge, age, phases, mult = 1, warYears = 0 }) {
  let s = 0;
  let paceNow = 0;
  for (const ph of phases) {
    const p = Math.min(4.0, ph.pace * mult);
    const a = Math.max(startAge, ph.from);
    const b = Math.min(age, ph.to);
    if (b > a) s += p * A(row, a, b);
    if (age > ph.from && age <= ph.to) paceNow = p;
  }
  s += 0.3 * warYears * paceNow * ageFactor(row, age);
  return 41 * Math.pow(Math.max(0, s / A_REF), 1 / 1.75);
}

/** Phases from archetype paces (archetype-paces.mjs) and the rank ages. */
export function phasesFor(paces, skill, { padawanAge = 12, knightAge = 20.5 } = {}) {
  const out = [];
  if (paces.initiate) out.push({ from: -Infinity, to: padawanAge, pace: paces.initiate[skill] ?? 0 });
  if (paces.padawan) out.push({ from: padawanAge, to: knightAge, pace: paces.padawan[skill] ?? 0 });
  out.push({ from: paces.initiate ? knightAge : -Infinity, to: Infinity, pace: paces.knight[skill] ?? 0 });
  return out;
}

/**
 * Form levels by the form plan (D-118) with the fundamentals transfer (D-119). Initiates put every
 * form hour on Shii-Cho; from Padawan the 2 h master session goes to the plan's forms in order of
 * hours (largest first), the 1 h solo hour to the next, fill by plan share; from Knight the fill by
 * the Knight plan. A form's first phase starts it at transferShare x the highest form's XP then.
 * Returns levels per form id. plan: {form: hours} (Padawan, summing to 3); knightPlan optional.
 */
export function formLevels({ formPaces, K, startAge, age, padawanAge = 12, knightAge = 20.5, onePhase = false, plan, knightPlan = plan, mult = 1, transferShare = 0.75, warYears = 0 }) {
  const R = referenceRate(K);
  const xp = {};
  const started = new Set();
  const best = () => Math.max(0, ...Object.values(xp));
  const add = (f, pace, a, b) => { if (b > a) xp[f] = (xp[f] ?? 0) + R * Math.min(4, pace * mult) * A('technique', a, b); };
  const start = (forms, at) => { const t = transferShare * best(); for (const f of forms) if (!started.has(f)) { started.add(f); xp[f] = Math.max(xp[f] ?? 0, t); } void at; };
  const split = (pl) => {
    const order = Object.entries(pl).filter(([, h]) => h > 0).sort((x, y) => y[1] - x[1]);
    const tot = order.reduce((s, [, h]) => s + h, 0);
    let master = 2, solo = 1;
    const out = {};
    for (const [f, h] of order) {
      const m = Math.min(master, h); master -= m;
      const sl = Math.min(solo, h - m); solo -= sl;
      out[f] = { master: m / 2, solo: sl / 1, fill: h / tot };
    }
    return out;
  };
  let paceNow = {};
  if (!onePhase) {
    const a = startAge, b = Math.min(age, padawanAge);
    if (b > a) { start(['shiiCho'], a); const p = (formPaces.initiate?.order ?? 0) + (formPaces.initiate?.fill ?? 0); add('shiiCho', p, a, b); paceNow = { shiiCho: p }; }
    const pa = Math.max(startAge, padawanAge), pb = Math.min(age, knightAge);
    if (pb > pa) {
      const sp = split(plan); start(Object.keys(sp), pa); paceNow = {};
      for (const [f, w] of Object.entries(sp)) { const p = (formPaces.padawan?.master ?? 0) * w.master + (formPaces.padawan?.solo ?? 0) * w.solo + (formPaces.padawan?.fill ?? 0) * w.fill; add(f, p, pa, pb); paceNow[f] = p; }
    }
  }
  const ka = onePhase ? startAge : Math.max(startAge, knightAge);
  if (age > ka) {
    const sp = split(knightPlan); start(Object.keys(sp), ka); paceNow = {};
    for (const [f, w] of Object.entries(sp)) { const p = (formPaces.knight?.fill ?? 0) * w.fill; add(f, p, ka, age); paceNow[f] = p; }
  }
  for (const [f, p] of Object.entries(paceNow)) xp[f] = (xp[f] ?? 0) + R * 0.3 * warYears * Math.min(4, p * mult) * ageFactor('technique', age);
  return Object.fromEntries(Object.entries(xp).map(([f, v]) => [f, levelFromXp(v, K)]));
}
export const highest = (lv) => Math.max(0, ...Object.values(lv));
export const AVERAGE_PLAN = { soresu: 2, ataru: 1 };

if (process.argv[1]?.endsWith('npc-closed-form.mjs')) {
  console.log(`A_REF (technique, ages 4-20) = ${A_REF.toFixed(4)} age-weighted years`);
  const K = solveK(AVERAGE);
  const R = referenceRate(K);
  const G = archetypePaces('jediGuardian', K, R).formPaces;
  console.log('Guardian form paces by source:', JSON.stringify(G));
  // Test 2 (and character-creation test 2 at 5 years): closed form vs the day loop, highest form.
  const sim = {};
  runProfile(AVERAGE, K, 60, (t, age, xp) => { if ([5, 8, 10, 12, 16, 20, 30, 60].includes(Math.round(t * 1000) / 1000)) sim[t] = Math.max(...['shiiCho', 'mainForm', 'secondForm'].map((f) => levelFromXp(xp[f], K))); });
  console.log('\nTest 2 (Average profile, highest form):\n| Years | Day-by-day | Closed form | Difference |\n|---|---|---|---|');
  const avg = (age, extra = {}) => formLevels({ formPaces: G, K, startAge: 4, age, plan: AVERAGE_PLAN, ...extra });
  for (const y of [5, 8, 10, 12, 16, 20, 30, 60]) {
    const c = highest(avg(4 + y));
    console.log(`| ${y} | ${sim[y].toFixed(1)} | ${c.toFixed(1)} | ${(c - sim[y]).toFixed(1)} |`);
  }
  const S = archetypePaces('soldier', K, R).paces;
  const W = archetypePaces('sithWarrior', K, R).formPaces;
  const ref = [
    ['Padawan, age 16 (trained since 4)', highest(avg(16))],
    ['Average Jedi Knight, age 30', highest(avg(30))],
    ['Average Jedi Master, age 45', highest(avg(45))],
    ['Elder Master, age 70', highest(avg(70))],
    ['Obi-Wan check: x1.48, age 39 (start 3, Padawan 13, Knight 25)', highest(formLevels({ formPaces: G, K, startAge: 3, age: 39, padawanAge: 13, knightAge: 25, mult: 1.48, plan: AVERAGE_PLAN }))],
    ['Anakin check: x3.89 (capped 4.0), 13.5 years (start 9, Padawan 9, Knight 20)', highest(formLevels({ formPaces: G, K, startAge: 9, age: 22.5, padawanAge: 9, knightAge: 20, mult: 3.89, plan: AVERAGE_PLAN }))],
    ['Republic trooper sergeant, 35, start 17, 5 war years (blaster)', closedFormPhased({ startAge: 17, age: 35, warYears: 5, phases: phasesFor(S, 'blaster') })],
    ['Sith warrior, 35, start 8, prodigy x1.5, angry x1.15, 10 war years', highest(formLevels({ formPaces: W, K, startAge: 8, age: 35, mult: 1.5 * 1.15, warYears: 10, plan: AVERAGE_PLAN }))],
  ];
  console.log('\nReference table (variance off):\n| NPC | Level in main skill (highest form) |\n|---|---|');
  for (const [n, v] of ref) console.log(`| ${n} | ${v.toFixed(1)} |`);
  const pad = avg(16);
  console.log('\nPadawan 16 forms:', Object.entries(pad).map(([f, v]) => `${f} ${v.toFixed(1)}`).join(', '));
  console.log('Character creation: Average Knight at 24:', JSON.stringify(Object.fromEntries(Object.entries(avg(24)).map(([f, v]) => [f, +v.toFixed(1)]))),
    '| Initiate at 9:', highest(avg(9)).toFixed(1));
}
