// Missions (Jared, 27 Nov 2026; m9-missions B; spec/missions.md). Missions are the heart of play: a mission is code-owned and
// multi-turn, with stages the code decides by a fight, a battle, a skill roll or travel. Every number here is invented, to tune
// (reports/m9-missions.md lists them); the stage lists are data, so more types can be added.

/** How a stage is decided (B3). Travel stages are decided by the travel rules (the character arriving at the stage's world). */
export type StageKind = 'check' | 'fight' | 'battle' | 'travel';

/** The approaches a player can take to a check stage, each read on one skill (B3; spec/missions.md section 4). */
export const APPROACHES = {
  stealth: { label: 'Slip in unseen', skill: 'stealth' },
  investigate: { label: 'Read the scene and follow the leads', skill: 'investigation' },
  track: { label: 'Follow the trail', skill: 'tracking' },
  persuade: { label: 'Talk your way through', skill: 'charisma' },
  pilot: { label: 'Fly it', skill: 'piloting' },
  tactics: { label: 'Plan it like a commander', skill: 'tactics' },
  sense: { label: 'Reach out with the Force', skill: 'forceSense' },
  tech: { label: 'Work the systems', skill: 'repair' },
  reason: { label: 'Think it through', skill: 'intelligence' },
  athletics: { label: 'Climb, run and jump for it', skill: 'agility' },
  endure: { label: 'Hold your nerve', skill: 'willpower' },
  /**
   * The Force approaches of the Legends Consular (Jared, 27 Nov 2026, m9-tune B1; Force users only): influence, the Force persuasion,
   * on Willpower; reading people (their intent, a lie, the mood of the room) on Force Sense. They fit diplomacy, negotiation,
   * interrogation and investigation stages.
   */
  influence: { label: 'Influence them through the Force', skill: 'willpower' },
  read: { label: 'Read them through the Force', skill: 'forceSense' },
  /** Force the way through: turns the stage into a fight (the combat engine decides it). */
  fight: { label: 'Force the way through', skill: null },
} as const;
export type ApproachId = keyof typeof APPROACHES;
export const APPROACH_IDS = Object.keys(APPROACHES) as ApproachId[];

/** The Force approaches are for Force users only. */
export const FORCE_APPROACHES: readonly ApproachId[] = ['sense', 'influence', 'read'];

export interface StageDef {
  id: string;
  label: string;
  kind: StageKind;
  /** Check stages: the approaches that fit (a listed approach rolls at the stage's rating; any other at POOR_FIT more). */
  approaches?: readonly ApproachId[];
  /** Check stages: successes needed (a stage takes several turns). */
  need?: number;
  /** Check stages: the rating rolled against (rolls: DC = 10 + rating / 10). */
  rating?: number;
  /** Hours an attempt takes [min, max]; past 12 hours the days pass on the routine (no free day on a mission). */
  hours?: readonly [number, number];
  /** Fight stages: the enemy's strength (a minion grade 1-5 and a count range). */
  foes?: { grade: number; count: readonly [number, number] };
  /** Battle stages: a ground battle or a fleet action. */
  battle?: 'ground' | 'ship';
  /** Travel stages: the trail leads to another world (a manhunt's next world). */
  elsewhere?: boolean;
}

export interface MissionTypeDef {
  id: string;
  /** "a strike", for the thread's title ("Mission: a strike on Ord Mantell"). */
  name: string;
  /** The objective in words, with {world}. */
  objective: string;
  stages: readonly StageDef[];
  /** Launched from a forward base too (local to the front: an engagement, a strike, a recon, a rescue); else from home only. */
  fromPosting: boolean;
  /** Days from the assignment to the deadline, if it has one. */
  deadlineDays?: number;
  /** Complication lines by stage kind (B3: failure brings complications rather than ending the mission). */
  complications: readonly string[];
}

const S = (id: string, label: string, kind: StageKind, more: Omit<StageDef, 'id' | 'label' | 'kind'> = {}): StageDef => ({ id, label, kind, ...more });

/**
 * The mission types and their stages (B2). Outbound and return travel are added by the code around the stages (leaving base,
 * reaching the target world and coming back are travel moves, B4); the stages here happen at the target.
 */
export const MISSION_TYPES: Readonly<Record<string, MissionTypeDef>> = {
  strike: {
    id: 'strike', name: 'a strike', objective: 'strike the target on {world} and get out', fromPosting: true,
    stages: [
      S('in', 'get in', 'check', { approaches: ['stealth', 'pilot', 'tactics', 'sense'], rating: 25, hours: [3, 8] }),
      S('reach', 'reach the target', 'fight', { foes: { grade: 2, count: [3, 6] } }),
      S('job', 'the job', 'check', { approaches: ['tech', 'tactics', 'reason'], rating: 30, hours: [1, 4] }),
      S('out', 'get out', 'check', { approaches: ['stealth', 'pilot', 'athletics'], rating: 25, hours: [2, 6] }),
    ],
    complications: ['the alarm is raised', 'reinforcements arrive', 'the charges fail', 'the exit is cut off'],
  },
  frontline: {
    id: 'frontline', name: 'a front-line engagement', objective: 'hold the line on {world}', fromPosting: true,
    stages: [
      S('brief', 'the briefing and the ground', 'check', { approaches: ['tactics', 'investigate', 'sense'], rating: 20, hours: [2, 6] }),
      S('battle', 'the battle', 'battle', { battle: 'ground' }),
      S('hold', 'hold the position', 'fight', { foes: { grade: 2, count: [4, 8] } }),
    ],
    complications: ['the flank gives way', 'enemy armour breaks through', 'the line is cut', 'the command post is shelled'],
  },
  fleet: {
    id: 'fleet', name: 'a fleet action', objective: 'meet the enemy fleet off {world}', fromPosting: true,
    stages: [
      S('scout', 'find the enemy fleet', 'check', { approaches: ['pilot', 'tactics', 'investigate'], rating: 20, hours: [4, 12] }),
      S('battle', 'the fleet action', 'battle', { battle: 'ship' }),
    ],
    complications: ['the enemy jumps in early', 'a cruiser is crippled', 'the formation breaks'],
  },
  infiltration: {
    id: 'infiltration', name: 'an infiltration', objective: 'get inside on {world} and bring out what is there', fromPosting: false,
    stages: [
      S('way', 'a way in', 'check', { approaches: ['persuade', 'stealth', 'tech', 'influence'], rating: 25, hours: [4, 12] }),
      S('cover', 'keep the cover', 'check', { approaches: ['persuade', 'endure', 'reason', 'influence', 'read'], need: 2, rating: 25, hours: [20, 48] }),
      S('objective', 'the objective inside', 'check', { approaches: ['investigate', 'tech', 'stealth'], rating: 30, hours: [2, 8] }),
      S('exit', 'the exit', 'check', { approaches: ['stealth', 'persuade', 'athletics', 'influence'], rating: 25, hours: [2, 6] }),
    ],
    complications: ['the cover is blown', 'a guard grows suspicious', 'the files are not where they should be', 'the exit is watched'],
  },
  manhunt: {
    id: 'manhunt', name: 'a manhunt', objective: 'track the quarry from {world} and take them', fromPosting: false,
    stages: [
      S('trail', 'pick up the trail', 'check', { approaches: ['investigate', 'track', 'sense', 'persuade', 'influence'], rating: 25, hours: [6, 24] }),
      S('follow', 'follow it to the next world', 'travel', { elsewhere: true }),
      S('close', 'close in', 'check', { approaches: ['track', 'stealth', 'tactics', 'sense'], need: 2, rating: 30, hours: [6, 24] }),
      S('take', 'capture or kill', 'fight', { foes: { grade: 3, count: [1, 3] } }),
    ],
    complications: ['the trail goes cold', 'the quarry is warned', 'a false lead', 'hired guns stand in the way'],
  },
  investigation: {
    id: 'investigation', name: 'an investigation', objective: 'find out what is happening on {world}', fromPosting: false,
    stages: [
      S('lead1', 'the first lead', 'check', { approaches: ['investigate', 'persuade', 'sense', 'influence'], rating: 20, hours: [6, 24] }),
      S('lead2', 'lead to lead', 'check', { approaches: ['investigate', 'persuade', 'reason', 'tech', 'read', 'influence'], need: 2, rating: 25, hours: [6, 24] }),
      S('plot', 'uncover the plot', 'check', { approaches: ['reason', 'investigate', 'sense'], rating: 30, hours: [4, 12] }),
      S('confront', 'the confrontation', 'fight', { foes: { grade: 3, count: [2, 4] } }),
    ],
    complications: ['a witness disappears', 'the evidence is planted', 'someone powerful leans on the case', 'the plotters move first'],
  },
  escort: {
    id: 'escort', name: 'an escort', objective: 'see your charge safely to {world}', fromPosting: false, deadlineDays: 21,
    stages: [
      S('route', 'plan the route', 'check', { approaches: ['tactics', 'pilot', 'investigate'], rating: 15, hours: [2, 6] }),
      S('ambush', 'the ambush', 'fight', { foes: { grade: 2, count: [3, 6] } }),
      S('deliver', 'the handover', 'check', { approaches: ['persuade', 'tactics', 'sense', 'influence'], rating: 20, hours: [2, 6] }),
    ],
    complications: ['the charge is hurt', 'the route is betrayed', 'the reception is hostile'],
  },
  rescue: {
    id: 'rescue', name: 'a rescue', objective: 'find and bring out the captives on {world}', fromPosting: true, deadlineDays: 14,
    stages: [
      S('locate', 'locate them', 'check', { approaches: ['investigate', 'sense', 'persuade', 'track', 'influence'], rating: 25, hours: [4, 12] }),
      S('in', 'get in', 'check', { approaches: ['stealth', 'tactics', 'tech'], rating: 30, hours: [2, 6] }),
      S('free', 'free them', 'fight', { foes: { grade: 2, count: [3, 6] } }),
      S('out', 'get them out', 'check', { approaches: ['pilot', 'stealth', 'athletics', 'tactics'], rating: 25, hours: [2, 6] }),
    ],
    complications: ['the captives have been moved', 'one of them is wounded', 'the guards are doubled', 'pursuit'],
  },
  recon: {
    id: 'recon', name: 'a reconnaissance', objective: 'scout the enemy on {world} and report', fromPosting: true,
    stages: [
      S('approach', 'the approach', 'check', { approaches: ['stealth', 'pilot', 'athletics'], rating: 20, hours: [3, 8] }),
      S('observe', 'watch and count', 'check', { approaches: ['investigate', 'tactics', 'sense', 'endure'], need: 2, rating: 25, hours: [8, 24] }),
      S('back', 'get the report back', 'check', { approaches: ['stealth', 'pilot', 'tech'], rating: 20, hours: [2, 6] }),
    ],
    complications: ['a patrol passes close', 'the comlink is jammed', 'the scouts are spotted'],
  },
  diplomacy: {
    id: 'diplomacy', name: 'a diplomatic mission', objective: 'bring the parties on {world} to terms', fromPosting: false,
    stages: [
      S('audience', 'the audience', 'check', { approaches: ['persuade', 'reason', 'sense', 'influence'], rating: 20, hours: [3, 8] }),
      S('talks', 'the talks', 'check', { approaches: ['persuade', 'reason', 'endure', 'influence', 'read'], need: 2, rating: 30, hours: [8, 24] }),
      S('spoiler', 'the spoiler', 'check', { approaches: ['investigate', 'sense', 'tactics', 'influence'], rating: 25, hours: [4, 12] }),
      S('accord', 'the accord', 'check', { approaches: ['persuade', 'reason', 'influence', 'read'], rating: 30, hours: [3, 8] }),
    ],
    complications: ['a delegate walks out', 'an assassin strikes', 'the terms leak', 'old grievances flare'],
  },
};
export const MISSION_TYPE_IDS = Object.keys(MISSION_TYPES);

/**
 * Which types come to whom, by path and war (weights; invented). A posting's missions are drawn from the types launched from a
 * posting. m9-release A11 (Jared, 27 Nov 2026): the weights lean toward the path's strengths. A Guardian sees fewer pure skill-check
 * investigations and diplomacy (more escorts, rescues, manhunts, the front line); a Consular more of them; a Sentinel the
 * investigator's and infiltrator's share. A Sith Warrior the front line and the hunt; an Inquisitor infiltration and investigation.
 */
export const MISSION_TYPE_WEIGHTS: Readonly<Record<'jediGuardian' | 'jediSentinel' | 'jediConsular' | 'sithWarrior' | 'sithInquisitor' | 'military' | 'jobs', { peace: Readonly<Record<string, number>>; war: Readonly<Record<string, number>> }>> = {
  jediGuardian: { peace: { escort: 3, rescue: 2, manhunt: 2, recon: 2, investigation: 1, diplomacy: 1 }, war: { frontline: 4, strike: 3, rescue: 2, recon: 1, escort: 1, fleet: 1 } },
  jediSentinel: { peace: { investigation: 3, manhunt: 2, infiltration: 2, escort: 1, rescue: 1, recon: 1, diplomacy: 1 }, war: { strike: 3, recon: 2, infiltration: 2, rescue: 2, frontline: 2, investigation: 1 } },
  jediConsular: { peace: { diplomacy: 4, investigation: 3, escort: 1, rescue: 1, recon: 1 }, war: { diplomacy: 2, rescue: 2, recon: 2, investigation: 2, frontline: 1, strike: 1, escort: 1, fleet: 1 } },
  sithWarrior: { peace: { manhunt: 3, strike: 2, investigation: 1, infiltration: 1 }, war: { frontline: 4, strike: 3, manhunt: 2, fleet: 1 } },
  sithInquisitor: { peace: { infiltration: 3, investigation: 3, manhunt: 2, diplomacy: 1 }, war: { infiltration: 3, strike: 2, manhunt: 2, recon: 2, frontline: 1 } },
  military: { peace: { recon: 3, escort: 3, rescue: 1, strike: 1 }, war: { frontline: 4, strike: 2, recon: 2, rescue: 1, fleet: 1 } },
  jobs: { peace: { escort: 3, manhunt: 2, infiltration: 2, recon: 1 }, war: { escort: 3, infiltration: 2, manhunt: 2, strike: 1 } },
};

/** The rules for deciding a stage (B3; invented). */
export const STAGE_RULES = {
  /** A check approach not in the stage's list rolls at this much more rating (a poor fit). */
  poorFit: 20,
  /** Each complication on the stage adds this much rating. */
  harderPerComplication: 10,
  /** A failure this bad inserts a complication stage (a fight to get clear, the trail picked up again). */
  badFailure: -5,
  /** The mission fails when a stage fails with this many complications already on the mission. */
  maxComplications: 4,
  /** Each ally on the mission who is better at the approach's skill: +2, at most +4. */
  allyBonus: 2,
  allyBonusMax: 4,
  /** A check attempt's default hours when the stage gives none. */
  defaultHours: [2, 6] as readonly [number, number],
  /** A fight stage's foes when the stage gives none. */
  defaultFoes: { grade: 2, count: [2, 5] as readonly [number, number] },
  /** A master or Padawan on the mission holds this share of a fight stage's foes (allies stay story-only in the duel, D-143E). */
  allyHoldsShare: 0.5,
  /** Days a mission can wait for the character to set out before the Order gives it to someone else. */
  setOutDays: 7,
  /**
   * Field experience on a stage's check, by rank (m9-release A11; invented): a Master's years of missions count. The closed form gives
   * a Master little more than a Knight in the skills most checks read (Charisma, Intelligence, Tactics), so without it a Master
   * failed missions as often as a Knight.
   */
  experience: { master: 1 } as Readonly<Record<string, number>>,
} as const;

/**
 * Field practice (Jared, 27 Nov 2026, m9-tune A2: Jedi keep training in the field; invented hours): a day of a mission's stage work
 * leaves room for a short session on the routine's plan (`hours`, shared over the plan's biggest blocks in half-hour steps).
 * None on a day with a fight or a battle, none while wounded past minor, one a day.
 */
export const FIELD_PRACTICE = { hours: 1.5 } as const;

/**
 * Leads found in play (Jared, 27 Nov 2026, m9-release A13): the narrator may propose a lead on an investigation or a manhunt, and
 * the code checks it: a lead here adds a stage (follow the lead), a lead to another world adds the trip and a stage there, a lead
 * past the job becomes a follow-up mission on the same thread when this one succeeds. At most `maxPerMission` (invented).
 */
export const LEADS = { types: ['investigation', 'manhunt'] as readonly string[], maxPerMission: 2 } as const;
export const LEAD_STAGE: StageDef = { id: 'lead', label: 'follow the lead', kind: 'check', approaches: ['investigate', 'persuade', 'track', 'sense', 'influence'], rating: 25, hours: [4, 12] };

/** The complication stages a bad failure inserts, by the stage's kind (B3). */
export const COMPLICATION_STAGES: Readonly<Record<string, StageDef>> = {
  fight: S('clear', 'fight your way clear', 'fight', { foes: { grade: 2, count: [2, 5] } }),
  check: S('recover', 'pick up the thread again', 'check', { approaches: ['investigate', 'track', 'persuade', 'sense', 'tactics', 'influence'], rating: 25, hours: [6, 24] }),
};

/** Wounds on a mission (B8, Jared approved): a severe wound or worse ends the character's part; a moderate one carries on only in an
 * all-hands situation (outside one it sends the character back: a reading); a minor one carries on. */
export const MISSION_WOUNDS = { evacuate: ['severe', 'critical', 'mortal'], carryOnInAllHands: ['moderate'], carryOn: ['minor'] } as const;

/** Standing with the Order (or the character's faction) from missions (B9): points on each end, clamped (invented). */
export const MISSION_STANDING = { success: 2, failure: -3, cutShort: 0, min: -15, max: 15 } as const;

/** The mission history kept in the save (the record B6 reads keeps its counts forever). */
export const MISSION_HISTORY_MAX = 20;

/**
 * The Council's best (B6; a proposal): who the Council moves between fronts and sends straight on. A Jedi Master; a Knight with
 * top-tier combat (the main form at 70 or more); or a Knight in high standing (70+) with a strong record (5+ missions done, three
 * in four of them successes). Sith Lords by the same test. An NPC master (B7): a Jedi Master, or a Knight whose best form is 70+.
 */
export const COUNCIL_BEST = { topCombat: 70, standing: 70, minMissions: 5, successShare: 0.75 } as const;

/**
 * A Master is among the Council's best only on a field path (Jared, 27 Nov 2026, m9-release A10): archivists, scholars and the like
 * (Jocasta Nu) are not chained between fronts. The path is the archetype's war-year share (data/wars.ts WAR_YEAR_SHARE: 0 is not
 * a field path); a canon figure with no generated archetype is read from these words in their role or description (invented).
 */
export const NON_FIELD_WORDS: readonly string[] = ['archivist', 'archives', 'librarian', 'scholar', 'historian', 'chronicler', 'healer', 'archaeologist', 'researcher', 'lorekeeper'];

/**
 * Sent straight on at a mission's end (B6b; invented): the chance for the Council's best, by war, and the kind drawn: a related
 * follow-up (the plot leads to the next world, the same thread), another front (in a war), or an urgent recall (when an
 * all-hands event is running; otherwise a follow-up).
 */
export const CHAIN = { chanceWar: 0.6, chancePeace: 0.35, followUp: 0.5, front: 0.3, recall: 0.2, maxChain: 5 } as const;

/**
 * Postings in a total war (B5b, B5c; invented). Knights, Masters and Lords, and serving soldiers, officers, pilots and gunners,
 * are posted by default; a posting runs until its front's war events end, a recall, or an evacuation for a serious wound. Leave:
 * a real trip home every 90-180 days, for 7-14 days.
 */
export const POSTING = {
  ranks: ['knight', 'master', 'lord'] as readonly string[],
  careers: ['soldier', 'officer', 'navalOfficer', 'starfighterPilot', 'shipGunner', 'sniper', 'mandalorian'] as readonly string[],
  leaveEvery: [90, 180] as readonly [number, number],
  leaveDays: [7, 14] as readonly [number, number],
  /** Worlds within this many grid squares of the front's world are local to it (a posting's missions are launched there). */
  localSquares: 2,
} as const;

/** A front: one campaign of a total war, with its forward base or flagship (B5b). Years in BBY (negative = ABY). */
export interface FrontDef {
  id: string;
  warId: string;
  name: string;
  /** The map world the forward base stands on. */
  world: string;
  /** The forward base or flagship, as the player reads it. */
  base: string;
  fromBby: number;
  toBby: number;
  /** The sides that fight on it (the posting's side must be one). */
  sides: readonly string[];
  source: string;
}

const REP = ['republic', 'jediOrder'] as const;
const EMP = ['sithEmpire', 'sith'] as const;
/**
 * The fronts (B5b). Places and years from the timeline files (worldNetwork3661.ts, SW_Timeline_*); the forward bases' names and
 * any year marked "reading" are invented.
 */
export const FRONTS: readonly FrontDef[] = [
  // The Great Sith War (4,000-3,996), total since m9-release A14. The bases and the spans marked "reading" are invented.
  { id: 'gsw.krath', warId: 'greatSithWar', name: 'the war against the Krath', world: 'Empress Teta', base: 'the Republic fleet in the Empress Teta system', fromBby: 3998, toBby: 3996, sides: [...REP, 'sith'], source: 'a reading (SW_Characters_04-05_GreatSithWar: the Krath of the Empress Teta system; the years a reading)' },
  { id: 'gsw.ossus', warId: 'greatSithWar', name: 'the defence of Ossus', world: 'Ossus', base: 'the Jedi enclave on Ossus', fromBby: 3996, toBby: 3996, sides: [...REP, 'sith', 'mandalorians'], source: 'SW_Characters_04-05_GreatSithWar (the Battle of Ossus, 3,996)' },
  { id: 'gsw.yavin', warId: 'greatSithWar', name: 'the assault on Yavin 4', world: 'Yavin 4', base: 'the Jedi fleet over Yavin', fromBby: 3996, toBby: 3996, sides: [...REP, 'sith'], source: 'SW_Characters_04-05_GreatSithWar (Exar Kun defeated at Yavin 4, 3,996)' },
  // The Jedi Civil War (3,959-3,956), total since m9-release A14.
  { id: 'jcw.dantooine', warId: 'jediCivilWar', name: 'the Dantooine front', world: 'Dantooine', base: 'the Jedi Enclave on Dantooine', fromBby: 3959, toBby: 3956, sides: [...REP, 'sith'], source: 'a reading (the Enclave a Jedi base through the war; the span a reading)' },
  // The Great Galactic War (3,681-3,653).
  { id: 'ggw.balmorra', warId: 'greatGalacticWar', name: 'the Balmorra front', world: 'Balmorra', base: 'the forward base on Balmorra', fromBby: 3681, toBby: 3653, sides: [...REP, ...EMP], source: 'worldNetwork3661 E.3653.balmorra_ceded (Balmorra under occupation, left to the Empire in 3,653); the start year a reading' },
  { id: 'ggw.hydian', warId: 'greatGalacticWar', name: 'the Hydian Way front', world: 'Devaron', base: 'the fleet base at Devaron', fromBby: 3661, toBby: 3660, sides: [...REP, ...EMP, 'mandalorians'], source: 'worldNetwork3661 E.3661.blockade, the battle near Devaron, E.3660 the Battle on the Hydian Way' },
  { id: 'ggw.rim', warId: 'greatGalacticWar', name: 'the Rim Campaign', world: 'Ord Radama', base: 'the forward base at Ord Radama', fromBby: 3661, toBby: 3657, sides: [...REP, ...EMP], source: 'worldNetwork3661 E.3661.rim_campaign, E.3660.ord_radama; the end year a reading' },
  { id: 'ggw.core', warId: 'greatGalacticWar', name: 'the strike into Imperial space', world: 'Ziost', base: 'the flagship of the Republic strike fleet', fromBby: 3660, toBby: 3660, sides: [...REP, ...EMP], source: 'worldNetwork3661 E.3660.ziost, the Battle of Korriban (3,660)' },
  { id: 'ggw.rhenvar', warId: 'greatGalacticWar', name: 'the defence of Rhen Var', world: 'Rhen Var', base: 'the Republic outpost on Rhen Var', fromBby: 3654, toBby: 3654, sides: [...REP, ...EMP], source: 'worldNetwork3661 E.3654.rhen_var' },
  { id: 'ggw.alderaan', warId: 'greatGalacticWar', name: 'the Alderaan front', world: 'Alderaan', base: 'the Republic garrison on Alderaan', fromBby: 3667, toBby: 3653, sides: [...REP, ...EMP], source: 'a reading (Alderaan fought over in the war; the peace conference, 3,653)' },
  // The Galactic War (3,641-3,637).
  { id: 'gw.corellia', warId: 'galacticWar', name: 'the Corellian front', world: 'Corellia', base: 'the Republic headquarters on Corellia', fromBby: 3640, toBby: 3640, sides: [...REP, ...EMP, 'mandalorians'], source: 'opt-2 D3 (Karrid\'s assault, the Battle of Corellia, 3,640)' },
  { id: 'gw.ilum', warId: 'galacticWar', name: 'the Ilum campaign', world: 'Ilum', base: 'the Republic base on Ilum', fromBby: 3640, toBby: 3640, sides: [...REP, ...EMP], source: 'opt-2 D3 (the Battle of Ilum, 3,640)' },
  { id: 'gw.balmorra', warId: 'galacticWar', name: 'the Balmorra resistance', world: 'Balmorra', base: 'the resistance camp on Balmorra', fromBby: 3641, toBby: 3637, sides: [...REP, ...EMP], source: 'a reading (Balmorra still occupied, the Krikthasi Massacre 3,644)' },
  { id: 'gw.taris', warId: 'galacticWar', name: 'the Taris front', world: 'Taris', base: 'the resettlement base on Taris', fromBby: 3641, toBby: 3637, sides: [...REP, ...EMP], source: 'a reading (the Taris Resettlement, 3,648 on)' },
  // The Light and Darkness War (1,010-1,000).
  { id: 'ldw.ruusan', warId: 'lightAndDarknessWar', name: 'the Ruusan campaign', world: 'Ruusan', base: 'the Army of Light\'s camp on Ruusan', fromBby: 1002, toBby: 1000, sides: [...REP], source: 'SW_Timeline_2000_1000BBY_Part2 (the seven battles of Ruusan)' },
  { id: 'ldw.korriban', warId: 'lightAndDarknessWar', name: 'the war against the Brotherhood', world: 'Korriban', base: 'the Army of Light\'s fleet', fromBby: 1010, toBby: 1003, sides: [...REP, 'sith'], source: 'SW_Timeline_2000_1000BBY_Part2 (the Brotherhood\'s headquarters on Korriban); the base a reading' },
  // The Clone Wars (22-19).
  { id: 'cw.geonosis', warId: 'cloneWars', name: 'the Geonosis campaign', world: 'Geonosis', base: 'the forward command on Geonosis', fromBby: 22, toBby: 21, sides: [...REP, 'independent'], source: 'SW_Timeline_32_19BBY (the First and Second Battles of Geonosis)' },
  { id: 'cw.ryloth', warId: 'cloneWars', name: 'the Ryloth campaign', world: 'Ryloth', base: 'the Republic fleet over Ryloth', fromBby: 21, toBby: 21, sides: [...REP, 'independent'], source: 'SW_Timeline_32_19BBY (the liberation of Ryloth)' },
  { id: 'cw.outerRim', warId: 'cloneWars', name: 'the Outer Rim Sieges', world: 'Felucia', base: 'the forward base on Felucia', fromBby: 20, toBby: 19, sides: [...REP, 'independent', 'mandalorians'], source: 'SW_Timeline_32_19BBY (the Outer Rim Sieges; Aayla Secura on Felucia)' },
  { id: 'cw.mygeeto', warId: 'cloneWars', name: 'the Mygeeto siege', world: 'Mygeeto', base: 'the siege lines on Mygeeto', fromBby: 20, toBby: 19, sides: [...REP, 'independent'], source: 'SW_Timeline_32_19BBY (Mygeeto)' },
  { id: 'cw.kashyyyk', warId: 'cloneWars', name: 'the Kashyyyk front', world: 'Kashyyyk', base: 'the beachhead at Kachirho', fromBby: 19, toBby: 19, sides: [...REP, 'independent'], source: 'SW_Timeline_32_19BBY (the Battle of Kashyyyk)' },
  // The Yuuzhan Vong War (25-29 ABY).
  { id: 'yvw.ithor', warId: 'yuuzhanVongWar', name: 'the Ithor front', world: 'Ithor', base: 'the fleet at Ithor', fromBby: -25, toBby: -25, sides: [...REP, 'sithEmpire'], source: 'SW_Timeline_25_44ABY (the Battle of Ithor)' },
  { id: 'yvw.fondor', warId: 'yuuzhanVongWar', name: 'the Fondor front', world: 'Fondor', base: 'the Fondor shipyards', fromBby: -26, toBby: -28, sides: [...REP, 'sithEmpire'], source: 'SW_Timeline_25_44ABY (Fondor); the years a reading' },
  { id: 'yvw.corellia', warId: 'yuuzhanVongWar', name: 'the Corellian front', world: 'Corellia', base: 'the Corellian defence fleet', fromBby: -26, toBby: -29, sides: [...REP, 'sithEmpire'], source: 'a reading (the Core\'s defence after Coruscant fell)' },
];

/** Worlds missions from home go to in peace and in a limited war (curated: known, reachable worlds), each a map world (B4). */
export const MISSION_WORLDS: readonly string[] = [
  'Alderaan', 'Ord Mantell', 'Taris', 'Dantooine', 'Tatooine', 'Nar Shaddaa', 'Ryloth', 'Corellia', 'Bothawui', 'Devaron', 'Kashyyyk',
  'Bespin', 'Voss', 'Serenno', 'Ithor', 'Jabiim', 'Felucia', 'Saleucami', 'Mygeeto', 'Geonosis', 'Balmorra', 'Quesh', 'Hoth', 'Ossus',
];
