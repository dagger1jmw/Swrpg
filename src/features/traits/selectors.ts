// Traits selectors (spec/traits.md): what the other features read. Every reader goes through here; nothing stores a derived value.
import { TRAIT_BY_ID, type TraitSituation } from '../../data/traits';
import { dateFromAbsDay } from '../../engine/calendar';
import type { GameState } from '../../state/gameState';
import { selectLocationChain, selectCurrentLocationId } from '../locations/selectors';
import { selectNpc } from '../npcs/selectors';
import {
  canonNpcTraits,
  generatedNpcTraits,
  npcKindsOf,
  onCoruscant3653,
  quizPlan,
  quizTrack,
  traitLearning,
  traitPressure,
  traitReaction,
  traitRollMod,
  type QuizInput,
  type QuizPlan,
  type TraitContext,
  type TraitHolding,
} from './rules';
import { emptyTraits, type TraitsSlice } from './traits';

/** The slice (a state built without the feature, as some tests do, reads as an empty one). */
export const selectTraitsSlice = (s: GameState): TraitsSlice => (s as { traits?: TraitsSlice }).traits ?? emptyTraits();
export const selectTraitHoldings = (s: GameState): readonly TraitHolding[] => selectTraitsSlice(s).held;
export const selectTraitIds = (s: GameState): string[] => selectTraitHoldings(s).map((h) => h.id);
export const selectHasTrait = (s: GameState, id: string): boolean => selectTraitIds(s).includes(id);

/** What the gates read, from the state. */
export function selectTraitContext(s: GameState): TraitContext {
  const c = s.character;
  const slice = selectTraitsSlice(s);
  const origin = slice.held.find((h) => TRAIT_BY_ID.get(h.id)?.kind === 'origin')?.id;
  return {
    path: c.path,
    speciesId: c.speciesId,
    archetype: c.archetype,
    birthYear: dateFromAbsDay(c.birthDay).year,
    startYear: dateFromAbsDay(s.clock.now.day).year,
    trainingStartAge: c.trainingStartAge ?? 99,
    ...(slice.homeworld ? { homeworld: slice.homeworld } : {}),
    ...(c.start?.imperialBorn ? { imperialBorn: true } : {}),
    ...(origin ? { origin } : {}),
  };
}

/** The learning factor per skill (training, or XP from play), with the rival's spur while it runs. */
export function selectTraitLearning(s: GameState): (skillId: string, play?: boolean) => number {
  const held = selectTraitHoldings(s);
  if (!held.length) return () => 1;
  const spur = (selectTraitsSlice(s).rivalSpurUntil ?? -Infinity) >= s.clock.now.day;
  return (skillId, play = false) => traitLearning(held, skillId, { play, rivalSpur: spur });
}

/** Whether the character stands in a city now (a city, district, building or room under one). */
export function selectInCity(s: GameState): boolean {
  return selectLocationChain(s, selectCurrentLocationId(s)).some((l) => l.kind === 'city');
}

/** An NPC's traits: the lore's for a canon figure on the list, else one or two drawn from the campaign seed. */
export function selectNpcTraitIds(s: GameState, npcId: string): string[] {
  const n = selectNpc(s, npcId);
  if (!n) return [];
  if (n.canonId) return canonNpcTraits(n.canonId) ?? [];
  return generatedNpcTraits(`${s.meta.campaignId}:${npcId}`);
}
export const selectNpcTraitHoldings = (s: GameState, npcId: string): TraitHolding[] => selectNpcTraitIds(s, npcId).map((id) => ({ id, since: 0, source: 'creation' }));

/**
 * The traits' modifier on a check (spec/traits.md section 3): the situations named and seen, plus the reaction with the NPC
 * targets; held to +-2 in all. Parts are listed for the roll card.
 */
export function selectCheckTraitMod(s: GameState, c: { skillId: string | null; situation?: TraitSituation; npcTargets: readonly string[] }): { total: number; label: string } {
  const held = selectTraitHoldings(s);
  if (!held.length) return { total: 0, label: '' };
  const situations: TraitSituation[] = c.situation ? [c.situation] : [];
  if ((c.skillId === 'stealth' || c.skillId === 'investigation') && selectInCity(s)) situations.push('cityStreet');
  const roll = traitRollMod(held, situations);
  const social = c.skillId === 'charisma' || c.skillId === 'willpower' ? c.npcTargets.map((id) => selectNpc(s, id)).filter((n) => n !== null) : [];
  const reaction = social.length ? traitReaction(held, npcKindsOf(social[0]!)) : 0;
  const total = Math.max(-2, Math.min(2, roll.total + reaction));
  const names = [...new Set(roll.parts.map((p) => TRAIT_BY_ID.get(p.trait)!.name))];
  return { total, label: `traits (${[...names, ...(reaction ? [`reaction ${reaction > 0 ? '+' : ''}${reaction}`] : [])].join(', ')})` };
}

/** An NPC's modifier against the player's mind trick (its own traits: Stubborn +2). */
export function selectNpcMindTrickResist(s: GameState, npcId: string): number {
  return traitRollMod(selectNpcTraitHoldings(s, npcId), ['mindTrick']).total;
}

/** The alignment system's inputs (M6 reads them; spec/traits.md section 5): the pressures and the quiz's nudges. */
export function selectTraitAlignment(s: GameState) {
  const slice = selectTraitsSlice(s);
  const pressure = traitPressure(slice.held);
  return { pressure, alignmentNudge: slice.alignmentNudge, darkPressureNudge: slice.darkPressureNudge, startDarkPressure: slice.darkPressureNudge + pressure.startDarkPressure };
}

/** The quiz's standing with the Order (ranks reads it: a little standing, spec/traits.md section 7). */
export const selectFormativeStanding = (s: GameState, group: 'order' | 'academy' | 'unit' | 'community'): number => selectTraitsSlice(s).standing[group] ?? 0;

/** The due quiz's inputs from the state (a youngling's skipped years), or null. */
export function selectQuizInput(s: GameState): QuizInput | null {
  const slice = selectTraitsSlice(s);
  if (slice.quiz.status !== 'due' || slice.quiz.fromAge === undefined || slice.quiz.toAge === undefined) return null;
  const ctx = selectTraitContext(s);
  return {
    track: quizTrack(ctx.path, ctx.archetype),
    fromAge: slice.quiz.fromAge,
    toAge: slice.quiz.toAge,
    birthYear: ctx.birthYear,
    origin: ctx.origin ?? '',
    forceSensitive: ctx.path !== 'career',
    atCoruscant3653: onCoruscant3653(ctx),
    seed: slice.quiz.seed,
  };
}

/** The due quiz's scenes, or null (none due). */
export function selectQuizPlan(s: GameState): QuizPlan | null {
  const q = selectQuizInput(s);
  return q ? quizPlan(q) : null;
}

/** One trait as the Character tab shows it (m8-fixes G3): its upside, downside, and the person it is tied to, if any. */
export interface TraitRow {
  id: string;
  name: string;
  kind: string;
  good: string;
  bad: string;
  note: string;
  /** The tied person: their name, and their NPC id when they are in play. */
  tie: { name: string; npcId: string | null } | null;
  /** How it came: chosen at creation, from the formative quiz, or from an event in play. */
  source: string;
}

/** The character's traits for the Character tab (m8-fixes G3), in the order origin, temperament, scar, tie. */
export function selectTraitRows(s: GameState): TraitRow[] {
  const order = ['origin', 'temperament', 'scar', 'tie'];
  return selectTraitHoldings(s)
    .map((h) => ({ h, d: TRAIT_BY_ID.get(h.id) }))
    .filter((x): x is { h: TraitHolding; d: NonNullable<typeof x.d> } => x.d !== undefined)
    .sort((a, b) => order.indexOf(a.d.kind) - order.indexOf(b.d.kind))
    .map(({ h, d }) => ({ id: d.id, name: d.name, kind: d.kind, good: d.good, bad: d.bad, note: d.note, tie: h.tieName ? { name: h.tieName, npcId: selectTieNpcId(s, d.id) } : null, source: h.source }));
}

/** A tie's NPC id (its name resolved by alias), or null. */
export function selectTieNpcId(s: GameState, traitId: string): string | null {
  const h = selectTraitHoldings(s).find((x) => x.id === traitId);
  if (!h?.tieName) return null;
  const name = h.tieName.toLowerCase();
  return Object.values(s.npcs.byId).find((n) => n.name.toLowerCase() === name)?.id ?? null;
}

/** Lines for the narrator (spec/traits.md section 10): the character's traits and the present NPCs', each with its note. */
export function selectTraitLines(s: GameState, presentNpcIds: readonly string[]): string[] {
  const out: string[] = [];
  const held = selectTraitHoldings(s);
  if (held.length) {
    out.push(
      `CHARACTER TRAITS (play them; the code applies their effects): ${held
        .map((h) => {
          const d = TRAIT_BY_ID.get(h.id)!;
          return `${d.name}${h.tieName ? ` (${h.tieName})` : ''}${h.overcome ? ' (fear overcome)' : ''}: ${d.note}`;
        })
        .join('; ')}`,
    );
  }
  for (const id of presentNpcIds) {
    const ids = selectNpcTraitIds(s, id);
    const n = selectNpc(s, id);
    if (!ids.length || !n) continue;
    out.push(`${n.name} (${id}) traits: ${ids.map((t) => `${TRAIT_BY_ID.get(t)!.name}: ${TRAIT_BY_ID.get(t)!.note}`).join('; ')}`);
  }
  return out;
}

// The pure rules the turn and the UI read (the import rule: they go through the feature's selectors).
export {
  backstoryLeans,
  CONFLICTS,
  eligibleTraits,
  isYounglingStart,
  onCoruscant3653,
  quizAnswerErrors,
  quizPlan,
  quizTrack,
  scoreQuiz,
  suggestTraits,
  traitChoiceErrors,
  traitGreyReason,
  traitRollMod,
  traitStartMoney,
} from './rules';
export type { QuizAnswer, QuizInput, QuizPlan, TraitChoice, TraitContext, TraitHolding } from './rules';
