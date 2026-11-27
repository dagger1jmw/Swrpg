// Duty selectors (opt-2 D; spec/duty.md): the side panel's duty and fitness lines, the narrator's state line, a home day's
// people and places, and the "Resume the skip" choice. Read-only.
import { APPROACHES, LEADS, type ApproachId } from '../../data/missions.config';
import type { GameState } from '../../state/gameState';
import type { Mission } from './duty';
import { selectWounds } from '../health/selectors';
import { selectLocationChain } from '../locations/selectors';
import { selectRelationship } from '../relationships/selectors';
import { selectOpenThreads } from '../threads/selectors';
import { sameNamed, selectAtHome, selectHomeBase } from './home';
import { allHandsNow, injuryBlock, missionMedian } from './rules';


const days = (n: number): string => `${n} day${n === 1 ? '' : 's'}`;
const PART: Readonly<Record<string, string>> = { torso: 'torso', head: 'head', leftArm: 'left arm', rightArm: 'right arm', leftLeg: 'left leg', rightLeg: 'right leg', leftHand: 'left hand', rightHand: 'right hand' };

/** The current stage in words: "stage 2 of 4: reach the target (progress 1 of 2)". */
function stageWords(m: Mission): string {
  if (m.outcome !== null) return m.outcome === 'success' ? 'the work is done: head back' : m.outcome === 'failure' ? 'the mission has failed: head back' : 'cut short';
  if (m.phase === 'outbound') return `set out for ${m.targetWorld}`;
  const st = m.stages[m.current];
  if (!st) return 'on site';
  const prog = st.need > 1 ? ` (progress ${st.progress} of ${st.need})` : '';
  const where = st.kind === 'travel' && st.world ? ` to ${st.world}` : '';
  return `stage ${m.current + 1} of ${m.stages.length}: ${st.label}${where}${prog}`;
}

/** Who is on the mission besides the character (B1, B7), by name. */
function partyNames(s: GameState, m: Mission): string[] {
  return [m.party.masterId, m.party.padawanId, ...m.party.allyIds].filter((x): x is string => !!x).map((id) => s.npcs.byId[id]?.name ?? id);
}

/** The duty status in words (the side panel). */
export function selectDutyLine(s: GameState): string {
  const d = s.duty;
  const n = Math.max(0, s.clock.now.day - d.since);
  if (d.status === 'mission' && d.mission) return `On a mission: ${d.mission.title.replace(/^Mission: /, '')} (${stageWords(d.mission)}; ${days(n)})`;
  if (d.posting && d.leave) return `On leave from ${d.posting.front} until ${days(Math.max(0, d.leave.untilDay - s.clock.now.day))} from now`;
  // Posted but not there yet (m9-release A6): the order stands, the trip is the player's to take.
  if (d.posting && d.posting.arrived === false && !selectAtHome(s)) return `Posted to ${d.posting.front} (${d.posting.base.name}), not yet left`;
  const home = selectHomeBase(s);
  const where = home ? (selectAtHome(s) ? `at ${home.label}` : `away from ${home.label}`) : 'no home base now';
  return missionMedian(s) === null ? `Off duty, ${where} (no missions at this rank)` : `Off duty ${days(n)}, ${where}`;
}

/** Fit for duty or recovering (the side panel): read from the wounds, never stored. */
export function selectFitnessLine(s: GameState): string {
  const wounds = selectWounds(s);
  const hands = allHandsNow(s);
  const block = injuryBlock(wounds, hands !== null);
  if (block) return `Recovering: ${block.severity} wound to the ${PART[block.part] ?? block.part}, ${Math.round(block.healProgress * 100)}% healed; not fit for an assignment yet`;
  const minor = injuryBlock(wounds, false);
  if (minor) return `Recovering from a minor wound; fit for an assignment (all hands: ${hands})`;
  return hands ? `Fit for duty (all hands: ${hands})` : 'Fit for duty';
}

/** The mission card (B11): objective, stage and progress, complications, who is with the character, days away. Null off duty. */
export interface MissionCard {
  title: string;
  objective: string;
  stage: string;
  stages: { label: string; status: string }[];
  complications: string[];
  party: string[];
  daysAway: number;
  deadline: string | null;
}
export function selectMissionCard(s: GameState): MissionCard | null {
  const m = s.duty.mission;
  if (s.duty.status !== 'mission' || !m) return null;
  const today = s.clock.now.day;
  return {
    title: m.title.replace(/^Mission: /, ''),
    objective: m.objective,
    stage: stageWords(m),
    stages: m.stages.map((st) => ({ label: st.kind === 'travel' && st.world ? `${st.label} (${st.world})` : st.label, status: st.status })),
    complications: [...m.complications],
    party: partyNames(s, m),
    daysAway: Math.max(0, today - m.assignedDay),
    deadline: m.deadlineDay !== null ? (m.deadlineDay >= today ? `${days(m.deadlineDay - today)} left` : 'passed') : null,
  };
}

/** The posting card (B11): front, base, months posted, next leave. Null when not posted. */
export function selectPostingCard(s: GameState): { front: string; base: string; months: number; leave: string } | null {
  const p = s.duty.posting;
  if (!p) return null;
  const today = s.clock.now.day;
  const leave = s.duty.leave ? `on leave until ${days(Math.max(0, s.duty.leave.untilDay - today))} from now` : `next leave in ${days(Math.max(0, p.nextLeaveDay - today))}`;
  return { front: p.front, base: p.base.name, months: Math.round(((today - p.sinceDay) / (368 / 12)) * 10) / 10, leave };
}

/** The narrator's MISSION line (B10): the current stage so it narrates the right one; it never resolves, moves or ends anything. */
export function selectMissionPromptLine(s: GameState): string | null {
  const card = selectMissionCard(s);
  const m = s.duty.mission;
  if (!card || !m) return null;
  const st = m.phase === 'onSite' && m.outcome === null ? m.stages[m.current] : undefined;
  // m9-release A2: each approach with its skill id, so a choice that takes it carries the id and clicking it rolls it.
  const listed = st?.kind === 'check' ? st.approaches.map((a) => APPROACHES[a as ApproachId]).filter((a) => a && a.skill).map((a) => `${a!.label.toLowerCase()} (skillId ${a!.skill})`) : [];
  const approaches = st?.kind === 'check'
    ? ` Approaches that fit: ${listed.join('; ')}. Every choice either takes one of these approaches (its label names it and its intent carries that skillId: clicking it rolls it) or is pure story that does not attempt the stage. Never narrate this stage's success, failure or a discovery (being spotted, an alarm, slipping in unseen): the code's roll decides it, and a failed roll's complication is the code's. Never start a fight at this stage: forcing the way through is the player's choice.`
    : st?.kind === 'fight' ? ' This stage is a fight (the code starts it when the player goes in; never start it yourself).' : st?.kind === 'battle' ? ' This stage is a battle (the code opens it when the player takes their place).' : '';
  const comp = card.complications.length ? ` Complications: ${card.complications.join('; ')}.` : '';
  const party = card.party.length ? ` With you: ${card.party.join(', ')}.` : '';
  // Leads found in play (m9-release A13): proposed, never decided, by the narrator.
  const leads = LEADS.types.includes(m.type) && m.phase === 'onSite' && m.outcome === null && (m.leads ?? 0) < LEADS.maxPerMission ? ' A lead found in play may be proposed with missionLeadFound (here, another world, or past the job as a follow-up); the code decides whether it is taken.' : '';
  return `MISSION (the code's: narrate this stage only; never resolve a stage, move the character between worlds or end the mission; propose approaches to this stage as choices): ${card.title}. Objective: ${card.objective}. Now: ${card.stage}.${approaches}${comp}${party}${leads}`;
}

/** The narrator's POSTING line (B5): the front and the base, so home days and downtime are among the right people. */
export function selectPostingPromptLine(s: GameState): string | null {
  const p = selectPostingCard(s);
  if (!p) return null;
  return `POSTING (the code's): ${p.front}, based at ${p.base}, ${p.months} months; ${p.leave}. Downtime is among the officers, the other Jedi on this front and the local people.`;
}

/** The narrator's state line (opt-2 D6): it narrates duty and fitness; it never changes them. */
export function selectDutyPromptLine(s: GameState): string {
  return `DUTY (the code's; narrate it, never change it: missions are assigned and ended by the code; never assign, offer or hint at a new mission, assignment or posting, not even a summons about one): ${selectDutyLine(s)}. ${selectFitnessLine(s)}.`;
}

/** A home day now: off duty at home, the day after a mission or a skip paused at home (opt-2 D5). */
export function selectIsHomeDay(s: GameState): boolean {
  const d = s.duty;
  return d.status === 'home' && selectAtHome(s) && (d.homeDay === s.clock.now.day || d.resume !== null);
}

/** Who and what is at home today, for the home day's choices (opt-2 D5e): masters, friends and rivals, places, threads. */
export function selectHomeDayLine(s: GameState): string | null {
  if (!selectIsHomeDay(s)) return null;
  const home = selectHomeBase(s)!;
  const atHome = (locId: string | null): boolean => selectLocationChain(s, locId).some((l) => sameNamed(l.name, home.name) || (home.planet !== null && sameNamed(l.name, home.planet)));
  const present = new Set(s.pacing.scene.presentNpcIds);
  const here = Object.values(s.npcs.byId).filter((n) => n.status !== 'deceased' && (present.has(n.id) || atHome(n.lastLocationId)));
  const teacher = (r: string): boolean => ['jediMaster', 'jediKnight', 'sithLord', 'officer'].includes(r);
  const masters = here.filter((n) => teacher(n.role)).map((n) => n.name);
  const friends = here.filter((n) => (selectRelationship(s, n.id)?.value ?? 0) >= 30).map((n) => n.name);
  const rivals = here.filter((n) => (selectRelationship(s, n.id)?.value ?? 0) <= -20).map((n) => n.name);
  const places = s.character.path === 'jedi' ? 'the Archives, the training halls, the meditation gardens' : s.character.path === 'sith' ? 'the academy library, the training grounds' : 'the training grounds, the mess, the armoury';
  const threads = selectOpenThreads(s).filter((t) => !t.title.startsWith('Mission: ')).map((t) => t.title);
  const parts = [
    masters.length ? `masters and officers here (forms, techniques, tactics): ${masters.slice(0, 6).join(', ')}` : '',
    friends.length ? `friends: ${friends.slice(0, 5).join(', ')}` : '',
    rivals.length ? `rivals: ${rivals.slice(0, 5).join(', ')}` : '',
    `places: ${places}`,
    threads.length ? `your threads: ${threads.slice(0, 4).join('; ')}` : '',
  ].filter(Boolean);
  return `HOME DAY (the code's; ${s.duty.resume ? '"Resume the skip" is the code\'s first choice; ' : ''}offer choices only from who and what is here, and let the player stay as many days as they like): at ${home.label}. ${parts.join('; ')}.`;
}

/** Re-exports for the world feature and the turn (features read each other through selectors). */
export { mapWorldName, selectAtHome, selectCurrentWorld, selectDutySide, selectHomeBase, selectWorldOf, touchesCharacter } from './home';
/** The mission rules the turn reads (m9-missions B; features read each other, and the turn reads them, through selectors). */
export { allyBonus, approachFor, approachRating, buildMission, chainRoll, complicationLine, councilBestReason, currentStage, failsMission, frontsFor, missionBase, pickMissionType, pickWorld, postingFor, selectSideWar, stageFoeCount, woundVerdict, worldOpen } from './missions';
export { allHandsNow, allHandsWorld } from './rules';
export type { Mission } from './duty';
