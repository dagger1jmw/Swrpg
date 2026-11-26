// Melee styles as proficiencies (m8-skills, D-513; spec/skills-m8.md section 5). Pure: growth by effective hours, faster
// with higher Melee and with a teacher; fading toward half the peak when unused, back quickly with use; the bonus on the
// skill scale; stacking with weapon proficiency; who can start a style; the situational edge; Teräs Käsi's rules.
import { PRECOG } from '../data/combat.config';
import { STYLE, STYLE_BY_ID, TERAS_KASI, styleExists, type MartialStyle, type StyleEdgeKind } from '../data/martialStyles';
import type { FactionId, SpeciesId } from '../data/entities.config';

/** A held style: proficiency 0-1, the peak reached, and the last day it was trained or fought with. */
export interface StyleState {
  p: number;
  peak: number;
  lastDay: number | null;
}

const clamp01 = (x: number): number => Math.min(1, Math.max(0, x));
const smoothstep = (t: number): number => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};

/** Higher Melee learns styles faster (Jared: up to +50% at Melee 100), on a smoothstep from Melee 0. */
export const styleLearnMult = (melee: number): number => 1 + STYLE.meleeSpeedUp * smoothstep(melee / 100);

/** The proficiency after a stretch unused (fading toward STYLE.fade.floor of the peak after the grace days). */
export function styleNow(st: StyleState, day: number): number {
  if (st.lastDay === null) return st.p;
  const idle = day - st.lastDay - STYLE.fade.graceDays;
  if (idle <= 0) return st.p;
  const floor = Math.min(st.p, st.peak * STYLE.fade.floor);
  return floor + (st.p - floor) * Math.exp(-idle / STYLE.fade.days);
}

/**
 * Growth from `hours` of effective practice (training hours times the session's instruction factor, or a fight's
 * equivalent hours): p moves along 1 - e^(-h / H), faster with Melee; below the peak (after fading) it regrows
 * STYLE.regrowFactor times faster until it is back.
 */
export function styleGain(st: StyleState | undefined, hours: number, melee: number, day: number): StyleState {
  const cur = st ? styleNow(st, day) : 0;
  const peak = st?.peak ?? 0;
  let h = Math.max(0, hours) * styleLearnMult(melee);
  let p = cur;
  // Regrowth to the old peak first, quickly.
  if (p < peak && h > 0) {
    const need = STYLE.growthHours * Math.log((1 - p) / (1 - peak + 1e-12)) / STYLE.regrowFactor;
    const used = Math.min(h, Math.max(0, need));
    p = 1 - (1 - p) * Math.exp((-used * STYLE.regrowFactor) / STYLE.growthHours);
    if (used >= need) p = Math.max(p, peak);
    h -= used;
  }
  if (h > 0) p = 1 - (1 - p) * Math.exp(-h / STYLE.growthHours);
  p = clamp01(p);
  return { p, peak: Math.max(peak, p), lastDay: day };
}

/** The style's bonus on the skill scale at a proficiency (Jared: up to +5 at 100%, Teräs Käsi +10). */
export const styleBonus = (m: MartialStyle, p: number): number => m.maxBonus * clamp01(p);

/** Whether a style covers the weapon in hand: unarmed styles only unarmed, weapon styles only armed, `both` either. */
export const styleCovers = (m: MartialStyle, unarmed: boolean): boolean => m.weapons === 'both' || (m.weapons === 'unarmed') === unarmed;

/**
 * Stacking (Jared): weapon proficiency multiplies the skill (equipment design: floor + (1 - floor) x proficiency), the style
 * adds to it. Weapon proficiency is not built yet: callers pass 1 (characters use their main weapon at 100%).
 */
export const stackedSkill = (skill: number, weaponFactor: number, bonus: number): number => skill * weaponFactor + bonus;

// ---------------------------------------------------------------- starting a style

export interface StyleStudent {
  species: SpeciesId;
  forceSensitive: boolean;
}
export interface StyleTeacher {
  species: SpeciesId;
  faction: FactionId;
  /** The teacher's proficiency in this style (0 = not recorded). */
  holds: number;
}

/**
 * Whether a style can be started (Jared: a teacher or a recorded source, under the who-teaches-outsiders rulings). Null when
 * it can, else the reason. `record` is a recorded source of that style (a manual, a holocron of that art).
 */
export function styleAccess(styleId: string, x: { year: number; student: StyleStudent; teacher?: StyleTeacher | null; record?: boolean }): string | null {
  const m = STYLE_BY_ID.get(styleId);
  if (!m) return `unknown style ${styleId}`;
  if (!styleExists(m, x.year)) return `${m.name} is not taught in this year (${m.dated})`;
  const t = m.teaching;
  if (t.forceSensitive && !x.student.forceSensitive) return `${m.name} needs a Force connection`;
  if (t.studentSpecies && !t.studentSpecies.includes(x.student.species)) return `${m.name}: ${t.note}`;
  if (t.outsidersFrom !== undefined && x.year < t.outsidersFrom) return `${m.name}: ${t.note}`;
  if (x.record) return null;
  const teacher = x.teacher;
  if (!teacher) return `${m.name} needs a teacher or a recorded source of the art`;
  const holder = teacher.holds >= (t.teacherMin ?? STYLE.teachFrom);
  const ofCulture = (t.cultureSpecies?.includes(teacher.species) ?? false) || (t.cultureFaction?.includes(teacher.faction) ?? false);
  // A Teräs Käsi teacher must be a graduate master: culture alone is not enough.
  if (holder || (ofCulture && t.teacherMin === undefined)) return null;
  return `this teacher does not teach ${m.name} (${t.note})`;
}

// ---------------------------------------------------------------- in a fight

export interface EdgeSituation {
  /** The fight's exchange number (0 = the first). */
  exchange: number;
  /** The roll: a build-up contest, or a strike made by or against this fighter. */
  roll: 'buildUp' | 'strikeBy' | 'strikeAgainst';
  surprise: boolean;
  armoured: boolean;
  unarmed: boolean;
  oppArmed: boolean;
  oppRanged: boolean;
  oppSaber: boolean;
  opponents: number;
  footing: number;
  /** The fighter carries a cortosis shield (Darth Desolous's style; Jared, 26 Nov 2026: the edge only with one). */
  cortosisShield?: boolean;
}

/** The style's situational edge on a roll (a proposal; +1 from STYLE.edgeFrom), or 0. */
export function styleEdge(kind: StyleEdgeKind, p: number, x: EdgeSituation): number {
  if (p < STYLE.edgeFrom) return 0;
  const v = STYLE.edgeValue;
  switch (kind) {
    case 'longFight':
      return x.roll === 'buildUp' && x.exchange >= 2 ? v : 0;
    case 'opening':
      return x.roll === 'buildUp' && x.exchange < 3 ? v : 0;
    case 'tireless':
      return x.roll === 'buildUp' && x.exchange >= 5 ? v : 0;
    case 'vsRanged':
      return x.oppRanged && x.roll !== 'strikeBy' ? v : 0;
    case 'surprise':
      return x.surprise && x.roll === 'strikeBy' ? v : 0;
    case 'strike':
      return x.roll === 'strikeBy' ? v : 0;
    case 'counter':
      return x.roll === 'strikeAgainst' ? v : 0;
    case 'armoured':
      return x.armoured ? v : 0;
    case 'vsArmed':
      return x.unarmed && x.oppArmed ? v : 0;
    case 'footing':
      return x.footing < 0 ? Math.min(v, -x.footing) : 0;
    case 'vsSeveral':
      return x.opponents >= 2 ? v : 0;
    case 'vsSaber':
      return x.oppSaber && x.cortosisShield === true && x.roll !== 'strikeBy' ? v : 0;
    case 'none':
      return 0;
  }
}

/** Teräs Käsi's speed (Jared: +2 on the melee contest that moves the advantage track), by proficiency. */
export const terasKasiSpeed = (p: number): number => TERAS_KASI.speed * clamp01(p);

/** The precognitive defence a Force user gets from Force Sense at a level (rolls §3: min(0.5, FS / 200), not centered). */
export const forceSensePrecog = (forceSense: number): number => Math.min(PRECOG.maxChance, Math.max(0, forceSense) * PRECOG.perForceSense);

/**
 * Teräs Käsi's anticipation (Jared): at proficiency 100% and Melee 81+ (High Master) half the precognitive defence a Force
 * user of that tier gets from Force Sense (read at the fighter's Melee level), at Melee 101+ (Legendary) all of it. 0 below.
 */
export function terasKasiAnticipation(p: number, melee: number): number {
  const a = TERAS_KASI.anticipation;
  if (p < a.proficiency - 1e-9 || melee < a.masterMelee) return 0;
  return forceSensePrecog(melee) * (melee >= a.grandmasterMelee ? a.grandmasterShare : a.masterShare);
}

/** The defence used against a melee strike: the higher of the fighter's own Force Sense and its anticipation (never both). */
export const precogDefence = (ownForceSense: number, anticipation: number): number => Math.max(forceSensePrecog(ownForceSense), anticipation);

/**
 * A Teräs Käsi master's strike for the realistic damage rules (not built yet): the share of a blaster pistol's damage class
 * it counts as (by proficiency from TERAS_KASI.pistolFrom to 100%) and the part of light and medium body armour it ignores.
 */
export function terasKasiStrike(p: number): { pistolShare: number; armourIgnored: { light: number; medium: number } } {
  const x = clamp01(p);
  const share = clamp01((x - TERAS_KASI.pistolFrom) / (1 - TERAS_KASI.pistolFrom));
  return { pistolShare: share, armourIgnored: { light: TERAS_KASI.armourIgnored.light * x, medium: TERAS_KASI.armourIgnored.medium * x } };
}

/**
 * The style a fighter brings to a fight (m8-skills, D-513): of the styles held (proficiency after fading), the one with the
 * highest bonus that covers the weapon in hand; its bonus, edge, Teräs Käsi's speed and anticipation at this Melee. Null
 * when none applies.
 */
export function fightStyle(held: Readonly<Record<string, number>>, unarmed: boolean, melee: number): { id: string; p: number; bonus: number; edge: StyleEdgeKind; speed: number; anticipation: number } | null {
  let best: { id: string; p: number; bonus: number; edge: StyleEdgeKind; speed: number; anticipation: number } | null = null;
  for (const [id, p] of Object.entries(held)) {
    const m = STYLE_BY_ID.get(id);
    if (!m || p <= 0 || !styleCovers(m, unarmed)) continue;
    const tk = id === TERAS_KASI.id;
    const cand = { id, p, bonus: styleBonus(m, p), edge: m.edge, speed: tk ? terasKasiSpeed(p) : 0, anticipation: tk ? terasKasiAnticipation(p, melee) : 0 };
    if (!best || cand.bonus > best.bonus) best = cand;
  }
  return best;
}
