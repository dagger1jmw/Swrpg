// Possession selectors (m8-ship-life part F; D-519): the Possessions tab's sections, and what the character can use now.
import { JEDI_MONEY } from '../../data/economy.config';
import type { GameState } from '../../state/gameState';
import { carrySlots, usableItems, worldHere, type SlotView } from './index';
import type { Item, PossessionsSlice } from './possessions';

const slice = (s: GameState): PossessionsSlice | undefined => (s as { possessions?: PossessionsSlice }).possessions;

export const selectItems = (s: GameState): readonly Item[] => slice(s)?.items ?? [];
/** On the character, by carry slot. */
export const selectCarrySlots = (s: GameState): SlotView[] => carrySlots(selectItems(s));
/** Only what is with the character can be used (Jared). */
export const selectUsableItems = (s: GameState): Item[] => usableItems(selectItems(s));

/** Stored elsewhere, by place: a ship's hold, quarters, a locker, a safehouse. */
export function selectStoredByPlace(s: GameState): { place: string; here: boolean; items: Item[] }[] {
  const ships = (s as { ships?: { ships: Record<string, { name: string; dockedAt: string | null }> } }).ships?.ships ?? {};
  const world = worldHere(s);
  const out = new Map<string, { place: string; here: boolean; items: Item[] }>();
  for (const i of selectItems(s)) {
    if (i.where.kind === 'carried') continue;
    const w = i.where;
    const key = w.kind === 'ship' ? `ship:${w.shipId}` : `${w.name}@${w.world ?? ''}`;
    const ship = w.kind === 'ship' ? ships[w.shipId] : undefined;
    const place = w.kind === 'ship' ? `${ship?.name ?? 'a ship'}'s hold${ship?.dockedAt ? ` (${ship.dockedAt})` : ''}` : `${w.name}${w.world ? ` on ${w.world}` : ''}`;
    const here = w.kind === 'ship' ? !!ship && (ship.dockedAt === null || ship.dockedAt === world) : w.world === null || w.world === world;
    const e = out.get(key) ?? { place, here, items: [] };
    e.items.push(i);
    out.set(key, e);
  }
  return [...out.values()];
}

/** Holdings: the money and goods that count toward a Jedi's wealth limit, and what never does (D-511, Jared). */
export function selectHoldings(s: GameState): { counts: { label: string; credits: number }[]; never: string[]; limit: number | null } {
  const e = s.economy;
  const wallet = Math.round(e.wallet.republic + e.wallet.imperial + e.wallet.hutt * 0.625);
  const ships = (s as { ships?: { ships: Record<string, { name: string; hold: string; how: string; issuer: string | null }> } }).ships?.ships ?? {};
  const never: string[] = [];
  for (const x of Object.values(ships)) if (x.hold === 'issued') never.push(`${x.name} (issued by ${x.issuer ?? 'the issuer'})`);
  for (const x of Object.values(ships)) if (x.hold !== 'issued' && !['bought', 'boughtUsed', 'financed'].includes(x.how)) never.push(`${x.name} (taken in play: ${x.how})`);
  for (const d of s.droids.units) never.push(`${d.name} (a droid)`);
  const issued = selectItems(s).filter((i) => i.issued);
  if (issued.length) never.push(`issued gear: ${issued.map((i) => i.name).join(', ')}`);
  if (e.orderFunds > 0) never.push(`the Order's mission funds (${Math.round(e.orderFunds).toLocaleString('en-US')} cr, to be returned)`);
  return { counts: [{ label: 'credits on hand', credits: wallet }, { label: 'goods and ships bought (at their price)', credits: Math.round(e.possessions) }], never, limit: s.character.path === 'jedi' ? JEDI_MONEY.wealth : null };
}
