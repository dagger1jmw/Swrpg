# Ranks, Order requirements and milestones (v1)

All skill minimums are checked against the progression curve: an Average profile meets each
one at the typical age. Every promotion is a story event the player plays; code checks
requirements, rolls the checks, and applies the result. The AI can only propose
(promotionProposed) and narrate.

## 1. Jedi path
Initiate (youngling)
  From the training start age. Clan training, Order routine requirements (routines spec).
Initiate Trials (eligibility to be chosen)
  Eligible from age 10 with main form >= 18 and Force Control >= 15 (Average reaches both
  around age 10-11). Played as a scene; checks at DC rating 20.
Padawan selection (playable window)
  From passing the Initiate Trials until age 13.
  Standing S (0-100) = 50% skill percentile for age (main form, Force Control, Force Sense,
    vs the Average profile at the same age) + 30% notable deeds (flags) + 20% relationships
    with Knights and Masters.
  Each month: chance a Knight or Master chooses you = S / 800 (S 50 -> about 6% per month;
    about 14% of average Initiates are never chosen). Tournaments, demonstrations and missions
    with Knights are story events that raise S.
  Not chosen by 13: the Council of Reassignment sends the Initiate to the Service Corps
    (Agricultural, Medical, Educational or Exploration). Played as a story turning point: accept,
    leave the Order, or a rare later chance (a Knight on a mission takes interest: 2% per
    month while in the Corps, raised by deeds), as with Obi-Wan and Qui-Gon.
Padawan
  Missions with the master; the master is the main teacher (progression spec sec 15).
Knight Trials (five playable trials)
  Eligible: at least 6 years as a Padawan, age 18+, the master's approval (flag), and
    main form >= 38, Force Control >= 30, Force Sense >= 30, Willpower >= 35
    (Average meets these around age 20-21; Willpower depends on routines and fatigue, so
    tune its minimum with the lifetime test).
  Each trial is a scene with its own checks (rolls spec, DC = 10 + rating/10):
    Skill: a duel or droid gauntlet; win a duel against a rating-45 opponent, or pass
      3 of 4 checks of main form at rating 45.
    Courage: a fear scenario; Willpower check at rating 40 + the scenario's fear level,
      under a fear state of mind if one is triggered.
    Flesh: pain and deprivation; Endurance and Willpower checks at rating 40 while fatigued
      (start the scene at f 0.8); Control Pain helps.
    Spirit: confront one's own darkness; Willpower check at DC 10 + dark pressure / 5 + 4;
      failure adds dark pressure (alignment spec).
    Insight: perceive a hidden truth; Force Sense check at rating 45.
  A failed trial can be retaken after 1 in-game year, at most twice. Failing a third time:
    Service Corps, remain a Padawan in service, or leave the Order (player choice).
  Wartime: the Council may count a documented heroic act (flag, e.g. defeating a Sith
    Lord in battle) as passing Courage and Flesh, and may bypass the trials entirely for
    exceptional service (a Council story event).
Knight
  Missions on their own; may take a Padawan once age 25+ and the Council approves.
Master
  Requires: a Padawan trained to Knighthood, OR exceptional deeds plus a Council decision.
  Skill minimum: main specialty >= 58 (Average reaches it around age 35).
High Council seat
  Requires: Master rank, a vacancy (story event), main specialty >= 70, and Council standing
    (deeds, relationships). Wartime appointments are possible as story events.
Grand Master: story only.

## 2. Sith path (story-driven, harsher)
  Academy acolyte (start age 8-16) -> Apprentice (chosen by a Sith Lord; same standing
    formula, with deeds weighted 50%) -> Lord (recognized by a Darth or the Dark Council after
    a major deed) -> Darth (title granted by the Emperor or Dark Council) -> Dark Council
    (a vacancy, usually by someone's death).
  Academy trials can kill: failed lethal trials use the health spec.
  Skill minimums mirror the Jedi ones (acolyte trials ~ Initiate Trials, Lord ~ Knight).

## 3. Force-sensitive outsiders and non-Force careers
  Outsiders (Gray, independent, untrained): no rank ladder; reputation and teachers come
    through story. Being found by the Jedi or Sith later is a story event.
  Non-Force careers (soldier, smuggler, Mandalorian, bounty hunter...): faction ranks earned
    by years of service, skill minimums matched to the NPC archetype curve, and deeds.

## 4. Milestones (recalibrated)
  Triggers use pace for age instead of fixed thresholds:
    pace for age = the character's level / the Average profile's level at the same training
    years, per skill.
  "Noticed" (masters take interest): pace for age >= 1.5 in a main skill after 3+ years.
  "Prodigy talk" across the Temple: pace for age >= 2.0 after 3+ years.
  "Ahead of their time": meets the next rank's skill minimums 3+ years before the Average
    age for it.
  Each V170 milestone from legacy JEDI_MILESTONES / SITH_MILESTONES keeps its story hook and
    gets a pace-for-age or deed trigger instead of its old threshold.

## 5. Required tests
 1. The Average profile meets each rank's skill minimums within +/-2 years of the stated age.
 2. About 14% (+/-3) of average-standing Initiates are not chosen by 13 (seeded, 10,000 runs).
 3. Not chosen by 13 always triggers the Council of Reassignment event.
 4. Each Knight Trial uses its stated checks; retakes wait 1 year; a third failure gives the
    three choices.
 5. Wartime: a heroic-act flag counts for Courage and Flesh only.
 6. No promotion is applied without its requirements met (or a Council bypass event).
 7. The AI cannot promote; promotionProposed with unmet requirements is rejected and logged.
