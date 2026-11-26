// Medicine inside the health feature (M8 item 6; medicine.md; D-511): marking care on wounds, healing with the treatment
// roll, the daily untreated risks and toxins, and surgery's effects. Pure functions over the health slice; the rules
// themselves are in engine/medicine.ts.
import { partText } from '../../engine/duel';
import { LASTING_CHANCE, SEVERITIES, type BodyPart, type Severity } from '../../data/health.config';
import { DEFAULT_OPERATOR, UNTREATED, type CareLevel, type SurgeryProcedure } from '../../data/medicine.config';
import { isHealed } from '../../engine/healing';
import { isFittedAid, lastingKindFor, type LastingInjury } from '../../engine/lasting';
import { bandWorse, betterCare, healsAs, toxinDay, treatmentOutcome, treatmentQuality, untreatedDay, untreatedOutcome, untreatedRiskFactor, type HealOutcome } from '../../engine/medicine';
import { nextFloat, type RngState } from '../../engine/rng';
import type { Wound } from '../../engine/wounds';
import type { GameState } from '../../state/gameState';
import type { HealthSlice } from './health';

const LOST: readonly string[] = ['lostHand', 'lostArm', 'lostLeg'];
const sevAt = (s: Severity): number => SEVERITIES.indexOf(s);

/** The operator a care level has by default: a medic in the field, a medcenter's staff for a facility or a tank. */
const defaultOperator = (level: CareLevel): number => (level === 'field' ? DEFAULT_OPERATOR.field : DEFAULT_OPERATOR.medcenter);

/**
 * A wound given care (D-511): dressed (no untreated risks, infection cleared), a bone set, and the best care it has had with
 * that care's operator kept for the treatment roll. A toxin stays until an antidote or a Force purge.
 */
export function markCare(w: Wound, level: CareLevel, operator: number | undefined): Wound {
  const best = betterCare(w.care, level);
  const op = best === level && (w.care !== level || (operator ?? defaultOperator(level)) > (w.operator ?? 0)) ? (operator ?? defaultOperator(level)) : w.operator;
  const { infected: _i, ...rest } = w;
  return { ...rest, treated: true, ...(w.depth === 'bone' ? { set: true } : {}), care: best, ...(op !== undefined ? { operator: op } : {}) };
}

/** The severity the treatment roll is made against: a stabilized mortal is mortal; a deep cut its depth's severity. */
const rollSeverity = (w: Wound): Severity => (w.stabilized ? 'mortal' : healsAs(w.severity, w.depth));

/** How a healed wound healed: the treatment roll for a wound that had care, health §7's baseline for one that had none. */
function outcomeOf(w: Wound, u: number): HealOutcome {
  const sev = rollSeverity(w);
  if (w.care && w.care !== 'none') return treatmentOutcome(sev, treatmentQuality(w.operator ?? defaultOperator(w.care), w.care), u);
  return untreatedOutcome(sev, LASTING_CHANCE[sev] ?? 0, u);
}

const OUTCOME_WORDS: Readonly<Record<HealOutcome, string>> = { clean: 'has healed cleanly', scar: 'has healed, leaving a scar', minorLasting: 'has healed, but left a minor lasting injury', lasting: 'has healed, but left a lasting injury' };

/**
 * Progresses every wound and settles the healed ones: a severe or worse wound rolls once (the treatment roll or the baseline),
 * leaving a lasting injury, a minor one, a scar or nothing. A severed limb's stump just heals (the loss is already lasting).
 */
export function healAll(slice: HealthSlice, _s: GameState, progress: (w: Wound) => Wound, rng0: RngState, day?: number): { slice: HealthSlice; notices: string[]; rng: RngState; rolled: boolean } {
  let rng = rng0;
  let rolled = false;
  const kept: Wound[] = [];
  const lasting = [...slice.lasting] as LastingInjury[];
  const scars = [...(slice.scars ?? [])];
  const notices: string[] = [];
  let seq = slice.woundSeq;
  for (const w0 of slice.wounds as Wound[]) {
    if (w0.severity === 'mortal' && !w0.stabilized) {
      kept.push(w0);
      continue;
    }
    const w = progress(w0);
    if (!isHealed(w)) {
      kept.push(w);
      continue;
    }
    const where = partText(w.part);
    const sev = rollSeverity(w);
    if (w.severed || sevAt(sev) < sevAt('severe')) {
      notices.push(`A ${w.severity} wound to the ${where} has healed.`);
      continue;
    }
    const [u, r] = nextFloat(rng);
    rng = r;
    rolled = true;
    const out = outcomeOf(w, u);
    const d = day ?? w.day;
    if (out === 'lasting' || out === 'minorLasting') {
      lasting.push({ id: `pc:l${seq}`, kind: lastingKindFor(w), part: w.part, adaptation: 0, aid: 'scarTissue', adaptedToday: 0, adaptDay: -1, day: d, ...(out === 'minorLasting' ? { minor: true } : {}) });
      seq += 1;
    }
    if (out === 'scar' && scars.length < 40) scars.push({ part: w.part, day: d, from: `a ${w.severity} wound` });
    notices.push(`A ${w.severity} wound to the ${where} ${OUTCOME_WORDS[out]}.`);
  }
  return { slice: { ...slice, wounds: kept, lasting, woundSeq: seq, ...(scars.length || slice.scars ? { scars } : {}) }, notices, rng, rolled };
}

/** A band worse, never past critical by the day's risks (bleeding and toxins weaken; they do not start a dying timer). */
function worsened(w: Wound): Wound {
  if (sevAt(w.severity) >= sevAt('critical')) return w;
  const b = bandWorse(w.severity);
  return { ...w, severity: b.severity, W: Math.max(w.W, b.W) };
}

/**
 * One day's untreated risks and toxins (D-511): an untreated tearing wound may infect, and a severe one bleeds (Vitality) and
 * may worsen; a cauterized one only infects, at the lower chance. A toxin drains Vitality and may worsen the wound. Draws only
 * for wounds that carry a risk, so wounds without a cause (older saves) change nothing.
 */
export function riskDay(slice: HealthSlice, speciesId: string | null, today: number, maxVitality: number, rng0: RngState): { slice: HealthSlice; notices: string[]; rng: RngState; rolled: boolean } {
  let rng = rng0;
  let rolled = false;
  let drain = 0;
  const notices: string[] = [];
  const wounds = (slice.wounds as Wound[]).map((w0) => {
    let w = w0;
    const factor = untreatedRiskFactor(w.cause, speciesId);
    if (!w.treated && factor > 0 && !(w.severity === 'mortal' && !w.stabilized)) {
      const [u1, r1] = nextFloat(rng);
      const [u2, r2] = nextFloat(r1);
      rng = r2;
      rolled = true;
      const d = untreatedDay(w, today, factor, u1, u2);
      if (d.infects) {
        w = { ...w, infected: true };
        notices.push(`The untreated wound to the ${partText(w.part)} has become infected (it heals at half speed until treated).`);
      }
      if (d.bleeds) drain += UNTREATED.bleedVitality;
      if (d.worsens) {
        const before = w.severity;
        w = worsened(w);
        if (w.severity !== before) notices.push(`The untreated wound to the ${partText(w.part)} is bleeding and has worsened to ${w.severity}.`);
      }
    }
    if (w.toxin) {
      const [u, r] = nextFloat(rng);
      rng = r;
      rolled = true;
      const t = toxinDay(u);
      drain += t.vitality;
      if (t.worsens) {
        const before = w.severity;
        w = worsened(w);
        if (w.severity !== before) notices.push(`The ${w.toxin} in the wound to the ${partText(w.part)} has worsened it to ${w.severity}.`);
      }
    }
    return w;
  });
  const vitalityLost = Math.min(maxVitality, slice.vitalityLost + drain * maxVitality);
  return { slice: { ...slice, wounds, vitalityLost }, notices, rng, rolled };
}

type SurgeryR = { slice: HealthSlice; notes: string[] } | { reject: string };

/** Surgery's effect (D-511): the full benefit on success, a lesser one when `weaker`, a complication when `worse`. */
export function surgery(slice: HealthSlice, s: GameState, procedure: SurgeryProcedure, result: 'success' | 'weaker' | 'worse', aid: 'basicProsthetic' | 'qualityCybernetic', operator: number): SurgeryR {
  const day = Math.floor((s.clock.now.day * 86_400 + s.clock.now.second) / 86_400);
  const wounds = slice.wounds as Wound[];
  if (procedure === 'prosthetic') {
    const lasting = slice.lasting as LastingInjury[];
    const i = lasting.findIndex((l) => LOST.includes(l.kind) && (!isFittedAid(l.aid) || l.aidCondition === 'broken' || (aid === 'qualityCybernetic' && l.aid === 'basicProsthetic')));
    if (i < 0) return { reject: 'no lost limb to fit a prosthetic to' };
    const l = lasting[i]!;
    const where = partText(l.part);
    if (result === 'worse') {
      const stump: Wound = { id: `pc:w${slice.woundSeq}`, part: l.part, severity: 'moderate', W: 10, stabilized: false, healProgress: 0, day, source: 'surgery', cause: 'blade', treated: true, care: 'facility', operator };
      return { slice: { ...slice, wounds: [...wounds, stump], woundSeq: slice.woundSeq + 1 }, notes: [`the fitting surgery on the ${where} failed badly: no prosthetic, and a moderate wound to the stump`] };
    }
    const fitted: LastingInjury = result === 'success' ? { ...l, aid } : { ...l, aid: 'basicProsthetic', aidCondition: 'damaged' };
    if (result === 'success') delete fitted.aidCondition;
    return { slice: { ...slice, lasting: lasting.map((x, j) => (j === i ? fitted : x)) }, notes: [result === 'success' ? `a ${aid === 'qualityCybernetic' ? 'quality cybernetic' : 'basic prosthetic'} fitted to the ${where}` : `a poor fit on the ${where}: a basic prosthetic that works badly (damaged) until it is refitted`] };
  }
  if (procedure === 'internal') {
    const serious = wounds.filter((w) => !w.severed && sevAt(rollSeverity(w)) >= sevAt('severe')).sort((a, b) => Number(b.part === 'torso' || b.part === 'head') - Number(a.part === 'torso' || a.part === 'head') || sevAt(rollSeverity(b)) - sevAt(rollSeverity(a)));
    const target = serious[0];
    if (!target) return { reject: 'no severe or worse internal wound to operate on' };
    const where = partText(target.part as BodyPart);
    const next = (w: Wound): Wound => (result === 'success' ? { ...markCare(w, 'facility', operator), operated: true } : result === 'weaker' ? markCare(w, 'facility', operator) : worsened(markCare(w, 'facility', operator)));
    return { slice: { ...slice, wounds: wounds.map((w) => (w.id === target.id ? next(w) : w)) }, notes: [result === 'success' ? `surgery on the ${where}: it heals as one band lighter` : result === 'weaker' ? `surgery on the ${where} did little: the wound heals as it was` : `surgery on the ${where} went wrong: the wound is worse`] };
  }
  const targets = wounds.filter((w) => w.toxin || w.fragments);
  if (!targets.length) return { reject: 'nothing to extract: no toxin source or shrapnel in any wound' };
  const ids = new Set(targets.map((w) => w.id));
  const next = (w: Wound): Wound => {
    if (!ids.has(w.id)) return w;
    if (result === 'worse') return worsened(w);
    const { toxin: _t, fragments: _f, ...clean } = w;
    return result === 'success' ? clean : { ...clean, healProgress: 0 };
  };
  return { slice: { ...slice, wounds: wounds.map(next) }, notes: [result === 'success' ? 'the toxin source and shrapnel extracted' : result === 'weaker' ? 'extracted, but the wounds were reopened (healing starts again)' : 'the extraction failed: the wounds are worse, and what was in them is still there'] };
}
