// Combat feature (architecture §2-4; rolls.md §3-6; combat-xp.md; D-143..D-157). Owns the fight: a deferred
// combatStarted, the active duel, the player's beat actions, the NPC fates and the last fight's summary. Every roll is
// the engine's (src/engine/duel.ts, combatForce.ts, sequence.ts); the AI only proposes that a fight starts, how it
// ends without wounds (fled, surrendered, interrupted, truce), and which opponents are fighting an ally.
import { sparGroupLevel } from '../../engine/appliedExperience';
import { z } from 'zod';
import { STRIKE_AT, strikeIntentFor, INTERRUPT_CATEGORIES, INTERRUPT_CAUSES, INTERRUPT_FIGHTER_WORDS, INTERRUPT_RESTATES, CAPTOR_RULES, FATE_ACT_NOTE, FATE_BY_STAKES, FATE_CHOICE_EXPIRY, FATE_ROLL, HEROIC_ACT, MANEUVERS, NPC_FATES, SPARRING_MODES, STANCES, TACTICS, FORM_CHANGE_COST, isNarratedBeat, type BeatReason, type FateKind, type InterruptCategory, type InterruptCause, type NpcFate } from '../../data/combat.config';
import { afterBout, newSession, runSession, sessionOutcome, type SparSessionState } from '../../engine/sparSession';
import { hazardOnAll, rollBoutHazards } from '../../engine/terrainHazard';
import { BODY_PARTS, WEAPON_KINDS, type BodyPart, type HazardType, type WeaponKind } from '../../data/health.config';
import { MINION_COUNT, MINION_KIND_IDS, MINION_KINDS, beskarChanceAt, minionKindForYear } from '../../data/npcGen.config';
import { dateFromAbsDay, toAbsSecond } from '../../engine/calendar';
import { mandalorianSlugthrower, WEAPON_NAMES } from '../../data/weapons';
import { COMBAT_STAKES, type CombatOutcome, type CombatStakes } from '../../data/progression.config';
import { SEQUENCE_SCHEMA_MAX, SEQUENCE_STEP_KINDS } from '../../data/sequence.config';
import { FORM_IDS } from '../../data/skills';
import { TERRAIN_BY_ID, TERRAIN_IDS, type ObjectSize } from '../../data/terrain';
import { FORCE_ACTION_ABILITY, FORCE_ACTION_KINDS, type ForceActionKind } from '../../engine/combatForce';
import { cannotDuel, cannotStandText, disengageContest, startDuel, tryShatterpoint, type DuelState, type ExchangeRecord, type Fighter, type RunMode } from '../../engine/duel';
import { rollMinionGrade } from '../../engine/npcGen';
import { basicRoll } from '../../engine/rolls';
import { nextFloat, nextInt, type RngState } from '../../engine/rng';
import { runPassive, runSequence, sequenceCap, UNKNOWN_PREFIX, type SequenceStep } from '../../engine/sequence';
import { isDying, isIncapacitated, type Wound } from '../../engine/wounds';
import type { GameState } from '../../state/gameState';
import type { ApplyCtx, FeatureModule, GameEvent } from '../../state/types';
import { selectPath } from '../character/selectors';
import { selectNow } from '../clock/selectors';
import { selectFatigue, selectMaxVitality } from '../health/selectors';
import { selectNpc, selectNpcGen, selectNpcLevels } from '../npcs/selectors';
import { selectCI, selectLevelExact, selectPerformance } from '../progression/selectors';
import { selectRank } from '../ranks/selectors';
import { buildContext, buildMinionFighter, buildNpcFighter, buildPlayerFighter, sparringModeFor } from './build';
import { combatSliceSchema, emptyCombat, pendingFightSchema, type ActiveFight, type CombatSlice, type FightSummary, type PendingFight } from './combat';
import { holdAgainst } from '../../engine/who';
import { PLAN, PLAN_KINDS } from '../../data/duelists';
import { beginHold, playerHold } from './holds';
import { trailChance } from '../../engine/holds';
import { TRAIL } from '../../data/holds';
import { seedRng } from '../../engine/rng';
import { selectLocationChain } from '../locations/selectors';
import { pursuitSchema, type Pursuit } from './combat';
import { selectCanBeat, selectCanPlan, selectDuelistBar, selectDuelTier, selectFightSecurity, selectPlanWins } from '../world/selectors';
import { fateIsLive, selectActiveFight, selectCombat, selectPlanReady } from './selectors';

const absNow = (s: GameState): number => s.clock.now.day * 86_400 + s.clock.now.second;
const npcRefKinds = { opponentRef: ['npc'], opponentRefs: ['npc'], engagedElsewhereRefs: ['npc'], wantAliveRefs: ['npc'], npcRef: ['npc'] } as const;

/** Starts a fight from a pending combatStarted or a fight intent (deferred events resolve at the next step b, D-29). */
function startFight(s: GameState, spec: PendingFight, fightId: string): { active: ActiveFight; rng: RngState; notes: string[]; emit: GameEvent[] } {
  let rng = s.meta.rngState;
  const notes: string[] = [];
  const emit: GameEvent[] = [];
  const opponents: Fighter[] = [];
  const meta: ActiveFight['meta'] = { pc: { npcId: null, minionKind: null, rank: selectRank(s) } };
  for (const id of spec.opponentRefs) {
    if (!selectNpc(s, id)) continue;
    const b = buildNpcFighter(s, id, spec.stakes !== 'spar');
    // Strike intent from the archetype and the scene (D-260): capture when the scene wants the player alive and the
    // loadout has a subduing means (D-262), else the archetype's kill or disarm.
    const intent = strikeIntentFor(b.archetype, spec.stakes, (spec.wantAlive ?? []).includes(id), b.fighter.subdue ?? null);
    if ((spec.wantAlive ?? []).includes(id) && intent !== 'capture' && spec.stakes !== 'spar') notes.push(`${b.fighter.name} has no way to subdue (${b.fighter.weaponName ?? b.fighter.weapon}): strikes to ${intent}`);
    // The power bar (D-491): whom this player cannot beat breaks off instead. Real fights only; a spar is a lesson.
    const aboveBar = spec.stakes !== 'spar' && !selectCanBeat(s, selectNpc(s, id)!.canonId);
    opponents.push({ ...b.fighter, intent, engagedElsewhere: spec.engagedElsewhere.includes(id), ...(aboveBar ? { aboveBar: true } : {}) });
    meta[id] = { npcId: id, minionKind: null, rank: b.rank };
    if (!selectNpc(s, id)!.gen) emit.push({ type: 'npcGenerated', npcRef: id });
  }
  const year = dateFromAbsDay(s.clock.now.day).year;
  for (const g of spec.minionGroups) {
    // Minion kinds are era-gated (D-213): a kind asked for outside its years becomes its era's kind.
    const era = minionKindForYear(MINION_KIND_IDS.includes(g.kind) ? g.kind : 'trooper', year);
    const kind = era.kind;
    if (era.note) notes.push(era.note);
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
      // Mandalorians may carry a slugthrower, by era (D-200).
      let slug: ReturnType<typeof mandalorianSlugthrower> = null;
      if (kind === 'mandalorian') {
        let u1: number;
        let u2: number;
        [u1, rng] = nextFloat(rng);
        [u2, rng] = nextFloat(rng);
        slug = mandalorianSlugthrower(dateFromAbsDay(s.clock.now.day).year, u1, u2);
      }
      // Numbered within its kind (pass 2: "B1 battle droid 2" was the first droid, after the duelist).
      const number = opponents.filter((o) => meta[o.id]?.minionKind === kind).length + 1;
      // A dev /fight weapon for the group (D-215) overrides the kind's weapon and the Mandalorian slugthrower roll.
      const f = buildMinionFighter(s, kind, grade, opponents.length, fightId, beskar, g.weapon ?? slug, number);
      // A minion strikes with its kind's archetype's intent (D-260); a group sent to take the player alive captures
      // when its loadout can subdue (D-262).
      opponents.push({ ...f, intent: strikeIntentFor(MINION_KINDS.find((k) => k.id === kind)?.archetype ?? 'soldier', spec.stakes, g.wantAlive === true, f.subdue ?? null) });
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
  // A plan holds unless the foe struck first (D-493).
  const planned = surprise !== 'B' && spec.stakes !== 'spar' && selectCanPlan(s) ? spec.opponentRefs.filter((id) => selectDuelistBar(s, selectNpc(s, id)?.canonId ?? null) === 'top' && selectPlanReady(s, id)) : [];
  for (const id of planned) notes.push(`the plan against ${selectNpc(s, id)!.name} holds: prepared, the character can buy time, not win`);
  // Lore ruling 3 (25 Nov 2026): against a Master-level foe a plan that holds lets the character win.
  const winning = surprise !== 'B' && spec.stakes !== 'spar' ? spec.opponentRefs.filter((id) => selectPlanWins(s, id)) : [];
  for (const id of winning) notes.push(`the plan against ${selectNpc(s, id)!.name} holds: prepared, the character can win`);
  const fightOpps = winning.length ? sparOpps.map((o) => (winning.includes(o.id) ? { ...o, aboveBar: false } : o)) : sparOpps;
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
  const duel0 = startDuel(player, fightOpps, rng, surprise);
  // The first bout's terrain accidents (D-144, D-184); a real fight is one bout. Health syncs like any duel damage.
  const hz = rollBoutHazards(duel0, ctx.hazards ?? [], selectNow(s).day);
  const duel = hz.duel;
  notes.push(...hz.notes);
  emit.push(...syncEmits(s, duel0, duel, meta));
  const active: ActiveFight = {
    id: fightId,
    startedAbs: absNow(s),
    stakes: spec.stakes,
    sparring,
    terrainTags: spec.terrainTags,
    ctx: { ...ctx, situations: [...ctx.situations], hazards: ctx.hazards ?? [], positionAttempt: ctx.positionAttempt ?? 0, hazardEvery: ctx.hazardEvery ?? null, cover: ctx.cover ?? false, forceNegated: ctx.forceNegated ?? false },
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
    truceOffer: null,
    ...(planned.length ? { planned } : {}),
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
  if (newWounds.length || a.vitality !== before.a.vitality || a.meters.p !== before.a.meters.p || a.meters.f !== before.a.meters.f || (a.meters.m ?? 0) !== (before.a.meters.m ?? 0)) {
    // Backlash mental load (health §2, through forceMeter.ts) reaches the character with the other meters (D-194).
    out.push({ type: 'healthSynced', vitalityLost: lost, addWounds: newWounds, meters: { p: a.meters.p, f: a.meters.f, ...(a.meters.m !== undefined ? { m: a.meters.m } : {}) }, cause: 'duel' });
  }
  // A hit on a prosthetic is equipment damage (D-511): the aid's new condition reaches health.
  for (const l of a.lasting) {
    const was = before.a.lasting.find((x) => x.id === l.id);
    if (l.aidCondition && l.aidCondition !== was?.aidCondition) out.push({ type: 'prostheticDamaged', part: l.part, condition: l.aidCondition });
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
function conclude(slice: CombatSlice, s: GameState, active: ActiveFight, outcome: CombatOutcome, reason: string): { slice: CombatSlice; emit: GameEvent[]; notes: string[]; rng: RngState } {
  const duel = active.duel as DuelState;
  const emit: GameEvent[] = [];
  const notes: string[] = [`fight ${active.id} ends: ${outcome} (${reason})`];
  const strikes = duel.log.filter((r) => r.kind !== 'force');
  const exchanges = strikes.map((r, i) => ({ skillId: active.exchangeSkills[i] ?? duel.a.skillId, gap: r.effB - r.effA }));
  const forceUses = duel.log.filter((r) => r.kind === 'force' && r.force?.side === 'A').map((r) => ({ abilityId: r.force!.abilityId, gap: r.force!.effTarget - r.force!.effUser }));
  // A spar with several partners counts as one at the strongest's level + 10 per extra (D-163); otherwise the largest gap.
  // An opponent who fought an ally the whole time (D-212) is not the player's: no gap, no heroic act, no fate.
  const faced = duel.opponents.filter((o) => !(o.engagedElsewhere && !o.out));
  const opponentGap = active.stakes === 'spar' ? sparGroupLevel(duel.opponents.map((o) => o.level)) - duel.a.level : Math.max(0, ...faced.map((o) => o.level - duel.a.level));
  // The strongest opponent's form (D-427: learning by dueling a stronger opponent).
  const strongest = [...faced].sort((x, y) => y.level - x.level)[0];
  const opponentForm = strongest && FORM_IDS.includes(strongest.skillId) ? strongest.skillId : null;
  if (exchanges.length || forceUses.length) emit.push({ type: 'fightResolved', stakes: active.stakes, outcome, exchanges, forceUses, opponentGap, ...(opponentForm ? { opponentForm } : {}), ...(reason === 'surrendered' ? { surrendered: true } : {}) });
  // m8-skills (D-513): strikes earned by reaching +3 on the advantage track teach a little Tactics; a style fought with grows;
  // a serious or lethal fight won is a deed on a service record.
  const earned = duel.log.filter((r) => r.kind === 'strike' && r.striker === 'A' && !r.surprise && r.advBefore >= STRIKE_AT).length;
  if (earned > 0) emit.push({ type: 'playXpEarned', source: 'strikes', strikes: earned, stakes: active.stakes });
  if (duel.a.style && strikes.length) emit.push({ type: 'styleFought', styleId: duel.a.style.id, stakes: active.stakes });
  if (outcome === 'won' && (active.stakes === 'serious' || active.stakes === 'lethal') && s.ranks.service) emit.push({ type: 'serviceDeedRecorded', why: `a ${active.stakes} fight won` });
  // heroicAct (flag-registry §2): a won lethal fight against an opponent 10+ stronger or of rank Sith Lord / Master.
  if (active.stakes === 'lethal' && outcome === 'won') {
    const heroic = faced.some((o) => o.level - duel.a.level >= HEROIC_ACT.gapAtLeast || HEROIC_ACT.ranks.includes(active.meta[o.id]?.rank ?? ''));
    if (heroic) emit.push({ type: 'flagSet', flag: `heroicAct:${active.id}` });
  }
  const fates = [...slice.fates];
  for (const o of duel.opponents) {
    const m = active.meta[o.id];
    if (!m?.npcId) continue;
    if (o.dead) emit.push({ type: 'npcDied', npcRef: m.npcId, cause: `killed in fight ${active.id}` });
    // An opponent who cannot stand or has lost the weapon arm (D-198) is down too: spared, captured or finished off.
    // A named opponent who surrendered on morale (D-256) is at the player's mercy too; one who fled is gone.
    else if (outcome === 'won' && (o.yielded === 'surrendered' || isIncapacitated(o.wounds as Wound[]) || isDying(o.wounds as Wound[]) || cannotDuel(o))) fates.push({ npcId: m.npcId, fightId: active.id, options: [...NPC_FATES], atAbs: toAbsSecond(s.clock.now), locationId: s.locations.currentId, dying: isDying(o.wounds as Wound[]) });
  }
  // One stream (D-238): the fight's dice continue the campaign's. The fate roll draws after the last exchange, and the
  // stream after it goes back to meta, so the next fight never replays this one.
  let rng: RngState = duel.rng;
  let playerFate: FateKind | null = null;
  let captors: FightSummary['captors'] = null;
  const playerDown = outcome === 'lost' && (duel.a.out || isIncapacitated(duel.a.wounds as Wound[]) || isDying(duel.a.wounds as Wound[]) || cannotDuel(duel.a) !== null);
  // A surrender puts the player at the opponent's mercy too (D-216; pass 2: nothing was decided): the same fate roll.
  const surrendered = reason === 'surrendered';
  if (playerDown || surrendered) {
    const rule = FATE_BY_STAKES[active.stakes];
    const winner = duel.opponents.find((o) => !o.out) ?? duel.opponents[0]!;
    // A minion captor is its kind's archetype (D-239: Yuuzhan Vong warriors capture to sacrifice, named or not). An
    // execution on surrender stays a named captor's choice (D-218); minions only ever capture.
    const winnerMeta = active.meta[winner.id];
    const archetype = winnerMeta?.npcId ? (selectNpcGen(s, winnerMeta.npcId)?.archetype ?? 'other') : (MINION_KINDS.find((k) => k.id === winnerMeta?.minionKind)?.archetype ?? 'soldier');
    const rules = CAPTOR_RULES[archetype] ?? {};
    const captor = winnerMeta?.npcId ? rules : { ...(rules.capturesToExecute ? { capturesToExecute: true } : {}) };
    // Subdued by a capturing opponent (D-262): taken, whatever the stakes; no roll.
    if (reason === 'captured') playerFate = 'captured';
    else if (rule !== 'roll') playerFate = rule;
    else if (surrendered) {
      // A surrender is a capture by default (Jared, D-218); an archetype with an execution chance may kill instead.
      const chance = captor.surrenderExecution ? (active.stakes === 'lethal' ? captor.surrenderExecution.lethal : captor.surrenderExecution.serious) : 0;
      const [u, r] = nextFloat(rng);
      rng = r;
      playerFate = u < chance ? 'killingStrike' : 'captured';
    } else {
      const table = FATE_ROLL[fateGroup(archetype)];
      const [u, r] = nextFloat(rng);
      rng = r;
      if (active.stakes === 'lethal') playerFate = u < table.lethal[0] ? 'killingStrike' : u < table.lethal[0] + table.lethal[1] ? 'captured' : 'left';
      else playerFate = u < table.serious[0] ? 'captured' : 'left';
    }
    // Captors want a prisoner alive (Jared, D-225): a dying captive is stabilized, unless the captor captures to execute.
    const stabilized = playerFate === 'captured' && isDying(duel.a.wounds as Wound[]) && !captor.capturesToExecute;
    if (stabilized) emit.push({ type: 'woundsStabilized', by: 'the captors' });
    // A killing strike is a mortal wound, so the dying timer leaves room for a rescue (D-154).
    if (playerFate === 'killingStrike' && !isDying(duel.a.wounds as Wound[])) {
      emit.push({ type: 'healthSynced', vitalityLost: selectMaxVitality(s), addWounds: [{ id: 'fate', part: 'torso', severity: 'mortal', W: 55, stabilized: false, healProgress: 0, day: selectNow(s).day, source: 'a killing strike' }], cause: 'a killing strike' });
    }
    notes.push(`the opponent's choice: ${playerFate}`);
    if (playerFate === 'captured') {
      captors = captorsOf(duel, active, winner, s);
      notes.push(`captured by: ${captors.group}`);
      // One captivity record for fights and blockades; the engine alone ends it (D-471).
      emit.push({ type: 'captivityBegan', source: 'fight', sourceId: active.id, group: captors.group, kind: captors.kind, names: captors.names, weapon: captors.weapon ?? null, security: selectFightSecurity(captors.standing, captors.kind === null), atAbs: captors.atAbs });
    }
  }
  // The end card shows the state after the captors' care (pass 3: "Mira Tane: Dying" after "stabilized by the captors").
  const shown = playerDown || surrendered ? markStabilized(duel, emit) : duel;
  // Standing up to a top or apex duelist (D-489; D-496): the time bought is the fight's clock until the duelist had the way
  // past (D-497). It counts as a hold when it is what those who flee need there (the recorded place); never a win.
  const tier = selectDuelTier(s);
  const stood = active.stakes === 'spar' || outcome === 'won' ? [] : duel.opponents.flatMap((o) => {
    const npcId = active.meta[o.id]?.npcId ?? null;
    const bar = npcId ? selectDuelistBar(s, selectNpc(s, npcId)?.canonId ?? null) : null;
    if (!npcId || o.engagedElsewhere || (bar !== 'top' && bar !== 'apex')) return [];
    const planned = active.planned?.includes(npcId) === true;
    return [{ npcId, length: holdAgainst(tier === 'below' && planned ? 'master' : tier, bar), hold: playerHold(s, npcId, duel.a.level, active.id, duel.log.filter((r) => !r.duringForce).map((r) => r.seconds)) }];
  });
  const heldOff = stood.flatMap((x) => (x.length && x.hold.enough ? [{ npcId: x.npcId, length: x.length }] : []));
  // Against several at once, the time is what the first of them to get past gave.
  const hold = [...stood].sort((x, y) => x.hold.seconds - y.hold.seconds)[0]?.hold;
  if (hold) notes.push(`${selectNpc(s, hold.npcId)?.name ?? hold.npcId} held for about ${Math.round(hold.seconds)} s (${hold.need} s needed here): ${hold.enough ? 'enough' : 'not enough'}; not a win`);
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
    locationId: s.locations.currentId,
    duel,
    session: active.session ?? null,
    ...(heldOff.length ? { heldOff } : {}),
    ...(hold ? { hold } : {}),
  };
  // A plan is spent by the fight it was for.
  const plans = (slice.plans ?? []).filter((p) => !duel.opponents.some((o) => o.id === p.npcId));
  return { slice: { ...slice, active: null, fates, ...(slice.plans ? { plans } : {}), last: { ...last, duel: shown, captors } }, emit, notes, rng };
}

/**
 * The player's captors (D-242): a named winner by name; a minion winner as its kind's group still standing ("4 line
 * troopers"), with the names, so the following scenes name the right captors.
 */
function captorsOf(duel: DuelState, active: ActiveFight, winner: DuelState['opponents'][number], s: GameState): NonNullable<FightSummary['captors']> {
  const kind = active.meta[winner.id]?.minionKind ?? null;
  const standing = duel.opponents.filter((o) => !o.out && !o.engagedElsewhere && (kind ? active.meta[o.id]?.minionKind === kind : o.id === winner.id));
  const label = kind ? (MINION_KINDS.find((k) => k.id === kind)?.label ?? kind) : winner.name;
  const group = kind ? `${standing.length} ${label}${standing.length === 1 ? '' : 's'}` : winner.name;
  // Their weapon in words (pass 4 issue 4: Mandalorians with slugthrower rifles leveled "a heavy blaster" next scene).
  const w = standing[0] ?? winner;
  const weapon = w.weaponName ? `${w.weaponName}${kind ? 's' : ''}` : WEAPON_NAMES[w.weapon];
  return { group, kind, standing: standing.length, names: standing.map((o) => o.name), atAbs: toAbsSecond(s.clock.now), locationId: s.locations.currentId, weapon };
}

/** The duel with the player's mortal wounds stabilized when the conclusion emitted woundsStabilized. */
function markStabilized(duel: DuelState, emit: readonly GameEvent[]): DuelState {
  // A killing strike's mortal wound is on the card too (pass 4 issue 12: "Varn Kessa: Healthy" after it).
  const fate = emit.flatMap((e) => (e.type === 'healthSynced' && e['cause'] === 'a killing strike' ? ((e['addWounds'] as Wound[] | undefined) ?? []) : []));
  const withFate = fate.length ? { ...duel, a: { ...duel.a, wounds: [...(duel.a.wounds as Wound[]), ...fate] } } : duel;
  if (!emit.some((e) => e.type === 'woundsStabilized')) return withFate;
  return { ...withFate, a: { ...withFate.a, wounds: (withFate.a.wounds as Wound[]).map((w) => (w.severity === 'mortal' && !w.stabilized ? { ...w, stabilized: true } : w)) } };
}

/** Outcome of a duel end for side A. */
const outcomeOf = (d: DuelState): CombatOutcome => (d.end?.winner === 'A' ? 'won' : d.end?.winner === 'B' ? 'lost' : d.end?.reason === 'stalemate' || d.end?.reason === 'brokeOff' ? 'stalemate' : 'fled');

/**
 * The rest of a sparring session resolved in code, like a montage (D-168): every remaining bout to its end, then the
 * conclusion; the turn narrates the whole session once.
 */
function resolveSessionRest(slice: CombatSlice, s: GameState, active: ActiveFight, session: SparSessionState, before: DuelState, duel: DuelState, day: number, notes: string[]): ReturnType<typeof conclude> {
  const r = runSession(duel, session, active.ctx as ActiveFight['ctx'] & { situations: never[] }, day);
  const nextActive: ActiveFight = { ...active, duel: r.duel, session: r.session, exchangeSkills: withSkills(active, before, r.duel), beat: null };
  const c = conclude(slice, s, nextActive, sessionOutcome(r.session), `sparring session (${r.session.ended})`);
  notes.push(...r.notes);
  // The player can always step in (D-177): the next bout with the same named partners, unless someone was really hurt.
  const partners = Object.values(active.meta).map((m) => m.npcId).filter((id): id is string => id !== null && selectNpc(s, id)?.status === 'active');
  const hurt = isIncapacitated(r.duel.a.wounds as Wound[]) || isDying(r.duel.a.wounds as Wound[]) || r.session.ended === 'injury';
  const rematch = partners.length && !hurt ? { opponentRefs: partners, sparringMode: active.sparring } : null;
  const sliceOut = c.slice.last ? { ...c.slice, last: { ...c.slice.last, rematch } } : c.slice;
  return { ...c, slice: sliceOut, emit: [...syncEmits(s, before, r.duel, active.meta), ...c.emit], notes: [...notes, ...c.notes] };
}

/** Applies a segment's result: health sync, skills, beat, and the conclusion when the duel ended. */
function settle(slice: CombatSlice, s: GameState, active: ActiveFight, before: DuelState, after: DuelState, beat: string | null, narrated: boolean, extraNotes: string[] = []): { slice: CombatSlice; emit: GameEvent[]; notes: string[]; rng: RngState } {
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
    if (r.next) {
      // The next bout's terrain accidents (D-144, D-184).
      const hz = rollBoutHazards(r.next, active.ctx.hazards ?? [], selectNow(s).day);
      return { slice: { ...slice, active: { ...nextActive, duel: hz.duel, session: r.session, beat: 'boutEnded', lastNarrated: after.exchange } }, emit: [...emit, ...syncEmits(s, r.next, hz.duel, active.meta)], notes: [...extraNotes, boutNote, ...hz.notes], rng: hz.duel.rng };
    }
    const c = conclude(slice, s, { ...nextActive, session: r.session }, sessionOutcome(r.session), `sparring session (${r.session.ended})`);
    return { ...c, emit: [...emit, ...c.emit], notes: [...extraNotes, boutNote, ...c.notes] };
  }
  if (after.end) {
    const c = conclude(slice, s, nextActive, outcomeOf(after), after.end.reason);
    return { ...c, emit: [...emit, ...c.emit], notes: [...extraNotes, ...c.notes] };
  }
  return { slice: { ...slice, active: nextActive }, emit, notes: extraNotes, rng: after.rng };
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
  action: z.enum(FORCE_ACTION_KINDS as unknown as [ForceActionKind, ...ForceActionKind[]]).optional(),
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
        opponentRefs: z.array(z.string()).max(6),
        minionGroups: z.array(z.object({ kind: z.enum(MINION_KIND_IDS as [string, ...string[]]), count: z.number().int().min(1).max(99), wantAlive: z.boolean().optional().describe('Sent to take the player alive') })).max(4).optional(),
        stakes: z.enum(COMBAT_STAKES),
        terrainTags: z.array(z.enum(TERRAIN_IDS as [string, ...string[]])).max(5),
        ambushClaim: z.boolean().optional(),
        engagedElsewhereRefs: z.array(z.string()).max(6).optional(),
        sparringMode: z.enum(SPARRING_MODES).optional().describe("Spar only: a master's harsher stakes"),
        wantAliveRefs: z.array(z.string()).max(6).optional().describe('Opponents who want the player alive: they subdue, not kill'),
        // A battle between ships, in plain words (m8-ship-battles, D-517): one field, so the response schema stays under its cap.
        ships: z.string().max(200).optional(),
      }),
      sources: ['ai', 'engine'],
      narrative: (s) => s.combat.active === null && s.combat.pending === null,
      // Situational fields (D-520): a battle between ships only where ships are; a master's sparring stakes in training; allies
      // fighting elsewhere only when someone is here.
      partFields: { ships: ['ship', 'command'], sparringMode: 'training', engagedElsewhereRefs: 'people' },
      refFields: ['opponentRefs', 'engagedElsewhereRefs', 'wantAliveRefs'],
      refKinds: npcRefKinds,
      handle: (slice, e) => {
        if (slice.active) return { reject: 'a fight is already in progress' };
        // A ship battle (D-517): the battles feature checks the words against the dated classes and builds it, or refuses.
        const ships = typeof e['ships'] === 'string' ? e['ships'].trim() : '';
        if (ships) return { slice, emit: [{ type: 'shipBattleProposed', what: ships }], notes: ['a ship battle proposed (the battles feature checks it)'] };
        const notes: string[] = [];
        const groups = ((e['minionGroups'] as { kind: string; count: number; wantAlive?: boolean }[] | undefined) ?? []).map((g) => {
          const count = Math.min(MINION_COUNT.max, Math.max(MINION_COUNT.min, g.count));
          if (count !== g.count) notes.push(`minion count ${g.count} clamped to ${count}`);
          return { kind: g.kind, count, ...(g.wantAlive ? { wantAlive: true } : {}) };
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
          wantAlive: ((e['wantAliveRefs'] as string[] | undefined) ?? []).filter((r) => opponentRefs.includes(r)),
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
        minionGroups: z.array(z.object({ kind: z.enum(MINION_KIND_IDS as [string, ...string[]]), count: z.number().int().min(1).max(99), weapon: z.enum(WEAPON_KINDS).optional(), wantAlive: z.boolean().optional() })).max(4).optional(),
        /** A sparring session played out beat by beat from its first exchange (D-180 /spar), not resolved like a montage. */
        playOut: z.boolean().optional(),
        /** Opponents who want the player alive (D-260; dev /fight ... alive). */
        wantAliveRefs: z.array(z.string()).optional(),
      }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        if (slice.active) return { reject: 'a fight is already in progress' };
        const spec: PendingFight | null = e['fromPending']
          ? slice.pending
          : { opponentRefs: (e['opponentRefs'] as string[]) ?? [], minionGroups: ((e['minionGroups'] as { kind: string; count: number; weapon?: WeaponKind; wantAlive?: boolean }[] | undefined) ?? []).map((g) => ({ kind: g.kind, count: Math.min(MINION_COUNT.max, Math.max(MINION_COUNT.min, g.count)), ...(g.weapon ? { weapon: g.weapon } : {}), ...(g.wantAlive ? { wantAlive: true } : {}) })), stakes: (e['stakes'] as CombatStakes) ?? 'serious', terrainTags: ((e['terrainTags'] as string[]) ?? []).filter((t) => TERRAIN_IDS.includes(t)), ambushClaim: false, engagedElsewhere: [], sparringMode: (e['sparringMode'] as PendingFight['sparringMode'] | undefined) ?? null, wantAlive: (e['wantAliveRefs'] as string[] | undefined) ?? [] };
        if (!spec) return { reject: 'no pending fight' };
        const id = `fight-${slice.seq}`;
        const r = startFight(ctx.state, spec, id);
        if (!r.active.duel.opponents.length) return { reject: 'no opponent could join the fight' };
        const active = e['playOut'] === true && r.active.session ? { ...r.active, session: { ...r.active.session, playing: true } } : r.active;
        // A new fight closes every fate choice still open (issue 18).
        const begun = { ...slice, pending: null, active, fates: [], seq: slice.seq + 1 };
        // A player who is dying cannot fight (D-242; pass 3: a typed attack ended the fight at exchange 0, a dev fight let
        // the same player act): the fight ends at once as lost (dying), and the opponent's choice follows.
        const d0 = active.duel as DuelState;
        if (!active.session && isDying(d0.a.wounds as Wound[])) {
          const ended = { ...active, duel: { ...d0, rng: r.rng, a: { ...d0.a, out: true }, end: { winner: 'B' as const, reason: 'dying' } } };
          const c = conclude(begun, ctx.state, ended, 'lost', 'dying');
          return { slice: c.slice, emit: [...r.emit, ...c.emit], notes: [...r.notes, 'the player character is dying and cannot fight: the fight ends at once', ...c.notes], rng: c.rng };
        }
        // The same for a player who cannot stand or has no weapon arm (D-245; pass 4: a fitted leg was put out after one
        // exchange with no reason given). The log says why.
        const why = active.session ? null : cannotDuel(d0.a);
        if (why) {
          const ended = { ...active, duel: { ...d0, rng: r.rng, a: { ...d0.a, out: true }, end: { winner: 'B' as const, reason: 'incapacitated' } } };
          const c = conclude(begun, ctx.state, ended, 'lost', 'incapacitated');
          const text = why === 'leg' ? cannotStandText(d0.a) : 'no weapon arm';
          return { slice: c.slice, emit: [...r.emit, ...c.emit], notes: [...r.notes, `the player character cannot fight (${text}): the fight ends at once`, ...c.notes], rng: c.rng };
        }
        return { slice: begun, emit: r.emit, notes: r.notes, rng: r.rng };
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
        // acceptTruce: the player accepts the narrator's truce offer (D-181). target: a setting now (targetSet, D-182).
        action: z.enum(['acceptTruce', 'tactic', 'maneuver', 'aim', 'formChange', 'posture', 'clarify', 'force', 'shatterpoint', 'sequence', 'fightOn', 'narrate', 'resolve', 'continue', 'playBout', 'stopSession']),
        /** posture: a take-position attempt (D-179). */
        position: z.boolean().optional(),
        /** aim: the body part the next strike goes for (D-171). */
        part: z.enum(BODY_PARTS).optional(),
        stance: z.enum(STANCES).optional(),
        tactic: z.enum(TACTICS).optional(),
        maneuver: z.enum(MANEUVERS).optional(),
        form: z.string().optional(),
        force: z.object({ kind: z.enum(FORCE_ACTION_KINDS as unknown as [ForceActionKind, ...ForceActionKind[]]), effort: z.enum(['light', 'standard', 'heavy', 'allOut']).optional(), objectTag: z.string().optional() }).optional(),
        targetRef: z.string().optional(),
        steps: z.array(stepSchema).max(SEQUENCE_SCHEMA_MAX).optional(),
      }),
      sources: ['player', 'engine'],
      handle: (slice, e, ctx) => {
        let active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const s = ctx.state;
        const day = selectNow(s).day;
        // One stream (D-238): the exchanges draw from the campaign's RNG, never from a copy kept since the fight began.
        const before = { ...(active.duel as DuelState), rng: s.meta.rngState };
        const ctxD = active.ctx as ActiveFight['ctx'] & { situations: never[] };
        let duel: DuelState = { ...before, a: { ...before.a } };
        let action = String(e['action']);
        const notes: string[] = [];
        // A truce offer stands until the player answers it: accepted here, declined by any other action (D-181).
        if (action === 'acceptTruce') {
          if (!active.truceOffer) return { reject: 'no truce has been offered' };
          const c = conclude(slice, s, { ...active, duel }, 'truce', 'truce');
          return { slice: c.slice, emit: [...syncEmits(s, before, duel, active.meta), ...c.emit], notes: [`truce accepted: ${active.truceOffer}`, ...c.notes], rng: c.rng };
        }
        if (active.truceOffer) {
          notes.push('truce offer declined: the fight goes on');
          active = { ...active, truceOffer: null };
        }
        // A sparring session (D-168): by default the rest resolves in code with one narration; Play this bout plays the
        // current bout out with the normal beats (any tactical action does too); Stop ends the session.
        const session = active.session;
        if (session && !session.ended) {
          if (action === 'stopSession') {
            const c = stopSession(slice, s, active, duel, session, 'stopped');
            return { slice: c.slice, emit: c.emit, notes: c.notes, rng: c.rng };
          }
          const passive = ['continue', 'fightOn', 'resolve', 'narrate'].includes(action);
          if (!session.playing && passive) {
            const c = resolveSessionRest(slice, s, active, session, before, duel, day, notes);
            return { slice: c.slice, emit: c.emit, notes: c.notes, rng: c.rng };
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
        } else if (action === 'tactic') {
          const t = String(e['tactic']);
          if (t === 'surrender') {
            const c = conclude(slice, s, { ...active, duel }, 'lost', 'surrendered');
            return { slice: c.slice, emit: [...syncEmits(s, before, duel, active.meta), ...c.emit], notes: c.notes, rng: c.rng };
          }
          if (t === 'disengage') {
            // A contest that ends the fight as fled: d20 + Agility/10 (+ position) vs d20 + the opponent's skill/10.
            const dc = disengageContest(duel);
            const u = dc.mine;
            const d = dc.theirs;
            duel = dc.duel;
            if (dc.ok) {
              const c = conclude(slice, s, { ...active, duel }, 'fled', 'disengaged');
              return { slice: c.slice, emit: [...syncEmits(s, before, duel, active.meta), ...c.emit], notes: [`disengage: ${u.total.toFixed(1)} vs ${d.total.toFixed(1)}`, ...c.notes], rng: c.rng };
            }
            notes.push(`disengage failed: ${u.total.toFixed(1)} vs ${d.total.toFixed(1)}`);
          } else if (t === 'feint' || t === 'taunt' || t === 'useEnvironment' || t === 'takePosition') {
            if (t === 'takePosition') duel = { ...duel, a: { ...duel.a, pendingManeuver: 'position' } };
            else {
              const r = runSequence({ duel, patternUses: active.patternUses, objects: active.objects }, ctxD, day, [{ kind: 'tactic', tactic: t === 'taunt' ? 'taunt' : 'feint' }], 1, active.objectSizes, forceProfile(s));
              duel = r.state.duel;
              notes.push(...r.lines);
            }
          }
        } else if (action === 'force') {
          const f = e['force'] as { kind: ForceActionKind; effort?: 'light' | 'standard' | 'heavy' | 'allOut'; objectTag?: string };
          // An ability the character does not know: the step line "FAILED (you don't know X)", a quiet no-effect beat with
          // no exchange and no AI call (D-210), never a rejected event that leaves the narrator nothing to tell.
          const r = runSequence({ duel, patternUses: active.patternUses, objects: active.objects }, ctxD, day, [{ kind: 'forceAction', action: f.kind, ...(f.effort ? { effort: f.effort } : {}), ...(f.objectTag ? { objectTag: f.objectTag } : {}) }], 1, active.objectSizes, forceProfile(s));
          const settled = settle({ ...slice, active: { ...active, patternUses: r.state.patternUses, objects: r.state.objects } }, s, { ...active, patternUses: r.state.patternUses, objects: r.state.objects }, before, r.state.duel, ...beatFor(duel, r.state.duel, 'forceAction', r.lines), r.lines);
          return { slice: settled.slice, emit: settled.emit, notes: settled.notes, rng: settled.rng };
        } else if (action === 'shatterpoint') {
          const r = tryShatterpoint(duel, 'A');
          if (!r.roll) return { reject: 'no shatterpoint perception, or the shatterpoint was already read this fight' };
          duel = r.s;
          notes.push(`shatterpoint read: ${r.roll.total.toFixed(1)} vs 15: ${r.success ? 'success (advantage 3)' : 'nothing'}`);
        } else if (action === 'sequence') {
          const raw = (e['steps'] as z.infer<typeof stepSchema>[] | undefined) ?? [];
          const steps = raw.map(toStep).filter((x): x is SequenceStep => x !== null);
          // A step the intent returned incomplete (a stance with no stance, a Force action with no action) is logged, never silently lost (D-191).
          const incomplete = raw.flatMap((x, k) => (toStep(x) ? [] : [`intent step ${k + 1} (${x.kind}) dropped: incomplete (no ${x.kind === 'forceAction' ? 'action' : x.kind})`]));
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
          // Every step the intent returned gets a line: resolved, failed, or dropped with the reason (D-191).
          const seqNotes = [...incomplete, ...r.lines];
          const nextActive = { ...active, patternUses: r.state.patternUses, objects: r.state.objects };
          const settled = settle({ ...slice, active: nextActive }, s, nextActive, before, r.state.duel, ...beatFor(duel, r.state.duel, 'sequence', r.lines), seqNotes);
          return { slice: settled.slice, emit: settled.emit, notes: settled.notes, rng: settled.rng };
        } else if (action === 'fightOn') mode = 'fightOn';
        else if (action === 'resolve') mode = 'toEnd';
        else if (action === 'narrate') {
          mode = null;
          narrated = true;
          beat = 'playerNarrate';
        }
        if (mode) {
          // A dropped saber is recalled first by the passive buttons (D-208); typed play is unchanged.
          const r = runPassive({ duel, patternUses: active.patternUses, objects: active.objects }, ctxD, day, mode, active.objectSizes, forceProfile(s));
          duel = r.state.duel;
          active = { ...active, patternUses: r.state.patternUses, objects: r.state.objects };
          notes.push(...r.lines, ...r.notes);
          beat = r.beat;
          narrated = beat !== null && isNarratedBeat(beat as BeatReason);
        }
        const settled = settle({ ...slice, active }, s, active, before, duel, beat, narrated, notes);
        return { slice: settled.slice, emit: settled.emit, notes: settled.notes, rng: settled.rng };
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
      schema: z.object({
        type: z.literal('combatEnded'),
        reason: z.enum(['fled', 'surrendered', 'interrupted', 'truce']).describe('Only interrupted'),
        category: z.enum(INTERRUPT_CATEGORIES).optional().describe('With interrupted; its cause in the same reply'),
        why: z.string().min(1).max(200).optional().describe('With interrupted: the outside event'),
      }),
      sources: ['ai', 'engine'],
      // Applied after the rest of the reply, so the handler sees the event that caused an interruption (D-196).
      phase: 'last',
      narrative: (s) => s.combat.active !== null,
      part: 'fight',
      handle: (slice, e, ctx) => {
        if (!slice.active) return { reject: 'no fight in progress' };
        const reason = String(e['reason']);
        // The narrator cannot end a fight on its own say-so (D-181, extended): only an outside event stops it, with the
        // reason. Fled and surrendered come from the player's beats or an engine-rolled fate; a truce from truceOffered
        // and the player's acceptance.
        if (ctx.source === 'ai') {
          if (reason !== 'interrupted') return { reject: `the narrator cannot end a fight as ${reason}: fled and surrendered come from the player's Disengage and Surrender beats or an engine-rolled fate, and a truce from truceOffered and the player's acceptance; send combatEnded only as interrupted, for an outside event` };
          const why = String(e['why'] ?? '').trim();
          if (!why) return { reject: 'combatEnded interrupted needs a why: the outside event that stops the fight' };
          // An outside event of a listed kind, never the fight restated (D-196).
          if (!e['category']) return { reject: `combatEnded interrupted needs a category: ${INTERRUPT_CATEGORIES.join(', ')}` };
          if (INTERRUPT_RESTATES.some((re) => re.test(why.toLowerCase()))) return { reject: `combatEnded interrupted: "${why}" only describes the fight; an interruption is an outside event (${INTERRUPT_CATEGORIES.join(', ')}). The fight goes on` };
          // The cause must be in the same reply (Jared, D-196 amended): an event the engine can see.
          const category = e['category'] as InterruptCategory;
          const causes = INTERRUPT_CAUSES[category];
          if (!interruptCauseSeen(ctx, slice.active.duel as DuelState, causes)) return { reject: `combatEnded interrupted (${category}) needs its cause in the same reply: ${causes.map((c) => INTERRUPT_CAUSE_TEXT[c]).join(' or ')}. Nothing the engine can see stops the fight, so it goes on` };
          // A third party is someone outside the fighters (D-196, tightened after the re-check): what the opponents or the
          // player do in the fight ("the droids take cover behind the terrain") is the fight, not an interruption.
          if (category === 'thirdParty') {
            const d = slice.active.duel as DuelState;
            const nouns = new Set<string>();
            for (const f of [d.a, ...d.opponents]) for (const w of f.name.toLowerCase().split(/[^a-z]+/)) if (w.length >= 4) nouns.add(w);
            const words = why.toLowerCase().split(/[^a-z]+/);
            const named = words.find((w) => nouns.has(w) || nouns.has(w.replace(/s$/, '')) || INTERRUPT_FIGHTER_WORDS.includes(w));
            if (named) return { reject: `combatEnded interrupted: "${why}" is something the fighters do ("${named}"), not an outside event. The fight goes on; if nothing outside the fight stops it, send no combatEnded` };
          }
        }
        // A sparring session ends by its bouts or when the player stops (D-181): a bout's point is not the end of the
        // session. Only the story stopping it (interrupted) ends it from the narration, with the bouts so far.
        // One stream (D-238): a hazard rolled for everyone and the fate roll continue the campaign's RNG.
        const synced: ActiveFight = { ...slice.active, duel: { ...(slice.active.duel as DuelState), rng: ctx.state.meta.rngState } };
        const session = synced.session;
        if (session && !session.ended) {
          if (reason !== 'interrupted') return { reject: 'a sparring session ends by its bouts or when the player stops; a bout ending is not the end of the session' };
          const c = stopSession(slice, ctx.state, synced, synced.duel as DuelState, session, 'interrupted');
          return { slice: c.slice, emit: c.emit, notes: c.notes, rng: c.rng };
        }
        // An interrupted fight is recorded as interrupted with its real state: never fled, never won (D-196).
        const outcome: CombatOutcome = reason === 'truce' ? 'truce' : reason === 'surrendered' ? 'lost' : reason === 'interrupted' ? 'interrupted' : 'fled';
        const standing = (synced.duel as DuelState).opponents.filter((o) => !o.out).length;
        const label = reason === 'interrupted' ? `${e['category'] ? `${String(e['category'])}: ` : ''}${String(e['why'] ?? 'an outside event')}; ${standing} opponent${standing === 1 ? '' : 's'} still standing` : e['why'] ? `${reason}: ${String(e['why'])}` : reason;
        // A narrator's hazard that ends the fight (Jared, D-217): the engine rolls its damage for everyone still in it by
        // the normal hazard rules; the narrator never sets damage. The wounds reach health and the NPCs before the end.
        const before = synced.duel as DuelState;
        const hazardEvent = reason === 'interrupted' && e['category'] === 'environmentCollapse' ? (ctx.batch ?? []).find((b) => b.event.type === 'hazardOccurred')?.event : undefined;
        if (hazardEvent) {
          const hz = hazardOnAll(before, { type: hazardEvent['hazard'] as HazardType, severity: Number(hazardEvent['severityHint']) as 1 | 2 | 3, cause: String(hazardEvent['cause']) }, selectNow(ctx.state).day);
          const c = conclude(slice, ctx.state, { ...synced, duel: hz.duel }, outcome, label);
          return { slice: c.slice, emit: [...syncEmits(ctx.state, before, hz.duel, synced.meta), ...c.emit], notes: [...hz.notes, ...c.notes], rng: c.rng };
        }
        const c = conclude(slice, ctx.state, synced, outcome, label);
        return { slice: c.slice, emit: c.emit, notes: c.notes, rng: c.rng };
      },
    },
    /** Dev only (D-215): /fall rolls the fight's terrain accidents now, as at the start of a block of exchanges (D-185). */
    devTerrainRolled: {
      schema: z.object({ type: z.literal('devTerrainRolled') }),
      sources: ['dev'],
      handle: (slice, _e, ctx) => {
        const active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const hazards = active.ctx.hazards ?? [];
        if (!hazards.length) return { reject: 'this fight has no hazardous terrain (try terrain ice, forest or ruins)' };
        const before = { ...(active.duel as DuelState), rng: ctx.state.meta.rngState };
        const hz = rollBoutHazards(before, hazards, selectNow(ctx.state).day);
        const notes = hz.notes.length ? hz.notes : ['terrain rolled: nobody fell'];
        return { slice: { ...slice, active: { ...active, duel: hz.duel } }, emit: syncEmits(ctx.state, before, hz.duel, active.meta), notes, rng: hz.duel.rng };
      },
    },
    /**
     * Dev only (D-241): /exchanges n resolves up to n exchanges with the current stance, as Resolve to end would, and
     * stops early when the fight ends (the 200-exchange cap among the ways, D-208). No narration of its own.
     */
    devExchanges: {
      // setTo: move the exchange counter to that number first, with no rolls (dev: real duels end long before the
      // 200-exchange cap, so this is the way to test it).
      schema: z.object({ type: z.literal('devExchanges'), count: z.number().int().min(1).max(400), setTo: z.number().int().min(0).max(399).optional() }),
      sources: ['dev'],
      handle: (slice, e, ctx) => {
        const active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        if (active.session) return { reject: 'not in a sparring session (its bouts have their own budget, D-168)' };
        const s = ctx.state;
        const setTo = e['setTo'] as number | undefined;
        const was = active.duel as DuelState;
        if (setTo !== undefined && setTo < was.exchange) return { reject: `the fight is already at exchange ${was.exchange}` };
        const before = { ...was, rng: s.meta.rngState, ...(setTo !== undefined ? { exchange: setTo } : {}) };
        const ctxD = active.ctx as ActiveFight['ctx'] & { situations: never[] };
        const r = runPassive({ duel: before, patternUses: active.patternUses, objects: active.objects }, ctxD, selectNow(s).day, 'toEnd', active.objectSizes, forceProfile(s), Number(e['count']));
        const next = { ...active, patternUses: r.state.patternUses, objects: r.state.objects };
        const done = r.state.duel.exchange - before.exchange;
        const settled = settle({ ...slice, active: next }, s, next, before, r.state.duel, r.beat, false, [...r.lines, ...r.notes, ...(setTo !== undefined ? [`dev: exchange counter moved ${was.exchange} -> ${setTo} (no rolls)`] : []), `dev: ${done} exchange${done === 1 ? '' : 's'} resolved (asked ${String(e['count'])})`]);
        return { slice: settled.slice, emit: settled.emit, notes: settled.notes, rng: settled.rng };
      },
    },
    /** Dev only (D-241): /stakes sets the current fight's stakes (the execution and fate rules read them at the end). */
    devStakesSet: {
      schema: z.object({ type: z.literal('devStakesSet'), stakes: z.enum(COMBAT_STAKES) }),
      sources: ['dev'],
      handle: (slice, e) => {
        const active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const stakes = e['stakes'] as CombatStakes;
        if (stakes === 'spar' || active.stakes === 'spar') return { reject: 'a spar and a real fight are set up differently: start a new one' };
        return { slice: { ...slice, active: { ...active, stakes, ctx: { ...active.ctx, dyingRiskStakes: stakes === 'lethal' || stakes === 'serious' } } }, notes: [`stakes: ${active.stakes} -> ${stakes}`] };
      },
    },
    /** Dev only (D-180; combat pass 1 issue 21): /fatigue during a fight reaches the player's fighter. */
    devDuelMetersSynced: {
      schema: z.object({ type: z.literal('devDuelMetersSynced') }),
      sources: ['engine'],
      handle: (slice, _e, ctx) => {
        if (!slice.active) return { slice };
        const duel = slice.active.duel as DuelState;
        const m = ctx.state.health.meters;
        return { slice: { ...slice, active: { ...slice.active, duel: { ...duel, a: { ...duel.a, meters: { p: m.p, f: m.f, m: m.m } } } } } };
      },
    },
    /**
     * AI: an alarm is raised or the authorities are called (D-196 amended): the cause an alarmOrAuthorities interruption
     * needs in the same reply. It changes no state; the note keeps it in the transcript.
     */
    alarmRaised: {
      schema: z.object({ type: z.literal('alarmRaised'), why: z.string().min(1).max(200) }),
      sources: ['ai'],
      narrative: (s) => s.combat.active !== null,
      part: 'fight',
      handle: (slice, e) => ({ slice, notes: [`alarm raised: ${String(e['why'])}`] }),
    },
    /**
     * AI: the opponent offers a truce (D-181). Nothing ends: the duel panel shows Accept the truce, and any other action
     * declines it. Not in a sparring session (its bouts end it).
     */
    truceOffered: {
      schema: z.object({ type: z.literal('truceOffered'), why: z.string().min(1).max(200).describe('Who offers it, on what terms') }),
      // dev: /truce makes the opponent offer one, for testing (D-215).
      sources: ['ai', 'dev'],
      narrative: (s) => s.combat.active !== null && !s.combat.active.session,
      part: 'fight',
      handle: (slice, e) => {
        if (!slice.active) return { reject: 'no fight in progress' };
        if (slice.active.session) return { reject: 'a sparring session ends by its bouts or when the player stops' };
        return { slice: { ...slice, active: { ...slice.active, truceOffer: String(e['why']) } }, notes: [`truce offered: ${String(e['why'])}`] };
      },
    },
    /**
     * Player: the target (D-182, extended). A setting like the stance: no exchange, no AI call, no time, no turn. It
     * stays until changed; when that opponent is out the duel falls back to the next engaged one.
     */
    targetSet: {
      schema: z.object({ type: z.literal('targetSet'), targetRef: z.string() }),
      sources: ['player'],
      handle: (slice, e) => {
        const active = slice.active;
        if (!active) return { reject: 'no fight in progress' };
        const duel = active.duel as DuelState;
        const idx = duel.opponents.findIndex((o) => o.id === e['targetRef'] && !o.out && !o.engagedElsewhere);
        if (idx < 0) return { reject: 'no such opponent in the fight' };
        if (duel.target === idx) return { slice };
        return { slice: { ...slice, active: { ...active, duel: { ...duel, target: idx } } }, notes: [`target: ${duel.opponents[idx]!.name}`] };
      },
    },
    /** Engine (the turn's resolve step): one line of a plan against a top duelist, as the check came out (D-493). */
    planTried: {
      schema: z.object({ type: z.literal('planTried'), npcRef: z.string(), kind: z.enum(PLAN_KINDS), success: z.boolean(), total: z.number() }),
      sources: ['engine'],
      targetField: 'npcRef',
      refFields: ['npcRef'],
      refKinds: npcRefKinds,
      handle: (slice, e, ctx) => {
        const day = selectNow(ctx.state).day;
        const npcId = String(e['npcRef']);
        const line = { npcId, kind: e['kind'] as (typeof PLAN_KINDS)[number], locationId: ctx.state.locations.currentId, day, success: e['success'] === true };
        // Stale lines go; what is left is at most a few days of tries.
        const plans = [...(slice.plans ?? []).filter((p) => day - p.day <= PLAN.days), line];
        return { slice: { ...slice, plans }, notes: [`plan against ${selectNpc(ctx.state, npcId)?.name ?? npcId}: ${PLAN.labels[line.kind].toLowerCase()} ${line.success ? 'laid' : 'not laid'}`] };
      },
    },
    /**
     * AI: someone steps in and engages a foe so the player can get away (D-496). The engine resolves their whole duel now
     * and keeps it hidden: nothing here says how it went. The player's next turn is the escape.
     */
    holdBegun: {
      schema: z.object({
        type: z.literal('holdBegun'),
        holderRef: z.string().describe('Who steps in'),
        foeRef: z.string().describe('Whom they hold off'),
      }),
      sources: ['ai', 'engine'],
      // After the rest of the reply, so someone who arrives in it can step in.
      phase: 'last',
      narrative: (s) => !s.combat.hold && s.combat.active?.session == null && (s.combat.active !== null || s.combat.pending !== null || s.pacing.scene.presentNpcIds.length > 0),
      part: 'people',
      refFields: ['holderRef', 'foeRef'],
      refKinds: npcRefKinds,
      targetField: 'holderRef',
      handle: (slice, e, ctx) => {
        const s = ctx.state;
        const holderId = String(e['holderRef']);
        const foeId = String(e['foeRef']);
        if (slice.hold) return { reject: 'a hold is already under way' };
        if (holderId === foeId) return { reject: 'nobody holds themselves off' };
        for (const id of [holderId, foeId]) {
          const n = selectNpc(s, id);
          if (!n || n.status !== 'active') return { reject: `${id} is not able to fight` };
          if (n.lastSeenDay !== selectNow(s).day || (n.lastLocationId !== null && n.lastLocationId !== s.locations.currentId)) return { reject: `${n.name} is not here` };
        }
        const active = slice.active;
        if (active?.session) return { reject: 'not in a sparring session' };
        const duel = active ? (active.duel as DuelState) : null;
        const inFight = duel?.opponents.find((o) => o.id === foeId) ?? null;
        if (inFight?.out) return { reject: `${inFight.name} is out of the fight` };
        if (duel?.opponents.some((o) => o.id === holderId)) return { reject: `${holderId} is on the other side` };
        const r = beginHold(s, holderId, foeId, inFight);
        const next: CombatSlice = { ...slice, hold: r.hold };
        const emit: GameEvent[] = r.generate.map((id) => ({ type: 'npcGenerated', npcRef: id }));
        const notes = [`${selectNpc(s, holderId)!.name} engages ${selectNpc(s, foeId)!.name}: the player character can get away (the hold is resolved and hidden until it is told)`];
        // The foe leaves the player's own fight; the last one to leave it ends it.
        if (active && duel && inFight) {
          const opponents = duel.opponents.map((o) => (o.id === foeId ? { ...o, engagedElsewhere: true } : o));
          if (opponents.some((o) => !o.out && !o.engagedElsewhere)) return { slice: { ...next, active: { ...active, duel: { ...duel, opponents } } }, emit, notes, rng: r.rng };
          const c = conclude(next, s, { ...active, duel: { ...duel, rng: r.rng, opponents } }, 'interrupted', `${selectNpc(s, holderId)!.name} steps in`);
          return { slice: c.slice, emit: [...emit, ...c.emit], notes: [...notes, ...c.notes], rng: c.rng };
        }
        // A fight with the foe still to begin does not.
        if (slice.pending?.opponentRefs.includes(foeId)) {
          const refs = slice.pending.opponentRefs.filter((x) => x !== foeId);
          next.pending = refs.length || slice.pending.minionGroups.length ? { ...slice.pending, opponentRefs: refs } : null;
        }
        return { slice: next, emit, notes, rng: r.rng };
      },
    },
    /** Engine (the hold turn): the hold has been played out against the escape; what follows the player, if anything. */
    holdTold: {
      schema: z.object({ type: z.literal('holdTold'), escaped: z.boolean(), pursuit: pursuitSchema.nullable() }),
      sources: ['engine'],
      handle: (slice, e) => {
        const p = e['pursuit'] as Pursuit | null;
        const rest = (slice.pursuits ?? []).filter((x) => x.foeId !== slice.hold?.foeId);
        return { slice: { ...slice, hold: null, pursuits: p ? [...rest, p] : rest }, notes: [`the escape: ${e['escaped'] ? 'got away' : 'overtaken'}`] };
      },
    },
    /** AI: an opponent turns to fight an ally, or back (D-143 E); engine-checked against the fight. */
    opponentEngagement: {
      schema: z.object({ type: z.literal('opponentEngagement'), opponentRef: z.string(), engagedElsewhere: z.boolean() }),
      sources: ['ai', 'engine'],
      narrative: (s) => s.combat.active !== null,
      part: 'fight',
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
      handle: (slice, e, ctx) => {
        const id = String(e['npcRef']);
        const entry = slice.fates.find((f) => f.npcId === id);
        if (!entry) return { reject: `no fate to choose for ${id}` };
        if (!fateIsLive(ctx.state, entry)) return { reject: `the moment to decide ${id}'s fate has passed` };
        const fate = e['fate'] as NpcFate;
        const emit: GameEvent[] = fate === 'kill' ? [{ type: 'npcDied', npcRef: id, cause: 'killed by the player at incapacitation' }] : [];
        // A captured canon figure leaves its canon course (D-419).
        if (fate === 'capture' && ctx.state.npcs.byId[id]?.canonId) emit.push({ type: 'npcCanonDiverged', npcRef: id, reason: 'captured' });
        // The act in plain words, for RESOLVED's fate line (pass 5 issue 13: Kill Duelist 8 was told as an escape from an
        // old captivity, with Jedi who were not there).
        const name = ctx.state.npcs.byId[id]?.name ?? id;
        const act = fate === 'kill' ? `kills ${name}` : fate === 'capture' ? `takes ${name} prisoner` : `spares ${name}`;
        return { slice: { ...slice, fates: slice.fates.filter((f) => f.npcId !== id) }, emit, notes: [`${id}: ${fate}`, `${FATE_ACT_NOTE}${act}`] };
      },
    },
  },
  /**
   * A fate choice that lapses (D-242; pass 3: the dying Jedi stayed "active, here now" two hours later with no word):
   * past FATE_CHOICE_EXPIRY, or once the player has left the place, the choice is gone and the player learns it. A
   * downed opponent is left where they fell; one left dying dies of the wounds (as "Spare (leave dying)" says).
   */
  onTimeAdvanced: (slice0, step, ctx) => {
    const followed = pursuitsAfter(slice0, step, ctx.state);
    const slice = followed.slice;
    if (!slice.fates.length || slice.active) return followed;
    const here = ctx.state.locations.currentId;
    const lapsed = slice.fates.filter((f) => f.atAbs !== undefined && (step.toAbs - f.atAbs > FATE_CHOICE_EXPIRY.seconds || (f.locationId ?? null) !== here));
    if (!lapsed.length) return followed;
    const emit: GameEvent[] = [...followed.emit];
    const notices: string[] = [...followed.notices];
    for (const f of lapsed) {
      const name = ctx.state.npcs.byId[f.npcId]?.name ?? f.npcId;
      if (f.dying) {
        emit.push({ type: 'npcDied', npcRef: f.npcId, cause: 'left dying after the fight' });
        notices.push(`${name} was left dying and did not survive.`);
      } else notices.push(`${name} was left where they fell.`);
    }
    return { slice: { ...slice, fates: slice.fates.filter((f) => !lapsed.includes(f)) }, emit, notices };
  },
  selectors: { combat: selectCombat, active: selectActiveFight },
};

/**
 * Those who follow the player (D-496): a pursuer behind a door comes through in their time, onto the player if they are
 * still in there and else onto the trail; a pursuer on the trail may find it again, each day for some days. Seeded.
 */
function pursuitsAfter(slice: CombatSlice, step: { toAbs: number; endsDay: boolean }, s: GameState): { slice: CombatSlice; emit: GameEvent[]; notices: string[] } {
  const list = slice.pursuits ?? [];
  if (!list.length) return { slice, emit: [], notices: [] };
  const emit: GameEvent[] = [];
  const notices: string[] = [];
  const within = (id: string | null): boolean => selectLocationChain(s, s.locations.currentId).some((l) => l.id === id);
  const day = Math.floor(step.toAbs / 86_400);
  const next: Pursuit[] = [];
  for (const p of list) {
    const foe = selectNpc(s, p.foeId);
    if (!foe || foe.status !== 'active') continue;
    if (p.kind === 'barred') {
      // A barred pursuer without a time comes through at once. Not `?? 0`: second 0 is year 1, so in a BBY campaign (negative
      // seconds) it would wait behind the door forever (m8-skills BBY timer sweep, D-513).
      if (step.toAbs < (p.untilAbs ?? -Infinity) || slice.active || slice.pending) next.push(p);
      else if (within(p.withinId)) {
        notices.push(`${foe.name} comes through the door.`);
        emit.push({ type: 'combatStarted', opponentRefs: [p.foeId], stakes: 'lethal', terrainTags: [] });
      } else next.push({ ...p, kind: 'trail', untilAbs: null, withinId: null });
      continue;
    }
    if (!step.endsDay) next.push(p);
    else if (day - p.day > TRAIL.days) continue;
    else if (nextFloat(seedRng(`${s.meta.campaignId}:trail:${p.foeId}:${day}`))[0] < trailChance(p.search, p.concealed, p.support)) notices.push(`${foe.name} has found the player character's trail again.`);
    else next.push(p);
  }
  return { slice: { ...slice, pursuits: next }, emit, notices };
}

/** The beat after a Force action or a sequence: noEffect (quiet, no exchange) when nothing was attempted (D-194). */
function beatFor(before: DuelState, after: DuelState, beat: 'forceAction' | 'sequence', lines: readonly string[]): [string, boolean] {
  // A feint or taunt rolls dice without an exchange record: it was attempted (D-199).
  const attempted = after.log.length !== before.log.length || lines.some((l) => /: (DONE|FAILED) \(/.test(l) && !/^step \d+ stance /.test(l) && !l.includes(`FAILED (${UNKNOWN_PREFIX}`));
  return attempted ? [beat, true] : ['noEffect', false];
}

/** The level of the form (or weapon skill) the player fights with now; 0 out of a fight. */
function fightingFormLevel(s: GameState): number {
  const duel = s.combat.active?.duel as DuelState | undefined;
  return duel ? selectLevelExact(s, duel.a.skillId) : 0;
}

/** The player's Force levels for actions and sequences (CI from progression). */
function forceProfile(s: GameState) {
  return {
    levelOf: (a: ForceActionKind) => selectLevelExact(s, FORCE_ACTION_ABILITY[a]),
    ciOf: (a: ForceActionKind) => selectCI(s, FORCE_ACTION_ABILITY[a]),
    forceOutput: selectLevelExact(s, 'forceOutput'),
    // Feints and taunts: d20 + Charisma, Intelligence or form level / 10 (rolls §5); the form is the one fought with now.
    trickLevel: Math.max(selectLevelExact(s, 'charisma'), selectLevelExact(s, 'intelligence'), fightingFormLevel(s)),
  };
}

const INTERRUPT_CAUSE_TEXT: Readonly<Record<InterruptCause, string>> = {
  npcEntered: 'someone entering the scene (npcIntroduced, or sceneUpdated adding them)',
  hazardOccurred: 'hazardOccurred',
  alarmRaised: 'alarmRaised',
};

/** Whether the reply so far applied one of the causes (D-196 amended). */
function interruptCauseSeen(ctx: ApplyCtx<GameState>, duel: DuelState, causes: readonly InterruptCause[]): boolean {
  const batch = ctx.batch ?? [];
  const fighters = new Set([duel.a.id, ...duel.opponents.map((o) => o.id)]);
  const before = new Set(ctx.batchStart?.pacing.scene.presentNpcIds ?? []);
  return batch.some(({ event }) => {
    if (event.type === 'hazardOccurred') return causes.includes('hazardOccurred');
    if (event.type === 'alarmRaised') return causes.includes('alarmRaised');
    if (!causes.includes('npcEntered')) return false;
    if (event.type === 'npcIntroduced') return true;
    if (event.type === 'sceneUpdated') return ((event['presentNpcRefs'] as string[] | undefined) ?? []).some((id) => !fighters.has(id) && !before.has(id));
    return false;
  });
}

export type { ExchangeRecord };
