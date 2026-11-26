// Ships as combatants (D-505; docs-v2/spec/combat-scales.md section B): the class built from data, the ship in a fight, its
// shields, power and damage. Pure; seeded RNG. Nothing here rolls to hit: dogfight.ts and fleetBattle.ts decide what lands.
import { FACINGS, PARTICLE_BY_KIND, SHIP_SPECS, type Arc, type Facing, type Mount, type ShipKind, type ShipRole, type ShipSpec } from '../data/ships';
import {
  BREAK_UP,
  BURNOUT_SHARE,
  CAPITAL_SYSTEMS,
  ERA_RAPID_FIRE,
  ERA_RECHARGE,
  FIGHTER_SYSTEMS,
  FLEET,
  GENERATORS_BY_LENGTH,
  GENERATOR_POWER,
  GUNS_MAX,
  GUN_POWER,
  GUN_POWER_SETTINGS,
  HARDY_BURNOUT,
  HELD_FIRE_TO_SHIELDS,
  HULL_SHARE,
  HULL_STATES,
  ION,
  PARTICLE_DOWN_FACTOR,
  POWER_EVEN,
  PROJECTOR_MINUTES,
  RECHARGE_PER_MINUTE,
  RETUNED,
  SHIELDS_BY_LENGTH,
  SHIP_WEAPON,
  SYSTEM_FACTOR,
  SYSTEM_STATES,
  TOWER,
  WARHEAD_BYPASS,
  reactorFromWatts,
  usualReactor,
  type DamageKind,
  type PowerShares,
  type RangeBand,
  type ShipSystem,
  type ShipWeapon,
  type SystemState,
  type TargetSize,
} from '../data/shipCombat.config';
import { clamp, interp } from './interp';
import { nextFloat, type RngState } from './rng';

// ---- classes ----

export interface ShipClass {
  id: string;
  name: string;
  kind: ShipKind;
  role: ShipRole;
  from: number | null;
  to: number | null;
  lengthM: number | null;
  /** The full pool on each facing: two for fighters and freighters, four for capital ships. */
  shields: Partial<Record<Facing, number>>;
  hull: number;
  generators: number;
  usualGenerators: number;
  hardy: boolean;
  reactor: number;
  particle: number;
  weapons: readonly Mount[];
  hangar: readonly { classId: string; count: number }[];
  handling: number;
  speed: number;
  gunsMax: number;
  wedge: boolean;
  allRound: boolean;
  longTargeting: boolean;
  domes: number;
  decoys: boolean;
  letter: string;
  weak: boolean;
  /** Fields no source gives. */
  invented: readonly string[];
  note: string;
}

export const isSmallKind = (k: ShipKind): boolean => k === 'fighter' || k === 'freighter';

export function buildClass(s: ShipSpec): ShipClass {
  const small = isSmallKind(s.kind);
  const len = s.len ?? s.like ?? 100;
  const curve = interp(SHIELDS_BY_LENGTH, len);
  const total = Math.round(s.sbd ?? curve * (s.shieldX ?? 1));
  const usual = Math.round(interp(GENERATORS_BY_LENGTH, len));
  const faces: readonly Facing[] = small ? ['fore', 'aft'] : FACINGS;
  return {
    id: s.id,
    name: s.name,
    kind: s.kind,
    role: s.role,
    from: s.from ?? null,
    to: s.to ?? null,
    lengthM: s.len ?? null,
    shields: Object.fromEntries(faces.map((f) => [f, total / faces.length])),
    hull: Math.round(s.ru ?? (s.sbd ?? curve) * (s.hullX ?? 1) * HULL_SHARE),
    generators: s.generators ?? (total > 0 ? usual : 0),
    usualGenerators: usual,
    hardy: s.hardy ?? false,
    reactor: s.watts === undefined ? Math.round(usualReactor(total) * 10) / 10 : reactorFromWatts(s.watts),
    particle: total > 0 ? PARTICLE_BY_KIND[s.kind] : 0,
    weapons: s.weapons,
    hangar: s.hangar ?? [],
    handling: s.handling,
    speed: s.speed ?? 5,
    gunsMax: s.trueWarship ? GUNS_MAX.trueWarship : GUNS_MAX.ordinary,
    wedge: s.wedge ?? false,
    allRound: s.allRound ?? false,
    longTargeting: s.longTargeting ?? false,
    domes: s.domes ?? 0,
    decoys: s.decoys ?? false,
    letter: s.letter,
    weak: s.weak ?? false,
    invented: [
      ...new Set([
        'particle',
        'handling',
        'speed',
        'arcs where the note does not say',
        ...(s.sbd === undefined ? ['shields'] : []),
        ...(s.ru === undefined ? ['hull'] : []),
        ...(s.watts === undefined ? ['reactor'] : []),
        ...(s.generators === undefined ? ['generators'] : []),
        ...(s.len === undefined && !small ? ['length for the curves'] : []),
        ...(s.invented ?? []),
      ]),
    ],
    note: s.note ?? '',
  };
}

export const SHIP_CLASSES: readonly ShipClass[] = SHIP_SPECS.map(buildClass);
const BY_ID: ReadonlyMap<string, ShipClass> = new Map(SHIP_CLASSES.map((c) => [c.id, c]));
export function shipClass(id: string): ShipClass {
  const c = BY_ID.get(id);
  if (!c) throw new Error(`unknown ship class ${id}`);
  return c;
}
/** In service in a calendar year (D-438: one dated list, read for the year). */
export const shipInService = (c: ShipClass, year: number): boolean => (c.from === null || year >= c.from) && (c.to === null || year <= c.to);
export const totalShields = (c: ShipClass): number => Object.values(c.shields).reduce((a, b) => a + b, 0);
export const targetSize = (c: ShipClass): TargetSize => (c.kind === 'fighter' ? 'fighter' : c.kind === 'freighter' || c.kind === 'corvette' ? 'small' : 'capital');

// ---- a ship in a fight ----

export type Faces<T> = Partial<Record<Facing, T>>;

/** Levels, as the characters have them; a crew without a named figure has one level for everything. */
export interface Crew {
  piloting: number;
  gunnery: number;
  repair: number;
  forceSense: number;
}
export const crewOf = (level: number): Crew => ({ piloting: level, gunnery: level, repair: level, forceSense: 0 });
/**
 * A named figure's crew from its levels (m8-skills, D-513): Piloting to fly, Gunnery for the pilot's shots (it replaces the
 * Piloting stand-in of D-505/D-506), Repair for repairs, Force Sense for the Force's help. Untrained skills are 0.
 */
export const crewFromLevels = (lv: Readonly<Record<string, number>>): Crew => ({ piloting: lv['piloting'] ?? 0, gunnery: lv['gunnery'] ?? 0, repair: lv['repair'] ?? 0, forceSense: lv['forceSense'] ?? 0 });
/** A turret gunner's level (m8-skills, D-513): Gunnery, in place of the Blaster stand-in. Blaster stays personal arms. */
export const gunnerLevel = (lv: Readonly<Record<string, number>>): number => lv['gunnery'] ?? 0;

export interface ShipState {
  id: string;
  name: string;
  classId: string;
  shields: Faces<number>;
  /** Minutes of work left on a burnt-out projector; absent = working. */
  burnt: Faces<number>;
  /** Fire taken on each facing this turn or round. */
  taken: Faces<number>;
  hull: number;
  /** Ion load, and the minutes the ship stays dead from it. */
  ion: number;
  disabledMinutes: number;
  systems: Partial<Record<ShipSystem, SystemState>>;
  domes: number;
  domeHull: number;
  bridge: number;
  generators: number;
  power: PowerShares;
  /** Shields retuned against ion bolts: open to everything else. */
  retuned: boolean;
  /** Particle shields drop this round: fighters launching, or its own warheads going out. */
  particleDown: boolean;
  /** Warheads left, by mount. */
  ammo: Record<number, number>;
  crew: Crew;
  /** Broken up or blown apart. */
  destroyed: boolean;
  /** Left the fight. */
  gone: boolean;
}

export const domeHull = (c: ShipClass): number => Math.min(TOWER.cap, c.hull * TOWER.dome);
export const bridgeHull = (c: ShipClass): number => Math.min(TOWER.cap, c.hull * TOWER.bridge);
export const mountCount = (m: Mount): number => Object.values(m.arcs).reduce((a, b) => a + b, 0);
export const facingsOf = (c: ShipClass): Facing[] => FACINGS.filter((f) => c.shields[f] !== undefined);

export function newShip(id: string, classId: string, crew: Crew | number, name = id): ShipState {
  const c = shipClass(classId);
  return {
    id,
    name,
    classId,
    shields: { ...c.shields },
    burnt: {},
    taken: {},
    hull: c.hull,
    ion: 0,
    disabledMinutes: 0,
    systems: {},
    domes: c.domes,
    domeHull: domeHull(c),
    bridge: bridgeHull(c),
    generators: c.generators,
    power: POWER_EVEN,
    retuned: false,
    particleDown: false,
    ammo: Object.fromEntries(c.weapons.map((m, i) => [i, (m.ammo ?? 0) * mountCount(m)] as const).filter(([, n]) => n > 0)),
    crew: typeof crew === 'number' ? crewOf(crew) : crew,
    destroyed: false,
    gone: false,
  };
}

export const systemState = (s: ShipState, sys: ShipSystem): SystemState => s.systems[sys] ?? 'working';
export const systemFactor = (s: ShipState, sys: ShipSystem): number => SYSTEM_FACTOR[systemState(s, sys)];

export const DAMAGE_STATES = ['fighting', 'shieldsDown', 'damaged', 'crippled', 'disabled', 'destroyed'] as const;
export type DamageState = (typeof DAMAGE_STATES)[number];
export function damageState(s: ShipState): DamageState {
  const c = shipClass(s.classId);
  if (s.destroyed) return 'destroyed';
  if (s.disabledMinutes > 0 || (systemState(s, 'engines') === 'destroyed' && systemState(s, 'weapons') === 'destroyed')) return 'disabled';
  if (s.hull <= c.hull * HULL_STATES.crippled || (c.domes > 0 && s.bridge <= 0)) return 'crippled';
  if (s.hull <= c.hull * HULL_STATES.damaged) return 'damaged';
  return totalShields(c) > 0 && facingsOf(c).every((f) => (s.shields[f] ?? 0) <= 0) ? 'shieldsDown' : 'fighting';
}
/** Still in the fight: not destroyed, gone, or without hull. A ship dead from ion is in it but does nothing. */
export const inFight = (s: ShipState): boolean => !s.destroyed && !s.gone && s.hull > 0;
export const canAct = (s: ShipState): boolean => inFight(s) && s.disabledMinutes <= 0;
/** Can be boarded (design notes). */
export const canBeBoarded = (s: ShipState): boolean => damageState(s) === 'disabled';

// ---- power ----

/** Power shares as ordered: no more in the guns than the class can use, and the three make one whole. */
export function setPower(s: ShipState, p: PowerShares): ShipState {
  const c = shipClass(s.classId);
  const sum = Math.max(1e-9, p.guns + p.shields + p.engines);
  const guns = Math.min(c.gunsMax, p.guns / sum);
  const rest = Math.max(1e-9, p.shields + p.engines);
  return { ...s, power: { guns, shields: ((1 - guns) * p.shields) / rest, engines: ((1 - guns) * p.engines) / rest } };
}
export const gunPower = (share: number, settings: boolean): number => interp(settings ? GUN_POWER_SETTINGS : GUN_POWER, share);

// ---- shields ----

/** Move the pool between facings: double front, or rebalancing. The total stays; a burnt-out facing takes none. */
export function angleShields(s: ShipState, shares: Faces<number>): ShipState {
  const c = shipClass(s.classId);
  const open = facingsOf(c).filter((f) => s.burnt[f] === undefined);
  const total = open.reduce((a, f) => a + (s.shields[f] ?? 0), 0);
  const weight = open.reduce((a, f) => a + Math.max(0, shares[f] ?? 0), 0);
  if (weight <= 0) return s;
  return { ...s, shields: { ...s.shields, ...Object.fromEntries(open.map((f) => [f, (total * Math.max(0, shares[f] ?? 0)) / weight])) } };
}
/** The freshest facing, for a ship that rolls to show it. */
export function freshest(s: ShipState): Facing {
  const faces = facingsOf(shipClass(s.classId));
  return faces.reduce((best, f) => ((s.shields[f] ?? 0) > (s.shields[best] ?? 0) ? f : best), faces[0]!);
}

/** Recovery a minute over the whole ship, before the facings share it. */
export function rechargePerMinute(s: ShipState, year: number, gunsFiring = true): number {
  const c = shipClass(s.classId);
  const total = totalShields(c);
  if (total <= 0 || s.generators <= 0) return 0;
  const share = s.power.shields + (gunsFiring ? 0 : s.power.guns * HELD_FIRE_TO_SHIELDS);
  const generators = Math.pow(s.generators / Math.max(1, c.usualGenerators), GENERATOR_POWER);
  const rate = isSmallKind(c.kind) ? RECHARGE_PER_MINUTE.small : RECHARGE_PER_MINUTE.capital;
  return total * rate * (c.reactor / usualReactor(total)) * (share / POWER_EVEN.shields) * generators * interp(ERA_RECHARGE, year) * systemFactor(s, 'generator');
}

/**
 * Time passes: shields recover, crews swap projectors and clear ion. The facings under their full pool share it; one whose
 * projector is burnt out takes none (repair, not recharge). Fighters and freighters cannot swap a projector in flight.
 */
export function passMinutes(s: ShipState, minutes: number, year: number, gunsFiring = true): ShipState {
  const c = shipClass(s.classId);
  const shields = { ...s.shields };
  const burnt: Faces<number> = { ...s.burnt };
  if (!isSmallKind(c.kind)) {
    for (const f of FACINGS) {
      const left = burnt[f];
      if (left === undefined) continue;
      if (left - minutes <= 1e-9) delete burnt[f];
      else burnt[f] = left - minutes;
    }
  }
  let pool = s.disabledMinutes > 0 ? 0 : rechargePerMinute(s, year, gunsFiring) * minutes;
  const open = facingsOf(c).filter((f) => s.burnt[f] === undefined);
  for (let i = 0; i < 4 && pool > 1e-9; i++) {
    // Angled shields may stand over a facing's own pool; those take none.
    const low = open.filter((f) => (shields[f] ?? 0) < (c.shields[f] ?? 0) - 1e-9);
    if (low.length === 0) break;
    const each = pool / low.length;
    pool = 0;
    for (const f of low) {
      const put = Math.min((c.shields[f] ?? 0) - (shields[f] ?? 0), each);
      shields[f] = (shields[f] ?? 0) + put;
      pool += each - put;
    }
  }
  const clear = ionTolerance(c) * (ION.repairPerMinute + ION.repairPerLevel * s.crew.repair) * minutes;
  return { ...s, shields, burnt, taken: {}, particleDown: false, ion: Math.max(0, s.ion - clear), disabledMinutes: Math.max(0, s.disabledMinutes - minutes) };
}

export const ionTolerance = (c: ShipClass): number => Math.max(1, c.hull * ION.tolerance);

/** How much of a warhead goes past the pool now. */
export function warheadBypass(s: ShipState, timed = false): number {
  const p = shipClass(s.classId).particle;
  return interp(WARHEAD_BYPASS, s.particleDown ? (timed ? 0 : p * PARTICLE_DOWN_FACTOR) : p);
}

// ---- damage ----

export interface Fire {
  damage: number;
  kind: DamageKind;
  facing: Facing;
  /** Turbolaser fire (the rapid-fire guns of the 7700s-7500s BBY beat any shield). */
  turbolaser?: boolean;
  /** A volley timed to the moment the particle shields are down. */
  timed?: boolean;
  /** Stops at the shields: nothing over the pool reaches the hull (a graze). */
  shieldsOnly?: boolean;
}
export interface FireResult {
  ship: ShipState;
  toShield: number;
  toHull: number;
  ionLoad: number;
  /** The facing's projector burned out. */
  burnt: boolean;
  disabled: boolean;
}

/** Damage onto one facing: the pool first, then the hull. */
export function applyFire(s: ShipState, fire: Fire, year: number): FireResult {
  const c = shipClass(s.classId);
  const full = c.shields[fire.facing] ?? 0;
  const pool = s.burnt[fire.facing] === undefined ? (s.shields[fire.facing] ?? 0) : 0;
  let drain: number;
  let toHull: number;
  let ionLoad = 0;
  if (fire.kind === 'ion') {
    // Retuned shields stop ion; ordinary (ray) shields do not: it passes, and drains the generator on the way.
    const stops = s.retuned && pool > 0;
    drain = Math.min(pool, fire.damage * (stops ? RETUNED.ionDrain : ION.shieldDrain));
    ionLoad = stops ? 0 : fire.damage;
    toHull = stops ? 0 : fire.damage * ION.hull;
  } else if (fire.kind === 'energy') {
    const beat = fire.turbolaser ? interp(ERA_RAPID_FIRE, year) : 1;
    drain = Math.min(pool, fire.damage * (s.retuned ? RETUNED.energyStopped : 1) * beat);
    toHull = fire.damage - drain / beat;
    if (fire.shieldsOnly && pool > 0 && !s.retuned) toHull = 0;
  } else {
    const past = fire.damage * warheadBypass(s, fire.timed);
    drain = Math.min(pool, fire.damage - past);
    toHull = fire.damage - drain;
  }
  const left = pool - drain;
  const taken = (s.taken[fire.facing] ?? 0) + fire.damage;
  const limit = full * (isSmallKind(c.kind) ? BURNOUT_SHARE.small : BURNOUT_SHARE.capital) * (c.hardy ? HARDY_BURNOUT : 1);
  const burns = full > 0 && s.burnt[fire.facing] === undefined && left <= 1e-9 && taken >= limit;
  const ion = s.ion + ionLoad;
  const ratio = ion / ionTolerance(c);
  const minutes = ratio >= 1 && ionLoad > 0 ? interp(ION.disabledMinutes, ratio) : 0;
  const ship: ShipState = {
    ...s,
    shields: full > 0 ? { ...s.shields, [fire.facing]: left } : s.shields,
    burnt: burns ? { ...s.burnt, [fire.facing]: interp(PROJECTOR_MINUTES, s.crew.repair) } : s.burnt,
    taken: { ...s.taken, [fire.facing]: taken },
    hull: s.hull - toHull,
    ion,
    disabledMinutes: Math.max(s.disabledMinutes, minutes),
  };
  return { ship, toShield: drain, toHull, ionLoad, burnt: burns, disabled: minutes > 0 && s.disabledMinutes <= 0 };
}

const worse = (a: SystemState): SystemState => SYSTEM_STATES[Math.min(SYSTEM_STATES.length - 1, SYSTEM_STATES.indexOf(a) + 1)]!;

/** A system hit: one at random of those the ship has (or the one named), to at least a state. */
export function hitSystem(s: ShipState, to: SystemState, rng: RngState, only?: ShipSystem): [ShipState, ShipSystem, RngState] {
  const c = shipClass(s.classId);
  const list = (c.kind === 'fighter' ? FIGHTER_SYSTEMS : CAPITAL_SYSTEMS).filter((x) => !(x === 'hangar' && c.hangar.length === 0) && systemState(s, x) !== 'destroyed');
  const [u, r] = nextFloat(rng);
  const sys = only ?? list[Math.floor(u * list.length)] ?? 'engines';
  const now = systemState(s, sys);
  const next = SYSTEM_STATES.indexOf(now) >= SYSTEM_STATES.indexOf(to) ? worse(now) : to;
  return [{ ...s, systems: { ...s.systems, [sys]: next }, generators: sys === 'generator' && next === 'destroyed' ? Math.max(0, s.generators - Math.ceil(s.generators / 3)) : s.generators }, sys, r];
}

/** What a crew mends first. */
export const SHIP_REPAIR_ORDER: readonly ShipSystem[] = ['weapons', 'generator', 'engines', 'sensors', 'lifeSupport', 'hangar', 'hyperdrive'];

/** A field repair: a patch, a step or two better (never out of destroyed). */
export function patchSystem(s: ShipState, sys: ShipSystem, steps = 1): ShipState {
  const i = SYSTEM_STATES.indexOf(systemState(s, sys));
  if (i === 0 || i === SYSTEM_STATES.length - 1) return s;
  return { ...s, systems: { ...s.systems, [sys]: SYSTEM_STATES[Math.max(0, i - steps)]! } };
}

/** At no hull: a fighter is gone; a larger ship is a hulk that may break up. */
export function settleHull(s: ShipState, rng: RngState): [ShipState, RngState] {
  if (s.destroyed || s.hull > 0) return [s, rng];
  const c = shipClass(s.classId);
  if (c.kind === 'fighter' || -s.hull >= c.hull * BREAK_UP.overkill) return [{ ...s, destroyed: true }, rng];
  const [u, r] = nextFloat(rng);
  return [u < BREAK_UP.chance ? { ...s, destroyed: true } : s, r];
}

/**
 * A called shot at the tower: the domes can only be reached once a forward or side shield is down, and the bridge once a
 * dome is gone too (Endor: the forward shields, then the port dome, then the bridge).
 */
export const towerExposed = (s: ShipState): boolean => shipClass(s.classId).domes > 0 && FACINGS.some((f) => f !== 'aft' && (s.burnt[f] !== undefined || (s.shields[f] ?? 0) <= 1e-9));
export const bridgeExposed = (s: ShipState): boolean => towerExposed(s) && s.domes < shipClass(s.classId).domes;
export function hitTower(s: ShipState, target: 'dome' | 'bridge', damage: number): ShipState {
  if (target === 'bridge') return bridgeExposed(s) ? { ...s, bridge: Math.max(0, s.bridge - damage) } : s;
  if (!towerExposed(s) || s.domes <= 0) return s;
  const left = s.domeHull - damage;
  return left > 0 ? { ...s, domeHull: left } : { ...s, domes: s.domes - 1, domeHull: domeHull(shipClass(s.classId)) };
}

// ---- volleys ----

export interface Volley {
  energy: number;
  turbolaser: number;
  ion: number;
  /** Warheads sent, and what each does. */
  warheads: { mount: number; count: number; damage: number }[];
}

const REACH: Readonly<Record<RangeBand, number>> = { close: 0, medium: 1, long: 2 };
export const reaches = (w: ShipWeapon, range: RangeBand): boolean => REACH[w.range] >= REACH[range];

/** The arcs that bear: bow-on (a wedge's flanks too), or broadside; an all-round ship's two, or all on several targets. */
export function bearing(c: ShipClass, aspect: 'bow' | 'broadside', severalTargets = false): Arc[] {
  if (c.allRound) return severalTargets ? ['fore', 'port', 'starboard', 'aft', 'all'] : ['fore', 'port', 'all'];
  if (aspect === 'bow') return c.wedge ? ['fore', 'port', 'starboard', 'all'] : ['fore', 'all'];
  return ['port', 'all'];
}
/** How a ship fights by choice: wherever more guns bear, except the big ships at close range, where it is broadsides (lore). */
export function bestAspect(c: ShipClass, range: RangeBand): 'bow' | 'broadside' {
  if (range === 'close' && targetSize(c) === 'capital' && c.kind !== 'frigate') return 'broadside';
  const sum = (arcs: Arc[]): number => c.weapons.reduce((t, m) => t + arcs.reduce((n, a) => n + (m.arcs[a] ?? 0), 0) * m.barrels * (SHIP_WEAPON.get(m.weapon)?.damage ?? 0), 0);
  return sum(bearing(c, 'bow')) >= sum(bearing(c, 'broadside')) ? 'bow' : 'broadside';
}

/** One full volley at a target of a size and range: what would land if all of it did. */
export function volleyOf(s: ShipState, arcs: readonly Arc[], range: RangeBand, size: TargetSize, trackingOf: (w: ShipWeapon) => number, warheads = false): Volley {
  const c = shipClass(s.classId);
  const guns = systemFactor(s, 'weapons');
  const out: Volley = { energy: 0, turbolaser: 0, ion: 0, warheads: [] };
  c.weapons.forEach((m, i) => {
    const w = SHIP_WEAPON.get(m.weapon)!;
    if (!reaches(w, range)) return;
    const n = arcs.reduce((t, a) => t + (m.arcs[a] ?? 0), 0);
    if (n <= 0) return;
    if (w.kind === 'warhead') {
      const left = s.ammo[i] ?? 0;
      if (warheads && left > 0) out.warheads.push({ mount: i, count: Math.min(left, n), damage: w.damage });
      return;
    }
    const dmg = n * m.barrels * w.damage * guns * gunPower(s.power.guns, m.settings ?? false) * trackingOf(w) * (size === 'fighter' ? 1 : size === 'small' ? Math.sqrt(w.vsCapital ?? 1) : (w.vsCapital ?? 1));
    if (w.kind === 'ion') out.ion += dmg;
    else if (w.turbolaser) out.turbolaser += dmg;
    else out.energy += dmg;
  });
  return out;
}

/** Point defence: the weight of its guns that bears on fighters and warheads coming at one place. */
export function pointDefenceOf(s: ShipState): number {
  const guns = shipClass(s.classId).weapons.reduce((t, m) => {
    const w = SHIP_WEAPON.get(m.weapon);
    return t + (w?.pointDefence ? mountCount(m) * m.barrels * w.damage : 0);
  }, 0);
  return guns * Math.min(1, FLEET.pdLength / (shipClass(s.classId).lengthM ?? FLEET.pdLength)) * systemFactor(s, 'weapons') * clamp(s.power.guns * 2, 0, 1);
}
