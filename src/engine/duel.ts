// Duels: exchanges and the advantage track (rolls.md §3-6; D-143..D-154). Pure; randomness from the seeded RNG.
// Side A is the player (or the first fighter in tests); B is the current target among A's opponents. Other engaged
// opponents add the numbers modifier (rolls §5) and never attack separately; opponents engaged elsewhere (fighting an
// ally, D-143 E) neither attack nor count. The engine never asks the AI anything: every roll, hit and wound is here.
import {
  ADVANTAGE_MAX,
  BEAT_EVERY,
  BEAT_TRACK,
  BUILD_UP,
  CIRCUMSTANCE,
  CONTROLLED_ACCIDENT,
  CUT_DOWN_MARGIN,
  DEFLECT_REDIRECT_MARGIN,
  EXCHANGE_SECONDS,
  EXERTION_PER_EXCHANGE,
  FORCE_INSIGHT,
  MANEUVER_EFFECT,
  MANEUVER_MIN,
  MISSED_STRIKE_STEP,
  PRECOG,
  SHATTERPOINT_COMBAT,
  STANCE_MODS,
  STATE_OF_MIND_COMBAT,
  STRIKE_AT,
  STRIKE_MIN_MARGIN,
  AIMED_STRIKE,
  STRIKE_QUALITY,
  isNarratedBeat,
  type BeatReason,
  type HitQuality,
  type Maneuver,
  type SparringMode,
  type Stance,
} from '../data/combat.config';
import { FORM_MATCHUPS, FORM_STAMINA, type MatchupSituation } from '../data/formMatchups';
import { LOCATION_WEIGHTS, MINION_FOLDS_WHEN_SPENT, SEVERITIES, SPENT_LEVEL_FACTOR, WOUND_FIGHTING, type ArmorKind, type BodyPart, type Severity, type WeaponKind } from '../data/health.config';
import { RANGED_WEAPONS } from '../data/weapons';
import { applyDamage, bypassFraction, damageOf, isSaber, rollLocation, severityOf, severs } from './damage';
import { efficiency } from './fatigue';
import { addFixedLoad, forceWithin } from './forceMeter';
import { lastingPenalty, limbState, type LastingInjury } from './lasting';
import { basicRoll, type BasicRoll, type Modifier } from './rolls';
import { nextFloat, nextInt, type RngState } from './rng';
import { effectiveSeverity, isDying, isIncapacitated, killsWhileDying, takesMinionOut, woundPenalty, type Wound } from './wounds';
import type { ForceActionRecord } from './combatForce';
import type { BodySize, ForceTrait } from '../data/forceResistance.config';
import { rollBoutHazards, type TerrainHazard } from './terrainHazard';

export type SideId = 'A' | 'B';

export interface Fighter {
  id: string;
  name: string;
  /** The skill fought with: a form for sabers, blaster for ranged, melee, or agility unarmed. */
  skillId: string;
  /** Performance level in that skill (before wounds, rust, Spent and fatigue). */
  level: number;
  rust: number;
  /** The lightsaber form in use, or null. */
  form: string | null;
  weapon: WeaponKind;
  armor: ArmorKind;
  saberResistant: boolean;
  forceSense: number;
  willpower: number;
  agility: number;
  endurance: number;
  /** Shatterpoint level when the fighter has ShatterSense; 0 otherwise. */
  shatterpoint: number;
  /** Light-side philosophy for Force insight's +0.10 (stubLightPhilosophy until M6). */
  lightSide: boolean;
  minion: boolean;
  stateOfMind: string | null;
  stance: Stance;
  vitality: number;
  maxVitality: number;
  wounds: readonly Wound[];
  lasting: readonly LastingInjury[];
  /** Physical and Force meter loads and their capacities; m is the mental load (Force backlash adds to it, D-194). */
  meters: { p: number; f: number; m?: number };
  caps: { p: number; f: number };
  /** Position held: 0 none, 1 held, 2 decisive. */
  position: 0 | 1 | 2;
  disarmedFor: number;
  insightUsed: boolean;
  shatterpointUsed: boolean;
  /** Out of the fight (minion taken out, incapacitated, dead, fled). */
  out: boolean;
  /** Fighting an ally: does not attack the player and does not count for numbers (D-143 E). */
  engagedElsewhere: boolean;
  dead: boolean;
  /** The maneuver to take at this fighter's next strike instead of a hit (player choice at a beat). */
  pendingManeuver: Maneuver | null;
  /** The next strike aims at this body part (D-171): -2 to that strike, and the location roll is replaced. */
  aim?: BodyPart | null;
  /** Teamwork for the numbers bonus (D-158): minion kinds set it; named fighters count 1. */
  coordination?: number;
  /** A minion kind's accuracy on its attack rolls (D-161: B1 droids shoot poorly); named fighters have none. */
  accuracy?: number;
  /** Force resistance level (D-192): Force users only (the best of Force Control, Barrier, Absorb); absent or 0 otherwise. */
  forceResistance?: number;
  /** Traits for Force resolution (D-192): a droid, immune to mind abilities, invisible to the Force. */
  forceTraits?: readonly ForceTrait[];
  /** Build for telekinetic difficulty (D-192); absent = humanoid. */
  bodySize?: BodySize;
  /** The hand the weapon is held in (D-198); absent = right. */
  weaponHand?: 'left' | 'right';
  /** The saber thrown and dropped (D-193): the fighter is unarmed until a recall restores these. */
  saberLost?: { weapon: WeaponKind; skillId: string; level: number; form: string | null } | null;
}

export interface DuelContext {
  /** Sparring mode, or null for a real fight. */
  sparring: SparringMode | null;
  situations: readonly MatchupSituation[];
  /** Footing modifier for both sides (unstable ground -1). */
  footing: number;
  /** The side the pride state of mind looks down on is the weaker by level. */
  dyingRiskStakes: boolean;
  /** Bout-start terrain accidents (D-144, built in D-184); absent = none. */
  hazards?: TerrainHazard[];
  /** Modifier to take-position attempts from the terrain (slippery -1, D-184); absent = 0. */
  positionAttempt?: number;
  /** A real fight rolls the terrain again every this many exchanges (D-185); null or absent for a sparring bout. */
  hazardEvery?: number | null;
  /** Ranged fighters are behind cover (a cover terrain tag, D-192): it blocks lightning and thrown objects. */
  cover?: boolean;
  /** A Force-null bubble (ysalamiri, D-192): no Force action, precognition or insight works. */
  forceNegated?: boolean;
}

export interface Hit {
  by: SideId;
  quality: HitQuality;
  D: number;
  part: BodyPart;
  W: number;
  severity: Severity | null;
  vitalityLost: number;
  severed: boolean;
  /** The defender's precognitive defense avoided it (no damage). */
  avoided: boolean;
  /** Controlled live blades: the bout ended on a point instead (D-144). */
  point?: boolean;
  /** A deflected blaster bolt sent back at the shooter. */
  redirected?: boolean;
}

export interface ExchangeRecord {
  n: number;
  kind: 'buildUp' | 'strike' | 'force';
  targetId: string;
  /** Null when the side did not roll (a Force action that misfired). */
  rollA: BasicRoll | null;
  rollB: BasicRoll | null;
  margin: number;
  advBefore: number;
  advAfter: number;
  striker: SideId | null;
  hit: Hit | null;
  maneuver: { by: SideId; kind: Maneuver } | null;
  /** Effective levels this exchange (combat XP gaps, combat-xp §1). */
  effA: number;
  effB: number;
  seconds: number;
  notes: string[];
  surprise: boolean;
  /** A Force action exchange (combatForce.ts). */
  force?: ForceActionRecord;
  /** Part of a typed sequence: the step index (sequence.ts). */
  step?: number;
}

export type DuelEnd =
  | { winner: SideId; reason: 'incapacitated' | 'dying' | 'dead' | 'allOut' | 'spent' | 'point' }
  | { winner: null; reason: 'stopped' };

export interface DuelState {
  /** Terrain accident rolls so far and the exchange of the last (D-185); absent on older duels. */
  hazardRolls?: number;
  lastHazardAt?: number;
  a: Fighter;
  opponents: readonly Fighter[];
  /** Index of the current target among opponents. */
  target: number;
  /** -5..+5, positive favours A. */
  advantage: number;
  exchange: number;
  seconds: number;
  /** The next exchange is a surprise strike by this side (rolls §5). */
  surprise: SideId | null;
  /** Exchanges since the last beat of any kind, and the advantage at that beat. */
  sinceBeat: number;
  advAtBeat: number;
  /** A side became Spent this exchange (for the narrated Spent beat). */
  spentNow: SideId | null;
  end: DuelEnd | null;
  log: readonly ExchangeRecord[];
  rng: RngState;
}

const clampTrack = (v: number): number => Math.max(-ADVANTAGE_MAX, Math.min(ADVANTAGE_MAX, v));
const other = (s: SideId): SideId => (s === 'A' ? 'B' : 'A');

const atLeast = (sev: Severity, min: Severity): boolean => SEVERITIES.indexOf(sev) >= SEVERITIES.indexOf(min);

/** A leg severed in this fight, or lost earlier with no prosthetic: the fighter cannot stand (D-198). */
export function cannotStand(f: Fighter): boolean {
  if (!WOUND_FIGHTING.severedLegOut) return false;
  if (f.wounds.some((w) => w.severed && (w.part === 'leftLeg' || w.part === 'rightLeg'))) return true;
  return f.lasting.some((l) => l.kind === 'lostLeg' && (l.aid === 'none' || l.aid === 'scarTissue'));
}

/**
 * The weapon arm (D-198): ok; offHand when it carries an unhealed wound of the configured severity or worse (the
 * fighter switches hands); lost when the arm or hand was severed in this fight (no second weapon until M8).
 */
export function weaponArmState(f: Fighter): 'ok' | 'offHand' | 'lost' {
  if (!WOUND_FIGHTING.weaponArm || f.weapon === 'unarmed') return 'ok';
  const side = f.weaponHand ?? 'right';
  const parts = [`${side}Arm`, `${side}Hand`];
  const on = f.wounds.filter((w) => parts.includes(w.part) && w.healProgress < 1);
  if (on.some((w) => w.severed)) return 'lost';
  return on.some((w) => atLeast(effectiveSeverity(w), WOUND_FIGHTING.minSeverity)) ? 'offHand' : 'ok';
}

/** Out of the weapon fight by a wound rule (D-198): cannot stand, or the weapon arm is gone. Named fighters only. */
export function cannotDuel(f: Fighter): 'leg' | 'arm' | null {
  if (f.minion) return null;
  return cannotStand(f) ? 'leg' : weaponArmState(f) === 'lost' ? 'arm' : null;
}

/** Effective level (rolls §1) with wounds, lasting injuries, rust, Spent and fatigue; the off hand when the weapon arm is badly wounded (D-198). */
export function fighterEffectiveLevel(f: Fighter): number {
  const offHand = !f.minion && weaponArmState(f) === 'offHand' ? 1 - WOUND_FIGHTING.offHandPenalty : 1;
  const wound = woundPenalty(f.wounds, f.skillId, { willpower: f.willpower });
  const lasting = lastingPenalty(f.lasting, f.skillId);
  const fat = efficiency(f.caps.p > 0 ? f.meters.p / f.caps.p : 0);
  return f.level * offHand * (1 - wound) * (1 - lasting) * (1 - f.rust) * (f.vitality <= 0 ? SPENT_LEVEL_FACTOR : 1) * (1 - 0.25 * (1 - fat));
}

export const engaged = (s: DuelState): Fighter[] => s.opponents.filter((o) => !o.out && !o.engagedElsewhere);
export const currentTarget = (s: DuelState): Fighter | null => {
  const t = s.opponents[s.target];
  return t && !t.out && !t.engagedElsewhere ? t : engaged(s)[0] ?? null;
};

export const isRanged = (f: Fighter): boolean => RANGED_WEAPONS.includes(f.weapon);
export const hasSaber = (f: Fighter): boolean => f.weapon === 'lightsaber' || f.weapon === 'trainingSaber';

/** The form matchup for `f` against `opp` in this context (rolls §5; Niman 0, D-122). */
export function matchupFor(f: Fighter, opp: Fighter, ctx: DuelContext, opponentsEngaged: number): Modifier[] {
  if (!f.form) return [];
  const situations = new Set<MatchupSituation>(ctx.situations);
  if (isRanged(opp)) situations.add('vsBlasters');
  if (hasSaber(opp) && opponentsEngaged <= 1) situations.add('saberDuel');
  if (opponentsEngaged > 1) situations.add('severalOpponents');
  const out: Modifier[] = [];
  for (const m of FORM_MATCHUPS[f.form] ?? []) {
    if (m.when === 'vsForm' ? m.form === opp.form : situations.has(m.when)) out.push({ source: `${f.form} matchup (${m.when === 'vsForm' ? `vs ${m.form}` : m.when})`, value: m.value });
  }
  return out;
}

interface Mods {
  attack: Modifier[];
  defense: Modifier[];
}

/**
 * A side's modifiers (rolls §5). Stance and state of mind split into attack and defense; circumstances that are
 * "on the side's total" (matchups, position, footing, numbers) count on both attack and defense rolls; a disarmed
 * fighter's penalty is attack only.
 */
function sideMods(f: Fighter, opp: Fighter, ctx: DuelContext, numbersBonus: number, opponentsEngaged: number): Mods {
  const attack: Modifier[] = [];
  const defense: Modifier[] = [];
  const both: Modifier[] = [];
  const st = STANCE_MODS[f.stance];
  if (st.attack) attack.push({ source: `${f.stance} stance`, value: st.attack });
  if (st.defense) defense.push({ source: `${f.stance} stance`, value: st.defense });
  const som = f.stateOfMind ? STATE_OF_MIND_COMBAT[f.stateOfMind] : undefined;
  if (som && (f.stateOfMind !== 'pride' || opp.level < f.level)) {
    if (som.attack) attack.push({ source: `state of mind: ${f.stateOfMind}`, value: som.attack });
    if (som.defense) defense.push({ source: `state of mind: ${f.stateOfMind}`, value: som.defense });
  }
  for (const m of matchupFor(f, opp, ctx, opponentsEngaged)) both.push(m);
  if (f.position) both.push({ source: f.position === 2 ? 'decisive position' : 'position', value: f.position === 2 ? CIRCUMSTANCE.decisivePosition : CIRCUMSTANCE.position });
  if (ctx.footing) both.push({ source: 'footing', value: ctx.footing });
  if (numbersBonus) both.push({ source: `numbers (+${numbersBonus})`, value: numbersBonus });
  if (f.disarmedFor > 0) attack.push({ source: 'disarmed', value: MANEUVER_EFFECT.disarmedAttack });
  if (f.accuracy) attack.push({ source: 'accuracy', value: f.accuracy });
  return { attack: [...attack, ...both], defense: [...defense, ...both] };
}

/**
 * Band lookups (build-up steps, strike quality, maneuver thresholds) use the margin rounded to the nearest whole
 * point, so a fraction of a level never tips a band edge (rolls test 5; D-156). The record keeps the exact margin.
 */
const band = (m: number): number => Math.round(m);

/** Build-up modifiers: each side's attack and defense modifiers (net), counting the shared ones once. */
function netMods(m: Mods, extra: readonly Modifier[]): Modifier[] {
  const seen = new Set<Modifier>();
  const out: Modifier[] = [];
  for (const x of [...m.attack, ...m.defense]) if (!seen.has(x)) {
    seen.add(x);
    out.push(x);
  }
  return [...out, ...extra];
}

function qualityOf(margin: number): HitQuality | null {
  for (const [min, q] of STRIKE_QUALITY) if (margin >= min) return q;
  return null;
}

/** The location weights with the given parts removed. */
function withoutParts(w: Readonly<Record<BodyPart, number>>, parts: ReadonlySet<BodyPart>): Record<BodyPart, number> {
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, parts.has(k as BodyPart) ? 0 : v])) as Record<BodyPart, number>;
}

/** Applies a hit's damage to a fighter (health §4-6; minions out on moderate, D-144 sparring modes). */
export function damageFighter(
  f: Fighter,
  quality: HitQuality,
  /** The strike's rounded margin: a non-saber weapon's wound follows it (D-161). */
  margin: number,
  weapon: WeaponKind,
  ctx: DuelContext,
  rng: RngState,
  day: number,
  woundSeq: number,
  vitalityOnly: boolean,
  /** The striker's aimed location (D-171); a part already gone falls back to the roll. */
  aim: BodyPart | null = null,
): { f: Fighter; hit: Omit<Hit, 'by' | 'avoided'>; rng: RngState } {
  const D = damageOf({ weapon, quality, armor: f.armor, saberResistant: f.saberResistant });
  // A limb severed earlier in the fight cannot be hit again; a prosthetic takes the hit instead of the body: Vitality
  // only, no wound, no sever (equipment damage arrives with M8; D-164).
  const limbs = limbState(f.wounds, f.lasting);
  const [part, r1] = aim && !limbs.gone.has(aim) ? [aim, rng] : rollLocation(rng, limbs.gone.size ? withoutParts(LOCATION_WEIGHTS, limbs.gone) : LOCATION_WEIGHTS);
  const dmg = applyDamage(f.vitality, D, bypassFraction(weapon, quality, margin), vitalityOnly || limbs.prosthetic.has(part), !isSaber(weapon));
  let W = dmg.W;
  let severity = severityOf(W);
  const severed = severity !== null && severs(weapon, part, W);
  if (severed) {
    W = Math.min(W, 34);
    severity = 'severe';
  }
  // Minions (combatStarted groups) fold when Spent as well as on a moderate wound (health §9 as amended by D-157).
  let next: Fighter = { ...f, vitality: dmg.vitality, out: f.out || (f.minion && MINION_FOLDS_WHEN_SPENT && dmg.vitality <= 0) };
  if (severity) {
    const wound: Wound = { id: `${f.id}:w${woundSeq}`, part, severity, W, stabilized: false, healProgress: 0, day, source: 'combat', ...(severed ? { severed: true } : {}) };
    const dies = killsWhileDying(f.wounds, wound);
    next = { ...next, wounds: [...f.wounds, wound], dead: next.dead || dies };
    if (f.minion && takesMinionOut(severity)) next = { ...next, out: true };
  }
  void ctx;
  return { f: next, hit: { quality, D, part, W, severity, vitalityLost: dmg.vitalityLost, severed }, rng: r1 };
}

function withSide(s: DuelState, side: SideId, f: Fighter): DuelState {
  if (side === 'A') return { ...s, a: f };
  const idx = s.opponents.findIndex((o) => o.id === f.id);
  return { ...s, opponents: s.opponents.map((o, i) => (i === idx ? f : o)) };
}

/** Start-of-exchange chances: Force insight (once per fight, rolls §6). */
function insightCheck(s: DuelState, side: SideId, f: Fighter, opp: Fighter, ctx: DuelContext): { s: DuelState; note: string | null } {
  if (f.insightUsed || f.forceSense < FORCE_INSIGHT.minForceSense) return { s, note: null };
  // No insight inside a Force-null bubble or about a foe outside the Force (D-192).
  if (ctx.forceNegated || opp.forceTraits?.includes('forceInvisible')) return { s, note: null };
  const facing = opp.level - f.level >= FORCE_INSIGHT.gapAtLeast || (ctx.dyingRiskStakes && f.vitality <= 0);
  if (!facing) return { s, note: null };
  const [u, r] = nextFloat(s.rng);
  const chance = f.forceSense * FORCE_INSIGHT.perForceSense + (f.lightSide ? FORCE_INSIGHT.lightBonus : 0);
  let next = { ...s, rng: r };
  if (u < chance) {
    next = withSide(next, side, { ...f, insightUsed: true });
    next = { ...next, advantage: clampTrack(next.advantage + (side === 'A' ? 1 : -1) * FORCE_INSIGHT.advantage) };
    return { s: next, note: `${f.name}: Force insight (+${FORCE_INSIGHT.advantage} advantage)` };
  }
  return { s: next, note: null };
}

/** Shatterpoint (ShatterSense only, once per fight, rolls §6): d20 + level/10 vs 15; success jumps to advantage 3. */
export function tryShatterpoint(s: DuelState, side: SideId): { s: DuelState; roll: BasicRoll | null; success: boolean } {
  const f = side === 'A' ? s.a : currentTarget(s);
  if (!f || f.shatterpoint <= 0 || f.shatterpointUsed) return { s, roll: null, success: false };
  const [roll, r] = basicRoll(s.rng, f.shatterpoint, []);
  const success = roll.total >= SHATTERPOINT_COMBAT.dc;
  let next = withSide({ ...s, rng: r }, side, { ...f, shatterpointUsed: true, meters: { ...f.meters, f: addFixedLoad(f.meters.f, SHATTERPOINT_COMBAT.forceLoad) } });
  if (success) next = { ...next, advantage: side === 'A' ? SHATTERPOINT_COMBAT.advantage : -SHATTERPOINT_COMBAT.advantage };
  return { s: next, roll, success };
}

/** Precognitive defense (rolls §3): chance min(0.5, FS/200) +0.10 centered; 0.4 Force load; never vs surprise or above meter 1.0. */
function precog(f: Fighter, surprise: boolean, rng: RngState): { used: boolean; avoided: boolean; rng: RngState } {
  if (f.forceSense <= 0 || surprise) return { used: false, avoided: false, rng };
  if (!forceWithin(f.meters.f, f.caps.f, PRECOG.maxForceMeter)) return { used: false, avoided: false, rng };
  const chance = Math.min(PRECOG.maxChance, f.forceSense * PRECOG.perForceSense) + (f.stateOfMind === 'centered' ? PRECOG.centeredBonus : 0);
  const [u, r] = nextFloat(rng);
  return { used: true, avoided: u < chance, rng: r };
}

/** Resolves one exchange between A and the current target (rolls §3-5). `day` stamps new wounds. */
export interface ExchangeExtras {
  /** Extra modifiers on A's roll (sequence chain bonuses). */
  a?: readonly Modifier[];
  /** Extra defense for the target (sequence adaptation). */
  bDefense?: readonly Modifier[];
  step?: number;
  /**
   * A sequence strike step against a minion (D-191): a strike roll, not a build-up contest, unless the opponent holds the
   * strike. A miss by more than a tie gives the minion the build-up step for that margin.
   */
  forceStrike?: boolean;
}

export function resolveExchange(initial: DuelState, ctx: DuelContext, day: number, extras: ExchangeExtras = {}): DuelState {
  if (initial.end) return initial;
  let s = initial;
  const targetNow = currentTarget(s);
  if (!targetNow) return { ...s, end: { winner: 'A', reason: 'allOut' } };
  const notes: string[] = [];
  // Start of exchange: Force insight for either side.
  for (const side of ['A', 'B'] as const) {
    const f = side === 'A' ? s.a : currentTarget(s)!;
    const o = side === 'A' ? currentTarget(s)! : s.a;
    const r = insightCheck(s, side, f, o, ctx);
    s = r.s;
    if (r.note) notes.push(r.note);
  }
  const A = s.a;
  const B = currentTarget(s)!;
  const nEngaged = engaged(s).length;
  // Numbers (rolls §5 as amended by D-158): +1 per extra attacker engaged x its coordination, rounded down, max +3.
  const extra = engaged(s).filter((o) => o.id !== B.id).reduce((sum, o) => sum + CIRCUMSTANCE.perExtraAttacker * (o.coordination ?? 1), 0);
  // A defender caught by surprise gets no numbers modifier for that strike (D-170): the others cannot cover them.
  const numbersOnA = s.surprise === 'A' ? 0 : Math.min(CIRCUMSTANCE.maxNumbers, Math.floor(extra + 1e-9));
  const baseA = sideMods(A, B, ctx, 0, nEngaged);
  const baseB = sideMods(B, A, ctx, numbersOnA, 1);
  const modsA: Mods = { attack: [...baseA.attack, ...(extras.a ?? [])], defense: baseA.defense };
  const modsB: Mods = { attack: baseB.attack, defense: [...baseB.defense, ...(extras.bDefense ?? [])] };
  const effA = fighterEffectiveLevel(A);
  const effB = fighterEffectiveLevel(B);
  const advBefore = s.advantage;
  const surprise = s.surprise !== null;
  const striker: SideId | null = surprise ? s.surprise : advBefore >= STRIKE_AT ? 'A' : advBefore <= -STRIKE_AT ? 'B' : extras.forceStrike ? 'A' : null;
  const forced = striker === 'A' && !surprise && advBefore < STRIKE_AT;

  let rng = s.rng;
  let rollA: BasicRoll;
  let rollB: BasicRoll;
  let margin: number;
  if (striker === null) {
    [rollA, rng] = basicRoll(rng, effA, netMods(baseA, extras.a ?? []));
    [rollB, rng] = basicRoll(rng, effB, netMods(baseB, extras.bDefense ?? []));
    margin = rollA.total - rollB.total;
  } else {
    // An aimed strike costs AIMED_STRIKE.attackPenalty on the strike roll (D-171).
    const aiming = (striker === 'A' ? A : B).aim;
    const atk = [...(striker === 'A' ? modsA.attack : modsB.attack), ...(aiming ? [{ source: `aimed at the ${aiming}`, value: AIMED_STRIKE.attackPenalty }] : [])];
    const def = striker === 'A' ? modsB.defense : modsA.defense;
    // Build-up rolls use attack AND defense (net); a strike uses attack vs defense.
    if (striker === 'A') {
      [rollA, rng] = basicRoll(rng, effA, atk);
      [rollB, rng] = basicRoll(rng, effB, def);
    } else {
      [rollA, rng] = basicRoll(rng, effA, def);
      [rollB, rng] = basicRoll(rng, effB, atk);
    }
    margin = striker === 'A' ? rollA.total - rollB.total : rollB.total - rollA.total;
  }
  const [secs, r2] = nextInt(rng, EXCHANGE_SECONDS.min, EXCHANGE_SECONDS.max);
  rng = r2;

  let advAfter: number;
  let hit: Hit | null = null;
  let maneuver: { by: SideId; kind: Maneuver } | null = null;
  let aOut = A;
  let bOut = B;
  let end: DuelEnd | null = null;

  if (striker === null) {
    // Build-up exchange.
    const m = Math.abs(band(margin));
    if (m <= BUILD_UP.tieWithin) advAfter = advBefore > 0 ? advBefore - 1 : advBefore < 0 ? advBefore + 1 : 0;
    else {
      const step = BUILD_UP.steps.find(([min]) => m >= min)?.[1] ?? 0;
      advAfter = clampTrack(advBefore + (band(margin) > 0 ? step : -step));
    }
    // An opponent's natural 1 creates an opening (+2 advantage) for the other side.
    if (rollB.natural === 'nat1' && rollA.natural !== 'nat1') {
      advAfter = clampTrack(advAfter + CIRCUMSTANCE.openingAdvantage);
      notes.push(`${B.name} rolled a natural 1: opening for ${A.name}`);
    } else if (rollA.natural === 'nat1' && rollB.natural !== 'nat1') {
      advAfter = clampTrack(advAfter - CIRCUMSTANCE.openingAdvantage);
      notes.push(`${A.name} rolled a natural 1: opening for ${B.name}`);
    }
    // Cut-down (D-158): against a minion, a build-up margin of 6+ is already a hit, unless the minion wears
    // saber-resistant armor. Minion groups are mass, not duelists.
    if (B.minion && !B.saberResistant && band(margin) >= CUT_DOWN_MARGIN) {
      const q = qualityOf(band(margin)) ?? 'graze';
      const d = damageFighter(B, q, band(margin), A.weapon, ctx, rng, day, B.wounds.length + 1, ctx.sparring === 'trainingSaber' || A.weapon === 'trainingSaber');
      rng = d.rng;
      bOut = d.f;
      hit = { by: 'A', ...d.hit, avoided: false };
      // Cut down only when the minion is actually out (D-194); otherwise it is wounded or grazed and fights on.
      notes.push(minionHitNote(A.name, B.name, bOut, hit));
    }
  } else {
    const atkF = striker === 'A' ? A : B;
    let defF = striker === 'A' ? B : A;
    const natural1 = rollA.natural === 'nat1' || rollB.natural === 'nat1';
    const pm = atkF.pendingManeuver;
    // Taking position on bad ground is harder (slippery -1 on the attempt, D-184).
    if (pm && band(margin + (pm === 'position' ? (ctx.positionAttempt ?? 0) : 0)) >= MANEUVER_MIN[pm]) {
      maneuver = { by: striker, kind: pm };
      notes.push(`${atkF.name}: ${pm}`);
    } else if (band(margin) >= STRIKE_MIN_MARGIN) {
      const quality = qualityOf(band(margin))!;
      // Precognition fails inside a Force-null bubble and against a striker outside the Force (D-192).
      const pc = ctx.forceNegated || atkF.forceTraits?.includes('forceInvisible') ? { used: false, avoided: false, rng } : precog(defF, surprise, rng);
      rng = pc.rng;
      if (pc.used) defF = { ...defF, meters: { ...defF.meters, f: addFixedLoad(defF.meters.f, PRECOG.load) } };
      if (pc.avoided) {
        hit = { by: striker, quality, D: 0, part: 'torso', W: 0, severity: null, vitalityLost: 0, severed: false, avoided: true };
        notes.push(`${defF.name}: precognitive defense`);
      } else if (ctx.sparring === 'controlled' && !(band(margin) >= CONTROLLED_ACCIDENT.minMargin && natural1)) {
        hit = { by: striker, quality, D: 0, part: 'torso', W: 0, severity: null, vitalityLost: 0, severed: false, avoided: false, point: true };
        end = { winner: striker, reason: 'point' };
      } else {
        const accident = ctx.sparring === 'controlled';
        const q = accident ? CONTROLLED_ACCIDENT.quality : quality;
        if (accident) notes.push('accident: a controlled strike lands for real');
        const vitalityOnly = ctx.sparring === 'trainingSaber' || atkF.weapon === 'trainingSaber';
        const woundSeq = defF.wounds.length + 1;
        // An accident lands as a graze: the lowest strike margin.
        const d = damageFighter(defF, q, accident ? STRIKE_MIN_MARGIN : band(margin), atkF.weapon, ctx, rng, day, woundSeq, vitalityOnly, accident ? null : (atkF.aim ?? null));
        rng = d.rng;
        defF = d.f;
        hit = { by: striker, ...d.hit, avoided: false };
      }
    } else if (isRanged(atkF) && hasSaber(defF) && -band(margin) >= DEFLECT_REDIRECT_MARGIN && (defF.form === 'soresu' || defF.form === 'shien')) {
      // A deflected bolt sent back at the shooter (rolls §4): graze at 8-11, solid at 12+.
      const quality: HitQuality = -band(margin) >= 12 ? 'solid' : 'graze';
      const shooter = atkF;
      const d = damageFighter(shooter, quality, -band(margin), shooter.weapon, ctx, rng, day, shooter.wounds.length + 1, false);
      rng = d.rng;
      hit = { by: other(striker), ...d.hit, avoided: false, redirected: true };
      if (striker === 'A') aOut = d.f;
      else bOut = d.f;
      notes.push(`${defF.name} redirects the bolt`);
    }
    if (striker === 'A') bOut = defF;
    else aOut = defF;
    // A landed hit or maneuver resets the track; a knockdown starts the next at +2 for the striker; a strike that
    // misses or is blocked keeps the pressure, one step toward 0 (D-156).
    const missed = !maneuver && (!hit || hit.avoided);
    if (maneuver?.kind === 'knockdown') advAfter = striker === 'A' ? MANEUVER_EFFECT.knockdownAdvantage : -MANEUVER_EFFECT.knockdownAdvantage;
    else if (missed && forced && -band(margin) > BUILD_UP.tieWithin) advAfter = clampTrack(advBefore - (BUILD_UP.steps.find(([min]) => -band(margin) >= min)?.[1] ?? 1));
    else if (missed) advAfter = advBefore - Math.sign(advBefore) * Math.min(Math.abs(advBefore), MISSED_STRIKE_STEP);
    else advAfter = 0;
    if (maneuver?.kind === 'position') {
      if (striker === 'A') aOut = { ...aOut, position: Math.max(aOut.position, MANEUVER_EFFECT.positionBonus) as 0 | 1 | 2 };
      else bOut = { ...bOut, position: Math.max(bOut.position, MANEUVER_EFFECT.positionBonus) as 0 | 1 | 2 };
    }
    if (maneuver?.kind === 'disarm') {
      if (striker === 'A') bOut = { ...bOut, disarmedFor: 2 };
      else aOut = { ...aOut, disarmedFor: 2 };
    }
    if (maneuver) {
      if (striker === 'A') aOut = { ...aOut, pendingManeuver: null };
      else bOut = { ...bOut, pendingManeuver: null };
    }
    // The aim is spent on this strike (D-171).
    if (striker === 'A' && aOut.aim) aOut = { ...aOut, aim: null };
    else if (striker === 'B' && bOut.aim) bOut = { ...bOut, aim: null };
  }

  // Exertion for both (rolls §3), by the form's stamina multiplier (D-147).
  const exert = (f: Fighter): Fighter => ({
    ...f,
    meters: { ...f.meters, p: f.meters.p + EXERTION_PER_EXCHANGE * (f.form ? FORM_STAMINA[f.form] ?? 1 : 1) },
    disarmedFor: Math.max(0, f.disarmedFor - (f.disarmedFor > 0 && maneuver?.kind !== 'disarm' ? 1 : 0)),
  });
  aOut = exert(aOut);
  bOut = exert(bOut);

  const spentNow: SideId | null = A.vitality > 0 && aOut.vitality <= 0 ? 'A' : B.vitality > 0 && bOut.vitality <= 0 ? 'B' : null;
  // End conditions.
  const status = (f: Fighter): 'dead' | 'dying' | 'allOut' | 'incapacitated' | null => (f.dead ? 'dead' : isDying(f.wounds) ? 'dying' : f.out ? 'allOut' : isIncapacitated(f.wounds) || cannotDuel(f) ? 'incapacitated' : null);
  // A leg or the weapon arm lost in this exchange (D-198): the fighter is out of the weapon fight.
  for (const [f, was] of [[aOut, A], [bOut, B]] as const) {
    const why = cannotDuel(f);
    if (why && !cannotDuel(was)) notes.push(why === 'leg' ? `${f.name} has lost a leg and cannot stand: out of the fight` : `${f.name} has lost the weapon arm: out of the fight`);
    else if (!f.minion && weaponArmState(f) === 'offHand' && weaponArmState(was) !== 'offHand') notes.push(`${f.name} switches the weapon to the off hand (-${Math.round(WOUND_FIGHTING.offHandPenalty * 100)}%)`);
  }
  if (!end && ctx.sparring === 'trainingSaber') {
    if (aOut.vitality <= 0) end = { winner: 'B', reason: 'spent' };
    else if (bOut.vitality <= 0) end = { winner: 'A', reason: 'spent' };
  }
  if (!end) {
    const ra = status(aOut);
    if (ra) {
      aOut = { ...aOut, out: true };
      end = { winner: 'B', reason: ra === 'allOut' ? 'incapacitated' : ra };
    }
  }
  let next: DuelState = { ...s, a: aOut, rng };
  next = withSide(next, 'B', bOut);
  if (!end) {
    const rb = status(bOut);
    if (rb) {
      next = withSide(next, 'B', { ...bOut, out: true });
      if (engaged(next).length === 0) end = { winner: 'A', reason: rb === 'allOut' ? 'allOut' : rb };
      else {
        notes.push(`${bOut.name} is out of the fight`);
        advAfter = 0;
      }
    }
  }

  const rec: ExchangeRecord = {
    n: s.exchange + 1,
    kind: striker === null ? 'buildUp' : 'strike',
    targetId: B.id,
    rollA,
    rollB,
    margin,
    advBefore,
    advAfter,
    striker,
    hit,
    maneuver,
    effA,
    effB,
    seconds: secs,
    notes,
    surprise,
    ...(extras.step !== undefined ? { step: extras.step } : {}),
  };
  return {
    ...next,
    advantage: advAfter,
    exchange: s.exchange + 1,
    seconds: s.seconds + secs,
    surprise: null,
    spentNow,
    end,
    log: [...s.log, rec],
    target: Math.max(0, next.opponents.findIndex((o) => o.id === (currentTarget(next)?.id ?? ''))),
  };
}

/** The note for a hit on a minion (D-194): cuts down only when it is out; wounds or grazes when it fights on. */
export function minionHitNote(by: string, minion: string, after: Fighter, hit: Pick<Hit, 'severity'>): string {
  if (after.out) return `${by} cuts down ${minion}`;
  return hit.severity ? `${by} wounds ${minion} (${hit.severity}); it fights on` : `${by} grazes ${minion}; it fights on`;
}

/** Settles the end of the fight after an out-of-band exchange (Force action, sequence step). */
export function settleEnd(s: DuelState): DuelState {
  if (s.end) return s;
  const a = s.a;
  if (a.dead || isDying(a.wounds) || isIncapacitated(a.wounds) || cannotDuel(a) || a.out) {
    const reason = a.dead ? 'dead' : isDying(a.wounds) ? 'dying' : 'incapacitated';
    return { ...s, a: { ...a, out: true }, end: { winner: 'B', reason } };
  }
  const opps = s.opponents.map((o) => (!o.out && (o.dead || isDying(o.wounds) || isIncapacitated(o.wounds) || cannotDuel(o)) ? { ...o, out: true } : o));
  const next = { ...s, opponents: opps };
  if (engaged(next).length === 0) return { ...next, end: { winner: 'A', reason: 'allOut' } };
  return { ...next, target: Math.max(0, opps.findIndex((o) => o.id === (currentTarget(next)?.id ?? ''))) };
}

/** The beat (if any) the last exchange produced (rolls §3 as amended by D-145). */
export function beatAfter(s: DuelState): BeatReason | null {
  const rec = s.log[s.log.length - 1];
  if (!rec) return null;
  if (s.end) return s.end.reason === 'incapacitated' || s.end.reason === 'dying' || s.end.reason === 'dead' ? 'incapacitated' : 'fightEnded';
  if (rec.kind === 'force') return 'forceAction';
  const target = s.opponents.find((o) => o.id === rec.targetId);
  if (rec.hit && !rec.hit.avoided && rec.hit.by === 'A' && target?.minion) return target.out ? 'minionDown' : 'minionHit';
  if (rec.hit && !rec.hit.avoided && rec.hit.severity) return 'woundingHit';
  if (rec.maneuver) return 'maneuverLanded';
  if (s.spentNow) return 'spent';
  if (rec.kind === 'strike') return rec.hit && !rec.hit.avoided && rec.hit.vitalityLost > 0 ? 'strikeAbsorbed' : 'strikeMissed';
  if (Math.abs(s.advantage - s.advAtBeat) >= BEAT_TRACK && Math.abs(s.advantage) >= BEAT_TRACK) return 'trackSwing';
  if (s.sinceBeat + 1 >= BEAT_EVERY) return 'periodic';
  return null;
}

export type RunMode = 'beat' | 'fightOn' | 'toEnd';

export interface RunResult {
  state: DuelState;
  records: ExchangeRecord[];
  beat: BeatReason | null;
  /** Every beat passed on the way (quiet beats skipped by Fight on / Resolve to end). */
  beats: BeatReason[];
  /** Terrain accidents rolled on the way (D-185). */
  notes: string[];
}

/**
 * Resolves exchanges until the next beat: any beat ('beat'), the next narrated beat ('fightOn', D-145), or the end
 * of the fight ('toEnd'). `maxExchanges` is a safety stop.
 */
export function runUntilBeat(initial: DuelState, ctx: DuelContext, day: number, mode: RunMode, maxExchanges = 400): RunResult {
  let s = initial;
  const records: ExchangeRecord[] = [];
  const beats: BeatReason[] = [];
  const notes: string[] = [];
  for (let i = 0; i < maxExchanges && !s.end; i++) {
    // A real fight rolls its terrain again at the start of each block of exchanges (D-185): exchanges 10, 20, ...;
    // a block entered inside a sequence or a Force action rolls at the next exchange run here.
    const every = ctx.hazardEvery ?? 0;
    if (every > 0 && ctx.hazards?.length && Math.floor(s.exchange / every) > Math.floor((s.lastHazardAt ?? 0) / every)) {
      const hz = rollBoutHazards(s, ctx.hazards, day);
      notes.push(...hz.notes);
      s = settleEnd(hz.duel);
      if (s.end) return { state: s, records, beat: beatAfter(s), beats, notes };
    }
    s = resolveExchange(s, ctx, day);
    records.push(s.log[s.log.length - 1]!);
    const beat = beatAfter(s);
    if (beat) {
      beats.push(beat);
      s = { ...s, sinceBeat: 0, advAtBeat: s.advantage };
      if (mode === 'beat' || (mode === 'fightOn' && isNarratedBeat(beat)) || s.end) return { state: s, records, beat, beats, notes };
    } else s = { ...s, sinceBeat: s.sinceBeat + 1 };
  }
  return { state: s, records, beat: s.end ? beatAfter(s) : null, beats, notes };
}

export function startDuel(a: Fighter, opponents: readonly Fighter[], rng: RngState, surprise: SideId | null = null): DuelState {
  return {
    a,
    opponents,
    target: 0,
    advantage: surprise === 'A' ? CIRCUMSTANCE.surpriseAdvantage : surprise === 'B' ? -CIRCUMSTANCE.surpriseAdvantage : 0,
    exchange: 0,
    seconds: 0,
    surprise,
    sinceBeat: 0,
    advAtBeat: 0,
    spentNow: null,
    end: null,
    log: [],
    rng,
  };
}

/** Body parts in plain words (logs and the narrator's block never show raw ids; D-197). */
export const PART_TEXT: Readonly<Record<string, string>> = { head: 'head', torso: 'torso', leftArm: 'left arm', rightArm: 'right arm', leftLeg: 'left leg', rightLeg: 'right leg', leftHand: 'left hand', rightHand: 'right hand' };
export const partText = (part: string): string => PART_TEXT[part] ?? part;

/**
 * A landed hit in plain words (D-197): what it did, with the location and the severity. Only real hits say "hits".
 * "hits X: moderate wound to the left arm", "hits X: the right leg is severed", "hits X: no wound, stamina only".
 */
export function hitText(hit: Pick<Hit, 'severity' | 'part' | 'severed'>, target: string): string {
  if (hit.severed) return `hits ${target}: the ${partText(hit.part)} is severed`;
  return hit.severity ? `hits ${target}: ${hit.severity} wound to the ${partText(hit.part)}` : `hits ${target}: no wound, stamina only`;
}

/**
 * What one exchange record did for side A as a step outcome (D-197): a real hit, a maneuver, ground gained, or not.
 * Build-up exchanges never say "lands": they gain ground, hold or lose ground.
 */
export function exchangeOutcomeText(rec: ExchangeRecord, targetName: string, targetOut: boolean): { ok: boolean; text: string } {
  if (rec.hit && !rec.hit.avoided && rec.hit.by === 'A' && !rec.hit.point) return { ok: true, text: `${hitText(rec.hit, targetName)}${targetOut ? '; out of the fight' : ''}` };
  if (rec.hit?.point && rec.hit.by === 'A') return { ok: true, text: `lands a touch on ${targetName}: the bout ends on a point` };
  if (rec.maneuver?.by === 'A') return { ok: true, text: rec.maneuver.kind === 'position' ? 'takes the better position' : rec.maneuver.kind === 'knockdown' ? `knocks ${targetName} down` : `disarms ${targetName}` };
  if (rec.kind === 'strike' && rec.striker === 'A') return { ok: false, text: rec.hit?.avoided ? `misses: ${targetName} avoids the strike` : `misses ${targetName}: no hit` };
  if (rec.kind === 'strike') return { ok: false, text: `${targetName} holds the strike: no opening to attack` };
  if (rec.advAfter > rec.advBefore) return { ok: true, text: 'gains ground; no hit' };
  return { ok: false, text: rec.advAfter < rec.advBefore ? 'loses ground; no hit' : 'holds; no ground gained, no hit' };
}
