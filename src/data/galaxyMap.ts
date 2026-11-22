// The galaxy map for the Old Republic era (lore batch 22, D-402, D-404). The world and route lists are generated from
// the planets files (galaxyMap.generated.ts); this module holds the curated rulings: which worlds are closed at a date,
// and to whom (D-402 [5]–[8]). Years are BBY as positive numbers. Control "not on record" stays blank (D-402 [14]).
// Travel numbers live in travel.config.ts (approved with changes, D-405; the blockade narrowed in D-406).
import { MENTION_ONLY, OFF_MAP, PLANETS, ROUTES_ATTESTED, ROUTES_UNATTESTED } from './galaxyMap.generated';

export interface MapNode {
  name: string;
  region: string;
  grid: string;
  sector?: string;
}

/** A control statement on record for a year (BBY): the latest keyframe at or before a date is the last word on record. */
export interface ControlKeyframe {
  bby: number;
  text: string;
}

/** The latest control statement on record at or before `bby` (BBY), or null. */
export function controlOnRecordAt(keyframes: readonly ControlKeyframe[], bby: number): ControlKeyframe | null {
  return keyframes.filter((k) => k.bby >= bby).sort((a, b) => a.bby - b.bby)[0] ?? null;
}

export interface GeneratedPlanet extends MapNode {
  system?: string;
  routes: readonly string[];
  /** Control on record, as dated keyframes from the planets file (3,661, and a 3,653 change); empty when not on record. */
  control: readonly ControlKeyframe[];
  /** The file's role code (REP-CORE, IMP-HELD, FRONT LINE, GATED, ...). */
  role: string;
  gated: boolean;
  /** The file's field 6 gating note. */
  gating?: string;
  full: boolean;
}

export interface GeneratedRoute {
  name: string;
  endpoints: string;
  /** Control on record, as dated keyframes (3,661 where the file states it). */
  control: readonly ControlKeyframe[];
  founded?: string;
  attested: boolean;
  /** The Hydian Way's southern stretch, blockaded 3,661-3,660 (D-402 [16]). */
  blockade: boolean;
}

export { MENTION_ONLY, OFF_MAP, PLANETS, ROUTES_ATTESTED, ROUTES_UNATTESTED };

/** A character's side for what they know of the map. */
export type MapSide = 'republic' | 'sithEmpire' | 'other';

export interface WorldGate {
  place: string;
  /** Closed in the years from `fromBby` down to (but not including) `opensBby`; null = not opened in this era. */
  fromBby: number;
  opensBby: number | null;
  /** Who it is closed to. */
  closedTo: 'all' | 'republic' | 'sithEmpire';
  /** A short reason for the narrator. */
  reason: string;
  /** Who may still go there with a story reason. */
  storyException?: string;
  source: string;
}

/** Worlds closed by date (D-402 [5]–[8]): no known route, secret, or not yet existing; each opens on its own year. */
export const WORLD_GATES: readonly WorldGate[] = [
  { place: 'Dromund Kaas', fromBby: 3681, opensBby: 3640, closedTo: 'republic', reason: 'the Republic knows the name (from 3,668) but has no usable coordinates; the first Republic assault is in 3,640', storyException: 'capture, or a stolen Imperial navicomputer', source: 'D-402 [5]' },
  { place: 'Quesh', fromBby: 3681, opensBby: 3643, closedTo: 'all', reason: 'not on public charts; at most in Republic survey records, unsettled, with no Hutt interest', storyException: 'Republic survey records', source: 'D-402 [6]' },
  { place: 'Tython', fromBby: 3681, opensBby: 3651, closedTo: 'all', reason: 'its lanes are erased; Satele Shan re-finds it in 3,651', source: 'D-402 [7]; D-393 [14]; Timeline slice Part 2 (3,651); D-408 [1]' },
  { place: 'Voss', fromBby: 3681, opensBby: 3645, closedTo: 'all', reason: 'unknown to the galaxy until the rediscovery c. 3,645', source: 'D-402 [7]; D-399 [15]' },
  { place: 'Denova', fromBby: 3681, opensBby: 3652, closedTo: 'all', reason: 'found only after the Treaty of Coruscant', source: 'D-402 [7]' },
  { place: 'Belsavis', fromBby: 3681, opensBby: 3641, closedTo: 'all', reason: 'a Republic secret (the Tomb prison); the Empire learns of it only in the Galactic War', storyException: 'Republic characters with a story reason (SIS, prison staff)', source: 'D-402 [7]' },
  { place: 'Maelstrom', fromBby: 3681, opensBby: 3642, closedTo: 'all', reason: 'the Imperial prison station is secret until 3,642', source: 'D-402 [7]' },
  { place: 'Sebaddon', fromBby: 3681, opensBby: 3643, closedTo: 'all', reason: 'secret, and settled only from 3,658 (Lema Xandret)', source: 'D-402 [7]' },
  { place: 'Rishi', fromBby: 3681, opensBby: null, closedTo: 'all', reason: 'hidden in the Rishi Maze', storyException: 'a story reason (pirates found it by crashing in the Maze)', source: 'D-402 [7]' },
  { place: 'Nathema', fromBby: 3681, opensBby: null, closedTo: 'all', reason: 'Vitiate\'s dead world; its routes were erased', source: 'D-402 [7]' },
  { place: 'Zakuul', fromBby: 3681, opensBby: 3636, closedTo: 'all', reason: 'the Eternal Empire, beyond Wild Space, with no contact before 3,636', source: 'D-402 [7]' },
  { place: 'Odessen', fromBby: 3681, opensBby: 3631, closedTo: 'all', reason: 'unknown until c. 3,631', source: 'D-402 [7]' },
  { place: 'Iokath', fromBby: 3681, opensBby: 3631, closedTo: 'all', reason: 'unknown until c. 3,631', source: 'D-402 [7]' },
  { place: 'Obus VI', fromBby: 3681, opensBby: null, closedTo: 'all', reason: 'uncharted', source: 'D-402 [7]' },
  { place: 'Mek-Sha', fromBby: 3681, opensBby: 3638, closedTo: 'all', reason: 'does not exist as a station before 3,638', source: 'D-402 [7]' },
  { place: 'Port Nowhere', fromBby: 3681, opensBby: 3653, closedTo: 'all', reason: 'Cold War or later', source: 'D-402 [7]' },
  { place: 'Ruhnuk', fromBby: 3663, opensBby: null, closedTo: 'all', reason: 'cut off by a nebula since 3,663', source: 'D-402 [7]; Timeline slice Part 1 (3,663)' },
  { place: 'Yavin 4', fromBby: 3681, opensBby: null, closedTo: 'all', reason: 'remote and unheard of', storyException: 'a story reason', source: 'D-402 [7]' },
  { place: 'Ilum', fromBby: 3681, opensBby: 3640, closedTo: 'sithEmpire', reason: 'a Republic and Jedi staging world on difficult lanes, on the Republic\'s charts only', source: 'D-402 [8]' },
];

const SIDE_OF: Readonly<Record<string, MapSide>> = { republic: 'republic', jediOrder: 'republic', sithEmpire: 'sithEmpire', sith: 'sithEmpire' };

/** The map side of a character's start faction (or path faction). */
export function mapSide(faction: string | undefined): MapSide {
  return (faction && SIDE_OF[faction]) || 'other';
}

/** The worlds closed to a character of `side` in `bby`. */
export function closedWorlds(side: MapSide, bby: number): WorldGate[] {
  return WORLD_GATES.filter((g) => bby <= g.fromBby && (g.opensBby === null || bby > g.opensBby) && (g.closedTo === 'all' || g.closedTo === side));
}

/** A planet of the master table by name (case-insensitive). */
export function planetByName(name: string): GeneratedPlanet | undefined {
  const n = name.toLowerCase();
  return PLANETS.find((p) => p.name.toLowerCase() === n);
}

/**
 * The map worlds on a route (D-406): planets whose route list names it, plus map worlds named as stops in the route's
 * endpoints text. Names are lower-case.
 */
export function worldsOnRoute(route: string): ReadonlySet<string> {
  const r = route.toLowerCase();
  const out = new Set(PLANETS.filter((p) => p.routes.some((x) => x.toLowerCase() === r)).map((p) => p.name.toLowerCase()));
  const text = ROUTES_ATTESTED.find((x) => x.name.toLowerCase() === r)?.endpoints ?? '';
  // "Bonadan to Imynusoph. ... Stops include D'ian, Lythos, ... and Simpla-12; junctions include ..." -> stop names.
  const stopsText = text.split(/junctions? include/i)[0] ?? '';
  const names = new Set(
    stopsText
      .split(/,|;|\.\s|\bto\b|\band\b|\bvia\b|stops include|\bthe\b/i)
      .map((x) => x.trim().replace(/\.$/, '').toLowerCase())
      .filter(Boolean),
  );
  for (const w of [...PLANETS, ...MENTION_ONLY]) if (names.has(w.name.toLowerCase())) out.add(w.name.toLowerCase());
  return out;
}
