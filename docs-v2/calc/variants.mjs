// Compares Average-profile schedule variants against progression-targets §2 (D-40/D-41 conflict record).
import { runProfile, solveK, AVERAGE } from './progression-sim.mjs';
import { levelFromXp } from './model.mjs';
import { ARCHETYPES, shares } from './activities.mjs';

function focusMain(mainShare) {
  const g = { ...ARCHETYPES.jediGuardian }; delete g.mainForm;
  const rest = shares(g);
  return { mainForm: mainShare, ...Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v * (1 - mainShare)])) };
}
// Row 28 as written (before D-42) and the plain Guardian shares (before D-41).
const ROW28 = {
  initiate: [['formDrill', 2, 'initiateClass'], ['forceDrill', 1, 'initiateClass'], ['study', 1, 'initiateClass']],
  padawan: [['masterTraining', 2, 'master'], ['formDrill', 1, 'solo']],
  knight: [],
};
const BASE = { ...AVERAGE, orderReqs: ROW28, knightShares: null };
const SPLIT = {
  initiate: [['formDrill', 2, 'initiateClass'], ['forceDrill', 0.5, 'initiateClass'], ['senseDrill', 0.5, 'initiateClass'], ['study', 1, 'initiateClass']],
  padawan: [['masterTraining', 2, 'master'], ['formDrill', 1, 'solo']],
  knight: [],
};
const SPLIT_P = { ...SPLIT, padawan: [...SPLIT.padawan, ['forceDrill', 0.5, 'master'], ['senseDrill', 0.5, 'master']] };
const SPLIT_P2 = { ...SPLIT, padawan: [...SPLIT.padawan, ['forceDrill', 1, 'master'], ['senseDrill', 1, 'master']] };
const V = {
  'V0 as first approved (row 28 + Guardian shares all life)': { ...BASE },
  'V1 Knight+ main share 0.5': { ...BASE, shareFn: (a, r) => (r === 'knight' ? focusMain(0.5) : AVERAGE.shares) },
  'V2 V1 + baseline End/Will 30 for capacity': { ...BASE, baseStats: { Endurance: 30, Willpower: 30 }, shareFn: (a, r) => (r === 'knight' ? focusMain(0.5) : AVERAGE.shares) },
  'V3 V2 + Knight+ main share 0.55': { ...BASE, baseStats: { Endurance: 30, Willpower: 30 }, shareFn: (a, r) => (r === 'knight' ? focusMain(0.55) : AVERAGE.shares) },
  'V4 V1 + Force hour split FC/FS (0.5 h each)': { ...BASE, orderReqs: SPLIT, shareFn: (a, r) => (r === 'knight' ? focusMain(0.5) : AVERAGE.shares) },
  'V5 V4 + baseline End/Will 30': { ...BASE, orderReqs: SPLIT, baseStats: { Endurance: 30, Willpower: 30 }, shareFn: (a, r) => (r === 'knight' ? focusMain(0.5) : AVERAGE.shares) },
  'V6 V4 + Padawan req adds 0.5 h FC + 0.5 h FS': { ...BASE, orderReqs: SPLIT_P, shareFn: (a, r) => (r === 'knight' ? focusMain(0.5) : AVERAGE.shares) },
  'V7 V6 with 1 h FC + 1 h FS': { ...BASE, orderReqs: SPLIT_P2, shareFn: (a, r) => (r === 'knight' ? focusMain(0.5) : AVERAGE.shares) },
};
console.log('| Variant | K | 21 | 41 | 61 | 81 | 101 | FC@20.5 | FS@20.5 | Will@20.5 | End@20.5 |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|');
for (const [name, p] of Object.entries(V)) {
  const K = solveK(p);
  const r = runProfile(p, K, 95);
  const at = runProfile(p, K, 16.5).xp;
  const L = (s) => levelFromXp(at[s], K).toFixed(1);
  const m = (k) => (r.milestones[k] ?? NaN).toFixed(1);
  console.log(`| ${name} | ${K.toFixed(2)} | ${m(21)} | ${m(41)} | ${m(61)} | ${m(81)} | ${m(101)} | ${L('ForceControl')} | ${L('ForceSense')} | ${L('Willpower')} | ${L('Endurance')} |`);
}
console.log('| Chosen (D-41 + D-42) = V7 = the AVERAGE profile in progression-sim.mjs | | | | | | | | | | |');
console.log('| Target (progression-targets §2, +/-20%) | | 5.0 | 16.0 | 32.1 | 52.7 | 77.5 | Knight min 30 | 30 | 35 | |');
