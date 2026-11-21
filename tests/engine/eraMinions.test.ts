// D-213 (combat pass 2, issue 5): minion kinds are era-gated. A kind asked for outside its years becomes its era's kind
// (droids a war droid, troopers a line trooper) with a note, by the narrator's combatStarted and by /fight alike.
import { describe, expect, it } from 'vitest';
import { MINION_ERA_FALLBACK, MINION_KINDS, minionKindForYear, minionKindInEra } from '../../src/data/npcGen.config';
import { DROID_MINION_KINDS } from '../../src/data/forceResistance.config';
import type { DuelState } from '../../src/engine/duel';
import { applyEvents } from '../../src/state/applyEvents';
import { REGISTRY } from '../../src/state/registry';
import type { CombatActionInput } from '../../src/turn/record';
import { resolveTurn } from '../../src/turn/resolve';
import { CLONE_WARS_DATE } from '../support/dates';
import { devCharacter } from '../support/fightHarness';

describe('the kind-by-era table (D-213)', () => {
  it.each([
    ['battleDroid', -3653, 'warDroid'],
    ['battleDroid', -22, 'battleDroid'],
    ['battleDroid', -32, 'battleDroid'],
    ['battleDroid', -10, 'warDroid'],
    ['superBattleDroid', -32, 'warDroid'],
    ['superBattleDroid', -20, 'superBattleDroid'],
    ['droideka', 4, 'warDroid'],
    ['cloneTrooper', -3653, 'trooper'],
    ['cloneTrooper', -19, 'cloneTrooper'],
    ['stormtrooper', -22, 'trooper'],
    ['stormtrooper', 0, 'stormtrooper'],
    ['stormtrooper', 130, 'stormtrooper'],
    ['sithTrooper', -3653, 'sithTrooper'],
    ['sithTrooper', -3956, 'sithTrooper'],
    ['sithTrooper', -22, 'trooper'],
    ['skytrooper', -3630, 'skytrooper'],
    ['skytrooper', -3653, 'warDroid'],
    ['warDroid', -3997, 'warDroid'],
    ['trooper', -3653, 'trooper'],
    ['mandalorian', -22, 'mandalorian'],
  ])('%s in %i -> %s', (kind, year, want) => {
    expect(minionKindForYear(kind, year).kind).toBe(want);
  });
  it('every fallback chain ends at an era-neutral kind, and every droid kind is a droid for the Force rules', () => {
    // A fallback may itself be era-gated (D-320: Sith acolyte -> Dark Acolyte -> Dark Jedi), but every chain ends at a
    // kind that exists in every era.
    for (const start of Object.keys(MINION_ERA_FALLBACK)) {
      let to = MINION_ERA_FALLBACK[start]!;
      for (let i = 0; i < 4 && MINION_ERA_FALLBACK[to] && MINION_KINDS.find((k) => k.id === to)?.eras; i++) to = MINION_ERA_FALLBACK[to]!;
      expect(MINION_KINDS.find((k) => k.id === to)?.eras).toBeUndefined();
    }
    for (const id of ['battleDroid', 'superBattleDroid', 'droideka', 'warDroid', 'skytrooper']) expect(DROID_MINION_KINDS).toContain(id);
  });
  it('the note says what changed', () => {
    expect(minionKindForYear('battleDroid', -3653).note).toBe('no B1 battle droids in 3653 BBY: war droids instead (D-213)');
    expect(minionKindForYear('battleDroid', -22).note).toBeNull();
    expect(minionKindInEra('trooper', -20000)).toBe(true);
  });
});

describe('through the turn (D-213)', () => {
  it('the pass-2 case: "four war droids" in 3,653 BBY asked as B1s fight as war droids, numbered 1 to 4 after the duelist', async () => {
    let s = await devCharacter('padawan', 16, { year: -3653, month: 1, day: 1 });
    s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: 'Sith Duelist', species: 'human', faction: 'sithEmpire', role: 'sithLord', ageApprox: 35, description: 'a Sith duelist' }], { source: 'ai' }).state;
    const sith = Object.values(s.npcs.byId).find((n) => n.name === 'Sith Duelist')!.id;
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [sith], minionGroups: [{ kind: 'battleDroid', count: 4 }], stakes: 'lethal', terrainTags: ['debris'] }], { source: 'ai' }).state;
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput });
    const names = (r.state.combat.active!.duel as DuelState).opponents.map((o) => o.name);
    expect(names).toEqual(['Sith Duelist', 'War droid 1', 'War droid 2', 'War droid 3', 'War droid 4']);
    expect(r.draft.combat!.notes).toContain('no B1 battle droids in 3653 BBY: war droids instead (D-213)');
  });
  it('in the Clone Wars the same request fields B1 battle droids', async () => {
    let s = await devCharacter('knight', 30, CLONE_WARS_DATE);
    s = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [], minionGroups: [{ kind: 'battleDroid', count: 2 }], stakes: 'serious', terrainTags: ['flatFloor'] }], { source: 'ai' }).state;
    const r = resolveTurn(REGISTRY, s, null, { beat: { action: 'narrate' } as CombatActionInput });
    expect((r.state.combat.active!.duel as DuelState).opponents.map((o) => o.name)).toEqual(['B1 battle droid 1', 'B1 battle droid 2']);
  });
});
