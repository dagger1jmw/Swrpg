// Duty, missions, postings and home days (Jared, 26-27 Nov 2026; opt-2 D, m9-missions B; spec/duty.md, spec/missions.md). The
// status (on a mission or at home), the mission record and its stages, postings and leave are the code's: the day hook rolls the
// daily assignment while at home, posts the character in a total war, sends them on leave, and ends a mission when they are back
// at base; the turn (turn/missionTurn.ts) decides the stages. The narrator only tells it, and may propose a mission the story
// suggests (missionProposed), which the code checks.
import { z } from 'zod';
import { DUTY_LOG_MAX } from '../../data/duty.config';
import { COMPLICATION_STAGES, LEAD_STAGE, LEADS, MISSION_HISTORY_MAX, MISSION_STANDING, MISSION_TYPES, MISSION_TYPE_IDS, POSTING, STAGE_RULES } from '../../data/missions.config';
import { PLANETS } from '../../data/galaxyMap';
import { dateFromAbsDay, fromAbsSecond } from '../../engine/calendar';
import { nextFloat } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent, InitCtx } from '../../state/types';
import { selectWounds } from '../health/selectors';
import { selectLocationChain } from '../locations/selectors';
import { dutySliceSchema, emptyRecord, missionSchema, postingSchema, type DutySlice, type Mission } from './duty';
import { selectAtHome, selectAtPlace, selectCurrentWorld, selectHomeBase } from './home';
import { buildMission, worldOpen, frontRunning, migrateDutyV2, missionBase, pickMissionType, pickWorld, postingEligible, postingFor, stageFromDef, stageNeedsPlayer } from './missions';
import { allHandsNow, injuryBlock, missionChance, missionMedian, missionRoll } from './rules';
import { selectDutyLine, selectDutyPromptLine, selectFitnessLine, selectHomeDayLine, selectMissionPromptLine, selectPostingPromptLine } from './selectors';

type R = { slice: DutySlice; notes?: string[] } | { reject: string };

const initial = (day: number): DutySlice => ({ status: 'home', since: day, mission: null, homeDay: null, resume: null, home: null, log: [], posting: null, leave: null, record: emptyRecord(), history: [], seq: 0, proposalDay: null, proposal: null });
const logged = (slice: DutySlice, day: number, what: string): DutySlice['log'] => [...slice.log, { day, what: what.slice(0, 160) }].slice(-DUTY_LOG_MAX);
const PART: Readonly<Record<string, string>> = { torso: 'torso', head: 'head', leftArm: 'left arm', rightArm: 'right arm', leftLeg: 'left leg', rightLeg: 'right leg', leftHand: 'left hand', rightHand: 'right hand' };
const short = (m: Mission): string => m.title.replace(/^Mission: /, '');
const yearOfDay = (day: number): number => dateFromAbsDay(day).year;

/** Whether a mission roll or a posting can come at all today: alive, not dying, not held, not in a fight or a battle. */
function canBeAssigned(s: GameState): boolean {
  return s.health.death === null && s.world.captivity === null && s.battles.active === null && s.battles.ground === null && s.combat.active === null;
}

/** A mission's end in the record and the history (B9): counts, standing, the history line. */
function recorded(slice: DutySlice, m: Mission, outcome: string, day: number, chained = false): Pick<DutySlice, 'record' | 'history'> {
  const r = slice.record;
  const delta = outcome === 'success' ? MISSION_STANDING.success : outcome === 'failure' ? MISSION_STANDING.failure : MISSION_STANDING.cutShort;
  const record = {
    missions: r.missions + 1,
    successes: r.successes + (outcome === 'success' ? 1 : 0),
    failures: r.failures + (outcome === 'failure' ? 1 : 0),
    cutShort: r.cutShort + (outcome === 'cutShort' ? 1 : 0),
    chains: r.chains + (chained ? 1 : 0),
    standing: Math.max(MISSION_STANDING.min, Math.min(MISSION_STANDING.max, r.standing + delta)),
  };
  const history = [...slice.history, { id: m.id, type: m.type, title: m.title, world: m.targetWorld, outcome, startDay: m.assignedDay, endDay: day }].slice(-MISSION_HISTORY_MAX);
  return { record, history };
}

/** A stage's world (a travel stage) or the mission's target: where the stage is decided. */
const withStage = (m: Mission, i: number, patch: Partial<Mission['stages'][number]>): Mission => ({ ...m, stages: m.stages.map((st, j) => (j === i ? { ...st, ...patch } : st)) });

/** The mission after its current stage is done: the next stage active, or the work done (outcome success, the way home). */
function advanced(m: Mission): Mission {
  const done = withStage(m, m.current, { status: 'done', fightId: null, battleFrom: null });
  const next = m.current + 1;
  if (next >= done.stages.length) return { ...done, outcome: 'success', phase: 'return' };
  return withStage({ ...done, current: next }, next, { status: 'active' });
}

export const dutyFeature: FeatureModule<DutySlice, GameState> = {
  id: 'duty',
  version: 2,
  initialState: (ctx: InitCtx) => initial(ctx.start.day),
  // A save from before duty: at home since its own day.
  emptyState: (raw) => initial(((raw['clock'] ?? {}) as { now?: { day?: number } }).now?.day ?? 0),
  stateSchema: dutySliceSchema,
  // v2 (m9-missions B12): the mission record, postings, leave and the record of missions; an opt-2 mission becomes a record.
  migrations: { 2: (old, raw) => migrateDutyV2(old as Record<string, unknown>, raw) },
  events: {
    /** Engine only: a mission the code built (the daily roll, an accepted proposal, a dev command). The narrator never assigns one. */
    missionAssigned: {
      schema: z.object({ type: z.literal('missionAssigned'), mission: missionSchema }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        if (slice.status === 'mission') return { reject: 'already on a mission' };
        const day = ctx.state.clock.now.day;
        const m = e['mission'] as Mission;
        return { slice: { ...slice, status: 'mission', since: day, mission: m, seq: slice.seq + 1, proposal: null, log: logged(slice, day, `assigned: ${short(m)}`) }, notes: [`mission assigned: ${short(m)}`] };
      },
    },
    /** Engine only: the character has reached the target world (outbound) or a travel stage's world (B4). */
    missionArrived: {
      schema: z.object({ type: z.literal('missionArrived'), where: z.enum(['target', 'stage']) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        const m = slice.mission;
        if (slice.status !== 'mission' || !m) return { reject: 'not on a mission' };
        const day = ctx.state.clock.now.day;
        if (e['where'] === 'target') {
          if (m.phase !== 'outbound') return { reject: 'not on the way out' };
          const next = withStage({ ...m, phase: 'onSite', leftHome: true }, m.current, { status: 'active' });
          return { slice: { ...slice, mission: next, log: logged(slice, day, `arrived at ${m.targetWorld}`) }, notes: [`arrived at ${m.targetWorld}: ${next.stages[next.current]?.label ?? ''}`] };
        }
        const st = m.stages[m.current];
        if (m.phase !== 'onSite' || st?.kind !== 'travel') return { reject: 'no travel stage now' };
        const next = advanced({ ...m, leftHome: true });
        return { slice: { ...slice, mission: next, log: logged(slice, day, `${st.label}: reached ${st.world ?? 'the next world'}`) }, notes: [`${st.label}: done`] };
      },
    },
    /** Engine only (m9-release A11): the trip out to the target begins; a long trip no longer reads as never setting out. */
    missionSetOut: {
      schema: z.object({ type: z.literal('missionSetOut') }),
      sources: ['engine'],
      handle: (slice): R => {
        const m = slice.mission;
        if (slice.status !== 'mission' || !m || m.phase !== 'outbound') return { reject: 'no mission to set out for' };
        return { slice: { ...slice, mission: { ...m, setOut: true } } };
      },
    },
    /** Engine only: a fight or battle begun for the current stage (B3). */
    missionStageStarted: {
      schema: z.object({ type: z.literal('missionStageStarted'), fightId: z.string().nullable(), battleFrom: z.number().int().nullable() }),
      sources: ['engine'],
      handle: (slice, e): R => {
        const m = slice.mission;
        if (!m || m.phase !== 'onSite') return { reject: 'no stage on site' };
        return { slice: { ...slice, mission: withStage(m, m.current, { status: 'active', fightId: (e['fightId'] as string | null) ?? null, battleFrom: (e['battleFrom'] as number | null) ?? null }) } };
      },
    },
    /**
     * Engine only: the current stage decided (B3). A success counts toward the stage; a failure brings a complication (harder, and
     * on a bad failure a complication stage first); the mission fails only when the code says so (failMission).
     */
    missionStageResolved: {
      schema: z.object({ type: z.literal('missionStageResolved'), success: z.boolean(), why: z.string().max(160), complication: z.string().max(120).optional(), insert: z.boolean().optional(), failMission: z.boolean().optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        const m = slice.mission;
        if (!m || m.phase !== 'onSite' || m.outcome !== null) return { reject: 'no stage on site' };
        const st = m.stages[m.current]!;
        const day = ctx.state.clock.now.day;
        if (e['success'] === true) {
          const counted = withStage(m, m.current, { progress: st.progress + 1, fightId: null, battleFrom: null });
          const next = st.progress + 1 >= st.need ? advanced(counted) : counted;
          const what = next.outcome === 'success' ? `${st.label}: done; the work is done` : st.progress + 1 >= st.need ? `${st.label}: done` : `${st.label}: progress ${st.progress + 1} of ${st.need}`;
          return { slice: { ...slice, mission: next, log: logged(slice, day, what) }, notes: [what] };
        }
        const comp = String(e['complication'] ?? 'things go wrong');
        if (e['failMission'] === true) {
          const failed = withStage({ ...m, complications: [...m.complications, comp].slice(-12), outcome: 'failure', phase: 'return' }, m.current, { status: 'failed', fightId: null, battleFrom: null });
          return { slice: { ...slice, mission: failed, log: logged(slice, day, `${short(m)} failed: ${comp}`) }, notes: [`the mission has failed: ${comp}`] };
        }
        let next: Mission = withStage({ ...m, complications: [...m.complications, comp].slice(-12) }, m.current, { harder: st.harder + 1, fightId: null, battleFrom: null });
        if (e['insert'] === true && next.stages.length < 12) {
          const extra = stageFromDef(COMPLICATION_STAGES[st.kind === 'fight' ? 'check' : 'fight']!, null, comp);
          const stages = [...next.stages];
          stages.splice(m.current, 0, { ...extra, status: 'active' });
          stages[m.current + 1] = { ...stages[m.current + 1]!, status: 'pending' };
          next = { ...next, stages };
        }
        return { slice: { ...slice, mission: next, log: logged(slice, day, `complication: ${comp}`) }, notes: [`complication: ${comp}`] };
      },
    },
    /** Engine only: the mission's outcome before the way home (B8 cut short; a deadline passed; B3 failed). */
    missionOutcome: {
      schema: z.object({ type: z.literal('missionOutcome'), outcome: z.enum(['success', 'failure', 'cutShort']), why: z.string().max(160) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        const m = slice.mission;
        if (!m || m.outcome !== null) return { reject: 'no mission under way' };
        const outcome = e['outcome'] as Mission['outcome'];
        return { slice: { ...slice, mission: { ...m, outcome, phase: 'return' }, log: logged(slice, ctx.state.clock.now.day, `${short(m)}: ${outcome} (${String(e['why'])})`) }, notes: [`${short(m)}: ${outcome} (${String(e['why'])})`] };
      },
    },
    /** Engine only: back at base (B4), given to someone else, or cut short: the record, the history and the standing (B9). */
    missionEnded: {
      schema: z.object({ type: z.literal('missionEnded'), how: z.string().min(1).max(120), outcome: z.enum(['success', 'failure', 'cutShort']).optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        const m = slice.mission;
        if (slice.status !== 'mission' || !m) return { reject: 'not on a mission' };
        const day = ctx.state.clock.now.day;
        const outcome = (e['outcome'] as string | undefined) ?? m.outcome ?? 'failure';
        const what = `${short(m)} ended: ${outcome} (${String(e['how'])})`;
        return { slice: { ...slice, status: 'home', since: day, mission: null, homeDay: day + 1, ...recorded(slice, m, outcome, day), log: logged(slice, day, what) }, notes: [what] };
      },
    },
    /** Engine only (B6): the Council's best sent straight on: the mission done is recorded and the next one begins where they are. */
    missionChained: {
      schema: z.object({ type: z.literal('missionChained'), how: z.enum(['followUp', 'front', 'recall']), mission: missionSchema }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        const m = slice.mission;
        if (slice.status !== 'mission' || !m) return { reject: 'not on a mission' };
        const day = ctx.state.clock.now.day;
        const next = e['mission'] as Mission;
        const how = e['how'] === 'followUp' ? 'a follow-up' : e['how'] === 'front' ? 'another front' : 'an urgent recall';
        const what = `${short(m)} done; sent straight on (${how}): ${short(next)}`;
        return { slice: { ...slice, mission: next, since: day, seq: slice.seq + 1, ...recorded(slice, m, m.outcome ?? 'success', day, true), log: logged(slice, day, what) }, notes: [what] };
      },
    },
    /** Engine only: an assignment came up but a wound held it back (the injury check). */
    missionHeldBack: {
      schema: z.object({ type: z.literal('missionHeldBack'), why: z.string().min(1).max(120) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => ({ slice: { ...slice, log: logged(slice, ctx.state.clock.now.day, `held back: ${String(e['why'])}`) } }),
    },
    /** Engine only (B5b): posted to a front in a total war; the forward base is home while posted. */
    postingAssigned: {
      schema: z.object({ type: z.literal('postingAssigned'), posting: postingSchema }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        const p = e['posting'] as DutySlice['posting'] & object;
        return { slice: { ...slice, posting: p, leave: null, leaveClock: { warId: p.warId, nextLeaveDay: p.nextLeaveDay }, log: logged(slice, ctx.state.clock.now.day, `posted to ${p.front}`) }, notes: [`posted to ${p.front} (${p.base.name})`] };
      },
    },
    /** Engine only (B5b): the posting ends: its front's war events ended, a recall, or an evacuation. */
    postingEnded: {
      schema: z.object({ type: z.literal('postingEnded'), why: z.string().min(1).max(120) }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        if (!slice.posting) return { reject: 'not posted' };
        const what = `the posting to ${slice.posting.front} ends (${String(e['why'])})`;
        return { slice: { ...slice, posting: null, leave: null, log: logged(slice, ctx.state.clock.now.day, what) }, notes: [what] };
      },
    },
    /** Engine only (B5c): leave home from a posting begins (the Temple is home until it ends). */
    leaveStarted: {
      schema: z.object({ type: z.literal('leaveStarted'), untilDay: z.number().int() }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        if (!slice.posting) return { reject: 'not posted' };
        const day = ctx.state.clock.now.day;
        return { slice: { ...slice, leave: { fromDay: day, untilDay: Number(e['untilDay']) }, log: logged(slice, day, `leave until day ${Number(e['untilDay'])}`) }, notes: ['leave begins'] };
      },
    },
    /** Engine only (B5c): leave is over; the next leave is set. */
    leaveEnded: {
      schema: z.object({ type: z.literal('leaveEnded'), nextLeaveDay: z.number().int() }),
      sources: ['engine'],
      handle: (slice, e, ctx): R => {
        if (!slice.posting || !slice.leave) return { reject: 'not on leave' };
        return { slice: { ...slice, leave: null, posting: { ...slice.posting, nextLeaveDay: Number(e['nextLeaveDay']) }, leaveClock: { warId: slice.posting.warId, nextLeaveDay: Number(e['nextLeaveDay']) }, log: logged(slice, ctx.state.clock.now.day, 'leave over') }, notes: ['leave is over: back to the front'] };
      },
    },
    /**
     * The narrator's proposal (B10): a mission the story suggests (a lead found in play). The code checks it like other proposals:
     * off duty, missions at this rank, at most one a week, a known type, a world on the map. Accepted, the code assigns it at the
     * next passage of time; the narrator never assigns it.
     */
    missionProposed: {
      schema: z.object({ type: z.literal('missionProposed'), missionType: z.enum(MISSION_TYPE_IDS as [string, ...string[]]), world: z.string().min(1).max(60), why: z.string().min(1).max(160) }),
      sources: ['ai'],
      // In the people part (D-520): a lead found in play comes from someone present; the core schema stays under its cap.
      part: 'people',
      narrative: (s) => s.duty.status === 'home' && !s.duty.off,
      handle: (slice, e, ctx): R => {
        const s = ctx.state;
        const day = s.clock.now.day;
        if (slice.status !== 'home') return { reject: 'a mission is under way: the code ends it before another' };
        if (missionMedian(s) === null) return { reject: 'no missions at this rank' };
        if (slice.proposalDay !== null && day - slice.proposalDay < 7) return { reject: 'a proposal was taken this week' };
        const world = PLANETS.find((p) => p.name.toLowerCase() === String(e['world']).trim().toLowerCase());
        if (!world) return { reject: `${String(e['world'])} is not a world on the map` };
        if (!worldOpen(s, world.name)) return { reject: `${world.name} is not open to the character by the travel rules (closed this year, or off the charted routes)` };
        return { slice: { ...slice, proposal: { type: String(e['missionType']), world: world.name, why: String(e['why']) }, proposalDay: day }, notes: [`the code will assign it: ${MISSION_TYPES[String(e['missionType'])]!.name} on ${world.name}`] };
      },
    },
    /**
     * The narrator's lead (m9-release A13): found in play on an investigation or a manhunt, checked like other proposals. "here" adds
     * a stage after the current one (follow the lead); "world" adds the trip to another map world and a stage there; "followUp" sets
     * a follow-up mission on the same thread, assigned by the code when this one succeeds. Never decides or ends a stage.
     */
    missionLeadFound: {
      schema: z.object({ type: z.literal('missionLeadFound'), lead: z.enum(['here', 'world', 'followUp']), world: z.string().max(60).optional(), why: z.string().min(1).max(160) }),
      sources: ['ai'],
      narrative: (s) => {
        const m = s.duty.mission;
        return s.duty.status === 'mission' && m !== null && m.phase === 'onSite' && m.outcome === null && LEADS.types.includes(m.type) && (m.leads ?? 0) < LEADS.maxPerMission;
      },
      handle: (slice, e, ctx): R => {
        const m = slice.mission;
        if (slice.status !== 'mission' || !m || m.phase !== 'onSite' || m.outcome !== null) return { reject: 'no mission on site' };
        if (!LEADS.types.includes(m.type)) return { reject: `leads are followed on investigations and manhunts, not ${MISSION_TYPES[m.type]?.name ?? m.type}` };
        if ((m.leads ?? 0) >= LEADS.maxPerMission) return { reject: `this mission has taken its ${LEADS.maxPerMission} leads` };
        const st = m.stages[m.current];
        if (st?.fightId || st?.battleFrom !== null && st?.battleFrom !== undefined) return { reject: 'not in the middle of a fight or battle' };
        const why = String(e['why']);
        const lead = String(e['lead']);
        const day = ctx.state.clock.now.day;
        const here = selectCurrentWorld(ctx.state);
        const world = e['world'] !== undefined ? PLANETS.find((p) => p.name.toLowerCase() === String(e['world']).trim().toLowerCase())?.name ?? null : null;
        if (lead !== 'here' && !world) return { reject: `${String(e['world'] ?? 'no world')} is not a world on the map` };
        if (lead !== 'here' && !worldOpen(ctx.state, world!)) return { reject: `${world} is not open to the character by the travel rules (closed this year, or off the charted routes)` };
        if (lead === 'world' && here && world!.toLowerCase() === here.toLowerCase()) return { reject: 'that lead is on this world: a lead here' };
        const n = (m.leads ?? 0) + 1;
        if (lead === 'followUp') {
          return { slice: { ...slice, mission: { ...m, leads: n, followUp: { world: world!, why } }, log: logged(slice, day, `a lead past the job: ${world} (${why})`) }, notes: [`lead: a follow-up on ${world} when this succeeds`] };
        }
        const add = lead === 'world' ? [stageFromDef({ id: 'leadTrip', label: 'follow the lead', kind: 'travel' }, world, why), stageFromDef(LEAD_STAGE, null, why)] : [stageFromDef(LEAD_STAGE, null, why)];
        if (m.stages.length + add.length > 12) return { reject: 'the mission has no room for another stage' };
        const stages = [...m.stages];
        stages.splice(m.current + 1, 0, ...add);
        return { slice: { ...slice, mission: { ...m, stages, leads: n }, log: logged(slice, day, `a lead: ${why}${lead === 'world' ? ` (to ${world})` : ''}`) }, notes: [`lead taken: ${add.map((x) => x.label).join(', ')}`] };
      },
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
    if (next.off) return { slice: next };
    const sx: GameState = { ...s, duty: next };
    const emit: GameEvent[] = [];
    const notices: string[] = [];
    let rng = s.meta.rngState;
    let u: number;
    const day = fromAbsSecond(step.toAbs).day;

    // On a mission (B1, B4): the code ends it at base; a deadline or a mission never set out for fails it; a stage that needs the
    // player stops a skip (B11).
    if (next.status === 'mission' && next.mission) {
      let m = next.mission;
      const atBase = selectAtPlace(sx, m.base);
      if (!atBase && !m.leftHome) m = { ...m, leftHome: true };
      next = { ...next, mission: m };
      const local = m.base.planet !== null && m.base.planet.toLowerCase() === m.targetWorld.toLowerCase();
      if (atBase && m.outcome !== null && (m.leftHome || local)) {
        emit.push({ type: 'missionEnded', how: 'back at base', outcome: m.outcome });
        notices.push(`Duty: ${short(m)} is over (${m.outcome}, back at base).`);
      } else if (atBase && m.outcome === null && m.leftHome && !local && m.phase !== 'outbound') {
        emit.push({ type: 'missionEnded', how: 'came back with the work undone', outcome: 'failure' });
        notices.push(`Duty: ${short(m)} is over: you came back with the work undone.`);
      } else if (step.endsDay && m.outcome === null && m.phase === 'outbound' && m.setOut !== true && day - m.assignedDay > STAGE_RULES.setOutDays) {
        emit.push({ type: 'missionEnded', how: 'never set out: given to someone else', outcome: 'failure' });
        notices.push(`Duty: ${short(m)} was given to someone else (you never set out).`);
      } else if (step.endsDay && m.outcome === null && m.deadlineDay !== null && day > m.deadlineDay) {
        emit.push({ type: 'missionOutcome', outcome: 'failure', why: 'the deadline passed' });
        notices.push(`Duty: ${short(m)} has failed: the deadline passed.`);
      }
      const interrupt = !emit.length && stageNeedsPlayer(m) ? `The mission needs you: ${m.stages[m.current]!.label}` : undefined;
      return { slice: next, ...(emit.length ? { emit, notices } : {}), ...(interrupt ? { interrupt } : {}) };
    }

    if (!step.endsDay) return { slice: next };
    const year = yearOfDay(day);
    // Postings and leave, at midnight (B5b, B5c).
    if (next.posting) {
      let p = next.posting;
      // The posting's base reached (m9-release A6): from now on the line reads "at" or "away from" the base.
      if (p.arrived === false && selectAtPlace(sx, p.base)) {
        p = { ...p, arrived: true };
        next = { ...next, posting: p };
      }
      if (!frontRunning(p.frontId, year)) {
        emit.push({ type: 'postingEnded', why: "the front's war events have ended" });
        notices.push(`Duty: the posting to ${p.front} ends: its war events are over.`);
        return { slice: next, emit, notices, interrupt: `The posting to ${p.front} ends` };
      }
      if (next.leave && day >= next.leave.untilDay) {
        [u, rng] = nextFloat(rng);
        const [lo, hi] = POSTING.leaveEvery;
        emit.push({ type: 'leaveEnded', nextLeaveDay: day + Math.round(lo + u * (hi - lo)) });
        notices.push(`Duty: leave is over; back to ${p.base.name}.`);
        return { slice: next, rng, emit, notices, interrupt: 'Leave is over: back to the front' };
      }
      if (!next.leave && p.arrived !== false && day >= p.nextLeaveDay && canBeAssigned(s)) {
        [u, rng] = nextFloat(rng);
        const [lo, hi] = POSTING.leaveDays;
        emit.push({ type: 'leaveStarted', untilDay: day + Math.round(lo + u * (hi - lo)) });
        notices.push(`Duty: leave from ${p.front}: a trip home.`);
        return { slice: next, rng, emit, notices, interrupt: 'Leave: a trip home' };
      }
    } else if (postingEligible(s) && canBeAssigned(s) && !injuryBlock(selectWounds(s), false)) {
      let v: number;
      [u, rng] = nextFloat(rng);
      [v, rng] = nextFloat(rng);
      const posting = postingFor(s, u, v);
      if (posting) {
        emit.push({ type: 'postingAssigned', posting });
        notices.push(`Duty: posted to ${posting.front} (${posting.base.name}).`);
        return { slice: next, rng, emit, notices, interrupt: `Posted to ${posting.front}` };
      }
    }
    if (next.leave) return { slice: next, ...(rng !== s.meta.rngState ? { rng } : {}) };

    const base = missionBase(sx, selectHomeBase(sx));
    // A narrator's proposal the code accepted (B10): assigned now.
    if (next.proposal && canBeAssigned(s)) {
      const p = next.proposal;
      const type = MISSION_TYPES[p.type]!;
      const built = buildMission(sx, { type, world: p.world, base, id: `m${next.seq + 1}`, threadTitle: `Mission: ${p.why}`.slice(0, 80), here: selectCurrentWorld(sx) }, rng);
      rng = built.rng;
      emit.push({ type: 'threadOpened', title: built.mission.threadTitle, stakes: p.why, entityRefs: [] }, { type: 'missionAssigned', mission: built.mission });
      notices.push(`Duty: a mission from the story: ${short(built.mission)}.`);
      return { slice: next, rng, emit, notices, interrupt: `A mission assignment: ${short(built.mission)}` };
    }
    // The daily roll, at midnight, while at base and off duty: story days and skips alike.
    const roll = missionRoll(sx);
    if (roll === null || !canBeAssigned(s) || !selectAtHome(sx)) return { slice: next, ...(rng !== s.meta.rngState ? { rng } : {}) };
    [u, rng] = nextFloat(rng);
    if (u >= missionChance(day - next.since, roll.median, roll)) return { slice: next, rng };
    // The injury check on every assignment (opt-2 D3).
    const hands = allHandsNow(sx);
    const block = injuryBlock(selectWounds(s), hands !== null);
    if (block) {
      const why = `a ${block.severity} wound to the ${PART[block.part] ?? block.part} (${Math.round(block.healProgress * 100)}% healed)`;
      return { slice: next, rng, emit: [{ type: 'missionHeldBack', why }], notices: [`Duty: an assignment was held back: ${why}.`] };
    }
    [u, rng] = nextFloat(rng);
    const [w, rngW] = nextFloat(rng);
    rng = rngW;
    const type = pickMissionType(sx, u);
    const world = pickWorld(sx, base, w);
    const built = buildMission(sx, { type, world, base, id: `m${next.seq + 1}`, here: selectCurrentWorld(sx) }, rng);
    rng = built.rng;
    const m = built.mission;
    const stakes = s.character.path === 'jedi' ? 'The assignment the Order has given you.' : s.character.path === 'sith' ? 'The task your superiors have set you.' : 'The assignment your command has given you.';
    emit.push({ type: 'threadOpened', title: m.threadTitle, stakes, entityRefs: [] }, { type: 'missionAssigned', mission: m });
    notices.push(`Duty: a mission assignment, ${short(m)}${hands ? ` (all hands: ${hands})` : ''}.`);
    return { slice: next, rng, emit, notices, interrupt: `A mission assignment: ${short(m)}` };
  },
  selectors: { line: selectDutyLine, fitness: selectFitnessLine },
  promptSection: (s) => [selectDutyPromptLine(s), selectMissionPromptLine(s), selectPostingPromptLine(s), selectHomeDayLine(s)].filter(Boolean).join('\n') || null,
};
