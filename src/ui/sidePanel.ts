// Side panel (D-100): tabs Character, People (with the review queue, architecture §7), Places,
// Threads, Memory, Debug (M2 debug view). Rendering and player actions only: reads state through
// selectors, sends player events back to the app.
import type { ContextReport, SectionReport } from '../turn/context';
import type { DebugRequest, SummaryOutcome } from '../turn/pipeline';
import type { TurnInput, TurnRecord } from '../turn/record';
import { ACTIVITIES, ACTIVITY_BY_ID, INTENSITIES, type ActivityDef } from '../data/activities';
import { archetypeDef } from '../data/archetypes';
import { FORM_IDS, SKILLS, SKILL_BY_ID } from '../data/skills';
import { speciesDef } from '../data/species';
import { selectCharacter } from '../features/character/selectors';
import { selectFatigue } from '../features/health/selectors';
import { selectGriefMult, selectSkillViews, selectStateOfMind, selectTierBeats, type SkillView } from '../features/progression/selectors';
import { selectRankName } from '../features/ranks/selectors';
import { formatClock, formatDate, timeOfDayLabel } from '../engine/calendar';
import { selectAge, selectBirthDay, selectCharacterName } from '../features/character/selectors';
import { selectNow } from '../features/clock/selectors';
import { selectCurrentLocationId, selectLocationChain, selectLocations } from '../features/locations/selectors';
import { selectArc, selectChapters, selectCurrentChapter, selectFacts, selectOpenReview, selectPlayerPins } from '../features/memory/selectors';
import { selectNpcAge, selectNpcs } from '../features/npcs/selectors';
import { selectPacingLevel, selectPresentNpcIds } from '../features/pacing/selectors';
import { selectRelationship, selectRelationshipLabel } from '../features/relationships/selectors';
import { selectOpenThreads, selectThreads } from '../features/threads/selectors';
import type { GameState } from '../state/gameState';
import type { GameEvent } from '../state/types';
import { el } from './dom';

export type PanelTab = 'character' | 'people' | 'places' | 'threads' | 'memory' | 'debug';

export interface SidePanelProps {
  state: GameState;
  campaignName: string;
  history: readonly TurnRecord[];
  tab: PanelTab;
  busy: boolean;
  debugRequests: readonly DebugRequest[];
  summaryLog: readonly SummaryOutcome[];
  error: string | null;
  setTab(tab: PanelTab): void;
  /** Collapses the docked panel or closes the drawer. */
  close(): void;
  /** Applies player events and commits them (pins, review resolutions). */
  playerEvents(events: GameEvent[]): void;
  retrySummaries(): void;
  /** Plays a turn from a UI-built intent (the sheet's Train button, M3). */
  act(input: TurnInput): void;
}

export const PANEL_TABS: Record<PanelTab, string> = { character: 'Character', people: 'People', places: 'Places', threads: 'Threads', memory: 'Memory', debug: 'Debug' };

const nameOf = (s: GameState, id: string): string =>
  id === 'pc' ? s.character.name : (s.npcs.byId[id]?.name ?? s.locations.byId[id]?.name ?? s.threads.byId[id]?.title ?? id);

const kv = (label: string, value: string | null | undefined): HTMLElement | null => (value ? el('div', { class: 'kv' }, [el('span', { class: 'k', text: `${label}: ` }), value]) : null);

export function renderSidePanel(p: SidePanelProps): HTMLElement {
  const reviewCount = selectOpenReview(p.state).length;
  const tabs = el(
    'div',
    { class: 'tabs', attrs: { role: 'tablist' } },
    (Object.keys(PANEL_TABS) as PanelTab[]).map((t) =>
      el('button', {
        class: t === p.tab ? 'tab active' : 'tab',
        text: t === 'people' && reviewCount ? `${PANEL_TABS[t]} (${reviewCount})` : PANEL_TABS[t],
        attrs: { role: 'tab', 'aria-selected': String(t === p.tab) },
        on: { click: () => p.setTab(t) },
      }),
    ),
  );
  const body =
    p.tab === 'character'
      ? character(p)
      : p.tab === 'people'
        ? [...(reviewCount ? [el('h3', { text: `Needs review (${reviewCount})` }), ...review(p), el('h3', { text: 'People' })] : []), ...people(p)]
        : p.tab === 'places'
          ? places(p)
          : p.tab === 'threads'
            ? threads(p)
            : p.tab === 'memory'
              ? memory(p)
              : debug(p);
  return el('aside', { class: 'box side', attrs: { 'aria-label': 'Side panel' } }, [
    el('div', { class: 'box-head side-head' }, [
      tabs,
      el('button', { class: 'icon', text: '×', attrs: { 'aria-label': 'Close panel', title: 'Close panel' }, on: { click: p.close } }),
    ]),
    p.error ? el('div', { class: 'error side-error', text: p.error }) : null,
    el('div', { class: 'box-body', attrs: { 'data-scroll': `panel-${p.tab}` } }, body),
  ]);
}

function empty(text: string): HTMLElement[] {
  return [el('p', { class: 'hint', text })];
}

const CATEGORY_LABEL: Record<string, string> = {
  physical: 'Body',
  wisdom: 'Will and meditation',
  force: 'Force',
  technique: 'Combat and technique',
  knowledge: 'Knowledge',
  academic: 'Academic and social',
};
const ORDER = ['physical', 'wisdom', 'force', 'technique', 'knowledge', 'academic'];

const num = (x: number): string => x.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function meter(label: string, f: number, cap: number, word: string): HTMLElement {
  const bar = el('div', { class: 'meter' }, [el('div', { class: `meter-fill${f > 1 ? ' over' : f > 0.8 ? ' high' : ''}`, attrs: { style: `width:${Math.min(100, Math.round(f * 100))}%` } })]);
  return el('div', { class: 'meter-row' }, [el('span', { class: 'k', text: label }), bar, el('span', { class: 'meter-text', text: `${num(f * cap)} / ${num(cap)} · ${word}` })]);
}

function skillRow(v: SkillView): HTMLElement {
  // Real numbers: level, total XP / XP the next level needs, rust (the bar shows the same progress).
  const span = Math.max(1e-9, v.nextXp - v.levelXp);
  const progress = Math.min(1, Math.max(0, (v.xpTotal - v.levelXp) / span));
  const perf = v.category === 'physical' && Math.abs(v.performance - v.levelExact) > 0.05 ? ` · performance ${v.performance.toFixed(1)}` : '';
  return el('div', { class: 'skill-row' }, [
    el('span', { class: 'skill-name', text: v.name }),
    el('span', { class: 'skill-level', text: String(v.level) }),
    el('div', { class: 'meter thin', attrs: { title: `${num(v.xpTotal)} / ${num(v.nextXp)} XP` } }, [el('div', { class: 'meter-fill', attrs: { style: `width:${Math.round(progress * 100)}%` } })]),
    el('span', { class: 'skill-tier hint', text: `XP ${num(v.xpTotal)} / ${num(v.nextXp)} · ${v.tier} · rust ${(v.rust * 100).toFixed(1)}%${perf}` }),
  ]);
}

/** Primary choices an activity offers (null = fixed primary). */
function primaryChoices(a: ActivityDef, known: (id: string) => boolean): string[] | null {
  switch (a.primary.kind) {
    case 'skill':
      return null;
    case 'options':
      return [...a.primary.options];
    case 'anyForm':
    case 'formPair':
      return FORM_IDS.filter(known);
    case 'anyAbility':
      return SKILLS.filter((x) => x.kind === 'forceAbility' && known(x.id)).map((x) => x.id);
  }
}

/** The Train panel: activity, primary (when the activity offers a choice), hours and intensity. */
function trainPanel(p: SidePanelProps): HTMLElement {
  const s = p.state;
  const views = new Map(selectSkillViews(s).map((v) => [v.id, v]));
  const known = (id: string): boolean => (views.get(id)?.level ?? 0) >= 1;
  const groups = ['forms', 'force', 'meditation', 'physical', 'study', 'career'] as const;
  const groupLabel: Record<string, string> = { forms: 'Lightsaber forms', force: 'Force', meditation: 'Meditation', physical: 'Physical', study: 'Study', career: 'Careers' };
  const activity = el(
    'select',
    { attrs: { 'aria-label': 'Activity' } },
    groups.map((g) => el('optgroup', { attrs: { label: groupLabel[g]! } }, ACTIVITIES.filter((a) => a.group === g).map((a) => el('option', { text: a.name, attrs: { value: a.id } })))),
  );
  const c = selectCharacter(s);
  activity.value = c.mainFormId && c.mainFormId === 'shiiCho' ? 'shiiChoBasics' : (ACTIVITIES.find((a) => a.primary.kind === 'skill' && a.primary.skill === c.mainFormId)?.id ?? 'shiiChoBasics');
  const primary = el('select', { attrs: { 'aria-label': 'Skill' } });
  const hours = el('select', { attrs: { 'aria-label': 'Hours' } }, [0.5, 1, 1.5, 2, 3, 4].map((h) => el('option', { text: `${h} h`, attrs: { value: String(h) } })));
  hours.value = '1';
  const intensity = el('select', { attrs: { 'aria-label': 'Intensity' } }, [el('option', { text: 'default intensity', attrs: { value: '' } }), ...INTENSITIES.map((i) => el('option', { text: i, attrs: { value: i } }))]);
  const fillPrimary = (): void => {
    const a = ACTIVITY_BY_ID.get(activity.value)!;
    const choices = primaryChoices(a, known);
    primary.replaceChildren(...(choices ?? []).map((id) => el('option', { text: SKILL_BY_ID.get(id)?.name ?? id, attrs: { value: id } })));
    primary.hidden = !choices || choices.length === 0;
    if (c.mainFormId && choices?.includes(c.mainFormId)) primary.value = c.mainFormId;
  };
  activity.addEventListener('change', fillPrimary);
  fillPrimary();
  const go = (): void => {
    const a = ACTIVITY_BY_ID.get(activity.value)!;
    const skillId = !primary.hidden && primary.value ? primary.value : a.primary.kind === 'skill' ? a.primary.skill : undefined;
    const h = Number(hours.value);
    const actionType = a.group === 'study' ? 'study' : 'train';
    p.act({
      kind: 'action',
      label: `Train: ${a.name}${skillId && a.primary.kind !== 'skill' ? ` (${SKILL_BY_ID.get(skillId)?.name})` : ''}, ${h} h${intensity.value ? `, ${intensity.value}` : ''}`,
      intent: {
        actionType,
        targets: [],
        references: [],
        unknownNames: [],
        ...(skillId ? { skillId } : {}),
        requestedSpan: { amount: h, unit: 'hours' },
        activity: { activityId: a.id, ...(intensity.value ? { intensity: intensity.value as (typeof INTENSITIES)[number] } : {}) },
      },
    });
  };
  const btn = el('button', { text: 'Train', on: { click: go } });
  btn.disabled = p.busy;
  return el('div', { class: 'card train' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Train' })]),
    el('div', { class: 'train-row' }, [activity, primary]),
    el('div', { class: 'train-row' }, [hours, intensity, btn]),
    el('p', { class: 'hint', text: 'The engine resolves the session (fatigue, XP, outcome) and the GM narrates it. Locked activities are refused with the reason.' }),
  ]);
}

/** Character tab: the M3 sheet (identity, condition, skills, Train) plus who and where. */
function character(p: SidePanelProps): HTMLElement[] {
  const s = p.state;
  const now = selectNow(s);
  const chain = selectLocationChain(s, selectCurrentLocationId(s));
  const present = selectPresentNpcIds(s).map((id) => nameOf(s, id));
  const c = selectCharacter(s);
  const f = selectFatigue(s);
  const grief = selectGriefMult(s);
  const beats = selectTierBeats(s);
  const talents = Object.entries(c.talents).filter(([, l]) => l && l !== 'none').map(([d, l]) => `${l} (${d})`);
  const views = selectSkillViews(s);
  const byCat = ORDER.map((cat) => ({ cat, rows: views.filter((v) => v.category === cat && v.levelExact >= 0.5).sort((a, b) => b.levelExact - a.levelExact) })).filter((g) => g.rows.length);
  return [
    el('div', { class: 'card' }, [
      el('div', { class: 'card-title' }, [el('strong', { text: selectCharacterName(s) }), el('span', { class: 'rel', text: `age ${selectAge(s)}` })]),
      kv('Species', speciesDef(c.speciesId).name),
      kv('Path', `${c.path}, ${archetypeDef(c.archetype).name}`),
      kv('Rank', selectRankName(s)),
      kv('Training', c.trainingStartAge === null ? 'untrained' : `since age ${c.trainingStartAge}`),
      kv('Forms', [c.mainFormId, c.secondFormId].filter((x): x is string => !!x).map((x) => SKILL_BY_ID.get(x)?.name ?? x).join(', ') || 'none'),
      c.formPlan
        ? kv(
            'Form plan',
            Object.entries(c.formPlan.knight)
              .sort((x, y) => y[1] - x[1])
              .map(([f, h]) => `${SKILL_BY_ID.get(f)?.name ?? f} ${Math.round(h * 100) / 100} h`)
              .join(', '),
          )
        : null,
      kv('Talents', talents.join(', ') || 'none'),
      kv('Dominant hand', c.dominantHand),
      c.unbalanced ? el('div', { class: 'unbalanced', text: 'Unbalanced campaign: created with the talent point limit ignored.' }) : null,
    ]),
    el('div', { class: 'card' }, [
      el('div', { class: 'card-title' }, [el('strong', { text: 'Condition' }), el('span', { class: 'rel', text: `${selectStateOfMind(s)}${grief < 1 ? ` · grief x${grief.toFixed(2)}` : ''}` })]),
      meter('Physical', f.p, f.capacity.p, f.labels.p),
      meter('Mental', f.m, f.capacity.m, f.labels.m),
      meter('Force', f.f, f.capacity.f, f.labels.f),
      s.progression.overtrainStreak ? kv('Overtrained', `${s.progression.overtrainStreak} day(s) in a row`) : null,
      beats.length ? kv('Pending beats', beats.map((b) => `${SKILL_BY_ID.get(b.skillId)?.name ?? b.skillId} reached ${b.tier}`).join('; ')) : null,
    ]),
    trainPanel(p),
    ...byCat.map((g) => el('div', { class: 'card skills' }, [el('div', { class: 'card-title' }, [el('strong', { text: CATEGORY_LABEL[g.cat] ?? g.cat })]), ...g.rows.map(skillRow)])),
    el('div', { class: 'card' }, [
      kv('Born', formatDate(selectBirthDay(s))),
      kv('Now', `${formatDate(now.day)}, ${formatClock(now.second)} (${timeOfDayLabel(now.second)})`),
      kv('Where', chain.length ? chain.map((l) => l.name).join(', in ') : 'not recorded yet'),
      kv('With', present.length ? present.join(', ') : 'nobody'),
      kv('Pacing', selectPacingLevel(s)),
      kv('Open threads', selectOpenThreads(s).map((t) => t.title).join('; ') || 'none'),
    ]),
    el('div', { class: 'card' }, [
      kv('Campaign', p.campaignName),
      kv('Turn', String(s.meta.turn)),
      kv('Chapter', `${selectChapters(s).length + 1} (since turn ${Math.max(1, selectCurrentChapter(s).startTurn)})`),
    ]),
  ];
}

function people(p: SidePanelProps): HTMLElement[] {
  const s = p.state;
  const present = new Set(selectPresentNpcIds(s));
  const npcs = [...selectNpcs(s)].sort((a, b) => Number(present.has(b.id)) - Number(present.has(a.id)) || b.lastSeenDay - a.lastSeenDay || a.name.localeCompare(b.name));
  if (!npcs.length) return empty('Nobody yet. People the GM introduces appear here.');
  const facts = selectFacts(s);
  return npcs.map((n) => {
    const rel = selectRelationship(s, n.id);
    const age = selectNpcAge(s, n.id);
    const about = facts.filter((f) => f.aboutRef === n.id);
    return el('div', { class: `card${present.has(n.id) ? ' present' : ''}` }, [
      el('div', { class: 'card-title' }, [
        el('strong', { text: n.name }),
        el('span', { class: `rel rel-${selectRelationshipLabel(s, n.id)}`, text: `${selectRelationshipLabel(s, n.id)}${rel ? ` (${rel.value})` : ''}` }),
      ]),
      el('div', { class: 'hint', text: [n.id, n.speciesId, n.factionId, n.role, age !== null ? `about ${age}` : null, n.status, present.has(n.id) ? 'here now' : null].filter(Boolean).join(' · ') }),
      n.description ? el('p', { text: n.description }) : null,
      kv('Also known as', n.aliases.join(', ')),
      kv('Last change', rel?.lastReason),
      kv('Last seen', `${formatDate(n.lastSeenDay)}${n.lastLocationId ? `, ${nameOf(s, n.lastLocationId)}` : ''}`),
      kv('Canon', n.canonId),
      about.length ? el('ul', { class: 'facts' }, about.map((f) => el('li', { text: f.text }))) : null,
    ]);
  });
}

function places(p: SidePanelProps): HTMLElement[] {
  const s = p.state;
  const locs = selectLocations(s);
  if (!locs.length) return empty('No places yet.');
  const current = selectCurrentLocationId(s);
  const children = (parent: string | null): HTMLElement[] =>
    locs
      .filter((l) => l.parentId === parent || (parent === null && l.parentId !== null && !s.locations.byId[l.parentId]))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((l) =>
        el('li', {}, [
          el('div', { class: 'card' }, [
            el('div', { class: 'card-title' }, [el('strong', { text: l.name }), l.id === current ? el('span', { class: 'rel rel-friendly', text: 'you are here' }) : null]),
            el('div', { class: 'hint', text: [l.id, l.kind, l.region, l.firstVisitDay !== null ? `first visit ${formatDate(l.firstVisitDay)}` : 'not visited'].filter(Boolean).join(' · ') }),
            l.description ? el('p', { text: l.description }) : null,
            kv('Also known as', l.aliases.join(', ')),
          ]),
          el('ul', { class: 'tree' }, children(l.id)),
        ]),
      );
  return [el('ul', { class: 'tree' }, children(null))];
}

function threads(p: SidePanelProps): HTMLElement[] {
  const s = p.state;
  const list = [...selectThreads(s)].sort((a, b) => Number(b.status === 'open') - Number(a.status === 'open') || b.lastTurn - a.lastTurn);
  if (!list.length) return empty('No story threads yet.');
  return list.map((t) =>
    el('div', { class: `card${t.status === 'open' ? '' : ' closed'}` }, [
      el('div', { class: 'card-title' }, [el('strong', { text: t.title }), el('span', { class: `rel rel-${t.status === 'open' ? 'neutral' : t.status === 'resolved' ? 'friendly' : 'hostile'}`, text: t.status })]),
      el('div', { class: 'hint', text: [t.id, `opened ${formatDate(t.openedDay)}`, t.deadlineDay !== null ? `deadline ${formatDate(t.deadlineDay)}` : null].filter(Boolean).join(' · ') }),
      kv('Stakes', t.stakes),
      kv('Involves', t.entityRefs.map((id) => nameOf(s, id)).join(', ')),
      t.notes.length ? el('ul', { class: 'facts' }, t.notes.map((n) => el('li', { text: n }))) : null,
    ]),
  );
}

function memory(p: SidePanelProps): HTMLElement[] {
  const s = p.state;
  const arc = selectArc(s);
  const chapters = selectChapters(s);
  const pins = new Set(selectPlayerPins(s));
  const pending = chapters.filter((c) => c.status === 'summaryPending').length;
  const facts = selectFacts(s);
  const out: HTMLElement[] = [];
  out.push(el('h3', { text: 'Arc' }), arc ? el('p', { text: arc.text }) : el('p', { class: 'hint', text: 'Written when the first chapter closes.' }));
  out.push(el('h3', { text: `Chapters (open one started at turn ${Math.max(1, s.memory.current.startTurn)})` }));
  if (pending) {
    const btn = el('button', { class: 'secondary', text: `Retry ${pending} pending summar${pending === 1 ? 'y' : 'ies'}`, on: { click: p.retrySummaries } });
    btn.disabled = p.busy;
    out.push(btn);
  }
  if (!chapters.length) out.push(el('p', { class: 'hint', text: 'No closed chapters yet.' }));
  for (const c of [...chapters].reverse()) {
    out.push(
      el('div', { class: 'card' }, [
        el('div', { class: 'card-title' }, [el('strong', { text: `Turns ${c.turnRange[0]}-${c.turnRange[1]}` }), el('span', { class: `rel ${c.status === 'closed' ? 'rel-friendly' : 'rel-unfriendly'}`, text: c.status === 'closed' ? 'summarized' : 'summary pending' })]),
        el('div', { class: 'hint', text: `${formatDate(c.dayRange[0])} to ${formatDate(c.dayRange[1])} · closed: ${c.closeReason}` }),
        c.summary ? el('p', { text: c.summary }) : null,
        kv('People', c.entityIds.map((id) => nameOf(s, id)).join(', ')),
        kv('Places', c.locationIds.map((id) => nameOf(s, id)).join(', ')),
      ]),
    );
  }
  out.push(el('h3', { text: 'Facts' }), el('p', { class: 'hint', text: 'Pinned facts are always sent to the GM.' }));
  if (!facts.length) out.push(el('p', { class: 'hint', text: 'No facts yet.' }));
  for (const f of [...facts].reverse()) {
    const box = el('input', { attrs: { type: 'checkbox', 'aria-label': 'Pin' } });
    box.checked = pins.has(f.id);
    box.disabled = p.busy;
    box.addEventListener('change', () => p.playerEvents([{ type: 'factPinned', factId: f.id, pinned: box.checked }]));
    out.push(
      el('label', { class: 'fact' }, [box, el('span', {}, [el('strong', { text: `${nameOf(s, f.aboutRef)}: ` }), f.text, el('span', { class: 'hint', text: ` (${f.importance}, turn ${f.turn})` })])]),
    );
  }
  return out;
}

function review(p: SidePanelProps): HTMLElement[] {
  const s = p.state;
  const items = selectOpenReview(s);
  if (!items.length) return empty('Nothing to review. Names the GM or you use that match nobody known appear here.');
  const entities = [
    ...selectNpcs(s).map((n) => ({ id: n.id, label: `${n.name} (person)`, kind: 'npc' as const })),
    ...selectLocations(s).map((l) => ({ id: l.id, label: `${l.name} (place)`, kind: 'loc' as const })),
  ];
  return items.map((r) => {
    const select = el('select', { attrs: { 'aria-label': `Map ${r.name} to` } }, [
      el('option', { text: 'Map to...', attrs: { value: '' } }),
      ...entities.map((e) => el('option', { text: e.label, attrs: { value: e.id } })),
    ]);
    const map = (): void => {
      const target = entities.find((e) => e.id === select.value);
      if (!target) return;
      const alias: GameEvent = target.kind === 'npc' ? { type: 'npcAliasAdded', npcRef: target.id, alias: r.name } : { type: 'locationAliasAdded', locationRef: target.id, alias: r.name };
      p.playerEvents([alias, { type: 'reviewResolved', reviewId: r.id, resolution: 'mapped', entityRef: target.id }]);
    };
    const btn = (text: string, onClick: () => void, cls = 'secondary'): HTMLButtonElement => {
      const b = el('button', { class: cls, text, on: { click: onClick } });
      b.disabled = p.busy;
      return b;
    };
    return el('div', { class: 'card' }, [
      el('div', { class: 'card-title' }, [el('strong', { text: r.name })]),
      el('div', { class: 'hint', text: `turn ${r.turn} · from ${r.context}` }),
      el('div', { class: 'row' }, [
        select,
        btn('Map', map),
        btn('New person', () => p.playerEvents([{ type: 'npcCreatedByPlayer', name: r.name }, { type: 'reviewResolved', reviewId: r.id, resolution: 'created', entityRef: r.name }])),
        btn('New place', () => p.playerEvents([{ type: 'locationCreatedByPlayer', name: r.name }, { type: 'reviewResolved', reviewId: r.id, resolution: 'created', entityRef: r.name }])),
        btn('Dismiss', () => p.playerEvents([{ type: 'reviewResolved', reviewId: r.id, resolution: 'dismissed' }])),
      ]),
    ]);
  });
}

// ---------------------------------------------------------------- debug

function sectionTable(r: ContextReport): HTMLElement {
  const rows = r.sections.map((sec) =>
    el('tr', { class: sec.cap !== null && sec.tokens > sec.cap ? 'over' : '' }, [
      el('td', { text: sec.name }),
      el('td', { class: 'num', text: String(sec.tokens) }),
      el('td', { class: 'num', text: sec.cap !== null ? String(sec.cap) : '-' }),
      el('td', { class: 'num', text: String(sec.included.length) }),
      el('td', { class: 'num', text: String(sec.dropped.length) }),
    ]),
  );
  return el('table', { class: 'debug' }, [
    el('tr', {}, ['Section', 'Est. tokens', 'Cap', 'Items', 'Dropped'].map((h) => el('th', { text: h }))),
    ...rows,
    el('tr', { class: 'total' }, [el('td', { text: 'total (estimated)' }), el('td', { class: 'num', text: String(r.estimatedTokens) }), el('td', { text: '' }), el('td', { text: '' }), el('td', { text: '' })]),
    el('tr', { class: 'total' }, [el('td', { text: 'actual input tokens' }), el('td', { class: 'num', text: r.actualInputTokens !== null ? String(r.actualInputTokens) : 'n/a' }), el('td', { text: '' }), el('td', { text: '' }), el('td', { text: '' })]),
  ]);
}

function sectionDetails(sec: SectionReport): HTMLElement | null {
  if (!sec.included.length && !sec.dropped.length) return null;
  const line = (i: SectionReport['included'][number]): string => `${i.id}  ${i.tokens} tok${i.score !== undefined ? `  score ${i.score}` : ''}${i.note ? `  (${i.note})` : ''}`;
  return el('details', { class: 'log' }, [
    el('summary', { text: `${sec.name}: ${sec.included.length} included, ${sec.dropped.length} dropped` }),
    el('pre', { text: [...sec.included.map(line), ...(sec.dropped.length ? ['-- dropped --', ...sec.dropped.map(line)] : [])].join('\n') }),
  ]);
}

function reportBlock(title: string, r: ContextReport): HTMLElement {
  return el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: title }), el('span', { class: 'hint', text: `${r.model} · ${r.ratio} chars/token` })]),
    sectionTable(r),
    ...r.sections.map(sectionDetails),
  ]);
}

function debug(p: SidePanelProps): HTMLElement[] {
  const out: HTMLElement[] = [];
  const withReports = p.history.filter((h) => h.context?.narrative || h.context?.intent).slice(-5).reverse();
  out.push(el('h3', { text: 'What was sent (newest turns)' }));
  if (!withReports.length) out.push(el('p', { class: 'hint', text: 'No reports yet (turns played before M2 have none).' }));
  for (const h of withReports) {
    out.push(el('div', { class: 'hint', text: `Turn ${h.turn ?? '?'}: ${h.input.kind === 'typed' ? h.input.text : h.input.kind === 'choice' ? h.input.choice.label : 'opening'}${h.chapterClosed ? ` · closed ${h.chapterClosed.chapterId} (${h.chapterClosed.reason})` : ''}` }));
    if (h.context?.intent) out.push(reportBlock('Intent call', h.context.intent));
    if (h.context?.narrative) out.push(reportBlock('Narrative call', h.context.narrative));
  }
  if (p.summaryLog.length) {
    out.push(el('h3', { text: 'Summary calls (this session)' }));
    for (const s of [...p.summaryLog].reverse()) {
      out.push(el('div', { class: 'card' }, [el('div', { text: `${s.chapterId}: ${s.ok ? 'ok' : `failed: ${s.error ?? ''}`}` }), s.report ? sectionTable(s.report) : null]));
    }
  }
  out.push(el('h3', { text: 'Full requests (this session, newest first)' }));
  if (!p.debugRequests.length) out.push(el('p', { class: 'hint', text: 'Kept in memory only for the last requests of this session.' }));
  for (const r of [...p.debugRequests].reverse()) {
    out.push(
      el('details', { class: 'log' }, [
        el('summary', { text: `${r.callType} · ${r.report.estimatedTokens} est. tokens${r.report.actualInputTokens !== null ? ` · ${r.report.actualInputTokens} actual` : ''}` }),
        el('pre', { text: [`--- SYSTEM ---\n${r.system}`, ...r.messages.map((m) => `--- ${m.role.toUpperCase()} ---\n${m.text}`)].join('\n\n') }),
      ]),
    );
  }
  return out;
}
