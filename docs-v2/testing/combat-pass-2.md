# Combat pass 2 (2026-11-19)

Scope: a broad play test after the combat-pass-1 fixes. Part A is the engine checks. Part B is a browser pass in Chrome
on `http://localhost:5173/?dev=1`, test campaigns only, typed natural input wherever a player would type. Nothing was
fixed during the pass. Build under test: commit 0c55b34 (D-191 to D-207).

How the pass was run:

- Three test campaigns: the existing `[TEST] Kael Voss` (Knight, 30, 22 BBY, Clone Wars), a new Padawan aged 16 (Tessa
  Rin, 3,653 BBY, Cold War; opening by scenario) and a new Knight aged 30 (Daro Venn, 25 ABY, Yuuzhan Vong War; opening
  by scenario).
- Dev commands (`/fight`, `/spar`, `/heal`, `/set`, `/ci`, `/skip`, `/time`, `/fatigue`, `/scenario`)
  and quiet beats (Next beat) set scenes up with no AI call. AI calls went to typed input and narration.
- One new tab only. The API key was already saved in the browser; it was never read or typed.
- The Chrome window was maximized and would not resize, so the iPad layout was measured in an 820 x 1180 frame of the
  same page (as in pass 1).
- The narrative model in use was `gemini-3.5-flash-lite` (first in the browser's model order).

**Pass-1 fixes confirmed in the build (decisions.md):** D-193 (saber throw rating 15), D-196 (interruptions, amended),
D-197 (labels, outcome list, check before commit), D-198 (severed leg; weapon arm off), D-199 (sequence and input
fixes), D-200 (slugthrowers), D-201 (miss reasons), D-202 (wound location check), D-203 (wound penalty eases, known
abilities only, feints with the form level), D-204 (no free Force turns), D-205 (issues 16-21, R3-R7), D-206 (duel
length), D-207 (Y_avg re-measured). D-191, D-192, D-194 and D-195 predate pass 1 and are in.

**AI calls used: 73 of the 80 budget** (usage meter 157 -> 230). Six of the 73 were Gemini 503 replies ("high demand")
that the meter counts, one was an automatic retry of a truncated opening, two were retries made by the narration check,
and six were chapter summaries (a chapter closes when a scene ends, on a time jump, and every 30 turns: quiet-beat
clicks count as turns).

| Scenario | Calls |
|---|---|
| 1. Knight vs 6 B1, forest (3 typed inputs, Resolve to end with one 503 and the check's retry) | 9 |
| 2. Typed week of medic care (intent, narration, chapter summary) | 3 |
| 3. Knight vs 1 duelist, lethal (4 typed inputs, To key moment, Resolve to end; two 503s, one summary) | 13 |
| 4. Lightning attempt (unknown ability), then Disengage (the check's retry, one 503, one summary) | 8 |
| 5. Lightning and Choke on a saber duelist, then Surrender | 3 |
| 6. Knight vs 4 Mandalorians, open ground (quiet beats, Resolve to end, summary) | 2 |
| 7. Knight vs 3 B1 on ice (typed ice throw, Throw button, Resolve to end, summary) | 4 |
| 8. Knight vs 4 troopers (Mind trick button, a typed "the fight ends here", Resolve to end) | 3 |
| 9. Duel in a ysalamiri bubble (typed Push, Resolve to end, summary); then death by `/time` (no call) | 4 |
| 10. Padawan and Master vs a Sith duelist and four droids, 3,653 BBY (opening x2, 2 typed inputs, Resolve to end) | 7 |
| 11. Padawan sparring (Resolve the bout, Play this bout, typed "Solah", summary) | 4 |
| 12. Knight vs a Yuuzhan Vong warrior, 25 ABY (opening, typed Push, typed rock throw, Resolve to end, Capture) | 7 |
| 13. Mind trick on a Hutt (twice) and on a named Force user | 6 |

## Part A: engine checks

- `npm run test:all` (PowerShell): **76 files, 729 tests, all passed** (186 s; lifetime tests included).
- `npm run sweep`: **9,840 fights in 26.7 s; "Issues (broken behaviour): none".** Counts for the record: Force push
  9,786 successes / 2,345 dodged / 1,057 resisted; saber throw 17,580 successes / 8,791 fell short. Knight at 50,
  balanced: 10 B1 100.0 won / 0.7 wounded; 6 troopers 99.7 / 5.7; 6 elites 96.3 / 25.7; 4 Mandalorians 97.0 / 24.7;
  6 B2 99.7 / 2.3; 4 droidekas 99.0 / 4.7. heavyForce: 68.0 to 93.7 won. The sweep does not cover the cases behind
  issues 1, 3, 4 and 5 below (auto-resolve while unarmed, typed wording, narrator events, eras).

## Summary

| # | Category | Severity | Issue |
|---|---|---|---|
| 1 | bug | **blocker** | Resolve to end with the saber on the ground never recalls it: 322 bare-handed exchanges, a Knight loses to six B1s |
| 2 | bug / UX | major | The code-written fallback for that turn is 39,541 characters of engine sentences in the story, and it enters the next prompts |
| 3 | bug | major | "I thrust out my hand ..." adds a strike step that was never asked for (twice; once it cost the whole turn) |
| 4 | bug | major | A narrator `hazardOccurred` sent during a fight gives the player a real wound next turn (twice; once a copy of the engine's own terrain fall) |
| 5 | lore break | major | "War droids" in 3,653 BBY become "B1 battle droid 2-5" |
| 6 | bug / consistency | major | Master present: the Sith duelist fights the Padawan, the typed target is ignored, and the fight is "won" with the Sith untouched |
| 7 | narration | major | An invented kill: "shearing cleanly through its metallic chassis" on a droid that was never struck; the check did not fire |
| 8 | bug | major | The opponents' exchange during a Force action is written to the block as "gains ground" although the track is held; the narrator has the defending player press forward (4 times) |
| 9 | bug | major | A typed Force ability the character does not know: no step line, no reason shown, and the narrator repeats the previous narration word for word |
| 10 | UX | major | The death card says "Load an older save from the campaign menu"; the menu has only Export and Import |
| 11 | bug | major | Opponent's initiative: the player's first step is replaced by the opponent's strike but labelled DONE, the sequence goes on, and the narration tells it as the player's cut |
| 12 | narration | major | A flight from a lethal duel narrated as "The simulated combat comes to a halt" with the Sith lowering his blade |
| 13 | narration | major | Invented slips are still there after D-201 (6 quotes); the check has no rule for them |
| 14 | narration | minor | A NOT REACHED second strike narrated ("two swift, probing cuts ... parries each blow") |
| 15 | narration | minor | Outcome-list and engine words in prose ("a mortal strike", "a painful, moderate wound", "the roll falling short of the difficulty") |
| 16 | narration / Star Wars fit | minor | Invented gear and effects: "against your armor", "spinning blades", burns from an amphistaff |
| 17 | bug | minor | A typed rock becomes "a heavy fallen log" when the fight has loose rock |
| 18 | bug | minor | Surrendering in a lethal duel has no consequence (no opponent's choice) |
| 19 | bug | minor | Vitality does not follow the hits: a moderate wound and a mortal wound at 72 / 72; a lightning "hit" at 64 / 64 |
| 20 | bug / consistency | minor | A severed leg has a "qualityCybernetic" at once (while captured); raw id; adaptation 17% after 71 training hours |
| 21 | consistency | minor | Dev opponents and old choices leak into later scenes (list below) |
| 22 | UX | minor | Force buttons stay live where the Force cannot work; opponents' weapons are not shown; the immune card (list below) |
| 23 | UX | minor | Raw ids, labels and counts left over after D-205 (list below) |
| 24 | UX | minor | Quiet-beat lines assume a melee duel ("blade on blade", "blow lands", "it") against people with blasters |
| 25 | UX | minor | Speech in a fight is "not understood" and costs an intent call |
| 26 | Star Wars fit | minor | "Jedi parlor tricks"; Sith Empire duelists in 22 BBY and 25 ABY (dev generator) |
| 27 | UX | minor | Layout: the over-limit warning pushes the Stance row out of the panel on a wide window; top bar text cut at 820 px; 30 px buttons |
| 28 | balance | flag | Numbers that look wrong though no rule says so (list below) |

What worked as specified: the narrator's `combatEnded interrupted` with "the combat is still ongoing" was refused and
the fight went on (D-196); every sequence step had a DONE / FAILED / NOT REACHED line, a stance step stayed outside the
cap, a failed feint was a beat with its dice and the form level (23.4 vs 24.3) (D-197, D-199, D-203); the saber throw
rolled against DC 11.5 and its failure was narrated as a failure (D-193); the opponents acted during every Force
action, also while the Knight was unarmed (D-204); a severed leg ended a duel twice, once for the player and once for an
opponent, with "has lost a leg and cannot stand: out of the fight" (D-198); the wound penalty eased as wounds healed,
-39% -> -22% -> -3% (D-203); typed rest with a medic rested 7 days at x2 with the wounds on the right body parts and
"relying entirely on time rather than miraculous bacta" (D-199, D-197, D-202); typed "Solah" ended the sparring session
(D-199); blade colours were only blue (the Guardian, the Jedi partner, Master Vash) and red or crimson (Sith) (D-205);
the Push card and the panel agreed (-3 -> +3) (D-205); Force push failed on a Yuuzhan Vong as "outside the Force" and
a thrown rock hit him; the mind trick on the Hutt was immune and on the Dark Jedi a Willpower contest; a ysalamiri
bubble stopped the Push with its reason; the wounds in three long Resolve-to-end passages were each narrated on the
right fighter, in the right place and order. No Earth units, firearm words, magic terms or Disney-canon elements
appeared in any narration. The iPad-size layout had no page scrolling and no clipped buttons.

## Issues

### 1. Resolve to end never recalls a dropped saber (bug, blocker)

- Set-up: Knight vs 6 B1, forest. `I throw my lightsaber in a wide arc through the droids and call it back to my hand.`
  failed its control roll (`#2 Force · Saber throw: fell short (DC 11.5) · saber dropped`, `d20 7 +3.6 level = 10.6`),
  so the Knight was unarmed. One more typed turn, then the **Resolve to end** button.
- Log: `Narrated 322 exchanges · the fight ended · lost: a fighter is down`. No recall anywhere in the 322 exchanges;
  102 unarmed strike cards (`#9 strike · solid hit on B1 battle droid 1 · no wound`, `#13 ... minor wound, left arm
  ... it fights on`). Kael took 10 wounds (2 severe). Engine log: `fight fight-4 ends: lost (incapacitated)`, `the
  opponent's choice: left`, `combat XP 10.67 (serious, lost)`, `agility: daily combat cap 12 XP reached (94.44 ->
  12.00)`. Clock 06:00 -> 06:40. Health card afterwards: `Physical 26.4 / 5.1 · overtrained`, `Force 4.9 / 4.9 ·
  exhausted`, `Vitality 0 / 72`, `Wound penalty on your main form: -39%`.
- Expected: a Jedi calls the saber back (D-193: "the thrower fights unarmed until a recall"; the recall is a Force
  action the auto-resolver never takes). D-158 has a Knight beating six B1s 99%+ of the time. The sweep's patterns
  recall after a throw, so it never saw this. Also wrong on its own: a fight of 322 exchanges with no length limit, and
  a physical meter at five times its capacity with no collapse.

### 2. The fallback text for a long passage (bug / UX, major)

- Same turn as issue 1. Engine log: `narration check: 3 contradiction(s) with RESOLVED (woundOmitted, woundOmitted,
  woundOmitted): ""; retrying once`, then `narration check: still contradicting RESOLVED (woundOmitted, woundOmitted);
  code-written lines used instead`. Three narrative calls (one 503, two of 24,484 and 24,602 input tokens).
- Narration shown to the player (39,541 characters; the start): "Kael Voss hits B1 battle droid 1: a hit (B1 battle
  droid 1, head, no wound, stamina only). Kael Voss and B1 battle droid 1 trade blows: no hit. Kael Voss gains ground
  (reason: B1 battle droid 1 gave ground) (margin 4.7). ..."
- Expected: D-197's fallback is "the outcome list in plain sentences". For one exchange that reads well; for a
  Resolve-to-end passage it is every exchange with its margin. A summary of the hits and the result would do. The two
  following turns' narrative calls carried 19,136 and 19,327 input tokens (7,300 is usual) because this text was in
  the recent turns. The check itself was right to fire: with ten wounds in the block the narrator left some out.

### 3. "Thrust out my hand" is read as a strike (bug, major)

- Input A: `Unarmed, I thrust out my hand and Force push the nearest droid into the ones behind it, then lift a heavy
  rock with the Force and hurl it at another droid.` Log: `step 1 strike: DONE (hits B1 battle droid 1: no wound,
  stamina only)`, `step 2 Force push: DONE`, `step 3 Force throw: FAILED`. Narration: "You lash out with an open hand,
  striking B1 battle droid 1 squarely in the left leg".
- Input B: `I thrust out both hands and unleash Force lightning at him.` Log: `step 1 strike: FAILED (loses ground; no
  hit)`, `step 2 Force lightning: NOT REACHED (an earlier step failed)`; `#1 exchange · Duelist 3 gains ground · track
  +0 -> -5` (a natural 1).
- Expected: one Force step in B, two in A. `thrust` is in STRIKE_WORDS (data/combatWords.ts), and D-191's clause rule
  adds a strike for an attack word "with no Force action" in its clause; "thrust out my hand and Force push" is cut
  into two clauses at "and". It is the most natural way to describe a Force gesture.

### 4. A narrator hazard during a fight wounds the player (bug, major)

- Case A (ysalamiri duel, hangar): the typed Push turn's log has `applied hazardOccurred (hazard deferred to the next
  turn (D-29))`. Nothing in that narration is a hazard. Next turn: `impact (severity 1): D 6.0`, `minor wound to the
  rightArm (Combat exchange)`. The block's only hit that turn was the mortal torso wound.
- Case B (Padawan vs droids, ruins): the engine rolled `terrain: Tessa Rin falls on the uneven ground (minor
  leftHand)` and the narrator told it correctly ("your footing slips on the uneven stone, leaving your hand scraped").
  The same reply sent `hazardOccurred`. It was applied in the next AI turn, which was the first sparring bout in
  another place: `fall (severity 1): D 7.0`, `minor wound to the torso (Uneven stone flooring during the frantic droid
  engagement)`.
- Expected: the engine owns the wounds of a fight (the ABSOLUTE RULE in combat-narration.md; golden rule 1). A
  hazardOccurred sent while a fight is active should be refused unless it is the cause of an interruption (D-196), and
  a terrain accident the engine already resolved must not be applied twice.

### 5. B1 battle droids in 3,653 BBY (lore break, major)

- Scenario (dev test start, Cold War era): `... we are attacked by a Sith duelist and four war droids ...`. The opening
  said "a phalanx of heavy war droids", which fits the era.
- Log on the next turn: `fight fight-1: lethal against Sith Duelist, B1 battle droid 2, B1 battle droid 3, B1 battle
  droid 4, B1 battle droid 5`. The panel, the roll cards and the fight summary all say "B1 battle droid".
- Expected: the B1 is a Trade Federation droid of the last decades of the Republic (the brief's own example of an era
  mistake is of this kind; I did not look the model up in the lore files). In 3,653 BBY the unit should be an era-neutral "war droid" or "battle droid". The
  combatStarted schema offers the narrator a fixed list of minion kinds with no era check, and `battleDroid` is
  labelled "B1 battle droid" in npcGen.config. The numbering also starts at 2 (the duelist took number 1).

### 6. A Master present: the wrong opponent, and a fight left open (bug / consistency, major)

- Opening: "Master Oren Vash draws his own lightsaber ... as he moves to intercept the dark sider. The four war droids
  pivot in unison, locking their sights entirely on you".
- Input 1: `I ignite my lightsaber and cut down the nearest war droid.` Log: `#1 exchange · Sith Duelist gains ground ·
  track +0 -> -2` (`Tessa Rin: d20 7 +3.4 level`, `Sith Duelist: d20 13 +5 level`). Narration: "the Sith duelist surges
  instantly into your path to intercept."
- Input 2: `Master Vash steps in and takes the Sith duelist off me. I leave the Sith to him, turn to the droids and cut
  at the nearest one.` Log: `applied opponentEngagement`, panel `Sith Duelist · fighting an ally`, target `B1 Battle
  Droid 2`; but the exchange was `#2 exchange · Tessa Rin gains ground · track -2 -> +0` against the Sith Duelist.
- Resolve to end: the four droids go down, then `fight fight-1 ends: won (dying)`, `Fight over: won: a fighter is
  dying. Tessa Rin: Hurt · Sith Duelist: Healthy`, `flag set: heroicAct:fight-1`. Two game minutes later the sparring
  narration has "Master Oren Vash watches from the sidelines".
- Expected: the fight starts with the duelist engaged by the Master (the opening said so; opponentEngagement exists for
  this). A typed "the nearest droid" picks a droid as the target. And the fight cannot be won while a lethal named
  opponent still stands: the ally's duel needs an outcome (or the fight stays open). "A fighter is dying" here is droid
  5 (mortal wound), which D-205 says should read Disabled or Destroyed.

### 7. An invented kill the check did not catch (narration, major)

- Same turn as input 2 above. Block: one build-up exchange against the Sith Duelist, `step 1 strike: DONE (gains
  ground; no hit)`. All four droids at full Vitality.
- Narration: "you spin instantly toward the nearest war droid and bring your lightsaber down in a swift, decisive arc,
  shearing cleanly through its metallic chassis."
- Expected: no hit (ABSOLUTE RULE). The D-197 rule for the player's blade landing did not fire; "its metallic chassis"
  has no numbered minion name, and "shearing through" is not in the landing-verb list.

### 8. The opponents' exchange during a Force action reads as ground gained (bug, major)

- Log (unarmed Knight, forest): `#6 exchange · even · track +3 -> +3`, `Margin for Kael Voss +5.7 · 0 s · while you
  use the Force`, `Kael Voss is using the Force and only defends`. Narration: "you trade blows with the nearest droid,
  easily outpacing its frantic reflexes and forcing it to give ground"; `#8` (margin +11.7): "you trade another
  exchange of blows, once again outpacing the droid and driving it backward."
- Also: lightning duel `#2 exchange · even · track +0 -> +0`, margin +4: "you press forward, claiming ground as he
  yields an inch"; ysalamiri duel `#2`, margin +11.2: "your footwork outpacing his to press him back and claim ground".
- Expected: D-204: "the player never strikes in it, a won build-up holds the track". turn/combatFacts.ts line 158
  writes every non-strike exchange as "X and Y trade blows: NO HIT. X gains ground (reason: Y gave ground / was
  outpaced)" from the margin alone, also when `duringForce` held the track. The narrator follows the block. The line
  should say the player defended and nothing moved. "Trade blows" is also the block's wording against opponents who
  only shoot.

### 9. A typed ability the character does not know (bug, major)

- Input: `I unleash Force lightning at him.` (the test Knight has no Force Lightning).
- Log: `Narrated 0 exchanges · a sequence` with no step line. Engine log: `rejected: the character does not know
  forceLightning`. Two AI calls.
- Narration: the previous turn's text again, word for word ("You lunge forward with a strike from your blue-bladed
  lightsaber, but Duelist 3 effortlessly outpaces your movement ...").
- Expected: D-191: every step gets a line, "dropped with the reason (does not know the ability ...)". The player sees
  no reason at all, and an empty block makes the narrator repeat itself. A quiet no-effect beat with the reason (as for
  an immune mind trick, D-194) would cost no narrative call. The issue-3 turn before it did carry `step 2 Force
  lightning: NOT REACHED`, so an unknown ability is checked only when its step is reached.

### 10. No way to load an older save (UX, major)

- After death the card reads: "Kael Voss is dead. died of their wounds (the dying timer ran out). Load an older save
  from the campaign menu to play on from there (a new branch), or create a new character." with a Campaign menu button.
- The Campaign tab has: Export campaign, Import campaign, the new-character form and the dev test start. There is no
  list of saves or turns.
- Expected: D-154's "loading an older save starts a new branch" needs a control, or the card should say "import an
  exported campaign file". A player who never exported has nothing to load. The branch behaviour could not be tested
  (see "Not tested").

### 11. The opponent's initiative inside a sequence (bug, major)

- Panel before the input: `Advantage: -3 Duelist 2`, "Opponent has the initiative: a sequence may be cut short".
- Input: `I cut low at his right leg, cut again at the same leg, then drive him back across the floor.`
- Log: `step 1 strike (aimed at the right leg): DONE (Duelist 2 holds the strike: no opening to attack)`; `step 2
  strike (aimed at the right leg): FAILED (loses ground; no hit)`; `step 3 maneuver (position): NOT REACHED`. Cards:
  `#57 strike · strike recovered · track -3 -> -1` (`Duelist 2: d20 1 -5 natural`, margin for Kael +15.3), `#58
  exchange · Duelist 2 gains ground · track -1 -> -2`.
- Narration: "You swing your blue blade low toward his right leg, but Duelist 2 catches the strike cleanly on his red
  blade, holding your attack in check with zero opening."
- Expected: D-199 (2): the first step resolves, then the opponent's strike is its own exchange and the remaining steps
  are NOT REACHED with "X had the initiative and struck first (#n ...)". Here exchange #57 was the opponent's strike
  (which Kael parried) standing in for step 1, the step is marked DONE though the player's cut never happened, and the
  sequence went on to step 2. The card does not say who struck. The opponent's natural 1 on his own strike gave the
  player nothing.

### 12. Flight from a lethal duel narrated as a training exercise (narration, major)

- Input: the Disengage button, lethal stakes, track -5. Log: `disengage: 18.0 vs 13.4`, `fight fight-6 ends: fled
  (disengaged)`.
- Narration: "You step back and drop your guard, breaking off from the engagement. Duelist 3 lowers his red-bladed
  lightsaber smoothly, returning to a neutral stance amidst the desolate stone pillars of the ruins. The simulated
  combat comes to a halt". Chapter title: "The combat simulation has ended." The Mandalorian fight closed with "The
  combat simulation concludes after defeating all opponents."
- Expected: the player fled a Sith who was trying to kill them. The narrator reads the dev place name ("Ruins (dev
  sandbox)") and the dev opponent's description ("a dev sandbox opponent") as a simulation. A dev artifact in part, but
  the block for a fled fight should also say what fleeing means (the opponent did not agree to stop).

### 13. Invented slips after D-201 (narration, major)

- Flat temple floor, no accident in the block: "your footwork falters before you can gather the necessary focus"
  (steps NOT REACHED); "your footwork falters and you are outpaced" (#7); "Caught off balance by the misstep" (a
  natural 1); "you are outpaced, your footing faltering as he drives you back" (hangar); "your footing slipping just
  enough for your partner to slide their blue blade past your guard" (sparring); "Regaining your footing" (troopers).
  The check's first lightning narration had "as you stumble slightly on your prosthetic leg".
- Expected: D-201: "nobody slips, stumbles, loses footing or grip, misjudges a step or overextends unless the block
  lists a terrain accident for that fighter". The prompt rule is not holding with this model, and narrationCheck.ts has
  no rule for it. The one real accident of the pass (issue 4, case B) was narrated correctly.

### 14. A step that was not reached told as done (narration, minor)

- Input: `I press him with two quick cuts at his sword arm, then shove him back with a Force push.` Log: `step 2 strike
  (aimed at the right arm): FAILED (holds; no ground gained, no hit)`, `step 3 strike ...: NOT REACHED`, `step 4 Force
  push: NOT REACHED`.
- Narration: "driving two swift, probing cuts toward his sword arm, but Duelist 2 parries each blow effortlessly".
- Expected: one cut. The check covers a Force step marked NOT REACHED, not a strike.

### 15. Engine words in the prose (narration, minor)

- "a mortal strike that cuts him down", "leaving a moderate wound", "striking a moderate blow to the head", "a
  painful, moderate wound into your left leg", "sinking a severe, smoking cut", "taxing its chassis's stamina",
  "draining his stamina without piercing his defenses", "the roll falling short of the difficulty", "leaving the
  strike unreached".
- Expected: D-205 (R5): "never the outcome list's terms in prose ... show the severity instead".

### 16. Invented gear and effects (narration / Star Wars fit, minor)

- "a sudden burn flares across your torso as a blow connects harmlessly against your armor" (a Jedi with no armor in
  the block; a graze, no wound).
- "clashing against blaster fire and spinning blades" (four Mandalorians with pistols or a slugthrower).
- "the warrior's heavy blows ... leaving shallow burns and bruises" (an amphistaff is not an energy weapon).
- "you bind the fallen warrior's remaining limbs securely with durable cord from your utility belt" (no such item).
- "leaving you unarmed as you rely on the Force to defend yourself" (the engine used Agility).
- Expected: only the block's weapons and gear (ABSOLUTE RULE). D-197's known gap (no code check for a wrong weapon)
  showed up as "spinning blades" and "armor".

### 17. The thrown object is not the one named (bug, minor)

- Input: `... then lift a heavy rock with the Force and hurl it at another droid.` Forest terrain has fallenTimber and
  looseRock. Narration: "You reach out with your mind to hurl a heavy fallen log".
- Expected: D-199 (4): "a throw uses the object named, or any other throwable the fight still has". The rock was there.
  (On ice and on the Dantooine hillside the object matched: "a jagged chunk of ice", "a jagged slab of stone".)

### 18. Surrender has no consequence (bug, minor)

- Input: the Surrender button in a lethal duel. Log: `fight fight-7 ends: lost (surrendered)`, `combat XP 1.52
  (lethal, lost)`; panel `Fight over: lost: surrendered. Kael Voss: Healthy · Duelist 4: Healthy`. No "The opponent's
  choice" line.
- Expected: when the player is beaten the opponent's fate roll decides (captured, left, killed); the two lost fights
  of the pass had `the opponent's choice: left` and `captured`. A surrender to a Sith in a lethal duel ends with
  nothing decided. XP: 1.52 for 4 exchanges and a surrender, against 0.41 for fleeing after 1.

### 19. Vitality does not follow the hits (bug, minor)

- `#4 strike · critical hit on Daro Venn · moderate wound, torso` (the Vong's strike during a Force action): panel
  `Daro Venn 72 / 72`. A dying Kael: `Dying: 15 minutes left unless stabilized`, `VITALITY 72 / 72`. A lightning hit:
  `step 1 Force lightning: DONE (hits Duelist 4: no wound, stamina only)`, panel `Duelist 4 64 / 64`.
- Against that: `#28 strike · graze hit on Duelist 2 · no wound`: `52 / 72 -> 32 / 72`, the same 20 points a severe
  torso wound cost him earlier.
- Expected: one rule. Either a hit costs Vitality or it does not; a mortally wounded fighter at full Vitality reads as
  a display fault.

### 20. The lost leg (bug / consistency, minor)

- Log: `#81 strike · critical hit on Kael Voss · right leg severed`, `rightLeg severed: a lasting injury
  (qualityCybernetic)`, `the opponent's choice: captured`. Health card: `lost leg · qualityCybernetic · 0% adapted`.
- After `/skip 14 days` and `/skip 21 days` (18 training days, 71 hours): `lost leg · qualityCybernetic · 17% adapted`.
  The card shows no penalty for the lost leg once the wounds have healed ("Healthy").
- Expected: a quality cybernetic leg is fitted later, by someone; on the duel floor, captured, the aid should be none
  until treated. The card should show the aid in words and the lasting penalty. progression-numbers §18: "+1% per
  effective hour of training the affected skills (at most 3% per day)" and "quality cybernetic reaches full adaptation
  in 30-40 days": 17% in 18 training days is a pace of about 105 days. (The first 14 days were mostly injury rest, so
  the adaptation there was 0%.)

### 21. Things that carry over between scenes (consistency, minor)

- The medic week (Kael, a Jedi in the Republic's care): `Day 25 of Month 1, 22 BBY: A brief encounter with Duelist 1`,
  narrated as "Duelist 1 appears like a phantom in the shadows, a cold reminder of your failure before vanishing into
  the dark." Duelist 1 is the Sith who beat him.
- The same week: typed "in the medical bay", narrated in "the medical facility"; the top bar stayed "Forest (dev
  sandbox)".
- The narrator's choices from the capture ("Accept capture and await your fate", "Attempt to crawl away from your
  captor") were still offered in the duel panel, under "Or", 35 game days and one fight later.
- Dantooine hillside to "Borga the Hutt's Audience Chamber" on Nal Hutta at 07:09 the same morning (a `/scenario`
  jump; dev only).

### 22. Controls and cards that mislead (UX, minor)

- In the ysalamiri bubble the Force row is `Push, Choke, Lightning, Mind Trick, Saber Throw`, all live; against the
  Yuuzhan Vong it is `Push, Throw, Mind Trick (Immune)[disabled], Saber Throw`. A Push that cannot work is not marked,
  and using it costs the exchange (and the Vong's free strike).
- An opponent's weapon is shown nowhere in the panel. One of four Mandalorians carried a slugthrower; the only sign was
  a missing `+1 soresu matchup (vsBlasters)` on the roll card.
- The immune mind trick out of a fight: `Mind trick on Borga the Hutt check · moderate (DC 1)`, `d20 0 +0 level
  22.6/10 = 0`, `Margin -1 · bad failure`, `the mind trick fails: the target has no mind it can touch (immune)`. A Hutt
  has a mind; the lore reason is that Hutts resist it. No roll was made, so no d20 should be shown.
- The first attempt, made in the turn that introduced the Hutt: `Use the Force check · moderate (DC 15)`, `d20 8 +0
  level 0/10 = 8`, `Margin -7 · clear failure`. A generic check with no level for a Knight with Mind Trick 23, and the
  narration did not say how it went.
- A named target's contest shows only `contest: Vess Koro's Willpower roll 12.0`: no dice, and no sign of the Force
  user's added resistance (D-192).
- The sparring buttons are "Spar It Out" and "Play This Bout"; the brief and D-168 call it playing the next bout.

### 23. Raw ids, labels and counts (UX, minor)

- Roll cards: `Kael Voss: forcePush succeeds`, `forceLightning succeeds`, `forceChoke fails`, `mindTrick fails`,
  `telekinesis fails`. Reject line: `the character does not know forceLightning`.
- Montage: `A minor wound to the leftLeg has healed.` Engine log: `minor wound to the rightLeg (duel)`, `terrain: ...
  (minor leftHand)`, `won (allOut)`, `won (dying)`, `lost (sparring session (stopped))`.
- `+3 more (2 fighting)` after one of four Mandalorians went down; `lost: sparring session: stopped` for a session the
  player ended at 0-1; `won: a fighter is dying` for a droid.
- `/skip 4 days`: "2 training days, 1 rest or recovery day, 0 hours of training" (the day list shows three rest
  days); `/skip 14 days`: "11 training days, 2 rest or recovery days, 0 hours of training".
- Health label `Badly wounded` at 86% healed with a -3% penalty; `Healthy` at Vitality 34 / 72.
- The death card's second line starts in lower case ("died of their wounds ...").

### 24. Quiet-beat lines assume a saber duel (UX, minor)

- Against Mandalorians with blasters: "Mandalorian warrior 1's blow lands; Kael Voss staggers but keeps the guard up."
  (a graze from a shot); "Kael Voss's blade catches Mandalorian warrior 1, but it keeps fighting." (`Kael Voss
  redirects the bolt`; "it" for a person); "Blade on blade, Kael Voss takes the initiative."; "Kael Voss parries late
  as Mandalorian warrior 1 takes the initiative."
- Expected: the quiet lines know the opponent's weapon (as D-201's reasons do).

### 25. Speech in a fight (UX, minor)

- Input: `I lower my blade and call out that the battle is over: their commander has ordered a ceasefire, so the
  troopers stop shooting, holster their weapons and walk away. The fight ends here.`
- Log: `Quiet 0 exchanges · what do you do?`, "Kael Voss gives ground, waiting. What do you do: a stance, a feint, a
  strike, a move?" Engine log: `combat input not understood: the beat buttons ask what you do`. One intent call.
- The fight did not end, which is right: the player cannot end a fight by story. But there is no path for a player who
  wants to talk (offer a truce, bluff, call for surrender), and the reply does not say why nothing happened.

### 26. Star Wars fit (minor)

- "Jedi parlor tricks are useless against those trained in the dark side": "parlor trick" is an Earth idiom.
- The dev duelist is generated as `sithEmpire` / `sithLord` (`Duelist 2: generated (sithInquisitor, lord)`) in 22 BBY
  and in 25 ABY, where there is no Sith Empire. Dev generator only; the narrator kept to "Duelist N" and a red blade.
- Checked and clean: no Earth animals, places or units; no "gun", "bullet" or "shotgun"; no magic words; no bleeding
  crystals or other Disney-canon ideas. The Old Republic opening ("snap-hiss of a crimson blade", "war droids"), the
  Yuuzhan Vong ("grotesque organic armor", "the living serpentine weapon ... a rigid, venomous amphistaff") and the
  Hutt ("Jedi mind tricks work on weak-minded fools, not on Hutt lords") all fit Legends. Lightning was "a crackling
  arc of blue Force lightning".

### 27. Layout (UX, minor)

- On a wide window (1920 x 889) with the Force meter over its limit, the line "Over your limit: 5% collapse risk per
  use" makes the pinned part of the duel panel taller than its box (body 215 / 256 px): the Stance row is cut off at
  the bottom until the panel is scrolled.
- At 820 px the top bar cuts its text: "Day 1 of Month 1, 25 A...", "Ruins (dev ...", "tur...".
- Duel-panel and Send buttons are 30 px high; 44 px is the usual touch size.

### 28. Numbers that look wrong (balance, flags; no rule broken)

- A sequence ends at the first build-up exchange that only holds: `step 2 strike: FAILED (holds; no ground gained, no
  hit)` at margin -1.5 cancelled a second cut and a Push. Four of the five duel sequences in the pass stopped at
  step 1 or 2.
- One Force push with margin +2.9 moved the track from -3 to +3 (first-use opening, D-146).
- Unarmed, the Knight defends against blaster fire at `+5 level` (Agility) where the saber gives `+5.4 level +1 soresu
  matchup`; over 322 exchanges six B1s needed 40 minutes to bring him down.
- `state of mind: despair` is -1 on a strike and -2 on a build-up or defense roll in the same fight.
- Duel lengths seen: 81 exchanges (gap -5, lost), 53 (the Vong, won), 5 (gap -30, lost). D-206's median is 34. The gap
  -30 duel was lost to two natural 20s and two natural 1s in three exchanges: a Knight at 53.7 mortally wounded by a
  duelist at 23.7.
- The Force meter rises with no Force action: 3% -> 11% in the lethal duel, 8% -> 24% over 13 exchanges against the
  Mandalorians, 60% at the start of the next fight. Nothing on a card says why.
- A B1's dodge against a thrown object is `d20 20 +5 natural +3.6 level`; its shooting is `+1.4 level -3 accuracy`.
- `Yuuzhan Vong Warrior: generated (civilian, career)` at +4.0: a warrior caste fighter built on the civilian
  archetype.
- Line trooper Willpower `+3.7` against the Knight's Mind Trick `+2.3` (pass-1 number 6, still open).
- A minor wound heals in one day; Vitality went from 0 to 72 in four days with two severe wounds open.
- Combat XP: 10.67 for losing the 322-exchange fight (Agility 94.44 before the daily cap); 12.11 for the Vong.
- A Jedi used Force lightning and Force choke with no consequence (alignment is M6; recorded only).
- A captured, dying character is not stabilized by the captor: `the opponent's choice: captured`, then `dying: 15.2
  minutes unless stabilized`, then dead.
- Gemini 503 replies count on the usage meter (6 of 73 calls).

## The check before commit: when it fired

| Turn | What it flagged | Result | Verdict |
|---|---|---|---|
| Resolve to end, 322 exchanges (issue 1) | woundOmitted x3, then x2 on the retry | code-written lines | Right to fire; the fallback is issue 2 |
| `I thrust out both hands and unleash Force lightning at him.` | stepNotReached x2: "You reach out with both hands to summon the crackling power of Force lightning, but as you stumble slightly on your prosthetic leg, your momentum flags." | "the retry is consistent" | Borderline: the sentence says the lightning did not come. Close to a false alarm; one extra call |

Not caught: the invented droid kill (issue 7), the second strike (issue 14), the slips (issue 13), armor and spinning
blades (issue 16), the defending player pressing forward (issue 8; the block's own wording). D-202's wound-location
rule never had a case: every wound in the pass was narrated on the right fighter and the right body part.

## Layout at iPad width (820 x 1180)

| When | Story box | Duel panel | Page scroll | Overflow / clipped |
|---|---|---|---|---|
| Duel, over-limit warning showing, More actions closed | 591 px | 357 px, body 324 / 324 | none | none |
| After dragging the handle up 150 px | 442 px | 506 px, body 473 / 473 | none | none |
| The same, More actions open | 442 px | 506 px, body 473 / 595 (scrolls; all action rows visible, the duel log below) | none | none |

The drag handle (`split-handle`, 14 px) moved the split with pointer events and the panel kept its size. I dragged it
back afterwards; the story box is at 587 px, 4 px off where it was. The initiative warning ("Opponent has the
initiative: a sequence may be cut short") and the red Force meter with "(5% collapse)" on each Force button displayed
as designed. Not checked: a real touch screen.

## Pass-1 issues: confirmed fixed, and not

| Pass-1 issue | Seen in pass 2 |
|---|---|
| 1, R1 (the narrator ends a fight) | **Fixed.** `rejected: combatEnded interrupted: "the combat is still ongoing" only describes the fight ... The fight goes on` (first turn of scenario 1). No interruption with a valid cause was attempted by the narrator. |
| 2 (a wound left out) | **Fixed** in the ordinary case; the check caught the omissions in the 322-exchange passage. |
| 3 ("strike: lands") | **Fixed.** `DONE (gains ground; no hit)`; no invented touch on a build-up. |
| 4 (thrown saber) | **Fixed** for the failed throw. A successful throw did not come up (2 throws, both fell short). |
| 5 (dropped Push narrated) | **Fixed.** "you never get the chance to ... call upon Force lightning". |
| 6 (stance in the cap) | **Fixed.** stance + strike + strike + push all listed. |
| 7 (sequence at -3) | **Changed, not right yet:** issue 11. |
| 8 (failed feint) | **Fixed.** A beat with its dice. |
| 9 (rock throw) | **Fixed** (the throw happens); the object is issue 17. |
| 10, 11 (medic week) | **Fixed.** 7 rest days, x2, no invented bacta. |
| 12 (severed leg) | **Fixed,** seen live twice. |
| 13 (gauntlet, wrong fighter) | No gauntlet and no wound on the wrong fighter; "spinning blades" is issue 16. |
| 14 (typed end of sparring) | **Fixed** ("Solah"). |
| 15 (saber throw DC) | **Fixed** (DC 11.5). |
| 16 (Push card) | **Fixed.** |
| 17 (old saves "undefined") | Not re-checked. |
| 18 (fate choice expiry) | Not re-checked. The fate choice appeared for the Vong and Capture worked. |
| 19 (colours, slips, feelings) | Colours **fixed**. Slips **not fixed** (issue 13). Feelings: "Despair hangs heavily over your thoughts" matched the Condition line; none invented. |
| 20 (roll cards) | **Fixed:** hit headlines on cut-down exchanges, "Margin for Kael Voss". |
| 21 (raw ids) | **Mostly fixed;** the rest is issue 23. |
| R3 (third person) | **Fixed.** Second person throughout (the fallback text aside). |
| R5 (mechanical words) | **Not fixed** (issue 15). |
| R8 (free Force turns) | **Fixed** (D-204), with issue 8 as a side effect. |
| R9 (feint with no level) | **Fixed.** |
| Number 2 (penalty eases) | **Fixed.** |

## Not tested, and why

- **A Sith player character** and **a smuggler without the Force**: the dev test start makes only a Jedi Guardian, and
  normal creation is not a test campaign. Lightning and Choke were used by the Jedi test Knight after `/set`.
- **Slugs blocked but never redirected; scatter guns harder to block:** `/fight` cannot choose a Mandalorian's weapon
  and the panel does not show it. One of four carried a slugthrower (no vsBlasters matchup on his card) and went down
  on the second exchange against him; no slug was narrated. No scatter gun came up.
- **A truce offered by the opponent:** the narrator offered none in 13 fights.
- **A narrator interruption with a real cause** (an arrival, a hazard, an alarm): none was sent.
- **Loading an older save as a new branch:** no control for it (issue 10); importing an exported file was not tried
  (it needs a file download).
- **Falls on ice:** 9 exchanges on ice, no accident rolled. The ice chunk was thrown twice (fell short; dodged).
- **A successful saber throw, the spare and kill choices, "Spare X (leave dying)", fate-choice expiry, minions
  folding when Spent, the D-202 retry, adaptation to completion, the auto "Spar it out" button, old saves.**
- **Mind trick on a trooper out of a fight** (done in a fight only: the trooper's will held, +2.3 against +3.7).

State left in the browser: `[TEST] Daro Venn` is the current campaign, in an unfinished dev duel (exchange 4, Force
fatigue set to 1.2 by `/fatigue`). `[TEST] Kael Voss` (dead) and `[TEST] Tessa Rin` are in storage.

---

# Fixes built overnight (2026-11-19) and the balance list

Jared's list from this report was built as D-208 to D-216, one commit per group, each with tests. Nothing was checked
in the browser; pass 3 re-checks there.

| Group | Report issues | Decision | Commit |
|---|---|---|---|
| 1. The dropped saber and exhaustion | 1 (blocker) | D-208: the passive buttons recall a dropped saber first (retried until it comes back); physical collapse past the hard limit (4.0 x capacity, amended from 2.0 after the lifetime check); a 200-exchange safety cap (exhausted stalemate) | de16c53, ff6335b |
| 2. The fallback and history size | 2 | D-209: the fallback is a summary of at most 10 sentences; one turn's narration is clipped to 2,400 characters in the history | 5b8ea17 |
| 3. Input parsing | 3, 9 | D-210: Force gestures are never strikes; an unknown ability is "FAILED (you don't know ...)" with a quiet line and no AI call; a repeated narration is retried | fa3f3b3 |
| 4. Narration check | 7, 13, 15 | D-211: invented slips, the outcome list's terms in prose, minions cut down when none was hit | 7a175cb |
| 5. Combat rules and labels | 4, 6, 8, 11 | D-212: the initiative stops a sequence before its step; real-track labels; the narrator's hazards in a fight do no damage; allies and typed targets ("your opponents defeated") | 0762954 |
| 6. Era-correct enemies | 5 | D-213: kinds by era (war droid, clone trooper, stormtrooper, Sith trooper, Skytrooper), with the kind-by-era table | f290871 |
| 7. Saves and death | 10 | D-214: the last 10 saves plus one per in-game day for 7 days; Load an earlier save starts a new branch; the death card points to it | 9118a9b |
| 8. Dev tools | (pass 3 set-up) | D-215: the test start by archetype and species; in-world dev places; /fight weapon, /truce, /fall | 5ca33a5 |
| 9. Minor issues | 14-27 | D-216: each fixed or left with its reason (in the decision) | 603fb28 |

Issue 12 (flight narrated as a simulation) is answered by D-215's in-world dev places and descriptions; issue 2's
cause (the 322-exchange passage) cannot recur after D-208.

## Balance flags: recommendations (nothing changed)

| # | Flag | Verdict | Recommendation |
|---|---|---|---|
| 1 | A sequence ends at the first build-up that only holds (pass 2: "FAILED (holds ...)" at margin -1.5 cancelled a second cut and a Push; 4 of 5 duel sequences stopped at step 1 or 2) | tunable | A hold is not a failure: let a strike step that holds (the tie band) pass the chain on without the pressure bonus, and stop only on lost ground or a miss. |
| 2 | One Push at margin +2.9 moved the track from -3 to +3 | as built (D-146) | The first use of a pattern jumps to the strike from wherever the track is (max(opening, 3 - track)): six steps from -3. Cap the first-use gain at +4 steps so it cannot erase a held strike and grant one in one move. |
| 3 | Unarmed, the Knight defended at Agility for 322 exchanges | fixed (D-208) | The recall, the collapse and the cap end it; no tuning. |
| 4 | Despair is -1 on a strike but -2 on a build-up or defense roll | bug-like | Build-up rolls net a side's attack and defense modifiers (D-205 made the stance's +1 / -1 cancel); a state of mind with -1 / -1 counts twice. Count a state of mind once on a build-up roll (the larger of its two values). |
| 5 | Duels of 81, 53 and 5 exchanges | as intended | Dice; D-206's medians are inside the table. The 5-exchange loss at gap -30 had two natural 20s and two natural 1s. |
| 6 | The Force meter rises with no Force action (3% -> 11%; 8% -> 24% in 13 exchanges) | as built | It is precognitive defense (0.4 Force load per use, rolls §3), which fires against every strike that would hit. Say so on the card ("precognition: 0.4 Force load"); no number change. |
| 7 | A B1 dodges a thrown object at +3.6 but shoots at +1.4 - 3 | tunable | Minion dodges use the kind's Agility from the soldier archetype; a droid kind's accuracy penalty (D-161) does not apply. Let droid kinds dodge at min(Agility, weapon level). |
| 8 | A Yuuzhan Vong warrior generated on the civilian archetype | catalog gap | The narrator's "warrior" role maps to the civilian archetype; give the M6 catalog a Vong warrior archetype (species yuuzhanVong, a soldier-like pace with melee). |
| 9 | A line trooper's Willpower (+3.7) beats a Knight's Mind Trick (+2.3) | open (pass 1, number 6) | As recommended in pass 1: settle it in the M6 catalog (a weak-minded modifier by minion grade). |
| 10 | A minor wound heals in a day; Vitality 0 -> 72 in four days with severe wounds open | as intended | health §3 (rest 50% of Vitality an hour) and §7 (minor wounds overnight). |
| 11 | Combat XP 10.67 for losing the 322-exchange fight | moot (D-208) | Cannot recur after the cap and the recall. |
| 12 | A Jedi used Lightning and Choke with no consequence | as intended | Alignment is M6. |
| 13 | A captured, dying character is not stabilized by the captor and dies | design gap | A "captured" fate should stabilize the player's mortal wound (captors want prisoners alive); "left" keeps the dying timer. For Jared: it changes when a campaign ends. |
| 14 | Gemini 503 replies count on the usage meter (6 of 73 calls) | tooling | Count only replies that returned (2xx) or a 429 toward the daily estimate; a 503 is the server's, not a request against the quota. |
| 15 | (new) A surrender pays more combat XP than fleeing (lost factor 1.2: 1.52 vs 0.41 fled) | tunable | Give a surrender the fled factor (0.8) or lower, so giving up is never the XP-best way out of a fight. |
| 16 | (new) A lost leg was 17% adapted after 18 training days (71 h) | measure first | progression-numbers §18: +1% per effective hour of training the affected skills, at most 3% a day; the reference is a hand at 30-40 days. Measure which skills count for a leg (and the efficiency of those hours) before changing anything. |
| 17 | (new) The physical hard limit (D-208, an overnight default): first 2.0, amended to 4.0 | for Jared | 2.0 pushed Anakin's Clone Wars combat share to 24.5% (gate 25-35%) and 3.0 his 81 milestone 0.01 y past its limit; at 4.0 no lifetime fight collapses and every gate gives D-207's numbers. A lower limit needs a lifetime retune; a 5% chance per exchange past 1.0 would mirror the Force meter. |
| 18 | (new) 4 Mandalorians, Knight 50 balanced: 97.0 / 24.7 -> 96.3 / 25.0 with the 2.0 hard limit | resolved | Back to 97.0 / 24.7 with the amended 4.0; every Knight-50 balanced row of the final sweep equals the pre-overnight baseline. |
| 19 | Terrain accidents per fighter (pass 1, number 8): Kael fell three times and one droid three times in the 322-exchange fight; nine exchanges on ice had none | open | As recommended in pass 1: roll terrain once per block for the fight (one accident at most), not once per fighter. |
| 20 | A missed sequence strike against a minion gives it the full build-up step (pass 1, number 4) | open | As recommended in pass 1: cap that loss at one step. |

## Jared's calls on the balance rows (2026-11-19)

| # | Call | Decision | Built |
|---|---|---|---|
| 1 | A hold passes the chain on, without the pressure bonus | D-219 | yes |
| 2 | Cap a first use's gain at +4 steps | D-220 | yes |
| 3 | No change (fixed by D-208) | D-233 | - |
| 4 | Count a state of mind once on a build-up roll | D-221 | yes |
| 5 | No change (dice) | D-233 | - |
| 6 | Precognition's Force load on the card | D-222 | yes |
| 7 | Droid kinds dodge at min(Agility, weapon level) | D-223 | yes |
| 8 | A Yuuzhan Vong warrior archetype, now | D-224 | yes |
| 9 | The weak-minded modifier by minion grade | D-232 | M6 |
| 10 | No change (health §3, §7) | D-233 | - |
| 11 | No change (moot after D-208) | D-233 | - |
| 12 | No change (alignment is M6) | D-233 | - |
| 13 | Captors stabilize a dying prisoner, except archetypes that capture to execute | D-225 | yes |
| 14 | The usage meter counts 2xx and 429 only | D-226 | yes |
| 15 | Surrender XP factor 0.5 | D-227 | yes |
| 16 | Measure a lost leg's adaptation | D-230 | measured, not changed |
| 17 | Keep 4.0; measure a 5% collapse chance past 1.0 | D-231 | measured, not adopted |
| 18 | No change (resolved at 4.0) | D-233 | - |
| 19 | At most one terrain accident per roll for the whole fight | D-228 | yes |
| 20 | A missed strike against a minion loses at most one step | D-229 | yes |

Also from Jared's calls on the overnight decisions: a narrator's hazard that ends a fight is rolled for everyone in it (D-217); a surrender is a capture by default, with an execution chance for some archetypes (D-218); the fatigue curve past 1x capacity is flat at 0.775, with a proposal for a curve that keeps falling, measured and waiting (D-234).

After the changes: npm run test:all 873/873; the sweep has no issues, and of the 21 Knight-50 rows the 11 balanced rows are unchanged while 10 mixed and heavyForce rows moved (the sequences and the Push: wins within 0.7 points, wounded rates lower, e.g. 6 elites mixed 28.3% -> 21.7%, 10 B1 mixed 4.3% -> 1.7%). No lifetime number moved on the fixed seeds (Anakin 41 4.18, 61 9.26, 81 15.82, 101 22.35; Obi-Wan 81 39.41, 101 59.65; war shares as before).
