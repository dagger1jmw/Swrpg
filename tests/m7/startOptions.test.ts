// M7 start options, placements, prison links, era rules and the board warning (D-401).
import { describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { placementsAt } from '../../src/data/canonPlacements';
import { eraRulesAt } from '../../src/data/eraRules';
import { SPECIES_BY_ID } from '../../src/data/species';
import { alienRole, checkStart, START_OPTIONS, startOptionsFor } from '../../src/data/startOptions';
import { canonOffBoard } from '../../src/engine/canonRoster';
import { xpForLevel } from '../../src/engine/curve';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { createMemoryStorage } from '../../src/persist/storage';
import { createCampaign, startErrors, type NewCampaignInput } from '../../src/turn/campaign';
import { stateBlock } from '../../src/turn/context';
import { absDayFromDate } from '../../src/engine/calendar';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const fresh = (year: number, path: 'jedi' | 'sith' = 'jedi'): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 14 * 368, path, archetype: path === 'jedi' ? 'jediGuardian' : 'sithWarrior', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(20) },
    rank: path === 'jedi' ? 'padawan' : 'acolyte',
  });
const goTo = (s: GameState, name: string, region: string): GameState =>
  applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state;
const est = makeEstimator(4);

describe('start options (D-401 [2])', () => {
  it('17 starts for 3,661 BBY, none a SWTOR protagonist, each with places, threads and a premise', () => {
    expect(startOptionsFor(-3661)).toHaveLength(START_OPTIONS.length);
    expect(startOptionsFor(-3650)).toEqual([]);
    for (const o of START_OPTIONS) {
      expect(o.places.length, o.id).toBeGreaterThan(0);
      expect(o.threads.length, o.id).toBeGreaterThan(0);
      expect(o.premise.length, o.id).toBeGreaterThan(20);
      expect(o.title + o.premise, o.id).not.toMatch(/Hero of Tython|Barsen'thor|Emperor's Wrath|Darth Nox|Cipher Nine|Grand Champion|Voidhound|Havoc Squad commander|Outlander/);
    }
  });
  it('a start checks path, rank and archetype', () => {
    const jedi = START_OPTIONS.find((o) => o.id === 'jedi-temple')!;
    expect(checkStart(jedi, { optionId: jedi.id, path: 'jedi', rank: 'padawan', archetype: 'jediGuardian', speciesId: 'human', imperialBorn: false })).toEqual([]);
    expect(checkStart(jedi, { optionId: jedi.id, path: 'sith', rank: 'acolyte', archetype: 'sithWarrior', speciesId: 'human', imperialBorn: false }).join()).toMatch(/takes the jedi path/);
  });
  it('Purebloods need an Imperial origin (D-401 [10])', () => {
    const c = (id: string, imperialBorn = false) => {
      const o = START_OPTIONS.find((x) => x.id === id)!;
      return checkStart(o, { optionId: id, path: o.paths[0]!, rank: o.ranks[0] ?? 'career', archetype: o.archetypes[0] ?? (o.paths[0] === 'jedi' ? 'jediGuardian' : 'sithWarrior'), speciesId: 'sith_pureblood', imperialBorn });
    };
    expect(c('korriban-acolyte')).toEqual([]);
    expect(c('jedi-temple').join()).toMatch(/Imperial origin/);
    expect(c('republic-trooper').join()).toMatch(/Imperial origin/);
    expect(c('underworld-smuggler').join()).toMatch(/Imperial-born/);
    expect(c('underworld-smuggler', true)).toEqual([]);
    const free: NewCampaignInput = { name: 'X', birthDate: { year: -3675, month: 1, day: 1 }, startDate: { year: -3661, month: 1, day: 1 }, startSecond: 0, creation: { speciesId: 'sith_pureblood', path: 'jedi', archetype: 'jediGuardian', rank: 'padawan', trainingStartAge: 4, talents: {}, dominantHand: 'right' } };
    expect(startErrors(free).join()).toMatch(/Imperial origin/);
  });
  describe('alien Imperial starts (D-388 [10], D-407)', () => {
    const c = (id: string, speciesId: string, bby?: number) => {
      const o = START_OPTIONS.find((x) => x.id === id)!;
      const check = { optionId: id, path: o.paths[0]!, rank: o.ranks[0] ?? 'career', archetype: o.archetypes[0] ?? 'sithWarrior', speciesId, imperialBorn: false, ...(bby ? { bby } : {}) };
      return { errors: checkStart(o, check), role: alienRole(o, check) };
    };
    it('no aliens in the regular forces in 3,661, with a clear refusal naming the routes', () => {
      expect(c('imperial-soldier', 'human').errors).toEqual([]);
      const r = c('imperial-soldier', 'twilek').errors.join();
      expect(r).toMatch(/admit only Humans in 3,661 BBY/);
      expect(r).toMatch(/Chiss agent or liaison.*slave sent to Korriban.*informer/);
      expect(c('imperial-soldier', 'chiss').errors.join()).toMatch(/admit only Humans/);
      expect(c('imperial-officer', 'zabrak').errors.join()).toMatch(/except Chiss liaisons/);
    });
    it('the allowed routes: a Chiss liaison or agent, a slave sent to Korriban, an informer', () => {
      expect(c('imperial-officer', 'chiss')).toMatchObject({ errors: [], role: { title: 'A Chiss liaison' } });
      expect(c('imperial-agent', 'chiss')).toMatchObject({ errors: [], role: { title: 'A Chiss agent' } });
      expect(c('imperial-agent', 'twilek')).toMatchObject({ errors: [], role: { title: 'An informer, not an officer' } });
      expect(c('korriban-slave', 'twilek')).toEqual({ errors: [], role: null });
      expect(c('imperial-agent', 'human').role).toBeNull();
    });
    it('near-Humans count as aliens; Imperial-born is Humans and Purebloods only; the acolyte start stays open (D-411 [6])', () => {
      for (const sp of ['miraluka', 'rattataki']) expect(c('imperial-soldier', sp).errors.join(), sp).toMatch(/admit only Humans/);
      expect(c('kaas-imperial-born', 'twilek').errors.join()).toMatch(/Humans and Sith Purebloods.*slave-born route/);
      expect(c('kaas-imperial-born', 'human').errors).toEqual([]);
      expect(c('kaas-imperial-born', 'sith_pureblood').errors).toEqual([]);
      expect(c('korriban-acolyte', 'twilek').errors).toEqual([]);
    });
    it('Purebloods keep their own rule; after Ilum (3,640) aliens are admitted', () => {
      expect(c('imperial-soldier', 'sith_pureblood').errors).toEqual([]);
      expect(c('imperial-soldier', 'twilek', 3639).errors).toEqual([]);
    });
    it('creation refuses it, and an informer start opens the role as a thread', async () => {
      const base = { name: 'Vex', birthDate: { year: -3685, month: 1, day: 1 }, startDate: { year: -3661, month: 1, day: 1 }, startSecond: 0 };
      const soldier: NewCampaignInput = { ...base, creation: { speciesId: 'twilek', path: 'career', archetype: 'soldier', rank: 'career', trainingStartAge: 16, talents: {}, dominantHand: 'right' }, start: { optionId: 'imperial-soldier', imperialBorn: false } };
      expect(startErrors(soldier).join()).toMatch(/admit only Humans/);
      const agent: NewCampaignInput = { ...soldier, start: { optionId: 'imperial-agent', imperialBorn: false } };
      expect(startErrors(agent)).toEqual([]);
      const s = (await createCampaign(REGISTRY, createMemoryStorage(), agent, { campaignId: 'c', branchId: 'b' }, '2026-11-22T00:00:00Z')).state;
      expect(Object.values(s.threads.byId).map((t) => t.title)).toContain('An informer, not an officer');
    });
  });
  it('a new campaign with a start seeds its places (the character in the innermost) and threads', async () => {
    const input: NewCampaignInput = {
      name: 'Kael',
      birthDate: { year: -3675, month: 1, day: 1 },
      startDate: { year: -3661, month: 1, day: 1 },
      startSecond: 7 * 3600,
      creation: { speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'padawan', trainingStartAge: 4, talents: {}, dominantHand: 'right' },
      start: { optionId: 'jedi-temple', imperialBorn: false },
    };
    const s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c', branchId: 'b' }, '2026-11-22T00:00:00Z')).state;
    const here = s.locations.byId[s.locations.currentId!]!;
    expect(here.name).toBe('Jedi Temple');
    expect(s.locations.byId[here.parentId!]!.name).toBe('Coruscant');
    expect(Object.values(s.threads.byId).map((t) => t.title)).toEqual(['The Hydian Way blockade', 'The Council and the strike near Devaron']);
    expect(s.character.start).toEqual({ optionId: 'jedi-temple', faction: 'jediOrder', imperialBorn: false });
  });
});

describe('placements and the board here (D-401 [3], [4])', () => {
  it('only figures on record: Korriban staff, Karagga on Nal Hutta, Ngani Zho and Theron on Monastery', () => {
    expect(placementsAt(['Korriban'], 3661).map((p) => p.name).sort()).toEqual(['Overseer Ragate', 'Overseer Tremel', 'Spindrall']);
    expect(placementsAt(['Nal Hutta'], 3661).map((p) => p.name)).toEqual(['Karagga the Unyielding']);
    expect(placementsAt(['Monastery'], 3661).map((p) => p.canonId)).toEqual(['lore:ngani-zho', 'lore:theron-shan']);
    expect(placementsAt(['Coruscant'], 3661)).toEqual([]);
  });
  it('the narrator sees the figures at the current location only', () => {
    const k = stateBlock(goTo(fresh(-3661, 'sith'), 'Korriban', 'Horuset system'), est).text;
    expect(k).toMatch(/Canon figures here .*Overseer Tremel/);
    expect(stateBlock(goTo(fresh(-3661), 'Coruscant', 'Core Worlds'), est).text).not.toMatch(/Canon figures here/);
  });
  it('a warning when a story NPC carries the name of an off-board figure', () => {
    let s = goTo(fresh(-3661), 'Coruscant', 'Core Worlds');
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Kao Cen Darach', species: 'zabrak', faction: 'jediOrder', role: 'jediMaster', ageApprox: 60, description: '' }], { source: 'ai' }).state;
    expect(stateBlock(s, est).text).toMatch(/Board warning: Kao Cen Darach .* is not the canon Kao Cen Darach, who is dead this year/);
  });
});

describe('imprisoned figures at their prison (D-401 [5])', () => {
  const link = (s: GameState) => {
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Styrak', species: 'human', faction: 'sith', role: 'sithLord', ageApprox: 60, description: '' }], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Styrak')!.id;
    return applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: id, canonId: 'lore:styrak' }], { source: 'engine' }).state.npcs.byId[id]!;
  };
  it('links on Belsavis as a prisoner, and is refused elsewhere', () => {
    const there = link(goTo(fresh(-3661), 'Belsavis', 'Belsavis'));
    expect([there.canonId, there.status]).toEqual(['lore:styrak', 'imprisoned']);
    expect(link(goTo(fresh(-3661), 'Coruscant', 'Core Worlds')).canonId).toBeNull();
  });
  it('the Dread Masters are imprisoned through 3,668-3,642, not only in the 3,661 snapshot', () => {
    expect(canonOffBoard(CANON_BY_ID.get('lore:styrak')!, 3650)).toBe('imprisoned');
    expect(canonOffBoard(CANON_BY_ID.get('lore:styrak')!, 3640)).toBeNull();
  });
});

describe('era rules (D-401 [8])', () => {
  it('sent for the place or a faction in play only', () => {
    expect(eraRulesAt(3661, ['Coruscant'], []).map((r) => r.id)).toEqual(['places-and-populations', 'coruscant-shortage', 'coruscant-security', 'coruscant-places']);
    expect(eraRulesAt(3661, ['Tatooine'], ['jediOrder']).map((r) => r.id)).toEqual(['places-and-populations', 'tatooine-rule', 'jedi-life']);
    expect(eraRulesAt(3661, ['Alderaan'], ['republic']).map((r) => r.id)).toEqual(['places-and-populations']);
  });
  it('a Jedi on Coruscant gets the Jedi and Coruscant rules in the state block', () => {
    const t = stateBlock(goTo(fresh(-3661), 'Coruscant', 'Core Worlds'), est).text;
    expect(t).toMatch(/Era rule: Show shortages/);
    expect(t).toMatch(/Era rule: Jedi of this era: Padawans wear plain tunics and have no braid/);
    expect(t).not.toMatch(/Era rule: No aliens serve/);
  });
});

describe('species rulings (D-401 [12], [13])', () => {
  it('clear size outliers have house-default body scales', () => {
    for (const [id, scale] of [['hutt', 1.5], ['jawa', 0.6], ['yodas_species', 0.5], ['talz', 1.25], ['houk', 1.25]] as const) {
      expect([SPECIES_BY_ID.get(id)!.bodyScale, SPECIES_BY_ID.get(id)!.bodyScaleSource], id).toEqual([scale, 'house default']);
    }
    expect(SPECIES_BY_ID.get('kel_dor')!.bodyScale).toBe(1);
  });
  it('the ten figures carry their species', () => {
    const sp = (id: string) => CANON_BY_ID.get(`lore:${id}`)!.speciesId;
    expect(['nadia-grell', 'darth-karrid', 'khem-val', 'xalek', 'tanno-vik', 'yuun', 'fideltin-rusk', 'ula-vii', 'broonmark', 'gault-rennow'].map(sp)).toEqual(['sarkhai', 'falleen', 'dashade', 'kaleesh', 'weequay', 'gand', 'chagrian', 'epicanthix', 'talz', 'devaronian']);
  });
  it('the SWTOR protagonists are out of 3,681-3,653 (D-401 [6]); Theron stays', () => {
    for (const id of ['emperor-wrath', 'darth-nox', 'cipher-nine', 'the-grand-champion', 'voidhound', 'meteor']) {
      expect(canonOffBoard(CANON_BY_ID.get(`lore:${id}`)!, 3661), id).toBe('unavailable');
      expect(canonOffBoard(CANON_BY_ID.get(`lore:${id}`)!, 3653), id).toBe('unavailable'); // through 3,653 (D-411 [4])
    }
    expect(canonOffBoard(CANON_BY_ID.get('lore:theron-shan')!, 3661)).toBeNull();
  });
});
