// Combat pass 5 fixes (D-268 to D-273): natural-1 fumbles and the slip rule, the fight-over line, and the other block
// changes. Each narration case uses the narrator's own words from docs-v2/testing/combat-pass-5.md.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { fumbleText } from '../../src/turn/combatFacts';
import { describeCombat } from '../../src/turn/context';
import { checkNarration } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], ...over });
const combat = (pc: string, opp: CombatFighterView, over: Partial<CombatDraft> = {}): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [fighter('pc', pc, { form: 'soresu' }), opp], notes: [], ...over });
const draft = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const kinds = (text: string, c: CombatDraft): string[] => checkNarration(text, draft(c), false).map((i) => i.kind);
/** An exchange in which the player (A) or the opponent (B) rolled a natural 1, with the engine's own note. */
const nat1 = (who: 'A' | 'B', pc: string, opp: string, n = 11): ExchangeRecord =>
  rec({ n, margin: who === 'A' ? -12 : 12, advAfter: who === 'A' ? -5 : 5, [who === 'A' ? 'rollA' : 'rollB']: { d20: 1, natural: 'nat1' } as never, notes: [`${who === 'A' ? pc : opp} rolled a natural 1: opening for ${who === 'A' ? opp : pc}`] });

describe('natural-1 fumbles (D-269)', () => {
  it('the block tells a natural 1 as that fighter\'s mistake (fumble), with the words it may be told with', () => {
    expect(fumbleText('Joren Tal rolled a natural 1: opening for Thug 1')).toBe('Joren Tal makes a mistake (fumble): an opening for Thug 1; tell it as a misstep, a stumble or an overextension by Joren Tal (no fall, no slip on the ground)');
    const c = combat('Joren Tal', fighter('n1', 'Duelist 24'), { narrate: [nat1('B', 'Joren Tal', 'Duelist 24')] });
    const block = describeCombat(c).join('\n');
    expect(block).toMatch(/Duelist 24 makes a mistake \(fumble\): an opening for Joren Tal/);
    expect(block).not.toMatch(/rolled a natural 1/);
  });
  it('the three pass-5 sentences: no slip on the fighter who fumbled', () => {
    // Joren against Duelist 24: the duelist's natural 1.
    const d24 = combat('Joren Tal', fighter('n1', 'Duelist 24'), { narrate: [nat1('B', 'Joren Tal', 'Duelist 24')] });
    expect(kinds('You trade more frantic blows, back and forth across the room, until his rhythm falters with a sudden misstep.', d24)).not.toContain('slipNoHazard');
    // Joren against six thugs: his own natural 1.
    const thugs = combat('Joren Tal', fighter('n1', 'Thug 1', { minion: true, weapon: 'blasterPistol', form: null }), { narrate: [nat1('A', 'Joren Tal', 'Thug 1', 1)] });
    expect(kinds('You draw your blue blade, but a misstep throws your stance off balance as the first bolt scorches past.', thugs)).not.toContain('slipNoHazard');
    // Varek against Duelist 1: his own natural 1. The block's miss reason is "was outpaced", so "outpaced" tells it and is
    // not flagged (M5 final check); with no such reason it is.
    const varek = combat('Varek Thane', fighter('n1', 'Duelist 1'), { narrate: [nat1('A', 'Varek Thane', 'Duelist 1', 3)] });
    expect(describeCombat(varek).join('\n')).toMatch(/was outpaced/);
    const k = kinds('As the bout presses on, you are outpaced, a fraction of a second too slow as a natural misstep leaves your defense wide open.', varek);
    expect(k).not.toContain('slipNoHazard');
    expect(k).not.toContain('mechanicalTerms');
    const plain = combat('Varek Thane', fighter('n1', 'Duelist 1'));
    expect(describeCombat(plain).join('\n')).not.toMatch(/was outpaced/);
    expect(kinds('You step aside and outpace the strike.', plain)).toContain('mechanicalTerms');
    // Overextending is a fumble word too.
    expect(kinds('You overextend on the lunge, and he slides inside your guard.', varek)).not.toContain('slipNoHazard');
  });
  it('the fumble is that fighter\'s only: the other one\'s misstep is still invented', () => {
    const d24 = combat('Joren Tal', fighter('n1', 'Duelist 24'), { narrate: [nat1('B', 'Joren Tal', 'Duelist 24')] });
    expect(kinds('A critical misstep leaves your guard open.', d24)).toContain('slipNoHazard');
    expect(kinds('You stumble as you follow through, and he is already turning.', d24)).toContain('slipNoHazard');
    const own = combat('Joren Tal', fighter('n1', 'Duelist 24'), { narrate: [nat1('A', 'Joren Tal', 'Duelist 24')] });
    expect(kinds('He loses his balance for a heartbeat and you step in.', own)).toContain('slipNoHazard');
  });
  it('a natural 1 explains a misstep, never a slip on the ground: the earlier real slips still fire with one in the passage', () => {
    const own = combat('Joren Tal', fighter('n1', 'Duelist 1'), { narrate: [nat1('A', 'Joren Tal', 'Duelist 1')] });
    for (const text of [
      'You press forward, but your footing slips on the scorched earth.',
      'You raise the blade, but your grip slips just a fraction on the energy matrix.',
      'Your footing slips slightly on the tall grass as he comes in.',
      'You trip over a loose stone and he is on you at once.',
      'You clash blades once more, but your footwork falters and you are outpaced, giving your opponent room to press.',
      'You reach out with both hands, but as you stumble slightly on your prosthetic leg, your momentum flags.',
    ])
      expect(kinds(text, own), text).toContain('slipNoHazard');
    const theirs = combat('Joren Tal', fighter('n1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null }), { narrate: [nat1('B', 'Joren Tal', 'Line trooper 1')] });
    expect(kinds('As the first line trooper stumbles over the uneven terrain, you close the distance instantly.', theirs)).toContain('slipNoHazard');
  });
  it('with no natural 1 in the passage, the pass-5 words are slips as before', () => {
    const plain = combat('Joren Tal', fighter('n1', 'Duelist 24'));
    expect(kinds('You trade more frantic blows, back and forth across the room, until his rhythm falters with a sudden misstep.', plain)).toContain('slipNoHazard');
  });
});

describe('the fight-over line (pass 5 issue 6)', () => {
  const base = combat('Joren Tal', fighter('n1', 'Thug 1', { minion: true, weapon: 'blasterPistol', form: null }));
  it('an ended fight says it is over, and never that it goes on', () => {
    const block = describeCombat({ ...base, ended: { outcome: 'won', reason: 'allOut' } as never }).join('\n');
    expect(block).toMatch(/The fight is over: won \(allOut\)/);
    expect(block).not.toMatch(/The fight goes on/);
  });
  it('a capture says who took the player, and not that the fight goes on', () => {
    const block = describeCombat({ ...base, ended: { outcome: 'lost', reason: 'captured', playerFate: 'captured', captors: { group: '3 line troopers', kind: 'trooper', names: ['Line trooper 2', 'Line trooper 3', 'Line trooper 4'] } } as never }).join('\n');
    expect(block).toMatch(/Captured by: 3 line troopers/);
    expect(block).not.toMatch(/The fight goes on/);
  });
  it('a fight still going says so, once', () => {
    const block = describeCombat(base).join('\n');
    expect(block.match(/The fight goes on/g)).toHaveLength(1);
    expect(block).not.toMatch(/The fight is over/);
  });
});

describe('a long fight told in full: the pass-5 capture fight (D-271)', () => {
  // Rell Tarn (a smuggler, blaster pistol) against 4 line troopers sent to take him alive, 51 exchanges, Resolve to end:
  // the log of pass 5 issue 5, exchange by exchange where it mattered.
  const stunHit = (n: number, quality: string): ExchangeRecord => rec({ n, kind: 'strike', striker: 'B', targetId: 't1', margin: -12, hit: { by: 'B', quality, D: 14, part: 'torso', W: 0, severity: null, vitalityLost: 12, severed: false, avoided: false, stun: 'stunBolt' } as never });
  const pcHit = (n: number, target: string, severity: string | null, notes: string[] = []): ExchangeRecord => rec({ n, kind: 'strike', striker: 'A', targetId: target, margin: 9, hit: { by: 'A', quality: severity ? 'solid' : 'graze', D: 12, part: 'torso', W: severity ? 6 : 0, severity, vitalityLost: 6, severed: false, avoided: false } as never, notes });
  const narrate: ExchangeRecord[] = Array.from({ length: 51 }, (_, i) => rec({ n: i + 1, targetId: i < 30 ? 't1' : 't2', margin: i % 2 ? 4 : -4 }));
  narrate[3] = pcHit(4, 't1', 'minor');
  narrate[12] = stunHit(13, 'graze');
  narrate[21] = stunHit(22, 'clean');
  narrate[29] = pcHit(30, 't1', 'minor', ['Rell Tarn shoots down Line trooper 1', 'Line trooper 1 is out of the fight']);
  narrate[35] = pcHit(36, 't2', null);
  narrate[50] = { ...stunHit(51, 'clean'), targetId: 't2', notes: ['Rell Tarn is Spent and subdued: taken captive'] };
  const trooper = (id: string, n: number, out = false): CombatFighterView => fighter(id, `Line trooper ${n}`, { minion: true, weapon: 'blasterRifle', form: null, out, intent: 'capture', subdue: 'stunBolt' } as Partial<CombatFighterView>);
  const capture: CombatDraft = {
    ...combat('Rell Tarn', trooper('t1', 1, true)),
    fighters: [fighter('pc', 'Rell Tarn', { weapon: 'blasterPistol', form: null, out: true }), trooper('t1', 1, true), trooper('t2', 2), trooper('t3', 3), trooper('t4', 4)],
    narrate,
    beat: 'resolve' as never,
    ended: { outcome: 'lost', reason: 'captured', playerFate: 'captured', captors: { group: '3 line troopers', kind: 'trooper', names: ['Line trooper 2', 'Line trooper 3', 'Line trooper 4'] } } as never,
  };
  const block = describeCombat(capture).join('\n');
  it('the block lists the highlights in order: the stun hits, the trooper shot down, the capture', () => {
    const line = block.split('\n').find((l) => l.startsWith('Highlights'))!;
    expect(line).toBeDefined();
    const order = ['#13 Line trooper 1 stuns Rell Tarn (no wound)', '#22 Line trooper 1 stuns Rell Tarn (no wound)', '#30 Rell Tarn shoots down Line trooper 1', '#51 Line trooper 2 stuns Rell Tarn (no wound)', '#51 Rell Tarn is Spent and subdued: taken captive'];
    let at = -1;
    for (const x of order) {
      const i = line.indexOf(x);
      expect(i, x).toBeGreaterThan(at);
      at = i;
    }
  });
  it('the length: about 3 paragraphs for 51 exchanges, the fight first and the end after', () => {
    expect(block).toMatch(/Length: 3 paragraphs for these 51 exchanges, separated by blank lines, 80 to 130 words each \(240 to 390 words in all\); this overrides the pacing's usual length\. Not one paragraph: the first 2 tell the fight itself, as it happened, in order; the last tells how it was decided and the aftermath\./);
    expect(block).toMatch(/Captured by: 3 line troopers/);
    expect(block).not.toMatch(/The fight goes on/);
  });
  it('a stun hit has no place on the body (pass 5 issue 14: "squarely in the chest")', () => {
    expect(block).toMatch(/#13 Line trooper 1 stuns Rell Tarn: HIT \(Rell Tarn, no wound and no place on the body/);
    expect(block).toMatch(/#13 on Rell Tarn \(stuns: no wound, no place\)/);
    expect(block).not.toMatch(/#13 on Rell Tarn \(torso/);
  });
  it('the length guideline caps at 4 paragraphs and never goes under 1', () => {
    const long = describeCombat({ ...capture, narrate: Array.from({ length: 200 }, (_, i) => rec({ n: i + 1, targetId: 't2' })) }).join('\n');
    expect(long).toMatch(/Length: 4 paragraphs for these 200 exchanges/);
    const short = describeCombat({ ...capture, narrate: narrate.slice(0, 5) }).join('\n');
    expect(short).not.toMatch(/Length:/);
  });
  it('the prompt asks for the arc before the aftermath', async () => {
    const { readFileSync } = await import('node:fs');
    const prompt = readFileSync('src/ai/prompts/combat-narration.md', 'utf8');
    expect(prompt).toMatch(/A long passage is told as a fight, not as its aftermath\./);
    expect(prompt).toMatch(/never only the binders or the march afterwards/);
  });
});

describe('the code-written summary keeps who broke, withdrew or was taken (pass 5 issue 7)', () => {
  it('a thug\'s surrender and a capture survive the summary', async () => {
    const { combatSummary } = await import('../../src/turn/narrationCheck');
    const thugs = combat('Joren Tal', fighter('n1', 'Thug 4', { minion: true, weapon: 'blasterPistol', form: null }), {
      narrate: [rec({ n: 12, notes: ["Thug 4's morale breaks: surrenders, out of the fight"] })],
      ended: { outcome: 'won', reason: 'allOut' } as never,
    });
    expect(combatSummary(thugs).at(-1)).toBe('The fight is over: won. Thug 4 surrenders.');
    const taken = combat('Rell Tarn', fighter('n1', 'Line trooper 2', { minion: true, weapon: 'blasterRifle', form: null }), {
      narrate: [rec({ n: 51, notes: ['Rell Tarn is Spent and subdued: taken captive'] })],
      ended: { outcome: 'lost', reason: 'captured', playerFate: 'captured' } as never,
    });
    expect(combatSummary(taken).at(-1)).toBe("The fight is over: lost; the opponent's choice: captured. Rell Tarn is subdued and taken captive.");
  });
});

describe('the other pass-5 minor issues', () => {
  it('9: the exchange a Sith withdraws on is headed by its margin, not the track reset', async () => {
    const { outcomeText } = await import('../../src/ui/duelPanel');
    const names = { pc: 'Joren Tal', n1: 'Duelist 1' };
    // M5 final check: the card says the withdrawal and its margin, not "gains ground" with a track reset.
    expect(outcomeText(rec({ n: 37, margin: 9.9, advBefore: 1, advAfter: 0, notes: ['Duelist 1 withdraws: breaks off the fight and escapes, out of the fight'] }), names)).toBe('Duelist 1 withdraws · margin +9.9');
    expect(outcomeText(rec({ n: 12, margin: 4.2, advBefore: 2, advAfter: 0, notes: ["Duelist 1's morale breaks: surrenders, out of the fight"] }), names)).toBe('Duelist 1 surrenders · margin +4.2');
    expect(outcomeText(rec({ n: 8, margin: -3, advBefore: 1, advAfter: 0 }), names)).toBe('Duelist 1 gains ground');
  });
  it('10: a hit on a prosthetic says where and why on the card and in the block', async () => {
    const { outcomeText } = await import('../../src/ui/duelPanel');
    const r = rec({ n: 10, kind: 'strike', striker: 'B', hit: { by: 'B', quality: 'critical', D: 40, part: 'rightArm', W: 0, severity: null, vitalityLost: 9, severed: false, avoided: false, prosthetic: true } as never });
    expect(outcomeText(r, { pc: 'Joren Tal', n1: 'Duelist 1' })).toBe('critical hit on Joren Tal · right arm (prosthetic): no wound');
    expect(describeCombat(combat('Joren Tal', fighter('n1', 'Duelist 1'), { narrate: [r] })).join('\n')).toMatch(/HIT \(Joren Tal, right arm, the prosthetic limb takes it: no wound \(winded\)\)/);
  });
  it('11: "his stamina taxed", "tests your own endurance", "forced outpaced" are repaired; "your stamina holds" and "not outpaced" stay', async () => {
    const { mechanicalTerm, repairWording } = await import('../../src/turn/narrationCheck');
    expect(repairWording('Your blade grazes his torso, leaving his stamina taxed, while he returns a sharp strike that tests your own endurance.')).toBe('Your blade grazes his torso, leaving him worn down, while he returns a sharp strike that wears you down.');
    expect(repairWording('You are forced outpaced across the uneven floor.')).toBe('You are pressed hard across the uneven floor.');
    // M5 final check: "stamina" joins the check; the repair says "strength".
    expect(mechanicalTerm('Though your stamina holds against the shock, you reel.')).toBe('stamina');
    expect(repairWording('Though your stamina holds against the shock, you reel.')).toBe('Though your strength holds against the shock, you reel.');
    expect(mechanicalTerm('You are not outpaced for long.')).toBeNull();
  });
  it('12: a fighter outside the Force is named in the block, with no Force choices against them', () => {
    const vong = fighter('n1', 'Yuuzhan Vong Warrior', { weapon: 'melee', form: null, outsideForce: true } as Partial<CombatFighterView>);
    expect(describeCombat(combat('Daven Rook', vong)).join('\n')).toMatch(/Outside the Force: Yuuzhan Vong Warrior\. No Force push, choke, grip or mind trick can touch them.*Force lightning or Electric Judgment still can/);
  });
  it('13: a chosen fate is stated in RESOLVED as the act, here and now', async () => {
    const { resolvedBlock } = await import('../../src/turn/context');
    const d = { ...draft(null as never), combat: null, applied: [{ event: { type: 'fateChosen', npcRef: 'npc:duelist-8', fate: 'kill' }, notes: ['npc:duelist-8: kill', 'fate act: kills Duelist 8'] }] } as unknown as TurnDraft;
    expect(resolvedBlock(d)).toMatch(/Fate chosen: the player character kills Duelist 8, the beaten opponent of the fight just ended, here and now\. Narrate exactly this act/);
  });
  it('15: the prompt keeps lightsabers off metal and ship words off temples', async () => {
    const { readFileSync } = await import('node:fs');
    const prompt = readFileSync('src/ai/prompts/combat-narration.md', 'utf8');
    expect(prompt).toMatch(/they never ring or clang as steel or iron/);
    expect(prompt).toMatch(/Bulkheads, deckplates and viewports belong to starships and stations/);
  });
});
