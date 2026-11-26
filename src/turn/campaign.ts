// New campaign and resume. A new campaign commits its turn-0 state immediately, so the autosave
// always holds the current campaign (legacy save bug 4: New Game undone by a reload).
import { absDayFromDate, DAYS_PER_YEAR, isValidDate, type CalendarDate } from '../engine/calendar';
import { traitCreationEvents } from '../features/traits';
import { isYounglingStart, onCoruscant3653, quizAnswerErrors, quizPlan, quizTrack, traitChoiceErrors, type QuizAnswer, type QuizInput, type TraitChoice, type TraitContext } from '../features/traits/selectors';
import { computeCreation, type CreationInput, type CreationResult } from '../features/character/selectors';
import { loadEnvelope, makeEnvelope } from '../persist/envelope';
import { AUTOSAVE_SLOT, type CampaignRecord, type Storage } from '../persist/storage';
import type { GameState } from '../state/gameState';
import { createInitialState } from '../state/registryTools';
import type { Registry } from '../state/types';
import type { Session } from './pipeline';
import { applyEvents } from '../state/applyEvents';
import { alienRole, checkStart, START_OPTION_BY_ID, startOptionsFor, startPlaceDescription, startThreadsAt, type StartOption, type StartThread } from '../data/startOptions';
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
  /** A start option (D-401 [2]): its id, and whether the character is Imperial-born (D-401 [10]). Absent = a free start. */
  start?: { optionId: string; imperialBorn: boolean };
  /**
   * Starting traits (M8 item 16; spec/traits.md): one origin, one temperament, one scar or tie, an optional flaw-heavy fourth.
   * Absent = no traits and no quiz (a programmatic or dev start; the creation screen always sends them).
   */
  traits?: TraitChoice;
  /** The formative quiz at creation: the answers and the traits accepted from its suggestions, or declined. */
  formative?: { answers: QuizAnswer[]; traits?: { temperament?: string; scarOrTie?: string; fourth?: string } } | 'declined';
  /** A dev-only test start (D-178): CI for the known combat Force abilities, and the testCharacter mark. */
  test?: { ci: number; abilities: readonly string[]; scenario?: string; grants?: Readonly<Record<string, string>> };
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

/** Default start time of day (07:00). */
export const DEFAULT_START_SECOND = 7 * 3600;

/**
 * The default start (M7, D-400; amends D-155's "no default year"): the new-campaign form opens on 1 January 3,661 BBY,
 * the Hydian Way blockade year, with a 14-year-old character. Only a prefill: the player may pick any era or date, and
 * the rules still favour no year.
 */
export const DEFAULT_START_DATE: CalendarDate = { year: -3661, month: 1, day: 1 };
export const DEFAULT_START_AGE = 14;

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
      errors.push(...startErrors(input));
      errors.push(...traitErrors(input));
      if (!c.ok && c.unmet.length) errors.push(`The rank's skill minimums are not met (${c.unmet.map((u) => `${u.skillId} ${u.have}/${u.need}`).join(', ')}): ${c.options.join('; ')}.`);
    }
  }
  return errors;
}

/** What the trait gates read for a new campaign. */
export function creationTraitContext(input: NewCampaignInput): TraitContext | null {
  const cr = input.creation;
  if (!cr || !isValidDate(input.birthDate) || !isValidDate(input.startDate)) return null;
  return {
    path: cr.path,
    speciesId: cr.speciesId,
    archetype: cr.archetype,
    birthYear: input.birthDate.year,
    startYear: input.startDate.year,
    trainingStartAge: cr.trainingStartAge,
    ...(cr.warYears ? { warYears: cr.warYears } : {}),
    ...(input.traits?.homeworld ? { homeworld: input.traits.homeworld } : {}),
    ...(input.start?.imperialBorn ? { imperialBorn: true } : {}),
    ...(input.traits?.origin ? { origin: input.traits.origin } : {}),
  };
}

/** The quiz's seed for a new campaign: the same inputs always draw the same scenes (character-creation test 6). */
export const creationQuizSeed = (input: NewCampaignInput): string => `${input.name.trim()}|${absDayFromDate(input.birthDate)}|${absDayFromDate(input.startDate)}|${input.creation?.path ?? ''}`;

/** Whether the quiz waits for the first long skip (a youngling start) instead of running at creation. */
export function quizDeferred(input: NewCampaignInput): boolean {
  const cr = input.creation;
  if (!cr) return false;
  return isYounglingStart(cr.path, cr.rank, (absDayFromDate(input.startDate) - absDayFromDate(input.birthDate)) / DAYS_PER_YEAR);
}

/** The creation quiz's inputs (childhood to the start age), or null (no traits, a youngling start, or nothing to cover). */
export function creationQuizInput(input: NewCampaignInput): QuizInput | null {
  const ctx = creationTraitContext(input);
  if (!ctx || !input.traits || quizDeferred(input)) return null;
  const age = (absDayFromDate(input.startDate) - absDayFromDate(input.birthDate)) / DAYS_PER_YEAR;
  return { track: quizTrack(ctx.path, ctx.archetype), fromAge: 0, toAge: age, birthYear: ctx.birthYear, origin: input.traits.origin, forceSensitive: ctx.path !== 'career', atCoruscant3653: onCoruscant3653(ctx), seed: creationQuizSeed(input) };
}

/** Errors in a new campaign's traits and quiz answers. */
export function traitErrors(input: NewCampaignInput): string[] {
  if (!input.traits) return [];
  const ctx = creationTraitContext(input);
  if (!ctx) return [];
  const errors = traitChoiceErrors(input.traits, ctx);
  const f = input.formative;
  if (f && f !== 'declined') {
    const q = creationQuizInput(input);
    if (!q) errors.push('No formative quiz runs at creation for this start (a youngling takes it at the first long skip).');
    else errors.push(...quizAnswerErrors(quizPlan(q), f.answers).map((x) => `Quiz: ${x}.`));
  }
  return errors;
}

/** Years of the Sith Empire's open war in which a Pureblood needs an Imperial origin (D-401 [10]: the 3,661 start). */
const PUREBLOOD_ORIGIN_BBY = { from: 3681, to: 3653 } as const;

/** The chosen start option, when there is one and it is offered for the start date. */
export function startOptionFor(input: NewCampaignInput): StartOption | null {
  const o = input.start ? START_OPTION_BY_ID.get(input.start.optionId) : undefined;
  return o ?? null;
}

/** Errors for the start option against the creation choices (D-401 [2], [10]). */
export function startErrors(input: NewCampaignInput): string[] {
  const cr = input.creation;
  if (!cr) return [];
  const year = input.startDate.year;
  if (input.start) {
    const o = START_OPTION_BY_ID.get(input.start.optionId);
    if (!o) return [`Unknown start ${input.start.optionId}.`];
    if (!startOptionsFor(year).includes(o)) return [`The start "${o.title}" is not offered for ${-year > 0 ? `${-year} BBY` : `${year} ABY`}.`];
    return checkStart(o, { optionId: o.id, path: cr.path, rank: cr.rank, archetype: cr.archetype, speciesId: cr.speciesId, imperialBorn: input.start.imperialBorn, bby: -year });
  }
  // A free start in the war years: a Pureblood still needs an Imperial origin (the Sith path, or marked Imperial-born).
  const bby = -year;
  if (cr.speciesId === 'sith_pureblood' && bby <= PUREBLOOD_ORIGIN_BBY.from && bby >= PUREBLOOD_ORIGIN_BBY.to && cr.path !== 'sith') {
    return ['A Sith Pureblood needs an Imperial origin in the war years: the Sith path, or a start marked Imperial-born (D-401 [10]).'];
  }
  return [];
}

/**
 * The events that seed a start option (D-401 [2]): its places, outermost first, each inside the one before, with the
 * character in the innermost; and its opening threads, tied to that place. Engine events, validated like any other.
 */
export function startEvents(o: StartOption, bby: number, extraThreads: readonly StartThread[] = []): unknown[] {
  const events: unknown[] = o.places.map((p, i) => ({
    type: 'locationIntroduced',
    key: `tmp:start${i}`,
    name: p.name,
    kind: p.kind,
    region: p.region,
    ...(i > 0 ? { parentRef: `tmp:start${i - 1}` } : {}),
    description: startPlaceDescription(p, bby),
    moveHere: i === o.places.length - 1,
  }));
  const here = `tmp:start${o.places.length - 1}`;
  for (const th of [...startThreadsAt(o, bby), ...extraThreads]) events.push({ type: 'threadOpened', title: th.title, stakes: th.stakes, entityRefs: o.places.length ? [here] : [] });
  return events;
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
  // A test start's granted abilities copy another ability's starting XP (D-215: a test Sith knows Lightning).
  const grants = input.test?.grants ?? {};
  const xp: Record<string, number> = { ...(c?.startingXp ?? {}) };
  for (const [to, from] of Object.entries(grants)) xp[to] = Math.max(xp[to] ?? 0, xp[from] ?? 0);
  const startOption = startOptionFor(input);
  const initial = createInitialState<GameState>(registry, {
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
      ...(startOption ? { start: { optionId: startOption.id, faction: startOption.faction, imperialBorn: input.start?.imperialBorn === true } } : {}),
    },
    ...(c ? { startingXp: xp, startingE: c.startingE, startingCI: input.test ? testCI(c.startingCI, xp, input.test) : c.startingCI, rank: cr!.rank, backstoryFacts: c.facts } : {}),
    ...(input.traits && cr
      ? { traits: { choice: input.traits, quiz: quizDeferred(input) ? ('pending' as const) : input.formative && input.formative !== 'declined' ? ('creation' as const) : ('declined' as const), seed: creationQuizSeed(input), startAge: (absDayFromDate(input.startDate) - absDayFromDate(input.birthDate)) / DAYS_PER_YEAR } }
      : {}),
  });
  // A start option seeds its places and threads as engine events (D-401 [2]); every one must apply.
  let state = initial;
  if (startOption) {
    const role = cr ? alienRole(startOption, { optionId: startOption.id, path: cr.path, rank: cr.rank, archetype: cr.archetype, speciesId: cr.speciesId, imperialBorn: input.start?.imperialBorn === true, bby: -input.startDate.year }) : null;
    const r = applyEvents(registry, state, startEvents(startOption, -input.startDate.year, role ? [role] : []), { source: 'engine' });
    if (r.rejected.length) throw new Error(`The start could not be seeded: ${r.rejected.map((x) => x.reason).join('; ')}`);
    state = r.state;
  }
  // Starting traits (M8 item 16): the ties' people, then the formative quiz taken at creation; every one must apply.
  if (input.traits) {
    const f = input.formative;
    const events: unknown[] = [...traitCreationEvents(state), ...(f && f !== 'declined' && !quizDeferred(input) ? [{ type: 'formativeQuizTaken', answers: f.answers, ...(f.traits ? { traits: f.traits } : {}) }] : [])];
    if (events.length) {
      const r = applyEvents(registry, state, events, { source: 'engine' });
      if (r.rejected.length) throw new Error(`The traits could not be seeded: ${r.rejected.map((x) => x.reason).join('; ')}`);
      state = r.state;
    }
  }
  const premise = input.premise?.trim() ?? '';
  const scenario = input.test?.scenario?.trim() ?? '';
  const campaign: CampaignRecord = { campaignId: ids.campaignId, name: `${input.test ? '[TEST] ' : ''}${input.name.trim()}`, createdAt: wallIso, lastPlayedAt: wallIso, ...(premise ? { premise } : {}), ...(scenario ? { scenario } : {}) };
  await storage.commitTurn(makeEnvelope(registry, state, wallIso), campaign, null);
  return { state, history: [], campaign };
}

/** Loads the autosave and its transcript. Returns null when there is none, or an error message. */
/**
 * Loads an earlier save and plays on from it on a new branch (D-214; architecture §13; health.md: after death an older
 * save starts a new branch). The old branch's transcript up to that turn is copied to the new branch (nothing is ever
 * deleted), and the new branch becomes the autosave. Returns the session, or an error for a broken save.
 */
export async function loadEarlierSave(registry: Registry<GameState>, storage: Storage, key: string, newBranchId: string, wallIso: string): Promise<{ session: Session } | { error: string }> {
  const raw = await storage.loadSnapshot(key);
  if (raw === null || raw === undefined) return { error: 'that save is no longer kept' };
  const loaded = loadEnvelope(registry, raw);
  if (!loaded.ok) return { error: loaded.error };
  const old = loaded.state;
  const state: GameState = { ...old, meta: { ...old.meta, branchId: newBranchId } };
  const entries = (await storage.readTranscript(old.meta.campaignId, old.meta.branchId)).filter((e) => e.turn <= old.meta.turn).map((e) => ({ ...e, branchId: newBranchId }));
  const campaign: CampaignRecord = { ...((await storage.loadCampaign(old.meta.campaignId)) ?? { campaignId: old.meta.campaignId, name: old.character.name, createdAt: wallIso }), lastPlayedAt: wallIso };
  await storage.importCampaign(makeEnvelope(registry, state, wallIso), campaign, entries);
  const history = entries.map((e) => ({ ...(e.data as TurnRecord), turn: e.turn }));
  return { session: { state, history, campaign } };
}

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
