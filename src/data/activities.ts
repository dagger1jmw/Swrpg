// Activity catalog (spec/skills-and-activities.md §3-4, D-53, D-106). Each activity declares its
// loads per hour (physical, mental, Force), a default intensity, its drill ratings, a primary
// skill and secondary weights (normalized at use: 0.75 primary / 0.25 secondaries, never
// additive). docs-v2/calc/activities.mjs mirrors the subset the calculations use.

export const INTENSITIES = ['casual', 'standard', 'intense', 'extreme'] as const;
export type Intensity = (typeof INTENSITIES)[number];

export type LoadCategory = 'saberDrill' | 'physical' | 'forceDrill' | 'study' | 'meditation';

export interface Load {
  /** Physical load per hour. */
  p: number;
  /** Mental load per hour (negative restores). */
  m: number;
  /** Force load per hour (health §2: Force drills add 0.6). */
  f: number;
}

/** skills-and-activities.md §3 load categories. */
export const LOADS: Record<LoadCategory, Load> = {
  saberDrill: { p: 1.0, m: 0.4, f: 0 },
  physical: { p: 1.2, m: 0.2, f: 0 },
  forceDrill: { p: 0.4, m: 0.8, f: 0.6 },
  study: { p: 0.05, m: 1.0, f: 0 },
  meditation: { p: 0.05, m: -0.5, f: 0 },
};
const PHYSICAL_FORCE: Load = { p: 1.2, m: 0.2, f: 0.6 };
/** Niman drills (D-121): the saber drill with physical load 0.8. */
const NIMAN_LOAD: Load = { p: 0.8, m: 0.4, f: 0 };

/** progression-numbers §4. */
export const DRILL_RATINGS = [10, 30, 50, 70, 90] as const;
export const DRILL_RATING_NAMES: Record<number, string> = { 10: 'Basic', 30: 'Intermediate', 50: 'Advanced', 70: 'Master', 90: 'Legendary' };

/**
 * How the primary skill is chosen. `skill`: fixed. `options`: the intent's skillId if listed,
 * else the first option the character knows, else the last. `anyForm`: any lightsaber form
 * (default: the character's main form). `formPair`: two forms, 0.375 each of the 0.75.
 * `anyAbility`: any Force ability skill (the generic ability drill).
 */
export type PrimarySpec =
  | { kind: 'skill'; skill: string }
  | { kind: 'options'; options: readonly string[] }
  | { kind: 'anyForm' }
  | { kind: 'formPair' }
  | { kind: 'anyAbility' };

/**
 * Secondary weights. Tokens: `$secondForm` (the character's second form), `$knownForms` (every
 * known form other than the primary, the weight split equally), `$pairedStat` (Agility <->
 * Strength, the one that is not the primary).
 */
export type Secondaries = Readonly<Record<string, number>>;

export type Unlock =
  | { kind: 'always' }
  /** Supervised (teacher present) always; solo once the skill reaches min. */
  | { kind: 'supervisedOrLevel'; skill: string; min: number }
  /** `$primary` means the chosen primary skill. */
  | { kind: 'level'; skill: string; min: number }
  /** Known = level 1 or more. */
  | { kind: 'known'; skill: string }
  /** Known, or a teacher present: how a new form is learned (D-119; its first session gets the transfer). */
  | { kind: 'knownOrTeacher'; skill: string }
  | { kind: 'formsKnown'; min: number }
  | { kind: 'pairMin'; min: number }
  | { kind: 'anyAbilityLevel'; min: number }
  | { kind: 'rank'; ranks: readonly string[] }
  | { kind: 'notRank'; ranks: readonly string[] }
  | { kind: 'path'; paths: readonly string[] }
  /** Restricted forms (D-370): Vaapad's teacher-or-records gate when the primary is Vaapad; known otherwise. */
  | { kind: 'formGate' }
  | { kind: 'hasApprentice' }
  | { kind: 'partner' };

export type ActivityGroup = 'forms' | 'force' | 'meditation' | 'physical' | 'study' | 'career';

export interface ActivityDef {
  id: string;
  name: string;
  group: ActivityGroup;
  load: Load;
  defaultIntensity: Intensity;
  primary: PrimarySpec;
  secondaries: Secondaries;
  /** Every listed condition must hold. */
  unlock: readonly Unlock[];
  ratings: readonly number[];
  /** Battle Meditation: max 1 h per session. */
  maxSessionHours?: number;
  /** Partner sparring: also E (M5) and ceiling-limited (D-45). */
  sparring?: boolean;
  /** Dark-tagged: dark pressure per alignment.md §3 (M6). */
  dark?: boolean;
}

const fixed = (skill: string): PrimarySpec => ({ kind: 'skill', skill });
const options = (...o: string[]): PrimarySpec => ({ kind: 'options', options: o });
const ALWAYS: readonly Unlock[] = [{ kind: 'always' }];
const known = (skill = '$primary'): Unlock => ({ kind: 'known', skill });
const learnable = (skill = '$primary'): Unlock => ({ kind: 'knownOrTeacher', skill });
const level = (min: number, skill = '$primary'): Unlock => ({ kind: 'level', skill, min });

function act(
  id: string,
  name: string,
  group: ActivityGroup,
  load: Load,
  defaultIntensity: Intensity,
  primary: PrimarySpec,
  secondaries: Secondaries,
  unlock: readonly Unlock[],
  extra: Partial<ActivityDef> = {},
): ActivityDef {
  return { id, name, group, load, defaultIntensity, primary, secondaries, unlock, ratings: DRILL_RATINGS, ...extra };
}

const S = LOADS.saberDrill;
const F = LOADS.forceDrill;
const P = LOADS.physical;
const T = LOADS.study;
const M = LOADS.meditation;

export const ACTIVITIES: readonly ActivityDef[] = [
  // Lightsaber forms (saber drill 1.0 / 0.4)
  act('shiiChoBasics', 'Shii-Cho basics', 'forms', S, 'standard', fixed('shiiCho'), { strength: 0.4, agility: 0.3, endurance: 0.2, forceControl: 0.15 }, [
    { kind: 'supervisedOrLevel', skill: 'shiiCho', min: 15 },
  ]),
  act('shiiChoAdvanced', 'Shii-Cho advanced sequences', 'forms', S, 'intense', fixed('shiiCho'), { strength: 0.5, agility: 0.4, endurance: 0.3, forceControl: 0.2 }, [level(21)]),
  act('makashiBasics', 'Makashi basics', 'forms', S, 'standard', fixed('makashi'), { agility: 0.6, willpower: 0.3, forceControl: 0.3, strength: 0.1 }, [learnable()]),
  act('makashiFootwork', 'Makashi precision footwork', 'forms', S, 'standard', fixed('makashi'), { agility: 0.7, willpower: 0.4, forceControl: 0.3 }, [level(21)]),
  act('soresuBasics', 'Soresu basics', 'forms', S, 'standard', fixed('soresu'), { endurance: 0.6, willpower: 0.4, forceSense: 0.3, forceControl: 0.25 }, [learnable()]),
  act('soresuDeflection', 'Soresu deflection drills', 'forms', S, 'standard', fixed('soresu'), { endurance: 0.5, forceSense: 0.5, agility: 0.3, willpower: 0.3 }, [level(10)]),
  act('ataruBasics', 'Ataru basics', 'forms', S, 'intense', fixed('ataru'), { agility: 0.7, endurance: 0.4, strength: 0.3, forceControl: 0.3 }, [learnable()]),
  act('ataruAcrobatics', 'Ataru acrobatic sequences', 'forms', S, 'intense', fixed('ataru'), { agility: 0.7, endurance: 0.4, strength: 0.3, forceControl: 0.3 }, [level(21)]),
  act('shienDjemSoBasics', 'Shien / Djem So basics', 'forms', S, 'intense', options('shien', 'djemSo'), { strength: 0.7, endurance: 0.4, forceControl: 0.25, agility: 0.2 }, [learnable()]),
  // Niman drills are lighter: physical load 0.8 instead of 1.0 (D-121).
  act('nimanBasics', 'Niman basics', 'forms', NIMAN_LOAD, 'standard', fixed('niman'), { forceControl: 0.5, willpower: 0.4, agility: 0.3, strength: 0.2 }, [learnable()]),
  act('juyoVaapadBasics', 'Juyo / Vaapad basics', 'forms', S, 'intense', options('juyo', 'vaapad'), { willpower: 0.6, agility: 0.5, strength: 0.4, forceControl: 0.3 }, [
    { kind: 'formGate' },
    { kind: 'notRank', ranks: ['initiate', 'acolyte'] },
  ]),
  act('dualSaber', 'Dual saber practice', 'forms', S, 'standard', { kind: 'anyForm' }, { $secondForm: 0.6, agility: 0.5, strength: 0.3 }, [known(), { kind: 'formsKnown', min: 2 }]),
  act('formCombination', 'Form combination drills', 'forms', S, 'standard', { kind: 'formPair' }, { agility: 0.4, forceControl: 0.3 }, [{ kind: 'pairMin', min: 21 }]),
  act('sparring', 'Combat sparring (partner)', 'forms', S, 'intense', { kind: 'anyForm' }, { agility: 0.5, endurance: 0.5, strength: 0.4, forceSense: 0.3 }, [{ kind: 'partner' }], {
    sparring: true,
  }),
  act('padawanTraining', 'Padawan training with master', 'forms', S, 'standard', { kind: 'anyForm' }, { forceControl: 0.4, willpower: 0.3 }, [
    { kind: 'rank', ranks: ['padawan', 'apprentice'] },
  ]),
  // Forms with no bank entry use the basics pattern of their nearest form (§4 note; D-108).
  act('trakataBasics', 'Tràkata basics', 'forms', S, 'standard', fixed('trakata'), { agility: 0.6, willpower: 0.3, forceControl: 0.3, strength: 0.1 }, [learnable()]),
  act('jarKaiBasics', "Jar'Kai basics", 'forms', S, 'standard', fixed('jarKai'), { $secondForm: 0.6, agility: 0.5, strength: 0.3 }, [learnable()]),
  act('sokanBasics', 'Sokan basics', 'forms', S, 'intense', fixed('sokan'), { agility: 0.7, endurance: 0.4, strength: 0.3, forceControl: 0.3 }, [learnable()]),
  act('dunMochBasics', 'Dun Möch basics', 'forms', S, 'standard', fixed('dunMoch'), { agility: 0.6, willpower: 0.3, forceControl: 0.3, strength: 0.1, charisma: 0.3 }, [learnable()]),
  act('zeroGBasics', 'Zero-G combat basics', 'forms', S, 'intense', fixed('zeroG'), { agility: 0.7, endurance: 0.4, strength: 0.3, forceControl: 0.3 }, [learnable()]),
  act('saberstaffBasics', 'Saberstaff basics', 'forms', S, 'standard', fixed('saberstaff'), { strength: 0.4, agility: 0.3, endurance: 0.2, forceControl: 0.15 }, [learnable()]),

  // Force disciplines (Force drill 0.4 / 0.8 + 0.6 Force)
  act('forceControlDrill', 'Force Control drill (levitation practice)', 'force', F, 'standard', options('telekinesis', 'forceControl'), { forceControl: 0.6, forceSense: 0.3, willpower: 0.3 }, ALWAYS),
  act('pushPullDrills', 'Force push / pull drills', 'force', F, 'standard', options('telekinesis', 'forcePush'), { forceControl: 0.7, willpower: 0.4, forceSense: 0.2 }, [level(10, 'telekinesis')]),
  act('senseAwareness', 'Force Sense: passive awareness', 'force', F, 'casual', fixed('forceSense'), { meditation: 0.5, willpower: 0.3, forceControl: 0.2 }, ALWAYS),
  act('senseScanning', 'Force Sense: active scanning', 'force', F, 'standard', fixed('forceSense'), { forceControl: 0.5, willpower: 0.4, forceKnowledge: 0.2 }, [level(10)]),
  act('barrierHold', 'Force Barrier hold', 'force', F, 'standard', fixed('forceBarrier'), { forceControl: 0.7, willpower: 0.5, endurance: 0.2 }, [known()]),
  act('speedIntervals', 'Force Speed intervals', 'force', PHYSICAL_FORCE, 'standard', fixed('forceSpeed'), { forceControl: 0.5, agility: 0.5, endurance: 0.4 }, [known()]),
  act('jumpPractice', 'Force Jump practice', 'force', PHYSICAL_FORCE, 'standard', fixed('forceJump'), { forceControl: 0.5, agility: 0.4, strength: 0.3 }, [known()]),
  act('mindTrickConcentration', 'Mind Trick concentration', 'force', F, 'standard', fixed('mindTrick'), { forceControl: 0.6, willpower: 0.6, charisma: 0.4 }, [known()]),
  act('absorbChanneling', 'Force Absorb channeling', 'force', F, 'standard', fixed('forceAbsorb'), { forceControl: 0.7, willpower: 0.5, meditation: 0.3 }, [known()]),
  act('battleMeditationFocus', 'Battle Meditation focus', 'force', F, 'standard', fixed('battleMeditation'), { forceControl: 0.6, meditation: 0.5, willpower: 0.5, forceKnowledge: 0.3 }, [known()], {
    maxSessionHours: 1,
  }),
  act('lightningControl', 'Force Lightning control', 'force', F, 'standard', fixed('forceLightning'), { forceControl: 0.7, willpower: 0.5 }, [known()], { dark: true }),
  act('chokeControl', 'Force Choke / Grip control', 'force', F, 'standard', fixed('forceChoke'), { forceControl: 0.6, willpower: 0.4 }, [known()], { dark: true }),
  act('abilityDrill', 'Ability drill (generic)', 'force', F, 'standard', { kind: 'anyAbility' }, { forceControl: 0.5, willpower: 0.3, forceSense: 0.2 }, [known()]),
  // The archetypes' starting drills: an ability nobody knows yet must be learnable in play.
  // Force Output has no bank entry: the generic ability drill pattern (D-106), always open.
  act('outputDrill', 'Force Output drill', 'force', F, 'standard', fixed('forceOutput'), { forceControl: 0.5, willpower: 0.3, forceSense: 0.2 }, ALWAYS),

  // Meditation (0.05 / -0.5, restores mental)
  act('basicCentering', 'Basic centering', 'meditation', M, 'casual', fixed('meditation'), { willpower: 0.4, forceSense: 0.2, forceControl: 0.2 }, ALWAYS),
  act('deepImmersion', 'Deep Force immersion', 'meditation', M, 'standard', fixed('meditation'), { willpower: 0.5, forceControl: 0.4, forceKnowledge: 0.3 }, [level(15)]),
  act('willpowerMeditation', 'Willpower meditation', 'meditation', M, 'standard', fixed('willpower'), { meditation: 0.4, forceControl: 0.1 }, ALWAYS),

  // Physical conditioning (1.2 / 0.2)
  act('cardio', 'Cardio', 'physical', P, 'standard', fixed('endurance'), { strength: 0.2, agility: 0.2 }, ALWAYS),
  act('strengthTraining', 'Strength training', 'physical', P, 'standard', fixed('strength'), { endurance: 0.4 }, ALWAYS),
  act('agilityFlexibility', 'Agility and flexibility', 'physical', P, 'standard', fixed('agility'), { endurance: 0.3, strength: 0.2 }, ALWAYS),
  act('forceAthletics', 'Force-enhanced athletics', 'physical', PHYSICAL_FORCE, 'standard', options('agility', 'strength'), { forceControl: 0.5, $pairedStat: 0.3 }, [
    { kind: 'anyAbilityLevel', min: 21 },
  ]),
  act('enduranceOrdeal', 'Endurance ordeal', 'physical', P, 'intense', fixed('willpower'), { endurance: 0.5 }, ALWAYS),

  // Study (0.05 / 1.0)
  act('forceLore', 'Force history and lore', 'study', T, 'casual', fixed('forceKnowledge'), { willpower: 0.3 }, ALWAYS),
  act('formTheory', 'Lightsaber history and form theory', 'study', T, 'standard', fixed('forceKnowledge'), { $knownForms: 0.2 }, ALWAYS),
  act('jediCode', 'Jedi Code and philosophy', 'study', T, 'standard', fixed('forceKnowledge'), { willpower: 0.4, meditation: 0.2 }, [{ kind: 'path', paths: ['jedi'] }]),
  act('teachingPadawan', 'Teaching a Padawan', 'study', T, 'standard', fixed('forceKnowledge'), { willpower: 0.3, charisma: 0.3 }, [{ kind: 'hasApprentice' }]), // D-427; the form XP is the instructor's share (D-433), which replaced D-427's review share (D-450)
  act('academicStudy', 'Academic study', 'study', T, 'standard', fixed('intelligence'), { forceKnowledge: 0.1 }, ALWAYS),
  act('tacticsStudy', 'Tactics study', 'study', T, 'standard', fixed('tactics'), { intelligence: 0.4 }, ALWAYS),

  // Non-Force careers (design weights, D-53; social practice D-106)
  act('blasterRange', 'Blaster range', 'career', S, 'standard', fixed('blaster'), { agility: 0.4, willpower: 0.2 }, ALWAYS),
  act('meleeDrills', 'Melee / unarmed drills', 'career', P, 'standard', fixed('melee'), { strength: 0.5, agility: 0.4, endurance: 0.3 }, ALWAYS),
  act('piloting', 'Flight simulator / piloting', 'career', T, 'standard', fixed('piloting'), { intelligence: 0.3, agility: 0.2 }, ALWAYS),
  act('trackingFieldwork', 'Tracking fieldwork', 'career', P, 'standard', fixed('tracking'), { endurance: 0.4, intelligence: 0.3 }, ALWAYS),
  act('stealthPractice', 'Stealth practice', 'career', S, 'standard', fixed('stealth'), { agility: 0.5, willpower: 0.2 }, ALWAYS),
  act('investigationCasework', 'Investigation casework', 'career', T, 'standard', fixed('investigation'), { intelligence: 0.5, charisma: 0.2 }, ALWAYS),
  act('medicalTraining', 'Medical training', 'career', T, 'standard', fixed('medicine'), { intelligence: 0.4 }, ALWAYS),
  act('professionWork', 'Profession work', 'career', T, 'standard', fixed('profession'), { intelligence: 0.2 }, ALWAYS),
  act('socialPractice', 'Social practice', 'career', T, 'standard', fixed('charisma'), { intelligence: 0.3, willpower: 0.2 }, ALWAYS),
];

export const ACTIVITY_BY_ID: ReadonlyMap<string, ActivityDef> = new Map(ACTIVITIES.map((a) => [a.id, a]));
export const ACTIVITY_IDS: readonly string[] = ACTIVITIES.map((a) => a.id);

export function isActivityId(id: string): boolean {
  return ACTIVITY_BY_ID.has(id);
}

export function activityDef(id: string): ActivityDef {
  const a = ACTIVITY_BY_ID.get(id);
  if (!a) throw new Error(`Unknown activity id: ${id}`);
  return a;
}

/** A physical activity for the efficiency and post-workout rules (progression-numbers §3). */
export function isPhysicalActivity(a: ActivityDef): boolean {
  return a.load.p >= a.load.m;
}

/**
 * The default activity that trains a skill (choice expansion, the scheduler's fill). Forms and
 * abilities without their own entry use the generic patterns.
 */
export const DEFAULT_ACTIVITY: Readonly<Record<string, string>> = {
  shiiCho: 'shiiChoBasics',
  makashi: 'makashiBasics',
  soresu: 'soresuBasics',
  ataru: 'ataruBasics',
  shien: 'shienDjemSoBasics',
  djemSo: 'shienDjemSoBasics',
  niman: 'nimanBasics',
  juyo: 'juyoVaapadBasics',
  vaapad: 'juyoVaapadBasics',
  trakata: 'trakataBasics',
  jarKai: 'jarKaiBasics',
  sokan: 'sokanBasics',
  dunMoch: 'dunMochBasics',
  zeroG: 'zeroGBasics',
  saberstaff: 'saberstaffBasics',
  forceControl: 'forceControlDrill',
  forceSense: 'senseAwareness',
  forceOutput: 'outputDrill',
  telekinesis: 'forceControlDrill',
  forcePush: 'pushPullDrills',
  forceBarrier: 'barrierHold',
  forceSpeed: 'speedIntervals',
  forceJump: 'jumpPractice',
  mindTrick: 'mindTrickConcentration',
  forceAbsorb: 'absorbChanneling',
  battleMeditation: 'battleMeditationFocus',
  forceLightning: 'lightningControl',
  forceChoke: 'chokeControl',
  forceHealSelf: 'abilityDrill',
  forceHealOthers: 'abilityDrill',
  revitalize: 'abilityDrill',
  electricJudgment: 'abilityDrill',
  deadlySight: 'abilityDrill',
  morichro: 'abilityDrill',
  meditation: 'basicCentering',
  willpower: 'willpowerMeditation',
  strength: 'strengthTraining',
  agility: 'agilityFlexibility',
  endurance: 'cardio',
  forceKnowledge: 'forceLore',
  intelligence: 'academicStudy',
  tactics: 'tacticsStudy',
  charisma: 'socialPractice',
  blaster: 'blasterRange',
  melee: 'meleeDrills',
  piloting: 'piloting',
  tracking: 'trackingFieldwork',
  stealth: 'stealthPractice',
  investigation: 'investigationCasework',
  medicine: 'medicalTraining',
  profession: 'professionWork',
};
