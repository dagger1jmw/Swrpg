// Ref resolution for the turn layer: the same rule applyEvents uses (own ID or exact alias,
// D-13), over the registry's entity features. Pure.
import type { Intent } from '../ai/schemas/intent';
import type { GameState } from '../state/gameState';
import type { Registry } from '../state/types';
import type { RefResolver } from './expandChoice';

export function refResolver(registry: Registry<GameState>, state: GameState): RefResolver {
  const resolvers = registry.filter((f) => f.resolveRef);
  return (ref) => {
    for (const f of resolvers) {
      const id = f.resolveRef!(state, ref.trim());
      if (id !== null) return id;
    }
    return null;
  };
}

/**
 * A fight's minion named by the intent as if it were an NPC (D-242; pass 3: "npc:line-trooper-1" sent to review twice):
 * minions are not NPCs, so the ref is the fight's (the typed target is read from the words, D-212), not a stranger.
 */
export function fightMinionRef(state: GameState): (ref: string) => string | null {
  const active = state.combat.active;
  if (!active) return () => null;
  const norm = (x: string): string => x.toLowerCase().replace(/^npc:/, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const duel = active.duel as { opponents: { id: string; name: string }[] };
  const minions = duel.opponents.filter((o) => active.meta[o.id]?.minionKind);
  return (ref) => minions.find((o) => norm(o.name) === norm(ref) || o.id === ref)?.name ?? null;
}

/** Intent targets and references become stable IDs; anything unresolved moves to unknownNames. */
export function resolveIntentRefs(intent: Intent, resolve: RefResolver, minion: (ref: string) => string | null = () => null): { intent: Intent; notes: string[] } {
  const notes: string[] = [];
  const unknown: string[] = [];
  // A name the intent model listed as unknown may in fact be known (exact alias): a reference then.
  const known: string[] = [];
  for (const n of intent.unknownNames) {
    const id = resolve(n);
    if (id === null) unknown.push(n);
    else known.push(id);
  }
  const map = (refs: readonly string[], field: string): string[] => {
    const out: string[] = [];
    for (const r of refs) {
      const id = resolve(r);
      const fighter = id === null ? minion(r) : null;
      if (fighter) notes.push(`intent ${field} "${r}" is ${fighter}, a minion of this fight: not an NPC, not sent to review`);
      else if (id === null) {
        unknown.push(r);
        notes.push(`intent ${field} "${r}" is not a known ID; sent to review`);
      } else if (!out.includes(id)) {
        if (id !== r) notes.push(`intent ${field} "${r}" matched ${id} by exact alias`);
        out.push(id);
      }
    }
    return out;
  };
  const targets = map(intent.targets, 'target');
  const references = [...new Set([...map(intent.references, 'reference'), ...known])].filter((id) => !targets.includes(id));
  // activity.partnerRef / teacherRef must be NPCs (M3); anything else is dropped with a note.
  let activity = intent.activity;
  if (activity) {
    const person = (field: 'partnerRef' | 'teacherRef'): Record<string, string> => {
      const r = activity![field];
      if (r === undefined) return {};
      const id = resolve(r);
      if (id !== null && id.startsWith('npc:')) return { [field]: id };
      if (id === null) unknown.push(r);
      notes.push(`intent activity.${field} "${r}" is not a known person; dropped`);
      return {};
    };
    const { partnerRef: _p, teacherRef: _t, ...base } = activity;
    activity = { ...base, ...person('partnerRef'), ...person('teacherRef') };
  }
  const unknownNames = [...new Set(unknown)];
  return { intent: { ...intent, targets, references, unknownNames, ...(activity ? { activity } : {}) }, notes };
}
