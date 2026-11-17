// The build-time lore index (scripts/build-lore.ts -> generated/lore-index.json, gitignored).
import type { LoreIndex } from './parse';
import raw from './generated/lore-index.json';

export const LORE_INDEX: LoreIndex = raw as unknown as LoreIndex;
