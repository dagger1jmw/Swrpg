// Force Sense is a key stat of every Force user (Jared, 2026-11-25; D-495): as written on the sheets, and never more than
// FORCE_SENSE_TRACK.gap levels behind Force Control for anyone else. The player's day loop is tests/lifetime/forceSense.
import { describe, expect, it } from 'vitest';
import { ARCHETYPES, archetypeDef } from '../../src/data/archetypes';
import { CANON_NPCS } from '../../src/data/canonNpcs';
import { FORCE_SENSE_TRACK } from '../../src/data/progression.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { levelExact, xpForLevel } from '../../src/engine/curve';
import { senseGain, senseShare, trackedSenseXp } from '../../src/engine/forceSense';
import { computeCreation } from '../../src/features/character/selectors';
import { canonFigureLevelsAt, npcLevelsFor } from '../../src/features/npcs/selectors';
import type { NpcGen } from '../../src/features/npcs/npcs';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const { gap: GAP, free: FREE } = FORCE_SENSE_TRACK;
const TODAY = absDayFromDate({ year: -3661, month: 1, day: 1 });
const FORCE = ARCHETYPES.filter((a) => a.path !== 'career');

describe('the rule', () => {
  it('a share of Force Control XP, none while it keeps up, all of it at the gap', () => {
    expect([senseShare(50, 50), senseShare(60, 50), senseShare(50 - FREE, 50), senseShare(50 - (FREE + GAP) / 2, 50), senseShare(50 - GAP, 50), senseShare(0, 50)]).toEqual([0, 0, 0, 0.5, 1, 1]);
    expect(senseGain(0, 100, 0)).toBe(0);
    expect(senseGain(xpForLevel(40), xpForLevel(50), 7)).toBeCloseTo(7, 9);
  });
  it('with no training of its own it is never further behind than the gap, and its own training always adds', () => {
    for (const c of [10, 30, 60, 90, 130]) {
      const bare = levelExact(trackedSenseXp([{ control: xpForLevel(c), own: 0 }]));
      expect(c - bare).toBeLessThanOrEqual(GAP);
      expect(c - bare).toBeGreaterThan(0);
      const own = levelExact(trackedSenseXp([{ control: xpForLevel(c), own: xpForLevel(c * 0.5) }]));
      expect(own).toBeGreaterThan(bare);
    }
    // A seer leads: more of its own than Force Control.
    expect(levelExact(trackedSenseXp([{ control: xpForLevel(40), own: xpForLevel(60) }]))).toBeGreaterThanOrEqual(60 - 1e-6);
  });
});

describe('canon figures', () => {
  it('every Force user with a sheet has its Force Sense as written, the Sith among them', () => {
    let n = 0;
    for (const c of CANON_NPCS.filter((x) => archetypeDef(x.archetype).path !== 'career')) {
      for (const a of c.anchors.filter((x) => x.complete)) {
        const sheet = (a.authored ?? a.levels)['forceSense'];
        if (sheet === undefined) continue;
        n++;
        expect(canonFigureLevelsAt(c, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))['forceSense'], c.canonId).toBeCloseTo(sheet, 6);
      }
    }
    expect(n).toBeGreaterThan(30);
  });
});

describe('generated Force users', () => {
  const at = (archetype: string, rank: string, age: number, seed: string, talents: NpcGen['talents'] = {}): Readonly<Record<string, number>> => {
    const d = archetypeDef(archetype);
    return npcLevelsFor({ archetype, path: d.path, talents, startAge: d.startAge, warYears: 0, rank, seed, minionGrade: null }, 'human', age, TODAY);
  };
  it.each(FORCE.map((a) => a.id))('%s: at Knight, Master and High Master Force Sense is within the gap of Force Control', (id) => {
    const sith = archetypeDef(id).path === 'sith';
    for (const [rank, age] of [['knight', 26], ['knight', 32], ['master', 45], ['master', 65], ['master', 80]] as const)
      for (let i = 0; i < 12; i++)
        for (const t of [{}, { force: 'prodigy' } as const]) {
          const l = at(id, sith ? 'lord' : rank, age, `fs${id}${i}`, t);
          expect(l['forceControl']! - (l['forceSense'] ?? 0), `${id} ${rank} ${age} ${i}`).toBeLessThanOrEqual(GAP + 1e-6);
        }
    // Nothing like the old 22 for a Warrior of Malgus's age.
    if (id === 'sithWarrior') expect(at(id, 'lord', 45, 'm')['forceSense']!).toBeGreaterThan(30);
  });
  it('outsiders too', () => {
    const r = computeCreation({ name: 'o', birthDay: TODAY - 40 * 368, startDay: TODAY, speciesId: 'human', path: 'outsider', archetype: 'jediGuardian', rank: 'none', trainingStartAge: 20, talents: {}, dominantHand: 'right' } as Parameters<typeof computeCreation>[0]);
    expect(r.errors).toEqual([]);
    expect(r.levels['forceControl']! - r.levels['forceSense']!).toBeLessThanOrEqual(GAP);
  });
  it('without the Force it stays at 0', () => {
    for (const a of ARCHETYPES.filter((x) => x.path === 'career')) {
      expect(a.paces.knight?.['forceSense'], a.id).toBeUndefined();
      const d = archetypeDef(a.id);
      const l = npcLevelsFor({ archetype: a.id, path: 'career', talents: {}, startAge: d.startAge, warYears: 0, rank: 'career', seed: `c${a.id}`, minionGrade: null }, 'human', 50, TODAY);
      expect(l['forceSense'] ?? 0, a.id).toBe(0);
    }
  });
});

describe('the player', () => {
  const game = (path: 'sith' | 'career'): GameState =>
    createInitialState<GameState>(REGISTRY, {
      campaignId: 'c1',
      branchId: 'b1',
      seed: 'fs',
      start: { day: TODAY, second: 0 },
      character: { name: 'K', birthDay: TODAY - 25 * 368, path, archetype: path === 'sith' ? 'sithWarrior' : 'soldier', trainingStartAge: 17 } as never,
      startingXp: { forceControl: xpForLevel(40) },
      rank: path === 'sith' ? 'lord' : 'career',
    });
  const drill = (s: GameState): GameState => {
    const r = applyEvents(REGISTRY, s, [{ type: 'activityResolved', activityId: 'forceControlDrill', primaries: ['forceControl'], hours: 2, windowHours: { forceControl: 2 }, credited: { forceControl: 5 }, practiceHours: { forceControl: 2 }, fatigueWillpower: 0, meditation: false, day: { hoursByActivity: {}, postWindow: 0, lastPhysicalHeavy: false } }], { source: 'engine' });
    expect(r.rejected).toEqual([]);
    return r.state;
  };
  it('a Force Control drill trains a Sith in Force Sense too, outside the pace window; not a soldier', () => {
    const s = drill(game('sith'));
    expect(s.progression.skills['forceSense']!.xp).toBeCloseTo(5, 6);
    expect(s.progression.skills['forceSense']!.lastPracticedDay).toBe(TODAY);
    expect(s.progression.paceWindow['forceSense']).toBeUndefined();
    const c = drill(game('career'));
    expect(selectLevelExact(c, 'forceSense')).toBe(0);
  });
});
