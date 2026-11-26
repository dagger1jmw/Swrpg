# Non-Force skills, Gunnery and Repair, melee styles, archetypes and ranks (as built, M8 items 10 and 12)

Design: [m8-design-notes.md](m8-design-notes.md), "Non-Force skills and archetypes" and its "Gunnery and Repair" part (all agreed by Jared, 25 Nov 2026). Lore: Docs/SWRPG lore/SW_Martial_Cultures_AllEras_Part1-3.md (styles in Parts 1-2; the training tables and who teaches outsiders in Part 3; the rulings of 24 Nov 2026). Decision: D-513. Report: docs-v2/reports/m8-skills.md. **Every number not from lore or Jared is `invented`; section 10 lists them all.**

Code:
- Data: `src/data/skills.ts` (Gunnery, Repair), `src/data/activities.ts` (the new activities), `src/data/skillXp.config.ts` (every XP-from-play number), `src/data/martialStyles.ts` (the styles, dated), `src/data/trainingProgrammes.ts`, `src/data/serviceRanks.ts` (the ladders), `src/data/archetypes.ts` (nine new archetypes), `src/data/canon/skillDrafts.ts` (draft sheets for review).
- Rules (pure): `src/engine/playXp.ts`, `src/engine/martialStyles.ts`, `src/engine/programmes.ts`, `src/engine/serviceRanks.ts`; `crewFromLevels` in `src/engine/ships.ts`; the insight modifier in `fleetBattle.ts` and `groundBattle.ts`; style rolls in `duel.ts`.
- Features: progression (`playXpEarned`, `styleFought`, `styleSet`; the style and insight of a training session), training (style sessions, the peer rate, culture study, service unlocks), ranks (`serviceJoined`, `serviceLeft`, `serviceDeedRecorded`, `servicePromotionProposed`, `serviceAppointed`, `programmeEnrolled`, `programmeLeft`), npcs (`npcStyleSet`), droids (Repair, the tool kit, `toolKitAcquired`), economy (the tool kit row), combat (styles in the fight, strikes, deeds), the turn (social lines, persuasion and stealth from checks).
- Tests: `tests/m8/skills.test.ts`; the re-measure probe `tests/sweep/skillsRemeasure.test.ts`.

## 1. The code owns every XP line

Every source below is a structured event from code (`playXpEarned`, `styleFought`, a training session), never the narrator. XP from play sits outside the pace window, as a fight's does (D-457), and takes the character's speed multiplier M (teachers, talent, age, state). Command and gunnery share combat's daily cap (12 XP before M per skill).

## 2. Gunnery and Repair

- **Gunnery** (technique): any weapon fired from a mount (a starfighter's guns and torpedoes, fired by the pilot; turrets; capital-ship batteries; vehicle guns; emplacements; the crew-served E-Web). Carried weapons, heavy ones included, stay with Blaster and the weapon proficiencies.
- **Repair** (technique): anything mechanical: ship, vehicle and droid maintenance and field repairs, restoring systems mid-fight, a burnt-out projector, recovery from an ion hit, weapon and armour condition; modifying and upgrading at higher levels. Slicing stays separate.
- **Activities:** the gunnery range and simulator (study load; Agility 0.3, Intelligence 0.2, the ruled weights) and repair and maintenance work (a mixed load 0.6 / 0.6; Intelligence 0.3). Teachers multiply as everywhere.
- **The stand-ins are gone:** `crewFromLevels` builds a figure's crew from Piloting, Gunnery and Repair; a turret gunner's level is Gunnery (`gunnerLevel`); the player's crew is `selectShipCrew`. Droid jobs roll on Repair (`REPAIR_SKILL`, was Intelligence).
- **A tool kit and parts:** the character's own droid jobs (not at a shop) need a tool kit (`toolKit` on the droids slice; 200 cr, game stat: the WEG droid and vehicle tool kits), bought with `trade` ("a tool kit"). Parts are the job's price as before. A reboot after an ion overload is a quick fix and needs neither.
- **Who trains them:** pilots train Gunnery with Piloting (the starfighter pilot's line); gunners and mechanics as their careers; the soldier (Gunnery 0.15, Repair 0.1), the smuggler (0.15 each) and the naval officer (Gunnery 0.2) take shares. Generated NPCs carry them through their archetype paces; the years-trained stop applies to them like any trained skill (D-506).

## 3. XP from play

| Source | Rule | Skills |
| --- | --- | --- |
| Social line | 0.6 x stakes; the n-th line of the day earns 1 / (1 + 0.5 (n - 1)). Logged by code when a rolled social exchange with an NPC is made (the check's difficulty is the stakes) or a relationship changes (|delta| 1 minor, 2 notable, 3 major) | Charisma |
| Persuasion | 1.0 x outcome (success 1.0, failure 0.25) x stakes x the challenge curve on the opponent's level (the higher of its Charisma and Willpower) less the persuader's Charisma. A rolled Charisma check in a dialogue with an NPC | Charisma |
| Command | 3 x stakes (combat's 0.5 / 1 / 1.5 / 2) x outcome (won 1, drawn 0.75, lost 0.5) x size (squad 1 to army or fleet 2.5); the daily cap. `commandXp` is what the fleet and ground battles will call (not wired into play yet) | Tactics, Intelligence 0.2 of it |
| Strikes | 0.05 x stakes per strike earned at +3 on the advantage track (not a surprise strike) | Tactics, Intelligence 0.2 |
| Discussing tactics | the `tacticsDiscussion` activity: with a teacher, the teacher's multiplier; with a peer, half the base rate (`peerRate`); never alone | Tactics, Intelligence 0.2 |
| Cultural insight | the `cultureStudy` activity (Intelligence 80+): Tactics as study, and the hours against that culture: +1 at 20 h, +2 at 100 h (at most +2), on fleet and ground rolls (`insight` on the side) | Tactics, Intelligence 0.4 |
| Gunnery | 0.08 per shot x the margin curve (-12: 0.4, 0: 1.0, +12: 1.2) x stakes; the daily cap | Gunnery |
| Repair | 0.5 per hour of the job x the challenge curve (the job's rating less the level) x success (failure 0.4) x 1.5 in a fight. Droid repairs and upgrades the character does itself | Repair |
| Field operations | 3 x stakes x outcome, as command, on the tradecraft split (Investigation 0.75, Stealth and Charisma 0.125) | Investigation, Stealth, Charisma |
| Stealth in the field | 0.5 x success (failure 0.5) x stakes x the challenge curve (the check's rating less the level). A rolled Stealth check | Stealth |

- **Melee and Blaster in the field** stay combat XP (the exchange's skill); unarmed fighting now uses Melee when it is higher than Agility (it used Agility always).
- **Deeds:** a battle won in command, an operation carried out and a serious or lethal fight won are deeds on a service record (`serviceDeedRecorded`), while in service.
- **Calibration:** a sociable adult (three logged lines on 300 days a year, one notable among two minor) has Charisma 30-40 by 30 from lines alone (tested). Diplomats: the politician's line is at 60-80 in mid-career (tested at 50).

## 4. New activities

| Activity | Load | Primary | Secondary weights | Open to |
| --- | --- | --- | --- | --- |
| Staff work (planning, logistics, intelligence analysis) | study | Intelligence | Tactics 0.5 | officers, naval officers, the intelligence lines, or anyone serving in an army, navy or intelligence branch |
| Negotiation and political work | study | Charisma | Intelligence 0.3 | anyone; win or lose |
| Hunting | physical | Stealth | Tracking (all of the share) | anyone |
| Tradecraft | study | Investigation | Stealth 0.3, Charisma 0.3 | the intelligence lines, or anyone in an intelligence branch |
| Gunnery range and simulator | study | Gunnery | Agility 0.3, Intelligence 0.2 | anyone |
| Repair and maintenance work | 0.6 / 0.6 | Repair | Intelligence 0.3 | anyone |
| Melee style training | physical | Melee | Strength 0.4, Agility 0.4, Endurance 0.2; and the style | a teacher or a recorded source to start (section 5) |
| Discussing tactics | study (casual) | Tactics | Intelligence 0.2 | a teacher or a partner present |
| Studying a culture's art and history | study | Tactics | Intelligence 0.4 | Intelligence 80+ |

- **The curricula:** the Jedi Padawan's session with the master carries a Melee weight of 0.1 (the Sith apprentice's session, `apprenticeTraining`, does not: the Sith take theirs once, as acolytes); the Korriban acolyte's two hours are a warblade class, Shii-Cho basics with a Melee weight of 0.2 (it counts as an Order sparring class like Shii-Cho basics).
- **Archetypes name their activities:** an officer's Intelligence by staff work, a politician's Charisma by negotiation, a field agent's Investigation by tradecraft (`activities` on the archetype; the routine's fill reads it).

## 5. Melee styles

- **One Melee skill does the work;** a style is a proficiency on top (0-100%), held per style (`styles` on the progression slice; `styles` on an NPC). 22 styles in one dated list, each tied to its culture.
- **A style must be trained:** a style-training session names its style (`styleId`). Starting one needs a teacher who teaches it or a recorded source of the art (`manual:echaniMilitary`, `manual:ktara`, `manual:mandalorian`, `holocron:terasKasi`; invented records). A teacher qualifies by holding the style at 50%+ (Teräs Käsi: 90%+, a graduate master), or by its culture (a species: Echani, Wookiee, Zabrak, Bothan, Chiss, Gand, Trandoshan; a faction: the Mandalorians). The rulings: the full Echani art only for Echani (outsiders learn the military version); Stava to outsiders only from 9 ABY; Wrruushi only for Wookiees, the Iridonian art for Zabraks, the Gand art for Gand; Matukai and the Bakuuni Hand need a Force connection; a style outside its years is refused. Once held, training alone and fighting grow it.
- **Growth** is fast next to skills: p = 1 - e^(-h / 108) over effective hours (session hours x the teacher's factor): about 75% at 150 hours, 99% at 500. A fight counts as 0.5 / 1 / 2 / 3 hours by stakes. **Higher Melee learns faster:** x(1 + 0.5 s(Melee / 100)), s a smoothstep: +50% at Melee 100.
- **Fading:** after 30 days unused, toward half the peak with a 730-day time constant (about 0.8 after a year, half after many); below the peak, practice regrows three times as fast.
- **The bonus:** up to +5 on the skill scale at 100% (linear), Teräs Käsi up to +10. No style costs nothing. **Stacking:** effective skill = skill x weapon proficiency factor + style bonus (`stackedSkill`; weapon proficiency is not built, so it is 1). A fighter uses the held style with the highest bonus that covers the weapon in hand: unarmed styles only unarmed, weapon styles only armed, `both` either; never with a saber or a blaster.
- **The edge:** each style has one situational edge from its lore, +1 on the roll it names from 50% proficiency (the proposals, for Jared):

| Style | Culture, dates | Weapons | Proposed edge |
| --- | --- | --- | --- |
| Teräs Käsi | Followers of Palawa; before 24,500 BBY on | unarmed | none beyond its own rules |
| the Echani art (full) | the Echani castes; c. 3,976 BBY on | both | reads the opponent: +1 on build-up rolls from the 3rd exchange |
| the Echani art (military) | special forces, the Sun Guard, the Royal Guard, Imperial Intelligence | both | the same |
| Stava | the Noghri; 19 BBY on, outsiders from 9 ABY | both | dodging bolts: +1 defence against a ranged attacker |
| K'tara | Alliance SpecForces; 2 BBY on | unarmed | the silent takedown: +1 on a surprise strike |
| K'thri | sporting events; Old Republic on | unarmed | fast and flashy: +1 on build-up in the first 3 exchanges |
| Wrruushi | Wookiees | unarmed | one blow disables: +1 on every strike roll |
| Hijkata | the Senate Guard; to 19 BBY | unarmed | deflect and counter: +1 defence against strikes |
| Mandalorian training | the Mandalorians; all eras | both | fighting armoured: +1 on every roll in medium or heavy armour or beskar |
| the Iridonian art | Iridonian Zabraks | unarmed | +1 on every roll unarmed against an armed foe |
| Broken Gate | Jedi of the Republic | unarmed | throws and joint locks: +1 unarmed against an armed foe |
| Tae-Jitsu | practised by Jedi; c. 44 BBY on | unarmed | balance: cancels 1 of bad footing |
| Verdanaian "sliding hands" | Verdanaia; before 33 BBY | unarmed | contact reading: as Echani |
| the Bakuuni Hand | some Jedi (Force) | unarmed | Force-strengthened blows: +1 on strikes |
| Matukai | the Matukai (Force); c. 4,000 BBY on | both | tireless: +1 on build-up from the 6th exchange |
| Tal-Gun | Xagobah; the Clone Wars | unarmed | a generic opening edge (no technique in the lore) |
| Jeswandi | the Bothans | unarmed | composure: +1 defence against strikes |
| the Forbelean Defense | the Chiss | unarmed | intercept and deflect: +1 defence against strikes |
| the Gand findsmen's art | Gand findsmen | unarmed | punches through armour: +1 on strikes |
| Thrar'kor | Trandoshans | armed | an opening edge (no detail in the lore) |
| Petranaki | Geonosian arenas; 22 BBY | armed | +1 on every roll against two or more |
| Darth Desolous's style | Pau'an; after c. 3,522 BBY | armed | the cortosis shield: +1 defence against a lightsaber |

- **Teräs Käsi (Jared):** no bonus against Force users. Up to +10 at 100%. Speed: +2 x proficiency on the build-up contest against a melee opponent. Strike power for the realistic damage rules (when built; `terasKasiStrike`): the share of a blaster pistol's class from 50% proficiency to all at 100%, and 50% of light and 25% of medium armour ignored at 100%. **Anticipation:** at 100% and Melee 81+ half the precognitive defence a Force user of that tier gets from Force Sense (min(0.5, Melee / 200), read at the fighter's Melee), at Melee 101+ all of it; against melee strikes only, never a surprise; it is no Force power (no Force load, works in a Force-null bubble); the higher of it and the fighter's own precognition applies, never both. Its power and speed come from RPG books and game guides: mechanics only, never narrator lore.
- **Not built:** game-derived powers (Matukai, Teräs Käsi meditation healing): possible perks later.
- **Duel tiers rule:** a non-Force fighter is below every tier (`duelTier`), so no style beats a top duelist (`canBeat`).

## 6. Training programmes

Dated programmes with entry rules and curriculum weights. While enrolled (`programmeEnrolled`), the routine's fill follows the curriculum; the programme ends on its day (its length in 368-day years) with its graduation line, or is left early (`programmeLeft`).

| Programme | Years | Length from | Entry |
| --- | --- | --- | --- |
| Carida's stormtrooper programme | 2 | lore | 16-30; 19 BBY-11 ABY |
| Carida's full course | 4 | lore | 16-26 |
| Flight school on Carida | 2 | lore | 16-28 |
| The Naval Academy, Prefsbelt IV | 3 | lore | 16-26; from shortly after 10,966 BBY |
| Raithal Academy | 1 | lore | 17-30; 19 BBY on |
| The Royal Guard academy (Yinchorr) | 1 | lore | 20-40; 19 BBY-11 ABY |
| The verd'goten | 5 (8 to 13) | lore | 8 |
| The hrrtayyk | 0.25 | invented span (the lore: about 12) | Wookiees 11-14 |
| Clone trooper training | 10 | lore | decanted; 32-19 BBY |
| Clone commando training | 10 | lore | 30-19 BBY |
| An officer academy | 3-4 (3.5) | Jared | 16-26 |
| A university | 4 | Jared | 16-60 |

Senatorial apprenticeships stay story-only.

## 7. Archetypes and careers

| Archetype | Focus (weights) | Start |
| --- | --- | --- |
| Officer | Tactics 1, Intelligence 0.6 (staff work), Charisma 0.5, Blaster 0.25, body 0.15 each | 18 (17-30) |
| Naval officer | the officer's line with Piloting 0.4 and Gunnery 0.2 | 18 |
| Intelligence officer: analyst | Intelligence 1 (staff work), Investigation 0.9 (tradecraft), Charisma 0.6, Blaster 0.35, Tactics 0.2, body 0.2 each | 18 (17-35) |
| Intelligence officer: field agent | Stealth 1, Charisma 0.8, Blaster 0.8, Melee 0.6, Investigation 0.5 (tradecraft), Intelligence 0.2, body 0.35 each | 18 |
| Senator or politician | Charisma 1 (negotiation), Intelligence 0.7, Investigation 0.15, Tactics 0.1, Blaster 0.05 | 18 (16-40) |
| Scholar | Intelligence 1, Investigation 0.6, Force Knowledge 0.2, Charisma 0.2, Medicine 0.1 | 16 (14-40) |
| Starfighter pilot | Piloting 1, Gunnery 0.8, body, Intelligence and Blaster small, Repair 0.2 | 18 |
| Ship gunner | Gunnery 1, Repair 0.3, Blaster 0.3, body | 18 |
| Engineer or mechanic | Repair 1, Intelligence 0.6, Piloting 0.2, small Gunnery and Blaster | 16 (12-35) |

- **Paces** are measured on the day loop (`npm run paces`; report section 4) and copied into `archetypes.ts`. The soldier's and smuggler's were re-measured with their new shares; the Jedi and Sith paces were scaled by the measured effect of the Melee weight (their tables are not verbatim loop copies since D-495); the Sith apprentice phase is unchanged.
- **The intelligence lines:** the analyst leads in Intelligence and Investigation, the field agent in Stealth, Melee and Blaster; both trail a line officer in Tactics. The service (the better of its two lines) is level or ahead of the officer on every other stat the officer trains; the field agent alone trails the officer in Intelligence (the analyst's job). A character can change lines (its archetype); an NPC is generated on one (role `official`: civilian 60%, analyst 25%, field agent 15%).
- **Generated NPCs by role:** officer 70% officer, 30% naval officer; pilot 70% starfighter pilot, 30% smuggler; politician and scholar their own.
- **A Senate seat** is a story event, not a rank: the politician archetype is generation and stat lines only.
- **Canon figures** on the new archetypes (report section 5 lists each and what moved): the Republic and Imperial commanders on officer or naval officer, the Chancellors, senators and ministers on politician, Imperial Intelligence and the SIS on the two intelligence lines. Their sheets set what they set; the archetype sets the rest.
- **Draft sheets** (`skillDrafts.ts`, for Jared's review, applied to nobody): Thrawn, Tarkin, Mon Mothma, Malavai Quinn, Ysanne and Armand Isard, Airen Cracken, Cipher Nine, Watcher Two; Gunnery anchors Wedge Antilles, a Rogue Squadron pilot, Han Solo and Chewbacca; Repair anchors Chewbacca, Bao-Dur, T3-M4, R2-D2.

## 8. Rank ladders

ranks.md section 3a. One dated list of faction branches (`SERVICE_LADDERS`): the Republic Army (lieutenant to general; Supreme Commander a story appointment), the Republic Navy (ensign to admiral), the SIS (field agent, handler, Bureau Chief, Director of SIS); the Sith Empire's Army (to general; Moff and Grand Moff appointments), Navy and Imperial Intelligence (Cipher agent, Watcher, Keeper, Minister of Intelligence); the Galactic Empire's (Grand Admiral an appointment), the Alliance's and the New Republic's.

| Rung | Years in the rung below | Skill (best of) | Deeds | Pay grade |
| --- | --- | --- | --- | --- |
| army: lieutenant / captain / major / colonel / general | 0 / 3 / 4 / 4 / 5 | Tactics 10 / 25 / 35 / 45 / 55 | 0 / 0 / 1 / 2 / 3 | lieutenant / captain / major / colonel / general |
| navy: ensign / lieutenant / captain / commodore / admiral | 0 / 2 / 5 / 5 / 5 | Tactics 10 / 20 / 35 / 48 / 58 | 0 / 0 / 1 / 2 / 3 | lieutenant / captain / colonel / general / general |
| intelligence: agent / handler / section chief / director | 0 / 4 / 5 / 6 | Intelligence, Investigation or Stealth 20 / 35 / 48 / 60 | 0 / 1 / 2 / 3 | lieutenant / captain / colonel / general |

Joining needs the first rung's minimum; a promotion is proposed by the AI or the player and applied by the engine when the years, the skill and the deeds hold; each rung sets the military pay (`militaryServiceSet`). A story-only rung is reached only by `serviceAppointed` (engine).

## 9. Not built here

The fleet and ground battles' calls to `commandXp` and `gunneryXp` (combat-scales has no turn loop yet); the realistic damage rules (Teräs Käsi's strike power waits for them); weapon proficiency (the stacking takes 1); field operations as a scene (the `fieldOp` source is ready); NPC style knowledge for canon figures (a teacher's art is named with `npcStyleSet`).

## 10. Every invented number

| Number | Where |
| --- | --- |
| Social line base 0.6, falloff 0.5 | `SOCIAL_LINE` |
| Stakes factors 0.5 / 1 / 1.5 / 2; the check difficulty as stakes | `STAKES_FACTOR`, `DIFFICULTY_STAKES` |
| Persuasion base 1.0 (the 1.0 / 0.25 are Jared's) | `PERSUASION` |
| Command base 3, drawn 0.75, sizes 1 to 2.5, daily cap 12 (the loss at half is Jared's) | `COMMAND` |
| Strikes 0.05 each | `STRIKE_TACTICS` |
| Insight +1 at 20 h, +2 at 100 h (the cap +2 and Intelligence 80 are Jared's) | `CULTURAL_INSIGHT` |
| Gunnery 0.08 a shot, margin curve 0.4 / 1.0 / 1.2 | `GUNNERY_SHOT` |
| Repair 0.5 an hour, failure 0.4, in a fight x1.5; upgrade hours 2 / 6 / 6 | `REPAIR_JOB`, `UPGRADE_HOURS` |
| Field operations base 3, the split 0.75 / 0.125 / 0.125 | `FIELD_OP` |
| Stealth use base 0.5, failure 0.5 | `STEALTH_USE` |
| Repair work load 0.6 / 0.6 | `REPAIR_LOAD` |
| The Melee weights: the Padawan session 0.1, the warblade class 0.2 | `padawanTraining`, `warbladeTraining` |
| Style training secondaries 0.4 / 0.4 / 0.2; culture study Intelligence 0.4; discussion Intelligence 0.2 | `ACTIVITIES` |
| Style bonus linear in proficiency; edge +1 from 50%; teaching from 50% (Teräs Käsi 90%) | `STYLE` |
| Growth H = 108 h; fight hours 0.5 / 1 / 2 / 3; the smoothstep shape of the Melee speed-up (the +50% is Jared's) | `STYLE` |
| Fading: 30 days' grace, floor 0.5 of the peak, 730 days; regrowth x3 | `STYLE.fade`, `STYLE.regrowFactor` |
| Teräs Käsi: speed scaled by proficiency; pistol share from 50%; armour 50% / 25% (the +10, +2, 100% / 81 / 101 and half / full are Jared's) | `TERAS_KASI` |
| Every style's edge (a proposal) and the edges' values | `MARTIAL_STYLES` |
| Style years inferred: Tae-Jitsu c. 44 BBY | `MARTIAL_STYLES` |
| The four style records and their teaching levels | `trainingRecords.ts` |
| Tool kit: the 200 cr is a game stat; that it gates the character's own jobs is the ruling | `TOOL_KIT` |
| Programme curricula, entry ages, the hrrtayyk's 0.25 years, the officer academy's 3.5 (Jared's 3-4) | `TRAINING_PROGRAMMES` |
| The ladders' years, skill minimums, deeds and pay grades; the factions' years where inferred | `SERVICE_LADDERS` |
| Every new archetype's weights, start ages and activity choices; the soldier's and smuggler's new shares | `ARCHETYPES` |
| Generated NPC roles: officer 0.7 / 0.3; pilot 0.7 / 0.3; official 0.6 / 0.25 / 0.15 | `ROLE_ARCHETYPES` |
| Loadouts of the new archetypes | `LOADOUT_BY_ARCHETYPE` |
| Every number in the draft sheets marked `draft` | `SKILL_DRAFTS` |

From lore or Jared, not invented: the skill scopes, the secondary weights of Gunnery and Repair, the programme lengths, the ladder titles, the persuasion and loss factors, the 0.2 Intelligence share, the half rate with a peer, the insight cap, Teräs Käsi's numbers, the who-teaches-outsiders rulings.

## 11. Tests

`tests/m8/skills.test.ts`: Gunnery for mounted weapons and Blaster for carried; Repair repairs and upgrades droids, needs a tool kit and pays parts; each XP source as set (social lines with the day's falloff and the 30-40 target, persuasion 1.0 / 0.25, command with losses at half and the cap, strikes, discussion, cultural insight only at 80+ and its cap, the 0.2 Intelligence share); each new activity trains its skills and the service gates; styles (no start without a teacher or source, Melee XP, at most +5 and Teräs Käsi +10, fading to half, faster with Melee, stacking); Teräs Käsi's anticipation (100% and 81+, doubled at 101+, never stacked); duel tiers; the programmes' lengths, entry and graduation; each archetype leading in its focus, the officer's order, the two intelligence lines; the ladders and promotion through the game.
