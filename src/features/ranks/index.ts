// Ranks feature (ranks.md §1-5, flag-registry.md §2-3; M7 §15, D-424). The rank ladders, the Initiate and Knight Trials,
// standing, Padawan selection, the Council of Reassignment, the master's approval and the Council bypass. Every promotion
// is a story event the player plays: code checks the requirements, rolls the checks and applies the result; the AI only
// proposes (promotionProposed), and a proposal with unmet requirements is rejected and logged (ranks.md test 7).
import { z } from 'zod';
import { RANK_BY_ID } from '../../data/rankMinimums';
import { KNIGHT_TRIAL_IDS, SELECTION, SERVICE_CORPS, TRIALS, TRIAL_RULES, type TrialId } from '../../data/ranks.config';
import { dateFromAbsDay, fromAbsSecond } from '../../engine/calendar';
import { efficiency } from '../../engine/fatigue';
import { nextFloat } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectExactAge } from '../character/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectLevelExact } from '../progression/selectors';
import { migrateRanksV1, ranksSliceSchema, type RanksSlice } from './ranks';
import { NO_RECORD, rollTrial, selectionChance } from './rules';
import {
  selectBypassUnmet,
  selectMayTakePadawan,
  selectMasterApprovalUnmet,
  selectMinimumLevel,
  selectPromotionCheck,
  selectRank,
  selectRankName,
  selectStanding,
  selectTrialBlock,
} from './selectors';

const RANK_IDS = [...RANK_BY_ID.keys()] as [string, ...string[]];
const TRIAL_ID_LIST = ['initiate', ...KNIGHT_TRIAL_IDS] as [TrialId, ...TrialId[]];

/** A rank change's slice update: the new rank from today; a new Knight's trials are done with. */
function promote(slice: RanksSlice, rank: string, day: number): RanksSlice {
  return { ...slice, rank, since: day, pendingChoice: false, ...(rank === 'padawan' || rank === 'apprentice' ? { corps: null } : {}) };
}

export const ranksFeature: FeatureModule<RanksSlice, GameState> = {
  id: 'ranks',
  version: 2,
  initialState: (ctx) => ({ ...migrateRanksV1({ rank: ctx.rank && RANK_BY_ID.has(ctx.rank) ? ctx.rank : 'none' }) }),
  // Saves from M1/M2: the migrated outsider has no rank.
  emptyState: () => migrateRanksV1({ rank: 'none' }),
  migrations: { 2: migrateRanksV1 },
  stateSchema: ranksSliceSchema,
  events: {
    /** Engine-only rank change (D-131): the lifetime harness's profile ages, and every applied promotion. */
    rankSet: {
      schema: z.object({ type: z.literal('rankSet'), rank: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => (RANK_BY_ID.has(String(e['rank'])) ? { slice: promote(slice, String(e['rank']), ctx.state.clock.now.day) } : { reject: `unknown rank ${String(e['rank'])}` }),
    },
    /**
     * The AI proposes a promotion the story reached (ranks.md: "the AI can only propose"). The engine checks every
     * requirement (selectPromotionCheck) and applies it when met; otherwise the proposal is rejected and logged with the
     * unmet requirements (test 7).
     */
    promotionProposed: {
      schema: z.object({ type: z.literal('promotionProposed'), rank: z.enum(RANK_IDS), reason: z.string().max(200).optional() }),
      sources: ['ai', 'player'],
      narrative: (s) => s.ranks.rank !== 'none' && s.ranks.rank !== 'career',
      handle: (slice, e, ctx) => {
        const to = String(e['rank']);
        const c = selectPromotionCheck(ctx.state, to);
        if (!c.ok) return { reject: `promotion to ${RANK_BY_ID.get(to)?.name ?? to} refused: ${c.reasons.join('; ')}` };
        return { slice: promote(slice, to, ctx.state.clock.now.day), notes: [`promoted: ${selectRankName(ctx.state)} -> ${RANK_BY_ID.get(to)!.name}${e['reason'] ? ` (${String(e['reason'])})` : ''}`] };
      },
    },
    /**
     * The player attempts a trial scene (ranks.md §1): the engine checks eligibility and the retake wait, rolls the
     * checks (DC = 10 + rating / 10; Spirit 10 + D / 5 + 4; Flesh at f 0.8) and records the result as a trial flag.
     */
    trialAttempted: {
      schema: z.object({ type: z.literal('trialAttempted'), trial: z.enum(TRIAL_ID_LIST) }),
      sources: ['player'],
      handle: (slice, e, ctx) => {
        const t = e['trial'] as TrialId;
        const block = selectTrialBlock(ctx.state, t);
        if (block) return { reject: `${TRIALS[t].name}: ${block}` };
        const def = TRIALS[t];
        // Flesh starts the scene fatigued: efficiency at f 0.8 (rolls.md §1: x(1 - 0.25 (1 - e)), e(0.8) = 0.367).
        const fatigue = def.startF !== undefined ? 1 - 0.25 * (1 - efficiency(def.startF)) : 1;
        const levelOf = (skill: string): number => (skill.startsWith('$') ? selectMinimumLevel(ctx.state, skill) : selectLevelExact(ctx.state, skill)) * fatigue;
        const r = rollTrial(ctx.state.meta.rngState, def, levelOf, 0);
        const day = ctx.state.clock.now.day;
        const prev = slice.trials[t] ?? NO_RECORD;
        const rec = r.passed ? { ...prev, passed: true, lastDay: day } : { ...prev, fails: prev.fails + 1, lastDay: day };
        const third = !r.passed && rec.fails >= TRIAL_RULES.maxFailures;
        const flag: GameEvent = { type: 'flagSet', flag: r.passed ? (t === 'initiate' ? 'initiateTrialsPassed' : `trialPassed:${t}`) : `trialFailed:${t}` };
        const card = r.rolls.map((x) => `${x.skill} ${x.total.toFixed(1)} vs DC ${x.dc.toFixed(1)} ${x.success ? 'pass' : 'fail'}`).join('; ');
        return {
          slice: { ...slice, trials: { ...slice.trials, [t]: rec }, pendingChoice: slice.pendingChoice || third },
          rng: r.rng,
          emit: [flag],
          notes: [`${def.name}: ${r.passed ? 'PASSED' : 'FAILED'} (${card})${third ? `; a third failure: choose the Service Corps, to remain a Padawan in service, or to leave the Order` : ''}`],
        };
      },
    },
    /** The player's choice after a third failed trial (ranks.md §1). */
    trialFailureChoice: {
      schema: z.object({ type: z.literal('trialFailureChoice'), choice: z.enum(['serviceCorps', 'remainPadawan', 'leaveOrder']) }),
      sources: ['player'],
      handle: (slice, e) => {
        if (!slice.pendingChoice) return { reject: 'no failed trial awaits a choice' };
        const c = String(e['choice']);
        if (c === 'serviceCorps') return { slice: { ...slice, pendingChoice: false, corps: 'educational' }, notes: ['the Service Corps (Educational)'] };
        if (c === 'leaveOrder') return { slice: { ...slice, pendingChoice: false, rank: 'none', since: null }, notes: ['leaves the Order'] };
        return { slice: { ...slice, pendingChoice: false }, notes: ['remains a Padawan in service'] };
      },
    },
    /** The master (an NPC), set by the player or the engine (a start option); never by the AI (rank-gating, D-33). */
    masterSet: {
      schema: z.object({ type: z.literal('masterSet'), npcRef: z.string() }),
      sources: ['player', 'engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: { npcRef: ['npc'] },
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        if (!ctx.state.npcs.byId[id]) return { reject: `unknown npc ${id}` };
        return { slice: { ...slice, masterId: id }, notes: [`master: ${ctx.state.npcs.byId[id]!.name}`] };
      },
    },
    /**
     * The character takes a Padawan (Jared, D-427: teaching and mentoring): a Knight or Master of 25+ (ranks.md §1; the
     * Council's approval is the story's). The player sets it; the engine may. Opens the teaching activity.
     */
    apprenticeTaken: {
      schema: z.object({ type: z.literal('apprenticeTaken'), npcRef: z.string() }),
      sources: ['player', 'engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: { npcRef: ['npc'] },
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        if (!ctx.state.npcs.byId[id]) return { reject: `unknown npc ${id}` };
        if (!selectMayTakePadawan(ctx.state)) return { reject: 'a Padawan is taken by a Knight or Master of 25 or more' };
        if (slice.apprenticeId) return { reject: 'the character already has a Padawan' };
        return { slice: { ...slice, apprenticeId: id }, notes: [`Padawan: ${ctx.state.npcs.byId[id]!.name}`] };
      },
    },
    /** The character's Padawan is knighted (a story the player plays): a Master requirement (ranks.md §1). */
    apprenticeKnighted: {
      schema: z.object({ type: z.literal('apprenticeKnighted') }),
      sources: ['player', 'engine'],
      handle: (slice) => (slice.apprenticeId ? { slice: { ...slice, apprenticeId: null, padawansKnighted: slice.padawansKnighted + 1 }, notes: ['your Padawan is knighted'] } : { reject: 'no Padawan to knight' }),
    },
    /** Engine: chosen as a Padawan (the monthly selection roll, or a Knight's interest while in the Corps). */
    padawanChosen: {
      schema: z.object({ type: z.literal('padawanChosen') }),
      sources: ['engine'],
      handle: (slice, _e, ctx) => {
        const to = slice.rank === 'acolyte' ? 'apprentice' : 'padawan';
        return { slice: promote(slice, to, ctx.state.clock.now.day), notes: [`chosen: now a ${RANK_BY_ID.get(to)!.name}`] };
      },
    },
    /** Engine: not chosen by 13, the Council of Reassignment sends the Initiate to the Service Corps (ranks.md §1). */
    councilReassignment: {
      schema: z.object({ type: z.literal('councilReassignment'), corps: z.enum(SERVICE_CORPS) }),
      sources: ['engine'],
      handle: (slice, e) => (slice.corps ? { slice } : { slice: { ...slice, corps: e['corps'] as RanksSlice['corps'] }, notes: [`the Council of Reassignment: the ${String(e['corps'])} Corps`] }),
    },
  },
  /**
   * Monthly (the first day of a month): the Padawan selection roll for an Initiate who passed the Trials (S / 940), the
   * Council of Reassignment at 13, a Knight's interest in the Corps (2% a month), the master's approval and the Council
   * bypass. Engine flags and events only.
   */
  onTimeAdvanced: (slice, step, ctx) => {
    if (!step.endsDay) return { slice };
    const s = ctx.state;
    // The day that starts at the end of this step: checks run on the first of each month.
    const day = fromAbsSecond(step.toAbs).day;
    if (dateFromAbsDay(day).day !== 1) return { slice };
    const emit: GameEvent[] = [];
    const notices: string[] = [];
    let rng = s.meta.rngState;
    const age = selectExactAge(s);
    if (slice.rank === 'initiate' && !slice.corps) {
      if (age >= SELECTION.maxAge) {
        let u: number;
        [u, rng] = nextFloat(rng);
        const corps = SERVICE_CORPS[Math.min(SERVICE_CORPS.length - 1, Math.floor(u * SERVICE_CORPS.length))]!;
        emit.push({ type: 'councilReassignment', corps });
        notices.push(`Not chosen as a Padawan by 13: the Council of Reassignment sends you to the ${corps} Corps. You may accept, leave the Order, or hope a Knight takes interest later.`);
      } else if (selectHasFlag(s, 'initiateTrialsPassed')) {
        let u: number;
        [u, rng] = nextFloat(rng);
        if (u < selectionChance(selectStanding(s))) {
          emit.push({ type: 'padawanChosen' });
          notices.push('A Knight has chosen you as a Padawan.');
        }
      }
    } else if (slice.rank === 'initiate' && slice.corps) {
      let u: number;
      [u, rng] = nextFloat(rng);
      if (u < SELECTION.corpsChance) {
        emit.push({ type: 'padawanChosen' });
        notices.push('A Knight on a mission has taken an interest in you: you are chosen as a Padawan.');
      }
    }
    if (slice.rank === 'padawan') {
      if (!selectHasFlag(s, 'masterApproval') && selectMasterApprovalUnmet(s).length === 0) {
        emit.push({ type: 'flagSet', flag: 'masterApproval' });
        notices.push('Your master judges you ready for the Knight Trials.');
      }
      if (!selectHasFlag(s, 'councilBypassGranted') && selectBypassUnmet(s).length === 0) {
        emit.push({ type: 'flagSet', flag: 'councilBypassGranted' });
        notices.push('The Council summons you: for your service in the war it will raise you to Knight without the trials.');
      }
    }
    return emit.length ? { slice, emit, notices, rng } : { slice, rng };
  },
  selectors: { rank: selectRank, rankName: selectRankName },
};
