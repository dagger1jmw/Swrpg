// Pass 5 issue 4 (D-270): the narrator's Yuuzhan Vong warrior fought at "+0.4 level" and was worth 0 XP. The whole path,
// through the turn pipeline with the narrator's replies as fixtures: the opening's npcIntroduced (no age, as the
// narrator sent it) and combatStarted, the fight begun at the next turn, resolved to the end, and the combat XP.
import { describe, expect, it } from 'vitest';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import type { DuelState } from '../../src/engine/duel';
import { selectNpcGen, selectNpcLevel } from '../../src/features/npcs/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import { testStartInput } from '../../src/turn/testStart';

const reply = (events: unknown[] = [], narrative = 'The fight runs its course on the rocky slope.') => ({
  narrative,
  choices: [
    { label: 'Draw your lightsaber and meet the charge', intent: { actionType: 'fight' } },
    { label: 'Look around the hillside', intent: { actionType: 'other' } },
  ],
  scene: { moodTags: ['tense'] },
  events,
});
/** The pass-5 opening, as the narrator sent it: no age; the warrior and the charge. */
const OPENING_EVENTS = [
  { type: 'npcIntroduced', key: 'tmp:1', name: 'Yuuzhan Vong Warrior', species: 'yuuzhanVong', faction: 'independent', role: 'soldier', description: 'A Yuuzhan Vong warrior clad in dark, glistening vonduun crab armor, brandishing a writhing amphistaff.' },
  { type: 'combatStarted', opponentRefs: ['tmp:1'], stakes: 'serious', terrainTags: ['unevenGround', 'looseRock'] },
];

function setup(steps: FixtureStep[]): TurnDeps {
  const storage = createMemoryStorage();
  const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
  const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
  const router = createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => 0 });
  let ms = Date.UTC(2026, 10, 20);
  return { registry: REGISTRY, provider: createFixtureProvider(steps), router, storage, getSettings, wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }) };
}

describe('the narrator\'s Yuuzhan Vong warrior, end to end (D-270)', () => {
  it.each(['vong-a', 'vong-b', 'vong-c', 'vong-d', 'vong-e'])('fights at its generated level and gives combat XP (campaign %s)', async (seed) => {
    const steps: FixtureStep[] = [{ callType: 'narrative', data: reply(OPENING_EVENTS) }, ...Array.from({ length: 8 }, () => ({ callType: 'narrative' as const, data: reply() }))];
    const deps = setup(steps);
    const input = testStartInput({ name: 'Daven Rook', rank: 'knight', age: 30, startDate: { year: 26, month: 1, day: 1 }, startSecond: DEFAULT_START_SECOND, scenario: 'A lone Yuuzhan Vong warrior in vonduun crab armor, amphistaff in hand, charges me.' });
    const created = await createCampaign(REGISTRY, deps.storage, input, { campaignId: seed, branchId: 'b' }, seed);
    let s: Session = { state: created.state, history: [], campaign: created.campaign };
    // The opening: the warrior is introduced and the fight is pending.
    s = (await playTurn(deps, s, { kind: 'opening', premise: '', scenario: input.test!.scenario! })).session;
    const npc = Object.values(s.state.npcs.byId).find((n) => n.name === 'Yuuzhan Vong Warrior')!;
    expect(s.state.combat.pending).not.toBeNull();
    const gen = selectNpcGen(s.state, npc.id)!;
    expect(gen.archetype).toBe('yuuzhanVongWarrior');
    const melee = selectNpcLevel(s.state, npc.id, 'melee');
    // A warrior of the caste is trained (pass 5: melee 0.7 to 3); the grade-1 dev warrior has 14.
    expect(melee).toBeGreaterThan(25);
    // The opening's choice begins the fight with the generated level.
    const first = await playTurn(deps, s, { kind: 'choice', choice: { label: 'Draw your lightsaber and meet the charge', intent: { actionType: 'fight' } } });
    s = first.session;
    // The choice is the first beat, not a question back (pass 5 issue 12: "combat input not understood").
    expect(first.record.draft.combat!.beat).not.toBe('clarify');
    expect(first.record.draft.report.join('\n')).not.toMatch(/not understood/);
    if (!s.state.combat.active) return; // the first beat decided it (rare); the level checks need the fight
    const fighter = (s.state.combat.active!.duel as DuelState).opponents[0]!;
    expect(fighter.skillId).toBe('melee');
    expect(fighter.level).toBeCloseTo(melee, 6);
    expect(fighter.weaponName).toBe('amphistaff');
    // Resolve to the end: a won fight gives combat XP (pass 5: "combat XP 0.00 (serious, won)").
    const t = await playTurn(deps, s, { kind: 'beat', label: 'Resolve to end', action: { action: 'resolve' } as never });
    const last = t.session.state.combat.last!;
    const xpLine = t.record.draft.report.find((x) => /^combat XP /.test(x)) ?? '';
    if (last.outcome === 'won') expect(Number(/combat XP ([\d.]+)/.exec(xpLine)![1])).toBeGreaterThan(0.5);
    else expect(xpLine).toMatch(/combat XP [\d.]+ \(serious, lost/);
  });
});
