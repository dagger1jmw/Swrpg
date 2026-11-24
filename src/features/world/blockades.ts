// Blockades in the world slice (M8 item 4; D-469): what the campaign has recorded about them, which of them stand now, and
// what the character brings to one. The rules are in src/engine/blockade.ts.
import { z } from 'zod';
import { CONTACT, HEAT, RUNS_KEPT, TRAINED_STARTS } from '../../data/blockade.config';
import { BLOCKADE_APPROACHES, BLOCKADE_RESPONSES, BLOCKADES, type BlockadeDef } from '../../data/blockades';
import { WORLD_NETWORK, type WorldNetwork } from '../../data/worldNetwork';
import { blockadeStartDay, safeKm, type Runner } from '../../engine/blockade';
import type { LevelInputs } from '../../engine/rolls';
import { absDayFromDate } from '../../engine/calendar';
import { efficiency } from '../../engine/fatigue';
import type { GameState } from '../../state/gameState';
import { selectCharacter } from '../character/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectFatigue, selectIsSpent, selectLastingPenalty, selectWoundPenalty } from '../health/selectors';
import { selectNpcLevel, selectNpcs } from '../npcs/selectors';
import { selectPerformance, selectRust } from '../progression/selectors';
import { outcomeState } from './network';
import type { NetworkState } from './world';

export const blockadeRunSchema = z.object({
  blockadeId: z.string(),
  day: z.number().int(),
  approach: z.enum(BLOCKADE_APPROACHES),
  direction: z.enum(['in', 'out', 'through']),
  to: z.string(),
  result: z.enum(['through', ...BLOCKADE_RESPONSES]),
  /** For renown, once it is built (D-469): fame counts only when the run was witnessed. */
  fame: z.number().int().min(0),
  witnessed: z.boolean(),
});
export type BlockadeRunRecord = z.infer<typeof blockadeRunSchema>;

export const blockadesSchema = z.object({
  /** The last runs, newest last. */
  runs: z.array(blockadeRunSchema),
  /** Watching, by blockade: hours counted, and the figure once learned (it fades). */
  watched: z.record(z.string(), z.object({ hours: z.number().min(0), knownDay: z.number().int().nullable(), km: z.number().nullable() })),
  /** Ships caught lately sharpen the line, by blockade. */
  heat: z.record(z.string(), z.object({ points: z.number().int().min(0), untilDay: z.number().int() })),
  /** A failed attempt that can become another, on the next turn. */
  pending: z.object({ blockadeId: z.string(), to: z.string(), options: z.array(z.enum(BLOCKADE_APPROACHES)), penalty: z.number(), turn: z.number().int().min(0) }).nullable(),
  /** The ship left outside a blockade on the way in. */
  shipOutside: z.object({ blockadeId: z.string(), day: z.number().int() }).nullable(),
  /** Credits owed, paid or fined (the economy reads it once it is built). */
  ledger: z.array(z.object({ day: z.number().int(), credits: z.number().int(), reason: z.string().max(120) })),
  captive: z.object({ by: z.string(), day: z.number().int(), locationId: z.string().nullable() }).nullable(),
  shipDamagedDay: z.number().int().nullable(),
});
export type BlockadesState = z.infer<typeof blockadesSchema>;

export const emptyBlockades = (): BlockadesState => ({ runs: [], watched: {}, heat: {}, pending: null, shipOutside: null, ledger: [], captive: null, shipDamagedDay: null });

export interface RunRecorded {
  blockadeId: string;
  approach: BlockadeRunRecord['approach'];
  direction: BlockadeRunRecord['direction'];
  to: string;
  result: BlockadeRunRecord['result'];
  fame: number;
  witnessed: boolean;
  credits: number;
  turnsInto: BlockadeRunRecord['approach'][];
  penalty: number;
}

/** A resolved run written into the state. */
export function recordRun(st: BlockadesState, r: RunRecorded, b: BlockadeDef, at: { day: number; turn: number; locationId: string | null }): BlockadesState {
  const { day, turn, locationId } = at;
  const caught = r.result !== 'through';
  const heat = st.heat[b.id];
  const points = heat && heat.untilDay >= day ? heat.points : 0;
  return {
    ...st,
    runs: [...st.runs, { blockadeId: r.blockadeId, day, approach: r.approach, direction: r.direction, to: r.to, result: r.result, fame: r.fame, witnessed: r.witnessed }].slice(-RUNS_KEPT),
    heat: caught ? { ...st.heat, [b.id]: { points: Math.min(HEAT.max, points + HEAT.perCatch), untilDay: day + HEAT.days } } : st.heat,
    pending: r.turnsInto.length ? { blockadeId: b.id, to: r.to, options: r.turnsInto, penalty: r.penalty, turn } : null,
    shipOutside: r.result !== 'through' ? st.shipOutside : r.approach === 'aroundOnFoot' && r.direction === 'in' ? { blockadeId: b.id, day } : r.direction === 'out' ? null : st.shipOutside,
    ledger: r.credits > 0 ? [...st.ledger, { day, credits: r.credits, reason: `${b.name}: ${r.approach}` }].slice(-50) : st.ledger,
    captive: r.result === 'captured' ? { by: b.runBy, day, locationId } : r.result === 'through' ? null : st.captive,
    shipDamagedDay: r.result === 'firedOn' ? day : st.shipDamagedDay,
  };
}

/** A watch counted: the exact figure is learned once enough hours are in, and a later watch renews it. */
export function recordWatch(st: BlockadesState, b: BlockadeDef, day: number, counted: number, noticed: boolean, needed: number): BlockadesState {
  const was = st.watched[b.id] ?? { hours: 0, knownDay: null, km: null };
  const hours = was.hours + counted;
  const learned = hours >= needed && counted > 0;
  const heat = st.heat[b.id];
  return {
    ...st,
    watched: { ...st.watched, [b.id]: learned ? { hours, knownDay: day, km: Math.round(safeKm(b, day)) } : { ...was, hours } },
    heat: noticed ? { ...st.heat, [b.id]: { points: Math.min(HEAT.max, (heat && heat.untilDay >= day ? heat.points : 0) + HEAT.perCatch), untilDay: day + HEAT.days } } : st.heat,
  };
}

// ---- Which blockades stand ----

/** Standing now: begun, not ended, and neither of its world events says otherwise (D-466). */
export function blockadeStands(net: WorldNetwork, st: NetworkState, b: BlockadeDef, day: number): boolean {
  if (day < blockadeStartDay(b)) return false;
  if (b.end && day > absDayFromDate({ year: b.end.year, month: b.end.month ?? 1, day: b.end.day ?? 1 })) return false;
  if (b.startsWith) {
    const s = outcomeState(net, st, b.startsWith);
    if (s === 'broken' || s === 'pending') return false;
  }
  return !(b.endsWith && outcomeState(net, st, b.endsWith) === 'produced');
}

export const standingBlockades = (st: NetworkState, day: number, net: WorldNetwork = WORLD_NETWORK, list: readonly BlockadeDef[] = BLOCKADES): BlockadeDef[] => list.filter((b) => blockadeStands(net, st, b, day));

// ---- What the character brings ----

function levelOf(s: GameState, skill: string): LevelInputs {
  return {
    level: selectPerformance(s, skill),
    woundPenalty: 1 - (1 - selectWoundPenalty(s, skill)) * (1 - selectLastingPenalty(s, skill)),
    rust: selectRust(s, skill),
    vitalitySpent: selectIsSpent(s),
    fatigueEfficiency: efficiency(selectFatigue(s).p),
  };
}

export const isTrained = (s: GameState): boolean => selectHasFlag(s, 'blockadeTactics') || TRAINED_STARTS.includes(selectCharacter(s).start?.optionId ?? '');

export function runnerFor(s: GameState, b: BlockadeDef): Runner {
  const st = s.world.blockades;
  const day = s.clock.now.day;
  const regard = (id: string): number => s.relationships.byNpcId[id]?.value ?? 0;
  const people = selectNpcs(s)
    .filter((n) => n.status === 'active')
    .sort((x, y) => regard(y.id) - regard(x.id) || x.id.localeCompare(y.id));
  const friends = people.filter((n) => regard(n.id) >= CONTACT.friendly);
  const inTraffic = friends.find((n) => b.protectedTraffic.some((t) => t.factions.includes(n.factionId) && t.roles.includes(n.role)));
  const fixer = friends.find((n) => (['officer', 'official', 'politician', 'smuggler', 'criminal', 'bountyHunter'] as const).includes(n.role as never));
  const pilot = people.find((n) => n.role === 'smuggler' && regard(n.id) >= CONTACT.hired);
  const c = selectCharacter(s);
  const own = c.start?.optionId === 'underworld-smuggler' || c.archetype === 'smuggler';
  const ownLevel = Math.max(selectPerformance(s, 'piloting'), selectPerformance(s, 'stealth'));
  const watched = st.watched[b.id];
  return {
    trained: isTrained(s),
    observed: watched?.knownDay != null && watched.km !== null ? { km: watched.km, daysAgo: day - watched.knownDay } : null,
    protector: selectHasFlag(s, `blockadePapers:${b.id}`) ? 'papers from a permitted party' : inTraffic ? `${inTraffic.name} can place the character with ${b.protectedTraffic[0]?.label ?? 'permitted traffic'}` : null,
    contact: fixer ? `${fixer.name} can get identities and codes` : null,
    smuggler: own ? { name: 'the character knows the trade', level: ownLevel } : pilot ? { name: pilot.name, level: Math.max(selectNpcLevel(s, pilot.id, 'piloting'), selectNpcLevel(s, pilot.id, 'stealth')) } : null,
    masking: selectHasFlag(s, 'shipSystem:masking'),
    fleet: selectHasFlag(s, 'fleetCommand'),
    shipOutside: st.shipOutside?.blockadeId === b.id ? { days: Math.max(0, day - st.shipOutside.day) } : null,
    levels: {
      charisma: levelOf(s, 'charisma'),
      intelligence: levelOf(s, 'intelligence'),
      piloting: levelOf(s, 'piloting'),
      stealth: levelOf(s, 'stealth'),
      endurance: levelOf(s, 'endurance'),
      tracking: levelOf(s, 'tracking'),
      forceSense: levelOf(s, 'forceSense'),
    },
  };
}

export const heatNow = (st: BlockadesState, id: string, day: number): number => (st.heat[id] && st.heat[id]!.untilDay >= day ? st.heat[id]!.points : 0);

/** A failed attempt still open to become another: the same trip, the next turn. */
export const pendingFor = (st: BlockadesState, id: string, to: string, turn: number): NonNullable<BlockadesState['pending']> | null =>
  st.pending && st.pending.blockadeId === id && st.pending.to === to && turn - st.pending.turn <= 1 ? st.pending : null;

/** How long a captive line stands while the character has not moved on. */
export const CAPTIVE_DAYS = 14;
export const captiveOf = (s: GameState): BlockadesState['captive'] => {
  const c = s.world.blockades.captive;
  return c && c.locationId === s.locations.currentId && s.clock.now.day - c.day <= CAPTIVE_DAYS ? c : null;
};
