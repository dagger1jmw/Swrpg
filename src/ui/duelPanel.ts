// The duel panel and the exchange roll cards (rolls.md §7; D-145 beat buttons; D-143 K iPad layout: the panel is a
// fixed box and its log scrolls inside its own box). Rendering and player actions only; no rules here.
import type { Choice } from '../ai/schemas/compose';
import { collapseRiskPerUse, forceFraction } from '../engine/forceMeter';
import { isNarratedBeat, MANEUVERS, PRECOG, STANCES, STRIKE_AT, type BeatReason, type Stance } from '../data/combat.config';
import { FORM_IDS, SKILL_BY_ID } from '../data/skills';
import type { BasicRoll } from '../engine/rolls';
import { canThrowSaber, type ForceOutcome } from '../engine/combatForce';
import { CARD_ONLY_NOTE, partText, type DuelState, type ExchangeRecord } from '../engine/duel';
import { selectActiveFight, selectFates, selectLastFight } from '../features/combat/selectors';
import { selectIsDying } from '../features/health/selectors';
import { selectNpc } from '../features/npcs/selectors';
import { selectLevelExact } from '../features/progression/selectors';
import type { GameState } from '../state/gameState';
import type { CombatDraft } from '../turn/combatTurn';
import type { TurnInput } from '../turn/record';
import { el } from './dom';

/** Short failure reasons on the roll card (D-192). */
const FORCE_OUTCOME_SHORT: Readonly<Record<ForceOutcome, string>> = { success: 'success', skillTooLow: 'fell short', natural1: 'natural 1', dodged: 'dodged', cover: 'blocked by cover', forceResisted: 'resisted with the Force', willResisted: 'will held', deflected: 'caught by a lightsaber', immune: 'immune', forceInvisible: 'outside the Force', negated: 'Force-null bubble' };

/** One decimal, never "-0.0" (issue 20). */
const f1 = (n: number): string => {
  const r = Math.round(n * 10) / 10;
  return r === 0 ? '0' : Number.isInteger(r) ? String(r) : r.toFixed(1);
};
const signed = (n: number): string => `${Math.round(n * 10) / 10 > 0 ? '+' : ''}${f1(n)}`;

/** A Force ability's name for the player (issue 21: no raw ids such as forcePush). */
export const abilityName = (id: string): string => SKILL_BY_ID.get(id)?.name ?? id;

/** A weapon in a word or two for the panel (D-216). */
export const WEAPON_SHORT: Readonly<Record<string, string>> = { unarmed: 'unarmed', melee: 'melee weapon', blasterPistol: 'blaster pistol', blasterRifle: 'blaster rifle', heavy: 'heavy blaster', slugPistol: 'slugthrower pistol', slugRifle: 'slugthrower rifle', scatterGun: 'scatter gun', lightsaber: 'lightsaber', trainingSaber: 'training saber' };

/** How a fight ended, in words (issue 21: "won (allOut)", "lost (sparring session (stopped))"). */
const END_REASON: Readonly<Record<string, string>> = { allOut: 'every opponent is down', incapacitated: 'a fighter is down', dying: 'a fighter is dying', dead: 'a fighter is dead', spent: 'a fighter is spent', point: 'on a point', stopped: 'stopped', exhausted: 'a fighter collapsed from exhaustion', opponentsDefeated: 'your opponents defeated', yielded: 'the opponents broke (surrendered, fled or withdrew)', captured: 'subdued and taken captive', stalemate: 'an exhausted stalemate, both sides spent', brokeOff: 'an opponent beyond your power to beat broke off' };
/**
 * An opponent's armor on the card (Jared, after pass 4: the Vong's saber-resistant armor showed nowhere): its weight,
 * its own name, and whether it stands up to a lightsaber (health §5: armor counts x0.25 against a saber unless
 * saber-resistant). Nothing for no armor.
 */
export function armorText(o: { armor: string; saberResistant: boolean; armorName?: string }): string {
  if (o.armor === 'none' && !o.saberResistant) return '';
  const name = o.armorName ?? `${o.armor} armor`;
  return o.saberResistant ? `${name} (resists lightsabers)` : name;
}

/** Interruption causes in words (pass 4 issue 12: "interrupted: environmentCollapse: ..." on the end card). */
const INTERRUPT_WORDS: Readonly<Record<string, string>> = { environmentCollapse: 'the place came down', reinforcements: 'reinforcements arrived', alarmOrAuthorities: 'the alarm was raised', thirdParty: 'someone else stepped in' };
export function endText(outcome: string, reason: string): string {
  const cat = /^(\w+):\s*/.exec(reason);
  const raw = cat && INTERRUPT_WORDS[cat[1]!] ? `${INTERRUPT_WORDS[cat[1]!]} (${reason.slice(cat[0].length)})` : reason;
  const why = END_REASON[raw] ?? raw.replace(/\s*\(([^()]*)\)/g, ': $1');
  return why && why !== outcome ? `${outcome}: ${why}` : outcome;
}
/** The opponent's choice in words (pass 4 issue 12: "killingStrike"). */
export const FATE_WORDS: Readonly<Record<string, string>> = { killingStrike: 'a killing strike', captured: 'taken captive', left: 'left where you fell' };

/**
 * Modifiers for display (issue 20): the same source summed into one entry ("+1 aggressive stance -1 aggressive stance"
 * on a build-up roll is the stance's attack and defense, net 0), zero entries left out.
 */
function mergedModifiers(mods: BasicRoll['modifiers']): { source: string; value: number }[] {
  const by = new Map<string, number>();
  for (const m of mods) by.set(m.source, (by.get(m.source) ?? 0) + m.value);
  return [...by].filter(([, v]) => Math.abs(v) > 1e-9).map(([source, value]) => ({ source, value }));
}

/** One side's roll as text: die, natural bonus, level bonus, each modifier with its source, total (rolls §7). */
export function rollText(label: string, r: BasicRoll | null): string {
  if (!r) return `${label}: no roll`;
  const parts = [`d20 ${r.d20}`];
  if (r.naturalBonus) parts.push(`${r.naturalBonus > 0 ? '+' : ''}${r.naturalBonus} natural`);
  parts.push(`+${f1(r.levelBonus)} level`);
  for (const m of mergedModifiers(r.modifiers)) parts.push(`${signed(m.value)} ${m.source}`);
  return `${label}: ${parts.join(' ')} = ${f1(r.total)}`;
}

/** The headline of a roll card (exported for tests). */
export function outcomeText(r: ExchangeRecord, names: Record<string, string>): string {
  const pc = names['pc'] ?? 'You';
  const t = names[r.targetId] ?? 'opponent';
  if (r.kind === 'force' && r.force) {
    const f = r.force;
    const label = f.kind === 'saberThrow' ? 'Saber throw' : f.kind === 'recall' ? 'Saber recall' : abilityName(f.abilityId);
    // Records from before D-192 have no outcome or difficulty (issue 17): they read "resisted".
    const outcome = f.misfire ? 'misfire' : f.collapse ? 'collapse' : f.success ? 'success' : (FORCE_OUTCOME_SHORT[f.outcome] ?? 'resisted');
    return `${label}: ${outcome}${f.dc !== null && f.dc !== undefined ? ` (DC ${f1(f.dc)})` : ''}${f.damage?.severity ? ` · ${f.damage.severity} wound, ${partText(f.damage.part)}` : ''}${f.stoodDown ? ' · stands down' : ''}${f.saberDropped ? ' · saber dropped' : ''}`;
  }
  // A build-up exchange that cuts a minion down is headed by the hit, not the track (issue 20, R6).
  if (r.kind === 'buildUp' && r.hit && !r.hit.avoided) return hitHeadline(r, pc, t);
  // A fighter who breaks off in this exchange resets the track to 0: the card says what happened, with the margin (pass
  // 5 issue 9, M5 final check: "Joren Tal gains ground · track +0 → +0" on a margin of +13.3 as the Sith withdrew).
  const left = breakOff(r);
  if (r.kind === 'buildUp' && left) return `${left} · margin ${signed(r.margin)}`;
  if (r.kind === 'buildUp') return r.advAfter === r.advBefore ? 'even' : r.advAfter > r.advBefore ? `${pc} gains ground` : `${t} gains ground`;
  if (r.maneuver) return `${r.maneuver.kind}`;
  if (!r.hit) return 'strike recovered';
  if (r.hit.avoided) return 'precognition: avoided';
  if (r.hit.point) return 'point';
  return hitHeadline(r, pc, t);
}

/** "Duelist 1 withdraws", "Thug 2 surrenders", "Thug 3 flees" from an exchange's notes, or null. */
export function breakOff(r: ExchangeRecord): string | null {
  for (const n of r.notes) {
    const m = /^(.+?) withdraws: /.exec(n) ?? /^(.+?)'s morale breaks: (surrenders|disengages and flees)/.exec(n);
    if (m) return `${m[1]} ${m[2] === 'surrenders' ? 'surrenders' : m[2] ? 'flees' : 'withdraws'}`;
  }
  return null;
}

/** A hit's headline: who hit whom, the quality, and the wound in words ("solid hit on B1 battle droid 1 · moderate wound, left arm"). */
function hitHeadline(r: ExchangeRecord, pc: string, t: string): string {
  const h = r.hit!;
  const victim = h.redirected ? (h.by === 'A' ? t : pc) : h.by === 'A' ? t : pc;
  const what = h.severed ? `${partText(h.part)} severed` : h.severity ? `${h.severity} wound, ${partText(h.part)}` : h.prosthetic ? `${partText(h.part)} (prosthetic): no wound` : h.stun ? 'stunned: no wound' : 'no wound';
  return `${h.quality} hit on ${victim} · ${what}`;
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
    el('summary', {}, [tag ? tagChip(tag) : null, el('span', { text: `#${r.n} ${r.kind === 'strike' ? 'strike' : r.kind === 'force' ? 'Force' : 'exchange'} · ${outcomeText(r, names)}${r.kind === 'buildUp' && breakOff(r) ? '' : ` · track ${track}`}` })]),
    el('div', { class: 'roll-line', text: rollText(names['pc'] ?? 'You', r.rollA) }),
    el('div', { class: 'roll-line', text: rollText(names[r.targetId] ?? 'Opponent', r.rollB) }),
    el('div', { class: 'roll-line', text: `${marginLabel(r, names['pc'] ?? 'You')} · ${r.seconds} s${r.surprise ? ' · surprise' : ''}${r.duringForce ? ' · while you use the Force' : ''}` }),
    ...(coverNote(r) ? [el('div', { class: 'hint', text: coverNote(r)! })] : []),
    ...r.notes.map((n) => el('div', { class: 'hint', text: n.startsWith(CARD_ONLY_NOTE) ? n.slice(CARD_ONLY_NOTE.length) : n })),
  ]);
}

/**
 * Both shooters in cover on one exchange (D-243; M5 balance row 4): the two bonuses cancel, which the card says so the
 * "+2 cover" on each line does not read as an edge for either side. Null otherwise.
 */
export function coverNote(r: ExchangeRecord): string | null {
  const has = (roll: BasicRoll | null): boolean => !!roll?.modifiers.some((m) => m.source === 'cover');
  return has(r.rollA) && has(r.rollB) ? 'cover on both sides: the two bonuses cancel' : null;
}

/**
 * The margin from the player's side (issue 20: it followed the striker, +10.4 on the opponent's hit on the player). A
 * Force use against a difficulty is the roll against the DC; a block or dodge after it says so.
 */
export function marginLabel(r: ExchangeRecord, pc: string): string {
  if (r.kind === 'force' && r.force) {
    const f = r.force;
    const vs = f.dc !== null && f.dc !== undefined && !f.resist ? 'roll vs DC' : 'margin';
    const after = !f.success && !['skillTooLow', 'natural1'].includes(f.outcome) && f.outcome ? ` (then ${FORCE_OUTCOME_SHORT[f.outcome] ?? 'resisted'})` : '';
    return `${pc} ${vs} ${signed(r.margin)}${after}`;
  }
  const mine = r.kind === 'strike' && r.striker === 'B' ? -r.margin : r.margin;
  return `Margin for ${pc} ${signed(mine)}`;
}

/** The exchanges of one turn in the feed. */
export function renderCombatDraft(c: CombatDraft): HTMLElement {
  const names = Object.fromEntries(c.fighters.map((f) => [f.id, f.name]));
  const tag: CallTag = c.quiet ? 'quiet' : 'narrated';
  return el('div', { class: `roll combat${c.quiet ? ' quiet' : ''}` }, [
    el('div', {}, [tagChip(tag), el('span', { text: `${c.started ? 'The fight begins · ' : ''}${c.records.length} exchange${c.records.length === 1 ? '' : 's'}${c.beat ? ` · ${BEAT_LABEL[c.beat] ?? c.beat}` : ''}${c.ended ? ` · ${endText(c.ended.outcome, c.ended.reason)}` : ''}` })]),
    ...c.notes.filter((n) => /^(intent )?step \d/.test(n)).map((n) => el('div', { class: `roll-line step-line${/: FAILED/.test(n) ? ' failed' : /: NOT REACHED/.test(n) ? ' skipped' : ''}`, text: n })),
    ...c.records.map((r) => renderExchange(r, names, tag)),
  ]);
}

/** Beat names for the player (D-145 beats). */
const BEAT_LABEL: Readonly<Record<string, string>> = {
  trackSwing: 'the track swung', periodic: 'a pause', strikeMissed: 'a strike missed', strikeAbsorbed: 'a strike absorbed', minionDown: 'a minion down', minionHit: 'a minion hit', noEffect: 'no effect', clarify: 'what do you do?',
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

/**
 * The Force meter (D-194): load against capacity. Above 1.0 the meter is red with the collapse risk per use (health §2,
 * through forceMeter.ts); the rule itself is unchanged until the M6 redesign.
 */
export function forceMeterView(f: number, cap: number): { pct: number; over: boolean; risk: number; text: string } {
  const frac = forceFraction(f, cap);
  const risk = collapseRiskPerUse(f, cap);
  const over = frac > 1;
  return { pct: Math.round(frac * 100), over, risk, text: over ? `Over your limit: ${Math.round(risk * 100)}% collapse risk per use` : '' };
}

/** The meter row's short line while under the limit: precognition's load, when the character has it (D-222). */
export const PRECOG_METER_TEXT = `precognition ${PRECOG.load}/use`;

function forceMeterRow(f: number, cap: number, precog: boolean): HTMLElement {
  const v = forceMeterView(f, cap);
  return el('div', { class: `fighter force-meter${v.over ? ' over' : ''}` }, [
    el('span', { class: 'fname', text: 'Force' }),
    el('span', { class: 'vbar', attrs: { role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(v.pct), 'aria-label': 'Force meter' } }, [el('span', { class: 'vfill', attrs: { style: `width:${Math.min(100, v.pct)}%` } })]),
    el('span', { class: 'fnum', text: `${v.pct}%` }),
    // One short line on the meter's row (D-216: the long text pushed the stance row out of a wide panel).
    v.over
      ? el('span', { class: 'fstatus over-text', text: `over limit: ${Math.round(v.risk * 100)}%/use`, attrs: { title: v.text } })
      : el('span', { class: 'fstatus', text: precog ? PRECOG_METER_TEXT : '', attrs: precog ? { title: `Precognitive defense fires against strikes that would hit you and adds ${PRECOG.load} Force load each time, even when you use no Force action.` } : {} }),
  ]);
}

export interface DuelPanelProps {
  state: GameState;
  busy: boolean;
  act(input: TurnInput): void;
  /** The stance is a setting (D-182): no turn, no exchange, no AI call, no time. */
  setStance(stance: Stance): void;
  /** Push through (m9-tune2 addendum 3e): a setting too, no turn. */
  setPush(on: boolean): void;
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
  /** "More actions" open (view state, kept for the fight; collapsed by default). */
  moreOpen: boolean;
  setMoreOpen(open: boolean): void;
}

/** The warning shown while the opponent holds the strike (advantage -3 or lower; D-199), or null. */
export const initiativeWarning = (advantage: number): string | null => (advantage <= -STRIKE_AT ? 'Opponent has the initiative: a sequence may be cut short' : null);

/** Mind abilities cannot touch this fighter (D-192): a droid, a lore-immune species, or someone outside the Force. */
export const mindImmune = (f: { forceTraits?: readonly string[] }): boolean => (f.forceTraits ?? []).some((t) => t === 'droid' || t === 'mindImmune' || t === 'forceInvisible');

const BOUT_RESULT: Readonly<Record<string, string>> = { A: 'won', B: 'lost' };
const PART_LABEL: Readonly<Record<string, string>> = { head: 'head', torso: 'torso', rightArm: 'right arm', leftArm: 'left arm', rightLeg: 'right leg', leftLeg: 'left leg' };

/** A toggle button: selected shows an accent outline, a check and a bold label, never a solid fill (D-183). */
function toggle(label: string, selected: boolean, busy: boolean, onClick: () => void, title?: string): HTMLElement {
  return el('button', {
    class: `small toggle${selected ? ' selected' : ''}`,
    text: selected ? `✓ ${label}` : label,
    attrs: { 'aria-pressed': String(selected), ...(title ? { title } : {}), ...(busy ? { disabled: 'true' } : {}) },
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
  } else rows.push(el('div', { text: `Fight over: ${endText(e.outcome, e.reason)}.` }));
  if (e.playerFate) rows.push(el('div', { class: 'hint', text: `The opponent's choice: ${FATE_WORDS[e.playerFate] ?? e.playerFate}` }));
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
      // While the opponent is dying, sparing them means leaving them to die (issue 18).
      const label = (o: string): string => (o === 'spare' && f.dying ? `Spare ${name} (leave dying)` : `${o[0]!.toUpperCase()}${o.slice(1)} ${name}`);
      items.push(el('div', { class: 'fate' }, [el('span', { text: `${name} is ${f.dying ? 'dying' : 'down'}. ` }), ...f.options.map((o) => beat(label(o), { action: 'fate', npcRef: f.npcId, fate: o }))]));
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
      ['Mind trick', 'mindTrick', 'mindTrick'],
      ['Saber throw', 'saberThrow', 'telekinesis'],
      ['Recall saber', 'recall', 'telekinesis'],
    ] as const
    // The saber throw shows only when the engine would allow it (pass 4 issue 9: live at Telekinesis 2, then refused).
  ).filter(([, kind, ability]) => selectLevelExact(s, ability) >= 1 && (kind === 'recall' ? !!d.a.saberLost : kind === 'saberThrow' ? canThrowSaber(d.a, selectLevelExact(s, ability)) : true));
  const throwable = Object.entries(active.objects).filter(([, n]) => n > 0);
  const forceRisk = forceMeterView(d.a.meters.f, d.a.caps.f);
  const formSelect = forms.length
    ? el('select', { attrs: { 'aria-label': 'Change form' }, on: { change: (e) => {
          const v = (e.target as HTMLSelectElement).value;
          if (v) p.act({ kind: 'beat', label: `Switch to ${SKILL_BY_ID.get(v)?.name ?? v}`, action: { action: 'formChange', form: v } as never });
        } } }, [el('option', { text: 'Change form…', attrs: { value: '' } }), ...forms.map((f) => el('option', { text: SKILL_BY_ID.get(f)?.name ?? f, attrs: { value: f } }))])
    : null;
  // The target is a setting (D-182): the select shows the current one; when it is out the next engaged one is shown.
  const current = d.opponents[d.target] && !d.opponents[d.target]!.out && !d.opponents[d.target]!.engagedElsewhere ? d.opponents[d.target]!.id : engaged[0]?.id;
  if (formSelect && p.busy) formSelect.setAttribute('disabled', 'true');

  // Quiet or Narrated (D-145): an exchange is narrated once an AI narration has covered it (lastNarrated).
  const logTag = (r: ExchangeRecord): CallTag => (r.n <= active.lastNarrated ? 'narrated' : 'quiet');
  const log = el('div', { class: 'duel-log', attrs: { 'data-scroll': 'duel-log' } }, d.log.slice(-60).map((r) => renderExchange(r, names, logTag(r))));
  const facing = d.opponents[d.target] && !d.opponents[d.target]!.out ? d.opponents[d.target]! : (engaged[0] ?? d.opponents[0]);
  const beatNow = active.beat;
  const beatTag: CallTag = beatNow && isNarratedBeat(beatNow as BeatReason) ? 'narrated' : 'quiet';
  const sess = active.session && !active.session.ended ? active.session : null;
  // A session not being played out resolves the rest at once from any passive action: one button for it.
  const montage = sess !== null && !sess.playing;
  // The opponent's weapon is shown with the status (D-216; pass 2: one Mandalorian's slugthrower showed nowhere).
  const status = (o: (typeof d.opponents)[number]): string => `${o.out ? 'out' : o.engagedElsewhere ? 'fighting an ally' : o.minion ? 'minion' : 'fighting'} · ${o.weaponName ?? WEAPON_SHORT[o.weapon] ?? o.weapon}${armorText(o) ? ` · ${armorText(o)}` : ''}`;
  const others = d.opponents.filter((o) => o.id !== facing?.id);
  const act = (label: string, action: Record<string, unknown>, cls = 'small act', title?: string): HTMLElement =>
    el('button', { class: cls, text: label, attrs: { ...(title ? { title } : {}), ...(p.busy ? { disabled: 'true' } : {}) }, on: { click: () => p.act({ kind: 'beat', label, action: action as never }) } });

  const primary = montage
    ? [
        act('Spar it out', { action: 'continue' }, 'small act', 'Resolve the rest of the session at once (one narration)'),
        act('Play this bout', { action: 'playBout' }, 'small act', 'Play the current bout out beat by beat'),
        act('Stop sparring', { action: 'stopSession' }, 'small act secondary'),
      ]
    : [
        // Next beat: to the next moment you can act, often quiet (no AI call). To key moment: on through the quiet
        // beats to the next narrated one (a wounding hit, a landed maneuver, someone spent or down).
        act('Next beat', { action: 'continue' }, 'small act', 'Fight to the next beat: usually a quiet one, no AI call'),
        act('To key moment', { action: 'fightOn' }, 'small act', 'Fight on through quiet beats to the next narrated moment (an AI call)'),
        act('Narrate', { action: 'narrate' }, 'small act secondary', 'Narrate the exchanges so far (an AI call), no new exchange'),
        act('Resolve to end', { action: 'resolve' }, 'small act secondary', 'Fight it out to the end now'),
      ];

  // The disabled Force actions' reasons, on screen under their row (opt-2 I1): a disabled button has no tooltip on touch.
  const forceWhy: string[] = [];
  const more = el('details', { class: 'duel-more', ...(p.moreOpen ? { attrs: { open: '' } } : {}), on: { toggle: (e) => p.setMoreOpen((e.target as HTMLDetailsElement).open) } }, [
    el('summary', { text: 'More actions' }),
    el('div', { class: 'duel-more-body' }, [
      others.length ? el('div', { class: 'duel-fighters others' }, others.map((o) => vitalityRow(o.name, o.vitality, o.maxVitality, status(o), o.out))) : null,
      // Settings (outline toggles with a check): the target, the next strike, the aim. Actions are filled buttons.
      engaged.length > 1
        ? el('div', { class: 'beat-row' }, [el('span', { class: 'hint', text: 'Target' }), ...engaged.map((o) => toggle(o.name, o.id === current, p.busy, () => o.id !== current && p.setTarget(o.id)))])
        : null,
      el('div', { class: 'beat-row' }, [
        el('span', { class: 'hint', text: 'Tactic' }),
        act('Feint', { action: 'tactic', tactic: 'feint' }),
        act('Taunt', { action: 'tactic', tactic: 'taunt' }),
        act('Take position', { action: 'tactic', tactic: 'takePosition' }),
        act('Disengage', { action: 'tactic', tactic: 'disengage' }),
        act('Surrender', { action: 'tactic', tactic: 'surrender' }, 'small act warn'),
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
            ...forceActs.filter(([, kind]) => kind !== 'throw' || throwable.length).map(([label, kind]) => {
              // A mind trick on a droid, a lore-immune species or a Force-invisible foe: greyed out, no exchange (D-194).
              if (kind === 'mindTrick' && facing && mindImmune(facing)) return forceWhy.push(`${label}: ${facing.name} cannot be mind-tricked`), el('button', { class: 'small act', text: `${label} (immune)`, attrs: { disabled: 'true', title: `${facing.name} cannot be mind-tricked` } });
              // Where the Force cannot work (D-216): nothing in a Force-null bubble; nothing that touches a foe outside the
              // Force directly (a thrown object or saber still hits; D-192).
              if (active.ctx.forceNegated) return forceWhy.push(`${label}: a Force-null bubble, the Force cannot be used here`), el('button', { class: 'small act', text: `${label} (no Force here)`, attrs: { disabled: 'true', title: 'A Force-null bubble: the Force cannot be used here' } });
              // Lightning (and its variants) still reaches them (D-447; SW_Force_Powers_Part2b F7).
              if (facing?.forceTraits?.includes('forceInvisible') && (kind === 'push' || kind === 'choke')) return forceWhy.push(`${label}: ${facing.name} cannot be touched through the Force; a thrown object or lightning can`), el('button', { class: 'small act', text: `${label} (immune)`, attrs: { disabled: 'true', title: `${facing.name} cannot be touched through the Force; a thrown object or lightning can` } });
              const risk = forceRisk.over ? ` (${Math.round(forceRisk.risk * 100)}% collapse)` : '';
              return act(`${label}${risk}`, { action: 'force', force: { kind, ...(kind === 'throw' ? { objectTag: throwable[0]![0] } : {}) } }, `small act${forceRisk.over ? ' risky' : ''}`, forceRisk.over ? forceRisk.text : undefined);
            }),
            d.a.shatterpoint > 0 && !d.a.shatterpointUsed ? act('Read the shatterpoint', { action: 'shatterpoint' }) : null,
          ])
        : null,
      forceWhy.length ? el('div', { class: 'hint battle-why' }, [...new Set(forceWhy)].map((t) => el('div', { text: t }))) : null,
      formSelect ? el('div', { class: 'beat-row' }, [el('span', { class: 'hint', text: 'Form' }), formSelect]) : null,
      sess && sess.playing ? el('div', { class: 'beat-row' }, [el('span', { class: 'hint', text: 'Sparring' }), act('Stop sparring', { action: 'stopSession' }, 'small act secondary')]) : null,
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

  return el('section', { class: 'box duel compact' }, [
    el('div', { class: 'box-head' }, [
      el('strong', { text: `Fight · ${active.stakes}${active.sparring ? ` (${active.sparring})` : ''} · exchange ${d.exchange}${sess ? ` · bout ${sess.bouts.length + 1} (${sess.bouts.filter((b) => b.winner === 'A').length}-${sess.bouts.filter((b) => b.winner === 'B').length})` : ''}` }),
      p.aiCalls !== null ? el('span', { class: 'hint dev-calls', text: `AI calls this fight: ${p.aiCalls}` }) : null,
    ]),
    el('div', { class: 'box-body duel-body' }, [
      selectIsDying(s) ? el('div', { class: 'dying', text: 'Dying: get stabilized before the timer runs out.' }) : null,
      // A truce on offer (D-181): accepted here; any other action declines it.
      active.truceOffer
        ? el('div', { class: 'beat-row truce' }, [el('span', { text: `Truce offered: ${active.truceOffer}` }), act('Accept the truce', { action: 'acceptTruce' })])
        : null,
      // Always visible: the player and the opponent faced, the track, the beat line, the primary row and the stance.
      el('div', { class: 'duel-fighters' }, [
        vitalityRow(d.a.name, d.a.vitality, d.a.maxVitality, d.a.out ? 'out' : 'fighting', d.a.out),
        // The Force meter once the character has used the Force (always while over the limit, D-194).
        d.a.caps.f > 0 && d.a.meters.f > 0 ? forceMeterRow(d.a.meters.f, d.a.caps.f, d.a.forceSense > 0 && !active.ctx.forceNegated) : null,
        facing ? vitalityRow(facing.name, facing.vitality, facing.maxVitality, status(facing), facing.out) : null,
      ]),
      trackBar(d.advantage, d.a.name, facing?.name ?? 'Opponent'),
      el('div', { class: 'beat-status' }, [
        el('span', { class: 'hint', text: beatNow ? `Beat: ${BEAT_LABEL[beatNow] ?? beatNow}` : 'Your move' }),
        beatNow ? tagChip(beatTag) : null,
        beatNow ? el('span', { class: 'hint', text: beatTag === 'quiet' ? '(no AI call)' : '(AI call)' }) : null,
        // Bout result while the session goes on (D-181).
        lastBout ? el('span', { class: `bout-result${active.beat === 'boutEnded' ? ' fresh' : ''}`, text: `Bout ${active.session!.bouts.length}: ${BOUT_RESULT[lastBout.winner ?? ''] ?? 'unfinished'}${lastBout.reason ? ` (${lastBout.reason})` : ''}${active.beat === 'boutEnded' ? `; bout ${active.session!.bouts.length + 1} next` : ''}` }) : null,
        // An opponent fighting an ally is not "still fighting" the player (D-242).
        others.length ? el('span', { class: 'hint', text: `+${others.length} more: ${others.filter((o) => !o.out && !o.engagedElsewhere).length} still fighting${others.some((o) => !o.out && o.engagedElsewhere) ? `, ${others.filter((o) => !o.out && o.engagedElsewhere).length} fighting an ally` : ''}${others.some((o) => o.out) ? `, ${others.filter((o) => o.out).length} down` : ''}` }) : null,
      ]),
      // The opponent holds the strike (D-199): a typed sequence may be cut short by it.
      initiativeWarning(d.advantage) ? el('div', { class: 'warn-line initiative', text: initiativeWarning(d.advantage)! }) : null,
      el('div', { class: 'beat-row main-actions' }, primary),
      // The stance: one segmented setting (D-182), under the primary row.
      el('div', { class: 'stance-seg', attrs: { role: 'group', 'aria-label': 'Stance' } }, [
        el('span', { class: 'hint', text: 'Stance' }),
        el('div', { class: 'seg' }, STANCES.map((st) => toggle(st, d.a.stance === st, p.busy, () => d.a.stance !== st && p.setStance(st), `${st} stance (a setting: no exchange)`))),
        // Push through (m9-tune2 addendum 3e): double the strain each exchange; good form pays more and builds stamina.
        toggle('Push through', d.a.pushing === true, p.busy, () => p.setPush(d.a.pushing !== true), 'Push through: every exchange costs double the strain; keeping good form while tired pays more and builds stamina (a setting: no exchange)'),
      ]),
      more,
    ]),
  ]);
}
