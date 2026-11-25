// Holds against a duelist and getting away (Jared, 2026-11-25; D-496; docs-v2/spec/holds.md). Pure.
//  - A hold is the fight's own clock (5-10 s an exchange, D-497) until the holder is beaten or the duelist gets past them
//    (pastChance, by how close the two are).
//  - The setting comes from the recorded location (holdSetting); an escape is a plan whose steps cost time (planEscape).
//  - On foot the chase is played out second by second (chase), and losing the pursuer is a contest (losePursuer).
import type { DuelistBar } from '../data/duelists';
import type { LocationKind } from '../data/entities.config';
import { APEX_GAP, BARRIER_SECONDS, CONSOLE_SHARE, EXCHANGE_MEAN_SECONDS, HANGAR_WORDS, HOLD_MAX_EXCHANGES, INDOOR_KINDS, LONE_ROLES, LOSE_PURSUER, NO_SABER_MULT, ORDER_FACTIONS, ORGANISATION_FACTIONS, PAST_BLOW, PAST_CHANCE, PURSUIT, RIP_SHARE, SEARCH_SUPPORT, SERVICE_FACTIONS, SERVICE_ROLES, STEP_NEEDS, STEP_SECONDS, STEP_SETTINGS, STREET_KINDS, TRAIL, VESSEL_KINDS, type EscapeStep, type HoldSetting, type SearchSupport } from '../data/holds';
import type { DuelTier } from '../data/who';
import { damageFighter, hitText, qualityOf, runUntilBeat, settleEnd, startDuel, type DuelContext, type DuelState, type Fighter } from './duel';
import { interp } from './interp';
import { basicRoll } from './rolls';
import { nextFloat, type RngState } from './rng';
import { isDying, type Wound } from './wounds';

/** What a hold compares: the strongest fighting skill, Force Control and Willpower (the tiers' own measure). */
export interface Ability {
  combat: number;
  forceControl: number;
  willpower: number;
}

/** How far the duelist's ability is above the holder's; negative when the holder is the better. */
export const abilityGap = (holder: Ability, foe: Ability): number => (foe.combat - holder.combat + foe.forceControl - holder.forceControl + foe.willpower - holder.willpower) / 3;

/** The chance in one exchange that the duelist gets past. `apex`: an apex duelist, or one beyond. */
export const pastChance = (gap: number, apex: boolean): number => interp(PAST_CHANCE, gap > 0 && apex ? gap * APEX_GAP : gap);

/** A stand already fought: the clock of each exchange until the duelist has the way past (all of it, if they never do). */
export function standSeconds(exchanges: readonly number[], past: number, rng: RngState): number {
  let t = 0;
  for (const secs of exchanges) {
    t += secs;
    const [u, r] = nextFloat(rng);
    rng = r;
    if (u < past) return t;
  }
  return t;
}

/** The setting of a place: the recorded location, nearest first, with what it is in. */
export function holdSetting(chain: readonly { kind: LocationKind; name: string; aliases: readonly string[] }[]): HoldSetting {
  const here = chain[0];
  if (!here) return 'open';
  if ([here.name, ...here.aliases].some((n) => HANGAR_WORDS.test(n))) return 'hangar';
  // Indoors: aboard, when what holds the room is a ship or a station before it is anything else.
  if (VESSEL_KINDS.includes(here.kind)) return 'interior';
  if (INDOOR_KINDS.includes(here.kind)) {
    const holds = chain.find((l) => !INDOOR_KINDS.includes(l.kind));
    return holds && VESSEL_KINDS.includes(holds.kind) ? 'interior' : 'building';
  }
  return STREET_KINDS.includes(here.kind) ? 'street' : 'open';
}

// ---- the duel of an NPC's hold ----

export interface HoldDuel {
  /** Exchanges the holder lasted, and the fight's clock for them. */
  exchanges: number;
  seconds: number;
  /**
   * fell: beaten, and the duelist is past them. past: struck aside and on their feet. slipped: above the holder's bar and pressed, the duelist broke away from them and is past
   * them (a Master only buys time). drivenOff: the duelist withdrew. foeDown: beaten. stalemate: held to the end.
   */
  end: 'fell' | 'past' | 'slipped' | 'drivenOff' | 'foeDown' | 'stalemate';
  holderDies: boolean;
  /** Each hit in order, in the log's words. */
  hits: string[];
  duel: DuelState;
}

/**
 * The whole duel at once, with the fight's own rules and dice, until it ends or the duelist gets past: that is a blow, and
 * whether the holder is still up after it is the wound's to say.
 */
export function runHoldDuel(holder: Fighter, foe: Fighter, ctx: DuelContext, day: number, rng: RngState, past: number, gap: number): HoldDuel {
  let s = startDuel(holder, [foe], rng);
  let through = false;
  let blow: string | null = null;
  while (!s.end && !through && s.exchange < HOLD_MAX_EXCHANGES) {
    const at = s.exchange;
    s = runUntilBeat(s, ctx, day, 'toEnd', 1).state;
    if (s.end || s.exchange === at) break;
    const [u, r] = nextFloat(s.rng);
    s = { ...s, rng: r };
    through = u < past;
    if (!through) continue;
    const [v, r2] = nextFloat(s.rng);
    const margin = Math.round(PAST_BLOW.least + v * PAST_BLOW.die + Math.max(0, gap) * PAST_BLOW.perGap);
    const by = s.opponents[0]!;
    const d = damageFighter(s.a, qualityOf(margin)!, margin, by.weapon, ctx, r2, day, s.a.wounds.length + 1, false, null, 'kill');
    blow = `#${s.exchange} ${by.name} ${hitText(d.hit, holder.name)}`;
    s = settleEnd({ ...s, a: d.f, rng: d.rng });
  }
  const after = s.opponents[0]!;
  const end = s.end?.winner === 'B' ? 'fell' : s.end?.winner === 'A' ? (after.yielded === 'withdrew' || after.yielded === 'fled' ? 'drivenOff' : 'foeDown') : s.end?.reason === 'brokeOff' ? 'slipped' : through ? 'past' : 'stalemate';
  const hits = s.log.filter((r) => r.hit && !r.hit.avoided).map((r) => `#${r.n} ${r.hit!.by === 'A' ? `${holder.name} ${hitText(r.hit!, foe.name)}` : `${foe.name} ${hitText(r.hit!, holder.name)}`}`);
  if (blow) hits.push(blow);
  return { exchanges: s.exchange, seconds: s.seconds, end, holderDies: end === 'fell' && (s.a.dead || isDying(s.a.wounds as Wound[])), hits, duel: s };
}

/** The time a hold bought; null = no limit (the duelist withdrew, was beaten or was held to the end). */
export const boughtSeconds = (d: Pick<HoldDuel, 'exchanges' | 'end'> & { seconds?: number | undefined }): number | null => (d.end === 'fell' || d.end === 'past' || d.end === 'slipped' ? (d.seconds ?? d.exchanges * EXCHANGE_MEAN_SECONDS) : null);

// ---- barriers ----

export interface PursuerStrength {
  saber: boolean;
  /** Their standing as a duelist, or their tier when they are on no list. */
  tier: DuelTier | 'beyond';
}
export const pursuerTier = (bar: DuelistBar | null, tier: DuelTier): PursuerStrength['tier'] => (bar === null ? tier : bar);

/** Seconds a closed door keeps a pursuer. */
export function barrierSeconds(setting: HoldSetting, foe: PursuerStrength): number {
  const base = setting === 'interior' || setting === 'hangar' || setting === 'building' ? BARRIER_SECONDS[setting] : 0;
  return base * (RIP_SHARE[foe.tier] < 1 ? RIP_SHARE[foe.tier] : foe.saber ? 1 : NO_SABER_MULT);
}

// ---- the plan ----

export interface StepResult {
  step: EscapeStep;
  seconds: number;
  /** done; late: the time ran out; notHere: the place has no such thing. */
  result: 'done' | 'late' | 'notHere';
}

export interface PlanResult {
  steps: StepResult[];
  /** away: gone in a ship or a vehicle. clear: behind a closed door. hidden: in cover. chase: on foot. caught: no time at all. */
  end: 'away' | 'clear' | 'hidden' | 'chase' | 'caught';
  /** Seconds used, and the head start left when the pursuer is free to follow (null: they are not). */
  used: number;
  lead: number | null;
  evasive: boolean;
  conceal: boolean;
}

/** A stated plan against the time there actually is. A step the plan leaves out but needs is done on the way. */
export function planEscape(stated: readonly EscapeStep[], setting: HoldSetting, bought: number | null, foe: PursuerStrength): PlanResult {
  const steps: StepResult[] = [];
  let t = 0;
  let have = bought ?? Infinity;
  const done = (x: EscapeStep): boolean => steps.some((s) => s.step === x && s.result === 'done');
  const queue: EscapeStep[] = [];
  const want = (x: EscapeStep): void => {
    const first = STEP_NEEDS[x];
    if (first && !queue.includes(first)) want(first);
    if (!queue.includes(x)) queue.push(x);
  };
  for (const x of stated) want(x);
  const moving = queue.filter((x) => STEP_SECONDS[x] > 0);
  for (const x of moving) {
    if (STEP_SETTINGS[x] && !STEP_SETTINGS[x]!.includes(setting)) {
      steps.push({ step: x, seconds: 0, result: 'notHere' });
      continue;
    }
    const cost = STEP_SECONDS[x];
    if (t + cost > have) {
      steps.push({ step: x, seconds: cost, result: 'late' });
      break;
    }
    t += cost;
    steps.push({ step: x, seconds: cost, result: 'done' });
    // A door between them and the pursuer gives time back, and more with its console gone.
    if (x === 'sealDoor') have += barrierSeconds(setting, foe);
    if (x === 'wreckConsole') have += barrierSeconds(setting, foe) * CONSOLE_SHARE;
  }
  for (const x of queue) if (STEP_SECONDS[x] === 0) steps.push({ step: x, seconds: 0, result: 'done' });
  const lead = Number.isFinite(have) ? Math.max(0, have - t) : null;
  const ran = queue.length > 0 && queue.some((x) => steps.some((s) => s.step === x && s.result !== 'notHere'));
  // Caught in the middle of something that stopped them: at a ship that had not started, a vehicle not yet moving.
  const stopped = steps.some((s) => s.result === 'late' && (s.step === 'startShip' || s.step === 'vehicle'));
  const end = done('startShip') || done('vehicle') ? 'away' : stopped ? 'caught' : done('sealDoor') ? 'clear' : done('cover') ? 'hidden' : lead === null ? (ran ? 'chase' : 'caught') : ran && lead > 0 ? 'chase' : 'caught';
  return { steps, end, used: t, lead, evasive: done('evasive'), conceal: done('conceal') };
}

// ---- on foot ----

export interface Mover {
  /** Force Speed (0 without the Force). */
  forceSpeed: number;
  endurance: number;
}
export interface Runner extends Mover {
  /** Hiding in the Force; 0 when they cannot. */
  concealment: number;
  /** The best of Stealth and Agility. */
  slip: number;
}
export interface Pursuer extends Mover {
  forceSense: number;
  /** The best of Tracking and Force Sense. */
  search: number;
}

export const runPace = (m: Mover): number => PURSUIT.base * (1 + PURSUIT.perForceSpeed * Math.max(0, m.forceSpeed));
export const runSustain = (m: Mover): number => PURSUIT.sustain + PURSUIT.sustainPerForceSpeed * Math.max(0, m.forceSpeed) + PURSUIT.sustainPerEndurance * Math.max(0, m.endurance);

/** How far the pursuer senses the runner. */
export const senseRange = (forceSense: number, concealment: number): number => {
  if (forceSense <= 0) return 0;
  return PURSUIT.sensePerLevel * forceSense * (forceSense / (forceSense + PURSUIT.concealWeight * Math.max(0, concealment)));
};

export interface ChaseResult {
  end: 'caught' | 'clear';
  /** Seconds after the pursuer set out. */
  seconds: number;
  /** Metres between them at the end, and how far the runner had come. */
  gap: number;
  ran: number;
  /** The runner was hidden in the Force when they got clear. */
  concealed: boolean;
}

/**
 * A chase on foot. The runner has `lead` seconds (they have been running all that time). Clear: out of sight and out of
 * the pursuer's senses on an evasive route. A pursuer with both the greater pace and the greater stamina follows any
 * route: only a runner hidden in the Force gets clear of one.
 */
export function chase(runner: Runner, foe: Pursuer, lead: number, setting: HoldSetting, how: { evasive: boolean; conceal: boolean }): ChaseResult {
  const hidden = how.conceal && runner.concealment > 0;
  const pace = runPace(runner) * (hidden ? PURSUIT.concealSpeed : 1);
  const sustain = runSustain(runner) * (hidden ? PURSUIT.concealSustain : 1);
  const at = (t: number): number => Math.min(t, sustain) * pace + Math.max(0, t - sustain) * Math.min(pace, PURSUIT.base);
  const foePace = runPace(foe);
  const foeSustain = runSustain(foe);
  const foeAt = (t: number): number => Math.min(t, foeSustain) * foePace + Math.max(0, t - foeSustain) * Math.min(foePace, PURSUIT.base);
  const runsDown = foePace > pace && foeSustain > sustain;
  const breaks = Math.max(PURSUIT.sight[setting] * (how.evasive ? 1 : PURSUIT.straightMult), senseRange(foe.forceSense, hidden ? runner.concealment : 0));
  for (let t = 0; t <= PURSUIT.maxSeconds; t++) {
    const ran = at(lead + t);
    const gap = ran - foeAt(t);
    if (gap <= 0) return { end: 'caught', seconds: t, gap: 0, ran, concealed: hidden };
    if (gap > breaks && (!runsDown || hidden)) return { end: 'clear', seconds: t, gap, ran, concealed: hidden };
    // Both spent, at the same trot: the gap holds, and the one behind can still see.
    if (t > foeSustain && lead + t > sustain) return { end: gap > breaks ? 'clear' : 'caught', seconds: t, gap, ran, concealed: hidden };
  }
  return { end: 'caught', seconds: PURSUIT.maxSeconds, gap: 0, ran: at(lead + PURSUIT.maxSeconds), concealed: hidden };
}

export interface LoseResult {
  lost: boolean;
  runner: number;
  pursuer: number;
  rng: RngState;
}

/** Once clear, whether the pursuer loses them: a contest the pursuer wins on a tie. */
export function losePursuer(runner: Runner, foe: Pursuer, x: { evasive: boolean; concealed: boolean; cover: boolean; ran: number }, rng: RngState): LoseResult {
  const ground = Math.min(LOSE_PURSUER.groundMost, x.ran / LOSE_PURSUER.perMetres);
  const mods = [
    { source: x.evasive ? 'an evasive route' : 'a straight route', value: x.evasive ? LOSE_PURSUER.evasive : LOSE_PURSUER.straight },
    { source: 'the ground to search', value: ground },
    ...(x.cover ? [{ source: 'cover', value: LOSE_PURSUER.cover }] : []),
    ...(x.concealed ? [{ source: 'hidden in the Force', value: LOSE_PURSUER.concealed }] : []),
  ];
  const [a, r1] = basicRoll(rng, runner.slip, mods);
  const [b, r2] = basicRoll(r1, foe.search, []);
  return { lost: a.total > b.total, runner: a.total, pursuer: b.total, rng: r2 };
}

/** The chance the pursuer finds the trail again on one day, by what they can call on. */
export const trailChance = (search: number, concealed: boolean, support: SearchSupport = 'service'): number => (TRAIL.perDay + TRAIL.perLevel * Math.max(0, search)) * (concealed ? TRAIL.concealed : 1) * SEARCH_SUPPORT[support];

/** What a pursuer can call on, from their faction, their role, whether they have been cut off from it, and whether their Order is scattered. */
export function searchSupport(x: { faction: string; role: string; cutOff: boolean; scattered: boolean }): SearchSupport {
  if (x.cutOff || LONE_ROLES.includes(x.role)) return 'lone';
  if (SERVICE_FACTIONS.includes(x.faction)) return SERVICE_ROLES.includes(x.role) ? 'service' : 'organisation';
  if (ORDER_FACTIONS.includes(x.faction)) return x.scattered ? 'lone' : 'order';
  return ORGANISATION_FACTIONS.includes(x.faction) ? 'organisation' : 'lone';
}
