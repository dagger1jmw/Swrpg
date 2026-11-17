// Lore retrieval weights (architecture §5 "Lore retrieval"). Design values, tunable; D-81.

export const LORE_SCORES = {
  /** The era overview whose range contains the current year. */
  overview: 50,
  /** An era's game-relevant note. */
  note: 40,
  /** Timeline events of the current year (or a range that contains it). */
  timelineCurrent: 30,
  /** Timeline events of a past year: this, minus timelinePastDecayPerYear per year back. */
  timelinePast: 20,
  timelinePastDecayPerYear: 2,
  /** Past timeline events older than this many years are not considered. */
  timelineLookbackYears: 10,
  /** The chunk is about a canon NPC in the scene or referenced this turn. */
  canonMatch: 100,
  /** Per scene / referenced person the chunk names. */
  nameMatch: 40,
  /** Per name the player's own text mentions. */
  textMention: 60,
  /** Per current-location name (or ancestor) the chunk mentions. */
  locationMatch: 15,
} as const;
