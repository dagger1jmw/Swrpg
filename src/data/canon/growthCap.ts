// How far a canon figure's stats rise past its last sheet (Jared, 2026-11-25; D-503, D-504; every number invented): at most so
// much, over so many years, the most of it early; then it holds. An early-career sheet has more to come.
export const PAST_SHEET = { most: 5, early: 15, years: 20, earlyBefore: 30 } as const;

/**
 * The class heroes have an early-career sheet whatever age it is read at (a reading: the ruling names them, and their birth
 * years, 28 to 35 at the sheet, are estimates).
 */
export const CLASS_HEROES: readonly string[] = ['lore:hero-of-tython', 'lore:the-barsenthor', 'lore:emperor-wrath', 'lore:darth-nox', 'lore:cipher-nine', 'lore:the-grand-champion', 'lore:voidhound', 'lore:meteor'];
