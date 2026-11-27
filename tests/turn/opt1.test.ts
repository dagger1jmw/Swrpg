// opt-1 (reports/opt-1.md; D-529 to D-534): the cost and speed fixes. Plain words for role, faction, minion kind, terrain and a
// choice's skill (A1, B2); traitMoment's moments filtered (A2); the static rules with their part and the ID floor (B); the request's
// stable text first, the history in steps, the brief lore, the fight's rules trimmed, the typed shortcuts (C); Flash for the big
// moments (D); the JSON allowance (E).
import { LORE_TEST_DATE as TEST_START_DATE, LORE_TEST_YEAR as TEST_YEAR } from '../support/dates';
import { describe, expect, it } from 'vitest';
import { CONTEXT_CAPS, HISTORY_STEP } from '../../src/ai/context.config';
import { createModelRouter, routedList, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider, type FixtureStep } from '../../src/ai/fixtureProvider';
import { toGeminiSchema } from '../../src/ai/jsonSchema';
import { FLASH_ROUTING } from '../../src/ai/models.config';
import { composeNarrativeSchema } from '../../src/ai/schemas/compose';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { calibrate, makeEstimator, type TokenRatios } from '../../src/ai/tokenRatio';
import { EMPTY_USAGE_LOG, recordRequest, summarizeUsage, type UsageLog } from '../../src/ai/usage';
import { factionFromWords, minionKindFromWords, roleFromWords, skillFromWords, terrainFromWords } from '../../src/data/entityWords';
import { momentsThatCanFire } from '../../src/features/traits';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createMemoryStorage } from '../../src/persist/storage';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { buildNarrativeRequest, historyWindow, loreMode, partsFor, stateBlock, turnRules, worldOf } from '../../src/turn/context';
import { expandChoice } from '../../src/turn/expandChoice';
import { jsonAllowance, JSON_ALLOWANCE } from '../../src/turn/outputBudget';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import { premiumReason } from '../../src/turn/premium';
import type { TurnInput, TurnRecord } from '../../src/turn/record';
import { resolveTurn, type TurnDraft } from '../../src/turn/resolve';
import { typedShortcut } from '../../src/turn/shortcuts';
import { base, lateCampaign, meet, ownShip, situations, traitsLive } from '../support/schemaSituations';
import openingM2 from '../fixtures/ai/opening-m2.json';

const est = makeEstimator(4);
const ai = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'ai' });
const typed = (text: string): TurnInput => ({ kind: 'typed', text });
const draftOf = (s: GameState, text = 'I look about'): { draft: TurnDraft; state: GameState } => resolveTurn(REGISTRY, s, null, { text });
const rec = (turn: number, s: GameState, world: string | null | undefined = worldOf(s), size = 2200): TurnRecord =>
  ({ turn, input: { kind: 'typed', text: `t${turn}` }, narrative: 'x'.repeat(size), draft: { applied: [] }, applied: [], clockAfter: { day: s.clock.now.day, second: 0 }, ...(world !== undefined ? { worldAfter: world } : {}) }) as unknown as TurnRecord;

describe('A1, B2: plain words the code resolves', () => {
  it('roles, factions, minion kinds, terrain and skills: an exact id or name, then the word lists; nothing for an unknown word', () => {
    expect([roleFromWords('Jedi Master'), roleFromWords('padawan'), roleFromWords('Sith Lord'), roleFromWords('a Republic trooper'), roleFromWords('Captain of the guard'), roleFromWords('bounty hunter'), roleFromWords('senator'), roleFromWords('dark jedi'), roleFromWords('swamp oracle')]).toEqual(['jediMaster', 'padawan', 'sithLord', 'soldier', 'officer', 'bountyHunter', 'politician', 'darkJedi', null]);
    expect([factionFromWords('the Republic'), factionFromWords('Sith Empire'), factionFromWords('Imperial'), factionFromWords('the Jedi Order'), factionFromWords('Black Sun'), factionFromWords('civilian'), factionFromWords('gungans')]).toEqual(['republic', 'sithEmpire', 'sithEmpire', 'jediOrder', 'underworld', 'civilian', null]);
    expect([minionKindFromWords('Sith troopers'), minionKindFromWords('thug'), minionKindFromWords('B1 battle droids'), minionKindFromWords('Mandalorian warriors'), minionKindFromWords('swoop gang'), minionKindFromWords('rancor'), minionKindFromWords('xyzzy')]).toEqual(['sithTrooper', 'thug', 'battleDroid', 'mandalorian', 'thug', 'beast', null]);
    expect([terrainFromWords('confined space'), terrainFromWords('a narrow corridor'), terrainFromWords('high ground'), terrainFromWords('crates'), terrainFromWords('zero-g'), terrainFromWords('purple haze')]).toEqual(['confined', 'confined', 'highGround', 'crates', 'zeroGravity', null]);
    expect([skillFromWords('Force Push'), skillFromWords('forcePush'), skillFromWords('Dun Moch'), skillFromWords('Tràkata'), skillFromWords('stealth'), skillFromWords('Perception')]).toEqual(['forcePush', 'forcePush', 'dunMoch', 'trakata', 'stealth', null]);
  });

  it('npcIntroduced and combatStarted take the words; an unread minion kind fights as the default and is queued, an unread terrain is left out and queued', () => {
    const s = base();
    const n = ai(s, [{ type: 'npcIntroduced', name: 'Lt Vara Sel', faction: 'the Republic', role: 'lieutenant', description: '' }]).state;
    expect(Object.values(n.npcs.byId).find((x) => x.name === 'Lt Vara Sel')).toMatchObject({ factionId: 'republic', role: 'officer' });
    const r = ai(s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'Sith troopers', count: 3 }, { kind: 'glowing wisps', count: 2 }], stakes: 'serious', terrainTags: ['a narrow corridor', 'purple haze'] }]);
    expect(r.rejected).toEqual([]);
    expect(r.state.combat.pending!.minionGroups.map((g) => g.kind)).toEqual(['sithTrooper', 'thug']);
    expect(r.state.combat.pending!.terrainTags).toEqual(['confined']);
    expect(r.state.memory.review.map((i) => [i.kind, i.name])).toEqual([['minion', 'glowing wisps'], ['terrain', 'purple haze']]);
  });

  it('a choice names its skill in words; an unknown word stays as it was written (an unknown skill, as an unknown id was)', () => {
    const resolve = () => null;
    expect(expandChoice({ label: 'Sneak past', intent: { actionType: 'investigate', skillId: 'Stealth' } }, resolve).intent.skillId).toBe('stealth');
    expect(expandChoice({ label: 'Drill', intent: { actionType: 'train', skillId: 'Soresu' } }, resolve).intent.activity).toBeDefined();
    expect(expandChoice({ label: 'Look', intent: { actionType: 'investigate', skillId: 'Perception' } }, resolve).intent.skillId).toBe('Perception');
  });
});

describe('A: the schema sizes (20 situations)', () => {
  it('the core at its largest is at most about half the cap, every situation at most 75%', () => {
    const size = (s: GameState, t: Parameters<typeof composeNarrativeSchema>[2]) => JSON.stringify(toGeminiSchema(composeNarrativeSchema(REGISTRY, s, t).wire)).length;
    for (const x of situations()) {
      expect(size(x.state, x.turn), x.name).toBeLessThanOrEqual(12_000 * 0.75);
      expect(size(x.state, { ...x.turn, parts: new Set(['core']) }), `${x.name} core`).toBeLessThanOrEqual(12_000 * 0.5);
    }
  });
});

describe('A2: traitMoment sends only the moments that can fire', () => {
  const moments = (s: GameState): string[] | null => {
    const w = toGeminiSchema(composeNarrativeSchema(REGISTRY, s, { timeAdvancedByDraft: false }).wire) as { properties: { events: { items: { anyOf?: { properties: Record<string, { enum?: string[] }> }[] } } } };
    const tm = (w.properties.events.items.anyOf ?? []).find((x) => x.properties['type']!.enum![0] === 'traitMoment');
    return tm ? tm.properties['moment']!.enum! : null;
  };
  it('no traits held: the scars not yet held (a brush with the dark side only on a Force path); a held scar or trait changes the list', () => {
    const s = traitsLive(base());
    expect(moments(s)).toEqual(['betrayed', 'massacre', 'familyLost', 'imprisoned', 'darkBrush', 'firstKill', 'publicFailure', 'disaster', 'exiled']);
    expect(moments(traitsLive(base({ path: 'career' })))).not.toContain('darkBrush');
    const held = { ...s, traits: { ...s.traits, held: [{ id: 'betrayed', since: 0, source: 'event' }, { id: 'idealistic', since: 0, source: 'creation' }, { id: 'rival', since: 0, source: 'creation' }] } } as unknown as GameState;
    expect(momentsThatCanFire(held)).not.toContain('betrayed');
    expect(momentsThatCanFire(held)).toEqual(expect.arrayContaining(['idealBroken', 'rivalOutdid']));
    // A moment the wire leaves out still validates when sent (nothing changes: the handler's own answer).
    expect(ai(s, [{ type: 'traitMoment', moment: 'idealBroken' }]).rejected.length).toBe(1);
  });
});

describe('B: the state block', () => {
  it('the SHIPS, DROIDS, TACTICS and ECONOMY rules go with their part, not in the state block; VALID SKILLS only with training', () => {
    const s = ownShip(base());
    const { draft, state } = draftOf(s, 'I check the hyperdrive');
    const parts = partsFor(state, draft, typed('I check the hyperdrive'));
    const block = stateBlock(state, est, CONTEXT_CAPS.state, [], '', { world: false, validSkills: parts.has('training') }).text;
    for (const rule of ['SHIPS rule', 'DROIDS rule', 'TACTICS rule', 'ECONOMY rule', 'VALID SKILLS']) expect(block).not.toContain(rule);
    expect(block).toContain('Ships owned:');
    const rules = turnRules(state, draft, typed('I check the hyperdrive'), parts);
    expect(rules.ids).toContain('ships');
    expect(rules.ids).not.toContain('economy');
    const train = draftOf(base(), 'I drill Soresu');
    const tp = new Set(['core', 'training']);
    expect(turnRules(train.state, train.draft, typed('I drill Soresu'), tp).ids).toContain('tactics');
    expect(stateBlock(train.state, est, CONTEXT_CAPS.state, [], '', { world: false, validSkills: true }).text).toContain('VALID SKILLS');
    expect(turnRules(base(), draftOf(base()).draft, typed('I buy a droid'), new Set(['core', 'goods'])).ids).toEqual(expect.arrayContaining(['economy', 'droids']));
  });

  it('the focus IDs always fit, the master included when absent; the rest fill the cap', () => {
    const s0 = lateCampaign(situations().find((x) => x.name === 'a full story, alone')!.state);
    const master = meet(s0, [{ name: 'Master Orren Vash', role: 'jediMaster', faction: 'jediOrder' }]);
    const id = Object.values(master.npcs.byId).find((n) => n.name === 'Master Orren Vash')!.id;
    const s = { ...master, ranks: { ...master.ranks, masterId: id }, pacing: { ...master.pacing, scene: { ...master.pacing.scene, presentNpcIds: [] } } } as GameState;
    const req = buildNarrativeRequest(s, draftOf(s).draft, typed('I think it over'), [], { model: 'm', ratio: 4 });
    const st = req.report.sections.find((x) => x.name === 'state')!;
    const focus = [id, ...Object.values(s.threads.byId).filter((t) => t.status === 'open').map((t) => t.id)];
    for (const f of focus) expect(st.included.map((i) => i.id), f).toContain(f);
    expect(st.dropped.length).toBeGreaterThan(0);
  });
});

describe('C: the request', () => {
  it('stable text first: the same system text every turn, WORLD and LORE before the history, the turn\'s rules after it', () => {
    const x = situations().find((s) => s.name === 'a fight about to start')!;
    const calm = situations().find((s) => s.name === 'a conversation')!;
    const a = buildNarrativeRequest(x.state, draftOf(x.state).draft, typed('I wait'), [], { model: 'm', ratio: 4 });
    const b = buildNarrativeRequest(calm.state, draftOf(calm.state).draft, typed('Hello'), [], { model: 'm', ratio: 4 });
    expect(a.system).toBe(b.system);
    expect(a.messages[0]!.text).toMatch(/^WORLD/);
    expect(a.messages[0]!.text).toContain('LORE');
    expect(a.messages.at(-1)!.text).toMatch(/^RULES FOR THIS TURN/);
    expect(a.messages.at(-1)!.text).toContain('Combat (follow exactly)');
    expect(b.messages.at(-1)!.text).not.toContain('Combat (follow exactly)');
  });

  it('the history slides in steps: it opens with a turn 1 more than a multiple of the step, the same for several calls', () => {
    const s = base();
    for (const step of [HISTORY_STEP, 4]) {
      const starts = [30, 31, 32, 33].map((n) => historyWindow(Array.from({ length: n }, (_, i) => rec(i + 1, s)), 8000, est, step).fromTurn!);
      for (const t of starts) expect((t - 1) % step).toBe(0);
      expect(new Set(starts).size).toBeLessThanOrEqual(Math.ceil(4 / step) + 1);
    }
    // Early in a campaign the window is whole.
    expect(historyWindow([rec(1, s), rec(2, s)], 8000, est).fromTurn).toBe(1);
  });

  it('lore: in full on the opening, a new year, a new world or when asked; otherwise brief with one line for the year', () => {
    const s = base();
    const prev = [rec(1, s)];
    expect(loreMode(s, { kind: 'opening', premise: '' }, prev, '').brief).toBe(false);
    expect(loreMode(s, typed('I walk'), [], 'I walk').brief).toBe(false);
    expect(loreMode(s, typed('I walk'), [rec(1, s, 'loc:elsewhere')], 'I walk').why).toBe('a new world');
    expect(loreMode(s, typed('What news of the war?'), prev, 'What news of the war?').why).toBe('the player asks');
    expect(loreMode(s, typed('I walk'), prev, 'I walk').brief).toBe(true);
    const full = buildNarrativeRequest(s, draftOf(s).draft, typed('I walk'), [], { model: 'm', ratio: 4 });
    const brief = buildNarrativeRequest(s, draftOf(s).draft, typed('I walk'), prev, { model: 'm', ratio: 4 });
    const lore = (r: typeof full) => r.report.sections.find((x) => x.name === 'lore')!.tokens;
    expect(lore(brief)).toBeLessThan(lore(full));
    expect(brief.messages[0]!.text).toMatch(/This year \(3,661 BBY\) on record: /);
  });

  it('a fight\'s rules fit gmRules\' cap; the long-passage, end and hold rules only when the fight needs them', () => {
    const x = situations().find((s) => s.name === 'a fight about to start')!;
    const { draft, state } = draftOf(x.state, 'I wait');
    const req = buildNarrativeRequest(state, draft, typed('I wait'), [], { model: 'm', ratio: 4 });
    const g = req.report.sections.find((s) => s.name === 'gmRules')!;
    expect(g.tokens).toBeLessThanOrEqual(CONTEXT_CAPS.gmRules);
    expect(g.included[0]!.id).not.toMatch(/combat-long|combat-end|combatStarted/);
  });

  it('typed shortcuts: a few whole phrases, never in a fight; anything else goes to the intent call', () => {
    expect(typedShortcut(base(), 'I wait.')?.actionType).toBe('rest');
    expect(typedShortcut(base(), 'Continue')?.actionType).toBe('other');
    expect(typedShortcut(base(), 'I wait for him to leave')).toBeNull();
    expect(typedShortcut(situations().find((s) => s.name === 'a fight about to start')!.state, 'I wait')).toBeNull();
  });
});

describe('D, E: the stronger model for the big moments; the JSON allowance', () => {
  it('the routing: a big moment tries Flash first, an ordinary turn has it last; off, the list as set', () => {
    const list = ['gemini-3.8-flash', 'gemini-3.5-flash-lite'];
    const on = { on: true, model: 'gemini-3.8-flash' };
    expect(routedList(list, 'narrative', true, on)).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    expect(routedList(list, 'narrative', false, on)).toEqual(['gemini-3.5-flash-lite', 'gemini-3.8-flash']);
    expect(routedList(['gemini-3.5-flash-lite'], 'summary', true, on)).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash-lite']);
    expect(routedList(list, 'narrative', false, { ...on, on: false })).toEqual(list);
    expect(routedList(['gemini-3.5-flash-lite'], 'intent', true, on)).toEqual(['gemini-3.5-flash-lite']);
  });

  it('the big moments are the code\'s: the opening, a fight\'s end, a battle\'s end, a time skip, a major world event', () => {
    const s = base();
    const d = draftOf(s).draft;
    expect(premiumReason(s, d, { kind: 'opening', premise: '' })).toBe('the campaign opening');
    expect(premiumReason(s, d, typed('hi'))).toBeNull();
    expect(premiumReason(s, { ...d, combat: { ended: { outcome: 'won' }, session: null } } as unknown as TurnDraft, typed('x'))).toBe("a fight's end");
    expect(premiumReason(s, { ...d, combat: { ended: { outcome: 'won' }, session: { won: 1 } } } as unknown as TurnDraft, typed('x'))).toBeNull();
    expect(premiumReason(s, { ...d, battle: { wrap: 'The battle is won.' } } as unknown as TurnDraft, typed('x'))).toBe("a battle's end");
    expect(premiumReason(s, { ...d, pacingLevel: 'timeSkip' } as TurnDraft, typed('x'))).toBe('a time skip');
  });

  it('the JSON allowance: an opening or an arrival gets more than an ordinary turn', () => {
    const d = draftOf(base()).draft;
    expect(jsonAllowance(d, { kind: 'opening', premise: '' }, new Set())).toBe(JSON_ALLOWANCE.opening);
    expect(jsonAllowance({ ...d, intent: { ...(d.intent ?? {}), actionType: 'travel' } } as TurnDraft, typed('x'), new Set())).toBe(JSON_ALLOWANCE.arrival);
    expect(jsonAllowance(d, typed('x'), new Set(['core']))).toBe(JSON_ALLOWANCE.base);
    expect(jsonAllowance(d, typed('x'), new Set(['core', 'command']))).toBe(JSON_ALLOWANCE.command);
  });

  it('the usage log counts replies cut short and input served from the cache', () => {
    let log: UsageLog = EMPTY_USAGE_LOG;
    const now = Date.UTC(2026, 10, 26, 20);
    log = recordRequest(log, 'm', 1000, now, { truncated: true, cachedTokens: 600 });
    log = recordRequest(log, 'm', 1000, now + 1000);
    expect(summarizeUsage(log, 'm', {}, now + 2000)).toMatchObject({ requestsToday: 2, truncatedToday: 1, cachedTokensToday: 600 });
  });
});

describe('D, C5 in the pipeline', () => {
  function setup(steps: FixtureStep[], routing = true) {
    const provider = createFixtureProvider(steps);
    const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog, ratios: {} as TokenRatios };
    const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
    let ms = Date.UTC(2026, 10, 16, 20, 0);
    const deps: TurnDeps = {
      registry: REGISTRY,
      provider,
      storage: createMemoryStorage(),
      getSettings,
      router: createModelRouter({
        getLists: () => getSettings().modelLists,
        getLimits: () => getSettings().limits,
        getUsage: () => store.usage,
        getQuota: () => store.quota,
        setQuota: (q) => (store.quota = q),
        now: () => ms,
        getRouting: () => ({ on: routing, model: FLASH_ROUTING.model }),
      }),
      wallClock: () => {
        ms += 1000;
        return { ms, iso: new Date(ms).toISOString() };
      },
      getTokenRatios: () => store.ratios,
      recordTokenRatio: (model, chars, tokens) => (store.ratios = calibrate(store.ratios, model, chars, tokens)),
    };
    return { provider, deps };
  }
  const newSession = (deps: TurnDeps): Promise<Session> =>
    createCampaign(deps.registry, deps.storage, { name: 'Kael Varn', birthDate: { year: TEST_YEAR - 14, month: 3, day: 4 }, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND }, { campaignId: 'c-opt1', branchId: 'b' }, '2026-11-16T00:00:00.000Z');
  const quiet = { narrative: 'Time passes.', choices: [{ label: 'Wait', intent: { actionType: 'rest' } }, { label: 'Look', intent: { actionType: 'other' } }], scene: { moodTags: [], presentNpcRefs: [] }, events: [] };

  it('the opening goes to Flash, an ordinary turn to Flash-Lite; a typed "I wait" makes no intent call', async () => {
    const { provider, deps } = setup([{ callType: 'narrative', data: openingM2 }, { callType: 'narrative', data: quiet }]);
    let s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    s = (await playTurn(deps, s, typed('I wait.'))).session;
    expect(provider.calls.map((c) => [c.opts.callType, c.opts.model])).toEqual([['narrative', 'gemini-3.8-flash'], ['narrative', 'gemini-3.5-flash-lite']]);
    expect(s.history.at(-1)!.draft.intent?.actionType).toBe('rest');
  });

  it('routing off: every story turn uses the list as set (Flash first)', async () => {
    const { provider, deps } = setup([{ callType: 'narrative', data: openingM2 }, { callType: 'narrative', data: quiet }], false);
    const s = (await playTurn(deps, await newSession(deps), { kind: 'opening', premise: '' })).session;
    await playTurn(deps, s, typed('I wait.'));
    expect(provider.calls.map((c) => c.opts.model)).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash']);
  });
});
