// m8-ship-battles (D-517) through the pipeline: a battle turn with no big moment makes no AI call (the code's line or two);
// a big moment or the end sends the narrator the BATTLE block; while the battle goes on there are no story choices.
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { absDayFromDate } from '../../src/engine/calendar';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';

const START = absDayFromDate({ year: -3661, month: 1, day: 1 });

describe('battle turns through the pipeline', () => {
  it('quiet turns make no call; big moments are narrated from the BATTLE block; no story choices mid-battle', async () => {
    const provider = createFixtureProvider(Array.from({ length: 80 }, () => ({ data: narrativeInvestigate })));
    const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
    const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
    const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
    let ms = Date.UTC(2026, 10, 26);
    const requests: string[] = [];
    const deps: TurnDeps = { registry: REGISTRY, provider, router, storage: createMemoryStorage(), getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }), onRequest: (r) => requests.push(r.messages.map((m) => m.text).join('\n')) };
    const base = createInitialState<GameState>(REGISTRY, { campaignId: 'c', branchId: 'b', seed: 'bp', start: { day: START, second: 8 * 3600 }, character: { name: 'Kael', birthDay: START - 30 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'soresu', trainingStartAge: 4 }, rank: 'knight' });
    const state = applyEvents(REGISTRY, base, [{ type: 'shipBattleProposed', what: 'enemy: two Imperial Supremacy fighters; mine: Aurek' }], { source: 'dev' }).state;
    let session: Session = { state, history: [], campaign: { campaignId: 'c', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
    let quiet = 0;
    let loud = 0;
    for (let i = 0; i < 60 && session.state.battles.active; i++) {
      const before = requests.length;
      const r = await playTurn(deps, session, { kind: 'battle', label: 'Fly', orders: { manoeuvre: 'fly', shot: 'guns', snap: true } });
      session = r.session;
      const b = r.record.draft.battle!;
      expect(b).toBeDefined();
      if (b.quiet) {
        quiet++;
        expect(requests.length).toBe(before);
        expect(r.record.narrative).toBe(b.lines.join(' '));
      } else {
        loud++;
        expect(requests.length).toBeGreaterThan(before);
        expect(requests.at(-1)).toContain('BATTLE (resolved by the engine');
      }
      if (session.state.battles.active) expect(r.record.choices).toEqual([]);
    }
    expect(quiet).toBeGreaterThan(0);
    expect(loud).toBeGreaterThan(0);
  });
});
