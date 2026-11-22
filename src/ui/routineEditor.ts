// Routine editor (M4; training-routines §1, §5): priorities, effort, days per week, wake and sleep, locked
// blocks, the Padawan's master, templates, the AI's suggestion, a live preview with warnings, and
// "Start montage". Rendering and player actions only: the scheduler and the preview are engine code.
import { ACTIVITIES } from '../data/activities';
import { SKILLS, SKILL_BY_ID } from '../data/skills';
import { TRAINING_RECORDS } from '../data/trainingRecords';
import { selectPath } from '../features/character/selectors';
import { selectNpcs } from '../features/npcs/selectors';
import { selectRank } from '../features/ranks/selectors';
import { EFFORTS, type LockedBlock, type Priority, type Routine } from '../features/routines/selectors';
import type { GameState } from '../state/gameState';
import type { RoutinePreview } from '../state/routinePreview';
import { el } from './dom';

export interface RoutineEditorProps {
  state: GameState;
  draft: Routine;
  preview: RoutinePreview | null;
  busy: boolean;
  /** Set when the draft differs from the saved routine. */
  dirty: boolean;
  setDraft(r: Routine): void;
  save(r: Routine): void;
  saveTemplate(name: string): void;
  loadTemplate(id: string): void;
  deleteTemplate(id: string): void;
  resolveSuggestion(accept: boolean): void;
  /** Saves the draft (if changed) and starts a montage or time skip of `days`. */
  startJump(span: JumpSpan): void;
}

const WEIGHTS: [number, string][] = [
  [3, 'focus'],
  [2, 'regular'],
  [1, 'light'],
];
/** A jump's length: calendar months and years land on the same day of the month (D-142). */
export interface JumpSpan {
  amount: number;
  unit: 'days' | 'weeks' | 'months' | 'years';
}
const JUMPS: [JumpSpan, string][] = [
  [{ amount: 1, unit: 'weeks' }, '1 week'],
  [{ amount: 1, unit: 'months' }, '1 month'],
  [{ amount: 3, unit: 'months' }, '3 months'],
  [{ amount: 6, unit: 'months' }, '6 months'],
  [{ amount: 1, unit: 'years' }, '1 year'],
];
const hh = (sec: number): string => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}`;

function select<T extends string>(label: string, options: [T, string][], value: T, onChange: (v: T) => void): HTMLSelectElement {
  const s = el(
    'select',
    { attrs: { 'aria-label': label }, on: { change: (e) => onChange((e.target as HTMLSelectElement).value as T) } },
    options.map(([v, t]) => el('option', { text: t, attrs: { value: v } })),
  );
  s.value = value;
  return s;
}

/** Teaching sources a priority can name (D-124, D-125): path default, Order stubs, NPCs, records. */
function sourceOptions(s: GameState): [string, string][] {
  const path = selectPath(s);
  const out: [string, string][] = [
    ['', 'default (peers / solo)'],
    ['solo', 'alone'],
    ['peers', 'with peers'],
  ];
  if (path === 'jedi' || path === 'sith') out.push(['instructor', 'Temple instructors']);
  for (const n of selectNpcs(s).filter((x) => x.status === 'active')) {
    out.push([`npc:${n.id}`, `taught by ${n.name}`]);
    out.push([`partner:${n.id}`, `with ${n.name} (partner)`]);
  }
  for (const r of TRAINING_RECORDS) if (r.kind !== 'archive' || r.paths.includes(path)) out.push([`record:${r.id}`, r.name]);
  return out;
}

const sourceValue = (src: Priority['source']): string => (!src ? '' : src.kind === 'npc' || src.kind === 'partner' || src.kind === 'record' ? `${src.kind}:${src.id}` : src.kind);
function sourceFrom(v: string): Priority['source'] {
  if (!v) return undefined;
  const [kind, ...rest] = v.split(':');
  const id = rest.join(':');
  if (kind === 'npc' || kind === 'partner' || kind === 'record') return { kind, id };
  if (kind === 'solo' || kind === 'peers' || kind === 'instructor' || kind === 'master') return { kind };
  return undefined;
}

export function renderRoutineEditor(p: RoutineEditorProps): HTMLElement[] {
  const s = p.state;
  const r = p.draft;
  const set = (patch: Partial<Routine>): void => p.setDraft({ ...r, ...patch });
  const skillOpts: [string, string][] = SKILLS.map((x) => [x.id, x.name]);
  const sources = sourceOptions(s);

  // Basics
  const basics = el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Routine' }), el('span', { class: 'rel', text: p.dirty ? 'unsaved changes' : 'saved' })]),
    el('div', { class: 'train-row' }, [
      el('label', { text: 'Effort ' }, [select('Effort', EFFORTS.map((e) => [e, e]), r.effort, (v) => set({ effort: v }))]),
      el('label', { text: 'Days a week ' }, [
        select(
          'Training days a week',
          ['1', '2', '3', '4', '5', '6', '7'].map((d) => [d, d]),
          String(Math.round(r.daysPerWeek)) as '6',
          (v) => set({ daysPerWeek: Number(v) }),
        ),
      ]),
    ]),
    el('div', { class: 'train-row' }, [
      el('label', { text: 'Wake ' }, [
        select(
          'Wake time',
          Array.from({ length: 9 }, (_, i) => [String((4 + i) * 3600), hh((4 + i) * 3600)] as [string, string]),
          String(r.wakeSecond),
          (v) => set({ wakeSecond: Number(v) }),
        ),
      ]),
      el('label', { text: 'Sleep ' }, [
        select(
          'Sleep hours',
          ['6', '7', '8', '9', '10'].map((h) => [h, `${h} h`]),
          String(r.sleepHours),
          (v) => set({ sleepHours: Number(v) }),
        ),
      ]),
    ]),
    selectRank(s) === 'padawan' || selectRank(s) === 'apprentice'
      ? el('div', { class: 'train-row' }, [
          el('label', { text: 'Master ' }, [
            select(
              'Master',
              [['', 'the Order assigns one (stub)'], ...selectNpcs(s).filter((n) => n.status === 'active').map((n) => [n.id, n.name] as [string, string])],
              r.masterRef ?? '',
              (v) => set({ masterRef: v || null }),
            ),
          ]),
        ])
      : null,
    el('p', { class: 'hint', text: 'Order requirements for your rank are scheduled first and never trimmed; the rest of the daily budget follows your priorities.' }),
  ]);

  // Priorities
  const prios = r.priorities ?? [];
  const setPrio = (i: number, patch: Partial<Priority>): void => set({ priorities: prios.map((x, j) => (j === i ? ({ ...x, ...patch } as Priority) : x)) });
  const prioRows = prios.map((pr, i) =>
    el('div', { class: 'train-row' }, [
      select('Skill', skillOpts, pr.skillId, (v) => setPrio(i, { skillId: v })),
      select('Weight', WEIGHTS.map(([w, t]) => [String(w), t]), String(pr.weight), (v) => setPrio(i, { weight: Number(v) })),
      select('Teacher', sources, sourceValue(pr.source), (v) => {
        const src = sourceFrom(v);
        const { source: _old, ...rest } = pr;
        set({ priorities: prios.map((x, j) => (j === i ? (src ? { ...rest, source: src } : rest) : x)) });
      }),
      el('button', { class: 'small secondary', text: '×', attrs: { 'aria-label': 'Remove priority' }, on: { click: () => set({ priorities: prios.filter((_, j) => j !== i) }) } }),
    ]),
  );
  const priorities = el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Priorities' }), el('span', { class: 'rel', text: r.priorities ? `${prios.length} skills` : 'archetype default' })]),
    ...(r.priorities ? prioRows : [el('p', { class: 'hint', text: 'Using your archetype’s default template (your focus from creation; the main specialty takes half the fill from Knight on).' })]),
    el('div', { class: 'train-row' }, [
      el('button', { class: 'small', text: 'Add priority', on: { click: () => set({ priorities: [...prios, { skillId: SKILLS[0]!.id, weight: 2 }] }) } }),
      r.priorities ? el('button', { class: 'small secondary', text: 'Use archetype default', on: { click: () => set({ priorities: null }) } }) : null,
    ]),
  ]);

  // Locked blocks
  const locked = r.lockedBlocks;
  const setLock = (i: number, patch: Partial<LockedBlock>): void => set({ lockedBlocks: locked.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
  const lockRows = locked.map((b, i) =>
    el('div', { class: 'train-row' }, [
      select('Activity', ACTIVITIES.map((a) => [a.id, a.name]), b.activityId, (v) => setLock(i, { activityId: v })),
      select('Start', Array.from({ length: 18 }, (_, k) => [String((5 + k) * 3600), hh((5 + k) * 3600)] as [string, string]), String(b.startSecond), (v) => setLock(i, { startSecond: Number(v) })),
      select('Hours', ['0.5', '1', '1.5', '2', '3', '4'].map((h) => [h, `${h} h`]), String(b.hours), (v) => setLock(i, { hours: Number(v) })),
      el('button', { class: 'small secondary', text: '×', attrs: { 'aria-label': 'Remove locked block' }, on: { click: () => set({ lockedBlocks: locked.filter((_, j) => j !== i) }) } }),
    ]),
  );
  const lockedCard = el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Locked blocks' }), el('span', { class: 'rel', text: 'never moved or trimmed' })]),
    ...lockRows,
    el('button', { class: 'small', text: 'Add locked block', on: { click: () => set({ lockedBlocks: [...locked, { activityId: 'basicCentering', startSecond: 18 * 3600, hours: 1 }] }) } }),
  ]);

  // Suggestion from the story (D-129)
  const sug = s.routines.suggested;
  const suggestion = sug
    ? el('div', { class: 'card present' }, [
        el('div', { class: 'card-title' }, [el('strong', { text: 'Suggested by the story' }), el('span', { class: 'rel', text: sug.spanHint })]),
        el('div', { text: `${sug.effort}: ${sug.priorities.map((x) => `${SKILL_BY_ID.get(x.skillId)?.name ?? x.skillId} (${WEIGHTS.find(([w]) => w === x.weight)?.[1] ?? x.weight})`).join(', ')}` }),
        el('div', { class: 'train-row' }, [
          el('button', { class: 'small', text: 'Accept', on: { click: () => p.resolveSuggestion(true) } }),
          el('button', { class: 'small secondary', text: 'Dismiss', on: { click: () => p.resolveSuggestion(false) } }),
        ]),
      ])
    : null;

  // Templates
  const nameIn = el('input', { attrs: { placeholder: 'Template name', 'aria-label': 'Template name', maxlength: '60' } });
  const templates = el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Templates' })]),
    ...s.routines.templates.map((t) =>
      el('div', { class: 'train-row' }, [
        el('span', { text: t.name }),
        el('button', { class: 'small', text: 'Load', on: { click: () => p.loadTemplate(t.id) } }),
        el('button', { class: 'small secondary', text: 'Delete', on: { click: () => p.deleteTemplate(t.id) } }),
      ]),
    ),
    el('div', { class: 'train-row' }, [nameIn, el('button', { class: 'small', text: 'Save current', on: { click: () => nameIn.value.trim() && p.saveTemplate(nameIn.value.trim()) } })]),
    el('p', { class: 'hint', text: 'Saving a template saves the routine in force (save your edits first).' }),
  ]);

  // Preview (§5)
  const pv = p.preview;
  const preview = el('div', { class: 'card preview' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Preview' }), pv?.ok ? el('span', { class: 'rel', text: `budget ${pv.budget} h · day-end tiredness ${pv.projectedEndF}` }) : null]),
    ...(!pv
      ? [el('p', { class: 'hint', text: 'Computing…' })]
      : !pv.ok
        ? [el('div', { class: 'error', text: pv.error ?? 'invalid routine' })]
        : [
            ...pv.warnings.map((w) => el('div', { class: 'warn-line', text: `⚠ ${w}` })),
            el('div', { class: 'k', text: 'A typical training day' }),
            ...pv.typicalDay.map((it) =>
              el('div', { class: `day-line${it.kind === 'rest' ? ' muted' : ''}`, text: `${it.start}  ${it.label}${it.skillId ? ` (${SKILL_BY_ID.get(it.skillId)?.name ?? it.skillId})` : ''} · ${it.hours} h${it.source ? ` · ${it.source}` : ''}${it.fixed ? (it.locked ? ' · locked' : ' · Order') : ''}` }),
            ),
            el('div', { class: 'k', text: `Projected XP in a week (${pv.trainingDaysPerWeek} training days)` }),
            ...pv.weeklyXp.slice(0, 10).map((x) => el('div', { class: 'day-line', text: `${x.name} +${x.xp}` })),
            el('div', { class: 'k', text: 'Tiredness through the day (physical / mental)' }),
            el('div', { class: 'curve' }, pv.curve.map((c) => el('span', { class: 'bar', attrs: { title: `${c.hour} h: ${c.fp.toFixed(2)} / ${c.fm.toFixed(2)}`, style: `height:${Math.min(100, Math.round(Math.max(c.fp, c.fm) * 100))}%` } }))),
          ]),
  ]);

  // Save and start
  const custom = el('input', { attrs: { type: 'number', min: '1', max: '3680', value: '92', 'aria-label': 'Days' } });
  const actions = el('div', { class: 'card' }, [
    el('div', { class: 'train-row' }, [el('button', { text: 'Save routine', on: { click: () => p.save(r) } })]),
    el('div', { class: 'card-title' }, [el('strong', { text: 'Skip ahead with this routine' })]),
    el(
      'div',
      { class: 'train-row' },
      JUMPS.map(([span, label]) => el('button', { class: 'small', text: label, on: { click: () => p.startJump(span) } })),
    ),
    el('div', { class: 'train-row' }, [custom, el('span', { text: 'days' }), el('button', { class: 'small', text: 'Start', on: { click: () => p.startJump({ amount: Math.max(1, Math.min(3680, Math.round(Number(custom.value) || 1))), unit: 'days' }) } })]),
    el('p', { class: 'hint', text: 'Up to 120 days is a montage; longer is a time skip. The days run one by one; a significant event stops the jump early and the story picks up at that moment.' }),
  ]);
  for (const b of actions.querySelectorAll('button')) b.disabled = p.busy;
  const out: (HTMLElement | null)[] = [suggestion, basics, priorities, lockedCard, preview, templates, actions];
  return out.filter((x): x is HTMLElement => x !== null);
}
