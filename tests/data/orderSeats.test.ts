import { describe, expect, it } from 'vitest';
import { ORDER_SEATS, orderSeatAt } from '../../src/data/orderSeats';

describe('Order seats (D-397)', () => {
  it('Coruscant until the Sacking, relocating 3,653–3,651 BBY, Tython from 3,650 BBY', () => {
    expect(orderSeatAt(-3661)).toBe('the Jedi Temple on Coruscant');
    expect(orderSeatAt(-3653)).toContain('ruined Jedi Temple on Coruscant');
    expect(orderSeatAt(-3651)).toContain('relocating');
    expect(orderSeatAt(-3650)).toBe('the Jedi Temple on Tython');
    expect(ORDER_SEATS.find((s) => s.fromYear === -3653)?.relocating).toBe(true);
  });
  it('the seats tile the calendar without gaps', () => {
    for (let i = 1; i < ORDER_SEATS.length; i++) expect(ORDER_SEATS[i]!.fromYear).toBe(ORDER_SEATS[i - 1]!.toYear);
  });
});
