// Attack runs on a capital ship (m8-ship-battles, D-517; docs-v2/spec/ship-battles.md section 4): a fighter closes through the
// ship's defensive fire and strikes one shield facing; hull skimming gets under the big guns, a trench run (a ship with a
// trench) lines up a shot at a system. The fighter is a dogfight Flyer; the ship is the fleet battle's own ShipState, so what
// the run does carries back into the fleet. Pure; seeded RNG. Numbers: data/shipBattles.config.ts ATTACK_RUN (invented).
import { ATTACK_RUN } from '../data/shipBattles.config';
import { DOGFIGHT, SHIP_WEAPON, TURN_SECONDS, type ShipSystem } from '../data/shipCombat.config';
import type { Facing } from '../data/ships';
import type { Flyer } from './dogfight';
import { interp } from './interp';
import { basicRoll, type Modifier } from './rolls';
import { applyFire, freshest, hitSystem, inFight, passMinutes, pointDefenceOf, settleHull, shipClass, systemState, type ShipState } from './ships';
import { contest, hitQuality } from './track';
import type { RngState } from './rng';

export const RUN_APPROACHES = ['pass', 'skim', 'trench'] as const;
export type RunApproach = (typeof RUN_APPROACHES)[number];

export interface RunOrders {
  approach?: RunApproach;
  /** The facing to strike; absent = the weakest one in view. */
  facing?: Facing;
  shot?: 'guns' | 'torpedo' | 'none';
  /** On a trench run: the system the shot is lined up on. */
  aim?: Extract<ShipSystem, 'generator' | 'engines' | 'weapons' | 'hangar'>;
  boost?: 'lasers' | 'shields' | 'engines';
  weaken?: 'lasers' | 'shields' | 'engines';
}

export interface RunTurn {
  n: number;
  approach: RunApproach;
  stepBefore: number;
  stepAfter: number;
  /** The approach roll's margin against the ship's defences. */
  margin: number;
  /** The ship's defensive fire on the fighter: margin and hull lost. */
  defence: { margin: number; toHull: number; toShield: number } | null;
  /** The fighter's strike: margin, what it did. */
  strike: { what: 'guns' | 'torpedo'; margin: number; facing: Facing; toShield: number; toHull: number; system: ShipSystem | null } | null;
  notes: string[];
}

export interface AttackRun {
  flyer: Flyer;
  target: ShipState;
  /** 0 long, 1 medium, 2 close, 3 under the guns. */
  step: number;
  turn: number;
  year: number;
  /** The target has a trench (a battle station): trench runs are open. */
  trench: boolean;
  rng: RngState;
  log: RunTurn[];
  end: { reason: 'lost' | 'struck' | 'brokeOff' } | null;
}

export const startRun = (flyer: Flyer, target: ShipState, rng: RngState, opts: { year?: number; trench?: boolean; step?: number } = {}): AttackRun => ({ flyer, target, step: opts.step ?? 0, turn: 0, year: opts.year ?? -3661, trench: opts.trench ?? false, rng, log: [], end: null });

const mod = (source: string, value: number): Modifier[] => (value === 0 ? [] : [{ source, value }]);

/** An approach as it can be flown: a trench run needs a trench. */
export const runApproach = (r: Pick<AttackRun, 'trench'>, o: RunOrders): RunApproach => (o.approach === 'trench' && !r.trench ? 'pass' : (o.approach ?? 'pass'));

/** The ship's defensive weight on one fighter: point defence that bears, its gunners' level as the roll. */
export const defenceWeight = (s: ShipState): number => pointDefenceOf(s) * ATTACK_RUN.pdShare;

/** The facing a fighter strikes: the one named, or the weakest in view; a captain rolls the ship when it is low (the design notes). */
export function struckFacing(target: ShipState, o: RunOrders): { facing: Facing; rolled: boolean } {
  const faces = Object.keys(target.shields) as Facing[];
  const wanted = o.facing && faces.includes(o.facing) ? o.facing : faces.reduce((w, f) => ((target.shields[f] ?? 0) < (target.shields[w] ?? 0) ? f : w), faces[0]!);
  const fresh = freshest(target);
  // The captain's answer to a facing worn thin (fleet: rollAt 0.3 of the freshest).
  const rolled = (target.shields[wanted] ?? 0) < 0.3 * (target.shields[fresh] ?? 0) && systemState(target, 'engines') !== 'destroyed';
  return { facing: rolled ? fresh : wanted, rolled };
}

/** What a run can strike with now: its fixed guns, or every fore torpedo tube that has a warhead left. */
function strikeVolley(f: Flyer, what: 'guns' | 'torpedo'): { damage: number; kind: 'energy' | 'warhead'; spent: Record<number, number> } | null {
  const c = shipClass(f.ship.classId);
  if (what === 'torpedo') {
    let damage = 0;
    const spent: Record<number, number> = {};
    c.weapons.forEach((m, i) => {
      const w = SHIP_WEAPON.get(m.weapon)!;
      const left = f.ship.ammo[i] ?? 0;
      if (w.kind !== 'warhead' || left <= 0) return;
      const n = Math.min(left, Math.max(1, m.arcs.fore ?? 1), ATTACK_RUN.volley);
      damage += n * w.damage;
      spent[i] = n;
    });
    return damage > 0 ? { damage, kind: 'warhead', spent } : null;
  }
  const guns = c.weapons.filter((m) => !m.turret && (m.arcs.fore ?? 0) > 0 && SHIP_WEAPON.get(m.weapon)!.kind === 'energy');
  const damage = guns.reduce((t, m) => t + (m.arcs.fore ?? 1) * m.barrels * SHIP_WEAPON.get(m.weapon)!.damage * (SHIP_WEAPON.get(m.weapon)!.vsCapital ?? 1), 0);
  return damage > 0 ? { damage: damage * (systemState(f.ship, 'weapons') === 'working' ? 1 : 0.6), kind: 'energy', spent: {} } : null;
}

/** One turn of the run (5 s): the approach, the ship's fire, the strike. */
export function runTurn(r: AttackRun, o: RunOrders = {}): AttackRun {
  if (r.end) return r;
  const notes: string[] = [];
  let rng = r.rng;
  const approach = runApproach(r, o);
  const c = shipClass(r.flyer.ship.classId);
  const tc = shipClass(r.target.classId);
  const rule = approach === 'skim' ? ATTACK_RUN.skim : approach === 'trench' ? ATTACK_RUN.trench : ATTACK_RUN.pass;
  // 1. The approach: piloting through the defences.
  const pilot: Modifier[] = [
    ...mod('handling', c.handling),
    ...mod('power to engines', o.boost === 'engines' ? DOGFIGHT.boost.engines : o.weaken === 'engines' ? DOGFIGHT.boost.enginesWeak : 0),
    ...mod('the Force', interp(DOGFIGHT.forceSense, r.flyer.ship.crew.forceSense)),
    ...mod(approach === 'skim' ? 'hull skimming' : approach === 'trench' ? 'the trench' : 'a strafing pass', rule.approach),
    ...(r.flyer.modifiers ?? []),
  ];
  const [ap, r1] = basicRoll(rng, r.flyer.ship.crew.piloting, pilot);
  rng = r1;
  const margin = Math.round(ap.total - (ATTACK_RUN.defenceDc + Math.min(8, Math.sqrt(defenceWeight(r.target)))));
  let step = Math.min(ATTACK_RUN.steps, r.step + (margin >= 6 ? 2 : margin >= 0 ? 1 : 0));
  let flyer = r.flyer;
  const risk = 'risk' in rule ? rule.risk : undefined;
  if (risk !== undefined && margin <= -risk) {
    notes.push(`${flyer.ship.name}: the ${approach === 'skim' ? 'skim' : 'trench run'} goes wrong`);
    step = Math.max(0, step - 1);
    if (approach === 'skim') {
      const hit = applyFire(flyer.ship, { damage: ATTACK_RUN.skim.collision, kind: 'energy', facing: 'fore' }, r.year).ship;
      const [ship, r2] = settleHull(hit, rng);
      rng = r2;
      flyer = { ...flyer, ship };
      notes.push(`${flyer.ship.name} scrapes the hull`);
    }
  }
  // 2. The ship's fire on the fighter, once it is in reach.
  let defence: RunTurn['defence'] = null;
  if (step >= 1 && inFight(flyer.ship) && r.target.disabledMinutes <= 0) {
    const under = step >= ATTACK_RUN.steps && approach === 'skim';
    const evade: Modifier[] = [
      ...mod('handling', c.handling),
      ...mod('the Force', interp(DOGFIGHT.forceSense, flyer.ship.crew.forceSense)),
      ...mod('under the big guns', under ? ATTACK_RUN.skim.evasion : 0),
      ...mod('the trench', approach === 'trench' && step >= 2 ? -ATTACK_RUN.trench.pursuerShot : 0),
      ...mod('power to engines', o.boost === 'engines' ? DOGFIGHT.boost.engines : 0),
    ];
    const [roll, r3] = contest(rng, { level: r.target.crew.gunnery, modifiers: [] }, { level: flyer.ship.crew.piloting, modifiers: evade });
    rng = r3;
    const q = hitQuality(roll.margin);
    if (q) {
      const dmg = defenceWeight(r.target) * DOGFIGHT.share[q] * (under ? 0.5 : 1);
      const res = applyFire(flyer.ship, { damage: dmg, kind: 'energy', facing: 'fore', shieldsOnly: q === 'graze' }, r.year);
      const [ship, r4] = settleHull(res.ship, rng);
      rng = r4;
      flyer = { ...flyer, ship };
      defence = { margin: roll.margin, toHull: res.toHull, toShield: res.toShield };
    } else defence = { margin: roll.margin, toHull: 0, toShield: 0 };
  }
  // 3. The strike, from close in.
  let target = r.target;
  let strike: RunTurn['strike'] = null;
  const what = o.shot ?? 'torpedo';
  if (step >= 2 && inFight(flyer.ship) && what !== 'none') {
    const v = strikeVolley(flyer, what) ?? (what === 'torpedo' ? strikeVolley(flyer, 'guns') : null);
    if (v) {
      const { facing, rolled } = struckFacing(target, o);
      if (rolled) notes.push(`${target.name} rolls to show a fresh facing`);
      const shotMods: Modifier[] = [...mod('a big target', -tc.handling), ...mod('the trench', approach === 'trench' && o.aim ? ATTACK_RUN.trench.shot : 0), ...mod('under the guns', step >= ATTACK_RUN.steps ? 1 : 0)];
      const [roll, r5] = contest(rng, { level: flyer.ship.crew.gunnery, modifiers: shotMods }, { level: target.crew.piloting, modifiers: [] });
      rng = r5;
      const q = v.kind === 'warhead' ? (roll.margin >= 0 ? 'solid' : null) : hitQuality(roll.margin);
      let toShield = 0;
      let toHull = 0;
      let system: ShipSystem | null = null;
      if (q) {
        const power = o.boost === 'lasers' ? DOGFIGHT.boost.lasers : o.weaken === 'lasers' ? DOGFIGHT.boost.lasersWeak : 1;
        const res = applyFire(target, { damage: v.damage * (v.kind === 'warhead' ? 1 : DOGFIGHT.share[q] * power), kind: v.kind, facing, timed: target.particleDown }, r.year);
        target = res.ship;
        toShield = res.toShield;
        toHull = res.toHull;
        if (toHull > 0 && target.hull > 0 && (roll.margin >= 8 || (approach === 'trench' && o.aim))) {
          [target, system, rng] = hitSystem(target, roll.margin >= 12 ? 'destroyed' : 'disabled', rng, approach === 'trench' ? o.aim : undefined);
        }
        [target, rng] = settleHull(target, rng);
      }
      if (v.kind === 'warhead') flyer = { ...flyer, ship: { ...flyer.ship, ammo: Object.fromEntries(Object.entries(flyer.ship.ammo).map(([k, n]) => [k, n - (v.spent[Number(k)] ?? 0)])) } };
      strike = { what: v.kind === 'warhead' ? 'torpedo' : 'guns', margin: roll.margin, facing, toShield, toHull, system };
      // Past the ship and round for another pass.
      step = 1;
    }
  }
  // Shields and ion recover on both for the five seconds.
  const minutes = TURN_SECONDS / 60;
  const recharged = (s: ShipState): ShipState => (s.destroyed ? s : passMinutes(s, minutes, r.year));
  const lost = !inFight(flyer.ship);
  const struck = !inFight(target) || target.disabledMinutes > 0;
  const rec: RunTurn = { n: r.turn + 1, approach, stepBefore: r.step, stepAfter: step, margin, defence, strike, notes };
  return {
    ...r,
    flyer: lost ? flyer : { ...flyer, ship: recharged(flyer.ship) },
    target: struck ? target : recharged(target),
    step,
    turn: r.turn + 1,
    rng,
    log: [...r.log, rec],
    end: lost ? { reason: 'lost' } : struck ? { reason: 'struck' } : null,
  };
}

/** The pilot's own choice, for a run handed to the code: skim under the guns, torpedoes at the weakest facing. */
export function autoRunOrders(r: AttackRun): RunOrders {
  const hasTorpedo = Object.values(r.flyer.ship.ammo).some((n) => n > 0);
  return { approach: r.trench ? 'trench' : 'skim', shot: hasTorpedo ? 'torpedo' : 'guns', ...(r.trench ? { aim: 'generator' as const } : {}) };
}

export const breakOffRun = (r: AttackRun): AttackRun => (r.end ? r : { ...r, end: { reason: 'brokeOff' } });
