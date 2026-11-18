// Ice and terrain accidents (Jared, D-184; the D-144 per-bout hazard roll, built now): the iceChunks tag, slippery
// ground's fall roll each bout and -1 to take-position attempts, the ice place words, and the health sync.
import { describe, expect, it } from 'vitest';
import { TERRAIN_BY_ID } from '../../src/data/terrain';
import { resolveExchange, startDuel } from '../../src/engine/duel';
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
import type { DuelState } from '../../src/engine/duel';
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
  it('the bout roll: a sure hazard hurts every fighter by the fall rules and names it; none leaves the duel as it was', () => {
    const d = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng('fall'));
    const sure: TerrainHazard = { chance: 1, severity: 2, type: 'fall', label: 'slippery surface' };
    const r = rollBoutHazards(d, [sure], 3);
    expect(r.duel.a.vitality).toBeLessThan(d.a.vitality);
    expect(r.duel.opponents[0]!.vitality).toBeLessThan(d.opponents[0]!.vitality);
    expect(r.notes).toHaveLength(2);
    expect(r.notes[0]).toMatch(/^terrain: .* falls on the slippery surface/);
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
