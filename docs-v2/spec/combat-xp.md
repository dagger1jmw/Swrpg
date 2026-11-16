# Combat XP (v1)

## 1. Per fight
XP per exchange to the skill used = 0.25 * challenge(gap) * stakes * outcome * M
  Exchanges are counted from the duel log, by the skill used in each (main form for melee,
  blaster skill for ranged, or the Force ability).
  gap = opponent's effective level in the opposed skill - own effective level
  challenge = progression spec section 4 curve, except 0 when gap is below -30
  stakes: spar 0.5 | skirmish 1.0 | serious 1.5 | lethal 2.0
  outcome: won 1.0 | lost and survived 1.2 | fled or interrupted 0.8 | truce 1.0
  Split: 0.75 to the skill used, 0.25 to physical stats by that form's activity weights.
Force abilities used in the fight: 0.1 XP per use * challenge * stakes * M (no split).

## 2. Limits
  Daily cap: 12 XP per skill before M (about 4 days of standard training).
  The third and later fights in one day: x0.5.
  Combat XP counts toward the 4.0x pace limit (progression spec section 5).

## 3. Applied experience (E) and combat integration (CI)
  E gains by stakes: spar 0.2 (peer) / 0.4 (master) per session | skirmish +3 | serious +6 |
    lethal +6, or +10 if the opponent is 5+ levels stronger. Scaled by (1 - E/120);
    sparring E capped at 15. (Replaces the wording in progression spec section 7.)
  CI gains per Force ability use: spar +0.1 (capped at 20) | skirmish +0.5 | serious +1 |
    lethal +2. Scaled by (1 - CI/120).
  Any skirmish or higher starts the drill-ceiling bank release (progression spec section 7).

## 4. Experience multiplier removed
  M no longer includes an experience factor. War speeds growth through combat XP, E and CI.

## 5. Calibration targets (checked by the lifetime test)
  Anakin profile, war years: combat gives 25-35% of yearly XP in his main form.
  Obi-Wan profile, Clone Wars years: 20-30%.
  Average and Obi-Wan profiles in peacetime: under 10%.
  The 0.25 base and the daily cap are tunable to meet these.

## 6. Reference values (M 1.0)
  Even serious duel, 34 exchanges: 34 * 0.25 * 1.0 * 1.5 * 1.0 = 12.75 -> capped at 12
  Even spar, 34 exchanges: 4.25
  Lethal duel, opponent 12 levels stronger, lost but survived:
    34 * 0.25 * 1.25 * 2.0 * 1.2 = 25.5 -> capped at 12
  Jedi (70) vs trooper (15): 0 (gap below -30)

## 7. Required tests
 1. Reference values in section 6 reproduce exactly.
 2. Daily cap and the third-fight halving apply per skill.
 3. No XP from opponents more than 30 levels weaker.
 4. Combat XP is included in the 4.0x pace check.
 5. Lifetime test meets the section 5 combat shares.
 6. M has no experience factor anywhere in code.
