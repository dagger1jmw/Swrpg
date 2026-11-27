// Routines selectors: the active routine, templates, the AI's suggestion, and the scheduler (a pure
// read of state; it returns a plan and changes nothing), exported for the state and turn layers.
import type { GameState } from '../../state/gameState';
import type { Routine, RoutinesSlice } from './routines';

export const selectActiveRoutine = (s: GameState): Routine => s.routines.active;
export const selectRoutineTemplates = (s: GameState): RoutinesSlice['templates'] => s.routines.templates;
export const selectRoutineSuggestion = (s: GameState): RoutinesSlice['suggested'] => s.routines.suggested;
export const selectFillCredit = (s: GameState): Readonly<Record<string, number>> => s.routines.fillCredit;

export {
  planDay,
  isTrainingDay,
  orderBlocks,
  projectDay,
  fillShares,
  requirementRow,
  selectPlanForms,
  defaultFillSource,
  type DayPlan,
  type PlanItem,
  type PlannedBlock,
  type PlannedRest,
} from './scheduler';
export { DEFAULT_ROUTINE, EFFORTS, PRIORITY_WEIGHTS, routineSchema, type Routine, type Priority, type LockedBlock, type RoutineEffort } from './routines';
