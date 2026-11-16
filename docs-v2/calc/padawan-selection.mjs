// Padawan selection (ranks.md §1, row 38 / D-66).
// 1. Skill percentile: the Average profile against 1,000 seeded NPC Initiates of the same age
//    (closed form, npc-generation §2 talent distribution, variance exp(N(0, 0.12)) per skill).
// 2. Monthly divisor d so that an average-standing Initiate (S = 50) is never chosen with
//    probability 0.14 over the real window (Initiate Trials passed -> age 13).
// 3. A 10,000-run seeded check of the result (ranks.md test 2: 14% +/- 3).
// Run: node docs-v2/calc/padawan-selection.mjs
import { sfc32, gaussian } from './model.mjs';
import { closedForm } from './npc-closed-form.mjs';

// Initiate-phase paces relative to the main form, measured from the Average profile
// (npc-closed-form.mjs, "secondary paces by phase").
const INITIATE_PACE = { mainForm: 1.0, ForceControl: 0.389, ForceSense: 0.373 };
const TRIAL_AGE = 10.8;       // Average meets the recomputed Initiate Trial minimums (D-66)
const LAST_AGE = 13.0;
const MONTHS_PER_YEAR = 12;

function talent(rng) {
  const r = rng();
  return r < 0.70 ? 1.0 : r < 0.92 ? 1.25 : r < 0.99 ? 1.5 : 1.8; // Force-trained orders
}
function composite(levels) {
  return (levels.mainForm + levels.ForceControl + levels.ForceSense) / 3;
}
function initiateLevels(age, rng) {
  const combat = rng ? talent(rng) : 1;
  const force = rng ? talent(rng) : 1;
  const out = {};
  for (const [s, p] of Object.entries(INITIATE_PACE)) {
    const t = s === 'mainForm' ? combat : force;
    const v = rng ? Math.exp(0.12 * gaussian(rng)) : 1;
    const startAge = rng ? 2 + Math.floor(rng() * 4) : 4; // Jedi start ages 2-5
    out[s] = closedForm({ startAge, age, pace: Math.min(4.0, p * t * v) });
  }
  return out;
}

const rng = sfc32(0x5eed, 0xa11, 0x7e57, 0x1);
console.log('| Age | Average composite | Average percentile among 1,000 NPC Initiates |\n|---|---|---|');
for (const age of [10, 10.8, 11, 12, 13]) {
  const pop = Array.from({ length: 1000 }, () => composite(initiateLevels(age, rng))).sort((a, b) => a - b);
  const avg = composite(initiateLevels(age, null));
  const below = pop.filter((x) => x < avg).length;
  console.log(`| ${age} | ${avg.toFixed(1)} | ${(below / 10).toFixed(1)} |`);
}

const months = Math.round((LAST_AGE - TRIAL_AGE) * MONTHS_PER_YEAR);
const p = 1 - Math.pow(0.14, 1 / months);
const d = 50 / p;
console.log(`\nWindow: ${TRIAL_AGE} -> ${LAST_AGE} = ${months} monthly rolls`);
console.log(`Monthly chance at S 50 = ${(100 * p).toFixed(2)}%  ->  divisor d = 50 / p = ${d.toFixed(1)}`);
const dRounded = Math.round(d / 5) * 5;
const pr = 50 / dRounded;
console.log(`Rounded divisor ${dRounded}: monthly ${(100 * pr).toFixed(2)}%, never chosen (exact) = ${(100 * Math.pow(1 - pr, months)).toFixed(2)}%`);
const rng2 = sfc32(0xc0de, 0x13, 0x8, 0x99);
let never = 0;
for (let i = 0; i < 10000; i++) {
  let chosen = false;
  for (let m = 0; m < months && !chosen; m++) if (rng2() < 50 / dRounded) chosen = true;
  if (!chosen) never++;
}
console.log(`Seeded 10,000 runs, S 50, divisor ${dRounded}: never chosen ${(never / 100).toFixed(2)}%`);
console.log(`Old divisor 800 over the same window: never chosen ${(100 * Math.pow(1 - 50 / 800, months)).toFixed(2)}%`);
