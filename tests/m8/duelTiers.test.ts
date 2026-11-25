// The duel tiers against canon figures (D-494, D-495), and planning against a top duelist (D-493).
import { describe, expect, it } from 'vitest';
import { CANON_BY_ID, CANON_NPCS } from '../../src/data/canonNpcs';
import { readdirSync, readFileSync } from 'node:fs';
import { duelistBar, PLAN } from '../../src/data/duelists';
import { FORM_IDS } from '../../src/data/skills';
import { absDayFromDate } from '../../src/engine/calendar';
import { xpForLevel } from '../../src/engine/curve';
import type { DuelState } from '../../src/engine/duel';
import { canPlan, duelTier, planReady } from '../../src/engine/who';
import { canonFigureLevelsAt } from '../../src/features/npcs/selectors';
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
const tierOf = (x: Line): string => duelTier({ forceUser: true, masterRank: true, meetsMasterSkills: true, ...x });
const l = (combat: number, forceControl: number, willpower: number): Line => ({ combat, forceControl, willpower });

describe('the tiers against canon figures (Jared, D-494, D-495)', () => {
  // The character sheets as ruled (Docs/SWRPG lore/SW_Characters_11 to _13): best form, Force Control, Willpower.
  const SHEETS: Record<string, readonly [Line, string]> = {
    'Yoda': [l(100, 122, 115), 'apex'],
    'Sidious (Chancellor)': [l(98, 118, 120), 'apex'],
    'Palpatine (Emperor)': [l(98, 128, 128), 'apex'],
    'Krayt': [l(102, 128, 110), 'apex'],
    'Bane': [l(104, 110, 114), 'apex'],
    'Vader (Dark Times)': [l(106, 110, 104), 'top'],
    'Vader II': [l(104, 108, 102), 'top'],
    'Mace Windu': [l(100, 92, 94), 'top'],
    'Revan (freed)': [l(94, 94, 106), 'top'],
    'Exar Kun': [l(110, 102, 105), 'top'],
    'Luke (Endor)': [l(82, 82, 92), 'master'],
    'Dooku': [l(96, 94, 94), 'top'],
    'Obi-Wan': [l(96, 92, 92), 'top'],
    'Anakin (Knight)': [l(94, 92, 90), 'top'],
    'Kit Fisto': [l(84, 84, 82), 'master'],
    'Saesee Tiin': [l(78, 86, 82), 'master'],
    'Plo Koon': [l(80, 84, 84), 'master'],
    'Cin Drallig': [l(86, 84, 84), 'master'],
  };
  it('on the sheets', () => {
    for (const [n, [x, t]] of Object.entries(SHEETS)) expect(tierOf(x), n).toBe(t);
  });
  it('the sheet files hold the numbers used here', () => {
    const read = (f: string): string => readFileSync(`Docs/SWRPG lore/${f}`, 'utf8');
    const e11 = read('SW_Characters_11_RepublicEra_RiseOfEmpire.md');
    const e12 = read('SW_Characters_12_CloneWars.md');
    expect(e11).toMatch(/Juyo 98 \(favored\)/);
    expect(e11).toMatch(/Vaapad\/Juyo 100 \(creator/);
    expect(e11).toMatch(/\| Willpower \| 120 \| \| ForceControl \| 118 \|/);
    expect(e11).toMatch(/\| Willpower \| 115 \| \| ForceControl \| 122 \|/);
    // The three Vader sheets: the Dark Times peak above Vader II above Vader I, in every stat.
    const e13 = read('SW_Characters_13_DarkTimes_GalacticCivilWar.md');
    const block = (head: string): number[] => {
      const t = e13.slice(e13.indexOf(`## Darth Vader (${head})`)).split(/\r?\n/).filter((x) => /^\|[A-Z]\w+\|\d/.test(x)).slice(0, 6).join('');
      return [...t.matchAll(/\|(?:Strength|Agility|Endurance|Willpower|Charisma|Intelligence|ForceSense|Meditation|ForceKnowledge|ForceControl|ForceOutput)\|(\d+)/g)].map((m) => Number(m[1]));
    };
    const [dt, v1, v2] = [block('Dark Times'), block('I'), block('II')];
    expect([dt.length, v1.length, v2.length]).toEqual([11, 11, 11]);
    dt.forEach((x, i) => expect([x > v2[i]!, v2[i]! > v1[i]!]).toEqual([true, true]));
    expect(e13).toMatch(/Shien\/Djem So 106 \(suit-adapted\)/);
    const fisto = (t: string): string => /^\| Kit Fisto \|.*?\| ((?:\d+ \| ){11})/m.exec(t)![1]!;
    expect(fisto(e11)).toBe(fisto(e12));
    expect(e12).toMatch(/FOut 120\*\* \/ WIL 72/);
    for (const f of readdirSync('Docs/SWRPG lore').filter((x) => /^(?:OLD_)?SW_Characters_.*\.md$/.test(x))) expect(read(f), f).not.toMatch(/\| ?Master ?\| ?85.100/);
  });
  it('on the roster, in the game', () => {
    const now = (id: string): string => {
      const n = CANON_BY_ID.get(id)!;
      const a = n.anchors.find((x) => x.complete)!;
      return tierOf(line(canonFigureLevelsAt(n, a.bby, absDayFromDate({ year: -a.bby, month: 1, day: 1 }))));
    };
    const top = CANON_NPCS.filter((n) => n.anchors.some((a) => a.complete)).filter((n) => ['top', 'apex'].includes(now(n.canonId))).map((n) => n.canonId.slice(5)).sort();
    expect(top).toEqual(['darth-malgus', 'darth-marr', 'emperor-wrath', 'hero-of-tython', 'revan', 'satele-shan', 'scourge']);
    expect(['lore:darth-malgus', 'lore:satele-shan', 'lore:revan'].map(now)).toEqual(['top', 'top', 'top']);
    expect(['lore:kao-cen-darach', 'lore:ven-zallow'].map(now)).toEqual(['master', 'master']);
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
      expect(last.heldOff).toEqual(last.hold!.enough ? [{ npcId: foe(f), length: 'brief' }] : undefined);
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
