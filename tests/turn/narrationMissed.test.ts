// D-237 (combat pass 3, issues 5, 6 and 7): narration errors the check missed. A shot or a failed Force step told as
// done; ground given to the wrong side; "the surviving X" while several stand; a weapon nobody carries; and a fighter
// who stands on a leg that is gone or uses an arm that is gone, in the fight and in later scenes. Each case uses the
// narrator's own sentences from docs-v2/testing/combat-pass-3.md.
import { describe, expect, it } from 'vitest';
import { LORE_TEST_YEAR as TEST_YEAR } from '../support/dates';
import { absDayFromDate, DAYS_PER_YEAR } from '../../src/engine/calendar';
import type { ExchangeRecord } from '../../src/engine/duel';
import { lastingState, type LastingInjury } from '../../src/engine/lasting';
import { seedRng } from '../../src/engine/rng';
import type { Wound } from '../../src/engine/wounds';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { makeEstimator } from '../../src/ai/tokenRatio';
import { describeCombat, lastingStates, stateBlock } from '../../src/turn/context';
import { checkNarration, lastingIssues, settleNarration, type LastingView } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], ...over });
const combat = (over: Partial<CombatDraft> = {}): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [fighter('pc', 'Joren Kast', { form: 'soresu' }), fighter('n1', 'Duelist 1')], notes: [], ...over });
const draft = (c: CombatDraft | null): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const kinds = (text: string, c: CombatDraft | null, lasting: LastingView[] = []): string[] => checkNarration(text, draft(c), false, { player: [], lasting }).map((i) => i.kind);
const force = (kind: string, success: boolean): ExchangeRecord => rec({ kind: 'force', force: { kind, abilityId: kind === 'push' ? 'forcePush' : kind === 'choke' ? 'forceChoke' : 'telekinesis', side: 'A', success, outcome: success ? 'success' : 'forceResisted' } as never });

describe('a step that was NOT REACHED or FAILED is not told as done', () => {
  const DAX = fighter('pc', 'Dax Morrow', { weapon: 'blasterPistol', form: null });
  const KADE = fighter('n1', 'Kade', { weapon: 'blasterPistol', form: null });
  const notes = ['step 1 stance (defensive): DONE (defensive stance set)', 'step 2 maneuver (position): FAILED (loses ground; no hit)', 'step 3 strike: NOT REACHED (an earlier step failed)'];
  const c = combat({ fighters: [DAX, KADE], narrate: [rec({ n: 1, margin: -2.1, advBefore: 0, advAfter: -1 })], notes, advantage: -1 });
  const exact = 'Heart pounding, you wrench your blaster pistol from its holster, lean around the edge of the rusted metal, and fire back. Kade smoothly gives ground, stepping back into the shadows of the alley as your bolt ricochets harmlessly off the durasteel bulkhead.';
  it('pass 3, the smuggler: the shot that was not reached, and Kade "gives ground" when Kade gained it', () => {
    const issues = checkNarration(exact, draft(c), false);
    expect(issues.filter((i) => i.kind === 'stepNotReached').map((i) => i.sentence)).toEqual(expect.arrayContaining([expect.stringMatching(/fire back/)]));
    expect(issues.map((i) => i.kind)).toContain('groundReversed');
    // The fallback is the summary: the step list, nothing invented.
    const settled = settleNarration(exact, draft(c), issues, (t) => checkNarration(t, draft(c), false));
    expect(settled.how).toBe('summary');
    expect(settled.narrative).toMatch(/Not reached: strike/);
  });
  it('the block says so: no shot in the build-up when the strike step was not reached', () => {
    const block = describeCombat(c).join('\n');
    expect(block).toMatch(/Dax Morrow and Kade maneuver for position: NO HIT, and Dax Morrow gets no shot off\. Kade gains ground/);
    // A blade, or a shooter who did reach the strike, keeps the usual line.
    expect(describeCombat(combat({ narrate: [rec({ n: 1, margin: -2.1, advAfter: -1 })], notes })).join('\n')).toMatch(/trade blows: NO HIT/);
  });
  it('the honest telling passes; a shooter who did fire may be said to fire', () => {
    expect(kinds('You dive for the crates, but Kade is quicker: his fire pins you down before you can bring your pistol to bear, and he presses forward through the alley.', c)).toEqual([]);
    const fired = combat({ fighters: [DAX, KADE], narrate: [rec({ n: 1, kind: 'strike', striker: 'A', margin: -3, advBefore: 3, advAfter: 1 })], notes: ['step 1 strike: FAILED (misses Kade: no hit)'] });
    expect(kinds('You snap off a quick shot, but Kade twists aside and your bolt scorches the wall behind him.', fired)).toEqual([]);
  });
  it('the opponent\'s shot that did not hit is not a hit (rule 2, either weapon)', () => {
    const miss = combat({ fighters: [DAX, KADE], narrate: [rec({ n: 2, kind: 'strike', striker: 'B', margin: 4, advBefore: -3, advAfter: -1 })] });
    expect(kinds('Kade fires, and the bolt burns across your shoulder before you can drop behind the crates.', miss)).toContain('hitNotInLog');
    expect(kinds('A slug punches into your thigh as you turn.', miss)).toContain('hitNotInLog');
    expect(kinds('Kade fires, and the bolt hisses past your shoulder as you drop behind the crates.', miss)).toEqual([]);
  });
  it('a Force action that FAILED shows no effect; the same words are fine when it worked', () => {
    const resisted = combat({ narrate: [force('push', false), rec({ n: 2, margin: -3, advAfter: -1 })], notes: ['step 1 Force push: FAILED (fails: the target resisted it with their own Force)'] });
    const done = 'You thrust out your hand and a wave of Force energy slams him back across the hall.';
    expect(kinds(done, resisted)).toContain('stepFailed');
    expect(kinds(done, combat({ narrate: [force('push', true)] }))).not.toContain('stepFailed');
    // Pass 3's own narration of the resisted push passes.
    expect(kinds('You throw out your hand to shove your opponent with the Force, but the dark duelist meets your telekinetic wave with an invisible barrier of their own, your push scattering harmlessly against their willpower.', resisted)).not.toContain('stepFailed');
    const recall = combat({ narrate: [force('recall', false)] });
    expect(kinds('The weapon leaps from the floor, spinning into your palm with a familiar hum.', recall)).toContain('stepFailed');
    expect(kinds('You reach for the fallen hilt through the Force, but it does not stir.', recall)).toEqual([]);
  });
  it('ground: the opponent never "gives ground" in a passage where the track never moved the player\'s way', () => {
    const held = combat({ narrate: [force('push', false), rec({ n: 2, margin: 6, advBefore: 0, advAfter: 0, duringForce: true } as never)] });
    expect(kinds('You press forward, claiming ground as he yields an inch.', held)).toContain('groundReversed');
    const gained = combat({ narrate: [rec({ n: 3, margin: 7, advBefore: 0, advAfter: 2 })] });
    expect(kinds('He gives ground before your advance, and you drive him back toward the pillars.', gained)).toEqual([]);
    expect(kinds('You try to drive him back, but he does not yield.', held)).not.toContain('groundReversed');
    // Saved narrations of passes 1 and 2 where the opponent gains the ground, or the push is only reached for.
    const lostGround = combat({ fighters: [fighter('pc', 'Kael Voss'), fighter('d1', 'B1 battle droid 1', { minion: true, weapon: 'blasterRifle', form: null }), fighter('t1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null }), fighter('n5', 'Duelist 5')], narrate: [rec({ n: 1, targetId: 'd1', margin: -4, advBefore: 1, advAfter: 0 })] });
    for (const text of [
      'As your remaining sequence is cut short by their heavy counter-pressure, B1 battle droid 1 surges forward, driving you back to gain ground.',
      'You trade blows in a tense parry, but the relentless pressure pushes you back a step as Line trooper 1 claims ground.',
      'You reach out to drive Duelist 5 back with the Force, but your call meets an absolute, chilling void.',
    ])
      expect(kinds(text, lostGround), text).not.toContain('groundReversed');
  });
  it('a failed throw beside a good recall: the saber back in the hand is the recall, not the throw', () => {
    const c2 = combat({ narrate: [force('recall', true), force('saberThrow', false)], notes: ['step 1 saber recall: DONE (the saber flies back to hand)', 'step 2 saber throw: FAILED (fails: the roll fell short of the difficulty)'] });
    expect(kinds('With a focused pull of the Force, your blue-bladed lightsaber leaps from the grass and snaps firmly back into your outstretched palm.', c2)).not.toContain('stepFailed');
  });
});

describe('survivor counts and weapons nobody carries', () => {
  const mando = (k: number, out: boolean, weapon = 'slugRifle'): CombatFighterView => fighter(`m${k}`, `Mandalorian warrior ${k}`, { minion: true, weapon, form: null, out, status: out ? 'Out of the fight' : 'Healthy' });
  const exact = 'The surviving Mandalorian steps forward, lowering his scatter gun and taking you captive in the bitter cold.';
  const lost = { outcome: 'lost', reason: 'incapacitated', playerFate: 'captured' };
  it('pass 3: "the surviving Mandalorian ... scatter gun" with two warriors standing and slugthrower rifles', () => {
    const c = combat({ fighters: [fighter('pc', 'Joren Kast'), mando(1, true), mando(2, true), mando(3, false), mando(4, false)], narrate: [rec({ n: 70, targetId: 'm3', margin: -9, advAfter: -4 })], ended: lost });
    expect(kinds(exact, c)).toEqual(expect.arrayContaining(['survivorCount', 'gearNotInBlock']));
    expect(describeCombat(c).join('\n')).toMatch(/Opponents still standing: 2 \(Mandalorian warrior 3, Mandalorian warrior 4\)/);
    expect(kinds('The two Mandalorians still standing close in, slugthrower rifles levelled, and take you captive.', c)).toEqual([]);
  });
  it('one left standing, with a scatter gun: the same sentence is true', () => {
    const c = combat({ fighters: [fighter('pc', 'Joren Kast'), mando(1, true, 'scatterGun'), mando(2, true, 'scatterGun'), mando(3, true, 'scatterGun'), mando(4, false, 'scatterGun')], narrate: [rec({ n: 70, targetId: 'm4', margin: -9, advAfter: -4 })], ended: lost });
    expect(kinds(exact, c)).toEqual([]);
  });
  it('"the last", "the final", "the only one left" need exactly one; other "last" things are not fighters', () => {
    const droid = (k: number, out: boolean): CombatFighterView => fighter(`d${k}`, `B1 battle droid ${k}`, { minion: true, weapon: 'blasterRifle', form: null, out });
    const two = combat({ fighters: [fighter('pc', 'Joren Kast'), droid(1, true), droid(2, false), droid(3, false)], narrate: [rec({ n: 4, targetId: 'd2' })] });
    expect(kinds('The last droid levels its rifle at you.', two)).toContain('survivorCount');
    expect(kinds('Only one of them is left, and the only one left raises its rifle.', two)).toContain('survivorCount');
    expect(kinds('At the last instant you turn the final bolt aside, and the remaining droids spread out.', two)).toEqual([]);
    const one = combat({ fighters: [fighter('pc', 'Joren Kast'), droid(1, true), droid(2, true), droid(3, false)], narrate: [rec({ n: 4, targetId: 'd3' })] });
    expect(kinds('The final automaton levels its rifle at you.', one)).toEqual([]);
  });
});

describe('lasting state: a leg or an arm that is gone', () => {
  const wound = (part: string, severed = true): Wound => ({ id: `w-${part}`, part, severity: 'severe', W: 30, stabilized: true, healProgress: 0, day: 1, source: 'duel', severed }) as unknown as Wound;
  const lost = (part: string, aid: string): LastingInjury => ({ id: `l-${part}`, kind: part.endsWith('Leg') ? 'lostLeg' : 'lostArm', part, adaptation: 0, aid, adaptedToday: 0, adaptDay: 1, day: 1 }) as unknown as LastingInjury;
  it('lastingState: severed limbs and limbs lost with no prosthetic; a fitted prosthetic stands and grips', () => {
    expect(lastingState([wound('rightArm'), wound('leftLeg')], [])).toEqual({ cannotStand: true, missing: ['rightArm', 'rightHand', 'leftLeg'], text: ['no right arm (severed)', 'cannot stand: severed left leg'] });
    expect(lastingState([], [lost('leftLeg', 'none')]).text).toEqual(['cannot stand: no left leg']);
    expect(lastingState([], [lost('leftLeg', 'qualityCybernetic')])).toEqual({ cannotStand: false, missing: [], text: [] });
    // Health gives a Jedi the faction's aid at once (D-164): the fresh wound with that aid on record is not "missing".
    expect(lastingState([wound('leftLeg')], [lost('leftLeg', 'qualityCybernetic')]).missing).toEqual([]);
    expect(lastingState([wound('torso', false)], []).missing).toEqual([]);
  });
  const DUELIST: LastingView = { name: 'Duelist 2', pc: false, cannotStand: true, missing: ['rightArm', 'rightHand', 'leftLeg'] };
  const spare = 'You clip your lightsaber to your belt. Looking down at the fallen duelist, you offer a hand rather than a finishing blow. Duelist 2 stares up at you in disbelief, his chest heaving with exhaustion as he hesitates before slowly taking your hand to pull himself up against the cold stone.';
  it('pass 3, the spared duelist with a severed arm and leg is not pulled to his feet (a later scene, no fight)', () => {
    const issues = checkNarration(spare, draft(null), false, { player: [], lasting: [DUELIST] });
    expect(issues.map((i) => i.kind)).toEqual(['lastingState']);
    expect(issues[0]!.sentence).toMatch(/pull himself up/);
    expect(issues[0]!.text).toMatch(/Duelist 2 cannot stand/);
    // With nobody maimed in the scene the same words are fine.
    expect(kinds(spare, null)).toEqual([]);
  });
  it('what he can still do passes; so does the player walking away', () => {
    for (const text of [
      'Duelist 2 stares up at you from the stone, unable to rise, his remaining hand pressed to the ruin of his shoulder.',
      'Duelist 2 tries to stand and collapses back against the pillar.',
      'You rise and walk away while Duelist 2 watches from the floor.',
      'Duelist 2 drags himself toward the wall, leaving his dead lightsaber where it fell.',
      'Master Vash strides across the hall. He steps forward and kneels beside you.',
      'Duelist 2 clutches at you with his left hand.',
    ])
      expect(lastingIssues(text, [DUELIST]), text).toEqual([]);
  });
  it('standing, walking, kicking, and the missing arm in use are flagged, by name or by the pronoun that follows', () => {
    for (const text of [
      'Duelist 2 rises slowly, his eyes never leaving yours.',
      'Duelist 2 glares at you. He staggers to his feet and backs away.',
      'You help him up, and Duelist 2 nods once.',
      'Duelist 2 reaches for the fallen hilt with his right hand.',
      'Duelist 2 snarls. He grips the hilt with both hands and swings.',
    ])
      expect(lastingIssues(text, [DUELIST]).map((i) => i.kind), text).toEqual(['lastingState']);
  });
  it('pass 4 (D-247): a fighter is matched by the full name, never a shared word ("Duelist 9" is not "Duelist 37")', () => {
    const D37: LastingView = { name: 'Duelist 37', pc: false, cannotStand: true, missing: ['rightLeg'] };
    // The exact sentence of the pass-4 Spare narration, flagged then (a retry and a true sentence removed).
    const pass4 = 'Duelist 9 steps forward slightly from the shadows of the ferns, his expression unreadable, while Duelist 6 watches your restraint with a cold, assessing gaze.';
    expect(lastingIssues(pass4, [D37])).toEqual([]);
    expect(checkNarration(pass4, draft(null), false, { player: [], lasting: [D37] })).toEqual([]);
    // A number prefix is not the name either; the real one still fires.
    expect(lastingIssues('Duelist 3 steps forward and raises his blade.', [D37])).toEqual([]);
    expect(lastingIssues('Duelist 37 steps forward and raises his blade.', [D37]).map((i) => i.kind)).toEqual(['lastingState']);
    // Shared title words: two Mandalorian warriors, one of them legless.
    const M3: LastingView = { name: 'Mandalorian warrior 3', pc: false, cannotStand: true, missing: ['leftLeg'] };
    expect(lastingIssues('Mandalorian warrior 1 strides toward you through the snow.', [M3])).toEqual([]);
    expect(lastingIssues('Mandalorian warrior 3 strides toward you through the snow.', [M3]).map((i) => i.kind)).toEqual(['lastingState']);
  });
  it('in a fight: a limb lost earlier counts, a limb severed in this passage does not (he was whole until then)', () => {
    const maimed = fighter('n1', 'Duelist 2', { lostParts: ['rightArm'], lasting: { cannotStand: false, missing: ['rightArm', 'rightHand'], text: ['no right arm (severed)'] } });
    const earlier = combat({ fighters: [fighter('pc', 'Joren Kast'), maimed], narrate: [rec({ n: 70, margin: 4, advAfter: 1 })] });
    expect(kinds('Duelist 2 brings his blade around in his right hand, and you turn it aside as he gives a step.', earlier)).toEqual(['lastingState']);
    expect(kinds('Duelist 2 fights on with his left hand, his right sleeve empty, and gives a step.', earlier)).toEqual([]);
    const hit = { by: 'A', quality: 'critical', D: 40, part: 'leftLeg', W: 30, severity: 'severe', vitalityLost: 0, severed: true, avoided: false };
    const now = combat({ fighters: [fighter('pc', 'Joren Kast'), fighter('n1', 'Duelist 2', { lostParts: ['leftLeg'], out: true, lasting: { cannotStand: true, missing: ['leftLeg'], text: ['cannot stand: severed left leg'] } })], narrate: [rec({ n: 81, kind: 'strike', striker: 'A', margin: 20, advBefore: 3, advAfter: 0, hit: hit as never })] });
    expect(kinds('As Duelist 2 lunges, you step inside his guard and cleave through his left leg. He collapses to the stone floor, out of the fight.', now)).toEqual([]);
    const block = describeCombat(now).join('\n');
    expect(block).toMatch(/Duelist 2 Healthy \(cannot stand: severed left leg\)/);
    expect(block).toMatch(/A fighter who cannot stand stays down/);
  });
  it('the state carries it into later scenes: the NPC line and the check\'s list', () => {
    const START = absDayFromDate({ year: TEST_YEAR, month: 1, day: 1 });
    let state = createInitialState<GameState>(REGISTRY, { campaignId: 'c', branchId: 'b', seed: 's', start: { day: START, second: 7 * 3600 }, character: { name: 'Joren', birthDay: START - 30 * DAYS_PER_YEAR } });
    const ai = applyEvents(REGISTRY, state, [{ type: 'npcIntroduced', key: 'tmp:1', name: 'Duelist 2', species: 'human', faction: 'sith', role: 'sithLord', description: 'A duelist.' }], { source: 'ai' });
    expect(ai.rejected).toEqual([]);
    state = ai.state;
    const id = Object.values(state.npcs.byId).find((n) => n.name === 'Duelist 2')!.id;
    const synced = applyEvents(REGISTRY, state, [{ type: 'npcHealthSynced', npcRef: id, health: { vitalityLost: 10, wounds: [wound('rightArm'), wound('leftLeg')], lasting: [] } }], { source: 'engine' });
    expect(synced.rejected).toEqual([]);
    state = { ...synced.state, pacing: { ...synced.state.pacing, scene: { ...synced.state.pacing.scene, presentNpcIds: [id] } } };
    expect(lastingStates(state)).toEqual([{ name: 'Duelist 2', pc: false, cannotStand: true, missing: ['rightArm', 'rightHand', 'leftLeg'] }]);
    expect(stateBlock(state, makeEstimator(4)).text).toMatch(/= Duelist 2 \(sithLord; no right arm \(severed\); cannot stand: severed left leg\)/);
  });
});
