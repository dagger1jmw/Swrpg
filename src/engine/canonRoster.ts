// Who of the canon rosters is present at a campaign date (npc-generation.md §5; D-155). Pure. Years are BBY as
// positive numbers (a campaign year y < 0 is |y| BBY; ABY years are negative BBY here). A figure is present in a
// year when born by then, not dead before it (the death year itself counts as present: the figure lives part of
// it), not unavailable that year, and old enough for the role held then.
import { CANON_NPCS, type CanonNpc } from '../data/canonNpcs';
import type { NpcRole } from '../data/entities.config';
import { ROLE_MIN_AGE } from '../data/npcGen.config';
import { CANON_PLACEMENTS, type CanonPlacement } from '../data/canonPlacements';

/** Campaign calendar year (negative = BBY) to BBY. */
export const toBby = (year: number): number => -year;

export function canonRoleAt(n: CanonNpc, bby: number): NpcRole {
  for (const r of n.earlierRoles ?? []) if (bby >= r.untilBby) return r.role;
  return n.role;
}

export function canonAgeAt(n: CanonNpc, bby: number): number {
  return n.birthBby - bby;
}

export type Absence = 'unborn' | 'dead' | 'unavailable' | 'tooYoung';

/** Null when present; otherwise why not. */
export function canonAbsence(n: CanonNpc, bby: number): Absence | null {
  if (bby > n.birthBby) return 'unborn';
  if (n.deathBby !== undefined && bby < n.deathBby) return 'dead';
  if ((n.unavailable ?? []).some((u) => bby <= u.fromBby && bby >= u.toBby)) return 'unavailable';
  if (canonAgeAt(n, bby) < (ROLE_MIN_AGE[canonRoleAt(n, bby)] ?? 0)) return 'tooYoung';
  return null;
}

export function canonPresentAt(bby: number, roster: readonly CanonNpc[] = CANON_NPCS): CanonNpc[] {
  return roster.filter((n) => canonAbsence(n, bby) === null);
}

// ---- Who is on the board (M7 playable 3,661 BBY start; D-400) ----

/** Why a canon figure is off the board at a date. Children are on the board (as children), so 'tooYoung' is not here. */
export type OffBoard = 'unborn' | 'dead' | 'unavailable' | 'imprisoned';

/** Snapshot years that carry a lore status (lore batch 19: `status3661`). */
const STATUS_YEARS = [3661] as const;

/**
 * Null when the figure can be on the board in `bby`; otherwise why not. A figure is on the board when the lore puts them
 * there: "active" in the snapshot year, or (status not stated, and in every other year) placed by their birth and death
 * years and unavailable spans. A child is on the board as a child. A figure the snapshot says is dead, unborn or
 * imprisoned is off it, even when the birth and death years alone would place them.
 */
export function canonOffBoard(n: CanonNpc, bby: number): OffBoard | null {
  if (bby > n.birthBby) return 'unborn';
  if (n.deathBby !== undefined && bby < n.deathBby) return 'dead';
  // A prison on record wins over a generic unavailable span for the same years (the Dread Masters, D-401 [5]).
  if (prisonOf(n.canonId, bby)) return 'imprisoned';
  if ((n.unavailable ?? []).some((u) => bby <= u.fromBby && bby >= u.toBby)) return 'unavailable';
  if ((STATUS_YEARS as readonly number[]).includes(bby) && n.status3661) {
    const k = n.status3661.kind;
    if (k === 'dead' || k === 'unborn' || k === 'imprisoned') return k;
  }
  return null;
}

/** Where the lore holds a figure prisoner in `bby` (src/data/canonPlacements.ts), or null. */
export function prisonOf(canonId: string, bby: number): CanonPlacement | null {
  return CANON_PLACEMENTS.find((p) => p.imprisoned && p.canonId === canonId && bby <= p.fromBby && bby >= p.toBby) ?? null;
}

/** The canon figures on the board at a date (bby), each entry once (the first era file wins, as in CANON_BY_ID). */
export function canonBoardAt(bby: number, roster: readonly CanonNpc[] = CANON_NPCS): CanonNpc[] {
  const seen = new Set<string>();
  return roster.filter((n) => {
    if (seen.has(n.canonId) || canonOffBoard(n, bby) !== null) return false;
    seen.add(n.canonId);
    return true;
  });
}
