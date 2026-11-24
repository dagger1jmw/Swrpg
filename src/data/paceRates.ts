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

/** Measured: npm run spread (SPREAD_ONLY=average), 2026-11-23, K 11.64, the Initiate curriculum with D-460 (the gate at 5, Form I at 75% in the survey, the Padawan specialty transfer, the gate over free training), the clamp open, training only, credited + banked + overflow XP per window hour; 20-seed medians. The rows at 70 and over re-measured 2026-11-24 the same way under the ageing rules (D-472, D-474, Jared: an old body regains less, the Force Control stretch keeps the Average less tired). */
/** Per skill the Average trains (at the ages where its median hours reach RATE_MIN_HOURS). */
export const R_AVG: Readonly<Record<string, RateRow>> = {
  agility: [[4, 0.8696], [8, 0.9169], [12, 0.8652], [16, 0.8538], [20, 0.7721], [24, 0.7576], [30, 0.8063], [40, 0.8015], [50, 0.7359], [60, 0.6561], [70, 0.6013], [80, 0.5169], [90, 0.4681], [98, 0.5376]],
  ataru: [[12, 1.047], [16, 0.9237], [20, 0.8017], [24, 0.8101], [30, 0.913], [40, 1.062], [50, 0.981], [60, 0.9072], [70, 0.8849], [80, 0.8931], [90, 0.8943], [98, 0.891]],
  endurance: [[4, 0.867], [8, 0.9169], [12, 0.8261], [16, 0.8108], [20, 0.7516], [24, 0.7347], [30, 0.8169], [40, 0.7984], [50, 0.7291], [60, 0.5958], [70, 0.6331], [80, 0.5774], [90, 0.475], [98, 0.4744]],
  forceControl: [[4, 1.762], [8, 1.729], [12, 1.722], [16, 1.54], [20, 1.589], [24, 1.538], [30, 1.306], [40, 1.291], [50, 1.389], [60, 1.221], [70, 1.224], [80, 1.216], [90, 1.149], [98, 1.272]],
  forceKnowledge: [[4, 0.6268], [8, 0.5608], [30, 0.5982], [40, 0.658], [50, 0.7454], [60, 0.7464], [70, 0.753], [80, 0.7564], [90, 0.7586], [98, 0.759]],
  forceSense: [[4, 1.509], [8, 1.79], [12, 1.88], [16, 1.681], [20, 1.654], [24, 1.708], [30, 1.337], [40, 1.29], [50, 1.273], [60, 1.246], [70, 1.215], [80, 1.221], [90, 1.139], [98, 1.216]],
  meditation: [[4, 0.854], [12, 0.6086], [16, 0.6252], [20, 0.6075], [24, 0.6664], [30, 0.5394], [40, 0.6231], [50, 0.6528], [60, 0.6991], [70, 0.6606], [80, 0.6527], [90, 0.6675], [98, 0.656]],
  niman: [[16, 1.172], [20, 1.306], [24, 1.156], [30, 1.006], [40, 0.9765], [50, 0.9533], [60, 0.9155], [70, 0.9022], [80, 0.894], [90, 0.6473], [98, 0.5907]],
  shien: [[20, 1.306], [24, 1.156], [30, 1.006], [40, 0.9765], [50, 0.9533], [60, 0.9312], [70, 0.9337], [80, 0.9173], [90, 0.5447], [98, 0.4631]],
  shiiCho: [[4, 1.42], [8, 1.261]],
  soresu: [[12, 1.294], [16, 1.157], [20, 1.284], [24, 1.132], [30, 0.9911], [40, 0.9589], [50, 0.9359], [60, 0.9141], [70, 0.9215], [80, 0.91], [90, 0.5426], [98, 0.4628]],
  strength: [[4, 0.8765], [8, 0.9169], [12, 0.8427], [16, 0.8178], [20, 0.756], [24, 0.7436], [30, 0.7577], [40, 0.7549], [50, 0.7055], [60, 0.6321], [70, 0.5662], [80, 0.4757], [90, 0.4244], [98, 0.5328]],
  willpower: [[4, 0.7736], [8, 0.6683], [12, 0.6926], [16, 0.6235], [20, 0.7001], [24, 0.7425], [30, 0.5833], [40, 0.6624], [50, 0.7093], [60, 0.7428], [70, 0.6613], [80, 0.6039], [90, 0.5169], [98, 0.5143]],
};
/** A lightsaber form the Average does not train: the Average's most-trained form that year. */
export const R_AVG_FORM: RateRow = [[4, 1.42], [8, 1.261], [12, 1.294], [16, 1.157], [20, 1.284], [24, 1.132], [30, 0.9911], [40, 0.9589], [50, 0.9359], [60, 0.9141], [70, 0.9215], [80, 0.91], [90, 0.5426], [98, 0.4628]];
/** Any other skill the Average does not train: the Average's whole-training rate (all XP / all hours). */
export const R_AVG_ALL: RateRow = [[4, 1.095], [8, 1.049], [12, 1.11], [16, 0.9942], [20, 1.042], [24, 1.043], [30, 0.8121], [40, 0.8651], [50, 0.8682], [60, 0.8379], [70, 0.81], [80, 0.7796], [90, 0.6512], [98, 0.6542]];
