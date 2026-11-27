// Duty rules (opt-2 D; spec/duty.md): the daily mission roll, the injury check, all hands on deck. Pure (Golden Rule 2).
import { ALL_HANDS_TAIL_DAYS, DUTY_INJURY, MISSION_ROLL, MISSION_SCALE_BY_CAREER, MISSION_SCALE_BY_RANK } from '../../data/duty.config';
import { factionAtWar } from '../../data/wars';
import { WORLD_NETWORK, type WorldNetwork } from '../../data/worldNetwork';
import { PLANETS } from '../../data/galaxyMap';
import { dateFromAbsDay } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import type { Wound } from '../../engine/wounds';
import { selectNetworkState } from '../world/selectors';
import { selectDutySide, selectSides } from './home';
import { missionScaleFor } from './missions';

/** The median's scale for this character (duty.config), or null when no missions come (Initiates, acolytes, civilians). */
export function missionScale(s: GameState): number | null {
  const rank = s.ranks.rank;
  if (rank in MISSION_SCALE_BY_RANK) return MISSION_SCALE_BY_RANK[rank] ?? null;
  if (s.character.path === 'career' || s.character.path === 'outsider') {
    const a = s.character.archetype ?? '';
    if (a in MISSION_SCALE_BY_CAREER) return MISSION_SCALE_BY_CAREER[a]!;
    return s.ranks.service ? 1 : null;
  }
  return null;
}

/** Whether the character's side is at war today (the one war list). */
export const atWar = (s: GameState): boolean => factionAtWar(selectDutySide(s), dateFromAbsDay(s.clock.now.day).year);

/** The median days off duty before an assignment, for this character now; null = no missions. */
export function missionMedian(s: GameState): number | null {
  // A Padawan with a master shares the master's assignments (m9-missions B7): the master's scale, not the Padawan's own.
  const scale = missionScaleFor(s, missionScale(s));
  if (scale === null) return null;
  return (atWar(s) ? MISSION_ROLL.medianWar : MISSION_ROLL.medianPeace) * scale;
}

/**
 * The chance of an assignment on the day that ends `daysOff` days at home (opt-2 D2): the Weibull hazard between days
 * daysOff - 1 and daysOff, zero in the first quiet days. Smooth and rising; half are assigned by the median.
 */
export function missionChance(daysOff: number, median: number): number {
  const { quietDays, shape } = MISSION_ROLL;
  if (daysOff <= quietDays) return 0;
  const lambda = Math.max(1e-6, median - quietDays) / Math.pow(Math.LN2, 1 / shape);
  const H = (t: number): number => (t <= quietDays ? 0 : Math.pow((t - quietDays) / lambda, shape));
  return 1 - Math.exp(H(daysOff - 1) - H(daysOff));
}

/** An all-hands-on-deck situation for the character's side today (opt-2 D3), from the timeline: its title, or null. */
export function allHandsNow(s: GameState, net: WorldNetwork = WORLD_NETWORK): string | null {
  if (s.duty?.devAllHands === true) return 'all hands on deck (dev)';
  const sides = selectSides(s);
  if (!sides.length) return null;
  const st = selectNetworkState(s, net);
  const today = s.clock.now.day;
  for (const e of net.events) {
    if (!e.allHands || !e.allHands.factions.some((f) => sides.includes(f))) continue;
    const r = st.events[e.id];
    if (!r || r.status === 'cancelled' || r.status === 'waiting') continue;
    // Running (a campaign under way): all hands until it ends; settled: for the tail after it.
    const running = r.endedDay === null && r.status === 'underway';
    const end = running ? Infinity : (r.endedDay ?? r.day) + (e.allHands.days ?? ALL_HANDS_TAIL_DAYS);
    if (today >= r.day && today <= end) return e.title;
  }
  return null;
}

/** The map world of the running all-hands event for the character's side (an urgent recall goes there, m9-missions B6), or null. */
export function allHandsWorld(s: GameState, net: WorldNetwork = WORLD_NETWORK): string | null {
  const title = allHandsNow(s, net);
  if (!title) return null;
  const e = net.events.find((x) => x.title === title);
  for (const p of e?.places ?? []) {
    const w = PLANETS.find((x) => x.name.toLowerCase() === p.toLowerCase());
    if (w) return w.name;
  }
  return null;
}

/** A wound counts while it is less than healed enough (duty.config DUTY_INJURY). */
const unhealed = (w: Wound): boolean => w.healProgress < DUTY_INJURY.healedEnough;

/**
 * The injury check on an assignment (opt-2 D3): an unhealed wound blocks it; in an all-hands situation a minor wound does not
 * (the lowest band of health.md section 5), anything worse still does. Returns the blocking wound, or null.
 */
export function injuryBlock(wounds: readonly Wound[], allHands: boolean): Wound | null {
  const order = ['minor', 'moderate', 'severe', 'critical', 'mortal'];
  const open = wounds.filter(unhealed).filter((w) => !(allHands && w.severity === 'minor'));
  return open.sort((a, b) => order.indexOf(b.severity) - order.indexOf(a.severity))[0] ?? null;
}
