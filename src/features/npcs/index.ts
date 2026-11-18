// npcs feature (architecture §2, M2: identity only; generation inputs and health arrive in M5).
// New NPCs enter only through npcIntroduced (AI) or a player's review-queue resolution.
import { z } from 'zod';
import { FACTIONS, LIMITS, MAX_AGE_APPROX, NPC_AI_STATES, NPC_ROLES, SPECIES } from '../../data/entities.config';
import { mintId, normalizeAlias, uniqueAliasMatch } from '../../engine/aliases';
import { DAYS_PER_YEAR } from '../../engine/calendar';
import { isHealed, progressHealing } from '../../engine/healing';
import type { Wound } from '../../engine/wounds';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectNow, selectTurnInPlay } from '../clock/selectors';
import { selectCurrentLocationId } from '../locations/selectors';
import { migrateNpcsV1, npcHealthSchema, npcsSliceSchema, type Npc, type NpcHealth, type NpcsSlice } from './npcs';
import { resolveNpcRef, selectNpcAgeOrDefault, selectNpcGen, selectNpcs } from './selectors';

export const npcIntroducedSchema = z.object({
  type: z.literal('npcIntroduced'),
  key: z.string().optional().describe('Same-turn temp key like tmp:1, so later events in this reply can refer to this NPC'),
  name: z.string().min(1).max(LIMITS.name).describe('The name the character is known by, with any title'),
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
    introducedTurn: selectTurnInPlay(state),
    gen: null,
    health: null,
  };
  return { slice: { byId: { ...slice.byId, [id]: npc } }, id, existing: false };
}

const update = (slice: NpcsSlice, id: string, patch: Partial<Npc>): NpcsSlice => ({ byId: { ...slice.byId, [id]: { ...slice.byId[id]!, ...patch } } });

export const npcsFeature: FeatureModule<NpcsSlice, GameState> = {
  id: 'npcs',
  version: 2,
  migrations: { 2: migrateNpcsV1 },
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
    /**
     * Engine: generation inputs stored when the NPC first enters a scene or a fight (npc-generation §4). An unknown birth
     * day is fixed from the role's default age (D-151) so the NPC ages from here on.
     */
    npcGenerated: {
      schema: z.object({ type: z.literal('npcGenerated'), npcRef: z.string() }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (npc.gen) return { slice };
        const gen = selectNpcGen(ctx.state, id)!;
        const birthDay = npc.birthDay ?? Math.round(selectNow(ctx.state).day - selectNpcAgeOrDefault(ctx.state, id) * DAYS_PER_YEAR);
        return { slice: update(slice, id, { gen, birthDay }), notes: [`${npc.name}: generated (${gen.archetype}, ${gen.rank})`] };
      },
    },
    /** Engine: a duel segment's result for a named NPC (health §9: the same model as the player). */
    npcHealthSynced: {
      schema: z.object({ type: z.literal('npcHealthSynced'), npcRef: z.string(), health: npcHealthSchema }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown npc ${id}` };
        return { slice: update(slice, id, { health: e['health'] as NpcHealth }) };
      },
    },
    /**
     * Engine only (D-33, D-46): an NPC dies from the health model (a resolved fight or hazard), the player's choice at
     * incapacitation, or a code-run timeline event. One-way.
     */
    npcDied: {
      schema: z.object({ type: z.literal('npcDied'), npcRef: z.string(), cause: z.string().max(200) }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (npc.status === 'deceased') return { slice };
        return { slice: update(slice, id, { status: 'deceased' }), notes: [`${npc.name} dies (${String(e['cause'])})`] };
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
  // Named NPCs heal day by day at rest (health §7), and recover their Vitality overnight.
  onTimeAdvanced: (slice, step) => {
    if (!step.endsDay) return { slice };
    let changed = false;
    const byId: Record<string, Npc> = {};
    for (const [id, n] of Object.entries(slice.byId)) {
      if (!n.health || n.status === 'deceased' || (n.health.vitalityLost === 0 && n.health.wounds.length === 0)) {
        byId[id] = n;
        continue;
      }
      changed = true;
      const wounds = (n.health.wounds as Wound[]).map((w) => (w.severity === 'mortal' && !w.stabilized ? w : progressHealing(w, 1, 1))).filter((w) => !isHealed(w));
      byId[id] = { ...n, health: { ...n.health, vitalityLost: 0, wounds } };
    }
    return changed ? { slice: { byId } } : { slice };
  },
  selectors: { all: selectNpcs },
};
