# Fable review: decisions and fixes (2026-11-16)

Decisions for every row of the Fable review. Apply them to the named documents, log each as a
decision (D-29 onward) with its reason, and mark amended places "Amended by D-xx".
Where a row says "recompute", run the numbers (a quick script is fine) and put the result in
the spec, not an estimate.

## Fix before M1 (core contract)

1, 2, 5. Dice and actions
- Every action that rolls dice or computes an outcome (training, Force use, tactics, healing,
  hazards caused by the player's action) enters ONLY through the intent and is resolved in
  step b. One entry point per action.
- Remove from the narrative schema: activityPerformed, forceUseRequested, tacticDeclared,
  healingReceived. hazardOccurred and combatStarted stay in the narrative schema but are
  DEFERRED: applied at the start of the next turn's step b, narrated then (same rule as ambush).
- Duration and intensity of activities come from the player's intent (clamped by pacing) or
  the routine, never from the AI. Reword architecture §2 "the AI never supplies a number" to
  "the AI supplies only bounded enums and clamped amounts", followed by the full list
  (timeElapsed seconds, relationship delta -3..+3, moral weight 1-3, emotional intensity 1-3,
  severityHint 1-3, ageApprox).
- If the narrative events include an action the TurnDraft already resolved, reject it (logged).

3, 4. Time
- Clock resolution is seconds: now = {day (absolute, signed), second 0..86399}.
  timeElapsed carries seconds.
- One time writer per turn: if the TurnDraft advanced time (exchanges, montage, skip, activity
  duration), timeElapsed is left out of that turn's schema. Otherwise the AI's timeElapsed
  applies, clamped to the pacing range.

6. Schemas
- architecture §3 is the single source. Mark ai-events.md "Superseded by architecture.md §3"
  at the top, keep it only as history, and log every difference listed in the review.

7. applyEvents
- Same-turn temp refs: creation events carry a local key (tmp:1, tmp:2); later events in the
  same reply may use it; applyEvents maps temp keys to minted IDs.
- Apply order: (1) entity creation, (2) time, (3) everything else in reply order.

8. Flags, rank, death
- Write docs-v2/spec/flag-registry.md: every flag with its allowed source (engine, player,
  ai). Rank-gating flags (master's approval, heroic act, trial results, deeds that feed
  standing, redemption turning point) are engine- or player-set only. The AI may only propose
  an event that the engine evaluates.
- The Council bypass is an engine-run story event with written conditions, not an AI flag.
- NPC death comes only from the health model (a resolved fight or hazard), a player choice
  (at incapacitation), or a scheduled Legends timeline event run by code. Remove "witnessed"
  as an AI-supplied proof. npcStatusChanged can also return an NPC to active.

12. Checks before M5
- Move the basic roll and checks (rolls.md §1, §2, §7) into M1 as pure engine. Duels stay in M5.

13. Day loop
- One ordered hook list in architecture §10, one signature (slice, step: TimeStep, ctx),
  used everywhere. Order: routine blocks -> health -> progression -> alignment -> npcs and
  relationships -> threads -> ranks -> world (owns weighted event rolls and timeline events)
  -> pacing (settling-in, staleness) -> interruption check. §9 and §11 refer to §10.

15. Per-turn caps (config)
- moralChoice: 1 per turn. emotionalEvent: 1 per turn. relationshipChanged: 1 per NPC per
  turn. factLearned: 5 per turn. Duplicates of the same type and target are merged.

16. Fast path checks
- The engine decides whether a check is required from actionType, target and skill. The AI
  may only propose a difficulty; the engine clamps it to a range per action type.

22. Calendar (design choices, logged as such; Legends gives 12 months and 368 days)
- Months 1-8 have 31 days, months 9-12 have 30 (248 + 120 = 368). Numbered months.
- Year 0 exists, as in the lore timeline (0 BBY = 0 ABY, the year of the Battle of Yavin).
  Signed years: BBY negative, ABY positive, year 0 shown as "0 BBY/ABY".
- 7-day weeks run continuously across years; absolute day 0 is weekday 1.
- Update the architecture's rollover test to these rules.

## Fix before the milestone that needs it

9. NPC closed form and age: include the age learning factor as a piecewise-linear integral in
   the closed form. Recompute the reference table and keep test 2 at +/-2.
10. Archetype weights: convert to shares of one feasible daily budget (shares sum to 1; the
    default routine hours for the path set the effective hours). Recompute the reference
    table; NPC and created-character levels must be reachable in play.
11. Drill ceiling: sparring XP IS ceiling-limited. Restate test 8 as "with sparring only
    (E <= 15, ceiling 40), a form gains at most 25% of normal XP above 40". After day 60,
    whatever is left in the bank stays banked for the next real fight (not lost); fix test 9.
14. Single owners: current location lives only in locations.currentId (pacing.scene reads a
    selector). NPC death only in npcs.status. Only player pins are stored; engine pins are
    derived. Grief is a lingering condition separate from the moment's state of mind: it keeps
    its x0.80 and its dark-pressure floor even while anger or calm is active.
17. fightsToday and the daily combat XP totals move to the progression slice, reset by the
    day hook.
18. 4.0x pace clamp: per skill, over a rolling 365-day window, credited XP cannot exceed 4.0x
    the Average profile's yearly XP for that skill's weight share; the excess is discarded
    (banked drill XP is excluded). Tests 2 and 24 check the clamp.
19. Lifetime test: run the Average profile for 95 years; others 70.
20. rolls.md test 5: raise to 2.5 points per level.
21. Willpower: add a Willpower weight to every archetype (Jedi 0.4, Sith 0.4, others 0.2) and
    make meditation and Willpower-focused drills train it directly, in addition to fatigue.
    Recompute so the Average profile meets the Knight minimum around age 20-21.
23. Rest and sleep: elapsed time not covered by an activity is rest (recovery rates from
    progression-numbers §3). Sleep is an intent action (or part of a routine) resolved by the
    engine; 7h+ resets per the specs.
24. Write docs-v2/spec/skills-and-activities.md before M3: every skill with its category
    (technique, Force, wisdom, physical, academic, knowledge) and every activity with loads,
    difficulty ratings and weights, sourced from Docs/SW_Activity_Bank_v1.md and the lore.
25. State of mind: one enum and one mapping table in progression-numbers §17, owned by
    progression. Events map: grief -> grief (lingering), fear -> fear, anger -> anger,
    calm -> centered, pride -> pride, despair -> despair. Add hatred to emotionalEvent.
    "Distracted" comes from engine rules (unresolved thread with a deadline within 3 days,
    or overtraining streak 2+).
26. computeXp has a combat source branch implementing combat-xp.md exactly; combat uses the
    fight outcome (won/lost/fled/truce), not the session roll.
29. Build order: move the NPC closed form and the Human body-cap table into M3. Name the stubs
    each milestone uses (teacher levels, Order requirements, alignment multiplier = 1.0) in
    architecture §15.
30. Add a chapterSummarized event (source: summary call) applied through applyEvents in its
    own commit.
31. Output budget: count JSON overhead separately from narrative length; choices carry a
    compact intent (actionType, target ref, optional skill), with the engine filling the rest.

## Documentation hygiene (anytime before the milestone)

27. Replace references to the "prompt pack" and its addenda with the architecture sections that
    now hold them (pacing §8, story memory §7). List the species and equipment specs as
    "planned" in architecture §15.
28. Add an Order requirements table to ranks.md: Initiate 2 h forms + 1 h Force + 1 h study;
    Padawan 2 h with master + 1 h solo; Knight and above none mandatory (missions instead).
    training-routines.md points to it.
32. Amend Q51 and Q52 to match architecture (threads feature; threadEscalated event).
33. CLAUDE.md: golden rule 2 covers src/engine/ and src/features/ rule code; rule 6 adds
    npm run lint.
34. Add "Amended by D-xx" lines in every superseded place the review lists.
35. Copy the DEFAULT answers Q11, Q21, Q32, Q40, Q41, Q45, Q48 into their specs. Add a rule
    for non-combat Shatterpoint reads (a contest against a DC set by the D-06 band; misread
    on a negative margin).
36. Add alignment to the M formula in progression-numbers §5 and test 24.
37. Alignment tiers use half-open intervals on continuous Q. Combat XP ramps linearly from
    the challenge value at gap -25 to 0 at gap -35 (no step).
38. Padawan selection: recompute the monthly divisor so about 14% of average-standing
    Initiates are never chosen over the real window. Define the skill percentile against a
    seeded population of 1,000 NPC Initiates of the same age. Recompute the Initiate Trial
    minimums so the Average profile meets them around age 10-11.
