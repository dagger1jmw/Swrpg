// The narrative schema in parts (m8-ground Part A; Jared, 26 Nov 2026; D-520). D-15 sends only the events legal in the
// current state; on top of that, every AI event belongs to one part. The core part goes every turn (speech is the narrative
// itself; movement, time, people and relationships, facts, threads, combat starting, hazards and the other basics); each
// situational part goes only on the turns its situation holds. A field can be situational too (combatStarted's `ships` and
// `sparringMode`): it is left out of the event's wire schema unless its part applies. Each turn sends the core plus the parts
// that fit. One Gemini call per turn stays; the turn's parts are worked out once and used both for the schema and for which
// events the reply may carry.
import type { GameState } from '../../state/gameState';
import type { BaseState, NarrativeTurnInfo } from '../../state/types';
import { selectCurrentLocationId, selectLocationChain } from '../../features/locations/selectors';
import { selectPresentNpcIds } from '../../features/pacing/selectors';
import { selectNpc } from '../../features/npcs/selectors';
import { selectShipAt, selectShips } from '../../features/ships/selectors';
import { selectActiveBattle, selectGroundBattle, selectGroundPlanning, selectMayPlanGround } from '../../features/battles/selectors';

export const SCHEMA_PARTS = ['core', 'people', 'goods', 'ship', 'training', 'command', 'fight', 'battle'] as const;
export type SchemaPart = (typeof SCHEMA_PARTS)[number];

export const PART_LABEL: Readonly<Record<SchemaPart, string>> = {
  core: 'every turn',
  people: 'someone is present',
  goods: 'someone to deal with, or the player speaks of buying, selling, paying or storing',
  ship: 'aboard a ship, at a port, the character\'s ship here, or the player speaks of ships',
  training: 'training: a train or study turn, the master present, a training place, or the player speaks of training',
  command: 'a planning scene or ground battle, a character who can command, an officer present, or the player speaks of battle plans',
  fight: 'a fight is on or about to start',
  battle: 'a ship or ground battle is being fought',
};

// The player's own words that put a situation on the table this turn (whole words, case-insensitive).
const GOODS_WORDS = /\b(?:buy|buys|bought|sell|sells|sold|purchase\w*|pay|pays|paid|payment|price|prices|cost|costs|credits?|funds|haggle\w*|barter\w*|trade|trades|traded|trader|deal|bribe\w*|fine|fined|loan|debt|debts|repay\w*|wages?|job|jobs|hire|hired|rent|rents|lodging|steal|stole|stolen|rob|robbed|loot\w*|extort\w*|exchange|money|shop|shops|store|stores|stored|market|vendor|merchant|reward|bounty|contract|stash\w*|locker|fetch\w*|stow\w*|item|items|gear)\b/i;
const SHIP_WORDS = /\b(?:ships?|starships?|freighters?|shuttles?|fighters?|cruisers?|corvettes?|frigates?|destroyers?|hyperdrive|hyperspace|cockpit|hangar|docks?|docking|docked|spaceport|starport|port|customs|transponder|cargo|crew|pilot|piloting|fly|flying|launch|orbit|blockade|salvage\w*|shipyard)\b/i;
const TRAINING_WORDS = /\b(?:train|trains|trained|training|practi[cs]e\w*|lessons?|drills?|spar|spars|sparring|katas?|study|studies|studied|studying|teach\w*|taught|tutor\w*|routine|meditat\w*|exercises?|curriculum|instruct\w*|manual|tactics?)\b/i;
const COMMAND_WORDS = /\b(?:battles?|battle plan|planning|briefing|council of war|war council|command|troops|army|armies|battalions?|regiments?|platoons?|legions?|siege|assault|offensive|front line|frontline|objectives?|scouting|recon|artillery|walkers?)\b/i;
const TRAINING_PLACE = /temple|academy|enclave|dojo|training|salle|barracks|praxeum/i;
const PORT_PLACE = /spaceport|starport|\bport\b|docks?\b|docking|hangar|landing pad|shipyard|orbital/i;
const GOODS_PLACE = /market|bazaar|shop|store|cantina|trading|emporium|merchant|pawn/i;
/** Present people whose role can brief, plan or hand over command (a Jedi general is reached through the officers). */
const COMMAND_ROLES = new Set(['officer', 'soldier']);
/** Present people with something to deal: buying, selling, paying, bribing, lending (never a Jedi, a Sith or a soldier on duty). */
const DEALER_ROLES = new Set(['merchant', 'smuggler', 'criminal', 'bountyHunter', 'official', 'politician', 'servant', 'droid']);

const words = (turn: NarrativeTurnInfo, re: RegExp): boolean => typeof turn.text === 'string' && re.test(turn.text);

function placeChain(s: GameState): { kinds: string[]; names: string[] } {
  const chain = selectLocationChain(s, selectCurrentLocationId(s));
  return { kinds: chain.map((l) => l.kind), names: chain.flatMap((l) => [l.name, ...l.aliases]) };
}

function presentRoles(s: GameState): string[] {
  return selectPresentNpcIds(s)
    .map((id) => selectNpc(s, id))
    .filter((n) => n !== null)
    .map((n) => n!.role);
}

/** The world the character is on (the outermost place of the chain), for a ship docked here. */
function worldHere(s: GameState): string | null {
  const chain = selectLocationChain(s, selectCurrentLocationId(s));
  return chain.at(-1)?.name ?? null;
}

const inBattle = (s: GameState): boolean => selectActiveBattle(s) !== null || selectGroundBattle(s) !== null;
const inFight = (s: GameState): boolean => s.combat.active !== null || s.combat.pending !== null;

/**
 * How strongly a situation holds this turn: 0 not at all; 1 the state shows it; 2 the player's words name it; 3 both; 4 it is the
 * scene itself (an open planning scene, a ship battle). The player's words outrank what the state merely shows: they say what the
 * turn is about.
 */
type Strength = number;
const NO = 0;
const score = (state: boolean, said: boolean): Strength => (state ? 1 : 0) + (said ? 2 : 0);
const SCENE = 4;

/** Each situational part's test (the core always applies). */
export const PART_APPLIES: Readonly<Record<Exclude<SchemaPart, 'core'>, (s: GameState, turn: NarrativeTurnInfo) => Strength>> = {
  people: (s) => (selectPresentNpcIds(s).length > 0 ? 1 : NO),
  goods: (s, turn) => {
    if (inBattle(s) || inFight(s)) return NO;
    return score(presentRoles(s).some((r) => DEALER_ROLES.has(r)) || placeChain(s).names.some((n) => GOODS_PLACE.test(n)), words(turn, GOODS_WORDS));
  },
  ship: (s, turn) => {
    if (selectActiveBattle(s) !== null) return SCENE;
    if (selectGroundBattle(s) !== null || inFight(s)) return NO;
    const p = placeChain(s);
    const here = p.kinds.includes('ship') || p.kinds.includes('station') || p.names.some((n) => PORT_PLACE.test(n)) || (selectShips(s).length > 0 && selectShipAt(s, worldHere(s)) !== null);
    return score(here, turn.intentAction === 'travel' || words(turn, SHIP_WORDS));
  },
  training: (s, turn) => {
    if (inBattle(s) || s.combat.active !== null) return NO;
    const here = (s.ranks.masterId !== null && selectPresentNpcIds(s).includes(s.ranks.masterId)) || placeChain(s).names.some((n) => TRAINING_PLACE.test(n));
    return score(here, turn.intentAction === 'train' || turn.intentAction === 'study' || words(turn, TRAINING_WORDS));
  },
  command: (s, turn) => {
    if (inBattle(s) || s.combat.active !== null) return NO;
    if (selectGroundPlanning(s) !== null) return SCENE;
    return score(presentRoles(s).some((r) => COMMAND_ROLES.has(r)), words(turn, COMMAND_WORDS) || (selectMayPlanGround(s) && words(turn, /\b(?:plan|attack|defend)\b/i)));
  },
  fight: (s) => (inFight(s) ? 1 : NO),
  battle: (s) => (inBattle(s) ? 1 : NO),
};

/**
 * The activity parts (each a kind of scene) go one at a time (D-520): the strongest situations first (the scene
 * itself, then what the player's words name, then what the state shows), in this order on a tie. A turn that names more (buy fuel, train and plan a battle in one
 * line) gets the strongest; the next turn names the next. People, a fight and a battle are not capped.
 */
export const ACTIVITY_PARTS: readonly SchemaPart[] = ['command', 'ship', 'training', 'goods'];
export const MAX_ACTIVITY_PARTS = 1;

/** The parts this turn sends: the core and every situational part whose situation holds (activity parts capped). */
export function activeParts<S extends BaseState>(state: S, turn: NarrativeTurnInfo): ReadonlySet<SchemaPart> {
  if (turn.parts) return turn.parts as ReadonlySet<SchemaPart>;
  const s = state as unknown as GameState;
  const out = new Set<SchemaPart>(['core']);
  const strength = (part: Exclude<SchemaPart, 'core'>): Strength => {
    // A state built by a test may lack later slices; a part that cannot be read does not apply.
    try {
      return PART_APPLIES[part](s, turn);
    } catch {
      return NO;
    }
  };
  for (const part of ['people', 'fight', 'battle'] as const) if (strength(part)) out.add(part);
  const ranked = ACTIVITY_PARTS.map((p, i) => ({ p, i, x: strength(p as Exclude<SchemaPart, 'core'>) }))
    .filter((r) => r.x > 0)
    .sort((a, b) => b.x - a.x || a.i - b.i)
    .slice(0, MAX_ACTIVITY_PARTS);
  for (const r of ranked) out.add(r.p);
  return out;
}
