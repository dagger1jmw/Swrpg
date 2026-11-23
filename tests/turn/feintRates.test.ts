// Feint success by defender rank (D-450, Jared's question 10): the opening contest (rolls §5) through the real turn, 200
// seeds per pairing on the game's RNG (meta.rngState: the combat action copies it into the duel). A Sith Lord should
// read feints noticeably often: the rate against a Lord stays well under 90%.
import { describe, expect, it } from 'vitest';
import type { Intent } from '../../src/ai/schemas/intent';
import { seedRng } from '../../src/engine/rng';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { devCharacter } from '../support/fightHarness';

const beat = (action: string): { beat: CombatActionInput } => ({ beat: { action } as CombatActionInput });
const fightIntent: Intent = { actionType: 'fight', targets: [], references: [], unknownNames: [] };
const SEEDS = 200;
const DEFENDERS = [
  ['padawan', 'jediOrder', 16],
  ['jediKnight', 'jediOrder', 30],
  ['jediMaster', 'jediOrder', 55],
  ['sithLord', 'sithEmpire', 45],
] as const;

async function feintRates(rank: 'padawan' | 'knight' | 'master', age: number): Promise<Record<string, number>> {
  const base = await devCharacter(rank, age);
  const out: Record<string, number> = {};
  for (const [role, faction, oage] of DEFENDERS) {
    let s = applyEvents(REGISTRY, base, [{ type: 'npcIntroduced', name: 'Foe Var', species: 'human', faction, role, ageApprox: oage, description: '' }], { source: 'ai' }).state;
    const id = Object.values(s.npcs.byId).find((n) => n.name === 'Foe Var')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [id], minionGroups: [], stakes: 'lethal', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    s = resolveTurn(REGISTRY, s, null, beat('narrate')).state;
    let ok = 0;
    let rolled = 0;
    for (let i = 0; i < SEEDS; i++) {
      const seeded: GameState = { ...s, meta: { ...s.meta, rngState: seedRng(`f${i}`) } };
      const notes = resolveTurn(REGISTRY, seeded, { ...fightIntent, sequence: [{ kind: 'tactic', tactic: 'feint' }, { kind: 'strike' }] }, { text: 'I feint high, then cut low.' }).draft.combat!.notes.join('\n');
      if (/step 1 feint: FAILED/.test(notes)) rolled += 1;
      else if (/an opening: /.test(notes)) {
        ok += 1;
        rolled += 1;
      }
    }
    out[role] = rolled ? ok / rolled : NaN;
  }
  return out;
}

describe('feint success by defender rank (D-450)', () => {
  it('varies with the seed, falls with the defender, and a Sith Lord reads it often', async () => {
    for (const [rank, age] of [['padawan', 16], ['knight', 30], ['master', 50]] as const) {
      const r = await feintRates(rank, age);
      console.log(`[feint] ${rank} ${age}: ${DEFENDERS.map(([d]) => `${d} ${(100 * r[d]!).toFixed(1)}%`).join(', ')}`);
      for (const [d] of DEFENDERS) {
        expect(r[d]).toBeGreaterThan(0.1);
        expect(r[d]).toBeLessThan(0.9);
      }
      expect(r['sithLord']).toBeLessThan(0.75);
      expect(r['jediMaster']).toBeLessThan(r['padawan']!);
    }
  }, 120_000);
});
