# Lore batch 8, 2026-11-21: Coruscant and the Jedi Temple (instructions for Claude Code)

Run this after lore batch 7. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy into `Docs/SWRPG lore/` (research bot, reviewed in chat):
1. `SW_Coruscant_Jedi_Temple_OldRepublic_Part1.md` (the Temple and other Jedi sites)
2. `SW_Coruscant_Jedi_Temple_OldRepublic_Part2.md` (the city, law, crime, NPCs, location table)

Mark the topic done in `docs-v2/lore/RESEARCH_QUEUE.md` and add both files to the lore index.

## 2. Log decisions in docs-v2/decisions.md (setting data)

Number them in sequence after the last D-number. Each entry names its lore file. Numbers in brackets are the bot's decision numbers.

### The Temple, c. 3700–3653 BBY

- **[1] Founding:** a meditative enclave on the sacred spire from c. 5000 BBY; the Four Masters' Temple Ziggurat from c. 3996 BBY (after Ossus), growing for about a thousand years.
- **[2] Layout in this era: attested core plus tagged inventions.**
  - **Attested (use as fact):** Temple Court with bronzium statues; Processional Way; main gate and entrance hall with upper mezzanines; Great Hall with hooded statues; four Council spires (High Council Tower, Tower of First Knowledge and two others); First Knowledge quarter (academy wing); small Archives a few storeys above the main entrance; Halls of Healing (a wing; details unattested); Room of a Thousand Fountains (exists "in all incarnations"); detention center; defence-grid mainframe; security recorders; lower levels reachable from The Works.
  - **Functional rooms, invented layout:** Initiate clan quarters, dormitories, a refectory, training salles and meditation rooms existed in function, because the logged *Jedi Path* defaults (clans of about ten, the daily schedule) require them. Their layout, names and details are campaign inventions, tagged `invented` in the data so the narrator never presents them as canon.
  - **Not available in this era:** the later-era Temple's named features. That means the five-spire layout with the Tranquility Spire and Hall of Knighthood, the large Archives (c. 2500 BBY), the Clone Wars Temple Security Force of 500, sublevel hangars and the spaceport tower, and the Agricultural Corps lab. The narrator must not describe these before they exist.
- **[3] Spires in 3653 BBY:** four.
- **[4] The 3653 BBY destruction:** the exterior and all four towers are ruined, and entire floors of archives, holocrons and manuals are lost. Parts of the interior and the lower levels survive (security recordings among them).
- **[5] High Council Chamber:** the tower falls, but the chamber's remains survive deep in the ruins (visited in 3643 BBY).
- **[6] Rebuilding:** c. 3519–3500 BBY; the academy returns from Tython. The spires and High Council Tower are rebuilt in 1019 BBY.
- **[7] Tower of First Knowledge:** northwest; rebuilt 1019 BBY.
- **[8] Tython:** rediscovered by Satele Shan after the Sacking. This is consistent with the logged dates (Master and Council seat 3651).
- **[9] Genarius:** keep the Jedi Enclave purged by the Bane Brigade in the war. The 232 BBY "discovery" line is a source contradiction, not used.
- **[11] Temple Guard:** a minor presence in this era, tagged [inferred]. Gate security in wartime is Republic soldiers and the Temple Security Force (non-Force-sensitive).
- **Jedi at the Temple:** no figure is sourced. Most Jedi are deployed in wartime. At the Sacking "dozens" fight in the entrance hall, six Councilors die, and most Knights and Padawans inside are killed. Design default: a reduced wartime population of Masters, instructors, healers, archivists, Initiates and Padawans between assignments. The number is set in M7.

### The city

- **[10] Republic Executive Building:** doesn't exist yet. The 3653 BBY "blackened facade" line refers to another government building.
- **[12] Yinta Lake spaceport:** on Vulta, not Coruscant (it was an error in my brief). Coruscant's ports in this era are the Coruscant Spaceport (main) and Liston Spaceport.
- **Before-and-after gate for the narrator:** Black Sun, the Justicars' Brigade, the Guild-run Old Galactic Market, Black Sun territory and Justicar territory all come after the Sacking (from 3653 BBY). Before 3653, the Galactic Market is a bustling commercial district, and the Migrant Merchants' Guild is a respectable trade body that quietly smuggles and launders money.
- **Coruscant Security Force (Great War era):** off-white or tan shirt and trousers, grey blast vest and helmet. It runs Coruscant Control and the orbital security stations, and shares Senate security with the military's Senate Security Officers.
- **No named NPCs** (instructors, healers, merchants, cantinas, gang leaders) are sourced for Coruscant before 3653 BBY apart from the file's NPC table. The narrator may generate them as non-canon NPCs.

## 3. §15 notes for M7

- Use the location table (Part 2) and the attested Temple features (Part 1) as the start-location data. Add a data flag `invented: true` for every Temple room or city location the campaign adds, so canon and invented places stay distinguishable.
- Game notes outings (Senate Plaza crowds, the Coruscant Spaceport, the Galactic Market, relief work in the starving lower levels, The Works as forbidden ground) are M7 candidates.

## 4. Commit

One commit for all of the above.
