// The ground command panel (m8-ground, M8 checklist item 14; D-522; spec/ground-command.md). Rendering and player actions only;
// no rules here. In the planning scene: the map with its terrain key, scouting, and (for the commander) the plan: objectives, the
// manoeuvre from the tactics the character knows, which unit goes where and who leads it, support, a reserve and up to two
// contingencies; then the word to begin. In the battle: where things stand, the map, the phase's orders, "let it play out" and
// taking control back.
import { ACTION_LABEL, CONTINGENCY_ACTIONS, CONTINGENCY_TRIGGERS, MAX_CONTINGENCIES, SCOUTING, TRIGGER_LABEL, type ContingencyAction, type ContingencyTrigger } from '../data/groundCommand.config';
import { PLAN_LABEL } from '../data/ground.config';
import { SEEN_TACTIC_PENALTY, TACTIC_BY_ID } from '../data/tactics';
import { drawMap, planProblems, selectActiveBattle, selectEndedBattleToShow, selectGroundBattle, selectGroundMenu, selectGroundPlanning, selectGroundWaitsOnFight, selectLastGround, type GroundPlan, type GroundPlanning } from '../features/battles/selectors';
import type { GameState } from '../state/gameState';
import type { TurnInput } from '../turn/record';
import { el } from './dom';

export interface GroundPanelProps {
  state: GameState;
  busy: boolean;
  act(input: TurnInput): void;
  /** The plan being set on the map (kept by the app between renders until the battle begins). */
  draft: { id: string; plan: GroundPlan; atPost: boolean } | null;
  setDraft(d: { id: string; plan: GroundPlan; atPost: boolean } | null): void;
  takingControl: boolean;
  takeControl(): void;
}

const unitTypeOf = (p: GroundPlanning, id: string): string => p.ours.units.find((u) => u.id === id)?.unit ?? '';
const SUPPORT_TYPES: Readonly<Record<string, 'artillery' | 'armour' | 'air'>> = { artillery: 'artillery', air: 'air' };

function select(options: readonly (readonly [string, string])[], value: string, onChange: (v: string) => void, disabled: boolean): HTMLSelectElement {
  const s = el('select', { attrs: disabled ? { disabled: 'true' } : {}, on: { change: (e) => onChange((e.target as HTMLSelectElement).value) } }, options.map(([v, label]) => el('option', { text: label, attrs: { value: v, ...(v === value ? { selected: 'true' } : {}) } })));
  return s;
}

/** Where a unit is in the plan: a sector's square, the reserve, support, or nowhere. */
function placeOf(plan: GroundPlan, id: string): string {
  const s = plan.sectors.find((x) => x.units.includes(id));
  if (s) return s.square;
  if (plan.reserve.includes(id)) return 'reserve';
  return 'none';
}

function moveUnit(plan: GroundPlan, id: string, to: string): GroundPlan {
  const sectors = plan.sectors.map((s) => ({ ...s, units: s.units.filter((u) => u !== id) }));
  const reserve = plan.reserve.filter((u) => u !== id);
  if (to === 'reserve') reserve.push(id);
  else if (to !== 'none') {
    const at = sectors.find((s) => s.square === to);
    if (at) at.units.push(id);
    else sectors.push({ square: to, units: [id], leader: null });
  }
  return { ...plan, sectors: sectors.filter((s) => s.units.length || s.leader), reserve };
}

/**
 * The planning step's layout (m8-fixes F; Jared will judge it): 'full' gives it the page's height with sections that fold away
 * (objectives, units, sector leaders, contingencies, scouting); 'compact' is the old box, the combat panel's size. One switch, so
 * the change is easy to reverse. The combat and battle layouts are untouched.
 */
export const PLANNING_LAYOUT: 'full' | 'compact' = 'full';
/** Which planning sections the player folded away (kept across redraws; the page redraws on every change). */
const folded = new Set<string>();
function fold(key: string, title: string, children: (HTMLElement | null)[]): HTMLElement {
  if (PLANNING_LAYOUT === 'compact') return el('div', {}, children);
  const d = el('details', { class: 'plan-fold', attrs: folded.has(key) ? {} : { open: 'true' } }, [el('summary', { text: title }), el('div', { class: 'plan-fold-body' }, children)]) as HTMLDetailsElement;
  d.addEventListener('toggle', () => (d.open ? folded.delete(key) : folded.add(key)));
  return d;
}

function planEditor(p: GroundPlanning, draft: { plan: GroundPlan; atPost: boolean }, set: (d: { plan: GroundPlan; atPost: boolean }) => void, busy: boolean): HTMLElement[] {
  const plan = draft.plan;
  const sections: Record<'objectives' | 'units' | 'leaders' | 'contingencies', HTMLElement[]> = { objectives: [], units: [], leaders: [], contingencies: [] };
  let out = sections.objectives;
  const positions = p.map.positions.map((sq) => [sq, `${sq}${p.map.squares[sq]?.note ? ` (${p.map.squares[sq]!.note})` : ''}`] as const);
  // Objectives.
  out.push(el('div', { class: 'battle-group' }, [
    el('span', { class: 'hint', text: 'Primary objective: ' }),
    select([['', '-'], ...positions], plan.primary ?? '', (v) => set({ ...draft, plan: { ...plan, primary: v || null } }), busy),
    el('span', { class: 'hint', text: ' Secondary: ' }),
    select([['', 'none'], ...positions], plan.secondary ?? '', (v) => set({ ...draft, plan: { ...plan, secondary: v || null } }), busy),
  ]));
  // The manoeuvre: the character's own list (the Tactics tab's); a seen one, not practised, is marked with its penalty (m8-fixes B4).
  out.push(el('div', { class: 'battle-group' }, [
    el('span', { class: 'hint', text: 'Manoeuvre: ' }),
    ...p.known.map((t) => {
      const def = TACTIC_BY_ID.get(t);
      const chosen = plan.manoeuvre === t;
      const seen = (p.seenOnly ?? []).includes(t);
      return el('button', { class: `small${chosen ? ' chosen' : ''}`, text: `${def?.name ?? t}${seen ? ` (seen, -${SEEN_TACTIC_PENALTY})` : ''}`, attrs: { title: def ? `Strong: ${def.strong}\nWeak: ${def.weak}${seen ? `\nSeen, not practised: -${SEEN_TACTIC_PENALTY} on the roll` : ''}` : '', 'aria-pressed': chosen ? 'true' : 'false', ...(busy ? { disabled: 'true' } : {}) }, on: { click: () => set({ ...draft, plan: { ...plan, manoeuvre: t } }) } });
    }),
  ]));
  // Sectors: each unit to a position, the reserve, or support.
  out = sections.units;
  const where = [...positions, ['reserve', 'the reserve'] as const, ['none', 'not used'] as const];
  out.push(el('div', { class: 'battle-known' }, [
    el('span', { class: 'hint', text: 'Units (where each goes):' }),
    ...p.ours.units.map((u) => {
      const kind = SUPPORT_TYPES[unitTypeOf(p, u.id)];
      return el('div', {}, [
        el('span', { text: `${u.label}: ` }),
        select(where, placeOf(plan, u.id), (v) => set({ ...draft, plan: moveUnit(plan, u.id, v) }), busy),
        kind ? el('span', { class: 'hint', text: ` or support at ` }) : null,
        kind ? select([['', '-'], ...positions], plan.support[kind] ?? '', (v) => set({ ...draft, plan: { ...moveUnit(plan, u.id, 'none'), support: { ...plan.support, [kind]: v || null } } }), busy) : null,
      ]);
    }),
  ]));
  // Leaders.
  out = sections.leaders;
  const leaderOpts: (readonly [string, string])[] = [['', 'its own officers'], ...(draft.atPost ? [] : [['player', 'you'] as const]), ...p.leaders.map((l) => [l.npcId!, l.name] as const)];
  out.push(el('div', { class: 'battle-known' }, [
    el('span', { class: 'hint', text: 'Who leads each sector:' }),
    ...plan.sectors.map((s) => el('div', {}, [el('span', { text: `${s.square}: ` }), select(leaderOpts, s.leader ?? '', (v) => set({ ...draft, plan: { ...plan, sectors: plan.sectors.map((x) => (x.square === s.square ? { ...x, leader: v || null } : v && x.leader === v ? { ...x, leader: null } : x)) } }), busy)])),
  ]));
  // Where the commander stands.
  const post = el('input', { attrs: { type: 'checkbox', ...(draft.atPost ? { checked: 'true' } : {}), ...(busy ? { disabled: 'true' } : {}) }, on: { change: (e) => set({ atPost: (e.target as HTMLInputElement).checked, plan: (e.target as HTMLInputElement).checked ? { ...plan, sectors: plan.sectors.map((x) => (x.leader === 'player' ? { ...x, leader: null } : x)) } : plan }) } });
  out.push(el('label', { class: 'check' }, [post, ' Command from the post (the whole picture; you do not fight or raise morale at the front)']));
  // Contingencies.
  out = sections.contingencies;
  const cRows = [...plan.contingencies];
  const setC = (i: number, c: GroundPlan['contingencies'][number] | null): void => {
    const next = [...cRows];
    if (c) next[i] = c;
    else next.splice(i, 1);
    set({ ...draft, plan: { ...plan, contingencies: next } });
  };
  out.push(el('div', { class: 'battle-known' }, [
    el('span', { class: 'hint', text: `Contingencies (up to ${MAX_CONTINGENCIES}; they carry out without penalty):` }),
    ...cRows.map((c, i) => el('div', {}, [
      el('span', { text: 'If ' }),
      select(CONTINGENCY_TRIGGERS.map((t) => [t, TRIGGER_LABEL[t]] as const), c.when, (v) => setC(i, { ...c, when: v as ContingencyTrigger }), busy),
      el('span', { text: ' at ' }),
      select([['', 'any sector'], ...positions], c.sector ?? '', (v) => setC(i, { when: c.when, then: c.then, ...(v ? { sector: v } : {}), ...(c.manoeuvre ? { manoeuvre: c.manoeuvre } : {}) }), busy),
      el('span', { text: ', ' }),
      select(CONTINGENCY_ACTIONS.map((a) => [a, ACTION_LABEL[a]] as const), c.then, (v) => setC(i, { ...c, then: v as ContingencyAction }), busy),
      c.then === 'switchPlan' ? select([['', '-'], ...p.known.map((t) => [t, TACTIC_BY_ID.get(t)?.name ?? t] as const)], c.manoeuvre ?? '', (v) => setC(i, { when: c.when, then: c.then, ...(c.sector ? { sector: c.sector } : {}), ...(v ? { manoeuvre: v } : {}) }), busy) : null,
      el('button', { class: 'small secondary', text: 'Remove', attrs: busy ? { disabled: 'true' } : {}, on: { click: () => setC(i, null) } }),
    ])),
    cRows.length < MAX_CONTINGENCIES ? el('button', { class: 'small secondary', text: 'Add a contingency', attrs: busy ? { disabled: 'true' } : {}, on: { click: () => set({ ...draft, plan: { ...plan, contingencies: [...cRows, { when: 'sectorFalling', then: plan.reserve.length ? 'commitReserve' : 'fallBack' }] } }) } }) : null,
  ]));
  return [
    fold('objectives', 'Objectives and manoeuvre', sections.objectives),
    fold('units', 'Units', sections.units),
    fold('leaders', 'Sector leaders and your place', sections.leaders),
    fold('contingencies', 'Contingencies', sections.contingencies),
  ];
}

export function renderGroundPanel(p: GroundPanelProps): HTMLElement | null {
  const s = p.state;
  const g = selectGroundBattle(s);
  const planning = selectGroundPlanning(s);
  const dis = p.busy ? { disabled: 'true' } : {};
  if (!g && !planning) {
    // The wrap-up on the turn the battle ended only (m8-fixes C3), and never beside another battle.
    const last = selectLastGround(s);
    if (!last || selectEndedBattleToShow(s) !== 'ground' || selectActiveBattle(s) !== null) return null;
    return el('section', { class: 'box duel battle' }, [el('div', { class: 'box-body duel-body' }, [el('strong', { text: `The battle at ${last.planning.site} is over` }), el('pre', { class: 'battle-map', text: last.map })])]);
  }
  if (planning && !g) {
    const draft = p.draft && p.draft.id === planning.id ? p.draft : { id: planning.id, plan: planning.plan, atPost: planning.atPost };
    const shown: GroundPlanning = { ...planning, plan: draft.plan, atPost: draft.atPost };
    const problems = planning.role === 'commander' ? planProblems(shown) : [];
    const body: HTMLElement[] = [
      el('p', { class: 'battle-now', text: `${planning.ours.name} against ${planning.enemy.name}${planning.defending ? ', holding the positions' : ', attacking'} · weather: ${planning.weather} · ${planning.role === 'commander' ? 'you plan it' : `${planning.ours.commander.name} plans it; you ${planning.role === 'leader' ? 'lead a sector' : 'fight in the line'}`}` }),
      el('pre', { class: 'battle-map', text: drawMap(shown, null, `PLAN · ${planning.site}`) }),
    ];
    const left = SCOUTING.tries - planning.scouting.tries;
    // Scouting: its own section (m8-fixes F), what it found and the two tries.
    body.push(fold('scouting', `Scouting (${left} ${left === 1 ? 'try' : 'tries'} left)`, [
      planning.scouting.planKnown ? el('p', { class: 'hint', text: `The enemy's likely plan: ${PLAN_LABEL[planning.enemy.plan]}` }) : null,
      ...planning.scouting.log.slice(-2).map((l) => el('div', { class: 'hint', text: l })),
      el('div', { class: 'battle-go' }, [
        el('button', { class: 'small secondary', text: `Scout the ground (${left} left)`, attrs: left > 0 && !p.busy ? {} : { disabled: 'true' }, on: { click: () => p.act({ kind: 'battle', label: 'Scout the ground', ground: { act: 'scout', how: 'recon' } }) } }),
        el('button', { class: 'small secondary', text: 'Read their intentions', attrs: left > 0 && !p.busy ? {} : { disabled: 'true' }, on: { click: () => p.act({ kind: 'battle', label: 'Read the enemy\'s intentions', ground: { act: 'scout', how: 'intelligence' } }) } }),
      ]),
    ]));
    if (planning.role === 'commander') body.push(...planEditor(planning, draft, (d) => p.setDraft({ id: planning.id, ...d }), p.busy));
    if (problems.length) body.push(el('div', { class: 'battle-log' }, problems.map((x) => el('div', { class: 'hint', text: `· ${x}` }))));
    body.push(el('div', { class: 'battle-go' }, [
      el('button', { class: 'small', text: planning.role === 'commander' ? 'Begin the battle' : 'Into battle', attrs: problems.length || p.busy ? { disabled: 'true' } : {}, on: { click: () => { p.setDraft(null); p.act({ kind: 'battle', label: 'Begin the battle', ground: planning.role === 'commander' ? { act: 'begin', plan: { ...draft.plan }, atPost: draft.atPost } : { act: 'begin' } }); } } }),
      el('button', { class: 'small secondary', text: 'Stand down', attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Stand down', ground: { act: 'standDown' } }) } }),
    ]));
    return el('section', { class: PLANNING_LAYOUT === 'full' ? 'box battle planning-full' : 'box duel battle' }, [el('div', { class: 'box-head' }, [el('strong', { text: `Planning: ${planning.site}` })]), el('div', { class: PLANNING_LAYOUT === 'full' ? 'box-body planning-body' : 'box-body duel-body' }, body)]);
  }
  if (!g) return null;
  if (selectGroundWaitsOnFight(s) && s.combat.active) return el('section', { class: 'box duel battle' }, [el('div', { class: 'box-body duel-body' }, [el('strong', { text: 'Your own fight comes first' }), el('p', { class: 'hint', text: 'The battle goes on round you; your sector feels the result next phase.' })])]);
  const menu = selectGroundMenu(s);
  if (!menu) return null;
  const body: HTMLElement[] = [el('p', { class: 'battle-now', text: menu.now }), el('pre', { class: 'battle-map', text: g.map })];
  for (const k of menu.known) body.push(el('div', { class: 'hint', text: k }));
  const recent = g.log.slice(-5);
  if (recent.length) body.push(el('div', { class: 'battle-log' }, recent.map((l) => el('div', { class: 'hint', text: l }))));
  if (g.auto) {
    body.push(el('p', { class: 'hint', text: 'The battle plays out on the plan as it stands.' }));
    body.push(el('div', { class: 'battle-go' }, [
      el('button', { class: 'small', text: 'Continue', attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Let it play out', ground: { act: 'auto' } }) } }),
      el('button', { class: 'small secondary', text: p.takingControl ? 'Taking control…' : 'Take control', attrs: p.takingControl ? { disabled: 'true' } : {}, on: { click: () => p.takeControl() } }),
    ]));
  } else {
    const groups = [...new Set(menu.options.map((o) => o.group))];
    for (const gname of groups) {
      body.push(el('div', { class: 'battle-group' }, [
        el('span', { class: 'hint', text: `${gname[0]!.toUpperCase()}${gname.slice(1)}: ` }),
        ...menu.options.filter((o) => o.group === gname).map((o) => el('button', { class: `small${o.available ? '' : ' unavailable'}`, text: o.label, attrs: { ...(o.available && !p.busy ? {} : { disabled: 'true' }), title: [o.strong ? `Strong: ${o.strong}` : '', o.weak ? `Weak: ${o.weak}` : '', o.why ?? ''].filter(Boolean).join('\n') }, on: { click: () => p.act({ kind: 'battle', label: o.label, ground: { act: 'order', orders: { ...o.orders } } }) } })),
      ]));
      // Staying at one's post (m8-audit A4) says what it costs in words on screen, not only in a tooltip (touch has no hover).
      if (gname === 'command') for (const o of menu.options.filter((x) => x.group === 'command' && x.why)) body.push(el('p', { class: 'hint battle-why', text: o.why! }));
    }
    body.push(el('div', { class: 'battle-go' }, [
      el('button', { class: 'small', text: 'Next phase', attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Next phase', ground: { act: 'order' } }) } }),
      el('button', { class: 'small secondary', text: 'Let it play out', attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Let it play out', ground: { act: 'auto' } }) } }),
    ]));
  }
  return el('section', { class: 'box duel battle' }, [el('div', { class: 'box-head' }, [el('strong', { text: menu.title })]), el('div', { class: 'box-body duel-body' }, body)]);
}
