// Character creation fields (character-creation.md §1, §3; M3 plan step 8): path, species, rank
// filtered by path and age, training start age, archetype with focus sliders that renormalize, 3
// talent points, dominant hand, war years, and a live preview of the computed levels with the rank
// check. Rendering only: the numbers come from computeCreation.
import { ARCHETYPE_BY_ID, PATH_ARCHETYPES, PATH_START_RANGE, type CharacterPath } from '../data/archetypes';
import { TALENT_COST, TALENT_LEVELS, TALENT_POINTS, type TalentLevel } from '../data/progression.config';
import { FORM_IDS, SKILL_BY_ID, TALENT_DOMAINS, type TalentDomain } from '../data/skills';
import { SPECIES } from '../data/species';
import { speciesDef } from '../data/species';
import { humanEquivalentAge, speciesAgeFromHuman } from '../engine/species';
import { computeCreation, defaultFocus, ranksFor, talentCost, type CreationInput } from '../features/character/selectors';
import { el, input } from './dom';

export type CreationChoices = Omit<CreationInput, 'name' | 'birthDay' | 'startDay'>;

const PATHS: { id: CharacterPath; label: string }[] = [
  { id: 'jedi', label: 'Jedi' },
  { id: 'sith', label: 'Sith' },
  { id: 'outsider', label: 'Force-sensitive outsider' },
  { id: 'career', label: 'Non-Force career' },
];
const DOMAIN_LABEL: Record<TalentDomain, string> = { combat: 'Combat', force: 'Force', physical: 'Physical', mind: 'Mind' };
const PREVIEW_SKILLS = ['forceControl', 'forceSense', 'willpower', 'endurance', 'strength', 'agility'];

const option = (value: string, text: string): HTMLOptionElement => el('option', { text, attrs: { value } });
const keyName = (k: string, main: string | null, second: string | null): string =>
  k === '$mainForm' ? `Main form${main ? ` (${SKILL_BY_ID.get(main)?.name})` : ''}` : k === '$secondForm' ? `Second form${second ? ` (${SKILL_BY_ID.get(second)?.name})` : ''}` : (SKILL_BY_ID.get(k)?.name ?? k);

export interface CreationForm {
  fields: HTMLElement[];
  /** The choices as they stand (null when the form cannot be read). */
  read(): CreationChoices;
  /** Recompute the preview for the given birth and start days. */
  update(birthDay: number | null, startDay: number | null, name: string): void;
}

export function creationForm(): CreationForm {
  const path = el('select', {}, PATHS.map((p) => option(p.id, p.label)));
  const species = el('select', {}, SPECIES.map((s) => option(s.id, s.name)));
  const rank = el('select');
  const archetype = el('select');
  const start = input({ type: 'number', min: '2', max: '40', step: '0.5', value: '4' });
  const mainForm = el('select', {}, FORM_IDS.map((f) => option(f, SKILL_BY_ID.get(f)!.name)));
  const secondForm = el('select', {}, [option('', 'none'), ...FORM_IDS.map((f) => option(f, SKILL_BY_ID.get(f)!.name))]);
  secondForm.value = 'soresu';
  const hand = el('select', {}, [option('right', 'Right'), option('left', 'Left')]);
  const war = input({ type: 'number', min: '0', max: '30', value: '0' });
  const exception = input({ type: 'checkbox' });
  // Talent bypass (D-116): off by default; turning it on needs an explicit confirmation.
  const ignoreLimit = input({ type: 'checkbox' });
  let bypassConfirmed = false;
  const bypassBox = el('div', { class: 'bypass' });
  const talentSel = Object.fromEntries(
    TALENT_DOMAINS.map((d) => [d, el('select', {}, TALENT_LEVELS.map((l) => option(l, `${l}${TALENT_COST[l] ? ` (${TALENT_COST[l]})` : ''}`)))]),
  ) as Record<TalentDomain, HTMLSelectElement>;
  const talentsLine = el('p', { class: 'hint' });
  const focusBox = el('div', { class: 'focus' });
  const preview = el('div', { class: 'card preview' });
  let focus: Record<string, number> = {};
  let focusArch = '';
  let last: { birthDay: number | null; startDay: number | null; name: string } = { birthDay: null, startDay: null, name: '' };

  const talents = (): Partial<Record<TalentDomain, TalentLevel>> => {
    const t: Partial<Record<TalentDomain, TalentLevel>> = {};
    for (const d of TALENT_DOMAINS) if (talentSel[d].value !== 'none') t[d] = talentSel[d].value as TalentLevel;
    return t;
  };

  const read = (): CreationChoices => ({
    speciesId: species.value,
    path: path.value as CharacterPath,
    archetype: archetype.value,
    rank: rank.value,
    trainingStartAge: Number(start.value),
    mainFormId: mainForm.value || null,
    secondFormId: secondForm.value && secondForm.value !== mainForm.value ? secondForm.value : null,
    ...(Object.keys(focus).length ? { focus } : {}),
    talents: talents(),
    warYears: Math.max(0, Math.trunc(Number(war.value) || 0)),
    dominantHand: hand.value as 'left' | 'right',
    storyException: exception.checked,
    ignoreTalentLimit: bypassConfirmed,
  });

  const renderFocus = (): void => {
    focusBox.replaceChildren();
    const a = ARCHETYPE_BY_ID.get(archetype.value);
    if (!a) return;
    if (focusArch !== a.id) {
      focus = defaultFocus(a);
      focusArch = a.id;
    }
    const rows = new Map<string, { slider: HTMLInputElement; label: HTMLElement }>();
    for (const [k, share] of Object.entries(focus)) {
      const slider = input({ type: 'range', min: '0', max: '100', step: '1', value: String(Math.round(share * 100)) });
      const label = el('span', { class: 'focus-share', text: `${Math.round(share * 100)}%` });
      rows.set(k, { slider, label });
      // 'input' fires while the slider moves, so the preview follows the drag. The other sliders are
      // updated in place (rebuilding them would end the drag).
      slider.addEventListener('input', () => {
        // Renormalize: the moved share is set, the others scale to fill the rest (shares sum to 1, D-44).
        const v = Math.min(1, Math.max(0, Number(slider.value) / 100));
        const others = Object.entries(focus).filter(([o]) => o !== k);
        const otherTotal = others.reduce((x, [, sh]) => x + sh, 0);
        const next: Record<string, number> = { [k]: v };
        for (const [o, sh] of others) next[o] = otherTotal > 0 ? (sh / otherTotal) * (1 - v) : (1 - v) / others.length;
        focus = Object.fromEntries(Object.keys(focus).map((o) => [o, next[o]!]));
        for (const [o, r] of rows) {
          if (o !== k) r.slider.value = String(Math.round(focus[o]! * 100));
          r.label.textContent = `${Math.round(focus[o]! * 100)}%`;
        }
        refresh();
      });
      focusBox.append(el('div', { class: 'focus-row' }, [el('label', { text: keyName(k, mainForm.value, secondForm.value) }), slider, label]));
    }
    focusBox.append(
      el('button', { class: 'small secondary', text: 'Reset focus', attrs: { type: 'button' }, on: { click: () => ((focusArch = ''), renderFocus(), refresh()) } }),
    );
  };

  const fillArchetypes = (): void => {
    const keep = archetype.value;
    const ids = PATH_ARCHETYPES[path.value as CharacterPath];
    archetype.replaceChildren(...ids.map((id) => option(id, ARCHETYPE_BY_ID.get(id)!.name)));
    if (ids.includes(keep)) archetype.value = keep;
    setStartBounds(!keep || !ids.includes(keep));
  };

  /** Start ages are entered in species years; the path range and defaults are Human-equivalent (species.md §1). */
  const toSpecies = (h: number): number => Math.round(speciesAgeFromHuman(speciesDef(species.value), h) * 2) / 2;
  const setStartBounds = (resetDefault: boolean): void => {
    const [lo, hi] = PATH_START_RANGE[path.value as CharacterPath];
    const sLo = toSpecies(lo);
    const sHi = toSpecies(hi);
    start.min = String(sLo);
    start.max = String(sHi);
    const a = ARCHETYPE_BY_ID.get(archetype.value);
    const v = Number(start.value);
    if (a && (resetDefault || v < sLo || v > sHi)) start.value = String(Math.min(sHi, Math.max(sLo, toSpecies(a.startAge))));
  };

  const fillRanks = (): void => {
    const keep = rank.value;
    const age = last.birthDay !== null && last.startDay !== null ? (last.startDay - last.birthDay) / 368 : 0;
    const h = humanEquivalentAge(speciesDef(species.value), Math.max(0, age));
    const ranks = ranksFor(path.value as CharacterPath, h);
    rank.replaceChildren(...(ranks.length ? ranks.map((r) => option(r.id, r.name)) : [option('', 'no rank fits this age')]));
    if (ranks.some((r) => r.id === keep)) rank.value = keep;
    else if (ranks.length) rank.value = ranks[ranks.length - 1]!.id;
  };

  const refresh = (): void => {
    const used = talentCost(talents());
    talentsLine.textContent = `Talent points: ${used} of ${TALENT_POINTS} used (gifted 1, prodigy 2, exceptional 3).`;
    talentsLine.className = used > TALENT_POINTS && !bypassConfirmed ? 'error' : 'hint';
    if (bypassConfirmed) talentsLine.textContent = `Talent points: ${used} used. The limit of ${TALENT_POINTS} is ignored (unbalanced campaign).`;
    preview.replaceChildren();
    if (last.birthDay === null || last.startDay === null) {
      preview.append(el('p', { class: 'hint', text: 'Enter valid dates to see the starting levels.' }));
      return;
    }
    const c = computeCreation({ ...read(), name: last.name || 'The character', birthDay: last.birthDay, startDay: last.startDay });
    preview.append(el('div', { class: 'card-title' }, [el('strong', { text: 'Starting levels (computed)' })]));
    if (c.errors.length) {
      preview.append(el('div', { class: 'error', text: c.errors.join(' ') }));
      return;
    }
    const a = ARCHETYPE_BY_ID.get(archetype.value)!;
    const main = a.main === '$mainForm' ? mainForm.value : a.main;
    const show = [...new Set([main, ...(mainForm.value && main !== mainForm.value && a.weights['$mainForm'] ? [mainForm.value] : []), ...PREVIEW_SKILLS])];
    preview.append(
      el(
        'div',
        { class: 'preview-grid' },
        show.map((id) => el('div', { class: 'kv' }, [el('span', { class: 'k', text: `${SKILL_BY_ID.get(id)?.name ?? id}: ` }), (c.levels[id] ?? 0).toFixed(1)])),
      ),
    );
    const r = rank.value;
    if (r === 'initiate' || r === 'padawan' || r === 'acolyte' || r === 'apprentice') {
      preview.append(el('p', { class: 'hint', text: 'Before Knighthood the Order requirements fill most of the training day, so focus moves these levels only a little; from Knight on it decides the day (D-115).' }));
    }
    if (c.unmet.length) {
      preview.append(
        el('div', { class: c.storyException ? 'hint' : 'error', text: `Rank minimums not met: ${c.unmet.map((u) => `${SKILL_BY_ID.get(u.skillId)?.name ?? u.skillId} ${u.have} of ${u.need}`).join(', ')}.` }),
        c.storyException ? el('p', { class: 'hint', text: 'Kept as a story exception (logged as a backstory fact).' }) : el('ul', {}, c.options.map((o) => el('li', { text: o }))),
      );
    } else preview.append(el('p', { class: 'hint', text: 'The rank minimums are met.' }));
  };

  path.addEventListener('change', () => {
    fillArchetypes();
    fillRanks();
    focusArch = '';
    renderFocus();
    refresh();
  });
  species.addEventListener('change', () => (setStartBounds(true), fillRanks(), refresh()));
  archetype.addEventListener('change', () => {
    const a = ARCHETYPE_BY_ID.get(archetype.value);
    if (a) start.value = String(toSpecies(a.startAge));
    renderFocus();
    refresh();
  });
  for (const n of [rank, start, hand, war, exception, ...Object.values(talentSel)]) n.addEventListener('change', refresh);
  for (const n of [mainForm, secondForm]) n.addEventListener('change', () => (renderFocus(), refresh()));

  const renderBypass = (): void => {
    bypassBox.replaceChildren();
    if (!ignoreLimit.checked) return;
    if (bypassConfirmed) {
      bypassBox.append(el('p', { class: 'warn-text', text: 'Talent limit ignored: this campaign is flagged unbalanced. Each talent still maxes at exceptional; the 2.8 speed cap and the 4.0x pace limit still apply.' }));
      return;
    }
    bypassBox.append(
      el('div', { class: 'warn-box' }, [
        el('strong', { text: 'This creates a very powerful character; gameplay will not be balanced.' }),
        el('p', { text: 'Any number of talents can be chosen (each up to exceptional). The 2.8 speed cap and the 4.0x pace limit still apply. The campaign is flagged unbalanced on the character sheet.' }),
        el('div', { class: 'row' }, [
          el('button', { text: 'I understand, ignore the limit', attrs: { type: 'button' }, on: { click: () => ((bypassConfirmed = true), renderBypass(), refresh()) } }),
          el('button', { class: 'secondary', text: 'Cancel', attrs: { type: 'button' }, on: { click: () => ((ignoreLimit.checked = false), renderBypass(), refresh()) } }),
        ]),
      ]),
    );
  };
  ignoreLimit.addEventListener('change', () => {
    bypassConfirmed = false;
    renderBypass();
    refresh();
  });

  fillArchetypes();
  renderFocus();

  const field = (label: string, node: HTMLElement): HTMLElement => el('div', { class: 'field' }, [el('label', { text: label }), node]);
  const fields: HTMLElement[] = [
    el('div', { class: 'field-label', text: 'Character' }),
    el('div', { class: 'row' }, [field('Path', path), field('Species', species), field('Rank', rank)]),
    el('div', { class: 'row' }, [field('Archetype', archetype), field('Training start age (species years)', start), field('War years', war)]),
    el('div', { class: 'row' }, [field('Main form', mainForm), field('Second form', secondForm), field('Dominant hand', hand)]),
    el('div', { class: 'field-label', text: 'Focus (shares of the training day; they always sum to 100%)' }),
    focusBox,
    el('div', { class: 'field-label', text: 'Talents' }),
    el('div', { class: 'row' }, TALENT_DOMAINS.map((d) => field(DOMAIN_LABEL[d], talentSel[d]))),
    talentsLine,
    el('label', { class: 'check' }, [ignoreLimit, ' Ignore talent point limit']),
    bypassBox,
    el('label', { class: 'check' }, [exception, ' Keep an unreachable rank as a story exception (e.g. a battlefield promotion)']),
    preview,
  ];

  return {
    fields,
    read,
    update: (birthDay, startDay, name) => {
      last = { birthDay, startDay, name };
      fillRanks();
      refresh();
    },
  };
}
