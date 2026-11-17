// Save envelope and load pipeline (architecture §13). Load runs envelope migrations, then each
// feature's migrations from its stored version, then validates the whole state with Zod. Any
// failure refuses the load with a message; there is no partial load.
import { buildStateSchema, featureVersions } from '../state/registryTools';
import type { BaseState, Registry } from '../state/types';

export const SAVE_FORMAT = 'swrpg-v2';
export const ENVELOPE_VERSION = 1;

export interface SaveEnvelope<S = unknown> {
  format: typeof SAVE_FORMAT;
  envelopeVersion: number;
  featureVersions: Record<string, number>;
  savedAt: string;
  state: S;
}

/** Envelope migrations: from version n to n + 1. None yet. */
export const ENVELOPE_MIGRATIONS: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = {};

export function makeEnvelope<S extends BaseState>(registry: Registry<S>, state: S, savedAt: string): SaveEnvelope<S> {
  return { format: SAVE_FORMAT, envelopeVersion: ENVELOPE_VERSION, featureVersions: featureVersions(registry), savedAt, state };
}

export type LoadResult<S> = { ok: true; state: S; envelope: SaveEnvelope<S> } | { ok: false; error: string };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function loadEnvelope<S extends BaseState>(
  registry: Registry<S>,
  raw: unknown,
  migrations: Record<number, (old: Record<string, unknown>) => Record<string, unknown>> = ENVELOPE_MIGRATIONS,
): LoadResult<S> {
  if (!isRecord(raw) || raw['format'] !== SAVE_FORMAT) return { ok: false, error: 'Not a swrpg-v2 save.' };
  let env: Record<string, unknown> = raw;
  let version = env['envelopeVersion'];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return { ok: false, error: 'The save has no valid envelope version.' };
  if (version > ENVELOPE_VERSION) return { ok: false, error: `The save is from a newer version (envelope ${version}).` };
  try {
    while (version < ENVELOPE_VERSION) {
      const m = migrations[version];
      if (!m) return { ok: false, error: `No migration from envelope version ${version}.` };
      env = m(env);
      version += 1;
    }
  } catch (e) {
    return { ok: false, error: `Envelope migration failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const stored = env['featureVersions'];
  const state = env['state'];
  if (!isRecord(stored) || !isRecord(state)) return { ok: false, error: 'The save is missing its state or feature versions.' };
  const migrated: Record<string, unknown> = { ...state };
  for (const f of registry) {
    let from = stored[f.id];
    if (from === undefined && !(f.id in state) && f.emptyState) {
      // A feature added after this save was made: start it empty (M2 entities on an M1 save).
      migrated[f.id] = f.emptyState();
      from = f.version;
    }
    if (typeof from !== 'number') return { ok: false, error: `The save has no version for feature ${f.id}.` };
    if (from > f.version) return { ok: false, error: `Feature ${f.id} is from a newer version (${from} > ${f.version}).` };
    try {
      for (let v = from + 1; v <= f.version; v++) {
        const m = f.migrations?.[v];
        if (!m) return { ok: false, error: `No migration for feature ${f.id} to version ${v}.` };
        migrated[f.id] = m(migrated[f.id]);
      }
    } catch (e) {
      return { ok: false, error: `Migration of ${f.id} failed: ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  const parsed = buildStateSchema(registry).safeParse(migrated);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: `The save failed validation (${issue ? `${issue.path.join('.')}: ${issue.message}` : 'invalid'}).` };
  }
  const envelope: SaveEnvelope<S> = {
    format: SAVE_FORMAT,
    envelopeVersion: ENVELOPE_VERSION,
    featureVersions: featureVersions(registry),
    savedAt: typeof env['savedAt'] === 'string' ? env['savedAt'] : '',
    state: parsed.data,
  };
  return { ok: true, state: parsed.data, envelope };
}
