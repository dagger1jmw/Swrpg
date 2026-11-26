// Starting traits and the formative quiz on screen (M8 checklist item 16; spec/traits.md section 10). Rendering only: the
// lists come from the gates (eligibleTraits), the scenes from quizPlan, the suggestions from suggestTraits; the code decides
// every effect when the campaign is created or the quiz event is applied.
import { FORMATIVE_EVENT_BY_ID } from '../data/formativeEvents';
import { TRAIT_BY_ID, type TraitDef, type TraitKind } from '../data/traits';
import { backstoryLeans, CONFLICTS, eligibleTraits, scoreQuiz, suggestTraits, type QuizAnswer, type QuizPlan, type TraitChoice, type TraitContext } from '../features/traits/selectors';
import { SKILL_BY_ID } from '../data/skills';
import { el, input } from './dom';

const option = (value: string, text: string): HTMLOptionElement => el('option', { text, attrs: { value } });
const describe = (t: TraitDef): string => `${t.name}: ${t.good}. But: ${t.bad}.`;

export interface TraitsStep {
  fields: HTMLElement[];
  /** The choice as it stands (undefined until an origin, a temperament and a scar or tie are picked). */
  read(): TraitChoice | undefined;
  /** Refill the lists for the current dates, path and species. */
  refresh(): void;
  /** Put the quiz's suggestions in the temperament and scar-or-tie slots. */
  apply(s: { temperament?: string | null; scarOrTie?: string | null }): void;
}

/** The creation step: an origin, a temperament, a scar or tie and an optional flaw-heavy fourth, filtered by the gates. */
export function traitsStep(ctxOf: () => TraitContext | null): TraitsStep {
  const origin = el('select', { attrs: { 'aria-label': 'Origin' } });
  const temperament = el('select', { attrs: { 'aria-label': 'Temperament' } });
  const scarOrTie = el('select', { attrs: { 'aria-label': 'Scar or tie' } });
  const fourth = el('select', { attrs: { 'aria-label': 'Optional fourth trait (flaw-heavy)' } });
  const homeworld = input({ type: 'text', maxlength: '60', placeholder: 'Optional (e.g. Coruscant)', 'aria-label': 'Homeworld' });
  const mentorField = el('select', { attrs: { 'aria-label': "Mentor's field" } }, ['tactics', 'piloting', 'repair', 'medicine', 'melee', 'blaster', 'stealth', 'investigation', 'intelligence', 'charisma', 'forceKnowledge', 'meditation'].map((k) => option(k, SKILL_BY_ID.get(k)?.name ?? k)));
  const mentorBox = el('div', { class: 'field' }, [el('label', { text: "Mentor's field" }), mentorField]);
  const notes = el('p', { class: 'hint' });
  const ctxNow = (): TraitContext | null => {
    const c = ctxOf();
    return c ? { ...c, origin: origin.value || undefined, ...(homeworld.value.trim() ? { homeworld: homeworld.value.trim() } : {}) } as TraitContext : null;
  };
  const fill = (sel: HTMLSelectElement, list: TraitDef[], blank?: string): void => {
    const keep = sel.value;
    sel.replaceChildren(...(blank ? [option('', blank)] : []), ...list.map((t) => option(t.id, t.name)));
    sel.value = list.some((t) => t.id === keep) ? keep : blank ? '' : (list[0]?.id ?? '');
  };
  const describeAll = (): void => {
    const ids = [origin.value, temperament.value, scarOrTie.value, fourth.value].filter(Boolean);
    const clash = CONFLICTS.find(([a, b]) => ids.includes(a) && ids.includes(b));
    notes.textContent = [...ids.map((id) => describe(TRAIT_BY_ID.get(id)!)), ...(clash ? [`${TRAIT_BY_ID.get(clash[0])!.name} and ${TRAIT_BY_ID.get(clash[1])!.name} contradict each other.`] : [])].join(' ');
    mentorBox.hidden = !ids.includes('outsideMentor');
  };
  const refresh = (): void => {
    const c = ctxOf();
    if (!c) return;
    const of = (k: TraitKind[]): TraitDef[] => k.flatMap((x) => eligibleTraits({ ...c, origin: origin.value || undefined, ...(homeworld.value.trim() ? { homeworld: homeworld.value.trim() } : {}) } as TraitContext, x));
    fill(origin, of(['origin']));
    fill(temperament, of(['temperament']));
    fill(scarOrTie, of(['scar', 'tie']));
    fill(fourth, of(['temperament', 'scar', 'tie']).filter((t) => t.flawHeavy), 'None');
    describeAll();
  };
  for (const s of [origin, temperament, scarOrTie, fourth, mentorField]) s.addEventListener('change', () => (s === origin ? refresh() : describeAll()));
  homeworld.addEventListener('input', refresh);
  const apply = (s: { temperament?: string | null; scarOrTie?: string | null }): void => {
    if (s.temperament && [...temperament.options].some((o) => o.value === s.temperament)) temperament.value = s.temperament;
    if (s.scarOrTie && [...scarOrTie.options].some((o) => o.value === s.scarOrTie)) scarOrTie.value = s.scarOrTie;
    describeAll();
  };
  const suggest = el('button', {
    class: 'secondary',
    text: 'Suggest from my backstory',
    on: {
      click: () => {
        const c = ctxNow();
        if (c) apply(suggestTraits(backstoryLeans(c), c, origin.value));
      },
    },
  });
  return {
    fields: [
      el('div', { class: 'field-label', text: 'Traits: one origin, one temperament, one scar or tie (an optional flaw-heavy fourth)' }),
      el('div', { class: 'field' }, [el('label', { text: 'Homeworld' }), homeworld]),
      el('div', { class: 'field' }, [el('label', { text: 'Origin' }), origin]),
      el('div', { class: 'field' }, [el('label', { text: 'Temperament' }), temperament]),
      el('div', { class: 'field' }, [el('label', { text: 'Scar or tie' }), scarOrTie]),
      el('div', { class: 'field' }, [el('label', { text: 'Fourth (optional)' }), fourth]),
      mentorBox,
      el('div', { class: 'row' }, [suggest]),
      notes,
      el('p', { class: 'hint', text: 'A youngling start plays its first days and takes the formative quiz at the first long skip; an older start takes it before the story begins.' }),
    ],
    read: () =>
      origin.value && temperament.value && scarOrTie.value
        ? { origin: origin.value, temperament: temperament.value, scarOrTie: scarOrTie.value, ...(fourth.value ? { fourth: fourth.value } : {}), ...(homeworld.value.trim() ? { homeworld: homeworld.value.trim() } : {}), ...(!mentorBox.hidden ? { mentorField: mentorField.value } : {}) }
        : undefined,
    refresh,
    apply,
  };
}

export interface QuizDone {
  answers: QuizAnswer[];
  /** The traits accepted from the suggestions (absent: kept as chosen). */
  traits?: { temperament?: string; scarOrTie?: string };
}

/**
 * The quiz screens: one scene at a time (3 or 4 fixed choices and an optional line of the player's own), then the
 * suggestions to accept or keep. Self-contained: it redraws its own box.
 */
export function quizScreens(plan: QuizPlan, opts: { seed: string; ctx: TraitContext; origin: string; current?: { temperament: string; scarOrTie: string }; onDone(d: QuizDone): void; onDecline(): void }): HTMLElement {
  const box = el('div', { class: 'card quiz' });
  const answers: QuizAnswer[] = [];
  const draw = (): void => {
    const i = answers.length;
    if (i < plan.events.length) {
      const e = FORMATIVE_EVENT_BY_ID.get(plan.events[i]!)!;
      const note = input({ type: 'text', maxlength: '120', placeholder: 'Optional: a line of your own (colour for the narrator)', 'aria-label': 'Your note' });
      box.replaceChildren(
        el('p', { class: 'hint', text: `Formative years: scene ${i + 1} of ${plan.events.length}` }),
        el('strong', { text: e.title }),
        el('p', { text: e.text }),
        ...e.choices.map((c) => el('button', { class: 'choice', text: c.label, on: { click: () => (answers.push({ eventId: e.id, choiceId: c.id, ...(note.value.trim() ? { note: note.value.trim() } : {}) }), draw()) } })),
        note,
        el('div', { class: 'row' }, [el('button', { class: 'secondary', text: 'Skip the quiz', on: { click: () => opts.onDecline() } })]),
      );
      return;
    }
    const r = scoreQuiz(answers, opts.seed);
    const s = suggestTraits(r.leans, opts.ctx, opts.origin);
    const name = (id: string | null | undefined): string => (id ? (TRAIT_BY_ID.get(id)?.name ?? id) : 'none');
    const changed = (s.temperament && s.temperament !== opts.current?.temperament) || (s.scarOrTie && s.scarOrTie !== opts.current?.scarOrTie);
    box.replaceChildren(
      el('strong', { text: 'What those years made of you' }),
      ...r.facts.map((f) => el('p', { class: 'hint', text: f })),
      el('p', { text: `Suggested: ${name(s.temperament)} as a temperament; ${name(s.scarOrTie)} as a scar or tie.${r.givenScars.length ? ` Given by what you lived through: ${r.givenScars.map(name).join(', ')}.` : ''}` }),
      el('div', { class: 'row actions' }, [
        ...(changed ? [el('button', { text: 'Accept the suggestions', on: { click: () => opts.onDone({ answers, traits: { ...(s.temperament ? { temperament: s.temperament } : {}), ...(s.scarOrTie ? { scarOrTie: s.scarOrTie } : {}) } }) } })] : []),
        el('button', { class: changed ? 'secondary' : '', text: 'Keep my traits', on: { click: () => opts.onDone({ answers }) } }),
      ]),
    );
  };
  draw();
  return box;
}
