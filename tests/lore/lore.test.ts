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
    // A decimal year is cut to its year, not read from its decimals (D-480).
    expect(parseYearRange('32.5 BBY')).toEqual({ from: -32, to: -32 });
    expect(parseYearRange('6.5–7 ABY')).toEqual({ from: 6, to: 7 });
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
    expect(tl.some((c) => /Dustig Trace absorbed/.test(c.text))).toBe(false); // an old unsourced row, removed
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
    expect(bo.text).toBe('Bo Tarn (male Zabrak): Knight at Alderaan. In 3661 BBY: active. In 3653 BBY: dead.');
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

| Date | Event | Type | Place | Who | Source |
|---|---|---|---|---|---|
| **3,700 BBY** | Old row | War | Here | Ann Ode | [p](https://x.org) |
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
    { name: 'SW_Timeline_3600_2000BBY_Part1.md', content: old },
  ]);
  const chunk = (id: string) => built.chunks.find((c) => c.id === id)!;

  it('a ruling (D-477): its tag and the losing version are not sent, and a row it set aside is dropped', () => {
    const t = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline' || x.kind === 'overview').map((x) => x.text).join('\n');
    expect(t).not.toMatch(/Ruled 24 Nov|\[S-canon|\[conflict/);
    expect(t).toMatch(/Ahsoka Tano, Plo Koon's apprentice, is killed in Order 66 with Plo Koon's forces on Cato Neimoidia/);
    // TCW characters stay, named, but Captain Rex, whose role is Appo's (D-479); Ahsoka is not Anakin's Padawan anywhere the narrator reads.
    const all = LORE_INDEX.chunks.map((x) => x.text).join('\n');
    expect(/\bRex\b|took \*{0,2}Ahsoka|Anakin's Padawan/.exec(all)?.[0]).toBeUndefined();
    for (const n of ['Admiral Trench', 'Whorm Loathsom', 'Mar Tuuk', 'Ziro the Hutt', 'Ima-Gun Di', 'Cham Syndulla', 'Nahdar Vebb', 'Pong Krell', 'Savage Opress', 'Mother Talzin']) expect(all.includes(n), n).toBe(true);
    expect(all).toMatch(/Commander Appo/);
    expect(t).toMatch(/Maul is born on Dathomir to Kycina/);
    expect(t).not.toMatch(/Battle of Jabiim dated to the war's first months|Torbin is killed by an assassin droid that crashes/);
    const at = (y: number): string => LORE_INDEX.chunks.filter((x) => x.kind === 'timeline' && x.fromYear === y && x.toYear === y).map((x) => x.text).join('\n');
    expect(at(-3653)).toMatch(/votes to postpone rebuilding the Coruscant Jedi Temple/);
    expect(at(-3653)).not.toMatch(/Shadow Syndicate/);
    expect(at(-3643)).toMatch(/The Exchange is beaten by the Shadow Syndicate/);
    expect(at(-41)).toMatch(/Anakin Skywalker is born/);
  });
  it('the sets of 24 Nov 2026 are in the index, as ruled (D-480)', () => {
    const rows = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline');
    const at = (y: number): string => rows.filter((x) => x.fromYear === y && x.toYear === y).map((x) => x.text).join('\n');
    const t = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline' || x.kind === 'overview').map((x) => x.text).join('\n');
    const has = (text: string, re: RegExp): boolean => re.test(text);
    expect(/Ruled \(Jared|Decisions needed|First Imperial Civil War|\[weak|Blank centuries|activated by General Meetra Surik|nearly six billion/.exec(t)?.[0]).toBeUndefined();
    expect(has(at(-25053), /Corellian and Duros engineers/)).toBe(true);
    expect(has(at(-6900), /Dreypa's own followers seal him in his oubliette/)).toBe(true);
    expect(has(at(-5000), /Sadow emerges victorious|Who won at the funeral/)).toBe(false);
    expect(has(at(-4999), /Ritual of Nathema/)).toBe(true);
    expect(has(at(-3996), /a Sith strategic victory and a tactical defeat/)).toBe(true);
    expect(has(at(-3960), /On Surik's order Bao-Dur then activates the Mass Shadow Generator/)).toBe(true);
    expect(has(at(-3950), /Revan kills Nyriss/)).toBe(true);
    expect(has(at(-3750), /Duel on Coruscant/)).toBe(true);
    expect(has(at(6), /Liberation of Coruscant/)).toBe(true);
    expect(has(at(7), /Ton Phanan died on Halmad/)).toBe(true);
    // Two sections with no year in their heading never reached the index: the series' first year, and the road to Ruusan.
    expect(has(at(-22), /Battle of Christophsis: Admiral Trench blockades/)).toBe(true);
    expect(has(at(-1010), /Brotherhood of Darkness/)).toBe(true);
    // 3,997 BBY is the Krath Holy Crusade's; the Great Sith War is 3,996 BBY alone.
    expect(LORE_INDEX.chunks.some((x) => x.id === 'tl:great-sith-war:-3997_-3997')).toBe(false);
    expect(LORE_INDEX.chunks.some((x) => x.id === 'tl:krath-holy-crusade:-3997_-3997')).toBe(true);
  });
  it('the old timeline is retired where the sets cover it, and its lone events are carried over (D-481)', () => {
    const tl = LORE_INDEX.chunks.filter((x) => x.id.startsWith('tl:'));
    // One telling of each event: the old eras are gone, their own rows with them.
    for (const era of ['great-hyperspace-war', 'sith-exile-old-republic-interwar', 'old-republic-founding-first-conflicts', 'golden-age-of-the-sith', 'republic-era-great-peace', 'clone-wars']) expect(tl.some((x) => x.id.startsWith(`tl:${era}:`)), era).toBe(false);
    const text = tl.map((x) => x.text).join('\n');
    for (const re of [/Xesh is convinced to turn on Daegen Lok/, /massive Force Storm/, /sought to destroy the Force itself/, /Spaarti cloning cylinders in the Mount Tantiss storehouse/, /Darth Vectivus, director of the Jonex mining colony/, /The Jedi Council refuses to train Anakin/, /Vader reveals that he is Luke's father/]) expect(re.test(text), String(re)).toBe(true);
    expect(/carried over from/.exec(text)?.[0]).toBeUndefined();
  });
  it('25-138 ABY: the rulings, the carried rows and no research notes (D-484)', () => {
    const rows = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline');
    const at = (y: number): string => rows.filter((x) => x.fromYear === y && x.toYear === y).map((x) => x.text).join('\n');
    const tl = LORE_INDEX.chunks.filter((x) => x.id.startsWith('tl:') && x.toYear >= 25);
    const has = (y: number, re: RegExp): void => expect(re.test(at(y)), `${y} ${re}`).toBe(true);
    const not = (y: number, re: RegExp): void => expect(re.test(at(y)), `${y} not ${re}`).toBe(false);
    has(27, /Ganner Rhysode dies on Coruscant/); not(28, /Ganner Rhysode/);
    has(29, /Battle of Esfandia/);
    has(35, /the Dark Jedi Welk/); has(36, /The New Essential Chronology is published/);
    has(41, /Natasi Daala, believed dead, returns at the Second Battle of Fondor/); not(40, /Daala/);
    has(44, /Admiral Vitor Reige beats Daala/); has(32, /Metalorn/);
    has(122, /The Ossus Project begins/); has(128, /The One Sith offer to ally/); not(127, /offer to ally/);
    has(130, /head of the Jedi High Council, is killed by Nihl/);
    has(137, /save 20% of the inhabitants/); has(137, /Regent and de facto Emperor, Krayt's death kept secret/);
    has(138, /Mission to Daluuj/); has(138, /Mission to Korriban/); has(138, /brings him back with dark transfer/);
    for (const [y, re] of [[25, /Chewbacca dies saving Anakin Solo/], [25, /Corran Horn is blamed/], [25, /sparks the war between Osarian and Rhommamool/], [40, /sacrifice someone he loves/], [41, /must ask Jaina/], [130, /abandons the Force/], [139, /Jao Assam cuts off his hands/]] as const) has(y, re);
    const text = tl.map((x) => x.text).join('\n');
    expect(/Wookieepedia|Ruled|\[(?:conflict|unclear|note|carried|gray)|great-great|Jedi Grand Master|crowned|unreferenced|year page/.exec(text)?.[0]).toBeUndefined();
    // The undated Fel and Skywalker years stay ahead of the narrator: nothing of Cade's line before it can be known.
    expect(rows.filter((x) => x.fromYear < 115 && x.fromYear >= 45).some((x) => /Cade|Kol Skywalker|Roan Fel/.test(x.text))).toBe(false);
  });
  it('the timeline comes only from the era sets; every old-timeline year has one (D-484)', () => {
    const files = loreFiles().filter((f) => fileKey(f.name) === 'tl');
    expect(files.filter((f) => !/^SW_Timeline_|^SW_Mandalorians_preTCW_vs_TCW/.test(f.name)).map((f) => f.name)).toEqual([]);
    expect(Object.keys(RAW).some((p) => /SW_Legends_Galaxy_Timeline/.test(p))).toBe(false);
    // Each set's span, from its file name ("3700_3600BBY", "19BBY_4ABY").
    const spans = [...new Set(files.map((f) => /^SW_Timeline_(\d+)(BBY|ABY)?_(\d+)(BBY|ABY)_Part/.exec(f.name)?.slice(1, 5).join('|')).filter((x): x is string => !!x))].map((x) => {
      const [a, ua, b, ub] = x.split('|') as [string, string, string, string];
      return parseYearRange(`${a} ${ua || ub} – ${b} ${ub}`)!;
    });
    const OLD = import.meta.glob('/docs-v2/lore/superseded/SW_Legends_Galaxy_Timeline*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
    expect(Object.keys(OLD).length).toBe(5);
    const years = new Set<number>();
    let rows = 0;
    for (const content of Object.values(OLD))
      for (const line of content.split(/\r?\n/)) {
        const date = /^\|\s*([^|]+?)\s*\|/.exec(line)?.[1];
        const r = date ? parseYearRange(date) : null;
        if (!r) continue;
        rows++;
        for (const y of [r.from, r.to]) if (y >= -36453 && y <= 138) years.add(y);
      }
    expect(rows).toBeGreaterThan(300);
    const lone = [...years].filter((y) => !spans.some((s) => s.from <= y && y <= s.to));
    expect(lone).toEqual([]);
    // And an era the narrator reads: none of those years is outside every era heading of the sets.
    const eras = LORE_INDEX.chunks.filter((x) => x.kind === 'overview' || x.kind === 'timeline');
    expect([...years].filter((y) => !eras.some((x) => x.fromYear <= y && y <= x.toYear + 10))).toEqual([]);
  });
  it('every era heading of the sets carries a year, and ABY and decimal dates parse (D-484)', () => {
    const bare: string[] = [];
    const undated: string[] = [];
    for (const { name, content } of loreFiles().filter((f) => /^SW_Timeline_/.test(f.name))) {
      const lines = content.split(/\r?\n/);
      lines.forEach((l, i) => {
        if (/^##\s+[═=]+\s*$/.test(l) && /^##\s+[^═=]/.test(lines[i + 1] ?? '') && !parseYearRange(lines[i + 1]!)) bare.push(`${name}: ${lines[i + 1]}`);
        const date = /^\|\s*([^|]+?)\s*\|/.exec(l)?.[1];
        if (/25_44ABY|45_138ABY/.test(name) && date && /\d/.test(date)) {
          const r = parseYearRange(date);
          if (!r || r.from < 25 || r.to > 139) undated.push(`${name}: ${date}`);
        }
      });
    }
    expect(bare).toEqual([]);
    expect(undated).toEqual([]);
    expect(parseYearRange('25.3 ABY (GrS 60:8)')).toEqual({ from: 25, to: 25 });
    expect(parseYearRange('26.5 ABY')).toEqual({ from: 26, to: 26 });
    expect(parseYearRange('between 45 and 127 ABY (no year)')).toEqual({ from: 45, to: 127 });
    expect(parseYearRange('c. 3,522–c. 3,400 BBY')).toEqual({ from: -3522, to: -3400 });
  });
  it('undated rows of a span are background: inside the span, when named or on the spot, never by the year (D-485)', () => {
    const bg = LORE_INDEX.chunks.filter((x) => x.kind === 'background' && /^tl:undated-or-spanning/.test(x.id));
    expect(bg.length).toBe(7);
    expect(bg.every((x) => x.fromYear >= -3600 && x.toYear === -2001)).toBe(true);
    expect(bg.find((x) => /Rifle Worlds/.test(x.text))!.fromYear).toBe(-3000); // its own span starts inside the section's
    expect(/Noga-ta|Phanius|Kappela|Wookieepedia|\[/.exec(bg.map((x) => x.text).join('\n'))?.[0]).toBeUndefined();
    const base = { canonIds: [], names: [], locationNames: ['coruscant'], year: -3100 };
    const sent = (o: { year?: number; locationNames?: string[]; playerText?: string } = {}) =>
      retrieveLore(LORE_INDEX, { ...base, ...o }, 100000, est).included.filter((s) => s.chunk.kind === 'background');
    expect(sent()).toEqual([]);
    expect(sent({ playerText: normalizeText('I ask about the Barabel War') }).map((s) => s.chunk.title)).toEqual(['Background: The Barabel War']);
    expect(sent({ locationNames: ['taanab'] }).map((s) => /Norulac/.test(s.text))).toEqual([true]);
    // Outside the span (the default campaign year, and after it) it is not sent even when named.
    for (const year of [-3661, -2000]) expect(sent({ year, playerText: normalizeText('I ask about the Barabel War'), locationNames: ['taanab'] })).toEqual([]);
    expect(LORE_INDEX.chunks.some((x) => (x.kind === 'overview' || x.kind === 'timeline') && /Undated Or Spanning/.test(x.title))).toBe(false);
  });
  it('the undated 3,950-3,701 BBY rows are background too, and rows later than the span are left to their own set (D-486)', () => {
    const bg = LORE_INDEX.chunks.filter((x) => x.kind === 'background' && /^tl:undated-within-the-span/.test(x.id));
    expect(bg.length).toBe(17);
    expect(bg.every((x) => x.fromYear >= -3950 && x.toYear <= -3701)).toBe(true);
    const text = bg.map((x) => x.text).join('\n');
    // Nothing tells how or when the span ends, and the three rows after 3,701 BBY are not here.
    expect(/Tasiele|Tol Braga|Chiss|Darth Marr|centuries|Wookieepedia|Gnost-Dural|\[|\b36\d\d/.exec(text)?.[0]).toBeUndefined();
    const sent = (year: number, o: { locationNames?: string[]; playerText?: string } = {}) =>
      retrieveLore(LORE_INDEX, { canonIds: [], names: [], locationNames: [], year, ...o }, 100000, est).included.filter((s) => s.chunk.kind === 'background').map((s) => s.text);
    expect(sent(-3850)).toEqual([]);
    expect(sent(-3850, { locationNames: ['korriban'] }).some((t) => /guards abandoned Korriban/.test(t))).toBe(true);
    expect(sent(-3850, { playerText: normalizeText('What became of HK-47?') }).some((t) => /HK-47/.test(t))).toBe(true);
    expect(sent(-3661, { locationNames: ['korriban'], playerText: normalizeText('What became of HK-47?') })).toEqual([]);
    expect(sent(-3850, { locationNames: ['zakuul'] })).toEqual([]); // the Eternal Empire stands only from 3,756 BBY for certain
    expect(sent(-3740, { locationNames: ['zakuul'] }).length).toBe(1);
    const rows = (y: number): string => LORE_INDEX.chunks.filter((x) => x.kind === 'timeline' && x.fromYear === y && x.toYear === y).map((x) => x.text).join('\n');
    expect(rows(-3699)).toMatch(/Tasiele Shan/);
    expect(rows(-3681)).toMatch(/Tol Braga/);
    // Vitiate: his father at about ten (5,103), Lord at thirteen (5,100).
    expect(rows(-5103)).not.toMatch(/Lord Vitiate/);
    expect(rows(-5100)).toMatch(/thirteen, goes before Marka Ragnos/);
  });
  it('36,453-3,701 BBY: no research wording reaches the narrator; undated centuries are background; decades and "c." parse (D-487)', () => {
    const tl = LORE_INDEX.chunks.filter((x) => x.id.startsWith('tl:') && x.fromYear < -3700);
    const hits = tl.flatMap((x) => {
      const m =
        /Wookieepedia|\byear pages?\b|infobox|unreferenced|\b(?:the|its|his|her|own|Legends) page\b|\barticle\b|sourcebook|\bSWTOR\b|\bKOTOR\b|\bJvS\b|TEGtW|Encyclopedia\b|\(Atlas\)|Into the Void|Force Storm \d|derived|conjectur|counted back|another source|[Oo]lder sources|\bdated (?:to|only|from)\b|novel's|no source|not stated|\[(?:note|conflict|unclear|inferred|Ruled)|\(\s*[;,)]|\d\. \d\d BBY|\bBlank (?:years|centuries|stretches)\b|\.\.|\bBTC\)/.exec(x.text);
      return m ? [`${x.id}: ${m[0]}`] : [];
    });
    expect(hits).toEqual([]);
    expect(parseYearRange('11,600s BBY')).toEqual({ from: -11699, to: -11600 });
    expect(parseYearRange('5,130s BBY')).toEqual({ from: -5139, to: -5130 });
    // Every dated or undated row lands on its own years; none falls back to a whole era of centuries as "this year".
    const wide = tl.filter((x) => x.kind === 'timeline' && x.toYear - x.fromYear >= 1000);
    expect(wide.map((x) => `${x.fromYear}..${x.toYear}`)).toEqual(['-30000..-27000']); // the Gree-Kwa war "of millennia"
    const bg = LORE_INDEX.chunks.filter((x) => x.kind === 'background');
    expect(bg.some((x) => /Belsavis/.test(x.text) && x.fromYear === -35000)).toBe(true);
    expect(bg.every((x) => !x.names.includes('order') && !x.names.includes('republic'))).toBe(true);
    // Overviews: every sentence can be sent inside its own era, and a "c." date does not cut one in two.
    for (const o of tl.filter((x) => x.kind === 'overview')) {
      expect(o.parts!.filter((p) => p.year > o.toYear).map((p) => p.text), o.id).toEqual([]);
      expect(o.parts!.filter((p) => /\bc\.\s*$/.test(p.text)).map((p) => p.text), o.id).toEqual([]);
    }
  });
  it('planets, species and the 3,661 BBY roster: no source tags or remarks reach the narrator (D-486)', () => {
    const chunks = LORE_INDEX.chunks.filter((x) => /^(pl-|sp-|c09p)/.test(x.id));
    const hits = chunks.flatMap((x) => {
      const m =
        /\[(?:inferred|conflict|unclear|BTS|gray|unconfirmed|note|both|date range|other era)|\binfobox|Wookieepedia|\b(?:the|his|her) page\b|\bpage'?s\b|lore batch|\bruling \d|\bD-\d{3}|\bSW_\w|\bnot stated|no source found|not on record|not given|era-sourced|SWTOR|game stat|Uncertainty|playable-ready|character file|Essential Atlas|undated|other-era figure|none (?:found|specific)|;[.;]|\.\.|''/im.exec(x.text);
      return m ? [`${x.id}: ${m[0]}`] : [];
    });
    expect(hits).toEqual([]);
    const at = (id: string): string => LORE_INDEX.chunks.find((x) => x.id === id)!.text;
    // The story around a remark stays.
    expect(at('c09p3b:broysc')).toMatch(/died c\. 3641 BBY on the Wrath's interceptor\. In 3653 BBY: Druckenwell\.$/);
    expect(at('c09p1:zym')).toMatch(/in 3661 BBY he was Grand Master\. In 3653 BBY/);
    expect(at('sp-oldrepublic-p1:twilek')).toMatch(/5\. Culture and homeworld:\n- Ryloth/);
    expect(at('sp-oldrepublic-p1:twilek')).toMatch(/The Hutts hold it in 3661 BBY\./);
    expect(at('pl-oldrepublic-p1:corellia')).toMatch(/2\. Control in 3661 BBY: Republic\./);
    // The places known mostly from the later sources are still offered in 3,661 BBY, and say so.
    const hoth = LORE_INDEX.chunks.find((x) => x.id === 'pl-oldrepublic-p1:hoth')!;
    expect(hoth.parts!.filter((p) => p.year <= -3661).map((p) => p.text).join('')).toMatch(/Places \(most known from about 3643 BBY on\): Dorn Base/);
  });
  it('3,700 BBY-25 ABY: no research wording reaches the narrator, and eras of the same name do not merge (D-485)', () => {
    const tl = LORE_INDEX.chunks.filter((x) => x.id.startsWith('tl:') && x.toYear >= -3700);
    const hits = tl.flatMap((x) => {
      const m = /Wookieepedia|\byear pages?\b|infobox|unreferenced|\b(?:the|its|his|her|own|Legends) page\b|pre-2008|\barticles? (?:says?|calls?|places?|dates?)|novelization|\bcomics\b|\(derived|conjectur|\bdated to\b|no source|next file|developer|\[(?:note|conflict|unclear|inferred|Ruled)|\(\s*[;,)]|citing The|\d\. \d\d BBY/i.exec(x.text);
      return m ? [`${x.id}: ${m[0]}`] : [];
    });
    expect(hits).toEqual([]);
    const people = LORE_INDEX.chunks.map((x) => x.text).join('\n');
    expect(/\(Ruled\b/.exec(people)?.[0]).toBeUndefined();
    // Parts of one era may carry different spans of it; two spans that do not meet are two eras.
    const eras = new Map<string, { from: number; to: number }[]>();
    for (const f of loreFiles().filter((x) => /^SW_Timeline_/.test(x.name)))
      for (const m of f.content.replace(/\r\n/g, '\n').matchAll(/^## ([^═=\n]+?)\s+[—–]\s+([^\n]*\d[^\n]*)$/gm)) {
        const key = slugify(m[1]!);
        eras.set(key, [...(eras.get(key) ?? []), parseYearRange(m[2]!)!]);
      }
    const apart = ([, s]: [string, { from: number; to: number }[]]): boolean => s.some((x) => s.some((y) => x.to < y.from));
    expect([...eras].filter(apart).map(([k]) => k)).toEqual([]);
    const at = (id: string) => LORE_INDEX.chunks.find((x) => x.id === id)!;
    expect(at('tl:the-long-peace:overview').text).not.toMatch(/Revan/);
    expect(at('tl:two-centuries-of-peace:overview').toYear).toBe(-3701);
  });
  it('the 3,996-3,950 BBY rulings and the Vitiate, Nihilus and Surik entries (m8-lore-g check)', () => {
    const rows = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline');
    const at = (y: number): string => rows.filter((x) => x.fromYear <= y && y <= x.toYear).map((x) => x.text).join('\n');
    expect(at(-3950)).toMatch(/where Revan kills Nyriss/);
    expect(at(-3950)).toMatch(/kills two more conspirators/);
    expect(at(-3950)).toMatch(/Old Sith Wars \(4,000–3,950 BBY\)/);
    expect(at(-3950)).toMatch(/Surik leaves for the Unknown Regions/);
    expect(rows.filter((x) => x.fromYear === -3997).every((x) => !/^Great Sith War/.test(x.title))).toBe(true);
    const c = (re: RegExp): string => LORE_INDEX.chunks.filter((x) => re.test(x.id)).map((x) => x.text).join('\n');
    expect(c(/^c06:meetra-surik/)).toMatch(/on her order Bao-Dur activated the Mass Shadow Generator/);
    expect(c(/^c03:tenebrae/)).toMatch(/ritual in 4,999 BBY.*destroyed in 3,630 BBY, his last remnant \(Tenebrae\) in 3,626 BBY/);
    expect(c(/^c08:darth-nihilus/)).toMatch(/every living thing on Katarr but Visas Marr/);
  });
  it('martial cultures: read when named, dated, and never the game-derived lines (D-484, ruling 13)', () => {
    const ma = LORE_INDEX.chunks.filter((x) => x.kind === 'culture');
    expect(ma.length).toBeGreaterThan(60);
    const text = ma.map((x) => `${x.title} ${x.text}`).join('\n');
    expect(/game-derived|kouhun|Soft to Solid|slugthrowers|stops bleeding|Attack Flurry|Piercing Touch|Striking Mist|Bantha rush|Nerve strike|whirlwind|credits|Wookieepedia|\[/.exec(text)?.[0]).toBeUndefined();
    const of = (t: string) => ma.find((x) => x.title === t)!;
    expect(/a Human world the Epicanthix conquered/.test(of('Followers of Palawa').text)).toBe(true);
    expect(/Outsiders learn military versions/.test(of('Echani art').text)).toBe(true);
    expect(/never more than about a thousand/.test(of("Emperor's Royal Guard and its offshoots").text)).toBe(true);
    expect(/After 9 ABY it spread to outsiders/.test(of('Stava').text)).toBe(true);
    expect(/may train ordinary clones/.test(of('Advanced Recon Commandos').text)).toBe(true);
    expect(/joint locks/.test(of('Jedi Temple hand-to-hand training').text) && /joint locks/.test(of('Broken Gate').text)).toBe(true);
    // Only when named, and only as far as the year has come.
    const base = { canonIds: [], names: [], locationNames: ['bunduki', 'coruscant'], year: -3661 };
    const sent = (playerText = '') => retrieveLore(LORE_INDEX, { ...base, playerText }, 3000, est).included.filter((s) => s.chunk.kind === 'culture');
    expect(sent()).toEqual([]);
    const echani = sent(normalizeText('I ask the Echani to teach me'));
    expect(echani.map((s) => s.chunk.title)).toEqual(['Echani']);
    expect(/Begali Uprising|Raskta Lsu/.test(echani[0]!.text)).toBe(false);
    // A common word is not a name.
    expect(sent(normalizeText('I raise my hands and ask where the guard is'))).toEqual([]);
  });
  it('Mandalorians: clan Mandalore with the Sundari enclave (D-482)', () => {
    const rows = LORE_INDEX.chunks.filter((x) => x.kind === 'timeline');
    const at = (y: number): string => rows.filter((x) => x.fromYear === y && x.toYear === y).map((x) => x.text).join('\n');
    const all = LORE_INDEX.chunks.map((x) => x.text).join('\n');
    expect(/kills Vizsla on the surface/.test(at(-42))).toBe(true);
    expect(/kills Vizsla|Vizsla \(killed\)/.test(at(-44))).toBe(false);
    expect(/summons 100 trainers to Kamino, the Cuy'val Dar, 75 of them Mandalorians/.test(at(-30))).toBe(true);
    expect(/Cuy'val Dar/.test(at(-32))).toBe(false);
    expect(/Battle of New Holstice/.test(at(-21)) && /Battle of Zaadja/.test(at(-21))).toBe(true);
    expect(/New Holstice|Zaadja/.test(at(-22))).toBe(false);
    expect(/Spar's Mandalorian Protectors take Sundari and drive Maul out/.test(at(-20))).toBe(true);
    expect(/Fenn Shysa becomes Mand'alor/.test(at(-19))).toBe(true);
    expect(/Siege of Mandalore|Takeover of Mandalore|rise to rule Mandalore|ruling New Mandalorians|Great Clan Wars: clan feuds|Maul dies at Naboo|Death Watch "dissolved"/.exec(all)?.[0]).toBeUndefined();
  });
  it('the slices join the timeline', () => {
    expect(fileKey('SW_Timeline_3700_3600BBY_Part1.md')).toBe('tl');
    expect(fileKey('SW_Timeline_3700_3600BBY_Part3.md')).toBe('tl');
    expect(fileKey('SW_Legends_Galaxy_Timeline.md')).toBeNull(); // retired (D-484)
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
    expect(ids).toContain('tl:the-clone-wars-year-one:overview');
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
    expect(at(-22, 'tl:the-clone-wars-year-one:overview')).not.toContain('Order 66');
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
