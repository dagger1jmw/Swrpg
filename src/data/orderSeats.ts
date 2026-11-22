// Where the Jedi Order is based, by campaign year (Docs/SWRPG lore/SW_Legends_Galaxy_Timeline.md; D-02 generalized
// by D-155: every era, not only the Old Republic). Years are calendar years (negative = BBY). `estimate` marks a
// boundary the lore files do not date (a design default, a question for Jared).
export interface OrderSeat {
  fromYear: number;
  /** Exclusive. */
  toYear: number;
  seat: string | null;
  source: string;
  estimate?: string;
  /** The Order is moving between seats (D-397: 3,653–3,650 BBY, the Coruscant Temple in ruins). */
  relocating?: boolean;
}

export const ORDER_SEATS: readonly OrderSeat[] = [
  { fromYear: -Infinity, toYear: -25000, seat: 'the Je\'daii temples on Tython', source: 'Timeline :76' },
  { fromYear: -25000, toYear: -3653, seat: 'the Jedi Temple on Coruscant', source: 'Timeline :90; Timeline slice Part 1 (3,653 BBY, the Sacking)' },
  {
    fromYear: -3653,
    toYear: -3650,
    seat: 'the ruined Jedi Temple on Coruscant (the Order is relocating to Tython)',
    source: 'Timeline slice Part 1 (3,653 BBY: the Temple destroyed in the Sacking); D-397',
    relocating: true,
  },
  {
    fromYear: -3650,
    toYear: -3600,
    seat: 'the Jedi Temple on Tython',
    source: 'Timeline slice Part 2 (3,650 BBY: the Order relocates to Tython; the Temple there is finished in 3,647)',
    estimate: 'the return to Coruscant is not dated in the lore files; 3,600 BBY is a design default',
  },
  { fromYear: -3600, toYear: -19, seat: 'the Jedi Temple on Coruscant', source: 'Timeline :421-424', estimate: 'start year as above' },
  { fromYear: -19, toYear: 11, seat: null, source: 'Timeline :424 (the Temple falls; the Order is destroyed)' },
  { fromYear: 11, toYear: 36, seat: 'the Jedi Praxeum on Yavin 4', source: 'Timeline :512' },
  {
    fromYear: 36,
    toYear: 128,
    seat: 'the Jedi academy on Ossus',
    source: 'Timeline :610',
    estimate: 'the move from Yavin 4 to Ossus is not dated in the lore files; 36 ABY is a design default',
  },
  { fromYear: 128, toYear: Infinity, seat: null, source: 'Timeline :614 (Massacre at Ossus)' },
];

export function orderSeatAt(year: number): string | null {
  return ORDER_SEATS.find((s) => year >= s.fromYear && year < s.toYear)?.seat ?? null;
}
