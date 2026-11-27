// npcs feature (architecture §2, M2: identity only; generation inputs and health arrive in M5).
// New NPCs enter only through npcIntroduced (AI) or a player's review-queue resolution.
import { z } from 'zod';
import { STYLE_BY_ID } from '../../data/martialStyles';
import { COLD_STORE, FACTIONS, LIMITS, MAX_AGE_APPROX, NPC_AI_STATES, NPC_ROLES, SPECIES } from '../../data/entities.config';
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
import { selectCanonInCampaign } from '../world/selectors';
import { dateFromAbsDay, formatYear } from '../../engine/calendar';
import { CANON_BY_ID } from '../../data/canonNpcs';
import { cutShortBy } from '../../data/canon/apprenticeships';
import { canonOffBoard, canonStatusAt, prisonOf, type OffBoard } from '../../engine/canonRoster';
import { selectLocationChain } from '../locations/selectors';

/** How an off-board reason reads in a rejection (D-400). */
const OFF_BOARD_WORDS: Readonly<Record<OffBoard, string>> = { unborn: 'not yet born', dead: 'dead', unavailable: 'out of sight', imprisoned: 'imprisoned' };
import { inferSpecies, speciesFromWords } from '../../data/speciesWords';
import { factionFromWords, roleFromWords } from '../../data/entityWords';
import { roleForYear } from '../../data/npcGen.config';
import { migrateNpcsV1, npcHealthSchema, npcsSliceSchema, type Npc, type NpcHealth, type NpcsSlice } from './npcs';
import { resolveNpcRef, selectNpcAgeOrDefault, selectNpcGen, selectNpcLevels, selectNpcs } from './selectors';

export const npcIntroducedSchema = z.object({
  type: z.literal('npcIntroduced'),
  key: z.string().optional(),
  name: z.string().min(1).max(LIMITS.name),
  // Plain words the code resolves (m8-fixes A1, m8-ground proposal 1): an exact species name, then the D-239 word list; a word
  // the code cannot read keeps the NPC as "other" and goes to the review queue (about 650 characters less than the id list).
  species: z.string().max(40).optional(),
  // Faction and role as plain words too (opt-1 A1, D-529; the same pattern): an exact id or name, then a word list
  // (data/entityWords.ts); a word nobody can read is "unknown" / "other" and goes to the review queue. Field notes: contract.md.
  faction: z.string().max(40).optional(),
  role: z.string().max(40).optional(),
  ageApprox: z.number().int().min(0).max(MAX_AGE_APPROX).optional(),
  description: z.string().max(LIMITS.description),
});

const npcRefKinds = { npcRef: ['npc'] } as const;

/** A trait's tie to this person ends when they die (M8 item 16): emitted only when the character holds such a tie. */
function tieEndedFor(s: GameState, name: string): GameEvent[] {
  const held = (s as { traits?: { held: readonly { tieName?: string }[] } }).traits?.held ?? [];
  return held.some((h) => h.tieName?.toLowerCase() === name.toLowerCase()) ? [{ type: 'tieEnded', name }] : [];
}

/** A word the code could not read (opt-1 A1): what it was, and what the NPC was kept as meanwhile. */
export interface UnreadWord {
  kind: 'species' | 'role' | 'faction';
  word: string;
}

function introduce(slice: NpcsSlice, e: GameEvent, state: GameState): { slice: NpcsSlice; id: string; existing: boolean; note: string | null; unread: UnreadWord[] } {
  const name = String(e['name']).trim();
  const existing = uniqueAliasMatch(Object.values(slice.byId), (n) => [n.name, ...n.aliases], name);
  if (existing) return { slice, id: existing.id, existing: true, note: null, unread: [] };
  const today = selectNow(state).day;
  const year = dateFromAbsDay(today).year;
  // The species words (m8-fixes A1): an exact name or the word list; a word nobody can read is "other" until reviewed.
  const words = typeof e['species'] === 'string' ? e['species'] : '';
  const read = speciesFromWords(words, year);
  // The species from the name and description when the narrator left it out (D-239): the rules that hang on it
  // (Force immunity, the Vong archetype and capture rule) need it.
  const inferred = inferSpecies({ name, description: String(e['description'] ?? ''), given: read.species ?? 'other', year });
  const unread: UnreadWord[] = [];
  if (read.species === null && inferred.species === 'other' && words.trim()) unread.push({ kind: 'species', word: words.trim() });
  // Role and faction words (opt-1 A1): absent is "other" / "unknown" (no review); a word nobody can read is queued.
  const roleWords = typeof e['role'] === 'string' ? e['role'].trim() : '';
  const factionWords = typeof e['faction'] === 'string' ? e['faction'].trim() : '';
  const role = roleWords ? roleFromWords(roleWords) : 'other';
  const faction = factionWords ? factionFromWords(factionWords) : 'unknown';
  if (role === null) unread.push({ kind: 'role', word: roleWords });
  if (faction === null) unread.push({ kind: 'faction', word: factionWords });
  const id = mintId('npc', normalizeAlias(name), (x) => x in slice.byId);
  const age = e['ageApprox'];
  const npc: Npc = {
    id,
    name,
    aliases: [],
    speciesId: inferred.species as Npc['speciesId'],
    factionId: (faction ?? 'unknown') as Npc['factionId'],
    role: (role ?? 'other') as Npc['role'],
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
  return { slice: { ...slice, byId: { ...slice.byId, [id]: npc } }, id, existing: false, note: inferred.note, unread };
}

const update = (slice: NpcsSlice, id: string, patch: Partial<Npc>): NpcsSlice => ({ ...slice, byId: { ...slice.byId, [id]: { ...slice.byId[id]!, ...patch } } });

type TrainingChange = NonNullable<Npc['canonTraining']>;
/** A canon figure's training changes (D-506): on its NPC if it is in play, else kept for when it is. The first change stands. */
function changeTraining(slice: NpcsSlice, canonId: string, change: TrainingChange): { slice: NpcsSlice; note: string | null } {
  const npc = Object.values(slice.byId).find((n) => n.canonId === canonId);
  const name = npc?.name ?? CANON_BY_ID.get(canonId)?.name ?? canonId;
  if (npc) return npc.canonTraining ? { slice, note: null } : { slice: update(slice, npc.id, { canonTraining: change }), note: `${name}'s training changes (${change.reason}): off the canon line` };
  if (slice.canonTraining?.[canonId]) return { slice, note: null };
  return { slice: { ...slice, canonTraining: { ...slice.canonTraining, [canonId]: change } }, note: `${name}'s training changes (${change.reason}): off the canon line` };
}

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
      // dev: a dev sandbox opponent or partner (D-180). engine: a trait's tie or a formative quiz's person (M8 item 16).
      sources: ['ai', 'dev', 'engine'],
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
        // An unread species, role or faction word goes to the review queue (Jared: queued, never refused; opt-1 A1 for role and
        // faction); the NPC is "other" / "unknown" meanwhile.
        if (r.unread.length) {
          const kept: Record<UnreadWord['kind'], string> = { species: 'other', role: 'other', faction: 'unknown' };
          for (const u of r.unread) notes.push(`"${String(e['name'])}": ${u.kind} "${u.word}" not recognised; kept as ${kept[u.kind]} and queued for review`);
          return { slice: r.slice, mintedId: r.id, notes, emit: r.unread.map((u) => ({ type: 'reviewQueued', name: u.word.slice(0, 80), context: `${u.kind} of ${String(e['name']).slice(0, 80)} (npcIntroduced)`, kind: u.kind, npcId: r.id })) };
        }
        return { slice: r.slice, mintedId: r.id, ...(notes.length ? { notes } : {}) };
      },
    },
    // Engine: what the player said of a person (a formative quiz's note; m8-fixes G4): relation, homeworld, the note in words.
    npcBackgroundSet: {
      schema: z.object({ type: z.literal('npcBackgroundSet'), npcRef: z.string(), relation: z.string().max(60).optional(), homeworld: z.string().max(60).optional(), playerNote: z.string().max(200).optional() }),
      sources: ['engine'],
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown NPC ${id}` };
        const patch: Partial<Npc> = {};
        for (const k of ['relation', 'homeworld', 'playerNote'] as const) if (typeof e[k] === 'string' && e[k]) patch[k] = String(e[k]);
        return { slice: update(slice, id, patch) };
      },
    },
    // A player settles an NPC's species from the review queue (m8-fixes A1).
    npcSpeciesSet: {
      schema: z.object({ type: z.literal('npcSpeciesSet'), npcRef: z.string(), species: z.enum(SPECIES) }),
      sources: ['player'],
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      targetField: 'npcRef',
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown NPC ${id}` };
        return { slice: update(slice, id, { speciesId: e['species'] as Npc['speciesId'] }) };
      },
    },
    // A player settles an NPC's role or faction from the review queue (opt-1 A1).
    npcRoleSet: {
      schema: z.object({ type: z.literal('npcRoleSet'), npcRef: z.string(), role: z.enum(NPC_ROLES) }),
      sources: ['player'],
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      targetField: 'npcRef',
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown NPC ${id}` };
        return { slice: update(slice, id, { role: e['role'] as Npc['role'] }) };
      },
    },
    npcFactionSet: {
      schema: z.object({ type: z.literal('npcFactionSet'), npcRef: z.string(), faction: z.enum(FACTIONS) }),
      sources: ['player'],
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      targetField: 'npcRef',
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        if (!slice.byId[id]) return { reject: `unknown NPC ${id}` };
        return { slice: update(slice, id, { factionId: e['faction'] as Npc['factionId'] }) };
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
        const onRecord = CANON_BY_ID.get(String(e['canonId']));
        const canon = onRecord ? selectCanonInCampaign(ctx.state, onRecord) : undefined;
        const bby = -dateFromAbsDay(selectNow(ctx.state).day).year;
        const off = canon ? canonOffBoard(canon, bby) : null;
        // An imprisoned figure links when the scene is at their prison, as a prisoner (D-401 [5]).
        if (canon && off === 'imprisoned') {
          const prison = prisonOf(canon.canonId, bby);
          const here = selectLocationChain(ctx.state, selectCurrentLocationId(ctx.state)).flatMap((l) => [l.name, ...l.aliases, l.region ?? '']);
          const atPrison = prison ? here.some((n) => ` ${n.toLowerCase()} `.includes(` ${prison.place.toLowerCase()} `)) : false;
          if (atPrison) return { slice: update(slice, id, { canonId: canon.canonId, status: 'imprisoned' }), notes: [`${id} is canon ${canon.canonId}, a prisoner at ${prison!.place}`] };
        }
        const why = canon ? canonStatusAt(canon, bby) : null;
        if (canon && off) return { reject: `${canon.name} is ${OFF_BOARD_WORDS[off]} in ${formatYear(-bby)}${why ? ` (lore: ${why.note})` : ''}: not linked to canon` };
        // A training change recorded before the figure came into play goes with it (D-506).
        const waiting = slice.canonTraining?.[String(e['canonId'])];
        return { slice: update(slice, id, { canonId: String(e['canonId']), ...(waiting && !slice.byId[id]!.canonTraining ? { canonTraining: waiting } : {}) }), notes: [`${id} is canon ${String(e['canonId'])}`] };
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
    /**
     * A melee style an NPC holds and can teach (m8-skills, D-513): the player names a teacher's art (a Royal Guard's military
     * Echani, a Follower's Teräs Käsi), or the engine sets one. Proficiency 0-1; 0 removes it.
     */
    npcStyleSet: {
      schema: z.object({ type: z.literal('npcStyleSet'), npcRef: z.string(), styleId: z.string(), p: z.number().min(0).max(1) }),
      sources: ['player', 'engine', 'dev'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        const styleId = String(e['styleId']);
        const style = STYLE_BY_ID.get(styleId);
        if (!style) return { reject: `unknown style ${styleId}` };
        const p = Number(e['p']);
        const { [styleId]: _old, ...others } = npc.styles ?? {};
        const styles = p > 0 ? { ...others, [styleId]: p } : others;
        return { slice: update(slice, id, { styles }), notes: [`${npc.name}: ${style.name} ${Math.round(p * 100)}%`] };
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
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (npc.status === 'deceased') return { slice };
        // A canon figure killed in the campaign diverges from its canon spans (D-419).
        const day = selectNow(ctx.state).day;
        const diverged = npc.canonId && !npc.canonDiverged ? { canonDiverged: { day, reason: 'killed' as const, recordedBy: 'engine' as const } } : {};
        let next = update(slice, id, { status: 'deceased', ...diverged });
        const notes = [`${npc.name} dies (${String(e['cause'])})`];
        // A master killed before or during an apprenticeship changes the student's training (D-506).
        if (npc.canonId) {
          for (const x of cutShortBy(npc.canonId, -dateFromAbsDay(day).year)) {
            const r = changeTraining(next, x.student, { day, reason: 'masterKilled', recordedBy: 'engine' });
            next = r.slice;
            if (r.note) notes.push(r.note);
          }
        }
        const ties = tieEndedFor(ctx.state, npc.name);
        return { slice: next, notes, ...(ties.length ? { emit: ties } : {}) };
      },
    },
    /**
     * A canon figure the campaign has diverged from (Jared, D-419): captured, turned (changed sides) or removed from their
     * post. The engine records a capture; the narrator reports a turn or a removal it has told. From this day the figure
     * keeps no later canon promotions and the lore's later whereabouts stop applying. One-way: the first divergence stands.
     */
    npcCanonDiverged: {
      schema: z.object({
        type: z.literal('npcCanonDiverged'),
        npcRef: z.string(),
        reason: z.enum(['captured', 'turned', 'removed']),
      }),
      sources: ['ai', 'engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      // A canon figure in the scene (D-520): their fate diverges where the story has them.
      narrative: (s) => s.pacing.scene.presentNpcIds.some((id) => s.npcs.byId[id]?.canonId != null),
      part: 'people',
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (!npc.canonId) return { reject: `${id} is not a canon figure: nothing to diverge from` };
        const recordedBy = ctx.source === 'ai' ? ('narrator' as const) : ('engine' as const);
        // The first divergence stands, but the engine's own record replaces a narrator's report (its day stays).
        if (npc.canonDiverged) {
          if (recordedBy !== 'engine' || npc.canonDiverged.recordedBy === 'engine' || npc.canonDiverged.reason === 'killed') return { slice };
          return { slice: update(slice, id, { canonDiverged: { day: npc.canonDiverged.day, reason: e['reason'] as 'captured' | 'turned' | 'removed', recordedBy } }) };
        }
        const reason = e['reason'] as 'captured' | 'turned' | 'removed';
        return { slice: update(slice, id, { canonDiverged: { day: selectNow(ctx.state).day, reason, recordedBy } }), notes: [`${npc.name} leaves the canon course (${reason}): no later canon promotions`] };
      },
    },
    /**
     * A recorded change to a canon figure's training (Jared, D-506): the apprenticeship broken, or another order joined. The
     * narrator reports one it has told; a master's death is the engine's own (npcDied). Off the canon line from this day.
     */
    npcTrainingChanged: {
      schema: z.object({
        type: z.literal('npcTrainingChanged'),
        npcRef: z.string(),
        reason: z.enum(['apprenticeshipBroken', 'joinedOrder']),
      }),
      sources: ['ai', 'engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      // A canon figure in the scene (D-520): their fate diverges where the story has them.
      narrative: (s) => s.pacing.scene.presentNpcIds.some((id) => s.npcs.byId[id]?.canonId != null),
      part: 'people',
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const npc = slice.byId[id];
        if (!npc) return { reject: `unknown npc ${id}` };
        if (!npc.canonId) return { reject: `${id} is not a canon figure: no canon training to change` };
        const r = changeTraining(slice, npc.canonId, { day: selectNow(ctx.state).day, reason: e['reason'] as 'apprenticeshipBroken' | 'joinedOrder', recordedBy: ctx.source === 'ai' ? 'narrator' : 'engine' });
        return { slice: r.slice, ...(r.note ? { notes: [r.note] } : {}) };
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
    const day = Math.floor(step.toAbs / 86_400);
    let changed = false;
    let cold = slice.cold;
    const byId: Record<string, Npc> = {};
    for (const [id, n] of Object.entries(slice.byId)) {
      // The cold store (opt-2 H2): a dead NPC unseen for a year keeps no health in the hot list.
      if (n.health && n.status === 'deceased' && day - n.lastSeenDay >= COLD_STORE.afterDays) {
        changed = true;
        cold = { ...(cold ?? {}), [id]: n.health };
        byId[id] = { ...n, health: null };
        continue;
      }
      if (!n.health || n.status === 'deceased' || (n.health.vitalityLost === 0 && n.health.wounds.length === 0)) {
        byId[id] = n;
        continue;
      }
      changed = true;
      const wounds = (n.health.wounds as Wound[]).map((w) => (w.severity === 'mortal' && !w.stabilized ? w : progressHealing(w, 1, 1))).filter((w) => !isHealed(w));
      byId[id] = { ...n, health: { ...n.health, vitalityLost: 0, wounds } };
    }
    // The rest of the slice stays (opt-2: this returned { byId } alone and dropped canonTraining whenever an NPC healed).
    return changed ? { slice: { ...slice, byId, ...(cold ? { cold } : {}) } } : { slice };
  },
  selectors: { all: selectNpcs },
};
