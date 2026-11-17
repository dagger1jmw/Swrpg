// Synergy (progression-numbers §14): related skills share XP. Spillover = credited XP of the source
// session x coefficient; it stops at the target's ceiling (a fraction of the source's level), and the
// total from one session is capped at 25% of its credited XP. Pure.
import { SYNERGY, SYNERGY_SESSION_CAP, type SynergyRelation } from '../data/progression.config';
import { SKILLS } from '../data/skills';
import { xpForLevel } from './curve';

export interface SynergyLink {
  source: string;
  target: string;
  relation: SynergyRelation;
}

/** Built as data from the lore relations (SW_Force_Abilities_Forms_v3_complete.md) for the M3 skill set. */
function buildLinks(): SynergyLink[] {
  const links = new Map<string, SynergyLink>();
  const add = (source: string, target: string, relation: SynergyRelation): void => {
    if (source === target) return;
    const key = `${source}>${target}`;
    const prev = links.get(key);
    // One relation per pair: the stronger coefficient wins (Juyo -> Vaapad is both variant and parent).
    if (!prev || SYNERGY[relation].coef > SYNERGY[prev.relation].coef) links.set(key, { source, target, relation });
  };
  const forms = SKILLS.filter((s) => s.kind === 'form').map((s) => s.id);
  for (const f of forms) add('shiiCho', f, 'foundation');
  // Niman (Form VI) draws on Forms I, III, IV and V at 0.10 (ceiling 0.6), replacing the 0.05
  // foundation into Niman; Makashi (Form II) no longer feeds it (D-121).
  links.delete('shiiCho>niman');
  for (const f of ['shiiCho', 'soresu', 'ataru', 'shien', 'djemSo']) add(f, 'niman', 'nimanFoundation');
  add('soresu', 'shien', 'parentForm');
  add('juyo', 'vaapad', 'parentForm');
  for (const [a, b] of [
    ['shien', 'djemSo'],
    ['juyo', 'vaapad'],
  ] as const) {
    add(a, b, 'variant');
    add(b, a, 'variant');
  }
  for (const s of SKILLS) {
    if (s.kind !== 'forceAbility') continue;
    add('forceControl', s.id, 'forceControl');
    if (s.sensory) add('forceSense', s.id, 'forceSense');
    if (s.parent) {
      add(s.parent, s.id, 'parentAbility');
      add(s.id, s.parent, 'subAbility');
    }
  }
  const phys = ['strength', 'agility', 'endurance'];
  for (const a of phys) for (const b of phys) add(a, b, 'physical');
  return [...links.values()];
}

export const SYNERGY_LINKS: readonly SynergyLink[] = buildLinks();

export interface SpilloverInput {
  /** XP credited to each skill by the session (after the clamp). */
  credited: Readonly<Record<string, number>>;
  /** Total levels before the session (natural baseline included). */
  levelOf(skill: string): number;
  /** Trained XP of each skill after the session's own credit (before spillover). */
  xpOf(skill: string): number;
  /** Natural baseline level of a skill (for the ceiling in XP terms). */
  naturalOf(skill: string): number;
  links?: readonly SynergyLink[];
}

/** Spillover XP per target skill. Never past the target's ceiling; total at most 25% of the session's credited XP. */
export function spillover(input: SpilloverInput): Record<string, number> {
  const links = input.links ?? SYNERGY_LINKS;
  const raw: Record<string, number> = {};
  const totalCredited = Object.values(input.credited).reduce((a, b) => a + Math.max(0, b), 0);
  for (const link of links) {
    const c = input.credited[link.source] ?? 0;
    if (c <= 0) continue;
    const rule = SYNERGY[link.relation];
    const ceilingLevel = rule.ceiling * input.levelOf(link.source);
    const n = input.naturalOf(link.target);
    const xpTarget = input.xpOf(link.target) + (raw[link.target] ?? 0);
    const room = Math.max(0, xpForLevel(ceilingLevel) - xpForLevel(n) - xpTarget);
    const amount = Math.min(c * rule.coef, room);
    if (amount > 0) raw[link.target] = (raw[link.target] ?? 0) + amount;
  }
  const total = Object.values(raw).reduce((a, b) => a + b, 0);
  const cap = SYNERGY_SESSION_CAP * totalCredited;
  if (total > cap && total > 0) for (const k of Object.keys(raw)) raw[k] = (raw[k]! * cap) / total;
  return raw;
}

/** Ceiling check helper: the level a target may reach from one source. */
export function synergyCeiling(relation: SynergyRelation, sourceLevel: number): number {
  return SYNERGY[relation].ceiling * sourceLevel;
}


