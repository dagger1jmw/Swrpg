// opt-2 G3 (audit D-codes): the Tactics, Possessions and Character tabs, rendered by the UI's own functions for five characters,
// show no identifiers (camelCase, snake_case, decision numbers): the rule of the m8-fixes C1 and m8-audit A6 tests.
import { beforeAll, describe, expect, it } from 'vitest';
import type { GameState } from '../../src/state/gameState';
import { renderSidePanel, type PanelTab, type SidePanelProps } from '../../src/ui/sidePanel';
import { installDomShim, readable, type ShimNode } from '../support/domShim';
import { base, meet, ownShip } from '../support/schemaSituations';

/** Looks like an identifier: camelCase, snake_case, or a decision number (the m8-fixes C1 test's rule, with D-numbers). */
const IDENT = /\b[a-z]+[A-Z][A-Za-z]*\b|\b[a-z]+_[a-z_]+\b|\bD-\d+\b|\([a-z]+[A-Z]\w*\)/;
/** Words that look like identifiers but are names the lore spells so (none expected; kept for review). */
const ALLOWED: readonly string[] = [];

const CHARACTERS: Record<string, () => GameState> = {
  'a Jedi Knight': () => meet(base(), [{ name: 'Master Ven', role: 'jediMaster', faction: 'jediOrder' }]),
  'a Padawan': () => base({ rank: 'padawan' }),
  'a Sith Lord': () => base({ path: 'sith', rank: 'lord', archetype: 'sithWarrior' }),
  'a soldier with a ship': () => ownShip(base({ path: 'career', archetype: 'soldier', army: true })),
  'a smuggler': () => base({ path: 'career', archetype: 'smuggler' }),
};

const props = (state: GameState, tab: PanelTab): SidePanelProps => ({
  state,
  campaignName: 'Test',
  history: [],
  tab,
  busy: false,
  debugRequests: [],
  summaryLog: [],
  error: null,
  setTab: () => undefined,
  close: () => undefined,
  playerEvents: () => undefined,
  retrySummaries: () => undefined,
  act: () => undefined,
  openRoutine: () => undefined,
});

beforeAll(() => installDomShim());

describe('G3: the side panel tabs in plain words', () => {
  for (const [who, make] of Object.entries(CHARACTERS)) {
    for (const tab of ['character', 'possessions', 'tactics'] as const) {
      it(`${who}: the ${tab} tab`, () => {
        const tree = renderSidePanel(props(make(), tab)) as unknown as ShimNode;
        const lines = readable(tree);
        expect(lines.length).toBeGreaterThan(5);
        for (const line of lines) if (!ALLOWED.some((a) => line.includes(a))) expect(line, `${who} / ${tab}`).not.toMatch(IDENT);
      });
    }
  }
});
