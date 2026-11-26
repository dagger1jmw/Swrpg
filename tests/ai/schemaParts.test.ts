// m8-ground Part A (D-520): the narrative schema in parts. Every situation's schema stays under the cap; the core and the largest
// combination are measured; no situation loses an event it needs (each event legal before the split is sent when its situation
// holds: someone present, or the player's words naming it); the new dedicated events behave as the droid event's words did.
import { describe, expect, it } from 'vitest';
import { keywordsUsed, SUPPORTED_KEYWORDS, toGeminiSchema } from '../../src/ai/jsonSchema';
import { SCHEMA_SIZE_CAP_CHARS } from '../../src/ai/models.config';
import { composeNarrativeSchema, narrativeEventTypes } from '../../src/ai/schemas/compose';
import { activeParts, MAX_ACTIVITY_PARTS, SCHEMA_PARTS } from '../../src/ai/schemas/parts';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import type { GameState } from '../../src/state/gameState';
import type { NarrativeTurnInfo } from '../../src/state/types';
import { base, meet, ownShip, situations } from '../support/schemaSituations';

const size = (s: GameState, turn: NarrativeTurnInfo): number => JSON.stringify(toGeminiSchema(composeNarrativeSchema(REGISTRY, s, turn).wire)).length;
const ALL = new Set<string>(SCHEMA_PARTS);
/** Before the split: every event its own legality test allows (D-15), with every part (the old schema per state). */
const before = (s: GameState, turn: NarrativeTurnInfo): string[] => narrativeEventTypes(REGISTRY, s, { ...turn, parts: ALL });
const after = (s: GameState, turn: NarrativeTurnInfo): string[] => narrativeEventTypes(REGISTRY, s, turn);
const partOf = new Map<string, string>(REGISTRY.flatMap((f) => Object.entries(f.events).filter(([, d]) => d.narrative).map(([t, d]) => [t, d.part ?? 'core'] as [string, string])));

/** The player's words that bring each activity part (the cue a real turn gives when the situation comes up). */
const CUE: Readonly<Record<string, string>> = { goods: 'I buy it', ship: 'to my ship', training: 'I train', command: 'the battle plan' };

describe('the narrative schema in parts (m8-ground Part A, D-520)', () => {
  const list = situations();

  it.each(list.map((x) => [x.name, x] as const))('%s: under the cap, Gemini keywords only', (_n, x) => {
    const json = toGeminiSchema(composeNarrativeSchema(REGISTRY, x.state, x.turn).wire);
    for (const k of keywordsUsed(json)) expect(SUPPORTED_KEYWORDS.has(k), k).toBe(true);
    expect(JSON.stringify(json).length).toBeLessThan(SCHEMA_SIZE_CAP_CHARS);
  });

  it('the core alone and the largest combination, measured', () => {
    const rows = list.map((x) => ({ name: x.name, size: size(x.state, x.turn), parts: [...activeParts(x.state, x.turn)].join('+') }));
    const coreMax = Math.max(...list.map((x) => size(x.state, { ...x.turn, parts: new Set(['core']) })));
    const largest = rows.reduce((a, b) => (b.size > a.size ? b : a));
    console.log(`core alone (largest state): ${coreMax}; largest situation: ${largest.name} ${largest.size} (${largest.parts}); cap ${SCHEMA_SIZE_CAP_CHARS}`);
    expect(coreMax).toBeLessThan(SCHEMA_SIZE_CAP_CHARS * 0.75);
    expect(largest.size).toBeLessThan(SCHEMA_SIZE_CAP_CHARS);
  });

  it('activity parts are capped, so naming everything at once never breaks the cap', () => {
    const x = list.find((s) => s.name === 'everything at once')!;
    const parts = [...activeParts(x.state, x.turn)].filter((p) => ['goods', 'ship', 'training', 'command'].includes(p));
    expect(parts.length).toBe(MAX_ACTIVITY_PARTS);
    expect(size(x.state, x.turn)).toBeLessThan(SCHEMA_SIZE_CAP_CHARS);
  });

  it('no situation loses an event it needs: each event legal before is sent once its situation holds', () => {
    const lost: string[] = [];
    // A fight about to start, a fight, a battle and an open planning scene are no time for shopping, ship business or training
    // (D-520): those parts are off until it is over (the planning scene's own part is the scene); the core still goes.
    const busy = (s: GameState): boolean => s.combat.active !== null || s.combat.pending !== null || s.battles.active !== null || s.battles.ground !== null || s.battles.planning !== null;
    for (const x of list) {
      const now = new Set(after(x.state, x.turn));
      for (const t of before(x.state, x.turn)) {
        if (now.has(t)) continue;
        const part = partOf.get(t)!;
        if (busy(x.state) && ['goods', 'ship', 'training', 'command'].includes(part)) continue;
        // The situation comes up: someone is here (people), or the player's words name it (an activity part).
        const there = part === 'people' ? meet(x.state, [{ name: 'Someone Here', role: 'civilian', faction: 'civilian' }]) : x.state;
        const turn = CUE[part] ? { ...x.turn, text: CUE[part], intentAction: undefined } : x.turn;
        if (!new Set(after(there, turn as NarrativeTurnInfo)).has(t)) lost.push(`${x.name}: ${t} (${part})`);
      }
    }
    expect(lost).toEqual([]);
  });

  it('each situation gets the events its scenes use', () => {
    const need: Readonly<Record<string, readonly string[]>> = {
      'alone in the wilds': ['npcIntroduced', 'locationIntroduced', 'combatStarted', 'hazardOccurred', 'factLearned', 'timeElapsed'],
      'a conversation': ['relationshipChanged', 'npcStatusChanged', 'holdBegun', 'promotionProposed'],
      'the Temple with the master': ['routineRequested', 'tacticStudied', 'promotionProposed', 'forbiddenPermissionGranted'],
      'a train turn': ['routineRequested', 'tacticStudied'],
      'a cantina deal': ['trade', 'money', 'living', 'itemMoved'],
      'buying alone': ['trade', 'money'],
      'the spaceport with the ship': ['shipAct'],
      'aboard a ship': ['shipAct'],
      'a briefing': ['groundBattlePlanned'],
      'a canon figure': ['npcCanonDiverged', 'npcTrainingChanged'],
      'a ship battle': ['factLearned'],
      'a ground battle': ['factLearned'],
    };
    for (const [name, events] of Object.entries(need)) {
      const x = list.find((s) => s.name === name)!;
      const got = new Set(after(x.state, x.turn));
      for (const t of events) expect(got.has(t), `${name}: ${t}`).toBe(true);
    }
  });

  it('situational fields: ships where ships are, sparring stakes in training, allies elsewhere with someone here', () => {
    const fields = (s: GameState, turn: NarrativeTurnInfo): string[] => {
      const w = toGeminiSchema(composeNarrativeSchema(REGISTRY, s, turn).wire) as { properties: { events: { items: { anyOf?: { properties: Record<string, unknown> }[] } } } };
      const cs = (w.properties.events.items.anyOf ?? []).find((x) => (x.properties['type'] as { enum: string[] }).enum[0] === 'combatStarted');
      return Object.keys(cs?.properties ?? {});
    };
    const k = base();
    expect(fields(k, { timeAdvancedByDraft: false, text: 'I walk' })).not.toContain('ships');
    expect(fields(k, { timeAdvancedByDraft: false, text: 'I walk' })).not.toContain('sparringMode');
    expect(fields(ownShip(k), { timeAdvancedByDraft: false, text: 'pirates attack my freighter' })).toContain('ships');
    expect(fields(k, { timeAdvancedByDraft: false, text: 'we spar', intentAction: 'train' })).toContain('sparringMode');
    expect(fields(meet(k, [{ name: 'Ally', role: 'soldier', faction: 'republic' }]), { timeAdvancedByDraft: false })).toContain('engagedElsewhereRefs');
    // A field left out of the wire still validates when sent (the parse schema is the full one).
    const r = applyEvents(REGISTRY, k, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'thug', count: 2 }], stakes: 'spar', terrainTags: [], sparringMode: 'controlled' }], { source: 'ai' });
    expect(r.rejected).toEqual([]);
  });

  it('the dedicated ship, tactic and item events do what the droid event\'s words did (a straight move)', () => {
    const k = base();
    const viaEvent = applyEvents(REGISTRY, k, [{ type: 'shipAct', what: 'salvaged a Dynamic-class freighter' }], { source: 'ai' }).state;
    const viaWords = applyEvents(REGISTRY, k, [{ type: 'droid', what: 'ship: salvaged a Dynamic-class freighter' }], { source: 'ai' }).state;
    expect(Object.values(viaEvent.ships.ships).map((x) => x.classId)).toEqual(Object.values(viaWords.ships.ships).map((x) => x.classId));
    const t1 = applyEvents(REGISTRY, k, [{ type: 'tacticStudied', what: 'the Corellian Slip from a veteran' }], { source: 'ai' }).state;
    const t2 = applyEvents(REGISTRY, k, [{ type: 'droid', what: 'tactic: the Corellian Slip from a veteran' }], { source: 'ai' }).state;
    expect(Object.keys(t1.tactics.known)).toEqual(Object.keys(t2.tactics.known));
  });

  it('the turn\'s parts are worked out once: what the schema sends is what the reply may carry', () => {
    const x = list.find((s) => s.name === 'a cantina deal')!;
    const parts = activeParts(x.state, x.turn);
    expect(after(x.state, { ...x.turn, parts })).toEqual(after(x.state, x.turn));
  });
});
