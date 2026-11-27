// Tests about other parts of a skip (deadlines, world events, drift, spans) and the routine's own measurements keep duty out of
// the way (opt-2 D; m9-missions B): no assignment, no posting, no leave. `off` is the duty slice's harness switch; `since` far
// ahead keeps the old saves' reading (the days off duty never pass the quiet days).
import type { GameState } from '../../src/state/gameState';

export const quietDuty = <S extends GameState>(s: S): S => ({ ...s, duty: { ...s.duty, since: s.clock.now.day + 1_000_000, off: true } });
