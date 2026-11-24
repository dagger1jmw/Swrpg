# Progression numbers (v1)

## 1. Tiers
0-20 Untrained | 21-40 Apprentice | 41-60 Adept | 61-80 Master | 81-100 High Master |
101-150 Legendary | 151+ Transcendent

## 2. Curve (XP = effective training hours)
Total XP to reach level L:  XP(L) = K * L^1.75
Level from total XP:        L = floor((XP / K)^(1/1.75))
K is solved so the Average profile reaches level 41 in exactly 16.0 training years:
  K = 16 * (Average profile yearly main-skill XP) / 41^1.75     (expected ~14.5)
Amended by D-40: K re-solved with the Average schedule (Order requirements + D-25 budget +
  shares, through the day model) = 14.69, computed by docs-v2/calc/progression-sim.mjs.
Amended by D-102 (D-67 decided in M3: natural baseline, sec 11a): K re-solved = 15.18
  (15.181, docs-v2/calc/progression-sim.mjs). No longer provisional.
Amended by D-118 / D-119 (form plans and the fundamentals transfer): the targets apply to the
  highest lightsaber form; the Average trains Shii-Cho as an Initiate, then main Soresu 2 h + second
  Ataru 1 h from Padawan, and a new form starts at 0.75 x the highest form (sec 7a). K re-solved =
  11.683 (docs-v2/calc/progression-sim.mjs).
Amended by D-431 (the daily meditation block from Padawan on, the age-scaled Padawan hours, the
  Sith rows): K re-solved on the real day loop (npm run ksolve, the gated seed: 41 at 15.995 years)
  = 12.30. The calc model no longer mirrors the routine (no daily-life blocks or scaled hours); the
  archetype paces are measured on the day loop too (tests/paces).
Reference (K = 12.30): XP(21)=2,534  XP(41)=8,171  XP(61)=16,377  XP(81)=26,900
  XP(101)=39,579  XP(151)=80,005
Before D-431 (K = 11.683): XP(21)=2,407  XP(41)=7,761  XP(61)=15,555  XP(81)=25,551
  XP(101)=37,594  XP(151)=75,991
Before D-118 (K = 15.18): XP(21)=3,127  XP(41)=10,085  XP(61)=20,213  XP(81)=33,201
  XP(101)=48,850  XP(151)=98,744
  (K = 14.69 before D-67: XP(41)=9,760.)
  (Old reference, K = 13.55 before the fatigue model: XP(41)=9,000.)

## 3. Fatigue model (replaces fixed effective-hour tables)
Two meters, physical and mental, updated every 30 minutes.

Load per hour (physical, mental):
  Lightsaber drills 1.0, 0.4 | Strength/cardio 1.2, 0.2 | Force drills 0.4, 0.8
  Study/reading 0.05, 1.0    | Meditation 0.05, -0.5 (restores mental)
  Every activity in the catalog must declare its (physical, mental) load.
Intensity (load mult, XP mult): casual 0.6, 0.7 | standard 1.0, 1.0 | intense 1.4, 1.2 |
  extreme 1.8, 1.35

Capacity (load-hours):
  Physical = 3 + 4 * min(Endurance,100)/100 + max(0, min(Endurance,150) - 100)/50
  Mental   = 3 + 4 * min(Willpower,100)/100 + max(0, min(Willpower,150) - 100)/50
  (stat 30 -> 4.2, 90 -> 6.6, 150 -> 8.0)

f = meter / capacity. Base efficiency e(f):
  f <= 0.4: 1.0 | 0.4 < f <= 1.0: linear 1.0 -> 0.3 | f > 1.0: 0.1, strain gain x2,
  2% injury risk per hour of physical activity (see streak rules)

Efficiency of each 30 minutes:
  Physical activity: e(f_phys) * (1 - 0.15 * min(1, f_mental))
  Mental activity:   e(f_mental) * (1 - 0.5 * min(1, f_phys))
  Post-workout window: the first 1.0 hour of mental activity right after physical activity
    (physical load >= 0.8) counts 1.25 * e(f_mental) and ignores the physical penalty.
  Same activity: each hour beyond 2 of the same activity in one day x0.85.

Recovery: rest/meal -0.75 physical and -1.0 mental per hour. Sleep 7h+: full reset;
  5-7h: 30% carries over; under 5h: 60% carries over.
  Amended by D-52: elapsed time not covered by an activity is rest at these rates, in story
  turns and in jumps alike. Sleep is an intent action (actionType sleep) or a routine block,
  resolved by the engine; only sleep gives the 7h+ reset.
  Every activity's loads are listed in spec/skills-and-activities.md (D-53).

## 4. Challenge factor
gap = activity difficulty rating - skill level
  Continuous: interpolate linearly between these anchor points (flat outside them):
  gap -25: x0.3 | -15: x0.6 | -10: x1.0 | +5: x1.0 | +12: x1.25 | +18: x1.25 | +25: x0.8 |
  +35: x0.3
  Push side effects ramp linearly too: strain up to x1.3 and failure chance up to +10%
  (over gap +5..+12), injury risk starting over gap +18..+25.
  No step tables: one point of gap never changes the factor by more than 0.08.
Drill ratings: Basic 10, Intermediate 30, Advanced 50, Master 70, Legendary 90.
Unlocked by teacher and level.

## 5. XP per session
XP = effective hours * intensity XP mult * challenge * weight * M * outcome
  Main skill weight 0.75; secondary skills share 0.25 by their weights (never additive).

Speed multiplier M = talent * cross-talent * instruction (sec 15, 19) * age (sec 16)
  * state of mind (sec 17) * alignment (alignment.md sec 8), capped at 2.8
  (alignment added by D-64, matching D-21 and alignment.md)
  Talent (per domain): none 1.0 | gifted 1.25 | prodigy 1.5 | exceptional 1.8
  Cross-talent: Force prodigy on combat skills 1.1
  Instruction: per-skill teacher and training-partner factor, sections 15 and 19
    (replaces the old fixed teacher factor)
  Experience: no multiplier. Wartime growth comes from combat XP, E and CI
    (docs/spec/combat-xp.md).
  Absolute maximum overall pace: 4.0x the Average profile, enforced by a clamp (D-48; the
    rule since D-457, Jared: the ceiling limits prodigy speed, never focus): per skill, over a
    rolling 365-day window, credited training XP (sessions, their synergy and fatigue
    Willpower) cannot exceed
      cap = 4.0 * R_avg(skill, age) * (the character's hours in that skill in the window)
    where R_avg(skill, age) is the Average's XP per hour of training in that same skill for
    the 365 days starting at that age (the 20-seed median of its window XP / window hours;
    src/data/paceRates.ts, interpolated), and the window's hours are that skill's hours only
    (a session's hours by XP share, D-109). Hours in other skills never change a skill's cap.
    Fights are outside it (D-457): per exchange, combat XP differs from the Average's in the
    same fight only by M (capped at 2.8, under 4.0); combat XP keeps its own limits
    (combat-xp.md), and the lifetime 4.0x floor still counts it. A lightsaber form the Average does not train reads the
    Average's most-trained form; any other skill it does not train reads the Average's
    whole-training rate (design default). The excess is discarded and logged. Banked drill
    XP released after combat is excluded (it does not count toward the window).
    Y_avg(age) below is no longer the cap: it stays the reference of the "within 4.0x"
    lifetime floor (D-235) and the Average's yearly table gate.
    Y_avg(age), K = 11.683 (computed by docs-v2/calc/progression-sim.mjs, per 365 days; the
    most-trained form's XP; recomputed by D-118 / D-119 / D-120):
      age 4: 583 | 8: 608 | 12: 561 | 16: 532 | 20: 526 | 24: 434 | 30: 399 | 40: 458 |
      50: 434 | 60: 487 | 70: 431 | 80: 423 | 90: 322 | 98: 202
    (D-102 values, K = 15.18: 582 | 544 | 691 | 670 | 720 | 595 | 585 | 572 | 556 | 599 |
      544 | 544 | 425 | 304.)
    (The D-104 share rule, max(focus share, the skill's share of the window's training hours),
      is replaced by D-457: it made training other skills shrink the main skill's cap.)

Outcome roll per session (code rolls it, mean ~1.0):
  failure 15% x0.7 | partial 25% x0.9 | solid 38% x1.0 | strong 18% x1.2 |
  breakthrough 4% x1.75

## 6. Which skills have which limits
  Lightsaber forms: drill ceiling + bank (section 7)
  Physical stats: no ceiling
  Non-combat Force abilities: no ceiling
  Combat Force abilities: no ceiling; combat integration penalty in combat (section 8)
  Every Force ability is tagged combat, non-combat, or both.
  Shatterpoint: a rare Force ability (tagged both) on the main curve, unlocked only by the
    shatterpoint perception talent, with an XP cost multiplier of x3 (tunable). No separate XP track.

## 7. Lightsaber drill ceiling and bank
Applied experience E (0-120; amended by D-176: the gains scale by (1 - E/120), so 120 is their limit) per lightsaber form group.
  Drill ceiling = 25 + E
  E gains, each scaled by (1 - E/120):
    sparring with peers +0.2/session | sparring with master +0.4/session
    (E from all sparring capped at 15) | real skirmish +3 | serious duel +6 |
    life-or-death vs a stronger opponent +10
  Above the ceiling: 25% of drill XP applies; 75% is banked.
  Bank cap: the XP needed for 15 levels above the current level.
  After real combat: for 60 days, release 10% of the remaining bank per day, up to the new
    ceiling. Banked XP does not count toward the 4.0x pace cap.
  Amended by D-45:
    Sparring XP IS ceiling-limited: sparring sessions (and their combat XP to the form) count
      as drill XP for the ceiling and the bank. Real fights (skirmish or higher) are not
      ceiling-limited.
    After day 60, whatever is left in the bank stays banked for the next real fight (it is
      not lost and not released further). A later skirmish or higher starts a new 60-day
      release.
  Amended by D-163: sparring E is capped at 15 with peers only; a partner 10+ levels above raises
    it toward that partner's level - 25 (combat-xp section 3), and 2-3 partners at once count as
    the strongest + 10 per extra. A peacetime master keeps the ceiling above the form by
    sparring stronger partners or groups.
  Reference scenario (Obi-Wan pace, E 12, first life-or-death fight at training year 12):
    year 11: level 40.4, bank 400 | year 12: 40.9, bank 1,022 | E -> 23.8, ceiling 48.8 |
    +1 week 42.3 | +2 weeks 43.0 | +1 month 43.6 | year 13: 45.5

## 7a. Form plans and the fundamentals transfer (added by D-118, D-119)
Initiates train only Shii-Cho basics (the Order forms block, ranks.md §1a). From Padawan on, a form
  plan splits the 2 h master session and the 1 h solo hour among any number of forms (the largest
  share trains with the master first; the forms part of the fill follows the plan's proportions);
  an optional Knight+ plan (default: the Padawan plan). Shii-Cho may stay in a plan or be dropped:
  a form that is no longer trained keeps its XP and rusts (sec 13); its foundation synergy still
  applies while it is trained.
Fundamentals transfer: a lightsaber form's first session (as the session's primary) sets its XP to
  0.75 x the character's highest form XP at that moment (tunable, FORM_TRANSFER_SHARE). Once per
  form; outside the 4.0x clamp, like banked XP; lightsaber forms only, never Force abilities. A form
  never trained can be started with a teacher present (its basics drill unlocks for "known or with a
  teacher"). Character creation applies the same transfer for every form in the Padawan and Knight+
  plans, at the start of that phase.
Niman (Form VI, D-121): its transfer is measured against the AVERAGE of the Form I, III, IV and V
  levels (Shii-Cho, Soresu, Ataru, and Form V = the higher of Shien and Djem So; an untrained form
  counts as 0), not the highest form; the 0.75 share applies to that average's XP.
Why: a new form started from zero, so with the targets on the highest form the Average's Soresu
  (from 12) could not reach 41 in 16 years: K fell to 6.8 and Shii-Cho reached 41 at 12 (D-118).
  Calibration with the transfer (docs-v2/calc): 0.5 put milestone 21 at -29%; 0.70-0.90 put every
  milestone within +/-20%; 0.75 is the most centred.

## 8. Combat integration (combat Force abilities)
CI (0-120; D-176, the limit of the (1 - CI/120) gains) per ability. Integration line = 25 + CI. G = level - line (no penalty if G <= 0).
  In combat only: effective level = line + 0.5 * G
                  Force strain cost x (1 + 0.015 * G), max x2.0
                  misfire chance 0.3% * G, max 15%
  CI gains per use, scaled by (1 - CI/120): sparring +0.1 (CI from sparring capped at 20) |
    real skirmish +0.5 | serious duel +1 | life-or-death +2
  Reference (Force Push level 70, CI 10): effective 52.5, strain x1.52, misfire 10.5%.
    After 20 skirmish uses: CI 18.8, 56.9, x1.39, 7.9%. After 10 life-or-death uses: CI 27.0,
    61.0, x1.27, 5.4%. After 60 serious-duel uses: CI 53.4, 70, x1.00, 0%.

## 9. Willpower from fatigue
Each 30 minutes, f = max(f_phys, f_mental).
  Willpower XP per hour = 1.5 * g(f)
  g(f) = 0 if f < 0.6 | linear 0.25 -> 1.0 for 0.6..1.0 | 1.5 if f > 1.0
  Daily cap: 3.0 willpower XP. Applies to any activity done while tired.
  Amended by D-51: Willpower is also trained directly. Willpower meditation, the endurance
    ordeal drill, and every activity with a Willpower secondary weight
    (skills-and-activities.md) credit it like any other skill. The 3.0/day cap applies to
    fatigue Willpower XP only. Every archetype has a Willpower weight (npc-generation §3).
  Reference: 3h drills End 30 -> 0.0 | 6h drills End 90 -> 1.42 |
    4h drills + 3h study End 60 Will 40 -> 2.88 | 8h drills End 60 -> 3.0 (cap)

## 10. Overtraining streak
A day ending with either meter > 1.0 is an overtrained day. For each consecutive one:
  next-day capacities -10% per day (max -50%)
  injury risk per hour above 1.0 = 2% * (1 + 0.5 * streak days)
  from the 3rd consecutive overtrained day, the whole day's fatigue willpower XP is halved
    (amended by D-110: the day credits half of min(3.0, raw); halving only the XP earned above
    f 1.0 never made a pushing streak earn less, since the capacity cut raises f and the cap fills)
The streak resets after a rest day or a day ending below 0.6.
Reference: ~3 hours past the limit daily for 5 days -> 46% chance of an injury.

## 11. Physical performance
Physical = min(trained level, body cap for age) + Force boost
Force boost = min(45, 0.3 * max(0, ForceControl - 40) + 0.2 * Force body-ability level)
Human body cap by age (straight-line between points):
  5:15 | 9:25 | 12:35 | 15:50 | 18:65 | 22-35:80 | 45:78 | 55:74 | 65:68 | 75:58 |
  85:45 | 100:25
  (D-472: the fall after prime is now the decline curve of species.md sec 1, the same numbers for
  Strength and Endurance, sooner for Agility, read at the body age; the trained level falls too.)
Other species get their own tables (species.md: the Human table rescaled by age mapping and
  bodyScale, D-103). The species lifespans and maturities that feed the age mapping come from lore
  batch 21 (D-399; src/data/species.ts, each tagged lore / game stat / invented). The body-cap
  maths is unchanged: the species bands reach it only through the Human-equivalent age h.
  Force-sensitive longevity (D-399 [5]) is the Force Control stretch of species.md sec 1, in
  Human-equivalent years for every species (D-472: the scaled rule it waited for).

## 11a. Natural baseline (added by D-102; decides D-67)
Untrained characters are not at 0 in body and will. Natural level N by Human-equivalent age h
(species.md sec 1):
  Strength, Agility, Endurance: N = 0.5 * body cap(h) for the species (sec 11), at its peak from
    prime on (D-472: the age loss is taken off the level instead)
  Willpower: N = 4: 10 | 10: 18 | 16: 25 | 20: 30 | 30: 35 | 60: 40 (straight lines, flat outside)
  Every other skill: N = 0
Training adds on top in XP terms: level = floor(((K * N^1.75 + trained XP) / K)^(1/1.75)).
  Every hour of training counts, nothing steps, and levels stay derived. Physical stats then
  apply min(level, body cap) + Force boost (sec 11). Fatigue capacity (sec 3) reads these levels.
Why: without it the Average profile's Endurance stayed near 5 to age 20, capacity near 3.2, and
  the tiredness limit trimmed 2.3 h of the fill each training day (D-67). With it: 0.30 h
  trimmed, max day-end f 1.02. A conditioning hour in the Order requirements was computed and
  not taken: it raised the max day-end f to 1.19 (fixed commitments are never trimmed), so
  Initiates would be overtrained daily, and it did not raise Force Sense.
Reference (Luke, 1h/day body ability): age 30: 89.7 | 40: 98.7 | 50: 103.6 |
  62: 105.6 (peak band 60-66) | 70: 103.6 | 80: 96.5. Average Jedi peaks ~87 near age 45.

## 12. Calibration profiles and targets
Years of training to reach each tier (+/-20%), age in brackets:
  Average (start 4):   21: 5.0 (9)   41: 16.0 (20)  61: 32.1 (36)  81: 52.7 (57)  101: 77.5 (82)
  Obi-Wan (start 3):   3.5 (6.5) 10.8 (14)  21.7 (25)  35.6 (39)  52.4 (55)
  Anakin (start 9):    1.3 (10)  4.1 (13)   8.2 (17)   13.5 (22.5) 19.9 (29)
  Luke (start 19):     1.7 (20.7) 5.5 (24.5) 13.9 (33)  22.8 (42)  33.6 (53); Force ~116 at 62
  D-461 (Jared): Obi-Wan's 21 3.4 -> 3.5 (the lore-correct saber gate delays his first Form
  I; the target is not canon-anchored); Luke's 41 6.9 -> 5.5, his measured 20-seed median
  (5.46). These targets are design values (the v2 spec, 2026-11-16), not Legends anchors.
  D-462 (Jared): Luke's 21 2.1 -> 1.7, his measured 20-seed median (1.69). Luke's targets are
  measured regression values (what his profile produces on the loop), not canon anchors.
Profile schedule structure (amended by D-40, D-41, D-42; supersedes the inputs below):
  Every profile runs the same structure: the Order requirements for its rank (ranks.md
  §1a) as fixed commitments, filled up to the D-25 training budget (training-routines §2)
  by its archetype shares; the main specialty takes a 0.5 share of the fill from Knight on.
  Profiles change only effort (hours), talents, teachers, rank ages and combat events.
    Average: Jedi Guardian, start 4, standard effort, 300 training days of 368, Padawan at
      12, Knight at 25 (D-426; 20.5 before), Temple instructors x1.05, master x1.15, solo x0.90, fill x1.00,
      no talent, peacetime (1 real skirmish per year keeps the drill ceiling above the
      main form; it never binds).
    Obi-Wan: start 3, push effort, 315 days, Padawan at 13, Knight at 25, master strong in
      his form (x1.20).
    Anakin: start 9, push effort, 315 days, Padawan at 9, Knight at 20, prodigy in combat
      and Force (x1.5, x1.1 cross-talent on forms), master not a specialist in his form
      (x1.05), war years 19+.
    Luke: start 19, outsider (no Order requirements), standard effort, 280 days, Force
      prodigy (x1.5 on Force skills), solo and holocrons (x0.90), broad focus (main share
      0.4).
  Average result (docs-v2/calc/progression-sim.mjs, K = 11.683, form plans and transfer sec 7a,
    D-118 / D-119 / D-120; highest form):
    21: 4.2 y (-16%) | 41: 16.0 y | 61: 34.1 y (+6%) | 81: 56.7 y (+8%) | 101: 84.8 y (+9%)
    Age 16: Shii-Cho 30.1, Soresu 34.2, Ataru 28.0. At age 20.3: highest form 41.5, Force Control
      34.5, Force Sense 31.2, Willpower 53.9. At age 35: highest form 57.8.
    Fill hours are trimmed in proportion to their planned hours (D-120, training-routines §4).
  Before D-118 (K = 15.18, natural baseline sec 11a):
    21: 5.5 y | 41: 16.0 y | 61: 32.6 y | 81: 55.2 y | 101: 83.5 y (all within +/-20%)
    At age 20.3: main form 41.5, Force Control 29.7, Force Sense 26.8, Willpower 49.3,
      Endurance 37.6. At 30: Force Control 34.8, Force Sense 31.3, Endurance 43.8.
    (Before D-102, K = 14.69: 5.4 / 16.0 / 34.3 / 57.5 / 86.5 y; Endurance 5.3 at 20.5.)
  Peacetime baseline of the other three (no combat events; docs-v2/calc/profiles.mjs):
    Obi-Wan 41 at 13.3 y, 61 at 24.6 y (targets 10.8, 21.7) | Anakin 41 at 7.7 y (target 4.1)
    | Luke main form 41 at 20.3 y (his targets are Force skills, tuned in M4). These miss
    because combat XP is not in the run yet; they are tuned in the M4 lifetime test.
Reference inputs before the fatigue model (history, superseded by the structure above):
  Average 300 days, 3h standard drills, M 1.0 | Obi-Wan 315 days, 5h, M 1.10 |
  Anakin 315 days, 6h, M 2.72 | Luke 280 days, 3.5h, M 2.25
  (Anakin's and Luke's M above included a war factor of 1.25. That factor is gone, and their
  wartime pace must now come from combat XP; see combat-xp.md section 5.)
With the fatigue model and sections 13-19, profiles also need ages (for learning speed),
teachers per skill (Anakin's saber teacher is not a Djem So master), training partners,
state-of-mind events, starting Endurance/Willpower, schedules, drill
difficulty, and combat events (Average/Obi-Wan sparring only until first missions;
Anakin and Luke wartime).

## 13. Rust (skills unused for a while)
Rust R is a temporary penalty; XP is never lost. Effective level = level * (1 - R).
  Grace period: 30 days without practice before rust starts.
  Technique skills and Force abilities: +1.0% per 30 days unused, max 15%.
    Deeper skills rust slower: rate and cap scale linearly from level 40 (1.0% per 30 days,
    max 15%) to level 80+ (0.5% per 30 days, max 10%).
  Physical stats (detraining): starts after 14 days, +1.0% per 30 days, max 20%.
  Knowledge stats (Force Knowledge, Intelligence): +0.25% per 30 days, max 5%.
  Removal: each effective hour of practice (or real use in combat) removes 0.5 percentage
    points of rust, on top of normal XP.
  Reference: level 30 unused 6 months -> 5.0%, 12 months -> 11.0%, 36 months -> 15% (cap);
    level 70 unused 12 months -> 6.9%, 36 months -> 11.25% (cap);
    level 80+ unused 12 months -> 5.5%, 36 months -> 10% (cap); 15% rust clears in 30
    effective hours (~10 days of 3h practice).

## 14. Synergy (related skills share XP)
Spillover XP to a related skill = credited XP of the source session * coefficient.
It is the only XP added beyond a session's own split, and it stops once the target reaches
its ceiling (a fraction of the source skill's level).
Because of the curve, a spillover fraction s alone lifts the target to about s^(1/1.75) of
the source's level. That is the main tuning lever.
  Relation type                         coefficient  ~level ratio  ceiling (x source level)
  Variant forms (Shien <-> Djem So,
    Juyo <-> Vaapad)                    0.25         0.45          0.60
  Parent form -> derived form
    (Soresu -> Shien, Juyo -> Vaapad)   0.10         0.27          0.50
  Foundation (Shii-Cho -> all forms
    except Niman)                       0.05         0.18          0.40
  Niman foundation (Forms I, III, IV,
    V -> Niman; D-121, replaces the
    0.05 forms I-V -> Niman)            0.10         0.27          0.60
  Parent ability -> sub-ability
    (Telekinesis -> Force Push)         0.10         0.27          0.50
  Sub-ability -> parent ability         0.15         0.34          0.80
  Force Control -> all Force abilities  0.03         0.14          0.30
  Force Sense -> sensory abilities      0.05         0.18          0.40
  Strength <-> Endurance <-> Agility    0.05         0.18          0.80
  Build the relationship map as data from Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md;
  flag any relation the lore does not support. Coefficients are tunable within +/-0.05.
  Total spillover from one session may not exceed 25% of its credited XP.

## 15. Teacher factor (per individual skill)
diff = teacher's level in THAT skill - student's level in THAT skill
  factor = 1 + 0.005 * diff, for diff from -10 to +30 (x0.95 to x1.15, capped at x1.15)
  below -10: no teaching benefit (counts as training solo or with a partner, section 19)
  Teaching aptitude of the teacher (from Charisma/Willpower or a trait): +/-0.05 on top.
  Holocrons and archive records act as teachers with a fixed level for the skills they
  cover, at x0.9 effectiveness for physical techniques and x1.0 for Force and knowledge.
  A master is only a great teacher in what they are great at: a Soresu master teaching
  Djem So uses their Djem So level.

## 16. Age and learning speed
  The table gives anchor values at ages 6, 10, 15, 24, 40 and 60 (the middle of each band).
  Interpolate linearly between anchors and hold flat outside them; no jumps on birthdays.
  Age:                     <=8    9-12   13-17  18-30  31-50  51+
  Technique and Force
    fundamentals (forms,
    Force abilities, Force
    Control/Sense):        1.25   1.15   1.05   1.00   0.95   0.90
  Wisdom skills (Meditation,
    Force Knowledge):      0.85   0.90   0.95   1.00   1.10   1.20
  Physical training
    response:              0.80   0.90   1.10   1.00   0.90   0.75
  Academic (Intelligence): 1.00 at all ages
  Long-lived species map these bands onto their own life stages (through h, species.md sec 1;
  the bands per species are lore batch 21's, D-399).

## 17. State of mind
Amended by D-46 and D-54: one enum and one mapping table, owned by progression. The age
row and categories of each skill come from skills-and-activities.md.

StateOfMind (one at a time, the strongest wins) =
  centered | neutral | distracted | fear | anger | hatred | pride | despair
Grief is NOT in this enum: it is a separate lingering condition (progression.grief) that
runs alongside whatever state is active (D-46).

| State | XP multiplier | Source |
|---|---|---|
| centered | x1.05 | engine: meditated 30+ min today; or emotionalEvent calm |
| neutral | x1.00 | default |
| distracted | x0.90 | engine rules only: an unresolved thread with a deadline within 3 days, or an overtraining streak of 2+ days |
| fear, anger, hatred | light-side techniques and Meditation x0.80. Channeling into Force Output, dark-tagged abilities or aggressive forms (Djem So, Juyo, Vaapad) x1.20, x1.30 when dark pressure > 50, +0.5 dark pressure per effective hour channeled (the dark side's shortcut and its trap) | emotionalEvent fear / anger / hatred |
| pride | x1.00 (its effect is combat: defense -1 vs someone believed weaker, rolls.md §5) | emotionalEvent pride |
| despair | x0.80, easing back to x1.00 over 14-30 days like grief, but not lingering under other states | emotionalEvent despair |

| Lingering condition | XP multiplier | Rule |
|---|---|---|
| grief | x0.80, easing back to x1.00 over 14-30 days depending on the event | emotionalEvent grief; keeps its x0.80 and its dark-pressure floor (alignment.md §3) even while anger, calm or any other state is active; multiplies with the active state (e.g. centered with grief: x1.05 x 0.80) |

emotionalEvent mapping (the AI proposes; the engine validates and applies one per turn):
| emotionalEvent.type | Result |
|---|---|
| grief | grief (lingering condition) |
| fear | fear |
| anger | anger |
| hatred | hatred (added to emotionalEvent by D-54) |
| calm | centered |
| pride | pride |
| despair | despair |
"Distracted" never comes from an event. Centered no longer requires "no distress": it
stacks with grief. Strength order for "strongest wins": hatred > anger > fear > despair >
pride > distracted > centered > neutral. The state of mind and grief multipliers count
inside the 2.8 cap.

## 18. Lasting injuries and adaptation
A lasting injury sets a base penalty P on the skills and stats it affects. Adaptation A
(0-100%) reduces it: effective penalty = P * (1 - A).
  Examples (tunable; map to Docs/SW_Injury_System_v1.md):
    Lost dominant hand: lightsaber forms P 40%, hand-based Strength tasks P 20%
    Lost limb (leg): Agility P 35%, Endurance P 15%, lightsaber forms P = 0.5 x the Agility P
      (17.5%; D-251, design default: form footwork). It applies with any aid, a prosthetic or
      cybernetic leg included, and adaptation reduces it like the others. The leg's form hours
      still adapt it at LEG_FORM_SHARE (D-230), not in full. Its Endurance P also cuts the fatigue
      meters' capacity (Endurance read x (1 - 0.15 x (1 - A)) for the capacities), in and out of
      fights (D-252).
    Severe joint or muscle wound: affected stat P 15%
    Major burns or lung damage: Endurance P 40%, Force Output P 10%
  Adaptation: +1% per effective hour of training the affected skills (at most 3% per day).
  Maximum adaptation: basic prosthetic 80% | quality cybernetic 100% | scar tissue 70% |
    off-hand retraining 90% (switching to the other hand)
  Reference: lost hand with a quality cybernetic, 3h/day of forms -> full adaptation
    in ~34 days; with a basic prosthetic, a permanent 8% penalty remains.

## 19. Training mode and feedback
  Solo: x0.90
  With a partner (within +/-15 levels in that skill): x1.00; partner weaker by >15: x0.95
  With an instructor: use the teacher factor (section 15)
  Partner or teacher the character has a strong bond with (relationship friend or closer): +0.03
  Sparring counts as partner training and also gives E/CI (sections 7, 8).
  Reviewing a recording of your own fight: +5% XP to that skill for the next 3 days, at most
    once per 7 days.

## 20. Required tests
 1. Lifetime test: all four profiles hit section 12 within +/-20%; the Average profile runs
    95 years, the others 70 (D-49).
 2. No input combination exceeds 4.0x Average pace (banked releases excluded): the D-48 clamp
    discards credited XP above the cap in any rolling 365-day window, per skill, and logs it.
 3. Luke's physical peak falls at ages 58-68 and his Force level is still rising at 60.
 4. Fatigue reference days (section 3 and 9 references) within +/-0.05. Amended by D-39: the
    single-stat cases use Willpower 30 (the original values came from a simplified run that
    did not state it); values recomputed from the full section 3 rules by
    docs-v2/calc/fatigue-reference.mjs:
    End 30 3h drills 2.67 | End 30 6h 3.39 | End 90 6h 4.52 | End 90 8h 4.88 |
    End 90 6h easy (gap -25) 1.36 | study 2h then drills 3h (End/Will 50): 1.99 / 2.57 |
    drills 3h then study 2h: 2.76 / 1.87 | drills 3h then study 3h: 2.76 / 2.26
 5. End 90: 8h gives < 10% more XP than 6h and ends with f_phys > 1.0.
 6. Challenge factor is continuous: gap -25 or lower x0.3, gap -20 x0.45, peak x1.25 over
    +12..+18, and no change larger than 0.08 per point of gap.
 7. Post-workout: first mental hour x1.25; third hour lower than the same hour done fresh.
 8. With sparring only (E <= 15, ceiling 40), a form gains at most 25% of normal XP above 40
    (D-45; sparring XP is ceiling-limited).
 9. Plateau scenario (section 7) gains >= 2 levels within 30 days of combat; after day 60
    the release stops and whatever is left stays banked for the next real fight (not lost),
    and the next skirmish or higher starts a new release (D-45).
10. Physical stats and non-combat abilities reach 100+ with no combat events.
11. Combat integration reference table (section 8) reproduces exactly; no penalty outside
    combat.
12. Fatigue Willpower XP never exceeds 3.0/day (direct Willpower training is outside this
    cap, D-51); a 7-day pushing streak earns less fatigue willpower than alternating push and
    recovery days (the same number of push days; D-110).
13. Outcome roll mean over 10,000 seeded sessions = 1.0 +/- 0.02.
14. Activity XP to all skills combined = effective hours * mults (secondaries never additive;
    synergy spillover is the only extra XP, and never exceeds 25% of the session).
15. Rust reference values (section 13) reproduce exactly; rust never reduces stored XP.
16. 30 effective hours of practice clear 15% rust.
17. Spillover alone never lifts a skill past its ceiling; with only a 0.25 coefficient, a
    target settles near 0.45x the source level (+/-0.05).
18. Teacher factor uses the teacher's level in that specific skill (a Soresu master
    teaching Djem So at a lower level gives the lower factor).
19. A student who passes their teacher in a skill stops getting a teaching bonus in it.
20. Age bands apply per skill category; Luke's profile (start 19) gets no child bonus.
21. Grief reduces XP to x0.80 and returns to x1.00 within its stated window.
22. Channeling anger gives x1.20 to eligible skills and adds 0.5 dark pressure per effective
    hour; ineligible (light-side) skills get x0.80.
23. Injury reference (section 18): quality cybernetic reaches full adaptation in 30-40 days
    at 3h/day; a basic prosthetic leaves 8% (40% * 0.2).
24. All multipliers in M (talent, cross-talent, instruction, age, state of mind, grief,
    alignment) still respect the 2.8 cap, and the D-48 clamp holds the 4.0x pace limit with
    every multiplier at its maximum (D-48, D-64).
25. Grief lingers: with grief active, entering anger or centered keeps grief's x0.80 and the
    dark-pressure floor (D-46).
26. emotionalEvent maps to the state of mind by the section 17 table; distracted never
    comes from an event (D-54).

## 21. Special training conditions (added by D-418)
Conditions that change how fast a character trains, beyond talent, teacher and age:
  Exceptional teacher: the teacher factor of sec 15 at its cap (x1.15), plus aptitude (+0.05)
    and bond (+0.03, sec 19). Inside the 2.8 M cap and the 4.0x clamp.
  Force-rich place: Force skills (the Force stats and abilities) x1.10 at a Force-rich site
    (force-reserve.md sec 9 site types: light nexus, dark nexus, living Force site). Inside the
    2.8 M cap and the 4.0x clamp. Invented (D-418). A nexus site x1.15; the stronger of a site
    and its planet wins; only on a matching or balanced leaning (D-432).
    Three tiers (D-451): a major nexus planet x1.15 (Tython balanced, Korriban and Dromund Kaas
    dark); an ordinary nexus or Force-rich planet x1.10; a site x1.15. The stronger wins, no
    stacking (the Valley of the Dark Lords and the Dark Temple equal their planets). Mortis is
    story-only: no multiplier and no map access.
    Built into the calibration (D-445, D-451): the profiles and the Order archetypes live at their
    Order's seat by date (src/data/orderSeats.ts): the Jedi in the Coruscant Temple (x1.15), and
    from 3,650 BBY on Tython (x1.15, so the move costs nothing); Sith acolytes at the Korriban
    academy and apprentices and Lords on Dromund Kaas while the Empire holds them (both x1.15),
    measured from 3,671 BBY, since the Sith have no seat at the neutral test year; the field x1.
    Luke trains on Dagobah (x1.10) for one month at 22 (3 ABY; Jared's ruling, D-452).
  Accelerated path: training cut to the essentials of using and channelling the Force and blade
    work. History, protocol and most doctrine are dropped (the Order's knowledge blocks leave the
    routine); only enough doctrine is kept to understand what being a Jedi means.
    Effect: Force skills and lightsaber forms x3.2 on top of the 2.8 M cap, and their 4.0x clamp
    raised x3.2. Knowledge and doctrine stats (Force Knowledge, Meditation, Intelligence) get no
    bonus and stay low until later study (the player switches back to the standard path).
    It is the only condition allowed to exceed the 4.0x ceiling. The 4.0x calibration and the
    averages are not recalibrated for it.
    Target (an outlier, not calibration data): Luke (accelerated path, exceptional teacher, a
    Force-rich place with a dark-side nexus) reaches a powerful Knight (about 55 in Force Control
    and the blade, stats spec bands) in about 4 years. Harness check:
    tests/lifetime/lukeAccelerated.test.ts (20-seed medians at x3.2: Force Control 54.4 and Djem
    So 48.8 at 4 years, 62.9 and 56.3 at 5). The numbers are first tuning, for Jared to adjust.
