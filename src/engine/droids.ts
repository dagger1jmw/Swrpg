// Droid rules (M8 checklist item 7; docs-v2/spec/droids.md). Pure: no DOM, no network, no state. Droids are data (a model
// plus the unit's own history); their skills come from programming, modules and a little learning while unwiped; their
// personality grows with the years since the last wipe; they take damage on systems by location, like ships, and are
// repaired, never healed; ion weapons and Ionize disable them.
import {
  BOLT_BREAK,
  CLASS_SKILLS,
  COPILOT,
  DAMAGE_STEPS,
  DESTROYED_LOCATIONS,
  DROID_LOCATIONS,
  DROID_REPAIR,
  DROID_SHIELD,
  DROID_SKILLS,
  FAILED_PARTS_LOST,
  IMPOUND_FEE_SHARE,
  ION,
  LEARNING,
  LOCATION_WEIGHT,
  MODULES,
  PAST_YEARS,
  PERSONALITY,
  PERSONALITY_STAGES,
  QUIRKS,
  REFUSES_AT_REGARD,
  REGARD,
  REPAIR_HOURS,
  REPROGRAM,
  SHOP,
  SKILL_CAP,
  SKILL_LOCATION,
  STATE_FACTOR,
  SYSTEM_STATES,
  TOUGHNESS,
  UNPRICED_VALUE,
  USED_SHARE,
  type DroidHow,
  type DroidLocation,
  type DroidSkill,
  type ModuleTier,
  type PersonalityStage,
  type SystemState,
} from '../data/droids.config';
import { DROID_MODEL_BY_ID, DROID_MODELS, GENERIC_DROID_ROWS, KIND_OF_MODEL, type DroidKind, type DroidModel } from '../data/droidModels';
import { DAYS_PER_YEAR } from './calendar';

// ---------------------------------------------------------------- the unit

/** One droid: a copy of its model plus its own history (spec §1). Days are absolute calendar days. */
export interface DroidUnit {
  id: string;
  modelId: string;
  /** Name or designation. */
  name: string;
  /** For its quirks (stable across saves). */
  seed: string;
  how: DroidHow;
  acquiredDay: number;
  /** The day of its last memory wipe (before acquisition for a droid with a past; the factory day for a new one). */
  wipedDay: number;
  modules: { skill: DroidSkill; gain: number }[];
  /** Skills added by reprogramming (rated from REPROGRAM.start). */
  reprogrammed: DroidSkill[];
  systems: Partial<Record<DroidLocation, SystemState>>;
  /** Absolute seconds until an ion overload wears off; null when not ionized. */
  disabledUntil: number | null;
  /** Hits its shield can still stop (a shielded model). */
  shieldStops: number;
  bolt: boolean;
  /** How it regards its owner, -5..5 (spec §4). */
  regard: number;
  impounded: boolean;
  /** Taken from its rightful owner (sold only to a fence). */
  stolen: boolean;
}

export const modelOf = (u: Pick<DroidUnit, 'modelId'>): DroidModel => {
  const m = DROID_MODEL_BY_ID.get(u.modelId);
  if (!m) throw new Error(`Unknown droid model ${u.modelId}`);
  return m;
};

// ---------------------------------------------------------------- models by date (spec §1)

/** Whether a model is made and sold in a calendar year. */
export const modelInService = (m: Pick<DroidModel, 'from' | 'to'>, year: number): boolean => (m.from === null || year >= m.from) && (m.to === null || year <= m.to);

/** The models in service in a year (generic stand-ins only when asked). */
export const modelsInService = (year: number, generic = false): DroidModel[] => DROID_MODELS.filter((m) => modelInService(m, year) && (generic || !m.generic));

/** The date's model of a kind: the cheapest named model in service (a common one), else the generic stand-in. */
export function modelForKind(kind: DroidKind, year: number): DroidModel {
  const named = modelsInService(year).filter((m) => KIND_OF_MODEL(m) === kind && m.price !== null).sort((a, b) => a.price! - b.price!);
  return named[0] ?? DROID_MODELS.find((m) => m.generic === kind)!;
}

/** The catalog row id of a model (economyPrices builds a row for each sold model). */
export const priceRowOf = (m: Pick<DroidModel, 'id'>): string => `droid:${m.id}`;

/** The model a catalog row means at a date: a model's own row, or a generic row's model of that kind. Null for a non-droid row. */
export function modelForPriceRow(rowId: string, year: number): DroidModel | null {
  if (rowId.startsWith('droid:')) return DROID_MODEL_BY_ID.get(rowId.slice(6)) ?? null;
  const kind = GENERIC_DROID_ROWS[rowId];
  return kind ? modelForKind(kind, year) : null;
}

const words = (t: string): string[] => t.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);
/** The model the narrator named: its id, its name, or its designation (T3, R2, GE3); null when none matches. */
export function resolveModel(text: string): DroidModel | null {
  const t = text.trim().toLowerCase();
  const byId = DROID_MODELS.find((m) => m.id.toLowerCase() === t);
  if (byId) return byId;
  const ws = words(text.replace(/-/g, ''));
  const named = DROID_MODELS.filter((m) => !m.generic)
    .map((m) => ({ m, key: words(m.name.replace(/-/g, ''))[0]! }))
    .filter(({ key }) => /\d/.test(key) && ws.includes(key));
  if (named.length) return named[0]!.m;
  const full = DROID_MODELS.find((m) => !m.generic && words(m.name).every((w) => ws.includes(w)));
  if (full) return full;
  const kind = (['protocol', 'astromech', 'medical', 'labour', 'security'] as const).find((k) => ws.includes(k) || (k === 'labour' && ws.includes('labor')));
  return kind ? DROID_MODELS.find((m) => m.generic === kind)! : null;
}

/** Why a model cannot be had at this date (bought, or met), or null. */
export function modelRefusal(m: DroidModel, year: number, buying: boolean): string | null {
  if (!modelInService(m, year)) return `no ${m.name} units in ${year < 0 ? `${-year} BBY` : `${year} ABY`}: the model is made ${m.from === null ? '' : `from ${m.from < 0 ? `${-m.from} BBY` : `${m.from} ABY`}`}${m.to === null ? '' : ` to ${m.to < 0 ? `${-m.to} BBY` : `${m.to} ABY`}`}`;
  if (buying && m.price === null) return `${m.name} units are not sold`;
  return null;
}

/** The price of a model, new or second-hand (null: not sold). */
export const modelPrice = (m: DroidModel, used = false): number | null => (m.price === null ? null : Math.round(m.price * (used ? USED_SHARE : 1)));
/** The value parts are priced from (a model not sold has a nominal value). */
export const partsValue = (m: DroidModel): number => m.price ?? UNPRICED_VALUE;
export const impoundFee = (m: DroidModel): number => Math.round(partsValue(m) * IMPOUND_FEE_SHARE);

// ---------------------------------------------------------------- a new unit

/** Years since its last wipe for a droid with a past, from a draw u in [0,1) (spec §4). */
export function pastYears(how: DroidHow, u: number): number {
  if (how === 'bought') return 0;
  const [lo, hi] = PAST_YEARS[how];
  return lo + (hi - lo) * u;
}

export function newDroid(m: DroidModel, o: { id: string; name: string; seed: string; how: DroidHow; day: number; pastYears?: number; stolen?: boolean }): DroidUnit {
  return {
    id: o.id,
    modelId: m.id,
    name: o.name,
    seed: o.seed,
    how: o.how,
    acquiredDay: o.day,
    wipedDay: o.day - Math.round((o.pastYears ?? 0) * DAYS_PER_YEAR),
    modules: [],
    reprogrammed: [],
    systems: {},
    disabledUntil: null,
    shieldStops: m.shield ? DROID_SHIELD.stops : 0,
    bolt: false,
    regard: 0,
    impounded: false,
    stolen: o.stolen ?? false,
  };
}

// ---------------------------------------------------------------- skills (spec §3)

/** The model's factory programming: its class's skills (and a second class's), the model's own ratings over them (0 = none). */
export function factorySkills(m: DroidModel): Partial<Record<DroidSkill, number>> {
  const out: Partial<Record<DroidSkill, number>> = { ...CLASS_SKILLS[m.cls] };
  if (m.also) for (const [k, v] of Object.entries(CLASS_SKILLS[m.also])) out[k as DroidSkill] = Math.max(out[k as DroidSkill] ?? 0, v * 0.8);
  for (const [k, v] of Object.entries(m.skills ?? {})) {
    if (v <= 0) delete out[k as DroidSkill];
    else out[k as DroidSkill] = v;
  }
  return out;
}

const inClass = (m: DroidModel, s: DroidSkill): boolean => CLASS_SKILLS[m.cls][s] !== undefined || (m.also !== undefined && CLASS_SKILLS[m.also][s] !== undefined);
export const skillCap = (m: DroidModel, s: DroidSkill): number => (inClass(m, s) ? SKILL_CAP.inClass : SKILL_CAP.offClass);

export const yearsUnwiped = (u: Pick<DroidUnit, 'wipedDay'>, day: number): number => Math.max(0, (day - u.wipedDay) / DAYS_PER_YEAR);
/** What it has learned from experience since its last wipe, on its programmed skills (spec §3). */
export const learnedBonus = (u: Pick<DroidUnit, 'wipedDay'>, day: number): number => LEARNING.most * (1 - Math.exp(-yearsUnwiped(u, day) / LEARNING.years));

/** The skills it has on paper: programming, reprogramming, modules and learning, capped; damage not counted. */
export function ratedSkills(u: DroidUnit, day: number): Partial<Record<DroidSkill, number>> {
  const m = modelOf(u);
  const base = factorySkills(m);
  const own = new Set<DroidSkill>(Object.keys(base) as DroidSkill[]);
  for (const s of u.reprogrammed) if (!own.has(s)) base[s] = REPROGRAM.start;
  const learn = learnedBonus(u, day);
  const out: Partial<Record<DroidSkill, number>> = {};
  for (const s of DROID_SKILLS) {
    if (base[s] === undefined) continue;
    const mods = u.modules.filter((x) => x.skill === s).reduce((a, x) => a + x.gain, 0);
    out[s] = Math.min(skillCap(m, s), base[s]! + mods + (own.has(s) ? learn : 0));
  }
  return out;
}

/** A skill as it works now: its rating times what damage leaves of the location that serves it; nothing while disabled. */
export function skillNow(u: DroidUnit, s: DroidSkill, day: number, nowSec: number): number {
  const r = ratedSkills(u, day)[s] ?? 0;
  if (droidStatus(u, nowSec) === 'disabled' || droidStatus(u, nowSec) === 'destroyed') return 0;
  return r * STATE_FACTOR[u.systems[SKILL_LOCATION[s]] ?? 'working'];
}

/** A module or reprogramming job: its price, the check's rating, whether it is big (a shop), or why it cannot be done. */
export function upgradeJob(u: DroidUnit, job: { kind: 'module'; skill: DroidSkill; tier: ModuleTier } | { kind: 'reprogram'; skill: DroidSkill }, shop: boolean, day: number): { refusal: string | null; price: number; rating: number; big: boolean } {
  const m = modelOf(u);
  const has = ratedSkills(u, day)[job.skill] !== undefined;
  if (job.kind === 'reprogram') {
    const r = { price: REPROGRAM.price, rating: REPROGRAM.dc, big: REPROGRAM.big };
    if (has) return { refusal: `${u.name} is already programmed for ${job.skill}: a module raises it`, ...r };
    return { refusal: !shop ? 'reprogramming is a big job: it needs a droid shop' : null, ...r };
  }
  const t = MODULES[job.tier];
  const r = { price: t.price, rating: t.dc, big: t.big };
  if (!has) return { refusal: `${u.name} has no ${job.skill} programming: reprogram it first (a shop)`, ...r };
  if ((ratedSkills(u, day)[job.skill] ?? 0) >= skillCap(m, job.skill) - 1e-9) return { refusal: `${u.name}'s ${job.skill} is at the most its chassis takes (${skillCap(m, job.skill)})`, ...r };
  if (t.big && !shop) return { refusal: `an ${job.tier} module is a big job: it needs a droid shop`, ...r };
  return { refusal: null, ...r };
}

/** The level that rolls a job: the character's Repair stand-in, or at a shop the better of it and the shop's technician. */
export const jobLevel = (own: number, shop: boolean): number => (shop ? Math.max(own, SHOP.technician) : own);
/** What a job costs: parts, and a shop's labour; a failure loses part of the parts. */
export function jobCost(price: number, shop: boolean, success: boolean): number {
  const parts = success ? price : Math.round(price * FAILED_PARTS_LOST);
  return parts + (shop ? Math.round(price * SHOP.labour) : 0);
}

export function withModule(u: DroidUnit, skill: DroidSkill, tier: ModuleTier): DroidUnit {
  return { ...u, modules: [...u.modules, { skill, gain: MODULES[tier].gain }], regard: clampRegard(u.regard + REGARD.upgraded) };
}
export const withReprogram = (u: DroidUnit, skill: DroidSkill): DroidUnit => ({ ...u, reprogrammed: [...u.reprogrammed, skill] });

// ---------------------------------------------------------------- memory and personality (spec §4)

/** How far its personality has grown, 0..1, from the years since its last wipe and its model's drift. */
export function personalityP(u: DroidUnit, day: number): number {
  return 1 - Math.exp((-yearsUnwiped(u, day) * (modelOf(u).drift ?? 1)) / PERSONALITY.tauYears);
}

export function personalityStage(p: number): PersonalityStage {
  let s: PersonalityStage = 'basic';
  for (const x of PERSONALITY_STAGES) if (p >= x.from) s = x.stage;
  return s;
}

const hash = (t: string): number => {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return h >>> 0;
};
/** Its quirks: one for each stage past basic, chosen by its seed and its last wipe (a wipe gives new ones in time). */
export function quirksOf(u: DroidUnit, day: number): string[] {
  const n = PERSONALITY_STAGES.findIndex((x) => x.stage === personalityStage(personalityP(u, day)));
  const out: string[] = [];
  for (let i = 0; out.length < n && i < 64; i++) {
    const q = QUIRKS[hash(`${u.seed}:${u.wipedDay}:${i}`) % QUIRKS.length]!;
    if (!out.includes(q)) out.push(q);
  }
  return out;
}

/** Whether it is a full companion (a full personality): only a droid that is not fresh from the factory gets there. */
export const isFullCompanion = (u: DroidUnit, day: number): boolean => personalityStage(personalityP(u, day)) === 'full';

/** How it regards its owner, in words (only once it has opinions; before that it obeys its programming). */
export function regardText(u: DroidUnit, day: number): string {
  const stage = personalityStage(personalityP(u, day));
  if (stage === 'basic' || stage === 'quirks') return 'follows its programming';
  return u.regard >= 3 ? 'loyal' : u.regard >= 1 ? 'friendly' : u.regard <= -3 ? 'resentful' : u.regard <= -1 ? 'wary' : 'neutral';
}

const clampRegard = (r: number): number => Math.max(REGARD.min, Math.min(REGARD.max, r));
export const withRegard = (u: DroidUnit, d: number): DroidUnit => ({ ...u, regard: clampRegard(u.regard + d) });

/**
 * A memory wipe: personality, quirks and learning back to factory programming (its modules and reprogramming are hardware
 * and stay). Not a dark-side act (Jared): it changes nothing outside the droid.
 */
export const wiped = (u: DroidUnit, day: number): DroidUnit => ({ ...u, wipedDay: day, regard: 0 });

// ---------------------------------------------------------------- restraining bolts (spec §4)

/** The chance a bolted droid breaks it when made to obey (0 for most droids). */
export function boltBreakChance(u: DroidUnit, day: number): number {
  const stage = personalityStage(personalityP(u, day));
  const own = modelOf(u).resistsBolt ? BOLT_BREAK.resistant : 0;
  const mind = stage === 'full' ? BOLT_BREAK.full : stage === 'independent' ? BOLT_BREAK.independent : 0;
  return Math.max(own, mind);
}

/**
 * An order. With a bolt it obeys, unless the roll u breaks the bolt (it then acts freely and the bolt is gone). Without a bolt a
 * droid with independent judgement or more refuses an order against its will when it does not regard its owner well.
 */
export function orderOutcome(u: DroidUnit, day: number, against: boolean, roll: number): { obeys: boolean; broke: boolean } {
  if (u.bolt) {
    const broke = roll < boltBreakChance(u, day);
    return { obeys: !broke, broke };
  }
  const stage = personalityStage(personalityP(u, day));
  const free = stage === 'independent' || stage === 'full';
  return { obeys: !(against && free && u.regard <= REFUSES_AT_REGARD), broke: false };
}

// ---------------------------------------------------------------- damage (spec §5)

export type DroidStatus = 'working' | 'damaged' | 'disabled' | 'destroyed';

/** Its overall state: destroyed (processor gone, or three locations), disabled (ionized, or motivator or processor down), damaged, working. */
export function droidStatus(u: Pick<DroidUnit, 'systems' | 'disabledUntil'>, nowSec: number): DroidStatus {
  const st = (l: DroidLocation): SystemState => u.systems[l] ?? 'working';
  const destroyed = DROID_LOCATIONS.filter((l) => st(l) === 'destroyed').length;
  if (st('processor') === 'destroyed' || destroyed >= DESTROYED_LOCATIONS) return 'destroyed';
  if ((u.disabledUntil !== null && u.disabledUntil > nowSec) || ['disabled', 'destroyed'].includes(st('motivator')) || st('processor') === 'disabled') return 'disabled';
  return DROID_LOCATIONS.some((l) => st(l) !== 'working') ? 'damaged' : 'working';
}

/** Where a hit lands, from a draw u in [0,1); a droid with no weapons spreads that share over the rest. */
export function hitLocation(m: DroidModel, u: number): DroidLocation {
  const locs = DROID_LOCATIONS.filter((l) => l !== 'weapons' || m.weapon !== undefined);
  const total = locs.reduce((a, l) => a + LOCATION_WEIGHT[l], 0);
  let x = u * total;
  for (const l of locs) {
    x -= LOCATION_WEIGHT[l];
    if (x < 0) return l;
  }
  return locs[locs.length - 1]!;
}

/** Steps of damage from a hit's power against the chassis: 0 (a graze off the plating) to 3. */
export function damageSteps(power: number, m: DroidModel): number {
  const r = power / TOUGHNESS[m.chassis];
  return r < DAMAGE_STEPS.graze ? 0 : r < DAMAGE_STEPS.one ? 1 : r < DAMAGE_STEPS.two ? 2 : 3;
}
const worse = (s: SystemState, steps: number): SystemState => SYSTEM_STATES[Math.min(SYSTEM_STATES.length - 1, SYSTEM_STATES.indexOf(s) + steps)]!;

export type DroidHitKind = 'physical' | 'ion' | 'ionize';
export interface DroidHit {
  kind: DroidHitKind;
  /** A physical hit: the weapon's base damage times the hit's quality; ion: the weapon's ion power; Ionize: the caster's Force Output. */
  power: number;
  /** Ionize: the caster's margin on the roll. */
  margin?: number;
}
export interface DroidHitResult {
  unit: DroidUnit;
  location: DroidLocation | null;
  steps: number;
  stoppedByShield: boolean;
  disabledMinutes: number;
  note: string;
}

/** A hit on a droid (spec §5): a shield stops it while it holds; ion and Ionize disable; a physical hit damages one location. */
export function applyDroidHit(u: DroidUnit, hit: DroidHit, nowSec: number, u1: number): DroidHitResult {
  const m = modelOf(u);
  if (hit.kind !== 'physical') {
    // Ion drains a shield at once, then overloads the droid.
    const minutes = Math.round(Math.max(ION.minMinutes, Math.min(ION.maxMinutes, (ION.minutesPerPower * hit.power) / TOUGHNESS[m.chassis])));
    const fry = hit.kind === 'ionize' && (hit.margin ?? 0) >= ION.ionizeDamageMargin;
    const systems = fry ? { ...u.systems, processor: worse(u.systems.processor ?? 'working', 1) } : u.systems;
    // No 0 floor: dates before year 0 are negative seconds.
    const until = Math.max(u.disabledUntil ?? -Infinity, nowSec + minutes * 60);
    const unit = { ...u, systems, disabledUntil: until, shieldStops: 0 };
    return { unit, location: fry ? 'processor' : null, steps: fry ? 1 : 0, stoppedByShield: false, disabledMinutes: minutes, note: `${u.name} is overloaded by ${hit.kind === 'ionize' ? 'Ionize' : 'an ion blast'}: disabled ${minutes} min${fry ? ', its processor damaged' : ''} (no wound)` };
  }
  if (m.shield && u.shieldStops > 0) {
    return { unit: { ...u, shieldStops: u.shieldStops - 1 }, location: null, steps: 0, stoppedByShield: true, disabledMinutes: 0, note: `${u.name}'s shield stops the hit (${u.shieldStops - 1} more before it drops)` };
  }
  const location = hitLocation(m, u1);
  const steps = damageSteps(hit.power, m);
  if (steps === 0) return { unit: u, location, steps, stoppedByShield: false, disabledMinutes: 0, note: `the hit glances off ${u.name}'s plating` };
  const to = worse(u.systems[location] ?? 'working', steps);
  const unit = { ...u, systems: { ...u.systems, [location]: to } };
  return { unit, location, steps, stoppedByShield: false, disabledMinutes: 0, note: `${u.name}: ${location} ${to} (${droidStatus(unit, nowSec)}; repaired, never healed)` };
}

/** A shield back up after its recharge (minutes since it dropped or was last hit). */
export const shieldRecharged = (u: DroidUnit): DroidUnit => (modelOf(u).shield ? { ...u, shieldStops: DROID_SHIELD.stops } : u);

/** The repair of one location by a step: parts, the check's rating, a big job (a shop), hours. Null when it works. */
export function repairJob(u: DroidUnit, loc: DroidLocation): { price: number; rating: number; big: boolean; hours: number; from: SystemState } | null {
  const s = u.systems[loc] ?? 'working';
  if (s === 'working') return null;
  const r = DROID_REPAIR[s];
  return { price: Math.round(partsValue(modelOf(u)) * r.share), rating: r.dc, big: r.big, hours: REPAIR_HOURS[s], from: s };
}

/** A location repaired all the way (a destroyed part replaced, a disabled one fixed). */
export function repaired(u: DroidUnit, loc: DroidLocation): DroidUnit {
  const { [loc]: _gone, ...systems } = u.systems;
  return { ...u, systems, regard: clampRegard(u.regard + REGARD.repaired) };
}

/** The locations that need work, worst first. */
export const damagedLocations = (u: DroidUnit): DroidLocation[] =>
  DROID_LOCATIONS.filter((l) => (u.systems[l] ?? 'working') !== 'working').sort((a, b) => SYSTEM_STATES.indexOf(u.systems[b]!) - SYSTEM_STATES.indexOf(u.systems[a]!));

// ---------------------------------------------------------------- companions and roles (spec §6)

/** What the ship rules (checklist item 13) read from an astromech aboard: astrogation, in-flight repair, a co-pilot bonus. */
export interface AstromechHooks {
  /** The droid's astrogation now (0 when its processor is down or it is disabled). */
  astrogation: number;
  /** In-flight repair: its repair now. */
  repair: number;
  /** A co-pilot's bonus on the pilot's checks (+0 to +4). */
  copilot: number;
  /** Plugs into a starfighter's socket (the T3's interface): it can ride a fighter. */
  starfighterInterface: boolean;
}

export function astromechHooks(u: DroidUnit, day: number, nowSec: number): AstromechHooks {
  const m = modelOf(u);
  const astrogation = skillNow(u, 'astrogation', day, nowSec);
  const repair = skillNow(u, 'repair', day, nowSec);
  const copilot = Math.min(COPILOT.most, Math.floor(Math.max(astrogation, skillNow(u, 'piloting', day, nowSec)) / COPILOT.per));
  return { astrogation, repair, copilot, starfighterInterface: Boolean(m.starfighterInterface) && droidStatus(u, nowSec) !== 'destroyed' };
}

/** A ship's crew with an astromech aboard: the better repair of the crew and the droid (ships.ts Crew). */
export function crewWithAstromech<C extends { repair: number }>(crew: C, hooks: AstromechHooks): C {
  return { ...crew, repair: Math.max(crew.repair, hooks.repair) };
}


// ---------------------------------------------------------------- players (spec §6)

/** Players can't play a droid (Jared): droids are companions and NPCs only. */
export const playerDroidRefusal = (speciesId: string, npc: boolean): string | null =>
  !npc && speciesId.toLowerCase() === 'droid' ? 'Players cannot play a droid: droids are companions and NPCs only.' : null;
