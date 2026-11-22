// locations feature (architecture §2). New places enter only through locationIntroduced; the
// current location changes only through locationChanged (the single writer, D-46). D-84: the
// architecture's locationChanged{newLocation} is split into locationIntroduced (create, with an
// optional parentRef and moveHere) and locationChanged{locationRef}.
import { z } from 'zod';
import { LIMITS, LOCATION_KINDS } from '../../data/entities.config';
import { mintId, uniqueAliasMatch } from '../../engine/aliases';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectNow, selectTurnInPlay } from '../clock/selectors';
import { locationsSliceSchema, type Location, type LocationsSlice } from './locations';
import { resolveLocationRef, selectCurrentLocationId, selectLocations } from './selectors';

export const locationIntroducedSchema = z.object({
  type: z.literal('locationIntroduced'),
  key: z.string().optional().describe('Same-turn temp key like tmp:2'),
  name: z.string().min(1).max(LIMITS.name),
  kind: z.enum(LOCATION_KINDS),
  region: z.string().max(LIMITS.region).describe('Planet or sector, e.g. "Coruscant"'),
  parentRef: z.string().optional().describe('ID (or temp key) of the place this one is inside, e.g. the planet of a city'),
  description: z.string().max(LIMITS.description),
  moveHere: z.boolean().describe('True when the player character is now at this place'),
});

function moveTo(slice: LocationsSlice, id: string, day: number): LocationsSlice {
  const loc = slice.byId[id]!;
  const visited = loc.firstVisitDay === null ? { ...loc, firstVisitDay: day } : loc;
  return { byId: { ...slice.byId, [id]: visited }, currentId: id, currentSinceDay: day };
}

export const locationsFeature: FeatureModule<LocationsSlice, GameState> = {
  id: 'locations',
  version: 2,
  initialState: () => ({ byId: {}, currentId: null, currentSinceDay: null }),
  emptyState: () => ({ byId: {}, currentId: null, currentSinceDay: null }),
  // v2 (M4): the arrival day at the current place; unknown for older saves (staleness counts from the first visit).
  migrations: {
    2: (old) => {
      const o = old as { byId: Record<string, { firstVisitDay: number | null }>; currentId: string | null };
      return { ...o, currentSinceDay: o.currentId ? (o.byId[o.currentId]?.firstVisitDay ?? null) : null };
    },
  },
  stateSchema: locationsSliceSchema,
  refKind: 'loc',
  resolveRef: resolveLocationRef,
  events: {
    locationIntroduced: {
      schema: locationIntroducedSchema,
      // engine: a start option seeds its places (D-401 [2]).
      sources: ['ai', 'engine'],
      phase: 'create',
      refFields: ['parentRef'],
      refKinds: { parentRef: ['loc'] },
      narrative: () => true,
      handle: (slice, e, ctx) => {
        const name = String(e['name']).trim();
        const day = selectNow(ctx.state).day;
        const existing = uniqueAliasMatch(Object.values(slice.byId), (l) => [l.name, ...l.aliases], name);
        if (existing) {
          const next = e['moveHere'] === true ? moveTo(slice, existing.id, day) : slice;
          return { slice: next, mintedId: existing.id, notes: [`"${name}" matched existing ${existing.id} by exact alias; not created again`] };
        }
        const parent = typeof e['parentRef'] === 'string' ? e['parentRef'] : null;
        if (parent !== null && !slice.byId[parent]) return { reject: `unknown parent ${parent}` };
        const id = mintId('loc', name, (x) => x in slice.byId);
        const loc: Location = {
          id,
          name,
          aliases: [],
          kind: e['kind'] as Location['kind'],
          region: String(e['region']),
          parentId: parent,
          description: String(e['description']),
          firstVisitDay: null,
          introducedTurn: selectTurnInPlay(ctx.state),
        };
        const created: LocationsSlice = { ...slice, byId: { ...slice.byId, [id]: loc } };
        return { slice: e['moveHere'] === true ? moveTo(created, id, day) : created, mintedId: id };
      },
    },
    locationChanged: {
      schema: z.object({ type: z.literal('locationChanged'), locationRef: z.string().describe('ID of the place the player character moved to') }),
      sources: ['ai', 'dev'],
      targetField: 'locationRef',
      refFields: ['locationRef'],
      refKinds: { locationRef: ['loc'] },
      narrative: (s) => selectLocations(s).length > 0,
      handle: (slice, e, ctx) => {
        const id = String(e['locationRef']);
        if (!slice.byId[id]) return { reject: `unknown location ${id}` };
        if (slice.currentId === id) return { slice, notes: [`already at ${id}`] };
        return { slice: moveTo(slice, id, selectNow(ctx.state).day) };
      },
    },
    // A player creates a place from the review queue (name only; kind unknown until the story says).
    locationCreatedByPlayer: {
      schema: z.object({ type: z.literal('locationCreatedByPlayer'), name: z.string().min(1).max(LIMITS.name) }),
      sources: ['player'],
      phase: 'create',
      handle: (slice, e, ctx) => {
        const name = String(e['name']).trim();
        if (resolveLocationRef(ctx.state, name)) return { reject: `${name} already exists` };
        const id = mintId('loc', name, (x) => x in slice.byId);
        const loc: Location = { id, name, aliases: [], kind: 'other', region: '', parentId: null, description: '', firstVisitDay: null, introducedTurn: selectTurnInPlay(ctx.state) };
        return { slice: { ...slice, byId: { ...slice.byId, [id]: loc } }, mintedId: id };
      },
    },
    locationAliasAdded: {
      schema: z.object({ type: z.literal('locationAliasAdded'), locationRef: z.string(), alias: z.string().min(1).max(LIMITS.name) }),
      sources: ['player'],
      targetField: 'locationRef',
      refFields: ['locationRef'],
      refKinds: { locationRef: ['loc'] },
      handle: (slice, e, ctx) => {
        const id = String(e['locationRef']);
        const loc = slice.byId[id];
        if (!loc) return { reject: `unknown location ${id}` };
        const alias = String(e['alias']).trim();
        const owner = resolveLocationRef(ctx.state, alias);
        if (owner && owner !== id) return { reject: `"${alias}" already names ${owner}` };
        if (owner === id) return { slice };
        return { slice: { ...slice, byId: { ...slice.byId, [id]: { ...loc, aliases: [...loc.aliases, alias] } } } };
      },
    },
  },
  selectors: { all: selectLocations, currentId: selectCurrentLocationId },
};
