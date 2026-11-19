// Earlier saves (Jared, combat pass 2; D-214): every turn commit also keeps a snapshot in the campaign's save history.
// Retention: the last SAVE_HISTORY.recent saves, plus the latest save of each in-game day for the last
// SAVE_HISTORY.dailyDays days (counted back from the newest save's day). Loading one starts a new branch (architecture
// §13; health.md: death ends the campaign, an older save plays on). Pure, except for reading the envelope's state.
import type { SaveEnvelope } from './envelope';

export const SAVE_HISTORY = { recent: 10, dailyDays: 7 } as const;

export interface SaveMeta {
  /** The snapshot key in the snapshots store. */
  key: string;
  campaignId: string;
  branchId: string;
  turn: number;
  /** Wall-clock time of the commit (ISO). */
  savedAt: string;
  /** In-game absolute day and second. */
  day: number;
  second: number;
  /** The place name at the save, or null. */
  place: string | null;
  /** The character was dead at this save. */
  dead: boolean;
}

export const saveKey = (campaignId: string, branchId: string, turn: number): string => `save:${campaignId}:${branchId}:${turn}`;
export const saveIndexKey = (campaignId: string): string => `saves:${campaignId}`;

interface StateLike {
  meta?: { campaignId?: string; branchId?: string; turn?: number };
  clock?: { now?: { day?: number; second?: number } };
  locations?: { currentId?: string | null; byId?: Record<string, { name?: string }> };
  health?: { death?: unknown };
}

/** The save's listing details, read from the envelope's state. */
export function saveMetaOf(envelope: SaveEnvelope): SaveMeta {
  const s = envelope.state as unknown as StateLike;
  const campaignId = s.meta?.campaignId ?? 'unknown';
  const branchId = s.meta?.branchId ?? 'unknown';
  const turn = s.meta?.turn ?? 0;
  const loc = s.locations?.currentId ? s.locations.byId?.[s.locations.currentId] : undefined;
  return { key: saveKey(campaignId, branchId, turn), campaignId, branchId, turn, savedAt: envelope.savedAt, day: s.clock?.now?.day ?? 0, second: s.clock?.now?.second ?? 0, place: loc?.name ?? null, dead: !!s.health?.death };
}

/**
 * The saves to keep after `added` (D-214): the newest SAVE_HISTORY.recent by commit order, plus the newest save of each
 * in-game day from added.day - (dailyDays - 1) to added.day. Returns them newest first, and the keys to delete.
 */
export function retainSaves(existing: readonly SaveMeta[], added: SaveMeta): { keep: SaveMeta[]; drop: string[] } {
  // Commit order: the list is kept newest first; a re-commit of the same key replaces it.
  const all = [added, ...existing.filter((m) => m.key !== added.key)];
  const keep = new Set(all.slice(0, SAVE_HISTORY.recent).map((m) => m.key));
  const firstDay = added.day - (SAVE_HISTORY.dailyDays - 1);
  const seenDays = new Set<number>();
  for (const m of all) {
    if (m.day < firstDay || m.day > added.day || seenDays.has(m.day)) continue;
    seenDays.add(m.day);
    keep.add(m.key);
  }
  return { keep: all.filter((m) => keep.has(m.key)), drop: all.filter((m) => !keep.has(m.key)).map((m) => m.key) };
}
