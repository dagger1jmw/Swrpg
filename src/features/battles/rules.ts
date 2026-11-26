// Ship battles in play (m8-ship-battles, D-517; docs-v2/spec/ship-battles.md): the battle as the player plays it, on the
// combat-scales engines (D-505). One battle at a time: a dogfight (the player flies or crews a fighter or freighter, one enemy
// at a time, the rest waiting), or a fleet battle (the player commands, flies in it, or serves aboard). The code decides every
// position, hit and result; the narrator describes the lines built here. Pure; seeded RNG; no DOM.
import { autoRunOrders, breakOffRun, runApproach, runTurn, startRun, type AttackRun, type RunApproach, type RunOrders } from '../../engine/attackRun';
import { autoDogOrders, breakOff, dogfightModifier, dogfightTurn, flown, positionOf, startDogfight, type DogOrders, type Dogfight, type Flyer } from '../../engine/dogfight';
import { autoFleetOrders, changeFormation, fleetMap, fleetRound, formationMatchup, formationNow, fullStrength, shipStrength, sideStrength, type FleetBattle, type FleetOrders, type FleetSide } from '../../engine/fleetBattle';
import { canAct, damageState, inFight, isSmallKind, newShip, shipClass, systemState, type Crew, type ShipState } from '../../engine/ships';
import { nextFloat, type RngState } from '../../engine/rng';
import { basicRoll } from '../../engine/rolls';
import {
  ATTACK_RUN,
  BOARDING,
  EARLY_EVACUATION_SIDES,
  EVACUATION,
  GENERIC_CREW,
  MANOEUVRE_WEAK,
  NARRATION,
  SURRENDER,
  TURNS_PER_FLEET_ROUND,
  type BattleEnd,
  type BattleRole,
  type BattleTrigger,
} from '../../data/shipBattles.config';
import { BREAK_UP, DOGFIGHT, FLEET, FORMATIONS, FORMATION_BEATS, FORMATION_LABEL, MANOEUVRE, MANOEUVRES, PLANNED_CHANGES, REPAIR_DC, ROUND_MINUTES, TURN_SECONDS, type Formation, type Manoeuvre, type ShipSystem } from '../../data/shipCombat.config';
import type { Facing } from '../../data/ships';
import { COMMAND_BASICS } from '../../data/tactics';

// ---- the battle ----

export interface Commander {
  name: string;
  npcId: string | null;
  tactics: number;
  traits: readonly string[];
  /** A Jedi in command leaves it when the ship is boarded (Jared, 26 Nov 2026). */
  jedi: boolean;
}

export interface SideInfo {
  name: string;
  /** The faction as the world reads it (republic, sithEmpire, sith, jediOrder, mandalorians, underworld, ...). */
  faction: string;
  /** The kind of fleet (data/shipBattles.config GENERIC_CREW keys). */
  kind: string;
  commander: Commander;
  firstOfficer: { name: string; tactics: number };
  /** The commander has left the flagship (an early evacuation, a boarding, or out of the fight). */
  commanderGone: boolean;
}

export interface QueuedFighter {
  classId: string;
  name: string;
  crew: Crew;
  /** The enemy wing it came from, in a fleet battle. */
  wingId?: string;
}

export interface Boarding {
  shipId: string;
  /** The side whose ship is boarded. */
  ofSide: 'player' | 'enemy';
  /** Fighting through the ship (hidden rolls each round) or a personal fight the player is in. */
  stage: 'through' | 'personal';
  rounds: number;
  /** The player leads it, or is caught in it: a personal fight (combat feature). */
  personal: boolean;
  fightId: string | null;
  troops: { kind: string; count: number };
}

export interface BattleXp {
  /** The player's own shots: margins (m8-skills gunneryXp). */
  gunnery: number[];
  /** The player's piloting rolls: the opponent's level less the player's (field use, combat XP's exchange rule). */
  piloting: number[];
  /** Repairs the player made with their own Repair. */
  repairs: { success: boolean }[];
}

export interface BattleTally {
  destroyed: { player: string[]; enemy: string[] };
  captured: { player: string[]; enemy: string[] };
  evacuated: { player: string[]; enemy: string[] };
  /** Fighters downed, by side. */
  fighters: { player: number; enemy: number };
}

export interface Battle {
  id: string;
  kind: 'dogfight' | 'fleet';
  role: BattleRole;
  trigger: BattleTrigger;
  stakes: 'serious' | 'lethal';
  placeId: string | null;
  placeName: string;
  year: number;
  player: SideInfo;
  enemy: SideInfo;
  /** The player's ship: their fighter or freighter, or the capital ship they are aboard. */
  ownShipId: string;
  /** Freighter crew and wingmen on the player's flyer (dogfights). */
  flyer: { wingman: boolean; forceOrDroid: boolean; engineer: boolean; gunners: number[]; repairBy: 'player' | 'droid' | 'crew' | null; mods?: { source: string; value: number }[] };
  dog: Dogfight | null;
  run: AttackRun | null;
  queue: QueuedFighter[];
  kills: number;
  beaten: boolean;
  turnsThisRound: number;
  fleet: FleetBattle | null;
  /** Who gives the player's side its orders. */
  command: 'player' | 'npc' | 'firstOfficer';
  auto: boolean;
  boarding: Boarding | null;
  /** The player's part is over (lost fighter, evacuated, captured, left early): the rest resolves under the NPC commander. */
  out: boolean;
  /** The player left a crew to fight on (a Sith or Imperial choice). */
  leftCrew: boolean;
  /**
   * How the player's part ended (m8-ship-life Part A3-A4, D-518): abandoned a ship, ejected from a fighter shot down, a fighter
   * or freighter disabled and drifting, left early, back to the hangar, or taken in a boarding. Who holds the field decides what
   * becomes of the first four (picked up, or capture or escape). Absent in battles saved before it.
   */
  left?: 'abandoned' | 'ejected' | 'disabled' | 'evacuatedEarly' | 'returned' | 'captured';
  /** The ships each side's commander began aboard (a named NPC aboard a ship lost rolls to survive; D-518). */
  flagAtStart?: { player: string | null; enemy: string | null };
  /**
   * Tactics as knowledge (m8-ship-life part G, D-519): what the player knows (the menu offers only these) and recognises (known
   * or seen: the +1 of a known enemy formation), what the enemy's pilots and commanders know, and what each side was seen to
   * use (recorded at the end). Absent in battles saved before it: everything open, as before.
   */
  tactics?: { known: string[]; recognised: string[] };
  enemyTactics?: string[];
  seenUsed?: { enemy: string[]; ally: string[] };
  xp: BattleXp;
  tally: BattleTally;
  /** Code-written lines, newest last. */
  log: string[];
  map: string | null;
  mapSig: string;
  seconds: number;
  turn: number;
  end: { winner: 'player' | 'enemy' | null; reason: BattleEnd } | null;
  blockade?: { id: string; to: string; direction: 'in' | 'out' | 'through' };
  /** A standing force the battle is against (an occupation's armada). */
  forceId?: string;
}

/** The player's orders for one turn or round (the tactics menu's picks). */
export interface BattleOrders {
  manoeuvre?: Manoeuvre;
  boost?: 'lasers' | 'shields' | 'engines';
  weaken?: 'lasers' | 'shields' | 'engines';
  angle?: 'even' | 'front' | 'back';
  shot?: 'guns' | 'ion' | 'torpedo' | 'none';
  snap?: boolean;
  repair?: ShipSystem;
  /** A pilot in a fleet: the next engagement (an enemy wing, or an attack run on a ship). */
  engage?: { wingId?: string; shipId?: string };
  approach?: RunApproach;
  facing?: Facing;
  aim?: 'ship' | 'dome' | 'bridge' | 'generator' | RunOrders['aim'];
  formation?: Formation;
  focus?: string | null;
  move?: 'close' | 'hold' | 'open';
  launch?: boolean;
  recall?: boolean;
  mission?: 'screen' | 'strike';
  roll?: boolean;
  warheads?: boolean;
  holdFire?: boolean;
  board?: string;
  leadBoarding?: boolean;
  breakOff?: boolean;
  withdraw?: boolean;
  surrender?: boolean;
  evacuateEarly?: boolean;
  returnToHangar?: boolean;
}

export interface StepCtx {
  /** The troops a side sends across, by faction and year (a minion kind). */
  troopsFor(faction: string): string;
  /** The player is a Jedi (leaves command at a boarding). */
  playerJedi: boolean;
}

export interface Handoff {
  /** The player's ship boarded (repel) or the player leading a boarding (take). */
  purpose: 'repel' | 'take';
  shipName: string;
  troops: { kind: string; count: number };
  /** The bridge itself (a commander's boarded ship). */
  bridge: boolean;
}

export interface StepResult {
  battle: Battle;
  /** A line or two for this choice (code-written). */
  lines: string[];
  /** The big moments (a shot lands, a ship destroyed, a formation breaks, the flagship falls, a boarding): the narrator. */
  big: string[];
  handoff: Handoff | null;
  /** A hazard to the player (a lost fighter, last off a hulk). */
  hazard: { severity: number; cause: string } | null;
  /** Seconds this step took. */
  seconds: number;
}

const EARLY = (faction: string): boolean => EARLY_EVACUATION_SIDES.includes(faction);
const clip = (lines: string[]): string[] => lines.slice(-NARRATION.logKept);
const emptyTally = (): BattleTally => ({ destroyed: { player: [], enemy: [] }, captured: { player: [], enemy: [] }, evacuated: { player: [], enemy: [] }, fighters: { player: 0, enemy: 0 } });

export interface BattleSetup {
  id: string;
  kind: 'dogfight' | 'fleet';
  role: BattleRole;
  trigger: BattleTrigger;
  stakes: 'serious' | 'lethal';
  placeId: string | null;
  placeName: string;
  year: number;
  player: Omit<SideInfo, 'commanderGone'>;
  enemy: Omit<SideInfo, 'commanderGone'>;
  /** Dogfight: the player's flyer and the enemies in order. Fleet: the two fleets' ships, the player's own first or named. */
  playerShips: ShipState[];
  enemyShips: ShipState[];
  ownShipId: string;
  flyer?: Partial<Battle['flyer']>;
  playerWings?: FleetSide['wings'];
  enemyWings?: FleetSide['wings'];
  playerFormation?: Formation;
  enemyFormation?: Formation;
  rng: RngState;
  blockade?: Battle['blockade'];
  forceId?: string;
  /** The player commands (rank, or the story handed it). */
  playerCommands: boolean;
}

/** A battle built from a checked setup. An ambush starts the ambusher ahead. */
export function buildBattle(s: BattleSetup): Battle {
  const ambush = s.trigger === 'ambush' ? -2 : 0;
  const base = {
    id: s.id,
    kind: s.kind,
    role: s.role,
    trigger: s.trigger,
    stakes: s.stakes,
    placeId: s.placeId,
    placeName: s.placeName,
    year: s.year,
    player: { ...s.player, commanderGone: false },
    enemy: { ...s.enemy, commanderGone: false },
    ownShipId: s.ownShipId,
    flyer: { wingman: false, forceOrDroid: false, engineer: false, gunners: [], repairBy: null, ...s.flyer },
    run: null,
    kills: 0,
    beaten: false,
    turnsThisRound: 0,
    command: s.playerCommands ? ('player' as const) : ('npc' as const),
    auto: false,
    boarding: null,
    out: false,
    leftCrew: false,
    xp: { gunnery: [], piloting: [], repairs: [] },
    tally: emptyTally(),
    log: [],
    map: null,
    mapSig: '',
    seconds: 0,
    turn: 0,
    end: null,
    ...(s.blockade ? { blockade: s.blockade } : {}),
    ...(s.forceId ? { forceId: s.forceId } : {}),
  };
  if (s.kind === 'dogfight') {
    const own = s.playerShips.find((x) => x.id === s.ownShipId) ?? s.playerShips[0]!;
    const [first, ...rest] = s.enemyShips;
    const b: Battle = {
      ...base,
      fleet: null,
      queue: rest.map((x) => ({ classId: x.classId, name: x.name, crew: x.crew })),
      dog: startDogfight(flyerOf(base.flyer, own), { ship: first! }, s.rng, { range: s.trigger === 'ambush' ? 'close' : 'medium', track: ambush, year: s.year }),
      flagAtStart: { player: own.id, enemy: null },
    };
    return redraw(b);
  }
  // An NPC commander may withdraw a beaten side; a player in command withdraws only by order.
  const a = fleetSideOf(s.player, s.playerShips, s.playerWings ?? [], s.playerFormation ?? 'exchange', !s.playerCommands);
  const e = fleetSideOf(s.enemy, s.enemyShips, s.enemyWings ?? [], s.enemyFormation ?? 'exchange', true);
  const fleet: FleetBattle = { a: { ...a, intel: s.trigger !== 'ambush' && a.intel }, b: { ...e, intel: s.trigger === 'ambush' }, track: ambush, range: s.trigger === 'ambush' ? 'close' : 'medium', round: 0, year: s.year, rng: s.rng, log: [], end: null };
  return redraw({ ...base, fleet, dog: null, queue: [], flagAtStart: { player: s.playerCommands ? s.ownShipId : a.flagId, enemy: e.flagId } });
}

function fleetSideOf(info: Omit<SideInfo, 'commanderGone'>, ships: ShipState[], wings: FleetSide['wings'], formation: Formation, mayWithdraw: boolean): FleetSide {
  return {
    name: info.name,
    ships,
    wings,
    tactics: info.commander.tactics,
    formation,
    reform: null,
    broken: false,
    flagId: ships[0]?.id ?? null,
    leadId: ships[0]?.id ?? null,
    commandLost: 0,
    intel: false,
    modifiers: [],
    mayWithdraw,
    withdrawn: false,
    meditation: null,
    shaken: {},
  };
}

const flyerOf = (f: Battle['flyer'], ship: ShipState): Flyer => ({ ship, wingman: f.wingman, forceOrDroid: f.forceOrDroid, engineer: f.engineer, gunners: f.gunners, ...(f.mods?.length ? { modifiers: f.mods } : {}) });

// ---- reading it ----

/** The player's own ship as it stands now. */
export function ownShip(b: Battle): ShipState | null {
  if (b.run) return b.run.flyer.ship;
  if (b.dog) return b.dog.a.ship;
  return b.fleet?.a.ships.find((s) => s.id === b.ownShipId) ?? null;
}

/** The player flies their own fighter in a fleet battle. */
export const fliesInFleet = (b: Battle): boolean => b.kind === 'fleet' && b.role === 'pilot';
/** The player gives the fleet its orders now. */
export const commanding = (b: Battle): boolean => b.kind === 'fleet' && b.role === 'commander' && b.command === 'player' && !b.out;
/** Waiting on a personal fight (a boarding) before the battle goes on. */
export const suspended = (b: Battle): boolean => b.boarding?.stage === 'personal' && b.boarding.fightId !== null;

// ---- the map (design notes "Battle map": redrawn only when something changes) ----

function dogMap(d: Dogfight, enemiesLeft: number): string {
  const pos = { onTail: 'on their tail', tailed: 'they are on your tail', ahead: 'you have the edge', behind: 'they have the edge', headOn: 'head-on', brokenOff: 'apart' }[positionOf(d)];
  const gap = { close: 2, medium: 6, long: 10 }[d.range];
  const me = `${shipClass(d.a.ship.classId).letter.toUpperCase()}>`;
  const them = `<${shipClass(d.b.ship.classId).letter}`;
  const lead = d.track >= 3 ? `${' '.repeat(gap)}${me}${them}` : d.track <= -3 ? `${them}${me}${' '.repeat(gap)}` : `${me}${'·'.repeat(gap)}${them}`;
  return [`TURN ${d.turn} · Range: ${d.range.toUpperCase()}`, `Position: ${pos}`, '', `   ${lead}`, '', `${me} ${d.a.ship.name}`.slice(0, 40), `${them} ${d.b.ship.name}${enemiesLeft ? ` (+${enemiesLeft} waiting)` : ''}`.slice(0, 40)].join('\n');
}

/** Redraw the map only when something it shows changed (movement, formation, a ship lost). */
function redraw(b: Battle): Battle {
  const sig = b.fleet
    ? [b.fleet.range, formationNow(b.fleet.a), formationNow(b.fleet.b), ...[...b.fleet.a.ships, ...b.fleet.b.ships].map((s) => (s.destroyed ? 'X' : s.gone ? '-' : 'o'))].join('|')
    : b.dog
      ? [b.dog.range, positionOf(b.dog), b.dog.b.ship.id, b.queue.length].join('|')
      : b.run
        ? `run|${b.run.step}|${b.run.target.id}`
        : 'none';
  if (sig === b.mapSig) return b;
  const map = b.fleet ? fleetMap(b.fleet) : b.dog ? dogMap(b.dog, b.queue.length) : b.run ? `ATTACK RUN · ${['LONG', 'MEDIUM', 'CLOSE', 'UNDER THE GUNS'][b.run.step]}\n${b.run.target.name}`.slice(0, 80) : null;
  return { ...b, map, mapSig: sig };
}

// ---- the tactics menu (design notes "Tactics menu") ----

export interface MenuOption {
  group: 'manoeuvre' | 'power' | 'shields' | 'shot' | 'crew' | 'approach' | 'engage' | 'formation' | 'order' | 'boarding' | 'battle';
  label: string;
  strong?: string;
  weak?: string;
  /** What the choice costs (a reform's rounds and penalty, guns given up to roll). */
  cost?: string;
  available: boolean;
  why?: string;
  orders: BattleOrders;
}

export interface BattleMenu {
  title: string;
  /** Current position or formation. */
  now: string;
  /** What is known of the enemy. */
  known: string[];
  options: MenuOption[];
  /** The player only watches this one (crew aboard, or the battle runs on without them). */
  watching: boolean;
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const shieldsText = (s: ShipState): string => {
  const c = shipClass(s.classId);
  const faces = Object.entries(s.shields).map(([f, v]) => `${f} ${pct(Math.max(0, v ?? 0) / Math.max(1, c.shields[f as Facing] ?? 1))}`);
  return `${faces.join(', ')}; hull ${pct(Math.max(0, s.hull) / Math.max(1, c.hull))}`;
};

function dogfightOptions(b: Battle, d: Dogfight): MenuOption[] {
  const lead = d.track;
  const out: MenuOption[] = [];
  const pilot = b.role === 'pilot';
  if (pilot) {
    for (const id of MANOEUVRES) {
      // Only the tactics the character knows are offered (m8-ship-life part G).
      if (!knows(b, id)) continue;
      const def = MANOEUVRE[id];
      const can = flown({ manoeuvre: id }, d.a, lead, d.terrain) === id;
      const counters = MANOEUVRES.filter((m) => (MANOEUVRE[m].against?.[id] ?? 0) > 0).map((m) => MANOEUVRE[m].label);
      const beats = Object.entries(def.against ?? {}).map(([m]) => MANOEUVRE[m as Manoeuvre].label);
      out.push({
        group: 'manoeuvre',
        label: def.label,
        strong: [def.mod ? `${def.mod > 0 ? '+' : ''}${def.mod} on position` : '', beats.length ? `beats ${beats.join(', ')}` : '', def.note].filter(Boolean).join('; '),
        ...(MANOEUVRE_WEAK[id] || counters.length ? { weak: MANOEUVRE_WEAK[id] ?? `countered by ${counters.join(', ')}` } : {}),
        available: can,
        ...(can ? {} : { why: def.needs === 'wingman' ? 'needs a wingman' : def.needs === 'terrain' ? 'needs terrain' : def.needs === 'forceOrDroid' ? 'droid or Force-aided pilots only' : def.use === 'defensive' ? 'only when they have the edge' : 'only when you have the edge' }),
        orders: { manoeuvre: id },
      });
    }
  }
  for (const [boost, label] of [['lasers', 'Power to lasers'], ['shields', 'Power to shields'], ['engines', 'Power to engines']] as const) {
    const weaken = boost === 'engines' ? 'lasers' : 'engines';
    const freighter = shipClass(d.a.ship.classId).kind === 'freighter';
    out.push({ group: 'power', label, strong: boost === 'lasers' ? `fire x${DOGFIGHT.boost.lasers}` : boost === 'shields' ? `shield recovery x${DOGFIGHT.boost.shields}` : `+${DOGFIGHT.boost.engines} piloting and evasion`, weak: weaken === 'lasers' ? `lasers x${DOGFIGHT.boost.lasersWeak}` : `${DOGFIGHT.boost.enginesWeak} piloting`, ...(freighter && !b.flyer.engineer ? { cost: `${DOGFIGHT.noEngineer} piloting (no engineer)` } : {}), available: true, orders: { boost, weaken } });
  }
  for (const [angle, label] of [['even', 'Shields even'], ['front', 'Double front shields'], ['back', 'Double rear shields']] as const) out.push({ group: 'shields', label, strong: angle === 'even' ? 'no thin side' : `${pct(DOGFIGHT.angle)} of the pool ${angle === 'front' ? 'ahead' : 'behind'}`, ...(angle === 'even' ? {} : { weak: `${pct(1 - DOGFIGHT.angle)} ${angle === 'front' ? 'behind' : 'ahead'}` }), available: true, orders: { angle } });
  const torps = Object.values(d.a.ship.ammo).some((n) => n > 0);
  out.push({ group: 'shot', label: 'Fire the guns', strong: lead >= 3 ? 'full shot from the tail' : 'only as a snap shot from here', available: true, orders: { shot: 'guns', snap: lead < 3 && lead >= 0 } });
  out.push({ group: 'shot', label: 'Torpedo lock', strong: 'near-fatal: one last evasion roll at -3', weak: 'only from the tail; decoys help them', available: torps && lead >= 3, ...(torps ? (lead >= 3 ? {} : { why: 'only from their tail' }) : { why: 'no torpedoes left' }), orders: { shot: 'torpedo' } });
  out.push({ group: 'shot', label: 'Hold fire', available: true, orders: { shot: 'none' } });
  if (b.flyer.repairBy) {
    const broken = (['engines', 'weapons', 'generator', 'sensors', 'astromech'] as const).filter((x) => ['damaged', 'disabled'].includes(systemState(d.a.ship, x)));
    for (const sys of broken) out.push({ group: 'crew', label: `Repair the ${sys} (${b.flyer.repairBy === 'player' ? 'you' : b.flyer.repairBy})`, strong: `Repair against ${REPAIR_DC}: one step better`, available: true, orders: { repair: sys } });
  }
  if (b.flyer.gunners.length) out.push({ group: 'crew', label: `Gunners at the turrets (${b.flyer.gunners.length})`, strong: 'fire in any direction', weak: `${DOGFIGHT.turret} on their shots`, available: false, why: 'always on', orders: {} });
  out.push({ group: 'battle', label: 'Break off', strong: lead >= 0 ? 'free from an even or better position' : 'must win a piloting roll at your position', available: true, orders: { breakOff: true } });
  return out;
}

function runOptions(r: AttackRun): MenuOption[] {
  const out: MenuOption[] = [
    { group: 'approach', label: 'Strafing pass', strong: 'a plain run at the shields', available: true, orders: { approach: 'pass' } },
    { group: 'approach', label: 'Hull skimming', strong: `under the big guns: +${ATTACK_RUN.skim.evasion} evasion close in, their fire halved`, weak: `a collision if lost by ${ATTACK_RUN.skim.risk}`, available: true, orders: { approach: 'skim' } },
    { group: 'approach', label: 'Trench run', strong: `+${ATTACK_RUN.trench.shot} on a shot at a system`, weak: `the pursuers' fire, a wreck if lost by ${ATTACK_RUN.trench.risk}`, available: r.trench, ...(r.trench ? {} : { why: 'this ship has no trench' }), orders: { approach: 'trench' } },
  ];
  for (const f of Object.keys(r.target.shields) as Facing[]) out.push({ group: 'shot', label: `Strike the ${f} shields`, strong: `${pct(Math.max(0, r.target.shields[f] ?? 0) / Math.max(1, shipClass(r.target.classId).shields[f] ?? 1))} left there`, available: true, orders: { facing: f } });
  const torps = Object.values(r.flyer.ship.ammo).some((n) => n > 0);
  out.push({ group: 'shot', label: 'Torpedo volley', strong: 'all of it on one facing', weak: 'particle shields stop much of it', available: torps, ...(torps ? {} : { why: 'no torpedoes left' }), orders: { shot: 'torpedo' } });
  out.push({ group: 'shot', label: 'Guns', weak: 'little against a capital ship', available: true, orders: { shot: 'guns' } });
  out.push({ group: 'battle', label: 'Break off the run', available: true, orders: { breakOff: true } });
  return out;
}

function engageOptions(b: Battle): MenuOption[] {
  const f = b.fleet!;
  const out: MenuOption[] = [];
  for (const w of f.b.wings.filter((x) => x.state === 'out' && x.count > 0)) out.push({ group: 'engage', label: `Engage the ${shipClass(w.classId).name}s (${Math.round(w.count)})`, strong: 'a kill is worth half a point to the fleet', weak: 'beaten: -1', available: true, orders: { engage: { wingId: w.id } } });
  for (const s of f.b.ships.filter(inFight)) out.push({ group: 'engage', label: `Attack run on the ${s.name}`, strong: 'strike a shield facing; hull skimming gets under the big guns', weak: 'point defence and its gunners', available: true, orders: { engage: { shipId: s.id } } });
  out.push({ group: 'battle', label: 'Return to the hangar', strong: 'out of the fight; the fleet fights on under its commander', available: true, orders: { returnToHangar: true } });
  return out;
}

function fleetOptions(f: FleetBattle): MenuOption[] {
  const me = f.a;
  const them = f.b;
  const out: MenuOption[] = [];
  const now = formationNow(me);
  const theirs = them.reform ? 'brawl' : formationNow(them);
  for (const id of FORMATIONS) {
    const beats = FORMATION_BEATS[id].map((x) => FORMATION_LABEL[x]);
    const loses = FORMATIONS.filter((x) => FORMATION_BEATS[x].includes(id)).map((x) => FORMATION_LABEL[x]);
    const planned = !me.broken && !me.reform && (PLANNED_CHANGES[me.formation] ?? []).includes(id);
    const m = formationMatchup(id, theirs);
    out.push({
      group: 'formation',
      label: FORMATION_LABEL[id] + (id === now ? ' (now)' : ''),
      strong: beats.length ? `beats ${beats.join(', ')}` : 'no edge',
      ...(loses.length ? { weak: `loses to ${loses.join(', ')}` } : {}),
      cost: id === now && !me.broken ? 'holds' : planned ? 'planned: no penalty' : `reform: ${FLEET.reformPenalty} for 1 round on Tactics ${FLEET.reformDc}+, else 2 rounds with gaps (${FLEET.gapsPenalty} more)`,
      available: true,
      ...(me.intel ? { why: `against their ${FORMATION_LABEL[theirs]}: ${m > 0 ? '+' : ''}${m}` } : {}),
      orders: { formation: id },
    });
  }
  for (const s of them.ships.filter(inFight)) out.push({ group: 'order', label: `Focus fire on the ${s.name}`, strong: `fire on one ship x${FLEET.focus}`, available: true, orders: { focus: s.id } });
  for (const [move, label, strong] of [['close', 'Advance', 'close the range'], ['hold', 'Hold', 'keep the range'], ['open', 'Fall back', 'open the range']] as const) out.push({ group: 'order', label, strong: `${strong}; the faster side gets the range it wants`, available: true, orders: { move } });
  const aboard = me.wings.some((w) => w.state === 'aboard' && w.count > 0);
  const away = me.wings.some((w) => w.state === 'out' && w.count > 0);
  out.push({ group: 'order', label: 'Launch fighters', strong: 'a screen holds off a strike; strikers go for the weakest facing', weak: 'a round to launch; particle shields down that round', available: aboard, ...(aboard ? {} : { why: 'none aboard' }), orders: { launch: true } });
  out.push({ group: 'order', label: 'Recall fighters', strong: 'rearm their warheads', available: away, ...(away ? {} : { why: 'none out' }), orders: { recall: true } });
  out.push({ group: 'order', label: 'Roll damaged ships to fresh shields', strong: 'a ship whose shown facing is low shows its freshest', cost: `guns x${FLEET.rolled} that round`, available: true, orders: { roll: true } });
  out.push({ group: 'order', label: 'Fire warheads', strong: 'torpedoes and missiles partly pass the shields', weak: 'particle shields halved that round', available: me.ships.some((s) => Object.values(s.ammo).some((n) => n > 0)), orders: { warheads: true } });
  for (const s of them.ships.filter((x) => inFight(x) && damageState(x) === 'disabled')) {
    out.push({ group: 'boarding', label: `Board the ${s.name}`, strong: 'take it: a hidden roll', available: f.range === 'close', ...(f.range === 'close' ? {} : { why: 'close range only' }), orders: { board: s.id } });
    out.push({ group: 'boarding', label: `Lead the boarding of the ${s.name}`, strong: 'a personal fight with its crew', available: f.range === 'close', ...(f.range === 'close' ? {} : { why: 'close range only' }), orders: { board: s.id, leadBoarding: true } });
  }
  out.push({ group: 'battle', label: 'Withdraw', strong: 'the withdraw formation, falling back to long range', available: true, orders: { formation: 'withdraw', move: 'open', withdraw: true } });
  return out;
}

function earlyEvacOption(b: Battle): MenuOption[] {
  const s = ownShip(b);
  if (!s || b.out || !EARLY(b.player.faction) || b.role !== 'commander') return [];
  const pressed = damageState(s) === 'crippled' || damageState(s) === 'disabled' || (b.boarding?.ofSide === 'player' && b.boarding.shipId === s.id);
  return pressed ? [{ group: 'battle', label: 'Evacuate now, leaving the crew', strong: 'you get off; the crew fights on under the first officer', weak: 'the crew, and anyone who hears of it, will remember', available: true, orders: { evacuateEarly: true } }] : [];
}

/** The tactics menu for this turn or round. */
/** The player knows this tactic (old battles without the record: everything is open). */
export const knows = (b: Battle, id: string): boolean => !b.tactics || id === 'fly' || b.tactics.known.includes(id) || (COMMAND_BASICS.includes(id) && b.role === 'commander');
const npcMay = (b: Battle, id: string): boolean => !b.enemyTactics || id === 'fly' || b.enemyTactics.includes(id);
const seen = (b: Battle, who: 'enemy' | 'ally', id: string | undefined): Battle => {
  if (!id || id === 'fly') return b;
  const u = b.seenUsed ?? { enemy: [], ally: [] };
  return u[who].includes(id) ? b : { ...b, seenUsed: { ...u, [who]: [...u[who], id] } };
};

export function battleMenu(b: Battle): BattleMenu {
  const known: string[] = [];
  if (b.dog) {
    const e = b.dog.b.ship;
    known.push(`${e.name}: ${shipClass(e.classId).name}; ${shieldsText(e)}`);
    if (b.queue.length) known.push(`${b.queue.length} more waiting`);
    const mine = b.dog.a.ship;
    return { title: 'Dogfight', now: `${{ onTail: 'On their tail', tailed: 'They are on your tail', ahead: 'You have the edge', behind: 'They have the edge', headOn: 'Head-on', brokenOff: 'Apart' }[positionOf(b.dog)]} · range ${b.dog.range} · your ship: ${shieldsText(mine)}`, known, options: [...dogfightOptions(b, b.dog), ...earlyEvacOption(b)], watching: false };
  }
  if (b.run) {
    known.push(`${b.run.target.name}: ${shipClass(b.run.target.classId).name}; ${shieldsText(b.run.target)}`);
    return { title: 'Attack run', now: `${['Long range', 'Medium range', 'Close', 'Under the guns'][b.run.step]} · your ship: ${shieldsText(b.run.flyer.ship)}`, known, options: runOptions(b.run).filter((o) => o.group !== 'approach' || knows(b, o.orders.approach ?? 'pass')), watching: false };
  }
  const f = b.fleet!;
  for (const s of f.b.ships.filter(inFight)) known.push(`${s.name} (${shipClass(s.classId).name}): ${damageState(s)}`);
  const theirNow = f.b.reform ? 'brawl' : formationNow(f.b);
  if (f.a.intel) known.push(`their formation: ${FORMATION_LABEL[theirNow]}${f.b.reform ? ' (reforming)' : ''}`);
  else if (b.tactics?.recognised.includes(theirNow)) known.push(`their formation: ${FORMATION_LABEL[theirNow]} (recognised: +${FLEET.intel})`);
  else known.push('their formation: not known (scouts or sensor ships would show it)');
  const now = `Round ${f.round} · ${FORMATION_LABEL[formationNow(f.a)]}${f.a.reform ? ` (reforming, ${f.a.reform.rounds} round${f.a.reform.rounds === 1 ? '' : 's'})` : ''} · range ${f.range}`;
  if (fliesInFleet(b) && !b.out) return { title: 'Fleet battle: your engagement', now, known, options: engageOptions(b), watching: false };
  if (commanding(b)) return { title: 'Fleet battle: your command', now, known, options: [...fleetOptions(f).filter((o) => o.group !== 'formation' || knows(b, o.orders.formation ?? 'exchange')), ...earlyEvacOption(b)], watching: false };
  return { title: b.out ? 'Fleet battle: it goes on without you' : `Fleet battle: under ${b.player.commander.name}`, now, known, options: earlyEvacOption(b), watching: true };
}

// ---- one step ----

const dogOrdersOf = (o: BattleOrders): DogOrders => ({ ...(o.manoeuvre ? { manoeuvre: o.manoeuvre } : {}), ...(o.boost ? { boost: o.boost } : {}), ...(o.weaken ? { weaken: o.weaken } : {}), ...(o.angle ? { angle: o.angle } : {}), ...(o.shot ? { shot: o.shot } : {}), ...(o.snap ? { snap: o.snap } : {}), ...(o.repair ? { repair: o.repair } : {}) });
const runOrdersOf = (o: BattleOrders): RunOrders => ({ ...(o.approach ? { approach: o.approach } : {}), ...(o.facing ? { facing: o.facing } : {}), ...(o.shot && o.shot !== 'ion' ? { shot: o.shot } : {}), ...(o.aim && ['generator', 'engines', 'weapons', 'hangar'].includes(o.aim) ? { aim: o.aim as NonNullable<RunOrders['aim']> } : {}), ...(o.boost ? { boost: o.boost } : {}), ...(o.weaken ? { weaken: o.weaken } : {}) });
const fleetOrdersOf = (o: BattleOrders): FleetOrders => ({
  ...(o.formation ? { change: o.formation } : {}),
  ...(o.focus !== undefined ? { focus: o.focus } : {}),
  ...(o.aim && ['ship', 'dome', 'bridge', 'generator'].includes(o.aim) ? { aim: o.aim as NonNullable<FleetOrders['aim']> } : {}),
  ...(o.move ? { move: o.move } : {}),
  ...(o.launch ? { launch: true } : {}),
  ...(o.recall ? { recall: true } : {}),
  ...(o.mission ? { mission: o.mission } : {}),
  ...(o.roll ? { roll: true } : {}),
  ...(o.warheads ? { warheads: true } : {}),
  ...(o.holdFire ? { holdFire: true } : {}),
});

/** The player's orders handed to the code: the moves an NPC with the character's own skills would choose. */
export function autoOrders(b: Battle): BattleOrders {
  if (b.dog) {
    const raw = autoDogOrders(b.dog, 'A');
    const o = raw.manoeuvre && !knows(b, raw.manoeuvre) ? { ...raw, manoeuvre: (MANOEUVRE[raw.manoeuvre].use === 'defensive' && knows(b, 'break') ? 'break' : 'fly') as Manoeuvre } : raw;
    const sys = b.flyer.repairBy ? (['weapons', 'engines', 'generator', 'sensors'] as const).find((x) => ['damaged', 'disabled'].includes(systemState(b.dog!.a.ship, x))) : undefined;
    return { ...(o.manoeuvre ? { manoeuvre: o.manoeuvre } : {}), ...(o.shot ? { shot: o.shot } : {}), ...(o.snap ? { snap: o.snap } : {}), ...(sys ? { repair: sys } : {}) };
  }
  if (b.run) {
    const raw = autoRunOrders(b.run);
    const o = raw.approach && !knows(b, raw.approach) ? { ...raw, approach: 'pass' as const } : raw;
    return { ...(o.approach ? { approach: o.approach } : {}), ...(o.shot ? { shot: o.shot } : {}), ...(o.aim ? { aim: o.aim } : {}) };
  }
  if (fliesInFleet(b) && !b.out) {
    const f = b.fleet!;
    const wing = f.b.wings.find((w) => w.state === 'out' && w.count > 0);
    if (wing) return { engage: { wingId: wing.id } };
    const ship = [...f.b.ships.filter(inFight)].sort((x, y) => shipStrength(x) - shipStrength(y))[0];
    return ship ? { engage: { shipId: ship.id } } : {};
  }
  if (b.fleet) {
    const o = autoFleetOrders(b.fleet, 'A');
    return { ...(o.change && knows(b, o.change) ? { formation: o.change } : {}), ...(o.focus !== undefined ? { focus: o.focus } : {}), ...(o.move ? { move: o.move } : {}), ...(o.launch ? { launch: true } : {}), ...(o.roll ? { roll: true } : {}), ...(o.warheads ? { warheads: true } : {}) };
  }
  return {};
}

interface Work {
  b: Battle;
  lines: string[];
  big: string[];
  handoff: Handoff | null;
  hazard: StepResult['hazard'];
  seconds: number;
}

const setRng = (b: Battle, rng: RngState): Battle => (b.fleet ? { ...b, fleet: { ...b.fleet, rng } } : b.dog ? { ...b, dog: { ...b.dog, rng } } : b.run ? { ...b, run: { ...b.run, rng } } : b);
const rngOf = (b: Battle): RngState => (b.fleet?.rng ?? b.dog?.rng ?? b.run?.rng)!;

function finish(w: Work, winner: 'player' | 'enemy' | null, reason: BattleEnd, line: string): void {
  w.b = { ...w.b, end: { winner, reason }, dog: w.b.fleet ? null : w.b.dog, run: null };
  w.big.push(line);
}

/** A dogfight turn: the player's orders against the enemy pilot's. */
function dogStep(w: Work, o: BattleOrders): void {
  let b = w.b;
  const d = b.dog!;
  if (o.breakOff) {
    const next = breakOff(d, 'A');
    b = { ...b, dog: next };
    w.b = b;
    if (next.end) {
      w.lines.push(`${d.a.ship.name} breaks off.`);
      if (b.kind === 'fleet') endEngagement(w, false);
      else finish(w, b.blockade ? 'player' : null, 'brokenOff', b.blockade ? `${d.a.ship.name} breaks off and runs the line.` : `${d.a.ship.name} breaks off the fight.`);
    } else w.lines.push(`${d.a.ship.name} tries to break off; ${d.b.ship.name} stays on them.`);
    w.seconds += TURN_SECONDS;
    return;
  }
  const mine = b.role === 'gunner' ? { ...autoDogOrders(d, 'A'), ...(o.shot === 'none' ? { shot: 'none' as const } : {}) } : dogOrdersOf(o);
  // The enemy pilot flies only what its training gives (m8-ship-life part G); a manoeuvre the player recognises is worth +1.
  const raw = autoDogOrders(d, 'B');
  const theirs = raw.manoeuvre && !npcMay(b, raw.manoeuvre) ? { ...raw, manoeuvre: (MANOEUVRE[raw.manoeuvre].use === 'defensive' && npcMay(b, 'break') ? 'break' : 'fly') as Manoeuvre } : raw;
  const spotted = theirs.manoeuvre && theirs.manoeuvre !== 'fly' && b.tactics?.recognised.includes(theirs.manoeuvre);
  const dd = spotted ? { ...d, a: { ...d.a, modifiers: [...(d.a.modifiers ?? []), { source: 'recognised their manoeuvre', value: FLEET.intel }] } } : d;
  const turned = dogfightTurn(dd, mine, theirs);
  const next = spotted ? { ...turned, a: { ...turned.a, modifiers: d.a.modifiers ?? [] } } : turned;
  b = seen(b, 'enemy', theirs.manoeuvre);
  const t = next.log[next.log.length - 1]!;
  w.seconds += TURN_SECONDS;
  // XP lines: the player's own rolls (D-513 gunnery; piloting as field use).
  if (b.role === 'pilot') b = { ...b, xp: { ...b.xp, piloting: [...b.xp.piloting, d.b.ship.crew.piloting - d.a.ship.crew.piloting] } };
  const own = t.shots.filter((s) => s.by === 'A' && (b.role === 'gunner' ? s.what === 'turret' : s.what !== 'turret'));
  if (own.length) b = { ...b, xp: { ...b.xp, gunnery: [...b.xp.gunnery, ...own.map((s) => s.margin)] } };
  if (mine.repair && b.flyer.repairBy === 'player') b = { ...b, xp: { ...b.xp, repairs: [...b.xp.repairs, { success: t.notes.some((n) => n.includes(`${mine.repair} patched`)) }] } };
  // The line or two.
  const pos = { onTail: 'on their tail', tailed: 'with them on your tail', ahead: 'with the edge', behind: 'with them holding the edge', headOn: 'head-on', brokenOff: 'apart' }[t.position];
  const move = mine.manoeuvre && mine.manoeuvre !== 'fly' ? `${MANOEUVRE[mine.manoeuvre].label}: ` : '';
  w.lines.push(`${move}${d.a.ship.name} comes out ${pos} (margin ${t.margin > 0 ? '+' : ''}${t.margin}).`);
  for (const s of t.shots) {
    const by = s.by === 'A' ? d.a.ship.name : d.b.ship.name;
    const at = s.by === 'A' ? next.b.ship : next.a.ship;
    const was = s.by === 'A' ? d.b.ship : d.a.ship;
    if (!s.hit) {
      w.lines.push(`${by}'s ${s.what === 'torpedo' ? 'torpedo' : 'shot'} misses.`);
      continue;
    }
    const lostShare = s.toHull / Math.max(1, shipClass(was.classId).hull);
    const text = `${by}'s ${s.what === 'torpedo' ? 'torpedo' : s.what === 'turret' ? 'turret fire' : 'shot'} hits ${at.name}${s.toHull > 0 ? ` (hull ${pct(Math.max(0, at.hull) / Math.max(1, shipClass(at.classId).hull))})` : ' on the shields'}${s.system ? `, the ${s.system} ${systemState(at, s.system)}` : ''}${s.burnt ? ', a shield projector burns out' : ''}.`;
    if (s.lost || s.system || lostShare >= NARRATION.bigHit || s.what === 'torpedo') w.big.push(text);
    else w.lines.push(text);
  }
  for (const n of t.notes) w.lines.push(`${n}.`);
  b = { ...b, dog: next };
  w.b = b;
  if (!next.end) return;
  const won = next.end.winner === 'A';
  if (won) {
    const kill = next.b.ship;
    w.b = { ...w.b, kills: w.b.kills + 1, tally: { ...w.b.tally, ...(isSmallKind(shipClass(kill.classId).kind) && shipClass(kill.classId).kind === 'fighter' ? { fighters: { ...w.b.tally.fighters, enemy: w.b.tally.fighters.enemy + 1 } } : {}), destroyed: next.end.reason === 'destroyed' ? { ...w.b.tally.destroyed, enemy: [...w.b.tally.destroyed.enemy, kill.name] } : w.b.tally.destroyed } };
    w.big.push(next.end.reason === 'destroyed' ? `${kill.name} is destroyed.` : `${kill.name} is disabled.`);
    if (w.b.kind === 'fleet') return endEngagement(w, false, kill);
    const q = w.b.queue;
    if (q.length) {
      const [first, ...rest] = q;
      const ship = newShip(`${w.b.id}:e${w.b.kills}`, first!.classId, first!.crew, first!.name);
      w.b = { ...w.b, queue: rest, dog: startDogfight({ ...next.a }, { ship }, next.rng, { range: 'medium', year: w.b.year }) };
      w.lines.push(`${ship.name} comes in.`);
      return;
    }
    return finish(w, 'player', next.end.reason === 'destroyed' ? 'destroyed' : 'disabled', `The last of them is down.`);
  }
  // The player's ship is out.
  const mineOut = next.a.ship;
  const cls = shipClass(mineOut.classId);
  w.b = { ...w.b, beaten: true };
  if (next.end.reason === 'disabled' && cls.kind !== 'fighter' && shipClass(next.b.ship.classId).kind !== 'fighter') {
    // A disabled freighter is boarded by a ship that can carry boarders.
    startBoarding(w, mineOut, 'player', true);
    return;
  }
  if (w.b.kind === 'fleet') return endEngagement(w, true);
  // Destroyed: the pilot ejects or the crew abandons the wreck. Disabled: it drifts, at the enemy's mercy.
  if (next.end.reason === 'destroyed') playerShipLost(w, mineOut);
  else w.b = { ...w.b, out: true, left: 'disabled' };
  finish(w, 'enemy', next.end.reason === 'destroyed' ? 'destroyed' : 'disabled', `${mineOut.name} is ${next.end.reason === 'destroyed' ? 'lost' : 'disabled'}.`);
}

/** The player's own ship lost: a fighter's pilot ejects or crashes; a larger ship is a hulk the crew abandons. */
function playerShipLost(w: Work, s: ShipState): void {
  const c = shipClass(s.classId);
  const [u, r] = nextFloat(rngOf(w.b));
  w.b = setRng(w.b, r);
  w.b = { ...w.b, out: true, left: c.kind === 'fighter' ? 'ejected' : 'abandoned', tally: { ...w.b.tally, destroyed: { ...w.b.tally.destroyed, player: [...w.b.tally.destroyed.player, s.name] } } };
  commandPassesOn(w);
  if (c.kind === 'fighter') w.hazard = { severity: 2, cause: `${s.name} shot down` };
  else w.hazard = u < BREAK_UP.chance ? { severity: EVACUATION.lastOffSeverity, cause: `${s.name} breaking up` } : { severity: 1, cause: `abandoning ${s.name}` };
}

/**
 * The player commanding leaves the flagship (abandoned or lost with it; m8-ship-life Part A3, D-518, approved): command passes
 * to the next senior captain, on another ship, at the better of the fleet's ordinary crews and the first officer's Tactics (a
 * reading; invented). The fleet engine already gives the flagship-lost penalty when the flagship falls.
 */
function commandPassesOn(w: Work): void {
  if (w.b.kind !== 'fleet' || w.b.role !== 'commander' || w.b.command !== 'player' || !w.b.fleet) return;
  const tactics = Math.max(GENERIC_CREW[w.b.player.kind] ?? GENERIC_CREW['navy']!, w.b.player.firstOfficer.tactics);
  const next = { name: 'the next senior captain', npcId: null, tactics, traits: [], jedi: false };
  w.b = { ...w.b, command: 'npc', player: { ...w.b.player, commander: next }, fleet: { ...w.b.fleet, a: { ...w.b.fleet.a, tactics } } };
  w.big.push(`Command passes to ${next.name}.`);
}

/** A pilot's engagement in a fleet battle ends: the fleet rolls its round. */
function endEngagement(w: Work, lost: boolean, kill?: ShipState): void {
  let b = w.b;
  const f = b.fleet!;
  let enemy = f.b;
  if (kill && b.dog) {
    // A fighter downed comes off its wing.
    const wingId = b.queue[0]?.wingId;
    enemy = { ...enemy, wings: enemy.wings.map((x) => (x.id === wingId || (!wingId && x.classId === kill.classId && x.state === 'out') ? { ...x, count: Math.max(0, x.count - 1) } : x)) };
  }
  if (b.run) enemy = { ...enemy, ships: enemy.ships.map((s) => (s.id === b.run!.target.id ? b.run!.target : s)) };
  b = { ...b, fleet: { ...f, b: enemy }, dog: null, run: null };
  w.b = b;
  if (lost) {
    const own = w.b.fleet!.a.ships.find((s) => s.id === w.b.ownShipId);
    if (own) playerShipLost(w, own);
    else w.b = { ...w.b, out: true, left: 'disabled' };
    w.big.push('Your fighter is out of the battle.');
  }
  fleetStep(w, {});
}

/** One fleet round: the player's side's orders (the player's, or the NPC commander's), the enemy's, then boarding and the hulks. */
function fleetStep(w: Work, o: BattleOrders, ctx?: StepCtx): void {
  let b = w.b;
  let f = b.fleet!;
  const mods = fliesInFleet(b) ? [{ source: "the player's dogfights", value: dogfightModifier(b.kills, b.beaten, FLEET.dogfightMax) }] : [];
  f = { ...f, a: { ...f.a, modifiers: [...f.a.modifiers.filter((m) => m.source !== "the player's dogfights"), ...mods.filter((m) => m.value !== 0)], ...(o.withdraw ? { mayWithdraw: true } : {}) } };
  const mine = commanding(b) ? fleetOrdersOf(o) : autoFleetOrders(f, 'A');
  // A formation the player recognises (known or seen) is worth the +1 of a known enemy formation (m8-ship-life part G).
  const theirF = f.b.reform ? 'brawl' : formationNow(f.b);
  const intel0 = f.a.intel;
  if (!intel0 && b.tactics?.recognised.includes(theirF)) f = { ...f, a: { ...f.a, intel: true } };
  const before = f;
  const rolled = fleetRound(f, mine, autoFleetOrders(f, 'B'));
  const next = rolled.a.intel === intel0 ? rolled : { ...rolled, a: { ...rolled.a, intel: intel0 } };
  b = seen(b, 'enemy', theirF);
  if (!commanding(b)) b = seen(b, 'ally', formationNow(f.a));
  const rec = next.log[next.log.length - 1]!;
  w.seconds += ROUND_MINUTES * 60 - (fliesInFleet(b) ? b.turnsThisRound * TURN_SECONDS : 0);
  b = { ...b, fleet: next, turnsThisRound: 0, kills: fliesInFleet(b) ? 0 : b.kills, beaten: false };
  w.lines.push(`Round ${next.round}: ${rec.margin >= 0 ? `${next.a.name} have the better of it` : `${next.b.name} have the better of it`} (margin ${rec.margin > 0 ? '+' : ''}${rec.margin}); range ${next.range}.`);
  for (const n of rec.notes) {
    const big = /destroyed|break formation|strike lands|bridge|dome|crippled/.test(n);
    (big ? w.big : w.lines).push(`${n}.`);
  }
  // The tally of ships lost this round.
  for (const side of ['a', 'b'] as const) {
    const who = side === 'a' ? 'player' : 'enemy';
    for (const s of next[side].ships) {
      const was = before[side].ships.find((x) => x.id === s.id);
      if (s.destroyed && !was?.destroyed) b = { ...b, tally: { ...b.tally, destroyed: { ...b.tally.destroyed, [who]: [...b.tally.destroyed[who], s.name] } } };
    }
    const fallen = before[side].wings.reduce((t, x) => t + x.count, 0) - next[side].wings.reduce((t, x) => t + x.count, 0);
    if (fallen > 0) b = { ...b, tally: { ...b.tally, fighters: { ...b.tally.fighters, [who]: b.tally.fighters[who] + Math.round(fallen) } } };
  }
  if (before.a.flagId && next.a.flagId !== before.a.flagId) w.big.push(`${next.a.name}'s flagship falls.`);
  if (before.b.flagId && next.b.flagId !== before.b.flagId) w.big.push(`${next.b.name}'s flagship falls.`);
  w.b = b;
  boardingPhase(w, o, ctx);
  hulks(w);
  earlyLeavers(w);
  // The player's own ship gone with them aboard (a commander or crew; a pilot's carrier does not count).
  const own = w.b.fleet!.a.ships.find((s) => s.id === w.b.ownShipId);
  if (own && own.destroyed && !w.b.out && w.b.role !== 'pilot') {
    playerShipLost(w, own);
    w.big.push(`${own.name} is destroyed with ${w.b.role === 'commander' ? 'its commander' : 'the character'} aboard.`);
  }
  settleFleetEnd(w);
}

/** Boarding parties cross to disabled ships at close range (Jared, 26 Nov 2026). */
function boardingPhase(w: Work, o: BattleOrders, ctx?: StepCtx): void {
  const f = w.b.fleet!;
  if (w.b.boarding) return continueBoarding(w);
  // The player's ordered boarding.
  if (o.board && commanding(w.b)) {
    const t = f.b.ships.find((s) => s.id === o.board && inFight(s) && damageState(s) === 'disabled');
    if (t && f.range === 'close') {
      if (o.leadBoarding) return startBoarding(w, t, 'enemy', true, ctx);
      return hiddenBoarding(w, t, 'a');
    }
  }
  if (!BOARDING.ranges.includes(f.range as 'close')) return;
  for (const [side, them] of [['b', 'a'], ['a', 'b']] as const) {
    if (!f[side].ships.some(canAct)) continue;
    for (const t of w.b.fleet![them].ships) {
      if (!inFight(t) || damageState(t) !== 'disabled') continue;
      // The player's side boards on its own only under an NPC commander; the player orders their own.
      if (side === 'a' && commanding(w.b)) continue;
      const [u, r] = nextFloat(rngOf(w.b));
      w.b = setRng(w.b, r);
      if (u >= BOARDING.chance) continue;
      if (them === 'a' && t.id === w.b.ownShipId && !w.b.out) {
        const lead = w.b.role !== 'commander' || ctx?.playerJedi === true;
        if (w.b.role === 'commander' && ctx?.playerJedi) {
          w.b = { ...w.b, command: 'firstOfficer', fleet: { ...w.b.fleet!, a: { ...w.b.fleet!.a, tactics: w.b.player.firstOfficer.tactics } } };
          w.big.push(`Boarders on ${t.name}: you leave the bridge to ${w.b.player.firstOfficer.name} and go to the troops.`);
        }
        return startBoarding(w, t, 'player', lead, ctx, side === 'b' ? w.b.enemy.faction : w.b.player.faction);
      }
      hiddenBoarding(w, t, side);
    }
  }
}

/** A boarding the player is not in: one hidden roll, boarders against defenders. */
function hiddenBoarding(w: Work, t: ShipState, boarders: 'a' | 'b'): void {
  jediLeavesCommand(w, t, boarders === 'a' ? 'b' : 'a');
  const f = w.b.fleet!;
  const by = [...f[boarders].ships.filter(canAct)].sort((x, y) => y.crew.gunnery - x.crew.gunnery)[0];
  if (!by) return;
  const [ra, r1] = basicRoll(f.rng, by.crew.gunnery, [{ source: 'boarders', value: BOARDING.boardersEdge }]);
  const [rd, r2] = basicRoll(r1, t.crew.gunnery, [{ source: 'defenders', value: BOARDING.defendersEdge }]);
  const taken = ra.total >= rd.total;
  const of = boarders === 'a' ? 'b' : 'a';
  const who = of === 'a' ? 'player' : 'enemy';
  const ships = f[of].ships.map((s) => (s.id === t.id && taken ? { ...s, gone: true } : s));
  w.b = { ...w.b, fleet: { ...f, rng: r2, [of]: { ...f[of], ships } }, tally: taken ? { ...w.b.tally, captured: { ...w.b.tally.captured, [who]: [...w.b.tally.captured[who], t.name] } } : w.b.tally };
  (taken ? w.big : w.lines).push(taken ? `${t.name} is boarded and taken.` : `Boarders on ${t.name} are thrown back.`);
}

/** A Jedi in command leaves it the moment the flagship is boarded, to save the troops (Jared, 26 Nov 2026). */
function jediLeavesCommand(w: Work, t: ShipState, side: 'a' | 'b'): void {
  const f = w.b.fleet;
  const info = side === 'a' ? w.b.player : w.b.enemy;
  if (!f || t.id !== f[side].flagId || !info.commander.jedi || info.commanderGone || (side === 'a' && w.b.role === 'commander')) return;
  w.b = { ...w.b, fleet: { ...f, [side]: { ...f[side], tactics: info.firstOfficer.tactics } }, [side === 'a' ? 'player' : 'enemy']: { ...info, commanderGone: true } };
  w.big.push(`${info.commander.name} leaves command to ${info.firstOfficer.name} and goes to the troops on ${t.name}.`);
}

function startBoarding(w: Work, t: ShipState, ofSide: 'player' | 'enemy', personal: boolean, ctx?: StepCtx, boardersFaction?: string): void {
  const kind = shipClass(t.classId).kind;
  const faction = boardersFaction ?? (ofSide === 'player' ? w.b.enemy.faction : w.b.player.faction);
  const defenders = ofSide === 'enemy' ? w.b.enemy.faction : w.b.player.faction;
  const troops = { kind: ctx?.troopsFor(ofSide === 'player' ? faction : defenders) ?? 'trooper', count: Math.max(2, (ofSide === 'player' ? BOARDING.troops : BOARDING.defenders)[kind] ?? 4) };
  w.b = { ...w.b, boarding: { shipId: t.id, ofSide, stage: personal ? 'personal' : 'through', rounds: 0, personal, fightId: null, troops } };
  w.big.push(ofSide === 'player' ? `Boarders are on ${t.name}.` : `The boarding party crosses to ${t.name}.`);
  if (personal) w.handoff = { purpose: ofSide === 'player' ? 'repel' : 'take', shipName: t.name, troops, bridge: false };
}

/** A commander's boarded ship (not a Jedi): the boarders fight through it, hidden, until they reach the bridge or are beaten. */
function continueBoarding(w: Work): void {
  const bd = w.b.boarding!;
  if (bd.stage !== 'through') return;
  const f = w.b.fleet!;
  const t = [...f.a.ships, ...f.b.ships].find((s) => s.id === bd.shipId);
  const by = (bd.ofSide === 'player' ? f.b : f.a).ships.filter(canAct)[0];
  if (!t || !inFight(t) || !by) {
    w.b = { ...w.b, boarding: null };
    return;
  }
  const [ra, r1] = basicRoll(f.rng, by.crew.gunnery, [{ source: 'boarders', value: BOARDING.boardersEdge }]);
  const [rd, r2] = basicRoll(r1, t.crew.gunnery, [{ source: 'defenders', value: BOARDING.defendersEdge }]);
  w.b = { ...w.b, fleet: { ...f, rng: r2 } };
  const m = Math.round(ra.total - rd.total);
  const rounds = bd.rounds + 1;
  if (m >= BOARDING.bridgeMargin) {
    w.b = { ...w.b, boarding: { ...bd, stage: 'personal', personal: true, rounds } };
    w.big.push(`The boarders reach the bridge of ${t.name}.`);
    w.handoff = { purpose: 'repel', shipName: t.name, troops: bd.troops, bridge: true };
    return;
  }
  if (m <= -BOARDING.bridgeMargin || rounds >= BOARDING.maxRounds) {
    w.b = { ...w.b, boarding: null };
    w.big.push(`The boarders on ${t.name} are beaten off.`);
    return;
  }
  w.b = { ...w.b, boarding: { ...bd, rounds } };
  w.lines.push(`Fighting in the corridors of ${t.name}.`);
}

/** Ships with no hull left are abandoned (Jared: forced evacuation means the ship is lost). */
function hulks(w: Work): void {
  const f = w.b.fleet!;
  for (const side of ['a', 'b'] as const) {
    const who = side === 'a' ? 'player' : 'enemy';
    for (const s of f[side].ships) {
      if (s.destroyed || s.gone || s.hull > 0) continue;
      const info = side === 'a' ? w.b.player : w.b.enemy;
      w.b = { ...w.b, fleet: { ...w.b.fleet!, [side]: { ...w.b.fleet![side], ships: w.b.fleet![side].ships.map((x) => (x.id === s.id ? { ...x, gone: true } : x)) } }, tally: { ...w.b.tally, evacuated: { ...w.b.tally.evacuated, [who]: [...w.b.tally.evacuated[who], s.name] } } };
      const flag = s.id === f[side].flagId;
      // A Republic or Jedi commander is last off; a Sith or Imperial one may already be gone.
      w.big.push(`${s.name} is abandoned${flag ? (EARLY(info.faction) && info.commanderGone ? '; its commander left it long before' : `; ${info.commander.name} is the last one off`) : ''}.`);
      if (side === 'a' && s.id === w.b.ownShipId && !w.b.out) {
        const [u, r] = nextFloat(rngOf(w.b));
        w.b = setRng(w.b, r);
        w.b = { ...w.b, out: true, left: 'abandoned' };
        commandPassesOn(w);
        // Last off (Jared): the commander gets off last, if at all.
        w.hazard = w.b.role === 'commander' && u < BREAK_UP.chance ? { severity: EVACUATION.lastOffSeverity, cause: `last off ${s.name} as it breaks up` } : { severity: 1, cause: `abandoning ${s.name}` };
      }
    }
  }
}

/** NPC Sith and Imperial commanders may leave a crippled or boarded flagship early (weighted by side and traits). */
function earlyLeavers(w: Work): void {
  for (const side of ['a', 'b'] as const) {
    const info = side === 'a' ? w.b.player : w.b.enemy;
    if (info.commanderGone || !EARLY(info.faction) || (side === 'a' && w.b.role === 'commander')) continue;
    const f = w.b.fleet!;
    const flag = f[side].ships.find((s) => s.id === f[side].flagId);
    if (!flag || !inFight(flag)) continue;
    const pressed = damageState(flag) === 'crippled' || damageState(flag) === 'disabled' || w.b.boarding?.shipId === flag.id;
    if (!pressed) continue;
    const chance = (EVACUATION.earlyBase[info.faction] ?? 0) + info.commander.traits.reduce((t, x) => t + (EVACUATION.earlyTraits[x] ?? 0), 0);
    const [u, r] = nextFloat(rngOf(w.b));
    w.b = setRng(w.b, r);
    if (u >= chance) continue;
    const fs = w.b.fleet![side];
    const next: FleetSide = { ...fs, tactics: info.firstOfficer.tactics, shaken: { ...fs.shaken, [flag.id]: EVACUATION.abandonedShakenRounds } };
    w.b = { ...w.b, fleet: { ...w.b.fleet!, [side]: next }, [side === 'a' ? 'player' : 'enemy']: { ...info, commanderGone: true } };
    w.big.push(`${info.commander.name} leaves ${flag.name} early; ${info.firstOfficer.name} fights on with the crew.`);
  }
}

/** The fleet's end, as the code reads it (destroyed, withdrawn, surrendered, time). */
function settleFleetEnd(w: Work): void {
  const f = w.b.fleet!;
  // A raider's side gives up when it is beaten and outnumbered (SURRENDER).
  if (!f.end) {
    for (const [side, info] of [['b', w.b.enemy], ['a', w.b.player]] as const) {
      if (!SURRENDER.sides.includes(info.kind) && !SURRENDER.sides.includes(info.faction)) continue;
      const mine = sideStrength(f[side]);
      const full = f[side].ships.reduce((t, s) => t + fullStrength(s), 0);
      const theirs = sideStrength(f[side === 'a' ? 'b' : 'a']);
      if (full > 0 && mine < SURRENDER.strengthBelow * full && theirs >= SURRENDER.outnumbered * mine && mine > 0) {
        w.b = { ...w.b, fleet: { ...f, end: { winner: side === 'a' ? 'B' : 'A', reason: 'withdrew' } } };
        return finish(w, side === 'b' ? 'player' : 'enemy', 'surrendered', `${info.name} surrender.`);
      }
    }
  }
  const end = w.b.fleet!.end;
  if (!end) return;
  const winner = end.winner === 'A' ? 'player' : end.winner === 'B' ? 'enemy' : null;
  const reason: BattleEnd = end.reason === 'withdrew' ? 'withdrawn' : end.reason === 'time' ? 'time' : 'destroyed';
  finish(w, winner, reason, winner === 'player' ? `${w.b.fleet!.a.name} hold the field.` : winner === 'enemy' ? `${w.b.fleet!.b.name} hold the field.` : 'Neither side holds the field.');
}

/** An attack run turn. */
function runStep(w: Work, o: BattleOrders): void {
  const r = w.b.run!;
  if (o.breakOff) {
    w.b = { ...w.b, run: breakOffRun(r) };
    w.lines.push(`${r.flyer.ship.name} pulls out of the run.`);
    w.seconds += TURN_SECONDS;
    return endEngagement(w, false);
  }
  const ro = runOrdersOf(o);
  const next = runTurn(r, ro);
  const t = next.log[next.log.length - 1]!;
  w.seconds += TURN_SECONDS;
  w.b = { ...w.b, run: next, turnsThisRound: w.b.turnsThisRound + 1, xp: { ...w.b.xp, piloting: [...w.b.xp.piloting, r.target.crew.gunnery - r.flyer.ship.crew.piloting], gunnery: t.strike ? [...w.b.xp.gunnery, t.strike.margin] : w.b.xp.gunnery } };
  const label = { pass: 'A strafing pass', skim: 'Skimming the hull', trench: 'Down the trench' }[runApproach(r, ro)];
  w.lines.push(`${label}: ${['long range', 'medium range', 'close', 'under the guns'][t.stepAfter]}.`);
  if (t.defence && t.defence.toHull + t.defence.toShield > 0) w.lines.push(`${r.target.name}'s guns find ${r.flyer.ship.name}${t.defence.toHull > 0 ? ` (hull ${pct(Math.max(0, next.flyer.ship.hull) / Math.max(1, shipClass(next.flyer.ship.classId).hull))})` : ' on the shields'}.`);
  if (t.strike) {
    const s = t.strike;
    const text = s.toHull + s.toShield > 0 ? `${s.what === 'torpedo' ? 'Torpedoes' : 'Fire'} on ${r.target.name}'s ${s.facing} facing${s.toHull > 0 ? `, through to the hull` : ''}${s.system ? `, the ${s.system} hit` : ''}.` : `The ${s.what === 'torpedo' ? 'torpedoes miss' : 'fire goes wide'}.`;
    (s.toHull > 0 || s.system ? w.big : w.lines).push(text);
  }
  for (const n of t.notes) w.lines.push(`${n}.`);
  if (next.end) {
    if (next.end.reason === 'struck') w.big.push(`${r.target.name} is ${next.target.destroyed ? 'destroyed' : 'out of the fight'}.`);
    return endEngagement(w, next.end.reason === 'lost', next.end.reason === 'struck' ? next.target : undefined);
  }
  if (w.b.turnsThisRound >= TURNS_PER_FLEET_ROUND) {
    // A round's worth of turns: the fleet rolls with the run still going.
    const target = next.target;
    const f = w.b.fleet!;
    w.b = { ...w.b, fleet: { ...f, b: { ...f.b, ships: f.b.ships.map((x) => (x.id === target.id ? target : x)) } } };
    fleetStep(w, {});
    if (!w.b.end && w.b.run) w.b = { ...w.b, run: { ...w.b.run, target: w.b.fleet!.b.ships.find((x) => x.id === target.id) ?? target } };
  }
}

/** A pilot in a fleet picks the next engagement. */
function engage(w: Work, o: BattleOrders): void {
  const f = w.b.fleet!;
  const own = f.a.ships.find((s) => s.id === w.b.ownShipId);
  if (!own) return;
  if (o.returnToHangar) {
    w.b = { ...w.b, out: true, left: 'returned' };
    w.lines.push(`${own.name} turns for home; the battle goes on under ${w.b.player.commander.name}.`);
    return;
  }
  if (o.engage?.shipId) {
    const t = f.b.ships.find((s) => s.id === o.engage!.shipId && inFight(s));
    if (!t) return;
    w.b = { ...w.b, run: startRun(flyerOf(w.b.flyer, own), t, f.rng, { year: w.b.year }) };
    w.lines.push(`${own.name} begins an attack run on ${t.name}.`);
    return;
  }
  const wing = f.b.wings.find((x) => x.id === o.engage?.wingId && x.state === 'out' && x.count > 0) ?? f.b.wings.find((x) => x.state === 'out' && x.count > 0);
  if (!wing) return;
  const foe = newShip(`${w.b.id}:w${w.b.turn}`, wing.classId, wing.level, `a ${shipClass(wing.classId).name}`);
  w.b = { ...w.b, dog: startDogfight(flyerOf(w.b.flyer, own), { ship: foe, wingman: true }, f.rng, { range: 'medium', year: w.b.year }), queue: [{ classId: wing.classId, name: foe.name, crew: foe.crew, wingId: wing.id }] };
  w.lines.push(`${own.name} turns into ${foe.name}.`);
}

/** The player's evacuation, leaving a crew (a Sith or Imperial choice): they get off, the crew fights on. */
function evacuateEarly(w: Work): void {
  const s = ownShip(w.b);
  if (!s) return;
  w.b = { ...w.b, out: true, left: 'evacuatedEarly', leftCrew: true, command: 'firstOfficer', player: { ...w.b.player, commanderGone: true } };
  if (w.b.fleet) w.b = { ...w.b, fleet: { ...w.b.fleet, a: { ...w.b.fleet.a, tactics: w.b.player.firstOfficer.tactics, shaken: { ...w.b.fleet.a.shaken, [s.id]: EVACUATION.abandonedShakenRounds } } } };
  w.big.push(`You leave ${s.name}; ${w.b.player.firstOfficer.name} and the crew fight on.`);
}

/**
 * One step of the battle on the player's orders: a dogfight turn, an attack-run turn, an engagement chosen, or a fleet round.
 * When the player is out of it (or watching), a fleet round under the NPC commander.
 */
export function stepBattle(battle: Battle, orders: BattleOrders, ctx: StepCtx): StepResult {
  const w: Work = { b: { ...battle, turn: battle.turn + 1 }, lines: [], big: [], handoff: null, hazard: null, seconds: 0 };
  if (battle.end || suspended(battle)) return { battle, lines: [], big: [], handoff: null, hazard: null, seconds: 0 };
  if (orders.surrender) {
    finish(w, 'enemy', 'surrendered', `${battle.player.name} surrender.`);
  } else if (orders.evacuateEarly && earlyEvacOption(battle).length) {
    evacuateEarly(w);
    if (w.b.fleet) fleetStep(w, {}, ctx);
  } else if (w.b.dog) dogStep(w, w.b.auto ? autoOrders(w.b) : orders);
  else if (w.b.run) runStep(w, w.b.auto ? autoOrders(w.b) : orders);
  else if (fliesInFleet(w.b) && !w.b.out) engage(w, w.b.auto ? autoOrders(w.b) : orders);
  else if (w.b.fleet) fleetStep(w, w.b.auto || !commanding(w.b) ? autoOrders(w.b) : orders, ctx);
  w.b = { ...redraw(w.b), log: clip([...w.b.log, ...w.lines, ...w.big]), seconds: w.b.seconds + w.seconds };
  return { battle: w.b, lines: w.lines, big: w.big, handoff: w.handoff, hazard: w.hazard, seconds: w.seconds };
}

/** "Let it play out" (Jared): the code plays on with the character's own skills until the end, a big moment or a boarding. */
export function playOut(battle: Battle, ctx: StepCtx, maxSteps = 6): StepResult {
  let b: Battle = { ...battle, auto: true };
  const lines: string[] = [];
  const big: string[] = [];
  let seconds = 0;
  let hazard: StepResult['hazard'] = null;
  for (let i = 0; i < maxSteps && !b.end && !suspended(b); i++) {
    const r = stepBattle(b, {}, ctx);
    b = r.battle;
    lines.push(...r.lines);
    big.push(...r.big);
    seconds += r.seconds;
    hazard ??= r.hazard;
    if (r.handoff) return { battle: b, lines, big, handoff: r.handoff, hazard, seconds };
    if (r.big.length) break;
  }
  return { battle: b, lines, big, handoff: null, hazard, seconds };
}

/** The battle runs on without the player to its end (they are out of it): every round under the NPC commanders. */
export function runToEnd(battle: Battle, ctx: StepCtx, maxSteps = FLEET.maxRounds + 5): StepResult {
  let b: Battle = { ...battle, out: true, auto: true, dog: battle.kind === 'fleet' ? null : battle.dog, run: null };
  const lines: string[] = [];
  const big: string[] = [];
  let seconds = 0;
  if (!b.fleet) {
    if (!b.end) b = { ...b, end: { winner: 'enemy', reason: 'disabled' } };
    return { battle: b, lines, big, handoff: null, hazard: null, seconds };
  }
  for (let i = 0; i < maxSteps && !b.end; i++) {
    const r = stepBattle({ ...b, boarding: b.boarding?.ofSide === 'player' && b.boarding.shipId === b.ownShipId ? null : b.boarding }, {}, ctx);
    b = r.battle;
    lines.push(...r.lines);
    big.push(...r.big);
    seconds += r.seconds;
  }
  return { battle: b, lines, big, handoff: null, hazard: null, seconds };
}

/**
 * A personal boarding fight came back (Jared: the boarding fight runs as ordinary personal combat and its result returns to
 * the ship battle). Won: the boarders are beaten off, or the enemy ship is taken. Lost: the ship is taken; the player is out.
 */
export function boardingFought(battle: Battle, won: boolean): StepResult {
  const bd = battle.boarding;
  if (!bd) return { battle, lines: [], big: [], handoff: null, hazard: null, seconds: 0 };
  const w: Work = { b: { ...battle, boarding: null }, lines: [], big: [], handoff: null, hazard: null, seconds: 0 };
  const take = bd.ofSide === 'enemy';
  const f = w.b.fleet;
  const side = take ? 'b' : 'a';
  const who = take ? 'enemy' : 'player';
  const ship = f ? f[side].ships.find((s) => s.id === bd.shipId) : w.b.dog?.a.ship;
  const name = ship?.name ?? 'the ship';
  const captured = take ? won : !won;
  if (captured) {
    if (f) w.b = { ...w.b, fleet: { ...f, [side]: { ...f[side], ships: f[side].ships.map((s) => (s.id === bd.shipId ? { ...s, gone: true } : s)) } } };
    w.b = { ...w.b, tally: { ...w.b.tally, captured: { ...w.b.tally.captured, [who]: [...w.b.tally.captured[who], name] } } };
    w.big.push(take ? `${name} is taken.` : `${name} falls to the boarders.`);
  } else w.big.push(take ? `The boarding of ${name} fails.` : `The boarders on ${name} are beaten off.`);
  if (!take && !won) {
    // The player is out of the fight: a commander's command passes to the first officer.
    w.b = { ...w.b, out: true, left: 'captured', ...(w.b.role === 'commander' ? { command: 'firstOfficer' as const } : {}) };
    if (w.b.fleet && w.b.role === 'commander') w.b = { ...w.b, fleet: { ...w.b.fleet, a: { ...w.b.fleet.a, tactics: w.b.player.firstOfficer.tactics } } };
    if (!w.b.fleet) finish(w, 'enemy', 'captured', `${name} is taken.`);
  }
  if (w.b.fleet) settleFleetEnd(w);
  else if (!w.b.end && won && w.b.dog) {
    // A freighter that beat off its boarders: still disabled; the fight is over, the boarders' ship left with nothing.
    finish(w, 'player', 'brokenOff', `The boarders are dead or gone; ${name} drifts, but it is still yours.`);
  }
  w.b = { ...redraw(w.b), log: clip([...w.b.log, ...w.big]) };
  return { battle: w.b, lines: w.lines, big: w.big, handoff: null, hazard: null, seconds: 0 };
}

/** The command size for command XP (m8-skills COMMAND.size), by the ships the player's side fought with. */
export function commandSize(b: Battle, sizes: readonly (readonly [number, string])[]): string {
  const n = b.fleet ? b.fleet.a.ships.length : 1;
  return [...sizes].reverse().find(([min]) => n >= min)?.[1] ?? 'ship';
}

/** The player's ship at the end, for the damage that carries over. */
export const shipAtEnd = (b: Battle): ShipState | null => ownShip(b) ?? null;

/** The outcome for XP and records: won, drawn or lost. */
export const outcomeOf = (b: Battle): 'won' | 'drawn' | 'lost' => (b.end?.winner === 'player' ? 'won' : b.end?.winner === 'enemy' ? 'lost' : 'drawn');

/**
 * Whether the battle counts as a major one for the world (invented reading): against a standing force, or with two ships of
 * frigate size or larger on each side, or eight capital ships in all. Corvettes and fighters alone make a skirmish.
 */
export function isMajor(b: Battle): boolean {
  if (b.kind !== 'fleet') return false;
  if (b.forceId !== undefined) return true;
  const big = (side: 'a' | 'b'): number => b.fleet![side].ships.filter((s) => !isSmallKind(shipClass(s.classId).kind) && shipClass(s.classId).kind !== 'corvette').length;
  const capital = [...b.fleet!.a.ships, ...b.fleet!.b.ships].filter((s) => !isSmallKind(shipClass(s.classId).kind)).length;
  return (big('a') >= 2 && big('b') >= 2) || capital >= 8;
}

export { changeFormation, canAct };
