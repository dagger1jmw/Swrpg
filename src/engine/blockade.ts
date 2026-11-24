// Running a blockade (M8 item 4; D-469): pure rules. How hard each approach is, what is open to the character, what a
// landing risks, and how a run comes out. Numbers in data/blockade.config.ts (all invented). Randomness is the seeded RNG.
import {
  AGE_WEIGHT,
  ALERTNESS_RATING,
  APPROACH_COST,
  APPROACH_HOURS,
  APPROACH_RATING,
  AROUND_BY_AGE,
  BOARDED_FINE,
  CORRUPTIBILITY_RATING,
  DANGER_SENSE,
  DISCIPLINED_FLOOR,
  FAME_MARGIN,
  FORCE_THROUGH_PILOTING,
  GUESS_RANGE_KM,
  LANDING_RATING,
  LEVEL_RATING,
  OBSERVE,
  RUN_FAME,
  SHIP_FOUND_PER_DAY,
  STRENGTH_RATING,
  TRADECRAFT_BONUS,
  TRAINED_RANGE_KM,
  TREK,
  TURNS_INTO,
  WITNESSED,
} from '../data/blockade.config';
import { BLOCKADE_APPROACHES, type BlockadeApproach, type BlockadeDef, type BlockadeLevel, type BlockadeResponse, type BlockadeState } from '../data/blockades';
import { absDayFromDate } from './calendar';
import { interp } from './interp';
import { checkRating, type CheckCard, type LevelInputs, type Modifier } from './rolls';
import { nextFloat, type RngState } from './rng';

const dayOf = (d: { year: number; month?: number; day?: number }): number => absDayFromDate({ year: d.year, month: d.month ?? 1, day: d.day ?? 1 });

export const blockadeStartDay = (b: BlockadeDef): number => dayOf(b.start);
/** The blockade's age in days. */
export const blockadeAge = (b: BlockadeDef, day: number): number => Math.max(0, day - dayOf(b.start)) + (b.ageOnFirstDay ?? 0);
/** The dated state in force. */
export function blockadeStateAt(b: BlockadeDef, day: number): BlockadeState {
  const begun = b.states.filter((s) => dayOf(s.from) <= day);
  return begun[begun.length - 1] ?? b.states[0]!;
}
/** Sensor coverage in km: it grows the longer the blockade stands. */
export const sensorKm = (b: BlockadeDef, ageDays: number): number => b.sensors.startKm + (b.sensors.fullKm - b.sensors.startKm) * (1 - Math.exp(-ageDays / b.sensors.growthDays));
/** How far out a landing has to be to be outside patrols and sensors. Behind the knowledge wall. */
export const safeKm = (b: BlockadeDef, day: number): number => Math.max(blockadeStateAt(b, day).patrolKm, sensorKm(b, blockadeAge(b, day)));

/** Going around: medium while the blockade forms, then harder with its age; a trade blockade barely tightens. */
export function aroundRating(b: BlockadeDef, level: BlockadeLevel, ageDays: number): number {
  const first = AROUND_BY_AGE[0]![1];
  const curve = Math.max(interp(AROUND_BY_AGE, ageDays), b.disciplined ? DISCIPLINED_FLOOR : 0);
  return first + (curve - first) * AGE_WEIGHT[level];
}

/** The rating of an approach before the character's own modifiers. `heat`: extra alertness from ships caught lately. */
export function approachRating(b: BlockadeDef, approach: BlockadeApproach, day: number, heat = 0): number {
  const s = blockadeStateAt(b, day);
  const alert = (s.alertness + heat - 3) * ALERTNESS_RATING;
  const strength = (s.strength - 3) * STRENGTH_RATING;
  const bought = s.corruptibility * CORRUPTIBILITY_RATING;
  const level = LEVEL_RATING[s.level];
  if (approach === 'aroundClose' || approach === 'aroundOnFoot') return aroundRating(b, s.level, blockadeAge(b, day)) + level + alert + strength;
  const base = APPROACH_RATING[approach] + level + alert;
  return approach === 'sneak' || approach === 'force' ? base + strength : base + bought;
}

// ---- Who can try what ----

/** What the character brings to a blockade, from recorded state. */
export interface Runner {
  /** Training in blockade tactics (a tag on the character; it never expires). */
  trained: boolean;
  /** The last figure learned by watching THIS blockade, and how many days ago. */
  observed: { km: number; daysAgo: number } | null;
  /** Papers from a permitted party, or a friend in the traffic the blockaders leave alone. */
  protector: string | null;
  /** Someone who can get identities and codes. */
  contact: string | null;
  /** A smuggler to hire, with the level they fly at; or the character is one. */
  smuggler: { name: string; level: number } | null;
  /** Sensor masking or a stealth system on the ship. */
  masking: boolean;
  fleet: boolean;
  /** The character's ship is impounded: nothing that needs their own ship is open. */
  noShip: boolean;
  /** The ship was left outside on the way in: the way out starts on foot. */
  shipOutside: { days: number } | null;
  levels: Readonly<Record<'charisma' | 'intelligence' | 'piloting' | 'stealth' | 'endurance' | 'tracking' | 'forceSense', LevelInputs>>;
}

export interface ApproachOption {
  approach: BlockadeApproach;
  label: string;
  available: boolean;
  /** What it needs, or what makes it possible. */
  note: string;
}

export const APPROACH_LABEL: Readonly<Record<BlockadeApproach, string>> = {
  ride: 'Ride under protection',
  undercover: 'Go undercover: false identities, codes and a cover story',
  smuggle: 'Pay a smuggler who knows the blockade',
  sneak: 'Sneak through the pickets',
  aroundClose: 'Go around and slip in close',
  aroundOnFoot: 'Go around, land outside patrol range and walk in',
  force: 'Force a way through',
};

/** Where it is safe to land, as far as this character knows. Never the Force: only training or watching. */
export type LandingKnowledge = { kind: 'exact'; km: number } | { kind: 'faded'; km: number } | { kind: 'range'; from: number; to: number } | { kind: 'guess' };

export function landingKnowledge(b: BlockadeDef, day: number, r: Runner): LandingKnowledge {
  const o = r.observed;
  if (o && o.daysAgo <= OBSERVE.freshDays) return { kind: 'exact', km: Math.round(o.km) };
  if (o && o.daysAgo <= OBSERVE.goneDays && !r.trained) return { kind: 'faded', km: Math.round(o.km) };
  if (r.trained) {
    const [from, to] = TRAINED_RANGE_KM[blockadeStateAt(b, day).level];
    return { kind: 'range', from, to };
  }
  return { kind: 'guess' };
}

const landingText = (k: LandingKnowledge): string =>
  k.kind === 'exact'
    ? `watched: landing beyond about ${k.km} km is clear`
    : k.kind === 'faded'
      ? `watched some weeks ago: it was about ${k.km} km, and the patrols have shifted since`
      : k.kind === 'range'
        ? `trained: a line like this is usually clear beyond ${k.from} to ${k.to} km`
        : 'a guess: nothing known about how far out the patrols reach';

/** Every approach for this trip: what is open, and what the rest would need. Out is as hard as in: the same approaches. */
export function approachOptions(b: BlockadeDef, day: number, r: Runner, direction: 'in' | 'out' | 'through' = 'in'): ApproachOption[] {
  const of = (approach: BlockadeApproach, available: boolean, note: string): ApproachOption => ({ approach, label: APPROACH_LABEL[approach], available, note });
  if (r.shipOutside) {
    return BLOCKADE_APPROACHES.map((a) => (a === 'aroundOnFoot' ? of(a, true, 'the ship was left outside: walk back to it') : of(a, false, 'the ship is outside the blockade')));
  }
  const ship = (available: boolean): boolean => available && !r.noShip;
  const lost = 'the character\'s ship is impounded';
  const traffic = b.protectedTraffic.map((t) => t.label).join(', ') || 'a permitted party';
  return [
    of('ride', r.protector !== null, r.protector ?? `needs papers from a permitted party, or a friend in ${traffic}`),
    of('undercover', r.contact !== null || r.trained, r.contact ?? (r.trained ? 'trained tradecraft' : 'needs a friend in the services or the underworld who can get identities and codes')),
    of('smuggle', r.smuggler !== null, r.smuggler ? r.smuggler.name : 'needs a smuggler to hire'),
    of('sneak', ship(r.masking), r.noShip ? lost : r.masking ? 'the ship has sensor masking' : 'needs sensor masking or a stealth system'),
    of('aroundClose', ship(true), r.noShip ? lost : 'out beyond sensor range and back in at sublight'),
    of('aroundOnFoot', ship(direction === 'in'), r.noShip ? lost : direction === 'in' ? landingText(landingKnowledge(b, day, r)) : direction === 'out' ? 'only when the ship stands outside the blockade' : 'only for a landing'),
    of('force', r.fleet || ship(r.levels.piloting.level >= FORCE_THROUGH_PILOTING), r.fleet ? 'a fleet' : r.levels.piloting.level >= FORCE_THROUGH_PILOTING ? (r.noShip ? lost : 'an ace pilot') : 'needs a fleet, or an ace pilot'),
  ];
}

// ---- A run ----

export type RunResult = 'through' | BlockadeResponse;

export interface BlockadeRun {
  approach: BlockadeApproach;
  result: RunResult;
  cards: CheckCard[];
  /** Hours beyond the trip itself. */
  extraHours: number;
  /** Credits owed or fined (the ledger). */
  credits: number;
  /** What a failed attempt can become, at once. */
  turnsInto: BlockadeApproach[];
  penalty: number;
  fame: number;
  witnessed: boolean;
  hazard: { type: 'crash' | 'exposure'; severity: 1 | 2 } | null;
  /** The ship was found while it stood outside. */
  shipFound: boolean;
  /** Caught on foot, away from the ship. */
  onFoot: boolean;
  /** Facts for the narrator. Never a patrol or sensor figure the character does not know. */
  notes: string[];
  rng: RngState;
}

interface Ctx {
  rng: RngState;
  cards: CheckCard[];
  notes: string[];
  r: Runner;
}

function roll(c: Ctx, label: string, skillId: string | null, level: LevelInputs, rating: number, modifiers: readonly Modifier[] = []): CheckCard {
  const [card, rng] = checkRating(c.rng, { label, skillId, levelInputs: level, modifiers, rating });
  c.rng = rng;
  c.cards.push(card);
  return card;
}

/** How badly it went: 0 narrowly, 1 clearly, 2 badly. */
const severity = (margin: number): number => (margin <= -8 ? 2 : margin <= -4 ? 1 : 0);

const RESPONSE_TEXT: Readonly<Record<BlockadeResponse, string>> = {
  turnedBack: 'hailed, warned and turned back',
  boarded: 'stopped, boarded and searched, then turned back',
  firedOn: 'fired on; the ship is damaged and breaks off',
  captured: 'caught and captured',
};

/**
 * Danger sense (a Force user): one chance to feel a patrol about to find them, which eases a clear or bad failure by one
 * step. A warning or a lucky break, never the knowledge of where it is safe to land.
 */
function sensed(c: Ctx, sev: number): number {
  if (sev === 0 || c.r.levels.forceSense.level < DANGER_SENSE.minLevel) return sev;
  const card = roll(c, 'Danger sense', 'forceSense', c.r.levels.forceSense, DANGER_SENSE.rating);
  if (!card.success) return sev;
  c.notes.push('the Force warned of the danger a moment before it came');
  return sev - 1;
}

const better = (a: LevelInputs, b: LevelInputs): LevelInputs => (a.level >= b.level ? a : b);

/** The way on foot: the land a leg at a time, and the patrols inside their coverage. Returns the days, and how it ended. */
function trek(c: Ctx, km: number, patrolKm: number, groundPatrols: number): { days: number; caught: boolean; exposure: boolean } {
  let days = Math.max(1, Math.ceil(km / TREK.kmPerDay));
  let exposure = false;
  const legs = Math.ceil(days / TREK.legDays);
  for (let i = 0; i < legs; i++) {
    const land = roll(c, 'The trek: terrain and wildlife', c.r.levels.endurance.level >= c.r.levels.tracking.level ? 'endurance' : 'tracking', better(c.r.levels.endurance, c.r.levels.tracking), TREK.terrainRating);
    if (land.success) continue;
    days += TREK.lostDays;
    if (severity(land.margin) === 2) exposure = true;
  }
  const stretches = groundPatrols > 0 ? Math.ceil(Math.min(km, patrolKm) / TREK.patrolStretchKm) : 0;
  for (let i = 0; i < stretches; i++) {
    const patrol = roll(c, 'The trek: ground patrols', 'stealth', c.r.levels.stealth, TREK.patrolBase + TREK.patrolPerPoint * groundPatrols);
    if (patrol.success) continue;
    if (sensed(c, severity(patrol.margin)) === 2) {
      c.notes.push('a ground patrol caught the character');
      return { days, caught: true, exposure };
    }
    days += TREK.lostDays;
    c.notes.push('a patrol passed close; a day lost in hiding');
  }
  return { days, caught: false, exposure };
}

export interface RunInput {
  blockade: BlockadeDef;
  day: number;
  approach: BlockadeApproach;
  runner: Runner;
  direction: 'in' | 'out' | 'through';
  /** Extra alertness from ships caught lately, and the rating added when one attempt turned into this one. */
  heat?: number;
  penalty?: number;
}

/** One attempt at a blockade, in or out. The same rules both ways; a longer stay meets an older blockade. */
export function runBlockade(rng: RngState, i: RunInput): BlockadeRun {
  const { blockade: b, approach, runner: r } = i;
  const s = blockadeStateAt(b, i.day);
  const c: Ctx = { rng, cards: [], notes: [], r };
  const base = approachRating(b, approach, i.day, i.heat ?? 0) + (i.penalty ?? 0);
  const scale = s.level / 3;
  let extraHours = APPROACH_HOURS[approach] * (approach.startsWith('around') ? scale : 1);
  let credits = Math.round(APPROACH_COST[approach] * scale);
  let sev: number | null = null;
  let margin = 0;
  let exposure = false;
  let shipFound = false;
  let onFoot = false;

  const attempt = (label: string, skillId: string, level: LevelInputs, rating: number, mods: readonly Modifier[] = []): void => {
    const card = roll(c, label, skillId, level, rating, mods);
    margin = card.margin;
    if (!card.success) sev = severity(card.margin);
  };
  const walk = (km: number): void => {
    const t = trek(c, km, s.patrolKm, s.groundPatrols);
    extraHours += t.days * 24;
    exposure = t.exposure;
    // Caught on foot, with no ship to run in: taken.
    if (t.caught) {
      sev = 3;
      onFoot = true;
    }
    else c.notes.push(`${t.days} day${t.days === 1 ? '' : 's'} on foot`);
  };

  switch (approach) {
    case 'ride':
      attempt('Riding under protection', 'charisma', r.levels.charisma, base);
      break;
    case 'undercover': {
      const mods: Modifier[] = [
        ...(r.trained ? [{ source: 'trained tradecraft', value: TRADECRAFT_BONUS.trained }] : []),
        ...(r.contact ? [{ source: r.contact, value: TRADECRAFT_BONUS.contact }] : []),
      ];
      const useWits = r.levels.intelligence.level > r.levels.charisma.level;
      attempt('Undercover through the blockade', useWits ? 'intelligence' : 'charisma', useWits ? r.levels.intelligence : r.levels.charisma, base, mods);
      break;
    }
    case 'smuggle':
      attempt(`The smuggler's run (${r.smuggler?.name ?? 'a smuggler'})`, 'piloting', { ...r.levels.piloting, level: r.smuggler?.level ?? 0 }, base);
      break;
    case 'sneak': {
      // Timing the gaps as much as flying them: the weaker of the two decides.
      const weaker = r.levels.piloting.level <= r.levels.stealth.level;
      attempt('Sneaking through the pickets', weaker ? 'piloting' : 'stealth', weaker ? r.levels.piloting : r.levels.stealth, base);
      if (sev !== null) sev = sensed(c, sev);
      break;
    }
    case 'force':
      attempt('Forcing a way through', 'piloting', r.levels.piloting, base);
      break;
    case 'aroundClose':
      attempt('Slipping in close', 'piloting', r.levels.piloting, base);
      if (sev !== null) sev = sensed(c, sev);
      break;
    case 'aroundOnFoot': {
      const know = landingKnowledge(b, i.day, r);
      const clear = safeKm(b, i.day);
      let km: number;
      if (know.kind === 'exact') km = know.km * OBSERVE.freshMargin;
      else if (know.kind === 'faded') km = know.km * OBSERVE.fadedMargin;
      else if (know.kind === 'range') km = know.to;
      else {
        const [u, rng2] = nextFloat(c.rng);
        c.rng = rng2;
        km = GUESS_RANGE_KM[0] + (GUESS_RANGE_KM[1] - GUESS_RANGE_KM[0]) * u;
        c.notes.push('where to land was a guess');
      }
      const outside = km >= clear;
      if (r.shipOutside) {
        // On the way out: walk back first, and the ship may have been found.
        const [u, rng2] = nextFloat(c.rng);
        c.rng = rng2;
        shipFound = u < 1 - (1 - SHIP_FOUND_PER_DAY * s.groundPatrols) ** r.shipOutside.days;
        walk(km);
        if (sev !== null) break;
        if (shipFound) c.notes.push('the ship left outside has been found');
        attempt('Lifting off from outside the patrols', 'piloting', r.levels.piloting, base + (shipFound ? LANDING_RATING.inside : outside ? LANDING_RATING.outside : 0));
        if (sev !== null) sev = sensed(c, sev);
        break;
      }
      attempt('Landing outside patrol range', 'piloting', r.levels.piloting, base + (outside ? LANDING_RATING.outside : LANDING_RATING.inside));
      if (sev !== null) {
        sev = sensed(c, sev);
        break;
      }
      if (i.direction === 'in') walk(km);
      break;
    }
  }

  if (sev === null) {
    const fame = Math.round(RUN_FAME[approach] * scale) + (RUN_FAME[approach] > 0 && margin >= FAME_MARGIN ? 1 : 0);
    c.notes.unshift(`through (${APPROACH_LABEL[approach].toLowerCase()})`);
    return { approach, result: 'through', cards: c.cards, extraHours, credits, turnsInto: [], penalty: 0, fame, witnessed: WITNESSED.includes(approach), hazard: exposure ? { type: 'exposure', severity: 1 } : null, shipFound, onFoot, notes: c.notes, rng: c.rng };
  }
  // A trade blockade answers a step more mildly than its worst; force met by force goes a step further.
  const step = Math.min(s.response.length - 1, Math.max(0, sev + (approach === 'force' ? 1 : 0) - (s.level === 1 ? 1 : 0)));
  const result = s.response[step]!;
  if (result === 'boarded') credits += Math.round(BOARDED_FINE * scale);
  const next = TURNS_INTO[result];
  c.notes.unshift(RESPONSE_TEXT[result]);
  return {
    approach,
    result,
    cards: c.cards,
    extraHours,
    credits,
    turnsInto: i.penalty ? [] : [...(next?.options[approach] ?? [])],
    penalty: next?.penalty ?? 0,
    fame: 0,
    witnessed: false,
    hazard: result === 'firedOn' ? { type: 'crash', severity: approach === 'force' ? 2 : 1 } : exposure ? { type: 'exposure', severity: 1 } : null,
    shipFound,
    onFoot,
    notes: c.notes,
    rng: c.rng,
  };
}

/** One watch over a blockade: the hours it counts for, and whether the watcher was noticed. */
export function watchBlockade(rng: RngState, b: BlockadeDef, day: number, level: LevelInputs, hours: number, heat = 0): { card: CheckCard; counted: number; noticed: boolean; rng: RngState } {
  const s = blockadeStateAt(b, day);
  const [card, next] = checkRating(rng, { label: `Watching ${b.name}`, skillId: null, levelInputs: level, modifiers: [], rating: OBSERVE.rating + (s.alertness + heat - 3) * ALERTNESS_RATING + LEVEL_RATING[s.level] });
  const bad = !card.success && severity(card.margin) === 2;
  return { card, counted: card.success ? hours : bad ? 0 : hours / 2, noticed: bad, rng: next };
}
