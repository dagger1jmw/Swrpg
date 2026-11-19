// D-209 (combat pass 2, issue 2): the code-written fallback is a summary of about 10 lines, never the engine's
// sentences, and the story history never carries a raw log into the next prompt.
import { describe, expect, it } from 'vitest';
import { NARRATION_FALLBACK } from '../../src/data/combat.config';
import { HISTORY_NARRATIVE_MAX_CHARS } from '../../src/ai/context.config';
import { makeEstimator } from '../../src/ai/tokenRatio';
import type { ExchangeRecord } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { clipNarrative, historyWindow } from '../../src/turn/context';
import { checkNarration, combatSummary, fallbackNarration } from '../../src/turn/narrationCheck';
import type { TurnRecord } from '../../src/turn/record';
import type { TurnDraft } from '../../src/turn/resolve';

const est = makeEstimator(4);
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 35, maxVitality: 35, status: 'Healthy', out: false, engagedElsewhere: false, minion: true, weapon: 'blasterRifle', form: null, lostParts: [], ...over });
const PC = fighter('pc', 'Kael Voss', { minion: false, weapon: 'unarmed' });
const PARTS = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'];
const SEV = [null, 'minor', null, 'moderate', null, 'severe'];

/** The pass-2 blocker's shape: hundreds of exchanges against six droids, hits both ways, wounds everywhere. */
function bigPassage(n: number): CombatDraft {
  const droids = Array.from({ length: 6 }, (_, i) => fighter(`d${i + 1}`, `B1 battle droid ${i + 1}`, { out: i < 5 }));
  const narrate: ExchangeRecord[] = Array.from({ length: n }, (_, i) => {
    const k = i % 7;
    const by = k === 3 ? 'B' : 'A';
    const hit = k === 1 || k === 3 ? ({ by, quality: 'solid', D: 10, part: PARTS[i % 6], W: 10, severity: SEV[i % 6], vitalityLost: 5, severed: false, avoided: false } as ExchangeRecord['hit']) : null;
    return { n: i + 9, kind: k === 2 ? 'strike' : 'buildUp', targetId: `d${(i % 6) + 1}`, rollA: null, rollB: null, margin: k === 2 ? -3 : 4.7, advBefore: 0, advAfter: 1, striker: k === 2 ? 'A' : null, hit, maneuver: null, effA: 50, effB: 20, seconds: 7, notes: [], surprise: false } as ExchangeRecord;
  });
  return { fightId: 'fight-4', started: false, records: narrate, narrate, beat: 'fightEnded', quiet: false, quietLine: null, ended: { outcome: 'lost', reason: 'incapacitated', playerFate: 'left' }, session: null, advantage: 0, fighters: [PC, ...droids], notes: [] };
}
const draftOf = (c: CombatDraft): TurnDraft => ({ intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: c, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] }) as unknown as TurnDraft;
const record = (turn: number, text: string, narrative: string): TurnRecord => ({ turn, input: { kind: 'typed', text }, narrative, draft: { applied: [] }, applied: [], clockAfter: { day: 0, second: 0 } }) as unknown as TurnRecord;

describe('the fallback summary (D-209)', () => {
  it(`a 300-exchange passage: at most ${NARRATION_FALLBACK.maxLines} plain sentences with counts, key events and the end state`, () => {
    const c = bigPassage(300);
    const lines = combatSummary(c);
    expect(lines.length).toBeLessThanOrEqual(NARRATION_FALLBACK.maxLines);
    expect(lines[0]).toMatch(/^300 exchanges of fighting: Kael Voss lands \d+ hits \(\d+ wounding\) and takes \d+ hits \(\d+ wounding\)\.$/);
    expect(lines[lines.length - 1]).toBe("The fight is over: lost; the opponent's choice: left.");
    const text = fallbackNarration('x', draftOf(c), [{ kind: 'woundOmitted', text: '', sentence: '' }]);
    expect(text).not.toMatch(/trade blows|NO HIT|margin|reason:|#\d/);
    expect(text.length).toBeLessThan(2000);
  });
  it('the 300-exchange fallback adds fewer than about 500 tokens to the next prompt', () => {
    const text = fallbackNarration('x', draftOf(bigPassage(300)), [{ kind: 'woundOmitted', text: '', sentence: '' }]);
    const before = historyWindow([record(1, 'I look around.', 'A quiet forest.')], 8000, est).report.tokens;
    const after = historyWindow([record(1, 'I look around.', 'A quiet forest.'), record(2, 'Resolve to end', text)], 8000, est).report.tokens;
    expect(after - before).toBeLessThan(500);
  });
  it('a short passage keeps every wound, so the fallback never contradicts the block', () => {
    const c = bigPassage(12);
    const text = combatSummary(c).join(' ');
    expect(checkNarration(text, draftOf(c), false).filter((i) => i.kind === 'woundOmitted')).toEqual([]);
  });
});

describe('history never carries a raw log (D-209)', () => {
  it(`an old save's 39,541-character fallback is clipped to ${HISTORY_NARRATIVE_MAX_CHARS} characters`, () => {
    const raw = 'Kael Voss and B1 battle droid 1 trade blows: no hit. Kael Voss gains ground (reason: B1 battle droid 1 gave ground) (margin 4.7). '.repeat(305);
    expect(raw.length).toBeGreaterThan(39_000);
    const clipped = clipNarrative(raw);
    expect(clipped.length).toBeLessThanOrEqual(HISTORY_NARRATIVE_MAX_CHARS + 6);
    const w = historyWindow([record(1, 'Resolve to end', raw)], 8000, est);
    expect(w.report.tokens).toBeLessThan(HISTORY_NARRATIVE_MAX_CHARS / 4 + 50);
    expect(clipNarrative('A short reply.')).toBe('A short reply.');
  });
});
