// Progression feature (architecture §12; progression-numbers §2-17). Owns XP, rust, the pace window,
// the state of mind, grief, the overtraining streak, today's training state and pending tier beats.
// XP enters only through activityResolved (engine, from computeXp); the AI proposes emotionalEvent
// and milestoneBeatAcknowledged and never sets a number.
import { z } from 'zod';
import { DISTRACTED, OVERTRAINING, PACE_WINDOW_DAYS, PASSION_DAYS, STATE_STRENGTH, CENTERED_MEDITATION_HOURS, EMOTION_TO_STATE, FATIGUE_WILLPOWER, type StateOfMind } from '../../data/progression.config';
import { SKILL_BY_ID, CATEGORY_RULES } from '../../data/skills';
import { fromAbsSecond } from '../../engine/calendar';
import { levelWithNatural, thresholdsCrossed, tierOf } from '../../engine/curve';
import { removeRust, rustAfterDay } from '../../engine/rust';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { selectMaxFraction } from '../health/selectors';
import { selectOpenThreads } from '../threads/selectors';
import { EMPTY_TODAY, activeState, easeDays, emptyProgression, progressionSliceSchema, type ProgressionSlice, type StateOfMindRecord } from './progression';
import { selectCapacities, selectLevelExact, selectNatural, selectSkillViews, selectStateOfMind, selectTierBeats } from './selectors';

const EMOTIONS = ['grief', 'fear', 'anger', 'hatred', 'calm', 'pride', 'despair'] as const;
const record = z.record(z.string(), z.number().min(0));

/** A state replaces the active one when the active one has ended or is not stronger (strongest wins, §17). */
function setState(cur: StateOfMindRecord, next: StateOfMindRecord, day: number, force = false): StateOfMindRecord {
  const active = activeState(cur, day);
  if (force || active === 'neutral' || STATE_STRENGTH[next.kind] >= STATE_STRENGTH[active]) return next;
  return cur;
}

const PASSIONS: readonly StateOfMind[] = ['fear', 'anger', 'hatred', 'pride'];

export const progressionFeature: FeatureModule<ProgressionSlice, GameState> = {
  id: 'progression',
  version: 1,
  initialState: (ctx) => emptyProgression(ctx.start.day, ctx.startingXp ?? {}),
  // Saves from M1/M2: no training (natural baselines only).
  emptyState: (raw) => {
    const clock = raw['clock'] as { now?: { day?: unknown } } | undefined;
    const day = typeof clock?.now?.day === 'number' ? clock.now.day : 0;
    return emptyProgression(day);
  },
  stateSchema: progressionSliceSchema,
  events: {
    /** One resolved training session (computeXp result); the only way XP enters. */
    activityResolved: {
      schema: z.object({
        type: z.literal('activityResolved'),
        activityId: z.string(),
        primaries: z.array(z.string()).min(1),
        hours: z.number().min(0),
        credited: record,
        practiceHours: record,
        fatigueWillpower: z.number().min(0),
        meditation: z.boolean(),
        day: z.object({ hoursByActivity: record, postWindow: z.number().min(0), lastPhysicalHeavy: z.boolean() }),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        const credited = e['credited'] as Record<string, number>;
        const practice = e['practiceHours'] as Record<string, number>;
        const primaries = e['primaries'] as string[];
        const hours = Number(e['hours']);
        for (const id of [...Object.keys(credited), ...Object.keys(practice)]) if (!SKILL_BY_ID.has(id)) return { reject: `unknown skill ${id}` };

        const skills = { ...slice.skills };
        const beats = [...slice.tierBeatsPending];
        let seq = slice.nextSeq;
        const emit: GameEvent[] = [];
        const notes: string[] = [];
        for (const [id, xp] of Object.entries(credited)) {
          if (xp <= 0) continue;
          const prev = skills[id] ?? { xp: 0, rust: 0, lastPracticedDay: null };
          const natural = selectNatural(ctx.state, id);
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
        for (const [id, h] of Object.entries(practice)) {
          const prev = skills[id] ?? { xp: 0, rust: 0, lastPracticedDay: null };
          skills[id] = { ...prev, rust: removeRust(prev.rust, h), lastPracticedDay: day };
        }
        // Pace window (D-48, D-104): today's credited XP per skill; training hours go to the primaries.
        const paceWindow = { ...slice.paceWindow };
        const touch = new Set([...Object.keys(credited), ...primaries]);
        for (const id of touch) {
          const entries = (paceWindow[id] ?? []).filter((w) => w.day > day - PACE_WINDOW_DAYS);
          const last = entries[entries.length - 1];
          const addXp = credited[id] ?? 0;
          const addHours = primaries.includes(id) ? hours / primaries.length : 0;
          if (last && last.day === day) entries[entries.length - 1] = { day, xp: last.xp + addXp, hours: last.hours + addHours };
          else entries.push({ day, xp: addXp, hours: addHours });
          paceWindow[id] = entries;
        }
        const d = e['day'] as { hoursByActivity: Record<string, number>; postWindow: number; lastPhysicalHeavy: boolean };
        const meditationHours = slice.today.meditationHours + (e['meditation'] === true ? hours : 0);
        const today = { ...d, meditationHours, trainingHours: slice.today.trainingHours + hours };
        let stateOfMind = slice.stateOfMind;
        if (meditationHours >= CENTERED_MEDITATION_HOURS && slice.today.meditationHours < CENTERED_MEDITATION_HOURS) {
          stateOfMind = setState(stateOfMind, { kind: 'centered', intensity: 1, sinceDay: day, untilDay: day + 1 }, day);
        }
        const willpowerToday = Math.min(FATIGUE_WILLPOWER.dailyCap, slice.willpowerToday + Number(e['fatigueWillpower']));
        return { slice: { ...slice, skills, tierBeatsPending: beats, nextSeq: seq, paceWindow, today, stateOfMind, willpowerToday }, emit, notes };
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
        // Calm ends fear, anger, hatred and pride (it is the event of calming down); despair eases on its own (D-107).
        const force = mapped === 'centered' && PASSIONS.includes(activeState(slice.stateOfMind, day));
        const stateOfMind = setState(slice.stateOfMind, next, day, force);
        const notes = stateOfMind === slice.stateOfMind ? [`${mapped} is weaker than the active ${activeState(slice.stateOfMind, day)}; not applied`] : [];
        return { slice: { ...slice, stateOfMind }, notes };
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

    return {
      slice: { ...next, skills, overtrainStreak: streak, stateOfMind, grief, willpowerToday: 0, today: EMPTY_TODAY },
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
