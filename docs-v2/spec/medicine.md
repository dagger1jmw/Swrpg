# Medicine (as built, M8 item 6)

Design: m8-design-notes.md, "Medicine" (all agreed). Builds on health.md §7 (base healing times and the facility multiplier stay), the wound depth rules in the design notes ("Realistic damage") and Docs/SWRPG lore/SW_Kolto_Bacta.md. Prices come from the economy (economy.md). Decision: D-511. Every number not from lore is `invented`; section 12 lists them all.

Code: `src/data/medicine.config.ts` (every number), `src/engine/medicine.ts` (rules, pure), `src/features/health/medicine.ts` (care on wounds, the treatment roll, the daily risks, surgery's effects), `src/features/health/index.ts` (the events and the day hook), `src/turn/medicine.ts` (an intent's care plan and its bill). Tests: `tests/m8/medicine.test.ts`.

## 1. The code owns care

Care levels, healing times, outcomes and costs are code; the narrator describes them.

- **The intent** (schema-checked) names the care: `healing.source` is `treat` (first aid), `admit` (a facility), `tank`, `surgery`, `antidote` or `forceHealer`, with `at` (field, medcenter, temple, military, ship), `fluid` for a tank the player names, `procedure` and `aid` for surgery, and `healerRef` for a named healer. The old `medical` and `bacta` still read as `admit` and `tank`.
- **The care plan** (`carePlan`) turns it into engine events: `careStarted` (field, medical, kolto, bacta, Force healer), `toxinsPurged`, `surgeryDone` (with the roll already made), `prostheticRepaired`, and `creditsCharged` for the bill. Combat sends `prostheticDamaged`. All are engine-only; the narrator never sets health.
- **RESOLVED** tells the narrator the care applied ("a kolto tank (the patient does nothing else meanwhile) (kolto is the standard healing fluid of this date; bacta is a rare import, had only in the Core and at the Temple)"), and the narration check still refuses bacta, kolto or Force healing nobody applied.

## 2. Levels of care

Rate multipliers on health §7's base times. Force healing stacks on any of them (x(1 + level / 50)), capped at x6 as before.

| Level | Multiplier | What it does |
|---|---|---|
| None | x1 | The untreated risks (§3) |
| Field care (a medpac, or a medic with supplies) | x1 | Stabilizes the dying through the Medicine check (mortal becomes a stabilized critical, as today); dresses every wound (no untreated risks, infection cleared); sets a broken bone; dulls pain briefly (narration only) |
| Medical facility (medcenter, ship's medbay, the Halls of Healing) | x2 | As today, for its days; dresses the wounds too |
| Kolto tank | x4 | As today's tank |
| Bacta tank | x5 | Design default: bacta is the more effective |

- **Tanks** apply at once for their hours and run until every wound they can heal would heal (a course), never longer than the turn's span. A patient in a tank does nothing else (a jump with a tank is rest).
- **Which fluid** (`tankFluid`): the date's standard (health.config `healingFluidAt`: kolto before the switch-over, the 2,000 BBY placeholder; bacta after). The other fluid is rare (Jared, 25 Nov 2026): before the switch-over bacta, after it kolto. The rare fluid is had only on Core worlds and at the Temple (`RARE_FLUID_AT`); a tank of it asked for elsewhere is the standard fluid, and the report says so.
- **Each wound keeps the best care it had** and that care's operator, for the treatment roll (§5).

## 3. Untreated wounds

Rolled once a day for each wound with no care, by what made it (the wound's `cause`, set by combat from the weapon and by hazards):

- **Blades, claws, slugs and shrapnel:** a moderate or worse wound left untreated past a day may infect (15% a day); an infected wound heals at half speed until treated. A severe or worse one also bleeds: 25% of max Vitality a day, and a 10% chance a day of worsening a band (never past critical: the day's risks do not start a dying timer).
- **Blasters and lightsabers:** the heat cauterizes; no bleeding, and the infection chance is x0.15. A species a blaster or lightsaber does not cauterize takes the full risk (`NO_CAUTERIZE_SPECIES`, empty: no lore file names one).
- **Bruises, burns and older wounds** (no cause on record) carry no untreated risk.
- **Field care or better removes every risk** and clears an infection.

## 4. Wound depth heals without surgery

A wound may carry its depth (the design notes' "Realistic damage"; combat assigns it once realistic damage is built):

- a **partial cut** heals as severe (the limb slow and weak meanwhile, through the wound's penalty);
- a **severed muscle** heals as critical; no surgery is needed;
- a cut **to the bone** is critical and heals only once set (field care or a facility).

## 5. The treatment roll

When a severe or worse wound finishes healing, one roll decides how it healed. Treatment quality q = the operator's Medicine + the care's bonus (bacta 45, kolto 35, facility 20, field 5); against the wound's difficulty (severe 30, critical 50, mortal 70), success g = 1 / (1 + e^-((q - difficulty) / 12)). Then:

| Outcome | Share |
|---|---|
| Lasting injury (progression spec §18) | health §7's baseline (10 / 35 / 70%) x (1 - g) |
| Minor lasting injury (30% of the kind's penalties, adapted to like any other) | 25 / 35 / 30% x (1 - g) |
| Scar (cosmetic, recorded) | what is left x (1 - g^2) |
| Clean | the rest |

- A bacta tank with a skilled operator (Medicine 50) gives clean or scar on a critical wound about 98% of the time.
- Better care never gives worse odds; even field care is better than none.
- **An untreated wound keeps health §7's baseline**: a lasting injury at 10 / 35 / 70%, else a scar.
- The operator: a named healer's Medicine; else the place's staff (medcenter and military medbay 45, the Temple's healers 60, a ship's medbay 35) or, in the field, the better of a medic's 25 and the character's own.

## 6. Surgery

For what needs a surgeon: fitting a prosthetic, internal injuries, removing a toxin source or shrapnel.

- **Needs a facility** (not the field) and an operator with **Medicine 50+**; otherwise it is refused and nothing is charged. A ship's medbay staff (35) fall short unless a skilled healer is named.
- **The roll:** margin = operator + 10 - the procedure's difficulty (prosthetic 50, internal 60, extract 45) + 20 x (2u - 1). 0 or more: success; down to -15: a weaker result; below: worse.

| Procedure | Success | Weaker | Worse |
|---|---|---|---|
| Prosthetic | The aid asked for (basic or a quality cybernetic) | A basic prosthetic, fitted badly (damaged) | No prosthetic, and a moderate wound to the stump |
| Internal | The wound heals as one band lighter | No benefit | The wound one band worse |
| Extract | Toxin source and shrapnel out | Out, but the wound reopens (healing starts again) | Still in, and the wound one band worse |

## 7. Prosthetics and cybernetics

- The existing rules stay: quality tiers and adaptation (basic up to 80%, quality cybernetic 100%; progression spec §18), the Force ceiling (D-323).
- **Cost:** a basic prosthetic arm or leg 2,000 cr, a hand 1,000 (Repli-Limb, game stat); a quality cybernetic 7,500 (the Beemon implant, c. 3,956 BBY, lore). Available in every year of play (the lore records prosthetics in the Old Republic and gives no first date).
- **Fitting** uses the surgery roll (§6).
- **A hit to a prosthetic is equipment damage** (health §5 left this to M8): the wound it would have done damages the aid (W 10+) or breaks it (W 20+, or a second damaging hit). Damaged: half its adaptation counts. Broken: it counts as no aid (the limb is missing, and a lost leg cannot stand) until repaired. A stay at a facility repairs it, at 10% (damaged) or 30% (broken) of its price.

## 8. Toxins

- A poisoned wound carries a toxin (venom, poison, dart). The poison hazard leaves one; darts and anti-Jedi gear do once equipment is built.
- While it is in the wound, the wound does not heal, and each day the toxin drains 20% of max Vitality and may worsen the wound a band (10%; never past critical).
- **Cleared by** an antidote (a medpac's in the field, or a facility's), or the Force: Detoxify Poison (force-catalog-m6), read until the catalog builds it as Force Heal (Self) 10 with Meditation 15, or a healer's Force Heal (Others) 10.

## 9. Cost and access

- **Free** for a Jedi with the Temple's healers and for a soldier in a military medbay. Their medpacs and antidotes are issued (the quartermaster, military kit), so field care costs them nothing anywhere.
- **Everyone else pays**, through the economy's `creditsCharged` (a shortfall is owed on bank terms): a medpac used (500, the catalog), a medic's visit (500, the catalog's doctor), a facility (the doctor's 500 and 150 a day), a tank by the day (bacta 400, kolto 600, in every era: bacta is the cheaper fluid in every era, Jared, 25 Nov 2026; the date changes only availability), surgery (prosthetic 3,000, internal 5,000, extract 1,500, plus the prosthetic), an antidote (250), prosthetic repairs. Services take half the location swing and the dated events as the economy prices them.

## 10. Not built here

- Combat does not yet assign wound depth (realistic damage, design notes); the healing rules for depth are ready.
- Medpacs are not counted: the economy has no inventory, so a medpac used is charged at the local price unless issued.
- Darts and anti-Jedi gear carry no toxin until the equipment catalog (spec 22) is built; a Repair skill (item 12) will repair prosthetics outside a facility.
- NPC wounds heal by the old rule (health §9); the treatment roll is the player's.

## 11. Tests

`tests/m8/medicine.test.ts`: each care level heals at its multiplier; field care stabilizes (by the check) and removes the untreated risks but does not speed healing; bacta beats kolto and is cheaper in every era (400 against 600), rare before the switch-over, kolto rare after it; an untreated blade wound can infect and a severe one bleeds, a blaster wound much less; a severed muscle heals without surgery and a cut to the bone needs setting; a skilled bacta-tank operator mostly gives clean or scar on a critical wound, and an untreated wound falls back to 10 / 35 / 70%; surgery needs a facility and skill, and a miss gives a weaker result; a prosthetic hit becomes equipment damage; an antidote or a Force purge clears a toxin; Jedi and soldiers are treated free in their own facilities, and the economy charges everyone else. Also the run's other items: Krayt apex, Luke's line, Vrath Xizor, Jedi wealth.

## 12. Every invented number

| Number | Where |
|---|---|
| Bacta tank x5 (Jared's design default; kolto x4 and facility x2 are health §7's) | `CARE_MULT` |
| Care bonuses: bacta 45, kolto 35, facility 20, field 5 | `CARE_BONUS` |
| Default operators: field 25, medcenter 45, Temple 60, military 45, ship 35 | `DEFAULT_OPERATOR` |
| Treatment roll: difficulty 30 / 50 / 70, spread 12, minor-lasting base 25 / 35 / 30%, a minor injury 30% of the penalty | `TREATMENT` |
| An untreated severe or worse wound that leaves no lasting injury scars | `UNTREATED_SCARS_FROM` |
| Untreated: infection after 1 day at 15% a day, infected x0.5; bleeding 25% of max Vitality a day from severe; worsening 10% a day; cauterized infection x0.15 | `UNTREATED` |
| Worsening by the day's risks stops at critical | `features/health/medicine.ts worsened` |
| Surgery: Medicine 50+, facility +10, difficulty 50 / 60 / 45, spread 20, a bad miss below -15; the three outcome tables | `SURGERY`, `surgery` |
| Prosthetic damage at W 10, broken at W 20; damaged x0.5 adaptation | `AID_DAMAGE_W`, `AID_DAMAGED_SHARE` |
| Prosthetics available in every year | `PROSTHETIC_PRICE` |
| Toxin: no healing, 20% of max Vitality a day, worsening 10% a day; the Force purge read as Force Heal 10 (+ Meditation 15 for oneself) | `TOXIN`, `FORCE_PURGE` |
| Facility 150 a day; surgery 3,000 / 5,000 / 1,500; repairs 10% / 30% of the price | `MEDICAL_PRICE` |
| The rare fluid of the date (bacta before the switch-over, kolto after it) only on Core worlds and at the Temple (the places invented; the rarity is Jared's ruling) | `RARE_FLUID_AT` |
| A tank course at least 6 hours (health §7's minor in 6 hours) | `TANK_MIN_HOURS` |
| Antidote 250 (the middle of the bio-antidote's 75-500 game range) | catalog `antidote` |
| A shortfall on a medical bill owed on bank terms | `carePlan` |
