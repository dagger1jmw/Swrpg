// The "Load an earlier save" list (D-214) and when it is read again (pass 5 issue 3: the list was read once per
// campaign, so once the menu had been opened, later saves never appeared until a load or a page reload). The list is
// read again every time the campaign menu opens; while it loads, the last list read is shown, not an empty one.
import type { SaveMeta } from '../persist/saveHistory';

export class EarlierSaves {
  private list: { campaignId: string; saves: SaveMeta[] } | null = null;
  private stale = true;

  constructor(
    private readonly load: (campaignId: string) => Promise<SaveMeta[]>,
    private readonly onLoaded: () => void,
  ) {}

  /** The campaign menu opened (or a save was loaded): the next read lists the saves again. */
  invalidate(): void {
    this.stale = true;
  }

  /** The saves to show now for this campaign; starts a read when the list is stale or of another campaign. */
  current(campaignId: string): SaveMeta[] {
    const same = this.list?.campaignId === campaignId;
    if (this.stale || !same) {
      this.stale = false;
      void this.load(campaignId).then((saves) => {
        this.list = { campaignId, saves };
        this.onLoaded();
      });
    }
    return same ? this.list!.saves : [];
  }
}
