// The Average's XP per hour of training, per skill and age (D-457): the 4.0x clamp's reference. Each value is the
// 20-seed median (npm run spread) of the Average's training XP in that skill over the 365 days starting at that age,
// divided by its hours in that skill over the same days (the pace window's own XP and hours: training sessions, their
// synergy and fatigue Willpower, a session's hours split by XP share, D-109; fights are outside the window, D-457; the
// drill XP the ceiling banks or loses counted, D-45). Interpolated, flat outside.
/** Anchors [age, XP per hour], sorted by age (engine/interp's Anchors). */
export type RateRow = readonly (readonly [number, number])[];

/** A skill gets its own row at the ages where the Average's median hours in it reach this (else its fallback row). */
export const RATE_MIN_HOURS = 20;
/** The table gate checks the (skill, age) points with at least this many median hours (fewer are too noisy to gate). */
export const RATE_GATE_MIN_HOURS = 50;

/** Measured: npm run spread (SPREAD_ONLY=average), 2026-11-23, K 11.5, the Initiate curriculum (D-459), the clamp open, training only, credited + banked + overflow XP per window hour; 20-seed medians. */
/** Per skill the Average trains (at the ages where its median hours reach RATE_MIN_HOURS). */
export const R_AVG: Readonly<Record<string, RateRow>> = {
  agility: [[4, 0.8655], [8, 0.8873], [12, 0.8122], [16, 0.8682], [20, 0.7785], [24, 0.7569], [30, 0.8086], [40, 0.801], [50, 0.7367], [60, 0.6584], [70, 0.6477], [80, 0.6606], [90, 0.6269], [98, 0.61]],
  ataru: [[12, 0.9006], [16, 0.961], [20, 0.8007], [24, 0.8105], [30, 0.9217], [40, 1.063], [50, 0.9882], [60, 0.9163], [70, 0.8863], [80, 0.879], [90, 0.8466], [98, 0.8221]],
  endurance: [[4, 0.8649], [8, 0.8873], [12, 0.811], [16, 0.8207], [20, 0.752], [24, 0.7303], [30, 0.8195], [40, 0.8011], [50, 0.7176], [60, 0.5908], [70, 0.5657], [80, 0.6409], [90, 0.5649], [98, 0.5363]],
  forceControl: [[4, 1.757], [8, 1.736], [12, 1.698], [16, 1.538], [20, 1.582], [24, 1.532], [30, 1.306], [40, 1.289], [50, 1.351], [60, 1.237], [70, 1.215], [80, 1.214], [90, 1.136], [98, 1.226]],
  forceKnowledge: [[4, 0.6359], [8, 0.559], [30, 0.6015], [40, 0.6608], [50, 0.7393], [60, 0.7347], [70, 0.7431], [80, 0.7383], [90, 0.6958], [98, 0.6567]],
  forceSense: [[4, 1.479], [8, 1.8], [12, 1.893], [16, 1.682], [20, 1.65], [24, 1.687], [30, 1.341], [40, 1.286], [50, 1.27], [60, 1.233], [70, 1.217], [80, 1.218], [90, 1.133], [98, 1.246]],
  meditation: [[4, 0.8475], [12, 0.6129], [16, 0.6259], [20, 0.6057], [24, 0.6628], [30, 0.5405], [40, 0.6186], [50, 0.6532], [60, 0.696], [70, 0.652], [80, 0.6649], [90, 0.5738], [98, 0.5352]],
  niman: [[16, 1.171], [20, 1.225], [24, 1.159], [30, 1.012], [40, 0.9766], [50, 0.9571], [60, 0.9337], [70, 0.9053], [80, 0.8996], [90, 0.6582], [98, 0.588]],
  shien: [[20, 1.225], [24, 1.159], [30, 1.012], [40, 0.9716], [50, 0.9515], [60, 0.9585], [70, 0.9287], [80, 0.922], [90, 0.5685], [98, 0.4768]],
  shiiCho: [[8, 1.221]],
  soresu: [[12, 1.382], [16, 1.156], [20, 1.205], [24, 1.135], [30, 0.9966], [40, 0.9541], [50, 0.9342], [60, 0.9409], [70, 0.9116], [80, 0.9051], [90, 0.5581], [98, 0.4681]],
  strength: [[4, 0.8739], [8, 0.8873], [12, 0.8266], [16, 0.8269], [20, 0.7601], [24, 0.7461], [30, 0.756], [40, 0.7582], [50, 0.7032], [60, 0.6288], [70, 0.6259], [80, 0.6347], [90, 0.5945], [98, 0.582]],
  willpower: [[4, 0.7876], [8, 0.6668], [12, 0.698], [16, 0.6241], [20, 0.693], [24, 0.7431], [30, 0.5845], [40, 0.6615], [50, 0.707], [60, 0.7539], [70, 0.6475], [80, 0.5683], [90, 0.4481], [98, 0.417]],
};
/** A lightsaber form the Average does not train: the Average's most-trained form that year. */
export const R_AVG_FORM: RateRow = [[8, 1.221], [12, 1.382], [16, 1.156], [20, 1.205], [24, 1.135], [30, 0.9966], [40, 0.9541], [50, 0.9342], [60, 0.9409], [70, 0.9116], [80, 0.9051], [90, 0.5581], [98, 0.4681]];
/** Any other skill the Average does not train: the Average's whole-training rate (all XP / all hours). */
export const R_AVG_ALL: RateRow = [[4, 1.097], [8, 1.034], [12, 1.123], [16, 0.9971], [20, 1.024], [24, 1.044], [30, 0.8166], [40, 0.8637], [50, 0.8668], [60, 0.8465], [70, 0.8034], [80, 0.7792], [90, 0.6129], [98, 0.5656]];
