# Star Wars Legends — Complete Galaxy Timeline
## Scripted Events & NPC Deployment Reference

---

## DOCUMENT PURPOSE

Authoritative source for the galaxy simulation system. Every scripted event entry has:
- Exact date, full event name, key figures, location, downstream sensitivity
- Downstream Sensitivity: CRITICAL / HIGH / MEDIUM / LOW

**CRITICAL** = Legacy Event — removing this cascades dramatically across eras
**HIGH** = Significant ripple within the era and possibly beyond
**MEDIUM** = Affects faction balance or NPC trajectories but contained
**LOW** = Color/flavor, minimal downstream effect

---

## NPC TAG SYSTEM

Tags define deployment probability. Scripted events override tags when a character is explicitly placed at a date and location.

| Tag | HQ Presence | Deploy % | Mission Types |
|---|---|---|---|
| `[grandmaster]` | 90% | 5% | Never deploys except civilization-level crisis |
| `[council_member]` | 80% | 15% | Diplomatic summits, major crises only |
| `[jedi_archivist]` | 90% | 8% | Rare research expeditions; almost always in archives |
| `[battlemaster]` | 65% | 30% | Training trips, demonstration missions |
| `[temple_instructor]` | 70% | 20% | Field training trips, occasional crisis response |
| `[jedi_guardian]` | 40% | 55% | Combat, escort, border patrol, threat response |
| `[jedi_sentinel]` | 45% | 50% | Investigation, infiltration, criminal network disruption |
| `[jedi_consular]` | 55% | 40% | Diplomacy, Force research, healing missions |
| `[jedi_shadow]` | 25% | 70% | Undercover, espionage, Dark Side artifact retrieval |
| `[jedi_watchman]` | 30% | 60% | Stationed at regional post; sector patrol |
| `[jedi_general]` | 10% | 85% | Battlefield command — wartime only |
| `[jedi_healer]` | 70% | 25% | Deployed to battle zones; usually at Temple |
| `[padawan]` | 70% | 25% | Travels with Master only |
| `[youngling]` | 98% | 1% | Never deployed alone |
| `[sith_emperor]` | 95% | 1% | Throne world only; never directly engages |
| `[dark_council]` | 60% | 35% | Administrative; occasional field |
| `[sith_lord]` | 30% | 65% | Combat, conquest, personal agendas |
| `[sith_apprentice]` | 40% | 55% | With Master or assigned missions |
| `[sith_warrior]` | 20% | 75% | Front-line combat, conquest |
| `[sith_inquisitor]` | 35% | 60% | Interrogation, Force research, espionage |
| `[sith_assassin]` | 15% | 80% | Targeted elimination, covert operations |
| `[republic_military]` | 20% | 75% | Battlefield, patrol, garrison |
| `[diplomat]` | 50% | 45% | Negotiation missions, summits |
| `[smuggler]` | 10% | 85% | Always moving; rarely stays anywhere |

**Tag Stacking:** Multiple tags average their deployment percentages.
**Wartime Modifier:** During active major war, `[jedi_guardian]` +15%, `[jedi_general]` +20%, `[temple_instructor]` -10%.
**Scripted Override:** A character in a scripted event at a specific date has their location forced regardless of tags.

---

*36,453 to 3,701 BBY: see SW_Timeline_36453_5001BBY_Part1–3, SW_Timeline_5000_3997BBY_Part1–3, SW_Timeline_3996_3951BBY_Part1–3 and SW_Timeline_3950_3701BBY_Part1–3. 3,700 to c. 3,622 BBY: see SW_Timeline_3700_3600BBY_Part1–3. The old rows are kept in docs-v2/lore/superseded/ (lore batch 20; D-481); the Legacy Change framework and the faction state seeds moved to docs-v2/spec/14-world-state-and-events.md.*

---

## ════════════════════════════
## NEW SITH WARS — 2,000–1,000 BBY
## ════════════════════════════

### Overview
One thousand years of war between the Jedi Order and successive waves of New Sith. Darth Ruin founds a new Sith Empire from a Jedi schism. The Republic enters a prolonged Dark Age. The war oscillates — neither side can achieve decisive victory. In the final decade, Lord Kaan organizes the Brotherhood of Darkness (20,000+ Sith) against Lord Hoth's Army of Light. Seven battles on Ruusan culminate in Kaan's thought bomb, which kills both forces. Darth Bane — who orchestrated the Brotherhood's destruction — survives and creates the Rule of Two.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **2,000 BBY** | **Fourth Great Schism** — Jedi Master Phanius (possibly Umbaran) falls to dark side; takes 50 Jedi Knights with him; becomes Darth Ruin; founds the New Sith | Darth Ruin (formerly Phanius), 50 dark Jedi | Republic space | CRITICAL |
| **~2,000 BBY** | **New Sith Wars begin** — Darth Ruin's New Sith Empire immediately attacks the Republic | Darth Ruin, New Sith Empire, Republic, Jedi Order | Republic space | CRITICAL |
| **c. 2,000 BBY** | **Darth Ruin assassinated by his own disciples**, angered by his egomania; the New Sith Wars continue for a millennium without him | Darth Ruin (†) | Unknown | HIGH |
| **1,466 BBY** | **Battle of Mizra** — a New Sith army of scores of Sith Lords routs a Republic force after a Sith sniper kills its Jedi battle-meditation coordinator; over half a million troops die and hundreds of Jedi are captured; the Republic loses control of much of the Outer Rim | Unidentified Jedi coordinator (†), New Sith | Mizra system | HIGH |
| **1,250–1,230 BBY** | **Sictis Wars** — Dark Lord Belia Darzu unleashes technobeasts on the Republic and Jedi; she is assassinated by the Mecrosa Order in 1,230 BBY; a Sith victory but no clear successor | Belia Darzu (†) | Multiple fronts | HIGH |
| **~1,100 BBY** | **Republic Dark Age** — Sith control large sections of the galaxy; Republic government barely functions in some eras | New Sith warlords, Republic remnant | Multiple worlds | HIGH |
| **1,010 BBY** | **Lord Hoth forms Army of Light** — consolidates Jedi Order's fighting strength into single independent military force of seven Legions | Jedi Lord Hoth, Jedi Lord Valenthyne Farfalla, Jedi Lord Pernicar | Republic space | HIGH |
| **1,010 BBY** | **Lord Kaan forms Brotherhood of Darkness** — formed from the fragmented New Sith after Kaan's followers kill many of its most powerful lords; abandons the single Dark Lord (every member takes the title); led by a Sith Council; headquarters on Korriban | Lord Skere Kaan, Lords Qordis, Kopecz, Githany, and others | Korriban | CRITICAL |
| **1,002 BBY** | **Ruusan campaign begins** — Army of Light and Brotherhood of Darkness clash on Ruusan; seven battles over two years (the Army of Light wins four) | Lord Hoth, Lord Valenthyne Farfalla, Lord Kaan, Admiral Adrianna Nyras | Ruusan | CRITICAL |
| **1,002 BBY** | **First Battle of Ruusan** — Sith total victory; every Republic soldier killed; no survivors on Republic side | Lord Kaan, Republic Army (all †) | Ruusan | HIGH |
| **1,002–1,000 BBY** | **Second to Sixth Battles of Ruusan** — fortunes swing in space, air and ground fighting; Jedi reinforcements are lost to the orbiting Sith blockade and Sith reinforcements to the Republic Navy *(details of individual battles not re-checked)* | Lord Hoth, Lord Kaan | Ruusan | MEDIUM |
| **1,000 BBY** | **Darth Bane's plan** — Bane, who has broken with the Brotherhood, finds Darth Revan's holocron on Lehon and passes the thought bomb ritual to Kaan, deceiving him that the Brotherhood would survive it | Darth Bane, Lord Kaan | Lehon, Ruusan | CRITICAL |
| **1,000 BBY** | **Jedi Master Pernicar killed** in a Sith attack on Ruusan shortly before the end of the campaign (he had mediated the frequent arguments between Hoth and Farfalla) | Pernicar (†), Lord Hoth, Lord Valenthyne Farfalla | Ruusan | MEDIUM |
| **1,000 BBY** | **Seventh Battle of Ruusan** — the Brotherhood gathers in a network of caves; Kopecz, seeing the madness of the thought bomb plan, leaves to defend the cave mouths, is mortally wounded, reveals the plan to Farfalla and dies in a duel with him | Lord Valenthyne Farfalla, Lord Kopecz (†), Lord Kaan | Ruusan | CRITICAL |
| **1,000 BBY** | **Thought Bomb** — Kaan convinced by Bane that the Thought Bomb will destroy only the Jedi; in truth it kills all Force-sensitives in radius; a final hundred Jedi under Lord Hoth go into the caves knowing they will die | Lord Hoth (†, leads sacrifice), 99 Jedi (†), Lord Skere Kaan (†), entire Brotherhood of Darkness (†) | Ruusan caves | CRITICAL |
| **1,000 BBY** | **Darth Bane survives alone** — as the only Sith not in the cave; finds young girl Zannah among the aftermath; takes her as his apprentice | Darth Bane, Darth Zannah ("Rain", young girl found after battle) | Ruusan surface | CRITICAL |
| **1,000 BBY** | **Rule of Two established** — one Master to embody power; one apprentice to crave it; Sith go underground; all strength concentrated in two instead of dispersed across thousands | Darth Bane, Darth Zannah | Ruusan | CRITICAL |
| **1,000 BBY** | **New Sith Wars end** — Sith believed extinct; Republic celebrates | Galactic Republic, Jedi Order | Galaxy-wide | CRITICAL |
| **1,000 BBY** | **Ruusan Reformations** — Supreme Chancellor Tarsus Valorum restructures the Republic: power moves to the Senate; the Republic Military is dissolved and each system defends itself; the Jedi give up military ranks, disband the Army of Light and come under the Chancellor and the Judicial Department; Jedi are trained from infancy; sectors are cut to 1,024; the calendar is reset to this year | Supreme Chancellor Tarsus Valorum, Jedi Council | Coruscant | CRITICAL |
| **1,000 BBY** | Valley of the Jedi established on Ruusan — mausoleum for fallen warriors; Force nexus where the spirits of the fallen Jedi and Sith are trapped | Jedi Knight Johun Othone (petitioned), Republic Senate | Ruusan | MEDIUM |

---

## ══════════════════════════════════════
## REPUBLIC ERA (GREAT PEACE) — 1,000–22 BBY
## ══════════════════════════════════════

### Overview
One thousand years of peace. The Sith operate in total secrecy under the Rule of Two. Each generation: one Master trains one apprentice, who eventually kills the Master and takes their own apprentice. The chain: Bane → Zannah → Cognus → Millennial (defects) → … (Vectivus at some point, date unknown) → Tenebrous → Plagueis → Sidious → Maul (apprentice, cut in half at Naboo; survives in Legends, see the Clone Wars section) → Tyranus/Dooku → (Vader). The Republic prospers but becomes increasingly corrupt and bureaucratic. The Jedi Order grows complacent. The Grand Plan unfolds.

#### The Rule of Two Succession Chain

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **980 BBY** | **Darth Bane killed by Darth Zannah** — the Iktotchi assassin known as the Huntress, who had captured Bane for Princess Serra of Doan, asks to learn from him and takes the name Darth Cognus; Zannah then duels Bane on Ambria for the title and wins; Cognus pledges herself to the winner and becomes Zannah's apprentice | Darth Zannah, Darth Bane (†), Darth Cognus | Doan, Ambria | HIGH |
| **later, date unknown (almost 1,000 BBY)** | **Darth Millennial leaves** — Cognus's three-eyed apprentice rejects the Rule of Two as too restrictive (he favours Kaan's "rule by the strong"); Cognus disavows him; he founds the Dark Force religion, which becomes the Prophets of the Dark Side on Dromund Kaas | Darth Cognus, Darth Millennial | Dromund Kaas | HIGH |
| later, date unknown | Darth Cognus takes a new apprentice and the chain continues | Darth Cognus, unknown apprentice | Unknown | MEDIUM |
| **centuries before 40 ABY (date unknown)** | **Darth Vectivus** — director of the Jonex mining colony on an asteroid ("the Home") near Bimmiel, built over a dark side vergence; shuts the mine down when the vergence harms his workers, seeks out the Sith and becomes a Dark Lord; unusually ethical; later returns to live at the mine with friends and family | Darth Vectivus | MZX32905 system, near Bimmiel | MEDIUM |
| 980 BBY onward | Rule of Two continues through Masters and apprentices mostly unknown | Various Sith | Hidden | MEDIUM |
| **c. 147–120 BBY** | **Darth Plagueis (Hego Damask) born** on Mygeeto — a Muun; given by his mother to the Bith Dark Lord Darth Tenebrous; later heads Damask Holdings as his cover; obsessed with midi-chlorian manipulation and cheating death | Darth Plagueis, Darth Tenebrous | Mygeeto | HIGH |
| **102 BBY** | **Count Dooku born** on Serenno | Dooku | Serenno | HIGH |
| **~92 BBY** | **Qui-Gon Jinn born** | Qui-Gon Jinn | Unknown homeworld | HIGH |
| **c. 102 BBY** | Dooku taken into the Jedi Order as an infant; later Yoda's Padawan *(year not re-checked)* | Dooku (young), Yoda | Coruscant | HIGH |
| **~82 BBY** | **Palpatine born** on Naboo; Force-sensitive; discovered by Darth Plagueis during Palpatine's youth | Palpatine/Darth Sidious | Naboo | CRITICAL |
| **~72 BBY** | **Mace Windu born** on Haruun Kal | Mace Windu | Haruun Kal | HIGH |
| **67 BBY** | **Plagueis kills his Master, Darth Tenebrous** | Darth Plagueis, Darth Tenebrous (†) | Unknown | CRITICAL |
| **65 BBY** | **Palpatine becomes Darth Sidious** — Plagueis manipulates the young Palpatine into killing his family and takes him as his apprentice | Darth Plagueis, Palpatine/Darth Sidious | Naboo | CRITICAL |
| **~57 BBY** | **Obi-Wan Kenobi born** on Stewjon | Obi-Wan Kenobi | Stewjon | HIGH |
| **~54 BBY** | **Darth Maul taken by Sidious** (approximate) — a Dathomirian Zabrak discovered and claimed by Darth Sidious as a child; raised in secret and trained as his Sith apprentice | Darth Maul, Darth Sidious | Dathomir → hidden | HIGH |
| *date not re-checked* | **Dooku attains the rank of Jedi Master** — one of the Order's most respected swordsmen; trains his own Padawans over the following decades | Dooku, Yoda | Coruscant | MEDIUM |
| **~44 BBY** | **Qui-Gon Jinn selects Obi-Wan Kenobi as Padawan** (Obi-Wan age ~13; nearly sent to Agri-Corps) | Qui-Gon Jinn, Obi-Wan Kenobi (age 13) | Coruscant | HIGH |
| **52 BBY** | **Palpatine elected Senator for Naboo's sector**, age 30 — begins his political ascent | Palpatine | Naboo, Coruscant | HIGH |
| **~41 BBY** | **Anakin Skywalker born** — conceived by midi-chlorians alone (the Chosen One prophecy) | Anakin Skywalker, Shmi Skywalker | Tatooine | CRITICAL |
| **32 BBY** | **Darth Plagueis murdered** in his sleep by Darth Sidious, after Palpatine's election as Chancellor (row repeated in the next table) | Darth Plagueis (†), Darth Sidious | Coruscant | HIGH |

#### Rise of the Empire — 32–22 BBY

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **32 BBY** | **Trade Federation blockades Naboo** — Darth Sidious manipulates Trade Federation into crisis | Nute Gunray, Darth Sidious | Naboo space | CRITICAL |
| **32 BBY** | **Qui-Gon and Obi-Wan sent to negotiate** — find Gungan Jar Jar Binks; escape with Queen Padmé Amidala | Qui-Gon Jinn, Obi-Wan Kenobi, Padmé Amidala, Jar Jar Binks | Naboo | HIGH |
| **32 BBY** | **Anakin Skywalker found on Tatooine** — Qui-Gon convinced Anakin is the Chosen One; buys his freedom; wins it via pod race | Qui-Gon Jinn, Anakin Skywalker (age 9), Watto, Shmi Skywalker | Tatooine | CRITICAL |
| **32 BBY** | **Jedi Council rejects Anakin** — too old; too strong; fear in him; Qui-Gon vows to train him anyway | Qui-Gon Jinn, Anakin Skywalker, Mace Windu, Yoda, Jedi Council | Coruscant | HIGH |
| **32 BBY** | **Battle of Naboo** — Republic and Gungan forces liberate Naboo; Darth Maul vs. Qui-Gon and Obi-Wan in the Theed generator complex | Qui-Gon Jinn (†), Darth Maul, Obi-Wan Kenobi, Padmé Amidala, Anakin Skywalker | Naboo, Theed | CRITICAL |
| **32 BBY** | **Qui-Gon Jinn killed; Darth Maul defeated** — Maul kills Qui-Gon; Obi-Wan then cuts Maul in half. Maul survives (see the Maul rows in the Clone Wars section) | Qui-Gon Jinn (†), Darth Maul (survives), Obi-Wan Kenobi | Theed generator complex | CRITICAL |
| **32 BBY** | Obi-Wan knighted; vows to train Anakin as his Padawan | Obi-Wan Kenobi (age 25), Anakin Skywalker (Padawan) | Coruscant | CRITICAL |
| **32 BBY** | **Palpatine elected Supreme Chancellor** — after Queen Amidala moves a Vote of No Confidence in Valorum; Plagueis is murdered in his sleep by Sidious while celebrating the result | Palpatine, Queen Amidala, Valorum, Galactic Senate | Coruscant | CRITICAL |
| **32 BBY** | **Sifo-Dyas orders the clone army** from the Kaminoans and dies the same year; Jango Fett wins the Hunt to become the clone template | Sifo-Dyas (†), Jango Fett, Kaminoans | Kamino | CRITICAL |
| **~32 BBY** | **Dooku leaves the Jedi Order** — disillusioned after the Battle of Naboo and Qui-Gon's death; returns to Serenno as Count; is later taken by Sidious as the new Sith apprentice Darth Tyranus, replacing Maul | Dooku/Darth Tyranus, Darth Sidious, Yoda | Coruscant → Serenno | CRITICAL |
| **24–22 BBY** | **Separatist Crisis intensifies** (the Senate grants the Chancellor emergency powers in 24 BBY) — Dooku/Tyranus recruits thousands of systems to the Confederacy of Independent Systems | Dooku/Darth Tyranus, Viceroy Gunray, San Hill, others | Outer Rim, Coruscant | HIGH |
| **22 BBY** | **Jedi discover clone army on Kamino** — ordered ten years earlier by the late Jedi Master Sifo-Dyas; secretly taken over by Darth Tyranus | Obi-Wan Kenobi (discovers), Jango Fett (template), Kaminoans | Kamino | CRITICAL |

---

## ═══════════════════════════
## CLONE WARS — 22–19 BBY
## ═══════════════════════════

### Overview
Three-year galaxy-spanning war between the Galactic Republic (with Jedi Generals commanding clone armies) and the Confederacy of Independent Systems. Designed by Darth Sidious to exhaust both sides simultaneously, enable Order 66, and establish the Empire. The war creates some of the most legendary Jedi in history — and kills most of them.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **22 BBY** | **Assassination attempt on Senator Amidala** — Obi-Wan and Anakin assigned as her protectors; leads to discovery of Kamino clones | Padmé Amidala, Obi-Wan Kenobi, Anakin Skywalker, Jango Fett (assassin-hirer) | Coruscant | HIGH |
| **22 BBY** | **Obi-Wan captured on Geonosis** — follows Jango Fett to Geonosis; discovers Separatist army; captured | Obi-Wan Kenobi, Dooku, Jango Fett, Geonosians | Geonosis | HIGH |
| **22 BBY** | **Anakin and Padmé secretly marry** on Naboo — directly after rescuing Obi-Wan | Anakin Skywalker, Padmé Amidala | Naboo | CRITICAL |
| **22 BBY** | **First Battle of Geonosis — Clone Wars begin** — Mace Windu leads Jedi strike team to rescue Obi-Wan; clone army deployed for first time; Dooku escapes; Jango Fett killed | Mace Windu, Obi-Wan Kenobi, Anakin Skywalker (loses arm), Yoda, Jango Fett (†), Count Dooku (escapes) | Geonosis | CRITICAL |
| **22 BBY** | **Battle of Muunilinst** — within four weeks of Geonosis; Republic assaults the InterGalactic Banking Clan homeworld to choke CIS funding; Obi-Wan duels bounty hunter Durge on the ground; Anakin commands the space assault | Obi-Wan Kenobi, Anakin Skywalker, Durge, San Hill | Muunilinst | MEDIUM |
| **22 BBY** | **Duel on Yavin 4** — Anakin pursues Asajj Ventress to the jungle moon; duels her among the ancient Massassi temples | Anakin Skywalker, Asajj Ventress | Yavin 4 | MEDIUM |
| **22 BBY** | **Battle of Ryloth** — Mace Windu negotiates with Twi'lek resistance; planet liberated from Separatist occupation | Mace Windu, Obi-Wan Kenobi, Anakin Skywalker | Ryloth | MEDIUM |
| **22 BBY** | **Battle of Hypori** — General Grievous emerges; ambushes a Jedi strike team and kills several; establishes his reputation as a Jedi killer | General Grievous, Ki-Adi-Mundi (barely escapes), Shaak Ti, Aayla Secura, Sha'a Gi (†), Daakman Barrek (†) | Hypori | HIGH |
| **22 BBY** | **First Battle of Kamino** — Separatists attempt to destroy the Republic's clone production facilities; Quinlan Vos's undercover intelligence allows the Republic to defend successfully | Quinlan Vos, Obi-Wan Kenobi, Anakin Skywalker, Shaak Ti | Kamino | HIGH |
| **22 BBY** | **Battle of Jabiim** — in the war's first months the Republic intervenes in Jabiim's civil war and is beaten by Alto Stratus's Nationalists and Asajj Ventress; the Padawan Pack dies holding Cobalt Station to cover the evacuation; Obi-Wan is presumed dead | Obi-Wan Kenobi, Anakin Skywalker, Alpha-17, Padawan Pack (†), Asajj Ventress, Alto Stratus (†) | Jabiim | HIGH |
| **22 BBY** | **Battle of Mon Calamari** — about four months after Geonosis, the Quarren Isolation League and Separatist droids attack the Calamari Council; Kit Fisto's clone SCUBA troopers and the Mon Calamari Knights defeat them | Kit Fisto, Mon Calamari Knights, Quarren Isolation League | Mon Calamari (Dac) | MEDIUM |
| **early 21 BBY** | **Second Battle of Geonosis** — Republic destroys the rebuilt droid foundries; Poggle the Lesser captured | Anakin Skywalker, Obi-Wan Kenobi, Luminara Unduli, Ki-Adi-Mundi, Ahsoka Tano, Barriss Offee | Geonosis | HIGH |
| ~20 BBY | **Battle of Mygeeto begins** — two-year siege of a crystalline Banking Clan world; grinds on through the rest of the war | Ki-Adi-Mundi, multiple Jedi Generals | Mygeeto | MEDIUM |
| ~20 BBY | **Battle of Felucia** — multiple engagements; Republic holds the strategic fungal world | Aayla Secura, various Jedi | Felucia | MEDIUM |
| ~19 BBY | **Outer Rim Sieges begin** — Republic major offensive pushes into Separatist-held Outer Rim; Jedi Generals deliberately spread thin and separated from Coruscant by Sidious | Obi-Wan Kenobi (Cato Neimoidia/Utapau), multiple Jedi Generals | Multiple Outer Rim worlds | CRITICAL |
| **20 BBY** | **Darth Maul returns** — Savage Opress finds him on Lotho Minor and Mother Talzin rebuilds him; his Clone Wars arc follows (the Shadow Collective, Sundari on Mandalore, Duchess Satine's death; *Son of Dathomir*) | Darth Maul, Savage Opress, Mother Talzin | Lotho Minor, Dathomir, Sundari | HIGH |
| *Project ruling on Maul* | *The Clone Wars* seasons 1–6 and *Son of Dathomir* count as Legends; season 7 does not. Maul has no Legends death date. | — | — | — |
| **19 BBY** | **Battle of Coruscant** — Separatist fleet attacks Republic capital; Chancellor Palpatine kidnapped by Grievous | General Grievous, Count Dooku, Anakin Skywalker, Obi-Wan Kenobi | Coruscant space | CRITICAL |
| **19 BBY** | **Dooku killed by Anakin** aboard Grievous's flagship — Palpatine manipulates Anakin into executing the unarmed Dooku | Anakin Skywalker, Count Dooku (†, executed), Obi-Wan Kenobi | Grievous's flagship | CRITICAL |
| **19 BBY** | Obi-Wan Kenobi kills General Grievous on Utapau | Obi-Wan Kenobi, General Grievous (†) | Utapau | HIGH |
| **19 BBY** | **Anakin discovers Padmé's pregnancy** — visions of her death in childbirth haunt him | Anakin Skywalker, Padmé Amidala | Coruscant | CRITICAL |
| **19 BBY** | **Palpatine reveals himself as Sith Lord** to Anakin — Anakin goes to Council; Council sends Mace Windu to arrest Palpatine | Palpatine/Darth Sidious, Anakin Skywalker, Mace Windu | Coruscant, Palpatine's office | CRITICAL |
| **19 BBY** | **Mace Windu defeated and killed** — Mace has Palpatine at his mercy; Anakin cuts off Mace's hand; Palpatine destroys Mace | Mace Windu (†), Palpatine/Darth Sidious, Anakin Skywalker (chooses wrong side) | Coruscant, Senate District | CRITICAL |
| **19 BBY** | **Anakin Skywalker becomes Darth Vader** — submits to Sidious; given the Vader title; sent to purge Separatist leaders and Jedi Temple | Darth Vader/Anakin Skywalker, Emperor Palpatine/Darth Sidious | Coruscant | CRITICAL |
| **19 BBY** | **Order 66** — Palpatine issues the command; clone troopers turn on and execute their Jedi Generals galaxy-wide, following the order out of ingrained loyalty and military conditioning (in Legends there are no inhibitor chips — the clones obey as a programmed contingency command) | Palpatine (orders), clone army, Jedi Generals across the galaxy (most †) | Galaxy-wide | CRITICAL |
| **19 BBY** | Jedi who survive Order 66 in Legends include: Obi-Wan Kenobi, Yoda, Quinlan Vos, Ferus Olin, Roan Shryne, Rahm Kota (deliberately used no clone troops), Shaak Ti, and scattered others | Obi-Wan Kenobi, Yoda, Quinlan Vos, Rahm Kota, various survivors | Multiple worlds | HIGH |
| **19 BBY** | **Siege of the Jedi Temple** — Darth Vader leads 501st Legion into the Temple; kills everyone including younglings | Darth Vader, 501st Legion, Jedi Temple occupants (all †) | Coruscant, Jedi Temple | CRITICAL |
| **19 BBY** | **Galactic Empire proclaimed** — Palpatine announces end of the Republic in the Senate; thunderous applause | Emperor Palpatine, Galactic Senate | Coruscant Senate Hall | CRITICAL |
| **19 BBY** | **Death Star construction moves** from Geonosis to Despayre in the Horuz system (Geonosian designs passed by Poggle to Dooku to Sidious in 22 BBY) | Tarkin | Despayre | HIGH |
| **19 BBY** | **Battle of Mustafar** — Vader kills Separatist Council and shuts down the droid army; Obi-Wan confronts Vader; duel on volcanic world; Vader loses three limbs and is immolated; Obi-Wan leaves him | Darth Vader (maimed), Obi-Wan Kenobi, Separatist Council (all †) | Mustafar | CRITICAL |
| **19 BBY** | **Padmé Amidala dies** — after giving birth to Luke and Leia; dies of a broken heart/loss of will to live | Padmé Amidala (†), Luke Skywalker (born), Leia Organa (born) | Polis Massa | CRITICAL |
| **19 BBY** | **Luke taken to Tatooine** by Obi-Wan; Leia given to Bail Organa on Alderaan; Vader fitted with life-support armor on Coruscant | Obi-Wan Kenobi (to Tatooine), Bail Organa (takes Leia), Darth Vader (reborn in armor) | Tatooine, Alderaan, Coruscant | CRITICAL |

---

## ══════════════════════════════════
## DARK TIMES / IMPERIAL ERA — 19–1 BBY
## ══════════════════════════════════

### Overview
The galaxy lives under the Galactic Empire. The Jedi Purge continues for years. Surviving Jedi go into hiding or are hunted down by Darth Vader and the Inquisitorius. The Rebellion is born from dozens of independent resistance cells. The Death Star is constructed over two decades. A generation grows up knowing only the Empire.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~29 BBY** | **Han Solo born** on Corellia — orphaned at an early age and taken by the pirate Garris Shrike to serve on his crew; raised harshly aboard Shrike's ship, with the Wookiee Dewlanna acting as a mother-figure (predates the Dark Times; listed here for the Solo throughline) | Han Solo, Garris Shrike, Dewlanna | Corellia, then Shrike's crew | MEDIUM |
| **~19 BBY** | **Yoda exiles himself to Dagobah** — becomes one with the living Force; waits for the Skywalker children to mature | Yoda | Dagobah | HIGH |
| **~19 BBY** | **Obi-Wan exiles to Tatooine as "Ben Kenobi"** — settles into a hermit's life watching over Luke from a distance until 0 BBY | Obi-Wan Kenobi | Tatooine | HIGH |
| **~19 BBY** | **Great Jedi Purge continues** — Darth Vader and the Inquisitorius systematically hunt the scattered surviving Jedi across the galaxy | Darth Vader, the Grand Inquisitor, multiple Inquisitors | Galaxy-wide | CRITICAL |
| **~19 BBY** | **Order 66 survivors go underground** — Quinlan Vos, Ferus Olin, Rahm Kota, Roan Shryne, and others scatter into hiding | Multiple Jedi survivors | Varied hiding places | HIGH |
| **19 BBY** | **Order of the Inquisitorius founded** — a secret division of Imperial Intelligence of dark-side Inquisitors answering to Palpatine and Vader; Grand Inquisitors include Malorum | Palpatine, Darth Vader, Grand Inquisitor Malorum | Coruscant | HIGH |
| **19 BBY** | **Obi-Wan's first weeks on Tatooine** (*Kenobi*) — he becomes drawn into a conflict between local settlers and Tusken Raiders | Obi-Wan Kenobi | Tatooine | LOW |
| **c. 19 BBY** | **Ghorman Massacre** — Captain Tarkin lands his warship on tax protesters; he is promoted to Moff; Bail Organa begins aiding Mon Mothma's resistance | Tarkin, Bail Organa, Mon Mothma | Ghorman | HIGH |
| **~10 BBY** | **Han Solo enters the Imperial Academy at Carida** — serves with distinction before being expelled *(the order and dates of Han's escape from Shrike, his time with Bria Tharen, the Academy and the Chewbacca rescue need re-checking; in Legends the escape from Shrike and Bria come before the Academy)* | Han Solo | Carida | MEDIUM |
| **~10 BBY** | **Han Solo saves Chewbacca** — stops an Imperial officer from beating the Wookiee; is expelled from the Imperial Navy; Chewbacca swears a life debt to him | Han Solo, Chewbacca | Imperial post | HIGH |
| **~10 BBY** | **Han Solo becomes a smuggler** — escapes Garris Shrike's grasp permanently; falls in love with Bria Tharen; begins smuggling, eventually for Jabba the Hutt | Han Solo, Garris Shrike (†, eventually), Bria Tharen, Chewbacca | Various worlds | LOW |
| **2 BBY** | **Corellian Treaty signed** — the resistance groups of Mon Mothma, Bail and Leia Organa, Garm Bel Iblis and Kota's Militia unite as the Alliance to Restore the Republic; the meeting was arranged by Galen Marek as part of Vader's deception, and Vader raids it and captures the senators (*The Force Unleashed*; project ruling: follow the novelization, not the game, for Galen's power level) | Mon Mothma, Bail Organa, Leia Organa, Garm Bel Iblis, Rahm Kota, Galen Marek | Corellia | CRITICAL |
| **19–0 BBY** | **Death Star construction** over the prison world Despayre in the Horuz system (construction began there in 19 BBY) | Grand Moff Tarkin, Bevel Lemelisk (designer) | Horuz system, Despayre | HIGH |
| **~3 BBY** | **Rebel intelligence confirms the superweapon** — the Bothan Spynet and Ralltiir operatives gather evidence of a massive Imperial battle station *(row not re-checked: figures and date need verifying)* | Bothan Spynet, Basso (Ralltiir spy), Lord Tion (†) | Ralltiir, various | HIGH |
| **0 BBY** | **Theft of the Death Star plans (Danuta)** — the mercenary Kyle Katarn infiltrates the Imperial outpost on Danuta and steals a set of the plans (*Dark Forces*). Separately, the Twi'lek Rebel Rianna Saren (introduced to the Rebellion by Katarn) escapes Despayre and the Death Star, then kills her old master Zarien Kheev on Danuta and secures updated plans (*Lethal Alliance*) | Kyle Katarn, Rianna Saren, Jan Ors, Mon Mothma | Danuta | CRITICAL |
| **0 BBY** | **Battle of Toprawa (Operation Skyhook)** — Rebel operatives on Toprawa capture an Imperial transmission facility and hold it just long enough to transmit a second set of plans (superlaser data) to the fleet; the Toprawa rebels and Bothan agents suffer heavy losses | Toprawa Rebel cell, Havet Storm, Bothan agents | Toprawa | CRITICAL |
| **0 BBY** | **Plans consolidated and transmitted to the Tantive IV** — Katarn's Danuta plans, the Toprawa superlaser data, and intercepted AX-235 technical data *(AX-235 not re-checked)* are combined and passed to Princess Leia Organa aboard the Tantive IV | Princess Leia Organa, Darth Vader (pursuing) | Toprawa system → Tantive IV | CRITICAL |

---

## ═══════════════════════════════════════
## GALACTIC CIVIL WAR — 0 BBY–4 ABY
## ═══════════════════════════════════════

### Overview
The Rebel Alliance versus the Galactic Empire. Luke Skywalker discovers his destiny. The Death Star is destroyed twice. Han Solo goes from mercenary to general. Darth Vader is redeemed. The Emperor dies. The Empire shatters.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **0 BBY** | **Leia captured by Darth Vader** — Tantive IV boarded; plans hidden in R2-D2; Luke Skywalker and Obi-Wan eventually find the droid | Princess Leia Organa (captured), Darth Vader | Tatooine space, Tantive IV | CRITICAL |
| **0 BBY** | **Alderaan destroyed** — Grand Moff Tarkin demonstrates the Death Star; billions killed | Grand Moff Tarkin, Princess Leia Organa (witness), Darth Vader | Alderaan (destroyed) | CRITICAL |
| **0 BBY** | **Obi-Wan Kenobi killed** by Darth Vader — lets Vader strike him down; becomes a Force ghost to guide Luke | Obi-Wan Kenobi (†, Force ghost), Darth Vader, Luke Skywalker | Death Star | CRITICAL |
| **0 BBY** | **Battle of Yavin** — Luke Skywalker destroys Death Star using the Force (guided by Obi-Wan's voice); Darth Vader's TIE knocked away by Han Solo at last moment | Luke Skywalker, Han Solo, Darth Vader, Grand Moff Tarkin (†) | Yavin 4 | CRITICAL |
| **0 BBY–1 ABY** | Alliance evacuates Yavin 4; Empire hunts them across the galaxy | Rebel Alliance, Darth Vader | Multiple worlds | HIGH |
| **~1 ABY** | **Luke Skywalker undergoes first true Jedi training** — fragments from Obi-Wan's Force ghost; Expanded Universe missions | Luke Skywalker | Various worlds | HIGH |
| *before 3 ABY (year not re-checked)* | **Lando Calrissian becomes Baron-Administrator of Cloud City** on Bespin | Lando Calrissian | Bespin | MEDIUM |
| **3 ABY** | **Battle of Hoth** — Imperial fleet locates Echo Base; Rebels evacuate under fire; Han and Leia escape; Luke goes to Dagobah | Darth Vader, Admiral Piett, Luke Skywalker, Han Solo, Leia Organa, General Veers | Hoth | CRITICAL |
| **3 ABY** | **Luke trains with Yoda on Dagobah** — discovers he must face Vader; leaves too soon against Yoda's advice | Luke Skywalker, Yoda, Obi-Wan Kenobi (Force ghost) | Dagobah | CRITICAL |
| **3 ABY** | **Han Solo frozen in carbonite** — Vader uses Cloud City as trap; Lando betrays then helps rebels; Boba Fett takes Han to Jabba | Darth Vader, Han Solo (carbonite), Leia Organa, Lando Calrissian, Boba Fett | Cloud City, Bespin | HIGH |
| **3 ABY** | **Duel at Cloud City — "I am your father"** — Luke vs. Vader; Luke loses his hand; Vader reveals he is Luke's father; Luke escapes rather than join him | Luke Skywalker (loses hand), Darth Vader | Cloud City | CRITICAL |
| **4 ABY** | **Rescue of Han Solo** — Luke, Leia, Lando infiltrate Jabba's palace; Leia kills Jabba; everyone escapes | Luke Skywalker, Han Solo, Leia Organa, Lando Calrissian, Jabba Desilijic Tiure (†) | Tatooine, Jabba's palace | HIGH |
| **4 ABY** | **Yoda dies** — at age 900; confirms Darth Vader is Luke's father; cryptically implies "another" Skywalker | Yoda (†, becomes Force ghost) | Dagobah | HIGH |
| **4 ABY** | **Battle of Endor — Death Star II destroyed** — Palpatine's trap to lure the fleet; Alliance attacks; Ewoks help on surface; Luke surrenders himself to Vader | Luke Skywalker, Darth Vader, Emperor Palpatine, Han Solo, Leia Organa, Admiral Ackbar, Lando Calrissian, Ewoks | Endor, Death Star II | CRITICAL |
| **4 ABY** | **Emperor Palpatine tortures Luke with Force lightning** — Vader watches his son suffer; Anakin Skywalker reasserts himself | Emperor Palpatine, Luke Skywalker, Darth Vader (watching) | Death Star II | CRITICAL |
| **4 ABY** | **Darth Vader redeemed** — Anakin Skywalker throws Palpatine into the reactor; mortally wounded by the lightning | Anakin Skywalker/Darth Vader, Emperor Palpatine (†) | Death Star II | CRITICAL |
| **4 ABY** | **Anakin Skywalker dies** — asks Luke to remove his mask; sees his son with his own eyes; becomes one with the Force | Anakin Skywalker (†, Force ghost), Luke Skywalker | Death Star II | CRITICAL |
| **4 ABY** | **Galactic Empire fragments** — with Palpatine and Vader dead and no clear succession, the Empire splinters; Imperial Moffs and admirals become warlords seizing territory; the **Imperial Civil War** begins | Sate Pestage (regent), Ysanne Isard (Imperial Intelligence), multiple Imperial warlords | Galaxy-wide | CRITICAL |
| **4 ABY** | **Alliance of Free Planets formed** — transitional civilian government immediately after Endor | Mon Mothma, Leia Organa, Alliance leadership | Endor → various | HIGH |
| **4 ABY** | **New Republic founded** — one month after the Declaration of the Alliance of Free Planets; the Alliance to Restore the Republic is formally reconstituted as the New Republic | Mon Mothma (first Chief of State), Leia Organa, Admiral Ackbar | Chandrila | CRITICAL |
| **4 ABY** | **Nagai–Tof War** — extragalactic Nagai and Tof invaders attack; Empire and New Republic briefly ally against them *(row not re-checked)* | New Republic, Imperial Remnant, Nagai, Tof | Endor, Iskalon, Zeltros | MEDIUM |

---

*4 to 25 ABY: see SW_Timeline_4_25ABY_Part1–5. The old rows are kept in docs-v2/lore/superseded/ (D-481).*

---

## ══════════════════════════════════
## YUUZHAN VONG WAR — 25–29 ABY
## ══════════════════════════════════

### Overview
The most devastating war in galactic history. The extragalactic Yuuzhan Vong invade with organic technology; they cannot be sensed in the Force. They worship pain as sacred. They conquered much of the known galaxy before being stopped. Chewbacca dies saving Anakin Solo. Anakin Solo dies on Myrkr killing the Voxyn Queen. Coruscant falls and is transformed. The New Republic collapses and becomes the Galactic Alliance. Darth Krayt secretly watches — he will use the Vong's aftermath to start his own war a century later.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **25 ABY** | **Yuuzhan Vong advance scouts revealed** — ExGal-4 outpost on Belkadan wiped out; Danni Quee captured; Praetorite Vong establish bridgehead | ExGal-4 scientists (†), Danni Quee (captured), Praetorite Vong | Belkadan, outer galaxy | CRITICAL |
| **25 ABY** | **Sernpidal destroyed** — Vong use Dovin basal to crash moon into planet; Han Solo and Anakin Solo evacuate survivors | Chewbacca (†, saves Anakin; swept off ramp), Anakin Solo, Han Solo | Sernpidal | CRITICAL |
| **25 ABY** | **Chewbacca killed** — swept away saving Anakin Solo; Han Solo permanently changed; unable to forgive Anakin for years | Chewbacca (†), Anakin Solo (survivor, guilt-ridden), Han Solo | Sernpidal surface | CRITICAL |
| **25 ABY** | **Battle of Helska IV** — first major Republic engagement; Luke Skywalker leads task force; Praetorite Vong worldship destroyed (Mara Jade is already ill with the coomb spore disease engineered by the Vong agent Nom Anor) | Luke Skywalker, Mara Jade Skywalker, Han Solo | Helska IV | HIGH |
| **25 ABY** | **Rhommamool and Osarian conflict** — Nom Anor (Vong advance agent) sparks planetary war | Nom Anor, Wurth Skidder (Jedi, killed later) | Rhommamool, Osarian | MEDIUM |
| **26 ABY** | **Vong advance through Outer Rim** — world after world falls; billions die; New Republic unable to stop them | Vong commanders, Republic military, various Jedi | Multiple Outer Rim worlds | HIGH |
| **25 ABY** | **Battle of Ithor** — a joint New Republic and Imperial Remnant force (Pellaeon, Kre'fey, Luke) fights the Praetorite Vong; Corran Horn kills the Vong commander Shedao Shai in a duel, but the Vong devastate Ithor anyway and Corran is blamed | Corran Horn, Gilad Pellaeon, Traest Kre'fey, Luke Skywalker, Shedao Shai (†) | Ithor (devastated) | HIGH |
| **c. 25–26 ABY** | Mara Jade Skywalker cured of the coomb spore disease, using Vergere's tears *(date not re-checked)* | Mara Jade Skywalker, Vergere | Unknown | HIGH |
| **26 ABY** | **Ben Skywalker born** to Luke and Mara during the war | Ben Skywalker (born), Luke Skywalker, Mara Jade Skywalker | Unknown safe world | MEDIUM |
| **27 ABY** | **Mission to Myrkr** — seventeen young Jedi led by Anakin Solo infiltrate the worldship *Baanu Rass* to kill the voxyn queen (voxyn hunt Jedi through the Force); six Jedi die, Raynar Thul goes missing, and the two Sith agents on the team (Lomi Plo, Welk) betray it | Anakin Solo (†), Jacen Solo (captured), Jaina Solo, Tahiri Veila, Ganner Rhysode, Raynar Thul (missing), Ulaha Kore (†), Eryl Besa (†) | Myrkr, Vong worldship | CRITICAL |
| **27 ABY** | **Anakin Solo killed** — sacrifices himself to seal the mission; dies of wounds; last act destroys many Vong | Anakin Solo (†) | Myrkr, Vong worldship | CRITICAL |
| **27 ABY** | **Jacen Solo captured** — unconscious after the mission; kept as Vong prisoner; tortured for months; philosophical transformation under Vergere | Jacen Solo, Vergere (Jedi-become-Vong-agent; complex) | Vong captivity | CRITICAL |
| **27 ABY** | **Coruscant falls** — Vong conquer Republic capital; rename it Yuuzhan'tar; Chief of State Borsk Fey'lya detonates bomb killing himself and thousands of Vong | Borsk Fey'lya (†, takes thousands with him), Vong forces | Coruscant | CRITICAL |
| **28 ABY** | **Jacen Solo escapes** with Vergere from Vong-held Coruscant; Ganner Rhysode dies holding off the Vong so Jacen can get away | Jacen Solo (escaped, changed), Vergere, Ganner Rhysode (†) | Yuuzhan'tar (Coruscant) | HIGH |
| **28 ABY** | **Battle of Ebaq** — Ackbar's trap at the moon Ebaq 9 turns the war; Vergere dies crashing her ship to save Jacen; Jaina kills Warmaster Tsavong Lah | Gial Ackbar, Garm Bel Iblis, Traest Kre'fey, Luke Skywalker, Vergere (†), Jaina Solo, Tsavong Lah (†) | Ebaq 9 | CRITICAL |
| **28 ABY** | **Galactic Alliance founded** — the New Republic is reconstituted as the Galactic Federation of Free Alliances | Cal Omas (first Chief of State) | Mon Calamari *(location not re-checked)* | HIGH |
| **29 ABY** | **Battle of Yuuzhan'tar (Coruscant)** — Alliance and Vong remnant allies (led by Nas Choka who seeks peace) fight Supreme Overlord Shimrra and his secret master Onimi, a Shamed One | Luke Skywalker, Jacen Solo, Jaina Solo, Supreme Overlord Shimrra (†), Onimi (†, true mastermind) | Coruscant/Yuuzhan'tar | CRITICAL |
| **29 ABY** | **Supreme Overlord Shimrra killed** by Luke Skywalker; Onimi (true master behind Shimrra) killed by Jacen Solo | Luke Skywalker, Shimrra (†), Jacen Solo, Onimi (†) | Yuuzhan Vong worldship-temple | CRITICAL |
| **29 ABY** | **Yuuzhan Vong War ends** — surviving Vong surrender; Zonama Sekot (living world) takes the remaining Vong to permanent exile in Unknown Regions | Nas Choka (Vong commander, surrenders), Harrar (priest, seeks peace), Zonama Sekot | Coruscant, then Unknown Regions | CRITICAL |

---

## ════════════════════════════════════════════════
## POST-VONG / DARK NEST CRISIS — 29–36 ABY
## ════════════════════════════════════════════════

### Overview
Recovery from the Vong War. The galaxy rebuilds. Luke reconstructs the Jedi Order on a stronger foundation. Coruscant is slowly restored. The Killik Joiner crisis emerges — a hive-minded insect species uses Force-sensitive Joiners to expand. Jacen Solo begins his philosophical wandering. Darth Krayt's One Sith secretly rebuilds on Korriban.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **29–35 ABY** | **Galaxy rebuilds** — trillion-credit reconstruction; Coruscant being restored; New Jedi Order expands; Luke rebuilds the Order from scratch with 150+ Knights | Luke Skywalker, Mara Jade Skywalker, Ben Skywalker (growing up), Jaina Solo, Jacen Solo | Coruscant, Ossus, various | MEDIUM |
| **~30 ABY** | **A'Sharad Hett survives Vong War** — Clone Wars veteran who became a Tusken warrior; Vong captured and tortured him; escapes; returns to Korriban | A'Sharad Hett (becoming Darth Krayt) | Korriban | CRITICAL |
| **~30 ABY** | **A'Sharad Hett becomes Darth Krayt** — founds the One Sith on Korriban (deliberately breaks the Rule of Two) *(the XoXaan link and date not re-checked)* | Darth Krayt/A'Sharad Hett | Korriban | CRITICAL |
| **c. 30–35 ABY** | **Jacen Solo's five-year journey** — after the war he travels the galaxy studying Force traditions, returning in time for the Dark Nest Crisis | Jacen Solo | Galaxy-wide | CRITICAL |
| **~35 ABY** | **Dark Nest Crisis** — Killik Joiners crisis; Jedi involved with insect collective; Raynar Thul (missing since Myrkr) is revealed as UnuThul, the Joiner leading the Killiks | Luke Skywalker, Leia Organa, Mara Jade, Jacen Solo, Jaina Solo, Raynar Thul/Unu | Killik space, Colony worlds | HIGH |
| **~36 ABY** | Dark Nest Crisis resolved; uneasy peace; Killik menace contained | Jedi Order, Colony | Unknown Regions/Colony space | MEDIUM |

---

## ══════════════════════════════════════════
## SECOND GALACTIC CIVIL WAR — 40–41 ABY
## ══════════════════════════════════════════

### Overview
Corellia declares independence from the Galactic Alliance. Various star systems follow. Civil war erupts. Behind the scenes, Darth Caedus — the fallen Jacen Solo — manipulates events to seize power. Mara Jade is murdered. Luke Skywalker must ask his niece Jaina Solo to kill her own twin brother.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~40 ABY** | **Corellia declares independence** from Galactic Alliance — beginning of the Second Galactic Civil War | Centerpoint Station, Corellian government, Chief of State Omas | Corellia, Coruscant | HIGH |
| **40 ABY** | **Jacen Solo rises** — heads the Galactic Alliance Guard and becomes the secret apprentice of the Sith Lumiya, who tells him he must sacrifice someone he loves | Jacen Solo, Lumiya, Chief of State Cal Omas | Coruscant | CRITICAL |
| **40 ABY** | **Darth Caedus seizes control** — Jacen and Admiral Niathal remove Cal Omas and rule as co-Chiefs of State | Jacen Solo, Cha Niathal, Cal Omas (deposed) | Coruscant | HIGH |
| **40 ABY** | **Mara Jade Skywalker killed by Jacen** — Mara is investigating him; her death is the sacrifice that completes his fall as Darth Caedus; Luke kills Lumiya, believing her the murderer *(details not re-checked)* | Mara Jade Skywalker (†), Darth Caedus/Jacen Solo, Lumiya (†), Luke Skywalker | Kavan | CRITICAL |
| **40–41 ABY** | **Jaina Solo trains with Boba Fett** to learn how to defeat Caedus *(who sent her not re-checked)* | Jaina Solo, Boba Fett | Mandalore | HIGH |
| **~40–41 ABY** | **Multiple battles** — Confederation (Corellia and allies) vs. Galactic Alliance under Caedus; both sides take heavy losses | Darth Caedus, Han Solo (against Caedus), Leia Organa (against Caedus), Jagged Fel (Imperial Remnant ally) | Multiple worlds | HIGH |
| **41 ABY** | **Battle of Uroro Station** — the final battle; Jaina Solo duels and kills her twin brother Darth Caedus aboard the *Anakin Solo*; Luke brings the Imperial Remnant over to the Jedi Coalition under Jagged Fel, who becomes Imperial Head of State; the Confederation surrenders | Jaina Solo, Darth Caedus/Jacen Solo (†), Luke Skywalker, Jagged Fel, Tahiri Veila (arrested) | Maad system | CRITICAL |
| **41 ABY** | **Second Galactic Civil War ends** | Galactic Alliance, Confederation, Imperial Remnant | Galaxy-wide | HIGH |
| **41 ABY** | Jaina Solo becomes the "Sword of the Jedi"; she later marries Jagged Fel *(year of the marriage not re-checked)* | Jaina Solo, Luke Skywalker, Jagged Fel | Coruscant | MEDIUM |
| **43–44 ABY** | **Fate of the Jedi — Abeloth** — Luke is exiled from Coruscant and travels with Ben; the ancient entity Abeloth emerges from the Maw; the Lost Tribe of the Sith (from Kesh) fights both the Jedi and her; Luke defeats her *(exact years not re-checked; Darth Krayt does not appear in this story)* | Luke Skywalker, Ben Skywalker, Lost Tribe of the Sith, Abeloth | Multiple worlds, Maw | HIGH |

---

## ══════════════════════════════
## LEGACY ERA — 44–139 ABY
## ══════════════════════════════

### Overview
100+ years after the Galactic Civil War. Jagged Fel founded the Fel Empire. His descendants rule as Emperors with the support of Imperial Knights — Force-using warriors loyal to the Emperor, not the Sith. The Galactic Alliance and the Fel Empire have an uneasy but functioning relationship. Darth Krayt's One Sith — hidden on Korriban for a century — reveal themselves and destroy everything. Cade Skywalker, Luke's descendant, is a bounty hunter who refuses to be a Jedi until circumstances force his hand.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **after 44 ABY (exact date unknown)** | **Fel Empire founded** — formed from the Imperial Remnant after Jagged Fel takes the throne; ruled from Bastion with the Council of Moffs | Jagged Fel (first Fel Emperor), Jaina Solo Fel | Bastion | HIGH |
| **date unknown** | **Imperial Knights established** — light-side Force-users who serve the Fel Emperor, an Imperial analogue of the Jedi | Fel dynasty | Imperial space | HIGH |
| **~127 ABY** | **Kol Skywalker leads Jedi on Ossus** — Master Kol Skywalker, Luke's great-great-great-grandson, leads Jedi at the Ossus Academy | Kol Skywalker (†, soon), Cade Skywalker (young, his son), Wolf Sazen (Kol's Padawan) | Ossus | HIGH |
| **~127 ABY** | **Ossus Project** — Jedi-backed plan using Yuuzhan Vong terraforming to restore 100 devastated worlds; widespread support | Jedi Order, 100 worlds | Multiple worlds | HIGH |
| **~127 ABY** | **Ossus Project sabotaged** — Darth Krayt's agents secretly corrupt the Vong terraforming; recipients blame the Jedi and Vong; galactic distrust reignited | Darth Krayt's agents (sabotage), Jedi Order (blamed), 100 worlds (turn against Jedi) | Multiple worlds | CRITICAL |
| **127 ABY** | **Sith-Imperial War begins** — Darth Krayt and One Sith ally with the Moff Council against the Galactic Alliance; Emperor Roan Fel opposes war but is overruled | Darth Krayt, Moff Council, Emperor Roan Fel (unwilling), Galactic Alliance | Galaxy-wide | CRITICAL |
| **130 ABY** | **Battle of Caamas** — the Galactic Alliance is defeated; the Galactic Alliance Remnant is born | Galactic Alliance fleet, Admiral Gar Stazi, Admiral Nict (†) | Caamas | HIGH |
| **130 ABY** | **Sith-Imperial War ends** — Galactic Alliance defeated; forced to surrender | Darth Krayt, Emperor Roan Fel, Galactic Alliance | Coruscant | CRITICAL |
| **130 ABY** | **Massacre at Ossus** — the One Sith strike the Jedi Academy on Ossus, beginning the Third Jedi Purge; Kol Skywalker is killed and the surviving Jedi evacuate | Darth Nihl, Darth Talon, Kol Skywalker (†), Wolf Sazen (wounded), Cade Skywalker (escapes, believed dead) | Ossus | CRITICAL |
| **130 ABY** | **Cade Skywalker uses forbidden healing** — the teenage Cade uses dark-side-tinged healing to save Wolf Sazen; traumatized, he abandons the Force *(Cade's exact age not re-checked)* | Cade Skywalker, Wolf Sazen (healed and survives) | Ossus | CRITICAL |
| **130 ABY** | **Darth Krayt's coup** — Sith betray Emperor Roan Fel; one of his own Imperial Knights (secretly a Sith agent) kills a decoy; Krayt seizes the Imperial Throne | Darth Krayt, Emperor Roan Fel (flees into exile), Darth Wyyrlok (Krayt's second) | Coruscant | CRITICAL |
| **130 ABY** | **Second Imperial Civil War begins** — Roan Fel's True Empire (loyalists) vs. Darth Krayt's Sith Empire vs. Galactic Alliance Remnant under Admiral Gar Stazi | Darth Krayt, Emperor Roan Fel (exile), Admiral Gar Stazi | Galaxy-wide | CRITICAL |
| **130 ABY** | Cade Skywalker begins an apprenticeship under the pirate Rav | Cade Skywalker, Rav | Outer Rim | MEDIUM |
| **137 ABY** | **Cade Skywalker, bounty hunter** — the *Legacy* story begins with Cade working with Deliah Blue and Jariah Syn, suppressing his Force abilities; Krayt sends minions to capture Marasiah Fel and bring Cade to him; Cade is captured and taken to Krayt, then escapes *(capture details not re-checked)* | Cade Skywalker, Deliah Blue, Jariah Syn, Darth Krayt, Darth Talon | Coruscant, Temple of the Sith | HIGH |
| **137 ABY** | **Genocide on Dac** — Krayt orders the Mon Calamari exterminated for aiding Admiral Gar Stazi; 27% of Dac's population is evacuated by anti-Sith forces | Darth Krayt, Mon Calamari, Admiral Stazi | Dac (Mon Calamari) | CRITICAL |
| **137 ABY** | The Galactic Alliance Remnant and Roan Fel's Empire-in-exile begin talks on a united front against Krayt | Emperor Roan Fel, Admiral Gar Stazi | Bastion | CRITICAL |
| **137 ABY** | **Krayt murdered by Darth Wyyrlok** on Had Abbadon after being badly wounded by Azlyn Rae and Celeste Morne/Karness Muur; Wyyrlok is crowned Dark Lord and Emperor with Morlish Veed as Regent; Krayt is resurrected on Korriban | Darth Wyyrlok III, Darth Krayt, Azlyn Rae, Celeste Morne (†) | Had Abbadon, Korriban | HIGH |
| **138 ABY** | **Krayt returns** to Coruscant and kills Darth Wyyrlok to reclaim the throne; he attacks the Jedi's Hidden Temple on Taivas | Darth Krayt, Darth Wyyrlok III (†) | Coruscant, Taivas | HIGH |
| **138 ABY** | **Final Battle of Coruscant** — Darth Krayt, Emperor Roan Fel, Wolf Sazen and Morlish Veed die; Krayt's Galactic Empire falls; the Second Imperial Civil War and the Third Jedi Purge end *(who killed Krayt and Roan Fel not re-checked)* | Cade Skywalker, Darth Krayt (†), Roan Fel (†), Wolf Sazen (†), Darth Nihl, Admiral Stazi | Coruscant | CRITICAL |
| **138 ABY** | **Galactic Federation Triumvirate formed** — the Fel Empire under Empress Marasiah Fel, the Galactic Alliance Remnant and the Jedi govern jointly | Empress Marasiah Fel, Gar Stazi, Jedi Order | Coruscant | HIGH |
| **138–139 ABY** | **Darth Wredd's insurgency** — a One Sith apprentice from Mala (whose world the One Sith destroyed) kills his master and hunts the hidden One Sith, wanting a new order under the Rule of Two; the Imperial Knight Jao Assam and Ania Solo (Han Solo's descendant) hunt him | Darth Wredd, Ania Solo, Imperial Knight Jao Assam | Multiple worlds | MEDIUM |
| **139 ABY** | **Darth Wredd killed** — after luring the Imperial Knights and the One Sith into battle on Mala, he attacks Empress Fel; Jao Assam cuts off his hands and Ania Solo kills him | Darth Wredd (†), Ania Solo, Jao Assam, Marasiah Fel | Mala | HIGH |
| **139 ABY** | **One Sith Order effectively destroyed** in the battle on Mala; Wredd believed himself the last Sith | Darth Nihl (fate not re-checked) | Mala | CRITICAL |

---

*Version 3.0 complete — Full Legends timeline from Dawn of the Jedi (36,453 BBY) through Legacy Era (139 ABY)*
*Corrected 23 Nov 2026 against Wookieepedia Legends pages. Rows marked "not re-checked" still need verifying before they are relied on. The canonical Legends rulings for this project (Maul, The Force Unleashed) are noted in their rows.*
