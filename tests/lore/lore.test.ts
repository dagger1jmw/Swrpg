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
    expect(satele.text).toContain('descendant of the legendary Revan and Bastila Shan');
    expect(satele.text).not.toMatch(/ForceSense|\|\s*\d|Form ratings|game stats|player-character/);
  });
  it('carries timeline years and skips non-era sections', () => {
    const y3661 = built.chunks.find((c) => c.kind === 'timeline' && c.fromYear === -3661 && c.toYear === -3661)!;
    expect(y3661.text).toContain('Blockade of the Hydian Way begins');
    expect(y3661.locations).toContain('hydian way');
    expect(built.chunks.some((c) => c.text.includes('GALAXY SIM') || c.text.includes('power:58'))).toBe(false);
  });
  it('indexes bench figures as canon entities', () => {
    expect(built.entities.find((e) => e.name === 'Master Ngani Zho')?.aliases).toContain('ngani zho');
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
    const sel = retrieveLore(LORE_INDEX, { ...base, year: -3661, canonIds: ['lore:grand-master-zym'] }, 3000, est);
    expect(sel.included[0]!.chunk.canonId).toBe('lore:grand-master-zym');
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
    expect(sel.included.map((s) => s.chunk.canonId)).toContain('lore:grand-master-zym');
  });
  it('era overviews send only sentences up to the current year (D-98)', () => {
    const at = (year: number, id: string) => retrieveLore(LORE_INDEX, { ...base, year }, 3000, est).included.find((s) => s.chunk.id === id)!.text;
    const ggw = at(-3661, 'tl:great-galactic-war:overview');
    expect(ggw).toContain('Mandalorian Blockade in year 20');
    expect(ggw).not.toContain('Sacking of Coruscant');
    expect(at(-3653, 'tl:great-galactic-war:overview')).toContain('Sacking of Coruscant');
    expect(at(-3675, 'tl:great-galactic-war:overview')).not.toContain('Bothawui');
    expect(at(-22, 'tl:clone-wars:overview')).not.toContain('Order 66');
    expect(at(-3650, 'tl:cold-war:overview')).not.toMatch(/Grand Master|proxy conflicts/);
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
    expect(findCanonEntity(LORE_INDEX, 'zym', -3661)?.canonId).toBe('lore:grand-master-zym');
    expect(findCanonEntity(LORE_INDEX, 'zy', -3661)).toBeNull();
    expect(findCanonEntity(LORE_INDEX, 'zym', -22)).toBeNull();
  });
});
