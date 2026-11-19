// D-236 (combat pass 3, issues 3 and 4): the slip rule counts only the body (footing, balance, grip, a stumble, a fall),
// never "your focus slips"; a stumble or "off balance" is fine when the block has a hit, a Choke, a Push, a knockdown or
// a terrain accident on that fighter; and wording repair only swaps terms: no sentence is ever removed, and the result
// is checked again. Every slip quote of combat passes 1 to 3 is a fixture, both kinds.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { checkNarration, fallbackNarration, repairWording, rewordable, settleNarration } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], ...over });
const PC = fighter('pc', 'Joren Kast', { form: 'soresu' });
const DUELIST = fighter('n1', 'Duelist 1');
const combat = (over: Partial<CombatDraft> = {}): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [PC, DUELIST], notes: [], ...over });
const draft = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const kinds = (text: string, c: CombatDraft): string[] => checkNarration(text, draft(c), false).map((i) => i.kind);
const force = (kind: string, success: boolean, side: 'A' | 'B' = 'A'): ExchangeRecord => rec({ kind: 'force', force: { kind, abilityId: kind === 'choke' ? 'forceChoke' : kind === 'push' ? 'forcePush' : 'telekinesis', side, success, outcome: success ? 'success' : 'skillTooLow' } as never });
const hitOn = (who: 'pc' | 'opp', part = 'torso', severity: string | null = 'mortal'): ExchangeRecord => rec({ n: 9, kind: 'strike', striker: who === 'pc' ? 'B' : 'A', hit: { by: who === 'pc' ? 'B' : 'A', quality: 'clean', D: 30, part, W: 40, severity, vitalityLost: 0, severed: false, avoided: false } as never });

describe('rule 9, the slips of combat passes 1 and 2 are still caught', () => {
  const plain = combat();
  it.each([
    // Pass 1 (issue 19, R4).
    'A sudden misstep leaves you overextended as your footing slips.',
    'You press forward, but your footing slips on the scorched earth.',
    'You raise the blade, but your grip slips just a fraction on the energy matrix.',
    'Your footing slips slightly on the tall grass as he comes in.',
    'A critical misstep leaves your guard open.',
    // Pass 2 (issue 13).
    'You attempt to follow up with a Force push, but your footwork falters before you can gather the necessary focus.',
    'You clash blades once more, but your footwork falters and you are outpaced, giving your opponent room to press.',
    'Caught off balance by the misstep, you never get the chance to thrust out your hands.',
    'You try to push the advantage once more, but you are outpaced, your footing faltering as he drives you back.',
    'You are gently outpaced, your footing slipping just enough for your partner to slide past your guard.',
    'You reach out with both hands, but as you stumble slightly on your prosthetic leg, your momentum flags.',
    // More of the same kind.
    'You trip over a loose stone and he is on you at once.',
    'He loses his balance for a heartbeat and you step in.',
  ])('flagged: %s', (text) => {
    expect(kinds(text, plain)).toContain('slipNoHazard');
  });
  it('pass 3: a real invented slip is caught even when the same passage has a hit on that fighter', () => {
    const mira = combat({ narrate: [rec({ n: 2, margin: -9, advAfter: -4 }), hitOn('pc', 'leftLeg', 'moderate')] });
    expect(kinds('You lunge forward to press your advantage, but the second war droid sidesteps your strike, its heavy stride pushing you back as your footing slips for a fraction of a second.', mira)).toContain('slipNoHazard');
  });
});

describe('rule 9, the false alarms of combat pass 3 are gone', () => {
  it('"your focus slips", "the concentration slips": a failed recall or throw is not a slip of the body', () => {
    const failedRecall = combat({ narrate: [force('recall', false)] });
    for (const text of [
      'You reach out through the Force to summon your dropped lightsaber, but your focus slips and the hilt fails to answer your call.',
      'You reach for your lightsaber, hurling it toward the lead battle droid, but your focus slips at the crucial moment.',
      'Your focus slips for a fraction of a second, your fingers grasping at empty air as the lightsaber stays stubbornly on the grating just out of reach.',
      'You reach out with the Force to call your fallen lightsaber back to your hand, but the concentration slips; the weapon remains motionless on the cold metal grating.',
      'A sudden slip of focus makes your control falter, and the lightning fizzles harmlessly.',
      'The moment slips away before you can use it.',
    ])
      expect(kinds(text, failedRecall), text).not.toContain('slipNoHazard');
  });
  it('"stumbling off balance" after a Choke the block calls "thrown off balance"', () => {
    const choke = combat({ narrate: [force('choke', true)], notes: ['step 1 Force choke: DONE (Duelist 1 is thrown off balance: an opening, no injury)'] });
    expect(kinds('He gasps, choking on the sudden pressure, stumbling off balance and leaving his guard wide open.', choke)).toEqual([]);
    // The same words about the player, whom nothing touched, are still an invented stumble.
    expect(kinds('You press the grip tighter, but you stumble as he twists free.', choke)).toContain('slipNoHazard');
    // "Off balance" alone is being outpaced, not a slip.
    expect(kinds('He catches you off balance, and you give ground.', combat())).toEqual([]);
  });
  it('a fighter who was hit may stumble, fall or drop to his knees', () => {
    const mortal = combat({ narrate: [rec({ n: 8, margin: 9, advAfter: 3 }), hitOn('opp')] });
    expect(kinds('He stumbles backward, dropping to his knees in the crimson dust, mortally wounded and defeated.', mortal)).not.toContain('slipNoHazard');
    expect(kinds('As it stumbles from your outpaced pressure, you drive your blue blade forward, finding a fatal opening straight through its armor and deep into its torso.', mortal)).not.toContain('slipNoHazard');
    // A stumble on or over something is a slip of the feet, hit or no hit (pass 1: the trooper was then cut down).
    expect(kinds('As the first line trooper stumbles over the uneven terrain, you close the distance instantly and cut him down through the torso.', mortal)).toContain('slipNoHazard');
    // The hit was on the opponent: the player stumbling is still invented.
    expect(kinds('You stumble as you follow through, and he is already turning.', mortal)).toContain('slipNoHazard');
  });
  it('a Push, a thrown object, a knockdown and a terrain accident explain lost footing, on that fighter only', () => {
    const push = combat({ narrate: [force('push', true)] });
    expect(kinds('Duelist 1 stumbles back a step, thrown off balance by the sudden impact, and loses his footing.', push)).toEqual([]);
    expect(kinds('It stumbles backward, crashing heavily into the droids crowded behind it.', push)).toEqual([]);
    const fall = combat({ notes: ['terrain: Joren Kast falls on the uneven ground (minor right leg)'] });
    expect(kinds('You swing and parry, but stumble on a root amid the uneven ground, hitting the earth hard.', fall)).not.toContain('slipNoHazard');
    expect(kinds('You retreat a step to parry as your footing slips on the uneven stone.', fall)).not.toContain('slipNoHazard');
    // The accident was the player's: the opponent's slip is not in the block.
    expect(kinds('Duelist 1 loses his footing on the wet stone and you press in.', fall)).toContain('slipNoHazard');
    const oppFall = combat({ notes: ['terrain: Duelist 1 falls on the slippery surface (minor torso)'] });
    expect(kinds('Your footing slips on the ice as you turn.', oppFall)).toContain('slipNoHazard');
    expect(kinds('Duelist 1 slips on the ice and goes down hard.', oppFall)).not.toContain('slipNoHazard');
  });
  it('ordinary prose from the pass-3 narrations is not a slip', () => {
    const plain = combat();
    for (const text of [
      'Suddenly, B1 battle droid 5 slips past your guard, outpacing your stance.',
      'You drop into a desperate dive behind a stack of rusted coolant crates, your boots skidding on the oily ground.',
      'You slip into the guarded stances of Soresu, holding your ground.',
      'The hangar falls silent around you.',
      'Silence falls over the Dantooine wilderness once more, broken only by the crackle of cooling metal.',
      'As he pulls back to reset his stance, you spot a brief opening in his defense, slipping your blade past his guard.',
      'You immediately drive another cut at the same leg, but he slips outside your reach, parrying your momentum.',
      'Regaining your footing, you meet his next cut squarely.',
      'You keep your footing on the polished floor and hold your guard.',
      'He staggers under the weight of your parry but gives no ground.',
      'You trade blows back and forth, boots sliding on the loose dust, neither able to easily pierce the other\'s guard.',
    ])
      expect(kinds(text, plain), text).not.toContain('slipNoHazard');
  });
});

describe('wording repair only swaps terms (D-236)', () => {
  it('never removes a sentence: a label is swapped, any other engine term is left for the re-check', () => {
    expect(repairWording('You land a clean, severe cut across his left leg, then take a minor blow to your own ribs. He falls back.')).toBe('You land a clean, grievous cut across his left leg, then take a light blow to your own ribs. He falls back.');
    expect(repairWording('You strike a moderate wound to their right leg, a severe wound to the arm and a mortal strike to finish.')).toBe('You strike a deep wound to their right leg, a grievous wound to the arm and a deadly strike to finish.');
    expect(repairWording('The margin is narrow. You press on.')).toBe('The margin is narrow. You press on.');
    expect(repairWording('Your focus slips and the hilt fails to answer your call.')).toBe('Your focus slips and the hilt fails to answer your call.');
  });
  it('a label that a swap settles is reworded with no summary; the result has passed the check again', () => {
    const c = combat({ narrate: [rec({ n: 6, kind: 'strike', striker: 'B', hit: { by: 'B', quality: 'clean', D: 20, part: 'leftLeg', W: 15, severity: 'moderate', vitalityLost: 0, severed: false, avoided: false } as never })] });
    const text = 'He comes in low, his blade burning a painful, moderate wound into your left leg.';
    const issues = checkNarration(text, draft(c), false);
    expect(issues.map((i) => i.kind)).toEqual(['mechanicalTerms']);
    const recheck = (t: string) => checkNarration(t, draft(c), false);
    expect(rewordable(text, issues, recheck)).toBe('He comes in low, his blade burning a painful, deep wound into your left leg.');
    expect(settleNarration(text, draft(c), issues, recheck)).toEqual({ narrative: 'He comes in low, his blade burning a painful, deep wound into your left leg.', how: 'reworded' });
  });
  it('a term that no swap settles gets the summary, and every fact of the block is in it', () => {
    const c = combat({ narrate: [rec({ n: 17, margin: 11, advAfter: 5 }), hitOn('opp')], ended: { outcome: 'won', reason: 'dying', playerFate: null } });
    const text = 'The margin is wide now. You drive your blade deep into his torso and he goes down.';
    const issues = checkNarration(text, draft(c), false);
    const out = fallbackNarration(text, draft(c), issues);
    expect(out).toMatch(/Joren Kast hits Duelist 1: mortal wound to the torso\./);
    expect(out).toMatch(/The fight is over: won/);
    expect(out).not.toMatch(/margin/i);
  });
  it('pass 3, the kill that was cut out: a slip beside the killing blow is never repaired by deleting the sentence', () => {
    // Under the old rule the sentence was flagged (an opponent's stumble) and dropped with the kill in it.
    const c = combat({ fighters: [PC, fighter('n1', 'Yuuzhan Vong warrior', { weapon: 'melee', form: null })], narrate: [rec({ n: 17, margin: 11, advAfter: 5 }), hitOn('opp')], ended: { outcome: 'won', reason: 'dying', playerFate: null } });
    const kill = 'As it stumbles from your outpaced pressure, you drive your blue blade forward, finding a fatal opening deep into its torso.';
    const text = `You lock blades with the towering warrior. ${kill}`;
    expect(checkNarration(text, draft(c), false)).toEqual([]);
    // And when a real invented slip stands beside a fact, the summary carries the fact: nothing is silently lost.
    const bad = `You lock blades with the towering warrior. Your footing slips on the loose stone, yet you drive your blade deep into its torso.`;
    const issues = checkNarration(bad, draft(c), false);
    expect(issues.map((i) => i.kind)).toEqual(['slipNoHazard']);
    const settled = settleNarration(bad, draft(c), issues, (t) => checkNarration(t, draft(c), false));
    expect(settled.how).toBe('summary');
    expect(settled.narrative).toMatch(/hits Yuuzhan Vong warrior: mortal wound to the torso/);
  });
  it('a reworded text that still fails the check is not used', () => {
    // The label is swapped, but the sentence also invents a hit on the player: the re-check finds it.
    const c = combat();
    const text = 'His blade sears your shoulder, leaving a moderate wound.';
    const issues = [{ kind: 'mechanicalTerms' as const, text: '', sentence: text }];
    expect(rewordable(text, issues, (t) => checkNarration(t, draft(c), false))).toBeNull();
    expect(settleNarration(text, draft(c), issues, (t) => checkNarration(t, draft(c), false)).how).toBe('summary');
  });
});
