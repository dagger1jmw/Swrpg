// UI: rendering and player actions only (architecture §1). Reads state through selectors and
// calls the turn pipeline; no game rules here.
import { KNOWN_MODELS } from '../ai/models.config';
import type { CallType, ModelProvider, Usage } from '../ai/provider';
import {
  loadSettings,
  loadUsage,
  saveSettings,
  saveUsage,
  validateApiKey,
  withModel,
  type KeyValueStore,
  type Settings,
} from '../ai/settings';
import { recordRequest, summarizeUsage, type UsageLog } from '../ai/usage';
import { ageInYears, absDayFromDate, formatClock, formatDate, isValidDate, timeOfDayLabel, type CalendarDate } from '../engine/calendar';
import type { CheckCard } from '../engine/rolls';
import { selectAge, selectCharacterName } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectPacingLevel } from '../features/pacing/selectors';
import type { Storage } from '../persist/storage';
import type { GameState } from '../state/gameState';
import type { Registry } from '../state/types';
import { createCampaign, DEFAULT_START, resumeCampaign, validateNewCampaign } from '../turn/campaign';
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
  private failed: FailedTurn | null = null;
  private loadError: string | null = null;
  private confirmNew = false;
  private readonly provider: ModelProvider;

  constructor(private readonly d: AppDeps) {
    this.settings = loadSettings(d.kv);
    this.usage = loadUsage(d.kv);
    this.provider = d.makeProvider(() => this.settings.apiKey);
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
    };
  }

  private async runTurn(turnInput: TurnInput, pending?: PendingTurn): Promise<void> {
    if (!this.session || this.busy) return;
    this.busy = true;
    this.failed = null;
    this.render();
    const deps = this.turnDeps();
    try {
      const p = pending ?? (await prepareTurn(deps, this.session, turnInput));
      const { session } = await narrateTurn(deps, this.session, p);
      this.session = session;
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
      this.render();
    }
  }

  // ---- Rendering ----

  render(): void {
    const root = this.d.root;
    clear(root);
    if (this.screen === 'settings') root.append(this.renderSettings());
    else if (this.screen === 'create') root.append(this.renderCreate());
    else root.append(this.renderGame());
  }

  private renderSettings(): HTMLElement {
    const s = this.settings;
    const keyInput = input({ type: 'password', autocomplete: 'off', placeholder: 'AIza...', value: s.apiKey ?? '' });
    const err = el('div', { class: 'error' });

    const modelFields = (['narrative', 'intent', 'summary', 'ooc'] as CallType[]).map((ct) => {
      const inp = input({ list: 'known-models', value: s.models[ct] });
      return { ct, inp, node: el('div', { class: 'field' }, [el('label', { text: `${ct} model` }), inp]) };
    });

    const models = [...new Set([...KNOWN_MODELS, ...Object.values(s.models), ...Object.keys(s.limits)])];
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
      for (const f of modelFields) if (f.inp.value.trim()) next = withModel(next, f.ct, f.inp.value.trim());
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
      const req = { name: name.value, birthDate: birth.read(), startDate: startD.read(), startSecond: readTime() };
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
      this.busy ? el('div', { class: 'busy', text: 'The GM is thinking...' }) : null,
      banner,
      choices,
      el('div', { class: 'composer' }, [text, sendBtn]),
    ]);
    // Keep the newest turn in view.
    queueMicrotask(() => window.scrollTo({ top: document.body.scrollHeight }));
    return view;
  }

  private renderHeader(state: GameState): HTMLElement {
    const now = selectNow(state);
    const narrativeModel = this.settings.models.narrative;
    const ms = this.d.now();
    const models = [...new Set([...KNOWN_MODELS, narrativeModel])];
    const remainingLabel = (m: string): string => {
      const s = summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms);
      return s.remainingToday !== null ? `${m} (${s.remainingToday} left today)` : `${m} (${s.requestsToday} used today)`;
    };
    const picker = el(
      'select',
      {
        attrs: { 'aria-label': 'Story model' },
        on: {
          change: (e) => {
            this.settings = withModel(this.settings, 'narrative', (e.target as HTMLSelectElement).value);
            saveSettings(this.d.kv, this.settings);
            this.render();
          },
        },
      },
      models.map((m) => el('option', { text: remainingLabel(m), attrs: { value: m } })),
    );
    picker.value = narrativeModel;

    const usedModels = [...new Set(Object.values(this.settings.models))];
    const warnings = usedModels.flatMap((m) => summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms).warnings);
    const intentUse = summarizeUsage(this.usage, this.settings.models.intent, this.settings.limits[this.settings.models.intent] ?? {}, ms);

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
          ` · ${formatDate(now.day)} · ${selectCharacterName(state)}, ${selectAge(state)} · turn ${state.meta.turn} · ${selectPacingLevel(state)}`,
        ]),
      ]),
      el('div', { class: 'bar' }, [
        el('label', {}, ['Story model: ', picker]),
        el('span', { class: 'hint', text: `Intent: ${intentUse.model} (${intentUse.requestsToday} today)` }),
        el('span', {}, [el('button', { class: 'secondary', text: 'Settings', on: { click: () => this.go('settings') } }), ' ', newBtn]),
      ]),
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
