// Ice and terrain accidents (Jared, D-184; the D-144 per-bout hazard roll, built now): the iceChunks tag, slippery
// ground's fall roll each bout and -1 to take-position attempts, the ice place words, and the health sync.
import { describe, expect, it } from 'vitest';
import { TERRAIN_BY_ID } from '../../src/data/terrain';
import { resolveExchange, runUntilBeat, startDuel } from '../../src/engine/duel';
import { TERRAIN_HAZARD_EVERY } from '../../src/data/combat.config';
import { seedRng } from '../../src/engine/rng';
import { rollBoutHazards, type TerrainHazard } from '../../src/engine/terrainHazard';
import { selectWounds } from '../../src/features/health/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { createCampaign, DEFAULT_START_SECOND } from '../../src/turn/campaign';
import { describeCombat } from '../../src/turn/context';
import { runDevCommand, TERRAIN_ALIASES } from '../../src/turn/devCommands';
import { testStartInput } from '../../src/turn/testStart';
import { createMemoryStorage } from '../../src/persist/storage';
import { TEST_START_DATE } from '../support/dates';
import { REAL, forceUser } from '../support/duelSim';
import type { DuelContext, DuelState } from '../../src/engine/duel';
import type { CombatDraft } from '../../src/turn/combatTurn';

const knight = async (): Promise<GameState> =>
  (await createCampaign(REGISTRY, createMemoryStorage(), testStartInput({ name: 'Tess', rank: 'knight', age: 30, startDate: TEST_START_DATE, startSecond: DEFAULT_START_SECOND }), { campaignId: 'c-ice', branchId: 'b' }, 'x')).state;

describe('ice terrain (D-184)', () => {
  it('iceChunks are throwable (2-5 per fight); slippery ground has the fall roll and -1 to take position', () => {
    expect(TERRAIN_BY_ID.get('iceChunks')?.objects?.supply).toEqual([2, 5]);
    const slip = TERRAIN_BY_ID.get('slippery')!;
    expect(slip.footing).toBe(-1);
    expect(slip.hazard?.type).toBe('fall');
    expect(slip.positionAttempt).toBe(-1);
  });
  it('ice, glacier, Ilum caves and Hoth map to iceChunks + slippery + uneven ground', async () => {
    for (const p of ['ice', 'glacier', 'ilum caves', 'hoth']) expect(TERRAIN_ALIASES[p], p).toEqual(['iceChunks', 'slippery', 'unevenGround']);
    const o = runDevCommand(REGISTRY, await knight(), '/fight 1 duelist terrain Ilum caves');
    expect(o.ok).toBe(true);
    const a = o.state.combat.active!;
    expect(a.terrainTags).toEqual(['iceChunks', 'slippery', 'unevenGround']);
    expect(a.objects['iceChunks']).toBeGreaterThanOrEqual(2);
    expect(a.objects['iceChunks']).toBeLessThanOrEqual(5);
    expect(a.ctx.positionAttempt).toBe(-1);
    expect(a.ctx.footing).toBe(-1);
    expect(a.ctx.hazards.map((h) => h.label)).toEqual(['slippery surface', 'uneven ground']);
  });
  it('-1 to take position: never a success the flat attempt would miss, and fewer successes overall', () => {
    let flat = 0;
    let icy = 0;
    for (let i = 0; i < 400; i++) {
      const base = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng(`pos${i}`));
      const d: DuelState = { ...base, advantage: 3, a: { ...base.a, pendingManeuver: 'position' } };
      const took = (pa: number) => resolveExchange(d, { ...REAL, positionAttempt: pa }, 0).log.at(-1)?.maneuver?.kind === 'position';
      const f = took(0);
      const c = took(-1);
      if (c) expect(f).toBe(true);
      flat += f ? 1 : 0;
      icy += c ? 1 : 0;
    }
    expect(flat).toBeGreaterThan(0);
    expect(icy).toBeLessThan(flat);
  });
  it('the bout roll: a sure hazard hurts one fighter of the fight by the fall rules and names it (D-228: one accident per roll)', () => {
    const d = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng('fall'));
    const sure: TerrainHazard = { chance: 1, severity: 2, type: 'fall', label: 'slippery surface' };
    const r = rollBoutHazards(d, [sure], 3);
    const hurt = [r.duel.a.vitality < d.a.vitality, r.duel.opponents[0]!.vitality < d.opponents[0]!.vitality].filter(Boolean);
    expect(hurt).toHaveLength(1);
    expect(r.notes).toHaveLength(1);
    expect(r.notes[0]).toMatch(/^terrain: .* falls on the slippery surface/);
    // Neither side is favoured: over many seeds both the player and the opponent take the accident.
    const victims = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const x = rollBoutHazards(startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng(`pick${i}`)), [sure], 3);
      victims.add(x.notes[0]!.startsWith('terrain: A ') ? 'A' : 'B');
    }
    expect(victims).toEqual(new Set(['A', 'B']));
    expect(rollBoutHazards(d, [{ ...sure, chance: 0 }], 3).duel.a).toEqual(d.a);
    expect(rollBoutHazards(d, [], 3).duel).toBe(d);
  });
  it('accidents on ice happen at about the tag chances, and the player\'s health matches the duel each time', async () => {
    const s0 = await knight();
    let falls = 0;
    const n = 150;
    for (let i = 0; i < n; i++) {
      const s = { ...s0, meta: { ...s0.meta, rngState: seedRng(`ice${i}`) } };
      const o = runDevCommand(REGISTRY, s, '/fight 1 duelist terrain ice');
      const d = o.state.combat.active!.duel as DuelState;
      falls += o.report.filter((x) => x.startsWith('terrain: ')).length;
      expect(selectWounds(o.state).length).toBe(d.a.wounds.length);
      if (d.a.vitality < d.a.maxVitality) expect(o.state.health.vitalityLost).toBeGreaterThan(0);
    }
    // Two fighters, slippery 5% + uneven 3% each: about 0.16 accidents a fight.
    expect(falls).toBeGreaterThan(n * 0.16 * 0.4);
    expect(falls).toBeLessThan(n * 0.16 * 2.2);
  });
  it('each sparring bout rolls again, and the narrator gets the accident as ground truth', async () => {
    const s = await knight();
    const f = runDevCommand(REGISTRY, s, '/spar at 0 terrain ice').state;
    expect(f.combat.active!.ctx.hazards).toHaveLength(2);
    // Resolve the session in code with a sure hazard: every new bout rolls it.
    const sure = { ...f, combat: { ...f.combat, active: { ...f.combat.active!, session: { ...f.combat.active!.session!, playing: false }, ctx: { ...f.combat.active!.ctx, hazards: [{ chance: 1, severity: 1 as const, type: 'fall' as const, label: 'slippery surface' }] } } } };
    const r = applyEvents(REGISTRY, sure, [{ type: 'combatAction', action: 'continue' }], { source: 'player' });
    const notes = r.applied.flatMap((a) => a.notes).filter((x) => x.startsWith('terrain: '));
    const bouts = r.state.combat.last!.session!.bouts.length;
    if (bouts > 1) expect(notes.length).toBeGreaterThan(0);
    const lines = describeCombat({ fightId: 'f', started: false, records: [], narrate: [], beat: null, quiet: false, quietLine: null, ended: null, session: null, advantage: 0, fighters: [], notes: ['terrain: Tess falls on the slippery surface (minor leftLeg)'] } as CombatDraft);
    expect(lines).toContain('Terrain accident: Tess falls on the slippery surface (minor leftLeg).');
  });
});

describe('flat-floor accidents and hazard rolls in long fights (D-185)', () => {
  const flat = (): TerrainHazard => ({ ...TERRAIN_BY_ID.get('flatFloor')!.hazard!, label: 'flat floor' });
  it('the flat floor: about 1 in 200 per bout, always a minor injury (the minor band), named for the narration', () => {
    expect(TERRAIN_BY_ID.get('flatFloor')!.hazard).toMatchObject({ chance: 0.005, severity: 1, minorOnly: true });
    let hits = 0;
    const n = 4000;
    for (let i = 0; i < n; i++) {
      const d = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng(`flat${i}`));
      const r = rollBoutHazards(d, [flat()], 0);
      for (const f of [r.duel.a, ...r.duel.opponents]) if (f.wounds.length) {
        hits++;
        expect(f.wounds[0]!.severity).toBe('minor');
      }
      if (r.notes.length) expect(r.notes[0]).toMatch(/turns an ankle, pulls a muscle or takes a bruise on the flat floor \(minor /);
    }
    // 8000 fighter-rolls at 0.005: about 40.
    expect(hits).toBeGreaterThan(15);
    expect(hits).toBeLessThan(75);
    // Minor even when the fighter is already Spent (no Vitality left to soak it).
    const spent = startDuel(forceUser('A', 50, { vitality: 0 }), [forceUser('B', 50)], seedRng('spent'));
    const sure = rollBoutHazards(spent, [{ ...flat(), chance: 1 }], 0).duel.a;
    expect(sure.wounds.map((w) => w.severity)).toEqual(['minor']);
  });
  it('the flat floor applies to sparring bouts and real fights alike', async () => {
    const s = await knight();
    for (const c of ['/spar at 0 terrain flatFloor', '/fight 1 duelist terrain flatFloor', '/fight 3 trooper terrain hangar']) {
      const o = runDevCommand(REGISTRY, s, c);
      expect(o.ok, c).toBe(true);
      expect(o.state.combat.active!.ctx.hazards.map((h) => h.label), c).toContain('flat floor');
    }
  });
  it(`a real fight rolls its terrain once per ${TERRAIN_HAZARD_EVERY} exchanges: a 60-exchange fight on ice rolls 6 times`, async () => {
    const ice = runDevCommand(REGISTRY, await knight(), '/fight 1 duelist terrain ice').state.combat.active!.ctx as unknown as DuelContext;
    expect(ice.hazardEvery).toBe(TERRAIN_HAZARD_EVERY);
    let found = 0;
    for (let i = 0; i < 300 && found < 3; i++) {
      const start = startDuel(forceUser('A', 80), [forceUser('B', 80)], seedRng(`long${i}`));
      const d0 = rollBoutHazards(start, ice.hazards ?? [], 0).duel;
      // Every segment size: the rolls do not depend on how the fight is played (beats, Fight on, Resolve to end).
      let d = d0;
      while (!d.end && d.exchange < 60) d = runUntilBeat(d, ice, 0, 'beat', 60 - d.exchange).state;
      const whole = runUntilBeat(d0, ice, 0, 'toEnd', 60).state;
      if (d.end || d.exchange !== 60) continue;
      found++;
      expect(d.hazardRolls).toBe(6);
      expect(whole.exchange === 60 && !whole.end ? whole.hazardRolls : 6).toBe(6);
    }
    expect(found).toBeGreaterThan(0);
  });
  it('a sparring bout rolls once, however long it runs', async () => {
    const ctx = runDevCommand(REGISTRY, await knight(), '/spar at 0 terrain ice').state.combat.active!.ctx as unknown as DuelContext;
    expect(ctx.hazardEvery).toBeNull();
    const d0 = rollBoutHazards(startDuel(forceUser('A', 80), [forceUser('B', 80)], seedRng('bout')), ctx.hazards ?? [], 0).duel;
    expect(runUntilBeat(d0, ctx, 0, 'toEnd', 60).state.hazardRolls).toBe(1);
  });
  it('a context with no terrain (as the lifetime runs use) rolls nothing: the same dice as before D-184 and D-185', () => {
    // tests/support/lifetime.ts builds { sparring, situations: [], footing: 0, dyingRiskStakes } like REAL here.
    for (let i = 0; i < 20; i++) {
      const d = startDuel(forceUser('A', 60), [forceUser('B', 50)], seedRng(`none${i}`));
      const plain = runUntilBeat(d, REAL, 0, 'toEnd').state;
      const withEvery = runUntilBeat(d, { ...REAL, hazardEvery: TERRAIN_HAZARD_EVERY, hazards: [] }, 0, 'toEnd').state;
      expect(withEvery).toEqual(plain);
      expect(plain.hazardRolls).toBeUndefined();
    }
  });
});

describe('indoor place words (D-186)', () => {
  it('training hall, salle, dojo, sparring ring, Temple, academy, arena, corridor and office have the flat floor', async () => {
    for (const p of ['training hall', 'salle', 'dojo', 'sparring ring', 'temple', 'academy', 'arena', 'corridor', 'office']) expect(TERRAIN_ALIASES[p], p).toContain('flatFloor');
    const s = await knight();
    for (const c of ['/spar at 0 terrain training hall', '/spar at 0 terrain sparring ring', '/fight 1 duelist terrain Temple', '/fight 2 thug terrain office']) {
      const o = runDevCommand(REGISTRY, s, c);
      expect(o.ok, c).toBe(true);
      expect(o.state.combat.active!.terrainTags, c).toContain('flatFloor');
      expect(o.state.combat.active!.ctx.hazards.map((h) => h.label), c).toEqual(['flat floor']);
    }
    expect(TERRAIN_ALIASES['corridor']).toEqual(['confined', 'flatFloor']);
  });
});

