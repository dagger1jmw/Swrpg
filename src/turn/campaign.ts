// New campaign and resume. A new campaign commits its turn-0 state immediately, so the autosave
// always holds the current campaign (legacy save bug 4: New Game undone by a reload).
import { absDayFromDate, isValidDate, type CalendarDate } from '../engine/calendar';
import { computeCreation, type CreationInput, type CreationResult } from '../features/character/selectors';
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
  /** Computed creation choices (M3). Absent = an untrained Human outsider (natural baselines only). */
  creation?: Omit<CreationInput, 'name' | 'birthDay' | 'startDay'>;
  /** A dev-only test start (D-178): CI for the known combat Force abilities, and the testCharacter mark. */
  test?: { ci: number; abilities: readonly string[] };
}

/** A test start's CI (D-178): the rank's sparring-level CI on every combat Force ability the character knows. */
function testCI(base: Readonly<Record<string, { CI: number; ciSpar: number }>>, xp: Readonly<Record<string, number>>, t: { ci: number; abilities: readonly string[] }): Record<string, { CI: number; ciSpar: number }> {
  const out: Record<string, { CI: number; ciSpar: number }> = { ...base };
  for (const id of t.abilities) if ((xp[id] ?? 0) > 0 && t.ci > 0) out[id] = { CI: Math.max(out[id]?.CI ?? 0, t.ci), ciSpar: Math.max(out[id]?.ciSpar ?? 0, Math.min(20, t.ci)) };
  return out;
}

/** Runs computed creation for a new campaign's inputs (null when no creation choices were made). */
export function creationFor(input: NewCampaignInput): CreationResult | null {
  if (!input.creation || !isValidDate(input.birthDate) || !isValidDate(input.startDate)) return null;
  return computeCreation({ ...input.creation, name: input.name.trim() || 'The character', birthDay: absDayFromDate(input.birthDate), startDay: absDayFromDate(input.startDate) });
}

/**
 * Default start time of day (07:00). There is no default start year: the player picks the era and date
 * (D-155; character-creation.md §1). Nothing in the game favours a year.
 */
export const DEFAULT_START_SECOND = 7 * 3600;

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
  if (errors.length === 0) {
    const c = creationFor(input);
    if (c) {
      errors.push(...c.errors);
      if (!c.ok && c.unmet.length) errors.push(`The rank's skill minimums are not met (${c.unmet.map((u) => `${u.skillId} ${u.have}/${u.need}`).join(', ')}): ${c.options.join('; ')}.`);
    }
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
  const c = creationFor(input);
  const cr = input.creation;
  const state = createInitialState<GameState>(registry, {
    campaignId: ids.campaignId,
    branchId: ids.branchId,
    seed: ids.campaignId,
    start: { day: absDayFromDate(input.startDate), second: input.startSecond },
    character: {
      name: input.name.trim(),
      birthDay: absDayFromDate(input.birthDate),
      ...(cr && c
        ? {
            speciesId: cr.speciesId,
            path: cr.path,
            archetype: cr.archetype,
            focusWeights: c.focusWeights,
            mainFormId: c.mainFormId,
            secondFormId: c.secondFormId,
            formPlan: c.mainFormId ? c.formPlan : null,
            trainingStartAge: cr.trainingStartAge,
            talents: cr.talents,
            dominantHand: cr.dominantHand,
            unbalanced: c.unbalanced,
          }
        : {}),
      ...(input.test ? { testCharacter: true } : {}),
    },
    ...(c ? { startingXp: c.startingXp, startingE: c.startingE, startingCI: input.test ? testCI(c.startingCI, c.startingXp, input.test) : c.startingCI, rank: cr!.rank, backstoryFacts: c.facts } : {}),
  });
  const premise = input.premise?.trim() ?? '';
  const campaign: CampaignRecord = { campaignId: ids.campaignId, name: `${input.test ? '[TEST] ' : ''}${input.name.trim()}`, createdAt: wallIso, lastPlayedAt: wallIso, ...(premise ? { premise } : {}) };
  await storage.commitTurn(makeEnvelope(registry, state, wallIso), campaign, null);
  return { state, history: [], campaign };
}

/** Loads the autosave and its transcript. Returns null when there is none, or an error message. */
export async function resumeCampaign(registry: Registry<GameState>, storage: Storage): Promise<{ session: Session } | { error: string } | null> {
  const raw = await storage.loadSnapshot(AUTOSAVE_SLOT);
  if (raw === null || raw === undefined) return null;
  const loaded = loadEnvelope(registry, raw);
  if (!loaded.ok) return { error: loaded.error };
  // Out-of-range numbers were clamped on load (D-176): warn and continue.
  for (const w of loaded.warnings) console.warn(`save loaded with a clamped value: ${w}`);
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
