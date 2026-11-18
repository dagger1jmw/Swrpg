// Combat feature (architecture §2-4; rolls.md §3-6; combat-xp.md; D-143..D-157). Owns the fight: a deferred
// combatStarted, the active duel, the player's beat actions, the NPC fates and the last fight's summary. Every roll is
// the engine's (src/engine/duel.ts, combatForce.ts, sequence.ts); the AI only proposes that a fight starts, how it
// ends without wounds (fled, surrendered, interrupted, truce), and which opponents are fighting an ally.
import { sparGroupLevel } from '../../engine/appliedExperience';
import { z } from 'zod';
import { FATE_BY_STAKES, FATE_ROLL, HEROIC_ACT, MANEUVERS, NPC_FATES, SPARRING_MODES, STANCES, TACTICS, FORM_CHANGE_COST, isNarratedBeat, type BeatReason, type FateKind, type NpcFate } from '../../data/combat.config';
import { afterBout, newSession, runSession, sessionOutcome, type SparSessionState } from '../../engine/sparSession';
import { BODY_PARTS, type BodyPart } from '../../data/health.config';
import { MINION_COUNT, MINION_KIND_IDS, MINION_KINDS, beskarChanceAt } from '../../data/npcGen.config';
import { dateFromAbsDay } from '../../engine/calendar';
import { COMBAT_STAKES, type CombatOutcome, type CombatStakes } from '../../data/progression.config';
import { SEQUENCE_SCHEMA_MAX, SEQUENCE_STEP_KINDS } from '../../data/sequence.config';
import { FORM_IDS } from '../../data/skills';
import { TERRAIN_BY_ID, TERRAIN_IDS, type ObjectSize } from '../../data/terrain';
import { FORCE_ACTION_ABILITY, type ForceActionKind } from '../../engine/combatForce';
import { currentTarget, runUntilBeat, startDuel, tryShatterpoint, type DuelState, type ExchangeRecord, type Fighter, type RunMode } from '../../engine/duel';
import { rollMinionGrade } from '../../engine/npcGen';
import { basicRoll } from '../../engine/rolls';
import { nextFloat, nextInt, type RngState } from '../../engine/rng';
import { runSequence, sequenceCap, type SequenceStep } from '../../engine/sequence';
import { isDying, isIncapacitated, type Wound } from '../../engine/wounds';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent } from '../../state/types';
import { selectPath } from '../character/selectors';
import { selectNow } from '../clock/selectors';
import { selectFatigue, selectMaxVitality } from '../health/selectors';
import { selectNpc, selectNpcGen, selectNpcLevels } from '../npcs/selectors';
import { selectCI, selectLevelExact, selectPerformance } from '../progression/selectors';
import { selectRank } from '../ranks/selectors';
import { buildContext, buildMinionFighter, buildNpcFighter, buildPlayerFighter, sparringModeFor } from './build';
import { combatSliceSchema, emptyCombat, pendingFightSchema, type ActiveFight, type CombatSlice, type PendingFight } from './combat';
import { selectActiveFight, selectCombat } from './selectors';

const absNow = (s: GameState): number => s.clock.now.day * 86_400 + s.clock.now.second;
const npcRefKinds = { opponentRef: ['npc'], opponentRefs: ['npc'], engagedElsewhereRefs: ['npc'], npcRef: ['npc'] } as const;

/** Starts a fight from a pending combatStarted or a fight intent (deferred events resolve at the next step b, D-29). */
function startFight(s: GameState, spec: PendingFight, fightId: string): { active: ActiveFight; rng: RngState; notes: string[]; emit: GameEvent[] } {
  let rng = s.meta.rngState;
  const notes: string[] = [];
  const emit: GameEvent[] = [];
  const opponents: Fighter[] = [];
  const meta: ActiveFight['meta'] = { pc: { npcId: null, minionKind: null, rank: selectRank(s) } };
  for (const id of spec.opponentRefs) {
    if (!selectNpc(s, id)) continue;
    const b = buildNpcFighter(s, id);
    opponents.push({ ...b.fighter, engagedElsewhere: spec.engagedElsewhere.includes(id) });
    meta[id] = { npcId: id, minionKind: null, rank: b.rank };
    if (!selectNpc(s, id)!.gen) emit.push({ type: 'npcGenerated', npcRef: id });
  }
  for (const g of spec.minionGroups) {
    const kind = MINION_KIND_IDS.includes(g.kind) ? g.kind : 'trooper';
    for (let i = 0; i < g.count; i++) {
      let grade: number;
      [grade, rng] = rollMinionGrade(rng, kind);
      // Mandalorians roll beskar one by one, by era (D-158).
      let beskar = false;
      if (MINION_KINDS.find((k) => k.id === kind)?.saberResistant === 'byEra') {
        let u: number;
        [u, rng] = nextFloat(rng);
        beskar = u < beskarChanceAt(dateFromAbsDay(s.clock.now.day).year);
      }
      const f = buildMinionFighter(s, kind, grade, opponents.length, fightId, beskar);
      opponents.push(f);
      meta[f.id] = { npcId: null, minionKind: kind, rank: null };
    }
  }
  // A spar's stakes: the session's story-event choice (D-172; academy stakes only on the Sith path), else the default.
  const asked = spec.sparringMode ?? null;
  if (asked === 'academy' && selectPath(s) !== 'sith') notes.push('academy stakes are Sith only: controlled live blades instead');
  const sparring = spec.stakes === 'spar' ? (asked === 'academy' && selectPath(s) !== 'sith' ? 'controlled' : (asked ?? sparringModeFor(s))) : null;
  const ctx = buildContext(s, spec.terrainTags, spec.stakes, sparring);
  let player = buildPlayerFighter(s);
  if (sparring === 'trainingSaber' && (player.weapon === 'lightsaber' || player.weapon === 'trainingSaber')) player = { ...player, weapon: 'trainingSaber' };
  const sparOpps = sparring === 'trainingSaber' ? opponents.map((o) => (o.weapon === 'lightsaber' ? { ...o, weapon: 'trainingSaber' as const } : o)) : opponents;
  // An ambush claim becomes a perception contest (rolls §5): defender d20 + Force Sense / 10 vs attacker d20 + stealth / 10.
  let surprise: 'A' | 'B' | null = null;
  if (spec.ambushClaim && opponents.length) {
    const stealth = Math.max(...spec.opponentRefs.map((id) => selectNpcLevels(s, id)['stealth'] ?? 0), 0);
    const [d, r1] = basicRoll(rng, Math.max(player.forceSense, selectLevelExact(s, 'investigation')), []);
    const [a, r2] = basicRoll(r1, stealth, []);
    rng = r2;
    if (a.total > d.total) {
      surprise = 'B';
      notes.push(`ambush: perception ${d.total.toFixed(1)} vs stealth ${a.total.toFixed(1)}; the opponent strikes first`);
    } else notes.push(`ambush spotted: perception ${d.total.toFixed(1)} vs stealth ${a.total.toFixed(1)}`);
  }
  // Throwable objects: a seeded supply per terrain tag (D-146).
  const objects: Record<string, number> = {};
  const objectSizes: Record<string, ObjectSize> = {};
  for (const t of spec.terrainTags) {
    const tag = TERRAIN_BY_ID.get(t);
    if (!tag?.objects) continue;
    let n: number;
    [n, rng] = nextInt(rng, tag.objects.supply[0], tag.objects.supply[1]);
    objects[t] = n;
    objectSizes[t] = tag.objects.size;
  }
  const duel = startDuel(player, sparOpps, rng, surprise);
  const active: ActiveFight = {
    id: fightId,
    startedAbs: absNow(s),
    stakes: spec.stakes,
    sparring,
    terrainTags: spec.terrainTags,
    ctx: { ...ctx, situations: [...ctx.situations] },
    duel,
    patternUses: {},
    objects,
    objectSizes,
    meta,
    exchangeSkills: [],
    lastNarrated: 0,
    segmentStart: 0,
    beat: null,
    hidden: false,
    // A spar is a session of bouts up to 34 exchanges (D-168).
    session: spec.stakes === 'spar' ? newSession() : null,
  };
  notes.push(`fight ${fightId}: ${spec.stakes}${sparring ? ` (${sparring})` : ''} against ${opponents.map((o) => o.name).join(', ') || 'nobody'}`);
  return { active, rng: duel.rng, notes, emit: [...emit, { type: 'pacingSet', level: 'moment' }] };
}

/** The events that carry a segment's damage back to health (player) and npcs (named opponents). */
function syncEmits(s: GameState, before: DuelState, after: DuelState, meta: ActiveFight['meta']): GameEvent[] {
  const out: GameEvent[] = [];
  const a = after.a;
  const newWounds = a.wounds.slice(before.a.wounds.length) as Wound[];
  const lost = Math.max(0, selectMaxVitality(s) - a.vitality);
  if (newWounds.length || a.vitality !== before.a.vitality || a.meters.p !== before.a.meters.p || a.meters.f !== before.a.meters.f) {
    out.push({ type: 'healthSynced', vitalityLost: lost, addWounds: newWounds, meters: { p: a.meters.p, f: a.meters.f }, cause: 'duel' });
  }
  for (const o of after.opponents) {
    const m = meta[o.id];
    const prev = before.opponents.find((x) => x.id === o.id);
    if (!m?.npcId || !prev || (prev.vitality === o.vitality && prev.wounds.length === o.wounds.length)) continue;
    out.push({ type: 'npcHealthSynced', npcRef: m.npcId, health: { vitalityLost: Math.max(0, o.maxVitality - o.vitality), wounds: o.wounds, lasting: o.lasting } });
  }
  return out;
}

/** The skill used for each new exchange of a segment (combat XP by skill used). */
function withSkills(active: ActiveFight, before: DuelState, after: DuelState): string[] {
  const added = after.log.slice(before.log.length).filter((r) => r.kind !== 'force').length;
  return [...active.exchangeSkills, ...Array.from({ length: added }, () => after.a.skillId)];
}

function fateGroup(archetype: string): keyof typeof FATE_ROLL {
  if (archetype.startsWith('sith')) return 'sith';
  if (archetype.startsWith('jedi')) return 'jedi';
  if (archetype === 'soldier' || archetype === 'mandalorian') return 'military';
  if (archetype === 'smuggler' || archetype === 'bountyHunter') return 'underworld';
  return 'other';
}

/**
 * Concludes a fight (combat-xp §1-3, D-154): the combat branch of computeXp from the real duel log (fightResolved), E
 * and CI, heroicAct, NPC deaths and fates, the opponent's choice when the player is incapacitated, and the summary.
 */
function conclude(slice: CombatSlice, s: GameState, active: ActiveFight, outcome: CombatOutcome, reason: string): { slice: CombatSlice; emit: GameEvent[]; notes: string[]; rng?: RngState } {
  const duel = active.duel as DuelState;
  const emit: GameEvent[] = [];
  const notes: string[] = [`fight ${active.id} ends: ${outcome} (${reason})`];
  const strikes = duel.log.filter((r) => r.kind !== 'force');
  const exchanges = strikes.map((r, i) => ({ skillId: active.exchangeSkills[i] ?? duel.a.skillId, gap: r.effB - r.effA }));
  const forceUses = duel.log.filter((r) => r.kind === 'force' && r.force?.side === 'A').map((r) => ({ abilityId: r.force!.abilityId, gap: r.force!.effTarget - r.force!.effUser }));
  // A spar with several partners counts as one at the strongest's level + 10 per extra (D-163); otherwise the largest gap.
  const opponentGap = active.stakes === 'spar' ? sparGroupLevel(duel.opponents.map((o) => o.level)) - duel.a.level : Math.max(0, ...duel.opponents.map((o) => o.level - duel.a.level));
  if (exchanges.length || forceUses.length) emit.push({ type: 'fightResolved', stakes: active.stakes, outcome, exchanges, forceUses, opponentGap });
  // heroicAct (flag-registry §2): a won lethal fight against an opponent 10+ stronger or of rank Sith Lord / Master.
  if (active.stakes === 'lethal' && outcome === 'won') {
    const heroic = duel.opponents.some((o) => o.level - duel.a.level >= HEROIC_ACT.gapAtLeast || HEROIC_ACT.ranks.includes(active.meta[o.id]?.rank ?? ''));
    if (heroic) emit.push({ type: 'flagSet', flag: `heroicAct:${active.id}` });
  }
  const fates = [...slice.fates];
  for (const o of duel.opponents) {
    const m = active.meta[o.id];
    if (!m?.npcId) continue;
    if (o.dead) emit.push({ type: 'npcDied', npcRef: m.npcId, cause: `killed in fight ${active.id}` });
    else if (outcome === 'won' && (isIncapacitated(o.wounds as Wound[]) || isDying(o.wounds as Wound[]))) fates.push({ npcId: m.npcId, fightId: active.id, options: [...NPC_FATES] });
  }
  let rng: RngState | undefined;
  let playerFate: FateKind | null = null;
  const playerDown = outcome === 'lost' && (duel.a.out || isIncapacitated(duel.a.wounds as Wound[]) || isDying(duel.a.wounds as Wound[]));
  if (playerDown && reason !== 'surrendered') {
    const rule = FATE_BY_STAKES[active.stakes];
    if (rule !== 'roll') playerFate = rule;
    else {
      const winner = duel.opponents.find((o) => !o.out) ?? duel.opponents[0]!;
      const archetype = active.meta[winner.id]?.npcId ? (selectNpcGen(s, active.meta[winner.id]!.npcId!)?.archetype ?? 'other') : 'soldier';
      const table = FATE_ROLL[fateGroup(archetype)];
      const [u, r] = nextFloat(s.meta.rngState);
      rng = r;
      if (active.stakes === 'lethal') playerFate = u < table.lethal[0] ? 'killingStrike' : u < table.lethal[0] + table.lethal[1] ? 'captured' : 'left';
      else playerFate = u < table.serious[0] ? 'captured' : 'left';
    }
    // A killing strike is a mortal wound, so the dying timer leaves room for a rescue (D-154).
    if (playerFate === 'killingStrike' && !isDying(duel.a.wounds as Wound[])) {
      emit.push({ type: 'healthSynced', vitalityLost: selectMaxVitality(s), addWounds: [{ id: 'fate', part: 'torso', severity: 'mortal', W: 55, stabilized: false, healProgress: 0, day: selectNow(s).day, source: 'a killing strike' }], cause: 'a killing strike' });
    }
    notes.push(`the opponent's choice: ${playerFate}`);
  }
  const last = {
    id: active.id,
    stakes: active.stakes,
    outcome,
    reason,
    exchanges: duel.exchange,
    seconds: duel.seconds,
    playerFate,
    recorded: active.sparring !== null,
    skillId: duel.a.skillId,
    day: selectNow(s).day,
    duel,
    session: active.session ?? null,
  };
  return { slice: { ...slice, active: null, fates, last }, emit, notes, ...(rng ? { rng } : {}) };
}

/** Outcome of a duel end for side A. */
const outcomeOf = (d: DuelState): CombatOutcome => (d.end?.winner === 'A' ? 'won' : d.end?.winner === 'B' ? 'lost' : 'fled');

/**
 * The rest of a sparring session resolved in code, like a montage (D-168): every remaining bout to its end, then the
 * conclusion; the turn narrates the whole session once.
 */
function resolveSessionRest(slice: CombatSlice, s: GameState, active: ActiveFight, session: SparSessionState, before: DuelState, duel: DuelState, day: number, notes: string[]): ReturnType<typeof conclude> {
  const r = runSession(duel, session, active.ctx as ActiveFight['ctx'] & { situations: never[] }, day);
  const nextActive: ActiveFight = { ...active, duel: r.duel, session: r.session, exchangeSkills: withSkills(active, before, r.duel), beat: null };
  const c = conclude(slice, s, nextActive, sessionOutcome(r.session), `sparring session (${r.session.ended})`);
  // The player can always step in (D-177): the next bout with the same named partners, unless someone was really hurt.
  const partners = Object.values(active.meta).map((m) => m.npcId).filter((id): id is string => id !== null && selectNpc(s, id)?.status === 'active');
  const hurt = isIncapacitated(r.duel.a.wounds as Wound[]) || isDying(r.duel.a.wounds as Wound[]) || r.session.ended === 'injury';
  const rematch = partners.length && !hurt ? { opponentRefs: partners, sparringMode: active.sparring } : null;
  const sliceOut = c.slice.last ? { ...c.slice, last: { ...c.slice.last, rematch } } : c.slice;
  return { ...c, slice: sliceOut, emit: [...syncEmits(s, before, r.duel, active.meta), ...c.emit], notes: [...notes, ...c.notes] };
}

/** Applies a segment's result: health sync, skills, beat, and the conclusion when the duel ended. */
function settle(slice: CombatSlice, s: GameState, active: ActiveFight, before: DuelState, after: DuelState, beat: string | null, narrated: boolean, extraNotes: string[] = []): ReturnType<typeof conclude> {
  const emit = syncEmits(s, before, after, active.meta);
  const nextActive: ActiveFight = {
    ...active,
    duel: after,
    exchangeSkills: withSkills(active, before, after),
    beat,
    lastNarrated: narrated ? after.exchange : active.lastNarrated,
  };
  if (after.end && nextActive.session) {
    // A sparring bout ended (D-168): the next bout after the recovery, or the end of the session.
    const r = afterBout(nextActive.session, after);
    const boutNote = `bout ${r.session.bouts.length}: ${r.session.bouts[r.session.bouts.length - 1]!.winner === 'A' ? 'won' : r.session.bouts[r.session.bouts.length - 1]!.winner === 'B' ? 'lost' : 'unfinished'}`;
    if (r.next) return { slice: { ...slice, active: { ...nextActive, duel: r.next, session: r.session, beat: 'boutEnded', lastNarrated: after.exchange } }, emit, notes: [...extraNotes, boutNote] };
    const c = conclude(slice, s, { ...nextActive, session: r.session }, sessionOutcome(r.session), `sparring session (${r.session.ended})`);
    return { ...c, emit: [...emit, ...c.emit], notes: [...extraNotes, boutNote, ...c.notes] };
  }
  if (after.end) {
    const c = conclude(slice, s, nextActive, outcomeOf(after), after.end.reason);
    return { ...c, emit: [...emit, ...c.emit], notes: [...extraNotes, ...c.notes] };
  }
  return { slice: { ...slice, active: nextActive }, emit, notes: extraNotes };
}

/** Ends a sparring session before its exchange count: the bout in progress is unfinished (Stop sparring, or the story). */
function stopSession(slice: CombatSlice, s: GameState, active: ActiveFight, duel: DuelState, session: SparSessionState, why: 'stopped' | 'interrupted'): ReturnType<typeof conclude> {
  const stopped: SparSessionState = { ...session, bouts: duel.exchange > session.boutStart ? [...session.bouts, { winner: null, reason: why, exchanges: duel.exchange - session.boutStart }] : session.bouts, ended: 'stopped', playing: false };
  return conclude(slice, s, { ...active, duel, session: stopped }, sessionOutcome(stopped), `sparring session (${why})`);
}

const stepSchema = z.object({
  kind: z.enum(SEQUENCE_STEP_KINDS),
  stance: z.enum(STANCES).optional(),
  tactic: z.enum(['feint', 'taunt']).optional(),
  maneuver: z.enum(MANEUVERS).optional(),
  action: z.enum(['push', 'choke', 'lightning', 'throw']).optional(),
  objectTag: z.string().optional(),
  aim: z.enum(BODY_PARTS).optional(),
});

/** A step from the intent / beat schema to the engine's step (invalid combinations are dropped). */
function toStep(x: z.infer<typeof stepSchema>): SequenceStep | null {
  if (x.kind === 'stance' && x.stance) return { kind: 'stance', stance: x.stance };
  if (x.kind === 'tactic' && x.tactic) return { kind: 'tactic', tactic: x.tactic };
  if (x.kind === 'maneuver' && x.maneuver) return { kind: 'maneuver', maneuver: x.maneuver };
  if (x.kind === 'forceAction' && x.action) return { kind: 'forceAction', action: x.action, ...(x.objectTag ? { objectTag: x.objectTag } : {}) };
  if (x.kind === 'strike') return x.aim ? { kind: 'strike', aim: x.aim } : { kind: 'strike' };
  return null;
}

export const combatFeature: FeatureModule<CombatSlice, GameState> = {
  id: 'combat',
  version: 1,
  initialState: () => emptyCombat(),
  emptyState: () => emptyCombat(),
  stateSchema: combatSliceSchema,
  events: {
    /**
     * DEFERRED (D-29): stored now, resolved at the start of the next turn's step b and narrated then. Opponents must
     * exist (npcIntroduced or a temp key first); an ambush claim becomes a perception contest.
     */
    combatStarted: {
      schema: z.object({
        type: z.literal('combatStarted'),
        opponentRefs: z.array(z.string()).max(6).describe('Named opponents (npc ids or temp keys)'),
        minionGroups: z.array(z.object({ kind: z.enum(MINION_KIND_IDS as [string, ...string[]]), count: z.number().int().min(1).max(99) })).max(4).optional().describe('Unnamed opponents by kind and count'),
        stakes: z.enum(COMBAT_STAKES),
        terrainTags: z.array(z.enum(TERRAIN_IDS as [string, ...string[]])).max(5),
        ambushClaim: z.boolean().optional().describe('The opponents attack from hiding'),
        engagedElsewhereRefs: z.array(z.string()).max(6).optional().describe('Opponents fighting an ally, not the player'),
        sparringMode: z.enum(SPARRING_MODES).optional().describe('Spar only, a story event: the master calls harsher stakes for this session (academy: Sith live blades and real wounds)'),
      }),
      sources: ['ai', 'engine'],
      narrative: (s) => s.combat.active === null && s.combat.pending === null,
      refFields: ['opponentRefs', 'engagedElsewhereRefs'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        if (slice.active) return { reject: 'a fight is already in progress' };
        const notes: string[] = [];
        const groups = ((e['minionGroups'] as { kind: string; count: number }[] | undefined) ?? []).map((g) => {
          const count = Math.min(MINION_COUNT.max, Math.max(MINION_COUNT.min, g.count));
          if (count !== g.count) notes.push(`minion count ${g.count} clamped to ${count}`);
          return { kind: g.kind, count };
        });
        const opponentRefs = e['opponentRefs'] as string[];
        if (!opponentRefs.length && !groups.length) return { reject: 'combatStarted needs opponents' };
        const pending = pendingFightSchema.parse({
          opponentRefs,
          minionGroups: groups,
          stakes: e['stakes'],
          terrainTags: e['terrainTags'],
          ambushClaim: e['ambushClaim'] === true,
          engagedElsewhere: (e['engagedElsewhereRefs'] as string[] | undefined) ?? [],
          sparringMode: e['stakes'] === 'spar' ? ((e['sparringMode'] as PendingFight['sparringMode'] | undefined) ?? null) : null,
        });
        return { slice: { ...slice, pending }, notes: [...notes, 'fight deferred to the next turn (D-29)'] };
      },
    },
    /** Engine: begins the pending fight, or a fight intent's fight (step b). */
    fightBegun: {
      schema: z.object({
        type: z.literal('fightBegun'),
        fromPending: z.boolean(),
        opponentRefs: z.array(z.string()).optional(),
        stakes: z.enum(COMBAT_STAKES).optional(),
        terrainTags: z.array(z.string()).optional(),
        /** The next bout after an auto-resolved spar keeps its mode (D-177). */
        sparringMode: z.enum(SPARRING_MODES).optional(),
        /** A dev sandbox fight (D-180): unnamed opponents by kind, clamped like combatStarted's. */
        minionGroups: z.array(z.object({ kind: z.enum(MINION_KIND_IDS as [string, ...string[]]), count: z.number().int().min(1).max(99) })).max(4).optional(),
        /** A sparring session played out beat by beat from its first exchange (D-180 /spar), not resolved like a montage. */
        playOut: z.boolean().optional(),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        if (slice.active) return { reject: 'a fight is already in progress' };
        const spec: PendingFight | null = e['fromPending']
          ? slice.pending
          : { opponentRefs: (e['opponentRefs'] as string[]) ?? [], minionGroups: ((e['minionGroups'] as { kind: string; count: number }[] | undefined) ?? []).map((g) => ({ kind: g.kind, count: Math.min(MINION_COUNT.max, Math.max(MINION_COUNT.min, g.count)) })), stakes: (e['stakes'] as CombatStakes) ?? 'serious', terrainTags: ((e['terrainTags'] as string[]) ?? []).filter((t) => TERRAIN_IDS.includes(t)), ambushClaim: false, engagedElsewhere: [], sparringMode: (e['sparringMode'] as PendingFight['sparringMode'] | undefined) ?? null };
        if (!spec) return { reject: 'no pending fight' };
        const id = `fight-${slice.seq}`;
        const r = startFight(ctx.state, spec, id);
        if (!r.active.duel.opponents.length) return { reject: 'no opponent could join the fight' };
        const active = e['playOut'] === true && r.active.session ? { ...r.active, session: { ...r.active.session, playing: true } } : r.active;
        return { slice: { ...slice, pending: null, active, seq: slice.seq + 1 }, emit: r.emit, notes: r.notes, rng: r.rng };
      },
    },
    /**
     * A beat action (rolls §3 as amended by D-145, D-146): stance, tactic, maneuver, form change, Force action, target,
     * shatterpoint, a typed sequence, Fight on, Narrate, or Resolve to end. Resolves exchanges to the next beat.
     */
    combatAction: {
      schema: z.object({
        type: z.literal('combatAction'),
        // playBout / stopSession: a sparring session's bout played out beat by beat, or the session ended (D-168).
        // posture / clarify: natural combat words read from the player's text, or a question back when none (D-179).
        // A stance is a setting, not an action (D-182): stanceSet, outside the turn.
        action: z.enum(['tactic', 'maneuver', 'aim', 'formChange', 'posture', 'clarify', 'force', 'target', 'shatterpoint', 'sequence', 'fightOn', 'narrate', 'resolve', 'continue', 'playBout', 'stopSession']),
        /** posture: a take-position attempt (D-179). */
        position: z.boolean().optional(),
        /** aim: the body part the next strike goes for (D-171). */
        part: z.enum(BODY_PARTS).optional(),
        stance: z.enum(STANCES).optional(),
        tactic: z.enum(TACTICS).optional(),
        maneuver: z.enum(MANEUVERS).optional(),
        form: z.string().optional(),
        force: z.object({ kind: z.enum(['push', 'choke', 'lightning', 'throw']), effort: z.enum(['light', 'standard', 'heavy', 'allOut']).optional(), objectTag: z.string().optional() }).optional(),
        targetRef: z.string().optional(),
        steps: z.array(stepSchema).max(SEQUENCE_SCHEMA_MAX).optional(),
      }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        let active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const s = ctx.state;
        const day = selectNow(s).day;
        const before = active.duel as DuelState;
        const ctxD = active.ctx as ActiveFight['ctx'] & { situations: never[] };
        let duel: DuelState = { ...before, a: { ...before.a } };
        let action = String(e['action']);
        const notes: string[] = [];
        // A sparring session (D-168): by default the rest resolves in code with one narration; Play this bout plays the
        // current bout out with the normal beats (any tactical action does too); Stop ends the session.
        const session = active.session;
        if (session && !session.ended) {
          if (action === 'stopSession') {
            const c = stopSession(slice, s, active, duel, session, 'stopped');
            return { slice: c.slice, emit: c.emit, notes: c.notes, ...(c.rng ? { rng: c.rng } : {}) };
          }
          const passive = ['continue', 'fightOn', 'resolve', 'narrate'].includes(action);
          if (!session.playing && passive) {
            const c = resolveSessionRest(slice, s, active, session, before, duel, day, notes);
            return { slice: c.slice, emit: c.emit, notes: c.notes, ...(c.rng ? { rng: c.rng } : {}) };
          }
          // A question back (clarify) is not an action: it leaves the session as it was (D-182).
          if (!session.playing && action !== 'clarify') active = { ...active, session: { ...session, playing: true } };
          if (action === 'playBout') action = 'continue';
        } else if (action === 'playBout' || action === 'stopSession') return { reject: 'not in a sparring session' };
        let mode: RunMode | null = 'beat';
        let narrated = false;
        let beat: string | null = null;
        if (action === 'maneuver') duel = { ...duel, a: { ...duel.a, pendingManeuver: e['maneuver'] as Fighter['pendingManeuver'] } };
        else if (action === 'posture') {
          // Natural combat words (D-179): a form to switch to (at the usual cost), a stance, a take-position attempt.
          const form = e['form'] as string | undefined;
          if (form && form !== duel.a.form) {
            if (FORM_IDS.includes(form) && form !== 'jarKai' && selectLevelExact(s, form) >= 1) {
              duel = { ...duel, advantage: duel.advantage - FORM_CHANGE_COST, a: { ...duel.a, form, skillId: form, level: selectPerformance(s, form) } };
              notes.push(`form change to ${form} (-${FORM_CHANGE_COST} advantage)`);
            } else notes.push(`cannot fight in ${form}: staying in ${duel.a.form ?? 'the current form'}`);
          }
          if (e['stance']) duel = { ...duel, a: { ...duel.a, stance: e['stance'] as Fighter['stance'] } };
          if (e['position']) duel = { ...duel, a: { ...duel.a, pendingManeuver: 'position' } };
          notes.push(`posture: ${[e['stance'] ? `${String(e['stance'])} stance` : null, e['position'] ? 'taking position' : null, form ? `in ${form}` : null].filter(Boolean).join(', ') || 'as before'}`);
        } else if (action === 'clarify') {
          // No move the game could read (D-179): no exchange; the beat buttons ask.
          mode = null;
          beat = 'clarify';
          notes.push('combat input not understood: the beat buttons ask what you do');
        } else if (action === 'aim') {
          if (!e['part']) return { reject: 'aim needs a body part' };
          duel = { ...duel, a: { ...duel.a, aim: e['part'] as BodyPart } };
        }
        else if (action === 'formChange') {
          const form = String(e['form'] ?? '');
          if (!FORM_IDS.includes(form) || selectLevelExact(s, form) < 1) return { reject: `cannot fight in ${form}` };
          if (form === 'jarKai') return { reject: "Jar'Kai needs dual blades (until items, M8)" };
          // A form change costs 1 advantage step toward the opponent (Q32).
          duel = { ...duel, advantage: duel.advantage - FORM_CHANGE_COST, a: { ...duel.a, form, skillId: form, level: selectPerformance(s, form) } };
          notes.push(`form change to ${form} (-${FORM_CHANGE_COST} advantage)`);
        } else if (action === 'target') {
          const idx = duel.opponents.findIndex((o) => o.id === e['targetRef'] && !o.out);
          if (idx < 0) return { reject: 'no such opponent in the fight' };
          duel = { ...duel, target: idx };
          mode = null;
        } else if (action === 'tactic') {
          const t = String(e['tactic']);
          if (t === 'surrender') {
            const c = conclude(slice, s, { ...active, duel }, 'lost', 'surrendered');
            return { slice: c.slice, emit: [...syncEmits(s, before, duel, active.meta), ...c.emit], notes: c.notes, ...(c.rng ? { rng: c.rng } : {}) };
          }
          if (t === 'disengage') {
            // A contest that ends the fight as fled: d20 + Agility/10 (+ position) vs d20 + the opponent's skill/10.
            const target = currentTarget(duel)!;
            const [u, r1] = basicRoll(duel.rng, duel.a.agility, duel.a.position ? [{ source: 'position', value: duel.a.position }] : []);
            const [d, r2] = basicRoll(r1, target.level, []);
            duel = { ...duel, rng: r2 };
            if (u.total > d.total) {
              const c = conclude(slice, s, { ...active, duel }, 'fled', 'disengaged');
              return { slice: c.slice, emit: [...syncEmits(s, before, duel, active.meta), ...c.emit], notes: [`disengage: ${u.total.toFixed(1)} vs ${d.total.toFixed(1)}`, ...c.notes] };
            }
            notes.push(`disengage failed: ${u.total.toFixed(1)} vs ${d.total.toFixed(1)}`);
          } else if (t === 'feint' || t === 'taunt' || t === 'useEnvironment' || t === 'takePosition') {
            if (t === 'takePosition') duel = { ...duel, a: { ...duel.a, pendingManeuver: 'position' } };
            else {
              const r = runSequence({ duel, patternUses: active.patternUses, objects: active.objects }, ctxD, day, [{ kind: 'tactic', tactic: t === 'taunt' ? 'taunt' : 'feint' }], 1, active.objectSizes, forceProfile(s));
              duel = r.state.duel;
              notes.push(...r.results.map((x) => x.note));
            }
          }
        } else if (action === 'force') {
          const f = e['force'] as { kind: ForceActionKind; effort?: 'light' | 'standard' | 'heavy' | 'allOut'; objectTag?: string };
          const ability = FORCE_ACTION_ABILITY[f.kind];
          if (selectLevelExact(s, ability) < 1) return { reject: `the character does not know ${ability}` };
          const r = runSequence({ duel, patternUses: active.patternUses, objects: active.objects }, ctxD, day, [{ kind: 'forceAction', action: f.kind, ...(f.effort ? { effort: f.effort } : {}), ...(f.objectTag ? { objectTag: f.objectTag } : {}) }], 1, active.objectSizes, forceProfile(s));
          const settled = settle({ ...slice, active: { ...active, patternUses: r.state.patternUses, objects: r.state.objects } }, s, { ...active, patternUses: r.state.patternUses, objects: r.state.objects }, before, r.state.duel, 'forceAction', true, r.results.map((x) => x.note));
          return { slice: settled.slice, emit: settled.emit, notes: settled.notes, ...(settled.rng ? { rng: settled.rng } : {}) };
        } else if (action === 'shatterpoint') {
          const r = tryShatterpoint(duel, 'A');
          if (!r.roll) return { reject: 'no ShatterSense, or the shatterpoint was already read this fight' };
          duel = r.s;
          notes.push(`shatterpoint read: ${r.roll.total.toFixed(1)} vs 15: ${r.success ? 'success (advantage 3)' : 'nothing'}`);
        } else if (action === 'sequence') {
          const steps = ((e['steps'] as z.infer<typeof stepSchema>[] | undefined) ?? []).map(toStep).filter((x): x is SequenceStep => x !== null);
          if (!steps.length) return { reject: 'an empty sequence' };
          const forceLevels = steps.filter((x) => x.kind === 'forceAction').map((x) => selectLevelExact(s, FORCE_ACTION_ABILITY[(x as { action: ForceActionKind }).action]));
          const fat = selectFatigue(s);
          const cap = sequenceCap({
            rank: selectRank(s),
            mainFormLevel: duel.a.form ? selectLevelExact(s, duel.a.form) : 0,
            forceSkillLevel: forceLevels.length ? Math.min(...forceLevels) : 0,
            hidden: active.hidden,
            mentalFraction: fat.m,
            exhausted: duel.a.vitality <= 0 || fat.p > 1 || fat.f > 1,
          });
          const r = runSequence({ duel, patternUses: active.patternUses, objects: active.objects }, ctxD, day, steps, cap, active.objectSizes, forceProfile(s));
          const seqNotes = [...r.results.map((x) => `step ${x.index + 1}: ${x.note}`), ...(r.truncated.length ? [`${r.truncated.length} step(s) past the cap of ${cap} not attempted`] : []), ...(r.dropped.length ? [`${r.dropped.length} step(s) dropped (${r.stopReason})`] : [])];
          const nextActive = { ...active, patternUses: r.state.patternUses, objects: r.state.objects };
          const settled = settle({ ...slice, active: nextActive }, s, nextActive, before, r.state.duel, 'sequence', true, seqNotes);
          return { slice: settled.slice, emit: settled.emit, notes: settled.notes, ...(settled.rng ? { rng: settled.rng } : {}) };
        } else if (action === 'fightOn') mode = 'fightOn';
        else if (action === 'resolve') mode = 'toEnd';
        else if (action === 'narrate') {
          mode = null;
          narrated = true;
          beat = 'playerNarrate';
        }
        if (mode) {
          const r = runUntilBeat(duel, ctxD, day, mode);
          duel = r.state;
          beat = r.beat;
          narrated = beat !== null && isNarratedBeat(beat as BeatReason);
        }
        const settled = settle(slice, s, active, before, duel, beat, narrated, notes);
        return { slice: settled.slice, emit: settled.emit, notes: settled.notes, ...(settled.rng ? { rng: settled.rng } : {}) };
      },
    },
    /**
     * Player: the stance (D-182). A setting, not an action: no exchange, no AI call, no time. It stays until changed,
     * across a sparring session's bouts; exchanges resolve only from an action.
     */
    stanceSet: {
      schema: z.object({ type: z.literal('stanceSet'), stance: z.enum(STANCES) }),
      sources: ['player'],
      handle: (slice, e) => {
        const active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const duel = active.duel as DuelState;
        const stance = e['stance'] as Fighter['stance'];
        if (duel.a.stance === stance) return { slice };
        return { slice: { ...slice, active: { ...active, duel: { ...duel, a: { ...duel.a, stance } } } }, notes: [`stance: ${stance}`] };
      },
    },
    /** AI: a fight ends without wounds deciding it (fled, surrendered, interrupted, truce); wounds end fights on their own. */
    combatEnded: {
      schema: z.object({ type: z.literal('combatEnded'), reason: z.enum(['fled', 'surrendered', 'interrupted', 'truce']) }),
      sources: ['ai', 'engine'],
      narrative: (s) => s.combat.active !== null,
      handle: (slice, e, ctx) => {
        if (!slice.active) return { reject: 'no fight in progress' };
        const reason = String(e['reason']);
        // A sparring session ends by its bouts or when the player stops (D-181): a bout's point is not the end of the
        // session. Only the story stopping it (interrupted) ends it from the narration, with the bouts so far.
        const session = slice.active.session;
        if (session && !session.ended) {
          if (reason !== 'interrupted') return { reject: 'a sparring session ends by its bouts or when the player stops; a bout ending is not the end of the session' };
          const c = stopSession(slice, ctx.state, slice.active, slice.active.duel as DuelState, session, 'interrupted');
          return { slice: c.slice, emit: c.emit, notes: c.notes, ...(c.rng ? { rng: c.rng } : {}) };
        }
        const outcome: CombatOutcome = reason === 'truce' ? 'truce' : reason === 'surrendered' ? 'lost' : 'fled';
        const c = conclude(slice, ctx.state, slice.active, outcome, reason);
        return { slice: c.slice, emit: c.emit, notes: c.notes, ...(c.rng ? { rng: c.rng } : {}) };
      },
    },
    /** AI: an opponent turns to fight an ally, or back (D-143 E); engine-checked against the fight. */
    opponentEngagement: {
      schema: z.object({ type: z.literal('opponentEngagement'), opponentRef: z.string(), engagedElsewhere: z.boolean() }),
      sources: ['ai', 'engine'],
      narrative: (s) => s.combat.active !== null,
      refFields: ['opponentRef'],
      refKinds: npcRefKinds,
      targetField: 'opponentRef',
      handle: (slice, e) => {
        const active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const id = String(e['opponentRef']);
        const duel = active.duel as DuelState;
        if (!duel.opponents.some((o) => o.id === id)) return { reject: `${id} is not in the fight` };
        const opponents = duel.opponents.map((o) => (o.id === id ? { ...o, engagedElsewhere: e['engagedElsewhere'] === true } : o));
        if (!opponents.some((o) => !o.out && !o.engagedElsewhere)) return { reject: 'at least one opponent must still face the player' };
        return { slice: { ...slice, active: { ...active, duel: { ...duel, opponents } } } };
      },
    },
    /** Player: an incapacitated NPC's fate (spare, capture, kill); kill is an engine death (D-33). */
    fateChosen: {
      schema: z.object({ type: z.literal('fateChosen'), npcRef: z.string(), fate: z.enum(NPC_FATES) }),
      sources: ['player'],
      targetField: 'npcRef',
      handle: (slice, e) => {
        const id = String(e['npcRef']);
        const entry = slice.fates.find((f) => f.npcId === id);
        if (!entry) return { reject: `no fate to choose for ${id}` };
        const fate = e['fate'] as NpcFate;
        const emit: GameEvent[] = fate === 'kill' ? [{ type: 'npcDied', npcRef: id, cause: 'killed by the player at incapacitation' }] : [];
        return { slice: { ...slice, fates: slice.fates.filter((f) => f.npcId !== id) }, emit, notes: [`${id}: ${fate}`] };
      },
    },
  },
  selectors: { combat: selectCombat, active: selectActiveFight },
};

/** The player's Force levels for actions and sequences (CI from progression). */
function forceProfile(s: GameState) {
  return {
    levelOf: (a: ForceActionKind) => selectLevelExact(s, FORCE_ACTION_ABILITY[a]),
    ciOf: (a: ForceActionKind) => selectCI(s, FORCE_ACTION_ABILITY[a]),
    forceOutput: selectLevelExact(s, 'forceOutput'),
    trickLevel: Math.max(selectLevelExact(s, 'charisma'), selectLevelExact(s, 'intelligence')),
  };
}

export type { ExchangeRecord };
