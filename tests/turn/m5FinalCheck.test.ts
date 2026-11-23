// M5 cleanup from docs-v2/testing/m5-final-check.md: the long-fight length, the engine words, the reword's repetition,
// the Force choices against opponents outside the Force, the withdrawal card and the wording. The Sith withdrawal
// amendment (D-268 amended) is tested in tests/engine/strikeIntent.test.ts.
import { describe, expect, it } from 'vitest';
import type { Choice } from '../../src/ai/schemas/compose';
import { NARRATION_LENGTH } from '../../src/data/combat.config';
import { PACING_OUTPUT_CAPS } from '../../src/data/pacing.config';
import type { ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { GameState } from '../../src/state/gameState';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { combatFacts, fightHighlights, longPassageProseTokens } from '../../src/turn/combatFacts';
import { describeCombat } from '../../src/turn/context';
import { outsideForceOpponents, withoutForceOnImmune } from '../../src/turn/fightChoices';
import { checkNarration, repairWording, rewordable } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';
import { outcomeText } from '../../src/ui/duelPanel';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'n1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 45, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: false, weapon: 'lightsaber', form: 'makashi', lostParts: [], ...over });
const combat = (pc: string, opp: CombatFighterView, over: Partial<CombatDraft> = {}): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [rec({})], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [fighter('pc', pc, { form: 'soresu' }), opp], notes: [], ...over });
const draft = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const issues = (text: string, c: CombatDraft) => checkNarration(text, draft(c), false);
const kinds = (text: string, c: CombatDraft): string[] => issues(text, c).map((i) => i.kind);
const many = (n: number): ExchangeRecord[] => Array.from({ length: n }, (_, i) => rec({ n: i + 1 }));

describe('long-fight length (M5 final check: 1 paragraph where about 4 were asked)', () => {
  it('a long passage gets a prose budget above the moment cap; a short one keeps the pacing cap', () => {
    expect(longPassageProseTokens(65)).toBe(4 * NARRATION_LENGTH.tokensPerParagraph);
    expect(longPassageProseTokens(65)).toBeGreaterThan(PACING_OUTPUT_CAPS.moment);
    expect(longPassageProseTokens(9)).toBe(0);
  });
  it('the Length line asks for the paragraphs, the blank lines and the words, over the pacing', () => {
    const block = describeCombat(combat('Joren Tal', fighter('n1', 'Duelist 1'), { narrate: many(65), ended: { outcome: 'won', reason: 'incapacitated' } as never })).join('\n');
    expect(block).toMatch(/Length: 4 paragraphs for these 65 exchanges, separated by blank lines, 80 to 130 words each \(320 to 520 words in all\); this overrides the pacing's usual length\. Not one paragraph/);
  });
  it('the code reword keeps the paragraphs (every reworded long fight came back as one)', () => {
    const text = 'You trade blows. A severe cut opens his arm.\n\nThe fight turns. He is out of the fight.';
    expect(repairWording(text)).toBe('You trade blows. A grievous cut opens his arm.\n\nThe fight turns. He is unable to fight on.');
  });
});

describe('engine words (M5 final check)', () => {
  it('the block says "no wound (winded)", never "stamina only"', () => {
    const r = rec({ n: 3, kind: 'strike', striker: 'A', hit: { by: 'A', quality: 'graze', D: 5, part: 'torso', W: 0, severity: null, vitalityLost: 4, severed: false, avoided: false } as never });
    const block = describeCombat(combat('Joren Tal', fighter('n1', 'Duelist 1'), { narrate: [r] })).join('\n');
    expect(block).toMatch(/no wound \(winded\)/);
    expect(block).not.toMatch(/stamina only/);
  });
  it('"stamina" in prose is flagged and reworded in code, with no retry', () => {
    const c = combat('Rell Tarn', fighter('n1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null }));
    const text = 'The relentless barrage keeps draining your remaining stamina.';
    const found = issues(text, c);
    expect(found.map((i) => i.kind)).toEqual(['mechanicalTerms']);
    expect(rewordable(text, found, (t) => issues(t, c))).toBe('The relentless barrage keeps wearing you down.');
    expect(repairWording('It rattles your stamina but leaves no mark.')).toBe('It rattles your strength but leaves no mark.');
  });
  it('"outpace" is flagged unless the block gives "was outpaced" as a miss reason', () => {
    const plain = combat('Daven Rook', fighter('n1', 'Yuuzhan Vong Warrior', { weapon: 'melee', form: null }));
    expect(kinds('You fluidly step aside and outpace the strike.', plain)).toContain('mechanicalTerms');
    expect(repairWording('You fluidly step aside and outpace the strike.')).toBe('You fluidly step aside and outmatch the strike.');
    const outpaced = combat('Daven Rook', fighter('n1', 'Yuuzhan Vong Warrior', { weapon: 'melee', form: null }), { narrate: [rec({ n: 1, margin: 12, advBefore: 0, advAfter: 3 })] });
    expect(describeCombat(outpaced).join('\n')).toMatch(/was outpaced/);
    expect(kinds('You fluidly step aside and outpace the strike.', outpaced)).not.toContain('mechanicalTerms');
  });
});

describe('the reword varies its words (M5 final check: "grievous" three times in one paragraph)', () => {
  it('a severity word is never used twice in one passage', () => {
    const out = repairWording('A severe burn finds your head. Another severe strike bites your arm. You land a severe cut on his leg.');
    expect(out).toBe('A grievous burn finds your head. Another savage strike bites your arm. You land a brutal cut on his leg.');
  });
  it('a word the narrator already used is skipped', () => {
    expect(repairWording('The grievous moment passes. A severe cut opens his arm.')).toBe('The grievous moment passes. A savage cut opens his arm.');
  });
  it('"unable to stand, left out of the fight" says "unable" once', () => {
    expect(repairWording('The towering figure collapses into the dust, unable to stand, left out of the fight.')).toBe('The towering figure collapses into the dust, unable to stand.');
    expect(repairWording('Your opponent collapses, neutralized and out of the fight.')).toBe('Your opponent collapses, neutralized and unable to fight on.');
  });
});

describe('wording (M5 final check)', () => {
  it('Highlights: "only Joren Tal lands anything"; "the opponents land" for several', () => {
    const hit = (n: number, by: 'A' | 'B'): ExchangeRecord => rec({ n, kind: 'strike', striker: by, hit: { by, quality: 'solid', D: 20, part: 'torso', W: 10, severity: 'moderate', vitalityLost: 8, severed: false, avoided: false } as never });
    const c = combat('Joren Tal', fighter('n1', 'Duelist 12'), { narrate: [hit(5, 'B'), hit(27, 'A'), hit(77, 'A')], ended: { outcome: 'won', reason: 'incapacitated' } as never });
    expect(fightHighlights(c, combatFacts(c)).join('; ')).toMatch(/#27 the turning point: from here on only Joren Tal lands anything/);
    const lost = { ...c, fighters: [...c.fighters, fighter('n2', 'Duelist 13')], narrate: [hit(5, 'A'), hit(27, 'B'), hit(77, 'B')], ended: { outcome: 'lost', reason: 'incapacitated' } as never };
    expect(fightHighlights(lost, combatFacts(lost)).join('; ')).toMatch(/only the opponents land anything/);
  });
  it('two lightsabers never meet as "steel": flagged and reworded in code; a blaster fight is left alone', () => {
    const duel = combat('Joren Tal', fighter('n1', 'Duelist 12'));
    const text = 'You absorb a ferocious barrage of strikes as steel and light meet in a blur.';
    const found = issues(text, duel);
    expect(found.map((i) => i.kind)).toEqual(['mechanicalTerms']);
    expect(rewordable(text, found, (t) => issues(t, duel))).toBe('You absorb a ferocious barrage of strikes as energy and light meet in a blur.');
    expect(kinds('You steel yourself for the next pass.', duel)).not.toContain('mechanicalTerms');
    const blasters = combat('Rell Tarn', fighter('n1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null }), { fighters: [fighter('pc', 'Rell Tarn', { weapon: 'blasterPistol', form: null }), fighter('n1', 'Line trooper 1', { minion: true, weapon: 'blasterRifle', form: null })] });
    expect(kinds('The steel catwalk rings under your boots.', blasters)).not.toContain('mechanicalTerms');
  });
  it('the withdrawal card says "withdraws" with its margin', () => {
    const r = rec({ n: 10, margin: 13.3, advBefore: 0, advAfter: 0, notes: ['Duelist 1 rolled a natural 1: opening for Joren Tal', 'Duelist 1 withdraws: breaks off the fight and escapes, out of the fight'] });
    expect(outcomeText(r, { pc: 'Joren Tal', n1: 'Duelist 1' })).toBe('Duelist 1 withdraws · margin +13.3');
  });
});

describe('Force choices against opponents outside the Force, from the first turn (M5 final check)', () => {
  const choice = (label: string): Choice => ({ label, intent: { actionType: 'fight' } }) as Choice;
  const opening = [choice('Ignite your lightsaber and assume a Soresu defensive stance'), choice('Sidestep the charge and use the Force to push him off balance')];
  const state = (speciesId: string): GameState =>
    ({
      combat: { active: null, pending: { opponentRefs: ['npc-1'], minionGroups: [], stakes: 'lethal', terrainTags: [], ambushClaim: false, engagedElsewhere: [], sparringMode: null, wantAlive: [] } },
      npcs: { byId: { 'npc-1': { id: 'npc-1', name: 'Yuuzhan Vong Warrior', speciesId, status: 'active' } } },
    }) as unknown as GameState;
  it('a pending fight against a Yuuzhan Vong drops the Force push; a human opponent keeps it', () => {
    expect(outsideForceOpponents(state('yuuzhanVong'))).toEqual(['Yuuzhan Vong Warrior']);
    const vong = withoutForceOnImmune(state('yuuzhanVong'), opening);
    expect(vong.choices.map((c) => c.label)).toEqual(['Ignite your lightsaber and assume a Soresu defensive stance']);
    expect(vong.dropped).toBe(1);
    expect(withoutForceOnImmune(state('human'), opening).choices).toHaveLength(2);
  });
  it('a Vong minion group counts; a Force jump or a thrown object is kept; an emptied list gets one plain move', () => {
    const s = { ...state('human'), combat: { active: null, pending: { ...state('human').combat.pending!, opponentRefs: [], minionGroups: [{ kind: 'yuuzhanVongWarrior', count: 3 }] } } } as unknown as GameState;
    expect(outsideForceOpponents(s)).toEqual(['Yuuzhan Vong warrior']);
    const kept = withoutForceOnImmune(s, [choice('Leap over them with a Force jump'), choice('Hurl a loose boulder at the nearest warrior'), choice('Force push the front rank back')]);
    expect(kept.choices.map((c) => c.label)).toEqual(['Leap over them with a Force jump', 'Hurl a loose boulder at the nearest warrior']);
    expect(withoutForceOnImmune(s, [choice('Use a mind trick on the warriors')]).choices.map((c) => c.label)).toEqual(['Meet the attack with your weapon']);
  });
  it('lightning and Electric Judgment reach the Vong, so those choices stay (D-447)', () => {
    const s = { ...state('human'), combat: { active: null, pending: { ...state('human').combat.pending!, opponentRefs: [], minionGroups: [{ kind: 'yuuzhanVongWarrior', count: 3 }] } } } as unknown as GameState;
    const kept = withoutForceOnImmune(s, [choice('Loose Electric Judgment on the warriors'), choice('Call Force lightning down on them'), choice('Force push the front rank back')]);
    expect(kept.choices.map((c) => c.label)).toEqual(['Loose Electric Judgment on the warriors', 'Call Force lightning down on them']);
  });
});
