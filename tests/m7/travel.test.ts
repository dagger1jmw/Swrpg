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
import { describeTravel, planTravel } from '../../src/turn/travel';
import { worldsOnRoute } from '../../src/data/galaxyMap';

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
  it('the blockade (D-406): the Hydian Way in the strip is closed in 3,661-3,660 for all but Mandalorians and Imperials', () => {
    const eriadu = { name: 'Eriadu', region: 'Outer Rim Territories', grid: 'M-18', onBlockadeRoute: true };
    expect(planTrip({ from: CORUSCANT, to: eriadu, bby: 3661, faction: 'republic', shipClass: 2 })).toMatchObject({ ok: false, reason: expect.stringMatching(/Eriadu is on it/) });
    expect(planTrip({ from: CORUSCANT, to: eriadu, bby: 3661, faction: 'mandalorians', shipClass: 2 }).ok).toBe(true);
    expect(planTrip({ from: CORUSCANT, to: eriadu, bby: 3661, faction: 'sithEmpire', shipClass: 2 }).ok).toBe(true);
    expect(planTrip({ from: CORUSCANT, to: eriadu, bby: 3659, faction: 'republic', shipClass: 2 }).ok).toBe(true);
    // Along the Hydian Way through the strip: Denon (N-13) to Imynusoph (J-21), both outside it.
    const denon = { name: 'Denon', region: 'Inner Rim', grid: 'N-13', onBlockadeRoute: true };
    const imynusoph = { name: 'Imynusoph', region: 'Outer Rim Territories', grid: 'J-21', onBlockadeRoute: true };
    expect(planTrip({ from: denon, to: imynusoph, bby: 3660, faction: 'republic', shipClass: 2 }).ok).toBe(false);
    // Two Hydian Way worlds north of the strip are not affected.
    const brentaal = { name: 'Brentaal IV', region: 'Core Worlds', grid: 'L-9', onBlockadeRoute: true };
    expect(planTrip({ from: brentaal, to: denon, bby: 3661, faction: 'republic', shipClass: 1 }).ok).toBe(true);
  });
  it('other strip worlds are reachable with the ×1.5 detour and the zone note (Sullust, off the Hydian Way)', () => {
    const sullust = { name: 'Sullust', region: 'Outer Rim Territories', grid: 'M-17' };
    // Coruscant L-9 to Sullust M-17: 8 squares, Outer Rim rate 16 + 8 × 7 = 72 h; × 2 class × 1.5 detour = 216, + 2 climb-out.
    expect(planTrip({ from: CORUSCANT, to: sullust, bby: 3661, faction: 'republic', shipClass: 2 })).toMatchObject({ ok: true, hours: 218, notes: ['blockade zone: patrols, shortages, scarce passage'] });
    // Mandalorians and Imperials skip the detour but still see the zone.
    expect(planTrip({ from: CORUSCANT, to: sullust, bby: 3661, faction: 'mandalorians', shipClass: 2 })).toMatchObject({ ok: true, hours: 146, notes: ['blockade zone: patrols, shortages, scarce passage'] });
    // After 3,660: no detour, no note.
    expect(planTrip({ from: CORUSCANT, to: sullust, bby: 3659, faction: 'republic', shipClass: 2 })).toMatchObject({ ok: true, hours: 146, notes: [] });
  });
  it('the Hydian Way worlds come from the map\'s route data', () => {
    const on = worldsOnRoute('Hydian Way');
    for (const w of ['eriadu', 'malastare', 'denon', 'brentaal iv', 'imynusoph', 'bonadan', 'serenno', 'telos iv']) expect(on.has(w)).toBe(true);
    for (const w of ['sullust', 'eliad', 'coruscant', 'alderaan']) expect(on.has(w)).toBe(false);
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
  it('blockade in play: Malastare is refused, Sullust is reached with the zone line', () => {
    const s = fresh();
    expect(planTravel(s, travel(['Malastare']))).toMatchObject({ ok: false });
    const t = planTravel(s, travel(['Sullust']))!;
    expect(t).toMatchObject({ ok: true, hours: 218 });
    expect(describeTravel(t)).toMatch(/Blockade zone: patrols, shortages, scarce passage\./);
    // The anchor is unchanged.
    expect(planTravel(s, travel(['Alderaan']))).toMatchObject({ ok: true, hours: 10, notes: [] });
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
