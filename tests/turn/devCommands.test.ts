// Dev sandbox (D-180): each dev command emits the right normal events through applyEvents; every command is refused
// in a normal campaign (nothing applied, nothing saved); commands are "[DEV]" turns in the transcript and the save;
// the scenario reaches the narrator (opening and /scenario) only in a test campaign.
import { LORE_TEST_DATE, TEST_START_DATE } from '../support/dates';
import { describe, expect, it } from 'vitest';
import type { CalendarDate } from '../../src/engine/calendar';
import type { DuelState } from '../../src/engine/duel';
import { selectFatigue, selectWounds } from '../../src/features/health/selectors';
import { selectNpcLevels } from '../../src/features/npcs/selectors';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { loadEnvelope } from '../../src/persist/envelope';
import { AUTOSAVE_SLOT, createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { buildNarrativeRequest, devScenarioBlock, historyWindow } from '../../src/turn/context';
import { commitDevCommand, DEV_HELP, pendingScenario, playerFormLevel, runDevCommand } from '../../src/turn/devCommands';
import type { Session } from '../../src/turn/pipeline';
import type { TurnRecord } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';
import { makeEstimator } from '../../src/ai/tokenRatio';

async function campaign(test: boolean, date: CalendarDate = TEST_START_DATE, scenario?: string): Promise<Session> {
  const input = testStartInput({ name: 'Tess', rank: 'knight', age: 30, startDate: date, startSecond: DEFAULT_START_SECOND, ...(scenario ? { scenario } : {}) });
  if (!test) delete (input as { test?: unknown }).test;
  return createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: test ? 'c-test' : 'c-normal', branchId: 'b' }, 'x');
}
const run = (s: GameState, text: string) => runDevCommand(REGISTRY, s, text);
const types = (o: ReturnType<typeof run>) => o.applied.map((a) => `${a.event.type}:${a.source}`);

describe('dev commands emit the normal events (D-180)', () => {
  it('/fight 1 duelist at -10: a named duelist at the player form level - 10, begun now', async () => {
    const s = (await campaign(true)).state;
    const o = run(s, '/fight 1 duelist at -10');
    expect(o.ok).toBe(true);
    expect(types(o)).toEqual(expect.arrayContaining(['npcIntroduced:dev', 'devNpcLevelsSet:dev', 'fightBegun:engine']));
    const active = o.state.combat.active!;
    expect(active.stakes).toBe('serious');
    const d = active.duel as DuelState;
    expect(d.opponents).toHaveLength(1);
    const npcId = d.opponents[0]!.id;
    const best = Math.max(...['shiiCho', 'makashi', 'soresu', 'ataru', 'shien', 'djemSo', 'niman', 'juyo'].map((f) => selectNpcLevels(o.state, npcId)[f] ?? 0));
    expect(best).toBeCloseTo(playerFormLevel(s) - 10, 0);
    expect(o.line).toMatch(/^\[DEV\] fight begun/);
    expect(o.draft.combat?.started).toBe(true);
  });
  it('/fight 6 b1 terrain forest: six B1 minions on the forest tags', async () => {
    const o = run((await campaign(true)).state, '/fight 6 b1 terrain forest');
    expect(o.ok).toBe(true);
    const fb = o.applied.find((a) => a.event.type === 'fightBegun')!.event;
    expect(fb['minionGroups']).toEqual([{ kind: 'battleDroid', count: 6 }]);
    expect(fb['terrainTags']).toEqual(['unevenGround', 'cover']);
    expect((o.state.combat.active!.duel as DuelState).opponents).toHaveLength(6);
    expect(o.state.combat.active!.terrainTags).toEqual(['unevenGround', 'cover']);
  });
  it('/fight 1 canon:malgus stakes lethal: the canon figure, linked, at lethal stakes', async () => {
    const o = run((await campaign(true, LORE_TEST_DATE)).state, '/fight 1 canon:malgus stakes lethal');
    expect(o.ok).toBe(true);
    expect(types(o)).toEqual(expect.arrayContaining(['npcIntroduced:dev', 'npcCanonLinked:engine', 'fightBegun:engine']));
    const npc = Object.values(o.state.npcs.byId).find((n) => n.name === 'Darth Malgus')!;
    expect(npc.canonId).toBe('lore:darth-malgus');
    expect(o.state.combat.active!.stakes).toBe('lethal');
    // Before his birth (3700 BBY) he cannot be fought.
    expect(run((await campaign(true, { year: -3710, month: 1, day: 1 })).state, '/fight 1 canon:malgus').ok).toBe(false);
  });
  it('/spar 60 mode controlled: a sparring session played out from its first exchange', async () => {
    const o = run((await campaign(true)).state, '/spar 60 mode controlled');
    expect(o.ok).toBe(true);
    const fb = o.applied.find((a) => a.event.type === 'fightBegun')!.event;
    expect(fb).toMatchObject({ stakes: 'spar', sparringMode: 'controlled', playOut: true });
    const a = o.state.combat.active!;
    expect(a.sparring).toBe('controlled');
    expect(a.session?.playing).toBe(true);
    expect((a.duel as DuelState).exchange).toBe(0);
  });
  it('/wound left arm severe and /heal: healthSynced adds the wound, devHealed clears it', async () => {
    const s = (await campaign(true)).state;
    const w = run(s, '/wound left arm severe');
    expect(w.ok).toBe(true);
    expect(types(w)).toContain('healthSynced:engine');
    expect(selectWounds(w.state).map((x) => [x.part, x.severity])).toEqual([['leftArm', 'severe']]);
    const h = run(w.state, '/heal');
    expect(types(h)).toEqual(['devHealed:dev']);
    expect(selectWounds(h.state)).toEqual([]);
    expect(h.state.health.vitalityLost).toBe(0);
  });
  it('/set, /e and /ci set the stats directly', async () => {
    const s = (await campaign(true)).state;
    const a = run(s, '/set force push 50');
    expect(types(a)).toEqual(['devSkillSet:dev']);
    expect(selectLevelExact(a.state, 'forcePush')).toBeCloseTo(50, 6);
    const e = run(a.state, '/e soresu 80');
    expect(types(e)).toEqual(['devESet:dev']);
    expect(e.state.progression.E['soresu']?.E).toBe(80);
    const c = run(e.state, '/ci forcePush 40');
    expect(types(c)).toEqual(['devCISet:dev']);
    expect(c.state.progression.CI['forcePush']?.CI).toBe(40);
    expect(run(c.state, '/e forcePush 40').ok).toBe(false);
  });
  it('/fatigue sets a meter as a fraction of its capacity', async () => {
    const o = run((await campaign(true)).state, '/fatigue physical 0.5');
    expect(types(o)).toEqual(['devFatigueSet:dev']);
    expect(selectFatigue(o.state).p).toBeCloseTo(0.5, 6);
    expect(run(o.state, '/fatigue force 1').ok).toBe(true);
  });
  it('/skip 3 days runs a montage on the routine (the same jump a montage turn runs)', async () => {
    const s = (await campaign(true)).state;
    const o = run(s, '/skip 3 days');
    expect(o.ok).toBe(true);
    expect(o.draft.jump?.level).toBe('montage');
    expect(o.state.clock.now.day).toBe(s.clock.now.day + 3);
    // The same result as the montage intent through resolveTurn.
    const same = resolveTurn(REGISTRY, s, { actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: 'montage', requestedSpan: { amount: 3, unit: 'days' } });
    expect(o.state).toEqual(same.state);
  });
  it('/time moves the clock forward through advanceTime; never back', async () => {
    const s = (await campaign(true)).state;
    const o = run(s, '/time noon');
    expect(o.ok).toBe(true);
    expect(o.state.clock.now.second).toBe(12 * 3600);
    expect(o.draft.timeAdvanced?.seconds).toBeGreaterThan(0);
    const later = run(o.state, `/time ${-TEST_START_DATE.year} BBY 2 1 08:00`);
    expect(later.ok).toBe(true);
    expect(later.state.clock.now).toEqual({ day: o.state.clock.now.day + 31, second: 8 * 3600 });
    expect(run(later.state, `/time ${-TEST_START_DATE.year} BBY 1 1`).ok).toBe(false);
  });
  it('/place moves to a known place, or creates it first', async () => {
    const s = (await campaign(true)).state;
    const o = run(s, '/place Dantooine forest');
    expect(types(o)).toEqual(['locationCreatedByPlayer:player', 'locationChanged:dev']);
    const id = o.state.locations.currentId!;
    expect(o.state.locations.byId[id]!.name).toBe('Dantooine forest');
    const back = run(run(o.state, '/place Somewhere else').state, '/place dantooine forest');
    expect(types(back)).toEqual(['locationChanged:dev']);
    expect(back.state.locations.currentId).toBe(id);
  });
  it('/help lists every command; an unknown command shows the help; /scenario needs text', async () => {
    const s = (await campaign(true)).state;
    const h = run(s, '/help');
    expect(h.ok).toBe(true);
    expect(h.applied).toEqual([]);
    for (const c of ['/fight', '/spar', '/wound', '/heal', '/set', '/e ', '/ci', '/fatigue', '/skip', '/time', '/place', '/scenario', '/help']) expect(h.line).toContain(c);
    const u = run(s, '/teleport home');
    expect(u.ok).toBe(false);
    expect(u.line).toContain(DEV_HELP[0]!);
    expect(run(s, '/scenario').ok).toBe(false);
  });
  it('a fight in progress refuses a second fight, wounds and skips', async () => {
    const f = run((await campaign(true)).state, '/fight 1 duelist').state;
    for (const c of ['/fight 1 duelist', '/spar', '/wound torso minor', '/heal', '/skip 1 day']) expect(run(f, c).ok, c).toBe(false);
  });
});

describe('dev commands are refused in a normal campaign (D-180)', () => {
  const all = ['/help', '/scenario a forest', '/fight 1 duelist', '/fight 6 b1', '/spar 60', '/wound torso minor', '/heal', '/set forcePush 50', '/e soresu 80', '/ci forcePush 40', '/fatigue physical 0.5', '/skip 3 days', '/time noon', '/place Dantooine', '/unknown'];
  it('every command: refused, nothing applied, the state unchanged', async () => {
    const s = (await campaign(false)).state;
    expect(s.character.testCharacter).toBe(false);
    for (const c of all) {
      const o = run(s, c);
      expect(o.ok, c).toBe(false);
      expect(o.applied, c).toEqual([]);
      expect(o.state, c).toBe(s);
      expect(o.line, c).toMatch(/only in a test campaign/);
    }
  });
  it('nothing is saved, and the dev-only events refuse themselves too', async () => {
    const sess = await campaign(false);
    const storage = createMemoryStorage();
    const r = await commitDevCommand({ registry: REGISTRY, storage, wallClock: () => ({ iso: 'x' }) }, sess, '/set forcePush 90');
    expect(r.record).toBeNull();
    expect(r.session).toBe(sess);
    expect(storage.transcript).toHaveLength(0);
    expect(await storage.loadSnapshot(AUTOSAVE_SLOT)).toBeNull();
    const npc = applyEvents(REGISTRY, sess.state, [{ type: 'npcIntroduced', name: 'X', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 30, description: '' }], { source: 'ai' }).state;
    const id = Object.keys(npc.npcs.byId)[0]!;
    for (const e of [{ type: 'devSkillSet', skillId: 'forcePush', level: 90 }, { type: 'devESet', formId: 'soresu', value: 90 }, { type: 'devCISet', abilityId: 'forcePush', value: 90 }, { type: 'devHealed' }, { type: 'devFatigueSet', meter: 'p', fraction: 0 }, { type: 'devNpcLevelsSet', npcRef: id, level: 90 }]) {
      const out = applyEvents(REGISTRY, npc, [e], { source: 'dev' });
      expect(out.rejected, e.type).toHaveLength(1);
      expect(out.rejected[0]!.reason, e.type).toMatch(/only in a test campaign/);
    }
    // And no other source can send them.
    expect(applyEvents(REGISTRY, (await campaign(true)).state, [{ type: 'devSkillSet', skillId: 'forcePush', level: 90 }], { source: 'ai' }).rejected).toHaveLength(1);
  });
});

describe('dev commands in the transcript and the save (D-180)', () => {
  it('each command is a [DEV] turn: in the transcript, the state in the autosave (which loads)', async () => {
    const storage = createMemoryStorage();
    const deps = { registry: REGISTRY, storage, wallClock: () => ({ iso: '2026-11-18T00:00:00Z' }) };
    let sess = await campaign(true);
    for (const c of ['/fight 1 duelist at -5', '/help', '/nonsense']) {
      const r = await commitDevCommand(deps, sess, c);
      sess = r.session;
      expect(r.record!.input).toEqual({ kind: 'dev', text: c });
      expect(r.record!.narrative).toMatch(/^\[DEV\] /);
      expect(r.record!.calls).toEqual([]);
    }
    expect(storage.transcript.map((t) => (t.data as TurnRecord).input.kind)).toEqual(['dev', 'dev', 'dev']);
    const loaded = loadEnvelope(REGISTRY, await storage.loadSnapshot(AUTOSAVE_SLOT));
    expect(loaded.ok).toBe(true);
    expect(loaded.ok && loaded.state).toEqual(sess.state);
    expect(loaded.ok && loaded.state.combat.active).not.toBeNull();
    // The duelist's set levels are in the save.
    const id = (sess.state.combat.active!.duel as DuelState).opponents[0]!.id;
    expect(loaded.ok && loaded.state.npcs.byId[id]!.devLevels).toBeDefined();
  });
  it('dev turns are left out of the story history sent to the AI', async () => {
    let sess = await campaign(true);
    sess = (await commitDevCommand({ registry: REGISTRY, storage: createMemoryStorage(), wallClock: () => ({ iso: 'x' }) }, sess, '/help')).session;
    expect(historyWindow(sess.history, 10_000, makeEstimator(4)).messages).toEqual([]);
  });
});

describe('the dev scenario reaches the narrator (D-180)', () => {
  const emptyDraft = (s: GameState) => resolveTurn(REGISTRY, s, null).draft;
  it('the test start scenario overrides the opening', async () => {
    const sess = await campaign(true, TEST_START_DATE, "I'm a Knight in a forest on Dantooine, ambushed by 4 Mandalorians");
    expect(sess.campaign.scenario).toBe("I'm a Knight in a forest on Dantooine, ambushed by 4 Mandalorians");
    const req = buildNarrativeRequest(sess.state, emptyDraft(sess.state), { kind: 'opening', premise: sess.campaign.premise ?? '', scenario: sess.campaign.scenario! }, [], { ratio: 4 } as never);
    const last = req.messages[req.messages.length - 1]!.text;
    expect(last).toContain('DEV SCENARIO');
    expect(last).toContain('ambushed by 4 Mandalorians');
    expect(last).toMatch(/combatStarted \(opponentRefs or minionGroups/);
  });
  it('/scenario holds until the next narrated turn, and never in a normal campaign', async () => {
    let sess = await campaign(true);
    sess = (await commitDevCommand({ registry: REGISTRY, storage: createMemoryStorage(), wallClock: () => ({ iso: 'x' }) }, sess, '/scenario a hangar on Coruscant, three thugs closing in')).session;
    sess = (await commitDevCommand({ registry: REGISTRY, storage: createMemoryStorage(), wallClock: () => ({ iso: 'x' }) }, sess, '/set forcePush 40')).session;
    expect(pendingScenario(sess.history)).toBe('a hangar on Coruscant, three thugs closing in');
    const req = buildNarrativeRequest(sess.state, emptyDraft(sess.state), { kind: 'typed', text: 'look around' }, sess.history, { ratio: 4 } as never);
    expect(req.messages[req.messages.length - 1]!.text).toContain('DEV SCENARIO (a test campaign; this overrides the current scene): start exactly in this situation: a hangar on Coruscant');
    // A narrated turn consumes it.
    const narrated = { ...sess.history[0]!, input: { kind: 'typed', text: 'x' }, calls: [{ callType: 'narrative', model: 'm', usage: null, outcome: 'ok' }] } as TurnRecord;
    expect(pendingScenario([...sess.history, narrated])).toBeNull();
    // Outside a test campaign the block is never built.
    expect(devScenarioBlock((await campaign(false)).state, 'anything', false)).toBeNull();
  });
});
