// Ageing (Jared, 2026-11-24; M8 checklist item 2, D-472; docs-v2/spec/species.md section 1). EVERY number here is `invented`,
// for Jared to rule on. Ages are Human-equivalent (h): adult 18, prime 30, the end of a full life 100, for every species.
import type { PhysicalStat } from './skills';

/** Human-equivalent prime: the body's peak, and the age the decline and the Force's stretch count from. */
export const PRIME_H = 30;
export const FULL_LIFE_H = 100;

/**
 * The share of the body's peak lost by body age: slow at first, faster towards old age; only these stats decline. Strength
 * and Endurance keep the drop the Human body caps already had (80 to 25 over ages 35 to 100, progression-numbers section 11);
 * Agility starts to fall sooner.
 */
const FRAME: readonly (readonly [number, number])[] = [
  [30, 0],
  [35, 0],
  [45, 0.025],
  [55, 0.075],
  [65, 0.15],
  [75, 0.275],
  [85, 0.4375],
  [100, 0.6875],
  [120, 0.9],
];
export const BODY_DECLINE: Readonly<Record<PhysicalStat, readonly (readonly [number, number])[]>> = {
  strength: FRAME,
  endurance: FRAME,
  agility: [
    [30, 0],
    [35, 0.01],
    [45, 0.045],
    [55, 0.11],
    [65, 0.2],
    [75, 0.33],
    [85, 0.5],
    [100, 0.765],
    [120, 0.93],
  ],
};

/**
 * Force Control stretches the years after prime: the Human-equivalent years added to the span from prime to 100. The top
 * figure makes a Master of very high Control reach the body of 100 at 200 (Forceful Humans "up to 200":
 * SW_Species_OldRepublic_Part1, Human). It delays age; it never stops it.
 */
export const FORCE_EXTENSION: readonly (readonly [number, number])[] = [
  [0, 0],
  [20, 1],
  [40, 8],
  [60, 22],
  [80, 45],
  [100, 80],
  [110, 100],
];

/** Training a stat this many hours a year counts as full training; full training keeps this share of each year's loss away. */
export const AGE_TRAINING = { fullHoursPerYear: 150, keeps: 0.4 } as const;
/** What a life before play (and every NPC's) is assumed to have trained, as a share of full training. */
export const ASSUMED_TRAINING = 0.5;
