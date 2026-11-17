// UI: rendering and player actions only (architecture §1). Reads state through selectors and
// calls the turn pipeline; no game rules here.
import { createModelRouter, type ModelRouter, type QuotaState } from '../ai/fallback';
import { FALLBACK_NARRATIVE_MODEL, KNOWN_MODELS } from '../ai/models.config';
import type { CallType, ModelProvider, Usage } from '../ai/provider';
import {
  loadQuota,
  loadSettings,
  loadUsage,
  primaryModel,
  saveQuota,
  saveSettings,
  saveUsage,
  validateApiKey,
  withModelList,
  withPrimaryModel,
  type KeyValueStore,
  type Settings,
} from '../ai/settings';
import { recordRequest, summarizeUsage, type UsageLog } from '../ai/usage';
import { DEBUG_REQUESTS_KEPT } from '../ai/context.config';
import { calibrate, type TokenRatios } from '../ai/tokenRatio';
import { loadTokenRatios, saveTokenRatios } from '../ai/settings';
import { selectCurrentLocation } from '../features/locations/selectors';
import { selectOpenReview } from '../features/memory/selectors';
import { makeEnvelope } from '../persist/envelope';
import { exportCampaign, importCampaign } from '../persist/exportImport';
import { applyEvents } from '../state/applyEvents';
import type { GameEvent } from '../state/types';
import { summarizeChapters, type DebugRequest, type SummaryOutcome } from '../turn/pipeline';
import { renderWorldPanel, type WorldTab } from './worldPanel';
import { ageInYears, absDayFromDate, formatClock, formatDate, isValidDate, timeOfDayLabel, type CalendarDate } from '../engine/calendar';
import type { CheckCard } from '../engine/rolls';
import { selectAge, selectCharacterName } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectPacingLevel } from '../features/pacing/selectors';
import type { Storage } from '../persist/storage';
import type { GameState } from '../state/gameState';
import type { Registry } from '../state/types';
import { createCampaign, DEFAULT_START, openingPending, resumeCampaign, validateNewCampaign } from '../turn/campaign';
import { narrateTurn, prepareTurn, TurnError, type PendingTurn, type Session, type TurnDeps } from '../turn/pipeline';
import { describeInput, type TurnInput, type TurnRecord } from '../turn/record';
import { clear, el, input, paragraphs } from './dom';

export interface AppDeps {
  root: HTMLElement;
  registry: Registry<GameState>;
  storage: Storage;
  kv: KeyValueStore;
  makeProvider: (getApiKey: () => string | null) => ModelProvider;
  newId: () => string;
  now: () => number;
}

type Screen = 'settings' | 'create' | 'game';

interface FailedTurn {
  input: TurnInput;
  stage: string;
  message: string;
  pending: PendingTurn | undefined;
}

export class App {
  private settings: Settings;
  private usage: UsageLog;
  private session: Session | null = null;
  private screen: Screen = 'create';
  private busy = false;
  /** The action being resolved, shown in the feed while the GM replies. */
  private inFlight: TurnInput | null = null;
  private failed: FailedTurn | null = null;
  private loadError: string | null = null;
  private confirmNew = false;
  private readonly provider: ModelProvider;
  private quota: QuotaState;
  private readonly router: ModelRouter;
  private tokenRatios: TokenRatios;
  private panelOpen = false;
  private panelTab: WorldTab = 'people';
  private panelError: string | null = null;
  /** Full request texts, this session only (D-87). */
  private debugRequests: DebugRequest[] = [];
  private summaryLog: SummaryOutcome[] = [];
  private summarizing = false;
  private settingsNote: string | null = null;

  constructor(private readonly d: AppDeps) {
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
  }

  async start(): Promise<void> {
    try {
      const resumed = await resumeCampaign(this.d.registry, this.d.storage);
      if (resumed && 'session' in resumed) this.session = resumed.session;
      else if (resumed && 'error' in resumed) this.loadError = `The autosave could not be loaded: ${resumed.error}`;
    } catch (e) {
      this.loadError = `Storage error: ${e instanceof Error ? e.message : String(e)}`;
    }
    this.screen = !this.settings.apiKey ? 'settings' : this.session ? 'game' : 'create';
    this.render();
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
    this.render();
    const deps = this.turnDeps();
    let closed = false;
    try {
      const p = pending ?? (await prepareTurn(deps, this.session, turnInput));
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
      this.busy = false;
      this.inFlight = null;
      this.render();
    }
    if (closed) await this.runSummaries();
  }

  // ---- Rendering ----

  render(): void {
    const root = this.d.root;
    // Keep the drawer's scroll position across re-renders.
    const drawerScroll = root.querySelector('.world-body')?.scrollTop ?? 0;
    clear(root);
    if (this.screen === 'settings') root.append(this.renderSettings());
    else if (this.screen === 'create') root.append(this.renderCreate());
    else root.append(this.renderGame());
    const body = root.querySelector('.world-body');
    if (body) body.scrollTop = drawerScroll;
  }

  private renderSettings(): HTMLElement {
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
      this.screen = this.session ? 'game' : 'create';
      this.render();
    };

    return el('div', {}, [
      el('h1', { text: 'Settings' }),
      el('div', { class: 'panel' }, [
        el('div', { class: 'field' }, [el('label', { text: 'Gemini API key' }), keyInput]),
        el('p', {
          class: 'hint',
          text: 'Stored only in this browser (localStorage), sent only to Google in a request header, never saved in game files. Get a key at aistudio.google.com.',
        }),
        el('h2', { text: 'Models' }),
        el('datalist', { attrs: { id: 'known-models' } }, KNOWN_MODELS.map((m) => el('option', { attrs: { value: m } }))),
        ...modelFields.map((f) => f.node),
        el('h2', { text: 'Free-tier limits (per model)' }),
        el('p', {
          class: 'hint',
          text: 'Defaults are unverified third-party figures. Check your real limits on the AI Studio rate-limit page and enter them here. Daily counts reset at midnight Pacific time.',
        }),
        el('table', { class: 'limits' }, [
          el('tr', {}, [el('th', { text: 'Model' }), el('th', { text: 'RPM' }), el('th', { text: 'Input TPM' }), el('th', { text: 'RPD' })]),
          ...limitRows.map((r) => r.node),
        ]),
        el('h2', { text: 'Behavior' }),
        el('label', { class: 'field' }, [
          el('span', {}, [autoRetry, ' Retry once automatically when a reply is cut off (uses one extra request)']),
        ]),
        err,
        el('h2', { text: 'Campaign file' }),
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
        this.settingsNote ? el('p', { class: 'hint', text: this.settingsNote }) : null,
        el('div', { class: 'row' }, [
          el('button', { text: 'Save', on: { click: save } }),
          this.settings.apiKey ? el('button', { class: 'secondary', text: 'Cancel', on: { click: () => this.go(this.session ? 'game' : 'create') } }) : null,
        ]),
      ]),
    ]);
  }

  private renderCreate(): HTMLElement {
    const name = input({ maxlength: '60', placeholder: 'Character name' });
    const dateInputs = (d: CalendarDate) => {
      const year = input({ type: 'number', min: '0', value: String(Math.abs(d.year)) });
      const era = el('select', {}, [el('option', { text: 'BBY', attrs: { value: 'BBY' } }), el('option', { text: 'ABY', attrs: { value: 'ABY' } })]);
      era.value = d.year > 0 ? 'ABY' : 'BBY';
      const month = input({ type: 'number', min: '1', max: '12', value: String(d.month) });
      const day = input({ type: 'number', min: '1', max: '31', value: String(d.day) });
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
      return { fields, read, all: [year, era, month, day] };
    };
    const start = DEFAULT_START.date;
    const birth = dateInputs({ year: start.year - 14, month: 1, day: 1 });
    const startD = dateInputs(start);
    const time = input({ type: 'time', value: formatClock(DEFAULT_START.second) });
    const premise = el('textarea', { attrs: { placeholder: 'Optional: who you are or how the story should begin (e.g. a Padawan at the Coruscant Temple).' } });
    const ageLine = el('p', { class: 'hint' });
    const err = el('div', { class: 'error' });

    const readTime = (): number => {
      const [h, m] = time.value.split(':').map(Number);
      return (h ?? 0) * 3600 + (m ?? 0) * 60;
    };
    const updateAge = (): void => {
      const b = birth.read();
      const s = startD.read();
      ageLine.textContent = isValidDate(b) && isValidDate(s) ? `Age at the start: ${ageInYears(absDayFromDate(b), absDayFromDate(s))}` : '';
    };
    for (const i of [...birth.all, ...startD.all]) i.addEventListener('input', updateAge);
    updateAge();

    const begin = async (): Promise<void> => {
      const req = { name: name.value, birthDate: birth.read(), startDate: startD.read(), startSecond: readTime(), premise: premise.value };
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
      this.screen = 'game';
      await this.runTurn({ kind: 'opening', premise: premise.value.trim() });
    };

    return el('div', {}, [
      el('h1', { text: 'New character' }),
      this.loadError ? el('p', { class: 'error', text: this.loadError }) : null,
      el('div', { class: 'panel' }, [
        el('div', { class: 'field' }, [el('label', { text: 'Name' }), name]),
        el('h2', { text: 'Birth date' }),
        birth.fields,
        el('h2', { text: 'Start date and time' }),
        el('p', { class: 'hint', text: 'Default: 3,661 BBY, the Great Galactic War. 12 months; months 1-8 have 31 days, 9-12 have 30.' }),
        startD.fields,
        el('div', { class: 'field' }, [el('label', { text: 'Time of day' }), time]),
        ageLine,
        el('h2', { text: 'Premise' }),
        premise,
        err,
        el('div', { class: 'row' }, [
          el('button', { text: 'Begin', on: { click: () => void begin() } }),
          el('button', { class: 'secondary', text: 'Settings', on: { click: () => this.go('settings') } }),
          this.session ? el('button', { class: 'secondary', text: 'Back to game', on: { click: () => this.go('game') } }) : null,
        ]),
      ]),
    ]);
  }

  private renderGame(): HTMLElement {
    const session = this.session;
    if (!session) return el('div', {}, [el('p', { text: 'No campaign.' })]);
    const state = session.state;
    const last = session.history[session.history.length - 1];

    const feed = el(
      'div',
      { class: 'feed' },
      session.history.map((r) => this.renderTurn(r)),
    );

    // The opening never committed (a reload mid-call): rerun it with the stored premise, or discard.
    const openingBox =
      openingPending(session) && !this.busy && !this.failed
        ? el('div', { class: 'banner' }, [
            el('span', { text: 'The opening scene was not written (the page was reloaded before it finished).' }),
            el('div', { class: 'row' }, [
              el('button', { text: 'Write the opening', on: { click: () => void this.runTurn({ kind: 'opening', premise: session.campaign.premise ?? '' }) } }),
              el('button', { class: 'secondary', text: 'Discard and create a new character', on: { click: () => this.go('create') } }),
            ]),
          ])
        : null;

    const choices =
      last && !this.busy && !this.failed
        ? el(
            'div',
            { class: 'choices' },
            last.choices.map((c) => el('button', { text: c.label, on: { click: () => void this.runTurn({ kind: 'choice', choice: c }) } })),
          )
        : null;

    const text = el('textarea', { attrs: { placeholder: 'What do you do?', rows: '2' } });
    const send = (): void => {
      const t = text.value.trim();
      if (t) void this.runTurn({ kind: 'typed', text: t });
    };
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
    const sendBtn = el('button', { text: 'Send', on: { click: send } });
    if (this.busy) {
      text.disabled = true;
      sendBtn.disabled = true;
    }

    const banner = this.failed
      ? el('div', { class: 'banner' }, [
          el('span', { text: `${this.failed.stage === 'intent' ? 'Could not read your action' : this.failed.stage === 'commit' ? 'Could not save the turn' : 'The GM reply failed'}: ${this.failed.message}` }),
          el('div', { class: 'row' }, [
            el('button', {
              text: 'Retry',
              on: { click: () => this.failed && void this.runTurn(this.failed.input, this.failed.pending) },
            }),
            el('button', { class: 'secondary', text: 'Dismiss', on: { click: () => ((this.failed = null), this.render()) } }),
          ]),
        ])
      : null;

    const view = el('div', {}, [
      this.renderHeader(state),
      feed,
      this.busy && this.inFlight && this.inFlight.kind !== 'opening' ? el('div', { class: 'feed' }, [el('div', { class: 'player', text: describeInput(this.inFlight) })]) : null,
      this.busy ? el('div', { class: 'busy', text: this.summarizing ? 'A chapter closed. Writing its summary...' : 'The GM is thinking...' }) : null,
      !this.busy && this.failed && this.failed.input.kind !== 'opening' ? el('div', { class: 'feed' }, [el('div', { class: 'player', text: describeInput(this.failed.input) })]) : null,
      banner,
      openingBox,
      choices,
      el('div', { class: 'composer' }, [text, sendBtn]),
      this.panelOpen
        ? renderWorldPanel({
            state,
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
          })
        : null,
    ]);
    // Keep the newest turn in view.
    queueMicrotask(() => window.scrollTo({ top: document.body.scrollHeight }));
    return view;
  }

  private renderHeader(state: GameState): HTMLElement {
    const now = selectNow(state);
    const narrativeModel = primaryModel(this.settings, 'narrative');
    const ms = this.d.now();
    const models = [...new Set([...KNOWN_MODELS, narrativeModel])];
    const remainingLabel = (m: string): string => {
      const s = summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms);
      const count = s.remainingToday !== null ? `${s.remainingToday} left today` : `${s.requestsToday} used today`;
      return `${m}${m === FALLBACK_NARRATIVE_MODEL ? ' · fallback' : ''} (${count})`;
    };
    const picker = el(
      'select',
      {
        attrs: { 'aria-label': 'Story model' },
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

    const inUse = (['narrative', 'intent', 'summary', 'ooc'] as CallType[]).map((ct) => this.router.choose(ct).model);
    const warnings = [...new Set(inUse)].flatMap((m) => summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms).warnings);
    const fallbackNotices = this.router.notices();
    const intentModel = this.router.choose('intent').model;
    const intentUse = summarizeUsage(this.usage, intentModel, this.settings.limits[intentModel] ?? {}, ms);

    const newBtn = this.confirmNew
      ? el('span', {}, [
          el('button', { class: 'danger', text: 'Start over?', on: { click: () => ((this.confirmNew = false), this.go('create')) } }),
          ' ',
          el('button', { class: 'secondary', text: 'Keep playing', on: { click: () => ((this.confirmNew = false), this.render()) } }),
        ])
      : el('button', { class: 'secondary', text: 'New campaign', on: { click: () => ((this.confirmNew = true), this.render()) } });

    return el('header', { class: 'game' }, [
      el('div', { class: 'bar' }, [
        el('div', { class: 'when' }, [
          el('strong', { text: `${formatClock(now.second)} ${timeOfDayLabel(now.second)}` }),
          ` · ${formatDate(now.day)}${selectCurrentLocation(state) ? ` · ${selectCurrentLocation(state)!.name}` : ''} · ${selectCharacterName(state)}, ${selectAge(state)} · turn ${state.meta.turn} · ${selectPacingLevel(state)}`,
        ]),
      ]),
      el('div', { class: 'bar' }, [
        el('label', {}, ['Story model: ', picker]),
        el('span', { class: 'hint', text: `Intent: ${intentUse.model} (${intentUse.requestsToday} today)` }),
        el('span', {}, [
          el('button', {
            class: 'secondary',
            text: `People & World${selectOpenReview(state).length ? ` (${selectOpenReview(state).length} to review)` : ''}`,
            attrs: { 'aria-expanded': String(this.panelOpen) },
            on: { click: () => ((this.panelOpen = !this.panelOpen), this.render()) },
          }),
          ' ',
          el('button', { class: 'secondary', text: 'Settings', on: { click: () => this.go('settings') } }),
          ' ',
          newBtn,
        ]),
      ]),
      fallbackNotices.length ? el('div', { class: 'fallback', text: fallbackNotices.join(' · ') }) : null,
      warnings.length ? el('div', { class: 'warnings', text: warnings.join(' · ') }) : null,
    ]);
  }

  private renderTurn(r: TurnRecord): HTMLElement {
    const log = [
      ...r.draft.report.map((x) => `engine: ${x}`),
      ...r.applied.map((a) => `applied ${a.event.type}${a.notes.length ? ` (${a.notes.join('; ')})` : ''}`),
      ...[...r.draft.rejected, ...r.rejected].map((x) => `rejected: ${x.reason}`),
      ...r.calls.map((c) => `call ${c.callType} ${c.model}: ${c.outcome}${c.usage ? `, ${c.usage.inputTokens} in / ${c.usage.outputTokens} out` : ''}`),
    ];
    return el('div', { class: 'turn' }, [
      r.input.kind === 'opening' && !r.input.premise ? null : el('div', { class: 'player', text: describeInput(r.input) }),
      ...r.draft.checks.map((c) => this.renderRoll(c)),
      ...r.draft.notices.map((n) => el('div', { class: 'notice', text: n })),
      ...paragraphs(r.narrative),
      log.length ? el('details', { class: 'log' }, [el('summary', { text: 'Engine log' }), el('pre', { text: log.join('\n') })]) : null,
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

  private go(screen: Screen): void {
    this.screen = screen;
    this.render();
  }
}
