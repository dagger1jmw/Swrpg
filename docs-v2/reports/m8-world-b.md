# M8 world events, Phase B: 3661–3640 BBY (2026-11-23; D-467)

Jared's answers to `m8-world-a.md` are applied, and the 3661–3640 network ships. Campaigns in these years now get the
recorded events on their dates, can break them, and see the results. Checklist items 1 and 8 are ticked.

- **Starting point:** commit `f6b91e1`. The tag for this phase is `m8-world-b`.
- **Checks:** `test:all` 1,485 of 1,485 in 937 s (1,446 in Phase A, 39 new). `npm test` 1,436 of 1,436 in 21 s. Typecheck and lint clean; the production build works.

## 1. What was built

| Asked for | Result |
|---|---|
| Very high guard | DC 21, 10 points, two distinct prerequisites (`invented`). In the schema, the config, the data checks and the tests |
| Foreknowledge | Its own step: 3 points at DC 17, or one recorded discovery |
| Every event in the map | 77 events. A test compares each row's inputs and outputs with the map |
| PP-1 and PP-2 | Trackers and alternatives. "Collapse on time" is the recorded path, so nothing is chosen for it |
| Freeze links | 15 control rows, 11 leader rows, 2 Order seats |
| Recorded deaths | 33 figures linked to the events that kill them |
| A scene outcome end to end | `coruscant-warned`: learn the target, then convince someone in a real turn; the engine sets the flag and the strike's secrecy weakens. Two others (`visz-stopped`, the treaty incidents) use the same path |
| Other maps | Both load; gaps in section 5. The 3640–1000 BBY map is committed as a reviewed draft |

The four requested tests pass: the recorded timeline plays through unchanged, the hinge diverges the Treaty, saving the
Temple alone gives O.weak_ground_control and leaves the Treaty standing, and a very high guard needs both prerequisites.

**Guard numbers, by rolls alone** (simulated; median attempts, then the 90th percentile, prerequisites included):

| Skill level | High | Very high |
|---|---|---|
| 40 | 52 (127) | more than 1,000 |
| 60 | 26 (50) | 119 (301) |
| 80 | 15 (26) | 46 (82) |
| 100 | 11 (16) | 27 (40) |

## 2. Questions for Jared

1. **Tests match who and where, not what was said.** Any persuasion roll on Zym can count once the foreknowledge is there.
   I put foreknowledge in front of the conditions an ordinary visit could break by chance. Is that enough?
2. **Three flare-ups cannot be broken.** Quesh, Balmorra's liberation and the Taris invasion have no conditions in the map.
   Only four of the seven can be prevented (Xandret, the Desolator, Revan, Baras), so PP-2's delay needs all four. Add
   conditions to the other three?
3. **The other crowded years.** 3643, 3642 and 3640 have several events on the first day of the year (seven in 3640). Give
   them invented months too? In 3640 the rows say Karrid's assault follows the Emperor's fall and Malgus's, so it would
   come last.
4. **Where is the space battle?** The hinge can be broken by fights on Coruscant. Breaking the occupying navy needs ship
   combat, which is not built.
5. **Total defeat.** It needs three lost leaders or major defeats on one side (`invented`). Right size?
6. **The Brotherhood's headquarters.** The 3640–1000 BBY map rules it as Korriban; `src/data/orderSeats.ts` has
   Roon (D-451). Shall I change it?

## 3. Design calls to check

- **PP-1's hinge** is a high guard, open only during the two days of occupation and only with weak ground control. Two won
  serious fights on Coruscant break it, or beating Angral.
- **Malgus lost** alters the Temple strike and the Maelstrom raid (Revan is still freed) and cancels Ilum, because the
  Foundry was never his.
- **Alternatives:** peace by attrition is the default (2 points); a treaty favouring the winner scores 1 per lost leader or
  defeat; total defeat outranks both when it is possible.
- **Delayed collapse:** three years, and the first war years move with it. **Early collapse:** two incidents (won lethal
  fights) on Balmorra, Taris, Alderaan or Ord Mantell.
- **Dates:** Devaron in March 3661, the Hydian Way on 15 January 3660, the peace offer in June 3654, the conference on
  1 June 3653, the Temple strike on 20 June, the Sacking 21–23 June, the Treaty on 23 June, Zym in July, Janarus in August.
  Dantooine's battle is in May, before the Treaty ends the war. The map's "after 3653" rows start in 3652, except Balmorra
  (November 3653, inside the control table's year).
- **The riots** stand at the 3661 start, as the M7 start has them, although the table lists Devaron first.
- **Until Phase C,** travel opens the Hydian Way on 1 January 3660 while the control line says it is held to 15 January.
- **Departures from the map:** Shange and Raxxus are optional for Belsavis (the Dread Masters do not need them); seven
  outcomes are added for the freeze (O.korriban_fallen, O.darnala_dead, O.eleena_dead, O.adraas_dead, O.kilran_dead,
  O.fronts_3641, O.council_deaths_3640); the hinge, Belsavis and Revan's condition had no guard or no test and have one now.
- **Belsavis and Alderaan** show the holder before the event through months the control table leaves blank.
- **Not built:** the surrender talk and the Council debate (D-379 hooks) have no row in the map; the debate stays a start
  thread.

## 4. Breaking tests (all design calls)

Action tests take the listed kind of action; the guard sets the DC. Strengths in brackets apply to facts and won fights.

| Event | Condition | Guard | Open | Foreknowledge first | What counts |
|---|---|---|---|---|---|
| E.3661.devaron | The blockade holds against the Jedi strike | medium | from 3661 | — | dialogue/investigate with gnost-dural; won serious fight at Hydian Way / Devaron, mandalorians (major) |
| E.3661.riots | The blockade cuts the supply | low | from 3661 | — | won serious fight at Hydian Way / Devaron, mandalorians (minor) |
| E.3661.belsavis_shange | The capture is secret (not crucial) | medium | until settled | — | investigate at Belsavis |
| E.3660.hydian_battle | The Hutts back the run | medium | from 3661 | That the Hutts are paying for a run at the blockade: investigate at Nal Hutta / Nar Shaddaa / Hydian Way / Devaron; dialogue with hylo-visz | dialogue/investigate at Nal Hutta / Nar Shaddaa |
| E.3660.hydian_battle | The Mandalorian pickets can be beaten (not crucial) | medium | from 3661 | — | dialogue with mandalore-the-lesser |
| E.3660.riots_end | Supply is restored | low | from 3660 | — | won serious fight at Hydian Way / Devaron, republic/underworld (minor) |
| E.3660.korriban | Korriban's defences hold | high | from 3660 | How Korriban is defended: investigate at Korriban; spindrall captured | won serious fight at Korriban, sithEmpire/sith (major); forceUse at Korriban |
| E.3660.great_hunt | The Lesser is discredited after the blockade (not crucial) | low | from 3660 | — | O.blockade_broken broken (minor); dialogue with mandalore-the-lesser |
| E.3659.visz_rumour | Visz is alive and betrays the Hutts | low | from 3660 | That Visz means to cheat the Hutts: investigate at Nal Hutta / Nar Shaddaa | dialogue with hylo-visz |
| E.3658.xandret | The escape succeeds | medium | from 3659 | That Xandret means to run: investigate at Dromund Kaas / Kaas City; dialogue with darth-baras | investigate at Dromund Kaas / Kaas City |
| E.3654.peace_offer | The peace offer is a deception | high | from 3655 | What the Dark Council means by the offer: investigate at Dromund Kaas / Kaas City / Korriban; darth-malgus captured; darth-angral captured; darth-vowrawn captured | dialogue with berooken / paran-am-ris / zym / rans; darth-angral captured (decisive) |
| E.3653.alderaan_conference | The conference draws Republic and Jedi attention away from Coruscant | high | from 3654 | That the conference is a cover: investigate at Alderaan; foreknowledge of E.3654.peace_offer#cond.deception; foreknowledge of E.3653.temple_strike#cond.unaware | dialogue with zym / satele-shan / darnala / berooken / rans; scene coruscant-warned (major) |
| E.3653.temple_strike | The Republic does not know | high | from 3654 | That Coruscant itself is the target: investigate at Dromund Kaas / Kaas City / Korriban / Alderaan; darth-malgus captured; darth-angral captured; adraas captured | dialogue with zym / ven-zallow / berooken / rans / satele-shan; scene coruscant-warned (major) |
| E.3653.temple_strike | The strike team reaches the Temple | medium | from 3653 | — | won serious fight at Jedi Temple, sithEmpire/sith (major); won serious fight against darth-malgus (major); won serious fight against adraas (major) |
| E.3653.temple_strike | The defence grid can be disabled (not crucial) | medium | from 3653 | That the grid is a target: foreknowledge of E.3653.temple_strike#cond.unaware; investigate at Alderaan | investigate at Coruscant; won serious fight at Coruscant, sithEmpire/sith (major) |
| E.3653.sacking | The Empire takes and holds Coruscant | high | while under way | That the occupation is thin on the ground: O.weak_ground_control produced | won serious fight at Coruscant, sithEmpire/sith (major); won serious fight against darth-angral (decisive); Coruscant held by republic (decisive) |
| E.3653.sacking | The defence grid is down | medium | from 3653 | — | O.grid_down broken (major) |
| E.3653.treaty | The capital is held hostage | medium | from 3653 | — | O.coruscant_occupied broken (major) |
| E.3653.zym | Zym is unguarded after the Treaty | medium | from 3653 | That someone wants Zym dead: investigate at Coruscant; braden captured | dialogue with zym; won serious fight against braden (major) |
| E.3653.deaths | Dar'Nala dies on Dantooine (not crucial) | medium | from 3653 | — | dialogue with darnala; won serious fight at Dantooine, sithEmpire/sith (major) |
| E.3653.deaths | Eleena Daru dies (not crucial) | medium | from 3653 | — | dialogue with eleena-daru; won serious fight against darth-malgus (major) |
| E.3653.deaths | Adraas dies (not crucial) | medium | from 3653 | — | dialogue with adraas |
| E.3653.ord_mantell_fleet | The sale goes unexposed | medium | from 3653 | — | investigate at Ord Mantell |
| E.3653.alderaan_secession | Anger at the Treaty | low | from 3653 | That Panteer means to walk out: investigate at Alderaan / Coruscant | dialogue with silara-panteer-and-gaul-panteer |
| E.3650.temple_shelved | The Senate is hostile | medium | from 3653 | — | dialogue with paran-am-ris / dorian-janarus / leontyne-saresh; O.senate_distrusts_jedi broken (major) |
| E.3643.desolator | Angral's superweapon is kept secret | medium | from 3645 | That Angral is building a weapon: investigate at Coruscant / Tython / Uphrades / Dromund Kaas / Kaas City; tarnis captured; nefarid captured | investigate at Uphrades / Coruscant; dialogue with tarnis / nefarid; tarnis captured (major); nefarid captured (major) |
| E.3642.maelstrom | Revan is still imprisoned | high | from 3645 | Where Revan is held: investigate at Dromund Kaas / Kaas City; rycus-kilran captured | forceUse at Maelstrom; won serious fight at Maelstrom, sithEmpire/sith (major) |
| E.3641.belsavis | The prison still holds them | medium | from 3641 | That the Empire is coming for the Dread Masters: investigate at Dromund Kaas / Kaas City; won serious fight at Belsavis, sithEmpire/sith | won serious fight at Belsavis, sithEmpire/sith (major); investigate at Belsavis |

**Scenes** (each sets `sceneOutcome:<id>`, engine only):

| Scene | Event | Guard | From | What sets it | Requires |
|---|---|---|---|---|---|
| coruscant-warned | E.3653.temple_strike | high | 3654 | dialogue with zym / ven-zallow / berooken / rans | foreknowledge of E.3653.temple_strike#cond.unaware |
| visz-stopped | E.3660.hydian_battle | medium | 3661 | won serious fight against hylo-visz | — |
| treaty-incident-balmorra | E.3641.treaty_collapse | medium | 3652 | won lethal fight at Balmorra, republic/jediOrder/sithEmpire/sith | O.treaty_signed produced |
| treaty-incident-taris | E.3641.treaty_collapse | medium | 3652 | won lethal fight at Taris, republic/jediOrder/sithEmpire/sith | O.treaty_signed produced |
| treaty-incident-alderaan | E.3641.treaty_collapse | medium | 3652 | won lethal fight at Alderaan, republic/jediOrder/sithEmpire/sith | O.treaty_signed produced |
| treaty-incident-ord-mantell | E.3641.treaty_collapse | medium | 3652 | won lethal fight at Ord Mantell, republic/jediOrder/sithEmpire/sith | O.treaty_signed produced |

**Crucial roles** are lost only by a death or capture the engine recorded. Prince Shange, Lord Raxxus, Lema Xandret and
Darth Scabrous are not in the lore index, so they are matched by exact name, deaths only.

## 5. Schema gaps the other maps need

The dated rows of both maps load and join with the shipped network (a test). What cannot be said yet:

1. **Undated events** (E.?.empire_vanishes, E.?.tython_ruined), and an outcome that must come before a date
   (O.sith_empire_gone before 2000).
2. **A plot point with no alternatives** (PP-11, narrator-directed).
3. **Several alternatives at once.** PP-0's reforms turn one by one (R1–R3, now written in the map), so each trigger has to
   be its own plot point; ids such as PP-0.R1 are not allowed yet.
4. **A guard that rises** when an earlier step went another way (E.3630.zakuul is very high without the Gravestone; PP-10).
5. **An event that ends an outcome** (E.3630.zakuul ends O.zakuul_dominant).
6. **Who the player must be:** a Sith player character (PP-12 alternative 3), a Force user (PP-13 alternative 3), aboard a
   given ship or fleet (PP-9 step 4, PP-13 alternative 1), or in the post each PP-3 and PP-4 step names.
7. **Time in a condition:** "if the Sith are found alive within about 100 years of Ruusan" (PP-0 R1).
8. **Believed or not:** PP-12's check on the player's standing and the strength of the evidence.
9. **A role that moves** to another survivor when a protagonist dies (PP-9 step 3, PP-10 step 2).
10. **Steps over an undated span** (PP-12 before 2000): a condition window is a year or "while under way".
11. **Not a gap, but to know:** a very high guard fails the data check until it names its two steps (E.3636.eternal_empire).
12. **A decision that depends on which character is present in a scene** (PP-5; D-470).
13. **Loyalty per clone unit** (PP-5): a condition holds or breaks for everyone at once.
14. **A warning race after Sidious escapes** (PP-5): events cannot compete to come first.

**Updated 24 Nov 2026 (D-468).** The 1000 BBY map was replaced: the thought-bomb branch, R1–R3 and the reworked PP-3 and PP-4
are now in the file, with the E.980.zannah and thought-bomb input fixes kept. The load check was re-run on it and passes.
R1–R3 still need gap 3. PP-3's and PP-4's in-world leads are no longer a gap: the lead rule (D-468) covers them.

## 6. Found while building

- **The 3640–1000 map was replaced on disk during the run** (23:33). The committed copy is the one with your rulings in
  section 10; the gaps above follow it.
- **A lifetime test changed.** `era3661.test.ts` reads each year on its first day. The Sacking is now in June, so 1 January
  3653 is still Republic with the Temple standing; two assertions say so.
- **Runtime:** `test:all` takes about 90 s longer than in Phase A (851 s). I did not measure which test the extra time is in.
- **An optional input off the record** marked the Sacking "adjusted" on the recorded path. It now counts only when it comes
  about.
- **Old fights counted.** A fight won years earlier could have counted when a condition opened; now only the last day's.
- **News too early.** A condition broken only by an earlier event's outcome was told at once (the Senate's 3650
  decision, in 3653). It is now told with its own event.
- **The very high guard** is the fourth level, not the fifth.
