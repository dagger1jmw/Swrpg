// The narrator's block details from combat pass 1 (issue 19, R3, R5; D-205): blade colours on the Weapons line, who
// holds the advantage, the bout result, the thrown object, one target only; and the prompt rules that go with them.
import { describe, expect, it } from 'vitest';
import { PROMPTS } from '../../src/ai/prompts';
import { CANON_BY_ID } from '../../src/data/canonNpcs';
import { bladeColorFor } from '../../src/data/weapons';
import type { ExchangeRecord } from '../../src/engine/duel';
import { buildPlayerFighter } from '../../src/features/combat/build';
import type { CombatDraft, CombatFighterView } from '../../src/turn/combatTurn';
import { describeCombat } from '../../src/turn/context';
import { devCharacter } from '../support/fightHarness';

const rec = (o: Partial<ExchangeRecord>): ExchangeRecord => ({ n: 1, kind: 'buildUp', targetId: 'd1', rollA: null, rollB: null, margin: 0, advBefore: 0, advAfter: 0, striker: null, hit: null, maneuver: null, effA: 50, effB: 20, seconds: 6, notes: [], surprise: false, ...o });
const fighter = (id: string, name: string, over: Partial<CombatFighterView> = {}): CombatFighterView => ({ id, name, vitality: 50, maxVitality: 50, status: 'Healthy', out: false, engagedElsewhere: false, minion: true, weapon: 'blasterRifle', form: null, lostParts: [], ...over });
const PC = fighter('pc', 'Kael Voss', { minion: false, weapon: 'lightsaber', form: 'soresu', bladeColor: 'blue' });
const droids = [fighter('d1', 'B1 battle droid 1'), fighter('d2', 'B1 battle droid 2'), fighter('d3', 'B1 battle droid 3')];
const combat = (over: Partial<CombatDraft>): CombatDraft => ({ fightId: 'fight-1', started: false, records: [], narrate: [], beat: 'sequence', quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [PC, ...droids], notes: [], ...over });
const block = (c: CombatDraft) => describeCombat(c).join('\n');

describe('blade colours (D-205)', () => {
  it('Jedi blue or green, Sith red; canon figures use the lore colour', () => {
    expect(bladeColorFor('jedi', 'jediGuardian', 'x')).toBe('blue');
    expect(bladeColorFor('jedi', 'jediConsular', 'x')).toBe('green');
    expect(['blue', 'green']).toContain(bladeColorFor('jedi', 'jediSentinel', 'Tessa Rin'));
    expect(bladeColorFor('sith', 'sithWarrior', 'x')).toBe('red');
    expect(bladeColorFor('civilian', 'civilian', 'x')).toBeNull();
    expect(CANON_BY_ID.get('lore:darth-malgus')!.bladeColor).toBe('crimson');
    expect(CANON_BY_ID.get('lore:darth-marr')!.bladeColor).toBe('crimson');
  });
  it('the dev Knight (a Guardian) carries a blue blade; it is on the Weapons line, and a training saber lists none', async () => {
    expect(buildPlayerFighter(await devCharacter('knight', 30)).bladeColor).toBe('blue');
    expect(block(combat({}))).toMatch(/Weapons \(the only ones in this fight\): Kael Voss: a lightsaber, blue blade \(Soresu\)/);
    const spar = combat({ fighters: [{ ...PC, weapon: 'trainingSaber', bladeColor: null }, fighter('m', 'Master Oren Vash', { minion: false, weapon: 'trainingSaber' })] });
    expect(block(spar)).not.toMatch(/blade \(/);
  });
});

describe('who holds the advantage, the bout result, the object, one target (issue 19)', () => {
  it('Advantage now names the side with the upper hand', () => {
    expect(block(combat({ advantage: 3, narrate: [rec({ n: 1, margin: 7, advAfter: 3 })] }))).toMatch(/Advantage now: Kael Voss has the upper hand \(3 of 5, and holds the strike\); do not describe the other side pressing an advantage/);
    expect(block(combat({ advantage: -2, narrate: [rec({ n: 1, margin: -4, advAfter: -2 })] }))).toMatch(/Advantage now: B1 battle droid 1 has the upper hand \(2 of 5\)/);
    expect(block(combat({ advantage: 0 }))).toMatch(/Advantage now: even/);
  });
  it('a bout lost on the Master\'s clean touch is said plainly', () => {
    const c = combat({ beat: 'boutEnded', fighters: [{ ...PC, name: 'Tessa Rin', weapon: 'trainingSaber' }, fighter('m', 'Master Oren Vash', { minion: false, weapon: 'trainingSaber' })], session: { won: 0, lost: 1, unfinished: 0, ended: null, injuries: [] }, narrate: [rec({ n: 28, kind: 'strike', striker: 'B', targetId: 'm', margin: 13, hit: { by: 'B', quality: 'clean', D: 0, part: 'torso', W: 0, severity: null, vitalityLost: 0, severed: false, avoided: false, point: true } })] });
    expect(block(c)).toMatch(/Bout result: Master Oren Vash scored the clean touch and Tessa Rin LOST the bout/);
  });
  it('the thrown object is named, and a Push acts on one droid only', () => {
    const throwRec = rec({ n: 7, kind: 'force', force: { kind: 'throw', abilityId: 'telekinesis', side: 'A', success: false, outcome: 'cover', misfire: false, collapse: false, damage: null, backlashMental: 0, objectTag: 'fallenTimber' } as never });
    expect(block(combat({ narrate: [throwRec] }))).toMatch(/uses Telekinesis to hurl a fallen log on B1 battle droid 1: FAILED/);
    const push = rec({ n: 6, kind: 'force', force: { kind: 'push', abilityId: 'forcePush', side: 'A', success: true, outcome: 'success', misfire: false, collapse: false, damage: null, backlashMental: 0 } as never });
    expect(block(combat({ narrate: [push] }))).toMatch(/uses Force Push on B1 battle droid 1: DONE\. NO HIT, no injury: B1 battle droid 1 is thrown off balance \(an opening for Kael Voss\)\. Only B1 battle droid 1 is affected; the others are not\./);
  });
});

describe('the prompt rules that go with them', () => {
  it('colours, feelings, opponents\' expressions, second person, no outcome-list terms', () => {
    const p = PROMPTS.combatNarration;
    expect(p).toMatch(/A lightsaber's colour is the one on the Weapons line/);
    expect(p).toMatch(/The player character's feelings and state of mind come only from the block/);
    expect(p).toMatch(/Opponents may show visible expressions and body language/);
    expect(p).toMatch(/Write in the second person/);
    expect(p).toMatch(/never use its terms in prose \(no "a moderate strike"/);
  });
});
