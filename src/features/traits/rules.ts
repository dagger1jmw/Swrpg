// Traits and formative events: the pure rules (M8 checklist item 16; spec/traits.md). No DOM, no network (Golden Rule 2).
// The gates, the creation check, the hooks (rolls, learning, reactions, alignment pressures, start money), the quiz's plan
// and scoring, the suggestions, and the traits of NPCs (canon from the lore list, generated ones from a seed).
import {
  FEAR_FACED_TO_OVERCOME,
  FORMATIVE_WARS,
  JEDI_ATTACHMENT_RULE_YEARS,
  MASSACRES,
  MENTOR_LEARNING,
  PRESSURE_KINDS,
  RIVAL_SPUR,
  SITH_EMPIRE_YEARS,
  TRAITS,
  TRAIT_BY_ID,
  TRAIT_LIMITS,
  type NpcKind,
  type PressureKind,
  type TraitDef,
  type TraitKind,
  type TraitSituation,
} from '../../data/traits';
import {
  FORMATIVE_EVENTS,
  FORMATIVE_EVENT_BY_ID,
  MILITARY_ARCHETYPES,
  QUIZ_LIMITS,
  QUIZ_STAGES,
  SET_STANDING,
  STAGE_COVER_SHARE,
  UPBRINGING_BY_ORIGIN,
  YOUNGLING_START_AGE,
  type FormativeChoice,
  type FormativeEffects,
  type FormativeEvent,
  type FormativePerson,
  type FormativeSet,
  type QuizTrack,
} from '../../data/formativeEvents';
import { CANON_TRAITS } from '../../data/canon/canonTraits';
import { FORM_IDS } from '../../data/skills';
import { nextFloat, seedRng, type RngState } from '../../engine/rng';
import type { z } from 'zod';
import type { holdingSchema } from './traits';

export type CharacterPath = 'jedi' | 'sith' | 'outsider' | 'career';

// ---------------------------------------------------------------- holdings

/** A trait the character (or an NPC) holds (the slice schema's holding: id, since, source, a tie's name, a mentor's field, overcome). */
export type TraitHolding = z.infer<typeof holdingSchema>;

/** The ids a holder's hooks read. */
export const heldIds = (held: readonly TraitHolding[]): string[] => held.map((h) => h.id);

// ---------------------------------------------------------------- gates

/** What the gates read about a character (from creation inputs or from the state). */
export interface TraitContext {
  path: CharacterPath;
  speciesId: string;
  archetype: string;
  birthYear: number;
  startYear: number;
  /** The training start age (Temple arrival for a Jedi). */
  trainingStartAge: number;
  warYears?: number;
  homeworld?: string;
  imperialBorn?: boolean;
  /** The origin chosen (Coruscant underlevels places the character on Coruscant). */
  origin?: string;
}

/** The age at which a child lives through a massacre or war as its own memory (invented). */
const MEMORY_AGE = 4;
/** The age at which a war counts as war years for a veteran without recorded war years (invented). */
const VETERAN_AGE = 14;

const overlaps = (a0: number, a1: number, b0: number, b1: number): boolean => a0 <= b1 && b0 <= a1;

/** The wars the character lived through from age `from` to the start. */
export function warsLived(ctx: Pick<TraitContext, 'birthYear' | 'startYear'>, fromAge: number, toAge = Infinity): typeof FORMATIVE_WARS[number][] {
  const lo = ctx.birthYear + fromAge;
  const hi = Math.min(ctx.startYear, ctx.birthYear + toAge);
  return FORMATIVE_WARS.filter((w) => overlaps(lo, hi, w.from, w.to));
}

/** On Coruscant in 3,653 BBY: a Jedi already at the Temple, an underlevels child, or a Coruscant homeworld (and alive then). */
export function onCoruscant3653(ctx: TraitContext): boolean {
  const y = -3653;
  if (ctx.birthYear + MEMORY_AGE > y || ctx.startYear < y) return false;
  if (ctx.path === 'jedi' && ctx.birthYear + ctx.trainingStartAge <= y) return true;
  return ctx.origin === 'underlevels' || (ctx.homeworld ?? '').trim().toLowerCase() === 'coruscant';
}

/** The massacres the character survived (by the catalog's dated list). */
export function massacresLived(ctx: TraitContext): typeof MASSACRES[number][] {
  return MASSACRES.filter((m) => {
    if (ctx.birthYear + MEMORY_AGE > m.year || ctx.startYear < m.year) return false;
    if (m.who === 'coruscant') return onCoruscant3653(ctx);
    return ctx.path === 'jedi' && ctx.birthYear + ctx.trainingStartAge <= m.year;
  });
}

function needsMet(need: NonNullable<TraitDef['gate']>['needs'], ctx: TraitContext): boolean {
  switch (need) {
    case undefined:
      return true;
    case 'war':
      return (ctx.warYears ?? 0) > 0 || warsLived(ctx, VETERAN_AGE).length > 0;
    case 'massacre':
      return massacresLived(ctx).length > 0;
    case 'coruscant3653':
      return onCoruscant3653(ctx);
    case 'slavery':
      // Slavery stands in Hutt space and beyond the Republic in every era the lore covers (SW_Hutt and economy files): open always.
      return true;
    case 'sithEmpire':
      return overlaps(ctx.birthYear, ctx.startYear, SITH_EMPIRE_YEARS.from, SITH_EMPIRE_YEARS.to) && (ctx.path === 'sith' || ctx.imperialBorn === true);
    case 'jediAttachmentRules':
      return JEDI_ATTACHMENT_RULE_YEARS.some((r) => ctx.startYear >= r.from && ctx.startYear <= r.to);
  }
}

/** Why a trait is closed to the character, or null when it is open. */
export function traitRefusal(id: string, ctx: TraitContext): string | null {
  const def = TRAIT_BY_ID.get(id);
  if (!def) return `unknown trait ${id}`;
  const g = def.gate;
  if (!g) return null;
  if (g.paths && !g.paths.includes(ctx.path)) return `${def.name} is only for ${g.paths.join(' or ')}`;
  if (g.notPaths?.includes(ctx.path)) return `${def.name} is not for a ${ctx.path}`;
  if (g.species && !g.species.includes(ctx.speciesId)) return `${def.name} is only for ${g.species.join(', ')}`;
  if (g.templeArrivalBefore !== undefined && !(ctx.trainingStartAge < g.templeArrivalBefore)) return `${def.name} needs arrival at the Temple before age ${g.templeArrivalBefore} (arrived at ${ctx.trainingStartAge}): take an ordinary origin for the life before`;
  if (!needsMet(g.needs, ctx)) return `${def.name} needs ${g.needs === 'war' ? 'war years' : g.needs === 'massacre' ? 'to have lived through a massacre (the Sacking of Coruscant, Order 66, the Massacre at Ossus)' : g.needs === 'sithEmpire' ? 'an Imperial birth in the Sith Empire' : g.needs === 'coruscant3653' ? 'to have been on Coruscant in 3,653 BBY' : g.needs === 'jediAttachmentRules' ? "the Order's rule against attachment" : g.needs}`;
  return null;
}

/** The traits open to the character, by kind. */
export function eligibleTraits(ctx: TraitContext, kind?: TraitKind): TraitDef[] {
  return TRAITS.filter((t) => (!kind || t.kind === kind) && traitRefusal(t.id, ctx) === null);
}

// ---------------------------------------------------------------- the creation check

export interface TraitChoice {
  origin: string;
  temperament: string;
  scarOrTie: string;
  /** Optional, flaw-heavy only. */
  fourth?: string;
  homeworld?: string;
  /** The outside mentor's field (a skill id), when that tie is taken. */
  mentorField?: string;
}

/** Errors for a creation's traits: one origin, one temperament, one scar or tie, an optional flaw-heavy fourth; every one open. */
export function traitChoiceErrors(c: TraitChoice, ctx: TraitContext): string[] {
  const errors: string[] = [];
  const kindOf = (id: string): TraitKind | null => TRAIT_BY_ID.get(id)?.kind ?? null;
  if (kindOf(c.origin) !== 'origin') errors.push('Choose one origin.');
  if (kindOf(c.temperament) !== 'temperament') errors.push('Choose one temperament.');
  const st = kindOf(c.scarOrTie);
  if (st !== 'scar' && st !== 'tie') errors.push('Choose one scar or tie.');
  if (c.fourth !== undefined && c.fourth !== '') {
    const d = TRAIT_BY_ID.get(c.fourth);
    if (!d) errors.push(`Unknown trait ${c.fourth}.`);
    else if (!d.flawHeavy) errors.push(`A fourth trait must be flaw-heavy; ${d.name} is not.`);
    else if (d.kind === 'origin') errors.push('Only one origin.');
    else if ([c.origin, c.temperament, c.scarOrTie].includes(c.fourth)) errors.push(`${d.name} is already taken.`);
  }
  const ids = [c.origin, c.temperament, c.scarOrTie, ...(c.fourth ? [c.fourth] : [])];
  for (const id of ids) {
    if (!TRAIT_BY_ID.has(id)) continue;
    const why = traitRefusal(id, { ...ctx, origin: c.origin, ...(c.homeworld ? { homeworld: c.homeworld } : {}) });
    if (why) errors.push(`${why}.`);
  }
  for (const [a, b] of CONFLICTS) if (ids.includes(a) && ids.includes(b)) errors.push(`${TRAIT_BY_ID.get(a)!.name} and ${TRAIT_BY_ID.get(b)!.name} contradict each other.`);
  return errors;
}

/** Temperaments that contradict each other (a reading of the catalog; invented). */
export const CONFLICTS: readonly (readonly [string, string])[] = [
  ['hotHeaded', 'patient'],
  ['reckless', 'cautious'],
  ['witty', 'reserved'],
];

// ---------------------------------------------------------------- hooks

/** The hooks a holding still has: an overcome scar loses its bad side (negative rolls, its pressures). */
function rollHooksOf(h: TraitHolding): readonly { situation: TraitSituation; mod: number }[] {
  const d = TRAIT_BY_ID.get(h.id);
  const rolls = d?.rolls ?? [];
  return h.overcome ? rolls.filter((r) => r.mod > 0) : rolls;
}

export interface TraitRollPart {
  trait: string;
  mod: number;
}

/** The traits' modifier on one roll in these situations: the sum, held to +-2 in all (TRAIT_LIMITS.roll). */
export function traitRollMod(held: readonly TraitHolding[], situations: readonly TraitSituation[]): { total: number; parts: TraitRollPart[] } {
  const parts: TraitRollPart[] = [];
  for (const h of held) for (const r of rollHooksOf(h)) if (situations.includes(r.situation)) parts.push({ trait: h.id, mod: r.mod });
  const sum = parts.reduce((a, p) => a + p.mod, 0);
  return { total: Math.max(-TRAIT_LIMITS.roll, Math.min(TRAIT_LIMITS.roll, sum)), parts };
}

/** The traits' learning factor on one skill (training, or XP from play when `play`), held to 0.8-1.2 (TRAIT_LIMITS). */
export function traitLearning(held: readonly TraitHolding[], skillId: string, opts: { play?: boolean; rivalSpur?: boolean } = {}): number {
  let f = 1;
  for (const h of held) {
    const d = TRAIT_BY_ID.get(h.id);
    for (const l of d?.learning ?? []) {
      const hit = l.skills.some((k) => k === skillId || (k === '$forms' && (FORM_IDS as readonly string[]).includes(skillId)) || (k === '$playXp' && opts.play === true));
      if (hit) f *= l.factor;
    }
    if (h.id === 'outsideMentor' && h.field === skillId) f *= MENTOR_LEARNING;
  }
  if (opts.rivalSpur) f *= RIVAL_SPUR.factor;
  return Math.max(TRAIT_LIMITS.learnMin, Math.min(TRAIT_LIMITS.learnMax, f));
}

/** The kinds of NPC a person counts as for reactions (from role, faction and canon standing; a reading, spec/traits.md section 4). */
export function npcKindsOf(n: { role: string; factionId: string }): NpcKind[] {
  const k = new Set<NpcKind>();
  if (['politician', 'official'].includes(n.role)) k.add('elite').add('formal');
  if (['officer', 'jediMaster', 'sithLord'].includes(n.role)) k.add('formal');
  if (['civilian', 'merchant', 'servant'].includes(n.role)) k.add('commoner');
  if (['criminal', 'smuggler', 'bountyHunter'].includes(n.role) || n.factionId === 'underworld') k.add('criminal');
  if (['soldier', 'officer'].includes(n.role) && n.factionId === 'republic') k.add('law');
  if (n.factionId === 'jediOrder' || ['jediMaster', 'jediKnight', 'padawan', 'initiate'].includes(n.role)) k.add('jedi');
  if (n.factionId === 'sithEmpire' || n.factionId === 'sith') k.add('imperial');
  if (n.factionId === 'republic') k.add('republic');
  if (n.factionId === 'mandalorians') k.add('mandalorian');
  return [...k];
}

/** The reaction shift between a holder and an NPC of these kinds (summed, held to +-2). */
export function traitReaction(held: readonly TraitHolding[], kinds: readonly NpcKind[]): number {
  let sum = 0;
  for (const h of held) for (const r of TRAIT_BY_ID.get(h.id)?.reactions ?? []) if (kinds.includes(r.who)) sum += r.shift;
  return Math.max(-TRAIT_LIMITS.reaction, Math.min(TRAIT_LIMITS.reaction, sum));
}

/** The pressures the alignment system reads (M6): multipliers start at 1, start offsets at 0. An overcome scar has none. */
export function traitPressure(held: readonly TraitHolding[]): Record<PressureKind, number> {
  const out = Object.fromEntries(PRESSURE_KINDS.map((k) => [k, k === 'startDarkPressure' || k === 'guilt' ? 0 : 1])) as Record<PressureKind, number>;
  for (const h of held) {
    if (h.overcome) continue;
    for (const [k, v] of Object.entries(TRAIT_BY_ID.get(h.id)?.pressure ?? {}) as [PressureKind, number][]) {
      out[k] = k === 'startDarkPressure' || k === 'guilt' ? out[k] + v : out[k] * v;
    }
  }
  return out;
}

/** The starting purse's multiplier from the traits (the economy reads it at creation). */
export function traitStartMoney(ids: readonly string[]): number {
  return ids.reduce((f, id) => f * (TRAIT_BY_ID.get(id)?.startMoney ?? 1), 1);
}

/** A scar's fear faced in play: overcome after FEAR_FACED_TO_OVERCOME (the code decides). */
export function fearFaced(count: number): { count: number; overcome: boolean } {
  const next = count + 1;
  return { count: next, overcome: next >= FEAR_FACED_TO_OVERCOME };
}

// ---------------------------------------------------------------- the quiz

/** The quiz's track: the Order, the academy, a military career, or a civilian life. */
export function quizTrack(path: CharacterPath, archetype: string): QuizTrack {
  if (path === 'jedi') return 'jedi';
  if (path === 'sith') return 'sith';
  return path === 'career' && MILITARY_ARCHETYPES.includes(archetype) ? 'military' : 'civilian';
}

/** A youngling start: the quiz waits for the first long skip (a Jedi Initiate, a Sith acolyte, or anyone under 13). */
export function isYounglingStart(path: CharacterPath, rank: string, age: number): boolean {
  if (path === 'jedi') return rank === 'initiate' || rank === 'youngling';
  if (path === 'sith') return rank === 'acolyte' || rank === 'initiate';
  return age < YOUNGLING_START_AGE;
}

export interface QuizInput {
  track: QuizTrack;
  /** The years the quiz covers (real ages). */
  fromAge: number;
  toAge: number;
  birthYear: number;
  /** The civilian upbringing (from the origin trait). */
  origin: string;
  /** A Force-sensitive child (Jedi, Sith or outsider). */
  forceSensitive: boolean;
  /** On Coruscant in 3,653 BBY (the Sacking). */
  atCoruscant3653: boolean;
  seed: string;
}

export interface QuizPlan {
  /** The event ids, in the order the scenes come (oldest first). */
  events: string[];
  /** The stages the window covers. */
  stages: number;
}

const upbringingOf = (origin: string): FormativeSet => UPBRINGING_BY_ORIGIN[origin] ?? 'anyone';

function eventFits(e: FormativeEvent, q: QuizInput, lo: number, hi: number): boolean {
  if (!overlaps(lo, hi, e.ages[0], e.ages[1])) return false;
  switch (e.needs) {
    case 'sacking': {
      const age = -3653 - q.birthYear;
      return q.atCoruscant3653 && age >= Math.max(lo, e.ages[0]) && age <= Math.min(hi, e.ages[1]);
    }
    case 'war':
      return warsLived({ birthYear: q.birthYear, startYear: q.birthYear + hi }, Math.max(lo, e.ages[0]), Math.min(hi, e.ages[1])).length > 0;
    case 'forceSensitive':
      return q.forceSensitive;
    default:
      return true;
  }
}

/** A stable shuffle from the seed (Fisher-Yates on the seeded generator). */
function shuffled<T>(xs: readonly T[], rng: RngState): [T[], RngState] {
  const a = [...xs];
  let r = rng;
  for (let i = a.length - 1; i > 0; i--) {
    const [u, n] = nextFloat(r);
    r = n;
    const j = Math.floor(u * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return [a, r];
}

/**
 * The quiz's scenes: two per stage the window covers (a stage counts once STAGE_COVER_SHARE of it is behind; a shorter window
 * takes the stage it overlaps most), dated events first where they fit, the total held to 4-8; topped up from the track's
 * other events in the window when short. Empty when the window touches no stage (too young to have a past to ask about).
 */
export function quizPlan(q: QuizInput): QuizPlan {
  const overlap = (st: { from: number; to: number }): number => Math.min(q.toAge, st.to) - Math.max(q.fromAge, st.from);
  let stages = QUIZ_STAGES[q.track].filter((st) => overlap(st) >= STAGE_COVER_SHARE * (st.to - st.from));
  // A window shorter than half a stage (a youngling's first long skip) still covers the stage it overlaps most.
  if (!stages.length) {
    const best = [...QUIZ_STAGES[q.track]].sort((a, b) => overlap(b) - overlap(a))[0];
    if (best && overlap(best) > 0) stages = [best];
  }
  if (!stages.length) return { events: [], stages: 0 };
  const want = Math.max(QUIZ_LIMITS.minScenes, Math.min(QUIZ_LIMITS.maxScenes, 2 * stages.length));
  let rng = seedRng(`quiz:${q.seed}`);
  const chosen: string[] = [];
  const setOf = (s: string): FormativeSet => (s === '$upbringing' ? upbringingOf(q.origin) : (s as FormativeSet));
  const pool = (sets: readonly string[], lo: number, hi: number): FormativeEvent[] => FORMATIVE_EVENTS.filter((e) => sets.map(setOf).includes(e.set) && !chosen.includes(e.id) && eventFits(e, q, lo, hi));
  const perStage = Math.max(1, Math.floor(want / stages.length));
  for (const st of stages) {
    const lo = Math.max(q.fromAge, st.from);
    const hi = Math.min(q.toAge, st.to);
    const fits = pool(st.sets, lo, hi);
    const dated = fits.filter((e) => e.needs === 'sacking' || e.needs === 'war');
    const [rest, r] = shuffled(fits.filter((e) => !dated.includes(e)), rng);
    rng = r;
    for (const e of [...dated, ...rest].slice(0, perStage)) chosen.push(e.id);
  }
  if (chosen.length < want) {
    const sets = [...new Set(QUIZ_STAGES[q.track].flatMap((st) => st.sets))];
    const [more] = shuffled(pool(sets, q.fromAge, q.toAge), rng);
    for (const e of more) if (chosen.length < want) chosen.push(e.id);
  }
  const events = chosen.slice(0, QUIZ_LIMITS.maxScenes).sort((a, b) => FORMATIVE_EVENT_BY_ID.get(a)!.ages[0] - FORMATIVE_EVENT_BY_ID.get(b)!.ages[0]);
  return { events, stages: stages.length };
}

export interface QuizAnswer {
  eventId: string;
  choiceId: string;
  /** The player's own line: narrator colour only. */
  note?: string;
}

export interface QuizPerson extends FormativePerson {
  eventId: string;
}

export interface QuizResult {
  facts: string[];
  /** Trait leanings: id -> weight (a choice's leans count 1, its scar 3). */
  leans: Record<string, number>;
  align: number;
  dark: number;
  standing: Partial<Record<'order' | 'academy' | 'unit' | 'community', number>>;
  flags: string[];
  people: QuizPerson[];
  /** Scars a dated event gives (the Sacking, a first battle in a war). */
  givenScars: string[];
  notes: string[];
}

const clamp = (v: number, m: number): number => Math.max(-m, Math.min(m, v));

/** Errors in a set of answers against the plan: one answer per scene, each a choice of its event, notes kept short. */
export function quizAnswerErrors(plan: QuizPlan, answers: readonly QuizAnswer[]): string[] {
  const errors: string[] = [];
  if (answers.length !== plan.events.length) errors.push(`answer every scene (${plan.events.length}, got ${answers.length})`);
  for (const a of answers) {
    if (!plan.events.includes(a.eventId)) errors.push(`${a.eventId} is not one of this quiz's scenes`);
    else if (!FORMATIVE_EVENT_BY_ID.get(a.eventId)!.choices.some((c) => c.id === a.choiceId)) errors.push(`${a.choiceId} is not a choice of ${a.eventId}`);
    if ((a.note ?? '').length > QUIZ_LIMITS.noteMax) errors.push(`a note is at most ${QUIZ_LIMITS.noteMax} characters`);
  }
  if (new Set(answers.map((a) => a.eventId)).size !== answers.length) errors.push('one answer per scene');
  return errors;
}

/** One answer's effects, its roll made from the seed (a failure replaces the named fields). */
export function answerEffects(e: FormativeEvent, c: FormativeChoice, seed: string): FormativeEffects & { rolled?: 'success' | 'failure' } {
  if (!c.roll) return c;
  const [u] = nextFloat(seedRng(`quiz:${seed}:${e.id}:${c.id}`));
  return u < c.roll.chance ? { ...c, ...c.roll.fail, rolled: 'failure' } : { ...c, rolled: 'success' };
}

/**
 * What the answers give (the code decides every effect): facts, leanings, alignment and dark-pressure nudges (+-2 an event,
 * +-10 overall), standing (+-2 an event, +-4 overall per group), flags, people and the dated scars. Never a stat or a skill.
 */
export function scoreQuiz(answers: readonly QuizAnswer[], seed: string): QuizResult {
  const r: QuizResult = { facts: [], leans: {}, align: 0, dark: 0, standing: {}, flags: [], people: [], givenScars: [], notes: [] };
  for (const a of answers) {
    const e = FORMATIVE_EVENT_BY_ID.get(a.eventId);
    const c = e?.choices.find((x) => x.id === a.choiceId);
    if (!e || !c) continue;
    const fx = answerEffects(e, c, seed);
    r.facts.push(fx.fact);
    for (const id of fx.leans ?? []) r.leans[id] = (r.leans[id] ?? 0) + 1;
    r.align += clamp(fx.align ?? 0, QUIZ_LIMITS.alignPerEvent);
    r.dark += clamp(fx.dark ?? 0, QUIZ_LIMITS.darkPerEvent);
    const g = SET_STANDING[e.set];
    if (fx.standing) r.standing[g] = (r.standing[g] ?? 0) + clamp(fx.standing, QUIZ_LIMITS.standingPerEvent);
    if (fx.flag && !r.flags.includes(fx.flag)) r.flags.push(fx.flag);
    if (fx.person) {
      r.people.push({ ...fx.person, eventId: e.id });
      if (fx.person.tie) r.leans[fx.person.tie] = (r.leans[fx.person.tie] ?? 0) + 2;
    }
    if (fx.scar) {
      if (e.needs === 'sacking' || e.needs === 'war') {
        if (!r.givenScars.includes(fx.scar)) r.givenScars.push(fx.scar);
      } else r.leans[fx.scar] = (r.leans[fx.scar] ?? 0) + 3;
    }
    const note = (a.note ?? '').trim();
    if (note) r.notes.push(`${e.title}: ${note.slice(0, QUIZ_LIMITS.noteMax)}`);
  }
  r.align = clamp(r.align, QUIZ_LIMITS.alignTotal);
  r.dark = clamp(r.dark, QUIZ_LIMITS.darkTotal);
  for (const k of Object.keys(r.standing) as (keyof QuizResult['standing'])[]) r.standing[k] = clamp(r.standing[k]!, QUIZ_LIMITS.standingTotal);
  return r;
}

/** The traits the quiz suggests: the most-leaned open temperament and scar or tie (the player accepts or swaps). */
export function suggestTraits(leans: Readonly<Record<string, number>>, ctx: TraitContext, origin: string): { temperament: string | null; scarOrTie: string | null; ranked: string[] } {
  const open = (id: string): boolean => traitRefusal(id, { ...ctx, origin }) === null;
  const ranked = Object.entries(leans)
    .filter(([id]) => TRAIT_BY_ID.has(id) && open(id))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
  const pick = (kinds: readonly TraitKind[]): string | null => ranked.find((id) => kinds.includes(TRAIT_BY_ID.get(id)!.kind)) ?? null;
  return { temperament: pick(['temperament']), scarOrTie: pick(['scar', 'tie']), ranked };
}

/** "Suggest from my backstory" without a quiz: leanings from the path, the archetype and the background flags (invented reading). */
export function backstoryLeans(ctx: TraitContext): Record<string, number> {
  const l: Record<string, number> = {};
  const add = (id: string, w = 1): void => void (l[id] = (l[id] ?? 0) + w);
  const addAll = (pairs: readonly (readonly [string, number])[]): void => pairs.forEach(([id, w]) => add(id, w));
  if (ctx.path === 'jedi') addAll([[ctx.trainingStartAge < 10 ? 'templeRaised' : 'frontierWorld', ctx.trainingStartAge < 10 ? 3 : 1], ['disciplined', 1], ['patient', 1]]);
  if (ctx.path === 'sith') addAll([['academyRaised', 3], ['ambitious', 1], ['proud', 1]]);
  if (ctx.path === 'outsider') addAll([['curious', 1], ['reserved', 1], ['outsideMentor', 2]]);
  if (MILITARY_ARCHETYPES.includes(ctx.archetype)) addAll([['militaryFamily', 2], ['disciplined', 1], ['loyal', 1]]);
  if (['smuggler', 'bountyHunter', 'crimeLord'].includes(ctx.archetype)) addAll([['spacerBorn', 2], ['witty', 1], ['contact', 2]]);
  if (['politician', 'scholar'].includes(ctx.archetype)) addAll([['nobleHouse', 2], ['curious', 1], ['patron', 2]]);
  if (ctx.archetype === 'mandalorian') addAll([['mandalorianClan', 3], ['proud', 1]]);
  if ((ctx.warYears ?? 0) > 0) add('warVeteran', 3);
  if (massacresLived(ctx).length) add('massacreSurvivor', 3);
  return l;
}

// ---------------------------------------------------------------- NPCs

/** Temperaments a generated NPC draws from, and the chance of a second trait (a scar), invented. */
const NPC_SECOND_TRAIT = 0.5;

/** A generated NPC's traits: one temperament and, half the time, a second (temperament or scar) that does not contradict it. */
export function generatedNpcTraits(seed: string): string[] {
  const hit = NPC_TRAIT_CACHE.get(seed);
  if (hit) return [...hit];
  const out = drawNpcTraits(seed);
  if (NPC_TRAIT_CACHE.size > 5000) NPC_TRAIT_CACHE.clear();
  NPC_TRAIT_CACHE.set(seed, out);
  return [...out];
}
/** The draw is a pure function of the seed: cached, as fighters are built in loops. */
const NPC_TRAIT_CACHE = new Map<string, readonly string[]>();
function drawNpcTraits(seed: string): string[] {
  let rng = seedRng(`traits:${seed}`);
  const temps = TRAITS.filter((t) => t.kind === 'temperament' && !t.gate);
  const [u1, r1] = nextFloat(rng);
  rng = r1;
  const first = temps[Math.floor(u1 * temps.length)]!.id;
  const [u2, r2] = nextFloat(rng);
  if (u2 >= NPC_SECOND_TRAIT) return [first];
  const others = TRAITS.filter((t) => (t.kind === 'temperament' || t.kind === 'scar') && !t.gate && t.id !== first && !CONFLICTS.some(([a, b]) => (a === first && b === t.id) || (b === first && a === t.id)));
  const [u3] = nextFloat(r2);
  return [first, others[Math.floor(u3 * others.length)]!.id];
}

/** A canon figure's traits from the lore list (spec/traits.md section 8), or null when the list has none for it. */
export function canonNpcTraits(canonId: string | null | undefined): string[] | null {
  if (!canonId) return null;
  const c = CANON_TRAITS.find((x) => x.canonId === canonId);
  return c ? [...c.traits] : null;
}
