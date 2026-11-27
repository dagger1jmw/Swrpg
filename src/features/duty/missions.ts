// Mission rules (m9-missions B; spec/missions.md). Pure (Golden Rule 2): who gets which mission and where, the stages, which
// approach a turn takes to a stage and what it rolls, the Council's best, postings and leave, and the old saves' migration.
import { APPROACHES, CHAIN, COUNCIL_BEST, FORCE_APPROACHES, FRONTS, MISSION_TYPES, MISSION_TYPE_WEIGHTS, MISSION_WORLDS, MISSION_WOUNDS, NON_FIELD_WORDS, POSTING, STAGE_RULES, type ApproachId, type FrontDef, type MissionTypeDef, type StageDef } from '../../data/missions.config';
import { MISSION_SCALE_BY_RANK } from '../../data/duty.config';
import { factionWar, WAR_YEAR_SHARE, type War } from '../../data/wars';
import { closedWorlds, mapSide, MENTION_ONLY, PLANETS } from '../../data/galaxyMap';
import { FORM_IDS } from '../../data/skills';
import { dateFromAbsDay } from '../../engine/calendar';
import { gridDistance } from '../../engine/travel';
import { nextFloat, nextInt, type RngState } from '../../engine/rng';
import type { Wound } from '../../engine/wounds';
import type { GameState } from '../../state/gameState';
import { selectLevelExact } from '../progression/selectors';
import { selectNpc, selectNpcLevel } from '../npcs/selectors';
import { selectAtPlace, selectDutySide } from './home';
import { emptyRecord, type DutySlice, type Mission, type MissionStage, type Posting } from './duty';

const yearOf = (s: GameState): number => dateFromAbsDay(s.clock.now.day).year;
/** A world on the galaxy map (charted, or mentioned with a grid square: Ruusan), as travel reads it. */
const WORLDS = [...PLANETS, ...MENTION_ONLY];
const mapWorld = (name: string) => WORLDS.find((p) => p.name.toLowerCase() === name.toLowerCase()) ?? null;

const PATH_FACTION: Readonly<Record<string, string>> = { jedi: 'jediOrder', sith: 'sithEmpire' };
const OFF_ROUTE = /wild space|unknown regions/i;

/**
 * A world the code may send the character to (m9-release A11): on the map, open to the character's side this year (the galaxy
 * map's gates, as travel reads them), and on the charted routes (no liner flies off them). Missions, follow-ups, a manhunt's next
 * world, postings, proposals and leads go only to such worlds, so no assignment waits on a trip the travel rules refuse.
 */
export function worldOpen(s: GameState, name: string): boolean {
  const w = mapWorld(name);
  if (!w || OFF_ROUTE.test(w.region)) return false;
  const faction = s.character.start?.faction ?? PATH_FACTION[s.character.path] ?? 'unknown';
  const bby = -yearOf(s);
  const n = w.name.toLowerCase();
  return !closedWorlds(mapSide(faction), bby).some((g) => g.place.toLowerCase() === n || n.startsWith(`${g.place.toLowerCase()} `));
}

/** The war the character's side fights today (the one war list), or null in peace. */
export const selectSideWar = (s: GameState): War | null => factionWar(selectDutySide(s), yearOf(s));

/** The character's master on missions (B7): a living NPC master, for a Padawan or apprentice. */
export function selectMissionMaster(s: GameState): string | null {
  const id = s.ranks.masterId;
  if (!id || (s.ranks.rank !== 'padawan' && s.ranks.rank !== 'apprentice')) return null;
  const n = selectNpc(s, id);
  return n && n.status !== 'deceased' ? id : null;
}

/** The character's own Padawan on missions (a Knight or Master who has one), or null. */
export function selectMissionPadawan(s: GameState): string | null {
  const id = s.ranks.apprenticeId ?? null;
  if (!id) return null;
  const n = selectNpc(s, id);
  return n && n.status !== 'deceased' ? id : null;
}

/** A field path (m9-release A10): the archetype counts war years, or (no archetype) no archivist's or scholar's words. */
export function fieldPath(archetype: string | null | undefined, words: string): boolean {
  if (archetype) return (WAR_YEAR_SHARE[archetype] ?? 0) > 0;
  const w = words.toLowerCase();
  return !NON_FIELD_WORDS.some((x) => w.includes(x));
}

const bestForm = (level: (id: string) => number): number => Math.max(0, ...FORM_IDS.filter((f) => f !== 'jarKai').map(level));

/** An NPC master as the Council's best (B6a for an NPC, B7): a Jedi Master or Sith Lord, or a Knight whose best form is 70+. */
export function npcIsCouncilBest(s: GameState, id: string): boolean {
  const n = selectNpc(s, id);
  if (!n) return false;
  if (n.role === 'jediMaster') return fieldPath(n.gen?.archetype, `${n.role} ${n.description ?? ''}`);
  return bestForm((f) => selectNpcLevel(s, id, f)) >= COUNCIL_BEST.topCombat;
}

/**
 * The Council's best (B6a; the proposal, data COUNCIL_BEST): a Master; a Knight (or Lord) with top-tier combat; or one in high
 * standing with a strong record. A Padawan with a master is moved with the master (B7). `standing` is the ranks feature's
 * standing (passed in: features read each other through selectors, and the ranks selector reads duty).
 */
export function councilBestReason(s: GameState, standing: number): string | null {
  const master = selectMissionMaster(s);
  if (master) return npcIsCouncilBest(s, master) ? 'your master is among the Council\'s best' : null;
  const rank = s.ranks.rank;
  if (rank === 'master') return fieldPath(s.character.archetype, '') ? 'a Jedi Master on a field path' : null;
  if (rank !== 'knight' && rank !== 'lord') return null;
  const main = s.character.mainFormId ? selectLevelExact(s, s.character.mainFormId) : bestForm((f) => selectLevelExact(s, f));
  if (main >= COUNCIL_BEST.topCombat) return `top-tier combat (main form ${main.toFixed(0)})`;
  const r = s.duty.record;
  const done = r.successes + r.failures;
  if (standing >= COUNCIL_BEST.standing && done >= COUNCIL_BEST.minMissions && r.successes / Math.max(1, done) >= COUNCIL_BEST.successShare) return `high standing and a strong record (${r.successes} of ${done})`;
  return null;
}

/** The median scale for the daily roll (B7: a Padawan with a master shares the master's: a Master 1.2, a Knight 1). */
export function missionScaleFor(s: GameState, own: number | null): number | null {
  const master = selectMissionMaster(s);
  if (master) return selectNpc(s, master)?.role === 'jediMaster' ? (MISSION_SCALE_BY_RANK['master'] ?? 1.2) : (MISSION_SCALE_BY_RANK['knight'] ?? 1);
  return own;
}

// ---- Postings (B5) ----

/** Whether the character is posted by default in a total war (B5b): Knights, Masters, Lords and serving fighters; a Padawan with a
 * master goes where the master goes (B7: a master who is a Knight or Master is posted). */
export function postingEligible(s: GameState): boolean {
  const master = selectMissionMaster(s);
  if (master) return ['jediKnight', 'jediMaster', 'sithLord'].includes(selectNpc(s, master)?.role ?? '');
  if (POSTING.ranks.includes(s.ranks.rank)) return true;
  return s.ranks.service !== undefined && POSTING.careers.includes(s.character.archetype ?? '');
}

/** The fronts of a war running in a year for a side. */
export function frontsFor(warId: string, side: string, year: number, s?: GameState): FrontDef[] {
  return FRONTS.filter((f) => f.warId === warId && f.sides.includes(side) && year >= -f.fromBby && year <= -f.toBby && mapWorld(f.world) !== null && (!s || worldOpen(s, f.world)));
}

/** A front still has its war events running (B5b: a posting ends when they end). */
export function frontRunning(frontId: string, year: number): boolean {
  const f = FRONTS.find((x) => x.id === frontId);
  return f !== undefined && year >= -f.fromBby && year <= -f.toBby;
}

/** A posting to a front, drawn with `u` (null when the war has no front for the side this year). */
export function postingFor(s: GameState, u: number, leaveU: number, except?: string): Posting | null {
  const war = selectSideWar(s);
  const side = selectDutySide(s);
  if (!war || war.intensity !== 'total' || !side) return null;
  const all = frontsFor(war.id, side, yearOf(s), s).filter((f) => f.id !== except);
  if (!all.length) return null;
  const f = all[Math.min(all.length - 1, Math.floor(u * all.length))]!;
  const day = s.clock.now.day;
  const [lo, hi] = POSTING.leaveEvery;
  // Leave from the war's first posting (m9-release A8): a later posting in the same war keeps the clock while it runs ahead.
  const clock = s.duty.leaveClock;
  const nextLeaveDay = clock && clock.warId === war.id && clock.nextLeaveDay > day ? clock.nextLeaveDay : day + Math.round(lo + leaveU * (hi - lo));
  const base = { name: f.base, planet: f.world };
  return { frontId: f.id, front: f.name, warId: war.id, base, sinceDay: day, nextLeaveDay, arrived: selectAtPlace(s, base) };
}

// ---- Building a mission (B1, B2, B4) ----

/** The weights' row (m9-release A11: by the path's archetype; an outsider trains as a Jedi archetype). */
const pathSet = (s: GameState): keyof typeof MISSION_TYPE_WEIGHTS => {
  const path = s.character.path;
  const a = s.character.archetype ?? '';
  if (path === 'jedi' || path === 'outsider') return a === 'jediConsular' || a === 'jediSentinel' ? a : 'jediGuardian';
  if (path === 'sith') return a === 'sithInquisitor' ? 'sithInquisitor' : 'sithWarrior';
  return a === 'smuggler' || a === 'bountyHunter' ? 'jobs' : 'military';
};

/** A mission type for this character now, drawn with `u` (B2): by path and war; a posting's from the types launched there. */
export function pickMissionType(s: GameState, u: number): MissionTypeDef {
  const war = selectSideWar(s) !== null;
  const weights = MISSION_TYPE_WEIGHTS[pathSet(s)][war ? 'war' : 'peace'];
  const entries = Object.entries(weights).filter(([id]) => MISSION_TYPES[id] && (!s.duty.posting || MISSION_TYPES[id]!.fromPosting));
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let x = u * total;
  for (const [id, w] of entries) {
    if (x < w) return MISSION_TYPES[id]!;
    x -= w;
  }
  return MISSION_TYPES[entries[entries.length - 1]![0]]!;
}

/**
 * The target world (B4, B5e): from a forward base, the front's world or a world within POSTING.localSquares of it; from home in a
 * war, a front of the side's war (or a curated world); in peace, a curated world. Never the base's own world unless local.
 */
export function pickWorld(s: GameState, base: { planet: string | null }, u: number): string {
  const posting = s.duty.posting;
  if (posting && !s.duty.leave) {
    const home = mapWorld(posting.base.planet);
    const near = home ? PLANETS.filter((p) => (gridDistance(p.grid, home.grid) ?? 99) <= POSTING.localSquares && /Rim|Colonies|Core|Expansion|Slice/.test(p.region) && worldOpen(s, p.name)) : [];
    const list = [posting.base.planet, ...near.map((p) => p.name).filter((n) => n !== posting.base.planet).slice(0, 8)];
    return list[Math.min(list.length - 1, Math.floor(u * list.length))]!;
  }
  const war = selectSideWar(s);
  const side = selectDutySide(s);
  const fronts = war && side ? frontsFor(war.id, side, yearOf(s), s).map((f) => f.world) : [];
  const pool = (fronts.length && u < 0.5 ? fronts : MISSION_WORLDS).filter((w) => worldOpen(s, w) && w !== base.planet);
  const v = fronts.length && u < 0.5 ? u * 2 : fronts.length ? (u - 0.5) * 2 : u;
  return pool[Math.min(pool.length - 1, Math.floor(v * pool.length))] ?? 'Alderaan';
}

/** A stage from its data, fresh. */
export function stageFromDef(d: StageDef, world: string | null = null, addedBy: string | null = null): MissionStage {
  return {
    id: d.id,
    label: d.label,
    kind: d.kind,
    approaches: [...(d.approaches ?? [])],
    need: d.need ?? 1,
    progress: 0,
    rating: d.rating ?? 35,
    hours: [...(d.hours ?? STAGE_RULES.defaultHours)] as [number, number],
    harder: 0,
    foes: d.kind === 'fight' ? { grade: (d.foes ?? STAGE_RULES.defaultFoes).grade, count: [...(d.foes ?? STAGE_RULES.defaultFoes).count] as [number, number] } : null,
    battle: d.battle ?? null,
    world,
    fightId: null,
    battleFrom: null,
    status: 'pending',
    addedBy,
  };
}

/** The base a mission launches from and comes home to: the forward base while posted (not on leave), else the home base. */
export function missionBase(s: GameState, home: { name: string; planet: string | null } | null): { name: string; planet: string | null } {
  if (s.duty.posting && !s.duty.leave) return { ...s.duty.posting.base };
  return home ?? { name: 'home', planet: null };
}

/**
 * A mission, built by the code (B1): its type, objective, world, base, deadline, stages and party. `rng` draws the world for a
 * manhunt's next world. A chained mission (B6) keeps the thread when it is a related follow-up.
 */
export function buildMission(s: GameState, o: { type: MissionTypeDef; world: string; base: { name: string; planet: string | null }; id: string; threadTitle?: string; chainOf?: string; chainLength?: number; here?: string | null }, rng: RngState): { mission: Mission; rng: RngState } {
  let r = rng;
  const stages: MissionStage[] = [];
  for (const d of o.type.stages) {
    let world: string | null = null;
    if (d.kind === 'travel' && d.elsewhere) {
      let u: number;
      [u, r] = nextFloat(r);
      const pool = MISSION_WORLDS.filter((w) => w !== o.world && w !== o.base.planet && worldOpen(s, w));
      world = pool[Math.min(pool.length - 1, Math.floor(u * pool.length))] ?? null;
    }
    stages.push(stageFromDef(d, world));
  }
  const title = `Mission: ${o.type.name} on ${o.world}`.slice(0, 80);
  const day = s.clock.now.day;
  const atTarget = o.here !== undefined && o.here !== null && o.here.toLowerCase() === o.world.toLowerCase();
  if (atTarget) stages[0] = { ...stages[0]!, status: 'active' };
  const mission: Mission = {
    id: o.id,
    type: o.type.id,
    title,
    objective: o.type.objective.replace('{world}', o.world).slice(0, 160),
    threadTitle: (o.threadTitle ?? title).slice(0, 80),
    targetWorld: o.world,
    targetPlace: null,
    base: o.base,
    deadlineDay: o.type.deadlineDays !== undefined ? day + o.type.deadlineDays : null,
    stages,
    current: 0,
    complications: [],
    phase: atTarget ? 'onSite' : 'outbound',
    outcome: null,
    assignedDay: day,
    party: { masterId: selectMissionMaster(s), padawanId: selectMissionPadawan(s), allyIds: [] },
    chainOf: o.chainOf ?? null,
    chainLength: o.chainLength ?? 0,
    leftHome: atTarget,
  };
  return { mission, rng: r };
}

// ---- Deciding a stage (B3) ----

/** The current stage of a mission on site, or null. */
export const currentStage = (m: Mission | null): MissionStage | null => (m && m.phase === 'onSite' && m.outcome === null ? (m.stages[m.current] ?? null) : null);

/** Whether the current stage waits on the player (B11: a skip stops there): a check, a fight or a battle on site. */
export const stageNeedsPlayer = (m: Mission | null): boolean => {
  const st = currentStage(m);
  return st !== null && st.kind !== 'travel';
};

const ACTION_APPROACH: Readonly<Record<string, ApproachId>> = { investigate: 'investigate', dialogue: 'persuade', forceUse: 'sense' };

/**
 * The approach a turn takes to the current check stage (B3, the check rule; spec/missions.md section 4): the code's own choice
 * first (it names the approach); else the intent's skill when an approach reads that skill; else the intent's action (investigate,
 * persuade, the Force; a fight with no one named forces the way through); else none (the turn is story, the stage waits).
 */
export function approachFor(stage: MissionStage, intent: { actionType: string; skillId?: string | undefined; targets?: readonly string[]; forceAbility?: string | undefined } | null, explicit: string | null, forceUser: boolean): ApproachId | null {
  const allowed = (a: ApproachId): boolean => forceUser || !FORCE_APPROACHES.includes(a);
  if (explicit && explicit in APPROACHES && allowed(explicit as ApproachId)) return explicit as ApproachId;
  if (!intent) return null;
  if (stage.kind === 'fight' && intent.actionType === 'fight') return 'fight';
  // The intent's skill: the stage's own approach on that skill first (m9-tune B1: Willpower is "hold your nerve" or "influence",
  // Force Sense "reach out" or "read them"), else the first approach on it. A mind trick or Force persuasion is influence.
  const onSkill = intent.skillId ? (Object.keys(APPROACHES) as ApproachId[]).filter((a) => APPROACHES[a].skill === intent.skillId && allowed(a)) : [];
  const bySkill = onSkill.find((a) => stage.approaches.includes(a)) ?? onSkill[0];
  if (bySkill) return bySkill;
  if ((intent.forceAbility === 'mindTrick' || intent.forceAbility === 'forcePersuasion') && allowed('influence') && stage.approaches.includes('influence')) return 'influence';
  if (intent.actionType === 'fight' && !(intent.targets ?? []).length) return 'fight';
  const byAction = ACTION_APPROACH[intent.actionType];
  return byAction && allowed(byAction) ? byAction : null;
}

/** The rating an approach rolls against (B3): the stage's, more for each complication on it, more for a poor fit. */
export function approachRating(stage: MissionStage, approach: ApproachId): { rating: number; fit: boolean } {
  const fit = stage.approaches.includes(approach);
  return { rating: stage.rating + stage.harder * STAGE_RULES.harderPerComplication + (fit ? 0 : STAGE_RULES.poorFit), fit };
}

/** The allies' help on a roll (B7: the master's skills take part as an ally): +2 for each ally better at the skill, at most +4. */
export function allyBonus(s: GameState, m: Mission, skill: string, own: number): { value: number; who: string[] } {
  const ids = [m.party.masterId, m.party.padawanId, ...m.party.allyIds].filter((x): x is string => !!x);
  const who = ids.filter((id) => selectNpcLevel(s, id, skill) > own).map((id) => selectNpc(s, id)?.name ?? id);
  return { value: Math.min(STAGE_RULES.allyBonusMax, who.length * STAGE_RULES.allyBonus), who };
}

/** A fight stage's foes (B7: an ally on the mission holds a share of them). */
export function stageFoeCount(stage: MissionStage, m: Mission, u: number): number {
  const [lo, hi] = stage.foes?.count ?? STAGE_RULES.defaultFoes.count;
  const n = Math.round(lo + u * (hi - lo));
  const allies = [m.party.masterId, m.party.padawanId, ...m.party.allyIds].filter(Boolean).length;
  return Math.max(1, allies ? Math.ceil(n * (1 - STAGE_RULES.allyHoldsShare)) : n);
}

/** A complication line for a failed stage, drawn with `u`. */
export function complicationLine(m: Mission, u: number): string {
  const list = MISSION_TYPES[m.type]?.complications ?? ['things go wrong'];
  return list[Math.min(list.length - 1, Math.floor(u * list.length))]!;
}

/** Whether a stage's failure fails the whole mission (B3: only when the code says so: too many complications already). */
export const failsMission = (m: Mission): boolean => m.complications.length >= STAGE_RULES.maxComplications;

// ---- Wounds on a mission (B8) ----

/** What a wound does to the character's part in the mission (B8): 'evacuate', 'sendBack' (moderate outside all hands) or null. */
export function woundVerdict(wounds: readonly Wound[], allHands: boolean): { what: 'evacuate' | 'sendBack'; wound: Wound } | null {
  const open = wounds.filter((w) => w.healProgress < 0.75);
  const worst = (sev: readonly string[]) => open.find((w) => sev.includes(w.severity));
  const ev = worst(MISSION_WOUNDS.evacuate);
  if (ev) return { what: 'evacuate', wound: ev };
  const mod = worst(MISSION_WOUNDS.carryOnInAllHands);
  if (mod && !allHands) return { what: 'sendBack', wound: mod };
  return null;
}

// ---- Chains (B6) ----

/** At a mission's successful end, whether the Council's best is sent straight on, and how (B6b). */
export function chainRoll(s: GameState, best: boolean, u: number, kindU: number, allHands: boolean): 'followUp' | 'front' | 'recall' | null {
  const m = s.duty.mission;
  if (!best || !m || m.chainLength >= CHAIN.maxChain) return null;
  const war = selectSideWar(s);
  if (u >= (war ? CHAIN.chanceWar : CHAIN.chancePeace)) return null;
  const front = war !== null && war.intensity === 'total' && s.duty.posting !== null;
  if (kindU < CHAIN.recall && allHands) return 'recall';
  if (front && kindU < CHAIN.recall + CHAIN.front) return 'front';
  return 'followUp';
}

// ---- Old saves (B12) ----

const OLD_KIND_TYPE: readonly [RegExp, string][] = [
  [/escort|convoy/i, 'escort'], [/strike|raid/i, 'strike'], [/front-line|combat deployment|deployment|in force/i, 'frontline'],
  [/investigation/i, 'investigation'], [/relief|rescue/i, 'rescue'], [/mediation|diplomatic|errand|ministry/i, 'diplomacy'],
  [/hunt/i, 'manhunt'], [/patrol|reconnaissance/i, 'recon'], [/blockade run|run\b|job|contract/i, 'escort'],
];

/**
 * An opt-2 duty slice as v2 (B12): a character mid-mission under opt-2's duty state gets a mission record built from it. The type
 * from its name ("Mission: a strike mission" is a strike); the world is where the character is when they had left home (they are
 * at the target, on its first stage), else a curated world picked from the title (they still have to set out).
 */
export function migrateDutyV2(old: Record<string, unknown>, raw?: Record<string, unknown>): DutySlice {
  const o = old as Partial<DutySlice> & { mission?: { title: string; threadTitle: string; assignedDay: number; leftHome: boolean } | null };
  const base: DutySlice = {
    status: o.status ?? 'home',
    since: o.since ?? 0,
    mission: null,
    homeDay: o.homeDay ?? null,
    resume: o.resume ?? null,
    home: o.home ?? null,
    log: o.log ?? [],
    posting: null,
    leave: null,
    record: emptyRecord(),
    history: [],
    seq: 0,
    proposalDay: null,
    proposal: null,
    ...(o.devAllHands ? { devAllHands: true } : {}),
  };
  const m = o.mission;
  if (!m || o.status !== 'mission') return { ...base, status: 'home', mission: null };
  const type = MISSION_TYPES[OLD_KIND_TYPE.find(([re]) => re.test(m.title))?.[1] ?? 'investigation']!;
  const here = m.leftHome ? currentWorldOf(raw) : null;
  let h = 0;
  for (const ch of m.title) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const world = here ?? MISSION_WORLDS[h % MISSION_WORLDS.length]!;
  const stages = type.stages.map((d) => stageFromDef(d, d.kind === 'travel' && d.elsewhere ? (MISSION_WORLDS[(h >> 3) % MISSION_WORLDS.length] === world ? 'Alderaan' : MISSION_WORLDS[(h >> 3) % MISSION_WORLDS.length]!) : null));
  if (here) stages[0] = { ...stages[0]!, status: 'active' };
  const homeName = o.home?.name ?? 'home';
  const mission: Mission = {
    id: 'm1', type: type.id, title: m.title.slice(0, 80), objective: type.objective.replace('{world}', world), threadTitle: m.threadTitle,
    targetWorld: world, targetPlace: null, base: { name: homeName, planet: o.home?.planet ?? null }, deadlineDay: null, stages, current: 0, complications: [],
    phase: here ? 'onSite' : 'outbound', outcome: null, assignedDay: m.assignedDay, party: { masterId: null, padawanId: null, allyIds: [] }, chainOf: null, chainLength: 0, leftHome: m.leftHome,
  };
  return { ...base, status: 'mission', mission, seq: 1 };
}

/** The map world the raw save's character stands on (for the migration), or null. */
function currentWorldOf(raw?: Record<string, unknown>): string | null {
  const locs = raw?.['locations'] as { currentId?: string | null; byId?: Record<string, { name: string; parentId?: string | null; aliases?: string[] }> } | undefined;
  let id = locs?.currentId ?? null;
  for (let i = 0; id && i < 12; i++) {
    const l = locs?.byId?.[id];
    if (!l) break;
    if (mapWorld(l.name)) return mapWorld(l.name)!.name;
    id = l.parentId ?? null;
  }
  return null;
}

/** A draw from [lo, hi] (whole numbers). */
export const drawInt = (rng: RngState, lo: number, hi: number): [number, RngState] => nextInt(rng, lo, hi);
