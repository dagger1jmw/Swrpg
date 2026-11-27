// Battles feature (m8-ship-battles, checklist item 13 part 1; D-517; docs-v2/spec/ship-battles.md). The code owns every ship
// battle (Golden Rule 1): the narrator may propose one (`shipBattleProposed`, plain words checked against the dated classes,
// who is present and the situation); the engine starts the blockade's force-through and an occupation's armada from data; the
// player plays each turn from the tactics menu (`battleOrdered`) or lets it play out; the code ends it and raises its events.
import { selectWoundPenalty } from '../health/selectors';
import { COMMAND_BASICS } from '../../data/tactics';
import { z } from 'zod';
import { RUN_FAME } from '../../data/blockade.config';
import { BLOCKADE_APPROACHES } from '../../data/blockades';
import { AFTERMATH, BATTLE_MORALE, BATTLE_ROLES, BATTLE_TRIGGERS, BOARDING, CASUALTY_SHARE, COMMAND_SIZE_BY_SHIPS, CREW_BY_KIND, FIELD_REPAIR_HOURS, FIELD_REPAIR_RATING, FIGHT_PATCH_HOURS } from '../../data/shipBattles.config';
import { FORMATIONS, MANOEUVRES, REPAIR_DC, SHIP_SYSTEMS } from '../../data/shipCombat.config';
import { FACINGS } from '../../data/ships';
import { FACTIONS } from '../../data/entities.config';
import { RUN_APPROACHES } from '../../engine/attackRun';
import { basicRoll } from '../../engine/rolls';
import { patchSystem, shipClass } from '../../engine/ships';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent, HandleResult } from '../../state/types';
import { selectNow, selectTurnInPlay } from '../clock/selectors';
import { selectPerformance } from '../progression/selectors';
import { selectCaptivity, selectFightSecurity } from '../world/selectors';
import { selectNpc, selectNpcOutOfFight } from '../npcs/selectors';
import { selectKnownTactics, selectRecognisedTactics, selectSeenTactics } from '../tactics/selectors';
import { backTo, groundSiteEvents, heldBy, moveToPlace, shipSiteEvents } from './location';
import { npcTactics } from '../tactics';
import { SHIP_RENOWN } from '../../data/shipLife.config';
import { selectPresentNpcIds } from '../pacing/selectors';
import { nextFloat, type RngState } from '../../engine/rng';
import { toAbsSecond } from '../../engine/calendar';
import { battlesSliceSchema, emptyBattles, type BattleRecord, type BattlesSlice, type ShipCondition } from './battles';
import { boardingFought, buildBattle, commandPassing, commandSize, handShipCommand, isMajor, knows, outcomeOf, playOut, runToEnd, shipHelpReaches, stepBattle, type Battle, type BattleOrders, type StepCtx, type StepResult } from './rules';
import { SECOND_IN_COMMAND_TACTICS, mayStayAtPost, outOfFight } from './command';
import { commanderCondition, selectBattleLines } from './selectors';
import { blockadeById, opposite, parseProposal, playerFaction, setupFromBlockade, setupFromProposal, troopsFor, yearOf, type Proposal } from './setup';
import { CONTINGENCY_ACTIONS, CONTINGENCY_TRIGGERS, GROUND_BATTLE_MORALE, GROUND_MAJOR_UNITS, GROUND_SIZE_BY_UNITS, MEN_PER_UNIT } from '../../data/groundCommand.config';
import { beginGround, commandingGround, drawMap, GROUND_END_WORDS, groundFightFought, groundHelpReaches, handedNow, handGroundCommand, lossShare, objectivesHeld, playOutGround, scout, stepGround, tacticOfPlan, type GroundCtx, type GroundOrders, type GroundPlan, type GroundPlanning, type GroundState, type GroundStep } from './ground';
import { planningFromProposal, playerCombat, proposalFromFields, scoutLevel, type GroundFields } from './groundSetup';

type R = HandleResult<BattlesSlice>;

/** The Republic and the Jedi Order are one side in a battle; so are the Sith Empire and the Sith. */
const ALLIED: readonly (readonly string[])[] = [['republic', 'jediOrder'], ['sithEmpire', 'sith']];
const sameSide = (a: string, b: string): boolean => a === b || ALLIED.some((g) => g.includes(a) && g.includes(b));

const stepCtx = (s: GameState): StepCtx => ({ troopsFor: (f) => troopsFor(f, yearOf(s)), playerJedi: s.character.path === 'jedi' });

const shipNames = (b: Battle, side: 'a' | 'b'): number => (b.fleet ? b.fleet[side].ships.filter((x) => shipClass(x.classId).kind !== 'fighter' && shipClass(x.classId).kind !== 'freighter').length : 0);

/** Casualties a battle raises: the crews of the ships destroyed, abandoned and taken (CASUALTY_SHARE; invented crew sizes). */
function casualties(b: Battle, who: 'player' | 'enemy'): number {
  const all = b.fleet ? [...b.fleet.a.ships, ...b.fleet.b.ships] : [b.dog?.a.ship, b.dog?.b.ship].filter((x) => x !== undefined);
  const crewOf = (name: string): number => {
    const s = all.find((x) => x!.name === name);
    return s ? (CREW_BY_KIND[shipClass(s.classId).kind] ?? 0) : 0;
  };
  const t = b.tally;
  return Math.round(t.destroyed[who].reduce((n, x) => n + crewOf(x) * CASUALTY_SHARE.destroyed, 0) + t.evacuated[who].reduce((n, x) => n + crewOf(x) * CASUALTY_SHARE.evacuated, 0) + t.captured[who].reduce((n, x) => n + crewOf(x) * CASUALTY_SHARE.captured, 0) + t.fighters[who] * CASUALTY_SHARE.destroyed);
}

/** The ship the player flew or commanded, as it ends: what carries over (hull, systems, burnt projectors, warheads). */
function condition(b: Battle, day: number): ShipCondition | null {
  const s = b.run?.flyer.ship ?? b.dog?.a.ship ?? b.fleet?.a.ships.find((x) => x.id === b.ownShipId);
  if (!s || s.destroyed || s.gone) return null;
  const systems = Object.fromEntries(Object.entries(s.systems).filter(([, v]) => v !== 'working')) as ShipCondition['systems'];
  return { id: s.id, classId: s.classId, name: s.name, hull: Math.max(0, s.hull), systems, burnt: Object.fromEntries(Object.entries(s.burnt).map(([k, v]) => [k, v ?? 0])), ammo: Object.fromEntries(Object.entries(s.ammo).map(([k, v]) => [k, v])), day };
}

/** Who holds the field when it ends: the winner; with no winner, each side keeps its own (a reading). */
export const fieldHolder = (b: Battle): 'player' | 'enemy' => (b.end?.winner === 'enemy' ? 'enemy' : 'player');

/**
 * After the battle (m8-ship-life Part A3-A5, D-518). A player whose part ended adrift (abandoned, ejected, disabled, left early)
 * is picked up when their side holds the field; when the enemy holds it, an escape roll or capture. A named NPC aboard a ship
 * destroyed or abandoned rolls to survive (AFTERMATH); a canon figure is protected (only the player breaks tags).
 */
export function aftermath(b: Battle, s: GameState, rng0: RngState): { emit: GameEvent[]; lines: string[]; rng: RngState } {
  let rng = rng0;
  const emit: GameEvent[] = [];
  const lines: string[] = [];
  const adrift = b.left === 'abandoned' || b.left === 'ejected' || b.left === 'disabled' || b.left === 'evacuatedEarly';
  if (adrift) {
    if (fieldHolder(b) === 'player') lines.push(`${b.player.name} hold the field; the player character is picked up.`);
    else {
      const [roll, r] = basicRoll(rng, Math.max(selectPerformance(s, 'piloting'), selectPerformance(s, 'stealth')), []);
      rng = r;
      if (roll.total >= AFTERMATH.escapeDc) lines.push(`${b.enemy.name} hold the field; the player character slips away unseen and is picked up later.`);
      else {
        lines.push(`${b.enemy.name} hold the field; the player character is found and taken prisoner.`);
        emit.push({ type: 'captivityBegan', source: 'battle', sourceId: b.id, group: b.enemy.name.slice(0, 200), kind: null, names: [], weapon: null, security: selectFightSecurity(AFTERMATH.captors, false), atAbs: toAbsSecond(s.clock.now) });
      }
    }
  }
  // Named NPCs aboard the ships lost: each commander on the ship it began aboard, and the people present on the player's own.
  const ships = b.fleet ? [...b.fleet.a.ships, ...b.fleet.b.ships] : b.dog ? [b.dog.a.ship] : [];
  const lostHow = (id: string | null | undefined): 'destroyed' | 'abandoned' | null => {
    const x = ships.find((e) => e.id === id);
    if (!x) return null;
    if (x.destroyed || (x.id === b.ownShipId && b.left === 'ejected')) return 'destroyed';
    if (x.gone && x.hull <= 0) return 'abandoned';
    return null;
  };
  const aboard = new Map<string, { ship: string; how: 'destroyed' | 'abandoned' }>();
  const own = ships.find((e) => e.id === b.ownShipId);
  const ownLost = lostHow(b.ownShipId);
  if (own && ownLost && shipClass(own.classId).kind !== 'fighter') for (const id of selectPresentNpcIds(s)) aboard.set(id, { ship: own.name, how: ownLost });
  for (const [who, info] of [['player', b.player], ['enemy', b.enemy]] as const) {
    const at = b.flagAtStart?.[who];
    const how = lostHow(at);
    const name = ships.find((e) => e.id === at)?.name;
    if (info.commander.npcId && !info.commanderGone && how && name) aboard.set(info.commander.npcId, { ship: name, how });
  }
  for (const [id, { ship, how }] of aboard) {
    const n = selectNpc(s, id);
    if (!n || n.status === 'deceased') continue;
    // Canon figures stay protected by the tag-map rules: only the player breaks tags.
    if (n.canonId) {
      lines.push(`${n.name} survives the loss of ${ship}.`);
      continue;
    }
    const [u, r] = nextFloat(rng);
    rng = r;
    if (u < AFTERMATH.survive[how]) lines.push(`${n.name} survives the loss of ${ship}.`);
    else {
      lines.push(`${n.name} is lost with ${ship}.`);
      emit.push({ type: 'npcDied', npcRef: id, cause: `lost with ${ship} (${how})`.slice(0, 200) });
    }
  }
  return { emit, lines, rng };
}

/** The end of a battle: the record, the events it raises, XP through the code lines, the damage that carries over. */
function conclude(slice: BattlesSlice, s: GameState, b: Battle): { slice: BattlesSlice; emit: GameEvent[]; notes: string[]; rng: RngState; lines: string[] } {
  const day = selectNow(s).day;
  const outcome = outcomeOf(b);
  const major = isMajor(b);
  const morale = BATTLE_MORALE[outcome] * (major ? 2 : 1);
  const record: BattleRecord = {
    id: b.id,
    day,
    kind: b.kind,
    role: b.role,
    trigger: b.trigger,
    placeName: b.placeName.slice(0, 80),
    placeId: b.placeId,
    against: b.enemy.name.slice(0, 80),
    factions: { player: b.player.faction, enemy: b.enemy.faction },
    outcome,
    reason: b.end?.reason ?? 'time',
    major,
    destroyed: b.tally.destroyed,
    captured: b.tally.captured,
    evacuated: b.tally.evacuated,
    fighters: b.tally.fighters,
    ...(b.tactics?.used?.length ? { tacticsUsed: b.tactics.used.slice(0, 40) } : {}),
    casualties: { player: casualties(b, 'player'), enemy: casualties(b, 'enemy') },
    morale,
    leftCrew: b.leftCrew,
    ...(b.blockade ? { blockadeId: b.blockade.id } : {}),
    ...(b.forceId ? { forceId: b.forceId } : {}),
  };
  const emit: GameEvent[] = [];
  const stakes = b.stakes;
  // XP through the code lines (m8-skills; Jared's brief F).
  if (b.xp.gunnery.length) emit.push({ type: 'playXpEarned', source: 'gunnery', margins: b.xp.gunnery.slice(-500), stakes, why: `gunnery in ${b.kind === 'fleet' ? 'the fleet battle' : 'the dogfight'}` });
  if (b.xp.piloting.length) emit.push({ type: 'playXpEarned', source: 'piloting', gaps: b.xp.piloting.slice(-500), stakes, outcome, why: 'flying in the battle' });
  for (const r of b.xp.repairs.slice(-20)) emit.push({ type: 'playXpEarned', source: 'repair', hours: FIGHT_PATCH_HOURS, rating: FIELD_REPAIR_RATING, success: r.success, inFight: true, why: 'a repair in the fight' });
  if (b.role === 'commander') emit.push({ type: 'playXpEarned', source: 'command', stakes, outcome, size: commandSize(b, COMMAND_SIZE_BY_SHIPS), why: outcome === 'won' ? 'a battle won in command' : 'fleet command' });
  // The blockade run it was (the force-through approach as a ship battle).
  if (b.blockade) {
    const result = outcome === 'won' ? 'through' : b.end?.reason === 'captured' || b.end?.reason === 'surrendered' || b.end?.reason === 'disabled' ? 'captured' : 'firedOn';
    emit.push({ type: 'blockadeRunRecorded', blockadeId: b.blockade.id, approach: 'force', direction: b.blockade.direction, to: b.blockade.to, result, fame: result === 'through' ? RUN_FAME.force : 0, witnessed: true, credits: 0, turnsInto: [], penalty: 0, hours: 0, onFoot: false });
  }
  const cond = condition(b, day);
  const ships = { ...slice.ships };
  if (cond) ships[cond.id] = cond;
  else delete ships[b.ownShipId];
  const after = aftermath(b, s, s.meta.rngState);
  emit.push(...after.emit);
  // Where the player ends up (m8-fixes C4): held by the enemy, picked up by their own side, or still aboard their ship.
  if (after.emit.some((x) => x.type === 'captivityBegan') || b.end?.reason === 'captured' || b.left === 'captured') emit.push(...heldBy(s, b.enemy.name));
  else if (b.left === 'abandoned' || b.left === 'ejected' || b.left === 'disabled' || b.left === 'evacuatedEarly') {
    const rescuer = b.fleet?.a.ships.find((x) => x.id !== b.ownShipId && !x.destroyed && !x.gone);
    emit.push(...(rescuer ? shipSiteEvents(s, rescuer.name, b.placeName) : moveToPlace(s, b.placeName, 'other', 'where the character was picked up after the battle')));
  }
  // What each side was seen to use: the character recognises it from now on (m8-ship-life part G).
  if (b.seenUsed?.enemy.length) emit.push({ type: 'tacticsSeen', ids: b.seenUsed.enemy, by: 'enemy' });
  if (b.seenUsed?.ally.length) emit.push({ type: 'tacticsSeen', ids: b.seenUsed.ally, by: 'ally' });
  // A seen tactic used successfully here is known now (m8-fixes B3b).
  if (b.tactics?.learned?.length) emit.push({ type: 'tacticsLearned', ids: b.tactics.learned, source: 'used successfully in battle' });
  // The character's own ship (the ships feature): lost with the battle, or renown from a battle won in it.
  const owned = (s as { ships?: { ships: Record<string, unknown> } }).ships?.ships[b.ownShipId];
  if (owned) {
    const all = b.fleet ? [...b.fleet.a.ships, ...b.fleet.b.ships] : b.run ? [b.run.flyer.ship] : b.dog ? [b.dog.a.ship] : [];
    const own = all.find((x) => x.id === b.ownShipId);
    const taken = own ? b.tally.captured.player.includes(own.name) || b.end?.reason === 'captured' : false;
    const how = !own ? null : own.destroyed || (b.left === 'ejected' && b.tally.destroyed.player.includes(own.name)) ? 'destroyed' : taken ? 'captured' : own.gone && own.hull <= 0 ? 'abandoned' : null;
    if (how) emit.push({ type: 'shipLost', shipId: b.ownShipId, how });
    else if (outcome === 'won') emit.push({ type: 'shipRenown', shipId: b.ownShipId, points: (major ? SHIP_RENOWN.majorBattleWon : SHIP_RENOWN.battleWon) + (b.blockade ? SHIP_RENOWN.blockadeRun : 0) });
  }
  const notes = [`battle ${b.id} ended: ${outcome} (${b.end?.reason ?? 'time'})${major ? ', a major battle' : ''}; casualties ${record.casualties.player} / ${record.casualties.enemy}`, ...after.lines];
  return {
    rng: after.rng,
    lines: after.lines,
    slice: {
      ...slice,
      active: null,
      last: b,
      history: [...slice.history, record].slice(-30),
      ended: { kind: 'ship' as const, turn: selectTurnInPlay(s) },
      ships,
      lastShipId: cond ? cond.id : slice.lastShipId === b.ownShipId ? null : slice.lastShipId,
      reputation: b.leftCrew ? [...slice.reputation, { day, crew: (b.fleet?.a.ships.find((x) => x.id === b.ownShipId)?.name ?? 'the crew').slice(0, 80), side: b.player.faction, kind: 'abandonedCrew' as const }].slice(-50) : slice.reputation,
      darkChoices: b.leftCrew ? [...slice.darkChoices, { day, kind: 'abandonedCrew' as const, ship: (b.fleet?.a.ships.find((x) => x.id === b.ownShipId)?.name ?? 'a ship').slice(0, 80) }].slice(-50) : slice.darkChoices,
    },
    emit,
    notes,
  };
}

/** After a step: the boarding hand-off, the hazard, the end. */
function settle(slice: BattlesSlice, s: GameState, r: StepResult, wrap = true): R {
  let b = r.battle;
  const emit: GameEvent[] = [];
  const notes: string[] = [...r.lines, ...r.big].slice(0, 12);
  if (r.hazard) emit.push({ type: 'hazardResolved', hazard: r.hazard.severity >= 3 ? 'explosion' : 'crash', severity: Math.min(3, Math.max(1, r.hazard.severity)), cause: r.hazard.cause.slice(0, 200) });
  if (r.handoff) {
    // The boarding fight runs as ordinary personal combat (Jared, 26 Nov 2026); its result comes back through boardingFought.
    const fightId = `fight-${s.combat.seq}`;
    b = { ...b, boarding: b.boarding ? { ...b.boarding, fightId } : null };
    emit.push({ type: 'fightBegun', fromPending: false, minionGroups: [{ kind: r.handoff.troops.kind, count: Math.min(BOARDING.troops['dreadnought'] ?? 6, r.handoff.troops.count) }], stakes: 'lethal', terrainTags: ['confined', 'cover'] });
  }
  // Out of it (lost fighter, evacuated, taken, left the crew): the fleet fights on to its end under the NPC commanders.
  if (!b.end && b.out && b.kind === 'fleet' && !b.boarding) {
    const rest = runToEnd(b, stepCtx(s));
    b = rest.battle;
    notes.push(...rest.big.slice(-6));
    r = { ...r, seconds: r.seconds + rest.seconds };
  }
  const step = { lines: r.lines, big: r.big, wrap: b.end && wrap ? wrapUp(b) : null, seconds: r.seconds };
  if (b.end) {
    const c = conclude({ ...slice, step }, s, b);
    // The aftermath goes into the wrap-up the narrator tells.
    const told = c.slice.step && c.slice.step.wrap && c.lines.length ? { ...c.slice, step: { ...c.slice.step, wrap: `${c.slice.step.wrap} ${c.lines.join(' ')}` } } : c.slice;
    return { slice: told, emit: [...emit, ...c.emit], notes: [...notes, ...c.notes], rng: c.rng };
  }
  return { slice: { ...slice, active: b, step }, emit, notes };
}

/** A short wrap-up at the end (Jared's brief E). */
export function wrapUp(b: Battle): string {
  const t = b.tally;
  const won = b.end?.winner === 'player';
  const how = { destroyed: won ? 'the enemy destroyed' : 'destroyed', disabled: won ? 'the enemy disabled' : 'disabled', brokenOff: 'broken off', withdrawn: won ? 'the enemy withdrew' : 'withdrawn', surrendered: won ? 'the enemy surrendered' : 'surrendered', captured: 'captured', evacuated: 'abandoned ship', time: 'neither side broke' }[b.end?.reason ?? 'time'];
  const lost = (who: 'player' | 'enemy'): string => [t.destroyed[who].length ? `${t.destroyed[who].length} destroyed` : '', t.captured[who].length ? `${t.captured[who].length} taken` : '', t.evacuated[who].length ? `${t.evacuated[who].length} abandoned` : '', t.fighters[who] ? `${t.fighters[who]} fighters down` : ''].filter(Boolean).join(', ') || 'no ships lost';
  return `${won ? 'Victory' : b.end?.winner === 'enemy' ? 'Defeat' : 'No victory'}: ${how}. Ours: ${lost('player')}. Theirs: ${lost('enemy')}.${b.leftCrew ? ' The crew you left fought on without you.' : ''}`;
}

const ordersSchema = z.object({
  manoeuvre: z.enum(MANOEUVRES).optional(),
  boost: z.enum(['lasers', 'shields', 'engines']).optional(),
  weaken: z.enum(['lasers', 'shields', 'engines']).optional(),
  angle: z.enum(['even', 'front', 'back']).optional(),
  shot: z.enum(['guns', 'ion', 'torpedo', 'none']).optional(),
  snap: z.boolean().optional(),
  repair: z.enum(SHIP_SYSTEMS).optional(),
  engage: z.object({ wingId: z.string().optional(), shipId: z.string().optional() }).optional(),
  approach: z.enum(RUN_APPROACHES).optional(),
  facing: z.enum(FACINGS).optional(),
  aim: z.enum(['ship', 'dome', 'bridge', 'generator', 'engines', 'weapons', 'hangar']).optional(),
  formation: z.enum(FORMATIONS).optional(),
  focus: z.string().nullable().optional(),
  move: z.enum(['close', 'hold', 'open']).optional(),
  launch: z.boolean().optional(),
  recall: z.boolean().optional(),
  mission: z.enum(['screen', 'strike']).optional(),
  roll: z.boolean().optional(),
  warheads: z.boolean().optional(),
  holdFire: z.boolean().optional(),
  stayAtPost: z.boolean().optional(),
  board: z.string().optional(),
  leadBoarding: z.boolean().optional(),
  breakOff: z.boolean().optional(),
  withdraw: z.boolean().optional(),
  surrender: z.boolean().optional(),
  evacuateEarly: z.boolean().optional(),
  returnToHangar: z.boolean().optional(),
});

/** Why a battle cannot start now. */
function blocked(s: GameState): string | null {
  if (s.battles.active) return 'a battle is already being fought';
  if (s.combat.active) return 'a fight is in progress';
  if (selectCaptivity(s)) return 'the character is a prisoner';
  if (s.health.death) return 'the character is dead';
  return null;
}

function start(slice: BattlesSlice, made: { setup: Parameters<typeof buildBattle>[0] } | { reject: string }, s: GameState): R {
  if ('reject' in made) return { reject: made.reject };
  // Tactics as knowledge (m8-ship-life part G): what the player knows and recognises, and what the enemy's crews know.
  // The character's one list (m8-fixes B1): known tactics, and seen ones flown at a penalty (B4).
  const seenOnly = [...selectSeenTactics(s)];
  const b = { ...buildBattle(made.setup), tactics: { known: [...selectKnownTactics(s), ...seenOnly], recognised: [...selectRecognisedTactics(s)], seenOnly, learned: [], used: [] }, enemyTactics: [...npcTactics(made.setup.enemy.kind)], seenUsed: { enemy: [], ally: [] } };
  const line = `${b.kind === 'fleet' ? 'Fleet battle' : 'Dogfight'} begins: ${b.player.name} against ${b.enemy.name} (${b.role}${b.forceId ? ', a standing force' : ''}).`;
  // The player is aboard their ship, at the battle (m8-fixes C4).
  const own = [...(b.fleet?.a.ships ?? []), ...(b.dog ? [b.dog.a.ship] : [])].find((x) => x.id === b.ownShipId);
  const emit = own ? shipSiteEvents(s, own.name, b.placeName) : [];
  return { slice: { ...slice, active: { ...b, log: [line] }, seq: slice.seq + 1, step: { lines: [line], big: [], wrap: null, seconds: 0 } }, notes: [line], ...(emit.length ? { emit } : {}) };
}

// ---- ground command (m8-ground, M8 checklist item 14; D-522; spec/ground-command.md) ----

/** Why a ground planning scene or battle cannot start now. */
function groundBlocked(s: GameState): string | null {
  if (s.battles.ground) return 'a ground battle is already being fought';
  return blocked(s);
}

/** The phase's inputs from the state: the player's fight level, the commanders' Tactics. */
function groundCtx(s: GameState, g: GroundState): GroundCtx {
  const p = g.planning;
  const cond = commanderCondition(s);
  // The wounded commander (m8-audit A4): the one who has the command rolls for it (the player while they keep it, a wound's penalty
  // included in their performance; else the next in line).
  const handed = handedNow(g, cond);
  // An NPC commander out of the fight hands over the same way (the rule is the same for everyone): a second-in-command rolls.
  const npcTactics = (c: GroundPlanning['ours']['commander']): number => (c.npcId && selectNpcOutOfFight(s, c.npcId) ? SECOND_IN_COMMAND_TACTICS : c.tactics);
  // The wound's penalty on the player's own command (D-527's rule; opt-2: it was stated, not applied), eased by pain suppression
  // (health §8, opt-2 E1): a dying commander who stays at the post commands at their wounded level unless a power holds the pain.
  const player = p.role === 'commander' ? (handed ? handed.tactics : selectPerformance(s, 'tactics') * (1 - selectWoundPenalty(s, 'tactics'))) : npcTactics(p.ours.commander);
  return { playerCombat: playerCombat(s), playerOut: outOfFight(cond), commanderTactics: { player, enemy: npcTactics(p.enemy.commander) } };
}

/**
 * The wounded commander in a ground battle (m8-audit A4): out of the fight and not staying, command (or the sector) passes at once,
 * recorded the first time it is seen (no phase plays then, so the player can choose to stay); after that, the medics reach a
 * dying player the next time the battle moves on, if our troops still stand.
 */
function groundCommandCheck(g: GroundState, s: GameState, orders: GroundOrders): { ground: GroundState; lines: string[]; stop: boolean; emit: GameEvent[] } {
  const cond = commanderCondition(s);
  if (orders.stayAtPost || g.stayAtPost || !outOfFight(cond) || cond.dead) return { ground: g, lines: [], stop: false, emit: [] };
  if (!g.handedTo) {
    if (!handedNow(g, cond)) return { ground: g, lines: [], stop: false, emit: [] };
    const r = handGroundCommand(g);
    return { ground: r.ground, lines: [...r.lines, groundHelpReaches(r.ground) ? 'Medics are on their way to you.' : 'No one can reach you yet.'], stop: true, emit: [] };
  }
  if (g.medicReached || !groundHelpReaches(g)) return { ground: g, lines: [], stop: false, emit: [] };
  const line = cond.dying ? 'The medics reach you and stabilize you; you are carried back to the aid station.' : 'The medics carry you back to the aid station.';
  return { ground: { ...g, medicReached: true, log: [...g.log, line].slice(-40) }, lines: [line], stop: false, emit: cond.dying ? [{ type: 'woundsStabilized', by: 'a field medic' }] : [] };
}

/** The same in a ship battle (m8-audit A4): the first officer takes the fleet; the medical bay takes a dying player next round. */
function shipCommandCheck(b: Battle, s: GameState, orders: BattleOrders): { battle: Battle; lines: string[]; stop: boolean; emit: GameEvent[] } {
  const cond = commanderCondition(s);
  if (orders.stayAtPost || b.stayAtPost || !outOfFight(cond) || cond.dead) return { battle: b, lines: [], stop: false, emit: [] };
  if (commandPassing(b, cond)) {
    const r = handShipCommand(b);
    return { battle: r.battle, lines: [...r.lines, shipHelpReaches(r.battle) ? 'You are carried to the medical bay.' : 'No one can reach you yet.'], stop: true, emit: [] };
  }
  if (!b.woundedOut || b.medicReached || !shipHelpReaches(b)) return { battle: b, lines: [], stop: false, emit: [] };
  const line = cond.dying ? 'In the medical bay they stabilize you.' : 'You are in the medical bay.';
  return { battle: { ...b, medicReached: true }, lines: [line], stop: false, emit: cond.dying ? [{ type: 'woundsStabilized', by: "the ship's medical bay" }] : [] };
}

const groundSize = (units: number): string => [...GROUND_SIZE_BY_UNITS].reverse().find(([n]) => units >= n)?.[1] ?? 'squad';

/** A short wrap-up of a ground battle (the narrator tells it). */
export function groundWrapUp(g: GroundState): string {
  const won = g.end?.winner === 'player';
  const held = objectivesHeld(g);
  const obj = held.map((o) => `${o.square}${o.primary ? ' (primary)' : ''} ${o.holder === 'player' ? (g.planning.defending ? 'held' : 'taken') : g.planning.defending ? 'lost' : "still the enemy's"}`).join(', ');
  const how = GROUND_END_WORDS[g.end?.reason ?? 'time'];
  return `${won ? 'Victory' : g.end?.winner === 'enemy' ? 'Defeat' : 'No victory'}: ${how}. Objectives: ${obj || 'none'}. Losses: ours ${Math.round(lossShare(g, 'A') * 100)}%, theirs ${Math.round(lossShare(g, 'B') * 100)}%.`;
}

/** The end of a ground battle: the record, the events it raises, command and field XP, the tactics seen. */
function concludeGround(slice: BattlesSlice, s: GameState, g: GroundState, step: GroundStep): R {
  const day = selectNow(s).day;
  const p = g.planning;
  const outcome: 'won' | 'drawn' | 'lost' = g.end?.winner === 'player' ? 'won' : g.end?.winner === 'enemy' ? 'lost' : 'drawn';
  const units = p.ours.units.length + p.enemy.units.length;
  const major = units >= GROUND_MAJOR_UNITS || p.map.siteId !== null;
  const size = groundSize(p.ours.units.length);
  const men = MEN_PER_UNIT[size] ?? 100;
  const held = objectivesHeld(g);
  const record: BattleRecord = {
    id: g.id,
    day,
    kind: 'ground',
    role: p.role,
    trigger: 'planned',
    placeName: p.site.slice(0, 80),
    placeId: p.placeId,
    against: p.enemy.name.slice(0, 80),
    factions: { player: p.ours.faction, enemy: p.enemy.faction },
    outcome,
    reason: g.end?.reason ?? 'time',
    major,
    destroyed: { player: [], enemy: [] },
    captured: { player: [], enemy: [] },
    evacuated: { player: [], enemy: [] },
    fighters: { player: 0, enemy: 0 },
    casualties: { player: Math.round(lossShare(g, 'A') * p.ours.units.length * men), enemy: Math.round(lossShare(g, 'B') * p.enemy.units.length * men) },
    morale: GROUND_BATTLE_MORALE[outcome] * (major ? 2 : 1),
    leftCrew: false,
    objectives: held.map((o) => ({ square: o.square, holder: o.holder, primary: o.primary })),
    ...(g.used?.length && p.role === 'commander' ? { tacticsUsed: g.used.slice(0, 40) } : {}),
  };
  const emit: GameEvent[] = [];
  const stakes = 'lethal';
  // Command XP (Tactics, with the Intelligence share): planning and commanding; a sector leader for their sector.
  if (p.role === 'commander') emit.push({ type: 'playXpEarned', source: 'command', stakes, outcome, size, why: 'planning and commanding a ground battle' });
  else if (p.role === 'leader' && g.playerSector !== null) emit.push({ type: 'playXpEarned', source: 'command', stakes, outcome, size: 'company', why: 'leading a sector' });
  // Field XP for the player's own fighting at the front.
  if (g.xp.gaps.length) emit.push({ type: 'playXpEarned', source: 'fieldFight', gaps: g.xp.gaps.slice(-500), stakes, outcome, why: 'fighting at the front' });
  // Where the player ends up (m8-fixes C4): a battle lost or withdrawn from takes them back to the base they planned from; a field
  // won or held keeps them on it.
  if (outcome === 'lost' || g.end?.reason === 'withdrawn') emit.push(...backTo(s, p.placeId));
  // What the enemy was seen to use (m8-ship-life part G): recognised from now on. Under an NPC commander, our own side's manoeuvres
  // are seen too (m8-fixes B3b: a tactic seen used in a battle the character took part in).
  emit.push({ type: 'tacticsSeen', ids: [tacticOfPlan(p.enemy.plan)], by: 'enemy' });
  if (p.role !== 'commander' && g.used?.length) emit.push({ type: 'tacticsSeen', ids: g.used, by: 'ally' });
  // A seen manoeuvre the player used to good effect is known now (m8-fixes B3b).
  if (g.learned?.length) emit.push({ type: 'tacticsLearned', ids: g.learned, source: 'used successfully in battle' });
  // Named leaders who fell (never a canon figure: only the player breaks tags).
  for (const id of g.fallen.filter((x) => !x.startsWith('seen:'))) {
    const n = selectNpc(s, id);
    if (n && !n.canonId && n.status !== 'deceased') emit.push({ type: 'npcDied', npcRef: id, cause: `fell leading a sector at ${p.site}`.slice(0, 200) });
  }
  const notes = [`ground battle ${g.id} ended: ${outcome} (${g.end?.reason ?? 'time'})${major ? ', a major battle' : ''}; casualties ${record.casualties.player} / ${record.casualties.enemy}`];
  return {
    slice: { ...slice, ground: null, lastGround: g, planning: null, history: [...slice.history, record].slice(-30), ended: { kind: 'ground' as const, turn: selectTurnInPlay(s) }, step: { lines: step.lines, big: step.big, wrap: groundWrapUp(g), seconds: step.seconds } },
    emit,
    notes,
  };
}

/** After a ground step: the personal fight hand-off, hazards to the player, the end. */
function settleGround(slice: BattlesSlice, s: GameState, r: GroundStep): R {
  let g = r.ground;
  const emit: GameEvent[] = [];
  if (r.handoff) {
    const fightId = `fight-${s.combat.seq}`;
    g = { ...g, fight: { fightId, result: null, offered: true } };
    emit.push({ type: 'fightBegun', fromPending: false, minionGroups: [{ kind: r.handoff.kind, count: r.handoff.count }], stakes: 'lethal', terrainTags: ['open', 'cover'] });
  }
  // Hazards to the player as they happen (a sector collapsing round them).
  const was = (slice.ground as GroundState | null)?.hazards.length ?? 0;
  for (const h of g.hazards.slice(was)) emit.push({ type: 'hazardResolved', hazard: 'explosion', severity: Math.min(3, Math.max(1, h.severity)), cause: h.cause.slice(0, 200) });
  const notes = [...r.lines, ...r.big].slice(0, 12);
  if (g.end) {
    const c = concludeGround(slice, s, g, r);
    if ('reject' in c) return c;
    return { ...c, emit: [...emit, ...(c.emit ?? [])], notes: [...notes, ...(c.notes ?? [])] };
  }
  return { slice: { ...slice, ground: g, step: { lines: r.lines, big: r.big, wrap: null, seconds: r.seconds } }, emit, notes };
}

const contingencySchema = z.object({ when: z.enum(CONTINGENCY_TRIGGERS), sector: z.string().max(3).optional(), then: z.enum(CONTINGENCY_ACTIONS), manoeuvre: z.string().max(40).optional() });
const groundPlanSchema = z.object({
  primary: z.string().max(3).nullable(),
  secondary: z.string().max(3).nullable(),
  manoeuvre: z.string().max(40).nullable(),
  sectors: z.array(z.object({ square: z.string().max(3), units: z.array(z.string().max(8)).max(24), leader: z.string().max(80).nullable() })).max(8),
  support: z.object({ artillery: z.string().max(3).nullable(), armour: z.string().max(3).nullable(), air: z.string().max(3).nullable() }),
  reserve: z.array(z.string().max(8)).max(24),
  contingencies: z.array(contingencySchema).max(4),
});
const groundOrdersSchema = z.object({ manoeuvre: z.string().max(40).optional(), commit: z.string().max(3).optional(), move: z.object({ unit: z.string().max(8), to: z.string().max(3) }).optional(), fallBack: z.boolean().optional(), fightInPerson: z.boolean().optional(), withdraw: z.boolean().optional(), stayAtPost: z.boolean().optional() });

const asPlan = (x: unknown): GroundPlan => {
  const p = x as z.infer<typeof groundPlanSchema>;
  return { ...p, contingencies: p.contingencies.map((c) => ({ when: c.when, then: c.then, ...(c.sector ? { sector: c.sector } : {}), ...(c.manoeuvre ? { manoeuvre: c.manoeuvre } : {}) })) };
};

/**
 * Battles v2 (opt-2 G2): a ship battle saved before m8-fixes has no `seenOnly` (its commander had the basics open: they go into
 * `known`); a planning scene saved before has no `seenOnly` or `planKnows` (none seen; the planner knows what the player knows).
 * The runtime fallbacks for them are gone. A battle with no tactics record at all keeps every tactic open (rules.ts knows).
 */
export function migrateBattlesV2(b: BattlesSlice): BattlesSlice {
  type Old = { role?: string; tactics?: { known: string[]; seenOnly?: string[] } } | null;
  const ship = (x: Old): Old => {
    if (!x?.tactics || x.tactics.seenOnly !== undefined) return x;
    const basics = x.role === 'commander' ? COMMAND_BASICS.filter((id) => !x.tactics!.known.includes(id)) : [];
    return { ...x, tactics: { ...x.tactics, known: [...x.tactics.known, ...basics], seenOnly: [] } };
  };
  type OldPlan = { known: string[]; seenOnly?: string[]; planKnows?: string[] } | null | undefined;
  const plan = (p: OldPlan): OldPlan => (p ? { ...p, seenOnly: p.seenOnly ?? [], planKnows: p.planKnows ?? p.known } : p);
  const g = (x: { planning?: OldPlan } | null) => (x?.planning ? { ...x, planning: plan(x.planning) } : x);
  return { ...b, active: ship(b.active as Old), last: ship(b.last as Old), planning: plan(b.planning as OldPlan), ground: g(b.ground as { planning?: OldPlan } | null), lastGround: g(b.lastGround as { planning?: OldPlan } | null) } as BattlesSlice;
}

export const battlesFeature: FeatureModule<BattlesSlice, GameState> = {
  id: 'battles',
  version: 2,
  initialState: () => emptyBattles(),
  emptyState: () => emptyBattles(),
  // v2 (opt-2 G2): battles and planning scenes saved before m8-fixes get the fields the fallbacks stood in for.
  migrations: { 2: (old) => migrateBattlesV2(old as BattlesSlice) },
  stateSchema: battlesSliceSchema,
  events: {
    /**
     * The narrator proposes a battle (enemies sighted, an ambush, a blockade, a pursuit): plain words for the ships, read by the
     * code against the dated classes of the year. A standing force at the place (an occupation's armada) is built from data.
     */
    shipBattleProposed: {
      schema: z.object({
        type: z.literal('shipBattleProposed'),
        /** The narrator's plain words (combatStarted's `ships`): "enemy: two Imperial Terminus destroyers; allies: three Thranta corvettes; mine: Aurek; ambush". */
        what: z.string().max(200).optional(),
        scale: z.enum(['dogfight', 'fleet']).optional(),
        trigger: z.enum(BATTLE_TRIGGERS).optional(),
        enemyFaction: z.enum(FACTIONS).optional(),
        enemy: z.string().min(1).max(160).optional(),
        allies: z.string().max(160).optional(),
        playerShip: z.string().max(80).optional(),
        role: z.enum(BATTLE_ROLES).optional(),
        commandHanded: z.string().max(120).optional(),
        commanderRef: z.string().optional(),
        /** A customs chase (m8-ship-life): the pursuers may be the player's own side's authorities. */
        chase: z.boolean().optional(),
      }),
      // Never in the narrative schema itself: the narrator sends combatStarted with `ships`, and the combat feature emits this.
      sources: ['engine', 'dev'],
      refFields: ['commanderRef'],
      refKinds: { commanderRef: ['npc'] },
      handle: (slice, e, ctx) => {
        const why = blocked(ctx.state);
        if (why) return { reject: why };
        const mine = playerFaction(ctx.state);
        const p: Proposal | null = typeof e['what'] === 'string' ? parseProposal(e['what'], mine, yearOf(ctx.state)) : e['enemy'] ? ({ scale: 'dogfight', trigger: 'sighted', enemyFaction: opposite(mine), ...(e as object) } as Proposal) : null;
        if (!p) return { reject: 'a ship battle needs its enemy (enemy: ...)' };
        if (typeof e['enemyFaction'] === 'string') p.enemyFaction = e['enemyFaction'];
        if (sameSide(p.enemyFaction, mine) && e['chase'] !== true) return { reject: "the enemy is the player's own side" };
        return start(slice, setupFromProposal(ctx.state, p, `battle-${slice.seq}`), ctx.state);
      },
    },
    /** Engine: the force-through approach of a blockade run, as a ship battle (replaces the stopgap piloting check). */
    shipBattleStarted: {
      schema: z.object({ type: z.literal('shipBattleStarted'), blockadeId: z.string(), to: z.string(), direction: z.enum(['in', 'out', 'through']), fleet: z.boolean(), approach: z.enum(BLOCKADE_APPROACHES).optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const why = blocked(ctx.state);
        if (why) return { reject: why };
        const b = blockadeById(String(e['blockadeId']));
        if (!b) return { reject: `unknown blockade ${String(e['blockadeId'])}` };
        return start(slice, setupFromBlockade(ctx.state, b, String(e['to']), e['direction'] as 'in' | 'out' | 'through', e['fleet'] === true, `battle-${slice.seq}`), ctx.state);
      },
    },
    /**
     * Player: one turn or round from the tactics menu, or "let it play out" (auto) and taking control back. The code steps the
     * engines; the narrator describes the lines.
     */
    battleOrdered: {
      schema: z.object({ type: z.literal('battleOrdered'), orders: ordersSchema.optional(), auto: z.boolean().optional() }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        const b = slice.active as Battle | null;
        if (!b) return { reject: 'no battle is being fought' };
        if (b.boarding?.stage === 'personal' && b.boarding.fightId && ctx.state.combat.active) return { reject: 'the boarding fight comes first' };
        const auto = e['auto'];
        if (auto === false) return { slice: { ...slice, active: { ...b, auto: false }, step: { lines: ['You take the controls back.'], big: [], wrap: null, seconds: 0 } }, notes: ['battle: control taken back'] };
        const orders = (e['orders'] ?? {}) as BattleOrders;
        // Only known tactics can be ordered (m8-ship-life part G).
        if (ctx.source === 'player') for (const t of [orders.manoeuvre, orders.approach, orders.formation]) if (t && !knows(b, t)) return { reject: `${t} is not a tactic the character knows` };
        const cond = commanderCondition(ctx.state);
        if (orders.stayAtPost && !((b.woundedOut || commandPassing(b, cond)) && mayStayAtPost(cond, b.stayAtPost === true))) return { reject: 'staying at your post is for a commander out of the fight' };
        // The wounded commander (m8-audit A4): the first officer takes the fleet at once (no round plays), or the medical bay the player.
        const check = shipCommandCheck(b, ctx.state, orders);
        if (check.stop) return { slice: { ...slice, active: check.battle, step: { lines: check.lines, big: check.lines, wrap: null, seconds: 0 } }, notes: check.lines };
        const b1 = check.battle;
        const r = auto === true || b1.auto ? playOut(b1, stepCtx(ctx.state)) : stepBattle(b1, orders, stepCtx(ctx.state));
        const settled = settle(slice, ctx.state, { ...r, lines: [...check.lines, ...r.lines] });
        return 'reject' in settled || !check.emit.length ? settled : { ...settled, emit: [...check.emit, ...(settled.emit ?? [])] };
      },
    },
    /**
     * AI: a planning scene before a ground battle (a command centre, a briefing, a council in the field), with the forces in plain
     * words. The code reads them, decides who plans (rank, or the story's hand-over), draws the map and has the enemy plan and
     * deploy; the battle begins only when the player gives the word. Without a planning scene a fight is ordinary combat.
     */
    groundBattlePlanned: {
      // The forces in plain words; the scene's details as fields (opt-2 F; were one details line read by regex, D-520).
      schema: z.object({
        type: z.literal('groundBattlePlanned'),
        site: z.string().min(1).max(60),
        enemy: z.string().min(1).max(200),
        ours: z.string().max(200).optional(),
        defending: z.boolean().optional(),
        terrain: z.string().max(120).optional(),
        weather: z.string().max(20).optional(),
        commander: z.string().max(60).optional(),
        meditator: z.string().max(60).optional(),
        enemyMeditator: z.string().max(60).optional(),
        commandHanded: z.string().max(120).optional(),
        jammed: z.boolean().optional(),
      }),
      sources: ['ai', 'engine', 'dev'],
      part: 'command',
      narrative: (s) => !s.battles?.planning && !s.battles?.ground && !s.battles?.active && s.combat.active === null && s.combat.pending === null,
      handle: (slice, e, ctx) => {
        const why = groundBlocked(ctx.state);
        if (why) return { reject: why };
        if (slice.planning) return { reject: 'a planning scene is already open' };
        const str = (k: string): string | undefined => (typeof e[k] === 'string' ? (e[k] as string) : undefined);
        const fields: GroundFields = {
          ...(e['defending'] === true ? { defending: true } : {}),
          ...(e['jammed'] === true ? { jammed: true } : {}),
          ...Object.fromEntries((['terrain', 'weather', 'commander', 'meditator', 'enemyMeditator', 'commandHanded'] as const).flatMap((k) => (str(k) ? [[k, str(k)]] : []))),
        };
        const p = proposalFromFields(ctx.state, String(e['site']), String(e['enemy']), str('ours'), fields);
        const mine = playerFaction(ctx.state);
        if (p.enemyFaction && sameSide(p.enemyFaction, mine)) return { reject: "the enemy is the player's own side" };
        const made = planningFromProposal(ctx.state, p, `ground-${slice.seq}`);
        if ('reject' in made) return { reject: made.reject };
        const pl = made.planning;
        const line = `Planning: a battle at ${pl.site}, ${pl.ours.name} against ${pl.enemy.name}; ${pl.role === 'commander' ? 'the player plans it' : `${pl.ours.commander.name} plans it`}.`;
        return { slice: { ...slice, planning: pl, seq: slice.seq + 1, step: { lines: [line], big: [], wrap: null, seconds: 0 } }, notes: [line] };
      },
    },
    /** Player: the plan as set in the planning scene (the commander only); fixed when the battle begins. */
    groundPlanSet: {
      schema: z.object({ type: z.literal('groundPlanSet'), plan: groundPlanSchema.optional(), atPost: z.boolean().optional() }),
      sources: ['player', 'dev'],
      handle: (slice, e) => {
        const p = slice.planning as GroundPlanning | null;
        if (!p) return { reject: 'no planning scene is open' };
        if (slice.ground) return { reject: 'the plan is fixed once the battle begins' };
        if (p.role !== 'commander') return { reject: `${p.ours.commander.name} sets the plan` };
        const atPost = typeof e['atPost'] === 'boolean' ? (e['atPost'] as boolean) : p.atPost;
        let plan = e['plan'] ? asPlan(e['plan']) : p.plan;
        // Moving to the post takes the player out of any sector they were leading.
        if (atPost) plan = { ...plan, sectors: plan.sectors.map((x) => (x.leader === 'player' ? { ...x, leader: null } : x)) };
        return { slice: { ...slice, planning: { ...p, plan, atPost } }, notes: ['the plan is updated'] };
      },
    },
    /** Player: scouting before the battle (Stealth, Intelligence, recon units): reveals squares and perhaps the enemy's plan. */
    groundScouted: {
      schema: z.object({ type: z.literal('groundScouted'), how: z.enum(['recon', 'intelligence']) }),
      sources: ['player', 'dev'],
      handle: (slice, e, ctx) => {
        const p = slice.planning as GroundPlanning | null;
        if (!p || slice.ground) return { reject: 'scouting is done in the planning scene, before the battle' };
        const how = e['how'] as 'recon' | 'intelligence';
        const r = scout(p, how, scoutLevel(ctx.state, how), ctx.state.meta.rngState);
        return { slice: { ...slice, planning: r.planning, step: { lines: [r.line], big: [], wrap: null, seconds: r.line.startsWith('no time') ? 0 : 3600 } }, notes: [r.line], rng: r.rng };
      },
    },
    /** Player: the word is given: the plan is fixed and the battle begins (only from an open planning scene). */
    groundBattleBegun: {
      schema: z.object({ type: z.literal('groundBattleBegun') }),
      sources: ['player', 'dev'],
      handle: (slice, _e, ctx) => {
        const p = slice.planning as GroundPlanning | null;
        if (!p) return { reject: 'a ground battle begins only from a planning scene' };
        if (slice.ground) return { reject: 'a ground battle is already being fought' };
        const why = blocked(ctx.state);
        if (why) return { reject: why };
        const g = beginGround(p, ctx.state.meta.rngState);
        if ('reject' in g) return { reject: g.reject };
        const line = `The battle at ${p.site} begins: ${p.ours.name} against ${p.enemy.name}.`;
        // The player is at the battle's site (m8-fixes C4).
        return { slice: { ...slice, ground: { ...g, log: [line] }, step: { lines: [line], big: [line], wrap: null, seconds: 0 } }, notes: [line], emit: groundSiteEvents(ctx.state, p.site) };
      },
    },
    /** Player: stand down: the planning scene closes without a battle. */
    groundPlanningEnded: {
      schema: z.object({ type: z.literal('groundPlanningEnded') }),
      sources: ['player', 'dev'],
      handle: (slice) => (slice.planning && !slice.ground ? { slice: { ...slice, planning: null, step: { lines: ['The planning ends without a battle.'], big: [], wrap: null, seconds: 0 } } } : { reject: 'no planning scene is open' }),
    },
    /** Player: one phase with orders, or "let it play out" (auto) and taking control back. The code ends the battle. */
    groundOrdered: {
      schema: z.object({ type: z.literal('groundOrdered'), orders: groundOrdersSchema.optional(), auto: z.boolean().optional() }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        const g = slice.ground as GroundState | null;
        if (!g) return { reject: 'no ground battle is being fought' };
        if (g.fight?.fightId && ctx.state.combat.active) return { reject: 'the fight in your sector comes first' };
        if (e['auto'] === false) return { slice: { ...slice, ground: { ...g, auto: false }, step: { lines: ['You take control back.'], big: [], wrap: null, seconds: 0 } }, notes: ['ground battle: control taken back'] };
        const orders = (e['orders'] ?? {}) as GroundOrders;
        const cond = commanderCondition(ctx.state);
        if (orders.stayAtPost && !(handedNow(g, cond) && mayStayAtPost(cond, g.stayAtPost === true))) return { reject: 'staying at your post is for a commander or sector leader out of the fight' };
        // The wounded commander (m8-audit A4): command passes at once (no phase plays), or the medics reach the player.
        const check = groundCommandCheck(g, ctx.state, orders);
        if (check.stop) return { slice: { ...slice, ground: { ...check.ground, map: drawMap(check.ground.planning, check.ground, `BATTLE · ${check.ground.planning.site} · phase ${check.ground.battle.phase}`) }, step: { lines: check.lines, big: check.lines, wrap: null, seconds: 0 } }, notes: check.lines };
        const g1 = check.ground;
        const commands = commandingGround(g1, cond);
        if (orders.manoeuvre && ctx.source === 'player') {
          if (!commands) return { reject: 'only the commander changes the plan' };
          if (!g1.planning.known.includes(orders.manoeuvre)) return { reject: `${orders.manoeuvre} is not a tactic the character knows` };
        }
        if ((orders.commit || orders.move || orders.withdraw) && !commands) return { reject: 'only the commander gives that order' };
        if (orders.fallBack && (outOfFight(cond) || !g1.battle.sectors.some((x) => x.square === g1.playerSector && x.a.leader?.name === g1.planning.me.name))) return { reject: 'only the one leading the sector orders it back' };
        if (orders.fightInPerson && outOfFight(cond)) return { reject: 'you are out of the fight' };
        const r = e['auto'] === true || g1.auto ? playOutGround(g1, groundCtx(ctx.state, g1)) : stepGround(g1, orders, groundCtx(ctx.state, g1));
        const settled = settleGround(slice, ctx.state, { ...r, lines: [...check.lines, ...r.lines] });
        return 'reject' in settled || !check.emit.length ? settled : { ...settled, emit: [...check.emit, ...(settled.emit ?? [])] };
      },
    },
    /** Engine: the player's personal fight in their sector ended (the combat feature's result): it counts for the next phase. */
    groundFightFought: {
      schema: z.object({ type: z.literal('groundFightFought'), won: z.boolean() }),
      sources: ['engine'],
      handle: (slice, e) => {
        const g = slice.ground as GroundState | null;
        if (!g?.fight?.fightId) return { reject: 'no fight is waiting in the ground battle' };
        const next = groundFightFought(g, e['won'] === true);
        const line = e['won'] === true ? 'Your fight is won; your sector takes heart.' : 'Your fight goes badly; your sector wavers.';
        return { slice: { ...slice, ground: { ...next, map: drawMap(next.planning, next, `BATTLE · ${next.planning.site} · phase ${next.battle.phase}`) }, step: { lines: [line], big: [], wrap: null, seconds: 0 } }, notes: [line] };
      },
    },
    /** Engine: the personal boarding fight ended (the combat feature's result), back into the ship battle. */
    boardingFought: {
      schema: z.object({ type: z.literal('boardingFought'), won: z.boolean() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const b = slice.active as Battle | null;
        if (!b?.boarding) return { reject: 'no boarding is waiting on a fight' };
        return settle(slice, ctx.state, boardingFought(b, e['won'] === true));
      },
    },
    /**
     * Engine (the ships feature, m8-ship-life): a ship's condition changed outside a battle: a breakdown or a failed patch
     * (systems damaged), or a shipyard repair (restore: hull and systems whole, projectors and warheads replaced).
     */
    shipConditionSet: {
      schema: z.object({ type: z.literal('shipConditionSet'), shipId: z.string(), classId: z.string(), name: z.string().max(80), systems: z.record(z.string(), z.enum(['damaged', 'disabled', 'destroyed'])).optional(), restore: z.boolean().optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const id = String(e['shipId']);
        if (e['restore'] === true) {
          const { [id]: _whole, ...ships } = slice.ships;
          return { slice: { ...slice, ships } };
        }
        const was = slice.ships[id];
        const cls = shipClass(String(e['classId']));
        const cond: ShipCondition = was ?? { id, classId: cls.id, name: String(e['name']).slice(0, 80), hull: cls.hull, systems: {}, burnt: {}, ammo: {}, day: selectNow(ctx.state).day };
        return { slice: { ...slice, ships: { ...slice.ships, [id]: { ...cond, systems: { ...cond.systems, ...(e['systems'] as ShipCondition['systems']) } } } } };
      },
    },
    /** Player: field repairs after a battle (Repair against REPAIR_DC, an hour a system; droids at their programmed skill). */
    fieldRepairsMade: {
      schema: z.object({ type: z.literal('fieldRepairsMade'), by: z.enum(['player', 'droid', 'crew']).optional() }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        if (slice.active) return { reject: 'not during a battle' };
        const id = slice.lastShipId;
        const cond = id ? slice.ships[id] : undefined;
        if (!cond) return { reject: 'no ship of the character\'s needs repair' };
        const broken = Object.entries(cond.systems).filter(([, v]) => v === 'damaged' || v === 'disabled');
        if (!broken.length) return { reject: 'nothing a field repair can mend (destroyed systems need a shipyard)' };
        let rng = ctx.state.meta.rngState;
        const level = selectPerformance(ctx.state, 'repair');
        const by = (e['by'] as string | undefined) ?? 'player';
        let systems = { ...cond.systems };
        const emit: GameEvent[] = [];
        const notes: string[] = [];
        const patched: string[] = [];
        for (const [sys] of broken) {
          const [roll, r] = basicRoll(rng, level, []);
          rng = r;
          const ok = roll.total >= REPAIR_DC;
          if (ok) {
            const ship = patchSystem({ systems } as never, sys as never) as { systems: typeof systems };
            systems = Object.fromEntries(Object.entries(ship.systems).filter(([, v]) => v !== 'working')) as typeof systems;
          }
          notes.push(`field repair: ${sys} ${ok ? 'patched' : 'not this time'}`);
          if (ok) patched.push(sys);
          if (by === 'player') emit.push({ type: 'playXpEarned', source: 'repair', hours: FIELD_REPAIR_HOURS, rating: FIELD_REPAIR_RATING, success: ok, inFight: false, why: `a field repair (${sys})` });
        }
        // A field patch is temporary (m8-ship-life): the ships feature remembers it, and it may give way when the ship is pushed.
        if (patched.length) emit.push({ type: 'shipPatched', shipId: cond.id, systems: patched });
        return { slice: { ...slice, ships: { ...slice.ships, [cond.id]: { ...cond, systems } }, step: { lines: notes, big: [], wrap: null, seconds: broken.length * FIELD_REPAIR_HOURS * 3600 } }, emit, notes, rng };
      },
    },
  },
  selectors: { lines: selectBattleLines },
  // The narrator's lines go into the STATE block (turn/context.ts), as the droid and trait lines do.
};

/** The systems of a ship still broken (for the panel). */
export const brokenSystems = (c: ShipCondition): string[] => Object.entries(c.systems).filter(([, v]) => v === 'damaged' || v === 'disabled').map(([k]) => k);
export { shipNames };
