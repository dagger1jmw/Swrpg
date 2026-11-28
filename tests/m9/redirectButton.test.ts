// m9-redirect-button (Jared, 28 Nov 2026; D-585): the redirect (D-583) on the duel panel.
import { describe, expect, it } from 'vitest';
import { startDuel, type DuelState, type Fighter } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { redirectButtonView } from '../../src/ui/duelPanel';
import { forceUser } from '../support/duelSim';
import { devCharacter } from '../support/fightHarness';

const jedi = (over: Partial<Fighter> = {}): Fighter => ({ ...forceUser('pc', 40), name: 'Jared', form: 'shien', ...over });
const shooter = (id: string, over: Partial<Fighter> = {}): Fighter => forceUser(id, 30, { name: id, weapon: 'blasterPistol', form: null, ...over });
const duelOf = (a: Fighter, ops: Fighter[], target = 0): DuelState => ({ ...startDuel(a, ops, seedRng('rb')), target });

describe('the Deflect back button: when it shows, and why it is disabled (D-585)', () => {
  it('a lightsaber and one engaged blaster shooter: shown, enabled, one choice that is the redirect at that shooter', () => {
    const v = redirectButtonView(duelOf(jedi(), [shooter('Thug 1')]));
    expect(v).toEqual({ show: true, reason: null, choices: [{ label: 'Thug 1', turnLabel: 'Deflect the bolts back at Thug 1', action: { action: 'sequence', steps: [{ kind: 'redirect' }], targetRef: 'Thug 1' } }] });
  });
  it('nobody shoots (a saber duel): hidden', () => {
    expect(redirectButtonView(duelOf(jedi(), [forceUser('Sith', 40)])).show).toBe(false);
  });
  it('no lightsaber in hand: shown disabled with the reason', () => {
    const lost = jedi({ weapon: 'unarmed', saberLost: { weapon: 'lightsaber', skillId: 'soresu', level: 40, form: 'shien' } });
    for (const a of [lost, jedi({ weapon: 'blasterPistol', form: null })]) {
      const v = redirectButtonView(duelOf(a, [shooter('Thug 1')]));
      expect(v).toMatchObject({ show: true, reason: 'needs a lightsaber in hand to send the bolts back', choices: [] });
    }
  });
  it('slugthrowers only: disabled, slugs melt on the blade', () => {
    expect(redirectButtonView(duelOf(jedi(), [shooter('Mando', { weapon: 'slugRifle' })]))).toMatchObject({ show: true, reason: 'slugs melt on the blade: they cannot be sent back', choices: [] });
  });
  it('no blaster fire at the player (the shooters fight an ally): disabled with that reason', () => {
    const v = redirectButtonView(duelOf(jedi(), [forceUser('Sith', 40), shooter('Thug 1', { engagedElsewhere: true })]));
    expect(v).toMatchObject({ show: true, reason: 'no blaster fire at you: the shooters are fighting an ally', choices: [] });
  });
  it('a shooter that is down does not count', () => {
    expect(redirectButtonView(duelOf(jedi(), [forceUser('Sith', 40), shooter('Thug 1', { out: true })])).show).toBe(false);
  });
});

describe('several shooters: the button asks which, the default first (D-585)', () => {
  const ops = [forceUser('Vibroblade thug', 30, { weapon: 'melee', form: null }), shooter('Thug 1'), shooter('Thug 2'), shooter('Thug 3', { out: true })];
  it('the target is not a shooter: the first engaged shooter is the default, then the others; none that is down', () => {
    const v = redirectButtonView(duelOf(jedi(), ops, 0));
    expect(v.choices.map((c) => c.label)).toEqual(['Thug 1 (default)', 'Thug 2']);
    expect(v.choices.map((c) => c.action.targetRef)).toEqual(['Thug 1', 'Thug 2']);
  });
  it('the target shoots: it is the default (the typed action picks it too)', () => {
    expect(redirectButtonView(duelOf(jedi(), ops, 2)).choices.map((c) => c.label)).toEqual(['Thug 2 (default)', 'Thug 1']);
  });
});

describe('the button gives the same result as the typed redirect for the same roll (D-585)', () => {
  async function fight(): Promise<GameState> {
    let s = await devCharacter('knight', 30);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'thug', count: 3 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    return resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
  }
  const after = (s: GameState, from: number) => {
    const d = (s.combat.active?.duel ?? s.combat.last?.duel) as DuelState;
    return { log: d.log.slice(from), advantage: d.advantage, target: d.opponents[d.target]?.id, opponents: d.opponents, a: d.a, rng: s.meta.rngState };
  };
  it('for each shooter: typed "Deflect the blaster bolts back at <name>" and the button choice resolve identically', async () => {
    const s = await fight();
    const d = s.combat.active!.duel as DuelState;
    const v = redirectButtonView(d);
    expect(v.choices.length).toBeGreaterThan(1);
    for (const c of v.choices) {
      const name = d.opponents.find((o) => o.id === c.action.targetRef)!.name;
      const typed = resolveTurn(REGISTRY, s, null, { text: `Deflect the blaster bolts back at ${name}` }).state;
      const button = resolveTurn(REGISTRY, s, null, { beat: c.action }).state;
      const t = after(typed, d.log.length);
      expect(t.log.filter((r) => r.step !== undefined).map((r) => [r.targetId, r.redirect !== undefined])).toEqual([[c.action.targetRef, true]]);
      expect(after(button, d.log.length)).toEqual(t);
    }
  });
});
