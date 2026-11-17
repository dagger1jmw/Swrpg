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
  presentNpcRefs: z.array(z.string().max(80)).max(12).describe('IDs (or temp keys) of the non-player characters present at the end of this reply'),
});

export type Choice = z.infer<typeof choiceSchema>;
export type CompactIntent = z.infer<typeof compactIntentSchema>;

export interface NarrativeReply {
  narrative: string;
  choices: Choice[];
  scene: { moodTags: string[]; presentNpcRefs: string[] };
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

export interface NarrativeSchemas {
  /** Strict: sent to the model as the response JSON Schema (only this turn's legal events). */
  wire: ZodType;
  /** Parses the reply. Events stay loose objects here; applyEvents validates each one and drops
   * only the invalid ones (Zod, then engine), so one bad event never discards the whole reply. */
  parse: ZodType<NarrativeReply>;
}

const looseEventSchema = z.looseObject({ type: z.string() });

export function composeNarrativeSchema<S extends BaseState>(registry: Registry<S>, state: S, turn: NarrativeTurnInfo): NarrativeSchemas {
  const eventSchemas: ZodType[] = [];
  for (const f of registry) {
    for (const def of Object.values(f.events)) if (def.narrative?.(state, turn)) eventSchemas.push(def.schema);
  }
  const [first, second, ...rest] = eventSchemas;
  const eventSchema: ZodType | null = first === undefined ? null : second === undefined ? first : z.union([first, second, ...rest]);
  const base = {
    narrative: z.string().min(1),
    choices: z.array(choiceSchema).min(2).max(5),
    scene: sceneSchema,
  };
  return {
    // With no legal events the array must be empty.
    wire: z.object({ ...base, events: eventSchema ? z.array(eventSchema).max(20) : z.array(z.never()).max(0) }),
    // A reply without presentNpcRefs means nobody is tracked as present.
    parse: z.object({ ...base, scene: sceneSchema.extend({ presentNpcRefs: sceneSchema.shape.presentNpcRefs.default([]) }), events: z.array(looseEventSchema).max(20) }) as unknown as ZodType<NarrativeReply>,
  };
}
