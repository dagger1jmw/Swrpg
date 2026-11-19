// D-215 (combat pass 2, dev tools): the test start by archetype and species; in-world dev places; /fight weapon per
// group; /truce; /fall.
import { describe, expect, it } from 'vitest';
import type { DuelState } from '../../src/engine/duel';
import { selectArchetype, selectPath } from '../../src/features/character/selectors';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { selectRank } from '../../src/features/ranks/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND, validateNewCampaign } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { TEST_START_ARCHETYPES, testStartInput, type TestStartArchetype } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';

async function start(archetype: TestStartArchetype, speciesId = 'human', rank: 'padawan' | 'knight' = 'knight', age = 30): Promise<GameState> {
  const input = testStartInput({ name: 'Test', rank, age, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND, archetype, speciesId });
  expect(validateNewCampaign(input)).toEqual([]);
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `t-${archetype}`, branchId: 'b' }, 'x')).state;
}
const run = (s: GameState, text: string) => runDevCommand(REGISTRY, s, text);

describe('the test start by archetype and species (D-215)', () => {
  it.each(Object.keys(TEST_START_ARCHETYPES) as TestStartArchetype[])('%s: a valid test character on its path', async (a) => {
    const s = await start(a);
    expect(selectArchetype(s)).toBe(a);
    expect(selectPath(s)).toBe(TEST_START_ARCHETYPES[a]);
  });
  it('a Sith knows Lightning and Choke (with CI); the Sith Knight is a Sith Lord', async () => {
    const s = await start('sithWarrior');
    expect(selectLevelExact(s, 'forceLightning')).toBeGreaterThanOrEqual(1);
    expect(selectLevelExact(s, 'forceChoke')).toBeGreaterThanOrEqual(1);
    expect(selectRank(s)).toBe('lord');
    expect(testStartInput({ name: 'x', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: 0, archetype: 'sithInquisitor' }).creation!.rank).toBe('lord');
  });
  it('a smuggler has no Force and fights with a blaster pistol', async () => {
    let s = await start('smuggler');
    for (const id of ['telekinesis', 'forcePush', 'forceLightning', 'mindTrick']) expect(selectLevelExact(s, id)).toBeLessThan(1);
    s = run(s, '/fight 3 trooper').state;
    const a = (s.combat.active!.duel as DuelState).a;
    expect(a.weapon).toBe('blasterPistol');
    expect(a.skillId).toBe('blaster');
  });
  it('a species other than human', async () => {
    const s = await start('jediConsular', 'twilek');
    expect(s.character.speciesId).toBe('twilek');
  });
});

describe('dev fights (D-215)', () => {
  it('/fight weapon per group: four Mandalorians with scatter guns', async () => {
    const o = run(await start('jediGuardian'), '/fight 4 mandalorian weapon scattergun terrain ruins');
    expect(o.ok).toBe(true);
    expect((o.state.combat.active!.duel as DuelState).opponents.map((x) => x.weapon)).toEqual(['scatterGun', 'scatterGun', 'scatterGun', 'scatterGun']);
    expect(o.state.locations.byId[o.state.locations.currentId!]!.name).toBe('ancient ruins on Dantooine');
    expect(run(await start('jediGuardian'), '/fight 1 duelist weapon scattergun').ok).toBe(false);
    expect(run(await start('jediGuardian'), '/fight 2 trooper weapon banana').ok).toBe(false);
  });
  it('/truce: the opponent offers a truce, and the Accept truce beat ends the fight as a truce', async () => {
    let s = run(await start('jediGuardian'), '/fight 2 trooper').state;
    const t = run(s, '/truce lay down your arms and we let you go');
    expect(t.ok).toBe(true);
    s = t.state;
    expect(s.combat.active!.truceOffer).toBe('lay down your arms and we let you go');
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'acceptTruce' } as CombatActionInput });
    expect(r.state.combat.active).toBeNull();
    expect(r.state.combat.last!.outcome).toBe('truce');
    expect(run(await start('jediGuardian'), '/truce').ok).toBe(false);
  });
  it('/fall rolls the terrain now; a fight with no hazardous terrain refuses it', async () => {
    const ice = run(run(await start('jediGuardian'), '/fight 3 trooper terrain ice').state, '/fall');
    expect(ice.ok).toBe(true);
    expect(ice.report.some((n) => n.startsWith('terrain:') || n === 'terrain rolled: nobody fell')).toBe(true);
    const flatless = run(run(await start('jediGuardian'), '/fight 3 trooper terrain cover').state, '/fall');
    expect(flatless.ok).toBe(false);
  });
});
