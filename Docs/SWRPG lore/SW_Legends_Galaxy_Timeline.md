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
The galaxy has no unified government. Force-sensitives across dozens of species are separately developing their connection to the Force. Eight pyramidal ships called Tho Yor gather them all and bring them to Tython in the Deep Core. There they form the Je'daii Order — practitioners of balance between light (Ashla) and dark (Bogan). Tython itself is violently sensitive to Force imbalance and will trigger Force Storms if a Je'daii tips too far toward either side. Those who fall to the dark side are exiled to the moon Bogan until balanced; those who fall to the light are sent to the moon Ashla. The Force Wars end this era: they begin as the Rakatan invasion, the Je'daii split into followers of Ashla and Bogan, the Bogan followers are defeated, and the Ashla followers found the Jedi Order.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **36,453 BBY** | **Tho Yor Arrival** — 8 pyramid ships gather Force-sensitives from across the galaxy; all converge on Tython in a massive Force Storm | Dai Bendu monks (Ando Prime), Wookiees, Humans, Twi'leks, Selkath, Cathar, multiple species | Tython, Deep Core | CRITICAL |
| **36,453 BBY** | **Je'daii Order founded** — pilgrims realize they were brought to study the Force; build nine temples across Tython; adopt philosophy of balance between Ashla and Bogan | First Je'daii Masters, Tythan settlers | Tython — nine temples including Anil Kesh, Mahara Kesh, Vur Tepe, Kaleth, Akar Kesh | CRITICAL |
| c. 35,453 BBY or later | Second Migration: Tython found to be unsafe for non-Force-sensitives; they are sent first to the moons, then outward to the other planets of the Tython system | Je'daii Order, Tythan population | Tython system | MEDIUM |
| undated | Je'daii exile practice established — dark-siders sent to moon Bogan; light-siders to moon Ashla; balance enforced | Je'daii Council | Tython, Bogan, Ashla | HIGH |
| ~35,000 BBY | **Rakata Infinite Empire expands** — dark-side-powered technology; conquering the Unknown Regions and the eastern galaxy | Rakatan species | Unknown Regions, Eastern galaxy | HIGH |
| 25,805 BBY | **Despot War** — Despot Queen Hadiya of Shikaakwa tries to conquer the Tython system; she attacks the Je'daii temple Kaleth and is killed by the Je'daii Ranger Daegen Lok, who had gone undercover in her army | Queen Hadiya (†), Daegen Lok, Je'daii Order | Tython system, Shikaakwa | HIGH |
| **25,793 BBY** | **Rakatan Infinite Empire reaches Tython system** — Force Hound Xesh arrives; crashes on Tython; triggers massive Force Storm | Xesh (Force Hound, later redeemed), Predor Skal'nas (Rakata commander), Predor Tul'kar (†), Trill (Force Hound, spy) | Tython, Ska Gora, Shikaakwa | CRITICAL |
| **~25,793 BBY** | **Xesh turns** — Daegen Lok (exiled to Bogan after his vision drove him to the dark side) recruits the Force Hound Xesh to make Forcesabers; Xesh is convinced to turn on Lok, who is imprisoned on Bogan again | Xesh, Shae Koda, Daegen Lok (imprisoned) | Tython, Bogan, Shikaakwa | HIGH |
| **25,793–25,792 BBY** | **Invasion of the Tython system** — the Infinite Empire under Predor Skal'nas invades, seeking the Infinity Gate on Tython; the Je'daii and the Settled Worlds resist, led by Generals Rajivari and Daegen Lok (freed from Bogan to command) | Daegen Lok, Rajivari, Je'daii Masters, Predor Skal'nas (†) | Tython system — Obri, Mawr, Ska Gora, Shikaakwa | CRITICAL |
| **25,792 BBY** | **Rakatan invasion defeated** — Tasha Ryo carries the Holocron of A'nang to the bottom of Anil Kesh and leaps into the pit, waking the Tho Yor, which fire on the Rakatan ships while a Force surge destroys the Infinity Gate; Xesh defeats Skal'nas, whose body burns in the gate's remains; the Rakata flee and the Settled Worlds fleet destroys the rest | Tasha Ryo, Xesh, Shae Koda, Je'daii Masters, Predor Skal'nas (†) | Tython system | CRITICAL |
| **25,793–25,783 BBY** | **Force Wars** — ten years of war on Tython, beginning with the Rakatan invasion and becoming the first war between followers of the light (Ashla) and dark (Bogan); Rajivari dies in 25,783 BBY | Rajivari (†), surviving Je'daii Masters | Tython | CRITICAL |
| **25,783 BBY** | **Jedi Order established** — the Bogan followers are defeated and the survivors found the Jedi Order, more than seven centuries before the Republic | Surviving Je'daii Masters | Tython | CRITICAL |

---

## ═══════════════════════════════════════════════════════
## OLD REPUBLIC FOUNDING & FIRST CONFLICTS — 25,793–5,100 BBY
## ═══════════════════════════════════════════════════════

### Overview
The Galactic Republic is founded on Coruscant. Hundreds of worlds join over the following millennia. The Jedi Order, centred on Ossus, joins the Republic in 24,953 BBY and becomes its protectors. Several internal Jedi schisms produce dark-sided exiles. The Second Great Schism's exiles eventually find Korriban and found the Sith Empire. The Republic continues to expand, occasionally checked by war and disorder.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **25,053 BBY** | **Galactic Republic founded** on Coruscant — first galactic democratic government | Republic founders, Senate | Coruscant | CRITICAL |
| c. 25,783 BBY | The Jedi leave Tython, its biosphere wrecked by the cataclysm that ends the Force Wars, and settle on Ossus | Jedi Order | Tython to Ossus | HIGH |
| c. 24,953 BBY | The Jedi pledge themselves to the Republic, staying on Ossus; Coruscant becomes their headquarters only in 3,996 BBY | Haune Tiar, Jedi Order | Ossus | HIGH |
| c. 24,500 BBY | **First Great Schism** — Xendor's Legions of Lettow break with the Jedi Order and are defeated (battles include Ossus, Coruscant and Lettow) | Xendor, Arden Lyn, Jedi Master Awdrysta Pina | Galaxy-wide | CRITICAL |
| **7,003 BBY** | **Second Great Schism** — Jedi practising Sith alchemy and the dark side break from the Order as Dark Jedi | Dark Jedi faction, Jedi Order | — | CRITICAL |
| **7,000 BBY** | **Hundred-Year Darkness begins** — the Dark Jedi wage war on the Jedi and Republic with alchemically created monstrous armies | Ajunta Pall, XoXaan, Karness Muur, Sorzus Syn, Jedi Order | Republic space | CRITICAL |
| **~6,900 BBY** | **Battle of Corbos** — dark Jedi defeated in final battle; survivors stripped of weapons and exiled to uncharted space beyond Republic borders | Ajunta Pall (exiled), Jedi Order | Corbos | CRITICAL |
| **~6,900 BBY** | **Ajunta Pall and exiles discover Korriban** — find red-skinned Force-sensitive Sith species; conquer them; become god-kings | Ajunta Pall (first Dark Lord of the Sith), Sorzus Syn, Sith King Hakagram Graush (†, betrayed and beheaded by Ajunta Pall) | Korriban | CRITICAL |
| **~6,900 BBY** | **Old Sith Empire founded** — Dark Jedi interbreed with Force-sensitive Sith species through Sith alchemy; cultures merge over generations; the Jedi know the Exiles hold a world but cannot find it, and to the Republic it is a myth | Ajunta Pall (first Dark Lord), Sorzus Syn, other Dark Jedi exiles | Korriban, Ziost, Sith Space | CRITICAL |
| c. 6,900 BBY | Against Ajunta Pall's wishes some of the new Sith Lords raid Republic space to destroy the Jedi and are wiped out; the Jedi learn the Exiles hold a region of space but cannot find it | Renegade Sith, Jedi Order | Republic border | HIGH |
| **~4,250 BBY** | **Third Great Schism** — dark Jedi on Coruscant destroyed in the **Vultar Cataclysm** | Dark Jedi faction, Jedi Order | Coruscant → Vultar system | HIGH |

---

## ══════════════════════════════
## GOLDEN AGE OF THE SITH — 5,100–5,000 BBY
## ══════════════════════════════

### Overview
Under Dark Lord Marka Ragnos, the Sith Empire reaches its pre-war peak. Ragnos rules for over a century through absolute dominance, eliminating rivals and consolidating power. The Republic has no knowledge of the Sith's continued existence. This century of stability ends with Ragnos's death and immediately triggers the Great Hyperspace War.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **~5,100 BBY** | **Marka Ragnos becomes Dark Lord** — beheads the warlord Simus in a duel for the title; Simus survives as a head preserved in a crystal sphere and later serves on Ragnos's Sith Council | Marka Ragnos, Simus | Korriban | HIGH |
| ~5,100–5,000 BBY | Century of Sith stability — Ragnos eliminates rivals and forbids expansion beyond Sith Space; golden age of Sith culture and Sith alchemy | Marka Ragnos, Sith Council | Korriban, Ziost, Sith Space | MEDIUM |
| ~5,000 BBY | Republic hyperspace scouts **Gav and Jori Daragon** accidentally stumble into Sith Space; captured on landing at Korriban and taken to Ziost | Gav Daragon, Jori Daragon | Korriban, Ziost | CRITICAL |
| **5,000 BBY** | **Marka Ragnos dies** after a reign of over a century; his spirit lingers at his tomb | Marka Ragnos (†, spirit remains) | Valley of Dark Lords, Korriban | CRITICAL |
| **5,000 BBY** | **Sadow vs. Kressh duel** — Naga Sadow and Ludo Kressh duel for Dark Lordship at Ragnos's funeral; Ragnos's ghost appears and stops the duel; the title stays vacant until the Lords of the Sith name Sadow [Ruled (Jared, 24 Nov 2026)] | Naga Sadow, Ludo Kressh, Marka Ragnos (spirit) | Valley of Dark Lords, Korriban | CRITICAL |

---

## ═══════════════════════════════
## GREAT HYPERSPACE WAR — 5,000–4,999 BBY
## ═══════════════════════════════

### Overview
Naga Sadow uses the Daragons' arrival to manufacture a crisis, wins the Dark Lordship, and launches an invasion of the Republic. The war goes well initially — Sith fleets strike Coruscant, the Koros system, and other Republic worlds simultaneously. Sadow's own apprentice Gav Daragon ultimately betrays him, collapsing Sith fleet command. The Republic counterattacks and drives the Sith back. Supreme Chancellor Pultimo orders a counterinvasion of Sith space (5,000 to c. 4,999 BBY). Survivors flee to the Unknown Regions, where they spend 1,300 years rebuilding before returning; others flee to Ambria, Thule, Tund and Vjun, and the crew of the *Omen* founds the Lost Tribe on Kesh.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **5,000 BBY** | Ludo Kressh's conclave declares the Daragons Republic spies; Naga Sadow frees them, kills his master Simus and frames the Republic, winning the Lords' support for war | Naga Sadow, Ludo Kressh, Gav and Jori Daragon (pawns) | Ziost, Korriban | HIGH |
| **5,000 BBY** | **Battle of Khar Delba** — Kressh attacks Sadow's decoy citadel; Sadow's hidden fleet defeats him, and Kressh fakes his death | Naga Sadow, Ludo Kressh | Khar Delba | HIGH |
| **5,000 BBY** | Sadow releases Jori Daragon with hidden homing device; she returns to Republic space | Jori Daragon, Naga Sadow | Sith Space → Republic | CRITICAL |
| **5,000 BBY** | **Great Hyperspace War begins** — Sith fleets follow homing device through Daragon Trail; strike Republic worlds simultaneously | Naga Sadow, Sith Empire fleet | Coruscant, Koros system, Kirrek | CRITICAL |
| **5,000 BBY** | **Battle of Coruscant** — Sith fleet strikes Republic capital; Jedi Order defends; Memit Nadill (Empress Teta's adviser) arrives to warn the Jedi just as it begins and leads a Jedi team in the defence | Jedi Order, Memit Nadill, Republic forces, Sith fleet | Coruscant | CRITICAL |
| **5,000 BBY** | **Battle of Kirrek** — Sith attack the Koros system; Empress Teta's commander Llaban holds Kirrek; Jedi Master Ooroo breaks his cyanogen tank to poison the Sith force and dies | Commander Llaban, Jedi Master Ooroo (†), Padawan Odan-Urr | Kirrek, Koros system | HIGH |
| **5,000 BBY** | **Battle at Primus Goluud** — Gav Daragon turns on Sadow, firing on his meditation sphere and breaking his battle illusions; he gives the Koros fleet the coordinates of the Sith worlds and is killed when Sadow's superweapon makes the red supergiant flare and go supernova, destroying the sphere and the system [Ruled (Jared, 24 Nov 2026)] | Gav Daragon (†), Naga Sadow, Jori Daragon | Primus Goluud system | CRITICAL |
| **5,000 BBY** | **Republic fleet rallies** — with positions betrayed, Republic forces regroup and counterattack; Sith fleets routed across multiple fronts | Republic Navy, Jedi Order | Multiple front lines | CRITICAL |
| **5,000 BBY** | **First battle of Korriban** — Sadow returns home to find Ludo Kressh (who had faked his death) waiting with an army; Sadow kills Kressh by ramming one of his own ships into Kressh's flagship | Naga Sadow, Ludo Kressh (†) | Korriban | HIGH |
| **5,000 BBY** | **Second battle of Korriban** — the Republic fleet, using Gav's coordinates, routs Sadow; he escapes through the Denarii Nova (destroying both stars and his pursuers) to Yavin 4 | Republic forces, Naga Sadow (flees) | Korriban | HIGH |
| **5,000–4,999 BBY** | **Republic Counterinvasion** — Supreme Chancellor Pultimo orders the invasion of Sith space to end the threat and free the Sith species from dark-side corruption; Sith strongholds and sacred sites are destroyed | Republic fleet, Jedi Order | Korriban, Sith Space | CRITICAL |
| **4,999 BBY** | **Ritual of Nathema** — after Sadow's defeat, Lord Vitiate (born Tenebrae, 5,113 BBY) lures the remaining Sith Lords to his world Nathema and drains them and the planet, prolonging his life and becoming the Sith Emperor | Vitiate/Sith Emperor | Nathema | CRITICAL |
| **4,999–4,980 BBY** | **Sith exodus** — the Emperor leads the Sith survivors on a twenty-year journey to Dromund Kaas and founds a new Sith Empire there in 4,980 BBY; the Republic believes the Sith extinct | Sith Emperor (Vitiate) | Dromund Kaas, Unknown Regions | CRITICAL |
| after 5,000 BBY | Naga Sadow practises alchemy alone on Yavin 4 for decades, building temples with his Massassi, then puts himself in suspended animation | Naga Sadow | Yavin 4 | LOW |

---

## ═══════════════════════════════════════════════
## SITH EXILE & OLD REPUBLIC INTERWAR — 4,999–3,998 BBY
## ═══════════════════════════════════════════════

### Overview
The Republic believes the Sith extinct. Centuries of relative peace punctuated by internal schisms and the rise of dangerous Force cults. The Sith rebuild secretly on Dromund Kaas. One Sith Lord uses the dark side to achieve immortality and becomes the Sith Emperor — maintaining his life across millennia through dark rituals. He patiently builds the reconstituted Sith Empire for over a thousand years.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| 4,980 BBY onward | The Sith Emperor rules the hidden Sith Empire on Dromund Kaas for over a thousand years, kept alive by the power he took at Nathema *(the immortality ritual itself happened at Nathema in 4,999 BBY, above)* | Sith Emperor (Vitiate) | Dromund Kaas | CRITICAL |
| **c. 4,400 BBY** | **Freedon Nadd falls to the dark side** — the Jedi kills his Master Matta Tremayne, finds Naga Sadow in suspended animation on Yavin 4, learns from him and then kills him; declares himself Dark Lord and conquers Onderon | Freedon Nadd, Naga Sadow (†) | Yavin 4 → Onderon | HIGH |
| c. 4,400–4,300 BBY | Freedon Nadd rules Onderon as king from Iziz for more than a hundred years; entombed beneath the royal palace; his spirit teaches his bloodline | Freedon Nadd (†, spirit remains) | Onderon | HIGH |
| **4,000 BBY** | **End of the Beast Wars of Onderon** — Jedi under Master Arca Jeth end the final battle in Iziz and defeat Queen Amanoa | Master Arca Jeth, Ulic Qel-Droma, Cay Qel-Droma, Tott Doneeta, Queen Amanoa | Onderon | HIGH |
| **3,998 BBY** | **Freedon Nadd Uprising** — Naddists (dark side cult) use Nadd's spirit and Sith artifacts to wage uprising on Onderon | Arca Jeth, Ulic Qel-Droma, Cay Qel-Droma, Nomi Sunrider, King Ommin (Naddist leader) | Onderon | HIGH |
| **3,998 BBY** | **First and Second Battles of Onderon** — Jedi and Republic defeat the Naddist Uprising; Ommin is killed; Nadd's spirit is banished from Onderon; the bodies are entombed on Dxun and the Sith artifacts sent to Ossus | Ulic Qel-Droma, Cay Qel-Droma, Master Arca Jeth, Nomi Sunrider | Onderon | HIGH |
| **3,998 BBY** | **Krath cult founded** — Aleema and Satal Keto secretly found dark side cult in Empress Teta system after obtaining Sith artifacts from Onderon | Aleema Keto, Satal Keto | Empress Teta system | CRITICAL |
| **3,970 BBY** | **Kanz Disorders begin** — slave rebellion and authoritarian warlordism in the Kanz sector; the Republic is unable to respond effectively for centuries | Provisional Governor Myrial, slave populations, Republic | Kanz sector | MEDIUM |
| **3,670 BBY** | **Kanz Disorders end** — after roughly 300 years, the Jedi free the Lorrdians; over 500 million Lorrdians and nearly five billion others have died [Ruled (Jared, 24 Nov 2026)] | Jedi Master Mari-Elan Nora, Republic forces | Kanz sector | LOW |

---

## ════════════════════════════════════
## KRATH HOLY CRUSADE — 3,997–3,996 BBY
## ════════════════════════════════════

### Overview
The Krath, a Sith cult led by the Tetan heirs Aleema and Satal Keto, seize the Empress Teta system in 3,997 BBY. Ulic Qel-Droma falls trying to infiltrate them, Exar Kun falls on Korriban and Yavin 4, and Marka Ragnos's spirit names both Sith. The crusade runs on alongside the Great Sith War of 3,996 BBY; both belong to the Old Sith Wars.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,997 BBY** | **Krath Holy Crusade begins** — Krath seize all seven planets of Empress Teta system in a bloody coup using Sith sorcery | Aleema Keto, Satal Keto | Empress Teta system | HIGH |
| **3,997 BBY** | **Jedi Assembly on Deneba** — Jedi Order convenes on Deneba to address Krath threat; Krath launch surprise War Droid attack; Master Arca Jeth killed | Master Arca Jeth (†), Ulic Qel-Droma, Cay Qel-Droma, Nomi Sunrider | Deneba | CRITICAL |
| **3,997 BBY** | Ulic Qel-Droma proposes infiltrating the Krath from within; nearly all at the conclave reject it, and he goes against his peers' pleas after Arca's death | Ulic Qel-Droma, Jedi Assembly | Deneba | HIGH |
| **3,997 BBY** | Exar Kun, hungry for Sith knowledge, goes to Onderon and Nadd's tomb on Dxun, which sends him to Korriban; Freedon Nadd's spirit then directs him to Yavin 4 | Exar Kun, Freedon Nadd (spirit, directing him) | Dxun → Korriban → Yavin 4 | CRITICAL |
| **3,997 BBY** | **Exar Kun corrupted on Yavin 4** — Massassi rituals nearly destroy him; spirit of Freedon Nadd manipulates him; Kun destroys Nadd's spirit and seizes Sith knowledge | Exar Kun, Freedon Nadd (spirit, †, destroyed by Kun) | Yavin 4 | CRITICAL |
| **3,997 BBY** | Ulic Qel-Droma infiltrates Krath on Empress Teta; corrupted by dark side despite intentions; kills Satal Keto in anger | Ulic Qel-Droma, Satal Keto (†, killed by Ulic in rage), Aleema Keto, Nomi Sunrider | Empress Teta | CRITICAL |
| **3,997 BBY** | **Ulic and Exar Kun meet** — Kun travels to Empress Teta to destroy the Ketos as rivals; he duels Ulic to a standstill; **Marka Ragnos's spirit interrupts** and anoints BOTH as Sith Lords | Exar Kun (Dark Lord), Ulic Qel-Droma (Sith apprentice), Marka Ragnos (spirit) | Cinnagar, Empress Teta | CRITICAL |
| **3,997 BBY** | **Brotherhood of the Sith formed** — Kun and Ulic resolve to restore a Sith golden age (Kun corrupts Jedi students on Ossus in 3,996 BBY) | Exar Kun, corrupted Jedi Padawans | Yavin 4, Ossus | HIGH |

---

## ════════════════════════════════════
## GREAT SITH WAR — 3,996 BBY
## ════════════════════════════════════

### Overview
The Great Sith War (also the Exar Kun War) is the most catastrophic conflict in the Old Republic era before the Mandalorian Wars. Two fallen Jedi — Exar Kun and Ulic Qel-Droma — are anointed Dark Lords of the Sith by Marka Ragnos's spirit. Allied with the Krath cult and Mandalorian Crusaders, they wage a devastating campaign. Ossus is left virtually destroyed and its Great Jedi Library lost. Ulic ultimately turns against Kun after killing his own brother. Kun's spirit is trapped on Yavin 4 for four thousand years.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,996 BBY** | **Mandalore the Indomitable joins Ulic** — the Mandalorian Crusaders invade Tetan space; Ulic defeats Mandalore in a duel on Kuar and Mandalore swears an oath of allegiance to him | Ulic Qel-Droma, Mandalore the Indomitable | Kuar | CRITICAL |
| **3,996 BBY** | **Battle of Coruscant and Ulic's trial** — Ulic's attack on Coruscant fails and he is captured and put on trial; Mandalore fetches Exar Kun, who breaks into the Senate Hall, kills Supreme Chancellor Sidrona and Jedi Master Vodo-Siosk Baas (his old Master), and frees Ulic | Exar Kun, Mandalore the Indomitable, Supreme Chancellor Sidrona (†), Jedi Master Vodo-Siosk Baas (†), Ulic Qel-Droma (freed) | Coruscant Senate Hall | CRITICAL |
| **3,996 BBY** | **The Dark Reaper resurfaces** — Exar Kun finds the Sith superweapon, built by Naga Sadow in the Great Hyperspace War, on Yavin 4; Ulic's Krath use it, killing thousands at Raxus Prime and then attacking the Makem system; Ulic secretly tells the Jedi how to withstand it, and a Jedi task force disables it on Thule, breaks it up and hides the Force Harvester on Raxus Prime; it is found again and destroyed in 22 BBY | Exar Kun, Ulic Qel-Droma, Krath, Jedi task force | Raxus Prime; Makem system; Thule | HIGH |
| **3,996 BBY** | **Cron Supernova** — Aleema Keto tears the core from a star of the Cron Cluster with Naga Sadow's ship; Kun had secretly altered the weapon, and the chain reaction kills her and devastates Ossus | Aleema Keto (†, her own weapon kills her) | Cron Cluster | CRITICAL |
| **3,996 BBY** | **Battle of Ossus** — Exar Kun and Ulic raid Ossus during the evacuation. The Sith fail to defeat the Jedi (Ulic is captured, Kun pulls back to Yavin 4) but leave Ossus virtually destroyed, and the Jedi are forced to abandon it: a Sith strategic victory and a tactical defeat [Ruled (Jared, 24 Nov 2026)] | Exar Kun, Ulic Qel-Droma, Cay Qel-Droma (†), Nomi Sunrider, Jedi Order | Ossus | CRITICAL |
| **3,996 BBY** | **Ulic Qel-Droma kills his brother Cay** in a lightsaber duel on Ossus | Ulic Qel-Droma, Cay Qel-Droma (†) | Ossus | CRITICAL |
| **3,996 BBY** | **Nomi Sunrider strips Ulic of the Force** — in rage and grief; Ulic permanently severed from the Force | Nomi Sunrider, Ulic Qel-Droma | Ossus | CRITICAL |
| **3,996 BBY** | **Great Jedi Library on Ossus destroyed** — combined damage from supernova wave, Sith raid, and battle; irreplaceable Jedi knowledge lost | Jedi Order, Ossus population | Ossus | CRITICAL |
| **3,996 BBY** | **Battle of Onderon** — while Kun and Ulic attack Ossus, Mandalore leads the Crusaders against Onderon; the Beast Riders under Oron Kira drive them back to the moon Dxun, where Mandalore is killed by predators; a Taung soldier takes his mask and becomes Mandalore the Ultimate | Mandalore the Indomitable (†), Oron Kira, Beast Riders | Onderon, Dxun | CRITICAL |
| **3,996 BBY** | Ulic leads Jedi to Yavin 4 to destroy Exar Kun | Ulic Qel-Droma, thousands of Jedi | Yavin 4 | CRITICAL |
| **3,996 BBY** | **Battle of Yavin 4** — thousands of Jedi create wall of light; Exar Kun drains all Massassi life energy in desperate ritual; Jedi light destroys his body; spirit trapped on Yavin 4 | Exar Kun (spirit trapped), Massassi species (nearly all killed), Jedi Order | Yavin 4 | CRITICAL |
| **3,996 BBY** | **Great Sith War ends** — Jedi Order diminished; Great Library destroyed; Mandalorian Crusaders routed | Jedi Order, Republic | Galaxy-wide | CRITICAL |
| 3,995–3,993 BBY | **Great Hunt** — the Jedi hunt the Sith devotees and Sith-spawned beasts (notably terentateks) left by the war | Jedi Order | Outer Rim worlds | MEDIUM |

---

## ════════════════════════════════
## MANDALORIAN WARS — 3,976–3,960 BBY
## ════════════════════════════════

### Overview
Twenty years after the Great Sith War, the Mandalorian Crusaders — secretly goaded by the Sith Emperor — launch a new war. Under Mandalore the Ultimate and his lieutenant Cassus Fett, they conquer the Outer Rim with brutal efficiency. The Jedi Council refuses to intervene — seeing a shadowy hand behind the war. Revan defies the Council, discovers proof of the Cathar genocide, and leads Jedi volunteers to war. A tactical genius, Revan turns the tide and drives the Mandalorians back. The war ends at Malachor V with the Mass Shadow Generator — a superweapon that crushes everything in Malachor's atmosphere. Revan and Malak, publicly hunting the last Mandalorians, then follow the Sith's influence into the Unknown Regions — where the Sith Emperor turns them.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,976 BBY** | **Mandalorian Wars begin** — Mandalore the Ultimate, secretly manipulated by a Sith emissary, launches new crusade of conquest | Mandalore the Ultimate, Cassus Fett (lieutenant), Mandalorian Neo-Crusaders | Outer Rim Territories | CRITICAL |
| **3,976–3,965 BBY** | **Mandalorian Neo-Crusader conquests** — Outer Rim worlds fall in rapid succession; Cathar nearly exterminated; Republic Senate refuses to act | Cassus Fett, Mandalore the Ultimate | Multiple Outer Rim worlds | HIGH |
| **3,973 BBY** | **Battle of Cathar** — the second battle of the war, before the invasion of Republic space; Cassus Fett's forces kill over 90% of the Cathar species, herding them into the sea; only a few hundred are left on the planet, the other survivors flee or are enslaved; one Mandalorian woman who protests is killed [Ruled (Jared, 24 Nov 2026)] | Cassus Fett, Cathar species (near-extinct), an unnamed Mandalorian woman (†) | Cathar | CRITICAL |
| **3,976–3,964 BBY** | Jedi Council debates intervention; ultimately refuses; citing a hidden dark force behind the war | Jedi Council | Coruscant | HIGH |
| **3,963 BBY** | **Jedi Knight Revan discovers Cathar massacre evidence** — picks up dead Mandalorian woman's mask; entire group of Jedi experiences Force vision of the genocide; Revan dons the mask; vows Mandalorian defeat | Revan (takes name here), Alek/Malak, Ferroh (Cathar Jedi), other Jedi | Cathar | CRITICAL |
| **3,964 BBY** | **Revanchist movement** — Revan and Alek (later Malak) travel the galaxy rallying Jedi to join the war; Republic media calls them heroes the Council ignores | Revan, Alek (Malak), other Revanchist Jedi | Republic space | HIGH |
| **3,965–3,964 BBY** | **False War** — the Mandalorians first clash with the Republic Military; it ends with the Battle of Vanquo in 3,964 BBY | Mandalorian raiders, Republic border forces | Republic-Mandalorian border | MEDIUM |
| **3,963 BBY** | **Siege of Taris** — Mandalorians break through Republic lines and besiege Taris; marks start of full-scale invasion | Mandalore the Ultimate, Republic forces | Taris | HIGH |
| **3,963–3,962 BBY** | **The Onslaught** — Mandalorians invade through three separate corridors simultaneously; Republic nearly overwhelmed | Cassus Fett, Mandalorian Neo-Crusaders | Multiple fronts | HIGH |
| **3,963 BBY** | **Revanchists join the war** — Revan and Jedi volunteers join Republic Military under banner of Republic Mercy Corps; Council reluctantly allows it | Revan, Malak, Meetra Surik, other Revanchist Jedi | Multiple fronts | CRITICAL |
| **3,962 BBY** | **Revan appointed Supreme Commander** — Supreme Chancellor Tol Cressa recognizes Revan's military genius; appoints him to lead Republic war effort | Revan, Supreme Chancellor Tol Cressa | Republic command | HIGH |
| **~3,961 BBY** | Revan and Malak visit **Malachor V** — encounter ancient Sith teachings; discover the Trayus Academy; begin learning Sith knowledge | Revan, Malak | Malachor V | CRITICAL |
| **3,961–3,960 BBY** | **Revanchist victories** — Revan drives Mandalorians from Taris and annihilates their ground forces at Althir; Jaga's Cluster is a Republic disaster and Cassus Fett's victory | Revan, Malak, Cassus Fett | Multiple fronts | HIGH |
| **3,960 BBY** | **Battle of Malachor V** — Revan lures Mandalorians to Malachor V; on General Meetra Surik's order Bao-Dur activates the Mass Shadow Generator [Ruled (Jared, 24 Nov 2026)]; it crushes everything in Malachor's atmosphere; Revan kills Mandalore the Ultimate in single combat | Revan, Mandalore the Ultimate (†), Meetra Surik (orders it), Bao-Dur (designed and activates it), Mandalorian Neo-Crusaders (majority killed) | Malachor V | CRITICAL |
| **3,960 BBY** | **Mandalorian Wars end** — Mandalore the Ultimate killed; survivors scatter or take up mercenary work; Mandalore's Mask hidden by Revan | Revan, surviving Mandalorians, Canderous Ordo (survivor) | Malachor V | CRITICAL |
| **3,960 BBY** | Revan and Malak take their forces into the Unknown Regions, publicly hunting the last Mandalorians; in fact the two go alone to Rekkiad, Nathema and Dromund Kaas on the trail of the Sith influence behind the war [Ruled (Jared, 24 Nov 2026)] | Revan, Malak | Unknown Regions | CRITICAL |
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
| **3,959–3,957 BBY** | Carth Onasi, a Republic Navy commander (3,958–3,956 BBY; lieutenant from 3,964, admiral after Rakata Prime), fights losing defensive campaigns [Ruled (Jared, 24 Nov 2026)] | Carth Onasi | Multiple fronts | MEDIUM |
| **~3,957 BBY** | **Jedi strike team attacks Revan's flagship** — Jedi Council sends team including Bastila Shan to capture/kill Revan | Bastila Shan, Jedi strike team, Darth Revan | Revan's flagship | CRITICAL |
| **~3,957 BBY** | **Darth Malak betrays Revan** — fires on Revan's own flagship during the Jedi attack, attempting to kill both Revan and the Jedi | Darth Malak, Darth Revan (gravely wounded) | Revan's flagship | CRITICAL |
| **~3,957 BBY** | **Bastila Shan captures Revan** — uses battle meditation to save his life; brings him back to the Jedi | Bastila Shan, Revan | Revan's flagship | CRITICAL |
| **~3,957 BBY** | **Jedi Council wipes Revan's memory** — creates new identity; sends him with Bastila to find the Star Forge | Dantooine Enclave Council (Vandar Tokare, Vrook Lamar, Zhar Lestin, Dorak), Revan (new identity created), Bastila Shan | Dantooine | CRITICAL |
| **~3,957–3,956 BBY** | **Revan's search** — Revan (amnesiac) slowly recovers fragments of memory; travels to Dantooine, Tatooine, Kashyyyk, Manaan, Korriban; finds Star Maps to locate Star Forge | Revan (amnesiac), Bastila Shan, Carth Onasi, Mission Vao, Zaalbar, Canderous Ordo, HK-47 | Dantooine, Tatooine, Kashyyyk, Manaan, Korriban | HIGH |
| **~3,956 BBY** | Bastila Shan is captured by Darth Malak aboard the *Leviathan*; she falls to the dark side after a week of torture | Bastila Shan, Darth Malak | the *Leviathan* | HIGH |
| **~3,956 BBY** | Malak reveals Revan's identity to him aboard the *Leviathan*; Revan chooses the light side | Revan, Darth Malak, Bastila Shan | the *Leviathan* | HIGH |
| **3,956 BBY** | **Battle of Rakata Prime** — Revan defeats and redeems Bastila; Republic fleet battles Star Forge fleet above Rakata Prime | Revan, Bastila Shan (redeemed), Republic fleet, Sith fleet | Rakata Prime (Lehon) | CRITICAL |
| **3,956 BBY** | **Darth Malak killed** by Revan aboard the Star Forge | Revan, Darth Malak (†) | Star Forge, Rakata Prime orbit | CRITICAL |
| **3,956 BBY** | **Star Forge destroyed** — Republic bombs it after Revan and Bastila escape | Republic fleet, Star Forge (destroyed) | Rakata Prime orbit | CRITICAL |
| **3,956 BBY** | **Jedi Civil War ends** — Republic celebrates; Revan celebrated as hero; remaining Sith descend into civil war | Republic, Jedi Order, surviving Sith factions | Galaxy-wide | CRITICAL |

---

## ══════════════════════════════════════════
## DARK WARS / FIRST JEDI PURGE — 3,955–3,951 BBY
## ══════════════════════════════════════════

### Overview
From the ashes of Revan's Sith Empire, three Sith Lords form a Triumvirate and nearly succeed in exterminating the Jedi Order. Darth Nihilus becomes a literal wound in the Force — he must consume Force-sensitives to survive. Darth Sion is held alive only by pain and hatred. Darth Traya/Kreia is a Jedi Master who betrayed the Order and seeks to destroy the Force itself. The Jedi Exile (Meetra Surik) — exiled for following Revan to war, where she ordered the Mass Shadow Generator fired — returns and dismantles them one by one.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,956–3,950 BBY** | **Sith Civil War** — Revan's remaining Sith tear each other apart; dozens of warlords fight for scraps of his Empire | Multiple Sith warlords | Former Sith Empire territory | HIGH |
| **by 3,954 BBY** | **Sith Triumvirate formed** — founded by Darth Traya with Darth Nihilus and Darth Sion; rules the remains of Revan's Sith Empire from Malachor V | Darth Traya (Kreia), Darth Nihilus, Darth Sion | Malachor V, Trayus Academy | CRITICAL |
| **3,954 BBY** | **First Jedi Purge begins** — Sith assassins wage shadow war; hunt and kill Jedi across the galaxy | Darth Sion (commands assassins), Sith assassins | Galaxy-wide | CRITICAL |
| **3,954 BBY** | Nihilus and Sion strip Darth Traya of her Force connection; exile her from Malachor V | Darth Nihilus, Darth Sion, Darth Traya (exiled, stripped of Force) | Malachor V | HIGH |
| **~3,952 BBY** | **Massacre at Katarr** — Darth Nihilus drains all life from planet Katarr; nearly 100 Jedi die attending secret conclave; only Visas Marr survives, turned into Nihilus's servant | Darth Nihilus, Jedi conclave (nearly all †), Visas Marr (enslaved) | Katarr | CRITICAL |
| **3,951 BBY** | **Meetra Surik (Jedi Exile) returns** — called back from exile; seeks out surviving Jedi Masters to rebuild the Order | Meetra Surik, Atton Rand, Bao-Dur, Mical (Disciple), Handmaiden (Brianna), Visas Marr (joins), GOTO | Peragus → Telos → multiple worlds | CRITICAL |
| **3,951 BBY** | Meetra Surik pursues and finds surviving Jedi Masters — Vrook Lamar, Kavar and Zez-Kai Ell; they meet on Dantooine (Atris stays on Telos) | Meetra Surik, Vrook Lamar, Kavar, Zez-Kai Ell | Dantooine | HIGH |
| **3,951 BBY** | **Deaths of the Jedi Masters on Dantooine** — Kreia (Darth Traya) kills the gathered Masters by severing them from the Force | Vrook Lamar (†), Kavar (†), Zez-Kai Ell (†), Kreia/Darth Traya | Dantooine ruins | CRITICAL |
| **3,951 BBY** | **Battle of Telos** — Darth Nihilus brings his ship Ravager to consume Telos IV; Meetra Surik, Mandalore the Preserver, and Visas Marr board the Ravager | Meetra Surik, Mandalore the Preserver (Canderous Ordo), Visas Marr, Darth Nihilus | Telos IV, the Ravager | CRITICAL |
| **3,951 BBY** | **Darth Nihilus killed** — Visas Marr weakens him; Meetra Surik kills him; Mandalorian explosives destroy the Ravager | Meetra Surik, Visas Marr, Darth Nihilus (†), Ravager (destroyed) | Telos orbit | CRITICAL |
| **3,951 BBY** | **Malachor V — Trayus Academy** — Meetra Surik defeats Darth Sion; Sion chooses to die rather than continue his pain-fueled existence | Meetra Surik, Darth Sion (†, chooses death) | Malachor V, Trayus Academy | CRITICAL |
| **3,951 BBY** | **Kreia's revelation and death** — Darth Traya reveals she sought to destroy the Force itself; Meetra Surik kills her at the Trayus Core | Meetra Surik, Darth Traya/Kreia (†) | Malachor V, Trayus Core | CRITICAL |
| **3,951 BBY** | **Malachor V destroyed** — Bao-Dur's remote reactivates the Mass Shadow Generator; planet destroyed | Bao-Dur's remote, Malachor V (destroyed) | Malachor V | HIGH |
| **3,951 BBY** | **First Jedi Purge ends** — Sith Triumvirate destroyed; Jedi Order nearly extinct but surviving | Meetra Surik, Jedi Order remnant | Galaxy-wide | CRITICAL |
| **3,954 BBY** | **Revan leaves for the Unknown Regions** (before the Exile's return) — goes to find the true Sith; shot down on Nathema and captured by Darth Nyriss and Scourge, who hold him in secret for four years (the Emperor imprisons him only after the failed attack of 3,950 BBY) | Revan (captive), Darth Nyriss, Scourge | Nathema → Dromund Kaas | CRITICAL |
| **3,950 BBY** | Meetra Surik follows Revan into the Unknown Regions and dies on Dromund Kaas | Meetra Surik (†) | Unknown Regions | HIGH |

---

## ════════════════════════════════════════════
## OLD REPUBLIC RECOVERY — 3,950–3,681 BBY
## ════════════════════════════════════════════

### Overview
270 years of recovery and rebuilding. The Jedi Order slowly rebuilds on Coruscant. The reconstituted Sith Empire builds its strength in the Unknown Regions under the immortal Sith Emperor. Over generations Imperial agents infiltrate Republic space, installing puppet governments in key Outer Rim systems as the invasion nears. The Hydian Way super-hyperroute is blazed, connecting the galaxy — and creating the chokepoint the Mandalorians will later exploit.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **3,950 BBY** | After Meetra Surik leaves, her Lost Jedi, with Bastila Shan and Atris, begin rebuilding the Jedi Order: they reopen the Coruscant Temple and seat a new High Council [Ruled (Jared, 24 Nov 2026)] | the Lost Jedi, Bastila Shan, Atris | Coruscant, scattered worlds | HIGH |

---

*Great Galactic War to the Legacy of the Sith (3,700 to c. 3,622 in BBY): see SW_Timeline_3700_3600BBY_Part1–3 (lore batch 20). The old rows are kept in docs-v2/lore/superseded/; the Legacy Change framework and the faction state seeds moved to docs-v2/spec/14-world-state-and-events.md.*

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
| **20 BBY** | **Darth Maul returns** — Savage Opress finds him on Lotho Minor and Mother Talzin rebuilds him; his Clone Wars arc follows (the Shadow Collective, Mandalore, Duchess Satine's death; *Son of Dathomir*) | Darth Maul, Savage Opress, Mother Talzin | Lotho Minor, Dathomir, Mandalore | HIGH |
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

## ═══════════════════════════════════
## NEW REPUBLIC ERA — 4–25 ABY
## ═══════════════════════════════════

### Overview
The New Republic fights to consolidate power against a fragmenting Empire. The Empire tears itself apart in the Imperial Civil War as dozens of warlords feud. Ysanne Isard holds Coruscant then Thyferra before being defeated in the Bacta War. Grand Admiral Thrawn nearly reverses the war in 9 ABY before being assassinated. The reborn Emperor Palpatine returns via clones (Dark Empire) and is permanently destroyed ~11 ABY. Admiral Daala executes the squabbling warlords ~12 ABY, and Gilad Pellaeon consolidates the survivors into the Imperial Remnant. The war finally ends with the Pellaeon–Gavrisom Treaty (Bastion Accords) in 19 ABY.

| Date | Event | Key Figures | Location | Downstream |
|---|---|---|---|---|
| **4–12 ABY** | **Imperial Civil War** (also the Imperial Mutiny, the War of Purification, the Time of Destruction) — shortly after Endor the Empire fractures into feuding warlord states across the galaxy; the New Republic exploits the chaos to liberate world after world; it ends with Daala's execution of the warlords in 12 ABY [Ruled (Jared, 24 Nov 2026)] | Ysanne Isard, Sate Pestage, multiple Imperial warlords, New Republic | Galaxy-wide | HIGH |
| **8–10 ABY** | **Luke Skywalker recovers Jedi lore** — he receives the *Chu'unthor* records on Dathomir (8 ABY), and Leia takes the Tedryn Holocron (10 ABY) | Luke Skywalker, Leia Organa Solo | Dathomir; Byss | HIGH |
| **6 ABY** | **Liberation of Coruscant** — New Republic captures the Imperial capital [Ruled (Jared, 24 Nov 2026)]; Ysanne Isard stays hidden beneath it, releases the Krytos virus, and some weeks later (7 ABY) leaves in the *Lusankya* and takes Thyferra | Wedge Antilles, Rogue Squadron, Ysanne Isard, Mon Mothma | Coruscant | HIGH |
| **7 ABY** | **Bacta War** — Ysanne Isard seizes Thyferra and weaponizes the galaxy's bacta supply; Rogue Squadron (gone independent) defeats her; she escapes, presumed dead, and dies at Bilbringi in 9 ABY | Ysanne Isard (defeated), Wedge Antilles, Rogue Squadron | Thyferra | MEDIUM |
| **~9 ABY** | **Thrawn Campaign** — Grand Admiral Thrawn returns from the Unknown Regions; uses the Spaarti cloning cylinders in the Emperor's storehouse at Mount Tantiss to grow clone soldiers, and ysalamiri to block the Force; nearly defeats the New Republic | Grand Admiral Thrawn (†, assassinated), Captain Gilad Pellaeon, Joruus C'baoth (clone, †), Luke Skywalker, Mara Jade (Imperial assassin turned ally), Han Solo, Leia Organa | Multiple worlds, Bilbringi | CRITICAL |
| **9 ABY** | **Thrawn assassinated by his own Noghri bodyguard Rukh** during the Battle of Bilbringi; his forces retreat; the campaign collapses | Grand Admiral Thrawn (†), Rukh (kills him), Captain Pellaeon | Bilbringi | CRITICAL |
| **~10 ABY** | **Reborn Emperor — Dark Empire / Operation Shadow Hand** — Palpatine returns in a cloned body from his hidden world of Byss; the Imperial Coalition under his secret leadership takes Coruscant, then falls on itself (the Imperial Mutiny); Shadow Hand ends with the Empire in control of about a third of the galaxy | Reborn Emperor Palpatine (clone), Luke Skywalker (briefly falls, then returns), Leia Organa | Byss, Coruscant, multiple worlds | CRITICAL |
| **11 ABY** | **Exar Kun's spirit attacks the Jedi** — the ancient Sith's trapped spirit on Yavin 4 awakens and tries to corrupt Luke's first students; defeated | Exar Kun (spirit, †, destroyed), Kyp Durron (temporarily corrupted), Luke Skywalker | Yavin 4 | HIGH |
| **~11 ABY** | **Reborn Emperor permanently destroyed** — Palpatine's final clone body killed; his spirit consumed/blocked by the dying Jedi Empatojayos Brand, ending him forever | Reborn Emperor Palpatine (†, permanent), Empatojayos Brand (†), Luke Skywalker, Leia Organa, Han Solo | Onderon | CRITICAL |
| **11 ABY** | **Jedi Praxeum founded** — Luke Skywalker opens his academy on Yavin 4 and trains the first generation of new Jedi Knights (the Exar Kun crisis happens during its first year) | Luke Skywalker, Kyp Durron, Kam Solusar, Corran Horn | Yavin 4 | HIGH |
| **~12 ABY** | **Daala unifies the warlords** — Admiral Natasi Daala, disgusted by the warlords' infighting, gathers thirteen of them at Tsoss Beacon and executes them; ends the Imperial Civil War | Admiral Natasi Daala, thirteen Imperial warlords (†), Gilad Pellaeon | Tsoss Beacon, Deep Core | HIGH |
| **~12 ABY** | **Imperial Remnant consolidated under Pellaeon** — after Daala's own campaigns fail, she cedes command to Gilad Pellaeon, who pulls the Empire's surviving forces into a coherent Imperial Remnant | Gilad Pellaeon, Admiral Daala | Deep Core → Outer Rim | HIGH |
| **12 ABY** | **Desann's attack on the Jedi Praxeum** — fallen Jedi Desann assaults Luke's academy with Force-empowered Dark Jedi and shadowtroopers; defeated by Kyle Katarn | Desann (†), Kyle Katarn, Luke Skywalker | Yavin 4 | MEDIUM |
| **12–19 ABY** | New Republic expands; Imperial Remnant whittled down to a few sectors; Leia and Han's children (the twins Jacen and Jaina born 9 ABY, Anakin 10 ABY) grow up | Leia Organa, Han Solo, Jacen Solo, Jaina Solo, Anakin Solo | Coruscant and various | MEDIUM |
| **19 ABY** | **Pellaeon–Gavrisom Treaty** — Supreme Commander Gilad Pellaeon of the Imperial Remnant and New Republic Chief of State Ponc Gavrisom sign peace, with Mon Mothma attending; the Galactic Civil War formally ends after more than two decades; cloaking devices banned; systems choose their alignment | Supreme Commander Gilad Pellaeon, Chief of State Ponc Gavrisom, Mon Mothma | aboard the *Chimaera* | CRITICAL |
| **19 ABY** | **Luke Skywalker marries Mara Jade** — former Emperor's Hand turned Jedi; their union strengthens the New Jedi Order's leadership | Luke Skywalker, Mara Jade Skywalker | Coruscant | MEDIUM |
| c. 25 ABY | The BBY/ABY calendar, created by the New Republic Historical Council, becomes the official galactic calendar, replacing the Great ReSynchronization | New Republic Historical Council | Galaxy-wide | LOW |

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
