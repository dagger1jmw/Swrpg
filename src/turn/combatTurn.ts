// Combat in the turn (architecture §4 step b; D-145, D-146): the combat action a turn resolves, and the draft the
// narration and the UI read. Pure.
import { QUIET_LINES, QUIET_LINES_RANGED, fillLine, type LineSide } from '../data/combatLines';
import { RANGED_WEAPONS } from '../data/weapons';
import type { WeaponKind } from '../data/health.config';
import { isNarratedBeat, type BeatReason } from '../data/combat.config';
import type { Intent } from '../ai/schemas/intent';
import type { ForceActionKind } from '../engine/combatForce';
import { partText, type DuelState, type ExchangeRecord } from '../engine/duel';
import { isDying, isIncapacitated, statusLabel, type Wound } from '../engine/wounds';
import { lastingState, type LastingInjury } from '../engine/lasting';
import type { ActiveFight, FightSummary } from '../features/combat/selectors';
import type { GameState } from '../state/gameState';
import type { CombatActionInput } from './record';
import { COMBAT_WORD_GROUPS, FORCE_CLAUSE_WORDS, FORCE_GESTURE, FORM_WORDS, OBJECT_WORDS, SPEECH_WORDS, STRIKE_WORDS } from '../data/combatWords';

/**
 * Natural combat words (D-179): the typed text (or a choice's label) read against the configured word groups and form
 * names. Returns a posture action (stance, a take-position attempt, the form named: the handler switches or stays) or null when
 * nothing matches. Whole words and phrases; the earliest stance word wins.
 */
export function combatWordsAction(text: string): Record<string, unknown> | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ')} `;
  const at = (phrase: string): number => {
    const i = t.indexOf(` ${phrase} `);
    return i < 0 ? Infinity : i;
  };
  let stance: { value: string; at: number } | null = null;
  let takePosition = false;
  let matched = false;
  for (const g of COMBAT_WORD_GROUPS) {
    const first = Math.min(...g.words.map(at));
    if (first === Infinity) continue;
    matched = true;
    if (g.takePosition) takePosition = true;
    if (g.stance && (!stance || first < stance.at)) stance = { value: g.stance, at: first };
  }
  let form: { id: string; at: number } | null = null;
  for (const [phrase, id] of Object.entries(FORM_WORDS)) {
    const i = at(phrase);
    if (i !== Infinity && (!form || i < form.at)) form = { id, at: i };
  }
  if (!matched && !form) return null;
  return { action: 'posture', ...(stance ? { stance: stance.value } : {}), ...(takePosition ? { position: true } : {}), ...(form ? { form: form.id } : {}) };
}

type StepLike = { kind: string; action?: string } & Record<string, unknown>;

/** The text as clauses in order (split on then, commas, semicolons, full stops and "and"), lower case. */
export function clausesOf(text: string): string[] {
  const t = text.toLowerCase().replace(/[^a-z0-9' -]+/g, (m) => (/[,;.!?]/.test(m) ? ' | ' : ' '));
  return t
    .split(/\||\bthen\b|\band\b|\bbefore\b|\bafter that\b/)
    .map((c) => ` ${c.replace(/\s+/g, ' ').trim()} `)
    .filter((c) => c.trim().length > 0);
}
const has = (clause: string, phrase: string): boolean => clause.includes(` ${phrase} `);
/** A clause with its Force gestures taken out ("i thrust out my hand" -> "i "): a gesture is never a strike (D-210). */
const withoutGestures = (clause: string): string => clause.replace(FORCE_GESTURE, ' ').replace(/\s+/g, ' ');

/** Defend and evade words: a clause with one is not an attack ("I parry his strike"). */
const DEFENSIVE = COMBAT_WORD_GROUPS.filter((g) => g.id === 'defend' || g.id === 'evade').flatMap((g) => g.words);
/** Words before an attack word that make it a noun ("his strike", "the blow"). */
const NOUN_BEFORE = ['his', 'her', 'their', 'its', 'the', 'a', 'an', 'incoming', 'every', 'each'];
/** An attack clause: an attack verb used as a verb, and no defend or evade word. */
export function isStrikeClause(clause: string): boolean {
  const c = withoutGestures(clause);
  if (DEFENSIVE.some((w) => has(c, w))) return false;
  return STRIKE_WORDS.some((w) => has(c, w) && !NOUN_BEFORE.some((n) => has(c, `${n} ${w}`)));
}

/** True when the typed text is the player talking (quoted speech or a speech verb), D-216. */
export function saysSpeech(text: string): boolean {
  if (/["\u201c\u201d]/.test(text)) return true;
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9' -]+/g, ' ').replace(/\s+/g, ' ')} `;
  return SPEECH_WORDS.some((w) => t.includes(` ${w} `));
}

/** The terrain tag of an object a clause names ("a heavy rock" -> looseRock), or null (D-216). */
export function objectIn(clause: string): string | null {
  for (const [tag, words] of Object.entries(OBJECT_WORDS)) if (words.some((w) => has(clause, w))) return tag;
  return null;
}

/** The Force step action a clause names, or null. */
export function forceActionIn(raw: string): string | null {
  const clause = withoutGestures(raw);
  for (const [action, words] of Object.entries(FORCE_CLAUSE_WORDS)) if (words.some((w) => has(clause, w))) return action;
  return null;
}

/**
 * Attack verbs are strike steps (D-191). The player's text read clause by clause: each clause with an attack verb and no
 * Force action is one strike, in the player's order. When the intent's steps have fewer strikes than the text, the
 * missing strikes are inserted where the text puts them (the intent call sometimes folds "driving heavy strikes" into
 * the aggressive stance). A Force action the text names that the intent left out is added the same way. Returns the
 * steps unchanged when nothing is missing; at most `max` steps.
 */
export function reconcileSteps(text: string, steps: readonly StepLike[], max: number): StepLike[] {
  const raw = clausesOf(text).map((c) => ({ force: forceActionIn(c), strike: isStrikeClause(c), object: objectIn(c) }));
  // "lift a heavy rock with the Force and hurl it": the object is named in the clause before the throw (D-216).
  const clauses = raw.map((c, k) => (c.force === 'throw' && !c.object && k > 0 && !raw[k - 1]!.force ? { ...c, object: raw[k - 1]!.object } : c));
  const wantStrikes = clauses.filter((c) => c.strike && !c.force).length;
  const haveStrikes = steps.filter((x) => x.kind === 'strike').length;
  const wantForce = clauses.filter((c) => c.force).length;
  const haveForce = steps.filter((x) => x.kind === 'forceAction').length;
  // The objects named for throws reach steps the intent made without one (D-216).
  const objects = clauses.filter((c) => c.force === 'throw' && c.object).map((c) => c.object!);
  if (wantStrikes <= haveStrikes && wantForce <= haveForce) {
    let k = 0;
    return steps.map((x) => (x.kind === 'forceAction' && x.action === 'throw' && !x['objectTag'] && objects[k] ? { ...x, objectTag: objects[k++] } : x));
  }
  const out: StepLike[] = [];
  const queue = [...steps];
  const takeUntil = (pred: (x: StepLike) => boolean): StepLike | null => {
    const i = queue.findIndex(pred);
    if (i < 0) {
      // Nothing to match: the intent's leading stances, tactics and maneuvers keep their place before the inserted step.
      while (queue[0] && queue[0].kind !== 'forceAction' && queue[0].kind !== 'strike') out.push(queue.shift()!);
      return null;
    }
    out.push(...queue.splice(0, i)); // steps the intent put before it (stances, maneuvers) keep their place
    return queue.shift()!;
  };
  for (const c of clauses) {
    if (c.force) {
      const f = takeUntil((x) => x.kind === 'forceAction');
      const named = c.force === 'throw' ? c.object : null;
      // A throw keeps the object the player named (D-216), unless the intent named one.
      out.push(f ? (named && f.action === 'throw' && !f['objectTag'] ? { ...f, objectTag: named } : f) : { kind: 'forceAction', action: c.force, ...(named ? { objectTag: named } : {}) });
    } else if (c.strike) {
      const st = takeUntil((x) => x.kind === 'strike');
      out.push(st ?? { kind: 'strike' });
    }
  }
  out.push(...queue);
  return out.slice(0, max);
}

/**
 * The opponent the typed text aims at (D-212): a full name ("Duelist 2", "B1 battle droid 3"), else the kind noun of an
 * opponent who faces the player ("the nearest droid"), preferring a noun inside an attack clause, then the last one
 * named before it. Opponents fighting an ally or out are never picked. Null when the text names none.
 */
export function targetFromText(text: string, opponents: readonly { id: string; name: string; out: boolean; engagedElsewhere: boolean; minion: boolean }[]): string | null {
  const live = opponents.filter((o) => !o.out && !o.engagedElsewhere);
  const nounsOf = (o: (typeof live)[number]): string[] => {
    const words = o.name.toLowerCase().replace(/\s+\d+$/, '').split(/\s+/);
    return o.minion ? [words[words.length - 1]!] : words.filter((w) => w.length >= 4);
  };
  const clauses = clausesOf(text);
  const firstStrike = clauses.findIndex((c) => isStrikeClause(c) || forceActionIn(c) !== null);
  // A full name ("B1 battle droid 4") outranks a bare noun ("droid") in the same clause.
  const mentions: { id: string; clause: number; at: number; full: boolean }[] = [];
  clauses.forEach((c, k) => {
    for (const o of live) {
      const f = c.indexOf(` ${o.name.toLowerCase()} `);
      if (f >= 0) mentions.push({ id: o.id, clause: k, at: k * 1000 + f, full: true });
      for (const n of nounsOf(o)) {
        const i = Math.max(c.indexOf(` ${n} `), c.indexOf(` ${n}s `));
        if (i >= 0) mentions.push({ id: o.id, clause: k, at: k * 1000 + i, full: false });
      }
    }
  });
  if (!mentions.length) return null;
  const pick = (ms: typeof mentions): string | null => {
    if (!ms.length) return null;
    const clause = ms[0]!.clause;
    const same = ms.filter((m) => m.clause === clause);
    return (same.find((m) => m.full) ?? same[0]!).id;
  };
  const inStrike = pick(mentions.filter((m) => m.clause === firstStrike));
  if (inStrike) return inStrike;
  const before = mentions.filter((m) => firstStrike < 0 || m.clause < firstStrike).sort((a, b) => b.at - a.at);
  return pick(before) ?? pick(mentions)!;
}

/** The combat payload with the text's attack verbs and Force actions made sure of (D-191). */
export function reconcileCombatPayload(text: string | undefined, payload: Record<string, unknown>, max: number): Record<string, unknown> {
  if (!text) return payload;
  const a = payload['action'];
  let steps: StepLike[];
  if (a === 'sequence') steps = (payload['steps'] as StepLike[]) ?? [];
  else if (a === 'force') {
    const f = payload['force'] as { kind: string; effort?: string; objectTag?: string };
    steps = [{ kind: 'forceAction', action: f.kind, ...(f.effort ? { effort: f.effort } : {}), ...(f.objectTag ? { objectTag: f.objectTag } : {}) }];
  } else if (a === 'continue' || a === 'posture' || a === 'clarify' || a === 'aim') steps = [];
  else return payload;
  const next = reconcileSteps(text, steps, max);
  if (next.length === steps.length && a !== 'posture' && a !== 'clarify' && a !== 'continue' && a !== 'aim') return payload;
  if (!next.some((x) => x.kind === 'strike' || x.kind === 'forceAction')) return payload;
  // A posture's stance goes first; an aim goes on the first strike.
  const pre: StepLike[] = a === 'posture' && payload['stance'] ? [{ kind: 'stance', stance: payload['stance'] }] : [];
  const aim = a === 'aim' ? payload['part'] : undefined;
  let aimed = false;
  const withAim = next.map((x) => (aim && !aimed && x.kind === 'strike' ? ((aimed = true), { ...x, aim }) : x));
  return { action: 'sequence', steps: [...pre, ...withAim].slice(0, max) };
}

export interface CombatFighterView {
  id: string;
  name: string;
  vitality: number;
  maxVitality: number;
  status: string;
  out: boolean;
  engagedElsewhere: boolean;
  minion: boolean;
  weapon: string;
  form: string | null;
  /** Limbs already severed (this fight or before): the narration may mention them (D-197). */
  lostParts: string[];
  /** Body parts of every wound the fighter has now (the wound location check). Absent on older drafts. */
  woundParts?: string[];
  /** The lightsaber's blade colour while it is in hand (D-205), else null. */
  bladeColor?: string | null;
  /** Body armor (D-216): none, light, medium or heavy, and whether it turns a lightsaber (beskar). Absent on older drafts. */
  armor?: string;
  saberResistant?: boolean;
  /** What the body can no longer do (D-237): "cannot stand: severed left leg", "no right arm". Absent on older drafts. */
  lasting?: { cannotStand: boolean; missing: string[]; text: string[] };
}

export interface CombatDraft {
  fightId: string;
  /** The fight began this turn (from a deferred combatStarted or a fight intent). */
  started: boolean;
  /** This turn's exchanges (roll cards). */
  records: ExchangeRecord[];
  /** Every exchange since the last narrated beat (D-145: one narration covers them all). */
  narrate: ExchangeRecord[];
  beat: string | null;
  /** A quiet beat: no AI call; the feed shows the roll cards and `quietLine`. */
  quiet: boolean;
  quietLine: string | null;
  ended: { outcome: string; reason: string; playerFate: string | null } | null;
  /** A sparring session (D-168): bouts won, lost and unfinished, how it ended, and any real injury. */
  session: { won: number; lost: number; unfinished: number; ended: string | null; injuries: string[] } | null;
  advantage: number;
  fighters: CombatFighterView[];
  notes: string[];
}

const FORCE_KINDS: Readonly<Record<string, ForceActionKind>> = { forcePush: 'push', forceChoke: 'choke', forceLightning: 'lightning', telekinesis: 'throw', mindTrick: 'mindTrick', saberThrow: 'saberThrow', recall: 'recall' };

/** The combat action an intent asks for in a fight (typed input): a sequence, a Force action, a tactic, or the next beat. */
export function combatActionFromIntent(intent: Intent | null): Record<string, unknown> {
  if (intent?.sequence?.length) return { action: 'sequence', steps: intent.sequence };
  if (intent?.forceAbility && FORCE_KINDS[intent.forceAbility]) return { action: 'force', force: { kind: FORCE_KINDS[intent.forceAbility], ...(intent.effort ? { effort: intent.effort } : {}) } };
  if (intent?.tactic) return { action: 'tactic', tactic: intent.tactic };
  // "Go for his head": the next strike is aimed (D-171).
  if (intent?.aim) return { action: 'aim', part: intent.aim };
  return { action: 'continue' };
}

/** The combatAction event payload for a beat button. */
export function combatActionFromBeat(b: CombatActionInput): Record<string, unknown> {
  const { action, ...rest } = b;
  return { action, ...Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined)) };
}

const view = (f: DuelState['a']): CombatFighterView => ({
  id: f.id,
  name: f.name,
  vitality: Math.round(f.vitality * 10) / 10,
  maxVitality: Math.round(f.maxVitality * 10) / 10,
  // A droid is destroyed or disabled, never dying (issue 21).
  status: f.forceTraits?.includes('droid')
    ? f.dead ? 'Destroyed' : f.out || isDying(f.wounds as Wound[]) || isIncapacitated(f.wounds as Wound[]) ? 'Disabled' : statusLabel(f.wounds as Wound[])
    : f.dead ? 'Dead' : isDying(f.wounds as Wound[]) ? 'Dying' : isIncapacitated(f.wounds as Wound[]) ? 'Incapacitated' : f.out ? 'Out of the fight' : statusLabel(f.wounds as Wound[]),
  out: f.out,
  engagedElsewhere: f.engagedElsewhere,
  minion: f.minion,
  weapon: f.weapon,
  form: f.form,
  lostParts: (f.wounds as Wound[]).filter((w) => w.severed).map((w) => w.part),
  woundParts: (f.wounds as Wound[]).map((w) => w.part),
  bladeColor: f.weapon === 'lightsaber' ? (f.bladeColor ?? null) : null,
  armor: f.armor,
  saberResistant: f.saberResistant,
  lasting: lastingState(f.wounds as Wound[], (f.lasting ?? []) as LastingInjury[]),
});

function noEffectLine(notes: readonly string[]): string {
  const m = notes.map((n) => /(?:NOT REACHED|FAILED) \((.+)\)$/.exec(n)?.[1]).find((x) => x);
  return m ? `${m[0]!.toUpperCase()}${m.slice(1)}.` : 'Nothing happens.';
}

function quietLineFor(beat: string | null, duel: DuelState, records: readonly ExchangeRecord[]): string | null {
  if (!beat) return null;
  const last = records[records.length - 1];
  const opp0 = duel.opponents.find((o) => o.id === last?.targetId) ?? duel.opponents[0];
  // A shooter on either side: the ranged lines (D-216), so a blaster is never "blade on blade".
  const ranged = [opp0?.weapon, duel.a.weapon].some((w) => w !== undefined && RANGED_WEAPONS.includes(w as WeaponKind));
  const lines = (ranged ? QUIET_LINES_RANGED[beat as BeatReason] : undefined) ?? QUIET_LINES[beat as BeatReason];
  if (!lines) return null;
  const side: LineSide = last?.hit ? (last.hit.by === 'A' ? 'up' : 'down') : last?.striker ? (last.striker === 'A' ? 'up' : 'down') : duel.advantage > 0 ? 'up' : duel.advantage < 0 ? 'down' : 'even';
  const options = lines[side].length ? lines[side] : lines.even;
  const opp = duel.opponents.find((o) => o.id === last?.targetId) ?? duel.opponents[0];
  return fillLine(options[duel.exchange % options.length]!, duel.a.name, opp?.name ?? 'the opponent');
}

/** Builds the combat draft from the fight before and after this turn's action. */
export function combatDraft(before: GameState, after: GameState, started: boolean, notes: readonly string[]): CombatDraft | null {
  const prev: ActiveFight | null = before.combat.active;
  const active: ActiveFight | null = after.combat.active;
  const last: FightSummary | null = after.combat.last;
  const endedNow = !active && last !== null && (prev?.id === last.id || started);
  const duel = (active?.duel ?? (endedNow ? (last as FightSummary & { duel?: DuelState }).duel : null)) as DuelState | null;
  if (!duel) return null;
  const prevDuel = (prev && prev.id === (active?.id ?? last?.id) ? prev.duel : null) as DuelState | null;
  const fromLog = prevDuel ? prevDuel.log.length : 0;
  const fromNarrated = prev && prevDuel ? prev.lastNarrated : 0;
  const records = duel.log.slice(fromLog);
  const narrateFrom = duel.log.findIndex((r) => r.n > fromNarrated);
  const sess = (active?.session ?? (endedNow ? last!.session : null)) ?? null;
  // A sparring session resolved in code is narrated once from its highlights: hits, points and maneuvers (D-168).
  const all = narrateFrom < 0 ? [] : duel.log.slice(narrateFrom);
  const narrate = sess && endedNow ? all.filter((r) => r.hit !== null || r.maneuver !== null) : all;
  const injuries = sess ? duel.log.filter((r) => r.hit?.severity && r.n > fromNarrated).map((r) => `${r.hit!.severity} wound to the ${partText(r.hit!.part)}`) : [];
  const beat = active?.beat ?? (endedNow ? 'fightEnded' : null);
  const narrated = endedNow || started || (beat !== null && isNarratedBeat(beat as BeatReason));
  return {
    fightId: active?.id ?? last!.id,
    started,
    records,
    narrate,
    beat,
    quiet: !narrated,
    // Nothing attempted (D-194): the reason is the quiet line ("droids can't be mind-tricked").
    quietLine: narrated ? null : beat === 'noEffect' ? noEffectLine(notes) : quietLineFor(beat, duel, records),
    ended: endedNow ? { outcome: last!.outcome, reason: last!.reason, playerFate: last!.playerFate } : null,
    session: sess
      ? { won: sess.bouts.filter((b) => b.winner === 'A').length, lost: sess.bouts.filter((b) => b.winner === 'B').length, unfinished: sess.bouts.filter((b) => b.winner === null).length, ended: sess.ended, injuries }
      : null,
    advantage: duel.advantage,
    fighters: [view(duel.a), ...duel.opponents.map(view)],
    notes: [...notes],
  };
}
