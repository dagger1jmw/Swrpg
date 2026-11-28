// Ranks feature (ranks.md §1-5, flag-registry.md §2-3; M7 §15, D-424). The rank ladders, the Initiate and Knight Trials,
// standing, Padawan selection, the Council of Reassignment, the master's approval and the Council bypass. Every promotion
// is a story event the player plays: code checks the requirements, rolls the checks and applies the result; the AI only
// proposes (promotionProposed), and a proposal with unmet requirements is rejected and logged (ranks.md test 7).
import { z } from 'zod';
import { COVERT_ESCALATION, COVERT_LEARNING, ORDER_POWER_RULES } from '../../data/orderPowerRules';
import { RANK_BY_ID } from '../../data/rankMinimums';
import { KNIGHT_TRIAL_IDS, PACE_MILESTONES, SELECTION, SERVICE_CORPS, TRIALS, TRIAL_RULES, type PaceMilestone, type TrialId } from '../../data/ranks.config';
import { dateFromAbsDay, formatDate, fromAbsSecond } from '../../engine/calendar';
import { efficiency } from '../../engine/fatigue';
import { nextFloat } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectExactAge } from '../character/selectors';
import { selectHasFlag } from '../flags/selectors';
import { selectLevelExact } from '../progression/selectors';
import { migrateRanksV1, ranksSliceSchema, type RanksSlice } from './ranks';
import { START_OPTION_BY_ID } from '../../data/startOptions';
import { SERVICE_LADDER_BY_ID, SERVICE_LADDER_IDS, ladderExists } from '../../data/serviceRanks';
import { PROGRAMME_BY_ID } from '../../data/trainingProgrammes';
import { serviceEntryCheck, servicePromotionCheck } from '../../engine/serviceRanks';
import { programmeEndDay, programmeEntry } from '../../engine/programmes';
import { PAST_INITIATE, PROGRAMME_TACTICS } from '../../data/tactics';
import { DAYS_PER_YEAR } from '../../engine/calendar';
import { selectCharacter } from '../character/selectors';
import type { SpeciesId } from '../../data/entities.config';
import { covertEscalation, NO_RECORD, paceMilestonesDue, rollTrial, selectionChance, trialsHeldUntil } from './rules';
import {
  selectAheadYears,
  selectBypassUnmet,
  selectCouncilSeatUnmet,
  selectPaceForAge,
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

/** Leaving the initiate stage (m8-fixes B2): the initiate years' basic tactics (the Academy's for a Sith acolyte; approved, D-526). */
function initiateTactics(from: string, to: string): { emit?: GameEvent[] } {
  if (from !== 'initiate' && from !== 'acolyte') return {};
  const set = PAST_INITIATE[to];
  return set ? { emit: [{ type: 'tacticsLearned', sets: [set], source: from === 'initiate' ? 'the Order: the initiate years' : 'the Academy: the acolyte years' }] } : {};
}
const TRIAL_ID_LIST = ['initiate', ...KNIGHT_TRIAL_IDS] as [TrialId, ...TrialId[]];

/** A rank change's slice update: the new rank from today; a new Knight's trials are done with. */
function promote(slice: RanksSlice, rank: string, day: number): RanksSlice {
  return { ...slice, rank, since: day, pendingChoice: false, ...(rank === 'padawan' || rank === 'apprentice' ? { corps: null } : {}) };
}

export const ranksFeature: FeatureModule<RanksSlice, GameState> = {
  id: 'ranks',
  version: 2,
  initialState: (ctx) => {
    const base = migrateRanksV1({ rank: ctx.rank && RANK_BY_ID.has(ctx.rank) ? ctx.rank : 'none' });
    // A military start begins with its service record (m9-tune2 item 3 and addendum 4): the trooper and the conscript in the ranks,
    // the pilot and the junior naval officer on the first officer rung.
    const sv = START_OPTION_BY_ID.get(ctx.character.start?.optionId ?? '')?.service;
    return sv ? { ...base, service: { ladderId: sv.ladderId, rung: 0, since: ctx.start.day, deeds: 0, ...(sv.enlisted ? { enlisted: true } : {}) } } : base;
  },
  // Saves from M1/M2: the migrated outsider has no rank.
  emptyState: () => migrateRanksV1({ rank: 'none' }),
  migrations: { 2: migrateRanksV1 },
  stateSchema: ranksSliceSchema,
  events: {
    /** Engine-only rank change (D-131): the lifetime harness's profile ages, and every applied promotion. */
    rankSet: {
      schema: z.object({ type: z.literal('rankSet'), rank: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => (RANK_BY_ID.has(String(e['rank'])) ? { slice: promote(slice, String(e['rank']), ctx.state.clock.now.day), ...initiateTactics(slice.rank, String(e['rank'])) } : { reject: `unknown rank ${String(e['rank'])}` }),
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
      part: 'people',
      handle: (slice, e, ctx) => {
        const to = String(e['rank']);
        const c = selectPromotionCheck(ctx.state, to);
        if (!c.ok) return { reject: `promotion to ${RANK_BY_ID.get(to)?.name ?? to} refused: ${c.reasons.join('; ')}` };
        return { slice: promote(slice, to, ctx.state.clock.now.day), notes: [`promoted: ${selectRankName(ctx.state)} -> ${RANK_BY_ID.get(to)!.name}${e['reason'] ? ` (${String(e['reason'])})` : ''}`], ...initiateTactics(slice.rank, to) };
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
        const r = rollTrial(ctx.state.meta.rngState, def, levelOf, 0, dateFromAbsDay(ctx.state.clock.now.day).year);
        const day = ctx.state.clock.now.day;
        const prev = slice.trials[t] ?? NO_RECORD;
        const rec = r.passed ? { ...prev, passed: true, lastDay: day } : { ...prev, fails: prev.fails + 1, lastDay: day };
        const third = !r.passed && rec.fails >= TRIAL_RULES.maxFailures;
        const flag: GameEvent = { type: 'flagSet', flag: r.passed ? (t === 'initiate' ? 'initiateTrialsPassed' : `trialPassed:${t}`) : `trialFailed:${t}` };
        const card = [
          ...r.rolls.map((x) => `${x.skill} ${x.total.toFixed(1)} vs DC ${x.dc.toFixed(1)} ${x.success ? 'pass' : 'fail'}`),
          ...(r.competence ? [`Forms II-VI at ${r.competence.floor}+: ${r.competence.met} of ${r.competence.of} (need ${r.competence.need})`] : []),
        ].join('; ');
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
    /**
     * A High Council seat (ranks.md §1; D-356, D-430): the story offers a vacancy (the narrator or the player proposes it);
     * the engine checks Master rank, main specialty 70 and standing 75. Wartime appointments are the same event.
     */
    councilSeatProposed: {
      schema: z.object({ type: z.literal('councilSeatProposed'), reason: z.string().max(200).optional() }),
      sources: ['ai', 'player'],
      narrative: (s) => s.ranks.rank === 'master' && !s.ranks.councilSeat,
      part: 'people',
      handle: (slice, e, ctx) => {
        if (slice.councilSeat) return { slice };
        const unmet = selectCouncilSeatUnmet(ctx.state);
        if (unmet.length) return { reject: `a High Council seat refused: ${unmet.join('; ')}` };
        return { slice: { ...slice, councilSeat: true }, notes: [`a seat on the High Council${e['reason'] ? ` (${String(e['reason'])})` : ''}`] };
      },
    },
    /** Engine: a pace-for-age milestone (ranks.md §4) is reached; once each; queues a milestone beat for the narrator. */
    paceMilestoneReached: {
      schema: z.object({ type: z.literal('paceMilestoneReached'), milestone: z.enum(['noticed', 'prodigyTalk', 'aheadOfTime']) }),
      sources: ['engine'],
      handle: (slice, e) => {
        const m = e['milestone'] as PaceMilestone;
        if ((slice.milestones ?? []).includes(m)) return { slice };
        return { slice: { ...slice, milestones: [...(slice.milestones ?? []), m] }, emit: [{ type: 'milestoneBeatQueued', id: `milestone:${m}`, label: PACE_MILESTONES[m].label }], notes: [`milestone: ${PACE_MILESTONES[m].label}`] };
      },
    },
    /**
     * A Master permits the character to learn a forbidden power (D-346, D-436): the story or the player proposes it; the
     * engine checks it is a forbidden power for a Jedi and that the one permitting is a Jedi Master (the character's own
     * master, or an NPC whose role is jediMaster).
     */
    forbiddenPermissionGranted: {
      schema: z.object({ type: z.literal('forbiddenPermissionGranted'), abilityId: z.string(), byNpcRef: z.string() }),
      sources: ['ai', 'player'],
      narrative: (s) => s.character.path === 'jedi',
      part: 'people',
      handle: (slice, e, ctx) => {
        const id = String(e['abilityId']);
        if (ctx.state.character.path !== 'jedi') return { reject: 'only the Jedi Order forbids powers' };
        if (ORDER_POWER_RULES[id]?.status !== 'forbidden') return { reject: `${id} is not a forbidden power (D-346)` };
        const ref = String(e['byNpcRef']);
        const npc = ctx.state.npcs.byId[ref];
        if (!npc || (npc.role !== 'jediMaster' && slice.masterId !== ref)) return { reject: 'only a Jedi Master can permit a forbidden power' };
        if ((slice.powerPermissions ?? []).includes(id)) return { slice };
        return { slice: { ...slice, powerPermissions: [...(slice.powerPermissions ?? []), id] }, notes: [`${npc.name} permits the study of ${id}`] };
      },
    },
    /** Engine: the Order discovers covert learning of a forbidden or dark-side power (D-436): Order standing falls. */
    covertLearningDiscovered: {
      schema: z.object({ type: z.literal('covertLearningDiscovered'), abilityId: z.string() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const before = covertEscalation(slice.covertDiscoveries ?? []).flags;
        const covertDiscoveries = [...(slice.covertDiscoveries ?? []), { abilityId: String(e['abilityId']), day: ctx.state.clock.now.day }];
        // D-448: the escalation the new discovery reaches; the code tracks it, the narrator plays the consequence.
        const reached = covertEscalation(covertDiscoveries).flags.filter((f) => !before.includes(f));
        const texts = reached.map((f) => COVERT_ESCALATION.find((x) => x.flag === f)!.text);
        // D-454: from the 3rd discovery on the Knight Trials are held back a year more (the code decides).
        const held = trialsHeldUntil(covertDiscoveries);
        return {
          slice: { ...slice, reputationPenalty: (slice.reputationPenalty ?? 0) + COVERT_LEARNING.standingPenalty, covertDiscoveries },
          notes: [
            `the Order learns of covert study of ${String(e['abilityId'])} (discovery ${covertDiscoveries.length}): standing -${COVERT_LEARNING.standingPenalty}`,
            ...(texts.length ? [`consequence to narrate now: ${texts.join('; ')}`] : []),
            ...(held !== null && held > ctx.state.clock.now.day ? [`the Knight Trials are held back until ${formatDate(held)} (a year for each discovery from the third)`] : []),
          ],
        };
      },
    },
    /** Engine: Order standing lost for conduct (the economy, M8 item 5: a reputation for keeping rewards, amassing wealth). */
    orderStandingLost: {
      schema: z.object({ type: z.literal('orderStandingLost'), cause: z.string().max(120), points: z.number().min(0).max(50) }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice: { ...slice, reputationPenalty: (slice.reputationPenalty ?? 0) + Number(e['points']) }, notes: [`Order standing -${Number(e['points'])}: ${String(e['cause'])}`] }),
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
    // ---- non-Force careers (m8-skills, D-513; ranks.md section 3a) ----
    /**
     * Joining a service on its first rung (the player, or the engine for a start): the entry minimum must hold. Enlisting (m9-tune2
     * item 3) joins an army or navy in the ranks below the first rung: no entry minimum, a private's pay.
     */
    serviceJoined: {
      schema: z.object({ type: z.literal('serviceJoined'), ladderId: z.enum(SERVICE_LADDER_IDS as [string, ...string[]]), enlisted: z.boolean().optional() }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        const l = SERVICE_LADDER_BY_ID.get(String(e['ladderId']))!;
        const year = dateFromAbsDay(ctx.state.clock.now.day).year;
        if (!ladderExists(l, year)) return { reject: `${l.faction} does not exist in this year` };
        if (e['enlisted'] === true) {
          if (l.branch === 'intelligence') return { reject: `${l.faction} takes no enlisted ranks` };
          return {
            slice: { ...slice, service: { ladderId: l.id, rung: 0, since: ctx.state.clock.now.day, deeds: 0, enlisted: true } },
            emit: [{ type: 'militaryServiceSet', grade: 'private' }],
            notes: [`enlisted in ${l.faction}`],
          };
        }
        const c = serviceEntryCheck(l, (k) => selectLevelExact(ctx.state, k));
        if (!c.ok) return { reject: `cannot join ${l.faction}: ${c.reasons.join('; ')}` };
        const rung = l.rungs[0]!;
        return {
          slice: { ...slice, service: { ladderId: l.id, rung: 0, since: ctx.state.clock.now.day, deeds: 0 } },
          emit: [{ type: 'militaryServiceSet', grade: rung.pay }],
          notes: [`joined ${l.faction} as ${rung.title}`],
        };
      },
    },
    /** Leaving the service. */
    serviceLeft: {
      schema: z.object({ type: z.literal('serviceLeft') }),
      sources: ['player', 'engine'],
      handle: (slice) => {
        if (!slice.service) return { reject: 'not in any service' };
        const { service: _gone, ...rest } = slice;
        return { slice: rest, emit: [{ type: 'militaryServiceSet', grade: null }], notes: ['left the service'] };
      },
    },
    /** Engine: a recorded deed in service (a battle won in command, a serious fight won, an operation carried out). */
    serviceDeedRecorded: {
      schema: z.object({ type: z.literal('serviceDeedRecorded'), why: z.string().max(120) }),
      sources: ['engine'],
      handle: (slice, e) => (slice.service ? { slice: { ...slice, service: { ...slice.service, deeds: slice.service.deeds + 1 } }, notes: [`a deed on the service record: ${String(e['why'])}`] } : { slice }),
    },
    /**
     * A promotion the story reached (the AI or the player proposes; the engine checks years in rank, the skill minimum and
     * recorded deeds, and applies it when met, else rejects it with what is missing).
     */
    servicePromotionProposed: {
      schema: z.object({ type: z.literal('servicePromotionProposed'), reason: z.string().max(200).optional() }),
      sources: ['ai', 'player'],
      narrative: (s) => s.ranks.service !== undefined,
      part: 'people',
      handle: (slice, e, ctx) => {
        const sv = slice.service;
        if (!sv) return { reject: 'not in any service' };
        const l = SERVICE_LADDER_BY_ID.get(sv.ladderId);
        if (!l) return { reject: `unknown service ${sv.ladderId}` };
        // A commission from the ranks (m9-tune2 item 3): the first rung's entry minimum.
        if (sv.enlisted) {
          const c = serviceEntryCheck(l, (k) => selectLevelExact(ctx.state, k));
          if (!c.ok) return { reject: `commission refused: ${c.reasons.join('; ')}` };
          const { enlisted: _ranks, ...officer } = sv;
          return {
            slice: { ...slice, service: { ...officer, rung: 0, since: ctx.state.clock.now.day } },
            emit: [{ type: 'militaryServiceSet', grade: l.rungs[0]!.pay }],
            notes: [`commissioned from the ranks: ${l.rungs[0]!.title}${e['reason'] ? ` (${String(e['reason'])})` : ''}`],
          };
        }
        const c = servicePromotionCheck(l, sv.rung, { yearsInRank: (ctx.state.clock.now.day - sv.since) / DAYS_PER_YEAR, level: (k) => selectLevelExact(ctx.state, k), deeds: sv.deeds });
        if (!c.ok) return { reject: `promotion refused: ${c.reasons.join('; ')}` };
        const to = l.rungs[sv.rung + 1]!;
        return {
          slice: { ...slice, service: { ...sv, rung: sv.rung + 1, since: ctx.state.clock.now.day } },
          emit: [{ type: 'militaryServiceSet', grade: to.pay }],
          notes: [`promoted: ${l.rungs[sv.rung]!.title} -> ${to.title}${e['reason'] ? ` (${String(e['reason'])})` : ''}`],
        };
      },
    },
    /** Engine: a story appointment to a story-only rung (Supreme Commander, a Moff, Grand Admiral). */
    serviceAppointed: {
      schema: z.object({ type: z.literal('serviceAppointed'), title: z.string().max(60) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const sv = slice.service;
        if (!sv) return { reject: 'not in any service' };
        const l = SERVICE_LADDER_BY_ID.get(sv.ladderId)!;
        const i = l.rungs.findIndex((r) => r.storyOnly && r.title === String(e['title']));
        if (i < 0) return { reject: `${String(e['title'])} is not an appointment in ${l.faction}` };
        const { enlisted: _ranks, ...officer } = sv;
        return { slice: { ...slice, service: { ...officer, rung: i, since: ctx.state.clock.now.day } }, notes: [`appointed ${l.rungs[i]!.title}`] };
      },
    },
    /** Enrolling in a training programme: its entry rules; it runs its length, then ends with its graduation. */
    programmeEnrolled: {
      schema: z.object({ type: z.literal('programmeEnrolled'), programmeId: z.string() }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        const p = PROGRAMME_BY_ID.get(String(e['programmeId']));
        if (!p) return { reject: `unknown programme ${String(e['programmeId'])}` };
        if (slice.programme) return { reject: `already enrolled in ${PROGRAMME_BY_ID.get(slice.programme.id)?.name ?? slice.programme.id}` };
        const s = ctx.state;
        const c = selectCharacter(s);
        const why = programmeEntry(p, { age: selectExactAge(s), year: dateFromAbsDay(s.clock.now.day).year, species: c.speciesId as SpeciesId, archetype: c.archetype });
        if (why) return { reject: why };
        const endDay = programmeEndDay(p, s.clock.now.day);
        return { slice: { ...slice, programme: { id: p.id, startDay: s.clock.now.day, endDay } }, notes: [`enrolled: ${p.name} (${p.where}), to ${formatDate(endDay)}`] };
      },
    },
    /** Leaving a programme before its end (washed out or withdrawn). */
    programmeLeft: {
      schema: z.object({ type: z.literal('programmeLeft') }),
      sources: ['player', 'engine'],
      handle: (slice) => {
        if (!slice.programme) return { reject: 'not enrolled in any programme' };
        const { programme: _gone, ...rest } = slice;
        return { slice: rest, notes: ['left the programme before its end'] };
      },
    },
  },
  /**
   * Monthly (the first day of a month): the Padawan selection roll for an Initiate who passed the Trials (S / 940), the
   * Council of Reassignment at 13, a Knight's interest in the Corps (2% a month), the master's approval and the Council
   * bypass. Engine flags and events only.
   */
  onTimeAdvanced: (sliceIn, step, ctx) => {
    if (!step.endsDay) return { slice: sliceIn };
    const s = ctx.state;
    // The day that starts at the end of this step: checks run on the first of each month.
    const day = fromAbsSecond(step.toAbs).day;
    // A training programme runs its length, then ends with its graduation (m8-skills, D-513).
    let slice = sliceIn;
    const graduated: string[] = [];
    const taught: GameEvent[] = [];
    if (slice.programme && day >= slice.programme.endDay) {
      const p = PROGRAMME_BY_ID.get(slice.programme.id);
      graduated.push(`${p?.name ?? slice.programme.id} is over: ${p?.graduation ?? 'graduated'}.`);
      // The tactics the programme teaches (m8-ship-life part G: flight school, an officer academy, army training).
      const sets = PROGRAMME_TACTICS[slice.programme.id] ?? [];
      if (sets.length) taught.push({ type: 'tacticsLearned', sets: [...sets], source: `training: ${p?.name ?? slice.programme.id}` });
      const { programme: _done, ...rest } = slice;
      slice = rest;
    }
    if (dateFromAbsDay(day).day !== 1) return { slice, ...(graduated.length ? { notices: graduated } : {}), ...(taught.length ? { emit: taught } : {}) };
    const emit: GameEvent[] = [...taught];
    const notices: string[] = [...graduated];
    let rng = s.meta.rngState;
    const age = selectExactAge(s);
    // Standing lost to covert learning fades (D-436): COVERT_LEARNING.decayPerYear a year, a twelfth each month.
    const fading = (slice.reputationPenalty ?? 0) > 0 ? { ...slice, reputationPenalty: Math.max(0, (slice.reputationPenalty ?? 0) - COVERT_LEARNING.decayPerYear / 12) } : slice;
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
    // Pace-for-age milestones (ranks.md §4).
    if (s.character.path === 'jedi' || s.character.path === 'sith') {
      const p = selectPaceForAge(s);
      for (const m of paceMilestonesDue({ years: p.years, pace: p.pace, aheadYears: selectAheadYears(s), reached: slice.milestones ?? [] })) emit.push({ type: 'paceMilestoneReached', milestone: m });
    }
    return emit.length ? { slice: fading, emit, notices, rng } : { slice: fading, rng, ...(notices.length ? { notices } : {}) };
  },
  selectors: { rank: selectRank, rankName: selectRankName },
};
