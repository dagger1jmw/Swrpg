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

/** Measured: npm run spread (SPREAD_ONLY=average), 2026-11-23, K 12.45, the clamp open, training only, credited + banked + overflow XP per window hour; 20-seed medians. */
/** Per skill the Average trains (at the ages where its median hours reach RATE_MIN_HOURS). */
export const R_AVG: Readonly<Record<string, RateRow>> = {
  agility: [[4, 0.8292], [8, 0.9833], [12, 0.8117], [16, 0.8353], [20, 0.7663], [24, 0.7659], [30, 0.8021], [40, 0.7892], [50, 0.7348], [60, 0.6654], [70, 0.6485], [80, 0.6606], [90, 0.6245], [98, 0.5845]],
  ataru: [[12, 0.9051], [16, 0.866], [20, 0.8004], [24, 0.802], [30, 0.9132], [40, 1.037], [50, 0.9707], [60, 0.9014], [70, 0.8781], [80, 0.8722], [90, 0.8471], [98, 0.8181]],
  endurance: [[4, 0.8292], [8, 0.9833], [12, 0.798], [16, 0.8024], [20, 0.7428], [24, 0.7387], [30, 0.8107], [40, 0.7952], [50, 0.7362], [60, 0.6498], [70, 0.5969], [80, 0.6652], [90, 0.5914], [98, 0.5236]],
  forceControl: [[4, 1.896], [8, 1.747], [12, 1.62], [16, 1.54], [20, 1.591], [24, 1.612], [30, 1.313], [40, 1.297], [50, 1.261], [60, 1.319], [70, 1.215], [80, 1.221], [90, 1.17], [98, 1.142]],
  forceKnowledge: [[4, 0.5249], [8, 0.5589], [30, 0.6002], [40, 0.6483], [50, 0.7933], [60, 0.7416], [70, 0.742], [80, 0.7242], [90, 0.6835], [98, 0.6592]],
  forceSense: [[4, 1.968], [8, 1.78], [12, 1.812], [16, 1.673], [20, 1.646], [24, 1.806], [30, 1.331], [40, 1.288], [50, 1.25], [60, 1.335], [70, 1.218], [80, 1.221], [90, 1.162], [98, 1.121]],
  meditation: [[12, 0.5951], [16, 0.623], [20, 0.605], [24, 0.6855], [30, 0.531], [40, 0.6318], [50, 0.6478], [60, 0.7048], [70, 0.647], [80, 0.6121], [90, 0.5968], [98, 0.5281]],
  niman: [[12, 1.196], [16, 1.109], [20, 1.13], [24, 1.037], [30, 0.9737], [40, 0.9988], [50, 0.9552], [60, 0.9572], [70, 0.9037], [80, 0.9071], [90, 0.7447], [98, 0.6198]],
  shien: [[12, 1.27], [16, 1.172], [20, 1.294], [24, 1.15], [30, 1.001], [40, 0.9789], [50, 0.9543], [60, 0.9989], [70, 0.9302], [80, 0.929], [90, 0.7036], [98, 0.5229]],
  shiiCho: [[4, 1.296], [8, 1.353]],
  soresu: [[12, 1.265], [16, 1.157], [20, 1.273], [24, 1.127], [30, 0.9855], [40, 0.9613], [50, 0.9369], [60, 0.9806], [70, 0.9132], [80, 0.9119], [90, 0.6907], [98, 0.5133]],
  strength: [[4, 0.8292], [8, 0.9833], [12, 0.8224], [16, 0.8067], [20, 0.7523], [24, 0.7492], [30, 0.7505], [40, 0.7493], [50, 0.699], [60, 0.6351], [70, 0.6259], [80, 0.6348], [90, 0.5929], [98, 0.5554]],
  willpower: [[4, 0.701], [8, 0.6667], [12, 0.6777], [16, 0.6225], [20, 0.6973], [24, 0.7498], [30, 0.5761], [40, 0.6671], [50, 0.6995], [60, 0.7392], [70, 0.6427], [80, 0.5615], [90, 0.4573], [98, 0.4136]],
};
/** A lightsaber form the Average does not train: the Average's most-trained form that year. */
export const R_AVG_FORM: RateRow = [[4, 1.296], [8, 1.353], [12, 1.265], [16, 1.157], [20, 1.273], [24, 1.127], [30, 0.9855], [40, 0.9613], [50, 0.9369], [60, 0.9806], [70, 0.9132], [80, 0.9119], [90, 0.6907], [98, 0.5133]];
/** Any other skill the Average does not train: the Average's whole-training rate (all XP / all hours). */
export const R_AVG_ALL: RateRow = [[4, 1.055], [8, 1.082], [12, 1.075], [16, 0.9892], [20, 1.035], [24, 1.066], [30, 0.8055], [40, 0.8613], [50, 0.8572], [60, 0.8677], [70, 0.8021], [80, 0.776], [90, 0.6439], [98, 0.5553]];
