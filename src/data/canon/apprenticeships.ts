// Recorded apprenticeships between canon figures (Jared, 2026-11-25; D-506): who trained whom, and when. A master killed
// before or during an apprenticeship changes the student's training, and takes them off their canon line from that day.
// From the figures' "teachers" facts where both are on the roster, dated by the student's own Padawan or apprentice spans
// (era09Timeline.ts). Calendar years as BBY; toBby absent = to the end of the figure's spans on record.
export interface Apprenticeship {
  student: string;
  master: string;
  fromBby: number;
  toBby?: number;
  source: string;
}

const a = (student: string, master: string, fromBby: number, toBby: number | undefined, source: string): Apprenticeship => ({ student: `lore:${student}`, master: `lore:${master}`, fromBby, ...(toBby !== undefined ? { toBby } : {}), source });

export const APPRENTICESHIPS: readonly Apprenticeship[] = [
  a('darth-karrid', 'gnost-dural', 3665, 3653, 'trained by Gnost-Dural (facts); her Padawan span'),
  a('darth-karrid', 'darth-malgus', 3652, 3644, 'then Malgus (facts); her apprentice spans'),
  a('aryn-leneer', 'ven-zallow', 3673, 3662, 'Master Ven Zallow (infobox)'),
  a('sajar', 'tol-braga', 3654, undefined, 'Master Tol Braga (infobox)'),
  a('warren-sedoru', 'tol-braga', 3698, 3687, 'Master Tol Braga'),
  a('fortris-gall', 'orgus-din', 3655, 3644, 'Orgus Din (infobox)'),
  a('bengel-morr', 'orgus-din', 3657, 3646, 'Master Orgus Din'),
  a('xerender', 'wyellett', 3671, 3660, "Master Wyellett; Wyellett's apprentice Xerender"),
  a('ashara-zavros', 'darth-nox', 3649, 3638, "Master: Darth Nox (the infobox lists her as Nox's apprentice)"),
  a('praven', 'darth-angral', 3653, 3645, 'Master Angral'),
  a('nefarid', 'darth-angral', 3643, undefined, 'Master Angral'),
  a('jaesa-willsaam', 'nomen-karr', 3651, 3643, 'Nomen Karr (facts); her Padawan span'),
];

/** The apprenticeships a master's death on a date cuts short: those not yet over (BBY: the death is before their end). */
export const cutShortBy = (masterId: string, deathBby: number): Apprenticeship[] => APPRENTICESHIPS.filter((x) => x.master === masterId && (x.toBby === undefined || deathBby > x.toBby));
