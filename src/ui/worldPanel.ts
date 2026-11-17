// People/World drawer (architecture §7 People tab and review queue; M2 debug view). Rendering
// and player actions only: reads state through selectors, sends player events back to the app.
import type { ContextReport, SectionReport } from '../turn/context';
import type { DebugRequest, SummaryOutcome } from '../turn/pipeline';
import type { TurnRecord } from '../turn/record';
import { formatDate } from '../engine/calendar';
import { selectCurrentLocationId, selectLocations } from '../features/locations/selectors';
import { selectArc, selectChapters, selectFacts, selectOpenReview, selectPlayerPins } from '../features/memory/selectors';
import { selectNpcAge, selectNpcs } from '../features/npcs/selectors';
import { selectPresentNpcIds } from '../features/pacing/selectors';
import { selectRelationship, selectRelationshipLabel } from '../features/relationships/selectors';
import { selectThreads } from '../features/threads/selectors';
import type { GameState } from '../state/gameState';
import type { GameEvent } from '../state/types';
import { el } from './dom';

export type WorldTab = 'people' | 'places' | 'threads' | 'memory' | 'review' | 'debug';

export interface WorldPanelProps {
  state: GameState;
  history: readonly TurnRecord[];
  tab: WorldTab;
  busy: boolean;
  debugRequests: readonly DebugRequest[];
  summaryLog: readonly SummaryOutcome[];
  error: string | null;
  setTab(tab: WorldTab): void;
  close(): void;
  /** Applies player events and commits them (pins, review resolutions). */
  playerEvents(events: GameEvent[]): void;
  retrySummaries(): void;
}

const TAB_LABELS: Record<WorldTab, string> = { people: 'People', places: 'Places', threads: 'Threads', memory: 'Memory', review: 'Review', debug: 'Debug' };

const nameOf = (s: GameState, id: string): string =>
  id === 'pc' ? s.character.name : (s.npcs.byId[id]?.name ?? s.locations.byId[id]?.name ?? s.threads.byId[id]?.title ?? id);

const kv = (label: string, value: string | null | undefined): HTMLElement | null => (value ? el('div', { class: 'kv' }, [el('span', { class: 'k', text: `${label}: ` }), value]) : null);

export function renderWorldPanel(p: WorldPanelProps): HTMLElement {
  const reviewCount = selectOpenReview(p.state).length;
  const tabs = el(
    'div',
    { class: 'tabs', attrs: { role: 'tablist' } },
    (Object.keys(TAB_LABELS) as WorldTab[]).map((t) =>
      el('button', {
        class: t === p.tab ? 'tab active' : 'tab',
        text: t === 'review' && reviewCount ? `${TAB_LABELS[t]} (${reviewCount})` : TAB_LABELS[t],
        attrs: { role: 'tab', 'aria-selected': String(t === p.tab) },
        on: { click: () => p.setTab(t) },
      }),
    ),
  );
  const body =
    p.tab === 'people'
      ? people(p)
      : p.tab === 'places'
        ? places(p)
        : p.tab === 'threads'
          ? threads(p)
          : p.tab === 'memory'
            ? memory(p)
            : p.tab === 'review'
              ? review(p)
              : debug(p);
  return el('aside', { class: 'world', attrs: { 'aria-label': 'People and world' } }, [
    el('div', { class: 'world-head' }, [el('strong', { text: 'People & World' }), el('button', { class: 'secondary', text: 'Close', on: { click: p.close } })]),
    tabs,
    p.error ? el('div', { class: 'error', text: p.error }) : null,
    el('div', { class: 'world-body' }, body),
  ]);
}

function empty(text: string): HTMLElement[] {
  return [el('p', { class: 'hint', text })];
}

function people(p: WorldPanelProps): HTMLElement[] {
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

function places(p: WorldPanelProps): HTMLElement[] {
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

function threads(p: WorldPanelProps): HTMLElement[] {
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

function memory(p: WorldPanelProps): HTMLElement[] {
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

function review(p: WorldPanelProps): HTMLElement[] {
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

function debug(p: WorldPanelProps): HTMLElement[] {
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
