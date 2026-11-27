// Tests about other parts of a skip (deadlines, world events, drift, spans) keep duty's daily mission roll out of the way
// (opt-2 D): home "since" far ahead, so the days off duty never pass the quiet days and no assignment comes.
import type { GameState } from '../../src/state/gameState';

export const quietDuty = <S extends GameState>(s: S): S => ({ ...s, duty: { ...s.duty, since: s.clock.now.day + 1_000_000 } });
