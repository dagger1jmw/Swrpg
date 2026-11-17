// Montage / time-skip card (M4; training-routines §8): the report as a card in the feed, and the live
// day-by-day playback shown while the GM writes the narration. Rendering only.
import { SKILL_BY_ID } from '../data/skills';
import type { MontageReport } from '../state/montageReport';
import { el } from './dom';

const title = (r: MontageReport): string => (r.level === 'montage' ? 'Montage' : 'Time skip');

/** The days shown so far (playback) or all of them (the report in the feed). */
function dayLines(r: MontageReport, upTo: number): HTMLElement[] {
  return r.days.slice(0, upTo).map((d) => {
    const parts = [d.label, d.hours ? `${d.hours} h: ${d.trained.join(', ')}` : (d.notes[0] ?? 'rest')];
    const line = el('div', { class: 'day-line', text: parts.join(' · ') });
    const evs = d.events.map((e) => el('div', { class: 'day-event', text: e }));
    return el('div', { class: 'day' }, [line, ...evs]);
  });
}

/** While the narration call runs: the days tick by, events appear as they happen. */
export function renderJumpPlayback(r: MontageReport, shown: number): HTMLElement {
  const n = Math.min(shown, r.days.length);
  const cur = r.days[Math.max(0, n - 1)];
  const done = n >= r.days.length;
  const tail = dayLines(r, n).slice(-6);
  return el('div', { class: 'roll jump live' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: `${title(r)}: day ${n} of ${r.requestedDays}` }), el('span', { class: 'rel', text: cur?.label ?? r.fromLabel })]),
    el('div', { class: 'progress' }, [el('span', { class: 'fill', attrs: { style: `width:${Math.round((100 * n) / Math.max(1, r.requestedDays))}%` } })]),
    ...tail,
    done && r.interrupted ? el('div', { class: 'outcome interrupt', text: `Stopped on ${r.interrupted.label}: ${r.interrupted.reason}` }) : null,
    done ? el('div', { class: 'hint', text: 'The GM is writing the narration…' }) : null,
  ]);
}

/** The report in the feed (training-routines §8). */
export function renderJumpReport(r: MontageReport): HTMLElement {
  const name = (id: string): string => SKILL_BY_ID.get(id)?.name ?? id;
  const one = (x: number): string => x.toLocaleString('en-US', { maximumFractionDigits: 1 });
  return el('div', { class: `roll jump${r.interrupted ? ' failure' : ' success'}` }, [
    el('div', { class: 'card-title' }, [el('strong', { text: `${title(r)}: ${r.fromLabel} → ${r.toLabel}` }), el('span', { class: 'rel', text: `${r.daysCompleted} of ${r.requestedDays} days` })]),
    r.interrupted ? el('div', { class: 'outcome interrupt', text: `Stopped early on ${r.interrupted.label}: ${r.interrupted.reason}` }) : null,
    el('div', { text: `${r.trainingDays} training days, ${r.restDays} rest or recovery days, ${one(r.hoursTrained)} hours of training${r.breakthroughs ? `, ${r.breakthroughs} breakthroughs` : ''}` }),
    ...r.skills.slice(0, 10).map((s) => el('div', { text: `${s.name} +${one(s.xp)} XP${s.levelAfter !== s.levelBefore ? ` · level ${s.levelBefore} → ${s.levelAfter}` : ''}`, class: s.levelAfter !== s.levelBefore ? 'outcome' : '' })),
    r.willpowerXp ? el('div', { class: 'hint', text: `Willpower +${one(r.willpowerXp)} XP (all sources)` }) : null,
    r.rust.cleared.length ? el('div', { class: 'hint', text: `Rust cleared: ${r.rust.cleared.map((x) => name(x.skillId)).join(', ')}` }) : null,
    r.rust.gained.length ? el('div', { class: 'hint', text: `Getting rusty: ${r.rust.gained.map((x) => `${name(x.skillId)} ${Math.round(x.to * 1000) / 10}%`).join(', ')}` }) : null,
    ...r.relationships.map((x) => el('div', { class: 'hint', text: `${x.name}: ${one(x.from)} → ${one(x.to)}` })),
    ...r.events.map((e) => el('div', { class: e.significant ? 'outcome' : 'hint', text: `${e.label}: ${e.text}` })),
    r.adjustments.length ? el('details', { class: 'log' }, [el('summary', { text: `Routine adjustments (${r.adjustments.length})` }), ...r.adjustments.map((a) => el('div', { text: `${a.note} (${a.days} days)` }))]) : null,
    el('details', { class: 'log' }, [el('summary', { text: 'Day by day' }), ...dayLines(r, r.days.length)]),
  ]);
}
