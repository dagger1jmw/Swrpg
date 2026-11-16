# Architecture (v2)

Phase 2, 2026-11-16. This is the design every milestone builds against. Specs in
`docs-v2/spec/` define the targets and tests; this file defines where the code lives, who owns
which state, how the AI talks to the engine, and the build order. Deviations from the Phase 2
prompt pack and from earlier specs are logged in `decisions.md` (D-11 onward).

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
  verbatim after validation. The AI never supplies a number, and code never rewrites AI text.

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
| now.day | int, absolute GSC day; day 0 = first day of 1 ABY, BBY days negative | engine |
| now.minute | 0-1439 | engine |
| lastAdvance | {minutes >= 0, reason, requested?, clampedFrom?} | engine |

**pacing** (owner: pacing)
| Field | Type / range | Source |
|---|---|---|
| level | moment / scene / montage / timeSkip | engine (player requests via intent) |
| settlingIn | {active, sinceDay, reason: location / lifeStage, keyNpcIds[]} | engine |
| lastNoveltyDay | absolute day of the last new NPC, thread or location | engine |
| scene.locationId | location id | AI ref, validated |
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
| archetype, focusWeights | archetype id; weights summing to the archetype total | player |
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
| stateOfMind | {kind: centered / neutral / distracted / grief / anger..., intensity 1-3, sinceDay, easesByDay} | engine (AI proposes emotionalEvent) |
| overtrainStreak | int >= 0 | engine |
| willpowerToday | 0-3.0 | engine |
| reviewBuffUntil | day or null (recording review, sec 19) | engine |
| tierBeatsPending | [{skillId, tier, day}] | engine |

**health** (owner: health)
| Field | Type / range | Source |
|---|---|---|
| meters.physical, .mental, .force | load >= 0 (fraction is derived from capacity) | engine |
| sleepCarry | 0-0.6 | engine |
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
| fightsToday | per skill count (combat-xp sec 2) | engine |

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
| griefFloor | 0-30 | engine |

**npcs** (owner: npcs)
| Field | Type / range | Source |
|---|---|---|
| id | `npc:<slug>` stable | engine |
| name, aliases[] | 1-60 chars | AI text (npcIntroduced), aliases also engine |
| speciesId, factionId, role | registered ids / enum | AI enum, validated |
| birthDay | absolute day (from ageApprox at intro) | engine |
| archetype, talents, seed, startAge, warYears | generation inputs (npc-generation sec 4) | engine |
| canonId | canon table id or null | engine (matched by exact alias) |
| status | active / dormant / departed / deceased | engine (AI proposes npcStatusChanged) |
| description | <= 400 chars | AI text |
| firstMetDay, lastSeenDay, lastLocationId | | engine |
| health | named NPCs: same shape as health slice; minions: none | engine |

**relationships** (owner: relationships)
| Field | Type / range | Source |
|---|---|---|
| byNpcId.value | -100..+100 (labels derived) | engine (AI delta -3..+3) |
| byNpcId.lastDay | day | engine |

**locations** (owner: locations)
| Field | Type / range | Source |
|---|---|---|
| byId | {id `loc:<slug>`, name, aliases, kind, region, parentId?, major: bool, description, firstVisitDay} | name/kind/region/description AI text; major and ids engine |
| currentId | location id | engine (from locationChanged) |

**threads** (owner: threads)
| Field | Type / range | Source |
|---|---|---|
| byId | {id, title <= 80, stakes <= 200, status open / resolved / failed, deadlineDay?, escalation 0-3, notes[] (<= 200 each), entityRefs[], openedDay} | title/stakes/notes AI text; deadline from deadlineHint mapped by engine; escalation engine |

**flags** (owner: flags)
| Field | Type / range | Source |
|---|---|---|
| set | FlagId[] from the registered list | engine |

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

**routines** (owner: routines)
| Field | Type / range | Source |
|---|---|---|
| active | routine template (priorities, effort, days/week) | player |
| templates[] | saved routine templates (custom drills, Q63) | player |
| lockedBlocks[] | player-placed blocks | player |

**world** (owner: world)
| Field | Type / range | Source |
|---|---|---|
| firedTimelineEvents[] | timeline event ids | engine |
| factionState | per faction {control, morale} | engine |
| renown | per faction (D-08 list) -100..+100 | engine |
| notices[] | pending galaxy news for the AI | engine |

**memory** (owner: memory)
| Field | Type / range | Source |
|---|---|---|
| facts[] | {id, aboutRef, text <= 300, turn, importance minor/major, pinned} | text AI; pinned engine/player |
| chapters[] | {id, turnRange, dayRange, locationIds, entityIds, threadIds, summary, status open / closed / summaryPending} | summary AI text; everything else engine |
| arc | {text <= ~1000 tokens, atChapter} | AI text |
| current | {startTurn, startDay, signals[]} | engine |
| review[] | {name, turn, context, resolved?} unknown names awaiting the player | engine |

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
```
intent: {
  actionType: dialogue | move | travel | train | study | fight | forceUse | investigate |
              rest | other,
  targets: id[], references: id[], unknownNames: string[],
  checks: [{ kind: check | contest | perception, skillId | abilityId, targetRef?,
             difficulty: trivial | easy | moderate | hard | extreme }],
             // engine maps difficulty to rating 10 / 30 / 50 / 70 / 90
  requestedPacing?: moment | scene | montage | timeSkip, requestedSpan?: {amount, unit},
  tactic?: feint | taunt | takePosition | disengage | surrender | useEnvironment,
  forceAbility?: id, effort?: light | standard | heavy | allOut
}
```

### Narrative response schema
```
narrative: string       // may quote only numbers present in the resolved block
choices: [{ label, intent (same shape as above), pacingHint?, threadRef? }]  // 2-5
scene: { locationRef, presentNpcRefs[], moodTags[] }
events: Event[]         // discriminated union on "type", filtered per turn
```

### Event catalog (AI-sourced), by owning feature
| Event | Owner | Engine validation |
|---|---|---|
| timeElapsed {minutes, reason} | clock | clamped to the pacing range; clamp logged |
| sceneEnded {reason} | memory | hint for chapter close only |
| pacingSuggested {level, reason} | pacing | applied only if level = moment; else shown as a choice |
| locationChanged {locationRef \| newLocation{name, kind, region}} | locations | ref exists or new entry created |
| npcIntroduced {name, species, faction, role, ageApprox, description} | npcs | enums registered; exact alias match to existing/canon first |
| npcStatusChanged {npcRef, state, witnessed} | npcs | deceased needs witnessed or a resolved fight; deceased is one-way |
| relationshipChanged {npcRef, delta -3..+3, reason} | relationships | npc exists |
| factLearned {aboutRef, fact, importance} | memory | ref exists |
| threadOpened {title, stakes, deadlineHint?, entityRefs[]} | threads | refs exist |
| threadProgressed {threadRef, note} | threads | open thread |
| threadResolved {threadRef, outcome} | threads | open thread |
| flagSet {flag} | flags | registered and allowed from this source |
| itemGained / itemLost {itemRef \| newItem{name, kind}} | items | kind registered |
| activityPerformed {activityId, minutes, intensity, partnerRef?, teacherRef?} | progression | sum of minutes <= elapsed minutes this turn |
| routineRequested {priorities[], effort, spanHint} | routines | skills exist |
| combatStarted {opponentRefs[], stakes, terrainTags[], ambushClaim?} | combat | opponents exist (npcIntroduced first); ambush becomes a perception contest |
| tacticDeclared {tactic, details} | combat | combat active |
| combatEnded {reason: fled / surrendered / interrupted / truce} | combat | wounds end fights on their own |
| forceUseRequested {abilityId, effort, targetRef?} | force | known ability, prerequisites, gates (e.g. pain channel at Q <= -25) |
| forceVision {description} | force | narrative; may open a thread |
| hazardOccurred {type, severityHint 1-3} | health | damage by health rules |
| healingReceived {source, healerRef?} | health | source available |
| emotionalEvent {type, intensity 1-3, cause} | progression (state of mind) + alignment via selector-driven engine event | |
| moralChoice {direction, weight 1-3, description} | alignment | weight 3 dark + explicit player confirmation for a turn |
| promotionProposed {rank, grantedByRef, occasion} | ranks | requirements checked; rejected and logged if unmet |
| milestoneBeatAcknowledged {beatId} | progression | beat pending |

Player-sourced events (UI): stance/tactic at a beat, spare/capture/kill at incapacitation,
turn confirmation, routine edits, pins, review-queue resolution. Engine-sourced events
(emitted by handlers): woundInflicted, levelCrossed, threadEscalated, galaxyEventFired, etc.
They share the same `applyEvents` path.

### Rules
- Events say what happened in the story. They never carry XP, levels, stat values, Vitality,
  wound severities, dates, alignment or dark-pressure values, ranks or roll results.
- References are IDs only (D-13). The context lists every ID the AI may use. New entities
  enter only through npcIntroduced, newLocation and newItem. An unknown ref is first matched
  against exact normalized aliases (case, whitespace, leading titles); there is no fuzzy
  match. If that fails the event is dropped and the name is added to `memory.review`.
- Validation is two steps: Zod, then engine validation. Failures are logged with the reason
  in the transcript and debug console, and dropped. Code never repairs or guesses.
- Narrative events that START something whose outcome needs dice (combatStarted, ambush) are
  resolved after the turn and narrated on the next one. The prompt tells the AI to end the
  narrative at the moment of engagement.

### Legacy tag mapping (ai-contract-legacy.md)
| Legacy tag / scan | v2 | Note |
|---|---|---|
| SHEET JSON | dropped | code owns the character |
| WORLD JSON | dropped; location -> locationChanged, sceneNPCs -> scene | |
| Choices A-E / Custom | `choices[]` with pre-classified intents | free text stays the normal input |
| Pre-roll reply, NO_ROLL_NEEDED | intent call `checks` | |
| ROLL:, ROLL_OPPOSED:, ROLL_LABEL= | intent `checks`, engine rolls | |
| TIER_GAP= | dropped | rolls.md has no tier gap |
| TACTICAL= | tacticDeclared / intent.tactic | |
| COMBAT_START: | combatStarted | |
| COMBAT_ROUND: | dropped | engine counts exchanges |
| COMBAT_END: | combatEnded (non-wound endings); fate chosen by player at incapacitation | |
| TRAINING: | activityPerformed | XP by computeXp |
| COMBAT: | dropped | combat XP from the duel log |
| PROFICIENCY: | dropped | sub-abilities are skills with synergy |
| LOCATION= | locationChanged | |
| XP:, XP_<Stat>=, stat sets, `<Ability>=n` | dropped | |
| LIFE_STAGE=, RANK= | promotionProposed | life stage derived |
| MOMENTUM_WINDOW= | dropped | state of mind replaces it |
| WILL_OF_FORCE= | dropped (Q43) | moralChoice light |
| INJURY_ADD= | dropped | wounds from resolution or hazardOccurred |
| INJURY_HEAL=, INJURY_HEAL_ALL, STORY_HEAL= | healingReceived | healing over time by health |
| OPP_INJURY_ADD / HEAL / HEAL_ALL / PERMANENT | dropped | NPC health is engine-owned |
| DOMINANT_HAND= | character creation; engine switch on hand loss | |
| FIGHTING_HAND= | player beat action | |
| PAIN_CHANNEL= | forceUseRequested(painChannel) | gate checked |
| COMBAT_END_CRASH | engine rule (Q41) | |
| NPC_LIFECYCLE= | npcStatusChanged | |
| RECURRING_RETURN= | dropped | NPC growth from elapsed time |
| HP=, FORCE/PHYSICAL/MENTAL_STRAIN=, FORCE_BARRIER= | dropped | health engine |
| SHATTERPOINT_PERCEIVED / ROLL / FOCUS / FOCUS_CLEAR / XP / MISREAD_RESOLVED | forceUseRequested(shatterpoint); misread from a negative margin | focus/tunnel vision dropped (Q21) |
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
| "Time Elapsed:" prose, "It is now Day N" | timeElapsed | clock clamps |
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
  ├─ clicked choice ──────────> intent already attached to the choice (validated when the
  │                              choice was received) -> skip a.
  └─ combat beat button ──────> structured player event -> skip a.
b. RESOLVE (engine): rolls, contests, duel exchanges up to the next beat, montage / skip day
   loop. Output: a frozen TurnDraft {intent, resolved results, rng state after, report}.
c. NARRATE call (Flash): prompt sections + context + TurnDraft -> full response schema.
d. VALIDATE events -> applyEvents -> COMMIT (state + transcript entry in one IndexedDB
   transaction) -> RENDER.
   After commit: if the chapter closed, run the summary call (light model).
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
`{chapterSummary, arcSummary}`. If it fails, the chapter is `summaryPending` and is retried at
the next close; its raw turns stay in the transcript. Boundaries are turn IDs, not array
slices, so turns played meanwhile are never lost (legacy story-memory bug 1).

### Retrieval (`src/memory/`)
- Inputs: scene NPCs, current location, entities referenced in the intent, open threads.
- Score = tag overlap (weighted per kind) + recency decay + open-thread bonus.
- Each section fills up to its cap in score order. Pinned facts are always included: the
  character's master and apprentices, open promises and debts, lasting injuries, player pins.
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

---

## 9. Advancing time

- Montage and timeSkip advance day by day through the engine (`state/advanceTime`).
- Each day: run the routine's blocks in 30-minute steps (fatigue and XP via progression and
  health) -> run onTimeAdvanced hooks (section 10 order) -> advance threads (deadlines,
  rumors, rival progress) -> roll weighted events (location, threads, NPCs, galaxy).
- A significant event interrupts: the loop stops at that day, pacing switches to moment, and
  the partial report is returned.
- Relationship drift continues during jumps (training partners and teachers gain from shared
  sessions; others drift slowly toward neutral).
- The AI receives the report (training-routines sec 8) and narrates it; it invents no stat
  outcomes.
- The legacy training simulator is the montage activity type; routines feed it.

---

## 10. Clock

- One clock feature is the only writer of `clock.now`. Dates are integers (absolute day +
  minute), never strings (D-23). Display formats BBY/ABY with the 12-month / 368-day calendar.
- `timeElapsed` events are checked against the current pacing level's range and clamped with
  a logged reason.
- Every time-based feature registers `onTimeAdvanced(slice, days, ctx)`. The clock calls the
  hooks in this fixed order (registry order, documented and tested):
  1. health (healing, meter recovery, dying timer)
  2. progression (rust, bank release, state-of-mind easing, willpower reset)
  3. alignment (drift, pressure decay, notice rolls)
  4. npcs and relationships (drift; NPC levels are derived from date, so aging is free)
  5. threads (deadlines, escalation)
  6. ranks (selection rolls, trial eligibility, milestones)
  7. world (scheduled timeline events, faction state)
  8. weighted event rolls -> interruption check
- Sub-day advances (moment and scene) call the minute-level hooks (meters, Vitality, dying
  timer); midnight crossings run the day hooks.
- Required tests: multi-month skips; month and year rollover in the 368-day calendar,
  including 1 BBY -> 1 ABY; a birthday during a skip (age derived, notice in the report); an
  interruption mid-skip (state equals the state at the interruption day); the hook order is
  fixed.

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
- One registry (`src/state/registry.ts`) lists all features in hook order.
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
- **XP unit** = effective practice hours. Fatigue, challenge factor, drill ceiling, combat
  integration and willpower follow progression-numbers.md exactly.
- **Activity weights** are normalized to sum to 1 and split XP (0.75 main / 0.25 secondary
  share). Never additive. Synergy spillover is the only extra XP and is capped at 25%.
- **Speed multiplier M** (D-21, spec kept): talent (1.0-1.8) x cross-talent (1.0-1.1) x
  instruction (0.90-1.23: solo 0.90, partner 0.95-1.00, teacher factor up to 1.15 plus
  aptitude +/-0.05 and bond +0.03) x age (0.75-1.25 by category) x state of mind (0.80-1.30)
  x alignment (0.6-1.3 by ability side), capped at 2.8. Focus comes from hours and weights,
  not M. Combat experience comes from combat XP, E and CI, not M. Total pace is capped at
  4.0x the Average profile (banked releases excluded) and checked by test.
- **One function**, `computeXp(session)`, serves every source: story turn activities,
  montage and skip days, missions, combat (combat-xp.md through the same function). Outcomes
  are rolled by code (mean 1.0). Breakthroughs are the 4% x1.75 outcome, logged.
- **No skill-tier gates** (D-20). Lightsaber forms are gated by the drill ceiling (25 + E),
  combat Force abilities by combat integration, and teaching by the teacher factor. Physical
  stats and non-combat Force abilities have no gates. Crossing 21, 41, 61, 81 or 101 adds a
  `tierBeatsPending` entry; the next scene acknowledges it (a master's recognition, Temple
  reputation) and a fact record is written. It never holds back XP or levels.
- **Ranks** (Knight, Master, Council) are story-granted with skill minimums (ranks.md); the AI
  can only propose.
- **Physical performance** = min(trained level, species body cap for age) + Force boost
  (grows with Force Control and body abilities). The boost offsets decline so effective
  performance can peak in the 60s, but age wins eventually. Force, knowledge and technique
  skills are not age-capped.
- **Lifetime test**: the four profiles run 70 in-game years through `advanceTime` with real
  routines and scripted combat events. Fails if any milestone is outside +/-20% of its
  target, if any profile beats the max (Anakin) profile's pace, or if any pace exceeds 4.0x.

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
- **Lifetime test** (section 12) runs in `npm test`.
- `npm test`, `npm run typecheck` and `npm run lint` must pass before any task is done.

---

## 15. Build order

These milestones replace the prompt pack's Phases 3-8 (D-28). Each milestone is its own
session: plan mode first, then build. The pack prompts and the specs are checklists for the
matching milestone. Each milestone ends **playable locally (`npm run dev`), tested and
committed** on the `rebuild` branch. Nothing deploys to GitHub Pages until the Phase 9
cutover; the deploy workflow keeps its main-only trigger.

The clock and the module contract come first, before any feature.

| # | Milestone | Contents | Playable as |
|---|---|---|---|
| M1 | Core and talk to the GM | Scaffold (Vite, TS strict, Vitest, Zod, ESLint); rng; calendar math; FeatureModule, registry, applyEvents; clock and advanceTime (hook order, tests); pacing (moment, scene); provider, gemini and fixture adapters; settings and API key; minimal character (name, birth date, start date); two-step pipeline with the choice fast path; transcript and autosave; usage meter | Free story with a working clock |
| M2 | Memory and lore | npcs (identity), locations, threads, facts, relationships; People tab and review queue; chapters and arc; context builder with caps and report; lore index and retrieval; export/import | Long campaigns that remember |
| M3 | Progression and creation | Skills, curve, fatigue meters, computeXp, synergy, rust, state of mind, activityPerformed, computed character creation, sheet UI, tier beats | Train in story and grow |
| M4 | Time advance | Montage and timeSkip, routine scheduler, settling-in and staleness, thread deadlines, weighted events, interruptions, lifetime test (scripted combat via combat-xp.md math) | Skip months and years |
| M5 | Combat and health | Rolls, duels and beats, Vitality, wounds, healing, NPC generation (closed form), minions, combat XP from the duel log; lifetime test re-run | Fight |
| M6 | Force and alignment | Catalog data, Force meter, Force use, combat integration, Shatterpoint, alignment, dark pressure, concealment | Use the Force |
| M7 | Ranks and milestones | Ladders, trials, standing, Order requirements, Council of Reassignment | Advance in the Order |
| M8 | World | Timeline events, factions, renown, equipment spec and items/credits, species table | A living galaxy |
| M9 | Polish | Save slots UI, migrations hardening, responsive layout (iPad first), debug console | Release candidate (Phase 9 cutover) |

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

Still open (to settle in the named milestone):
- M1: the current recommended Gemini Flash and Flash-Lite model names and free-tier limits.
- M3: species body-cap tables beyond Human (species spec).
- M8: the equipment spec (prices, credits economy, lightsaber properties).
