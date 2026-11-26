// Possessions feature (m8-ship-life part F; D-519; docs-v2/spec/ship-life.md section 9). Items and where they are. The page
// shows; the story acts: items come and go only through validated events (the economy's trade sends itemAcquired and
// itemRemoved; the narrator's words on the droid event, "item: stored the rifle in the ship's hold", move them). Every item
// needs a place on the body (the equipment design's carry rules): worn, a belt, two hip holsters and one on the back, pockets,
// a backpack if one is carried, then the hands. Everything is visible from anywhere; only what is with the character can be used.
import { z } from 'zod';
import { PRICE_BY_ID, resolvePriceId } from '../../data/economyPrices';
import { LOADOUT_BY_ARCHETYPE } from '../../data/weapons';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, HandleResult, InitCtx } from '../../state/types';
import { possessionsSliceSchema, type Item, type ItemPlace, type ItemSize, type PossessionsSlice } from './possessions';

type R = HandleResult<PossessionsSlice>;

/** Size tags by catalog row (the equipment design: small, medium a pistol, large a rifle, bulky a heavy weapon; worn). */
const SIZE: Readonly<Record<string, ItemSize>> = {
  holdout: 'small', comlink: 'small', medpac: 'small', glowrod: 'small', breathMask: 'small', datapad: 'small', binders: 'small', powerPack: 'small', vibroknife: 'small', fragGrenade: 'small', concussionGrenade: 'small', thermalDetonator: 'small', antidote: 'small', lightsaber: 'small', spice: 'small', forgedPapers: 'small', cyberImplant: 'small',
  pistol: 'medium', heavyPistol: 'medium', slugPistol: 'medium', disruptorPistol: 'medium', sonicPistol: 'medium', ionBlaster: 'medium', stunBaton: 'medium', vibroblade: 'medium', macrobinoculars: 'medium', toolKit: 'medium', fineBottle: 'medium', prostheticHand: 'medium',
  carbine: 'large', rifle: 'large', heavyRifle: 'large', sniper: 'large', slugRifle: 'large', disruptorRifle: 'large', sonicRifle: 'large', scattergun: 'large', bowcaster: 'large', vibrosword: 'large', sword: 'large', quarterstaff: 'large', forcePike: 'large', electrostaff: 'large', vibroAx: 'large', lightRepeater: 'large', stunNetLauncher: 'large', prosthetic: 'large',
  heavyRepeater: 'bulky', flamethrower: 'bulky', bactaTank: 'bulky',
  armorLight: 'worn', armorMedium: 'worn', armorHeavy: 'worn', blastVest: 'worn', personalShield: 'worn', clothes: 'worn', fineClothes: 'worn', backpack: 'worn', utilityBelt: 'worn',
};
/** Rows that are not things carried (services, food, vehicles, droids, ships go elsewhere). */
export const itemSizeOf = (priceId: string): ItemSize | null => SIZE[priceId] ?? null;

/** Carry slots (the equipment design; counts invented): a belt of small things, holsters, pockets, a backpack, two hands. */
export const CARRY = { belt: 4, beltWithUtility: 6, hip: 2, back: 1, pockets: 2, backpack: { small: 6, medium: 3, large: 2, bulky: 1 }, hands: 2 } as const;

export interface SlotView {
  slot: string;
  items: Item[];
}

/** The carried items by slot, in the carry rules' order (worn, holsters, belt, pockets, backpack, hands, then too much). */
export function carrySlots(items: readonly Item[]): SlotView[] {
  const carried = items.filter((i) => i.where.kind === 'carried');
  const worn = carried.filter((i) => i.size === 'worn');
  const pack = worn.some((i) => i.priceId === 'backpack');
  const beltCap = worn.some((i) => i.priceId === 'utilityBelt') ? CARRY.beltWithUtility : CARRY.belt;
  const out: Record<string, Item[]> = { worn, back: [], hip: [], belt: [], pockets: [], backpack: [], hands: [], 'too much to carry': [] };
  let packRoom = 1;
  const packCost = (sz: ItemSize): number => (sz === 'worn' ? 0 : 1 / CARRY.backpack[sz]);
  const rest = carried.filter((i) => i.size !== 'worn').sort((a, b) => ['bulky', 'large', 'medium', 'small'].indexOf(a.size) - ['bulky', 'large', 'medium', 'small'].indexOf(b.size));
  for (const i of rest) {
    if (i.size === 'large' && out['back']!.length < CARRY.back) out['back']!.push(i);
    else if (i.size === 'medium' && out['hip']!.length < CARRY.hip) out['hip']!.push(i);
    else if (i.size === 'small' && out['belt']!.length < beltCap) out['belt']!.push(i);
    else if (i.size === 'small' && out['pockets']!.length < CARRY.pockets) out['pockets']!.push(i);
    else if (pack && packRoom - packCost(i.size) >= -1e-9) {
      out['backpack']!.push(i);
      packRoom -= packCost(i.size);
    } else if (out['hands']!.length < CARRY.hands) out['hands']!.push(i);
    else out['too much to carry']!.push(i);
  }
  return Object.entries(out)
    .filter(([, v]) => v.length)
    .map(([slot, v]) => ({ slot, items: v }));
}

/** What the character can use now: only what is with them (Jared: everything is visible, only what is with you is usable). */
export const usableItems = (items: readonly Item[]): Item[] => items.filter((i) => i.where.kind === 'carried');

/** The start kit from the loadout (the weapons stub) and a comlink; a Jedi's or a soldier's kit is issued. */
function startKit(ctx: { start: { day: number }; character: InitCtx['character'] }): PossessionsSlice {
  const lo = LOADOUT_BY_ARCHETYPE[ctx.character.archetype ?? ''];
  const issued = ctx.character.path === 'jedi' || ctx.character.path === 'sith';
  const weapon: Readonly<Record<string, string>> = { lightsaber: 'lightsaber', blasterPistol: 'pistol', blasterRifle: 'rifle', heavy: 'heavyRifle', melee: 'vibroblade', slugPistol: 'slugPistol', slugRifle: 'slugRifle', scatterGun: 'scattergun' };
  const armour: Readonly<Record<string, string>> = { light: 'armorLight', medium: 'armorMedium', heavy: 'armorHeavy' };
  const ids = ['clothes', 'utilityBelt', 'comlink', ...(lo && weapon[lo.weapon] ? [weapon[lo.weapon]!] : []), ...(lo && armour[lo.armor] ? [armour[lo.armor]!] : [])];
  const items: Item[] = ids.map((priceId, n) => ({ id: `item-${n + 1}`, priceId, name: PRICE_BY_ID.get(priceId)?.name.replace(/\s*\(.*\)$/, '') ?? priceId, size: itemSizeOf(priceId) ?? 'small', where: { kind: 'carried' }, issued: issued || ['soldier', 'officer', 'navalOfficer'].includes(ctx.character.archetype ?? ''), day: ctx.start.day }));
  return { items, nextId: items.length + 1 };
}

/** A place named in plain words, as the narrator's "item:" words put it. */
export function placeFromWords(words: string, ships: readonly { id: string; name: string }[], world: string | null): ItemPlace | null {
  const t = words.toLowerCase();
  if (/\b(took|takes|picked up|picks up|retriev|grabbed|collect)/.test(t)) return { kind: 'carried' };
  const ship = ships.find((x) => t.includes(x.name.toLowerCase())) ?? (/\b(ship|hold|cargo bay|aboard)\b/.test(t) ? ships[0] : undefined);
  if (ship) return { kind: 'ship', shipId: ship.id };
  const name = /\blocker\b/.test(t) ? (/\btemple\b/.test(t) ? 'a Temple locker' : 'a locker') : /\bsafehouse|safe house\b/.test(t) ? 'a safehouse' : /\bquarters|room|barracks|cabin|apartment|home\b/.test(t) ? 'quarters' : null;
  return name ? { kind: 'place', name, world } : null;
}

function addItem(slice: PossessionsSlice, priceId: string, issued: boolean, day: number, where: ItemPlace = { kind: 'carried' }): PossessionsSlice {
  const size = itemSizeOf(priceId);
  if (!size) return slice;
  const item: Item = { id: `item-${slice.nextId}`, priceId, name: (PRICE_BY_ID.get(priceId)?.name ?? priceId).replace(/\s*\(.*\)$/, '').slice(0, 60), size, where, issued, day };
  return { items: [...slice.items, item].slice(-200), nextId: slice.nextId + 1 };
}

export const possessionsFeature: FeatureModule<PossessionsSlice, GameState> = {
  id: 'possessions',
  version: 1,
  initialState: (ctx) => startKit(ctx),
  emptyState: (raw) => {
    const c = (raw['character'] ?? {}) as InitCtx['character'];
    const day = ((raw['clock'] ?? { now: { day: 0 } }) as { now: { day: number } }).now.day;
    return startKit({ start: { day }, character: c });
  },
  stateSchema: possessionsSliceSchema,
  events: {
    /** Engine (the economy's trade): an item bought or issued. Rows that are not carried things are ignored. */
    itemAcquired: {
      schema: z.object({ type: z.literal('itemAcquired'), priceId: z.string(), qty: z.number().int().min(1).max(20).optional(), issued: z.boolean().optional() }),
      sources: ['engine', 'dev'],
      handle: (slice, e, ctx): R => {
        const id = String(e['priceId']);
        if (!itemSizeOf(id)) return { slice };
        let next = slice;
        for (let i = 0; i < Number(e['qty'] ?? 1); i++) next = addItem(next, id, e['issued'] === true, ctx.state.clock.now.day);
        return { slice: next };
      },
    },
    /** Engine (the economy's trade): an item sold; a carried one first. */
    itemRemoved: {
      schema: z.object({ type: z.literal('itemRemoved'), priceId: z.string(), qty: z.number().int().min(1).max(20).optional() }),
      sources: ['engine', 'dev'],
      handle: (slice, e): R => {
        let items = [...slice.items];
        for (let n = 0; n < Number(e['qty'] ?? 1); n++) {
          const i = items.findIndex((x) => x.priceId === e['priceId'] && x.where.kind === 'carried' && !x.issued);
          const j = i >= 0 ? i : items.findIndex((x) => x.priceId === e['priceId'] && !x.issued);
          if (j < 0) break;
          items = [...items.slice(0, j), ...items.slice(j + 1)];
        }
        return { slice: { ...slice, items } };
      },
    },
    /**
     * Engine (the droid event's "item:" words) or player: an item moved: stored aboard a ship, in quarters, a locker or a
     * safehouse, or taken back. Taking it back needs the character where it is (aboard the ship docked here, or on that world).
     */
    itemMoved: {
      schema: z.object({ type: z.literal('itemMoved'), what: z.string().max(120) }),
      sources: ['engine', 'player', 'dev'],
      handle: (slice, e, ctx): R => {
        const s = ctx.state;
        const words = String(e['what']).replace(/^\s*items?\s*:\s*/i, '');
        const ships = Object.values((s as { ships?: { ships: Record<string, { id: string; name: string; dockedAt: string | null }> } }).ships?.ships ?? {});
        const world = worldHere(s);
        const to = placeFromWords(words, ships, world);
        if (!to) return { reject: 'where to? (aboard the ship, quarters, a Temple locker, a safehouse; or "took X from ...")' };
        const priceId = resolvePriceId(words.replace(/\b(stored|stores|stashed|left|put|took|takes|picked up|in|into|on|aboard|at|from|the|my|ship's|hold|quarters|locker|safehouse)\b/gi, ' ').trim());
        const pool = slice.items.filter((i) => (to.kind === 'carried' ? i.where.kind !== 'carried' : i.where.kind === 'carried'));
        const item = (priceId ? pool.find((i) => i.priceId === priceId) : undefined) ?? pool.find((i) => words.toLowerCase().includes(i.name.toLowerCase().replace(/^an? /, '')));
        if (!item) return { reject: to.kind === 'carried' ? 'no such item stored anywhere' : 'the character carries no such item' };
        // Taking something back: the character must be where it is.
        if (to.kind === 'carried') {
          const w = item.where;
          const reachable = w.kind === 'ship' ? ships.some((x) => x.id === w.shipId && (x.dockedAt === null || (world !== null && x.dockedAt.toLowerCase() === world.toLowerCase()))) : w.kind === 'place' ? w.world === null || w.world === world : true;
          if (!reachable) return { reject: `${item.name} is not here: it is ${w.kind === 'ship' ? 'aboard a ship docked elsewhere' : `in ${(w as { name: string }).name} on ${(w as { world: string | null }).world}`}` };
        }
        if (to.kind === 'ship' && !ships.some((x) => x.id === to.shipId && (x.dockedAt === null || (world !== null && x.dockedAt.toLowerCase() === world.toLowerCase())))) return { reject: 'that ship is not here' };
        const items = slice.items.map((i) => (i.id === item.id ? { ...i, where: to } : i));
        return { slice: { ...slice, items }, notes: [`${item.name} ${to.kind === 'carried' ? 'taken back' : `stored ${to.kind === 'ship' ? 'aboard ship' : `in ${to.name}`}`}`] };
      },
    },
  },
  selectors: {},
};

/** The world the character is on (the nearest planet, moon or station in the location chain). */
export function worldHere(s: GameState): string | null {
  let id: string | null = s.locations.currentId;
  for (let i = 0; i < 10 && id; i++) {
    const l = s.locations.byId[id];
    if (!l) break;
    if (l.kind === 'planet' || l.kind === 'moon' || l.kind === 'station') return l.name;
    id = l.parentId;
  }
  return null;
}
