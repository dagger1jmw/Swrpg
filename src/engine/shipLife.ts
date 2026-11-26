// Ship life rules (m8-ship-life; D-519; docs-v2/spec/ship-life.md). Pure: a ship class's life data (drive, cargo, supplies,
// crew, capacity), what installed mods do, wear and breakdowns, shipyard quotes, astrogation off the charted routes, passage,
// and the customs check. Numbers in data/shipLife.config.ts. Seeded RNG; no DOM, no state.
import {
  ASTROGATION,
  BREAKDOWN,
  CLASS_LIFE,
  CLASS_LIFE_BY_KIND,
  CUSTOMS,
  CUSTOMS_DENSITY,
  DRIVE_BY_KIND,
  DRIVE_STEPS,
  MANDALORIAN_WARS_END,
  MILITARY_CAPACITY_X,
  MOD_BY_ID,
  MOD_INSTALL,
  OLD_DESIGN_DRIVE,
  OVERHAUL_SHARE,
  PASSAGE,
  REPLACEMENT_PART_SHARE,
  WEAR,
  YARD_DAYS,
  type CompartmentQuality,
  type CustomsOutcome,
  type ModDef,
  type ModLegality,
  type Push,
  type Tier,
  type Transponder,
} from '../data/shipLife.config';
import { FINE_SIZES } from '../data/economy.config';
import { shipClass, type ShipClass } from './ships';
import { basicRoll } from './rolls';
import { nextFloat, type RngState } from './rng';

// ---- the class ----

export interface ClassLifeView {
  drive: number | null;
  driveTier: Tier;
  cargoT: number;
  consumablesDays: number;
  crew: number;
  passengers: number;
  capacity: number;
  builtInCompartments: CompartmentQuality | null;
}

const military = (c: ShipClass): boolean => c.role !== 'freighter' && c.kind !== 'freighter';

/** The drive by the ruling (Jared, 23 Nov 2026): the class's own on record; else an old design keeps a slow one; else Class 2. */
export function baseDrive(c: ShipClass): { drive: number | null; tier: Tier } {
  const own = CLASS_LIFE[c.id];
  if (own) return { drive: own.drive, tier: own.driveTier };
  if (c.from !== null && c.from < MANDALORIAN_WARS_END && c.kind !== 'fighter') return { drive: OLD_DESIGN_DRIVE, tier: 'ruling' };
  return { drive: DRIVE_BY_KIND[c.kind], tier: 'invented' };
}

export function classLife(classId: string): ClassLifeView {
  const c = shipClass(classId);
  const own = CLASS_LIFE[classId] ?? null;
  const k = CLASS_LIFE_BY_KIND[c.kind];
  const d = baseDrive(c);
  return {
    drive: d.drive,
    driveTier: d.tier,
    cargoT: own?.cargoT ?? k.cargoT,
    consumablesDays: own?.consumablesDays ?? k.consumablesDays,
    crew: own?.crew ?? k.crew,
    passengers: own?.passengers ?? k.passengers,
    capacity: own?.capacity ?? Math.max(1, Math.round(k.capacity * (military(c) ? MILITARY_CAPACITY_X : 1))),
    builtInCompartments: own?.builtInCompartments ?? null,
  };
}

// ---- modifications ----

export const modsOf = (ids: readonly string[]): ModDef[] => ids.map((id) => MOD_BY_ID.get(id)).filter((m): m is ModDef => m !== undefined);
export const capacityUsed = (ids: readonly string[]): number => modsOf(ids).reduce((t, m) => t + m.points, 0);
export const overCapacity = (classId: string, ids: readonly string[]): number => Math.max(0, capacityUsed(ids) - classLife(classId).capacity);

export interface ShipEffects {
  driveSteps: number;
  speed: number;
  handling: number;
  shieldX: number;
  hullX: number;
  weapons: number;
  scan: number;
  astrogation: number;
  cargoX: number;
  compartment: CompartmentQuality | null;
  mask: number;
  transponderMask: boolean;
  jammer: number;
  illegal: { id: string; legality: ModLegality }[];
}

const COMPARTMENT_ORDER: readonly CompartmentQuality[] = ['basic', 'good', 'shielded'];
const better = (a: CompartmentQuality | null, b: CompartmentQuality | null | undefined): CompartmentQuality | null => (!b ? a : !a ? b : COMPARTMENT_ORDER.indexOf(b) > COMPARTMENT_ORDER.indexOf(a) ? b : a);

/** What the installed mods add up to (and the class's own compartments). */
export function shipEffects(classId: string, ids: readonly string[]): ShipEffects {
  const out: ShipEffects = { driveSteps: 0, speed: 0, handling: 0, shieldX: 1, hullX: 1, weapons: 0, scan: 0, astrogation: 0, cargoX: 1, compartment: classLife(classId).builtInCompartments, mask: 0, transponderMask: false, jammer: 0, illegal: [] };
  for (const m of modsOf(ids)) {
    const e = m.effect;
    out.driveSteps += e.driveStep ?? 0;
    out.speed += e.speed ?? 0;
    out.handling += e.handling ?? 0;
    out.shieldX *= e.shieldX ?? 1;
    out.hullX *= e.hullX ?? 1;
    out.weapons += e.weapons ?? 0;
    out.scan += e.scan ?? 0;
    out.astrogation += e.astrogation ?? 0;
    out.cargoX *= e.cargoX ?? 1;
    out.compartment = better(out.compartment, e.compartment);
    out.mask += e.mask ?? 0;
    out.transponderMask ||= e.transponderMask === true;
    out.jammer += e.jammer ?? 0;
    if (m.legality !== 'legal') out.illegal.push({ id: m.id, legality: m.legality });
  }
  return out;
}

/** The drive with its upgrades: each step one place faster on DRIVE_STEPS; null stays null (no hyperdrive to upgrade). */
export function driveOf(classId: string, ids: readonly string[]): number | null {
  const base = classLife(classId).drive;
  if (base === null) return null;
  const steps = shipEffects(classId, ids).driveSteps;
  if (!steps) return base;
  let i = DRIVE_STEPS.findIndex((d) => d <= base);
  if (i < 0) i = DRIVE_STEPS.length - 1;
  return DRIVE_STEPS[Math.min(DRIVE_STEPS.length - 1, i + steps)]!;
}

/** A mod's price on a ship (the larger of its share of the ship's price and its flat price), installed one of three ways. */
export function modQuote(m: ModDef, shipPrice: number, way: 'yard' | 'field' | 'kit'): { credits: number; hours: number; roll: boolean } {
  const parts = Math.round(Math.max(m.flat, m.share * shipPrice));
  if (way === 'kit') return { credits: Math.round(parts * MOD_INSTALL.kitX), hours: m.points * MOD_INSTALL.fieldHoursPerPoint, roll: false };
  if (way === 'field') return { credits: parts, hours: m.points * MOD_INSTALL.fieldHoursPerPoint, roll: true };
  return { credits: Math.round(parts * (1 + MOD_INSTALL.shipyardLabour)), hours: (MOD_INSTALL.yardDays + MOD_INSTALL.yardDaysPerPoint * m.points) * 24, roll: false };
}

/** How a mod can go in: a big one needs a shipyard; a small one a crew member's roll, a factory kit, or a shipyard. */
export function installWays(m: ModDef, atYard: boolean): ('yard' | 'field' | 'kit')[] {
  if (m.big) return atYard ? ['yard'] : [];
  return atYard ? ['yard', 'kit', 'field'] : ['kit', 'field'];
}

// ---- wear and breakdowns ----

export const wearAfter = (wear: number, w: { jumps?: number; months?: number; hullLost?: number }): number =>
  Math.min(1, Math.max(0, wear + (w.jumps ?? 0) * WEAR.perJump + (w.months ?? 0) * WEAR.perMonth + (w.hullLost ?? 0) * WEAR.perHullLost));

export interface BreakdownInput {
  wear: number;
  over: number;
  /** A system damaged or disabled now (running damaged). */
  damaged: boolean;
  patched: readonly string[];
}

/** The chance of a breakdown when pushed, and on an ordinary jump (zero unless badly worn or heavily over-modded). */
export function breakdownChance(b: BreakdownInput, cause: Push | 'jump'): number {
  if (cause === 'jump') {
    if (b.wear < WEAR.badly && b.over < BREAKDOWN.overHeavy) return 0;
    return Math.min(0.5, BREAKDOWN.jumpBase + Math.max(0, b.wear - WEAR.badly) * BREAKDOWN.jumpPerWear + Math.max(0, b.over - (BREAKDOWN.overHeavy - 1)) * BREAKDOWN.jumpPerOver);
  }
  return Math.min(0.9, BREAKDOWN.pushedBase + b.wear * BREAKDOWN.pushedPerWear + b.over * BREAKDOWN.pushedPerOver + (b.damaged || cause === 'runningDamaged' ? BREAKDOWN.pushedDamaged : 0));
}

export interface BreakdownResult {
  broke: boolean;
  /** The system that failed (the hyperdrive on a jump, else the engines, shields or a weapon). */
  system: string | null;
  hours: number;
  /** Field patches that gave way (back to damaged). */
  patchesFailed: string[];
  chance: number;
}

export function rollBreakdown(rng0: RngState, b: BreakdownInput, cause: Push | 'jump'): [BreakdownResult, RngState] {
  let rng = rng0;
  const chance = breakdownChance(b, cause);
  const patchesFailed: string[] = [];
  if (cause !== 'jump') {
    for (const p of b.patched) {
      const [u, r] = nextFloat(rng);
      rng = r;
      if (u < BREAKDOWN.patchFails) patchesFailed.push(p);
    }
  }
  const [u, r1] = nextFloat(rng);
  rng = r1;
  if (u >= chance) return [{ broke: false, system: null, hours: 0, patchesFailed, chance }, rng];
  const [v, r2] = nextFloat(rng);
  rng = r2;
  const pool = cause === 'jump' || cause === 'emergencyJump' ? ['hyperdrive'] : ['engines', 'shields', 'weapons', 'sensors'];
  const system = pool[Math.floor(v * pool.length) % pool.length]!;
  const [w, r3] = nextFloat(rng);
  rng = r3;
  const [lo, hi] = BREAKDOWN.hours;
  return [{ broke: true, system, hours: Math.round(lo + (hi - lo) * w), patchesFailed, chance }, rng];
}

// ---- shipyard ----

export type YardLevel = 'none' | 'light' | 'heavy' | 'crippled';
export const sizeOf = (classId: string): keyof typeof YARD_DAYS => {
  const k = shipClass(classId).kind;
  return k === 'fighter' ? 'fighter' : k === 'freighter' ? 'freighter' : k === 'corvette' ? 'corvette' : 'capital';
};

/** The damage a shipyard prices: by hull left and the worst system state. */
export function yardLevel(hullShare: number, systems: Readonly<Record<string, string>>): YardLevel {
  const states = Object.values(systems);
  if (hullShare < 0.3 || states.includes('destroyed')) return 'crippled';
  if (hullShare < 0.7 || states.includes('disabled')) return 'heavy';
  if (hullShare < 1 || states.includes('damaged')) return 'light';
  return 'none';
}

/** A shipyard's quote: the economy's repair share of the price by damage, parts for destroyed systems, days by size. */
export function yardQuote(classId: string, price: number, hullShare: number, systems: Readonly<Record<string, string>>, repairShare: Readonly<Record<'light' | 'heavy' | 'crippled', number>>): { level: YardLevel; credits: number; days: number } {
  const level = yardLevel(hullShare, systems);
  if (level === 'none') return { level, credits: 0, days: 0 };
  const destroyed = Object.values(systems).filter((v) => v === 'destroyed').length;
  const days = YARD_DAYS[sizeOf(classId)][level === 'light' ? 0 : level === 'heavy' ? 1 : 2];
  return { level, credits: Math.round(price * repairShare[level] + destroyed * price * REPLACEMENT_PART_SHARE), days };
}
export const overhaulQuote = (classId: string, price: number): { credits: number; days: number } => ({ credits: Math.round(price * OVERHAUL_SHARE), days: YARD_DAYS[sizeOf(classId)][0] });

// ---- travel ----

/** The astrogation DC of a leg in a region (the slower end's). */
export function legDc(region: string): number {
  const r = region.toLowerCase();
  const key = /deep core/.test(r) ? 'deep' : /^core/.test(r) ? 'core' : /colonies|inner rim/.test(r) ? 'colonies' : /expansion|mid rim/.test(r) ? 'mid' : /outer rim|hutt/.test(r) ? 'outer' : /wild|unknown/.test(r) ? 'wild' : 'mid';
  return ASTROGATION.legDc[key]!;
}
export const offRouteLegs = (squares: number): number => Math.max(ASTROGATION.minLegs, squares);

export interface LegRoll {
  total: number;
  dc: number;
  ok: boolean;
  misjump: boolean;
}

/** One astrogation roll a leg off the charted routes; a failure is a reversion (hours lost), failed badly a misjump (a hazard). */
export function rollLegs(rng0: RngState, level: number, bonus: number, legs: number, dc: number): { legs: LegRoll[]; extraHours: number; misjump: boolean; rng: RngState } {
  let rng = rng0;
  const out: LegRoll[] = [];
  let extra = 0;
  for (let i = 0; i < legs; i++) {
    const [roll, r] = basicRoll(rng, level, bonus ? [{ source: 'astrogation aids', value: bonus }] : []);
    rng = r;
    const ok = roll.total >= dc;
    const misjump = !ok && dc - roll.total >= ASTROGATION.misjumpBy;
    if (!ok) {
      const [u, r2] = nextFloat(rng);
      rng = r2;
      const [lo, hi] = ASTROGATION.reversionHours;
      extra += lo + (hi - lo) * u;
    }
    out.push({ total: Math.round(roll.total * 10) / 10, dc, ok, misjump });
  }
  return { legs: out, extraHours: Math.round(extra * 4) / 4, misjump: out.some((l) => l.misjump), rng };
}

/** Passage on a liner or freighter for those without a ship: by distance and berth (invented). */
export const passagePrice = (squares: number, berth: keyof typeof PASSAGE.base): number => Math.round(PASSAGE.base[berth] + PASSAGE.perSquare[berth] * Math.max(0, squares));

// ---- customs ----

export interface CustomsInput {
  zone: string;
  atWar: boolean;
  flagged: boolean;
  /** The character's standing with whoever holds the world: 'jedi' (in Republic space), 'member', 'enemy', or none. */
  standing: 'jedi' | 'member' | 'enemy' | null;
  /** Ship renown (0-100): a famous ship draws attention. */
  renown: number;
  inspector: 'port' | 'police' | 'military';
  transponder: Transponder;
  /** The original owner reported it stolen and the transponder still reads it. */
  reportedStolen: boolean;
  effects: ShipEffects;
  contrabandUnits: number;
  contrabandHidden: number;
  /** The crew's bluff: the player's Charisma level. */
  bluff: number;
  /** The player said to run (a chase if anything is found worth stopping them for). */
  run: boolean;
  /** Seed share for a corrupt inspector (0-1). */
  corruptU: number;
}

export interface CustomsResult {
  checked: boolean;
  chance: number;
  thorough: boolean;
  scan: number;
  conceal: number;
  found: string[];
  outcome: CustomsOutcome;
  fine: number;
  bribe: number;
  /** Caught: the ship is flagged until its ID changes. */
  flag: boolean;
}

export function customsChance(i: Pick<CustomsInput, 'zone' | 'atWar' | 'flagged' | 'standing' | 'renown'>): number {
  let p = CUSTOMS_DENSITY[i.zone] ?? CUSTOMS_DENSITY['mid']!;
  if (i.atWar) p *= CUSTOMS.warX;
  if (i.flagged) p *= CUSTOMS.flaggedX;
  if (i.standing) p *= CUSTOMS.standingX[i.standing] ?? 1;
  p *= 1 + Math.max(0, i.renown) / 200;
  return Math.min(CUSTOMS.cap, p);
}

/**
 * The check (design notes, Customs and scans): the inspector's scan skill and equipment against concealment (compartment
 * quality, sensor masking, the crew's bluff). A transponder check catches a missing ID always and a stolen ship's old one; a
 * police or military scan for a true identity catches an altered one when it beats the work. Compartments beat a basic search,
 * not a thorough boarding inspection (a military check, a flagged ship, or a bluff failed by 5).
 */
export function runCustoms(rng0: RngState, i: CustomsInput): [CustomsResult, RngState] {
  let rng = rng0;
  const chance = customsChance(i);
  const [u, r0] = nextFloat(rng);
  rng = r0;
  const none: CustomsResult = { checked: false, chance, thorough: false, scan: 0, conceal: 0, found: [], outcome: 'clear', fine: 0, bribe: 0, flag: false };
  if (u >= chance) return [none, rng];
  const ins = CUSTOMS.inspectors[i.inspector];
  const [scanRoll, r1] = basicRoll(rng, ins.level, [{ source: 'scan gear', value: ins.gear }]);
  const [bluffRoll, r2] = basicRoll(r1, i.bluff, []);
  rng = r2;
  const thorough = i.inspector === 'military' || i.flagged || scanRoll.total - bluffRoll.total >= 5;
  const comp = i.effects.compartment ? CUSTOMS.compartment[i.effects.compartment] : 0;
  const compUsed = thorough ? (i.effects.compartment === 'shielded' ? comp * CUSTOMS.thoroughShielded : 0) : comp;
  const scan = Math.round(scanRoll.total * 10) / 10;
  const conceal = Math.round((bluffRoll.total + i.effects.mask) * 10) / 10;
  const found: string[] = [];
  // The ID first: every check reads the transponder.
  if (i.transponder === 'missing') found.push('no transponder');
  else if (i.reportedStolen && i.transponder === 'real') found.push('a ship reported stolen');
  else if (i.transponder === 'altered' && ins.trueId && scan >= CUSTOMS.alteredRating + (i.effects.transponderMask ? 4 : 0)) found.push('an altered transponder');
  // Illegal gear: found when the scan beats the masking and the bluff.
  if (scan > conceal) for (const m of i.effects.illegal) found.push(m.legality === 'military' ? `military-grade gear (${m.id})` : `illegal gear (${m.id})`);
  // Cargo: what is in the open hold is found by any search that beats the bluff; what is hidden, only past the compartment.
  const open = i.contrabandUnits - i.contrabandHidden;
  if (open > 0 && scan > bluffRoll.total) found.push(`${open} units of contraband in the hold`);
  if (i.contrabandHidden > 0 && scan > conceal + compUsed) found.push(`${i.contrabandHidden} units of contraband in a hidden compartment`);
  const units = (open > 0 && scan > bluffRoll.total ? open : 0) + (i.contrabandHidden > 0 && scan > conceal + compUsed ? i.contrabandHidden : 0);
  const idProblem = found.some((f) => /transponder|stolen/.test(f));
  const idGear = i.effects.illegal.some((m) => m.id === 'transponderMask') && found.some((f) => /transponderMask/.test(f));
  let outcome: CustomsOutcome = 'clear';
  let fine = 0;
  if (found.length) {
    if (i.reportedStolen && found.includes('a ship reported stolen')) outcome = 'arrest';
    else if (idProblem || idGear) outcome = 'impoundShip';
    else if (units >= CUSTOMS.majorUnits) outcome = 'impoundCargo';
    else outcome = 'fine';
    fine = outcome === 'fine' ? FINE_SIZES.fair : outcome === 'impoundCargo' ? FINE_SIZES.large : outcome === 'impoundShip' ? FINE_SIZES.large : 0;
    if (outcome === 'fine' && i.corruptU < CUSTOMS.corruptShare) outcome = 'bribe';
    if (i.run && outcome !== 'fine' && outcome !== 'bribe') outcome = 'chase';
  }
  const bribe = outcome === 'bribe' ? Math.round(FINE_SIZES.fair * CUSTOMS.bribeShare) : 0;
  return [{ checked: true, chance, thorough, scan, conceal, found, outcome, fine: outcome === 'bribe' || outcome === 'chase' ? 0 : fine, bribe, flag: found.length > 0 }, rng];
}

// ---- reading a ship class from plain words ----

const SKIP_WORDS = ['class', 'starfighter', 'cruiser', 'frigate', 'destroyer', 'corvette', 'freighter', 'bomber', 'tactical', 'light', 'stock'];
function shortNames(c: ShipClass): string[] {
  const n = c.name.toLowerCase();
  const out = new Set<string>([n, c.id.toLowerCase()]);
  const m = n.match(/^(?:the\s+)?([a-z0-9' -]+?)-class/);
  if (m) out.add(m[1]!.trim());
  for (const w of n.replace(/-class.*/, '').split(/\s+/)) if (w.length >= 4 && !SKIP_WORDS.includes(w)) out.add(w.replace(/^the$/, ''));
  if (c.id === 'xsFreighter') out.add('xs');
  out.delete('');
  return [...out];
}
/** Plain words for a generic ship ("a light freighter", "a fighter"), the cheapest such class in service is meant. */
const GENERIC: readonly (readonly [RegExp, string])[] = [
  [/\bfreighter|transport|hauler\b/, 'freighter'],
  [/\bfighter|interceptor|snubfighter\b/, 'fighter'],
  [/\bcorvette\b/, 'corvette'],
];

/**
 * The ship class plain words name, in service in the year: a named class first (longest match), else a generic kind's cheapest
 * class in service (the price is the caller's). Null = the words name no ship; a reject = a class not in service.
 */
export function matchShipClass(text: string, year: number, classes: readonly ShipClass[], priceOf: (c: ShipClass) => number): { classId: string } | { reject: string } | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9' -]/g, ' ')} `;
  const named = classes
    .map((c) => ({ c, hit: shortNames(c).filter((n) => new RegExp(`[^a-z0-9]${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^a-z0-9]`).test(t)).sort((a, b) => b.length - a.length)[0] }))
    .filter((x) => x.hit)
    .sort((a, b) => b.hit!.length - a.hit!.length);
  if (named.length) {
    const inYear = named.find((x) => (x.c.from === null || year >= x.c.from) && (x.c.to === null || year <= x.c.to));
    return inYear ? { classId: inYear.c.id } : { reject: `${named[0]!.c.name} is not in service in ${year < 0 ? `${-year} BBY` : `${year} ABY`}` };
  }
  const kind = GENERIC.find(([re]) => re.test(t))?.[1];
  if (!kind) return null;
  const pick = classes.filter((c) => c.kind === kind && c.name.slice(0, 4) !== 'the ' && (c.from === null || year >= c.from) && (c.to === null || year <= c.to)).sort((a, b) => priceOf(a) - priceOf(b))[0];
  return pick ? { classId: pick.id } : { reject: `no ${kind} class is on record in ${year < 0 ? `${-year} BBY` : `${year} ABY`}` };
}
