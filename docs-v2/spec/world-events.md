# World events: the tag network (as built, M8)

Design: m8-design-notes.md, "World events: the tag network and divergence". Event data: world-event-tags-draft.md (3661–3640 BBY), world-event-tags-1000BBY-4ABY-draft.md. Decision: D-466. Phase A is the engine with no era data; Phase B adds 3661–3640.

Code: `src/data/worldNetwork.ts` (types, the shipped network), `worldNetwork.config.ts` (numbers, all `invented`), `src/features/world/` (`network.ts` rules, `networkSchema.ts` data checks, `handoff.ts` narrator summary, `selectors.ts`), `src/engine/datedFacts.ts` (the freeze). Tests: `tests/features/worldNetwork.test.ts`, `tests/turn/worldNetworkTurn.test.ts`.

## 1. The data

| Part | Holds |
|---|---|
| Event (`E.<year>.<name>`) | title, one-line summary, date (end date for campaigns and occupations), places, roles, conditions, consumed and produced outcomes, plot point, whether it stops a montage, its timeline row |
| Role | replaceable or crucial; the canon figure; who can stand in; protagonist (always an NPC) |
| Condition | what must hold, what the narrator may say once broken, crucial or not, guard, the tests that count, an optional prerequisite and window (only while under way, or from a year) |
| Consumed outcome | required, or optional (the event goes ahead adjusted) |
| Produced outcome (`O.<name>`) | produced unless the event diverges; or by its own rule (`when`: tags intact or broken), which also applies to an altered event; at the event's start or end |
| Plot point (`PP-<n>`) | its events, when it applies, the tracker, the authored alternatives (requirement, criteria with weights, effects) |

`networkProblems()` must return nothing before a network ships: unknown references, an outcome produced twice, a loop, a flag the AI may set, an action or fight test with no place or person, a high guard an action can break without foreknowledge, an outcome that depends on a replaceable role, an alternative that produces an outcome of the recorded timeline.

Dates known only to the year fall on the first day of that year, as the control table reads them. A month or day the lore does not give is marked `placed: 'invented'`.

## 2. What breaks a tag

Only recorded game state, never narration:
- a canon figure met in this campaign whom the engine recorded as dead (D-33) or captured (the player's fate choice). A capture, turn or removal the narrator reports (`npcCanonDiverged`) does not count;
- who holds a place (`locationControlChanged`, engine only, or an alternative's effect);
- a registered flag no AI source may set (`sceneOutcome:<id>`, engine only);
- another outcome, produced or broken;
- a player action whose check the engine rolled (`worldActionRecorded`, from the turn's resolve step). The scene's own roll is measured against the guard; no new dice;
- a fight the player won, at a stated place or against a stated person.

A role breaks when its figure is dead or captured. A condition breaks when its points reach its guard:

| Guard | An action is measured against | Points needed |
|---|---|---|
| low | DC 15 (moderate) | 1 |
| medium | DC 17 (hard) | 3 |
| high | DC 19 (extreme) | 6, and foreknowledge first |

Points: an exceptional success 3, strong or decisive 2, narrow or clear 1, a bad failure -1 (never below 0); one counted action per condition per day. A recorded fact or won fight: minor 1, major 3, decisive 6, counted once. A prerequisite learned by an action is measured against the medium guard's DC. Every number is `invented`.

Broken is final. Nothing removes a broken tag or turns a broken outcome back.

## 3. Settling an event

Each time step brings the network up to date (`reviewNetwork`). Due events settle in date order, producers before consumers; a divergence is decided on the event's date, not when the tag breaks.

| State | Result |
|---|---|
| Nothing broken | `recorded` |
| A replaceable role lost | `substituted`: a canon figure of the same side and role, the same title first, then nearest in age; then a known NPC; else "another of similar standing". Never anyone in the event, or anyone an unsettled event cannot do without |
| An optional input or minor condition broken, or a plot point has turned | `adjusted`: it still fires |
| A crucial role or condition broken | `altered` (or `cancelled` where the tag says so) |
| A required input broken | `cancelled` (or `altered`) |
| A required input not settled yet | `waiting` |
| Between start and end dates | `underway`; a crucial tag broken then alters it, and undoes what it had produced at its start |

What happened before the campaign is `standing`, as recorded. Data added to a running campaign's past also stands.

## 4. The freeze

Control, leader and seat rows can carry `dependsOn` (outcomes that must be produced before it starts) and `endsWith` (the outcome that ends it). In a campaign, a row whose outcome is broken does not start, and the one in force before it holds, until a later row that depends on nothing broken. A row whose `endsWith` never comes outlasts its recorded end. Inside a year, the change waits for its event. A place changed in play holds until an event settled after it decides otherwise. Rows without links read exactly as before. Phase B adds the links.

## 5. Plot points and convergence

Nothing is chosen until the tracker holds. Then every alternative whose requirement holds is scored (its base plus the weights of the criteria that hold now); the best wins, the first listed on a tie, once and for good. Effects: new outcomes of its own, outcomes ruled out, events moved, places changed.

Convergence is only this: an event whose crucial tags were never touched still fires, `adjusted`.

## 6. The narrator hand-off

The STATE block gets two lines when there is something to say: the news (each with a heading for how it reads: happens as recorded, in other hands, adjusted, differently, does not happen; broken conditions; a plot point's turn with its authored heading and parameters), told once, at most 10 a turn; and the standing list of history that changed, which voids the LORE on it. Future events and tags that still hold are never sent. A montage stops on an event marked `interrupts` and on a plot point's turn.

## 7. The save

World slice v2: `network` {cursorDay, events, tags, progress, outcomes, plotPoints, shifts, control}. A v1 save opens the network at its own date.
