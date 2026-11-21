# Force XP rework: difficulty, not hours (proposal)

**Status:** approved in direction (Jared, 2026-11-21); **not adopted.** Built as a prototype behind a flag that is off in the game (`src/engine/forceXpTrial.ts`); measured in `docs-v2/testing/force-xp-trial.md`. It revises the step 1 report §3.3 (`docs-v2/testing/m6-step1-report.md`). It implements checklist item 1 (`m6-integration-checklist.md`). It builds on the M4 challenge factor (`src/engine/challenge.ts`) and the reserve spec §3–4 and §7 (`force-reserve.md`).

## Goal

- Growth in Force skills comes from pushing.
- Free uses earn a trickle at most, so they can never be ground.
- There is no artificial ceiling: a harder exercise exists at every level.
- The routine still sets the hours.

## 1. Exercises and their rating

A Force exercise is described by five terms:

- **Ability tier** (catalog): Basic, Moderate, Complex or Advanced.
- **Scale class:** 0 to 6 (reserve §3).
- **Effort:** reserve §3 values, light 0.5, normal 1.0, strong 1.5, all-out 2.0. No separate scale.
- **Held:** the number of abilities maintained at once.
- **Finesse terms** (below).

Its difficulty rating is the sum of two parts:

```
rating = demand rating + finesse rating
demand rating = 20 + 30 × log2(base × scale × effort × held / 10)
held = 1 + 0.5 per extra ability maintained
```

- **Demand rating.** Base is 10 × the tier factor (1.0, 1.5, 2.5, 4.0), and scale is the reserve §3 factor. Every doubling of demand is +30.
  - Examples: Basic, hand-held, normal = 20. Complex = 60. Advanced = 80. Advanced at class 2 = 115.
- **Finesse rating** (new). It raises the rating without a matching rise in draw:

| Finesse term | Rating | Effect on draw |
|---|---|---|
| Precision (tolerance of the placement or grip: coarse, fine, exact) | +0 / +15 / +30 | none |
| Duration (each doubling of the hold past 1 minute) | +10 per doubling | none per round; the total drawn grows with time held |
| Number of small targets n (class 0 each) | +30 × log2(n) | × (1 + 0.1 × (n − 1)) |
| Distraction (noise, a sparring partner, being struck at) | +0 to +20 | none |
| *Sense only:* range (each doubling past 10 m) | +10 per doubling | none |
| *Sense only:* obscured or faint target (shielded mind, a single life in a crowd, a cold trail) | +10 / +20 / +30 | none |

**Why finesse.** A push-band exercise exists at every pool size, so pool max limits growth only through the scale-heavy exercises.

**Feat gates.** Pool max gates only the scale classes (reserve §3: class 3 needs 150, class 4 needs 300, and so on). No finesse exercise is gated by pool.

**Free status.** An exercise with finesse rating +15 or more is never free (reserve §3 free rule, read as "contested"). Exact work is not second nature at that level.
- Without this rule, a Master's Moderate exercise with high finesse would be free and earn only a trickle.
- With it, the Master has to pay draw to push.

## 2. Which skill each exercise trains

Each exercise gives one rating per skill it trains. XP for each skill uses that skill's own rating, with the session's hours split by the activity's skill shares, as today.

| Skill | Rating it reads | Typical exercises |
|---|---|---|
| Force Control | Tier + held + precision, duration, targets, distraction (scale and effort excluded) | Levitating stacks, holding several objects, long holds, exact placement under distraction |
| Force Output | Tier + scale + effort (finesse excluded) | Lifting the heaviest class you can, all-out pushes on a target dummy |
| Force Sense | Its own sensing tier + range, obscured or faint, number of signatures, distraction | Blindfold sparring, tracking a hidden partner, reading a shielded mind |
| An ability (Telekinesis, Push and so on) | The full rating of exercises that use it | As above; its parent stat gets its usual share (D-191) |

**Draw for Sense exercises (Jared, 2026-11-21).** A sensing exercise draws the catalog's sustained cost for the sensing ability used, per minute held. Force Sight costs 2 (Basic), and Precognition costs 5 (Complex) in blindfold sparring and similar exercises. The draw is scaled like other exercises:
- **Scale:** the distance class (reserve §3 factors; for sensing, scale measures distance).
- **Effort:** reserve values.
- **Signatures:** × (1 + 0.1 per extra signature tracked).

Obscured or faint targets, range within the class and distraction raise only the rating.

## 3. XP per session

The M4 formula is unchanged:

```
XP = effective hours × intensity × challenge(rating − level) × outcome × M × skill share
```

- **Picking the exercise.** The scheduler picks it the way it picks a drill rating today: the highest-rated exercise in the effort's band (standard −10 to +10, push +10 to +20) that the day's pool and strain projection allows.
- **Trickle for free exercises.** An exercise that draws nothing under the free rule has its challenge factor multiplied by a trickle factor, default 0.1.
- **No new ceiling.** The fixed 10 to 90 rating ladder retires for Force skills.

## 4. The day trim: strain combined with max(physical, mental)

The day is trimmed when **either** test fails:
1. The projected end-of-day max(physical, mental) is over the tiredness limit. This is today's test, unchanged: easy 0.7, standard 0.9, push 1.0.
2. The projected strain is over the effort's strain limit: easy 0.4, standard 0.75, push 1.0. These are the reserve §12 tier lines.

**How the trim works:**
- The trim takes fill hours off in the existing order until both tests pass.
- Meditation blocks refill the pool (25% an hour, reserve §6), so they come before Force blocks in the projection.
- Strain carries overnight as the reserve §6 recovery leaves it.
- The lifetime gate "day-end tiredness < 1.1" stays measured on max(physical, mental), as it is defined. Strain gets its own report line, not a new gate.

**Drill draw per hour.** A drill hour is not one continuous hold: it is draw × R work repetitions an hour, with R = 12 (tunable).
- Each repetition is one round, for the rate multiplier.
- Sustained exercises draw per minute only for the minutes actually held.

**Predicted binding limit for each rank's default Force block.** These are estimates from the reserve formulas at the default R, to be measured, not results.

| Rank (pool max, Conditioning) | Default Force block | Push-band exercise | Pool used an hour | Predicted binding limit |
|---|---|---|---|---|
| Initiate (150, the 30% start; Conditioning 0) | 0.5 h Control drill + 0.5 h sense, easy | Basic + finesse (about 25) | about 60% | **Routine hours.** Only 1 h a day; strain about 0.1 |
| Padawan at 20 (150, 10) | 1 h Control drill + 1 h sense with the master, standard | Basic + finesse 15 (rating 35): draw 6.3, above the 3.9 usual rate | about 50%, reaching the comfort line after about 1 h | **Strain.** The second hour of push work crosses the comfort line; strain reaches the 0.75 standard limit at about 2 h. This is where M6 replaces the old meter as the cap |
| Knight at 50 (350, 40) | Archetype fill, about 1 to 2 h | Moderate + finesse 28 (rating 65): draw 6 | about 21% | **max(physical, mental).** The mental meter (0.8 an hour) with the rest of the day binds before strain (about 0.05 an hour). The routine hours bind first for a Guardian, whose specialty is forms |
| Master at 85 (about 470, 70) | Archetype fill, about 1 to 2 h | Complex + finesse 40 (rating 100): draw 7.4 | about 19% | **Routine hours,** then mental. Strain stays under 0.2 |

The rework moves the binding limit for Padawans and leaves Knights and Masters as they are today. That matches step 1 finding 1: the old Force meter never trimmed hours.

## 5. Pool growth (reserve §7)

A session that ends below the comfort line without a collapse adds the "training near your limits" pool gain. This is separate from XP: pool growth never multiplies XP, and XP never raises the ceiling (decisions: two axes, D-281).

## 6. The Orgus Din check (low Potential, heavy drilling)

**Lore.** Orgus Din reached his skill "through endless practice" to make up for a weak Force aptitude (*Threat of Peace* endnotes, via `Docs/SWRPG lore/SW_Jedi_Daily_Life_Training_OldRepublic.md`). His 3,643 BBY sheet has Force Control 84 (`SW_Characters_09_GreatGalacticWar_ColdWar.md`). His count is 7,000, the reserve spec's Jedi minimum (§11). That is a **design default, not lore** (D-322, lore batch 2): no Legends source gives his midi-chlorian count.

**His numbers:**
- Ceiling 500 × 0.7^1.5 = 293. At Force Sense 82, pool max is about 270.
- Efficiency 1 + 84/50 + 84/100 = 3.5.
- Conditioning about 70, so the comfort line is about 29% and the usual rate about 17 a round.

**Pushing Force Control at 84** (push band 96 to 102):
- Complex + finesse 40, rating 100: draw 7.1 a repetition, 2.6% of his pool, under his usual rate.
- 12 repetitions an hour use about 31% of the pool an hour. He has about 2.3 hours of push work before the comfort line, more with a meditation block.
- An average Master (pool about 470) gets about 3.4 hours.

**Result:**
- With a 1 to 2 hour Force block, Orgus earns the same Control XP per day as an average Master. Low Potential costs him growth only on days with more than about 2 hours of pushing.
- He cannot attempt class 4 scale (needs pool 300), so his Output growth stops short of freighter-scale feats. That fits his sheet (Output 78).

**Gate to add when built.** A lifetime case with count 7,000 and a heavy Control routine reaches Force Control 84 within ±2 years of an average-Potential profile on the same routine, on all 20 seeds. If it does not, the finesse terms are too weak.

## 7. Tuning against the lifetime gates (when built)

- **Start neutral.** Pick the default exercise per rank so the challenge factor at today's routine hours matches today's average (about 1.0 at standard, 1.25 at push). Confirm every gate on all 20 seeds before tuning (`npm run mortals`, `npm run spread`). K stays fixed.
- **Tunables:**
  - the trickle factor
  - the rating slope and offset (30, 20)
  - the finesse rating steps
  - the free-status finesse line (+15)
  - R
  - the strain trim limits
  - each archetype's default effort
- **Gates to watch:**
  - Luke's Force growth at 40 to 42 years of training and FC > 100 at 62 (the ceiling removal)
  - the Obi-Wan and Anakin milestones ±20%
  - "not faster than Anakin; within 4.0×"
  - the Average's Force rank minimums ±2 years
  - peacetime combat share < 10%
  - day-end tiredness < 1.1
  - the new Orgus Din case
- **Report, don't tune:** anything that needs K or a formula change.
