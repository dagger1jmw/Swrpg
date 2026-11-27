// Backups (m9-release B3; Jared, 27 Nov 2026): the reminder to export the campaign, and where its record lives. The rule is pure;
// the record is one small localStorage entry per campaign (the export's time and the chapters closed by then). Invented numbers:
// a reminder after every BACKUP_REMINDER.chapters chapters or BACKUP_REMINDER.days days of real time since the last export
// (or since the campaign began, when it was never exported), whichever comes first.
/** The key-value store the record lives in (localStorage in the browser). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const BACKUP_REMINDER = { chapters: 5, days: 7 } as const;
const DAY_MS = 86_400_000;
const key = (campaignId: string): string => `swrpg.backup.${campaignId}`;

/** The last export of a campaign: when (wall-clock ms) and how many chapters had closed by then. */
export interface BackupRecord {
  at: number;
  chapters: number;
}

/** Why a backup is due now, or null (pure): chapters closed since the last export, or real days since it. */
export function backupDue(o: { now: number; chapters: number; last: BackupRecord | null; createdAt: number | null }): string | null {
  const since = o.last ?? (o.createdAt !== null ? { at: o.createdAt, chapters: 0 } : null);
  if (!since) return null;
  const chapters = o.chapters - since.chapters;
  const days = Math.floor((o.now - since.at) / DAY_MS);
  const what = o.last ? 'since your last export' : 'and it has never been exported';
  if (chapters >= BACKUP_REMINDER.chapters) return `${chapters} chapters ${what}`;
  if (days >= BACKUP_REMINDER.days) return `${days} days ${what}`;
  return null;
}

export function readBackup(kv: KeyValueStore, campaignId: string): BackupRecord | null {
  try {
    const raw = kv.getItem(key(campaignId));
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<BackupRecord>;
    return typeof v.at === 'number' && typeof v.chapters === 'number' ? { at: v.at, chapters: v.chapters } : null;
  } catch {
    return null;
  }
}

export function writeBackup(kv: KeyValueStore, campaignId: string, r: BackupRecord): void {
  try {
    kv.setItem(key(campaignId), JSON.stringify(r));
  } catch {
    // A full or blocked store: the reminder comes again, nothing else is lost.
  }
}

/** The export's file name: the campaign's name and its turn count. */
export const exportFileName = (name: string, turns: number): string => `swrpg-${name.replace(/[^\w-]+/g, '_')}-turn${turns}.json`;
