// Captivity (Jared, 2026-11-24; D-471): the engine alone ends it. An escape the player attempts against the captors'
// security, a rescue by allies over time, a real fight won while held, or the 14-day limit.
import { describe, expect, it } from 'vitest';
import { BLOCKADES } from '../../src/data/blockades';
import { CAPTIVITY_LIMIT_DAYS, ESCAPE, RESCUE, TRANSFER } from '../../src/data/captivity.config';
import { absDayFromDate } from '../../src/engine/calendar';
import { blockadeStateAt } from '../../src/engine/blockade';
import { seedRng } from '../../src/engine/rng';
import { applyEscape, beginCaptivity, blockadeSecurity, captivityDay, escapeRating, fightSecurity, rescueChance, type Captivity } from '../../src/features/world/captivity';
import { selectEscape, selectWorldIdsToTell } from '../../src/features/world/selectors';
import { advanceTime } from '../../src/state/advanceTime';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import type { Registry } from '../../src/state/types';
import { makeEstimator } from '../../src/ai/tokenRatio';
import type { Intent } from '../../src/ai/schemas/intent';
import { selectCaptors, stateBlock } from '../../src/turn/context';
import { escapeChoices } from '../../src/turn/escape';
import { expandChoice } from '../../src/turn/expandChoice';
import { resolveTurn } from '../../src/turn/resolve';

const START = absDayFromDate({ year: -1032, month: 1, day: 1 });
const FAST: Registry<GameState> = REGISTRY.map((f) => {
  if (f.id === 'world') return f;
  const { onTimeAdvanced: _hook, ...rest } = f;
  return rest;
});
const fresh = (path: 'jedi' | 'outsider' = 'jedi'): GameState =>
  createInitialState<GameState>(FAST, {
    campaignId: 'c',
    branchId: 'b',
    seed: 'cap',
    start: { day: START, second: 8 * 3600 },
    character: { name: 'Kael', birthDay: START - 25 * 368, path, archetype: path === 'jedi' ? 'jediGuardian' : 'smuggler', ...(path === 'jedi' ? { mainFormId: 'soresu', trainingStartAge: 4 } : {}) },
    rank: path === 'jedi' ? 'knight' : 'career',
  });
const began = (security = 60, source: 'fight' | 'blockade' = 'fight') => ({ type: 'captivityBegan', source, sourceId: 'fight-1', group: '4 line troopers', kind: 'trooper', names: [], weapon: null, security, atAbs: START * 86_400 + 8 * 3600 });
const held = (s = fresh(), security = 60): GameState => applyEvents(FAST, s, [began(security)], { source: 'engine' }).state;
const pass = (s: GameState, days: number): GameState => advanceTime(FAST, s, { seconds: days * 86_400, reason: 't', source: 'turnDraft' }).state;
const friend = (s: GameState, name: string, role: string, times: number): GameState => {
  let x = applyEvents(FAST, s, [{ type: 'npcIntroduced', name, species: 'human', faction: 'civilian', role, ageApprox: 30, description: '' }], { source: 'ai' }).state;
  const id = Object.values(x.npcs.byId).find((n) => n.name === name)!.id;
  for (let i = 0; i < times; i++) x = applyEvents(FAST, x, [{ type: 'relationshipChanged', npcRef: id, delta: 3, reason: 'x' }], { source: 'ai' }).state;
  return x;
};
const escape: Intent = { actionType: 'other', targets: [], references: [], unknownNames: [], escape: true };

describe('the captors\' security', () => {
  it('a blockade\'s picket strength and alertness carry over', () => {
    const s = blockadeStateAt(BLOCKADES[0]!, absDayFromDate({ year: -3661, month: 1, day: 1 }));
    expect(blockadeSecurity({ ...s, strength: 5 })).toBeGreaterThan(blockadeSecurity(s));
    expect(blockadeSecurity({ ...s, alertness: 5 })).toBeGreaterThan(blockadeSecurity(s));
    expect(blockadeSecurity({ ...s, strength: 1, alertness: 1 })).toBeLessThan(blockadeSecurity(s));
  });
  it('after a fight, more captors and a named one hold better', () => {
    expect(fightSecurity(6, false)).toBeGreaterThan(fightSecurity(1, false));
    expect(fightSecurity(1, true)).toBeGreaterThan(fightSecurity(1, false));
  });
});

describe('the narrator decides nothing', () => {
  it('no AI event begins or ends a captivity, and moving does not free anyone', () => {
    const s = held();
    for (const e of [began(), { type: 'captivityEnded', how: 'escaped', withShip: false }, { type: 'captivityEscapeTried', success: true, margin: 9 }, { type: 'captivityTransferred' }]) expect(applyEvents(FAST, s, [e], { source: 'ai' }).applied, e.type).toEqual([]);
    const moved = applyEvents(FAST, s, [{ type: 'locationIntroduced', name: 'A cell', kind: 'room', region: 'x', description: '', moveHere: true }], { source: 'ai' }).state;
    expect(selectCaptors(moved)).toMatchObject({ group: '4 line troopers' });
    expect(stateBlock(moved, makeEstimator(4)).text).toMatch(/CAPTIVE: .*Only the engine ends the captivity/);
  });
});

describe('escape', () => {
  it('is a check the player chooses, against the security; the engine frees the character or not', () => {
    const s = held();
    expect(escapeChoices(s).map((c) => c.label)).toEqual(['Attempt to escape']);
    expect(expandChoice(escapeChoices(s)[0]!, () => null).intent.escape).toBe(true);
    const results = new Set<boolean>();
    for (let i = 0; i < 40; i++) {
      const r = resolveTurn(FAST, { ...s, meta: { ...s.meta, rngState: seedRng(`e${i}`) } }, escape);
      expect(r.draft.checks.length).toBe(1);
      expect(r.draft.checks[0]).toMatchObject({ label: 'Escape', rating: 60 });
      expect(r.state.world.captivity === null).toBe(r.draft.checks[0]!.success);
      results.add(r.draft.checks[0]!.success);
    }
    expect(results).toEqual(new Set([true, false]));
  });
  it('uses the skill the player names when it is a way out, else their best', () => {
    const s = held();
    expect(selectEscape(s, 'charisma')!.skillId).toBe('charisma');
    expect(selectEscape(s, 'soresu')!.skillId).not.toBe('soresu');
  });
  it('a failure takes the day, and a clear or bad one sharpens the captors', () => {
    const c = beginCaptivity({ ...(began() as unknown as Captivity) });
    const after = (margin: number): Captivity => applyEscape(c, { success: false, margin }, 10).captivity;
    expect([after(-1).penalty, after(-5).penalty, after(-9).penalty]).toEqual([0, ESCAPE.clearPenalty, ESCAPE.badPenalty]);
    expect([after(-1).nextTryDay, after(-9).nextTryDay]).toEqual([10 + ESCAPE.perDays, 10 + ESCAPE.badWaitDays]);
    expect(escapeRating(after(-9))).toBe(escapeRating(c) + ESCAPE.badPenalty);
    let s = held();
    for (let i = 0; i < 60 && s.world.captivity; i++) {
      const r = resolveTurn(FAST, { ...held(), meta: { ...s.meta, rngState: seedRng(`f${i}`) } }, escape);
      if (!r.draft.checks[0]!.success) s = r.state;
      if (s.world.captivity!.nextTryDay > s.clock.now.day) break;
    }
    expect(escapeChoices(s)).toEqual([]);
    const again = resolveTurn(FAST, s, escape);
    expect([again.draft.checks.length, again.draft.report.join()]).toEqual([0, expect.stringMatching(/too watchful/)]);
  });
  it('a decisive escape takes an impounded ship', () => {
    const c = beginCaptivity({ ...(began() as unknown as Captivity) });
    expect([applyEscape(c, { success: true, margin: 8 }, 1).withShip, applyEscape(c, { success: true, margin: 3 }, 1).withShip]).toEqual([true, false]);
  });
  it('is refused for someone who is not a prisoner', () => {
    expect(resolveTurn(FAST, fresh(), escape).draft.report.join()).toMatch(/not a prisoner/);
  });
});

describe('rescue', () => {
  it('comes from allies: the side, a master, friends, and more from a crew; nobody means no chance', () => {
    const c = beginCaptivity({ ...(began() as unknown as Captivity) });
    const loner = fresh('outsider');
    expect(rescueChance(loner, c)).toBe(0);
    expect(rescueChance(fresh(), c)).toBeCloseTo(RESCUE.faction, 9);
    const one = friend(loner, 'Tam', 'merchant', 2);
    expect(rescueChance(one, c)).toBeCloseTo(RESCUE.friend, 9);
    expect(rescueChance(friend(loner, 'Tam', 'merchant', 5), c)).toBeCloseTo(RESCUE.closeFriend, 9);
    expect(rescueChance(friend(loner, 'Tam', 'pilot', 2), c)).toBeCloseTo(RESCUE.friend * RESCUE.crewFactor, 9);
    expect(rescueChance(friend(one, 'Bo', 'merchant', 2), c)).toBeGreaterThan(rescueChance(one, c));
  });
  it('security makes it less likely, within its limits', () => {
    const c = beginCaptivity({ ...(began() as unknown as Captivity) });
    const at = (security: number): number => rescueChance(fresh(), { ...c, security });
    expect(at(30)).toBeGreaterThan(at(60));
    expect(at(110)).toBeLessThan(at(60));
    expect(at(110)).toBeGreaterThanOrEqual(RESCUE.faction * RESCUE.minFactor);
  });
  it('is rolled over the days, and the narration is told once', () => {
    let s = fresh();
    for (let i = 0; i < 6; i++) s = friend(s, `Friend ${i}`, 'pilot', 5);
    const c = held(s, 20);
    let freed: GameState | null = null;
    for (let i = 0; i < 60 && !freed; i++) {
      const x = pass({ ...c, meta: { ...c.meta, rngState: seedRng(`r${i}`) } }, 12);
      if (!x.world.captivity) freed = x;
    }
    expect(freed!.world.captivityNews!.text).toMatch(/allies of the player character broke them out/);
    expect(stateBlock(freed!, makeEstimator(4)).text).toMatch(/Captivity \(decided by the engine/);
    const told = applyEvents(FAST, freed!, [{ type: 'worldEventsTold', ids: selectWorldIdsToTell(freed!), turn: 4 }], { source: 'engine' }).state;
    expect(stateBlock(told, makeEstimator(4)).text).not.toMatch(/Captivity \(decided/);
  });
});

describe('the limit', () => {
  it('after 14 days the captors release, ransom (a debt) or transfer; a transfer is a new, harder term, once', () => {
    const seen = new Set<string>();
    const s = held(fresh('outsider'));
    expect(pass(s, CAPTIVITY_LIMIT_DAYS - 1).world.captivity).not.toBeNull();
    for (let i = 0; i < 60; i++) {
      const x = pass({ ...s, meta: { ...s.meta, rngState: seedRng(`l${i}`) } }, CAPTIVITY_LIMIT_DAYS + 1);
      if (x.world.captivity) {
        seen.add('transferred');
        expect(x.world.captivity).toMatchObject({ transfers: 1, security: 60 + TRANSFER.securityUp });
        const y = pass(x, CAPTIVITY_LIMIT_DAYS + 1);
        expect(y.world.captivity).toBeNull();
      } else if (x.world.blockades.ledger.some((l) => /ransom/.test(l.reason))) seen.add('ransomed');
      else seen.add('released');
    }
    expect(seen).toEqual(new Set(['released', 'ransomed', 'transferred']));
    const spent: Captivity = { ...beginCaptivity({ ...(began() as unknown as Captivity) }), transfers: TRANSFER.max };
    for (let i = 0; i < 100; i++) expect('transferred' in captivityDay(s, spent, spent.termDay + 20, seedRng(`t${i}`))).toBe(false);
  });
});

describe('fights', () => {
  it('a real fight won while held frees the character; the fight that took them, or a spar, does not', () => {
    const s = held();
    const won = (id: string, stakes: 'lethal' | 'spar'): GameState => ({ ...s, combat: { ...s.combat, last: { id, stakes, outcome: 'won', reason: 'x', exchanges: 1, seconds: 5, playerFate: null, recorded: false, skillId: 'soresu', day: s.clock.now.day, duel: { opponents: [] } } } });
    expect(advanceTime(FAST, won('fight-2', 'lethal'), { seconds: 60, reason: 't', source: 'turnDraft' }).state.world.captivity).toBeNull();
    // A fight won earlier the same day does not count either.
    const before = applyEvents(FAST, { ...fresh(), combat: won('fight-0', 'lethal').combat }, [{ ...began(), source: 'blockade', sourceId: 'x' }], { source: 'engine' }).state;
    for (const x of [won('fight-1', 'lethal'), won('fight-3', 'spar'), before]) expect(advanceTime(FAST, x, { seconds: 60, reason: 't', source: 'turnDraft' }).state.world.captivity).not.toBeNull();
  });
});
