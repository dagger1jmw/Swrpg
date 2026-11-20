# Combat pass 5 (2026-11-20)

Scope: the smoke test of the pass-5 handoff in `docs-v2/progress.md` (items A to K): the pass-4 fixes (D-245 to
D-250) and everything built since (D-251 to D-267). Part A is the engine checks. Part B is a browser pass in Chrome on
`http://localhost:5173/?dev=1`, test campaigns only. Nothing was fixed during the pass. Build under test: commit
e7a5899.

How the pass was run:

- Four test campaigns from the dev test start: Joren Tal (Jedi Guardian Knight, 30, 22 BBY), Daven Rook (Knight, 30,
  26 ABY, the pass-3 Vong scenario), Varek Thane (Sith Warrior, rank "Sith Lord", 30, 3,653 BBY) and Rell Tarn
  (smuggler, 30, 3,653 BBY).
- Dev commands did the set-up and every check that needs no narrator. About 165 dev fights were run with
  `/exchanges 400`; Load an earlier save and a beat button then narrated the chosen ones with the same dice.
- One new tab only, closed at the end. The API key was already saved in the browser; it was never read or typed, and
  the game never asked for it.
- The Chrome window would not resize (as in passes 3 and 4), so the iPad layout was measured in an 820 x 1180 frame
  of the same page.
- The narrative model was `gemini-3.5-flash-lite`. Nothing in Settings was changed.

**AI calls: 23 answered of the 25 allowed** (usage meter 0 -> 23). Three of the 23 were retries asked by the
narration check; none was a chapter summary. **503s, counted apart: 6 simulated** (`/simulate 503 2` and
`/simulate 503 4`) **and 1 real** (from `gemini-3.8-flash`, the fallback model, during the simulated run).

| Scenario | Answered calls |
|---|---|
| Joren: opening; To key moment (with 2 simulated 503s); the same beat again from the save; Resolve to end (a duelist loses a leg) and its check retry; Spare; Resolve to end against 6 thugs and its check retry | 8 |
| Daven: opening (the narrator's Vong); the opening's choice; Resolve to end against a dev Vong warrior; Narrate (after 4 simulated 503s, a real 503 on the fallback model, and Retry) | 4 |
| Varek: opening; Resolve to end (a duel at gap 0) and its check retry; Kill (a surrendered duelist) | 4 |
| Rell: opening; Narrate in ruins; the typed "dive behind the crates" turn (2); Surrender; Resolve to end (captured by stun); Narrate in the capture fight | 7 |
| **Total** | **23** |

## Part A: engine checks

- `npm run test:all` (PowerShell): **104 files, 1,038 tests, all passed** (182 s of tests, 183 s wall; lifetime
  tests included).
- `npm run sweep` (PowerShell): **9,840 fights in 36.6 s (39 s wall); "Issues (broken behaviour): none".** Knight at
  50, balanced: 10 B1 100.0 won / 0.7 wounded; 10 militia 100.0 / 0.3; 6 troopers 99.3 / 6.3; 6 elites 97.3 / 22.3;
  4 Mandalorians 97.3 / 17.0; 6 B2 99.7 / 1.7; 4 droidekas 99.0 / 4.7. heavyForce: 68.3 to 92.7 won. Capture rows:
  troopers 100.0 / 0.0, elites 97.7 / 0.0 (captured 2.3), Mandalorians 96.7 / 0.0 (captured 3.3), B2 and droidekas
  equal to their kill rows. Cover rows: Knight vs 6 troopers 99.7 / 7.0 (balanced), 100.0 / 5.0 (mixed); smuggler 30
  vs 4 troopers 67.0 / 71.3 on flat ground, 77.3 / 67.3 in cover. Counts: Force push 9,692 successes; saber throw
  16,963; recall 10,691. These match the D-262 to D-267 entries.

## Summary

| # | Category | Severity | Issue |
|---|---|---|---|
| 1 | balance / Star Wars fit | **major** | Sith tactical withdrawal ends most duels the player is winning: 40 of 58 won duels against dev Sith duelists, most of them with the Sith unwounded, twice at exchange 2 |
| 2 | bug (narration check) | **major** | A natural 1 told as a "misstep" is flagged as a slip (rule 9) every time: 3 retry calls of the pass's 23, and one fight replaced by the code-written summary |
| 3 | bug | **major** | "Load an earlier save" shows a stale list: once the campaign menu has been opened, later saves never appear until a save is loaded or the page is reloaded |
| 4 | bug / balance | major | The narrator's Yuuzhan Vong warrior now has his Vitality, amphistaff and armor, but fights at level +0.4 and is worth 0 XP (dev Vong minions: +3.5 to +4.3) |
| 5 | narration | major | Resolve to end on a 51-exchange capture fight was told as two sentences of aftermath; the fight, the stun hits and the capture itself are missing |
| 6 | bug | minor | Every ended fight that is not a capture sends both "The fight is over" and "The fight goes on" in the block |
| 7 | bug | minor | The code-written summary leaves out a morale break (a surrender); the log does not show what the retry got wrong |
| 8 | bug (dev) | minor | `/archetype bountyHunter` leaves a Sith duelist's withdrawal on: no surrender in 24 tries; the handoff's named-surrender check only works on a non-Sith duelist |
| 9 | bug / UX | minor | The withdrawal's card: "Duelist 1 gains ground · track +1 → +0" on an exchange the player won by 9.9 |
| 10 | UX | minor | A hit on a prosthetic limb reads "critical hit on Joren Tal · no wound" with no place and no reason |
| 11 | narration | minor | Engine words in prose, not caught: "stamina" (twice), "endurance", "outpaced" (twice), "seizes the initiative", "a dozen breathless exchanges" |
| 12 | narration | minor | The opening's own choice is "not understood" as a combat input; its narration tells blows at exchange 0 and repeats the Intent line; a Force push is offered against the Vong |
| 13 | narration / consistency | minor | Kill on a surrendered duelist was told as an escape from restraints, with "the remaining Jedi" and a relationship change on another duelist (partly dev-made) |
| 14 | narration | minor | Left from pass 4 and seen again: grazes given a body part; "Regaining your footing"; a stun bolt "squarely in the chest" |
| 15 | Star Wars fit | minor | "iron meeting iron" for lightsabers; "bulkhead" and "deckplates" in Temple quarters and a citadel; dev-made scenes (list below) |
| 16 | UX | minor | "/intent capture" answers "fights to capture (no way to subdue, unchanged ...)"; the model picker is cut at 820 px; 30 px buttons |
| 17 | balance | flag | Numbers for Jared (list below) |

What worked as specified: a fitted cybernetic leg stands and fights from the first exchange, with the form penalty,
the lower Vitality maximum and the lower capacity, all climbing back as the leg adapts (D-245, D-251, D-252, D-255);
a prosthetic arm keeps the dominant hand and the duel watches the right arm (D-253); no name-matching false alarm
after 23 earlier duelists (D-247); the busy note, the model fallback and the same dice after simulated 503s (D-250);
the Vong's amphistaff and "vonduun crab armor (resists lightsabers)" on the card, Push and Mind trick immune (D-248);
a minion breaking and a named opponent surrendering with Spare / Capture / Kill (D-256); the Intent line and the hit
locations by intent, sabers severing, a vibroblade severing once on a critical hit, a blaster never (D-260); capture
by stun with no wound and no fate roll, and the fallback for a fighter with no means (D-262); a withdrawing Sith
with "Withdrew" and no fate choice (D-263); no blaster killing blow under margin 30 in 45 hits (D-267); the cover
beat told with cover; the surrender with the captors and their rifles; the layout at 820 px. No chapter summary
was spent on dev turns (pass 4 issue 13). No Earth unit, firearm word, magic term, Disney-canon element or era
mistake appeared.

## Issues

### 1. Sith tactical withdrawal ends most won duels (balance / Star Wars fit, major)

- Input: `/fight 1 duelist at -10` (or `at -12 stakes lethal`, `at 0`, `at 10 stakes lethal`), then `/exchanges 400`,
  for Joren (22 BBY) and Daven (26 ABY). The duelists are `generated (sithWarrior, lord)` or `(sithInquisitor, lord)`.
- Log, the first four duels of the pass:
  `35 exchanges · the fight ended · won: the opponents broke (surrendered, fled or withdrew)` (one graze on him);
  `26 exchanges · ... won: the opponents broke` (no hit on him, gap 0);
  `8 exchanges · ... | Duelist 3 withdraws: breaks off the fight and escapes, out of the fight` (no hit);
  `2 exchanges · ... | Duelist 4 withdraws: breaks off the fight and escapes, out of the fight` (no hit).
- Counts over the pass (dev duels against Sith duelists that the player won): **40 of 58 ended by withdrawal**
  (Joren's plain duels 11 of 17; his `/archetype bountyHunter` set 10 of 14; Daven's three sets 8 of 13, 5 of 7 and
  6 of 7). In Joren's 11, the Sith had a severe wound twice and no wound (a graze at most) nine times. Shortest: 2, 2, 3, 4, 6, 7, 8
  exchanges.
- Narration (the first one, told correctly): "the duelist catches an opening, leaps backward through the shattered
  transparisteel window into the Coruscant sky-lanes, and vanishes into the traffic stream."
- Expected: D-263, "a named Sith duelist who is losing (a severe or worse wound or a sever this exchange, Spent this
  exchange, or the track swinging to 4 against it) withdraws with its archetype's chance", with Dooku, Ventress and
  Grievous as the model. The rule works as written. The third trigger is the problem in play: the track reaches 4
  against a fighter every few exchanges of an ordinary duel (it did on exchange 2 twice), so a 30% roll each time
  adds up to most duels. A Sith Lord who leaves an even fight unhurt after two exchanges does not read as Dooku
  breaking off a lost duel.
- Severity major: it decides how most Sith duels end, and a withdrawn Sith leaves no fate choice. For Jared; no
  number was changed. Candidates to measure: drop the track trigger, or require a wound or Spent first.

### 2. A natural 1 told as a misstep is flagged as a slip (bug in the narration check, major)

- Inputs: Resolve to end, three times (Joren against Duelist 24, Joren against 6 thugs, Varek against Duelist 1).
- Log:
  - `narration check: 2 contradiction(s) with RESOLVED (slipNoHazard, mechanicalTerms): "You trade more frantic
    blows, back and forth across the room, until his rhythm falters with a sudden misstep."; retrying once`, then
    `the retry is consistent`. The block had `Duelist 24 rolled a natural 1: opening for Joren Tal`.
  - `... (slipNoHazard, mechanicalTerms): "You draw your blue blade, but a misstep throws your stance off balance as
    the first bolt scorches past."; retrying once`, then `still contradicting RESOLVED (sever, mechanicalTerms,
    mechanicalTerms); code-written summary used instead`. The block had `Joren Tal rolled a natural 1: opening for
    Thug 1`.
  - `... (slipNoHazard, mechanicalTerms): "As the bout presses on, you are outpaced, a fraction of a second too slow
    as a natural misstep leaves your defense wide open."; retrying once`, then `still contradicting RESOLVED
    (mechanicalTerms); engine terms reworded in code`. The block had `Varek Thane rolled a natural 1: opening for
    Duelist 1`.
- Expected: a natural 1 is in the block as an opening, and "a misstep" is the narrator's ordinary way to tell it. It
  is not a fall and no terrain accident is claimed. Either rule 9 should let a stumble word stand in a sentence
  about a fighter whose natural 1 is in the passage, or the prompt should say how to tell a natural 1 without
  footing words. The engine-word part of the third firing ("outpaced", "natural") was right.
- Cost: every narrated passage with a natural 1 in it risks a second call. Here 3 of 23 calls, and the thug fight
  lost its narration (issue 7). Pass 4 had no rule-9 firing at all ("as he overextends" passed then).

### 3. "Load an earlier save" shows a stale list (bug, major)

- Input (Daven): open the menu's Campaign tab at turn 14 and close it with no load; run five dev commands (turns 15
  to 19); open the Campaign tab again.
- Seen: `CURRENT CAMPAIGN [TEST] Daven Rook · turn 19` over a list whose newest entry is `turn 14` (turns 5 to 14).
  One more command (turn 20) and a third opening: still turn 14 at the top. Loading turn 14 and playing on brought
  the list back to date.
- Cause (read, not changed): ui/app.ts line 854. `renderEarlierSaves` fills `this.saves` once per campaign id and
  only `loadEarlier` (line 877) clears it, so the list is the one from the first time the menu was opened.
- Expected: D-214, "the last 10 saves". A player who opens the menu early in a session, plays an hour and dies gets
  the death card's "Load an earlier save" with an hour-old list. The saves exist; a page reload shows them.
- Severity major: it is the recovery path after a death.

### 4. The narrator's Yuuzhan Vong warrior fights at +0.4 (bug / balance, major)

- Scenario (dev test start, 26 ABY), as in passes 3 and 4: `A rocky hillside on Dantooine during the Yuuzhan Vong
  invasion. A lone Yuuzhan Vong warrior in vonduun crab armor, amphistaff in hand, charges me.`
- Fixed since pass 4: the panel shows `Yuuzhan Vong Warrior | 56 / 56 | fighting · amphistaff · vonduun crab armor
  (resists lightsabers)`; the Force row shows `Push (immune)` and `Mind trick (immune)`; the log has `Yuuzhan Vong
  Warrior: generated (yuuzhanVongWarrior, career)`.
- The problem: `Daven Rook: d20 11 +5.4 level -1 footing = 15.4 | Yuuzhan Vong Warrior: d20 7 +0.4 level -1 footing
  = 6.4`. The fight (`/exchanges 400`): 32 exchanges, `#3 strike · solid hit on Yuuzhan Vong Warrior · moderate
  wound, torso`, `#11 strike · solid hit on Daven Rook · minor wound, torso`, `#32 strike · critical hit on Yuuzhan
  Vong Warrior · mortal wound, torso`, `combat XP 0.00 (serious, won)`.
- For comparison in the same campaign, `/fight 3 yuuzhanVongWarrior`: `Yuuzhan Vong warrior 1 | 72 / 72 | minion ·
  amphistaff · vonduun crab armor (resists lightsabers)`, `+3.5 level +1 numbers`; the two fights ran 149 and 144
  exchanges and wounded the Knight five times each (one severe). `/fight 1 yuuzhanVongWarrior`: `74 / 74`, `+4.3
  level`.
- Expected: D-246 gives the pass-4 warrior "melee 13.8 ... the level of a grade-1 dev warrior (14.0)", which would
  read +1.4. This one reads +0.4, so his seeded start age left him a few months of training (D-246's "not changed"
  note). A named warrior of the warrior caste, "trained from youth" (npcGen.config's own note), should not be a
  tenth of his caste's minions or worth 0 XP.
- Not narrated to the end: see "Not tested".

### 5. A capture fight told as its aftermath (narration, major)

- Input (Rell): `/fight 4 trooper alive`, then Resolve to end.
- Log: `51 exchanges · the fight ended · lost: subdued and taken captive`; `#4 strike · solid hit on Line trooper 1 ·
  minor wound, torso`; `#13 strike · graze hit on Rell Tarn · no wound`; `#22 strike · clean hit on Rell Tarn · no
  wound`; `#30 strike · solid hit on Line trooper 1 · minor wound, torso`; `Rell Tarn shoots down Line trooper 1`;
  `#51 strike · clean hit on Rell Tarn · no wound`; `Rell Tarn is Spent and subdued: taken captive`; `captured by: 3
  line troopers`. The block's line: `Intent: Line trooper 1 fights to capture: subdues with blaster bolts on stun (no
  wounds; takes Rell Tarn captive when Spent); ...`.
- Narration, all of it: "Bound and disarmed, you are led through the winding stone corridors of the ancient ruins.
  The troopers keep their blaster rifles close, maintaining a watchful silence as they march you deeper into the
  shadow of the structure."
- Expected: the fight told from the block (the trooper shot down, the three stun bolts, the capture when Spent), as
  D-242 item 11 did for long passages in pass 4. It tells a capture and no injury (D-262), and the weapon is right,
  but nothing of the fight is there, and no check fired because nothing was contradicted.
- Context: the turn before in the transcript was the Surrender scene of the fight before ("They bind your wrists
  with rough binders"), so the narrator carried on from a capture already told. A dev-made order, but a player who
  is captured, escapes and is taken again would meet the same thing.

### 6. "The fight is over" and "The fight goes on" in one block (bug, minor)

- Seen in the Debug tab for Resolve to end against 6 thugs: `The fight is over: won (allOut). The choices are story
  choices again (what the character does next), not tactical moves.` followed directly by `The fight goes on: end at
  the last exchange, at the moment the player chooses again.`
- Cause (read, not changed): turn/context.ts lines 465 to 468. The `else` belongs to `if (c.ended?.captors)`, not to
  `if (c.ended)`, so every ended fight without captors gets both lines.
- Expected: one or the other. The narrator ended each fight correctly in this pass, so no harm was seen.

### 7. The code-written summary leaves out the surrender (bug, minor)

- Input (Joren): `/fight 6 thug`, Resolve to end (the turn of issue 2's second firing).
- Log: `Thug 4's morale breaks: surrenders, out of the fight`; the block had `Morale: #12 Thug 4 surrenders. Each is
  out of the fight: tell the surrender or the flight as it happened, no more blows on them.`
- What the player read: "16 exchanges of fighting: Joren Tal lands 5 hits (5 wounding) and takes 0 hits (0
  wounding). Joren Tal hits Thug 1: mortal wound to the torso. ... Joren Tal hits Thug 6: moderate wound to the left
  leg. 1 strike or attempt did not land. The fight is over: won."
- Expected: the summary names Thug 4's surrender; the next choice was "Secure the surviving prisoners", which only
  the surrender explains. The end card was right: `Thug 1: Dying · Thug 2: Out of the fight · Thug 3: Out of the
  fight · Thug 4: Surrendered · ...`.
- Also: the log line for a failed retry names the rules (`sever, mechanicalTerms, mechanicalTerms`) but not the
  sentences, so the "sever" that the retry got wrong cannot be read anywhere.

### 8. `/archetype` keeps the Sith withdrawal (bug, minor; dev only)

- Input (Joren), the handoff's item F: `/fight 1 duelist at -10`, `/archetype bountyHunter`, `/exchanges 400`, 24
  times.
- Log: `[DEV] Duelist 25: archetype bountyHunter`, then `Duelist 25 withdraws: breaks off the fight and escapes, out
  of the fight`. Of the 24: 10 withdrew, 1 fled (`Duelist 32's morale breaks: disengages and flees`), 3 were killed,
  10 won; none surrendered.
- Cause (read, not changed): turn/devCommands.ts line 495 sets the fighter's `morale` from the new archetype and
  leaves `withdraw` from the generated Sith archetype.
- The check was done on a Jedi duelist in Varek's campaign instead (see the handoff table).

### 9. The withdrawal's card line (bug / UX, minor)

- Log (Joren, fight 1): `#36 exchange · Joren Tal gains ground · track +0 → +1 | ... Margin for Joren Tal +4.9`, then
  `#37 exchange · Duelist 1 gains ground · track +1 → +0 | Joren Tal: d20 16 +4.1 level = 20.1 | Duelist 1: d20 6
  +4.2 level = 10.2 | Margin for Joren Tal +9.9 · 8 s | Duelist 1 withdraws: breaks off the fight and escapes, out of
  the fight`.
- Expected: the exchange the player won by 9.9 (the swing that set off the withdrawal) should not read "Duelist 1
  gains ground"; the label seems to follow the track going back to 0. Not traced.

### 10. A hit on a prosthetic limb (UX, minor; one note for Jared)

- Log (Joren, right arm and left leg cybernetic): `#5 strike · clean hit on Joren Tal · no wound | Margin for Joren
  Tal -14.2`; `#10 strike · critical hit on Joren Tal · no wound`. Under `/intent disarm`, eight duels gave him 10
  such lines.
- Cause (read, not changed): engine/duel.ts line 446, "a prosthetic takes the hit instead of the body: Vitality
  only, no wound, no sever (equipment damage arrives with M8; D-164)". The card (ui/duelPanel.ts line 104) prints
  "no wound" with no place.
- Expected: the place and the reason on the card ("right arm (cybernetic): no wound"). As it is, a critical
  lightsaber hit that does nothing looks like a bug.
- For Jared: until M8, a fighter whose weapon arm is cybernetic cannot be disarmed or hurt there. A Sith striking to
  disarm spent most of his hits on it.

### 11. Engine words in prose (narration, minor)

Rule 10's repair worked three times (see the firings table). Not caught:

- "your blade grazing his torso, leaving his stamina taxed, while he returns a sharp strike that tests your own
  endurance" (the replay of Joren's first duel; the first telling's "taxes your stamina" was caught).
- "though your stamina holds against the shock" (Rell, a stun bolt).
- "your swift footwork outpaces their guard" (Daven); "you are forced outpaced across the uneven floor" (Rell;
  broken grammar too).
- "Line trooper 1 presses forward and seizes the initiative" (the card: `Opponent has the initiative`).
- "For a dozen breathless exchanges" (the block's count as a word).
- One repair left a clumsy sentence: "dropping the fierce invader unable to fight on" (from "out of the fight").

### 12. The opening's choice starts the fight without an exchange (narration, minor)

- Input (Daven): the opening's first choice, "Draw your lightsaber and meet the charge". The opening had `applied
  combatStarted (fight deferred to the next turn (D-29))`; a dev command in between did not start it.
- Log: `The fight begins · 0 exchanges · what do you do?`, `combat input not understood: the beat buttons ask what
  you do`, one narrative call.
- Narration: "The Yuuzhan Vong warrior lunges forward with feral speed, the dark amphistaff hissing like a living
  serpent as it lashes out toward your torso and head. You step smoothly into your stance, the blue blade parrying
  the swift, unnatural strikes with practiced precision, deflecting each blow harmlessly away. The warrior presses
  the assault, but your defense holds firm."
- Expected: no blows told at exchange 0; "toward your torso and head" is the block's `Intent: ... strikes to kill
  (torso and head)` read back. The narrator's own choice should count as the first beat or cost no call. The next
  choices included "Use a Force push to create space" against an opponent whose Push button reads "(immune)".

### 13. A fate told as another scene (narration / consistency, minor; partly dev-made)

- Set-up (Varek): he lost his first duel and was `captured by: Duelist 1` (narrated). Eight dev duels later,
  `Duelist 8's morale breaks: surrenders, out of the fight`, `won: the opponents broke`, and Spare / Capture / Kill
  Duelist 8 were offered.
- Input: Kill Duelist 8. Log: `npc:duelist-8: kill`, `Duelist 8 dies (killed by the player at incapacitation)`,
  `applied relationshipChanged (npc:duelist-1 relationship 0 -> -5)`.
- Narration: "As the Jedi leans in to tighten your restraints, you whip your legs upward with devastating force,
  catching them off guard. Before they can react, you summon a burst of telekinetic energy, hurling them hard
  against the stone bulkhead. They slump to the deckplates, motionless. The remaining Jedi recoil in shock ..."
- Expected: the kill of Duelist 8, who had surrendered with a severe head wound. Told instead: an escape from the
  captivity of nine fights earlier, a Force throw with no roll, Jedi who are not in the scene, and a relationship
  change on the first duelist. No check fired. The stale captivity is dev-made; the missing name and the invented
  Jedi are not.

### 14. Left from pass 4 and seen again (narration, minor)

- Grazes given a place the block does not have: "A swift strike grazes the duelist's torso" (Joren); "your bolts
  stinging Line trooper 1 across the torso and leaving shallow burns along their arm and hand" (Rell; the torso hit
  is in the block, the arm and hand are two grazes).
- "Regaining your footing" and "catches you off balance" with no accident in the block (Rell, the cover beat).
- A stun hit has no location (D-262); told as "A sudden blue-white stun bolt strikes you squarely in the chest".

### 15. Star Wars fit (minor)

- "iron meeting iron in a relentless exchange" for two lightsabers.
- "collapses against the bulkhead" in a Knight's Temple quarters; "permacrete bulkheads" and "deckplates" in a
  citadel on Dromund Kaas.
- "dark armor and helm" on a Yuuzhan Vong warrior; "the creature's advance" for him.
- Dev-made, as in pass 4: a Sith Lord attacks in a Knight's quarters in the Jedi Temple in 22 BBY and leaves by "the
  shattered transparisteel window" (the window was whole in the opening); a lone Jedi Knight holds a Sith Lord
  captive "within your own storm-swept citadel".
- Checked and clean: Dromund Kaas and the Treaty of Coruscant in 3,653 BBY; Tython and "the displaced Jedi Order";
  line troopers and war droids in 3,653 BBY (`no B2 super battle droids in 3653 BBY: war droids instead`); "brawlers"
  for a Vong request in 22 BBY; a red blade for the Sith player, green for the Jedi, blue for the Knights; blue
  stun bolts; "vonduun crab armor turns aside your thrusts"; the amphistaff "writhing"; a cauterized stump.

### 16. Labels and layout (UX, minor)

- `/intent capture` on a duelist with no means: `[DEV] Duelist 9 fights to capture (no way to subdue, unchanged:
  Duelist 9)`. The first half says the opposite of the second.
- At 820 px the model picker is cut ("gemini-3.5-flash-lite (") and the turn number is hidden. Duel-panel buttons
  are still 30 px high (left for Jared by D-216).
- The engine log still prints `the opponent's choice: killingStrike`; the end card no longer does.

### 17. Numbers for Jared (balance, flags; no rule broken)

1. **Sith withdrawals:** issue 1.
2. **A duelist striking to disarm still kills.** Daven, whole, against duelists 10 above with `/intent disarm`, 10
   duels: 4 lost, wounding hits `right hand severed` twice, `left leg severed` once, torso twice. With a prosthetic
   weapon arm (10 duels): torso 8, of which 4 mortal, and the log had `the opponent's choice: killingStrike` after two of
   the others. D-260 as written (weights, not a promise); recorded only.
3. **Hit locations by intent** (wounding hits on the Knight, duelists 10 above and 10 below): kill, 24 duels (the
   Knight not whole in all of them): torso 14, head 3, legs 4, right arm 1. Disarm, 10 duels on a whole Knight:
   right hand 2, torso 2, left leg 1. Jedi duelists against the Sith Lord (disarm by archetype): hands 2, legs 3.
   Small samples; the direction is right.
4. **A Knight on two prosthetics loses to duelists 10 and 12 below:** Joren (leg 64% adapted, arm 0%, roll level
   +3.0 against +4.2) lost 14 of 43. As built (D-251, pass 4 flag 7); it is a long time to be this weak.
5. **The smuggler against 4 line troopers on flat ground won 11 of 12** (26 to 137 exchanges); the sweep row says
   67%. Sample noise or the dev start's level; one loss, by Vitality.
6. **Blaster wounds by margin** (45 hits on the smuggler): graze 4.2 to 7.5, solid 8.7 to 11.4, clean 11.8 to 15.2,
   critical 15.6 to 23.5; the worst wounds were `critical wound, torso @23.5` and `critical wound, left arm @22.5`.
   No hit reached margin 30.
7. **Lightsaber hits on the smuggler do not follow the card's margin:** `solid hit · moderate wound, right arm` at
   21.1 and `solid hit · minor wound, right arm` at 13.0, next to `clean hit · left arm severed` at 12.2 and `clean
   hit · mortal wound, torso` at 12.3. The blaster hits above are in order. Not traced; a question.
8. **Vong minions:** three grade-3 warriors took the Knight 144 and 149 exchanges and ten wounds; one warrior at
   +4.3 fell in 11 to a `moderate wound, head`. `combat XP 0.00` each time (the daily cap had been reached).
9. **A duel at gap 0 ended at exchange 3** with a `critical hit · mortal wound, torso` on the player's natural 1
   (Varek). The Jedi duelist then chose `captured` and stabilized him.
10. **Vitality after a mortal wound:** Varek, stabilized by his captor, shows `VITALITY 69 / 69` with `stabilized
    critical · torso`; Joren, dying, showed `0 / 68 (spent)`. Possibly as built (the duel was 3 exchanges long); a
    question.

## The check before commit: when it fired

Five firings in 15 narrated fight and fate turns; three retries.

| Turn | What it flagged | Result | Verdict |
|---|---|---|---|
| Joren, To key moment | engine term: "punishing pressure that taxes your stamina" | "reworded in code, no retry": "that wears you down" | Right |
| Joren, Resolve to end (Duelist 24) | slipNoHazard, mechanicalTerms: "his rhythm falters with a sudden misstep" | retry; "the retry is consistent" | **Arguable** (issue 2) |
| Joren, Resolve to end (6 thugs) | slipNoHazard, mechanicalTerms: "a misstep throws your stance off balance" | retry; still flagged (sever, mechanicalTerms x2); the code-written summary | **Arguable**, and the summary lost the surrender (issues 2, 7) |
| Daven, Resolve to end (Vong) | engine term: "dropping the fierce invader out of the fight" | reworded: "unable to fight on" | Right |
| Varek, Resolve to end | slipNoHazard, mechanicalTerms: "you are outpaced ... as a natural misstep leaves your defense wide open" | retry; still mechanicalTerms; "engine terms reworded in code" | Half right ("outpaced", "natural"); the slip is issue 2 |

No lastingState, captor or weapon firing, and no false alarm from a name (Spare after 23 earlier duelists).

Engine against narration, turn by turn: every HIT, NO HIT, DONE, FAILED and NOT REACHED in the narrated turns was
told as resolved, with these exceptions: issue 5 (nothing told), issue 12 (blows at exchange 0), issue 13 (another
event told), issue 14 (grazes placed). The typed "I dive behind the crates and fire back" gave `step 1 maneuver
(position): FAILED (loses ground; no hit)`, `step 2 strike: NOT REACHED (an earlier step failed)`, and was told
right: "You do not get a clear shot off; the barrage pins you down". It queued a review entry (`applied
reviewQueued`). Wounds were on the right fighter and place in every telling that had them (the severed left leg "at
the knee", the mortal torso thrust, the Vong's head). No blade color or weapon outside the lists; no feelings
given to the player character beyond sensations ("robs the breath from your lungs").

## The handoff list

| Item | Seen in pass 5 |
|---|---|
| A1. Cybernetic leg (D-245) | **Confirmed.** `/sever left leg`, `/fight 1 duelist at -10`: 2 quiet exchanges, then To key moment ran 35 more; nobody out for a leg; won. After `/skip 40 days` (64% adapted), `/fight 1 duelist at 0`, `/exchanges 400`: 29 exchanges, no "cannot stand". A leg lost in a fight still ends it (`Joren Tal has lost a leg and cannot stand`) |
| A1. Form penalty (D-251) | **Confirmed.** At 0% adapted: `Joren Tal: +4.3 level` at form 53.6 (5.36 x 0.825 x the wound penalty shown as -4% = 4.2 to 4.3). At 64%: `+4.9` at 53.8 (5.38 x 0.937 x 0.98 = 4.94); the duelist at the same level `+5.4` |
| A1. Capacity (D-252) | **Confirmed.** Physical capacity 5.1 before, 4.8 at 0%, 5.0 at 64% |
| A1. Dominant hand (D-253) | **Confirmed.** `/sever right arm`: "Dominant hand: right". A later duel: `#63 strike · critical hit on Joren Tal · left arm severed` and the fight ran on to #67; a right hand or arm severed ended it (`has lost the weapon arm`) |
| A2. Name matching (D-247) | **Confirmed.** `#12 strike · clean hit on Duelist 24 · left leg severed`, replayed with Resolve to end, then Spare: no lastingState firing, Duelists 1 to 23 not in the scene ("Duelist 24 collapses against the bulkhead ... clutches the seared stump of his left leg") |
| A3. Simulated 503 (D-250) | **Confirmed.** `/simulate 503 2`, To key moment: `gemini-3.5-flash-lite: busy (503); retry 1 of 3 in 2.5 s`, `retry 2 of 3 in 4.0 s`, one call on the meter. The same beat from the save with no simulation: the same 70 dice (12/20, 18/11, 15/12 ...), the same 35 exchanges and XP. `/simulate 503 4`, Narrate: the status line read "Resolving: Narrate · Gemini is busy, retrying… (1 of 3)", "(2 of 3)", "(3 of 3)", then "Gemini is busy, trying gemini-3.8-flash…". That model answered with a real 503, and the game showed "The GM reply failed: Gemini error 503 ..." with Retry and Dismiss; Retry was answered, with `call narrative gemini-3.8-flash: http` in the log. Nothing was lost and the failed attempts were not counted on the meter |
| B. The narrator's Vong (D-246, D-248) | **Partly.** The card, the armor, the immunities and Vitality 56: confirmed. The level: +0.4 (issue 4). Dev warriors for comparison: +3.5 and +4.3, Vitality 72 and 74. His own fight was not narrated to the end (see below); a dev warrior's was |
| C. An ordinary duel (D-249) | **Confirmed.** The rank list for a Sith Warrior: Academy acolyte, Apprentice, Sith Lord; the sheet says "Rank: Sith Lord". `/fight 1 duelist at 0 stakes lethal`, Resolve to end: 3 exchanges, lost; the end card "Fight over: lost: a fighter is dying."; no raw word |
| D. A group fight | **Confirmed.** `/fight 4 trooper terrain ruins`: cards with `+2 cover` on both sides; Narrate told the cover ("the line troopers hunkering down behind their own defensive barriers ... your bolt goes wide against their cover"); the typed turn; Surrender: "Line trooper 1 and Line trooper 2 step in close ... Line trooper 3 and Line trooper 4 cover the approaches", end card "The opponent's choice: taken captive"; the Debug tab's `CAPTIVE: ... captured by 4 line troopers (...), armed with blaster rifles and no other weapons in the last fight` |
| E. Layout | **Confirmed** in an 820 x 1180 frame: "Day 1 of Month 1, 3,653 BBY" (150 px of 150) over "a forest clearing on Dantooine" (161 of 161) in a 269 px column; no page scroll (816 of 816) |
| F. Morale (D-256) | **Mostly confirmed.** `/fight 6 thug`: `Thug 4's morale breaks: surrenders, out of the fight`; end card "Thug 4: Surrendered"; the block's `Morale:` line. Its narration was replaced by the code summary (issue 7), so a break told by the narrator was not seen. Line troopers broke in 3 of 12 fights. A named opponent: on a Sith duelist, none in 24 (issue 8); on a Jedi duelist in Varek's campaign with `/archetype bountyHunter`, the seventh try: `Duelist 8's morale breaks: surrenders`, "won: the opponents broke", Spare / Capture / Kill offered (the fate's telling: issue 13). No morale line for 6 B1 or for 7 Vong warriors over about 300 exchanges |
| G. Max Vitality (D-255) | **Confirmed.** 72 before, 61 at 0% adapted (72 x 0.85), 68 at 64% (72 x 0.946) |
| H. Strike intent and severing (D-260) | **Confirmed**, on small samples. The block: `Intent: Duelist 1 strikes to kill (torso and head)`; after `/intent disarm`: `Intent: Duelist 53 strikes to disarm (the weapon hand and the limbs)`. Locations: flag 3. The narrated passage under disarm had six exchanges and no strike, so the telling of a disarming hit was not seen. Severing: lightsabers on arms, hands and legs throughout; `/fight 3 thug weapon melee` against the smuggler, 10 fights, 7 hits: one `critical hit · left arm severed` at margin 26.3, nothing else; 45 blaster hits, none severed |
| I. Capture by subduing (D-262) | **Confirmed.** `/fight 4 trooper alive`: stun hits `graze / clean hit on Rell Tarn · no wound` with no place, `Rell Tarn is Spent and subdued: taken captive`, `lost (captured)`, `the opponent's choice: captured` with no roll, "No wounds." after. The Intent line as in the handoff. Narrate in the fight told a stun bolt (issue 14 for its place); Resolve to end told a capture and no injury, but no fight (issue 5). Fallback: `Duelist 9 has no way to subdue (lightsaber): strikes to disarm`, and `/intent capture` left him unchanged. Sith duelists took `/intent capture` (they have Choke or lightning) and captured Joren 3 times of 4 with no wound. `/fight 3 b2 alive` fielded war droids with rifles in 3,653 BBY, so the "heavy" line was not seen |
| J. Sith withdrawal (D-263) | **Confirmed**, and too often (issue 1). `Duelist 1 withdraws: breaks off the fight and escapes, out of the fight`; end card "won: the opponents broke (surrendered, fled or withdrew). Joren Tal: Wounded · Duelist 1: Withdrew"; story choices only, no fate; narrated twice as an escape through the window |
| K. Margin 30 (D-267) | **Confirmed as far as it came up.** 45 blaster hits on the smuggler over 12 fights: no killing blow, worst `critical wound` at 23.5; no hit reached 30, so the killing side was not seen. A lightsaber (`/fight 1 duelist at 20`): `clean hit · mortal wound, torso` at 12.3, 14 and 15 |

## Pass-4 issues: confirmed fixed, and not

| Pass-4 issue | Seen in pass 5 |
|---|---|
| 1 (a fitted leg out of every fight) | **Fixed** (D-245) |
| 2 (the Vong at level 0) | **Partly**: Vitality, weapon, armor fixed; level +0.4 and 0 XP (issue 4) |
| 3 (rule 17 by a shared name word) | **Fixed** (D-247) |
| 4 (the scene after a capture) | The CAPTIVE line now carries the weapon; the surrender scene was right. The scene after it was not played |
| 5 (engine words) | **Partly**: three repairs; issue 11 for the rest |
| 6 (trades blows; graze places; stock throws) | Graze places **not fixed** (issue 14). The others did not come up |
| 7 (the cover beat) | **Fixed** for cover. "Regaining your footing" again (issue 14) |
| 8 (Star Wars fit) | None of pass 4's wordings came back; new ones in issue 15 |
| 9 (saber throw at telekinesis 15) | Not re-run |
| 10 (`/heal all` and the dominant hand) | **Fixed** as far as seen: "Dominant hand: right" after a lost right arm and `/heal all` |
| 11 (a temporary id in an opening choice) | Not seen in four openings |
| 12 (labels) | **Fixed** on the end card and the panel ("taken captive", "amphistaff", the armor) |
| 13 (chapter summaries on dev turns) | **Fixed**: no summary call in about 800 dev turns |
| 14 (layout) | **Fixed** (D-248 item 14) |
| 15 (carry-overs) | **Fixed** for earlier duelists in the scene, minions introduced as people (`rejected: "Line trooper 1" is a minion of the fight, not a person`) and the smuggler's gap (`your level 30.4`). Sith lords in the Jedi Temple: as before |

## Not tested, and why

- **The narrator's own Vong warrior narrated to the end:** his fight was run with `/exchanges 400` first, and the
  comparison fights that followed pushed its save out of the 10-save list before I went back for it (my order of
  work; issue 3 then hid the newer saves on the second try). A dev Vong warrior's fight was narrated instead. A
  new campaign would have cost three more calls.
- **A morale break told by the narrator:** the one narrated break fell to the code summary (issue 7).
- **A disarming strike told by the narrator:** no strike landed in the passage narrated under `/intent disarm`.
- **A blaster hit at margin 30 or more:** none in 45 hits.
- **"has no way to subdue (heavy)":** no B2 or droideka exists in 3,653 BBY, where the smuggler was; the lightsaber
  form of the same line was seen.
- **The busy note during `/simulate 503 2`:** my reading of the page missed it that time; it was read in full
  during `/simulate 503 4`.
- **Whether the fallback model retries its own 503:** one real 503 from `gemini-3.8-flash` ended the turn at once.
- **Pass-4 leftovers not re-run:** saber throw at telekinesis 15, a failed recall, a hold passing the chain, the
  scene after a capture, Disengage, speech in a fight, sparring, a real touch screen.

State left in the browser: `[TEST] Rell Tarn` is the current campaign, in an unfinished dev fight against 4 line
troopers (exchange 2). The tab I opened is closed. Usage meter: 23 / 500 for gemini-3.5-flash-lite.
