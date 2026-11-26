// Draft sheets for the non-Force skills (m8-skills, D-513; spec/skills-m8.md section 7), approved by Jared on 26 Nov 2026 with
// three changes (Quinn Tactics 58 -> 70; Thrawn Investigation 70 -> 105, reading a culture through its art; R2-D2 Repair 85 -> 90)
// and one addition (Galena Rans's earlier career as a bomber wing commander; m8-traits, D-514). `authored` is what a lore sheet
// prints (SW_Characters_13, _14, OLD_SW_Characters_09, _08: Core values and the "combat rating" lines, on the sheet scale);
// `draft` is every other number, invented from the figure's lore. A draft with a `canonId` is applied as a partial anchor on
// the game scale for that roster figure (data/canonNpcs.ts); the rest wait for their figures to be added. Gunnery and Repair
// anchors (Jared): Wedge Antilles and the Rogue Squadron pilots; Han and Chewbacca on the Falcon's quad guns; Chewbacca,
// Bao-Dur, T3-M4 and R2-D2 for Repair.

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
  /** The roster figure the draft is applied to as a partial anchor (game scale; the draft stats only). Absent = stored. */
  canonId?: string;
  /** The career the draft stands for ends (D-516): from this year on its listed stats hold and grow no further. */
  heldFrom?: { year: number; stats: readonly string[]; note: string };
}

const C13 = 'SW_Characters_13_DarkTimes_GalacticCivilWar';
const C14 = 'SW_Characters_14_NewRepublic_NewJediOrder';
const O09 = 'OLD_SW_Characters_09_GreatGalacticWar_ColdWar';
const P3B = 'SW_Characters_09_GGW_ColdWar_Part3b';

export const SKILL_DRAFTS: readonly SkillDraft[] = [
  { name: 'Grand Admiral Thrawn', year: 9, archetype: 'navalOfficer', authored: { intelligence: 112, charisma: 88, willpower: 92, tactics: 90 }, draft: { piloting: 40, gunnery: 30, blaster: 35, investigation: 105 }, age: null, source: `${C14} (Core sheet; "tactical/naval-command rating ≈ 90"; studies a culture's art)` },
  { name: 'Grand Moff Tarkin', year: 0, archetype: 'navalOfficer', authored: { intelligence: 84, charisma: 80, willpower: 84, tactics: 60 }, draft: { blaster: 30, piloting: 25, investigation: 40 }, age: 64, source: `${C13} supporting table ("Command 60")` },
  { name: 'Mon Mothma', year: 0, archetype: 'politician', authored: { intelligence: 88, charisma: 86, willpower: 86 }, draft: { tactics: 20, investigation: 35, blaster: 5 }, age: 48, source: `${C13} supporting table (founder and political head of the Rebellion)` },
  { name: 'Malavai Quinn', year: -3640, archetype: 'officer', authored: {}, draft: { tactics: 70, intelligence: 60, charisma: 40, blaster: 45, medicine: 40 }, age: 40, source: `${P3B} (born 3,680; a lieutenant at Druckenwell in 3,653; Baras's agent); no lore sheet`, canonId: 'lore:malavai-quinn' },
  { name: 'Ysanne Isard', year: 7, archetype: 'intelAnalyst', authored: {}, draft: { intelligence: 85, investigation: 78, charisma: 60, tactics: 55, blaster: 35 }, age: null, source: 'SW_Timeline_4_25ABY_Part1-2 (Director of Imperial Intelligence; Krytos and the Bacta War); no lore sheet' },
  { name: 'Armand Isard', year: -5, archetype: 'intelAnalyst', authored: {}, draft: { intelligence: 80, investigation: 75, charisma: 55, tactics: 45, blaster: 30 }, age: null, source: 'the timeline (Director of Imperial Intelligence before his daughter); no lore sheet' },
  { name: 'Airen Cracken', year: 4, archetype: 'intelAgent', authored: {}, draft: { stealth: 70, investigation: 75, intelligence: 75, charisma: 60, blaster: 60, melee: 45, tactics: 55 }, age: null, source: "the timeline (head of Alliance Intelligence; a field operative's background); no lore sheet" },
  { name: 'Cipher Nine', year: -3640, archetype: 'intelAgent', authored: { intelligence: 90, charisma: 82, willpower: 88, blaster: 84, stealth: 84 }, draft: { melee: 70, investigation: 72, tactics: 35 }, age: null, source: `${O09} (Core sheet; "Ranged/Stealth combat rating ≈ 84", a CQC specialist)`, canonId: 'lore:cipher-nine' },
  { name: 'Watcher Two (Shara Jenn)', year: -3642, archetype: 'intelAnalyst', authored: {}, draft: { intelligence: 80, investigation: 75, charisma: 55, tactics: 40, blaster: 30 }, age: null, source: `${P3B} (Cipher Nine's handler; Keeper from 3,642); no lore sheet`, canonId: 'lore:shara-jenn' },
  // Galena Rans's earlier career (Jared, 26 Nov 2026): a bomber wing commander in the Republic Navy (the 439th bomber wing,
  // SW_Characters_09_GGW_ColdWar_Part3a). The numbers are Jared's; the date (3,655 BBY, in the Great War at about 30) is invented.
  { name: 'Galena Rans (bomber wing commander)', year: -3655, archetype: 'navalOfficer', authored: {}, draft: { piloting: 60, gunnery: 50, tactics: 45, blaster: 35 }, age: 30, source: 'SW_Characters_09_GGW_ColdWar_Part3a ("veteran of the 439th bomber wing"); the numbers are from Jared', canonId: 'lore:galena-rans', heldFrom: { year: -3653, stats: ['piloting', 'gunnery'], note: 'her flying career ends with the Great Galactic War (Jared, 26 Nov 2026; D-516)' } },
  // ---- Gunnery anchors ----
  { name: 'Wedge Antilles', year: 4, archetype: 'starfighterPilot', authored: { intelligence: 80, charisma: 74, willpower: 82, piloting: 88 }, draft: { gunnery: 86, tactics: 50, repair: 35, blaster: 50 }, age: 25, source: `${C13} supporting table ("Piloting 88"; both Death Star runs)` },
  { name: 'a Rogue Squadron pilot', year: 7, archetype: 'starfighterPilot', authored: {}, draft: { piloting: 75, gunnery: 72, repair: 30, blaster: 40 }, age: 30, source: `${C14} (Rogue Squadron); no sheet` },
  { name: 'Han Solo', year: 0, archetype: 'smuggler', authored: { intelligence: 84, charisma: 86, willpower: 80, piloting: 82, blaster: 82 }, draft: { gunnery: 75, repair: 60 }, age: 29, source: `${C13} (Core sheet; "Ranged/Piloting combat rating ≈ 82"; the Falcon's quad guns)` },
  { name: 'Chewbacca', year: 0, archetype: 'smuggler', authored: { intelligence: 76, charisma: 66, willpower: 80, melee: 84, blaster: 84 }, draft: { repair: 80, gunnery: 75, piloting: 70 }, age: 200, source: `${C13} supporting table ("Melee/Ranged 84"; "ace mechanic and warrior")` },
  // ---- Repair anchors ----
  { name: 'Bao-Dur', year: -3951, archetype: 'engineer', authored: { intelligence: 88 }, draft: { repair: 90, piloting: 30 }, age: null, source: 'SW_Characters_08 (Core sheet; "master engineer": the Mass Shadow Generator)' },
  { name: 'T3-M4', year: -3956, archetype: 'droid', authored: {}, draft: { repair: 75 }, age: null, source: 'SW_Droids_Classes (a T3 utility droid, class two; droidModels T3 base 45); no sheet' },
  { name: 'R2-D2', year: 0, archetype: 'droid', authored: {}, draft: { repair: 90 }, age: null, source: 'SW_Droids_Classes (an R2 astromech, never wiped); no sheet' },
];
