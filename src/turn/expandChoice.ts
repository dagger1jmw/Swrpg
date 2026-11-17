// Choice fast path (D-14 as amended by D-58): a clicked choice's compact intent is expanded by
// the engine and validated, so the turn makes no intent call.
import type { Choice } from '../ai/schemas/compose';
import { intentSchema, type Intent } from '../ai/schemas/intent';

export function expandChoice(choice: Choice, validIds: ReadonlySet<string>): { intent: Intent; notes: string[] } {
  const notes: string[] = [];
  const { actionType, targetRef, skillId } = choice.intent;
  const targets: string[] = [];
  const unknownNames: string[] = [];
  if (targetRef !== undefined) {
    if (validIds.has(targetRef)) targets.push(targetRef);
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
    ...(skillId !== undefined ? { skillId } : {}),
    ...(choice.pacingHint !== undefined ? { requestedPacing: choice.pacingHint } : {}),
  });
  return { intent, notes };
}
