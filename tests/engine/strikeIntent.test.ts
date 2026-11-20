// D-260 strike intent (kill, disarm, capture) and the severing rule for blades.
import { describe, expect, it } from 'vitest';
import { INTENT_WEIGHTS, strikeIntentFor } from '../../src/data/combat.config';
import { damageFighter, intentWeights, runUntilBeat, startDuel, type DuelState } from '../../src/engine/duel';
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
function landing(intent: 'kill' | 'disarm' | 'capture' | null): { share: Record<string, number>; mortal: number } {
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

describe('intent by archetype and scene', () => {
  it('Jedi disarm, and kill only in lethal stakes; Sith, soldiers, mercenaries, Mandalorians, the Vong kill; capture wins', () => {
    expect(strikeIntentFor('jediGuardian', 'serious', false)).toBe('disarm');
    expect(strikeIntentFor('jediConsular', 'lethal', false)).toBe('kill');
    for (const a of ['sithWarrior', 'sithInquisitor', 'soldier', 'bountyHunter', 'mandalorian', 'yuuzhanVongWarrior', 'civilian']) expect(strikeIntentFor(a, 'serious', false), a).toBe('kill');
    expect(strikeIntentFor('sithWarrior', 'lethal', true)).toBe('capture');
    expect(strikeIntentFor('bountyHunter', 'serious', true)).toBe('capture');
  });
});

describe('intent shifts the hit location (no aimed strike, no -2)', () => {
  it('kill: torso and head; disarm: the weapon arm and hand; capture: limbs, and no killing blow', () => {
    const base = landing(null);
    const kill = landing('kill');
    const disarm = landing('disarm');
    const capture = landing('capture');
    const vital = (s: Record<string, number>) => (s['torso'] ?? 0) + (s['head'] ?? 0);
    expect(vital(kill.share)).toBeGreaterThan(vital(base.share) + 0.2);
    expect((disarm.share['rightArm'] ?? 0) + (disarm.share['rightHand'] ?? 0)).toBeGreaterThan(0.38);
    expect(disarm.share['rightArm']!).toBeGreaterThan(disarm.share['leftArm']!);
    expect(vital(capture.share)).toBeLessThan(0.2);
    expect(capture.mortal).toBe(0);
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
    s = runDevCommand(REGISTRY, s, '/intent capture').state;
    expect((s.combat.active!.duel as DuelState).opponents[0]!.intent).toBe('capture');
    const pre = s;
    const after = runDevCommand(REGISTRY, s, '/exchanges 2').state;
    expect(describeCombat({ ...combatDraft(pre, after, false, [])!, quiet: false }).join('\n')).toMatch(/Intent: Duelist \d+ strikes to capture \(limbs and the weapon hand; no killing blow\)\./);
    const t = runDevCommand(REGISTRY, await knight('in2'), '/fight 3 trooper').state;
    expect((t.combat.active!.duel as DuelState).opponents.every((o) => o.intent === 'kill')).toBe(true);
  });
  it('the narrator\'s wantAliveRefs make that opponent strike to capture', async () => {
    let s = await knight('in3');
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Asajj Ventress', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 30, description: 'sent to bring the Jedi in alive' }, { type: 'combatStarted', opponentRefs: ['tmp:1'], stakes: 'serious', terrainTags: [], wantAliveRefs: ['tmp:1'] }], { source: 'ai' }).state;
    expect(s.combat.pending?.wantAlive.length).toBe(1);
    s = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: true }], { source: 'engine' }).state;
    expect((s.combat.active!.duel as DuelState).opponents[0]!.intent).toBe('capture');
  });
});
