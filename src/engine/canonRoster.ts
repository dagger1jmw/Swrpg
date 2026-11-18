// Who of the canon rosters is present at a campaign date (npc-generation.md §5; D-155). Pure. Years are BBY as
// positive numbers (a campaign year y < 0 is |y| BBY; ABY years are negative BBY here). A figure is present in a
// year when born by then, not dead before it (the death year itself counts as present: the figure lives part of
// it), not unavailable that year, and old enough for the role held then.
import { CANON_NPCS, type CanonNpc } from '../data/canonNpcs';
import type { NpcRole } from '../data/entities.config';
import { ROLE_MIN_AGE } from '../data/npcGen.config';

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
