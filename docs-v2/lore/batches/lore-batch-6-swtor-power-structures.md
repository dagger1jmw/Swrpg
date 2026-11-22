# Lore batch 6, 2026-11-21: SWTOR-era power structures (instructions for Claude Code)

Run this after lore batch 5. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy into `Docs/SWRPG lore/` (research bot, reviewed in chat):
1. `SW_SWTOR_Era_Power_Structures_Part1.md` (Sith Empire)
2. `SW_SWTOR_Era_Power_Structures_Part2.md` (Republic, plus the full timeline for both sides)

Mark the topic done in `docs-v2/lore/RESEARCH_QUEUE.md` and add both files to the lore index.

**Overlap check (bot decision 17):** compare Part 1's rank and title facts (Darth granted by the Emperor, Lords above Overseers, Overseers as instructors) with `SW_Sith_Academies_Training_OldRepublic.md`, `SW_Sith_Training_AllEras_Part1.md` and the logged Sith rank decisions. Compare Part 2's Jedi facts with `SW_Jedi_Order_Ranks_Council_OldRepublic.md` and the logged Satele Shan dates. Report any contradiction; don't change the older decisions.

## 2. Log decisions in docs-v2/decisions.md (M7 setting data)

Number them in sequence after the last D-number. Each entry names its lore file. Numbers in brackets are the bot's decision numbers.

### Dates and office holders

- **[1] Galactic War start:** 3641 BBY. Taris is overrun in 3642 BBY, as a late Cold War event.
- **[2] Janarus's term ends:** 3640 BBY (killed). Saresh is elected in an emergency election in 3640 BBY.
- **[3] Supreme Commanders:** a reading that fits all four pages. Rans serves through the Great Galactic War. Stantorrs holds the post in the late Cold War (by 3643 BBY). Rans returns at the outbreak of the Galactic War, commands at Ilum, then retires. Jace Malcom takes over in 3640 BBY.
- **[12] Player-choice outcomes in SWTOR:** use Wookieepedia's implied canon as the default timeline: Janarus killed; Acina dies at Iokath and Vowrawn becomes Emperor (3629 BBY); Galena Rans elected. Player actions in the sandbox can change these (legacy rules).
- **[13] First Emperor's Voice:** by 3954 BBY (shown in *Revan*). The *TOR Encyclopedia*'s c. 3950 BBY is recorded as a conflict.
- **[15] Garza and Trant on Bomodon:** 3674 BBY.

### How the Sith Empire works

- **[4] Minister of War:** answers to the whole Dark Council and works most closely with the three military Councilors (Offense, Strategy, Defense).
- **[5] Imperial Reclamation Service:** controlled by the Sphere of Ancient Knowledge.
- **[6] Minister of Intelligence:** answers to the Councilor of the Sphere of Imperial Intelligence. The post is abolished in 3640 BBY, when Sith Intelligence starts reporting directly to the Council.
- **[7] Watchers:** analysts who also handle field agents, reporting to the Keeper.
- **[8] Sith Intelligence:** founded by Darth Marr acting for the Dark Council.
- **[9] The Emperor's Hand:** the Council knew it existed. Only a few Councilors knew its members or purpose.
- **[10] Grand Moff:** an honorary title with real privileges, including direct access to the Minister of War.
- **[11] Survivors of the Zakuul conquest:** Acina and Vowrawn. Mortis and Ravage survived in hiding and reappear later.
- **[14] Imperial Navy ranks:** include Commander. In the Republic Army, "Commander" stays an honorific.
- **Dark Council structure:** twelve Spheres, with the corrected names from Part 1's table (including Military Offense and Sith Philosophy). It becomes Acina's five Spheres after the conquest. A seat passes to the fallen Councilor's apprentice, by the Emperor's appointment, to whoever kills the Councilor, or by unanimous vote of the others.
- **Kaggath (lore rules, for M7 Sith rivalry):** only a Sith the Council recognizes can declare one. The challenger chooses the arena, each side uses only its own forces, and rule-breakers are executed by uninvolved Sith. Declining costs the decliner their rank. The winner takes or destroys the loser's assets.
- **Below the Council:** Lords hold power bases inside one Sphere's pyramid, made up of Sith followers, military allies (Moffs) and agency staff. A power base passes to the apprentice when its Lord dies.
- **Non-Sith ceilings:** the Imperial Guard and the Minister of Intelligence are the highest posts open to non-Sith. A Cipher ranks on a par with Sith below Lord. Non-Force-sensitives are conscripted for life (25–30 years' service). Aliens are admitted to the military from 3640 BBY.

### How the Republic works

- **[16] "Planetary Security Council":** dropped. It doesn't exist in Legends.
- **Republic structure (design default):** the Senate elects the Chancellor (four-year terms, removable by a vote of no confidence) and has final authority over the military. The Supreme Commander advises on and oversees military plans. General Garza commands the Special Forces, and treaty-sensitive missions need the Senate's consent. The SIS (Director Trant from 3650 BBY) works alongside the Jedi. Saresh's emergency rule after c. 3636 BBY cut the Senate out of military matters.
- **Jedi and the government:** Chancellors ask the High Council directly for help. Jedi may hold military or political posts (Fleet Admiral Oteg, Jun Seros as Janarus's aide). A Jedi delegation stays in the Senate after the move to Tython.

## 3. §15 notes for M7

- **SWTOR protagonists as canon NPCs:** the class heroes (Hero of Tython, the Barsen'thor, the Emperor's Wrath, Lord Kallig / Darth Nox, Cipher Nine, Havoc Squad's commander, the Outlander) appear in the timeline only by title. Default: canon NPCs known by title, with species, gender and name left open unless the player meets them. The narrator never gives them fixed names. Flag for Jared: should a player be able to take one of these roles?
- Game notes career paths (a Sith PC through a Sphere's pyramid to the Council; non-Sith Imperial careers; Jedi, Republic and SIS careers) are M7 candidates. Nothing is decided yet.

## 4. Commit

One commit for all of the above.
