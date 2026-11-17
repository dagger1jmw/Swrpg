// Choice fast path (D-14 as amended by D-58): a clicked choice's compact intent is expanded by
// the engine and validated, so the turn makes no intent call.
import type { Choice } from '../ai/schemas/compose';
import { intentSchema, type Intent } from '../ai/schemas/intent';

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
      notes.push(`choice targetRef ${targetRef} is not a valid ID; dropped`);
    }
  }
  const intent = intentSchema.parse({
    actionType,
    targets,
    references: [],
    unknownNames,
    ...(skillId !== undefined && skillId.trim() ? { skillId } : {}),
    ...(choice.pacingHint !== undefined ? { requestedPacing: choice.pacingHint } : {}),
  });
  return { intent, notes };
}
