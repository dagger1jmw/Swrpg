// D-440, D-441: what the narrator sees from the Nov 22 lore update (holocrons at the start year, the destroyed Malachor V,
// the tank fluid of the date).
import { describe, expect, it } from 'vitest';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { seedRng } from '../../src/engine/rng';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { resolvedBlock, stateBlock } from '../../src/turn/context';
import type { TurnDraft } from '../../src/turn/resolve';

const at = (year: number) => absDayFromDate({ year, month: 1, day: 1 });
const fresh = (year: number): GameState =>
  createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 's',
    start: { day: at(year), second: 8 * 3600 },
    character: { name: 'Kael', birthDay: at(year) - 20 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 },
    startingXp: { soresu: xpForLevel(20) },
    rank: 'padawan',
  });
const goTo = (s: GameState, name: string, region: string): GameState =>
  applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', key: 'tmp:1', name, kind: 'planet', region, description: '', moveHere: true }], { source: 'ai' }).state;
const est = makeEstimator(4);
const block = (s: GameState, playerText = ''): string => stateBlock(s, est, undefined, [], playerText).text;

describe('holocrons in the narrator context (D-441)', () => {
  it('the whole start-year list when the player names holocrons, resolved at the start year', () => {
    const t = block(goTo(fresh(-3661), 'Coruscant', 'Core Worlds'), 'I ask the archivist about Sith holocrons.');
    expect(t).toMatch(/Holocrons on record at the campaign's start .*Dark Holocron \(Sith; Exar Kun, who stole it\)/);
    expect(t).not.toMatch(/Master Satele's holocron/); // Cold War or later
    expect(t).not.toMatch(/Ergast's holocron/); // undated
  });
  it('only the ones at this place otherwise, and nothing where none is on record', () => {
    const korriban = block(goTo(fresh(-3661), 'Korriban', 'Horuset system'));
    expect(korriban).toMatch(/Holocrons on record at this place at the campaign's start: .*Dathka Graush's holocron/);
    expect(korriban).not.toMatch(/Dark Holocron/);
    expect(block(goTo(fresh(-3661), 'Alderaan', 'Core Worlds'))).not.toMatch(/Holocrons on record/);
  });
});

describe('Malachor V and the healing fluid (D-440)', () => {
  it('the narrator is told Malachor V is a wreckage field, with no nexus', () => {
    const t = block(goTo(fresh(-3661), 'Malachor V', 'Outer Rim Territories'));
    expect(t).toMatch(/World state here: Malachor V is an asteroid and wreckage field in the Malachor system/);
    expect(t).toMatch(/Era rule: Malachor V was destroyed in 3,951 BBY/);
  });
  it('a tank is a kolto tank in 3661 BBY and a bacta tank in 19 BBY', () => {
    // The engine picks the fluid (D-511: medicine's tankFluid); the line names it and the date's standard.
    const d = (kind: string) => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: null, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [{ event: { type: 'careStarted', kind, hours: 6 }, notes: [] }], rejected: [] }) as unknown as TurnDraft;
    expect(resolvedBlock(d('kolto'), [], -3661)).toMatch(/Care applied this turn: a kolto tank \(the patient does nothing else meanwhile\) \(kolto is the standard healing fluid of this date; bacta is a rare import, had only in the Core and at the Temple\)/);
    expect(resolvedBlock(d('bacta'), [], -19)).toMatch(/Care applied this turn: a bacta tank \(the patient does nothing else meanwhile\) \(bacta is the standard healing fluid of this date; kolto is rare, had only in the Core and at the Temple\)\./);
  });
});
