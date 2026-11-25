// The power bar on people (D-489, D-490): who is a top duelist in which years, and who else cannot be beaten below a bar.
// Jared's lists, one per tag map (2026-11-24). The bar holds in the fight itself (engine/powerBar.ts), so a figure the
// player cannot beat is never killed, taken or driven to surrender by them, however the rolls go.
import type { Who } from './who';

/**
 * master: a regular Master or better can beat them. top: below Master the player cannot win, a Master only holds them off
 * briefly, and only the top tier beats them or holds long. beyond: nobody beats them.
 */
export const DUELIST_BARS = ['master', 'top', 'beyond'] as const;
export type DuelistBar = (typeof DUELIST_BARS)[number];

export interface DuelistSpan {
  canonId: string;
  bar: DuelistBar;
  /** Signed years, inclusive. */
  fromYear: number;
  toYear: number;
  source: string;
}

const span = (bar: DuelistBar, fromYear: number, toYear: number, source: string, ...ids: string[]): DuelistSpan[] => ids.map((id) => ({ canonId: `lore:${id}`, bar, fromYear, toYear, source }));
const MAP_D = 'D-490: the 5,000-3,662 BBY list';
const MAP_A = 'D-490: the 3,661-3,640 BBY list';
const MAP_B = 'D-490: the 3,640-1,000 BBY list';
const MAP_C = 'D-490: the 1,000 BBY-4 ABY list';

/** The years are the map's, or (invented) from when the figure is grown and trained. */
export const DUELISTS: readonly DuelistSpan[] = [
  ...span('top', -5000, -3662, MAP_D, 'naga-sadow', 'exar-kun', 'ulic-qel-droma', 'revan', 'malak', 'darth-nihilus', 'darth-sion', 'darth-traya', 'scourge', 'meetra-surik'),
  ...span('beyond', -5000, -3662, MAP_D, 'vitiate', 'tenebrae-lord-vitiate'),
  ...span('top', -3661, -3640, MAP_A, 'darth-malgus', 'darth-marr', 'revan', 'satele-shan', 'scourge', 'ven-zallow', 'zym'),
  ...span('beyond', -3661, -3640, 'D-493: the Emperor is beyond any duelist here too', 'vitiate'),
  ...span('master', -3661, -3640, 'D-490: rules check A28', 'darth-baras'),
  ...span('top', -3639, -1001, MAP_B, 'darth-malgus', 'revan', 'arcann', 'thexan', 'vaylin', 'the-outlander'),
  ...span('beyond', -3639, -1001, MAP_B, 'vitiate', 'valkorion'),
  ...span('top', -1002, -980, MAP_B, 'darth-bane', 'kasim'),
  ...span('top', -100, 4, MAP_C, 'darth-plagueis', 'yoda', 'mace-windu', 'count-dooku', 'darth-sidious', 'sheev-palpatine', 'emperor-palpatine'),
  ...span('top', -32, 4, MAP_C, 'darth-maul'),
  ...span('top', -22, 4, MAP_C, 'obi-wan-kenobi', 'anakin-skywalker', 'darth-vader'),
  ...span('top', -3, 4, MAP_C, 'galen-marek'),
  ...span('master', -22, -19, MAP_C, 'general-grievous'),
];

/** Figures on the lists who have no entry of their own in the lore index. */
export const DUELISTS_WITHOUT_ENTRY: readonly string[] = ['lore:the-outlander', 'lore:valkorion'];

/** The bar on a figure in a year, or null. */
export function duelistBar(canonId: string | null, year: number): DuelistBar | null {
  if (!canonId) return null;
  return DUELISTS.find((d) => d.canonId === canonId && year >= d.fromYear && year <= d.toYear)?.bar ?? null;
}

/**
 * Guarded figures: whom the player cannot get at to beat without being placed for it (rules check A18, A26, A28). Unmet,
 * the fight ends as against a figure above the bar: they get away.
 */
export const GUARDED: readonly { canonId: string; fromYear: number; toYear: number; who: readonly Who[]; source: string }[] = [
  { canonId: 'lore:darth-angral', fromYear: -3661, toYear: -3640, who: [{ at: ['Coruscant', 'Dromund Kaas', 'Korriban', 'Uphrades', 'Tython', 'Alderaan'] }, { posts: ['angral-fleet'] }], source: 'A18, A26: on the ground, or a place aboard the flagship' },
  { canonId: 'lore:darth-baras', fromYear: -3661, toYear: -3640, who: [{ posts: ['baras-household', 'council-staff', 'imperial-intelligence'] }, { sides: ['sithEmpire', 'sith'], minRank: 'knight' }], source: 'A28: someone who can reach Baras' },
  { canonId: 'lore:darth-azamin', fromYear: -3661, toYear: -3640, who: [{ posts: ['council-staff', 'imperial-intelligence'] }, { sides: ['sithEmpire', 'sith'], minRank: 'knight' }], source: 'A28: Azamin needs a "who"' },
];

/** The top tier's levels (invented; Mace: Vaapad 98, Force Control 92, Willpower 94; Yoda: Ataru 100, Force about 100). */
export const TOP_TIER = { combat: 95, forceControl: 90, willpower: 90 } as const;
/**
 * Planning (Jared, 2026-11-25; D-493): a non-Force fighter never reaches Master in an outright fight. The most skilled
 * bounty hunters and Mandalorians reach it only for a hold, with a plan recorded in play: `lines` different kinds laid
 * against that foe, at that place, in the last `days`. Every number is invented. Gear suited to the foe is a fourth kind
 * once equipment is built (it would be read from what the character carries).
 */
export const PLAN_KINDS = ['ambush', 'trap', 'ground'] as const;
export type PlanKind = (typeof PLAN_KINDS)[number];
export const PLAN = {
  archetypes: ['bountyHunter', 'mandalorian'] as readonly string[],
  /** The strongest fighting skill: 90 is an exceptional hunter near 40, a gifted one near 52. */
  combat: 90,
  /** Each line is a check against this rating (DC 17, the medium guard's). */
  rating: 70,
  lines: 2,
  days: 3,
  skills: { ambush: ['stealth', 'tracking'], trap: ['tactics', 'investigation'], ground: ['tactics', 'tracking'] } as Readonly<Record<PlanKind, readonly string[]>>,
  labels: { ambush: 'Lay an ambush', trap: 'Lay a trap', ground: 'Prepare the ground' } as Readonly<Record<PlanKind, string>>,
} as const;

/** A hold counts when the fight lasted this long (invented): fewer exchanges bought nobody any time. */
export const HOLD = { minExchanges: 6 } as const;
