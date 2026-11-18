// D-176: E and CI run 0-120 (the gain formulas' limit), and loading clamps an out-of-range number instead of rejecting.
import { TEST_START_DATE } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { absDayFromDate } from '../../src/engine/calendar';
import { gainCI, gainE } from '../../src/engine/appliedExperience';
import { loadEnvelope, makeEnvelope } from '../../src/persist/envelope';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const START = absDayFromDate(TEST_START_DATE);
const knight = (): GameState =>
  createInitialState<GameState>(REGISTRY, { campaignId: 'c', branchId: 'b', seed: 's', start: { day: START, second: 0 }, character: { name: 'K', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 }, rank: 'knight' });
const roundTrip = (s: GameState) => loadEnvelope(REGISTRY, JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, s, 'x'))) as unknown);

describe('save ranges and clamping on load (D-176)', () => {
  it('E and CI near their 120 limit save and reload unchanged, with no warning', () => {
    let e = { E: 0, eSpar: 0 };
    for (let i = 0; i < 300; i++) e = gainE(e, 'serious');
    let c = { CI: 0, ciSpar: 0 };
    for (let i = 0; i < 3000; i++) c = gainCI(c, 'lethal');
    expect(e.E).toBeGreaterThan(110);
    expect(c.CI).toBeGreaterThan(110);
    const s0 = knight();
    const s = { ...s0, progression: { ...s0.progression, E: { soresu: e }, CI: { forcePush: c } } };
    const r = roundTrip(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.warnings).toEqual([]);
    expect(r.state.progression.E['soresu']!.E).toBeCloseTo(e.E, 9);
    expect(r.state.progression.CI['forcePush']!.CI).toBeCloseTo(c.CI, 9);
  });
  it('a save with one out-of-range number still loads, clamped, with a warning', () => {
    const s0 = knight();
    const s = { ...s0, progression: { ...s0.progression, E: { soresu: { E: 150, eSpar: 15 } } } };
    const r = roundTrip(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.state.progression.E['soresu']!.E).toBe(120);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toMatch(/progression\.E\.soresu\.E: 150 .*clamped to 120/);
  });
  it('a structurally broken save is still rejected', () => {
    const env = JSON.parse(JSON.stringify(makeEnvelope(REGISTRY, knight(), 'x'))) as { state: { progression: { E: unknown } } };
    env.state.progression.E = 'not a record';
    expect(loadEnvelope(REGISTRY, env).ok).toBe(false);
  });
});
