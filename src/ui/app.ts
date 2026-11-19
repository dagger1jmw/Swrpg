// UI: rendering and player actions only (architecture §1). Reads state through selectors and
// calls the turn pipeline; no game rules here. Layout (D-100): one fixed app shell (top bar, main
// column with feed / choices / input, side panel), settings and campaigns in a modal; nothing
// scrolls the page, each region scrolls inside its own box.
import { DEBUG_REQUESTS_KEPT } from '../ai/context.config';
import { createModelRouter, type ModelRouter, type QuotaState } from '../ai/fallback';
import { FALLBACK_NARRATIVE_MODEL, KNOWN_MODELS } from '../ai/models.config';
import type { CallType, ModelProvider, Usage } from '../ai/provider';
import {
  loadQuota,
  loadSettings,
  loadTokenRatios,
  loadUsage,
  primaryModel,
  saveQuota,
  saveSettings,
  saveTokenRatios,
  saveUsage,
  validateApiKey,
  withModelList,
  withPrimaryModel,
  type KeyValueStore,
  type Settings,
} from '../ai/settings';
import { calibrate, type TokenRatios } from '../ai/tokenRatio';
import { recordRequest, summarizeUsage, type UsageLog } from '../ai/usage';
import { LORE_INDEX } from '../lore';
import { absDayFromDate, ageInYears, formatClock, formatDate, formatYear, isValidDate, timeOfDayLabel, type CalendarDate } from '../engine/calendar';
import type { CheckCard } from '../engine/rolls';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocation } from '../features/locations/selectors';
import { selectPacingLevel } from '../features/pacing/selectors';
import { makeEnvelope } from '../persist/envelope';
import { exportCampaign, importCampaign } from '../persist/exportImport';
import type { Storage } from '../persist/storage';
import { applyEvents } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { GameEvent, Registry } from '../state/types';
import { createCampaign, DEFAULT_START_SECOND, openingPending, resumeCampaign, validateNewCampaign } from '../turn/campaign';
import { devFlag, TEST_START_RANKS, testStartInput, type TestStartRank } from '../turn/testStart';
import { narrateTurn, prepareTurn, summarizeChapters, TurnError, type DebugRequest, type PendingTurn, type Session, type SummaryOutcome, type TurnDeps } from '../turn/pipeline';
import { describeInput, type TurnInput, type TurnRecord } from '../turn/record';
import type { TrainingOutcome } from '../turn/resolve';
import { SKILL_BY_ID } from '../data/skills';
import { creationForm } from './creationForm';
import { clear, el, input, paragraphs } from './dom';
import { renderSidePanel, type PanelTab } from './sidePanel';
import { renderCombatDraft, renderDuelPanel } from './duelPanel';
import { fightCalls, fightView } from '../turn/fightChoices';
import { commitDevCommand, isDevCommand } from '../turn/devCommands';
import { selectIsTestCharacter } from '../features/character/selectors';
import { renderJumpPlayback, renderJumpReport } from './jumpCard';
import { renderRoutineEditor, type JumpSpan } from './routineEditor';
import { spanToSeconds } from '../ai/schemas/intent';
import type { Routine } from '../features/routines/selectors';
import type { MontageReport } from '../state/montageReport';
import { previewRoutine, type RoutinePreview } from '../state/routinePreview';

/** The duel panel's share of the main column in a fight (iPad layout): remembered per device in localStorage. */
const SPLIT_KEY = 'swrpg-v2:duelSplit';
const SPLIT_MIN = 0.25;
const SPLIT_MAX = 0.75;
function readSplit(kv: KeyValueStore): number {
  try {
    const v = Number(kv.getItem(SPLIT_KEY));
    return Number.isFinite(v) && v >= SPLIT_MIN && v <= SPLIT_MAX ? v : 0.5;
  } catch {
    return 0.5;
  }
}
function writeSplit(kv: KeyValueStore, v: number): void {
  try {
    kv.setItem(SPLIT_KEY, v.toFixed(3));
  } catch {
    // Storage blocked (private mode): the split lasts for this page only.
  }
}

export interface AppDeps {
  root: HTMLElement;
  registry: Registry<GameState>;
  storage: Storage;
  kv: KeyValueStore;
  makeProvider: (getApiKey: () => string | null) => ModelProvider;
  newId: () => string;
  now: () => number;
}

type Modal = 'settings' | 'campaign' | 'routine';

interface FailedTurn {
  input: TurnInput;
  stage: string;
  message: string;
  pending: PendingTurn | undefined;
}

/** Below this width the side panel is a slide-over drawer (D-100). */
const DRAWER_QUERY = '(max-width: 899px)';

export class App {
  private settings: Settings;
  private usage: UsageLog;
  private session: Session | null = null;
  private busy = false;
  /** The action being resolved, shown in the feed and the input box while the GM replies. */
  private inFlight: TurnInput | null = null;
  private failed: FailedTurn | null = null;
  private loadError: string | null = null;
  private readonly provider: ModelProvider;
  private quota: QuotaState;
  private readonly router: ModelRouter;
  private tokenRatios: TokenRatios;
  private modal: Modal | null = null;
  /** Docked panel shown (wide) or drawer open (narrow). */
  private panelOpen: boolean;
  private panelTab: PanelTab = 'character';
  private panelError: string | null = null;
  /** The ended fight whose result summary the player closed (D-181; view state only). */
  private closedFight: string | null = null;
  /** "More actions" in the duel panel: open or not, kept for the fight it was set in (collapsed by default). */
  private moreOpen: { fightId: string; open: boolean } | null = null;
  /** The duel panel's share of the main column in a fight (0.25-0.75; default 0.5), remembered per device. */
  private duelSplit = 0.5;
  /** The last dev command's refusal or failure (D-180), shown in the status line. */
  private devNote: string | null = null;
  /** Full request texts, this session only (D-87). */
  private debugRequests: DebugRequest[] = [];
  private summaryLog: SummaryOutcome[] = [];
  private summarizing = false;
  private settingsNote: string | null = null;
  /** The unsent text in the action box, kept across re-renders. */
  private draft = '';
  /** The feed follows new turns only while the player is at the bottom. */
  private feedStick = true;
  /** Scroll positions of the inner scrollers, by data-scroll key. */
  private scrolls = new Map<string, number>();
  /** The routine being edited in the routine modal (M4), and its cached preview. */
  private routineDraft: Routine | null = null;
  private routinePreview: { key: string; preview: RoutinePreview } | null = null;
  /** Day-by-day playback of a jump while the narration call runs (M4). */
  private playback: { report: MontageReport; shown: number; timer: ReturnType<typeof setTimeout> | null } | null = null;

  constructor(private readonly d: AppDeps) {
    this.duelSplit = readSplit(d.kv);
    this.tokenRatios = loadTokenRatios(d.kv);
    this.settings = loadSettings(d.kv);
    this.usage = loadUsage(d.kv);
    this.quota = loadQuota(d.kv);
    this.provider = d.makeProvider(() => this.settings.apiKey);
    this.router = createModelRouter({
      getLists: () => this.settings.modelLists,
      getLimits: () => this.settings.limits,
      getUsage: () => this.usage,
      getQuota: () => this.quota,
      setQuota: (q) => {
        this.quota = q;
        saveQuota(this.d.kv, q);
      },
      now: () => this.d.now(),
    });
    this.panelOpen = !window.matchMedia(DRAWER_QUERY).matches;
  }

  async start(): Promise<void> {
    try {
      const resumed = await resumeCampaign(this.d.registry, this.d.storage);
      if (resumed && 'session' in resumed) this.session = resumed.session;
      else if (resumed && 'error' in resumed) this.loadError = `The autosave could not be loaded: ${resumed.error}`;
    } catch (e) {
      this.loadError = `Storage error: ${e instanceof Error ? e.message : String(e)}`;
    }
    this.modal = this.requiredModal();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal && !this.requiredModal()) {
        this.modal = null;
        this.render();
      }
    });
    window.matchMedia(DRAWER_QUERY).addEventListener('change', (e) => {
      this.panelOpen = !e.matches;
      this.render();
    });
    this.render();
  }

  /** The modal that cannot be closed yet: no API key, or no campaign. */
  private requiredModal(): Modal | null {
    if (!this.settings.apiKey) return 'settings';
    if (!this.session) return 'campaign';
    return null;
  }

  // ---- Turn plumbing ----

  private turnDeps(): TurnDeps {
    return {
      registry: this.d.registry,
      provider: this.provider,
      router: this.router,
      storage: this.d.storage,
      getSettings: () => this.settings,
      wallClock: () => {
        const ms = this.d.now();
        return { ms, iso: new Date(ms).toISOString() };
      },
      recordCall: (model: string, usage: Usage | null) => {
        this.usage = recordRequest(this.usage, model, usage?.inputTokens ?? 0, this.d.now());
        saveUsage(this.d.kv, this.usage);
      },
      getTokenRatios: () => this.tokenRatios,
      recordTokenRatio: (model, chars, promptTokens) => {
        this.tokenRatios = calibrate(this.tokenRatios, model, chars, promptTokens);
        saveTokenRatios(this.d.kv, this.tokenRatios);
      },
      onRequest: (r) => {
        this.debugRequests = [...this.debugRequests, r].slice(-DEBUG_REQUESTS_KEPT);
      },
    };
  }

  /** The chapter summary call after a close (D-57); input waits so no turn races its commit. */
  private async runSummaries(): Promise<void> {
    if (!this.session) return;
    this.busy = true;
    this.summarizing = true;
    this.render();
    try {
      const r = await summarizeChapters(this.turnDeps(), this.session);
      this.session = r.session;
      this.summaryLog = [...this.summaryLog, ...r.outcomes].slice(-20);
    } catch (e) {
      this.panelError = `Summary failed: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      this.busy = false;
      this.summarizing = false;
      this.render();
    }
  }

  /** Player events (pins, review resolutions): applied through applyEvents and committed. */
  /** A dev sandbox command (D-180): test campaigns only; recorded as a "[DEV]" turn, no AI call. */
  private async runDev(text: string): Promise<void> {
    if (!this.session || this.busy) return;
    if (!selectIsTestCharacter(this.session.state)) {
      this.devNote = 'Dev commands work only in a test campaign (the dev test start). Nothing was sent.';
      this.render();
      return;
    }
    try {
      const r = await commitDevCommand({ registry: this.d.registry, storage: this.d.storage, wallClock: () => ({ iso: new Date(this.d.now()).toISOString() }) }, this.session, text);
      this.session = r.session;
      this.draft = '';
      this.devNote = null;
      this.feedStick = true;
    } catch (e) {
      this.devNote = `Dev command failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    this.render();
  }

  private async playerEvents(events: GameEvent[]): Promise<void> {
    if (!this.session || this.busy) return;
    const r = applyEvents(this.d.registry, this.session.state, events, { source: 'player' });
    if (r.rejected.length) {
      this.panelError = r.rejected.map((x) => x.reason).join('; ');
      this.render();
      return;
    }
    const iso = new Date(this.d.now()).toISOString();
    const campaign = { ...this.session.campaign, lastPlayedAt: iso };
    try {
      await this.d.storage.commitTurn(makeEnvelope(this.d.registry, r.state, iso), campaign, null);
      this.session = { ...this.session, state: r.state, campaign };
      this.panelError = null;
    } catch (e) {
      this.panelError = `Could not save: ${e instanceof Error ? e.message : String(e)}`;
    }
    this.render();
  }

  private async exportFile(): Promise<void> {
    const file = await exportCampaign(this.d.registry, this.d.storage, new Date(this.d.now()).toISOString());
    if (!file || 'error' in file) {
      this.settingsNote = file ? `Export failed: ${file.error}` : 'There is no saved campaign to export.';
      this.render();
      return;
    }
    const blob = new Blob([JSON.stringify(file)], { type: 'application/json' });
    const a = el('a', { attrs: { href: URL.createObjectURL(blob), download: `swrpg-${file.campaign.name.replace(/[^\w-]+/g, '_')}-turn${file.transcript.length}.json` } });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    this.settingsNote = `Exported ${file.campaign.name} (${file.transcript.length} turns).`;
    this.render();
  }

  private async importFile(f: File): Promise<void> {
    try {
      const raw = JSON.parse(await f.text()) as unknown;
      const r = await importCampaign(this.d.registry, this.d.storage, raw, this.d.newId, new Date(this.d.now()).toISOString());
      if (!r.ok) {
        this.settingsNote = `Import refused: ${r.error}`;
      } else {
        const resumed = await resumeCampaign(this.d.registry, this.d.storage);
        if (resumed && 'session' in resumed) this.session = resumed.session;
        this.feedStick = true;
        this.settingsNote = `Imported ${this.session?.campaign.name ?? 'the campaign'}${r.rebranched ? ' (on a new branch, since this campaign already exists here)' : ''}.`;
      }
    } catch (e) {
      this.settingsNote = `Import failed: ${e instanceof Error ? e.message : String(e)}`;
    }
    this.render();
  }

  private async runTurn(turnInput: TurnInput, pending?: PendingTurn): Promise<void> {
    if (!this.session || this.busy) return;
    this.busy = true;
    this.inFlight = turnInput;
    this.failed = null;
    this.feedStick = true;
    if (turnInput.kind === 'typed') this.draft = '';
    this.render();
    const deps = this.turnDeps();
    let closed = false;
    try {
      const p = pending ?? (await prepareTurn(deps, this.session, turnInput));
      if (p.resolution.draft.jump) this.startPlayback(p.resolution.draft.jump.report);
      const { session, record } = await narrateTurn(deps, this.session, p);
      this.session = session;
      closed = record.chapterClosed !== undefined;
    } catch (e) {
      const te = e instanceof TurnError ? e : null;
      this.failed = {
        input: turnInput,
        stage: te?.stage ?? 'unknown',
        message: e instanceof Error ? e.message : String(e),
        pending: te?.pending,
      };
    } finally {
      this.stopPlayback();
      this.busy = false;
      this.inFlight = null;
      this.render();
    }
    if (closed) await this.runSummaries();
  }

  /** Shows the jump's days ticking by (about 4 seconds for any length) while the GM writes. */
  private startPlayback(report: MontageReport): void {
    this.stopPlayback();
    const step = Math.max(1, Math.ceil(report.days.length / 100));
    this.playback = { report, shown: 0, timer: null };
    const tick = (): void => {
      if (!this.playback) return;
      this.playback.shown = Math.min(report.days.length, this.playback.shown + step);
      this.render();
      if (this.playback.shown < report.days.length) this.playback.timer = setTimeout(tick, 40);
    };
    tick();
  }

  private stopPlayback(): void {
    if (this.playback?.timer) clearTimeout(this.playback.timer);
    this.playback = null;
  }

  // ---- Routine (M4) ----

  private openRoutine(): void {
    if (!this.session) return;
    this.routineDraft = structuredClone(this.session.state.routines.active);
    this.openModal('routine');
  }

  private async routineEvents(events: GameEvent[], resetDraft: boolean): Promise<void> {
    await this.playerEvents(events);
    if (resetDraft && this.session) this.routineDraft = structuredClone(this.session.state.routines.active);
    this.render();
  }

  private async startJump(span: JumpSpan): Promise<void> {
    if (!this.session || !this.routineDraft) return;
    if (JSON.stringify(this.routineDraft) !== JSON.stringify(this.session.state.routines.active)) {
      await this.playerEvents([{ type: 'routineSet', routine: this.routineDraft }]);
      if (this.panelError) return;
    }
    // Over 120 days is a time skip (architecture §8); the engine ends it on the calendar date (D-142).
    const level = spanToSeconds(span) > 120 * 86_400 ? 'timeSkip' : 'montage';
    const words = `${span.amount} ${span.amount === 1 ? span.unit.slice(0, -1) : span.unit}`;
    this.modal = null;
    const label = `${level === 'montage' ? 'Montage' : 'Time skip'}: ${words} on the routine`;
    void this.runTurn({
      kind: 'action',
      label,
      intent: { actionType: 'train', targets: [], references: [], unknownNames: [], requestedPacing: level, requestedSpan: span },
    });
  }

  private renderRoutineBody(): HTMLElement[] {
    const session = this.session;
    if (!session) return [el('p', { class: 'hint', text: 'No campaign.' })];
    const draft = this.routineDraft ?? session.state.routines.active;
    const key = `${session.state.meta.turn}|${JSON.stringify(draft)}|${JSON.stringify(session.state.routines.active)}`;
    if (this.routinePreview?.key !== key) this.routinePreview = { key, preview: previewRoutine(this.d.registry, session.state, draft) };
    return [
      ...(this.panelError ? [el('div', { class: 'error', text: this.panelError })] : []),
      ...renderRoutineEditor({
        state: session.state,
        draft,
        preview: this.routinePreview.preview,
        busy: this.busy,
        dirty: JSON.stringify(draft) !== JSON.stringify(session.state.routines.active),
        setDraft: (r) => ((this.routineDraft = r), this.render()),
        save: (r) => void this.routineEvents([{ type: 'routineSet', routine: r }], true),
        saveTemplate: (name) => void this.routineEvents([{ type: 'routineTemplateSaved', name }], false),
        loadTemplate: (id) => void this.routineEvents([{ type: 'routineTemplateLoaded', templateId: id }], true),
        deleteTemplate: (id) => void this.routineEvents([{ type: 'routineTemplateDeleted', templateId: id }], false),
        resolveSuggestion: (accept) => void this.routineEvents([{ type: 'routineSuggestionResolved', accept }], true),
        startJump: (span) => void this.startJump(span),
      }),
    ];
  }

  // ---- Rendering ----

  render(): void {
    const root = this.d.root;
    for (const n of root.querySelectorAll<HTMLElement>('[data-scroll]')) this.scrolls.set(n.dataset['scroll']!, n.scrollTop);
    clear(root);
    root.className = `shell${this.panelOpen ? ' panel-open' : ''}`;
    root.append(this.renderTopBar(), this.renderMain());
    if (this.session && this.panelOpen) {
      root.append(el('div', { class: 'backdrop', on: { click: () => ((this.panelOpen = false), this.render()) } }));
      root.append(this.renderPanel(this.session));
    }
    if (this.modal) root.append(this.renderModal(this.modal));
    // Restore inner scroll positions; the feed follows new turns only while stuck to the bottom.
    for (const n of root.querySelectorAll<HTMLElement>('[data-scroll]')) {
      const key = n.dataset['scroll']!;
      if (key === 'feed') {
        n.scrollTop = this.feedStick ? n.scrollHeight : (this.scrolls.get(key) ?? n.scrollHeight);
        n.addEventListener('scroll', () => {
          this.feedStick = n.scrollHeight - n.scrollTop - n.clientHeight < 24;
        });
      } else n.scrollTop = this.scrolls.get(key) ?? 0;
    }
  }

  private openModal(m: Modal): void {
    this.modal = m;
    this.settingsNote = null;
    this.render();
  }

  private renderTopBar(): HTMLElement {
    const state = this.session?.state;
    const ms = this.d.now();
    const narrativeModel = primaryModel(this.settings, 'narrative');
    const models = [...new Set([...KNOWN_MODELS, narrativeModel])];
    const remainingLabel = (m: string): string => {
      const s = summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms);
      const count = s.remainingToday !== null ? `${s.remainingToday} left` : `${s.requestsToday} used`;
      return `${m}${m === FALLBACK_NARRATIVE_MODEL ? ' (fallback)' : ''} · ${count}`;
    };
    const picker = el(
      'select',
      {
        class: 'tb-model',
        attrs: { 'aria-label': 'Story model', title: 'Story model' },
        on: {
          change: (e) => {
            this.settings = withPrimaryModel(this.settings, 'narrative', (e.target as HTMLSelectElement).value);
            saveSettings(this.d.kv, this.settings);
            this.render();
          },
        },
      },
      models.map((m) => el('option', { text: remainingLabel(m), attrs: { value: m } })),
    );
    picker.value = narrativeModel;

    // Usage meter: the story model actually in use today, with a badge for warnings or fallback.
    const inUse = this.router.choose('narrative').model;
    const use = summarizeUsage(this.usage, inUse, this.settings.limits[inUse] ?? {}, ms);
    const allModels = [...new Set((['narrative', 'intent', 'summary', 'ooc'] as CallType[]).map((ct) => this.router.choose(ct).model))];
    const warnings = [...this.router.notices(), ...allModels.flatMap((m) => summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms).warnings)];
    const meterText = use.limits.rpd !== undefined ? `${use.requestsToday}/${use.limits.rpd}` : `${use.requestsToday} today`;
    const meter = el('span', { class: `tb-meter${warnings.length ? ' warn' : ''}`, attrs: { title: [`${inUse}: ${meterText} requests today`, ...warnings].join('\n') } }, [
      warnings.length ? el('span', { class: 'badge', text: '!' }) : null,
      meterText,
    ]);

    const left: (HTMLElement | null)[] = state
      ? (() => {
          const now = selectNow(state);
          const loc = selectCurrentLocation(state);
          return [
            el('strong', { class: 'tb-time', text: `${formatClock(now.second)} ${timeOfDayLabel(now.second)}` }),
            el('span', { class: 'tb-date', text: formatDate(now.day) }),
            loc ? el('span', { class: 'tb-opt tb-place', text: loc.name }) : null,
            el('span', { class: 'tb-chip', text: selectPacingLevel(state) }),
            el('span', { class: 'tb-opt tb-turn', text: `turn ${state.meta.turn}` }),
          ];
        })()
      : [el('strong', { text: 'Star Wars Legends RPG' })];

    return el('header', { class: 'box topbar' }, [
      el('div', { class: 'tb-left' }, left),
      el('div', { class: 'tb-right' }, [
        picker,
        meter,
        this.session
          ? el('button', {
              class: `icon${this.panelOpen ? ' active' : ''}`,
              text: '▤',
              attrs: { 'aria-label': 'Toggle side panel', title: 'Character, people, places', 'aria-expanded': String(this.panelOpen) },
              on: { click: () => ((this.panelOpen = !this.panelOpen), this.render()) },
            })
          : null,
        el('button', { class: 'icon', text: '☰', attrs: { 'aria-label': 'Menu', title: 'Settings and campaigns' }, on: { click: () => this.openModal('settings') } }),
      ]),
    ]);
  }

  private renderMain(): HTMLElement {
    const session = this.session;
    const turns = session ? session.history.map((r) => this.renderTurn(r)) : [];
    const pendingLine =
      this.busy && this.inFlight && this.inFlight.kind !== 'opening'
        ? el('div', { class: 'turn pending' }, [el('div', { class: 'player', text: describeInput(this.inFlight) }), this.playback ? renderJumpPlayback(this.playback.report, this.playback.shown) : null])
        : null;
    const failedLine = !this.busy && this.failed && this.failed.input.kind !== 'opening' ? el('div', { class: 'turn pending' }, [el('div', { class: 'player', text: describeInput(this.failed.input) })]) : null;
    const emptyFeed = session && !session.history.length && !this.busy ? el('p', { class: 'hint center', text: 'The story begins here.' }) : null;
    const feed = el('section', { class: 'box feed' }, [
      el('div', { class: 'box-body feed-body', attrs: { 'data-scroll': 'feed', 'aria-live': 'polite' } }, [...turns, pendingLine, failedLine, emptyFeed]),
    ]);

    // Choices box: the last turn's choices, or the interrupted-opening prompt (D-97).
    const last = session?.history[session.history.length - 1];
    let choiceItems: HTMLElement[] = [];
    if (session && openingPending(session) && !this.busy && !this.failed) {
      choiceItems = [
        el('p', { class: 'hint', text: 'The opening scene was not written (the page was reloaded before it finished).' }),
        el('button', { class: 'choice', text: 'Write the opening', on: { click: () => void this.runTurn({ kind: 'opening', premise: session.campaign.premise ?? '', ...(session.campaign.scenario ? { scenario: session.campaign.scenario } : {}) }) } }),
        el('button', { class: 'choice secondary', text: 'Discard and create a new character', on: { click: () => this.openModal('campaign') } }),
      ];
    }
    // One source of truth (D-181): the combat slice. While a fight is active the duel panel holds the choices.
    const view = session ? fightView(session.state, last ?? null, this.closedFight) : null;
    if (view && last && !openingPending(session!) && !this.busy && !this.failed) {
      choiceItems = view.storyChoices.map((c) => el('button', { class: 'choice', text: c.label, on: { click: () => void this.runTurn({ kind: 'choice', choice: c }) } }));
    }
    // Death ends the campaign (D-154): an ending card instead of choices; loading an older save starts a new branch.
    if (session?.state.health.death) {
      const ending = el('section', { class: 'box choices ending' }, [
        el('div', { class: 'box-body' }, [
          el('strong', { text: `${session.state.character.name} is dead.` }),
          el('p', { class: 'hint', text: `${session.state.health.death.cause}. Load an older save from the campaign menu to play on from there (a new branch), or create a new character.` }),
          el('button', { class: 'choice secondary', text: 'Campaign menu', on: { click: () => this.openModal('campaign') } }),
        ]),
      ]);
      return el('main', { class: 'main' }, [feed, ending]);
    }
    const duel = session
      ? renderDuelPanel({
          state: session.state,
          busy: this.busy,
          act: (input) => void this.runTurn(input),
          setStance: (stance) => void this.playerEvents([{ type: 'stanceSet', stance }]),
          setTarget: (targetRef) => void this.playerEvents([{ type: 'targetSet', targetRef }]),
          suggestions: view && !this.busy && !this.failed ? view.suggestions : [],
          pick: (choice) => void this.runTurn({ kind: 'choice', choice }),
          summary: view?.summary ?? null,
          closeSummary: () => ((this.closedFight = view?.summary?.fightId ?? null), this.render()),
          aiCalls: devFlag(globalThis.location?.search ?? '') && session.state.combat.active ? fightCalls(session.history, session.state.combat.active.id) : null,
          moreOpen: !!session.state.combat.active && this.moreOpen?.fightId === session.state.combat.active.id && this.moreOpen.open,
          setMoreOpen: (open) => {
            const id = session.state.combat.active?.id;
            if (id) this.moreOpen = { fightId: id, open };
          },
        })
      : null;
    const choices = choiceItems.length ? el('section', { class: 'box choices' }, [el('div', { class: 'box-body', attrs: { 'data-scroll': 'choices' } }, choiceItems)]) : null;

    // In a fight the story and the duel panel split the column (50/50 by default); a handle between them resizes it.
    if (duel && session?.state.combat.active) {
      const r = this.duelSplit;
      feed.style.flex = `${(1 - r).toFixed(3)} 1 0px`;
      duel.style.flex = `${r.toFixed(3)} 1 0px`;
      duel.classList.add('split');
      const handle = el('div', { class: 'split-handle', attrs: { role: 'separator', 'aria-orientation': 'horizontal', 'aria-label': 'Resize the story and the duel panel', tabindex: '0', 'aria-valuenow': String(Math.round(r * 100)) } }, [el('span', { class: 'grip' })]);
      const setRatio = (ratio: number): void => {
        this.duelSplit = Math.max(SPLIT_MIN, Math.min(SPLIT_MAX, ratio));
        feed.style.flex = `${(1 - this.duelSplit).toFixed(3)} 1 0px`;
        duel.style.flex = `${this.duelSplit.toFixed(3)} 1 0px`;
      };
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);
        const top = feed.getBoundingClientRect().top;
        const bottom = duel.getBoundingClientRect().bottom;
        const move = (ev: PointerEvent): void => setRatio((bottom - ev.clientY) / Math.max(1, bottom - top));
        const up = (): void => {
          handle.removeEventListener('pointermove', move);
          handle.removeEventListener('pointerup', up);
          handle.removeEventListener('pointercancel', up);
          writeSplit(this.d.kv, this.duelSplit);
        };
        handle.addEventListener('pointermove', move);
        handle.addEventListener('pointerup', up);
        handle.addEventListener('pointercancel', up);
      });
      handle.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        setRatio(this.duelSplit + (e.key === 'ArrowUp' ? 0.05 : -0.05));
        writeSplit(this.d.kv, this.duelSplit);
      });
      return el('main', { class: 'main' }, [feed, handle, duel, choices, this.renderInput()]);
    }
    return el('main', { class: 'main' }, [feed, duel, choices, this.renderInput()]);
  }

  private renderInput(): HTMLElement {
    const text = el('textarea', { attrs: { placeholder: this.session ? 'What do you do?' : 'Create a character to begin.', rows: '2', 'aria-label': 'Your action' } });
    text.value = this.draft;
    text.addEventListener('input', () => (this.draft = text.value));
    const send = (): void => {
      const t = text.value.trim();
      if (!t) return;
      // Dev sandbox (D-180): in dev mode a slash command runs in code, never through the AI.
      if (devFlag(globalThis.location?.search ?? '') && isDevCommand(t)) void this.runDev(t);
      else void this.runTurn({ kind: 'typed', text: t });
    };
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    const sendBtn = el('button', { class: 'send', text: 'Send', on: { click: send } });
    if (this.busy || !this.session) {
      text.disabled = true;
      sendBtn.disabled = true;
    }

    let status: HTMLElement;
    if (this.failed) {
      const f = this.failed;
      const what = f.stage === 'intent' ? 'Could not read your action' : f.stage === 'commit' ? 'Could not save the turn' : 'The GM reply failed';
      status = el('div', { class: 'status error' }, [
        el('span', { class: 'status-text', text: `${what}: ${f.message}`, attrs: { title: f.message } }),
        el('button', { class: 'small', text: 'Retry', on: { click: () => void this.runTurn(f.input, f.pending) } }),
        el('button', { class: 'small secondary', text: 'Dismiss', on: { click: () => ((this.failed = null), this.render()) } }),
      ]);
    } else if (this.busy) {
      const label = this.summarizing ? 'A chapter closed. Writing its summary…' : this.inFlight && this.inFlight.kind !== 'opening' ? `Resolving: ${describeInput(this.inFlight)}` : 'Writing the opening scene…';
      status = el('div', { class: 'status busy' }, [el('span', { class: 'spinner', attrs: { 'aria-hidden': 'true' } }), el('span', { class: 'status-text', text: label, attrs: { title: label } })]);
    } else if (this.devNote) {
      status = el('div', { class: 'status error' }, [
        el('span', { class: 'status-text', text: this.devNote, attrs: { title: this.devNote } }),
        el('button', { class: 'small secondary', text: 'Dismiss', on: { click: () => ((this.devNote = null), this.render()) } }),
      ]);
    } else {
      status = el('div', { class: 'status' }, [el('span', { class: 'status-text hint', text: this.session ? 'Type an action, or pick a choice above.' : '' })]);
    }
    return el('section', { class: 'box input' }, [status, el('div', { class: 'composer' }, [text, sendBtn])]);
  }

  private renderPanel(session: Session): HTMLElement {
    return renderSidePanel({
      state: session.state,
      campaignName: session.campaign.name,
      history: session.history,
      tab: this.panelTab,
      busy: this.busy,
      debugRequests: this.debugRequests,
      summaryLog: this.summaryLog,
      error: this.panelError,
      setTab: (t) => ((this.panelTab = t), this.render()),
      close: () => ((this.panelOpen = false), this.render()),
      playerEvents: (events) => void this.playerEvents(events),
      retrySummaries: () => void this.runSummaries(),
      act: (input) => void this.runTurn(input),
      openRoutine: () => this.openRoutine(),
    });
  }

  private renderModal(m: Modal): HTMLElement {
    const required = this.requiredModal();
    const close = (): void => {
      if (this.requiredModal()) return;
      this.modal = null;
      this.render();
    };
    const tab = (id: Modal, label: string): HTMLButtonElement =>
      el('button', { class: id === m ? 'tab active' : 'tab', text: label, attrs: { role: 'tab', 'aria-selected': String(id === m) }, on: { click: () => this.openModal(id) } });
    if (m === 'routine') {
      const dialog = el('div', { class: 'box modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Training routine' } }, [
        el('div', { class: 'box-head' }, [el('strong', { text: 'Training routine' }), el('button', { class: 'icon', text: '×', attrs: { 'aria-label': 'Close' }, on: { click: close } })]),
        el('div', { class: 'box-body modal-body', attrs: { 'data-scroll': 'modal-routine' } }, this.renderRoutineBody()),
      ]);
      return el('div', { class: 'modal-layer', on: { click: (e) => e.target === e.currentTarget && close() } }, [dialog]);
    }
    const body = m === 'settings' ? this.renderSettingsBody() : this.renderCampaignBody();
    const dialog = el('div', { class: 'box modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': m === 'settings' ? 'Settings' : 'Campaign' } }, [
      el('div', { class: 'box-head' }, [
        el('div', { class: 'tabs' }, [tab('settings', 'Settings'), ...(this.settings.apiKey ? [tab('campaign', 'Campaign')] : [])]),
        required ? null : el('button', { class: 'icon', text: '×', attrs: { 'aria-label': 'Close' }, on: { click: close } }),
      ]),
      el('div', { class: 'box-body modal-body', attrs: { 'data-scroll': `modal-${m}` } }, body),
    ]);
    return el('div', { class: 'modal-layer', on: { click: (e) => e.target === e.currentTarget && close() } }, [dialog]);
  }

  private renderSettingsBody(): HTMLElement[] {
    const s = this.settings;
    const keyInput = input({ type: 'password', autocomplete: 'off', placeholder: 'AIza...', value: s.apiKey ?? '' });
    const err = el('div', { class: 'error' });

    const modelFields = (['narrative', 'intent', 'summary', 'ooc'] as CallType[]).map((ct) => {
      const inp = input({ value: s.modelLists[ct].join(', ') });
      return { ct, inp, node: el('div', { class: 'field' }, [el('label', { text: `${ct} models (in order; later ones are used when a daily limit is reached)` }), inp]) };
    });

    const models = [...new Set([...KNOWN_MODELS, ...Object.values(s.modelLists).flat(), ...Object.keys(s.limits)])];
    const limitRows = models.map((m) => {
      const l = s.limits[m] ?? {};
      const cell = (v: number | undefined) => input({ type: 'number', min: '1', value: v !== undefined ? String(v) : '' });
      const rpm = cell(l.rpm);
      const tpm = cell(l.tpm);
      const rpd = cell(l.rpd);
      return { m, rpm, tpm, rpd, node: el('tr', {}, [el('td', { text: m }), el('td', {}, [rpm]), el('td', {}, [tpm]), el('td', {}, [rpd])]) };
    });

    const autoRetry = input({ type: 'checkbox' });
    autoRetry.checked = s.autoRetry;

    const save = (): void => {
      const k = validateApiKey(keyInput.value);
      if ('error' in k) {
        err.textContent = k.error;
        return;
      }
      let next: Settings = { ...this.settings, apiKey: k.key, autoRetry: autoRetry.checked };
      for (const f of modelFields) next = withModelList(next, f.ct, f.inp.value.split(','));
      const num = (i: HTMLInputElement): number | undefined => {
        const n = Number(i.value);
        return i.value.trim() && Number.isInteger(n) && n > 0 ? n : undefined;
      };
      const limits: Settings['limits'] = {};
      for (const r of limitRows) {
        const rpm = num(r.rpm);
        const tpm = num(r.tpm);
        const rpd = num(r.rpd);
        limits[r.m] = { ...(rpm ? { rpm } : {}), ...(tpm ? { tpm } : {}), ...(rpd ? { rpd } : {}) };
      }
      next = { ...next, limits };
      saveSettings(this.d.kv, next);
      this.settings = next;
      this.modal = this.session ? null : 'campaign';
      this.render();
    };

    return [
      el('div', { class: 'field' }, [el('label', { text: 'Gemini API key' }), keyInput]),
      el('p', {
        class: 'hint',
        text: 'Stored only in this browser (localStorage), sent only to Google in a request header, never saved in game files. Get a key at aistudio.google.com.',
      }),
      el('h3', { text: 'Models' }),
      ...modelFields.map((f) => f.node),
      el('h3', { text: 'Free-tier limits (per model)' }),
      el('p', {
        class: 'hint',
        text: 'Defaults are unverified third-party figures. Check your real limits on the AI Studio rate-limit page and enter them here. Daily counts reset at midnight Pacific time.',
      }),
      el('div', { class: 'table-wrap' }, [
        el('table', { class: 'limits' }, [
          el('tr', {}, [el('th', { text: 'Model' }), el('th', { text: 'RPM' }), el('th', { text: 'Input TPM' }), el('th', { text: 'RPD' })]),
          ...limitRows.map((r) => r.node),
        ]),
      ]),
      el('h3', { text: 'Behavior' }),
      el('label', { class: 'check' }, [autoRetry, ' Retry once automatically when a reply is cut off (uses one extra request)']),
      err,
      el('div', { class: 'row actions' }, [el('button', { text: 'Save', on: { click: save } })]),
    ];
  }

  private renderCampaignBody(): HTMLElement[] {
    const out: HTMLElement[] = [];
    if (this.loadError) out.push(el('p', { class: 'error', text: this.loadError }));
    if (this.session) {
      out.push(
        el('h3', { text: 'Current campaign' }),
        el('p', { text: `${this.session.campaign.name} · turn ${this.session.state.meta.turn}` }),
      );
    }
    out.push(
      el('h3', { text: 'Campaign file' }),
      el('p', { class: 'hint', text: 'Export the current campaign (state, people, places, threads, chapter summaries and the full transcript) as one JSON file, or import one. The API key is never included.' }),
      el('div', { class: 'row' }, [
        el('button', { class: 'secondary', text: 'Export campaign', on: { click: () => void this.exportFile() } }),
        el('label', { class: 'filebtn' }, [
          'Import campaign',
          el('input', {
            attrs: { type: 'file', accept: 'application/json,.json' },
            on: {
              change: (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) void this.importFile(f);
              },
            },
          }),
        ]),
      ]),
      this.settingsNote ? el('p', { class: 'hint', text: this.settingsNote }) : el('span'),
      el('h3', { text: 'New character' }),
      ...this.renderCreateForm(),
    );
    return out;
  }

  private renderCreateForm(): HTMLElement[] {
    const name = input({ maxlength: '60', placeholder: 'Character name' });
    const dateInputs = (d: CalendarDate | null) => {
      const year = input({ type: 'number', min: '0', value: d ? String(Math.abs(d.year)) : '' });
      const era = el('select', {}, [el('option', { text: 'BBY', attrs: { value: 'BBY' } }), el('option', { text: 'ABY', attrs: { value: 'ABY' } })]);
      era.value = d && d.year > 0 ? 'ABY' : 'BBY';
      const month = input({ type: 'number', min: '1', max: '12', value: String(d?.month ?? 1) });
      const day = input({ type: 'number', min: '1', max: '31', value: String(d?.day ?? 1) });
      const set = (v: CalendarDate): void => {
        year.value = String(Math.abs(v.year));
        era.value = v.year > 0 ? 'ABY' : 'BBY';
        month.value = String(v.month);
        day.value = String(v.day);
      };
      const read = (): CalendarDate => {
        const y = Math.trunc(Number(year.value));
        return { year: era.value === 'BBY' ? -y : y, month: Math.trunc(Number(month.value)), day: Math.trunc(Number(day.value)) };
      };
      const fields = el('div', { class: 'row' }, [
        el('div', { class: 'field' }, [el('label', { text: 'Year' }), year]),
        el('div', { class: 'field' }, [el('label', { text: 'Era' }), era]),
        el('div', { class: 'field' }, [el('label', { text: 'Month (1-12)' }), month]),
        el('div', { class: 'field' }, [el('label', { text: 'Day' }), day]),
      ]);
      return { fields, read, set, all: [year, era, month, day] };
    };
    // No default year (D-155): the player picks an era (its first year fills the start date) or types a date.
    const eras = LORE_INDEX.chunks.filter((c) => c.id.endsWith(':overview')).sort((a, b) => a.fromYear - b.fromYear);
    const eraPick = el('select', {}, [
      el('option', { text: 'Choose an era...', attrs: { value: '' } }),
      ...eras.map((c) => el('option', { text: `${c.title.replace(/ \(overview\)$/, '')} (${formatYear(c.fromYear)} to ${formatYear(c.toYear)})`, attrs: { value: c.id } })),
    ]);
    const birth = dateInputs(null);
    const startD = dateInputs(null);
    eraPick.addEventListener('change', () => {
      const c = eras.find((x) => x.id === eraPick.value);
      if (!c) return;
      startD.set({ year: c.fromYear, month: 1, day: 1 });
      if (!isValidDate(birth.read())) birth.set({ year: c.fromYear - 14, month: 1, day: 1 });
      updateAge();
    });
    const time = input({ type: 'time', value: formatClock(DEFAULT_START_SECOND) });
    const premise = el('textarea', { attrs: { placeholder: 'Optional: who you are or how the story should begin (e.g. a Padawan at the Coruscant Temple).' } });
    const ageLine = el('p', { class: 'hint' });
    const err = el('div', { class: 'error' });
    const cf = creationForm();

    const readTime = (): number => {
      const [h, m] = time.value.split(':').map(Number);
      return (h ?? 0) * 3600 + (m ?? 0) * 60;
    };
    const updateAge = (): void => {
      const b = birth.read();
      const s = startD.read();
      const ok = isValidDate(b) && isValidDate(s);
      ageLine.textContent = ok ? `Age at the start: ${ageInYears(absDayFromDate(b), absDayFromDate(s))}` : '';
      cf.update(ok ? absDayFromDate(b) : null, ok ? absDayFromDate(s) : null, name.value);
    };
    for (const i of [...birth.all, ...startD.all, name]) i.addEventListener('input', updateAge);
    updateAge();

    const begin = async (): Promise<void> => {
      const req = { name: name.value, birthDate: birth.read(), startDate: startD.read(), startSecond: readTime(), premise: premise.value, creation: cf.read() };
      const errors = validateNewCampaign(req);
      if (errors.length) {
        err.textContent = errors.join(' ');
        return;
      }
      try {
        this.session = await createCampaign(this.d.registry, this.d.storage, req, { campaignId: this.d.newId(), branchId: this.d.newId() }, new Date(this.d.now()).toISOString());
      } catch (e) {
        err.textContent = e instanceof Error ? e.message : String(e);
        return;
      }
      this.modal = null;
      this.failed = null;
      this.feedStick = true;
      await this.runTurn({ kind: 'opening', premise: premise.value.trim() });
    };

    return [
      el('div', { class: 'field' }, [el('label', { text: 'Name' }), name]),
      el('div', { class: 'field-label', text: 'Birth date' }),
      birth.fields,
      el('div', { class: 'field-label', text: 'Start date and time' }),
      el('div', { class: 'field' }, [el('label', { text: 'Era' }), eraPick]),
      el('p', { class: 'hint', text: 'Pick an era to fill the start date, or type any date. 12 months; months 1-8 have 31 days, 9-12 have 30.' }),
      startD.fields,
      el('div', { class: 'field' }, [el('label', { text: 'Time of day' }), time]),
      ageLine,
      ...cf.fields,
      el('div', { class: 'field' }, [el('label', { text: 'Premise' }), premise]),
      err,
      el('div', { class: 'row actions' }, [
        el('button', { text: this.session ? 'Begin (replaces the current campaign)' : 'Begin', on: { click: () => void begin() } }),
      ]),
      ...(devFlag(globalThis.location?.search ?? '') ? this.renderTestStart(name, startD, readTime, err) : []),
    ];
  }

  /** Dev-only test start (D-178; ?dev=1): rank and age, an Average Jedi Guardian marked as a test character. */
  private renderTestStart(name: HTMLInputElement, startD: { read: () => CalendarDate }, readTime: () => number, err: HTMLElement): HTMLElement[] {
    const rank = el('select', {}, TEST_START_RANKS.map((r) => el('option', { text: r, attrs: { value: r } })));
    const age = input({ type: 'number', value: '16', min: '4', max: '200', step: '0.5' });
    const scenario = el('textarea', { attrs: { rows: '2', placeholder: "Optional: I'm a Knight in a forest on Dantooine, ambushed by 4 Mandalorians", 'aria-label': 'Scenario' } });
    const start = async (): Promise<void> => {
      const req = testStartInput({ name: name.value, rank: rank.value as TestStartRank, age: Number(age.value), startDate: startD.read(), startSecond: readTime(), scenario: scenario.value });
      const errors = validateNewCampaign(req);
      if (errors.length) {
        err.textContent = errors.join(' ');
        return;
      }
      try {
        this.session = await createCampaign(this.d.registry, this.d.storage, req, { campaignId: this.d.newId(), branchId: this.d.newId() }, new Date(this.d.now()).toISOString());
      } catch (e) {
        err.textContent = e instanceof Error ? e.message : String(e);
        return;
      }
      this.modal = null;
      this.failed = null;
      this.feedStick = true;
      const sc = req.test?.scenario;
      await this.runTurn({ kind: 'opening', premise: req.premise ?? '', ...(sc ? { scenario: sc } : {}) });
    };
    return [
      el('div', { class: 'field-label', text: 'Dev: test start (not part of normal creation)' }),
      el('div', { class: 'field' }, [el('label', { text: 'Rank' }), rank]),
      el('div', { class: 'field' }, [el('label', { text: 'Age' }), age]),
      el('div', { class: 'field' }, [el('label', { text: 'Scenario (dev: the opening starts exactly here; later, /scenario in the chat box; /help lists the dev commands)' }), scenario]),
      el('p', { class: 'hint', text: 'An Average Jedi Guardian at this rank and age, levels from the closed form; uses the start date above. Marked as a test character.' }),
      el('div', { class: 'row actions' }, [el('button', { class: 'secondary', text: 'Start test character', on: { click: () => void start() } })]),
    ];
  }

  private renderTurn(r: TurnRecord): HTMLElement {
    const log = [
      ...r.draft.report.map((x) => `engine: ${x}`),
      ...r.applied.map((a) => `applied ${a.event.type}${a.notes.length ? ` (${a.notes.join('; ')})` : ''}`),
      ...[...r.draft.rejected, ...r.rejected].map((x) => `rejected: ${x.reason}`),
      ...r.calls.map((c) => `call ${c.callType} ${c.model}: ${c.outcome}${c.usage ? `, ${c.usage.inputTokens} in / ${c.usage.outputTokens} out` : ''}`),
    ];
    return el('article', { class: r.input.kind === 'dev' ? 'turn dev' : 'turn' }, [
      r.input.kind === 'opening' && !r.input.premise ? null : el('div', { class: 'player', text: describeInput(r.input) }),
      ...r.draft.checks.map((c) => this.renderRoll(c)),
      r.draft.training ? this.renderTraining(r.draft.training) : null,
      r.draft.jump ? renderJumpReport(r.draft.jump.report) : null,
      r.draft.combat ? renderCombatDraft(r.draft.combat) : null,
      ...r.draft.notices.map((n) => el('div', { class: 'notice', text: n })),
      ...paragraphs(r.narrative),
      r.chapterClosed ? el('div', { class: 'notice', text: `Chapter closed (${r.chapterClosed.reason}).` }) : null,
      log.length ? el('details', { class: 'log' }, [el('summary', { text: 'Engine log' }), el('pre', { text: log.join('\n') })]) : null,
    ]);
  }

  /** Training card (M3): the computeXp session, its outcome, XP per skill and the tiredness it left. */
  private renderTraining(t: TrainingOutcome): HTMLElement {
    if (!t.ok) return el('div', { class: 'roll training failure' }, [el('div', { text: `Training refused: ${t.reason}` })]);
    const c = t.card;
    const name = (id: string): string => SKILL_BY_ID.get(id)?.name ?? id;
    // XP gained this session per skill (one decimal) and each skill's new total.
    const one = (x: number): string => x.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    const gained = Object.entries(c.credited)
      .filter(([, v]) => v >= 0.05)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => {
        const t = c.totals?.[k];
        return el('div', { text: `${name(k)} +${one(v)} XP${t ? ` → ${one(t.xp)} / ${one(t.nextXp)} (level ${t.level})` : ''}` });
      });
    return el('div', { class: `roll training${c.outcome === 'breakthrough' ? ' success' : ''}` }, [
      el('div', { text: `${c.activityName} · ${c.hours} h ${c.intensity} · ${c.drillName} drill (${c.drillRating})` }),
      el('div', { text: `${c.effectiveHours} effective h × challenge ${c.challenge} × outcome ${c.outcomeMult} · ${c.instruction.mode} x${c.instruction.factor}` }),
      el('div', {}, ['Outcome: ', el('span', { class: 'outcome', text: c.outcome })]),
      ...(gained.length ? gained : [el('div', { text: 'XP: none' })]),
      ...c.levels.filter((l) => l.after !== l.before).map((l) => el('div', { class: 'outcome', text: `${name(l.skillId)} level ${l.before} → ${l.after} (${l.tier})` })),
      el('div', { class: 'hint', text: `Tiredness: physical ${c.tiredness.p}, mental ${c.tiredness.m}, Force ${c.tiredness.f}` }),
      ...c.notes.map((n) => el('div', { class: 'hint', text: n })),
    ]);
  }

  /** rolls.md §7 roll card: die, bonuses, each modifier with its source, DC, margin, outcome. */
  private renderRoll(c: CheckCard): HTMLElement {
    const f = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
    const parts = [`d20 ${c.d20}`];
    if (c.naturalBonus) parts.push(`${c.naturalBonus > 0 ? '+' : ''}${c.naturalBonus} natural ${c.d20}`);
    parts.push(`+${f(c.levelBonus)} level ${f(c.effectiveLevel)}/10`);
    for (const m of c.modifiers) parts.push(`${m.value >= 0 ? '+' : ''}${f(m.value)} ${m.source}`);
    return el('div', { class: `roll ${c.success ? 'success' : 'failure'}` }, [
      el('div', { text: `${c.label} check · ${c.difficulty} (DC ${f(c.dc)})` }),
      el('div', { text: `${parts.join(' ')} = ${f(c.total)}` }),
      el('div', {}, [`Margin ${c.margin >= 0 ? '+' : ''}${f(c.margin)} · `, el('span', { class: 'outcome', text: c.grade })]),
      ...c.notes.map((n) => el('div', { class: 'hint', text: n })),
    ]);
  }
}
