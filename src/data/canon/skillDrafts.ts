// Draft sheets for the non-Force skills (m8-skills, D-513; spec/skills-m8.md section 7): key figures with no game sheet,
// for Jared's review. NOT applied: nothing reads them for a figure's levels; the tests and the report compare the archetype
// lines against them. `authored` is what a lore sheet prints (SW_Characters_13, _14, OLD_SW_Characters_09, _08: Core values
// and the "combat rating" lines, on the sheet scale); `draft` is every other number, invented from the figure's lore. Gunnery
// and Repair anchors (Jared): Wedge Antilles and the Rogue Squadron pilots; Han and Chewbacca on the Falcon's quad guns;
// Chewbacca, Bao-Dur, T3-M4 and R2-D2 for Repair.

export interface SkillDraft {
  name: string;
  /** The date the sheet stands for (campaign year: negative = BBY). */
  year: number;
  /** The archetype the line would use. */
  archetype: string;
  /** From a lore sheet (sheet scale). */
  authored: Readonly<Record<string, number>>;
  /** Invented from the lore, for review. */
  draft: Readonly<Record<string, number>>;
  /** The figure's age at the date, where the lore gives or implies it (for the line comparison). */
  age: number | null;
  source: string;
  review: true;
}

const C13 = 'SW_Characters_13_DarkTimes_GalacticCivilWar';
const C14 = 'SW_Characters_14_NewRepublic_NewJediOrder';
const O09 = 'OLD_SW_Characters_09_GreatGalacticWar_ColdWar';
const P3B = 'SW_Characters_09_GGW_ColdWar_Part3b';

export const SKILL_DRAFTS: readonly SkillDraft[] = [
  { name: 'Grand Admiral Thrawn', year: 9, archetype: 'navalOfficer', authored: { intelligence: 112, charisma: 88, willpower: 92, tactics: 90 }, draft: { piloting: 40, gunnery: 30, blaster: 35, investigation: 70 }, age: null, source: `${C14} (Core sheet; "tactical/naval-command rating ≈ 90"; studies a culture's art)`, review: true },
  { name: 'Grand Moff Tarkin', year: 0, archetype: 'navalOfficer', authored: { intelligence: 84, charisma: 80, willpower: 84, tactics: 60 }, draft: { blaster: 30, piloting: 25, investigation: 40 }, age: 64, source: `${C13} supporting table ("Command 60")`, review: true },
  { name: 'Mon Mothma', year: 0, archetype: 'politician', authored: { intelligence: 88, charisma: 86, willpower: 86 }, draft: { tactics: 20, investigation: 35, blaster: 5 }, age: 48, source: `${C13} supporting table (founder and political head of the Rebellion)`, review: true },
  { name: 'Malavai Quinn', year: -3640, archetype: 'officer', authored: {}, draft: { tactics: 58, intelligence: 60, charisma: 40, blaster: 45, medicine: 40 }, age: 40, source: `${P3B} (born 3,680; a lieutenant at Druckenwell in 3,653; Baras's agent); no lore sheet`, review: true },
  { name: 'Ysanne Isard', year: 7, archetype: 'intelAnalyst', authored: {}, draft: { intelligence: 85, investigation: 78, charisma: 60, tactics: 55, blaster: 35 }, age: null, source: 'SW_Timeline_4_25ABY_Part1-2 (Director of Imperial Intelligence; Krytos and the Bacta War); no lore sheet', review: true },
  { name: 'Armand Isard', year: -5, archetype: 'intelAnalyst', authored: {}, draft: { intelligence: 80, investigation: 75, charisma: 55, tactics: 45, blaster: 30 }, age: null, source: 'the timeline (Director of Imperial Intelligence before his daughter); no lore sheet', review: true },
  { name: 'Airen Cracken', year: 4, archetype: 'intelAgent', authored: {}, draft: { stealth: 70, investigation: 75, intelligence: 75, charisma: 60, blaster: 60, melee: 45, tactics: 55 }, age: null, source: "the timeline (head of Alliance Intelligence; a field operative's background); no lore sheet", review: true },
  { name: 'Cipher Nine', year: -3640, archetype: 'intelAgent', authored: { intelligence: 90, charisma: 82, willpower: 88, blaster: 84, stealth: 84 }, draft: { melee: 70, investigation: 72, tactics: 35 }, age: null, source: `${O09} (Core sheet; "Ranged/Stealth combat rating ≈ 84", a CQC specialist)`, review: true },
  { name: 'Watcher Two (Shara Jenn)', year: -3642, archetype: 'intelAnalyst', authored: {}, draft: { intelligence: 80, investigation: 75, charisma: 55, tactics: 40, blaster: 30 }, age: null, source: `${P3B} (Cipher Nine's handler; Keeper from 3,642); no lore sheet`, review: true },
  // ---- Gunnery anchors ----
  { name: 'Wedge Antilles', year: 4, archetype: 'starfighterPilot', authored: { intelligence: 80, charisma: 74, willpower: 82, piloting: 88 }, draft: { gunnery: 86, tactics: 50, repair: 35, blaster: 50 }, age: 25, source: `${C13} supporting table ("Piloting 88"; both Death Star runs)`, review: true },
  { name: 'a Rogue Squadron pilot', year: 7, archetype: 'starfighterPilot', authored: {}, draft: { piloting: 75, gunnery: 72, repair: 30, blaster: 40 }, age: 30, source: `${C14} (Rogue Squadron); no sheet`, review: true },
  { name: 'Han Solo', year: 0, archetype: 'smuggler', authored: { intelligence: 84, charisma: 86, willpower: 80, piloting: 82, blaster: 82 }, draft: { gunnery: 75, repair: 60 }, age: 29, source: `${C13} (Core sheet; "Ranged/Piloting combat rating ≈ 82"; the Falcon's quad guns)`, review: true },
  { name: 'Chewbacca', year: 0, archetype: 'smuggler', authored: { intelligence: 76, charisma: 66, willpower: 80, melee: 84, blaster: 84 }, draft: { repair: 80, gunnery: 75, piloting: 70 }, age: 200, source: `${C13} supporting table ("Melee/Ranged 84"; "ace mechanic and warrior")`, review: true },
  // ---- Repair anchors ----
  { name: 'Bao-Dur', year: -3951, archetype: 'engineer', authored: { intelligence: 88 }, draft: { repair: 90, piloting: 30 }, age: null, source: 'SW_Characters_08 (Core sheet; "master engineer": the Mass Shadow Generator)', review: true },
  { name: 'T3-M4', year: -3956, archetype: 'droid', authored: {}, draft: { repair: 75 }, age: null, source: 'SW_Droids_Classes (a T3 utility droid, class two; droidModels T3 base 45); no sheet', review: true },
  { name: 'R2-D2', year: 0, archetype: 'droid', authored: {}, draft: { repair: 85 }, age: null, source: 'SW_Droids_Classes (an R2 astromech, never wiped); no sheet', review: true },
];
