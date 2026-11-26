# m8-droids: droids as data, skills, memory and personality, damage, companions (2026-11-26)

Decision D-512. Spec: docs-v2/spec/droids.md (every invented number is in its section 11; repeated below). Checklist item 7 ticked; item 16 added.

## 1. Droids

What was built, in short (the spec has the rules):

- **Models as dated data:** 45 models in one list: 40 named (the Old Republic models from SW_Droids_Classes, the Clone Wars and Galactic Civil War models the economy files price, the Legacy era's Roving Eye) and 5 generic stand-ins for years the lore leaves empty. Each has class, maker, price (lore, game stat or invented), years (lore, inferred or invented), programming, equipment, locomotion, chassis, combat kit, shield and bolt resistance.
- **Through the economy:** new droids are bought and sold with `trade`. A model outside its years is refused ("no R2 astromech droid units in 3661 BBY"); military and assassin models are black market only; a stolen droid sells to a fence.
- **Everything else** is one `droid` event in plain words, which the code reads. The first version, with structured fields, put the response schema 600 characters over its 12,000 cap. The words-only version costs about 350 characters, and every schema-size test passes.
- **Skills:** by class and model; modules and reprogramming (credits, a Repair stand-in roll, a shop for big jobs); a little learning while unwiped.
- **Personality:** grows with the years since the last wipe (basic, quirks, opinions, independent, full at about 9.5 years). A droid bought new starts basic, so full companions come from droids with a past. A wipe sends only the shop's bill: no alignment, flag or standing effect.
- **Restraining bolts:** they force obedience; resistant models and independent minds can break them.
- **Damage:** on systems by location, repaired and never healed; ion weapons and Ionize disable; shields stop 3 hits.
- **Astromech hooks:** for the ship rules. Players can't play a droid.

**Bug found while testing:** an ion overload's end time was floored at second 0. Dates before year 0 are negative seconds, so in any BBY campaign an ionized droid would never have recovered. Fixed in the engine; the test checks recovery in 3,661 BBY.

**Not wired:** combat's droid minions (D-213) still fight on their minion numbers. The duel engine doesn't use droid systems yet. `droidHit` is the hook for combat to call.

### Readings of the brief

- **The Repair stand-in:** combat-scales.md says Repair is "the level the caller has (none in play yet)", so the player had no stand-in. I used **Intelligence** (one constant, `REPAIR_STAND_IN`, for item 12 to swap).
- **Checklist item 15:** 15 is already the calibration queue (D-507), so "Starting traits and formative events" is **item 16**.
- **"At a shop"** is read from the narrator's words; the game has no typed shop locations yet.

## 2. Bacta and kolto (F2)

Bacta 400 and kolto 600 a tank-day in every era (`TANK_DAY`). The date changes only which fluid is rare: bacta before the switch-over, kolto after it. The rare fluid is had only on Core worlds and at the Temple, the same places as before; those places are still invented. Elsewhere a tank of it asked for is the standard fluid, and the report says so. medicine.md is updated. Tests: bacta is cheaper in 3,661, 2,500 and 1,000 BBY, 19 BBY and 40 ABY; kolto is rare after the switch-over.

## 3. Luke Skywalker (F3)

Added the Legacy of the Force sheet (SW_Characters_16, dated **40 ABY**, its "~40 ABY") and the Fate of the Jedi sheet (SW_Characters_17, dated **43 ABY**, "exiled ~43 ABY"). His line now runs RotJ → New Republic → NJO → LotF → FotJ. The FotJ sheet has no Mind Trick line, so the LotF value carries on.

| ABY | Before: Djem So | FC | FO | WP | **After: Djem So** | **FC** | **FO** | **WP** |
|---|---|---|---|---|---|---|---|---|
| 25 | 100.0 | 120.0 | 128.0 | 105.0 | **100.0** | **120.0** | **128.0** | **105.0** |
| 30 | 102.2 | 122.2 | 130.2 | 107.2 | **101.4** | **123.0** | **131.1** | **106.1** |
| 36 | 104.0 | 124.0 | 132.0 | 109.0 | **102.0** | **125.3** | **133.3** | **106.3** |
| 40 | 104.7 | 124.7 | 132.7 | 109.7 | **102.0** | **126.0** | **134.0** | **106.0** |
| 43 | 105.0 | 125.0 | 132.9 | 110.0 | **104.0** | **138.0** | **138.0** | **108.0** |
| 45 | 105.0 | 125.0 | 133.0 | 110.0 | **104.9** | **138.9** | **138.9** | **109.0** |

The apex lines (combat 98, Force Control 110, Willpower 105) are met at every date from 25 ABY (tested at 25, 30, 36, 40, 43 and 45). Djem So and Willpower come out **lower** than before from 30 to 43 ABY. The old line grew past the NJO sheet on the D-503 cap, and the LotF sheet's own numbers (Djem So 102, Willpower 106) sit below that growth. Willpower also dips slightly between 36 and 40 ABY (106.3 to 106.0): the curve runs through 105 at 25 and 106 at 40 along his growth. Force Control and Force Output rise all the way.

## 4. Canon ranks (F4)

A rank date the lore records now beats the role's age minimum for a canon figure (`canonAbsence`); only estimated spans are held to the minimum.

| Figure | Change |
|---|---|
| **Luke Skywalker** | Master span from **11 ABY** (was 12), at 30 (the Praxeum) |
| **Darth Thanaton** | Sith Lord at 16 (3,679) and Darth at 17 (3,678) were on record but hidden as "too young" until 3,677. Now present from 3,679. Span dates unchanged |
| **The Barsen'thor** | Master at 28 (3,640) was on record but hidden until 3,637. Now present from 3,640. Span date unchanged |

No other canon figure has a recorded rank date below its role's minimum; every other span at the minimum is an estimate. The roster test now lists these three as on record.

## 5. Vrath Xizor (F5)

Recorded as ruled: the sniper weighting stands (Blaster 47 in 3,653, Adept); no hand-set sheet (D-512).

## 6. Docs

Committed: docs-v2/spec/m8-design-notes.md (rev 68 from the lore chat, plus a "Built" line under "Droids"); droids.md; medicine.md; the checklist; the research queue's "Droids by era" entry (partly filled; what is still missing is listed there).

## 7. Runs

- `npm test`: 1,836 passed (158 files), 32 s. `npm run typecheck` and `npm run lint`: clean.
- `npm run test:all` (everything, including the lifetime tests): **1,891 of 1,891 passed (172 files) in 1,259 s (21.0 min)**. The lore index check passes (tests/lore/lore.test.ts: the index rebuilt from the lore files matches the generated one; no lore file was edited during the run).
- Tests changed to the new rules: the medicine tank prices and fluid wording (two files), healingFluidAt's kolto label, the roster test (lore rank dates allowed below the minimum, listed), and the M2 save fixture (it now strips the droids slice too).

## 8. Every invented number

| Number | Where |
|---|---|
| Class factory ratings (medicine 50, science 45; repair 45, astrogation 40, slicing 30; languages 70, social 35; blaster 35, melee 30, security 40; labour 40); a second class at 80% | `CLASS_SKILLS` |
| Model ratings over their class | `DROID_MODELS` `skills` |
| Skill caps 90 in class, 50 off class | `SKILL_CAP` |
| Advanced module +10, 2,000 cr, rating 50; basic +5, rating 30 (its 400 cr is a game stat) | `MODULES` |
| Reprogramming: a new skill at 20, 1,000 cr, rating 45 | `REPROGRAM` |
| A failed job loses half the parts; shop technician 45, labour 50% | `FAILED_PARTS_LOST`, `SHOP` |
| The Repair stand-in: Intelligence | `REPAIR_STAND_IN` |
| Learning up to +10 on a 6-year scale | `LEARNING` |
| Personality on a 5-year scale; stages at 0.2 / 0.45 / 0.7 / 0.85; drift by model (T3 1.5, G0-T0 2, HK 1.5, T7 1.2, Basilisk 1.3, JK-13 1.5, labour 0.3-0.6, B1 and B2 0.3) | `PERSONALITY`, `PERSONALITY_STAGES`, `drift` |
| The 16 quirks | `QUIRKS` |
| Years since a wipe, by how it was had: second-hand 0-6, salvage 2-20, gift 0-10, found 3-25, stolen 0-8 | `PAST_YEARS` |
| Regard: repairs and upgrades +1; a bolt -1; an order forced through the bolt -1; range -5 to 5 | `REGARD` |
| Bolt breaks: resistant 35%, independent 10%, full 20%; refusing without a bolt at regard 0 or less | `BOLT_BREAK`, `REFUSES_AT_REGARD` |
| Hit location weights 35 / 15 / 20 / 10 / 20 | `LOCATION_WEIGHT` |
| Damage steps at 0.3 / 1.0 / 2.5x toughness; toughness 10 / 16 / 24 / 34 | `DAMAGE_STEPS`, `TOUGHNESS` |
| Destroyed at three locations; a damaged system works at 70% | `DESTROYED_LOCATIONS`, `STATE_FACTOR` |
| Which location serves each skill | `SKILL_LOCATION` |
| A narrated hit: graze 30%, solid 50%, clean 20% | `hitFrom` |
| Ion: 4 minutes per multiple of toughness, 1-30 min; an Ionize margin of 20 damages the processor; ion pistol 30, rifle 45, grenade 40; Ionize at the caster's Force Output (40 if none) | `ION`, `ION_POWER` |
| A shield stops 3 hits and is back once time passes; ion drains it | `DROID_SHIELD` |
| Repair: parts 5 / 15 / 30% of the price; ratings 30 / 45 / 55; 1 / 4 / 8 hours; disabled and destroyed parts need a shop; an unsold model counts as 20,000 cr | `DROID_REPAIR`, `REPAIR_HOURS`, `UNPRICED_VALUE` |
| A replaced destroyed processor wipes the memory | `handleDroid` |
| Impound fee 20% of the price | `IMPOUND_FEE_SHARE` |
| Co-pilot +1 per 20 points, at most +4 | `COPILOT` |
| The date's model of a kind is the cheapest named one in service | `modelForKind` |
| Prices from comparable models: T7 4,000, X2-C3 4,000, M3-M1 2,000, Imperial medical droid 2,500, 2-1B 4,300; generic labour 1,000, generic security 4,700 | `DROID_MODELS` |
| Model years invented or widened where the sources give one date or none (each model's `dateTier` says so): among them the R1, R2, R4, 3PO, 2-1B, MSE-6, PK, the T3's end (3,640) and the T7's span (3,690-3,000) | `DROID_MODELS` |
| Bolt resistance for the HK line, the Sentinel, the patrol droid, the JK-13 and the generic security droid | `resistsBolt` |
| The patrol droid legal; military, assassin, gladiator and recon models restricted | `restricted` |
| The rare healing fluid had only on Core worlds and at the Temple (the places; the rarity and the 400 / 600 prices are Jared's ruling) | `RARE_FLUID_AT` |
| Luke's LotF sheet dated 40 ABY and FotJ sheet 43 ABY (from the files' "~40" and "~43"); the LotF Mind Trick carried into FotJ | `LUKE_LOTF_SHEET_BBY`, `LUKE_FOTJ_SHEET_BBY` |

From lore or a game stat, not invented: the five classes; the dated Old Republic models; the prices listed in the spec's section 11; the basic module's 400 cr; a wipe 500 cr; second-hand at half price.
