// Traits feature (M8 checklist item 16; spec/traits.md). The code owns every trait (Golden Rule 1): the narrator may suggest
// a change with `traitMoment` (a fear faced, a betrayal, a massacre, a temperament tested); the code counts and decides. The
// formative quiz's answers come as one event (`formativeQuizTaken`, engine at creation, player after a youngling's first long
// skip); the code re-draws the scenes from the seed, checks the answers and applies every effect.
import { z } from 'zod';
import { FORMATIVE_EVENT_BY_ID, QUIZ_LIMITS, QUIZ_SKIP_DAYS, QUIZ_SKIP_GAP_DAYS } from '../../data/formativeEvents';
import { FEAR_FACED_TO_OVERCOME, RIVAL_SPUR, TEMPERAMENT_SHIFT_MOMENTS, TIE_NAMES, TRAIT_BY_ID } from '../../data/traits';
import { DAYS_PER_YEAR, fromAbsSecond } from '../../engine/calendar';
import { seedRng, nextFloat } from '../../engine/rng';
import type { GameState } from '../../state/gameState';
import type { FeatureModule, GameEvent, HandleResult, InitCtx } from '../../state/types';
import { selectPresentNpcIds } from '../pacing/selectors';
import { quizAnswerErrors, quizPersonAge, quizPersonKind, quizPlan, readPersonNote, scoreQuiz, traitChoiceErrors, type QuizPerson, type QuizPersonKind, type TraitHolding } from './rules';
import { planetByName } from '../../data/galaxyMap';
import { selectQuizInput, selectTraitContext, selectTraitLines } from './selectors';
import { emptyTraits, traitsSliceSchema, type TraitsSlice } from './traits';

type R = HandleResult<TraitsSlice>;

/** The recorded moments that may change a trait in play (the narrator names one; the code decides). */
export const TRAIT_MOMENTS = ['fearFaced', 'betrayed', 'massacre', 'familyLost', 'imprisoned', 'darkBrush', 'firstKill', 'publicFailure', 'disaster', 'exiled', 'idealBroken', 'temperamentTested', 'rivalOutdid'] as const;
type Moment = (typeof TRAIT_MOMENTS)[number];
/** The scar each moment adds (when not held). */
const MOMENT_SCAR: Partial<Record<Moment, string>> = {
  betrayed: 'betrayed',
  massacre: 'massacreSurvivor',
  familyLost: 'lostFamily',
  imprisoned: 'formerPrisoner',
  darkBrush: 'brushWithDark',
  firstKill: 'firstKill',
  publicFailure: 'disgraced',
  disaster: 'disasterSurvivor',
  exiled: 'outcast',
};

/** A name for a generated person, from the seed, not one already used in the campaign. */
export function tieName(seed: string, used: readonly string[]): string {
  const [u] = nextFloat(seedRng(`tie:${seed}`));
  const start = Math.floor(u * TIE_NAMES.length);
  for (let i = 0; i < TIE_NAMES.length; i++) {
    const n = TIE_NAMES[(start + i) % TIE_NAMES.length]!;
    if (!used.some((x) => x.toLowerCase() === n.toLowerCase())) return n;
  }
  return `${TIE_NAMES[start]} the Younger`;
}

/** The starting slice from creation (character-creation §1 traits; spec/traits.md section 2). */
export function initialTraits(ctx: InitCtx): TraitsSlice {
  const t = ctx.traits;
  if (!t) return emptyTraits();
  const day = ctx.start.day;
  const ids = [t.choice.origin, t.choice.temperament, t.choice.scarOrTie, ...(t.choice.fourth ? [t.choice.fourth] : [])];
  const used: string[] = [ctx.character.name];
  const held: TraitHolding[] = ids.map((id) => {
    const d = TRAIT_BY_ID.get(id);
    const h: TraitHolding = { id, since: day, source: 'creation' };
    if (d?.tie) {
      const name = tieName(`${t.seed}:${id}`, used);
      used.push(name);
      h.tieName = name;
      if (id === 'outsideMentor' && t.choice.mentorField) h.field = t.choice.mentorField;
    }
    return h;
  });
  const quiz = t.quiz === 'creation' ? { status: 'due' as const, seed: t.seed, fromAge: 0, toAge: t.startAge } : t.quiz === 'pending' ? { status: 'pending' as const, seed: t.seed } : { status: 'taken' as const, seed: t.seed };
  return { ...emptyTraits(), held, quiz, ...(t.choice.homeworld ? { homeworld: t.choice.homeworld.slice(0, 60) } : {}) };
}

const FACTION_BY_PATH: Readonly<Record<string, string>> = { jedi: 'jediOrder', sith: 'sith', outsider: 'civilian', career: 'civilian' };
/** The role a tie's person plays (a reading; the narrator fills the rest). */
function tieRole(bond: string, path: string): string {
  if (bond === 'rival') return path === 'jedi' ? 'padawan' : path === 'sith' ? 'sithAcolyte' : 'civilian';
  return { debt: 'criminal', contact: 'merchant', patron: 'official', family: 'civilian', ward: 'civilian', love: 'civilian', mentor: 'scholar', bond: 'civilian' }[bond] ?? 'other';
}
const ENTITY_SPECIES = new Set(['human', 'twilek', 'zabrak', 'mirialan', 'togruta', 'kelDor', 'wookiee', 'rodian', 'cathar', 'miraluka', 'chiss', 'sithPureblood', 'monCalamari', 'bothan', 'duros', 'trandoshan', 'nautolan', 'ithorian', 'hutt', 'jawa', 'gamorrean', 'rattataki', 'arkanian', 'echani', 'iktotchi', 'cerean', 'toydarian']);
const speciesFor = (s: GameState): string => (ENTITY_SPECIES.has(s.character.speciesId) ? s.character.speciesId : 'human');
const ageNow = (s: GameState): number => (s.clock.now.day - s.character.birthDay) / DAYS_PER_YEAR;

/** A person made real: introduced as an NPC (engine) with the bond seeded (no social-line XP). */
function personEvents(s: GameState, name: string, who: string, bond: number, role: string, faction: string, age: number): GameEvent[] {
  return [
    { type: 'npcIntroduced', name, species: speciesFor(s), faction, role, ageApprox: Math.max(1, Math.round(age)), description: who.slice(0, 200) },
    { type: 'relationshipSeeded', npcRef: name, value: bond, reason: who.slice(0, 120) },
  ];
}

/** The tie NPCs of a new character (createCampaign applies these as engine events after the start). */
export function traitCreationEvents(s: GameState): GameEvent[] {
  const out: GameEvent[] = [];
  for (const h of (s as { traits?: TraitsSlice }).traits?.held ?? []) {
    const d = TRAIT_BY_ID.get(h.id);
    if (!d?.tie || !h.tieName) continue;
    const bond = d.tie.bond === 'rival' ? -25 : d.tie.bond === 'debt' ? -5 : 30;
    out.push(...personEvents(s, h.tieName, d.tie.who, bond, tieRole(d.tie.bond, s.character.path), d.tie.bond === 'patron' || d.tie.bond === 'debt' ? 'independent' : d.tie.bond === 'family' || d.tie.bond === 'ward' ? 'civilian' : (FACTION_BY_PATH[s.character.path] ?? 'civilian'), d.tie.bond === 'ward' ? Math.max(4, ageNow(s) - 5) : d.tie.bond === 'family' || d.tie.bond === 'patron' || d.tie.bond === 'mentor' ? ageNow(s) + 25 : ageNow(s)));
  }
  return out;
}

const QUIZ_ROLE: Readonly<Record<string, string>> = { initiate: 'initiate', padawan: 'padawan', sith: 'sithAcolyte', military: 'soldier', street: 'civilian', noble: 'civilian', spacer: 'civilian', anyone: 'civilian' };

/**
 * A quiz person's role and faction now (m8-fixes G4): someone outside the Order is a civilian; an elder by their words (a sergeant
 * a soldier, an officer an officer, a Sith Lord, an agent or pirate a criminal, a servant); a peer of the Order's sets is what the
 * character's age makes them now (an initiate clanmate of a 14-year-old is a Padawan too).
 */
function quizPersonPlace(kind: QuizPersonKind, set: string, who: string, path: string, age: number): { role: string; faction: string } {
  const own = FACTION_BY_PATH[path] ?? 'civilian';
  if (kind === 'outside') return { role: 'civilian', faction: 'civilian' };
  if (kind === 'elder') {
    if (/sergeant/i.test(who)) return { role: 'soldier', faction: own === 'civilian' ? 'republic' : own };
    if (/officer/i.test(who)) return { role: 'officer', faction: path === 'sith' ? 'sithEmpire' : own === 'civilian' ? 'republic' : own };
    if (/sith lord/i.test(who)) return { role: 'sithLord', faction: 'sith' };
    if (/agent|pirate|gang/i.test(who)) return { role: 'criminal', faction: 'underworld' };
    if (/servant/i.test(who)) return { role: 'servant', faction: 'civilian' };
    if (/dockmaster/i.test(who)) return { role: 'merchant', faction: 'civilian' };
    return { role: 'official', faction: 'independent' };
  }
  const role = set === 'initiate' && age >= 13 ? 'padawan' : (QUIZ_ROLE[set] ?? 'civilian');
  return { role, faction: set === 'initiate' || set === 'padawan' ? 'jediOrder' : set === 'sith' ? 'sith' : set === 'military' ? (own === 'civilian' ? 'republic' : own) : 'civilian' };
}

function handleQuiz(slice: TraitsSlice, e: GameEvent, s: GameState): R {
  if (slice.quiz.status !== 'due') return { reject: slice.quiz.status === 'taken' ? 'the formative quiz was already taken: it is never taken again' : slice.quiz.status === 'never' ? 'this save has no formative quiz' : 'the formative quiz is not due yet (a youngling takes it at the first long skip)' };
  const q = selectQuizInput(s);
  if (!q) return { reject: 'no quiz window' };
  const plan = quizPlan(q);
  const answers = (e['answers'] as { eventId: string; choiceId: string; note?: string }[]) ?? [];
  const day = s.clock.now.day;
  // An empty answer list declines the quiz: it is over, never offered again.
  if (!answers.length) return { slice: { ...slice, quiz: { status: 'taken', seed: slice.quiz.seed } }, notes: ['the formative quiz was declined'] };
  const errors = quizAnswerErrors(plan, answers);
  if (errors.length) return { reject: errors.join('; ') };
  const r = scoreQuiz(answers, slice.quiz.seed);
  const emit: GameEvent[] = [];
  const notes: string[] = [`formative quiz: ${answers.length} scenes`];
  for (const f of [...r.facts, ...r.notes.map((n) => `The player adds: ${n}`)]) emit.push({ type: 'factLearned', aboutRef: 'pc', fact: f.slice(0, 200), importance: 'minor' });
  for (const f of r.flags) emit.push({ type: 'flagSet', flag: f });
  // The people: named, introduced, their bond seeded. A tie the player accepts links to the first person who points to it.
  const used = [s.character.name, ...Object.values(s.npcs.byId).map((n) => n.name), ...slice.held.flatMap((h) => (h.tieName ? [h.tieName] : []))];
  const named: (QuizPerson & { name: string })[] = [];
  for (const p of r.people) {
    const ev = FORMATIVE_EVENT_BY_ID.get(p.eventId)!;
    const name = tieName(`${slice.quiz.seed}:${p.eventId}`, used);
    used.push(name);
    named.push({ ...p, name });
    // The person fits the scene and the tie (m8-fixes G4), at the age they are now (G5); the player's note on that scene is
    // read for a relation and a homeworld, and kept on the NPC as plain words for the narrator.
    const kind = quizPersonKind(p);
    const note = answers.find((a) => a.eventId === p.eventId)?.note?.trim() ?? '';
    const read = note ? readPersonNote(note, (w) => planetByName(w)?.name ?? null) : {};
    const who = kind === 'outside' && read.relation ? `${p.who}: their ${read.relation}` : p.who;
    const { role, faction } = quizPersonPlace(kind, ev.set, p.who, s.character.path, ageNow(s));
    emit.push(...personEvents(s, name, who, p.bond, role, faction, quizPersonAge(kind, ageNow(s), read)));
    if (note || read.relation || read.homeworld) emit.push({ type: 'npcBackgroundSet', npcRef: name, ...(read.relation ? { relation: read.relation } : {}), ...(read.homeworld ? { homeworld: read.homeworld } : {}), ...(note ? { playerNote: note.slice(0, 200) } : {}) });
  }
  let held = [...slice.held];
  const history = [...slice.history];
  // The scars a dated event gives (the Sacking, a first battle in a war): recorded, on top of the chosen traits.
  for (const id of r.givenScars) {
    if (held.some((h) => h.id === id)) continue;
    held.push({ id, since: day, source: 'quiz' });
    history.push({ day, change: 'added', id, why: 'given by a formative event' });
  }
  // The player's acceptance or swap of the suggestions: the temperament and the scar or tie (the origin stays).
  const pick = e['traits'] as { temperament?: string; scarOrTie?: string; fourth?: string } | undefined;
  if (pick) {
    const kindOf = (id: string) => TRAIT_BY_ID.get(id)?.kind;
    const cur = { origin: held.find((h) => kindOf(h.id) === 'origin' && h.source === 'creation')?.id ?? '', temperament: held.find((h) => kindOf(h.id) === 'temperament' && h.source === 'creation')?.id ?? '', scarOrTie: held.find((h) => (kindOf(h.id) === 'scar' || kindOf(h.id) === 'tie') && h.source === 'creation')?.id ?? '' };
    const next = { origin: cur.origin, temperament: pick.temperament ?? cur.temperament, scarOrTie: pick.scarOrTie ?? cur.scarOrTie, ...(pick.fourth ? { fourth: pick.fourth } : {}) };
    const errs = traitChoiceErrors(next, { ...selectTraitContext(s), origin: cur.origin });
    if (errs.length) return { reject: errs.join(' ') };
    for (const [slot, id] of [['temperament', next.temperament], ['scarOrTie', next.scarOrTie], ['fourth', next.fourth]] as const) {
      if (!id || held.some((h) => h.id === id)) continue;
      const old = slot === 'fourth' ? undefined : (cur as Record<string, string>)[slot];
      if (old) held = held.filter((h) => h.id !== old);
      const link = named.find((p) => p.tie === id);
      const tieN = TRAIT_BY_ID.get(id)?.tie ? (link?.name ?? tieName(`${slice.quiz.seed}:${id}`, used)) : undefined;
      if (tieN && !link) {
        used.push(tieN);
        const d = TRAIT_BY_ID.get(id)!;
        // Family and wards are outside the Order (m8-fixes G4), at a sensible age.
        const fam = d.tie!.bond === 'family' || d.tie!.bond === 'ward';
        emit.push(...personEvents(s, tieN, d.tie!.who, d.tie!.bond === 'rival' ? -25 : 30, tieRole(d.tie!.bond, s.character.path), fam ? 'civilian' : (FACTION_BY_PATH[s.character.path] ?? 'civilian'), d.tie!.bond === 'ward' ? Math.max(4, ageNow(s) - 5) : d.tie!.bond === 'family' ? ageNow(s) + 5 : ageNow(s)));
      }
      held.push({ id, since: day, source: 'quiz', ...(tieN ? { tieName: tieN } : {}) });
      history.push({ day, change: old ? 'replaced' : 'added', id, why: old ? `the formative quiz's suggestion, in place of ${TRAIT_BY_ID.get(old)?.name ?? old}` : "the formative quiz's suggestion" });
    }
  }
  const standing: Record<string, number> = { ...slice.standing };
  for (const [g, v] of Object.entries(r.standing)) standing[g] = Math.max(-QUIZ_LIMITS.standingTotal, Math.min(QUIZ_LIMITS.standingTotal, (standing[g] ?? 0) + v));
  notes.push(`alignment ${r.align >= 0 ? '+' : ''}${r.align}, dark pressure ${r.dark >= 0 ? '+' : ''}${r.dark}${Object.keys(r.standing).length ? `, standing ${Object.entries(r.standing).map(([g, v]) => `${g} ${v! >= 0 ? '+' : ''}${v}`).join(', ')}` : ''} (for the alignment system and the factions)`);
  return {
    slice: { ...slice, held, history, standing, leans: r.leans, alignmentNudge: r.align, darkPressureNudge: r.dark, quiz: { status: 'taken', seed: slice.quiz.seed } },
    emit,
    notes,
  };
}

function addTrait(slice: TraitsSlice, id: string, day: number, why: string): R {
  if (slice.held.some((h) => h.id === id)) return { slice, notes: [`${TRAIT_BY_ID.get(id)!.name} is already held`] };
  return { slice: { ...slice, held: [...slice.held, { id, since: day, source: 'event' }], history: [...slice.history, { day, change: 'added', id, why: why.slice(0, 160) }] }, notes: [`trait added: ${TRAIT_BY_ID.get(id)!.name} (${why})`] };
}

const traitMomentSchema = z.object({
  type: z.literal('traitMoment'),
  moment: z.enum(TRAIT_MOMENTS),
  traitId: z.string().max(40).optional(),
  toward: z.string().max(40).optional(),
  why: z.string().max(120).optional(),
});

/**
 * The moments that can change something for this character now (opt-1 A2), in the handler's own terms: a scar not yet held (a brush
 * with the dark side only on a Force path); a fear faced for a held scar whose fear is not overcome; an ideal broken for Idealistic;
 * a temperament tested for a held temperament; a rival outdoing them for a held Rival tie.
 */
export function momentsThatCanFire(s: GameState): Moment[] {
  const held = s.traits.held;
  const has = (id: string): boolean => held.some((h) => h.id === id);
  return TRAIT_MOMENTS.filter((m) => {
    const scar = MOMENT_SCAR[m];
    if (scar) return !has(scar) && !(scar === 'brushWithDark' && s.character.path === 'career');
    if (m === 'fearFaced') return held.some((h) => !h.overcome && TRAIT_BY_ID.get(h.id)?.fear !== undefined);
    if (m === 'idealBroken') return has('idealistic');
    if (m === 'temperamentTested') return held.some((h) => TRAIT_BY_ID.get(h.id)?.kind === 'temperament');
    if (m === 'rivalOutdid') return has('rival');
    return true;
  });
}

function handleMoment(slice: TraitsSlice, e: GameEvent, s: GameState): R {
  const moment = e['moment'] as Moment;
  const day = s.clock.now.day;
  const why = String(e['why'] ?? moment);
  const traitId = typeof e['traitId'] === 'string' ? (e['traitId'] as string) : undefined;
  const scar = MOMENT_SCAR[moment];
  if (scar) {
    if (scar === 'brushWithDark' && s.character.path === 'career') return { reject: 'a brush with the dark side needs a Force path' };
    return addTrait(slice, scar, day, why);
  }
  switch (moment) {
    case 'fearFaced': {
      const h = slice.held.find((x) => x.id === traitId);
      const d = traitId ? TRAIT_BY_ID.get(traitId) : undefined;
      if (!h || !d?.fear) return { reject: 'name a held scar with a fear (traitId): war veteran, former prisoner, disaster survivor' };
      if (h.overcome) return { slice, notes: [`${d.name}: the fear is already overcome`] };
      const n = (slice.counts[`fear:${h.id}`] ?? 0) + 1;
      const counts = { ...slice.counts, [`fear:${h.id}`]: n };
      if (n < FEAR_FACED_TO_OVERCOME) return { slice: { ...slice, counts }, notes: [`${d.name}: faced ${d.fear} (${n} of ${FEAR_FACED_TO_OVERCOME})`] };
      return {
        slice: { ...slice, counts, held: slice.held.map((x) => (x.id === h.id ? { ...x, overcome: true as const } : x)), history: [...slice.history, { day, change: 'overcome', id: h.id, why: `faced ${d.fear} ${n} times` }] },
        notes: [`${d.name}: the fear of ${d.fear} is overcome (the bad side is gone; the good side stays)`],
      };
    }
    case 'idealBroken': {
      if (!slice.held.some((h) => h.id === 'idealistic')) return { reject: 'only an Idealistic character can have an ideal broken' };
      return { slice: { ...slice, held: slice.held.filter((h) => h.id !== 'idealistic'), history: [...slice.history, { day, change: 'removed', id: 'idealistic', why }] }, notes: ['Idealistic is lost: a broken ideal'] };
    }
    case 'temperamentTested': {
      const toward = typeof e['toward'] === 'string' ? (e['toward'] as string) : '';
      const from = slice.held.find((h) => h.id === traitId && TRAIT_BY_ID.get(h.id)?.kind === 'temperament');
      if (!from || TRAIT_BY_ID.get(toward)?.kind !== 'temperament' || toward === from.id) return { reject: 'name a held temperament (traitId) and the temperament it is tested toward (toward)' };
      if (slice.held.some((h) => h.id === toward)) return { slice, notes: [`${TRAIT_BY_ID.get(toward)!.name} is already held`] };
      const key = `temper:${from.id}>${toward}`;
      const n = (slice.counts[key] ?? 0) + 1;
      const counts = { ...slice.counts, [key]: n };
      if (n < TEMPERAMENT_SHIFT_MOMENTS) return { slice: { ...slice, counts }, notes: [`${TRAIT_BY_ID.get(from.id)!.name} tested toward ${TRAIT_BY_ID.get(toward)!.name} (${n} of ${TEMPERAMENT_SHIFT_MOMENTS})`] };
      return {
        slice: { ...slice, counts, held: slice.held.map((h) => (h.id === from.id ? { id: toward, since: day, source: 'event' as const } : h)), history: [...slice.history, { day, change: 'replaced', id: toward, why: `${TRAIT_BY_ID.get(from.id)!.name} gave way after ${n} recorded moments` }] },
        notes: [`temperament changed: ${TRAIT_BY_ID.get(from.id)!.name} -> ${TRAIT_BY_ID.get(toward)!.name}`],
      };
    }
    case 'rivalOutdid':
      if (!slice.held.some((h) => h.id === 'rival')) return { reject: 'no Rival tie held' };
      return { slice: { ...slice, rivalSpurUntil: day + RIVAL_SPUR.days }, notes: [`the rival outdid the character: learning +${Math.round((RIVAL_SPUR.factor - 1) * 100)}% for ${RIVAL_SPUR.days} days`] };
    default:
      return { reject: `unknown moment ${String(moment)}` };
  }
}

export const traitsFeature: FeatureModule<TraitsSlice, GameState> = {
  id: 'traits',
  version: 1,
  initialState: initialTraits,
  // An old save: no traits, no quiz, and neither offered later.
  emptyState: () => emptyTraits(),
  stateSchema: traitsSliceSchema,
  events: {
    /**
     * Engine (at creation) or player (a youngling's quiz after the first long skip): the formative quiz's answers, one per
     * scene, and the traits the player accepts or swaps in from the suggestions. Empty answers decline it. The code re-draws
     * the scenes and decides every effect; the quiz runs once.
     */
    formativeQuizTaken: {
      schema: z.object({
        type: z.literal('formativeQuizTaken'),
        answers: z.array(z.object({ eventId: z.string().max(40), choiceId: z.string().max(20), note: z.string().max(QUIZ_LIMITS.noteMax).optional() })).max(QUIZ_LIMITS.maxScenes),
        traits: z.object({ temperament: z.string().max(40).optional(), scarOrTie: z.string().max(40).optional(), fourth: z.string().max(40).optional() }).optional(),
      }),
      sources: ['engine', 'player'],
      handle: (slice, e, ctx) => handleQuiz(slice, e, ctx.state),
    },
    /**
     * AI: a recorded moment that may change a trait (the code counts and decides): fearFaced (a held scar's fear; traitId),
     * betrayed, massacre, familyLost, imprisoned, darkBrush, firstKill, publicFailure, disaster, exiled (each adds its scar),
     * idealBroken, temperamentTested (traitId and toward), rivalOutdid.
     */
    traitMoment: {
      schema: traitMomentSchema,
      sources: ['ai', 'engine'],
      // opt-1 A2 (Jared, 26 Nov 2026; D-529): sent only when a moment can fire for this character, with only those moments (and
      // traitId / toward only when a moment that names a held trait is among them). Nothing that could fire is left out, so no
      // outcome changes: a scar already held, Idealistic not held and the like were refused or a no-op before.
      narrative: (s) => (s as { traits?: TraitsSlice }).traits !== undefined && s.traits.quiz.status !== 'never' && momentsThatCanFire(s).length > 0,
      wire: (s) => {
        const can = momentsThatCanFire(s);
        const named = can.some((m) => m === 'fearFaced' || m === 'temperamentTested');
        const base = z.object({ type: z.literal('traitMoment'), moment: z.enum(can as [Moment, ...Moment[]]), why: z.string().max(120).optional() });
        return named ? base.extend({ traitId: z.string().max(40).optional(), toward: z.string().max(40).optional() }) : base;
      },
      handle: (slice, e, ctx) => handleMoment(slice, e, ctx.state),
    },
    /** Engine: a tie's person died (npcs' npcDied): the tie ends. */
    tieEnded: {
      schema: z.object({ type: z.literal('tieEnded'), name: z.string().max(80) }),
      sources: ['engine'],
      handle: (slice, e, ctx) => {
        const name = String(e['name']).toLowerCase();
        const h = slice.held.find((x) => x.tieName?.toLowerCase() === name);
        if (!h) return { slice };
        const day = ctx.state.clock.now.day;
        return { slice: { ...slice, held: slice.held.filter((x) => x !== h), history: [...slice.history, { day, change: 'removed', id: h.id, why: `${h.tieName} died` }] }, notes: [`the ${TRAIT_BY_ID.get(h.id)!.name} tie ends: ${h.tieName} is dead`] };
      },
    },
  },
  // A youngling's quiz comes due with the first skip of a year or more (resumed within a few days of an interruption);
  // it covers the skipped years.
  onTimeAdvanced: (slice, step, ctx) => {
    if (slice.quiz.status !== 'pending' && !(slice.quiz.status === 'due' && slice.quiz.jumpTo !== undefined)) return { slice };
    if (!step.jump) return { slice };
    const from = fromAbsSecond(step.fromAbs).day;
    const to = fromAbsSecond(step.toAbs).day;
    // A skip broken by an interruption scene and resumed within QUIZ_SKIP_GAP_DAYS counts as one skip.
    const contiguous = slice.quiz.jumpTo !== undefined && from - slice.quiz.jumpTo <= QUIZ_SKIP_GAP_DAYS;
    const birth = ctx.state.character.birthDay;
    // Due and the same skip still running: the window grows with it until the quiz is taken.
    if (slice.quiz.status === 'due') return contiguous ? { slice: { ...slice, quiz: { ...slice.quiz, jumpTo: to, toAge: (to - birth) / DAYS_PER_YEAR } } } : { slice };
    const jumpFrom = contiguous ? slice.quiz.jumpFrom! : from;
    if (to - jumpFrom < QUIZ_SKIP_DAYS) return { slice: { ...slice, quiz: { ...slice.quiz, jumpFrom, jumpTo: to } } };
    return { slice: { ...slice, quiz: { status: 'due', seed: slice.quiz.seed, jumpFrom, jumpTo: to, fromAge: (jumpFrom - birth) / DAYS_PER_YEAR, toAge: (to - birth) / DAYS_PER_YEAR } }, notices: ['The formative quiz is due: the skipped years can be played as scenes.'] };
  },
  selectors: {},
  promptSection: (s) => {
    const lines = selectTraitLines(s, selectPresentNpcIds(s));
    return lines.length ? lines.join('\n') : null;
  },
};

