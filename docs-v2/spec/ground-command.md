# Ground command in play (as built; M8 checklist item 14)

Design: [m8-design-notes.md](m8-design-notes.md), "Ground command (checklist item 14)" (agreed by Jared, 24 Nov 2026). Engine: [combat-scales.md](combat-scales.md) section 5 (sector rolls, matchups, breakthroughs, morale; D-505). Play follows the ship battles' rules: [ship-battles.md](ship-battles.md) (D-517) and [ship-life.md](ship-life.md) section 10 (tactics as knowledge, D-519). Decisions: D-522 (this file), D-520 (the event schema in parts, which made room for its event), D-521 (the m8-ship-life review fixes built with it). Report: docs-v2/reports/m8-ground.md. **Every number not from lore or Jared is invented; section 12 lists them all.**

Code:
- Data: `src/data/groundCommand.config.ts` (the grid, the terrain key, weather, the known sites, scouting, contingencies, plan changes, the fight, the record), `src/data/ground.config.ts` (the engine's numbers, D-505).
- Engine (pure, D-505): `src/engine/groundBattle.ts`.
- Feature: `src/features/battles/ground.ts` (the planning scene, the map, the plan's checks, scouting, a phase with orders, contingencies, the end; pure), `groundSetup.ts` (the narrator's words and the state into a planning scene), `index.ts` (the events and the end), `selectors.ts` (the menu, the STATE lines).
- Turn: the `battle` input's `ground` field (`turn/record.ts`), `resolveTurn`'s battle branch; quiet phases and the BATTLE block as for ship battles.
- UI: `src/ui/groundPanel.ts`. Dev: `/ground <site> | <enemy> [| <ours>] [| <details>]`.
- Tests: `tests/m8/groundCommand.test.ts`, `tests/turn/groundPipeline.test.ts`.

## 1. When it applies

- **Only from a planning scene** (Jared): a command centre, a briefing, a council in the field. The narrator opens it with `groundBattlePlanned`; without one, a fight is ordinary combat (`combatStarted`) and the troops follow their standing orders.
- The event is offered only in the schema's command part (D-520): an open planning scene, an officer or soldier present, or the player's words of battle plans.
- **The battle begins only when the player gives the word** from the planning panel (`groundBattleBegun`), and only from an open planning scene. **The code alone ends it** (section 9); no narrator event can.

## 2. The planning scene

- **The narrator's words** (one compact event, as combatStarted's `ships`): the site, the enemy forces in plain words with numbers, ours when the story says, and one details line: `defending; terrain: a ridge, a river with a bridge; weather: fog; commander: <name>; meditator: <name>; enemy meditator: <name>; command: <why handed>; jammed`. People are matched by their exact names among the NPCs met. Units are read against the ground units (`GROUND_UNITS`): "troops", "infantry", "battalions" are the side's ordinary troops of the year (the ship battles' `troopsFor`); named kinds (clones, B1s, commandos, Mandalorians, militia, armour, artillery, anti-air, air) are themselves. Words the code cannot read are refused.
- **Who plans goes by rank** (Jared): an army officer of any rung (a squad leader's raid to an army), a naval officer from captain, a Jedi Knight or Master, a Sith Lord, or the fleet-command flag. The story can hand command over (`command: why`). Otherwise the player is a **sector leader** (a Padawan, an acolyte, a serving soldier: they lead a sector under the NPC commander's plan) or **in the line** (no rank: they fight in a sector).
- **Jedi plan alongside the officers, then lead from the front:** a Jedi or Sith commander starts at the front, leading a sector; the officers at the post keep the lines. The officer archetype and senior army officers (colonel and up) start at the post. The commander can change it in the planning panel.
- **The enemy commander** picks a manoeuvre it knows (an army's officers the officer-academy set; droid armies the basics; irregulars their own fighting) for holding or attacking, and deploys: a defender spreads over the positions, heavier on the objectives; an attacker picks its targets by its manoeuvre (a raid or a siege the objectives, a flanking or an envelopment the ends of the line, a feint half of it).

## 3. The plan (set in the planning scene, then fixed)

- **Objectives:** a primary and an optional secondary, from the front positions.
- **The manoeuvre:** from the ground tactics the character knows (ship-life section 10), plus what any commander can order (a frontal assault, a fighting withdrawal; a reading). Matchups as built (`PLAN_BEATS`, D-505).
- **Sectors:** which unit goes to which position, and who leads each: the player (not from the post), an NPC present (their Tactics; a Jedi or Sith raises morale there), or the unit's own officers (the troops' quality).
- **Support:** artillery, armour and air, each given to a sector where the force has a free unit of that kind (air not in a storm or fog).
- **A reserve** to commit later.
- **Up to two contingencies** ("if X, do Y"): triggers (a sector losing, a position lost, a sector leader falling, the meditator falling, our strength halved, the primary taken) and actions (commit the reserve there, shift a unit there from the strongest sector, that sector falls back, switch the manoeuvre, withdraw). They carry out at once and without penalty, whatever the contact.
- The panel lists what is wrong with a plan (`planProblems`) and will not begin until it is right. Once the battle begins the plan is fixed (`groundPlanSet` is refused).

## 4. Before the battle

- **Scouting and intelligence** (Jared: Stealth, Intelligence, recon units): up to three tries, an hour each. Scouting the ground rolls the player's Stealth, reading the enemy their Intelligence; recon units (commandos, Mandalorians and other raiders) add to both. A success reveals squares (terrain and enemy strength); an intelligence read beating the DC by 3 gives the enemy's likely plan. A bad failure is told: the scouts were seen.
- **Terrain** is the sector roll's (combat-scales section 5): cover, heavy cover, high ground to its holder, a chokepoint against the attacker, armour stopped by a river but at a bridge, towns and woods against armour. **Weather** is a modifier: rain or snow slows the attacker (-1); a storm or fog grounds air support and helps raids and ambushes (+1); night helps raids and ambushes (+1).

## 5. The map

- **A lettered and numbered grid** (Jared): A-F by 1-6 for a typical battle; 7 x 7 when a side has more than 10 units, 8 x 8 above 16; 4 characters a column (36 at the widest, inside the keyboard map's width). One square per sector. The key below lists each feature and its squares, the positions and objectives, the squares still unknown and where the enemy's strength is not yet known.
- **What is known:** the friendly side of the field and the front positions (the line can be seen; who holds it, and in what strength, takes scouting). A known site's ground is all on the maps.
- **Known sites take their features from the lore files** (Jared): Ruusan (1,002-1,000 BBY: the Jedi's forest the Brotherhood set ablaze, the plains the Jedi were driven onto, Hoth's caves, the thought bomb's valley, the Brotherhood's camp), Geonosis (22-19 BBY: the Petranaki arena, the droid foundries, Point Rain), Jabiim (22-19 BBY: Cobalt Station, the mines, the Nationalists' stronghold). The features are the lore's; where they sit on the grid is invented, and so are the extras marked so.
- **Elsewhere the narrator proposes them** (the details line's `terrain:`), read to features and placed on the grid by the seed, **tagged invented** on the key; with no words, the code's own few (a low ridge, a stand of woods, a fortified outpost), invented too. They stay fixed once shown (saved with the scene).
- **Redrawn only when something changes:** after each phase and after a personal fight.

## 6. The battle

- **Phases of 1.5 hours** (D-505), at most 12 (18 hours). Each phase: the player's orders (section 7), the player's own fight in their sector, the **commanders' Tactics roll** (the player's when they command, else the NPC commander's, against the enemy's: +1 to the winner's side for each 4 of margin, at most 2; out of contact it does not reach the sectors), weather, then the engine's sector rolls: plans, units, support, terrain, morale (bond or fear), battle meditation, Force users at the front and the player's own fight, as built.
- **Breakthroughs and morale** as built (D-505); the lines say whose line broke. A sector leader caught in a rout or a collapse may fall (named NPCs die; canon figures never, by the tag-map rules); the player in a sector that routs or collapses round them takes a hazard (an explosion, severity 1 or 2).
- **The player chooses each phase:** change the manoeuvre (the commander, known tactics only), commit the reserve, fall back from their own sector (when they lead it), fight it out in person (anyone at the front; someone in the line fights in the first sector of the plan), withdraw (the commander); or "Next phase" with the plan as it stands. **"Let it play out"** (Jared) plays up to three phases on the plan, stopping at a big moment, and goes on by itself until the player takes control back.
- **Narration** (Jared, as the ship battles): ordinary phases are the code's own lines (no AI call); the start, the big moments (a position taken, a rout, a sector collapsing, a leader or the meditator killed, a contingency) and the end go to the narrator in the BATTLE block. The narrate-every-turn setting (now "every battle turn, ship or ground") sends every phase.
- **Saved whole:** the planning scene and the battle live in the battles slice; a game saved mid-battle loads into the same phase, and the same orders give the same phase (tested).

## 7. Changing the plan (Jared)

- **With a command post in contact** (officers at the post with their lines open), changes land at once.
- **A front-line commander changes their own sector at once** (falling back), whatever the contact.
- **Without contact** (jammed, or a force with no officers: militia and war beasts alone), a wider change takes a whole phase to spread and the side rolls -1 in the phase it lands. **High-bond units improvise:** a change to a sector whose units all have bond 60+ lands at once. Fear-ruled units follow orders to the letter: out of contact they take the engine's -2 and never improvise. Only the plan and its contingencies hold.

## 8. Jedi and Sith at the front; the post; meditation

- **At the front** a Jedi or Sith leads a sector in person: +15 morale there and the duelist's bonus (D-505). Their own view is their sector; the wider picture comes through the officers' lines (with contact the whole map; without it, only their own sector).
- **The player commanding from the post** sees the whole battle but leads no sector: no morale at the front, no own fight (tested).
- **The player's own fight** (Jared, as dogfights feed a fleet): each phase at the front, the better of their combat levels against the enemy troops' quality there: won at +3 (+2 to the sector), lost at -3 (-2), else held (0). "Fight it out in person" hands off to personal combat (four of the sector's enemy troops, lethal); the battle waits, and the result counts for the sector the next phase.
- **Battle meditation** as built (+1 at 40, +2 at 80, +3 at 120 on every roll of the side). An NPC of ours named as meditator meditates at the post. An enemy raid that breaks through anywhere reaches the meditator a quarter of the time: killed, the whole side checks (Mizra) and loses 15 morale.

## 9. The end and the results

- **The code ends it:** every contested sector settled, the time out (12 phases), a side with nothing standing, or the commander's order to withdraw (a defeat). The winner holds more objectives (the primary counts double).
- **The record** (battles slice history, kind `ground`): outcome, why, the objectives and who holds them, casualties (the share of strength lost by the units' sizes; men a unit by the command's size), morale (+5 / 0 / -8, doubled for a major battle), a **major battle** for the world events engine (12 units on the field in all, or a known site). The world reads it as a battle of scale `ground` (world tests may name the scale).
- **XP:** command XP (Tactics with the Intelligence share, `commandXp`) for planning and commanding, by the size commanded; a sector leader's for their sector (a company); field XP for the player's own fighting at the front (the piloting exchange rule on their best combat skill, `fieldFightXp`).
- **Tactics seen:** the enemy's manoeuvre is recorded as seen (ship-life section 10): recognised from then on.

## 10. Wartime postings (item 11, not built)

Item 11 stays story-only. When it is built, a posting hooks in at three places: who plans (`playerMayPlanGround` reads the posting's command), the forces (a posting's unit becomes `ours` and its bond and fear the units' own, replacing the 50 / 0 defaults), and the start (a posting's orders open the planning scene from the posting's calendar instead of only the narrator's event).

## 11. Readings for Jared

- **What any commander can order** on the ground without training: a frontal assault and a fighting withdrawal (as the fleet's line and brawl).
- **Who plans:** army officers of every rung (the design notes' "every scale"), naval officers from captain (landing forces), Jedi Knights and Masters, Sith Lords. Padawans and acolytes lead a sector unless the story hands them command.
- **The commanders' Tactics roll** each phase is the reading of "the commander's Tactics roll" in the brief; sector rolls still use each sector leader's Tactics or the troops' quality (D-505).
- **Known sites:** the lore gives the features, not their layout; the grid squares are invented. Jabiim's lore names no terrain, only places (Cobalt Station, the mines); its "churned ground" is invented and marked so.
- **Units' bond and fear** are 50 and 0 until postings (item 11) give them.
- **A jammed command post** comes from the narrator's details; nothing in play cuts the lines yet (a lost command post square could, later).

## 12. Every invented number

| Number | Where |
| --- | --- |
| Larger grids: 7 x 7 above 10 units a side, 8 x 8 above 16; 4 characters a column | `GRID` |
| What each feature does in the roll (ridge: cover and high ground; hills: high ground; forest: cover, woods; marsh: cover, stops armour; structure and ruins: heavy cover, town; town: cover; caves: heavy cover; bridge: the crossing and a chokepoint) | `FEATURE_DEF` |
| Weather: rain and snow -1 to the attacker; storm and fog no air, +1 to raids and ambushes; night +1 to raids and ambushes | `WEATHER` |
| Known sites' squares (the features are lore); Geonosis's rock spires and Jabiim's churned ground | `KNOWN_SITES` |
| The code's own ground with no words: a low ridge, a stand of woods, a fortified outpost | `buildMap` |
| Positions: a third of the larger force's units, 2 to 6, in the middle columns, preferring objectives, cover, bridges and high ground | `buildMap`, `GROUND_LIMITS.positions` |
| Scouting: 3 tries, an hour each, DC 13, recon units +3, 2 squares + 1 for each 3 of margin, the plan at +3, seen at -5 | `SCOUTING` |
| A sector losing: the track at -2 | `FALLING_AT` |
| Contingency triggers and actions (the kinds) | `CONTINGENCY_TRIGGERS`, `CONTINGENCY_ACTIONS` |
| What any commander can order: a frontal assault, a fighting withdrawal | `GROUND_COMMAND_BASICS` |
| NPC manoeuvres for holding and for attacking; an NPC side's knowledge by kind | `DEFENDING_PLANS`, `ATTACKING_PLANS`, `enemyGroundKnowledge` |
| Enemy deployment: objectives first, a quarter of units to the first target; an attacker's targets by manoeuvre | `deployEnemy` |
| Changes without contact: a phase late, -1; improvising at bond 60 | `CHANGE` |
| 12 phases at most; 24 units a side | `GROUND_LIMITS` |
| The commanders' roll: +1 a side for each 4 of margin, at most 2 | `commandRoll` |
| The player's own fight: won at +3, lost at -3 | `OWN_FIGHT_ROLL` |
| A leader falls in a rout 20%, a collapse 45%; the player's hazard severity 1 / 2 | `LEADER_DEATH`, `stepGround` |
| A raid reaches the meditator 25% | `MEDITATOR_RAID` |
| A personal fight: four of the sector's enemy troops | `stepGround` |
| Men a unit by command size (squad 8, platoon 30, company 120, battalion 500, regiment 1,500, army 6,000); command size by units (1, 2, 3, 5, 9, 16) | `MEN_PER_UNIT`, `GROUND_SIZE_BY_UNITS` |
| A major battle: 12 units in all, or a known site | `GROUND_MAJOR_UNITS` |
| Ours when the story does not say: 4 units of the side's troops for a commander, 3 otherwise | `planningFromProposal` |
| The commander's place: the officer archetype and army colonels and up at the post | `defaultAtPost` |
| An NPC leader's duelist tier: a Jedi Master or Sith Lord a master, others below | `leaderOf` (groundSetup) |
| A sector leader's command XP: a company | `concludeGround` |

From the engine and not new here (D-505): every sector-roll number, the plan matchups, unit matchups, breakthrough bands, morale, meditation, Force users at the front, out of contact. Morale after a battle is the fleets' (+5 / 0 / -8, doubled for a major battle).
