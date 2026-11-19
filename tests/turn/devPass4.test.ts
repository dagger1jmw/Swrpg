// D-241 (combat pass 3, "not tested"): dev commands for the items pass 3 could not reach: /sever, /fatigue up to 5,
// /exchanges n, /hazard (the narrator's hazard as a reply carries it), /stakes and /archetype for the current opponent.
import { describe, expect, it } from 'vitest';
import type { DuelState } from '../../src/engine/duel';
import { selectLasting } from '../../src/features/health/selectors';
import { selectNpcGen } from '../../src/features/npcs/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';

async function knight(seed = 'p4'): Promise<GameState> {
  const input = testStartInput({ name: 'Joren Kast', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
const run = (s: GameState, text: string) => runDevCommand(REGISTRY, s, text);
const ok = (s: GameState, text: string): GameState => {
  const o = run(s, text);
  if (!o.ok) throw new Error(o.line);
  return o.state;
};
const notesOf = (o: ReturnType<typeof run>): string => [...o.report, o.line].join('\n');

describe('/sever and a lost leg (D-241)', () => {
  it('a severed leg out of a fight is a lasting injury with the path\'s prosthetic; refused in a fight', async () => {
    const s = ok(await knight(), '/sever left leg');
    expect(selectLasting(s)).toEqual([expect.objectContaining({ kind: 'lostLeg', part: 'leftLeg', aid: 'qualityCybernetic', adaptation: 0 })]);
    expect(run(ok(await knight(), '/fight 1 duelist'), '/sever left leg').ok).toBe(false);
    expect(run(await knight(), '/sever torso').ok).toBe(false);
  });
  it('the leg adapts with /skip (D-230: form drills count at 0.3)', async () => {
    let s = ok(await knight(), '/sever left leg');
    s = ok(s, '/skip 20 days');
    const a = selectLasting(s)[0]!.adaptation;
    expect(a).toBeGreaterThan(0.05);
    expect(a).toBeLessThan(1);
  });
});

describe('/fatigue up to 5 and the collapse at 4x (D-208, D-241)', () => {
  it('5 is accepted; out of range is said, not silently clamped', async () => {
    const s = await knight();
    expect(run(s, '/fatigue physical 5').line).toMatch(/physical fatigue at 5$/);
    expect(run(s, '/fatigue physical 9').line).toMatch(/physical fatigue at 5 \(asked 9; the range is 0 to 5\)/);
  });
  it('a fighter just under 4x collapses within a few exchanges: out, the fight lost as exhausted', async () => {
    // A weak opponent, so a wound does not end it first; one exchange adds about 0.016x to a Knight's meter.
    let s = ok(await knight(), '/fight 1 duelist at -45 stakes serious');
    s = ok(s, '/fatigue physical 3.995');
    const o = run(s, '/exchanges 60');
    expect(o.ok).toBe(true);
    // The collapse is on the exchange's roll card.
    const cards = (o.state.combat.last!.duel as DuelState).log.flatMap((r) => r.notes).join('\n');
    expect(cards).toMatch(/Joren Kast collapses from exhaustion \(physical [\d.]+ \/ [\d.]+, past the hard limit of 4x\)/);
    expect(o.state.combat.last).toMatchObject({ outcome: 'lost', reason: 'exhausted' });
  });
});

describe('/exchanges and the 200-exchange cap (D-208, D-241)', () => {
  it('resolves up to n exchanges and stops at the fight\'s end; the roll cards are in the draft', async () => {
    const s = ok(await knight(), '/fight 1 duelist at 0 stakes serious');
    const o = run(s, '/exchanges 5');
    const d = (o.state.combat.active?.duel ?? o.state.combat.last!.duel) as DuelState;
    expect(d.exchange).toBeGreaterThanOrEqual(1);
    expect(d.exchange).toBeLessThanOrEqual(5);
    expect(o.draft.combat?.records.length).toBe(d.exchange);
    expect(run(await knight(), '/exchanges 5').ok).toBe(false);
  });
  it('/exchanges to 199: the next exchange reaches the cap and the fight ends as an exhausted stalemate, both Spent', async () => {
    const s = ok(await knight('cap'), '/fight 1 duelist at 0 stakes serious');
    const o = run(s, '/exchanges to 199');
    expect(o.ok).toBe(true);
    expect(o.state.combat.last).toMatchObject({ outcome: 'stalemate', exchanges: 200 });
    const cards = (o.state.combat.last!.duel as DuelState).log.flatMap((r) => r.notes).join('\n');
    expect(cards).toMatch(/no outcome after 200 exchanges: an exhausted stalemate, both sides Spent/);
    expect(notesOf(o)).toMatch(/exchange counter moved 0 -> 199 \(no rolls\)/);
    expect(run(o.state, '/exchanges to 10').ok).toBe(false);
  });
});

describe('/hazard: the narrator-side hazard path (D-212, D-217, D-241)', () => {
  it('in a fight with end: the hazard is rolled for everyone and the fight ends interrupted', async () => {
    const s = ok(await knight(), '/fight 3 trooper terrain ruins');
    const o = run(s, '/hazard explosion 2 end');
    expect(o.ok).toBe(true);
    expect(o.state.combat.active).toBeNull();
    expect(o.state.combat.last).toMatchObject({ outcome: 'interrupted' });
    expect(notesOf(o)).toMatch(/hazard: Joren Kast is caught by the explosion/);
    expect(notesOf(o)).toMatch(/hazard: Line trooper 1 is caught by the explosion/);
  });
  it('in a fight without end: no damage, the fight goes on', async () => {
    const s = ok(await knight(), '/fight 3 trooper terrain ruins');
    const o = run(s, '/hazard fall 1');
    expect(o.state.combat.active).not.toBeNull();
    expect(o.state.health.wounds).toEqual(s.health.wounds);
  });
  it('out of a fight: deferred to the next turn, as the narrator\'s is (D-29); end needs a fight', async () => {
    const s = await knight();
    const o = run(s, '/hazard fire 1');
    expect(o.ok).toBe(true);
    expect(o.state.health.pendingHazards.length).toBe(1);
    expect(run(s, '/hazard fire 1 end').ok).toBe(false);
  });
});

describe('/stakes and /archetype: the surrender execution branch (D-218, D-241)', () => {
  it('a Sith Warrior captor in a lethal fight kills a surrendered foe about 30% of the time; otherwise captures', async () => {
    let killed = 0;
    let captured = 0;
    for (let i = 0; i < 30; i++) {
      let s = ok(await knight(`ex${i}`), '/fight 1 duelist at -5 stakes serious');
      s = ok(s, '/stakes lethal');
      s = ok(s, '/archetype sithWarrior');
      const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'tactic', tactic: 'surrender' } as CombatActionInput });
      const fate = r.state.combat.last!.playerFate;
      if (fate === 'killingStrike') killed++;
      if (fate === 'captured') captured++;
    }
    expect(killed + captured).toBe(30);
    expect(killed).toBeGreaterThan(2);
    expect(killed).toBeLessThan(18);
  });
  it('the archetype is set on the NPC; a minion or an unknown archetype is refused', async () => {
    let s = ok(await knight(), '/fight 1 duelist at -5');
    s = ok(s, '/archetype bountyHunter');
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Duelist 1')!.id;
    expect(selectNpcGen(s, id)!.archetype).toBe('bountyHunter');
    expect(run(s, '/archetype wizard').ok).toBe(false);
    expect(run(ok(await knight(), '/fight 3 trooper'), '/archetype sithWarrior').ok).toBe(false);
    expect(run(s, '/stakes spar').ok).toBe(false);
  });
});
