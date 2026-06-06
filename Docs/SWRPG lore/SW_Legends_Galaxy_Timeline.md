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

## ═══════════════════════════════════
## DAWN OF THE JEDI — 36,453–25,793 BBY
## ═══════════════════════════════════

### Overview
The galaxy has no unified government. Force-sensitives across dozens of species are separately developing their connection to the Force. Eight pyramidal ships called Tho Yor gather them all and bring them to Tython in the Deep Core. There they form the Je'daii Order — practitioners of balance between light (Ashla) and dark (Bogan). Tython itself is violently sensitive to Force imbalance and will trigger Force Storms if a Je'daii tips too far toward either side. Those who fall to the dark side are exiled to the moon Bogan until balanced; those who fall to the light are sent to the moon Ashla. The Force Wars end this era and birth the split into Jedi and proto-Sith.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **36,453 BBY** | **Tho Yor Arrival** — 8 pyramid ships gather Force-sensitives from across the galaxy; all converge on Tython in a massive Force Storm | Dai Bendu monks (Ando Prime), Wookiees, Humans, Twi'leks, Selkath, Cathar, multiple species | Tython, Deep Core | CRITICAL |
| **36,453 BBY** | **Je'daii Order founded** — pilgrims realize they were brought to study the Force; build nine temples across Tython; adopt philosophy of balance between Ashla and Bogan | First Je'daii Masters, Tythan settlers | Tython — nine temples including Anil Kesh, Mahara Kesh, Vur Tepe, Kaleth, Akar Kesh | CRITICAL |
| ~36,000 BBY | Tython found to be unsafe for non-Force-sensitives; all non-sensitives migrate to other planets of the Tython system (ten other worlds) | Je'daii Order, Tythan population | Tython system | MEDIUM |
| ~36,000 BBY | Je'daii exile practice established — dark-siders sent to moon Bogan; light-siders to moon Ashla; balance enforced | Je'daii Council | Tython, Bogan, Ashla | HIGH |
| ~35,000 BBY | **Rakata Infinite Empire expands** — dark-side-powered technology; biological weapons; conquering Unknown Regions and Eastern galaxy | Rakatan species, Praetor caste | Unknown Regions, Eastern galaxy | HIGH |
| ~25,805 BBY | **Despot War** — Twi'lek Despot Queen Hadiya of Shikaakwa attempts to conquer the Tython system; defeated at Tython | Queen Hadiya (†), Je'daii Order, Hawk Ryo, Baron Volnos Ryo | Tython system, Shikaakwa | HIGH |
| **~25,793 BBY** | **Rakatan Infinite Empire reaches Tython system** — Force Hound Xesh arrives; crashes on Tython; triggers massive Force Storm | Xesh (Force Hound, later redeemed), Predor Skal'nas (Rakata commander), Predor Tul'kar (†), Trill (Force Hound, spy) | Tython, Ska Gora, Shikaakwa | CRITICAL |
| **~25,793 BBY** | **Xesh redeemed** — Force Hound turns against Daegen Lok's ambition; sides with Je'daii; helps build Forcesabers for defense | Xesh, Shae Koda, Sek'nos Rath, Tasha Ryo, Daegen Lok (imprisoned) | Tython | HIGH |
| **~25,793 BBY** | **Force War** — full Rakatan invasion of the Tython system; Je'daii and Settled Worlds fight back with Forcesabers; Je'daii General Rajivari commands | Daegen Lok (general, released), Rajivari, Je'daii Masters, Rakatan Praetor Skal'nas | Tython system — Obri, Mawr, Ska Gora, Shikaakwa | CRITICAL |
| **~25,793 BBY** | **Rakatan Infinite Empire defeated** — Je'daii weaponize the Tho Yor against Rakatan forces; Skal'nas killed | Xesh, Shae Koda, Je'daii Masters, Predor Skal'nas (†) | Tython orbit and surface | CRITICAL |
| **~25,793 BBY** | **Je'daii Order fractures** — Force War forces Je'daii to choose light or dark; balance philosophy collapses under wartime pressure; dark-siders form separate group | Rajivari (dark, eventually), surviving Je'daii Masters | Tython | CRITICAL |
| **~25,793 BBY** | **Je'daii Order becomes Jedi Order** — light side formalized; dark side rejected; Order renamed; relocated toward Coruscant over the following centuries | Surviving Je'daii Masters | Tython → eventually Coruscant | CRITICAL |

---

## ═══════════════════════════════════════════════════════
## OLD REPUBLIC FOUNDING & FIRST CONFLICTS — 25,793–5,100 BBY
## ═══════════════════════════════════════════════════════

### Overview
The Galactic Republic is founded on Coruscant. Hundreds of worlds join over the following millennia. The Jedi Order relocates to Coruscant and becomes the Republic's peacekeepers. Several internal Jedi schisms produce dark-sided exiles. The Second Great Schism's exiles eventually find Korriban and found the Sith Empire. The Republic continues to expand, occasionally checked by war and disorder.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **25,053 BBY** | **Galactic Republic founded** on Coruscant — first galactic democratic government | Republic founders, Senate | Coruscant | CRITICAL |
| ~25,000 BBY | Jedi Order relocates to Coruscant from Tython; establishes Temple | Jedi Masters | Coruscant | HIGH |
| ~24,500 BBY | **Second Great Schism begins** — group of Jedi begin extended dark-side experimentation; practice Force alchemy to bend life itself; expelled from Order | Xendor (First Great Schism leader, earlier), unnamed dark Jedi leader | Coruscant → expelled | CRITICAL |
| **~7,000 BBY** | **Hundred-Year Darkness begins** — dark Jedi under Ajunta Pall wage war against Republic using alchemically-created monsters | Ajunta Pall, dark Jedi faction, Jedi Order | Republic space | CRITICAL |
| **~6,900 BBY** | **Battle of Corbos** — dark Jedi defeated in final battle; survivors stripped of weapons and exiled to uncharted space beyond Republic borders | Ajunta Pall (exiled), Jedi Order | Corbos | CRITICAL |
| **~6,900 BBY** | **Ajunta Pall and exiles discover Korriban** — find red-skinned Force-sensitive Sith species; conquer them; become god-kings | Ajunta Pall (first Dark Lord of the Sith), Sorzus Syn (guided them to Korriban), Sith King Hakagram Graush (†, betrayed and beheaded by Ajunta Pall) | Korriban | CRITICAL |
| **~6,900 BBY** | **Old Sith Empire founded** — Dark Jedi interbreed with Force-sensitive Sith species through Sith alchemy; cultures merge over generations; Republic has no knowledge | Ajunta Pall (first Dark Lord), Sorzus Syn, other Dark Jedi exiles | Korriban, Ziost, Sith Space | CRITICAL |
| ~6,700 BBY | Some exiled Dark Jedi attempt to return to Republic and conquer Jedi — defeated; Jedi learn Sith Space exists | Renegade Sith, Jedi Order | Republic border | HIGH |
| **~4,250 BBY** | **Third Great Schism** — dark Jedi on Coruscant destroyed in the **Vultar Cataclysm** | Dark Jedi faction, Jedi Order | Coruscant → Vultar system | HIGH |
| ~4,000 BBY | **Beast Wars of Onderon** — Jedi Master Arca Jeth pacifies Onderon; discovers and breaks the lingering dark side influence of Freedon Nadd | Master Arca Jeth, Ulic Qel-Droma (young), Cay Qel-Droma, Nomi Sunrider | Onderon | HIGH |

---

## ══════════════════════════════
## GOLDEN AGE OF THE SITH — 5,100–5,000 BBY
## ══════════════════════════════

### Overview
Under Dark Lord Marka Ragnos, the Sith Empire reaches its pre-war peak. Ragnos rules for over a century through absolute dominance, eliminating rivals and consolidating power. The Republic has no knowledge of the Sith's continued existence. This century of stability ends with Ragnos's death and immediately triggers the Great Hyperspace War.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~5,100 BBY** | **Marka Ragnos becomes Dark Lord** — defeats Situs in duel for Dark Lordship | Marka Ragnos, Simus (†, beheaded in the duel) | Korriban | HIGH |
| ~5,100–5,000 BBY | Century of Sith stability — Ragnos eliminates rivals; expands Sith territories; golden age of Sith culture and Sith alchemy | Marka Ragnos, Sith Council | Korriban, Ziost, Sith Space | MEDIUM |
| ~5,000 BBY | Republic hyperspace scouts **Gav and Jori Daragon** accidentally stumble into Sith Space; captured on Korriban | Gav Daragon, Jori Daragon | Korriban | CRITICAL |
| **5,000 BBY** | **Marka Ragnos dies** of old age after century-long reign; his spirit lingers at his tomb | Marka Ragnos (†, spirit remains) | Valley of Dark Lords, Korriban | CRITICAL |
| **5,000 BBY** | **Sadow vs. Kressh duel** — Naga Sadow and Ludo Kressh duel for Dark Lordship at Ragnos's funeral; Ragnos's spirit watches; Sadow emerges victorious | Naga Sadow, Ludo Kressh, Marka Ragnos (spirit) | Valley of Dark Lords, Korriban | CRITICAL |

---

## ═══════════════════════════════
## GREAT HYPERSPACE WAR — 5,000–4,990 BBY
## ═══════════════════════════════

### Overview
Naga Sadow uses the Daragons' arrival to manufacture a crisis, wins the Dark Lordship, and launches an invasion of the Republic. The war goes well initially — Sith fleets strike Coruscant, the Koros system, and other Republic worlds simultaneously. Sadow's own apprentice Gav Daragon ultimately betrays him, collapsing Sith fleet command. The Republic counterattacks and drives the Sith back. Supreme Chancellor Pultimo orders extermination of all Sith. Survivors flee to the Unknown Regions — where they will spend 1,300 years rebuilding before returning.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **5,000 BBY** | Naga Sadow manipulates Sith Council into believing Daragons are Republic spies; manufactures crisis to justify war | Naga Sadow, Ludo Kressh, Gav and Jori Daragon (pawns) | Ziost, Korriban | HIGH |
| **5,000 BBY** | **Battle of Khar Delba** — Sadow defeats Kressh; frames Republic for the attack; consolidates control | Naga Sadow, Ludo Kressh | Khar Delba | HIGH |
| **5,000 BBY** | Sadow releases Jori Daragon with hidden homing device; she returns to Republic space | Jori Daragon, Naga Sadow | Sith Space → Republic | CRITICAL |
| **5,000 BBY** | **Great Hyperspace War begins** — Sith fleets follow homing device through Daragon Trail; strike Republic worlds simultaneously | Naga Sadow, Sith Empire fleet | Coruscant, Koros system, Kirrek | CRITICAL |
| **5,000 BBY** | **Battle of Coruscant** — Sith fleet strikes Republic capital; Jedi Order defends; first engagement | Jedi Order, Republic forces, Sith fleet | Coruscant | CRITICAL |
| **5,000 BBY** | **Battle of Kirrek** — Sith attack Koros system; Republic and Jedi fight fiercely; Master Memit Nadill and Empress Teta defend | Empress Teta, Jedi Master Memit Nadill, Sith forces | Kirrek, Koros system | HIGH |
| **5,000 BBY** | Gav Daragon turns on Naga Sadow; transmits Sith fleet positions to Republic | Gav Daragon (†, later killed by Sadow) | Primus Goluud system | CRITICAL |
| **5,000 BBY** | **Republic fleet rallies** — with positions betrayed, Republic forces regroup and counterattack; Sith fleets routed across multiple fronts | Republic Navy, Jedi Order | Multiple front lines | CRITICAL |
| **5,000 BBY** | **Battle of Primus Goluud** — Sadow ignites the star; Ludo Kressh arrives; Sadow destroys Kressh's fleet; Kressh killed | Naga Sadow, Ludo Kressh (†), Republic fleet | Primus Goluud | HIGH |
| **5,000 BBY** | **Second Battle of Korriban** — Republic fleet pursues Sadow to Sith homeworld; Sadow flees to Yavin 4 | Republic forces, Naga Sadow (flees) | Korriban | HIGH |
| **4,990 BBY** | **Republic Counterinvasion** — Supreme Chancellor Pultimo orders extermination of all Sith; Republic fleet hunts through Sith Space | Republic fleet, Jedi Order | Korriban, Sith Space | CRITICAL |
| **4,990 BBY** | **Sith exiled from known space** — survivors including one Sith Lord flee to Unknown Regions; Republic believes Sith extinct | Surviving Sith (eventually under future Sith Emperor) | Unknown Regions | CRITICAL |
| **~4,980 BBY** | Naga Sadow dies on Yavin 4 after years of dark side rituals and isolation; spirit lingers | Naga Sadow (†, spirit) | Yavin 4 | LOW |
| **~4,800 BBY** | Sith survivors in Unknown Regions find Dromund Kaas; begin rebuilding under one Sith Lord who eventually becomes the immortal Sith Emperor | Sith Emperor (name unknown, formerly a Sith Lord) | Dromund Kaas, Unknown Regions | CRITICAL |

---

## ═══════════════════════════════════════════════
## SITH EXILE & OLD REPUBLIC INTERWAR — 4,990–3,998 BBY
## ═══════════════════════════════════════════════

### Overview
The Republic believes the Sith extinct. Centuries of relative peace punctuated by internal schisms, the Kanz Disorders, and the rise of dangerous Force cults. The Sith rebuild secretly on Dromund Kaas. One Sith Lord uses the dark side to achieve immortality and becomes the Sith Emperor — maintaining his life across millennia through dark rituals. He patiently builds the reconstituted Sith Empire for over a thousand years.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~4,800 BBY** | **Sith Emperor achieves immortality** through dark side ritual; binds himself to life through the dark side | Sith Emperor (identity unknown) | Dromund Kaas | CRITICAL |
| ~4,400 BBY | **Post-war Sith infighting** — various Sith warlords war over territorial scraps; Order slowly rebuilds | Multiple Sith warlords | Sith Space remnants | MEDIUM |
| **~4,000 BBY** | **Freedon Nadd falls to dark side** — Jedi Knight Freedon Nadd turns; seeks out Naga Sadow's spirit on Yavin 4; becomes a Sith Lord; conquers Onderon | Freedon Nadd | Yavin 4 → Onderon | HIGH |
| **~4,000 BBY** | Freedon Nadd rules Onderon as Dark Lord; buried in tomb on Onderon after death; spirit persists | Freedon Nadd (†, spirit remains) | Onderon, Dxun | HIGH |
| **3,998 BBY** | **Freedon Nadd Uprising** — Naddists (dark side cult) use Nadd's spirit and Sith artifacts to wage uprising on Onderon | Arca Jeth, Ulic Qel-Droma, Cay Qel-Droma, Nomi Sunrider, King Ommin (Naddist leader) | Onderon | HIGH |
| **3,998 BBY** | **First and Second Battles of Onderon** — Jedi defeat the Naddist Uprising; Ommin captured; Nadd's spirit contained; Sith artifacts buried | Ulic Qel-Droma, Cay Qel-Droma, Master Arca Jeth, Nomi Sunrider | Onderon | HIGH |
| **3,998 BBY** | **Krath cult founded** — Aleema and Satal Keto secretly found dark side cult in Empress Teta system after obtaining Sith artifacts from Onderon | Aleema Keto, Satal Keto | Empress Teta system | CRITICAL |
| **3,997 BBY** | **Krath Holy Crusade begins** — Krath seize all seven planets of Empress Teta system in a bloody coup using Sith sorcery | Aleema Keto, Satal Keto | Empress Teta system | HIGH |
| **~3,970 BBY** | **Kanz Disorders begin** — slave rebellion and authoritarian warlordism in the Kanz sector; the Republic is unable to respond effectively for centuries | Argazdan Regent Myrial, slave populations, Republic | Kanz sector | MEDIUM |
| **~3,670 BBY** | **Kanz Disorders end** — after roughly 300 years, the Republic and Jedi finally pacify the sector | Jedi Master Shaela Nuur (among others), Republic forces | Kanz sector | LOW |

---

## ════════════════════════════════════
## GREAT SITH WAR — 3,997–3,996 BBY
## ════════════════════════════════════

### Overview
The Great Sith War (also the Exar Kun War) is the most catastrophic conflict in the Old Republic era before the Mandalorian Wars. Two fallen Jedi — Exar Kun and Ulic Qel-Droma — are anointed Dark Lords of the Sith by Marka Ragnos's spirit. Allied with the Krath cult and Mandalorian Crusaders, they wage a devastating campaign. The Great Jedi Library on Ossus is destroyed. Ulic ultimately turns against Kun after killing his own brother. Kun's spirit is trapped on Yavin 4 for four thousand years.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,997 BBY** | **Jedi Assembly on Deneba** — Jedi Order convenes on Deneba to address Krath threat; Krath launch surprise War Droid attack; Master Arca Jeth killed | Master Arca Jeth (†), Ulic Qel-Droma, Cay Qel-Droma, Nomi Sunrider, Exar Kun (also attending) | Deneba | CRITICAL |
| **3,997 BBY** | Ulic Qel-Droma proposes infiltrating the Krath from within; Council reluctantly agrees | Ulic Qel-Droma, Jedi Council | Coruscant | HIGH |
| **3,997 BBY** | Exar Kun explores Sith world of Korriban; driven by hunger for knowledge; Freedon Nadd's spirit directs him to Yavin 4 | Exar Kun, Freedon Nadd (spirit, directing him) | Korriban → Yavin 4 | CRITICAL |
| **3,997 BBY** | **Exar Kun corrupted on Yavin 4** — Massassi rituals nearly destroy him; spirit of Freedon Nadd manipulates him; Kun destroys Nadd's spirit and seizes Sith knowledge | Exar Kun, Freedon Nadd (spirit, †, destroyed by Kun) | Yavin 4 | CRITICAL |
| **3,997 BBY** | Ulic Qel-Droma infiltrates Krath on Empress Teta; corrupted by dark side despite intentions; kills Satal Keto in anger | Ulic Qel-Droma, Satal Keto (†, killed by Ulic in rage), Aleema Keto, Nomi Sunrider | Empress Teta | CRITICAL |
| **3,997 BBY** | **Ulic and Exar Kun meet** — Kun travels to Empress Teta; duels Ulic to establish dominance; **Marka Ragnos's spirit interrupts** and anoints BOTH as Sith Lords | Exar Kun (Dark Lord), Ulic Qel-Droma (Sith apprentice), Marka Ragnos (spirit) | Cinnagar, Empress Teta | CRITICAL |
| **3,997 BBY** | **Brotherhood of the Sith formed** — Kun begins corrupting Jedi Padawans on Ossus; builds his order | Exar Kun, corrupted Jedi Padawans | Yavin 4, Ossus | HIGH |
| **3,997 BBY** | **Mandalore the Indomitable joins Ulic** — Mandalorian Crusaders ally with Ulic after he defeats Mandalore in single combat | Ulic Qel-Droma, Mandalore the Indomitable | Empress Teta | CRITICAL |
| **3,996 BBY** | **Battle of Coruscant** — Exar Kun and Mandalore storm Senate Hall; Exar Kun kills Supreme Chancellor Sidrona; Exar Kun kills Jedi Master Vodo-Siosk Baas (his old Master); Ulic freed | Exar Kun, Mandalore the Indomitable, Supreme Chancellor Sidrona (†), Jedi Master Vodo-Siosk Baas (†), Ulic Qel-Droma (freed) | Coruscant Senate Hall | CRITICAL |
| **3,996 BBY** | **Dark Reaper deployed** — Exar Kun uses ancient Sith artifact on Raxus Prime; thousands die as Force energy is drained | Exar Kun, Republic civilians | Raxus Prime | HIGH |
| **3,996 BBY** | Ulic secretly alerts Jedi to Dark Reaper threat; Jedi confront and disable it on Thule | Ulic Qel-Droma (covert warning), Jedi strike team | Thule | HIGH |
| **3,996 BBY** | **Cron Supernova** — Aleema Keto misuses Sith weapon; accidentally ignites Cron Cluster stars; killed by the explosion she caused; resulting supernova devastates Ossus | Aleema Keto (†, her own weapon kills her) | Cron Cluster | CRITICAL |
| **3,996 BBY** | **Battle of Ossus** — Exar Kun and Ulic raid Ossus during evacuation chaos to steal Jedi artifacts and knowledge | Exar Kun, Ulic Qel-Droma, Cay Qel-Droma (†), Nomi Sunrider, Jedi Order | Ossus | CRITICAL |
| **3,996 BBY** | **Ulic Qel-Droma kills his brother Cay** in a lightsaber duel on Ossus | Ulic Qel-Droma, Cay Qel-Droma (†) | Ossus | CRITICAL |
| **3,996 BBY** | **Nomi Sunrider strips Ulic of the Force** — in rage and grief; Ulic permanently severed from the Force | Nomi Sunrider, Ulic Qel-Droma | Ossus | CRITICAL |
| **3,996 BBY** | **Great Jedi Library on Ossus destroyed** — combined damage from supernova wave, Sith raid, and battle; irreplaceable Jedi knowledge lost | Jedi Order, Ossus population | Ossus | CRITICAL |
| **3,996 BBY** | **Battle of Onderon** — Mandalorian Crusaders under Mandalore the Indomitable attempt final victory; Republic and Jedi defeat them; Mandalore killed by Iridonian beasts | Mandalore the Indomitable (†), Republic forces, Jedi | Onderon | CRITICAL |
| **3,996 BBY** | Ulic leads Jedi to Yavin 4 to destroy Exar Kun | Ulic Qel-Droma, thousands of Jedi | Yavin 4 | CRITICAL |
| **3,996 BBY** | **Battle of Yavin 4** — thousands of Jedi create wall of light; Exar Kun drains all Massassi life energy in desperate ritual; Jedi light destroys his body; spirit trapped on Yavin 4 | Exar Kun (spirit trapped), Massassi species (nearly all killed), Jedi Order | Yavin 4 | CRITICAL |
| **3,996 BBY** | **Great Sith War ends** — Jedi Order diminished; Great Library destroyed; Mandalorian Crusaders routed | Jedi Order, Republic | Galaxy-wide | CRITICAL |
| **3,995–3,993 BBY** | **Great Hunt** — Republic systematically hunts and destroys Drexl beasts and Dark Side monsters created by Sith alchemy during the war | Jedi Order, Republic forces | Outer Rim worlds | MEDIUM |

---

## ════════════════════════════════
## MANDALORIAN WARS — 3,976–3,960 BBY
## ════════════════════════════════

### Overview
Sixteen years after the Great Sith War, the Mandalorian Crusaders — secretly goaded by the Sith Emperor — launch a new war. Under Mandalore the Ultimate and his lieutenant Cassus Fett, they conquer the Outer Rim with brutal efficiency. The Jedi Council refuses to intervene — seeing a shadowy hand behind the war. Revan defies the Council, discovers proof of the Cathar genocide, and leads Jedi volunteers to war. A tactical genius, Revan turns the tide and drives the Mandalorians back. The war ends at Malachor V with the Mass Shadow Generator — a superweapon that crushes everything in Malachor's atmosphere. Revan and Malak then follow the Sith's influence into the Unknown Regions — where the Sith Emperor turns them.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,976 BBY** | **Mandalorian Wars begin** — Mandalore the Ultimate, secretly manipulated by a Sith emissary, launches new crusade of conquest | Mandalore the Ultimate, Cassus Fett (lieutenant), Mandalorian Neo-Crusaders | Outer Rim Territories | CRITICAL |
| **3,976–3,965 BBY** | **Mandalorian Neo-Crusader conquests** — Outer Rim worlds fall in rapid succession; Cathar nearly exterminated; Republic Senate refuses to act | Cassus Fett, Mandalore the Ultimate | Multiple Outer Rim worlds | HIGH |
| **~3,973 BBY** | **Massacre of Cathar** — Cassus Fett herds defenseless Cathar species into ocean and massacres them despite the protests of one Mandalorian woman | Cassus Fett, Cathar species (near-extinct), one unnamed protesting Mandalorian | Cathar | CRITICAL |
| **3,976–3,964 BBY** | Jedi Council debates intervention; ultimately refuses; citing a hidden dark force behind the war | Jedi Council | Coruscant | HIGH |
| **~3,964 BBY** | **Jedi Knight Revan discovers Cathar massacre evidence** — picks up dead Mandalorian woman's mask; entire group of Jedi experiences Force vision of the genocide; Revan dons the mask; vows Mandalorian defeat | Revan (takes name here), Alek/Malak, Ferroh (Cathar Jedi), other Jedi | Cathar | CRITICAL |
| **~3,963 BBY** | **Revanchist movement** — Revan and Alek (later Malak) travel the galaxy rallying Jedi to join the war; Republic media calls them heroes the Council ignores | Revan, Alek (Malak), other Revanchist Jedi | Republic space | HIGH |
| **3,963 BBY** | **False War** — Mandalorians begin probing Republic lines; a year of small engagements | Mandalorian raiders, Republic border forces | Republic-Mandalorian border | MEDIUM |
| **3,963 BBY** | **Siege of Taris** — Mandalorians break through Republic lines and besiege Taris; marks start of full-scale invasion | Mandalore the Ultimate, Republic forces | Taris | HIGH |
| **3,963–3,962 BBY** | **The Onslaught** — Mandalorians invade through three separate corridors simultaneously; Republic nearly overwhelmed | Cassus Fett, Mandalorian Neo-Crusaders | Multiple fronts | HIGH |
| **~3,962 BBY** | **Revanchists join the war** — Revan and Jedi volunteers join Republic Military under banner of Republic Mercy Corps; Council reluctantly allows it | Revan, Malak, Meetra Surik, other Revanchist Jedi | Multiple fronts | CRITICAL |
| **~3,962 BBY** | **Revan appointed Supreme Commander** — Supreme Chancellor Tol Cressa recognizes Revan's military genius; appoints him to lead Republic war effort | Revan, Supreme Chancellor Tol Cressa | Republic command | HIGH |
| **~3,961 BBY** | Revan and Malak visit **Malachor V** — encounter ancient Sith teachings; discover the Trayus Academy; begin learning Sith knowledge | Revan, Malak | Malachor V | CRITICAL |
| **3,961–3,960 BBY** | **Revanchist victories** — Revan drives Mandalorians from Taris; defeats Cassus Fett at multiple engagements; Mandalorians retreating | Revan, Malak, Cassus Fett (defeated) | Multiple fronts | HIGH |
| **3,960 BBY** | Revan and Malak travel to Unknown Regions following trail of "shadowy Sith influence" behind the war | Revan, Malak | Unknown Regions | CRITICAL |
| **3,960 BBY** | **Battle of Malachor V** — Revan lures Mandalorians to Malachor V; Mass Shadow Generator activated by General Meetra Surik; crushes everything in Malachor's atmosphere; Revan personally kills Mandalore the Ultimate aboard his flagship | Revan, Mandalore the Ultimate (†), Meetra Surik (activates weapon), Bao-Dur (designed weapon), Mandalorian Neo-Crusaders (majority killed) | Malachor V orbit and surface | CRITICAL |
| **3,960 BBY** | **Mandalorian Wars end** — Mandalore the Ultimate killed; survivors scatter or take up mercenary work; Mandalore's Mask hidden by Revan | Revan, surviving Mandalorians, Canderous Ordo (survivor) | Malachor V | CRITICAL |
| **3,960 BBY** | **Revan and Malak turn to the dark side** — Sith Emperor in Unknown Regions captures them and uses them as pawns; they break free of his control and become Sith Lords themselves | Revan, Malak, Sith Emperor | Unknown Regions, Dromund Kaas | CRITICAL |
| **3,959–3,957 BBY** | Revan and Malak return and build new Sith Empire using Star Forge; gather Mandalorian veterans and Jedi converts | Darth Revan, Darth Malak, Star Forge | Lehon (Rakata Prime) → Republic space | CRITICAL |

---

## ════════════════════════════
## JEDI CIVIL WAR — 3,959–3,956 BBY
## ════════════════════════════

### Overview
Darth Revan and Darth Malak return from the Unknown Regions with a massive fleet built by the Star Forge — a Rakatan space station that produces ships almost endlessly using the dark side. The war devastates the Republic. A Jedi strike team led by Bastila Shan captures Revan — the Council wipes his memory and reprograms him as a tool to find the Star Forge. Revan ultimately redeems himself and kills Malak. The Star Forge is destroyed.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,959 BBY** | **Jedi Civil War begins** — Darth Revan and Darth Malak return with massive Star Forge fleet; seize Korriban; revitalize Sith Academy; war begins | Darth Revan, Darth Malak, Sith fleet | Republic border → multiple worlds | CRITICAL |
| **3,959–3,957 BBY** | **Star Forge fleet production** — Sith Empire grows without limit; multiple Republic worlds fall; Republic fleet sustains catastrophic losses | Darth Revan, Darth Malak, Sith armada | Multiple Republic worlds | HIGH |
| **3,959–3,957 BBY** | Carth Onasi, Republic admiral, fights losing defensive campaigns; helps hold Republic lines | Admiral Carth Onasi | Multiple fronts | MEDIUM |
| **~3,957 BBY** | **Jedi strike team attacks Revan's flagship** — Jedi Council sends team including Bastila Shan to capture/kill Revan | Bastila Shan, Jedi strike team, Darth Revan | Revan's flagship | CRITICAL |
| **~3,957 BBY** | **Darth Malak betrays Revan** — fires on Revan's own flagship during the Jedi attack, attempting to kill both Revan and the Jedi | Darth Malak, Darth Revan (gravely wounded) | Revan's flagship | CRITICAL |
| **~3,957 BBY** | **Bastila Shan captures Revan** — uses battle meditation to save his life; brings him back to the Jedi | Bastila Shan, Revan | Revan's flagship | CRITICAL |
| **~3,957 BBY** | **Jedi Council wipes Revan's memory** — creates new identity; sends him with Bastila to find the Star Forge | Jedi Council, Revan (new identity created), Bastila Shan | Coruscant | CRITICAL |
| **~3,957–3,956 BBY** | **Revan's search** — Revan (amnesiac) slowly recovers fragments of memory; travels to Dantooine, Tatooine, Kashyyyk, Manaan, Korriban; finds Star Maps to locate Star Forge | Revan (amnesiac), Bastila Shan, Carth Onasi, Mission Vao, Zaalbar, Canderous Ordo, HK-47 | Dantooine, Tatooine, Kashyyyk, Manaan, Korriban | HIGH |
| **~3,956 BBY** | Bastila Shan captured by Darth Malak; tortured; falls to dark side | Bastila Shan, Darth Malak | Unknown Sith world | HIGH |
| **~3,956 BBY** | Revan fully remembers his identity; chooses the light side | Revan, Bastila Shan | Lehon (Rakata Prime) | HIGH |
| **3,956 BBY** | **Battle of Rakata Prime** — Revan defeats and redeems Bastila; Republic fleet battles Star Forge fleet above Rakata Prime | Revan, Bastila Shan (redeemed), Republic fleet, Sith fleet | Rakata Prime (Lehon) | CRITICAL |
| **3,956 BBY** | **Darth Malak killed** by Revan aboard the Star Forge | Revan, Darth Malak (†) | Star Forge, Rakata Prime orbit | CRITICAL |
| **3,956 BBY** | **Star Forge destroyed** — Republic bombs it after Revan and Bastila escape | Republic fleet, Star Forge (destroyed) | Rakata Prime orbit | CRITICAL |
| **3,956 BBY** | **Jedi Civil War ends** — Republic celebrates; Revan celebrated as hero; remaining Sith descend into civil war | Republic, Jedi Order, surviving Sith factions | Galaxy-wide | CRITICAL |

---

## ══════════════════════════════════════════
## DARK WARS / FIRST JEDI PURGE — 3,955–3,951 BBY
## ══════════════════════════════════════════

### Overview
From the ashes of Revan's Sith Empire, three Sith Lords form a Triumvirate and nearly succeed in exterminating the Jedi Order. Darth Nihilus becomes a literal wound in the Force — he must consume Force-sensitives to survive. Darth Sion is held alive only by pain and hatred. Darth Traya/Kreia is a Jedi Master who betrayed the Order and seeks to destroy the Force itself. The Jedi Exile (Meetra Surik) — exiled for following Revan and activating the Mass Shadow Generator — returns and dismantles them one by one.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~3,955 BBY** | **Sith Civil War** — Revan's remaining Sith tear each other apart; dozens of warlords fight for scraps of his Empire | Multiple Sith warlords | Former Sith Empire territory | HIGH |
| **~3,954 BBY** | **Sith Triumvirate formed** — Darth Traya, Darth Nihilus, and Darth Sion unite at Malachor V; Trayus Academy as base | Darth Traya (Kreia), Darth Nihilus, Darth Sion | Malachor V, Trayus Academy | CRITICAL |
| **3,954 BBY** | **First Jedi Purge begins** — Sith assassins wage shadow war; hunt and kill Jedi across the galaxy | Darth Sion (commands assassins), Sith assassins | Galaxy-wide | CRITICAL |
| **3,954 BBY** | Nihilus and Sion strip Darth Traya of her Force connection; exile her from Malachor V | Darth Nihilus, Darth Sion, Darth Traya (exiled, stripped of Force) | Malachor V | HIGH |
| **~3,952 BBY** | **Massacre at Katarr** — Darth Nihilus drains all life from planet Katarr; nearly 100 Jedi die attending secret conclave; only Visas Marr survives, turned into Nihilus's servant | Darth Nihilus, Jedi conclave (nearly all †), Visas Marr (enslaved) | Katarr | CRITICAL |
| **~3,952 BBY** | Jedi Order down to fewer than ten known survivors across the galaxy | Jedi Order remnant (scattered) | Galaxy-wide | CRITICAL |
| **~3,952 BBY** | **Meetra Surik (Jedi Exile) returns** — called back from exile; seeks out surviving Jedi Masters to rebuild the Order | Meetra Surik, Atton Rand, Bao-Dur, Mical (Disciple), Handmaiden (Brianna), Visas Marr (joins), GOTO | Peragus → Telos → multiple worlds | CRITICAL |
| **~3,952 BBY** | Meetra Surik pursues and finds surviving Jedi Masters — Vrook Lamar, Kavar, Zez-Kai Ell, Atris; they meet on Dantooine | Meetra Surik, Vrook Lamar, Kavar, Zez-Kai Ell, Atris | Dantooine | HIGH |
| **~3,952 BBY** | **Dantooine Enclave ambush** — Darth Nihilus drains Masters through Meetra Surik; most die; Vrook survives | Vrook Lamar (survives), Kavar (†), Zez-Kai Ell (†), Darth Nihilus (drains remotely) | Dantooine ruins | CRITICAL |
| **3,951 BBY** | **Battle of Telos** — Darth Nihilus brings his ship Ravager to consume Telos IV; Meetra Surik, Mandalore the Preserver, and Visas Marr board the Ravager | Meetra Surik, Mandalore the Preserver (Canderous Ordo), Visas Marr, Darth Nihilus | Telos IV, the Ravager | CRITICAL |
| **3,951 BBY** | **Darth Nihilus killed** — Visas Marr weakens him; Meetra Surik kills him; Ravager crashes into Telos station | Meetra Surik, Visas Marr, Darth Nihilus (†), Ravager (crashes) | Telos orbit | CRITICAL |
| **3,951 BBY** | **Malachor V — Trayus Academy** — Meetra Surik defeats Darth Sion; Sion chooses to die rather than continue his pain-fueled existence | Meetra Surik, Darth Sion (†, chooses death) | Malachor V, Trayus Academy | CRITICAL |
| **3,951 BBY** | **Kreia's revelation and death** — Darth Traya reveals she sought to destroy the Force itself; Meetra Surik kills her at the Trayus Core | Meetra Surik, Darth Traya/Kreia (†) | Malachor V, Trayus Core | CRITICAL |
| **3,951 BBY** | **Malachor V destroyed** — Bao-Dur's remote reactivates the Mass Shadow Generator; planet destroyed | Bao-Dur's remote, Malachor V (destroyed) | Malachor V | HIGH |
| **3,951 BBY** | **First Jedi Purge ends** — Sith Triumvirate destroyed; Jedi Order nearly extinct but surviving | Meetra Surik, Jedi Order remnant | Galaxy-wide | CRITICAL |
| **~3,950 BBY** | **Revan disappears into Unknown Regions** — goes alone to fight the true Sith and prevent the greater war | Revan, (Meetra Surik follows) | Unknown Regions → Dromund Kaas | CRITICAL |
| **~3,950 BBY** | **Revan captured and imprisoned** by Sith Emperor — kept in stasis for centuries as a tool to understand the Jedi | Revan (imprisoned), Sith Emperor, Scourge | Dromund Kaas, Sith Emperor's prison | CRITICAL |

---

## ════════════════════════════════════════════
## OLD REPUBLIC RECOVERY — 3,950–3,681 BBY
## ════════════════════════════════════════════

### Overview
270 years of recovery and rebuilding. The Jedi Order slowly rebuilds on Coruscant. The reconstituted Sith Empire builds its strength in the Unknown Regions under the immortal Sith Emperor. Imperial agents begin infiltrating Republic space, installing puppet governments in key Outer Rim systems. The Hydian Way super-hyperroute is blazed, connecting the galaxy — and creating the chokepoint the Mandalorians will later exploit.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~3,950 BBY** | Jedi Order begins slow rebuilding; fewer than twenty known surviving Jedi | Surviving Jedi Masters | Coruscant, scattered worlds | HIGH |
| **~3,900 BBY** | Jedi Temple on Coruscant re-staffed; Order stabilizing | Jedi Council (new membership) | Coruscant | MEDIUM |
| **~3,700 BBY** | **Hydian Way super-hyperroute blazed** by Freia Kallea of Brentaal IV; connects Tingel Arm through the Core to southern Outer Rim | Freia Kallea, Banu Hydia (Duros scout) | Brentaal IV through entire galaxy | HIGH |
| **~3,700 BBY** | **Sith Emperor begins active war preparations** — 250 years of military buildup begins; fleet grows to enormous numbers | Sith Emperor, Dark Council | Dromund Kaas, Unknown Regions | CRITICAL |
| **~3,700 BBY** | Dustig Trace absorbed into Hydian Way at Malastare — route fully established | Malastare trading hub | Malastare | LOW |
| **~3,690 BBY** | Imperial agents begin operating in Republic space; installing puppet governments in Belkadan, Ruuria, Sernpidal | Sith Intelligence, puppet governments | Dalonbian sector | HIGH |
| **~3,685 BBY** | Imperial Navy war games at peak; fleet gathers at staging locations outside Republic space | Sith Imperial Navy, Dark Council | Unknown Regions border | HIGH |
| **~3,682 BBY** | Imperial agents secretly secure alliance with **Chiss Ascendancy** | Sith Intelligence, Chiss Ascendancy | Chiss Space | HIGH |

---

## ═══════════════════════════════════════════════════
## GREAT GALACTIC WAR — 3,681–3,653 BBY
## MAXIMUM DETAIL
## ═══════════════════════════════════════════════════

### Overview
28-year war between Galactic Republic and reconstituted Sith Empire. The Empire returns from 1,300 years of exile — 300 years of military buildup, puppet governments in place, Chiss alliance secured. The Republic is caught completely off-guard. The first decade is a near-continuous Republic rout. The war enters a brutal stalemate after the Republic victory at Bothawui. The Mandalorian Blockade in year 20 nearly collapses the Republic economy. The war ends with the Empire's deceptive Sacking of Coruscant while diplomats negotiate on Alderaan.

---

### Year-by-Year Scripted Events

#### 3,681 BBY — Year 1

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,681 BBY** | **Great Galactic War begins** — Sith fleet destroys Republic diplomatic convoy in Tingel Arm; war declared | Sith Emperor (unseen), Republic diplomats (†) | Tingel Arm | CRITICAL |
| **3,681 BBY** | **Battle of Korriban** — Sith retake holy world; Jedi Master Kao Cen Darach and smuggler Nico Okarr defend orbital station; Darth Malgus (Sith apprentice) kills Darach; Padawan Satelel Shan escapes with Malcom | Darth Vindican, Darth Malgus (apprentice), Jedi Master Kao Cen Darach (†), Padawan Satelel Shan (flees with Jace Malcom and Nico Okarr) | Korriban orbital station | CRITICAL |
| **3,681 BBY** | **Destruction of Sluis Van shipyards** — Sith Imperial Navy destroys Republic manufacturing; kills civilians who refuse to swear fealty | Sith Imperial Navy | Sluis Van | HIGH |
| **3,681 BBY** | **Assault on Tingel Arm** — Republic first war fleet routed; trapped by Sith and Dalonbian puppet systems; forced to scatter to Mirial | Republic fleet, Sith Empire | Tingel Arm, near Belkadan/Sernpidal | HIGH |
| **3,681 BBY** | Sith **blockade the Rimma Trade Route** in Seswenna sector; strangle supply to Republic Outer Rim forces | Sith fleet | Seswenna sector | MEDIUM |
| **3,681 BBY** | Jedi Order recognizes Sith threat; mobilizes volunteers to defend Minos Cluster; Republic public rallies | Jedi volunteers, Republic military, Galactic Senate | Minos Cluster, Coruscant | MEDIUM |
| **3,681 BBY** | Republic breaks Rimma Trade Route blockade | Republic Navy | Seswenna sector | LOW |
| **3,681 BBY** | Darth Marr joins the Sith Dark Council | Darth Marr | Dromund Kaas | MEDIUM |

#### 3,680–3,679 BBY — Years 2-3

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| ~3,680 BBY | Sith seize multiple Outer Rim worlds; Ilum, Dathomir, Manaan (surface cities destroyed), Agamar, Utapau fall | Sith forces | Multiple Outer Rim worlds | MEDIUM |
| **3,678 BBY** | **Battle of Korriban (Republic counterattack)** — Republic acts on intelligence from rogue Sith Exal Kressh; assault fails catastrophically; crushing Republic defeat | Republic fleet, rogue Sith Exal Kressh (arranges distraction, not rescue) | Korriban orbit | MEDIUM |
| **3,678 BBY** | Exal Kressh hunted down and executed by Sith for treason | Sith agents, Exal Kressh (†) | Unknown | LOW |
| **3,678 BBY** | **Battle of Balmorra begins** — most protracted battle of entire war; Sith invade industrial world | Sith Empire, Balmorran resistance, Republic | Balmorra | HIGH |

#### 3,671 BBY — Year 10

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,671 BBY** | Sith advance on Mid Rim after decade of Outer Rim conquest; Seswenna sector fully captured | Sith Empire | Seswenna sector | HIGH |
| **3,671 BBY** | **First Battle of Bothawui** — Admiral Greik concentrates entire Republic fleet; Sith invasion force annihilated — first major Republic victory in ten years | Admiral Greik (Republic), Sith invasion fleet (destroyed) | Bothawui, Mid Rim | CRITICAL |
| **3,671 BBY** | **Second Battle of Bothawui** — Sith return with massive force; Jedi Master Belth Allusis leads 5,000 defenders against 50,000 Sith; Republic defenders hold to last man; both sides sustain massive losses; Sith pyrrhic victory | Jedi Master Belth Allusis (†), 4 Jedi Masters (†), Republic defenders (all †), Sith 50,000-strong army (forced to retreat despite winning) | Bothawui ground | CRITICAL |

#### 3,668–3,667 BBY — Years 13-14

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,668 BBY** | **Dread Masters campaign begins** — Republic warships disappear by the dozens; Dread Masters use terror-based battle meditation; Republic SIS investigates | Dread Masters (6 Sith), Republic SIS | Moving aboard Imperial dreadnought | HIGH |
| **~3,668 BBY** | Dread Masters finally located and captured by Republic strike team after 13 years of shadow operations | Republic SIS, Dread Masters (captured) | Unknown | MEDIUM |
| **3,667 BBY** | **Battle of Alderaan** — Darth Malgus invades Core World; defeated by combined effort of Jedi Knight Satelel Shan, trooper Jace Malcom, and Havoc Squad | Darth Malgus, Jedi Knight Satelel Shan (age ~32), Jace Malcom, Havoc Squad | Alderaan | CRITICAL |
| **~3,667 BBY** | Brief relationship between Jace Malcom and Satelel Shan during/after Alderaan | Jace Malcom, Satelel Shan | Alderaan and aftermath | HIGH |

#### 3,666 BBY — Year 15

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~3,666 BBY** | **Theron Shan born** — Satelel's secret son; given to the Jedi Order; eventually becomes SIS agent | Theron Shan (born), Satelel Shan (mother, keeps secret), Jace Malcom (father) | Unknown | HIGH |
| **3,666 BBY** | Campaign near Gell Mattar | Unknown commanders | Gell Mattar | LOW |

#### 3,665 BBY — Year 16

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,665 BBY** | **Battle of Hoth** — massive naval engagement over ice world; catastrophic Republic fleet losses; Jedi Master Wyellett captured; wreckage rains onto planet | Jedi Master Wyellett (captured), multiple fleet commanders | Hoth space | CRITICAL |

#### 3,664–3,662 BBY — Years 17-19

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,664 BBY** | Mandalorian attack on Republic envoy — new Mandalore consolidating power | Mandalorian clans, New Mandalore | Unknown hyperspace route | MEDIUM |
| **~3,663 BBY** | **Imperial Intelligence sponsors Mandalorian gladiator** through fixed arena victories; becomes Mandalore the Lesser | Imperial Intelligence, Mandalore the Lesser | Nar Shaddaa, Geonosian arena | HIGH |
| **~3,662 BBY** | **Mandalore the Lesser unifies clans** with Imperial backing | Mandalore the Lesser | Mandalorian space | CRITICAL |

#### 3,661 BBY — Year 20

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,661 BBY** | **Blockade of the Hydian Way begins** — Mandalorian cruisers seize Republic's primary trade and military supply route | Mandalore the Lesser, Mandalorian fleet | Hydian Way | CRITICAL |
| **3,661 BBY** | **Battle near Devaron** — Jedi fighter squadrons attempt to break blockade; wiped out | Jedi pilots | Near Devaron, Hydian Way | HIGH |
| **3,661 BBY** | **Coruscant riots begin** — starvation in lower levels; Senate paralyzed; emergency sessions | Coruscant civilians, Republic Senate, Grand Master Zym | Coruscant lower levels | HIGH |
| **3,661 BBY** | Master Ngani Zho takes Theron Shan (age ~5) to Monastery | Master Ngani Zho, Theron Shan | Coruscant → Monastery | LOW |
| **3,661 BBY** | Jedi Temple on rationing as supply disruption hits the Temple | Grand Master Zym, Jedi Order | Jedi Temple, Coruscant | MEDIUM |

#### 3,660 BBY — Year 21

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,660 BBY** | **Battle on the Hydian Way — Blockade broken** — smuggler Hylo Visz leads convoy against Mandalorian fleet; Republic Navy joins after SIS tip; Mandalorians defeated | Hylo Visz (Mirialan), Republic Navy, Mandalorian blockade fleet | Hydian Way | CRITICAL |
| **3,660 BBY** | Coruscant riots end; Temple rationing eases; supply chains restore | Coruscant population, Jedi Temple | Coruscant | HIGH |
| **3,660 BBY** | **Rim Campaign** — Republic pushes back; Battles of Ord Radama, Ashas Ree, Serenno, Ziost | Republic military, Sith forces | Multiple Outer Rim worlds | MEDIUM |

#### 3,659–3,654 BBY — Years 22-27

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| ~3,659 BBY | Republic victories at Alderaan; Sith suffer Core World setbacks | Republic forces, Sith | Alderaan front | HIGH |
| ~3,658 BBY | Republic pushes Sith from approaches to Core at Rhen Var | Republic forces | Rhen Var | HIGH |
| ~3,655 BBY | Multiple mid-war engagements; stalemate continuing | Various commanders | Multiple fronts | MEDIUM |

#### 3,653 BBY — Year 28 (War Ends)

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,653 BBY** | Republic victories at Alderaan and Rhen Var; Dark Council seeks negotiated end | Republic forces, Dark Council | Alderaan, Rhen Var | HIGH |
| **3,653 BBY** | **Dark Council offers peace** — Republic Senate accepts; Jedi Council warns it's a trap but is overruled | Dark Council, Galactic Senate, Grand Master Zym | Alderaan (summit) | CRITICAL |
| **3,653 BBY** | **Battle of Dantooine** — Republic privateer Admiral Zale Barrows defeats Imperial Third Fleet in final major engagement | Admiral Zale Barrows, Imperial Third Fleet | Dantooine | HIGH |
| **3,653 BBY** | **Sacking of Coruscant** — Darth Malgus and Lord Adraas lead a strike team that storms and destroys the Jedi Temple while the Republic's diplomats are away on Alderaan; Darth Angral commands the orbital fleet; Supreme Chancellor Berooken and Grand Master Zym are both killed | Darth Malgus, Lord Adraas, Darth Angral, Supreme Chancellor Berooken (†), Grand Master Zym (†), Jedi Order | Coruscant, Jedi Temple | CRITICAL |
| **3,653 BBY** | **Treaty of Coruscant** — Republic forced to sign; Great War ends; roughly half the galaxy ceded to Sith Empire | Republic diplomats, Sith delegation | Alderaan → Coruscant | CRITICAL |
| **3,653 BBY** | Cold War begins; Jedi Order returns to ruined Coruscant; Senate blames Order | Jedi Order, Republic Senate | Coruscant | CRITICAL |

---

## ════════════════════════════
## COLD WAR — 3,653–3,642 BBY
## ════════════════════════════

### Overview
12 years of tense peace. Both sides rebuild. The Jedi Order, driven from Coruscant, relocates to Tython. Satelel Shan eventually named Grand Master — youngest ever appointed. Border skirmishes and proxy wars continue. The Cold War ends when multiple proxy conflicts collapse simultaneously into open warfare.

**NPC Status Changes Post-Treaty:**
- Grand Master Zym: DEAD (killed during the Sacking of Coruscant, 3,653 BBY)
- Satelel Shan: Eventually becomes Grand Master (not immediately; several interim leaders)
- Darth Malgus: Promoted; growing philosophical tensions with Dark Council
- Jedi Temple on Coruscant: Reconstruction delayed indefinitely by Senate (3,650 BBY)

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,653 BBY** | **Cold War begins** | Both factions | Galaxy-wide | CRITICAL |
| **3,653 BBY** | Jedi Order, reeling from the loss of Grand Master Zym and its Temple, regroups; interim leadership steers the Order through the immediate aftermath | Jedi Council (interim), surviving Masters | Coruscant ruins | HIGH |
| **3,650 BBY** | Senate declares Jedi Temple reconstruction delayed indefinitely | Republic Senate | Coruscant | MEDIUM |
| **~3,648 BBY** | Jedi Order fully relocates to Tython; Satele Shan eventually named Grand Master | Jedi Order, Satelel Shan | Tython | HIGH |
| **~3,645 BBY** | **Ord Mantell Civil War begins** — Republic-Separatist proxy war | Separatist forces, Republic military | Ord Mantell | MEDIUM |
| **~3,645 BBY** | **Alderaan Civil War** — Imperial-backed House Thul vs Republic-backed House Panteer | Alderaanian noble houses | Alderaan | MEDIUM |
| **~3,643 BBY** | **Desolator Crisis** — Darth Angral launches private war on Republic after his son is killed | Darth Angral, The Hero of Tython | Multiple Republic worlds | HIGH |
| **3,642 BBY** | **Cold War collapses** — Galactic War resumes | Both factions | Galaxy-wide | CRITICAL |

---

## ══════════════════════════════════
## GALACTIC WAR (SECOND) — 3,642–3,636 BBY
## ══════════════════════════════════

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,642 BBY** | Balmorra liberated by Republic after ~39 years of occupation | Republic forces, Balmorran resistance | Balmorra | MEDIUM |
| **3,642 BBY** | Taris reconquered by Sith Empire | Imperial forces | Taris | MEDIUM |
| **3,641 BBY** | Treaty of Coruscant formally collapses | Both factions | Galaxy-wide | HIGH |
| **~3,640 BBY** | **Darth Malgus rebels** — proclaims new inclusive Empire; betrays Dark Council | Darth Malgus, Dark Council, The Emperor's Wrath | Multiple worlds | CRITICAL |
| **~3,640 BBY** | **Darth Malgus killed** — his vision of an inclusive Empire ends | Darth Malgus (†) | Multiple worlds | CRITICAL |
| **3,636 BBY** | War Against Zakuul begins — Eternal Empire revealed | Emperor Valkorion/Vitiate, Emperor Arcann, Eternal Fleet | Galaxy-wide | CRITICAL |

---

## LEGACY CHANGE FRAMEWORK

**Era Change (local):** Alters events within one era only. AI improvises within era parameters.
*Example:* Different battle outcome; minor figure dies earlier or survives.

**Faction Change (era + downstream):** Changes faction power, leadership, or trajectory. Ripples forward.
*Example:* Jedi Order keeps military structure after Ruusan → very different Clone Wars.

**Legacy Change (cross-era, CRITICAL events):** Removes or permanently alters a CRITICAL event. Cascades dramatically.
*Example:* Coruscant never sacked → Treaty never happens; Cold War never begins; Jedi stay on Coruscant.

**JS Behavior on Legacy Change:**
1. Scan all scripted events after change date tagged CRITICAL
2. Set status `modified` (faction change) or `cancelled` (causal dependency removed)
3. Push `galaxyEventQueue` notification: "Legacy Change detected"
4. Log to `worldState.lineageRecord`

---

## GALAXY SIM FACTION STATE SEEDS (3,660 BBY)

```javascript
// Year 21 Great Galactic War — blockade just broken by Hylo Visz
factions: {
  jediOrder:    { power:58, morale:55, focus:'Post-blockade recovery; Temple restaffing' },
  sithEmpire:   { power:72, morale:68, focus:'Consolidating Outer Rim; planning next move' },
  republic:     { power:52, morale:58, stability:44 },
  mandalorians: { power:52, morale:48, blockadeActive:false }
},
temple: {
  supplyLevel:68, trainingQuality:78,
  currentFocus:'Recovering from Hydian Way blockade; rationing easing'
}
```

---
*Version 3.1 — Great Galactic War / SWTOR era now complete through Legacy of the Sith (~3,625 BBY). Full Legends timeline from Dawn of the Jedi (36,453 BBY) through the Post-Eternal Empire era.*

---

## ══════════════════════════════════
## WAR AGAINST ZAKUUL — 3,636–3,628 BBY
## ══════════════════════════════════

### Overview
The Eternal Empire of Zakuul, hidden in Wild Space under Emperor Valkorion (who is the Sith Emperor Vitiate inhabiting a new body), launches a lightning conquest. Both the Republic and Sith Empire are defeated within a year and forced to pay tribute. The galaxy is dominated by Zakuul for five years. The war ends when the figure known as the Commander forms the Eternal Alliance and defeats Emperor Arcann, then Empress Vaylin, and finally purges the Sith Emperor Vitiate's spirit permanently. The post-Zakuul period — Iokath, the Nathema Conspiracy, Malgus's return, Onslaught, and Legacy of the Sith — is covered in the section immediately following.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,636 BBY** | **Eternal Empire raids begin** — Zakuulan twin princes Arcann and Thexan lead raids on Korriban and other worlds to test strength | Arcann, Thexan, Darth Marr | Korriban and multiple worlds | CRITICAL |
| **3,636 BBY** | Darth Marr leads joint Imperial-Republic expedition into Wild Space to pursue the raiders; fleet ambushed and destroyed | Darth Marr (†), The Outlander (captured), Eternal Fleet | Wild Space border | CRITICAL |
| **3,636 BBY** | **Valkorion killed** — the Outlander is brought before Valkorion on Zakuul; Arcann attempts to kill his own father; Outlander is blamed; Valkorion's spirit enters the Outlander | Valkorion/Vitiate (†, spirit survives in Outlander), Arcann, The Outlander | Zakuul, the Spire | CRITICAL |
| **3,636 BBY** | **Arcann seizes Eternal Throne** — declares the Outlander killed his father; launches full conquest of the galaxy | Emperor Arcann, Eternal Fleet | Zakuul | CRITICAL |
| **3,636 BBY** | **Eternal Empire conquest** — Eternal Fleet defeats both Republic and Sith Empire fleets; both powers forced to surrender and pay tribute | Emperor Arcann, Eternal Fleet, Republic, Sith Empire | Galaxy-wide | CRITICAL |
| **3,636 BBY** | **Outlander frozen in carbonite** — imprisoned on Zakuul for five years | The Outlander | Zakuul | CRITICAL |
| **3,636–3,631 BBY** | Five years of Zakuulan dominance — both galactic powers pay tribute; Arcann rules; Vaylin (his sister) serves as High Justice; rebel cells begin forming | Emperor Arcann, Vaylin, Lana Beniko (resistance), Theron Shan (resistance) | Galaxy-wide | HIGH |
| **3,631 BBY** | **Outlander freed from carbonite** by Lana Beniko and defector Koth Vortena; escapes Zakuul on the legendary ship Gravestone | The Commander/Outlander, Lana Beniko, Koth Vortena | Zakuul, the Endless Swamp | CRITICAL |
| **3,631 BBY** | **Battle of Asylum** — Outlander's group escapes with the Gravestone; destroys several Eternal Fleet warships; proves the Eternal Fleet can be beaten | The Commander, Senya Tirall (joins), Eternal Fleet | Wild Space, near Zakuul | HIGH |
| **~3,630 BBY** | **Eternal Alliance formed** — Commander builds coalition of Jedi, Sith, Republic, Imperial, and independent forces on Odessen | The Commander, Lana Beniko, Theron Shan, various allies | Odessen base | CRITICAL |
| **~3,630 BBY** | **Battle of Odessen** — Arcann attacks the Alliance base; defeated by the Commander; his mother Senya Tirall takes him away for redemption | The Commander, Emperor Arcann (defeated, redeems), Senya Tirall | Odessen | CRITICAL |
| **~3,630 BBY** | **Empress Vaylin seizes Eternal Throne** after Arcann's defeat | Empress Vaylin | Zakuul | HIGH |
| **~3,630 BBY** | **Vaylin killed** — the Commander defeats and kills Vaylin; Vitiate's spirit uses the moment to try to possess the Commander | Vaylin (†), The Commander, Valkorion/Vitiate (spirit, final attempt) | Zakuul | CRITICAL |
| **~3,630 BBY** | **Valkorion/Vitiate destroyed permanently** — Commander rejects Vitiate's offered power; destroys his spirit; Sith Emperor finally dies after 1,500+ years | The Commander, Valkorion/Vitiate/Tenebrae (†, permanently) | Zakuul | CRITICAL |
| **~3,628 BBY** | **Eternal Alliance dissolves** — Eternal Fleet and Gravestone lost to Order of Zildrog campaign; Eternal Empire formally ends; Zakuul transitions to elected government | The Commander, Vinn Atrius (Order of Zildrog leader, †) | Odessen, Zakuul | HIGH |

---

## ══════════════════════════════════════════════════
## POST-ETERNAL EMPIRE / LATE SWTOR ERA — ~3,630–3,625 BBY
## ══════════════════════════════════════════════════

### Overview
The fall of the Eternal Empire leaves a power vacuum quickly filled by renewed Republic–Sith Empire hostilities. The Commander's Eternal Alliance, weakened and stripped of the Gravestone and Eternal Fleet, must navigate increasingly dangerous galactic politics. The ancient machine-world **Iokath** becomes a flashpoint between all factions. Fanatical forces attempt to destroy the Alliance from within. Darth Malgus — believed dead since the fall of his New Empire at Ilum (~3,640 BBY) — resurfaces with a hidden agenda tied to the deepest secrets of Sith history. A full-scale Republic–Empire war resumes, drawing the Commander back into military operations. This era concludes the SWTOR story arc.

> **Continuity note:** These expansions (Iokath, Jedi Under Siege, Onslaught, Legacy of the Sith) were released after Disney's acquisition of Lucasfilm and the end of official Legends publishing, but are treated as canonical extensions of the Legends SWTOR story — a direct continuation of the same characters, factions, and timeline established in the original game and expansions. No Disney-era characters or events outside the SWTOR game narrative are included.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~3,630 BBY** | **Iokath discovered** — the ancient machine-world surfaces as a galactic crisis point; both Republic and Sith Empire dispatch fleets; the world's dormant god-droid war machines (TYTH, AIVELA, ESNE, NAHUT) begin activating | The Commander, Theron Shan, Lana Beniko, Republic and Imperial forces | Iokath (Unknown Regions/Wild Space) | CRITICAL |
| **~3,630 BBY** | **Commander chooses Republic or Empire** — the Alliance must align with one side to hold Iokath; a defining strategic decision that reshapes the post-Eternal Empire political landscape | The Commander, Republic or Imperial liaison | Iokath | CRITICAL |
| **~3,630 BBY** | **Machine gods defeated** — TYTH, AIVELA, ESNE, and NAHUT — ancient Iokath weapon-deities — destroyed by the Commander's forces; ARIES superweapon contained; Iokath's immediate threat neutralized but the planet remains contested | The Commander, Theron Shan, Lana Beniko | Iokath | HIGH |
| **~3,629 BBY** | **Theron Shan apparently defects** — the Alliance's chief intelligence officer publicly betrays the Commander and joins a mysterious cult; galaxy stunned | Theron Shan (apparent defector), The Commander, Lana Beniko | Multiple worlds | HIGH |
| **~3,629 BBY** | **The Nathema Conspiracy** — Theron Shan's defection is revealed as a deep-cover infiltration of the **Order of Zildrog** — a fanatical cult bent on resurrecting the ancient weapon ZILDROG to destroy the Commander and the Alliance; Theron exposes and crushes the cult from within | Theron Shan, Vinn Atrius (Order of Zildrog, †), The Commander, Lana Beniko | Nathema (the dead world drained by Vitiate) | CRITICAL |
| **~3,629 BBY** | **Nathema explored** — the dead world where Vitiate/Tenebrae first conducted his planet-draining ritual ~1,300 years prior is fully documented; every living thing on the planet's surface was consumed; an eerie Force-void that deeply disturbs any Force-sensitive who visits | The Commander, Theron Shan | Nathema | HIGH |
| **~3,629 BBY** | **Echoes of Oblivion** — the last surviving spiritual echoes of Vitiate/Valkorion (fragments of his shattered consciousness that lingered in hidden locations) are tracked down and permanently destroyed, completing the eradication of the Sith Emperor | The Commander, Lana Beniko | Various ritual sites | CRITICAL |
| **~3,629 BBY** | **Ossus Jedi Academy established** — the Jedi Order founds a new training academy on Ossus; a gesture of rebuilding and reconciliation with the Republic; both Jedi students and colonists settle there | Jedi Order, Republic | Ossus | HIGH |
| **~3,629 BBY** | **Jedi Under Siege — Sith assault Ossus** — the Sith Empire launches a devastating assault on the new Ossus Jedi Academy and its civilian colonists; the attack mirrors the Massacre at Ossus ~127 years in the future; heavy casualties among Jedi and colonists | Sith Imperial forces, Jedi Order | Ossus | CRITICAL |
| **~3,629 BBY** | **Darth Malgus revealed alive** — the legendary Sith Lord, believed killed at the Battle of Ilum (~3,640 BBY), resurfaces during the Ossus assault; he has been in hiding for over a decade pursuing a hidden agenda; allied with neither the Sith Dark Council nor the Commander — he has his own faction and his own goals | Darth Malgus (alive), Sith Empire, Jedi Order | Ossus | CRITICAL |
| **~3,626 BBY** | **Onslaught — full Republic–Empire war resumes** — five years of proxy conflict and cold maneuvering collapses into open large-scale war; both factions mobilize; the Commander is drawn back into major military operations | The Commander, Republic and Empire forces | Galaxy-wide; Onderon, Mek-Sha, Corellia | CRITICAL |
| **~3,626 BBY** | **Battle of Onderon** — significant engagement in the resumed war; both factions contest the world | Republic forces, Sith Empire, The Commander | Onderon | HIGH |
| **~3,626 BBY** | **Mek-Sha contested** — the independent Hutt mining station becomes a flashpoint; both sides attempt to secure it and its strategic hyperlane position | The Commander, Republic and Imperial agents, Hutt clans | Mek-Sha (asteroid station) | MEDIUM |
| **~3,626 BBY** | **Malgus's Eye emerges** — Darth Malgus's secret organization, called the Eye, is revealed to be operating parallel to the war; pursuing Sith artifacts and ancient knowledge at the direction of a hidden master; not fully aligned with the Dark Council | Darth Malgus, Eye agents | Multiple sites | HIGH |
| **~3,625 BBY** | **Manaan Campaign** — conflict extends to the oceanic world of Manaan, primary source of Kolto medical supplies; both sides desperate to control it; the Commander fights on and beneath Manaan's seas | The Commander, Republic and Sith forces | Manaan | HIGH |
| **~3,625 BBY** | **Legacy of the Sith — Malgus's secret revealed** — Darth Malgus is pursuing the hidden records of the original Sith Emperor (Vitiate/Tenebrae), seeking something Vitiate concealed even from the Dark Council — the deepest secrets of the ancient Sith and the nature of Sith power itself | Darth Malgus, The Commander | Elom, Manaan | CRITICAL |
| **~3,625 BBY** | **Elom excavation** — Malgus forces excavate a buried site on Elom, recovering ancient Sith artifacts related to the Emperor's earliest work; the Commander opposes them | Darth Malgus, The Commander, Sith archaeologists | Elom | HIGH |

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
| **~1,990 BBY** | **Darth Ruin killed by his own disciples** — Sith infighting destroys the first New Sith leadership before the war fully begins; chaos follows | Darth Ruin (†, killed by own disciples), Sith factions | Unknown | HIGH |
| **~1,900–1,500 BBY** | **Sictis Wars** — one of the major named conflicts of the New Sith Wars; Sith score significant victories | Multiple Sith warlords | Multiple fronts | HIGH |
| **~1,100 BBY** | **Battle of Mizra** — pivotal battle; Republic nearly collapses; turns out to be the lowest point before gradual Republic recovery | Unknown Jedi commander, New Sith forces | Mizra | HIGH |
| **~1,100 BBY** | **Republic Dark Age** — Sith control large sections of the galaxy; Republic government barely functions in some eras | New Sith warlords, Republic remnant | Multiple worlds | HIGH |
| **~1,010 BBY** | **Lord Hoth forms Army of Light** — consolidates Jedi Order's fighting strength into single independent military force of seven Legions | Jedi Lord Hoth, Jedi Lord Valenthyne Farfalla, Jedi Lord Pernicar | Republic space | HIGH |
| **~1,010 BBY** | **Lord Kaan forms Brotherhood of Darkness** — reorganizes warring Sith factions into unified force 20,000+ strong; abandons tradition of single Dark Lord; everyone shares the title; builds headquarters on Roon | Lord Skere Kaan, Lords Qordis, Kopecz, Githany (spy), and others | Roon, Korriban | CRITICAL |
| **~1,010 BBY** | **Brotherhood of Darkness seizes Korriban** — symbolic assault on ancient Sith homeworld still nominally under Republic control | Lord Kaan, Brotherhood of Darkness | Korriban | HIGH |
| **~1,002 BBY** | **Ruusan campaign begins** — Army of Light and Brotherhood of Darkness clash on Ruusan; seven major battles over two years | Lord Hoth, Lord Kaan | Ruusan | CRITICAL |
| **~1,002 BBY** | **First Battle of Ruusan** — Sith total victory; every Republic soldier killed; no survivors on Republic side | Lord Kaan, Republic Army (all †) | Ruusan | HIGH |
| **~1,001 BBY** | **Second and Third Battles of Ruusan** — Hoth brings Army of Light; retakes Ruusan | Lord Hoth, Lord Kaan | Ruusan | MEDIUM |
| **~1,001 BBY** | **Fourth Battle of Ruusan** — Kaan brings full Brotherhood in ground battle; raw Force power devastates planet surface; civilian refugees flee; fierce fighting | Lord Hoth, Lord Kaan, Darth Bane (early appearance) | Ruusan surface | HIGH |
| **~1,001–1,000 BBY** | **Darth Bane emerges** — self-trained Sith who learned from Darth Revan's holocron; disgusted by Brotherhood's weakness; wants to destroy them and rebuild Sith properly | Darth Bane, Lord Kaan (fears him) | Ruusan | CRITICAL |
| **~1,001 BBY** | **Lord Pernicar killed** — Hoth's closest friend; Hoth blames Farfalla; temporary rift between Jedi commanders | Lord Pernicar (†), Lord Hoth, Lord Valenthyne Farfalla | Ruusan | MEDIUM |
| **~1,001 BBY** | **Massacre on Ruusan** — Bane guides the Brotherhood into a joint Force wave meditation that devastates Army of Light; Kaan breaks formation early out of fear of Bane's power | Lord Hoth (wounded), Army of Light (heavy losses), Darth Bane (orchestrating from shadows) | Ruusan | HIGH |
| **1,000 BBY** | **Seventh Battle of Ruusan** — Bane manipulates Brotherhood into combat while secretly ordering Sith fleet to break formation; Jedi gain upper hand; Kaan forced to retreat to caves | Lord Valenthyne Farfalla (Jedi victory), Lord Kopecz (†, warns Farfalla of Kaan's plan), Lord Kaan | Ruusan, orbit | CRITICAL |
| **1,000 BBY** | **Thought Bomb** — Kaan convinced by Bane that the Thought Bomb will destroy only the Jedi; in truth it kills all Force-sensitives in radius; Lord Hoth leads 100 Jedi into the cave knowing they will die | Lord Hoth (†, leads sacrifice), 99 Jedi (†), Lord Skere Kaan (†), entire Brotherhood of Darkness (†) | Ruusan caves | CRITICAL |
| **1,000 BBY** | **Darth Bane survives alone** — as the only Sith not in the cave; finds young girl Zannah among the aftermath; takes her as his apprentice | Darth Bane, Darth Zannah ("Rain", young girl found after battle) | Ruusan surface | CRITICAL |
| **1,000 BBY** | **Rule of Two established** — one Master to embody power; one apprentice to crave it; Sith go underground; all strength concentrated in two instead of dispersed across thousands | Darth Bane, Darth Zannah | Ruusan | CRITICAL |
| **1,000 BBY** | **New Sith Wars end** — Sith believed extinct; Republic celebrates | Galactic Republic, Jedi Order | Galaxy-wide | CRITICAL |
| **1,000 BBY** | **Ruusan Reformations** — Supreme Chancellor Tarsus Valorum restructures Republic; Jedi disarm and become peacekeepers not soldiers; Jedi codified under Judicial Department; new calendar set to this year as year zero | Supreme Chancellor Tarsus Valorum, Jedi Council | Coruscant | CRITICAL |
| **1,000 BBY** | Valley of the Jedi established on Ruusan — mausoleum for fallen warriors; Force nexus where the spirits of the fallen Jedi and Sith are trapped | Jedi Knight Johun Othone (petitioned), Republic Senate | Ruusan | MEDIUM |

---

## ══════════════════════════════════════
## REPUBLIC ERA (GREAT PEACE) — 1,000–22 BBY
## ══════════════════════════════════════

### Overview
One thousand years of peace. The Sith operate in total secrecy under the Rule of Two. Each generation: one Master trains one apprentice, who eventually kills the Master and takes their own apprentice. The chain: Bane → Zannah → Cognus → Millennial (defects) → Cognus replaces Millennial → Vectivus → … → Plagueis → Sidious → Maul (apprentice, killed at Naboo) → Tyranus/Dooku → (Vader). The Republic prospers but becomes increasingly corrupt and bureaucratic. The Jedi Order grows complacent. The Grand Plan unfolds.

#### The Rule of Two Succession Chain

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~990 BBY** | **Darth Bane killed by Darth Zannah** — after years of training; Zannah defeats him and becomes Dark Lord; takes Darth Cognus ("The Huntress", an Iktotchi assassin) as her apprentice | Darth Zannah, Darth Bane (†), Darth Cognus (new apprentice) | Ambria | HIGH |
| **~980 BBY** | **Darth Millennial defects** — Cognus's apprentice; believes Rule of Two too restrictive; proposes Rule of Many; Cognus tries to kill him; he escapes to Dromund Kaas | Darth Cognus, Darth Millennial (defects, †, eventually) | Unknown → Dromund Kaas | HIGH |
| **~980 BBY** | Darth Millennial founds **Prophets of the Dark Side** on Dromund Kaas — dark side religion; persists for centuries | Darth Millennial | Dromund Kaas | MEDIUM |
| **~970 BBY** | Darth Cognus finds new apprentice to continue the chain | Darth Cognus, unknown apprentice | Unknown | MEDIUM |
| **~700 BBY** | **Darth Vectivus** — a business executive who discovered a dark side nexus on Had Abbadon; unusually ethical for a Sith; does not cause mass death; passes his title to an apprentice peacefully | Darth Vectivus | Had Abbadon asteroid | MEDIUM |
| **~700–500 BBY** | Rule of Two continues through unknown Masters and apprentices; Sith biding time | Various Sith | Hidden | MEDIUM |
| **~500 BBY** | **Darth Plagueis (Hego Damask) born** — Muun species; operates as business magnate as cover; obsessed with midi-chlorian manipulation and cheating death | Darth Plagueis | Muunilinst area | HIGH |
| **~132 BBY** | **Count Dooku born** on Serenno | Dooku | Serenno | HIGH |
| **~132 BBY** | **Darth Plagueis takes unknown apprentice** (chain continues) | Darth Plagueis | Unknown | MEDIUM |
| **~92 BBY** | **Qui-Gon Jinn born** | Qui-Gon Jinn | Unknown homeworld | HIGH |
| **~88 BBY** | Dooku taken into the Jedi Order as an infant; placed in Yoda's care | Dooku (young), Yoda | Coruscant | HIGH |
| **~82 BBY** | **Palpatine born** on Naboo; Force-sensitive; discovered by Darth Plagueis during Palpatine's youth | Palpatine/Darth Sidious | Naboo | CRITICAL |
| **~72 BBY** | **Mace Windu born** on Haruun Kal | Mace Windu | Haruun Kal | HIGH |
| **~67 BBY** | **Palpatine kills Darth Plagueis's Master** — Plagueis takes Palpatine as apprentice Darth Sidious | Darth Plagueis, Darth Sidious | Unknown | CRITICAL |
| **~57 BBY** | **Obi-Wan Kenobi born** on Stewjon | Obi-Wan Kenobi | Stewjon | HIGH |
| **~54 BBY** | **Darth Maul taken by Sidious** (approximate) — a Dathomirian Zabrak discovered and claimed by Darth Sidious as a child; raised in secret and trained as his Sith apprentice | Darth Maul, Darth Sidious | Dathomir → hidden | HIGH |
| **~52 BBY** | **Dooku attains the rank of Jedi Master** — one of the Order's most respected swordsmen; trains his own Padawans over the following decades | Dooku, Yoda | Coruscant | MEDIUM |
| **~44 BBY** | **Qui-Gon Jinn selects Obi-Wan Kenobi as Padawan** (Obi-Wan age ~13; nearly sent to Agri-Corps) | Qui-Gon Jinn, Obi-Wan Kenobi (age 13) | Coruscant | HIGH |
| **~42 BBY** | **Palpatine elected Senator of Naboo** — begins his political ascent | Palpatine | Naboo, Coruscant | HIGH |
| **~41 BBY** | **Anakin Skywalker born** — conceived by midi-chlorians alone (the Chosen One prophecy) | Anakin Skywalker, Shmi Skywalker | Tatooine | CRITICAL |
| **~32 BBY** | **Darth Plagueis murdered** in his sleep by Darth Sidious — Sidious ends the cycle by killing his Master before being replaced | Darth Plagueis (†), Darth Sidious | Unknown | HIGH |

#### Rise of the Empire — 32–22 BBY

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **32 BBY** | **Trade Federation blockades Naboo** — Darth Sidious manipulates Trade Federation into crisis | Nute Gunray, Darth Sidious | Naboo space | CRITICAL |
| **32 BBY** | **Qui-Gon and Obi-Wan sent to negotiate** — find Gungan Jar Jar Binks; escape with Queen Padmé Amidala | Qui-Gon Jinn, Obi-Wan Kenobi, Padmé Amidala, Jar Jar Binks | Naboo | HIGH |
| **32 BBY** | **Anakin Skywalker found on Tatooine** — Qui-Gon convinced Anakin is the Chosen One; buys his freedom; wins it via pod race | Qui-Gon Jinn, Anakin Skywalker (age 9), Watto, Shmi Skywalker | Tatooine | CRITICAL |
| **32 BBY** | **Jedi Council rejects Anakin** — too old; too strong; fear in him; Qui-Gon vows to train him anyway | Qui-Gon Jinn, Anakin Skywalker, Mace Windu, Yoda, Jedi Council | Coruscant | HIGH |
| **32 BBY** | **Battle of Naboo** — Republic and Gungan forces liberate Naboo; Darth Maul vs. Qui-Gon and Obi-Wan in the Theed generator complex | Qui-Gon Jinn (†), Darth Maul, Obi-Wan Kenobi, Padmé Amidala, Anakin Skywalker | Naboo, Theed | CRITICAL |
| **32 BBY** | **Qui-Gon Jinn killed; Darth Maul defeated** — Maul kills Qui-Gon; Obi-Wan then cuts Maul in half. In core Legends, Maul is killed here (see continuity note in the Clone Wars section) | Qui-Gon Jinn (†), Darth Maul (†, core Legends), Obi-Wan Kenobi | Theed generator complex | CRITICAL |
| **32 BBY** | Obi-Wan knighted; vows to train Anakin as his Padawan | Obi-Wan Kenobi (age 25), Anakin Skywalker (Padawan) | Coruscant | CRITICAL |
| **32 BBY** | **Palpatine elected Supreme Chancellor** by sympathy vote after Naboo crisis | Palpatine, Galactic Senate | Coruscant | CRITICAL |
| **~32 BBY** | **Dooku leaves the Jedi Order** — disillusioned after the Battle of Naboo and Qui-Gon's death; returns to Serenno as Count; is later taken by Sidious as the new Sith apprentice Darth Tyranus, replacing the slain Maul | Dooku/Darth Tyranus, Darth Sidious, Yoda | Coruscant → Serenno | CRITICAL |
| **~25 BBY** | **Separatist Crisis intensifies** — Dooku/Tyranus recruits thousands of systems to the Confederacy of Independent Systems | Dooku/Darth Tyranus, Viceroy Gunray, San Hill, others | Outer Rim, Coruscant | HIGH |
| **~24 BBY** | **Jedi discover clone army on Kamino** — ordered ten years ago by deceased Jedi Master Sifo-Dyas; secretly engineered by Darth Tyranus | Obi-Wan Kenobi (discovers), Jango Fett (template), Kaminoans | Kamino | CRITICAL |

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
| **22 BBY** | **Battle of Jabiim** — Republic fails; Anakin nearly killed; many Padawans die heroically holding the line; Obi-Wan believed dead | Anakin Skywalker, multiple Padawans (†) | Jabiim | HIGH |
| **21 BBY** | **Second Battle of Geonosis** — Republic destroys new Separatist droid foundries | Anakin Skywalker, Obi-Wan Kenobi, Luminara Unduli, Ki-Adi-Mundi | Geonosis | HIGH |
| **21 BBY** | **Battle of Mon Calamari** — Republic and Mon Calamari forces defeat Quarren and Separatist invaders; Prince Lee-Char becomes King | Kit Fisto, Prince Lee-Char, Ackbar (young) | Mon Calamari | MEDIUM |
| ~21 BBY | **Battle of Jabiim (continued campaign)** — protracted, brutal mud-world siege; one of the costliest Republic campaigns of the war | Obi-Wan Kenobi (theater commander), Anakin Skywalker, Alpha-17 | Jabiim | HIGH |
| ~20 BBY | **Battle of Mygeeto begins** — two-year siege of a crystalline Banking Clan world; grinds on through the rest of the war | Ki-Adi-Mundi, multiple Jedi Generals | Mygeeto | MEDIUM |
| ~20 BBY | **Battle of Felucia** — multiple engagements; Republic holds the strategic fungal world | Aayla Secura, various Jedi | Felucia | MEDIUM |
| ~19 BBY | **Outer Rim Sieges begin** — Republic major offensive pushes into Separatist-held Outer Rim; Jedi Generals deliberately spread thin and separated from Coruscant by Sidious | Obi-Wan Kenobi (Cato Neimoidia/Utapau), multiple Jedi Generals | Multiple Outer Rim worlds | CRITICAL |
| *Note on Darth Maul* | In core Legends, Maul was killed by Obi-Wan at Naboo in 32 BBY and did not return. Some later Legends-era Clone Wars tie-in comics (*Death Sentence*, *Son of Dathomir*) depict a survival with Savage Opress, but his Mandalore/Duchess Satine arc is Disney canon only and does not occur in Legends. | — | — | — |
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
| **19 BBY** | **Battle of Mustafar** — Vader kills Separatist Council; Obi-Wan confronts Vader; duel on volcanic world; Vader loses three limbs and is immolated; Obi-Wan leaves him | Darth Vader (maimed), Obi-Wan Kenobi, Separatist Council (all †) | Mustafar | CRITICAL |
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
| **~19 BBY** | **Obi-Wan exiles to Tatooine as "Ben Kenobi"** — settles into a quiet hermit's life watching over Luke from a distance; this exile remains uneventful and uninterrupted until 0 BBY | Obi-Wan Kenobi | Tatooine | HIGH |
| **~19 BBY** | **Great Jedi Purge continues** — Darth Vader and the Inquisitorius systematically hunt the scattered surviving Jedi across the galaxy | Darth Vader, the Grand Inquisitor, multiple Inquisitors | Galaxy-wide | CRITICAL |
| **~19 BBY** | **Order 66 survivors go underground** — Quinlan Vos, Ferus Olin, Rahm Kota, Roan Shryne, and others scatter into hiding | Multiple Jedi survivors | Varied hiding places | HIGH |
| **~19 BBY** | **Obi-Wan learns Vader survived** — at Tosche Station, Obi-Wan glimpses a HoloNet image of the armored Darth Vader (fresh from the conquest of Kashyyyk) and realizes Anakin did not die on Mustafar | Obi-Wan Kenobi, Darth Vader (image only) | Tatooine, Tosche Station | MEDIUM |
| **~18 BBY** | **Order of the Inquisitorius formally established** — Vader-trained, Force-sensitive Jedi hunters operating under Sidious | Darth Vader, the Grand Inquisitor | Mustafar, then Imperial Center | HIGH |
| **~18 BBY** | **Last of the Jedi era** — Obi-Wan protects Luke's moisture-farming community from Jabba's syndicate; fends off the dark Wookiee enforcer Black Krrsantan | Obi-Wan Kenobi, Black Krrsantan, Jabba's syndicate | Tatooine | LOW |
| **~10 BBY** | **Han Solo enters the Imperial Academy at Carida** — serves with distinction before being expelled | Han Solo | Carida | MEDIUM |
| **~10 BBY** | **Han Solo saves Chewbacca** — stops an Imperial officer from beating the Wookiee; is expelled from the Imperial Navy; Chewbacca swears a life debt to him | Han Solo, Chewbacca | Imperial post | HIGH |
| **~10 BBY** | **Han Solo becomes a smuggler** — escapes Garris Shrike's grasp permanently; falls in love with Bria Tharen; begins smuggling, eventually for Jabba the Hutt | Han Solo, Garris Shrike (†, eventually), Bria Tharen, Chewbacca | Various worlds | LOW |
| **~5 BBY** | **Corellian Treaty signed** — Bail Organa, Mon Mothma, and Garm Bel Iblis formally unite their three separate resistance movements into the Alliance to Restore the Republic | Mon Mothma, Bail Organa, Garm Bel Iblis | Corellia | CRITICAL |
| **~4 BBY** | **Death Star construction underway** — the Empire builds the battle station in secret over the prison world Despayre in the Horuz system | Grand Moff Tarkin, Bevel Lemelisk (designer) | Horuz system, Despayre | HIGH |
| **~3 BBY** | **Rebel intelligence confirms the superweapon** — the Bothan Spynet and Ralltiir operatives gather evidence of a massive Imperial battle station | Bothan Spynet, Basso (Ralltiir spy), Lord Tion (†) | Ralltiir, various | HIGH |
| **~0 BBY** | **Theft of the Death Star plans (Danuta)** — Mon Mothma recruits Imperial defector Kyle Katarn and mercenary Rianna Saren to infiltrate the Imperial outpost on Danuta; Katarn steals a memory matrix containing a set of the plans | Kyle Katarn, Rianna Saren, Jan Ors, Mon Mothma | Danuta | CRITICAL |
| **~0 BBY** | **Battle of Toprawa (Operation Skyhook)** — Rebel operatives on Toprawa capture an Imperial transmission facility and hold it just long enough to transmit a second set of plans (superlaser data) to the fleet; the Toprawa rebels and Bothan agents suffer heavy losses | Toprawa Rebel cell, Havet Storm, Bothan agents | Toprawa | CRITICAL |
| **~0 BBY** | **Plans consolidated and transmitted to the Tantive IV** — Katarn's Danuta plans, the Toprawa superlaser data, and intercepted AX-235 technical data are combined and passed to Princess Leia Organa aboard the Tantive IV | Princess Leia Organa, Darth Vader (pursuing) | Toprawa system → Tantive IV | CRITICAL |

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
| **~1 ABY** | **Lando Calrissian becomes Baron-Administrator of Cloud City** on Bespin | Lando Calrissian | Bespin | MEDIUM |
| **3 ABY** | **Battle of Hoth** — Imperial fleet locates Echo Base; Rebels evacuate under fire; Han and Leia escape; Luke goes to Dagobah | Darth Vader, Admiral Piett, Luke Skywalker, Han Solo, Leia Organa, General Veers | Hoth | CRITICAL |
| **3 ABY** | **Luke trains with Yoda on Dagobah** — discovers he must face Vader; leaves too soon against Yoda's advice | Luke Skywalker, Yoda, Obi-Wan Kenobi (Force ghost) | Dagobah | CRITICAL |
| **3 ABY** | **Han Solo frozen in carbonite** — Vader uses Cloud City as trap; Lando betrays then helps rebels; Boba Fett takes Han to Jabba | Darth Vader, Han Solo (carbonite), Leia Organa, Lando Calrissian, Boba Fett | Cloud City, Bespin | HIGH |
| **3 ABY** | **Duel at Cloud City — "I am your father"** — Luke vs. Vader; Luke loses his hand; Vader reveals he is Luke's father; Luke escapes rather than join him | Luke Skywalker (loses hand), Darth Vader | Cloud City | CRITICAL |
| **4 ABY** | **Rescue of Han Solo** — Luke, Leia, Lando infiltrate Jabba's palace; Leia kills Jabba; everyone escapes | Luke Skywalker, Han Solo, Leia Organa, Lando Calrissian, Jabba Desilijic Tiure (†) | Tatooine, Jabba's palace | HIGH |
| **4 ABY** | **Yoda dies** — at age 900; confirms Darth Vader is Luke's father; cryptically implies "another" Skywalker | Yoda (†, becomes Force ghost) | Dagobah | HIGH |
| **4 ABY** | **Battle of Endor — Death Star II destroyed** — Palpatine's trap to lure the fleet; Alliance attacks; Ewoks help on surface; Luke surrenders himself to Vader | Luke Skywalker, Darth Vader, Emperor Palpatine, Han Solo, Leia Organa, Admiral Ackbar, Lando Calrissian, Ewoks | Endor, Death Star II | CRITICAL |
| **4 ABY** | **Emperor Palpatine kills Luke with Force lightning** — Vader watches as his son is tortured; Anakin Skywalker reasserts himself | Emperor Palpatine, Luke Skywalker (dying), Darth Vader (watching) | Death Star II | CRITICAL |
| **4 ABY** | **Darth Vader redeemed** — Anakin Skywalker throws Palpatine into the reactor; mortally wounded by the lightning | Anakin Skywalker/Darth Vader, Emperor Palpatine (†) | Death Star II | CRITICAL |
| **4 ABY** | **Anakin Skywalker dies** — asks Luke to remove his mask; sees his son with his own eyes; becomes one with the Force | Anakin Skywalker (†, Force ghost), Luke Skywalker | Death Star II | CRITICAL |
| **4 ABY** | **Galactic Empire fragments** — with Palpatine and Vader dead and no clear succession, the Empire splinters; Imperial Moffs and admirals become warlords seizing territory; the **First Imperial Civil War** begins | Sate Pestage (regent), Ysanne Isard (Imperial Intelligence), multiple Imperial warlords | Galaxy-wide | CRITICAL |
| **4 ABY** | **Alliance of Free Planets formed** — transitional civilian government immediately after Endor | Mon Mothma, Leia Organa, Alliance leadership | Endor → various | HIGH |
| **4 ABY** | **New Republic founded** — one month after the Declaration of the Alliance of Free Planets; the Alliance to Restore the Republic is formally reconstituted as the New Republic | Mon Mothma (first Chief of State), Leia Organa, Admiral Ackbar | Chandrila | CRITICAL |
| **4 ABY** | **Nagai–Tof War** — extragalactic Nagai and Tof invaders attack; Empire and New Republic briefly ally against them | New Republic, Imperial Remnant, Nagai, Tof | Endor, Iskalon, Zeltros | MEDIUM |

---

## ═══════════════════════════════════
## NEW REPUBLIC ERA — 4–25 ABY
## ═══════════════════════════════════

### Overview
The New Republic fights to consolidate power against a fragmenting Empire. The Empire tears itself apart in the First Imperial Civil War as dozens of warlords feud. Ysanne Isard holds Coruscant then Thyferra before being defeated in the Bacta War. Grand Admiral Thrawn nearly reverses the war in 9 ABY before being assassinated. The reborn Emperor Palpatine returns via clones (Dark Empire) and is permanently destroyed ~11 ABY. Admiral Daala executes the squabbling warlords ~12 ABY, and Gilad Pellaeon consolidates the survivors into the Imperial Remnant. The war finally ends with the Pellaeon–Gavrisom Treaty (Bastion Accords) in 19 ABY.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **4–5 ABY** | **First Imperial Civil War rages** — the Empire fractures into feuding warlord states across the galaxy; the New Republic exploits the chaos to liberate world after world | Ysanne Isard, Sate Pestage, multiple Imperial warlords, New Republic | Galaxy-wide | HIGH |
| **~6 ABY** | **Luke Skywalker recovers Jedi lore** — seeks out surviving Jedi knowledge; begins to plan the Order's restoration | Luke Skywalker | Various worlds | HIGH |
| **6–7 ABY** | **Liberation of Coruscant** — New Republic captures the Imperial capital; Ysanne Isard's hold on the Core broken; she retreats to Thyferra | Wedge Antilles, Rogue Squadron, Ysanne Isard, Mon Mothma | Coruscant | HIGH |
| **7–8 ABY** | **Bacta War** — Ysanne Isard seizes Thyferra and weaponizes the galaxy's bacta supply; Rogue Squadron (gone independent) defeats her | Ysanne Isard (defeated), Wedge Antilles, Rogue Squadron | Thyferra | MEDIUM |
| **~9 ABY** | **Thrawn Campaign** — Grand Admiral Thrawn returns from Unknown Regions with a revitalized Imperial fleet; tactical genius exploiting clone trooper madness from Mount Tantiss; nearly defeats the New Republic | Grand Admiral Thrawn (†, assassinated), Captain Gilad Pellaeon, Joruus C'baoth (clone, †), Luke Skywalker, Mara Jade (Imperial assassin turned ally), Han Solo, Leia Organa | Multiple worlds, Bilbringi | CRITICAL |
| **9 ABY** | **Thrawn assassinated by his own Noghri bodyguard Rukh** during the Battle of Bilbringi; his forces retreat; the campaign collapses | Grand Admiral Thrawn (†), Rukh (kills him), Captain Pellaeon | Bilbringi | CRITICAL |
| **~10 ABY** | **Reborn Emperor — Dark Empire / Operation Shadow Hand** — Palpatine returns in a cloned body from his hidden world of Byss; reunites Imperial forces; reconquers much of the galaxy; captures Coruscant | Reborn Emperor Palpatine (clone), Luke Skywalker (briefly falls, then returns), Leia Organa | Byss, Coruscant, multiple worlds | CRITICAL |
| **~10 ABY** | **Exar Kun's spirit attacks the Jedi** — the ancient Sith's trapped spirit on Yavin 4 awakens and tries to corrupt Luke's first students; defeated | Exar Kun (spirit, †, destroyed), Kyp Durron (temporarily corrupted), Luke Skywalker | Yavin 4 | HIGH |
| **~11 ABY** | **Reborn Emperor permanently destroyed** — Palpatine's final clone body killed; his spirit consumed/blocked by the dying Jedi Empatojayos Brand, ending him forever | Reborn Emperor Palpatine (†, permanent), Empatojayos Brand (†), Luke Skywalker, Leia Organa, Han Solo | Onderon/Ambria | CRITICAL |
| **~11 ABY** | **New Jedi Order founded** — with the Emperor gone, Luke Skywalker establishes the Jedi Praxeum on Yavin 4 and trains the first generation of new Jedi Knights | Luke Skywalker, Corran Horn, Kyp Durron, Kam Solusar | Yavin 4 | HIGH |
| **~12 ABY** | **Daala unifies the warlords** — Admiral Natasi Daala, disgusted by the warlords' infighting, gathers the thirteen most powerful at Tsoss Beacon and executes them; ends the First Imperial Civil War | Admiral Natasi Daala, thirteen Imperial warlords (†), Gilad Pellaeon | Tsoss Beacon, Deep Core | HIGH |
| **~12 ABY** | **Imperial Remnant consolidated under Pellaeon** — after Daala's own campaigns fail, she cedes command to Gilad Pellaeon, who pulls the Empire's surviving forces into a coherent Imperial Remnant | Gilad Pellaeon, Admiral Daala | Deep Core → Outer Rim | HIGH |
| **~12 ABY** | **Desann's attack on the Jedi Praxeum** — fallen Jedi Desann assaults Luke's academy with Force-empowered Dark Jedi and shadowtroopers; defeated by Kyle Katarn | Desann (†), Kyle Katarn, Luke Skywalker | Yavin 4 | MEDIUM |
| **~12–18 ABY** | New Republic expands; Imperial Remnant whittled down to a few sectors; Leia and Han's children (Jacen ~9 ABY, Jaina, Anakin) grow up; Luke marries Mara Jade | Leia Organa, Han Solo, Jacen Solo, Jaina Solo, Anakin Solo, Luke Skywalker, Mara Jade | Coruscant and various | MEDIUM |
| **~19 ABY** | **Pellaeon–Gavrisom Treaty (Bastion Accords)** — Grand Admiral Gilad Pellaeon signs peace with New Republic Chief of State Ponc Gavrisom; the Galactic Civil War formally ends after more than two decades | Grand Admiral Gilad Pellaeon, Chief of State Ponc Gavrisom | Bastion / Ord Mantell | CRITICAL |
| **~19 ABY** | **Luke Skywalker marries Mara Jade** — former Emperor's Hand turned Jedi; their union strengthens the New Jedi Order's leadership | Luke Skywalker, Mara Jade Skywalker | Coruscant | MEDIUM |
| **~25 ABY** | New Republic Historical Council officially adopts BBY/ABY calendar system | New Republic Historical Council | Chandrila | LOW |

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
| **25 ABY** | **Battle of Helska IV** — first major Republic engagement; Luke Skywalker leads task force; Praetorite Vong worldship destroyed; Mara Jade infected with Vong disease | Luke Skywalker, Mara Jade Skywalker (infected), Han Solo | Helska IV | HIGH |
| **25 ABY** | **Rhommamool and Osarian conflict** — Nom Anor (Vong advance agent) sparks planetary war | Nom Anor, Wurth Skidder (Jedi, killed later) | Rhommamool, Osarian | MEDIUM |
| **26 ABY** | **Vong advance through Outer Rim** — world after world falls; billions die; New Republic unable to stop them | Vong commanders, Republic military, various Jedi | Multiple Outer Rim worlds | HIGH |
| **26 ABY** | **Ithor destroyed** — Vong defeat Jedi Corran Horn and demand he flee; he does; they destroy Ithor anyway | Corran Horn (blamed, self-exile), Vong commanders, Ithorian species | Ithor (destroyed) | HIGH |
| **26 ABY** | Mara Jade Skywalker healed of Vong disease by the Force through her pregnancy with Ben Skywalker | Mara Jade Skywalker, Ben Skywalker (in utero) | Unknown | HIGH |
| **~27 ABY** | **Myrkr mission** — elite team of young Jedi infiltrate Vong worldship to kill the Voxyn Queen (kills Jedi through Force) | Anakin Solo (†), Jacen Solo (captured), Jaina Solo, Tahiri Veila, Ganner Rhysode (†), others | Myrkr, Vong worldship | CRITICAL |
| **~27 ABY** | **Anakin Solo killed** — sacrifices himself to seal the mission; dies of wounds; last act destroys many Vong | Anakin Solo (†) | Myrkr, Vong worldship | CRITICAL |
| **~27 ABY** | **Jacen Solo captured** — unconscious after the mission; kept as Vong prisoner; tortured for months; philosophical transformation under Vergere | Jacen Solo, Vergere (Jedi-become-Vong-agent; complex) | Vong captivity | CRITICAL |
| **~27 ABY** | **Coruscant falls** — Vong conquer Republic capital; rename it Yuuzhan'tar; Chief of State Borsk Fey'lya detonates bomb killing himself and thousands of Vong | Borsk Fey'lya (†, takes thousands with him), Vong forces | Coruscant | CRITICAL |
| **~28 ABY** | **Galactic Alliance founded** — New Republic dissolved; reconstituted as stronger unified government | Cal Omas (first Chief of State), Mon Mothma's legacy | Unknown world | HIGH |
| **~28 ABY** | **Jacen Solo escapes** — with Vergere; both changed by the experience; Vergere dies allowing their escape | Jacen Solo (escaped, changed), Vergere (†) | Vong space | HIGH |
| **~28 ABY** | **Ben Skywalker born** — Mara and Luke's son; born during the war | Ben Skywalker (born), Luke Skywalker, Mara Jade Skywalker | Unknown safe world | MEDIUM |
| **29 ABY** | **Battle of Yuuzhan'tar (Coruscant)** — Alliance and Vong remnant allies (led by Nas Choka who seeks peace) fight Supreme Overlord Shimrra and his Slayer slave Onimi | Luke Skywalker, Jacen Solo, Jaina Solo, Supreme Overlord Shimrra (†), Onimi (†, true mastermind) | Coruscant/Yuuzhan'tar | CRITICAL |
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
| **~30 ABY** | **A'Sharad Hett becomes Darth Krayt** — trained by ancient Sith XoXaan on Korriban; founds the One Sith (deliberately violates Rule of Two) | Darth Krayt/A'Sharad Hett, XoXaan (spirit) | Korriban | CRITICAL |
| **~35 ABY** | **Jacen Solo begins wandering** — leaves Jedi Order to study Force traditions across the galaxy for five years | Jacen Solo | Galaxy-wide | CRITICAL |
| **~35 ABY** | **Dark Nest Crisis** — Killik Joiners crisis; Jedi involved with insect collective; Raynar Thul (believed dead at Myrkr) is revealed as the Killiks' Unu (queen) | Luke Skywalker, Leia Organa, Mara Jade, Jacen Solo, Jaina Solo, Raynar Thul/Unu | Killik space, Colony worlds | HIGH |
| **~36 ABY** | Dark Nest Crisis resolved; uneasy peace; Killik menace contained | Jedi Order, Colony | Unknown Regions/Colony space | MEDIUM |
| **~36 ABY** | **Jacen Solo meets Lumiya** — the former Imperial Hand and Sith Lady; begins subtle dark side manipulation | Jacen Solo, Lumiya | Unknown | CRITICAL |

---

## ══════════════════════════════════════════
## SECOND GALACTIC CIVIL WAR — 40–41 ABY
## ══════════════════════════════════════════

### Overview
Corellia declares independence from the Galactic Alliance. Various star systems follow. Civil war erupts. Behind the scenes, Darth Caedus — the fallen Jacen Solo — manipulates events to seize power. Mara Jade is murdered. Luke Skywalker must ask his niece Jaina Solo to kill her own twin brother.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~40 ABY** | **Corellia declares independence** from Galactic Alliance — beginning of the Second Galactic Civil War | Centerpoint Station, Corellian government, Chief of State Omas | Corellia, Coruscant | HIGH |
| **~40 ABY** | **Jacen Solo becomes Chief of State's Joint Chief of the Alliance military** — rising power | Jacen Solo, Chief of State Cal Omas | Coruscant | HIGH |
| **~40 ABY** | **Lumiya reveals the Sith path to Jacen** — Jacen must sacrifice the one he loves most to become a Sith Lord | Jacen Solo, Lumiya | Unknown | CRITICAL |
| **~40 ABY** | **Jacen Solo falls — becomes Darth Caedus** — sacrifices his daughter Allana's safety (believed); crosses the line | Jacen Solo/Darth Caedus | Unknown | CRITICAL |
| **~40 ABY** | **Mara Jade Skywalker murdered by Darth Caedus** — Mara investigates Jacen; he kills her to prevent exposure; Luke receives her death through their Force bond | Mara Jade Skywalker (†), Darth Caedus/Jacen Solo | Kavan | CRITICAL |
| **~40 ABY** | **Luke Skywalker duels Darth Caedus** — realizes Jacen has fallen; cannot bring himself to kill his nephew | Luke Skywalker, Darth Caedus | Unknown | HIGH |
| **~40 ABY** | **Darth Caedus seizes control** — removes Cal Omas; installs puppet government; becomes co-Chief of State | Darth Caedus, Cal Omas (†, later killed by Caedus) | Coruscant | HIGH |
| **~40 ABY** | **Jaina Solo begins training with Mandalorians** — Luke sends her to Boba Fett to learn how to kill Caedus | Jaina Solo, Boba Fett | Mandalore | HIGH |
| **~40–41 ABY** | **Multiple battles** — Confederation (Corellia and allies) vs. Galactic Alliance under Caedus; both sides take heavy losses | Darth Caedus, Han Solo (against Caedus), Leia Organa (against Caedus), Jagged Fel (Imperial Remnant ally) | Multiple worlds | HIGH |
| **41 ABY** | **Battle of Nickel One** — Jaina Solo confronts Darth Caedus | Jaina Solo, Darth Caedus | Nickel One (asteroid) | CRITICAL |
| **41 ABY** | **Jaina Solo kills Darth Caedus** — kills her own twin brother; Caedus's last act is a Force-warning to Tenel Ka to protect Allana | Jaina Solo, Darth Caedus/Jacen Solo (†) | Space battle | CRITICAL |
| **41 ABY** | **Second Galactic Civil War ends** | Galactic Alliance, Confederation, Imperial Remnant | Galaxy-wide | HIGH |
| **41 ABY** | Jaina Solo dubbed "Sword of the Jedi" by Luke Skywalker; marries Jagged Fel | Jaina Solo, Luke Skywalker, Jagged Fel | Coruscant | MEDIUM |
| **~44 ABY** | **Fate of the Jedi — Abeloth emerges** — ancient Force entity imprisoned in the Maw; Luke exiled from Coruscant during investigation; Sith under Darth Krayt briefly emerge to fight her | Luke Skywalker, Ben Skywalker, Darth Krayt (final emergence), Abeloth (†, eventually) | Multiple worlds, Maw | HIGH |
| **~44 ABY** | **Darth Krayt returns from stasis** to fight Abeloth; briefly sides with Luke against Abeloth | Darth Krayt, Luke Skywalker | Unknown | HIGH |

---

## ══════════════════════════════
## LEGACY ERA — 127–139 ABY
## ══════════════════════════════

### Overview
100+ years after the Galactic Civil War. Jagged Fel founded the Fel Empire. His descendants rule as Emperors with the support of Imperial Knights — Force-using warriors loyal to the Emperor, not the Sith. The Galactic Alliance and the Fel Empire have an uneasy but functioning relationship. Darth Krayt's One Sith — hidden on Korriban for a century — reveal themselves and destroy everything. Cade Skywalker, Luke's descendant, is a bounty hunter who refuses to be a Jedi until circumstances force his hand.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~80 ABY** | **Fel Empire founded** — Jagged Fel (Jaina's husband) establishes the Fel dynasty as Emperor of the Imperial Remnant | Jagged Fel (first Fel Emperor), Jaina Solo Fel | Imperial space | HIGH |
| **~80 ABY** | **Imperial Knights established** — Fel-loyal Force-users; serve the Emperor, not the Sith or Jedi; neutral Force wielders | Jagged Fel, first Imperial Knights | Imperial space | HIGH |
| **~127 ABY** | **Kol Skywalker leads Jedi on Ossus** — Master Kol Skywalker, Luke's great-great-great-grandson, leads Jedi at the Ossus Academy | Kol Skywalker (†, soon), Cade Skywalker (young, his son), Wolf Sazen (Kol's Padawan) | Ossus | HIGH |
| **~127 ABY** | **Ossus Project** — Jedi-backed plan using Yuuzhan Vong terraforming to restore 100 devastated worlds; widespread support | Jedi Order, 100 worlds | Multiple worlds | HIGH |
| **~127 ABY** | **Ossus Project sabotaged** — Darth Krayt's agents secretly corrupt the Vong terraforming; recipients blame the Jedi and Vong; galactic distrust reignited | Darth Krayt's agents (sabotage), Jedi Order (blamed), 100 worlds (turn against Jedi) | Multiple worlds | CRITICAL |
| **127 ABY** | **Sith-Imperial War begins** — Darth Krayt and One Sith ally with the Moff Council against the Galactic Alliance; Emperor Roan Fel opposes war but is overruled | Darth Krayt, Moff Council, Emperor Roan Fel (unwilling), Galactic Alliance | Galaxy-wide | CRITICAL |
| **127 ABY** | **Massacre at Ossus** — One Sith lead devastating strike on the Jedi Academy at Ossus; Jedi Order slaughtered; Order effectively destroyed | Darth Nihl, Darth Talon, Kol Skywalker (†), Wolf Sazen (wounded), Cade Skywalker (escapes, believed dead) | Ossus | CRITICAL |
| **127 ABY** | **Cade Skywalker uses forbidden healing** — 14-year-old Cade uses powerful and forbidden Force healing to save Wolf Sazen; nearly dies; traumatized; abandons the Force | Cade Skywalker (age ~14), Wolf Sazen (healed and survives) | Ossus | CRITICAL |
| **127 ABY** | **Battle of Caamas** — Galactic Alliance Defense Fleet faces Sith-Imperial forces; decisive defeat | Galactic Alliance fleet, Admiral Gar Stazi | Caamas | HIGH |
| **130 ABY** | **Sith-Imperial War ends** — Galactic Alliance defeated; forced to surrender | Darth Krayt, Emperor Roan Fel, Galactic Alliance | Coruscant | CRITICAL |
| **130 ABY** | **Darth Krayt's coup** — Sith betray Emperor Roan Fel; one of his own Imperial Knights (secretly a Sith agent) kills a decoy; Krayt seizes the Imperial Throne | Darth Krayt, Emperor Roan Fel (flees into exile), Darth Wyyrlok (Krayt's second) | Coruscant | CRITICAL |
| **130 ABY** | **Second Imperial Civil War begins** — Roan Fel's True Empire (loyalists) vs. Darth Krayt's Sith Empire vs. Galactic Alliance Remnant under Admiral Gar Stazi | Darth Krayt, Emperor Roan Fel (exile), Admiral Gar Stazi | Galaxy-wide | CRITICAL |
| **130 ABY** | **Cade Skywalker revealed as bounty hunter** — operating as pirate-for-hire with Deliah Blue and Jariah Syn; actively suppressing his Force abilities | Cade Skywalker, Deliah Blue, Jariah Syn | Outer Rim, space | HIGH |
| **~132 ABY** | **Mon Calamari genocide** — Krayt orders extermination of Mon Calamari species as punishment for Gar Stazi's fleet base there; thousands killed | Darth Krayt, Mon Calamari Council (†), Mon Calamari species (thousands killed), Admiral Stazi (escapes) | Mon Calamari | CRITICAL |
| **~133 ABY** | **Cade Skywalker captured by One Sith** — brought to Krayt; Krayt reveals his identity as A'Sharad Hett; tries to turn Cade | Cade Skywalker, Darth Krayt, Darth Talon, Darth Nihl | Coruscant, Temple of the Sith | HIGH |
| **~133 ABY** | **Cade escapes** — pretends to accept Sith training; flees with Deliah Blue | Cade Skywalker, Deliah Blue | Coruscant | HIGH |
| **~135 ABY** | **Darth Krayt goes into stasis** — gravely ill from Vong implants slowly killing him; Darth Wyyrlok rules in his name | Darth Krayt (stasis), Darth Wyyrlok III | Korriban | HIGH |
| **~135 ABY** | **Darth Wyyrlok kills Krayt** — believing Krayt irreparably weakened; betrays his master and kills him in stasis | Darth Wyyrlok III, Darth Krayt (†, apparently) | Korriban | HIGH |
| **~136 ABY** | **Darth Krayt resurrects** — through Sith alchemy and dark side mastery; more powerful than before; kills Wyyrlok | Darth Krayt (resurrected), Darth Wyyrlok III (†) | Korriban | HIGH |
| **~137 ABY** | **Alliance of alliances forms** — Roan Fel's True Empire, Galactic Alliance Remnant, and Jedi Order formally ally against Krayt | Emperor Roan Fel, Admiral Gar Stazi, Jedi Masters Wolf Sazen and Shado Vao, Cade Skywalker | Bastion (Imperial capital in exile) | CRITICAL |
| **~137 ABY** | **Roan Fel killed** — during climactic battle; killed by his own Imperial Knight Antares Draco who was following his orders | Emperor Roan Fel (†), Antares Draco, Marasiah Fel (daughter, new Empress) | Unknown | HIGH |
| **~137 ABY** | **Battle of Coruscant** — allied forces assault Krayt's capital; Cade Skywalker challenges Darth Krayt | Cade Skywalker, Darth Krayt, Wolf Sazen, Shado Vao, Admiral Stazi, Marasiah Fel, Imperial Knights | Coruscant, Temple of the Sith | CRITICAL |
| **~137 ABY** | **Darth Krayt killed by Cade Skywalker** — Cade uses his healing power in reverse; destroys Krayt from within; releases Krayt into the Force rather than allowing him to possess Cade | Cade Skywalker, Darth Krayt (†, permanent) | Coruscant | CRITICAL |
| **~137 ABY** | **Second Imperial Civil War ends** — One Sith scatter; Darth Nihl commands retreat; Galactic Federation Triumvirate forms (Alliance, Jedi, Fel Empire) | Darth Nihl (One Sith flee), Marasiah Fel (Empress), Admiral Stazi, Jedi Order | Coruscant | CRITICAL |
| **138 ABY** | **Galactic Federation Triumvirate established** — Marasiah Fel's Empire, Galactic Alliance Remnant, and Jedi Order govern jointly | Empress Marasiah Fel, Galactic Alliance, Luke Skywalker's legacy Jedi Order | Coruscant | HIGH |
| **138–139 ABY** | **Darth Wredd's insurgency** — last organized One Sith attempt; former One Sith who independently hunts other One Sith to rebuild Rule of Two; eventually allies with Ania Solo (descendant of Han and Leia) | Darth Wredd, Ania Solo (Han and Leia's descendant), Imperial Knight Jao Assam | Multiple worlds | MEDIUM |
| **139 ABY** | **Darth Wredd killed** by Ania Solo and Jao Assam — last known organized Sith threat in the Legends timeline | Darth Wredd (†), Ania Solo, Jao Assam | Unknown | HIGH |
| **139 ABY** | **One Sith Order effectively extinct** — no known successors; Rule of Two disbanded; Sith as an organized power ends (in known Legends continuity) | Darth Nihl (last known active Sith Lord, fate unclear) | Unknown | CRITICAL |

---

*Version 3.0 complete — Full Legends timeline from Dawn of the Jedi (36,453 BBY) through Legacy Era (139 ABY)*
*All dates and figures verified against Wookieepedia Legends sources*
