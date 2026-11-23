# The per-hour clamp, Phase A (2026-11-23; D-457, D-458)

Phase A of the answers to remeasure-2026-11-23.md: code, quick tests and the measurement the new clamp needs. Nothing is
tuned. `npm test`: 130 files, 1,338 tests, all pass (24 s); typecheck and lint clean.

These numbers come before the Initiate lightsaber curriculum. Phase B re-measures the table on the new curriculum.

## 1. The formulas

**Old (D-48, D-104):** per skill, over a rolling 365-day window,

    cap = 4.0 x Y_avg(age) x share / 0.5
    share = max(focus share, the skill's hours / all the character's training hours in the window)

Y_avg is the Average's most-trained form XP a year. Training more of anything else lowers a skill's share, and with it
the skill's cap.

**New (D-457, Jared: the ceiling limits prodigy speed, never focus):**

    cap = 4.0 x R_avg(skill, age at the window start) x the character's hours in that skill in the window

- **R_avg is the Average's XP per hour of training in that same skill,** for the 365 days starting at that age. It is the
  20-seed median of the Average's window XP divided by its window hours in that skill.
- **Hours in other skills never change a skill's cap.** Focus weights no longer enter the clamp.
- **The accelerated path still raises the cap x3.2** (D-418).
- **Y_avg stays,** but only as the reference of the "within 4.0x" lifetime floor and the yearly table gate.

Code: `src/engine/paceClamp.ts` (the rule), `src/data/paceRates.ts` (the table), `clampFor` in
`src/features/progression/training.ts`.

## 2. Choices I made while you were away (please confirm)

1. **The rate counts the drill XP the ceiling banks, and its overflow past a full bank.**
   - The ceiling (D-45) is its own rule, and counting only credited XP would make the Average's ceilinged forms read
     75% slow.
   - Credited XP only: Ataru 0.90 -> 0.26 XP/h at 40. Banked counted but not the overflow: 0.88 -> 0.27 at 80.
   - Either way, anyone whose form is not at the ceiling would be capped at about 1 XP/h.
   - Counted in full, Ataru stays at 0.82-1.04 for life.
2. **Fallback rows.**
   - A skill gets its own row where the Average's median hours in it reach 20 a year.
   - A lightsaber form the Average does not train (Djem So, Makashi, Juyo) reads the Average's most-trained form that
     year.
   - Any other untrained skill reads the Average's whole-training rate (all window XP / all window hours).
3. **Fights are outside the per-hour clamp and its window.**
   - *What caught it:* the `vongPipeline` test. A fresh character's first fight had only its exchanges' seconds in the
     window, so the cap sat near 0 and nearly all its combat XP was discarded. Under the share rule, a fight-only skill
     had share 1.
   - *Why the ceiling still holds:* per exchange, combat XP differs from the Average's in the same fight only by M,
     which is capped at 2.8, under 4.0. The accelerated path may pass the ceiling (D-418).
   - Counted in the window, a war year's fights would also eat the training's room.
   - Combat XP keeps its own daily cap, and the lifetime 4.0x floor still counts it.
4. **Table ages are the Y_avg ages,** interpolated and flat outside. Force Knowledge has no row at 12-24 (the Average
   studies it under 20 hours a year then), so its row interpolates between 8 and 30.

## 3. The table (Phase A, before the curriculum)

Measured four times with the clamp open, each time with the counting corrected (runs of 785, 568, 546 and 557 s). The
last run, training only and with banked and overflow XP counted, is the table. XP per hour:

| Skill | 4 | 12 | 16 | 20 | 24 | 30 | 40 | 60 | 80 | 90 | 98 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Soresu | - | 1.265 | 1.157 | 1.273 | 1.127 | 0.986 | 0.961 | 0.981 | 0.912 | 0.691 | 0.513 |
| Ataru | - | 0.905 | 0.866 | 0.800 | 0.802 | 0.913 | 1.037 | 0.901 | 0.872 | 0.847 | 0.818 |
| Shii-Cho | 1.296 | - | - | - | - | - | - | - | - | - | - |
| Most-trained form | 1.296 | 1.265 | 1.157 | 1.273 | 1.127 | 0.986 | 0.961 | 0.981 | 0.912 | 0.691 | 0.513 |
| Force Control | 1.896 | 1.620 | 1.540 | 1.591 | 1.612 | 1.313 | 1.297 | 1.319 | 1.221 | 1.170 | 1.142 |
| Force Sense | 1.968 | 1.812 | 1.673 | 1.646 | 1.806 | 1.331 | 1.288 | 1.335 | 1.221 | 1.162 | 1.121 |
| Willpower | 0.701 | 0.678 | 0.622 | 0.697 | 0.750 | 0.576 | 0.667 | 0.739 | 0.561 | 0.457 | 0.414 |
| Whole training | 1.055 | 1.075 | 0.989 | 1.035 | 1.066 | 0.805 | 0.861 | 0.868 | 0.776 | 0.644 | 0.555 |

The full table, with Niman, Shien, Meditation, Force Knowledge and the physical stats, is in `src/data/paceRates.ts`.

## 4. Obi-Wan's Soresu against the Average (gated seed)

- **Method:** each training session with Soresu as a primary gives its rate per window hour: effective share x
  intensity x challenge x outcome x M. M is talent x cross-talent x instruction x age x state x species, times place,
  accelerated and review.
- **Factors** are hours-weighted geometric means. "Window" is the pace window's own rate, which is what the clamp
  compares.
- **Probe:** `tests/sweep/clampBreakdown.test.ts`, 93 s.

| Year from age | 15 | 25 | 40 |
|---|---|---|---|
| Soresu session hours: Obi-Wan / Average | 1,025 / 719 | 985 / 654 | 923 / 654 |
| Session rate, XP/h: Obi-Wan / Average | 1.164 / 1.109 (x1.05) | 0.928 / 0.980 (x0.95) | 0.966 / 0.965 (x1.00) |
| Window rate: Obi-Wan / table | 1.218 / 1.184 (**x1.03**) | 0.962 / 1.103 (**x0.87**) | 0.992 / 0.961 (**x1.03**) |
| Effective share (tiredness) | 0.901 / 0.940 (x0.959) | 0.868 / 0.977 (x0.889) | 0.920 / 0.981 (x0.938) |
| Challenge (push drills) | 1.129 / 1.000 (x1.129) | 1.065 / 1.000 (x1.065) | 1.098 / 1.000 (x1.098) |
| Outcome | 0.979 / 0.966 (x1.014) | 0.969 / 0.971 (x0.998) | 0.968 / 0.999 (x0.969) |
| Teacher (instruction) | 1.072 / 1.124 (x0.954) | 1.000 / 1.000 | 1.000 / 1.000 |
| Age | 1.047 (x1.000) | 0.995 (x1.000) | 0.949 (x1.000) |
| Centered (state) | 1.041 / 1.038 (x1.003) | 1.041 / 1.038 (x1.003) | 1.041 / 1.038 (x1.003) |
| Talent, cross-talent, species, Temple/nexus, accelerated, review | 1 / 1 | 1 / 1 | 1 / 1 |

How to read it:
- **Obi-Wan is not faster per hour than the Average.** His Soresu runs at 0.87-1.03x the table, a quarter of the cap.
  He gets ahead by training more Soresu hours: push effort, 315 days and a Soresu-heavy plan.
- **Push drills and tiredness nearly cancel.** Harder drills give him x1.07-1.13 on challenge, and longer, more tired
  days cost him x0.89-0.96 in effective hours.
- **His teacher factor at 15 is lower than the Average's.** 153 of his 1,025 Soresu hours are a solo block (x0.90).
- **The Temple or nexus bonus does not touch Soresu.** It applies to Force skills only.

**Discarded XP:** none, for either profile, in any skill, over the 44 years probed. Under the old rule he lost about 356
XP a year at 26-30 (D-456).

## 5. Other answers (D-458)

- **The discarded counter is fixed.**
  - It reads the clamp's notes where they are written: the session logs for training, the fight notes for combat.
  - It totals XP, per skill (`discarded`, `discardedBySkill`).
  - Test: `tests/support/discardedCounter.test.ts`. A shrunk table makes the clamp fire, and the counter reads it.
- **The montage test switches world events off in its own file** and runs on the plain seed again.
- **Career Willpower:** the untrimmed rates are kept, and D-446 is amended.
- **Sith paces above 15%:** accepted.
- **The Mandalorian's 0.02 miss:** accepted for now, and re-checked after Phase B.

## 6. Found on the way

- **The old share rule clamped the Average itself in its last years.** Soresu's share of its hours falls to 0.127 at
  98, so the old cap (about 210 XP) sat under its own 245 XP. Unclamped, its year at 98 reads +19% against the Y_avg
  table; every other age is within 0.3%. Phase B re-measures the table.
- **The training card now shows each primary's M and its parts.** The routine's session log carries the card's
  discarded XP and factors; the breakdown reads them.

## 7. For Phase B: the Initiate curriculum

Your item 4 says to replace "Skill 3 of 4 at rating 45". That check is the Knight Trial of Skill. The Initiate Trials'
form check is "$highestForm at rating 20, plus Force Control 20".

I read the item as replacing the Initiate Trials' form check with Form I at a threshold plus 4 of the other 5 forms
above a floor, and leaving the Knight Trial of Skill unchanged. The final report flags this.
