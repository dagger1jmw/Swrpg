// Duels: exchanges and the advantage track (rolls.md §3-6; D-143..D-154). Pure; randomness from the seeded RNG.
// Side A is the player (or the first fighter in tests); B is the current target among A's opponents. Other engaged
// opponents add the numbers modifier (rolls §5) and never attack separately; opponents engaged elsewhere (fighting an
// ally, D-143 E) neither attack nor count. The engine never asks the AI anything: every roll, hit and wound is here.
import {
  ADVANTAGE_MAX,
  INTENT_WEIGHTS,
  MORALE,
  SUBDUE,
  SUBDUE_TEXT,
  TACTICAL_WITHDRAWAL,
  type MoraleProfile,
  type StrikeIntent,
  type SubdueMode,
  BEAT_EVERY,
  BEAT_TRACK,
  BUILD_UP,
  CIRCUMSTANCE,
  CONTROLLED_ACCIDENT,
  DISENGAGE,
  CUT_DOWN_MARGIN,
  DEFLECT_REDIRECT_MARGIN,
  REDIRECT,
  EXCHANGE_SECONDS,
  EXERTION_PER_EXCHANGE,
  FIGHT_SAFETY_CAP,
  PUSH_THROUGH,
  SPAR_INJURY,
  COVER_DEFENSE,
  FORCED_MISS_MAX_LOSS,
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
import { LOCATION_WEIGHTS, MINION_FOLDS_WHEN_SPENT, NONSABER_MORTAL, PHYSICAL_COLLAPSE, SEVERING, SEVERITIES, SPENT_LEVEL_FACTOR, WEAPON_BASE, WOUND_FIGHTING, type ArmorKind, type BodyPart, type Severity, type WeaponKind } from '../data/health.config';
import { traitHide } from '../data/speciesTraits';
import { BLASTER_WEAPONS, RANGED_WEAPONS, SLUG_SPREAD, SLUG_SPREAD_DEFENSE } from '../data/weapons';
import { applyDamage, bypassFraction, damageOf, isSaber, rollLocation, severityOf, severs } from './damage';
import { fatigueLevelFactor } from './fatigue';
import { addFixedLoad, forceFraction, forceWithin } from './forceMeter';
import { PRECOG_TRIAL, precogUpkeep, trialPool, type PrecogTrialState } from './precogTrial';
import { forceSensePrecog, stackedSkill, styleEdge } from './martialStyles';
import type { StyleEdgeKind } from '../data/martialStyles';
import { isFittedAid, lastingPenalty, lastingState, limbState, type LastingInjury } from './lasting';
import { aidHit, causeOfWeapon, withCondition } from './medicine';
import { basicRoll, type BasicRoll, type Modifier } from './rolls';
import { nextFloat, nextInt, type RngState } from './rng';
import { effectiveSeverity, isDying, isIncapacitated, killsWhileDying, takesMinionOut, woundPenalty, type Wound } from './wounds';
import type { ForceActionRecord } from './combatForce';
import { barEnd, barWound, breakOff } from './powerBar';
import { FORCE_USER_MIN_LEVEL, type BodySize, type ForceTrait } from '../data/forceResistance.config';
import { rollBoutHazards, type TerrainHazard } from './terrainHazard';

export type SideId = 'A' | 'B';

/** A fighter's melee style in a fight (m8-skills, D-513). */
export interface FighterStyle {
  id: string;
  p: number;
  bonus: number;
  edge: StyleEdgeKind;
  /** Added to the build-up roll against a melee opponent (Teräs Käsi). */
  speed: number;
  /** The anticipation chance against a melee strike (Teräs Käsi at mastery); never stacked with Force Sense. */
  anticipation: number;
}

/** A fighter's trait edges (M8 item 16). */
export interface FighterTraitEdges {
  pressAttack: number;
  defence: number;
  suddenStart: number;
  taunt: number;
}

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
  /** The weapon's own name where the kind is generic ("amphistaff" for melee), for the panel and the narrator. */
  weaponName?: string;
  /** The armor's own name ("vonduun crab armor"), for the panel and the narrator. */
  armorName?: string;
  /** The species-table id, for the body's own traits (hide, hazards; D-473). */
  speciesId?: string;
  forceSense: number;
  willpower: number;
  /** Active pain suppression's share of the wound penalty (health §8; the player's powers, opt-2 E1). */
  suppression?: number;
  agility: number;
  endurance: number;
  /** Shatterpoint level when the fighter has shatterpoint perception; 0 otherwise. */
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
  /** Pushing through (m9-tune2 addendum 3e): each exchange costs PUSH_THROUGH.strainMult x the strain. The player's setting. */
  pushing?: boolean;
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
  /**
   * The melee style fought with (m8-skills, D-513; engine/martialStyles): its bonus on the skill (added to the level), its
   * situational edge, Teräs Käsi's speed on the build-up contest and its anticipation (a precognition-like defence in melee).
   */
  style?: FighterStyle;
  /**
   * Starting traits' combat edges (M8 item 16; spec/traits.md section 3), already held to +-2 by the builder: pressing an
   * attack in an aggressive stance (Hot-headed), defending (Reckless), the first exchange of a sudden fight (Patient), and
   * resisting a taunt (Proud). Roll modifiers only: they never move the duel tiers.
   */
  traits?: FighterTraitEdges;
  /** Carries a cortosis shield (an NPC whose description names one; the player once items exist). Darth Desolous's edge needs it. */
  cortosisShield?: boolean;
  /** A weapon in the other hand (D-244): a fighter who loses the weapon arm fights on with it. None until items (M8). */
  offHandWeapon?: WeaponKind | null;
  /** The saber thrown and dropped (D-193): the fighter is unarmed until a recall restores these. */
  saberLost?: { weapon: WeaponKind; skillId: string; level: number; form: string | null } | null;
  /** A lightsaber's blade colour (D-205); absent for other weapons, training sabers and older saves. */
  bladeColor?: string;
  /** Morale (D-256): NPC opponents only; absent = never checks (the player, test fighters). */
  morale?: MoraleProfile;
  /** Strike intent (D-260): NPC fighters only; absent = the base location roll (the player, test fighters). */
  intent?: StrikeIntent;
  /** The fighter's subduing means from its loadout (D-262): what a capture intent strikes with; absent or null = none. */
  subdue?: SubdueMode | null;
  /** Tactical withdrawal chance when losing (D-263): named Sith duelists; absent or 0 = never. */
  withdraw?: number;
  /** Withdrawal checks already rolled in this fight (D-268: at most TACTICAL_WITHDRAWAL.maxChecks). */
  withdrawChecks?: number;
  /** Above the player's power bar (D-491, engine/powerBar.ts): never beaten, only made to break off. Absent = no bar. */
  aboveBar?: boolean;
  /** Left the fight by morale (D-256): fled, or surrendered (a named one's fate is the player's choice); or withdrew (D-263). */
  yielded?: 'fled' | 'surrendered' | 'withdrew';
  /** The M6 precognition trial's pool (engine/precogTrial.ts): set only while the harness-only trial flag is on. */
  precogTrial?: PrecogTrialState;
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
  /** A deflected blaster bolt sent back at the shooter (the passive redirect, or the player's redirect action). */
  redirected?: boolean;
  /** A subduing hit (D-262): Vitality only, by this means. */
  stun?: SubdueMode;
  /** The hit landed on a prosthetic limb: Vitality only, no wound (D-164; the card says so, pass 5 issue 10). */
  prosthetic?: boolean;
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
  /**
   * m9-tune2 addendum 3 (absent on older logs): the effective levels with no fatigue (combat XP reads the gap from rested levels),
   * A's natural d20, A's physical strain (meter / capacity) before the exchange, and whether A was pushing through.
   */
  restA?: number;
  restB?: number;
  dieA?: number;
  strainA?: number;
  pushA?: boolean;
  seconds: number;
  notes: string[];
  surprise: boolean;
  /** A Force action exchange (combatForce.ts). */
  force?: ForceActionRecord;
  /** Part of a typed sequence: the step index (sequence.ts). */
  step?: number;
  /** The opponents' exchange while the player used the Force (D-204): the player only defended. */
  duringForce?: boolean;
  /** The player's redirect action this exchange (m9-fix-deflect): how it went against what was asked (send a bolt back). */
  redirect?: RedirectOutcome;
}

/**
 * How a redirect went (m9-fix-deflect): sentBack (a bolt back into the shooter: the intent), or short of it: gainedGround
 * (a mid win, the bolts turned aside), deflectedAway (a small win), held (a tie), lostGround (the shooter's barrage won),
 * recovered (holding the strike, the margin under the strike minimum: the bolt goes wide).
 */
export type RedirectOutcome = 'sentBack' | 'gainedGround' | 'deflectedAway' | 'held' | 'lostGround' | 'recovered';

export type DuelEnd =
  | { winner: SideId; reason: 'incapacitated' | 'dying' | 'dead' | 'allOut' | 'spent' | 'point' | 'exhausted' | 'opponentsDefeated' | 'yielded' | 'captured' }
  | { winner: null; reason: 'stopped' | 'stalemate' | 'brokeOff' };

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

/**
 * A leg severed and not replaced: the fighter cannot stand (D-198). One reading with the narrator's block and the check
 * (engine/lasting.ts lastingState, D-237): a severed leg whose prosthetic is on record (health fits the path's aid at
 * once, D-164) is whole, so a fitted cybernetic leg stands and fights while the wound heals (D-245; pass 4: every fight
 * ended after one exchange for 40 days and more). A leg severed in this fight has no prosthetic yet.
 */
export function cannotStand(f: Fighter): boolean {
  if (!WOUND_FIGHTING.severedLegOut) return false;
  return lastingState(f.wounds, f.lasting).cannotStand;
}

/** Why a fighter cannot stand, in words ("cannot stand: severed left leg"), for the log; empty when they can. */
export function cannotStandText(f: Fighter): string {
  return lastingState(f.wounds, f.lasting).text.filter((t) => t.startsWith('cannot stand')).join('; ');
}

/**
 * Agility where a fight rolls it (dodging a Force action, a disengage), cut by the lasting injuries that bite on Agility
 * (progression-numbers §18: a lost leg P 0.35 x (1 - adaptation)). D-245: §18's penalty never reached a duel before. An
 * unarmed fighter's level is Agility already and takes it through fighterEffectiveLevel.
 */
export function fighterAgility(f: Fighter): number {
  return f.agility * (1 - lastingPenalty(f.lasting, 'agility'));
}

/**
 * The weapon arm (D-198, D-244): lost when the weapon arm or hand is severed and not replaced (the duel ends for that
 * fighter, D-244), or offHand when the fighter has an off-hand weapon to fight on with (at the off-hand penalty). A limb
 * that already carries a prosthetic is whole. With D-198's hand switch on, an unhealed wound of minSeverity or worse to
 * the weapon arm forces the off hand too.
 */
export function weaponArmState(f: Fighter): 'ok' | 'offHand' | 'lost' {
  if (f.weapon === 'unarmed') return 'ok';
  const side = f.weaponHand ?? 'right';
  const parts = [`${side}Arm`, `${side}Hand`];
  const fitted = new Set(f.lasting.filter((l) => (l.kind === 'lostArm' || l.kind === 'lostHand') && l.aid !== 'none' && l.aid !== 'scarTissue').map((l) => l.part as string));
  const on = f.wounds.filter((w) => parts.includes(w.part) && w.healProgress < 1);
  if ((WOUND_FIGHTING.weaponArmLost || WOUND_FIGHTING.weaponArm) && on.some((w) => w.severed && !fitted.has(w.part))) return f.offHandWeapon ? 'offHand' : 'lost';
  if (!WOUND_FIGHTING.weaponArm) return 'ok';
  return on.some((w) => atLeast(effectiveSeverity(w), WOUND_FIGHTING.minSeverity)) ? 'offHand' : 'ok';
}

/**
 * Collapsed from exhaustion (D-208): the physical meter past PHYSICAL_COLLAPSE.hardLimit x capacity. The fighter is out
 * of the fight with no wound; nobody fights on past the hard limit.
 */
export function collapsedFromExhaustion(f: Fighter): boolean {
  return f.caps.p > 0 && f.meters.p > f.caps.p * PHYSICAL_COLLAPSE.hardLimit;
}

/** Out of the weapon fight by a wound rule (D-198): cannot stand, or the weapon arm is gone. Named fighters only. */
export function cannotDuel(f: Fighter): 'leg' | 'arm' | null {
  if (f.minion) return null;
  return cannotStand(f) ? 'leg' : weaponArmState(f) === 'lost' ? 'arm' : null;
}

/** A fighter's physical strain: the physical meter over its capacity (0 with no capacity). */
export const strainOf = (f: Fighter): number => (f.caps.p > 0 ? f.meters.p / f.caps.p : 0);

/**
 * Effective level (rolls §1) with wounds, lasting injuries, rust, Spent and fatigue; the off hand when the weapon arm is badly wounded
 * (D-198). `rested`: the same with no fatigue factor (combat XP's gap, m9-tune2 addendum 3a).
 */
export function fighterEffectiveLevel(f: Fighter, rested = false): number {
  const offHand = !f.minion && weaponArmState(f) === 'offHand' ? 1 - WOUND_FIGHTING.offHandPenalty : 1;
  const wound = woundPenalty(f.wounds, f.skillId, { willpower: f.willpower, suppression: f.suppression ?? 0 });
  const lasting = lastingPenalty(f.lasting, f.skillId);
  // Fatigue keeps biting past 1.0 x capacity, down to 0.4 at the hard limit (D-234).
  const fat = rested ? 1 : fatigueLevelFactor(strainOf(f));
  // m8-skills (D-513): the style adds to the skill (weapon proficiency would multiply it; not built yet).
  // The stacked skill (engine/martialStyles stackedSkill; opt-2 E3): weapon proficiency is not built, so its factor is 1.
  return stackedSkill(f.level, 1, f.style?.bonus ?? 0) * offHand * (1 - wound) * (1 - lasting) * (1 - f.rust) * (f.vitality <= 0 ? SPENT_LEVEL_FACTOR : 1) * fat;
}

/** A fighter's trait edges on one roll (M8 item 16): held to +-2 together. */
function traitMods(f: Fighter, roll: 'buildUp' | 'strikeBy' | 'strikeAgainst', exchange: number, surprise: boolean): Modifier[] {
  const t = f.traits;
  if (!t) return [];
  let v = 0;
  if (roll === 'buildUp' && f.stance === 'aggressive') v += t.pressAttack;
  if (roll === 'strikeAgainst') v += t.defence;
  if (exchange === 0 && surprise) v += t.suddenStart;
  v = Math.max(-2, Math.min(2, v));
  return v ? [{ source: 'traits', value: v }] : [];
}

/** A style's modifiers on one roll (m8-skills, D-513): the edge, and Teräs Käsi's speed on a melee build-up contest. */
function styleMods(f: Fighter, opp: Fighter, ctx: DuelContext, exchange: number, roll: 'buildUp' | 'strikeBy' | 'strikeAgainst', surprise: boolean, opponents: number): Modifier[] {
  const st = f.style;
  if (!st) return [];
  const out: Modifier[] = [];
  const edge = styleEdge(st.edge, st.p, {
    exchange,
    roll,
    surprise,
    armoured: f.saberResistant === true || f.armor === 'medium' || f.armor === 'heavy',
    unarmed: f.weapon === 'unarmed',
    oppArmed: opp.weapon !== 'unarmed',
    oppRanged: isRanged(opp),
    oppSaber: hasSaber(opp),
    opponents,
    footing: ctx.footing ?? 0,
    cortosisShield: f.cortosisShield === true,
  });
  if (edge) out.push({ source: `${st.id} (style edge)`, value: edge });
  if (roll === 'buildUp' && st.speed > 0 && !isRanged(opp) && !isRanged(f)) out.push({ source: `${st.id} speed`, value: Math.round(st.speed * 10) / 10 });
  return out;
}

/**
 * Why the player's side won when nobody faces the player any more (D-212): "opponentsDefeated" while an opponent still
 * fights an ally (that duel goes on in the story and is never counted as defeated), else the last fighter's reason.
 */
export function allDownReason(s: DuelState, reason: 'incapacitated' | 'dying' | 'dead' | 'allOut' | 'exhausted'): 'incapacitated' | 'dying' | 'dead' | 'allOut' | 'exhausted' | 'opponentsDefeated' {
  return s.opponents.some((o) => o.engagedElsewhere && !o.out) ? 'opponentsDefeated' : reason;
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
  // Slugs cannot be sent back: the vs-blaster matchups are for energy bolts only (D-200).
  if (BLASTER_WEAPONS.includes(opp.weapon)) situations.add('vsBlasters');
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
    if (som.attack) attack.push({ source: `${STATE_OF_MIND_SOURCE}${f.stateOfMind}`, value: som.attack });
    if (som.defense) defense.push({ source: `${STATE_OF_MIND_SOURCE}${f.stateOfMind}`, value: som.defense });
  }
  for (const m of matchupFor(f, opp, ctx, opponentsEngaged)) both.push(m);
  if (f.position) both.push({ source: f.position === 2 ? 'decisive position' : 'position', value: f.position === 2 ? CIRCUMSTANCE.decisivePosition : CIRCUMSTANCE.position });
  if (ctx.footing) both.push({ source: 'footing', value: ctx.footing });
  if (numbersBonus) both.push({ source: 'numbers', value: numbersBonus });
  if (f.disarmedFor > 0) attack.push({ source: 'disarmed', value: MANEUVER_EFFECT.disarmedAttack });
  // Rapid slugthrower fire and scatter shot: more projectiles than a blade can meet (D-200).
  const spread = SLUG_SPREAD[opp.weapon];
  if (spread && hasSaber(f)) defense.push({ source: spread, value: SLUG_SPREAD_DEFENSE });
  if (f.accuracy) attack.push({ source: 'accuracy', value: f.accuracy });
  // Cover against ranged attacks (Jared, D-243; pass 3 balance row 4): a shooter in a place with cover (the cover terrain
  // tag) defends at +COVER_DEFENSE against a ranged attack. A fighter closing with a blade is not in cover (D-192's rule).
  if (ctx.cover && isRanged(f) && isRanged(opp)) defense.push({ source: 'cover', value: COVER_DEFENSE });
  return { attack: [...attack, ...both], defense: [...defense, ...both] };
}

/**
 * Band lookups (build-up steps, strike quality, maneuver thresholds) use the margin rounded to the nearest whole
 * point, so a fraction of a level never tips a band edge (rolls test 5; D-156). The record keeps the exact margin.
 */
const band = (m: number): number => Math.round(m);

/**
 * Build-up modifiers: each side's attack and defense modifiers (net), counting the shared ones once. A state of mind
 * whose two values have the same sign counts once, at the larger of them (Jared, D-221; despair -1 / -1 was -2 on a
 * build-up roll but -1 on a strike); one with opposite signs nets, like the stance (D-205).
 */
function netMods(m: Mods, extra: readonly Modifier[]): Modifier[] {
  const seen = new Set<Modifier>();
  const out: Modifier[] = [];
  for (const x of [...m.attack, ...m.defense]) if (!seen.has(x)) {
    seen.add(x);
    out.push(x);
  }
  const som = out.filter((x) => x.source.startsWith(STATE_OF_MIND_SOURCE));
  if (som.length === 2 && Math.sign(som[0]!.value) === Math.sign(som[1]!.value)) {
    const keep = Math.abs(som[0]!.value) >= Math.abs(som[1]!.value) ? som[0]! : som[1]!;
    return [...out.filter((x) => !som.includes(x) || x === keep), ...extra];
  }
  return [...out, ...extra];
}
const STATE_OF_MIND_SOURCE = 'state of mind: ';

export function qualityOf(margin: number): HitQuality | null {
  for (const [min, q] of STRIKE_QUALITY) if (margin >= min) return q;
  return null;
}

/** The location weights with the given parts removed. */
function withoutParts(w: Readonly<Record<BodyPart, number>>, parts: ReadonlySet<BodyPart>): Record<BodyPart, number> {
  return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, parts.has(k as BodyPart) ? 0 : v])) as Record<BodyPart, number>;
}

/** An intent's location weights on a defender whose weapon is in this hand (D-260). */
export function intentWeights(intent: 'kill' | 'disarm', weaponHand: 'left' | 'right'): Record<BodyPart, number> {
  const w = INTENT_WEIGHTS[intent];
  const off = weaponHand === 'right' ? 'left' : 'right';
  return {
    torso: w.torso,
    head: w.head,
    [`${weaponHand}Arm`]: w.weaponArm,
    [`${weaponHand}Hand`]: w.weaponHand,
    [`${off}Arm`]: w.offArm,
    [`${off}Hand`]: w.offHand,
    leftLeg: w.leftLeg,
    rightLeg: w.rightLeg,
  } as Record<BodyPart, number>;
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
  /** The striker's intent (D-260): kill and disarm weights replace the base roll (capture subdues instead: subdueFighter). */
  intent: StrikeIntent | null = null,
): { f: Fighter; hit: Omit<Hit, 'by' | 'avoided'>; rng: RngState } {
  const D = damageOf({ weapon, quality, armor: f.armor, saberResistant: f.saberResistant, hide: hideOf(f) });
  // A limb severed earlier in the fight cannot be hit again; a prosthetic takes the hit instead of the body: Vitality
  // only, no wound, no sever (equipment damage arrives with M8; D-164).
  const limbs = limbState(f.wounds, f.lasting);
  const weights = intent === 'kill' || intent === 'disarm' ? intentWeights(intent, f.weaponHand ?? 'right') : LOCATION_WEIGHTS;
  const [part, r1] = aim && !limbs.gone.has(aim) ? [aim, rng] : rollLocation(rng, limbs.gone.size ? withoutParts(weights, limbs.gone) : weights);
  const dmg = applyDamage(f.vitality, D, bypassFraction(weapon, quality, margin), vitalityOnly || limbs.prosthetic.has(part), !isSaber(weapon));
  let W = dmg.W;
  // The non-saber mortal band (D-267): a non-saber hit is mortal only from NONSABER_MORTAL.minMargin.
  if (!isSaber(weapon) && margin < NONSABER_MORTAL.minMargin) W = Math.min(W, 49);
  let severity = severityOf(W);
  let severed = severity !== null && severs(weapon, part, W, { quality, armor: f.armor, forceUser: Math.max(f.forceSense, f.forceResistance ?? 0) >= FORCE_USER_MIN_LEVEL });
  // A sever chance below 1 (measured only, SEVERING.chance; D-256): a qualifying hit that does not sever stays a limb
  // wound of at most critical. At 1 no die is drawn, so the stream is the rule's as it is.
  let rngS = r1;
  if (severed && SEVERING.chance < 1) {
    let u: number;
    [u, rngS] = nextFloat(rngS);
    if (u >= SEVERING.chance) {
      severed = false;
      W = Math.min(W, 49);
      severity = severityOf(W);
    }
  }
  if (severed) {
    W = Math.min(W, 34);
    severity = 'severe';
  }
  // Minions (combatStarted groups) fold when Spent as well as on a moderate wound (health §9 as amended by D-157).
  let next: Fighter = { ...f, vitality: dmg.vitality, out: f.out || (f.minion && MINION_FOLDS_WHEN_SPENT && dmg.vitality <= 0) };
  if (severity) {
    // What made it (D-511): the untreated risks read it once the fight is over.
    const cause = causeOfWeapon(weapon);
    const full: Wound = { id: `${f.id}:w${woundSeq}`, part, severity, W, stabilized: false, healProgress: 0, day, source: 'combat', ...(severed ? { severed: true } : {}), ...(cause ? { cause } : {}) };
    // A fighter above the power bar takes it lighter and breaks off (D-491); the card shows the wound as taken.
    const held = f.aboveBar ? barWound(f, full) : { wound: full, breaksOff: false };
    const wound = held.wound;
    if (held.breaksOff) {
      severed = false;
      severity = wound?.severity ?? null;
      W = wound?.W ?? 0;
    }
    if (wound) next = { ...next, wounds: [...f.wounds, wound], dead: next.dead || killsWhileDying(f.wounds, wound) };
    if (held.breaksOff) next = breakOff(next);
    if (f.minion && severity && takesMinionOut(severity)) next = { ...next, out: true };
  }
  void ctx;
  // A prosthetic took it (pass 5 issue 10: the card read "critical hit · no wound" with no place or reason). The hit is
  // equipment damage (D-511; health §5 left it to M8): the wound it would have done damages or breaks the aid.
  const onProsthetic = !vitalityOnly && limbs.prosthetic.has(part);
  if (onProsthetic) {
    const would = applyDamage(f.vitality, D, bypassFraction(weapon, quality, margin), false, !isSaber(weapon)).W;
    const lasting = next.lasting.map((l) => (l.part === part || (part.endsWith('Hand') && l.part === part.replace('Hand', 'Arm'))) && isFittedAid(l.aid) ? { ...l, ...withCondition(aidHit(would, l.aidCondition)) } : l);
    next = { ...next, lasting };
  }
  return { f: next, hit: { quality, D, part, W, severity, vitalityLost: dmg.vitalityLost, severed, ...(onProsthetic ? { prosthetic: true } : {}) }, rng: rngS };
}

const hideOf = (f: Fighter): number => (f.speciesId ? traitHide(f.speciesId) : 0);

/** The chance a landed training-saber hit injures (SPAR_INJURY), by the struck fighter's strain. */
export function sparInjuryChance(strain: number): number {
  const s = Math.max(0, strain);
  if (s <= 1) return SPAR_INJURY.atRest + (SPAR_INJURY.atCapacity - SPAR_INJURY.atRest) * s;
  const t = Math.min(1, (s - 1) / (PHYSICAL_COLLAPSE.hardLimit - 1));
  return SPAR_INJURY.atCapacity + (SPAR_INJURY.atHardLimit - SPAR_INJURY.atCapacity) * t;
}

/** A training-saber hit's minor injury (m9-tune2 addendum 2), or none: never worse than minor. */
function sparInjury(f: Fighter, rng: RngState, day: number, woundSeq: number): { wound: Wound | null; rng: RngState } {
  const [u, r1] = nextFloat(rng);
  if (u >= sparInjuryChance(strainOf(f))) return { wound: null, rng: r1 };
  const [k, r2] = nextInt(r1, 0, SPAR_INJURY.kinds.length - 1);
  const kind = SPAR_INJURY.kinds[k]!;
  const [part, r3] = rollLocation(r2, kind === 'a sprain from a fall' ? { ...LOCATION_WEIGHTS, head: 0, torso: 0 } : LOCATION_WEIGHTS);
  return { wound: { id: `${f.id}:w${woundSeq}`, part, severity: 'minor', W: SPAR_INJURY.W, stabilized: false, healProgress: 0, day, source: `sparring: ${kind}` }, rng: r3 };
}

/**
 * A subduing hit (D-262): Vitality only, never a wound, a location or a sever. D = the means' base (a stun bolt: its
 * blaster's) x hit quality, less armor unless the means goes around it (a net, binders, a choke). A minion folds when
 * Spent as usual (a stun bolt sent back at its shooter).
 */
export function subdueFighter(f: Fighter, quality: HitQuality, weapon: WeaponKind, mode: SubdueMode): { f: Fighter; hit: Omit<Hit, 'by' | 'avoided'> } {
  const base = mode === 'stunBolt' ? WEAPON_BASE[weapon] : SUBDUE.base[mode];
  const D = damageOf({ weapon: 'unarmed', quality, armor: SUBDUE.ignoresArmor.includes(mode) ? 'none' : f.armor, saberResistant: false, hide: SUBDUE.ignoresArmor.includes(mode) ? 0 : hideOf(f), base });
  const vitality = Math.max(0, f.vitality - D);
  const next: Fighter = { ...f, vitality, out: f.out || (f.minion && MINION_FOLDS_WHEN_SPENT && vitality <= 0) };
  return { f: next, hit: { quality, D, part: 'torso', W: 0, severity: null, vitalityLost: f.vitality - vitality, severed: false, stun: mode } };
}

/** The striker's subduing means when it fights to capture and has one (D-262), else null. */
export const subduingMeans = (f: Fighter): SubdueMode | null => (f.intent === 'capture' && f.subdue ? f.subdue : null);

/**
 * Captured (D-262): the player is Spent while an engaged opponent fights to capture with a subduing means. The fight
 * ends in capture; the player is out with no new wound.
 */
export function capturedNow(s: DuelState): boolean {
  return !s.a.out && s.a.vitality <= 0 && engaged(s).some((o) => subduingMeans(o) !== null);
}

/**
 * The disengage contest (rolls §5 tactics): d20 + Agility / 10 (+ position, - 1 a step behind on the advantage track) against
 * d20 + the current opponent's skill / 10; a win ends the fight as fled. The same contest for the player's typed tactic and the lifetime harness (D-264).
 */
export function disengageContest(d: DuelState): { ok: boolean; mine: BasicRoll; theirs: BasicRoll; duel: DuelState } {
  const target = currentTarget(d)!;
  // Losing ground costs the escape (the ruling behind the old DISENGAGE constant, applied in m9-missions A4): -1 a step the
  // opponent is ahead on the advantage track; being ahead gives no bonus (the position bonus is the fighter's edge).
  const behind = Math.max(0, -d.advantage) * DISENGAGE.advantagePenaltyPerStep;
  const mods = [...(d.a.position ? [{ source: 'position', value: d.a.position }] : []), ...(behind ? [{ source: 'losing ground', value: -behind }] : [])];
  const [mine, r1] = basicRoll(d.rng, fighterAgility(d.a), mods);
  const [theirs, r2] = basicRoll(r1, target.level, []);
  return { ok: mine.total > theirs.total, mine, theirs, duel: { ...d, rng: r2 } };
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

/** Shatterpoint (shatterpoint perception only, once per fight, rolls §6): d20 + level/10 vs 15; success jumps to advantage 3. */
export function tryShatterpoint(s: DuelState, side: SideId): { s: DuelState; roll: BasicRoll | null; success: boolean } {
  const f = side === 'A' ? s.a : currentTarget(s);
  if (!f || f.shatterpoint <= 0 || f.shatterpointUsed) return { s, roll: null, success: false };
  const [roll, r] = basicRoll(s.rng, f.shatterpoint, []);
  const success = roll.total >= SHATTERPOINT_COMBAT.dc;
  let next = withSide({ ...s, rng: r }, side, { ...f, shatterpointUsed: true, meters: { ...f.meters, f: addFixedLoad(f.meters.f, SHATTERPOINT_COMBAT.forceLoad) } });
  if (success) next = { ...next, advantage: side === 'A' ? SHATTERPOINT_COMBAT.advantage : -SHATTERPOINT_COMBAT.advantage };
  return { s: next, roll, success };
}

/**
 * Notes for the roll card only (D-222): kept on the exchange record and shown on its card, never written into the
 * narrator's block (turn/combatFacts.ts drops them).
 */
export const CARD_ONLY_NOTE = 'card: ';
export const precogCardNote = (name: string, avoided: boolean): string => `${CARD_ONLY_NOTE}${name}: precognition${avoided ? '' : ' (the strike still lands)'}: ${PRECOG.load} Force load`;

/** Precognitive defense (rolls §3): chance min(0.5, FS/200) +0.10 centered; 0.4 Force load; never vs surprise or above meter 1.0. */
function precog(f: Fighter, surprise: boolean, rng: RngState, x: { force: boolean; meleeAttack: boolean } = { force: true, meleeAttack: false }): { used: boolean; avoided: boolean; rng: RngState; anticipation?: boolean } {
  if (surprise) return { used: false, avoided: false, rng };
  // Teräs Käsi's anticipation (m8-skills, D-513): no Force, so no Force load and no meter limit; in melee only. The higher of
  // it and the fighter's own precognition applies, never both.
  const anticipation = x.meleeAttack ? (f.style?.anticipation ?? 0) : 0;
  const forceOk = x.force && f.forceSense > 0 && forceWithin(f.meters.f, f.caps.f, PRECOG.maxForceMeter) && !(PRECOG_TRIAL.enabled && f.precogTrial?.dark);
  // The M6 trial (harness only, off by default): senses dark at running on will.
  // The shared rule (engine/martialStyles forceSensePrecog; opt-2 E3: one path), plus the centred bonus.
  const own = forceOk ? forceSensePrecog(f.forceSense) + (f.stateOfMind === 'centered' ? PRECOG.centeredBonus : 0) : 0;
  if (own <= 0 && anticipation <= 0) return { used: false, avoided: false, rng };
  const [u, r] = nextFloat(rng);
  if (anticipation > own) return { used: true, avoided: u < anticipation, rng: r, anticipation: true };
  return { used: true, avoided: u < own, rng: r };
}

/**
 * The M6 precognition trial's upkeep (engine/precogTrial.ts; harness only, off by default): each Force-sensing fighter in
 * this exchange pays precognition's sustained draw, and the strain it gains adds to the Force meter (strain = meter
 * fraction). No dice.
 */
function precogTrialUpkeep(s: DuelState, ctx: DuelContext): DuelState {
  if (ctx.forceNegated) return s;
  let next = s;
  for (const side of ['A', 'B'] as const) {
    const f = side === 'A' ? next.a : currentTarget(next);
    if (!f || f.forceSense <= 0 || !(f.caps.f > 0)) continue;
    const t = f.precogTrial ?? trialPool(f.id, f.forceSense, f.level, f.wounds.length);
    const worst = f.wounds.reduce<Severity | null>((w, x) => (w === null || SEVERITIES.indexOf(x.severity) > SEVERITIES.indexOf(w) ? x.severity : w), null);
    const r = precogUpkeep(t, { strain: forceFraction(f.meters.f, f.caps.f), forceSense: f.forceSense, centered: f.stateOfMind === 'centered', fearful: f.stateOfMind === 'fear' || f.stateOfMind === 'despair', worstWound: worst, newWounds: f.wounds.slice(t.woundsSeen).map((w) => w.severity), woundCount: f.wounds.length, exchange: next.exchange });
    next = withSide(next, side, { ...f, precogTrial: r.t, meters: { ...f.meters, f: addFixedLoad(f.meters.f, r.strainGain * f.caps.f) } });
  }
  return next;
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
  /**
   * The opponents act while the player uses the Force (Jared, after combat pass 1; D-204): the player only defends (no
   * strike, no cut-down, the track never moves toward the player), and the exchange takes no time of its own (the Force
   * action's seconds cover it).
   */
  duringForce?: boolean;
  /**
   * The player's redirect action (m9-fix-deflect): A sends the shooter's bolts back with the main form against the shooter's
   * Blaster roll. Needs A's saber and a blaster shooter as the target; otherwise the exchange resolves as a plain one.
   */
  redirect?: boolean;
}

export function resolveExchange(initial: DuelState, ctx: DuelContext, day: number, extras: ExchangeExtras = {}): DuelState {
  if (initial.end) return initial;
  let s = initial;
  const targetNow = currentTarget(s);
  if (!targetNow) return barEnd({ ...s, end: { winner: 'A', reason: 'allOut' } });
  const notes: string[] = [];
  // Start of exchange: Force insight for either side.
  for (const side of ['A', 'B'] as const) {
    const f = side === 'A' ? s.a : currentTarget(s)!;
    const o = side === 'A' ? currentTarget(s)! : s.a;
    const r = insightCheck(s, side, f, o, ctx);
    s = r.s;
    if (r.note) notes.push(r.note);
  }
  if (PRECOG_TRIAL.enabled) s = precogTrialUpkeep(s, ctx);
  const A = s.a;
  const B = currentTarget(s)!;
  const nEngaged = engaged(s).length;
  // Numbers (rolls §5 as amended by D-158): +1 per extra attacker engaged x its coordination, rounded down, max +3.
  const extra = engaged(s).filter((o) => o.id !== B.id).reduce((sum, o) => sum + CIRCUMSTANCE.perExtraAttacker * (o.coordination ?? 1), 0);
  // A defender caught by surprise gets no numbers modifier for that strike (D-170): the others cannot cover them.
  const numbersOnA = s.surprise === 'A' ? 0 : Math.min(CIRCUMSTANCE.maxNumbers, Math.floor(extra + 1e-9));
  const baseA = sideMods(A, B, ctx, 0, nEngaged);
  const baseB = sideMods(B, A, ctx, numbersOnA, 1);
  // The redirect action (m9-fix-deflect): the form's redirect modifier on top of its vs-blaster matchup.
  const redirecting = extras.redirect === true && extras.duringForce !== true && hasSaber(A) && !A.saberLost && BLASTER_WEAPONS.includes(B.weapon);
  const redirectMod = redirecting && A.form ? (REDIRECT.formMod[A.form] ?? 0) : 0;
  const aExtra: Modifier[] = [...(extras.a ?? []), ...(redirectMod ? [{ source: `${A.form} redirect`, value: redirectMod }] : [])];
  const modsA: Mods = { attack: [...baseA.attack, ...aExtra], defense: baseA.defense };
  const modsB: Mods = { attack: baseB.attack, defense: [...baseB.defense, ...(extras.bDefense ?? [])] };
  const effA = fighterEffectiveLevel(A);
  const effB = fighterEffectiveLevel(B);
  const strainBefore = strainOf(A);
  const advBefore = s.advantage;
  const surprise = s.surprise !== null;
  const defendOnly = extras.duringForce === true;
  const striker: SideId | null = surprise ? s.surprise : advBefore <= -STRIKE_AT ? 'B' : defendOnly ? null : advBefore >= STRIKE_AT ? 'A' : extras.forceStrike && !redirecting ? 'A' : null;
  const redirectStrike = redirecting && striker === 'A';
  let redirectOutcome: RedirectOutcome | undefined;
  // A bolt sent back into the shooter, with the shooter's own weapon (rolls §4); a stun bolt stuns its shooter (D-262).
  const sendBack = (shooter: Fighter, quality: HitQuality, m: number, r0: RngState): { f: Fighter; hit: Omit<Hit, 'by' | 'avoided'>; rng: RngState } =>
    subduingMeans(shooter) === 'stunBolt' ? { ...subdueFighter(shooter, quality, shooter.weapon, 'stunBolt'), rng: r0 } : damageFighter(shooter, quality, m, shooter.weapon, ctx, r0, day, shooter.wounds.length + 1, ctx.sparring !== null);
  const forced = striker === 'A' && !surprise && advBefore < STRIKE_AT;

  let rng = s.rng;
  let rollA: BasicRoll;
  let rollB: BasicRoll;
  let margin: number;
  const exNo = s.log.length;
  const nOpp = engaged(s).length;
  if (striker === null) {
    [rollA, rng] = basicRoll(rng, effA, [...netMods(baseA, aExtra), ...styleMods(A, B, ctx, exNo, 'buildUp', false, nOpp), ...traitMods(A, 'buildUp', exNo, false)]);
    [rollB, rng] = basicRoll(rng, effB, [...netMods(baseB, extras.bDefense ?? []), ...styleMods(B, A, ctx, exNo, 'buildUp', false, 1), ...traitMods(B, 'buildUp', exNo, false)]);
    margin = rollA.total - rollB.total;
  } else {
    // An aimed strike costs AIMED_STRIKE.attackPenalty on the strike roll (D-171).
    const aiming = redirectStrike ? null : (striker === 'A' ? A : B).aim;
    const atk = [
      ...(striker === 'A' ? modsA.attack : modsB.attack),
      ...(aiming ? [{ source: `aimed at the ${partText(aiming)}`, value: AIMED_STRIKE.attackPenalty }] : []),
      ...(striker === 'A' ? styleMods(A, B, ctx, exNo, 'strikeBy', surprise, nOpp) : styleMods(B, A, ctx, exNo, 'strikeBy', surprise, 1)),
      ...traitMods(striker === 'A' ? A : B, 'strikeBy', exNo, surprise),
    ];
    const def = [...(striker === 'A' ? modsB.defense : modsA.defense), ...(striker === 'A' ? styleMods(B, A, ctx, exNo, 'strikeAgainst', surprise, 1) : styleMods(A, B, ctx, exNo, 'strikeAgainst', surprise, nOpp)), ...traitMods(striker === 'A' ? B : A, 'strikeAgainst', exNo, surprise)];
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
  const [rolledSecs, r2] = nextInt(rng, EXCHANGE_SECONDS.min, EXCHANGE_SECONDS.max);
  rng = r2;
  const secs = defendOnly ? 0 : rolledSecs;

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
    // While using the Force the player only defends (D-204): winning the exchange holds the track, never gains.
    if (defendOnly) {
      advAfter = Math.min(advBefore, advAfter);
      notes.push(`${A.name} is using the Force and only defends`);
    }
    // Cut-down (D-158): against a minion, a build-up margin of 6+ is already a hit, unless the minion wears
    // saber-resistant armor. Minion groups are mass, not duelists.
    if (!defendOnly && !redirecting && B.minion && !B.saberResistant && band(margin) >= CUT_DOWN_MARGIN) {
      const q = qualityOf(band(margin)) ?? 'graze';
      const d = damageFighter(B, q, band(margin), A.weapon, ctx, rng, day, B.wounds.length + 1, ctx.sparring === 'trainingSaber' || A.weapon === 'trainingSaber');
      rng = d.rng;
      bOut = d.f;
      hit = { by: 'A', ...d.hit, avoided: false };
      // Cut down only when the minion is actually out (D-194); otherwise it is wounded or grazed and fights on.
      notes.push(minionHitNote(A.name, B.name, bOut, hit, isRanged(A)));
    }
    // The redirect action in a build-up (m9-fix-deflect): the bands as above; the strike band (the cut-down margin against a
    // minion) sends a bolt back into the shooter. A duelist hit that way resets the track like a landed strike.
    if (redirecting) {
      const bm = band(margin);
      if (bm >= (B.minion ? REDIRECT.sendBackMinionMargin : REDIRECT.sendBackMargin)) {
        const d = sendBack(B, qualityOf(bm) ?? 'graze', bm, rng);
        rng = d.rng;
        bOut = d.f;
        hit = { by: 'A', ...d.hit, avoided: false, redirected: true };
        if (!B.minion) advAfter = 0;
        redirectOutcome = 'sentBack';
      } else redirectOutcome = bm >= REDIRECT_MID_WIN ? 'gainedGround' : bm > BUILD_UP.tieWithin ? 'deflectedAway' : bm >= -BUILD_UP.tieWithin ? 'held' : 'lostGround';
      notes.push(redirectNote(redirectOutcome, A.name, B.name));
    }
  } else {
    const atkF = striker === 'A' ? A : B;
    let defF = striker === 'A' ? B : A;
    const natural1 = rollA.natural === 'nat1' || rollB.natural === 'nat1';
    const pm = atkF.pendingManeuver;
    // Taking position on bad ground is harder (slippery -1 on the attempt, D-184).
    if (redirectStrike) {
      // The redirect action while holding the strike (m9-fix-deflect): the strike bands send a bolt back into the shooter.
      if (band(margin) >= STRIKE_MIN_MARGIN) {
        const d = sendBack(defF, qualityOf(band(margin))!, band(margin), rng);
        rng = d.rng;
        defF = d.f;
        hit = { by: 'A', ...d.hit, avoided: false, redirected: true };
        redirectOutcome = 'sentBack';
      } else redirectOutcome = 'recovered';
      notes.push(redirectNote(redirectOutcome, A.name, B.name));
    } else if (pm && band(margin + (pm === 'position' ? (ctx.positionAttempt ?? 0) : 0)) >= MANEUVER_MIN[pm]) {
      maneuver = { by: striker, kind: pm };
      notes.push(`${atkF.name}: ${pm}`);
    } else if (band(margin) >= STRIKE_MIN_MARGIN) {
      const quality = qualityOf(band(margin))!;
      // Precognition fails inside a Force-null bubble and against a striker outside the Force (D-192); a Teräs Käsi master's
      // anticipation is no Force power and works there too, in melee (m8-skills, D-513).
      const pc = precog(defF, surprise, rng, { force: !(ctx.forceNegated || atkF.forceTraits?.includes('forceInvisible')), meleeAttack: !isRanged(atkF) });
      rng = pc.rng;
      if (pc.used && pc.anticipation) notes.push(`${defF.name}: Teräs Käsi anticipation${pc.avoided ? '' : ' (the strike still lands)'}`);
      else if (pc.used) {
        // Under the M6 trial the cost is the per-exchange upkeep instead of a load per trigger.
        if (!PRECOG_TRIAL.enabled) defF = { ...defF, meters: { ...defF.meters, f: addFixedLoad(defF.meters.f, PRECOG.load) } };
        // Why the Force meter rises with no Force action (Jared, D-222; pass 2 balance row 6): said on the card.
        notes.push(precogCardNote(defF.name, pc.avoided));
      }
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
        // A capturing fighter subdues (D-262): Vitality only, no location, no wound.
        const means = accident ? null : subduingMeans(atkF);
        if (means) {
          const d = subdueFighter(defF, q, atkF.weapon, means);
          defF = d.f;
          hit = { by: striker, ...d.hit, avoided: false };
        } else {
          // An accident lands as a graze: the lowest strike margin.
          const d = damageFighter(defF, q, accident ? STRIKE_MIN_MARGIN : band(margin), atkF.weapon, ctx, rng, day, woundSeq, vitalityOnly, accident ? null : (atkF.aim ?? null), accident ? null : (atkF.intent ?? null));
          rng = d.rng;
          defF = d.f;
          hit = { by: striker, ...d.hit, avoided: false };
          // A training-saber hit can leave a minor injury, likelier when the struck fighter is strained (m9-tune2 addendum 2).
          if (vitalityOnly && !accident && ctx.sparring !== null) {
            const sp = sparInjury(defF, rng, day, woundSeq);
            rng = sp.rng;
            if (sp.wound) {
              defF = { ...defF, wounds: [...defF.wounds, sp.wound] };
              hit = { ...hit, W: sp.wound.W, severity: 'minor' };
              notes.push(`${defF.name}: ${sp.wound.source.replace(/^sparring: /, '')} (a minor injury from the spar)`);
            }
          }
        }
      }
    } else if (BLASTER_WEAPONS.includes(atkF.weapon) && hasSaber(defF) && -band(margin) >= DEFLECT_REDIRECT_MARGIN && (defF.form === 'soresu' || defF.form === 'shien')) {
      // A deflected bolt sent back at the shooter (rolls §4): graze at 8-11, solid at 12+.
      const quality: HitQuality = -band(margin) >= 12 ? 'solid' : 'graze';
      const shooter = atkF;
      // A stun bolt sent back stuns its shooter (D-262).
      const stunning = subduingMeans(shooter) === 'stunBolt';
      const d = stunning ? { ...subdueFighter(shooter, quality, shooter.weapon, 'stunBolt'), rng } : damageFighter(shooter, quality, -band(margin), shooter.weapon, ctx, rng, day, shooter.wounds.length + 1, false);
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
    else if (missed && forced && -band(margin) > BUILD_UP.tieWithin) advAfter = clampTrack(advBefore - Math.min(FORCED_MISS_MAX_LOSS, BUILD_UP.steps.find(([min]) => -band(margin) >= min)?.[1] ?? 1));
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
    // The aim is spent on this strike (D-171); a redirect is not that strike.
    if (striker === 'A' && aOut.aim && !redirectStrike) aOut = { ...aOut, aim: null };
    else if (striker === 'B' && bOut.aim) bOut = { ...bOut, aim: null };
  }

  // Exertion for both (rolls §3), by the form's stamina multiplier (D-147).
  const exert = (f: Fighter): Fighter => ({
    ...f,
    meters: { ...f.meters, p: f.meters.p + EXERTION_PER_EXCHANGE * (f.form ? FORM_STAMINA[f.form] ?? 1 : 1) * (f.pushing ? PUSH_THROUGH.strainMult : 1) },
    disarmedFor: Math.max(0, f.disarmedFor - (f.disarmedFor > 0 && maneuver?.kind !== 'disarm' ? 1 : 0)),
  });
  aOut = exert(aOut);
  bOut = exert(bOut);

  const spentNow: SideId | null = A.vitality > 0 && aOut.vitality <= 0 ? 'A' : B.vitality > 0 && bOut.vitality <= 0 ? 'B' : null;
  // End conditions.
  const status = (f: Fighter): 'dead' | 'dying' | 'allOut' | 'incapacitated' | 'exhausted' | null => (f.dead ? 'dead' : isDying(f.wounds) ? 'dying' : f.out ? 'allOut' : isIncapacitated(f.wounds) || cannotDuel(f) ? 'incapacitated' : collapsedFromExhaustion(f) ? 'exhausted' : null);
  // Past the physical hard limit (D-208): the fighter collapses and is out, a minion as much as a duelist.
  for (const [f, was] of [[aOut, A], [bOut, B]] as const) {
    if (collapsedFromExhaustion(f) && !collapsedFromExhaustion(was)) notes.push(`${f.name} collapses from exhaustion (physical ${f.meters.p.toFixed(1)} / ${f.caps.p.toFixed(1)}, past the hard limit of ${PHYSICAL_COLLAPSE.hardLimit}x): out of the fight`);
  }
  // A leg or the weapon arm lost in this exchange (D-198): the fighter is out of the weapon fight.
  for (const [f, was] of [[aOut, A], [bOut, B]] as const) {
    const why = cannotDuel(f);
    if (why && !cannotDuel(was)) notes.push(why === 'leg' ? `${f.name} has lost a leg and cannot stand: out of the fight` : `${f.name} has lost the weapon arm: out of the fight`);
    // Came into the fight unable to (D-245; pass 4: out after one exchange with no line saying why).
    else if (why && !was.out) notes.push(why === 'leg' ? `${f.name} ${cannotStandText(f)}: out of the fight` : `${f.name} has no weapon arm: out of the fight`);
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
      if (engaged(next).length === 0) end = { winner: 'A', reason: allDownReason(next, rb === 'allOut' || bOut.minion ? 'allOut' : rb) };
      else {
        notes.push(`${bOut.name} is out of the fight`);
        advAfter = 0;
      }
    }
  }
  // Spent against a capturing opponent (D-262): subdued and taken.
  if (!end && ctx.sparring === null && capturedNow(next)) {
    next = { ...next, a: { ...next.a, out: true } };
    end = { winner: 'B', reason: 'captured' };
    notes.push(`${A.name} is Spent and subdued: taken captive`);
  }

  // Tactical withdrawal (Jared, D-263, D-268): a losing Sith duelist breaks off and escapes with its archetype's chance,
  // apart from panic morale. Losing: a severe or worse wound or a sever this exchange, Spent this exchange, or the track
  // swinging to TACTICAL_WITHDRAWAL.trackAt against it with Vitality at or below vitalityAtMost. One check per exchange
  // with a trigger, at most maxChecks a fight; an unwounded Sith above vitalityAtMost never withdraws (pass 5: 40 of 58
  // won duels ended this way, most with the Sith unhurt). Real fights only; the dice continue the duel's stream.
  if (!end && ctx.sparring === null && TACTICAL_WITHDRAWAL.enabled) {
    const after = next.opponents.find((o) => o.id === B.id)!;
    const checksLeft = (after.withdrawChecks ?? 0) < TACTICAL_WITHDRAWAL.maxChecks;
    const low = after.vitality <= TACTICAL_WITHDRAWAL.vitalityAtMost * after.maxVitality;
    // The player nearly beaten (D-268 amended): Spent, Dying or at or below pressWhenFoeAtMost: the Sith presses instead.
    const foe = next.a;
    const foeNearlyBeaten = foe.vitality <= 0 || isDying(foe.wounds) || foe.vitality <= TACTICAL_WITHDRAWAL.pressWhenFoeAtMost * foe.maxVitality;
    if (!after.out && !after.dead && (after.withdraw ?? 0) > 0 && checksLeft && !foeNearlyBeaten && (after.wounds.length > 0 || low)) {
      const fresh = after.wounds.slice(B.wounds.length);
      const swung = advAfter >= TACTICAL_WITHDRAWAL.trackAt && advBefore < TACTICAL_WITHDRAWAL.trackAt;
      const losing = fresh.some((w) => w.severed || atLeast(w.severity, 'severe')) || spentNow === 'B' || (swung && low);
      if (losing) {
        const [u, r] = nextFloat(next.rng);
        const checked = { ...after, withdrawChecks: (after.withdrawChecks ?? 0) + 1 };
        next = withSide({ ...next, rng: r }, 'B', checked);
        if (u < after.withdraw!) {
          next = withSide(next, 'B', { ...checked, out: true, yielded: 'withdrew' });
          notes.push(`${after.name} withdraws: breaks off the fight and escapes, out of the fight`);
          advAfter = 0;
          if (engaged(next).length === 0) end = { winner: 'A', reason: 'yielded' };
        }
      }
    }
  }

  // Morale (Jared, D-256): an NPC opponent checks when it takes a severe or worse wound or is Spent this exchange, and
  // every standing one checks when this exchange puts half or more of its side out. A break ends that fighter's part:
  // it surrenders or flees. Real fights only; the dice continue the duel's stream.
  if (!end && ctx.sparring === null && MORALE.enabled) {
    const side = (d: DuelState): Fighter[] => d.opponents.filter((o) => !o.engagedElsewhere);
    const outShare = (d: DuelState): number => side(d).filter((o) => o.out).length / Math.max(1, side(d).length);
    const after = next.opponents.find((o) => o.id === B.id)!;
    const checks = new Set<string>();
    if (!after.out) {
      const fresh = after.wounds.slice(B.wounds.length);
      if (fresh.some((w) => w.severed || atLeast(w.severity, 'severe')) || spentNow === 'B') checks.add(B.id);
    }
    if (side(next).length > 1 && outShare(s) < MORALE.losingBadlyShare && outShare(next) >= MORALE.losingBadlyShare) for (const o of side(next)) if (!o.out) checks.add(o.id);
    let r = next.rng;
    let ops = next.opponents;
    for (const id of checks) {
      const f = ops.find((o) => o.id === id)!;
      const p = f.morale;
      if (!p || f.dead || f.out || f.aboveBar) continue;
      const chance = MORALE.breakChance[p.group];
      if (chance <= 0) continue;
      let u: number;
      [u, r] = nextFloat(r);
      if (u >= chance) continue;
      let v: number;
      [v, r] = nextFloat(r);
      const yielded = v < p.surrender ? ('surrendered' as const) : ('fled' as const);
      ops = ops.map((o) => (o.id === id ? { ...o, out: true, yielded } : o));
      notes.push(yielded === 'surrendered' ? `${f.name}'s morale breaks: surrenders, out of the fight` : `${f.name}'s morale breaks: disengages and flees, out of the fight`);
      if (id === B.id) advAfter = 0;
    }
    next = { ...next, opponents: ops, rng: r };
    if (checks.size && engaged(next).length === 0) end = { winner: 'A', reason: 'yielded' };
  }

  // The safety cap (D-208): a real fight still undecided after FIGHT_SAFETY_CAP exchanges ends as an exhausted
  // stalemate, both sides Spent. Sparring sessions have their own budget (D-168).
  if (!end && ctx.sparring === null && s.exchange + 1 >= FIGHT_SAFETY_CAP.exchanges) {
    end = { winner: null, reason: 'stalemate' };
    next = { ...next, a: { ...next.a, vitality: 0 }, opponents: next.opponents.map((o) => (o.out || o.engagedElsewhere ? o : { ...o, vitality: 0 })) };
    notes.push(`no outcome after ${FIGHT_SAFETY_CAP.exchanges} exchanges: an exhausted stalemate, both sides Spent`);
  }

  if (next.opponents.some((o) => o.id === B.id && o.aboveBar && o.out && o.yielded === 'withdrew') && !notes.some((n) => n.includes('withdraws:'))) notes.push(`${B.name} breaks off and gets away: the player cannot beat them, out of the fight`);
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
    restA: fighterEffectiveLevel(A, true),
    restB: fighterEffectiveLevel(B, true),
    dieA: rollA.d20,
    strainA: strainBefore,
    ...(A.pushing ? { pushA: true } : {}),
    seconds: secs,
    notes,
    surprise,
    ...(extras.step !== undefined ? { step: extras.step } : {}),
    ...(defendOnly ? { duringForce: true } : {}),
    ...(redirectOutcome ? { redirect: redirectOutcome } : {}),
  };
  return barEnd({
    ...next,
    advantage: advAfter,
    exchange: s.exchange + 1,
    seconds: s.seconds + secs,
    surprise: null,
    spentNow,
    end,
    log: [...s.log, rec],
    target: Math.max(0, next.opponents.findIndex((o) => o.id === (currentTarget(next)?.id ?? ''))),
  });
}

/** The build-up margin of a mid win (the +2 band): a redirect short of the strike band gains ground from here. */
const REDIRECT_MID_WIN = BUILD_UP.steps.find(([, step]) => step === 2)![0];

/**
 * The redirect's result in plain words (m9-fix-deflect). Short of the intent, it says so: the attempt and how it fell short,
 * so the narrator and the card keep the player's goal.
 */
export function redirectNote(o: RedirectOutcome, pc: string, shooter: string): string {
  const tried = `${pc} tries to send ${shooter}'s bolts back`;
  switch (o) {
    case 'sentBack':
      return `${pc} sends a bolt back into ${shooter}`;
    case 'gainedGround':
      return `${tried}: short of the intent, the bolts glance away instead, but ${pc} gains ground`;
    case 'deflectedAway':
      return `${tried}: short of the intent, the bolts are deflected away, not back at ${shooter}`;
    case 'held':
      return `${tried}: short of the intent, the bolts are turned aside and neither gains ground`;
    case 'lostGround':
      return `${tried}: short of the intent, the barrage is too thick to send back and ${shooter} gains ground`;
    case 'recovered':
      return `${tried}: short of the intent, the deflected bolt goes wide of ${shooter}`;
  }
}

/** The note for a hit on a minion (D-194): cuts down only when it is out; wounds or grazes when it fights on. */
export function minionHitNote(by: string, minion: string, after: Fighter, hit: Pick<Hit, 'severity'>, ranged = false): string {
  // A shooter shoots a minion down; only a blade cuts it down (D-242; pass 3: "Dax Morrow cuts down Line trooper 1").
  if (after.out) return `${by} ${ranged ? 'shoots down' : 'cuts down'} ${minion}`;
  return hit.severity ? `${by} wounds ${minion} (${hit.severity}); ${after.forceTraits?.includes('droid') ? 'it' : 'they'} fight${after.forceTraits?.includes('droid') ? 's' : ''} on` : `${by} grazes ${minion}; ${after.forceTraits?.includes('droid') ? 'it fights' : 'they fight'} on`;
}

/** Settles the end of the fight after an out-of-band exchange (Force action, sequence step). */
export function settleEnd(s: DuelState): DuelState {
  if (s.end) return s;
  const a = s.a;
  if (a.dead || isDying(a.wounds) || isIncapacitated(a.wounds) || cannotDuel(a) || collapsedFromExhaustion(a) || a.out) {
    const reason = a.dead ? 'dead' : isDying(a.wounds) ? 'dying' : !isIncapacitated(a.wounds) && !cannotDuel(a) && collapsedFromExhaustion(a) ? 'exhausted' : 'incapacitated';
    return { ...s, a: { ...a, out: true }, end: { winner: 'B', reason } };
  }
  const opps = s.opponents.map((o) => (!o.out && (o.dead || isDying(o.wounds) || isIncapacitated(o.wounds) || cannotDuel(o) || collapsedFromExhaustion(o)) ? { ...o, out: true } : o));
  const next = { ...s, opponents: opps };
  if (engaged(next).length === 0) return barEnd({ ...next, end: { winner: 'A', reason: allDownReason(next, 'allOut') } });
  // Spent against a capturing opponent after a Force action or a sequence step (D-262).
  if (capturedNow(next)) return { ...next, a: { ...next.a, out: true }, end: { winner: 'B', reason: 'captured' } };
  return { ...next, target: Math.max(0, opps.findIndex((o) => o.id === (currentTarget(next)?.id ?? ''))) };
}

/** The beat (if any) the last exchange produced (rolls §3 as amended by D-145). */
export function beatAfter(s: DuelState): BeatReason | null {
  const rec = s.log[s.log.length - 1];
  if (!rec) return null;
  if (s.end) return s.end.reason === 'incapacitated' || s.end.reason === 'dying' || s.end.reason === 'dead' || s.end.reason === 'exhausted' || s.end.reason === 'captured' ? 'incapacitated' : 'fightEnded';
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
 * "hits X: moderate wound to the left arm", "hits X: the right leg is severed", "hits X: no wound (winded)".
 */
export function hitText(hit: Pick<Hit, 'severity' | 'part' | 'severed' | 'stun'>, target: string): string {
  if (hit.stun) return `${SUBDUE_TEXT[hit.stun].verb} ${target}: no wound (winded)`;
  if (hit.severed) return `hits ${target}: the ${partText(hit.part)} is severed`;
  return hit.severity ? `hits ${target}: ${hit.severity} wound to the ${partText(hit.part)}` : `hits ${target}: no wound (winded)`;
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
