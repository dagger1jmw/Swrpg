// The rulings on the re-measurement report (Jared, 2026-11-22; D-445 to D-450): the Yuuzhan Vong outside the Force
// (D-447). The Temple calibration (D-445) is checked by the lifetime suite; the escalation (D-448) and Electric Judgment
// (D-449) by orderPowers.test.ts; the feint rates (D-450) by tests/turn/feintRates.test.ts. A player character cannot be
// a Vong (not in the species table), so the block lives where the Vong exist: NPC creation and Force combat.
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { isForceXpSkill, isOutsideForce } from '../../src/engine/speed';
import type { CanonNpc } from '../../src/data/canon/types';
import { canonLevelsAt } from '../../src/engine/canonStats';
import { computeCreation, type CreationInput } from '../../src/features/character/creation';
import { FORCE_RICH_FACTOR, NEXUS_SITE_FACTOR } from '../../src/data/progression.config';
import { nexusSitesAt } from '../../src/data/forceNexus';
import { selectTrainingConditions } from '../../src/features/progression/training';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { AVERAGE, ANAKIN, LUKE, OBIWAN, TEMPLE_LIFE } from '../lifetime/profiles';
import { TEST_START_DATE } from '../support/dates';

const START = absDayFromDate(TEST_START_DATE);
const npc = (speciesId: string, archetype: string, path: CreationInput['path'], rank: string): CreationInput => ({
  name: 'Nom',
  birthDay: START - 30 * 368,
  startDay: START,
  speciesId,
  path,
  archetype,
  rank,
  trainingStartAge: path === 'jedi' ? 4 : 16,
  talents: {},
  dominantHand: 'right',
  npc: true,
});

describe('the Yuuzhan Vong are outside the Force (D-447)', () => {
  it('the species is outside the Force; the Force skills and powers are what it cannot gain', () => {
    expect(isOutsideForce('yuuzhanVong')).toBe(true);
    expect(isOutsideForce('human')).toBe(false);
    expect(['forceControl', 'forceSense', 'telekinesis', 'electricJudgment'].every(isForceXpSkill)).toBe(true);
    expect(['soresu', 'willpower', 'melee'].some(isForceXpSkill)).toBe(false);
  });
  it('a generated Vong has no Force skills or powers, whatever the archetype', () => {
    for (const c of [computeCreation(npc('yuuzhanVong', 'yuuzhanVongWarrior', 'career', 'none')), computeCreation(npc('yuuzhanVong', 'jediGuardian', 'jedi', 'knight'))]) {
      expect(Object.keys(c.startingXp).filter(isForceXpSkill)).toEqual([]);
      expect(Object.keys(c.levels).filter(isForceXpSkill)).toEqual([]);
    }
    expect(Object.keys(computeCreation(npc('human', 'jediGuardian', 'jedi', 'knight')).startingXp).filter(isForceXpSkill).length).toBeGreaterThan(0);
  });
});

describe('career Willpower on the real loop; a sourced canon anchor keeps its value (D-446)', () => {
  // A career figure (the soldier archetype) whose generator line now carries the loop's low Willpower: its own sourced
  // Willpower anchor still sets the stat at the anchor's date, and the line fills only the stats no anchor shows.
  const figure: CanonNpc = {
    canonId: 'test:captain',
    name: 'Captain Test',
    speciesId: 'human',
    faction: 'republic',
    archetype: 'soldier',
    birthBby: 3700,
    birthSource: 'lore',
    ranks: [],
    anchors: [{ bby: 3661, complete: false, levels: { willpower: 62, blaster: 70 }, sources: 'a sourced sheet', basis: 'sheet', scale: 'game' }],
  } as unknown as CanonNpc;
  const deps = { growthAt: () => 50, lineAt: () => ({ willpower: 18, blaster: 66, tactics: 40 }), livedAgeAt: (bby: number) => 3700 - bby };
  it('the anchor wins at its date; the line fills the rest', () => {
    const at3661 = canonLevelsAt(figure, 3661, deps);
    expect(at3661['willpower']).toBeCloseTo(62, 6);
    expect(at3661['tactics']).toBeCloseTo(40, 6);
    const bare = canonLevelsAt({ ...figure, anchors: [] }, 3661, deps);
    expect(bare['willpower']).toBeCloseTo(18, 6);
  });
});

describe('the Order home in the calibration (D-445)', () => {
  const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
  const jedi = (year: number, path: 'jedi' | 'outsider' = 'jedi'): GameState =>
    createInitialState<GameState>(REGISTRY, {
      campaignId: 'c1',
      branchId: 'b1',
      seed: 'home',
      start: { day: at(year), second: 8 * 3600 },
      character: { name: 'Kael', birthDay: at(year) - 20 * 368, path, archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
      rank: path === 'jedi' ? 'padawan' : 'none',
    });
  const goTo = (s: GameState, name: string, region: string): GameState =>
    applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state;
  it('the Coruscant Temple x1.15; Tython x1.10 after the move; Dagobah x1.10 (its dark cave gives a Jedi nothing more)', () => {
    expect(selectTrainingConditions(goTo(jedi(-3661), 'the Jedi Temple', 'Coruscant')).forceFactor).toBe(NEXUS_SITE_FACTOR);
    expect(selectTrainingConditions(goTo(jedi(-3650), 'Tython', 'Tython')).forceFactor).toBe(FORCE_RICH_FACTOR);
    expect(selectTrainingConditions(goTo(jedi(3, 'outsider'), 'Dagobah', 'Dagobah')).forceFactor).toBe(FORCE_RICH_FACTOR);
    expect(selectTrainingConditions(goTo(jedi(3), 'the cave on Dagobah', 'Dagobah')).forceFactor).toBe(FORCE_RICH_FACTOR);
  });
  it('the Dagobah cave is a dark site only from about 700 BBY (SW_Dagobah)', () => {
    expect(nexusSitesAt(['the cave on Dagobah'], -800)).toEqual([]);
    expect(nexusSitesAt(['the cave on Dagobah'], -700).map((n) => n.id)).toEqual(['dagobah-cave']);
  });
  it('the calibration profiles live in the Temple; Luke is on Dagobah for three months at 22', () => {
    for (const p of [AVERAGE, OBIWAN, ANAKIN]) expect(p.places).toBe(TEMPLE_LIFE);
    expect(LUKE.places).toEqual([{ from: 22, to: 22.25, name: 'Dagobah', region: 'Dagobah' }]);
  });
});
