// The visible "why" under a group of options (opt-2 I1; audit I1): on an iPad a tooltip cannot be read and a disabled button
// cannot be tapped, so each option's strengths, weaknesses and cost, and the reason one cannot be taken now, are on screen.
import { el } from './dom';

export interface WhyOption {
  label: string;
  available: boolean;
  strong?: string | undefined;
  weak?: string | undefined;
  cost?: string | undefined;
  why?: string | undefined;
}

/** One line per option that has something to say: "Label: strong ...; weak ...; cost ..." or "Label (not now): why". */
export function whyBlock(options: readonly WhyOption[]): HTMLElement | null {
  const lines = options.flatMap((o) => {
    if (!o.available) return o.why ? [`${o.label} (not now): ${o.why}`] : [];
    const parts = [o.strong ? `strong ${o.strong}` : '', o.weak ? `weak ${o.weak}` : '', o.cost ? `cost ${o.cost}` : '', o.why ?? ''].filter(Boolean);
    return parts.length ? [`${o.label}: ${parts.join('; ')}`] : [];
  });
  return lines.length ? el('div', { class: 'hint battle-why' }, lines.map((t) => el('div', { text: t }))) : null;
}
