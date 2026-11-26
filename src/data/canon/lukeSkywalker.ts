// Luke Skywalker's line, 4-44 ABY (Jared, 2026-11-25; m8-medicine J4, D-511; m8-droids F3, D-512). The first figure past
// Era 09 with sheets in the game: five complete anchors, one from each of his era sheets (Docs/SWRPG lore/SW_Characters_13,
// _14, _15, _16, _17: RotJ, New Republic, NJO, Legacy of the Force, Fate of the Jedi), so the engine draws one smooth curve
// through them (engine/canonStats.ts) and past the last one the D-503 cap holds it near the FotJ sheet. Apex from 25 ABY (the 4-44 ABY tag map, ruled 25 Nov 2026): the NJO sheet meets all three apex lines
// (duelists.ts TIER_LEVELS.apex: combat 98, Force Control 110, Willpower 105), its Willpower raised 104 -> 105 as ruled.
//
// Mapping as in era09GreatGalacticWar.ts: "Shien/Djem So N" sets both forms; "Telekinesis N (Force Push P%)" sets the
// sub-ability to N x P; "Force Body N (Force Speed P%)" sets forceSpeed; unarmed and martial skill is melee. Years are BBY
// as signed numbers (4 ABY = -4).
import type { CanonEra, CanonNpc } from './types';

const core = (str: number, agi: number, end: number, wil: number, cha: number, int: number) => ({ strength: str, agility: agi, endurance: end, willpower: wil, charisma: cha, intelligence: int });
const force = (fs: number, med: number, fk: number, fc: number, fo: number) => ({ forceSense: fs, meditation: med, forceKnowledge: fk, forceControl: fc, forceOutput: fo });
const pct = (base: number, p: number): number => Math.round(base * p * 10) / 10;

/** The New Republic sheet's date (an estimate): the last dated feat on it, his marriage to Mara Jade, 19 ABY ("by the end of the era"). */
export const LUKE_NR_SHEET_BBY = -19;
/** The Legacy of the Force sheet's date: its era line, "near his lifetime peak here (~40 ABY)" (SW_Characters_16). */
export const LUKE_LOTF_SHEET_BBY = -40;
/** The Fate of the Jedi sheet's date: its era line, "exiled ~43 ABY" (SW_Characters_17; the era runs 43-44 ABY). */
export const LUKE_FOTJ_SHEET_BBY = -43;

const LUKE: CanonNpc = {
  canonId: 'lore:luke-skywalker',
  name: 'Luke Skywalker',
  speciesId: 'human',
  faction: 'jediOrder',
  archetype: 'jediGuardian',
  birthBby: 19,
  birthSource: 'lore',
  unmapped: ['Force Body 78 (Force Speed 76%) at Endor', 'Precognition 88-96%', 'Force Persuasion 65-88%', 'Force Heal 95-102 (Mastered 92-98%)', 'Mind-Walking 100 (FotJ)'],
  note: 'son of Anakin Skywalker; trained by Ben Kenobi (0 BBY) and Yoda (3 ABY, one month: D-452); a self-declared Jedi Knight at Endor (4 ABY); founds the Praxeum on Yavin 4 (11 ABY); Grand Master formally from 36 ABY. The NR sheet is dated 19 ABY (an estimate: the last dated feat on it)',
  facts: { sex: 'male', homeworld: 'Tatooine', group: 'New Jedi Order', teachers: 'Obi-Wan Kenobi; Yoda', alignment: 'light side (the Dark Empire fall, 10-11 ABY, recovered)', source: 'SW_Characters_13_DarkTimes_GalacticCivilWar; SW_Characters_14_NewRepublic_NewJediOrder; SW_Characters_15_NewJediOrder_YuuzhanVongWar; SW_Characters_16_LegacyOfTheForce; SW_Characters_17_FateOfTheJedi' },
  ranks: [
    { role: 'padawan', title: 'Padawan', fromBby: 0, toBby: -4, source: 'SW_Characters_13: trained by Ben (0 BBY) and Yoda (3 ABY)' },
    { role: 'jediKnight', title: 'Jedi Knight', fromBby: -4, toBby: -11, source: 'SW_Characters_13: a self-declared Jedi Knight at Endor (4 ABY)' },
    // The Praxeum is c. 11 ABY, when he is 30: a rank date on record beats the role's minimum age (31) for a canon figure (Jared, 2026-11-25; D-512).
    { role: 'jediMaster', title: 'Jedi Master', fromBby: -11, toBby: -36, source: 'SW_Characters_14: founds the Praxeum, Jedi Master and head of the Order (c. 11 ABY)' },
    { role: 'jediMaster', title: 'Grand Master', fromBby: -36, source: 'SW_Characters_15: formally Grand Master from 36 ABY' },
  ],
  anchors: [
    {
      bby: -4,
      complete: true,
      basis: 'sheet',
      sources: 'SW_Characters_13 (ANH through RotJ): the rising sheet, Endor; Djem So 82 ruled (D-495)',
      levels: { ...core(70, 78, 74, 92, 84, 84), ...force(86, 74, 68, 82, 92), djemSo: 82, shien: 82, shiiCho: 76, ataru: 74, telekinesis: 84, forceSpeed: pct(78, 0.76), mindTrick: 70 },
    },
    {
      bby: LUKE_NR_SHEET_BBY,
      complete: true,
      basis: 'sheet',
      sources: 'SW_Characters_14 (New Republic, founder/Master): the sheet table and its first form line (the summary table: Djem So 96, all seven mastered)',
      levels: { ...core(82, 90, 84, 100, 88, 86), ...force(96, 92, 92, 108, 118), djemSo: 96, shien: 96, soresu: 96, ataru: 92, makashi: 92, niman: 92, shiiCho: 92, juyo: 90, jarKai: 92, telekinesis: 110, forcePush: pct(110, 0.92), forceBarrier: 92, forceAbsorb: pct(92, 0.85), mindTrick: 90 },
    },
    {
      bby: -25,
      complete: true,
      basis: 'sheet',
      sources: 'SW_Characters_15 (NJO, Grand Master): the Yuuzhan Vong War sheet; Willpower 104 -> 105 (Jared, 2026-11-25: meets the apex line)',
      levels: { ...core(88, 98, 90, 105, 88, 88), ...force(98, 94, 96, 120, 128), djemSo: 100, shien: 100, soresu: 100, ataru: 98, makashi: 96, niman: 96, shiiCho: 96, juyo: 94, jarKai: 96, melee: 92, telekinesis: 124, forcePush: pct(124, 0.95), forceBarrier: 96, forceAbsorb: pct(96, 0.9), mindTrick: 90 },
    },
    {
      bby: LUKE_LOTF_SHEET_BBY,
      complete: true,
      basis: 'sheet',
      sources: 'SW_Characters_16 (Legacy of the Force, near-apex Grand Master, "~40 ABY"): the sheet table and its form and Force lines (Jared, 2026-11-25; m8-droids F3)',
      levels: { ...core(90, 100, 92, 106, 88, 90), ...force(100, 96, 100, 126, 134), djemSo: 102, shien: 102, soresu: 102, ataru: 100, makashi: 98, niman: 98, shiiCho: 98, juyo: 96, jarKai: 98, melee: 94, telekinesis: 128, forcePush: pct(128, 0.96), forceBarrier: 98, forceAbsorb: pct(98, 0.92), mindTrick: 92 },
    },
    {
      bby: LUKE_FOTJ_SHEET_BBY,
      complete: true,
      basis: 'sheet',
      sources: 'SW_Characters_17 (Fate of the Jedi, the absolute apex, exiled "~43 ABY"): the sheet table and its form and Force lines; no Mind Trick line (the LotF sheet carries on) (Jared, 2026-11-25; m8-droids F3)',
      levels: { ...core(92, 102, 94, 108, 90, 92), ...force(102, 98, 102, 138, 138), djemSo: 104, shien: 104, soresu: 104, ataru: 102, makashi: 100, niman: 100, shiiCho: 100, juyo: 98, jarKai: 100, melee: 96, telekinesis: 132, forcePush: pct(132, 0.98), forceBarrier: 100, forceAbsorb: pct(100, 0.95) },
    },
  ],
};

export const ERA_LUKE: CanonEra = {
  id: 'luke',
  title: 'Luke Skywalker, 4-44 ABY (the RotJ, New Republic, NJO, Legacy of the Force and Fate of the Jedi sheets)',
  loreFile: 'Docs/SWRPG lore/SW_Characters_14_NewRepublic_NewJediOrder.md',
  fromBby: 19,
  toBby: -44,
  npcs: [LUKE],
};
