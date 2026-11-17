// Helpers over any registry: initial state, the whole-state Zod schema, feature versions.
import { z } from 'zod';
import { seedRng } from '../engine/rng';
import type { BaseState, InitCtx, Meta, Registry } from './types';

export const STATE_SCHEMA_VERSION = 1;

const uint32 = z.number().int().min(0).max(0xffffffff);

export const metaSchema = z.object({
  schemaVersion: z.number().int().min(1),
  campaignId: z.string().min(1),
  branchId: z.string().min(1),
  turn: z.number().int().min(0),
  rngState: z.tuple([uint32, uint32, uint32, uint32]),
});

export function createInitialState<S extends BaseState>(registry: Registry<S>, ctx: InitCtx): S {
  const meta: Meta = {
    schemaVersion: STATE_SCHEMA_VERSION,
    campaignId: ctx.campaignId,
    branchId: ctx.branchId,
    turn: 0,
    rngState: seedRng(ctx.seed),
  };
  const state: BaseState = { meta };
  for (const f of registry) state[f.id] = f.initialState(ctx);
  return state as S;
}

/** Zod schema for the whole state: meta plus every feature's stateSchema (strict at the top level). */
export function buildStateSchema<S extends BaseState>(registry: Registry<S>): z.ZodType<S> {
  const shape: Record<string, z.ZodType> = { meta: metaSchema };
  for (const f of registry) shape[f.id] = f.stateSchema;
  return z.strictObject(shape) as unknown as z.ZodType<S>;
}

export function featureVersions<S extends BaseState>(registry: Registry<S>): Record<string, number> {
  return Object.fromEntries(registry.map((f) => [f.id, f.version]));
}
