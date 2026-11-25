// NPC training hours from about 50, and Force Speed for canon Force users whose sheets leave it out (Jared, 2026-11-25; D-497).
import { describe, expect, it } from 'vitest';
import { archetypeDef } from '../../src/data/archetypes';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { forceSpeedFromPower, namedForceBody, withForceSpeed } from '../../src/data/canon/sheetScale';
import { NPC_TRAINING_HOURS, NPC_WILLPOWER_PACE } from '../../src/data/npcHours';
import { FORM_IDS } from '../../src/data/skills';
import { SPECIES_BY_ID, speciesAgeFromHuman } from '../../src/data/species';
import { absDayFromDate } from '../../src/engine/calendar';
import { HUMAN_YEARS } from '../../src/engine/closedForm';
import { runPace } from '../../src/engine/holds';
import { npcHoursShare, npcNaturalLevel, npcWillpowerStop, npcYears, yearsUntil } from '../../src/engine/npcHours';
import { naturalLevel, npcPerformance } from '../../src/engine/species';
import { computeCreation } from '../../src/features/character/selectors';
import { canonFigureLevelsAt, canonProgressionLineAt, npcLevelsFor } from '../../src/features/npcs/selectors';

const line = (age: number, npc: boolean, speciesId = 'human'): Record<string, number> => {
  const r = computeCreation({ name: 'x', birthDay: 0, startDay: Math.round(age * 368), speciesId, path: 'jedi', archetype: 'jediGuardian', rank: 'master', trainingStartAge: 4, talents: {}, dominantHand: 'right', ...(npc ? { npc: true } : {}) } as Parameters<typeof computeCreation>[0]);
  return r.startingXp;
};

describe('NPC training hours', () => {
  it('a full day to 50, then less and less', () => {
    expect([npcHoursShare(20), npcHoursShare(50)]).toEqual([1, 1]);
    for (let h = 51; h <= 80; h++) expect(npcHoursShare(h), `${h}`).toBeLessThan(npcHoursShare(h - 1));
    expect(npcHoursShare(80)).toBe(NPC_TRAINING_HOURS[NPC_TRAINING_HOURS.length - 1]![1]);
  });

  it('nothing changes before 50, the line still rises after it, and it ends lower; the player is untouched', () => {
    for (const age of [25, 35, 45, 50]) for (const [k, v] of Object.entries(line(age, false))) expect(line(age, true)[k]!, `${age} ${k}`).toBeCloseTo(v, 4);
    const main = (age: number, npc: boolean): number => line(age, npc)['soresu']!;
    for (const age of [60, 70, 80, 90]) {
      expect(main(age, true), `${age}`).toBeLessThan(main(age, false));
      expect(main(age, true), `${age}`).toBeGreaterThan(main(age - 5, true));
    }
  });

  it("an NPC's natural Willpower slows on the same schedule past 50 (D-498); nothing else natural does", () => {
    const human = SPECIES_BY_ID.get('human')!;
    for (const age of [10, 30, 50]) expect(npcNaturalLevel('willpower', human, age), `${age}`).toBe(naturalLevel('willpower', 'human', age));
    const grown = npcNaturalLevel('willpower', human, 60) - npcNaturalLevel('willpower', human, 50);
    const full = naturalLevel('willpower', 'human', 60) - naturalLevel('willpower', 'human', 50);
    // Full at 50, half at 60: three quarters of it over the ten years.
    expect(grown / full).toBeCloseTo(0.75, 2);
    for (const age of [55, 65, 80]) for (const k of ['intelligence', 'charisma', 'strength']) expect(npcNaturalLevel(k, human, age)).toBe(naturalLevel(k, 'human', age));
  });

  it("an old figure without a sheet gains no Willpower from training past 50 (D-499); the player's goes on", () => {
    const gen = (archetype: 'jediGuardian' | 'sithWarrior' | 'jediConsular' | 'soldier', age: number): number => {
      const def = archetypeDef(archetype);
      return npcLevelsFor({ archetype, path: def.path, talents: {}, startAge: def.startAge, warYears: 0, rank: def.path === 'career' ? 'career' : def.path === 'sith' ? 'lord' : 'master', seed: 'x', minionGrade: 1 }, 'human', age, 0)['willpower']!;
    };
    for (const a of ['jediGuardian', 'sithWarrior', 'jediConsular', 'soldier'] as const) {
      expect(gen(a, 50) - gen(a, 45), a).toBeGreaterThan(2);
      // Only the natural baseline's own small growth is left, and it ends at 60.
      expect(gen(a, 60) - gen(a, 50), a).toBeLessThan(1);
      expect(gen(a, 90), a).toBeCloseTo(gen(a, 60), 6);
    }
    expect(line(60, true)['willpower']!).toBeCloseTo(line(50, true)['willpower']!, 4);
    expect(line(60, false)['willpower']!).toBeGreaterThan(line(50, false)['willpower']! * 1.05);
    // Everything else still grows on the falling day.
    for (const k of ['soresu', 'forceControl', 'forceSense']) expect(line(60, true)[k]!, k).toBeGreaterThan(line(50, true)[k]!);
    // Against comparable sheets: 1 to 8 above, no longer 10 to 18.
    for (const id of ['ven-zallow', 'darth-vindican', 'darth-angral', 'bela-kiwiiks', 'orgus-din']) {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      const a = n.anchors.find((x) => x.complete)!;
      const over = canonProgressionLineAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))['willpower']! - a.levels['willpower']!;
      expect(over, id).toBeGreaterThan(0);
      expect(over, id).toBeLessThan(8.5);
    }
  });

  it("Willpower's training stops by years trained, whatever the species (D-500)", () => {
    const def = archetypeDef('jediGuardian');
    const gen = (species: string, age: number, archetype: 'jediGuardian' | 'jediConsular' = 'jediGuardian'): number => npcLevelsFor({ archetype, path: 'jedi', talents: {}, startAge: def.startAge, warYears: 0, rank: 'master', seed: 'x', minionGrade: 1 }, species, age, 0)['willpower']!;
    // No extra decades: past their years the long-lived have no more training than a Human has.
    for (const [species, age] of [['kel_dor', 85], ['kel_dor', 120], ['wookiee', 250], ['yodas_species', 400], ['falleen', 150]] as const) {
      expect(gen(species, age), species).toBeLessThan(gen('human', 60) + 1);
      expect(gen(species, age), species).toBeGreaterThan(gen('human', 60) - 3);
    }
    // A Kel Dor of Tol Braga's and Zym's ages: a Guardian 1 to 8 above their sheets (86, 88); a Consular as a Human Consular.
    for (const [age, sheet] of [[85, 86], [120, 88]] as const) {
      expect(gen('kel_dor', age) - sheet, `${age}`).toBeGreaterThan(1);
      expect(gen('kel_dor', age) - sheet, `${age}`).toBeLessThan(8);
      expect(Math.abs(gen('kel_dor', age, 'jediConsular') - gen('human', 60, 'jediConsular')), `${age}`).toBeLessThan(0.6);
    }
    // Forty-six years from the start at 4, in a Human's case 50; a late start moves it.
    const human = SPECIES_BY_ID.get('human')!;
    expect([npcWillpowerStop(human, 4, 4), npcWillpowerStop(human, 8, 8), npcWillpowerStop(human, 12, 4)]).toEqual([50, 50, 58]);
    const until = yearsUntil(HUMAN_YEARS, 50);
    expect(until.integral('technique', 40, 60)).toBeCloseTo(HUMAN_YEARS.integral('technique', 40, 50), 9);
    expect(until.integral('technique', 55, 60)).toBe(0);
  });

  it("an Inquisitor without a sheet: the line sits 5 below to 3 above the sheets a single pace can reach (D-500)", () => {
    const over = (id: string): number => {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      const a = n.anchors.find((x) => x.complete)!;
      return canonProgressionLineAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))['willpower']! - a.levels['willpower']!;
    };
    for (const id of ['darth-acina', 'darth-vowrawn', 'ragate', 'darth-zash', 'darth-mekhis']) {
      expect(over(id), id).toBeGreaterThan(-5);
      expect(over(id), id).toBeLessThan(3);
    }
    // Never far above: the rest (Baras, Kressh, Jadus, Nox) are exceptional for their age and stay under their sheets.
    for (const id of ['darth-baras', 'exal-kressh', 'darth-jadus', 'darth-nox']) expect(over(id), id).toBeLessThan(0);
    // The player's closed form is the path's measured pace; other paths' NPCs too.
    const xp = (archetype: 'sithInquisitor' | 'sithWarrior', npc: boolean): number => computeCreation({ name: 'x', birthDay: 0, startDay: 30 * 368, speciesId: 'human', path: 'sith', archetype, rank: 'lord', trainingStartAge: 8, talents: {}, dominantHand: 'right', ...(npc ? { npc: true } : {}) } as Parameters<typeof computeCreation>[0]).startingXp['willpower']!;
    expect(xp('sithInquisitor', true) / xp('sithInquisitor', false)).toBeCloseTo(NPC_WILLPOWER_PACE['sithInquisitor']!, 2);
    expect(xp('sithWarrior', true)).toBeCloseTo(xp('sithWarrior', false), 4);
  });

  it("the line under a sheet's Willpower is as it was, so a sheeted figure is the same at every date (D-499)", () => {
    const at = (id: string, bby: number): number => canonFigureLevelsAt(CANON_BY_ID.get(`lore:${id}`)!, bby, absDayFromDate({ year: -bby, month: 1, day: 1 }))['willpower']!;
    expect(at('kao-cen-darach', 3691)).toBeCloseTo(86, 1);
    expect(at('darnala', 3665)).toBeCloseTo(86, 1);
    expect(at('ragate', 3663)).toBeCloseTo(76.09, 1);
  });

  it('a sheeted figure of the old is at its own Willpower in the game', () => {
    for (const id of ['ven-zallow', 'darth-vindican', 'darth-angral', 'bela-kiwiiks', 'orgus-din']) {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      const a = n.anchors.find((x) => x.complete)!;
      expect(canonFigureLevelsAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))['willpower'], id).toBeCloseTo(a.levels['willpower']!, 6);
    }
  });

  it('a long-lived species keeps its full day to its own fifties', () => {
    const kelDor = SPECIES_BY_ID.get('kel_dor')!;
    const own = speciesAgeFromHuman(kelDor, 50);
    const y = npcYears(kelDor, HUMAN_YEARS);
    expect(own).toBeGreaterThan(50);
    expect(y.integral('technique', 20, 50)).toBeCloseTo(HUMAN_YEARS.integral('technique', 20, 50), 6);
    expect(y.integral('technique', 20, 120)).toBeLessThan(HUMAN_YEARS.integral('technique', 20, 120));
  });

  it('the generated line of an old Guardian is within 10 of the sheeted ones', () => {
    for (const id of ['orgus-din', 'ven-zallow', 'kao-cen-darach', 'darth-vindican']) {
      const n = CANON_BY_ID.get(`lore:${id}`)!;
      const a = n.anchors.find((x) => x.complete)!;
      const best = (l: Readonly<Record<string, number>>): number => Math.max(...FORM_IDS.map((f) => l[f] ?? 0));
      expect(best(canonFigureLevelsAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))) - best(a.authored ?? a.levels), id).toBeLessThan(10);
    }
  });
});

describe('Force Speed the sheet leaves out', () => {
  it('rises with Force Control and Force Output', () => {
    for (let p = 10; p <= 140; p += 10) expect(forceSpeedFromPower({ forceControl: p, forceOutput: p })).toBeGreaterThan(forceSpeedFromPower({ forceControl: p - 10, forceOutput: p - 10 }));
    expect(forceSpeedFromPower({ forceControl: 60 })).toBe(forceSpeedFromPower({ forceControl: 60, forceOutput: 60 }));
  });

  it('every canon Force user has Force Speed or a Force Body; nobody else gains it', () => {
    for (const n of CANON_NPCS) {
      const path = archetypeDef(n.archetype).path;
      const a = n.anchors.find((x) => x.complete);
      if (!a) continue;
      const l = canonFigureLevelsAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }));
      const runs = Math.max(l['forceSpeed'] ?? 0, namedForceBody(n));
      if (path === 'jedi' || path === 'sith') expect(runs, n.canonId).toBeGreaterThan(40);
      else if (!l['forceControl']) expect(runs, n.canonId).toBe(0);
    }
    expect(withForceSpeed(null, 'soldier', { strength: 40 })['forceSpeed']).toBeUndefined();
    expect(withForceSpeed(null, 'sithInquisitor', { forceControl: 118, forceOutput: 125, forceSpeed: 80 })['forceSpeed']).toBe(80);
  });

  it('Vitiate and Sidious do not run like ordinary people', () => {
    const v = CANON_BY_ID.get('lore:vitiate')!;
    const l = canonFigureLevelsAt(v, 3660, absDayFromDate({ year: -3660, month: 1, day: 1 }));
    const sidious = withForceSpeed(null, 'sithInquisitor', { forceControl: 118, forceOutput: 125 });
    for (const x of [l, sidious]) expect(runPace({ forceSpeed: x['forceSpeed']!, endurance: 0 })).toBeGreaterThan(4 * runPace({ forceSpeed: 0, endurance: 0 }));
  });

  it('a stat on the sheet is still as written in combat: the derived Force Speed is in the boost taken off it', () => {
    const n = CANON_BY_ID.get('lore:darth-jadus')!;
    const a = n.anchors.find((x) => x.complete)!;
    for (const stat of ['strength', 'agility', 'endurance']) expect(npcPerformance(a.levels, stat), stat).toBeCloseTo(Math.max(a.authored![stat]!, npcPerformance({ ...a.levels, [stat]: 0 }, stat)), 0);
  });
});
