// D-211 (combat pass 2, issues 7, 13 and 15): slips with no terrain accident, the outcome list's terms in prose, and a
// minion cut down when the player hit none. Each case uses the narrator's own words from docs-v2/testing/combat-pass-2.md.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { checkNarration, fallbackNarration, mechanicalTerm, repairWording } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], ...over });
const PC = fighter('pc', 'Kael Voss', { form: 'soresu' });
const DUELIST = fighter('n1', 'Duelist 2');
const combat = (over: Partial<CombatDraft>): CombatDraft => ({ fightId: 'fight-5', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [PC, DUELIST], notes: [], ...over });
const draft = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const kinds = (text: string, c: CombatDraft): string[] => checkNarration(text, draft(c), false).map((i) => i.kind);

describe('slips, stumbles and lost footing need a terrain accident (D-201 in code; D-211)', () => {
  const plain = combat({});
  it.each([
    'You attempt to follow up with a Force push, but your footwork falters before you can gather the necessary focus.',
    'You clash blades once more, but your footwork falters and you are outpaced, giving your opponent room to press.',
    'Caught off balance by the misstep, you never get the chance to thrust out your hands.',
    'You try to push the advantage once more, but you are outpaced, your footing faltering as he drives you back.',
    'You are gently outpaced, your footing slipping just enough for your partner to slide past your guard.',
    'You reach out with both hands, but as you stumble slightly on your prosthetic leg, your momentum flags.',
  ])('flagged: %s', (text) => {
    expect(kinds(text, plain)).toContain('slipNoHazard');
  });
  it('allowed: the engine rolled a terrain accident; a Push threw him back; footing kept or regained; a blade slipping past; a slip of focus', () => {
    const fall = combat({ notes: ['terrain: Kael Voss falls on the uneven ground (minor leftHand)'] });
    expect(kinds('You retreat a step to parry, giving ground as your footing slips on the uneven stone, leaving your hand scraped.', fall)).not.toContain('slipNoHazard');
    const push = combat({ narrate: [rec({ kind: 'force', force: { kind: 'push', abilityId: 'forcePush', side: 'A', success: true, outcome: 'success' } as never })] });
    expect(kinds('Duelist 2 stumbles back a step, thrown off balance by the sudden impact.', push)).toEqual([]);
    expect(kinds('Regaining your footing, you meet his next cut squarely.', plain)).toEqual([]);
    expect(kinds('You keep your footing on the polished floor and hold your guard.', plain)).toEqual([]);
    expect(kinds('You slip away from his lunge and reset your stance.', plain)).toEqual([]);
    expect(kinds('A sudden slip of focus makes your control falter, and the push fizzles.', plain)).not.toContain('slipNoHazard');
  });
});

describe("the outcome list's terms in prose (D-205 R5 in code; D-211)", () => {
  it.each([
    ['You thrust forward with your blue-bladed lightsaber, catching Line trooper 1 square in the torso with a mortal strike that cuts him down instantly.', 'mortal strike'],
    ['A sudden searing bolt burns through your torso, leaving a moderate wound.', 'a moderate wound'],
    ['Turning the tide, you lash out at Line trooper 2, striking a moderate blow to the head.', 'a moderate blow'],
    ['A droid seizes the opening, its strike slipping past your guard to burn a painful, moderate wound into your left leg.', 'its strike slipping past your guard to burn a painful, moderate wound'],
    ['You surge ahead once more, sinking a severe, smoking cut deep into his torso.', 'a severe, smoking cut'],
    ['The mental effort proves just beyond your grasp, the roll falling short of the difficulty.', 'roll falling short'],
    ['The margin is narrow as you trade blows.', 'margin'],
    ['You land a HIT on his arm.', 'HIT'],
  ])('flagged: %s', (text, term) => {
    expect(mechanicalTerm(text)).not.toBeNull();
    void term;
  });
  it.each([
    'Your blade opens a deep cut along his forearm.',
    'The bolt leaves a grievous wound in your side.',
    'In a fierce exchange of blows, neither of you gives ground.',
    'A beat later he comes again, faster.',
    'You follow the narrow track between the trees.',
  ])('natural phrasing is fine: %s', (text) => {
    expect(mechanicalTerm(text)).toBeNull();
  });
  it('in a fight it is a contradiction (retried); the fallback keeps the wound in natural words', () => {
    const c = combat({ fighters: [PC, fighter('d3', 'B1 battle droid 3', { minion: true, weapon: 'blasterRifle', form: null })], narrate: [rec({ n: 6, kind: 'strike', striker: 'B', targetId: 'd3', hit: { by: 'B', quality: 'clean', D: 20, part: 'leftLeg', W: 15, severity: 'moderate', vitalityLost: 0, severed: false, avoided: false } })] });
    const text = 'A droid seizes the opening, its shot slipping past your guard to burn a painful, moderate wound into your left leg.';
    const issues = checkNarration(text, draft(c), false);
    expect(issues.map((i) => i.kind)).toEqual(['mechanicalTerms']);
    expect(fallbackNarration(text, draft(c), issues)).toBe('A droid seizes the opening, its shot slipping past your guard to burn a painful, deep wound into your left leg.');
    // D-236: wording repair never removes a sentence; a term it cannot swap is left for the re-check.
    expect(repairWording('The margin is narrow. You press on.')).toBe('The margin is narrow. You press on.');
  });
});

describe('a minion cut down when the player hit none (D-211)', () => {
  const droids = [2, 3, 4, 5].map((k) => fighter(`d${k}`, `B1 battle droid ${k}`, { minion: true, weapon: 'blasterRifle', form: null }));
  const sith = fighter('n1', 'Sith Duelist', { form: 'juyo' });
  const c = combat({ fighters: [fighter('pc', 'Tessa Rin', { form: 'soresu' }), sith, ...droids], narrate: [rec({ n: 2, targetId: 'n1', advBefore: -2, advAfter: 0, margin: 7.4 })], notes: ['step 1 strike: DONE (gains ground; no hit)'] });
  const exact = 'Left to face the droids alone, you spin instantly toward the nearest war droid and bring your lightsaber down in a swift, decisive arc, shearing cleanly through its metallic chassis.';
  it('the exact pass-2 sentence is caught', () => {
    expect(kinds(exact, c)).toContain('minionNotHit');
  });
  it('the same sentence is fine when the player did hit a droid; an ally cutting a droid down is not the player', () => {
    const hitOne = combat({ ...c, narrate: [rec({ n: 2, targetId: 'd2', kind: 'strike', striker: 'A', margin: 9, hit: { by: 'A', quality: 'solid', D: 40, part: 'torso', W: 40, severity: 'mortal', vitalityLost: 0, severed: false, avoided: false } })] });
    expect(kinds(exact, hitOne)).not.toContain('minionNotHit');
    expect(kinds('Master Vash cleaves through a war droid in a single stroke.', c)).not.toContain('minionNotHit');
    expect(kinds('You step in to cut down the nearest droid, but it skitters back out of reach.', c)).not.toContain('minionNotHit');
  });
  it.each(['You shear through B1 battle droid 3.', 'You dismantle B1 battle droid 3 with two quick strokes.', 'Your blade tears through B1 battle droid 3.', 'You fell B1 battle droid 3 with a single cut.', 'You bisect the nearest droid.', 'You slice the droid apart.'])('kill synonyms: %s', (text) => {
    expect(kinds(text, c)).toContain('minionNotHit');
  });
});
