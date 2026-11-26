// Fleet battles (D-505; docs-v2/spec/combat-scales.md section D): capital ships, rounds of a few minutes. Both commanders
// roll Tactics; the margin moves the advantage track and sets how much fire lands; what it does is the ships' own (ships.ts).
// Pure; seeded RNG.
import {
  FLEET,
  FORMATION_BEATS,
  FORMATION_LABEL,
  GUNS_MAX,
  ION,
  PLANNED_CHANGES,
  POWER_EVEN,
  RANGE_BANDS,
  REPAIR_DC,
  ROUND_MINUTES,
  SHIP_WEAPON,
  SYSTEM_HIT_PER_HULL,
  TRACKING_FACTOR,
  type Formation,
  type PowerShares,
  type RangeBand,
} from '../data/shipCombat.config';
import type { Facing } from '../data/ships';
import { clamp, interp } from './interp';
import { basicRoll, type Modifier } from './rolls';
import {
  applyFire,
  bearing,
  bestAspect,
  bridgeExposed,
  canAct,
  damageState,
  freshest,
  hitSystem,
  hitTower,
  ionTolerance,
  inFight,
  mountCount,
  passMinutes,
  patchSystem,
  pointDefenceOf,
  setPower,
  settleHull,
  SHIP_REPAIR_ORDER,
  shipClass,
  systemFactor,
  systemState,
  targetSize,
  totalShields,
  towerExposed,
  volleyOf,
  type ShipState,
} from './ships';
import { afterStrike, contest, moveTrack, strikeLands, strikeMargin, striker } from './track';
import { nextFloat, nextInt, type RngState } from './rng';

export interface Wing {
  id: string;
  classId: string;
  count: number;
  /** The pilots' level. */
  level: number;
  state: 'aboard' | 'launching' | 'out';
  mission: 'screen' | 'strike';
  /** Warheads each fighter has left. */
  warheads: number;
  from: string | null;
}

export interface FleetSide {
  name: string;
  ships: ShipState[];
  wings: Wing[];
  tactics: number;
  formation: Formation;
  /** Rounds of reforming left; gaps when the Tactics roll to change was bad. */
  reform: { rounds: number; gaps: boolean } | null;
  /** The formation was broken by losses: a brawl until it reforms. */
  broken: boolean;
  flagId: string | null;
  /** A slash's lead ship. */
  leadId: string | null;
  /** Rounds without command after the flagship fell. */
  commandLost: number;
  /** The enemy formation is known (scouts, sensor ships). */
  intel: boolean;
  /** The player's dogfights and the story, on the Tactics roll. */
  modifiers: readonly Modifier[];
  mayWithdraw: boolean;
  withdrawn: boolean;
  /** A battle meditator with the fleet (D-506), and their Meditation. */
  meditation: { name: string; level: number; alive: boolean } | null;
  /** The commander's cultural insight against the enemy's culture (m8-skills, D-513: +1, at most +2; engine/playXp insightBonus). */
  insight?: number;
  /** Ships whose crews are shaken, and the rounds it lasts. */
  shaken: Readonly<Record<string, number>>;
}

export interface FleetOrders {
  change?: Formation;
  focus?: string | null;
  /** A called shot at the focus: the shield domes or the bridge, once they can be reached. */
  aim?: 'ship' | 'dome' | 'bridge' | 'generator';
  move?: 'close' | 'hold' | 'open';
  launch?: boolean;
  recall?: boolean;
  mission?: Wing['mission'];
  /** Roll ships whose shown facing is low to a fresh one. */
  roll?: boolean;
  /** Power shares by ship. */
  power?: Readonly<Record<string, PowerShares>>;
  /** Ships fire their own torpedoes and missiles. */
  warheads?: boolean;
  /** Hold the volley for the moment the target's particle shields are down. */
  timed?: boolean;
  holdFire?: boolean;
  /** Ships whose captains retune their shields against ion (or back). */
  retune?: Readonly<Record<string, boolean>>;
}

export interface FleetRound {
  n: number;
  margin: number;
  trackBefore: number;
  trackAfter: number;
  range: RangeBand;
  strike: 'A' | 'B' | null;
  mods: { a: Modifier[]; b: Modifier[] };
  notes: string[];
}

export interface FleetBattle {
  a: FleetSide;
  b: FleetSide;
  track: number;
  range: RangeBand;
  round: number;
  year: number;
  rng: RngState;
  log: FleetRound[];
  end: { winner: 'A' | 'B' | null; reason: 'destroyed' | 'withdrew' | 'time' } | null;
}

export const fleetSide = (name: string, ships: ShipState[], over: Partial<FleetSide> = {}): FleetSide => ({
  name,
  ships,
  wings: [],
  tactics: 50,
  formation: 'exchange',
  reform: null,
  broken: false,
  flagId: ships[0]?.id ?? null,
  leadId: ships[0]?.id ?? null,
  commandLost: 0,
  intel: false,
  modifiers: [],
  mayWithdraw: false,
  withdrawn: false,
  meditation: null,
  shaken: {},
  ...over,
});

/** The wings a ship carries, aboard. */
export function wingsOf(s: ShipState, level: number, mission: Wing['mission'] = 'screen'): Wing[] {
  return shipClass(s.classId).hangar.map((h, i) => ({ id: `${s.id}:w${i}`, classId: h.classId, count: h.count, level, state: 'aboard' as const, mission: shipClass(h.classId).role === 'bomber' ? ('strike' as const) : mission, warheads: warheadLoad(h.classId), from: s.id }));
}
export const warheadLoad = (classId: string): number => shipClass(classId).weapons.reduce((t, m) => t + (m.ammo ?? 0) * mountCount(m), 0);

export const startFleet = (a: FleetSide, b: FleetSide, rng: RngState, opts: { range?: RangeBand; year?: number; track?: number } = {}): FleetBattle => ({ a, b, track: opts.track ?? 0, range: opts.range ?? 'medium', round: 0, year: opts.year ?? -3661, rng, log: [], end: null });

// ---- strength and formation ----

/** What a ship is still worth: its pools, nothing when it is out of the fight. */
export function shipStrength(s: ShipState): number {
  if (!inFight(s)) return 0;
  return Object.values(s.shields).reduce((t, n) => t + n, 0) + Math.max(0, s.hull);
}
export const fullStrength = (s: ShipState): number => totalShields(shipClass(s.classId)) + shipClass(s.classId).hull;
export const sideStrength = (f: FleetSide): number => f.ships.reduce((t, s) => t + shipStrength(s), 0);

export const formationNow = (f: FleetSide): Formation => (f.broken ? 'brawl' : f.formation);
export function formationMatchup(mine: Formation, theirs: Formation): number {
  return FORMATION_BEATS[mine].includes(theirs) ? FLEET.matchup : FORMATION_BEATS[theirs].includes(mine) ? -FLEET.matchup : 0;
}
/** Two formations where neither holds its shape: the luck of a melee. */
export const isBrawl = (b: Pick<FleetBattle, 'a' | 'b'>): boolean => formationNow(b.a) === 'brawl' || formationNow(b.b) === 'brawl';

const crewLevel = (f: FleetSide): number => {
  const live = f.ships.filter(inFight);
  const w = live.reduce((t, s) => t + fullStrength(s), 0);
  return w > 0 ? live.reduce((t, s) => t + s.crew.gunnery * fullStrength(s), 0) / w : 0;
};

/** The commander's modifiers this round. */
export function commandMods(me: FleetSide, them: FleetSide): Modifier[] {
  const out: Modifier[] = [];
  const add = (source: string, value: number): void => {
    if (value !== 0) out.push({ source, value });
  };
  if (me.reform) {
    add('reforming', FLEET.reformPenalty);
    if (me.reform.gaps) add('gaps in the line', FLEET.gapsPenalty);
  } else add(`formation: ${FORMATION_LABEL[formationNow(me)]}`, formationMatchup(formationNow(me), them.reform ? 'brawl' : formationNow(them)));
  if (me.intel) add('the enemy formation is known', FLEET.intel);
  add('crews', Math.round(interp(FLEET.crew, crewLevel(me)) * 10) / 10);
  if (me.commandLost > 0) add('the flagship is lost', FLEET.commandLost);
  if (me.meditation?.alive) add('battle meditation', Math.round(interp(FLEET.meditation, me.meditation.level) * 10) / 10);
  if (me.insight) add('cultural insight', Math.min(2, Math.max(0, me.insight)));
  return [...out, ...me.modifiers];
}

/** A change of formation: planned ones are free; the rest take one round on a good Tactics roll, else two, with gaps. */
export function changeFormation(f: FleetSide, to: Formation, rng: RngState): [FleetSide, RngState, string | null] {
  if (to === f.formation && !f.broken) return [f, rng, null];
  if (!f.broken && !f.reform && PLANNED_CHANGES[f.formation]?.includes(to)) return [{ ...f, formation: to }, rng, `${f.name} turn the ${FORMATION_LABEL[f.formation].toLowerCase()} into ${FORMATION_LABEL[to].toLowerCase()}`];
  const [roll, r] = basicRoll(rng, f.tactics, []);
  const good = roll.total >= FLEET.reformDc;
  return [{ ...f, formation: to, broken: false, reform: { rounds: good ? 1 : 2, gaps: !good } }, r, `${f.name} reform: ${FORMATION_LABEL[to].toLowerCase()}${good ? '' : ', with gaps'}`];
}

// ---- fire ----

/** Who a ship fires at: the focus if it stands, else one enemy each, the largest first. */
function targetOf(i: number, enemies: readonly ShipState[], focus: string | null | undefined): ShipState | null {
  const live = enemies.filter(inFight);
  if (live.length === 0) return null;
  const f = focus ? live.find((s) => s.id === focus) : undefined;
  return f ?? [...live].sort((x, y) => shipStrength(y) - shipStrength(x))[i % live.length]!;
}

interface Landed {
  target: string;
  facing: Facing;
  energy: number;
  turbolaser: number;
  ion: number;
  /** Warhead damage on its way, and how many: the target's point defence takes its share as they come in. */
  warheads: number;
  count: number;
  timed: boolean;
  tower: 'dome' | 'bridge' | null;
  /** Aimed at the generators: hull damage goes to them first. */
  generators: boolean;
}

const shownFacing = (s: ShipState, rolled: boolean, range: RangeBand): Facing => (rolled ? freshest(s) : bestAspect(shipClass(s.classId), range) === 'bow' ? 'fore' : 'port');

/** Guns of a ship now: crippled and bridgeless ships fire little; rolling costs guns. */
const gunsNow = (s: ShipState, rolling: boolean, shaken = false): number => (!canAct(s) ? 0 : (shaken ? FLEET.meditatorCheck.shaken : 1) * (rolling ? FLEET.rolled : 1) * (shipClass(s.classId).domes > 0 && s.bridge <= 0 ? 0.2 : damageState(s) === 'crippled' ? 0.5 : 1));

/** Whether a ship rolls this round: its shown facing is well under the freshest one. */
const wantsRoll = (s: ShipState, o: FleetOrders, range: RangeBand): boolean => o.roll === true && canAct(s) && (s.shields[shownFacing(s, false, range)] ?? 0) < FLEET.rollAt * (s.shields[freshest(s)] ?? 0);

/** Everything a side's ships land this round. */
function sideFire(me: FleetSide, them: FleetSide, o: FleetOrders, theirs: FleetOrders, b: FleetBattle, landing: number, strike: number): { hits: Landed[]; spent: Map<string, Record<number, number>> } {
  const hits: Landed[] = [];
  const spent = new Map<string, Record<number, number>>();
  if (o.holdFire) return { hits, spent };
  const enemies = them.ships.filter(inFight);
  const pincer = !me.reform && formationNow(me) === 'pincer';
  me.ships.forEach((s, i) => {
    const guns = gunsNow(s, wantsRoll(s, o, b.range), (me.shaken[s.id] ?? 0) > 0);
    const target = targetOf(i, enemies, o.focus);
    if (guns <= 0 || !target) return;
    const c = shipClass(s.classId);
    const others = enemies.filter((e) => e.id !== target.id);
    const share = landing * guns * FLEET.range[b.range] * (b.range === 'long' && c.longTargeting ? FLEET.longTargeting : 1) * (c.wedge && b.range === 'close' ? FLEET.wedgeClose : 1);
    const shoot = (to: ShipState, arcs: ReturnType<typeof bearing>, x: number, main: boolean, portion = 1): void => {
      const tc = shipClass(to.classId);
      const v = volleyOf(s, arcs, b.range, targetSize(tc), (w) => TRACKING_FACTOR[w.tracking][targetSize(tc)], o.warheads === true);
      let warheads = 0;
      for (const wh of v.warheads) {
        warheads += wh.count * wh.damage;
        const row = spent.get(s.id) ?? {};
        row[wh.mount] = (row[wh.mount] ?? 0) + wh.count;
        spent.set(s.id, row);
      }
      const count = v.warheads.reduce((t, wh) => t + wh.count, 0);
      const tower = main && (o.aim === 'dome' || o.aim === 'bridge') && towerExposed(to) && (o.aim === 'dome' || bridgeExposed(to)) ? o.aim : null;
      const base = shownFacing(to, wantsRoll(to, theirs, b.range), b.range);
      const split: [Facing, number][] = pincer ? [[base, 1 - FLEET.pincerAft], ['aft', FLEET.pincerAft]] : [[base, 1]];
      for (const [facing, part] of split) hits.push({ target: to.id, facing, energy: v.energy * x * part, turbolaser: v.turbolaser * x * part, ion: v.ion * x * part, warheads: warheads * FLEET.shipWarheads * part * portion, count: count * part * portion, timed: o.timed === true && to.particleDown, tower, generators: main && o.aim === 'generator' });
    };
    const focused = o.focus !== undefined && o.focus === target.id;
    const x = share * (focused ? strike * FLEET.focus : 1 + (strike - 1) * FLEET.spreadStrike);
    if (c.allRound && others.length > 0) {
      shoot(target, ['fore', 'port', 'all'], x, true);
      shoot([...others].sort((p, q) => shipStrength(q) - shipStrength(p))[i % others.length]!, ['aft', 'starboard'], share, false);
    } else {
      const arcs = bearing(c, bestAspect(c, b.range));
      const all = volleyOf(s, arcs, b.range, 'capital', () => 1);
      const n = o.focus ? 1 : clamp(Math.floor(((all.energy + all.turbolaser) * x) / Math.max(1, shipStrength(target))), 1, Math.min(FLEET.spread, enemies.length));
      for (const to of [target, ...[...others].sort((p, q) => shipStrength(q) - shipStrength(p))].slice(0, n)) shoot(to, arcs, x / n, to.id === target.id, 1 / n);
    }
  });
  return { hits, spent };
}

function land(f: FleetSide, hits: readonly Landed[], year: number, rng: RngState, notes: string[]): [FleetSide, RngState] {
  let next = rng;
  const ships = f.ships.map((before) => {
    let s = before;
    const mine = hits.filter((h) => h.target === before.id);
    const incoming = mine.reduce((t, h) => t + h.count, 0);
    const pd = canAct(before) ? pointDefenceOf(before) : 0;
    const through = incoming > 0 ? 1 - pd / (pd + FLEET.warheadIntercept * incoming) : 0;
    for (const raw of mine) {
      const h = { ...raw, warheads: raw.warheads * through };
      if (h.tower) {
        const towerDamage = h.energy + h.turbolaser + h.warheads;
        const was = s;
        // Most of a called volley still strikes the ship around the tower.
        s = hitTower(s, h.tower, towerDamage * 0.25);
        if (s.domes < was.domes) notes.push(`${s.name} loses a shield dome`);
        if (was.bridge > 0 && s.bridge <= 0) notes.push(`${s.name}'s bridge is destroyed`);
      }
      const rest = h.tower ? 0.75 : 1;
      const parts: { damage: number; kind: 'energy' | 'ion' | 'warhead'; turbolaser?: boolean }[] = [
        { damage: h.ion * rest, kind: 'ion' },
        { damage: h.turbolaser * rest, kind: 'energy', turbolaser: true },
        { damage: h.energy * rest, kind: 'energy' },
        { damage: h.warheads * rest, kind: 'warhead' },
      ];
      for (const p of parts) {
        if (p.damage <= 0) continue;
        const r = applyFire(s, { ...p, facing: h.facing, timed: h.timed }, year);
        s = r.ship;
        if (r.burnt) notes.push(`${s.name}: the ${h.facing} shield projector burns out`);
        if (r.disabled) notes.push(`${s.name} is disabled by ion fire`);
        if (h.generators && r.toHull > 0 && s.hull > 0) {
          const c = shipClass(s.classId);
          const [u, r2] = nextFloat(next);
          next = r2;
          if (u < clamp((r.toHull / c.hull) * 10, 0, 0.9)) {
            [s, , next] = hitSystem(s, 'disabled', next, 'generator');
            notes.push(`${s.name}: a shield generator is hit`);
          }
        }
      }
    }
    return s;
  });
  // Systems from hull lost this round, then the hulks.
  const settled = ships.map((s, i) => {
    const was = f.ships[i]!;
    const c = shipClass(s.classId);
    const lost = Math.max(0, was.hull - s.hull);
    let t = s;
    if (lost > 0 && t.hull > 0) {
      const [u, r] = nextFloat(next);
      next = r;
      if (u < clamp((lost / c.hull) * SYSTEM_HIT_PER_HULL, 0, 0.9)) {
        const [hit, sys, r2] = hitSystem(t, 'damaged', next);
        t = hit;
        next = r2;
        notes.push(`${t.name}: ${sys} hit`);
      }
    }
    // Ion that is not enough to kill the ship still takes a system off line.
    const ion = t.ion / ionTolerance(c);
    if (t.ion > was.ion && ion >= ION.systemAt && t.hull > 0) {
      const [u, r] = nextFloat(next);
      next = r;
      if (u < clamp(ion, 0, 0.9)) {
        const [hit, sys, r2] = hitSystem(t, 'disabled', next);
        t = systemState(was, sys) === 'working' ? hit : t;
        next = r2;
        if (t === hit) notes.push(`${t.name}: ${sys} off line (ion)`);
      }
    }
    if (was.hull > 0 && t.hull <= 0) notes.push(`${t.name} is crippled, without hull`);
    const [x, r3] = settleHull(t, next);
    next = r3;
    if (!was.destroyed && x.destroyed) notes.push(`${x.name} is destroyed`);
    return x;
  });
  return [{ ...f, ships: settled }, next];
}

// ---- fighters ----

const fighterFire = (classId: string): number => {
  const c = shipClass(classId);
  return c.weapons.reduce((t, m) => {
    const w = SHIP_WEAPON.get(m.weapon)!;
    return t + (w.kind === 'warhead' ? 0 : mountCount(m) * m.barrels * w.damage);
  }, 0) * (1 + c.handling * 0.06);
};
const fighterLasersOnCapital = (classId: string): number => shipClass(classId).weapons.reduce((t, m) => {
  const w = SHIP_WEAPON.get(m.weapon)!;
  return t + (w.kind === 'energy' ? mountCount(m) * m.barrels * w.damage * (w.vsCapital ?? 1) : 0);
}, 0);
export const fighterToughness = (classId: string): number => {
  const c = shipClass(classId);
  return (totalShields(c) * 0.75 + c.hull) * (1 + c.handling * 0.06);
};
const skill = (level: number): number => 0.5 + level / 100;
const wingWarhead = (classId: string): number => shipClass(classId).weapons.reduce((t, m) => Math.max(t, SHIP_WEAPON.get(m.weapon)!.kind === 'warhead' ? SHIP_WEAPON.get(m.weapon)!.damage : 0), 0);

/** One round of fighters: they kill each other, point defence kills the strike, and what gets through strikes a ship. */
function fighterRound(me: FleetSide, them: FleetSide, o: FleetOrders, theirMargin: number): { strike: Landed[]; mine: Wing[]; kills: number } {
  const out = me.wings.filter((x) => x.state === 'out' && x.count > 0);
  const foes = them.wings.filter((x) => x.state === 'out' && x.count > 0);
  // Losses to enemy fighters, then to point defence.
  const fire = foes.reduce((t, x) => t + x.count * fighterFire(x.classId) * skill(x.level) * (x.mission === 'strike' ? 0.4 : 1), 0) * FLEET.fighterKill * (interp(FLEET.landing, theirMargin) / interp(FLEET.landing, 0));
  const total = out.reduce((t, x) => t + x.count, 0);
  const pd = them.ships.filter(canAct).reduce((t, s) => t + pointDefenceOf(s), 0);
  const strikers = out.filter((x) => x.mission === 'strike').reduce((t, x) => t + x.count, 0);
  const foesScreen = foes.filter((x) => x.mission === 'screen').reduce((t, x) => t + x.count, 0);
  const held = strikers > 0 ? clamp((foesScreen / strikers) * FLEET.screenHolds, 0, 0.9) : 0;
  let kills = 0;
  const mine = me.wings.map((x) => {
    if (x.state !== 'out' || x.count <= 0) return x;
    const tough = fighterToughness(x.classId) * skill(x.level);
    const a = (fire * (x.count / Math.max(1, total))) / tough;
    const p = x.mission === 'strike' ? (pd * FLEET.pdKill * (x.count / Math.max(1, strikers))) / tough : 0;
    const lost = Math.min(x.count, Math.round((a + p) * 10) / 10);
    kills += lost;
    return { ...x, count: Math.max(0, x.count - lost) };
  });
  const strike: Landed[] = [];
  const after = mine.map((x, i) => {
    const target = targetOf(i, them.ships, o.focus);
    if (!target || x.state !== 'out' || x.mission !== 'strike' || x.count <= 0) return x;
    const at = x.count * (1 - held);
    const load = Math.min(x.warheads, FLEET.warheadsPerFighter);
    const sent = at * load;
    const tower = (o.aim === 'dome' || o.aim === 'bridge') && towerExposed(target) && (o.aim === 'dome' || bridgeExposed(target)) ? o.aim : null;
    // Fighters go for the weakest facing (the nova flare; the captain's answer is to roll).
    const faces = Object.keys(target.shields) as Facing[];
    const facing = faces.reduce((w, f) => ((target.shields[f] ?? 0) < (target.shields[w] ?? 0) ? f : w), faces[0]!);
    strike.push({ target: target.id, facing, energy: at * fighterLasersOnCapital(x.classId) * skill(x.level) * FLEET.fighterGuns, turbolaser: 0, ion: 0, warheads: sent * wingWarhead(x.classId) * FLEET.fighterWarheads * skill(x.level), count: sent, timed: o.timed === true && target.particleDown, tower, generators: o.aim === 'generator' });
    return { ...x, warheads: x.warheads - load };
  });
  return { strike, mine: after, kills };
}

// ---- the round ----

const shift = (r: RangeBand, by: number): RangeBand => RANGE_BANDS[clamp(RANGE_BANDS.indexOf(r) + by, 0, 2)]!;
const speedOf = (f: FleetSide): number => {
  const live = f.ships.filter(canAct);
  return live.length ? live.reduce((t, s) => t + shipClass(s.classId).speed * systemFactor(s, 'engines') + (s.power.engines - POWER_EVEN.engines) * FLEET.enginePower, 0) / live.length : 0;
};

function prepare(f: FleetSide, o: FleetOrders, rng: RngState, notes: string[]): [FleetSide, RngState] {
  let side = f;
  let next = rng;
  if (o.change) {
    const [s, r, note] = changeFormation(side, o.change, next);
    side = s;
    next = r;
    if (note) notes.push(note);
  }
  const launching = new Set<string>();
  const room = new Map(side.ships.map((s) => [s.id, Math.max(FLEET.launch.least, Math.round((shipClass(s.classId).lengthM ?? 0) * FLEET.launch.perMetre))]));
  const wings = side.wings.flatMap((x): Wing[] => {
    const home = x.from === null ? null : side.ships.find((s) => s.id === x.from);
    if (x.state === 'launching') return [{ ...x, state: 'out' }];
    if (o.recall && x.state === 'out' && (home === null || (home && inFight(home)))) return [{ ...x, state: 'aboard', warheads: warheadLoad(x.classId) }];
    if (o.launch && x.state === 'aboard' && x.count > 0 && home && canAct(home)) {
      // A hangar gets so many away in a round; the rest wait.
      const go = Math.min(x.count, room.get(home.id) ?? 0);
      if (go <= 0) return [x];
      room.set(home.id, (room.get(home.id) ?? 0) - go);
      launching.add(home.id);
      const away: Wing = { ...x, id: `${x.id}.${side.wings.length}`, count: go, state: 'launching', mission: o.mission ?? x.mission };
      return go < x.count ? [away, { ...x, count: x.count - go }] : [{ ...away, id: x.id }];
    }
    return [o.mission && x.state === 'out' ? { ...x, mission: shipClass(x.classId).role === 'bomber' ? 'strike' : o.mission } : x];
  });
  const ships = side.ships.map((s) => {
    const shares = o.power?.[s.id];
    let t = shares ? setPower(s, shares) : s;
    if (o.retune?.[s.id] !== undefined) t = { ...t, retuned: o.retune[s.id]! };
    const fires = o.warheads === true && !o.holdFire && Object.values(t.ammo).some((n) => n > 0);
    return launching.has(s.id) || fires ? { ...t, particleDown: true } : t;
  });
  return [{ ...side, wings, ships }, next];
}

/** A ship that can still lead: in the fight, its bridge whole. */
const leads = (f: FleetSide, id: string | null): boolean => f.ships.some((s) => s.id === id && inFight(s) && !(shipClass(s.classId).domes > 0 && s.bridge <= 0));
const keyShipsLost = (before: FleetSide, after: FleetSide): 'the flagship' | 'the lead ship of the slash' | null => {
  const fell = (id: string | null): boolean => id !== null && leads(before, id) && !leads(after, id);
  return fell(before.flagId) ? 'the flagship' : formationNow(before) === 'slash' && fell(before.leadId) ? 'the lead ship of the slash' : null;
};

function settleSide(before: FleetSide, after: FleetSide, o: FleetOrders, year: number, notes: string[], rng: RngState): [FleetSide, RngState] {
  let f = after;
  const lost = keyShipsLost(before, f);
  const s0 = sideStrength(before);
  const heavy = s0 > 0 && (s0 - sideStrength(f)) / s0 >= FLEET.heavyLossRound && before.ships.length > 1;
  if ((lost || heavy) && !f.broken && before.ships.length > 1) {
    f = { ...f, broken: true, reform: null };
    notes.push(`${f.name} break formation (${lost ?? 'heavy losses'})`);
  }
  if (lost === 'the flagship') f = { ...f, commandLost: FLEET.commandLostRounds, flagId: f.ships.filter(inFight).sort((x, y) => shipStrength(y) - shipStrength(x))[0]?.id ?? null };
  else if (f.commandLost > 0) f = { ...f, commandLost: f.commandLost - 1 };
  // This round counts: a one-round reform is done when it ends.
  f = { ...f, shaken: Object.fromEntries(Object.entries(f.shaken).filter(([, n]) => n > 1).map(([k, n]) => [k, n - 1])) };
  if (f.reform) f = { ...f, reform: f.reform.rounds <= 1 ? null : { ...f.reform, rounds: f.reform.rounds - 1 } };
  let next = rng;
  const ships = f.ships.map((s) => {
    if (s.destroyed) return s;
    const t = passMinutes(s, ROUND_MINUTES, year, o.holdFire !== true);
    // Damage control works on one system a round.
    const sys = SHIP_REPAIR_ORDER.find((x) => systemState(t, x) === 'disabled') ?? SHIP_REPAIR_ORDER.find((x) => systemState(t, x) === 'damaged');
    if (!sys || t.hull <= 0 || t.crew.repair <= 0) return t;
    const [roll, r] = basicRoll(next, t.crew.repair, []);
    next = r;
    return roll.total >= REPAIR_DC ? patchSystem(t, sys) : t;
  });
  return [{ ...f, ships }, next];
}

export function fleetRound(b: FleetBattle, oa: FleetOrders = {}, ob: FleetOrders = {}): FleetBattle {
  if (b.end) return b;
  const notes: string[] = [];
  let rng = b.rng;
  const [a, ra] = prepare(b.a, oa, rng, notes);
  const [c, rc] = prepare(b.b, ob, ra, notes);
  rng = rc;
  const battle: FleetBattle = { ...b, a, b: c };
  // 1. Tactics.
  const modsA = commandMods(a, c);
  const modsB = commandMods(c, a);
  const [roll, r1] = contest(rng, { level: a.tactics, modifiers: modsA }, { level: c.tactics, modifiers: modsB });
  rng = r1;
  let margin = roll.margin;
  if (isBrawl(battle)) {
    const [luck, r] = nextInt(rng, -FLEET.brawlSwing, FLEET.brawlSwing);
    rng = r;
    margin += luck;
  }
  // 2. Range.
  const want = { close: -1, hold: 0, open: 1 } as const;
  const wa = want[oa.move ?? 'hold'];
  const wb = want[ob.move ?? 'hold'];
  const faster = speedOf(a) - speedOf(c) + margin / 3;
  // The faster side has the range it wants; a good Tactics margin makes up for some speed.
  const by = wa === wb || faster > 0 ? wa : wb;
  battle.range = shift(b.range, by);
  // 3. The track, or the strike.
  const side = striker(b.track);
  const sm = side ? strikeMargin(side, margin) : 0;
  const landed = side !== null && strikeLands(sm);
  const track = side ? afterStrike(b.track, landed) : moveTrack(b.track, margin);
  const mult = landed ? interp(FLEET.strike, sm) : 1;
  // 4. Fire, both sides at once.
  const fa = sideFire(a, c, oa, ob, battle, interp(FLEET.landing, margin), side === 'A' ? mult : 1);
  const fb = sideFire(c, a, ob, oa, battle, interp(FLEET.landing, -margin), side === 'B' ? mult : 1);
  const wingsA = fighterRound(a, c, oa, -margin);
  const wingsB = fighterRound(c, a, ob, margin);
  if (landed) notes.push(`${side === 'A' ? a.name : c.name}: the strike lands (margin ${sm}, fire x${mult.toFixed(2)})`);
  const spend = (f: FleetSide, spent: Map<string, Record<number, number>>): FleetSide => ({ ...f, ships: f.ships.map((s) => (spent.has(s.id) ? { ...s, ammo: Object.fromEntries(Object.entries(s.ammo).map(([k, n]) => [k, n - (spent.get(s.id)![Number(k)] ?? 0)])) } : s)) });
  let na = { ...spend(a, fa.spent), wings: wingsA.mine };
  let nb = { ...spend(c, fb.spent), wings: wingsB.mine };
  [na, rng] = land(na, [...fb.hits, ...wingsB.strike], b.year, rng, notes) as [typeof na, RngState];
  [nb, rng] = land(nb, [...fa.hits, ...wingsA.strike], b.year, rng, notes) as [typeof nb, RngState];
  const [ta, rsa] = settleSide(a, na, oa, b.year, notes, rng);
  const [tb, rsb] = settleSide(c, nb, ob, b.year, notes, rsa);
  rng = rsb;
  let sa = ta;
  let sb = tb;
  // Wings whose ship is lost have nowhere to land but fight on; those aboard go with it.
  const orphans = (f: FleetSide): FleetSide => ({ ...f, wings: f.wings.filter((x) => x.state === 'out' || x.from === null || f.ships.some((s) => s.id === x.from && inFight(s))) });
  sa = orphans(sa);
  sb = orphans(sb);
  // 5. Withdrawal and the end.
  const leave = (f: FleetSide, start: number): boolean => f.mayWithdraw && sideStrength(f) < FLEET.withdrawAt * start && f.ships.some(inFight);
  const fullA = sa.ships.reduce((t, s) => t + fullStrength(s), 0);
  const fullB = sb.ships.reduce((t, s) => t + fullStrength(s), 0);
  if (leave(sa, fullA) || (formationNow(sa) === 'withdraw' && battle.range === 'long' && oa.move === 'open')) sa = { ...sa, withdrawn: true };
  if (leave(sb, fullB) || (formationNow(sb) === 'withdraw' && battle.range === 'long' && ob.move === 'open')) sb = { ...sb, withdrawn: true };
  const deadA = !sa.ships.some(inFight);
  const deadB = !sb.ships.some(inFight);
  const end: FleetBattle['end'] =
    deadA || deadB
      ? { winner: deadA && deadB ? null : deadA ? 'B' : 'A', reason: 'destroyed' }
      : sa.withdrawn || sb.withdrawn
        ? { winner: sa.withdrawn && sb.withdrawn ? null : sa.withdrawn ? 'B' : 'A', reason: 'withdrew' }
        : b.round + 1 >= FLEET.maxRounds
          ? { winner: null, reason: 'time' }
          : null;
  const rec: FleetRound = { n: b.round + 1, margin, trackBefore: b.track, trackAfter: track, range: battle.range, strike: landed ? side : null, mods: { a: modsA, b: modsB }, notes };
  return { ...b, a: sa, b: sb, track, range: battle.range, round: b.round + 1, rng, log: [...b.log, rec], end };
}

/**
 * The fleet's battle meditator is killed or broken (D-506): the gift is gone, and every crew checks at once, as a ground army
 * does (Mizra). A shaken crew fires less for two rounds; one that breaks takes its ship out of the fight.
 */
export function loseFleetMeditator(b: FleetBattle, side: 'A' | 'B', how: 'killed' | 'broken' = 'killed'): FleetBattle {
  const me = side === 'A' ? b.a : b.b;
  if (!me.meditation?.alive) return b;
  let rng = b.rng;
  const notes = [`${me.meditation.name} is ${how}: every crew of ${me.name} checks`];
  const shaken: Record<string, number> = { ...me.shaken };
  const ships = me.ships.map((s) => {
    if (!inFight(s)) return s;
    const [roll, r] = basicRoll(rng, s.crew.gunnery, []);
    rng = r;
    const by = roll.total - FLEET.meditatorCheck.dc;
    if (by >= 0) return s;
    if (by > -FLEET.meditatorCheck.routMargin) {
      shaken[s.id] = FLEET.meditatorCheck.shakenRounds;
      notes.push(`${s.name}'s crew is shaken`);
      return s;
    }
    notes.push(`${s.name} breaks off`);
    return { ...s, gone: true };
  });
  const next: FleetSide = { ...me, ships, shaken, meditation: { ...me.meditation, alive: false } };
  const log = b.log.length ? [...b.log.slice(0, -1), { ...b.log[b.log.length - 1]!, notes: [...b.log[b.log.length - 1]!.notes, ...notes] }] : b.log;
  return { ...b, rng, log, [side === 'A' ? 'a' : 'b']: next };
}

/** A commander's own choice, for NPCs: launch, close unless the fleet is carriers, hit the weakest ship that still fights. */
export function autoFleetOrders(b: FleetBattle, side: 'A' | 'B'): FleetOrders {
  const me = side === 'A' ? b.a : b.b;
  const them = side === 'A' ? b.b : b.a;
  const carriers = me.ships.filter((s) => inFight(s) && shipClass(s.classId).role === 'carrier').length;
  const live = them.ships.filter(inFight);
  const focus = [...live].sort((x, y) => shipStrength(x) - shipStrength(y))[0]?.id ?? null;
  return {
    launch: me.wings.some((x) => x.state === 'aboard'),
    move: carriers * 2 > me.ships.filter(inFight).length ? 'open' : me.ships.some((s) => shipClass(s.classId).wedge) ? 'hold' : 'close',
    focus,
    roll: true,
    warheads: true,
    power: Object.fromEntries(me.ships.filter((s) => shipClass(s.classId).gunsMax > GUNS_MAX.ordinary).map((s) => [s.id, FLEET.trueWarshipPower])),
    ...(me.broken ? { change: 'exchange' as const } : {}),
  };
}

export function runFleet(b: FleetBattle, ordersA: (b: FleetBattle) => FleetOrders = (x) => autoFleetOrders(x, 'A'), ordersB: (b: FleetBattle) => FleetOrders = (x) => autoFleetOrders(x, 'B')): FleetBattle {
  let s = b;
  while (!s.end) s = fleetRound(s, ordersA(s), ordersB(s));
  return s;
}

// ---- the battle map (design notes: keyboard symbols, under about 40 characters wide) ----

const SHAPES: Readonly<Record<Formation, readonly number[]>> = {
  exchange: [0, 0, 0, 0, 0],
  capT: [4, 3, 2, 1, 0],
  slash: [0, 2, 4, 2, 0],
  fake: [2, 2, 2, 2, 2],
  brawl: [1, 4, 0, 3, 2],
  pincer: [4, 2, 0, 2, 4],
  screen: [3, 4, 4, 4, 3],
  feignedRetreat: [0, 0, 0, 0, 0],
  withdraw: [0, 0, 0, 0, 0],
};
const GAP: Readonly<Record<RangeBand, number>> = { close: 2, medium: 6, long: 10 };

/** The map as it stands: arrows face the enemy, a letter is a class, a number after it a group, X a destroyed ship. */
export function fleetMap(b: FleetBattle): string {
  const groups = (f: FleetSide): { sign: string; label: string; n: number }[] => {
    const out: { sign: string; label: string; n: number }[] = [];
    for (const s of f.ships) {
      const c = shipClass(s.classId);
      const sign = s.destroyed ? 'X' : s.gone ? '' : c.letter;
      if (!sign) continue;
      const g = out.find((x) => x.sign === sign);
      if (g) g.n += 1;
      else out.push({ sign, label: sign === 'X' ? 'destroyed' : c.name, n: 1 });
    }
    return out;
  };
  const ga = groups(b.a);
  const gb = groups(b.b);
  const rows = Math.max(1, Math.min(5, Math.max(ga.length, gb.length)));
  const first = Math.floor((5 - rows) / 2);
  const cell = (g: { sign: string; n: number } | undefined, right: boolean): string => {
    if (!g) return '';
    const n = g.n > 1 ? String(g.n) : '';
    return g.sign === 'X' ? `X${n}` : right ? `<${g.sign}${n}` : `${g.sign}${n}>`;
  };
  const lines: string[] = [`ROUND ${b.round} · Range: ${b.range.toUpperCase()}`, `${b.a.name.slice(0, 12)} [${FORMATION_LABEL[formationNow(b.a)]}] v ${b.b.name.slice(0, 12)} [${FORMATION_LABEL[formationNow(b.b)]}]`.slice(0, 40), ''];
  for (let r = 0; r < rows; r++) {
    const sa = SHAPES[formationNow(b.a)][first + r] ?? 0;
    const sb = SHAPES[formationNow(b.b)][first + r] ?? 0;
    const left = (' '.repeat(sa) + cell(ga[r], false)).padEnd(10);
    const mid = r === Math.floor(rows / 2) ? '·'.repeat(GAP[b.range]) : ' '.repeat(GAP[b.range]);
    lines.push(`${left}${mid}${' '.repeat(4 - sb)}${cell(gb[r], true)}`.trimEnd());
  }
  lines.push('');
  for (const [right, list] of [[false, ga], [true, gb]] as const) for (const g of list) lines.push(`${cell({ ...g, n: 1 }, right)} ${g.label} x${g.n}`.slice(0, 40));
  return lines.join('\n');
}
