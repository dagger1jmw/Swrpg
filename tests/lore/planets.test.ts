// Lore batch 22 (D-402..D-404): the planets and travel files in the lore index, the generated galaxy map, the closed
// worlds and the knowledge rules, and the state-block line.
import { describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { closedWorlds, controlOnRecordAt, mapSide, MENTION_ONLY, OFF_MAP, planetByName, PLANETS, ROUTES_ATTESTED, ROUTES_UNATTESTED } from '../../src/data/galaxyMap';
import { eraRulesAt } from '../../src/data/eraRules';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { LORE_INDEX } from '../../src/lore';
import { buildLoreIndex, fileKey } from '../../src/lore/parse';
import { chunkTextAt, retrieveLore } from '../../src/lore/retrieve';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { stateBlock } from '../../src/turn/context';

const est = makeEstimator(4);

describe('the planets files in the lore index (D-403)', () => {
  const file = `# Planets — Test era (c. 3681–3600 BBY), state at 3661 BBY

## Master table
| Planet | Region |
|---|---|
| Testa | Core |

## A1. Full entries
### Testa
- **Type:** celestial body · **Status:** full
- **1. Location:** region Core Worlds; routes: Test Run. [Testa §infobox](https://x.org)
- **2. Control 3661:** Republic [Testa](https://x.org).
  - 3653 BBY: sacked by the Empire [y](https://y.org)
- **3. World:** climate: Temperate; population: 2 billion (pre-0 BBY); language: Basic.
- **Cross-reference:** see SW_Other.

# Part B
### Test Run
- **Endpoints:** Testa to Probe.
- **Changes:** 3661 BBY: closed. 3660 BBY: reopened.
`;
  const built = buildLoreIndex([{ name: 'SW_Planets_Travel_TestEra_Part1.md', content: file }]);
  const planet = built.chunks.find((c) => c.kind === 'planet')!;
  const route = built.chunks.find((c) => c.kind === 'route')!;

  it('reads planet and route entries, not the tables', () => {
    expect(fileKey('SW_Planets_Travel_OldRepublic_Part6.md')).toBe('pl-oldrepublic-p6');
    expect(built.chunks.map((c) => [c.id, c.kind])).toEqual([
      ['pl-testera-p1:testa', 'planet'],
      ['pl-testera-p1:test-run', 'route'],
    ]);
    expect(planet.locations).toEqual(['testa']);
    expect(route.locations).toEqual([]);
  });
  it('drops citations, population figures and cross-references', () => {
    expect(planet.text).not.toMatch(/https?:|2 billion|Cross-reference/);
    expect(planet.text).not.toMatch(/population/);
    expect(planet.text).toContain('language: Basic.');
  });
  it('sends only what has happened by the current year', () => {
    expect(chunkTextAt(planet, -3661)).not.toContain('sacked');
    expect(chunkTextAt(planet, -3653)).toContain('sacked by the Empire');
    expect(chunkTextAt(route, -3661)).toContain('3661 BBY: closed.');
    expect(chunkTextAt(route, -3661)).not.toContain('reopened');
  });
  it('a planet is sent when the scene is there; a route only when named', () => {
    const base = { canonIds: [], names: [], year: -3661 };
    expect(retrieveLore(built, { ...base, locationNames: ['testa'] }, 3000, est).included.map((s) => s.chunk.kind)).toEqual(['planet']);
    expect(retrieveLore(built, { ...base, locationNames: [] }, 3000, est).included).toEqual([]);
  });
  it('the real files: 182 planets and 10 routes, none leaking the Sacking into 3,661', () => {
    expect(LORE_INDEX.chunks.filter((c) => c.kind === 'planet')).toHaveLength(182);
    expect(LORE_INDEX.chunks.filter((c) => c.kind === 'route')).toHaveLength(10);
    const coruscant = LORE_INDEX.chunks.find((c) => c.id === 'pl-oldrepublic-p1:coruscant')!;
    expect(chunkTextAt(coruscant, -3661)).not.toMatch(/Sacking/);
    expect(chunkTextAt(coruscant, -3653)).toMatch(/Sacking/);
  });
});

describe('the generated galaxy map (D-404)', () => {
  it('has the master table, the background worlds and the routes', () => {
    expect(PLANETS).toHaveLength(182);
    // 427 index rows, less the two the master table already has (Malachor V, Mandellia; D-405).
    expect(MENTION_ONLY.length + OFF_MAP.length).toBe(425);
    expect(OFF_MAP).toHaveLength(19);
    // Every name is read (D-405: the citation stripper had emptied 398 index names).
    expect([...PLANETS, ...MENTION_ONLY].every((p) => p.name.length > 0)).toBe(true);
    expect(OFF_MAP.every((n) => n.length > 0)).toBe(true);
    expect(MENTION_ONLY.find((m) => m.name === 'Varn')).toMatchObject({ grid: 'O-6', sector: 'Quelii sector' });
    expect(MENTION_ONLY.find((m) => m.name === 'Kintan')).toMatchObject({ grid: 'S-9', sector: "Si'Klaata Cluster" });
    expect(ROUTES_ATTESTED.find((r) => r.name === 'Hydian Way')!.blockade).toBe(true);
    expect(ROUTES_UNATTESTED.some((r) => /Pabol Hutta/.test(r.name))).toBe(false);
  });
  it('keeps "not on record" control blank and records control as dated keyframes (3,661, 3,653; D-413)', () => {
    expect(planetByName('Aderalis')!.control).toEqual([]);
    const c = planetByName('Coruscant')!.control;
    expect(c.map((k) => k.bby)).toEqual([3661, 3653]);
    expect(controlOnRecordAt(c, 3653)?.text).toMatch(/Sacking/);
    expect(controlOnRecordAt(c, 3640)?.bby).toBe(3653);
    expect(controlOnRecordAt(c, 3661)?.bby).toBe(3661);
    expect(controlOnRecordAt(c, 3670)).toBeNull();
    expect(planetByName('Dromund Kaas')!.grid).toBe('R-5');
  });
});

describe('closed worlds and what each side knows (D-402 [5]-[8])', () => {
  const names = (side: 'republic' | 'sithEmpire' | 'other', bby = 3661) => closedWorlds(side, bby).map((g) => g.place);
  it('Dromund Kaas is closed to the Republic only, until 3,640', () => {
    expect(names('republic')).toContain('Dromund Kaas');
    expect(names('sithEmpire')).not.toContain('Dromund Kaas');
    expect(names('republic', 3640)).not.toContain('Dromund Kaas');
  });
  it('Ilum is on the Republic\'s charts only; Belsavis is a Republic secret', () => {
    expect(names('sithEmpire')).toContain('Ilum');
    expect(names('republic')).not.toContain('Ilum');
    expect(closedWorlds('republic', 3661).find((g) => g.place === 'Belsavis')!.storyException).toMatch(/SIS/);
  });
  it('the gated list opens on its dates', () => {
    expect(names('other')).toEqual(expect.arrayContaining(['Tython', 'Voss', 'Denova', 'Maelstrom', 'Sebaddon', 'Rishi', 'Nathema', 'Zakuul', 'Odessen', 'Iokath', 'Obus VI', 'Mek-Sha', 'Port Nowhere', 'Ruhnuk', 'Yavin 4', 'Quesh']));
    expect(names('other', 3651)).not.toContain('Tython');
    expect(names('other', 3664)).not.toContain('Ruhnuk'); // cut off only from 3,663
    expect(mapSide('jediOrder')).toBe('republic');
    expect(mapSide('underworld')).toBe('other');
  });
  it('a Republic character on Coruscant sees the closed list; on a closed world, the reason', () => {
    const at = absDayFromDate({ year: -3661, month: 1, day: 1 });
    let s = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c', branchId: 'b', seed: 's', start: { day: at, second: 8 * 3600 },
      character: { name: 'Kael', birthDay: at - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
      startingXp: { soresu: xpForLevel(30) }, rank: 'knight',
    });
    s = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name: 'Dromund Kaas', kind: 'planet', region: 'Esstran sector', description: '', moveHere: true }], { source: 'ai' }).state;
    const t = stateBlock(s, est).text;
    expect(t).toMatch(/Closed worlds this year .*Dromund Kaas/);
    expect(t).toMatch(/Closed world here: Dromund Kaas: the Republic knows the name .* \(allowed with a story reason: capture, or a stolen Imperial navicomputer\)/);
  });
  it('the always-on rule and Odacer-Faustin', () => {
    expect(eraRulesAt(3661, [], []).map((r) => r.id)).toEqual(['places-and-populations']);
    expect(eraRulesAt(3661, ['Odacer-Faustin'], []).map((r) => r.id)).toContain('odacer-faustin');
    expect(eraRulesAt(3655, ['Odacer-Faustin'], []).map((r) => r.id)).not.toContain('odacer-faustin');
  });
});
