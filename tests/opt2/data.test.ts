// opt-2 G2, G4, H (audit U4, T1, T2, C5): save fixtures load through loadEnvelope; battles saved before m8-fixes migrate; the cold
// store; the review queue's cap; the NPC day hook keeps the slice's other fields; DUELISTS' rows per figure do not overlap.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLD_STORE } from '../../src/data/entities.config';
import { DUELISTS } from '../../src/data/duelists';
import { COMMAND_BASICS } from '../../src/data/tactics';
import { migrateBattlesV2 } from '../../src/features/battles';
import { emptyBattles } from '../../src/features/battles/battles';
import { loadEnvelope } from '../../src/persist/envelope';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { base, meet } from '../support/schemaSituations';

const DIR = 'tests/fixtures/saves';
const days = (s: GameState, n: number): GameState => advanceTime(REGISTRY, s, { seconds: n * 86_400, reason: 'time', source: 'turnDraft' }).state;

describe('H1: save fixtures', () => {
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json'));
  it('there is one for this build at least', () => expect(files).toContain('opt-2.json'));
  for (const f of files) {
    it(`${f} loads through loadEnvelope`, () => {
      const r = loadEnvelope(REGISTRY, JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')));
      expect(r.ok, r.ok ? '' : r.error).toBe(true);
      if (r.ok) expect(r.state.character.name).toBeTruthy();
    });
  }
});

describe('G2: battles saved before m8-fixes migrate (battles v2)', () => {
  it("an old ship battle's commander keeps the basics as known; a planning scene gets seenOnly and planKnows", () => {
    const old = { ...emptyBattles(), active: { role: 'commander', tactics: { known: ['exchange'], recognised: [] } }, planning: { known: ['frontalAssault'] } } as never;
    const m = migrateBattlesV2(old) as unknown as { active: { tactics: { known: string[]; seenOnly: string[] } }; planning: { seenOnly: string[]; planKnows: string[] } };
    expect(m.active.tactics.seenOnly).toEqual([]);
    for (const id of COMMAND_BASICS) expect(m.active.tactics.known).toContain(id);
    expect(m.planning).toMatchObject({ seenOnly: [], planKnows: ['frontalAssault'] });
  });
});

describe('H2: the cold store', () => {
  it("a thread closed a year keeps its last notes (what retrieval shows); older ones move to the threads' cold store", () => {
    let s = applyEvents(REGISTRY, base(), [{ type: 'threadOpened', title: 'The missing holocron', stakes: 'trust', entityRefs: [] }], { source: 'ai' }).state;
    const id = Object.keys(s.threads.byId)[0]!;
    for (let i = 0; i < 5; i++) s = applyEvents(REGISTRY, s, [{ type: 'threadProgressed', threadRef: id, note: `note ${i}` }], { source: 'ai' }).state;
    s = applyEvents(REGISTRY, s, [{ type: 'threadResolved', threadRef: id, outcome: 'resolved', note: 'found' }], { source: 'ai' }).state;
    const later = days(s, COLD_STORE.afterDays + 1);
    expect(later.threads.byId[id]!.notes).toEqual(['note 3', 'note 4', 'found']);
    expect(later.threads.cold?.[id]).toEqual(['note 0', 'note 1', 'note 2']);
  });

  it("a dead NPC unseen for a year moves its health to the NPCs' cold store; the slice's other fields stay", () => {
    const s0 = meet(base(), [{ name: 'Bela Tarn', role: 'jediKnight', faction: 'jediOrder' }]);
    const id = Object.keys(s0.npcs.byId)[0]!;
    const n = s0.npcs.byId[id]!;
    const dead: GameState = { ...s0, npcs: { ...s0.npcs, canonTraining: { 'lore:x': { day: 0, reason: 'masterKilled', recordedBy: 'engine' } }, byId: { [id]: { ...n, status: 'deceased', health: { vitalityLost: 3, wounds: [], lasting: [] } } } } };
    const later = days(dead, COLD_STORE.afterDays + 1);
    expect(later.npcs.byId[id]!.health).toBeNull();
    expect(later.npcs.cold?.[id]).toEqual({ vitalityLost: 3, wounds: [], lasting: [] });
    expect(later.npcs.canonTraining).toEqual(dead.npcs.canonTraining);
  });

  it('the review queue keeps every open item and at most the cap of closed ones (the oldest go)', () => {
    let s = base();
    for (let i = 0; i < COLD_STORE.reviewClosedMax + 5; i++) {
      s = applyEvents(REGISTRY, s, [{ type: 'reviewQueued', name: `Nobody ${i}`, context: 'test' }], { source: 'engine' }).state;
      const r = s.memory.review.at(-1)!;
      s = applyEvents(REGISTRY, s, [{ type: 'reviewResolved', reviewId: r.id, resolution: 'dismissed' }], { source: 'player' }).state;
    }
    s = applyEvents(REGISTRY, s, [{ type: 'reviewQueued', name: 'Still open', context: 'test' }], { source: 'engine' }).state;
    const closed = s.memory.review.filter((r) => r.status !== 'open');
    expect(closed).toHaveLength(COLD_STORE.reviewClosedMax);
    expect(closed[0]!.name).toBe('Nobody 5');
    expect(s.memory.review.some((r) => r.status === 'open' && r.name === 'Still open')).toBe(true);
  });
});

describe("G4: DUELISTS' dated rows", () => {
  it("one figure's rows are dated spans that do not overlap", () => {
    const by = new Map<string, { fromYear: number; toYear: number }[]>();
    for (const d of DUELISTS) by.set(d.canonId, [...(by.get(d.canonId) ?? []), d]);
    for (const [id, spans] of by) {
      const sorted = [...spans].sort((a, b) => a.fromYear - b.fromYear);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i]!.fromYear, id).toBeGreaterThan(sorted[i - 1]!.toYear);
    }
  });
});
