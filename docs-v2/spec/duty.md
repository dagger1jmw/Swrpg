# Duty, missions, skips and home days (v1)

Jared, 26 Nov 2026 (opt-2 D). Decision: D-538. Report: docs-v2/reports/opt-2.md (D). **Every number here is invented, to tune**; the list is in section 8.

**Amended by m9-missions (27 Nov 2026; [missions.md](missions.md), D-547 to D-553):** a mission is now a code-owned record with stages, travel and an end at base (missions.md); its thread no longer ends it. While posted in a total war, home is the forward base. The daily roll runs only at home (at base) and not on leave. The Padawan scale is 1.2, and only for a Padawan without a master (a Padawan with a master shares the master's). The DUTY line forbids assigning, offering or hinting at a mission. Dev: `/mission`, `/allhands`, `/home`.

Code:
- Data: `src/data/duty.config.ts` (the roll, the scales, the mission names, the injury threshold, the all-hands tail); `src/data/worldNetwork.ts` (`turnFor`, `allHands` on timeline events; set in worldNetwork3661.ts).
- Feature: `src/features/duty/` (slice, events, the day hook; `home.ts` home base and "touches the character"; `rules.ts` the roll, the injury check, all hands; `selectors.ts` the side panel's and narrator's lines, a home day's people).
- Wiring: the world feature's skip stops (`features/world/index.ts`), home-day stops in the routine's day loop (`state/advanceRoutine.ts`), the resume point (`turn/resolve.ts`), "Resume the skip" (`turn/skipAhead.ts`, `turn/pipeline.ts`), the Settings switch (`ai/settings.ts`, `ui/app.ts`), the health card (`ui/healthCard.ts`).
- Tests: `tests/opt2/duty.test.ts`. Measurements: `tests/measure/missionSpacing.measure.ts`, `tests/measure/skipStops.measure.ts`.

## 1. What existed before

No mission, assignment or posting state. Missions were a rolled world event ("A mission is offered", significant, 1 in 150 a day shared among the significant kinds) and the Order's mission funds (economy). A skip stopped on any hook's interruption: the timeline events marked `interrupts`, every significant rolled world event, thread deadlines, debt collectors, captivity, death. Built on: the threads (a mission is a thread), the world's day roll and timeline, the routine's day loop, the wounds.

## 2. Duty status (code-owned)

- **At home (off duty)** or **on a mission**, in the duty slice. Set only by the engine's `missionAssigned` and `missionEnded`; the narrator can send neither.
- **A mission** opens its thread (engine `threadOpened`, "Mission: an escort") with it.
- **A mission ends** (m9-missions): back at its base with its outcome, cut short by a wound, or given to someone else when never set out for (missions.md sections 5 and 8). Its thread no longer ends it (opt-2's rule, retired).
- **Home base:** a Jedi's is the Order's seat of the year (the Temple; none while the Order is homeless); everyone else's is the world duty first saw them on (the academy, the barracks, the home port). At home: the place or one above it is the home base, or the character stands on the home world at large.
- **On screen:** the health card's "Duty:" line (on a mission: what and for how long; off duty: days, at or away from home).

## 3. The daily mission roll

- At each midnight at home, off duty: the chance that day is a Weibull hazard of shape 2.5 in the days off duty, none in the first 2 days, scaled so half are assigned by the median. The same roll in story days and in skips: a skip stops on the day it comes up.
- **Medians:** a Jedi Knight 35 days in peace, 10 at war (the character's side at war by the one war list). Scales: a Padawan or apprentice 1.2 without a master (m9-missions A2, B7; was 1.6), a Knight or Lord 1, a Master 1.2; soldiers, officers, pilots, gunners, snipers, agents and Mandalorians 1, analysts 1.2, smugglers and bounty hunters 1.3; Initiates, acolytes and civilians none. A career's side is its start's faction or its service (the Republic Army is the Republic's).
- No roll while dead, held, in a fight or in a battle.
- **Retired:** the rolled world event "A mission is offered" (one source of missions).

## 4. Injured and recovering

- **Read from the wounds** (never stored). An unhealed wound (less than three quarters healed) blocks an assignment; the roll is held back and logged ("held back: a severe wound to the left arm").
- **Minor** is the lowest band of health.md section 5 (W 1-9).
- **All hands on deck:** the character's side (with its allies) is in a timeline event marked `allHands` while it runs, or for 14 days after it settles: a minor wound does not block; anything worse still does. Marked (a reading): the Battle on the Hydian Way (the Republic and the Order), the Sacking of Coruscant (all four sides), the Desolator crisis (the Republic and the Order), Karrid's assault, the Battle of Corellia, the Battle of Ilum and the Emperor's Voice killed (all four).
- **On screen:** the health card's fitness line ("Fit for duty", "Recovering: ... not fit for an assignment yet").

## 5. What stops a skip

- A mission assignment; anything touching the character, their people or their place: a thread deadline, collectors, captivity, death, the rolled significant events (a summons, a visitor with news, trouble nearby, a thread's turn).
- A timeline event marked `interrupts` stops only when it touches the character: one of its places is where the character is or their home, one of its people is someone they have met, or it is a major turn for their side (`turnFor`: the Treaty, the Sacking, the Treaty's collapse; the Battle of Ilum and the Voice's death for the Empire). Otherwise it goes into the skip's report (its "World:" notice) and the skip goes on.
- Home days (section 6).

## 6. Home days

- **The Settings switch** "Stop time skips on free days at home" (off by default): a skip also stops on the morning of the routine's free day at home, off duty.
- **The day after a mission** is a home day whatever the switch says: a skip running over it stops that morning.
- Never on the skip's own first morning (a resumed skip goes on), never on a mission (no free day there).
- **"Resume the skip"**: when a skip stops before its end (a home day, an assignment, news), the day it was going to is kept; at home and off duty the code offers "Resume the skip (N days left)" as the first choice. The player can play day after day for as long as they like (the daily roll still runs) and resume when they choose; nothing forces it.
- **A home day's choices** come from who is there: the narrator gets a HOME DAY line with the masters and officers at home (forms, techniques, tactics), friends (bond 30+) and rivals (-20 or less), the places (for a Jedi the Archives, the training halls, the meditation gardens), and the character's own open threads.

## 7. The narrator's state line

"DUTY (the code's; narrate it, never change it: missions are assigned and ended by the code): <duty line>. <fitness line>." every turn, and the HOME DAY line on a home day.

## 8. Every invented number

| Number | Where |
| --- | --- |
| No assignment in the first 2 days; Weibull shape 2.5 | `MISSION_ROLL` |
| Medians 35 days (peace), 10 (war) | `MISSION_ROLL` |
| Scales by rank and career | `MISSION_SCALE_BY_RANK`, `MISSION_SCALE_BY_CAREER` |
| Mission names by path and war | `MISSION_KINDS` |
| Healed enough at 0.75 | `DUTY_INJURY` |
| All hands 14 days after an event settles; which events are all hands and turns (readings) | `ALL_HANDS_TAIL_DAYS`, worldNetwork3661.ts |
| A friend at bond 30, a rival at -20 (the home day's line) | `selectHomeDayLine` |
| Duty log 30 entries | `DUTY_LOG_MAX` |
| The harness's 14-day missions (measurements only) | `tests/measure/*` |
