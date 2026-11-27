// Health slice (architecture §2 "health"; health.md). v2 (M5) adds Vitality, wounds, lasting injuries, dying, death
// and care to the M3 meters. Status, penalties and max Vitality are derived by selectors and never stored; Vitality is
// stored as the damage taken below the derived maximum (`vitalityLost`), so a higher Endurance raises it at once.
import { z } from 'zod';
import { AIDS, BODY_PARTS, HAZARD_TYPES, LASTING_KINDS, SEVERITIES } from '../../data/health.config';
import { AID_CONDITIONS, CARE_LEVELS, TOXINS, WOUND_CAUSES, WOUND_DEPTHS } from '../../data/medicine.config';

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
  /** The last day the injured part was trained (health §7; opt-2 E2). */
  trainedDay: z.number().int().optional(),
  // Medicine (D-511): all optional, so older saves load unchanged.
  cause: z.enum(WOUND_CAUSES).optional(),
  depth: z.enum(WOUND_DEPTHS).optional(),
  set: z.boolean().optional(),
  treated: z.boolean().optional(),
  infected: z.boolean().optional(),
  care: z.enum(CARE_LEVELS).optional(),
  operator: z.number().min(0).optional(),
  toxin: z.enum(TOXINS).optional(),
  fragments: z.boolean().optional(),
  operated: z.boolean().optional(),
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
  /** A minor lasting injury (the treatment roll, D-511): a share of the kind's penalties. */
  minor: z.boolean().optional(),
  /** A fitted aid's condition after hits (D-511): damaged or broken; absent = sound. */
  aidCondition: z.enum(AID_CONDITIONS).optional(),
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
  /**
   * A medical facility's care in force until untilAbs (x2 healing, D-150), with its operator's Medicine (D-511). Tanks and
   * Force healing apply per session; field care marks the wounds.
   */
  care: z.object({ kind: z.literal('medical'), untilAbs: z.number(), operator: z.number().min(0).optional() }).nullable(),
  /** Active pain suppression (health §8; opt-2 E1): the power, since when, minutes active (dark channeling's pressure for M6). */
  suppression: z.array(z.object({ abilityId: z.string(), sinceAbs: z.number(), minutes: z.number().min(0).optional() })),
  woundSeq: z.number().int().min(1),
  /** Deferred hazardOccurred (D-29): resolved at the start of the next turn's step b. */
  pendingHazards: z.array(z.object({ hazard: z.enum(HAZARD_TYPES), severity: z.number().int().min(1).max(3), cause: z.string().max(200) })),
  /** Scars healed wounds left (the treatment roll, D-511): cosmetic only. Absent on older saves. */
  scars: z.array(z.object({ part: z.enum(BODY_PARTS), day: z.number().int(), from: z.string().max(80) })).max(40).optional(),
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
  pendingHazards: [],
});

/** v1 -> v2 (M5): full Vitality, no wounds. */
export function migrateHealthV1(old: unknown): HealthSlice {
  const o = old as { meters: HealthSlice['meters']; sleepCarry: number };
  return { ...emptyHealth(), meters: o.meters, sleepCarry: o.sleepCarry };
}
