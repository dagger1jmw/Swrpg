// m8-ground (D-522) through the pipeline: a ground phase with no big moment makes no AI call (the code's lines); a big moment,
// the battle's start and its end send the narrator the BATTLE block; the narrate-every-turn setting sends every phase; no story
// choices while the battle goes on.
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';
import { base, meet } from '../support/schemaSituations';

function setup(every: boolean): { deps: TurnDeps; requests: string[]; session: Session } {
  const provider = createFixtureProvider(Array.from({ length: 80 }, () => ({ data: narrativeInvestigate })));
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30), narrateEveryBattleTurn: every });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 26);
  const requests: string[] = [];
  const deps: TurnDeps = { registry: REGISTRY, provider, router, storage: createMemoryStorage(), getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }), onRequest: (r) => requests.push(r.messages.map((m) => m.text).join('\n')) };
  const s0 = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
  const state = applyEvents(REGISTRY, s0, [{ type: 'groundBattlePlanned', site: 'the Aldera plains', enemy: 'five Sith infantry, armour, artillery', ours: 'four clone infantry, armour, artillery' }], { source: 'ai' }).state;
  return { deps, requests, session: { state, history: [], campaign: { campaignId: 'c', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } } };
}

describe('ground battle turns through the pipeline', () => {
  it('quiet phases make no call; the start, big moments and the end are narrated from the BATTLE block; no story choices', async () => {
    const t = setup(false);
    let session = t.session;
    const begin = await playTurn(t.deps, session, { kind: 'battle', label: 'Begin the battle', ground: { act: 'begin' } });
    session = begin.session;
    expect(t.requests.at(-1)).toContain('BATTLE (resolved by the engine');
    expect(t.requests.at(-1)).toContain('GROUND BATTLE');
    let quiet = 0;
    let loud = 0;
    for (let i = 0; i < 14 && session.state.battles.ground; i++) {
      const before = t.requests.length;
      const r = await playTurn(t.deps, session, { kind: 'battle', label: 'Next phase', ground: { act: 'order' } });
      session = r.session;
      const b = r.record.draft.battle!;
      if (b.quiet) {
        quiet++;
        expect(t.requests.length).toBe(before);
        expect(r.record.narrative).toBe(b.lines.join(' '));
      } else {
        loud++;
        expect(t.requests.length).toBeGreaterThan(before);
      }
      if (session.state.battles.ground) expect(r.record.choices).toEqual([]);
    }
    expect(quiet).toBeGreaterThan(0);
    expect(loud).toBeGreaterThan(0);
    expect(session.state.battles.ground).toBeNull();
  });
  it('the narrate-every-turn setting sends every phase to the narrator', async () => {
    const t = setup(true);
    let session = (await playTurn(t.deps, t.session, { kind: 'battle', label: 'Begin', ground: { act: 'begin' } })).session;
    for (let i = 0; i < 4 && session.state.battles.ground; i++) {
      const before = t.requests.length;
      session = (await playTurn(t.deps, session, { kind: 'battle', label: 'Next phase', ground: { act: 'order' } })).session;
      expect(t.requests.length).toBeGreaterThan(before);
    }
  });
});
