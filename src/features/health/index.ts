// Health feature (health.md; architecture §2). M3 built the meters; M5 adds Vitality, wounds, lasting injuries,
// dying, death, care and healing over time. Only this feature changes them, through engine events from combat
// resolution, hazards, healing and the clock. The AI never sets a value. Status is derived on every read.
import { z } from 'zod';
import { FALL_LOCATION_WEIGHTS, HAZARD_TYPES, LOCATION_WEIGHTS, VITALITY_RECOVERY, type BodyPart } from '../../data/health.config';
import { stubProsthetic } from '../../data/stubs';
import { applyDamage, hazardDamage, rollLocation, severityOf } from '../../engine/damage';
import { afterSleep, rest, sleepCarry } from '../../engine/fatigue';
import { healMultiplier, healsOvernight, isHealed, lastingChance, progressHealing } from '../../engine/healing';
import { adapt, lastingAffects, lastingKindFor, type LastingInjury } from '../../engine/lasting';
import { nextFloat, type RngState } from '../../engine/rng';
import { dyingMinutes, isDying, killsWhileDying, stabilize, type Wound } from '../../engine/wounds';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectArchetype, selectCharacter, selectPath } from '../character/selectors';
import { selectNow } from '../clock/selectors';
import { selectPerformance } from '../progression/selectors';
import { emptyHealth, healthSliceSchema, lastingSchema, metersSchema, migrateHealthV1, woundSchema, type HealthSlice } from './health';
import { selectFatigue, selectMaxVitality, selectMeters, selectStatusLabel, selectVitality } from './selectors';

const absNow = (s: GameState): number => s.clock.now.day * 86_400 + s.clock.now.second;

/** A severed limb is a lasting injury at once, with the prosthetic the stub gives (D-149); losing the dominant hand switches it (Q39). */
function severedLasting(s: GameState, w: Wound, id: string): { lasting: LastingInjury; emit: GameEvent[] } {
  const c = selectCharacter(s);
  const aid = stubProsthetic({ path: selectPath(s), archetype: selectArchetype(s) });
  const lasting: LastingInjury = { id, kind: lastingKindFor(w), part: w.part, adaptation: 0, aid, adaptedToday: 0, adaptDay: -1, day: w.day };
  const dominant = c.dominantHand === 'right' ? ['rightHand', 'rightArm'] : ['leftHand', 'leftArm'];
  const emit: GameEvent[] = dominant.includes(w.part) ? [{ type: 'dominantHandSwitched', reason: `lost the ${w.part}` }] : [];
  return { lasting, emit };
}

/** Adds wounds and settles dying and death (health §6). */
function addWounds(slice: HealthSlice, s: GameState, wounds: readonly Wound[], cause: string): { slice: HealthSlice; emit: GameEvent[]; notes: string[] } {
  let next = slice;
  const emit: GameEvent[] = [];
  const notes: string[] = [];
  for (const w0 of wounds) {
    const w: Wound = { ...w0, id: `pc:w${next.woundSeq}` };
    const dies = killsWhileDying(next.wounds as Wound[], w);
    let lasting = next.lasting;
    if (w.severed) {
      const r = severedLasting(s, w, `pc:l${next.woundSeq}`);
      lasting = [...lasting, r.lasting];
      emit.push(...r.emit);
      notes.push(`${w.part} severed: a lasting injury (${r.lasting.aid})`);
    }
    next = { ...next, wounds: [...next.wounds, w], lasting, woundSeq: next.woundSeq + 1 };
    notes.push(`${w.severity} wound to the ${w.part} (${cause})`);
    if (dies && !next.death) {
      next = { ...next, death: { atAbs: absNow(s), cause: `a second mortal wound while dying (${cause})` }, dying: null };
      emit.push({ type: 'characterDiedNotice', cause });
    }
  }
  if (!next.death && !next.dying && isDying(next.wounds as Wound[])) {
    const until = absNow(s) + dyingMinutes(selectPerformance(s, 'endurance')) * 60;
    next = { ...next, dying: { sinceAbs: absNow(s), untilAbs: until } };
    emit.push({ type: 'pacingSet', level: 'moment' });
    notes.push(`dying: ${dyingMinutes(selectPerformance(s, 'endurance')).toFixed(1)} minutes unless stabilized`);
  }
  return { slice: next, emit, notes };
}

export const healthFeature: FeatureModule<HealthSlice, GameState> = {
  id: 'health',
  version: 2,
  migrations: { 2: migrateHealthV1 },
  initialState: () => emptyHealth(),
  // Saves from M1/M2: fresh meters.
  emptyState: () => emptyHealth(),
  stateSchema: healthSliceSchema,
  events: {
    /** The meters after a resolved activity (computed by computeXp's session stepper). */
    activityLoad: {
      schema: z.object({ type: z.literal('activityLoad'), activityId: z.string(), meters: metersSchema }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice: { ...slice, meters: metersSchema.parse(e['meters']) } }),
    },
    sleepCompleted: {
      schema: z.object({ type: z.literal('sleepCompleted'), hours: z.number().min(0).max(24) }),
      sources: ['engine'],
      handle: (slice, e) => {
        const hours = Number(e['hours']);
        const carry = sleepCarry(hours);
        // 7h+ sleep: full meters and Vitality, and minor wounds heal overnight (health §2, §3, §7; D-52).
        const full = hours >= VITALITY_RECOVERY.fullSleepHours;
        const wounds = (slice.wounds as Wound[]).filter((w) => !healsOvernight(w, hours));
        const healed = slice.wounds.length - wounds.length;
        const notes = [carry === 0 ? `slept ${hours} h: meters reset` : `slept ${hours} h: ${Math.round(carry * 100)}% of the tiredness carries over`];
        if (healed) notes.push(`${healed} minor wound${healed > 1 ? 's' : ''} healed overnight`);
        return { slice: { ...slice, meters: afterSleep(slice.meters, hours), sleepCarry: carry, vitalityLost: full ? 0 : slice.vitalityLost, wounds }, notes };
      },
    },
    /** A duel segment's result for the player (combat resolution): Vitality, new wounds, meters. */
    healthSynced: {
      schema: z.object({
        type: z.literal('healthSynced'),
        vitalityLost: z.number().min(0),
        addWounds: z.array(woundSchema),
        meters: z.object({ p: z.number().min(0), f: z.number().min(0) }).optional(),
        cause: z.string().max(80),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        if (slice.death) return { reject: 'the character is dead' };
        const meters = e['meters'] as { p: number; f: number } | undefined;
        const base: HealthSlice = { ...slice, vitalityLost: Number(e['vitalityLost']), meters: meters ? { ...slice.meters, ...meters } : slice.meters };
        const r = addWounds(base, ctx.state, e['addWounds'] as Wound[], String(e['cause']));
        return { slice: r.slice, emit: r.emit, notes: r.notes };
      },
    },
    /**
     * AI, DEFERRED (D-29): a hazard the player did not cause. Stored now; the damage is resolved by health rules at the
     * start of the next turn's step b. Hazards the player causes enter as intent.risk.
     */
    hazardOccurred: {
      schema: z.object({ type: z.literal('hazardOccurred'), hazard: z.enum(HAZARD_TYPES), severityHint: z.number().int().min(1).max(3), cause: z.string().min(1).max(200) }),
      sources: ['ai'],
      narrative: (s) => s.health.death === null,
      handle: (slice, e) => {
        if (slice.pendingHazards.length >= 3) return { reject: 'too many pending hazards' };
        return { slice: { ...slice, pendingHazards: [...slice.pendingHazards, { hazard: e['hazard'] as (typeof HAZARD_TYPES)[number], severity: Number(e['severityHint']), cause: String(e['cause']) }] }, notes: ['hazard deferred to the next turn (D-29)'] };
      },
    },
    /** A hazard the character's action caused, or a deferred hazardOccurred, or a sparring accident (D-149). */
    hazardResolved: {
      schema: z.object({ type: z.literal('hazardResolved'), hazard: z.enum(HAZARD_TYPES), severity: z.number().int().min(1).max(3), cause: z.string().max(200), fromPending: z.boolean().optional() }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        if (slice.death) return { reject: 'the character is dead' };
        const type = e['hazard'] as (typeof HAZARD_TYPES)[number];
        const sev = Number(e['severity']) as 1 | 2 | 3;
        const h = hazardDamage(type, sev);
        const [part, rng] = rollLocation(ctx.state.meta.rngState, type === 'fall' ? FALL_LOCATION_WEIGHTS : LOCATION_WEIGHTS);
        const vit = selectVitality(ctx.state);
        const d = applyDamage(vit, h.D, h.bypass, false, true);
        const sevName = severityOf(d.W);
        const lost = Math.min(selectMaxVitality(ctx.state), slice.vitalityLost + d.vitalityLost);
        const wounds: Wound[] = sevName ? [{ id: 'new', part: part as BodyPart, severity: sevName, W: d.W, stabilized: false, healProgress: 0, day: selectNow(ctx.state).day, source: `hazard:${type}` }] : [];
        const pendingHazards = e['fromPending'] ? slice.pendingHazards.slice(1) : slice.pendingHazards;
        const r = addWounds({ ...slice, vitalityLost: lost, pendingHazards }, ctx.state, wounds, String(e['cause']));
        return { slice: r.slice, emit: r.emit, notes: [`${type} (severity ${sev}): D ${h.D.toFixed(1)}${sevName ? '' : ', no wound'}`, ...r.notes], rng };
      },
    },
    /** Stabilizing (a Medicine check, Force Heal (Self) or a healer): mortal wounds become stabilized criticals. */
    woundsStabilized: {
      schema: z.object({ type: z.literal('woundsStabilized'), by: z.string().max(80) }),
      sources: ['engine'],
      handle: (slice, e) => {
        if (slice.death) return { reject: 'the character is dead' };
        if (!isDying(slice.wounds as Wound[])) return { reject: 'no unstabilized mortal wound' };
        return { slice: { ...slice, wounds: stabilize(slice.wounds as Wound[]), dying: null }, notes: [`stabilized by ${String(e['by'])}`] };
      },
    },
    /**
     * Healing care (health §7, D-150): medical care x2 for its days; a bacta tank x4 for its hours (it replaces medical
     * care); a Force healer x(1 + level / 50) on top for the session. Bacta and Force healing apply at once.
     */
    careStarted: {
      schema: z.object({
        type: z.literal('careStarted'),
        kind: z.enum(['medical', 'bacta', 'forceHealer']),
        hours: z.number().min(0).max(24 * 120),
        healerLevel: z.number().min(0).optional(),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        if (slice.death) return { reject: 'the character is dead' };
        const kind = String(e['kind']);
        const hours = Number(e['hours']);
        if (kind === 'medical') return { slice: { ...slice, care: { kind: 'medical', untilAbs: absNow(ctx.state) + hours * 3600 } }, notes: [`under medical care for ${(hours / 24).toFixed(1)} days (x2 healing)`] };
        const medical = slice.care !== null && slice.care.untilAbs > absNow(ctx.state);
        const mult = healMultiplier({ care: kind === 'bacta' ? 'bacta' : medical ? 'medical' : 'none', healerLevel: kind === 'forceHealer' ? Number(e['healerLevel'] ?? 0) : null });
        const wounds = (slice.wounds as Wound[]).map((w) => progressHealing(w, hours / 24, mult));
        return { slice: { ...slice, wounds: wounds.filter((w) => !isHealed(w)) }, notes: [`${kind === 'bacta' ? 'bacta tank' : 'Force healing'} for ${hours} h (x${mult.toFixed(2)} healing)`] };
      },
    },
    /** Training the skills a lasting injury affects (progression-numbers §18): +1% per effective hour, at most 3% a day. */
    adaptationTrained: {
      schema: z.object({ type: z.literal('adaptationTrained'), hours: z.record(z.string(), z.number().min(0)) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        if (!slice.lasting.length) return { slice };
        const day = selectNow(ctx.state).day;
        const hours = e['hours'] as Record<string, number>;
        const lasting = (slice.lasting as LastingInjury[]).map((l) => {
          const h = Object.entries(hours).reduce((a, [skill, x]) => a + (lastingAffects(l, skill) ? x : 0), 0);
          return h > 0 ? adapt(l, h, day) : l;
        });
        return { slice: { ...slice, lasting } };
      },
    },
    /** A notice of death for the transcript (death itself is set in the slice by the rules above). */
    characterDiedNotice: {
      schema: z.object({ type: z.literal('characterDiedNotice'), cause: z.string().max(200) }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice, notes: [`the character dies: ${String(e['cause'])}`] }),
    },
    /** Engine: a lasting injury added directly (tests, healed-wound rolls use the day hook). */
    lastingAdded: {
      schema: z.object({ type: z.literal('lastingAdded'), lasting: lastingSchema }),
      sources: ['engine'],
      handle: (slice, e) => ({ slice: { ...slice, lasting: [...slice.lasting, e['lasting'] as LastingInjury] } }),
    },
  },
  onTimeAdvanced: (slice, step, ctx) => {
    if (slice.death || step.seconds <= 0) return { slice };
    let next = slice;
    const notices: string[] = [];
    const emit: GameEvent[] = [];
    const hours = step.seconds / 3600;
    // Meters recover on rest steps (D-52). Vitality: rest 50% of max per hour, light activity 15%, none in combat;
    // sleep resolves at its end (health §3).
    if (step.occupation === 'rest') next = { ...next, meters: rest(next.meters, hours) };
    if (next.vitalityLost > 0 && (step.occupation === 'rest' || step.occupation === 'activity')) {
      const max = selectMaxVitality(ctx.state);
      const rate = step.occupation === 'rest' ? VITALITY_RECOVERY.restPerHour : VITALITY_RECOVERY.lightPerHour;
      next = { ...next, vitalityLost: Math.max(0, next.vitalityLost - rate * max * hours) };
    }
    // The dying timer (health §6): expiry sets Dead.
    if (next.dying && step.toAbs >= next.dying.untilAbs && isDying(next.wounds as Wound[])) {
      next = { ...next, death: { atAbs: next.dying.untilAbs, cause: 'died of their wounds (the dying timer ran out)' }, dying: null };
      notices.push('The character has died of their wounds.');
      emit.push({ type: 'characterDiedNotice', cause: 'the dying timer ran out' });
      return { slice: next, notices, emit, interrupt: 'death' };
    }
    if (next.care && step.toAbs >= next.care.untilAbs) next = { ...next, care: null };
    if (!step.endsDay) return { slice: next };
    // Day by day (health §7): healing progress at the day's multiplier; a healed severe-or-worse wound may leave a
    // lasting injury (severe 10%, critical 35%, stabilized mortal 70%).
    const day = Math.floor(step.toAbs / 86_400);
    const medical = slice.care !== null;
    const mult = healMultiplier({ care: medical ? 'medical' : 'none' });
    let rng: RngState = ctx.state.meta.rngState;
    let rolled = false;
    const kept: Wound[] = [];
    const lasting = [...next.lasting] as LastingInjury[];
    let seq = next.woundSeq;
    for (const w0 of next.wounds as Wound[]) {
      if (w0.severity === 'mortal' && !w0.stabilized) {
        kept.push(w0);
        continue;
      }
      const w = progressHealing(w0, 1, mult);
      if (!isHealed(w)) {
        kept.push(w);
        continue;
      }
      const chance = lastingChance(w);
      if (chance > 0) {
        const [u, r] = nextFloat(rng);
        rng = r;
        rolled = true;
        if (u < chance) {
          lasting.push({ id: `pc:l${seq}`, kind: lastingKindFor(w), part: w.part, adaptation: 0, aid: 'scarTissue', adaptedToday: 0, adaptDay: -1, day });
          seq += 1;
          notices.push(`A ${w.severity} wound to the ${w.part} has healed, but left a lasting injury.`);
          continue;
        }
      }
      notices.push(`A ${w.severity} wound to the ${w.part} has healed.`);
    }
    next = { ...next, wounds: kept, lasting, woundSeq: seq };
    return { slice: next, ...(notices.length ? { notices } : {}), ...(emit.length ? { emit } : {}), ...(rolled ? { rng } : {}) };
  },
  selectors: { meters: selectMeters, fatigue: selectFatigue, vitality: selectVitality, status: selectStatusLabel },
};
