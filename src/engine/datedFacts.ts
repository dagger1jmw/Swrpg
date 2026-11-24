// Dated facts tied to the world-event network (D-466): the control, leader and seat tables follow the lore's dates until
// an outcome they depend on diverges; then the fact before it holds (the freeze). Pure.
import type { OutcomeLinks } from '../data/worldControl';

/** unknown: not in the network, so the lore's dates apply. pending: its event has not been settled yet. */
export type OutcomeState = 'produced' | 'broken' | 'pending' | 'unknown';

export interface DatedFact extends OutcomeLinks {
  fromBby: number;
  /** Inclusive. */
  toBby: number;
}

/** frozen: held because an outcome diverged. notYet: held because its event has not happened yet. */
export type HeldReason = 'frozen' | 'notYet';

export interface FactNow<T> {
  fact: T;
  held: HeldReason | null;
}

/**
 * The facts in force at `bby` for ONE subject (a place, an office, a seat). Without links this is the plain date lookup.
 * - A fact whose `dependsOn` is not produced does not start; the fact in force right before it is held instead, unless a
 *   later fact that depends on nothing broken has since begun.
 * - A fact with `endsWith` lasts until that outcome is produced: past its recorded end while it is not, and no longer
 *   than that day once it is.
 */
export function datedFactsAt<T extends DatedFact>(facts: readonly T[], bby: number, stateOf: (outcome: string) => OutcomeState): FactNow<T>[] {
  const blockOf = (f: T): HeldReason | null => {
    const states = (f.dependsOn ?? []).map(stateOf);
    return states.includes('broken') ? 'frozen' : states.includes('pending') ? 'notYet' : null;
  };
  const started = facts.filter((f) => f.fromBby >= bby);
  const ok = started.filter((f) => blockOf(f) === null);
  const ended = (f: T): boolean => f.endsWith !== undefined && bby <= f.toBby && stateOf(f.endsWith) === 'produced';
  const natural = ok.filter((f) => bby >= f.toBby && !ended(f));
  const held = new Map<T, HeldReason>();

  // Facts that outlast their recorded end: the outcome that ends them never came.
  for (const f of ok) {
    if (bby >= f.toBby || f.endsWith === undefined) continue;
    const s = stateOf(f.endsWith);
    if (s === 'broken' || s === 'pending') held.set(f, s === 'broken' ? 'frozen' : 'notYet');
  }
  // Facts that did not start: what was in force right before them holds (nothing, if the lore was blank there).
  for (const b of started) {
    const why = blockOf(b);
    if (why === null) continue;
    const before = ok.filter((f) => f.fromBby > b.fromBby && f.toBby <= b.fromBby + 1 && !ended(f));
    const newest = Math.min(...before.map((f) => f.fromBby));
    for (const f of before) if (f.fromBby === newest && !natural.includes(f) && !held.has(f)) held.set(f, why);
  }
  // A later fact that is in force supersedes anything held.
  for (const f of [...held.keys()]) if (natural.some((n) => n.fromBby < f.fromBby)) held.delete(f);
  return facts.flatMap((f): FactNow<T>[] => (natural.includes(f) ? [{ fact: f, held: null }] : held.has(f) ? [{ fact: f, held: held.get(f)! }] : []));
}
