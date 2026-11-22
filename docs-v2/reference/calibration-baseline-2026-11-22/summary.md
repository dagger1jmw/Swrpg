# Baseline numbers (commit c13461f)

## Rank ages
**Canon birth estimates** (src/data/canon/rankAges.ts, `RANK_TYPICAL_AGE`, invented):
- Jedi: Initiate 4, Padawan 13, Knight 25, Master 40, High Council 45, Grand Master 55.
- Sith: acolyte 15, apprentice 20, Lord 22, Darth 35, Dark Councilor 45, Overseer 35.
- Careers: soldier 18, officer 25, general 40, Supreme Commander 50, senator 35, Chancellor 50, official 25, agent 22, minister 45, bounty hunter/smuggler/criminal 20, crime lord 35, Mandalore 35, civilian 18.
- Never below the role minimum (`ROLE_MIN_AGE`).

**Player ladder** (src/data/rankMinimums.ts):
- Padawan: min age 10, highest form 24, Force Control 14, typical age 12.
- Knight: min age 18, 6 years as a Padawan, highest form 39, Force Control 34, Force Sense 31, Willpower 53, typical age 20.5.
- Master: min age 31, main specialty 58 (+ the Knight minimums), typical age 35.
- Sith mirror the Jedi (apprentice 12, Lord 20.5).
- `AVERAGE_RANK_AGES` = Padawan 12, Knight 20.5. The generator's `RANK_AGES` = the same.

**Generator role minimums** (`ROLE_MIN_AGE`): Initiate 4, Padawan 10, Knight 18, Master 31, Sith acolyte 8, Lord 18, soldier 18, officer 22, politician 25, official 20, criminal 16, servant 14.

## The 4x ceiling
- `PACE_CAP` 4.0: per skill, over a rolling 365 days, credited XP <= 4.0 x Y_avg(age) x (share / 0.5) (D-48, D-104). Banked drill releases and the fundamentals transfer are outside it.
- `M_CAP` 2.8 on the speed multiplier M.
- Anakin (double prodigy, single focus, war) defines the ceiling: 21 / 41 / 61 / 81 / 101 at 1.3 / 4.1 / 8.2 / 13.5 / 19.9 years from age 9.

## Training-condition multipliers (no consolidated "special conditions" list existed at the baseline)
- Talent: gifted 1.25, prodigy 1.5, exceptional 1.8; cross-talent 1.1 (Force prodigy on forms).
- Teacher: 1 + 0.005 x (teacher - student), -10..+30, max 1.15; aptitude +/-0.05; bond +0.03.
- Holocron / archive: x0.9 physical, x1.0 Force and knowledge. Solo 0.9, partner 1.0, weak partner 0.95.
- State of mind: centered 1.05; distracted 0.9; despair 0.8; passion 0.8 on light techniques, 1.2/1.3 on channeling.
- Force-rich places: light nexus +15% meditation refill and +10% pool growth from meditation; dark nexus -10% dark draw (force-reserve.md §9). Pool effects only, no XP multiplier.

## Calibration targets (years of training to each tier, +/-20%)
| Profile | Start | 21 | 41 | 61 | 81 | 101 |
|---|---|---|---|---|---|---|
| Average | 4 | 5.0 | 16.0 | 32.1 | 52.7 | 77.5 |
| Obi-Wan | 3 | 3.4 | 10.8 | 21.7 | 35.6 | 52.4 |
| Anakin | 9 | 1.3 | 4.1 | 8.2 | 13.5 | 19.9 |
| Luke | 19 | 2.1 | 6.9 | 13.9 | 22.8 | 33.6 |

K = 11.683, curve XP(L) = K x L^1.75. The Average meets the Knight minimums at 20.3 and the Master minimum (58) at 35.
