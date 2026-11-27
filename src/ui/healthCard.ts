// The health card on the character sheet (health.md §3-8): Vitality, status, wounds with their healing, lasting
// injuries with adaptation, the dying timer, death. Rendering only; everything shown is derived by selectors.
import { partText } from '../engine/duel';
import { selectDeath, selectIsDying, selectLasting, selectMaxVitality, selectStatusLabel, selectVitality, selectWoundPenalty, selectWounds, selectWoundTag } from '../features/health/selectors';
import { selectDutyLine, selectFitnessLine } from '../features/duty/selectors';
import { SUPPRESSION_POWERS } from '../data/health.config';
import { selectLevelExact } from '../features/progression/selectors';
import type { GameState } from '../state/gameState';
import type { GameEvent } from '../state/types';
import { el } from './dom';

/** A lasting injury's aid in words (D-216; pass 2 showed "qualityCybernetic"). */
const AID_LABEL: Readonly<Record<string, string>> = { none: 'no prosthetic', scarTissue: 'scar tissue', basicProsthetic: 'basic prosthetic', qualityCybernetic: 'quality cybernetic', offHand: 'the off hand' };
const KIND_LABEL: Record<string, string> = {
  lostHand: 'lost hand',
  lostArm: 'lost arm',
  lostLeg: 'lost leg',
  jointDamage: 'joint damage',
  burnsOrLungs: 'burns or lung damage',
  headTrauma: 'head trauma',
};

/**
 * The pain-suppression powers the character has (health §8; opt-2 E1), as buttons: begin one while wounded (also while dying: a
 * commander staying at their post), end one that is active. The share each would remove is on its face.
 */
function suppressionButtons(s: GameState, send?: (events: GameEvent[]) => void): HTMLElement | null {
  if (!send || s.health.death || s.character.path === 'career') return null;
  const active = new Set(s.health.suppression.map((a) => a.abilityId));
  const wounded = selectWounds(s).length > 0;
  const rows: HTMLElement[] = [];
  for (const [id, p] of Object.entries(SUPPRESSION_POWERS)) {
    if (active.has(id)) {
      rows.push(el('button', { class: 'btn small', text: `End ${p.name}`, on: { click: () => send([{ type: 'suppressionEnded', abilityId: id }]) } }));
      continue;
    }
    if (!wounded) continue;
    if (p.paths && !p.paths.includes(s.character.path)) continue;
    const level = p.skill ? selectLevelExact(s, p.skill) : 0;
    if (p.skill && level < Math.max(p.minLevel, 1e-9)) continue;
    const share = p.skill ? Math.min(p.max, level / p.per) : p.max;
    rows.push(el('button', { class: 'btn small', text: `${p.name} (-${Math.round(share * 100)}% pain)`, on: { click: () => send([{ type: 'suppressionBegun', abilityId: id }]) } }));
  }
  return rows.length ? el('div', { class: 'hc-row hc-suppress' }, [el('div', { class: 'hc-label', text: 'Pain' }), ...rows]) : null;
}

export function renderHealthCard(s: GameState, send?: (events: GameEvent[]) => void): HTMLElement {
  const death = selectDeath(s);
  if (death) return el('div', { class: 'card health dead' }, [el('div', { class: 'card-title' }, [el('strong', { text: 'Dead' })]), el('div', { class: 'hint', text: death.cause })]);
  const v = selectVitality(s);
  const max = selectMaxVitality(s);
  const pct = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  const wounds = selectWounds(s);
  const lasting = selectLasting(s);
  const penalty = selectWoundPenalty(s, s.character.mainFormId ?? 'agility');
  const woundTag = selectWoundTag(s, partText);
  const now = s.clock.now.day * 86_400 + s.clock.now.second;
  return el('div', { class: 'card health' }, [
    el('div', { class: 'card-title' }, [el('strong', { text: 'Health' }), el('span', { class: 'rel', text: selectStatusLabel(s) })]),
    // Duty and fitness for duty (opt-2 D1, D3): the code's status, read from the duty slice and the wounds.
    el('div', { class: 'hint hc-row hc-duty', text: `Duty: ${selectDutyLine(s)}` }),
    el('div', { class: 'hint hc-row hc-fitness', text: selectFitnessLine(s) }),
    selectIsDying(s) && s.health.dying ? el('div', { class: 'dying', text: `Dying: ${Math.max(0, Math.round((s.health.dying.untilAbs - now) / 60))} minutes left unless stabilized` }) : null,
    // Vitality: its own row, a label, the bar and the number (current / max); wounds listed below (iPad fix).
    el('div', { class: 'hc-vital' }, [
      el('span', { class: 'hc-label', text: 'Vitality' }),
      el('span', { class: 'vbar', attrs: { role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(max)), 'aria-valuenow': String(Math.round(v)), 'aria-label': 'Vitality' } }, [el('span', { class: 'vfill', attrs: { style: `width:${pct.toFixed(0)}%` } })]),
      el('span', { class: 'hc-num', text: `${Math.round(v)} / ${Math.round(max)}${v <= 0 ? ' (spent)' : ''}` }),
      // The active wounds beside the bar (m8-fixes D2): wounds do not lower Vitality (health.md section 3), so the bar alone would hide them.
      woundTag ? el('span', { class: 'hc-wound', text: woundTag, attrs: { title: 'Wounds do not lower Vitality: they weaken you through the wound penalty until they heal.' } }) : null,
    ]),
    penalty > 0 ? el('div', { class: 'hint hc-row', text: `Wound penalty on your main form: -${Math.round(penalty * 100)}%` }) : null,
    el('div', { class: 'hc-list' }, [
      el('div', { class: 'hc-label', text: 'Wounds' }),
      ...wounds.map((w) =>
        el('div', { class: 'wound', text: `${w.stabilized && w.severity === 'mortal' ? 'stabilized critical' : w.severity} · ${partText(w.part)}${w.severed ? ' (severed)' : ''} · ${Math.round(w.healProgress * 100)}% healed` }),
      ),
      ...lasting.map((l) => el('div', { class: 'wound lasting', text: `${KIND_LABEL[l.kind] ?? l.kind} · ${AID_LABEL[l.aid] ?? l.aid} · ${Math.round(l.adaptation * 100)}% adapted` })),
      !wounds.length && !lasting.length ? el('div', { class: 'hint', text: 'No wounds.' }) : null,
    ]),
    s.health.care ? el('div', { class: 'hint hc-row', text: 'Under medical care (x2 healing)' }) : null,
    suppressionButtons(s, send),
  ]);
}
