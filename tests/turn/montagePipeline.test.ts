// M4: montage and time-skip turns through the pipeline (the routine day loop, the report narrated, one
// time writer, pacing after the jump, the jump's own chapter), staleness and the code-appended Skip-ahead
// choice (D-18), jump choices, and world events marked told.
import { TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { absDayFromDate } from '../../src/engine/calendar';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { expandChoice } from '../../src/turn/expandChoice';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { TurnInput } from '../../src/turn/record';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';

const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
const narrative = (events: unknown[] = [], choices = narrativeInvestigate.choices) => ({ ...narrativeInvestigate, choices, events });

function setup(steps: FixtureStep[]) {
  const provider = createFixtureProvider(steps);
  const storage = createMemoryStorage();
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({
    getLists: () => getSettings().modelLists,
    getLimits: () => getSettings().limits,
    getUsage: () => store.usage,
    getQuota: () => store.quota,
    setQuota: (q) => (store.quota = q),
    now: () => 0,
  });
  let ms = Date.UTC(2026, 10, 17);
  const deps: TurnDeps = { registry: REGISTRY, provider, router, storage, getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
  return { provider, deps };
}

function session(seed = 'montage'): Session {
  let state = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day: START, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: START - 25 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 },
    rank: 'knight',
  });
  state = applyEvents(
    REGISTRY,
    state,
    [{ type: 'locationIntroduced', key: 'tmp:l', name: 'Jedi Temple', kind: 'building', region: 'Coruscant', description: 'The Temple.', moveHere: true }],
    { source: 'ai' },
  ).state;
  return { state, history: [], campaign: { campaignId: 'c1', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
}

const montage = (days: number): TurnInput => ({
  kind: 'action',
  label: `Montage: ${days} days`,
  intent: { actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: 'montage', requestedSpan: { amount: days, unit: 'days' } } as never,
});

describe('montage turns', () => {
  it('a 3-month montage: the routine runs day by day, the report is narrated, one time writer', async () => {
    const { deps, provider } = setup([{ callType: 'narrative', data: narrative([{ type: 'timeElapsed', seconds: 600, reason: 'x' }]) }]);
    const s0 = session();
    const { session: s1, record } = await playTurn(deps, s0, montage(92));
    expect(provider.calls.map((c) => c.opts.callType)).toEqual(['narrative']);
    const jump = record.draft.jump!;
    expect(jump.level).toBe('montage');
    // A jump started at 09:00 plans one morning fewer than the calendar days that pass (D-142).
    expect(jump.report.days.length).toBe(jump.report.daysCompleted - 1);
    expect(s1.state.progression.skills['soresu']!.xp).toBeGreaterThan(0);
    expect(s1.state.clock.now.second).toBe(s0.state.routines.active.wakeSecond);
    if (!jump.report.interrupted) expect(s1.state.clock.now.day).toBe(s0.state.clock.now.day + 92);
    // One time writer (D-30), the montage prompt and report, and the pacing after the jump.
    expect(JSON.stringify(provider.calls[0]!.opts.wireSchema)).not.toContain('timeElapsed');
    expect(provider.calls[0]!.opts.system).toContain('Pacing: montage');
    expect(provider.calls[0]!.messages.at(-1)!.text).toContain('MONTAGE REPORT');
    expect(s1.state.pacing.level).toBe(jump.report.interrupted ? 'moment' : 'scene');
    expect(record.draft.pacingLevel).toBe('montage');
  });

  it('a significant world event stops the montage early and the story zooms to moment', async () => {
    for (let i = 0; i < 30; i++) {
      const { deps, provider } = setup([{ callType: 'narrative', data: narrative() }]);
      const s0 = session(`stop${i}`);
      const { session: s1, record } = await playTurn(deps, s0, montage(120));
      const rep = record.draft.jump!.report;
      if (!rep.interrupted) continue;
      expect(rep.daysCompleted).toBeLessThan(120);
      expect(s1.state.pacing.level).toBe('moment');
      expect(provider.calls[0]!.messages.at(-1)!.text).toContain('Interrupted on');
      // The narration was given the event, so it is now told.
      expect(s1.state.world.log.filter((e) => e.significant).every((e) => e.narratedTurn === s1.state.meta.turn)).toBe(true);
      return;
    }
    throw new Error('no seed interrupted a 120-day montage');
  });

  it('a jump starts its own chapter, even a short one (Q56)', async () => {
    const { deps } = setup([
      { callType: 'narrative', data: narrative() },
      { callType: 'narrative', data: narrative() },
      { callType: 'summary', data: { chapterSummary: 'Days at the Temple.', arcSummary: 'A Knight trains.' } },
    ]);
    const look: TurnInput = { kind: 'action', label: 'Look', intent: { actionType: 'investigate', targets: [], references: [], unknownNames: [] } as never };
    const r1 = await playTurn(deps, session(), look);
    const { record } = await playTurn(deps, r1.session, montage(3));
    expect(record.chapterClosed?.reason).toContain('jump');
    expect(record.chapterClosed?.turnRange[1]).toBe(1);
  });
});

describe('staleness and the Skip-ahead choice (D-18)', () => {
  it('after 21 days with nothing new, code appends "Skip ahead: <top open thread>" when no choice jumps', async () => {
    const { deps } = setup([{ callType: 'narrative', data: narrative() }]);
    let s = session();
    s = { ...s, state: applyEvents(REGISTRY, s.state, [{ type: 'threadOpened', key: 'tmp:t', title: 'The envoy', stakes: 'peace', deadlineHint: 'months', entityRefs: [] }], { source: 'ai' }).state };
    // 30 days later at the same place, nothing new.
    s = { ...s, state: { ...s.state, clock: { ...s.state.clock, now: { day: s.state.clock.now.day + 30, second: 9 * 3600 } } } };
    const { record } = await playTurn(deps, s, { kind: 'action', label: 'Look around', intent: { actionType: 'investigate', targets: [], references: [], unknownNames: [] } as never });
    const skip = record.choices.at(-1)!;
    expect(skip.label).toBe('Skip ahead: The envoy');
    expect(skip.pacingHint).toBe('montage');
    expect(skip.spanDays).toBe(14);
    expect(record.draft.report.some((n) => n.startsWith('staleness'))).toBe(true);
    // Clicking it expands to a montage of that span (suggest only; the player decides).
    const { intent } = expandChoice(skip, () => null);
    expect(intent.requestedPacing).toBe('montage');
    expect(intent.requestedSpan).toEqual({ amount: 14, unit: 'days' });
  });

  it('after a real montage: the code appends only when the GM offers no forward jump (D-18, D-138)', async () => {
    // A thread with no deadline (so nothing stops the montage) opened before it; the montage narration
    // introduces nothing, so 92 days at the same place leave the story stale.
    const prepared = (seed: string): Session => {
      const s = session(seed);
      const st = applyEvents(REGISTRY, s.state, [{ type: 'threadOpened', key: 'tmp:t', title: 'The envoy', stakes: 'peace', entityRefs: [] }], { source: 'ai' }).state;
      return { ...s, state: st };
    };
    const gmJump = { label: 'Skip ahead a month', intent: { actionType: 'train' }, pacingHint: 'montage', spanDays: 31 };
    let checked = 0;
    for (let i = 0; i < 20 && checked === 0; i++) {
      // (b) The GM's choices have no forward jump: the code appends "Skip ahead: <top open thread>".
      const b = setup([{ callType: 'narrative', data: narrative() }]);
      const rb = await playTurn(b.deps, prepared(`after${i}`), montage(92));
      if (rb.record.draft.jump!.report.interrupted) continue; // a significant event: this seed is not stale
      const skip = rb.record.choices.at(-1)!;
      expect(skip.label).toBe('Skip ahead: The envoy');
      expect(skip.pacingHint).toBe('montage');
      expect(skip.spanDays).toBe(14);
      expect(rb.record.draft.report.some((n) => n.startsWith('staleness: appended'))).toBe(true);
      expect(rb.record.choices.filter((c) => c.label.startsWith('Skip ahead:'))).toHaveLength(1);

      // (a) Same seed, the GM's choices include a forward jump: the code appends nothing.
      const a = setup([{ callType: 'narrative', data: narrative([], [...narrativeInvestigate.choices, gmJump] as never) }]);
      const ra = await playTurn(a.deps, prepared(`after${i}`), montage(92));
      expect(ra.record.draft.jump!.report.interrupted).toBeNull();
      expect(ra.record.choices.map((c) => c.label)).toEqual([...narrativeInvestigate.choices.map((c) => c.label), 'Skip ahead a month']);
      expect(ra.record.draft.report.some((n) => n.startsWith('staleness'))).toBe(false);
      checked += 1;
    }
    expect(checked).toBe(1);
  });

  it('no Skip-ahead while settling in, or when a choice already jumps', async () => {
    const { deps } = setup([
      { callType: 'narrative', data: narrative() },
      { callType: 'narrative', data: narrative([], [...narrativeInvestigate.choices, { label: 'Train for a month', intent: { actionType: 'train' }, pacingHint: 'montage', spanDays: 30 }] as never) },
    ]);
    const s = session();
    const look: TurnInput = { kind: 'action', label: 'Look', intent: { actionType: 'investigate', targets: [], references: [], unknownNames: [] } as never };
    const r1 = await playTurn(deps, s, look);
    expect(r1.record.choices.some((c) => c.label.startsWith('Skip ahead'))).toBe(false);
    const t1 = r1.session.state;
    const later = { ...r1.session, state: { ...t1, clock: { ...t1.clock, now: { day: t1.clock.now.day + 30, second: 9 * 3600 } } } };
    const r2 = await playTurn(deps, later, look);
    expect(r2.record.choices.filter((c) => c.pacingHint === 'montage')).toHaveLength(1);
  });
});
