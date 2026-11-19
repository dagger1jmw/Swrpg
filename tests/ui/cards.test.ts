// Roll cards and labels from combat pass 1 (issues 16, 17, 20, 21): pure text helpers of the duel panel.
import { describe, expect, it } from 'vitest';
import type { ExchangeRecord } from '../../src/engine/duel';
import { abilityName, endText, marginLabel, outcomeText, rollText } from '../../src/ui/duelPanel';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'd1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 20, seconds: 6, notes: [], surprise: false, ...o });
const names = { pc: 'Kael Voss', d1: 'B1 battle droid 1', m1: 'Mandalorian warrior 1' };
const hit = (by: 'A' | 'B', part: string, severity: string | null) => ({ by, quality: 'solid', D: 20, part, W: 15, severity, vitalityLost: 10, severed: false, avoided: false }) as ExchangeRecord['hit'];

describe('roll card headlines and numbers (issue 20)', () => {
  it('a build-up exchange that cuts a minion down is headed by the hit, with the wound in words', () => {
    expect(outcomeText(rec({ margin: 9, advAfter: 0, advBefore: 2, hit: hit('A', 'leftArm', 'moderate') }), names)).toBe('solid hit on B1 battle droid 1 · moderate wound, left arm');
  });
  it('the margin is from the player\'s side, never -0.0', () => {
    expect(marginLabel(rec({ kind: 'strike', striker: 'B', targetId: 'm1', margin: 10.4 }), 'Kael Voss')).toBe('Margin for Kael Voss -10.4');
    expect(marginLabel(rec({ margin: -6.4 }), 'Kael Voss')).toBe('Margin for Kael Voss -6.4');
    expect(marginLabel(rec({ margin: -0.04 }), 'Kael Voss')).toBe('Margin for Kael Voss 0');
  });
  it('a Force use blocked after beating its difficulty says so', () => {
    const force = { kind: 'lightning', abilityId: 'forceLightning', side: 'A', success: false, outcome: 'cover', dc: 11, resist: null, misfire: false, collapse: false, damage: null, backlashMental: 0 } as never;
    const r = rec({ kind: 'force', margin: 8.4, force });
    expect(marginLabel(r, 'Kael Voss')).toBe('Kael Voss roll vs DC +8.4 (then blocked by cover)');
    expect(outcomeText(r, names)).toBe('Force Lightning: blocked by cover (DC 11)');
  });
  it('one entry per modifier source; "numbers" without its value repeated', () => {
    const roll = { d20: 12, natural: null, naturalBonus: 0, levelBonus: 5.4, modifiers: [{ source: 'aggressive stance', value: 1 }, { source: 'aggressive stance', value: -1 }, { source: 'numbers', value: 3 }], total: 20.4 } as never;
    expect(rollText('Kael Voss', roll)).toBe('Kael Voss: d20 12 +5.4 level +3 numbers = 20.4');
  });
});

describe('labels for the player (issues 17, 21)', () => {
  it('a Force record from an old save reads "resisted", never undefined', () => {
    const force = { kind: 'throw', abilityId: 'telekinesis', side: 'A', success: false, misfire: false, collapse: false, damage: null, backlashMental: 0 } as never;
    expect(outcomeText(rec({ kind: 'force', force }), names)).toBe('Telekinesis: resisted');
  });
  it('ability names and end reasons in words', () => {
    expect(abilityName('forcePush')).toBe('Force Push');
    expect(abilityName('mindTrick')).toBe('Mind Trick');
    expect(endText('won', 'allOut')).toBe('won: every opponent is down');
    expect(endText('won', 'dying')).toBe('won: a fighter is dying');
    expect(endText('lost', 'sparring session (stopped)')).toBe('lost: sparring session: stopped');
  });
});
