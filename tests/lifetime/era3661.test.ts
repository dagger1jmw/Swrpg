// The 3,661 era profile (overnight run item 4, D-409): a Jedi who is a 14-year-old Padawan in 3,661 BBY, run from
// initiate (age 4, 3,671) through the real game to 3,649, on the spread's 20 seeds. From 3,661 a probe checks, at
// every new year, what the world tables give the game: the board (a canon link for every roster figure, made the way the
// pipeline makes it), the Order seat, the leaders and control lines in the state block, and travel to every closed world.
// The character lives at the Order's seat by date (D-451, the harness's seat table): the Coruscant Temple, then
// no seat 3,653-3,651 (D-477; kept on Coruscant), then Tython from 3,650, its Temple from 3,647. Gates: no crash, no canon
// link to an off-board figure, no trip to a closed world. World events don't exist yet (M8): the report lists the
// dated events each year crosses, where they would fire.
import { beforeAll, describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import type { Intent } from '../../src/ai/schemas/intent';
import { CANON_NPCS, type CanonNpc } from '../../src/data/canonNpcs';
import { closedWorlds, MENTION_ONLY, PLANETS } from '../../src/data/galaxyMap';
import { dateFromAbsDay } from '../../src/engine/calendar';
import { normalizeAlias } from '../../src/engine/aliases';
import { canonAgeAt, canonBoardAt, canonOffBoard, canonRoleAt, prisonOf } from '../../src/engine/canonRoster';
import { LORE_INDEX } from '../../src/lore/index';
import { findCanonEntity } from '../../src/lore/retrieve';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { stateBlock } from '../../src/turn/context';
import { resolveTurn } from '../../src/turn/resolve';
import { planTravel } from '../../src/turn/travel';
import { runLifetime, type LifeProfile } from '../support/lifetime';
import { AVERAGE } from './profiles';

/** The spread's 20 seeds; ERA_SEEDS=n for a quick look (tuning and gates use all 20). */
const SEEDS = Number(process.env['ERA_SEEDS'] ?? 20);
const START = { year: -3671, month: 1, day: 1 };
const YEARS = 22; // to the start of 3,649
const est = makeEstimator(4);

/** The Average Jedi Guardian, Padawan at 13, so a 14-year-old Padawan in 3,661. */
const ERA_JEDI: LifeProfile = { ...AVERAGE, padawanAge: 13, seed: 'era3661' };

/** Dated events the timeline slice puts in these years (M8 items 1 and 8 would fire them; none exist yet). */
const WORLD_EVENTS: Readonly<Record<number, string>> = {
  3660: 'the Battle on the Hydian Way (blockade broken), the riots end, the Lesser dies and Artus Lok becomes Mandalore, the Rim Campaign battles',
  3653: 'the Sacking of Coruscant and the Treaty of Coruscant; the Cold War begins',
  3652: 'after the Treaty: Alderaan secedes and its civil war begins; the Separatist War on Ord Mantell',
  3651: 'Satele Shan rediscovers Tython and becomes Grand Master',
  3650: 'the Senate shelves the Coruscant Temple; the Order relocates to Tython',
  3649: "Janarus re-elected; Operation Starbender",
};

interface YearRow {
  bby: number;
  board: number;
  on: string[];
  off: string[];
  seat: string;
  leaders: string;
  control: string[];
  linked: number;
  refusedOffBoard: number;
  /** Off-board figures that were linked anyway (gate: none). */
  badLinks: string[];
  closedTried: number;
  /** Closed worlds the travel system let the character reach (gate: none). */
  badTrips: string[];
  tython: 'closed' | 'open' | 'here';
  turnRefusedNoTime: boolean;
}

const mapNode = (place: string) => [...PLANETS, ...MENTION_ONLY].find((w) => w.name.toLowerCase() === place.toLowerCase() || w.name.toLowerCase().startsWith(`${place.toLowerCase()} `));
const travel = (name: string): Intent => ({ actionType: 'travel', targets: [], references: [], unknownNames: [name] });
const yearOf = (s: GameState): number => dateFromAbsDay(s.clock.now.day).year;

/** A canon link attempted the way the pipeline makes one: a new NPC by the exact name, then the lore index's match. */
function tryLink(s: GameState, n: CanonNpc, year: number): 'linked' | 'refused' | 'noMatch' | 'notIntroduced' {
  const bby = -year;
  const r = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: n.name, species: n.speciesId, faction: n.faction, role: canonRoleAt(n, bby), ageApprox: Math.max(0, Math.min(999, canonAgeAt(n, bby))), description: '' }], { source: 'ai' });
  if (r.rejected.length) return 'notIntroduced';
  const npc = Object.values(r.state.npcs.byId).find((x) => x.name === n.name && !s.npcs.byId[x.id]);
  if (!npc) return 'notIntroduced';
  const hit = findCanonEntity(LORE_INDEX, normalizeAlias(n.name), year);
  if (!hit) return 'noMatch';
  const l = applyEvents(REGISTRY, r.state, [{ type: 'npcCanonLinked', npcRef: npc.id, canonId: hit.canonId }], { source: 'engine' });
  return l.state.npcs.byId[npc.id]?.canonId === hit.canonId ? 'linked' : 'refused';
}

function probe(s: GameState, prevBoard: Set<string>): { row: YearRow; board: Set<string> } {
  const year = yearOf(s);
  const bby = -year;
  const board = new Set(canonBoardAt(bby).map((n) => n.canonId));
  const text = stateBlock(s, est).text.split('\n');
  const row: YearRow = {
    bby,
    board: board.size,
    on: [...board].filter((x) => !prevBoard.has(x)),
    off: [...prevBoard].filter((x) => !board.has(x)),
    seat: text.find((l) => l.startsWith('Jedi Order: '))?.slice(12) ?? '',
    leaders: text.find((l) => l.startsWith('Leaders: '))?.slice(9) ?? '',
    control: text.filter((l) => l.startsWith('Control: ')).map((l) => l.slice(9).split(' (')[0]!),
    linked: 0,
    refusedOffBoard: 0,
    badLinks: [],
    closedTried: 0,
    badTrips: [],
    tython: 'closed',
    turnRefusedNoTime: true,
  };
  // Canon links: every roster figure (each canonId once).
  const seen = new Set<string>();
  const here = s.locations.currentId ? s.locations.byId[s.locations.currentId]!.name : '';
  for (const n of CANON_NPCS) {
    if (seen.has(n.canonId)) continue;
    seen.add(n.canonId);
    const out = tryLink(s, n, year);
    const off = canonOffBoard(n, bby);
    if (out === 'linked') {
      row.linked += 1;
      const prisonHere = off === 'imprisoned' && prisonOf(n.canonId, bby)?.place === here;
      if (off && !prisonHere) row.badLinks.push(`${n.name} (${off})`);
    } else if (out === 'refused' && off) row.refusedOffBoard += 1;
  }
  // Travel to every closed world on the map.
  for (const g of closedWorlds('republic', bby)) {
    const w = mapNode(g.place);
    if (!w) continue;
    const t = planTravel(s, travel(w.name));
    if (!t) continue;
    row.closedTried += 1;
    if (t.ok) row.badTrips.push(w.name);
  }
  const ty = planTravel(s, travel('Tython'));
  row.tython = ty === null ? 'here' : ty.ok ? 'open' : 'closed';
  // A refused trip through the turn passes no time (Dromund Kaas is closed to the Republic until 3,640).
  const closedTarget = closedWorlds('republic', bby).map((g) => mapNode(g.place)).find((w) => w);
  if (closedTarget) {
    const { state } = resolveTurn(REGISTRY, s, travel(closedTarget.name));
    row.turnRefusedNoTime = state.clock.now.day === s.clock.now.day && state.clock.now.second === s.clock.now.second;
  }
  return { row, board };
}

function runEra(seed: string): YearRow[] {
  const rows: YearRow[] = [];
  let lastYear = -Infinity;
  let board = new Set(canonBoardAt(3662).map((n) => n.canonId));
  runLifetime({ ...ERA_JEDI, seed }, YEARS, {
    startDate: START,
    onDay: (s0) => {
      const year = yearOf(s0);
      if (year === lastYear || year < -3661) return;
      lastYear = year;
      const p = probe(s0, board);
      board = p.board;
      rows.push(p.row);
    },
  });
  return rows;
}

const runs: { seed: string; rows: YearRow[]; error?: string }[] = [];
let ms = 0;
beforeAll(() => {
  const t0 = Date.now();
  for (let k = 0; k < SEEDS; k++) {
    const seed = k === 0 ? ERA_JEDI.seed : `${ERA_JEDI.seed}-s${k}`;
    try {
      runs.push({ seed, rows: runEra(seed) });
    } catch (e) {
      runs.push({ seed, rows: [], error: String(e) });
    }
  }
  ms = Date.now() - t0;
  const r = runs[0]!.rows;
  for (const y of r) {
    console.info(
      `[era3661] ${y.bby} BBY | seat: ${y.seat} | leaders: ${y.leaders} | control here: ${y.control.join('; ') || '-'} | board ${y.board} (+${y.on.length} ${y.on.join(', ')}; -${y.off.length} ${y.off.join(', ')}) | links ${y.linked}, off-board refused ${y.refusedOffBoard} | closed worlds tried ${y.closedTried} | Tython ${y.tython}${WORLD_EVENTS[y.bby] ? ` | world events would fire: ${WORLD_EVENTS[y.bby]}` : ''}`,
    );
  }
  console.info(`[era3661] ${SEEDS} seeds, ${(ms / 1000).toFixed(1)} s; errors: ${runs.filter((x) => x.error).length}`);
}, 3_600_000);

describe('the 3,661 era Jedi (20 seeds, 3,661 to 3,649)', () => {
  it('no crash on any seed, and every year from 3,661 to 3,649 probed', () => {
    for (const r of runs) {
      expect(r.error, r.seed).toBeUndefined();
      expect(r.rows.map((y) => y.bby), r.seed).toEqual(Array.from({ length: 13 }, (_, i) => 3661 - i));
    }
  });
  it('no canon link to an off-board figure', () => {
    for (const r of runs) for (const y of r.rows) expect(y.badLinks, `${r.seed} ${y.bby}`).toEqual([]);
  });
  it('no trip to a closed world, and a refused trip passes no time', () => {
    for (const r of runs) {
      for (const y of r.rows) {
        expect(y.badTrips, `${r.seed} ${y.bby}`).toEqual([]);
        expect(y.closedTried, `${r.seed} ${y.bby}`).toBeGreaterThan(0);
        expect(y.turnRefusedNoTime, `${r.seed} ${y.bby}`).toBe(true);
      }
    }
  });
  // Each year is read on its first day; the Sacking falls in June 3,653 (D-467).
  it('the Order seat moves on its dates: Coruscant into 3,653, no seat by 3,652, Tython from 3,650 (D-477)', () => {
    const seat = Object.fromEntries(runs[0]!.rows.map((y) => [y.bby, y.seat]));
    for (const b of [3661, 3654, 3653]) expect(seat[b]).toBe('the Jedi Temple on Coruscant');
    for (const b of [3652, 3651]) expect(seat[b]).toMatch(/scattered and without a seat/);
    for (const b of [3650, 3649]) expect(seat[b]).toMatch(/^Tython .*not finished/);
  });
  it('Tython is closed until its rediscovery in 3,651, then open; the character lives there from 3,650', () => {
    const ty = Object.fromEntries(runs[0]!.rows.map((y) => [y.bby, y.tython]));
    for (const b of [3654, 3653, 3652]) expect(ty[b], String(b)).toBe('closed');
    expect(ty[3651]).toBe('open');
    expect(ty[3650]).toBe('here');
  });
  it('the control and leaders lines change on their dates', () => {
    const y = Object.fromEntries(runs[0]!.rows.map((r) => [r.bby, r]));
    expect(y[3661]!.control).toEqual(['Coruscant: republic']);
    expect(y[3654]!.control).toEqual(['Coruscant: republic']);
    expect(y[3652]!.control).toEqual(['Coruscant: republic']); // no seat (D-477)
    expect(y[3650]!.control).toEqual(['Tython: republic']);
    expect(y[3661]!.leaders).toMatch(/Mandalore: Mandalore the Lesser/);
    expect(y[3659]!.leaders).not.toMatch(/the Lesser/);
    expect(y[3653]!.leaders).toMatch(/Grand Master of the Jedi Order: Zym/);
    expect(y[3652]!.leaders).toMatch(/Grand Master of the Jedi Order: vacant: the Jedi Council leads/); // D-411 [3]
    expect(y[3651]!.leaders).toMatch(/Grand Master of the Jedi Order: Satele Shan/);
    expect(y[3652]!.leaders).toMatch(/Supreme Chancellor: Dorian Janarus/);
  });
  it('the board changes on the roster dates (the Lesser and Venemal gone in 3,659; Zym and Ven Zallow gone in 3,652)', () => {
    const y = Object.fromEntries(runs[0]!.rows.map((r) => [r.bby, r]));
    expect(y[3659]!.off).toEqual(expect.arrayContaining(['lore:mandalore-the-lesser', 'lore:darth-venemal']));
    expect(y[3652]!.off).toEqual(expect.arrayContaining(['lore:zym', 'lore:ven-zallow', 'lore:berooken']));
    for (const r of runs) for (const row of r.rows) expect(row.linked, `${r.seed} ${row.bby}`).toBeGreaterThan(50);
  });
});
