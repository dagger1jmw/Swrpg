# Droids (as built, M8 item 7)

Design: m8-design-notes.md, "Droids" (all agreed). Lore: Docs/SWRPG lore/SW_Droids_Classes.md (classes, restraining bolts, memory wipes, legal status, the Great Droid Revolution, Ionize, the Old Republic models). Prices: SW_Economy_Prices_Ships_Weapons_Droids.md (in-universe) and SW_Economy_GamePriceLists_Part6.md (game stats, the KOTOR Campaign Guide first). Sales go through the economy (economy.md). Decision: D-512. Every number not from lore is `invented`; section 11 lists them all.

Code: `src/data/droidModels.ts` (the models, dated), `src/data/droids.config.ts` (every number), `src/engine/droids.ts` (the rules, pure), `src/features/droids/` (the owned droids, the events, the narrator's lines). The economy prices and sells them (`src/data/economyPrices.ts`, `src/features/economy/index.ts`). Tests: `tests/m8/droids.test.ts`.

## 1. Droids as data

- **Models** are one dated list (D-438): class (one to five, and a second class for a model built for two, like the HK), maker, price, the years the model is made and sold, factory programming, equipment, locomotion, chassis, weapon and armour for combat models, a shield, bolt resistance, and how fast its personality grows. `priceTier` and `dateTier` say where each value comes from (lore, game stat, inferred, invented).
- **45 models**: 40 named (the Old Republic models from the lore file, the Clone Wars and Galactic Civil War models the economy files price, the Legacy era's Roving Eye) and 5 generic stand-ins (protocol, astromech, medical, labour, security) for the years no named model covers. The lore leaves long gaps (no protocol model between 3,600 and 150 BBY, for one); the research queue keeps the "Droids by era" gap open for them.
- **The date decides**: `modelsInService(year)`; the date's model of a kind is the cheapest named model in service, else the generic one (`modelForKind`). An astromech in 3,661 is a T3 (the T3s run to 3,640, invented); in 3,600 a T7.
- **Individual droids** (`DroidUnit`): the model plus a name or designation, how it was had, the day of its last wipe, modules and reprogramming, the state of each system, an ion overload's end, shield charge, a restraining bolt, its regard for its owner, impounded, stolen. Everything else (skills, personality, status) is worked out from the date.

## 2. The narrator and the code

- **New droids are bought and sold with `trade`**, like any gear. The narrator names the droid in plain words ("a T7 astromech", "an R2 unit", "an astromech"); the code finds the model's catalog row (a generic word is the date's model of that kind), refuses a model not made in that year, prices it (location, black market for military and assassin models, haggling) and sends `droidAcquired`; a sale needs an owned droid (a stolen one goes to a fence) and sends `droidSold`.
- **Everything else is the `droid` event, in words**: one field, `what` ("bought a second-hand T3", "salvaged an astromech named Patch", "wiped Patch's memory", "fitted a restraining bolt", "ordered Patch against its will", "an advanced astrogation module at a droid shop", "repaired at a shop", "hit by an ion grenade", "impounded", "Patch was stolen"). The code reads the act, the droid and "at a shop" from the words (`parseDroidWhat`); a report it can't read is refused with a request for plainer words. One field keeps the response schema under its 12,000-character cap (the structured version cost 1,900 characters). `droidAct` is the structured form for the engine and the player.
- **A new droid is never free**: "bought a T7" through the droid event is refused (new droids go through `trade`).
- **The narrator sees** each owned droid (model, class, personality stage and quirks, regard, bolt, status and damaged systems, ion time left, shield, impounded, stolen, skills) and the models sold that year.

## 3. Skills

- **By class and programming** (`CLASS_SKILLS`): class one medicine 50 and science 45; class two repair 45, astrogation 40, slicing 30; class three languages 70 and social 35; class four blaster 35, melee 30, security 40; class five labour 40. A model's own ratings override its class (a 3PO's languages 80; a 2-1B's medicine 70); a second class adds its skills at 80%.
- **Droid skills are their own list** (`DROID_SKILLS`), each mapped to the organic skill it stands in for in a roll (`DROID_SKILL_GAME`; repair has none until checklist item 12).
- **Modules, not training**: a basic module (+5, a droid customization kit, 400 cr, game stat; DC rating 30) or an advanced one (+10, 2,000 cr, rating 50, a big job: a shop). Reprogramming adds a skill the droid lacks at 20 (1,000 cr, rating 45, a shop). The roll is the **Repair stand-in** (the character's Intelligence, `REPAIR_STAND_IN`, until item 12); at a shop the better of it and the shop's technician (45) rolls, and the shop's labour is 50% of the parts. A failed job loses half the parts. A skill tops out at 90 for the droid's class, 50 for any other.
- **Learning**: a droid learns up to +10 on its programmed skills while unwiped (63% of it in 6 years). A wipe takes it; modules and reprogramming are hardware and stay.

## 4. Memory and personality

- **Growth**: p = 1 − e^(−years unwiped × drift / 5). Stages: basic (a factory droid), quirks from 0.2 (about a year), opinions from 0.45 (about 3 years), independent judgement from 0.7 (about 6), full personality from 0.85 (about 9.5). Drift by model: T3 1.5 and G0-T0 2 (the lore's unwiped T3 gangs and G0-T0's motives), HK 1.5, labour droids 0.3 to 0.6.
- **Quirks**: one more for each stage past basic, from a list of 16 (narrator colour), chosen by the droid's seed and its last wipe.
- **Full companions come only from droids with a past**: a droid bought new starts at basic. Second-hand units come 0 to 6 years from their last wipe, gifts 0 to 10, stolen 0 to 8, salvage 2 to 20, found droids 3 to 25. A droid never wiped grows into a full companion in time.
- **Regard** (−5 to 5) shows once a droid has opinions: repairs and upgrades +1; a bolt fitted −1; an order forced through the bolt against its will −1. Shown as loyal, friendly, neutral, wary or resentful.
- **Wiping** (500 cr, Void's wipe, c. 25 ABY) resets personality, quirks, learning and regard. It is a hard choice, not a dark-side act (Jared): the code sends only the shop's bill, no alignment, flag or standing event. The note names who may react (other droids with opinions, NPCs present).
- **Restraining bolts** force obedience to the caller. A droid built or modified to resist (HK, the security models) breaks it on 35% of forced orders; a droid with independent judgement on 10%, a full personality on 20%. Without a bolt, a droid with independent judgement refuses an order against its will when its regard is 0 or less. Droids don't count as people for alignment; how they are treated is story.

## 5. Combat and damage

- **Systems by location**, like ships: limbs, sensors, motivator, processor, weapons; each working, damaged, disabled or destroyed. A hit lands by weight (limbs 35, sensors 15, motivator 20, processor 10, weapons 20; no weapons, spread over the rest). The droid is **disabled** when its motivator is down or its processor disabled (or ionized), **destroyed** when its processor is destroyed or three locations are.
- **Damage steps**: power (combat's weapon base damage × hit quality) against the chassis's toughness (light 10, medium 16, heavy 24, war 34): under 0.3× nothing, then 1, 2 or 3 steps at 1.0× and 2.5×. A narrated hit draws its quality (graze 30%, solid 50%, clean 20%).
- **What damage does**: a skill works at 70% while the location serving it is damaged, not at all once it is disabled (`SKILL_LOCATION`, `STATE_FACTOR`).
- **No wounds, no bleeding**: the health slice never sees a droid. Droids are **repaired**: parts as a share of the model's price (damaged 5%, disabled 15%, destroyed 30%; a model not sold counts as 20,000 cr), a Repair stand-in roll (ratings 30 / 45 / 55), a shop for disabled and destroyed parts, 1 / 4 / 8 hours. A destroyed processor replaced is a new processor: the memory goes with it.
- **Ion weapons and Ionize disable** rather than damage: 4 minutes for each multiple of the droid's toughness in the ion power, 1 to 30 minutes (ion pistol 30, rifle 45, grenade 40; Ionize the caster's Force Output). An Ionize margin of 20 or more also damages the processor. Ion drains a shield at once. A repair reboots an ionized droid.
- **Shields**: the Mark I assault droid and the droideka carry one; it stops 3 hits (blaster bolts and lightsaber strikes, lore), then drops; it comes back as soon as time passes.
- **Not yet wired into the duel engine**: combat's droid minions (D-213) still fight with their minion numbers. The `droidHit` engine event takes a hit on an owned droid with its power, for combat and hazards to call.

## 6. Companions and roles

- **Astromechs** (`astromechHooks`, for the ship rules, checklist item 13): astrogation and in-flight repair as they work now (0 when disabled), a co-pilot's bonus (+1 per 20 points of astrogation or piloting, at most +4), and the starfighter interface (the T3's socket). `crewWithAstromech` gives a ship's crew the better repair; `selectAstromech` the best astromech the character owns.
- **Protocol droids**: `socialSupport` (the better of languages and social). **Combat droids**: `escortRating` (the best of blaster, melee and security).
- **Players can't play a droid** (Jared): character creation refuses the droid species for a player (`playerDroidRefusal`); droids are companions and NPCs only.

## 7. Legal status

- **Property**: bought and sold through the economy; a second-hand unit through the droid event at half price (lore: SE4 2,600 / 1,300 cr); stolen droids are marked and go to a fence; impounded droids are held until reclaimed for 20% of the model's price (a stolen one goes back to its owner instead).
- **Jedi**: a droid is never a personal holding (D-511).
- **Droid rights** is narrator colour: a contested movement, set back by the Great Droid Revolution (4,015 BBY).

## 8. State

`droids`: `units` (the owned droids) and `nextId`. A save made before droids loads with none. The only day hook recharges shields.

## 9. Not built here

- The duel engine does not yet use droid systems for droid opponents (section 5).
- The Repair skill (item 12) replaces the stand-in; the ship rules (item 13) call the astromech hooks.
- Droids as companions in fights are story-only, like other allies (D-143 E).

## 10. Tests

`tests/m8/droids.test.ts`: model availability follows each model's dates (and a generic model fills a gap); a narrator's words name the model and its row; skills from class and programming, learning while unwiped, a wipe takes it; a module upgrade raises a skill and needs credits, a roll and, for a big job, a shop; personality grows with time unwiped, full companions only with a past, a wipe resets it with only a bill (no alignment, flags or dark choices); a restraining bolt forces obedience and a resistant droid can break it; damage lands on systems by location, the health slice untouched, repaired at a cost; ion weapons and Ionize disable, and wear off; a droid shield stops a bolt; the astromech hooks return what the ship rules need; droids are bought, sold and impounded through the economy, a model out of its years refused, a second-hand unit at half price; a droid never counts as a Jedi's holding; a player can't create a droid character. Also the run's other items: Luke's five sheets and canon rank dates.

## 11. Every invented number

| Number | Where |
|---|---|
| Class factory ratings (medicine 50, science 45; repair 45, astrogation 40, slicing 30; languages 70, social 35; blaster 35, melee 30, security 40; labour 40); a second class at 80% | `CLASS_SKILLS`, `factorySkills` |
| Model ratings over their class (every `skills` entry in droidModels.ts) | `DROID_MODELS` |
| Skill caps: 90 in class, 50 off class | `SKILL_CAP` |
| Advanced module +10, 2,000 cr, rating 50; basic module +5 and rating 30 (its 400 cr is a game stat) | `MODULES` |
| Reprogramming: a new skill at 20, 1,000 cr, rating 45 | `REPROGRAM` |
| A failed job loses 50% of the parts; a shop's technician 45, labour 50% | `FAILED_PARTS_LOST`, `SHOP` |
| The Repair stand-in: Intelligence | `REPAIR_STAND_IN` |
| Learning: up to +10, 6-year scale | `LEARNING` |
| Personality: 5-year scale; stages at 0.2 / 0.45 / 0.7 / 0.85; drift per model (T3 1.5, G0-T0 2, HK 1.5, T7 1.2, Basilisk 1.3, JK-13 1.5, labour 0.3-0.6, B1 and B2 0.3) | `PERSONALITY`, `PERSONALITY_STAGES`, model `drift` |
| The 16 quirks | `QUIRKS` |
| Years since a wipe by how it was had (second-hand 0-6, salvage 2-20, gift 0-10, found 3-25, stolen 0-8) | `PAST_YEARS` |
| Regard: repairs and upgrades +1, a bolt -1, an order forced through the bolt -1, range -5 to 5 | `REGARD` |
| Bolt breaks: resistant 35%, independent 10%, full 20%; refusing without a bolt at regard 0 or less | `BOLT_BREAK`, `REFUSES_AT_REGARD` |
| Location weights 35 / 15 / 20 / 10 / 20 | `LOCATION_WEIGHT` |
| Damage steps at 0.3 / 1.0 / 2.5x toughness; toughness 10 / 16 / 24 / 34 | `DAMAGE_STEPS`, `TOUGHNESS` |
| Destroyed at three locations; a damaged system 70% | `DESTROYED_LOCATIONS`, `STATE_FACTOR` |
| Which location serves each skill | `SKILL_LOCATION` |
| A narrated hit: graze 30%, solid 50%, clean 20% | `hitFrom` |
| Ion: 4 minutes per multiple of toughness, 1-30; Ionize margin 20 damages the processor; ion pistol 30, rifle 45, grenade 40; Ionize the caster's Force Output (40 if none) | `ION`, `ION_POWER` |
| A shield stops 3 hits; it is back once time passes; ion drains it | `DROID_SHIELD` |
| Repair: parts 5 / 15 / 30% of the price, ratings 30 / 45 / 55, 1 / 4 / 8 hours; disabled and destroyed parts a big job; an unsold model counts as 20,000 cr | `DROID_REPAIR`, `REPAIR_HOURS`, `UNPRICED_VALUE` |
| A replaced destroyed processor wipes the memory | `handleDroid` repair |
| Impound fee 20% of the price | `IMPOUND_FEE_SHARE` |
| Co-pilot +1 per 20 points, at most +4 | `COPILOT` |
| The date's model of a kind is the cheapest named model in service | `modelForKind` |
| Prices invented from comparable models: T7 4,000, X2-C3 4,000, M3-M1 2,000, Imperial medical droid 2,500, 2-1B 4,300; the generic labour 1,000 and security 4,700 | `DROID_MODELS` |
| Model years invented or widened where the sources give one date or none (each model's `dateTier` and source says which) | `DROID_MODELS` |
| Bolt resistance for the HK line, the Sentinel, the patrol droid, the JK-13 and the generic security droid (the lore says security droids and a few custom units) | model `resistsBolt` |
| A patrol droid sold legally; military, assassin, gladiator and recon models restricted | model `restricted` |

From lore or a game stat, not invented: the classes; GE3 2,500, T3 3,500, G0-T0 60,000, Mark I 14,910, Mark IV 16,270, Juggernaut 20,000, Sentinel 2,400, patrol droid 4,700, K-X12 6,000, ET-74 2,700, LB 6,000, R-8009 800, S6 2,000, R1 3,500, R4 2,750, Mark X 35,000, R-1 recon 16,000, MSE-6 350, Roving Eye 3,200 (game stats); 3DO 1,500, HK-47 5,000, 3PO 3,000, an R2 4,245, MD 2,000, NR-5 2,200, PK 1,000, ASP 1,000, SE4 2,600, JK-13 80,000 (in-universe); the basic module 400 (a droid customization kit); a wipe 500; second-hand at half; the dated models (the Basilisk from 4,017 BBY, the Krath from 4,000, the G0-T0 from 3,985, the Sith war droid in the Great Galactic War, the B1, B2 and droideka per D-213, and the economy files' dated prices).
