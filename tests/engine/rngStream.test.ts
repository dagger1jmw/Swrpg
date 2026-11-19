// D-238 (combat pass 3, blocker): a fight's dice continue the campaign's RNG and the stream after the fight goes back to
// meta, so consecutive fights never replay each other. Pass 3 had three duels in a row with the same d20s for 60
// exchanges and the same arm severed at exchange 5 twice: each fight started from meta, which no exchange ever advanced.
import { describe, expect, it } from 'vitest';
import type { DuelState, ExchangeRecord } from '../../src/engine/duel';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';

async function sith(seed = 'rng'): Promise<GameState> {
  const input = testStartInput({ name: 'Varn Kessa', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND, archetype: 'sithWarrior' });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
const dev = (s: GameState, text: string): GameState => {
  const o = runDevCommand(REGISTRY, s, text);
  if (!o.ok) throw new Error(o.line);
  return o.state;
};
const beat = (s: GameState, action: string): GameState => resolveTurn(REGISTRY, s, null, { beat: { action } as CombatActionInput }).state;
const d20s = (log: readonly ExchangeRecord[]): string[] => log.map((r) => `${r.rollA?.d20 ?? '-'}/${r.rollB?.d20 ?? '-'}`);

/** One duel to its end from the current state: the d20 pairs of its exchanges and the state after. */
function duel(s0: GameState, cmd = '/fight 1 duelist at -30 stakes serious'): { state: GameState; dice: string[] } {
  let s = dev(dev(s0, '/heal'), cmd);
  for (let i = 0; i < 6 && s.combat.active; i++) s = beat(s, 'resolve');
  const last = s.combat.last!.duel as DuelState;
  return { state: s, dice: d20s(last.log) };
}
/** The longest run of identical d20 pairs between two fights, at any offset. */
function longestShared(a: readonly string[], b: readonly string[]): number {
  let best = 0;
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    let k = 0;
    while (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) k++;
    best = Math.max(best, k);
  }
  return best;
}

describe('the fight RNG is the campaign RNG (D-238)', () => {
  it('two fights in a row have different dice; meta moves on after each', async () => {
    const s0 = await sith();
    const one = duel(s0);
    const two = duel(one.state);
    expect(one.dice.length).toBeGreaterThan(5);
    expect(two.dice.slice(0, 8)).not.toEqual(one.dice.slice(0, 8));
    // A run of 5 identical pairs by chance is about (1/400)^5: any longer shared run is the old replay.
    expect(longestShared(one.dice, two.dice)).toBeLessThan(5);
    expect(one.state.meta.rngState).not.toEqual(s0.meta.rngState);
  });
  it('determinism kept: the same save and the same input give the same dice', async () => {
    const s0 = await sith();
    const a = duel(s0);
    const b = duel(structuredClone(s0));
    expect(b.dice).toEqual(a.dice);
    expect(b.state.meta.rngState).toEqual(a.state.meta.rngState);
    // And a replay of a single beat from a mid-fight save.
    let s = dev(s0, '/fight 1 duelist at -5 stakes serious');
    s = beat(s, 'continue');
    const save = structuredClone(s);
    const x = beat(s, 'continue');
    const y = beat(save, 'continue');
    expect(d20s((y.combat.active?.duel as DuelState | undefined)?.log ?? y.combat.last!.duel.log)).toEqual(d20s((x.combat.active?.duel as DuelState | undefined)?.log ?? x.combat.last!.duel.log));
  });
  it('a campaign of 10 fights has no repeated dice sequences', async () => {
    let s = await sith('ten');
    const fights: string[][] = [];
    const kinds = ['/fight 1 duelist at -30 stakes serious', '/fight 3 trooper', '/fight 1 duelist at -10 stakes serious', '/fight 4 thug', '/fight 1 duelist at -20 stakes serious'];
    for (let i = 0; i < 10; i++) {
      const r = duel(s, kinds[i % kinds.length]);
      fights.push(r.dice);
      s = r.state;
    }
    for (let i = 0; i < fights.length; i++) for (let j = i + 1; j < fights.length; j++) expect(longestShared(fights[i]!, fights[j]!), `fights ${i + 1} and ${j + 1}`).toBeLessThan(5);
    // The player's natural 1s near their rate (pass 3: 8.1% in runs); 10 fights give a few hundred rolls.
    const all = fights.flat().map((p) => Number(p.split('/')[0])).filter((n) => !Number.isNaN(n));
    expect(all.length).toBeGreaterThan(100);
    expect(all.filter((n) => n === 1).length / all.length).toBeLessThan(0.1);
  });
  it('a check between two fights draws from the same stream (no reuse of a fight\'s dice)', async () => {
    const s0 = await sith();
    const one = duel(s0);
    // The dev terrain roll and a fight start both draw from meta now: the next fight's first dice differ from the
    // fight before's last ones, and from its first.
    const two = duel(one.state, '/fight 1 duelist at -30 stakes serious terrain ice');
    expect(two.dice.slice(0, 6)).not.toEqual(one.dice.slice(0, 6));
    expect(longestShared(one.dice, two.dice)).toBeLessThan(5);
  });
});
