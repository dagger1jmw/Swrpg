// The installed app (m9-release B1, B2, B4): the update banner's state, the storage line in Settings, the first-run note in the
// Home Screen app, and the export's way out (the share sheet or a download). Pure: the browser's answers come in as values; main.ts
// and app.ts do the asking.

/**
 * The update check's state (B1): a new build installs in the background and waits; the page shows "A new version is ready: reload"
 * instead of mixing versions; the reload asks the waiting service worker to take over and reloads once it has.
 */
export type UpdateState = { kind: 'current' } | { kind: 'ready' } | { kind: 'applying' } | { kind: 'reload' };
export type UpdateEvent = { type: 'waiting' } | { type: 'apply' } | { type: 'controllerChanged' };

export function updateReducer(s: UpdateState, e: UpdateEvent): UpdateState {
  switch (e.type) {
    case 'waiting':
      return s.kind === 'current' ? { kind: 'ready' } : s;
    case 'apply':
      return s.kind === 'ready' ? { kind: 'applying' } : s;
    case 'controllerChanged':
      // Only the update the player asked for reloads the page (the first install's takeover of a page needs none).
      return s.kind === 'applying' ? { kind: 'reload' } : s;
  }
}

export const UPDATE_TEXT = 'A new version is ready: reload';

/** The storage line in Settings (B2): persistent or not, and how much is used of how much. */
export function storageLine(o: { persisted: boolean | null; usage: number | null; quota: number | null }): string {
  const mb = (n: number): string => (n >= 100 * 1024 * 1024 ? `${Math.round(n / (1024 * 1024))} MB` : `${(n / (1024 * 1024)).toFixed(1)} MB`);
  const p = o.persisted === null ? 'Storage persistence is not reported by this browser.' : o.persisted ? 'Storage is persistent: the browser will not clear the saves on its own.' : 'Storage is not persistent: the browser may clear the saves when space runs low. Install the app to the Home Screen and export backups.';
  const used = o.usage !== null ? ` Used: ${mb(o.usage)}${o.quota !== null ? ` of about ${mb(o.quota)}` : ''}.` : '';
  return `${p}${used}`;
}

/** Running as the installed Home Screen app (standalone), from the browser's answers. */
export const isStandalone = (o: { displayModeStandalone: boolean; navigatorStandalone: boolean | undefined }): boolean => o.displayModeStandalone || o.navigatorStandalone === true;

/**
 * The first-run note (B4): the Home Screen app on iOS keeps its own storage, apart from Safari's, so the key and the campaigns from
 * Safari are not there. Shown in the installed app while it has no key or no campaign, until dismissed.
 */
export function firstRunNote(o: { standalone: boolean; hasKey: boolean; hasCampaign: boolean; dismissed: boolean }): string | null {
  if (!o.standalone || o.dismissed || (o.hasKey && o.hasCampaign)) return null;
  return 'Welcome to the installed app. On the iPad the Home Screen app keeps its own storage, separate from Safari, so your API key and campaigns from Safari are not here yet: paste the API key below, then import a campaign file if you have one (Campaign, Import campaign).';
}

/** How an export leaves the app (B3): the share sheet when it can take a file (the iPad: straight to Files or iCloud Drive), else a download. */
export const exportRoute = (canShareFile: boolean): 'share' | 'download' => (canShareFile ? 'share' : 'download');
