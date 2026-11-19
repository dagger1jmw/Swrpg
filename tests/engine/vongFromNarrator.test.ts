// D-239 (combat pass 3 issue 2): a Yuuzhan Vong warrior the narrator introduces with species "unknown" is read from its
// name and description: species yuuzhanVong, the D-224 warrior archetype (melee, saber-resistant armor), outside the
// Force, and a captor that does not stabilize a dying prisoner (D-225). The same for a Vong minion group.
import { describe, expect, it } from 'vitest';
import { inferSpecies, weaponFromDescription } from '../../src/data/speciesWords';
import type { DuelState } from '../../src/engine/duel';
import type { Wound } from '../../src/engine/wounds';
import { selectNpcGen } from '../../src/features/npcs/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';

async function knight26Aby(seed = 'vong'): Promise<GameState> {
  const input = testStartInput({ name: 'Teren Vax', rank: 'knight', age: 30, startDate: { year: 26, month: 1, day: 1 }, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
const ai = (s: GameState, events: unknown[]) => applyEvents(REGISTRY, s, events, { source: 'ai' });
/** The pass-3 opening's event, as the narrator sent it (species unknown). */
const PASS3_VONG = { type: 'npcIntroduced', key: 'tmp:1', name: 'Yuuzhan Vong warrior', species: 'unknown', faction: 'independent', role: 'soldier', ageApprox: 30, description: 'A towering warrior clad in ridged vonduun crab armor, wielding a writhing amphistaff.' };

describe('species from the narrator\'s words (D-239)', () => {
  it('the pass-3 event: species yuuzhanVong, the warrior archetype, with the note', async () => {
    const r = ai(await knight26Aby(), [PASS3_VONG]);
    expect(r.rejected).toEqual([]);
    const npc = Object.values(r.state.npcs.byId).find((n) => n.name === 'Yuuzhan Vong warrior')!;
    expect(npc.speciesId).toBe('yuuzhanVong');
    expect(selectNpcGen(r.state, npc.id)!.archetype).toBe('yuuzhanVongWarrior');
    expect(r.applied.flatMap((a) => a.notes).join(' ')).toMatch(/species yuuzhanVong from the name \(the narrator sent unknown\)/);
  });
  it('inferSpecies: name first, description for unknown or other, the narrator\'s own species kept, the era respected', () => {
    expect(inferSpecies({ name: 'Yuuzhan Vong warrior', description: '', given: 'human', year: 26 }).species).toBe('yuuzhanVong');
    expect(inferSpecies({ name: 'The warrior', description: 'Clad in vonduun crab armor, an amphistaff coiled on his arm.', given: 'unknown', year: 26 }).species).toBe('yuuzhanVong');
    // A human wearing a trophy: the description alone does not overrule "human".
    expect(inferSpecies({ name: 'Kell Tainer', description: 'He wears a shard of vonduun crab armor as a trophy.', given: 'human', year: 26 }).species).toBe('human');
    expect(inferSpecies({ name: 'Yuuzhan Vong warrior', description: '', given: 'trandoshan', year: 26 }).species).toBe('trandoshan');
    expect(inferSpecies({ name: 'Borga the Hutt', description: '', given: 'unknown', year: -22 }).species).toBe('hutt');
    expect(inferSpecies({ name: 'Guard', description: 'A Gamorrean with a vibro-axe.', given: 'other', year: -22 }).species).toBe('gamorrean');
    const old = inferSpecies({ name: 'Yuuzhan Vong warrior', description: '', given: 'unknown', year: -3653 });
    expect(old.species).toBe('unknown');
    expect(old.note).toMatch(/none are met in the galaxy in 3653 BBY/);
  });
  it('weapons named in a description: melee words, not when a blaster or a saber is named too', () => {
    expect(weaponFromDescription('wielding a writhing amphistaff')).toBe('melee');
    expect(weaponFromDescription('a scarred mercenary with a vibroblade at his hip')).toBe('melee');
    expect(weaponFromDescription('a mercenary with a blaster and a knife')).toBeNull();
    expect(weaponFromDescription('a Sith with a red saberstaff')).toBeNull();
    expect(weaponFromDescription('an armed duelist who means to fight')).toBeNull();
  });
});

describe('the Vong warrior in a fight (D-224, D-225, D-239)', () => {
  async function vongFight(stakes: 'lethal' | 'serious' = 'lethal', dying = false) {
    let s = await knight26Aby();
    s = ai(s, [PASS3_VONG]).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Yuuzhan Vong warrior')!.id;
    if (dying) s = applyEvents(REGISTRY, s, [{ type: 'healthSynced', vitalityLost: 0, addWounds: [{ id: 'd', part: 'torso', severity: 'mortal', W: 55, stabilized: false, healProgress: 0, day: s.clock.now.day, source: 'dev' } as Wound], cause: 'dev' }], { source: 'engine' }).state;
    s = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [id], minionGroups: [], stakes, terrainTags: [] }], { source: 'engine' }).state;
    return { s, id };
  }
  it('an amphistaff and saber-resistant armor; outside the Force; Push and Choke immune on the card', async () => {
    const { s } = await vongFight();
    const v = (s.combat.active!.duel as DuelState).opponents[0]!;
    expect(v.weapon).toBe('melee');
    expect(v.saberResistant).toBe(true);
    expect(v.forceTraits).toContain('forceInvisible');
  });
  it('a dying prisoner of the Vong is not stabilized', async () => {
    const { s } = await vongFight('serious', true);
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput });
    const notes = r.draft.applied.flatMap((a) => a.notes).join('\n');
    expect(notes).toMatch(/the opponent's choice: captured/);
    expect(notes).not.toMatch(/stabilized by the captors/);
  });
  it('a Vong minion group in 26 ABY: melee, armored, outside the Force; no stabilizing either', async () => {
    let s = await knight26Aby('vm');
    s = applyEvents(REGISTRY, s, [{ type: 'healthSynced', vitalityLost: 0, addWounds: [{ id: 'd', part: 'torso', severity: 'mortal', W: 55, stabilized: false, healProgress: 0, day: s.clock.now.day, source: 'dev' } as Wound], cause: 'dev' }], { source: 'engine' }).state;
    s = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'yuuzhanVongWarrior', count: 3 }], stakes: 'serious', terrainTags: [] }], { source: 'engine' }).state;
    const opps = (s.combat.active!.duel as DuelState).opponents;
    expect(opps.map((o) => o.name)).toEqual(['Yuuzhan Vong warrior 1', 'Yuuzhan Vong warrior 2', 'Yuuzhan Vong warrior 3']);
    expect(opps.every((o) => o.weapon === 'melee' && o.saberResistant && o.forceTraits?.includes('forceInvisible'))).toBe(true);
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput });
    const notes = r.draft.applied.flatMap((a) => a.notes).join('\n');
    expect(notes).toMatch(/captured/);
    expect(notes).not.toMatch(/stabilized by the captors/);
  });
  it('outside the invasion years a Vong minion group becomes brawlers, with the note', async () => {
    const input = testStartInput({ name: 'X', rank: 'knight', age: 30, startDate: { year: -22, month: 1, day: 1 }, startSecond: DEFAULT_START_SECOND });
    let s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-old', branchId: 'b' }, 'old')).state;
    const r = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [], minionGroups: [{ kind: 'yuuzhanVongWarrior', count: 2 }], stakes: 'serious', terrainTags: [] }], { source: 'engine' });
    s = r.state;
    expect((s.combat.active!.duel as DuelState).opponents[0]!.name).toBe('Brawler 1');
    expect(r.applied.flatMap((a) => a.notes).join(' ')).toMatch(/no Yuuzhan Vong warriors in 22 BBY: brawlers instead/);
  });
});
