// Dogfights (D-505; docs-v2/spec/combat-scales.md section C): fighters and freighters, turns of a few seconds. Each turn an
// opposed piloting roll moves the position (the track), then whoever has a shot takes it. Pure; seeded RNG.
import { DOGFIGHT, MANOEUVRE, REPAIR_DC, SHIP_WEAPON, TRACKING_MOD, TURN_SECONDS, type Manoeuvre, type RangeBand, type ShipSystem } from '../data/shipCombat.config';
import type { Facing, Mount } from '../data/ships';
import { interp } from './interp';
import { basicRoll, type Modifier } from './rolls';
import { angleShields, applyFire, gunFire, hitSystem, inFight, isSmallKind, passMinutes, patchSystem, rechargePerMinute, shipClass, settleHull, systemState, type ShipState } from './ships';
import { MOD_BATTLE } from '../data/shipLife.config';
import { clampTrack, contest, hitQuality, moveTrack, striker } from './track';
import type { RngState } from './rng';

export interface Flyer {
  ship: ShipState;
  /** A friend close enough to help (the trap, the Corellian Slip). */
  wingman?: boolean;
  /** A droid pilot, or one the Force guides (Slip-jaws). */
  forceOrDroid?: boolean;
  /** Freighters: someone at the power and shield controls, and a gunner's level for each crewed turret. */
  engineer?: boolean;
  gunners?: readonly number[];
  /** Story modifiers on this pilot's piloting and shots. */
  modifiers?: readonly Modifier[];
}

export interface DogOrders {
  manoeuvre?: Manoeuvre;
  /** Shift power to one thing at the cost of another. */
  boost?: 'lasers' | 'shields' | 'engines';
  weaken?: 'lasers' | 'shields' | 'engines';
  angle?: 'even' | 'front' | 'back';
  shot?: 'guns' | 'ion' | 'torpedo' | 'none';
  /** Take a poor shot: head-on or from the side. */
  snap?: boolean;
  /** A crew member or astromech works on this. */
  repair?: ShipSystem;
}

export interface Shot {
  by: 'A' | 'B';
  what: 'guns' | 'ion' | 'torpedo' | 'turret';
  margin: number;
  hit: boolean;
  facing: Facing;
  toShield: number;
  toHull: number;
  system: ShipSystem | null;
  burnt: boolean;
  lost: boolean;
}

export interface DogTurn {
  n: number;
  margin: number;
  before: number;
  after: number;
  position: DogPosition;
  shots: Shot[];
  notes: string[];
}

export interface Dogfight {
  a: Flyer;
  b: Flyer;
  /** Position: positive, A has the better of it; at 3 or more A is on B's tail. */
  track: number;
  range: RangeBand;
  turn: number;
  year: number;
  terrain: boolean;
  rng: RngState;
  log: DogTurn[];
  end: { winner: 'A' | 'B' | null; reason: 'destroyed' | 'disabled' | 'brokeOff' } | null;
}

export type DogPosition = 'onTail' | 'tailed' | 'ahead' | 'behind' | 'headOn' | 'brokenOff';
/** The position as A sees it. */
export function positionOf(d: Pick<Dogfight, 'track' | 'range'>): DogPosition {
  if (d.track >= 3) return 'onTail';
  if (d.track <= -3) return 'tailed';
  if (d.track > 0) return 'ahead';
  if (d.track < 0) return 'behind';
  return d.range === 'close' ? 'headOn' : 'brokenOff';
}

export const startDogfight = (a: Flyer, b: Flyer, rng: RngState, opts: { range?: RangeBand; track?: number; terrain?: boolean; year?: number } = {}): Dogfight => ({
  a,
  b,
  track: opts.track ?? 0,
  range: opts.range ?? 'close',
  turn: 0,
  year: opts.year ?? -3661,
  terrain: opts.terrain ?? false,
  rng,
  log: [],
  end: null,
});

const mod = (source: string, value: number): Modifier[] => (value === 0 ? [] : [{ source, value }]);
const enginePenalty = (s: ShipState): number => ({ working: 0, damaged: -2, disabled: -5, destroyed: -8 })[systemState(s, 'engines')];
const sensorPenalty = (s: ShipState): number => ({ working: 0, damaged: -1, disabled: -3, destroyed: -3 })[systemState(s, 'sensors')];

/** The manoeuvre as it can be flown here: one without its wingman, terrain or pilot is plain flying, and so is the wrong end. */
export function flown(o: DogOrders, f: Flyer, lead: number, terrain: boolean): Manoeuvre {
  const id = o.manoeuvre ?? 'fly';
  const def = MANOEUVRE[id];
  if (def.needs === 'wingman' && !f.wingman) return 'fly';
  if (def.needs === 'terrain' && !terrain) return 'fly';
  if (def.needs === 'forceOrDroid' && !f.forceOrDroid) return 'fly';
  if (def.use === 'defensive' && lead > 0) return 'fly';
  if (def.use === 'attacking' && lead < 0) return 'fly';
  return id;
}

/** Piloting, as it counts this turn. */
export function pilotingMods(f: Flyer, o: DogOrders, move: Manoeuvre, theirs: Manoeuvre): Modifier[] {
  const c = shipClass(f.ship.classId);
  const shifting = o.boost !== undefined && c.kind === 'freighter' && !f.engineer;
  return [
    ...mod('handling', c.handling),
    ...mod('engines', enginePenalty(f.ship)),
    ...mod('power to engines', o.boost === 'engines' ? DOGFIGHT.boost.engines : o.weaken === 'engines' ? DOGFIGHT.boost.enginesWeak : 0),
    ...mod('no engineer', shifting ? DOGFIGHT.noEngineer : 0),
    ...mod('the Force', interp(DOGFIGHT.forceSense, f.ship.crew.forceSense)),
    ...mod('a sensor suite reads them', f.ship.kit?.sensors ? MOD_BATTLE.sensorsPosition : 0),
    ...mod(MANOEUVRE[move].label, MANOEUVRE[move].mod + (MANOEUVRE[move].against?.[theirs] ?? 0)),
    ...(f.modifiers ?? []),
  ];
}

const fixedGuns = (f: Flyer, kind: 'energy' | 'ion'): Mount[] => shipClass(f.ship.classId).weapons.filter((m) => !m.turret && (m.arcs.fore ?? 0) > 0 && SHIP_WEAPON.get(m.weapon)!.kind === kind);
const volleyDamage = (mounts: readonly Mount[], ship: ShipState): number => mounts.reduce((t, m) => t + (m.arcs.fore ?? m.arcs.all ?? m.arcs.aft ?? 1) * gunFire(ship, m, SHIP_WEAPON.get(m.weapon)!), 0);
const torpedoMount = (f: Flyer): number => shipClass(f.ship.classId).weapons.findIndex((m, i) => SHIP_WEAPON.get(m.weapon)!.kind === 'warhead' && (f.ship.ammo[i] ?? 0) > 0);

interface Aim {
  what: Shot['what'];
  kind: 'energy' | 'ion' | 'warhead';
  level: number;
  mods: Modifier[];
  damage: number;
  ammo: number | null;
}

/** What a side can fire this turn: its fixed guns or a torpedo from a position, and its crewed turrets from anywhere. */
function aims(f: Flyer, o: DogOrders, lead: number, range: RangeBand, jinking: boolean): Aim[] {
  const out: Aim[] = [];
  const guns = systemState(f.ship, 'weapons') === 'destroyed' ? 'none' : (o.shot ?? 'guns');
  const common = [...mod('range', DOGFIGHT.range[range]), ...mod('sensors', sensorPenalty(f.ship)), ...(f.modifiers ?? [])];
  const power = o.boost === 'lasers' ? DOGFIGHT.boost.lasers : o.weaken === 'lasers' ? DOGFIGHT.boost.lasersWeak : 1;
  const hurt = systemState(f.ship, 'weapons') === 'working' ? 1 : 0.6;
  const good = lead >= 3;
  const poor = lead >= 0 && o.snap === true;
  if (guns !== 'none' && (good || poor)) {
    const at = [...common, ...mod(good ? 'on the tail' : lead === 0 ? 'head-on' : 'from the side', interp(DOGFIGHT.position, lead)), ...mod('jinking', jinking ? DOGFIGHT.jink.ownShots : 0)];
    const t = torpedoMount(f);
    if (guns === 'torpedo' && good && t >= 0) {
      const w = SHIP_WEAPON.get(shipClass(f.ship.classId).weapons[t]!.weapon)!;
      out.push({ what: 'torpedo', kind: 'warhead', level: f.ship.crew.gunnery, mods: [...at, ...mod('tracking', TRACKING_MOD[w.tracking] + 3)], damage: w.damage, ammo: t });
    } else {
      const ion = fixedGuns(f, 'ion');
      const use = guns === 'ion' && ion.length > 0 ? ion : fixedGuns(f, 'energy');
      if (use.length > 0) out.push({ what: guns === 'ion' && ion.length > 0 ? 'ion' : 'guns', kind: guns === 'ion' && ion.length > 0 ? 'ion' : 'energy', level: f.ship.crew.gunnery, mods: at, damage: volleyDamage(use, f.ship) * power * hurt, ammo: null });
    }
  }
  const turrets = shipClass(f.ship.classId).weapons.filter((m) => m.turret);
  (f.gunners ?? []).slice(0, turrets.reduce((n, m) => n + Math.max(1, Object.values(m.arcs).reduce((a, b) => a + b, 0)), 0)).forEach((level, i) => {
    let left = i;
    const m = turrets.find((t) => {
      const n = Object.values(t.arcs).reduce((a, b) => a + b, 0);
      if (left < n) return true;
      left -= n;
      return false;
    });
    if (!m || guns === 'none') return;
    const w = SHIP_WEAPON.get(m.weapon)!;
    out.push({ what: 'turret', kind: w.kind, level, mods: [...common, ...mod('turret', DOGFIGHT.turret), ...mod('tracking', TRACKING_MOD[w.tracking])], damage: gunFire(f.ship, m, w) * power * hurt, ammo: null });
  });
  return out;
}

function evasionMods(f: Flyer, o: DogOrders, jinking: boolean): Modifier[] {
  const c = shipClass(f.ship.classId);
  return [
    ...mod('handling', c.handling),
    ...mod('engines', enginePenalty(f.ship)),
    ...mod('power to engines', o.boost === 'engines' ? DOGFIGHT.boost.engines : o.weaken === 'engines' ? DOGFIGHT.boost.enginesWeak : 0),
    ...mod('jinking', jinking ? DOGFIGHT.jink.evasion : 0),
    ...mod('the Force', interp(DOGFIGHT.forceSense, f.ship.crew.forceSense)),
  ];
}

/** One shot: gunnery against evasion, and what it does. */
function fireShot(aim: Aim, by: 'A' | 'B', target: Flyer, o: DogOrders, jinking: boolean, lead: number, year: number, rng: RngState): { shot: Shot; target: Flyer; rng: RngState } {
  const c = shipClass(target.ship.classId);
  const torpedo = aim.what === 'torpedo';
  const last: Modifier[] = torpedo ? [...mod('a lock', DOGFIGHT.torpedo.evasion), ...mod('decoys', c.decoys ? DOGFIGHT.torpedo.decoys : 0), ...mod('a jammer', target.ship.kit?.jammer ? MOD_BATTLE.jammer : 0), ...mod('a big target', c.kind === 'freighter' ? DOGFIGHT.torpedo.freighter : 0)] : [];
  const [roll, r1] = contest(rng, { level: aim.level, modifiers: aim.mods }, { level: target.ship.crew.piloting, modifiers: [...evasionMods(target, o, jinking), ...last] });
  let next = r1;
  const facing: Facing = lead === 0 && aim.what !== 'turret' ? 'fore' : lead >= 0 ? 'aft' : 'fore';
  const miss: Shot = { by, what: aim.what, margin: roll.margin, hit: false, facing, toShield: 0, toHull: 0, system: null, burnt: false, lost: false };
  const quality = torpedo ? (roll.margin >= 0 ? 'solid' : null) : hitQuality(roll.margin);
  if (quality === null) return { shot: miss, target, rng: next };
  const share = torpedo ? 1 : DOGFIGHT.share[quality];
  const bare = (target.ship.shields[facing] ?? 0) <= 0;
  const graze = quality === 'graze';
  const res = applyFire(target.ship, { damage: aim.damage * share * (graze && bare ? DOGFIGHT.bareGraze : 1), kind: aim.kind, facing, shieldsOnly: graze }, year);
  let ship = res.ship;
  let system: ShipSystem | null = null;
  // A system goes only when the shot got through: the hull was reached, or ion passed the shields.
  const through = res.toHull > 0 || res.ionLoad > 0;
  if (through && ship.hull > 0 && (quality === 'clean' || quality === 'critical')) [ship, system, next] = hitSystem(ship, quality === 'critical' ? 'destroyed' : 'disabled', next);
  if (system === 'cockpit' && systemState(ship, 'cockpit') === 'destroyed') ship = { ...ship, destroyed: true };
  [ship, next] = settleHull(ship, next);
  return { shot: { ...miss, hit: true, toShield: res.toShield, toHull: res.toHull, system, burnt: res.burnt, lost: ship.destroyed || ship.hull <= 0 }, target: { ...target, ship }, rng: next };
}

const sideOut = (f: Flyer): 'destroyed' | 'disabled' | null => (f.ship.destroyed || !inFight(f.ship) ? 'destroyed' : f.ship.disabledMinutes > 0 || systemState(f.ship, 'engines') === 'destroyed' ? 'disabled' : null);

const ANGLES = { even: { fore: 1, aft: 1 }, front: { fore: DOGFIGHT.angle, aft: 1 - DOGFIGHT.angle }, back: { fore: 1 - DOGFIGHT.angle, aft: DOGFIGHT.angle } } as const;

/** The turn's recovery: shields boosted or starved, then the clock. */
function settleTurn(f: Flyer, o: DogOrders, year: number): Flyer {
  const minutes = TURN_SECONDS / 60;
  const factor = o.boost === 'shields' ? DOGFIGHT.boost.shields : o.weaken === 'shields' ? DOGFIGHT.boost.shieldsWeak : 1;
  return { ...f, ship: rechargePerMinute(f.ship, year) > 0 ? passMinutes(f.ship, minutes * factor, year) : { ...f.ship, taken: {}, particleDown: false } };
}

function repairs(f: Flyer, o: DogOrders, rng: RngState, notes: string[], who: string): [Flyer, RngState] {
  if (!o.repair || f.ship.crew.repair <= 0) return [f, rng];
  const [roll, r] = basicRoll(rng, f.ship.crew.repair, []);
  if (roll.total < REPAIR_DC) return [f, r];
  notes.push(`${who}: ${o.repair} patched`);
  return [{ ...f, ship: patchSystem(f.ship, o.repair) }, r];
}

export function dogfightTurn(d: Dogfight, oa: DogOrders = {}, ob: DogOrders = {}): Dogfight {
  if (d.end) return d;
  const notes: string[] = [];
  let rng = d.rng;
  let a: Flyer = { ...d.a, ship: oa.angle ? angleShields(d.a.ship, ANGLES[oa.angle]) : d.a.ship };
  let b: Flyer = { ...d.b, ship: ob.angle ? angleShields(d.b.ship, ANGLES[ob.angle]) : d.b.ship };
  [a, rng] = repairs(a, oa, rng, notes, a.ship.name);
  [b, rng] = repairs(b, ob, rng, notes, b.ship.name);
  // 1. Position.
  const ma = flown(oa, a, d.track, d.terrain);
  const mb = flown(ob, b, -d.track, d.terrain);
  const [roll, r1] = contest(rng, { level: a.ship.crew.piloting, modifiers: pilotingMods(a, oa, ma, mb) }, { level: b.ship.crew.piloting, modifiers: pilotingMods(b, ob, mb, ma) });
  rng = r1;
  let track = moveTrack(d.track, roll.margin);
  let range: RangeBand = d.range === 'long' ? 'medium' : 'close';
  // A jinking pilot is hard to hit but does not shake the pursuer.
  if (ma === 'jink' && track > d.track) track = d.track;
  if (mb === 'jink' && track < d.track) track = d.track;
  for (const [side, move, won] of [['A', ma, roll.margin], ['B', mb, -roll.margin]] as const) {
    const def = MANOEUVRE[move];
    const me = side === 'A' ? a : b;
    if (move === 'loopBack' && won >= 0) {
      track = 0;
      range = 'medium';
    }
    if (def.risk === undefined || won > -def.risk) continue;
    notes.push(`${me.ship.name}: ${def.label} goes wrong`);
    track = clampTrack(track + (side === 'A' ? -1 : 1));
    if (d.terrain && (move === 'terrain' || move === 'koiogran')) {
      const crash = applyFire(me.ship, { damage: 20, kind: 'energy', facing: 'fore' }, d.year).ship;
      const [ship, r] = settleHull({ ...crash, hull: crash.hull - 8 }, rng);
      rng = r;
      if (side === 'A') a = { ...a, ship };
      else b = { ...b, ship };
      notes.push(`${me.ship.name} clips the terrain`);
    }
  }
  // 2. Shots: both sides' at once, from where they now are.
  const shots: Shot[] = [];
  let na = a;
  let nb = b;
  const jinkA = ma === 'jink';
  const jinkB = mb === 'jink';
  for (const aim of aims(a, oa, track, range, jinkA)) {
    const r = fireShot(aim, 'A', nb, ob, jinkB, track, d.year, rng);
    shots.push(r.shot);
    nb = r.target;
    rng = r.rng;
    if (aim.ammo !== null) na = { ...na, ship: { ...na.ship, particleDown: true, ammo: { ...na.ship.ammo, [aim.ammo]: (na.ship.ammo[aim.ammo] ?? 1) - 1 } } };
  }
  for (const aim of aims(b, ob, -track, range, jinkB)) {
    const r = fireShot(aim, 'B', na, oa, jinkA, -track, d.year, rng);
    shots.push(r.shot);
    na = r.target;
    rng = r.rng;
    if (aim.ammo !== null) nb = { ...nb, ship: { ...nb.ship, particleDown: true, ammo: { ...nb.ship.ammo, [aim.ammo]: (nb.ship.ammo[aim.ammo] ?? 1) - 1 } } };
  }
  // 3. A shot from the tail, landed or not, and the target breaks: the position eases.
  const lead = striker(track);
  const own = shots.filter((s) => s.by === lead && s.what !== 'turret');
  const afterShots = lead && own.length > 0 ? track - Math.sign(track) * (own.some((s) => s.hit) ? DOGFIGHT.afterHit : DOGFIGHT.afterMiss) : track;
  const outA = sideOut(na);
  const outB = sideOut(nb);
  const end: Dogfight['end'] = outA || outB ? { winner: outA && outB ? null : outA ? 'B' : 'A', reason: outA === 'destroyed' || outB === 'destroyed' ? 'destroyed' : 'disabled' } : null;
  const turn: DogTurn = { n: d.turn + 1, margin: roll.margin, before: d.track, after: afterShots, position: positionOf({ track, range }), shots, notes };
  return { ...d, a: end ? na : settleTurn(na, oa, d.year), b: end ? nb : settleTurn(nb, ob, d.year), track: afterShots, range, turn: d.turn + 1, rng, log: [...d.log, turn], end };
}

/** Breaking off: from an even or better position it is free; from a worse one the pursuer must lose the piloting roll. */
export function breakOff(d: Dogfight, side: 'A' | 'B'): Dogfight {
  if (d.end) return d;
  const lead = side === 'A' ? d.track : -d.track;
  if (lead >= 0) return { ...d, end: { winner: null, reason: 'brokeOff' } };
  const me = side === 'A' ? d.a : d.b;
  const them = side === 'A' ? d.b : d.a;
  const [roll, rng] = contest(d.rng, { level: me.ship.crew.piloting, modifiers: [...pilotingMods(me, {}, 'fly', 'fly'), { source: 'position', value: lead }] }, { level: them.ship.crew.piloting, modifiers: pilotingMods(them, {}, 'fly', 'fly') });
  return roll.margin >= 0 ? { ...d, rng, end: { winner: null, reason: 'brokeOff' } } : { ...d, rng };
}

/** A pilot's own choice, for NPCs: shake a pursuer, counter the likely break, shoot from a good position. */
export function autoDogOrders(d: Dogfight, side: 'A' | 'B'): DogOrders {
  const lead = side === 'A' ? d.track : -d.track;
  const me = side === 'A' ? d.a : d.b;
  const them = side === 'A' ? d.b : d.a;
  const dodge: readonly Manoeuvre[] = me.wingman ? ['trap', 'break', 'koiogran'] : ['break', 'koiogran', 'scissors'];
  const big = isSmallKind(shipClass(them.ship.classId).kind) && (shipClass(them.ship.classId).handling <= 0 || (them.ship.shields.aft ?? 0) > 35);
  return {
    manoeuvre: lead <= -1 ? dodge[d.turn % dodge.length]! : lead >= 1 ? (d.turn % 2 === 0 ? 'tallonRoll' : 'fly') : 'fly',
    shot: lead >= 3 && big && torpedoMount(me) >= 0 ? 'torpedo' : 'guns',
    snap: lead === 0 && d.range === 'close' && d.turn % 3 === 0,
  };
}

export function runDogfight(d: Dogfight, maxTurns = 120): Dogfight {
  let s = d;
  while (!s.end && s.turn < maxTurns) s = dogfightTurn(s, autoDogOrders(s, 'A'), autoDogOrders(s, 'B'));
  return s;
}

/** What a player's dogfights are worth to the fleet battle around them: half a point a kill, less one when driven off or lost. */
export const dogfightModifier = (kills: number, beaten: boolean, max: number): number => Math.max(-max, Math.min(max, Math.round(kills * 0.5 - (beaten ? 1 : 0))));
