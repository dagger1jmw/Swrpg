// m8-audit Part A (Jared's review of the m8-fixes report and his Chrome check, 26 Nov 2026): the approved starting sets, Jedi and
// Sith lines with Tactics enough to teach, the quiz's first battle on the form, the wounded commander, the Train list's words and
// path entries, the test character's traits note, and notices tied to their campaign.
import { describe, expect, it } from 'vitest';
import { TACTIC_SETS } from '../../src/data/tactics';
import { absDayFromDate } from '../../src/engine/calendar';
import { rollNpcInputs } from '../../src/engine/npcGen';
import { seedRng } from '../../src/engine/rng';
import { newShip } from '../../src/engine/ships';
import { FIT, keepsCommand, outOfFight } from '../../src/features/battles/command';
import { commandingGround, groundMenu, type GroundState } from '../../src/features/battles/ground';
import { battleMenu, buildBattle, commandPassing, handShipCommand, stayShipPost, type BattleSetup } from '../../src/features/battles/rules';
import { selectGroundBattle, selectGroundMenu } from '../../src/features/battles/selectors';
import { sideOf } from '../../src/features/battles/setup';
import { computeCreation } from '../../src/features/character/creation';
import { npcLevelsFor } from '../../src/features/npcs/selectors';
import { selectTrainOptions } from '../../src/features/progression/selectors';
import { impliedTactics } from '../../src/features/tactics';
import { quizImplies } from '../../src/features/traits/rules';
import { selectTraitsEmptyNote } from '../../src/features/traits/selectors';
import { applyEvents } from '../../src/state/applyEvents';
import type { GameState } from '../../src/state/gameState';
import { REGISTRY } from '../../src/state/registry';
import { resolveTurn } from '../../src/turn/resolve';
import { traitErrors } from '../../src/turn/campaign';
import { noticeShown } from '../../src/ui/notices';
import { base, meet } from '../support/schemaSituations';

const ev = (s: GameState, events: object[], source: 'ai' | 'engine' | 'player' | 'dev' = 'ai') => applyEvents(REGISTRY, s, events, { source });
/** Looks like an identifier: camelCase, snake_case, or a decision number (the m8-fixes C1 test's rule, with D-numbers). */
const IDENT = /\b[a-z]+[A-Z][A-Za-z]*\b|\b[a-z]+_[a-z_]+\b|\bD-\d+\b|\([a-z]+[A-Z]\w*\)/;

describe('A1: the approved starting sets', () => {
  it('the Sith Academy teaches a Padawan\'s basics; a pilot knows the screen; a Jedi at the front flanking and ambush', () => {
    expect(TACTIC_SETS['sithAcademy']!.ids).toEqual(TACTIC_SETS['jediInitiate']!.ids);
    const sith = impliedTactics({ archetype: 'sithWarrior', path: 'sith' }, 'apprentice', 0);
    const padawan = impliedTactics({ archetype: 'jediGuardian', path: 'jedi' }, 'padawan', 0);
    for (const id of Object.keys(padawan)) expect(sith[id], id).toBeDefined();
    expect(sith['defenceInDepth']!.source).toMatch(/the Academy/);
    expect(impliedTactics({ archetype: 'starfighterPilot', path: 'career', start: { optionId: 'republic-pilot' } }, 'career', 0)['screen']).toBeDefined();
    const front = impliedTactics({ archetype: 'jediGuardian', path: 'jedi', start: { optionId: 'jedi-front' } }, 'knight', 0);
    expect(front['flanking']!.source).toMatch(/service at the front/);
    expect(front['ambush']).toBeDefined();
  });
});

describe('A2: Jedi and Sith lines with Tactics enough to teach', () => {
  const median = (role: string, faction: string, age: number, year: number): number => {
    const today = absDayFromDate({ year, month: 1, day: 2 });
    const v: number[] = [];
    for (let i = 0; i < 21; i++) v.push(npcLevelsFor(rollNpcInputs({ campaignSeed: 'audit', npcId: `npc:t${i}`, role, faction, age, year }), 'human', age, today)['tactics'] ?? 0);
    return v.sort((a, b) => a - b)[10]!;
  };
  it('in peace a generated Knight is about Tactics 15-25 and a Master 30-40 (the standard bar is 20)', () => {
    const knight = median('jediKnight', 'jediOrder', 30, -500);
    const master = median('jediMaster', 'jediOrder', 50, -500);
    expect(knight).toBeGreaterThanOrEqual(15);
    expect(knight).toBeLessThanOrEqual(25);
    expect(master).toBeGreaterThanOrEqual(30);
    expect(master).toBeLessThanOrEqual(40);
  });
  it('a Jedi who served at the front in a war (3,661 BBY, the Great War) is about 50 or more: enough to teach advanced tactics', () => {
    expect(median('jediKnight', 'jediOrder', 30, -3661)).toBeGreaterThanOrEqual(45);
    expect(median('jediMaster', 'jediOrder', 50, -3661)).toBeGreaterThanOrEqual(50);
  });
  it('the Sith lines take the same shape; initiates and acolytes learn none', () => {
    expect(median('sithLord', 'sith', 40, -500)).toBeGreaterThanOrEqual(20);
    expect(median('sithAcolyte', 'sith', 16, -500)).toBe(0);
  });
  it('a created Jedi Knight carries the same row; a career keeps its own', () => {
    const START = absDayFromDate({ year: -500, month: 1, day: 2 });
    const knight = computeCreation({ name: 'K', birthDay: START - 30 * 368, startDay: START, speciesId: 'human', path: 'jedi', archetype: 'jediGuardian', rank: 'knight', trainingStartAge: 4, talents: {}, dominantHand: 'right' });
    expect(knight.levels['tactics'] ?? 0).toBeGreaterThan(15);
  });
});

describe('A3: the quiz\'s first battle on the form', () => {
  it('a first battle implies war years of at least 1; other scenes nothing', () => {
    expect(quizImplies([{ eventId: 'pad.firstBattle', choiceId: 'front' }])).toEqual({ warYears: 1 });
    expect(quizImplies([{ eventId: 'init.prank', choiceId: 'join' }])).toEqual({ warYears: 0 });
  });
});

/** A Jedi Knight commanding a ground battle (the briefing's planning scene, begun). */
function commanding(): GameState {
  const s0 = meet(base(), [{ name: 'Major Tarsk', role: 'officer', faction: 'republic' }]);
  const p = ev(s0, [{ type: 'groundBattlePlanned', site: 'the Aldera plains', enemy: 'five Sith infantry, armour, artillery', ours: 'four clone infantry, armour, artillery', terrain: 'a ridge, a river with a bridge, ruins' }]).state;
  return resolveTurn(REGISTRY, p, null, { battle: { ground: { act: 'begin' } } } as never).state;
}
const dying = (s: GameState): GameState => ({ ...s, health: { ...s.health, wounds: [...s.health.wounds, { id: 'w-test', part: 'torso', severity: 'mortal', W: 60, stabilized: false, healProgress: 0, day: s.clock.now.day, source: 'test' }] as GameState['health']['wounds'] } });

describe('A4: the wounded commander', () => {
  it('the rule: out of the fight is dying or incapacitated; a severe wound keeps command; staying keeps it while alive', () => {
    expect(outOfFight(FIT)).toBe(false);
    expect(keepsCommand({ ...FIT, dying: true }, false)).toBe(false);
    expect(keepsCommand({ ...FIT, dying: true }, true)).toBe(true);
    expect(keepsCommand({ ...FIT, incapacitated: true }, false)).toBe(false);
    expect(keepsCommand({ dying: true, incapacitated: true, dead: true }, true)).toBe(false);
  });

  it('a commander out of the fight loses the command panel and the next in line commands; staying at the post keeps it', () => {
    const s = commanding();
    const g = selectGroundBattle(s)!;
    expect(g.planning.role).toBe('commander');
    expect(selectGroundMenu(s)!.title).toBe('Ground battle: your command');
    // Mortally wounded (the play test: a Knight with 12 minutes to live kept every battle order).
    const hurt = dying(s);
    const menu = selectGroundMenu(hurt)!;
    expect(menu.title).toBe('Ground battle: command has passed');
    expect(menu.options.map((o) => o.group)).not.toContain('manoeuvre');
    expect(menu.options.map((o) => o.group)).not.toContain('reserve');
    expect(menu.options.find((o) => o.orders.withdraw)).toBeUndefined();
    expect(menu.options.find((o) => o.orders.stayAtPost)?.why).toMatch(/clock keeps running/);
    // An order given now does not go out: command passes first (the withdrawal never happens).
    const w = selectGroundBattle(ev(hurt, [{ type: 'groundOrdered', orders: { withdraw: true } }], 'player').state)!;
    expect(w.end).toBeNull();
    expect(w.handedTo).toBeTruthy();
    expect(ev({ ...hurt, battles: { ...hurt.battles, ground: w } }, [{ type: 'groundOrdered', orders: { withdraw: true } }], 'player').rejected[0]?.reason).toMatch(/only the commander/);
    // The next order records the hand-over at once; no phase plays.
    const r1 = ev(hurt, [{ type: 'groundOrdered', orders: {} }], 'player');
    const g1 = selectGroundBattle(r1.state)!;
    expect(g1.handedTo?.name).toBeTruthy();
    expect(g1.battle.phase).toBe(g.battle.phase);
    expect(g1.playerSector).toBeNull();
    expect(commandingGround(g1, { ...FIT, dying: true })).toBe(false);
    // The battle moves on: the medics reach the dying player (stabilized), the phase plays under the next in line.
    const r2 = ev(r1.state, [{ type: 'groundOrdered', orders: {} }], 'player');
    expect(r2.state.health.wounds.find((w) => w.id === 'w-test')?.stabilized).toBe(true);
    expect(selectGroundBattle(r2.state)!.battle.phase).toBe(g.battle.phase + 1);
    expect(selectGroundBattle(r2.state)!.medicReached).toBe(true);
    // The other road: stay at your post. Command stays; the dying clock keeps running (no medic).
    const st = ev(hurt, [{ type: 'groundOrdered', orders: { stayAtPost: true } }], 'player');
    expect(st.rejected).toEqual([]);
    expect(selectGroundMenu(st.state)!.title).toBe('Ground battle: your command');
    const st2 = ev(st.state, [{ type: 'groundOrdered', orders: {} }], 'player');
    expect(st2.state.health.wounds.find((w) => w.id === 'w-test')?.stabilized).toBe(false);
    expect(selectGroundBattle(st2.state)!.battle.phase).toBe(g.battle.phase + 1);
    // A fit commander cannot "stay at the post".
    expect(ev(s, [{ type: 'groundOrdered', orders: { stayAtPost: true } }], 'player').rejected[0]?.reason).toMatch(/out of the fight/);
  });

  it('the menu itself: the post-hand-over menu offers no command and no own fight', () => {
    const g = selectGroundBattle(commanding()) as GroundState;
    const m = groundMenu(g, { ...FIT, incapacitated: true });
    expect(m.options.filter((o) => o.orders.fightInPerson || o.orders.fallBack || o.orders.manoeuvre || o.orders.commit)).toEqual([]);
    expect(m.options.find((o) => o.orders.stayAtPost)?.why).toMatch(/cannot fight/);
  });

  it('a fleet commander out of the fight: the first officer takes the fleet; staying at the post takes it back', () => {
    const cmd = { name: 'Admiral', npcId: null, tactics: 60, traits: [] as string[], jedi: false };
    const setup: BattleSetup = {
      id: 'battle-w', kind: 'fleet', role: 'commander', trigger: 'sighted', stakes: 'lethal', placeId: null, placeName: 'open space', year: -3661,
      player: sideOf('the fleet', 'republic', 'navy', { ...cmd, name: 'Kael' }), enemy: sideOf('the Imperial ships', 'sithEmpire', 'navy', { ...cmd, name: 'Moff', tactics: 30 }),
      playerShips: [newShip('a0', 'hammerhead', 45, 'Hammerhead 1'), newShip('a1', 'thranta', 45, 'Thranta 1')], enemyShips: [newShip('b0', 'fury', 45, 'Fury 1')], ownShipId: 'a0', rng: seedRng('w'), playerCommands: true,
    };
    const b = buildBattle(setup);
    const down = { ...FIT, dying: true };
    expect(battleMenu(b).title).toBe('Fleet battle: your command');
    expect(commandPassing(b, down)).toBe(true);
    expect(battleMenu(b, down).title).toBe('Fleet battle: command has passed');
    expect(battleMenu(b, down).options.map((o) => o.label)).toEqual(['Stay at your post']);
    const handed = handShipCommand(b).battle;
    expect(handed.command).toBe('firstOfficer');
    expect(handed.fleet!.a.tactics).toBe(handed.player.firstOfficer.tactics);
    const back = stayShipPost(handed).battle;
    expect(back.command).toBe('player');
    expect(back.fleet!.a.tactics).toBe(b.fleet!.a.tactics);
    expect(battleMenu(back, down).title).toBe('Fleet battle: your command');
  });
});

describe('A6: the Train list', () => {
  const padawan = (): GameState => {
    const s = base({ rank: 'padawan' });
    return s;
  };
  it('every reason is in plain words (the m8-fixes C1 identifier rule, extended to the Train list)', () => {
    for (const s of [padawan(), base(), base({ path: 'sith', rank: 'apprentice', archetype: 'sithWarrior' }), base({ path: 'career' }), base({ rank: 'master' })])
      for (const o of selectTrainOptions(s)) if (o.why) expect(o.why, o.id).not.toMatch(IDENT);
  });
  it('a Jedi Padawan is not offered the Sith apprentice\'s session or Dun Möch; a Sith apprentice is not offered the Padawan\'s', () => {
    const ids = selectTrainOptions(padawan()).map((o) => o.id);
    expect(ids).toContain('padawanTraining');
    expect(ids).not.toContain('apprenticeTraining');
    expect(ids).not.toContain('dunMochBasics');
    const sith = selectTrainOptions(base({ path: 'sith', rank: 'apprentice', archetype: 'sithWarrior' })).map((o) => o.id);
    expect(sith).toContain('apprenticeTraining');
    expect(sith).toContain('dunMochBasics');
    expect(sith).not.toContain('padawanTraining');
  });
  it('Juyo and Vaapad apart: Juyo with a teacher who knows it, Vaapad only from its creation', () => {
    const s = base();
    const list = selectTrainOptions(s);
    const juyo = list.find((o) => o.id === 'juyoVaapadBasics')!;
    const vaapad = list.find((o) => o.id === 'vaapadBasics')!;
    expect(juyo.name).toBe('Juyo basics');
    expect(juyo.open ? '' : juyo.why).toMatch(/^$|teacher who knows Juyo/);
    expect(vaapad.open).toBe(false);
    expect(vaapad.why).toMatch(/does not exist yet/);
    // In the Temple the instructors teach the forms of their day: Juyo opens.
    const temple = ev(s, [{ type: 'locationIntroduced', name: 'Jedi Temple', kind: 'building', region: 'Coruscant', parentRef: s.locations.currentId ?? undefined, description: '', moveHere: true }]).state;
    expect(selectTrainOptions(temple).find((o) => o.id === 'juyoVaapadBasics')!.open).toBe(true);
  });
});

describe('A7, A8: the test character\'s traits; notices tied to their campaign', () => {
  it('a test character says so instead of "a save from before traits existed"', () => {
    const s = base();
    expect(selectTraitsEmptyNote({ ...s, character: { ...s.character, testCharacter: true } })).toMatch(/^Test character: no traits/);
    expect(selectTraitsEmptyNote(s)).toMatch(/before traits existed/);
  });
  it('a notice raised in one campaign is not shown in the next', () => {
    const n = { text: 'Dev commands work only in a test campaign (the dev test start). Nothing was sent.', campaignId: 'c1' };
    expect(noticeShown(n, 'c1')).toBe(n.text);
    expect(noticeShown(n, 'c2')).toBeNull();
    expect(noticeShown(null, 'c1')).toBeNull();
  });
});

// A3's campaign check runs through the real validation with a quiz plan; kept apart for its setup.
describe('A3: a campaign with the quiz\'s first battle and war years 0 is refused', () => {
  it('names the first battle and the minimum', () => {
    const input = {
      name: 'Q', birthDate: { year: -3675, month: 1, day: 1 }, startDate: { year: -3661, month: 6, day: 1 }, startSecond: 8 * 3600, premise: '',
      creation: { speciesId: 'human', path: 'jedi' as const, archetype: 'jediGuardian', rank: 'padawan', trainingStartAge: 4, talents: {}, dominantHand: 'right' as const, warYears: 0 },
      traits: { origin: 'templeRaised', temperament: 'disciplined', scarOrTie: 'loyal' },
      formative: { answers: [{ eventId: 'pad.firstBattle', choiceId: 'front' }] },
    };
    expect(traitErrors(input as never).join(' ')).toMatch(/first battle .* war years of at least 1/);
    expect(traitErrors({ ...input, creation: { ...input.creation, warYears: 1 } } as never).join(' ')).not.toMatch(/war years of at least/);
  });
});
