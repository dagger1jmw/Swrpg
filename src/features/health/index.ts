// Health feature, minimal for M3: meters only (health.md §2, progression-numbers §3). Activities set
// the meters through an engine event; rest steps recover them (D-52); a sleep span ends with
// sleepCompleted (7 h+ resets, 5-7 h carries 30%, under 5 h 60%).
import { z } from 'zod';
import { afterSleep, rest, sleepCarry } from '../../engine/fatigue';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { emptyHealth, healthSliceSchema, metersSchema, type HealthSlice } from './health';
import { selectFatigue, selectMeters } from './selectors';

export const healthFeature: FeatureModule<HealthSlice, GameState> = {
  id: 'health',
  version: 1,
  initialState: () => emptyHealth(),
  // Saves from M1/M2: fresh meters.
  emptyState: () => emptyHealth(),
  stateSchema: healthSliceSchema,
  events: {
    /** The meters after a resolved activity (computed by computeXp's session stepper). */
    activityLoad: {
      schema: z.object({ type: z.literal('activityLoad'), activityId: z.string(), meters: metersSchema }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice: { ...slice, meters: metersSchema.parse(e['meters']) } }),
    },
    sleepCompleted: {
      schema: z.object({ type: z.literal('sleepCompleted'), hours: z.number().min(0).max(24) }),
      sources: ['engine'],
      handle: (slice, e) => {
        const hours = Number(e['hours']);
        const carry = sleepCarry(hours);
        return {
          slice: { ...slice, meters: afterSleep(slice.meters, hours), sleepCarry: carry },
          notes: [carry === 0 ? `slept ${hours} h: meters reset` : `slept ${hours} h: ${Math.round(carry * 100)}% of the tiredness carries over`],
        };
      },
    },
  },
  // Rest steps recover the meters (D-52); activity and sleep steps do not (sleep resolves at its end).
  onTimeAdvanced: (slice, step) => {
    if (step.occupation !== 'rest' || step.seconds <= 0) return { slice };
    return { slice: { ...slice, meters: rest(slice.meters, step.seconds / 3600) } };
  },
  selectors: { meters: selectMeters, fatigue: selectFatigue },
};
