// Niman (Form VI) rules, D-121: the fundamentals transfer uses the average of Forms I, III, IV and V;
// synergy into Niman from each of them at 0.10 (ceiling 0.6) replaces the 0.05 foundation; Niman
// drills have physical load 0.8.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { ACTIVITY_BY_ID } from '../../src/data/activities';
import { FORM_TRANSFER_SHARE } from '../../src/data/progression.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { levelExact, xpForLevel } from '../../src/engine/curve';
import { transferBaseXp, transferXp } from '../../src/engine/forms';
import { SYNERGY_LINKS } from '../../src/engine/synergy';
import { resolveTraining } from '../../src/features/progression/selectors';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';

const levels: Record<string, number> = { shiiCho: 30, makashi: 50, soresu: 40, ataru: 20, shien: 10, djemSo: 26 };
const xpOf = (f: string): number => xpForLevel(levels[f] ?? 0);

describe('Niman (D-121)', () => {
  it('the transfer uses the average of the Form I, III, IV and V levels (Form V = the higher variant), not the highest form', () => {
    // (30 + 40 + 20 + max(10, 26)) / 4 = 29; Makashi (Form II, 50) is not in it.
    expect(levelExact(transferBaseXp('niman', xpOf))).toBeCloseTo(29, 9);
    expect(transferXp('niman', xpOf)).toBeCloseTo(FORM_TRANSFER_SHARE * xpForLevel(29), 6);
    // Every other form still uses the highest form (Makashi 50).
    expect(transferBaseXp('juyo', xpOf)).toBeCloseTo(xpForLevel(50), 6);
    // An untrained form counts as 0 in the average.
    expect(levelExact(transferBaseXp('niman', (f) => (f === 'shiiCho' ? xpForLevel(40) : 0)))).toBeCloseTo(10, 9);
  });

  it('synergy into Niman comes from Forms I, III, IV and V at 0.10 (ceiling 0.6); Makashi no longer feeds it', () => {
    const into = SYNERGY_LINKS.filter((l) => l.target === 'niman');
    expect(into.map((l) => l.source).sort()).toEqual(['ataru', 'djemSo', 'shien', 'shiiCho', 'soresu']);
    for (const l of into) expect(l.relation).toBe('nimanFoundation');
    // The Shii-Cho foundation to the other forms is unchanged.
    expect(SYNERGY_LINKS.find((l) => l.source === 'shiiCho' && l.target === 'makashi')?.relation).toBe('foundation');
  });

  it('Niman drills have physical load 0.8 (still a physical block)', () => {
    expect(ACTIVITY_BY_ID.get('nimanBasics')!.load).toEqual({ p: 0.8, m: 0.4, f: 0 });
  });

  it('in play, a first Niman session transfers from the Forms I, III, IV, V average', () => {
    const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
    const s = createInitialState<GameState>(REGISTRY, {
      campaignId: 'c',
      branchId: 'b',
      seed: 'niman',
      start: { day: START, second: 8 * 3600 },
      character: { name: 'Kael', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'makashi', trainingStartAge: 4 },
      startingXp: Object.fromEntries(Object.keys(levels).map((f) => [f, xpOf(f)])),
      rank: 'knight',
    });
    const plan = resolveTraining(s, { activityId: 'nimanBasics', hours: 1, teacherId: 'npc:x' });
    if (!plan.ok) throw new Error(plan.reason);
    const t = (plan.events[0] as { transfer?: Record<string, number> }).transfer!['niman']!;
    expect(t).toBeCloseTo(FORM_TRANSFER_SHARE * xpForLevel(29), 6);
    expect(plan.card.notes.some((n) => n.includes('average of Forms I, III, IV and V'))).toBe(true);
  });
});
