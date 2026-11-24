# Progression targets (v1)

Calibration targets for the v2 progression system, the legacy problems they fix, and the
tests that enforce them. The numbers (curve, fatigue, challenge, multipliers) are in
progression-numbers.md, combat-xp.md and training-routines.md; the architecture is in
architecture.md section 12. Decisions: D-20 (no skill-tier gates), D-21 (multipliers as in
the specs).

## 1. Legacy problems (verified against legacy/index.html)

Verified with node on 2026-11-16 by re-running the legacy formulas.

| Problem | Evidence |
|---|---|
| Exponential cost `floor(100 * 1.07^n)` makes the early tiers trivial and the late ones a crawl | legacy/index.html:6904-6925. Steady sim training at standard intensity (`hours * 15 * outcome weight by tier`, 8701-8705, 11951): 3 h/day reaches Adept 41 in 1.1 years, Master 61 in 4.4, High Master 81 in 16.9, Legendary 101 in 65.3. 5 h/day: 0.7 / 2.7 / 10.1 / 39.2 years |
| No diminishing returns in the simulator | XP per hour is constant except for a per-tier outcome weight that *rises* with tier (1.105 to 1.263, 8705); no fatigue curve or challenge factor |
| Secondary stat weights add XP on top of the primary | Activity weights are applied independently (11940-11953). Shii-Cho Basics: primary 1.0 + strength 0.4 + agility 0.3 + endurance 0.2 + Force Control 0.15 = 2.05x total XP (8606) |
| Story turns use multipliers the simulator does not | `calcTrainingXP = hours * I * D * O * T` (6956-6965): tier multiplier T up to x3.5 (6932-6939), AI-chosen outcome O up to x3.0, difficulty D up to x2.0. Max 630 XP per hour vs 15 for a standard sim hour |
| The AI picks the outcome | The outcome keyword is chosen in the narrative; nothing ties it to the roll (prompt 2084-2092) |

## 2. Calibration targets

Years of training to reach a tier in the main specialty. Tolerance +/-20%.

| Profile | Start age | Adept 41 | Master 61 | High Master 81 | Legendary 101 | Pace vs Average |
|---|---|---|---|---|---|---|
| Average Jedi | 4 | ~16 | ~32 | ~52 | ~78 | 1.0x |
| Focused, no talent (Obi-Wan) | 3 | ~11 | ~21 | ~35 | ~52 | ~1.5x |
| Max: double prodigy + single focus + war (Anakin) | 9 | ~4 | ~8 | ~13 | ~20 | ~4x, the hard ceiling |
| Late-start Force prodigy, broad focus (Luke) | 19 | ~7 | ~14 | ~23 | ~34 | ~2.3x |

Extra Luke targets (D-474, Jared; replaces "peak Force and peak effective physical performance in his
early 60s"): Fate of the Jedi (43-44 ABY, c. 63) is his last appearance, so nothing caps his growth in
the Force. The Force: every Force skill he trains is still rising at 63, with no upper bound. The
body: his Strength, Agility and Endurance (the stats as his body holds them, without the Force boost)
have each peaked by 68 and are declining, slowly under the Force Control stretch.

Canon anchors (Legends):
- Anakin: a top-3 duelist and on the Council by 22-23, after starting at 9.
- Obi-Wan: knighted at 25 and a Master around 35, through focus, not talent.
- Average Jedi: knighted in their early to mid 20s; Master rank around 40 after training a
  Padawan.

These match progression-numbers.md sec 12 (which lists the same profiles with one decimal).

## 3. How the curve meets the targets

- Time to reach level L at a steady rate ~ L^1.75, so `XP(L) = K * L^1.75`. At a constant
  rate this gives exactly the Average row: (61/41)^1.75 = 2.01 -> 32.1 y; (81/41)^1.75 = 3.29
  -> 52.7 y; (101/41)^1.75 = 4.84 -> 77.5 y.
- K is solved by simulation: the Average profile runs through the real day loop (fatigue,
  age factor, rust, routines) and K is set so it reaches 41 in exactly 16.0 years. Because
  the age factor for technique skills falls from 1.25 (age <= 8) to 0.95 (31-50) and 0.90
  (51+), the later tiers may land a few percent slower than the constant-rate figures; the
  +/-20% tolerance covers this, and the lifetime test checks it.
- Profile speed comes from hours, weights (focus), M (talent, instruction, age, state of
  mind, alignment; capped at 2.8) and combat XP. Total pace is capped at 4.0x.

## 4. Profile inputs (tunable; stored as test data)

Starting points from progression-numbers.md sec 12, to be tuned so the targets hold with the
fatigue model:

Amended by D-40, D-41, D-42: every profile now runs the same schedule structure (the Order
requirements for its rank from ranks.md §1a, filled up to the D-25 budget by archetype shares;
the main specialty takes 0.5 of the fill from Knight on) and changes only effort (hours),
talents, teachers, rank ages and combat events. Full inputs and the computed Average result
are in progression-numbers.md sec 12.

| Profile | Training days/year | Effort (hours) | Talent | Teacher | Combat |
|---|---|---|---|---|---|
| Average | 300 | standard (Order requirements + budget) | none | Temple instructors x1.05, master x1.15 | sparring only until first missions; peacetime missions |
| Obi-Wan | 315 | push | none | master strong in his form | sparring, missions; wartime from year 25 |
| Anakin | 315 | push | prodigy in combat and Force | master who is not a specialist in his form | war years 19+ (combat 25-35% of yearly main-form XP) |
| Luke | 280 | standard, broad focus (main share 0.4), outsider (no Order requirements) | Force prodigy | sparse teachers, holocrons | wartime (combat-xp.md sec 5) |

M4 result (D-132, the four-profile lifetime test through the real routine and day loop; years of
training, highest form or Luke's Force Control): Average 4.17 / 15.94 / 32.95 / 54.23 / 80.9 | Obi-Wan
3.23 / 10.39 / 22.88 / 36.95 / 57.04 | Anakin 1.48 / 4.24 / 8.34 / 13.73 / 21.17 | Luke 1.77 / 5.81 /
12.30 / 21.28 / 32.39. All within +/-20%; combat shares met; the inputs are in tests/lifetime/profiles.ts.

Computed so far (docs-v2/calc/): Average meets every section 2 target within +/-20% with
K = 15.18 after D-67 was decided (D-102, natural baseline): 41 at 16.0, 61 at 32.6, 81 at
55.2, 101 at 83.5 years (K = 14.69 before: 34.3 / 57.5 / 86.5). The M3 Average lifetime test
runs these through the src engine. The other three are only a peacetime baseline without
combat events and miss their targets; they are tuned in the M4 lifetime test.

Each profile also needs: birth date, starting Endurance and Willpower, state-of-mind events,
schedules and drill difficulty. The war factor of 1.25 that earlier figures included is gone;
wartime pace comes from combat XP, E and CI (combat-xp.md sec 4).

## 5. Rules that shape progression (summary)

- One `computeXp` for every source; outcomes rolled by code (mean 1.0); breakthroughs are a
  4% x1.75 outcome, logged.
- Weights normalized to 1; 0.75 main / 0.25 secondary; synergy is the only extra XP (<= 25%).
- No skill-tier gates (D-20). Natural limits: drill ceiling for lightsaber forms, combat
  integration for combat Force abilities, the teacher factor. Physical stats and non-combat
  Force abilities have no gates. Crossing 21/41/61/81/101 triggers a non-blocking milestone
  beat.
- Ranks are story-granted with skill minimums (ranks.md).
- Physical performance = min(trained, body cap for age and species) + Force boost.

## 6. Required tests

1. Lifetime test: the Average profile runs 95 in-game years and the other three 70 (amended
   by D-49, so Average's Legendary target at 77.5 years is inside the run), through the real
   engine and the montage advance loop. Every milestone in section 2 is within +/-20%.
2. No profile beats the max (Anakin) profile's pace at any tier; no input combination
   exceeds 4.0x the Average pace (banked releases excluded); the D-48 clamp enforces it.
3. Luke: still gaining Force levels after 40 years of training and at 63; Strength, Agility and
   Endurance each peaked by 68 and slowly declining (D-474).
4. Average profile: K solves to the 16.0-year Adept target within 0.1 year.
5. Combat shares match combat-xp.md sec 5 (Anakin wartime 25-35%, peacetime under 10%).
6. Crossing a tier never blocks XP or levels; it creates exactly one milestone beat.
7. All progression-numbers.md sec 20 tests pass.
