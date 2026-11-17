// advanceTime (architecture §9, §10): splits a span at midnights and runs every feature's
// onTimeAdvanced hook in registry order, once per step. A hook may interrupt; the loop then
// stops after that step and the state equals the state at the interruption. Pure.
import { splitAtMidnights } from '../engine/calendar';
import { setClockNow, setLastAdvance, type ClockSlice, type LastAdvance } from '../features/clock/clock';
import { applyEvents, type AppliedEvent, type RejectedEvent, type UnknownRef } from './applyEvents';
import type { BaseState, Registry, TimeAdvance, TimeStep } from './types';

type ClockedState = BaseState & { clock: ClockSlice };

export interface AdvanceResult<S> {
  state: S;
  applied: AppliedEvent[];
  rejected: RejectedEvent[];
  notices: string[];
  unknownRefs: UnknownRef[];
  secondsAdvanced: number;
  interrupted?: string;
}

export function advanceTime<S extends BaseState>(registry: Registry<S>, initial: S, adv: TimeAdvance): AdvanceResult<S> {
  if (!Number.isInteger(adv.seconds) || adv.seconds < 0) throw new RangeError(`advanceTime: bad seconds ${adv.seconds}`);
  let state = initial as S & ClockedState;
  const applied: AppliedEvent[] = [];
  const rejected: RejectedEvent[] = [];
  const notices: string[] = [];
  const unknownRefs: UnknownRef[] = [];
  let elapsed = 0;
  let interrupted: string | undefined;

  for (const seg of splitAtMidnights(state.clock.now, adv.seconds)) {
    const step: TimeStep = {
      kind: seg.from.second === 0 && seg.endsAtMidnight ? 'day' : 'subDay',
      fromAbs: seg.from.day * 86_400 + seg.from.second,
      toAbs: seg.to.day * 86_400 + seg.to.second,
      seconds: seg.seconds,
      endsDay: seg.endsAtMidnight,
    };
    state = { ...state, clock: setClockNow(state.clock, seg.to) };
    elapsed += seg.seconds;

    for (const feature of registry) {
      if (!feature.onTimeAdvanced) continue;
      const res = feature.onTimeAdvanced(state[feature.id], step, { state, source: 'engine' });
      state = { ...state, [feature.id]: res.slice };
      notices.push(...(res.notices ?? []));
      if (res.emit?.length) {
        const r = applyEvents(registry, state as S, res.emit, { source: 'engine' });
        state = r.state as S & ClockedState;
        applied.push(...r.applied);
        rejected.push(...r.rejected);
        notices.push(...r.notices);
        unknownRefs.push(...r.unknownRefs);
      }
      if (res.interrupt !== undefined && interrupted === undefined) interrupted = res.interrupt;
    }
    if (interrupted !== undefined) break;
  }

  const last: LastAdvance = {
    seconds: elapsed,
    reason: adv.reason,
    source: adv.source,
    ...(adv.requested !== undefined ? { requested: adv.requested } : {}),
    ...(adv.clampedFrom !== undefined ? { clampedFrom: adv.clampedFrom } : {}),
    ...(interrupted !== undefined ? { interruptedBy: interrupted } : {}),
  };
  state = { ...state, clock: setLastAdvance(state.clock, last) };
  return { state, applied, rejected, notices, unknownRefs, secondsAdvanced: elapsed, ...(interrupted !== undefined ? { interrupted } : {}) };
}
