// The mission card and the posting card (m9-missions B11): objective, stage and progress, complications, who is with the
// character, days away; the front, the base, months posted, the next leave. Rendering only; everything shown is the code's.
import { selectMissionCard, selectPostingCard } from '../features/duty/selectors';
import type { GameState } from '../state/gameState';
import { el } from './dom';

const MARK: Readonly<Record<string, string>> = { done: '✓', failed: '✗', active: '▶', pending: '·' };

export function renderMissionCard(s: GameState): HTMLElement | null {
  const m = selectMissionCard(s);
  const p = selectPostingCard(s);
  if (!m && !p) return null;
  return el('div', { class: 'card mission' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: m ? 'Mission' : 'Posting' }), el('span', { class: 'rel', text: m ? `${m.daysAway} day${m.daysAway === 1 ? '' : 's'} away` : `${p!.months} months` })]),
    m ? el('div', { class: 'hint hc-row', text: m.title }) : null,
    m ? el('div', { class: 'hint hc-row', text: `Objective: ${m.objective}` }) : null,
    m ? el('div', { class: 'hint hc-row', text: `Now: ${m.stage}` }) : null,
    m ? el('div', { class: 'hc-list' }, m.stages.map((st) => el('div', { class: `hint hc-row mission-stage ${st.status}`, text: `${MARK[st.status] ?? '·'} ${st.label}` }))) : null,
    m && m.complications.length ? el('div', { class: 'hint hc-row', text: `Complications: ${m.complications.join('; ')}` }) : null,
    m && m.party.length ? el('div', { class: 'hint hc-row', text: `With you: ${m.party.join(', ')}` }) : null,
    m && m.deadline ? el('div', { class: 'hint hc-row', text: `Deadline: ${m.deadline}` }) : null,
    p ? el('div', { class: 'hint hc-row', text: `Posted: ${p.front}, based at ${p.base} (${p.months} months); ${p.leave}` }) : null,
  ]);
}
