// D-210 (combat pass 2, issues 3 and 9): Force gestures are never strikes; a typed ability the character does not know
// is a quiet FAILED step with no exchange and no AI call; a narration that repeats the previous reply is retried.
import { describe, expect, it } from 'vitest';
import type { DuelState } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { selectLevelExact } from '../../src/features/progression/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { forceActionIn, isStrikeClause, reconcileSteps } from '../../src/turn/combatTurn';
import { checkNarration, fallbackNarration, repeatedIssues } from '../../src/turn/narrationCheck';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn, type TurnDraft } from '../../src/turn/resolve';
import { devCharacter } from '../support/fightHarness';

const kinds = (text: string, steps: { kind: string; action?: string }[] = []): string[] => reconcileSteps(text, steps, 5).map((x) => (x.kind === 'forceAction' ? `force:${String(x.action)}` : x.kind));

describe('Force gestures are never strikes (D-210)', () => {
  it('the two pass-2 inputs', () => {
    expect(kinds('Unarmed, I thrust out my hand and Force push the nearest droid into the ones behind it, then lift a heavy rock with the Force and hurl it at another droid.')).toEqual(['force:push', 'force:throw']);
    expect(kinds('I thrust out both hands and unleash Force lightning at him.')).toEqual(['force:lightning']);
    // With the intent's own Force step, nothing is added.
    expect(kinds('I thrust out both hands and unleash Force lightning at him.', [{ kind: 'forceAction', action: 'lightning' }])).toEqual(['force:lightning']);
  });
  it.each([
    ['I raise my palm and Force push him back.', ['force:push']],
    ['I extend my hand toward the droid and hurl it into the wall.', ['force:throw']],
    ['I stretch out my hand and choke him.', ['force:choke']],
    ['Thrusting my open palm forward, I Force push the trooper.', ['force:push']],
    ['I sweep my arm and fling the crates at them.', ['force:throw']],
    ['I hold out my hand and call my saber back.', ['force:recall']],
    ['I raise my hand toward him.', []],
  ])('%s', (text, want) => {
    expect(kinds(text)).toEqual(want);
  });
  it('a real thrust, cut or lunge is still a strike', () => {
    expect(kinds('I thrust my saber at his chest.')).toEqual(['strike']);
    expect(kinds('I cut at his arm, then thrust again.')).toEqual(['strike', 'strike']);
    expect(isStrikeClause(' i thrust out my hand ')).toBe(false);
    expect(isStrikeClause(' i thrust at his chest ')).toBe(true);
    expect(forceActionIn(' i fling out my hand ')).toBe(null);
  });
});

async function inFight(): Promise<GameState> {
  let s = await devCharacter('knight', 30);
  s = { ...s, meta: { ...s.meta, rngState: seedRng('unknown') } };
  if (selectLevelExact(s, 'forceLightning') >= 1) s = applyEvents(REGISTRY, s, [{ type: 'devSkillSet', skillId: 'forceLightning', level: 0 }], { source: 'dev' }).state;
  s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'trooper', count: 2 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
  return resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput }).state;
}

describe('a typed ability the character does not know (D-210)', () => {
  it('Force lightning for a Jedi: FAILED (you don\'t know Force Lightning), a quiet line, no exchange, nothing rejected', async () => {
    const s = await inFight();
    expect(selectLevelExact(s, 'forceLightning')).toBeLessThan(1);
    const before = (s.combat.active!.duel as DuelState).log.length;
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'force', force: { kind: 'lightning' } } as CombatActionInput });
    const c = r.draft.combat!;
    expect(c.notes).toContain("step 1 Force lightning: FAILED (you don't know Force Lightning)");
    expect(c.quiet).toBe(true);
    expect(c.beat).toBe('noEffect');
    expect(c.quietLine).toBe("You don't know Force Lightning.");
    expect((r.state.combat.active!.duel as DuelState).log.length).toBe(before);
    expect(r.draft.rejected.map((x) => x.reason).join(' ')).not.toMatch(/does not know/);
  });
  it('inside a sequence the unknown step fails with its reason and the others still resolve', async () => {
    const s = await inFight();
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'sequence', steps: [{ kind: 'forceAction', action: 'lightning' }, { kind: 'strike' }] } as CombatActionInput });
    const c = r.draft.combat!;
    expect(c.notes[0]).toBe("step 1 Force lightning: FAILED (you don't know Force Lightning)");
    expect(c.notes[1]).toMatch(/^step 2 strike: (DONE|FAILED) \(/);
  });
});

describe('a narration that repeats the previous reply (D-210)', () => {
  const previous = 'You lunge forward with a strike from your blue-bladed lightsaber, but Duelist 3 effortlessly outpaces your movement, swatting your blade wide with his red weapon. You find yourself stumbling backward, giving ground across the floor as his pressure mounts. Caught off balance by the misstep, you never get the chance to thrust out your hands and call upon Force lightning; the opening closes instantly behind his disciplined guard, leaving you hard-pressed to recover your stance.';
  const draft = { intent: null, checks: [], training: null, timeAdvanced: null, jump: null, combat: null, pacingLevel: 'moment', notices: [], report: [], resolvedActions: [], rngAfter: seedRng('x'), applied: [], rejected: [] } as unknown as TurnDraft;
  it('the pass-2 reply, word for word, is a contradiction (one issue per sentence) and the fallback drops it', () => {
    const issues = checkNarration(previous, draft, false, { player: [] }, previous);
    expect(issues.length).toBe(3);
    expect(issues.every((i) => i.kind === 'repeated')).toBe(true);
    expect(fallbackNarration(previous, draft, issues)).toBe('Time passes as the engine recorded.');
  });
  it('nearly word for word (a few words changed) is still a repeat', () => {
    const near = previous.replace('effortlessly', 'easily').replace('red weapon', 'crimson weapon').replace('hard-pressed', 'struggling');
    expect(repeatedIssues(near, previous).length).toBeGreaterThan(0);
  });
  it('a new reply that shares a phrase or one stock sentence is not a repeat', () => {
    expect(repeatedIssues('Duelist 3 presses forward with his red blade. You retreat across the floor, then plant your feet and meet his next cut squarely. The hum of the blades fills the chamber.', previous)).toEqual([]);
    expect(repeatedIssues('The fight goes on.', previous)).toEqual([]);
  });
});
