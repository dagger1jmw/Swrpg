// The four calibration profiles (progression-targets §2 and §4, progression-numbers §12; D-40, D-49,
// D-123, D-132). Only profile inputs and scripted combat are tuned, never the targets. Each profile runs
// through the real game (tests/support/lifetime.ts): createInitialState, the player's routine and the
// montage day loop.
import type { Fight, LifeProfile } from '../support/lifetime';

/** Years of training to reach each tier (progression-numbers §12; tolerance +/-20%). */
/**
 * The gated seed (Jared, D-159 amended 2026-11-19; re-selected 2026-11-20 after D-262 to D-264): the four profile tests run on
 * `<profile seed>-s9`, the seed of the 20-seed spread closest to the median across every gated quantity of all four profiles
 * (total normalized distance 4.24; s7, chosen at 4.89 before, had drifted to 10.01, 18th of 20). The spread runner still
 * runs the profile seed and -s1 to -s19 around it.
 */
export const GATED_SEED_SUFFIX = '-s9';
export const gated = <P extends { seed: string }>(p: P): P => ({ ...p, seed: `${p.seed}${GATED_SEED_SUFFIX}` });

export const TARGETS = {
  average: { 21: 5.0, 41: 16.0, 61: 32.1, 81: 52.7, 101: 77.5 },
  obiwan: { 21: 3.4, 41: 10.8, 61: 21.7, 81: 35.6, 101: 52.4 },
  anakin: { 21: 1.3, 41: 4.1, 61: 8.2, 81: 13.5, 101: 19.9 },
  luke: { 21: 2.1, 41: 6.9, 61: 13.9, 81: 22.8, 101: 33.6 },
} as const satisfies Record<string, Record<number, number>>;

interface FightSpec extends Fight {
  /** Ages [from, to). */
  from: number;
  to: number;
  perYear: number;
}

/** Fights spread evenly over the year (deterministic, no RNG). */
export function schedule(specs: readonly FightSpec[]): (age: number, day: number) => Fight[] {
  return (age, day) => {
    const out: Fight[] = [];
    for (const f of specs) {
      if (age < f.from || age >= f.to) continue;
      const r = f.perYear / 368;
      if (Math.floor((day + 1) * r + 1e-9) !== Math.floor(day * r + 1e-9)) out.push(f);
    }
    return out;
  };
}

/**
 * D-258 (Jared, 2026-11-19): serious duels against Force users cut to Legends-plausible lifetime counts (Obi-Wan 13,
 * Luke about 20, Anakin about 30, the Average four), their XP replaced by other serious fights; these counts were tuned
 * on the gated seed so the milestones and war-year shares stay in their gates.
 */
export const OBIWAN_MANDO = 12;
export const LUKE_VONG = 6;
export const ANAKIN_PADAWAN_ELITES = 3;
export const ANAKIN_WAR_MANDO = 2;
export const ANAKIN_LATER_MANDO = 2;
export const AVERAGE_SKIRMISHES = 0.95;
export const ANAKIN_MASTER_19 = 11;
export const ANAKIN_MASTER_21 = 10;
export const AVERAGE_DUEL_GAP = -25;
export const ANAKIN_WAR_B1 = 80;
export const ANAKIN_WAR_B2 = 20;
export const ANAKIN_WAR_ELITE = 8;

/** Average: Jedi Guardian, the default template, standard effort; peacetime: one real skirmish a year from Knight (D-40). */
export const AVERAGE: LifeProfile = {
  archetype: 'jediGuardian',
  path: 'jedi',
  main: '$highestForm',
  startAge: 4,
  padawanAge: 12,
  // D-426 (Jared): the Average Knight at 25 after 13 years as a Padawan (20.5 before).
  knightAge: 25,
  daysPerYear: 300,
  effort: 'standard',
  mainForm: 'soresu',
  secondForm: 'ataru',
  seed: 'average',
  // Peacetime: about one real mission a year from Padawan on (D-143 A), against a squad of line troopers. D-258: 0.95 a
  // year (was 1) brings the highest form's 41 back to 16.0 +/- 0.1 on the gated seed (15.99) after the morale rule; 0.85
  // and 0.9 drift a mission into the age-20 year, where its drill-bank release lifts that year's XP by 10-25%.
  fights: schedule([
    { from: 12, to: 200, perYear: AVERAGE_SKIRMISHES, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 },
    // A handful of duels against Force users over a life (D-258, Jared): one every 15 years from 25 to 80 (four, at 34,
    // 49, 64 and 79), against weaker duelists (gap -15: at -5 a long duel alone ended the day over the tiredness gate).
    { from: 25, to: 80, perYear: 1 / 15, stakes: 'serious', gap: AVERAGE_DUEL_GAP },
  ]),
};

/**
 * Obi-Wan: focused, no talent, push, 315 days, Padawan at 13, Knight at 25 (D-40). Focus: the Initiate
 * fill on Shii-Cho with Temple instructors at intense intensity; the Padawan plan keeps Shii-Cho as the
 * solo form; the Knight fill favors Soresu. Peacetime sparring keeps combat under 10%; the Clone Wars at
 * ages 35-38 (Legends: born 57 BBY, war 22-19 BBY; D-123) give 20-30%.
 */
export const OBIWAN: LifeProfile = {
  archetype: 'jediGuardian',
  path: 'jedi',
  main: '$highestForm',
  startAge: 3,
  padawanAge: 13,
  knightAge: 25,
  daysPerYear: 315,
  effort: 'push',
  mainForm: 'soresu',
  secondForm: 'ataru',
  formPlan: { padawan: { soresu: 2, shiiCho: 1 }, knight: { soresu: 2, ataru: 1 } },
  priorities: {
    initiate: [{ skillId: 'shiiCho', weight: 3, intensity: 'intense', source: { kind: 'instructor' } }],
    padawan: [
      { skillId: 'soresu', weight: 3 },
      { skillId: 'shiiCho', weight: 2 },
      { skillId: 'forceControl', weight: 1 },
      { skillId: 'forceSense', weight: 1 },
    ],
    knight: [
      { skillId: 'soresu', weight: 3 },
      { skillId: 'ataru', weight: 1 },
      { skillId: 'forceControl', weight: 1 },
      { skillId: 'forceSense', weight: 1 },
      { skillId: 'endurance', weight: 1 },
    ],
  },
  seed: 'obiwan',
  // The Clone Wars years: wounding fights get a bacta tank (D-162).
  warAges: [[35, 38]],
  // Retuned in step 9 on the fixed seed and 5 more (D-159): spars are sessions of bouts (D-168), so few are needed and
  // the peacetime combat share stays under 10%.
  fights: schedule([
    { from: 6, to: 13, perYear: 8, stakes: 'spar', gap: 5, skillId: 'shiiCho' },
    // Sparring with his master (Qui-Gon, a stronger partner, D-163).
    { from: 13, to: 35, perYear: 10, stakes: 'spar', gap: 15 },
    // Padawan and Knight missions (Legends: Melida/Daan and the years with Qui-Gon).
    { from: 13, to: 35, perYear: 4, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 },
    // The Clone Wars (ages 35-38): droid armies, commando and MagnaGuard-type elites, and duels (Ventress, Grievous, Dooku).
    { from: 35, to: 38, perYear: 30, stakes: 'serious', gap: -30, opponent: 'battleDroid', count: 10 },
    { from: 35, to: 38, perYear: 10, stakes: 'serious', gap: -20, opponent: 'superBattleDroid', count: 6 },
    { from: 35, to: 38, perYear: 10, stakes: 'serious', gap: -10, opponent: 'eliteTrooper', count: 4 },
    // Duels against Force users (D-258, Jared: Legends-plausible counts, about 12-15 in a life; Ventress, Grievous,
    // Dooku, Maul): 4 / 5 / 4 in the war years (were 10 / 11 / 11; D-206, D-244 and D-159 had tuned them for the share).
    { from: 35, to: 36, perYear: 4, stakes: 'serious', gap: 0 },
    { from: 36, to: 37, perYear: 5, stakes: 'serious', gap: 0 },
    { from: 37, to: 38, perYear: 4, stakes: 'serious', gap: 0 },
    // Their XP from other serious fights (D-258): Death Watch Mandalorian squads (Legends: Mandalore, the Clone Wars).
    { from: 35, to: 38, perYear: OBIWAN_MANDO, stakes: 'serious', gap: 0, opponent: 'mandalorian', count: 3 },
  ]),
};

/**
 * Anakin: prodigy in combat and Force (x1.5, cross-talent x1.1 on forms), push, 315 days, Padawan at 9,
 * Knight at 20, single focus on Djem So; missions from age 10, the Clone Wars from 19 to 22 (war share
 * 25-35%). His master uses the master stub (x1.15): without NPC generation a non-specialist master
 * (x1.05 in §12) cannot be modeled; the difference is absorbed by the mission count (D-132).
 */
export const ANAKIN: LifeProfile = {
  archetype: 'jediGuardian',
  path: 'jedi',
  main: '$highestForm',
  startAge: 9,
  padawanAge: 9,
  knightAge: 20,
  daysPerYear: 315,
  effort: 'push',
  talents: { combat: 'prodigy', force: 'prodigy' },
  focusWeights: { djemSo: 0.7, ataru: 0.1, forceControl: 0.1, forceSense: 0.1 },
  mainForm: 'djemSo',
  secondForm: 'ataru',
  formPlan: { padawan: { djemSo: 3 }, knight: { djemSo: 2, ataru: 1 } },
  priorities: {
    padawan: [
      { skillId: 'djemSo', weight: 3, intensity: 'intense' },
      { skillId: 'forceControl', weight: 1 },
    ],
    knight: [
      { skillId: 'djemSo', weight: 3, intensity: 'intense' },
      { skillId: 'forceControl', weight: 1 },
      { skillId: 'forceSense', weight: 1 },
    ],
  },
  seed: 'anakin',
  // The Clone Wars years: wounding fights get a bacta tank (D-162).
  warAges: [[19, 22]],
  // Retuned in step 9 on the fixed seed and 5 more (D-159): near-daily sparring sessions with his master (D-168; a
  // stronger partner, D-163), lighter in the first year so 21 stays within the 4.0x pace (1.25 y); missions; the
  // Clone Wars; after it, group spars with three partners (the Order's best duelists) and a few missions and duels.
  // D-234 retune (fight counts only; fixed seed and the median of 5 more): spars 150 -> 160 a year before the war,
  // the first war year's extra B2 fights 6 -> 9, the group spars after it 280 -> 300.
  fights: schedule([
    { from: 9, to: 10, perYear: 55, stakes: 'spar', gap: 15 },
    { from: 10, to: 19, perYear: 160, stakes: 'spar', gap: 15 },
    { from: 10, to: 19, perYear: 15, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 },
    // Duels against Force users (D-258, Jared: about 25-30 in a life): 1 a year as a Padawan (was 4), 4 a year in the
    // war (was 8), 0.15 a year after it (was 2); their XP from elite squads and Mandalorians.
    { from: 10, to: 19, perYear: 1, stakes: 'serious', gap: -5 },
    { from: 10, to: 19, perYear: ANAKIN_PADAWAN_ELITES, stakes: 'serious', gap: -5, opponent: 'eliteTrooper', count: 4 },
    // The Clone Wars (19-22): droid armies, elite squads and duels; the first year heaviest. D-264 retune (fight counts
    // only, 20 seeds): his own withdrawals spare him severe wounds and bacta days, so more training and less combat XP
    // (war-year mean median 22.0%, every seed under 25%); B1 groups 25 -> 80 a year (median 30.5%, 28.5-34.2%).
    { from: 19, to: 22, perYear: ANAKIN_WAR_B1, stakes: 'serious', gap: -30, opponent: 'battleDroid', count: 10 },
    { from: 19, to: 22, perYear: ANAKIN_WAR_B2, stakes: 'serious', gap: -20, opponent: 'superBattleDroid', count: 6 },
    { from: 19, to: 22, perYear: ANAKIN_WAR_ELITE, stakes: 'serious', gap: -10, opponent: 'eliteTrooper', count: 6 },
    { from: 19, to: 22, perYear: 4, stakes: 'serious', gap: 0 },
    { from: 19, to: 22, perYear: ANAKIN_WAR_MANDO, stakes: 'serious', gap: 0, opponent: 'mandalorian', count: 3 },
    { from: 19, to: 20, perYear: 9, stakes: 'serious', gap: -20, opponent: 'superBattleDroid', count: 6 },
    // D-244 retune (fight counts only, after the weapon-arm rule and its duel-length retune): the first war year's
    // combat share fell to 20%; more war fights did not lift it (the daily combat cap binds), so sessions with his
    // master (he and Obi-Wan sparred between campaigns): 25 on the old fixed seed, then tuned to the 20-seed median
    // (D-159 amended): 11 in the first war year (median 29.4% at 19) and 10 in the third (median 29.6% at 21).
    { from: 19, to: 20, perYear: ANAKIN_MASTER_19, stakes: 'spar', gap: 15 },
    { from: 21, to: 22, perYear: ANAKIN_MASTER_21, stakes: 'spar', gap: 15 },
    { from: 19, to: 20, perYear: 2, stakes: 'serious', gap: -10, opponent: 'eliteTrooper', count: 6 },
    { from: 22, to: 200, perYear: 300, stakes: 'spar', gap: 0, partners: 3 },
    { from: 22, to: 200, perYear: 10, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 },
    { from: 22, to: 200, perYear: 0.15, stakes: 'serious', gap: 0 },
    { from: 22, to: 200, perYear: ANAKIN_LATER_MANDO, stakes: 'serious', gap: 0, opponent: 'mandalorian', count: 3 },
  ]),
};

/**
 * Luke: start 19, outsider (no Order requirements), Force prodigy, push, 280 days, solo with a Force
 * holocron for Force Control and Force Sense, broad focus (Force Control 3 of 6 weights; focus share
 * 0.43), Djem So and Force Speed (the body ability behind his late physical peak, §11a); the Galactic
 * Civil War from 19 to 24 and the Yuuzhan Vong War from 44 to 50.
 */
export const LUKE: LifeProfile = {
  archetype: 'jediGuardian',
  path: 'outsider',
  main: 'forceControl',
  startAge: 19,
  padawanAge: 19,
  knightAge: 19,
  daysPerYear: 280,
  effort: 'push',
  talents: { force: 'prodigy' },
  focusWeights: { forceControl: 0.43, forceSense: 0.14, djemSo: 0.14, forceSpeed: 0.14, endurance: 0.15 },
  startingXp: { forceSpeed: 12 },
  mainForm: 'djemSo',
  secondForm: 'soresu',
  formPlan: { padawan: { djemSo: 3 }, knight: { djemSo: 1 } },
  fillSource: { kind: 'solo' },
  priorities: {
    knight: [
      { skillId: 'forceControl', weight: 3, intensity: 'intense', source: { kind: 'record', id: 'holocron:forceMaster' } },
      { skillId: 'forceSense', weight: 1, source: { kind: 'record', id: 'holocron:forceMaster' } },
      { skillId: 'djemSo', weight: 1 },
      { skillId: 'forceSpeed', weight: 1 },
    ],
  },
  seed: 'luke',
  // Both wars: wounding fights get a bacta tank (D-162).
  warAges: [
    [19, 24],
    [44, 50],
  ],
  fights: schedule([
    // The Galactic Civil War (stormtroopers), then the Yuuzhan Vong War (warriors and duels).
    { from: 19, to: 24, perYear: 30, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 },
    { from: 44, to: 50, perYear: 14, stakes: 'serious', gap: -10, opponent: 'eliteTrooper', count: 4 },
    // Duels against Force users (D-258, Jared: about 20 in a life; were 36): 3.4 a year in the Vong war; their XP from
    // Yuuzhan Vong warrior groups (melee: an amphistaff never severs).
    { from: 44, to: 50, perYear: 3.4, stakes: 'serious', gap: 0 },
    { from: 44, to: 50, perYear: LUKE_VONG, stakes: 'serious', gap: 0, opponent: 'yuuzhanVongWarrior', count: 3 },
  ]),
};

/**
 * Luke on the accelerated path (Jared, D-418; outlier, not calibration data): start 19, outsider, Force prodigy, push,
 * 280 days, on Dagobah (a Force-rich place) with an exceptional teacher (the master stub, the teacher factor's x1.15
 * cap) for the Force and the blade: Force Control, Force Sense, Djem So and Force Speed only, no knowledge or meditation.
 * The Galactic Civil War skirmishes as in LUKE.
 */
export const LUKE_ACCELERATED: LifeProfile = {
  archetype: 'jediGuardian',
  path: 'outsider',
  main: 'forceControl',
  startAge: 19,
  padawanAge: 19,
  knightAge: 19,
  daysPerYear: 280,
  effort: 'push',
  talents: { force: 'prodigy' },
  focusWeights: { forceControl: 0.35, forceSense: 0.15, djemSo: 0.35, forceSpeed: 0.15 },
  startingXp: { forceSpeed: 12 },
  mainForm: 'djemSo',
  secondForm: 'soresu',
  formPlan: { padawan: { djemSo: 3 }, knight: { djemSo: 1 } },
  fillSource: { kind: 'solo' },
  priorities: {
    knight: [
      { skillId: 'forceControl', weight: 3, intensity: 'intense', source: { kind: 'master' } },
      { skillId: 'djemSo', weight: 3, intensity: 'intense', source: { kind: 'master' } },
      { skillId: 'forceSense', weight: 1, source: { kind: 'master' } },
      { skillId: 'forceSpeed', weight: 1, source: { kind: 'master' } },
    ],
  },
  seed: 'luke-accelerated',
  trainingPath: 'accelerated',
  place: 'Dagobah',
  warAges: [[19, 24]],
  fights: schedule([
    { from: 19, to: 24, perYear: 30, stakes: 'skirmish', gap: -20, opponent: 'trooper', count: 4 },
    // Sparring with his teacher (a stronger partner, D-163: lifts the blade's drill ceiling).
    { from: 19, to: 24, perYear: 40, stakes: 'spar', gap: 15 },
    // Duels with a far stronger opponent (Legends: Vader at Bespin, 3 ABY, and on the second Death Star, 4 ABY).
    { from: 22, to: 23, perYear: 1, stakes: 'serious', gap: 25, opponentForm: 'djemSo' },
    { from: 23, to: 24, perYear: 2, stakes: 'serious', gap: 15, opponentForm: 'djemSo' },
  ]),
};
