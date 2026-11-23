// D-245 (combat pass 4 issue 1): a fitted cybernetic leg stands and fights; a severed leg with no prosthetic still ends
// the fight, and the log says why. Pass 4: /sever left leg, then every fight ended after one exchange for 40 days.
import { describe, expect, it } from 'vitest';
import { cannotDuel, cannotStand, cannotStandText, fighterAgility, type DuelState } from '../../src/engine/duel';
import type { LastingInjury } from '../../src/engine/lasting';
import type { Wound } from '../../src/engine/wounds';
import { buildPlayerFighter } from '../../src/features/combat/build';
import { selectLasting } from '../../src/features/health/selectors';
import { createMemoryStorage } from '../../src/persist/storage';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { runDevCommand } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';
import { TEST_START_DATE } from '../support/dates';
import { forceUser } from '../support/duelSim';

async function knight(seed: string): Promise<GameState> {
  const input = testStartInput({ name: 'Kael Dorran', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `c-${seed}`, branchId: 'b' }, seed)).state;
}
const ok = (s: GameState, text: string): GameState => {
  const o = runDevCommand(REGISTRY, s, text);
  if (!o.ok) throw new Error(o.line);
  return o.state;
};
const logOf = (s: GameState, text: string): { state: GameState; log: string } => {
  const o = runDevCommand(REGISTRY, s, text);
  return { state: o.state, log: [...o.report, o.line].join('\n') };
};

const severedLeg = (): Wound => ({ id: 'w', part: 'leftLeg', severity: 'severe', W: 27, stabilized: true, healProgress: 0.2, day: 0, source: 'combat', severed: true });
const lostLeg = (aid: LastingInjury['aid'], adaptation = 0): LastingInjury => ({ id: 'l', kind: 'lostLeg', part: 'leftLeg', adaptation, aid, adaptedToday: 0, adaptDay: 0, day: 0 });

describe('the rule (engine)', () => {
  it('a severed leg still healing, with a fitted prosthetic on record, stands; with none it does not', () => {
    expect(cannotStand(forceUser('x', 50, { wounds: [severedLeg()], lasting: [lostLeg('qualityCybernetic')] }))).toBe(false);
    expect(cannotStand(forceUser('x', 50, { wounds: [severedLeg()], lasting: [lostLeg('basicProsthetic')] }))).toBe(false);
    for (const lasting of [[], [lostLeg('none')], [lostLeg('scarTissue')]]) {
      const f = forceUser('x', 50, { wounds: [severedLeg()], lasting });
      expect(cannotStand(f)).toBe(true);
      expect(cannotDuel(f)).toBe('leg');
      expect(cannotStandText(f)).toBe('cannot stand: severed left leg');
    }
  });
  it('the leg\'s Agility penalty (progression-numbers §18: 0.35 x (1 - adaptation)) bites where a fight rolls Agility', () => {
    const f = (a: number) => forceUser('x', 50, { lasting: [lostLeg('qualityCybernetic', a)] });
    expect(fighterAgility(f(0))).toBeCloseTo(f(0).agility * 0.65, 6);
    expect(fighterAgility(f(0.5))).toBeCloseTo(f(0.5).agility * 0.825, 6);
    expect(fighterAgility(f(1))).toBeCloseTo(f(1).agility, 6);
  });
});

describe('through the game (dev commands)', () => {
  it('a fitted cybernetic leg: the fight goes on past its first exchange and nobody is out for a leg', async () => {
    let s = ok(await knight('cyb'), '/sever left leg');
    expect(selectLasting(s)[0]).toMatchObject({ kind: 'lostLeg', aid: 'qualityCybernetic' });
    expect(cannotStand(buildPlayerFighter(s))).toBe(false);
    s = ok(s, '/fight 1 duelist at -30');
    expect(s.combat.active).not.toBeNull();
    const { state, log } = logOf(s, '/exchanges 3');
    const d = (state.combat.active?.duel ?? state.combat.last!.duel) as DuelState;
    expect(log).not.toMatch(/cannot stand|cannot fight/);
    expect(d.log.flatMap((r) => r.notes).join('\n')).not.toMatch(/cannot stand/);
    expect(d.exchange).toBe(3);
  });
  it('40 days later at partial adaptation: still fights, with the leg\'s Agility penalty shrunk by the adaptation', async () => {
    let s = ok(await knight('cyb40'), '/sever left leg');
    s = ok(s, '/skip 40 days');
    const leg = selectLasting(s).find((l) => l.kind === 'lostLeg')!;
    expect(leg.adaptation).toBeGreaterThan(0.2);
    expect(leg.adaptation).toBeLessThan(1);
    const f = buildPlayerFighter(s);
    expect(cannotStand(f)).toBe(false);
    expect(fighterAgility(f)).toBeCloseTo(f.agility * (1 - 0.35 * (1 - leg.adaptation)), 6);
    s = ok(s, '/fight 1 duelist at -30');
    // The fight may end on its third exchange (a win), so the finished fight counts too.
    const st = runDevCommand(REGISTRY, s, '/exchanges 3').state;
    const d = (st.combat.active?.duel ?? st.combat.last!.duel) as DuelState;
    expect(d.exchange).toBe(3);
    expect(st.combat.last?.reason ?? null).not.toBe('incapacitated');
  });
  it('a severed leg with no prosthetic: the fight ends at once, lost, and the log gives the reason', async () => {
    let s = ok(await knight('noaid'), '/sever left leg');
    // No prosthetic on record (a body with no aid at all; health would fit the path's at once).
    s = { ...s, health: { ...s.health, lasting: [] } };
    const { state, log } = logOf(s, '/fight 1 duelist at -30');
    expect(log).toMatch(/the player character cannot fight \(cannot stand: severed left leg\): the fight ends at once/);
    expect(state.combat.active).toBeNull();
    expect(state.combat.last).toMatchObject({ outcome: 'lost', reason: 'incapacitated' });
  });
});
