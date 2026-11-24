// The narrator hand-off of the tag network (D-466): a structured summary of what code decided, with a heading for how it
// reads. No script per event: the narrator writes the scene. Only what has happened is in it (never a future event, and
// never a tag that still holds).
import { placeAmong } from '../../data/worldControl';
import type { WorldEventDef, WorldEventStatus, WorldNetwork } from '../../data/worldNetwork';
import { DIVERGENCES_SHOWN_MAX, TIMELINE_TOLD_MAX } from '../../data/worldNetwork.config';
import { formatDate } from '../../engine/calendar';
import { DIVERGED, outcomeState, tagKey } from './network';
import type { EventRecord, NetworkState } from './world';

export interface Handoff {
  /** New this turn. */
  news: string[];
  /** Standing facts of this campaign: history that changed. */
  standing: string[];
}

const HEADINGS: Readonly<Record<WorldEventStatus, string>> = {
  standing: 'ON RECORD',
  waiting: 'DELAYED',
  underway: 'UNDER WAY',
  recorded: 'HAPPENS AS RECORDED',
  substituted: 'HAPPENS AS RECORDED, IN OTHER HANDS',
  adjusted: 'STILL HAPPENS, ADJUSTED TO HOW THINGS STAND NOW',
  altered: 'HAPPENS DIFFERENTLY (diverged)',
  cancelled: 'DOES NOT HAPPEN (diverged)',
};

const outcomeText = (id: string): string => id.slice(2).replace(/_/g, ' ');

/** Why an event differs: broken conditions, people lost, inputs that never came (named by the event they belong to). */
function differences(net: WorldNetwork, e: WorldEventDef, r: EventRecord): string[] {
  const replaced = new Set(r.substitutes.map((s) => s.role));
  return r.broken
    .filter((id) => !replaced.has(id))
    .map((id) => {
      const cond = e.conditions.find((c) => c.id === id);
      if (cond) return cond.brokenText;
      const role = e.roles.find((x) => x.id === id);
      if (role) return `${role.label} is gone`;
      const from = net.events.find((x) => x.produces.some((p) => p.outcome === id));
      return from ? `"${from.title}" did not bring about: ${outcomeText(id)}` : `no ${outcomeText(id)}`;
    });
}

function eventLine(net: WorldNetwork, st: NetworkState, e: WorldEventDef, r: EventRecord, here: readonly string[]): string {
  const places = e.places ?? [];
  const where = places.length ? `, ${places.some((p) => placeAmong(p, [], here)) ? 'here' : 'news from afar'}: ${places.join(', ')}` : '';
  const diverged = DIVERGED.includes(r.status);
  const parts = [`[${HEADINGS[r.status]}] ${e.title} (${formatDate(r.endedDay ?? r.day)}${where})`];
  if (r.status === 'cancelled') parts.push('it was to come about and now will not');
  else parts.push(`${diverged ? 'on record' : 'what happened'}: ${e.summary}`);
  const stood = r.substitutes.map((s) => `${e.roles.find((x) => x.id === s.role)?.label ?? s.role} replaced by ${s.name ?? 'another of similar standing'}`);
  if (stood.length) parts.push(`roles: ${stood.join('; ')}`);
  const why = differences(net, e, r);
  if (why.length) parts.push(`changed by: ${why.join('; ')}`);
  if (diverged) {
    const still = e.produces.filter((p) => outcomeState(net, st, p.outcome) === 'produced').map((p) => outcomeText(p.outcome));
    // An outcome that only exists when something breaks was never on record.
    const never = e.produces.filter((p) => !p.when?.broken && outcomeState(net, st, p.outcome) === 'broken').map((p) => outcomeText(p.outcome));
    if (still.length) parts.push(`still true: ${still.join(', ')}`);
    if (never.length) parts.push(`never came: ${never.join(', ')}`);
  }
  const leads = e.roles.filter((x) => x.protagonist).map((x) => x.label);
  if (leads.length && r.status !== 'cancelled') parts.push(`${leads.join(', ')}: an NPC, never the player character`);
  return parts.join('. ');
}

interface Item {
  id: string;
  day: number;
  line: string;
  /** What the story must not miss comes first when there is more than one turn can carry. */
  weight: number;
}

/** Everything new, at most TIMELINE_TOLD_MAX, in date order (the rest wait a turn). */
function newItems(net: WorldNetwork, st: NetworkState, here: readonly string[]): Item[] {
  const items: Item[] = [];
  for (const p of net.plotPoints) {
    const chosen = st.plotPoints[p.id];
    const alt = p.alternatives.find((a) => a.id === chosen?.alternative);
    if (chosen && alt && chosen.toldTurn === null) items.push({ id: p.id, day: chosen.day, weight: 2, line: [`[HISTORY TURNS: ${alt.heading}] ${p.title}: ${alt.title}`, ...alt.parameters].join('. ') });
  }
  for (const e of net.events) {
    const r = st.events[e.id];
    if (r && r.toldTurn === null) items.push({ id: e.id, day: r.endedDay ?? r.day, weight: DIVERGED.includes(r.status) ? 1 : 0, line: eventLine(net, st, e, r, here) });
    for (const c of e.conditions) {
      const t = st.tags[tagKey(e.id, c.id)];
      if (t && t.toldTurn === null) items.push({ id: tagKey(e.id, c.id), day: t.day, weight: 2, line: `[BROKEN IN PLAY] ${c.brokenText}` });
    }
  }
  return items
    .sort((a, b) => b.weight - a.weight || a.day - b.day)
    .slice(0, TIMELINE_TOLD_MAX)
    .sort((a, b) => a.day - b.day);
}

/** The ids the hand-off's news carries (marked told once the narration commits). */
export const untoldIds = (net: WorldNetwork, st: NetworkState): string[] => newItems(net, st, []).map((i) => i.id);

export function timelineHandoff(net: WorldNetwork, st: NetworkState, here: readonly string[]): Handoff {
  const turns = net.plotPoints.flatMap((p) => {
    const alt = p.alternatives.find((a) => a.id === st.plotPoints[p.id]?.alternative);
    return alt ? [`${p.title}: ${alt.title}`] : [];
  });
  const gone = net.events
    .flatMap((e) => {
      const r = st.events[e.id];
      return r && DIVERGED.includes(r.status) ? [{ day: r.day, line: `${e.title} (${r.status === 'cancelled' ? 'did not happen' : 'happened differently'})` }] : [];
    })
    .sort((a, b) => b.day - a.day)
    .slice(0, DIVERGENCES_SHOWN_MAX);
  return { news: newItems(net, st, here).map((i) => i.line), standing: [...turns, ...gone.map((g) => g.line)] };
}

/** The lines as they go into the STATE block; none when the network has nothing to say. */
export function handoffLines(h: Handoff): string[] {
  return [
    ...(h.news.length ? [`Timeline (decided by the engine; narrate it as the character would see or hear of it, invent no other outcome): ${h.news.join(' | ')}`] : []),
    ...(h.standing.length ? [`History changed in this campaign (LORE describing these as recorded is void; never bring them back): ${h.standing.join('; ')}`] : []),
  ];
}
