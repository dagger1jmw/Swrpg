# Missions (v1)

Jared, 27 Nov 2026 (m9-missions B; revised ~1:45 a.m.: total-war postings). Extends [duty.md](duty.md) (the daily roll, the injury check, all hands, skips and home days stay as written there). Decisions: D-548 to D-553. Report: docs-v2/reports/m9-missions.md. **Every number here is invented, to tune**; the list is in section 12.

**Amended by m9-release Part A (27 Nov 2026; D-554 to D-558; report docs-v2/reports/m9-release.md):** the narrator's choices and fights during a stage (section 4), all travel the code's (section 5), days off on a front, leave from the war's first posting and the forward base's medics (sections 6 and 8), the Council's best on a field path (section 9), leads found in play (section 11), the type weights by archetype, the ratings 10 lower, a Master's field experience, and only reachable worlds (sections 2-4), the Great Sith War and the Jedi Civil War total (section 6).

Missions are where most turns go. A mission is code-owned and multi-turn: the code builds it, decides each stage, moves the character on its travel and ends it; the narrator tells it.

Code:
- Data: `src/data/missions.config.ts` (the approaches, the mission types and their stages, the stage rules, complication stages, wounds, standing, the Council's best, chains, postings, the fronts, the worlds), `src/data/wars.ts` (each war's intensity).
- Feature: `src/features/duty/` (`duty.ts` the slice v2: the mission record, the posting, leave, the record of missions; `missions.ts` the pure rules; `index.ts` the events and the day hook; `selectors.ts` the card, the narrator's lines; `home.ts` the base while posted, the current world).
- Turn: `src/turn/missionTurn.ts` (a stage's attempt, the after-turn step, the mission's choices), wired in `turn/resolve.ts` (the attempt before the intent's other work; the after-turn step in every turn's `finish`) and `turn/pipeline.ts` (the code's choices first; a choice's approach).
- UI: `src/ui/missionCard.ts` (the mission and posting card, on the Character tab above the health card).
- Dev: `/mission start [type] [world]`, `/mission end [success|failure|cutShort]`, `/allhands on|off`, `/home`.
- Tests: `tests/m9/missions.test.ts` (with the scripted mission through the pipeline), `tests/m9/partA.test.ts`, `tests/opt2/duty.test.ts`. Tests also in `tests/m9/release.test.ts` (m9-release A). Measurement: `npm run missions` (`tests/missions/`, parallel shards; m9-release A16) and the report-only lifetime comparison `npm run lifegap` (`tests/lifegap/`, A15); the mid-mission save fixture from `tests/measure/saveFixture.measure.ts`.

## 1. The mission record (B1)

In the duty slice (v2), set only by engine events:
- type, title, objective, target world (and a place there, not yet used), the base it was launched from and comes home to, deadline (escort 21 days, rescue 14), stages and the current stage, complications, outcome, the assignment day, the story thread (a follow-up continues it), the party (the master or Padawan, allies), the chain it belongs to.
- **phase:** outbound (travelling to the target), onSite (the stages), return (the work done or failed, coming home).
- Events (all engine-only): `missionAssigned`, `missionArrived` (the target, or a travel stage's world), `missionStageStarted` (a fight or battle begun), `missionStageResolved`, `missionOutcome`, `missionEnded`, `missionChained`. The narrator can send none of them (tested).

## 2. Types and stages (B2)

Data (`MISSION_TYPES`), 2-6 stages each; travel out and back is added around them by the code:

| Type | Stages (kind) |
| --- | --- |
| strike or sabotage | get in (check), reach the target (fight), the job (check), get out (check) |
| front-line engagement | the briefing and the ground (check), the battle (ground battle), hold the position (fight) |
| fleet action | find the enemy fleet (check), the fleet action (ship battle) |
| infiltration | a way in (check), keep the cover (check x2), the objective inside (check), the exit (check) |
| manhunt | pick up the trail (check), follow it to the next world (travel), close in (check x2), capture or kill (fight) |
| investigation | the first lead (check), lead to lead (check x2), uncover the plot (check), the confrontation (fight) |
| escort | plan the route (check), the ambush (fight), the handover (check) |
| rescue | locate them (check), get in (check), free them (fight), get them out (check) |
| recon | the approach (check), watch and count (check x2), get the report back (check) |
| diplomacy | the audience (check), the talks (check x2), the spoiler (check), the accord (check) |

"x2" stages need two successes, so a stage takes several turns; each attempt takes its hours (an hour or two to two days).

**Which type:** by the path's archetype and war (`MISSION_TYPE_WEIGHTS`; m9-release A11: the weights lean toward the path's strengths). A Guardian: in peace escorts, rescues, manhunts and recons, few investigations and little diplomacy; at war the front line and strikes. A Consular: in peace diplomacy and investigation; at war diplomacy, rescues, recons and investigation. A Sentinel: investigation, manhunts and infiltration. A Sith Warrior: the hunt and the front line; an Inquisitor: infiltration and investigation. From a forward base only the types launched there (strike, front-line, fleet action, rescue, recon).

## 3. Where (B4, B5e)

- **Only worlds the character can reach** (m9-release A11, `worldOpen`): open to the character's side that year by the galaxy map's gates, and on the charted routes. Missions, follow-ups, a manhunt's next world, postings, proposals and leads all use this test, so no assignment waits on a trip the travel rules refuse. (Found by the measure: Voss and Quesh in 3,661, Yavin 4, Ilum and Lehon off the routes; each such assignment had failed as "never set out".)
- **From home** in peace or a limited war: a curated list of known worlds (`MISSION_WORLDS`); at war half the time a front of the side's war.
- **From a forward base:** the front's world or a world within 2 grid squares of it.
- A mission on the base's own world starts on site.

## 4. How a stage is decided (B3; the check rule)

The player chooses the approach; the narrator describes it and proposes approaches as choices; the code's result stands.
- **The approach a turn takes** (`approachFor`), in order: the code's own choice (it names the approach); else the intent's skill, when an approach reads that skill (a narrator's choice "Slip past the guards" with Stealth); else the intent's action (investigate, persuade, use the Force; a fight with no one named forces the way through); else none: the turn is story and the stage waits.
- **The narrator's choices during a stage** (m9-release A2): the MISSION line lists each approach with its skill id; every choice either takes one (its intent carries that skillId, so clicking it rolls it) or is pure story that does not attempt the stage. A clicked choice with no approach on it while a check stage waits goes to the intent call, as typed text does, so the same rule maps it ("Infiltrate the maintenance bay" is Stealth: slip in unseen).
- **The narrator never tells a stage's outcome** (A2): not its success, failure or a discovery. A narration check (`stageNarrated`; an invented phrase list: spotted, seen or detected, an alarm, slipping in unseen) catches it on a turn that rolled no stage: one retry, then the sentences are removed. Being spotted is a failed check's complication, the code's.
- **A narrator's fight during a stage** (A2) is refused unless a failed check this turn brought it (a complication). Otherwise forcing the way through is the player's approach.
- **Approaches** (`APPROACHES`), each on one skill: slip in unseen (Stealth), read the scene (Investigation), follow the trail (Tracking), talk your way through (Charisma), fly it (Piloting), plan it like a commander (Tactics), reach out with the Force (Force Sense; Force users only), work the systems (Repair), think it through (Intelligence), climb, run and jump (Agility), hold your nerve (Willpower), force the way through (a fight).
- **A check stage:** the approach's skill (wounds, rust, fatigue as any roll) against the stage's rating (DC = 10 + rating / 10), +10 a complication on it, +20 for an approach that does not fit the stage; +2 for each ally better at the skill (at most +4); +1 field experience for a Master (m9-release A11). The ratings are 15-30 (m9-release A11: 10 lower than m9-missions' 25-40).
- **A fight stage:** a real fight (the combat engine): minions of the era (`enemyKind`: Sith troopers in the Great War, B1s in the Clone Wars, Yuuzhan Vong warriors, thugs in peace), a count drawn from the stage; a master or Padawan on the mission holds half of them. Won: the stage is done. Fled: a complication. Lost: the mission fails.
- **A battle stage:** a ground battle's planning scene (the site is the world; a front-line engagement defends) or a fleet action, opened by the code; the battle engine's result stands (won: done; drawn, lost or stood down: a complication). If the battle cannot be opened, it is fought in the line as a fight.
- **A travel stage:** decided by the travel rules: arriving at its world.
- **Failure brings complications, not the end:** the stage gets harder (+10) and a complication line is recorded; a failure by 5 or more first inserts a complication stage (a fight to get clear after a check, picking the thread up again after a fight). **The mission fails only when the code says so:** a stage failed with 4 complications already on the mission, a fight lost, or a deadline passed.
- **XP** from what was done (the existing sources): a Stealth roll is Stealth in the field; a persuasion with no one named a social line; fights and battles give theirs.

## 5. Travel (B4)

- **Setting out, the next world, coming back** are travel moves by the existing rules (`planTravel`, passage or the character's own ship): game time passes by the route. The code's choices: "Set out for Taris", "Follow it to the next world: travel to Corellia", "Head back to the Jedi Temple".
- **The code moves the character** at the end of every trip (m9-release A12: all travel is the code's; `locationIntroduced` or `locationChanged`, engine). A trip outside a mission ("I fly to Corellia") is the player's travel intent or a travel choice the narrator offers, checked by the travel rules with the time it takes. The narrator's own move to another world (locationChanged, or moveHere on a place named for or under another world) is refused.
- **A trip's time is never clamped** (m9-release A3): the travel rules' hours stand. Past 12 hours it is told as a montage that ends on the morning nearest the arrival (before, a 12-24 h trip was cut to a 12 h scene).
- **Setting out** (m9-release A11): the trip to the target is recorded when it begins (`missionSetOut`), so a long trip (some take 6-9 days) is never "never set out".
- **Arriving back at base ends the mission** (with its outcome; with the work undone it is a failure), unless the Council sends the character on (section 9). A mission never set out for is given to someone else after 7 days (a failure).

## 6. Postings (B5)

- **Each war has an intensity** (data/wars.ts): total for the Great Sith War and the Jedi Civil War (Jared, m9-release A14), the Great Galactic War, the Galactic War, the Clone Wars, the Yuuzhan Vong War and the Ruusan campaign (the Light and Darkness War, 1,010-1,000); limited for the rest. Fronts added for the two: the war against the Krath (Empress Teta, 3,998-3,996, a reading), the defence of Ossus and the assault on Yavin 4 (3,996), the Dantooine front (3,959-3,956, a reading).
- **In a total war** Knights, Masters and Lords, and serving soldiers, officers, pilots, gunners, snipers and Mandalorians, are posted by default, at the first midnight they are fit and off duty: a front of their side's war this year (`FRONTS`, each with its world, forward base or flagship and dated span). While posted, home is the forward base: the daily roll, the war cadence, home days and the day after a mission all run there; the HOME DAY and POSTING lines put the downtime among the officers, the other Jedi on that front and the local people.
- **The posting ends** when its front's dates end (its war events), on a recall to another front (section 9), or on an evacuation for a serious wound (section 8).
- **Days off on a front** (m9-release A7, Jared: a front line won't give 10-11 days of peace): at the forward base the gap between missions is 2-5 days (the daily roll's front numbers: none on the first day back, median 3.5, shape 4; the rank's scale stretches it). The Temple cadence (10-11 days in war) is unchanged.
- **The order arriving** (m9-release A5): when a skip stops for a posting or an assignment, the narrator tells a short scene of the order arriving; the code's choices come with it (set out; travel to the front; for a posting, also "Take a day to settle your affairs first"). "Resume the skip" is not offered while a new posting waits.
- **Posted, not yet left** (m9-release A6): from the posting until the character reaches the base, the duty line reads "Posted to <front> (<base>), not yet left".
- **Leave:** every 90-180 days, 7-14 days, counted from the first posting of the war (m9-release A8; a later posting in the same war keeps the clock while it runs ahead); the Temple (or the path's home) is home for its length and the code offers the trip home; then back to the front.
- **In a limited war and in peace** the old model holds: missions out from home and back.
- The daily roll now runs only at home (at base), as duty.md section 3 says.

## 7. Padawans (B7)

A Padawan (or Sith apprentice) with a living master goes where the master goes: the master's median scale (a Master 1.2, a Knight 1; the Padawan's own 1.2 only without a master), posted when the master is a Knight or Master, chained when the master is among the Council's best (an NPC Master, or a Knight whose best form is 70+). The master is in the mission's party: their skills help on checks (+2 when better), they hold half of a fight stage's foes.

## 8. Wounds (B8, Jared approved)

- A severe wound or worse (unhealed): the character's part ends: evacuated home (the travel time passes resting), the mission cut short; a posting ends.
- A moderate wound: carries on in an all-hands situation; otherwise sent back to the mission's base, cut short (Jared, m9-release A9): while posted that is the forward base's medics, not the Temple; the posting goes on.
- A minor wound carries on.
- Checked after each turn, never mid-fight or mid-battle.

## 9. The Council's best (B6)

- **Who (a proposal):** a Jedi Master on a field path (m9-release A10: archivists, scholars, healers and the like, such as Jocasta Nu, are not chained; the path is the archetype's war-year share, or for a canon figure with no archetype, no archivist's or scholar's words in the role or description), or a Sith Lord by the same test; a Knight with top-tier combat (the main form at 70+); a Knight in high standing (70+) with a strong record (5+ missions done, three in four successes); a Padawan whose master is among them.
- **What differs is mobility:** when they finish the work, 60% at war (35% in peace) are sent straight on instead of home: a related follow-up (the plot leads to the next world; the same thread; 50%), another front (a new posting, at war while posted; 30%), an urgent recall to the world of a running all-hands event (20%; otherwise a follow-up). At most 5 links. Ordinary Knights hold their posting; the war comes to them.
- A serious wound still sends them home.

## 10. Rewards and the record (B9)

The record counts missions, successes, failures, missions cut short and chains; standing with the Order (or the faction) +2 a success, -3 a failure, 0 cut short, held within -15..+15, added to `selectStanding`. The last 20 missions are kept as history.

## 11. The narrator, the card, the skip, saves (B10-B12)

- **MISSION line** each turn on a mission: the type and world, the objective, the current stage (and the approaches that fit, or that it is a fight or a battle), complications, who is with the character; "never resolve a stage, move the character between worlds or end the mission; propose approaches to this stage as choices". **POSTING line** while posted. **DUTY line** forbids assigning, offering or hinting at a mission (A7, with the `missionOffered` narration check).
- **Leads found in play** (m9-release A13): on an investigation or a manhunt, the narrator may propose a lead (`missionLeadFound`), checked like other proposals: "here" adds a stage after the current one (follow the lead), "world" adds the trip to another reachable world and a stage there, "followUp" makes a follow-up on the same thread when the mission succeeds (for anyone, not only the Council's best). At most 2 a mission.
- **The narrator's proposals:** `missionProposed` (the people part of the schema: a lead from someone present) with a type, a map world and why. The code checks: off duty, missions at this rank, at most one a week, a known type, a world on the map; then assigns it at the next passage of time, its thread named from the why.
- **The card** (Character tab): the title, objective, stage and progress, each stage's state, complications, who is with the character, days away, the deadline; the posting (front, base, months posted, next leave).
- **The skip** stops on a mission's assignment, at its arrival (the trip is one turn) and at each stage that needs the player ("The mission needs you: ..."). A mission day is never a free day (the routine plans every day of a mission as a working day).
- **Saves:** duty v2 migrates opt-2 saves; a character mid-mission under opt-2 gets a record built from its name (the type) and where they are (on site if they had left home, else outbound to a curated world). Fixture: tests/fixtures/saves/m9-missions-mid.json.

## 12. Every invented number

| Number | Where |
| --- | --- |
| The stage lists, their ratings (15-30 since m9-release A11), successes needed, hours per attempt, foes | `MISSION_TYPES` |
| A Master's field experience +1 on a stage's check (m9-release A11) | `STAGE_RULES.experience` |
| Days off on a front: none the first day, median 3.5, shape 4 (m9-release A7) | `MISSION_ROLL_FRONT` (duty.config) |
| Leads: investigations and manhunts, 2 a mission; the lead stage's approaches and rating 25 (m9-release A13) | `LEADS`, `LEAD_STAGE` |
| The non-field words for a canon Master (m9-release A10) | `NON_FIELD_WORDS` |
| The narration check's discovery phrases (m9-release A2) and the summons phrases (A4) | `STAGE_TOLD`, `MISSION_SUMMONS` (turn/narrationCheck.ts) |
| The type weights by path and war | `MISSION_TYPE_WEIGHTS` |
| Poor fit +20, +10 a complication, a failure by 5 inserts a stage, 4 complications before a failure fails the mission, allies +2 (at most +4), allies hold half the foes, 7 days to set out | `STAGE_RULES` |
| Deadlines: escort 21 days, rescue 14 | `MISSION_TYPES` |
| A moderate wound outside all hands sends the character back (a reading) | `MISSION_WOUNDS` |
| Standing +2 / -3 / 0, within -15..+15; history 20 | `MISSION_STANDING`, `MISSION_HISTORY_MAX` |
| The Council's best: form 70, standing 70, 5 missions, three in four | `COUNCIL_BEST` |
| Chains: 60% at war, 35% in peace; follow-up 50%, front 30%, recall 20%; 5 links | `CHAIN` |
| Postings: who; leave every 90-180 days for 7-14; local worlds within 2 squares | `POSTING` |
| The fronts' forward bases and the years marked "reading" | `FRONTS` |
| The curated mission worlds | `MISSION_WORLDS` |
| The fleet action's forces (three frigates and two corvettes a side) and the ground battle's (six troops with artillery against six with armour and artillery) | `turn/missionTurn.ts` |
| The war intensities marked "reading" | data/wars.ts |
