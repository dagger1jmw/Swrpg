// Storage interface (architecture §13). The turn commit writes the autosave snapshot and the
// transcript entry in one transaction. The transcript is append-only and never deleted.
import type { SaveEnvelope } from './envelope';
import { retainSaves, saveIndexKey, saveMetaOf, type SaveMeta } from './saveHistory';

export interface TranscriptEntry<T = unknown> {
  campaignId: string;
  branchId: string;
  /** The turn number this entry committed (state.meta.turn after the commit). */
  turn: number;
  savedAt: string;
  data: T;
}

export interface CampaignRecord {
  campaignId: string;
  name: string;
  createdAt: string;
  lastPlayedAt: string;
  /** The player's opening premise, kept so an opening interrupted by a reload can be rerun. */
  premise?: string;
  /** A dev test start's scenario (D-180): it overrides the generated opening, kept so a reloaded opening uses it too. */
  scenario?: string;
}

export const AUTOSAVE_SLOT = 'autosave';

export interface Storage {
  /**
   * Writes the autosave snapshot, the campaign record and (if given) a transcript entry atomically, and keeps the
   * snapshot in the campaign's save history (D-214: the last 10, plus one per in-game day for the last 7 days).
   */
  commitTurn(envelope: SaveEnvelope, campaign: CampaignRecord, entry: TranscriptEntry | null): Promise<void>;
  /** A raw snapshot envelope, unvalidated (load it with loadEnvelope): the autosave, or an earlier save by its key. */
  loadSnapshot(slot: string): Promise<unknown>;
  /** The campaign's earlier saves, newest first (D-214). */
  listSaves(campaignId: string): Promise<SaveMeta[]>;
  loadCampaign(campaignId: string): Promise<CampaignRecord | null>;
  /** Transcript entries of one branch from `fromTurn` (inclusive), in turn order. */
  readTranscript(campaignId: string, branchId: string, fromTurn?: number): Promise<TranscriptEntry[]>;
  /** Import (architecture §13): autosave, campaign and transcript entries in one transaction; an existing entry aborts it. */
  importCampaign(envelope: SaveEnvelope, campaign: CampaignRecord, entries: readonly TranscriptEntry[]): Promise<void>;
}

/** In-memory storage for tests. Values are cloned to mimic serialization; commits are all-or-nothing. */
export function createMemoryStorage(opts: { failNextCommit?: boolean } = {}): Storage & { snapshots: Map<string, unknown>; transcript: TranscriptEntry[] } {
  const snapshots = new Map<string, unknown>();
  const campaigns = new Map<string, CampaignRecord>();
  const transcript: TranscriptEntry[] = [];
  let failNext = opts.failNextCommit ?? false;
  return {
    snapshots,
    transcript,
    async commitTurn(envelope, campaign, entry) {
      const env = structuredClone(envelope);
      const rec = structuredClone(campaign);
      const ent = entry ? structuredClone(entry) : null;
      if (ent && transcript.some((t) => t.campaignId === ent.campaignId && t.branchId === ent.branchId && t.turn === ent.turn)) {
        throw new Error(`Transcript entry ${ent.campaignId}/${ent.branchId}/${ent.turn} already exists`);
      }
      if (failNext) {
        failNext = false;
        throw new Error('Simulated storage failure');
      }
      snapshots.set(AUTOSAVE_SLOT, env);
      // The save history (D-214), in the same all-or-nothing step.
      const meta = saveMetaOf(env);
      const r = retainSaves((snapshots.get(saveIndexKey(meta.campaignId)) as SaveMeta[] | undefined) ?? [], meta);
      snapshots.set(meta.key, structuredClone(env));
      for (const k of r.drop) snapshots.delete(k);
      snapshots.set(saveIndexKey(meta.campaignId), r.keep);
      campaigns.set(rec.campaignId, rec);
      if (ent) transcript.push(ent);
    },
    async listSaves(campaignId) {
      return structuredClone((snapshots.get(saveIndexKey(campaignId)) as SaveMeta[] | undefined) ?? []);
    },
    async importCampaign(envelope, campaign, entries) {
      const ents = entries.map((e) => structuredClone(e));
      for (const ent of ents) {
        if (transcript.some((t) => t.campaignId === ent.campaignId && t.branchId === ent.branchId && t.turn === ent.turn)) {
          throw new Error(`Transcript entry ${ent.campaignId}/${ent.branchId}/${ent.turn} already exists`);
        }
      }
      snapshots.set(AUTOSAVE_SLOT, structuredClone(envelope));
      campaigns.set(campaign.campaignId, structuredClone(campaign));
      transcript.push(...ents);
    },
    async loadCampaign(campaignId) {
      const c = campaigns.get(campaignId);
      return c ? structuredClone(c) : null;
    },
    async loadSnapshot(slot) {
      const v = snapshots.get(slot);
      return v === undefined ? null : structuredClone(v);
    },
    async readTranscript(campaignId, branchId, fromTurn = 0) {
      return transcript
        .filter((t) => t.campaignId === campaignId && t.branchId === branchId && t.turn >= fromTurn)
        .sort((a, b) => a.turn - b.turn)
        .map((t) => structuredClone(t));
    },
  };
}
