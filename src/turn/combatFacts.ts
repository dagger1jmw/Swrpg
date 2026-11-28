// The explicit outcome list for a combat narration (D-197): what the narrator's block states and what the
// post-narration check reads. Per exchange: HIT (target, location, severity) or NO HIT. Per step: DONE, FAILED or NOT
// REACHED. Built only from the engine's records; pure.
import { CARD_ONLY_NOTE, partText, redirectNote } from '../engine/duel';
import { forceReason } from '../engine/combatForce';
import { BUILD_UP, NARRATION_LENGTH, SUBDUE_TEXT } from '../data/combat.config';
import { RANGED_WEAPONS } from '../data/weapons';
import { TERRAIN_BY_ID } from '../data/terrain';
import { SKILL_BY_ID } from '../data/skills';
import type { WeaponKind } from '../data/health.config';
import type { CombatDraft, CombatFighterView } from './combatTurn';
import type { ExchangeRecord } from '../engine/duel';

/** An exchange's notes for the block, without the card-only ones (D-222). */
const toldNotes = (r: ExchangeRecord): string => {
  const n = r.notes.filter((x) => !x.startsWith(CARD_ONLY_NOTE)).map(fumbleText);
  return n.length ? ` ${n.join('; ')}.` : '';
};

/**
 * A natural 1 in the block (D-269): a mistake by that fighter in that exchange, told as a misstep, a stumble or an
 * overextension; the slip rule allows those words for that fighter (pass 5: "a sudden misstep" flagged three times).
 */
export const fumbleText = (note: string): string =>
  note.replace(/^(.+) rolled a natural 1: opening for (.+)$/, '$1 makes a mistake (fumble): an opening for $2; tell it as a misstep, a stumble or an overextension by $1 (no fall, no slip on the ground)');

export interface HitFact {
  /** Exchange number. */
  n: number;
  byPlayer: boolean;
  targetId: string;
  targetName: string;
  part: string;
  /** Null: no wound (winded). */
  severity: string | null;
  severed: boolean;
  /** A subduing hit (D-262): no wound and no place on the body; the verb ("stuns", "snares"). */
  stun?: string;
}

export interface StepFact {
  index: number;
  label: string;
  status: 'DONE' | 'FAILED' | 'NOT REACHED';
  detail: string;
  /** The Force action of a Force step (push, choke, lightning, throw, mindTrick, saberThrow, recall), else null. */
  force: string | null;
}

export interface CombatFacts {
  /** One line per exchange, in order. */
  lines: string[];
  hits: HitFact[];
  steps: StepFact[];
  /** Things that did not happen: misses, steps not reached, failed Force uses. */
  didNotHappen: string[];
  /** Opponents the player did not hit in this block, by id. */
  unhitOpponents: { id: string; name: string; out: boolean; minion: boolean }[];
  playerHit: boolean;
  anySevered: boolean;
  /**
   * Steps whose result fell short of what the player asked for (m9-fix-deflect): a redirect that sent no bolt back, a Force
   * action that FAILED. The narrator tells the attempt and how it fell short; the check fails a narration that drops the goal.
   */
  shortOfIntent: ShortOfIntent[];
}

export interface ShortOfIntent {
  n: number;
  /** redirect, or the Force action (push, choke, lightning, throw, mindTrick, saberThrow, recall). */
  kind: string;
  /** What the player asked for, in plain words ("send Thug 1's bolts back"). */
  goal: string;
  /** How it fell short, in plain words. */
  result: string;
}

/** A thrown object in words, by its terrain tag (issue 19). */
const THROWN_TEXT: Readonly<Record<string, string>> = { fallenTimber: 'a fallen log', looseRock: 'a loose rock', debris: 'a chunk of debris', machinery: 'a piece of machinery', iceChunks: 'a chunk of ice', crates: 'a crate' };

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const WEAPON_TEXT: Readonly<Record<string, string>> = { unarmed: 'unarmed (no weapon: dodges bolts and blows, cannot turn them aside)', melee: 'a melee weapon (a physical blade, staff or claws: it cuts, bruises or pierces, it does not burn)', blasterPistol: 'a blaster pistol', blasterRifle: 'a blaster rifle', heavy: 'a heavy blaster', slugPistol: 'a slugthrower pistol (solid slugs, not bolts)', slugRifle: 'a slugthrower rifle (rapid solid slugs, not bolts)', scatterGun: 'a scatter gun (a spread of solid shot, not bolts)', lightsaber: 'a lightsaber', trainingSaber: 'a training saber' };
export const weaponText = (w: string): string => WEAPON_TEXT[w] ?? w;

/**
 * The engine's reason a strike did not land (Jared, after combat pass 1): parried, dodged or deflected, from the
 * defender's weapon and the precognition roll. The narrator explains a miss only with this reason.
 */
export function strikeMissReason(striker: CombatFighterView | undefined, defender: CombatFighterView | undefined, avoided: boolean): string {
  if (avoided) return 'dodged: foresaw it with precognition';
  const dw = defender?.weapon ?? 'unarmed';
  const ranged = RANGED_WEAPONS.includes((striker?.weapon ?? 'unarmed') as WeaponKind);
  if (dw === 'lightsaber' || dw === 'trainingSaber') return ranged ? 'deflected on the blade' : 'parried';
  if (dw === 'melee') return ranged ? 'dodged' : 'parried';
  return 'dodged';
}

/**
 * The loser's side of a build-up exchange (Jared): a tie holds, a 1-step loss gives ground, a loss of 2 or more steps
 * (margin 6+, BUILD_UP) is outpaced. Null on a tie.
 */
export function buildUpLoss(margin: number): 'gave ground' | 'was outpaced' | null {
  const m = Math.abs(Math.round(margin));
  if (m <= BUILD_UP.tieWithin) return null;
  const twoSteps = BUILD_UP.steps.find(([, step]) => step === 2)![0];
  return m >= twoSteps ? 'was outpaced' : 'gave ground';
}

/**
 * A build-up exchange's result from the real track (D-212, combat pass 2 issue 8): "gains ground" only when the track
 * moved toward that side; a won roll that moved nothing "presses: no gain" (and, during the player's Force action,
 * "holds: no gain, only defending"); a tie "both held".
 */
export function buildUpLead(r: Pick<ExchangeRecord, 'margin' | 'advBefore' | 'advAfter' | 'duringForce'>, pc: string, t: string): string {
  const loss = buildUpLoss(r.margin);
  if (!loss) return 'neither gains ground (reason: both held)';
  const winner = r.margin > 0 ? pc : t;
  const loser = r.margin > 0 ? t : pc;
  const moved = r.advAfter - r.advBefore;
  const towardWinner = r.margin > 0 ? moved > 0 : moved < 0;
  if (towardWinner) return `${winner} gains ground (reason: ${loser} ${loss})`;
  if (r.duringForce && r.margin > 0) return `${pc} holds: no gain (${pc} only defends while using the Force)`;
  if (moved === 0) return `${winner} presses: no gain (the track does not move)`;
  // The track moved the other way (a natural 1's opening): the side it moved toward gained.
  return `${moved > 0 ? pc : t} gains ground (an opening)`;
}

const STEP_LINE = /^step (\d+) (.+?): (DONE|FAILED|NOT REACHED) \((.*)\)$/;
const FORCE_LABELS: Readonly<Record<string, string>> = { 'Force push': 'push', 'Force choke': 'choke', 'Force lightning': 'lightning', 'Force throw': 'throw', 'mind trick': 'mindTrick', 'saber throw': 'saberThrow', 'saber recall': 'recall' };

/** The steps of a typed sequence or a single Force action, parsed from the engine's step lines. */
export function stepFacts(notes: readonly string[]): StepFact[] {
  const out: StepFact[] = [];
  for (const n of notes) {
    const m = STEP_LINE.exec(n);
    if (m) out.push({ index: Number(m[1]) - 1, label: m[2]!, status: m[3] as StepFact['status'], detail: m[4]!, force: FORCE_LABELS[m[2]!] ?? null });
  }
  return out;
}

/**
 * True when the player character carries a ranged weapon, a strike step of the sequence was NOT REACHED, and no strike
 * of theirs was resolved in the passage: they did not fire (D-237).
 */
export function playerShotNotReached(c: CombatDraft): boolean {
  const pcView = c.fighters.find((f) => f.id === 'pc');
  if (!pcView || !RANGED_WEAPONS.includes(pcView.weapon as WeaponKind)) return false;
  const steps = stepFacts(c.notes);
  if (!steps.some((s) => /^strike/.test(s.label) && s.status === 'NOT REACHED')) return false;
  return !steps.some((s) => /^strike/.test(s.label) && s.status !== 'NOT REACHED') && !c.narrate.some((r) => r.kind === 'strike' && r.striker === 'A');
}

/** The outcome list for the exchanges a narration covers. */
export function combatFacts(c: CombatDraft): CombatFacts {
  const names = Object.fromEntries(c.fighters.map((f) => [f.id, f.name]));
  const byId = new Map(c.fighters.map((f) => [f.id, f]));
  const pc = names['pc'] ?? 'the player character';
  const lines: string[] = [];
  const hits: HitFact[] = [];
  const didNotHappen: string[] = [];
  const noShot = playerShotNotReached(c);
  const shortOfIntent: ShortOfIntent[] = [];
  for (const r of c.narrate) {
    const t = names[r.targetId] ?? r.targetId;
    const step = r.step !== undefined ? ` (sequence step ${r.step + 1})` : '';
    const head = `#${r.n}${r.surprise ? ' (surprise)' : ''}${step}${r.duringForce ? ` (while ${pc} uses the Force and only defends)` : ''}`;
    if (r.kind === 'force' && r.force) {
      const f = r.force;
      const user = f.side === 'A' ? pc : t;
      const on = f.side === 'A' ? t : pc;
      const thrown = f.kind === 'throw' ? ` to hurl ${f.objectTag ? (THROWN_TEXT[f.objectTag] ?? `a piece of ${TERRAIN_BY_ID.get(f.objectTag)?.label ?? 'debris'}`) : 'an object'}` : '';
      const what = f.kind === 'saberThrow' ? 'throws the lightsaber' : f.kind === 'recall' ? 'calls the dropped lightsaber back' : `uses ${SKILL_BY_ID.get(f.abilityId)?.name ?? f.abilityId}${thrown} on ${on}`;
      // A Push, Choke or mind trick acts on one opponent only (issue 19: "sending them tumbling together").
      const others = c.fighters.filter((x) => x.id !== 'pc' && x.id !== (f.side === 'A' ? r.targetId : 'pc') && !x.out).length;
      const onlyOne = f.side === 'A' && others > 0 && ['push', 'choke', 'mindTrick', 'throw', 'lightning'].includes(f.kind) ? ` Only ${on} is affected; the others are not.` : '';
      if (f.success) {
        if (f.damage && f.damage.D <= 0) {
          // No damage (lightning scales with Force Output; D-216): the target is struck but unharmed.
          lines.push(`${head} ${user} ${what}: DONE. NO HIT that harms: ${on} is struck but unharmed (no damage, no Vitality lost).${onlyOne}`);
        } else if (f.damage) {
          hits.push({ n: r.n, byPlayer: f.side === 'A', targetId: f.side === 'A' ? r.targetId : 'pc', targetName: on, part: f.damage.part, severity: f.damage.severity, severed: false });
          lines.push(`${head} ${user} ${what}: DONE. HIT (${on}, ${partText(f.damage.part)}, ${f.damage.severity ? `${f.damage.severity} wound` : 'no wound (winded)'}).${onlyOne}`);
        } else if (f.kind === 'saberThrow') lines.push(`${head} ${user} ${what}: DONE (the control holds; its strikes are the next lines; the saber returns to hand).`);
        else if (f.kind === 'recall') lines.push(`${head} ${user} ${what}: DONE (the saber is back in hand).`);
        else if (f.stoodDown) lines.push(`${head} ${user} ${what}: DONE. NO HIT, no injury: ${on} stands down and leaves the fight.${onlyOne}`);
        else lines.push(`${head} ${user} ${what}: DONE. NO HIT, no injury: ${on} is thrown off balance (an opening for ${user}).${onlyOne}`);
      } else {
        const reason = forceReason(f);
        lines.push(`${head} ${user} ${what}: FAILED (${reason}). NO HIT, no effect on ${on}. Explain the failure only with this reason; nothing else in the scene blocked it.`);
        didNotHappen.push(`${user}'s ${f.kind === 'saberThrow' ? 'saber throw' : f.kind === 'recall' ? 'saber recall' : (SKILL_BY_ID.get(f.abilityId)?.name ?? f.abilityId)} had no effect (#${r.n}: ${reason})`);
        if (f.side === 'A') shortOfIntent.push({ n: r.n, kind: f.kind, goal: what, result: `it failed (${reason})` });
      }
      continue;
    }
    const hit = r.hit && !r.hit.avoided && !r.hit.point ? r.hit : null;
    if (hit) {
      const byPlayer = hit.by === 'A';
      const victim = byPlayer ? t : pc;
      const striker = byPlayer ? pc : t;
      const stun = hit.stun ? SUBDUE_TEXT[hit.stun].verb : undefined;
      hits.push({ n: r.n, byPlayer, targetId: byPlayer ? r.targetId : 'pc', targetName: victim, part: hit.part, severity: hit.severity, severed: hit.severed, ...(stun ? { stun } : {}) });
      // A subduing hit has no place on the body (pass 5 issue 14: a stun bolt told "squarely in the chest").
      if (stun) {
        lines.push(`${head} ${striker} ${stun} ${victim}: HIT (${victim}, no wound and no place on the body: it drains their stamina toward capture).${toldNotes(r)}`);
        continue;
      }
      const result = hit.severed ? `the ${partText(hit.part)} is SEVERED` : hit.severity ? `${hit.severity} wound` : hit.prosthetic ? 'the prosthetic limb takes it: no wound (winded)' : 'no wound (winded)';
      const how = hit.redirected ? `${striker} redirects the blaster bolt back into the shooter` : `${striker} hits ${victim}`;
      lines.push(`${head} ${how}: HIT (${victim}, ${partText(hit.part)}, ${result}).${toldNotes(r)}`);
      continue;
    }
    if (r.hit?.point) {
      lines.push(`${head} ${r.hit.by === 'A' ? pc : t} lands a touch: the bout ends on a point. NO HIT that injures.`);
      continue;
    }
    if (r.maneuver) {
      lines.push(`${head} ${r.maneuver.by === 'A' ? pc : t} lands a ${r.maneuver.kind} maneuver. NO HIT, no injury.`);
      continue;
    }
    // The redirect action short of its intent (m9-fix-deflect): the attempt, how it fell short, and the plain outcome.
    if (r.redirect && r.redirect !== 'sentBack') {
      const result = redirectNote(r.redirect, pc, t).replace(/^.*?: short of the intent, /, '');
      const lead = r.kind === 'buildUp' ? ` ${buildUpLead(r, pc, t)} (margin ${fmt(Math.abs(r.margin))}).` : '';
      lines.push(`${head} ${pc} tries to send ${t}'s blaster bolts back at ${t}: NO HIT, SHORT OF THE INTENT (${result}).${lead} Tell the attempt, then how it fell short.`);
      didNotHappen.push(`no bolt went back into ${t} (#${r.n})`);
      shortOfIntent.push({ n: r.n, kind: 'redirect', goal: `send ${t}'s blaster bolts back at ${t}`, result });
      continue;
    }
    if (r.kind === 'strike') {
      const striker = r.striker === 'A' ? pc : t;
      const defender = r.striker === 'A' ? t : pc;
      const why = strikeMissReason(byId.get(r.striker === 'A' ? 'pc' : r.targetId), byId.get(r.striker === 'A' ? r.targetId : 'pc'), !!r.hit?.avoided);
      lines.push(`${head} ${striker} strikes at ${defender}: NO HIT (reason: ${defender} ${why}).${toldNotes(r)}`);
      didNotHappen.push(`${striker}'s strike at ${defender} did not land (#${r.n})`);
      continue;
    }
    const lead = buildUpLead(r, pc, t);
    // A shooter whose strike step was NOT REACHED took no shot in the build-up (D-237; pass 3: "fire back" narrated).
    // "Trade blows" only between two who can strike each other up close (pass 4 issue 6: an unarmed Jedi "trades blows"
    // with a blaster droid); a shooter fires and the other side moves or answers in kind.
    const pcW = byId.get('pc')?.weapon ?? 'unarmed';
    const tW = byId.get(r.targetId)?.weapon ?? 'unarmed';
    const shoots = (w: string): boolean => RANGED_WEAPONS.includes(w as WeaponKind);
    const exchange = shoots(pcW) && shoots(tW) ? 'trade fire' : shoots(tW) ? `maneuver while ${t} fires` : shoots(pcW) ? `maneuver while ${pc} fires` : 'trade blows';
    const how = noShot ? `${pc} and ${t} maneuver for position: NO HIT, and ${pc} gets no shot off` : `${pc} and ${t} ${exchange}: NO HIT`;
    lines.push(`${head} ${how}. ${lead} (margin ${fmt(Math.abs(r.margin))}).${toldNotes(r)}`);
  }
  const steps = stepFacts(c.notes);
  for (const s of steps) if (s.status === 'NOT REACHED') didNotHappen.push(`step ${s.index + 1} (${s.label}) was NOT REACHED: ${s.detail}`);
  const hitByPlayer = new Set(hits.filter((h) => h.byPlayer).map((h) => h.targetId));
  const unhitOpponents = c.fighters.filter((f) => f.id !== 'pc' && !hitByPlayer.has(f.id)).map((f) => ({ id: f.id, name: f.name, out: f.out, minion: f.minion }));
  return { lines, hits, steps, didNotHappen, unhitOpponents, playerHit: hits.some((h) => !h.byPlayer), anySevered: hits.some((h) => h.severed), shortOfIntent };
}

/** Notes that mark a fighter leaving the fight or the fight being decided: always a highlight (D-271). */
const DECIDING_NOTE = /is out of the fight|cuts down|shoots down|morale breaks|withdraws|Spent and subdued|collapses from exhaustion|cannot stand|lost the weapon arm|has no weapon arm/;

/**
 * The highlights of a long passage (D-271; pass 5 issue 5: a 51-exchange capture fight told as two sentences of
 * aftermath): the wounding hits and severs, the subduing hits, every fighter leaving the fight, the turning point and
 * the moment it was decided, in order, at most NARRATION_LENGTH.maxHighlights (the deciding ones kept first).
 */
export function fightHighlights(c: CombatDraft, facts: CombatFacts): string[] {
  const pc = c.fighters[0]?.name ?? 'the player character';
  const items: { n: number; text: string; rank: number }[] = [];
  // The opponent of an exchange is its target (the one engaged with the player).
  const opponentAt = (n: number): string => c.fighters.find((f) => f.id === c.narrate.find((r) => r.n === n)?.targetId)?.name ?? 'an opponent';
  for (const h of facts.hits) {
    const by = h.byPlayer ? pc : opponentAt(h.n);
    if (h.stun) items.push({ n: h.n, text: `#${h.n} ${by} ${h.stun} ${h.targetName} (no wound)`, rank: 2 });
    else if (h.severity || h.severed) items.push({ n: h.n, text: `#${h.n} ${by} hits ${h.targetName} (${partText(h.part)}, ${h.severed ? 'severed' : h.severity})`, rank: h.severed || h.severity === 'severe' || h.severity === 'critical' || h.severity === 'mortal' ? 0 : 1 });
  }
  for (const r of c.narrate) for (const n of r.notes) if (DECIDING_NOTE.test(n)) items.push({ n: r.n, text: `#${r.n} ${n.replace(/, out of the fight$/, '')}`, rank: 0 });
  // The turning point: the first landed hit of the side that won after the loser's last one (from there on only one
  // side landed anything). Only in an ended fight with a winner.
  const winnerIsPc = c.ended?.outcome === 'won' ? true : c.ended?.outcome === 'lost' ? false : null;
  if (winnerIsPc !== null && facts.hits.length) {
    const lastLoser = Math.max(0, ...facts.hits.filter((h) => h.byPlayer !== winnerIsPc).map((h) => h.n));
    const turn = facts.hits.find((h) => h.byPlayer === winnerIsPc && h.n > lastLoser);
    // "only Joren Tal lands anything", "only the opponents land anything" (M5 final check: "only Joren Tal land").
    const several = c.fighters.filter((f) => f.id !== 'pc').length > 1;
    const who = winnerIsPc ? `${pc} lands` : several ? 'the opponents land' : 'the opponent lands';
    if (turn && turn.n !== facts.hits[facts.hits.length - 1]!.n) items.push({ n: turn.n, text: `#${turn.n} the turning point: from here on only ${who} anything`, rank: 0 });
  }
  // Within one exchange, the hit comes before what it caused (the order they were added).
  const ordered = items.map((x, i) => ({ ...x, i }));
  const kept = [...ordered].sort((a, b) => a.rank - b.rank || a.n - b.n).slice(0, NARRATION_LENGTH.maxHighlights);
  return kept.sort((a, b) => a.n - b.n || a.i - b.i).map((x) => x.text);
}

/** About one paragraph per NARRATION_LENGTH.exchangesPerParagraph exchanges, at least 1, at most maxParagraphs (D-271). */
export const narrationParagraphs = (exchanges: number): number => Math.max(1, Math.min(NARRATION_LENGTH.maxParagraphs, Math.round(exchanges / NARRATION_LENGTH.exchangesPerParagraph)));

/**
 * The prose output budget a passage needs (M5 final check): a long passage's asked paragraphs at
 * NARRATION_LENGTH.tokensPerParagraph, else 0. The caller takes the larger of this and the pacing cap.
 */
export const longPassageProseTokens = (exchanges: number): number => (exchanges >= NARRATION_LENGTH.highlightsFrom ? narrationParagraphs(exchanges) * NARRATION_LENGTH.tokensPerParagraph : 0);
