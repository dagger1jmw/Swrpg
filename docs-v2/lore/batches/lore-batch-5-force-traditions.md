# Lore batch 5, 2026-11-21: Force traditions (instructions for Claude Code)

Run this after lore batch 4. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy into `Docs/SWRPG lore/` (research bot, reviewed in chat):
1. `SW_Force_Traditions_AllEras_Part1.md`
2. `SW_Force_Traditions_AllEras_Part2.md`

Mark "Force traditions, all eras" done in `docs-v2/lore/RESEARCH_QUEUE.md`, and add both files to the lore index.

## 2. Map the power names to the catalog (decision 1)

The bot named powers by Wookieepedia page titles. In `docs-v2/spec/force-catalog-m6.md`:
- Map each power the traditions files name to its catalog entry (for example "Fold space" → the catalog's fold space / Force teleportation; "Meditation of Immersion" → Force immersion).
- **Powers with no catalog entry:** add each one as tradition-gated, with its tradition and lore file as the source and a "review" marker: Field Detection (Luka Sene), Fighting-sight (Aing-Tii), ayna-seff (Baran Do), control web (Nightsisters, group power), spirit ichor (Nightsister shamans, NPC/story), Force weapon imbuing (Nightsisters, Jal Shey gear), Drain Knowledge (the Wyrd), projectile guidance (Ysanna), Cloak of Shadow and Shadow Armor (Disciples of Twilight), elemental shaping (Shapers of Kro Var), parasite expulsion (Kar Vastor, unique), and the Ta-Ree powers (Kathol sector only, NPC). Where a catalog entry already covers one, map to it instead of adding.
- **Amend the lore-lock from the Force powers ruling:** Aing-Tii flow-walking was taught to an outsider by c. 30 ABY (Jacen Solo, after the Yuuzhan Vong War). Fold space taught to outsiders stays from 43.5 ABY (Luke and Ben).
- **Theran Force-listening:** the technique page credits Qui-Gon, Obi-Wan and Ahsoka with using it, which confirms the loosened lock (learnable outside the Therans).
- **Darksight:** the Sorcerers of Rhand, plus the Nightsisters (who call it "heartshadow"). This matches the existing ruling.
- List every mapping and addition in the commit report.

## 3. Log decisions in docs-v2/decisions.md

Number them in sequence after the last D-number. Each entry names its lore file. Numbers in brackets are the bot's decision numbers.

### M6 (Force)

- **[3] Gand findsmen:** mechanically their divination is Force use (a sensing power), but they believe it isn't the Force. The narrator frames it as religious ritual, like the untrained Voss Mystics.
- **[4] Kel Dor telepathy:** a lie the Baran Do spread (the latest source, *Outcast*). It isn't a technique.
- **[5] Aing-Tii fold space:** a Force-sensitive player character may learn it from the Aing-Tii, inside the catalog's era gate. Teaching it to non-Force-sensitives stays NPC-only (the Car'das precedent).
- **[9] Species abilities:** species traits, not tradition-taught powers. That covers Miraluka Force sight, Neti hibernation and Qom Jha telepathic speech.
- **[14] Dathomiri spells:** the same catalog powers, but Allyan magic needs a chant, song or ritual. That gives a visible and audible tell and a short casting time, and the witch can't cast while silenced or bound, except prodigies. Nightsister Shadow Magic (Gethzerion's line) needs no chant. Many witches are gifted in only some families of powers.
- **[17] Potentium:** dark-side techniques still taint, whatever the user believes. The intent discount (D-330) applies only under its own rules, with no extra exemption. Holding Potentium beliefs is heresy for reputation with the Jedi (M7).
- **[19] Gray Paladins:** a minimal-Force fighter archetype. The Force only augments physical skills, and they use blasters, Teräs Käsi, Stava, throwing whorls and spinsticks, treating lightsabers as unreliable. Jedi NPCs see it as heterodox.

### M7 (traditions and NPCs)

- **[2] Legions of Lettow:** disputed history in-universe. Jedi sources say Xendor attacked; Arden Lyn's account (via Inquisitor Torbin) says the Jedi raised an army first. The narrator presents both views as disputed.
- **[6] Sorcerers of Tund:** founded c. 4250 BBY (in-universe date). Peña's 10,000 BBY intent stays [BTS] and isn't used.
- **[7] Mecrosa vs Talzin:** accept c. 230 BBY. Talzin is several centuries old, which is consistent with long-lived Nightsister matriarchs.
- **[8] Kashi Mer:** the dynasty ends in the 25,000 BBY supernova. The Guardians of the Breath survive scattered (still recorded in 990 BBY).
- **[10] Teepo's Paladins:** still active into the New Republic (*Essential Guide to Warfare*, the more specific source). The Gray Paladins' fate after the Purge is unknown.
- **[11] Corellian Jedi:** a sect of the Jedi Order with a Corellia-first loyalty flag, not a separate tradition.
- **[12] Nightsisters:** a recurring name for dark-side exile clans on Dathomir (known by 340 BBY; Talzin's covens in the late Republic). Gethzerion and Baritha founded their own clan in the late Republic.
- **[13] Zalem's Infinity Gate plot:** 32 BBY.
- **[15] Antarian Rangers:** a non-Force background. A rare Ranger may have limited sensitivity (the founder Kaskutal did), but there are no Ranger Force techniques.
- **[16] Iron Knights:** use the *Complete Star Wars Encyclopedia* account (the Aqinos page) for all three conflicts. Aqinos was excommunicated before c. 60 BBY and then taught aboard the Chu'unthor; the Iron Knights fought for the Republic as High Marshals in the Clone Wars; Luke approached them in 13 ABY.
- **[18] Tyia:** an ancient tradition (Thuwisten seen across the galaxy for much of its history) that reached Revyia recently, c. 30 BBY.
- **Who exists in each era:** Part 2's narrator table is the spawn table for tradition NPCs. "Y" means present, "y" means presumed present (optional), and "?" or "–" means absent unless a story event places them there.
- **Playable backgrounds and teachers:** record the Game notes lists from both parts under §15 as M7 candidates. Nothing is decided yet.

## 4. Commit

One commit for all of the above.
