// Duty selectors (opt-2 D; spec/duty.md): the side panel's duty and fitness lines, the narrator's state line, a home day's
// people and places, and the "Resume the skip" choice. Read-only.
import type { GameState } from '../../state/gameState';
import { selectWounds } from '../health/selectors';
import { selectLocationChain } from '../locations/selectors';
import { selectRelationship } from '../relationships/selectors';
import { selectOpenThreads } from '../threads/selectors';
import { sameNamed, selectAtHome, selectHomeBase } from './home';
import { allHandsNow, injuryBlock, missionMedian } from './rules';


const days = (n: number): string => `${n} day${n === 1 ? '' : 's'}`;
const PART: Readonly<Record<string, string>> = { torso: 'torso', head: 'head', leftArm: 'left arm', rightArm: 'right arm', leftLeg: 'left leg', rightLeg: 'right leg', leftHand: 'left hand', rightHand: 'right hand' };

/** The duty status in words (the side panel). */
export function selectDutyLine(s: GameState): string {
  const d = s.duty;
  const n = Math.max(0, s.clock.now.day - d.since);
  if (d.status === 'mission' && d.mission) return `On a mission: ${d.mission.title.replace(/^Mission: /, '')} (${days(n)})`;
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

/** The narrator's state line (opt-2 D6): it narrates duty and fitness; it never changes them. */
export function selectDutyPromptLine(s: GameState): string {
  return `DUTY (the code's; narrate it, never change it: missions are assigned and ended by the code): ${selectDutyLine(s)}. ${selectFitnessLine(s)}.`;
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
export { selectAtHome, touchesCharacter } from './home';
