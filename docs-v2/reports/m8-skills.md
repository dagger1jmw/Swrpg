# m8-skills: non-Force skill XP, Gunnery and Repair, melee styles, archetypes and ranks (2026-11-26)

Decision D-513. Spec: docs-v2/spec/skills-m8.md (linked from the design notes; every invented number is in its section 10, and repeated in section 9 here). Checklist items 10 and 12 ticked; item 16 confirmed as "Starting traits and formative events" (item 15 is the calibration queue).

## 1. What was built

- **Gunnery and Repair** are skills (technique). The combat-scales stand-ins are gone: a crew is built from Piloting, Gunnery and Repair (`crewFromLevels`, `selectShipCrew`), and a turret gunner fires on Gunnery. Droid jobs roll on Repair, and the character's own jobs need a tool kit (200 cr, game stat; `trade` "a tool kit"). Parts are paid as before; an ion reboot needs nothing.
- **XP from play**, all from code lines: social lines (a rolled social check with an NPC, or a relationship change; later lines the same day earn less), persuasion (a Charisma roll in a dialogue: 1.0 / 0.25), command (`commandXp`: stakes x outcome x size, a loss at half), strikes earned at +3, discussing tactics (teacher multiplier, or half rate with a peer), cultural insight (Intelligence 80+), the 0.2 Intelligence share of field Tactics, gunnery shots, repairs, field operations and Stealth rolls.
- **New activities:** staff work, negotiation, hunting, tradecraft, the gunnery range, repair work, style training, discussing tactics, culture study. The Jedi Padawan session gets a Melee weight of 0.1. The Korriban acolyte's 2 h block is now a warblade class (Shii-Cho basics plus Melee 0.2). The Sith apprentice has its own session without the weight (see the readings).
- **Melee styles:** 22 dated styles tied to their cultures, with proficiency, teacher or source gates, growth faster with Melee, fading, +5 (Teräs Käsi +10), one edge each, stacking, and Teräs Käsi's speed, strike power and anticipation. Duel tiers still rule.
- **Programmes:** 12 dated programmes with entry rules and curricula. The routine follows the curriculum while enrolled; each ends on its day with its graduation line.
- **Archetypes:** officer, naval officer, the analyst and field-agent intelligence lines, politician, scholar, starfighter pilot, ship gunner and engineer. Their paces were measured on the day loop. Soldier and smuggler now take Gunnery and Repair shares. Archetypes can name their fill activity (an officer's Intelligence comes from staff work).
- **Rank ladders:** 15 dated faction branches with the lore's titles. Promotion takes years, a skill minimum and recorded deeds, and sets the military pay.
- **35 canon figures moved to the new archetypes** (section 5), and 16 draft sheets written for review (section 6).

### Readings of the brief (please check)

- **"Ahead of a line officer on most stats, behind only on Tactics":** tested as follows. Both intelligence lines trail the officer in Tactics. On every other stat the officer trains, the better of the two lines is level or ahead. The field agent alone trails the officer in Intelligence: a field agent who matched an officer's Intelligence would be an analyst.
- **Unarmed fighting** used Agility always. Melee covers unarmed (skills spec §2), so an unarmed fighter now fights on Melee when it is higher than Agility; otherwise on Agility as before. This is how Teräs Käsi reaches a fight.
- **Social lines** are logged by code on a rolled social check with an NPC and on a relationship change. A Charisma roll counts as a persuasion instead of a line, so it isn't counted twice.
- **Padawans and acolytes, not apprentices:** at first the Sith apprentice used the Padawan session too, so the Sith paid the Melee weight twice. Their Lord-minimum Force Sense then fell to 39.8 against 40 in the lifetime gate. The brief names Padawans and acolytes, so apprentices now have `apprenticeTraining` without the weight. Force Sense is back to 40.5.
- **The Jedi and Sith pace tables** are not verbatim copies of today's loop (since D-495, Force Sense comes with Force Control on the loop, and a verbatim copy would double it for Sith). So I measured the Force archetypes with and without the Melee weight and applied the ratio. Jedi Padawan Force Control goes about −3% and Willpower −1.4%. Jedi Padawans gain a Melee pace of 0.052, Sith acolytes 0.06; the Sith apprentice phase is unchanged.
- **Re-archetyping canon figures** was not explicitly asked for; it follows from item 10 ("today officers use the soldier archetype"). Each is one field in the roster, listed in section 5, easy to revert.
- **The social-line base** is 0.6. At 0.4 the sociable adult (three logged lines on 300 days a year) reached only Charisma 25.7 by 30.

## 2. The proposed style edges (for Jared)

Each is +1 on the roll named, from 50% proficiency. Every edge and its value is invented.

| Style | Edge | From the lore |
| --- | --- | --- |
| Teräs Käsi | none beyond its own rules | made to fight Jedi; no in-fight edge for it (Jared) |
| Echani (full and military) | +1 build-up from the 3rd exchange | reading the opponent |
| Stava | +1 defence against a ranged attacker | Noghri dodge bolts |
| K'tara | +1 on a surprise strike | most damage, least noise |
| K'thri | +1 build-up in the first 3 exchanges | fast, flashy, inefficient later |
| Wrruushi | +1 on every strike roll | disables with one blow |
| Hijkata | +1 defence against strikes | deflect and counter |
| Mandalorian training | +1 on every roll in medium/heavy armour or beskar | fighting armoured with mixed weapons |
| Iridonian art | +1 unarmed against an armed foe | highly physical |
| Broken Gate | +1 unarmed against an armed foe | throws, joint locks |
| Tae-Jitsu | cancels 1 of bad footing | balance matters |
| Verdanaian sliding hands | as Echani | reads by contact |
| Bakuuni Hand | +1 on strikes | Force-strengthened blows |
| Matukai | +1 build-up from the 6th exchange | tireless exertion |
| Tal-Gun, Thrar'kor | +1 build-up in the first 3 exchanges | no technique in the lore: generic |
| Jeswandi, Forbelean Defense | +1 defence against strikes | composure; intercept and deflect |
| Gand findsmen's art | +1 on strikes | punched through stormtrooper armour |
| Petranaki | +1 on every roll against two or more | arena art |
| Darth Desolous's style | +1 defence against a lightsaber | cortosis shield |

**Teräs Käsi as built:**
- Up to +10 at 100%.
- Speed: +2 × proficiency on the build-up contest against a melee foe.
- Strike power, for when realistic damage is built: blaster-pistol class from 50% proficiency, all of it at 100%; ignores 50% of light and 25% of medium armour at 100%.
- Anticipation: half the Force Sense precognition of a user at the fighter's Melee (Melee 81+, 100%), the full amount at 101+. Melee strikes only, no Force load, never stacked with the fighter's own precognition (the higher applies).

## 3. Audit: what trains Melee, Blaster and Stealth

| Skill | Before this run | Added now |
| --- | --- | --- |
| Melee | melee drills; combat exchanges with a melee weapon (unarmed went to Agility); archetype fills (warrior, Vong, Mandalorian 0.6, bounty hunter 0.5) | unarmed fights on Melee when it is higher; style training; the Padawan session (0.1) and the warblade class (0.2); the field agent (0.6); programmes (Carida, Royal Guard, verd'goten, commandos) |
| Blaster | the blaster range; combat exchanges with a ranged weapon; archetype fills | the officer and intelligence lines, the pilot and gunner lines; programmes |
| Stealth | stealth practice; the Sentinel's and sniper's fills. Nothing in play: the ambush contest, blockade runs and holds read Stealth but paid no XP | Stealth rolls in play (field use); hunting; tradecraft (0.3); the field agent's main; field operations (0.125) |

Still no XP: the ambush contest reads only the NPC's Stealth, and blockade runs and holds read the player's without paying any (not changed).

## 4. Archetype paces (measured on the day loop, `npm run paces`)

Knight-phase paces (careers have one phase), with the main specialty's loop level at 25 years. Two runs: 315 s (all 21 archetypes) and 249 s (the Force archetypes without the Melee weight, plus the careers re-weighted).

| Archetype | Main at 25 y | Paces (0.06 and up) |
| --- | --- | --- |
| officer | 67.1 | tactics 1.662, intelligence 0.969, willpower 0.693, charisma 0.281, blaster 0.202, endurance 0.174, agility 0.172, strength 0.148 |
| navalOfficer | 63.1 | tactics 1.575, intelligence 0.894, willpower 0.786, charisma 0.188, piloting 0.17, agility 0.134, blaster 0.106, endurance 0.106, strength 0.092, gunnery 0.079 |
| intelAnalyst | 64.9 | intelligence 1.584, willpower 0.625, tactics 0.567, investigation 0.403, charisma 0.286, blaster 0.197, endurance 0.163, agility 0.162, strength 0.139, stealth 0.067 |
| intelAgent | 62.6 | stealth 1.53, agility 0.506, willpower 0.47, charisma 0.428, blaster 0.251, investigation 0.243, melee 0.188, endurance 0.181, intelligence 0.173, strength 0.166 |
| politician | 60.9 | charisma 1.49, intelligence 1.205, willpower 1.168, forceKnowledge 0.223, investigation 0.108, tactics 0.069, blaster 0.061 |
| scholar | 61.7 | intelligence 1.552, willpower 1.118, forceKnowledge 0.601, investigation 0.56, charisma 0.192, medicine 0.069 |
| starfighterPilot | 63.6 | piloting 1.617, willpower 0.688, agility 0.544, intelligence 0.534, gunnery 0.499, endurance 0.196, blaster 0.152, repair 0.138, strength 0.07 |
| shipGunner | 67.0 | gunnery 1.677, agility 0.67, intelligence 0.347, endurance 0.309, willpower 0.296, blaster 0.293, repair 0.282, strength 0.265, tactics 0.088 |
| engineer | 61.3 | repair 1.484, intelligence 0.983, willpower 0.481, strength 0.22, endurance 0.172, forceKnowledge 0.152, piloting 0.119, blaster 0.11, agility 0.066, gunnery 0.065 |
| soldier | 60.4 | blaster 1.475, agility 0.617, willpower 0.58, tactics 0.426, endurance 0.382, strength 0.313, intelligence 0.171, gunnery 0.108 |
| smuggler | 59.6 | piloting 1.474, willpower 0.905, blaster 0.6, intelligence 0.413, charisma 0.339, agility 0.311, repair 0.122, gunnery 0.068 |

- **Soldier:** Blaster unchanged (1.477 to 1.475). Tactics 0.465 to 0.426, Agility 0.683 to 0.617, Endurance 0.448 to 0.382, Strength 0.372 to 0.313 (the shares now include Gunnery 0.15 and Repair 0.1).
- **Smuggler:** Blaster 0.755 to 0.600 and Charisma 0.375 to 0.339, with Gunnery 0.15 and Repair 0.15 (at 0.3 each Blaster fell to 0.503, so I halved them).
- **Jedi and Sith:**
  - Jedi Padawan Force Control: Guardian 1.252 to 1.218, Consular 1.119 to 1.084, Sentinel 1.216 to 1.182. Willpower about −1.4%; Melee pace 0.052.
  - Sith acolytes: Force Control about −2%, Strength, Agility and Endurance about −15% (the warblade's Melee weight takes from the drill's secondaries); Melee pace 0.06. Apprentice phase unchanged.

## 5. Canon figures that move more than 5

Run before any change and after (`tests/sweep/skillsRemeasure.test.ts`, at each anchor date, or at lived age 45 for a figure without a sheet). 145 figure-dates move more than 5 on Intelligence, Tactics, Charisma, Melee, Blaster, Stealth, Gunnery or Repair. Grouped first:

- **Force users gain Melee** from the Padawan session or the warblade class: about 5 to 12 (Sith Warriors 40, Guardians 28, Inquisitors 12, Consulars 7, Sentinels 2 figure-dates).
- **Soldiers and smugglers** gain Gunnery and Repair (about 6 to 12). Smugglers lose Blaster (8 figures, about −6 to −9).
- **The 35 re-archetyped figures:**
  - Officers gain Intelligence, Tactics and Charisma and lose Blaster, where their sheet leaves those to the line.
  - Politicians gain Charisma and Intelligence.
  - The intelligence figures move toward their line.

No Force user's Force Control moves more than 0.5; the re-archetyped non-Force figures move under 5 on it.

**The 35 archetype changes:**
- **Officer:** Jace Malcom, Rans, Stantorrs, Harron Tavus, Var Suthra, Elin Garza, Korvan, Fideltin Rusk, Zellos, Broysc, Tarrick, Malavai Quinn (was smuggler).
- **Naval officer:** Rycus Kilran, Layek Davos.
- **Politician:** Saresh, Berooken, Paran Am-Ris, Janarus, the Panteers, Jebevel Madon, Galena Rans, Shareis, Shullis Khamarr.
- **Field agent:** Cipher Nine, Theron Shan, Cipher Twelve, Ula Vii, Hunter.
- **Analyst:** Marcus Trant, Keeper, Shara Jenn, Watcher X, Fixer Seven.
- **Engineer:** Tharan Cedrax. **Scholar:** Holiday.

Every row (before → after):

| Figure | Archetype | Date (BBY) | Moves |
| --- | --- | --- | --- |
| Vitiate | sithInquisitor | 3660 | melee 0 → 6.5 |
| Scourge | sithWarrior | 3660 | melee 0 → 6.6 |
| Darth Marr | sithWarrior | 3640 | melee 0 → 6.6 |
| Darth Baras | sithInquisitor | 3643 | melee 0 → 6.5 |
| Darth Angral | sithWarrior | 3643 | melee 0 → 6.6 |
| Darth Jadus | sithInquisitor | 3643 | melee 0 → 6.5 |
| Dread Masters | sithInquisitor | 3660 | melee 0 → 6.5 |
| Darth Vindican | sithWarrior | 3681 | melee 0 → 6.6 |
| Darth Vowrawn | sithInquisitor | 3645 | melee 0 → 6.5 |
| Darth Zash | sithInquisitor | 3645 | melee 0 → 6.5 |
| Darth Mekhis | sithInquisitor | 3645 | melee 0 → 6.5 |
| Darth Acina | sithInquisitor | 3645 | melee 0 → 6.5 |
| Exal Kressh | sithInquisitor | 3678 | melee 0 → 6.5 |
| Rycus Kilran | soldier → navalOfficer | 3653 | intelligence 24.1 → 86; blaster 57.2 → 12.3; gunnery 0 → 10.4 |
| Zym | jediConsular | 3660 | melee 0 → 6.1 |
| Kao Cen Darach | jediGuardian | 3681 | melee 0 → 6.1 |
| Satele Shan | jediGuardian | 3643 | melee 0 → 5.2 |
| Orgus Din | jediGuardian | 3643 | melee 0 → 6.1 |
| Dar'Nala | jediConsular | 3655 | melee 0 → 6.1 |
| Ngani Zho | jediConsular | 3660 | melee 0 → 6.1 |
| Gnost-Dural | jediConsular | 3655 | melee 0 → 6.1 |
| Ven Zallow | jediGuardian | 3655 | melee 0 → 6.1 |
| Jaric Kaedan | jediGuardian | 3668 | melee 0 → 6.1 |
| Tol Braga | jediConsular | 3655 | melee 0 → 6.1 |
| Syo Bakarn | jediConsular | 3650 | melee 0 → 6.1 |
| Bela Kiwiiks | jediSentinel | 3650 | melee 0 → 6.1 |
| Revan | jediGuardian | 3640 | melee 0 → 6.1 |
| Jace Malcom | soldier → officer | 3643 | intelligence 30 → 80; tactics 41.8 → 85.3 |
| Leontyne Saresh | civilian → politician | 3643 | tactics 0 → 13.6; charisma 71.2 → 83.3; blaster 0 → 12.4 |
| Aric Jorgan | soldier | 3643 | gunnery 0 → 9.6; repair 0 → 5.8 |
| Theron Shan | soldier → intelAgent | 3640 | intelligence 20 → 86; tactics 17.8 → 0; melee 0 → 10; stealth 0 → 78 |
| Hero of Tython | jediGuardian | 3637 | melee 0 → 5.2 |
| The Barsen'thor | jediConsular | 3637 | melee 0 → 5.5 |
| Emperor's Wrath | sithWarrior | 3637 | melee 0 → 6.6 |
| Darth Nox | sithInquisitor | 3637 | melee 0 → 7.6 |
| Cipher Nine | soldier → intelAgent | 3640 | intelligence 20.8 → 90; tactics 22 → 0; melee 0 → 12.5; stealth 0 → 41.6 |
| Voidhound | smuggler | 3640 | gunnery 0 → 8; repair 0 → 11.1 |
| Meteor | soldier | 3640 | gunnery 0 → 10.4; repair 0 → 6.3 |
| Kira Carsen | jediGuardian | 3637 | melee 0 → 5.2 |
| Aryn Leneer | jediGuardian | 3641 | melee 0 → 6.6 |
| Fortris Gall | jediGuardian | 3623 | melee 0 → 7.1 |
| Nomen Karr | jediGuardian | 3655 | melee 0 → 6.6 |
| Warren Sedoru | jediGuardian | 3666 | melee 0 → 5.6 |
| Ardun Kothe | jediGuardian | 3651 | melee 0 → 6.9 |
| Belth Allusis | jediGuardian | 3671 | melee 0 → 6.6 |
| Oteg | jediGuardian | 3642 | melee 0 → 6.1 |
| Shol Bestros | jediGuardian | 3667 | melee 0 → 5.9 |
| Jerbhen Hulis | jediGuardian | 3673 | melee 0 → 6.5 |
| Wyellett | jediGuardian | 3661 | melee 0 → 5.5 |
| Xerender | jediGuardian | 3641 | melee 0 → 6.1 |
| Bengel Morr | jediGuardian | 3625 | melee 0 → 5.9 |
| Tasiele Shan | jediGuardian | 3679 | melee 0 → 6.4 |
| Kellian Jarro | jediGuardian | 3648 | melee 0 → 5.6 |
| Yuon Par | jediGuardian | 3641 | melee 0 → 5.8 |
| Leeha Narezz | jediGuardian | 3633 | melee 0 → 6.1 |
| Aurei Eadon | jediGuardian | 3659 | melee 0 → 5.6 |
| Ako Domi | jediSentinel | 3631 | melee 0 → 6.4 |
| Nadia Grell | jediGuardian | 3619 | melee 0 → 6.4 |
| Ashara Zavros | jediGuardian | 3617 | melee 0 → 5.6 |
| Meetra Surik | jediGuardian | 3950 | melee 0 → 6.3 |
| Darth Ekkage | sithWarrior | 3655 | melee 0 → 6.6 |
| Darth Vengean | sithWarrior | 3650 | melee 0 → 7 |
| Darth Azamin | sithWarrior | 3655 | melee 0 → 6.5 |
| Darth Decimus | sithWarrior | 3653 | melee 0 → 6.2 |
| Darth Ravage | sithWarrior | 3645 | melee 0 → 6.3 |
| Darth Mortis | sithWarrior | 3645 | melee 0 → 7.5 |
| Darth Rictus | sithInquisitor | 3680 | melee 0 → 6.9 |
| Darth Hadra | sithInquisitor | 3643 | melee 0 → 6.7 |
| Darth Arkous | sithWarrior | 3640 | melee 0 → 6.8 |
| Darth Arho | sithWarrior | 3640 | melee 0 → 5.7 |
| Darth Ikoral | sithWarrior | 3712 | melee 0 → 6.2 |
| Raptus | sithWarrior | 3664 | melee 0 → 6.6 |
| Bestia | sithWarrior | 3664 | melee 0 → 6.2 |
| Brontes | sithWarrior | 3664 | melee 0 → 6.6 |
| Calphayus | sithWarrior | 3664 | melee 0 → 6.9 |
| Styrak | sithWarrior | 3664 | melee 0 → 6.7 |
| Tyrans | sithWarrior | 3664 | melee 0 → 6.5 |
| Tarnis | sithWarrior | 3643 | melee 0 → 6.2 |
| Praven | sithWarrior | 3628 | melee 0 → 7.3 |
| Adraas | sithWarrior | 3653 | melee 0 → 6.8 |
| Darth Venemal | sithWarrior | 3660 | melee 0 → 7.3 |
| Darth Lachris | sithWarrior | 3642 | melee 0 → 6.8 |
| Calypho | sithWarrior | 3681 | melee 0 → 5.9 |
| Darth Skotia | sithWarrior | 3643 | melee 0 → 6.7 |
| Nefarid | sithWarrior | 3643 | melee 0 → 7 |
| Darth Vich | sithWarrior | 3681 | melee 0 → 6.7 |
| Darth Gravus | sithWarrior | 3640 | melee 0 → 6.6 |
| Darth Charnus | sithWarrior | 3638 | melee 0 → 6.8 |
| Darth Serevin | sithWarrior | 3640 | melee 0 → 6.2 |
| Darth Tormen | sithWarrior | 3640 | melee 0 → 6.9 |
| Harkun | sithWarrior | 3645 | melee 0 → 5.4 |
| Spindrall | sithWarrior | 3678 | melee 0 → 6.2 |
| Tremel | sithWarrior | 3671 | melee 0 → 5.5 |
| Ffon Althe | sithWarrior | 3643 | melee 0 → 6.3 |
| Grathan | sithWarrior | 3628 | melee 0 → 7 |
| Xalek | sithWarrior | 3620 | melee 0 → 6.4 |
| Lana Beniko | sithWarrior | 3627 | melee 0 → 5.1 |
| Berooken | civilian → politician | 3661 | intelligence 53.6 → 62.5; tactics 0 → 12.2; charisma 27 → 63; blaster 0 → 10.4 |
| Paran Am-Ris | civilian → politician | 3661 | intelligence 53.3 → 62.6; tactics 0 → 12.1; charisma 30.6 → 74.5; blaster 0 → 10.2 |
| Dorian Janarus | civilian → politician | 3661 | intelligence 56.4 → 65.7; tactics 0 → 11.4; charisma 30 → 72.3; blaster 0 → 9.8 |
| Silara Panteer and Gaul Panteer | civilian → politician | 3667 | intelligence 51.7 → 60; tactics 0 → 10.7; charisma 28.1 → 66.6; blaster 0 → 9.9 |
| Jebevel Madon | civilian → politician | 3632 | intelligence 49.4 → 57.4; tactics 0 → 9.4; charisma 27.9 → 65.8; blaster 0 → 11.2 |
| Galena Rans | soldier → politician | 3640 | intelligence 24.6 → 55.1; tactics 33.5 → 11; charisma 14 → 60.6; blaster 67 → 10.6 |
| Elin Garza | soldier → officer | 3651 | intelligence 26.6 → 56.6; tactics 33.4 → 67.8; charisma 14 → 27.8; blaster 68.9 → 21.6 |
| Marcus Trant | smuggler → intelAnalyst | 3661 | intelligence 32.8 → 63.4; tactics 0 → 38; blaster 41.5 → 18.9; stealth 0 → 12.6 |
| Rans | soldier → officer | 3658 | intelligence 25.3 → 51.9; tactics 36.6 → 74.2; charisma 14 → 29.5; blaster 68.4 → 21.5 |
| Stantorrs | soldier → officer | 3661 | intelligence 25.8 → 53.4; tactics 31.3 → 63.9; charisma 14.2 → 32; blaster 67.1 → 21.2 |
| Harron Tavus | soldier → officer | 3635 | intelligence 27.2 → 58.3; tactics 35.5 → 72.1; charisma 14 → 32.5; blaster 66.5 → 20.9 |
| Var Suthra | soldier → officer | 3650 | intelligence 26.7 → 57; tactics 30.8 → 62.4; charisma 14 → 30.6; blaster 69.1 → 21.7 |
| Zeerid Korr | soldier | 3645 | gunnery 0 → 14.4; repair 0 → 8.3 |
| Nico Okarr | smuggler | 3661 | gunnery 0 → 5.7; repair 0 → 8.9 |
| Elara Dorne | soldier | 3624 | gunnery 0 → 14.7; repair 0 → 9.3 |
| Tanno Vik | soldier | 3631 | gunnery 0 → 15.5; repair 0 → 8.9 |
| Yuun | soldier | 3625 | gunnery 0 → 14.4; repair 0 → 8.4 |
| Fideltin Rusk | soldier → officer | 3635 | intelligence 26.1 → 54.8; tactics 35.5 → 72; charisma 14 → 29.6; blaster 70.2 → 22 |
| "Doc" | soldier | 3625 | gunnery 0 → 16.1; repair 0 → 8.2 |
| Tharan Cedrax | civilian → engineer | 3627 | charisma 28.8 → 14; blaster 0 → 14.4; gunnery 0 → 11.8; repair 0 → 71.6 |
| Holiday | civilian → scholar | 3605 | intelligence 50.9 → 69.9 |
| Felix Iresso | soldier | 3628 | gunnery 0 → 13.9; repair 0 → 9.9 |
| Korvan | soldier → officer | 3645 | intelligence 25.3 → 51.9; tactics 32.1 → 65; charisma 14 → 29.6; blaster 60.8 → 19.1 |
| Vasil Dorne | smuggler | 3658 | blaster 44.7 → 39.2; gunnery 0 → 12.4; repair 0 → 15 |
| Zellos | soldier → officer | 3666 | intelligence 26.8 → 57; tactics 34.7 → 70.5; charisma 14 → 32.5; blaster 63.2 → 19.8 |
| Shareis | smuggler → politician | 3660 | intelligence 35.2 → 60.3; tactics 0 → 10.5; charisma 38.2 → 76.2; blaster 48.5 → 11.3 |
| Shullis Khamarr | smuggler → politician | 3660 | intelligence 35 → 59.7; tactics 0 → 10.4; charisma 34.1 → 66.6; blaster 46 → 10.7 |
| Layek Davos | soldier → navalOfficer | 3645 | intelligence 26 → 52.3; tactics 31.6 → 62.1; charisma 14 → 25.1; blaster 68 → 14.8; gunnery 0 → 13.3 |
| Broysc | soldier → officer | 3650 | intelligence 26.3 → 55.4; tactics 36 → 73.1; charisma 14 → 31; blaster 70.1 → 22 |
| Tarrick | soldier → officer | 3655 | intelligence 28 → 61.3; tactics 35 → 71; charisma 14 → 29.9; blaster 67.3 → 21.1 |
| Keeper | smuggler → intelAnalyst | 3645 | intelligence 38.3 → 77.1; tactics 0 → 39.1; blaster 43.6 → 19.8; stealth 0 → 11.1 |
| Shara Jenn | smuggler → intelAnalyst | 3635 | intelligence 39.3 → 79.5; tactics 0 → 35.2; blaster 42.2 → 19.2; stealth 0 → 11.2 |
| Watcher X | civilian → intelAnalyst | 3640 | intelligence 54.6 → 73.3; tactics 0 → 40; blaster 0 → 22.6; stealth 0 → 12.3 |
| Fixer Seven | civilian → intelAnalyst | 3644 | intelligence 61.5 → 83.2; tactics 0 → 41.5; blaster 0 → 21.8; stealth 0 → 11.6 |
| Cipher Twelve | smuggler → intelAgent | 3672 | intelligence 26.6 → 21.3; melee 0 → 13; blaster 34.5 → 17.7; stealth 0 → 44.4 |
| Ula Vii | smuggler → intelAgent | 3623 | intelligence 36.6 → 27.2; melee 0 → 21.6; blaster 42.9 → 22.4; stealth 0 → 60.6 |
| Hunter | smuggler → intelAgent | 3640 | intelligence 25.9 → 20.8; melee 0 → 13.1; blaster 27.1 → 13.8; stealth 0 → 43.6 |
| Malavai Quinn | smuggler → officer | 3635 | intelligence 35.9 → 55.3; tactics 0 → 65.1; blaster 45.9 → 21.1 |
| Pierce | soldier | 3626 | gunnery 0 → 14.2; repair 0 → 8.2 |
| Kaliyo Djannis | smuggler | 3627 | blaster 48.3 → 42.4; gunnery 0 → 10.8; repair 0 → 16.7 |
| Eckard "Fixer Fifteen" Lokin | smuggler | 3662 | blaster 43.3 → 38; gunnery 0 → 11; repair 0 → 15.5 |
| Vector Hyllus | smuggler | 3624 | blaster 42.3 → 37.1; gunnery 0 → 12.6; repair 0 → 15.1 |
| Raina Temple | smuggler | 3621 | blaster 43.7 → 38.3; gunnery 0 → 10.9; repair 0 → 14.6 |
| Talos Drellik | soldier | 3624 | gunnery 0 → 15.6; repair 0 → 9.6 |
| Andronikos Revel | soldier | 3633 | gunnery 0 → 14.6; repair 0 → 8.2 |
| Nok Drayen | smuggler | 3651 | blaster 48.4 → 42.4; gunnery 0 → 12; repair 0 → 16.4 |
| Hylo Visz | smuggler | 3638 | blaster 41.3 → 36.2; gunnery 0 → 11.6; repair 0 → 16 |
| Zale Barrows | smuggler | 3641 | blaster 47.5 → 41.7; gunnery 0 → 12; repair 0 → 14.8 |

## 6. Draft sheets for review (not applied)

`src/data/canon/skillDrafts.ts`. Authored values come from the lore sheets (sheet scale); every other value is a draft from the figure's lore.

| Figure | Year | Archetype | Authored | Draft |
| --- | --- | --- | --- | --- |
| Thrawn | 9 ABY | naval officer | Int 112, Cha 88, WP 92, Tactics 90 | Piloting 40, Gunnery 30, Blaster 35, Investigation 70 |
| Tarkin | 0 | naval officer | Int 84, Cha 80, WP 84, Tactics 60 | Blaster 30, Piloting 25, Investigation 40 |
| Mon Mothma | 0 | politician | Int 88, Cha 86, WP 86 | Tactics 20, Investigation 35, Blaster 5 |
| Malavai Quinn | 3,640 BBY | officer | none | Tactics 58, Int 60, Cha 40, Blaster 45, Medicine 40 |
| Ysanne Isard | 7 ABY | analyst | none | Int 85, Inv 78, Cha 60, Tactics 55, Blaster 35 |
| Armand Isard | 5 BBY | analyst | none | Int 80, Inv 75, Cha 55, Tactics 45, Blaster 30 |
| Airen Cracken | 4 ABY | field agent | none | Stealth 70, Inv 75, Int 75, Cha 60, Blaster 60, Melee 45, Tactics 55 |
| Cipher Nine | 3,640 BBY | field agent | Int 90, Cha 82, WP 88, Blaster 84, Stealth 84 | Melee 70, Inv 72, Tactics 35 |
| Watcher Two (Shara Jenn) | 3,642 BBY | analyst | none | Int 80, Inv 75, Cha 55, Tactics 40, Blaster 30 |
| Wedge Antilles | 4 ABY | pilot | Int 80, Cha 74, WP 82, Piloting 88 | Gunnery 86, Tactics 50, Repair 35, Blaster 50 |
| a Rogue Squadron pilot | 7 ABY | pilot | none | Piloting 75, Gunnery 72, Repair 30, Blaster 40 |
| Han Solo | 0 | smuggler | Int 84, Cha 86, Piloting 82, Blaster 82 | Gunnery 75, Repair 60 |
| Chewbacca | 0 | smuggler | Int 76, Melee 84, Blaster 84 | Repair 80, Gunnery 75, Piloting 70 |
| Bao-Dur | 3,951 BBY | engineer | Int 88 | Repair 90 |
| T3-M4 | 3,956 BBY | droid | none | Repair 75 |
| R2-D2 | 0 | droid | none | Repair 85 |

Cipher Nine and Shara Jenn are on the roster (now on the intelligence lines); their drafts are not applied as anchors. Thrawn, Tarkin, Mon Mothma, the Isards and Cracken are not on the roster at all (only Luke is, from those eras).

## 7. Force Control: the generated line against the sheets (reported, not changed)

41 sheeted anchors (`tests/sweep/forceControlGap.test.ts`). Gap (sheet − line): median 38.7, min −31.7 (Oteg, whose long life gives a line above his sheet), max 81.6 (Vitiate). The calibration queue's 14-56 gap is still there, and wider at the top (Luke's late sheets, 61-80).

| Figure | Archetype | Date (BBY) | Sheet FC | Line FC | Gap |
| --- | --- | --- | --- | --- | --- |
| Vitiate | sithInquisitor | 3660 | 130 | 48.4 | 81.6 |
| Luke Skywalker | jediGuardian | -43 | 138 | 58.5 | 79.5 |
| Luke Skywalker | jediGuardian | -25 | 120 | 50.6 | 69.4 |
| Luke Skywalker | jediGuardian | -40 | 126 | 57.8 | 68.2 |
| Luke Skywalker | jediGuardian | -19 | 108 | 47.0 | 61.0 |
| Emperor's Wrath | sithWarrior | 3637 | 92 | 36.0 | 56.0 |
| Darth Nox | sithInquisitor | 3637 | 94 | 39.6 | 54.4 |
| Darth Jadus | sithInquisitor | 3643 | 98 | 45.5 | 52.5 |
| Darth Malgus | sithWarrior | 3653 | 88 | 38.6 | 49.4 |
| The Barsen'thor | jediConsular | 3637 | 90 | 41.0 | 49.0 |
| Darth Marr | sithWarrior | 3640 | 92 | 43.1 | 48.9 |
| Darth Thanaton | sithWarrior | 3645 | 86 | 38.1 | 47.9 |
| Exal Kressh | sithInquisitor | 3678 | 84 | 37.6 | 46.4 |
| Luke Skywalker | jediGuardian | -4 | 82 | 36.3 | 45.7 |
| Hero of Tython | jediGuardian | 3637 | 90 | 44.6 | 45.4 |
| Scourge | sithWarrior | 3660 | 88 | 42.9 | 45.1 |
| Darth Angral | sithWarrior | 3643 | 88 | 43.5 | 44.5 |
| Dread Masters | sithInquisitor | 3660 | 92 | 48.4 | 43.6 |
| Darth Baras | sithInquisitor | 3643 | 88 | 46.9 | 41.1 |
| Darth Acina | sithInquisitor | 3645 | 86 | 45.5 | 40.5 |
| Darth Vindican | sithWarrior | 3681 | 82 | 43.3 | 38.7 |
| Syo Bakarn | jediConsular | 3650 | 80 | 43.3 | 36.7 |
| Dar'Nala | jediConsular | 3655 | 82 | 46.3 | 35.7 |
| Satele Shan | jediGuardian | 3643 | 94 | 60.2 | 33.8 |
| Tol Braga | jediConsular | 3655 | 82 | 48.5 | 33.5 |
| Kira Carsen | jediGuardian | 3637 | 76 | 43.2 | 32.8 |
| Zym | jediConsular | 3660 | 82 | 49.4 | 32.6 |
| Gnost-Dural | jediConsular | 3655 | 78 | 45.5 | 32.5 |
| Darth Vowrawn | sithInquisitor | 3645 | 82 | 49.8 | 32.2 |
| Darth Zash | sithInquisitor | 3645 | 82 | 50.4 | 31.6 |
| Darth Mekhis | sithInquisitor | 3645 | 82 | 50.4 | 31.6 |
| Revan | jediGuardian | 3640 | 94 | 63.3 | 30.7 |
| Ngani Zho | jediConsular | 3660 | 76 | 46.8 | 29.2 |
| Darth Karrid | sithInquisitor | 3640 | 84 | 55.2 | 28.8 |
| Jaric Kaedan | jediGuardian | 3668 | 84 | 58.0 | 26.0 |
| Kao Cen Darach | jediGuardian | 3681 | 84 | 60.1 | 23.9 |
| Bela Kiwiiks | jediSentinel | 3650 | 82 | 59.2 | 22.8 |
| Ragate | sithInquisitor | 3643 | 72 | 49.6 | 22.4 |
| Orgus Din | jediGuardian | 3643 | 84 | 65.3 | 18.7 |
| Ven Zallow | jediGuardian | 3655 | 82 | 63.3 | 18.7 |
| Oteg | jediGuardian | 3642 | 84 | 115.7 | -31.7 |

## 8. BBY timer sweep

I checked every recovery, cooldown, duration and expiry timer in src/engine, src/features, src/turn and src/state. The search covered:
- absolute times floored at 0 or defaulted with `?? 0` / `|| 0`;
- times compared with 0;
- truncation and `%` on negative seconds or days;
- every timer-like field in the feature schemas.

The calendar helpers use floor and a true modulo, so they are safe. One timer had the m8-droids pattern:

- **Combat pursuits** (`pursuitsAfter`): a barred pursuer waited `until (p.untilAbs ?? 0)`. Second 0 is year 1. In a BBY campaign, a barred pursuit with no time (an old save) would wait behind the door forever; in an ABY campaign it would come at once. Fixed to `?? -Infinity` (through at once). Test in tests/m8/holds.test.ts, in 3,653 BBY: a timed pursuer waits and then comes through; an untimed one comes at once.

Everything else is a difference of two times (safe at any sign) or uses null for "none".

## 9. Every invented number

All of them are in spec/skills-m8.md section 10. In short:
- **XP from play:** social line 0.6 with falloff 0.5; stakes 0.5 / 1 / 1.5 / 2; persuasion base 1; command base 3 with sizes 1-2.5 and cap 12; strikes 0.05; insight at 20 / 100 h; gunnery 0.08 a shot on a 0.4 / 1 / 1.2 margin curve; repair 0.5 an hour, failure 0.4, ×1.5 in a fight, upgrade hours 2 / 6 / 6; field operations base 3 split 0.75 / 0.125 / 0.125; stealth base 0.5.
- **Activities:** repair work load 0.6 / 0.6; Melee weights 0.1 (Padawan) and 0.2 (warblade); the new activities' secondaries.
- **Styles:**
  - growth H 108 h; fight hours 0.5 / 1 / 2 / 3; the smoothstep shape of the Melee speed-up;
  - fading: 30-day grace, half floor, 730 days, regrowth ×3;
  - bonus linear; edge +1 from 50%; teaching from 50% (Teräs Käsi 90%);
  - every edge;
  - Teräs Käsi's speed scaling, pistol share from 50%, armour 50% / 25%;
  - Tae-Jitsu dated c. 44 BBY; the four style records.
- **Programmes:** curricula and entry ages; the hrrtayyk's 0.25 years; the officer academy's 3.5.
- **Ladders:** years, minimums, deeds and pay grades; the factions' inferred years.
- **Archetypes:** every new archetype's weights, start ages and activity choices; the soldier's and smuggler's shares; the NPC role splits; the loadouts.
- **Drafts:** every draft-sheet number.

## 10. Runs

- **Before** (`npm run test:all` at the start): 1,891 of 1,891 passed (172 files) in 1,319 s (22.0 min). Edits began during that run; the count matches the last recorded run (m8-droids, 1,891).
- **Pace measurements** (the day loop, parallel): 315 s (all 21 archetypes) and 249 s (the baseline without the Melee weight, plus the re-weighted careers).
- **First after-run of test:all:** 1,931 of 1,933 in 1,284 s (21.4 min). The Sith Warrior's and Inquisitor's Force Sense at Knight was 39.8 against the Lord's minimum 40, from paying the Melee weight twice; fixed with the apprentice session (section 1). `tests/lifetime/forceSense.test.ts` then passed in 241 s (Sith 40.5).
- **Final runs:** `npm test` 1,877 of 1,877 (158 files) in 30 s; `npm run typecheck` and `npm run lint` clean; `npm run test:all` **1,933 of 1,933 passed (173 files) in 1,260 s (21.0 min)**.
- **Tests changed to the new rules:**
  - a Vong scholar is now the scholar archetype (was civilian);
  - the droid module test buys a tool kit first;
  - the acolyte's block is the warblade class.
