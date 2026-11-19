# Combat pass 4 (2026-11-19)

Scope: a short re-check after the combat-pass-3 fixes (D-236 to D-242) and Jared's calls on the balance list (D-243
cover, D-244 the weapon arm). Part A is the engine checks. Part B is a browser pass in Chrome on
`http://localhost:5173/?dev=1`, test campaigns only. Nothing was fixed during the pass. Build under test: commit
3a7b559.

How the pass was run:

- Five test campaigns from the dev test start: Kael Dorran (Jedi Guardian Knight, 30, 22 BBY), Teren Vax (Knight, 30,
  26 ABY, the pass-3 Vong scenario), Varn Kessa (Sith Warrior, 30, 3,653 BBY), Dax Morrow (smuggler, 30, 3,653 BBY)
  and Sela Dorn (Knight, 30, 21 BBY). Varn was meant to be a Sith Lord: my form script picked the rank before the
  Sith ranks had loaded, so he started as an Academy acolyte. He had Choke and Lightning, so the checks went ahead.
- Dev commands did the set-up and every check that needs no narrator (`/fight`, `/exchanges`, `/heal`, `/fatigue`,
  `/sever`, `/hazard`, `/stakes`, `/archetype`, `/skip`, `/time`, `/set`, `/wound`). About 75 dev fights were run.
- A trick used throughout: `/exchanges 400` shows how a fight ends with no AI call; Load an earlier save and Resolve
  to end then narrates the same fight with the same dice. This picked the fights worth a call (a severed leg, a
  severed weapon arm) and confirmed the dice reproduce four times.
- One new tab only, closed at the end. The API key was already saved in the browser; it was never read or typed, and
  the game never asked for it.
- The Chrome window would not resize (as in pass 3), so the iPad layout was measured in an 820 x 1180 frame of the
  same page.
- The narrative model was `gemini-3.5-flash-lite`. Nothing in Settings was changed.

**AI calls: 35 answered of the 40 allowed** (usage meter 64 -> 99). **503 retries: 2**, both answered on the first
retry. One of the 35 was a truncated reply that the game retried by itself; six were chapter summaries.

| Scenario | Answered calls |
|---|---|
| Kael: opening; a duel to the end (leg severed) and its chapter summary; Spare (with the check's retry); surrender to 4 Mandalorians (one truncated reply, its retry, a chapter summary); one captive scene (typed) | 10 |
| Teren vs the narrator's Yuuzhan Vong: opening, a thrown rock, Resolve to end | 3 |
| Varn: opening, Choke, Lightning, Surrender (lethal, opponent set to Sith Warrior) | 4 |
| Dax: opening, Narrate in ruins, the typed "dive behind the crates" turn, Surrender (opponent set to bounty hunter) and a chapter summary | 6 |
| Sela: opening; three saber throws; To key moment and a summary; a typed three-step sequence and a summary; Resolve to end (weapon arm) and a summary; Capture | 12 |
| **Total** | **35** |

## Part A: engine checks

- `npm run test:all` (PowerShell): **94 files, 965 tests, all passed** (173 s; lifetime tests included).
- `npm run sweep`: **9,840 fights in 32.9 s; "Issues (broken behaviour): none".** Knight at 50, balanced: 10 B1
  100.0 won / 0.7 wounded; 6 troopers 99.7 / 5.0; 6 elites 97.0 / 23.3; 4 Mandalorians 97.3 / 20.7; 6 B2 99.7 / 1.7;
  4 droidekas 99.0 / 4.7. heavyForce: 68.3 to 93.3 won. Cover rows: Knight 50 vs 6 troopers in cover 99.7 / 7.3
  (balanced), 100.0 / 6.0 (mixed); smuggler 30 vs 4 troopers 64.3 won / 81.7 wounded on flat ground, 77.3 / 69.0 in
  cover. Counts: Force push 9,914 successes; saber throw 17,419; recall 11,026. These match D-243 and D-244.

## Summary

| # | Category | Severity | Issue |
|---|---|---|---|
| 1 | bug | **major** | A player with a fitted cybernetic leg is put out of every fight after one exchange, with no line saying why (40 days after the loss, 69% adapted) |
| 2 | bug / balance | **major** | The narrator's Yuuzhan Vong warrior fights at level +0 with 20 Vitality and is worth 0 XP; the dev-made Vong minions are +3.5 with 24 |
| 3 | bug (narration check) | major | Rule 17 (lasting state) false alarm: "Duelist 9 steps forward" flagged because Duelist 37 has lost a leg. Names are matched by any shared word; a retry call spent and a sentence removed |
| 4 | narration / consistency | minor | The scene after a capture: the Mandalorians (slugthrower rifles) level "a heavy blaster"; an "armored backhand" knocks the player down with no health event |
| 5 | narration | minor | Engine words still in prose: "out of the fight" (twice), "leaving your intended maneuver unreached", "outpaced" (three times), "dealing no physical wound" |
| 6 | narration | minor | Left from pass 3 and seen again: a blaster droid that "trades blows" with an unarmed Jedi; grazes given a body part; the saber throw's stock sentences |
| 7 | narration | minor | The cover beat does not mention cover; "You recover your footing" with no accident in the block |
| 8 | Star Wars fit | minor | "a datacron message waits for you on your comlink"; "bleeding from the empty socket" of a lightsaber cut; lightning "absorbed into the power cell"; "blue plasma" for a blade (four times) |
| 9 | bug | minor | Saber throw is refused at telekinesis exactly 15 with the line "needs ... telekinesis 15"; the button stays live when the requirement is not met |
| 10 | bug | minor | `/heal all` restores a lost arm but leaves the dominant hand switched; the next duel's weapon arm is the other one |
| 11 | bug | minor | The opening's choice carried `tmp:npc1`: "choice targetRef tmp:npc1 is not a valid ID; dropped", and a review entry |
| 12 | UX | minor | Raw words on the end card: "The opponent's choice: killingStrike", "interrupted: environmentCollapse: ..."; "Varn Kessa: Healthy" after the killing strike; "melee weapon" for an amphistaff; the Vong armor shows nowhere |
| 13 | UX | minor | Chapters close on a turn count that includes dev commands; six of the 35 calls were chapter summaries |
| 14 | UX | minor | Layout at 820 px: the date and the place are still cut (less than before); 30 px buttons |
| 15 | consistency | minor | Dev-made carry-overs (list below) |
| 16 | balance | flag | Numbers for Jared (list below) |

What worked as specified: three duels in a row had different dice and a load plus the same input gave the same
dice (D-238); the weapon-arm rule on the player and on an opponent, the off arm, and a prosthetic arm (D-244);
cover on both sides between shooters, none on flat ground, none for a Jedi (D-243); the 200-exchange stalemate, the
4x collapse, the hazard with and without `end`, a lapsed fate choice, a successful saber throw (D-241, D-242);
lightning caught on a lightsaber; the surrender execution branch; the Vong's species, weapon, Force immunity and
no stabilizing (D-239); the wording repair with no retry and no sentence cut (D-236, four times); no slip false
alarm in seven likely places; captors named correctly in the surrender and in the next scene (D-242); a spared
fighter with a severed leg stayed down and a captured one with no right arm kept it off (D-237); the overload
retry and its log line (D-240). No Earth unit, firearm word, magic term, Disney-canon element or era mistake
appeared.

## Issues

### 1. A fitted cybernetic leg puts the player out of every fight (bug, major)

- Input (Kael, healed, fresh): `/sever left leg`, then `/fight 1 duelist at -30`, `/exchanges 2`.
- Log: `left leg severed: a lasting injury (a quality cybernetic)`; Health card `severe · left leg (severed) · 0%
  healed | lost leg · quality cybernetic · 0% adapted`. The fight began normally (`Fight · serious · exchange 0`,
  every button live). Then: `#1 exchange · Kael Dorran gains ground · track +0 → +2` (Kael rolled a natural 20) and
  at once `1 exchange · the fight ended · lost: a fighter is down`, `fight fight-34 ends: lost (incapacitated)`,
  `the opponent's choice: left`. No card line gives a reason.
- Again after `/skip 10 days`, `/skip 10 days`, `/skip 20 days` (Health: `44% healed`, `lost leg · quality
  cybernetic · 69% adapted`): `/fight 1 duelist at -30`, `/exchanges 2` gave `1 exchange · the fight ended · lost:
  a fighter is down`, `the opponent's choice: captured`.
- The arm case works: `/sever right arm`, then a duel, ran 17 exchanges and was won.
- Expected: D-237 and D-244 ("a limb that already carries a prosthetic is whole"); the handoff's item 4 ("a quality
  cybernetic stands"). Health fits the aid at once (D-164).
- Cause (read, not changed): engine/duel.ts line 219. `cannotStand` returns true for any severed leg wound in the
  fighter's wounds, and the unhealed severed wound is carried into the duel. `weaponArmState` (line 233) builds a
  `fitted` set from the lasting injuries and skips those limbs; `cannotStand` has no such test. The note on the
  card is skipped because the fighter was already out at the start (line 673). At 44% healed after 40 days, the
  wound would block every fight for about 90 days.
- Severity major: a player who loses a leg cannot fight for months, and the game does not say why.

### 2. The narrator's Yuuzhan Vong warrior has no level (bug / balance, major)

- Scenario (dev test start, 26 ABY), as in pass 3: `A rocky hillside on Dantooine during the Yuuzhan Vong invasion.
  A lone Yuuzhan Vong warrior in vonduun crab armor, amphistaff in hand, charges me.`
- Fixed since pass 3: People shows `npc:yuuzhan-vong-warrior · yuuzhanVong · unknown · soldier`; the log has
  `Yuuzhan Vong Warrior: generated (yuuzhanVongWarrior, career)`; the panel has `fighting · melee weapon`; the Force
  row is `Push (Immune) | Throw | Mind Trick (Immune) | Saber Throw`.
- The problem: the panel shows `Yuuzhan Vong Warrior | 20 / 20`, and every card has `Yuuzhan Vong Warrior: d20 18
  +0 level = 18` against `Teren Vax: ... +5.2 level`. The fight ended `won: a fighter is dying` in 16 exchanges
  with `combat XP 0.00 (lethal, won)`.
- For comparison, `/fight 3 yuuzhanVongWarrior` in the same campaign: `Yuuzhan Vong warrior 1 | 24 / 24 | minion ·
  melee weapon`, `+3.5 level +1 numbers`, and `combat XP 7.24 (serious, won)` for the three.
- Expected: D-224 (a warrior caste fighter with heavy armor; Characters_15 :34). A named Vong warrior should not be
  weaker than his own caste's minions, and in Legends a single warrior presses a Jedi Knight hard. The log has no
  "levels set" line for him, so the archetype seems to give the rank "career" no level; I did not trace it.
- Not confirmable in the browser: the saber-resistant armor. No card, panel or log line mentions armor. The one
  graze (`#7 strike · graze hit · no wound`) and the kill (`#16 strike · critical hit · mortal wound, torso`, on
  his natural 1) read the same as against anyone.

### 3. Rule 17 flags a healthy fighter who shares a name word (bug in the narration check, major)

- Input: the Spare button after the duel in which `Duelist 37` lost his right leg (Kael, 22 BBY).
- Log: `narration check: 1 contradiction(s) with RESOLVED (lastingState): "Duelist 9 steps forward slightly from the
  shadows of the ferns, his expression unreadable, while Duelist 6 watches your restraint with a cold, assessing
  gaze."; retrying once`, `gemini-3.5-flash-lite: busy (503); retry 1 of 3 in 2.1 s`, `narration check: still
  contradicting RESOLVED (lastingState); the offending sentences removed`.
- Duelist 9 and Duelist 6 are earlier dev opponents with both legs. The narration that was kept is right about
  Duelist 37: "lies on the stone pathway ... the wound cauterized by your blade but leaving them entirely
  immobilized."
- Cause (read, not changed): turn/narrationCheck.ts line 502. A fighter is matched by any word of the name with
  four letters or more, so "Duelist" in "Duelist 9" matches Duelist 37. The same will happen with "Mandalorian
  warrior 1" and "Mandalorian warrior 3", two troopers, or two people who share a title or a family name.
- Expected: D-237, "a sentence that names anybody else is left alone". Cost here: one retry call and one true
  sentence removed. It is the only false alarm of the pass.

### 4. The scene after a capture (narration / consistency, minor)

- Set-up: `/fight 4 mandalorian weapon slugrifle terrain ice`, `/exchanges 4`, Surrender. Log: `the opponent's
  choice: captured`, `captured by: 4 Mandalorian warriors`. The surrender narration named the four and nobody else.
- Next input: `I keep my hands still and ask my captors where they are taking me.` (`Persuade check · moderate (DC
  15) ... Margin -12 · bad failure`.)
- Narration: "Mandalorian warrior 1 steps forward ... and delivers a sharp, armored backhand across your face that
  knocks you staggering into the frozen drift. There is no answer given to your question, only the harsh hum of a
  heavy blaster leveled directly at your chest by Mandalorian warrior 2."
- Expected: the captors are right (D-242, rule 18: confirmed). The weapon is wrong: the panel had `minion ·
  slugthrower rifle`. Rule 16b only looks for a slugthrower nobody carries, not the reverse, and STATE's CAPTIVE
  line carries no weapon. The backhand is a blow with no health event.

### 5. Engine words in prose (narration, minor)

Rule 10's repair worked four times (see the firings table). Not caught:

- "The crimson-bladed duelist collapses, unable to stand, entirely out of the fight." and "the duelist collapses
  out of the fight" (the card's own phrase).
- "leaving your intended maneuver unreached" (D-242 item 10 covers "your intended strikes").
- "as your opponent is outpaced", "your bolt goes wide as you are outpaced", "outpacing your defensive stance".
- "lands squarely against his chest, dealing no physical wound but wearing him down" (a lightsaber thrust; see
  flag 8 under issue 16).

### 6. Left from pass 3 and seen again (narration, minor)

- Sela, unarmed after a dropped throw, against `B1 battle droid 1 | minion · blaster rifle`: "stepping back as the
  droid advances and trades blows". Rule 16c covers locked or clashing blades only.
- Grazes given a place the block does not have: "a glancing blow against his right arm" (the Vong), "your blade
  catches its leg" and "a glancing blow to its leg" (B1s), "a glancing blow against your opponent's left leg".
- Two saber throws in one fight both began "You hurl your blue-bladed lightsaber in a spinning arc through the air"
  and ended "The lightsaber loops back through the air, returning securely to your outstretched hand"; B1s "nimbly"
  dodged in both.

### 7. The cover beat (narration, minor)

- Dax in ruins (`terrain debris, cover, looseRock`; cards with `+2 cover` on both sides), the Narrate button: "You
  trade shots with the first line trooper ... the armored figure presses forward, gaining ground. You recover your
  footing and snap off a return sequence ...". Nobody is behind anything.
- Expected: the handoff's item 8 ("one narrated beat: the shooters behind cover"). "You recover your footing" tells
  a slip the block does not have; rule 9 does not list "recover".

### 8. Star Wars fit (minor)

- "a datacron message waits for you on your comlink" (22 BBY). A datacron is a holocron-like store of knowledge,
  not a message.
- "bleeding from the empty socket where his right arm once was": a lightsaber cauterizes. The Spare narration a few
  turns earlier had it right ("the wound cauterized by your blade").
- Lightning "strike the weapon's emitter and are absorbed harmlessly into the power cell": in Legends the blade
  catches it.
- "blue plasma" or "plasma blade" four times for a lightsaber; "the Galactic Capital" for Coruscant; "a grim
  assessment of the exercise" after a lethal duel.
- Checked and clean: "slugthrower rifles" in the surrender scene, "vonduun crab armor", "amphistaff", ritual scars
  and tattoos on the Vong, Korriban, Tython in 3,653 BBY, "caf", "transparisteel", "durasteel".

### 9. Saber throw at telekinesis 15 (bug, minor)

- `/set telekinesis 15`, `/fight 6 b1`, Saber throw: `step 1 saber throw: NOT REACHED (needs a lightsaber in hand,
  telekinesis 15 and a form 10)`. At 18 it worked. The saber was in hand and the form at 53.
- At telekinesis 2 the Saber Throw button was still shown and live (the Throw button was hidden). No AI call was
  spent either time.

### 10. `/heal all` and the dominant hand (bug, minor; dev only)

- Kael lost his right arm in a duel (`dominant hand switched (lost the rightArm)`). After `/heal all` the Health
  card had no wounds and the Character card still said "Dominant hand: left". In the next duel `#17 strike · clean
  hit on Kael Dorran · right hand severed` did not end the fight, and a later `left arm severed` did.
- This is the off-arm rule working, on a state only a dev command makes. `/sever right arm` also switches the hand
  although the arm is fitted at once and counts as whole.

### 11. A temporary id in an opening choice (bug, minor)

- Teren's first choice button, "Use the Force to hurl loose rock at the attacker": `choice targetRef tmp:npc1 is not
  a valid ID; dropped`, `applied reviewQueued`. The action itself resolved against the Vong.

### 12. Labels (UX, minor)

- "The opponent's choice: killingStrike" and "Fight over: interrupted: environmentCollapse: the explosion brings
  the place down; 1 opponent still standing." on the end card.
- "Varn Kessa: Healthy · Duelist 1: Healthy" on the end card after `mortal wound to the torso (a killing strike)`,
  `dying: 14.6 minutes unless stabilized`.
- "Kael Dorran: Healthy · Duelist 23: Healthy" under "an exhausted stalemate, both sides spent" (made by
  `/exchanges to 199`, so the Vitality was full).
- "melee weapon" for the amphistaff, on the named warrior and on the minions.

### 13. Chapter summaries on dev turns (UX, minor)

- `Chapter closed (166 turns)`, `(47 turns)`, `(31 turns)`, `(30 turns)`, `(31 turns)`: a chapter closes about
  every 30 turns, dev commands included, and each closing is a summary call. Six of the pass's 35 answered calls.
  It only matters for test passes.

### 14. Layout (UX, minor)

- At 820 px the date has lost its weekday (D-242) and is still cut: "Day 1 of Month 1, ..." (119 px for 146). The
  place too: "a forest clearing on Da..." (142 px for 174). Pass 3 had 129 for 218 and 132 for 222.
- Duel-panel buttons are 30 px high (left for Jared by D-216).

### 15. Carry-overs (consistency, minor; dev-made)

- After Kael's 37th dev duel the narration had "Duelist 9 pauses nearby, offering a cold remark on the precision of
  your form, while Duelist 6 watches from the stone pathway": earlier dev opponents still "here now".
- Dev duelists for a Jedi in 22 and 21 BBY are `generated (sithWarrior, lord)` with red blades, in the Room of a
  Thousand Fountains; for the Sith in 3,653 BBY a `jediSentinel`.
- The surrender narration introduced the four Mandalorian minions as people (`applied npcIntroduced` four times).
- `/fight 1 duelist at +10` for the smuggler: "1 duelist at 10.0 (your form 0.0)", a Sith Lord with a lightsaber at
  level 10 and 30 Vitality. The gap is counted from a form the smuggler does not have.

### 16. Numbers for Jared (balance, flags; no rule broken)

1. **Duel lengths, Knight at 53.6, `/exchanges` to the end.** Gap 0 with fatigue reset each time: 167, 41, 41, 30,
   6, 30, 45, 93 (median 41; D-244's table has 34). Gap +30: 52, 28, 70, 17, 39 (table 24). Gap +12: 2, 48, 9, 66,
   144, 24, 21, 15. Gap +8: 59, 32, 32, 4, 14, 22. Small samples; the tails (144, 167) are long.
2. **A Knight 12 above lost 4 of 8** (mortal wounds at exchanges 2 and 9). The table's 60 to 68% would give about
   3 losses.
3. **4 Mandalorians with slugthrower rifles on ice: the Knight at 30 won 8 of 8** (42, 19, 39, 9, 92, 21, 66, 70
   exchanges; "Badly wounded" twice). Pass 3's single loss looks like the dice bug.
4. **Cover on a build-up exchange cancels.** Both shooters show `+2 cover` and the margin is the same as without
   it. On a strike only the defender has it (`#5 strike ... Line trooper 1: d20 17 +4.3 level +2 cover +1
   numbers`). This is D-243 as written; the card of a build-up exchange makes it look like more.
5. **The smuggler:** flat ground, won in 21 exchanges; ruins, lost in 45 and captured by 3 troopers. One each.
6. **Fatigue carries over `/heal all`.** Four duels in a row took Kael to physical 20.7 / 5.1 and he collapsed in
   the fourth at exchange 26; the next six ended at exchange 1. Dev only, but worth a word in `/help`.
7. **A cybernetic arm: 3% adapted and 33% healed after 30 days**, as in pass 3. A cybernetic leg: 18%, 35% and 69%
   adapted after 10, 20 and 40 days (D-230's target is 100% near day 51: on track).
8. **A lightsaber graze is still "no wound"**, and the narrator now writes it as a thrust that "lands squarely
   against his chest, dealing no physical wound".
9. **heroicAct** was set for wins at gaps +12 and +8 against dev "lords". As decided; recorded only.
10. **Surrender in a lethal fight:** to a Sith Warrior, a killing strike (1 of 1); to a bounty hunter, a capture
    (1 of 1). A lost lethal dev duel also gave `the opponent's choice: killingStrike` once.

## The check before commit: when it fired

Five firings in 18 narrated fight and fate turns.

| Turn | What it flagged | Result | Verdict |
|---|---|---|---|
| Kael, Resolve to end | engine term: "a sharp blow to the head that leaves a moderate burn" | "reworded in code, no retry": "a deep burn" | Right |
| Kael, Spare | lastingState: "Duelist 9 steps forward slightly ..." | retry (one 503, then answered); still flagged; sentence removed | **False alarm** (issue 3) |
| Teren, Resolve to end | engine term: "a glancing blow against his right arm that tests his [stamina]" | reworded: "that wears him down" | Right |
| Sela, To key moment | engine term: "a severe strike to its torso" | reworded: "a grievous strike" | Right |
| Sela, typed sequence | engine term: "taxing his stamina" | reworded: "wearing him down" | Right |

No sentence was cut in a fight, and every repair kept the fact it sat in (the killing blow on the Vong, the last
droid going down).

Places where pass 3 had false alarms and this pass had none: "your focus falters; the blade clatters uselessly"
(a failed throw), "your concentration falters" (a failed Push), "The duelist stumbles backward, gasping ...
throwing him completely off balance" (a Choke that landed), "The warrior stumbles, his dark armor smoking, and
collapses" (after the mortal hit), "you slip past the guard" (three times), "as he overextends" (his natural 1),
"You slip on the loose rubble, tumbling hard" (the block had `terrain: Teren Vax falls on the loose rock`).

Not caught: issues 4 to 8.

Told right with no check needed: the typed "dive behind a stack of crates ... and fire back" with the opponent at
-4 (`step 1 maneuver (position): NOT REACHED`, `step 2 strike: NOT REACHED (Duelist 1 had the initiative and struck
first)`): no shot was fired in the beat, no stance step was added (D-242 item 18), and the 13 quiet exchanges
before it were told from the block (the torso hit at #4, the redirected bolt at #6). The 15-, 14-, 20- and
22-exchange passages each told their wounding hits in order (the key-events line, D-242 item 11).

## The handoff list

| Item | Seen in pass 4 |
|---|---|
| 1. Dice (D-238) | **Confirmed.** Three duels in a row, `/fight 1 duelist at -30` and `/exchanges 100`: 52, 28 and 70 exchanges; first pairs `10/1, 3/2, 6/6`, `2/18, 12/7, 6/11`, `17/5, 18/16, 6/3`; the longest run of pairs shared by any two is 1. Reload: `/exchanges 6` gave `7/13, 19/12, 10/16, 9/9, 11/18, 15/4`; after Load an earlier save and a page reload, the same six. Three narrated fights also matched their `/exchanges` previews exactly |
| 2. Check precision (D-236, D-237, D-242) | **Mostly confirmed.** One false alarm from a new rule (issue 3). Not seen: a failed recall, a fallback to the summary |
| 3. The Vong (D-239) | **Confirmed** for species, weapon, Force immunity, a thrown rock (`Telekinesis: dodged`, by the roll), and no stabilizing (`/wound torso mortal`, `/fight 3 yuuzhanVongWarrior`: "fight begun and over at once", `the opponent's choice: left`, no "stabilized"). **Failed** on the named warrior's level (issue 2). Armor not visible |
| 4. `/exchanges to 199` | **Confirmed.** `no outcome after 200 exchanges: an exhausted stalemate, both sides Spent`, `fight fight-23 ends: stalemate` |
| 4. Collapse at 4x | **Confirmed.** `/fatigue physical 3.995`, one exchange: `Kael Dorran collapses from exhaustion (physical 20.3 / 5.1, past the hard limit of 4x): out of the fight`, `lost (exhausted)` |
| 4. A lost leg and `/skip` | Adaptation **confirmed** (18%, 35%, 69%). Fighting on it **fails** (issue 1) |
| 4. `/hazard` | **Confirmed.** `/hazard fall 1`: no damage, the D-212 line. `/hazard explosion 2 end`: `Kael Dorran is caught by the explosion (severe torso)`, `Duelist 25 is caught by the explosion (severe right leg)`, `interrupted`. The narrator also sent a hazard of its own in the Vong fight; it was refused with the same line |
| 4. Surrender execution | **Confirmed.** `/archetype sithWarrior`, lethal, Surrender: `the opponent's choice: killingStrike`, `mortal wound to the torso (a killing strike)`; the narration told it ("the blue blade arcs downward, piercing your torso") |
| 4. A successful saber throw | **Confirmed** twice (2 of 3 and 0 of 3 strikes hit; each told as listed) |
| 4. A lapsed fate choice | **Confirmed.** `/time 10:00` after a win with a dying opponent: "Duelist 31 was left dying and did not survive." |
| 4. Lightning against a saber block | **Confirmed.** `Force Lightning: caught by a lightsaber`, `step 1 Force lightning: FAILED (fails: the target's lightsaber caught and absorbed it)`; the narration had the blade take it |
| 4. Minions folding when Spent | Not looked at |
| 5. Overload (D-240) | **Partly.** Two 503s: `gemini-3.5-flash-lite: busy (503); retry 1 of 3 in 2.1 s` and `... in 1.6 s`, each answered on that retry; the meter did not count them. The busy note on screen, the next model and the dice after a retry: not seen (see below) |
| 6. Layout | Weekday dropped; both texts still cut (issue 14) |
| 7. The weapon arm (D-244) | **Confirmed.** Player: `#40 strike · critical hit on Kael Dorran · right arm severed`, `Kael Dorran has lost the weapon arm: out of the fight`, `the opponent's choice: captured`. Opponent: `Duelist 30 has lost the weapon arm: out of the fight`, then Spare, Capture, Kill. Off arm: fought on for 139 more exchanges. Prosthetic: `/sever right arm`, a duel at once, won in 17. Narrated: "severing the duelist's right arm cleanly at the shoulder. The red lightsaber falls from the severed hand ..." |
| 8. Cover (D-243) | **Confirmed** on the cards (flat: none; ruins: both sides on a build-up, the defender on a strike; a Jedi: none). The narrated beat left the cover out (issue 7) |

## Pass-3 issues: confirmed fixed, and not

| Pass-3 issue | Seen in pass 4 |
|---|---|
| 1 (the same dice every fight) | **Fixed** |
| 2 (the Vong as a soldier with a rifle) | **Fixed**, with a new problem (issue 2) |
| 3 (the repair deletes facts) | **Fixed.** Four repairs, each a swap of words; no sentence cut in a fight |
| 4 (rule 9 false alarms) | **Fixed.** No firing of rule 9 at all; seven likely sentences passed |
| 5 (a shot not reached told as fired; ground reversed) | **No case.** The narrator told the one such turn correctly; rules 13 and 15 never fired |
| 6 (wrong weapon and count at the end) | **Partly.** The surrender scene was right. The next scene had "a heavy blaster" (issue 4). "The last Mandalorian" did not come up |
| 7 (injuries and captors forgotten) | **Fixed.** A legless duelist stayed down; a one-armed one kept "his remaining limb"; captors right twice |
| 8 (invented hits and wound places) | Invented hit: no case. Graze places: **not fixed** (left by D-242; issue 6) |
| 9 (opponents' blades and armor) | **Partly.** No locked blades on a droid; "trades blows" (issue 6) |
| 10 (engine words) | **Mostly fixed.** Labels and stamina repaired in code; the rest is issue 5 |
| 11 (a long passage as its aftermath) | **Fixed.** Four long passages told hit by hit |
| 12 (stock sentences) | **Not fixed** (left by D-242) |
| 13 (Star Wars fit) | **Fixed** for "energy beam" and "magnetic field": neither appeared. New wording in issue 8 |
| 14 (the player's feelings) | Not seen in this pass ("Gritting your teeth against the pain" once, a sensation) |
| 15 (a Sith duelist's training saber) | **Fixed** for opponents (`fighting · lightsaber`). The test acolyte's own weapon is "your training blade" in a lethal fight; he was an acolyte by my mistake |
| 16 (a fate choice that expires) | **Fixed** |
| 17 (a dying player and a fight) | **Fixed** ("the player character is dying and cannot fight: the fight ends at once") |
| 18 (stance steps nobody asked for) | **Fixed** for "dive behind" (no stance step) |
| 19 (a typed minion target to review) | Not re-run. A new one from an opening choice (issue 11) |
| 20 (the check's log lines) | **Fixed.** "reworded in code, no retry"; "the offending sentences removed" |
| 21 ("AI calls this fight") | **Fixed** as far as seen: it counted 1, 2 and 2 for 1, 2 and 2 answered calls. No 503 fell inside a fight |
| 22 (labels) | **Partly.** "surrendered x0.5" on the XP line; "a lasting injury (a quality cybernetic)"; "they fight on". New ones in issue 12 |
| 23 (layout) | **Partly** (issue 14) |
| 24 (carry-overs) | Left by D-242; seen again (issue 15) |
| 25 (balance flags) | Re-measured in issue 16 |

## Not tested, and why

- **The summary fallback (D-209):** it needs a factual contradiction that survives the retry. The one retry of the
  pass was outside a fight, where the sentence is removed instead.
- **A failed recall in a narration:** three throws; the first dropped the saber and the recall then succeeded, the
  other two throws succeeded.
- **A plain hold passing the chain on (D-219):** the typed three-step sequence gave `step 1 strike: DONE (gains
  ground; no hit)`, `step 2 strike: DONE (hits Duelist 1: no wound, stamina only)`, `step 3 Force push: FAILED`,
  with `+2 sequence chain` on the third card. The chain passed, but step 1 gained ground, so it was not a hold.
- **"The last Mandalorian" and a NOT REACHED shot told as fired (rules 13, 15, 16):** the narrator made neither
  mistake, so the rules had nothing to catch.
- **Overload beyond the first retry:** only two 503s. Not seen: the on-screen "Gemini is busy, retrying…" note (both
  retries were over within about 2 s, between my readings of the page), the move to the next model, and the same
  dice after a retry (neither retried call was a turn with dice).
- **The Vong's saber-resistant armor:** nothing in the browser shows it.
- **The execution rate:** one Sith surrender and one bounty hunter surrender.
- **A Sith with a trained Force Output hitting with lightning:** the one lightning was caught on the saber.
- **Minions folding when Spent, a ysalamiri bubble, Disengage, speech in a fight, sparring, a real touch screen:**
  not run.

State left in the browser: `[TEST] Sela Dorn` is the current campaign, in an unfinished dev fight against 6 B1
(exchange 2). Both tabs I opened are closed. Usage meter: 99 / 500 for gemini-3.5-flash-lite.
