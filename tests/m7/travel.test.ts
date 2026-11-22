// Travel (m7-start-checklist.md item 26; D-405) and era rank names (item 15).
import { describe, expect, it } from 'vitest';
import type { Intent } from '../../src/ai/schemas/intent';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { rankErasAt } from '../../src/data/eraRanks';
import { HYPERDRIVE_CLASSES } from '../../src/data/travel.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { gridDistance, planTrip } from '../../src/engine/travel';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { stateBlock } from '../../src/turn/context';
import { resolveTurn } from '../../src/turn/resolve';
import { planTravel } from '../../src/turn/travel';

const CORUSCANT = { name: 'Coruscant', region: 'Core Worlds', grid: 'L-9' };
const ALDERAAN = { name: 'Alderaan', region: 'Core Worlds', grid: 'M-10' };

describe('the trip time (D-405; all numbers invented)', () => {
  it('the Coruscant-Alderaan anchor: one Core hop at the minimum, plus climb-out', () => {
    expect(gridDistance('L-9', 'M-10')).toBe(1);
    const at = (c: number) => planTrip({ from: CORUSCANT, to: ALDERAAN, bby: 3661, faction: 'republic', shipClass: c });
    expect(at(2)).toMatchObject({ ok: true, hours: 10 }); // 4 h x 2 + 2 h
    expect(at(1.5)).toMatchObject({ ok: true, hours: 8 }); // 4 h x 1.5 + 2 h
    expect(at(1)).toMatchObject({ ok: true, hours: 6 });
  });
  it('time per grid square beyond the first, at the slower region\'s rate', () => {
    // Coruscant (Core, L-9) to Nar Shaddaa (Hutt Space, S-12): 7 squares, Outer Rim / Hutt rate 16 + 8 x 6 = 64 h at Class 1.
    const p = planTrip({ from: CORUSCANT, to: { name: 'Nar Shaddaa', region: 'Hutt Space', grid: 'S-12' }, bby: 3661, faction: 'underworld', shipClass: 1 });
    expect(p).toMatchObject({ ok: true, hours: 66, squares: 7, rate: 'Outer Rim / Hutt Space' });
  });
  it('the Deep Core, asteroid fields, off the lanes and the Maelstrom', () => {
    const deep = planTrip({ from: CORUSCANT, to: { name: 'Empress Teta', region: 'Deep Core', grid: 'L-9' }, bby: 3661, faction: 'republic', shipClass: 1 });
    expect(deep).toMatchObject({ ok: true, hours: 14 }); // 4 x 3 + 2
    expect(planTrip({ from: CORUSCANT, to: ALDERAAN, bby: 3661, faction: 'republic', shipClass: 1, offLane: true })).toMatchObject({ hours: 21 }); // 4 x 4 + 3 + 2
    expect(planTrip({ from: CORUSCANT, to: { name: 'Maelstrom Nebula', region: 'Outer Rim Territories', grid: 'S-5' }, bby: 3661, faction: 'sithEmpire', shipClass: 1 })).toMatchObject({ hours: 74 });
  });
  it('the blockade cuts the Devaron-Minos corridor in 3,661-3,660 for all but Mandalorians and Imperials', () => {
    const eliad = { name: 'Eliad', region: 'Outer Rim Territories', grid: 'M-20' };
    expect(planTrip({ from: CORUSCANT, to: eliad, bby: 3661, faction: 'republic', shipClass: 2 }).ok).toBe(false);
    expect(planTrip({ from: CORUSCANT, to: eliad, bby: 3661, faction: 'mandalorians', shipClass: 2 }).ok).toBe(true);
    expect(planTrip({ from: CORUSCANT, to: eliad, bby: 3659, faction: 'republic', shipClass: 2 }).ok).toBe(true);
  });
  it('house-default classes as amended', () => {
    expect([HYPERDRIVE_CLASSES['commonFreighter']!.class, HYPERDRIVE_CLASSES['smugglerShip']!.class, HYPERDRIVE_CLASSES['civilianTransport']!.class]).toEqual([2, 1.5, 3]);
  });
});

describe('travel in play', () => {
  const at = absDayFromDate({ year: -3661, month: 1, day: 1 });
  const fresh = (): GameState => {
    let s = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c', branchId: 'b', seed: 's', start: { day: at, second: 8 * 3600 },
      character: { name: 'Kael', birthDay: at - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
      startingXp: { soresu: xpForLevel(30) }, rank: 'knight',
    });
    s = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: '', moveHere: true }], { source: 'ai' }).state;
    return s;
  };
  const travel = (names: string[]): Intent => ({ actionType: 'travel', targets: [], references: [], unknownNames: names });

  it('a trip to a map world takes the engine\'s time, which passes', () => {
    const s = fresh();
    const t = planTravel(s, travel(['Alderaan']))!;
    expect(t).toMatchObject({ from: 'Coruscant', to: 'Alderaan', ok: true, hours: 10, shipClass: 2 });
    const { draft, state } = resolveTurn(REGISTRY, s, travel(['Alderaan']));
    expect(draft.travel?.hours).toBe(10);
    expect(state.clock.now.second - s.clock.now.second).toBe(10 * 3600);
  });
  it('a closed world is refused and no time passes', () => {
    const s = fresh();
    const { draft, state } = resolveTurn(REGISTRY, s, travel(['Dromund Kaas']));
    expect(draft.travel).toMatchObject({ ok: false });
    expect(draft.travel!.reason).toMatch(/no usable coordinates/);
    expect(state.clock.now).toEqual(s.clock.now);
  });
  it('a place not on the map leaves the time to the narrator', () => {
    expect(planTravel(fresh(), travel(['Nowhere Prime']))).toBeNull();
  });
});

describe('era rank names (item 15)', () => {
  it('3,661 BBY: the Old Republic Jedi and Vitiate\'s Empire', () => {
    expect(rankErasAt(-3661).map((r) => r.era)).toEqual(['the Old Republic to the New Sith Wars', "Vitiate's Empire"]);
    expect(rankErasAt(-32).map((r) => r.era)).toEqual(['the late Republic', 'the Rule of Two']);
    expect(rankErasAt(-3996).map((r) => r.era)).toEqual(['the Great Sith War', "Vitiate's Empire", "Kun's Brotherhood of the Sith"]);
  });
  it('the narrator sees them in the state block', () => {
    const at = absDayFromDate({ year: -3661, month: 1, day: 1 });
    const s = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c', branchId: 'b', seed: 's', start: { day: at, second: 8 * 3600 },
      character: { name: 'Kael', birthDay: at - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
      startingXp: { soresu: xpForLevel(30) }, rank: 'knight',
    });
    expect(stateBlock(s, makeEstimator(4)).text).toMatch(/Rank names in this era: Jedi \(.*Grand Master.*; Sith \(Vitiate's Empire\): acolyte, apprentice, Sith Lord, Darth/);
  });
});
