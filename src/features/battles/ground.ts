// Ground command in play (m8-ground, M8 checklist item 14; D-522; docs-v2/spec/ground-command.md). Pure rules on plain data:
// the planning scene (the map and its key, scouting, the plan), the battle phase by phase on the engine's sector rolls
// (engine/groundBattle.ts, D-505), plan changes by command-post contact, contingencies, the player's own fight, battle
// meditation and its loss, and the end. The feature's index reads the state into these inputs and raises the events.
import { FIT, SECOND_IN_COMMAND_TACTICS, keepsCommand, mayStayAtPost, outOfFight, stayAtPostLabel, type CommanderCondition } from './command';
import { GROUND_UNITS, PHASE_HOURS, PLAN_LABEL, PLAN_BEATS, type Plan } from '../../data/ground.config';
import {
  ACTION_LABEL,
  ATTACKING_PLANS,
  CHANGE,
  CONTINGENCY_ACTIONS,
  CONTINGENCY_TRIGGERS,
  DEFENDING_PLANS,
  FALLING_AT,
  FEATURE_DEF,
  FEATURE_WORDS,
  GRID,
  GROUND_LIMITS,
  KNOWN_SITES,
  LEADER_DEATH,
  MAX_CONTINGENCIES,
  MEDITATOR_RAID,
  OWN_FIGHT_ROLL,
  SCOUTING,
  TACTIC_PLAN,
  TRIGGER_LABEL,
  WEATHER,
  type ContingencyAction,
  type ContingencyTrigger,
  type Feature,
  type KnownSite,
  type Weather,
} from '../../data/groundCommand.config';
import { SEEN_TACTIC_PENALTY, TACTIC_BY_ID } from '../../data/tactics';
import type { DuelTier } from '../../data/who';
import { forceLeft, groundForce, groundPhase, groundUnit, killLeader, killMeditator, sector, sectorSide, standing, startGround, unitDef, unitQuality, type GroundBattle, type GroundForce, type PhaseRecord, type Sector, type SectorLeader } from '../../engine/groundBattle';
import { nextFloat, nextInt, type RngState } from '../../engine/rng';
import { basicRoll, type Modifier } from '../../engine/rolls';
import { contest } from '../../engine/track';

// ---- shapes (saved whole in the battles slice) ----

export interface GUnit {
  id: string;
  /** GROUND_UNITS id. */
  unit: string;
  label: string;
  size: number;
  bond: number;
  fear: number;
}

export interface GSquare {
  feature: Feature;
  note: string;
  /** Not from the lore: the narrator's words or the code's own (tagged invented on the key). */
  invented: boolean;
}

export interface GMap {
  cols: number;
  rows: number;
  squares: Record<string, GSquare>;
  /** Squares whose ground is known: the friendly side, the front positions, and what scouting reveals. */
  seen: string[];
  /** Squares whose enemy strength is known (scouted). */
  scouted: string[];
  /** The front positions: the squares the defender holds. */
  positions: string[];
  /** Positions the lore or the narrator marks as objectives. */
  objectives: string[];
  /** Each side's command post. */
  hq: { player: string; enemy: string };
  siteId: string | null;
}

export interface GSector {
  square: string;
  units: string[];
  /** 'player', an NPC id, or null (the troops' own officers). */
  leader: string | null;
}

export interface Contingency {
  when: ContingencyTrigger;
  /** The sector it watches or acts on (the falling sector, where the reserve goes). */
  sector?: string;
  then: ContingencyAction;
  /** For switchPlan: the tactic switched to. */
  manoeuvre?: string;
  used?: boolean;
}

export interface GroundPlan {
  primary: string | null;
  secondary: string | null;
  /** A ground tactic id (data/tactics.ts). */
  manoeuvre: string | null;
  sectors: GSector[];
  support: { artillery: string | null; armour: string | null; air: string | null };
  reserve: string[];
  contingencies: Contingency[];
}

export interface GLeader {
  name: string;
  npcId: string | null;
  tactics: number;
  forceUser: boolean;
  tier: DuelTier;
}

export interface GSide {
  name: string;
  faction: string;
  units: GUnit[];
  commander: { name: string; npcId: string | null; tactics: number };
  meditation: { name: string; level: number; npcId: string | null; player: boolean } | null;
  /** Officers at a command post keep the lines (Jared); irregulars and a force whose officers are dead have none. */
  officers: boolean;
}

export type GroundRole = 'commander' | 'leader' | 'soldier';

export interface GroundPlanning {
  id: string;
  site: string;
  placeId: string | null;
  year: number;
  day: number;
  weather: Weather;
  /** The player's side holds the positions. */
  defending: boolean;
  /** commander: plans and commands; leader: leads a sector under an NPC's plan; soldier: fights in a sector. */
  role: GroundRole;
  /** The commander's place: the post (the whole picture, no fighting) or the front (a sector). */
  atPost: boolean;
  handed: string | null;
  jammed: boolean;
  map: GMap;
  ours: GSide;
  enemy: GSide & { plan: Plan; deploy: Record<string, string[]> };
  plan: GroundPlan;
  scouting: { tries: number; planKnown: boolean; noticed: boolean; log: string[] };
  /** The leaders the player may name for sectors (present NPCs). */
  leaders: GLeader[];
  /** The player as a leader at the front. */
  me: GLeader & { meditation: number; canMeditate: boolean };
  /** The tactics the player may order (ground ones): known, and seen ones at a penalty (m8-fixes B4). */
  known: string[];
  /** Of those, the ones seen and not practised (m8-fixes B4): ordered at -SEEN_TACTIC_PENALTY. Absent in scenes saved before. */
  seenOnly?: string[];
  /** What the one who plans knows: the player when they command, else the NPC commander (an army's officers). */
  planKnows?: string[];
  /** What the enemy's commanders know. */
  enemyKnows: string[];
}

export interface GroundOrders {
  /** Change the manoeuvre (a known ground tactic). */
  manoeuvre?: string;
  /** Commit the reserve to a sector. */
  commit?: string;
  /** Move one unit between sectors. */
  move?: { unit: string; to: string };
  /** The player's own sector falls back. */
  fallBack?: boolean;
  /** Fight it out in person in the player's sector (personal combat). */
  fightInPerson?: boolean;
  withdraw?: boolean;
  /** Out of the fight, keep command (or the sector) by the player's own choice (m8-audit A4). */
  stayAtPost?: boolean;
}

export interface PendingOrder {
  lands: number;
  orders: GroundOrders;
}

export interface GroundState {
  id: string;
  planning: GroundPlanning;
  battle: GroundBattle;
  reserve: string[];
  pending: PendingOrder[];
  /** A delayed change carries its penalty in the phase it lands. */
  penaltyAt: number | null;
  /** Our side's manoeuvres in this battle (m8-fixes B3b, B6). Absent in battles saved before. */
  used?: string[];
  /** Seen manoeuvres the player ordered and that went well (phases won on balance): known at the end (m8-fixes B3b). */
  learned?: string[];
  auto: boolean;
  log: string[];
  map: string;
  /** The square the player fights in, or null (at the post). */
  playerSector: string | null;
  /** A personal fight in the player's sector (its fight id), and the result waiting for the next phase. */
  fight: { fightId: string | null; result: 'won' | 'lost' | null; offered: boolean } | null;
  xp: { gaps: number[] };
  contingencies: Contingency[];
  /** Named leaders who fell (NPC ids). */
  fallen: string[];
  end: { winner: 'player' | 'enemy' | null; reason: 'objectives' | 'collapse' | 'time' | 'withdrawn' | 'routed' } | null;
  /** Hazards to the player (a sector collapsing round them). */
  hazards: { severity: number; cause: string }[];
  /**
   * The wounded commander (m8-audit A4): the player out of the fight handed command (or their sector) to the next in line, and
   * whether the medics have reached them. Absent in battles saved before.
   */
  handedTo?: { name: string; tactics: number } | null;
  medicReached?: boolean;
  /** The player chose to stay at their post while out of the fight (the sacrifice; the dying clock keeps running). */
  stayAtPost?: boolean;
}

export interface GroundStep {
  ground: GroundState;
  lines: string[];
  big: string[];
  seconds: number;
  /** A personal fight to start (the combat feature's fightBegun). */
  handoff: { kind: string; count: number } | null;
}

// ---- the grid ----

export const colName = (i: number): string => String.fromCharCode(65 + i);
export const squareOf = (c: number, r: number): string => `${colName(c)}${r + 1}`;
export const parseSquare = (sq: string): { c: number; r: number } | null => {
  const m = /^([A-H])([1-8])$/.exec(sq.trim().toUpperCase());
  return m ? { c: m[1]!.charCodeAt(0) - 65, r: Number(m[2]) - 1 } : null;
};
export const allSquares = (m: { cols: number; rows: number }): string[] => {
  const out: string[] = [];
  for (let r = 0; r < m.rows; r++) for (let c = 0; c < m.cols; c++) out.push(squareOf(c, r));
  return out;
};

/** The grid's size by the forces (Jared: A-F by 1-6 typically, larger when needed). */
export function gridSize(unitsA: number, unitsB: number): number {
  const n = Math.max(unitsA, unitsB);
  return n > GRID.largeAt[1]! ? GRID.max : n > GRID.largeAt[0]! ? GRID.max - 1 : GRID.cols;
}

export const knownSite = (site: string, year: number): KnownSite | null => KNOWN_SITES.find((k) => k.names.test(site) && year >= k.from && year <= k.to) ?? null;

/** Reads the narrator's terrain line to features, one phrase per feature ("a ridge to the north, a river with one bridge"). */
export function featuresFromWords(text: string): { feature: Feature; note: string }[] {
  return text
    .split(/[;,]|\band\b/i)
    .map((p) => p.trim())
    .filter(Boolean)
    .flatMap((p) => {
      const f = FEATURE_WORDS.find(([re]) => re.test(p))?.[1];
      return f ? [{ feature: f, note: p.slice(0, 60) }] : [];
    })
    .slice(0, 12);
}

/**
 * The map: a known site's lore features, else the narrator's words placed by the seed (tagged invented), else a little open
 * country of the code's own (invented). Fixed once shown. The defender's positions sit in the middle columns, the command posts
 * at either edge.
 */
export function buildMap(o: { site: string; year: number; terrain: string | null; size: number; positions: number; defending: boolean; rng: RngState }): { map: GMap; rng: RngState } {
  let rng = o.rng;
  const cols = o.size;
  const rows = o.size;
  const squares: Record<string, GSquare> = {};
  for (const sq of allSquares({ cols, rows })) squares[sq] = { feature: 'open', note: '', invented: true };
  const site = knownSite(o.site, o.year);
  const objectives: string[] = [];
  if (site) {
    for (const f of site.features) {
      const p = parseSquare(f.square);
      if (p && p.c < cols && p.r < rows) squares[f.square] = { feature: f.feature, note: f.note, invented: false };
    }
    objectives.push(...site.objectives.filter((x) => squares[x]));
  } else {
    const wanted = o.terrain ? featuresFromWords(o.terrain) : [];
    // The narrator's features first, then a little of the code's own so the ground is never a blank table.
    const extra: { feature: Feature; note: string }[] = wanted.length ? [] : [{ feature: 'ridge', note: 'a low ridge' }, { feature: 'forest', note: 'a stand of woods' }, { feature: 'structure', note: 'a fortified outpost' }];
    for (const f of [...wanted, ...extra]) {
      // A river runs down a column, with its bridge on it; the rest sit on a free square.
      if (f.feature === 'river') {
        const [c, r1] = nextInt(rng, 2, cols - 3);
        rng = r1;
        for (let r = 0; r < rows; r++) if (squares[squareOf(c, r)]!.feature === 'open') squares[squareOf(c, r)] = { feature: 'river', note: f.note, invented: true };
        continue;
      }
      if (f.feature === 'bridge') {
        const riverSq = allSquares({ cols, rows }).filter((sq) => squares[sq]!.feature === 'river');
        if (riverSq.length) {
          const [i, r1] = nextInt(rng, 0, riverSq.length - 1);
          rng = r1;
          squares[riverSq[i]!] = { feature: 'bridge', note: f.note, invented: true };
          continue;
        }
      }
      const free = allSquares({ cols, rows }).filter((sq) => squares[sq]!.feature === 'open' && parseSquare(sq)!.c > 0 && parseSquare(sq)!.c < cols - 1);
      if (!free.length) break;
      const [i, r1] = nextInt(rng, 0, free.length - 1);
      rng = r1;
      squares[free[i]!] = { feature: f.feature, note: f.note, invented: true };
    }
  }
  // Positions: the defender's line in the middle columns, preferring the strong ground and the objectives.
  const midA = Math.floor(cols / 2) - 1;
  const midB = Math.floor(cols / 2);
  const line = allSquares({ cols, rows }).filter((sq) => {
    const p = parseSquare(sq)!;
    return (p.c === midA || p.c === midB) && squares[sq]!.feature !== 'river';
  });
  const score = (sq: string): number => (objectives.includes(sq) ? 10 : 0) + (FEATURE_DEF[squares[sq]!.feature].terrain.cover ? 3 : 0) + (squares[sq]!.feature === 'bridge' ? 4 : 0) + (FEATURE_DEF[squares[sq]!.feature].terrain.high ? 2 : 0);
  const positions = [...new Set([...objectives, ...[...line].sort((a, b) => score(b) - score(a) || a.localeCompare(b))])].slice(0, Math.max(GROUND_LIMITS.positions.min, Math.min(GROUND_LIMITS.positions.max, o.positions)));
  if (!objectives.length) objectives.push(...positions.filter((sq) => squares[sq]!.feature === 'structure' || squares[sq]!.feature === 'bridge').slice(0, 2));
  if (!objectives.length && positions[0]) objectives.push(positions[0]);
  const hqRow = Math.floor(rows / 2);
  const west = squareOf(0, hqRow);
  const east = squareOf(cols - 1, hqRow);
  const scouted = allSquares({ cols, rows }).filter((sq) => parseSquare(sq)!.c < midA);
  // The front positions are in sight (the line can be seen; who holds it, and in what strength, takes scouting); a known site's
  // ground is on the maps.
  const seen = site ? allSquares({ cols, rows }) : [...new Set([...scouted, ...positions])];
  return { map: { cols, rows, squares, seen, scouted, positions, objectives, hq: { player: west, enemy: east }, siteId: site?.id ?? null }, rng };
}

// ---- units from words ----

const NUMBER_WORDS: Readonly<Record<string, number>> = { a: 1, an: 1, one: 1, two: 2, pair: 2, three: 3, few: 3, several: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, dozen: 12 };
const UNIT_WORDS: readonly (readonly [RegExp, string | 'troops'])[] = [
  [/\banti[- ]?air\b|\bflak\b|\baa\b/i, 'antiAir'],
  [/\banti[- ]?armou?r\b|\brocket teams?\b|\bmissile teams?\b/i, 'antiArmour'],
  [/\bartillery\b|\bguns\b|\bmortars?\b|\bcannons?\b|\bbatter(?:y|ies)\b/i, 'artillery'],
  [/\bdroid armou?r\b|\bdroid tanks?\b|\baats?\b|\bspider droids?\b|\btank droids?\b/i, 'droidArmour'],
  [/\barmou?r\b|\btanks?\b|\bwalkers?\b|\bat-?te\b|\bat-?at\b|\bat-?st\b|\bjuggernauts?\b|\bspeeders?\b/i, 'armour'],
  [/\bair\b|\bgunships?\b|\blaat\b|\bstarfighters?\b|\bbombers?\b|\bair support\b/i, 'air'],
  [/\bsuper battle droids?\b|\bb2s?\b/i, 'superBattleDroids'],
  [/\bdroidekas?\b|\bdestroyer droids?\b/i, 'droidekas'],
  [/\bskytroopers?\b/i, 'skytroopers'],
  [/\bwar droids?\b/i, 'warDroids'],
  [/\bbattle droids?\b|\bb1s?\b|\bdroids?\b/i, 'battleDroids'],
  [/\bcommandos?\b|\bspecial forces\b|\brangers?\b|\bscouts?\b|\brecon\b/i, 'eliteInfantry'],
  [/\bmandalorians?\b/i, 'mandalorians'],
  [/\bclones?\b|\bclone troopers?\b/i, 'cloneInfantry'],
  [/\bstormtroopers?\b/i, 'stormtroopers'],
  [/\bsith troopers?\b|\bimperial troopers?\b/i, 'sithInfantry'],
  [/\byuuzhan vong\b|\bvong warriors?\b/i, 'vongWarriors'],
  [/\bbeasts?\b|\bmonsters?\b/i, 'warBeasts'],
  [/\bmilitia\b|\bpartisans?\b|\binsurgents?\b|\bvolunteers?\b|\bnationalists?\b|\brebels?\b/i, 'militia'],
  [/\binfantry\b|\btroop(?:er)?s\b|\bsoldiers\b|\bbattalions?\b|\bcompan(?:y|ies)\b|\bplatoons?\b|\bsquads?\b|\blegions?\b|\bregiments?\b|\bbrigades?\b|\bdivisions?\b/i, 'troops'],
];
/** The minion kind each side's ordinary troops are (setup's troopsFor) to a ground unit. */
const KIND_UNIT: Readonly<Record<string, string>> = Object.fromEntries(GROUND_UNITS.filter((u) => u.kind).map((u) => [u.kind!, u.id]));

/** Units from plain words ("two battalions of clone infantry, armour, artillery"), the side's ordinary troops for plain "troops". */
export function unitsFromWords(text: string, troopsKind: string, prefix: string): { units: GUnit[]; errors: string[] } {
  const units: GUnit[] = [];
  const errors: string[] = [];
  for (const part0 of text.split(/[;,+]|\band\b|\bwith\b/i)) {
    const part = part0.trim();
    if (!part) continue;
    const hit = UNIT_WORDS.find(([re]) => re.test(part));
    if (!hit) {
      errors.push(`"${part}" names no ground unit the code reads`);
      continue;
    }
    const id = hit[1] === 'troops' ? (KIND_UNIT[troopsKind] ?? 'infantry') : hit[1];
    const n = /\b(\d{1,2})\b/.exec(part)?.[1];
    const w = part.toLowerCase().split(/\s+/).find((x) => x in NUMBER_WORDS);
    const count = Math.max(1, Math.min(GROUND_LIMITS.unitsPerSide, n ? Number(n) : w ? NUMBER_WORDS[w]! : 1));
    for (let i = 0; i < count && units.length < GROUND_LIMITS.unitsPerSide; i++) {
      const def = unitDef(id);
      units.push({ id: `${prefix}${units.length + 1}`, unit: id, label: `${def.label} ${units.filter((u) => u.unit === id).length + 1}`, size: 1, bond: 50, fear: 0 });
    }
  }
  return { units, errors };
}

// ---- the enemy's plan and deployment ----

/** The NPC commander's manoeuvre: one it knows, for holding or attacking (seeded). */
export function enemyPlan(defending: boolean, knows: readonly string[], rng: RngState): [Plan, RngState] {
  const pool = (defending ? DEFENDING_PLANS : ATTACKING_PLANS).filter((p) => knows.some((t) => TACTIC_PLAN[t] === p));
  const list = pool.length ? pool : [defending ? 'defenceInDepth' : 'frontal'] as Plan[];
  const [i, r] = nextInt(rng, 0, list.length - 1);
  return [list[i]!, r];
}

/** Where the enemy puts its units: spread over the positions, heavier on objectives; an attacker by its manoeuvre. */
export function deployEnemy(units: readonly GUnit[], map: GMap, plan: Plan, defending: boolean, rng: RngState): [Record<string, string[]>, RngState] {
  let r = rng;
  const deploy: Record<string, string[]> = {};
  const fighting = units.filter((u) => !['artillery', 'air'].includes(unitDef(u.unit).type));
  const pos = [...map.positions];
  // An attacker (the player defends) picks its targets by manoeuvre; a defender holds every position.
  let targets = pos;
  if (!defending) {
    if (plan === 'raid' || plan === 'siege') targets = map.objectives.filter((x) => pos.includes(x)).slice(0, 2);
    else if (plan === 'flanking' || plan === 'envelopment') targets = [pos[0]!, pos.at(-1)!].filter((x, i, a) => x && a.indexOf(x) === i);
    else if (plan === 'feint') targets = pos.slice(0, Math.max(2, Math.ceil(pos.length / 2)));
    if (!targets.length) targets = pos;
  }
  const weight = (sq: string): number => (map.objectives.includes(sq) ? 2 : 1);
  const order = [...targets].sort((a, b) => weight(b) - weight(a) || a.localeCompare(b));
  let i = 0;
  for (const u of fighting) {
    const [x, r1] = nextFloat(r);
    r = r1;
    const sq = x < 0.25 ? order[0]! : order[i % order.length]!;
    i++;
    (deploy[sq] ??= []).push(u.id);
  }
  return [deploy, r];
}

// ---- the plan: checks ----

export const planOfTactic = (id: string | null): Plan | null => (id ? (TACTIC_PLAN[id] ?? null) : null);
export const tacticOfPlan = (p: Plan): string => Object.entries(TACTIC_PLAN).find(([, v]) => v === p)?.[0] ?? p;

/**
 * Which way a sector's phase went, from our side (A): +1 ours, -1 theirs, 0 even (m8-fixes C2). A strike that landed goes to its
 * striker (the track then resets to 0); otherwise the track's own movement decides, so a line can never say "neither side gains"
 * while the track moved.
 */
export function phaseDirection(rec: Pick<PhaseRecord, 'before' | 'after' | 'by'>): 1 | -1 | 0 {
  if (rec.by) return rec.by === 'A' ? 1 : -1;
  return Math.sign(rec.after - rec.before) as 1 | -1 | 0;
}

/**
 * The plain-English line for one sector's phase (m8-fixes C1, C2): the one function the battle log uses, made from the same record
 * as the track's movement. Every result code has its own words; nothing internal reaches the screen. `own` is the player's own
 * fight in that sector this phase, told in the same sentence so the two cannot contradict each other.
 */
export function phaseLine(rec: Pick<PhaseRecord, 'before' | 'after' | 'by' | 'result' | 'notes'>, square: string, own?: 'won' | 'held' | 'lost' | null): string {
  const dir = phaseDirection(rec);
  const ours = rec.by === 'A';
  let what: string;
  switch (rec.result) {
    case 'light':
      what = ours ? 'we gain ground' : 'the enemy gain ground';
      break;
    case 'positionTaken':
      what = ours ? 'we take the position' : 'the enemy take the position';
      break;
    case 'rout':
      what = ours ? 'the enemy break and run; we take the position' : 'our troops break and run; the enemy take the position';
      break;
    case 'collapse':
      what = ours ? "the enemy's line collapses; we take the position" : 'our line collapses; the enemy take the position';
      break;
    case 'held':
      // A strike that did not land: the side that had the edge was held, and the track fell back toward even.
      what = rec.before >= 0 ? 'our push is held; the enemy steady their line' : "we hold the enemy's push";
      break;
    default:
      what = dir > 0 ? 'we gain the upper hand' : dir < 0 ? 'the enemy gain the upper hand' : 'neither side gains';
  }
  // Morale checks and units routing elsewhere in the sector: the engine's own notes, already in words (the take and gain notes
  // are said above).
  const extra = rec.notes.filter((n: string) => !/ take | gain ground in | collapses$/.test(` ${n}`) && !/^[a-z]+[A-Z]\w*$/.test(n));
  const lead = own === 'won' ? `At ${square} you break the enemy in front of you` : own === 'lost' ? `At ${square} the fight goes against you` : own === 'held' ? `At ${square} you hold your own` : null;
  const joined = lead ? `${lead}${(own === 'won' && dir <= 0) || (own === 'lost' && dir >= 0) ? ', but' : ';'} ${what}` : `${square}: ${what}`;
  return `${joined}${extra.length ? ` (${extra.join('; ')})` : ''}.`;
}

/** What is wrong with a plan, or nothing (Jared: objectives, a known manoeuvre, sectors, support, a reserve, two contingencies). */
export function planProblems(p: GroundPlanning, plan: GroundPlan = p.plan): string[] {
  const out: string[] = [];
  const ids = new Set(p.ours.units.map((u) => u.id));
  const used = new Map<string, string>();
  const take = (id: string, where: string): void => {
    if (!ids.has(id)) out.push(`no unit ${id}`);
    else if (used.has(id)) out.push(`${id} is in two places (${used.get(id)} and ${where})`);
    else used.set(id, where);
  };
  if (!plan.primary) out.push('a primary objective is needed');
  else if (!p.map.positions.includes(plan.primary)) out.push(`${plan.primary} is not a position on the map`);
  if (plan.secondary && !p.map.positions.includes(plan.secondary)) out.push(`${plan.secondary} is not a position on the map`);
  if (plan.secondary && plan.secondary === plan.primary) out.push('the secondary objective is the primary');
  if (!plan.manoeuvre) out.push('a manoeuvre is needed');
  else if (!TACTIC_PLAN[plan.manoeuvre]) out.push(`${plan.manoeuvre} is not a ground manoeuvre`);
  else if (!(p.planKnows ?? p.known).includes(plan.manoeuvre)) out.push(`${TACTIC_BY_ID.get(plan.manoeuvre)?.name ?? plan.manoeuvre} is not a tactic ${p.role === 'commander' ? 'the character knows' : `${p.ours.commander.name} knows`}`);
  if (!plan.sectors.some((s) => s.units.length)) out.push('at least one sector needs units');
  const leaders = new Set<string>();
  for (const s of plan.sectors) {
    if (!p.map.positions.includes(s.square)) out.push(`${s.square} is not a position on the map`);
    for (const id of s.units) take(id, s.square);
    if (s.leader) {
      if (leaders.has(s.leader)) out.push(`${s.leader === 'player' ? 'the player' : s.leader} leads two sectors`);
      leaders.add(s.leader);
      if (s.leader === 'player' && p.atPost) out.push('the player commands from the post and cannot lead a sector');
      if (s.leader !== 'player' && !p.leaders.some((l) => l.npcId === s.leader)) out.push(`${s.leader} is not here to lead`);
    }
  }
  for (const id of plan.reserve) take(id, 'the reserve');
  for (const k of ['artillery', 'armour', 'air'] as const) {
    const at = plan.support[k];
    if (!at) continue;
    if (!plan.sectors.some((s) => s.square === at)) out.push(`${k} support goes to a sector of the plan`);
    const want = k === 'armour' ? 'armour' : k;
    if (!p.ours.units.some((u) => unitDef(u.unit).type === want && !used.has(u.id))) out.push(`no ${k} free for support`);
    if (k === 'air' && !WEATHER[p.weather].air) out.push(`no air support in this weather (${p.weather})`);
  }
  if (plan.contingencies.length > MAX_CONTINGENCIES) out.push(`at most ${MAX_CONTINGENCIES} contingencies`);
  for (const c of plan.contingencies) {
    if (!(CONTINGENCY_TRIGGERS as readonly string[]).includes(c.when) || !(CONTINGENCY_ACTIONS as readonly string[]).includes(c.then)) out.push('a contingency needs a trigger and an action');
    if (c.then === 'switchPlan' && (!c.manoeuvre || !(p.planKnows ?? p.known).includes(c.manoeuvre))) out.push('switching the manoeuvre needs a known ground tactic');
    if (c.then === 'commitReserve' && !plan.reserve.length) out.push('committing the reserve needs a reserve');
  }
  return out;
}

/** A plan the code makes (an NPC commander's, or standing orders): the known manoeuvre, units spread over the positions. */
export function defaultPlan(p: Pick<GroundPlanning, 'map' | 'ours' | 'known' | 'defending' | 'role' | 'atPost' | 'weather'>, playerLeads: boolean): GroundPlan {
  const fighting = p.ours.units.filter((u) => !['artillery', 'air'].includes(unitDef(u.unit).type));
  const targets = p.map.objectives.length ? [...new Set([...p.map.objectives, ...p.map.positions])].slice(0, Math.max(1, Math.min(p.map.positions.length, fighting.length))) : p.map.positions.slice(0, Math.max(1, fighting.length));
  const sectors: GSector[] = targets.map((sq) => ({ square: sq, units: [], leader: null }));
  const reserveN = fighting.length >= 4 ? 1 : 0;
  const reserve = fighting.slice(fighting.length - reserveN).map((u) => u.id);
  fighting.slice(0, fighting.length - reserveN).forEach((u, i) => sectors[i % sectors.length]!.units.push(u.id));
  if (playerLeads && sectors[0]) sectors[0].leader = 'player';
  const pick = (want: string): string | null => (p.ours.units.some((u) => unitDef(u.unit).type === want) ? (sectors[0]?.square ?? null) : null);
  const choices = (p.defending ? DEFENDING_PLANS : ATTACKING_PLANS).map(tacticOfPlan).filter((t) => p.known.includes(t));
  return {
    primary: p.map.objectives[0] ?? p.map.positions[0] ?? null,
    secondary: p.map.objectives[1] ?? null,
    manoeuvre: choices[0] ?? p.known.find((t) => TACTIC_PLAN[t]) ?? null,
    sectors: sectors.filter((s) => s.units.length),
    support: { artillery: pick('artillery'), armour: null, air: WEATHER[p.weather].air ? pick('air') : null },
    reserve,
    contingencies: [],
  };
}

// ---- scouting ----

/**
 * One scouting try (Jared: Stealth, Intelligence, recon units): reveals squares on the enemy side; an intelligence read can give
 * the enemy's likely plan; a bad failure is noticed. The caller passes the roller's level.
 */
export function scout(p: GroundPlanning, how: 'recon' | 'intelligence', level: number, rng: RngState): { planning: GroundPlanning; rng: RngState; line: string } {
  if (p.scouting.tries >= SCOUTING.tries) return { planning: p, rng, line: 'no time is left to scout before the battle' };
  const recon = p.ours.units.some((u) => unitDef(u.unit).raider) ? SCOUTING.reconUnits : 0;
  const [roll, r1] = basicRoll(rng, level, recon ? [{ source: 'recon units', value: recon }] : []);
  const margin = Math.round(roll.total - SCOUTING.dc);
  const hidden = allSquares(p.map).filter((sq) => !p.map.scouted.includes(sq));
  // Nearest the friendly side first (positions before the far rear).
  const byNear = hidden.sort((a, b) => parseSquare(a)!.c - parseSquare(b)!.c || (p.map.positions.includes(b) ? 1 : 0) - (p.map.positions.includes(a) ? 1 : 0) || a.localeCompare(b));
  const n = margin >= 0 ? SCOUTING.squares + Math.floor(margin / SCOUTING.perMargin) : 0;
  const shown = byNear.slice(0, n);
  const planKnown = p.scouting.planKnown || (how === 'intelligence' && margin >= SCOUTING.planAt);
  const noticed = p.scouting.noticed || margin <= -SCOUTING.noticed;
  const line = margin >= 0
    ? `Scouting (${how}, ${Math.round(roll.total)} against ${SCOUTING.dc}): ${shown.length ? `revealed ${shown.join(', ')}` : 'nothing more to find'}${planKnown && !p.scouting.planKnown ? `; the enemy's likely plan: ${PLAN_LABEL[p.enemy.plan]}` : ''}.`
    : `Scouting (${how}, ${Math.round(roll.total)} against ${SCOUTING.dc}): nothing learned${noticed && !p.scouting.noticed ? '; the scouts were seen' : ''}.`;
  return {
    planning: { ...p, map: { ...p.map, scouted: [...p.map.scouted, ...shown], seen: [...new Set([...(p.map.seen ?? []), ...shown])] }, scouting: { tries: p.scouting.tries + 1, planKnown, noticed, log: [...p.scouting.log, line].slice(-8) } },
    rng: r1,
    line,
  };
}

// ---- the map, drawn ----

const unitLetter = (u: GUnit): string => GROUND_UNITS.find((d) => d.id === u.unit)?.letter ?? 'i';

/** The plan map and its key below (Jared's layout): unscouted squares stay '?', the key lists the features and the unknown. */
export function drawMap(p: GroundPlanning, g: GroundState | null, title: string): string {
  const m = p.map;
  const cell = GRID.cell;
  const lines: string[] = [title];
  lines.push(`  ${Array.from({ length: m.cols }, (_, c) => colName(c).padEnd(cell)).join('')}`.trimEnd());
  const sectorsNow = new Map((g?.battle.sectors ?? []).map((s) => [s.square, s]));
  const view = g ? visibleSquares(g) : null;
  const ownAt = new Map<string, string>();
  for (const s of (g?.planning.plan ?? p.plan).sectors) for (const id of s.units) ownAt.set(id, s.square);
  for (let r = 0; r < m.rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < m.cols; c++) {
      const sq = squareOf(c, r);
      const known = m.scouted.includes(sq);
      let mark = (m.seen ?? m.scouted).includes(sq) ? FEATURE_DEF[m.squares[sq]!.feature].symbol : '?';
      const mine = p.ours.units.filter((u) => ownAt.get(u.id) === sq);
      const theirs = known ? (p.enemy.deploy[sq] ?? []).map((id) => p.enemy.units.find((u) => u.id === id)!).filter(Boolean) : [];
      const sec = sectorsNow.get(sq);
      if (sec && view && !view.has(sq)) mark = '?';
      else if (sec && sec.decided) mark = sec.controller === 'A' ? '+' : 'x';
      else if (mine.length) mark = `${unitLetter(mine[0]!)}${mine.length}`;
      else if (theirs.length) mark = `r${theirs.length}`;
      if (sq === m.hq.player) mark = 'HQ';
      if (sq === m.hq.enemy && known) mark = 'T';
      if (p.plan.primary === sq || p.plan.secondary === sq) mark = sec?.decided ? mark : `${mark}*`.slice(0, cell - 1);
      row.push(mark.padEnd(cell));
    }
    lines.push(`${String(r + 1).padEnd(2)}${row.join('')}`.trimEnd());
  }
  lines.push('Units: i infantry  d droids  a armour  g guns  v air  t anti-armour  x anti-air (yours, with count); r enemy; HQ your post; T theirs; * objective; + held; x lost');
  lines.push('Terrain:');
  const byFeature = new Map<string, string[]>();
  for (const sq of m.seen ?? m.scouted) {
    const s = m.squares[sq]!;
    if (s.feature === 'open' && !s.note) continue;
    const k = `${FEATURE_DEF[s.feature].key}${s.note ? ` (${s.note})` : ''}${s.invented ? ', invented' : ''}`;
    byFeature.set(k, [...(byFeature.get(k) ?? []), sq]);
  }
  for (const [k, sqs] of byFeature) lines.push(`  ${sqs.join(' ')}  ${k}`);
  lines.push(`  Positions: ${m.positions.join(' ')}${m.objectives.length ? `; objectives on the ground: ${m.objectives.join(' ')}` : ''}`);
  const unknown = allSquares(m).filter((sq) => !(m.seen ?? m.scouted).includes(sq));
  if (unknown.length) lines.push(`  Unknown: ${unknown.join(' ')} not yet scouted`);
  const unscoutedFront = m.positions.filter((sq) => !m.scouted.includes(sq));
  if (unscoutedFront.length && !g) lines.push(`  Enemy strength unknown at: ${unscoutedFront.join(' ')}`);
  return lines.join('\n');
}

/** What the player sees in battle (Jared): the whole picture at the post or with the officers' lines; else their own sector. */
export function visibleSquares(g: GroundState): Set<string> {
  const all = new Set(g.battle.sectors.map((s) => s.square));
  if (!g.playerSector || g.battle.a.contact) return all;
  return new Set([g.playerSector]);
}

// ---- starting the battle ----

const featureTerrain = (f: Feature, holder: 'A' | 'B'): Sector['terrain'] => {
  const t = { ...FEATURE_DEF[f].terrain };
  if (t.high) t.high = holder;
  return t;
};

/** The plan fixed and the battle built on the engine (Jared: the plan is set in the planning scene, then fixed). */
export function beginGround(p: GroundPlanning, rng: RngState): GroundState | { reject: string } {
  const problems = planProblems(p);
  if (problems.length) return { reject: problems.join('; ') };
  const plan = p.plan;
  const byId = new Map(p.ours.units.map((u) => [u.id, u]));
  const enemyById = new Map(p.enemy.units.map((u) => [u.id, u]));
  const toEngine = (u: GUnit): ReturnType<typeof groundUnit> => groundUnit(u.id, u.unit, { name: u.label, size: u.size, bond: u.bond, fear: u.fear });
  const leaderOf = (id: string | null): SectorLeader | null => {
    if (!id) return null;
    if (id === 'player') return { name: p.me.name, tactics: p.me.tactics, forceUser: p.me.forceUser, tier: p.me.tier, alive: true };
    const l = p.leaders.find((x) => x.npcId === id);
    return l ? { name: l.name, tactics: l.tactics, forceUser: l.forceUser, tier: l.tier, alive: true } : null;
  };
  const playerAttacks = !p.defending;
  const sectors: Sector[] = [];
  const squares = [...new Set([...plan.sectors.map((s) => s.square), ...Object.keys(p.enemy.deploy)])];
  for (const sq of squares) {
    const mine = plan.sectors.find((s) => s.square === sq);
    const ours = (mine?.units ?? []).map((id) => byId.get(id)!).filter(Boolean).map(toEngine);
    const theirs = (p.enemy.deploy[sq] ?? []).map((id) => enemyById.get(id)!).filter(Boolean).map(toEngine);
    if (!ours.length && !theirs.length) continue;
    const holder: 'A' | 'B' = playerAttacks ? 'B' : 'A';
    const support = (side: 'A' | 'B'): { artillery?: boolean; armour?: boolean; air?: boolean } => {
      if (side === 'B') return { ...(p.enemy.units.some((u) => unitDef(u.unit).type === 'artillery') && p.map.objectives.includes(sq) ? { artillery: true } : {}) };
      return { ...(plan.support.artillery === sq ? { artillery: true } : {}), ...(plan.support.armour === sq ? { armour: true } : {}), ...(plan.support.air === sq && WEATHER[p.weather].air ? { air: true } : {}) };
    };
    const objective = sq === plan.primary || sq === plan.secondary || p.map.objectives.includes(sq);
    const s = sector(sq, sectorSide(ours, { leader: leaderOf(mine?.leader ?? null), support: support('A') }), sectorSide(theirs, { support: support('B') }), {
      square: sq,
      name: `${sq}${p.map.squares[sq]?.note ? ` (${p.map.squares[sq]!.note})` : ''}`,
      terrain: featureTerrain(p.map.squares[sq]?.feature ?? 'open', holder),
      attacker: playerAttacks ? 'A' : 'B',
      controller: holder,
      objective,
    });
    // A position only one side came to is settled at once: held by whoever is there.
    if (!ours.length || !theirs.length) sectors.push({ ...s, decided: true, controller: ours.length ? 'A' : 'B' });
    else sectors.push(s);
  }
  if (!sectors.some((s) => !s.decided)) return { reject: 'no sector of the plan meets the enemy: scout, or send units where the enemy is' };
  // The player at the front: the sector they lead, or (in the line) the first sector of the plan; at the post, none.
  const playerSector = plan.sectors.find((s) => s.leader === 'player')?.square ?? (p.role === 'soldier' ? (plan.sectors[0]?.square ?? null) : null);
  const med = (m: GSide['meditation']): GroundForce['meditation'] => (m ? { name: m.name, level: m.level, alive: true } : null);
  const a = groundForce(p.ours.name, planOfTactic(plan.manoeuvre)!, { meditation: med(p.ours.meditation), contact: p.ours.officers && !p.jammed });
  const b = groundForce(p.enemy.name, p.enemy.plan, { meditation: med(p.enemy.meditation), contact: p.enemy.officers });
  const battle = startGround(a, b, sectors, rng);
  const g: GroundState = {
    id: p.id,
    planning: p,
    battle,
    reserve: [...plan.reserve],
    pending: [],
    penaltyAt: null,
    used: plan.manoeuvre ? [plan.manoeuvre] : [],
    learned: [],
    auto: false,
    log: [],
    map: '',
    playerSector,
    fight: playerSector ? { fightId: null, result: null, offered: false } : null,
    xp: { gaps: [] },
    contingencies: plan.contingencies.map((c) => ({ ...c, used: false })),
    fallen: [],
    end: null,
    hazards: [],
  };
  return { ...g, map: drawMap(p, g, `BATTLE · ${p.site} · phase 0`) };
}

// ---- in battle ----

const sideKey = (who: 'A' | 'B'): 'a' | 'b' => (who === 'A' ? 'a' : 'b');

/** The menu of orders this phase (the player's choices; the code plays every other part). */
export interface GroundMenuOption {
  group: string;
  label: string;
  orders: GroundOrders;
  available: boolean;
  why?: string;
  strong?: string;
  weak?: string;
}

/** A wider change (not the player's own sector) without the officers' lines takes a phase and carries a penalty (Jared). */
export const delayed = (g: GroundState, o: GroundOrders): boolean => {
  if (g.battle.a.contact) return false;
  if (o.manoeuvre) return true;
  const target = o.commit ?? o.move?.to;
  if (!target) return false;
  if (target === g.playerSector) return false;
  // High-bond units improvise in their own sector: a change to it lands at once.
  const s = g.battle.sectors.find((x) => x.square === target);
  const units = s?.a.units.filter(standing) ?? [];
  return !(units.length && units.every((u) => u.bond >= CHANGE.improviseBond));
};

/** Who takes over (m8-audit A4): the best named leader of ours still on the field, else a second-in-command (invented Tactics). */
export function nextInLine(g: GroundState): { name: string; tactics: number } {
  const p = g.planning;
  if (p.role !== 'commander') {
    const sq = g.playerSector;
    return { name: sq ? `the officers at ${sq}` : 'the officers', tactics: SECOND_IN_COMMAND_TACTICS };
  }
  const named = p.leaders.filter((l) => l.name !== p.me.name && !(l.npcId && g.fallen.includes(l.npcId)) && g.battle.sectors.some((s) => s.a.leader?.name === l.name));
  const best = [...named].sort((a, b) => b.tactics - a.tactics)[0];
  return best ? { name: best.name, tactics: best.tactics } : { name: 'your second-in-command', tactics: SECOND_IN_COMMAND_TACTICS };
}

/** The one who has the command now, when the player is out of it (recorded, or about to be: the rule acts at once). */
export function handedNow(g: GroundState, cond: CommanderCondition): { name: string; tactics: number } | null {
  if (g.handedTo) return g.handedTo;
  if (g.stayAtPost || !outOfFight(cond)) return null;
  if (g.planning.role === 'soldier') return null;
  if (g.planning.role === 'leader' && !g.playerSector) return null;
  return nextInLine(g);
}

/** The player commands this battle now: the commander's role, not handed over (staying at the post keeps it). */
export const commandingGround = (g: GroundState, cond: CommanderCondition = FIT): boolean => g.planning.role === 'commander' && handedNow(g, cond) === null && keepsCommand(cond, g.stayAtPost === true);

/**
 * Command passes (m8-audit A4): to the next in line; a sector the player led goes to its unit's officers. The player leaves the
 * front (carried to the medics); the battle goes on without their own fight.
 */
export function handGroundCommand(g: GroundState): { ground: GroundState; lines: string[] } {
  const to = nextInLine(g);
  const sq = g.playerSector;
  const me = g.planning.me.name;
  const sectors = g.battle.sectors.map((s) => (s.square === sq && s.a.leader?.name === me ? { ...s, a: { ...s.a, leader: null } } : s));
  const line = g.planning.role === 'commander' ? `You are out of the fight. Command passes to ${to.name}.` : `You are out of the fight. ${to.name.charAt(0).toUpperCase()}${to.name.slice(1)} take your sector.`;
  return { ground: { ...g, handedTo: to, playerSector: null, battle: { ...g.battle, sectors }, log: [...g.log, line].slice(-40) }, lines: [line] };
}

/** The player's choice (m8-audit A4): stay at the post while out of the fight. Command (or the sector) is theirs again. */
export function stayAtPost(g: GroundState): { ground: GroundState; lines: string[] } {
  const line = g.planning.role === 'commander' ? 'You stay at your post. You keep command, and no one carries you from the field.' : 'You stay at your post. You hold your sector, and no one carries you from the field.';
  return { ground: { ...g, handedTo: null, stayAtPost: true, log: [...g.log, line].slice(-40) }, lines: [line] };
}

/** Medical help can reach the player on the field: our side still has troops standing (their medics). */
export const groundHelpReaches = (g: GroundState): boolean => g.battle.sectors.some((s) => s.a.units.some(standing)) || g.reserve.length > 0;

export function groundMenu(g: GroundState, cond: CommanderCondition = FIT): { title: string; now: string; options: GroundMenuOption[]; known: string[] } {
  const p = g.planning;
  const opts: GroundMenuOption[] = [];
  // The wounded commander (m8-audit A4): out of the fight, command passes at once unless the player stays at their post.
  const handed = handedNow(g, cond);
  const commanding = commandingGround(g, cond);
  const plan = g.battle.a.plan;
  const lag = !g.battle.a.contact ? ' (no command post in contact: lands next phase, -1)' : '';
  if (commanding) {
    for (const t of p.known.filter((x) => TACTIC_PLAN[x] && TACTIC_PLAN[x] !== plan)) {
      const pl = TACTIC_PLAN[t]!;
      opts.push({ group: 'manoeuvre', label: TACTIC_BY_ID.get(t)?.name ?? t, orders: { manoeuvre: t }, available: true, strong: PLAN_BEATS[pl].map((x) => PLAN_LABEL[x]).join(', '), weak: (Object.entries(PLAN_BEATS) as [Plan, readonly Plan[]][]).filter(([, v]) => v.includes(pl)).map(([k]) => PLAN_LABEL[k]).join(', ') || 'nothing in particular', ...(lag ? { why: lag } : {}) });
    }
    for (const s of g.battle.sectors.filter((x) => !x.decided)) {
      const why = g.reserve.length ? (delayed(g, { commit: s.square }) ? lag : '') : 'no reserve left';
      opts.push({ group: 'reserve', label: `Commit the reserve to ${s.square}`, orders: { commit: s.square }, available: g.reserve.length > 0, ...(why ? { why } : {}) });
    }
  }
  if (handed && mayStayAtPost(cond, g.stayAtPost === true)) {
    const w = stayAtPostLabel(cond);
    opts.push({ group: 'command', label: w.label, orders: { stayAtPost: true }, available: true, why: w.why });
  }
  if (g.playerSector && !outOfFight(cond)) {
    const mine = g.battle.sectors.find((s) => s.square === g.playerSector);
    if (mine && !mine.decided) {
      const leads = mine.a.leader?.name === p.me.name;
      opts.push({ group: 'your sector', label: `Fall back from ${g.playerSector}`, orders: { fallBack: true }, available: leads, why: leads ? 'your own sector: at once' : 'only the one leading the sector orders it back' });
      opts.push({ group: 'your sector', label: 'Fight it out in person', orders: { fightInPerson: true }, available: !g.fight?.fightId, why: 'personal combat; the result counts for your sector next phase' });
    }
  }
  if (commanding) opts.push({ group: 'battle', label: 'Withdraw from the field', orders: { withdraw: true }, available: true });
  const where = handed ? `you are out of the fight: ${handed.name} ${p.role === 'commander' ? 'commands' : 'leads your sector'}${g.medicReached ? '; the medics have you' : ''}` : outOfFight(cond) && g.stayAtPost ? `you are out of the fight and stay at your post${g.playerSector ? ` at ${g.playerSector}` : ''}` : g.playerSector ? `you lead ${g.playerSector}` : commanding ? 'you command from the post' : 'you fight in the line';
  const contact = g.battle.a.contact ? 'the officers\' lines are open' : 'no command post in contact';
  const seen = visibleSquares(g);
  const sectorText = g.battle.sectors
    .filter((s) => seen.has(s.square))
    .map((s) => `${s.square} ${s.decided ? (s.controller === 'A' ? 'held' : 'lost') : `track ${s.track > 0 ? '+' : ''}${s.track}`}`)
    .join(', ');
  return {
    title: commanding ? 'Ground battle: your command' : handed ? 'Ground battle: command has passed' : 'Ground battle: your sector',
    now: `Phase ${g.battle.phase}${g.battle.phase ? '' : ' (about to begin)'} · ${PLAN_LABEL[plan]} against ${p.scouting.planKnown || g.battle.phase > 0 ? PLAN_LABEL[p.enemy.plan] : 'an unknown plan'} · ${where}; ${contact}. ${sectorText}${g.reserve.length ? ` · reserve: ${g.reserve.length}` : ''}`,
    options: opts,
    known: p.scouting.planKnown ? [`The enemy's plan: ${PLAN_LABEL[p.enemy.plan]}`] : [],
  };
}

function applyOrders(g0: GroundState, o: GroundOrders, lines: string[]): GroundState {
  let g = g0;
  const sectors = (): Sector[] => g.battle.sectors;
  if (o.manoeuvre && TACTIC_PLAN[o.manoeuvre]) {
    g = { ...g, battle: { ...g.battle, a: { ...g.battle.a, plan: TACTIC_PLAN[o.manoeuvre]! } } };
    lines.push(`The plan changes: ${PLAN_LABEL[TACTIC_PLAN[o.manoeuvre]!]}.`);
  }
  // A unit that fell back keeps what it lost: it leaves its old sector and fights again where it is sent.
  const moveIn = (ids: string[], to: string): void => {
    const units = ids.flatMap((id) => {
      const was = sectors().flatMap((s) => s.a.units).find((u) => u.id === id);
      if (was) return was.state === 'stopped' ? [{ ...was, state: 'fighting' as const }] : standing(was) ? [was] : [];
      const u = g.planning.ours.units.find((x) => x.id === id);
      return u ? [groundUnit(u.id, u.unit, { name: u.label, size: u.size, bond: u.bond, fear: u.fear })] : [];
    });
    const moving = new Set(units.map((u) => u.id));
    g = { ...g, battle: { ...g.battle, sectors: sectors().map((s) => (s.square === to ? { ...s, a: { ...s.a, units: [...s.a.units.filter((u) => !moving.has(u.id)), ...units] } } : { ...s, a: { ...s.a, units: s.a.units.filter((u) => !moving.has(u.id)) } })) } };
  };
  if (o.commit && g.reserve.length) {
    moveIn(g.reserve, o.commit);
    lines.push(`The reserve goes in at ${o.commit}.`);
    g = { ...g, reserve: [] };
  }
  if (o.move) {
    const from = sectors().find((s) => s.a.units.some((u) => u.id === o.move!.unit));
    const u = from?.a.units.find((x) => x.id === o.move!.unit);
    if (from && u && standing(u)) {
      g = { ...g, battle: { ...g.battle, sectors: sectors().map((s) => (s.square === from.square ? { ...s, a: { ...s.a, units: s.a.units.filter((x) => x.id !== u.id) } } : s.square === o.move!.to ? { ...s, a: { ...s.a, units: [...s.a.units, u] } } : s)) } };
      lines.push(`${u.name} shift from ${from.square} to ${o.move.to}.`);
    }
  }
  return g;
}

/** A sector falls back: its units leave it to the enemy and join the reserve. */
function fallBack(g: GroundState, sq: string, lines: string[]): GroundState {
  const s = g.battle.sectors.find((x) => x.square === sq);
  if (!s || s.decided) return g;
  const saved = s.a.units.filter(standing).map((u) => u.id);
  lines.push(`${sq} falls back in order; the enemy takes the ground.`);
  const playerLeft = g.playerSector === sq;
  return { ...g, reserve: [...g.reserve, ...saved], playerSector: playerLeft ? null : g.playerSector, battle: { ...g.battle, sectors: g.battle.sectors.map((x) => (x.square === sq ? { ...x, a: { ...x.a, units: x.a.units.map((u) => (standing(u) ? { ...u, state: 'stopped' as const } : u)) }, controller: 'B' as const, decided: true } : x)) } };
}

/** Contingencies fire on what the last phase did, and carry out without penalty (Jared). */
function contingencies(g0: GroundState, phaseLog: GroundBattle['log'], lines: string[], big: string[], medKilled: boolean): GroundState {
  let g = g0;
  const list = g.contingencies.map((c) => ({ ...c }));
  for (const c of list) {
    if (c.used) continue;
    const fired = ((): string | null => {
      switch (c.when) {
        case 'sectorFalling': {
          const hit = g.battle.sectors.find((x) => !x.decided && x.track <= FALLING_AT && (!c.sector || x.square === c.sector));
          return hit ? hit.square : null;
        }
        case 'positionLost': {
          const hit = phaseLog.find((r) => (r.result === 'positionTaken' || r.result === 'rout' || r.result === 'collapse') && r.by === 'B' && (!c.sector || r.sector === c.sector));
          return hit ? hit.sector : null;
        }
        case 'leaderKilled':
          return g.battle.sectors.find((x) => x.a.leader && !x.a.leader.alive && !g.fallen.includes(`seen:${x.square}`) && (!c.sector || x.square === c.sector))?.square ?? null;
        case 'meditatorKilled':
          return medKilled ? (c.sector ?? g.battle.sectors.find((x) => !x.decided)?.square ?? '') : null;
        case 'strengthHalved':
          return forceLeft(g.battle, 'A') <= 0.5 ? (c.sector ?? g.battle.sectors.find((x) => !x.decided)?.square ?? '') : null;
        case 'objectiveTaken': {
          const p = g.battle.sectors.find((x) => x.square === g.planning.plan.primary);
          return p && p.controller === 'A' && p.decided ? (c.sector ?? p.square) : null;
        }
      }
    })();
    if (fired === null) continue;
    c.used = true;
    const where = c.sector ?? fired;
    const text = `Contingency: ${TRIGGER_LABEL[c.when]} (${where || 'the field'}): ${ACTION_LABEL[c.then]}.`;
    lines.push(text);
    big.push(text);
    if (c.then === 'commitReserve' && g.reserve.length && where) g = applyOrders(g, { commit: where }, lines);
    if (c.then === 'reinforce' && where) {
      const strongest = g.battle.sectors.filter((x) => !x.decided && x.square !== where).sort((a, b) => b.track - a.track)[0];
      const u = strongest?.a.units.find(standing);
      if (strongest && u && strongest.a.units.filter(standing).length > 1) g = applyOrders(g, { move: { unit: u.id, to: where } }, lines);
    }
    if (c.then === 'fallBack' && where) g = fallBack(g, where, lines);
    if (c.then === 'switchPlan' && c.manoeuvre) g = applyOrders(g, { manoeuvre: c.manoeuvre }, lines);
    if (c.then === 'withdraw') g = { ...g, end: { winner: 'enemy', reason: 'withdrawn' } };
  }
  return { ...g, contingencies: list };
}

export interface GroundCtx {
  /** The player's personal fight level (the better of their combat levels) for their own fight each phase. */
  playerCombat: number;
  /** The player is out of the fight (m8-audit A4): no own fight in their sector. */
  playerOut?: boolean;
  /** The commander's Tactics on each side (the phase's command roll). */
  commanderTactics: { player: number; enemy: number };
}

/** The commanders' Tactics roll each phase (invented): the winner's side +1 for each 4 of margin, at most 2; out of contact it does not reach the sectors. */
function commandRoll(g: GroundState, ctx: GroundCtx, rng: RngState): [Modifier[], Modifier[], RngState, number] {
  const [c, r] = contest(rng, { level: ctx.commanderTactics.player, modifiers: [] }, { level: ctx.commanderTactics.enemy, modifiers: [] });
  const edge = Math.min(2, Math.floor(Math.abs(c.margin) / 4));
  if (!edge) return [[], [], r, c.margin];
  const mod = [{ source: 'the commander\'s Tactics', value: edge }];
  if (c.margin > 0) return [g.battle.a.contact ? mod : [], [], r, c.margin];
  return [[], g.battle.b.contact ? mod : [], r, c.margin];
}

const weatherMods = (g: GroundState, who: 'A' | 'B'): Modifier[] => {
  const w = WEATHER[g.planning.weather];
  const out: Modifier[] = [];
  const attacking = (who === 'A') !== g.planning.defending;
  if (attacking && w.attacker) out.push({ source: `weather (${g.planning.weather})`, value: w.attacker });
  const plan = (who === 'A' ? g.battle.a : g.battle.b).plan;
  if (w.hidden && (plan === 'raid' || plan === 'ambush')) out.push({ source: `weather (${g.planning.weather}) hides the move`, value: w.hidden });
  return out;
};

/** The enemy troops' quality in a sector (the player's own fight is against them). */
const enemyQuality = (s: Sector): number => {
  const live = s.b.units.filter(standing);
  return live.length ? live.reduce((t, u) => t + unitQuality(unitDef(u.unit)), 0) / live.length : 0;
};

/**
 * One phase (1.5 h): the player's orders (at once, or a phase later without contact), the player's own fight, the commanders'
 * roll, weather, the engine's sector rolls; then leaders and meditators who fall, contingencies, and the end.
 */
export function stepGround(g0: GroundState, orders: GroundOrders, ctx: GroundCtx): GroundStep {
  let g = g0;
  const lines: string[] = [];
  const big: string[] = [];
  if (g.end) return { ground: g, lines: ['The battle is over.'], big: [], seconds: 0, handoff: null };
  const phaseNo = g.battle.phase + 1;
  // Staying at one's post while out of the fight (m8-audit A4): command (or the sector) comes back at once; no phase passes.
  if (orders.stayAtPost) {
    const back = stayAtPost(g);
    return { ground: back.ground, lines: back.lines, big: back.lines, seconds: 0, handoff: null };
  }
  // Withdrawing ends it at once; falling back and the personal fight are the player's own sector (at once).
  if (orders.withdraw) {
    lines.push('The order goes out: withdraw from the field.');
    g = { ...g, end: { winner: 'enemy', reason: 'withdrawn' } };
    return { ground: { ...g, log: [...g.log, ...lines].slice(-40) }, lines, big: [...big, 'The force withdraws from the field.'], seconds: 0, handoff: null };
  }
  if (orders.fightInPerson && g.playerSector && !g.fight?.fightId) {
    const s = g.battle.sectors.find((x) => x.square === g.playerSector);
    const foe = s?.b.units.find(standing);
    if (s && foe) {
      lines.push(`You go in yourself at ${s.square}, against the ${foe.name}.`);
      return { ground: { ...g, fight: { fightId: 'pending', result: null, offered: true }, log: [...g.log, ...lines].slice(-40) }, lines, big: [`The player fights in person at ${s.square}.`], seconds: 0, handoff: { kind: unitDef(foe.unit).kind ?? 'trooper', count: 4 } };
    }
  }
  if (orders.fallBack && g.playerSector) g = fallBack(g, g.playerSector, lines);
  // The rest: at once with the officers' lines (or in the player's own sector), else a phase later with a penalty.
  const rest: GroundOrders = { ...(orders.manoeuvre ? { manoeuvre: orders.manoeuvre } : {}), ...(orders.commit ? { commit: orders.commit } : {}), ...(orders.move ? { move: orders.move } : {}) };
  if (Object.keys(rest).length) {
    if (delayed(g, rest)) {
      g = { ...g, pending: [...g.pending, { lands: phaseNo + CHANGE.delayPhases, orders: rest }] };
      lines.push('With no command post in contact, the order takes a phase to spread.');
    } else g = applyOrders(g, rest, lines);
  }
  for (const p of g.pending.filter((x) => x.lands <= phaseNo)) {
    g = applyOrders(g, p.orders, lines);
    g = { ...g, penaltyAt: phaseNo };
  }
  g = { ...g, pending: g.pending.filter((x) => x.lands > phaseNo) };
  // The player's own fight in their sector: a personal fight's result, else a quick roll against the troops there. Told with the
  // sector's own line after the phase (m8-fixes C2), so the two never contradict each other.
  let rng = g.battle.rng;
  let ownTold: { square: string; own: 'won' | 'held' | 'lost' } | null = null;
  if (g.playerSector && !ctx.playerOut) {
    const s = g.battle.sectors.find((x) => x.square === g.playerSector);
    if (s && !s.decided) {
      let own: 'won' | 'held' | 'lost';
      if (g.fight?.result) own = g.fight.result;
      else {
        const q = enemyQuality(s);
        const [c, r] = contest(rng, { level: ctx.playerCombat, modifiers: [] }, { level: q, modifiers: [] });
        rng = r;
        own = c.margin >= OWN_FIGHT_ROLL.won ? 'won' : c.margin <= OWN_FIGHT_ROLL.lost ? 'lost' : 'held';
        g = { ...g, xp: { gaps: [...g.xp.gaps, Math.round(q - ctx.playerCombat)].slice(-200) } };
      }
      g = { ...g, fight: g.fight ? { ...g.fight, result: null, fightId: null } : null, battle: { ...g.battle, sectors: g.battle.sectors.map((x) => (x.square === s.square ? { ...x, a: { ...x.a, ownFight: own } } : x)) } };
      ownTold = { square: s.square, own };
    }
  }
  // The commanders' roll, weather, a delayed change's penalty.
  const [ma, mb, r2, margin] = commandRoll(g, ctx, rng);
  rng = r2;
  const penalty: Modifier[] = g.penaltyAt === phaseNo ? [{ source: 'a change without contact', value: CHANGE.penalty }] : [];
  // A manoeuvre the player ordered from one only seen, not practised (m8-fixes B4).
  const planNow = tacticOfPlan(g.battle.a.plan);
  const seenPlan = g.planning.role === 'commander' && !g.handedTo && (g.planning.seenOnly ?? []).includes(planNow);
  const seenPen: Modifier[] = seenPlan ? [{ source: 'a tactic seen, not practised', value: -SEEN_TACTIC_PENALTY }] : [];
  g = { ...g, battle: { ...g.battle, rng, a: { ...g.battle.a, modifiers: [...ma, ...weatherMods(g, 'A'), ...penalty, ...seenPen] }, b: { ...g.battle.b, modifiers: [...mb, ...weatherMods(g, 'B')] } } };
  if (Math.abs(margin) >= 4) lines.push(`${margin > 0 ? 'Your' : 'The enemy\'s'} command reads the battle better this phase.`);
  // The engine's phase.
  const before = g.battle;
  const after = groundPhase(before);
  const phaseLog = after.log.slice(before.log.length);
  g = { ...g, battle: after };
  // Used, and learned when a seen manoeuvre's phase went our way on balance (m8-fixes B3b).
  const used = g.used ?? [];
  g = { ...g, used: used.includes(planNow) ? used : [...used, planNow] };
  if (seenPlan && phaseLog.reduce((t, r) => t + r.margin, 0) > 0 && !(g.learned ?? []).includes(planNow)) g = { ...g, learned: [...(g.learned ?? []), planNow] };
  for (const rec of phaseLog) {
    const s = after.sectors.find((x) => x.id === rec.sector)!;
    // Whose line broke (the engine's note names only the sector).
    const whose = rec.by === 'A' ? "the enemy's line" : 'our line';
    rec.notes = rec.notes.map((n) => (n === `${s.name} collapses` ? `${s.square}: ${whose} collapses` : n));
    // One line per sector from the same record as the track's movement (m8-fixes C1, C2).
    const tell = phaseLine(rec, s.square, ownTold?.square === s.square ? ownTold.own : null);
    lines.push(tell);
    if (rec.result === 'positionTaken' || rec.result === 'rout' || rec.result === 'collapse') big.push(tell);
  }
  // Leaders caught in a rout or a collapse fall (invented chance); the player's sector collapsing round them is a hazard.
  rng = g.battle.rng;
  for (const rec of phaseLog.filter((x) => x.result === 'rout' || x.result === 'collapse')) {
    const loser = rec.by === 'A' ? 'B' : 'A';
    const s = g.battle.sectors.find((x) => x.id === rec.sector)!;
    const leader = s[sideKey(loser)].leader;
    if (loser === 'A' && g.playerSector === s.square) g = { ...g, hazards: [...g.hazards, { severity: rec.result === 'collapse' ? 2 : 1, cause: `the line collapsing round you at ${s.square}` }] };
    if (!leader?.alive || (loser === 'A' && g.playerSector === s.square)) continue;
    const [u, r] = nextFloat(rng);
    rng = r;
    if (u < LEADER_DEATH[rec.result as 'rout' | 'collapse']) {
      const [b2, notes] = killLeader({ ...g.battle, rng }, loser, s.id);
      rng = b2.rng;
      g = { ...g, battle: b2 };
      const npc = loser === 'A' ? g.planning.leaders.find((l) => l.name === leader.name)?.npcId : null;
      if (npc) g = { ...g, fallen: [...g.fallen, npc] };
      lines.push(...notes.map((n) => `${n}.`));
      big.push(`${leader.name} falls at ${s.square}.`);
    }
  }
  // A raid that breaks through anywhere may reach the other side's battle meditator at the post (Mizra).
  let medKilled = false;
  for (const who of ['A', 'B'] as const) {
    const raider = who === 'A' ? g.battle.b : g.battle.a;
    const target = who === 'A' ? g.battle.a : g.battle.b;
    if (raider.plan !== 'raid' || !target.meditation?.alive) continue;
    if (!phaseLog.some((x) => x.by === (who === 'A' ? 'B' : 'A'))) continue;
    const [u, r] = nextFloat(rng);
    rng = r;
    if (u < MEDITATOR_RAID) {
      const [b2, notes] = killMeditator({ ...g.battle, rng }, who);
      rng = b2.rng;
      g = { ...g, battle: b2 };
      lines.push(...notes.map((n) => `${n}.`));
      big.push(`${target.meditation.name}, the battle meditator, is killed: the whole side checks.`);
      if (who === 'A') medKilled = true;
    }
  }
  g = { ...g, battle: { ...g.battle, rng } };
  g = contingencies(g, phaseLog, lines, big, medKilled);
  // Leaders already told about are marked so a contingency does not fire twice on the same fall.
  g = { ...g, fallen: [...g.fallen, ...g.battle.sectors.filter((x) => x.a.leader && !x.a.leader.alive).map((x) => `seen:${x.square}`).filter((k) => !g.fallen.includes(k))] };
  g = endCheck(g);
  if (g.end) big.push(`The battle ends: ${g.end.winner === 'player' ? 'victory' : g.end.winner === 'enemy' ? 'defeat' : 'neither side carries the field'} (${GROUND_END_WORDS[g.end.reason] ?? 'it is over'}).`);
  const map = drawMap(g.planning, g, `BATTLE · ${g.planning.site} · phase ${g.battle.phase}`);
  return { ground: { ...g, map, log: [...g.log, ...lines].slice(-40) }, lines, big, seconds: PHASE_HOURS * 3600, handoff: null };
}

/** Why a ground battle ended, in words (m8-fixes C1: no code on screen). */
export const GROUND_END_WORDS: Readonly<Record<string, string>> = { objectives: 'the sectors settled', collapse: 'the line collapsed', time: 'night and exhaustion ended it', withdrawn: 'the order to withdraw', routed: 'one side broke and fled' };

/** Objectives held decide it when the sectors are settled or the time is out; a side with nothing standing loses at once. */
export function endCheck(g: GroundState): GroundState {
  if (g.end) return g;
  const b = g.battle;
  if (forceLeft(b, 'A') <= 0) return { ...g, end: { winner: 'enemy', reason: 'routed' } };
  if (forceLeft(b, 'B') <= 0) return { ...g, end: { winner: 'player', reason: 'routed' } };
  const settled = b.sectors.every((s) => s.decided);
  if (!settled && b.phase < GROUND_LIMITS.maxPhases) return g;
  const held = objectivesHeld(g);
  const score = (who: 'player' | 'enemy'): number => held.filter((h) => h.holder === who).reduce((t, h) => t + h.weight, 0);
  const a = score('player');
  const e = score('enemy');
  return { ...g, end: { winner: a === e ? null : a > e ? 'player' : 'enemy', reason: settled ? 'objectives' : 'time' } };
}

/** Each objective (the plan's primary counts double) and who holds it now. */
export function objectivesHeld(g: GroundState): { square: string; holder: 'player' | 'enemy'; weight: number; primary: boolean }[] {
  const plan = g.planning.plan;
  const list = [...new Set([plan.primary, plan.secondary, ...g.planning.map.objectives].filter((x): x is string => !!x))];
  return list.map((sq) => {
    const s = g.battle.sectors.find((x) => x.square === sq);
    const defenderHolds = g.planning.defending ? 'player' : 'enemy';
    const holder = s ? (s.controller === 'A' ? 'player' : 'enemy') : defenderHolds;
    return { square: sq, holder, weight: sq === plan.primary ? 2 : 1, primary: sq === plan.primary };
  });
}

/** "Let it play out" (Jared): up to n phases with the plan as it stands, stopping at a big moment, a personal fight or the end. */
export function playOutGround(g0: GroundState, ctx: GroundCtx, n = 3): GroundStep {
  let g: GroundState = { ...g0, auto: true };
  const lines: string[] = [];
  const big: string[] = [];
  let seconds = 0;
  for (let i = 0; i < n && !g.end; i++) {
    const r = stepGround(g, {}, ctx);
    g = r.ground;
    lines.push(...r.lines);
    big.push(...r.big);
    seconds += r.seconds;
    if (r.big.length) break;
  }
  return { ground: g, lines, big, seconds, handoff: null };
}

/** The personal fight in the player's sector ended: its result counts for the sector next phase. */
export function groundFightFought(g: GroundState, won: boolean): GroundState {
  return { ...g, fight: { fightId: null, result: won ? 'won' : 'lost', offered: true } };
}

/** The share of each side's strength lost (casualties by the units' sizes). */
export function lossShare(g: GroundState, who: 'A' | 'B'): number {
  return 1 - forceLeft(g.battle, who);
}

export const ACTIVE_PHASE_HOURS = PHASE_HOURS;
