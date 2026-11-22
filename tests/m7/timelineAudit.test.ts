// Timeline audit 3,661 -> 3,640 BBY (overnight run item 3, D-408): the date-driven tables agree with each other year by
// year. The full year-by-year dump is scripts/audit-timeline.ts.
import { describe, expect, it } from 'vitest';
import { CANON_NPCS } from '../../src/data/canonNpcs';
import { CANON_PLACEMENTS } from '../../src/data/canonPlacements';
import { closedWorlds, WORLD_GATES } from '../../src/data/galaxyMap';
import { orderSeatAt } from '../../src/data/orderSeats';
import { controlAt, FACTION_LEADERS, leadersAt, WORLD_CONTROL } from '../../src/data/worldControl';
import { canonOffBoard } from '../../src/engine/canonRoster';

const YEARS = Array.from({ length: 22 }, (_, i) => 3661 - i); // 3,661 .. 3,640

describe('timeline audit 3,661-3,640 (D-408)', () => {
  it('Tython: closed through 3,652, open from its rediscovery in 3,651, the seat from 3,650', () => {
    expect(closedWorlds('republic', 3652).map((g) => g.place)).toContain('Tython');
    expect(closedWorlds('republic', 3651).map((g) => g.place)).not.toContain('Tython');
    expect(controlAt(['Tython'], 3652)[0]?.side).toBe('unknown to the galaxy');
    expect(controlAt(['Tython'], 3651)[0]?.side).toBe('republic');
    expect(orderSeatAt(-3651)).toMatch(/relocating/);
    expect(orderSeatAt(-3650)).toBe('the Jedi Temple on Tython');
  });
  it('no world is "unknown to the galaxy" while its gate is open, and no side is shut out of a world it holds', () => {
    for (const bby of YEARS) {
      for (const c of WORLD_CONTROL.filter((x) => bby <= x.fromBby && bby >= x.toBby)) {
        const gate = WORLD_GATES.find((g) => g.place === c.place);
        if (c.side === 'unknown to the galaxy' && gate) expect(closedWorlds('other', bby).map((g) => g.place), `${c.place} ${bby}`).toContain(c.place);
        if ((c.side === 'republic' || c.side === 'sithEmpire') && gate?.closedTo === c.side) expect(closedWorlds(c.side, bby).map((g) => g.place), `${c.place} ${bby}`).not.toContain(c.place);
      }
    }
  });
  it('every leader in office is alive on the roster that year', () => {
    for (const bby of YEARS) {
      for (const l of leadersAt(bby)) {
        const n = CANON_NPCS.find((x) => x.name.length > 3 && l.holder.includes(x.name));
        if (n) expect(canonOffBoard(n, bby), `${l.holder} ${bby}`).toBeNull();
      }
    }
  });
  it('a Chancellor, a Supreme Commander, an Emperor (or the Dark Council) and a Mandalore every year; the Grand Master only vacant in 3,652', () => {
    const offices = [...new Set(FACTION_LEADERS.map((l) => l.office))];
    const gaps = YEARS.flatMap((bby) => offices.filter((o) => !leadersAt(bby).some((l) => l.office === o)).map((o) => `${o} ${bby}`));
    expect(gaps).toEqual(['Grand Master of the Jedi Order 3652']);
    expect(leadersAt(3649).find((l) => l.office === 'Supreme Chancellor')?.holder).toBe('Dorian Janarus');
  });
  it('Coruscant has a controller every year', () => {
    for (const bby of YEARS) expect(controlAt(['Coruscant'], bby).length, String(bby)).toBeGreaterThan(0);
  });
  it('placed figures are on the board (or in prison) for every year they are placed', () => {
    for (const bby of YEARS) {
      for (const p of CANON_PLACEMENTS.filter((x) => x.canonId && bby <= x.fromBby && bby >= x.toBby)) {
        const n = CANON_NPCS.find((x) => x.canonId === p.canonId)!;
        expect(canonOffBoard(n, bby), `${p.name} ${bby}`).toBe(p.imprisoned ? 'imprisoned' : null);
      }
    }
  });
});
