// opt-2 C (audit D-narrator): an unknown teacher teaches only the basics; a teacher must be in the scene; a teacher the reply itself
// introduces (a narrator-made officer or general) does not teach above the basics just by being introduced; a known NPC's own
// Tactics decides.
import { describe, expect, it } from 'vitest';
import { selectNpcLevel } from '../../src/features/npcs/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { base, meet } from '../support/schemaSituations';

const ev = (s: GameState, events: object[]) => applyEvents(REGISTRY, s, events, { source: 'ai' });
const knows = (s: GameState, id: string): boolean => Boolean(s.tactics.known[id]);
const idOf = (s: GameState, name: string): string => Object.values(s.npcs.byId).find((n) => n.name === name)!.id;
/** A civilian, who knows none of the tactics used below (flanking is a basic one). */
const soldier = (): GameState => base({ path: 'career', archetype: 'civilian' });

describe('C: who can teach', () => {
  it('a teacher the game does not know teaches the basics only', () => {
    const s = soldier();
    expect(knows(s, 'flanking')).toBe(false);
    const a = ev(s, [{ type: 'tacticStudied', what: 'taught flanking by Sergeant Kell' }]);
    expect(knows(a.state, 'flanking')).toBe(true);
    const b = ev(s, [{ type: 'tacticStudied', what: 'taught the pincer by Sergeant Kell' }]);
    expect(knows(b.state, 'pincer')).toBe(false);
    expect(b.rejected[0]!.reason).toMatch(/only the basics/);
    // No teacher named and no master present: the same.
    expect(knows(ev(s, [{ type: 'tacticStudied', what: 'taught the pincer' }]).state, 'pincer')).toBe(false);
  });

  it('a known teacher must be in the scene', () => {
    const s0 = meet(soldier(), [{ name: 'General Varo', role: 'officer', faction: 'republic' }]);
    const away: GameState = { ...s0, pacing: { ...s0.pacing, scene: { ...s0.pacing.scene, presentNpcIds: [] } } };
    const r = ev(away, [{ type: 'tacticStudied', what: 'taught flanking by General Varo' }]);
    expect(knows(r.state, 'flanking')).toBe(false);
    expect(r.rejected[0]!.reason).toMatch(/not in the scene/);
  });

  it('a general the narrator introduces in the same reply teaches the basics only; once met, its own Tactics decides', () => {
    const s = soldier();
    const same = ev(s, [
      { type: 'npcIntroduced', name: 'General Kessar', species: 'human', faction: 'republic', role: 'general', description: 'a veteran commander' },
      { type: 'tacticStudied', what: 'taught the pincer by General Kessar' },
    ]);
    expect(knows(same.state, 'pincer')).toBe(false);
    // Met before this reply and in the scene: the NPC's own Tactics (an officer's line) decides.
    const met = meet(soldier(), [{ name: 'General Kessar', role: 'officer', faction: 'republic' }]);
    const tactics = selectNpcLevel(met, idOf(met, 'General Kessar'), 'tactics');
    const later = ev(met, [{ type: 'tacticStudied', what: 'taught the pincer by General Kessar' }]);
    expect(knows(later.state, 'pincer')).toBe(tactics >= 50);
  });

  it('a known NPC with little Tactics cannot teach a standard tactic', () => {
    const met = meet(soldier(), [{ name: 'Archivist Noor', role: 'scholar', faction: 'republic' }]);
    const t = selectNpcLevel(met, idOf(met, 'Archivist Noor'), 'tactics');
    expect(t).toBeLessThan(20);
    const r = ev(met, [{ type: 'tacticStudied', what: 'taught the ambush by Archivist Noor' }]);
    expect(knows(r.state, 'ambush')).toBe(false);
    expect(r.rejected[0]!.reason).toMatch(/Tactics \d+\) cannot teach/);
  });
});
