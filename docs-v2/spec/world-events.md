# World events: the tag network (as built, M8)

Design: m8-design-notes.md, "World events: the tag network and divergence". Event data: world-event-tags-draft.md (3661–3640 BBY), world-event-tags-1000BBY-4ABY-draft.md. Decisions: D-466 (the engine), D-467 (Jared's answers; the 3661–3640 data). D-490 to D-492 (D-489's rules: who, the power bar, no premonitions, closed systems). The 5000–3662, 3640–1000, 1000 BBY–4 ABY and 4–44 ABY maps are not shipped.

Code: `src/data/worldNetwork.ts` (types, the shipped network), `worldNetwork3661.ts` (3661–3640), `canonDeathLinks.ts` (recorded deaths), `worldNetwork.config.ts` (numbers, all `invented`), `who.ts`, `worldPosts.ts`, `duelists.ts` (the gates and the power bar), `src/engine/who.ts`, `src/engine/powerBar.ts`, `src/features/world/player.ts`, `src/features/world/` (`network.ts` rules, `networkSchema.ts` data checks, `handoff.ts` narrator summary, `selectors.ts`), `src/engine/datedFacts.ts` (the freeze). Tests: `tests/features/worldNetwork.test.ts`, `tests/features/worldGates.test.ts`, `tests/turn/worldNetworkTurn.test.ts`, `tests/m8/`.

## 1. The data

| Part | Holds |
|---|---|
| Event (`E.<year>.<name>`) | title, one-line summary, date (end date for campaigns and occupations), places, roles, conditions, consumed and produced outcomes, plot point, whether it is closed, whether it stops a montage, its timeline row |
| Role | replaceable or crucial; the canon figure; who can stand in; protagonist (always an NPC); closed (out of every player's reach) |
| Condition | what must hold, what the narrator may say once broken, crucial or not, guard, who the player must be, the tests that count (each can be only during the event), optional prerequisites (foreknowledge) and window (only while under way, or from a year) |
| Consumed outcome | required, or optional (the event goes ahead adjusted) |
| Produced outcome (`O.<name>`) | produced unless the event diverges; or by its own rule (`when`: tags intact or broken), which also applies to an altered event; at the event's start or end |
| Scene | a scene outcome the engine records as the flag `sceneOutcome:<id>`: a rolled success against its guard's DC, or a won fight, while its event is open, its years hold, the player fits its "who" and what it requires holds |
| Plot point (`PP-<n>`) | its events, when it applies, the tracker, the authored alternatives (requirement, criteria with weights, effects) |

`networkProblems()` must return nothing before a network ships: unknown references, an outcome produced twice, a loop, a flag the AI may set, an action or fight test with no place or person, a place-only action with no lead, a high guard an action can break without foreknowledge, a very high guard without two distinct prerequisites, a scene flag no scene sets, an outcome that depends on a replaceable role, an alternative that produces an outcome of the recorded timeline, a condition or scene the player can affect with no "who", an empty gate, a gate on a flag the AI may set, Force sense in a test, a step inside a closed event, a hold against someone who is no top duelist.

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

**Leads (D-468).** An investigation or foreknowledge action counts only when it starts from a lead recorded in play: a discovery fact, a figure met, or a site found. A player's out-of-game knowledge never counts, and an action with no recorded lead scores nothing. In the data, a place-only action test names its leads: figures (met, or with a fact or thread recorded about them), places (a fact or thread recorded about them; being there is not a lead), sites visited, or recorded facts. An action on a person starts from meeting them; one after foreknowledge starts from what is known. Found items join once items are built. A fact or thread counts only when it was learned in a scene and points to a place or a person (D-470): backstory and a start option's threads do not (until play takes the thread up), and one that repeats most of the significant words of what is to come (the event's title or summary, or the condition itself) states the secret and does not (60%, `invented`). The data checks refuse a place-only action test with no lead.

Tests match who and where, and the kind of action, not what was said. An accidental break of a low or medium condition is fine: it is still the player's doing.

Broken is final. Nothing removes a broken tag or turns a broken outcome back.

### Who, the power bar, premonitions, closed systems (D-489; D-491)

**Who.** A condition, prerequisite or scene says who the player must be: a list of entries, any one of which opens it, every part of an entry holding. Parts: side, archetype, rank (Padawan / Knight or Lord / Master, or a Lord with a Master's strength), standing, trust of a named figure, a post (posting, crew, household), a place they are in now, fighting tier, an engine-only flag (proof carried out of a scene). A deed, a won fight or a figure taken counts only when the player fits; what the world does (outcomes, control, scene flags, foreknowledge already had) is not gated. A prerequisite without its own "who" takes the condition's. The narrator sets none of it:
- **Trust:** relationship 40 or more with a figure known 30 days or more (`invented`), or the master's or apprentice's bond.
- **Posts** (`worldPosts.ts`): held by a start option, by trust (or the bond) of the figure whose people these are, or by the engine-only flag `worldPost:<id>`. Nothing sets the flag until wartime postings are built, so a post with neither a start nor a tie cannot be held yet.
- **Belief test:** a Knight's standing, or physical proof (a scene's flag).

**The power bar** (`duelists.ts`: Jared's lists by map). Top duelist: below Master the player cannot win; a Master holds them off briefly; the top tier beats them or holds long. Apex duelist (Yoda, Sidious, Bane; D-494, D-496): only another apex wins; the top tier holds them off briefly. Beyond any duelist: nobody wins. "At least a Master": Grievous, Baras. The bar is on the person and holds in the fight itself (real fights only, not spars): a fighter above it is never killed, put down, maimed or driven to surrender. A blow that would do it lands as a lighter wound, they break off, and the fight is a stalemate, not a win. So no role breaks, no fate choice opens and nothing is credited. Guarded figures (Angral, Baras, Azamin) are treated the same when the player is not placed to reach them.
- **The player's tier** (`invented`): Master = the rank, a Council seat, or every skill of the Master row with combat (best form, melee or blaster) in place of the main specialty; top = a Master with combat 88, Force Control 85 and Willpower 90; apex = 98, 110 and 105 (Jared, D-495).
- **Without the Force** (D-493): in an outright fight nobody reaches Master against a top duelist, however skilled, and never the top tier. A bounty hunter or Mandalorian whose strongest fighting skill is 90 or more (`invented`) can reach it for a hold only, with a plan recorded in play: two different kinds (ambush, trap, prepared ground) laid against that figure, at that place, in the last 3 days (all `invented`). Each is the player's own act (`plan` in the intent), a check the engine rolls at DC 17 with the better of two skills (ambush: stealth or tracking; trap: tactics or investigation; ground: tactics or tracking), once a day each, recorded as a line (`planTried`, engine only; `combat.plans`). The narrator records none of it. A plan is lost when the foe strikes first, and spent by the fight it was for. Gear suited to the foe is a fourth kind once equipment is built. It buys time, never a win, and does not raise the tier a gate reads.
- **A hold** (holds.md, D-496): a fight against a top or apex duelist, not won, that bought the time whoever flees needs at that place (exchanges lasted x their worth by the ability gap). About half of regular Masters manage the shortest one. Brief one tier below the duelist (a Master or a planned hunter against a top duelist, the top tier against an apex), long at their own tier. It is recorded with the fight; a test can ask for one (`hold`). It is never a win and moves no date.
- **Credit:** only foes the player fought. One an ally fought is never credited, finished or not; a named foe who fled or withdrew was not beaten.

**No premonitions.** A roll on Force sense never counts, whatever a test asks for. A fact or thread that came from a vision is no lead: the narrator marks it (`vision`), or its words give it away (a word list, `invented`). Both can only take a lead away. Danger sense stays a warning (blockades.md).

**Closed events.** No step inside exists: no deed, fight, hold or capture counts, no scene belongs to it, and a figure lost once it has begun changes nothing. It still reads its inputs, and a crucial figure lost before it began still breaks it.

**During.** A test marked so counts only while the event is under way (the battle itself); the foreknowledge for it can be learned before.

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
