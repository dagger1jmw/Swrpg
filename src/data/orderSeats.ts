// Where the Jedi Order is based, by campaign year (Docs/SWRPG lore/SW_Legends_Galaxy_Timeline.md; D-02 generalized
// by D-155: every era, not only the Old Republic). Years are calendar years (negative = BBY). `estimate` marks a
// boundary the lore files do not date (a design default, a question for Jared).
import type { OutcomeLinks } from './worldControl';

export interface OrderSeat extends OutcomeLinks {
  fromYear: number;
  /** Exclusive. */
  toYear: number;
  seat: string | null;
  source: string;
  estimate?: string;
  /** The Order has moved and its Temple is not built yet (D-397, D-476: Tython, 3,653–3,648 BBY). */
  relocating?: boolean;
  /** Where an Order member lives and trains (D-451; the place's Force bonus comes from forceNexus.ts by name). */
  home?: HomePlace;
}

/** A home seat as a place: the building or city, and the world it stands on. */
export interface HomePlace {
  name: string;
  planet: string;
}

const TEMPLE: HomePlace = { name: 'the Jedi Temple', planet: 'Coruscant' };

export const ORDER_SEATS: readonly OrderSeat[] = [
  { fromYear: -Infinity, toYear: -25000, seat: 'the Je\'daii temples on Tython', source: 'Timeline :76', home: { name: 'the Je\'daii temples', planet: 'Tython' } },
  { fromYear: -25000, toYear: -3653, seat: 'the Jedi Temple on Coruscant', source: 'Timeline :90; Timeline slice Part 1 (3,653 BBY, the Sacking)', home: TEMPLE },
  // D-476 (Jared): the Order's home from 3,653 is Tython, with no Temple until 3,647; the ruined Coruscant Temple is never the seat.
  {
    fromYear: -3653,
    toYear: -3647,
    seat: 'Tython (the Order\'s new Temple there is not finished)',
    source: 'SW_Coruscant_Jedi_Temple_OldRepublic_Part1 (3653 BBY: "Jedi to Tython"); Timeline slice Part 2 (3,650 BBY: building begins; 3,647: finished); D-476',
    dependsOn: ['O.temple_destroyed'],
    relocating: true,
    home: { name: 'Tython', planet: 'Tython' },
  },
  {
    fromYear: -3647,
    toYear: -3600,
    seat: 'the Jedi Temple on Tython',
    source: 'Timeline slice Part 2 (3,647 BBY: the Temple is finished); D-476',
    dependsOn: ['O.tython_temple'],
    estimate: 'the return to Coruscant is not dated in the lore files; 3,600 BBY is a design default',
    home: { name: 'the Jedi Temple on Tython', planet: 'Tython' },
  },
  { fromYear: -3600, toYear: -19, seat: 'the Jedi Temple on Coruscant', source: 'Timeline :421-424', estimate: 'start year as above', home: TEMPLE },
  { fromYear: -19, toYear: 11, seat: null, source: 'Timeline :424 (the Temple falls; the Order is destroyed)' },
  { fromYear: 11, toYear: 36, seat: 'the Jedi Praxeum on Yavin 4', source: 'Timeline :512', home: { name: 'the Jedi Praxeum', planet: 'Yavin 4' } },
  {
    fromYear: 36,
    toYear: 128,
    seat: 'the Jedi academy on Ossus',
    source: 'Timeline :610',
    estimate: 'the move from Yavin 4 to Ossus is not dated in the lore files; 36 ABY is a design default',
    home: { name: 'the Jedi academy', planet: 'Ossus' },
  },
  { fromYear: 128, toYear: Infinity, seat: null, source: 'Timeline :614 (Massacre at Ossus)' },
];

export function orderSeatAt(year: number): string | null {
  return ORDER_SEATS.find((s) => year >= s.fromYear && year < s.toYear)?.seat ?? null;
}

/**
 * Where the Sith train, by year (D-451, Jared): the Korriban academy for acolytes and the Lords' seat (Dromund Kaas while
 * the Empire holds it) for apprentices and Lords; none while abandoned or with no seat on record. Each row is a dated fact
 * from the lore; `estimate` marks an undated boundary (a design default, a question for Jared). Years are calendar years
 * (negative = BBY), `toYear` exclusive. The place's Force bonus comes from forceNexus.ts by name (Korriban and Dromund Kaas
 * are major dark nexus planets).
 */
export interface SithSeat {
  fromYear: number;
  toYear: number;
  /** The academy for acolytes, or null. */
  acolytes: HomePlace | null;
  /** The seat of apprentices and Lords, or null. */
  lords: HomePlace | null;
  source: string;
  estimate?: string;
}

const KORRIBAN_ACADEMY: HomePlace = { name: 'the Sith Academy', planet: 'Korriban' };
const KAAS_CITY: HomePlace = { name: 'Kaas City', planet: 'Dromund Kaas' };

export const SITH_SEATS: readonly SithSeat[] = [
  // Revan and Malak take the academy and make Korriban the public capital of their empire; abandoned after 3956.
  { fromYear: -3959, toYear: -3956, acolytes: KORRIBAN_ACADEMY, lords: { name: 'Dreshdae', planet: 'Korriban' }, source: 'SW_Korriban_Planet (Jedi Civil War: the academy, the public capital; 3956 BBY: abandoned again); Timeline (3,959 BBY)' },
  // Vitiate's Empire on Dromund Kaas from its rediscovery; Korriban is not Imperial until 3681.
  { fromYear: -4980, toYear: -3959, acolytes: null, lords: KAAS_CITY, source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1 (rediscovered 4980 BBY, the capital through the window)' },
  { fromYear: -3956, toYear: -3681, acolytes: null, lords: KAAS_CITY, source: 'SW_Dromund_Kaas_KaasCity_OldRepublic_Part1; SW_Korriban_Planet (3955/3954 BBY: no Sith left on Korriban)' },
  { fromYear: -3681, toYear: -3637, acolytes: KORRIBAN_ACADEMY, lords: KAAS_CITY, source: 'SW_Korriban_Planet (3681 BBY: the Empire retakes Korriban and rebuilds the academy; 3637: the Republic holds it briefly); worldControl (Korriban, Dromund Kaas)' },
  {
    fromYear: -3637,
    toYear: -3600,
    acolytes: null,
    lords: KAAS_CITY,
    source: 'SW_Korriban_Planet (3637 Republic invasion, c. 3636 Zakuul bombardment; the temples rebuilt later, undated); SW_Dromund_Kaas_History (c. 3636-3630 BBY: Empress Acina rules from Kaas)',
    estimate: 'the lore files stop at 3630 BBY; the Empire is taken to hold Dromund Kaas to 3,600 BBY (a design default, as the Jedi return to Coruscant)',
  },
  // The Brotherhood of Darkness seizes Korriban and runs the academy (Qordis); its headquarters are there too
  // (ruled 23 Nov 2026; D-468, D-451 follow-up: the New Sith Wars article says Roon).
  { fromYear: -1010, toYear: -1000, acolytes: KORRIBAN_ACADEMY, lords: { name: 'the Brotherhood headquarters', planet: 'Korriban' }, source: 'Timeline :319-320 (c. 1,010 BBY); SW_Korriban_Planet (New Sith Wars); Characters_10 (Qordis heads the academy)' },
  { fromYear: 27, toYear: Infinity, acolytes: { name: 'Korriban', planet: 'Korriban' }, lords: { name: 'Korriban', planet: 'Korriban' }, source: 'SW_Korriban_Planet (27 ABY: Darth Krayt founds the One Sith there)', estimate: 'the end of the One Sith on Korriban is not in the lore files' },
];

/** The Order's home for a rank tier at a year (D-451): the Jedi seat for every Jedi; the Sith academy or Lords' seat. */
export function homeSeatAt(path: 'jedi' | 'sith', tier: 'initiate' | 'padawan' | 'knight', year: number): HomePlace | null {
  if (path === 'jedi') return ORDER_SEATS.find((s) => year >= s.fromYear && year < s.toYear)?.home ?? null;
  const row = SITH_SEATS.find((s) => year >= s.fromYear && year < s.toYear);
  if (!row) return null;
  return tier === 'initiate' ? row.acolytes : row.lords;
}
