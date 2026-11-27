// Duty, missions and home days (Jared, 26 Nov 2026; opt-2 D; spec/duty.md). Every number here is invented, to tune
// (reports/opt-2.md lists them). Code owns the status: the narrator never sets it.

/**
 * The daily mission roll (opt-2 D2): while the character is at home (off duty), each day has a chance of an assignment that grows
 * with the days off duty. A smooth rising curve: a Weibull hazard of shape `shape`, starting after `quietDays`, scaled so half
 * the characters are assigned by the median. Peace about 5 weeks (rarely past 2 months: about 6%), war about 10 days.
 */
export const MISSION_ROLL = {
  /** No assignment in the first days home. */
  quietDays: 2,
  /** The hazard's shape (above 1: rising with the days off duty). */
  shape: 2.5,
  /** Median days off duty before an assignment, for a Jedi Knight (scale 1). */
  medianPeace: 35,
  medianWar: 10,
} as const;

/**
 * The median's scale by rank, path and posting (opt-2 D2; Jared: a Jedi Knight more than a Padawan at the Temple; a soldier by
 * posting). Larger = rarer. Null = no missions (Initiates and acolytes train at home; civilians have no posting).
 */
export const MISSION_SCALE_BY_RANK: Readonly<Record<string, number | null>> = {
  initiate: null,
  acolyte: null,
  // 1.6 -> 1.2 (Jared, 27 Nov 2026, m9-missions A2): applies only to a Padawan or apprentice without a master (B7).
  padawan: 1.2,
  apprentice: 1.2,
  knight: 1,
  lord: 1,
  master: 1.2,
};
/** Careers by archetype: a soldier, officer, pilot or agent is posted (1); a smuggler or bounty hunter takes jobs (1.3); the rest none. */
export const MISSION_SCALE_BY_CAREER: Readonly<Record<string, number>> = {
  soldier: 1,
  officer: 1,
  navalOfficer: 1,
  starfighterPilot: 1,
  shipGunner: 1,
  sniper: 1,
  intelAgent: 1,
  intelAnalyst: 1.2,
  mandalorian: 1,
  smuggler: 1.3,
  bountyHunter: 1.3,
};

/** What a mission is called, by path and war (the thread's title: "Mission: an escort"). */
export const MISSION_KINDS: Readonly<Record<'jedi' | 'sith' | 'military' | 'jobs', { peace: readonly string[]; war: readonly string[] }>> = {
  jedi: { peace: ['an escort', 'a mediation', 'an investigation', 'a relief mission', 'a diplomatic mission'], war: ['a front-line posting', 'a strike mission', 'an escort through the war zone', 'a relief mission'] },
  sith: { peace: ['an errand for your master', 'a hunt', 'an investigation', 'an assignment from the Ministry'], war: ['a front-line posting', 'a strike mission', 'a hunt behind the lines'] },
  military: { peace: ['a patrol', 'an escort', 'a deployment', 'a reconnaissance'], war: ['a combat deployment', 'a raid', 'a reconnaissance in force', 'a convoy escort'] },
  jobs: { peace: ['a job', 'a run', 'a contract'], war: ['a job in the war zone', 'a blockade run', 'a contract'] },
};

/**
 * The injury check on every assignment (opt-2 D3): an unhealed wound blocks assignment until it is healed enough. "Minor" is the
 * existing scale's lowest band (health.md section 5: W 1-9). In an all-hands-on-deck situation a minor wound does not block;
 * anything worse still does. A wound counts as healed enough at three quarters of its healing.
 */
export const DUTY_INJURY = { healedEnough: 0.75 } as const;

/** Days an all-hands event keeps its call after it settles (opt-2 D3), when the lore gives it no end. */
export const ALL_HANDS_TAIL_DAYS = 14;

/** Duty's log of assignments, ends and blocked rolls (kept short). */
export const DUTY_LOG_MAX = 30;
