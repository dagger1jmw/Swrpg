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

if (process.argv[1]?.endsWith('npc-closed-form.mjs')) {
  console.log(`A_REF (technique, ages 4-20) = ${A_REF.toFixed(4)} age-weighted years`);
  const K = solveK(AVERAGE);
  const R = referenceRate(K);
  const G = archetypePaces('jediGuardian', K, R).paces;
  const main = phasesFor(G, 'mainForm');
  console.log('Guardian main-form phase paces:', main.map((p) => p.pace.toFixed(3)).join(' / '));
  // Test 2 (and character-creation test 2 at 5 years): closed form vs the day loop.
  const sim = {};
  runProfile(AVERAGE, K, 60, (t, age, xp) => { if ([5, 10, 16, 20, 30, 60].includes(Math.round(t * 1000) / 1000)) sim[t] = levelFromXp(xp.mainForm, K); });
  console.log('\nTest 2 (Average profile, main form):\n| Years | Day-by-day | Phase closed form | Difference | D-43 form |\n|---|---|---|---|---|');
  for (const y of [5, 10, 16, 20, 30, 60]) {
    const c = closedFormPhased({ startAge: 4, age: 4 + y, phases: main });
    console.log(`| ${y} | ${sim[y].toFixed(1)} | ${c.toFixed(1)} | ${(c - sim[y]).toFixed(1)} | ${closedForm({ startAge: 4, age: 4 + y }).toFixed(1)} |`);
  }
  const S = archetypePaces('soldier', K, R).paces;
  const W = archetypePaces('sithWarrior', K, R).paces;
  const ref = [
    ['Padawan, age 16 (trained since 4)', 35.3, { startAge: 4, age: 16, phases: main }],
    ['Average Jedi Knight, age 30', 52.8, { startAge: 4, age: 30, phases: main }],
    ['Average Jedi Master, age 45', 66.9, { startAge: 4, age: 45, phases: main }],
    ['Elder Master, age 70', 85.5, { startAge: 4, age: 70, phases: main }],
    ['Obi-Wan check: x1.48, age 39 (start 3, Padawan 13, Knight 25)', 78.6, { startAge: 3, age: 39, mult: 1.48, phases: phasesFor(G, 'mainForm', { padawanAge: 13, knightAge: 25 }) }],
    ['Anakin check: x3.89 (capped 4.0 per phase), 13.5 years (start 9, Padawan 9, Knight 20)', 78.4, { startAge: 9, age: 22.5, mult: 3.89, phases: phasesFor(G, 'mainForm', { padawanAge: 9, knightAge: 20 }) }],
    ['Republic trooper sergeant, 35, start 17, 5 war years (blaster)', 42.8, { startAge: 17, age: 35, warYears: 5, phases: phasesFor(S, 'blaster') }],
    ['Sith warrior, 35, start 8, prodigy x1.5, angry x1.15, 10 war years', 76.1, { startAge: 8, age: 35, mult: 1.5 * 1.15, warYears: 10, phases: phasesFor(W, 'mainForm') }],
  ];
  console.log('\nReference table (variance off):\n| NPC | D-43 level | Phase closed form |\n|---|---|---|');
  for (const [n, o, a] of ref) console.log(`| ${n} | ${o} | ${closedFormPhased(a).toFixed(1)} |`);
  console.log('\nCharacter creation: Average Knight at 24 (start 4):', closedFormPhased({ startAge: 4, age: 24, phases: main }).toFixed(1),
    '| Initiate at 9 (start 4):', closedFormPhased({ startAge: 4, age: 9, phases: main }).toFixed(1));
}
