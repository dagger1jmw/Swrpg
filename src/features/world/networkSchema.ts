// The Zod schema of the tag network's data, and the cross-reference checks a network must pass before it ships (D-466).
import { z } from 'zod';
import { ACTION_TYPES } from '../../data/checks.config';
import { FACTIONS, NPC_ROLES } from '../../data/entities.config';
import { flagDef } from '../../data/flags';
import { COMBAT_STAKES } from '../../data/progression.config';
import { isSkillId } from '../../data/skills';
import { CONTROL_SIDES } from '../../data/worldControl';
import {
  BREAK_EFFECTS,
  TEST_STRENGTHS,
  WORLD_EVENT_STATUSES,
  WORLD_GUARDS,
  type Lead,
  type StateTest,
  type WorldEventDef,
  type WorldExpr,
  type WorldNetwork,
  type WorldTest,
} from '../../data/worldNetwork';
import { isValidDate } from '../../engine/calendar';
import { DUELISTS } from '../../data/duelists';
import { ARCHETYPES } from '../../data/archetypes';
import { WORLD_POST_IDS, type WorldPostId } from '../../data/worldPosts';
import { DUEL_TIERS, type Who } from '../../data/who';
import { PREREQUISITES_NEEDED } from '../../data/worldNetwork.config';
import { eventOrder, sceneFlag, worldDay } from './network';

const outcomeId = z.string().regex(/^O\.[a-z0-9_]+$/);
const eventId = z.string().regex(/^E\.[~<>]?[0-9]+\.[a-z0-9_]+$/);
const plotPointId = z.string().regex(/^PP-\d+$/);
const canonId = z.string().regex(/^lore:/);
const text = z.string().min(1).max(300);
const list = <T extends z.ZodType>(t: T) => z.array(t).min(1).readonly();

const worldDate = z
  .strictObject({
    year: z.number().int(),
    month: z.number().int().min(1).max(12).optional(),
    day: z.number().int().min(1).max(31).optional(),
    circa: z.boolean().optional(),
    placed: z.enum(['lore', 'invented']).optional(),
  })
  .refine((d) => d.day === undefined || d.month !== undefined, 'a day needs a month')
  .refine((d) => isValidDate({ year: d.year, month: d.month ?? 1, day: d.day ?? 1 }), 'not a calendar date');

const strength = z.enum(TEST_STRENGTHS).optional();
const during = z.boolean().optional();
const who = list(
  z
    .strictObject({
      sides: list(z.enum(FACTIONS)).optional(),
      archetypes: list(z.string()).optional(),
      minRank: z.enum(['padawan', 'knight', 'master']).optional(),
      minStanding: z.number().min(0).max(100).optional(),
      trustOf: list(canonId).optional(),
      posts: list(z.enum(WORLD_POST_IDS as [WorldPostId, ...WorldPostId[]])).optional(),
      at: list(text).optional(),
      minTier: z.enum(DUEL_TIERS).optional(),
      flags: list(z.string()).optional(),
    })
    .refine((w) => Object.values(w).some((x) => x !== undefined), 'an empty gate'),
).optional();
const npcTest = z.strictObject({ kind: z.literal('npc'), canonId, state: z.enum(['dead', 'captured', 'lost']), strength, during });
const controlTest = z.strictObject({ kind: z.literal('control'), place: text, side: z.enum(CONTROL_SIDES), is: z.boolean().optional(), strength, during });
const flagTest = z.strictObject({ kind: z.literal('flag'), flag: z.string(), strength, during });
const outcomeTest = z.strictObject({ kind: z.literal('outcome'), outcome: outcomeId, state: z.enum(['produced', 'broken']), strength, during });
const actionTest = z.strictObject({
  kind: z.literal('action'),
  actionTypes: list(z.enum(ACTION_TYPES)),
  skills: list(z.string()).optional(),
  places: list(text).optional(),
  canonIds: list(canonId).optional(),
  strength,
  during,
});
const fightTest = z.strictObject({
  kind: z.literal('fight'),
  canonIds: list(canonId).optional(),
  factions: list(z.enum(FACTIONS)).optional(),
  places: list(text).optional(),
  minStakes: z.enum(COMBAT_STAKES).optional(),
  hold: z.enum(['brief', 'long']).optional(),
  strength,
  during,
});
const knownTest = z.strictObject({ kind: z.literal('known'), tag: z.string(), strength, during });
const stateTest = z.discriminatedUnion('kind', [npcTest, controlTest, flagTest, outcomeTest, knownTest]);
const worldTest = z.discriminatedUnion('kind', [npcTest, controlTest, flagTest, outcomeTest, knownTest, actionTest, fightTest]);
const lead = z
  .strictObject({ canonIds: list(canonId).optional(), places: list(text).optional(), sites: list(text).optional(), facts: list(stateTest).optional() })
  .refine((l) => Object.values(l).some((x) => x !== undefined), 'an empty lead');
const leads = list(lead).optional();
const prerequisite = z.strictObject({ id: z.string().regex(/^know\.[a-z0-9_]+$/), text, tests: list(worldTest), leads, who });
const scene = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: text,
  event: eventId,
  guard: z.enum(WORLD_GUARDS),
  fromYear: z.number().int(),
  toYear: z.number().int().optional(),
  on: list(z.discriminatedUnion('kind', [actionTest, fightTest])),
  requires: list(stateTest).optional(),
  leads,
  who,
});

const roleTag = z.strictObject({
  id: z.string().regex(/^role\.[a-z0-9_]+$/),
  label: text,
  kind: z.enum(['replaceable', 'crucial']),
  canonId: canonId.optional(),
  npcName: text.optional(),
  protagonist: z.boolean().optional(),
  closed: z.boolean().optional(),
  faction: z.enum(FACTIONS).optional(),
  roles: list(z.enum(NPC_ROLES)).optional(),
  breakIf: z.array(stateTest).readonly().optional(),
  onBreak: z.enum(BREAK_EFFECTS).optional(),
});

const conditionTag = z.strictObject({
  id: z.string().regex(/^cond\.[a-z0-9_]+$/),
  text,
  brokenText: text,
  crucial: z.boolean(),
  guard: z.enum(WORLD_GUARDS),
  breakIf: z.array(worldTest).readonly(),
  leads,
  who,
  prerequisites: list(prerequisite).optional(),
  window: z.union([z.literal('underway'), z.strictObject({ fromYear: z.number().int() })]).optional(),
  onBreak: z.enum(BREAK_EFFECTS).optional(),
});

export const worldEventDefSchema = z.strictObject({
  id: eventId,
  title: text,
  summary: text,
  date: worldDate,
  endDate: worldDate.optional(),
  places: list(text).optional(),
  roles: z.array(roleTag).readonly(),
  conditions: z.array(conditionTag).readonly(),
  consumes: z.array(z.strictObject({ outcome: outcomeId, required: z.boolean(), onBreak: z.enum(BREAK_EFFECTS).optional() })).readonly(),
  produces: z
    .array(
      z.strictObject({
        outcome: outcomeId,
        at: z.enum(['start', 'end']).optional(),
        when: z.strictObject({ intact: list(z.string()).optional(), broken: list(z.string()).optional() }).optional(),
        control: z.strictObject({ place: text, side: z.enum(CONTROL_SIDES), note: text }).optional(),
      }),
    )
    .readonly(),
  plotPoint: plotPointId.optional(),
  closed: z.boolean().optional(),
  interrupts: z.boolean().optional(),
  source: text,
});

const expr: z.ZodType = z.lazy(() =>
  z.union([
    z.strictObject({ outcome: outcomeId, is: z.enum(['produced', 'broken']) }),
    z.strictObject({ tag: z.string(), is: z.enum(['broken', 'intact']) }),
    z.strictObject({ event: eventId, is: list(z.enum(WORLD_EVENT_STATUSES)) }),
    z.strictObject({ test: stateTest }),
    z.strictObject({ alternative: z.string(), of: plotPointId }),
    z.strictObject({ all: list(expr) }),
    z.strictObject({ any: list(expr) }),
    z.strictObject({ not: expr }),
    z.strictObject({ atLeast: z.number().int().min(1), of: list(expr) }),
  ]),
);

const alternative = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: text,
  heading: text,
  parameters: z.array(text).readonly(),
  requires: expr.optional(),
  base: z.number().optional(),
  criteria: z.array(z.strictObject({ when: expr, weight: z.number() })).readonly(),
  effects: z
    .strictObject({
      produces: list(outcomeId).optional(),
      breaks: list(outcomeId).optional(),
      reschedule: list(z.strictObject({ events: list(eventId), byDays: z.number().int(), toNow: z.boolean().optional() })).optional(),
      control: list(z.strictObject({ place: text, side: z.enum(CONTROL_SIDES), note: text })).optional(),
    })
    .optional(),
});

export const worldNetworkSchema = z.strictObject({
  events: z.array(worldEventDefSchema).readonly(),
  plotPoints: z.array(z.strictObject({ id: plotPointId, title: text, events: list(eventId), appliesIf: expr.optional(), tracker: expr, alternatives: list(alternative) })).readonly(),
  standing: z.array(z.strictObject({ outcome: outcomeId, note: text })).readonly(),
  scenes: z.array(scene).readonly().optional(),
});

interface Refs {
  outcomes: string[];
  tags: string[];
  events: string[];
  tests: StateTest[];
  alternatives: [plotPoint: string, alternative: string][];
}

function exprRefs(e: WorldExpr): Refs {
  const out: Refs = { outcomes: [], tags: [], events: [], tests: [], alternatives: [] };
  const walk = (x: WorldExpr): void => {
    if ('outcome' in x) out.outcomes.push(x.outcome);
    else if ('tag' in x) out.tags.push(x.tag);
    else if ('event' in x) out.events.push(x.event);
    else if ('test' in x) out.tests.push(x.test);
    else if ('alternative' in x) out.alternatives.push([x.of, x.alternative]);
    else if ('all' in x) x.all.forEach(walk);
    else if ('any' in x) x.any.forEach(walk);
    else if ('not' in x) walk(x.not);
    else x.of.forEach(walk);
  };
  walk(e);
  return out;
}

const dupes = (xs: readonly string[]): string[] => [...new Set(xs.filter((x, i) => xs.indexOf(x) !== i))];

/** Every problem in a network: shape, unknown references, AI-settable flags, loops. Empty = it can ship. */
export function networkProblems(net: WorldNetwork): string[] {
  const parsed = worldNetworkSchema.safeParse(net);
  if (!parsed.success) return parsed.error.issues.map((i) => `schema: ${i.path.join('.')}: ${i.message}`);
  const out: string[] = [];
  const byId = new Map(net.events.map((e) => [e.id, e]));
  const producer = new Map<string, WorldEventDef>();
  for (const id of dupes(net.events.map((e) => e.id))) out.push(`duplicate event ${id}`);
  for (const id of dupes(net.plotPoints.map((p) => p.id))) out.push(`duplicate plot point ${id}`);
  for (const e of net.events) {
    for (const p of e.produces) {
      const other = producer.get(p.outcome);
      if (other) out.push(`${p.outcome} is produced twice (${other.id}, ${e.id})`);
      producer.set(p.outcome, e);
    }
  }
  const standing = new Set(net.standing.map((s) => s.outcome));
  for (const o of standing) if (producer.has(o)) out.push(`${o} is standing, but ${producer.get(o)!.id} produces it`);
  const fromAlternatives = net.plotPoints.flatMap((p) => p.alternatives.flatMap((a) => a.effects?.produces ?? []));
  const known = (o: string): boolean => producer.has(o) || standing.has(o) || fromAlternatives.includes(o);

  // D-489: no premonitions; a fight with a top duelist is the figure's own (the power bar is on the person).
  const top = new Set(DUELISTS.map((d) => d.canonId));
  const checkTest = (where: string, t: WorldTest): void => {
    if (t.kind === 'action' && t.skills?.includes('forceSense')) out.push(`${where}: Force sense never counts (no premonitions)`);
    if (t.kind === 'fight' && t.hold && !(t.canonIds ?? []).some((id) => top.has(id))) out.push(`${where}: only a top duelist is held off`);
    if (t.kind === 'outcome' && !known(t.outcome)) out.push(`${where}: unknown outcome ${t.outcome}`);
    if (t.kind === 'flag') {
      const def = flagDef(t.flag);
      if (!def) out.push(`${where}: unregistered flag ${t.flag}`);
      // The narrator never breaks a tag directly: a flag it may set cannot count.
      else if (def.sources.includes('ai')) out.push(`${where}: flag ${t.flag} can be set by the AI`);
      if (t.flag.startsWith('sceneOutcome:') && !(net.scenes ?? []).some((x) => sceneFlag(x.id) === t.flag)) out.push(`${where}: no scene sets ${t.flag}`);
    }
    if (t.kind === 'known') {
      const [ev, tag] = t.tag.split('#');
      if (!byId.get(ev ?? '')?.conditions.some((c) => c.id === tag && c.prerequisites?.length)) out.push(`${where}: ${t.tag} has no foreknowledge to have`);
    }
    if (t.kind === 'action') {
      for (const s of t.skills ?? []) if (!isSkillId(s)) out.push(`${where}: unknown skill ${s}`);
      if (!t.places && !t.canonIds) out.push(`${where}: an action test needs a place or a person, or any check would count`);
    }
    if (t.kind === 'fight' && !t.places && !t.canonIds) out.push(`${where}: a fight test needs a place or a person, or any fight would count`);
  };
  // D-468: an action on a place alone starts from a lead recorded in play, or scores nothing.
  const checkLeads = (where: string, tests: readonly WorldTest[], own: readonly Lead[] | undefined): void => {
    if (!own?.length && tests.some((t) => t.kind === 'action' && !t.canonIds)) out.push(`${where}: an action on a place needs a lead recorded in play`);
    for (const l of own ?? []) for (const t of l.facts ?? []) checkTest(`${where} lead`, t);
  };
  // D-491: whatever the player can do to a condition asks who the player is.
  const asksPlayer = (t: WorldTest): boolean => t.kind === 'action' || t.kind === 'fight' || t.kind === 'npc';
  const checkWho = (where: string, w: readonly Who[] | undefined): void => {
    for (const x of w ?? []) {
      for (const a of x.archetypes ?? []) if (!ARCHETYPES.some((y) => y.id === a)) out.push(`${where}: unknown archetype ${a}`);
      for (const fl of x.flags ?? []) {
        const def = flagDef(fl);
        if (!def) out.push(`${where}: unregistered flag ${fl}`);
        else if (def.sources.includes('ai')) out.push(`${where}: flag ${fl} can be set by the AI`);
        if (fl.startsWith('sceneOutcome:') && !(net.scenes ?? []).some((y) => sceneFlag(y.id) === fl)) out.push(`${where}: no scene sets ${fl}`);
      }
    }
  };
  const checkExpr = (where: string, e: WorldExpr): void => {
    const r = exprRefs(e);
    for (const o of r.outcomes) if (!known(o)) out.push(`${where}: unknown outcome ${o}`);
    for (const t of r.tags) {
      const [ev, tag] = t.split('#');
      const def = byId.get(ev ?? '');
      if (!def || ![...def.roles, ...def.conditions].some((x) => x.id === tag)) out.push(`${where}: unknown tag ${t}`);
    }
    for (const id of r.events) if (!byId.has(id)) out.push(`${where}: unknown event ${id}`);
    for (const t of r.tests) checkTest(where, t);
    for (const [pp, id] of r.alternatives) if (!net.plotPoints.some((p) => p.id === pp && p.alternatives.some((x) => x.id === id))) out.push(`${where}: unknown alternative ${pp}:${id}`);
  };

  for (const e of net.events) {
    for (const id of dupes([...e.roles, ...e.conditions].map((t) => t.id))) out.push(`${e.id}: duplicate tag ${id}`);
    if (e.endDate && worldDay(e.endDate) < worldDay(e.date)) out.push(`${e.id}: ends before it starts`);
    if (e.plotPoint && !net.plotPoints.some((p) => p.id === e.plotPoint)) out.push(`${e.id}: unknown plot point ${e.plotPoint}`);
    for (const c of e.consumes) {
      const from = producer.get(c.outcome);
      if (!known(c.outcome)) out.push(`${e.id}: consumes ${c.outcome}, which nothing produces`);
      if (c.required && from && worldDay(from.date) > worldDay(e.endDate ?? e.date)) out.push(`${e.id}: consumes ${c.outcome} before ${from.id} happens`);
    }
    for (const r of e.roles) {
      for (const t of r.breakIf ?? []) checkTest(`${e.id}#${r.id}`, t);
      if (r.kind === 'crucial' && !r.canonId && !r.npcName && !r.breakIf?.length) out.push(`${e.id}#${r.id}: a crucial role nothing can break`);
      if (r.kind === 'replaceable' && r.onBreak) out.push(`${e.id}#${r.id}: a replaceable role never changes its event`);
    }
    for (const c of e.conditions) {
      const pre = c.prerequisites ?? [];
      for (const t of [...c.breakIf, ...pre.flatMap((q) => q.tests)]) checkTest(`${e.id}#${c.id}`, t);
      checkWho(`${e.id}#${c.id}`, c.who);
      for (const q of pre) checkWho(`${e.id}#${c.id} ${q.id}`, q.who);
      if (!c.who && (c.breakIf.some(asksPlayer) || pre.some((q) => !q.who && q.tests.some(asksPlayer)))) out.push(`${e.id}#${c.id}: the player can break it, so it must say who the player is`);
      if (e.closed && [...c.breakIf, ...pre.flatMap((q) => q.tests)].some(asksPlayer)) out.push(`${e.id}#${c.id}: a closed event has no step inside it`);
      if ([...c.breakIf, ...pre.flatMap((q) => q.tests)].some((t) => t.during) && !e.endDate) out.push(`${e.id}#${c.id}: a test during the event, but the event has no end date`);
      if (!pre.length) checkLeads(`${e.id}#${c.id}`, c.breakIf, c.leads);
      for (const q of pre) checkLeads(`${e.id}#${c.id} ${q.id}`, q.tests, q.leads);
      for (const id of dupes(pre.map((q) => q.id))) out.push(`${e.id}#${c.id}: duplicate prerequisite ${id}`);
      if (c.guard === 'high' && c.breakIf.some((t) => t.kind === 'action') && !pre.length) out.push(`${e.id}#${c.id}: a high guard an action can break needs a prerequisite (foreknowledge)`);
      // Two steps that are really the same step are one: each needs a test the other does not have (D-467 [1]).
      if (c.guard === 'veryHigh') {
        const distinct = new Set(pre.map((q) => JSON.stringify([...q.tests].map((t) => JSON.stringify(t)).sort())));
        if (distinct.size < PREREQUISITES_NEEDED.veryHigh) out.push(`${e.id}#${c.id}: a very high guard needs ${PREREQUISITES_NEEDED.veryHigh} distinct prerequisites`);
      }
      if (c.window === 'underway' && !e.endDate) out.push(`${e.id}#${c.id}: open only while under way, but the event has no end date`);
    }
    // A replaceable role never changes anything downstream, so no outcome may depend on one.
    const refs = new Set([...e.roles.filter((r) => r.kind === 'crucial').map((r) => r.id), ...e.conditions.map((c) => c.id), ...e.consumes.map((c) => c.outcome)]);
    for (const p of e.produces) {
      for (const ref of [...(p.when?.intact ?? []), ...(p.when?.broken ?? [])]) if (!refs.has(ref)) out.push(`${e.id}: ${p.outcome} depends on ${ref}, which is not a crucial role, a condition or an input of the event`);
    }
  }
  for (const id of dupes((net.scenes ?? []).map((x) => x.id))) out.push(`duplicate scene ${id}`);
  for (const x of net.scenes ?? []) {
    if (!byId.has(x.event)) out.push(`scene ${x.id}: unknown event ${x.event}`);
    else if (byId.get(x.event)!.closed) out.push(`scene ${x.id}: a closed event has no step inside it`);
    checkWho(`scene ${x.id}`, x.who);
    if (!x.who) out.push(`scene ${x.id}: it must say who the player is`);
    for (const t of [...x.on, ...(x.requires ?? [])]) checkTest(`scene ${x.id}`, t);
    if (!(x.requires ?? []).some((t) => t.kind === 'known')) checkLeads(`scene ${x.id}`, x.on, x.leads);
  }
  for (const p of net.plotPoints) {
    for (const id of p.events) if (!byId.has(id)) out.push(`${p.id}: unknown event ${id}`);
    for (const id of dupes(p.alternatives.map((a) => a.id))) out.push(`${p.id}: duplicate alternative ${id}`);
    checkExpr(p.id, p.tracker);
    if (p.appliesIf) checkExpr(p.id, p.appliesIf);
    if (p.alternatives.every((a) => a.requires)) out.push(`${p.id}: every alternative has a requirement, so none may fit`);
    for (const a of p.alternatives) {
      const where = `${p.id}:${a.id}`;
      if (a.requires) checkExpr(where, a.requires);
      for (const c of a.criteria) checkExpr(where, c.when);
      for (const o of a.effects?.produces ?? []) if (producer.has(o) || standing.has(o)) out.push(`${where}: produces ${o}, which the recorded timeline produces (a broken tag is never reconnected)`);
      for (const o of a.effects?.breaks ?? []) if (!known(o)) out.push(`${where}: unknown outcome ${o}`);
      for (const r of a.effects?.reschedule ?? []) for (const id of r.events) if (!byId.has(id)) out.push(`${where}: unknown event ${id}`);
    }
  }
  if (!out.length && eventOrder(net).length !== net.events.length) out.push('the events consume each other in a loop');
  return out;
}
