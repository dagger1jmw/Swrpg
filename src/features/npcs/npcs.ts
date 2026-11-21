import { z } from 'zod';
import { FACTIONS, LIMITS, NPC_ROLES, NPC_STATES, SPECIES } from '../../data/entities.config';
import { TALENT_LEVELS } from '../../data/progression.config';
import { TALENT_DOMAINS } from '../../data/skills';
import { lastingSchema, woundSchema } from '../health/selectors';

/** Generation inputs (npc-generation §4): stored, never the levels; levels are recomputed from the date. */
export const npcGenSchema = z.object({
  archetype: z.string(),
  path: z.enum(['jedi', 'sith', 'outsider', 'career']),
  talents: z.partialRecord(z.enum(TALENT_DOMAINS), z.enum(TALENT_LEVELS)),
  startAge: z.number().min(0),
  warYears: z.number().min(0),
  rank: z.string(),
  seed: z.string(),
  minionGrade: z.number().int().min(1).max(5).nullable(),
});
export type NpcGen = z.infer<typeof npcGenSchema>;

/** A named NPC's health: the same shape as the player's (health §9), status derived. */
export const npcHealthSchema = z.object({ vitalityLost: z.number().min(0), wounds: z.array(woundSchema), lasting: z.array(lastingSchema) });
export type NpcHealth = z.infer<typeof npcHealthSchema>;

export const npcSchema = z.object({
  id: z.string().regex(/^npc:/),
  name: z.string().min(1).max(LIMITS.name),
  aliases: z.array(z.string().max(LIMITS.name)),
  speciesId: z.enum(SPECIES),
  factionId: z.enum(FACTIONS),
  role: z.enum(NPC_ROLES),
  /** From ageApprox at introduction; null when unknown. Age is derived, never stored. */
  birthDay: z.number().int().nullable(),
  /** Lore canon ID (`lore:<slug>`), matched by exact alias in era (D-81). */
  canonId: z.string().nullable(),
  /** The only store of NPC death (D-46); deceased comes only from the engine (D-33). */
  status: z.enum(NPC_STATES),
  description: z.string().max(LIMITS.description),
  firstMetDay: z.number().int(),
  lastSeenDay: z.number().int(),
  lastLocationId: z.string().nullable(),
  /** Turn of introduction (for recency in retrieval). */
  introducedTurn: z.number().int().min(0),
  /** Generation inputs (M5), stored when the NPC first enters a scene or a fight; null until then. */
  gen: npcGenSchema.nullable(),
  health: npcHealthSchema.nullable(),
  /** Dev sandbox only (D-180): fixed levels that replace the generated ones (a test opponent at a set level). */
  devLevels: z.record(z.string(), z.number().min(0)).optional(),
  /**
   * The role whose rank and default age the NPC keeps after an era correction (D-320): a Sith acolyte made a Dark Jedi
   * keeps the acolyte's rank, so the correction never changes balance. Absent = the role itself.
   */
  rankRole: z.enum(NPC_ROLES).optional(),
});

export const npcsSliceSchema = z.object({ byId: z.record(z.string(), npcSchema) });

export type Npc = z.infer<typeof npcSchema>;
export type NpcsSlice = z.infer<typeof npcsSliceSchema>;

/** v1 -> v2 (M5): no generation inputs and no health yet (generated lazily). */
export function migrateNpcsV1(old: unknown): NpcsSlice {
  const o = old as { byId: Record<string, Omit<Npc, 'gen' | 'health'>> };
  return { byId: Object.fromEntries(Object.entries(o.byId).map(([id, n]) => [id, { ...n, gen: null, health: null }])) };
}
