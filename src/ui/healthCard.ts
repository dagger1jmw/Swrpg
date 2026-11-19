// The health card on the character sheet (health.md §3-8): Vitality, status, wounds with their healing, lasting
// injuries with adaptation, the dying timer, death. Rendering only; everything shown is derived by selectors.
import { selectDeath, selectIsDying, selectLasting, selectMaxVitality, selectStatusLabel, selectVitality, selectWoundPenalty, selectWounds } from '../features/health/selectors';
import type { GameState } from '../state/gameState';
import { el } from './dom';

const KIND_LABEL: Record<string, string> = {
  lostHand: 'lost hand',
  lostArm: 'lost arm',
  lostLeg: 'lost leg',
  jointDamage: 'joint damage',
  burnsOrLungs: 'burns or lung damage',
  headTrauma: 'head trauma',
};

export function renderHealthCard(s: GameState): HTMLElement {
  const death = selectDeath(s);
  if (death) return el('div', { class: 'card health dead' }, [el('div', { class: 'card-title' }, [el('strong', { text: 'Dead' })]), el('div', { class: 'hint', text: death.cause })]);
  const v = selectVitality(s);
  const max = selectMaxVitality(s);
  const pct = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  const wounds = selectWounds(s);
  const lasting = selectLasting(s);
  const penalty = selectWoundPenalty(s, s.character.mainFormId ?? 'agility');
  const now = s.clock.now.day * 86_400 + s.clock.now.second;
  return el('div', { class: 'card health' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Health' }), el('span', { class: 'rel', text: selectStatusLabel(s) })]),
    selectIsDying(s) && s.health.dying ? el('div', { class: 'dying', text: `Dying: ${Math.max(0, Math.round((s.health.dying.untilAbs - now) / 60))} minutes left unless stabilized` }) : null,
    // Vitality: its own row, a label, the bar and the number (current / max); wounds listed below (iPad fix).
    el('div', { class: 'hc-vital' }, [
      el('span', { class: 'hc-label', text: 'Vitality' }),
      el('span', { class: 'vbar', attrs: { role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(max)), 'aria-valuenow': String(Math.round(v)), 'aria-label': 'Vitality' } }, [el('span', { class: 'vfill', attrs: { style: `width:${pct.toFixed(0)}%` } })]),
      el('span', { class: 'hc-num', text: `${Math.round(v)} / ${Math.round(max)}${v <= 0 ? ' (spent)' : ''}` }),
    ]),
    penalty > 0 ? el('div', { class: 'hint hc-row', text: `Wound penalty on your main form: -${Math.round(penalty * 100)}%` }) : null,
    el('div', { class: 'hc-list' }, [
      el('div', { class: 'hc-label', text: 'Wounds' }),
      ...wounds.map((w) =>
        el('div', { class: 'wound', text: `${w.stabilized && w.severity === 'mortal' ? 'stabilized critical' : w.severity} · ${w.part}${w.severed ? ' (severed)' : ''} · ${Math.round(w.healProgress * 100)}% healed` }),
      ),
      ...lasting.map((l) => el('div', { class: 'wound lasting', text: `${KIND_LABEL[l.kind] ?? l.kind} · ${l.aid} · ${Math.round(l.adaptation * 100)}% adapted` })),
      !wounds.length && !lasting.length ? el('div', { class: 'hint', text: 'No wounds.' }) : null,
    ]),
    s.health.care ? el('div', { class: 'hint hc-row', text: 'Under medical care (x2 healing)' }) : null,
  ]);
}
