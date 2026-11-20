// D-260 strike intent (kill, disarm), D-262 capture by subduing, D-263 Sith tactical withdrawal, and the severing rule.
import { describe, expect, it } from 'vitest';
import { INTENT_WEIGHTS, strikeIntentFor, subdueFor } from '../../src/data/combat.config';
import { capturedNow, damageFighter, disengageContest, intentWeights, runUntilBeat, startDuel, subdueFighter, type DuelState, type Fighter } from '../../src/engine/duel';
import { severs } from '../../src/engine/damage';
import { seedRng, type RngState } from '../../src/engine/rng';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { combatDraft } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';
import { CLONE_WARS_DATE } from '../support/dates';
import { forceUser, REAL } from '../support/duelSim';

/** Where 20,000 clean saber hits from a striker of this intent land on a right-handed defender. */
function landing(intent: 'kill' | 'disarm' | null): { share: Record<string, number>; mortal: number } {
  let rng: RngState = seedRng(`land:${intent}`);
  const count: Record<string, number> = {};
  let mortal = 0;
  for (let i = 0; i < 20_000; i++) {
    const d = damageFighter(forceUser('D', 50), 'critical', 20, 'lightsaber', REAL, rng, 0, 1, false, null, intent);
    rng = d.rng;
    count[d.hit.part] = (count[d.hit.part] ?? 0) + 1;
    if (d.hit.severity === 'mortal') mortal++;
  }
  return { share: Object.fromEntries(Object.entries(count).map(([k, v]) => [k, v / 20_000])), mortal };
}

/** A blaster trooper sent to take the player alive (a stun-bolt capture). */
const stunTrooper = (id: string, level: number): Fighter => ({ ...forceUser(id, level), weapon: 'blasterRifle', skillId: 'blaster', form: null, forceSense: 0, forceResistance: 0, armor: 'medium', intent: 'capture', subdue: 'stunBolt' });

describe('intent by archetype and scene', () => {
  it('Jedi disarm, and kill only in lethal stakes; Sith, soldiers, mercenaries, Mandalorians, the Vong kill', () => {
    expect(strikeIntentFor('jediGuardian', 'serious', false, null)).toBe('disarm');
    expect(strikeIntentFor('jediConsular', 'lethal', false, null)).toBe('kill');
    for (const a of ['sithWarrior', 'sithInquisitor', 'soldier', 'bountyHunter', 'mandalorian', 'yuuzhanVongWarrior', 'civilian']) expect(strikeIntentFor(a, 'serious', false, null), a).toBe('kill');
  });
  it('capture needs a subduing means; without one the archetype intent stays (D-262); never in a spar', () => {
    expect(strikeIntentFor('sithWarrior', 'lethal', true, 'choke')).toBe('capture');
    expect(strikeIntentFor('bountyHunter', 'serious', true, 'snare')).toBe('capture');
    expect(strikeIntentFor('sithWarrior', 'lethal', true, null)).toBe('kill');
    expect(strikeIntentFor('jediGuardian', 'serious', true, null)).toBe('disarm');
    expect(strikeIntentFor('soldier', 'spar', true, 'stunBolt')).toBe('kill');
  });
  it('the subduing means come from the loadout, the archetype and the Force abilities', () => {
    expect(subdueFor({ archetype: 'sithWarrior', weapon: 'lightsaber', forceChoke: 30 })).toBe('choke');
    expect(subdueFor({ archetype: 'sithInquisitor', weapon: 'lightsaber', forceChoke: 2, forceLightning: 25 })).toBe('lightning');
    expect(subdueFor({ archetype: 'sithWarrior', weapon: 'lightsaber' })).toBeNull();
    expect(subdueFor({ archetype: 'mandalorian', weapon: 'slugRifle' })).toBe('snare');
    expect(subdueFor({ archetype: 'bountyHunter', weapon: 'blasterPistol' })).toBe('snare');
    expect(subdueFor({ archetype: 'soldier', weapon: 'blasterRifle' })).toBe('stunBolt');
    expect(subdueFor({ archetype: 'soldier', weapon: 'heavy' })).toBeNull();
    expect(subdueFor({ archetype: 'civilian', weapon: 'melee', weaponName: 'electrostaff' })).toBe('stunMelee');
    expect(subdueFor({ archetype: 'yuuzhanVongWarrior', weapon: 'melee', weaponName: 'amphistaff' })).toBeNull();
  });
});

describe('intent shifts the hit location (no aimed strike, no -2)', () => {
  it('kill: torso and head; disarm: the weapon arm and hand', () => {
    const base = landing(null);
    const kill = landing('kill');
    const disarm = landing('disarm');
    const vital = (s: Record<string, number>) => (s['torso'] ?? 0) + (s['head'] ?? 0);
    expect(vital(kill.share)).toBeGreaterThan(vital(base.share) + 0.2);
    expect((disarm.share['rightArm'] ?? 0) + (disarm.share['rightHand'] ?? 0)).toBeGreaterThan(0.38);
    expect(disarm.share['rightArm']!).toBeGreaterThan(disarm.share['leftArm']!);
    expect(kill.mortal).toBeGreaterThan(0);
  });
  it('the weights follow the defender\'s weapon hand', () => {
    expect(intentWeights('disarm', 'left').leftArm).toBe(INTENT_WEIGHTS.disarm.weaponArm);
    expect(intentWeights('disarm', 'left').rightArm).toBe(INTENT_WEIGHTS.disarm.offArm);
  });
  it('a striker with an intent has no aimed-strike modifier on its rolls', () => {
    const d = runUntilBeat(startDuel(forceUser('A', 50), [{ ...forceUser('B', 50), intent: 'kill' }], seedRng('noaim')), REAL, 0, 'toEnd', 500).state as DuelState;
    const mods = d.log.flatMap((r) => [...(r.rollA?.modifiers ?? []), ...(r.rollB?.modifiers ?? [])]).map((m) => m.source);
    expect(mods.some((m) => /aim/i.test(m))).toBe(false);
  });
});

describe('capture by subduing (D-262)', () => {
  it('a subduing hit drains Vitality and never wounds; armor stops a stun bolt but not a net or a choke', () => {
    const t = { ...forceUser('T', 40), armor: 'heavy' as const };
    const bolt = subdueFighter(t, 'solid', 'blasterRifle', 'stunBolt');
    expect(bolt.hit.severity).toBeNull();
    expect(bolt.f.wounds.length).toBe(0);
    expect(bolt.hit.vitalityLost).toBe(10); // 20 x 1.0 - heavy armor 10
    expect(subdueFighter(t, 'solid', 'lightsaber', 'choke').hit.vitalityLost).toBe(18);
    expect(subdueFighter(t, 'solid', 'blasterPistol', 'snare').hit.stun).toBe('snare');
  });
  it('the fight ends in capture when the player is Spent; the capturers never wound', () => {
    let captured = 0;
    for (let i = 0; i < 60; i++) {
      const pc = forceUser('PC', 30);
      const d = runUntilBeat(startDuel(pc, [stunTrooper('t1', 45), stunTrooper('t2', 45), stunTrooper('t3', 45)], seedRng(`cap${i}`)), REAL, 0, 'toEnd', 3000).state;
      expect(d.a.wounds.length, `seed ${i}`).toBe(0);
      if (d.end?.reason === 'captured') {
        captured++;
        expect(d.end.winner).toBe('B');
        expect(d.a.vitality).toBe(0);
        expect(d.a.out).toBe(true);
      }
    }
    expect(captured).toBeGreaterThan(20);
  });
  it('capturedNow needs a capturing opponent with a means still engaged', () => {
    const base = startDuel({ ...forceUser('PC', 30), vitality: 0 }, [stunTrooper('t', 40)], seedRng('cn'));
    expect(capturedNow(base)).toBe(true);
    expect(capturedNow({ ...base, opponents: [{ ...stunTrooper('t', 40), intent: 'kill' }] })).toBe(false);
    expect(capturedNow({ ...base, opponents: [{ ...stunTrooper('t', 40), out: true }] })).toBe(false);
  });
});

describe('Sith tactical withdrawal (D-263)', () => {
  it('a losing Sith withdraws at its chance; one with no chance never does', () => {
    let withdrew = 0;
    let never = 0;
    for (let i = 0; i < 80; i++) {
      const a = runUntilBeat(startDuel(forceUser('PC', 60), [{ ...forceUser('S', 45), withdraw: 0.3 }], seedRng(`tw${i}`)), REAL, 0, 'toEnd', 3000).state;
      if (a.opponents[0]!.yielded === 'withdrew') {
        withdrew++;
        expect(a.end).toEqual({ winner: 'A', reason: 'yielded' });
        expect(a.log.at(-1)!.notes.some((n) => /withdraws/.test(n))).toBe(true);
      }
      const b = runUntilBeat(startDuel(forceUser('PC', 60), [{ ...forceUser('S', 45), withdraw: 0 }], seedRng(`tw${i}`)), REAL, 0, 'toEnd', 3000).state;
      if (b.opponents[0]!.yielded === 'withdrew') never++;
    }
    expect(withdrew).toBeGreaterThan(10);
    expect(never).toBe(0);
  });
  it('no withdrawal in a spar', () => {
    const d = runUntilBeat(startDuel(forceUser('PC', 60), [{ ...forceUser('S', 45), withdraw: 1 }], seedRng('sp')), { ...REAL, sparring: 'trainingSaber' }, 0, 'toEnd', 3000).state;
    expect(d.opponents[0]!.yielded).toBeUndefined();
  });
});

describe('the disengage contest (D-264)', () => {
  it('d20 + Agility / 10 against d20 + the opponent\'s skill / 10, on the duel\'s stream', () => {
    const d = startDuel(forceUser('PC', 40), [forceUser('B', 40)], seedRng('dis'));
    const c = disengageContest(d);
    expect(c.ok).toBe(c.mine.total > c.theirs.total);
    expect(c.duel.rng).not.toEqual(d.rng);
    expect(disengageContest(d)).toEqual(c);
  });
});

describe('severing (D-260)', () => {
  it('a lightsaber severs as before; a blade only on a critical against an unarmored target who is not a Force user', () => {
    expect(severs('lightsaber', 'leftArm', 40)).toBe(true);
    expect(severs('lightsaber', 'torso', 60)).toBe(false);
    expect(severs('melee', 'leftArm', 25, { quality: 'critical', armor: 'none', forceUser: false })).toBe(true);
    expect(severs('melee', 'leftArm', 15, { quality: 'critical', armor: 'none', forceUser: false })).toBe(false);
    expect(severs('melee', 'leftArm', 40, { quality: 'clean', armor: 'none', forceUser: false })).toBe(false);
    expect(severs('melee', 'leftArm', 40, { quality: 'critical', armor: 'light', forceUser: false })).toBe(false);
    expect(severs('melee', 'leftArm', 40, { quality: 'critical', armor: 'none', forceUser: true })).toBe(false);
    expect(severs('blasterRifle', 'leftArm', 60, { quality: 'critical', armor: 'none', forceUser: false })).toBe(false);
  });
  it('an amphistaff on a Jedi never severs; on an unarmored soldier it can', () => {
    let rng: RngState = seedRng('amph');
    let jedi = 0;
    let soldier = 0;
    for (let i = 0; i < 3000; i++) {
      const a = damageFighter(forceUser('J', 50), 'critical', 25, 'melee', REAL, rng, 0, 1, false, 'leftArm');
      rng = a.rng;
      if (a.hit.severed) jedi++;
      const b = damageFighter({ ...forceUser('S', 30), forceSense: 0, forceResistance: 0, armor: 'none' }, 'critical', 25, 'melee', REAL, rng, 0, 1, false, 'leftArm');
      rng = b.rng;
      if (b.hit.severed) soldier++;
    }
    expect(jedi).toBe(0);
    expect(soldier).toBeGreaterThan(0);
  });
});

describe('in the game', () => {
  async function knight(seed: string) {
    const input = testStartInput({ name: 'Kael Dorran', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
    return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
  }
  it('a dev duelist (a Sith Lord) kills; troopers kill; /intent changes it; the block states each intent', async () => {
    let s = runDevCommand(REGISTRY, await knight('in1'), '/fight 1 duelist at -10').state;
    expect((s.combat.active!.duel as DuelState).opponents[0]!.intent).toBe('kill');
    s = runDevCommand(REGISTRY, s, '/intent disarm').state;
    expect((s.combat.active!.duel as DuelState).opponents[0]!.intent).toBe('disarm');
    const pre = s;
    const after = runDevCommand(REGISTRY, s, '/exchanges 2').state;
    expect(describeCombat({ ...combatDraft(pre, after, false, [])!, quiet: false }).join('\n')).toMatch(/Intent: Duelist \d+ strikes to disarm \(the weapon hand and the limbs\)\./);
    const t = runDevCommand(REGISTRY, await knight('in2'), '/fight 3 trooper').state;
    expect((t.combat.active!.duel as DuelState).opponents.every((o) => o.intent === 'kill')).toBe(true);
  });
  it('troopers sent to take the player alive fire on stun; the block says so; a capture ends with the player taken', async () => {
    const s0 = await knight('in4');
    const s = runDevCommand(REGISTRY, s0, '/fight 6 elite alive').state;
    const d = s.combat.active!.duel as DuelState;
    expect(d.opponents.every((o) => o.intent === 'capture' && o.subdue === 'stunBolt')).toBe(true);
    const after = runDevCommand(REGISTRY, s, '/exchanges 3').state;
    expect(describeCombat({ ...combatDraft(s, after, false, [])!, quiet: false }).join('\n')).toMatch(/fights to capture: subdues with blaster bolts on stun \(no wounds; takes Kael Dorran captive when Spent\)/);
    const end = runDevCommand(REGISTRY, s, '/exchanges 400').state;
    const last = end.combat.last!;
    expect((last.duel as DuelState).a.wounds.length).toBe(s0.health.wounds.length);
    if (last.reason === 'captured') expect(last.playerFate).toBe('captured');
  });
  it('the narrator\'s wantAliveRefs make an opponent with a means capture; one with none keeps its intent', async () => {
    let s = await knight('in3');
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Jango Fett', species: 'human', faction: 'mandalorians', role: 'bountyHunter', ageApprox: 35, description: 'paid to bring the Jedi in alive' }, { type: 'combatStarted', opponentRefs: ['tmp:1'], stakes: 'serious', terrainTags: [], wantAliveRefs: ['tmp:1'] }], { source: 'ai' }).state;
    expect(s.combat.pending?.wantAlive.length).toBe(1);
    s = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: true }], { source: 'engine' }).state;
    const o = (s.combat.active!.duel as DuelState).opponents[0]!;
    expect(o.subdue).toBe('snare');
    expect(o.intent).toBe('capture');
    let v = await knight('in5');
    v = applyEvents(REGISTRY, v, [{ type: 'npcIntroduced', key: 'tmp:2', name: 'Nas Ghent', species: 'yuuzhanVong', faction: 'independent', role: 'soldier', ageApprox: 30, description: 'an amphistaff in hand, sent to take the Jedi alive' }, { type: 'combatStarted', opponentRefs: ['tmp:2'], stakes: 'serious', terrainTags: [], wantAliveRefs: ['tmp:2'] }], { source: 'ai' }).state;
    v = applyEvents(REGISTRY, v, [{ type: 'fightBegun', fromPending: true }], { source: 'engine' }).state;
    const w = (v.combat.active!.duel as DuelState).opponents[0]!;
    expect(w.subdue ?? null).toBeNull();
    expect(w.intent).toBe('kill');
  });
});
