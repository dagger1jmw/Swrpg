# M6 build step 1: read-only report

2026-11-21 (overnight run). Reserve spec build step 1, and checklist items 3, 4 and 1 (`docs-v2/spec/m6-integration-checklist.md`). Read-only: no game code was changed for this report. Sources: `src/engine/forceMeter.ts`, `src/data/health.config.ts`, `src/data/progression.config.ts`, `src/data/combat.config.ts`, `src/engine/duel.ts`, `src/engine/combatForce.ts`, `src/engine/fatigue.ts`, `src/features/routines/scheduler.ts`, `src/engine/speed.ts`, `src/engine/challenge.ts`, `src/engine/computeXp.ts`, `src/engine/combatXp.ts`, `src/engine/npcGen.ts`, `tests/lifetime/profiles.ts`, and `docs-v2/spec/health.md` §2.

## Findings that change the plan

1. **The Force meter does not cap Force-drill hours today** (item 1). The scheduler trims a day by `max(physical, mental)` only (`scheduler.ts` `projectDay`, line 200). Training efficiency for a Force drill reads the mental meter, not the Force meter (`fatigue.ts` `stepBlock`). The Force meter rises during drills (+0.6 an hour) but nothing in training reads it. What actually limits Force-drill hours is listed in section 3. So M6's free uses do not remove an existing cap: dropping the old meter does not move the calibration by itself.
2. **The spec and the code differ on this.** `health.md` §2 says "Efficiency of Force abilities uses the same e(f) curve as the other meters". The code never applies e(f) of the Force meter to training. The M4 and M5 calibration (K, the lifetime gates) was measured with the code as it is, so the code is the baseline. Not fixed: no live code changes tonight, and M6 replaces the meter anyway.
3. **The 1.3 anger limit is a backlash threshold, not a hard ceiling.** The reserve spec §5 asked about this. `applyForceLoad` lets the meter go past 1.3. Backlash and the collapse roll start above 1.3. Load between 1.0 and 1.3 is counted as `angerPointsOver1` for dark pressure. Two places ignore anger and keep the 1.0 line: precognition's gate, and the D-194 collapse warning (`collapseRiskPerUse`).
4. **Force talent never touches Force capacity directly.** It reaches capacity only through the XP it gives Force Control. Willpower adds to capacity too, and Willpower is a mind-domain skill. See section 2.

## 1. The Force meter as built (checklist item 3)

### 1.1 Limit and capacity

| Rule | As built | Where |
| --- | --- | --- |
| Capacity (the meter's 1.0 point) | 3 + 3 × min(FC, 100)/100 + 1 × min(Will, 100)/100 + max(0, min(FC, 150) − 100)/50 | `forceCapacity`; `FORCE_CAPACITY` |
| Overtraining | Capacity × (1 − 0.1 per overtrained day, at most −50%), the same cut as the other meters | `fatigue.ts` `capacities` |
| Limit | 1.0 × capacity, or 1.3 × capacity while channeling anger | `forceLimit`; `FORCE_METER.angerLimit` |
| Typical values | FC 25 / Will 50: 4.25. FC 50 / Will 50: 5.0. FC 100 / Will 80: 6.8. FC 150 / Will 100: 8.0 (the maximum). The iPad sheet's 4.8 is about FC 43 / Will 50 | |

### 1.2 Load per use

| Use | Load | Where |
| --- | --- | --- |
| Force action (Push, Choke, Lightning, Barrier, Absorb, Speed, Jump, Battle Meditation, telekinesis) | Base × effort × max(0.4, 1 − ability level/200) × combat-integration factor. Bases 0.10 to 0.50. Effort: light 0.5, standard 1.0, heavy 2.0, all-out 3.5. CI factor: min(2, 1 + 0.015 × G), halved for Niman | `forceLoadPerUse`; `FORCE_BASE_LOAD`; `combatForce.ts` line 53 |
| Precognitive defense | A fixed **0.4** per trigger (each time it is rolled against a strike, whether or not it avoids the strike). No backlash check | `duel.ts` `precog`; `PRECOG.load` |
| Shatterpoint strike (combat read) | A fixed **0.3** per read, no backlash check | `SHATTERPOINT_COMBAT.forceLoad` |
| Force drills (training) | +0.6 an hour × the intensity's load factor (casual 0.6 to extreme 1.8) | `trainingForceStep`; `activities.ts` `forceDrill` |
| Body-ability drills | +0.6 an hour (PHYSICAL_FORCE) | `activities.ts` |

Measured rate (equal-level duels, 4,000 per row, tonight): precognition triggers about **0.097 times per exchange**, from 0.096 to 0.099 across levels 25 to 100. It rises against weaker opponents, up to 0.18 at a +60 gap, because the weaker side strikes into it less and gets avoided more. At Force Sense 50 that is 0.039 load per exchange, or 0.78% of a 5.0 capacity. Under M5, precognition never shut off in these duels: 0% of fighters passed meter 1.0 (end-of-duel meter median 0.08 to 0.16).

### 1.3 Recovery

| Activity | Force meter | Where |
| --- | --- | --- |
| Meditation | −2.0 an hour | `MEDITATION_FORCE_RECOVERY` |
| Rest (time not covered by an activity) | −1.0 an hour | `REST_RECOVERY.f` |
| Sleep | 7 h or more: reset to 0. 5 to 7 h: 30% carries over. Under 5 h: 60% carries over | `sleepForce`; `SLEEP` |
| In combat | None | |

### 1.4 Backlash, collapse and anger

| Rule | As built |
| --- | --- |
| Backlash | +0.5 mental load per Force load point above the limit (`FORCE_METER.backlashMentalPerPoint`). Only Force actions reach it (`applyForceLoad`). Precognition and Shatterpoint add load with no backlash check (`addFixedLoad`) |
| Collapse | A flat 5% roll after any use that ends above the limit. Incapacitated for 1 to 3 hours (`rollCollapse`) |
| Anger | The limit moves to 1.3 × capacity. Load between 1.0 and 1.3 is reported as `angerPointsOver1` (+2 dark pressure each, waiting for M6). Above 1.3, backlash and collapse apply as usual. Not a hard ceiling |
| Precognition's gate | Off once the meter is above 1.0 × capacity (anger does not raise it) |
| Other 1.0 lines | Sequence cap −1 while the meter is above 1.0 (`features/combat/index.ts` line 628). The D-194 warning and button labels: 5% "collapse risk per use" above 1.0. The lifetime harness's fight readiness (D-267) skips optional fights while the meter is above 1.0. The sheet's tiredness labels (0.4 worked, 0.6 tired, 0.8 exhausted, 1.0 overtrained) |

### 1.5 Proposed unit conversion onto M6

Jared's decided mapping (checklist item 3): **capacity → pool max, load → pool drawn, the 1.0 thresholds → strain thresholds.** The detail:

- **Capacity → pool max.** The 4.8 does not convert by a factor; it retires. Its inputs move elsewhere. Force Control goes into efficiency (reserve §3: 1 + level/50 + FC/100). Willpower goes into the overdraw check (§5). Pool max comes from Potential and growth (§2, §7), for example about 350 for a Knight with average Potential.
- **Load → pool drawn.** Each M5 constant becomes a reserve-spec draw (base × scale × effort × state ÷ efficiency). "Same share" matching gives a sanity check: an M5 load L at capacity C took L/C of the limit. The M6 draw that takes the same share of pool max is (L/C) × pool max. The catalog's tier-based bases come out close to the M5 shares at Knight level, as the table below shows.
- **1.0 thresholds → strain 1.0.** M5's meter fraction (load ÷ capacity) and M6 strain both mean "past your limit" at 1.0, and both are relative to the character (checklist item 3, Jared's note). Every 1.0 line in 1.4 above becomes strain > 1.0: precognition's gate, which M6 already replaces with "senses go dark" at running on will; the sequence-cap penalty (kept, reserve §4); the warning; backlash; and collapse. During integration, the in-flight meter value can be read as strain directly (strain = load ÷ capacity), so other loads that have not converted yet (Force actions, a Shatterpoint read) keep working. The precognition trial does exactly this.

| M5 constant | M6 equivalent (proposed) | Check at Knight level (FS / FC 50, pool 350, efficiency 2.5) |
| --- | --- | --- |
| Precognition 0.4 per trigger | Sustained draw per exchange (reserve §10 rule 4). Catalog: Complex sustained, base 5 per round ÷ efficiency. Base **5 to 7.5**; the trial measures the effect (precog-m6-trial.md) | M5: 0.097 triggers per exchange × 0.4 ÷ 5.0 = 0.78% of the limit per exchange. M6 base 5 ÷ 2.5 = 2.0 a round = 0.57% of pool. Same-share base: 6.8 at Knight level (3.0 at FS 25, 11 at FS 100, because M6 efficiency rises faster with level than M5 capacity did) |
| Shatterpoint read 0.3 | D-63 amended: Advanced instant, base 40 × depth (combat ×1) ÷ efficiency, plus +0.05 focus strain | M5: 0.3 ÷ 5.0 = 6.0% of the limit. M6: draw 16 = 4.6% of pool. Inside the comfort line, with the rate multiplier (16 is above a 4% usual rate of about 14, ×1.2), strain = 0.046 × 0.25 × 1.2 + 0.05 = **0.064**. Close match. A Padawan at 30 pays 0.15 strain (M5 0.068), because the draw is above their usual rate |
| Backlash +0.5 mental per load point over the limit | +0.5 × (strain above 1.0) × mental capacity, added to the mental meter. Meaning: half of the overshoot, as a share of mental capacity | M5 at Force capacity 5.0 and mental capacity 5.0 (Will 50): one load point over = 0.2 of the limit over → 0.5 mental = 0.10 of mental capacity. Proposed: 0.2 strain over → 0.5 × 0.2 × 5.0 = 0.5 mental. Identical when the two capacities match, which they roughly do at every level (Force 4.25 to 6.8; mental 4.0 to 7.0) |
| Collapse 5% flat above 1.0 | 5%, +5 points per further use above 1.0, capped at 50% (reserve §5; checklist item 9 shows the current chance) | |
| Anger limit 1.3 | Backlash threshold 1.3 while anger is channeled (reserve §5). The same meaning as built, so no conversion is needed | |
| Force action bases (0.10 to 0.50) | Catalog base costs (Basic instant 10, Moderate 15, Complex 25, Advanced 40; sustained 2 × tier per round) | Push 0.15 standard at level 50: 0.15 × 0.75 = 0.11 = 2.25% of the limit. M6 (catalog: Basic instant 10; free at level 40 on objects only): 10 × 1.5 (a person) ÷ 2.5 = 6.0 = 1.7% of pool |
| Recovery (meditation 2.0/h, rest 1.0/h, sleep reset) | Reserve §6: meditation 25%/h of pool and 0.05 strain/h; sleep 8%/h and 0.12/h; quiet rest 5%/h and 0.04/h | M5 resets the meter with one 7-hour sleep. M6 clears about 1.0 strain over 8 hours of sleep, so it matches for a day that ends at the limit |
| Valor, Battlemind, Control Pain (health.md 0.10 to 0.15 a minute) | Per-round draws (catalog: Valor 3, Battlemind 5, Control Pain 5) | Item 16. Only the suppression crash (+0.5 mental) is built in M5; the per-minute loads were never coded |

## 2. Force talent: every place it affects growth (checklist item 4)

Talent is per domain (`skills.ts` `CATEGORY_RULES`). The **Force domain** covers Force Sense, Force Control, Force Output and every Force ability. **Meditation and Willpower are the mind domain (wisdom), and so is Force Knowledge (knowledge)**, so Force talent does not speed them.

| # | Place | What talent does | XP only, or does it feed something M6 moves to the pool? |
| --- | --- | --- | --- |
| 1 | M multiplier (`speed.ts` `speedM`, `training.ts` `speedFor`): talent × cross-talent × instruction × age × state × alignment × species, capped at 2.8 | Gifted 1.25, prodigy 1.5, exceptional 1.8 on the domain's XP | **XP only.** Applies to training XP (`computeXp.ts`) and combat XP (`combatXp.ts` lines 82 to 88) |
| 2 | Cross-talent (`crossTalentMult`) | A Force prodigy or better gets ×1.1 on combat technique skills (forms, blaster, melee) | **XP only** (combat skills) |
| 3 | Character creation (`creation.ts` lines 280 and 293; `closedForm.ts`) | The closed form's phase paces are multiplied by talent × cross-talent × species, so starting levels come out higher. Talent costs 1 to 3 of 3 points | **XP only** (starting levels). The M6 Potential step is separate (item 18) |
| 4 | NPC generation (`npcGen.ts`; `TALENT_ROLL_ORDERS`) | Per domain: Order roles 70% none / 22% gifted / 7% prodigy / 1% exceptional, others 79.8 / 17 / 3 / 0.2. Fed into the same closed form as creation | **XP only** (generated levels). M6: roll Potential separately; a Force path guarantees a band |
| 5 | Lifetime profiles (`tests/lifetime/profiles.ts`) | Anakin: combat prodigy and Force prodigy. Luke: Force prodigy. Obi-Wan and the Average: none | **XP only.** The profiles have no other Force-power input, so talent was the only stand-in for Anakin's and Luke's raw power. The item 4 risk applies: once Potential gives them big pools, check that they do not overshoot (the precognition trial gives them 27,700) |
| 6 | Force meter capacity (`forceCapacity`) | **No direct link.** Capacity reads Force Control and Willpower levels. Force talent speeds Force Control XP, so a talented character reaches higher capacity sooner (+3 capacity per 100 FC). Mind talent does the same through Willpower (+1 per 100) | **Indirect, through levels. Retires with the old meter.** Under M6, Force Control sets efficiency (draw per use), which is not pool, and Willpower sets the overdraw check |
| 7 | Force Sense level → precognition chance (D-244, min(0.5, FS/200)) | Talent speeds FS XP, so the trigger chance grows sooner | **XP only.** The trigger rule stays as tuned |
| 8 | Force Output level → largest effect (reserve §2) | Talent speeds Output XP | **XP only.** Output is not pool. Feat gates read pool max |
| 9 | Meditation level → pool refill and pool growth (reserve §6, §7) | **Mind talent** (not Force talent) speeds Meditation XP | **Indirect, through a stat.** M6 growth reads the Meditation stat. Mind talent therefore makes the pool fill and grow faster, but never raises the ceiling (Potential sets that) and never changes the Potential/50 factor. Recommendation: keep it. Meditation is a trained skill, so this is still "how fast you learn", not "how big the connection is". **Flag for Jared:** the two-axis rule says talent never touches the pool, and this indirect path is the one exception |
| 10 | Force Knowledge level → learnable abilities and study growth (reserve §2, §7) | Mind talent speeds Knowledge XP | **Indirect, through a stat** (the same as 9 for study growth). Access to abilities by Knowledge is not pool. Untrained access (awakening) is Potential's |
| 11 | The 4.0× pace clamp (D-48) and the "not faster than Anakin; within 4.0×" gates | Talent raises pace, so it pushes against the clamp | **XP only** |
| 12 | Unbalanced flag (D-116) | Ignores the 3-point talent limit | **XP only** |

Nothing else multiplies by talent. Searched: `talentMult`, `crossTalentMult`, `TALENT_MULT`, `talents` in `src/` and `tests/support/`. Instruction, applied experience E, rust, sparring, holocrons and the combat-integration factor do not read talent.

**Conclusion:** the two axes separate cleanly. Force talent feeds only XP. Its one route to Force "size" today is Force Control → capacity, and that retires with the meter. The only remaining link to the M6 pool is mind talent → Meditation and Force Knowledge levels → pool refill and growth speed (rows 9 and 10). That is a trained-skill path, and the recommendation is to keep it. It needs Jared's confirmation.

## 3. Force drill fatigue (checklist item 1)

### 3.1 What limits Force-drill hours today

| Limit | Rule | Where |
| --- | --- | --- |
| The routine's hours | Order requirements (Initiate: Force Control drill 0.5 h, sense awareness 0.5 h and Force lore 1 h a day; Padawan: Force Control drill 1 h and sense awareness 1 h with the master; Knight and up: none), then the fill up to the D-25 budget by archetype shares and focus sliders. From Knight on, the main specialty takes 0.5 of the fill (D-41) | `orderRequirements.ts`; `scheduler.ts`; `archetypes.ts` |
| Day-end tiredness limit | The fill is trimmed until the projected day ends under easy 0.7, standard 0.9 or push 1.0, measured as **max(physical, mental)**. A Force drill loads 0.4 physical and 0.8 mental an hour, so the mental meter is what trims it | `scheduler.ts` lines 346 to 377; `TIREDNESS_LIMIT` |
| Efficiency within the day | A Force drill is a mental activity (`isPhysicalActivity`: p 0.4 < m 0.8). Its XP per hour × e(mental fraction) × (1 − 0.5 × min(1, physical fraction)) | `fatigue.ts` `stepBlock` |
| Same activity | Each hour past 2 of the same activity in a day × 0.85 | `SAME_ACTIVITY` |
| Pace clamp | XP beyond 4.0× the skill's pace share is discarded (D-48, D-104) | `training.ts` `clampFor` |
| **Force meter** | **Rises 0.6 an hour during drills, but trims nothing and slows nothing.** It only gates combat: precognition, backlash and the sequence cap; in the harness, optional-fight readiness | See finding 1 |

### 3.2 How M4's challenge factor scales drill XP

XP per session = effective hours × intensity XP factor × **challenge(drill rating − level)** × outcome roll × M × the skill's share (`computeXp.ts` lines 100 to 101).

- Challenge anchors (`CHALLENGE_ANCHORS`, linear between them): gap −25: 0.3; −15: 0.6; −10 to +5: 1.0; +12 to +18: **1.25** (the push band); +25: 0.8; +35: 0.3.
- Drill ratings are fixed at 10, 30, 50, 70 and 90 (`DRILL_RATINGS`). The scheduler picks the rating with the best factor in the effort's band: standard and easy −10 to +10, push +10 to +20 (`pickDrillRating`).
- The push premium is +25%, and it costs intensity, which is a heavier load on the meters.
- Combat XP uses the same curve from gap −25, ramping to 0 at −35 (`combatChallenge`).
- **There is already an artificial ceiling.** Ratings stop at 90. A skill at 100 gets 1.0 (gap −10), at 105 it gets 0.6, at 115 it gets 0.3. Above about 100, drills stop paying, and growth has to come from other sources (combat, holocrons, self-study). Forms also have a separate drill ceiling by applied experience E (`selectDrillCeiling`).

### 3.3 Proposed difficulty-based rework

Goal (Jared, 2026-11-21): free uses give a trickle at most and are never a way to grind; growth comes from pushing; there is no artificial ceiling; the hours still come from the routine. Proposal, building on the challenge factor:

1. **Exercise difficulty replaces the fixed rating ladder for Force skills.** Each Force exercise is (ability tier, scale class, effort, abilities held at once), and its difficulty rating is
   `rating = 20 + 30 × log2(base × scale × effort × held / 10)`
   where base is the catalog tier cost (Basic 10, Moderate 15, Complex 25, Advanced 40), scale is the reserve §3 factor, effort is light 0.5 to all-out 2.0, and held = 1 + 0.5 per extra ability maintained. Every doubling of demand is +30 rating. Examples: Basic, hand-held, normal = 20. Complex = 60. Advanced = 80. Advanced at class 2 = 115. Class 3 all-out = 163. The scale has no top, so a harder exercise always exists, and the class gates (pool max) set what can be attempted.
2. **XP per hour = hours × intensity × challenge(rating − level) × outcome × M**, the M4 formula unchanged. The scheduler picks the exercise, the same way it picks a rating today: the hardest one in the effort's band that the pool and strain projection allow.
3. **Free uses earn only a trickle.** When the exercise's draw is 0 under the reserve §3 free rule, the challenge factor is multiplied by a trickle factor (default 0.1), and the exercise is at or below the level anyway (gap −10 or less), so its value is already falling. A routine full of free exercises gives at most 10% of the XP of pushing. With the routine setting the hours, that cannot be ground.
4. **Fatigue limits pushing.** The exercise's draw and strain come from the reserve formulas (§3, §4). The day projection adds strain to the trim test: the day is trimmed when strain passes a limit by effort (proposed easy 0.4, standard 0.75, push 1.0, the reserve §12 tier lines). Pushing at or above the level draws pool, so it reaches the comfort line, then the strain curve, and the trim takes off the extra hours. Meditation blocks refill the pool (25% an hour) and let more pushing fit. Drills alone grow Conditioning only a little (reserve §7).
5. **Pool growth from training near your limits.** Sessions that end below the comfort line without a collapse add the reserve §7 "training near your limits" activity value. That is a pool gain, separate from the XP above.
6. **No new ceiling.** Retire the fixed 10 to 90 ladder for Force skills: the open-ended rating replaces it.

**Tuning against the lifetime gates.**
- *Start neutral.* Choose the default exercise per rank so the challenge factor at today's routine hours matches today's average (about 1.0 at standard, 1.25 at push). Then confirm that every gate is unchanged on all 20 seeds (`npm run mortals` or `npm run spread`) before changing anything. If the rework is neutral, the Average's 41 at 16.0 ± 0.1 y and the Y_avg median gate hold with K unchanged.
- *Tunables* (K stays fixed): the trickle factor; the rating slope and offset (30 and 20); the strain trim limits by effort; and the default effort of each archetype's Force block.
- *Gates to watch:* Luke "Force still rising at 40 to 42 y of training; FC > 100 at 62". That gate tests the ceiling removal: today the 90-rating cap slows him past 100. Obi-Wan and Anakin milestones ± 20%. "Not faster than Anakin; within 4.0×". The Average's rank minimums (Force Control 14 and 34, Force Sense 31) ± 2 y. Peacetime combat share < 10%. Day-end tiredness < 1.1: with strain in the trim, this must still be measured on max(physical, mental), as the gate is defined.
- *Report, not tune:* anything that needs K or a formula change, as the checklist's re-measure list says.

## Not done in this report

- No game code changed. The flagged precognition prototype (part C) is described in `docs-v2/testing/precog-m6-trial.md`.
- The health.md e(f) mismatch (finding 2) is recorded here only. No spec was edited.
