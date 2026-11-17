// Storage interface (architecture §13). The turn commit writes the autosave snapshot and the
// transcript entry in one transaction. The transcript is append-only and never deleted.
import type { SaveEnvelope } from './envelope';

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
}

export const AUTOSAVE_SLOT = 'autosave';

export interface Storage {
  /** Writes the autosave snapshot, the campaign record and (if given) a transcript entry atomically. */
  commitTurn(envelope: SaveEnvelope, campaign: CampaignRecord, entry: TranscriptEntry | null): Promise<void>;
  /** The raw autosave envelope, unvalidated (load it with loadEnvelope). */
  loadSnapshot(slot: string): Promise<unknown>;
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
      campaigns.set(rec.campaignId, rec);
      if (ent) transcript.push(ent);
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
