// Clock feature. Owns timeElapsed (AI amount, clamped to the pacing range; D-30).
import { z } from 'zod';
import { PACING_RANGES } from '../../data/pacing.config';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { selectPacingLevel } from '../pacing/selectors';
import { clockSliceSchema, type ClockSlice } from './clock';
import { selectLastAdvance, selectNow } from './selectors';

export const timeElapsedSchema = z.object({
  type: z.literal('timeElapsed'),
  seconds: z.number().int().min(0),
  reason: z.string().max(200),
});

export function clampToPacing(seconds: number, level: keyof typeof PACING_RANGES): { seconds: number; clampedFrom?: number } {
  const { min, max } = PACING_RANGES[level];
  const clamped = Math.min(max, Math.max(min, Math.round(seconds)));
  return clamped === seconds ? { seconds } : { seconds: clamped, clampedFrom: seconds };
}

export const clockFeature: FeatureModule<ClockSlice, GameState> = {
  id: 'clock',
  version: 1,
  initialState: (ctx) => ({ now: { day: ctx.start.day, second: ctx.start.second }, lastAdvance: null, startDay: ctx.start.day }),
  stateSchema: clockSliceSchema,
  events: {
    timeElapsed: {
      schema: timeElapsedSchema,
      sources: ['ai'],
      phase: 'time',
      // One time writer per turn: absent when the TurnDraft advanced time (D-30).
      narrative: (_state, turn) => !turn.timeAdvancedByDraft,
      handle: (slice, e, ctx) => {
        const requested = Number(e['seconds']);
        const level = selectPacingLevel(ctx.state);
        const c = clampToPacing(requested, level);
        const notes = c.clampedFrom !== undefined ? [`timeElapsed ${requested}s clamped to ${c.seconds}s (${level} range)`] : [];
        return {
          slice,
          notes,
          advance: {
            seconds: c.seconds,
            reason: String(e['reason']),
            source: 'timeElapsed',
            requested,
            ...(c.clampedFrom !== undefined ? { clampedFrom: c.clampedFrom } : {}),
          },
        };
      },
    },
  },
  selectors: { now: selectNow, lastAdvance: selectLastAdvance },
};
