// Ground battles (D-505; docs-v2/spec/combat-scales.md section E): sectors, phases of an hour or more. Each sector each phase
// both sides roll; the margin moves the sector's advantage track; at 3 the leading side breaks through. Pure; seeded RNG.
import { MORALE_BY_MINION_KIND, moraleFor, type MoraleGroup } from '../data/combat.config';
import {
  BREAKTHROUGH,
  FIRE_WHERE,
  FORCE_USER,
  GROUND_UNITS,
  KIND_FIRE,
  KIND_TOUGHNESS,
  LOSSES,
  MATCHUP,
  MEDITATION,
  MORALE,
  MORALE_DRIFT,
  MORALE_MOD,
  NO_CONTACT,
  OWN_FIGHT,
  PLAN_BEATS,
  PLAN_LABEL,
  PLAN_MATCHUP,
  QUALITY,
  SUPPORT,
  TERRAIN,
  type GroundUnitDef,
  type Plan,
  type TargetClass,
  type Terrain,
} from '../data/ground.config';
import { MINION_KINDS, MINION_WEAPON_PROFILE, SOLDIER_BLASTER_PACE, type MinionKind } from '../data/npcGen.config';
import type { DuelTier } from '../data/who';
import { closedFormLevel, phasesFor } from './closedForm';
import { clamp, interp } from './interp';
import { minionInputs } from './npcGen';
import { basicRoll, type Modifier } from './rolls';
import { afterStrike, contest, hitQuality, moveTrack, strikeLands, strikeMargin, striker } from './track';
import type { RngState } from './rng';

// ---- units from data ----

export function unitDef(id: string): GroundUnitDef {
  const d = GROUND_UNITS.find((u) => u.id === id);
  if (!d) throw new Error(`unknown ground unit ${id}`);
  return d;
}
const kindOf = (d: GroundUnitDef): MinionKind | null => (d.kind ? (MINION_KINDS.find((k) => k.id === d.kind) ?? null) : null);
const meanGrade = (k: MinionKind): number => k.grades.reduce((t, p, i) => t + p * (i + 1), 0);

/** A unit's fire by target, from its own numbers or its kind's weapon, grades, teamwork and aim. */
export function unitFire(d: GroundUnitDef): Record<TargetClass, number> {
  if (d.fire) return { ...d.fire };
  const k = kindOf(d)!;
  const soft = Math.max(KIND_FIRE.min, KIND_FIRE.base + KIND_FIRE.perGrade * meanGrade(k) + KIND_FIRE.coordination * k.coordination + KIND_FIRE.accuracy * (k.accuracy ?? 0) + (k.weapon === 'heavy' ? KIND_FIRE.heavy : k.weapon === 'melee' ? KIND_FIRE.melee : 0));
  const heavy = k.weapon === 'heavy' ? 'heavy' : 'other';
  return { soft, hard: soft * KIND_FIRE.hardShare[heavy], air: soft * KIND_FIRE.airShare[heavy] };
}
export function unitToughness(d: GroundUnitDef): number {
  const k = kindOf(d);
  return d.toughness ?? (k ? KIND_TOUGHNESS[k.armor] * Math.sqrt(k.vitalityMult) : 1);
}

const QUALITY_CACHE = new Map<string, number>();
/** The troops' quality as a Tactics level: what they roll when no officer leads them. */
export function unitQuality(d: GroundUnitDef): number {
  const k = kindOf(d);
  if (!k) return (d.level ?? 40) * QUALITY.share;
  let q = QUALITY_CACHE.get(k.id);
  if (q === undefined) {
    const profile = MINION_WEAPON_PROFILE[k.id];
    const pace = SOLDIER_BLASTER_PACE * (profile?.source === 'kind' ? profile.share : 1);
    const weapon = k.grades.reduce((t, p, i) => {
      if (p <= 0) return t;
      const inp = minionInputs(k.id, i + 1, 'ground');
      return t + p * closedFormLevel({ row: 'technique', startAge: 17, age: 17 + (inp.age - inp.startAge), phases: phasesFor({ knight: pace }, { padawanAge: 17, knightAge: 17 }, true) });
    }, 0);
    q = Math.max(1, weapon * QUALITY.share + QUALITY.coordination * k.coordination + QUALITY.accuracy * (k.accuracy ?? 0));
    QUALITY_CACHE.set(k.id, q);
  }
  return q;
}
/** Droids never break; the rest by their kind (data/combat.config.ts), vehicles and guns as ordinary soldiers. */
export function unitMoraleGroup(d: GroundUnitDef): MoraleGroup {
  if (isDroid(d)) return 'never';
  const k = kindOf(d);
  return k ? (MORALE_BY_MINION_KIND[k.id] ?? moraleFor(k.archetype, k.id)).group : 'average';
}
export const isDroid = (d: GroundUnitDef): boolean => d.type === 'droids' || d.id === 'droidArmour';

// ---- a battle ----

export interface GroundUnit {
  id: string;
  name: string;
  unit: string;
  /** Percent of its full strength; a full unit is one battalion, company or squad alike. */
  strength: number;
  size: number;
  morale: number;
  bond: number;
  fear: number;
  state: 'fighting' | 'shaken' | 'routed' | 'stopped' | 'destroyed';
  /** Losses already checked for. */
  checked: number;
}

export interface SectorLeader {
  name: string;
  /** Tactics; a leader without it still steadies the sector. */
  tactics: number;
  forceUser?: boolean;
  tier?: DuelTier;
  alive: boolean;
}

export interface SectorSide {
  units: GroundUnit[];
  leader: SectorLeader | null;
  support: { artillery?: boolean; armour?: boolean; air?: boolean };
  /** The player's own fight here this phase. */
  ownFight?: 'won' | 'held' | 'lost' | null;
}

export interface Sector {
  id: string;
  /** On the map: B3. */
  square: string;
  name: string;
  terrain: Terrain;
  /** Who attacks here. */
  attacker: 'A' | 'B';
  a: SectorSide;
  b: SectorSide;
  track: number;
  /** Ground gained toward the position by the attacker of the moment. */
  ground: number;
  controller: 'A' | 'B';
  objective: boolean;
  decided: boolean;
}

export interface GroundForce {
  name: string;
  plan: Plan;
  meditation: { name: string; level: number; alive: boolean } | null;
  /** A command post in contact with the sectors (officers' lines). */
  contact: boolean;
  /** Droids only: the control signal. */
  droidControl: boolean;
  /** A commander the troops fear is watching. */
  fearPresent: boolean;
  modifiers: readonly Modifier[];
}

export interface PhaseRecord {
  n: number;
  sector: string;
  margin: number;
  before: number;
  after: number;
  mods: { a: Modifier[]; b: Modifier[] };
  result: 'steady' | 'held' | 'light' | 'positionTaken' | 'rout' | 'collapse';
  by: 'A' | 'B' | null;
  notes: string[];
}

export interface GroundBattle {
  a: GroundForce;
  b: GroundForce;
  sectors: Sector[];
  phase: number;
  rng: RngState;
  log: PhaseRecord[];
  end: { winner: 'A' | 'B' | null; reason: 'objectives' | 'collapse' | 'time' } | null;
}

export const groundUnit = (id: string, unit: string, over: Partial<GroundUnit> = {}): GroundUnit => ({ id, name: unitDef(unit).label, unit, strength: 100, size: 1, morale: MORALE.start, bond: 50, fear: 0, state: 'fighting', checked: 0, ...over });
export const groundForce = (name: string, plan: Plan, over: Partial<GroundForce> = {}): GroundForce => ({ name, plan, meditation: null, contact: true, droidControl: true, fearPresent: true, modifiers: [], ...over });
export const sectorSide = (units: GroundUnit[], over: Partial<SectorSide> = {}): SectorSide => ({ units, leader: null, support: {}, ownFight: null, ...over });
export const sector = (id: string, a: SectorSide, b: SectorSide, over: Partial<Sector> = {}): Sector => ({ id, square: id, name: id, terrain: {}, attacker: 'A', a, b, track: 0, ground: 0, controller: 'B', objective: true, decided: false, ...over });
export const startGround = (a: GroundForce, b: GroundForce, sectors: Sector[], rng: RngState): GroundBattle => ({ a, b, sectors, phase: 0, rng, log: [], end: null });

export const standing = (u: GroundUnit): boolean => u.state === 'fighting' || u.state === 'shaken';
/** Whether a unit can fight in this sector: attacking armour cannot cross a river without a bridge. */
export const canFightHere = (u: GroundUnit, t: Terrain, attacking: boolean): boolean => standing(u) && !(attacking && t.river && !t.bridge && unitDef(u.unit).target === 'hard');
const weightOf = (u: GroundUnit): number => (u.strength / 100) * u.size * (u.state === 'shaken' ? 0.6 : 1);

// ---- unit matchups ----

/** One unit's fire on another, where they are. */
export function effectOn(a: GroundUnitDef, b: GroundUnitDef, t: Terrain, aDefends: boolean): number {
  let x = unitFire(a)[b.target];
  const close = t.urban === true || t.forest === true;
  const aCover = aDefends && (t.cover !== undefined || close);
  const bCover = !aDefends && t.cover !== undefined;
  if (a.type === 'armour') x *= close ? FIRE_WHERE.armourClose : bCover && t.cover === 'heavy' ? FIRE_WHERE.armourOnCover : 1;
  if (b.target === 'hard' && a.type === 'antiArmour' && aCover) x *= FIRE_WHERE.antiArmourCover;
  if (b.target === 'hard' && a.target === 'soft' && a.type !== 'antiArmour' && a.type !== 'artillery' && close) x *= FIRE_WHERE.infantryOnArmourClose;
  if (a.type === 'artillery' && b.target === 'soft') x *= bCover || b.type === 'droids' || !b.raider ? FIRE_WHERE.artilleryMassed : FIRE_WHERE.artilleryLoose;
  if (b.type === 'artillery') x *= a.raider ? FIRE_WHERE.raidOnGuns : a.type === 'air' ? FIRE_WHERE.airOnGuns : 1;
  return x / unitToughness(b);
}
/** The unit matchup for side A in a sector, capped at +/-3: what its units do to theirs, less what theirs do to them. */
export function unitMatchup(s: Sector): number {
  const aUnits = s.a.units.filter((u) => canFightHere(u, s.terrain, s.attacker === 'A'));
  const bUnits = s.b.units.filter((u) => canFightHere(u, s.terrain, s.attacker === 'B'));
  const wa = aUnits.reduce((t, u) => t + weightOf(u), 0);
  const wb = bUnits.reduce((t, u) => t + weightOf(u), 0);
  if (wa <= 0 && wb <= 0) return 0;
  if (wa <= 0) return -MATCHUP.cap;
  if (wb <= 0) return MATCHUP.cap;
  const mean = (xs: GroundUnit[], w: number, ys: GroundUnit[], v: number, xDefends: boolean): number => xs.reduce((t, x) => t + ys.reduce((r, y) => r + (weightOf(x) / w) * (weightOf(y) / v) * effectOn(unitDef(x.unit), unitDef(y.unit), s.terrain, xDefends), 0), 0);
  const hit = mean(aUnits, wa, bUnits, wb, s.attacker === 'B') - mean(bUnits, wb, aUnits, wa, s.attacker === 'A');
  // Numbers count by their ratio, on a log scale.
  const numbers = Math.log2(wa / wb);
  return clamp(Math.round((hit * MATCHUP.scale + numbers) * 10) / 10, -MATCHUP.cap, MATCHUP.cap);
}

export const planMatchup = (mine: Plan, theirs: Plan): number => (PLAN_BEATS[mine].includes(theirs) ? PLAN_MATCHUP : PLAN_BEATS[theirs].includes(mine) ? -PLAN_MATCHUP : 0);

// ---- the sector roll ----

const meanOf = (side: SectorSide, f: (u: GroundUnit) => number): number => {
  const live = side.units.filter(standing);
  const w = live.reduce((t, u) => t + weightOf(u), 0);
  return w > 0 ? live.reduce((t, u) => t + f(u) * weightOf(u), 0) / w : 0;
};
/** What the sector rolls with: its leader's Tactics, or the troops' own quality. */
export const sectorLevel = (side: SectorSide): number => (side.leader?.alive && side.leader.tactics > 0 ? side.leader.tactics : meanOf(side, (u) => unitQuality(unitDef(u.unit))));

const ruledByFear = (u: GroundUnit): boolean => u.fear >= MORALE.fear && u.bond < MORALE.bonded;
const contactPenalty = (side: SectorSide): number =>
  Math.round(meanOf(side, (u) => (isDroid(unitDef(u.unit)) || ruledByFear(u) ? NO_CONTACT.letter : u.bond >= MORALE.bonded ? NO_CONTACT.bonded : NO_CONTACT.ordinary)) * 10) / 10;

export function sectorMods(s: Sector, who: 'A' | 'B', mine: GroundForce, theirs: GroundForce): Modifier[] {
  const me = who === 'A' ? s.a : s.b;
  const them = who === 'A' ? s.b : s.a;
  const out: Modifier[] = [];
  const add = (source: string, value: number): void => {
    if (value !== 0) out.push({ source, value });
  };
  const attacking = s.attacker === who;
  add(`plan: ${PLAN_LABEL[mine.plan]}`, planMatchup(mine.plan, theirs.plan));
  const m = unitMatchup(s);
  add('units', who === 'A' ? m : -m);
  for (const k of ['artillery', 'armour', 'air'] as const) if (me.support[k]) add(k, SUPPORT);
  if (!attacking && s.terrain.cover) add(s.terrain.cover === 'heavy' ? 'heavy cover' : 'cover', TERRAIN[s.terrain.cover]);
  if (s.terrain.high === who) add('high ground', TERRAIN.high);
  if (attacking && s.terrain.chokepoint) add('a chokepoint', TERRAIN.chokepoint);
  const leads = me.leader?.alive && me.leader.forceUser;
  add('morale', Math.round(interp(MORALE_MOD, clamp(meanOf(me, (u) => (isDroid(unitDef(u.unit)) ? 60 : u.morale)) + (leads ? FORCE_USER.morale : 0), 0, 100)) * 10) / 10);
  if (mine.meditation?.alive) add('battle meditation', Math.round(interp(MEDITATION, mine.meditation.level) * 10) / 10);
  if (me.ownFight) add('your own fight', OWN_FIGHT[me.ownFight]);
  const duel = (x: SectorSide): number => (x.leader?.alive && x.leader.forceUser ? FORCE_USER.duel[x.leader.tier ?? 'below'] : 0);
  add('a duelist at the front', Math.max(0, duel(me) - duel(them)));
  if (!mine.contact) add('out of contact', contactPenalty(me));
  return [...out, ...mine.modifiers];
}

// ---- morale ----

/** A morale check on one unit, harder by what brought it on. Droids never break; the fear-ruled obey until they collapse. */
export function moraleCheck(u: GroundUnit, harder: number, rng: RngState, fearPresent = true): [GroundUnit, RngState, string | null] {
  const d = unitDef(u.unit);
  if (!standing(u) || isDroid(d)) return [u, rng, null];
  if (ruledByFear(u)) {
    const limit = fearPresent ? MORALE.fearLimit : MORALE.fearLimitAlone;
    return u.strength > limit ? [u, rng, null] : [{ ...u, state: 'routed', morale: 0 }, rng, `${u.name} collapse at their limit`];
  }
  const [roll, r] = basicRoll(rng, u.morale, [
    { source: 'bond', value: Math.round(((u.bond - 50) / 15) * 10) / 10 },
    { source: 'mettle', value: MORALE.group[unitMoraleGroup(d)] },
  ]);
  const by = roll.total - (MORALE.dc + harder + (100 - u.strength) * MORALE.perLoss);
  if (by >= 0) return [{ ...u, morale: Math.max(0, u.morale - MORALE.steady) }, r, null];
  if (by > -MORALE.routMargin && u.state === 'fighting') return [{ ...u, state: 'shaken', morale: Math.max(0, u.morale - MORALE.shaken) }, r, `${u.name} are shaken`];
  return [{ ...u, state: 'routed', morale: 0 }, r, `${u.name} break and run`];
}

const eachUnit = (b: GroundBattle, who: 'A' | 'B', f: (u: GroundUnit, rng: RngState) => [GroundUnit, RngState, string | null]): [GroundBattle, string[]] => {
  let rng = b.rng;
  const notes: string[] = [];
  const key = who === 'A' ? 'a' : 'b';
  const sectors = b.sectors.map((s) => ({
    ...s,
    [key]: {
      ...s[key],
      units: s[key].units.map((u) => {
        const [x, r, note] = f(u, rng);
        rng = r;
        if (note) notes.push(note);
        return x;
      }),
    },
  }));
  return [{ ...b, sectors, rng }, notes];
};

/** A battle meditator is killed: the gift is gone and the whole side checks at once (Mizra). */
export function killMeditator(b: GroundBattle, who: 'A' | 'B'): [GroundBattle, string[]] {
  const force = who === 'A' ? b.a : b.b;
  if (!force.meditation?.alive) return [b, []];
  const dead: GroundForce = { ...force, meditation: { ...force.meditation, alive: false } };
  const next: GroundBattle = { ...b, [who === 'A' ? 'a' : 'b']: dead };
  const [after, notes] = eachUnit(next, who, (u, r) => moraleCheck({ ...u, morale: Math.max(0, u.morale - (isDroid(unitDef(u.unit)) ? 0 : MORALE.meditatorMorale)) }, MORALE.meditatorKilled, r, force.fearPresent));
  return [after, [`${force.meditation.name} is killed: ${force.name} check`, ...notes]];
}

/** A sector's leader falls: that sector checks. */
export function killLeader(b: GroundBattle, who: 'A' | 'B', sectorId: string): [GroundBattle, string[]] {
  const key = who === 'A' ? 'a' : 'b';
  let rng = b.rng;
  const notes: string[] = [];
  const sectors = b.sectors.map((s) => {
    if (s.id !== sectorId || !s[key].leader?.alive) return s;
    const leader = { ...s[key].leader, alive: false };
    notes.push(`${leader.name} falls`);
    const units = s[key].units.map((u) => {
      const [x, r, note] = moraleCheck(u, MORALE.leaderDead, rng, false);
      rng = r;
      if (note) notes.push(note);
      return x;
    });
    return { ...s, [key]: { ...s[key], leader, units } };
  });
  return [{ ...b, sectors, rng }, notes];
}

/** The control signal is cut (or restored): droids stop where they stand. */
export function setDroidControl(b: GroundBattle, who: 'A' | 'B', on: boolean): GroundBattle {
  const force = who === 'A' ? b.a : b.b;
  const next: GroundBattle = { ...b, [who === 'A' ? 'a' : 'b']: { ...force, droidControl: on } };
  return eachUnit(next, who, (u, r) => [isDroid(unitDef(u.unit)) && (u.state === 'fighting' || u.state === 'stopped') ? { ...u, state: on ? 'fighting' : 'stopped' } : u, r, null])[0];
}

// ---- a phase ----

const lose = (u: GroundUnit, percent: number): GroundUnit => {
  if (!standing(u) && u.state !== 'stopped') return u;
  const strength = Math.max(0, u.strength - percent / unitToughness(unitDef(u.unit)));
  return { ...u, strength, state: strength <= BREAKTHROUGH.gone ? 'destroyed' : u.state };
};


function phaseOfSector(b: GroundBattle, s0: Sector, rng: RngState): { s: Sector; rng: RngState; rec: PhaseRecord } {
  const notes: string[] = [];
  let s = s0;
  const modsA = sectorMods(s, 'A', b.a, b.b);
  const modsB = sectorMods(s, 'B', b.b, b.a);
  const [roll, r1] = contest(rng, { level: sectorLevel(s.a), modifiers: modsA }, { level: sectorLevel(s.b), modifiers: modsB });
  let next = r1;
  const margin = roll.margin;
  const side = striker(s.track);
  const sm = side ? strikeMargin(side, margin) : 0;
  const landed = side !== null && strikeLands(sm);
  const after = side ? afterStrike(s.track, landed) : moveTrack(s.track, margin);
  const quality = landed ? hitQuality(sm) : null;
  const loser: 'A' | 'B' | null = landed ? (side === 'A' ? 'B' : 'A') : null;
  const extra = quality === 'graze' ? BREAKTHROUGH.light : quality === 'solid' ? BREAKTHROUGH.heavy : quality === 'clean' ? BREAKTHROUGH.rout : quality === 'critical' ? BREAKTHROUGH.collapse : 0;
  const bleed = (units: GroundUnit[], who: 'A' | 'B'): GroundUnit[] => {
    const own = who === 'A' ? margin : -margin;
    const base = interp(LOSSES, own) + (loser === who ? extra : 0);
    const drift = interp(MORALE_DRIFT, own) - (loser === who ? MORALE.broughtLow : 0);
    return units.map((u) => {
      const hurt = lose(u, base);
      return isDroid(unitDef(u.unit)) ? hurt : { ...hurt, morale: clamp(hurt.morale + drift, 0, 100) };
    });
  };
  s = { ...s, track: after, a: { ...s.a, units: bleed(s.a.units, 'A') }, b: { ...s.b, units: bleed(s.b.units, 'B') } };
  let result: PhaseRecord['result'] = side ? 'held' : 'steady';
  if (landed && side && loser) {
    const key = loser === 'A' ? 'a' : 'b';
    const take = (): void => {
      if (s.controller !== side) notes.push(`${side === 'A' ? b.a.name : b.b.name} take ${s.name}`);
      // Whoever holds it now defends it; cover and the attack turn round.
      s = { ...s, controller: side, attacker: loser, ground: 0 };
    };
    if (quality === 'graze') {
      result = 'light';
      s = { ...s, ground: s.ground + 1 };
      notes.push(`${side === 'A' ? b.a.name : b.b.name} gain ground in ${s.name}`);
      if (s.ground >= BREAKTHROUGH.groundToTake) take();
    } else if (quality === 'solid') {
      result = 'positionTaken';
      take();
    } else {
      result = quality === 'clean' ? 'rout' : 'collapse';
      const units = s[key].units;
      const worst = [...units].filter((u) => standing(u) && !isDroid(unitDef(u.unit))).sort((x, y) => x.morale + x.bond / 4 - (y.morale + y.bond / 4))[0]?.id;
      const broken = (u: GroundUnit): GroundUnit => (!standing(u) ? u : isDroid(unitDef(u.unit)) ? lose(u, 25) : { ...u, state: 'routed' as const, morale: 0 });
      s = { ...s, [key]: { ...s[key], units: units.map((u) => (quality === 'critical' || u.id === worst ? broken(u) : u)) } };
      notes.push(quality === 'critical' ? `${s.name} collapses` : `${units.find((u) => u.id === worst)?.name ?? 'a unit'} rout in ${s.name}`);
      take();
    }
  }
  // Heavy losses bring checks, each threshold once.
  for (const key of ['a', 'b'] as const) {
    const force = key === 'a' ? b.a : b.b;
    s = {
      ...s,
      [key]: {
        ...s[key],
        units: s[key].units.map((u) => {
          const due = MORALE.thresholds.filter((x) => u.strength <= x).length;
          if (due <= u.checked || !standing(u)) return u;
          const [x, r, note] = moraleCheck(u, s[key].leader && !s[key].leader.alive ? MORALE.leaderDead : 0, next, force.fearPresent);
          next = r;
          if (note) notes.push(note);
          return { ...x, checked: due };
        }),
      },
    };
  }
  const aLeft = s.a.units.some(standing);
  const bLeft = s.b.units.some(standing);
  if (!aLeft || !bLeft) {
    const holder = aLeft === bLeft ? s.controller : aLeft ? 'A' : 'B';
    if (holder !== s.controller) notes.push(`${holder === 'A' ? b.a.name : b.b.name} hold ${s.name} alone`);
    s = { ...s, controller: holder, decided: true };
  }
  s = { ...s, a: { ...s.a, ownFight: null }, b: { ...s.b, ownFight: null } };
  return { s, rng: next, rec: { n: b.phase + 1, sector: s.id, margin, before: s0.track, after, mods: { a: modsA, b: modsB }, result, by: landed ? side : null, notes } };
}

export function groundPhase(b: GroundBattle): GroundBattle {
  if (b.end) return b;
  let rng = b.rng;
  const log = [...b.log];
  const sectors = b.sectors.map((s) => {
    if (s.decided) return s;
    const r = phaseOfSector(b, s, rng);
    rng = r.rng;
    log.push(r.rec);
    return r.s;
  });
  const done = sectors.every((s) => s.decided);
  const objectives = sectors.filter((s) => s.objective);
  const held = (who: 'A' | 'B'): number => objectives.filter((s) => s.controller === who).length;
  const end: GroundBattle['end'] = done ? { winner: held('A') === held('B') ? null : held('A') > held('B') ? 'A' : 'B', reason: 'collapse' } : null;
  return { ...b, sectors, rng, log, phase: b.phase + 1, end };
}

export function runGround(b: GroundBattle, phases = 12): GroundBattle {
  let s = b;
  while (!s.end && s.phase < phases) s = groundPhase(s);
  if (s.end) return s;
  const objectives = s.sectors.filter((x) => x.objective);
  const a = objectives.filter((x) => x.controller === 'A').length;
  return { ...s, end: { winner: a * 2 === objectives.length ? null : a * 2 > objectives.length ? 'A' : 'B', reason: 'time' } };
}

/** The share of a side's strength still standing. */
export const forceLeft = (b: GroundBattle, who: 'A' | 'B'): number => {
  const units = b.sectors.flatMap((s) => (who === 'A' ? s.a : s.b).units);
  const full = units.reduce((t, u) => t + u.size * 100, 0);
  return full > 0 ? units.filter(standing).reduce((t, u) => t + u.strength * u.size, 0) / full : 0;
};

