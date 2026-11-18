// Typed multi-step sequences in combat (D-146, Jared). Pure. The engine resolves the steps in order as exchanges, the
// opponent rolling every step; all dice resolve before one narration call. A step's success passes its bonus to the
// next (an opening's advantage, split defense when a thrown object and a strike land together, building pressure
// +1 per success up to +3). The chain stops at the first failed step or when the opponent reaches a strike; the
// remaining steps are dropped, not refunded. A natural 1 always fails a step.
import { CIRCUMSTANCE, STRIKE_AT, type Maneuver, type Stance, type Tactic } from '../data/combat.config';
import { SEQUENCE_ADAPTATION, SEQUENCE_CAP, SEQUENCE_CHAIN } from '../data/sequence.config';
import type { BodyPart, ForceEffort } from '../data/health.config';
import type { ObjectSize } from '../data/terrain';
import { resolveForceAction, type ForceActionKind } from './combatForce';
import { resolveExchange, settleEnd, type DuelContext, type DuelState } from './duel';
import type { Modifier } from './rolls';
import { basicRoll } from './rolls';

export type SequenceStep =
  | { kind: 'stance'; stance: Stance }
  | { kind: 'tactic'; tactic: Extract<Tactic, 'feint' | 'taunt'> }
  | { kind: 'maneuver'; maneuver: Maneuver }
  | { kind: 'forceAction'; action: ForceActionKind; effort?: ForceEffort; objectTag?: string }
  | { kind: 'strike'; aim?: BodyPart };

export interface CapInputs {
  rank: string;
  mainFormLevel: number;
  /** The level of the Force skill the sequence uses (0 when it uses none). */
  forceSkillLevel: number;
  hidden: boolean;
  mentalFraction: number;
  /** Spent, or a fatigue or Force meter above 1.0. */
  exhausted: boolean;
}

/** The length cap, in order: rank and skill base, then stealth, then fatigue; never below 1 (D-146). */
export function sequenceCap(i: CapInputs): number {
  let cap = SEQUENCE_CAP.byRank[i.rank] ?? SEQUENCE_CAP.min;
  if (i.mainFormLevel >= SEQUENCE_CAP.masteryLevel && i.forceSkillLevel >= SEQUENCE_CAP.masteryLevel) cap = Math.max(cap, SEQUENCE_CAP.masteryCap);
  if (i.hidden) cap += SEQUENCE_CAP.stealthBonus;
  if (i.exhausted) cap -= SEQUENCE_CAP.exhaustedPenalty;
  else if (i.mentalFraction >= SEQUENCE_CAP.highMentalFraction) cap -= SEQUENCE_CAP.highMentalPenalty;
  return Math.max(SEQUENCE_CAP.min, cap);
}

/** A step's pattern for opponent adaptation: the Force ability plus the maneuver it sets up, or the step itself. */
export function patternOf(step: SequenceStep, next?: SequenceStep): string {
  if (step.kind === 'forceAction') return `${step.action}+${next?.kind === 'maneuver' ? next.maneuver : next?.kind ?? 'none'}`;
  if (step.kind === 'maneuver') return `maneuver:${step.maneuver}`;
  if (step.kind === 'tactic') return `tactic:${step.tactic}`;
  return step.kind;
}

export interface SequenceState {
  duel: DuelState;
  /** Uses of each pattern this fight (adaptation). */
  patternUses: Readonly<Record<string, number>>;
  /** Remaining throwable objects by terrain tag (seeded per fight). */
  objects: Readonly<Record<string, number>>;
}

export interface ForceProfile {
  levelOf(action: ForceActionKind): number;
  ciOf(action: ForceActionKind): number;
  forceOutput: number;
  /** Charisma / Intelligence / form level for feints and taunts (rolls §5). */
  trickLevel: number;
}

export interface StepResult {
  index: number;
  step: SequenceStep;
  success: boolean;
  note: string;
}

export interface SequenceResult {
  state: SequenceState;
  results: StepResult[];
  /** Steps never resolved: truncated by the cap, or dropped after the chain stopped. */
  truncated: SequenceStep[];
  dropped: SequenceStep[];
  stopReason: 'completed' | 'stepFailed' | 'opponentStrike' | 'fightEnded';
}

/** Resolves a typed sequence for side A against the current target (D-146). */
export function runSequence(
  s0: SequenceState,
  ctx: DuelContext,
  day: number,
  steps: readonly SequenceStep[],
  cap: number,
  objectSizes: Readonly<Record<string, ObjectSize>>,
  force: ForceProfile,
): SequenceResult {
  const used = steps.slice(0, cap);
  const truncated = steps.slice(cap);
  let st = s0;
  const results: StepResult[] = [];
  let pressure = 0;
  let splitDefense = false;
  let stopReason: SequenceResult['stopReason'] = 'completed';
  for (let i = 0; i < used.length; i++) {
    const step = used[i]!;
    const pattern = patternOf(step, used[i + 1]);
    const prior = st.patternUses[pattern] ?? 0;
    const firstUse = prior === 0;
    const adapt = Math.min(SEQUENCE_ADAPTATION.max, prior * SEQUENCE_ADAPTATION.perUse);
    const bonus: Modifier[] = [];
    if (pressure) bonus.push({ source: 'building pressure', value: pressure });
    if (splitDefense && (step.kind === 'strike' || step.kind === 'maneuver')) bonus.push({ source: 'split defense', value: SEQUENCE_CHAIN.splitDefense });
    const defense: Modifier[] = adapt ? [{ source: `adapted to ${pattern}`, value: adapt }] : [];
    st = { ...st, patternUses: { ...st.patternUses, [pattern]: prior + 1 } };
    let success: boolean;
    let note: string;
    const duel = st.duel;
    if (step.kind === 'stance') {
      st = { ...st, duel: { ...duel, a: { ...duel.a, stance: step.stance } } };
      success = true;
      note = `stance: ${step.stance}`;
    } else if (step.kind === 'tactic') {
      // Opening contest (rolls §5): d20 + trick level / 10 vs d20 + Willpower or Force Sense / 10.
      const target = duel.opponents[duel.target]!;
      const [u, r1] = basicRoll(duel.rng, force.trickLevel, bonus);
      const [d, r2] = basicRoll(r1, Math.max(target.willpower, target.forceSense), defense);
      success = u.total >= d.total && u.natural !== 'nat1';
      const gain = success ? (firstUse ? Math.max(CIRCUMSTANCE.openingAdvantage, STRIKE_AT - duel.advantage) : CIRCUMSTANCE.openingAdvantage) : 0;
      st = { ...st, duel: { ...duel, rng: r2, advantage: Math.min(5, duel.advantage + gain) } };
      note = `${step.tactic}: ${success ? 'opening' : 'seen through'}`;
    } else if (step.kind === 'forceAction') {
      let size: ObjectSize | undefined;
      if (step.action === 'throw') {
        const tag = step.objectTag ?? Object.keys(st.objects).find((k) => (st.objects[k] ?? 0) > 0);
        if (!tag || (st.objects[tag] ?? 0) <= 0) {
          results.push({ index: i, step, success: false, note: 'nothing left to throw' });
          stopReason = 'stepFailed';
          break;
        }
        size = objectSizes[tag];
        st = { ...st, objects: { ...st.objects, [tag]: (st.objects[tag] ?? 0) - 1 } };
      }
      const before = duel.advantage;
      const r = resolveForceAction(
        duel,
        {
          side: 'A',
          kind: step.action,
          level: force.levelOf(step.action),
          ci: force.ciOf(step.action),
          effort: step.effort ?? 'standard',
          forceOutput: force.forceOutput,
          ...(size ? { objectSize: size } : {}),
          bonus: bonus.reduce((a, m) => a + m.value, 0),
          targetDefense: adapt,
        },
        day,
      );
      success = r.record.success;
      let next = r.state;
      // A pattern's first use counts as surprise for its opening bonus (D-146).
      if (success && firstUse && (step.action === 'push' || step.action === 'choke')) next = { ...next, advantage: Math.max(next.advantage, Math.max(before + CIRCUMSTANCE.openingAdvantage, STRIKE_AT)) };
      st = { ...st, duel: { ...next, log: next.log.map((e, k) => (k === next.log.length - 1 ? { ...e, step: i } : e)) } };
      splitDefense = success && step.action === 'throw';
      note = `${step.action}: ${r.record.misfire ? 'misfire' : success ? 'success' : 'resisted'}`;
    } else {
      if (step.kind === 'maneuver') st = { ...st, duel: { ...duel, a: { ...duel.a, pendingManeuver: step.maneuver } } };
      // An aimed strike step (D-171).
      if (step.kind === 'strike' && step.aim) st = { ...st, duel: { ...st.duel, a: { ...st.duel.a, aim: step.aim } } };
      const before = st.duel;
      const after = resolveExchange(before, ctx, day, { a: bonus, bDefense: defense, step: i });
      const rec = after.log[after.log.length - 1]!;
      const natural1 = rec.rollA?.natural === 'nat1';
      if (rec.kind === 'strike' && rec.striker === 'A') success = !!rec.maneuver || (!!rec.hit && !rec.hit.avoided);
      else success = after.advantage > before.advantage;
      if (natural1) success = false;
      st = { ...st, duel: after };
      note = `${step.kind}${step.kind === 'maneuver' ? ` (${step.maneuver})` : ''}: ${success ? 'lands' : 'fails'}`;
      if (step.kind !== 'maneuver') splitDefense = false;
    }
    st = { ...st, duel: settleEnd(st.duel) };
    results.push({ index: i, step, success, note });
    if (st.duel.end) {
      stopReason = 'fightEnded';
      break;
    }
    if (!success) {
      stopReason = 'stepFailed';
      break;
    }
    if (st.duel.advantage <= -STRIKE_AT) {
      stopReason = 'opponentStrike';
      break;
    }
    if (step.kind !== 'stance') pressure = Math.min(SEQUENCE_CHAIN.pressureMax, pressure + SEQUENCE_CHAIN.pressurePerStep);
  }
  const dropped = used.slice(results.length);
  return { state: st, results, truncated, dropped, stopReason };
}
