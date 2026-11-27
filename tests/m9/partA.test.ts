// m9-missions Part A (Jared, 27 Nov 2026): the opt-2 review fixes. The war list's factions, spans and campaigns; the Padawan
// peace scale; the command dates; the three rulings never applied (the disengage penalty, Jar'Kai's Niman gate, the sparring
// accident's floor); the Train list; the dev commands; the narrator never assigning a mission.
import { describe, expect, it } from 'vitest';
import { MISSION_SCALE_BY_RANK } from '../../src/data/duty.config';
import { ERA_09 } from '../../src/data/canon/era09GreatGalacticWar';
import { seedRng } from '../../src/engine/rng';
import { forceUser } from '../support/duelSim';
import { factionAtWar, factionWar, WARS, warsInYear } from '../../src/data/wars';
import { startDuel, disengageContest, type DuelState } from '../../src/engine/duel';
import { warYearsFor } from '../../src/engine/npcGen';
import { buildContext } from '../../src/features/combat/build';
import { allHandsNow } from '../../src/features/duty/rules';
import { selectAtHome } from '../../src/features/duty/home';
import { resolveTraining, selectTrainOptions } from '../../src/features/progression/training';
import type { GameState } from '../../src/state/gameState';
import { runDevCommand } from '../../src/turn/devCommands';
import { checkNarration } from '../../src/turn/narrationCheck';
import type { TurnDraft } from '../../src/turn/resolve';
import { REGISTRY } from '../../src/state/registry';
import { base } from '../support/schemaSituations';
import type { Wound } from '../../src/engine/wounds';

const war = (id: string) => WARS.find((w) => w.id === id)!;
const testChar = (s: GameState): GameState => ({ ...s, character: { ...s.character, testCharacter: true } });
const withLevel = (s: GameState, id: string, xp: number): GameState => ({ ...s, progression: { ...s.progression, skills: { ...s.progression.skills, [id]: { ...(s.progression.skills[id] ?? {}), xp } } } }) as GameState;
const hurt = (s: GameState, w: Partial<Wound>): GameState => ({ ...s, health: { ...s.health, wounds: [...s.health.wounds, { id: 'w1', part: 'torso', severity: 'mortal', W: 55, stabilized: false, healProgress: 0, day: 0, source: 'test', ...w }] as GameState['health']['wounds'] } });

describe('A1: the war list', () => {
  it('the Mandalorian Wars without the Order; the Galactic War and the Clone Wars with the Mandalorians', () => {
    expect(war('mandalorianWars').factions).not.toContain('jediOrder');
    expect(factionAtWar('jediOrder', -3970)).toBe(false);
    expect(factionAtWar('republic', -3970)).toBe(true);
    expect(war('galacticWar').factions).toContain('mandalorians');
    expect(war('cloneWars').factions).toEqual(expect.arrayContaining(['mandalorians', 'sith', 'independent']));
  });

  it('the Galactic Civil War runs 2 BBY to 19 ABY; the Jedi Order counts from 11 ABY', () => {
    expect(factionAtWar('republic', -2)).toBe(true);
    expect(factionAtWar('sithEmpire', 19)).toBe(true);
    expect(factionAtWar('republic', 20)).toBe(false);
    expect(factionAtWar('jediOrder', 5)).toBe(false);
    expect(factionAtWar('jediOrder', 11)).toBe(true);
  });

  it('the Yuuzhan Vong War keeps the Remnant from 25 ABY', () => {
    expect(factionAtWar('sithEmpire', 25)).toBe(true);
  });

  it('the New Sith Wars are dated campaigns with peace between them; the Ruusan campaign is total', () => {
    expect(warsInYear(-1600)).toHaveLength(0);
    expect(warsInYear(-1100)).toHaveLength(0);
    expect(factionWar('jediOrder', -1035)?.id).toBe('grumaniCampaigns');
    expect(factionWar('jediOrder', -1005)?.intensity).toBe('total');
    // A Master of 50 in 1,032 BBY: service from 16 (1,066 BBY), the Grumani campaigns 1,042-1,032: 10 war years (was 34).
    expect(warYearsFor('jediMaster', 'jediOrder', 50, 4, -1032, 'jediGuardian')).toBe(10);
  });

  it('every war has an intensity; the total wars are the five ruled', () => {
    expect(WARS.filter((w) => w.intensity === 'total').map((w) => w.id).sort()).toEqual(['cloneWars', 'galacticWar', 'greatGalacticWar', 'lightAndDarknessWar', 'yuuzhanVongWar']);
  });
});

describe('A2, A3: the Padawan scale; the command dates', () => {
  it('a Padawan without a master waits 1.2 times as long', () => {
    expect(MISSION_SCALE_BY_RANK['padawan']).toBe(1.2);
  });

  it("Orgus Din's Tactics from 3,681 (the war's start); Tol Braga's from 3,641 (his strike team's war)", () => {
    const anchor = (id: string) => ERA_09.npcs.find((n) => n.canonId === id)!.anchors.filter((a) => a.levels['tactics'] !== undefined).map((a) => a.bby);
    expect(anchor('lore:orgus-din')).toEqual([3681]);
    expect(anchor('lore:tol-braga')).toEqual([3641]);
  });
});

describe('A4: the three rulings', () => {
  it('disengaging while behind on the advantage track costs 1 a step', () => {
    const duel: DuelState = startDuel(forceUser('A', 50), [forceUser('B', 50)], seedRng('disengage'));
    const behind = disengageContest({ ...duel, advantage: -3 });
    expect(behind.mine.modifiers).toContainEqual({ source: 'losing ground', value: -3 });
    const ahead = disengageContest({ ...duel, advantage: 2 });
    expect(ahead.mine.modifiers.find((m) => m.source === 'losing ground')).toBeUndefined();
  });

  it("Jar'Kai needs Niman 30", () => {
    const s = withLevel(withLevel(base(), 'jarKai', 2000), 'niman', 0);
    const r = resolveTraining(s, { activityId: 'jarKaiBasics', hours: 1, source: { kind: 'instructor' } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/Jar'Kai needs Niman 30/);
  });

  it('a spar on ground with no hazard of its own is on a flat floor (about 1 in 200 bouts); a real fight is not', () => {
    const spar = buildContext(base(), [], 'spar', 'controlled');
    expect(spar.hazards).toHaveLength(1);
    expect(spar.hazards![0]!.chance).toBeCloseTo(1 / 200, 6);
    expect(buildContext(base(), [], 'serious', null).hazards).toHaveLength(0);
    expect(buildContext(base(), ['slippery'], 'spar', 'controlled').hazards!.map((h) => h.chance)).toEqual([0.05]);
  });
});

describe('A5: the Train list', () => {
  it('no training while dying, with the reason shown', () => {
    const s = hurt(base(), {});
    const opts = selectTrainOptions(s);
    expect(opts.every((o) => !o.open)).toBe(true);
    expect(opts[0]!.why).toMatch(/no training while dying/);
  });

  it("no training while too badly hurt to fight; the Padawan's master session is hidden for a Knight", () => {
    const s = hurt(base(), { severity: 'critical', W: 42, part: 'head', stabilized: true });
    expect(selectTrainOptions(s).every((o) => !o.open)).toBe(true);
    expect(selectTrainOptions(base({ rank: 'knight' })).some((o) => o.id === 'padawanTraining')).toBe(false);
    expect(selectTrainOptions(base({ rank: 'padawan' })).some((o) => o.id === 'padawanTraining')).toBe(true);
  });
});

describe('A6: dev commands', () => {
  it('/allhands on and off', () => {
    const s = testChar(base());
    const on = runDevCommand(REGISTRY, s, '/allhands on');
    expect(on.ok).toBe(true);
    expect(allHandsNow(on.state)).toMatch(/dev/);
    expect(allHandsNow(runDevCommand(REGISTRY, on.state, '/allhands off').state) ?? '').not.toMatch(/dev/);
  });

  it('/home puts the character at home', () => {
    const s = testChar(base());
    const r = runDevCommand(REGISTRY, s, '/home');
    expect(r.ok).toBe(true);
    expect(selectAtHome(r.state)).toBe(true);
  });

  it('/mission start and /mission end; the help lists them', () => {
    const s = testChar(base());
    const started = runDevCommand(REGISTRY, s, '/mission start strike Ord Mantell');
    expect(started.ok).toBe(true);
    expect(started.state.duty.status).toBe('mission');
    const ended = runDevCommand(REGISTRY, started.state, '/mission end success');
    expect(ended.ok).toBe(true);
    expect(ended.state.duty.status).toBe('home');
    expect(runDevCommand(REGISTRY, s, '/help').line).toMatch(/\/mission start[\s\S]*\/allhands[\s\S]*\/home/);
  });
});

describe('A7: the narrator never assigns a mission', () => {
  const draft = (assigned: boolean) => ({ applied: assigned ? [{ event: { type: 'missionAssigned' }, notes: [] }] : [], combat: null, checks: [], jump: null, intent: null }) as unknown as TurnDraft;
  it("the opt-2 browser check's closing line is caught; a turn that assigned one is not", () => {
    const text = 'You return to your quarters. A message from the Council regarding your next assignment waits on your datapad.';
    expect(checkNarration(text, draft(false), false).map((i) => i.kind)).toContain('missionOffered');
    expect(checkNarration(text, draft(true), false).map((i) => i.kind)).not.toContain('missionOffered');
    expect(checkNarration('The mission went well; the Council is pleased.', draft(false), false)).toHaveLength(0);
  });
});
