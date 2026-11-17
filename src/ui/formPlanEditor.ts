// Form plan editor (D-118): rows of [form][hours slider][hours][remove] plus "Add form". The hours
// always total the plan's hours (3 for the Padawan plan: the 2 h master session + the 1 h solo hour):
// moving one slider rescales the others, as the focus sliders do. Rendering only.
import { FORM_IDS, SKILL_BY_ID } from '../data/skills';
import { el, input } from './dom';

export interface FormPlanEditor {
  node: HTMLElement;
  read(): Record<string, number>;
  set(plan: Readonly<Record<string, number>>): void;
}

const fmt = (h: number): string => `${(Math.round(h * 4) / 4).toFixed(2).replace(/\.?0+$/, '')} h`;

export function formPlanEditor(total: number, initial: Readonly<Record<string, number>>, onChange: () => void): FormPlanEditor {
  const node = el('div', { class: 'focus form-plan' });
  let rows: { form: string; hours: number }[] = Object.entries(initial).map(([form, hours]) => ({ form, hours }));

  const rescale = (fixedIndex: number): void => {
    const fixed = rows[fixedIndex]!;
    fixed.hours = Math.min(total, Math.max(0, fixed.hours));
    const others = rows.filter((_, i) => i !== fixedIndex);
    const sum = others.reduce((a, r) => a + r.hours, 0);
    const rest = total - fixed.hours;
    for (const r of others) r.hours = sum > 0 ? (r.hours / sum) * rest : others.length ? rest / others.length : 0;
    if (!others.length) fixed.hours = total;
  };

  const render = (): void => {
    node.replaceChildren();
    const used = new Set(rows.map((r) => r.form));
    const labels: HTMLElement[] = [];
    const sliders: HTMLInputElement[] = [];
    rows.forEach((row, i) => {
      const sel = el(
        'select',
        { attrs: { 'aria-label': 'Form' } },
        FORM_IDS.filter((f) => f === row.form || !used.has(f)).map((f) => el('option', { text: SKILL_BY_ID.get(f)!.name, attrs: { value: f } })),
      );
      sel.value = row.form;
      sel.addEventListener('change', () => {
        row.form = sel.value;
        render();
        onChange();
      });
      const slider = input({ type: 'range', min: '0', max: String(total), step: '0.25', value: String(row.hours), 'aria-label': 'Hours' });
      const label = el('span', { class: 'focus-share', text: fmt(row.hours) });
      labels.push(label);
      sliders.push(slider);
      // 'input' fires while dragging; the other rows update in place so the drag is not interrupted.
      slider.addEventListener('input', () => {
        row.hours = Number(slider.value);
        rescale(i);
        rows.forEach((r, j) => {
          if (j !== i) sliders[j]!.value = String(r.hours);
          labels[j]!.textContent = fmt(r.hours);
        });
        onChange();
      });
      const remove = el('button', { class: 'small secondary', text: '×', attrs: { type: 'button', 'aria-label': 'Remove form', title: 'Remove form' } });
      remove.disabled = rows.length <= 1;
      remove.addEventListener('click', () => {
        rows.splice(i, 1);
        if (rows.length) rescale(0);
        render();
        onChange();
      });
      node.append(el('div', { class: 'focus-row plan-row' }, [sel, slider, label, remove]));
    });
    const free = FORM_IDS.find((f) => !used.has(f));
    if (free) {
      node.append(
        el('button', {
          class: 'small secondary',
          text: 'Add form',
          attrs: { type: 'button' },
          on: {
            click: () => {
              rows.push({ form: free, hours: total / (rows.length + 1) });
              rescale(rows.length - 1);
              render();
              onChange();
            },
          },
        }),
      );
    }
  };

  render();
  return {
    node,
    read: () => Object.fromEntries(rows.filter((r) => r.hours > 1e-9).map((r) => [r.form, Math.round(r.hours * 1e6) / 1e6])),
    set: (plan) => {
      rows = Object.entries(plan).map(([form, hours]) => ({ form, hours }));
      render();
    },
  };
}
