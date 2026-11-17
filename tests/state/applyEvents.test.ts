import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { applyEvents, eventOwners } from '../../src/state/applyEvents';
import { buildStateSchema, createInitialState } from '../../src/state/registryTools';
import type { BaseState, FeatureModule, InitCtx, Meta } from '../../src/state/types';

// Test-only features exercising the §3 rules (temp refs, order, caps, de-dup, emit depth).
interface Things {
  byId: Record<string, { name: string }>;
  links: [string, string][];
  log: string[];
}
interface Mood {
  choices: number;
  feelings: string[];
  rel: Record<string, number>;
  chain: number;
}
type TState = BaseState & { meta: Meta; things: Things; mood: Mood };

const things: FeatureModule<Things, TState> = {
  id: 'things',
  version: 1,
  initialState: () => ({ byId: {}, links: [], log: [] }),
  stateSchema: z.object({
    byId: z.record(z.string(), z.object({ name: z.string() })),
    links: z.array(z.tuple([z.string(), z.string()])),
    log: z.array(z.string()),
  }),
  events: {
    thingIntroduced: {
      schema: z.object({ type: z.literal('thingIntroduced'), key: z.string().optional(), name: z.string().min(1) }),
      sources: ['ai'],
      phase: 'create',
      handle: (slice, e) => {
        const id = `thing:${String(e['name']).toLowerCase()}`;
        return { slice: { ...slice, byId: { ...slice.byId, [id]: { name: String(e['name']) } }, log: [...slice.log, `create ${id}`] }, mintedId: id };
      },
    },
    thingsLinked: {
      schema: z.object({ type: z.literal('thingsLinked'), a: z.string(), b: z.string() }),
      sources: ['ai'],
      refFields: ['a', 'b'],
      handle: (slice, e) => {
        const a = String(e['a']);
        const b = String(e['b']);
        if (!slice.byId[a] || !slice.byId[b]) return { reject: 'unknown ref' };
        return { slice: { ...slice, links: [...slice.links, [a, b]], log: [...slice.log, `link ${a} ${b}`] } };
      },
    },
    tick: {
      schema: z.object({ type: z.literal('tick'), seconds: z.number().int().min(0) }),
      sources: ['ai'],
      phase: 'time',
      handle: (slice) => ({ slice: { ...slice, log: [...slice.log, 'tick'] }, notes: ['clamped'] }),
    },
  },
  selectors: {},
};

const mood: FeatureModule<Mood, TState> = {
  id: 'mood',
  version: 1,
  initialState: () => ({ choices: 0, feelings: [], rel: {}, chain: 0 }),
  stateSchema: z.object({ choices: z.number(), feelings: z.array(z.string()), rel: z.record(z.string(), z.number()), chain: z.number() }),
  events: {
    moralChoice: {
      schema: z.object({ type: z.literal('moralChoice'), weight: z.number().int().min(1).max(3) }),
      sources: ['ai'],
      handle: (s) => ({ slice: { ...s, choices: s.choices + 1 } }),
    },
    relationshipChanged: {
      schema: z.object({ type: z.literal('relationshipChanged'), npcRef: z.string(), delta: z.number().int().min(-3).max(3) }),
      sources: ['ai'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      handle: (s, e) => ({ slice: { ...s, rel: { ...s.rel, [String(e['npcRef'])]: (s.rel[String(e['npcRef'])] ?? 0) + Number(e['delta']) } } }),
    },
    engineOnly: {
      schema: z.object({ type: z.literal('engineOnly') }),
      sources: ['engine'],
      handle: (s) => ({ slice: s }),
    },
    chain: {
      schema: z.object({ type: z.literal('chain'), n: z.number().int() }),
      sources: ['ai', 'engine'],
      handle: (s, e) => {
        const n = Number(e['n']);
        return { slice: { ...s, chain: s.chain + 1 }, emit: n > 0 ? [{ type: 'chain', n: n - 1 }] : [] };
      },
    },
  },
  selectors: {},
};

const registry = [things, mood] as const;
const ctx: InitCtx = { campaignId: 'c', branchId: 'b', seed: 's', start: { day: 0, second: 0 }, character: { name: 'X', birthDay: -5000 } };
const fresh = (): TState => createInitialState<TState>(registry, ctx);

describe('applyEvents (architecture §3, §11)', () => {
  it('rejects malformed, unknown, wrong-source and schema-invalid events with reasons', () => {
    const r = applyEvents(registry, fresh(), [null, { type: 'nope' }, { type: 'engineOnly' }, { type: 'moralChoice', weight: 9 }], { source: 'ai' });
    expect(r.applied).toHaveLength(0);
    expect(r.rejected.map((x) => x.reason)).toEqual([
      'not an event object with a string type',
      'unknown event type nope',
      'source ai may not send engineOnly',
      expect.stringMatching(/^schema: weight/),
    ]);
  });

  it('temp refs: a later event may use a key created earlier in the same reply (D-32)', () => {
    const r = applyEvents(
      registry,
      fresh(),
      [
        { type: 'thingIntroduced', key: 'tmp:1', name: 'Ilum' },
        { type: 'thingIntroduced', key: 'tmp:2', name: 'Kyber' },
        { type: 'thingsLinked', a: 'tmp:1', b: 'tmp:2' },
      ],
      { source: 'ai' },
    );
    expect(r.rejected).toEqual([]);
    expect(r.state.things.links).toEqual([['thing:ilum', 'thing:kyber']]);
    expect(r.tempMap).toEqual({ 'tmp:1': 'thing:ilum', 'tmp:2': 'thing:kyber' });
  });

  it('temp refs: used before creation, never created, or created twice are rejected', () => {
    const r = applyEvents(
      registry,
      fresh(),
      [
        { type: 'thingsLinked', a: 'tmp:1', b: 'tmp:1' },
        { type: 'thingIntroduced', key: 'tmp:1', name: 'A' },
        { type: 'thingIntroduced', key: 'tmp:1', name: 'B' },
        { type: 'thingsLinked', a: 'tmp:1', b: 'tmp:9' },
      ],
      { source: 'ai' },
    );
    expect(r.rejected.map((x) => x.reason)).toEqual([
      'temp key tmp:1 created twice',
      'temp key tmp:1 used before its creation event',
      'temp key tmp:9 was never created',
    ]);
    expect(Object.keys(r.state.things.byId)).toEqual(['thing:a']);
  });

  it('apply order: creation, then time, then the rest in reply order', () => {
    const r = applyEvents(
      registry,
      fresh(),
      [
        { type: 'thingsLinked', a: 'thing:x', b: 'thing:x' },
        { type: 'tick', seconds: 5 },
        { type: 'thingIntroduced', name: 'X' },
      ],
      { source: 'ai' },
    );
    expect(r.state.things.log).toEqual(['create thing:x', 'tick', 'link thing:x thing:x']);
    expect(r.applied.find((a) => a.event.type === 'tick')?.notes).toEqual(['clamped']);
  });

  it('caps and de-duplication (D-36): first kept, deltas not summed', () => {
    const r = applyEvents(
      registry,
      fresh(),
      [
        { type: 'moralChoice', weight: 1 },
        { type: 'moralChoice', weight: 2 },
        { type: 'relationshipChanged', npcRef: 'npc:a', delta: 2 },
        { type: 'relationshipChanged', npcRef: 'npc:a', delta: 3 },
        { type: 'relationshipChanged', npcRef: 'npc:b', delta: -1 },
      ],
      { source: 'ai' },
    );
    expect(r.state.mood.choices).toBe(1);
    expect(r.state.mood.rel).toEqual({ 'npc:a': 2, 'npc:b': -1 });
    expect(r.rejected.map((x) => x.reason)).toEqual([
      expect.stringMatching(/^duplicate/),
      expect.stringMatching(/^cap exceeded: moralChoice/),
    ]);
  });

  it('rejects narrative events for an action the TurnDraft already resolved (D-29)', () => {
    const r = applyEvents(registry, fresh(), [{ type: 'relationshipChanged', npcRef: 'npc:a', delta: 1 }, { type: 'relationshipChanged', npcRef: 'npc:b', delta: 1 }], {
      source: 'ai',
      resolved: [{ eventType: 'relationshipChanged', target: 'npc:a' }],
    });
    expect(r.state.mood.rel).toEqual({ 'npc:b': 1 });
    expect(r.rejected[0]?.reason).toMatch(/already resolved/);
  });

  it('runs emitted events as engine source up to depth 4, deeper throws', () => {
    const ok = applyEvents(registry, fresh(), [{ type: 'chain', n: 4 }], { source: 'ai' });
    expect(ok.state.mood.chain).toBe(5);
    expect(ok.applied.slice(1).every((a) => a.source === 'engine')).toBe(true);
    expect(() => applyEvents(registry, fresh(), [{ type: 'chain', n: 5 }], { source: 'ai' })).toThrow(/deeper than 4/);
  });

  it('is pure: the input state is not mutated', () => {
    const s = fresh();
    const before = JSON.stringify(s);
    applyEvents(registry, s, [{ type: 'thingIntroduced', name: 'Z' }, { type: 'moralChoice', weight: 1 }], { source: 'ai' });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('registry tools', () => {
  it('every event type has exactly one owner', () => {
    expect(() => eventOwners(registry)).not.toThrow();
    const dup = { ...mood, id: 'mood2', events: { tick: things.events['tick']! } } as unknown as typeof mood;
    expect(() => eventOwners([things, dup])).toThrow(/two owners/);
  });

  it('builds a strict whole-state schema that accepts the initial state', () => {
    const schema = buildStateSchema(registry);
    const s = fresh();
    expect(schema.safeParse(s).success).toBe(true);
    expect(schema.safeParse({ ...s, extra: 1 }).success).toBe(false);
    expect(schema.safeParse({ ...s, meta: { ...s.meta, turn: -1 } }).success).toBe(false);
  });
});

describe('applyEvents ref resolution (D-13)', () => {
  // A feature that owns `thing:` IDs and resolves exact names.
  const owning: FeatureModule<Things, TState> = {
    ...things,
    refKind: 'thing',
    resolveRef: (s, ref) => {
      if (s.things.byId[ref]) return ref;
      const hit = Object.entries(s.things.byId).find(([, t]) => t.name.toLowerCase() === ref.toLowerCase());
      return hit ? hit[0] : null;
    },
    events: {
      ...things.events,
      thingsGrouped: {
        schema: z.object({ type: z.literal('thingsGrouped'), refs: z.array(z.string()) }),
        sources: ['ai'],
        refFields: ['refs'],
        handle: (slice, e) => ({ slice: { ...slice, log: [...slice.log, `group ${(e['refs'] as string[]).join(',')}`] } }),
      },
      thingsLinked: { ...things.events['thingsLinked']!, refKinds: { a: ['thing'], b: ['thing'] } },
    },
  };
  const reg = [owning, mood] as const;
  const start = (): TState => applyEvents(reg, createInitialState<TState>(reg, ctx), [{ type: 'thingIntroduced', name: 'Ilum' }], { source: 'ai' }).state;

  it('an exact alias resolves to the stable ID, with a note', () => {
    const r = applyEvents(reg, start(), [{ type: 'thingIntroduced', name: 'Kyber' }, { type: 'thingsLinked', a: 'ILUM', b: 'thing:kyber' }], { source: 'ai' });
    expect(r.rejected).toEqual([]);
    expect(r.state.things.links).toEqual([['thing:ilum', 'thing:kyber']]);
    expect(r.applied[1]!.notes[0]).toMatch(/matched thing:ilum by exact alias/);
  });

  it('an unknown scalar ref rejects the event and reports the name', () => {
    const r = applyEvents(reg, start(), [{ type: 'thingsLinked', a: 'thing:ilum', b: 'Dantooine' }], { source: 'ai' });
    expect(r.rejected[0]!.reason).toMatch(/unknown reference b "Dantooine"/);
    expect(r.unknownRefs).toEqual([{ name: 'Dantooine', field: 'b', eventType: 'thingsLinked' }]);
  });

  it('unknown array items are dropped, the event still applies', () => {
    const r = applyEvents(reg, start(), [{ type: 'thingsGrouped', refs: ['Ilum', 'Hoth'] }], { source: 'ai' });
    expect(r.rejected).toEqual([]);
    expect(r.state.things.log.at(-1)).toBe('group thing:ilum');
    expect(r.unknownRefs.map((u) => u.name)).toEqual(['Hoth']);
  });

  it('refKinds limit which features may resolve a field', () => {
    const r = applyEvents(reg, start(), [{ type: 'relationshipChanged', npcRef: 'Ilum', delta: 1 }], { source: 'ai' });
    // relationshipChanged has no refKinds, so any resolver may answer
    expect(r.state.mood.rel).toEqual({ 'thing:ilum': 1 });
  });
});
