// Prompt sections (architecture §5). Plain .md files imported as text; no engine constants inside.
import chapterSummary from './chapter-summary.md?raw';
import combatEnd from './combat-end.md?raw';
import combatHold from './combat-hold.md?raw';
import combatLong from './combat-long.md?raw';
import combatNarration from './combat-narration.md?raw';
import contract from './contract.md?raw';
import coreGm from './core-gm.md?raw';
import eventCombatStarted from './event-combat-started.md?raw';
import eventGroundBattle from './event-ground-battle.md?raw';
import eventShipBattle from './event-ship-battle.md?raw';
import intent from './intent.md?raw';
import opening from './opening.md?raw';
import pacingMoment from './pacing-moment.md?raw';
import pacingScene from './pacing-scene.md?raw';
import pacingMontage from './pacing-montage.md?raw';
import pacingTimeSkip from './pacing-timeskip.md?raw';

export const PROMPTS = {
  chapterSummary,
  combatNarration,
  // Sent only when the fight needs them (opt-1 C4): a long passage, a fight or bout that ended, someone holding a foe off.
  combatLong,
  combatEnd,
  combatHold,
  coreGm,
  contract,
  intent,
  // Event rules sent only on the turns the schema offers the event (opt-1 C4): out of contract.md, which goes every turn.
  events: { combatStarted: eventCombatStarted, shipBattle: eventShipBattle, groundBattle: eventGroundBattle },
  opening,
  pacing: { moment: pacingMoment, scene: pacingScene, montage: pacingMontage, timeSkip: pacingTimeSkip },
} as const;
