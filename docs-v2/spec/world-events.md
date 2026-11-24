# World events: the tag network (as built, M8)

Design: m8-design-notes.md, "World events: the tag network and divergence". Event data: world-event-tags-draft.md (3661–3640 BBY), world-event-tags-1000BBY-4ABY-draft.md. Decisions: D-466 (the engine), D-467 (Jared's answers; the 3661–3640 data). The 3640–1000 and 1000 BBY–4 ABY maps are not shipped.

Code: `src/data/worldNetwork.ts` (types, the shipped network), `worldNetwork3661.ts` (3661–3640), `canonDeathLinks.ts` (recorded deaths), `worldNetwork.config.ts` (numbers, all `invented`), `src/features/world/` (`network.ts` rules, `networkSchema.ts` data checks, `handoff.ts` narrator summary, `selectors.ts`), `src/engine/datedFacts.ts` (the freeze). Tests: `tests/features/worldNetwork.test.ts`, `tests/turn/worldNetworkTurn.test.ts`, `tests/m8/`.

## 1. The data

| Part | Holds |
|---|---|
| Event (`E.<year>.<name>`) | title, one-line summary, date (end date for campaigns and occupations), places, roles, conditions, consumed and produced outcomes, plot point, whether it stops a montage, its timeline row |
| Role | replaceable or crucial; the canon figure; who can stand in; protagonist (always an NPC) |
| Condition | what must hold, what the narrator may say once broken, crucial or not, guard, the tests that count, optional prerequisites (foreknowledge) and window (only while under way, or from a year) |
| Consumed outcome | required, or optional (the event goes ahead adjusted) |
| Produced outcome (`O.<name>`) | produced unless the event diverges; or by its own rule (`when`: tags intact or broken), which also applies to an altered event; at the event's start or end |
| Scene | a scene outcome the engine records as the flag `sceneOutcome:<id>`: a rolled success against its guard's DC, or a won fight, while its event is open, its years hold and what it requires holds |
| Plot point (`PP-<n>`) | its events, when it applies, the tracker, the authored alternatives (requirement, criteria with weights, effects) |

`networkProblems()` must return nothing before a network ships: unknown references, an outcome produced twice, a loop, a flag the AI may set, an action or fight test with no place or person, a place-only action with no lead, a high guard an action can break without foreknowledge, a very high guard without two distinct prerequisites, a scene flag no scene sets, an outcome that depends on a replaceable role, an alternative that produces an outcome of the recorded timeline.

Dates known only to the year fall on the first day of that year, as the control table reads them. A month or day the lore does not give is marked `placed: 'invented'`.

## 2. What breaks a tag

Only recorded game state, never narration:
- a canon figure met in this campaign whom the engine recorded as dead (D-33) or captured (the player's fate choice). A capture, turn or removal the narrator reports (`npcCanonDiverged`) does not count;
- who holds a place (`locationControlChanged`, engine only, or an alternative's effect);
- a registered flag no AI source may set (`sceneOutcome:<id>`, engine only, set by a scene);
- foreknowledge the player has of another condition;
- another outcome, produced or broken;
- a player action whose check the engine rolled (`worldActionRecorded`, from the turn's resolve step). The scene's own roll is measured against the guard; no new dice;
- a fight the player won, at a stated place or against a stated person.

A role breaks when its figure is dead or captured. A condition breaks when its points reach its guard:

| Guard | An action is measured against | Points needed |
|---|---|---|
| low | DC 15 (moderate) | 1 |
| medium | DC 17 (hard) | 3 |
| high | DC 19 (extreme) | 6, and one prerequisite first |
| very high | DC 21 | 10, and two distinct prerequisites first; one decisive fact is never enough |

Points: an exceptional success 3, strong or decisive 2, narrow or clear 1, a bad failure -1 (never below 0); one counted action per condition per day. A recorded fact or won fight: minor 1, major 3, decisive 6, counted once. A prerequisite (foreknowledge) is its own step at a medium guard: 3 points at DC 17 from actions and won fights, or one recorded discovery fact (any state test). Once met it stays met. Every number is `invented`; low, medium and high are accepted for now (D-467 [1]).

**Leads (D-468).** An investigation or foreknowledge action counts only when it starts from a lead recorded in play: a discovery fact, a figure met, or a site found. A player's out-of-game knowledge never counts, and an action with no recorded lead scores nothing. In the data, a place-only action test names its leads: figures (met, or with a fact or thread recorded about them), places (a fact or thread recorded about them; being there is not a lead), sites visited, or recorded facts. An action on a person starts from meeting them; one after foreknowledge starts from what is known. Found items join once items are built. The data checks refuse a place-only action test with no lead.

Tests match who and where, and the kind of action, not what was said. An accidental break of a low or medium condition is fine: it is still the player's doing.

Broken is final. Nothing removes a broken tag or turns a broken outcome back.

## 3. Settling an event

Each time step brings the network up to date (`reviewNetwork`). Due events settle in date order, producers before consumers; a divergence is decided on the event's date, not when the tag breaks.

| State | Result |
|---|---|
| Nothing broken | `recorded` |
| A replaceable role lost | `substituted`: a canon figure of the same side and role, the same title first, then nearest in age; then a known NPC; else "another of similar standing". Never anyone in the event, or anyone an unsettled event cannot do without |
| An optional input or minor condition broken, an input off the record come about, or a plot point has turned | `adjusted`: it still fires |
| A crucial role or condition broken | `altered` (or `cancelled` where the tag says so) |
| A required input broken | `cancelled` (or `altered`) |
| A required input not settled yet | `waiting` |
| Between start and end dates | `underway`; a crucial tag broken then alters it, and undoes what it had produced at its start |

What happened before the campaign is `standing`, as recorded. Data added to a running campaign's past also stands.

## 4. The freeze

Control, leader and seat rows can carry `dependsOn` (outcomes that must be produced before it starts) and `endsWith` (the outcome that ends it). In a campaign, a row whose outcome is broken does not start, and the one in force before it holds, until a later row that depends on nothing broken. A row whose `endsWith` never comes outlasts its recorded end. Inside a year, the change waits for its event. A place changed in play holds until an event settled after it decides otherwise. Rows without links read exactly as before.

**Recorded deaths** (`canonDeathLinks.ts`): a death an event causes stands only when its outcome came about. If the event diverged, the figure lives on and keeps what they held. Any other death happens on its date. A linked NPC who outlives the record keeps their levels and rank.

An outcome can also carry a change of control (Korriban taken), applied when it is produced.

## 5. Plot points and convergence

Nothing is chosen until the tracker holds. Then every alternative whose requirement holds is scored (its base plus the weights of the criteria that hold now); the best wins, the first listed on a tie, once and for good. Effects: new outcomes of its own, outcomes ruled out, events moved, places changed.

Convergence is only this: an event whose crucial tags were never touched still fires, `adjusted`.

## 6. The narrator hand-off

The STATE block gets two lines when there is something to say: the news (each with a heading for how it reads: happens as recorded, in other hands, adjusted, differently, does not happen; conditions the player broke; a plot point's turn with its authored heading and parameters), told once, at most 10 a turn; and the standing list of history that changed, which voids the LORE on it. Future events and tags that still hold are never sent. A lost crucial figure, and a condition broken only by an earlier event's outcome, are told with their own event on its date (D-467 [7]). A montage stops on an event marked `interrupts` and on a plot point's turn.

## 7. The save

World slice v2: `network` {cursorDay, events, tags, progress, outcomes, plotPoints, shifts, control}. A v1 save opens the network at its own date.
