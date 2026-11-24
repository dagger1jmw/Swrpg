# Flag registry (v1)

Decision D-33 (2026-11-16, Fable review row 8). Flags are the only boolean story state. Each
flag is registered in `src/data/flags.ts` with its allowed sources; `flagSet` from any other
source is rejected and logged. The registry test checks that every flag a spec reads is
listed here and that no rank-gating flag allows the `ai` source.

## 1. Sources
- **engine**: set by a feature handler from validated, resolved state (a fight outcome, a
  trial result, a check). Never from AI text alone.
- **player**: set by an explicit player action in the UI (creation choices, confirmations).
- **ai**: the narrative reply may set it with `flagSet`. Only flags with no mechanical effect
  on ranks, standing, alignment, health or death may allow `ai`.

The AI may only *propose* events that the engine evaluates (promotionProposed, moralChoice,
emotionalEvent). It never sets a flag that gates a rank, standing, a trial, redemption or a
death.

## 2. Rank-gating flags (engine or player only)
| Flag | Sources | Set when | Read by |
|---|---|---|---|
| masterApproval | engine | the ranks day hook evaluates the master's approval monthly: Padawan for 10+ years (D-426; 6 before), age 18+, relationship with the master >= +40 (friend), and all Knight skill minimums met | Knight Trials eligibility (ranks.md §1) |
| heroicAct:<id> | engine | a resolved lethal fight is won against an opponent 10+ levels stronger in the opposed skill, or against an NPC whose rank is Sith Lord or higher | Wartime Courage and Flesh credit; Council bypass |
| trialPassed:<trialId>, trialFailed:<trialId> | engine | a trial scene's checks resolve (ranks.md §1) | Knight eligibility, retakes, third-failure choice |
| initiateTrialsPassed | engine | the Initiate Trial checks resolve | Padawan selection window |
| deed:<id> | engine | a registered deed condition resolves (tournament placing from resolved duels, a mission thread resolved with its stakes met, a demonstration check passed) | standing S (ranks.md §1, 30% deeds) |
| redemptionTurningPoint | engine or player | engine: a Force vision or confrontation scene's check resolves; player: the player confirms the turning-point choice in the UI | redemption past Consumed (alignment.md §7) |
| turnConfirmed | player | the willing-turn confirmation (alignment.md §5) | alignment |
| councilBypassGranted | engine | the Council bypass story event (section 3) fires | Knight promotion without trials |

## 3. Council bypass (engine-run story event)
The ranks day hook checks once per in-game month. The bypass fires when ALL hold:
- wartime (the world feature's war state for the character's faction is active);
- at least one heroicAct flag;
- standing S >= 75;
- age 18+ and rank Padawan;
- all Knight skill minimums met (ranks.md §1).
Firing sets councilBypassGranted, opens a story thread ("The Council summons you") and queues
a promotion the player plays as a scene. The AI narrates; it cannot trigger it.

## 4. Other engine flags
| Flag | Sources | Set when | Read by |
|---|---|---|---|
| breakingPoint | engine | dark pressure D reaches 90 (Q45, alignment.md §6a) | context: the AI builds a scene around it; nothing resets automatically |
| forbiddenAccess:<abilityId> | engine | a registered Sith text item is gained, or a teacher who knows the ability is the character's teacher (Q27) | learning forbidden abilities |
| staleness | engine | the pacing day hook (architecture §8) | choices must include a forward jump |
| settlingIn | engine | arrival at a new major location or life stage (architecture §8) | pacing |
| sceneOutcome:<id> | engine | a world-event scene's check or fight resolves (src/data/worldNetwork3661.ts scenes; D-466, D-467) | world-event conditions (world-events.md) |

## 5. Player background flags (set at creation)
| Flag | Sources | Read by |
|---|---|---|
| homeworld:<locId> | player | backstory facts, context |
| warYears:<n> | player | character creation E/CI, closed form |
| family:<kind> | player | backstory facts |

## 6. Story flags (ai allowed)
Narrative-only markers with no mechanical effect, used to gate story content and to remind
the AI (examples: metCouncil, visitedArchives, knowsSecret:<threadId>). Each is registered
with `sources: [ai, engine]`. Adding a story flag never changes a number; if a later spec
makes one gate a mechanic, it must move to section 2 or 4 and drop `ai`.

## 7. Required tests
1. Every flag read by a spec or feature is registered.
2. `flagSet` from a source not listed for that flag is rejected and logged.
3. No flag in sections 2 and 4 lists `ai`.
4. The Council bypass fires only when every condition in section 3 holds (seeded months).
5. masterApproval and heroicAct are set only by their engine conditions.
