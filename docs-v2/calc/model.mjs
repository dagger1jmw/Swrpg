// Shared spec model for the docs-v2 calculations (plain Node, no dependencies).
// Every constant cites the spec section it comes from. This is NOT game code; src/ is
// built from the specs in the milestones. These scripts only produce the numbers that the
// specs quote ("computed by docs-v2/calc/<file>").

// ---------- helpers ----------
export function interp(anchors, x) {
  // anchors: [[x, y], ...] sorted by x; linear between, flat outside.
  if (x <= anchors[0][0]) return anchors[0][1];
  for (let i = 1; i < anchors.length; i++) {
    const [x1, y1] = anchors[i];
    if (x <= x1) {
      const [x0, y0] = anchors[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return anchors[anchors.length - 1][1];
}

// Seeded RNG (sfc32, as architecture §2 meta.rngState).
export function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}
export function gaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ---------- calendar (architecture §10, D-38) ----------
export const DAYS_PER_YEAR = 368;

// ---------- curve (progression-numbers §2) ----------
export const EXP = 1.75;
export const levelFromXp = (xp, K) => Math.pow(Math.max(0, xp) / K, 1 / EXP);
export const xpForLevel = (L, K) => K * Math.pow(L, EXP);

// ---------- fatigue (progression-numbers §3) ----------
export function capacity(stat) {
  return 3 + (4 * Math.min(stat, 100)) / 100 + Math.max(0, Math.min(stat, 150) - 100) / 50;
}
export function eff(f) {
  if (f <= 0.4) return 1.0;
  if (f <= 1.0) return 1.0 - (0.7 * (f - 0.4)) / 0.6;
  return 0.1;
}
export const INTENSITY = {
  casual: { load: 0.6, xp: 0.7 },
  standard: { load: 1.0, xp: 1.0 },
  intense: { load: 1.4, xp: 1.2 },
  extreme: { load: 1.8, xp: 1.35 },
};
// Willpower from fatigue (progression-numbers §9)
export function g(f) {
  if (f < 0.6) return 0;
  if (f <= 1.0) return 0.25 + (0.75 * (f - 0.6)) / 0.4;
  return 1.5;
}

// ---------- challenge factor (progression-numbers §4) ----------
export const CHALLENGE = [[-25, 0.3], [-15, 0.6], [-10, 1.0], [5, 1.0], [12, 1.25], [18, 1.25], [25, 0.8], [35, 0.3]];
export const challenge = (gap) => interp(CHALLENGE, gap);
export const DRILL_RATINGS = [10, 30, 50, 70, 90];
// Scheduler drill choice (training-routines §3): standard/easy picks gap -10..+10,
// push picks +10..+20; the scheduler takes the highest-XP valid rating.
export function bestChallenge(level, effort = 'standard') {
  const [lo, hi] = effort === 'push' ? [10, 20] : [-10, 10];
  let best = -1;
  for (const r of DRILL_RATINGS) {
    const gap = r - level;
    if (gap >= lo && gap <= hi) best = Math.max(best, challenge(gap));
  }
  if (best < 0) for (const r of DRILL_RATINGS) best = Math.max(best, challenge(r - level));
  return best;
}

// ---------- outcome roll (progression-numbers §5) ----------
export const OUTCOME_MEAN = 0.15 * 0.7 + 0.25 * 0.9 + 0.38 * 1.0 + 0.18 * 1.2 + 0.04 * 1.75; // 0.996

// ---------- age and learning speed (progression-numbers §16) ----------
const AGE_X = [6, 10, 15, 24, 40, 60];
export const AGE_ROWS = {
  technique: [1.25, 1.15, 1.05, 1.0, 0.95, 0.9],
  wisdom: [0.85, 0.9, 0.95, 1.0, 1.1, 1.2],
  physical: [0.8, 0.9, 1.1, 1.0, 0.9, 0.75],
  academic: [1, 1, 1, 1, 1, 1],
};
export function ageFactor(row, age) {
  return interp(AGE_X.map((x, i) => [x, AGE_ROWS[row][i]]), age);
}
// Skill category (skills-and-activities.md §1) -> age row
export const CATEGORY_AGE_ROW = {
  technique: 'technique', force: 'technique', wisdom: 'wisdom', knowledge: 'wisdom',
  physical: 'physical', academic: 'academic',
};

// ---------- body cap (progression-numbers §11, Human) ----------
export const HUMAN_BODY_CAP = [[5, 15], [9, 25], [12, 35], [15, 50], [18, 65], [22, 80], [35, 80], [45, 78], [55, 74], [65, 68], [75, 58], [85, 45], [100, 25]];
export const bodyCap = (age) => interp(HUMAN_BODY_CAP, age);

// ---------- training budget (training-routines §2, D-25 interpolation) ----------
export const BUDGET = {
  easy: [[10, 3], [15, 4], [20, 4]],
  standard: [[10, 4], [15, 6], [20, 6]],
  push: [[10, 5], [15, 7], [20, 8]],
};
export const budget = (effort, age) => interp(BUDGET[effort], age);
