# Combat pass 1 (2026-11-18)

Scope: Part 2 of the iPad combat test follow-up. Part A is the engine sweep (code only). Part B is a browser pass in
Chrome on `http://localhost:5173/?dev=1`, test campaigns only, typed natural input wherever a player would type.
Nothing was fixed during the pass. Build under test: commit 6a36f88 (D-191 to D-195).

How the pass was run:

- Two dev test starts: a Knight aged 30 (Kael Voss, Clone Wars, 22 BBY, so B1 droids are in era) and a Padawan aged 16
  (Tessa Rin). Both openings used a scenario, so the narrator set the fight up through `combatStarted`.
- Dev commands (`/fight`, `/heal`, `/set`, `/skip`, `/fatigue`) set scenes up with no AI call. AI calls went to typed
  input and narration.
- The Chrome window was maximized and could not be resized, so the iPad layout was measured in an 820 x 1180 frame of
  the same page at three points in fights and once outside one.
- The API key was already saved in the browser. It was not read or typed.
- The previous `[TEST] Test knight` campaign stopped being the current campaign when the new test start began. It is
  still in storage.

**AI calls used: 50 of the 60 budget** (usage meter 82 -> 132).

| Scenario | Calls |
|---|---|
| 1. Knight vs 6 B1, forest (opening, 4 typed inputs, Throw button, end) | 11 |
| 3. Knight vs 1 duelist, lethal (3 typed inputs, 3 wounding beats, end) | 10 |
| 6. Wound, `/skip 7d`, then a typed week of care | 3 |
| 4. Knight vs 4 Mandalorians (2 typed inputs, 1 wounding beat, end) | 7 |
| 4/5. Knight vs 6 troopers with cover (mind trick, lightning twice, taking cover, end) | 9 |
| 5. Mind trick on a droid; the over-limit warning | 3 |
| 2. Padawan sparring a Master (opening, typed parry, bout end, typed stop, Stop button) | 7 |

## Summary

| # | Category | Severity | Issue |
|---|---|---|---|
| 1 | bug | **blocker** | The narrator ended a lethal fight as "fled" with `combatEnded interrupted, why: "the combat is still ongoing"` |
| 2 | narration | major | A wounding hit (severe arm wound) was narrated as a strike turned aside |
| 3 | bug + narration | major | "strike: lands" is logged for a build-up exchange; the narrator then invents a hit (twice) |
| 4 | narration | major | The thrown saber "carved through" a droid it missed; a moderate wound became a severed arm |
| 5 | narration | major | A Force push dropped by the sequence cap was narrated as done |
| 6 | bug | major | A stance step counts toward the sequence cap |
| 7 | bug | major | A sequence begun while the opponent holds the strike (-3) stops after step 1 |
| 8 | bug | major | A failed feint shows as "no effect / An earlier step failed" with no roll card (D-194 regression) |
| 9 | bug | major | A typed rock throw is dropped as "nothing left to throw" when the fight has other throwables |
| 10 | bug | major | "I rest for a week while a medic treats my arm" trains 6 days and applies no medical care |
| 11 | narration / lore | major | Invented bacta patches and Force healing for that week |
| 12 | bug / lore | major | A duelist with a severed leg and a severe sword-arm wound keeps duelling normally |
| 13 | narration / lore | major | Blaster-armed Mandalorians narrated as a "beskar-plated gauntlet" strike; a wound the player never had |
| 14 | bug | major | Typed "I end the sparring session" is not understood |
| 15 | bug | minor | Saber-throw control difficulty is 30 in code; D-193 says 20 |
| 16 | bug | minor | Push roll card shows track -3 -> -1 but the track is +3 (first-use bonus) |
| 17 | bug | minor | Old saves show "telekinesis: undefined (DC undefined)" on Force cards |
| 18 | bug | minor | A fate choice ("Duelist 1 is down") never expires |
| 19 | narration | minor | Smaller inventions: saber colours, slips, anger, who grazed whom, a deflected bolt's target |
| 20 | UX | minor | Roll card headlines and numbers that mislead (list below) |
| 21 | UX | minor | Raw ids and labels shown to the player (list below) |
| 22 | balance | flag | Numbers that look wrong though no rule says so (list below) |

What worked as specified: the dev Knight has Force skills with real bonuses (+3.1 to +3.6 at 30); attack verbs rolled
strike steps against minions; every sequence step had a log line; Force failures carried engine reasons and the narrator
used them (a natural 1 as "a slip of focus", cover, a will that held) with no invented fields; droids made no resistance
roll; the mind trick on a droid was greyed out and a typed one cost no exchange; "grazes ...; it fights on" and "cuts
down" were used correctly; the over-limit meter and button risks displayed; a stance change cost no turn; a redirected
bolt, precognition, terrain accidents and aimed strikes all resolved. The iPad-size layout had no page scrolling, no
horizontal overflow and no clipped buttons at any of the four checks.

## Issues

### 1. The narrator ended a lethal fight on its own (bug, blocker)

- Input: `I hurl Force lightning at the trooper crouched behind the broken wall.` (Knight vs 6 line troopers, lethal,
  exchange 2, all six troopers standing).
- Log: `#2 Force · forceLightning: natural 1 (DC 11)`; `Kael Voss: d20 1 -5 natural +3.3 level = -0.8`. Engine log:
  `applied combatEnded (fight fight-4 ends: fled (interrupted: the combat is still ongoing))`,
  `applied fightResolved (combat XP 0.28 (lethal, fled))`, `fight over: 1 tactical choice(s) dropped (D-181)`.
- Narration: "A sudden slip of focus makes your control falter, and the lightning fizzles harmlessly into the scorched
  earth". Nothing in it stops the fight.
- Expected: the fight goes on. D-181 (extended): the narrator ends a fight only as interrupted, for an outside event
  with its reason. The engine accepts any non-empty `why`, including one that says the fight is still going.

### 2. A wounding hit narrated as a miss (narration, major)

- Input: `Next beat` (Knight vs Duelist 1, lethal), the beat after 19 quiet exchanges (#4 to #22).
- Log: `#22 strike · solid hit · severe rightArm · track +4 -> +0`; `Kael Voss: d20 13 +5.2 level +1 aggressive stance
  = 19.2`; `Duelist 1: d20 3 +5.4 level = 8.4`; `Margin +10.9`.
- Narration (the whole reply): "You lunge forward to press the opening left by his stumble, but your strike is deftly
  turned aside at the last instant as he recovers his footing."
- Expected: the severe wound to the duelist's right arm is narrated. combat-narration.md: "Never add a hit ... the log
  does not show, and never soften or reverse one it does"; D-145: one narration covers every exchange since the last
  narrated beat. With 19 exchanges in the block the reply covered one earlier miss and stopped. The two later wounding
  beats (#27, #34) were narrated correctly and in order.

### 3. "strike: lands" for a build-up exchange (bug + narration, major)

- Input A: `I strike at his sword arm.` (vs Duelist 1). Log: `#1 exchange · Kael Voss gains ground · track +0 -> +3`;
  `Kael Voss: d20 17 +5.4 level = 22.4`; `Duelist 1: d20 7 +5.4 level = 12.4`. Engine log: `step 1 strike: lands`.
  Narration: "Your blade catches him cleanly as you press your advantage".
- Input B: `I ignite my saber and parry his opening strike.` (Padawan spar). Log: `#1 exchange · Tessa Rin gains ground
  · track +0 -> +1`; `Tessa Rin: d20 10 +3.4 level -1 defensive stance +1 defensive stance = 13.4`; `Master Oren Vash:
  d20 3 +6.8 level = 9.8`. Engine log: `step 1 stance: defensive`, `step 2 strike: lands`. Narration: "slipping past
  his guard to score a clean, controlled touch against his ribs."
- Expected: no hit and no touch; the player only gained ground. Against a named duelist a strike step is a build-up
  exchange (D-191), but its step note says "lands", and the narrator reads that as a hit. In B the intent also added a
  strike step to a parry.

### 4. Thrown saber: an invented hit and a severed arm (narration, major)

- Input: `I throw my lightsaber in a wide arc through the droids and call it back to my hand.`
- Log: `#2 Force · saber throw: success (DC 13)`, `Kael Voss: d20 15 +3.6 level = 18.6`; `#3 strike · strike recovered`,
  `thrown saber: misses B1 battle droid 1` (15.4 vs 20.4); `#4 strike · solid hit · moderate leftArm`, `thrown saber:
  Kael Voss cuts down B1 battle droid 2` (margin +10.0); `#5 ... thrown saber: misses B1 battle droid 3`.
- Narration: "carving through the first battle droid before slamming into the chassis of the second, leaving its left
  arm severed and useless ... the remaining droids surge forward and press their attack, interrupting your recall".
- Expected: droid 1 is missed, droid 2 goes down with a moderate arm wound (not severed), and the saber is back in
  hand. The "interrupted recall" comes from issue 7 (the redundant recall step's drop reason).

### 5. A dropped Force push narrated as done (narration, major)

- Input: `I press him with two quick cuts, then shove him back with a Force push.`
- Log: `#2 strike · graze hit · no wound · track +3 -> +0`; `#3 exchange · Kael Voss gains ground · track +0 -> +5`.
  Engine log: `step 1 stance: aggressive`, `step 2 strike: lands`, `step 3 strike: lands`, `step 4 Force push: dropped
  (past the sequence cap of 3)`.
- Narration: "you sweep your hand forward and release a sudden surge of kinetic Force energy, shoving him heavily back
  across the clearing."
- Expected: combat-narration.md: "say plainly what the character did not get to when steps were dropped or cut off."
  The same rule was followed correctly in the Mandalorian fight ("cuts your momentum short before you can ... unleash a
  follow-up push").

### 6. A stance step uses up the sequence cap (bug, major)

- Same input and log as issue 5. The intent added `stance aggressive` for "press" (D-179), so stance + 2 strikes filled
  the Knight's cap of 3 and the push was cut.
- Expected: D-182: a stance is a setting, not an action. It should not count as one of the three steps.

### 7. A sequence started at -3 stops after its first step (bug, major)

- Input: the saber-throw input of issue 4, typed while the track was at -3 (the droid held the strike).
- Engine log: `step 1 saber throw: success`, `step 2 saber recall: dropped (the opponent seized the strike)`.
- Expected: the opponent did not seize anything during the sequence; the track was already -3 and did not move
  (`track -3 -> -3`). sequence.ts stops the chain whenever the advantage is at or below -3 after a step, so any sequence
  begun there loses steps 2 onward. Here the dropped step was a redundant recall (the saber was already back), whose
  honest reason would be "the saber is already in hand".

### 8. A failed feint reads as "no effect" (bug, major; regression from D-194)

- Input: `I feint high, then cut low at his leg.`
- Log: `Quiet 0 exchanges · no effect`, quiet line `An earlier step failed.` Engine log: `step 1 feint: seen through`,
  `step 2 strike (aimed at the rightLeg): dropped (an earlier step failed)`.
- Expected: the feint is a contest that was rolled and lost (rolls §5), so it should show its dice and be a beat. A
  feint makes no exchange record, and D-194 treats "no new exchange" as "nothing was attempted". The feint's dice were
  never shown on a card before D-194 either.

### 9. A typed rock throw finds "nothing to throw" (bug, major)

- Input: `I lift a heavy rock with the Force and hurl it at the droid.` (forest fight; the panel's Force row offered
  Throw).
- Log: `Quiet 0 exchanges · no effect`, `Nothing left to throw here.` Engine log: `step 1 Force throw: dropped (nothing
  left to throw here)`. Pressing the Throw button next did roll (`#7 Force · telekinesis: natural 1 (DC 12)`).
- Expected: the throw uses what the fight has, or says there are no rocks here. The typed step named an object tag this
  fight does not have, and the engine reported that as an empty supply. The narrator's forest fight had no loose rock.

### 10. A week of rest with a medic: training, and no care (bug, major)

- Input: `I spend the next week resting while a medic treats my wounded arm.` (severe right-arm wound, 33% healed).
- Report: `6 training days, 1 rest or recovery days, 13.5 hours of training`. Wound `33% healed` -> `67% healed`, the
  same +33% a week as the plain `/skip 7d` before it (`0%` -> `33%`).
- Expected: rest, and medical care at x2 healing (health.md §7; D-150). In resolve.ts the montage branch returns before
  the healing code runs, so a span of days never starts care, and the routine trains as usual.

### 11. Invented bacta and Force healing (narration / lore, major)

- Same input as issue 10. Narration: "a Republic field medic tends to the severe burn on your right arm ... bacta
  patches and gentle Force-assisted healing mend the damaged tissue."
- Expected: only what RESOLVED gives. No bacta and no Force healer were applied; both are real mechanics (D-150: bacta
  x4, a Force healer on top) that the character did not receive.

### 12. A duelist fights on with a severed leg (bug / lore, major)

- Input: `Next beat` and `Resolve to end` (vs Duelist 1).
- Log: `#22 strike · solid hit · severe rightArm`; `#27 strike · critical hit · rightLeg severed` (margin +22.3). Then
  `Duelist 1 | 39 / 79 | fighting`; `#30 strike · precognition: avoided`; `#34 strike · solid hit · severe leftArm`;
  `#35 exchange · Duelist 1 gains ground · track +0 -> -5`; `#44 strike · solid hit · severe rightArm` on Kael. His
  level bonus fell only from +5.4 to +4.6.
- Narration at #27: "Duelist 1 collapses heavily onto the grass, badly wounded as the searing heat cauterizes the
  stump"; at the end: "Duelist 1 stumbles backward".
- Expected: a man who has lost a leg and the use of his sword arm does not duel on at four fifths strength. health.md
  makes a severed limb a severe wound plus a lasting injury; nothing takes mobility or the weapon hand away in a duel.
  Flagged as a rule gap rather than a broken rule.

### 13. Mandalorians: the wrong weapon and a wound that was not the player's (narration / lore, major)

- Input: `Next beat` (Knight vs 4 Mandalorian warriors, armed with blaster pistols).
- Log: `#3 strike · precognition: avoided`; `#4 strike · solid hit · minor leftLeg · track -3 -> +0`; `Mandalorian
  warrior 1: d20 16 +4.3 level +0.5 accuracy -1 footing +3 numbers (+3) = 22.8`.
- Narration: "Mandalorian warrior 1 drives forward with a crushing strike from his beskar-plated gauntlet ... catching
  you with a solid hit that deepens the pain in your already injured left leg".
- Expected: a blaster hit, a first minor wound to the left leg. Kael's leg was unhurt; the earlier leg injury was
  Mandalorian warrior 3's fall at the start. RESOLVED does not name weapons or say who wears beskar, so the narrator
  made both up.

### 14. Typed "I end the sparring session" is not understood (bug, major)

- Input: `I step back, lower my saber and bow. "That is enough for today, Master." I end the sparring session.`
- Log: `Quiet 0 exchanges · what do you do`; `Tessa Rin and Master Oren Vash circle. What do you do: a stance, a feint, a
  strike, a move`. Engine log: `combat input not understood: the beat buttons ask what you do`.
- Expected: the session stops, as the Stop sparring button does (D-168, D-181: the session ends "when the player
  stops"). No typed wording reaches `stopSession`.

### 15. Saber-throw difficulty differs from D-193 (bug, minor)

- Log: `#2 Force · saber throw: success (DC 13)`.
- Expected: DC 12. D-193 records rating 20; `SABER_THROW.controlDifficulty` is still 30. My edit to the config did not
  apply, and the D-193 text was written as if it had. The tests do not pin the value.

### 16. Push card and track disagree (bug, minor)

- Input: `I Force push the droid in front of me into the ones behind it.`
- Log: `#6 Force · forcePush: success (DC 11) · track -3 -> -1`; `Kael Voss: d20 18 +3.1 level = 21.1`; `B1 battle
  droid 1: d20 16 +3.6 level -5 dodging = 14.6`. Panel afterwards: `Advantage: +3 Kael Voss`.
- Expected: one value. The first-use bonus (D-146) is applied after the record is written.

### 17. Old saves show "undefined" on Force cards (bug, minor)

- Seen on the previous test campaign at load: `#1 Force · telekinesis: undefined (DC undefined)`.
- Expected: records made before D-192 have no outcome or difficulty; the card should fall back to "resisted".

### 18. A fate choice never expires (bug, minor)

- `Duelist 1 is down. Spare Duelist 1 | Capture Duelist 1 | Kill Duelist 1` was still in the panel two game weeks and
  three fights later. It was also offered while he was `Dying` from a mortal wound, where "Spare" is unclear.

### 19. Smaller narration inventions (narration, minor)

- Saber colours never in state: "blue glow", "bright azure hum", the Master's "blue blade" in a training-saber spar.
- Slips and missteps with no footing modifier or terrain accident: "A sudden misstep leaves you overextended as your
  footing slips" (flat floor); "your footing slips on the scorched earth" (ruins, no footing penalty).
- An emotion the engine did not set: "anger and survival fuel your surge" for a Jedi with no anger state.
- Reversals: "The fifth droid manages to land a glancing blow against your guard" (log: `Kael Voss grazes B1 battle
  droid 5; it fights on`); "you deflect his bolt cleanly into the ground beside him" (log: `Kael Voss redirects the
  bolt`, a graze on the shooter).
- The push "sending them tumbling together" (the engine gave an opening on one droid only); the thrown object named
  "a heavy stone" (the fight's object was fallen timber; RESOLVED does not name it); "the droids ... press their
  advantage" while the track was +3 for Kael.
- A softened hit: the Master's bout-ending clean hit "connects with a sharp hiss against your training saber", and the
  reply did not say the bout was lost.
- A Mandalorian "parries the blow with a crackle of reinforced gauntlets".

### 20. Roll cards that mislead (UX, minor)

- A build-up exchange that cuts a minion down is headed by the track movement: `#12 exchange · B1 battle droid 1 gains
  ground · track +2 -> +0` (margin +9.0, "Kael Voss cuts down B1 battle droid 1"); `#13 exchange · even`.
- The margin's sign follows the striker: `Margin +10.4` on the Mandalorian's hit on Kael, but `Margin -6.4` when Kael
  loses a build-up. `Margin +8.4` on a lightning bolt blocked by cover. `Margin -0.0`.
- `+1 aggressive stance -1 aggressive stance` (and the defensive pair) both listed on a build-up roll; `+3 numbers (+3)`.
- The creation form shows "Initiate does not fit age -22.0. Training cannot start after the campaign start." before a
  birth year is entered.
- Montage report: "1 rest or recovery days"; a `/skip` logs "no activity or skill named: nothing trained".

### 21. Raw ids and labels (UX, minor)

- `forcePush`, `forceLightning`, `mindTrick`, `telekinesis` on roll cards; `leftArm`, `rightLeg` in hits and on the
  health card (`severe · rightArm · 33% healed`); `won (allOut)`, `won (dying)`, `lost (sparring session (stopped))`;
  `bank release open until day -8404`; minion names in lower case (`line trooper 1`); a droid's status `Dying`;
  "(5% Collapse)" capitalised on Force buttons.
- Dev only: `/fatigue` during a fight does not reach the duel panel (the fighter's meters are copied at the start);
  `/fight ... terrain temple` leaves the scene in the Dantooine wilderness for the narrator.

### 22. Numbers that look wrong (balance, flags; no rule broken)

- A severe wound to the dominant sword arm costs 12% on the main form, and the penalty does not ease as it heals (still
  -12% at 67% healed).
- One 50-exchange duel (about six minutes) takes the physical meter from near fresh to `4.5 / 5.1 · exhausted`.
- A missed sequence strike against a minion by 12 moved the track from 0 to -3 at once (the D-191 miss rule).
- Typed strike steps make the opponent adapt (`+1 adapted to strike`, then `+2`); the Next beat button never does, so
  typing strikes is worse than pressing the button.
- A line trooper's Willpower (45) is well above a Knight-30's Mind Trick (23): `d20 4 +2.3` vs `d20 17 +4.5`. The
  "weak-minded" trooper out-wills the Knight; the sweep had tricks landing about 35% of the time.
- A 16-year-old Padawan (form 34) led a Master (68) for most of 28 exchanges and hit him twice before losing the bout.
  The dice were kind (her d20s averaged about 13, his about 7), but a 34-level gap is only 3.4 points on a d20.
- Both fights on loose rock opened with an opponent falling (`terrain: Mandalorian warrior 3 falls on the loose rock
  (minor leftLeg)`, `line trooper 1 falls ... (minor leftArm)`).
- Taking cover as the player does nothing beyond a position maneuver; cover only shields ranged opponents from
  lightning and thrown objects.
- The montage gives +0.1 XP to Force Barrier, Force Absorb and Battle Meditation, abilities this Guardian does not
  know, through Force Control synergy.
- A Jedi Knight used Force lightning with no consequence (alignment is M6; recorded only).
- Combat XP: 0.49 for six B1s won at serious stakes; 0.28 for the fight that ended as "fled".

## Layout at iPad width (820 x 1180)

| When | Story box | Duel panel | Page scroll | Overflow / clipped |
|---|---|---|---|---|
| Out of a fight (after scenario 1) | 671 px | 119 px (summary) | none | none |
| Duel, mid-fight (scenario 3) | 591 px | 357 px, body 324 / 324 | none | none |
| Droids, Force meter at 47% and at 115% (red) | 591 px | 357 px, body 324 / 324 | none | none |
| Sparring session, between bouts | 591 px | 357 px, body 324 / 324 | none | none |

More actions was collapsed in each check. Not checked: the drag handle, More actions open, and a real touch screen.

## Part A: engine sweep (for the record)

`npm run sweep`: 9,840 scripted fights in about 25 s, no broken behaviour after D-194 and D-195. Its findings were
fixed or decided before this pass: backlash strain not reaching health (fixed, D-194); "cuts down" on a surviving
minion (fixed, D-194); the narrator block missing resolved and failed steps (fixed, D-194); militia, brawlers and
beasts fighting at level 0 (fixed, D-195); elite wounds above the D-158 Soresu row (accepted, D-194); heavy Force use
losing 10 to 47% of fights to backlash collapses (rule kept, warning added, D-194). Minion win rates agree with D-158
at the same level gaps.

---

# Fixes and re-check (2026-11-18, later the same day)

Fixes from the list above went in as D-196 to D-200, one commit per group. Then scenarios 1, 3 and 6 were replayed in
the browser with the same typed inputs. `npm run sweep`: 9,840 fights, no issues. `npm run test:all`: 4 lifetime gates
fail, all moved by the severed-leg rule and left for Jared to decide (see D-198 below); everything else passes.

**AI calls used in the re-check: 25 of the 25 budget** (usage meter 132 -> 157). One of the 25 was a retry caused by a
false alarm in the new narration check (fixed, see below).

## What was fixed

| Issue | Fix | Decision |
|---|---|---|
| 1 | Interrupting a fight needs a category from a fixed list and an outside event; restating the fight is refused; "interrupted" is its own outcome (never fled or won) | D-196 |
| 2, 3, 4, 5, 11, 13 | Plain step labels (DONE / FAILED / NOT REACHED, "gains ground; no hit", "hits X: moderate wound to the left arm"); the HIT / NO HIT outcome list with each fighter's weapon; the ABSOLUTE RULE in the prompt; a check before commit with one retry and a code-written fallback; "Care applied this turn" for montages | D-197 |
| 12 | A severed leg ends the duel for that fighter (prosthetic legs exempt). The weapon-arm rule is built and switched off | D-198 |
| 6, 7, 8, 9, 10, 14 | Stance outside the sequence cap; the opponent's strike resolved and logged when they hold the initiative, with a panel warning; a failed feint is a beat with its dice; a throw uses any throwable; typed rest with care rests and starts care; typed words end a sparring session | D-199 |
| (new) | Slugthrower pistol, rifle and scatter gun | D-200 |
| 15 | Saber-throw control difficulty set to rating 20 (DC 12); D-193 corrected with the measured numbers | D-193 |

Not fixed (not on the list): issues 16 to 21. Issue 22 is answered in "Numbers that look off" below.

## Re-check results

### Scenario 1: Knight vs 6 B1, forest (10 calls)

| Input | Engine | Narration | Verdict |
|---|---|---|---|
| `I ignite my lightsaber and cut down the nearest battle droid.` | `step 1 strike: FAILED (misses B1 battle droid 1: no hit)`; `#1 strike · strike recovered` (10.4 vs 8.4) | "your humming blade slicing through empty air just inches from its chassis" | Faithful. The step line now shows in the feed. |
| `I throw my lightsaber in a wide arc through the droids and call it back to my hand.` | `step 1 saber throw: FAILED (... the saber drops nearby (unarmed until recalled))`; `step 2 saber recall: NOT REACHED (an earlier step failed)`; `#2 Force · saber throw: fell short (DC 12) · saber dropped` | "The weapon falters mid-air, clattering harmlessly into the tall grass near your feet before you can complete the arc or reach out to recall it." | Faithful. DC is 12 now. (Pass 1: an invented hit and a severed arm.) |
| `I call my lightsaber back to my hand with the Force, then throw it in an arc through the droids.` | `step 1 saber recall: DONE (the saber flies back to hand)`; `step 2 saber throw: FAILED` | "leaps from the grass and snaps firmly back into your outstretched palm ... clatters uselessly to the earth near your feet once more, leaving you temporarily unarmed" | Faithful. |
| `I pull my lightsaber back to my hand, then lift a heavy rock with the Force and hurl it at the nearest droid.` | `step 2 Force throw: FAILED (fails: the target is behind cover, which blocks it)`; `#6 Force · telekinesis: blocked by cover (DC 12)` | "the machine instantly ducks behind the dense roots of an ancient tree ... the massive stone crashes harmlessly against the trunk" | Faithful, with the engine's reason. The throw is attempted now (pass 1: "nothing left to throw"). **But the narrator ended the fight again: see below.** |
| `Resolve to end` (new fight, 11 exchanges) | Saved record: droid 1 torso moderate; droid 2 torso no wound, then torso severe; droid 3 right leg severed; droid 4 right arm severed; droid 5 head mortal; droid 6 head moderate | "into the torso of the first ... grazing its chest ... a severe blow to its torso ... the third ... cleaving its right leg clean off ... the fourth ... sever its right arm at the shoulder ... the fifth in the head ... a moderate strike to the head of the final droid" | Faithful on every hit, location and severity. No retry. |

**The blocker came back once, in a new form (bug, blocker; fixed during the re-check).** On the rock-throw turn the engine
log showed `applied combatEnded (fight fight-1 ends: interrupted (storyEvent: The droids take cover behind the
terrain.; 6 opponents still standing))`. D-196 recorded it correctly (interrupted, not fled; 6 standing), but the fight
should not have ended: the narrator used the storyEvent category for something the fighters did. Fix: a storyEvent or
thirdParty reason that names the fighters (the words of their names, or opponent / enemy / attacker / foe) is refused.
A test holds the exact case. The narrator did not try again in the remaining turns, so the tightened rule has not been
seen working live.

### Scenario 3: Knight vs 1 duelist, lethal (9 calls)

| Input | Engine | Narration | Verdict |
|---|---|---|---|
| `I strike at his sword arm.` | `step 1 strike (aimed at the rightArm): DONE (gains ground; no hit)` | "The robed figure holds his ground, raising his own humming plasma blade to intercept your strike" | Faithful. (Pass 1: "Your blade catches him cleanly".) |
| `I feint high, then cut low at his leg.` | `step 1 feint: FAILED (seen through: Kael Voss d20 6 = 6.0 vs Duelist 1 d20 6 = 13.5 (margin -7.5))`; `step 2 strike (aimed at the leftLeg): NOT REACHED` | "the robed figure reads the motion instantly ... you never get the opening needed to bring your blade down toward his leg" | Faithful, a narrated beat with its dice. (Pass 1: "no effect".) |
| `I press him with two quick cuts, then shove him back with a Force push.` | `step 1 stance (aggressive): DONE`; `step 2 strike: FAILED (loses ground; no hit)`; steps 3 and 4 `NOT REACHED (an earlier step failed)` | "you never get the chance to follow up with a second strike, nor do you find the opening needed to unleash a Force push" | Faithful. No cap line: the stance no longer counts. |
| `I shove him back with a Force push, then strike twice at his body.` (track -4) | Panel: "Opponent has the initiative: a sequence may be cut short". `step 1 Force push: FAILED (fails: the roll fell short of the difficulty ...)` | "your focus falters just shy of the threshold ... you never get the chance to press forward with your intended twin strikes" | Faithful. The opponent's-strike path was not reached live (the push failed first); it is covered by a unit test. |
| `Next beat` to a wounding hit (29 exchanges in the block) | Hits: #16 on Kael, right leg, no wound; #32 on Duelist 1, right arm, moderate | "catching Kael's right leg with a glancing graze that leaves stamina taxed but no lasting wound ... a solid, moderate strike against Duelist 1's right arm" | Faithful. (Pass 1: the wound was left out.) |
| `Resolve to end` | #43 on Kael: torso, mortal. Lost (dying), the opponent's choice: killing strike | "Duelist 1's blade flashes forward in a lethal arc, plunging deep into Kael's torso" | Faithful. |

No leg was severed in this duel, so the severed-leg rule was not seen live (unit tests and 400 simulated duels cover it).

### Scenario 6: wound, `/skip 7d`, a typed week of care (6 calls with the dev set-up)

- `/heal all`, `/wound right arm severe`, `/skip 7d`: 5 training days; `severe · rightArm · 33% healed` (base rate, as before).
- `I spend the next week resting while a medic treats my wounded arm.`: intent `rest`, `healing: medical`, `1 weeks`.
  Report: `0 training days, 7 rest or recovery days, 0 hours of training`. Engine: `under medical care for 7.0 days (x2
  healing)`, `rest and recovery: no training on these days`. Health afterwards: `No wounds` (33% -> healed: twice the
  base rate). (Pass 1: 6 training days and the base rate.)
- Narration: "a medic tends to your deep torso wound using standard medpacs and a basic recovery bed. Without the
  luxury of bacta or kolto tanks, the healing is slow and arduous". No invented bacta or Force healing.
- **False alarm in the new check (bug, minor; fixed).** The first narration said "treated only by standard medpacs and
  basic care rather than restorative bacta", which is correct, and the check flagged the word bacta and retried (one
  extra call). "rather than", "only by", "not" and similar now count as saying the care was not applied; both sentences
  are tests.
- **Wrong wound (narration, minor).** The narrator treated a "deep torso wound"; the engine's wound was the right arm.
  The torso wound was the one from the lost duel, removed by the dev `/heal all`, which the narrator never saw. Partly a
  dev artifact, and also the known gap in D-197: a wound placed wrongly is not detected.

## New observations in the re-check

| # | Category | Severity | Issue |
|---|---|---|---|
| R1 | bug | blocker (fixed) | The narrator interrupted a fight with storyEvent "The droids take cover behind the terrain." |
| R2 | bug | minor (fixed) | The narration check flagged a sentence saying the care was not bacta |
| R3 | narration | minor | Third person for one long passage ("Kael evades ..."), and saber colours that change ("blue and crimson arcs ... green and red light") |
| R4 | narration | minor | Still invents small causes: "your grip slips just a fraction on the energy matrix", "your footing slips slightly on the tall grass", "a critical misstep" |
| R5 | narration | minor | Mechanical words in prose: "a moderate strike to the head", "a severe blow to its torso" (a side effect of the explicit outcome list) |
| R6 | UX | minor | The roll card of a build-up exchange that cuts a minion down does not show the hit's location or severity (the saved record had to be read to check the narration) |
| R7 | UX | minor | A raw id is left in the step label: "strike (aimed at the rightArm)" |
| R8 | balance | flag | The droids did nothing for two turns while the Knight stood unarmed using only Force actions (see the list below) |
| R9 | balance | flag | The feint rolled `d20 6 = 6.0`: no level bonus at all (see the list below) |

## Gates moved by the severed-leg rule (D-198), for Jared's decision

`npm run test:all` fails these four. They are left failing; nothing was retuned.

| Gate | Target | Before | With the leg rule |
|---|---|---|---|
| duelTables test 1: median exchanges, gap 0 | 30 to 40 | 37 | 27 |
| the same, gap +5 / +10 | 30 to 40 | 35 / 36 | 25 / 26 |
| the same, gap +20 | 29 +/-5 | 31 | 23 |
| Anakin: never beyond 4.0x the Average pace (tier 41) | 4 or more | passed | 3.90 |
| Anakin, Clone Wars ages 19-22: combat share of yearly main-form XP | 25 to 35% | passed | 22.4% |
| Obi-Wan, Clone Wars ages 35-38: the same | 20 to 30% | passed | 35.0% (age 37) |

Win rates stay inside the table's +/-3 at every gap (for example gap 0: 49.4 -> 49.6; +20: 83.3 -> 82.0). Duels are
about 10 exchanges shorter. With the weapon-arm rule on as well, the even duel drops to 22 exchanges and the +20 win
rate to 79.0 (5 under the table), so that rule is off until M6.

## Numbers that look off: recommendation for each (nothing changed)

| # | Number | Verdict | Recommendation |
|---|---|---|---|
| 1 | A severe wound to the sword arm costs 12% on the main form | tunable | The weapon-arm rule (D-198, built, off) is the answer: 40% in the off hand. Decide it with the duel-length gates. |
| 2 | The wound penalty does not ease as the wound heals (-12% at 67% healed) | bug | The penalty reads severity only. Scale the location and status penalty by the share still unhealed. |
| 3 | One 50-exchange duel takes the physical meter to 4.5 of 5.1 ("exhausted") | as intended | 0.08 per exchange by config. Duels are now about 27 exchanges (about 2.2), so it eases by itself. |
| 4 | A missed sequence strike against a minion by 12 moved the track from 0 to -3 | tunable | My D-191 rule gives the full build-up step. Cap the loss at 1 step: one parried cut should not hand a droid the strike. |
| 5 | Typed strike steps make the opponent adapt (+1, +2); the Next beat button never does | bug | Adaptation was meant for a Force ability plus a maneuver (D-146). Leave plain strike steps out of it. |
| 6 | A line trooper's Willpower (45) beats a Knight's Mind Trick (23) | tunable | Two causes: the soldier archetype's Willpower pace is high, and Mind Trick's share is 0.35. Settle it with the M6 catalog (for example a weak-minded modifier by minion grade). |
| 7 | A Padawan (34) led a Master (68) for most of 28 exchanges | as intended | Dice. A 34-level gap is 3.4 points on a d20, and the rolls §8 table gives the weaker side about 8% at -30. |
| 8 | Fights on loose rock open with an opponent falling (2 of 2 in pass 1) | tunable | Each fighter rolls each hazardous tag: forest is 3% + 2% per fighter, so a 7-fighter fight has an accident about 30% of the time. Roll once per fight, or halve the chances. |
| 9 | Taking cover does nothing for the player beyond a position maneuver | as built | A rule gap, not a bug. M6: cover gives ranged attackers a penalty against a player behind it. |
| 10 | A montage gives +0.1 XP to Force Barrier, Force Absorb and Battle Meditation, which the Guardian does not know | bug | Force Control synergy spills into every Force ability. Spill only into abilities the character has learned. |
| 11 | A Jedi used Force lightning with no consequence | as intended | Alignment is M6. |
| 12 | Combat XP: 0.49 for six B1s, 0.00 for six more the same day | as intended | XP scales with the level gap, and B1s are 35 to 40 levels below this Knight. |
| 13 | (new) A feint rolls with no level bonus: `d20 6 = 6.0` | bug | The trick level is the best of Charisma and Intelligence only, both untrained for a Guardian. rolls §5 lists the form level too: include it. |
| 14 | (new) Force-only turns are free: the opponents do not act | tunable | A Force action resolves with no exchange for the other side. Let the opponents take their exchange after it, or move the track one step toward them. |
| 15 | (new) Saber-throw control: 64.6% for the average Knight at 50, 59.3% at 30 | tunable | Jared's target is about 70%. Rating 15 (DC 11.5) gives 70% at Telekinesis 46. |

---

# Jared's decisions on groups 3-6 and the re-check, and what was done (2026-11-18/19)

| Item | Decision | Done |
|---|---|---|
| Duel-length gates moved by the severed-leg rule | Keep the leg rule (lore). Retune the duel-length tunables to restore the tables; then the lifetime suite (fight counts only if Anakin's and Obi-Wan's gates still fail) | See the duel-length and lifetime sections below |
| Weapon-arm rule | Stays off; M6 | Recorded (architecture §15) |
| Saber throw | Control rating 15 (about 70% for the average Knight at 50) | Measured 69.6% at Knight 50, 64.1% at Knight 30, 55.0% at Padawan 16; D-193 updated |
| Downed fighters | Fine as built; record surrender and using the Force from the ground for M6 | Recorded (architecture §15) |
| AI interruptions | No storyEvent; "interrupted" only with its cause in the same reply (an arrival, hazardOccurred, alarmRaised) | D-196 amended (new alarmRaised event; combatEnded applies last in a reply) |
| Causes for misses | The engine gives the reason for every NO HIT; no invented slips | D-201 |
| Wound location check | A wound on a different body location is a contradiction (the medic-week case) | D-202 |
| Number 2: the wound penalty | Eases as the wound heals | D-203 (health §6 amended) |
| Number 10: montage XP | Only to abilities the character knows | D-203 |
| Number 13 / R9: feints | Roll with the form level | D-203 |
| Number 14 / R8: Force turns | A Force action takes an exchange; the opponents act during it; no free turns, also when unarmed | D-204 |
| Number 5: adaptation and Next beat | **As intended.** Adaptation is for repeated sequence patterns (D-146), not ordinary exchanges, so the Next beat button never adapts and typed strike steps do. No change | Verdict recorded here |
| Issues 16-21 | Fix, with tests where it makes sense; blade colours on the weapon stub (Jedi blue or green, Sith red, canon colours from the lore); the player's feelings only from the block, opponents' expressions as flavor | D-205 |
