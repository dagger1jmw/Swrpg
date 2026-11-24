// The world-event tag network in real turns (M8 Phase A, D-466): the fixture stands in for the shipped network (empty in
// Phase A). A rolled check counts against the condition it is about; a montage stops on a galaxy-shaking event; the
// narrator is given what the engine decided, once.
import { describe, expect, it, vi } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import type * as WorldEventsConfig from '../../src/data/worldEvents.config';
import type * as WorldNetworkData from '../../src/data/worldNetwork';
import { absDayFromDate } from '../../src/engine/calendar';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { TurnInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';

vi.mock('../../src/data/worldNetwork', async (orig) => ({ ...(await orig<typeof WorldNetworkData>()), WORLD_NETWORK: (await import('../support/worldFixture')).FIXTURE }));
// The rolled world events are off, so only the timeline can stop a montage.
vi.mock('../../src/data/worldEvents.config', async (orig) => ({ ...(await orig<typeof WorldEventsConfig>()), WORLD_EVENT_CHANCE: { significant: 0, minor: 0 } }));

const SECRET = 'E.3655.strike#cond.secret';
const day = (month: number, d: number): number => absDayFromDate({ year: -3655, month, day: d });

function start(on: number, seed = 'net'): GameState {
  const state = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day: on, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: on - 25 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', secondFormId: 'ataru', trainingStartAge: 4 },
    rank: 'knight',
  });
  const s = applyEvents(REGISTRY, state, [{ type: 'locationIntroduced', name: 'Coruscant', kind: 'planet', region: 'Core Worlds', description: 'The capital.', moveHere: true }], { source: 'ai' }).state;
  // A lead recorded in play (D-468).
  return applyEvents(REGISTRY, s, [{ type: 'factLearned', aboutRef: 'Coruscant', fact: 'Strangers have been counting the patrols', importance: 'major' }], { source: 'ai' }).state;
}
const investigate = { actionType: 'investigate', targets: [], references: [], unknownNames: [] };

describe('a rolled action in a turn', () => {
  it('counts against the condition it is about, with the roll it already made', () => {
    const s = start(day(1, 1));
    const r = resolveTurn(REGISTRY, s, investigate as never);
    const rec = r.draft.applied.filter((a) => a.event.type === 'worldActionRecorded');
    expect(rec.length).toBe(1);
    expect(rec[0]!.event['total']).toBe(r.draft.checks[0]!.total);
    // The dice are the scene's own: the same stream with or without the network.
    expect(r.draft.checks.length).toBe(1);
  });

  it('is not recorded for an action no open condition is about', () => {
    const s = start(day(1, 1));
    const elsewhere = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', name: 'Alderaan', kind: 'planet', region: 'Core Worlds', description: 'x', moveHere: true }], { source: 'ai' }).state;
    expect(resolveTurn(REGISTRY, elsewhere, investigate as never).draft.applied.some((a) => a.event.type === 'worldActionRecorded')).toBe(false);
    expect(resolveTurn(REGISTRY, s, { ...investigate, actionType: 'rest' } as never).draft.applied.some((a) => a.event.type === 'worldActionRecorded')).toBe(false);
  });

  it('a deliberate effort over days breaks the condition (seeded)', () => {
    let s = start(day(1, 1));
    let days = 0;
    while (!s.world.network.tags[SECRET] && days < 60) {
      s = resolveTurn(REGISTRY, s, investigate as never).state;
      s = { ...s, clock: { ...s.clock, now: { ...s.clock.now, day: s.clock.now.day + 1 } } };
      days++;
    }
    expect(s.world.network.tags[SECRET]).toBeDefined();
    expect(days).toBeGreaterThan(1); // a medium guard is never one roll of narrow successes
  });
});

function setup(steps: FixtureStep[]): { deps: TurnDeps; provider: ReturnType<typeof createFixtureProvider> } {
  const provider = createFixtureProvider(steps);
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 17);
  return { provider, deps: { registry: REGISTRY, provider, router, storage: createMemoryStorage(), getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) } };
}
const told = { ...narrativeInvestigate, events: [] };
const montage: TurnInput = { kind: 'action', label: 'Montage', intent: { actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: 'montage', requestedSpan: { amount: 30, unit: 'days' } } as never };

describe('the narrator', () => {
  it('a montage stops on the strike, and the narration is given it once', async () => {
    const { deps, provider } = setup([{ callType: 'narrative', data: told }, { callType: 'narrative', data: told }, { callType: 'narrative', data: told }]);
    const session: Session = { state: start(day(3, 1)), history: [], campaign: { campaignId: 'c1', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
    const t = await playTurn(deps, session, montage);
    expect(t.session.state.clock.now.day).toBe(day(3, 10));
    expect(t.record.draft.jump!.report.interrupted?.reason).toBe('The strike');
    const sent = (i: number): string => JSON.stringify(provider.calls.filter((c) => c.opts.callType === 'narrative')[i]!.messages);
    expect(sent(0)).toMatch(/\[HAPPENS AS RECORDED\] The strike/);
    expect(t.session.state.world.network.events['E.3655.strike']!.toldTurn).toBe(t.session.state.meta.turn);
    const t2 = await playTurn(deps, t.session, { kind: 'choice', choice: { label: 'Wait', intent: { actionType: 'other' } } });
    expect(t2.record.rejected).toEqual([]);
    expect(sent(1)).not.toMatch(/HAPPENS AS RECORDED/);
  });
});
