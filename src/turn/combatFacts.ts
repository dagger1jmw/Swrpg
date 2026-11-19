// The explicit outcome list for a combat narration (D-197): what the narrator's block states and what the
// post-narration check reads. Per exchange: HIT (target, location, severity) or NO HIT. Per step: DONE, FAILED or NOT
// REACHED. Built only from the engine's records; pure.
import { partText } from '../engine/duel';
import { forceReason } from '../engine/combatForce';
import { BUILD_UP } from '../data/combat.config';
import { RANGED_WEAPONS } from '../data/weapons';
import type { WeaponKind } from '../data/health.config';
import type { CombatDraft, CombatFighterView } from './combatTurn';

export interface HitFact {
  /** Exchange number. */
  n: number;
  byPlayer: boolean;
  targetId: string;
  targetName: string;
  part: string;
  /** Null: stamina only, no wound. */
  severity: string | null;
  severed: boolean;
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
}

const fmt = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(1));
const WEAPON_TEXT: Readonly<Record<string, string>> = { unarmed: 'unarmed (no weapon)', melee: 'a melee weapon', blasterPistol: 'a blaster pistol', blasterRifle: 'a blaster rifle', heavy: 'a heavy blaster', slugPistol: 'a slugthrower pistol (solid slugs, not bolts)', slugRifle: 'a slugthrower rifle (rapid solid slugs, not bolts)', scatterGun: 'a scatter gun (a spread of solid shot, not bolts)', lightsaber: 'a lightsaber', trainingSaber: 'a training saber' };
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

/** The outcome list for the exchanges a narration covers. */
export function combatFacts(c: CombatDraft): CombatFacts {
  const names = Object.fromEntries(c.fighters.map((f) => [f.id, f.name]));
  const byId = new Map(c.fighters.map((f) => [f.id, f]));
  const pc = names['pc'] ?? 'the player character';
  const lines: string[] = [];
  const hits: HitFact[] = [];
  const didNotHappen: string[] = [];
  for (const r of c.narrate) {
    const t = names[r.targetId] ?? r.targetId;
    const step = r.step !== undefined ? ` (sequence step ${r.step + 1})` : '';
    const head = `#${r.n}${r.surprise ? ' (surprise)' : ''}${step}`;
    if (r.kind === 'force' && r.force) {
      const f = r.force;
      const user = f.side === 'A' ? pc : t;
      const on = f.side === 'A' ? t : pc;
      const what = f.kind === 'saberThrow' ? 'throws the lightsaber' : f.kind === 'recall' ? 'calls the dropped lightsaber back' : `uses ${f.abilityId}${f.kind === 'throw' ? ' to hurl an object' : ''} on ${on}`;
      if (f.success) {
        if (f.damage) {
          hits.push({ n: r.n, byPlayer: f.side === 'A', targetId: f.side === 'A' ? r.targetId : 'pc', targetName: on, part: f.damage.part, severity: f.damage.severity, severed: false });
          lines.push(`${head} ${user} ${what}: DONE. HIT (${on}, ${partText(f.damage.part)}, ${f.damage.severity ? `${f.damage.severity} wound` : 'no wound, stamina only'}).`);
        } else if (f.kind === 'saberThrow') lines.push(`${head} ${user} ${what}: DONE (the control holds; its strikes are the next lines; the saber returns to hand).`);
        else if (f.kind === 'recall') lines.push(`${head} ${user} ${what}: DONE (the saber is back in hand).`);
        else if (f.stoodDown) lines.push(`${head} ${user} ${what}: DONE. NO HIT, no injury: ${on} stands down and leaves the fight.`);
        else lines.push(`${head} ${user} ${what}: DONE. NO HIT, no injury: ${on} is thrown off balance (an opening for ${user}).`);
      } else {
        const reason = forceReason(f);
        lines.push(`${head} ${user} ${what}: FAILED (${reason}). NO HIT, no effect on ${on}. Explain the failure only with this reason; nothing else in the scene blocked it.`);
        didNotHappen.push(`${user}'s ${f.kind === 'saberThrow' ? 'saber throw' : f.kind === 'recall' ? 'saber recall' : f.abilityId} had no effect (#${r.n}: ${reason})`);
      }
      continue;
    }
    const hit = r.hit && !r.hit.avoided && !r.hit.point ? r.hit : null;
    if (hit) {
      const byPlayer = hit.by === 'A';
      const victim = byPlayer ? t : pc;
      const striker = byPlayer ? pc : t;
      hits.push({ n: r.n, byPlayer, targetId: byPlayer ? r.targetId : 'pc', targetName: victim, part: hit.part, severity: hit.severity, severed: hit.severed });
      const result = hit.severed ? `the ${partText(hit.part)} is SEVERED` : hit.severity ? `${hit.severity} wound` : 'no wound, stamina only';
      const how = hit.redirected ? `${striker} redirects the blaster bolt back into the shooter` : `${striker} hits ${victim}`;
      lines.push(`${head} ${how}: HIT (${victim}, ${partText(hit.part)}, ${result}).${r.notes.length ? ` ${r.notes.join('; ')}.` : ''}`);
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
    if (r.kind === 'strike') {
      const striker = r.striker === 'A' ? pc : t;
      const defender = r.striker === 'A' ? t : pc;
      const why = strikeMissReason(byId.get(r.striker === 'A' ? 'pc' : r.targetId), byId.get(r.striker === 'A' ? r.targetId : 'pc'), !!r.hit?.avoided);
      lines.push(`${head} ${striker} strikes at ${defender}: NO HIT (reason: ${defender} ${why}).${r.notes.length ? ` ${r.notes.join('; ')}.` : ''}`);
      didNotHappen.push(`${striker}'s strike at ${defender} did not land (#${r.n})`);
      continue;
    }
    const loss = buildUpLoss(r.margin);
    const winner = r.margin > 0 ? pc : t;
    const loser = r.margin > 0 ? t : pc;
    const lead = loss ? `${winner} gains ground (reason: ${loser} ${loss})` : 'neither gains ground (reason: both held)';
    lines.push(`${head} ${pc} and ${t} trade blows: NO HIT. ${lead} (margin ${fmt(Math.abs(r.margin))}).${r.notes.length ? ` ${r.notes.join('; ')}.` : ''}`);
  }
  const steps = stepFacts(c.notes);
  for (const s of steps) if (s.status === 'NOT REACHED') didNotHappen.push(`step ${s.index + 1} (${s.label}) was NOT REACHED: ${s.detail}`);
  const hitByPlayer = new Set(hits.filter((h) => h.byPlayer).map((h) => h.targetId));
  const unhitOpponents = c.fighters.filter((f) => f.id !== 'pc' && !hitByPlayer.has(f.id)).map((f) => ({ id: f.id, name: f.name, out: f.out, minion: f.minion }));
  return { lines, hits, steps, didNotHappen, unhitOpponents, playerHit: hits.some((h) => !h.byPlayer), anySevered: hits.some((h) => h.severed) };
}
