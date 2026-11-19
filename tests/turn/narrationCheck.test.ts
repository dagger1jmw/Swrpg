// The post-narration check (D-197): each contradiction from docs-v2/testing/combat-pass-1.md, with the narrator's own
// words, and the good narrations of that pass, which must not trip it.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { describeCombat, resolvedBlock } from '../../src/turn/context';
import { checkNarration, fallbackNarration } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';
import { PROMPTS } from '../../src/ai/prompts';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'd1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 20, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: true, weapon: 'blasterRifle', form: null, lostParts: [], ...over });
const PC = fighter('pc', 'Kael Voss', { minion: false, weapon: 'lightsaber', form: 'soresu' });
const droids = (n: number, out: number[] = []) => Array.from({ length: n }, (_, i) => fighter(`d${i + 1}`, `B1 battle droid ${i + 1}`, { out: out.includes(i + 1) }));
const combat = (over: Partial<CombatDraft>): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [PC, ...droids(3)], notes: [], ...over });
const draft = (c: CombatDraft | null, extra: Partial<TurnDraft> = {}): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [], ...extra }) as TurnDraft;
const hit = (by: 'A' | 'B', part: string, severity: string | null, severed = false) => ({ by, quality: 'solid', D: 20, part, W: 15, severity, vitalityLost: 10, severed, avoided: false }) as ExchangeRecord['hit'];
const kinds = (text: string, d: TurnDraft, wounded = false) => checkNarration(text, d, wounded).map((i) => i.kind);

const DUELIST = fighter('n1', 'Duelist 1', { minion: false, weapon: 'lightsaber', form: 'makashi' });

describe('contradictions from combat pass 1 (D-197)', () => {
  it('issue 3A: a build-up exchange narrated as a hit ("Your blade catches him cleanly")', () => {
    const d = draft(combat({ fighters: [PC, DUELIST], narrate: [rec({ targetId: 'n1', advAfter: 3, margin: 10 })], notes: ['step 1 strike: DONE (gains ground; no hit)'] }));
    const text = "You lunge forward with calculated precision, bringing your blue lightsaber down in a swift arc aimed directly at your opponent's sword arm. Your blade catches him cleanly as you press your advantage, forcing him to give ground as the clash of plasma echoes through the quiet Dantooine wilderness.";
    expect(kinds(text, d)).toEqual(['hitNotInLog']);
  });
  it('issue 3B: a spar build-up narrated as a touch ("score a clean, controlled touch against his ribs")', () => {
    const d = draft(combat({ fighters: [fighter('pc', 'Tessa Rin', { minion: false, weapon: 'trainingSaber' }), fighter('m', 'Master Oren Vash', { minion: false, weapon: 'trainingSaber' })], narrate: [rec({ targetId: 'm', advAfter: 1, margin: 3.6 })], notes: ['step 1 stance (defensive): DONE (defensive stance set)', 'step 2 strike: DONE (gains ground; no hit)'] }));
    const text = 'Master Oren Vash steps in with a measured, fluid strike aimed at your shoulder. You catch his blade firmly against yours, absorbing the shock, and immediately pivot your footing to press the opening, slipping past his guard to score a clean, controlled touch against his ribs.';
    expect(kinds(text, d)).toContain('hitNotInLog');
  });
  it('issue 4: the thrown saber "carving through the first battle droid" it missed, and a moderate wound made a severed arm', () => {
    const narrate = [
      rec({ n: 2, kind: 'force', force: { kind: 'saberThrow', abilityId: 'telekinesis', side: 'A', success: true, misfire: false, collapse: false, outcome: 'success', damage: null, backlashMental: 0 } as never }),
      rec({ n: 3, kind: 'strike', striker: 'A', targetId: 'd1', margin: -5, notes: ['thrown saber: misses B1 battle droid 1'] }),
      rec({ n: 4, kind: 'strike', striker: 'A', targetId: 'd2', margin: 10, hit: hit('A', 'leftArm', 'moderate'), notes: ['thrown saber: Kael Voss cuts down B1 battle droid 2'] }),
      rec({ n: 5, kind: 'strike', striker: 'A', targetId: 'd3', margin: -13, notes: ['thrown saber: misses B1 battle droid 3'] }),
    ];
    const d = draft(combat({ fighters: [PC, ...droids(3, [2])], narrate, notes: ['step 1 saber throw: DONE (the saber flies its arc (1 of 3 strikes hit; each is listed) and returns to hand)'] }));
    const text = 'You sweep your arm in a wide arc, hurling your spinning blue lightsaber directly at the mechanical patrol. The blade hums fiercely through the air, carving through the first battle droid before slamming into the chassis of the second, leaving its left arm severed and useless as it collapses into the tall grass.';
    const k = kinds(text, d);
    expect(k).toContain('minionNotHit');
    expect(k).toContain('sever');
    // The honest version passes: droid 1 missed, droid 2 down with a wounded arm, no severing.
    expect(kinds('Your thrown saber whirls past the first battle droid, which jerks aside, then bites deep into the left arm of the second, and it drops into the grass. The third ducks under the returning blade as it snaps back into your hand.', d)).toEqual([]);
  });
  it('issue 5: a Force push marked NOT REACHED narrated as done; saying the character did not get to it passes', () => {
    const narrate = [rec({ n: 2, kind: 'strike', striker: 'A', targetId: 'n1', margin: 5, hit: hit('A', 'rightArm', null) }), rec({ n: 3, targetId: 'n1', advAfter: 5, margin: 28 })];
    const d = draft(combat({ fighters: [PC, DUELIST], narrate, notes: ['step 1 stance (aggressive): DONE (aggressive stance set)', 'step 2 strike: DONE (hits Duelist 1: no wound, stamina only)', 'step 3 strike: DONE (gains ground; no hit)', 'step 4 Force push: NOT REACHED (past the sequence cap of 3)'] }));
    const bad = 'You press the advantage, driving forward with two quick, calculated cuts that catch your opponent off guard, forcing him to parry hastily as a shallow graze marks his shoulder. Seizing the opening from his stumble, you sweep your hand forward and release a sudden surge of kinetic Force energy, shoving him heavily back across the clearing.';
    expect(kinds(bad, d)).toEqual(['stepNotReached']);
    const good = "You lunge forward, aiming to drive your lightsaber straight through his guard, and a glancing cut skims his shoulder. The sudden counter-pressure cuts your momentum short before you can gather your focus to unleash a follow-up push through the Force, leaving you locked in the relentless melee.";
    expect(kinds(good, d)).toEqual([]);
  });
  it('issue 2: a wounding hit left out ("your strike is deftly turned aside") is caught as a missing wound', () => {
    const d = draft(combat({ fighters: [PC, DUELIST], beat: 'woundingHit', narrate: [rec({ n: 21, kind: 'strike', striker: 'A', targetId: 'n1', margin: 3 }), rec({ n: 22, kind: 'strike', striker: 'A', targetId: 'n1', margin: 10.9, hit: hit('A', 'rightArm', 'severe') })] }));
    const text = 'You lunge forward to press the opening left by his stumble, but your strike is deftly turned aside at the last instant as he recovers his footing.';
    expect(kinds(text, d)).toEqual(['woundOmitted']);
    expect(kinds('He turns your first lunge aside, but the second finds him: your blade sears across his right arm, a deep and ugly wound.', d)).toEqual([]);
  });
  it('issue 11: bacta and Force healing with no care applied; real care passes', () => {
    const jump = { level: 'montage', report: {} } as never;
    const text = 'The past week passes in a quiet, steady rhythm of recovery beneath the open skies of Dantooine. The throbbing pain gradually fades into a dull ache as bacta patches and gentle Force-assisted healing mend the damaged tissue.';
    expect(kinds(text, draft(null, { jump }), true)).toEqual(['healingNotApplied']);
    const withBacta = draft(null, { jump, applied: [{ event: { type: 'careStarted', kind: 'bacta', hours: 6 }, notes: [] }] as never });
    expect(kinds('You float in the bacta tank for hours while the wound knits.', withBacta, true)).toEqual([]);
    // Talk about healing that is not applied is fine.
    expect(kinds('The medic shakes his head: you need a bacta tank, and there is none within a day of here.', draft(null, { jump }), true)).toEqual([]);
    // The re-check's false alarm: the narrator saying the care was NOT bacta must pass (both of its sentences).
    const medical = draft(null, { jump, applied: [{ event: { type: 'careStarted', kind: 'medical', hours: 168 }, notes: [] }] as never });
    expect(kinds('The pain of the injury fades into a dull, persistent ache, treated only by standard medpacs and basic care rather than restorative bacta.', medical, true)).toEqual([]);
    expect(kinds('Without the luxury of bacta or kolto tanks, the healing is slow and arduous, relying on ordinary antiseptic dressings.', medical, true)).toEqual([]);
    // Unwounded, in an ordinary scene, a bacta ward is just scenery.
    expect(kinds('You walk past the bacta tanks of the medcenter.', draft(null), false)).toEqual([]);
  });
  it('severing is fine when the block has it or a limb was lost before', () => {
    const d = draft(combat({ fighters: [PC, DUELIST], narrate: [rec({ n: 27, kind: 'strike', striker: 'A', targetId: 'n1', margin: 22, hit: hit('A', 'rightLeg', 'severe', true) })] }));
    expect(kinds('In one fluid, decisive motion, you bring your lightsaber around in a sweeping arc, landing a critical strike that severs his right leg at the knee.', d)).toEqual([]);
    const after = draft(combat({ fighters: [PC, { ...DUELIST, lostParts: ['rightLeg'] }], narrate: [rec({ n: 30, targetId: 'n1' })] }));
    expect(kinds('He drags himself up on the stump of his leg, blade still raised.', after)).toEqual([]);
  });
  it('a hit on the player that is not in the log', () => {
    const d = draft(combat({ narrate: [rec({ n: 3, kind: 'strike', striker: 'B', targetId: 'd1', margin: 2 })] }));
    expect(kinds('The bolt burns across your shoulder before you can turn it.', d)).toEqual(['hitNotInLog']);
    expect(kinds('The bolt hisses past your shoulder, close enough to feel its heat.', d)).toEqual([]);
  });
});

describe('ordinary narration never trips the check (the good narrations of the pass)', () => {
  const noHits = draft(combat({ narrate: [rec({ n: 1, kind: 'strike', striker: 'A', targetId: 'd1', margin: -12 })], notes: ['step 1 strike: FAILED (misses B1 battle droid 1: no hit)'] }));
  it('a miss narrated as a miss', () => {
    expect(kinds('A brilliant blade of plasma ignites with a sharp, familiar snap-hiss. You step forward, sweeping your lightsaber in a decisive arc to cut down the nearest B1 battle droid. The machine jerks backward with surprising speed, its metallic chassis dodging just out of reach as your strike misses completely. The remaining droids chatter in mechanical unison, keeping you firmly on the defensive.', noHits)).toEqual([]);
  });
  it('a failed Force use with its engine reason', () => {
    const d = draft(combat({ beat: 'forceAction', narrate: [rec({ n: 7, kind: 'force', force: { kind: 'throw', abilityId: 'telekinesis', side: 'A', success: false, misfire: false, collapse: false, outcome: 'natural1', damage: null, backlashMental: 0 } as never })], notes: ['step 1 Force throw: FAILED (fails: a natural 1 (a slip of focus))'] }));
    expect(kinds('You reach out with the Force to seize a heavy log, but a sudden slip of focus betrays your concentration. The unseen currents ripple harmlessly away, and the mass remains stubbornly unmoved as the battle droids close in.', d)).toEqual([]);
  });
  it('a real hit on the player, a dropped step said plainly, blades meeting, catching someone off balance', () => {
    const d = draft(combat({ fighters: [PC, fighter('m1', 'Mandalorian warrior 1', { weapon: 'blasterPistol' })], narrate: [rec({ n: 3, kind: 'strike', striker: 'B', targetId: 'm1', hit: { ...hit('B', 'leftLeg', 'minor')!, avoided: true } }), rec({ n: 4, kind: 'strike', striker: 'B', targetId: 'm1', margin: 10, hit: hit('B', 'leftLeg', 'minor') })] }));
    expect(kinds('You sidestep the first bolt by a hair, but the second catches you in the left leg, a shallow burn that stings as you set your stance.', d)).toEqual([]);
    const blades = draft(combat({ fighters: [PC, DUELIST], narrate: [rec({ n: 5, targetId: 'n1', advAfter: -2, margin: -7 })] }));
    expect(kinds('Your blade catches his blade in a shower of sparks, and he drives you back a step. He catches you off balance, and you give ground.', blades)).toEqual([]);
  });
  it('minions cut down in the log may be cut down in the prose', () => {
    const d = draft(combat({ fighters: [PC, ...droids(3, [1, 3])], narrate: [rec({ n: 12, targetId: 'd1', margin: 9, hit: hit('A', 'torso', 'severe') }), rec({ n: 13, targetId: 'd3', margin: 9, hit: hit('A', 'head', 'severe') })] }));
    expect(kinds('You slice through the first battle droid, sending it collapsing into the grass, then cut down the third with a sweeping, practiced strike.', d)).toEqual([]);
    expect(kinds('You slice through the first battle droid, then cut down the second with a sweeping strike.', d)).toEqual(['minionNotHit']);
  });
});

describe('the narrator block and the fallback (D-197)', () => {
  const narrate = [rec({ n: 3, kind: 'strike', striker: 'A', targetId: 'd1', margin: -5 }), rec({ n: 4, kind: 'strike', striker: 'A', targetId: 'd2', margin: 10, hit: hit('A', 'leftArm', 'moderate') })];
  const c = combat({ fighters: [PC, ...droids(3, [2])], narrate, notes: ['step 1 strike: FAILED (misses B1 battle droid 1: no hit)', 'step 2 strike: DONE (hits B1 battle droid 2: moderate wound to the left arm; out of the fight)', 'step 3 Force push: NOT REACHED (past the sequence cap of 3)'] });
  it('the block marks every exchange HIT or NO HIT, every step, the weapons, and what did not happen', () => {
    const block = describeCombat(c).join('\n');
    expect(block).toMatch(/#3 Kael Voss strikes at B1 battle droid 1: NO HIT/);
    expect(block).toMatch(/#4 Kael Voss hits B1 battle droid 2: HIT \(B1 battle droid 2, left arm, moderate wound\)/);
    expect(block).toMatch(/Weapons \(the only ones in this fight\): Kael Voss: a lightsaber \(Soresu\); B1 battle droid 1: a blaster rifle/);
    expect(block).toMatch(/step 3 Force push: NOT REACHED \(past the sequence cap of 3\)/);
    expect(block).toMatch(/Did not happen \(never describe these as happening\): .*strike at B1 battle droid 1 did not land.*step 3 \(Force push\) was NOT REACHED/);
    expect(block).not.toMatch(/lands|leftArm/);
    expect(PROMPTS.combatNarration).toMatch(/ABSOLUTE RULE/);
    expect(PROMPTS.combatNarration).toMatch(/does not punch, slash or parry with a gauntlet/);
  });
  it('a retry carries the contradictions; the fallback is the outcome list in plain sentences', () => {
    const d = draft(c);
    const issues = checkNarration('You carve through the first battle droid and sever the arm of the second.', d, false);
    expect(issues.length).toBeGreaterThan(0);
    expect(resolvedBlock(d, issues.map((i) => i.text))).toMatch(/CORRECTION: your last narration of this turn contradicted RESOLVED/);
    const fb = fallbackNarration('x', d, issues);
    expect(fb).toMatch(/Kael Voss strikes at B1 battle droid 1: no hit/);
    expect(fb).toMatch(/a hit \(B1 battle droid 2, left arm, moderate wound\)/);
    expect(fb).toMatch(/Not reached: Force push/);
    expect(checkNarration(fb, d, false)).toEqual([]);
  });
  it('a montage is told the care that was applied, or none', () => {
    const jump = { level: 'montage', report: { level: 'montage', fromLabel: 'a', toLabel: 'b', daysCompleted: 7, requestedDays: 7, trainingDays: 0, restDays: 7, hoursTrained: 0, interrupted: null, skills: [], breakthroughs: 0, rust: { gained: [] }, relationships: [], events: [], adjustments: [] } } as never;
    expect(resolvedBlock(draft(null, { jump }))).toMatch(/Care applied this turn: none\. Wounds heal only by rest and time/);
    expect(resolvedBlock(draft(null, { jump, applied: [{ event: { type: 'careStarted', kind: 'medical', hours: 168 }, notes: [] }] as never }))).toMatch(/Care applied this turn: ordinary medical care/);
    expect(PROMPTS.pacing.montage).toMatch(/describe only the care RESOLVED lists/);
  });
});

describe('the engine gives the reason for every NO HIT exchange (Jared, after combat pass 1)', () => {
  const line = (c: CombatDraft, n: number) => describeCombat(c).find((l) => l.startsWith(`#${n} `))!;
  it('a strike that does not land: parried, deflected, dodged, foresaw', () => {
    const duel = combat({ fighters: [PC, DUELIST], narrate: [rec({ n: 1, kind: 'strike', striker: 'B', targetId: 'n1', margin: -3 }), rec({ n: 2, kind: 'strike', striker: 'A', targetId: 'n1', margin: 2 }), rec({ n: 3, kind: 'strike', striker: 'A', targetId: 'n1', hit: { ...hit('A', 'torso', null)!, avoided: true } })] });
    expect(line(duel, 1)).toContain('NO HIT (reason: Kael Voss parried)');
    expect(line(duel, 2)).toContain('NO HIT (reason: Duelist 1 parried)');
    expect(line(duel, 3)).toContain('NO HIT (reason: Duelist 1 dodged: foresaw it with precognition)');
    const bolts = combat({ narrate: [rec({ n: 4, kind: 'strike', striker: 'B', targetId: 'd1', margin: -2 }), rec({ n: 5, kind: 'strike', striker: 'A', targetId: 'd1', margin: 1 })] });
    expect(line(bolts, 4)).toContain('NO HIT (reason: Kael Voss deflected on the blade)');
    expect(line(bolts, 5)).toContain('NO HIT (reason: B1 battle droid 1 dodged)');
    const unarmed = combat({ fighters: [{ ...PC, weapon: 'unarmed' }, ...droids(1)], narrate: [rec({ n: 6, kind: 'strike', striker: 'B', targetId: 'd1', margin: -2 })] });
    expect(line(unarmed, 6)).toContain('NO HIT (reason: Kael Voss dodged)');
  });
  it('a build-up exchange: held on a tie, gave ground on 1 step, outpaced on 2 or more (margin 6+)', () => {
    const c = combat({ fighters: [PC, DUELIST], narrate: [rec({ n: 1, targetId: 'n1', margin: 0.8 }), rec({ n: 2, targetId: 'n1', margin: 3.2, advAfter: 1 }), rec({ n: 3, targetId: 'n1', margin: -7, advAfter: -2 }), rec({ n: 4, targetId: 'n1', margin: -12, advAfter: -3 })] });
    expect(line(c, 1)).toContain('neither gains ground (reason: both held)');
    expect(line(c, 2)).toContain('Kael Voss gains ground (reason: Duelist 1 gave ground)');
    expect(line(c, 3)).toContain('Duelist 1 gains ground (reason: Kael Voss was outpaced)');
    expect(line(c, 4)).toContain('Kael Voss was outpaced');
  });
  it('the prompt says to use only the listed reason, with no invented slips', () => {
    expect(PROMPTS.combatNarration).toMatch(/Explain each miss only with that reason/);
  });
});

describe('a wound placed on the wrong body location (Jared, after combat pass 1)', () => {
  const week = draft(null, { jump: { kind: 'montage' } as never });
  it('the medic-week case: "your deep torso wound" when the wound is the right arm', () => {
    const text = 'Over the following week, a medic tends to your deep torso wound using standard medpacs and a basic recovery bed. Without the luxury of bacta or kolto tanks, the healing is slow and arduous.';
    const issues = checkNarration(text, week, true, { player: ['rightArm'] });
    expect(issues.map((i) => i.kind)).toEqual(['woundMisplaced']);
    expect(issues[0]!.sentence).toMatch(/deep torso wound/);
    // The same week told on the right place passes; so does a wrist or shoulder for an arm wound.
    expect(checkNarration('Over the following week, a medic tends to your wounded right arm using standard medpacs. The burn on your forearm slowly closes, and the ache in your shoulder fades.', week, true, { player: ['rightArm'] })).toEqual([]);
    // With no wound known there is nothing to misplace (the hit rules cover invented wounds in a fight).
    expect(checkNarration(text, week, true, { player: [] })).toEqual([]);
    // The fallback outside a fight drops the offending sentence.
    expect(fallbackNarration(text, week, issues)).toBe('Without the luxury of bacta or kolto tanks, the healing is slow and arduous.');
  });
  it('in a fight: a named opponent\'s wound on the wrong limb; another fighter\'s body is not yours', () => {
    const c = combat({ fighters: [PC, DUELIST], beat: 'woundingHit', narrate: [rec({ n: 9, kind: 'strike', striker: 'A', targetId: 'n1', margin: 11, hit: hit('A', 'rightArm', 'moderate') })] });
    expect(kinds('Your blade bites into Duelist 1, leaving a moderate wound across his thigh.', draft(c))).toContain('woundMisplaced');
    expect(kinds('Your blade bites into Duelist 1, leaving a moderate wound across his right arm.', draft(c))).toEqual([]);
    // The player has a torso wound from before; the opponent's chest is not the player's.
    const c2 = combat({ fighters: [{ ...PC, woundParts: ['torso'] }, { ...DUELIST, woundParts: ['torso'] }], beat: 'woundingHit', narrate: [rec({ n: 3, kind: 'strike', striker: 'A', targetId: 'n1', margin: 11, hit: hit('A', 'torso', 'moderate') })] });
    expect(kinds('Ignoring the pain in your chest, you drive your blade into Duelist 1, burning a moderate wound across his chest.', draft(c2))).toEqual([]);
    expect(kinds('Duelist 1 recoils, and pain flares in your left leg as you press on.', draft(c2), true)).toContain('woundMisplaced');
  });
});
