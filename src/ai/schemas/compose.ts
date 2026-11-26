// Per-turn narrative response schema (architecture §3, D-15): composed from the registry,
// including only the events legal in the current state. Event schemas live in their features
// (D-12); this file only composes them.
import { z, type ZodType } from 'zod';
import { ACTION_TYPES } from '../../data/checks.config';
import type { BlockadeAction } from '../../data/blockades';
import type { EscapeStep } from '../../data/holds';
import { PACING_LEVELS } from '../../data/pacing.config';
import type { BaseState, EventDef, GameEvent, NarrativeTurnInfo, Registry } from '../../state/types';
import { activeParts } from './parts';

export const compactIntentSchema = z.object({
  actionType: z.enum(ACTION_TYPES),
  targetRef: z.string().max(80).optional(),
  skillId: z.string().max(60).optional(),
});

export const choiceSchema = z.object({
  // Gemini strips maxLength (D-68), so the parse limit is generous; one long label must not fail
  // the whole reply (D-92, live 2026-11-17: a 100+ character label did).
  label: z.string().min(1).max(200).describe('Under 80 characters'),
  intent: compactIntentSchema,
  pacingHint: z.enum(PACING_LEVELS).optional(),
  spanDays: z.number().int().min(1).max(3680).optional().describe('Days, for montage or timeSkip'),
});

export const sceneSchema = z.object({
  moodTags: z.array(z.string().max(30)).max(5),
  presentNpcRefs: z.array(z.string().max(80)).max(12).describe('NPCs present at the end'),
});

/** `blockade`, `escape` and `escapePlan` are set only by the engine's own choices (D-469, D-471, D-496); the AI's schema does not have them. */
export type CompactIntent = z.infer<typeof compactIntentSchema> & { blockade?: BlockadeAction; escape?: boolean; escapePlan?: EscapeStep[] };
export type Choice = Omit<z.infer<typeof choiceSchema>, 'intent'> & { intent: CompactIntent };

export interface NarrativeReply {
  narrative: string;
  choices: Choice[];
  scene: { moodTags: string[]; presentNpcRefs: string[] };
  events: GameEvent[];
}

/** An event is sent this turn when it is legal (its own test, D-15) and its part applies (D-520). */
function sent<S extends BaseState>(def: EventDef<unknown, S>, state: S, turn: NarrativeTurnInfo, parts: ReadonlySet<string>): boolean {
  return def.narrative !== undefined && parts.has(def.part ?? 'core') && def.narrative(state, turn);
}

/** The event's wire schema this turn: its situational fields only when their part applies (D-520). */
function wireOf<S extends BaseState>(def: EventDef<unknown, S>, parts: ReadonlySet<string>): ZodType {
  const drop = Object.entries(def.partFields ?? {}).filter(([, part]) => !(typeof part === 'string' ? [part] : part).some((x) => parts.has(x))).map(([field]) => field);
  if (!drop.length) return def.schema;
  return (def.schema as unknown as z.ZodObject).omit(Object.fromEntries(drop.map((f) => [f, true])) as never);
}

/** The event types legal this turn, in registry order. */
export function narrativeEventTypes<S extends BaseState>(registry: Registry<S>, state: S, turn: NarrativeTurnInfo): string[] {
  const parts = activeParts(state, turn);
  const types: string[] = [];
  for (const f of registry) {
    for (const [type, def] of Object.entries(f.events)) if (sent(def as EventDef<unknown, S>, state, turn, parts)) types.push(type);
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
  const parts = activeParts(state, turn);
  const eventSchemas: ZodType[] = [];
  for (const f of registry) {
    for (const def of Object.values(f.events)) if (sent(def as EventDef<unknown, S>, state, turn, parts)) eventSchemas.push(wireOf(def as EventDef<unknown, S>, parts));
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
    // No maxItems on the events array (D-90): with M2's event union, maxItems 20 made Gemini refuse
    // the schema ("too many states for serving", live 2026-11-17). The parse schema keeps the limit.
    wire: z.object({ ...base, events: eventSchema ? z.array(eventSchema) : z.array(z.never()).max(0) }),
    // A reply without presentNpcRefs means nobody is tracked as present.
    parse: z.object({ ...base, scene: sceneSchema.extend({ presentNpcRefs: sceneSchema.shape.presentNpcRefs.default([]) }), events: z.array(looseEventSchema).max(20) }) as unknown as ZodType<NarrativeReply>,
  };
}
