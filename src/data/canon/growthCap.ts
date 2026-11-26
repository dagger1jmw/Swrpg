// How far a canon figure's stats rise past its last sheet (Jared, 2026-11-25; D-503, D-504; every number invented): at most so
// much, over so many years, the most of it early; then it holds. An early-career sheet has more to come.
export const PAST_SHEET = { most: 5, early: 15, years: 20, earlyBefore: 30 } as const;

/**
 * The class heroes keep the early-career cap (ruled, Jared, D-506): each is sheeted at the start of a story that keeps climbing
 * for two decades. The reason is the early-career sheet, not the age line (their births, 28 to 35 at the sheet, are estimates).
 */
export const CLASS_HEROES: readonly string[] = ['lore:hero-of-tython', 'lore:the-barsenthor', 'lore:emperor-wrath', 'lore:darth-nox', 'lore:cipher-nine', 'lore:the-grand-champion', 'lore:voidhound', 'lore:meteor'];
