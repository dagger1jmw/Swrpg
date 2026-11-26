// Luke Skywalker's line, 4-44 ABY (Jared, 2026-11-25; m8-medicine J4; D-511). The first figure past Era 09 with sheets in
// the game: three complete anchors, one from each of his era sheets (Docs/SWRPG lore/SW_Characters_13, _14, _15), so the
// engine draws one smooth curve through them (engine/canonStats.ts) and past the last one the D-503 cap holds it near the
// NJO sheet. Apex from 25 ABY (the 4-44 ABY tag map, ruled 25 Nov 2026): the NJO sheet meets all three apex lines
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

const LUKE: CanonNpc = {
  canonId: 'lore:luke-skywalker',
  name: 'Luke Skywalker',
  speciesId: 'human',
  faction: 'jediOrder',
  archetype: 'jediGuardian',
  birthBby: 19,
  birthSource: 'lore',
  unmapped: ['Force Body 78 (Force Speed 76%) at Endor', 'Precognition 88-92%', 'Force Persuasion 65-88%', 'Force Heal 95-98 (Mastered 92-95%)'],
  note: 'son of Anakin Skywalker; trained by Ben Kenobi (0 BBY) and Yoda (3 ABY, one month: D-452); a self-declared Jedi Knight at Endor (4 ABY); founds the Praxeum on Yavin 4 (11 ABY); Grand Master formally from 36 ABY. The NR sheet is dated 19 ABY (an estimate: the last dated feat on it)',
  facts: { sex: 'male', homeworld: 'Tatooine', group: 'New Jedi Order', teachers: 'Obi-Wan Kenobi; Yoda', alignment: 'light side (the Dark Empire fall, 10-11 ABY, recovered)', source: 'SW_Characters_13_DarkTimes_GalacticCivilWar; SW_Characters_14_NewRepublic_NewJediOrder; SW_Characters_15_NewJediOrder_YuuzhanVongWar' },
  ranks: [
    { role: 'padawan', title: 'Padawan', fromBby: 0, toBby: -4, source: 'SW_Characters_13: trained by Ben (0 BBY) and Yoda (3 ABY)' },
    { role: 'jediKnight', title: 'Jedi Knight', fromBby: -4, toBby: -11, source: 'SW_Characters_13: a self-declared Jedi Knight at Endor (4 ABY)' },
    // The Praxeum is c. 11 ABY, when he is 30; the role's minimum age is 31 (npcGen.config ROLE_MIN_AGE), so the Master span starts at 12.
    { role: 'jediMaster', title: 'Jedi Master', fromBby: -12, toBby: -36, source: 'SW_Characters_14: founds the Praxeum, Jedi Master and head of the Order (c. 11 ABY); from 12, the age the role allows', estimate: true },
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
  ],
};

export const ERA_LUKE: CanonEra = {
  id: 'luke',
  title: 'Luke Skywalker, 4-44 ABY (the RotJ, New Republic and NJO sheets)',
  loreFile: 'Docs/SWRPG lore/SW_Characters_14_NewRepublic_NewJediOrder.md',
  fromBby: 19,
  toBby: -44,
  npcs: [LUKE],
};
