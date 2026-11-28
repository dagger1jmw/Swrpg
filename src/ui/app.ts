// UI: rendering and player actions only (architecture §1). Reads state through selectors and
// calls the turn pipeline; no game rules here. Layout (D-100): one fixed app shell (top bar, main
// column with feed / choices / input, side panel), settings and campaigns in a modal; nothing
// scrolls the page, each region scrolls inside its own box.
import { noticeShown, type Notice } from './notices';
import { DEBUG_REQUESTS_KEPT } from '../ai/context.config';
import { createModelRouter, type ModelRouter, type QuotaState } from '../ai/fallback';
import { FALLBACK_NARRATIVE_MODEL, FLASH_ROUTING, KNOWN_MODELS } from '../ai/models.config';
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
import { backupDue, exportFileName, readBackup, writeBackup } from '../persist/backup';
import { firstRunNote, storageLine, UPDATE_TEXT, updateReducer, type UpdateState } from './pwa';

/** The first-run note in the installed app was read (m9-release B4). */
const FIRST_RUN_KEY = 'swrpg.firstRunNoteSeen';
import type { Storage } from '../persist/storage';
import { applyEvents } from '../state/applyEvents';
import type { GameState } from '../state/gameState';
import type { GameEvent, Registry } from '../state/types';
import { START_OPTION_BY_ID, startOptionsFor, startPremiseAt, startThreadsAt } from '../data/startOptions';
import { createCampaign, creationQuizInput, creationTraitContext, DEFAULT_START_AGE, DEFAULT_START_DATE, DEFAULT_START_SECOND, loadEarlierSave, openingPending, resumeCampaign, validateNewCampaign, type NewCampaignInput } from '../turn/campaign';
import type { SaveMeta } from '../persist/saveHistory';
import { EarlierSaves } from './earlierSaves';
import { devFlag, TEST_START_ARCHETYPES, testStartInput, testStartRankOptions, type TestStartArchetype, type TestStartRank } from '../turn/testStart';
import { ARCHETYPE_BY_ID } from '../data/archetypes';
import { SPECIES } from '../data/species';
import { narrateTurn, prepareTurn, summarizeChapters, TurnError, type DebugRequest, type PendingTurn, type Session, type SummaryOutcome, type TurnDeps } from '../turn/pipeline';
import { describeInput, type TurnInput, type TurnRecord } from '../turn/record';
import type { TrainingOutcome } from '../turn/resolve';
import { SKILL_BY_ID } from '../data/skills';
import { creationForm } from './creationForm';
import { quizScreens, traitsStep } from './traitsUi';
import { quizImplies, quizPlan, type TraitContext } from '../features/traits/selectors';
import { selectQuizInput, selectQuizPlan, selectTraitContext } from '../features/traits/selectors';
import { TRAIT_BY_ID } from '../data/traits';
import { clear, el, input, paragraphs } from './dom';
import { renderSidePanel, type PanelTab } from './sidePanel';
import { renderCombatDraft, renderDuelPanel } from './duelPanel';
import { renderBattlePanel } from './battlePanel';
import { renderGroundPanel, type GroundPanelProps } from './groundPanel';
import { fightCalls, fightView } from '../turn/fightChoices';
import { commitDevCommand, COMMANDS_NEED_DEV, slashRoute } from '../turn/devCommands';
import { withSimulatedOverload, type SimulatedOverload } from '../ai/simulateOverload';
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
  /** The browser around the app (m9-release B; main.ts): absent in tests, where none of it applies. */
  platform?: Platform;
}

/** What the browser tells and does for the installed app (m9-release B2-B4). */
export interface Platform {
  /** Running as the Home Screen app. */
  standalone: boolean;
  /** Whether storage is persistent, and the bytes used of the quota (navigator.storage); nulls when not reported. */
  storageInfo(): Promise<{ persisted: boolean | null; usage: number | null; quota: number | null }>;
  /** The share sheet with a file (the Web Share API): shared, cancelled by the player, or not possible here. */
  shareFile(file: File, title: string): Promise<'shared' | 'cancelled' | 'unsupported'>;
}

type Modal = 'settings' | 'campaign' | 'routine' | 'quiz';

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
  /** The overload retry note (D-240), shown beside the busy label. */
  private retryNote: string | null = null;
  /** The model call the turn waits on and since when (m9-release A1), and the timer that counts its seconds. */
  private callWait: { text: string; since: number } | null = null;
  private waitTimer: ReturnType<typeof setInterval> | null = null;
  private failed: FailedTurn | null = null;
  private loadError: string | null = null;
  private readonly provider: SimulatedOverload;
  private quota: QuotaState;
  private readonly router: ModelRouter;
  private tokenRatios: TokenRatios;
  private modal: Modal | null = null;
  /** The in-game formative quiz's screens while open (they keep their own state between renders). */
  private quizView: HTMLElement | null = null;
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
  /** The ship battle menu's picks for the next turn, by group (m8-ship-battles, D-517). */
  private battlePicks: Record<string, number> = {};
  /** The ground plan being set on the map in a planning scene (m8-ground, D-522), until the battle begins. */
  private groundDraft: GroundPanelProps['draft'] = null;
  /** The player pressed "Take the controls" while a played-out turn was in flight (D-517). */
  private takeBack = false;
  /** The last dev command's refusal or failure (D-180), shown in the status line. */
  /** A status-line notice, tied to the campaign it was raised in (m8-audit A8). */
  private devNote: Notice | null = null;
  /**
   * The state the code already decided for the turn in flight (m8-fixes E1): shown at once (the battle panel, the header, the side
   * panel) while the narration is pending, with the code's own lines. Cleared when the turn commits or fails.
   */
  private preview: { state: GameState; lines: readonly string[] } | null = null;
  /** Full request texts, this session only (D-87). */
  private debugRequests: DebugRequest[] = [];
  private summaryLog: SummaryOutcome[] = [];
  private summarizing = false;
  private settingsNote: string | null = null;
  /** The installed app (m9-release B): the update banner, the storage line, the backup reminder put off this session. */
  private update: UpdateState = { kind: 'current' };
  private applyUpdate: (() => void) | null = null;
  private storageText: string | null = null;
  private backupLater = false;
  /** The current campaign's earlier saves (D-214), loaded when the campaign menu opens. */
  private readonly saves = new EarlierSaves((id) => this.d.storage.listSaves(id), () => this.render());
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
    // Wrapped for the dev /simulate 503 (D-250); it passes every request through until armed.
    this.provider = withSimulatedOverload(d.makeProvider(() => this.settings.apiKey));
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
      // opt-1 D: Flash for the big moments, unless Settings turned it off.
      getRouting: () => ({ on: this.settings.flashRouting !== false, model: this.settings.premiumModel ?? FLASH_ROUTING.model }),
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
      recordCall: (model: string, usage: Usage | null, outcome?: string) => {
        this.usage = recordRequest(this.usage, model, usage?.inputTokens ?? 0, this.d.now(), { truncated: outcome === 'truncated', ...(usage?.cachedTokens ? { cachedTokens: usage.cachedTokens } : {}) });
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
      // D-240: "Gemini is busy, retrying…" in the status line while a call waits for its retry.
      onStatus: (text) => {
        this.retryNote = text;
        this.render();
      },
      // m9-release A1: what the turn waits on, with the seconds counted in the status line (a slow model is visible, not a freeze).
      onCall: (c) => {
        this.callWait = { text: `${c.callType === 'intent' ? 'reading your action' : c.callType === 'narrative' ? 'the narration' : c.callType} (${c.model})`, since: this.d.now() };
        this.render();
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
      this.retryNote = null;
      this.summarizing = false;
      this.render();
    }
  }

  /** Player events (pins, review resolutions): applied through applyEvents and committed. */
  /** A notice for the campaign now open (m8-audit A8). */
  private notice(text: string): Notice {
    return { text, campaignId: this.session?.campaign.campaignId ?? null };
  }

  /** A dev sandbox command (D-180): test campaigns only; recorded as a "[DEV]" turn, no AI call. */
  private async runDev(text: string): Promise<void> {
    if (!this.session || this.busy) return;
    if (!selectIsTestCharacter(this.session.state)) {
      this.devNote = this.notice('Dev commands work only in a test campaign (the dev test start). Nothing was sent.');
      this.render();
      return;
    }
    try {
      const r = await commitDevCommand({ registry: this.d.registry, storage: this.d.storage, wallClock: () => ({ iso: new Date(this.d.now()).toISOString() }) }, this.session, text);
      this.session = r.session;
      // /simulate 503 n (D-250): the next n requests of this page fail as 503.
      if (r.simulate503 !== undefined) this.provider.arm(r.simulate503);
      // /simulate slow n (m9-tune C): the next n requests stall until their time limit.
      if (r.simulateSlow !== undefined) this.provider.armSlow(r.simulateSlow);
      this.draft = '';
      this.devNote = null;
      this.feedStick = true;
    } catch (e) {
      this.devNote = this.notice(`Dev command failed: ${e instanceof Error ? e.message : String(e)}`);
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
    const name = exportFileName(file.campaign.name, file.transcript.length);
    const json = JSON.stringify(file);
    // m9-release B3: on the iPad the share sheet, so the file goes straight to Files or iCloud Drive; elsewhere a download.
    const shared = this.d.platform ? await this.d.platform.shareFile(new File([json], name, { type: 'application/json' }), file.campaign.name) : 'unsupported';
    if (shared === 'cancelled') {
      this.settingsNote = 'Export cancelled.';
      this.render();
      return;
    }
    if (shared === 'unsupported') {
      const blob = new Blob([json], { type: 'application/json' });
      const a = el('a', { attrs: { href: URL.createObjectURL(blob), download: name } });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    writeBackup(this.d.kv, file.campaign.campaignId, { at: this.d.now(), chapters: this.session?.state.memory.chapters.length ?? 0 });
    this.backupLater = false;
    this.settingsNote = `Exported ${file.campaign.name} (${file.transcript.length} turns)${shared === 'shared' ? ' through the share sheet' : ''}.`;
    this.render();
  }

  /** A new build is installed and waiting (m9-release B1): the banner offers the reload; `apply` lets it take over. */
  setUpdateReady(apply: () => void): void {
    this.applyUpdate = apply;
    this.update = updateReducer(this.update, { type: 'waiting' });
    this.render();
  }

  /** The reload into a waiting build (m9-release B1). */
  private reloadIntoUpdate(): void {
    this.update = updateReducer(this.update, { type: 'apply' });
    this.render();
    this.applyUpdate?.();
  }

  /** The storage line for Settings (m9-release B2), asked of the browser when Settings opens. */
  private async refreshStorage(): Promise<void> {
    if (!this.d.platform) return;
    try {
      this.storageText = storageLine(await this.d.platform.storageInfo());
    } catch {
      this.storageText = null;
    }
    if (this.modal === 'settings') this.render();
  }

  /** Why a backup is due (m9-release B3), or null: chapters or days since the last export. */
  private backupReminder(): string | null {
    const s = this.session;
    if (!s || this.backupLater) return null;
    const created = Date.parse(s.campaign.createdAt);
    return backupDue({ now: this.d.now(), chapters: s.state.memory.chapters.length, last: readBackup(this.d.kv, s.campaign.campaignId), createdAt: Number.isFinite(created) ? created : null });
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

  /** The busy line (m9-release A1): what the turn does, the call it waits on with the seconds waited, and a retry note. */
  private busyLabel(base: string): string {
    const w = this.callWait;
    const secs = w ? Math.floor((this.d.now() - w.since) / 1000) : 0;
    const waiting = w && secs >= 3 ? ` · waiting for ${w.text}, ${secs} s` : '';
    return `${base}${waiting}${this.retryNote ? ` · ${this.retryNote}` : ''}`;
  }

  /** Counts the waited seconds in the status line while a turn is busy, without redrawing the page (m9-release A1). */
  private startWaitTimer(): void {
    this.stopWaitTimer();
    if (typeof setInterval !== 'function') return;
    this.waitTimer = setInterval(() => {
      const node = typeof document !== 'undefined' ? document.querySelector('.status.busy .status-text') : null;
      if (!node || !this.callWait) return;
      const text = node.textContent ?? '';
      const base = text.split(' · ')[0] ?? text;
      node.textContent = this.busyLabel(base);
    }, 1000);
  }

  private stopWaitTimer(): void {
    if (this.waitTimer !== null) clearInterval(this.waitTimer);
    this.waitTimer = null;
    this.callWait = null;
  }

  private async runTurn(turnInput: TurnInput, pending?: PendingTurn): Promise<void> {
    if (!this.session || this.busy) return;
    this.busy = true;
    this.startWaitTimer();
    this.inFlight = turnInput;
    this.failed = null;
    this.feedStick = true;
    if (turnInput.kind === 'typed') this.draft = '';
    if (turnInput.kind === 'battle') this.battlePicks = {};
    this.render();
    const deps = this.turnDeps();
    let closed = false;
    try {
      const p = pending ?? (await prepareTurn(deps, this.session, turnInput));
      if (p.resolution.draft.jump) this.startPlayback(p.resolution.draft.jump.report);
      // Show what the code decided before the narration arrives (m8-fixes E1).
      this.preview = { state: p.resolution.state, lines: p.resolution.draft.battle?.lines ?? [] };
      this.render();
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
      this.stopWaitTimer();
      this.preview = null;
      this.busy = false;
      this.retryNote = null;
      this.inFlight = null;
      this.render();
    }
    if (closed) await this.runSummaries();
    // "Let it play out" (D-517): the code plays on, a chunk at a time, until the player takes the controls back.
    if (this.takeBack && this.session?.state.battles.active?.auto) {
      this.takeBack = false;
      void this.runTurn({ kind: 'battle', label: 'Take the controls', auto: false });
      return;
    }
    // A ground battle the same way (m8-ground, D-522).
    if (this.takeBack && this.session?.state.battles.ground?.auto) {
      this.takeBack = false;
      void this.runTurn({ kind: 'battle', label: 'Take control', ground: { act: 'takeBack' } });
      return;
    }
    this.takeBack = false;
    if (!this.failed && this.session?.state.battles.active?.auto && !this.session.state.combat.active) {
      setTimeout(() => {
        if (this.session?.state.battles.active?.auto && !this.busy && !this.takeBack && !this.session.state.combat.active) void this.runTurn({ kind: 'battle', label: 'Let it play out', auto: true });
      }, 900);
    }
    if (!this.failed && this.session?.state.battles.ground?.auto && !this.session.state.battles.ground.end && !this.session.state.combat.active) {
      setTimeout(() => {
        if (this.session?.state.battles.ground?.auto && !this.busy && !this.takeBack && !this.session.state.combat.active) void this.runTurn({ kind: 'battle', label: 'Let it play out', ground: { act: 'auto' } });
      }, 900);
    }
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
      root.append(this.renderPanel(this.preview ? { ...this.session, state: this.preview.state } : this.session));
    }
    if (this.modal) root.append(this.renderModal(this.modal));
    // m9-release B1: a waiting build's notice sits above everything (a modal included), so the reload is always at hand.
    if (this.update.kind === 'ready' || this.update.kind === 'applying') {
      root.append(el('div', { class: 'update-bar', attrs: { role: 'status' } }, [el('span', { text: UPDATE_TEXT }), el('button', { class: 'small', text: 'Reload', on: { click: () => this.reloadIntoUpdate() } })]));
    }
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
    // The save list is read again each time the campaign menu opens (pass 5 issue 3).
    if (m === 'campaign') this.saves.invalidate();
    this.modal = m;
    this.settingsNote = null;
    this.render();
  }

  private renderTopBar(): HTMLElement {
    const state = this.preview?.state ?? this.session?.state;
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
    // Replies cut short and input served from Gemini's cache today (opt-1 C, E), per model, when there are any.
    const counts = allModels.flatMap((m) => {
      const u = summarizeUsage(this.usage, m, this.settings.limits[m] ?? {}, ms);
      return u.truncatedToday || u.cachedTokensToday ? [`${m}: ${u.truncatedToday} cut short, ${u.cachedTokensToday.toLocaleString('en-US')} input tokens from cache today`] : [];
    });
    const meter = el('span', { class: `tb-meter${warnings.length ? ' warn' : ''}`, attrs: { title: [`${inUse}: ${meterText} requests today`, ...counts, ...warnings].join('\n') } }, [
      warnings.length ? el('span', { class: 'badge', text: '!' }) : null,
      meterText,
    ]);

    const left: (HTMLElement | null)[] = state
      ? (() => {
          const now = selectNow(state);
          const loc = selectCurrentLocation(state);
          return [
            el('strong', { class: 'tb-time', text: `${formatClock(now.second)} ${timeOfDayLabel(now.second)}` }),
            // The weekday in its own span, hidden at iPad width (D-242).
            // Date and place together: one line on a wide screen, two short lines at iPad width (pass 4 issue 14: both cut).
            el('span', { class: 'tb-where' }, [
              el('span', { class: 'tb-date', attrs: { title: formatDate(now.day) } }, [formatDate(now.day).replace(/ \(weekday \d+\)$/, ''), el('span', { class: 'tb-weekday', text: / \(weekday \d+\)$/.exec(formatDate(now.day))?.[0] ?? '' })]),
              loc ? el('span', { class: 'tb-opt tb-place', text: loc.name, attrs: { title: loc.name } }) : null,
            ]),
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
    // The turn in flight: the player's line, the jump playback, and (m8-fixes E1) the code's own lines with the narration pending.
    const pendingLine =
      this.busy && this.inFlight && this.inFlight.kind !== 'opening'
        ? el('div', { class: 'turn pending' }, [
            el('div', { class: 'player', text: describeInput(this.inFlight) }),
            this.playback ? renderJumpPlayback(this.playback.report, this.playback.shown) : null,
            ...(this.preview?.lines ?? []).map((l) => el('p', { class: 'battle-line', text: l })),
            this.preview ? el('p', { class: 'hint', text: 'The narration is on its way…' }) : null,
          ])
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
    // A youngling's formative quiz, due after the first long skip (M8 item 16): offered until taken or declined.
    if (session && !this.busy && !this.failed && !session.state.combat.active && selectQuizPlan(session.state)?.events.length) {
      choiceItems = [el('button', { class: 'choice', text: 'Formative years: play the skipped years as scenes', on: { click: () => this.openQuiz() } }), ...choiceItems];
    }
    // Death ends the campaign (D-154): an ending card instead of choices; loading an older save starts a new branch.
    if (session?.state.health.death) {
      const ending = el('section', { class: 'box choices ending' }, [
        el('div', { class: 'box-body' }, [
          el('strong', { text: `${session.state.character.name} is dead.` }),
          el('p', { class: 'hint', text: deathCardHint(session.state.health.death.cause) }),
          el('button', { class: 'choice secondary', text: 'Load an earlier save', on: { click: () => this.openModal('campaign') } }),
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
          setPush: (on) => void this.playerEvents([{ type: 'pushSet', on }]),
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
    // A ship battle (D-517): its panel holds the turn's choices; story choices wait until it is over. The panels show what the code
    // already decided while the narration is pending (m8-fixes E1).
    const shown = this.preview?.state ?? session?.state;
    const battle = session && shown && !shown.combat.active ? renderBattlePanel({ state: shown, busy: this.busy, act: (input) => void this.runTurn(input), picks: this.battlePicks, pick: (group, index) => ((index === null ? delete this.battlePicks[group] : (this.battlePicks[group] = index)), this.render()), takingControl: this.takeBack, takeControl: () => (this.busy ? ((this.takeBack = true), this.render()) : void this.runTurn({ kind: 'battle', label: 'Take the controls', auto: false })) }) : null;
    const ground = session && shown && !shown.combat.active ? renderGroundPanel({ state: shown, busy: this.busy, act: (input) => void this.runTurn(input), draft: this.groundDraft, setDraft: (d) => ((this.groundDraft = d), this.render()), takingControl: this.takeBack, takeControl: () => (this.busy ? ((this.takeBack = true), this.render()) : void this.runTurn({ kind: 'battle', label: 'Take control', ground: { act: 'takeBack' } })) }) : null;
    // While a battle is planned or runs, its panel holds the turn's choices (m8-audit A5): the story choices from before it are hidden
    // so the panel has the space (the planning panel took a third of the screen under them).
    if (shown?.battles.active || shown?.battles.ground || shown?.battles.planning) choiceItems = [];
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
    // The planning step has its own layout (m8-fixes F): the page's height, the story above it kept short.
    // A running battle (ship or ground) takes the column's space too (m8-audit A5), the story above kept short.
    const layout = shown?.battles.planning && !shown.battles.ground ? 'main planning' : battle || ground ? 'main battle-on' : 'main';
    return el('main', { class: layout }, [feed, battle, ground, duel, choices, this.renderInput()]);
  }

  private renderInput(): HTMLElement {
    const text = el('textarea', { attrs: { placeholder: this.session ? 'What do you do?' : 'Create a character to begin.', rows: '2', 'aria-label': 'Your action' } });
    text.value = this.draft;
    text.addEventListener('input', () => (this.draft = text.value));
    const send = (): void => {
      const t = text.value.trim();
      if (!t) return;
      // A slash command never goes to the AI (m8-fixes E3): in dev mode it runs in code (D-180; an unknown one gets the list);
      // outside dev mode it is refused on screen.
      const route = slashRoute(t, devFlag(globalThis.location?.search ?? ''));
      if (route === 'dev') void this.runDev(t);
      else if (route === 'refuse') {
        this.devNote = this.notice(COMMANDS_NEED_DEV);
        this.render();
      } else void this.runTurn({ kind: 'typed', text: t });
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
      const base = this.summarizing ? 'A chapter closed. Writing its summary…' : this.inFlight && this.inFlight.kind !== 'opening' ? `Resolving: ${describeInput(this.inFlight)}` : 'Writing the opening scene…';
      const label = this.busyLabel(base);
      status = el('div', { class: 'status busy' }, [el('span', { class: 'spinner', attrs: { 'aria-hidden': 'true' } }), el('span', { class: 'status-text', text: label, attrs: { title: label } })]);
    } else if (noticeShown(this.devNote, this.session?.campaign.campaignId ?? null)) {
      const note = noticeShown(this.devNote, this.session?.campaign.campaignId ?? null)!;
      status = el('div', { class: 'status error' }, [
        el('span', { class: 'status-text', text: note, attrs: { title: note } }),
        el('button', { class: 'small secondary', text: 'Dismiss', on: { click: () => ((this.devNote = null), this.render()) } }),
      ]);
    } else if (this.backupReminder()) {
      // m9-release B3: a reminder to export (every few chapters or every week), with the export at hand.
      const why = this.backupReminder()!;
      status = el('div', { class: 'status' }, [
        el('span', { class: 'status-text', text: `Back up your campaign: ${why}.`, attrs: { title: why } }),
        el('button', { class: 'small', text: 'Export', on: { click: () => void this.exportFile() } }),
        el('button', { class: 'small secondary', text: 'Later', on: { click: () => ((this.backupLater = true), this.render()) } }),
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

  /** The in-game formative quiz (a youngling's skipped years; M8 item 16). The code re-draws the scenes and decides. */
  private openQuiz(): void {
    if (!this.session) return;
    const s = this.session.state;
    const q = selectQuizInput(s);
    const plan = selectQuizPlan(s);
    if (!q || !plan) return;
    const created = (k: string[]): string => s.traits.held.find((h) => h.source === 'creation' && k.includes(TRAIT_BY_ID.get(h.id)?.kind ?? ''))?.id ?? '';
    const finish = async (events: GameEvent[]): Promise<void> => {
      this.quizView = null;
      this.modal = null;
      await this.playerEvents(events);
      this.render();
    };
    this.quizView = quizScreens(plan, {
      seed: q.seed,
      ctx: selectTraitContext(s),
      origin: q.origin,
      current: { temperament: created(['temperament']), scarOrTie: created(['scar', 'tie']) },
      onDone: (d) => void finish([{ type: 'formativeQuizTaken', answers: d.answers, ...(d.traits ? { traits: d.traits } : {}) }]),
      onDecline: () => void finish([{ type: 'formativeQuizTaken', answers: [] }]),
    });
    this.openModal('quiz');
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
    if (m === 'quiz') {
      const dialog = el('div', { class: 'box modal', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Formative years' } }, [
        el('div', { class: 'box-head' }, [el('strong', { text: 'Formative years' }), el('button', { class: 'icon', text: '×', attrs: { 'aria-label': 'Close' }, on: { click: close } })]),
        el('div', { class: 'box-body modal-body', attrs: { 'data-scroll': 'modal-quiz' } }, this.quizView ? [this.quizView] : []),
      ]);
      return el('div', { class: 'modal-layer', on: { click: (e) => e.target === e.currentTarget && close() } }, [dialog]);
    }
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
    // The installed app's first run (m9-release B4): its storage is its own, apart from Safari's.
    const firstRun = firstRunNote({ standalone: this.d.platform?.standalone === true, hasKey: !!s.apiKey, hasCampaign: this.session !== null, dismissed: this.d.kv.getItem(FIRST_RUN_KEY) === '1' });
    if (this.storageText === null) void this.refreshStorage();
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
    const narrateBattles = input({ type: 'checkbox' });
    narrateBattles.checked = s.narrateEveryBattleTurn === true;
    const homeDays = input({ type: 'checkbox' });
    homeDays.checked = s.stopOnHomeDays === true;
    const flashRouting = input({ type: 'checkbox' });
    flashRouting.checked = s.flashRouting !== false;
    const premiumModel = input({ type: 'text' });
    premiumModel.value = s.premiumModel ?? FLASH_ROUTING.model;
    premiumModel.setAttribute('aria-label', 'Model for the big moments');

    const save = (): void => {
      const k = validateApiKey(keyInput.value);
      if ('error' in k) {
        err.textContent = k.error;
        return;
      }
      let next: Settings = { ...this.settings, apiKey: k.key, autoRetry: autoRetry.checked, narrateEveryBattleTurn: narrateBattles.checked, stopOnHomeDays: homeDays.checked, flashRouting: flashRouting.checked, premiumModel: premiumModel.value.trim() || FLASH_ROUTING.model };
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

    const gotIt = (): void => {
      this.d.kv.setItem(FIRST_RUN_KEY, '1');
      this.render();
    };
    return [
      ...(firstRun ? [el('div', { class: 'notice' }, [el('p', { text: firstRun }), el('button', { class: 'small secondary', text: 'Got it', on: { click: gotIt } })])] : []),
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
      el('label', { class: 'check' }, [narrateBattles, ' Narrate every battle turn, ship or ground (otherwise only big moments and the end; each turn becomes a request)']),
      el('label', { class: 'check' }, [homeDays, ' Stop time skips on free days at home (the day after a mission always stops)']),
      el('label', { class: 'check' }, [flashRouting, ' Use the stronger model for the big moments only']),
      el('div', { class: 'field' }, [el('label', { text: 'Model for the big moments' }), premiumModel]),
      el('p', {
        class: 'hint',
        text: 'On: ordinary story turns use the narrative list with this model moved to the end (the last fallback). The game picks the big moments and they try this model first: a campaign opening, the end of a fight or a battle, a time skip, a major world event, and chapter summaries. When its daily limit is spent they fall back to the list. Off: every story turn uses the narrative list in order.',
      }),
      el('h3', { text: 'Storage' }),
      el('p', { class: 'hint', text: this.storageText ?? (this.d.platform ? 'Asking the browser about storage…' : 'Storage details are not available here.') }),
      el('p', { class: 'hint', text: 'Saves live in this browser (IndexedDB). On the iPad the Home Screen app and Safari each keep their own. Export a backup now and then (Campaign, Export campaign).' }),
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
        ...this.renderEarlierSaves(this.session),
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

  /** "Load an earlier save" (D-214): the kept saves with their date, place and turn; loading one starts a new branch. */
  private renderEarlierSaves(session: Session): HTMLElement[] {
    const list = this.saves.current(session.state.meta.campaignId).filter((m) => !(m.branchId === session.state.meta.branchId && m.turn === session.state.meta.turn));
    return [
      el('h3', { text: 'Load an earlier save' }),
      el('p', { class: 'hint', text: 'The last 10 saves and one for each of the last 7 in-game days. Playing on from one starts a new branch; nothing is deleted.' }),
      list.length
        ? el('div', { class: 'save-list' }, list.map((m) => el('button', { class: 'choice secondary', text: saveLabel(m), on: { click: () => void this.loadEarlier(m) } })))
        : el('p', { class: 'hint', text: 'No earlier saves yet.' }),
    ];
  }

  private async loadEarlier(m: SaveMeta): Promise<void> {
    const r = await loadEarlierSave(this.d.registry, this.d.storage, m.key, this.d.newId(), new Date(this.d.now()).toISOString());
    if ('error' in r) {
      this.settingsNote = `Could not load that save: ${r.error}`;
    } else {
      this.session = r.session;
      this.saves.invalidate();
      this.failed = null;
      this.feedStick = true;
      this.modal = null;
      this.settingsNote = null;
    }
    this.render();
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
        // A blank year is no date yet (issue 20: an empty birth year read as year 0 and warned "does not fit age -22.0").
        const y = year.value.trim() === '' ? Number.NaN : Math.trunc(Number(year.value));
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
    // The default start (D-400): the form opens on 3,661 BBY; the player may pick another era (its first year fills the
    // start date) or type any date.
    const eras = LORE_INDEX.chunks.filter((c) => c.id.endsWith(':overview')).sort((a, b) => a.fromYear - b.fromYear);
    const eraPick = el('select', {}, [
      el('option', { text: 'Choose an era...', attrs: { value: '' } }),
      ...eras.map((c) => el('option', { text: `${c.title.replace(/ \(overview\)$/, '')} (${formatYear(c.fromYear)} to ${formatYear(c.toYear)})`, attrs: { value: c.id } })),
    ]);
    const birth = dateInputs({ ...DEFAULT_START_DATE, year: DEFAULT_START_DATE.year - DEFAULT_START_AGE });
    const startD = dateInputs(DEFAULT_START_DATE);
    const defaultEra = eras.find((x) => x.fromYear <= DEFAULT_START_DATE.year && DEFAULT_START_DATE.year <= x.toYear);
    if (defaultEra) eraPick.value = defaultEra.id;
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
    // Starting traits and the formative quiz (M8 item 16).
    const traitCtx = (): TraitContext | null => creationTraitContext({ name: name.value, birthDate: birth.read(), startDate: startD.read(), startSecond: 0, creation: cf.read(), ...(startPick.value ? { start: { optionId: startPick.value, imperialBorn: imperialBorn.checked } } : {}) });
    const ts = traitsStep(traitCtx);
    const quizBox = el('div');
    let formative: NewCampaignInput['formative'] | undefined;
    // The quiz's accepted suggestions (m8-fixes G2): shown in the trait dropdowns; at Begin, a slot still holding the suggestion is
    // sent as the quiz's swap (so a tie links to the quiz's person), one the player changed again as their own choice.
    let accepted: { before: { temperament: string; scarOrTie: string }; after: { temperament?: string; scarOrTie?: string } } | null = null;
    // Start options (D-401 [2]): mechanical starts for the start date, or a free start. Choosing one fills the premise.
    const startPick = el('select', { attrs: { 'aria-label': 'Start' } });
    const imperialBorn = input({ type: 'checkbox' });
    const startNote = el('p', { class: 'hint' });
    let lastAutoPremise = '';
    const fillStarts = (): void => {
      const s = startD.read();
      const opts = isValidDate(s) ? startOptionsFor(s.year) : [];
      const keep = startPick.value;
      startPick.replaceChildren(el('option', { text: 'Free start (no preset)', attrs: { value: '' } }), ...opts.map((o) => el('option', { text: o.title, attrs: { value: o.id } })));
      startPick.value = opts.some((o) => o.id === keep) ? keep : '';
      describeStart();
    };
    const describeStart = (): void => {
      const o = START_OPTION_BY_ID.get(startPick.value);
      const sd = startD.read();
      const year = isValidDate(sd) ? sd.year : DEFAULT_START_DATE.year;
      const threads = o ? startThreadsAt(o, -year) : [];
      startNote.textContent = o ? `${o.places.map((p) => p.name).join(', ')}. Path: ${o.paths.join(' or ')}${o.ranks.length ? `; rank: ${o.ranks.join(', ')}` : ''}${o.archetypes.length ? `; archetype: ${o.archetypes.join(', ')}` : ''}.${threads.length ? ` Opening threads: ${threads.map((x) => x.title).join('; ')}.` : ''}` : '';
      if (o && (!premise.value.trim() || premise.value === lastAutoPremise)) {
        premise.value = startPremiseAt(o, year);
        lastAutoPremise = premise.value;
      }
    };
    startPick.addEventListener('change', describeStart);

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
      fillStarts();
      ts.refresh();
      formative = undefined;
      accepted = null;
    };
    for (const i of [...birth.all, ...startD.all, name]) i.addEventListener('input', updateAge);
    updateAge();

    const beginBtn = el('button', { text: this.session ? 'Begin (replaces the current campaign)' : 'Begin', on: { click: () => void begin() } });
    const begin = async (): Promise<void> => {
      const chosen = ts.read();
      let traits = chosen;
      let quizTraits: { temperament?: string; scarOrTie?: string } | undefined;
      if (chosen && accepted && formative && formative !== 'declined') {
        const sw: { temperament?: string; scarOrTie?: string } = {};
        const t = { ...chosen };
        for (const slot of ['temperament', 'scarOrTie'] as const) {
          const after = accepted.after[slot];
          if (after && chosen[slot] === after) {
            t[slot] = accepted.before[slot];
            sw[slot] = after;
          }
        }
        traits = t;
        quizTraits = Object.keys(sw).length ? sw : undefined;
      }
      const form = formative && formative !== 'declined' ? { answers: formative.answers, ...(quizTraits ? { traits: quizTraits } : {}) } : formative;
      const req: NewCampaignInput = { name: name.value, birthDate: birth.read(), startDate: startD.read(), startSecond: readTime(), premise: premise.value, creation: cf.read(), ...(startPick.value ? { start: { optionId: startPick.value, imperialBorn: imperialBorn.checked } } : {}), ...(traits ? { traits } : {}), ...(form ? { formative: form } : {}) };
      if (!traits) {
        err.textContent = 'Choose the traits: one origin, one temperament, one scar or tie.';
        return;
      }
      const errors = validateNewCampaign(req);
      if (errors.length) {
        err.textContent = errors.join(' ');
        return;
      }
      // The formative quiz for an older start, before the story begins (once; Skip declines it).
      const q = creationQuizInput(req);
      const plan = q && formative === undefined ? quizPlan(q) : null;
      const ctx = traitCtx();
      if (q && plan?.events.length && ctx) {
        err.textContent = '';
        // Begin waits while the quiz runs (m8-fixes G2); the quiz returns to the form, and only Begin starts the campaign.
        beginBtn.disabled = true;
        const before = { temperament: traits.temperament, scarOrTie: traits.scarOrTie };
        const traitName = (id: string | undefined): string => (id ? (TRAIT_BY_ID.get(id)?.name ?? id) : 'none');
        quizBox.replaceChildren(
          quizScreens(plan, {
            seed: q.seed,
            ctx,
            origin: traits.origin,
            current: before,
            onDone: (d) => {
              formative = { answers: d.answers };
              accepted = d.traits ? { before, after: d.traits } : null;
              if (d.traits) ts.apply(d.traits);
              const changes = (['temperament', 'scarOrTie'] as const).filter((k) => d.traits?.[k] && d.traits[k] !== before[k]).map((k) => `${k === 'temperament' ? 'Temperament' : 'Scar or tie'}: ${traitName(before[k])} -> ${traitName(d.traits![k])}`);
              // A scene that implies a form number (m8-audit A3): a first battle raises war years to at least 1.
              const war = cf.raiseWarYears(quizImplies(d.answers).warYears);
              if (war) changes.push(`War years: ${war.before} -> ${war.after} (your first battle)`);
              quizBox.replaceChildren(el('p', { class: 'hint', text: changes.length ? `Formative years done. Changed on the form above: ${changes.join('; ')}. Check them, then press Begin.` : 'Formative years done. Your traits are kept as chosen. Press Begin when ready.' }));
              beginBtn.disabled = false;
            },
            onDecline: () => {
              formative = 'declined';
              accepted = null;
              quizBox.replaceChildren(el('p', { class: 'hint', text: 'Formative years skipped. Press Begin when ready.' }));
              beginBtn.disabled = false;
            },
          }),
        );
        quizBox.scrollIntoView?.({ block: 'start' });
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
      el('div', { class: 'field' }, [el('label', { text: 'Start' }), startPick]),
      startNote,
      el('label', { class: 'check' }, [imperialBorn, document.createTextNode(' Imperial-born (a Sith Pureblood outside the Empire must be)')]),
      // Any change to the form (war years included, as they are typed) re-checks the traits (m8-fixes D1).
      el('div', { on: { change: () => ts.refresh(), input: () => ts.refresh() } }, cf.fields),
      ...ts.fields,
      el('div', { class: 'field' }, [el('label', { text: 'Premise' }), premise]),
      err,
      quizBox,
      el('div', { class: 'row actions' }, [beginBtn]),
      ...(devFlag(globalThis.location?.search ?? '') ? this.renderTestStart(name, startD, readTime, err) : []),
    ];
  }

  /** Dev-only test start (D-178; ?dev=1): rank and age, an Average Jedi Guardian marked as a test character. */
  private renderTestStart(name: HTMLInputElement, startD: { read: () => CalendarDate }, readTime: () => number, err: HTMLElement): HTMLElement[] {
    // D-215: the archetype (path, skills and equipment) and the species.
    const archetype = el('select', { attrs: { 'aria-label': 'Archetype' } }, Object.keys(TEST_START_ARCHETYPES).map((a) => el('option', { text: ARCHETYPE_BY_ID.get(a)?.name ?? a, attrs: { value: a } })));
    // The ranks of the chosen archetype's path, by their own names (pass 4: a Sith had no "Sith Lord" to pick).
    const rank = el('select', { attrs: { 'aria-label': 'Rank' } });
    const fillRanks = (): void => {
      const keep = rank.value;
      const opts = testStartRankOptions(archetype.value as TestStartArchetype);
      rank.replaceChildren(...opts.map((o) => el('option', { text: o.label, attrs: { value: o.value } })));
      rank.value = opts.some((o) => o.value === keep) ? keep : (opts.find((o) => o.value === 'initiate') ?? opts[0])!.value;
    };
    fillRanks();
    archetype.addEventListener('change', fillRanks);
    const species = el('select', { attrs: { 'aria-label': 'Species' } }, SPECIES.map((x) => el('option', { text: x.name, attrs: { value: x.id } })));
    const age = input({ type: 'number', value: '16', min: '4', max: '200', step: '0.5' });
    const scenario = el('textarea', { attrs: { rows: '2', placeholder: "Optional: I'm a Knight in a forest on Dantooine, ambushed by 4 Mandalorians", 'aria-label': 'Scenario' } });
    const start = async (): Promise<void> => {
      const req = testStartInput({ name: name.value, rank: rank.value as TestStartRank, age: Number(age.value), startDate: startD.read(), startSecond: readTime(), scenario: scenario.value, archetype: archetype.value as TestStartArchetype, speciesId: species.value });
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
      el('div', { class: 'field' }, [el('label', { text: 'Archetype' }), archetype]),
      el('div', { class: 'field' }, [el('label', { text: 'Species' }), species]),
      el('div', { class: 'field' }, [el('label', { text: 'Rank' }), rank]),
      el('div', { class: 'field' }, [el('label', { text: 'Age' }), age]),
      el('div', { class: 'field' }, [el('label', { text: 'Scenario (dev: the opening starts exactly here; later, /scenario in the chat box; /help lists the dev commands)' }), scenario]),
      el('p', { class: 'hint', text: 'The Average character of this archetype at this rank and age, levels from the closed form, with the archetype skills and equipment (a test Sith also knows Lightning; a smuggler has a blaster pistol and no Force); uses the start date above. Marked as a test character.' }),
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

/** The death card's hint (D-214): where to go to play on. */
export function deathCardHint(cause: string): string {
  return `${cause.charAt(0).toUpperCase()}${cause.slice(1)}. Choose Load an earlier save (in the campaign menu) to play on from before this moment on a new branch, or create a new character.`;
}

/** One earlier save in the list: the in-game date and time, the place and the turn. */
export function saveLabel(m: SaveMeta): string {
  return `${formatDate(m.day)}, ${formatClock(m.second)} · ${m.place ?? 'an unknown place'} · turn ${m.turn}${m.dead ? ' · after death' : ''}`;
}
