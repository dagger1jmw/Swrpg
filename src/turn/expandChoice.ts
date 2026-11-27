// Choice fast path (D-14 as amended by D-58): a clicked choice's compact intent is expanded by
// the engine and validated, so the turn makes no intent call.
import type { Choice } from '../ai/schemas/compose';
import { intentSchema, type Intent } from '../ai/schemas/intent';
import { DEFAULT_ACTIVITY } from '../data/activities';
import { isSkillId } from '../data/skills';
import { skillFromWords } from '../data/entityWords';

/** A train / study choice runs its skill's default activity for 1 hour (M3 plan). */
export const DEFAULT_TRAINING_HOURS = 1;

/** Resolves a ref to a stable ID (own ID or exact alias), or null. */
export type RefResolver = (ref: string) => string | null;

export function expandChoice(choice: Choice, resolve: RefResolver): { intent: Intent; notes: string[] } {
  const notes: string[] = [];
  const { actionType, targetRef, skillId } = choice.intent;
  const targets: string[] = [];
  const unknownNames: string[] = [];
  if (targetRef !== undefined && targetRef.trim()) {
    const id = resolve(targetRef);
    if (id !== null) targets.push(id);
    else {
      unknownNames.push(targetRef);
      // A blockade choice names its world (the engine's own choice, D-469); it need not be a known place yet.
      if (choice.intent.blockade === undefined) notes.push(`choice targetRef ${targetRef} is not a valid ID; dropped`);
    }
  }
  // The skill in words or as an id (opt-1 B2): the id when it names one; otherwise the word as written (an unknown skill, as before).
  const raw = skillId !== undefined && skillId.trim() ? skillId.trim() : undefined;
  const skill = raw !== undefined ? (skillFromWords(raw) ?? raw) : undefined;
  let activity: { activityId: string } | undefined;
  if ((actionType === 'train' || actionType === 'study') && skill !== undefined) {
    const activityId = isSkillId(skill) ? DEFAULT_ACTIVITY[skill] : undefined;
    if (activityId) activity = { activityId };
    else notes.push(`choice skillId ${skill} is not a valid skill; no activity`);
  }
  // A forward jump (montage / time skip, M4): its span in days; the routine runs, so no single activity.
  const jump = choice.pacingHint === 'montage' || choice.pacingHint === 'timeSkip';
  const intent = intentSchema.parse({
    actionType,
    targets,
    references: [],
    unknownNames,
    ...(skill !== undefined ? { skillId: skill } : {}),
    ...(choice.intent.escape !== undefined ? { escape: choice.intent.escape } : {}),
    ...(choice.intent.escapePlan !== undefined ? { escapePlan: choice.intent.escapePlan } : {}),
    ...(choice.intent.blockade !== undefined ? { blockade: choice.intent.blockade } : {}),
    ...(choice.pacingHint !== undefined ? { requestedPacing: choice.pacingHint } : {}),
    ...(jump && choice.spanDays !== undefined ? { requestedSpan: { amount: choice.spanDays, unit: 'days' } } : {}),
    ...(activity && !jump ? { activity, requestedSpan: { amount: DEFAULT_TRAINING_HOURS, unit: 'hours' } } : {}),
  });
  return { intent, notes };
}
