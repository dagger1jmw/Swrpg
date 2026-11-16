# AI event catalog (v1)

> **Superseded by architecture.md §3 (D-31, 2026-11-16).** architecture.md §3 is the single
> source for the intent schema, the narrative schema and the event catalog. This file is
> kept only as history; do not build from it.
>
> Differences between this file and architecture §3, all logged (D-12, D-13, D-29, D-30,
> D-31, D-33, D-54, D-57, D-58, D-65):
> - Intent: §3 adds `checks` (now engine-decided, the AI only proposes a difficulty, D-37),
>   `unknownNames`, `skillId`, `activity`, `healing`, `risk`, and actionTypes `heal` and
>   `sleep`; `requestedSpan` is `{amount, unit}`, not text.
> - Choices: §3 gives each choice a compact intent `{actionType, targetRef?, skillId?}`
>   (D-14 amended by D-58); this file has `spanHint` instead.
> - factLearned gains `importance`; threadOpened gains `entityRefs[]`; creation events gain
>   a same-turn temp `key` (D-32).
> - §3 adds milestoneBeatAcknowledged and the summary-call event chapterSummarized (D-57).
> - timeElapsed carries seconds, not minutes, and is left out when the TurnDraft advanced
>   time (D-30).
> - activityPerformed, forceUseRequested, tacticDeclared and healingReceived are removed
>   from the narrative schema; hazardOccurred and combatStarted are deferred (D-29).
> - npcStatusChanged drops `witnessed`, the AI can no longer set deceased, and `active` is
>   added (D-33, D-65).
> - emotionalEvent adds hatred (D-54).
> - Event schemas live in their feature modules, not in src/ai/schemas/ (D-12); references
>   are IDs only, no names (D-13).


## Rules
- Every event is a Zod schema in src/ai/schemas/ and is owned by exactly one feature module.
- Entity references use known IDs or names from the context; unknown names are flagged for
  review, never created silently (except via npcIntroduced).
- An event that fails validation is logged with the reason and dropped. Never guess a fix.
- The AI never emits: XP, levels, stat values, Vitality, wound severities, dates, alignment or
  dark-pressure values, ranks, roll results. The engine computes or rolls all of these.

## Intent call (small schema, first call of a turn)
intent: { actionType: dialogue | move | travel | train | study | fight | forceUse |
          investigate | rest | other,
          targets: [entity refs], references: [entity names the player mentioned],
          requestedPacing?: moment | scene | montage | timeSkip, requestedSpan?: text,
          tactic?: feint | taunt | takePosition | disengage | surrender | useEnvironment,
          forceAbility?: ability id, effort?: light | standard | heavy | allOut }

## Narrative response
narrative: text (may only quote numbers the engine provided)
choices: [{ label, pacingHint?, spanHint? }]   (mixed scales; include a forward jump when the
  staleness detector asks for one)
scene: { locationRef, presentNpcRefs[], moodTags[] }
events: [ any of the events below ]

## Events by owner
Clock and pacing
  timeElapsed { minutes, reason }                 -> clamped to the pacing level's range
  sceneEnded { reason }                           -> hint for chapter close
  pacingSuggested { level, reason }               -> never applied automatically (except to moment)
World and memory
  locationChanged { locationRef | newLocation { name, kind, region } }
  npcIntroduced { name, species, faction, role, ageApprox, description }
                                                  -> engine generates stats (NPC spec)
  npcStatusChanged { npcRef, state: dormant | departed | deceased, witnessed: bool }
                                                  -> deceased requires witnessed or a resolved fight
  relationshipChanged { npcRef, delta: -3..+3, reason }
  factLearned { aboutRef, fact }
  threadOpened { title, stakes, deadlineHint? }
  threadProgressed { threadRef, note }
  threadResolved { threadRef, outcome }
  flagSet { flag }                                -> only flags from the registered list
  itemGained / itemLost { itemRef | newItem { name, kind } }
Activities and training
  activityPerformed { activityId, minutes, intensity, partnerRef?, teacherRef? }
                                                  -> fatigue and XP computed by the engine
  routineRequested { priorities[{ skillOrActivity, weight }], effort, spanHint }
Combat (the AI sets up; the engine resolves)
  combatStarted { opponentRefs[], stakes: spar | skirmish | serious | lethal,
                  terrainTags[], ambushClaim?: bool }   -> ambush becomes a perception contest
  tacticDeclared { tactic, details }              -> becomes a contest (rolls spec sec 5)
  combatEnded { reason: fled | surrendered | interrupted | truce }
                                                  -> wounds end fights on their own
Force
  forceUseRequested { abilityId, effort, targetRef? }  -> load, contest and outcome by engine
  forceVision { description }                     -> narrative only; may open a thread
Health
  hazardOccurred { type: fall | fire | explosion | crash | poison | exposure, severityHint: 1-3 }
                                                  -> damage computed by the health rules
  healingReceived { source: medical | bacta | forceHealer | rest, healerRef? }
State of mind and alignment
  emotionalEvent { type: grief | fear | anger | calm | pride | despair, intensity: 1-3, cause }
  moralChoice { direction: light | dark, weight: 1-3, description }
Rank
  promotionProposed { rank, grantedByRef, occasion }  -> engine checks requirements first
