// m8-fixes Part C (Jared's play tests, 26 Nov 2026): the display bugs. C1: every phase result code has plain words (nothing that
// looks like an identifier reaches the screen). C2: each sector line's direction matches its track change (one function, one record).
import { describe, expect, it } from 'vitest';
import { seedRng } from '../../src/engine/rng';
import { beginGround, GROUND_END_WORDS, phaseDirection, phaseLine, stepGround, type GroundCtx, type GroundPlanning, type GroundState } from '../../src/features/battles/ground';
import { selectGroundPlanning } from '../../src/features/battles/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { base, meet } from '../support/schemaSituations';

const RESULTS = ['steady', 'held', 'light', 'positionTaken', 'rout', 'collapse'] as const;
/** Looks like an identifier: camelCase, snake_case, or a bare code word standing alone after a square. */
const IDENT = /\b[a-z]+[A-Z][A-Za-z]*\b|\b[a-z]+_[a-z_]+\b/;
const bareCode = (line: string): boolean => /^[A-H]\d: \w+\.$/.test(line) && RESULTS.some((r) => line === `${line.slice(0, 2)}: ${r}.`);

/** Which way a line reads: +1 ours, -1 the enemy's, 0 even. */
function reads(line: string): 1 | -1 | 0 | null {
  if (/neither side gains/.test(line)) return 0;
  if (/\bwe (?:gain|take)\b|the enemy break and run|the enemy's line collapses|we hold the enemy's push/.test(line)) return 1;
  if (/the enemy (?:gain|take)\b|our troops break|our line collapses|our push is held/.test(line)) return -1;
  return null;
}

describe('C1: every phase result code has plain words', () => {
  it('no line looks like an identifier, for every code, side and own fight', () => {
    for (const result of RESULTS) {
      for (const by of ['A', 'B', null] as const) {
        for (const before of [-3, -1, 0, 1, 3]) {
          for (const own of [null, 'won', 'held', 'lost'] as const) {
            const after = by ? 0 : result === 'held' ? before - Math.sign(before) : before + 1;
            const line = phaseLine({ result, by, before, after, notes: by ? ['Republic force take Sector D5'] : [] }, 'D5', own);
            expect(line, `${result}/${by}/${before}/${own}`).not.toMatch(IDENT);
            expect(bareCode(line)).toBe(false);
            expect(reads(line)).not.toBeNull();
          }
        }
      }
    }
    for (const w of Object.values(GROUND_END_WORDS)) expect(w).not.toMatch(IDENT);
  });
  it('the reported line ("D5: positionTaken") now reads in words', () => {
    expect(phaseLine({ result: 'positionTaken', by: 'A', before: 3, after: 0, notes: [] }, 'D5')).toBe('D5: we take the position.');
  });
});

describe('C2: each line\'s direction matches its track change', () => {
  it('the reported case: tracks moving to -3 never read "neither side gains"', () => {
    expect(phaseLine({ result: 'steady', by: null, before: -1, after: -3, notes: [] }, 'C4')).toBe('C4: the enemy gain the upper hand.');
    // The player's own fight is told in the same sentence as the sector, so they cannot contradict each other.
    expect(phaseLine({ result: 'steady', by: null, before: 0, after: 0, notes: [] }, 'C4', 'won')).toBe('At C4 you break the enemy in front of you, but neither side gains.');
  });
  it('across a seeded run of phases, every sector line reads the way its record moved', () => {
    const s0 = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
    const s: GameState = applyEvents(REGISTRY, s0, [{ type: 'groundBattlePlanned', site: 'the Aldera plains', enemy: 'five Sith infantry, armour, artillery', ours: 'four clone infantry, armour, artillery', terrain: 'a ridge, a river with a bridge, ruins' }], { source: 'ai' }).state;
    const p0 = selectGroundPlanning(s)!;
    const p: GroundPlanning = { ...p0, map: { ...p0.map, scouted: Object.keys(p0.map.squares), seen: Object.keys(p0.map.squares) }, plan: { ...p0.plan, sectors: p0.plan.sectors.map((x, i) => ({ ...x, leader: i === 0 ? 'player' : null })) } };
    let checked = 0;
    for (let seed = 0; seed < 20; seed++) {
      const ctx: GroundCtx = { playerCombat: 30 + seed * 4, commanderTactics: { player: 50, enemy: 40 + seed } };
      let g = beginGround(p, seedRng(`c2-${seed}`)) as GroundState;
      for (let i = 0; i < 12 && !g.end; i++) {
        const before = g.battle.log.length;
        const r = stepGround(g, {}, ctx);
        for (const rec of r.ground.battle.log.slice(before)) {
          const sq = r.ground.battle.sectors.find((x) => x.id === rec.sector)!.square;
          const line = r.lines.find((l) => l.startsWith(`${sq}: `) || l.startsWith(`At ${sq} `))!;
          expect(line, `seed ${seed} phase ${rec.n} ${sq}`).toBeDefined();
          const dir = phaseDirection(rec);
          if (!rec.by) expect(dir).toBe(Math.sign(rec.after - rec.before));
          expect(reads(line), `${line} (${rec.result} ${rec.before}->${rec.after} by ${rec.by})`).toBe(dir);
          expect(line).not.toMatch(IDENT);
          checked++;
        }
        g = r.ground;
      }
    }
    expect(checked).toBeGreaterThan(100);
  });
});

describe('C3: a finished battle\'s panel shows once, then clears; only the running battle shows', () => {
  it('the wrap-up shows on the turn the battle ended, not after, and never beside another battle or a planning scene', async () => {
    const { selectEndedBattleToShow } = await import('../../src/features/battles/selectors');
    const s = base();
    const ended = (turn: number, extra: Partial<GameState['battles']> = {}): GameState => ({ ...s, meta: { ...s.meta, turn: 5 }, battles: { ...s.battles, ended: { kind: 'ship', turn }, ...extra } });
    expect(selectEndedBattleToShow(ended(5))).toBe('ship');
    expect(selectEndedBattleToShow(ended(4))).toBeNull();
    expect(selectEndedBattleToShow(ended(5, { planning: { id: 'p' } as never }))).toBeNull();
    expect(selectEndedBattleToShow(ended(5, { ground: { id: 'g' } as never }))).toBeNull();
    // Saves from before: no wrap-up.
    expect(selectEndedBattleToShow({ ...s, battles: { ...s.battles, ended: undefined } })).toBeNull();
  });
});

describe('C4: the location follows the player into battle and out', () => {
  const here = (s: GameState): string | undefined => (s.locations.currentId ? s.locations.byId[s.locations.currentId]?.name : undefined);
  const plan = (site: string, s0 = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }])): GameState =>
    applyEvents(REGISTRY, s0, [{ type: 'groundBattlePlanned', site, enemy: 'five Sith infantry, armour, artillery', ours: 'four clone infantry, armour, artillery', terrain: 'a ridge' }], { source: 'ai' }).state;

  it('a ground battle moves the player to its site (a map world named there becomes the parent); the narrator cannot move them away mid-battle', () => {
    const s = plan('the Jabiim highlands');
    expect(here(s)).toBe('Coruscant');
    const p = selectGroundPlanning(s)!;
    const ready = { ...s, battles: { ...s.battles, planning: { ...p, map: { ...p.map, scouted: Object.keys(p.map.squares), seen: Object.keys(p.map.squares) } } } } as GameState;
    const r = applyEvents(REGISTRY, ready, [{ type: 'groundBattleBegun' }], { source: 'player' });
    expect(r.rejected.map((x) => x.reason)).toEqual([]);
    expect(here(r.state)).toBe('the Jabiim highlands');
    const loc = r.state.locations.byId[r.state.locations.currentId!]!;
    expect(r.state.locations.byId[loc.parentId!]!.name).toBe('Jabiim');
    const temple = Object.values(r.state.locations.byId).find((l) => l.name === 'Coruscant')!.id;
    expect(applyEvents(REGISTRY, r.state, [{ type: 'locationChanged', locationRef: temple }], { source: 'ai' }).rejected[0]?.reason).toMatch(/battle is being fought/);
  });

  it('a lost ground battle takes the player back to the base they planned from', async () => {
    const { backTo } = await import('../../src/features/battles/location');
    const s = plan('the Aldera plains');
    const base0 = s.locations.currentId!;
    const r = applyEvents(REGISTRY, s, [{ type: 'locationIntroduced', name: 'the Aldera plains', kind: 'wilderness', region: 'Coruscant', description: '', moveHere: true }], { source: 'engine' });
    expect(here(r.state)).toBe('the Aldera plains');
    const back = applyEvents(REGISTRY, r.state, backTo(r.state, base0), { source: 'engine' });
    expect(back.rejected).toEqual([]);
    expect(back.state.locations.currentId).toBe(base0);
  });

  it('a ship battle puts the player aboard their ship', () => {
    const s0 = base();
    const owned = applyEvents(REGISTRY, s0, [{ type: 'shipAcquired', classId: 'aurek', how: 'issued' }], { source: 'dev' }).state;
    const r = applyEvents(REGISTRY, owned, [{ type: 'shipBattleProposed', what: 'enemy: two Imperial Supremacy fighters; mine: Aurek' }], { source: 'dev' });
    expect(r.rejected.map((x) => x.reason)).toEqual([]);
    const loc = r.state.locations.byId[r.state.locations.currentId!]!;
    expect(loc.kind).toBe('ship');
    expect(r.state.locations.byId[loc.parentId!]!.name).toBe('Coruscant');
  });

  it('G7: a free Jedi start begins at the Temple (the fitting start option\'s places)', async () => {
    const { freeStartPlaces } = await import('../../src/turn/campaign');
    const o = freeStartPlaces(-3661, { path: 'jedi', rank: 'padawan', archetype: 'jediGuardian' });
    expect(o?.places.map((p) => p.name)).toEqual(['Coruscant', 'Jedi Temple']);
  });
});
