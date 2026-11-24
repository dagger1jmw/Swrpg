import { describe, expect, it } from 'vitest';
import { ORDER_SEATS, orderSeatAt } from '../../src/data/orderSeats';

describe('Order seats (D-397)', () => {
  it('Coruscant until the Sacking, Tython with no Temple 3,653–3,648 BBY, the Tython Temple from 3,647 (D-476)', () => {
    expect(orderSeatAt(-3661)).toBe('the Jedi Temple on Coruscant');
    for (const y of [-3653, -3651, -3650, -3648]) expect(orderSeatAt(y)).toMatch(/^Tython .*not finished/);
    expect(orderSeatAt(-3647)).toBe('the Jedi Temple on Tython');
    expect(ORDER_SEATS.some((s) => /ruined/.test(s.seat ?? ''))).toBe(false);
    expect(ORDER_SEATS.find((s) => s.fromYear === -3653)?.relocating).toBe(true);
  });
  it('the seats tile the calendar without gaps', () => {
    for (let i = 1; i < ORDER_SEATS.length; i++) expect(ORDER_SEATS[i]!.fromYear).toBe(ORDER_SEATS[i - 1]!.toYear);
  });
});
