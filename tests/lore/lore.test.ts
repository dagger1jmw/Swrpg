import { describe, expect, it } from 'vitest';
import { normalizeAlias, normalizeText, slugify, textMentions } from '../../src/engine/aliases';
import { LORE_INDEX } from '../../src/lore';
import { buildLoreIndex, dropMetaSentences, fileKey, parseCharacterHeading, parseYearRange } from '../../src/lore/parse';
import { findCanonEntity, isEligible, retrieveLore } from '../../src/lore/retrieve';

const est = (s: string): number => Math.ceil(s.length / 4);

// Vite reads the lore files as text (no Node types needed).
const RAW = import.meta.glob('/Docs/SWRPG lore/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

function loreFiles() {
  return Object.entries(RAW)
    .map(([path, content]) => ({ name: path.split('/').pop()!, content }))
    .filter((f) => fileKey(f.name) !== null);
}

describe('aliases', () => {
  it('normalizes case, punctuation and leading titles', () => {
    expect(normalizeAlias('Grand Master Zym')).toBe('zym');
    expect(normalizeAlias('  master   ORGUS din ')).toBe('orgus din');
    expect(normalizeAlias("Master Dar'Nala")).toBe("dar'nala");
    expect(normalizeAlias('Darth Malgus')).toBe('malgus');
    expect(normalizeAlias('Master')).toBe('master'); // never strips to nothing
  });
  it('matches whole words in normalized text, possessives included', () => {
    const t = normalizeText("I ask about Zym's orders.");
    expect(textMentions(t, 'zym')).toBe(true);
    expect(textMentions(normalizeText('Zymbal'), 'zym')).toBe(false);
  });
  it('slugifies', () => {
    expect(slugify("Master Dar'Nala")).toBe('master-darnala');
  });
});

describe('lore parsing', () => {
  it('parses year ranges in both directions and across 0', () => {
    expect(parseYearRange('GREAT GALACTIC WAR — 3,681–3,653 BBY')).toEqual({ from: -3681, to: -3653 });
    expect(parseYearRange('GALACTIC CIVIL WAR — 0 BBY–4 ABY')).toEqual({ from: 0, to: 4 });
    expect(parseYearRange('(≈19 BBY – 4 ABY)')).toEqual({ from: -19, to: 4 });
    expect(parseYearRange('**3,661 BBY**')).toEqual({ from: -3661, to: -3661 });
    expect(parseYearRange('Note on Darth Maul')).toBeNull();
  });
  it('reads years with or without the thousands comma, and "between X and Y" (lore batch 20)', () => {
    expect(parseYearRange('3681 BBY')).toEqual(parseYearRange('3,681 BBY'));
    expect(parseYearRange('3681–3653 BBY')).toEqual({ from: -3681, to: -3653 });
    expect(parseYearRange('between 3,636 and 3,630 BBY')).toEqual({ from: -3636, to: -3630 });
  });
  it('parses character headings with parentheticals and alias lists', () => {
    expect(parseCharacterHeading('Revan (V) — the freed prisoner ("mad Revan")').name).toBe('Revan');
    expect(parseCharacterHeading('The Dread Masters (Bestia, Brontes, Tyrans)').aliases).toEqual(['dread masters', 'bestia', 'brontes', 'tyrans']);
  });
  it('drops game-meta sentences', () => {
    expect(dropMetaSentences('She is a hero. She descends from the line your player-character belongs to.')).toBe('She is a hero.');
    expect(dropMetaSentences('Scale down: more aggressive.')).toBe('');
  });

  const built = buildLoreIndex(loreFiles());

  it('is deterministic and matches the generated index', () => {
    expect(JSON.stringify(buildLoreIndex(loreFiles()))).toBe(JSON.stringify(built));
    expect(JSON.stringify(built)).toBe(JSON.stringify(LORE_INDEX));
  });
  it('tags Satele Shan for the Great Galactic War and strips stats', () => {
    const satele = built.chunks.find((c) => c.canonId === 'lore:satele-shan' && c.kind === 'character')!;
    expect(satele.fromYear).toBeLessThanOrEqual(-3661);
    expect(satele.toYear).toBeGreaterThanOrEqual(-3661);
    expect(satele.text).toContain('descended from Revan and Bastila Shan');
    expect(satele.text).not.toMatch(/ForceSense|\|\s*\d|Form ratings|game stats|player-character/);
  });
  it('carries timeline years and skips non-era sections', () => {
    const y3661 = built.chunks.find((c) => c.kind === 'timeline' && c.fromYear === -3661 && c.toYear === -3661)!;
    expect(y3661.text).toContain('Blockade of the Hydian Way begins');
    expect(y3661.text).toContain('State of the galaxy, 3,661 BBY: Mandalorian cruisers closed the Hydian Way');
    expect(y3661.locations).toContain('hydian way');
    expect(built.chunks.some((c) => c.text.includes('GALAXY SIM') || c.text.includes('power:58'))).toBe(false);
  });
  it('reads the 3,700–3,600 BBY slice in place of the old rows, with no research notes (lore batch 20)', () => {
    const tl = built.chunks.filter((c) => c.id.startsWith('tl:'));
    expect(tl.some((c) => /\[(conflict|inferred|unclear)|https?:|SW_\w|\(rows? \d/.test(c.text))).toBe(false);
    expect(tl.some((c) => c.text.includes('Dustig Trace'))).toBe(false); // an old unsourced row, removed
    const rhenVar = tl.find((c) => c.text.includes('Battle of Rhen Var'))!;
    expect([rhenVar.fromYear, rhenVar.toYear]).toEqual([-3654, -3653]); // ruling 16: not a front in 3,661
    expect(tl.find((c) => c.id === 'tl:cold-war:-3642_-3642')!.text).toContain('Balmorra is freed'); // ruling 15
  });
  it('indexes bench figures as canon entities', () => {
    expect(built.entities.find((e) => e.name === 'Shol Bestros')?.aliases).toContain('shol bestros');
  });
});

describe('research-bot character files (lore batch 19, D-392)', () => {
  const bot = `# Era 99 Characters: A Test War (c. 3681–3636 BBY), Part 1: Jedi

Legends lore reference. [A source](https://example.org/x)

## Entries

### A. A group heading (not a person)

### Ana Vel (the Bright; born Ana Velis)
- **Type:** character (Jedi Master)
- **Era:** 3700 BBY – 3640 BBY
- **Key facts:**
  - ID: female Human [Ana Vel §Life](https://starwars.fandom.com/wiki/Ana_Vel).
  - Life: born 3700 BBY. Game stats: none.
- **Related:** Bo Tarn.

### Minor Jedi
| Name | Species / sex | Born / died (infobox) | Role and dates | 3661 BBY / 3653 BBY | Source |
|---|---|---|---|---|---|
| [Bo Tarn](https://starwars.fandom.com/wiki/Bo_Tarn) | male Zabrak | — | Knight at Alderaan [x](https://e.org) | active / dead | [p](https://e.org) |

### Old estimates
| Character | Old estimate (summary) | Verdict | Basis |
|---|---|---|---|
| Ana Vel | strong | kept | — |
`;
  const index = `# Era 99 Characters: A Test War (c. 3681–3636 BBY), Index

### Master index
| Name | Group | Born | Died | Status in 3661 BBY | File › section |
|---|---|---|---|---|---|
| Ana Vel | Jedi | 3700 BBY | 3640 BBY | Master | Part1 › Ana Vel |
`;
  const built = buildLoreIndex([
    { name: 'SW_Characters_99_TestWar_Part1.md', content: bot },
    { name: 'SW_Characters_99_TestWar_Index.md', content: index },
  ]);

  it('gives each part its own file key', () => {
    expect(fileKey('SW_Characters_09_GGW_ColdWar_Part3a.md')).toBe('c09p3a');
    expect(fileKey('SW_Characters_09_GGW_ColdWar_Index.md')).toBe('c09i');
    expect(fileKey('SW_Characters_08_DarkWars_SithTriumvirate.md')).toBe('c08');
    expect(fileKey('OLD_SW_Characters_09_GreatGalacticWar_ColdWar.md')).toBeNull();
  });
  it('reads ### entries with a Type bullet as characters, with the era from the title and the citations stripped', () => {
    const ana = built.chunks.find((c) => c.canonId === 'lore:ana-vel')!;
    expect(ana.kind).toBe('character');
    expect([ana.fromYear, ana.toYear]).toEqual([-3681, -3636]);
    expect(ana.text).toContain('ID: female Human.');
    expect(ana.text).not.toMatch(/https?:|Game stats|Related|Type:/);
    expect(ana.names).toEqual(expect.arrayContaining(['ana vel', 'bright', 'ana velis']));
  });
  it('reads minor-figure tables by their headers, and skips group headings, master indexes and verdict tables', () => {
    const bo = built.chunks.find((c) => c.canonId === 'lore:bo-tarn')!;
    expect(bo.kind).toBe('bench');
    expect(bo.text).toBe('Bo Tarn (male Zabrak): Knight at Alderaan. In 3661 BBY / 3653 BBY: active / dead.');
    expect(built.chunks.map((c) => c.title).sort()).toEqual(['Ana Vel', 'Bo Tarn']);
  });
});

describe('timeline slices (lore batch 20, D-396)', () => {
  const old = `# Timeline

## DOCUMENT PURPOSE
Not lore.

## ═══
## OLD ERA — 3,700–3,690 BBY
## ═══

### Overview
Old years.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,700 BBY** | Old row | Ann Ode | Here | LOW |
`;
  const slice = `# Galaxy Timeline, c. 3,700–3,600 BBY (Part 1 of 3)

## Summary
This file covers 3,700–3,600 BBY.

## ════
## OLD ERA — 3,700–3,690 BBY
## ════

### Overview
Only the in-scope rows are rebuilt here. In these years a route was charted [Route](https://starwars.fandom.com/wiki/Route).

| Date | Event | Type | Place | Who | Source |
|---|---|---|---|---|---|
| 3695 BBY [conflict] | A route is charted (see the Route row) | Tech | Brentaal IV to Denon | Freia Kallea | [Route](https://x.org) |

## ════
## TEST WAR — 3,689–3,680 BBY
## ════

### Overview
A war from 3,689 BBY to 3,680 BBY [W](https://x.org); [V](https://y.org). The rows below keep only dates. The Test Blockade in year 4 hurt trade. The war ends in a treaty.

### Year-by-Year Scripted Events

#### 3,689 BBY — Year 0 (war begins)

| Date | Event | Type | Place | Who | Source |
|---|---|---|---|---|---|
| 3,689 BBY | The war begins | War | Korriban (Republic → Empire) | — | [p](https://x.org) |

#### 3,685 BBY — Year 4

**State of the galaxy, 3,685 BBY.** The blockade held (row 1). [3685 BBY](https://x.org)

| Date | Event | Type | Place | Who | Source |
|---|---|---|---|---|---|
| 3,685 BBY | The blockade. [conflict] One page says 3,684 BBY [x](https://x.org) | War | Route | Admiral Ox | [p](https://x.org) |
| between 3,686 and 3,684 BBY | Skirmishes | War | — | — | [p](https://x.org) |
`;
  const built = buildLoreIndex([
    { name: 'SW_Timeline_3700_3600BBY_Part1.md', content: slice },
    { name: 'SW_Legends_Galaxy_Timeline.md', content: old },
  ]);
  const chunk = (id: string) => built.chunks.find((c) => c.id === id)!;

  it('a ruling (D-477): its tag and the losing version are not sent, and a row it set aside is dropped', () => {
    const t = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline' || x.kind === 'overview').map((x) => x.text).join('\n');
    expect(t).not.toMatch(/Ruled 24 Nov|\[S-canon|\[conflict/);
    expect(t).toMatch(/Ahsoka Tano, Plo Koon's apprentice, is killed in Order 66 with Plo Koon's forces on Cato Neimoidia/);
    // TCW-only characters do not exist (D-478): Appo has Rex's role, and Ahsoka is not Anakin's Padawan anywhere the narrator reads.
    const all = LORE_INDEX.chunks.map((x) => x.text).join('\n');
    expect(all).not.toMatch(/\bRex\b|Admiral Trench|\bTrench's|Loathsom|Mar Tuuk|Ziro|Ima-Gun|Syndulla|Nahdar|took \*{0,2}Ahsoka|Anakin's Padawan/);
    expect(all).toMatch(/Commander Appo/);
    expect(t).toMatch(/Maul is born on Dathomir to Kycina/);
    expect(t).not.toMatch(/Battle of Jabiim dated to the war's first months|Torbin is killed by an assassin droid that crashes/);
    const at = (y: number): string => LORE_INDEX.chunks.filter((x) => x.kind === 'timeline' && x.fromYear === y && x.toYear === y).map((x) => x.text).join('\n');
    expect(at(-3653)).toMatch(/votes to postpone rebuilding the Coruscant Jedi Temple/);
    expect(at(-3653)).not.toMatch(/Shadow Syndicate/);
    expect(at(-3643)).toMatch(/The Exchange is beaten by the Shadow Syndicate/);
    expect(at(-41)).toMatch(/Anakin Skywalker is born/);
  });
  it('the slices join the timeline', () => {
    expect(fileKey('SW_Timeline_3700_3600BBY_Part1.md')).toBe('tl');
    expect(fileKey('SW_Timeline_3700_3600BBY_Part3.md')).toBe('tl');
    expect(fileKey('OLD_SW_Legends_Galaxy_Timeline.md')).toBeNull();
  });
  it('merges an era the old file also opens, and drops file notes and citations from overviews', () => {
    expect(chunk('tl:old-era:overview').text).toBe('Old Era, 3,700 BBY to 3,690 BBY. Old years.\nIn these years a route was charted.');
    expect(chunk('tl:old-era:-3700_-3700').text).toContain('- 3,700 BBY: Old row (Ann Ode; Here)');
  });
  it('reads the new columns by header and drops research tags, asides and conflict notes', () => {
    const route = chunk('tl:old-era:-3695_-3695');
    expect(route.text).toBe('Old Era, events of 3,695 BBY:\n- 3695 BBY: A route is charted (Freia Kallea; Brentaal IV to Denon)');
    expect(route.locations).toEqual(['brentaal iv', 'denon']);
    expect(chunk('tl:test-war:-3689_-3689').locations).toEqual(['korriban']);
    expect(chunk('tl:test-war:-3686_-3684').text).toContain('Skirmishes');
  });
  it('puts a year\'s state-of-the-galaxy paragraph first among its rows', () => {
    expect(chunk('tl:test-war:-3685_-3685').text).toBe(
      'Test War, events of 3,685 BBY:\n- State of the galaxy, 3,685 BBY: The blockade held.\n- 3,685 BBY: The blockade. (Admiral Ox; Route)',
    );
  });
  it('dates overview sentences by Year 0-based headings, era span and era-end words (D-98)', () => {
    const parts = chunk('tl:test-war:overview').parts!.map((p) => [p.year, p.text.trim()]);
    expect(parts).toEqual([
      [-3689, 'Test War, 3,689 BBY to 3,680 BBY.'],
      [-3689, 'A war from 3,689 BBY to 3,680 BBY.'],
      [-3685, 'The Test Blockade in year 4 hurt trade.'],
      [-3680, 'The war ends in a treaty.'],
    ]);
  });
});

describe('species files (lore batch 21, D-399)', () => {
  const file = `# Playable Species of a Test Era (c. 3681–3600 BBY), Part 1 of 3

## Entries

### How to read this file
- **Entry layout:** numbered bullets.

### Sith (Sith Purebloods and Sith hybrids)
- **Type:** species (Red Sith). **playable-ready**
- **Key facts:**
  1. **Body:** red skin [Sith (species)](https://starwars.fandom.com/wiki/Sith).

### Kel Dor
- **Type:** species. **playable-ready**
- **Key facts:**
  1. **Body:** needs a mask [Kel Dor](https://x.org).
`;
  const built = buildLoreIndex([{ name: 'SW_Species_TestEra_Part1.md', content: file }]);

  it('reads each Type: species entry as a species chunk, with plurals and no citations', () => {
    expect(fileKey('SW_Species_OldRepublic_Part2.md')).toBe('sp-oldrepublic-p2');
    expect(built.chunks.map((c) => [c.id, c.kind])).toEqual([
      ['sp-testera-p1:sith', 'species'],
      ['sp-testera-p1:kel-dor', 'species'],
    ]);
    const kd = built.chunks[1]!;
    expect(kd.names).toEqual(['kel dor', 'kel dors']);
    expect(kd.text).not.toMatch(/https?:/);
    expect([kd.fromYear, kd.toYear]).toEqual([-3681, -3600]);
  });
  it('"Sith" alone does not name the species (the Order is meant far more often)', () => {
    expect(built.chunks[0]!.names).toEqual(expect.arrayContaining(['sith purebloods', 'pureblood']));
    expect(built.chunks[0]!.names).not.toContain('sith');
  });
  it('is sent only when the species is named, never on its own or for a place', () => {
    const base = { canonIds: [], names: [], locationNames: ['dorin'], year: -3661 };
    expect(retrieveLore(built, base, 3000, est).included).toEqual([]);
    expect(retrieveLore(built, { ...base, playerText: normalizeText('I greet the Kel Dor') }, 3000, est).included.map((s) => s.chunk.title)).toEqual(['Kel Dor']);
  });
});

describe('lore retrieval', () => {
  const base = { canonIds: [], names: [], locationNames: [] };

  it('3,661 BBY gets Great Galactic War lore and never 3,660 events', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661, locationNames: ['jedi temple', 'coruscant'] }, 3000, est);
    const ids = sel.included.map((s) => s.chunk.id);
    expect(ids).toContain('tl:great-galactic-war:overview');
    expect(ids).toContain('tl:great-galactic-war:-3661_-3661');
    const text = sel.included.map((s) => s.chunk.text).join('\n');
    expect(text).not.toContain('Blockade broken');
    expect(sel.included.every((s) => s.chunk.fromYear <= -3661)).toBe(true);
    expect(sel.tokens).toBeLessThanOrEqual(3000);
  });
  it('a 22 BBY campaign gets Clone Wars lore, not Great Galactic War lore', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -22 }, 3000, est);
    const ids = sel.included.map((s) => s.chunk.id);
    expect(ids).toContain('tl:clone-wars:overview');
    expect(ids.some((id) => id.includes('great-galactic-war'))).toBe(false);
  });
  it('a canon NPC in the scene pulls their chunk to the top', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661, canonIds: ['lore:zym'] }, 3000, est);
    expect(sel.included[0]!.chunk.canonId).toBe('lore:zym');
  });
  it('the player mentioning a canon name pulls their chunk', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661, playerText: normalizeText('I ask about Satele Shan') }, 3000, est);
    expect(sel.included.some((s) => s.chunk.canonId === 'lore:satele-shan')).toBe(true);
  });
  it('a shared place alone never pulls in a person (their entry spans their whole life, D-93)', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661, locationNames: ['coruscant', 'jedi temple'] }, 3000, est);
    expect(sel.included.some((s) => s.chunk.kind === 'character' || s.chunk.kind === 'bench')).toBe(false);
  });
  it('a three-letter canon name in the player text counts (Zym, D-95)', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661, playerText: normalizeText('Did Grand Master Zym send us?') }, 3000, est);
    expect(sel.included.map((s) => s.chunk.canonId)).toContain('lore:zym');
  });
  it('era overviews send only sentences up to the current year (D-98)', () => {
    const at = (year: number, id: string) => retrieveLore(LORE_INDEX, { ...base, year }, 3000, est).included.find((s) => s.chunk.id === id)!.text;
    // A sentence naming the era's own span is the era's description, sent from its first year.
    expect(at(-3681, 'tl:great-galactic-war:overview')).toContain('twenty-eight-year war');
    expect(at(-3653, 'tl:cold-war:overview')).not.toContain('year 11 ATC');
    expect(at(-3642, 'tl:cold-war:overview')).toContain('year 11 ATC');
    expect(at(-3642, 'tl:galactic-war-second:overview')).not.toContain('collapsed midway');
    expect(at(-3641, 'tl:galactic-war-second:overview')).toContain('collapsed midway');
    expect(at(-22, 'tl:clone-wars:overview')).not.toContain('Order 66');
  });
  it('respects the cap', () => {
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661 }, 400, est);
    expect(sel.tokens).toBeLessThanOrEqual(400);
    expect(sel.dropped.length).toBeGreaterThan(0);
  });
  it('timeline eligibility is past and present only', () => {
    const chunk = LORE_INDEX.chunks.find((c) => c.kind === 'timeline' && c.fromYear === -3660)!;
    expect(isEligible(chunk, -3661)).toBe(false);
    expect(isEligible(chunk, -3660)).toBe(true);
  });
  it('finds in-era canon entities by exact alias only', () => {
    expect(findCanonEntity(LORE_INDEX, 'zym', -3661)?.canonId).toBe('lore:zym');
    expect(findCanonEntity(LORE_INDEX, 'zy', -3661)).toBeNull();
    expect(findCanonEntity(LORE_INDEX, 'zym', -22)).toBeNull();
  });
});
