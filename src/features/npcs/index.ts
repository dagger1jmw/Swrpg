// npcs feature (architecture §2, M2: identity only; generation inputs and health arrive in M5).
// New NPCs enter only through npcIntroduced (AI) or a player's review-queue resolution.
import { z } from 'zod';
import { FACTIONS, LIMITS, MAX_AGE_APPROX, NPC_AI_STATES, NPC_ROLES, SPECIES } from '../../data/entities.config';
import { mintId, normalizeAlias, uniqueAliasMatch } from '../../engine/aliases';
import { DAYS_PER_YEAR } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectNow } from '../clock/selectors';
import { selectCurrentLocationId } from '../locations/selectors';
import { npcsSliceSchema, type Npc, type NpcsSlice } from './npcs';
import { resolveNpcRef, selectNpcs } from './selectors';

export const npcIntroducedSchema = z.object({
  type: z.literal('npcIntroduced'),
  key: z.string().optional().describe('Same-turn temp key like tmp:1, so later events in this reply can refer to this NPC'),
  name: z.string().min(1).max(LIMITS.name).describe('The name the character is known by, with any title (e.g. "Master Orren Vash")'),
  species: z.enum(SPECIES),
  faction: z.enum(FACTIONS),
  role: z.enum(NPC_ROLES),
  ageApprox: z.number().int().min(0).max(MAX_AGE_APPROX).optional().describe('Approximate age in standard years'),
  description: z.string().max(LIMITS.description).describe('Appearance and manner in one or two sentences'),
});

const npcRefKinds = { npcRef: ['npc'] } as const;

function introduce(slice: NpcsSlice, e: GameEvent, state: GameState): { slice: NpcsSlice; id: string; existing: boolean } {
  const name = String(e['name']).trim();
  const existing = uniqueAliasMatch(Object.values(slice.byId), (n) => [n.name, ...n.aliases], name);
  if (existing) return { slice, id: existing.id, existing: true };
  const today = selectNow(state).day;
  const id = mintId('npc', normalizeAlias(name), (x) => x in slice.byId);
  const age = e['ageApprox'];
  const npc: Npc = {
    id,
    name,
    aliases: [],
    speciesId: e['species'] as Npc['speciesId'],
    factionId: e['faction'] as Npc['factionId'],
    role: e['role'] as Npc['role'],
    birthDay: typeof age === 'number' ? today - Math.round(age * DAYS_PER_YEAR) : null,
    canonId: null,
    status: 'active',
    description: String(e['description'] ?? ''),
    firstMetDay: today,
    lastSeenDay: today,
    lastLocationId: selectCurrentLocationId(state),
    introducedTurn: state.meta.turn,
  };
  return { slice: { byId: { ...slice.byId, [id]: npc } }, id, existing: false };
}

const update = (slice: NpcsSlice, id: string, patch: Partial<Npc>): NpcsSlice => ({ byId: { ...slice.byId, [id]: { ...slice.byId[id]!, ...patch } } });

export const npcsFeature: FeatureModule<NpcsSlice, GameState> = {
  id: 'npcs',
  version: 1,
  initialState: () => ({ byId: {} }),
  emptyState: () => ({ byId: {} }),
  stateSchema: npcsSliceSchema,
  refKind: 'npc',
  resolveRef: resolveNpcRef,
  events: {
    npcIntroduced: {
      schema: npcIntroducedSchema,
      sources: ['ai'],
      phase: 'create',
      narrative: () => true,
      handle: (slice, e, ctx) => {
        const r = introduce(slice, e, ctx.state);
        return { slice: r.slice, mintedId: r.id, ...(r.existing ? { notes: [`"${String(e['name'])}" matched existing ${r.id} by exact alias; not created again`] } : {}) };
      },
    },
    // A player creates an NPC from the review queue (name only; the rest unknown until the story says).
    npcCreatedByPlayer: {
      schema: z.object({ type: z.literal('npcCreatedByPlayer'), name: z.string().min(1).max(LIMITS.name) }),
      sources: ['player'],
      phase: 'create',
      handle: (slice, e, ctx) => {
        const r = introduce(slice, { ...e, species: 'unknown', faction: 'unknown', role: 'other', description: '' }, ctx.state);
        if (r.existing) return { reject: `${String(e['name'])} already exists as ${r.id}` };
        return { slice: r.slice, mintedId: r.id };
      },
    },
    npcStatusChanged: {
      schema: z.object({
        type: z.literal('npcStatusChanged'),
        npcRef: z.string(),
        state: z.enum(NPC_AI_STATES),
        reason: z.string().max(LIMITS.reason).optional(),
      }),
      sources: ['ai'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      narrative: (s) => selectNpcs(s).length > 0,
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (npc.status === 'deceased') return { reject: `${id} is deceased; that is one-way` };
        return { slice: update(slice, id, { status: e['state'] as Npc['status'] }) };
      },
    },
    // Engine: canon link found by exact alias in era (D-81), applied by the pipeline after creation.
    npcCanonLinked: {
      schema: z.object({ type: z.literal('npcCanonLinked'), npcRef: z.string(), canonId: z.string().regex(/^lore:/) }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown npc ${id}` };
        return { slice: update(slice, id, { canonId: String(e['canonId']) }), notes: [`${id} is canon ${String(e['canonId'])}`] };
      },
    },
    // Engine: emitted by the scene update for everyone present.
    npcsSeen: {
      schema: z.object({ type: z.literal('npcsSeen'), npcIds: z.array(z.string()) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        const loc = selectCurrentLocationId(ctx.state);
        let next = slice;
        for (const id of e['npcIds'] as string[]) if (next.byId[id]) next = update(next, id, { lastSeenDay: day, lastLocationId: loc });
        return { slice: next };
      },
    },
    // Player: resolves a review-queue name to an existing NPC.
    npcAliasAdded: {
      schema: z.object({ type: z.literal('npcAliasAdded'), npcRef: z.string(), alias: z.string().min(1).max(LIMITS.name) }),
      sources: ['player'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        const alias = String(e['alias']).trim();
        const owner = resolveNpcRef(ctx.state, alias);
        if (owner && owner !== id) return { reject: `"${alias}" already names ${owner}` };
        if (owner === id) return { slice };
        return { slice: update(slice, id, { aliases: [...npc.aliases, alias] }) };
      },
    },
  },
  selectors: { all: selectNpcs },
};
