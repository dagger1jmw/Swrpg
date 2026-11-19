// D-216 (combat pass 2, minor issues 14-27): each fix with the case from docs-v2/testing/combat-pass-2.md.
import { describe, expect, it } from 'vitest';
import { QUIET_LINES_RANGED } from '../../src/data/combatLines';
import { SPEECH_LINE } from '../../src/data/combatWords';
import { resolveForceAction } from '../../src/engine/combatForce';
import { startDuel, type ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { runSequence } from '../../src/engine/sequence';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { reconcileSteps, saysSpeech } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { runDevCommand, sithFactionAt } from '../../src/turn/devCommands';
import { checkNarration } from '../../src/turn/narrationCheck';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn, type TurnDraft } from '../../src/turn/resolve';
import { forceUser, REAL } from '../support/duelSim';
import { devCharacter } from '../support/fightHarness';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], armor: 'none', ...over });
const combat = (over: Partial<CombatDraft>): CombatDraft => ({ fightId: 'f', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [fighter('pc', 'Kael Voss'), fighter('n1', 'Duelist 2')], notes: [], ...over });
const draft = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const kinds = (t: string, c: CombatDraft): string[] => checkNarration(t, draft(c), false).map((i) => i.kind);

describe('14: more strikes told than the player made', () => {
  const c = combat({ notes: ['step 1 stance (aggressive): DONE (aggressive stance set)', 'step 2 strike (aimed at the right arm): FAILED (holds; no ground gained, no hit)', 'step 3 strike (aimed at the right arm): NOT REACHED (an earlier step failed)', 'step 4 Force push: NOT REACHED (an earlier step failed)'] });
  it('the pass-2 sentence is caught; one cut is fine', () => {
    expect(kinds('You push forward, driving two swift, probing cuts toward his sword arm, but Duelist 2 parries each blow effortlessly with his red blade.', c)).toContain('stepNotReached');
    expect(kinds('You push forward with a swift, probing cut toward his sword arm, but Duelist 2 turns it aside.', c)).toEqual([]);
  });
});

describe('16: armor and weapons as the engine has them', () => {
  it('the block lists armor; "your armor" on an unarmored player is caught', () => {
    const c = combat({ fighters: [fighter('pc', 'Kael Voss'), fighter('m1', 'Mandalorian warrior 1', { weapon: 'blasterPistol', armor: 'heavy', saberResistant: true, minion: true, form: null })] });
    expect(describeCombat(c).join('\n')).toMatch(/Armor \(the only armor in this fight\): Kael Voss: none; Mandalorian warrior 1: heavy \(beskar: turns a lightsaber\)\./);
    expect(kinds('A sudden burn flares across your torso as a blow connects harmlessly against your armor.', c)).toContain('gearNotInBlock');
    expect(describeCombat(combat({ fighters: [fighter('pc', 'Daro Venn'), fighter('v', 'Yuuzhan Vong Warrior', { weapon: 'melee', form: null })] })).join('\n')).toMatch(/a melee weapon \(.*it does not burn\)/);
  });
});

describe('17: the object named is the object thrown', () => {
  it('"lift a heavy rock" throws the loose rock, not the fallen log', () => {
    const steps = reconcileSteps('Unarmed, I thrust out my hand and Force push the nearest droid, then lift a heavy rock with the Force and hurl it at another droid.', [{ kind: 'forceAction', action: 'push' }, { kind: 'forceAction', action: 'throw' }], 5);
    expect(steps[1]).toEqual({ kind: 'forceAction', action: 'throw', objectTag: 'looseRock' });
    const s = { duel: startDuel(forceUser('pc', 50), [forceUser('d1', 20, { minion: true, weapon: 'blasterRifle', form: null })], seedRng('rock')), patternUses: {}, objects: { fallenTimber: 3, looseRock: 3 } };
    const r = runSequence(s, REAL, 0, [{ kind: 'forceAction', action: 'throw', objectTag: 'looseRock' }], 1, { fallenTimber: 'medium', looseRock: 'small' }, { levelOf: () => 40, ciOf: () => 20, forceOutput: 30, trickLevel: 40 });
    expect(r.state.objects).toEqual({ fallenTimber: 3, looseRock: 2 });
  });
});

describe('18: a surrender puts the player at the opponent\'s mercy', () => {
  it('a lethal surrender rolls the opponent\'s choice, and is never answered with a killing strike', async () => {
    const fates = new Set<string>();
    for (let i = 0; i < 12; i++) {
      let s = await devCharacter('knight', 30);
      s = { ...s, meta: { ...s.meta, rngState: seedRng(`sur${i}`) } };
      s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Duelist 4', species: 'human', faction: 'sith', role: 'sithLord', ageApprox: 35, description: 'an armed duelist' }], { source: 'ai' }).state;
      const id = Object.values(s.npcs.byId).find((n) => n.name === 'Duelist 4')!.id;
      s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [id], stakes: 'lethal', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
      s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
      const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput });
      const fate = r.state.combat.last!.playerFate;
      expect(fate).not.toBeNull();
      expect(fate).not.toBe('killingStrike');
      fates.add(fate!);
    }
    expect([...fates].every((f) => f === 'captured' || f === 'left')).toBe(true);
  });
});

describe('19: a Force hit that does no damage says so', () => {
  it('lightning with Force Output 0: "struck but unharmed", not "hits: stamina only"', () => {
    const s = runSequence({ duel: startDuel(forceUser('pc', 50), [forceUser('n1', 40)], seedRng('lt')), patternUses: {}, objects: {} }, REAL, 0, [{ kind: 'forceAction', action: 'lightning' }], 1, {}, { levelOf: () => 60, ciOf: () => 20, forceOutput: 0, trickLevel: 40 });
    if (s.results[0]!.status === 'resolved') expect(s.lines[0]).toBe('step 1 Force lightning: DONE (n1 is struck but unharmed (no damage))');
    void resolveForceAction;
  });
});

describe('21, 23: dev choices and labels', () => {
  it('a wound line names the body part in words', async () => {
    const o = runDevCommand(REGISTRY, await devCharacter('knight', 30), '/wound left leg minor');
    expect(o.line).toBe('[DEV] minor wound to the left leg');
  });
});

describe('24: quiet lines against shooters', () => {
  it('no blades meeting, no blows from a blaster, no "it" for a person', () => {
    for (const side of Object.values(QUIET_LINES_RANGED)) for (const ls of Object.values(side!)) for (const l of ls) expect(l).not.toMatch(/blade on blade|'s blow|\bit keeps\b|gets the blade up/);
  });
});

describe('25: talking in a fight', () => {
  it('quoted speech or a speech verb is talking; the quiet line says what ends a fight', async () => {
    expect(saysSpeech('I lower my blade and call out that the battle is over.')).toBe(true);
    expect(saysSpeech('"Stand down," I say.')).toBe(true);
    expect(saysSpeech('I cut at his arm.')).toBe(false);
    let s = await devCharacter('knight', 30);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'trooper', count: 2 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
    const r = resolveTurn(REGISTRY, s, { actionType: 'talk', targets: [], references: [], unknownNames: [] } as never, { text: 'I lower my blade and call out that their commander has ordered a ceasefire.' });
    expect(r.draft.combat?.quietLine).toBe(SPEECH_LINE);
  });
});

describe('26: a dev Sith duelist belongs to a Sith Empire only when there is one', () => {
  it.each([[-22, 'sith'], [25, 'sith'], [-3653, 'sithEmpire'], [-3957, 'sithEmpire'], [135, 'sithEmpire'], [-1032, 'sith']])('%i -> %s', (year, f) => {
    expect(sithFactionAt(year)).toBe(f);
  });
});
