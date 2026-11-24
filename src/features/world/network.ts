// The world-event tag network (M8 Phase A, D-466; docs-v2/spec/world-events.md). Pure rules over a network's data, the
// saved network state and the facts recorded in the game state. Nothing here reads narration: a tag breaks only when a
// recorded fact, a rolled action or a won fight meets its test.
//
// Events are settled when play reaches their date (a divergence is decided then, not before, so the player can still
// change more). Broken tags and broken outcomes are final: history is never reconnected.
import { DIFFICULTY_RATING, type ActionType } from '../../data/checks.config';
import type { FactionId } from '../../data/entities.config';
import { COMBAT_STAKES, type CombatStakes } from '../../data/progression.config';
import { placeAmong, WORLD_CONTROL, type ControlSide, type ControlSpan } from '../../data/worldControl';
import { ACTIONS_PER_CONDITION_PER_DAY, GRADE_POINTS, GUARD_RULES, PREREQUISITE_GUARD, STRENGTH_POINTS } from '../../data/worldNetwork.config';
import type { ConditionTag, DeedTest, PlotAlternative, PlotPointDef, RoleTag, StateTest, WorldDate, WorldEventDef, WorldEventStatus, WorldExpr, WorldGuard, WorldNetwork, WorldTest } from '../../data/worldNetwork';
import { absDayFromDate } from '../../engine/calendar';
import { datedFactsAt, type FactNow, type HeldReason, type OutcomeState } from '../../engine/datedFacts';
import { dcForRating, gradeMargin } from '../../engine/rolls';
import type { EventRecord, NetworkState, Progress, Substitute } from './world';

/** What the engine recorded, as far as the network needs it. */
export interface WorldFacts {
  bby: number;
  /** A canon figure the engine recorded as dead or taken in this campaign; null = neither (or never met). */
  npcLost(canonId: string): 'dead' | 'captured' | null;
  hasFlag(flag: string): boolean;
  /** The last finished fight, when the player won it. */
  wonFight: { id: string; stakes: CombatStakes; canonIds: readonly string[]; factions: readonly FactionId[]; places: readonly string[] } | null;
  /** People who could stand in for a lost role, best first. */
  standIns(role: RoleTag, exclude: ReadonlySet<string>): readonly Omit<Substitute, 'role'>[];
}

/** One action whose check the engine rolled. */
export interface WorldAction {
  actionType: ActionType;
  skillId: string | null;
  total: number;
  /** Place names (and aliases) of the scene and of any place the action targets. */
  places: readonly string[];
  /** Canon figures the action targets. */
  canonIds: readonly string[];
}

export interface NetworkChange {
  kind: 'tag' | 'started' | 'settled' | 'alternative';
  id: string;
  note: string;
  /** Stops a montage or a time skip; something that does not happen never does. */
  interrupt: boolean;
  /** The player's report may name it (a tag, or something that never came about, is not news to them). */
  seen: boolean;
}

// ---- Dates and order ----

export const worldDay = (d: WorldDate): number => absDayFromDate({ year: d.year, month: d.month ?? 1, day: d.day ?? 1 });
export const tagKey = (eventId: string, tagId: string): string => `${eventId}#${tagId}`;

interface NetworkIndex {
  byId: ReadonlyMap<string, WorldEventDef>;
  producer: ReadonlyMap<string, string>;
  standing: ReadonlySet<string>;
  alternativeOutcomes: ReadonlySet<string>;
  order: readonly WorldEventDef[];
  rank: ReadonlyMap<string, number>;
}
const indexes = new WeakMap<WorldNetwork, NetworkIndex>();

function indexOf(net: WorldNetwork): NetworkIndex {
  const hit = indexes.get(net);
  if (hit) return hit;
  const producer = new Map(net.events.flatMap((e) => e.produces.map((p): [string, string] => [p.outcome, e.id])));
  // Kahn's order over the inputs, earliest date first, so producers on the same day come before their consumers.
  const left = new Set(net.events);
  const done = new Set<string>();
  const order: WorldEventDef[] = [];
  const sorted = [...net.events].sort((a, b) => worldDay(a.date) - worldDay(b.date));
  for (let moved = true; moved; ) {
    moved = false;
    for (const e of sorted) {
      if (!left.has(e)) continue;
      const waits = e.consumes.some((c) => producer.has(c.outcome) && !done.has(producer.get(c.outcome)!));
      if (waits) continue;
      left.delete(e);
      done.add(e.id);
      order.push(e);
      moved = true;
    }
  }
  const index: NetworkIndex = {
    byId: new Map(net.events.map((e) => [e.id, e])),
    producer,
    standing: new Set(net.standing.map((s) => s.outcome)),
    alternativeOutcomes: new Set(net.plotPoints.flatMap((p) => p.alternatives.flatMap((a) => a.effects?.produces ?? []))),
    order,
    rank: new Map(order.map((e, i) => [e.id, i])),
  };
  indexes.set(net, index);
  return index;
}

/** The events with every producer before its consumers (shorter than the network when they loop). */
export const eventOrder = (net: WorldNetwork): readonly WorldEventDef[] => indexOf(net).order;
export const eventDef = (net: WorldNetwork, id: string): WorldEventDef | null => indexOf(net).byId.get(id) ?? null;

// ---- Reading the state ----

const SETTLED: readonly WorldEventStatus[] = ['standing', 'recorded', 'substituted', 'adjusted', 'altered', 'cancelled'];
export const DIVERGED: readonly WorldEventStatus[] = ['altered', 'cancelled'];
const isSettled = (st: NetworkState, e: WorldEventDef): boolean => {
  const r = st.events[e.id];
  return r !== undefined && SETTLED.includes(r.status);
};
const startDue = (st: NetworkState, e: WorldEventDef): number => worldDay(e.date) + (st.shifts[e.id] ?? 0);
const endDue = (st: NetworkState, e: WorldEventDef): number => worldDay(e.endDate ?? e.date) + (st.shifts[e.id] ?? 0);

export function outcomeState(net: WorldNetwork, st: NetworkState, id: string): OutcomeState {
  const s = st.outcomes[id];
  if (s) return s.state;
  const ix = indexOf(net);
  if (ix.standing.has(id)) return 'produced';
  return ix.producer.has(id) || ix.alternativeOutcomes.has(id) ? 'pending' : 'unknown';
}

export interface ControlNow {
  place: string;
  side: ControlSide;
  note: string;
  inferred: boolean;
  held: HeldReason | 'changed' | null;
}

/** Who holds the places now (D-466): the dated table with the freeze, and the places this campaign changed. */
export function controlNow(net: WorldNetwork, st: NetworkState, bby: number, match: (place: string, aliases: readonly string[]) => boolean, table: readonly ControlSpan[] = WORLD_CONTROL): ControlNow[] {
  const places = [...new Set(table.filter((c) => match(c.place, c.aliases ?? [])).map((c) => c.place))];
  const changed = [...new Map(st.control.map((c) => [c.place, c])).values()].filter((c) => match(c.place, []));
  const out: ControlNow[] = [];
  for (const place of [...places, ...changed.map((c) => c.place).filter((p) => !places.includes(p))]) {
    const facts: FactNow<ControlSpan>[] = datedFactsAt(table.filter((c) => c.place === place), bby, (o) => outcomeState(net, st, o));
    const change = changed.find((c) => c.place === place);
    // A change made in play holds until an event settled after it (an outcome the span depends on) takes the place.
    const later = change ? facts.filter((f) => f.held === null && (f.fact.dependsOn ?? []).some((o) => (st.outcomes[o]?.state === 'produced' ? st.outcomes[o].day : -Infinity) > change.day)) : facts;
    if (change && !later.length) out.push({ place, side: change.side, note: change.note, inferred: false, held: 'changed' });
    else for (const f of later) out.push({ place, side: f.fact.side, note: f.fact.note, inferred: f.fact.inferred === true, held: f.held });
  }
  return out;
}

function stateTestHolds(net: WorldNetwork, st: NetworkState, f: WorldFacts, t: StateTest): boolean {
  switch (t.kind) {
    case 'npc': {
      const lost = f.npcLost(t.canonId);
      return t.state === 'lost' ? lost !== null : lost === t.state;
    }
    case 'control':
      return controlNow(net, st, f.bby, (p) => p === t.place).some((c) => c.side === t.side) === (t.is ?? true);
    case 'flag':
      return f.hasFlag(t.flag);
    case 'outcome':
      return outcomeState(net, st, t.outcome) === t.state;
  }
}

export function exprHolds(net: WorldNetwork, st: NetworkState, f: WorldFacts, e: WorldExpr): boolean {
  if ('outcome' in e) return outcomeState(net, st, e.outcome) === e.is;
  if ('tag' in e) return (st.tags[e.tag] !== undefined) === (e.is === 'broken');
  if ('event' in e) {
    const r = st.events[e.event];
    return r !== undefined && e.is.includes(r.status);
  }
  if ('test' in e) return stateTestHolds(net, st, f, e.test);
  if ('alternative' in e) return st.plotPoints[e.of]?.alternative === e.alternative;
  if ('all' in e) return e.all.every((x) => exprHolds(net, st, f, x));
  if ('any' in e) return e.any.some((x) => exprHolds(net, st, f, x));
  if ('not' in e) return !exprHolds(net, st, f, e.not);
  return e.of.filter((x) => exprHolds(net, st, f, x)).length >= e.atLeast;
}

// ---- Breaking tags ----

const NO_PROGRESS: Progress = { points: 0, counted: [], prepared: false, actionDay: null, actionsThatDay: 0 };
const isDeed = (t: WorldTest): t is WorldTest & DeedTest => t.kind === 'action' || t.kind === 'fight';

function conditionOpen(st: NetworkState, e: WorldEventDef, c: ConditionTag, f: WorldFacts): boolean {
  if (isSettled(st, e) || st.tags[tagKey(e.id, c.id)]) return false;
  if (c.window === 'underway') return st.events[e.id]?.status === 'underway';
  return c.window === undefined || -f.bby >= c.window.fromYear;
}

const placesMatch = (wanted: readonly string[] | undefined, at: readonly string[]): boolean => !wanted || wanted.some((p) => placeAmong(p, [], at));
const peopleMatch = (wanted: readonly string[] | undefined, at: readonly string[]): boolean => !wanted || wanted.some((id) => at.includes(id));

function actionMeets(t: WorldTest, a: WorldAction): boolean {
  if (t.kind !== 'action') return false;
  if (!t.actionTypes.includes(a.actionType)) return false;
  if (t.skills && (a.skillId === null || !t.skills.includes(a.skillId))) return false;
  return placesMatch(t.places, a.places) && peopleMatch(t.canonIds, a.canonIds);
}

function fightMeets(t: WorldTest, w: NonNullable<WorldFacts['wonFight']>): boolean {
  if (t.kind !== 'fight') return false;
  if (COMBAT_STAKES.indexOf(w.stakes) < COMBAT_STAKES.indexOf(t.minStakes ?? 'skirmish')) return false;
  if (t.factions && !t.factions.some((x) => w.factions.includes(x))) return false;
  return placesMatch(t.places, w.places) && peopleMatch(t.canonIds, w.canonIds);
}

const guardMargin = (guard: WorldGuard, total: number): number => total - dcForRating(DIFFICULTY_RATING[GUARD_RULES[guard].difficulty]);

function breakTag(st: NetworkState, key: string, day: number, cause: string): NetworkState {
  return st.tags[key] ? st : { ...st, tags: { ...st.tags, [key]: { day, cause: cause.slice(0, 200), toldTurn: null } } };
}

const LOST_TEXT = { dead: 'dead', captured: 'captured' } as const;

/** Facts recorded in the game state, counted once each, against every open tag. */
function latchTags(net: WorldNetwork, st0: NetworkState, f: WorldFacts, day: number, changes: NetworkChange[]): NetworkState {
  let st = st0;
  const broke = (key: string, cause: string): void => {
    st = breakTag(st, key, day, cause);
    changes.push({ kind: 'tag', id: key, note: `tag broken: ${key} (${cause})`, interrupt: false, seen: false });
  };
  for (const e of eventOrder(net)) {
    if (isSettled(st, e)) continue;
    for (const r of e.roles) {
      const key = tagKey(e.id, r.id);
      if (st.tags[key]) continue;
      const lost = r.canonId ? f.npcLost(r.canonId) : null;
      if (lost) broke(key, `${r.label} ${LOST_TEXT[lost]}`);
      else if ((r.breakIf ?? []).some((t) => stateTestHolds(net, st, f, t))) broke(key, `${r.label} cannot act`);
    }
    for (const c of e.conditions) {
      if (!conditionOpen(st, e, c, f)) continue;
      const key = tagKey(e.id, c.id);
      let p = st.progress[key] ?? NO_PROGRESS;
      const before = p;
      const met = (t: WorldTest): boolean => (t.kind === 'fight' ? f.wonFight !== null && fightMeets(t, f.wonFight) : !isDeed(t) && stateTestHolds(net, st, f, t));
      if (c.prerequisite && !p.prepared && c.prerequisite.some(met)) p = { ...p, prepared: true };
      if (!c.prerequisite || p.prepared) {
        c.breakIf.forEach((t, i) => {
          // A fight counts once per test and fight; a recorded fact once.
          const mark = t.kind === 'fight' ? `${i}:${f.wonFight?.id ?? ''}` : `${i}`;
          if (p.counted.includes(mark) || !met(t)) return;
          p = { ...p, points: p.points + STRENGTH_POINTS[t.strength ?? 'minor'], counted: [...p.counted, mark] };
        });
      }
      if (p !== before) st = { ...st, progress: { ...st.progress, [key]: p } };
      if (p.points >= GUARD_RULES[c.guard].points) broke(key, 'recorded facts');
    }
  }
  return st;
}

/** Whether any open condition's test (or prerequisite) is about this action. */
export function actionMatters(net: WorldNetwork, st: NetworkState, f: WorldFacts, a: WorldAction): boolean {
  return net.events.some((e) => e.conditions.some((c) => conditionOpen(st, e, c, f) && [...c.breakIf, ...(c.prerequisite ?? [])].some((t) => actionMeets(t, a))));
}

/** A rolled action counted against every open condition it is about: the guard sets the DC and the points needed. */
export function recordAction(net: WorldNetwork, st0: NetworkState, f: WorldFacts, a: WorldAction, day: number): { state: NetworkState; notes: string[] } {
  let st = st0;
  const notes: string[] = [];
  for (const e of eventOrder(net)) {
    for (const c of e.conditions) {
      if (!conditionOpen(st, e, c, f)) continue;
      const key = tagKey(e.id, c.id);
      let p = st.progress[key] ?? NO_PROGRESS;
      if (c.prerequisite && !p.prepared) {
        if (!c.prerequisite.some((t) => actionMeets(t, a))) continue;
        if (guardMargin(PREREQUISITE_GUARD, a.total) < 0) continue;
        p = { ...p, prepared: true };
        notes.push(`world: ${key}: the prerequisite is met`);
      } else if (c.breakIf.some((t) => actionMeets(t, a))) {
        const today = p.actionDay === day ? p.actionsThatDay : 0;
        if (today >= ACTIONS_PER_CONDITION_PER_DAY) {
          notes.push(`world: ${key}: already counted today`);
          continue;
        }
        const grade = gradeMargin(guardMargin(c.guard, a.total));
        p = { ...p, points: Math.max(0, p.points + GRADE_POINTS[grade]), actionDay: day, actionsThatDay: today + 1 };
        notes.push(`world: ${key}: ${grade} against a ${c.guard} guard (${p.points} of ${GUARD_RULES[c.guard].points})`);
      } else continue;
      st = { ...st, progress: { ...st.progress, [key]: p } };
      if (p.points >= GUARD_RULES[c.guard].points) {
        st = breakTag(st, key, day, `the player's action (${a.actionType})`);
        notes.push(`world: tag broken: ${key}`);
      }
    }
  }
  return { state: st, notes };
}

// ---- Settling events: substitution, divergence, the ripple ----

interface Verdict {
  diverges: WorldEventStatus | null;
  broken: string[];
  /** Optional inputs or minor conditions are gone: it goes ahead, adjusted. */
  adjusted: boolean;
}

function judge(net: WorldNetwork, st: NetworkState, e: WorldEventDef): Verdict {
  const broken: string[] = [];
  const effects: string[] = [];
  let adjusted = false;
  for (const r of e.roles) {
    if (!st.tags[tagKey(e.id, r.id)]) continue;
    broken.push(r.id);
    if (r.kind === 'crucial') effects.push(r.onBreak ?? 'altered');
  }
  for (const c of e.conditions) {
    if (!st.tags[tagKey(e.id, c.id)]) continue;
    broken.push(c.id);
    if (c.crucial) effects.push(c.onBreak ?? 'altered');
    else adjusted = true;
  }
  for (const c of e.consumes) {
    if (outcomeState(net, st, c.outcome) !== 'broken') continue;
    broken.push(c.outcome);
    if (c.required) effects.push(c.onBreak ?? 'cancelled');
    else adjusted = true;
  }
  // An alternative has already ruled out what it would bring about.
  if (e.produces.some((p) => !p.when && st.outcomes[p.outcome]?.state === 'broken')) effects.push('cancelled');
  return { diverges: effects.includes('cancelled') ? 'cancelled' : effects.length ? 'altered' : null, broken, adjusted };
}

/** Broken is final; produced turns to broken only while its own event is still under way. */
function setOutcome(st: NetworkState, outcome: string, state: 'produced' | 'broken', day: number): NetworkState {
  const was = st.outcomes[outcome]?.state;
  if (was === state || was === 'broken') return st;
  return { ...st, outcomes: { ...st.outcomes, [outcome]: { state, day } } };
}

function settleOutcomes(net: WorldNetwork, st0: NetworkState, e: WorldEventDef, status: WorldEventStatus, day: number): NetworkState {
  const isBroken = (ref: string): boolean => (ref.startsWith('O.') ? outcomeState(net, st0, ref) === 'broken' : st0.tags[tagKey(e.id, ref)] !== undefined);
  let st = st0;
  for (const p of e.produces) {
    let produced = !DIVERGED.includes(status);
    if (p.when && status !== 'cancelled') produced = !(p.when.intact ?? []).some(isBroken) && (!p.when.broken || p.when.broken.some(isBroken));
    st = setOutcome(st, p.outcome, produced ? 'produced' : 'broken', day);
  }
  return st;
}

function pickSubstitutes(net: WorldNetwork, st: NetworkState, e: WorldEventDef, f: WorldFacts): Substitute[] {
  // Nobody already in the event, nobody standing in for another of its roles, and nobody a later event cannot do without.
  const bound = net.events.filter((x) => !isSettled(st, x)).flatMap((x) => x.roles.filter((r) => r.kind === 'crucial' || r.protagonist));
  const taken = new Set([...e.roles, ...bound].flatMap((r) => (r.canonId ? [r.canonId] : [])));
  return e.roles
    .filter((r) => r.kind === 'replaceable' && st.tags[tagKey(e.id, r.id)])
    .map((r) => {
      const pick = f.standIns(r, taken)[0];
      const id = pick?.canonId ?? pick?.npcId;
      if (id) taken.add(id);
      return { role: r.id, canonId: pick?.canonId ?? null, npcId: pick?.npcId ?? null, name: pick?.name ?? null };
    });
}

/** Stand-ins named when the event began stay; roles lost since get their own. */
const keepSubstitutes = (net: WorldNetwork, st: NetworkState, e: WorldEventDef, f: WorldFacts, named: readonly Substitute[]): Substitute[] =>
  pickSubstitutes(net, st, e, f).map((s) => named.find((n) => n.role === s.role) ?? s);

const divergenceStands = (st: NetworkState): boolean => Object.keys(st.plotPoints).length > 0;
const record = (st: NetworkState, e: WorldEventDef, r: EventRecord): NetworkState => ({ ...st, events: { ...st.events, [e.id]: r } });

function settle(net: WorldNetwork, st0: NetworkState, e: WorldEventDef, v: Verdict, f: WorldFacts, day: number): NetworkState {
  const was = st0.events[e.id];
  const begun = was?.status === 'underway';
  const substitutes = v.diverges ? [] : begun && was.substitutes.length ? keepSubstitutes(net, st0, e, f, was.substitutes) : pickSubstitutes(net, st0, e, f);
  // Something that had already begun cannot be cancelled any more, only altered.
  const status: WorldEventStatus = v.diverges ? (begun ? 'altered' : v.diverges) : v.adjusted || divergenceStands(st0) ? 'adjusted' : substitutes.length ? 'substituted' : 'recorded';
  const st = settleOutcomes(net, st0, e, status, day);
  return record(st, e, { status, day: begun ? was.day : day, endedDay: day, broken: v.broken, substitutes, toldTurn: null });
}

/** One due step of one event, or null when nothing is due: start it, end it, or notice that it has diverged under way. */
function nextStep(net: WorldNetwork, st: NetworkState, day: number): { e: WorldEventDef; due: number; step: 'start' | 'end' | 'diverge' } | null {
  const ix = indexOf(net);
  let best: { e: WorldEventDef; due: number; step: 'start' | 'end' | 'diverge' } | null = null;
  for (const e of ix.order) {
    if (isSettled(st, e)) continue;
    let cand: { e: WorldEventDef; due: number; step: 'start' | 'end' | 'diverge' } | null = null;
    if (st.events[e.id]?.status === 'underway') {
      if (judge(net, st, e).diverges) cand = { e, due: Math.min(day, endDue(st, e)), step: 'diverge' };
      else if (endDue(st, e) <= day) cand = { e, due: endDue(st, e), step: 'end' };
    } else if (startDue(st, e) <= day) {
      const pending = e.consumes.some((c) => c.required && outcomeState(net, st, c.outcome) === 'pending');
      // A broken input or tag decides it at once; otherwise it waits for every required input.
      if (!pending || judge(net, st, e).diverges) cand = { e, due: startDue(st, e), step: 'start' };
    }
    if (cand && (!best || cand.due < best.due)) best = cand;
  }
  return best;
}

// ---- Plot points ----

/** How well an alternative fits the current state; null when its requirement does not hold. */
export function alternativeFit(net: WorldNetwork, st: NetworkState, f: WorldFacts, a: PlotAlternative): number | null {
  if (a.requires && !exprHolds(net, st, f, a.requires)) return null;
  return (a.base ?? 0) + a.criteria.reduce((sum, c) => sum + (exprHolds(net, st, f, c.when) ? c.weight : 0), 0);
}

function chooseAlternative(net: WorldNetwork, st0: NetworkState, f: WorldFacts, p: PlotPointDef, day: number): { state: NetworkState; alternative: PlotAlternative } | null {
  let best: { a: PlotAlternative; fit: number } | null = null;
  for (const a of p.alternatives) {
    const fit = alternativeFit(net, st0, f, a);
    if (fit !== null && (!best || fit > best.fit)) best = { a, fit };
  }
  if (!best) return null;
  const { a } = best;
  let st: NetworkState = { ...st0, plotPoints: { ...st0.plotPoints, [p.id]: { alternative: a.id, day, toldTurn: null } } };
  for (const o of a.effects?.produces ?? []) st = setOutcome(st, o, 'produced', day);
  for (const o of a.effects?.breaks ?? []) if (st.outcomes[o]?.state !== 'produced') st = setOutcome(st, o, 'broken', day);
  for (const r of a.effects?.reschedule ?? []) {
    for (const id of r.events) {
      const e = eventDef(net, id);
      if (!e || isSettled(st, e) || st.events[id]?.status === 'underway') continue;
      const shift = r.toNow ? Math.min(0, day - worldDay(e.date)) + r.byDays : (st.shifts[id] ?? 0) + r.byDays;
      st = { ...st, shifts: { ...st.shifts, [id]: shift } };
    }
  }
  if (a.effects?.control?.length) st = { ...st, control: [...st.control, ...a.effects.control.map((c) => ({ place: c.place, side: c.side, day, note: c.note }))] };
  return { state: st, alternative: a };
}

function trackPlotPoints(net: WorldNetwork, st0: NetworkState, f: WorldFacts, day: number, changes: NetworkChange[]): NetworkState {
  let st = st0;
  for (const p of net.plotPoints) {
    if (st.plotPoints[p.id]) continue;
    if (p.appliesIf && !exprHolds(net, st, f, p.appliesIf)) continue;
    if (!exprHolds(net, st, f, p.tracker)) continue;
    const r = chooseAlternative(net, st, f, p, day);
    if (!r) continue;
    st = r.state;
    changes.push({ kind: 'alternative', id: p.id, note: `${p.id}: ${r.alternative.title}`, interrupt: true, seen: false });
  }
  return st;
}

// ---- The review ----

/** History before the campaign (or before the network's data existed): it stands as the lore records it. */
function standAsRecorded(net: WorldNetwork, st0: NetworkState, day: number): NetworkState {
  let st = st0;
  for (const e of eventOrder(net)) {
    if (st.events[e.id] || st.shifts[e.id] !== undefined || worldDay(e.date) > day) continue;
    // Events added to a running campaign's past still follow what that campaign broke.
    if (e.consumes.some((c) => c.required && outcomeState(net, st, c.outcome) === 'broken')) {
      st = record(st, e, { status: 'cancelled', day, endedDay: day, broken: e.consumes.filter((c) => outcomeState(net, st, c.outcome) === 'broken').map((c) => c.outcome), substitutes: [], toldTurn: null });
      for (const p of e.produces) st = setOutcome(st, p.outcome, 'broken', day);
      continue;
    }
    const underway = worldDay(e.endDate ?? e.date) > day;
    for (const p of e.produces) {
      // An outcome that needs a broken tag belongs to another history.
      if (underway && p.at !== 'start') continue;
      st = setOutcome(st, p.outcome, p.when?.broken ? 'broken' : 'produced', worldDay(e.date));
    }
    st = record(st, e, { status: underway ? 'underway' : 'standing', day: worldDay(e.date), endedDay: underway ? null : worldDay(e.endDate ?? e.date), broken: [], substitutes: [], toldTurn: 0 });
  }
  return st;
}

/** The state with everything before its cursor standing; a network not opened yet (an older save) opens at `day`. */
export const openNetwork = (net: WorldNetwork, st: NetworkState, day: number): NetworkState => {
  const cursor = st.cursorDay ?? day;
  const opened = standAsRecorded(net, st, cursor);
  return st.cursorDay === null ? { ...opened, cursorDay: cursor } : opened;
};

/**
 * Brings the network up to `day`: history stands, recorded facts break tags, due events start and settle in date order
 * (producers first), and plot points whose tracker holds choose their alternative.
 */
export function reviewNetwork(net: WorldNetwork, st0: NetworkState, f: WorldFacts, day: number): { state: NetworkState; changes: NetworkChange[] } {
  const changes: NetworkChange[] = [];
  let st = openNetwork(net, st0, day);
  const cursor = st.cursorDay ?? day;
  // Each step moves one event forward, so two steps per event is the most there can be.
  for (let guard = 0; guard <= net.events.length * 2 + 1; guard++) {
    st = latchTags(net, st, f, day, changes);
    st = trackPlotPoints(net, st, f, day, changes);
    const next = nextStep(net, st, day);
    if (!next) break;
    const { e, step } = next;
    const on = next.due > cursor ? next.due : day;
    const v = judge(net, st, e);
    if (step === 'start' && !v.diverges && endDue(st, e) > startDue(st, e)) {
      for (const p of e.produces) if (p.at === 'start' && !p.when?.broken) st = setOutcome(st, p.outcome, 'produced', on);
      st = record(st, e, { status: 'underway', day: on, endedDay: null, broken: v.broken, substitutes: pickSubstitutes(net, st, e, f), toldTurn: null });
      changes.push({ kind: 'started', id: e.id, note: `${e.id}: under way`, interrupt: e.interrupts === true, seen: true });
    } else {
      st = settle(net, st, e, v, f, on);
      const { status } = st.events[e.id]!;
      changes.push({ kind: 'settled', id: e.id, note: `${e.id}: ${status}`, interrupt: e.interrupts === true && step !== 'end' && status !== 'cancelled', seen: status !== 'cancelled' });
    }
  }
  // Due, but an input is not settled yet: recorded as waiting, so it is never mistaken for history.
  for (const e of net.events) if (!st.events[e.id] && startDue(st, e) <= day) st = record(st, e, { status: 'waiting', day: startDue(st, e), endedDay: null, broken: [], substitutes: [], toldTurn: 0 });
  return { state: { ...st, cursorDay: Math.max(day, cursor) }, changes };
}
