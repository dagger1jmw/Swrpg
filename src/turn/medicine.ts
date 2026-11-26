// Care from a turn's intent (M8 item 6; medicine.md §1, §9; D-511). The narrator never sets health: a healing intent (treat,
// admit, tank, surgery, antidote, Force healer) becomes schema-checked health events, the surgery roll, and the bill, charged
// through the economy (creditsCharged) unless the care is free (Jedi with the Temple's healers, soldiers in a military medbay).
import type { Intent } from '../ai/schemas/intent';
import { PRICE_BY_ID } from '../data/economyPrices';
import { DEFAULT_OPERATOR, FORCE_PURGE, MEDICAL_PRICE, TANK_MIN_HOURS, type CarePlace } from '../data/medicine.config';
import { dateFromAbsDay } from '../engine/calendar';
import { listPrice } from '../engine/economy';
import { baseHealDays } from '../engine/healing';
import { aidRepairPrice, careIsFree, careMultiplier, prostheticPrice, surgeryRefusal, surgeryRoll, tankDayPrice, tankFluid } from '../engine/medicine';
import { nextFloat } from '../engine/rng';
import type { Wound } from '../engine/wounds';
import { selectPath } from '../features/character/selectors';
import { selectMarket } from '../features/economy/selectors';
import { selectNpc, selectNpcLevel } from '../features/npcs/selectors';
import { selectLevelExact, selectPerformance } from '../features/progression/selectors';
import type { GameState } from '../state/gameState';
import type { GameEvent } from '../state/types';

export type HealingIntent = NonNullable<Intent['healing']>;

/** Default care spans (D-160): a facility 7 days, a Force healer 1 hour. A tank runs until the wounds would heal (D-511). */
export const CARE_DEFAULT_HOURS = { admit: 7 * 24, forceHealer: 1 } as const;

const LEGACY: Readonly<Record<string, HealingIntent['source']>> = { medical: 'admit', bacta: 'tank' };

export interface CarePlan {
  events: GameEvent[];
  report: string[];
  /** The rng after a surgery roll, or null when nothing was drawn. */
  rng: GameState['meta']['rngState'] | null;
}

const service = (s: GameState, base: number): number => listPrice({ base, kind: 'service', legality: 'legal' }, selectMarket(s));
const item = (s: GameState, id: string): number => listPrice(PRICE_BY_ID.get(id)!, selectMarket(s));

/** Who is treated free where (spec §9): a Jedi at the Temple, a soldier in a military medbay; issued medpacs for both. */
function freeHere(s: GameState, place: CarePlace): boolean {
  const job = s.economy.job.kind;
  return careIsFree(place, { jedi: selectPath(s) === 'jedi' || job === 'order', soldier: job === 'military' });
}
/** Medpacs and antidotes from the Order's quartermaster or military kit cost nothing. */
const issued = (s: GameState): boolean => s.economy.job.kind === 'order' || s.economy.job.kind === 'military';

/** The hours a tank needs to heal every wound it can (at least TANK_MIN_HOURS). */
function tankHours(s: GameState, mult: number): number {
  const need = (s.health.wounds as Wound[]).filter((w) => !(w.severity === 'mortal' && !w.stabilized)).map((w) => ((1 - w.healProgress) * baseHealDays(w) * 24) / mult);
  return Math.max(TANK_MIN_HOURS, Math.ceil(Math.max(0, ...need)));
}

/**
 * The care a healing intent gives (spec §1-§9), or a refusal in the report. `spanHours` is the turn's span when it has one
 * (a jump's days, a scene's stated time); a tank runs until the wounds heal, no longer than the span.
 */
export function carePlan(s: GameState, h: HealingIntent, spanHours: number | null, opts: { dying: boolean }): CarePlan {
  const source = LEGACY[h.source] ?? h.source;
  const healer = h.healerRef && selectNpc(s, h.healerRef) ? h.healerRef : null;
  const place: CarePlace = h.at ?? (source === 'treat' || source === 'forceHealer' ? 'field' : 'medcenter');
  const free = freeHere(s, place);
  const operator = healer ? selectNpcLevel(s, healer, 'medicine') : place === 'field' ? Math.max(DEFAULT_OPERATOR.field, selectPerformance(s, 'medicine')) : DEFAULT_OPERATOR[place];
  const events: GameEvent[] = [];
  const report: string[] = [];
  const charge = (credits: number, reason: string): void => {
    if (credits > 0) events.push({ type: 'creditsCharged', credits: Math.round(credits), reason, lender: 'bank' });
  };
  const year = dateFromAbsDay(s.clock.now.day).year;
  const wounds = s.health.wounds as Wound[];
  switch (source) {
    case 'treat': {
      if (!wounds.length) return { events, report: ['field care: no wounds to treat'], rng: null };
      // The dying are stabilized by the Medicine check (health §6); field care then dresses the rest.
      events.push({ type: 'careStarted', kind: 'field', hours: 0, operator });
      if (!(issued(s) || free)) charge(healer ? item(s, 'doctor') : item(s, 'medpac'), healer ? "a medic's treatment" : 'a medpac used');
      if (opts.dying) report.push('field care: the dying wound is stabilized only by the Medicine check');
      return { events, report, rng: null };
    }
    case 'admit': {
      const hours = spanHours ?? CARE_DEFAULT_HOURS.admit;
      if (wounds.length) events.push({ type: 'careStarted', kind: 'medical', hours, operator });
      const broken = s.health.lasting.filter((l) => l.aidCondition && (l.aid === 'basicProsthetic' || l.aid === 'qualityCybernetic'));
      if (broken.length) {
        events.push({ type: 'prostheticRepaired' });
        if (!free) charge(broken.reduce((a, l) => a + aidRepairPrice(l.aid as 'basicProsthetic' | 'qualityCybernetic', l.part, l.aidCondition!), 0), 'prosthetic repairs');
      }
      if (!free && wounds.length) charge(item(s, 'doctor') + service(s, MEDICAL_PRICE.facilityDay) * Math.max(1, Math.ceil(hours / 24)), `medical care (${place}, ${Math.max(1, Math.ceil(hours / 24))} days)`);
      if (!wounds.length && !broken.length) report.push('a medical facility: nothing to treat');
      return { events, report, rng: null };
    }
    case 'tank': {
      if (!wounds.length) return { events, report: ['a tank: no wounds to heal'], rng: null };
      const zone = selectMarket(s).zone;
      const fluid = tankFluid(year, h.fluid, { zone, place });
      if (h.fluid && h.fluid !== fluid) report.push(`${h.fluid} is rare here and now: a ${fluid} tank instead`);
      const need = tankHours(s, careMultiplier(fluid));
      const hours = spanHours !== null ? Math.min(spanHours, need) : need;
      events.push({ type: 'careStarted', kind: fluid, hours, operator });
      if (!free) charge(service(s, tankDayPrice(year, fluid)) * Math.max(1, Math.ceil(hours / 24)), `a ${fluid} tank (${Math.max(1, Math.ceil(hours / 24))} days)`);
      report.push(`a ${fluid} tank for ${hours} h: the patient does nothing else`);
      return { events, report, rng: null };
    }
    case 'antidote': {
      if (!wounds.some((w) => w.toxin)) return { events, report: ['an antidote: no toxin to treat'], rng: null };
      events.push({ type: 'toxinsPurged', by: place === 'field' ? 'an antidote from a medpac' : 'an antidote at a medical facility' });
      if (!(issued(s) || free)) charge(item(s, 'antidote'), 'an antidote');
      return { events, report, rng: null };
    }
    case 'surgery': {
      const refused = surgeryRefusal(place, operator);
      if (refused) return { events, report: [`surgery refused: ${refused}`], rng: null };
      const procedure = h.procedure ?? (s.health.lasting.some((l) => ['lostHand', 'lostArm', 'lostLeg'].includes(l.kind) && l.aid !== 'qualityCybernetic') ? 'prosthetic' : wounds.some((w) => w.toxin || w.fragments) ? 'extract' : 'internal');
      const [u, rng] = nextFloat(s.meta.rngState);
      const roll = surgeryRoll(procedure, operator, u);
      const aid = h.aid === 'cybernetic' ? 'qualityCybernetic' : 'basicProsthetic';
      events.push({ type: 'surgeryDone', procedure, result: roll.result, aid, operator });
      report.push(`surgery (${procedure}) by an operator with Medicine ${Math.round(operator)}: ${roll.result} (margin ${roll.margin.toFixed(1)})`);
      if (!free) {
        const lost = s.health.lasting.find((l) => ['lostHand', 'lostArm', 'lostLeg'].includes(l.kind));
        const limb = procedure === 'prosthetic' && lost && roll.result !== 'worse' ? prostheticPrice(roll.result === 'success' ? aid : 'basicProsthetic', lost.part) : 0;
        charge(service(s, MEDICAL_PRICE.surgery[procedure]) + limb, `surgery (${procedure})${limb ? ' and the prosthetic' : ''}`);
      }
      return { events, report, rng };
    }
    case 'forceHealer': {
      const healerLevel = healer ? selectNpcLevel(s, healer, 'forceHealOthers') : selectLevelExact(s, 'forceHealSelf');
      if (healerLevel < 1) return { events, report: ['no Force healer: no Force healing applied'], rng: null };
      if (wounds.length) events.push({ type: 'careStarted', kind: 'forceHealer', hours: spanHours ?? CARE_DEFAULT_HOURS.forceHealer, healerLevel });
      // The Force purge (Detoxify Poison; force-catalog-m6): a healer's Force Heal (Others), or the character's own with Meditation.
      const purges = healer ? healerLevel >= FORCE_PURGE.others : healerLevel >= FORCE_PURGE.self && selectLevelExact(s, 'meditation') >= FORCE_PURGE.meditation;
      if (purges && wounds.some((w) => w.toxin)) events.push({ type: 'toxinsPurged', by: 'the Force (Detoxify Poison)' });
      return { events, report, rng: null };
    }
  }
  return { events, report, rng: null };
}
