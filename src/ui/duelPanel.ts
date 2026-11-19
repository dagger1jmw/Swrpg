// The duel panel and the exchange roll cards (rolls.md §7; D-145 beat buttons; D-143 K iPad layout: the panel is a
// fixed box and its log scrolls inside its own box). Rendering and player actions only; no rules here.
import type { Choice } from '../ai/schemas/compose';
import { isNarratedBeat, MANEUVERS, STANCES, type BeatReason, type Stance } from '../data/combat.config';
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

/** Quiet: resolved with no AI call; Narrated: covered by an AI narration (D-145). */
export type CallTag = 'quiet' | 'narrated';
const tagChip = (t: CallTag): HTMLElement => el('span', { class: `tag ${t}`, text: t === 'quiet' ? 'Quiet' : 'Narrated', attrs: { title: t === 'quiet' ? 'No AI call' : 'AI call' } });

/** An exchange's roll card: both d20s, bonuses, modifiers with sources, the margin, the track and the outcome. */
export function renderExchange(r: ExchangeRecord, names: Record<string, string>, tag?: CallTag): HTMLElement {
  const track = `${r.advBefore >= 0 ? '+' : ''}${r.advBefore} → ${r.advAfter >= 0 ? '+' : ''}${r.advAfter}`;
  const good = (r.hit && !r.hit.avoided && r.hit.by === 'A') || (r.striker === 'A' && r.maneuver) || (r.kind === 'buildUp' && r.advAfter > r.advBefore) || (r.kind === 'force' && r.force?.side === 'A' && r.force.success);
  const bad = (r.hit && !r.hit.avoided && r.hit.by === 'B') || (r.striker === 'B' && r.maneuver) || (r.kind === 'buildUp' && r.advAfter < r.advBefore);
  return el('details', { class: `exchange ${good ? 'up' : bad ? 'down' : ''}` }, [
    el('summary', {}, [tag ? tagChip(tag) : null, el('span', { text: `#${r.n} ${r.kind === 'strike' ? 'strike' : r.kind === 'force' ? 'Force' : 'exchange'} · ${outcomeText(r, names)} · track ${track}` })]),
    el('div', { class: 'roll-line', text: rollText(names['pc'] ?? 'You', r.rollA) }),
    el('div', { class: 'roll-line', text: rollText(names[r.targetId] ?? 'Opponent', r.rollB) }),
    el('div', { class: 'roll-line', text: `Margin ${r.margin >= 0 ? '+' : ''}${f1(r.margin)} · ${r.seconds} s${r.surprise ? ' · surprise' : ''}` }),
    ...r.notes.map((n) => el('div', { class: 'hint', text: n })),
  ]);
}

/** The exchanges of one turn in the feed. */
export function renderCombatDraft(c: CombatDraft): HTMLElement {
  const names = Object.fromEntries(c.fighters.map((f) => [f.id, f.name]));
  const tag: CallTag = c.quiet ? 'quiet' : 'narrated';
  return el('div', { class: `roll combat${c.quiet ? ' quiet' : ''}` }, [
    el('div', {}, [tagChip(tag), el('span', { text: `${c.started ? 'The fight begins · ' : ''}${c.records.length} exchange${c.records.length === 1 ? '' : 's'}${c.beat ? ` · ${BEAT_LABEL[c.beat] ?? c.beat}` : ''}${c.ended ? ` · ${c.ended.outcome} (${c.ended.reason})` : ''}` })]),
    ...c.records.map((r) => renderExchange(r, names, tag)),
  ]);
}

/** Beat names for the player (D-145 beats). */
const BEAT_LABEL: Readonly<Record<string, string>> = {
  trackSwing: 'the track swung', periodic: 'a pause', strikeMissed: 'a strike missed', strikeAbsorbed: 'a strike absorbed', minionDown: 'a minion down', clarify: 'what do you do?',
  woundingHit: 'a wounding hit', maneuverLanded: 'a maneuver landed', spent: 'a fighter is spent', forceAction: 'a Force action', sequence: 'a sequence', incapacitated: 'a fighter is down',
  fightEnded: 'the fight ended', playerNarrate: 'narration', boutEnded: 'the bout ended',
};

/** The advantage track (-5..+5): the opponent's name at the left end, the player's at the right, and the value. */
function trackBar(adv: number, pc: string, opp: string): HTMLElement {
  const cells = [];
  for (let i = -5; i <= 5; i++) cells.push(el('span', { class: `cell${i === adv ? ' on' : ''}${i === 0 ? ' zero' : ''}${i >= 3 ? ' strike-a' : i <= -3 ? ' strike-b' : ''}` }));
  const value = adv === 0 ? 'Even' : `${adv > 0 ? '+' : ''}${adv} ${adv > 0 ? pc : opp}`;
  return el('div', { class: 'track-wrap' }, [
    el('span', { class: 'track-end left', text: `◀ ${opp}`, attrs: { title: `left: ${opp} has the upper hand` } }),
    el('div', { class: 'track', attrs: { role: 'meter', 'aria-valuemin': '-5', 'aria-valuemax': '5', 'aria-valuenow': String(adv), 'aria-label': `Advantage: ${value}` } }, cells),
    el('span', { class: 'track-end right', text: `${pc} ▶`, attrs: { title: `right: ${pc} has the upper hand` } }),
    el('span', { class: `track-value${adv > 0 ? ' up' : adv < 0 ? ' down' : ''}`, text: `Advantage: ${value}` }),
  ]);
}

function vitalityRow(name: string, v: number, max: number, status: string, out: boolean): HTMLElement {
  const pct = max > 0 ? Math.max(0, Math.min(100, (v / max) * 100)) : 0;
  return el('div', { class: `fighter${out ? ' out' : ''}` }, [
    el('span', { class: 'fname', text: name, attrs: { title: name } }),
    el('span', { class: 'vbar', attrs: { role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': String(Math.round(max)), 'aria-valuenow': String(Math.round(v)), 'aria-label': `${name} Vitality` } }, [el('span', { class: 'vfill', attrs: { style: `width:${pct.toFixed(0)}%` } })]),
    el('span', { class: 'fnum', text: `${Math.round(v)} / ${Math.round(max)}` }),
    el('span', { class: 'fstatus', text: status }),
  ]);
}

export interface DuelPanelProps {
  state: GameState;
  busy: boolean;
  act(input: TurnInput): void;
  /** The stance is a setting (D-182): no turn, no exchange, no AI call, no time. */
  setStance(stance: Stance): void;
  /** The target is a setting too (D-182): no turn. */
  setTarget(targetRef: string): void;
  /** While a fight is on, the narrator's tactical suggestions from the last turn live in the panel (D-181). */
  suggestions: readonly Choice[];
  pick(choice: Choice): void;
  /** The fight that ended on the last turn, until the player closes its summary (D-181). */
  summary: CombatDraft | null;
  closeSummary(): void;
  /** Dev mode: the AI calls made in this fight so far (null outside dev mode). */
  aiCalls: number | null;
}

const BOUT_RESULT: Readonly<Record<string, string>> = { A: 'won', B: 'lost' };
const PART_LABEL: Readonly<Record<string, string>> = { head: 'head', torso: 'torso', rightArm: 'right arm', leftArm: 'left arm', rightLeg: 'right leg', leftLeg: 'left leg' };

/** A toggle button: selected shows an accent outline, a check and a bold label, never a solid fill (D-183). */
function toggle(label: string, selected: boolean, busy: boolean, onClick: () => void): HTMLElement {
  return el('button', {
    class: `small toggle${selected ? ' selected' : ''}`,
    text: selected ? `✓ ${label}` : label,
    attrs: { 'aria-pressed': String(selected), ...(busy ? { disabled: 'true' } : {}) },
    on: { click: onClick },
  });
}

/** The result of a fight or sparring session that ended on the last turn, with a Close button (D-181). */
function renderSummary(c: CombatDraft, close: () => void): HTMLElement {
  const e = c.ended!;
  const rows: (HTMLElement | null)[] = [];
  if (c.session) {
    const s = c.session;
    rows.push(el('div', { text: `Sparring session over (${s.ended === 'exchanges' ? 'time' : s.ended ?? e.reason}): ${s.won} won, ${s.lost} lost${s.unfinished ? `, ${s.unfinished} unfinished` : ''}.` }));
    if (s.injuries.length) rows.push(el('div', { class: 'hint', text: `Injuries: ${s.injuries.join('; ')}` }));
  } else rows.push(el('div', { text: `Fight over: ${e.outcome} (${e.reason}).` }));
  if (e.playerFate) rows.push(el('div', { class: 'hint', text: `The opponent's choice: ${e.playerFate}` }));
  rows.push(el('div', { class: 'hint', text: c.fighters.map((f) => `${f.name}: ${f.status}`).join(' · ') }));
  return el('div', { class: 'fight-summary' }, [...rows, el('div', { class: 'beat-row' }, [el('button', { class: 'small secondary', text: 'Close', on: { click: close } })])]);
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
    if (p.summary?.ended) items.push(renderSummary(p.summary, p.closeSummary));
    for (const f of fates) {
      const name = selectNpc(s, f.npcId)?.name ?? f.npcId;
      items.push(el('div', { class: 'fate' }, [el('span', { text: `${name} is down. ` }), ...f.options.map((o) => beat(`${o[0]!.toUpperCase()}${o.slice(1)} ${name}`, { action: 'fate', npcRef: f.npcId, fate: o }))]));
    }
    const canReview = last && last.recorded && s.clock.now.day - last.day <= 7 && (s.progression.lastReviewDay === null || s.clock.now.day - s.progression.lastReviewDay >= 7);
    if (canReview) items.push(beat(`Review the recording (${SKILL_BY_ID.get(last.skillId)?.name ?? last.skillId})`, { action: 'review', skillId: last.skillId }));
    // After an auto-resolved spar the player can always step in (D-177).
    if (last?.stakes === 'spar' && last.rematch && last.day === s.clock.now.day) items.push(beat('Play the next bout', { action: 'playNextBout' }));
    return items.length ? el('section', { class: 'box duel' }, [el('div', { class: 'box-body duel-body' }, items)]) : null;
  }

  const d = active.duel as DuelState;
  const lastBout = active.session?.bouts[active.session.bouts.length - 1] ?? null;
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
  // The target is a setting (D-182): the select shows the current one; when it is out the next engaged one is shown.
  const current = d.opponents[d.target] && !d.opponents[d.target]!.out && !d.opponents[d.target]!.engagedElsewhere ? d.opponents[d.target]!.id : engaged[0]?.id;
  const targetSelect = engaged.length > 1
    ? el('select', { attrs: { 'aria-label': 'Target' }, on: { change: (e) => {
          const v = (e.target as HTMLSelectElement).value;
          if (v && v !== current) p.setTarget(v);
        } } }, engaged.map((o) => el('option', { text: `Target: ${o.name}`, attrs: { value: o.id, ...(o.id === current ? { selected: 'true' } : {}) } })))
    : null;
  if (formSelect && p.busy) formSelect.setAttribute('disabled', 'true');
  if (targetSelect && p.busy) targetSelect.setAttribute('disabled', 'true');

  // Quiet or Narrated (D-145): an exchange is narrated once an AI narration has covered it (lastNarrated).
  const logTag = (r: ExchangeRecord): CallTag => (r.n <= active.lastNarrated ? 'narrated' : 'quiet');
  const log = el('div', { class: 'duel-log', attrs: { 'data-scroll': 'duel-log' } }, d.log.slice(-60).map((r) => renderExchange(r, names, logTag(r))));
  const facing = d.opponents[d.target] && !d.opponents[d.target]!.out ? d.opponents[d.target]! : (engaged[0] ?? d.opponents[0]);
  const beatNow = active.beat;
  const beatTag: CallTag = beatNow && isNarratedBeat(beatNow as BeatReason) ? 'narrated' : 'quiet';
  const sess = active.session && !active.session.ended ? active.session : null;
  return el('section', { class: 'box duel' }, [
    el('div', { class: 'box-head' }, [
      el('strong', { text: `Fight · ${active.stakes}${active.sparring ? ` (${active.sparring})` : ''} · exchange ${d.exchange}` }),
      p.aiCalls !== null ? el('span', { class: 'hint dev-calls', text: `AI calls this fight: ${p.aiCalls}` }) : null,
    ]),
    // Pinned (iPad fix): the fighters, the track and the main actions are always visible; the rest scrolls below.
    el('div', { class: 'duel-pinned' }, [
      selectIsDying(s) ? el('div', { class: 'dying', text: 'Dying: get stabilized before the timer runs out.' }) : null,
      // A truce on offer (D-181): accepted here; any other action declines it.
      active.truceOffer
        ? el('div', { class: 'beat-row truce' }, [el('span', { text: `Truce offered: ${active.truceOffer}` }), beat('Accept the truce', { action: 'acceptTruce' }, 'small')])
        : null,
      el('div', { class: 'duel-fighters' }, [
        vitalityRow(d.a.name, d.a.vitality, d.a.maxVitality, d.a.out ? 'out' : 'fighting', d.a.out),
        ...d.opponents.map((o) => vitalityRow(o.name, o.vitality, o.maxVitality, o.out ? 'out' : o.engagedElsewhere ? 'fighting an ally' : o.minion ? 'minion' : 'fighting', o.out)),
      ]),
      trackBar(d.advantage, d.a.name, facing?.name ?? 'Opponent'),
      // Bout result while the session goes on (D-181): the panel stays open between bouts.
      lastBout
        ? el('div', { class: `bout-result${active.beat === 'boutEnded' ? ' fresh' : ''}` }, [
            el('strong', { text: `Bout ${active.session!.bouts.length}: ${BOUT_RESULT[lastBout.winner ?? ''] ?? 'unfinished'}${lastBout.reason ? ` (${lastBout.reason})` : ''}.` }),
            el('span', { text: active.beat === 'boutEnded' ? ` Bout ${active.session!.bouts.length + 1} begins after a breather.` : ` Bout ${active.session!.bouts.length + 1} in progress.` }),
          ])
        : null,
      el('div', { class: 'beat-status' }, [
        el('span', { class: 'hint', text: beatNow ? `Beat: ${BEAT_LABEL[beatNow] ?? beatNow}` : 'Your move' }),
        beatNow ? tagChip(beatTag) : null,
        beatNow ? el('span', { class: 'hint', text: beatTag === 'quiet' ? '(no AI call)' : '(AI call)' }) : null,
      ]),
      el('div', { class: 'beat-row main-actions' }, [
        beat(sess && !sess.playing ? 'Spar it out' : 'Continue', { action: 'continue' }, 'small'),
        beat('Fight on', { action: 'fightOn' }, 'small'),
        beat('Narrate', { action: 'narrate' }, 'small secondary'),
        beat('Resolve to end', { action: 'resolve' }, 'small secondary'),
      ]),
      // A sparring session (D-168): the rest resolves at once by default; a bout can be played out beat by beat.
      sess
        ? el('div', { class: 'beat-row' }, [
            el('span', { class: 'hint', text: `Sparring: bout ${sess.bouts.length + 1}, ${sess.bouts.filter((b) => b.winner === 'A').length} won, ${sess.bouts.filter((b) => b.winner === 'B').length} lost` }),
            sess.playing ? null : beat('Play this bout', { action: 'playBout' }, 'small'),
            beat('Stop sparring', { action: 'stopSession' }, 'small secondary'),
          ])
        : null,
    ]),
    el('div', { class: 'box-body duel-body' }, [
      // A stance is a setting (D-182): it stays selected until changed and resolves nothing.
      el('div', { class: 'beat-row' }, [
        el('span', { class: 'hint', text: 'Stance' }),
        ...STANCES.map((st) => toggle(st, d.a.stance === st, p.busy, () => d.a.stance !== st && p.setStance(st))),
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
        ...MANEUVERS.map((m) => toggle(m, d.a.pendingManeuver === m, p.busy, () => p.act({ kind: 'beat', label: m, action: { action: 'maneuver', maneuver: m } as never }))),
      ]),
      // Aimed strike (D-171): -2 to the strike, and it lands where aimed.
      el('div', { class: 'beat-row' }, [
        el('span', { class: 'hint', text: 'Aim (-2)' }),
        ...(['head', 'torso', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'] as const).map((part) => toggle(PART_LABEL[part]!, d.a.aim === part, p.busy, () => p.act({ kind: 'beat', label: `Aim: ${PART_LABEL[part]}`, action: { action: 'aim', part } as never }))),
      ]),
      forceActs.length || d.a.shatterpoint > 0
        ? el('div', { class: 'beat-row' }, [
            el('span', { class: 'hint', text: 'Force' }),
            ...forceActs.filter(([, kind]) => kind !== 'throw' || throwable.length).map(([label, kind]) => beat(label, { action: 'force', force: { kind, ...(kind === 'throw' ? { objectTag: throwable[0]![0] } : {}) } })),
            d.a.shatterpoint > 0 && !d.a.shatterpointUsed ? beat('Read the shatterpoint', { action: 'shatterpoint' }) : null,
          ])
        : null,
      formSelect || targetSelect ? el('div', { class: 'beat-row' }, [el('span', { class: 'hint', text: 'Form' }), formSelect, targetSelect]) : null,
      // The narrator's suggestions go last (D-181).
      p.suggestions.length
        ? el('div', { class: 'beat-row suggestions' }, [
            el('span', { class: 'hint', text: 'Or' }),
            ...p.suggestions.map((c) => el('button', { class: 'small secondary', text: c.label, attrs: p.busy ? { disabled: 'true' } : {}, on: { click: () => p.pick(c) } })),
          ])
        : null,
      el('details', { class: 'log duel-log-wrap' }, [el('summary', { text: `Duel log (${d.log.length})` }), log]),
    ]),
  ]);
}
