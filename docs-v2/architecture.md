# Architecture (v2)

Phase 2, 2026-11-16. This is the design every milestone builds against. Specs in
`docs-v2/spec/` define the targets and tests; this file defines where the code lives, who owns
which state, how the AI talks to the engine, and the build order. Deviations from the Phase 2
prompt pack and from earlier specs are logged in `decisions.md` (D-11 onward). The prompt
pack is not in the repo; its pacing section now lives in §8 and its story-memory section in
§7 (amended by D-59). The Fable review fixes (`fable-review.md`, `review-fixes.md`) are
D-29 to D-67.

The root cause behind most V170 bugs (bugs.md R1–R8) is that the AI wrote game state and code
tried to guard, restore or re-parse it afterward. Every rule here exists to make that
impossible: the AI returns schema-checked events, code validates and applies them, and nothing
ever parses narrative text.

Contents
1. Module layout
2. Game state
3. AI contract
4. Turn pipeline
5. Context building and prompts
6. Provider interface
7. Story memory and request budget
8. Pacing
9. Advancing time
10. Clock
11. Feature module contract
12. Progression
13. Saves
14. Testing
15. Build order
16. Open questions

---

## 1. Module layout

```
src/
  engine/      Pure shared math. rng (seeded, serializable), curve, fatigue, challenge factor,
               rolls and contests, damage, calendar math, interpolation helpers.
               Imports only src/data. No DOM, no fetch, no Math.random, no Date.now.
  data/        Typed static tables as TS: force catalog, lightsaber forms, activities,
               archetypes, species, canon NPCs, flag registry, Order calendar, galaxy
               timeline events, progression.config.ts (all tunable constants with comments
               citing their targets).
  features/<name>/
               One FeatureModule per feature (section 11): state slice, Zod schemas, event
               handlers, onTimeAdvanced, selectors, prompt section, UI panel spec.
               Imports engine, data, and other features ONLY through
               features/<other>/selectors.ts.
  state/       GameState type (composed from feature slices), feature registry,
               applyEvents, advanceTime (day-loop orchestrator), store (subscribe/dispatch).
  memory/      Deterministic retrieval, scorer, chapter-close policy. Reads selectors only.
  lore/        Loads the build-time lore index; retrieval by era, entity and location.
    generated/ lore-index.json (gitignored; produced by scripts/build-lore.ts)
  ai/          ModelProvider interface, gemini adapter, fixture provider, response-schema
               composer (Zod -> JSON Schema), context builder, usage meter.
    prompts/   Small composable prompt sections as .md files (imported with ?raw).
  turn/        The turn pipeline: intent -> resolve -> narrate -> validate -> apply -> commit.
  persist/     Storage interface, IndexedDB implementation, in-memory implementation (tests),
               save envelope, migrations, export/import.
  ui/          Rendering and player actions only. Reads state via selectors, dispatches
               actions. No game rules.
scripts/
  build-lore.ts  Parses Docs/SWRPG lore/*.md into src/lore/generated/lore-index.json.
tests/
  fixtures/ai/   Recorded model responses for pipeline tests.
```

### Dependency rule

```
ui -> turn -> (ai, memory, lore, state)
state -> features -> (engine, data)
engine -> data
ai, memory -> state types + feature selectors (never feature internals)
persist -> state types + feature migrations
```

- `engine`, `features`, `state`, `memory` and `lore` are pure: no DOM, no network, no
  `Math.random`, no wall-clock time. Randomness comes from the seeded RNG whose state lives
  in GameState; time comes from the clock slice.
- Enforced by ESLint flat config (`eslint`, `typescript-eslint`, approved D-11):
  `no-restricted-imports` per folder for the layer rule and for feature internals, and
  `no-restricted-globals` / `no-restricted-properties` for `Math.random`, `fetch`,
  `document`, `window`, `Date.now` in the pure layers. `npm run lint` joins `npm test` and
  `npm run typecheck` in the done-check.

---

## 2. Game state

One typed `GameState`, composed of feature slices. Every field has exactly one owner (the
feature named by the slice). **Source** says where the value comes from:
- **engine**: computed by code from rules and events.
- **player**: set by a player action (creation, routine editor, settings-like choices).
- **AI text**: prose or labels the AI supplies inside an event; the owning feature stores it
  verbatim after validation. Code never rewrites AI text.
- **AI amounts**: the AI supplies only bounded enums and clamped amounts. The full list:
  timeElapsed seconds (clamped to the pacing range), relationship delta -3..+3, moral weight
  1-3, emotional intensity 1-3, severityHint 1-3, ageApprox (at npcIntroduced), and a
  check's proposed difficulty (intent only, clamped per action type). Anything else numeric
  comes from the engine. Durations and intensities of activities come from the player's
  intent (clamped by pacing) or the routine, never from the AI. (Amended by D-29.)

No field is written by both code computation and AI text.

### Derived, never stored
Skill levels and tiers (from XP), age (from birth day and clock), weekday, time-of-day label,
wound status and wound penalties (from the wound list), meter capacities, max Vitality,
effective levels, alignment tier, pace-for-age. Storing any of these is a bug (health.md
test 2 generalized).

### Slices

**meta** (owner: state core)
| Field | Type / range | Source |
|---|---|---|
| schemaVersion | int | engine |
| campaignId | uuid | engine |
| branchId | uuid; new branch when an older save is played on | engine |
| turn | int >= 0, +1 per committed turn | engine |
| rngState | 4 x uint32 (sfc32) | engine |

**clock** (owner: clock; the only writer of in-game time)
| Field | Type / range | Source |
|---|---|---|
| now.day | int, absolute GSC day; day 0 = first day of 1 ABY; year 0 (0 BBY/ABY) is days -368..-1, BBY days negative | engine |
| now.second | 0-86399 (amended by D-30; was now.minute) | engine |
| lastAdvance | {seconds >= 0, reason, source: turnDraft / timeElapsed, requested?, clampedFrom?} | engine |

**pacing** (owner: pacing)
| Field | Type / range | Source |
|---|---|---|
| level | moment / scene / montage / timeSkip | engine (player requests via intent) |
| settlingIn | not stored: derived by selectSettlingIn (first 14 days after the first arrival at a major place; amended by D-138) | derived |
| lastNoveltyDay | not stored: derived from npcs.firstMetDay, threads.openedDay, locations.firstVisitDay (D-138) | derived |
| scene.locationId | not stored: selector over locations.currentId (amended by D-46) | derived |
| scene.presentNpcIds | npc id[] | AI refs, validated |
| scene.moodTags | string[] (max 5, 30 chars each) | AI text |

**character** (owner: character)
| Field | Type / range | Source |
|---|---|---|
| id | uuid (future lineage) | engine |
| name | 1-60 chars | player |
| speciesId | species table id | player |
| birthDay | absolute day | player |
| path | jedi / sith / outsider / career | player |
| archetype, focusWeights | archetype id; shares summing to 1 (amended by D-44) | player |
| trainingStartAge | within the path range | player |
| talents | {domain: none / gifted / prodigy / exceptional}, special talents as unlock ids; 3 points | player |
| homeworldId, background flags | ids | player |
| dominantHand | left / right (switches automatically on loss, Q39) | player, then engine |

**progression** (owner: progression)
| Field | Type / range | Source |
|---|---|---|
| skills[id].xp | >= 0 (effective practice hours) | engine |
| skills[id].rust | 0-0.20 (cap by category) | engine |
| skills[id].lastPracticedDay | absolute day | engine |
| skills[id].E | 0-100, lightsaber form groups only | engine |
| skills[id].CI | 0-100, combat Force abilities only | engine |
| skills[id].bank | >= 0, capped at 15 levels of XP | engine |
| bankReleaseUntil | absolute day or null | engine |
| stateOfMind | {kind: StateOfMind enum (progression-numbers §17), intensity 1-3, sinceDay, easesByDay} | engine (AI proposes emotionalEvent; D-54) |
| grief | {intensity 1-3, sinceDay, easesByDay} or null; lingers under any stateOfMind (D-46) | engine |
| fightsToday | per skill count, reset by the day hook (moved from combat, D-47) | engine |
| combatXpToday | per skill XP before M, for the 12 XP daily cap, reset by the day hook (D-47) | engine |
| paceWindow | per skill ring of daily credited XP and training hours (365 days) for the 4.0x clamp (D-48; hours by XP share, D-104 / D-109) | engine |
| today | the day's training state: hours per activity, post-workout window, meditation and training hours (reset at midnight; M3, D-107) | engine |
| overtrainStreak | int >= 0 | engine |
| willpowerToday | 0-3.0 | engine |
| reviewBuffUntil | day or null (recording review, sec 19) | engine |
| tierBeatsPending | [{id, skillId, tier, day}] | engine |

M3 builds skills[id].{xp, rust, lastPracticedDay}, stateOfMind, grief, paceWindow, today, overtrainStreak, willpowerToday and tierBeatsPending (D-107). E, CI, bank, fightsToday, combatXpToday and reviewBuffUntil arrive with combat (M5).

**health** (owner: health)
| Field | Type / range | Source |
|---|---|---|
| meters.physical, .mental, .force | load >= 0 (fraction is derived from capacity) | engine |
| sleepCarry | 0-0.6 | engine |

M3 builds the meters and sleepCarry only (minimal health slice, D-107); the rest arrives in M5.
| vitality | 0..max (max derived) | engine |
| wounds[] | {id, part, severity, W >= 0, stabilized, healProgress 0-1, day, source} | engine |
| lasting[] | {id, part, affects[], P 0-1, adaptation 0-1, aidCap 0-1} | engine |
| dying | {untilMinuteAbs} or null | engine |
| suppression[] | {abilityId, since} | engine |

**combat** (owner: combat; null outside a fight)
| Field | Type / range | Source |
|---|---|---|
| id, startedAt | uuid, absolute minute | engine |
| sides | player side + opponent npc ids | AI refs at combatStarted, validated |
| stakes | spar / skirmish / serious / lethal | AI enum, validated |
| terrainTags | registered tag ids | AI enum |
| advantage | -5..+5 | engine |
| exchange | int >= 0 | engine |
| formBySide | form ids | player / engine |
| beatDue | bool + reason | engine |
| log[] | exchange records (rolls, margins, hits, time) | engine |

**alignment** (owner: alignment)
| Field | Type / range | Source |
|---|---|---|
| Q | -100..+100 | engine |
| D | 0-100 | engine |
| lastNoticedTier | tier id | engine |
| philosophy | 8 values (alignment.md sec 1) | player at creation, engine on turn |
| turned | bool | engine after explicit player confirmation |
| q90 | ring of daily Q samples (90) | engine |
| lastRedemptionDay | day or null | engine |

The grief floor on D is derived (10 x progression grief intensity via a selector), not stored
(amended by D-46; griefFloor removed).

**npcs** (owner: npcs)
| Field | Type / range | Source |
|---|---|---|
| id | `npc:<slug>` stable | engine |
| name, aliases[] | 1-60 chars | AI text (npcIntroduced), aliases also engine |
| speciesId, factionId, role | registered ids / enum | AI enum, validated |
| birthDay | absolute day (from ageApprox at intro) | engine |
| archetype, talents, seed, startAge, warYears | generation inputs (npc-generation sec 4) | engine |
| canonId | canon table id or null | engine (matched by exact alias) |
| status | active / dormant / departed / deceased; the only store of NPC death (D-46) | engine (AI proposes npcStatusChanged for active / dormant / departed; deceased only from the health model, a player choice at incapacitation, or a code-run timeline event, D-33) |
| description | <= 400 chars | AI text |
| firstMetDay, lastSeenDay, lastLocationId | | engine |
| health | named NPCs: same shape as health slice; minions: none. A Dead result emits npcStatusChanged{deceased} (engine source); health never stores death itself | engine |

**relationships** (owner: relationships)
| Field | Type / range | Source |
|---|---|---|
| byNpcId.value | -100..+100 (labels derived) | engine (AI delta -3..+3) |
| byNpcId.lastDay | day | engine |

**locations** (owner: locations)
| Field | Type / range | Source |
|---|---|---|
| byId | {id `loc:<slug>`, name, aliases, kind, region, parentId?, description, firstVisitDay, introducedTurn} | name/kind/region/description AI text; ids engine. "major" is derived from kind by `CHAPTER_PLACE_KINDS`, not stored (amended by D-84) |
| currentId | location id | engine (from locationChanged) |
| currentSinceDay | day of arrival at the current place (staleness; M4, D-138) | engine (from locationChanged) |

**threads** (owner: threads)
| Field | Type / range | Source |
|---|---|---|
| byId | {id, title <= 80, stakes <= 200, status open / resolved / failed, deadlineDay?, escalation 0-3, notes[] (<= 200 each), entityRefs[], openedDay} | title/stakes/notes AI text; deadline from deadlineHint mapped by engine; escalation engine |

**flags** (owner: flags)
| Field | Type / range | Source |
|---|---|---|
| set | FlagId[] from the registered list (spec/flag-registry.md); each flag names its allowed sources (D-33) | engine / player / ai per flag |

**items** (owner: items)
| Field | Type / range | Source |
|---|---|---|
| inventory[] | {id, name, kind, props} | name AI text; kind/props engine (equipment spec) |
| credits | >= 0 | engine; no credit events until the equipment spec (D-27) |

**ranks** (owner: ranks)
| Field | Type / range | Source |
|---|---|---|
| rank | ladder id | engine (promotionProposed validated) |
| trials[] | {id, attempts 0-3, passedDay?, lastAttemptDay?} | engine |
| standing | 0-100 | engine |
| masterId, apprentices[] | npc ids | engine |

M3 builds `rank` only, chosen at creation and fixed until M7 (D-56 stub, D-107).

**routines** (owner: routines)
| Field | Type / range | Source |
|---|---|---|
| active | routine template (priorities, effort, days/week) | player |
| templates[] | saved routine templates (custom drills, Q63) | player |
| lockedBlocks[] | player-placed blocks | player |

As built in M4 (D-128, D-129): `active` = {priorities (null = archetype default), effort, daysPerWeek, wakeSecond, sleepHours, lockedBlocks, masterRef, fillSource}; `templates`; `suggested` (the AI's routineRequested, applied only when the player accepts); `fillCredit` (the fill's 0.5 h rounding carried across days, engine via routineDayPlanned).

**world** (owner: world)
| Field | Type / range | Source |
|---|---|---|
| firedTimelineEvents[] | timeline event ids | engine |
| factionState | per faction {control, morale} | engine |
| renown | per faction (D-08 list) -100..+100 | engine |
| notices[] | pending galaxy news for the AI | engine |

M4 builds `log` only: the rolled world events (last 50), each marked told once a narration carried it (D-136). Timeline events, factions and renown arrive in M8.

**memory** (owner: memory)
| Field | Type / range | Source |
|---|---|---|
| facts[] | {id, aboutRef (entity ID or "pc"), text <= 300, turn, day, importance minor/major} | text AI |
| playerPins[] | fact ids the player pinned. Engine pins (master, apprentices, open promises and debts, lasting injuries) are derived by a selector, never stored (D-46) | player |
| chapters[] | {id, turnRange, dayRange, locationIds, entityIds, threadIds, summary, status open / closed / summaryPending} | summary AI text; everything else engine |
| arc | {text <= ~1000 tokens, atChapter} | AI text |
| current | {startTurn, startDay, signals[]} | engine |
| review[] | {id, name, turn, context, status open / mapped / created / dismissed, entityId} unknown names awaiting the player | engine; resolved by the player, or by the engine on an exact match (D-94) |
| nextSeq | shared counter for fact / review / chapter IDs | engine |

### Outside GameState
- **Transcript**: IndexedDB, append-only, keyed by {campaignId, branchId, turn}. Each entry:
  player input, intent, TurnDraft summary, narrative, choices, applied and rejected events,
  usage. Never deleted, never sent whole.
- **Settings** (localStorage): API key, model per call type, daily limits, autoRetry on/off,
  UI preferences.
- **Usage** (localStorage): requests per model per Pacific day, input tokens per call.

---

## 3. AI contract

### Transport
Every call uses Gemini structured output: `responseMimeType: "application/json"` plus
`responseJsonSchema` generated from Zod v4 with `z.toJSONSchema()` (built into Zod; no extra
dependency). The reply is parsed by the same Zod schema. No text tags, no narrative parsing,
anywhere.

### Per-turn schema composition
The composer builds the response schema from the registry, including only the events legal
in the current state (D-15): combat events only when combat is active or the intent is a
fight; montage events only in montage; promotion only when ranks says a proposal is possible.
This keeps schema tokens down and stays within Gemini's schema-complexity limits. A test
generates every variant and checks its size against a config cap.

### Intent call schema
This section is the single source for the AI schemas; `spec/ai-events.md` is superseded
history (D-31).

Every action that rolls dice or computes an outcome (training, Force use, tactics, healing,
hazards caused by the player's action, fights) enters ONLY through the intent and is
resolved in step b. One entry point per action (D-29).
```
intent: {
  actionType: dialogue | move | travel | train | study | fight | forceUse | investigate |
              heal | rest | sleep | other,
  targets: id[], references: id[], unknownNames: string[],
  skillId?: id,                          // the skill or ability the action uses
  proposedDifficulty?: trivial | easy | moderate | hard | extreme,
             // engine maps it to rating 10 / 30 / 50 / 70 / 90, clamped per action type
  requestedPacing?: moment | scene | montage | timeSkip, requestedSpan?: {amount, unit},
             // duration of the action; clamped to the pacing range by the engine
  activity?: { activityId, intensity?: casual | standard | intense | extreme,
               partnerRef?, teacherRef? },        // train / study (skills-and-activities.md)
  tactic?: feint | taunt | takePosition | disengage | surrender | useEnvironment,
  forceAbility?: id, effort?: light | standard | heavy | allOut,
  healing?: { source: medical | bacta | forceHealer, healerRef? },
  risk?: { type: fall | fire | explosion | crash | poison | exposure, severityHint: 1-3 }
             // a hazard the player's own action causes; resolved in step b
}
```
- **Checks are engine-decided (D-37).** The engine decides whether a check, contest or
  perception roll is required from actionType, targets, skillId and state (a config table
  per action type), never from the AI. The AI may only propose a difficulty; the engine
  clamps it to the allowed range for that action type (config, e.g. dialogue
  trivial..hard, fight none: duels use rolls.md §3). A missing proposal uses the action
  type's default.
- Durations come from `requestedSpan` or the routine, clamped by pacing; intensity defaults
  to the activity's default. Neither is ever taken from the narrative reply (D-29).
- Sleep is an intent action (`actionType: sleep`, span from the intent) or part of a
  routine; the engine resolves it with the health and progression sleep rules (D-52).
- **Built in M3 (D-107):** train / study resolve `activity` (or the skill's default activity) through
  progression's resolveTraining and computeXp; the time passes with `occupation: activity`. An
  unknown or locked activity is refused with a reason and changes nothing. Sleep advances with
  `occupation: sleep` and ends with `sleepCompleted`. A UI-built intent enters as the `action` turn
  input (the sheet's Train button) and skips the intent call, like a choice.

### Narrative response schema
```
narrative: string       // may quote only numbers present in the resolved block
choices: [{ label, intent: { actionType, targetRef?, skillId? }, pacingHint?, threadRef? }]
                        // 2-5; compact intent (D-58), the engine fills the rest when clicked
scene: { presentNpcRefs[], moodTags[] }   // locationRef dropped: locationChanged is the only writer (D-84)
events: Event[]         // discriminated union on "type", filtered per turn
```
- A clicked choice's compact intent is expanded by the engine (default activity, span from
  pacingHint, default difficulty for the action type) and validated before step b (D-14 as
  amended by D-58).
- **Output budget (D-58).** The per-level output cap (§8) is the narrative length budget.
  JSON overhead (choices, scene, events, keys) is budgeted separately in config
  (`jsonOverheadTokens`, starting at 300) and added to `maxOutputTokens`, so structure
  never eats into the narrative.

### Event catalog (AI-sourced, narrative reply), by owning feature
The narrative reply carries only events with no dice, plus two deferred events (D-29).
Removed from the narrative schema (D-29): activityPerformed, forceUseRequested,
tacticDeclared and healingReceived. They are intent fields now (above).

| Event | Owner | Engine validation |
|---|---|---|
| timeElapsed {seconds, reason} | clock | only in the schema when the TurnDraft did not advance time; clamped to the pacing range; clamp logged (D-30) |
| sceneEnded {reason} | memory | hint for chapter close only |
| pacingSuggested {level, reason} | pacing | applied only if level = moment; else shown as a choice |
| locationIntroduced {key?, name, kind, region, parentRef?, description, moveHere} | locations | creation event; exact alias match to an existing place first; parent must exist (D-84) |
| locationChanged {locationRef} | locations | place exists; the only writer of currentId (D-84) |
| npcIntroduced {key?, name, species, faction, role, ageApprox, description} | npcs | enums registered; exact alias match to existing/canon first |
| npcStatusChanged {npcRef, state: active / dormant / departed} | npcs | the AI may not set deceased; deceased comes only from the health model (a resolved fight or hazard), a player choice at incapacitation, or a code-run Legends timeline event (engine source); deceased is one-way; `witnessed` removed (D-33); active added (D-65) |
| relationshipChanged {npcRef, delta -3..+3, reason} | relationships | npc exists; cap 1 per NPC per turn |
| factLearned {aboutRef, fact, importance} | memory | ref exists; cap 5 per turn |
| threadOpened {key?, title, stakes, deadlineHint?, entityRefs[]} | threads | refs exist |
| threadProgressed {threadRef, note} | threads | open thread |
| threadResolved {threadRef, outcome} | threads | open thread |
| flagSet {flag} | flags | registered, and `ai` is an allowed source for that flag (spec/flag-registry.md); rank-gating flags never are (D-33) |
| itemGained / itemLost {itemRef \| newItem{key?, name, kind}} | items | kind registered |
| routineRequested {priorities[], effort, spanHint} | routines | skills exist; applies to future time only, never to this turn |
| combatStarted {opponentRefs[], stakes, terrainTags[], ambushClaim?} | combat | DEFERRED: applied at the start of the next turn's step b and narrated then; opponents exist (npcIntroduced or a tmp key first); ambush becomes a perception contest |
| combatEnded {reason: fled / surrendered / interrupted / truce} | combat | wounds end fights on their own |
| forceVision {description} | force | narrative; may open a thread |
| hazardOccurred {type, severityHint 1-3} | health | DEFERRED like combatStarted: a hazard the player did not cause; damage by health rules at the start of the next turn's step b. Hazards the player causes enter as intent.risk |
| emotionalEvent {type: grief / fear / anger / hatred / calm / pride / despair, intensity 1-3, cause} | progression (state of mind, mapping in progression-numbers §17) + alignment via selector-driven engine event | cap 1 per turn (D-36, D-54) |
| moralChoice {direction, weight 1-3, description} | alignment | cap 1 per turn; weight 3 dark + explicit player confirmation for a turn |
| promotionProposed {rank, grantedByRef, occasion} | ranks | requirements checked; rejected and logged if unmet |
| milestoneBeatAcknowledged {beatId} | progression | beat pending |

Summary-call event (source: summary call, D-57): chapterSummarized {chapterId,
chapterSummary, arcSummary}, owner memory. It is applied through applyEvents in its own
commit after the turn commit; if the call fails, the chapter stays summaryPending.

Player-sourced events (UI): stance/tactic at a beat, spare/capture/kill at incapacitation,
turn confirmation, routine edits, pins, review-queue resolution. Engine-sourced events
(emitted by handlers): woundInflicted, levelCrossed, threadEscalated, galaxyEventFired,
npcStatusChanged{deceased}, flagSet for engine-only flags, etc. They share the same
`applyEvents` path.

### Rules
- Events say what happened in the story. They never carry XP, levels, stat values, Vitality,
  wound severities, dates, alignment or dark-pressure values, ranks or roll results.
- References are IDs only (D-13). The context lists every ID the AI may use. New entities
  enter only through npcIntroduced, newLocation and newItem. An unknown ref is first matched
  against exact normalized aliases (case, whitespace, leading titles); there is no fuzzy
  match. If that fails the event is dropped and the name is added to `memory.review`.
- Validation is two steps: Zod, then engine validation. Failures are logged with the reason
  in the transcript and debug console, and dropped. Code never repairs or guesses.
- Narrative events that START something whose outcome needs dice (combatStarted, ambush,
  hazardOccurred) are DEFERRED: applied at the start of the next turn's step b and narrated
  then. The prompt tells the AI to end the narrative at the moment of engagement (D-29).
- **One entry point per action (D-29).** If the narrative events include an action the
  TurnDraft already resolved (same type and target), the event is rejected and logged.
- **Same-turn temp refs (D-32).** A creation event (npcIntroduced, newLocation, newItem,
  threadOpened) may carry a local key `tmp:1`, `tmp:2`, ...; later events in the same reply
  (and `scene.presentNpcRefs`) may use it. applyEvents maps each temp key to the ID it
  mints. A temp key used before its creation event, or never created, is rejected.
- **Apply order (D-32).** (1) entity creation events, (2) time (timeElapsed, when allowed),
  (3) everything else in reply order. Deferred events from the previous turn are applied in
  step b, before the intent's own resolution.
- **Per-turn caps (D-36, config `eventCaps`).** moralChoice 1 per turn; emotionalEvent 1 per
  turn; relationshipChanged 1 per NPC per turn; factLearned 5 per turn. Duplicates of the
  same type and target in one reply are merged first (first one kept, deltas not summed);
  events past a cap are rejected and logged.
- **One time writer per turn (D-30).** If the TurnDraft advanced time (duel exchanges,
  montage, skip, activity duration, sleep), timeElapsed is left out of that turn's schema.
  Otherwise the AI's timeElapsed applies, clamped to the pacing range.

### Legacy tag mapping (ai-contract-legacy.md)
| Legacy tag / scan | v2 | Note |
|---|---|---|
| SHEET JSON | dropped | code owns the character |
| WORLD JSON | dropped; location -> locationChanged, sceneNPCs -> scene | |
| Choices A-E / Custom | `choices[]` with compact intents (D-58) | free text stays the normal input |
| Pre-roll reply, NO_ROLL_NEEDED | intent call `checks` | |
| ROLL:, ROLL_OPPOSED:, ROLL_LABEL= | intent `checks`, engine rolls | |
| TIER_GAP= | dropped | rolls.md has no tier gap |
| TACTICAL= | intent.tactic (or a player beat action) | tacticDeclared removed (D-29) |
| COMBAT_START: | combatStarted | |
| COMBAT_ROUND: | dropped | engine counts exchanges |
| COMBAT_END: | combatEnded (non-wound endings); fate chosen by player at incapacitation | |
| TRAINING: | intent.activity (train / study), resolved in step b | XP by computeXp; activityPerformed removed (D-29) |
| COMBAT: | dropped | combat XP from the duel log |
| PROFICIENCY: | dropped | sub-abilities are skills with synergy |
| LOCATION= | locationChanged | |
| XP:, XP_<Stat>=, stat sets, `<Ability>=n` | dropped | |
| LIFE_STAGE=, RANK= | promotionProposed | life stage derived |
| MOMENTUM_WINDOW= | dropped | state of mind replaces it |
| WILL_OF_FORCE= | dropped (Q43) | moralChoice light |
| INJURY_ADD= | dropped | wounds from resolution, intent.risk or deferred hazardOccurred |
| INJURY_HEAL=, INJURY_HEAL_ALL, STORY_HEAL= | intent.healing (actionType heal) | healing over time by health; healingReceived removed (D-29) |
| OPP_INJURY_ADD / HEAL / HEAL_ALL / PERMANENT | dropped | NPC health is engine-owned |
| DOMINANT_HAND= | character creation; engine switch on hand loss | |
| FIGHTING_HAND= | player beat action | |
| PAIN_CHANNEL= | intent.forceAbility = painChannel | gate checked; forceUseRequested removed (D-29) |
| COMBAT_END_CRASH | engine rule (Q41) | |
| NPC_LIFECYCLE= | npcStatusChanged (active / dormant / departed); deceased engine-only | D-33 |
| RECURRING_RETURN= | dropped | NPC growth from elapsed time |
| HP=, FORCE/PHYSICAL/MENTAL_STRAIN=, FORCE_BARRIER= | dropped | health engine |
| SHATTERPOINT_PERCEIVED / ROLL / FOCUS / FOCUS_CLEAR / XP / MISREAD_RESOLVED | intent.forceAbility = shatterpoint; misread from a negative margin | focus/tunnel vision dropped (Q21); non-combat reads per force-catalog.md (D-63) |
| GENERATE_PROFILE=, PROFILE_STATS=, NPC_ROLL= | npcIntroduced | stats by npc-generation |
| INTERACTION= | relationshipChanged + scene presence | |
| KNOWN_PERSON= | npcIntroduced / factLearned | |
| PENDING_EVENT= | threadOpened with deadlineHint | |
| NPC_AGENDA= | threadOpened with the npc in entityRefs | |
| RESOLVE_EVENT=, RESOLVE_NPC_AGENDA= | threadResolved | |
| SCENE_NPCS= | scene.presentNpcRefs | |
| GALAXY_EVENT= | dropped | galaxy events are code-driven (Q49) |
| ALIGNMENT_XP=, ALIGNMENT=, DARK_PRESSURE=, SURRENDER_DISCOUNT= | moralChoice / emotionalEvent | values dropped |
| AGE= | dropped | age derived |
| CREDITS= | deferred to the equipment spec | no credit events before it (D-27) |
| "Time Elapsed:" prose, "It is now Day N" | timeElapsed {seconds} | clock clamps; omitted when the TurnDraft advanced time (D-30) |
| All 16 prose regex scans (strain, barrier, XP, dates, combat end, markdown sheet) | dropped | no narrative parsing |
| [OVERRIDE], [LORE CHECK], [SYSTEM EXPAND], [WORLD ADJUST], [CORRECTION], [AUTHOR NOTE] | OOC call: read-only, no events in its schema (Q58) | corrections via debug console only |
| BEGIN_GAME | opening turn type | |

---

## 4. Turn pipeline

### Decision: two steps, with a one-call fast path (D-14)
A single call cannot roll dice before the narrative is written. Gemini function calling would
let the model request a roll mid-generation, but that is still two HTTP requests and loses
the small cheap intent model. So the turn is two calls when needed, and one call when the
intent is already known:

```
player input
  ├─ typed text ──────────────> a. INTENT call (light model, small schema)
  ├─ clicked choice ──────────> compact intent attached to the choice, expanded by the
  │                              engine and validated -> skip a.
  └─ combat beat button ──────> structured player event -> skip a.
b. RESOLVE (engine): first the previous turn's deferred events (combatStarted, ambush,
   hazardOccurred), then every action in the intent: checks the engine requires, contests,
   activities (fatigue and XP for the requested span), Force use, tactics, healing,
   intent.risk hazards, sleep, duel exchanges up to the next beat, montage / skip day loop.
   Output: a frozen TurnDraft {intent, resolved results, timeAdvanced?, rng state after,
   report}.
c. NARRATE call (Flash): prompt sections + context + TurnDraft -> response schema (without
   timeElapsed when the TurnDraft advanced time).
d. VALIDATE events -> applyEvents -> COMMIT (state + transcript entry in one IndexedDB
   transaction) -> RENDER.
e. After commit, if the chapter closed: the summary call (light model) returns
   chapterSummarized, applied through applyEvents and committed in its own transaction
   (D-57).
```

- Context building is pure and runs once per call; it never mutates state (fixes R4).
- The TurnDraft is computed once. Every retry reuses it; dice are never re-rolled.
- Failure handling (D-16): if the narrative reply is truncated (`finishReason` MAX_TOKENS),
  one automatic fresh call with a larger output budget, counted in the usage meter, unless
  the setting `autoRetry` is off. Every other failure (invalid JSON or schema, rate limit,
  network) shows an error with a Retry button; no automatic call. Partial replies are never
  stitched.
- Typical cost per turn: 1 call (choice click, combat beat), 2 calls (typed input), plus 1
  light call at chapter close.

---

## 5. Context building and prompts

### Prompt sections (`src/ai/prompts/*.md`)
| File | Used by |
|---|---|
| core-gm.md | narrative: role, Legends-only rule, tone, the character is generic (name from state) |
| contract.md | narrative: how to use events, refs and choices; never state numbers not given |
| pacing-moment.md, pacing-scene.md, pacing-montage.md, pacing-timeskip.md | narrative: reply format and length per level |
| combat-narration.md | narrative while combat is active: narrate the exchange log |
| force-narration.md | narrative when a Force use was resolved |
| opening.md | first turn: backstory facts -> opening scene |
| intent.md | intent call |
| chapter-summary.md | summary call |
| ooc.md | OOC read-only call |

Features add their own `promptSection` (e.g. ranks adds trial-scene instructions when a trial
is active). No engine constant or table is copied into a prompt (R5): prompts point to values
that the state block supplies. Prompt files use plain quotes, never backticks.

### Request sections and token caps (config, `src/ai/context.config.ts`)
| Section | Cap (tokens) | Contents |
|---|---|---|
| gmRules | 5,000 | core-gm + contract + pacing section + active feature sections |
| state | 1,500 | character summary, derived levels for relevant skills, health status, clock, pacing, scene, combat state, valid IDs list |
| recentTurns | 8,000 | the newest 10-15 raw turns that fit, never split |
| memory | 4,000 | retrieved facts, chapter summaries, pinned facts (section 7) |
| lore | 3,000 | retrieved lore chunks |
| arc | 1,000 | arc summary |
| (uncapped, small) | | resolved block (TurnDraft), player input, tier beats pending |

The builder estimates tokens as characters / ratio. The ratio starts at 4 and is calibrated
per model from Gemini `usageMetadata.promptTokenCount` (no countTokens request; D-26). It
enforces every cap and reports estimated and actual usage per section to the debug console.

Pacing changes the caps (config): montage and timeSkip shrink recentTurns to 4,000 and raise
memory; output caps per level are in section 8.

### Lore retrieval
- Build time: `scripts/build-lore.ts` reads `Docs/SWRPG lore/*.md` (read-only), splits by
  heading into chunks, and tags each with an era range (parsed from the section headings, e.g.
  "MANDALORIAN WARS — 3,976–3,960 BBY"), entity names (character headings), canon IDs and
  location names. Output: `src/lore/generated/lore-index.json` (gitignored), regenerated
  before `dev`, `build` and `test`. A test checks the output is deterministic.
- Run time: filter to chunks whose era range contains the current date; score by overlap
  with scene NPC canon IDs, the current location and the intent's references; fill to the
  3,000 cap. Upcoming timeline events are included only when code decides they are relevant
  to the scene (Q49), never as a future list.
- As built in M2 (D-81, D-93, D-95): character and timeline files only (Force file in M6);
  stats and game-meta sentences stripped; timeline rows up to the current year (10 years
  back); a person's entry only when that person is in play (canon ID, name, or the player's
  words), never for a shared place, since entries span whole lives. The builder is
  `src/turn/context.ts`; the caps are in `src/ai/context.config.ts`.

---

## 6. Provider interface

```ts
interface ModelProvider {
  generateStructured<T>(
    schema: ZodType<T>,
    messages: Message[],
    opts: { callType: 'intent' | 'narrative' | 'summary' | 'ooc';
            maxOutputTokens: number; temperature: number; thinkingBudget?: number }
  ): Promise<{ data: T; usage: Usage; finishReason: FinishReason }>;
}
```
- Adapters: `gemini` (fetch; API key in the `x-goog-api-key` header, read from localStorage;
  never in a URL) and `fixture` (replays recorded responses; tests).
- Model per call type in one config value: `models: { intent, narrative, summary, ooc }`.
  Defaults: narrative = current recommended Flash, others = Flash-Lite; check the current
  names at M1 (Q59).
- Thinking budget set per call type, so small calls never come back empty (legacy sim bug 21).

---

## 7. Story memory and request budget

### Layers
1. **Transcript**: every turn in IndexedDB, never deleted, never sent whole.
2. **Fact records**: npcs, relationships, locations, items, factions, threads, facts. Owned by
   code, written only through events.
3. **Chapter summaries**: written once at chapter close, never rewritten. Tags (entityIds,
   locationIds, threadIds, dayRange, turnRange) are computed by code from the chapter's
   applied events, not by the AI.
4. **Arc summary**: capped at ~1,000 tokens, updated in the same call as each chapter summary.
5. **Recent raw turns**: the newest 10-15 that fit the cap.

### Entities
Stable IDs (`npc:`, `loc:`, `item:`, `fac:`, `thread:`) with alias lists. The AI references
IDs. Unknown names go to `memory.review`; the player resolves them in the People tab (map to an
existing entity or create one). Nothing is created silently.

### Chapter close (code decides; D-17)
Close when any of: the location changes to a different major location; a skip of 7+ days;
an AI `sceneEnded` hint with at least 8 turns in the chapter; 30 turns (config). Montages and
skips are always their own chapter (Q56). After commit, one light-model call returns
`{chapterSummary, arcSummary}` as a `chapterSummarized` event (source: summary call), applied
through applyEvents and committed in its own transaction, never written outside applyEvents
(amended by D-57). If it fails, the chapter is `summaryPending` and is retried at
the next close; its raw turns stay in the transcript. Boundaries are turn IDs, not array
slices, so turns played meanwhile are never lost (legacy story-memory bug 1).

### Retrieval (`src/memory/`)
Weights, the recency rule for unrelated items and the name-mention signal are in D-83 and D-85.
- Inputs: scene NPCs, current location, entities referenced in the intent, open threads.
- Score = tag overlap (weighted per kind) + recency decay + open-thread bonus.
- Each section fills up to its cap in score order. Pinned facts are always included: the
  character's master and apprentices, open promises and debts, lasting injuries (engine pins,
  derived by a selector), and player pins (the only stored pins, D-46).
- The scorer is an interface, `Scorer { score(item, query): number }`, combined by a
  `CompositeScorer`. An embedding scorer can be added later without changing callers.

### Call budget
Normally 1-2 calls per turn (intent on the light model when needed, narrative on Flash). The
chapter summary runs on the light model, only at chapter close. Models per call type are
config. No continuation calls and no stitching; the only automatic extra call is the
truncation retry (section 4).

### Usage meter
Counts requests per model per day, resetting at midnight America/Los_Angeles (computed with
`Intl.DateTimeFormat`), and input tokens per call. Shown in the UI header; warns when
approaching the per-model RPM, RPD and TPM limits the player sets in settings.

---

## 8. Pacing

Four levels, stored in `pacing.level`. Per level (config):

| Level | Time per turn | Reply | Output cap (tokens) |
|---|---|---|---|
| moment | 5 s - 15 min | close detail, one beat | 700 |
| scene | 15 min - 12 h | a scene | 1,000 |
| montage | 1 - 120 days | the montage report narrated, highlights | 1,200 |
| timeSkip | 7 days - 10 years | the skip report narrated, key changes | 1,200 |

- Each level has its own prompt section, reply format and token caps.
- **Settling-in**: starts on arrival at a new major location or a new life stage. Favors moment
  for 14 in-game days or until the key NPCs are met (config). No skip suggestions during it.
- **Staleness**: 21 in-game days in one location with no new NPC, thread or location sets a
  flag in context; the choices must include at least one forward jump tied to a story hook. If
  the AI omits it, code appends a deterministic choice "Skip ahead: <top open thread>" and logs
  it (D-18). Suggest only; never auto-skip.
- Automatic switches only go to moment (combat, ambush, Dying, urgent interruption).
- The intent call reports the requested pacing level and time span.
- Settling-in and staleness are evaluated by the pacing day hook (§10, step 9).
- This section holds the prompt pack's pacing spec ("the pacing spec" in older text; D-59).

---

## 9. Advancing time

- Montage and timeSkip advance day by day through the engine (`state/advanceTime`).
- Each day runs the single ordered hook list in §10 (routine blocks first, interruption check
  last). There is no other per-day sequence (amended by D-35).
- A significant event interrupts: the loop stops at that day, pacing switches to moment, and
  the partial report is returned.
- A skip ends in the morning (the routine's wake time) unless the story sets a time (Q48,
  copied by D-63).
- **Rest and sleep (D-52).** Elapsed time not covered by an activity is rest (recovery rates
  from progression-numbers §3 and health §2-3), in story turns as well as in jumps. Sleep is
  an intent action (or a routine block) resolved by the engine; 7 h+ of sleep resets the
  meters and Vitality per the specs, 5-7 h and under 5 h carry fatigue over.
- Relationship drift continues during jumps (training partners and teachers gain from shared
  sessions; others drift slowly toward neutral).
- The AI receives the report (training-routines sec 8) and narrates it; it invents no stat
  outcomes.
- The legacy training simulator is the montage activity type; routines feed it.
- **As built in M4 (D-130, D-139).** `src/state/advanceRoutine.ts` runs a jump one day at a time as
  real timed segments through advanceTime: free time (rest) to bedtime, sleep to the wake time,
  sleepCompleted, then the scheduler's sessions (resolveTraining, the story turn's code path) with
  occupation activity and the conditional rests. The sessions are §10 slot 1; midnight falls in the
  night, so every day-end hook runs after them. A span of more than 12 hours picks montage (up to
  120 days) or time skip (to 10 years); the jump ends at the wake time; the report
  (`src/state/montageReport.ts`) is narrated; afterwards pacing is moment if interrupted, else scene.

---

## 10. Clock

- One clock feature is the only writer of `clock.now`. Dates are integers (absolute day +
  second of day, 0..86399), never strings (D-23, amended by D-30: seconds, not minutes).
  Display formats BBY/ABY with the calendar below.
- One time writer per turn (D-30): the TurnDraft's advance, or else the AI's `timeElapsed`
  {seconds}, checked against the current pacing level's range and clamped with a logged
  reason. Never both.

### Calendar (D-38; design choices, logged as such)
Legends gives 12 months and 368 days (D-03). The rest is a design choice:
| Rule | Value |
|---|---|
| Months | numbered 1-12; months 1-8 have 31 days, months 9-12 have 30 (248 + 120 = 368) |
| Years | signed: BBY negative, ABY positive; year 0 exists, as in the lore timeline (0 BBY = 0 ABY, the year of the Battle of Yavin, Timeline :722-725), shown as "0 BBY/ABY" |
| Absolute day | day 0 = day 1 of month 1 of 1 ABY; year y starts at day 368 * (y - 1) (so year 0 is days -368..-1 and 1 BBY, y = -1, is days -736..-369) |
| Weeks | 7-day weeks run continuously across years; absolute day 0 is weekday 1, weekday = ((day mod 7) + 7) mod 7 + 1 |
| Labels | numbered months and weekdays (Q47); time-of-day labels derived from now.second |

### Day loop: one ordered hook list (D-35)
Every time-based feature registers `onTimeAdvanced(slice, step: TimeStep, ctx)`, the same
signature as §11, where `TimeStep` = {kind: subDay / day, fromAbs, toAbs (day + second),
seconds, occupation: rest / activity / sleep (M3, D-107; default rest), jump: montage or time skip (M4, D-134: only jumps roll world events and stop on an interruption)}. advanceTime calls the hooks in this fixed order (registry order, documented and
tested), once per day for day steps:
  1. routines: the routine's blocks in 30-minute steps (fatigue and XP via progression and
     health); in story turns, the TurnDraft's resolved activities take this slot
  2. health (healing, meter recovery, rest and sleep, dying timer)
  3. progression (rust, bank release, state-of-mind easing, grief, willpower reset,
     fightsToday and daily combat XP reset)
  4. alignment (drift, pressure decay, notice rolls)
  5. npcs and relationships (drift; NPC levels are derived from date, so aging is free)
  6. threads (deadlines, escalation, rumors, rival progress)
  7. ranks (selection rolls, trial eligibility, Council bypass check, milestones)
  8. world (owns the weighted event rolls and the scheduled Legends timeline events, faction
     state)
  9. pacing (settling-in, staleness)
 10. interruption check (stops the loop on a significant event)
- Sub-day steps (moment and scene) call the same hooks with `kind: subDay`; hooks that only
  act per day ignore them. Midnight crossings split the step and run the day hooks.
- §9 (advancing time) and §11 (module contract) refer to this list; there is no other.
- Required tests: multi-month skips; month and year rollover in the 368-day calendar,
  including 1 BBY -> 0 BBY/ABY -> 1 ABY and the 31/30-day month boundary (month 8 -> 9); the
  weekday continuing across a year boundary (day 0 is weekday 1); a birthday during a skip
  (age derived, notice in the report); an interruption mid-skip (state equals the state at
  the interruption day); the hook order is fixed; a 34-exchange duel advances the clock by
  the sum of its rolled 5-10 s exchanges, to the second.

---

## 11. Feature module contract

```ts
interface FeatureModule<S> {
  id: string;
  version: number;
  initialState(ctx: InitCtx): S;
  stateSchema: ZodType<S>;
  events: Record<string, {
    schema: ZodType;                       // composed into AI / player schemas
    source: ('ai' | 'player' | 'engine')[];
    handle(slice: S, event, ctx: ApplyCtx): { slice: S; emit?: Event[]; reject?: string };
  }>;
  onTimeAdvanced?(slice: S, step: TimeStep, ctx: ApplyCtx): { slice: S; emit?: Event[] };
  selectors: Record<string, (state: GameState) => unknown>;
  promptSection?(state: GameState): string | null;
  contextContribution?(state: GameState, budget: number): ContextPart;
  ui?: PanelSpec;
  migrations?: Record<number, (old: unknown) => unknown>;
}
```
- One registry (`src/state/registry.ts`) lists all features in the §10 hook order;
  `onTimeAdvanced` uses the §10 `TimeStep` signature everywhere (D-35).
- applyEvents implements the §3 rules: temp refs, apply order, per-turn caps and
  de-duplication, and rejection of narrative events the TurnDraft already resolved.
- `applyEvents(state, events, ctx) -> { state, applied[], rejected[{event, reason}] }` routes
  each event to its single owning feature, then runs emitted events (max depth 4; deeper is a
  bug and throws in tests). It is pure: `ctx` carries the RNG and clock.
- Event schemas are defined in their features; `src/ai/schemas/` only composes them (D-12).
- Features read other features' state only via exported selectors; ESLint enforces it.
- `src/engine/` keeps the shared math; `src/features/` holds the features.

Feature list: clock, pacing, character, progression, health, combat, force, alignment, npcs,
relationships, locations, threads, flags, items, ranks, routines, world, memory.

---

## 12. Progression

Full targets and the legacy verification are in `spec/progression-targets.md`; the numbers
are in `spec/progression-numbers.md`, `spec/combat-xp.md` and `spec/training-routines.md`.
This section is the architecture.

- **Curve.** Time to reach level L at a steady rate ~ L^1.75: `XP(L) = K * L^1.75`, levels
  derived from XP. K is solved by running the Average profile through the real day loop
  (fatigue, age factor, rust) so it reaches 41 in 16.0 years. All constants live in
  `src/data/progression.config.ts`, each commented with the target it serves.
- **Average profile schedule (D-40).** The Average profile is a Jedi Guardian on the
  standard routine: the Order requirements for its rank (ranks.md §1a) as fixed
  commitments, filled up to the D-25 training budget by archetype shares, 300 training days
  per 368-day year. From Knight on, the main specialty takes a 0.5 share (D-41). K solves
  to 14.69 with it, and to 15.18 once D-67 was decided with the natural baseline (D-102;
  docs-v2/calc/progression-sim.mjs). Obi-Wan, Anakin and Luke use the same
  structure and change only effort (hours), talents, teachers, rank ages and combat events.
- **XP unit** = effective practice hours. Fatigue, challenge factor, drill ceiling, combat
  integration and willpower follow progression-numbers.md exactly.
- **Activity weights** are normalized to sum to 1 and split XP (0.75 main / 0.25 secondary
  share). Never additive. Synergy spillover is the only extra XP and is capped at 25%.
- **Speed multiplier M** (D-21, spec kept): talent (1.0-1.8) x cross-talent (1.0-1.1) x
  instruction (0.90-1.23: solo 0.90, partner 0.95-1.00, teacher factor up to 1.15 plus
  aptitude +/-0.05 and bond +0.03) x age (0.75-1.25 by category) x state of mind (0.80-1.30)
  x alignment (0.6-1.3 by ability side), capped at 2.8. Focus comes from hours and weights,
  not M. Combat experience comes from combat XP, E and CI, not M.
- **4.0x pace clamp (D-48).** A mechanism, not only a test: per skill, over a rolling 365-day
  window, credited XP cannot exceed 4.0 x the Average profile's yearly main-skill XP at the
  character's age x (the character's share for that skill / the Average main share). The
  excess is discarded and logged. Banked drill XP released after combat is excluded.
  Tests 2 and 24 of progression-numbers check it (progression-numbers §5).
- **One function**, `computeXp(session)`, serves every source: story turn activities,
  montage and skip days, missions, combat. Training sessions use hours, intensity, challenge,
  weights, M and a code-rolled outcome (mean 1.0); breakthroughs are the 4% x1.75 outcome,
  logged. Combat sessions take the combat branch (D-55): exchanges from the duel log,
  combat-xp.md §1 exactly, and the fight outcome (won / lost / fled / truce) instead of the
  rolled session outcome.
- **No skill-tier gates** (D-20). Lightsaber forms are gated by the drill ceiling (25 + E),
  combat Force abilities by combat integration, and teaching by the teacher factor. Physical
  stats and non-combat Force abilities have no gates. Crossing 21, 41, 61, 81 or 101 adds a
  `tierBeatsPending` entry; the next scene acknowledges it (a master's recognition, Temple
  reputation) and a fact record is written. It never holds back XP or levels.
- **Ranks** (Knight, Master, Council) are story-granted with skill minimums (ranks.md); the AI
  can only propose.
- **Natural baseline (D-102).** Strength, Agility and Endurance start at half the body cap
  for the age and species, Willpower at an age curve; training adds on top in XP terms
  (progression-numbers §11a). Levels stay derived.
- **Closed form (D-105).** NPC and created-character levels use measured phase paces per
  archetype (npc-generation §1, §3), so they match the day loop within +/-0.3 level.
- **Form plans and the fundamentals transfer (D-118, D-119).** Initiates train Shii-Cho; from
  Padawan a form plan splits the master session and the solo hour among any forms, with an
  optional Knight+ plan. A form's first session starts it at 0.75 x the highest form (outside the
  clamp). The calibration targets apply to the highest form; K = 11.683 (D-120 rank-minimum reset
  and proportional fill trimming).
- **Physical performance** = min(trained level, species body cap for age) + Force boost
  (grows with Force Control and body abilities). The boost offsets decline so effective
  performance can peak in the 60s, but age wins eventually. Force, knowledge and technique
  skills are not age-capped.
- **Lifetime test**: the Average profile runs 95 in-game years (so its Legendary target at
  77.5 years is inside the run) and the other three profiles run 70, through `advanceTime`
  with real routines and scripted combat events (amended by D-49). Fails if any milestone is
  outside +/-20% of its target, if any profile beats the max (Anakin) profile's pace, or if
  any pace exceeds 4.0x.

### Legacy features this changes
| Legacy | v2 |
|---|---|
| 100 x 1.07^n curve | K * L^1.75 |
| Story-turn tier multiplier (up to x3.5) and AI-chosen outcome (up to x3) | removed; one computeXp with code-rolled outcome |
| Additive secondary weights (~2x total) | normalized weight split |
| Flat talent multipliers (x1.2-1.3, Battle Meditation x3.33) | domain talent levels inside M; special talents become unlock flags (Q17, D-05) |
| Strain talents (Iron Mind, Natural Telekinetic Burst, Unbreakable Spirit) | small health bonuses, e.g. +0.5 meter capacity (Q18) |
| Momentum windows | removed; state of mind and rolled breakthroughs (Q46) |
| Proficiencies / sub-ability percentages and trickle | sub-abilities are main-curve skills linked by synergy (Q19) |
| Shatterpoint 500 x 1.07^L track | an ability on the main curve, ShatterSense only, XP cost x3 |
| Training simulator | montage activity type with the routine scheduler |
| COMBAT: / COMBAT_END XP | per-exchange combat XP from the duel log |

---

## 13. Saves

- **Storage**: IndexedDB through a `Storage` interface (an in-memory implementation is used in
  tests; no fake-indexeddb dependency). Stores: `campaigns`, `snapshots` (autosave + 5
  slots), `transcript` keyed by {campaignId, branchId, turn}.
- **Autosave** happens in the turn commit transaction. Saving mid-combat and mid-montage is
  allowed: all state is serializable (Q60).
- **Branches**: loading an older slot and playing on starts a new branchId, so no transcript
  entry is ever deleted.
- **Envelope**: `{format: "swrpg-v2", envelopeVersion, featureVersions: {id: n}, savedAt,
  state}`. Load runs envelope migrations, then each feature's migrations from its stored
  version, then validates the whole state with Zod. If anything fails, the load is refused
  with a message; there is no partial load. Each migration ships with a fixture test.
- **Export / import**: one JSON file with the envelope (state includes fact records, chapter
  summaries and arc summary) plus the transcript.
- **V170 saves are not imported**; v2 starts a new campaign.

---

## 14. Testing

- **Engine**: a unit test for every function, and every spec's "Required tests" list.
- **Features**: handler tests for valid events, invalid events (rejected with a reason) and
  onTimeAdvanced hooks.
- **Pipeline**: recorded model responses in `tests/fixtures/ai/*.json`, replayed by the
  fixture provider. Covers: happy path; invalid event dropped; unknown ref goes to review;
  truncation gives one retry with identical dice; autoRetry off gives no retry; a 429 gives no
  automatic call; a choice click makes one call; chapter close makes the summary call;
  OOC calls change nothing.
- **Architecture**: lint boundaries; a test asserts every event type has exactly one owner
  and every tag in ai-contract-legacy.md appears in the mapping table; every composed response
  schema stays under the size cap.
- **Determinism**: same seed and inputs give identical state (duels, montages, NPCs).
- **Lifetime test** (section 12) runs in `npm run test:lifetime` and `npm run test:all`, not in `npm test` (CLAUDE.md golden rule 6): test:all at the end of each milestone and before any change to progression numbers.
- `npm test`, `npm run typecheck` and `npm run lint` must pass before any task is done.

---

## 15. Build order

These milestones replace the prompt pack's Phases 3-8 (D-28; the table is amended by D-34 and
D-56). Each milestone is its own session: plan mode first, then build. The specs (and the
pack prompts, where a section is not yet in this file) are checklists for the matching
milestone. Each milestone ends **playable locally (`npm run dev`), tested and committed** on
the `rebuild` branch. Nothing deploys to GitHub Pages until the Phase 9 cutover; the deploy
workflow keeps its main-only trigger.

The clock and the module contract come first, before any feature.

| # | Milestone | Contents | Playable as |
|---|---|---|---|
| M1 | Core and talk to the GM | Scaffold (Vite, TS strict, Vitest, Zod, ESLint); rng; calendar math; basic roll and checks as pure engine (rolls.md §1, §2, §7; D-34); FeatureModule, registry, applyEvents (temp refs, apply order, caps); clock in seconds and advanceTime (hook order, tests); pacing (moment, scene); provider, gemini and fixture adapters; settings and API key; minimal character (name, birth date, start date); two-step pipeline with the choice fast path and engine-decided checks; transcript and autosave; usage meter | Free story with a working clock and real dice |
| M2 | Memory and lore | npcs (identity), locations, threads, facts, relationships; People tab and review queue; chapters and arc (chapterSummarized); context builder with caps and report; lore index and retrieval; export/import | Long campaigns that remember |
| M3 | Progression and creation | Skills and activities (spec/skills-and-activities.md), curve, fatigue meters, computeXp, synergy, rust, state of mind, intent-driven activities (train / study / sleep), rest, the 4.0x clamp, NPC closed form and the Human body-cap table (moved from M5/M8, D-56), the species table and natural baseline (D-102, D-103), computed character creation, sheet UI, tier beats | Train in story and grow |
| M4 | Time advance | Montage and timeSkip, routine scheduler, settling-in and staleness, thread deadlines, weighted events, interruptions, lifetime test (scripted combat via combat-xp.md math) | Skip months and years |
| M5 | Combat and health | Duels and beats, Vitality, wounds, healing, NPC generation (talents, variance, minions), combat XP from the duel log; lifetime test re-run | Fight |
| M6 | Force and alignment | Catalog data, Force meter, Force use, combat integration, Shatterpoint, alignment, dark pressure, concealment | Use the Force |
| M7 | Ranks and milestones | Ladders, trials, standing, Order requirements, Council of Reassignment, Council bypass, flag registry sources for rank flags | Advance in the Order |
| M8 | World | Timeline events, factions, renown, equipment spec and items/credits, species table | A living galaxy |
| M9 | Polish | Save slots UI, migrations hardening, responsive layout (iPad first), debug console | Release candidate (Phase 9 cutover) |

### Recorded for M5 (D-122, Jared)
- **Niman (Form VI) in combat:** matchups 0 in every situation (rolls.md §5). Force abilities used
  while fighting in Niman get half the combat-integration penalty (progression-numbers §8: the
  G-based effective-level loss, strain multiplier and misfire chance are halved).
- **Jar'Kai:** dual blades (needs the equipment, M8 equipment spec) and Niman 30+. Jar'Kai and
  Niman are linked by 0.25 variant synergy (both ways, progression-numbers §14).
- The progression-side Niman rules are built in M3 (D-121).

### Future work recorded during M5 (D-143, D-144, D-155)
- **Canon rosters for every era (D-155).** Every lore era gets a canon roster with the same level of detail as era 09
  (births, deaths, dated level snapshots, roles over time; presence computed from the campaign date), one file per
  era in `src/data/canon/` matching `Docs/SWRPG lore/SW_Characters_NN_*.md`, added over time. Era 09 came first only
  because it is Jared's preferred start; the system favours no year.
- **Legacy-era One Sith academy (D-144):** add to SITH_ACADEMIES if a Legacy-era campaign is supported and the lore
  supports live-blade training.
- **A full ally side in duels (D-143 E):** allies fight their own engagements; until then they are story-only and
  opponents can be marked engagedElsewhere.
- **Character traits (D-143 M, end of production):** first entry Tactical Fighter, +1 to the sequence cap.
- **M8 equipment (D-158):** saber-resistant armor and weapons for anyone but Mandalorians (cortosis weave, personal
  beskar, phrik); until then STUB_WEAPONS gives saber resistance only through the Mandalorian beskar-by-era rule.
- **M7 Order schedule (D-165, Jared):** a 13-year-old Padawan's fixed Order day alone ends near f 0.97 against the
  standard tiredness limit 0.9 even when fresh; the Order schedule is revisited with the Order requirements in M7.
- **M7 teaching (D-163):** characters with the instructor role get a higher share of drill XP above the ceiling
  (design default 25% -> 35%) for the forms they teach.
- **M8 prosthetic damage (D-164):** a hit to a prosthetic limb becomes equipment damage to the prosthetic (repair,
  malfunction, loss). Until then such a hit costs Vitality only: no wound and no sever.
- **Cleave (D-158):** keeping the advantage after taking a minion out; a candidate Shii-Cho / Sokan form trait
  against groups (M6 or later).

### Stubs each milestone uses (D-56)
A milestone may only depend on a later one through a named stub, replaced when that
milestone is built. Each stub is a function in `src/data/stubs.ts` with a test that its value
holds until replaced.
| Stub | Value until replaced | Used by | Replaced in |
|---|---|---|---|
| Effective level modifiers in rolls (wound penalty, Vitality spent) | 0 / false | M1 checks | M5 |
| Effective level modifiers in rolls (rust, fatigue) | 0 / e(f) = 1 | M1-M2 checks | M3 (replaced: progression rust, health e(f_phys)) |
| Skill levels for M1-M2 checks | from the minimal character's computed creation: none in M1, so checks use level 0 plus the circumstance modifiers | M1-M2 | M3 (replaced: progression performance levels) |
| Teacher levels | the Average profile's closed-form level at the teacher's age (no per-NPC variance) | M3-M4 | M5 (NPC generation) |
| Order requirements | the ranks.md §1a table as static data, rank fixed at creation; the lifetime test changes rank with the engine-only rankSet (D-131) | M3-M4 lifetime test, routines | M7 |
| Order instruction (D-124) | Temple instructors = a teacher 10 levels ahead (x1.05), an unnamed master 30 ahead (x1.15), Temple peers an even partner (x1.00), teacher aptitude 0 | M4 routines, lifetime test | M5 (NPC generation), M7 (masters) |
| Alignment multiplier in M | 1.0 | M3-M5 | M6 |
| State-of-mind effects of alignment (dark pressure > 50) | D = 0 | M3-M5 | M6 |
| Species body caps | Human table only (progression-numbers §11); replaced early by species.md in M3 (D-103) | M3 | M3 |
| Combat events in the lifetime test | scripted fightResolved events through the built combat branch of computeXp (D-127; STUB_SCRIPTED_COMBAT) | M4 | M5 (real duel log) |
| Fight intents (D-70) | one engine check against the clamped difficulty (`STUB_FIGHT_AS_SINGLE_CHECK`) | M1-M4 | M5 (duels, rolls.md §3) |

The species spec is written (spec/species.md) and built in M3 (D-103). Planned specs (not yet written; named "planned" wherever cited): formerly the species spec (M8; Human
body cap is in progression-numbers §11) and the equipment spec (M8; D-27).

---

## 16. Open questions

Answered by Jared on 2026-11-16 (logged in decisions.md):
1. ESLint and typescript-eslint as dev dependencies: yes (D-11).
2. Pacing ranges, settling-in 14 days, staleness 21 days, chapter max 30 turns as starting
   defaults: yes.
3. Code-appended "Skip ahead" choice when the AI omits the forward jump: yes (D-18).
4. Choice fast path: yes (D-14).
5. Interpolated training budget by age: approved (D-25).
6. No credit events before the equipment spec: yes (D-27).

Answered in M1 (2026-11-16): the Gemini models, transport and free-tier limits (D-68; limits unverified until Jared checks AI Studio).

Still open (to settle in the named milestone):
- M8: species LORE CHECKs (lifespans and traits in spec/species.md are design defaults; the table itself is built in M3, D-103).
- M8: the equipment spec (planned: prices, credits economy, lightsaber properties).
- D-67 is decided (M3, D-102): natural baseline, no conditioning hour, Knight Force Sense
  minimum 26, K = 15.18, and the phase-pace closed form (D-105).
