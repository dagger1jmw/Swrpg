// D-256 morale: an NPC opponent checks when it takes a severe or worse wound, is Spent, or its side is losing badly;
// it surrenders or flees by its archetype's group; a named one's surrender opens the fate choice; the block says it.
import { describe, expect, it } from 'vitest';
import { MORALE, moraleFor, type MoraleProfile } from '../../src/data/combat.config';
import { runUntilBeat, startDuel, type DuelState, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { buildMinionFighter } from '../../src/features/combat/build';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { combatDraft } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';
import { CLONE_WARS_DATE } from '../support/dates';
import { forceUser, REAL } from '../support/duelSim';

const run = (b: Fighter[], seed: string, a: Fighter = forceUser('A', 60)): DuelState => runUntilBeat(startDuel(a, b, seedRng(seed)), REAL, 0, 'toEnd', 3000).state;
const withMorale = (f: Fighter, m: MoraleProfile): Fighter => ({ ...f, morale: m });

describe('the morale rule in the duel engine', () => {
  it('a duelist who breaks early yields often; one who never breaks never does; no morale is the old engine', () => {
    let early = 0;
    let never = 0;
    let none = 0;
    for (let i = 0; i < 300; i++) {
      if (run([withMorale(forceUser('B', 50), { group: 'early', surrender: 0.5 })], `e${i}`).opponents[0]!.yielded) early++;
      if (run([withMorale(forceUser('B', 50), { group: 'never', surrender: 0 })], `e${i}`).opponents[0]!.yielded) never++;
      if (run([forceUser('B', 50)], `e${i}`).opponents[0]!.yielded) none++;
    }
    expect(early).toBeGreaterThan(30);
    expect(never).toBe(0);
    expect(none).toBe(0);
  });
  it('a broken fighter is out with the reason on the card and nothing hits it after; a lone one ends the fight as yielded', () => {
    for (let i = 0; i < 300; i++) {
      const d = run([withMorale(forceUser('B', 50), { group: 'early', surrender: 0.5 })], `y${i}`);
      const b = d.opponents[0]!;
      if (!b.yielded) continue;
      expect(b.out).toBe(true);
      expect(d.end).toEqual({ winner: 'A', reason: 'yielded' });
      const at = d.log.findIndex((r) => r.notes.some((n) => /morale breaks: (surrenders|disengages and flees), out of the fight/.test(n)));
      expect(at).toBe(d.log.length - 1);
      // The trigger is on the same exchange: a severe or worse wound on it, or it was Spent.
      const last = d.log[at]!;
      expect(!!(last.hit && last.hit.by === 'A' && (last.hit.severed || ['severe', 'critical', 'mortal'].includes(last.hit.severity ?? ''))) || b.vitality <= 0).toBe(true);
      return;
    }
    throw new Error('no break in 300 duels');
  });
  it('a group losing badly: when half its side is out, the standing ones check', () => {
    let broke = 0;
    for (let i = 0; i < 200; i++) {
      const b = [0, 1, 2, 3].map((k) => withMorale(forceUser(`m${k}`, 20, { minion: true, vitality: 30, maxVitality: 30 }), { group: 'early', surrender: 0 }));
      const d = run(b, `g${i}`);
      const halfAt = d.log.findIndex((r) => r.notes.some((n) => /morale breaks/.test(n)));
      if (halfAt < 0) continue;
      broke++;
    }
    expect(broke).toBeGreaterThan(20);
  });
  it('the same seed gives the same breaks (the duel stream); morale off gives none', () => {
    const b = withMorale(forceUser('B', 50), { group: 'early', surrender: 0.5 });
    expect(JSON.stringify(run([b], 'det').log)).toBe(JSON.stringify(run([b], 'det').log));
    const cfg = MORALE as { enabled: boolean };
    cfg.enabled = false;
    try {
      for (let i = 0; i < 100; i++) expect(run([b], `off${i}`).opponents[0]!.yielded).toBeUndefined();
    } finally {
      cfg.enabled = true;
    }
  });
});

describe('morale profiles', () => {
  it('by archetype and kind: early, average, late, never', async () => {
    expect(moraleFor('civilian').group).toBe('early');
    expect(moraleFor('bountyHunter').group).toBe('early');
    expect(moraleFor('soldier').group).toBe('average');
    expect(moraleFor('sithWarrior').group).toBe('late');
    expect(moraleFor('mandalorian').group).toBe('late');
    expect(moraleFor('yuuzhanVongWarrior').group).toBe('never');
    expect(moraleFor('soldier', 'battleDroid').group).toBe('never');
    expect(moraleFor('civilian', 'beast')).toEqual({ group: 'early', surrender: 0 });
    const input = testStartInput({ name: 'K', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
    const s = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: 'c-mp', branchId: 'b' }, 'mp')).state;
    expect(buildMinionFighter(s, 'thug', 2, 0, 'f').morale?.group).toBe('early');
    expect(buildMinionFighter(s, 'trooper', 2, 0, 'f').morale?.group).toBe('average');
    expect(buildMinionFighter(s, 'battleDroid', 2, 0, 'f').morale?.group).toBe('never');
    // A dev duelist is a Sith Lord (late); /archetype sets the fighter's morale too.
    let f = runDevCommand(REGISTRY, s, '/fight 1 duelist at -10').state;
    expect((f.combat.active!.duel as DuelState).opponents[0]!.morale?.group).toBe('late');
    f = runDevCommand(REGISTRY, f, '/archetype bountyHunter').state;
    expect((f.combat.active!.duel as DuelState).opponents[0]!.morale).toEqual(moraleFor('bountyHunter'));
  });
});

describe('in the game: a named opponent\'s surrender opens the fate choice; the block says it', () => {
  it('a dev duelist made to break early: surrenders, the fight ends won (yielded), Spare / Capture / Kill offered', async () => {
    const input = testStartInput({ name: 'K', rank: 'knight', age: 30, startDate: CLONE_WARS_DATE, startSecond: DEFAULT_START_SECOND });
    for (let i = 0; i < 80; i++) {
      const s0 = (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-ms${i}`, branchId: 'b' }, `ms${i}`)).state;
      let s: GameState = runDevCommand(REGISTRY, s0, '/fight 1 duelist at -10').state;
      const active = s.combat.active!;
      const duel = active.duel as DuelState;
      s = { ...s, combat: { ...s.combat, active: { ...active, duel: { ...duel, opponents: duel.opponents.map((o) => ({ ...o, morale: { group: 'early', surrender: 1 } })) } } } };
      const pre = s;
      const after = runDevCommand(REGISTRY, s, '/exchanges 400').state;
      const last = after.combat.last!;
      if (last.reason !== 'yielded') continue;
      expect(last.outcome).toBe('won');
      const npcId = Object.values(after.npcs.byId).find((n) => n.name.startsWith('Duelist'))!.id;
      expect(after.combat.fates.some((f) => f.npcId === npcId)).toBe(true);
      const c = combatDraft(pre, after, false, [])!;
      expect(c.fighters.find((f) => f.id !== 'pc')!.status).toBe('Surrendered');
      expect(describeCombat({ ...c, quiet: false }).join('\n')).toMatch(/Morale: #\d+ Duelist \d+ surrenders\. Each is out of the fight/);
      return;
    }
    throw new Error('no surrender in 80 seeded duels');
  });
});
