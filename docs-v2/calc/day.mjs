// One in-game day in 30-minute steps (progression-numbers §3, §9).
// A block is {act, hours, intensity?, instruction?} or {rest: hours}.
// act = {id, load: {p, m}, primary, secondaries: {skill: weight}}.
// Meters are evaluated at the start of each step.
import { capacity, eff, g, INTENSITY } from './model.mjs';

const STEP = 0.5;

export function isPhysical(act) {
  return act.load.p >= act.load.m;
}

export function simulateDay(blocks, stats, opts = {}) {
  const capP = capacity(stats.End) * (opts.capMult ?? 1);
  const capM = capacity(stats.Will) * (opts.capMult ?? 1);
  let P = opts.startP ?? 0;
  let M = opts.startM ?? 0;
  const hoursToday = {};
  const out = []; // per block: {act, effHours, instruction, intensity}
  let willXp = 0;
  let lastPhysicalHeavy = false; // previous training block had physical load >= 0.8
  let postWindowLeft = 0; // hours of post-workout window left

  for (const b of blocks) {
    if (b.rest !== undefined) {
      // training-routines §4 rule 5: insert rest only when f_phys would pass the threshold
      if (b.restIfFpAbove !== undefined && P / capP <= b.restIfFpAbove) continue;
      const steps = Math.round(b.rest / STEP);
      for (let s = 0; s < steps; s++) {
        P = Math.max(0, P - 0.75 * STEP);
        M = Math.max(0, M - 1.0 * STEP);
      }
      // a rest block ends the post-workout window
      postWindowLeft = 0;
      lastPhysicalHeavy = false;
      continue;
    }
    const act = b.act;
    const inten = INTENSITY[b.intensity ?? 'standard'];
    const phys = isPhysical(act);
    if (!phys && lastPhysicalHeavy) postWindowLeft = 1.0;
    if (phys) postWindowLeft = 0;
    const steps = Math.round(b.hours / STEP);
    let effHours = 0;
    for (let s = 0; s < steps; s++) {
      const fp = P / capP;
      const fm = M / capM;
      let e;
      if (phys) {
        e = eff(fp) * (1 - 0.15 * Math.min(1, fm));
      } else if (postWindowLeft > 0) {
        e = 1.25 * eff(fm);
        postWindowLeft -= STEP;
      } else {
        e = eff(fm) * (1 - 0.5 * Math.min(1, fp));
      }
      const done = hoursToday[act.id] ?? 0;
      if (done >= 2) e *= 0.85; // same activity beyond 2 h in one day
      effHours += e * STEP;
      hoursToday[act.id] = done + STEP;
      willXp += 1.5 * g(Math.max(fp, fm)) * STEP;
      P = Math.max(0, P + act.load.p * inten.load * STEP);
      M = Math.max(0, M + act.load.m * inten.load * STEP);
    }
    out.push({ act, effHours, instruction: b.instruction ?? 1, intensity: b.intensity ?? 'standard', source: b.source });
    lastPhysicalHeavy = phys && act.load.p >= 0.8;
  }
  const willCapped = Math.min(3.0, willXp);
  return { blocks: out, willXp: willCapped, fP: P / capP, fM: M / capM };
}
