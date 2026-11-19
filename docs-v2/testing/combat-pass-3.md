# Combat pass 3 (2026-11-19)

Scope: a re-check after the combat-pass-2 fixes (D-208 to D-216) and Jared's calls on the balance rows (D-217 to
D-235). Part A is the engine checks. Part B is a browser pass in Chrome on `http://localhost:5173/?dev=1`, test
campaigns only. Nothing was fixed during the pass. Build under test: commit 943c914.

How the pass was run:

- Seven test campaigns: the leftover `[TEST] Daro Venn` (Knight, 25 ABY, in an unfinished dev duel from pass 2) for
  free checks, then six new ones from the dev test start: Joren Kast (Jedi Guardian Knight, 30, 22 BBY), Mira Tane
  (Padawan, 16, 3,653 BBY, with a Master), Teren Vax (Knight, 30, 26 ABY), Varn Kessa (Sith Warrior, Sith Lord, 30,
  3,653 BBY), Dax Morrow (smuggler, 30, 3,653 BBY) and Sela Dorn (Knight, 30, 21 BBY).
- Dev commands (`/fight`, `/heal`, `/wound`, `/fatigue`, `/skip`, `/time`, `/truce`, `/fall`) and quiet beats set
  scenes up with no AI call. AI calls went to typed input, narrated buttons and openings.
- One new tab only, closed at the end. The API key was already saved in the browser; it was never read or typed. The
  game never asked for it.
- The Chrome window was maximized and would not resize, so the iPad layout was measured in an 820 x 1180 frame of the
  same page (as in passes 1 and 2).
- The narrative model was `gemini-3.5-flash-lite` (first in the browser's model order). Nothing in Settings was changed.

**Gemini was overloaded for the whole pass.** About 102 requests came back as HTTP 503 ("This model is currently
experiencing high demand"), against 64 that were answered. The usage meter ignores a 503 (D-226, confirmed below), so
the budget was held on the meter: **64 answered calls of the 70 allowed** (usage meter 0 -> 64). Every 503 was retried
with the game's own Retry button after a wait of 15 to 60 seconds. If the budget was meant to count failed requests
too, the pass is over it (about 166 requests in all); nothing was charged against the daily quota for the 503s.

| Scenario | Answered calls |
|---|---|
| 0. Daro Venn (leftover duel): fatigue steps, Resolve to end | 1 |
| 1. Joren vs 6 B1, forest: typed gesture + rock throw, two saber throws, Resolve to end | 5 |
| 2. Joren vs 6 B1, hangar: five saber throws (two dropped), Next beat recall, typed sequence at -3, Resolve to end unarmed | 9 |
| 3. Joren vs a Sith duelist, lethal: unknown ability, typed sequence, Push at -3, Surrender | 5 |
| 4. Joren vs a duelist at -25, lethal: Resolve to end (with the check's retry), Spare | 3 |
| 5. Joren vs 4 Mandalorians with scatter guns: To key moment, `/truce`, Accept the truce | 2 |
| 6. Joren vs 4 Mandalorians with slugthrower rifles on ice: `/fall` x 6, To key moment, Push at -3, Resolve to end (with the check's retry) | 4 |
| 7. Mira and her Master vs a Sith duelist and four war droids, 3,653 BBY: opening (one truncated, one good), typed attack, Resolve to end (with the check's retry) | 6 |
| 8. Mira, dying, vs 4 "clone troopers" in 3,653 BBY: Surrender | 1 |
| 9. Teren vs a Yuuzhan Vong warrior, 26 ABY: opening, two typed turns, Resolve to end, Kill; then death and Load an earlier save (no call) | 7 |
| 10. Varn (Sith) vs a Jedi duelist: opening, typed lightning, Lightning, Choke (with the check's retry), Resolve to end | 7 |
| 11. Varn at 3x physical fatigue vs two duelists: Resolve to end twice; a lost arm and `/skip` (no call) | 2 |
| 12. Dax (smuggler) vs a bounty hunter: opening, typed shot, Surrender | 4 |
| 13. Dax vs 4 line troopers in ruins: typed shot, Resolve to end | 3 |
| 14. Sela vs 6 B1: opening, saber throw (dropped), To key moment twice (with one check retry) | 5 |
| **Total** | **64** |

Five of the 64 were retries made by the narration check, and one was the automatic retry of a truncated opening. No
chapter summary call was seen on the meter.

## Part A: engine checks

- `npm run test:all` (PowerShell): **87 files, 878 tests, all passed** (189 s; lifetime tests included).
- `npm run sweep`: **9,840 fights in 29.4 s; "Issues (broken behaviour): none".** Counts for the record: Force push
  10,084 successes / 2,110 dodged / 1,010 resisted / 1,047 natural 1 / 174 collapses; saber throw 17,812 successes /
  8,843 fell short / 1,488 natural 1; recall 11,400 successes / 5,323 fell short. Knight at 50, balanced: 10 B1 100.0
  won / 0.7 wounded; 6 troopers 99.7 / 5.7; 6 elites 96.3 / 25.7; 4 Mandalorians 96.3 / 25.0; 6 B2 99.7 / 2.3;
  4 droidekas 99.0 / 4.7. heavyForce: 70.0 to 93.7 won. These match the handoff's numbers after D-234.
- The sweep builds each fight on its own seed, so it cannot see issue 1 below (the dice of one campaign's fights).

## Summary

| # | Category | Severity | Issue |
|---|---|---|---|
| 1 | bug | **blocker** | Every fight in a campaign starts from the same dice: three duels in a row had identical d20 rolls for 60 exchanges, and the same arm was severed at exchange 5 twice |
| 2 | bug / lore break | major | A narrator-made Yuuzhan Vong warrior has species "unknown": generated as a soldier with a blaster rifle, the Force works on it, and it stabilizes its dying prisoner (D-224 and D-225 not reached) |
| 3 | bug / narration | major | The check's wording repair deletes sentences that carry the turn's facts: the killing blow, a failed recall, a Choke's opening. The repaired text is not checked again |
| 4 | bug (narration check) | major | Rule 9 (slips) false alarms: 6 of its 8 firings ("your focus slips", "the concentration slips", "stumbling off balance" after a Choke that the block calls "thrown off balance", a mortally wounded man who "stumbles backward") |
| 5 | narration | major | A NOT REACHED shot narrated as fired, and the side that gained ground reversed (smuggler vs the bounty hunter); the check did not fire |
| 6 | narration / consistency | major | The slugthrower fight ends with "The surviving Mandalorian ... lowering his scatter gun": the wrong weapon (from the fight before) and two warriors still standing |
| 7 | consistency | major | Injuries and captors forgotten in the fate narration: a duelist with a severed arm and leg is pulled to his feet; a Padawan who surrendered to troopers is seized by "the remaining war droids" |
| 8 | narration | minor | Invented hits and wound places: "a light blow to your own ribs" (no hit in the block); grazes given a leg, an arm, a hand |
| 9 | narration | minor | Opponents' invented blades and armor: a B1 "locking blades", a war droid's "reinforced plating" that a lightsaber glances off |
| 10 | narration | minor | Engine words still in prose: "drains your stamina" (6 times), "a severe stroke", "a critical slug", "you do not reach your intended strikes" |
| 11 | narration | minor | A 46-exchange Resolve to end told as its aftermath only (four troopers shot down, four grazes taken: none narrated) |
| 12 | narration | minor | Stock sentences repeated turn after turn (the saber throw, "solid slugs kick up ... around your boots") |
| 13 | Star Wars fit | minor | "energy beam" for bolts and blades, "catch the energy beam on your magnetic field", "neon", B1s dodging "with mechanical precision", bare-handed Force deflection of bolts |
| 14 | narration | minor | The player character's feelings: "Heart pounding", "a familiar, reassuring hum" |
| 15 | bug | minor | The Sith duelist who attacks with "a crimson blade" is listed with "training saber" |
| 16 | bug / consistency | minor | A fate choice that expires leaves the dying opponent "active · here now", with no line saying what became of them |
| 17 | bug | minor | A dying player: a typed action ends the fight lost at exchange 0; a `/fight` start lets the same player act |
| 18 | bug | minor | Typed movement words add stance steps nobody asked for ("press" -> aggressive; "sidestep", "dive behind", "keep low" -> defensive), and the stance stays |
| 19 | bug | minor | A typed shot at "the nearest trooper": `intent target "npc:line-trooper-1" is not a known ID; sent to review` (two review entries) |
| 20 | UX | minor | The engine log says "code-written lines used instead" when the narration was kept and repaired; the woundOmitted quote is empty |
| 21 | UX | minor | "AI calls this fight" counts 503s (15 shown for 5 answered); the usage meter does not |
| 22 | UX | minor | Labels and lines (list below) |
| 23 | UX | minor | Layout: the top bar still cuts the date and place at 820 px; 30 px buttons |
| 24 | consistency | minor | Things that carry over or drift (list below; mostly dev-made) |
| 25 | balance | flag | Numbers that look wrong though no rule says so (list below) |

What worked as specified: the passive buttons recall a dropped saber (Next beat, To key moment and Resolve to end,
with failed attempts retried; D-208); the fatigue curve past 1x (the effective level on the cards fell from +4.8 to
+3.7 at 2x and +2.9 at 3x, and a Knight at 3x lost to a duelist of his own level; D-234); "thrust out my hand" gave
Force steps only, twice (D-210); an unknown ability failed with "You don't know Force Lightning." and no narrative
call (D-210); the opponent's initiative stopped a sequence with all three steps NOT REACHED and the reason (D-212);
the Force-action exchange read "even ... only defends" on every card (D-212); the narrator's `combatEnded` with no
outside cause was refused four times and the fights went on (D-196, D-212); an ally's opponent was "fighting an
ally", was never targeted, and the fight ended "won: your opponents defeated" with the Sith still up (D-212); "four
war droids" in 3,653 BBY were "War droid 1-4" and `/fight 4 clone` there fielded line troopers with the note (D-213);
the death card, the save list and a new branch from an earlier save (D-214); test starts for a Sith with Lightning
and Choke and a smuggler with a blaster pistol and no Force or Form rows (D-215); in-world dev places (D-215);
`/fight ... weapon`, `/truce` and `/fall` (D-215); a first-use Push from -3 landed at +1 and a first-use Choke from
-1 at +3 (D-220); despair was "-1 state of mind: despair" on build-up rolls (D-221); precognition's line on the roll
card and "precognition 0.4/use" on the Force meter row, never in a narration (D-222); a B1 dodged a Push at
"+2.4 level -5 dodging", its shooting level (D-223); captors stabilized a dying prisoner twice (a Sith in a serious
fight, line troopers; D-225); a surrender was a capture three times (D-218); at most one terrain accident per roll
in seven terrain rolls (the start of the fight and six `/fall`) and two long fights on ice and in a forest (D-228); the usage meter stayed still through about
100 503 replies (D-226); scatter guns gave "-1 scatter shot" and slugthrower rifles "-1 rapid slugthrower fire",
neither had the Soresu blaster matchup, and no slug was ever redirected (D-200); a redirected blaster bolt wounded
the droid that fired it; blade colors were blue (Jedi), green (a Jedi duelist) and red or crimson (Sith) only. No
Earth unit, firearm word ("gun" alone, "bullet", "shotgun"), magic term or Disney-canon element appeared: the
narrator wrote "scatter gun", "slugthrower rifle", "solid slugs", "binders", "permacrete", "durasteel", "plasteel",
"vonduun crab armor" and "amphistaff". The iPad-size layout had no page scrolling.

## Issues

### 1. Every fight starts from the same dice (bug, blocker)

- Set-up: Varn Kessa (Sith Lord, 3,653 BBY), three dev duels on the same morning: `/fight 1 duelist at -10 stakes
  lethal` (fight-1), then `/heal`, `/fatigue physical 3`, `/fight 1 duelist at -30 stakes serious` twice (fight-2,
  fight-3).
- Log: the d20 pairs (player / opponent) of fight-1's Resolve to end, exchanges #7 to #66, are the same as fight-2's
  #8 to #67: **60 exchanges in a row**, e.g. fight-1 `#10 11/20, #12 11/19, #13 1/11, #14 13/18, #24 11/20, #28
  18/20, #36 12/20, #37 1/10, #39 17/20, #46 20/16, #56 3/10, #57 20/3, #66 18/6` and fight-2 `#11 11/20, #13 11/19,
  #14 1/11, #15 13/18, #25 11/20, #29 18/20, #37 12/20, #38 1/10, #40 17/20, #47 20/16, #57 3/10, #58 20/3, #67
  18/6`. Fight-3 opened with fight-2's dice exactly: `#1 7/18, #2 16/19, #3 16/13, #4 11/1`, then `#5 strike · clean
  hit on Duelist 3 · right arm severed` on the same 19/4 that gave fight-2 `#5 strike · critical hit on Duelist 2 ·
  right arm severed`.
- Cause (read, not changed): features/combat/index.ts. `startFight` copies `s.meta.rngState` into the duel and
  returns `duel.rng` once, at the start (line 146). The exchanges then advance only the duel's own copy.
  `conclude` (lines 186-257) never writes the duel's rng back to `meta`; it returns an rng only when it rolls the
  player's fate, and that roll is drawn from `s.meta.rngState` (lines 225 and 230), the state from before the first
  exchange. So the next fight begins where the last one began. A duel with no minions and no terrain supply draws
  nothing at its start, so it replays the same stream; a minion fight draws grades first, so its stream is the same
  one shifted by a few draws.
- Effects seen: the player's natural 1s came in runs (Joren Kast: 18 natural 1s in 221 d20s, 8.1%, where 5% is
  expected; the sweep's own rate is 4.9%); the surrender fate roll is tied to the fight's first die; a player who
  repeats a fight can know its dice.
- Expected: architecture golden rule 2 and applyEvents ("randomness only through meta.rngState"): the state after a
  fight is the state after its last roll. Severity blocker: it is the core loop's randomness, and every balance
  number observed in a browser pass depends on it.

### 2. The narrator's Yuuzhan Vong warrior is a soldier with a blaster rifle (bug / lore break, major)

- Scenario (dev test start, 26 ABY): `A rocky hillside on Dantooine during the Yuuzhan Vong invasion. A lone Yuuzhan
  Vong warrior in vonduun crab armor, amphistaff in hand, charges me.` The opening was right: "encased in dark,
  glistening vonduun crab armor ... An amphistaff writhes in the creature's grasp".
- Log: `fight fight-1: lethal against Yuuzhan Vong warrior`, `Yuuzhan Vong warrior: generated (soldier, career)`.
  People tab: `npc:yuuzhan-vong-warrior · unknown · independent · soldier`. The narrator's npcIntroduced carried no
  usable species.
- What followed from it: the panel showed `Yuuzhan Vong warrior | 61 / 61 | fighting · blaster rifle`; the player's
  rolls had `+1 soresu matchup (vsBlasters)`; the Force row was `Push · Mind trick · Saber throw`, all live, none
  marked "(immune)"; the narration had "Its rifle comes up to parry your strike effortlessly"; a lightsaber killed
  it through its armor (`#18 strike · critical hit on Yuuzhan Vong warrior · mortal wound, torso`); and when the
  player was beaten while dying: `the opponent's choice: captured`, `stabilized by the captors`.
- Expected: D-224 (a Yuuzhan Vong in the role soldier is a yuuzhanVongWarrior: melee, heavy saber-resistant armor;
  Characters_15 :34), D-192 (outside the Force) and D-225 ("captors stabilize ... except ... the Yuuzhan Vong
  warrior, who takes captives for sacrifice"). All three hang on `species: yuuzhanVong`, and the narrator did not
  send it this time (in pass 2 it did: Push failed as "outside the Force"). The rule needs to hold when the species
  is missing: from the NPC's name and description, or by making the species field required and checked against the
  scene. A Yuuzhan Vong with a blaster is the worst lore break of the pass (the Vong hold machines to be
  abominations).

### 3. The wording repair deletes the turn's facts (bug / narration, major)

D-211's fallback keeps a narration whose only issues are rules 9 and 10 and "a sentence with another engine term or
an invented slip is dropped". The dropped sentence is often the one that tells what happened. The result is not
checked again, so a wording issue becomes a factual one.

- Teren vs the Vong, Resolve to end (17 exchanges, `won: a fighter is dying`). Engine log: `narration check: 2
  contradiction(s) with RESOLVED (slipNoHazard, slipNoHazard): "As it stumbles from your outpaced pressure, you
  drive your blue blade forward, finding a fatal opening straight through its vonduun crab armor and deep into
  its"; retrying once`, `the retry failed (Gemini error 503 ...)`, `still contradicting ...; code-written lines used
  instead`. The whole narration shown: "You lock blades with the towering warrior, the blue hum of your lightsaber
  filling the air as you push back against its sudden, desperate lunge. You press the advantage, your footwork
  guiding you past its frantic defense." No hit, no wound, no end; the panel under it says "Fight over: won".
- Sela, To key moment, `auto recall: step 1 saber recall: FAILED (the recall fails: a natural 1 (a slip of focus))`.
  Flagged: "Your focus slips for a fraction of a second, your fingers grasping at empty air as the lightsaber stays
  stubbornly on the grating just out of reach." Shown: "Surrounding you, the circle of battle droids snaps their
  blasters upward. You throw up your hands, channeling the Force to turn aside the searing orange bolts ...". The
  failed recall, the turn's only action, is gone.
- Varn, Choke, `step 1 Force choke: DONE (Duelist 1 is thrown off balance: an opening, no injury)`, track -1 -> +3.
  Flagged twice: "He gasps, choking on the sudden pressure, stumbling off balance and leaving his guard wide open."
  Shown: "Even as he fights to steady his breathing, his green blade remains raised in a tight Soresu guard ...
  neither of you yielding an inch in the tense deadlock."
- Also: Joren's two failed recalls (Resolve to end, unarmed) dropped, leaving "you try again, and this time the
  weapon leaps back"; Sela's throw dropped, leaving a narration that starts "The weapon clatters uselessly against
  the metal grating".
- Expected: after a repair the text still has to pass the factual rules (woundOmitted and the rest); if it does not,
  the D-209 summary is the fallback. Nine of the fourteen retries in the pass came back 503, so the repair path was
  the usual one today, not the rare one.

### 4. Rule 9 fires on things that are not slips (bug, major)

Rule 9 (slipNoHazard) fired 8 times. Two were right. Six were false alarms; each cost a retry call and, when the
retry failed, a sentence (issue 3).

| Turn | Flagged sentence | Why it is not an invented slip |
|---|---|---|
| Joren, Resolve to end, unarmed | "You reach out through the Force to summon your dropped lightsaber, but your focus slips and the hilt fails to answer your call." | A failed recall. "a slip of focus" is exempt; "your focus slips" is not |
| Sela, Saber throw (fell short) | "... hurling it toward the lead battle droid, but your focus slips at the crucial moment." | The same |
| Sela, To key moment | "Your focus slips for a fraction of a second ..." | The engine's own reason was "a natural 1 (a slip of focus)" |
| Sela, To key moment (2) | "... but the concentration slips; the weapon remains motionless ..." | The same (the retry, "your focus falters", passed) |
| Varn, Choke (both replies) | "... stumbling off balance and leaving his guard wide open." | The block's step line says "thrown off balance: an opening". The exemption lists a Push, a thrown object and a knockdown, not a Choke |
| Varn, Resolve to end | "He stumbles backward, dropping to his knees in the crimson dust, mortally wounded and defeated." | A man with a mortal wound going down |

Right to fire: Mira, "its heavy stride pushing you back as your footing slips for a fraction" (a natural 1, no
accident in the block; the retry was consistent); and Teren's "As it stumbles from your outpaced pressure" (the
opponent's natural 1; right by D-201, though its repair was issue 3).

Expected: D-211's own exemptions are about mental slips and successful Force effects; they need the verb forms
("focus / concentration slips, falters, wavers"), a successful Choke, and a fighter who has just taken a wound that
puts them out.

### 5. A step that was not reached told as done, and the ground given to the wrong side (narration, major)

- Input (Dax, smuggler, vs the bounty hunter Kade, lethal): `I dive behind a stack of crates, draw my blaster pistol
  and fire back at the hunter.`
- Log: `step 1 stance (defensive): DONE`, `step 2 maneuver (position): FAILED (loses ground; no hit)`, `step 3
  strike: NOT REACHED (an earlier step failed)`; `#1 exchange · Kade gains ground · track +0 -> -1` (`Dax Morrow:
  d20 18 +3 level = 21`, `Kade: d20 19 +4.1 level = 23.1`).
- Narration: "Heart pounding, you wrench your blaster pistol from its holster, lean around the edge of the rusted
  metal, and fire back. Kade smoothly gives ground, stepping back into the shadows of the alley as your bolt
  ricochets harmlessly off the durasteel bulkhead."
- Expected: no shot (the ABSOLUTE RULE; D-216's rule 12 covers only counted strikes, "two cuts"), and Kade gains
  ground, he does not give it. The check did not fire. Pass 2's issue 14 in another shape.

### 6. The wrong weapon and the wrong count at the end of a fight (narration / consistency, major)

- Set-up: fight-5 was `/fight 4 mandalorian weapon scattergun` (ended by a truce). Fight-6 was `/fight 4 mandalorian
  weapon slugrifle terrain ice`; panel `Mandalorian warrior 1 | minion · slugthrower rifle`. Resolve to end: `lost:
  a fighter is down`, `the opponent's choice: captured`; panel `Mandalorian warrior 1: Out of the fight ·
  Mandalorian warrior 2: Out of the fight · Mandalorian warrior 3: Healthy · Mandalorian warrior 4: Hurt`.
- Narration (the same reply that began "the ice field erupts with the rapid thunder of slugthrower rifles"): "The
  surviving Mandalorian steps forward, lowering his scatter gun and taking you captive in the bitter cold."
- Expected: slugthrower rifles (the block's Weapons line) and two warriors standing. The scatter gun came from the
  earlier fight's narration in the recent turns.

### 7. Injuries and captors forgotten after the fight (consistency, major)

- Joren's duel: `#66 strike · clean hit on Duelist 2 · right arm severed`, `#81 strike · critical hit on Duelist 2 ·
  left leg severed`, `Duelist 2 has lost a leg and cannot stand: out of the fight`. Then the Spare button
  (`npc:duelist-2: spare`): "you offer a hand rather than a finishing blow. Duelist 2 stares up at you in disbelief
  ... before slowly taking your hand to pull himself up against the cold stone."
- Mira, dying, `/fight 4 clone` (line troopers), Surrender: `the opponent's choice: captured`, `stabilized by the
  captors`. Narration: "the remaining war droids close in, heavy metallic servos grinding as cold, unyielding grips
  seize your arms". All four war droids were Disabled in the fight before; the captors were Line trooper 1-4.
- Expected: the fate narration's block names the wounds of the fighter it is about and who the captors are. The
  second case is partly a dev artifact (a `/fight` gives the narrator no scene for its opponents).

### 8. Invented hits and wound places (narration, minor)

- Daro, Resolve to end, exchanges #15 to #40: the only hit on Daro was the last (`#40 strike · critical hit on Daro
  Venn · mortal wound, torso`). Narration: "while taking a light blow to your own ribs and draining stamina".
- Grazes with no place in the block given one: "grazes your right leg" and "catch his left arm in a glancing blow"
  (Joren's duel), "a brief graze to your hand" (the ice fight), "lashing directly into the Jedi duelist's right leg"
  (lightning), "grazing its right leg" and then "its left leg" (droids).
- The terrain fall `Joren Kast falls on the uneven ground (minor right leg)` was told ("stumble on a root ...
  hitting the earth hard") with no leg.

### 9. Opponents' invented blades and armor (narration, minor)

- "B1 battle droid 6 remains, locking blades and exchanging blows in a tight duel" (a blaster rifle).
- "You clash blades with the fourth [war droid], your lightsaber glancing harmlessly off its reinforced plating with
  a shower of blue sparks" (a blaster rifle; a graze, no armor in the block). Also "its heavy treads shifting" on a
  droid whose leg is cut off two sentences later.
- "the droid ducks deftly behind a thick durasteel crate" in a forest clearing (terrain: cover, fallen timber,
  loose rock).
- Expected: only the block's weapons, armor and terrain. Rule 11 checks the player's armor only.

### 10. Engine words in prose (narration, minor)

Rule 10 caught severity labels five times and was right each time ("a clean, severe cut", "a mortal strike", "a
moderate wound" three times in one reply). Not caught:

- Stamina: "draining stamina", "taxes your stamina without piercing your defenses", "drains your stamina without
  breaking your skin" (a lightsaber graze), "only a drain on his stamina", "strains his stamina", "drains your
  stamina with every breath", "strains your stamina".
- Labels on other nouns: "a severe stroke", "a severe impact", "a critical slug".
- The step list: "Because the droid seized the initiative with its rapid attack, you do not reach your intended
  strikes", "Because your initial thrust faltered, you do not get the chance to press with a second cut or unleash a
  Force push".

### 11. A long passage told as its aftermath (narration, minor)

- Dax vs 4 line troopers, Resolve to end: 46 exchanges, four troopers shot down (`#9`, `#14`, `#24`, `#47`), four
  grazes on Dax. The whole narration: "The final red bolt flashes past ... as your last opponent collapses to the
  damp earth. Smoke curls lazily from the barrel of your blaster pistol ... strewn with the fallen forms of the
  troopers. Kade watches you from nearby ...".
- Expected: the key events of the passage. woundOmitted did not fire (the opponents' wounds were minions'; the
  player took no wound).

### 12. Stock sentences (narration, minor)

- Four saber throws in one fight each began "You snap your wrist, launching your blue lightsaber spinning through
  the air in a ... arc" (or "You flick your wrist"), had droids "dodging neatly out of harm's way" and one that
  "sidesteps the whirling hilt with mechanical precision", and ended "loops smoothly back into your outstretched
  hand. You catch the hilt just as B1 battle droid 1 ...".
- "solid slugs kick up dust around your boots" (scatter guns) and "solid slugs kick up a flurry of snow and ice
  around your boots" (rifles, next fight).
- Rule 8 (D-210) needs 60% of the sentences to match at 80% word overlap; these sit under it.

### 13. Star Wars fit (minor)

- "energy beam" four times for a blaster bolt or a lightsaber blade ("you catch the energy beam on your magnetic
  field, redirecting the bolt", "the humming, intersecting energy beams", "the energy beam scorching harmlessly").
  Legends prose says bolt and blade; "magnetic field" for a lightsaber's blade is technobabble.
- "distant neon signs", "the dim neon expanse of the lower levels" (Nar Shaddaa). Borderline: an Earth technology
  word.
- B1 battle droids that dodge "neatly", "easily" and "with mechanical precision" three throws running (the dice
  were theirs, but B1s are clumsy; D-223's point).
- Unarmed Jedi Knights "channeling the Force to turn aside the searing orange bolts" and "turning aside the searing
  bolt with a swift application of the Force" (the engine rolled Agility). Bare-handed deflection is a Master's
  feat in Legends; "dodging and weaving", which the narrator also used, fits.
- The same B1s fired red bolts in one turn and orange in the next.
- Checked and clean: no Earth animals, places, units or curses; "scatter gun", never "shotgun"; "slugthrower rifle"
  and "slugs", never "bullets"; Korriban, Nar Shaddaa, Dantooine and the Vong opening all read as Legends.

### 14. The player character's feelings (narration, minor)

- "Heart pounding, you wrench your blaster pistol from its holster"; "spinning into your palm with a familiar,
  reassuring hum". Two in about forty narrations; "Gritting your teeth against the sudden agony" is a sensation and
  was let pass.

### 15. A Sith duelist with a training saber (bug, minor)

- Mira's fight (`fight fight-1: serious against Sith Duelist, War droid 1 ...`, `Sith Duelist: generated
  (sithWarrior, acolyte)`). Panel, More actions: `Sith Duelist | 62 / 62 | fighting an ally · training saber`. The
  opening had "A crimson blade ignites in the shadows".
- Expected: a lightsaber. Probably the acolyte rank's loadout; a training saber in a real attack on two Jedi is
  wrong for the scene and would change the damage if the Padawan fought him.

### 16. A fate choice that expires (bug / consistency, minor)

- Varn won (`fight fight-1 ends: won (dying)`); the choices `Spare Duelist 1 (leave dying) · Capture · Kill`
  showed. `/time 09:00` (two hours on): the choices were gone, the engine log was empty, and People still had
  `Duelist 1 · jediOrder · jediKnight · active · here now`.
- Expected: a line when the choice lapses, and an outcome for someone left with a mortal wound for two hours (the
  player's own timer is 15 minutes).

### 17. A dying player and the start of a fight (bug, minor)

- Teren, `/wound torso mortal` (`dying: 15.2 minutes unless stabilized`), then the typed attack that opened the
  narrator's fight: `The fight begins · 0 exchanges · the fight ended · lost: a fighter is dying`, all steps `NOT
  REACHED (the fight ended)`.
- Mira, the same wound, then `/fight 4 clone`: the panel showed "Dying: get stabilized before the timer runs out."
  with every button live, and Surrender worked.
- Expected: one rule. Dev-made, but a player hit by a hazard and then attacked would meet the first case.

### 18. Stance steps nobody asked for (bug, minor)

- `I press him with a cut at his sword arm ...` -> `step 1 stance (aggressive): DONE (aggressive stance set)`.
  `I ignite my lightsaber, sidestep the charge and cut hard ...` -> `step 1 stance (defensive)`. `I dive behind a
  stack of crates ...` and `I keep low behind a broken wall and fire ...` -> `step 1 stance (defensive)`.
- The stance stays set afterwards (the panel's selected button changes), so the next rolls carry "-1 aggressive
  stance" or "+1 defensive stance" that the player did not choose. Pass 2 saw the first of these and counted it as
  working; with four in one pass it reads as the intent call guessing.

### 19. A typed minion target goes to review (bug, minor)

- Input: `I keep low behind a broken wall and fire my blaster at the nearest trooper.` Engine log: `intent target
  "npc:line-trooper-1" is not a known ID; sent to review`, `applied reviewQueued` twice. The strike itself went to
  Line trooper 1.

### 20. The check's own log lines (UX, minor)

- Nine times: `narration check: the retry failed (Gemini error 503 ...)`, then `still contradicting RESOLVED (...);
  code-written lines used instead`, over a narration that was the first reply with words swapped or sentences cut.
  No code-written summary (D-209) appeared in the pass.
- `narration check: 2 contradiction(s) with RESOLVED (woundOmitted, woundOmitted): ""; retrying once`: the quote is
  empty, as in pass 2.

### 21. "AI calls this fight" (UX, minor)

- Joren's second fight: `AI calls this fight: 15` after five answered calls; the engine log lists each failed one
  (`call narrative gemini-3.5-flash-lite: http`). The usage meter counted the five (D-226). Two counters, two rules.

### 22. Labels and lines (UX, minor)

- A surrender's XP line is `combat XP 0.42 (lethal, lost)` and `combat XP 0.29 (lethal, lost)`: the 0.5 factor
  (D-227) is applied (pass 2: 1.52 for the same case) but not shown, as the handoff expected.
- `fight fight-5 ends: truce (truce)`; `won (allOut)`, `won (opponentsDefeated)`, `lost (incapacitated)` in the
  engine log; `rightArm severed: a lasting injury (qualityCybernetic)` (the Health card says "lost arm · quality
  cybernetic").
- `[DEV] fight begun: 4 clone troopers, serious` over `no clone troopers in 3653 BBY: line troopers instead
  (D-213)`.
- "Fight over ... Mira Tane: Dying" after `stabilized by the captors`; "Joren Kast: Healthy" at Vitality 42 / 72;
  Health "Healthy" with a lost arm 24% adapted.
- Roll-card notes for a fighter with a blaster: "Dax Morrow cuts down Line trooper 1", "Dax Morrow grazes Line
  trooper 2; it fights on" (D-216 fixed the quiet lines; these are the cards).
- "+4 more: 3 still fighting, 1 down" counts the opponent who is fighting the ally.
- Load an earlier save: after a branch the list holds the old branch's "turn 8" (saved while dying, not marked)
  while the game is at the new branch's turn 8; nothing shows which branch a save is on.
- `/fatigue physical 3.9` answers "physical fatigue at 3" (clamped, not said).
- `step 2 strike: FAILED (holds; no ground gained, no hit)` when the stop was the player's natural 1: the reason
  that stopped the chain is not in the line (D-219 makes a plain hold DONE).

### 23. Layout (UX, minor)

- At 820 px the top bar still cuts its text: "Day 1 of Month 1, 2..." (129 px for 218) and "an abandoned hanga..."
  (132 px for 222). D-216 hid the turn count; the in-world place names of D-215 are longer than the old ones.
- Duel-panel buttons are 30 px high (left by D-216 for Jared).

### 24. Things that carry over or drift (consistency, minor)

- Dax, captured by Kade in a Nar Shaddaa alley, then `/fight 4 trooper terrain ruins`: "Kade watches you from
  nearby, his expression a mix of hardened respect and cold calculation" in the ruins on Dantooine. Dev-made (the
  NPC stays "here now" through a dev move).
- Daro's 30-day montage: `Day 3 of Month 1, 25 ABY: A brief encounter with Borga the Hutt` on Dantooine (left by
  D-216 for M6).
- Daro's lost duel: `applied flagSet (flag set: metCouncil)` from the narrator, in a reply about being cut down.
- `applied relationshipChanged (npc:kade relationship 0 -> 5)` for the bounty hunter who has just put the player in
  binders.
- One duelist is "their" in one narration, "he" in the next; the Vong warrior is "it".
- Teren is "captured" by the Vong and one turn later has "your blue-bladed lightsaber already gripped tightly in
  your hand" (`step 1 saber recall: NOT REACHED (the saber is already in hand)`): a capture takes nothing away.
- A forest clearing on Dantooine at 07:00 and an abandoned hangar on Nar Shaddaa at 07:01 (dev only).

### 25. Numbers that look wrong (balance, flags; no rule broken)

All of these were seen through issue 1's dice, so each wants a second look once that is fixed.

- Duel lengths on Resolve to end: 81 exchanges against a duelist at gap -25 (nine of the Knight's strikes from +3 or
  better were "recovered"), 60 at gap -10, 67 and 34 at gap -30 with the player at 3x fatigue. D-206's median is 34.
- `flag set: heroicAct:fight-4` for a Knight at 53.6 beating a duelist at 28.6.
- The Force meter from precognition alone: 53% before the 81-exchange duel, 86% after; 10% -> 45% over one
  67-exchange duel. No Force action in either.
- A smuggler at +3.0 shot down four line troopers (+4.3, +2.4, +3.5, +3.5) in 46 exchanges and took four grazes and
  no wound. The terrain had cover; no card showed a cover modifier for either side.
- A Sith Lord whose right arm was severed at exchange #16 (`dominant hand switched (lost the rightArm)`) fought on
  for 22 exchanges and won.
- A lost arm with a quality cybernetic: 1% adapted after 10 days and 3% after 20 (the routine is mostly injury rest
  while the severe wound heals: 19.5 training hours in the first 10 days), then 24% at day 30 and 50% at day 40.
  About 2.5% a day once healed, so near 60 days from the injury against §18's 30-40.
- Lightning: 8 Vitality a hit and never a wound (`hits Duelist 1: no wound, stamina only`) from a Sith Lord.
- A graze from a lightsaber costs 20 Vitality and "no wound" (as in pass 2).
- 4 Mandalorians with slugthrower rifles beat a Knight at 30 on ice (one sample; the sweep has 80% wins for
  knight30 against the default weapons).
- A Jedi killed a dying prisoner with no consequence (alignment is M6; recorded only).

## The check before commit: when it fired

Fourteen firings in about forty narrated fight turns. Nine of the fourteen retries came back 503.

| Turn | What it flagged | Result | Verdict |
|---|---|---|---|
| Daro, Resolve to end | mechanicalTerms: "a clean, severe cut ... a minor blow to your own ribs" | retry 503; words swapped ("grievous", "light") | Right |
| Joren, Saber throw | mechanicalTerms: "a mortal strike that shears through its processors" | retry 503; "a deadly strike" | Right |
| Joren, Resolve to end (unarmed) | slipNoHazard: "your focus slips and the hilt fails to answer your call" | retry 503; sentence dropped | **False alarm** |
| Joren, Resolve to end (81 exchanges) | woundOmitted x2 | "the retry is consistent" | Right (the first reply was not kept to read) |
| Joren, To key moment (scatter guns) | mechanicalTerms: "catches your right leg with a [moderate wound]" | retry 503; "a deep wound" | Right |
| Joren, Resolve to end (ice) | mechanicalTerms x3: "strike a moderate wound to their right leg" | the retry still had one; repaired | Right; "a critical slug" was left in |
| Mira, Resolve to end | slipNoHazard: "your footing slips for a fraction" | "the retry is consistent" | Right |
| Teren, Resolve to end | slipNoHazard x2: "As it stumbles from your outpaced pressure, you drive your blue blade forward, finding a fatal opening" | retry 503; sentences dropped | Right by D-201; the repair removed the kill (issue 3) |
| Varn, Choke | slipNoHazard: "stumbling off balance and leaving his guard wide open" | the retry was flagged too; dropped | **False alarm** |
| Varn, Resolve to end | slipNoHazard: "He stumbles backward, dropping to his knees ... mortally wounded" | retry 503; dropped | **False alarm** |
| Varn, Resolve to end (3) | mechanicalTerms x2 (the severed arm and the leg wound sentence) | retry 503; "grievous", "deadly" | Right |
| Sela, Saber throw | slipNoHazard: "your focus slips at the crucial moment" | retry 503; dropped | **False alarm** |
| Sela, To key moment | slipNoHazard: "Your focus slips for a fraction of a second" | retry 503; dropped | **False alarm** |
| Sela, To key moment (2) | slipNoHazard: "the concentration slips" | "the retry is consistent" | **False alarm** |

Not caught: the shot that was not reached and the reversed ground (issue 5), the wrong weapon and count (issue 6),
the invented blow to the ribs (issue 8), blades and plating on droids (issue 9), the stamina phrases (issue 10).
Never had a case: rule 3b (an invented kill), rule 8 (a repeat), rule 12 (counted strikes), D-202 (a wound on the
wrong fighter or place: every wound that was narrated was on the right fighter and place).

## Layout at iPad width (820 x 1180)

| When | Story box | Duel panel | Page scroll | Overflow / clipped |
|---|---|---|---|---|
| Fight vs 6 B1, Force meter and precognition row showing, More actions closed | 587 px | 361 px, body 328 / 328 | none | top bar date and place (issue 23) |
| The same, More actions open | 587 px | 361 px, body 328 / 641 (scrolls inside the panel) | none | the same |

Warnings seen at full width and as text: "Opponent has the initiative: a sequence may be cut short" at -3; "over
limit: 5%/use" on the Force row; "Dying: get stabilized before the timer runs out."; "Truce offered: ..." with its
Accept The Truce button at the top of the panel. No raw id in the panel; the weapon shows beside each opponent
("minion · scatter gun", "fighting · lightsaber", "fighting an ally · training saber"). Not checked: the split
handle (dragged in pass 2), a real touch screen.

## Pass-2 issues: confirmed fixed, and not

| Pass-2 issue | Seen in pass 3 |
|---|---|
| 1 (Resolve to end never recalls) | **Fixed.** `auto recall: step 1 saber recall: FAILED` twice, then `DONE (the saber flies back to hand)`; won in 19 exchanges. Next beat: one recall, a Force-action beat. To key moment: one attempt, stops when it fails, tries again on the next press |
| 1 (no length limit, no collapse) | **Not reached.** The longest fight was 81 exchanges; the highest physical load was about 3.9x (level factor 0.42). The 200-exchange cap and the 4x collapse were not seen |
| 1 (fatigue) | **Fixed.** +4.8 -> +3.7 (2x) -> +2.9 (3x) -> +2.6 on the cards (D-234) |
| 2 (the 39,541-character fallback) | **Not triggered.** No factual failure survived a retry, so the D-209 summary never ran. History size is fine: the largest narrative call was 11,842 input tokens (the 81-exchange turn itself); the turns after long passages were 6,700 to 8,900 |
| 3 ("thrust out my hand") | **Fixed.** Both pass-2 inputs: Force steps only |
| 4 (narrator hazard in a fight) | **No case.** The narrator sent no hazardOccurred in a fight. It sent `combatEnded interrupted` four times (twice "the combat is still ongoing", twice environmentCollapse with no hazard); all refused |
| 5 (B1s in 3,653 BBY) | **Fixed.** War droid 1-4; `/fight 4 clone` -> line troopers with the note. 22 and 21 BBY field B1s |
| 6 (a Master present) | **Fixed.** Engaged elsewhere from the first turn, typed target honoured (`target: War droid 1`), `won (opponentsDefeated)`, no fate choice for the Sith. New: issue 15 |
| 7 (invented kill) | **No case.** No kill was invented in the pass |
| 8 (Force-action exchange label) | **Fixed** on the cards. The narration still says "trading blows" for it about half the time |
| 9 (unknown ability) | **Fixed** |
| 10 (load an older save) | **Fixed.** Death card, list of saves ("turn 9 · after death"), a new branch, the old saves kept |
| 11 (initiative in a sequence) | **Fixed** |
| 12 (flight as a simulation) | **Not re-run** (Disengage was not pressed). No "simulation" wording anywhere; dev places are in-world |
| 13 (invented slips) | **Caught once** (Mira); six false alarms (issue 4) |
| 14 (NOT REACHED told as done) | **Not fixed** in general (issue 5) |
| 15 (engine words) | **Partly.** Severity labels caught five times; the rest is issue 10 |
| 16 (invented gear) | **Not fixed** for opponents (issue 9). No armor was put on a player |
| 17 (the thrown object) | **Fixed.** "a jagged boulder" for a typed rock |
| 18 (surrender has no consequence) | **Fixed.** Captured by a Sith (lethal), a bounty hunter (lethal) and soldiers (serious). The execution branch did not come up in two lethal tries |
| 19 (Vitality) | Lightning now costs Vitality (56 -> 48 -> 40). The rest is as the rules have it |
| 20 (lost leg) | Aid in words on the card. No leg could be lost by dev command (see "Not tested"); a lost arm adapted at about 2.5% a day once healed |
| 21 (carry-over) | Story choices are cleared by a dev fight or time jump. New leaks: issue 24 |
| 22 (controls) | Opponents' weapons show. "(immune)" on Force buttons against a Vong could not be confirmed (issue 2); no ysalamiri bubble was made |
| 23 (raw ids) | **Mostly fixed;** the rest is issue 22 |
| 24 (quiet lines for ranged) | **Fixed** ("Mandalorian warrior 1 pins Joren Kast down with fire."). The roll-card notes are issue 22 |
| 25 (speech in a fight) | Not re-tested |
| 26 (Star Wars fit) | No "parlor tricks". New wording: issue 13 |
| 27 (layout) | The over-limit line is one short row. The top bar still clips (issue 23) |

The new rules of this round:

| Rule | Seen in pass 3 |
|---|---|
| D-217 (a hazard that ends a fight hits everyone) | Not seen: the narrator sent no hazard |
| D-218 (surrender: capture, execution chance) | Capture three times; execution not seen (and the roll is tied to issue 1) |
| D-219 (a hold passes the chain on) | **Not seen.** The one hold in a typed sequence came with the player's natural 1, which stops the chain by the rule |
| D-220 (first use +4 at most) | **Confirmed.** Push -3 -> +1; Choke -1 -> +3 |
| D-221 (state of mind once) | **Confirmed.** "-1 state of mind: despair" on build-up rolls |
| D-222 (precognition on the card) | **Confirmed** |
| D-223 (droid dodges) | **Confirmed.** "+2.4 level -5 dodging" |
| D-224 (Yuuzhan Vong warrior) | **Failed live** (issue 2) |
| D-225 (captors stabilize; the Vong do not) | Soldiers and a Sith: confirmed. The Vong: **failed live** (issue 2) |
| D-226 (usage meter) | **Confirmed** |
| D-227 (surrender XP 0.5) | The numbers fit (0.42, 0.29); the factor is not on the line |
| D-228 (one terrain accident per roll) | **Confirmed** |
| D-229 (forced miss against a minion) | Not seen |
| D-230 (lost leg, form hours) | Not testable by dev command |
| D-234 (fatigue past 1x) | **Confirmed** |

## Not tested, and why

- **The 200-exchange cap and the collapse at 4x:** `/fatigue` stops at 3.0, and no fight ran long enough from there
  (67 exchanges took the load to about 3.9x). Unit-tested only.
- **The D-209 summary fallback:** it needs a factual contradiction that survives the retry; none did.
- **A hold passing the chain on (D-219), the forced miss cap (D-229), a hazard with an interruption (D-217):** did
  not come up in the typed sequences of the pass.
- **A lost leg's adaptation (D-230):** `/wound right leg critical` heals as a wound (67% after 30 days) and never
  becomes a lost leg; the handoff's "dev /wound leg severe, healed into a lost leg" does not exist. No leg was
  severed on a player in a duel. An arm was (scenario 11).
- **The surrender's execution** (Sith 0.3, bounty hunter 0.2): two lethal surrenders, two captures.
- **Lightning against a saber block:** two lightning uses on a Jedi duelist both hit; no block was rolled or shown.
- **Saber-resistant armor and "(immune)" Force buttons against a Vong:** blocked by issue 2.
- **A ysalamiri bubble, Disengage, typed speech in a fight, a mind trick out of a fight, sparring:** not re-run
  (budget and the 503s).
- **Minions folding when Spent:** troopers and Mandalorians went "Out of the fight" on a moderate wound or a severed
  limb; none was seen to fold at Vitality 0 with no wound.
- **A smuggler's cover:** the terrain had cover, but no roll card showed a cover modifier, so "troopers in cover"
  was a fight in ruins, no more.

State left in the browser: `[TEST] Sela Dorn` is the current campaign, in an unfinished dev fight (exchange 6, the
saber on the floor). The other six test campaigns are in storage. The tab is closed. Usage meter: 64 / 500 for
gemini-3.5-flash-lite.
