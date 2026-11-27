// Status-line notices (m8-audit A8): a notice belongs to the campaign it was raised in, so starting or loading another campaign
// never shows an old one ("Dev commands work only in a test campaign..." stayed on screen after a new campaign began).

export interface Notice {
  text: string;
  /** The campaign it was raised in (null: none open). */
  campaignId: string | null;
}

/** The notice's text when it belongs to the campaign now open, else null. */
export const noticeShown = (n: Notice | null, campaignId: string | null): string | null => (n && n.campaignId === campaignId ? n.text : null);
