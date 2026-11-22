// One-off generator (lore batch 22, D-404): builds src/data/galaxyMap.generated.ts from
// Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part1-5.md (the master table, the planet entries' field 1 and 2, the
// mention-only index A3, and the route sections B1/B2). Re-run when those files change: node scripts/gen-galaxy-map.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join('Docs', 'SWRPG lore');
const parts = [1, 2, 3, 4, 5].map((n) => readFileSync(join(DIR, `SW_Planets_Travel_OldRepublic_Part${n}.md`), 'utf8').replace(/\r\n/g, '\n'));
const all = parts.join('\n');
const strip = (s) => s.replace(/\s*\[[^\]]*\]\(https?:[^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
// A name cell is a link ("[Varn](https://...)"): keep its text. strip() drops whole citation links, which emptied 398 index names
// before this fix (D-405).
const linkText = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').trim();
const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

// Master table (Part 1).
const p1 = parts[0];
const mt = p1.slice(p1.indexOf('## Master table'), p1.indexOf('# Part A'));
const rows = mt.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Planet') && !l.startsWith('|---'));
// Planet entries: ### Name ... until the next ### or ##.
const entries = new Map();
for (const m of all.matchAll(/^### (.+)\n([\s\S]*?)(?=^#{2,3} |\n# )/gm)) entries.set(m[1].trim(), m[2]);
const field = (body, n) => {
  const m = new RegExp(`^- \\*\\*${n}\\.[^*]*:\\*\\*\\s*(.*)$`, 'm').exec(body ?? '');
  return m ? strip(m[1]) : '';
};
const blank = (c) => /^(not on record|not stated)/i.test(c) ? '' : c;
const planets = rows.map((l) => {
  const [name, region, grid, control, role, gated, status] = cells(l);
  const body = entries.get(name);
  const loc = field(body, 1);
  const sector = /sector ([^;]+?)(?:;|$)/.exec(loc)?.[1]?.trim();
  const system = /system ([^;]+?)(?:;|$)/.exec(loc)?.[1]?.trim();
  const routesRaw = /routes: ([^.[]+?)(?:\.|$)/.exec(loc)?.[1]?.trim() ?? '';
  const routes = /^none/i.test(routesRaw) ? [] : routesRaw.split(/[;,]/).map((r) => r.trim()).filter(Boolean);
  // A 3653 change recorded under field 2 (for a later 3653 start).
  const c3653 = /^\s+- (?:c\. )?3653 BBY: (.+)$/m.exec(body ?? '')?.[1];
  const gating = field(body, 6);
  return {
    name: linkText(name),
    region: region === '—' ? '' : region,
    grid: grid === '—' ? '' : grid,
    ...(sector && sector !== '—' ? { sector } : {}),
    ...(system && system !== '—' ? { system } : {}),
    routes,
    // Control on record, as dated keyframes (D-413): field 2's first line is the 3,661 statement (the master table
    // shortens it); a 3,653 change recorded under field 2 is the next keyframe.
    control: [
      ...(blank(field(body, 2).replace(/s*.$/, '') || strip(control)) ? [{ bby: 3661, text: blank(field(body, 2).replace(/s*.$/, '') || strip(control)) }] : []),
      ...(c3653 ? [{ bby: 3653, text: strip(c3653) }] : []),
    ],
    role: strip(role),
    gated: gated === 'yes',
    ...(gating && !/^(open|not stated)\.?$/i.test(gating) ? { gating } : {}),
    full: status === 'full',
  };
});

// Mention-only worlds (A3): background nodes; Canon-only grids stay off the map (D-402 [13]).
const p4 = parts[3];
const a3 = p4.slice(p4.indexOf('## A3.'), p4.indexOf('# Part B'));
const mention = a3.split('\n').filter((l) => l.startsWith('| [')).map((l) => {
  const [w, region, grid, sector] = cells(l);
  return { name: linkText(w), region: region === '—' ? '' : region, grid: grid === '—' ? '' : grid, ...(sector && sector !== '—' ? { sector } : {}) };
});
// Two worlds are in both the master table and the index (Malachor V, Mandellia): the master-table entry wins.
const inTable = new Set(planets.map((p) => p.name.toLowerCase()));
const indexOnly = mention.filter((m) => !inTable.has(m.name.toLowerCase()));
const onMap = indexOnly.filter((m) => m.grid !== 'Canon-only');
const offMap = indexOnly.filter((m) => m.grid === 'Canon-only').map((m) => m.name);

// Routes B1 (attested): the ### sections from "## B1" to "### Other routes named in era sources".
const b1Start = all.indexOf('## B1.');
const b1End = all.indexOf('### Other routes named in era sources');
const b1 = [];
for (const m of all.slice(b1Start, b1End).matchAll(/^### (.+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)) {
  const body = m[2];
  const get = (k) => strip(new RegExp(`^- \\*\\*${k}:\\*\\*\\s*(.*)$`, 'm').exec(body)?.[1] ?? '');
  const founded = /\*\*Founded:\*\*\s*([^.[]+)/.exec(body)?.[1]?.trim();
  b1.push({ name: m[1].trim(), endpoints: get('Endpoints') || strip(/\*\*Endpoints:\*\*\s*([^\n]*)/.exec(body)?.[1] ?? ''), control: get('Control 3661') ? [{ bby: 3661, text: get('Control 3661') }] : [], ...(founded ? { founded } : {}), attested: true, blockade: /\*\*Blockaded\*\*/.test(body) });
}
// "Other routes named in era sources": attested, one bullet each.
const other = all.slice(b1End, all.indexOf('## B2.'));
for (const m of other.matchAll(/^- \*\*([^:*]+):\*\*\s*(.*)$/gm)) {
  if (/hypergates|Rishi Maze|^Nathema/.test(m[1])) continue;
  b1.push({ name: m[1].trim(), endpoints: strip(m[2]), control: [], attested: true, blockade: false });
}
// B2 (infobox only, unattested in the window); the Canon-sourced Pabol Hutta is left out (D-402 [15]).
const b2s = all.slice(all.indexOf('## B2.'), all.indexOf('# Part C'));
const b2 = b2s.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Route') && !l.startsWith('|---')).map((l) => {
  const [route, listed] = cells(l);
  return { name: route, listedIn: listed.split(',').map((x) => x.trim()) };
}).filter((r) => !/Pabol Hutta/.test(r.name));

const out = `// GENERATED by scripts/gen-galaxy-map.mjs from Docs/SWRPG lore/SW_Planets_Travel_OldRepublic_Part1-5.md (lore batch 22,
// D-404). Do not edit by hand: change the lore files or the generator, then re-run it. Curated rulings (gating open
// years, what each side knows) live in src/data/galaxyMap.ts.
import type { GeneratedPlanet, GeneratedRoute, MapNode } from './galaxyMap';

/** The master table's worlds (Part A), with field 1 (sector, system, routes) and any 3653 change from field 2. */
export const PLANETS: readonly GeneratedPlanet[] = ${JSON.stringify(planets, null, 1)};

/** Mention-only worlds (A3) with a Legends grid: background nodes, control blank (D-402 [13]). */
export const MENTION_ONLY: readonly MapNode[] = ${JSON.stringify(onMap, null, 1)};

/** Mention-only worlds whose only grid is Canon-only: off the map until a Legends location turns up (D-402 [13]). */
export const OFF_MAP: readonly string[] = ${JSON.stringify(offMap)};

/** Routes attested in the window (B1 and "other routes named in era sources"): the trunk network (D-402 [15]). */
export const ROUTES_ATTESTED: readonly GeneratedRoute[] = ${JSON.stringify(b1, null, 1)};

/** Routes from planet infoboxes only (B2): drawn on the map, flagged unattested in the window (D-402 [15]). */
export const ROUTES_UNATTESTED: readonly { name: string; listedIn: readonly string[] }[] = ${JSON.stringify(b2, null, 1)};
`;
writeFileSync(join('src', 'data', 'galaxyMap.generated.ts'), out);
console.log(`planets ${planets.length}, mention-only ${onMap.length} (+${offMap.length} off map), routes ${b1.length} attested, ${b2.length} unattested`);
