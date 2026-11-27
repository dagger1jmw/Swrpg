// The ship battle panel (m8-ship-battles, D-517; design notes "Tactics menu" and "Battle map"). Rendering and player actions
// only; no rules here. Before each turn or round: where things stand, what is known of the enemy, the moves with what each is
// strong and weak against and what it costs, and the map (redrawn only when something changed). "Let it play out" hands the
// rest to the code; "Take the controls" takes it back.
import { brokenSystems } from '../features/battles';
import { selectActiveBattle, selectBattleMenu, selectBattleWaitsOnFight, selectEndedBattleToShow, selectGroundBattle, selectGroundPlanning, selectLastEndedBattle, selectOwnShipCondition } from '../features/battles/selectors';
import type { MenuOption } from '../features/battles/selectors';
import type { GameState } from '../state/gameState';
import type { TurnInput } from '../turn/record';
import { el } from './dom';

export interface BattlePanelProps {
  state: GameState;
  busy: boolean;
  act(input: TurnInput): void;
  /** Picks so far for this turn, by menu group (kept by the app between renders). */
  picks: Readonly<Record<string, number>>;
  pick(group: string, index: number | null): void;
  /** Take the controls back: at once when idle, else when the turn in flight ends (the auto-play is nearly always busy). */
  takeControl(): void;
  /** A take-back is waiting for the turn in flight. */
  takingControl: boolean;
}

const GO_LABEL: Readonly<Record<string, string>> = { Dogfight: 'Fly this turn', 'Attack run': 'Make the run', 'Fleet battle: your engagement': 'Engage', 'Fleet battle: your command': 'Order this round' };

/** The orders of the picked options, merged (one per group). */
export function mergedOrders(options: readonly MenuOption[], picks: Readonly<Record<string, number>>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [, i] of Object.entries(picks)) Object.assign(out, options[i]?.orders ?? {});
  return out;
}

export function renderBattlePanel(p: BattlePanelProps): HTMLElement | null {
  const s = p.state;
  const b = selectActiveBattle(s);
  const dis = p.busy ? { disabled: 'true' } : {};
  if (!b) {
    // After a battle (m8-fixes C3): the wrap-up on the turn it ended only; field repairs while the ship needs them and no battle runs.
    const last = selectLastEndedBattle(s);
    const cond = selectOwnShipCondition(s);
    const broken = cond && selectGroundBattle(s) === null && selectGroundPlanning(s) === null && s.clock.now.day - (cond.day ?? -99) <= 2 ? brokenSystems(cond) : [];
    const showWrap = last !== null && selectEndedBattleToShow(s) === 'ship';
    if (!showWrap && !broken.length) return null;
    const items: HTMLElement[] = [];
    if (showWrap) {
      items.push(el('strong', { text: `${last!.kind === 'fleet' ? 'Fleet battle' : 'Dogfight'} over` }));
      if (last!.map) items.push(el('pre', { class: 'battle-map', text: last!.map }));
    } else items.push(el('strong', { text: 'Your ship needs repairs' }));
    if (broken.length) items.push(el('button', { class: 'small', text: `Field repairs (${broken.join(', ')})`, attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Field repairs', repairs: true }) } }));
    return el('section', { class: 'box duel battle' }, [el('div', { class: 'box-body duel-body' }, items)]);
  }
  if (selectBattleWaitsOnFight(s) && s.combat.active) {
    return el('section', { class: 'box duel battle' }, [el('div', { class: 'box-body duel-body' }, [el('strong', { text: 'Boarding: the fight comes first' }), el('p', { class: 'hint', text: 'The ship battle waits until the boarding fight is over.' })])]);
  }
  const menu = selectBattleMenu(s);
  if (!menu) return null;
  const head = el('div', { class: 'box-head' }, [el('strong', { text: menu.title })]);
  const body: HTMLElement[] = [el('p', { class: 'battle-now', text: menu.now })];
  if (b.map) body.push(el('pre', { class: 'battle-map', text: b.map }));
  if (menu.known.length) body.push(el('div', { class: 'battle-known' }, [el('span', { class: 'hint', text: 'Known: ' }), ...menu.known.map((k) => el('div', { text: k }))]));
  const recent = b.log.slice(-4);
  if (recent.length) body.push(el('div', { class: 'battle-log' }, recent.map((l) => el('div', { class: 'hint', text: l }))));
  if (b.auto) {
    body.push(el('p', { class: 'hint', text: 'The code is flying it with the character\'s own skills.' }));
    body.push(el('div', { class: 'battle-go' }, [
      el('button', { class: 'small', text: 'Continue', attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Let it play out', auto: true }) } }),
      el('button', { class: 'small secondary', text: p.takingControl ? 'Taking the controls…' : 'Take the controls', attrs: p.takingControl ? { disabled: 'true' } : {}, on: { click: () => p.takeControl() } }),
    ]));
    return el('section', { class: 'box duel battle' }, [head, el('div', { class: 'box-body duel-body' }, body)]);
  }
  // The moves by group: pick one in each, then go. Battle-ending moves go at once.
  const groups = [...new Set(menu.options.map((o) => o.group))];
  for (const g of groups) {
    const opts = menu.options.map((o, i) => ({ o, i })).filter((x) => x.o.group === g);
    const row = opts.map(({ o, i }) => {
      const chosen = p.picks[g] === i;
      const title = [o.strong ? `Strong: ${o.strong}` : '', o.weak ? `Weak: ${o.weak}` : '', o.cost ? `Cost: ${o.cost}` : '', o.why ?? ''].filter(Boolean).join('\n');
      const now = g === 'battle' || g === 'engage';
      return el('button', {
        class: `small${chosen ? ' chosen' : ''}${o.available ? '' : ' unavailable'}`,
        text: o.label,
        attrs: { ...(o.available && !p.busy ? {} : { disabled: 'true' }), title, 'aria-pressed': chosen ? 'true' : 'false' },
        on: { click: () => (now ? p.act({ kind: 'battle', label: o.label, orders: { ...o.orders } }) : p.pick(g, chosen ? null : i)) },
      });
    });
    const picked = p.picks[g] !== undefined ? menu.options[p.picks[g]!] : undefined;
    body.push(el('div', { class: 'battle-group' }, [el('span', { class: 'hint', text: `${g[0]!.toUpperCase()}${g.slice(1)}: ` }), ...row]));
    // Staying at one's post (m8-audit A4) says its cost on screen, not only in a tooltip (touch has no hover).
    for (const { o } of opts) if (o.orders.stayAtPost && o.why) body.push(el('p', { class: 'hint battle-why', text: o.why }));
    if (picked && (picked.strong || picked.weak || picked.cost)) body.push(el('div', { class: 'hint battle-detail', text: [picked.strong ? `Strong: ${picked.strong}` : '', picked.weak ? `Weak: ${picked.weak}` : '', picked.cost ? `Cost: ${picked.cost}` : ''].filter(Boolean).join(' · ') }));
  }
  const go = GO_LABEL[menu.title] ?? 'Next round';
  const goes = menu.watching || !groups.includes('engage');
  body.push(el('div', { class: 'battle-go' }, [
    goes ? el('button', { class: 'small', text: go, attrs: dis, on: { click: () => p.act({ kind: 'battle', label: go, orders: mergedOrders(menu.options, p.picks) }) } }) : null,
    el('button', { class: 'small secondary', text: 'Let it play out', attrs: dis, on: { click: () => p.act({ kind: 'battle', label: 'Let it play out', auto: true }) } }),
  ]));
  return el('section', { class: 'box duel battle' }, [head, el('div', { class: 'box-body duel-body' }, body)]);
}
