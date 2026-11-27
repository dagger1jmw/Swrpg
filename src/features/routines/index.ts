// Routines feature (architecture §2 "routines", §10 slot 1; training-routines.md). The player sets the
// routine, saves templates and accepts or dismisses the AI's suggestion; the AI's routineRequested is
// only a suggestion and never applies by itself (D-129). The day loop (src/state/advanceRoutine.ts)
// runs the scheduler's plan each day; routineDayPlanned carries the fill rounding forward.
import { z } from 'zod';
import { LIMITS } from '../../data/entities.config';
import { isActivityId } from '../../data/activities';
import { isSkillId } from '../../data/skills';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { EFFORTS, PRIORITY_WEIGHTS, emptyRoutines, routineSchema, routinesSliceSchema, type Routine, type RoutinesSlice } from './routines';
import { selectActiveRoutine, selectRoutineSuggestion, selectRoutineTemplates } from './selectors';

/** Rejects a routine that names unknown skills or activities (no nearby fallback, D-07). */
function checkRoutine(r: Routine): string | null {
  for (const p of r.priorities ?? []) {
    if (!isSkillId(p.skillId)) return `unknown skill ${p.skillId}`;
    if (p.activityId !== undefined && !isActivityId(p.activityId)) return `unknown activity ${p.activityId}`;
  }
  for (const b of r.lockedBlocks) {
    if (!isActivityId(b.activityId)) return `unknown activity ${b.activityId}`;
    if (b.skillId !== undefined && !isSkillId(b.skillId)) return `unknown skill ${b.skillId}`;
    if (b.startSecond + b.hours * 3600 > 86_400) return 'a locked block must end by midnight';
  }
  return null;
}

const WEIGHT_NAMES = ['focus', 'regular', 'light'] as const;

export const routinesFeature: FeatureModule<RoutinesSlice, GameState> = {
  id: 'routines',
  version: 1,
  initialState: () => emptyRoutines(),
  // Saves from before M4: the default routine.
  emptyState: () => emptyRoutines(),
  stateSchema: routinesSliceSchema,
  events: {
    routineSet: {
      schema: z.object({ type: z.literal('routineSet'), routine: routineSchema }),
      sources: ['player', 'engine'],
      handle: (slice, e) => {
        const routine = routineSchema.parse(e['routine']);
        const bad = checkRoutine(routine);
        if (bad) return { reject: bad };
        return { slice: { ...slice, active: routine } };
      },
    },
    routineTemplateSaved: {
      schema: z.object({ type: z.literal('routineTemplateSaved'), name: z.string().min(1).max(60) }),
      sources: ['player'],
      handle: (slice, e) => {
        const name = String(e['name']).trim();
        const existing = slice.templates.find((t) => t.name === name);
        const templates = existing
          ? slice.templates.map((t) => (t.name === name ? { ...t, routine: slice.active } : t))
          : [...slice.templates, { id: `routine:${slice.nextSeq}`, name, routine: slice.active }];
        if (templates.length > 30) return { reject: 'at most 30 templates' };
        return { slice: { ...slice, templates, nextSeq: existing ? slice.nextSeq : slice.nextSeq + 1 } };
      },
    },
    routineTemplateLoaded: {
      schema: z.object({ type: z.literal('routineTemplateLoaded'), templateId: z.string() }),
      sources: ['player'],
      handle: (slice, e) => {
        const t = slice.templates.find((x) => x.id === e['templateId']);
        if (!t) return { reject: `unknown template ${String(e['templateId'])}` };
        return { slice: { ...slice, active: t.routine } };
      },
    },
    routineTemplateDeleted: {
      schema: z.object({ type: z.literal('routineTemplateDeleted'), templateId: z.string() }),
      sources: ['player'],
      handle: (slice, e) => {
        if (!slice.templates.some((x) => x.id === e['templateId'])) return { reject: `unknown template ${String(e['templateId'])}` };
        return { slice: { ...slice, templates: slice.templates.filter((x) => x.id !== e['templateId']) } };
      },
    },
    // The AI may suggest a routine for future time (architecture §3); the player decides (D-129).
    routineRequested: {
      schema: z.object({
        type: z.literal('routineRequested'),
        priorities: z
          .array(z.object({ skillId: z.string(), weight: z.enum(WEIGHT_NAMES) }))
          .min(1)
          .max(8),
        effort: z.enum(EFFORTS),
        spanHint: z.string().max(LIMITS.reason),
      }),
      sources: ['ai'],
      narrative: (s) => s.routines.suggested === null,
      part: 'training',
      handle: (slice, e, ctx) => {
        const prios = e['priorities'] as { skillId: string; weight: (typeof WEIGHT_NAMES)[number] }[];
        for (const p of prios) if (!isSkillId(p.skillId)) return { reject: `unknown skill ${p.skillId}` };
        const suggested = {
          priorities: prios.map((p) => ({ skillId: p.skillId, weight: PRIORITY_WEIGHTS[p.weight] })),
          effort: e['effort'] as Routine['effort'],
          spanHint: String(e['spanHint']),
          day: selectNow(ctx.state).day,
        };
        return { slice: { ...slice, suggested }, notes: ['routine suggestion stored for the player (applies only if accepted)'] };
      },
    },
    routineSuggestionResolved: {
      schema: z.object({ type: z.literal('routineSuggestionResolved'), accept: z.boolean() }),
      sources: ['player'],
      handle: (slice, e) => {
        if (!slice.suggested) return { reject: 'no routine suggestion' };
        if (!e['accept']) return { slice: { ...slice, suggested: null } };
        return { slice: { ...slice, active: { ...slice.active, priorities: slice.suggested.priorities, effort: slice.suggested.effort }, suggested: null } };
      },
    },
    /** The day loop planned a day: the fill rounding carried forward (scheduler, training-routines §3). */
    routineDayPlanned: {
      schema: z.object({ type: z.literal('routineDayPlanned'), fillCredit: z.record(z.string(), z.number()) }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice: { ...slice, fillCredit: { ...(e['fillCredit'] as Record<string, number>) } } }),
    },
  },
  selectors: { active: selectActiveRoutine, templates: selectRoutineTemplates, suggestion: selectRoutineSuggestion },
  promptSection: (s) => (s.routines.suggested ? 'A routine suggestion is waiting for the player; do not send another routineRequested.' : null),
};
