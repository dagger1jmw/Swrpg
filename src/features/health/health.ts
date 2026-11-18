// Health slice (architecture §2 "health"; health.md). v2 (M5) adds Vitality, wounds, lasting injuries, dying, death
// and care to the M3 meters. Status, penalties and max Vitality are derived by selectors and never stored; Vitality is
// stored as the damage taken below the derived maximum (`vitalityLost`), so a higher Endurance raises it at once.
import { z } from 'zod';
import { AIDS, BODY_PARTS, LASTING_KINDS, SEVERITIES } from '../../data/health.config';

export const metersSchema = z.object({ p: z.number().min(0), m: z.number().min(0), f: z.number().min(0) });

export const woundSchema = z.object({
  id: z.string(),
  part: z.enum(BODY_PARTS),
  severity: z.enum(SEVERITIES),
  W: z.number().min(0),
  stabilized: z.boolean(),
  healProgress: z.number().min(0).max(1),
  day: z.number().int(),
  source: z.string().max(80),
  severed: z.boolean().optional(),
});

export const lastingSchema = z.object({
  id: z.string(),
  kind: z.enum(LASTING_KINDS),
  part: z.enum(BODY_PARTS),
  adaptation: z.number().min(0).max(1),
  aid: z.enum(AIDS),
  adaptedToday: z.number().min(0),
  adaptDay: z.number().int(),
  day: z.number().int(),
});

export const healthSliceSchema = z.object({
  /** Loads (load-hours); the fraction f = meter / capacity is derived. */
  meters: metersSchema,
  /** Fraction of the meters the last sleep carried over (0, 0.3 or 0.6). */
  sleepCarry: z.number().min(0).max(0.6),
  /** Vitality lost below the derived maximum (health §3). */
  vitalityLost: z.number().min(0),
  wounds: z.array(woundSchema),
  lasting: z.array(lastingSchema),
  /** An unstabilized mortal wound: the dying timer runs out at untilAbs (absolute seconds). */
  dying: z.object({ sinceAbs: z.number(), untilAbs: z.number() }).nullable(),
  /** Set once, by the engine (D-149): the dying timer ran out or a second mortal wound landed while Dying. */
  death: z.object({ atAbs: z.number(), cause: z.string().max(200) }).nullable(),
  /** Medical care in force until untilAbs (x2 healing, D-150). Bacta and Force healing apply per session. */
  care: z.object({ kind: z.literal('medical'), untilAbs: z.number() }).nullable(),
  /** Active pain suppression (M6 abilities). */
  suppression: z.array(z.object({ abilityId: z.string(), sinceAbs: z.number() })),
  woundSeq: z.number().int().min(1),
});

export type HealthSlice = z.infer<typeof healthSliceSchema>;

export const emptyHealth = (): HealthSlice => ({
  meters: { p: 0, m: 0, f: 0 },
  sleepCarry: 0,
  vitalityLost: 0,
  wounds: [],
  lasting: [],
  dying: null,
  death: null,
  care: null,
  suppression: [],
  woundSeq: 1,
});

/** v1 -> v2 (M5): full Vitality, no wounds. */
export function migrateHealthV1(old: unknown): HealthSlice {
  const o = old as { meters: HealthSlice['meters']; sleepCarry: number };
  return { ...emptyHealth(), meters: o.meters, sleepCarry: o.sleepCarry };
}
