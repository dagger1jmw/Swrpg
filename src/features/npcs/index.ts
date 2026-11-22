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
import { FORM_IDS } from '../../data/skills';
import { ARCHETYPE_BY_ID } from '../../data/archetypes';
import { DEV_REFUSAL, selectIsTestCharacter } from '../character/selectors';
import { selectNow, selectTurnInPlay } from '../clock/selectors';
import { selectCurrentLocationId } from '../locations/selectors';
import { dateFromAbsDay, formatYear } from '../../engine/calendar';
import { CANON_BY_ID } from '../../data/canonNpcs';
import { canonOffBoard, prisonOf, type OffBoard } from '../../engine/canonRoster';
import { selectLocationChain } from '../locations/selectors';

/** How an off-board reason reads in a rejection (D-400). */
const OFF_BOARD_WORDS: Readonly<Record<OffBoard, string>> = { unborn: 'not yet born', dead: 'dead', unavailable: 'out of sight', imprisoned: 'imprisoned' };
import { inferSpecies } from '../../data/speciesWords';
import { roleForYear } from '../../data/npcGen.config';
import { migrateNpcsV1, npcHealthSchema, npcsSliceSchema, type Npc, type NpcHealth, type NpcsSlice } from './npcs';
import { resolveNpcRef, selectNpcAgeOrDefault, selectNpcGen, selectNpcLevels, selectNpcs } from './selectors';

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

function introduce(slice: NpcsSlice, e: GameEvent, state: GameState): { slice: NpcsSlice; id: string; existing: boolean; note: string | null } {
  const name = String(e['name']).trim();
  const existing = uniqueAliasMatch(Object.values(slice.byId), (n) => [n.name, ...n.aliases], name);
  if (existing) return { slice, id: existing.id, existing: true, note: null };
  const today = selectNow(state).day;
  // The species from the name and description when the narrator left it out (D-239): the rules that hang on it
  // (Force immunity, the Vong archetype and capture rule) need it.
  const inferred = inferSpecies({ name, description: String(e['description'] ?? ''), given: String(e['species']), year: dateFromAbsDay(today).year });
  const id = mintId('npc', normalizeAlias(name), (x) => x in slice.byId);
  const age = e['ageApprox'];
  const npc: Npc = {
    id,
    name,
    aliases: [],
    speciesId: inferred.species as Npc['speciesId'],
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
  return { slice: { byId: { ...slice.byId, [id]: npc } }, id, existing: false, note: inferred.note };
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
      // dev: a dev sandbox opponent or partner (D-180).
      sources: ['ai', 'dev'],
      phase: 'create',
      narrative: () => true,
      handle: (slice, e, ctx) => {
        // A fight's minions are mass, not people (pass 4 issue 15: four "Mandalorian warrior N" introduced as NPCs in the
        // surrender narration). The narrator may not make one a named NPC; the fight's group is the record.
        if (ctx.source === 'ai') {
          const name = String(e['name']).trim().toLowerCase();
          const duels = [ctx.state.combat.active?.duel, (ctx.state.combat.last as { duel?: unknown } | null)?.duel] as ({ opponents?: { name: string; minion: boolean }[] } | undefined)[];
          if (duels.some((d) => d?.opponents?.some((o) => o.minion && o.name.toLowerCase() === name))) return { reject: `"${String(e['name'])}" is a minion of the fight, not a person: not introduced as an NPC` };
        }
        const r = introduce(slice, e, ctx.state);
        const notes = r.existing ? [`"${String(e['name'])}" matched existing ${r.id} by exact alias; not created again`] : r.note ? [r.note] : [];
        return { slice: r.slice, mintedId: r.id, ...(notes.length ? { notes } : {}) };
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
    // Engine: a generic NPC's dark-side role corrected for the era (D-320), after the canon check found no canon match
    // (named canon Sith keep their role). The NPC keeps the original role's rank (rankRole), so balance does not change.
    npcRoleEraCorrected: {
      schema: z.object({ type: z.literal('npcRoleEraCorrected'), npcRef: z.string() }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (npc.canonId) return { reject: `${id} is canon ${npc.canonId}: a canon figure keeps its role` };
        const r = roleForYear(npc.role, dateFromAbsDay(selectNow(ctx.state).day).year);
        if (!r.note) return { reject: `${id}: ${npc.role} exists in this era` };
        return { slice: update(slice, id, { role: r.role as Npc['role'], rankRole: npc.rankRole ?? npc.role }), notes: [`${npc.name}: ${r.note}`] };
      },
    },
    // Engine: canon link found by exact alias in era (D-81), applied by the pipeline after creation.
    npcCanonLinked: {
      schema: z.object({ type: z.literal('npcCanonLinked'), npcRef: z.string(), canonId: z.string().regex(/^lore:/) }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown npc ${id}` };
        // Only a figure the lore puts on the board at this date is linked (D-400): not one dead, unborn, imprisoned or
        // out of sight then. The NPC stays as an ordinary story NPC.
        const canon = CANON_BY_ID.get(String(e['canonId']));
        const bby = -dateFromAbsDay(selectNow(ctx.state).day).year;
        const off = canon ? canonOffBoard(canon, bby) : null;
        // An imprisoned figure links when the scene is at their prison, as a prisoner (D-401 [5]).
        if (canon && off === 'imprisoned') {
          const prison = prisonOf(canon.canonId, bby);
          const here = selectLocationChain(ctx.state, selectCurrentLocationId(ctx.state)).flatMap((l) => [l.name, ...l.aliases, l.region ?? '']);
          const atPrison = prison ? here.some((n) => ` ${n.toLowerCase()} `.includes(` ${prison.place.toLowerCase()} `)) : false;
          if (atPrison) return { slice: update(slice, id, { canonId: canon.canonId, status: 'imprisoned' }), notes: [`${id} is canon ${canon.canonId}, a prisoner at ${prison!.place}`] };
        }
        if (canon && off) return { reject: `${canon.name} is ${OFF_BOARD_WORDS[off]} in ${formatYear(-bby)}${canon.status3661 && bby === 3661 ? ` (lore: ${canon.status3661.note})` : ''}: not linked to canon` };
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
    /** Dev only (D-241): /archetype sets an NPC's generation archetype (the captor and fate rules read it at a fight's end). */
    devNpcArchetypeSet: {
      schema: z.object({ type: z.literal('devNpcArchetypeSet'), npcRef: z.string(), archetype: z.string().min(1) }),
      sources: ['dev'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        if (!selectIsTestCharacter(ctx.state)) return { reject: DEV_REFUSAL };
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        const archetype = String(e['archetype']);
        if (!ARCHETYPE_BY_ID.has(archetype)) return { reject: `unknown archetype ${archetype} (${[...ARCHETYPE_BY_ID.keys()].join(', ')})` };
        const gen = selectNpcGen(ctx.state, id)!;
        return { slice: update(slice, id, { gen: { ...gen, archetype } }), notes: [`${npc.name}: archetype ${gen.archetype} -> ${archetype} (the fight's fighter keeps its levels and weapon)`] };
      },
    },
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
    /**
     * Dev sandbox (D-180), test campaigns only: a named NPC fights at a set level. The generated profile is scaled so
     * its best lightsaber form sits at the level (the shape of the profile kept, like a canon sheet's scaling).
     */
    devNpcLevelsSet: {
      schema: z.object({ type: z.literal('devNpcLevelsSet'), npcRef: z.string(), level: z.number().min(1).max(120) }),
      sources: ['dev'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        if (!selectIsTestCharacter(ctx.state)) return { reject: DEV_REFUSAL };
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        const { devLevels: _old, ...plain } = npc;
        const generated = selectNpcLevels({ ...ctx.state, npcs: { byId: { ...slice.byId, [id]: plain } } }, id);
        const best = Math.max(0, ...FORM_IDS.map((f) => generated[f] ?? 0));
        if (best <= 0) return { reject: `${npc.name} has no lightsaber form to scale` };
        const ratio = Number(e['level']) / best;
        const devLevels = Object.fromEntries(Object.entries(generated).map(([k, v]) => [k, Math.min(120, Math.round(v * ratio * 10) / 10)]));
        return { slice: update(slice, id, { devLevels }), notes: [`${npc.name}: levels set for a best form of ${String(e['level'])} (x${ratio.toFixed(2)})`] };
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
