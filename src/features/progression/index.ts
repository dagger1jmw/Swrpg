// Progression feature (architecture §12; progression-numbers §2-17). Owns XP, rust, the pace window,
// the state of mind, grief, the overtraining streak, today's training state and pending tier beats.
// XP enters only through activityResolved (engine, from computeXp); the AI proposes emotionalEvent
// and milestoneBeatAcknowledged and never sets a number.
import { z } from 'zod';
import { DISTRACTED, OVERTRAINING, PACE_WINDOW_DAYS, PASSION_DAYS, STATE_STRENGTH, CENTERED_MEDITATION_HOURS, EMOTION_TO_STATE, FATIGUE_WILLPOWER, type StateOfMind } from '../../data/progression.config';
import { SKILL_BY_ID, CATEGORY_RULES, PHYSICAL_STATS } from '../../data/skills';
import { ACTIVITY_BY_ID, DEFAULT_ACTIVITY } from '../../data/activities';
import { COMBAT_OUTCOMES, COMBAT_STAKES, COMBAT_XP } from '../../data/progression.config';
import { computeCombatXp, strongerDuelXp, type CombatSession } from '../../engine/combatXp';
import { selectCharacter, selectPath } from '../character/selectors';
import { eGainFor, gainCI, gainE, releaseBank, releaseUntil, splitDrillXp } from '../../engine/appliedExperience';
import { RECORDING_REVIEW } from '../../data/combat.config';
import { speedFor } from './training';
import { formatDate, fromAbsSecond } from '../../engine/calendar';
import { levelWithNatural, thresholdsCrossed, tierOf, xpForLevel } from '../../engine/curve';
import { FORM_IDS, isSkillId } from '../../data/skills';
import { DEV_REFUSAL, selectIsTestCharacter } from '../character/selectors';
import { senseGain } from '../../engine/forceSense';
import { removeRust, rustAfterDay } from '../../engine/rust';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { selectLasting, selectMaxFraction } from '../health/selectors';
import { selectOpenThreads } from '../threads/selectors';
import { EMPTY_TODAY, activeState, easeDays, emptyProgression, migrateProgressionV1, migrateProgressionV2, migrateProgressionV3, progressionSliceSchema, type ProgressionSlice, type StateOfMindRecord } from './progression';
import { ageingStep } from '../../engine/ageing';
import { PRIME_H } from '../../data/ageing.config';
import { selectAgeing, selectBodyAgeNow, selectCapacities, selectLevelExact, selectNatural, selectSkillViews, selectStateOfMind, selectTierBeats } from './selectors';

const EMOTIONS = ['grief', 'fear', 'anger', 'hatred', 'calm', 'pride', 'despair'] as const;
const record = z.record(z.string(), z.number().min(0));

/** A state replaces the active one when the active one has ended or is not stronger (strongest wins, §17). */
function setState(cur: StateOfMindRecord, next: StateOfMindRecord, day: number, force = false): StateOfMindRecord {
  const active = activeState(cur, day);
  if (force || active === 'neutral' || STATE_STRENGTH[next.kind] >= STATE_STRENGTH[active]) return next;
  return cur;
}

const PASSIONS: readonly StateOfMind[] = ['fear', 'anger', 'hatred', 'pride'];

/** One duel exchange is 5-10 s (architecture §10); 7.5 s on average. */
const EXCHANGE_HOURS = 7.5 / 3600;

/** combat-xp §1: the 0.25 goes to the physical stats by the skill's own activity weights. */
function combatPhysicalWeights(skill: string): Record<string, number> {
  const act = ACTIVITY_BY_ID.get(DEFAULT_ACTIVITY[skill] ?? '');
  if (!act || SKILL_BY_ID.get(skill)?.kind === 'forceAbility') return {};
  return Object.fromEntries(Object.entries(act.secondaries).filter(([k]) => (PHYSICAL_STATS as readonly string[]).includes(k) && k !== skill));
}

/**
 * Credits XP to skills (tier beats, rust removal, the pace window): shared by training sessions and
 * fights, so every source lands the same way.
 */
function creditXp(
  slice: ProgressionSlice,
  s: GameState,
  credited: Record<string, number>,
  practice: Record<string, number>,
  windowHours: Record<string, number>,
  day: number,
  /** The credited XP enters the pace window (training); a fight's does not (D-457). */
  paced = true,
): { slice: ProgressionSlice; emit: GameEvent[]; notes: string[] } {
  const skills = { ...slice.skills };
  const beats = [...slice.tierBeatsPending];
  let seq = slice.nextSeq;
  const emit: GameEvent[] = [];
  const notes: string[] = [];
  // Force Sense comes with Force Control (D-495): outside the pace window and the clamp, like the transfers, and practised with it.
  const forceUser = selectPath(s) !== 'career';
  const xpOf = (id: string): number => skills[id]?.xp ?? 0;
  const sense = forceUser ? senseGain(xpOf('forceSense') + (credited['forceSense'] ?? 0), xpOf('forceControl') + (credited['forceControl'] ?? 0), credited['forceControl'] ?? 0) : 0;
  const gains = sense > 0 ? { ...credited, forceSense: (credited['forceSense'] ?? 0) + sense } : credited;
  const drilled = forceUser && (practice['forceControl'] ?? 0) > 0 ? { ...practice, forceSense: Math.max(practice['forceSense'] ?? 0, practice['forceControl']!) } : practice;
  for (const [id, xp] of Object.entries(gains)) {
    if (xp <= 0) continue;
    const prev = skills[id] ?? { xp: 0, rust: 0, lastPracticedDay: null };
    const natural = selectNatural(s, id);
    const before = levelWithNatural(prev.xp, natural);
    const after = levelWithNatural(prev.xp + xp, natural);
    skills[id] = { ...prev, xp: prev.xp + xp };
    // Crossing 21 / 41 / 61 / 81 / 101 / 151: one non-blocking beat each (architecture §12).
    for (const t of thresholdsCrossed(before, after)) {
      const beat = { id: `beat:${seq}`, skillId: id, tier: t, day };
      seq += 1;
      beats.push(beat);
      const name = SKILL_BY_ID.get(id)!.name;
      notes.push(`${name} reached ${t} (${tierOf(t)})`);
      emit.push({ type: 'factLearned', aboutRef: 'pc', fact: `Reached ${tierOf(t)} level (${t}) in ${name}.`, importance: t >= 41 ? 'major' : 'minor' });
    }
  }
  for (const [id, h] of Object.entries(drilled)) {
    const prev = skills[id] ?? { xp: 0, rust: 0, lastPracticedDay: null };
    skills[id] = { ...prev, rust: removeRust(prev.rust, h), lastPracticedDay: day };
  }
  // Pace window (D-48, D-104): today's credited XP and training hours per skill (hours by XP share, D-109).
  const paceWindow = { ...slice.paceWindow };
  const touch = paced ? new Set([...Object.keys(credited), ...Object.keys(windowHours)]) : new Set<string>();
  for (const id of touch) {
    const entries = (paceWindow[id] ?? []).filter((w) => w.day > day - PACE_WINDOW_DAYS);
    const last = entries[entries.length - 1];
    const addXp = credited[id] ?? 0;
    const addHours = windowHours[id] ?? 0;
    if (last && last.day === day) entries[entries.length - 1] = { day, xp: last.xp + addXp, hours: last.hours + addHours };
    else entries.push({ day, xp: addXp, hours: addHours });
    paceWindow[id] = entries;
  }
  return { slice: { ...slice, skills, tierBeatsPending: beats, nextSeq: seq, paceWindow }, emit, notes };
}

const formGroup = (id: string): string | null => {
  const d = SKILL_BY_ID.get(id);
  return d?.kind === 'form' ? (d.formGroup ?? id) : null;
};
const groupE = (slice: ProgressionSlice, form: string): number => slice.E[formGroup(form) ?? form]?.E ?? 0;

/**
 * The drill ceiling on lightsaber-form XP (progression-numbers §7; D-45): below 25 + E it applies in full; past it
 * 25% applies and 75% is banked (bank cap 15 levels). Returns the credited map with forms reduced, and the new bank.
 */
function applyCeiling(slice: ProgressionSlice, credited: Record<string, number>): { credited: Record<string, number>; bank: Record<string, number>; notes: string[] } {
  const out = { ...credited };
  const bank = { ...slice.bank };
  const notes: string[] = [];
  for (const [id, x] of Object.entries(credited)) {
    if (formGroup(id) === null || x <= 0) continue;
    const split = splitDrillXp(slice.skills[id]?.xp ?? 0, x, groupE(slice, id), bank[id] ?? 0);
    out[id] = split.applied;
    if (split.banked > 0) bank[id] = (bank[id] ?? 0) + split.banked;
    if (split.banked > 0 || split.overflow > 0) {
      const name = SKILL_BY_ID.get(id)!.name;
      const lost = split.overflow > 0 ? `, ${split.overflow.toFixed(2)} lost (bank full)` : '';
      notes.push(`${name}: drill ceiling ${(25 + groupE(slice, id)).toFixed(1)}: ${split.applied.toFixed(2)} XP applied, ${split.banked.toFixed(2)} banked${lost}`);
    }
  }
  return { credited: out, bank, notes };
}

/** One E gain for each form group among `forms` (each group once per session or fight). */
function gainForGroups(E: ProgressionSlice['E'], forms: readonly string[], source: Parameters<typeof gainE>[1], sparCap?: number): ProgressionSlice['E'] {
  const next = { ...E };
  for (const g of new Set(forms.map(formGroup).filter((x): x is string => x !== null))) next[g] = gainE(next[g] ?? { E: 0, eSpar: 0 }, source, sparCap);
  return next;
}

export const progressionFeature: FeatureModule<ProgressionSlice, GameState> = {
  id: 'progression',
  version: 4,
  migrations: { 2: migrateProgressionV1, 3: migrateProgressionV2, 4: migrateProgressionV3 },
  initialState: (ctx) => ({
    ...emptyProgression(ctx.start.day, ctx.startingXp ?? {}),
    E: { ...(ctx.startingE ?? {}) },
    CI: { ...(ctx.startingCI ?? {}) },
    // A character created past Initiate holds the Padawan specialty transfer in its closed-form levels (D-460).
    ...(ctx.rank && ctx.rank !== 'initiate' && ctx.rank !== 'none' ? { specialtyTransfer: 'creation' } : {}),
  }),
  // Saves from M1/M2: no training (natural baselines only).
  emptyState: (raw) => {
    const clock = raw['clock'] as { now?: { day?: unknown } } | undefined;
    const day = typeof clock?.now?.day === 'number' ? clock.now.day : 0;
    return emptyProgression(day);
  },
  stateSchema: progressionSliceSchema,
  events: {
    /** One resolved training session (computeXp result); the only way XP enters. */
    /**
     * Dev sandbox (D-180), test campaigns only: a skill at an exact level (trained XP above the natural baseline, rust
     * cleared). A level under the natural baseline sits at the baseline.
     */
    devSkillSet: {
      schema: z.object({ type: z.literal('devSkillSet'), skillId: z.string(), level: z.number().min(0).max(120) }),
      sources: ['dev'],
      handle: (slice, e, ctx) => {
        if (!selectIsTestCharacter(ctx.state)) return { reject: DEV_REFUSAL };
        const id = String(e['skillId']);
        if (!isSkillId(id)) return { reject: `unknown skill ${id}` };
        const natural = selectNatural(ctx.state, id);
        const level = Number(e['level']);
        const xp = Math.max(0, xpForLevel(level) - xpForLevel(natural));
        const prev = slice.skills[id];
        return {
          slice: { ...slice, skills: { ...slice.skills, [id]: { xp, rust: 0, lastPracticedDay: prev?.lastPracticedDay ?? selectNow(ctx.state).day } } },
          notes: [`${id} set to ${Math.max(level, natural).toFixed(1)}${level < natural ? ` (the natural baseline; ${level} asked)` : ''}`],
        };
      },
    },
    /** Dev sandbox (D-180): a form's E (0-120), kept with its sparring share. */
    devESet: {
      schema: z.object({ type: z.literal('devESet'), formId: z.string(), value: z.number().min(0).max(120) }),
      sources: ['dev'],
      handle: (slice, e, ctx) => {
        if (!selectIsTestCharacter(ctx.state)) return { reject: DEV_REFUSAL };
        const id = String(e['formId']);
        if (!FORM_IDS.includes(id)) return { reject: `${id} is not a lightsaber form` };
        const v = Number(e['value']);
        const prev = slice.E[id];
        return { slice: { ...slice, E: { ...slice.E, [id]: { E: v, eSpar: Math.min(prev?.eSpar ?? 0, v) } } }, notes: [`E ${id} = ${v}`] };
      },
    },
    /** Dev sandbox (D-180): an ability's CI (0-120), kept with its sparring share. */
    devCISet: {
      schema: z.object({ type: z.literal('devCISet'), abilityId: z.string(), value: z.number().min(0).max(120) }),
      sources: ['dev'],
      handle: (slice, e, ctx) => {
        if (!selectIsTestCharacter(ctx.state)) return { reject: DEV_REFUSAL };
        const id = String(e['abilityId']);
        if (!isSkillId(id)) return { reject: `unknown ability ${id}` };
        const v = Number(e['value']);
        const prev = slice.CI[id];
        return { slice: { ...slice, CI: { ...slice.CI, [id]: { CI: v, ciSpar: Math.min(prev?.ciSpar ?? 0, v) } } }, notes: [`CI ${id} = ${v}`] };
      },
    },
    activityResolved: {
      schema: z.object({
        type: z.literal('activityResolved'),
        activityId: z.string(),
        primaries: z.array(z.string()).min(1),
        hours: z.number().min(0),
        /** The session's hours per skill by its share of the session's XP (D-109). */
        windowHours: record,
        credited: record,
        practiceHours: record,
        /** Fundamentals transfer to forms started by this session (D-119): outside the pace window. */
        transfer: record.optional(),
        /** The Padawan specialty transfer (D-460): the main form up to 0.75 x Form I's XP, once; outside the pace window. */
        specialty: z.object({ form: z.string(), xp: z.number().min(0) }).optional(),
        /** Forms this session started by self-study (D-126). */
        selfTaughtStarted: z.array(z.string()).optional(),
        /** Self-taught forms this session trained with teaching (no longer self-taught). */
        taught: z.array(z.string()).optional(),
        fatigueWillpower: z.number().min(0),
        meditation: z.boolean(),
        day: z.object({ hoursByActivity: record, postWindow: z.number().min(0), lastPhysicalHeavy: z.boolean() }),
        /** Drill XP over the ceiling, banked (progression-numbers §7). */
        banked: record.optional(),
        /** Sparring for E (partner sparring, or a taught Order class, D-143 A): peer or stronger partner, and the cap (D-163). */
        sparring: z.enum(['sparPeer', 'sparStronger']).optional(),
        sparCap: z.number().min(0).max(120).optional(),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        // The drill ceiling was applied when the session was resolved (training.ts); the banked part arrives here.
        const credited = e['credited'] as Record<string, number>;
        const bank = { ...slice.bank };
        for (const [id, x] of Object.entries((e['banked'] as Record<string, number> | undefined) ?? {})) {
          if (SKILL_BY_ID.get(id)?.kind !== 'form') return { reject: `banked XP to ${id}: lightsaber forms only` };
          bank[id] = (bank[id] ?? 0) + x;
        }
        const practice = e['practiceHours'] as Record<string, number>;
        const hours = Number(e['hours']);
        const windowHours = e['windowHours'] as Record<string, number>;
        for (const id of [...Object.keys(credited), ...Object.keys(practice)]) if (!SKILL_BY_ID.has(id)) return { reject: `unknown skill ${id}` };

        let skills = { ...slice.skills };
        // D-119: the transfer lands first, once per form, and never enters the pace window.
        const transfer = (e['transfer'] as Record<string, number> | undefined) ?? {};
        const formsStarted = [...slice.formsStarted];
        for (const [id, x] of Object.entries(transfer)) {
          if (SKILL_BY_ID.get(id)?.kind !== 'form') return { reject: `transfer to ${id}: lightsaber forms only` };
          if (formsStarted.includes(id)) return { reject: `transfer to ${id}: already started` };
          const prev = skills[id] ?? { xp: 0, rust: 0, lastPracticedDay: null };
          skills[id] = { ...prev, xp: prev.xp + x };
          formsStarted.push(id);
        }
        for (const id of e['primaries'] as string[]) if (SKILL_BY_ID.get(id)?.kind === 'form' && !formsStarted.includes(id)) formsStarted.push(id);
        // D-460: the Padawan specialty transfer lands after the D-119 transfer, once in a life.
        const sp = e['specialty'] as { form: string; xp: number } | undefined;
        let specialtyTransfer = slice.specialtyTransfer ?? null;
        if (sp) {
          if (SKILL_BY_ID.get(sp.form)?.kind !== 'form') return { reject: `specialty transfer to ${sp.form}: lightsaber forms only` };
          if (specialtyTransfer) return { reject: 'specialty transfer: already done' };
          const prev = skills[sp.form] ?? { xp: 0, rust: 0, lastPracticedDay: null };
          skills[sp.form] = { ...prev, xp: prev.xp + sp.xp };
          specialtyTransfer = sp.form;
        }
        const cr = creditXp({ ...slice, skills }, ctx.state, credited, practice, windowHours, day);
        skills = cr.slice.skills;
        // Training the skills a lasting injury affects adapts it (progression-numbers §18): health owns adaptation.
        const emit = selectLasting(ctx.state).length ? [...cr.emit, { type: 'adaptationTrained', hours: practice }] : cr.emit;
        const notes = [...cr.notes];
        const spar = e['sparring'] as 'sparPeer' | 'sparStronger' | undefined;
        const E = spar ? gainForGroups(slice.E, e['primaries'] as string[], spar, e['sparCap'] as number | undefined) : slice.E;
        const { tierBeatsPending: beats, nextSeq: seq, paceWindow } = cr.slice;
        // Self-study (D-126): forms started without teaching are self-taught until a taught session.
        const taught = new Set((e['taught'] as string[] | undefined) ?? []);
        const selfTaught = [...new Set([...slice.selfTaught.filter((id) => !taught.has(id)), ...((e['selfTaughtStarted'] as string[] | undefined) ?? [])])];
        const d = e['day'] as { hoursByActivity: Record<string, number>; postWindow: number; lastPhysicalHeavy: boolean };
        const meditationHours = slice.today.meditationHours + (e['meditation'] === true ? hours : 0);
        const today = { ...d, meditationHours, trainingHours: slice.today.trainingHours + hours };
        let stateOfMind = slice.stateOfMind;
        if (meditationHours >= CENTERED_MEDITATION_HOURS && slice.today.meditationHours < CENTERED_MEDITATION_HOURS) {
          stateOfMind = setState(stateOfMind, { kind: 'centered', intensity: 1, sinceDay: day, untilDay: day + 1 }, day);
        }
        const willpowerToday = Math.min(FATIGUE_WILLPOWER.dailyCap, slice.willpowerToday + Number(e['fatigueWillpower']));
        return { slice: { ...slice, skills, tierBeatsPending: beats, nextSeq: seq, paceWindow, today, stateOfMind, willpowerToday, formsStarted, selfTaught, bank, E, ...(specialtyTransfer ? { specialtyTransfer } : {}) }, emit, notes };
      },
    },
    /**
     * A resolved fight (combat-xp §1-2, D-55): the combat branch of computeXp. Until duels (M5) only the
     * scripted lifetime fights emit it (stub STUB_SCRIPTED_COMBAT); M5's duel log will.
     */
    fightResolved: {
      schema: z.object({
        type: z.literal('fightResolved'),
        stakes: z.enum(COMBAT_STAKES),
        outcome: z.enum(COMBAT_OUTCOMES),
        exchanges: z.array(z.object({ skillId: z.string(), gap: z.number() })).max(2000),
        forceUses: z.array(z.object({ abilityId: z.string(), gap: z.number() })).max(500),
        /** The opponent's largest level advantage in the opposed skill (E: life-or-death vs 5+ stronger, combat-xp §3). */
        opponentGap: z.number().optional(),
        /** The player surrendered: the surrender XP factor (D-227). */
        surrendered: z.boolean().optional(),
        /** The strongest opponent's lightsaber form (D-427: learning by dueling a stronger opponent). */
        opponentForm: z.string().optional(),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        const session = e as unknown as CombatSession;
        const used = new Set([...session.exchanges.map((v) => v.skillId), ...session.forceUses.map((v) => v.abilityId)]);
        for (const x of used) if (!SKILL_BY_ID.has(x)) return { reject: `unknown skill ${x}` };
        // Real use in combat clears rust like practice (§13): one exchange is about 7.5 s; stats split get a quarter of it.
        // A fight is outside the per-hour 4.0x clamp and its window (D-457): per exchange, combat XP differs from the
        // Average's in the same fight only by M, capped at 2.8 under 4.0 (the accelerated path is allowed past, D-418);
        // its few seconds of exchanges as window hours would cap it near 0. The lifetime 4.0x floor still counts it.
        const practice: Record<string, number> = {};
        for (const ex of session.exchanges) practice[ex.skillId] = (practice[ex.skillId] ?? 0) + EXCHANGE_HOURS;
        for (const u of session.forceUses) practice[u.abilityId] = (practice[u.abilityId] ?? 0) + EXCHANGE_HOURS;
        const r = computeCombatXp({
          session,
          m: speedFor(ctx.state, 1),
          physicalWeights: combatPhysicalWeights,
          todayBeforeM: (k) => slice.combatXpToday[k] ?? 0,
          fightsToday: (k) => slice.fightsToday[k] ?? 0,
          clamp: (_k, wanted) => ({ credited: wanted, discarded: 0 }),
        });
        const fightsToday = { ...slice.fightsToday };
        for (const k of used) fightsToday[k] = (fightsToday[k] ?? 0) + 1;
        const combatXpToday = { ...slice.combatXpToday };
        for (const [k, v] of Object.entries(r.beforeM)) combatXpToday[k] = (combatXpToday[k] ?? 0) + v;
        // Sparring XP to a form is ceiling-limited like drill XP; real fights are not (D-45).
        const spar = session.stakes === 'spar';
        const ceiling = spar ? applyCeiling(slice, r.credited) : { credited: r.credited, bank: slice.bank, notes: [] as string[] };
        // Learning by dueling a stronger opponent (D-427): a serious or lethal fight against one 10+ levels stronger gives a
        // share of the fight's form XP to the opponent's form too, even an unknown one; x2 on the accelerated path.
        const learned = strongerDuelXp(session.stakes, Number(e['opponentGap'] ?? 0), typeof e['opponentForm'] === 'string' ? String(e['opponentForm']) : null, ceiling.credited, selectCharacter(ctx.state).trainingPath === 'accelerated');
        if (learned) ceiling.credited = { ...ceiling.credited, [learned.form]: (ceiling.credited[learned.form] ?? 0) + learned.xp };
        const cr = creditXp({ ...slice, bank: ceiling.bank }, ctx.state, ceiling.credited, practice, {}, day, false);
        const total = Object.values(ceiling.credited).reduce((a, b) => a + b, 0);
        // E for the form groups fought with, CI per Force ability use (combat-xp §3); a skirmish or higher opens a new
        // 60-day bank release (D-45).
        const forms = session.exchanges.map((x) => x.skillId);
        // A spar is with a peer or a stronger partner by the partner's level (opponentGap; a group already folded, D-163).
        const g = eGainFor(session.stakes, { opponentGap: Number(e['opponentGap'] ?? 0), ownLevel: forms[0] ? selectLevelExact(ctx.state, forms[0]) : 0 });
        const E = gainForGroups(slice.E, forms, g.source, g.cap);
        const CI = { ...slice.CI };
        for (const u of session.forceUses) CI[u.abilityId] = gainCI(CI[u.abilityId] ?? { CI: 0, ciSpar: 0 }, session.stakes);
        const bankReleaseUntil = spar ? slice.bankReleaseUntil : releaseUntil(day);
        const releaseNote = spar || bankReleaseUntil === null ? [] : [`bank release open until ${formatDate(bankReleaseUntil)}`];
        return {
          slice: { ...cr.slice, fightsToday, combatXpToday, E, CI, bankReleaseUntil },
          emit: cr.emit,
          // The surrender factor on the line (D-242; pass 3: the 0.5 of D-227 was applied but not shown).
          notes: [...(learned ? [`learned from a stronger opponent: +${learned.xp.toFixed(2)} XP to ${SKILL_BY_ID.get(learned.form)?.name ?? learned.form}`] : []), `combat XP ${total.toFixed(2)} (${session.stakes}, ${session.outcome}${session.surrendered ? `, surrendered x${COMBAT_XP.surrendered}` : ''})`, ...r.notes, ...ceiling.notes, ...cr.notes, ...releaseNote],
        };
      },
    },
    /** Reviewing a recording of one's own fight (progression-numbers §19): +5% XP to that skill for 3 days, once per 7. */
    recordingReviewed: {
      schema: z.object({ type: z.literal('recordingReviewed'), skillId: z.string() }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        const skillId = String(e['skillId']);
        if (!SKILL_BY_ID.has(skillId)) return { reject: `unknown skill ${skillId}` };
        if (slice.lastReviewDay !== null && day - slice.lastReviewDay < RECORDING_REVIEW.everyDays) return { reject: `a recording was reviewed on day ${slice.lastReviewDay}; once per ${RECORDING_REVIEW.everyDays} days` };
        const name = SKILL_BY_ID.get(skillId)!.name;
        return { slice: { ...slice, reviewBuff: { skillId, untilDay: day + RECORDING_REVIEW.days - 1 }, lastReviewDay: day }, notes: [`recording reviewed: +5% XP to ${name} for ${RECORDING_REVIEW.days} days`] };
      },
    },
    emotionalEvent: {
      schema: z.object({
        type: z.literal('emotionalEvent'),
        emotion: z.enum(EMOTIONS).describe('The emotion that takes hold of the player character'),
        intensity: z.number().int().min(1).max(3),
        cause: z.string().min(1).max(200),
      }),
      sources: ['ai'],
      narrative: () => true,
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        const intensity = Number(e['intensity']);
        const mapped = EMOTION_TO_STATE[String(e['emotion'])];
        if (!mapped) return { reject: `unknown emotion ${String(e['emotion'])}` };
        if (mapped === 'grief') {
          // Grief lingers alongside any state (D-46); a new loss renews it.
          const easesByDay = day + easeDays(intensity);
          const grief = slice.grief && slice.grief.easesByDay > easesByDay ? slice.grief : { intensity, sinceDay: day, easesByDay };
          return { slice: { ...slice, grief } };
        }
        const untilDay = mapped === 'centered' ? day + 1 : mapped === 'despair' ? day + easeDays(intensity) : day + PASSION_DAYS;
        const next: StateOfMindRecord = { kind: mapped, intensity, sinceDay: day, untilDay };
        // Calm ends fear, anger, hatred and pride (it is the event of calming down); despair eases on its own (D-108).
        const force = mapped === 'centered' && PASSIONS.includes(activeState(slice.stateOfMind, day));
        const stateOfMind = setState(slice.stateOfMind, next, day, force);
        const notes = stateOfMind === slice.stateOfMind ? [`${mapped} is weaker than the active ${activeState(slice.stateOfMind, day)}; not applied`] : [];
        return { slice: { ...slice, stateOfMind }, notes };
      },
    },
    /** Engine: a non-tier milestone beat (ranks.md §4 pace-for-age milestones): shown to the narrator like a tier beat. */
    milestoneBeatQueued: {
      schema: z.object({ type: z.literal('milestoneBeatQueued'), id: z.string(), label: z.string().max(200) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const id = String(e['id']);
        if (slice.tierBeatsPending.some((b) => b.id === id)) return { slice };
        return { slice: { ...slice, tierBeatsPending: [...slice.tierBeatsPending, { id, skillId: String(e['label']), tier: 0, day: selectNow(ctx.state).day }] } };
      },
    },
    milestoneBeatAcknowledged: {
      schema: z.object({ type: z.literal('milestoneBeatAcknowledged'), beatId: z.string().describe('The id of a pending milestone beat the scene acknowledged') }),
      sources: ['ai'],
      targetField: 'beatId',
      narrative: (s) => s.progression.tierBeatsPending.length > 0,
      handle: (slice, e) => {
        const id = String(e['beatId']);
        if (!slice.tierBeatsPending.some((b) => b.id === id)) return { reject: `no pending beat ${id}` };
        return { slice: { ...slice, tierBeatsPending: slice.tierBeatsPending.filter((b) => b.id !== id) } };
      },
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    // A rest of 30+ minutes ends the post-workout window (progression-numbers §3).
    let next = slice;
    if (step.occupation === 'rest' && step.seconds >= 1800 && (slice.today.postWindow > 0 || slice.today.lastPhysicalHeavy)) {
      next = { ...next, today: { ...next.today, postWindow: 0, lastPhysicalHeavy: false } };
    }
    if (!step.endsDay) return { slice: next };
    const newDay = fromAbsSecond(step.toAbs).day;
    const s = ctx.state;
    const notices: string[] = [];

    // Rust on trained skills unused past the grace period (§13).
    const skills = { ...next.skills };
    for (const [id, st] of Object.entries(skills)) {
      if (st.lastPracticedDay === null || st.xp <= 0) continue;
      const def = SKILL_BY_ID.get(id);
      if (!def) continue;
      const rust = rustAfterDay(st.rust, CATEGORY_RULES[def.category].rustRow, selectLevelExact(s, id), newDay - st.lastPracticedDay);
      if (rust !== st.rust) skills[id] = { ...st, rust };
    }

    // Overtraining streak (§10): a day ending above 1.0 counts; a rest day or a day ending below 0.6 resets.
    const f = selectMaxFraction(s);
    let streak = next.overtrainStreak;
    if (next.today.trainingHours <= 0 || f < OVERTRAINING.resetBelowF) streak = 0;
    else if (f > 1.0) streak += 1;
    if (streak > next.overtrainStreak) notices.push(`Overtrained day ${streak} in a row: capacity -${Math.min(50, streak * 10)}% tomorrow.`);

    // State of mind and grief easing; distracted from engine rules only (D-54).
    let stateOfMind = next.stateOfMind;
    if (stateOfMind.untilDay !== null && newDay > stateOfMind.untilDay) stateOfMind = { kind: 'neutral', intensity: 1, sinceDay: newDay, untilDay: null };
    const deadline = selectOpenThreads(s).some((t) => t.deadlineDay !== null && t.deadlineDay - newDay <= DISTRACTED.deadlineDays && t.deadlineDay >= newDay);
    if (deadline || streak >= DISTRACTED.streakDays) stateOfMind = setState(stateOfMind, { kind: 'distracted', intensity: 1, sinceDay: newDay, untilDay: newDay }, newDay);
    const grief = next.grief && newDay > next.grief.easesByDay ? null : next.grief;
    if (next.grief && !grief) notices.push('Grief has eased.');

    // Bank release (progression-numbers §7, D-45): while the window is open, 10% of each form's remaining bank per day,
    // up to the new ceiling; outside the 4.0x clamp and the pace window. After the window the bank is kept.
    const bank = { ...next.bank };
    if (next.bankReleaseUntil !== null && newDay <= next.bankReleaseUntil) {
      for (const [id, b] of Object.entries(bank)) {
        const st = skills[id];
        if (!st || b <= 0) continue;
        const r = releaseBank(st.xp, b, groupE(next, id));
        if (r <= 0) continue;
        skills[id] = { ...st, xp: st.xp + r };
        bank[id] = b - r;
      }
    }

    // The body past its prime (D-472): the loss grows with each day's decline, slowed by the last year's training.
    const bodyNow = selectBodyAgeNow(s);
    const ageing = bodyNow > PRIME_H || next.ageing ? ageingStep(selectAgeing(s), bodyNow, (stat) => (next.paceWindow[stat] ?? []).reduce((h, w) => h + w.hours, 0)) : null;

    return {
      slice: { ...next, ...(ageing ? { ageing } : {}), skills, bank, overtrainStreak: streak, stateOfMind, grief, willpowerToday: 0, today: EMPTY_TODAY, fightsToday: {}, combatXpToday: {} },
      ...(notices.length ? { notices } : {}),
    };
  },
  selectors: { skills: selectSkillViews, stateOfMind: selectStateOfMind, tierBeats: selectTierBeats, capacities: selectCapacities },
  promptSection: (s) => {
    const beats = selectTierBeats(s);
    if (!beats.length) return null;
    return `PENDING MILESTONE BEATS (acknowledge one in the scene with milestoneBeatAcknowledged): ${beats.map((b) => `${b.id} ${SKILL_BY_ID.get(b.skillId)?.name ?? b.skillId} reached ${b.tier}`).join('; ')}`;
  },
};
