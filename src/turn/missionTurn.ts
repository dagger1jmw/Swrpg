// Missions in the turn (m9-missions B3, B4, B6, B8; spec/missions.md). Pure: the code decides each stage from the player's
// approach (a skill roll, a fight, a battle, or travel), moves the character on a mission's travel, evacuates a badly wounded
// character, sends the Council's best straight on, and offers the mission's choices. The narrator tells it; it never resolves a
// stage, moves the character between worlds or ends the mission.
import type { Choice } from '../ai/schemas/compose';
import type { Intent } from '../ai/schemas/intent';
import { MENTION_ONLY, PLANETS } from '../data/galaxyMap';
import { APPROACHES, MISSION_TYPES, type ApproachId } from '../data/missions.config';
import { minionKindForYear } from '../data/npcGen.config';
import { dateFromAbsDay } from '../engine/calendar';
import { efficiency } from '../engine/fatigue';
import { nextFloat, type RngState } from '../engine/rng';
import { checkRating, type CheckCard } from '../engine/rolls';
import { allHandsNow, allHandsWorld, allyBonus, approachFor, approachRating, buildMission, chainRoll, complicationLine, councilBestReason, currentStage, failsMission, frontsFor, pickMissionType, postingFor, selectCurrentWorld, selectDutySide, selectHomeBase, selectSideWar, stageFoeCount, woundVerdict, type Mission } from '../features/duty/selectors';
import { selectFatigue, selectIsSpent, selectLastingPenalty, selectWoundPenalty, selectWounds } from '../features/health/selectors';
import { selectPerformance, selectRust } from '../features/progression/selectors';
import { selectStanding } from '../features/ranks/selectors';
import { resolveLocationRef } from '../features/locations/selectors';
import { advanceTime } from '../state/advanceTime';
import { applyEvents, type AppliedEvent, type RejectedEvent } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { GameEvent, Registry } from '../state/types';
import { playXpFromCheck } from './resolve';
import { planTravel, type TravelOutcome } from './travel';

/** What a mission step did to the turn: the state after it and what to add to the draft. */
export interface MissionStep {
  state: GameState;
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  notices: string[];
  report: string[];
  checks: CheckCard[];
  seconds: number;
}

const yearOf = (s: GameState): number => dateFromAbsDay(s.clock.now.day).year;
const forceUser = (s: GameState): boolean => s.character.path === 'jedi' || s.character.path === 'sith' || s.character.path === 'outsider';

/** A runner for engine events and time on a state (collects what the turn's draft needs). */
function runner(registry: Registry<GameState>, initial: GameState) {
  const out: MissionStep = { state: initial, applied: [], rejected: [], notices: [], report: [], checks: [], seconds: 0 };
  const apply = (events: readonly unknown[]): AppliedEvent[] => {
    const r = applyEvents(registry, out.state, events, { source: 'engine' });
    out.state = r.state;
    out.applied.push(...r.applied);
    out.rejected.push(...r.rejected);
    out.notices.push(...r.notices);
    for (const a of r.applied) out.report.push(...a.notes);
    return r.applied;
  };
  /** Hours pass on the mission: work by day, a night's sleep between (no free day on a mission, B11). */
  const pass = (hours: number, occupation: 'activity' | 'rest', why: string): void => {
    let left = Math.max(0, hours);
    while (left > 0) {
      const chunk = Math.min(left, 16);
      const r = advanceTime(registry, out.state, { seconds: Math.round(chunk * 3600), reason: why, source: 'turnDraft', occupation });
      out.state = r.state;
      out.applied.push(...r.applied);
      out.rejected.push(...r.rejected);
      out.notices.push(...r.notices);
      out.seconds += r.secondsAdvanced;
      left -= chunk;
      if (left > 0) {
        const z = advanceTime(registry, out.state, { seconds: 8 * 3600, reason: `${why}: the night`, source: 'turnDraft', occupation: 'sleep' });
        out.state = z.state;
        out.applied.push(...z.applied);
        out.rejected.push(...z.rejected);
        out.notices.push(...z.notices);
        out.seconds += z.secondsAdvanced;
        apply([{ type: 'sleepCompleted', hours: 8 }]);
      }
    }
  };
  const rng = (): RngState => out.state.meta.rngState;
  const setRng = (r: RngState): void => {
    out.state = { ...out.state, meta: { ...out.state.meta, rngState: r } };
  };
  const draw = (): number => {
    const [u, r] = nextFloat(rng());
    setRng(r);
    return u;
  };
  return { out, apply, pass, rng, setRng, draw };
}

/** The enemy a mission's fight stage meets, by the side's war and the year (B3): a minion kind of the era. */
function enemyKind(s: GameState, m: Mission): string {
  const side = selectDutySide(s);
  const war = selectSideWar(s);
  const year = yearOf(s);
  const peaceful = !war || ['investigation', 'diplomacy', 'escort', 'manhunt', 'infiltration'].includes(m.type);
  let want = 'thug';
  if (!peaceful || m.type === 'frontline') {
    if (side === 'sithEmpire' || side === 'sith') want = 'trooper';
    else if (war?.id === 'cloneWars') want = 'battleDroid';
    else if (war?.id === 'yuuzhanVongWar') want = 'yuuzhanVongWarrior';
    else if (war?.id === 'galacticCivilWar') want = 'stormtrooper';
    else if (war?.id === 'greatGalacticWar' || war?.id === 'galacticWar') want = 'sithTrooper';
    else if (war) want = 'trooper';
  }
  return minionKindForYear(want, year).kind;
}

/**
 * A turn's approach to the current stage (B3): a check rolled, a fight or a battle begun. Null when the mission has no stage on
 * site or the turn takes no approach to it (the turn is story; the stage waits).
 */
export function tryMissionStage(registry: Registry<GameState>, state: GameState, intent: Intent | null, explicit: string | null): MissionStep | null {
  const m = state.duty.mission;
  const stage = currentStage(m);
  if (!m || !stage || stage.kind === 'travel' || stage.fightId !== null || stage.battleFrom !== null) return null;
  if (state.combat.active || state.battles.active || state.battles.ground || state.battles.planning) return null;
  const approach = approachFor(stage, intent, explicit, forceUser(state));
  if (approach === null && !(explicit === 'battle' && stage.kind === 'battle') && !(explicit === 'go' && stage.kind !== 'check')) return null;
  const run = runner(registry, state);
  const { apply } = run;
  if (stage.kind === 'battle' || explicit === 'battle') {
    const foe = enemyKind(state, m);
    const count = stage.battle === 'ship' ? 3 : 6;
    const before = state.battles.history.length;
    // A fleet action in plain words the battle code reads (the side's classes of each kind in service).
    if (stage.battle === 'ship') apply([{ type: 'shipBattleProposed', what: `enemy: ${count} frigates, two corvettes; allies: ${count} frigates, two corvettes` }]);
    // A front-line engagement holds a position (its objective): the player's side defends it.
    else apply([{ type: 'groundBattlePlanned', site: m.targetWorld, enemy: `${count} ${foe === 'battleDroid' ? 'B1s' : 'troops'}, artillery`, ours: '6 troops, armour, artillery', ...(m.type === 'frontline' ? { defending: true } : {}) }]);
    const opened = run.out.state.battles.planning !== null || run.out.state.battles.active !== null || run.out.state.battles.ground !== null;
    if (!opened) {
      // The battle could not be opened (the code's checks refused it): it is fought in the line instead, as a fight.
      run.out.report.push(`mission: the battle could not be opened (${run.out.rejected.map((r) => r.reason).join('; ') || 'refused'}); fought in the line`);
      return startFight(run, m, stage, state);
    }
    apply([{ type: 'missionStageStarted', fightId: null, battleFrom: before }]);
    run.out.report.push(`mission: ${stage.label}: the battle is opened (${stage.battle === 'ship' ? 'a fleet action' : 'a ground battle'})`);
    return run.out;
  }
  if (stage.kind === 'fight' || approach === 'fight') return startFight(run, m, { ...stage, foes: stage.foes ?? { grade: 2, count: [2, 5] } }, state);
  // A check (B3): the approach's skill against the stage's rating, the allies' help, the wounds and fatigue as any roll.
  const a = APPROACHES[approach as ApproachId];
  const skill = a.skill!;
  const { rating, fit } = approachRating(stage, approach as ApproachId);
  const own = selectPerformance(state, skill);
  const help = allyBonus(state, m, skill, own);
  const [card, r1] = checkRating(state.meta.rngState, {
    label: `${stage.label}: ${a.label.toLowerCase()}`,
    skillId: skill,
    levelInputs: {
      level: own,
      woundPenalty: 1 - (1 - selectWoundPenalty(state, skill)) * (1 - selectLastingPenalty(state, skill)),
      rust: selectRust(state, skill),
      vitalitySpent: selectIsSpent(state),
      fatigueEfficiency: efficiency(selectFatigue(state).p),
    },
    modifiers: help.value ? [{ source: `help from ${help.who.join(', ')}`, value: help.value }] : [],
    rating,
    notes: [fit ? 'an approach that fits the stage' : 'a poor fit for this stage (harder)', ...(stage.harder ? [`${stage.harder} complication(s) make it harder`] : [])],
  });
  run.setRng(r1);
  run.out.checks.push(card);
  const [lo, hi] = stage.hours;
  const hours = Math.round((lo + run.draw() * (hi - lo)) * 10) / 10;
  if (card.success) apply([{ type: 'missionStageResolved', success: true, why: `${a.label} (margin ${card.margin.toFixed(1)})` }]);
  else {
    const comp = complicationLine(m, run.draw());
    const fail = failsMission(m);
    apply([{ type: 'missionStageResolved', success: false, why: `${a.label} failed (margin ${card.margin.toFixed(1)})`, complication: comp, ...(fail ? { failMission: true } : card.margin <= -5 ? { insert: true } : {}) }]);
  }
  // XP from what was done (B9; the existing sources): a Stealth roll is field use, a persuasion with no one named a social line.
  const xp = playXpFromCheck(run.out.state, { actionType: approach === 'persuade' ? 'dialogue' : 'other', skillId: skill, difficulty: card.difficulty, success: card.success, rating: card.rating, npcTargets: [] });
  if (xp.length) apply(xp);
  run.pass(hours, 'activity', `mission: ${stage.label}`);
  run.out.report.push(`mission: ${stage.label}: ${a.label.toLowerCase()} rolled ${card.total.toFixed(1)} against DC ${card.dc.toFixed(1)} (${card.success ? 'success' : 'failure'}); ${hours} h`);
  return run.out;
}

/** A fight stage begun (B3: the combat engine decides it): minions of the era, a share held by the allies on the mission (B7). */
function startFight(run: ReturnType<typeof runner>, m: Mission, stage: NonNullable<ReturnType<typeof currentStage>>, s0: GameState): MissionStep {
  const kind = enemyKind(s0, m);
  const count = stageFoeCount(stage, m, run.draw());
  run.apply([{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind, count }], stakes: 'serious', terrainTags: [] }]);
  const id = run.out.state.combat.active?.id ?? null;
  if (id) {
    run.apply([{ type: 'missionStageStarted', fightId: id, battleFrom: null }]);
    run.out.report.push(`mission: ${stage.label}: a fight against ${count} (${kind})${m.party.masterId || m.party.padawanId ? '; your companion holds the rest' : ''}`);
  } else run.out.report.push(`mission: ${stage.label}: the fight could not begin (${run.out.rejected.map((r) => r.reason).join('; ')})`);
  return run.out;
}

const WORLDS = [...PLANETS, ...MENTION_ONLY];
const isMapWorld = (name: string | null | undefined): name is string => !!name && WORLDS.some((p) => p.name.toLowerCase() === name.toLowerCase());

/** The worlds a code move goes to after a trip (B4): the mission's target, a travel stage's world, the base; a posting's base; home on leave. */
function moveWorlds(s: GameState): string[] {
  const out: string[] = [];
  const m = s.duty.mission;
  if (m) {
    out.push(m.targetWorld);
    const st = m.stages[m.current];
    if (st?.kind === 'travel' && st.world) out.push(st.world);
    if (m.base.planet) out.push(m.base.planet);
  }
  const home = selectHomeBase(s);
  if (home?.planet) out.push(home.planet);
  if (s.duty.posting) out.push(s.duty.posting.base.planet);
  return out.filter(isMapWorld);
}

/** The engine's move to a map world (created when new): a mission's travel ends there in code (B4). */
function moveTo(s: GameState, world: string): GameEvent[] {
  const id = resolveLocationRef(s, world);
  if (id) return [{ type: 'locationChanged', locationRef: id }];
  const w = WORLDS.find((p) => p.name.toLowerCase() === world.toLowerCase())!;
  return [{ type: 'locationIntroduced', name: w.name, kind: 'planet', region: w.region || 'Outer Rim Territories', description: '', moveHere: true }];
}

/**
 * After a turn (B3, B4, B6, B8): the code moves the character at the end of a mission's trip, decides a stage whose fight or battle
 * has ended, cuts the mission short for a bad wound (an evacuation home for a severe one), ends it back at base, and sends the
 * Council's best straight on when the work is done.
 */
export function missionAfterTurn(registry: Registry<GameState>, state: GameState, travel: TravelOutcome | null, arrived: boolean, atStart: { id: string; outcome: string | null } | null = null): MissionStep {
  const run = runner(registry, state);
  const { apply, out } = run;
  // The trip's end (B4): the character is moved to the world, and a mission's arrival is recorded.
  if (travel?.ok && arrived && moveWorlds(out.state).some((w) => w.toLowerCase() === travel.to.toLowerCase())) {
    apply(moveTo(out.state, travel.to));
    const m = out.state.duty.mission;
    if (m && m.phase === 'outbound' && m.targetWorld.toLowerCase() === travel.to.toLowerCase()) apply([{ type: 'missionArrived', where: 'target' }]);
    const st = m ? currentStage(m) : null;
    if (m && st?.kind === 'travel' && st.world?.toLowerCase() === travel.to.toLowerCase()) apply([{ type: 'missionArrived', where: 'stage' }]);
  }
  const m0 = out.state.duty.mission;
  const stage = currentStage(m0);
  // A fight stage's fight is over (B3: the combat engine's result stands).
  if (m0 && stage?.fightId && !out.state.combat.active && out.state.combat.last?.id === stage.fightId) {
    const o = out.state.combat.last.outcome;
    if (o === 'won') apply([{ type: 'missionStageResolved', success: true, why: 'the fight was won' }]);
    else {
      const comp = o === 'fled' ? 'driven back' : o === 'lost' ? 'beaten in the fight' : complicationLine(m0, run.draw());
      apply([{ type: 'missionStageResolved', success: false, why: `the fight ended: ${o}`, complication: comp, ...(failsMission(m0) || o === 'lost' ? { failMission: failsMission(m0) || o === 'lost' } : {}) }]);
    }
  }
  // A battle stage's battle is over (B3: the battle engine's result stands).
  const st2 = currentStage(out.state.duty.mission);
  const b = out.state.battles;
  if (st2?.battleFrom !== null && st2?.battleFrom !== undefined && b.active === null && b.ground === null && b.planning === null) {
    const rec = b.history.length > st2.battleFrom ? b.history[b.history.length - 1]! : null;
    if (rec?.outcome === 'won') apply([{ type: 'missionStageResolved', success: true, why: `the battle was won (${rec.reason})` }]);
    else apply([{ type: 'missionStageResolved', success: false, why: rec ? `the battle was ${rec.outcome}` : 'the battle went on without you', complication: rec ? `the battle was ${rec.outcome}` : 'the battle went on without you', ...(failsMission(out.state.duty.mission!) ? { failMission: true } : {}) }]);
  }
  // Wounds (B8): a severe wound or worse ends the character's part (evacuated home, cut short); a moderate one sends them back
  // outside an all-hands situation; a minor one carries on.
  const m1 = out.state.duty.mission;
  const battleOpen = out.state.battles.active !== null || out.state.battles.ground !== null || out.state.battles.planning !== null;
  if (m1 && m1.outcome === null && !out.state.combat.active && !battleOpen && !out.state.health.death) {
    const verdict = woundVerdict(selectWounds(out.state), allHandsNow(out.state) !== null);
    if (verdict) {
      const evac = verdict.what === 'evacuate';
      apply([{ type: 'missionOutcome', outcome: 'cutShort', why: `${evac ? 'evacuated' : 'sent back'}: a ${verdict.wound.severity} wound` }]);
      if (evac && out.state.duty.posting) apply([{ type: 'postingEnded', why: `evacuated with a ${verdict.wound.severity} wound` }]);
      const home = evac ? selectHomeBase(out.state) : m1.base;
      const to = home?.planet ?? null;
      if (to && isMapWorld(to) && selectCurrentWorld(out.state)?.toLowerCase() !== to.toLowerCase()) {
        const trip = planTravel(out.state, { actionType: 'travel', targets: [], references: [], unknownNames: [to] } as Intent);
        const hours = trip?.ok ? trip.hours! : 48;
        run.pass(hours, 'rest', evac ? 'evacuated home' : 'sent back to base');
        apply(moveTo(out.state, to));
        out.report.push(`mission: ${evac ? 'evacuated' : 'sent back'} to ${to} (${hours} h)`);
      }
      apply([{ type: 'missionEnded', how: evac ? 'evacuated home' : 'sent back to base', outcome: 'cutShort' }]);
      return out;
    }
  }
  // The work done (B6): the Council's best sent straight on; everyone else heads back to base.
  const m2 = out.state.duty.mission;
  // The work done this turn (the mission the turn began with, with no outcome then).
  const doneNow = atStart !== null ? atStart.id === m2?.id && atStart.outcome === null : !m0?.outcome;
  if (m2 && m2.outcome === 'success' && m2.phase === 'return' && doneNow) {
    const best = councilBestReason(out.state, selectStanding(out.state)) !== null;
    const how = chainRoll(out.state, best, run.draw(), run.draw(), allHandsNow(out.state) !== null);
    if (how) chain(run, how);
  }
  // Back at base with the work done or failed: the mission ends at once (B4).
  const m3 = out.state.duty.mission;
  if (m3 && m3.outcome !== null) {
    const here = selectCurrentWorld(out.state);
    if (here && m3.base.planet && here.toLowerCase() === m3.base.planet.toLowerCase()) apply([{ type: 'missionEnded', how: 'back at base', outcome: m3.outcome }]);
  }
  return out;
}

/** Sent straight on (B6b): a follow-up on the same thread to the next world, another front, or an urgent recall. */
function chain(run: ReturnType<typeof runner>, how: 'followUp' | 'front' | 'recall'): void {
  const s = run.out.state;
  const m = s.duty.mission!;
  const here = selectCurrentWorld(s);
  let base = m.base;
  let world: string | null = null;
  let type = MISSION_TYPES[m.type]!;
  if (how === 'front') {
    const p = postingFor(s, run.draw(), run.draw(), s.duty.posting?.frontId);
    if (p) {
      run.apply([{ type: 'postingAssigned', posting: p }]);
      base = { ...p.base };
      world = p.base.planet;
      type = MISSION_TYPES['frontline']!;
    }
  } else if (how === 'recall') {
    world = allHandsWorld(s);
    type = MISSION_TYPES['frontline']!;
  }
  if (!world) {
    // A follow-up: the plot leads on to the next world (a curated world, or a front of the war), the same story thread.
    const side = selectDutySide(s);
    const war = selectSideWar(s);
    const fronts = war && side ? frontsFor(war.id, side, yearOf(s)).map((f) => f.world) : [];
    const pool = [...fronts, 'Alderaan', 'Ord Mantell', 'Taris', 'Nar Shaddaa', 'Tatooine', 'Corellia', 'Ryloth', 'Dantooine'].filter((w) => isMapWorld(w) && w.toLowerCase() !== (here ?? '').toLowerCase());
    world = pool[Math.min(pool.length - 1, Math.floor(run.draw() * pool.length))]!;
    if (how === 'followUp') type = pickMissionType(s, run.draw());
  }
  const sx = run.out.state;
  const built = buildMission(sx, { type, world, base, id: `m${sx.duty.seq + 1}`, chainOf: m.id, chainLength: m.chainLength + 1, here, ...(how === 'followUp' ? { threadTitle: m.threadTitle } : {}) }, sx.meta.rngState);
  run.setRng(built.rng);
  if (how !== 'followUp') run.apply([{ type: 'threadOpened', title: built.mission.threadTitle, stakes: how === 'recall' ? 'An urgent recall from the Council.' : 'Moved to another front.', entityRefs: [] }]);
  run.apply([{ type: 'missionChained', how, mission: built.mission }]);
}

/**
 * The mission's own choices (B3, B4, B5): set out for the target, the approaches to the current stage, go in to a fight or take
 * a place in a battle, follow the trail, head back; travel to the front, home on leave, back from leave. The code's, first.
 */
export function missionChoices(s: GameState): Choice[] {
  const out: Choice[] = [];
  const m = s.duty.mission;
  const here = (selectCurrentWorld(s) ?? '').toLowerCase();
  const travel = (label: string, world: string): Choice => ({ label, intent: { actionType: 'travel', targetRef: world } });
  if (s.duty.status === 'mission' && m) {
    if (m.outcome !== null) {
      if (m.base.planet && here !== m.base.planet.toLowerCase()) out.push(travel(`Head back to ${m.base.name}`, m.base.planet));
      return out;
    }
    if (m.phase === 'outbound') return [travel(`Set out for ${m.targetWorld} (${MISSION_TYPES[m.type]?.name ?? 'the mission'})`, m.targetWorld)];
    const st = currentStage(m);
    if (!st || st.fightId || st.battleFrom !== null) return out;
    if (st.kind === 'travel' && st.world) return [travel(`${st.label[0]!.toUpperCase()}${st.label.slice(1)}: travel to ${st.world}`, st.world)];
    if (st.kind === 'fight') return [{ label: `Go in: ${st.label} (a fight)`, intent: { actionType: 'other', missionApproach: 'go' } }];
    if (st.kind === 'battle') return [{ label: `Take your place: ${st.label} (${st.battle === 'ship' ? 'a fleet action' : 'a battle'})`, intent: { actionType: 'other', missionApproach: 'battle' } }];
    const fu = forceUser(s);
    for (const a of st.approaches.slice(0, 4)) {
      const def = APPROACHES[a as ApproachId];
      if (!def || (!fu && a === 'sense')) continue;
      out.push({ label: `${st.label[0]!.toUpperCase()}${st.label.slice(1)}: ${def.label.toLowerCase()}`, intent: { actionType: 'other', missionApproach: a } });
    }
    return out;
  }
  const p = s.duty.posting;
  const home = selectHomeBase(s);
  if (p && s.duty.leave && home?.planet && here !== home.planet.toLowerCase()) out.push(travel(`Go home on leave to ${home.name}`, home.planet));
  else if (p && !s.duty.leave && here !== p.base.planet.toLowerCase()) out.push(travel(`Travel to ${p.front} (${p.base.name})`, p.base.planet));
  return out;
}
