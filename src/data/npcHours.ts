// How much of a full training day an NPC still keeps, by Human-equivalent age (Jared, 2026-11-25; D-497): office, teaching,
// councils and a slower life take the rest from about 50 on. NPCs only; the player's hours are the player's. Every number
// is invented, set against the canon sheets past 55 (docs-v2/reports/m8-calibration-fix4.md).
export const NPC_TRAINING_HOURS: readonly (readonly [number, number])[] = [[50, 1], [60, 0.5], [70, 0.25], [80, 0.15]];
