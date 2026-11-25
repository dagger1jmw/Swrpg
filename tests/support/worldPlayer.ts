// A player for the network's pure tests (D-491): a Jedi Knight below the power bar unless told otherwise.
import type { WorldPlayer } from '../../src/data/who';

export const playerAs = (over: Partial<WorldPlayer> = {}): WorldPlayer => ({
  side: 'jediOrder',
  archetype: 'jediGuardian',
  rankStep: 2,
  standing: () => 50,
  tier: 'below',
  posts: [],
  places: [],
  trusts: () => false,
  hasFlag: () => false,
  ...over,
});
