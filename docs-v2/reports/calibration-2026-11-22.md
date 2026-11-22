# Calibration pass and the refactor answers

2026-11-22. Decisions D-417 to D-423 (and D-424 for M7 §15). Brief: Jared's answers to the date-agnostic refactor report, plus a calibration pass.

## 0. Backup
- **Tag:** `calibration-baseline-2026-11-22`, pushed to origin. It points at c13461f, the commit before any number changed.
- **Folder:** docs-v2/reference/calibration-baseline-2026-11-22/, which holds:
  - a README (what each file is and how to restore it);
  - summary.md (rank ages, minimums, the 4x ceiling, the training multipliers, the targets);
  - canon-anchors.md (every sheet and draft, in readable tables);
  - copies of the source files and specs.

## 1. Calibration findings

### 1a. Who knights at 20.5, and is the Average too fast?
- **The Average profile knights at 20.5.** That one number is shared by:
  - `AVERAGE_RANK_AGES`;
  - the Knight row's `typicalAge` in rankMinimums.ts;
  - the generator's `RANK_AGES`;
  - the lifetime profile.

  It meets the Knight minimums (highest form 39, Force Control 34, Force Sense 31, Willpower 53) at 20.3; the minimums were set to its levels there (D-120). The other profiles knight at their own ages: Obi-Wan at 25, Anakin at 20, and Luke has no ladder.
- **The pace matches its targets.** The Average reaches Adept 41 at 16.0 years of training (age 20) and Master 61 at age 36. That is the calibration you set. The 4.0x ceiling (Anakin) is a separate point and still holds: the lifetime suite passes for all four profiles.
- **Knighting at 25 changes the levels at knighting, not the pace.** The Average Guardian at 25 has:

  | Stat | At 25 | Knight minimum |
  |---|---|---|
  | Highest form | 47.8 | 39 |
  | Force Control | 38.0 | 34 |
  | Force Sense | 34.6 | 31 |
  | Willpower | 61.2 | 53 |

  So it would meet the current minimums about 4.5 years before a Knight-at-25 ladder lets it take the trials. Moving the closed form's Knight phase from 20.5 to 25 barely changes the levels (+0.3 form, +2.5 Force Control at 25), because the Padawan and Knight paces are close.
- **Is it too fast for an average character?**
  - By the bands, no. A new Knight in the high 40s is "a new Knight" (40-60), and Obi-Wan, at 1.5x, knights at 25 with form about 61, in line with his targets.
  - What is off is the ladder, not the curve: 6 Padawan years and minimums read at 20.3.
- **Options (not applied):**
  1. **Recommended:** keep the pace and move the player ladder to Knight 25, after 12-13 years as a Padawan:
     - `typicalAge` 25, `AVERAGE_RANK_AGES` and `RANK_AGES` set to Padawan 12.5 and Knight 25;
     - `KNIGHT_TRIALS.padawanYears` 6 → 10 (or 12);
     - the minimums re-read by the D-51 rule at about 24: form about 46, Force Control about 37, Force Sense about 34, Willpower about 60.

     The Master minimum (58, met at 35) stays, or moves to the Average at 40 (about 64).
  2. Slow the curve about 20% so that 41 lands near 24. That breaks the calibration targets (Average 41 at 16.0 years). Not recommended.

### 1b. Rank ages for the canon estimates (D-417)
- **Jedi:** already at Knight 25 (Padawan 13, Master 40); unchanged.
- **Sith:** the ladder now mirrors the Jedi (Lord 25, Darth 40).
- **Births:**
  - 27 estimated births re-derived, each 3 or 5 years earlier, so the dated rank years stay put.
  - Births that rest on another fact (a Dark Councilor at 45, a stated age) stay. For those, and for lore births, the estimated Lord and Darth spans moved instead (35 spans).
- **Thanaton and the Barsen'thor:** kept as on record.

### 1c. The accelerated path: Luke's numbers (D-418)
- **The path:**
  - Force skills and forms train x3.2 on top of the M cap, and their 4.0x clamp is raised x3.2.
  - The Order's knowledge blocks drop out of the routine.
  - It is the only condition past the ceiling.
- **The other conditions:**
  - A Force-rich place gives x1.10 on Force skills, inside the caps (new; invented).
  - An exceptional teacher is the teacher factor at its x1.15 cap.
- **The harness check** (tests/lifetime/lukeAccelerated.test.ts): Luke at 19, accelerated, with the master stub as his teacher, on Dagobah, with the Galactic Civil War skirmishes, sparring with his teacher, and the Bespin and Death Star duels.

| Bonus (mult = capMult) | Force Control at 4 y | Djem So at 4 y | Force Control at 5 y | Djem So at 5 y |
|---|---|---|---|---|
| 1.6 / 2.0 (first guess, one seed) | 37.9 | 29.3 | 43.7 | 33.7 |
| 3.0 (20 seeds, median) | 52.1 | 47.1 | 60.6 | 54.0 |
| **3.2 (20 seeds, median; kept)** | **54.4** | **48.8** | **62.9** | **56.3** |

- **The gain saturates near x3:** x3.2 adds only about 2 levels.
- **The blade lags the Force** because the drill ceiling holds forms until real duels raise E.
- **Knowledge stays low,** as intended: Force Knowledge 0 and Meditation 2.3 at 4 years.
- **The 4.0x floor from 19:** 41 at 3.70 years and 55 at 6.58 years. The path reaches 41 at about 2.5 years.
- **The gate:** Force Control and Djem So both 55+ by year 5, past the 4.0x floor. All 20 seeds pass at x3.2.
- **Runtime:** the 20-seed spread ran in 38.5 s.

### 1d. Suites
- `npm test`: 1,244 tests pass.
- `npm run test:lifetime` after items 1-10: 46 tests pass in 334.9 s.
- The other runs are in §5.

## 2. What's built (D-417 to D-422)
- **Item 1:** the Sith rank ages and the re-derived births; the accelerated path and Force-rich places (`character.trainingPath`, event `trainingPathSet`, progression-numbers §21); the Luke harness check.
- **Item 2:** after the start, figures keep their canon promotions unless the campaign diverged for them.
  - Divergence is killed (`npcDied`), captured (the fate choice), or turned or removed (`npcCanonDiverged`, from the narrator or the engine). It is one-way.
  - From the divergence day, growth follows only the rank spans begun by then, and the lore's later whereabouts stop applying.
- **Item 3:** the narrator gets the on-record whereabouts of figures at the current place and of any figure named.
  - At the place: every location span that names it, plus the year's dated status facts that name it (Satele "recalled to Coruscant" in 3,661).
  - Named: figures in focus and roster names in the player's words, at most 6.
  - No full list.
- **Item 4:** accepted as built.
- **Item 5:**
  - The five drafts are removed; the generator builds those lines.
  - Karagga and Oteg are hand set. The lore file gives Oteg as Yoda's species; the roster had "other".
  - Ragate:
    - a lore index entry added to the era 09 master index and the Part2 staff table, from the Korriban files;
    - she is female in the lore;
    - a roster entry, an Overseer from 3,681, killed in 3,637;
    - a hand-set line.
- **Item 6:** the inferred Rans span is removed.
  - On record: Rans at the Sacking (3,653), Stantorrs c. 3,643, Rans to Ilum (3,642-3,640), Malcom from 3,640.
  - 3,661 is blank. Rans is born 3,703.
- **Item 7:** kept as recorded.
- **Item 8:** the `warrior` archetype (melee, NPC only; the Vong warrior's measured paces). Khem Val, Broonmark and Mandalore the Lesser move to it; Talz and Dashade fighters are generated as warriors.
- **Item 9:** accepted.
- **Item 10:**
  - Ngani Zho is confirmed off the board 3,652-3,644.
  - Nico Okarr: his file dates the disappearance to 3,681, after he helped Satele and Malcom escape Korriban. He is now on the board in 3,681 and off from 3,680 to 3,632, and his archetype is smuggler.

## 3. The stat scale (D-423)
- **Bands:** skills-and-activities.md §7 says what 40 / 60 / 80 / 100 / 120 mean for each stat, from the calibration profiles and the closed-form lines.
- **The conversion** (src/data/canon/sheetScale.ts, applied at load; the authored sheet numbers are kept): each stat's factor is the median, over the non-fixed hand-set sheets, of the game's progression line for that figure (its archetype, rank spans and age at the sheet's date, with gifted talent) divided by the sheet value. Factors are capped at 1.0.

| Stat | Factor | Spread [p25, p75] | n |
|---|---|---|---|
| Lightsaber forms | 0.83 | 0.73-1.00 | 31 |
| Force abilities (telekinesis) | 0.53 | 0.48-0.73 | 20 |
| Force Control | 0.64 | 0.51-0.77 | 31 |
| Force Sense | 0.52 | 0.46-0.75 | 31 |
| Force Output | 0.75 | 0.56-1.28 | 15 |
| Meditation | 0.24 | 0.19-0.31 | 31 |
| Force Knowledge | 0.28 | 0.20-0.59 | 31 |
| Willpower | 1.00 (1.02 measured) | 0.81-1.37 | 43 |
| Strength / Agility / Endurance | 0.68 / 0.63 / 0.68 | about 0.6-0.75 | 43 |
| Intelligence | 0.20 | 0.16-0.24 | 13 |
| Charisma | 0.27 | 0.14-0.34 | 3 |
| Blaster (and Stealth) | 0.60 | 0.54-1.03 | 8 |
| Melee | 0.24 | 0.22-0.31 | 4 |
| Tactics | 0.48 | - | 1 |

- **The sheets run high,** except Willpower.
- **Two steps of the scale:**
  - Saber and Force skills compress about 0.5-0.85.
  - Meditation, Force Knowledge, Intelligence and Charisma compress to about a quarter, because the game gives them almost no growth.
- **Rank-preserving equating was tried and dropped.** The sheets are bunched (76-88 for most stats, whatever the figure's focus), so equating amplified one-point differences into 20-level jumps.

**Sheets out of band.** I flagged a converted value under 0.67x or over 1.5x the figure's own game line, a Master or Darth with a highest form under 60, or any value over 120 (none):
- **Consulars** (Zym, Dar'Nala, Ngani Zho, Gnost-Dural, Tol Braga, the Barsen'thor):
  - Force Knowledge 23-26 and Meditation 19-22 against Consular lines of 45-236 and 48-100.
  - The sheets gave every Jedi the same Force Knowledge, while the game makes it the Consular's main skill.
  - Very old Consulars' lines overshoot past the apex: Zym at 120 has Force Knowledge 236 and Willpower 209 (the D-415 Oteg problem).
- **Inquisitors** (Baras, Vowrawn, Zash, Mekhis, Acina, Ragate): Force Output 47-63 against Inquisitor lines of 100-111, and Force Knowledge below their lines. The sheets don't give Inquisitors their focus.
- **Sith Warriors** (Malgus, the Wrath, Nox, Thanaton): Force Control and Force Output above their lines (61 against 40 for Malgus); the sheets give warriors more Force than the Warrior archetype trains.
- **Highest form just under 60 for a Master or Darth:** Vowrawn, Zash and Mekhis 58; Baras and Ngani Zho 60.
- **Old Masters' Willpower:** Kao Cen Darach 86, Bela Kiwiiks 84, Tol Braga 86 and Ngani Zho 84 against lines of 126-170. The game grows Willpower all life through fatigue; the sheets stop near 90.
- **Careers:**
  - Jace Malcom's Intelligence 16 against 26.
  - Saresh's Intelligence 17 against 66 (a senator; and frail physically).
  - The agents' Willpower runs above their lines (Theron 82 against 45, Cipher Nine 88 against 52, Meteor 86 against 54).
- **Apex figures:** Vitiate (form 76, Force Control 83) and Revan (form 83) sit under the 100-120 bands in the game scale; a linear factor flattens the top. They are `fixed`, so the flag didn't catch them.

## 4. XP sources: diagnosis and proposals (held for review)

### Diagnosis
| Stat | In play | In the NPC simulation | Result |
|---|---|---|---|
| Force Knowledge | The study activities exist (Force Lore, form theory, the Jedi Code). Teaching a Padawan needs an apprentice, so it is locked until M7. The Force master holocron (65) and the Sith archives (45). The Order requires only the Initiate's 1 h of Force Lore; Padawans and Knights have no study block | Guardian, Sentinel and Sith Warrior paces are 0 after the Initiate years; the Consular's is its main (1.72); the Inquisitor's 0.30 | Average Guardian flat at 13 from 18 to 80; Consular 62 at 40 |
| Meditation | Centering and immersion activities; a 0.5 secondary on the Padawan's Sense awareness block; the centered state gives no XP by itself | Pace 0.06-0.12 for most archetypes; the Consular 0.37 | Guardian 14 at 40, 23 at 80; Consular 28 / 51 |
| Intelligence | Academic study, and secondaries of the career activities. No natural baseline | No officer archetype. Soldier 0.15; civilian main skill (profession) only | Soldier 16 at 40; Jedi 0 for life |
| Tactics | Tactics study only; combat gives no tactics XP | Soldier 0.46 (blaster 1.33) | Soldier 30 at 40, 43 at 60 |

### Proposed sources (a design list; no numbers yet)
1. **Study of texts.** Journals, holocrons and the Archives as training records with fixed teacher levels (sec 15), each tied to a place and era:
   - a master's journal (Obi-Wan's in the Luke era; era-specific journals elsewhere): forms, Force Control and Force Knowledge;
   - named holocrons (Jedi and Sith; the Sith ones grant forbidden access, Q27);
   - the Jedi Archives (Temple only): Force Knowledge 70+, form theory;
   - Sith libraries.

   Study sessions use the record as the teacher. This is Luke's route after Return of the Jedi.
2. **Meditation practice:**
   - a daily meditation block in the Order requirements for Padawans (and a small meditation fill share for Knights);
   - the morning meditation that gives the centered state counts as meditation XP;
   - meditation at a light nexus already speeds Force recovery and could add XP (the Force-rich factor).
3. **Teaching and mentoring:**
   - teachingPadawan unlocks once the character has an apprentice (M7 masters);
   - teaching gives Force Knowledge, Willpower and Charisma XP, plus a small review share in the skill taught ("to teach is to learn");
   - instructor duty for Knights in the Temple.
4. **Learning by dueling a stronger opponent:** a serious or lethal duel against an opponent 10+ levels stronger gives a share of that fight's form XP to the opponent's form, even unknown. A form learned this way opens its basics without a teacher (Luke picking up Vader's Djem So).
5. **Command and staff work for officers:**
   - an officer archetype (tactics main, intelligence second, charisma);
   - commanding in a battle earns tactics XP the way fighting earns form XP (from the battle's stakes and outcome);
   - staff work (planning, logistics) as an activity for intelligence and tactics.
6. **A small natural baseline for Intelligence and Charisma by age** (schooling and life), like Willpower's. Today everyone untrained sits at 0.
7. **A Knight study expectation:** an hour of study a few days a week, so every Jedi's Force Knowledge grows a little after knighthood.
8. **Uneven paths:**
   - The accelerated path (built) leaves knowledge and meditation low.
   - Switching back to the standard path (`trainingPathSet`) plus sources 1-3 lets them grow later: Luke after Return of the Jedi, peaking around Fate of the Jedi.

## 5. M7 §15, "Ranks and milestones" (D-424)
**Built (the core):**
- **Slice:** the ranks slice v2 (rank and start day, master, trial records, Service Corps, Padawans knighted, a pending choice), with a v1 migration.
- **Promotions:** `promotionProposed` is checked against every requirement and applied only when they all hold; otherwise it is rejected with the unmet ones (ranks.md tests 6-7).
- **Trials:**
  - `trialAttempted` rolls the Initiate Trials and the five Knight Trials with their stated checks: Skill 3 of 4 at rating 45; Spirit against the dark pressure; Flesh at f 0.8.
  - Retakes wait a year; a third failure opens `trialFailureChoice`.
  - A wartime heroic act credits Courage and Flesh.
- **Standing:** 50% skill percentile (a seeded population of 1,000 NPC Initiates of the same age), 30% deeds, 20% relationships.
- **Monthly hook:**
  - Padawan selection at S / 940.
  - The Council of Reassignment at 13.
  - A Knight's interest in the Corps at 2% a month.
  - `masterApproval` and the Council bypass when all their conditions hold.
- **Master:** `masterSet` (player or engine; never the AI).

**Tests:** tests/m7/ranks.test.ts, 12 tests:
- the not-chosen rate is 11-17% over 36 rolls;
- the retake rules;
- the trial checks;
- the heroic credit;
- the seeded percentile;
- the AI refusal;
- a Knight promotion with the trials;
- the AI cannot set rank flags;
- a trial attempt;
- reassignment at 13;
- the master's approval from the hook.

**Not built (the rest of M7):**
- the Order schedule revisit;
- named masters' instruction;
- the Council path and wartime postings;
- forbidden powers and reputation;
- teaching XP;
- Sith Force growth;
- the design candidates;
- pace-for-age milestones;
- UI for trials and choices (events only for now).

The player ladder's ages are data, waiting on question 1.

**Suites:** `npm test` 1,258 pass. `npm run test:all` 1,304 pass (131 files) in 379.8 s. The lifetime runs: 334.9 s after items 1-10 and 335.7 s after item A.

## 6. Questions
1. **The player ladder** (§1a): move the Average to Padawan 12.5 and Knight 25, with 10-12 Padawan years and the minimums re-read at about 24 (recommended)? Or keep 20.5?
2. **The accelerated path:** keep x3.2 (Force Control 54 and Djem So 49 at 4 years; 63 and 56 at 5)? The blade lags; should real duels count more on that path?
3. **Force-rich places:** the x1.10 on Force skills is new and invented. Keep it, change it, or remove it?
4. **Rans:** his page has him in office at the Sacking (3,653). I kept that as a one-year span next to Stantorrs (3,643) and Rans 3,642-3,640. Keep 3,653, or drop it too?
5. **Nico Okarr:** his file dates the disappearance to 3,681 (after the Korriban escape), so he is off from 3,680. If you have a later recorded disappearance, which year?
6. **Mandalorians:** only Mandalore the Lesser (an arena gladiator) moved to warrior. Torian Cadera and Akaavi Spar fight in melee in SWTOR, but the lore files don't say so. Move them, or have the lore files checked first?
7. **The warrior archetype** is NPC-only. Offer it at character creation?
8. **The stat conversion:** accept the linear per-stat factors? And how should the out-of-band groups (§3) be handled?
   - Consular and Inquisitor sheets sit far below their focus lines;
   - Sith Warriors sit above theirs;
   - apex figures are flattened (Vitiate's form 76).

   Options: hand-set game-scale lines (`scale: 'game'`) for the apex and focus figures, or a per-archetype factor.
9. **Very old figures:** the generator overshoots for long lives (Zym at 120 has Force Knowledge 236 and Willpower 209). Cap the closed form at the apex band (about 120-135)?
10. **The XP-source proposals** (§4): which to build, and in which milestone?
11. **The Sith Order rows** (ranks.md §1a, "to confirm in M7"): keep the Initiate row for acolytes and the Padawan row for apprentices?
12. **Deeds in standing:** I used 20 points a deed flag, up to 100 (a design default). OK?
