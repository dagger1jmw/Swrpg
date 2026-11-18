// A neutral test date (D-155): no year is special in the game, so tests use an arbitrary year with no meaning.
// Lore tests keep real lore years (they check lore facts).
import type { CalendarDate } from '../../src/engine/calendar';

export const TEST_YEAR = -1032;
export const TEST_START_DATE: CalendarDate = { year: TEST_YEAR, month: 1, day: 1 };

/**
 * A date for tests that check lore content: the Blockade of the Hydian Way begins in 3,661 BBY and Grand Master
 * Zym leads the Order (Docs/SWRPG lore timeline). A lore fact, not a start-date preference (D-155).
 */
export const LORE_TEST_YEAR = -3661;
export const LORE_TEST_DATE: CalendarDate = { year: LORE_TEST_YEAR, month: 1, day: 1 };
