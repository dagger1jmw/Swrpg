// The Possessions tab (m8-ship-life part F; Jared, 26 Nov 2026): what the character has, by where it is. On you (by carry
// slot, credits by currency, debts in one line), ships, droids, stored elsewhere, holdings. Everything is visible from anywhere;
// only what is with the character can be used. The page shows; the story acts: nothing here changes state.
import { CURRENCY_NAMES } from '../data/economy.config';
import { selectDroidCards } from '../features/droids/selectors';
import { selectCarrySlots, selectHoldings, selectStoredByPlace } from '../features/possessions/selectors';
import { selectShipCards } from '../features/ships/selectors';
import type { GameState } from '../state/gameState';
import { el } from './dom';

const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
const kv = (label: string, value: string): HTMLElement => el('div', { class: 'kv' }, [el('span', { class: 'k', text: `${label}: ` }), value]);
const SLOT_LABEL: Readonly<Record<string, string>> = { worn: 'Worn', back: 'Back holster', hip: 'Hip holsters', belt: 'Belt', pockets: 'Pockets', backpack: 'Backpack', hands: 'In hand (a full hand cannot fight)', 'too much to carry': 'Too much to carry' };

export function renderPossessions(s: GameState): HTMLElement[] {
  const out: HTMLElement[] = [el('p', { class: 'hint', text: 'Everything is shown wherever it is; only what is with the character can be used. Selling, repairing or moving things happens in the story.' })];

  // On you.
  out.push(el('h3', { text: 'On you' }));
  const slots = selectCarrySlots(s);
  const w = s.economy.wallet;
  const money = (['republic', 'imperial', 'hutt'] as const).filter((c) => w[c] > 0).map((c) => (c === 'hutt' ? `${fmt(w.hutt)} wupiupi (Hutt coin)` : `${fmt(w[c])} ${CURRENCY_NAMES[c]}`));
  const debts = s.economy.loans.map((l) => `${fmt(l.balance)} cr to ${l.lender}${l.stage !== 'current' ? ` (${l.stage})` : ''}`);
  out.push(
    el('div', { class: 'card' }, [
      ...(slots.length ? slots.map((v) => kv(SLOT_LABEL[v.slot] ?? v.slot, v.items.map((i) => `${i.name}${i.issued ? ' (issued)' : ''}`).join(', '))) : [el('div', { class: 'hint', text: 'Nothing carried.' })]),
      kv('Credits', money.length ? money.join('; ') : 'none'),
      kv('Debts', debts.length ? debts.join('; ') : 'none'),
    ]),
  );

  // Ships.
  out.push(el('h3', { text: 'Ships' }));
  const ships = selectShipCards(s);
  if (!ships.length) out.push(el('p', { class: 'hint', text: 'No ships.' }));
  for (const c of ships)
    out.push(
      el('div', { class: 'card' }, [
        el('div', { class: 'card-title' }, [el('strong', { text: c.name }), el('span', { class: 'hint', text: c.className })]),
        kv('Held', c.hold),
        kv('Where', c.docked),
        kv('Hull', c.hull),
        kv('Systems', c.systems),
        kv('Drive', `${c.drive} · ${c.wear}`),
        kv('Mods', `${c.mods} (capacity ${c.capacity})`),
        kv('Transponder', c.transponder),
        kv('Cargo', c.cargo),
        kv('Crew', c.crew),
        kv('Fuel and supplies', c.supplies),
        kv('Search flag', c.flags),
      ]),
    );

  // Droids.
  out.push(el('h3', { text: 'Droids' }));
  const droids = selectDroidCards(s);
  if (!droids.length) out.push(el('p', { class: 'hint', text: 'No droids.' }));
  for (const d of droids)
    out.push(el('div', { class: 'card' }, [el('div', { class: 'card-title' }, [el('strong', { text: d.name }), el('span', { class: 'hint', text: d.model })]), kv('Condition', d.condition), kv('Modules', d.modules), kv('Memory', d.memory), kv('Bolt', d.bolt), kv('Where', d.where)]));

  // Stored elsewhere.
  out.push(el('h3', { text: 'Stored elsewhere' }));
  const stored = selectStoredByPlace(s);
  if (!stored.length) out.push(el('p', { class: 'hint', text: 'Nothing stored.' }));
  for (const p of stored) out.push(el('div', { class: 'card' }, [el('div', { class: 'card-title' }, [el('strong', { text: p.place }), el('span', { class: 'hint', text: p.here ? 'here: can be fetched' : 'away: not usable from here' })]), el('div', { text: p.items.map((i) => i.name).join(', ') })]));

  // Holdings.
  out.push(el('h3', { text: 'Holdings' }));
  const h = selectHoldings(s);
  const total = h.counts.reduce((t, c) => t + c.credits, 0);
  out.push(
    el('div', { class: 'card' }, [
      ...h.counts.map((c) => kv(c.label, `${fmt(c.credits)} cr`)),
      ...(h.limit !== null ? [kv('Counts toward the Order\'s limit', `${fmt(total)} of ${fmt(h.limit)} cr`)] : []),
      kv(h.limit !== null ? 'Never counts' : 'Not the character\'s to sell', h.never.length ? h.never.join('; ') : 'nothing'),
    ]),
  );
  return out;
}
