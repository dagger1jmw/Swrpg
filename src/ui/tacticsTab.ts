// The Tactics tab (m8-ship-life part G; Jared, 26 Nov 2026): known and seen tactics, space and ground, each with what it is
// strong and weak against, what it needs, and how it was learned. Known ones are offered in the battle menu; seen ones are
// recognised (+1 against them) but not usable.
import { PRACTICE_TO_KNOW, SEEN_TACTIC_PENALTY } from '../data/tactics';
import { selectTacticRows, type TacticRow } from '../features/tactics/selectors';
import type { GameState } from '../state/gameState';
import { el } from './dom';

const kv = (label: string, value: string): HTMLElement => el('div', { class: 'kv' }, [el('span', { class: 'k', text: `${label}: ` }), value]);

function card(r: TacticRow): HTMLElement {
  const t = r.def;
  return el('div', { class: 'card' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: t.name }), el('span', { class: r.status === 'known' ? 'rel rel-friendly' : 'rel', text: r.status === 'known' ? 'known' : 'seen, not practised' })]),
    el('p', { text: t.description }),
    kv('Strong against', t.strong),
    kv('Weak against', t.weak),
    t.requires ? kv('Needs', t.requires) : null,
    kv(r.status === 'known' ? 'Learned' : 'Seen', `${r.source}${r.practice ? `; practised ${r.practice}/${PRACTICE_TO_KNOW}` : ''}`),
    !r.inUse ? el('div', { class: 'hint', text: 'not in use in this era' }) : null,
    !t.engine ? el('div', { class: 'hint', text: 'a story tactic: the narrator uses it; the battle engine does not fly it' }) : null,
  ]);
}

export function renderTactics(s: GameState): HTMLElement[] {
  const rows = selectTacticRows(s);
  const out: HTMLElement[] = [el('p', { class: 'hint', text: `This is the list the battle menus offer. Known tactics are ordered as they are. Seen ones (not practised) are recognised when used against you (+1) and can be ordered at -${SEEN_TACTIC_PENALTY}; using one well in battle, or being taught it, makes it known.` })];
  for (const [title, scales] of [['Space', ['dogfight', 'attackRun', 'fleet']], ['Ground', ['ground']]] as const) {
    out.push(el('h3', { text: title }));
    const mine = rows.filter((r) => (scales as readonly string[]).includes(r.def.scale)).sort((a, b) => Number(a.status === 'seen') - Number(b.status === 'seen'));
    if (!mine.length) out.push(el('p', { class: 'hint', text: title === 'Ground' ? 'No ground tactics known or seen.' : 'None.' }));
    for (const r of mine) out.push(card(r));
  }
  return out;
}
