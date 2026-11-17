// M3 step 6: train / sleep / rest turns through the pipeline (one time writer, XP and meters), an
// unknown activity, the choice fast path for training, the action input, and the schema size cap.
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { toGeminiSchema } from '../../src/ai/jsonSchema';
import { SCHEMA_SIZE_CAP_CHARS } from '../../src/ai/models.config';
import { composeNarrativeSchema } from '../../src/ai/schemas/compose';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { TurnInput } from '../../src/turn/record';
import narrativeInvestigate from '../fixtures/ai/narrative-investigate.json';

const START = absDayFromDate({ year: -3661, month: 1, day: 1 });
const narrative = (events: unknown[] = []) => ({ ...narrativeInvestigate, events });

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

function session(overrides: Partial<GameState> = {}): Session {
  const state = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed: 'train',
    start: { day: START, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: START - 16 * 368, path: 'jedi', archetype: 'jediGuardian', mainFormId: 'shiiCho', secondFormId: 'soresu', trainingStartAge: 4, focusWeights: { shiiCho: 0.5, forceControl: 0.1 } },
    startingXp: { shiiCho: xpForLevel(30), forceControl: xpForLevel(22), forceSense: xpForLevel(20) },
    rank: 'padawan',
  });
  return { state: { ...state, ...overrides }, history: [], campaign: { campaignId: 'c1', name: 'Kael', createdAt: 'x', lastPlayedAt: 'x' } };
}

const action = (intent: Record<string, unknown>, label = 'Train'): TurnInput => ({
  kind: 'action',
  label,
  intent: { targets: [], references: [], unknownNames: [], ...intent } as never,
});

describe('training turns', () => {
  it('a train action: one narrative call, XP and meters from computeXp, the clock advanced once (no timeElapsed)', async () => {
    const { deps, provider } = setup([{ callType: 'narrative', data: narrative([{ type: 'timeElapsed', seconds: 600, reason: 'x' }]) }]);
    const s0 = session();
    const { session: s1, record } = await playTurn(deps, s0, action({ actionType: 'train', skillId: 'shiiCho', activity: { activityId: 'shiiChoBasics' }, requestedSpan: { amount: 2, unit: 'hours' } }));
    expect(provider.calls.map((c) => c.opts.callType)).toEqual(['narrative']);
    expect(record.draft.training?.ok).toBe(true);
    expect(s1.state.progression.skills['shiiCho']!.xp).toBeGreaterThan(s0.state.progression.skills['shiiCho']!.xp);
    expect(s1.state.progression.skills['strength']?.xp ?? 0).toBeGreaterThan(0);
    expect(s1.state.health.meters.p).toBeGreaterThan(0);
    expect(s1.state.clock.now.second).toBe(10 * 3600);
    // One time writer (D-30): the draft advanced time, so the AI's timeElapsed is refused.
    expect(JSON.stringify(provider.calls[0]!.opts.wireSchema)).not.toContain('timeElapsed');
    expect(record.rejected.some((r) => /timeElapsed/.test(r.reason))).toBe(true);
    const sent = provider.calls[0]!.messages.at(-1)!.text;
    expect(sent).toContain('Training: Shii-Cho basics, 2 hours');
    expect(sent).toContain('VALID SKILLS: strength');
    expect(sent).toContain('Skills by tier: Shii-Cho Apprentice');
  });

  it('an unknown activity is refused with a reason; nothing is trained and the draft advances no time', async () => {
    const { deps, provider } = setup([{ callType: 'narrative', data: narrative([{ type: 'timeElapsed', seconds: 600, reason: 'x' }]) }]);
    const s0 = session();
    const { session: s1, record } = await playTurn(deps, s0, action({ actionType: 'train', activity: { activityId: 'saberDance' } }));
    expect(record.draft.training).toEqual({ ok: false, activityId: 'saberDance', reason: 'unknown activity "saberDance" (no nearby activity is used)' });
    expect(s1.state.progression.skills).toEqual(s0.state.progression.skills);
    expect(record.draft.timeAdvanced).toBeNull();
    expect(JSON.stringify(provider.calls[0]!.opts.wireSchema)).toContain('timeElapsed');
    expect(s1.state.clock.now.second).toBe(8 * 3600 + 600);
    expect(provider.calls[0]!.messages.at(-1)!.text).toContain('Training refused by the engine');
  });

  it('a locked activity is refused (Shii-Cho advanced sequences need Shii-Cho 21... Ataru needs the form known)', async () => {
    const { deps } = setup([{ callType: 'narrative', data: narrative() }]);
    const { record } = await playTurn(deps, session(), action({ actionType: 'train', activity: { activityId: 'ataruBasics' } }));
    expect(record.draft.training).toMatchObject({ ok: false, reason: 'Ataru basics is locked: Ataru is not known yet' });
  });

  it('sleep: 8 hours resets the meters; rest recovers at the rest rates', async () => {
    const tired = session();
    const st = { ...tired.state, health: { ...tired.state.health, meters: { p: 4, m: 3, f: 1 } } };
    const { deps } = setup([
      { callType: 'narrative', data: narrative() },
      { callType: 'narrative', data: narrative() },
    ]);
    const rested = await playTurn(deps, { ...tired, state: st }, action({ actionType: 'rest', requestedSpan: { amount: 1, unit: 'hours' } }, 'Rest'));
    expect(rested.session.state.health.meters).toEqual({ p: 3.25, m: 2, f: 0 });
    const slept = await playTurn(deps, rested.session, action({ actionType: 'sleep', requestedSpan: { amount: 8, unit: 'hours' } }, 'Sleep'));
    expect(slept.session.state.health.meters).toEqual({ p: 0, m: 0, f: 0 });
    expect(slept.record.draft.applied.some((a) => a.event.type === 'sleepCompleted')).toBe(true);
  });

  it('a train choice expands to the skill default activity for 1 hour (no intent call)', async () => {
    const { deps, provider } = setup([{ callType: 'narrative', data: narrative() }]);
    const choice = { label: 'Practice levitation', intent: { actionType: 'train' as const, skillId: 'forceControl' } };
    const { record, session: s1 } = await playTurn(deps, session(), { kind: 'choice', choice });
    expect(provider.calls).toHaveLength(1);
    expect(record.draft.training).toMatchObject({ ok: true, card: { activityId: 'forceControlDrill', hours: 1, primaries: ['forceControl'] } });
    expect(s1.state.health.meters.f).toBeGreaterThan(0);
  });

  it('an invalid action intent fails before any call', async () => {
    const { deps, provider } = setup([]);
    await expect(playTurn(deps, session(), { kind: 'action', label: 'x', intent: { actionType: 'dance' } as never })).rejects.toThrow(/invalid action/);
    expect(provider.calls).toHaveLength(0);
  });
});

describe('schema size cap with the M3 events', () => {
  it('the largest narrative schema (pending beats, timeElapsed allowed) stays under the cap', () => {
    const s = session().state;
    const withBeat = { ...s, progression: { ...s.progression, tierBeatsPending: [{ id: 'beat:1', skillId: 'shiiCho', tier: 41, day: START }] } };
    const schemas = composeNarrativeSchema(REGISTRY, withBeat, { timeAdvancedByDraft: false });
    const json = JSON.stringify(toGeminiSchema(schemas.wire));
    expect(json).toContain('milestoneBeatAcknowledged');
    expect(json).toContain('emotionalEvent');
    expect(json.length).toBeLessThan(SCHEMA_SIZE_CAP_CHARS);
  });
});
