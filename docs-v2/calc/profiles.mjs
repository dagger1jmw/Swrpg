// Obi-Wan, Anakin and Luke on the Average schedule structure (D-40): only hours (effort),
// talents, teachers and rank ages change. PEACETIME BASELINE: no combat events and no
// combat XP (their wartime pace comes from combat-xp.md and is tuned in M4).
// Run: node docs-v2/calc/profiles.mjs
import { runProfile, solveK, AVERAGE, focusShares } from './progression-sim.mjs';
import { ARCHETYPES, SKILLS, shares } from './activities.mjs';

const K = solveK(AVERAGE);
const techForce = (m) => Object.fromEntries(Object.keys(SKILLS).filter((s) => ['technique', 'force'].includes(SKILLS[s])).map((s) => [s, m]));
const force = (m) => Object.fromEntries(Object.keys(SKILLS).filter((s) => SKILLS[s] === 'force').map((s) => [s, m]));

const PROFILES = {
  'Obi-Wan (start 3, push, master strong in his form)': {
    ...AVERAGE, startAge: 3, effort: 'push', trainingDays: 315, padawanAge: 13, knightAge: 25,
    instruction: { ...AVERAGE.instruction, master: 1.15 + 0.05 },
  },
  'Anakin (start 9, push, prodigy combat+Force, x1.1 cross on combat)': {
    ...AVERAGE, startAge: 9, effort: 'push', trainingDays: 315, padawanAge: 9, knightAge: 20,
    talent: { ...techForce(1.5), mainForm: 1.5 * 1.1, secondForm: 1.5 * 1.1 },
    instruction: { ...AVERAGE.instruction, master: 1.05 }, // master not a specialist in his form
  },
  'Luke (start 19, outsider, standard, Force prodigy, solo/holocron)': {
    ...AVERAGE, startAge: 19, effort: 'standard', trainingDays: 280, padawanAge: 200, knightAge: 19,
    talent: force(1.5), instruction: { ...AVERAGE.instruction, fill: 0.9 },
    knightShares: focusShares(ARCHETYPES.jediGuardian, 'mainForm', 0.4), // broad focus
  },
};
console.log(`K = ${K.toFixed(3)} (from the Average profile)\n`);
console.log('| Profile | 21 | 41 | 61 | 81 | 101 | Target 21 / 41 / 61 / 81 / 101 |\n|---|---|---|---|---|---|---|');
const T = ['3.4 / 10.8 / 21.7 / 35.6 / 52.4', '1.3 / 4.1 / 8.2 / 13.5 / 19.9', '2.1 / 6.9 / 13.9 / 22.8 / 33.6'];
Object.entries(PROFILES).forEach(([name, p], i) => {
  const r = runProfile(p, K, 70);
  const m = (k) => (r.milestones[k] !== undefined ? r.milestones[k].toFixed(1) : '-');
  console.log(`| ${name} | ${m(21)} | ${m(41)} | ${m(61)} | ${m(81)} | ${m(101)} | ${T[i]} |`);
});
