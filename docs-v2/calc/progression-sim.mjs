// Day-by-day progression simulator for the calibration profiles (decisions D-40, D-41, D-42).
// Schedule = Order requirements (ranks.md §1a) filled up to the D-25 training budget by
// archetype shares, through the day model in day.mjs. Run:
//   node docs-v2/calc/progression-sim.mjs
import {
  DAYS_PER_YEAR, levelFromXp, bestChallenge, OUTCOME_MEAN, ageFactor, CATEGORY_AGE_ROW,
  bodyCap, budget, INTENSITY,
} from './model.mjs';
import { simulateDay } from './day.mjs';
import { ACT, TRAINS, SKILLS, ARCHETYPES, shares } from './activities.mjs';

export const AVERAGE = {
  name: 'Average',
  startAge: 4,
  effort: 'standard',
  trainingDays: 300,          // of 368
  shares: shares(ARCHETYPES.jediGuardian),
  padawanAge: 12,             // chosen inside the 10.5-13 window
  knightAge: 20.5,
  talent: {},                 // per skill multiplier (none)
  instruction: { initiateClass: 1.05, master: 1.15, solo: 0.9, fill: 1.0 },
  knightMainShare: 0.5,       // D-41: from Knight on, the main specialty takes 0.5 of the fill
};

// Archetype shares with the main specialty fixed at mainShare and the rest in proportion.
export function focusShares(weights, mainKey, mainShare) {
  const rest = { ...weights }; delete rest[mainKey];
  const r = shares(rest);
  return { [mainKey]: mainShare, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v * (1 - mainShare)])) };
}
AVERAGE.knightShares = focusShares(ARCHETYPES.jediGuardian, 'mainForm', AVERAGE.knightMainShare);

// ranks.md §1a Order requirements (row 28 / D-42): Initiate 2 h forms + 1 h Force (split
// Force Control / Force Sense) + 1 h study; Padawan 2 h with master + 1 h solo + 1 h Force
// Control and 1 h Force Sense with the master; Knight and above none.
export const ORDER_REQS = {
  initiate: [['formDrill', 2, 'initiateClass'], ['forceDrill', 0.5, 'initiateClass'], ['senseDrill', 0.5, 'initiateClass'], ['study', 1, 'initiateClass']],
  padawan: [['masterTraining', 2, 'master'], ['formDrill', 1, 'solo'], ['forceDrill', 1, 'master'], ['senseDrill', 1, 'master']],
  knight: [],
};

function rankAt(p, age) {
  if (age < p.padawanAge) return 'initiate';
  if (age < p.knightAge) return 'padawan';
  return 'knight';
}

function buildDay(p, age, credit) {
  const rank = rankAt(p, age);
  const B = budget(p.effort, age);
  const blocks = [];
  let used = 0;
  for (const [act, h, instr] of (p.orderReqs ?? ORDER_REQS)[rank]) {
    blocks.push({ act: ACT[act], hours: h, instruction: p.instruction[instr] });
    used += h;
  }
  // Fill the rest of the budget by shares, in 0.5 h units, using a running credit so
  // long-run hours match the shares exactly.
  const remaining = Math.max(0, B - used);
  const sh = p.shareFn ? p.shareFn(age, rank) : (rank === 'knight' && p.knightShares ? p.knightShares : p.shares);
  for (const [skill, s] of Object.entries(sh)) credit[skill] = (credit[skill] ?? 0) + remaining * s;
  let left = Math.floor(remaining / 0.5 + 1e-9) * 0.5;
  const fill = {};
  while (left >= 0.5) {
    const [skill] = Object.entries(credit).sort((a, b) => b[1] - a[1])[0];
    credit[skill] -= 0.5;
    fill[skill] = (fill[skill] ?? 0) + 0.5;
    left -= 0.5;
  }
  for (const [skill, h] of Object.entries(fill)) {
    blocks.push({ act: ACT[TRAINS[skill]], hours: h, instruction: p.instruction.fill, fill: true });
  }
  return blocks;
}

// training-routines §3-4: sessions <= 2 h; physical first, a mental block after each
// physical one, meditation last, 0.5 h rest between physical blocks when f_phys > 0.7.
function orderBlocks(blocks) {
  const split = [];
  for (const b of blocks) {
    let h = b.hours;
    while (h > 0) { const take = Math.min(2, h); split.push({ ...b, hours: take }); h -= take; }
  }
  const phys = split.filter((b) => b.act.load.p >= 0.8);
  const medit = split.filter((b) => b.act.load.m < 0);
  const mental = split.filter((b) => b.act.load.p < 0.8 && b.act.load.m >= 0);
  const out = [];
  phys.forEach((b, i) => {
    if (i > 0) out.push({ rest: 0.5, restIfFpAbove: 0.7 });
    out.push(b);
    if (mental.length) out.push(mental.shift());
  });
  out.push(...mental, ...medit);
  return out;
}

export function runProfile(p, K, years, onYear) {
  const xp = {};
  for (const s of Object.keys(SKILLS)) xp[s] = 0;
  const credit = {};
  const yearMain = [];
  let mainThisYear = 0;
  let maxDayEndF = 0;
  let trimmedHours = 0;
  const totalDays = Math.round(years * DAYS_PER_YEAR);
  const milestones = {};
  const cross = {};
  const phaseXp = { initiate: {}, padawan: {}, knight: {} };
  for (let d = 0; d < totalDays; d++) {
    const age = p.startAge + d / DAYS_PER_YEAR;
    const trains = Math.floor(((d + 1) * p.trainingDays) / DAYS_PER_YEAR) !== Math.floor((d * p.trainingDays) / DAYS_PER_YEAR);
    if (trains) {
      const L = (s) => levelFromXp(xp[s], K);
      const fc = L('ForceControl');
      const boost = Math.min(45, 0.3 * Math.max(0, fc - 40));
      // p.baseStats: untrained baseline used for fatigue capacity only (profile input, §12)
      const End = Math.max(p.baseStats?.Endurance ?? 0, Math.min(L('Endurance'), bodyCap(age)) + boost);
      const Will = Math.max(p.baseStats?.Willpower ?? 0, L('Willpower'));
      // training-routines §4 rule 6: trim fill hours (never fixed commitments) until the
      // projected day-end tiredness is within the effort limit.
      const limit = { easy: 0.7, standard: 0.9, push: 1.0 }[p.effort];
      const raw = buildDay(p, age, credit);
      let res = simulateDay(orderBlocks(raw), { End, Will });
      while (Math.max(res.fP, res.fM) > limit) {
        const i = raw.map((b) => b.fill && b.hours > 0).lastIndexOf(true);
        if (i < 0) break;
        raw[i] = { ...raw[i], hours: raw[i].hours - 0.5 };
        res = simulateDay(orderBlocks(raw.filter((b) => b.hours > 0)), { End, Will });
        trimmedHours += 0.5;
      }
      maxDayEndF = Math.max(maxDayEndF, res.fP, res.fM);
      for (const blk of res.blocks) {
        const a = blk.act;
        const base = blk.effHours * INTENSITY[blk.intensity].xp * bestChallenge(L(a.primary), p.effort) * OUTCOME_MEAN;
        const M = (skill) => Math.min(2.8, (p.talent[skill] ?? 1) * blk.instruction * ageFactor(CATEGORY_AGE_ROW[SKILLS[skill]], age));
        const secTot = Object.values(a.secondaries).reduce((x, y) => x + y, 0);
        const gainMain = base * 0.75 * M(a.primary);
        xp[a.primary] += gainMain;
        const ph = phaseXp[rankAt(p, age)];
        ph[a.primary] = (ph[a.primary] ?? 0) + gainMain;
        if (a.primary === 'mainForm') mainThisYear += gainMain;
        for (const [s, w] of Object.entries(a.secondaries)) {
          const gsec = base * 0.25 * (w / secTot) * M(s);
          xp[s] += gsec;
          ph[s] = (ph[s] ?? 0) + gsec;
          if (s === 'mainForm') mainThisYear += gsec;
        }
      }
      xp.Willpower += res.willXp;
      const ph2 = phaseXp[rankAt(p, age)]; ph2.WillpowerFatigue = (ph2.WillpowerFatigue ?? 0) + res.willXp;
    }
    for (const sk of ['mainForm', 'ForceControl', 'ForceSense', 'Willpower']) {
      const l = levelFromXp(xp[sk], K);
      for (const t of [10, 12, 14, 15, 16, 18, 20, 22, 25, 28, 30, 35, 38, 40, 45, 48, 50, 58, 70]) { const key = sk + '>=' + t; if (cross[key] === undefined && l >= t) cross[key] = age; }
    }
    const lvl = levelFromXp(xp.mainForm, K);
    for (const m of [21, 41, 61, 81, 101]) if (milestones[m] === undefined && lvl >= m) milestones[m] = (d + 1) / DAYS_PER_YEAR;
    if ((d + 1) % DAYS_PER_YEAR === 0) {
      yearMain.push(mainThisYear);
      mainThisYear = 0;
      if (onYear) onYear((d + 1) / DAYS_PER_YEAR, p.startAge + (d + 1) / DAYS_PER_YEAR, xp);
    }
  }
  return { xp, milestones, yearMain, maxDayEndF, trimmedHours, cross, phaseXp };
}

// Solve K so the profile's main form reaches 41 after exactly 16.0 years.
export function solveK(p) {
  let lo = 1, hi = 100;
  for (let i = 0; i < 40; i++) {
    const K = (lo + hi) / 2;
    const { xp } = runProfile(p, K, 16);
    if (levelFromXp(xp.mainForm, K) > 41) lo = K; else hi = K;
  }
  return (lo + hi) / 2;
}

if (process.argv[1]?.endsWith('progression-sim.mjs')) {
  const K = solveK(AVERAGE);
  console.log(`K (Average reaches 41 in 16.0 years) = ${K.toFixed(3)}`);
  const rows = [];
  const res = runProfile(AVERAGE, K, 95, (t, age, xp) => {
    if ([2, 4, 5, 6, 6.5, 7, 8, 10, 12, 14, 16, 16.5, 17, 20, 22, 26, 30, 32, 41, 50, 60, 66, 70, 80, 90, 95].some((y) => Math.abs(y - t) < 1e-6))
      rows.push([t, age, ...['mainForm', 'secondForm', 'ForceControl', 'ForceSense', 'Willpower', 'Endurance', 'Strength', 'Meditation', 'ForceKnowledge'].map((s) => levelFromXp(xp[s], K).toFixed(1))]);
  });
  console.log('\n| Years | Age | Main form | Second form | Force Control | Force Sense | Willpower | Endurance (trained) | Strength | Meditation | Force Knowledge |');
  console.log('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const r of rows) console.log(`| ${r[0]} | ${r[1]} | ${r.slice(2).join(' | ')} |`);
  console.log('\nMilestones (years of training):', Object.fromEntries(Object.entries(res.milestones).map(([k, v]) => [k, v.toFixed(1)])));
  console.log('Max day-end f:', res.maxDayEndF.toFixed(2), ' fill hours trimmed per training day:', (res.trimmedHours / (95 * AVERAGE.trainingDays)).toFixed(2));
  console.log('Age when the Average profile first meets a level:', Object.fromEntries(Object.entries(res.cross).map(([k, v]) => [k, v.toFixed(1)])));
  console.log('\nYearly main-form XP by age (per 368-day year):');
  console.log(res.yearMain.map((x, i) => `${AVERAGE.startAge + i}-${AVERAGE.startAge + i + 1}: ${x.toFixed(0)}`).join(', '));
}
