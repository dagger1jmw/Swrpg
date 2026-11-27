// Flags feature (spec/flag-registry.md, D-33; built in M5). Flags are the only boolean story state. flagSet from a
// source the flag's registry entry does not list is rejected and logged; no rank-gating or engine flag allows the AI.
import { z } from 'zod';
import { FLAGS, flagDef } from '../../data/flags';
import type { GameState } from '../../state/gameState';
import type { FeatureModule } from '../../state/types';
import { flagsSliceSchema, type FlagsSlice } from './flags';
import { selectFlags } from './selectors';

/**
 * The flags the narrator may set. Sent in the narrator's rules (the field notes, opt-1 A1) rather than as the field's description in
 * the response schema, where it cost schema characters every turn.
 */
export const AI_FLAGS = FLAGS.filter((f) => f.sources.includes('ai')).map((f) => (f.param ? `${f.id}:<id>` : f.id));

export const flagsFeature: FeatureModule<FlagsSlice, GameState> = {
  id: 'flags',
  version: 1,
  initialState: () => ({ set: [] }),
  emptyState: () => ({ set: [] }),
  stateSchema: flagsSliceSchema,
  events: {
    flagSet: {
      schema: z.object({ type: z.literal('flagSet'), flag: z.string().max(120) }),
      sources: ['ai', 'engine', 'player'],
      narrative: () => true,
      targetField: 'flag',
      handle: (slice, e, ctx) => {
        const flag = String(e['flag']);
        const def = flagDef(flag);
        if (!def) return { reject: `unregistered flag ${flag}` };
        const source = ctx.source;
        if (source !== 'ai' && source !== 'engine' && source !== 'player') return { reject: `flag ${flag} cannot be set by ${source}` };
        if (!def.sources.includes(source)) return { reject: `flag ${flag} does not allow the ${source} source` };
        if (slice.set.includes(flag)) return { slice };
        return { slice: { set: [...slice.set, flag] }, notes: [`flag set: ${flag}`] };
      },
    },
  },
  selectors: { all: selectFlags },
};
