import { LORE_TEST_DATE as TEST_START_DATE, LORE_TEST_YEAR as TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { calibrate, type TokenRatios } from '../../src/ai/tokenRatio';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { loadEnvelope } from '../../src/persist/envelope';
import { AUTOSAVE_SLOT, createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND, openingPending, resumeCampaign } from '../../src/turn/campaign';
import { playTurn, summarizeChapters, type DebugRequest, type Session, type TurnDeps } from '../../src/turn/pipeline';
import openingM2 from '../fixtures/ai/opening-m2.json';

function setup(steps: FixtureStep[]) {
  const provider = createFixtureProvider(steps);
  const storage = createMemoryStorage();
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog, ratios: {} as TokenRatios };
  const requests: DebugRequest[] = [];
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  let ms = Date.UTC(2026, 10, 16, 20, 0);
  const deps: TurnDeps = {
    registry: REGISTRY,
    provider,
    storage,
    getSettings,
    router: createModelRouter({
      getLists: () => getSettings().modelLists,
      getLimits: () => getSettings().limits,
      getUsage: () => store.usage,
      getQuota: () => store.quota,
      setQuota: (q) => (store.quota = q),
      now: () => ms,
    }),
    wallClock: () => {
      ms += 1000;
      return { ms, iso: new Date(ms).toISOString() };
    },
    getTokenRatios: () => store.ratios,
    recordTokenRatio: (model, chars, tokens) => (store.ratios = calibrate(store.ratios, model, chars, tokens)),
    onRequest: (r) => requests.push(r),
  };
  return { provider, storage, deps, requests, store };
}

const newSession = (deps: TurnDeps): Promise<Session> =>
  createCampaign(
    deps.registry,
    deps.storage,
    { name: 'Kael Varn', birthDate: { year: TEST_YEAR - 14, month: 3, day: 4 }, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND },
    { campaignId: 'camp-m2', branchId: 'branch-1' },
    '2026-11-16T00:00:00.000Z',
  );

const quiet = (events: unknown[] = []) => ({
  narrative: 'Time passes in the Temple.',
  choices: [
    { label: 'Wait', intent: { actionType: 'rest' } },
    { label: 'Look around', intent: { actionType: 'investigate' } },
  ],
  scene: { moodTags: ['quiet'], presentNpcRefs: ['npc:orren-vash'] },
  events: [{ type: 'timeElapsed', seconds: 60, reason: 'a moment' }, ...events],
});
const restChoice = { label: 'Wait', intent: { actionType: 'rest' as const } };

describe('interrupted opening (D-97)', () => {
  it('a campaign whose opening never committed is detected and keeps its premise', async () => {
    const { deps } = setup([]);
    await createCampaign(deps.registry, deps.storage, { name: 'Kael', birthDate: { year: TEST_YEAR - 14, month: 3, day: 4 }, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND, premise: ' A Padawan. ' }, { campaignId: 'c-open', branchId: 'b' }, 'now');
    const resumed = await resumeCampaign(deps.registry, deps.storage);
    expect(resumed && 'session' in resumed && openingPending(resumed.session)).toBe(true);
    expect(resumed && 'session' in resumed && resumed.session.campaign.premise).toBe('A Padawan.');
  });
});

describe('M2 pipeline: memory and lore', () => {
  it('the GM introduces people, places and threads; unknown names go to review; canon NPCs are linked', async () => {
    const { deps } = setup([{ callType: 'narrative', data: openingM2 }]);
    const { session, record } = await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' });
    expect(record.rejected).toEqual([]);
    const s = session.state;
    expect(Object.keys(s.npcs.byId).sort()).toEqual(['npc:orren-vash', 'npc:zym']);
    expect(s.npcs.byId['npc:zym']!.canonId).toBe('lore:zym');
    expect(s.locations.currentId).toBe('loc:jedi-temple');
    expect(Object.keys(s.threads.byId)).toEqual(['thread:the-missing-holocron']);
    expect(s.pacing.scene.presentNpcIds).toEqual(['npc:orren-vash', 'npc:zym']);
    expect(s.memory.review.map((r) => r.name)).toEqual(['Tarsk the stranger']);
    expect(record.turn).toBe(1);
  });

  it('an intent name the reply introduces never reaches review; an open name that later matches is resolved (D-94)', async () => {
    const { deps } = setup([
      { callType: 'narrative', data: { ...quiet(), scene: { moodTags: [], presentNpcRefs: [] } } },
      { callType: 'intent', data: { actionType: 'travel', targets: [], references: [], unknownNames: ['Dantooine', 'Tarsk'] } },
      { callType: 'narrative', data: { ...quiet([{ type: 'locationIntroduced', key: 'tmp:d', name: 'Dantooine', kind: 'planet', region: 'Outer Rim', description: '', moveHere: true }]), scene: { moodTags: [], presentNpcRefs: [] } } },
      { callType: 'intent', data: { actionType: 'dialogue', targets: [], references: [], unknownNames: [] } },
      { callType: 'narrative', data: { ...quiet([{ type: 'npcIntroduced', key: 'tmp:t', name: 'Tarsk', species: 'human', faction: 'civilian', role: 'merchant', description: '' }]), scene: { moodTags: [], presentNpcRefs: [] } } },
    ]);
    let s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    s = (await playTurn(deps, s, { kind: 'typed', text: 'We fly to Dantooine to find Tarsk' })).session;
    expect(s.state.memory.review.map((r) => [r.name, r.status])).toEqual([['Tarsk', 'open']]);
    s = (await playTurn(deps, s, { kind: 'typed', text: 'I look around' })).session;
    expect(s.state.memory.review[0]).toMatchObject({ name: 'Tarsk', status: 'mapped', entityId: 'npc:tarsk' });
  });

  it('lore for the current era reaches the GM, with a per-section token report', async () => {
    const { deps, requests } = setup([{ callType: 'narrative', data: openingM2 }]);
    const { record } = await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' });
    const text = requests[0]!.messages.at(-1)!.text;
    expect(text).toContain('Great Galactic War');
    expect(text).toContain('Blockade of the Hydian Way begins');
    const report = record.context!.narrative!;
    expect(report.sections.map((x) => x.name)).toEqual(['gmRules', 'state', 'recentTurns', 'memory', 'lore', 'arc', 'resolved', 'input', 'schema']);
    expect(report.actualInputTokens).toBe(100); // fixture usage
    expect(report.sections.find((x) => x.name === 'lore')!.included.map((i) => i.id)).toContain('tl:great-galactic-war:overview');
  });

  it('a later turn mentioning an earlier NPC pulls their memory into the request', async () => {
    const { deps, requests } = setup([
      { callType: 'narrative', data: openingM2 },
      ...Array.from({ length: 29 }, () => ({ callType: 'narrative' as const, data: { ...quiet(), scene: { moodTags: ['quiet'], presentNpcRefs: [] } } })),
      // turn 30 closes the chapter (30 turns): its summary call
      { callType: 'summary', data: { chapterSummary: 'Quiet days at the Temple.', arcSummary: 'A youngling waits.' } },
      ...Array.from({ length: 11 }, () => ({ callType: 'narrative' as const, data: { ...quiet(), scene: { moodTags: ['quiet'], presentNpcRefs: [] } } })),
      { callType: 'intent', data: { actionType: 'dialogue', targets: ['Master Orren Vash'], references: [], unknownNames: [] } },
      { callType: 'narrative', data: quiet() },
    ]);
    let s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    for (let i = 0; i < 40; i++) s = (await playTurn(deps, s, { kind: 'choice', choice: restChoice })).session;
    // 40 quiet turns later, nobody present: the fact is old and unrelated to the scene.
    const before = requests.at(-1)!.report.sections.find((x) => x.name === 'memory')!;
    expect(before.included.map((i) => i.id)).not.toContain('fact:1');
    const r = await playTurn(deps, s, { kind: 'typed', text: 'I find Master Orren and ask about Alderaan' });
    const req = requests.at(-1)!;
    expect(req.callType).toBe('narrative');
    expect(req.messages.at(-1)!.text).toContain('Orren lost his first apprentice at the Battle of Alderaan.');
    const mem = r.record.context!.narrative!.sections.find((x) => x.name === 'memory')!;
    expect(mem.included.find((i) => i.id === 'fact:1')!.note).toContain('npc:orren-vash');
    expect(r.record.draft.intent!.targets).toEqual(['npc:orren-vash']);
  });

  it('a chapter closes on a scene end after 8 turns and gets one summary call, committed on its own', async () => {
    const { deps, provider, storage } = setup([
      { callType: 'narrative', data: openingM2 },
      ...Array.from({ length: 6 }, () => ({ callType: 'narrative' as const, data: quiet() })),
      { callType: 'narrative', data: quiet([{ type: 'sceneEnded', reason: 'the lesson is over' }]) },
      { callType: 'summary', data: { chapterSummary: 'Kael met Master Orren Vash (npc:orren-vash) at the Temple.', arcSummary: 'A youngling begins.' } },
    ]);
    let s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    for (let i = 0; i < 6; i++) s = (await playTurn(deps, s, { kind: 'choice', choice: restChoice })).session;
    const last = await playTurn(deps, s, { kind: 'choice', choice: restChoice });
    // IDs share one counter: fact:1, review:2, chapter:3.
    expect(last.record.chapterClosed).toMatchObject({ chapterId: 'chapter:3', turnRange: [0, 8] });
    expect(provider.calls.filter((c) => c.opts.callType === 'summary')).toHaveLength(1);
    expect(last.summaries).toMatchObject([{ chapterId: 'chapter:3', ok: true }]);
    const ch = last.session.state.memory.chapters[0]!;
    expect(ch).toMatchObject({ status: 'closed', summary: 'Kael met Master Orren Vash (npc:orren-vash) at the Temple.', entityIds: ['npc:orren-vash', 'npc:zym'] });
    expect(last.session.state.memory.arc!.text).toBe('A youngling begins.');
    const saved = loadEnvelope<GameState>(REGISTRY, await storage.loadSnapshot(AUTOSAVE_SLOT));
    expect(saved.ok && saved.state.memory.chapters[0]!.status).toBe('closed');
    expect(storage.transcript).toHaveLength(8); // the summary commit adds no transcript entry
    const summaryText = provider.calls.find((c) => c.opts.callType === 'summary')!.messages[0]!.text;
    expect(summaryText).toContain('Turn 8');
    expect(summaryText).toContain('npc:orren-vash: Master Orren Vash');
  });

  it('a failed summary leaves the chapter summaryPending with no automatic retry; the manual retry works', async () => {
    const { deps, provider } = setup([
      { callType: 'narrative', data: openingM2 },
      ...Array.from({ length: 6 }, () => ({ callType: 'narrative' as const, data: quiet() })),
      { callType: 'narrative', data: quiet([{ type: 'sceneEnded', reason: 'done' }]) },
      // A 4xx: not an overload, so no automatic retry (D-240 retries 5xx and timeouts).
      { callType: 'summary', error: { kind: 'http', status: 400 } },
      { callType: 'summary', data: { chapterSummary: 'Recovered.', arcSummary: 'Arc.' } },
    ]);
    let s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    for (let i = 0; i < 7; i++) s = (await playTurn(deps, s, { kind: 'choice', choice: restChoice })).session;
    expect(s.state.memory.chapters[0]!.status).toBe('summaryPending');
    expect(provider.calls.filter((c) => c.opts.callType === 'summary')).toHaveLength(1);
    const retried = await summarizeChapters(deps, s);
    expect(retried.outcomes).toMatchObject([{ ok: true }]);
    expect(retried.session.state.memory.chapters[0]!.summary).toBe('Recovered.');
  });

  it('moving to another planet closes the chapter before the arrival turn', async () => {
    const { deps } = setup([
      { callType: 'narrative', data: openingM2 },
      { callType: 'narrative', data: quiet() },
      {
        callType: 'narrative',
        data: quiet([
          { type: 'locationIntroduced', key: 'tmp:1', name: 'Tython', kind: 'planet', region: 'Deep Core', description: '', moveHere: true },
        ]),
      },
      { callType: 'summary', data: { chapterSummary: 'Temple days.', arcSummary: 'Arc.' } },
    ]);
    let s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    s = (await playTurn(deps, s, { kind: 'choice', choice: restChoice })).session;
    const r = await playTurn(deps, s, { kind: 'choice', choice: restChoice });
    expect(r.record.chapterClosed).toMatchObject({ turnRange: [0, 2] });
    expect(r.session.state.memory.current.startTurn).toBe(3);
  });
});
