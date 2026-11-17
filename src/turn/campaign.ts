// New campaign and resume. A new campaign commits its turn-0 state immediately, so the autosave
// always holds the current campaign (legacy save bug 4: New Game undone by a reload).
import { absDayFromDate, isValidDate, type CalendarDate } from '../engine/calendar';
import { loadEnvelope, makeEnvelope } from '../persist/envelope';
import { AUTOSAVE_SLOT, type CampaignRecord, type Storage } from '../persist/storage';
import type { GameState } from '../state/gameState';
import { createInitialState } from '../state/registryTools';
import type { Registry } from '../state/types';
import type { Session } from './pipeline';
import type { TurnRecord } from './record';

export interface NewCampaignInput {
  name: string;
  birthDate: CalendarDate;
  startDate: CalendarDate;
  /** Second of the start day. */
  startSecond: number;
  /** Optional opening premise (stored on the campaign record). */
  premise?: string;
}

/** Character creation default start (character-creation.md §1: 3,661 BBY, D-01), 07:00. */
export const DEFAULT_START: { date: CalendarDate; second: number } = { date: { year: -3661, month: 1, day: 1 }, second: 7 * 3600 };

export function validateNewCampaign(input: NewCampaignInput): string[] {
  const errors: string[] = [];
  const name = input.name.trim();
  if (!name) errors.push('Enter a name.');
  if (name.length > 60) errors.push('The name must be at most 60 characters.');
  if (!isValidDate(input.birthDate)) errors.push('The birth date is not a valid date.');
  if (!isValidDate(input.startDate)) errors.push('The start date is not a valid date.');
  if (!Number.isInteger(input.startSecond) || input.startSecond < 0 || input.startSecond > 86_399) errors.push('The start time is not valid.');
  if (errors.length === 0 && absDayFromDate(input.birthDate) >= absDayFromDate(input.startDate)) {
    errors.push('The character must be born before the start date.');
  }
  return errors;
}

/** True when the campaign was created but its opening turn never committed (e.g. a reload mid-call). */
export function openingPending(session: Session): boolean {
  return session.state.meta.turn === 0 && session.history.length === 0;
}

export async function createCampaign(
  registry: Registry<GameState>,
  storage: Storage,
  input: NewCampaignInput,
  ids: { campaignId: string; branchId: string },
  wallIso: string,
): Promise<Session> {
  const errors = validateNewCampaign(input);
  if (errors.length) throw new Error(errors.join(' '));
  const state = createInitialState<GameState>(registry, {
    campaignId: ids.campaignId,
    branchId: ids.branchId,
    seed: ids.campaignId,
    start: { day: absDayFromDate(input.startDate), second: input.startSecond },
    character: { name: input.name.trim(), birthDay: absDayFromDate(input.birthDate) },
  });
  const premise = input.premise?.trim() ?? '';
  const campaign: CampaignRecord = { campaignId: ids.campaignId, name: input.name.trim(), createdAt: wallIso, lastPlayedAt: wallIso, ...(premise ? { premise } : {}) };
  await storage.commitTurn(makeEnvelope(registry, state, wallIso), campaign, null);
  return { state, history: [], campaign };
}

/** Loads the autosave and its transcript. Returns null when there is none, or an error message. */
export async function resumeCampaign(registry: Registry<GameState>, storage: Storage): Promise<{ session: Session } | { error: string } | null> {
  const raw = await storage.loadSnapshot(AUTOSAVE_SLOT);
  if (raw === null || raw === undefined) return null;
  const loaded = loadEnvelope(registry, raw);
  if (!loaded.ok) return { error: loaded.error };
  const { state } = loaded;
  const entries = await storage.readTranscript(state.meta.campaignId, state.meta.branchId);
  const history = entries.filter((e) => e.turn <= state.meta.turn).map((e) => ({ ...(e.data as TurnRecord), turn: e.turn }));
  const campaign: CampaignRecord = (await storage.loadCampaign(state.meta.campaignId)) ?? {
    campaignId: state.meta.campaignId,
    name: state.character.name,
    createdAt: loaded.envelope.savedAt,
    lastPlayedAt: loaded.envelope.savedAt,
  };
  return { session: { state, history, campaign } };
}
