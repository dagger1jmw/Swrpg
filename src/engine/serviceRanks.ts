// Promotion on a service ladder (m8-skills, D-513; ranks.md section 3a). Pure: years in the rank below, a skill minimum
// (the best of the rung's skills) and recorded deeds. A story-only rung is never reached by promotion.
import type { ServiceLadder } from '../data/serviceRanks';


export interface PromotionCheck {
  ok: boolean;
  reasons: string[];
}

/** Whether a holder of `rung` may be promoted to the next rung, given years in rank, levels and deeds. */
export function servicePromotionCheck(ladder: ServiceLadder, rung: number, x: { yearsInRank: number; level: (skill: string) => number; deeds: number }): PromotionCheck {
  const next = ladder.rungs[rung + 1];
  if (!next) return { ok: false, reasons: [`no rank above ${ladder.rungs[rung]?.title ?? 'this one'} in ${ladder.faction}`] };
  if (next.storyOnly) return { ok: false, reasons: [`${next.title} is an appointment the story makes, not a promotion`] };
  const reasons: string[] = [];
  if (x.yearsInRank + 1e-9 < next.years) reasons.push(`${next.years} years as ${ladder.rungs[rung]!.title} (${x.yearsInRank.toFixed(1)})`);
  const best = Math.max(0, ...next.skills.map((k) => x.level(k)));
  if (best + 1e-9 < next.min) reasons.push(`${next.skills.join(' or ')} ${next.min} (${best.toFixed(1)})`);
  if (x.deeds < next.deeds) reasons.push(`${next.deeds} recorded deeds (${x.deeds})`);
  return { ok: reasons.length === 0, reasons };
}

/** The entry check: the first rung's skill minimum. */
export function serviceEntryCheck(ladder: ServiceLadder, level: (skill: string) => number): PromotionCheck {
  const first = ladder.rungs[0]!;
  const best = Math.max(0, ...first.skills.map((k) => level(k)));
  return best + 1e-9 >= first.min ? { ok: true, reasons: [] } : { ok: false, reasons: [`${first.skills.join(' or ')} ${first.min} to join as ${first.title} (${best.toFixed(1)})`] };
}
