// NPC closed form with the age learning factor as a piecewise-linear integral
// (npc-generation.md §1, row 9 / D-43). Compares it with the day-by-day Average profile
// (test 2, +/-2 levels at 10, 30, 60 years) and recomputes the reference table (row 10).
// Run: node docs-v2/calc/npc-closed-form.mjs
import { ageFactor, AGE_ROWS } from './model.mjs';
import { runProfile, solveK, AVERAGE } from './progression-sim.mjs';
import { levelFromXp, DAYS_PER_YEAR } from './model.mjs';

const AGE_X = [6, 10, 15, 24, 40, 60];

// Exact integral of a piecewise-linear function between a and b (trapezoids on the breakpoints).
export function integrate(fn, breakpoints, a, b) {
  if (b <= a) return 0;
  const pts = [a, ...breakpoints.filter((x) => x > a && x < b), b];
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += ((fn(pts[i - 1]) + fn(pts[i])) / 2) * (pts[i] - pts[i - 1]);
  return s;
}
export const A = (row, a, b) => integrate((x) => ageFactor(row, x), AGE_X, a, b);
// Reference: the Average profile, technique row, ages 4-20 (41 in 16.0 years).
export const A_REF = A('technique', 4, 20);

// level = 41 * (pace * (A(start, start + years_trained) + 0.3 * war years) / A_REF)^(1/1.75)
// War years are added at weight 1.0 of the age factor's value at the current age (kept from
// the old form: effective years = years trained + 0.3 * war years).
export function closedForm({ row = 'technique', startAge, age, pace = 1, warYears = 0 }) {
  const a = A(row, startAge, age) + 0.3 * warYears * ageFactor(row, age);
  return 41 * Math.pow(Math.max(0, (pace * a) / A_REF), 1 / 1.75);
}

if (process.argv[1]?.endsWith('npc-closed-form.mjs')) {
  console.log(`A_REF (technique, ages 4-20) = ${A_REF.toFixed(4)} age-weighted years`);
  // Test 2: closed form vs the day-by-day Average profile.
  const K = solveK(AVERAGE);
  const sim = {};
  runProfile(AVERAGE, K, 60, (t, age, xp) => { if ([10, 30, 60].includes(Math.round(t * 1000) / 1000)) sim[t] = levelFromXp(xp.mainForm, K); });
  console.log('\nTest 2 (Average profile, main form):\n| Years | Day-by-day | Closed form | Difference |\n|---|---|---|---|');
  for (const y of [10, 30, 60]) {
    const c = closedForm({ startAge: 4, age: 4 + y });
    console.log(`| ${y} | ${sim[y].toFixed(1)} | ${c.toFixed(1)} | ${(c - sim[y]).toFixed(1)} |`);
  }
  // Reference table (variance off), main skill, pace = main-specialty pace 1.0 x talent x state.
  const ref = [
    ['Padawan, age 16 (trained since 4)', 35, { startAge: 4, age: 16 }],
    ['Average Jedi Knight, age 30', 54, { startAge: 4, age: 30 }],
    ['Average Jedi Master, age 45', 70, { startAge: 4, age: 45 }],
    ['Elder Master, age 70', 92, { startAge: 4, age: 70 }],
    ['Obi-Wan check: 1.48x pace, age 39 (start 3)', 81.5, { startAge: 3, age: 39, pace: 1.48 }],
    ['Anakin check: 3.89x pace, 13.5 years (start 9)', 81, { startAge: 9, age: 22.5, pace: 3.89 }],
    ['Republic trooper sergeant, 35, start 17, 5 war years (blaster)', 46, { startAge: 17, age: 35, warYears: 5 }],
    ['Sith warrior, 35, start 8, prodigy x1.5, angry x1.15, 10 war years', 80, { startAge: 8, age: 35, pace: 1.5 * 1.15, warYears: 10 }],
  ];
  console.log('\nReference table:\n| NPC | Old level | New level |\n|---|---|---|');
  for (const [n, o, a] of ref) console.log(`| ${n} | ${o} | ${closedForm(a).toFixed(1)} |`);
  // Secondary-skill paces per phase, measured from the Average (Jedi Guardian) profile:
  // credited XP of the skill / credited main-form XP in the same rank phase.
  const { phaseXp } = runProfile(AVERAGE, K, 40);
  console.log('\nJedi Guardian / Average secondary paces by phase (skill XP / main-form XP):');
  console.log('| Skill | Initiate | Padawan | Knight+ |\n|---|---|---|---|');
  for (const sk of ['mainForm', 'ForceControl', 'ForceSense', 'Willpower', 'WillpowerFatigue', 'Strength', 'Agility', 'Endurance', 'Meditation', 'ForceKnowledge', 'secondForm'])
    console.log(`| ${sk} | ${['initiate', 'padawan', 'knight'].map((r) => ((phaseXp[r][sk] ?? 0) / phaseXp[r].mainForm).toFixed(3)).join(' | ')} |`);
  // Old form (no age factor), for the log.
  const old = (y) => 41 * Math.pow(y / 16, 1 / 1.75);
  console.log('\nOld closed form (no age factor) at 10/30/60 years:', [10, 30, 60].map((y) => old(y).toFixed(1)).join(' / '));
}
