// Per-turn narrative response schema (architecture §3, D-15): composed from the registry,
// including only the events legal in the current state. Event schemas live in their features
// (D-12); this file only composes them.
import { z, type ZodType } from 'zod';
import { ACTION_TYPES } from '../../data/checks.config';
import { M1_PACING_LEVELS } from '../../data/pacing.config';
import type { BaseState, GameEvent, NarrativeTurnInfo, Registry } from '../../state/types';

export const compactIntentSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  targetRef: z.string().max(80).optional(),
  skillId: z.string().max(60).optional(),
});

export const choiceSchema = z.object({
  label: z.string().min(1).max(100),
  intent: compactIntentSchema,
  pacingHint: z.enum(M1_PACING_LEVELS).optional(),
});

export const sceneSchema = z.object({
  moodTags: z.array(z.string().max(30)).max(5),
});

export type Choice = z.infer<typeof choiceSchema>;
export type CompactIntent = z.infer<typeof compactIntentSchema>;

export interface NarrativeReply {
  narrative: string;
  choices: Choice[];
  scene: { moodTags: string[] };
  events: GameEvent[];
}

/** The event types legal this turn, in registry order. */
export function narrativeEventTypes<S extends BaseState>(registry: Registry<S>, state: S, turn: NarrativeTurnInfo): string[] {
  const types: string[] = [];
  for (const f of registry) {
    for (const [type, def] of Object.entries(f.events)) if (def.narrative?.(state, turn)) types.push(type);
  }
  return types;
}

export function composeNarrativeSchema<S extends BaseState>(registry: Registry<S>, state: S, turn: NarrativeTurnInfo): ZodType<NarrativeReply> {
  const eventSchemas: ZodType[] = [];
  for (const f of registry) {
    for (const def of Object.values(f.events)) if (def.narrative?.(state, turn)) eventSchemas.push(def.schema);
  }
  const [first, second, ...rest] = eventSchemas;
  const eventSchema: ZodType | null = first === undefined ? null : second === undefined ? first : z.union([first, second, ...rest]);
  return z.object({
    narrative: z.string().min(1),
    choices: z.array(choiceSchema).min(2).max(5),
    scene: sceneSchema,
    // With no legal events the array must be empty.
    events: eventSchema ? z.array(eventSchema).max(20) : z.array(z.never()).max(0),
  }) as unknown as ZodType<NarrativeReply>;
}
