// Space and ground combat rolls (Jared, 2026-11-25; D-505; docs-v2/spec/combat-scales.md).
import { describe, expect, it } from 'vitest';
import { GROUND_UNITS, PLANS } from '../../src/data/ground.config';
import { MINION_KIND_IDS } from '../../src/data/npcGen.config';
import { BURNOUT_SHARE, DOGFIGHT, FLEET, FORMATIONS, GUNS_MAX, MANOEUVRE, MANOEUVRES, POWER_EVEN, SHIP_WEAPON } from '../../src/data/shipCombat.config';
import { autoDogOrders, breakOff, dogfightModifier, dogfightTurn, flown, runDogfight, startDogfight, type DogOrders } from '../../src/engine/dogfight';
import { autoFleetOrders, changeFormation, commandMods, fighterToughness, fleetMap, fleetRound, fleetSide, formationMatchup, runFleet, startFleet, warheadLoad, wingsOf, type FleetBattle, type FleetOrders, type Wing } from '../../src/engine/fleetBattle';
import { canFightHere, effectOn, groundForce, groundPhase, groundUnit, killLeader, killMeditator, moraleCheck, planMatchup, runGround, sector, sectorLevel, sectorMods, sectorSide, setDroidControl, standing, startGround, unitDef, unitFire, unitMatchup, unitQuality, type GroundForce, type GroundUnit, type Sector } from '../../src/engine/groundBattle';
import { seedRng } from '../../src/engine/rng';
import { angleShields, applyFire, bearing, bestAspect, bridgeExposed, canBeBoarded, damageState, facingsOf, freshest, hitTower, inFight, newShip, passMinutes, rechargePerMinute, setPower, SHIP_CLASSES, shipClass, shipInService, totalShields, towerExposed, volleyOf, warheadBypass } from '../../src/engine/ships';
import { afterStrike, contest, hitQuality, moveTrack, striker } from '../../src/engine/track';

const YEAR = -20;
const sum = (o: object): number => Object.values(o).reduce((a: number, b: number) => a + b, 0);

describe('the core roll (section A)', () => {
  it('is the opposed rolls.md roll, to the whole point', () => {
    const [c] = contest(seedRng('x'), { level: 60, modifiers: [{ source: 'm', value: 2 }] }, { level: 40, modifiers: [] });
    expect(c.a.total).toBeCloseTo(c.a.d20 + c.a.naturalBonus + 6 + 2);
    expect(c.margin).toBe(Math.round(c.a.total - c.b.total));
  });
  it('moves the track as a duel does', () => {
    expect([0, 1, 2, 5, 6, 9, 10, 20].map((m) => moveTrack(0, m))).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(moveTrack(2, 1)).toBe(1);
    expect(moveTrack(-2, 0)).toBe(-1);
    expect(moveTrack(4, 12)).toBe(5);
    expect(moveTrack(-4, -12)).toBe(-5);
    expect([2, 3, -2, -3].map(striker)).toEqual([null, 'A', null, 'B']);
    expect(afterStrike(4, true)).toBe(0);
    expect([afterStrike(5, false), afterStrike(-3, false)]).toEqual([3, -1]);
    expect([3, 4, 7, 8, 11, 12, 15, 16].map(hitQuality)).toEqual([null, 'graze', 'graze', 'solid', 'solid', 'clean', 'clean', 'critical']);
  });
});

describe('ships as data (section B)', () => {
  it('every class is whole: known weapons and hangars, two or four facings, its invented fields named', () => {
    expect(new Set(SHIP_CLASSES.map((c) => c.id)).size).toBe(SHIP_CLASSES.length);
    for (const c of SHIP_CLASSES) {
      for (const m of c.weapons) expect(SHIP_WEAPON.has(m.weapon), `${c.id} ${m.weapon}`).toBe(true);
      for (const h of c.hangar) expect(shipClass(h.classId).kind).toBe('fighter');
      expect(facingsOf(c).length).toBe(c.kind === 'fighter' || c.kind === 'freighter' ? 2 : 4);
      expect(c.hull).toBeGreaterThan(0);
      expect(c.reactor).toBeGreaterThan(0);
      expect(c.particle >= 0 && c.particle <= 100).toBe(true);
      expect(c.invented.length).toBeGreaterThan(0);
      if (c.from !== null && c.to !== null) expect(c.from).toBeLessThanOrEqual(c.to);
    }
  });
  it('one dated list, read for the year (D-438)', () => {
    const at = (year: number): string[] => SHIP_CLASSES.filter((c) => shipInService(c, year)).map((c) => c.id);
    expect(at(-3661)).toEqual(expect.arrayContaining(['thranta', 'harrower', 'valor', 'defender', 'hammerhead']));
    expect(at(-3661)).not.toEqual(expect.arrayContaining(['isd1']));
    expect(at(-20)).toEqual(expect.arrayContaining(['venator', 'munificent', 'victory1']));
    expect(at(-20)).not.toContain('executor');
    expect(at(4)).toEqual(expect.arrayContaining(['executor', 'mc80a', 'isd2', 'xwing', 'bwing']));
    expect(at(4)).not.toContain('harrower');
  });
  it('the ruled figures: a turbolaser is three lasers; the Interceptor has 4, the B-wing 8; counts from 2014 are marked weak', () => {
    expect(SHIP_WEAPON.get('turbolaser')!.damage).toBe(3 * SHIP_WEAPON.get('laser')!.damage);
    expect(shipClass('tiein').weapons[0]).toMatchObject({ weapon: 'laser', barrels: 4 });
    expect(warheadLoad('bwing')).toBe(8);
    expect(SHIP_CLASSES.filter((c) => c.weak).map((c) => c.id).sort()).toEqual(['dreadnaught', 'interdictorSd', 'mc80Liberty', 'quasarFire', 'secutor']);
    expect(shipClass('venator').weapons[0]).toMatchObject({ weapon: 'heavyTurbolaser', barrels: 2, settings: true });
  });
  it('dedicated carriers have few weapons and weak shields for their size; the Venator is a warship', () => {
    const guns = (id: string): number => {
      const c = shipClass(id);
      const v = volleyOf(newShip('x', id, 50), bearing(c, bestAspect(c, 'medium')), 'medium', 'capital', () => 1);
      return (v.energy + v.turbolaser) / (c.lengthM ?? 1);
    };
    for (const carrier of ['quasarFire', 'tonFalk', 'secutor']) expect(guns(carrier)).toBeLessThan(guns('venator'));
    expect(totalShields(shipClass('quasarFire'))).toBeLessThan(totalShields(shipClass('nebulonB')));
    expect(shipClass('venator').gunsMax).toBe(GUNS_MAX.trueWarship);
    expect(setPower(newShip('v', 'venator', 50), { guns: 1, shields: 0.03, engines: 0.02 }).power.guns).toBeCloseTo(0.95);
    expect(setPower(newShip('i', 'isd1', 50), { guns: 1, shields: 0.03, engines: 0.02 }).power.guns).toBeCloseTo(0.65);
  });
});

describe('shields (section B)', () => {
  it('a facing is spent before the hull, and only its own', () => {
    const s = newShip('i', 'isd1', 50);
    const one = applyFire(s, { damage: 1000, kind: 'energy', facing: 'fore' }, YEAR);
    expect(one).toMatchObject({ toShield: 1000, toHull: 0 });
    expect(one.ship.shields).toMatchObject({ fore: 200, port: 1200 });
    const two = applyFire(one.ship, { damage: 500, kind: 'energy', facing: 'fore' }, YEAR);
    expect(two).toMatchObject({ toShield: 200, toHull: 300 });
  });
  it('torpedoes partly bypass the pool, except against strong particle shielding', () => {
    const past = (id: string): number => applyFire(newShip('x', id, 50), { damage: 100, kind: 'warhead', facing: 'fore' }, YEAR).toHull;
    expect(past('cr90')).toBeGreaterThan(50);
    expect(past('nebulonB')).toBeGreaterThan(past('isd1'));
    expect(past('isd1')).toBeGreaterThan(0);
    expect(past('isd1')).toBeLessThan(100);
    expect(past('executor')).toBeLessThan(past('isd1'));
    const strong = { ...shipClass('isd1') };
    expect(strong.particle).toBeLessThan(90);
    // A hull shot through nothing but ray shields, and the strongest particle shielding: the ends of the curve.
    expect(warheadBypass(newShip('t', 'tieln', 50))).toBeGreaterThan(0.85);
    expect(warheadBypass(newShip('e', 'executor', 50))).toBeLessThan(0.1);
  });
  it('particle shields drop while the ship launches or fires warheads: more gets past, most of all a volley timed to it', () => {
    const s = newShip('i', 'isd1', 50);
    const down = { ...s, particleDown: true };
    expect(warheadBypass(down)).toBeGreaterThan(warheadBypass(s));
    expect(warheadBypass(down, true)).toBeGreaterThan(warheadBypass(down));
    expect(warheadBypass(s, true)).toBe(warheadBypass(s));
    const carrier = newShip('c', 'venator', 50);
    const b = fleetRound(startFleet(fleetSide('A', [carrier], { wings: wingsOf(carrier, 50) }), fleetSide('B', [newShip('m', 'munificent', 50)]), seedRng('p'), { year: YEAR }), { launch: true });
    // For the round: closed again by the next.
    expect(b.a.ships[0]!.particleDown).toBe(false);
    expect(b.a.wings.some((w) => w.state === 'launching')).toBe(true);
  });
  it('ion strips shields and systems more than hull, and shields retuned against it fail against lasers', () => {
    const s = newShip('v', 'venator', 50);
    const ion = applyFire(s, { damage: 500, kind: 'ion', facing: 'fore' }, YEAR);
    expect(ion.toShield).toBeGreaterThan(ion.toHull * 3);
    expect(ion.ionLoad).toBe(500);
    const laser = applyFire(s, { damage: 500, kind: 'energy', facing: 'fore' }, YEAR);
    const retuned = { ...s, retuned: true };
    const ion2 = applyFire(retuned, { damage: 500, kind: 'ion', facing: 'fore' }, YEAR);
    expect(ion2).toMatchObject({ ionLoad: 0, toHull: 0 });
    expect(ion2.toShield).toBeLessThan(ion.toShield);
    const laser2 = applyFire(retuned, { damage: 500, kind: 'energy', facing: 'fore' }, YEAR);
    expect(laser.toHull).toBe(0);
    expect(laser2.toHull).toBeGreaterThan(400);
    // Enough of it and the ship is dead in space for minutes; the crew brings it back.
    const dead = applyFire(s, { damage: 1200, kind: 'ion', facing: 'fore' }, YEAR);
    expect(dead.disabled).toBe(true);
    expect(damageState(dead.ship)).toBe('disabled');
    expect(canBeBoarded(dead.ship)).toBe(true);
    expect(dead.ship.disabledMinutes).toBeGreaterThanOrEqual(3);
    expect(damageState(passMinutes(dead.ship, dead.ship.disabledMinutes, YEAR))).not.toBe('disabled');
  });
  it('ion short of that takes systems off line, and the crew brings them back', () => {
    const start = (): FleetBattle => startFleet(fleetSide('A', [newShip('v', 'venator', 50)]), fleetSide('B', [newShip('m', 'munificent', 90)]), seedRng('io'), { year: YEAR });
    let off = 0;
    let back = 0;
    for (let i = 0; i < 60; i++) {
      let b = { ...start(), rng: seedRng(`io${i}`), a: { ...start().a, ships: [{ ...newShip('v', 'venator', 70), ion: 300 }] } };
      b = fleetRound(b, { holdFire: true }, {});
      if (!b.log[0]!.notes.some((n) => n.includes('off line'))) continue;
      off++;
      const downNow = Object.values(b.a.ships[0]!.systems).filter((x) => x === 'disabled').length;
      for (let k = 0; k < 4; k++) b = fleetRound(b, { holdFire: true }, { holdFire: true });
      if (Object.values(b.a.ships[0]!.systems).filter((x) => x === 'disabled').length < Math.max(1, downNow)) back++;
    }
    expect(off).toBeGreaterThan(10);
    expect(back).toBeGreaterThan(off * 0.5);
  });
  it('concentrated fire burns a projector out: down until repaired, not recharged', () => {
    const s = newShip('i', 'isd1', 60);
    const r = applyFire(s, { damage: 1300, kind: 'energy', facing: 'fore' }, YEAR);
    expect(r.burnt).toBe(true);
    const later = passMinutes(r.ship, 3, YEAR);
    expect(later.shields.fore).toBe(0);
    expect(later.burnt.fore).toBeGreaterThan(0);
    const fixed = passMinutes(later, later.burnt.fore!, YEAR);
    expect(fixed.burnt.fore).toBeUndefined();
    expect(passMinutes(fixed, 3, YEAR).shields.fore).toBeGreaterThan(0);
    // Little by little it is only spent, and recovers.
    let slow = s;
    for (let i = 0; i < 12; i++) slow = { ...applyFire(slow, { damage: 200, kind: 'energy', facing: 'fore' }, YEAR).ship, taken: {} };
    expect(slow.shields.fore).toBe(0);
    expect(slow.burnt.fore).toBeUndefined();
    expect(passMinutes(slow, 3, YEAR).shields.fore).toBeGreaterThan(0);
    // A Mon Calamari generator is hardier; a fighter cannot swap a projector in flight.
    const heavy = (id: string, share: number): boolean => applyFire({ ...newShip('m', id, 50), shields: { ...newShip('m', id, 50).shields, fore: 1 } }, { damage: (shipClass(id).shields.fore ?? 0) * share, kind: 'energy', facing: 'fore' }, YEAR).burnt;
    expect(heavy('isd1', BURNOUT_SHARE.capital * 1.2)).toBe(true);
    expect(heavy('mc80Liberty', BURNOUT_SHARE.capital * 1.2)).toBe(false);
    const f = applyFire(newShip('x', 'xwing', 50), { damage: 60, kind: 'energy', facing: 'fore', shieldsOnly: true }, YEAR);
    expect(f.burnt).toBe(true);
    expect(passMinutes(f.ship, 60, YEAR).burnt.fore).toBeDefined();
  });
  it('recovery: from spare reactor power, faster with more generators, faster after c. 7500 BBY', () => {
    const mc = newShip('m', 'mc80Liberty', 50);
    const usual = { ...mc, generators: shipClass('mc80Liberty').usualGenerators };
    expect(shipClass('mc80Liberty').generators).toBe(3 * shipClass('mc80Liberty').usualGenerators);
    expect(rechargePerMinute(mc, 4)).toBeGreaterThan(1.6 * rechargePerMinute(usual, 4));
    const i = newShip('i', 'isd1', 50);
    expect(rechargePerMinute(i, YEAR, false)).toBeGreaterThan(rechargePerMinute(i, YEAR, true));
    expect(rechargePerMinute(setPower(i, { guns: 0.2, shields: 0.6, engines: 0.2 }), YEAR)).toBeGreaterThan(rechargePerMinute(i, YEAR));
    expect(rechargePerMinute(i, -8000)).toBeLessThan(0.5 * rechargePerMinute(i, -5000));
    // Rapid-fire turbolasers beat any shield between the 7700s and the 7500s BBY.
    const hit = (year: number): number => applyFire(i, { damage: 1000, kind: 'energy', facing: 'fore', turbolaser: true }, year).toHull;
    expect([hit(-5000), hit(-8000)]).toEqual([0, 0]);
    expect(hit(-7650)).toBeGreaterThan(600);
    // A fighter's shields come back in minutes; a Star Destroyer's do not.
    expect(rechargePerMinute(newShip('x', 'xwing', 50), 0) / 50).toBeGreaterThan(10 * (rechargePerMinute(i, 0) / 4800));
  });
  it('double front, and rolling to a fresh facing', () => {
    const s = angleShields(newShip('x', 'xwing', 50), { fore: 0.8, aft: 0.2 });
    expect(s.shields.fore).toBeCloseTo(40);
    expect(sum(s.shields)).toBeCloseTo(50);
    const hurt = applyFire(newShip('i', 'isd1', 50), { damage: 900, kind: 'energy', facing: 'fore' }, YEAR).ship;
    expect(freshest(hurt)).not.toBe('fore');
    expect(POWER_EVEN.guns + POWER_EVEN.shields + POWER_EVEN.engines).toBeCloseTo(1);
  });
});

describe('dogfights (section C)', () => {
  const fight = (a: string, pa: number, b: string, pb: number, n = 400): { a: number; b: number; turns: number } => {
    let wa = 0;
    let wb = 0;
    const turns: number[] = [];
    for (let i = 0; i < n; i++) {
      const d = runDogfight(startDogfight({ ship: newShip('a', a, pa) }, { ship: newShip('b', b, pb) }, seedRng(`${a}${pa}${b}${pb}${i}`)));
      if (d.end?.winner === 'A') wa++;
      else if (d.end?.winner === 'B') wb++;
      turns.push(d.turn);
    }
    return { a: wa / n, b: wb / n, turns: turns.sort((x, y) => x - y)[n >> 1]! };
  };
  it('equal pilots in equal ships are even; the better pilot wins as a better duelist does; fights are short', () => {
    const even = fight('xwing', 50, 'xwing', 50);
    expect(Math.abs(even.a - even.b)).toBeLessThan(0.12);
    expect(even.turns).toBeLessThanOrEqual(20);
    const better = fight('xwing', 70, 'xwing', 50);
    expect(better.a).toBeGreaterThan(0.74);
    expect(better.a).toBeLessThan(0.92);
  });
  it('shields carry an X-wing past a TIE at equal skill, and an ace in a TIE past an X-wing', () => {
    expect(fight('xwing', 50, 'tieln', 50).a).toBeGreaterThan(0.6);
    expect(fight('xwing', 50, 'tieln', 80).b).toBeGreaterThan(0.6);
    expect(fight('tied', 50, 'xwing', 50).a).toBeGreaterThan(0.65);
  });
  it('a shot needs a position: on the tail, else only a snap shot; a hit past the bands does what the weapon does', () => {
    for (let i = 0; i < 100; i++) {
      const [t] = dogfightTurn(startDogfight({ ship: newShip('a', 'xwing', 50) }, { ship: newShip('b', 'xwing', 50) }, seedRng(`s${i}`)), {}, {}).log;
      expect(t!.shots.length > 0).toBe(t!.position === 'onTail' || t!.position === 'tailed');
      expect(t!.shots.every((s) => s.by === (t!.position === 'onTail' ? 'A' : 'B'))).toBe(true);
    }
    const tail = startDogfight({ ship: newShip('a', 'xwing', 90) }, { ship: newShip('b', 'tieln', 10) }, seedRng('t'), { track: 5 });
    const t = dogfightTurn(tail, { shot: 'guns' }, {});
    expect(t.log[0]!.position).toBe('onTail');
    expect(t.log[0]!.shots.length).toBe(1);
    expect(t.log[0]!.shots[0]!.facing).toBe('aft');
  });
  it('low hits stop at the shields; systems go only when the hull is reached', () => {
    let systems = 0;
    for (let i = 0; i < 300; i++) {
      const d = dogfightTurn(startDogfight({ ship: newShip('a', 'xwing', 60) }, { ship: newShip('b', 'lethisk', 40) }, seedRng(`h${i}`), { track: 5 }), { shot: 'guns' }, {});
      for (const s of d.log[0]!.shots) {
        if (!s.hit) continue;
        if (s.margin >= 4 && s.margin <= 7) expect(s.toHull).toBe(0);
        if (s.system) {
          systems++;
          expect(s.toHull).toBeGreaterThan(0);
        }
      }
    }
    // Forty a volley against a facing of 70: nothing gets through fresh shields.
    expect(systems).toBe(0);
    let hurt = 0;
    for (let i = 0; i < 300; i++) {
      const bare = { ...newShip('b', 'lethisk', 40), shields: { fore: 0, aft: 0 } };
      const d = dogfightTurn(startDogfight({ ship: newShip('a', 'awing', 60) }, { ship: bare }, seedRng(`b${i}`), { track: 5 }), { shot: 'guns' }, {});
      if (d.log[0]!.shots.some((s) => s.system)) hurt++;
    }
    expect(hurt).toBeGreaterThan(20);
  });
  it('a torpedo lock leaves one evasion roll; decoys help; it is usually the end of a fighter', () => {
    const run = (target: string, level = 50): { hit: number; lost: number } => {
      let hit = 0;
      let lost = 0;
      for (let i = 0; i < 400; i++) {
        const d = dogfightTurn(startDogfight({ ship: newShip('a', 'xwing', 50) }, { ship: newShip('b', target, level) }, seedRng(`l${i}`), { track: 5 }), { shot: 'torpedo' }, {});
        const s = d.log[0]!.shots.find((x) => x.what === 'torpedo');
        if (s?.hit) hit++;
        if (s?.lost) lost++;
      }
      return { hit: hit / 400, lost: lost / 400 };
    };
    const x = run('xwing');
    expect(x.hit).toBeGreaterThan(0.35);
    expect(x.lost / x.hit).toBeGreaterThan(0.9);
    expect(run('xsFreighter').hit).toBeLessThan(run('lethisk').hit);
  });
  it('jinking: harder to hit, but the pursuer stays; the Force anticipates', () => {
    const hits = (o: DogOrders, sense = 0): number => {
      let n = 0;
      for (let i = 0; i < 600; i++) {
        const b = newShip('b', 'xwing', 50);
        const d = dogfightTurn(startDogfight({ ship: newShip('a', 'xwing', 50) }, { ship: { ...b, crew: { ...b.crew, forceSense: sense } } }, seedRng(`j${i}`), { track: 4 }), { shot: 'guns' }, o);
        if (d.log[0]!.shots.some((s) => s.by === 'A' && s.hit)) n++;
      }
      return n;
    };
    expect(hits({}, 100)).toBeLessThan(hits({}));
    let eased = 0;
    for (let i = 0; i < 100; i++) {
      const d = dogfightTurn(startDogfight({ ship: newShip('a', 'xwing', 30) }, { ship: newShip('b', 'xwing', 70) }, seedRng(`k${i}`), { track: 4 }), { shot: 'none' }, { manoeuvre: 'jink' });
      if (d.track < 4) eased++;
    }
    expect(eased).toBe(0);
  });
  it('a manoeuvre needs what it needs; the Tallon Roll answers a break; terrain bites', () => {
    for (const id of MANOEUVRES) expect(MANOEUVRE[id].label.length).toBeGreaterThan(0);
    const f = { ship: newShip('a', 'xwing', 50) };
    expect(flown({ manoeuvre: 'trap' }, f, -3, false)).toBe('fly');
    expect(flown({ manoeuvre: 'trap' }, { ...f, wingman: true }, -3, false)).toBe('trap');
    expect(flown({ manoeuvre: 'slipJaws' }, { ...f, wingman: true }, -3, false)).toBe('fly');
    expect(flown({ manoeuvre: 'slipJaws' }, { ...f, forceOrDroid: true }, -3, false)).toBe('slipJaws');
    expect(flown({ manoeuvre: 'terrain' }, f, -3, false)).toBe('fly');
    expect(flown({ manoeuvre: 'break' }, f, 3, false)).toBe('fly');
    const kept = (a: DogOrders): number => {
      let n = 0;
      for (let i = 0; i < 400; i++) n += dogfightTurn(startDogfight(f, { ship: newShip('b', 'xwing', 50) }, seedRng(`m${i}`), { track: 3 }), { ...a, shot: 'none' }, { manoeuvre: 'break' }).track;
      return n;
    };
    expect(kept({ manoeuvre: 'tallonRoll' })).toBeGreaterThan(kept({}));
  });
  it('a freighter: turrets fire in any direction, an engineer spares the pilot, a crew patches systems', () => {
    let shots = 0;
    for (let i = 0; i < 20; i++) shots += dogfightTurn(startDogfight({ ship: newShip('y', 'xsFreighter', 40), gunners: [50, 50] }, { ship: newShip('f', 'supremacy', 60) }, seedRng(`f${i}`), { track: -4 }), {}, {}).log[0]!.shots.filter((s) => s.what === 'turret').length;
    expect(shots).toBe(40);
    const mean = (engineer: boolean): number => {
      let t = 0;
      for (let i = 0; i < 400; i++) t += dogfightTurn(startDogfight({ ship: newShip('y', 'xsFreighter', 40), engineer }, { ship: newShip('f', 'supremacy', 40) }, seedRng(`e${i}`)), { boost: 'shields', weaken: 'lasers' }, { shot: 'none' }).log[0]!.margin;
      return t / 400;
    };
    expect(mean(true)).toBeGreaterThan(mean(false));
    const hurt = { ...newShip('y', 'xsFreighter', 40), systems: { engines: 'disabled' as const } };
    const worked = { ...hurt, crew: { ...hurt.crew, repair: 120 } };
    let fixed = 0;
    for (let i = 0; i < 50; i++) if (dogfightTurn(startDogfight({ ship: worked }, { ship: newShip('f', 'supremacy', 5) }, seedRng(`r${i}`)), { repair: 'engines' }, { shot: 'none' }).a.ship.systems.engines === 'damaged') fixed++;
    expect(fixed).toBeGreaterThan(40);
  });
  it('breaking off is free from an even position, a roll from a bad one; results feed a fleet battle', () => {
    const d = startDogfight({ ship: newShip('a', 'xwing', 50) }, { ship: newShip('b', 'xwing', 50) }, seedRng('o'));
    expect(breakOff(d, 'A').end?.reason).toBe('brokeOff');
    const out = [...Array(200).keys()].filter((i) => breakOff({ ...d, track: -4, rng: seedRng(`z${i}`) }, 'A').end).length;
    expect(out).toBeGreaterThan(10);
    expect(out).toBeLessThan(120);
    expect([dogfightModifier(0, false, FLEET.dogfightMax), dogfightModifier(2, false, 2), dogfightModifier(9, false, 2), dogfightModifier(0, true, 2)]).toEqual([0, 1, 2, -1]);
    expect(autoDogOrders({ ...d, track: -3 }, 'A').manoeuvre).toBe('break');
    expect(DOGFIGHT.share.critical).toBeGreaterThan(DOGFIGHT.share.graze);
  });
});

const ships = (ids: readonly string[], p: string, level = 50) => ids.map((id, i) => newShip(`${p}${i}`, id, level));
const hold = (side: 'A' | 'B') => (b: FleetBattle): FleetOrders => ({ ...autoFleetOrders(b, side), move: 'hold' });
const battles = (a: readonly string[], b: readonly string[], range: 'close' | 'medium' | 'long' = 'medium', n = 100): { a: number; b: number; rounds: number } => {
  let wa = 0;
  let wb = 0;
  let rounds = 0;
  for (let i = 0; i < n; i++) {
    const e = runFleet(startFleet(fleetSide('A', ships(a, 'a')), fleetSide('B', ships(b, 'b')), seedRng(`${a.join()}${b.join()}${range}${i}`), { range, year: YEAR }), hold('A'), hold('B'));
    if (e.end!.winner === 'A') wa++;
    else if (e.end!.winner === 'B') wb++;
    rounds += e.round;
  }
  return { a: wa / n, b: wb / n, rounds: rounds / n };
};

describe('fleet battles (section D)', () => {
  it('a heavier-armed, better-shielded ship beats a weaker one at equal crews', () => {
    for (const [strong, weak] of [['isd1', 'nebulonB'], ['isd1', 'tonFalk'], ['victory1', 'venator'], ['hammerhead', 'thranta'], ['isd2', 'isd1']] as const) expect(battles([strong], [weak]).a, `${strong} ${weak}`).toBeGreaterThan(0.75);
    const even = battles(['isd1'], ['isd1'], 'medium', 200);
    expect(Math.abs(even.a - even.b)).toBeLessThan(0.2);
    expect(battles(['thranta'], ['terminus'], 'medium', 200).a).toBeGreaterThan(0.25);
    expect(battles(['thranta'], ['terminus'], 'medium', 200).b).toBeGreaterThan(0.25);
  });
  it('a Venator beats a Munificent one-on-one and loses to four (ROTS ICS)', () => {
    for (const range of ['close', 'medium', 'long'] as const) {
      expect(battles(['venator'], ['munificent'], range).a, range).toBeGreaterThan(0.9);
      expect(battles(['venator'], ['munificent', 'munificent', 'munificent', 'munificent'], range).b, range).toBeGreaterThan(0.85);
    }
  });
  it('a Star Destroyer outclasses a Venator; a Venator flotilla breaks a Lucrehulk', () => {
    for (const range of ['close', 'medium', 'long'] as const) expect(battles(['isd1'], ['venator'], range).a, range).toBeGreaterThan(0.95);
    expect(battles(['venator', 'venator', 'venator', 'venator'], ['lucrehulk']).a).toBeGreaterThan(0.9);
    expect(battles(['venator'], ['providence'], 'close').a).toBeGreaterThan(0.6);
  });
  it('a Mon Calamari cruiser is better close than the Star Destroyer, which has the bigger guns ahead', () => {
    expect(battles(['mc80Liberty'], ['isd1'], 'close', 200).a).toBeGreaterThan(0.5);
    expect(battles(['isd1'], ['mc80Liberty'], 'medium').a).toBeGreaterThan(0.75);
    expect(battles(['mc80Liberty'], ['isd1'], 'long', 200).a).toBeGreaterThan(battles(['mc80Liberty'], ['isd1'], 'medium', 200).a);
  });
  it('hold the range and the swarm grinds a gunship down; close fast and the carrier dies', () => {
    const go = (foe: string, range: 'close' | 'long', move: 'open' | 'hold', foeMove: 'hold' | 'close'): number => {
      let w = 0;
      for (let i = 0; i < 60; i++) {
        const s = newShip('a', 'tonFalk', 50);
        const e = runFleet(startFleet(fleetSide('A', [s], { wings: wingsOf(s, 50, 'strike') }), fleetSide('B', [newShip('b', foe, 50)]), seedRng(`cv${foe}${range}${i}`), { range, year: 0 }), (b) => ({ ...autoFleetOrders(b, 'A'), move }), (b) => ({ ...autoFleetOrders(b, 'B'), move: foeMove }));
        if (e.end!.winner === 'A') w++;
      }
      return w / 60;
    };
    expect(go('dreadnaught', 'long', 'open', 'close')).toBeGreaterThan(0.7);
    expect(go('isd1', 'close', 'hold', 'close')).toBeLessThan(0.1);
  });
  it('formations: the matchups are mirror images, and worth +/-2', () => {
    for (const x of FORMATIONS) for (const y of FORMATIONS) expect(formationMatchup(x, y)).toBe(-formationMatchup(y, x) + 0);
    expect(formationMatchup('capT', 'slash')).toBe(2);
    expect(formationMatchup('slash', 'capT')).toBe(-2);
    expect(formationMatchup('fake', 'brawl')).toBe(2);
    expect(formationMatchup('fake', 'exchange')).toBe(-2);
  });
  it('the Tactics roll: formation, intelligence, crews 0 to +2, a lost flagship, the player\'s dogfights', () => {
    const me = fleetSide('A', ships(['isd1'], 'a', 80), { formation: 'capT', intel: true, commandLost: 1, modifiers: [{ source: 'your dogfights', value: 1 }] });
    const them = fleetSide('B', ships(['isd1'], 'b', 20), { formation: 'slash' });
    expect(commandMods(me, them).map((m) => m.value)).toEqual([2, 1, 2, -2, 1]);
    expect(commandMods(them, me).map((m) => m.value)).toEqual([-2]);
  });
  it('reforming takes one or two rounds at a penalty with no bonus; planned changes are free', () => {
    const f = fleetSide('A', ships(['isd1', 'isd1'], 'a'), { formation: 'exchange', tactics: 90 });
    const [g] = changeFormation(f, 'slash', seedRng('q'));
    expect(g.reform?.rounds).toBeGreaterThanOrEqual(1);
    expect(commandMods(g, fleetSide('B', ships(['isd1'], 'b'), { formation: 'exchange' }))[0]).toMatchObject({ source: 'reforming', value: -2 });
    const rounds = (t: number): number => [...Array(100).keys()].reduce((n, i) => n + changeFormation({ ...f, tactics: t }, 'slash', seedRng(`rf${i}`))[0].reform!.rounds, 0);
    expect(rounds(95)).toBeLessThan(rounds(10));
    expect(changeFormation({ ...f, formation: 'fake' }, 'exchange', seedRng('q'))[0].reform).toBeNull();
    expect(changeFormation({ ...f, formation: 'feignedRetreat' }, 'capT', seedRng('q'))[0].reform).toBeNull();
    let b = startFleet({ ...f }, fleetSide('B', ships(['nebulonB'], 'b')), seedRng('rr'), { year: 0 });
    b = fleetRound(b, { change: 'slash' });
    expect(b.log[0]!.mods.a[0]).toMatchObject({ source: 'reforming', value: -2 });
    b = fleetRound(b);
    expect(b.a.reform).toBeNull();
  });
  it('losing the flagship, the lead of a slash, or too much at once breaks the formation into a brawl', () => {
    const side = fleetSide('A', ships(['nebulonB', 'isd1', 'isd1'], 'a'), { formation: 'slash', leadId: 'a0', flagId: 'a1' });
    const weak = { ...side, ships: side.ships.map((s) => (s.id === 'a0' ? { ...s, hull: 1, shields: { fore: 0, aft: 0, port: 0, starboard: 0 } } : s)) };
    const b = fleetRound(startFleet(weak, fleetSide('B', ships(['isd1', 'isd1'], 'b')), seedRng('lead'), { year: 0 }), {}, { focus: 'a0' });
    expect(b.a.broken).toBe(true);
    expect(b.log[0]!.notes.join(' ')).toContain('lead ship');
    const flag = fleetRound(startFleet({ ...weak, flagId: 'a0', formation: 'exchange' }, fleetSide('B', ships(['isd1', 'isd1'], 'b')), seedRng('flag'), { year: 0 }), {}, { focus: 'a0' });
    expect(flag.a.commandLost).toBe(FLEET.commandLostRounds);
    expect(flag.a.flagId).not.toBe('a0');
  });
  it('a strike round lands at a multiplier and spends the advantage', () => {
    const dealt = (track: number): { hull: number; strikes: number } => {
      let hull = 0;
      let strikes = 0;
      for (let i = 0; i < 100; i++) {
        const b = fleetRound(startFleet(fleetSide('A', ships(['isd1'], 'a'), { tactics: 80 }), fleetSide('B', ships(['executor'], 'b'), { tactics: 50 }), seedRng(`st${i}`), { year: 4, track }), { focus: 'b0' }, { holdFire: true });
        hull += 24000 * 4 - sum(b.b.ships[0]!.shields);
        if (b.log[0]!.strike === 'A') {
          strikes++;
          expect(b.track).toBe(0);
        }
      }
      return { hull, strikes };
    };
    const strike = dealt(4);
    expect(strike.strikes).toBeGreaterThan(30);
    expect(strike.hull).toBeGreaterThan(dealt(0).hull * 1.2);
  });
  it('the faster side has the range it wants', () => {
    const b = startFleet(fleetSide('A', ships(['venator'], 'a')), fleetSide('B', ships(['lucrehulk'], 'b')), seedRng('rg'), { range: 'medium', year: YEAR });
    expect(fleetRound(b, { move: 'open' }, { move: 'close' }).range).toBe('long');
    expect(fleetRound(b, { move: 'close' }, { move: 'open' }).range).toBe('close');
    expect(fleetRound(b, { move: 'close' }, { move: 'hold' }).range).toBe('close');
  });
  it('fighters: a screen protects, point defence kills, a toughened fighter lasts', () => {
    expect(fighterToughness('bwing')).toBeGreaterThan(fighterToughness('tieln') * 5);
    const strike = (screen: number): number => {
      const wing: Wing = { id: 'w', classId: 'bwing', count: 36, level: 60, state: 'out', mission: 'strike', warheads: 8, from: null };
      const cover: Wing = { id: 'c', classId: 'tieln', count: screen, level: 50, state: 'out', mission: 'screen', warheads: 0, from: null };
      const b = fleetRound(startFleet(fleetSide('A', ships(['cr90'], 'a'), { wings: [wing] }), fleetSide('B', ships(['isd1'], 'b'), { wings: screen ? [cover] : [] }), seedRng('fs'), { year: 4 }), { holdFire: true, focus: 'b0' }, { holdFire: true });
      return 4800 + 2272 - sum(b.b.ships[0]!.shields) - b.b.ships[0]!.hull;
    };
    expect(strike(0)).toBeGreaterThan(strike(48) * 1.5);
    const left = (escort: string): number => {
      const wing: Wing = { id: 'w', classId: 'tieln', count: 40, level: 50, state: 'out', mission: 'strike', warheads: 0, from: null };
      return fleetRound(startFleet(fleetSide('A', ships(['cr90'], 'a'), { wings: [wing] }), fleetSide('B', ships([escort], 'b')), seedRng('pd'), { year: 4 }), { holdFire: true }, { holdFire: true }).a.wings[0]!.count;
    };
    expect(left('lancer')).toBeLessThan(left('isd1'));
  });
  it('Endor: concentrated fire breaks the Executor\'s shields, then a dome, then the bridge', () => {
    const wing = (id: string, classId: string, count: number, level: number, mission: Wing['mission']): Wing => ({ id, classId, count, level, state: 'out', mission, warheads: warheadLoad(classId), from: null });
    // Both fleets are invented, but for Ackbar's Naval command 80 (Characters_13).
    const start = (i: number): FleetBattle =>
      startFleet(
        fleetSide('Alliance', [newShip('home', 'mc80a', 65), ...ships(Array<string>(12).fill('mc80Liberty'), 'mc', 60), ...ships(Array<string>(8).fill('nebulonB'), 'nb', 55), ...ships(Array<string>(12).fill('cr90'), 'cr', 55)], { tactics: 80, formation: 'brawl', wings: [wing('x', 'xwing', 72, 60, 'screen'), wing('a', 'awing', 36, 65, 'strike'), wing('b', 'bwing', 36, 60, 'strike'), wing('y', 'ywing', 24, 55, 'strike')] }),
        fleetSide('Empire', [newShip('exec', 'executor', 60), ...ships(['isd1', 'isd2', 'isd1', 'isd1', 'isd1', 'isd1'], 'sd', 55)], { tactics: 65, wings: [wing('t', 'tieln', 144, 45, 'screen')] }),
        seedRng(`endor${i}`),
        { range: 'close', year: 4 },
      );
    const run = (focus: boolean): { shields: number; dome: number; bridge: number } => {
      const n = 60;
      const seen = { shields: 0, dome: 0, bridge: 0 };
      for (let i = 0; i < n; i++) {
        let b = start(i);
        const at = { shields: 99, dome: 99, bridge: 99 };
        while (!b.end && b.round < 10) {
          const ex = b.b.ships[0]!;
          b = fleetRound(b, { ...(focus ? { focus: 'exec' } : {}), move: 'close', roll: true, aim: bridgeExposed(ex) ? 'bridge' : towerExposed(ex) ? 'dome' : 'ship' }, { move: 'hold' });
          const now = b.b.ships[0]!;
          if (towerExposed(now)) at.shields = Math.min(at.shields, b.round);
          if (now.domes < 2) at.dome = Math.min(at.dome, b.round);
          if (now.bridge <= 0) at.bridge = Math.min(at.bridge, b.round);
        }
        for (const k of ['shields', 'dome', 'bridge'] as const) if (at[k] < 99) seen[k]++;
        if (at.bridge < 99) {
          expect(at.shields).toBeLessThanOrEqual(at.dome);
          expect(at.dome).toBeLessThanOrEqual(at.bridge);
          expect(damageState(b.b.ships[0]!)).not.toBe('fighting');
        }
      }
      return { shields: seen.shields / n, dome: seen.dome / n, bridge: seen.bridge / n };
    };
    const together = run(true);
    expect(together.shields).toBeGreaterThan(0.5);
    expect(together.bridge).toBeGreaterThan(0.45);
    expect(run(false).shields).toBeLessThan(together.shields * 0.5);
    // Before a shield is down the tower cannot be hit at all.
    const whole = newShip('e', 'executor', 50);
    expect(hitTower(whole, 'dome', 1e6).domes).toBe(2);
    expect(hitTower(whole, 'bridge', 1e6).bridge).toBe(whole.bridge);
    const open = { ...whole, shields: { ...whole.shields, fore: 0 } };
    expect(hitTower(open, 'bridge', 1e6).bridge).toBe(open.bridge);
    expect(hitTower(hitTower(open, 'dome', 1e6), 'bridge', 1e6).bridge).toBe(0);
  });
  it('the battle map: under 40 characters, arrows facing, groups numbered, the lost marked', () => {
    const a = fleetSide('Republic', ships(['hammerhead', 'hammerhead', 'thranta'], 'a'));
    const b = fleetSide('Sith', ships(['harrower', 'terminus', 'terminus'], 'b'), { formation: 'slash' });
    const map = fleetMap(startFleet({ ...a, ships: a.ships.map((s, i) => (i === 1 ? { ...s, destroyed: true } : s)) }, b, seedRng('map')));
    expect(Math.max(...map.split('\n').map((l) => l.length))).toBeLessThanOrEqual(40);
    expect(map).toContain('ROUND 0 · Range: MEDIUM');
    expect(map).toContain('H>');
    expect(map).toContain('<T2');
    expect(map).toContain('X');
    expect(map).toContain('[Slash]');
  });
  it('a side withdraws when its commander may, and a hulk is out of the fight', () => {
    const e = runFleet(startFleet(fleetSide('A', ships(['isd1'], 'a')), fleetSide('B', ships(['venator', 'venator'], 'b'), { mayWithdraw: true }), seedRng('wd'), { year: YEAR, range: 'close' }), hold('A'), hold('B'));
    expect(e.end).toEqual({ winner: 'A', reason: 'withdrew' });
    expect(inFight({ ...newShip('x', 'isd1', 50), hull: 0 })).toBe(false);
  });
});

// ---- ground ----

const unit = (id: string, over: Partial<GroundUnit> = {}): GroundUnit => groundUnit(`${id}-${over.name ?? ''}`, id, over);
const front = (a: string[], b: string[], over: Partial<Sector> = {}, ta = 50, tb = 50): Sector => sector('C4', sectorSide(a.map((u, i) => unit(u, { name: `a${i}` })), { leader: { name: 'x', tactics: ta, alive: true } }), sectorSide(b.map((u, i) => unit(u, { name: `b${i}` })), { leader: { name: 'y', tactics: tb, alive: true } }), over);
const ground = (s: Sector, n = 200, fa: Partial<GroundForce> = {}, fb: Partial<GroundForce> = {}): number => {
  let w = 0;
  for (let i = 0; i < n; i++) {
    const e = runGround(startGround(groundForce('A', 'frontal', fa), groundForce('B', 'frontal', fb), [s], seedRng(`g${i}`)));
    if (e.end!.winner === 'A') w++;
  }
  return w / n;
};
const total = (s: Sector, who: 'A' | 'B', fa: Partial<GroundForce> = {}, fb: Partial<GroundForce> = {}): number => {
  const A = groundForce('A', 'frontal', fa);
  const B = groundForce('B', 'frontal', fb);
  return sectorMods(s, who, who === 'A' ? A : B, who === 'A' ? B : A).reduce((t, m) => t + m.value, 0);
};

describe('ground battles (section E)', () => {
  it('units come from the existing unit data', () => {
    for (const u of GROUND_UNITS) {
      if (u.kind) expect(MINION_KIND_IDS).toContain(u.kind);
      const f = unitFire(u);
      expect(f.soft > 0 || f.hard > 0).toBe(true);
      expect(unitQuality(u)).toBeGreaterThan(0);
    }
    const q = (id: string): number => unitQuality(unitDef(id));
    expect(q('mandalorians')).toBeGreaterThan(q('infantry'));
    expect(q('eliteInfantry')).toBeGreaterThan(q('infantry'));
    expect(q('infantry')).toBeGreaterThan(q('militia'));
    expect(q('infantry')).toBeGreaterThan(q('battleDroids'));
    expect(q('cloneInfantry')).toBe(q('infantry'));
    // Nobody to lead: the troops' quality; an officer: their Tactics.
    expect(sectorLevel(sectorSide([unit('infantry')]))).toBeCloseTo(q('infantry'));
    expect(sectorLevel(sectorSide([unit('infantry')], { leader: { name: 'o', tactics: 70, alive: true } }))).toBe(70);
    expect(sectorLevel(sectorSide([unit('infantry')], { leader: { name: 'o', tactics: 70, alive: false } }))).toBeCloseTo(q('infantry'));
  });
  it('plans: mirror images, worth +/-2', () => {
    for (const x of PLANS) for (const y of PLANS) expect(planMatchup(x, y)).toBe(-planMatchup(y, x) + 0);
    expect(planMatchup('flanking', 'frontal')).toBe(2);
  });
  it('matchups follow the units: armour, anti-armour, artillery, raids, air, anti-air; capped at 3', () => {
    const m = (a: string, b: string, t: Sector['terrain'] = {}, attacker: 'A' | 'B' = 'A'): number => unitMatchup(front([a], [b], { terrain: t, attacker }));
    expect(m('armour', 'infantry')).toBeGreaterThan(2);
    expect(m('armour', 'antiArmour')).toBeGreaterThan(m('armour', 'antiArmour', { cover: 'heavy' }));
    expect(m('armour', 'antiArmour', { cover: 'cover', urban: true })).toBeLessThan(0);
    expect(m('armour', 'infantry', { urban: true })).toBeLessThan(0);
    expect(m('armour', 'infantry', { forest: true })).toBeLessThan(0);
    expect(m('artillery', 'infantry', { cover: 'heavy' })).toBeGreaterThan(1);
    expect(m('eliteInfantry', 'artillery')).toBeGreaterThan(2);
    expect(m('air', 'artillery')).toBeGreaterThan(2);
    expect(m('air', 'armour')).toBeGreaterThan(1);
    expect(m('antiAir', 'air')).toBeGreaterThan(1);
    expect(m('infantry', 'infantry')).toBe(0);
    for (const x of GROUND_UNITS) for (const y of GROUND_UNITS) expect(Math.abs(m(x.id, y.id))).toBeLessThanOrEqual(3);
    expect(effectOn(unitDef('artillery'), unitDef('warDroids'), {}, true)).toBeGreaterThan(effectOn(unitDef('artillery'), unitDef('eliteInfantry'), {}, true));
    expect(unitMatchup(front(['infantry', 'infantry', 'infantry'], ['infantry']))).toBeGreaterThan(1);
  });
  it('terrain: cover, high ground and a chokepoint by the numbers; armour needs the bridge', () => {
    const base = front(['infantry'], ['infantry']);
    const at = (terrain: Sector['terrain'], who: 'A' | 'B'): number => Math.round((total({ ...base, terrain }, who) - total(base, who)) * 10) / 10;
    expect([at({ cover: 'cover' }, 'B'), at({ cover: 'cover' }, 'A')]).toEqual([1, 0]);
    expect(at({ cover: 'heavy' }, 'B')).toBe(2);
    expect([at({ high: 'A' }, 'A'), at({ high: 'B' }, 'B')]).toEqual([1, 1]);
    expect([at({ chokepoint: true }, 'A'), at({ chokepoint: true }, 'B')]).toEqual([-2, 0]);
    const tank = unit('armour');
    expect(canFightHere(tank, { river: true }, true)).toBe(false);
    expect(canFightHere(tank, { river: true, bridge: true }, true)).toBe(true);
    expect(canFightHere(tank, { river: true }, false)).toBe(true);
    expect(canFightHere(unit('infantry'), { river: true }, true)).toBe(true);
  });
  it('terrain and matchups move the results the right way', () => {
    const even = ground(front(['infantry'], ['infantry']));
    expect(ground(front(['infantry'], ['infantry'], { terrain: { cover: 'heavy', high: 'B' } }))).toBeLessThan(even - 0.1);
    expect(ground(front(['infantry'], ['infantry'], { terrain: { chokepoint: true } }))).toBeLessThan(even - 0.1);
    expect(ground(front(['armour'], ['infantry']))).toBeGreaterThan(even + 0.25);
    expect(ground(front(['armour'], ['infantry'], { terrain: { urban: true, cover: 'cover' } }))).toBeLessThan(ground(front(['armour'], ['infantry'])) - 0.25);
    expect(ground(front(['infantry'], ['infantry'], {}, 75, 50))).toBeGreaterThan(even + 0.15);
    expect(ground(front(['infantry', 'infantry', 'infantry'], ['infantry']))).toBeGreaterThan(even + 0.2);
    expect(ground(front(['infantry'], ['infantry']), 200, { meditation: { name: 'm', level: 100, alive: true } })).toBeGreaterThan(even + 0.15);
  });
  it('support is +1 each; the player\'s own fight, Force users and duelists count in their sector', () => {
    const base = front(['infantry'], ['infantry']);
    const withA = (over: Partial<Sector['a']>): number => Math.round((total({ ...base, a: { ...base.a, ...over } }, 'A') - total(base, 'A')) * 10) / 10;
    expect(withA({ support: { artillery: true, armour: true, air: true } })).toBe(3);
    expect(withA({ ownFight: 'won' })).toBe(2);
    expect(withA({ ownFight: 'lost' })).toBe(-2);
    const jedi = { name: 'j', tactics: 50, alive: true, forceUser: true };
    expect(withA({ leader: jedi })).toBeGreaterThan(0);
    expect(withA({ leader: { ...jedi, tier: 'top' } })).toBeGreaterThan(withA({ leader: jedi }) + 1.5);
    // A duelist is met by a duelist.
    const both = { ...base, a: { ...base.a, leader: { ...jedi, tier: 'top' as const } }, b: { ...base.b, leader: { ...jedi, tier: 'top' as const } } };
    expect(total(both, 'A')).toBeCloseTo(total({ ...base, a: { ...base.a, leader: jedi }, b: { ...base.b, leader: jedi } }, 'A'));
  });
  it('the breakthrough bands', () => {
    const seen: Record<string, number> = {};
    for (let i = 0; i < 400; i++) {
      const b = groundPhase(startGround(groundForce('A', 'frontal'), groundForce('B', 'frontal'), [{ ...front(['infantry', 'infantry'], ['infantry', 'infantry'], {}, 80, 40), track: 3 }], seedRng(`bt${i}`)));
      const r = b.log[0]!;
      const s = b.sectors[0]!;
      seen[r.result] = (seen[r.result] ?? 0) + 1;
      const m = r.margin;
      expect(r.result).toBe(m < 4 ? 'held' : m < 8 ? 'light' : m < 12 ? 'positionTaken' : m < 16 ? 'rout' : 'collapse');
      if (m >= 8) expect(s.controller).toBe('A');
      if (m >= 12 && m < 16) expect(s.b.units.filter((u) => u.state === 'routed').length).toBeGreaterThanOrEqual(1);
      if (m >= 16) expect(s.b.units.some(standing)).toBe(false);
      if (m >= 4) expect(s.track).toBe(0);
    }
    expect(Object.keys(seen).sort()).toEqual(['collapse', 'held', 'light', 'positionTaken', 'rout']);
  });
  it('morale: bonded units hold longer; the fear-ruled obey, then collapse; droids never break', () => {
    const broke = (over: Partial<GroundUnit>, id = 'infantry', harder = 3): number => [...Array(400).keys()].filter((i) => moraleCheck(unit(id, over), harder, seedRng(`mc${i}`))[0].state === 'routed').length / 400;
    expect(broke({ bond: 90, strength: 60 })).toBeLessThan(broke({ bond: 50, strength: 60 }));
    expect(broke({ bond: 20, strength: 60 })).toBeGreaterThan(broke({ bond: 50, strength: 60 }));
    expect(broke({ strength: 60 }, 'mandalorians')).toBeLessThan(broke({ strength: 60 }));
    expect(broke({ strength: 60 }, 'militia')).toBeGreaterThan(broke({ strength: 60 }));
    expect(broke({ fear: 80, bond: 20, strength: 50 })).toBe(0);
    expect(broke({ fear: 80, bond: 20, strength: 44 })).toBe(1);
    expect(moraleCheck(unit('infantry', { fear: 80, bond: 20, strength: 65 }), 0, seedRng('f'), false)[0].state).toBe('routed');
    expect(broke({ strength: 20, morale: 0 }, 'battleDroids', 20)).toBe(0);
  });
  it('out of contact: the bonded improvise, the rest lose by it, droids and the fear-ruled most', () => {
    const lost = (over: Partial<GroundUnit>, id = 'infantry'): number => {
      const s = sector('C4', sectorSide([unit(id, over)]), sectorSide([unit('infantry')]));
      return Math.round((total(s, 'A', { contact: false }) - total(s, 'A')) * 10) / 10;
    };
    expect([lost({ bond: 80 }), lost({}), lost({ fear: 80, bond: 10 }), lost({}, 'battleDroids')]).toEqual([0, -1, -2, -2]);
  });
  it('droids stop when the control signal is lost, and start again with it', () => {
    const b = startGround(groundForce('A', 'frontal'), groundForce('B', 'frontal'), [front(['infantry'], ['battleDroids', 'infantry'])], seedRng('d'));
    const off = setDroidControl(b, 'B', false);
    expect(off.sectors[0]!.b.units.map((u) => u.state)).toEqual(['stopped', 'fighting']);
    expect(unitMatchup(off.sectors[0]!)).toBeGreaterThanOrEqual(0);
    expect(setDroidControl(off, 'B', true).sectors[0]!.b.units.map((u) => u.state)).toEqual(['fighting', 'fighting']);
  });
  it('a battle meditator killed forces the whole side to check (Mizra); a leader killed, the sector', () => {
    let routed = 0;
    let units = 0;
    for (let i = 0; i < 200; i++) {
      const b = startGround(groundForce('Republic', 'fightingWithdrawal', { meditation: { name: 'the coordinator', level: 90, alive: true } }), groundForce('Sith', 'frontal'), [front(['infantry', 'infantry'], ['infantry']), { ...front(['infantry'], ['infantry']), id: 'D4' }], seedRng(`mz${i}`));
      const [after, notes] = killMeditator(b, 'A');
      expect(after.a.meditation?.alive).toBe(false);
      expect(notes[0]).toContain('the coordinator is killed');
      for (const s of after.sectors) {
        units += s.a.units.length;
        routed += s.a.units.filter((u) => u.state === 'routed').length;
        expect(s.b.units.every((u) => u.state === 'fighting')).toBe(true);
        for (const u of s.a.units) expect(u.morale).toBeLessThan(65);
      }
      expect(killMeditator(after, 'A')[1]).toEqual([]);
    }
    expect(routed / units).toBeGreaterThan(0.3);
    expect(routed / units).toBeLessThan(0.7);
    const b = startGround(groundForce('A', 'frontal'), groundForce('B', 'frontal'), [front(['militia'], ['infantry']), { ...front(['militia'], ['infantry']), id: 'D4' }], seedRng('ld'));
    const [down, said] = killLeader(b, 'A', 'D4');
    expect(said[0]).toBe('x falls');
    expect(down.sectors[0]!.a.units[0]!.morale).toBe(65);
    expect(down.sectors[1]!.a.leader!.alive).toBe(false);
    expect(down.sectors[1]!.a.units[0]!.morale).toBeLessThan(65);
  });
});
