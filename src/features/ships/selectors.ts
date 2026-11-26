// Ship selectors (m8-ship-life, D-519): read-only views for the narrator's STATE block, travel, battles and the Possessions tab.
import { MOD_BY_ID, SHIP_RENOWN } from '../../data/shipLife.config';
import { RUNNING_COSTS } from '../../data/shipPrices';
import { capacityUsed, classLife, driveOf, overCapacity, shipEffects } from '../../engine/shipLife';
import { shipClass } from '../../engine/ships';
import type { GameState } from '../../state/gameState';
import type { OwnedShip, ShipsSlice } from './ships';

export type { OwnedShip };

const slice = (s: GameState): ShipsSlice | undefined => (s as { ships?: ShipsSlice }).ships;

export const selectShips = (s: GameState): readonly OwnedShip[] => Object.values(slice(s)?.ships ?? {});
export const selectShip = (s: GameState, id: string): OwnedShip | null => slice(s)?.ships[id] ?? null;
export const selectActiveShip = (s: GameState): OwnedShip | null => {
  const sl = slice(s);
  return sl?.activeId ? (sl.ships[sl.activeId] ?? null) : null;
};
/** The battles slice's condition of a ship (hull, systems), when a battle has left one. */
export const selectShipCondition = (s: GameState, id: string) => s.battles?.ships?.[id] ?? null;

/** A ship the character can fly from where they are: docked at this world (or with no dock on record), not impounded, out of the yard. */
export function selectShipAt(s: GameState, world: string | null): OwnedShip | null {
  const usable = (x: OwnedShip): boolean => !x.impounded && (x.yardUntil === null || x.yardUntil <= s.clock.now.day) && classLife(x.classId).drive !== null;
  const all = selectShips(s).filter(usable);
  const here = all.filter((x) => x.dockedAt === null || (world !== null && x.dockedAt.toLowerCase() === world.toLowerCase()));
  const active = selectActiveShip(s);
  return (active && here.some((x) => x.id === active.id) ? active : here[0]) ?? null;
}

/** Ships that count toward a Jedi's 25,000 cr limit: bought and owned ones only (issued ones and those taken in play never). */
export const shipCountsAsHolding = (x: OwnedShip): boolean => x.hold === 'owned' && (x.how === 'bought' || x.how === 'boughtUsed' || x.how === 'financed');

export interface ShipCard {
  id: string;
  name: string;
  className: string;
  hold: string;
  docked: string;
  hull: string;
  systems: string;
  mods: string;
  capacity: string;
  transponder: string;
  cargo: string;
  crew: string;
  supplies: string;
  flags: string;
  drive: string;
  wear: string;
  holding: boolean;
}

/** The Possessions tab's card for each ship (spec F). */
export function selectShipCards(s: GameState): ShipCard[] {
  return selectShips(s).map((x) => {
    const cls = shipClass(x.classId);
    const life = classLife(x.classId);
    const cond = selectShipCondition(s, x.id);
    const hullMax = Math.round(cls.hull * shipEffects(x.classId, x.mods).hullX);
    const broken = Object.entries(cond?.systems ?? {}).filter(([, v]) => v !== 'working');
    const over = overCapacity(x.classId, x.mods);
    const drive = driveOf(x.classId, x.mods);
    return {
      id: x.id,
      name: x.name,
      className: cls.name,
      hold: x.hold === 'issued' ? `issued by ${x.issuer ?? 'the issuer'}` : x.hold === 'stolen' ? `stolen${x.formerOwner ? ` from ${x.formerOwner}` : ''}` : `owned (${x.how})`,
      docked: x.impounded ? 'impounded' : x.yardUntil !== null && x.yardUntil > s.clock.now.day ? 'in a shipyard' : (x.dockedAt ?? 'with the character'),
      hull: cond ? `${Math.max(0, Math.round(cond.hull))} / ${hullMax}` : `${hullMax} / ${hullMax}`,
      systems: broken.length ? broken.map(([k, v]) => `${k} ${v}${x.patched.includes(k) ? ' (patched)' : ''}`).join(', ') : x.patched.length ? `patched: ${x.patched.join(', ')}` : 'all working',
      mods: x.mods.length ? x.mods.map((m) => MOD_BY_ID.get(m)?.name ?? m).join(', ') : 'stock',
      capacity: `${capacityUsed(x.mods)} / ${life.capacity}${over ? ` (${over} over)` : ''}`,
      transponder: x.transponder === 'real' ? (x.reportedStolen ? 'real (reported stolen)' : 'real') : x.transponder,
      cargo: x.cargo.length ? x.cargo.map((c) => `${c.units} ${c.what}${c.hidden ? ' (hidden)' : ''}${c.contraband ? ' [contraband]' : ''}`).join('; ') : 'empty',
      crew: x.crew.length ? x.crew.map((c) => `${c.name} (${c.role}, ${c.pay}, loyalty ${c.loyalty})`).join('; ') : 'none',
      supplies: `${Math.round(x.supplies)} of ${life.consumablesDays} days; fuel ${RUNNING_COSTS[cls.kind].fuelPerJump.toLocaleString('en-US')} cr a jump`,
      flags: [x.flagged ? 'flagged by customs' : '', x.renown >= SHIP_RENOWN.famous ? 'famous' : x.renown >= SHIP_RENOWN.known ? 'known' : ''].filter(Boolean).join(', ') || 'none',
      drive: drive === null ? 'no hyperdrive' : `Class ${drive}`,
      wear: x.wear >= 0.5 ? 'badly worn' : x.wear >= 0.25 ? 'worn' : 'well kept',
      holding: shipCountsAsHolding(x),
    };
  });
}

/** The narrator's STATE lines: the ships, how to report ship acts, and news not yet told. */
export function selectShipLines(s: GameState): string[] {
  const sl = slice(s);
  if (!sl) return [];
  const out: string[] = [];
  const ships = selectShips(s);
  if (ships.length) {
    out.push(
      `SHIPS (the engine owns them: buy or sell with trade naming the class; everything else with the shipAct event (where it is not offered, the droid event's words starting "ship:") — salvaged, won, stole, issued, renamed, the transponder altered or removed, a mod fitted "at a shipyard" or "with a kit", shipyard repairs, an overhaul, crew hired or dismissed, cargo loaded or unloaded "in a hidden compartment", pushed): ${ships
        .map((x) => {
          const c = selectShipCondition(s, x.id);
          const hurt = c ? Object.entries(c.systems).filter(([, v]) => v !== 'working').map(([k, v]) => `${k} ${v}`) : [];
          return `${x.name} (${shipClass(x.classId).name}; ${x.hold}${x.issuer ? ` by ${x.issuer}` : ''}; ${x.impounded ? 'impounded' : (x.dockedAt ?? 'here')}; transponder ${x.transponder}${x.flagged ? '; flagged' : ''}${x.renown >= SHIP_RENOWN.known ? `; ${x.renown >= SHIP_RENOWN.famous ? 'famous' : 'known'} ship, recognised` : ''}${hurt.length ? `; ${hurt.join(', ')}` : ''}${x.crew.length ? `; crew ${x.crew.map((m) => m.name).join(', ')}` : ''}${x.cargo.some((k) => k.contraband) ? '; carrying contraband' : ''})`;
        })
        .join('; ')}.`,
    );
  }
  if (sl.lastCustoms && !sl.lastCustoms.told) out.push(`Customs (decided by the engine; narrate exactly this): at ${sl.lastCustoms.world}, ${sl.lastCustoms.outcome}${sl.lastCustoms.found.length ? `: ${sl.lastCustoms.found.join('; ')}` : ''}.`);
  for (const n of sl.news.filter((x) => !x.told).slice(-4)) out.push(`Ship news (engine): ${n.text}.`);
  return out;
}

export const selectShipsUntold = (s: GameState): boolean => {
  const sl = slice(s);
  return !!sl && (sl.news.some((n) => !n.told) || (sl.lastCustoms !== null && !sl.lastCustoms.told));
};
