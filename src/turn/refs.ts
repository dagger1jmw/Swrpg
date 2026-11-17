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

/** Intent targets and references become stable IDs; anything unresolved moves to unknownNames. */
export function resolveIntentRefs(intent: Intent, resolve: RefResolver): { intent: Intent; notes: string[] } {
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
      if (id === null) {
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
  const unknownNames = [...new Set(unknown)];
  return { intent: { ...intent, targets, references, unknownNames }, notes };
}
