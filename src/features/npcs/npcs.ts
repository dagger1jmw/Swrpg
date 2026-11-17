import { z } from 'zod';
import { FACTIONS, LIMITS, NPC_ROLES, NPC_STATES, SPECIES } from '../../data/entities.config';

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
  status: z.enum(NPC_STATES),
  description: z.string().max(LIMITS.description),
  firstMetDay: z.number().int(),
  lastSeenDay: z.number().int(),
  lastLocationId: z.string().nullable(),
  /** Turn of introduction (for recency in retrieval). */
  introducedTurn: z.number().int().min(0),
});

export const npcsSliceSchema = z.object({ byId: z.record(z.string(), npcSchema) });

export type Npc = z.infer<typeof npcSchema>;
export type NpcsSlice = z.infer<typeof npcsSliceSchema>;
