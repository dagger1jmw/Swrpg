// Scripted fights through the real turn resolver (no AI): a character from creation, a fight begun from combatStarted,
// then beats and typed-style combat actions by a play pattern until the fight ends. For balance measurements (D-158)
// and the combat sweep. Deterministic per seed.
import { TEST_START_DATE } from './dates';
import type { DuelState } from '../../src/engine/duel';
import { seedRng } from '../../src/engine/rng';
import { createMemoryStorage } from '../../src/persist/storage';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { resolveTurn } from '../../src/turn/resolve';
import { testStartInput, type TestStartRank } from '../../src/turn/testStart';
import type { CombatActionInput } from '../../src/turn/record';

export async function devCharacter(rank: TestStartRank, age: number): Promise<GameState> {
  const input = testStartInput({ name: 'Test', rank, age, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND });
  return (await createCampaign(REGISTRY, createMemoryStorage(), input, { campaignId: `h-${rank}-${age}`, branchId: 'b' }, 'h')).state;
}

export type Pattern = (turn: number, duel: DuelState) => Record<string, unknown>;

export const PATTERNS: Readonly<Record<string, Pattern>> = {
  balanced: () => ({ action: 'continue' }),
  aggressive: (t) => (t === 0 ? { action: 'posture', stance: 'aggressive' } : { action: 'continue' }),
  /** Strikes, Push and the saber throw (Jared's mixed pattern), recalling a dropped saber first. */
  mixed: (t, d) => {
    if (d.a.saberLost) return { action: 'force', force: { kind: 'recall' } };
    const k = t % 4;
    if (k === 0) return { action: 'sequence', steps: [{ kind: 'strike' }, { kind: 'strike' }, { kind: 'forceAction', action: 'push' }] };
    if (k === 1) return { action: 'force', force: { kind: 'saberThrow' } };
    if (k === 2) return { action: 'force', force: { kind: 'push' } };
    return { action: 'continue' };
  },
  aimed: (t) => (t % 2 === 0 ? { action: 'aim', part: 'torso' } : { action: 'continue' }),
  /** Force every turn until backlash: Push, lightning-free (Jedi), saber throws. */
  heavyForce: (t, d) => (d.a.saberLost ? { action: 'force', force: { kind: 'recall' } } : t % 2 === 0 ? { action: 'force', force: { kind: 'push', effort: 'heavy' } } : { action: 'force', force: { kind: 'saberThrow', effort: 'heavy' } }),
};

export interface FightResult {
  outcome: string | null;
  reason: string | null;
  turns: number;
  exchanges: number;
  /** The player's wounds at the end (moderate or worse counts as wounded). */
  wounds: { severity: string; part: string }[];
  finalDuel: DuelState | null;
  rejected: string[];
  notes: string[];
  /** Every exchange record of the fight. */
  log: DuelState['log'];
}

export interface FightSpec {
  minionGroups?: { kind: string; count: number }[];
  opponentRefs?: string[];
  stakes?: 'lethal' | 'serious' | 'skirmish' | 'spar';
  terrainTags?: string[];
}

/** One fight to its end (or maxTurns) with the pattern; `seed` sets the dice. */
export function runFight(base: GameState, spec: FightSpec, pattern: Pattern, seed: string, maxTurns = 400): FightResult {
  let state: GameState = { ...base, meta: { ...base.meta, rngState: seedRng(seed) } };
  state = applyEvents(REGISTRY, state, [{ type: 'combatStarted', opponentRefs: spec.opponentRefs ?? [], minionGroups: spec.minionGroups ?? [], stakes: spec.stakes ?? 'lethal', terrainTags: spec.terrainTags ?? ['flatFloor'] }], { source: 'ai' }).state;
  const rejected: string[] = [];
  const notes: string[] = [];
  // The fight begins on the first turn (deferred start); the first action is a plain beat.
  let r = resolveTurn(REGISTRY, state, null, { beat: { action: 'narrate' } as CombatActionInput });
  state = r.state;
  let turns = 0;
  while (state.combat.active && turns < maxTurns) {
    const duel = state.combat.active.duel as DuelState;
    const payload = pattern(turns, duel);
    r = resolveTurn(REGISTRY, state, null, { beat: payload as unknown as CombatActionInput });
    rejected.push(...r.draft.rejected.map((x) => x.reason));
    notes.push(...(r.draft.combat?.notes ?? []));
    // A rejected action (an unknown ability, a saber throw without a saber) falls back to a beat so the fight goes on.
    if (r.draft.rejected.length && r.state === state) r = resolveTurn(REGISTRY, state, null, { beat: { action: 'continue' } as CombatActionInput });
    state = r.state;
    turns++;
  }
  const last = state.combat.last;
  const finalDuel = (state.combat.active?.duel ?? last?.duel ?? null) as DuelState | null;
  return {
    outcome: state.combat.active ? null : (last?.outcome ?? null),
    reason: state.combat.active ? 'maxTurns' : (last?.reason ?? null),
    turns,
    exchanges: finalDuel?.exchange ?? 0,
    wounds: (finalDuel?.a.wounds ?? []).map((w) => ({ severity: w.severity, part: w.part })),
    finalDuel,
    rejected,
    notes,
    log: finalDuel?.log ?? [],
  };
}

export const isWounded = (f: FightResult): boolean => f.wounds.some((w) => w.severity !== 'minor');
