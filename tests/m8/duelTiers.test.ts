// m8-world-d2 (D-493): the tier numbers against canon figures, and planning against a top duelist.
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { duelistBar, HOLD, PLAN, TOP_TIER } from '../../src/data/duelists';
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState } from '../../src/engine/duel';
import { canPlan, planReady } from '../../src/engine/who';
import { selectPlanReady } from '../../src/features/combat/selectors';
import { selectCanPlan, selectDuelTier, selectWorldFacts } from '../../src/features/world/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createInitialState } from '../../src/state/registryTools';
import { resolveTurn } from '../../src/turn/resolve';

interface Line {
  combat: number;
  forceControl: number;
  willpower: number;
}
const line = (l: Readonly<Record<string, number>>): Line => ({ combat: Math.max(0, ...FORM_IDS.map((f) => l[f] ?? 0)), forceControl: l['forceControl'] ?? 0, willpower: l['willpower'] ?? 0 });
const clears = (x: Line): boolean => x.combat >= TOP_TIER.combat && x.forceControl >= TOP_TIER.forceControl && x.willpower >= TOP_TIER.willpower;
const l = (combat: number, forceControl: number, willpower: number): Line => ({ combat, forceControl, willpower });

describe('the tier numbers against canon figures (a check, reported; the numbers stay as they are)', () => {
  // The character sheets (Docs/SWRPG lore/SW_Characters_11 to _13): best form, Force Control, Willpower.
  const SHEETS: Record<string, Line> = {
    'Yoda': l(100, 100, 104),
    'Mace Windu': l(98, 92, 94),
    'Sidious (Chancellor)': l(100, 110, 112),
    'Palpatine (Emperor)': l(100, 128, 128),
    'Vader (Yavin)': l(100, 107, 88),
    'Vader (Endor)': l(104, 116, 102),
    'Kit Fisto': l(84, 84, 82),
    'Plo Koon': l(80, 84, 84),
    'Ki-Adi-Mundi': l(80, 82, 84),
    'Shaak Ti': l(80, 82, 84),
    'Saesee Tiin': l(78, 78, 82),
    'Eeth Koth': l(76, 78, 84),
    'Even Piell': l(78, 78, 84),
    'Adi Gallia': l(78, 80, 82),
    'Oppo Rancisis': l(76, 80, 86),
    'Yarael Poof': l(74, 80, 84),
    'Luminara Unduli': l(80, 82, 84),
    'Cin Drallig': l(86, 84, 84),
  };
  const MUST = ['Yoda', 'Mace Windu', 'Sidious (Chancellor)', 'Palpatine (Emperor)', 'Vader (Yavin)', 'Vader (Endor)'];
  it('on the sheets: who must clear it, and who must not', () => {
    const wrong = Object.entries(SHEETS).filter(([n, x]) => clears(x) !== MUST.includes(n)).map(([n]) => n);
    expect(wrong).toEqual(['Vader (Yavin)']); // Willpower 88
  });
  it('on this roster: Revan clears it and Malgus does not, on either scale; no other Master does', () => {
    const anchor = (id: string): { levels: Record<string, number>; authored: Record<string, number> } => CANON_BY_ID.get(id)!.anchors.find((a) => a.complete) as never;
    const both = (id: string): boolean[] => [clears(line(anchor(id).authored)), clears(line(anchor(id).levels))];
    expect(both('lore:revan')).toEqual([true, true]);
    expect(both('lore:darth-malgus')).toEqual([false, false]);
    expect([line(anchor('lore:darth-malgus').authored), line(anchor('lore:darth-malgus').levels)]).toEqual([l(92, 95, 94), l(88, 70, 94)]);
    // Nobody who is not on a list clears it.
    const cleared = CANON_NPCS.filter((n) => n.anchors.some((a) => a.complete && clears(line(a.levels)))).map((n) => n.canonId);
    expect([...new Set(cleared)].sort()).toEqual(['lore:revan', 'lore:vitiate']);
  });
});

const game = (archetype: 'bountyHunter' | 'mandalorian' | 'soldier' | 'jediGuardian', blaster: number, seed = 'plan'): GameState => {
  const day = absDayFromDate({ year: -3655, month: 3, day: 1 });
  const jedi = archetype === 'jediGuardian';
  let s = createInitialState<GameState>(REGISTRY, {
    campaignId: 'c1',
    branchId: 'b1',
    seed,
    start: { day, second: 9 * 3600 },
    character: { name: 'Kael', birthDay: day - 50 * 368, path: jedi ? 'jedi' : 'career', archetype, ...(jedi ? { mainFormId: 'soresu' } : {}), trainingStartAge: jedi ? 4 : 14 } as never,
    startingXp: Object.fromEntries(['blaster', 'stealth', 'tracking', 'tactics', 'endurance', 'agility'].map((k) => [k, xpForLevel(blaster)])),
    rank: jedi ? 'knight' : 'career',
  });
  s = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', name: 'Old Quarry', kind: 'building', region: 'Hutta', description: 'x', moveHere: true }], { source: 'ai' }).state;
  const c = CANON_BY_ID.get('lore:darth-malgus')!;
  s = applyEvents(REGISTRY, s, [{ type: 'npcIntroduced', name: c.name, species: 'human', faction: c.faction, role: 'sithLord', ageApprox: 45, description: '' }], { source: 'ai' }).state;
  return applyEvents(REGISTRY, s, [{ type: 'npcCanonLinked', npcRef: foe(s), canonId: 'lore:darth-malgus' }], { source: 'engine' }).state;
};
const foe = (s: GameState): string => Object.values(s.npcs.byId).find((n) => n.name === 'Darth Malgus')!.id;
const laid = (s: GameState, kind: string, success = true): GameState => {
  const r = applyEvents(REGISTRY, s, [{ type: 'planTried', npcRef: foe(s), kind, success, total: 20 }], { source: 'engine' });
  expect(r.rejected).toEqual([]);
  return r.state;
};
const tomorrow = (s: GameState, days = 1): GameState => ({ ...s, clock: { ...s.clock, now: { ...s.clock.now, day: s.clock.now.day + days } } });
const fight = (s0: GameState): GameState => {
  let s = applyEvents(REGISTRY, s0, [{ type: 'fightBegun', fromPending: false, opponentRefs: [foe(s0)], stakes: 'lethal' }], { source: 'engine' }).state;
  for (let i = 0; i < 6 && s.combat.active; i++) s = applyEvents(REGISTRY, s, [{ type: 'combatAction', action: 'resolve' }], { source: 'player' }).state;
  return s;
};

describe('non-Force fighters and planning', () => {
  it('in an outright fight nobody without the Force reaches Master, however skilled', () => {
    for (const a of ['bountyHunter', 'mandalorian', 'soldier'] as const) expect(selectDuelTier(game(a, 120)), a).toBe('below');
  });
  it('only the most skilled hunters and Mandalorians can plan', () => {
    expect((['bountyHunter', 'mandalorian', 'soldier'] as const).map((a) => selectCanPlan(game(a, 95)))).toEqual([true, true, false]);
    expect([selectCanPlan(game('bountyHunter', 60)), selectCanPlan(game('jediGuardian', 95))]).toEqual([false, false]);
    expect([canPlan({ forceUser: false, archetype: 'mandalorian', combat: PLAN.combat }), canPlan({ forceUser: false, archetype: 'mandalorian', combat: PLAN.combat - 0.1 })]).toEqual([true, false]);
  });
  it('a plan is two kinds laid against that foe, here, in the last days', () => {
    const x = (kind: string, over: object = {}) => ({ npcId: 'a', kind, day: 10, here: true, success: true, ...over });
    expect(planReady([x('ambush')], 'a', 10)).toBe(false);
    expect(planReady([x('ambush'), x('ambush')], 'a', 10)).toBe(false);
    expect(planReady([x('ambush'), x('trap')], 'a', 10)).toBe(true);
    expect(planReady([x('ambush'), x('trap')], 'b', 10)).toBe(false);
    expect(planReady([x('ambush'), x('trap', { success: false })], 'a', 10)).toBe(false);
    expect(planReady([x('ambush'), x('trap', { here: false })], 'a', 10)).toBe(false);
    expect([planReady([x('ambush'), x('trap')], 'a', 10 + PLAN.days), planReady([x('ambush'), x('trap')], 'a', 11 + PLAN.days)]).toEqual([true, false]);
  });
  it('the narrator cannot record a line, nor can anyone who could not plan', () => {
    const s = game('bountyHunter', 95);
    expect(applyEvents(REGISTRY, s, [{ type: 'planTried', npcRef: foe(s), kind: 'trap', success: true, total: 40 }], { source: 'ai' }).applied).toEqual([]);
    const intent = (kind: string) => ({ actionType: 'other', targets: [], references: [], unknownNames: [], plan: { kind, foeRef: foe(s) } }) as never;
    const r = resolveTurn(REGISTRY, s, intent('trap'));
    expect(r.draft.applied.filter((a) => a.event.type === 'planTried').length).toBe(1);
    expect(r.draft.checks.map((c) => c.label)).toEqual(['Lay a trap']);
    // Once a day for each kind; another kind is its own try.
    expect(resolveTurn(REGISTRY, r.state, intent('trap')).draft.applied.some((a) => a.event.type === 'planTried')).toBe(r.state.clock.now.day !== s.clock.now.day);
    expect(resolveTurn(REGISTRY, r.state, intent('ambush')).draft.applied.some((a) => a.event.type === 'planTried')).toBe(true);
    const weak = game('bountyHunter', 60);
    expect(resolveTurn(REGISTRY, weak, { actionType: 'other', targets: [], references: [], unknownNames: [], plan: { kind: 'trap', foeRef: foe(weak) } } as never).draft.applied.some((a) => a.event.type === 'planTried')).toBe(false);
  });
  it('with a plan a hunter can hold a top duelist off briefly, and never wins; without one never even that', () => {
    expect(duelistBar('lore:darth-malgus', -3655)).toBe('top');
    let held = 0;
    for (let i = 0; i < 20; i++) {
      const s = game('bountyHunter', 110, `h${i}`);
      const bare = fight(s).combat.last!;
      expect([bare.outcome === 'won', bare.heldOff]).toEqual([false, undefined]);
      const planned = laid(laid(s, 'ambush'), 'trap');
      expect(selectPlanReady(planned, foe(planned))).toBe(true);
      const f = fight(planned);
      const last = f.combat.last!;
      expect(last.outcome).not.toBe('won');
      expect(f.npcs.byId[foe(f)]!.status).not.toBe('deceased');
      expect(f.combat.plans).toEqual([]); // spent
      if (last.exchanges >= HOLD.minExchanges) expect(last.heldOff).toEqual([{ npcId: foe(f), length: 'brief' }]);
      if (last.heldOff) {
        held++;
        expect(selectWorldFacts(f).heldFight).toMatchObject({ brief: ['lore:darth-malgus'], long: [] });
      }
    }
    expect(held).toBeGreaterThan(0);
  });
  it('a plan elsewhere, gone stale or lost to a surprise does not count', () => {
    const ready = laid(laid(game('mandalorian', 110), 'ambush'), 'ground');
    const begin = (s: GameState): string[] => applyEvents(REGISTRY, s, [{ type: 'fightBegun', fromPending: false, opponentRefs: [foe(s)], stakes: 'lethal' }], { source: 'engine' }).state.combat.active!.planned ?? [];
    expect(begin(ready)).toEqual([foe(ready)]);
    expect(begin(tomorrow(ready, PLAN.days + 1))).toEqual([]);
    const moved = applyEvents(REGISTRY, ready, [{ type: 'locationIntroduced', name: 'Far Docks', kind: 'building', region: 'Hutta', description: 'x', moveHere: true }], { source: 'ai' }).state;
    expect(begin(moved)).toEqual([]);
    // Ambushed: the foe's perception roll decides; whenever they struck first, the plan is lost.
    for (let i = 0; i < 12; i++) {
      const s = laid(laid(game('mandalorian', 110, `amb${i}`), 'ambush'), 'ground');
      const p = applyEvents(REGISTRY, s, [{ type: 'combatStarted', opponentRefs: [foe(s)], stakes: 'lethal', terrainTags: [], ambushClaim: true }], { source: 'ai' }).state;
      const a = applyEvents(REGISTRY, p, [{ type: 'fightBegun', fromPending: true }], { source: 'engine' }).state.combat.active!;
      expect((a.planned ?? []).length === 0).toBe((a.duel as DuelState).surprise === 'B');
    }
  });
  it('a save keeps the lines', () => {
    const s = laid(game('mandalorian', 95), 'ground', false);
    expect(REGISTRY.find((f) => f.id === 'combat')!.stateSchema.parse(JSON.parse(JSON.stringify(s.combat)))).toMatchObject({ plans: [{ kind: 'ground', success: false }] });
  });
});
