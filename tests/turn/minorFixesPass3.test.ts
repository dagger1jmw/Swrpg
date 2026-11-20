// D-242 (combat pass 3, the minor issues 8-24 and the captors after a fight). Each case uses the pass-3 report's own
// sentences or situations.
import { describe, expect, it } from 'vitest';
import type { DuelState, ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { reconcileSteps, type CombatDraft, type CombatFighterView } from '../../src/turn/combatTurn';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { describeCombat, selectCaptors, stateBlock } from '../../src/turn/context';
import { runDevCommand } from '../../src/turn/devCommands';
import { fightCalls } from '../../src/turn/fightChoices';
import { captorIssues, checkNarration, mechanicalTerm, repairWording } from '../../src/turn/narrationCheck';
import type { CombatActionInput } from '../../src/turn/record';
import { fightMinionRef, resolveIntentRefs } from '../../src/turn/refs';
import { resolveTurn, type TurnDraft } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], ...over });
const combat = (over: Partial<CombatDraft> = {}): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [fighter('pc', 'Joren Kast', { form: 'soresu' }), fighter('n1', 'Duelist 1')], notes: [], ...over });
const draft = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const kinds = (text: string, c: CombatDraft): string[] => checkNarration(text, draft(c), false).map((i) => i.kind);
const droid = (k: number): CombatFighterView => fighter(`d${k}`, `B1 battle droid ${k}`, { minion: true, weapon: 'blasterRifle', form: null });

async function knight(seed = 'm3', date = TEST_START_DATE): Promise<GameState> {
  const input = testStartInput({ name: 'Joren Kast', rank: 'knight', age: 30, startDate: date, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
const dev = (s: GameState, t: string): GameState => {
  const o = runDevCommand(REGISTRY, s, t);
  if (!o.ok) throw new Error(o.line);
  return o.state;
};

describe('captors after a fight (D-242)', () => {
  const PASS3 = 'Immediately, the remaining war droids close in, heavy metallic servos grinding as cold, unyielding grips seize your arms and drag you back from the skirmish.';
  const TROOPERS = { kind: 'trooper', noun: 'trooper', group: '4 line troopers' };
  it('pass 3: line troopers captured the Padawan; "the remaining war droids" seizing her is a contradiction', () => {
    expect(captorIssues(PASS3, TROOPERS).map((i) => i.kind)).toEqual(['captorsWrong']);
    expect(captorIssues(PASS3, TROOPERS)[0]!.text).toMatch(/captured by 4 line troopers: the captors are troopers, not droids/);
    expect(captorIssues('The line troopers close in and seize your arms, dragging you past the wrecked war droids.', TROOPERS)).toEqual([]);
    expect(captorIssues('The troopers bind your wrists with binders.', TROOPERS)).toEqual([]);
    // Talk of droids that is not about the capture is fine; a named captor is not checked by kind.
    expect(captorIssues('The war droids you cut down lie in pieces across the courtyard.', TROOPERS)).toEqual([]);
    expect(captorIssues(PASS3, { kind: null, noun: 'kade', group: 'Kade' })).toEqual([]);
  });
  it('the fight records who captured the player; the block and the following scenes name them', async () => {
    let s = dev(await knight('cap'), '/fight 4 trooper');
    s = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput }).state;
    expect(s.combat.last!.playerFate).toBe('captured');
    expect(s.combat.last!.captors).toMatchObject({ group: '4 line troopers', kind: 'trooper', standing: 4, names: ['Line trooper 1', 'Line trooper 2', 'Line trooper 3', 'Line trooper 4'] });
    expect(selectCaptors(s)).toMatchObject({ group: '4 line troopers' });
    expect(stateBlock(s, makeEstimator(4)).text).toMatch(/CAPTIVE: the player character was captured by 4 line troopers \(Line trooper 1, Line trooper 2, Line trooper 3, Line trooper 4\)/);
    // Once moved (or a day later), the scene no longer carries it.
    expect(selectCaptors(dev(s, '/place a holding cell on Coruscant'))).toBeNull();
  });
  it('the block of the surrender turn has the captors line', () => {
    const c = combat({ fighters: [fighter('pc', 'Mira Tane'), fighter('t1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null })], ended: { outcome: 'lost', reason: 'surrendered', playerFate: 'captured', captors: { group: '4 line troopers', kind: 'trooper', standing: 4, names: ['Line trooper 1', 'Line trooper 2', 'Line trooper 3', 'Line trooper 4'] } } });
    expect(describeCombat(c).join('\n')).toMatch(/Captured by: 4 line troopers \(Line trooper 1, Line trooper 2, Line trooper 3, Line trooper 4, still standing\)\. Name these captors and no others\./);
  });
});

describe('narration fixes (issues 8, 9, 10, 11)', () => {
  it('8: "taking a light blow to your own ribs" with no hit on the player', () => {
    const c = combat({ narrate: [rec({ n: 15, kind: 'strike', striker: 'A', margin: 9, hit: { by: 'A', quality: 'solid', D: 30, part: 'leftLeg', W: 27, severity: 'severe', vitalityLost: 0, severed: false, avoided: false } as never })] });
    expect(kinds('You land a clean, grievous cut across your adversary\'s left leg, then press again, while taking a light blow to your own ribs.', c)).toContain('hitNotInLog');
  });
  it('9: blades locked with a droid that has a rifle; fine with a duelist', () => {
    const droids = combat({ fighters: [fighter('pc', 'Joren Kast'), droid(6)], narrate: [rec({ targetId: 'd6' })] });
    expect(kinds('B1 battle droid 6 remains, locking blades and exchanging blows in a tight duel.', droids)).toContain('gearNotInBlock');
    expect(kinds('You lock blades with Duelist 1 and hold.', combat())).not.toContain('gearNotInBlock');
  });
  it('10: more engine terms, and the repair\'s natural words for stamina', () => {
    for (const t of ['A severe stroke opens his leg.', 'A critical slug slams into your torso.', 'The glancing blow drains your stamina without piercing your defenses.', 'You do not reach your intended strikes.'])
      expect(mechanicalTerm(t), t).not.toBeNull();
    expect(repairWording('The glancing blow drains your stamina without breaking skin. Another one is taxing his stamina.')).toBe('The glancing blow wears you down without breaking skin. Another one is wearing him down.');
    expect(mechanicalTerm('the flurry wears you down')).toBeNull();
    // The noun has no natural swap; it is left alone rather than repaired into bad grammar.
    expect(mechanicalTerm('the surge leaves him standing firm with only a drain on his stamina')).toBeNull();
  });
  it('11: a long passage gets its key events listed in order', () => {
    const narrate = Array.from({ length: 12 }, (_, i) => rec({ n: i + 1, targetId: 'd1' }));
    narrate[4] = rec({ n: 5, kind: 'strike', striker: 'A', targetId: 'd1', hit: { by: 'A', quality: 'clean', D: 40, part: 'torso', W: 40, severity: 'moderate', vitalityLost: 0, severed: false, avoided: false } as never });
    const block = describeCombat(combat({ fighters: [fighter('pc', 'Dax Morrow', { weapon: 'blasterPistol', form: null }), fighter('d1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null, out: true })], narrate })).join('\n');
    expect(block).toMatch(/Key events \(tell each one, in order, however briefly\): #5 Dax Morrow hits Line trooper 1 \(torso, moderate\)\./);
  });
  it('13: unarmed means dodging, never turning a bolt aside', () => {
    const block = describeCombat(combat({ fighters: [fighter('pc', 'Sela Dorn', { weapon: 'unarmed', form: null }), droid(1)] })).join('\n');
    expect(block).toMatch(/Sela Dorn: unarmed \(no weapon: dodges bolts and blows, cannot turn them aside\)/);
  });
});

describe('engine and turn fixes (issues 15-22)', () => {
  it('15: a Sith acolyte attacking in a real fight carries a lightsaber, not a training saber', async () => {
    let s = await knight('acolyte');
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Sith Duelist', species: 'human', faction: 'sith', role: 'sithAcolyte', ageApprox: 25, description: 'a cloaked duelist with a crimson blade' }], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Sith Duelist')!.id;
    const real = applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [id], minionGroups: [], stakes: 'serious', terrainTags: [] }], { source: 'engine' }).state;
    expect((real.combat.active!.duel as DuelState).opponents[0]!.weapon).toBe('lightsaber');
  });
  it('16: a fate choice that lapses says so; a fighter left dying dies', async () => {
    let s = dev(await knight('fate'), '/fight 1 duelist at -45 stakes lethal');
    // The fate choice is the point: a Sith who withdraws (D-263) leaves none, so this one fights to the end.
    const act = s.combat.active!;
    s = { ...s, combat: { ...s.combat, active: { ...act, duel: { ...(act.duel as DuelState), opponents: (act.duel as DuelState).opponents.map((o) => ({ ...o, withdraw: 0 })) } } } };
    for (let i = 0; i < 5 && s.combat.active; i++) s = dev(s, '/exchanges 100');
    expect(s.combat.last!.outcome).toBe('won');
    const fate = s.combat.fates[0]!;
    expect(fate).toBeDefined();
    const o = runDevCommand(REGISTRY, s, '/time 23:00');
    expect(o.state.combat.fates).toEqual([]);
    const name = s.npcs.byId[fate.npcId]!.name;
    expect(o.notices.join('\n')).toMatch(new RegExp(fate.dying ? `${name} was left dying and did not survive` : `${name} was left where they fell`));
    if (fate.dying) expect(o.state.npcs.byId[fate.npcId]!.status).toBe('deceased');
  });
  it('17: a dying player\'s dev fight ends at once, as a typed one does', async () => {
    let s = dev(await knight('dying'), '/wound torso mortal');
    const o = runDevCommand(REGISTRY, s, '/fight 2 trooper');
    s = o.state;
    expect(s.combat.active).toBeNull();
    expect(s.combat.last).toMatchObject({ outcome: 'lost', reason: 'dying' });
    expect(o.report.join('\n')).toMatch(/dying and cannot fight: the fight ends at once/);
  });
  it('18: a stance the words never asked for is dropped; one they ask for stays', () => {
    const steps = [{ kind: 'stance', stance: 'defensive' }, { kind: 'maneuver', maneuver: 'position' }, { kind: 'strike' }];
    expect(reconcileSteps('I dive behind a stack of crates, draw my blaster pistol and fire back at the hunter.', steps, 4).map((x) => x.kind)).toEqual(['maneuver', 'strike']);
    expect(reconcileSteps('I keep low behind a broken wall and fire my blaster at the nearest trooper.', [{ kind: 'stance', stance: 'defensive' }, { kind: 'strike' }], 4).map((x) => x.kind)).toEqual(['strike']);
    expect(reconcileSteps('I sidestep the charge and cut at his torso.', [{ kind: 'stance', stance: 'defensive' }, { kind: 'strike' }], 4).map((x) => x.kind)).toEqual(['stance', 'strike']);
    expect(reconcileSteps('Defensively, I cut at his arm.', [{ kind: 'stance', stance: 'defensive' }, { kind: 'strike' }], 4).map((x) => x.kind)).toEqual(['stance', 'strike']);
  });
  it('19: a minion of the fight named as an NPC ref is not sent to review', async () => {
    const s = dev(await knight('ref'), '/fight 4 trooper');
    const intent = { actionType: 'fight', targets: ['npc:line-trooper-1'], references: [], unknownNames: [] } as never;
    const r = resolveIntentRefs(intent, () => null, fightMinionRef(s));
    expect(r.notes).toEqual(['intent target "npc:line-trooper-1" is Line trooper 1, a minion of this fight: not an NPC, not sent to review']);
    expect((r.intent as { unknownNames: string[] }).unknownNames).toEqual([]);
  });
  it('21: the fight\'s AI-call count leaves out 503s and timeouts, as the meter does', () => {
    const turn = (outcomes: string[]) => ({ calls: outcomes.map((outcome) => ({ outcome })), draft: { combat: { fightId: 'f' } as CombatDraft } });
    expect(fightCalls([turn(['http', 'http', 'ok']), turn(['timeout', 'ok', 'rateLimit:minute'])], 'f')).toBe(3);
  });
  it('22: the XP line shows the surrender factor; a severed limb in words; the dev line names the kind fielded', async () => {
    let s = dev(dev(await knight('xp'), '/fight 1 duelist at -40 stakes serious'), '/exchanges 2');
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput });
    expect(r.draft.applied.flatMap((a) => a.notes).join('\n')).toMatch(/combat XP [\d.]+ \(serious, lost, surrendered x0\.5\)/);
    s = dev(await knight('sev'), '/sever right arm');
    const o = runDevCommand(REGISTRY, await knight('sev'), '/sever right arm');
    expect(o.report.join('\n')).toMatch(/right arm severed: a lasting injury \(a quality cybernetic\)/);
    const old = await knight('era', { year: -3653, month: 1, day: 1 });
    expect(runDevCommand(REGISTRY, old, '/fight 4 clone').line).toMatch(/fight begun: 4 line troopers/);
    void s;
  });
});
