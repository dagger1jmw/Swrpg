// Prompt sections (architecture §5). Plain .md files imported as text; no engine constants inside.
import chapterSummary from './chapter-summary.md?raw';
import contract from './contract.md?raw';
import coreGm from './core-gm.md?raw';
import intent from './intent.md?raw';
import opening from './opening.md?raw';
import pacingMoment from './pacing-moment.md?raw';
import pacingScene from './pacing-scene.md?raw';

export const PROMPTS = {
  chapterSummary,
  coreGm,
  contract,
  intent,
  opening,
  pacing: { moment: pacingMoment, scene: pacingScene },
} as const;
