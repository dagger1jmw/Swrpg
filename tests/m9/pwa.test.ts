// m9-release Part B (Jared, 27 Nov 2026): the installed app. The pure parts: the backup reminder's rule and its record (B3), the
// update check's state (B1), the storage line (B2), the first-run note (B4), the export's route (B3), and the dist check that the
// build serves the manifest, the icons and the service worker at relative paths (B5, B6).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BACKUP_REMINDER, backupDue, exportFileName, readBackup, writeBackup } from '../../src/persist/backup';
import { exportRoute, firstRunNote, isStandalone, storageLine, updateReducer, type UpdateState } from '../../src/ui/pwa';
import { checkDist, REQUIRED } from '../../scripts/check-dist.ts';

const DAY = 86_400_000;

describe('B3: the backup reminder', () => {
  const t0 = Date.UTC(2026, 10, 27);
  it(`after ${BACKUP_REMINDER.chapters} chapters or ${BACKUP_REMINDER.days} days since the last export, whichever is first`, () => {
    const last = { at: t0, chapters: 3 };
    expect(backupDue({ now: t0 + DAY, chapters: 4, last, createdAt: null })).toBeNull();
    expect(backupDue({ now: t0 + DAY, chapters: 3 + BACKUP_REMINDER.chapters, last, createdAt: null })).toMatch(/^5 chapters since your last export$/);
    expect(backupDue({ now: t0 + BACKUP_REMINDER.days * DAY, chapters: 4, last, createdAt: null })).toMatch(/^7 days since your last export$/);
    expect(backupDue({ now: t0 + 6.9 * DAY, chapters: 7, last, createdAt: null })).toBeNull();
  });

  it('a campaign never exported counts from its start; with no start, no reminder', () => {
    expect(backupDue({ now: t0 + 8 * DAY, chapters: 1, last: null, createdAt: t0 })).toMatch(/never been exported/);
    expect(backupDue({ now: t0 + DAY, chapters: 1, last: null, createdAt: t0 })).toBeNull();
    expect(backupDue({ now: t0 + 30 * DAY, chapters: 9, last: null, createdAt: null })).toBeNull();
  });

  it('the record survives a round trip; a broken one reads as none; the file name', () => {
    const store = new Map<string, string>();
    const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v) };
    expect(readBackup(kv, 'c1')).toBeNull();
    writeBackup(kv, 'c1', { at: t0, chapters: 4 });
    expect(readBackup(kv, 'c1')).toEqual({ at: t0, chapters: 4 });
    store.set('swrpg.backup.c2', '{not json');
    expect(readBackup(kv, 'c2')).toBeNull();
    expect(exportFileName('Jared Wright!', 12)).toBe('swrpg-Jared_Wright_-turn12.json');
  });
});

describe('B1: the update check', () => {
  it('a waiting build shows the banner; the reload applies it; only an update the player asked for reloads the page', () => {
    let s: UpdateState = { kind: 'current' };
    // The first install takes control of a page that had no worker: nothing to reload.
    expect(updateReducer(s, { type: 'controllerChanged' })).toEqual({ kind: 'current' });
    s = updateReducer(s, { type: 'waiting' });
    expect(s).toEqual({ kind: 'ready' });
    expect(updateReducer(s, { type: 'controllerChanged' })).toEqual({ kind: 'ready' });
    s = updateReducer(s, { type: 'apply' });
    expect(s).toEqual({ kind: 'applying' });
    expect(updateReducer(s, { type: 'waiting' })).toEqual({ kind: 'applying' });
    expect(updateReducer(s, { type: 'controllerChanged' })).toEqual({ kind: 'reload' });
    expect(updateReducer({ kind: 'current' }, { type: 'apply' })).toEqual({ kind: 'current' });
  });
});

describe('B2, B4: the storage line and the first-run note', () => {
  it('the storage line says whether storage is persistent and how much is used', () => {
    expect(storageLine({ persisted: true, usage: 3.2 * 1024 * 1024, quota: 1200 * 1024 * 1024 })).toBe('Storage is persistent: the browser will not clear the saves on its own. Used: 3.2 MB of about 1200 MB.');
    expect(storageLine({ persisted: false, usage: null, quota: null })).toMatch(/^Storage is not persistent/);
    expect(storageLine({ persisted: null, usage: 1024 * 1024, quota: null })).toMatch(/not reported.* Used: 1.0 MB\.$/);
  });

  it('the first-run note shows only in the installed app, while it has no key or no campaign, until dismissed', () => {
    expect(isStandalone({ displayModeStandalone: false, navigatorStandalone: true })).toBe(true);
    expect(isStandalone({ displayModeStandalone: false, navigatorStandalone: undefined })).toBe(false);
    expect(firstRunNote({ standalone: true, hasKey: false, hasCampaign: false, dismissed: false })).toMatch(/separate from Safari/);
    expect(firstRunNote({ standalone: true, hasKey: true, hasCampaign: false, dismissed: false })).toMatch(/import a campaign file/);
    expect(firstRunNote({ standalone: true, hasKey: true, hasCampaign: true, dismissed: false })).toBeNull();
    expect(firstRunNote({ standalone: false, hasKey: false, hasCampaign: false, dismissed: false })).toBeNull();
    expect(firstRunNote({ standalone: true, hasKey: false, hasCampaign: false, dismissed: true })).toBeNull();
  });

  it('the export goes through the share sheet when it can take a file, else a download', () => {
    expect(exportRoute(true)).toBe('share');
    expect(exportRoute(false)).toBe('download');
  });
});

describe('B5, B6: the built folder installs', () => {
  const tiny = new Uint8Array([137, 80, 78, 71]);
  function fakeDist(o: { absolute?: boolean; noSw?: boolean; uncached?: boolean } = {}): string {
    const dir = join(tmpdir(), `swrpg-dist-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(dir, 'icons'), { recursive: true });
    mkdirSync(join(dir, 'assets'), { recursive: true });
    const pre = o.absolute ? '/' : './';
    writeFileSync(join(dir, 'index.html'), `<html><head><link rel="manifest" href="${pre}manifest.webmanifest"><link rel="apple-touch-icon" sizes="180x180" href="./icons/icon-180.png"><meta name="apple-mobile-web-app-capable" content="yes"><script type="module" src="./assets/index-abc.js"></script></head></html>`);
    writeFileSync(join(dir, 'assets', 'index-abc.js'), 'console.log(1)');
    writeFileSync(join(dir, 'manifest.webmanifest'), JSON.stringify({ start_url: './', scope: './', display: 'standalone', icons: [{ src: 'icons/icon-180.png', sizes: '180x180' }, { src: 'icons/icon-512.png', sizes: '512x512' }] }));
    for (const f of REQUIRED.filter((x) => x.startsWith('icons/'))) writeFileSync(join(dir, f), tiny);
    const files = ['./', 'assets/index-abc.js', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'index.html', 'manifest.webmanifest'].filter((f) => !(o.uncached && f.startsWith('assets/')));
    if (!o.noSw) writeFileSync(join(dir, 'sw.js'), `const VERSION = 'abc';\nconst PRECACHE = ${JSON.stringify(files)};\n`);
    return dir;
  }

  it('a good build passes', () => {
    const dir = fakeDist();
    expect(checkDist(dir)).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

  it('an absolute path, a missing worker or an uncached asset fails', () => {
    for (const [o, want] of [[{ absolute: true }, /not a relative path|not relative/], [{ noSw: true }, /missing sw\.js/], [{ uncached: true }, /assets\/index-abc\.js is not cached/]] as const) {
      const dir = fakeDist(o);
      expect(checkDist(dir).join(' | ')).toMatch(want);
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
