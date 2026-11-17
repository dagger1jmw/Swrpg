// Export / import (architecture §13): one JSON file with the save envelope (state includes fact
// records, chapter summaries and the arc) plus the current branch's transcript. Import validates
// everything before writing anything; it never overwrites a transcript: if that campaign/branch
// already has entries, the import continues on a new branch (D-88).
import { loadEnvelope, makeEnvelope, type SaveEnvelope } from './envelope';
import { AUTOSAVE_SLOT, type CampaignRecord, type Storage, type TranscriptEntry } from './storage';
import type { BaseState, Registry } from '../state/types';

export const EXPORT_FORMAT = 'swrpg-v2-export';
export const EXPORT_VERSION = 1;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  campaign: CampaignRecord;
  envelope: SaveEnvelope;
  transcript: TranscriptEntry[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** The autosaved campaign as one export file, or null when there is no save. */
export async function exportCampaign<S extends BaseState>(registry: Registry<S>, storage: Storage, exportedAt: string): Promise<ExportFile | { error: string } | null> {
  const raw = await storage.loadSnapshot(AUTOSAVE_SLOT);
  if (raw === null || raw === undefined) return null;
  const loaded = loadEnvelope(registry, raw);
  if (!loaded.ok) return { error: loaded.error };
  const { campaignId, branchId } = loaded.state.meta;
  const campaign = (await storage.loadCampaign(campaignId)) ?? { campaignId, name: campaignId, createdAt: loaded.envelope.savedAt, lastPlayedAt: loaded.envelope.savedAt };
  const transcript = (await storage.readTranscript(campaignId, branchId)).filter((e) => e.turn <= loaded.state.meta.turn);
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt, campaign, envelope: loaded.envelope, transcript };
}

export type ParsedImport<S> = { ok: true; state: S; campaign: CampaignRecord; transcript: TranscriptEntry[] } | { ok: false; error: string };

/** Validates an export file: the envelope through the normal load pipeline, then the transcript. */
export function parseImport<S extends BaseState>(registry: Registry<S>, raw: unknown): ParsedImport<S> {
  if (!isRecord(raw) || raw['format'] !== EXPORT_FORMAT) return { ok: false, error: 'Not a swrpg-v2 export file.' };
  if (typeof raw['version'] !== 'number' || raw['version'] > EXPORT_VERSION) return { ok: false, error: 'The export is from a newer version.' };
  const loaded = loadEnvelope(registry, raw['envelope']);
  if (!loaded.ok) return { ok: false, error: loaded.error };
  const { campaignId, branchId, turn } = loaded.state.meta;
  const c = raw['campaign'];
  if (!isRecord(c) || c['campaignId'] !== campaignId || typeof c['name'] !== 'string') return { ok: false, error: 'The campaign record does not match the save.' };
  const campaign: CampaignRecord = {
    campaignId,
    name: c['name'],
    createdAt: typeof c['createdAt'] === 'string' ? c['createdAt'] : '',
    lastPlayedAt: typeof c['lastPlayedAt'] === 'string' ? c['lastPlayedAt'] : '',
    ...(typeof c['premise'] === 'string' && c['premise'] ? { premise: c['premise'] } : {}),
  };
  const t = raw['transcript'];
  if (!Array.isArray(t)) return { ok: false, error: 'The export has no transcript.' };
  const seen = new Set<number>();
  for (const e of t) {
    if (!isRecord(e) || e['campaignId'] !== campaignId || e['branchId'] !== branchId) return { ok: false, error: 'A transcript entry belongs to another campaign or branch.' };
    const n = e['turn'];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > turn || seen.has(n)) return { ok: false, error: `Transcript turn ${String(n)} is invalid or repeated.` };
    seen.add(n);
  }
  return { ok: true, state: loaded.state, campaign, transcript: (t as TranscriptEntry[]).slice().sort((a, b) => a.turn - b.turn) };
}

export type ImportResult<S> = { ok: true; state: S; rebranched: boolean } | { ok: false; error: string };

/** Writes a validated import as the autosave (all or nothing). */
export async function importCampaign<S extends BaseState>(
  registry: Registry<S>,
  storage: Storage,
  raw: unknown,
  newBranchId: () => string,
  savedAt: string,
): Promise<ImportResult<S>> {
  const parsed = parseImport(registry, raw);
  if (!parsed.ok) return parsed;
  let { state, transcript } = parsed;
  const existing = await storage.readTranscript(state.meta.campaignId, state.meta.branchId);
  const rebranched = existing.length > 0;
  if (rebranched) {
    const branchId = newBranchId();
    state = { ...state, meta: { ...state.meta, branchId } };
    transcript = transcript.map((e) => ({ ...e, branchId }));
  }
  await storage.importCampaign(makeEnvelope(registry, state, savedAt), parsed.campaign, transcript);
  return { ok: true, state, rebranched };
}
