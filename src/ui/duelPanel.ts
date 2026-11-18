// The duel panel and the exchange roll cards (rolls.md §7; D-145 beat buttons; D-143 K iPad layout: the panel is a
// fixed box and its log scrolls inside its own box). Rendering and player actions only; no rules here.
import { MANEUVERS, STANCES } from '../data/combat.config';
import { FORM_IDS, SKILL_BY_ID } from '../data/skills';
import type { BasicRoll } from '../engine/rolls';
import type { DuelState, ExchangeRecord } from '../engine/duel';
import { selectActiveFight, selectFates, selectLastFight } from '../features/combat/selectors';
import { selectIsDying } from '../features/health/selectors';
import { selectNpc } from '../features/npcs/selectors';
import { selectLevelExact } from '../features/progression/selectors';
import type { GameState } from '../state/gameState';
import type { CombatDraft } from '../turn/combatTurn';
import type { TurnInput } from '../turn/record';
import { el } from './dom';

const f1 = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));

/** One side's roll as text: die, natural bonus, level bonus, each modifier with its source, total (rolls §7). */
function rollText(label: string, r: BasicRoll | null): string {
  if (!r) return `${label}: no roll`;
  const parts = [`d20 ${r.d20}`];
  if (r.naturalBonus) parts.push(`${r.naturalBonus > 0 ? '+' : ''}${r.naturalBonus} natural`);
  parts.push(`+${f1(r.levelBonus)} level`);
  for (const m of r.modifiers) parts.push(`${m.value >= 0 ? '+' : ''}${f1(m.value)} ${m.source}`);
  return `${label}: ${parts.join(' ')} = ${f1(r.total)}`;
}

function outcomeText(r: ExchangeRecord, names: Record<string, string>): string {
  const pc = names['pc'] ?? 'You';
  const t = names[r.targetId] ?? 'opponent';
  if (r.kind === 'force' && r.force) return `${r.force.abilityId}: ${r.force.misfire ? 'misfire' : r.force.collapse ? 'collapse' : r.force.success ? 'success' : 'resisted'}${r.force.damage?.severity ? ` · ${r.force.damage.severity} wound` : ''}`;
  if (r.kind === 'buildUp') return r.advAfter === r.advBefore ? 'even' : r.advAfter > r.advBefore ? `${pc} gains ground` : `${t} gains ground`;
  if (r.maneuver) return `${r.maneuver.kind}`;
  if (!r.hit) return 'strike recovered';
  if (r.hit.avoided) return 'precognition: avoided';
  if (r.hit.point) return 'point';
  return `${r.hit.quality} hit${r.hit.severed ? ` · ${r.hit.part} severed` : r.hit.severity ? ` · ${r.hit.severity} ${r.hit.part}` : ' · no wound'}`;
}

/** An exchange's roll card: both d20s, bonuses, modifiers with sources, the margin, the track and the outcome. */
export function renderExchange(r: ExchangeRecord, names: Record<string, string>): HTMLElement {
  const track = `${r.advBefore >= 0 ? '+' : ''}${r.advBefore} → ${r.advAfter >= 0 ? '+' : ''}${r.advAfter}`;
  const good = (r.hit && !r.hit.avoided && r.hit.by === 'A') || (r.striker === 'A' && r.maneuver) || (r.kind === 'buildUp' && r.advAfter > r.advBefore) || (r.kind === 'force' && r.force?.side === 'A' && r.force.success);
  const bad = (r.hit && !r.hit.avoided && r.hit.by === 'B') || (r.striker === 'B' && r.maneuver) || (r.kind === 'buildUp' && r.advAfter < r.advBefore);
  return el('details', { class: `exchange ${good ? 'up' : bad ? 'down' : ''}` }, [
    el('summary', { text: `#${r.n} ${r.kind === 'strike' ? 'strike' : r.kind === 'force' ? 'Force' : 'exchange'} · ${outcomeText(r, names)} · track ${track}` }),
    el('div', { class: 'roll-line', text: rollText(names['pc'] ?? 'You', r.rollA) }),
    el('div', { class: 'roll-line', text: rollText(names[r.targetId] ?? 'Opponent', r.rollB) }),
    el('div', { class: 'roll-line', text: `Margin ${r.margin >= 0 ? '+' : ''}${f1(r.margin)} · ${r.seconds} s${r.surprise ? ' · surprise' : ''}` }),
    ...r.notes.map((n) => el('div', { class: 'hint', text: n })),
  ]);
}

/** The exchanges of one turn in the feed. */
export function renderCombatDraft(c: CombatDraft): HTMLElement {
  const names = Object.fromEntries(c.fighters.map((f) => [f.id, f.name]));
  return el('div', { class: `roll combat${c.quiet ? ' quiet' : ''}` }, [
    el('div', { text: `${c.started ? 'The fight begins · ' : ''}${c.records.length} exchange${c.records.length === 1 ? '' : 's'}${c.beat ? ` · ${c.beat}` : ''}${c.ended ? ` · ${c.ended.outcome} (${c.ended.reason})` : ''}` }),
    ...c.records.map((r) => renderExchange(r, names)),
  ]);
}

function trackBar(adv: number): HTMLElement {
  const cells = [];
  for (let i = -5; i <= 5; i++) cells.push(el('span', { class: `cell${i === adv ? ' on' : ''}${i === 0 ? ' zero' : ''}${i >= 3 ? ' strike-a' : i <= -3 ? ' strike-b' : ''}` }));
  return el('div', { class: 'track', attrs: { 'aria-label': `advantage ${adv}` } }, cells);
}

function vitalityRow(name: string, v: number, max: number, status: string, out: boolean): HTMLElement {
  const pct = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  return el('div', { class: `fighter${out ? ' out' : ''}` }, [
    el('span', { class: 'fname', text: name }),
    el('span', { class: 'vbar' }, [el('span', { class: 'vfill', attrs: { style: `width:${pct.toFixed(0)}%` } })]),
    el('span', { class: 'fstatus', text: status }),
  ]);
}

export interface DuelPanelProps {
  state: GameState;
  busy: boolean;
  act(input: TurnInput): void;
}

/** The duel panel while a fight is on; afterwards the fate choices and the recording review. Null when nothing applies. */
export function renderDuelPanel(p: DuelPanelProps): HTMLElement | null {
  const s = p.state;
  const active = selectActiveFight(s);
  const fates = selectFates(s);
  const last = selectLastFight(s);
  const beat = (label: string, action: Record<string, unknown>, cls = 'small'): HTMLElement =>
    el('button', { class: cls, text: label, attrs: p.busy ? { disabled: 'true' } : {}, on: { click: () => p.act({ kind: 'beat', label, action: action as never }) } });

  if (!active) {
    const items: HTMLElement[] = [];
    for (const f of fates) {
      const name = selectNpc(s, f.npcId)?.name ?? f.npcId;
      items.push(el('div', { class: 'fate' }, [el('span', { text: `${name} is down. ` }), ...f.options.map((o) => beat(`${o[0]!.toUpperCase()}${o.slice(1)} ${name}`, { action: 'fate', npcRef: f.npcId, fate: o }))]));
    }
    const canReview = last && last.recorded && s.clock.now.day - last.day <= 7 && (s.progression.lastReviewDay === null || s.clock.now.day - s.progression.lastReviewDay >= 7);
    if (canReview) items.push(beat(`Review the recording (${SKILL_BY_ID.get(last.skillId)?.name ?? last.skillId})`, { action: 'review', skillId: last.skillId }));
    return items.length ? el('section', { class: 'box duel' }, [el('div', { class: 'box-body duel-body' }, items)]) : null;
  }

  const d = active.duel as DuelState;
  const names = Object.fromEntries([['pc', d.a.name], ...d.opponents.map((o) => [o.id, o.name] as const)]);
  const engaged = d.opponents.filter((o) => !o.out && !o.engagedElsewhere);
  const forms = FORM_IDS.filter((f) => f !== 'jarKai' && selectLevelExact(s, f) >= 1 && f !== d.a.form);
  const forceActs = (
    [
      ['Push', 'push', 'forcePush'],
      ['Choke', 'choke', 'forceChoke'],
      ['Lightning', 'lightning', 'forceLightning'],
      ['Throw', 'throw', 'telekinesis'],
    ] as const
  ).filter(([, , ability]) => selectLevelExact(s, ability) >= 1);
  const throwable = Object.entries(active.objects).filter(([, n]) => n > 0);
  const formSelect = forms.length
    ? el('select', { attrs: { 'aria-label': 'Change form' }, on: { change: (e) => {
          const v = (e.target as HTMLSelectElement).value;
          if (v) p.act({ kind: 'beat', label: `Switch to ${SKILL_BY_ID.get(v)?.name ?? v}`, action: { action: 'formChange', form: v } as never });
        } } }, [el('option', { text: 'Change form…', attrs: { value: '' } }), ...forms.map((f) => el('option', { text: SKILL_BY_ID.get(f)?.name ?? f, attrs: { value: f } }))])
    : null;
  const targetSelect = engaged.length > 1
    ? el('select', { attrs: { 'aria-label': 'Target' }, on: { change: (e) => {
          const v = (e.target as HTMLSelectElement).value;
          if (v) p.act({ kind: 'beat', label: `Engage ${names[v] ?? v}`, action: { action: 'target', targetRef: v } as never });
        } } }, [el('option', { text: 'Target…', attrs: { value: '' } }), ...engaged.map((o) => el('option', { text: o.name, attrs: { value: o.id } }))])
    : null;
  if (formSelect && p.busy) formSelect.setAttribute('disabled', 'true');
  if (targetSelect && p.busy) targetSelect.setAttribute('disabled', 'true');

  const log = el('div', { class: 'duel-log', attrs: { 'data-scroll': 'duel-log' } }, d.log.slice(-60).map((r) => renderExchange(r, names)));
  return el('section', { class: 'box duel' }, [
    el('div', { class: 'box-head' }, [el('strong', { text: `Fight · ${active.stakes}${active.sparring ? ` (${active.sparring})` : ''} · exchange ${d.exchange}` })]),
    el('div', { class: 'box-body duel-body' }, [
      selectIsDying(s) ? el('div', { class: 'dying', text: 'Dying: get stabilized before the timer runs out.' }) : null,
      trackBar(d.advantage),
      vitalityRow(d.a.name, d.a.vitality, d.a.maxVitality, d.a.out ? 'out' : 'fighting', d.a.out),
      ...d.opponents.map((o) => vitalityRow(o.name, o.vitality, o.maxVitality, o.out ? 'out' : o.engagedElsewhere ? 'fighting an ally' : o.minion ? 'minion' : 'fighting', o.out)),
      el('div', { class: 'beat-row' }, [
        el('span', { class: 'hint', text: 'Stance' }),
        ...STANCES.map((st) => beat(st, { action: 'stance', stance: st }, `small${d.a.stance === st ? ' active' : ''}`)),
      ]),
      el('div', { class: 'beat-row' }, [
        el('span', { class: 'hint', text: 'Tactic' }),
        beat('Feint', { action: 'tactic', tactic: 'feint' }),
        beat('Taunt', { action: 'tactic', tactic: 'taunt' }),
        beat('Take position', { action: 'tactic', tactic: 'takePosition' }),
        beat('Disengage', { action: 'tactic', tactic: 'disengage' }),
        beat('Surrender', { action: 'tactic', tactic: 'surrender' }, 'small secondary'),
      ]),
      el('div', { class: 'beat-row' }, [
        el('span', { class: 'hint', text: 'Next strike' }),
        ...MANEUVERS.map((m) => beat(m, { action: 'maneuver', maneuver: m }, `small${d.a.pendingManeuver === m ? ' active' : ''}`)),
      ]),
      forceActs.length || d.a.shatterpoint > 0
        ? el('div', { class: 'beat-row' }, [
            el('span', { class: 'hint', text: 'Force' }),
            ...forceActs.filter(([, kind]) => kind !== 'throw' || throwable.length).map(([label, kind]) => beat(label, { action: 'force', force: { kind, ...(kind === 'throw' ? { objectTag: throwable[0]![0] } : {}) } })),
            d.a.shatterpoint > 0 && !d.a.shatterpointUsed ? beat('Read the shatterpoint', { action: 'shatterpoint' }) : null,
          ])
        : null,
      formSelect || targetSelect ? el('div', { class: 'beat-row' }, [formSelect, targetSelect]) : null,
      // A sparring session (D-168): the rest resolves at once by default; a bout can be played out beat by beat.
      active.session && !active.session.ended
        ? el('div', { class: 'beat-row' }, [
            el('span', { class: 'hint', text: `Sparring: bout ${active.session.bouts.length + 1}, ${active.session.bouts.filter((b) => b.winner === 'A').length} won, ${active.session.bouts.filter((b) => b.winner === 'B').length} lost` }),
            active.session.playing ? null : beat('Play this bout', { action: 'playBout' }, 'small'),
            beat('Stop sparring', { action: 'stopSession' }, 'small secondary'),
          ])
        : null,
      el('div', { class: 'beat-row main-actions' }, [
        beat(active.session && !active.session.playing ? 'Spar it out' : 'Continue', { action: 'continue' }, 'small'),
        beat('Fight on', { action: 'fightOn' }, 'small'),
        beat('Narrate', { action: 'narrate' }, 'small secondary'),
        beat('Resolve to end', { action: 'resolve' }, 'small secondary'),
      ]),
      el('details', { class: 'log duel-log-wrap' }, [el('summary', { text: `Duel log (${d.log.length})` }), log]),
    ]),
  ]);
}
