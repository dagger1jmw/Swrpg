# AI event catalog (v1)

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
