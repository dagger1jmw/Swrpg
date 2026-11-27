// Duty, missions and home days (Jared, 26 Nov 2026; opt-2 D; spec/duty.md). The status (on a mission or at home) is the code's:
// the day hook rolls the daily assignment chance while at home, runs the injury check, opens the mission's thread and ends the
// mission when its thread is resolved or the character comes home; the narrator only tells it. The same roll runs in story days
// and in skips: a skip stops on the day the roll comes up.
import { z } from 'zod';
import { DUTY_LOG_MAX } from '../../data/duty.config';
import { fromAbsSecond } from '../../engine/calendar';
import { nextFloat } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent, InitCtx } from '../../state/types';
import { selectWounds } from '../health/selectors';
import { selectLocationChain } from '../locations/selectors';
import { dutySliceSchema, type DutySlice } from './duty';
import { selectAtHome } from './home';
import { allHandsNow, injuryBlock, missionChance, missionKind, missionMedian } from './rules';
import { selectDutyLine, selectDutyPromptLine, selectFitnessLine, selectHomeDayLine } from './selectors';

type R = { slice: DutySlice; notes?: string[] } | { reject: string };

const initial = (day: number): DutySlice => ({ status: 'home', since: day, mission: null, homeDay: null, resume: null, home: null, log: [] });
const logged = (slice: DutySlice, day: number, what: string): DutySlice['log'] => [...slice.log, { day, what: what.slice(0, 160) }].slice(-DUTY_LOG_MAX);
const PART: Readonly<Record<string, string>> = { torso: 'torso', head: 'head', leftArm: 'left arm', rightArm: 'right arm', leftLeg: 'left leg', rightLeg: 'right leg', leftHand: 'left hand', rightHand: 'right hand' };

/** The mission's thread, opened with it (the newest of that title since the assignment). */
function missionThread(s: GameState, m: NonNullable<DutySlice['mission']>) {
  return Object.values(s.threads.byId).filter((t) => t.title === m.threadTitle && t.openedDay >= m.assignedDay).sort((a, b) => b.openedDay - a.openedDay)[0] ?? null;
}

/** Whether a mission roll can run at all today: alive, not dying, not held, not in a battle. */
function canBeAssigned(s: GameState): boolean {
  return s.health.death === null && s.world.captivity === null && s.battles.active === null && s.battles.ground === null && s.combat.active === null;
}

export const dutyFeature: FeatureModule<DutySlice, GameState> = {
  id: 'duty',
  version: 1,
  initialState: (ctx: InitCtx) => initial(ctx.start.day),
  // A save from before duty: at home since its own day.
  emptyState: (raw) => initial(((raw['clock'] ?? {}) as { now?: { day?: number } }).now?.day ?? 0),
  stateSchema: dutySliceSchema,
  events: {
    /** Engine only: the daily roll came up and the injury check passed. The narrator never assigns a mission. */
    missionAssigned: {
      schema: z.object({ type: z.literal('missionAssigned'), title: z.string().min(1).max(80), threadTitle: z.string().min(1).max(80) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        if (slice.status === 'mission') return { reject: 'already on a mission' };
        const day = ctx.state.clock.now.day;
        const title = String(e['title']);
        return { slice: { ...slice, status: 'mission', since: day, mission: { title, threadTitle: String(e['threadTitle']), assignedDay: day, leftHome: false }, log: logged(slice, day, `assigned: ${title}`) }, notes: [`mission assigned: ${title}`] };
      },
    },
    /** Engine only: the mission's thread is resolved, or the character is back at home after leaving it. */
    missionEnded: {
      schema: z.object({ type: z.literal('missionEnded'), how: z.string().min(1).max(80) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        if (slice.status !== 'mission' || !slice.mission) return { reject: 'not on a mission' };
        const day = ctx.state.clock.now.day;
        const what = `${slice.mission.title} ended (${String(e['how'])})`;
        return { slice: { ...slice, status: 'home', since: day, mission: null, homeDay: day + 1, log: logged(slice, day, what) }, notes: [what] };
      },
    },
    /** Engine only: an assignment came up but a wound held it back (the injury check). */
    missionHeldBack: {
      schema: z.object({ type: z.literal('missionHeldBack'), why: z.string().min(1).max(120) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => ({ slice: { ...slice, log: logged(slice, ctx.state.clock.now.day, `held back: ${String(e['why'])}`) } }),
    },
    /** Dev only (/allhands, m9-missions A6): all hands on deck for the character's side, on or off. */
    devAllHandsSet: {
      schema: z.object({ type: z.literal('devAllHandsSet'), on: z.boolean() }),
      sources: ['dev'],
      handle: (slice, e): R => {
        const { devAllHands: _drop, ...rest } = slice;
        return { slice: e['on'] === true ? { ...rest, devAllHands: true } : rest };
      },
    },
    /** Engine only: where a skip was going when it stopped (for "Resume the skip"); null when a skip ran to its end. */
    skipResumePoint: {
      schema: z.object({ type: z.literal('skipResumePoint'), targetDay: z.number().int().nullable() }),
      sources: ['engine'],
      handle: (slice, e): R => ({ slice: { ...slice, resume: e['targetDay'] === null ? null : { targetDay: Number(e['targetDay']) } } }),
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    const s = ctx.state;
    let next = slice;
    // A home base for a career or a Sith (a Jedi's is the Order's seat): the world they are on when duty first sees them.
    if (!next.home && s.character.path !== 'jedi' && s.locations.currentId) {
      const chain = selectLocationChain(s, s.locations.currentId);
      const world = chain.find((l) => l.kind === 'planet' || l.kind === 'moon') ?? chain[0];
      if (world) next = { ...next, home: { name: world.name, planet: world.kind === 'planet' || world.kind === 'moon' ? world.name : null } };
    }
    const emit: GameEvent[] = [];
    const notices: string[] = [];
    const home = selectAtHome({ ...s, duty: next });
    // A mission ends when its thread is resolved, or when the character comes home after leaving it (checked by the code).
    if (next.status === 'mission' && next.mission) {
      const m = !home && !next.mission.leftHome ? { ...next.mission, leftHome: true } : next.mission;
      next = { ...next, mission: m };
      const t = missionThread(s, m);
      const how = t && t.status !== 'open' ? `its thread is ${t.status}` : m.leftHome && home ? 'back at home' : null;
      if (how) {
        emit.push({ type: 'missionEnded', how });
        notices.push(`Duty: ${m.title.replace(/^Mission: /, '')} is over (${how}).`);
      }
      return { slice: next, ...(emit.length ? { emit, notices } : {}) };
    }
    // The daily roll, at midnight, while at home (off duty): story days and skips alike.
    if (!step.endsDay) return { slice: next };
    const median = missionMedian(s);
    if (median === null || !canBeAssigned(s)) return { slice: next };
    const day = fromAbsSecond(step.toAbs).day;
    let rng = s.meta.rngState;
    let u: number;
    [u, rng] = nextFloat(rng);
    if (u >= missionChance(day - next.since, median)) return { slice: next, rng };
    // The injury check on every assignment (opt-2 D3).
    const hands = allHandsNow(s);
    const block = injuryBlock(selectWounds(s), hands !== null);
    if (block) {
      const why = `a ${block.severity} wound to the ${PART[block.part] ?? block.part} (${Math.round(block.healProgress * 100)}% healed)`;
      return { slice: next, rng, emit: [{ type: 'missionHeldBack', why }], notices: [`Duty: an assignment was held back: ${why}.`] };
    }
    [u, rng] = nextFloat(rng);
    const kind = missionKind(s, u);
    const title = `Mission: ${kind}`;
    const stakes = s.character.path === 'jedi' ? 'The assignment the Order has given you.' : s.character.path === 'sith' ? 'The task your superiors have set you.' : 'The assignment your command has given you.';
    emit.push({ type: 'threadOpened', title, stakes, entityRefs: [] }, { type: 'missionAssigned', title, threadTitle: title });
    notices.push(`Duty: a mission assignment, ${kind}${hands ? ` (all hands: ${hands})` : ''}.`);
    const interrupt = `A mission assignment: ${kind}`;
    return { slice: next, rng, emit, notices, interrupt };
  },
  selectors: { line: selectDutyLine, fitness: selectFitnessLine },
  promptSection: (s) => [selectDutyPromptLine(s), selectHomeDayLine(s)].filter(Boolean).join('\n') || null,
};
