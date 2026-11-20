// Combat pass 4's minor issues (4-15), D-248: each fix with the report's own case.
import { describe, expect, it } from 'vitest';
import { LORE_TEST_DATE, LORE_TEST_YEAR } from '../support/dates';
import { createModelRouter, type QuotaState } from '../../src/ai/fallback';
import { createFixtureProvider } from '../../src/ai/fixtureProvider';
import { defaultSettings, type Settings } from '../../src/ai/settings';
import { EMPTY_USAGE_LOG, type UsageLog } from '../../src/ai/usage';
import { canThrowSaber } from '../../src/engine/combatForce';
import type { DuelState } from '../../src/engine/duel';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { chapterTurnCount } from '../../src/memory/chapterClose';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { combatDraft } from '../../src/turn/combatTurn';
import { describeCombat, stateBlock } from '../../src/turn/context';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { commitDevCommand, playerFormLevel, runDevCommand } from '../../src/turn/devCommands';
import { checkNarration, mechanicalTerm, repairWording } from '../../src/turn/narrationCheck';
import { playTurn, type Session, type TurnDeps } from '../../src/turn/pipeline';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput, type TestStartRequest } from '../../src/turn/testStart';
import { armorText, endText, FATE_WORDS, WEAPON_SHORT } from '../../src/ui/duelPanel';
import { TEST_START_DATE } from '../support/dates';
import openingM2 from '../fixtures/ai/opening-m2.json';

async function start(o: { name?: string; rank?: TestStartRequest['rank']; archetype?: TestStartRequest['archetype']; year?: number; seed: string }): Promise<GameState> {
  const input = testStartInput({ name: o.name ?? 'Kael Dorran', rank: o.rank ?? 'knight', age: 30, ...(o.archetype ? { archetype: o.archetype } : {}), startDate: o.year !== undefined ? { year: o.year, month: 1, day: 1 } : TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${o.seed}`, branchId: 'b' }, o.seed)).state;
}
const ok = (s: GameState, text: string): GameState => {
  const o = runDevCommand(REGISTRY, s, text);
  if (!o.ok) throw new Error(o.line);
  return o.state;
};
const lineOf = (s: GameState, text: string): string => {
  const o = runDevCommand(REGISTRY, s, text);
  return [...o.report, o.line].join('\n');
};

describe('4: the captors in later scenes carry their weapon', () => {
  it('a surrender to 4 Mandalorians with slugthrower rifles: the CAPTIVE line names the rifles, and a blow is not a wound', async () => {
    let s = ok(await start({ seed: 'cap' }), '/fight 4 mandalorian weapon slugrifle terrain ice');
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput }).state;
    expect(s.combat.last!.captors).toMatchObject({ group: '4 Mandalorian warriors', weapon: 'slugthrower rifles' });
    const sys = stateBlock(s, makeEstimator(4)).text;
    expect(sys).toMatch(/CAPTIVE: the player character was captured by 4 Mandalorian warriors \(Mandalorian warrior 1, .*\), armed with slugthrower rifles and no other weapons/);
    expect(sys).toMatch(/A blow from a captor is a story event only/);
  });
});

describe('5: the cards\' phrases in prose are reworded in code', () => {
  it('"out of the fight", "is outpaced", "intended maneuver unreached"', () => {
    expect(mechanicalTerm('The crimson-bladed duelist collapses, unable to stand, entirely out of the fight.')).not.toBeNull();
    expect(repairWording('The crimson-bladed duelist collapses, unable to stand, entirely out of the fight.')).toBe('The crimson-bladed duelist collapses, unable to stand, unable to fight on.');
    expect(repairWording('Your bolt goes wide as you are outpaced.')).toBe('Your bolt goes wide as you are pressed hard.');
    expect(mechanicalTerm('a blow you narrowly dodge, leaving your intended maneuver unreached')).not.toBeNull();
    // Ordinary prose stays: "outpaced pressure", "leaves no wound".
    expect(mechanicalTerm('As it stumbles from your outpaced pressure, you drive your blade forward.')).toBeNull();
    expect(mechanicalTerm('The blow leaves no wound.')).toBeNull();
  });
});

describe('6 and 7: the build-up line by weapon; cover and a recovered footing', () => {
  it('an unarmed Jedi against a blaster droid does not "trade blows"; two shooters "trade fire"; cover is in the block', async () => {
    let s = ok(await start({ seed: 'b1' }), '/fight 1 b1');
    const pre = s;
    s = ok(s, '/exchanges 6');
    const block = describeCombat(combatDraft(pre, s, false, [])!).join('\n');
    expect(block).not.toMatch(/Kael Dorran and B1 battle droid 1 trade blows/);
    let d = ok(await start({ seed: 'cov', archetype: 'smuggler' }), '/fight 4 trooper terrain ruins');
    const pre2 = d;
    d = ok(d, '/exchanges 6');
    const c = combatDraft(pre2, d, false, [])!;
    expect(c.cover).toBe(true);
    const block2 = describeCombat(c).join('\n');
    expect(block2).toMatch(/Cover: the shooters on both sides fire from behind cover/);
    expect(block2).not.toMatch(/trade blows/);
    // A Jedi in the same ruins: no cover line (cover counts between shooters, D-243).
    const j = ok(await start({ seed: 'covj' }), '/fight 4 trooper terrain ruins');
    expect(combatDraft(j, ok(j, '/exchanges 2'), false, [])!.cover).toBeUndefined();
  });
  it('"You recover your footing" with nothing on the player in the block is an invented slip', async () => {
    let s = ok(await start({ seed: 'rf', archetype: 'smuggler' }), '/fight 1 trooper');
    const pre = s;
    s = ok(s, '/exchanges 1');
    const c = combatDraft(pre, s, false, [])!;
    const pcHit = c.narrate.some((r) => r.hit && r.hit.by === 'B');
    const issues = checkNarration('You recover your footing and snap off a return shot.', { combat: { ...c, quiet: false, narrate: c.narrate.filter((r) => !(r.hit && r.hit.by === 'B')), records: [] }, checks: [], applied: [] } as never, false).map((i) => i.kind);
    void pcHit;
    expect(issues).toContain('slipNoHazard');
    // After a hit on the player the same words are a reaction, and fine.
    const hitOnPc = { ...c, quiet: false, narrate: [...c.narrate, { ...c.narrate[0]!, kind: 'strike', striker: 'B', targetId: c.fighters[1]!.id, hit: { by: 'B', quality: 'solid', D: 20, part: 'torso', W: 15, severity: 'minor', vitalityLost: 10, severed: false, avoided: false } }] };
    expect(checkNarration('You recover your footing and snap off a return shot.', { combat: hitOnPc, checks: [], applied: [] } as never, false).map((i) => i.kind)).not.toContain('slipNoHazard');
  });
});

describe('9: the saber throw at exactly its requirement', () => {
  it('/set telekinesis 15 allows it (the level read back from XP sat a hair under 15)', async () => {
    let s = ok(await start({ seed: 'st' }), '/set telekinesis 15');
    expect(selectLevelExact(s, 'telekinesis')).toBeCloseTo(15, 4);
    s = ok(s, '/fight 6 b1');
    const a = (s.combat.active!.duel as DuelState).a;
    expect(canThrowSaber(a, selectLevelExact(s, 'telekinesis'))).toBe(true);
    expect(canThrowSaber(a, 14.5)).toBe(false);
  });
});

describe('10: /heal all gives the natural hand back', () => {
  it('a lost right arm with its prosthetic fitted at once keeps the hand (D-253); a switch is undone by /heal all', async () => {
    let s = ok(await start({ seed: 'hand' }), '/sever right arm');
    expect(s.character.dominantHand).toBe('right');
    // A switch (a limb lost and not replaced) records the natural hand; /heal all restores it.
    s = applyEvents(REGISTRY, s, [{ type: 'dominantHandSwitched', reason: 'lost the rightArm' }], { source: 'engine' }).state;
    expect(s.character).toMatchObject({ dominantHand: 'left', naturalHand: 'right' });
    s = ok(s, '/heal all');
    expect(s.character.dominantHand).toBe('right');
    expect(s.character.naturalHand).toBeUndefined();
  });
});

describe('11: a choice that names a same-reply NPC by its temp key', () => {
  it('the temp key becomes the minted ID (no "not a valid ID; dropped")', async () => {
    const reply = { ...openingM2, choices: [{ label: 'Bow to the Master', intent: { actionType: 'dialogue', targetRef: 'tmp:3' } }, { label: 'Study the hall', intent: { actionType: 'investigate' } }] };
    const provider = createFixtureProvider([{ callType: 'narrative', data: reply }]);
    const store = { quota: {} as QuotaState, usage: EMPTY_USAGE_LOG as UsageLog };
    const getSettings = (): Settings => ({ ...defaultSettings(), apiKey: 'k'.repeat(30) });
    let ms = Date.UTC(2026, 10, 19, 20, 0);
    const deps: TurnDeps = {
      registry: REGISTRY, provider, storage: createMemoryStorage(), getSettings,
      router: createModelRouter({ getLists: () => getSettings().modelLists, getLimits: () => getSettings().limits, getUsage: () => store.usage, getQuota: () => store.quota, setQuota: (q) => (store.quota = q), now: () => ms }),
      wallClock: () => ({ ms: (ms += 1000), iso: new Date(ms).toISOString() }), recordCall: () => {}, sleep: async () => {}, jitter: () => 0.5, onStatus: () => {},
    };
    const sess: Session = await createCampaign(REGISTRY, deps.storage, { name: 'Kael Varn', birthDate: { year: LORE_TEST_YEAR - 14, month: 3, day: 4 }, startDate: LORE_TEST_DATE, startSecond: DEFAULT_START_SECOND }, { campaignId: 'c-tmp', branchId: 'b' }, '2026-11-19T00:00:00.000Z');
    const t = await playTurn(deps, sess, { kind: 'opening', premise: '' });
    const ref = t.record.choices[0]!.intent.targetRef!;
    expect(ref).toMatch(/^npc:/);
    expect(t.session.state.npcs.byId[ref]?.name).toBe('Master Orren Vash');
  });
});

describe('12: words on the end card; the opponent\'s weapon and armor', () => {
  it('fates, interruptions and the state after a killing strike', async () => {
    expect(FATE_WORDS['killingStrike']).toBe('a killing strike');
    expect(endText('interrupted', 'environmentCollapse: the explosion brings the place down; 1 opponent still standing')).toBe('interrupted: the place came down: the explosion brings the place down; 1 opponent still standing');
    let s = ok(await start({ seed: 'ks', archetype: 'sithWarrior' }), '/fight 1 duelist at 0 stakes lethal');
    s = ok(s, '/archetype sithWarrior');
    for (let i = 0; i < 12 && s.combat.last?.playerFate !== 'killingStrike'; i++) {
      const pre = ok(i === 0 ? s : ok(ok(s, '/heal'), '/fight 1 duelist at 0 stakes lethal'), '/archetype sithWarrior');
      const r = resolveTurn(REGISTRY, pre, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput });
      if (r.state.combat.last?.playerFate === 'killingStrike') {
        const view = combatDraft(pre, r.state, false, [])!;
        expect(view.fighters[0]!.status).toBe('Dying');
        return;
      }
      s = r.state;
    }
    throw new Error('no killing strike in 12 lethal surrenders to a Sith Warrior (chance 0.3 each)');
  });
  it('the Vong warrior: an amphistaff and vonduun crab armor that resists lightsabers, on the card and in the block', async () => {
    const s = ok(await start({ seed: 'vg', year: 26 }), '/fight 3 yuuzhanVongWarrior');
    const o = (s.combat.active!.duel as DuelState).opponents[0]!;
    expect(o.weaponName).toBe('amphistaff');
    expect(armorText(o)).toBe('vonduun crab armor (resists lightsabers)');
    expect(armorText({ armor: 'none', saberResistant: false })).toBe('');
    expect(armorText({ armor: 'medium', saberResistant: false })).toBe('medium armor');
    expect(WEAPON_SHORT['melee']).toBe('melee weapon');
    const pre = s;
    const block = describeCombat(combatDraft(pre, ok(s, '/exchanges 1'), false, [])!).join('\n');
    expect(block).toMatch(/Yuuzhan Vong warrior 1: an amphistaff, a melee weapon/);
    expect(block).toMatch(/Yuuzhan Vong warrior 1: vonduun crab armor, heavy \(saber-resistant/);
  });
  it('the narrator\'s Vong (D-239 event): the amphistaff from his description, the caste armor', async () => {
    let s = await start({ seed: 'vgn', year: 26 });
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Yuuzhan Vong warrior', species: 'unknown', faction: 'independent', role: 'soldier', ageApprox: 30, description: 'A towering warrior clad in ridged vonduun crab armor, wielding a writhing amphistaff.' }], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Yuuzhan Vong warrior')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [id], minionGroups: [], stakes: 'lethal', terrainTags: [] }], { source: 'engine' }).state;
    const v = (s.combat.active!.duel as DuelState).opponents[0]!;
    expect(v.weaponName).toBe('amphistaff');
    expect(armorText(v)).toBe('vonduun crab armor (resists lightsabers)');
  });
});

describe('13: dev turns do not count toward a chapter', () => {
  it('thirty dev commands leave the chapter at no story turns', async () => {
    const deps = { registry: REGISTRY, storage: createMemoryStorage(), wallClock: () => ({ iso: 'x' }) };
    const s0 = await start({ seed: 'ch' });
    let sess: Session = { state: s0, history: [] } as unknown as Session;
    for (let i = 0; i < 31; i++) sess = (await commitDevCommand(deps, sess, '/help')).session;
    expect(sess.state.meta.turn).toBe(s0.meta.turn + 31);
    expect(chapterTurnCount(sess.state, sess.state.meta.turn)).toBe(Math.max(0, s0.meta.turn - Math.max(1, s0.memory.current.startTurn) + 1));
  });
});

describe('15: dev carry-overs', () => {
  it('the narrator cannot make a fight\'s minion a person', async () => {
    const s = ok(await start({ seed: 'mn' }), '/fight 4 mandalorian');
    const r = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Mandalorian warrior 2', species: 'human', faction: 'mandalorians', role: 'soldier', description: '' }], { source: 'ai' });
    expect(r.rejected[0]?.reason).toMatch(/is a minion of the fight, not a person/);
    expect(Object.values(r.state.npcs.byId).some((n) => n.name === 'Mandalorian warrior 2')).toBe(false);
  });
  it('earlier dev duelists leave the scene at the next dev fight; one with an open fate stays', async () => {
    let s = ok(await start({ seed: 'gone' }), '/fight 1 duelist at -40');
    const first = Object.values(s.npcs.byId).find((n) => n.name === 'Duelist 1')!.id;
    s = ok(s, '/exchanges 400');
    const open = s.combat.fates.some((f) => f.npcId === first);
    s = { ...s, pacing: { ...s.pacing, scene: { ...s.pacing.scene, presentNpcIds: [...new Set([...s.pacing.scene.presentNpcIds, first])] } } };
    s = ok(ok(s, '/heal'), '/fight 1 duelist at -40');
    expect(s.pacing.scene.presentNpcIds.includes(first)).toBe(open);
  });
  it('a smuggler\'s duelist gap is counted from the blaster, not a form he does not have', async () => {
    const s = await start({ seed: 'sm', archetype: 'smuggler' });
    expect(playerFormLevel(s)).toBeGreaterThan(5);
    expect(lineOf(s, '/fight 1 duelist at +10')).toMatch(/1 duelist at [\d.]+ \(your level [\d.]+\)/);
  });
});
