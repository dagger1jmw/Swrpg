// Closed-form skill level (npc-generation §1, D-43, D-105): measured phase paces and the exact
// age-factor integral, on the Human-equivalent age. Mirrors docs-v2/calc/npc-closed-form.mjs. Pure.
import { CLOSED_FORM, CURVE_EXP, PACE_CAP } from '../data/progression.config';
import type { AgeRow } from '../data/skills';
import { ageFactor, ageIntegral } from './ageFactor';
import { transferXp } from './forms';

export const A_REF = ageIntegral('technique', CLOSED_FORM.refStart, CLOSED_FORM.refEnd);

export interface PacePhase {
  from: number;
  to: number;
  pace: number;
}

export interface ClosedFormInput {
  row: AgeRow;
  startAge: number;
  age: number;
  phases: readonly PacePhase[];
  /** Talent, species, state: multiplies every phase pace (each phase capped at 4.0). */
  mult?: number;
  warYears?: number;
}

/** level = 41 * ((sum of pace * A(row, phase within [start, age]) + 0.3 * war * pace now * a(age)) / A_ref)^(1/1.75). */
export function closedFormLevel(input: ClosedFormInput): number {
  const { row, startAge, age, phases, mult = 1, warYears = 0 } = input;
  let s = 0;
  let paceNow = 0;
  for (const ph of phases) {
    const p = Math.min(PACE_CAP, ph.pace * mult);
    const a = Math.max(startAge, ph.from);
    const b = Math.min(age, ph.to);
    if (b > a) s += p * ageIntegral(row, a, b);
    if (age > ph.from && age <= ph.to) paceNow = p;
  }
  s += CLOSED_FORM.warFactor * warYears * paceNow * ageFactor(row, age);
  return CLOSED_FORM.referenceLevel * Math.pow(Math.max(0, s / A_REF), 1 / CURVE_EXP);
}

/** Phases from per-phase paces and rank ages (initiate before padawanAge, padawan before knightAge). */
export function phasesFor(
  paces: { initiate?: number | undefined; padawan?: number | undefined; knight?: number | undefined },
  ages: { padawanAge: number; knightAge: number },
  onePhase: boolean,
): PacePhase[] {
  if (onePhase) return [{ from: -Infinity, to: Infinity, pace: paces.knight ?? 0 }];
  return [
    { from: -Infinity, to: ages.padawanAge, pace: paces.initiate ?? 0 },
    { from: ages.padawanAge, to: ages.knightAge, pace: paces.padawan ?? 0 },
    { from: ages.knightAge, to: Infinity, pace: paces.knight ?? 0 },
  ];
}

// ---- Lightsaber forms: form plans and the fundamentals transfer (D-118, D-119) ----

/** R: XP per age-weighted year at pace 1.0 = K * 41^1.75 / A_ref (D-119), so pace and level agree exactly. */
export function referenceRate(k: number): number {
  return (k * Math.pow(CLOSED_FORM.referenceLevel, CURVE_EXP)) / A_REF;
}

export type FormSourcePaces = Partial<Record<'initiate' | 'padawan' | 'knight', Partial<Record<'order' | 'master' | 'solo' | 'fill', number>>>>;
/** A form plan: form id -> hours (the Padawan plan sums to 3: the 2 h master session + the 1 h solo hour). */
export type FormPlan = Readonly<Record<string, number>>;

/** Padawan hours of the master session and the solo hour (ranks.md §1a). */
export const PADAWAN_FORM_HOURS = { master: 2, solo: 1 } as const;

/**
 * How a plan shares out each source: the master session goes to the plan's forms in order of hours
 * (largest first) for 2 h, the solo hour to the next 1 h, fill by plan share.
 */
export function planSplit(plan: FormPlan): Record<string, { master: number; solo: number; fill: number }> {
  const order = Object.entries(plan)
    .filter(([, h]) => h > 0)
    .sort((x, y) => y[1] - x[1]);
  const total = order.reduce((s, [, h]) => s + h, 0);
  let master: number = PADAWAN_FORM_HOURS.master;
  let solo: number = PADAWAN_FORM_HOURS.solo;
  const out: Record<string, { master: number; solo: number; fill: number }> = {};
  for (const [f, h] of order) {
    const m = Math.min(master, h);
    master -= m;
    const sl = Math.min(solo, h - m);
    solo -= sl;
    out[f] = { master: m / PADAWAN_FORM_HOURS.master, solo: sl / PADAWAN_FORM_HOURS.solo, fill: total > 0 ? h / total : 0 };
  }
  return out;
}

export interface FormLevelsInput {
  formPaces: FormSourcePaces;
  k: number;
  /** Human-equivalent ages. */
  startAge: number;
  age: number;
  padawanAge: number;
  knightAge: number;
  onePhase: boolean;
  padawanPlan: FormPlan;
  knightPlan: FormPlan;
  /** Talent, cross-talent and species factors per form (each phase pace capped at 4.0). */
  mult(form: string): number;
  transferShare: number;
  warYears?: number;
  /** Knight+ / career pool pace change from the focus sliders (D-105 / D-115), added to the fill pace. */
  knightPoolDelta?: number;
  /** Called with every capped phase pace used (creation checks the 4.0x limit). */
  onPace?: (pace: number) => void;
  /**
   * The Jedi Initiate lightsaber curriculum (D-459): no form XP before the gate age, Form I alone to the survey age, then
   * the Initiate form pace shared out by `shares` (Form I 0.5, Forms II-VI the rest), each survey form started (its
   * fundamentals transfer) in `order`. Absent: every Initiate form hour on Shii-Cho (the Sith acolyte row).
   */
  curriculum?: { gateAge: number; surveyAge: number; shares: Readonly<Record<string, number>>; order: readonly string[] };
}

/**
 * Trained XP per form (no natural baseline: forms have none). Initiates put every form hour on
 * Shii-Cho; each later phase shares its sources out by its plan; a form's first phase starts it at
 * transferShare x the highest form's XP at that moment (D-119). Mirrors docs-v2/calc/npc-closed-form.mjs.
 */
export function formXps(i: FormLevelsInput): Record<string, number> {
  const R = referenceRate(i.k);
  const xp: Record<string, number> = {};
  const started = new Set<string>();
  const start = (forms: string[]): void => {
    // Every form of the phase transfers from the XP as it stands at the phase start (Niman: the
    // average of Forms I, III, IV and V, D-121).
    const snapshot = { ...xp };
    for (const f of forms) {
      if (started.has(f)) continue;
      started.add(f);
      xp[f] = (snapshot[f] ?? 0) + transferXp(f, (x) => snapshot[x] ?? 0, i.transferShare, i.k);
    }
  };
  const add = (f: string, pace: number, a: number, b: number): number => {
    const p = Math.min(PACE_CAP, pace * i.mult(f));
    if (b > a) {
      xp[f] = (xp[f] ?? 0) + R * p * ageIntegral('technique', a, b);
      i.onPace?.(p);
    }
    return p;
  };
  let paceNow: Record<string, number> = {};
  if (!i.onePhase) {
    const a = i.startAge;
    const b = Math.min(i.age, i.padawanAge);
    const ini = i.formPaces.initiate ?? {};
    const iniPace = (ini.order ?? 0) + (ini.fill ?? 0);
    const cur = i.curriculum;
    if (cur) {
      const g = Math.max(a, cur.gateAge);
      const sv = Math.max(g, cur.surveyAge);
      if (Math.min(b, sv) > g) {
        start(['shiiCho']);
        paceNow = { shiiCho: add('shiiCho', iniPace, g, Math.min(b, sv)) };
      }
      if (b > sv) {
        if (!started.has('shiiCho')) start(['shiiCho']);
        for (const f of cur.order) start([f]);
        paceNow = {};
        for (const [f, w] of Object.entries(cur.shares)) paceNow[f] = add(f, iniPace * w, sv, b);
      }
    } else if (b > a) {
      start(['shiiCho']);
      paceNow = { shiiCho: add('shiiCho', iniPace, a, b) };
    }
    const pa = Math.max(i.startAge, i.padawanAge);
    const pb = Math.min(i.age, i.knightAge);
    if (pb > pa) {
      const split = planSplit(i.padawanPlan);
      start(Object.keys(split));
      const pad = i.formPaces.padawan ?? {};
      paceNow = {};
      for (const [f, w] of Object.entries(split)) paceNow[f] = add(f, (pad.master ?? 0) * w.master + (pad.solo ?? 0) * w.solo + (pad.fill ?? 0) * w.fill, pa, pb);
    }
  }
  const ka = i.onePhase ? i.startAge : Math.max(i.startAge, i.knightAge);
  if (i.age > ka) {
    const split = planSplit(i.knightPlan);
    start(Object.keys(split));
    const pool = Math.max(0, (i.formPaces.knight?.fill ?? 0) + (i.knightPoolDelta ?? 0));
    paceNow = {};
    for (const [f, w] of Object.entries(split)) paceNow[f] = add(f, pool * w.fill, ka, i.age);
  }
  for (const [f, p] of Object.entries(paceNow)) xp[f] = (xp[f] ?? 0) + R * CLOSED_FORM.warFactor * (i.warYears ?? 0) * p * ageFactor('technique', i.age);
  return xp;
}
