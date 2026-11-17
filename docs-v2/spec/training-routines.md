# Training routines (v1)

## 1. Inputs
  Priorities: list of (skill or activity, weight). focus 3 | regular 2 | light 1
  Effort preference: easy | standard | push
  Training days per week: default 6 (at least 1 rest day; the overtraining rules still apply)
  Teacher / partner per skill (optional; affects the teacher and training-mode factors)
  Fixed commitments: Order requirements for the rank (ranks.md §1a, the single table; D-42),
    classes, missions, duties
  Default template: the archetype shares (npc-generation §3); from Knight on, the main
    specialty takes 0.5 of the fill (D-41). The player's own routine always decides.
  Locked blocks: anything the player placed by hand is never moved by the scheduler

## 2. Daily training budget (hours, before fixed commitments)
  Amended by D-25: the rows below are anchors at ages 10, 15 and 20 with linear
  interpolation between them and flat outside (no step on a birthday). "Before fixed
  commitments" is read as: the budget includes them; they are placed first and the rest is
  filled by priority (D-40). The calculations
  use this reading (docs-v2/calc/progression-sim.mjs).
  Effort:            easy  standard  push
  Age 12 and under:  3     4         5
  Age 13-17:         4     6         7
  Age 18+:           4     6         8
  The budget is a maximum. The scheduler trims it to stay under the tiredness limit.
  Fixed commitments are never trimmed, even when they exceed the budget or the limit: the
  Padawan requirements (5 h) exceed the 4.8 h standard budget at age 12. With the natural
  baseline (progression-numbers sec 11a, D-102) the Average profile's highest day-end f is
  1.02 (it was 1.08 before D-67 was decided).

## 3. Allocation
  Hours per priority = budget * weight / total weight, rounded to 0.5 h, minimum 0.5 h.
  No single session longer than 2 h. Longer allocations split into separate sessions with
  something else between them (this avoids the same-activity x0.85 penalty).
  Drill difficulty: pick the rating with gap -10..+10 (standard, easy) or +10..+20 (push).

## 4. Ordering rules (applied in this order)
  1. Fixed commitments and locked blocks first, at their set times.
  2. Physical blocks (physical load >= 0.8) earlier in the day.
  3. A mental block is placed directly after a physical block when one exists
     (post-workout window x1.25).
  4. Meditation goes after the hardest block or at the end of the day (it restores mental).
  5. Insert 0.5 h rest between physical blocks whenever projected f_phys would pass 0.7.
  6. Projected tiredness limit at day end: easy f <= 0.7 | standard f <= 0.9 | push f <= 1.0.
     Push never schedules past 1.0 by default; the player may lock blocks past it, with a warning.
  The scheduler is deterministic: the same inputs always give the same schedule. Among
  schedules that satisfy all the rules, it picks the one with the highest priority-weighted XP.

## 5. Preview and warnings (shown before approval)
  Projected XP per skill per week, tiredness curve for a typical day, and warnings for:
  overtraining risk (any day projected above 1.0), skills that will start rusting (unused
  past the grace period), a lightsaber form at its drill ceiling (suggest sparring or a
  mission), teacher no longer ahead in a skill (suggest a new teacher or holocron), and
  easy drills (gap below -20).

## 6. Automatic adjustments during a montage
  Injury: affected skills are swapped for adaptation training or rest, until cleared.
  Teacher unavailable: that block becomes solo (x0.90) or uses a partner if one exists.
  Drill ceiling reached: hours shift toward sparring; the preview warning repeats in the report.
  Overtraining streak of 2+ days: next day is converted to recovery.
  Every adjustment is logged and appears in the montage report.

## 7. Story during a montage (uses the pacing system's day loop)
  Each day: onTimeAdvanced hooks, thread progress, NPC schedules and relationship drift
  (training partners and teachers gain relationship from shared sessions), galaxy events,
  and weighted event rolls. Order calendar events (trials, assessments, festivals) are
  scheduled facts, not random rolls. A significant event interrupts the montage.

## 8. Montage report
  Days completed, interruption (if any), XP and levels per skill, breakthroughs, rust
  cleared or gained, willpower gained, injuries, relationship changes, events that happened,
  and every automatic adjustment. The AI receives this summary to write the narration.

## 9. Required tests
 1. Same inputs give the identical schedule (deterministic).
 2. Hours per priority match weights within 0.5 h.
 3. No session longer than 2 h unless locked by the player.
 4. A mental block follows a physical block whenever both exist that day.
 5. Projected day-end tiredness never passes the effort limit unless the player locked it.
 6. Locked blocks are never moved.
 7. An injury removes affected skills from the routine within the same day.
 8. A 90-day montage produces story events (thread progress or relationship change) and a
    complete report; a significant event stops it early.
 9. Days skipped in normal play use the current routine.
10. A 90-day standard routine for the Average profile matches the progression spec's
    yearly XP rate within +/-10%.
