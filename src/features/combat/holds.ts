// Holds in the campaign (Jared, 2026-11-25; D-496; docs-v2/spec/holds.md): reading the place and the people, resolving an
// NPC's hold when it begins (hidden), and the player's escape against it. Pure; the events that use these are in index.ts.
import { FATE_ROLL } from '../../data/combat.config';
import { orderHomelessAt } from '../../data/orderSeats';
import { HOLD_NEED, SITH_OF_TWO, type EscapeStep, type HoldSetting, type SearchSupport } from '../../data/holds';
import { namedForceBody } from '../../data/canon/sheetScale';
import { CANON_BY_ID } from '../../data/canonNpcs';
import { archetypeDef } from '../../data/archetypes';
import { FORM_IDS } from '../../data/skills';
import { dateFromAbsDay, toAbsSecond } from '../../engine/calendar';
import { abilityGap, boughtSeconds, chase, holdSetting, losePursuer, pastChance, planEscape, pursuerTier, runHoldDuel, searchSupport, standSeconds, type Ability, type ChaseResult, type LoseResult, type PlanResult, type Pursuer, type PursuerStrength, type Runner } from '../../engine/holds';
import { canonFactionAt, canonRoleAt } from '../../engine/canonRoster';
import type { DuelState, Fighter } from '../../engine/duel';
import { nextFloat, seedRng, type RngState } from '../../engine/rng';
import { npcPerformance } from '../../engine/species';
import { canBeat, duelTier } from '../../engine/who';
import { duelistBar } from '../../data/duelists';
import { RANK_BY_ID } from '../../data/rankMinimums';
import type { DuelTier } from '../../data/who';
import type { GameState } from '../../state/gameState';
import type { GameEvent } from '../../state/types';
import { selectPath } from '../character/selectors';
import { selectNow } from '../clock/selectors';
import { selectLocationChain } from '../locations/selectors';
import { selectNpc, selectNpcGen, selectNpcLevels } from '../npcs/selectors';
import { selectLevelExact, selectPerformance } from '../progression/selectors';
import { buildContext, buildNpcFighter } from './build';
import type { Hold, Pursuit } from './combat';

type Levels = Readonly<Record<string, number>>;

/** The setting of a recorded place, by default where the player is. */
export const selectHoldSetting = (s: GameState, locationId: string | null = s.locations.currentId): HoldSetting => holdSetting(selectLocationChain(s, locationId));

const combatOf = (l: Levels): number => Math.max(0, ...FORM_IDS.map((f) => l[f] ?? 0), l['melee'] ?? 0, l['blaster'] ?? 0);
export const npcAbility = (s: GameState, id: string): Ability => {
  const l = selectNpcLevels(s, id);
  return { combat: combatOf(l), forceControl: l['forceControl'] ?? 0, willpower: l['willpower'] ?? 0 };
};
const forceUserNpc = (s: GameState, id: string): boolean => archetypeDef(selectNpcGen(s, id)?.archetype ?? 'civilian').path !== 'career';
const barOf = (s: GameState, id: string) => duelistBar(selectNpc(s, id)?.canonId ?? null, dateFromAbsDay(s.clock.now.day).year);

/** An NPC's tier as a duelist: the same measure as the player's (D-489). */
export function selectNpcTier(s: GameState, id: string): DuelTier {
  const l = selectNpcLevels(s, id);
  const rank = selectNpcGen(s, id)?.rank ?? '';
  const meets = Object.entries(RANK_BY_ID.get('master')!.minimums).every(([key, min]) => (key === '$main' || key === '$highestForm' ? combatOf(l) : (l[key] ?? 0)) >= min);
  return duelTier({ forceUser: forceUserNpc(s, id), masterRank: rank === 'master', meetsMasterSkills: meets, ...npcAbility(s, id) });
}

const pursuerStrength = (s: GameState, id: string): PursuerStrength => ({ saber: forceUserNpc(s, id), tier: pursuerTier(barOf(s, id), selectNpcTier(s, id)) });

/** The gap a stand against this figure has to make up, for the player as they fight now; a non-Force planner by combat alone. */
export function playerHoldGap(s: GameState, foeId: string, combat: number): number {
  const foe = npcAbility(s, foeId);
  if (selectPath(s) === 'career') return Math.max(0, foe.combat - combat) + PLANNER_GAP;
  return abilityGap({ combat, forceControl: selectLevelExact(s, 'forceControl'), willpower: selectLevelExact(s, 'willpower') }, foe);
}
/** Without the Force even a planned stand is a Master's at best (invented). */
const PLANNER_GAP = 12;

const isApex = (s: GameState, id: string): boolean => {
  const t = pursuerTier(barOf(s, id), selectNpcTier(s, id));
  return t === 'apex' || t === 'beyond';
};

/**
 * What the player's own stand bought, when their fight with a top or apex duelist is over: the fight's clock until the
 * duelist had the way past them, by the same chance each exchange as an NPC's hold (seeded by the fight; D-497).
 */
export function playerHold(s: GameState, foeId: string, combat: number, fightId: string, exchanges: readonly number[]): { npcId: string; seconds: number; need: number; setting: HoldSetting; enough: boolean } {
  const setting = selectHoldSetting(s);
  const seconds = standSeconds(exchanges, pastChance(playerHoldGap(s, foeId, combat), isApex(s, foeId)), seedRng(`${s.meta.campaignId}:past:${fightId}:${foeId}`));
  return { npcId: foeId, seconds, need: HOLD_NEED[setting], setting, enough: seconds >= HOLD_NEED[setting] };
}

const healthOf = (f: Fighter): { vitalityLost: number; wounds: readonly unknown[]; lasting: readonly unknown[] } => ({ vitalityLost: Math.max(0, f.maxVitality - f.vitality), wounds: f.wounds, lasting: f.lasting });

/** An NPC engages a foe so the player can get away: the whole duel, now, kept hidden. `foeNow`: the foe as the player's fight has them. */
export function beginHold(s: GameState, holderId: string, foeId: string, foeNow: Fighter | null): { hold: Hold; rng: RngState; generate: string[] } {
  const holder = buildNpcFighter(s, holderId).fighter;
  const tier = selectNpcTier(s, holderId);
  const foe = { ...(foeNow ?? buildNpcFighter(s, foeId).fighter), engagedElsewhere: false, out: false, aboveBar: !canBeat(tier, barOf(s, foeId)) };
  const gap = abilityGap(npcAbility(s, holderId), npcAbility(s, foeId));
  const d = runHoldDuel({ ...holder, aim: null }, foe, buildContext(s, [], 'lethal', null), selectNow(s).day, s.meta.rngState, pastChance(gap, isApex(s, foeId)), gap);
  let rng = d.duel.rng;
  let fate: Hold['holder'] = 'standing';
  if (d.end === 'fell') {
    if (d.holderDies) fate = 'dead';
    else {
      // Down but alive: the foe's choice, as with a beaten player (D-154).
      const a = selectNpcGen(s, foeId)?.archetype ?? 'other';
      const table = FATE_ROLL[a.startsWith('sith') ? 'sith' : a.startsWith('jedi') ? 'jedi' : a === 'soldier' || a === 'mandalorian' ? 'military' : a === 'smuggler' || a === 'bountyHunter' ? 'underworld' : 'other'].lethal;
      let u: number;
      [u, rng] = nextFloat(rng);
      fate = u < table[0] ? 'dead' : u < table[0] + table[1] ? 'captured' : 'left';
    }
  }
  const foeAfter = d.duel.opponents[0]!;
  return {
    hold: { holderId, foeId, atAbs: toAbsSecond(s.clock.now), locationId: s.locations.currentId, setting: selectHoldSetting(s), gap: Math.round(gap * 10) / 10, exchanges: d.exchanges, seconds: d.seconds, end: d.end, holder: fate, hits: d.hits, health: { holder: healthOf(d.duel.a), foe: healthOf(foeAfter) }, foeDead: foeAfter.dead },
    rng,
    generate: [holderId, foeId].filter((id) => !selectNpc(s, id)!.gen),
  };
}

const playerRunner = (s: GameState): Runner => ({
  forceSpeed: selectLevelExact(s, 'forceSpeed'),
  endurance: selectPerformance(s, 'endurance'),
  concealment: selectConcealment(s),
  slip: Math.max(selectPerformance(s, 'stealth'), selectPerformance(s, 'agility')),
});

/** Below this much Stealth nobody has learned to hide their presence (invented). */
const CONCEAL_MIN_STEALTH = 20;
/**
 * Hiding in the Force: until Concealment is a skill of its own (M6), the mean of Stealth and Force Control for a Force user
 * who has learned to go unseen (invented).
 */
export function selectConcealment(s: GameState): number {
  const stealth = selectLevelExact(s, 'stealth');
  return selectPath(s) === 'career' || stealth < CONCEAL_MIN_STEALTH ? 0 : (stealth + selectLevelExact(s, 'forceControl')) / 2;
}

export function npcPursuer(s: GameState, id: string): Pursuer {
  const l = selectNpcLevels(s, id);
  const canon = selectNpc(s, id)?.canonId ? CANON_BY_ID.get(selectNpc(s, id)!.canonId!) : undefined;
  const body = canon ? namedForceBody(canon) : 0;
  return { forceSpeed: Math.max(l['forceSpeed'] ?? 0, body), endurance: npcPerformance(l, 'endurance', body), forceSense: l['forceSense'] ?? 0, search: Math.max(l['tracking'] ?? 0, l['forceSense'] ?? 0) };
}

/**
 * What a pursuer can call on (D-497): a canon figure by the faction and role the lore gives it at the date, unless the
 * campaign has cut it off (turned, captured, removed from its post); anyone else by their record.
 */
export function npcSupport(s: GameState, id: string): SearchSupport {
  const n = selectNpc(s, id)!;
  const canon = n.canonId ? CANON_BY_ID.get(n.canonId) : undefined;
  const year = dateFromAbsDay(s.clock.now.day).year;
  const faction = canon ? canonFactionAt(canon, -year) : n.factionId;
  const scattered = faction === 'sith' ? year >= SITH_OF_TWO.fromYear && year < SITH_OF_TWO.toYear : orderHomelessAt(year);
  return searchSupport({ faction, role: canon ? canonRoleAt(canon, -year) : n.role, cutOff: n.canonDiverged !== undefined, scattered });
}

export interface HoldTurn {
  /** Where, who, and the duel's result in words for the narrator. */
  holder: string;
  foe: string;
  setting: HoldSetting;
  exchanges: number;
  /** Seconds bought; null when the foe never got past. */
  bought: number | null;
  end: Hold['end'];
  holderFate: Hold['holder'];
  hits: readonly string[];
  plan: PlanResult;
  chase: ChaseResult | null;
  lose: Pick<LoseResult, 'lost' | 'runner' | 'pursuer'> | null;
  escaped: boolean;
  /** The player feels the holder die. */
  felt: boolean;
  /** Seconds the foe needs to get through the closed door. */
  door: number | null;
  seconds: number;
  events: readonly GameEvent[];
  rng: RngState;
}

/** The player's escape against the hidden hold: what they said they do, against the time there was. */
export function resolveHoldTurn(s: GameState, hold: Hold, stated: readonly EscapeStep[]): HoldTurn {
  const holder = selectNpc(s, hold.holderId);
  const foe = selectNpc(s, hold.foeId);
  const bought = boughtSeconds(hold);
  const strength = pursuerStrength(s, hold.foeId);
  const plan = planEscape(stated, hold.setting, bought, strength);
  const runner = playerRunner(s);
  const pursuer = npcPursuer(s, hold.foeId);
  let rng = s.meta.rngState;
  let run: ChaseResult | null = null;
  let lose: LoseResult | null = null;
  // Nobody follows when the foe never got past the holder.
  const followed = bought !== null;
  let escaped = !followed || plan.end === 'away' || plan.end === 'clear';
  const hidden = plan.conceal && runner.concealment > 0;
  if (followed && (plan.end === 'chase' || plan.end === 'hidden')) {
    if (plan.end === 'chase') run = chase(runner, pursuer, plan.lead!, hold.setting, { evasive: plan.evasive, conceal: plan.conceal });
    if (!run || run.end === 'clear') {
      lose = losePursuer(runner, pursuer, { evasive: plan.evasive || plan.end === 'hidden', concealed: hidden, cover: plan.end === 'hidden', ran: run?.ran ?? 0 }, rng);
      rng = lose.rng;
      escaped = lose.lost;
    }
  }
  const door = followed && plan.end === 'clear' ? Math.round(plan.lead ?? 0) : null;
  const seconds = Math.max(10, Math.round(Math.max(plan.used, Math.min(bought ?? plan.used, 600)) + (run?.seconds ?? 0)));
  const day = selectNow(s).day;
  const chain = selectLocationChain(s, hold.locationId);
  const within = chain.find((l) => l.kind !== 'room') ?? chain[0];
  const pursuit: Pursuit | null = !followed || plan.end === 'away' || !escaped ? null : { foeId: hold.foeId, kind: door !== null ? 'barred' : 'trail', untilAbs: door !== null ? toAbsSecond(s.clock.now) + seconds + door : null, withinId: within?.id ?? null, day, search: pursuer.search, concealed: hidden, support: npcSupport(s, hold.foeId) };
  const events: GameEvent[] = [
    { type: 'npcHealthSynced', npcRef: hold.holderId, health: hold.health.holder },
    { type: 'npcHealthSynced', npcRef: hold.foeId, health: hold.health.foe },
    ...(hold.holder === 'dead' ? [{ type: 'npcDied', npcRef: hold.holderId, cause: `fell holding ${foe?.name ?? 'the foe'} off` }] : []),
    ...(hold.holder === 'captured' && holder?.canonId ? [{ type: 'npcCanonDiverged', npcRef: hold.holderId, reason: 'captured' }] : []),
    ...(hold.foeDead ? [{ type: 'npcDied', npcRef: hold.foeId, cause: `killed by ${holder?.name ?? 'the holder'}` }] : []),
    { type: 'holdTold', escaped, pursuit },
    // Overtaken: the foe is on the player, and the fight begins next (D-29).
    ...(escaped || !followed ? [] : [{ type: 'combatStarted', opponentRefs: [hold.foeId], stakes: 'lethal', terrainTags: [] }]),
  ];
  return {
    holder: holder?.name ?? hold.holderId,
    foe: foe?.name ?? hold.foeId,
    setting: hold.setting,
    exchanges: hold.exchanges,
    bought,
    end: hold.end,
    holderFate: hold.holder,
    hits: hold.hits,
    plan,
    chase: run,
    lose: lose ? { lost: lose.lost, runner: lose.runner, pursuer: lose.pursuer } : null,
    escaped,
    felt: hold.holder === 'dead' && selectPath(s) !== 'career' && forceUserNpc(s, hold.holderId),
    door,
    seconds,
    events,
    rng,
  };
}


export type { DuelState };
