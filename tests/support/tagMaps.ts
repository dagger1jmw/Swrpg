// Reads a world-event tag map (docs-v2/spec/world-event-tags-*.md) into the network's types, so tests can check that the
// shipped data follows its map and that the schema can hold the maps that are not shipped (M8 Phase B, D-467).
import { readFileSync } from 'node:fs';
import type { ConditionTag, RoleTag, WorldEventDef, WorldGuard } from '../../src/data/worldNetwork';

export interface MapRow {
  id: string;
  date: string;
  event: string;
  roles: string;
  conditions: string;
  consumes: string;
  produces: string;
}

const clean = (s: string): string => s.replace(/\*\*/g, '').trim();
export const outcomesIn = (cell: string): string[] => [...new Set(cell.match(/O\.[a-z0-9_]+/g) ?? [])];

export function mapRows(file: string): MapRow[] {
  const text = readFileSync(`docs-v2/spec/${file}`, 'utf8');
  return text.split(/\r?\n/).flatMap((line) => {
    if (!/^\| E\./.test(line)) return [];
    const c = line.split('|').slice(1, -1).map(clean);
    return [{ id: c[0]!, date: c[1]!, event: c[2]!, roles: c[3]!, conditions: c[4]!, consumes: c[5]!, produces: c[6]! }];
  });
}

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
const uniq = <T extends { id: string }>(xs: T[]): T[] => xs.map((x, i) => (xs.findIndex((y) => y.id === x.id) === i ? x : { ...x, id: `${x.id}_${i}` }));

/** "crucial, high" and so on; a plain "crucial" has no guard in the map (medium here). */
function conditionsIn(cell: string): ConditionTag[] {
  const out: ConditionTag[] = [];
  for (const m of cell.matchAll(/([^.;]*?):\s*(not crucial|crucial)(?:,\s*(very high|high|medium|low))?/g)) {
    const guard = (m[3] === 'very high' ? 'veryHigh' : (m[3] ?? 'medium')) as WorldGuard;
    const text = m[1]!.trim().slice(0, 200) || 'condition';
    // No breaking tests yet: those are drafted when an era is built. A very high guard gets two placeholder steps.
    const steps = ['one', 'two'].map((n) => ({ id: `know.${n}`, text: `step ${n}`, tests: [{ kind: 'action' as const, actionTypes: ['investigate' as const], places: [`step ${n}`] }] }));
    out.push({ id: `cond.${slug(text)}`, text, brokenText: text, crucial: m[2] === 'crucial', guard, breakIf: [], ...(guard === 'veryHigh' ? { prerequisites: steps } : {}) });
  }
  return uniq(out);
}

function rolesIn(cell: string): RoleTag[] {
  if (cell === '—') return [];
  const out: RoleTag[] = [];
  for (const part of cell.split(';')) {
    const m = part.match(/^\s*(.+?):\s*(C|R|NPC)\b/);
    if (!m) continue;
    for (const label of m[1]!.split(/,\s*/)) {
      const kind = m[2] === 'C' ? 'crucial' : 'replaceable';
      out.push({ id: `role.${slug(label)}`, label: label.slice(0, 120), kind, ...(kind === 'crucial' ? { npcName: label.slice(0, 120) } : {}), ...(m[2] === 'NPC' ? { protagonist: true } : {}) });
    }
  }
  return uniq(out);
}

/** Outcomes a row says it ends. */
export const endsIn = (r: MapRow): string[] => [...r.produces.matchAll(/(O\.[a-z0-9_]+) ends/g)].map((m) => m[1]!);

/** The row as an event; null when the map gives no year at all (a schema gap: undated events). */
export function rowToEvent(r: MapRow): WorldEventDef | null {
  // The id's number is the year of the event; the date column says ABY and gives ranges.
  const idYear = r.id.match(/^E\.([~<>]?)(\d+)\./);
  if (!idYear) return null;
  const aby = /ABY/.test(r.date);
  const year = (aby ? 1 : -1) * Number(idYear[2]);
  const end = r.date.match(/(\d+)\s*[–-]\s*(\d+)/);
  const endYear = end ? (aby ? 1 : -1) * Number(end[2]) : null;
  return {
    id: r.id,
    title: r.event.slice(0, 120),
    summary: r.event.slice(0, 300),
    date: { year, ...(/c\.|after|before|by|from/.test(r.date) ? { circa: true } : {}) },
    ...(endYear !== null && endYear > year ? { endDate: { year: endYear } } : {}),
    roles: rolesIn(r.roles),
    conditions: conditionsIn(r.conditions),
    consumes: outcomesIn(r.consumes).map((outcome) => ({ outcome, required: true })),
    // "O.x ends": an event that ends an outcome, which the schema cannot say (a gap the tests list).
    produces: outcomesIn(r.produces.replace(/O\.[a-z0-9_]+ ends/g, '')).map((outcome) => ({ outcome })),
    source: 'tag map',
  };
}
