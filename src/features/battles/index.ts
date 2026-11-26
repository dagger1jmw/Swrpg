// Battles feature (m8-ship-battles, checklist item 13 part 1; D-517; docs-v2/spec/ship-battles.md). The code owns every ship
// battle (Golden Rule 1): the narrator may propose one (`shipBattleProposed`, plain words checked against the dated classes,
// who is present and the situation); the engine starts the blockade's force-through and an occupation's armada from data; the
// player plays each turn from the tactics menu (`battleOrdered`) or lets it play out; the code ends it and raises its events.
import { z } from 'zod';
import { RUN_FAME } from '../../data/blockade.config';
import { BLOCKADE_APPROACHES } from '../../data/blockades';
import { BATTLE_MORALE, BATTLE_ROLES, BATTLE_TRIGGERS, BOARDING, CASUALTY_SHARE, COMMAND_SIZE_BY_SHIPS, CREW_BY_KIND, FIELD_REPAIR_HOURS, FIELD_REPAIR_RATING, FIGHT_PATCH_HOURS } from '../../data/shipBattles.config';
import { FORMATIONS, MANOEUVRES, REPAIR_DC, SHIP_SYSTEMS } from '../../data/shipCombat.config';
import { FACINGS } from '../../data/ships';
import { FACTIONS } from '../../data/entities.config';
import { RUN_APPROACHES } from '../../engine/attackRun';
import { basicRoll } from '../../engine/rolls';
import { patchSystem, shipClass, systemState } from '../../engine/ships';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent, HandleResult } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { selectPerformance } from '../progression/selectors';
import { selectCaptivity } from '../world/selectors';
import { battlesSliceSchema, emptyBattles, type BattleRecord, type BattlesSlice, type ShipCondition } from './battles';
import { boardingFought, buildBattle, commandSize, isMajor, outcomeOf, playOut, runToEnd, stepBattle, type Battle, type BattleOrders, type StepCtx, type StepResult } from './rules';
import { selectBattleLines } from './selectors';
import { blockadeById, opposite, parseProposal, playerFaction, setupFromBlockade, setupFromProposal, troopsFor, yearOf, type Proposal } from './setup';

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

/** The end of a battle: the record, the events it raises, XP through the code lines, the damage that carries over. */
function conclude(slice: BattlesSlice, s: GameState, b: Battle): { slice: BattlesSlice; emit: GameEvent[]; notes: string[] } {
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
  const notes = [`battle ${b.id} ended: ${outcome} (${b.end?.reason ?? 'time'})${major ? ', a major battle' : ''}; casualties ${record.casualties.player} / ${record.casualties.enemy}`];
  return {
    slice: {
      ...slice,
      active: null,
      last: b,
      history: [...slice.history, record].slice(-30),
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
    return { slice: c.slice, emit: [...emit, ...c.emit], notes: [...notes, ...c.notes] };
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

function start(slice: BattlesSlice, made: { setup: Parameters<typeof buildBattle>[0] } | { reject: string }): R {
  if ('reject' in made) return { reject: made.reject };
  const b = buildBattle(made.setup);
  const line = `${b.kind === 'fleet' ? 'Fleet battle' : 'Dogfight'} begins: ${b.player.name} against ${b.enemy.name} (${b.role}${b.forceId ? ', a standing force' : ''}).`;
  return { slice: { ...slice, active: { ...b, log: [line] }, seq: slice.seq + 1, step: { lines: [line], big: [], wrap: null, seconds: 0 } }, notes: [line] };
}

export const battlesFeature: FeatureModule<BattlesSlice, GameState> = {
  id: 'battles',
  version: 1,
  initialState: () => emptyBattles(),
  emptyState: () => emptyBattles(),
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
        if (sameSide(p.enemyFaction, mine)) return { reject: "the enemy is the player's own side" };
        return start(slice, setupFromProposal(ctx.state, p, `battle-${slice.seq}`));
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
        return start(slice, setupFromBlockade(ctx.state, b, String(e['to']), e['direction'] as 'in' | 'out' | 'through', e['fleet'] === true, `battle-${slice.seq}`));
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
        const r = auto === true || b.auto ? playOut(b, stepCtx(ctx.state)) : stepBattle(b, orders, stepCtx(ctx.state));
        return settle(slice, ctx.state, r);
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
        for (const [sys] of broken) {
          const [roll, r] = basicRoll(rng, level, []);
          rng = r;
          const ok = roll.total >= REPAIR_DC;
          if (ok) {
            const ship = patchSystem({ systems } as never, sys as never) as { systems: typeof systems };
            systems = Object.fromEntries(Object.entries(ship.systems).filter(([, v]) => v !== 'working')) as typeof systems;
          }
          notes.push(`field repair: ${sys} ${ok ? 'patched' : 'not this time'}`);
          if (by === 'player') emit.push({ type: 'playXpEarned', source: 'repair', hours: FIELD_REPAIR_HOURS, rating: FIELD_REPAIR_RATING, success: ok, inFight: false, why: `a field repair (${sys})` });
        }
        return { slice: { ...slice, ships: { ...slice.ships, [cond.id]: { ...cond, systems } }, step: { lines: notes, big: [], wrap: null, seconds: broken.length * FIELD_REPAIR_HOURS * 3600 } }, emit, notes, rng };
      },
    },
  },
  selectors: { lines: selectBattleLines },
  // The narrator's lines go into the STATE block (turn/context.ts), as the droid and trait lines do.
};

/** The systems of a ship still broken (for the panel). */
export const brokenSystems = (c: ShipCondition): string[] => Object.entries(c.systems).filter(([, v]) => v === 'damaged' || v === 'disabled').map(([k]) => k);
export const systemOf = systemState;
export { shipNames };
