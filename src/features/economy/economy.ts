// The economy slice (M8 checklist item 5; docs-v2/spec/economy.md section 9). The code owns every credit: the wallet changes
// only through this feature's handlers and its day hook, never by an amount the narrator writes.
import { z } from 'zod';
import { CURRENCIES, DEBT_STAGES, LENDERS, LIFESTYLES, MILITARY_GRADES, WAGE_TIERS } from '../../data/economy.config';

export const walletSchema = z.object({
  republic: z.number().int().min(0),
  imperial: z.number().int().min(0),
  /** Hutt coin, counted in wupiupi. */
  hutt: z.number().int().min(0),
});

export const jobSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('none') }),
  /** The Jedi Order: no pay; room, board and gear from the quartermaster. */
  z.object({ kind: z.literal('order') }),
  z.object({ kind: z.literal('military'), grade: z.enum(MILITARY_GRADES), currency: z.enum(CURRENCIES) }),
  z.object({ kind: z.literal('wage'), tier: z.enum(WAGE_TIERS), currency: z.enum(CURRENCIES) }),
]);
export type Job = z.infer<typeof jobSchema>;

export const loanSchema = z.object({
  id: z.string(),
  lender: z.enum(LENDERS),
  principal: z.number().int().min(0),
  balance: z.number().int().min(0),
  currency: z.enum(CURRENCIES),
  startDay: z.number().int(),
  nextDueDay: z.number().int(),
  missed: z.number().int().min(0),
  stage: z.enum(DEBT_STAGES),
});

export const economySliceSchema = z.object({
  wallet: walletSchema,
  /** The Order's expense funds for a mission (Republic credits), kept apart from the Jedi's own money and returned. */
  orderFunds: z.number().int().min(0),
  lifestyle: z.enum(LIFESTYLES),
  job: jobSchema,
  loans: z.array(loanSchema),
  nextLoan: z.number().int().min(1),
  /** A Jedi's rewards kept: when, how much, and whether another Jedi saw it or the Order found out. */
  rewards: z.array(z.object({ day: z.number().int(), credits: z.number().int().min(0), known: z.boolean() })),
  /** What a Jedi has spent on goods of their own (not meals or rooms, not issued gear): possessions, for attachment. */
  possessions: z.number().int().min(0),
  /** Credits taken from NPCs, by NPC (their purse is what they carried less this). */
  looted: z.record(z.string(), z.number().int().min(0)),
  /** Theft and extortion: dark-side choices for the alignment system to read once it is built. */
  darkChoices: z.array(z.object({ day: z.number().int(), kind: z.enum(['theft', 'extortion']), credits: z.number().int().min(0) })),
  /** The day the character ran out of money for even a poor living; null when they can pay. */
  destituteSince: z.number().int().nullable(),
  /** Recent money movements, newest last (the code's record; the narrator reads the lines built from it). */
  log: z.array(z.object({ day: z.number().int(), credits: z.number().int(), currency: z.enum(CURRENCIES), reason: z.string().max(120), toldTurn: z.number().int().nullable() })),
});
export type EconomySlice = z.infer<typeof economySliceSchema>;
