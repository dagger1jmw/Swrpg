// The possessions slice (m8-ship-life part F; D-519; docs-v2/spec/ship-life.md section 9): the character's items and where each
// is, so the Possessions tab can show what is on them by carry slot and what is stored elsewhere. Until the equipment item
// (spec 22) builds items as data, an item is a price-catalog row (data/economyPrices.ts) with a size tag, from the start kit
// and from trade (bought, sold, issued). Credits, debts, ships and droids stay with their own features.
import { z } from 'zod';

export const ITEM_SIZES = ['small', 'medium', 'large', 'bulky', 'worn'] as const;
export type ItemSize = (typeof ITEM_SIZES)[number];

export const placeSchema = z.union([
  z.object({ kind: z.literal('carried') }),
  z.object({ kind: z.literal('ship'), shipId: z.string() }),
  /** A place on a world: quarters, a Temple locker, a safehouse. */
  z.object({ kind: z.literal('place'), name: z.string().max(60), world: z.string().max(80).nullable() }),
]);
export type ItemPlace = z.infer<typeof placeSchema>;

export const itemSchema = z.object({
  id: z.string(),
  priceId: z.string(),
  name: z.string().max(60),
  size: z.enum(ITEM_SIZES),
  where: placeSchema,
  /** Issued gear (the quartermaster, military kit, the start's Order or service kit): never a Jedi's holding. */
  issued: z.boolean(),
  day: z.number().int(),
});
export type Item = z.infer<typeof itemSchema>;

export const possessionsSliceSchema = z.object({
  items: z.array(itemSchema).max(200),
  nextId: z.number().int().min(1),
});
export type PossessionsSlice = z.infer<typeof possessionsSliceSchema>;
export const emptyPossessions = (): PossessionsSlice => ({ items: [], nextId: 1 });
