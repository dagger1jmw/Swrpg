# Star Wars Legends — Character Sheets
## Era 04/05: Sith Interwar & the Great Sith War (≈4,400–3,996 BBY)

---

## ABOUT THIS DOCUMENT

Character reference for the long peace after the Great Hyperspace War and the cataclysmic **Great Sith War** (the Exar Kun War, 3,996 BBY) that ended it. Covers the Beast Wars and Freedon Nadd Uprising on Onderon, the rise of the Krath, and the war waged by the fallen Jedi Exar Kun and Ulic Qel-Droma. Drawn from the *Tales of the Jedi* comic line and supporting Legends sources.

Stats represent each character **at their prime**, on the **galaxy-wide Legends scale** (consistent across every era doc).

### Stat Scale (galaxy-wide, all of Legends)
| Band | Range | Meaning |
|---|---|---|
| Novice / civilian | 10–40 | Untrained or non-combatant |
| Trained | 40–60 | Competent Knight-equivalent, rank-and-file warrior |
| Veteran / elite | 60–85 | Seasoned Knight, skilled commander |
| Master | 85–100 | Master-tier; ceiling for nearly all Force users |
| **Legendary** | **100–150** | Mastery far beyond any normal Jedi or Sith. **Per-stat, not blanket.** |

### Stat tiers (matches game engine)
Initiate 0–20 · Padawan 21–40 · Knight 41–60 · Master 61–80 · Grandmaster 81–100 · Legendary 101–150 · Transcendent 151+

### Stats in use (v3 — six core, five Force)
**Core:** Strength · Agility · Endurance · Willpower · Charisma · **Intelligence**. **Force:** ForceSense · Meditation · ForceKnowledge · ForceControl · **ForceOutput**.

### NEW IN THIS PASS — numeric Forms & Force Ability stats
Every combatant now carries **game-ready numeric stats**, not just prose:
- **Form ratings (game stats):** each lightsaber form the character uses, rated 0–150 on the same tier scale. These map directly to `lightsaberForms.*` in the engine. Forms a character never trained are omitted (treat as 0).
- **Force Abilities (game stats):** each registry ability rated 0–150 (the base ability level → `forceAbilities.*`), followed in parentheses by notable **sub-ability proficiency percentages** 0–100 (→ `forceAbilityProficiency`). Proficiency bands: Novice 0–25 · Developing 26–50 · Proficient 51–70 · Expert 71–90 · Mastered 91–100.
- Abilities that share a name with a Force stat (e.g. Force Sense) use that stat value as their base level.
- **Unique techniques** with no registry entry (Force Light, Force-severing, spirit-binding) are listed separately and flagged — they are not standard `forceAbilities` keys.

### The seven classic forms (display names → engine keys)
I (Shii-Cho → `ShiiCho`) · II (Makashi → `Makashi`) · III (Soresu → `Soresu`) · IV (Ataru → `Ataru`) · V (Shien/Djem So → `ShienDjemSo`) · VI (Niman → `Niman`) · VII (Juyo → `Juyo`). By this era Shii-Cho is the universal foundation; Makashi (dueling) is well-developed; the rest exist but are far rarer. **Exar Kun is the singular exception — trained in all seven, with Form VI (Niman) as his lethal specialty.**

### Dual sheets
**Exar Kun** and **Ulic Qel-Droma** each get two sheets (Jedi/pre-fall and Sith Dark Lord). Change-notes at the end.

### Schema
Each sheet: **Core Stats** (6) · **Force Stats** (5) · **Lightsaber Forms/Bladework** (prose + numeric form ratings) · **Force Abilities (game stats)** (numeric) · **Unique techniques** (where any) · **Signature Ability** · **Notable Feats** · **Alignment**.

---

# THE JEDI ORDER (HEROES OF THE WAR)

---

## Nomi Sunrider
- **Sheet snapshot:** Prime — Jedi Knight/Master, battle-meditation prodigy
- **Species / Affiliation / Rank:** Human · Jedi Order · Knight → Master (later head of the Order)
- **Lifespan:** Active in the Freedon Nadd Uprising and Great Sith War (4,000–3,996 BBY); long later life as a revered Master
- **Summary:** A reluctant Jedi whose latent Force power astonished even her master, Thon. Widowed early, she took up her late husband's lightsaber and rose to become one of the greatest Jedi of her age. She loved Ulic Qel-Droma and fought for his soul. Her battle meditation turned engagements across the war, and in its climax she did what no one else could — severing the fallen Ulic's connection to the Force entirely. Her command of Force Light was later ranked alongside Yoda's and Thon's.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 58 | | ForceSense | 90 |
| Agility | 70 | | Meditation | 96 |
| Endurance | 64 | | ForceKnowledge | 88 |
| Willpower | 98 | | ForceControl | 95 |
| Charisma | 82 | | ForceOutput | 88 |
| Intelligence | 84 | | | |

- **Lightsaber Forms / Bladework:** A competent duelist who wields her late husband Andur's lightsaber, but her gift was never the blade — she ends fights through the Force. Defensive and controlled.
  **Form ratings (game stats):** Shii-Cho 60 · Makashi 48 · Soresu 56
- **Force Abilities (game stats):** Battle Meditation 105 *(Force Valor 95%)* · Force Sense 90 *(Battle Foresight 82%, Farsight 70%)* · Telekinesis 85 *(Force Push 80%, Force Throw 68%)* · Force Barrier 80 *(Force Absorb 60%)*
- **Unique techniques:** **Force Light** *(legendary light-side power, ranked with Yoda/Thon)* · **Force-severing** *(severed Ulic's Force connection entirely — no registry equivalent)*
- **Signature Ability:** **Battle meditation & Force Light** — projecting morale-shaping will across battlefields, wielding Force Light, and uniquely able to **sever another being's connection to the Force**.
- **Notable Feats:** Turned Krath guards on each other via battle meditation; countered Aleema's mass illusions; severed Ulic from the Force; ranked with Yoda and Thon in Force Light.
- **Alignment:** Light side.
- **Tier:** **Legendary** (battle meditation / Force Light / Force-severing); standard-tier duelist.

---

## Vodo-Siosk Baas
- **Sheet snapshot:** Prime — Jedi Master, teacher of Exar Kun
- **Species / Affiliation / Rank:** Krevaaki · Jedi Order · Master
- **Lifespan:** Active through the Great Sith War; killed by Exar Kun on Coruscant (3,996 BBY)
- **Summary:** A wise, respected Master who carried a staff-cane and trained many students on Dantooine — including, to his grief, Exar Kun. He confronted his fallen apprentice in the Senate Hall and died against Kun's new double-bladed lightsaber. His spirit later returned at Yavin 4 to help destroy Kun.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 72 | | ForceSense | 86 |
| Agility | 70 | | Meditation | 90 |
| Endurance | 76 | | ForceKnowledge | 92 |
| Willpower | 92 | | ForceControl | 88 |
| Charisma | 80 | | ForceOutput | 80 |
| Intelligence | 88 | | | |

- **Lightsaber Forms / Bladework:** Fights with a staff-cane as much as a lightsaber, in a measured, defensive method built on a teacher's patience. Skilled but no legendary duelist — overcome by a stronger, fallen pupil.
  **Form ratings (game stats):** Shii-Cho 75 · Soresu 70 · Makashi 58
- **Force Abilities (game stats):** Battle Meditation 75 *(Force Valor 80%)* · Telekinesis 82 *(Force Push 80%, Force Wave 62%)* · Force Sense 86 *(Precognitive Reflexes 60%)* · Force Barrier 78
- **Unique techniques:** **Spirit transcendence** *(returned as a Force presence to aid the living against Kun)*
- **Signature Ability:** **Sage-master's insight** — deep wisdom, teaching mastery, and the ability to return as a Force presence after death.
- **Notable Feats:** Trained Exar Kun and many others; confronted Kun in the Senate; his returning spirit was key to Kun's final defeat on Yavin 4.
- **Alignment:** Light side.
- **Tier:** High Master (Force / wisdom).

---

## Arca Jeth
- **Sheet snapshot:** Prime — Jedi Master and Watchman of Onderon
- **Species / Affiliation / Rank:** Arkanian · Jedi Order · Master, Watchman of the Onderon system
- **Lifespan:** Active through the Beast Wars and Freedon Nadd Uprising; murdered by the Krath before the war
- **Summary:** Trained Ulic and Cay Qel-Droma and Tott Doneeta. As Watchman of Onderon he ended the 300-year Beast Wars with battle meditation and banished Freedon Nadd's influence from Iziz. His death at Krath hands drove Ulic on his fateful infiltration mission.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 64 | | ForceSense | 88 |
| Agility | 66 | | Meditation | 94 |
| Endurance | 68 | | ForceKnowledge | 88 |
| Willpower | 90 | | ForceControl | 86 |
| Charisma | 82 | | ForceOutput | 80 |
| Intelligence | 86 | | | |

- **Lightsaber Forms / Bladework:** A capable practitioner who fights through the Force first — measured and wise in combat, never aggressive.
  **Form ratings (game stats):** Shii-Cho 66 · Soresu 64 · Makashi 50
- **Force Abilities (game stats):** Battle Meditation 90 *(Force Valor 92%)* · Force Sense 88 *(Farsight 80%, Battle Foresight 68%)* · Telekinesis 80 *(Force Push 75%)* · Force Barrier 78 · Force Stasis 60 *(Force Slow 55%)*
- **Unique techniques:** **Spirit-banishment** *(banished Freedon Nadd's lingering spirit from Iziz)*
- **Signature Ability:** **Battle meditation** — able to turn a war single-handedly from orbit; powerful enough to banish a Sith Lord's spirit.
- **Notable Feats:** Ended the Beast Wars; defeated Queen Amanoa and banished Nadd's spirit; trained the Qel-Droma brothers and Tott Doneeta.
- **Alignment:** Light side.
- **Tier:** High Master (Force / battle meditation).

---

## Master Thon
- **Sheet snapshot:** Prime — Jedi Master, teacher of Nomi Sunrider
- **Species / Affiliation / Rank:** Tchuukthai (large, beastlike) · Jedi Order · Master
- **Lifespan:** Active during the Great Sith War era; ancient and long-lived
- **Summary:** A powerful, ancient Master in a beast's form who trained Nomi Sunrider on Ambria, drawing out her astonishing latent power. His command of Force Light was spoken of alongside Yoda's. Wise and patient.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 82 | | ForceSense | 90 |
| Agility | 58 | | Meditation | 94 |
| Endurance | 88 | | ForceKnowledge | 90 |
| Willpower | 94 | | ForceControl | 92 |
| Charisma | 74 | | ForceOutput | 90 |
| Intelligence | 86 | | | |

- **Lightsaber Forms / Bladework:** Fights through the Force, not a blade — his beastlike form and vast power make weapons unnecessary. *(No trained lightsaber forms.)*
  **Form ratings (game stats):** *(none — non-saber combatant)*
- **Force Abilities (game stats):** Telekinesis 92 *(Force Push 85%, Force Wave 80%)* · Force Sense 90 *(Farsight 82%)* · Force Barrier 88 *(Force Absorb 80%)* · Battle Meditation 78 *(Force Valor 72%)*
- **Unique techniques:** **Force Light** *(among the greatest practitioners ever, ranked with Yoda)*
- **Signature Ability:** **Force Light mastery** — a deep well of light-side power in a beastlike form.
- **Notable Feats:** Trained Nomi Sunrider and drew out her latent power; reckoned one of the Order's wisest and strongest.
- **Alignment:** Light side.
- **Tier:** High Master–Legendary (Force Light / raw Force depth).

---

## Cay Qel-Droma
- **Sheet snapshot:** Prime — Jedi Knight, Ulic's younger brother
- **Species / Affiliation / Rank:** Human · Jedi Order · Knight
- **Lifespan:** Active 4,000–3,996 BBY; killed by his brother Ulic at the Battle of Ossus
- **Summary:** An Alderaanian Jedi trained under Arca Jeth, a gifted mechanic who replaced his own lost limbs with cybernetics. He never stopped loving his brother even after Ulic's fall — and was struck down by Ulic's own hand at Ossus, a fratricide that began Ulic's redemption.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 62 | | ForceSense | 72 |
| Agility | 70 | | Meditation | 66 |
| Endurance | 66 | | ForceKnowledge | 68 |
| Willpower | 78 | | ForceControl | 72 |
| Charisma | 74 | | ForceOutput | 66 |
| Intelligence | 82 | | | |

- **Lightsaber Forms / Bladework:** A solid Knight who adapted his technique around his cybernetic limbs — practical and resourceful rather than flashy.
  **Form ratings (game stats):** Shii-Cho 62 · Shien/Djem So 56
- **Force Abilities (game stats):** Telekinesis 70 *(Force Push 60%)* · Force Sense 72 *(Precognitive Reflexes 58%)* · Force Body 55 *(Force Speed 45%)* · Force Barrier 60
- **Signature Ability:** **Master mechanic** — an exceptional engineer who built and maintained his own cybernetic limbs and repaired droids and ships in the field.
- **Notable Feats:** Fought through the Beast Wars and the whole war; never abandoned his fallen brother; his death turned Ulic back toward the light.
- **Alignment:** Light side.
- **Tier:** Veteran (Jedi Knight).

---

## Tott Doneeta
- **Sheet snapshot:** Prime — Jedi Knight, beast-speaker
- **Species / Affiliation / Rank:** Twi'lek · Jedi Order · Knight
- **Lifespan:** Active 4,000–3,996 BBY; survived the war
- **Summary:** A former slave found and trained by Arca Jeth, with a rare innate gift for communicating with and bonding beasts — decisive in the Beast Wars when he won over the Boma and drexl creatures.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 60 | | ForceSense | 74 |
| Agility | 68 | | Meditation | 68 |
| Endurance | 64 | | ForceKnowledge | 66 |
| Willpower | 76 | | ForceControl | 72 |
| Charisma | 72 | | ForceOutput | 68 |
| Intelligence | 70 | | | |

- **Lightsaber Forms / Bladework:** A competent Knight, steady rather than spectacular; his combat edge is the beasts he can call to his side.
  **Form ratings (game stats):** Shii-Cho 60
- **Force Abilities (game stats):** Force Sense 74 *(Force Empathy / Animal Bond 82%)* · Telekinesis 68 *(Force Push 58%)* · Force Body 58 *(Force Speed 50%)* · Mind Trick 52 *(Force Persuasion 45%, extends to beast-minds)*
- **Signature Ability:** **Animal bond** — an innate gift to understand, communicate with, and direct beasts.
- **Notable Feats:** Helped end the Beast Wars by allying with the Beast Riders' creatures; loyal Jedi throughout the war.
- **Alignment:** Light side.
- **Tier:** Veteran (Jedi Knight).

---

# EXAR KUN — DUAL SHEETS

---

## Exar Kun (I) — Jedi Knight / fallen seeker
- **Sheet snapshot:** Pre-fall prime — gifted, prideful Jedi Knight descending into the dark
- **Species / Affiliation / Rank:** Human · Jedi Order (student of Vodo-Siosk Baas) · Knight
- **Lifespan:** This snapshot ~3,997 BBY, before Marka Ragnos crowns him Dark Lord
- **Summary:** The most gifted and most arrogant of Baas's students, consumed by curiosity about the forbidden history of the Sith. He stole the Tedryn Holocron, learned of Freedon Nadd, and struck out against his master's wishes. Even before his fall he was an exceptional duelist — uniquely, already trained across all seven classic forms, with Niman his favored discipline.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 78 | | ForceSense | 82 |
| Agility | 86 | | Meditation | 72 |
| Endurance | 80 | | ForceKnowledge | 84 |
| Willpower | 88 | | ForceControl | 86 |
| Charisma | 84 | | ForceOutput | 84 |
| Intelligence | 88 | | | |

- **Lightsaber Forms / Bladework:** A prodigiously gifted combatant — already conversant in all seven forms, favoring fast, aggressive, acrobatic pressure and the balanced versatility of Niman. A showman whose pride made every duel a performance. *(Has not yet invented the double-blade.)*
  **Form ratings (game stats):** Shii-Cho 80 · Makashi 78 · Soresu 70 · Ataru 84 · Shien/Djem So 76 · **Niman 86** · Juyo 72
- **Force Abilities (game stats):** Telekinesis 82 *(Force Push 78%, Force Throw 65%)* · Force Body 80 *(Force Speed 80%, Force Strength 62%)* · Force Sense 82 *(Precognitive Reflexes 75%)* · Mind Trick 55 *(Force Persuasion 50%)*
- **Signature Ability:** **Voracious Force-talent** — a once-in-a-generation aptitude across combat and Force study, paired with a reckless hunger for forbidden knowledge.
- **Notable Feats:** Baas's most gifted student; stole the Tedryn Holocron; tracked Nadd's secrets across Onderon, Dxun, and Korriban.
- **Alignment:** Light → falling.
- **Tier:** Elite — high-Master dueling on the cusp of legendary; already all-seven-forms trained.

---

## Exar Kun (II) — Dark Lord of the Sith
- **Sheet snapshot:** Dark Lord prime — anointed Dark Lord of the Sith, leader of the Brotherhood of the Sith
- **Species / Affiliation / Rank:** Human · Sith (Brotherhood of the Sith) · Dark Lord of the Sith
- **Lifespan:** Crowned ~3,997 BBY; defeated 3,996 BBY at Yavin 4, where his spirit remained trapped for ~4,000 years
- **Summary:** After mastering Sith alchemy on Yavin 4 and destroying Freedon Nadd's spirit, Kun was anointed Dark Lord by the ghost of Marka Ragnos, with Ulic as his apprentice. He enslaved the Massassi, forged the Brotherhood of the Sith, and waged the Great Sith War. He **invented the double-bladed lightsaber**, killed his old master with it, engineered the Cron Supernova, and drained his own Massassi to bind his spirit to Yavin 4. The dark side amplified his power far beyond his Jedi peak. **He remains the textbook example of a duelist who mastered all seven forms and made Form VI (Niman) genuinely lethal** — a feat almost no one else achieved.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 88 | | ForceSense | 92 |
| Agility | 100 | | Meditation | 88 |
| Endurance | 92 | | ForceKnowledge | 100 |
| Willpower | 105 | | ForceControl | 102 |
| Charisma | 95 | | ForceOutput | 102 |
| Intelligence | 92 | | | |

- **Lightsaber Forms / Bladework:** One of the **greatest lightsaber duelists in Sith history** and the **inventor of the double-bladed lightsaber (saberstaff)**. He fuses acrobatic aggression with Sith ferocity and sorcery — spinning two-ended attacks interlaced with Force speed, telekinetic strikes, and Sith magic mid-duel. **Master of all seven classic forms; his signature is Form VI (Niman)**, which he wielded with a lethality few in history ever matched, using its balanced versatility to flow seamlessly between offense, defense, and Force attacks.
  **Form ratings (game stats):** Shii-Cho 98 · Makashi 100 · Soresu 96 · Ataru 102 · Shien/Djem So 100 · **Niman 110** · Juyo 98
- **Force Abilities (game stats):** Sith Alchemy 105 *(Midi-chlorian Manipulation 95%)* · Telekinesis 98 *(Force Push 90%, Force Throw 85%)* · Force Lightning 88 *(Chain Lightning 80%, Force Storm 60%)* · Force Body 95 *(Force Speed 95%, Force Strength 82%)* · Mind Probe 85 *(Mind Control 78%)* · Force Sense 92 *(Precognitive Reflexes 88%)*
- **Unique techniques:** **Spirit-binding** *(bound his spirit to Yavin 4, surviving ~4,000 years)* · **Sith battle-magic** *(mass life-drain to power his last defense)*
- **Signature Ability:** **Sith sorcery & spirit-binding** — mastery of Sith alchemy and battle-magic culminating in draining an entire population and binding his own spirit to survive bodily death for four millennia.
- **Notable Feats:** Anointed Dark Lord by Ragnos's ghost; founded the Brotherhood; invented the saberstaff; killed Vodo-Siosk Baas and Chancellor Sidrona; engineered the Cron Supernova; bound his spirit to Yavin 4 (menacing Luke's students ~3,500 years later).
- **Alignment:** Dark side (absolute).
- **Tier:** **Legendary** (dueling / Sith sorcery / will).

---

# ULIC QEL-DROMA — DUAL SHEETS

---

## Ulic Qel-Droma (I) — Jedi Knight
- **Sheet snapshot:** Pre-fall prime — heroic Jedi Knight, Arca Jeth's finest student
- **Species / Affiliation / Rank:** Human · Jedi Order · Knight
- **Lifespan:** This snapshot ~4,000–3,997 BBY, before his fall
- **Summary:** An Alderaanian Jedi trained under Arca Jeth and regarded as his finest student — a natural leader, formidable duelist, and courageous Knight. He ended the Beast Wars, fought the Freedon Nadd Uprising, fell in love with Nomi Sunrider, and recklessly proposed the Krath infiltration that consumed him.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 76 | | ForceSense | 82 |
| Agility | 82 | | Meditation | 76 |
| Endurance | 78 | | ForceKnowledge | 80 |
| Willpower | 84 | | ForceControl | 84 |
| Charisma | 86 | | ForceOutput | 82 |
| Intelligence | 80 | | | |

- **Lightsaber Forms / Bladework:** A formidable duelist with a direct, confident, commanding style — he fights like the war-leader he is, pressing forward and rallying others. Favors the power-counterattack of Form V.
  **Form ratings (game stats):** Shii-Cho 78 · Makashi 70 · Ataru 74 · Shien/Djem So 78
- **Force Abilities (game stats):** Telekinesis 80 *(Force Push 78%)* · Force Body 80 *(Force Speed 80%, Force Strength 65%)* · Force Sense 82 *(Precognitive Reflexes 78%)* · Battle Meditation 60 *(Force Valor 55%)*
- **Signature Ability:** **Natural war-leader** — a charismatic, courageous commander whom others instinctively followed.
- **Notable Feats:** Ended the Beast Wars; fought the Freedon Nadd Uprising; Arca Jeth's finest student.
- **Alignment:** Light side (about to fall).
- **Tier:** Elite (Jedi Knight / duelist / leader).

---

## Ulic Qel-Droma (II) — Dark Lord / fallen warlord
- **Sheet snapshot:** Dark Lord prime — Sith apprentice to Exar Kun, Krath warlord
- **Species / Affiliation / Rank:** Human · Sith (apprentice to Exar Kun) / Krath warlord · Sith Lord
- **Lifespan:** Fell ~3,997 BBY; Force-stripped at Ossus 3,996 BBY; later assassinated
- **Summary:** Corrupted while infiltrating the Krath, Ulic seized the Krath, was anointed a Sith Lord by Ragnos's ghost, subjugated the Mandalorians, and led the assault on Coruscant. The dark side made him a juggernaut — until he killed his own brother Cay at Ossus and Nomi Sunrider **severed him from the Force entirely**, leaving him a hollow shell. Redeemed in spirit but powerless, he guided the Jedi to defeat Kun before dying in obscurity.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 86 | | ForceSense | 88 |
| Agility | 90 | | Meditation | 80 |
| Endurance | 88 | | ForceKnowledge | 86 |
| Willpower | 92 | | ForceControl | 94 |
| Charisma | 88 | | ForceOutput | 92 |
| Intelligence | 80 | | | |

- **Lightsaber Forms / Bladework:** Overwhelming dark-side ferocity — his disciplined foundation now fused with Sith aggression and amplified by rage, channeling far greater strength and speed than in his Jedi days. He leans hard into the power-style of Form V and the aggression of Form VII.
  **Form ratings (game stats):** Shii-Cho 88 · Makashi 80 · Ataru 84 · Shien/Djem So 92 · Juyo 82
- **Force Abilities (game stats):** Force Body 100 *(Force Strength 95%, Force Speed 93%)* · Telekinesis 90 *(Force Push 88%, Force Throw 80%)* · Force Lightning 82 *(Chain Lightning 72%)* · Force Rage 85 · Battle Meditation 78 *(Force Valor 80%)*
- **Signature Ability:** **Dark-side war-juggernaut** — channeling the dark side to vastly amplify his physical power and battlefield presence, leading Krath, Mandalorian, and Sith armies.
- **Notable Feats:** Seized the Krath; subjugated the Mandalorians (beating Mandalore the Indomitable in single combat); led the assault on Coruscant; killed Cay at Ossus; after being Force-stripped, guided the Jedi to Kun's defeat.
- **Alignment:** Dark side (later redeemed, but Force-stripped).
- **Tier:** **Legendary**-adjacent (dark-side combat / leadership). *(Post-Ossus: treat all Force stats and Force abilities as 0 — Force-stripped. Form ratings represent muscle-memory only, unusable without the Force.)*

---

# THE KRATH & THE MANDALORIANS

---

## Mandalore the Indomitable
- **Sheet snapshot:** Prime — Mandalore, leader of the Mandalorian Crusaders
- **Species / Affiliation / Rank:** Human (Mandalorian) · Mandalorian Crusaders · Mandalore (the title)
- **Lifespan:** Active in the Great Sith War (3,996 BBY); died on Dxun shortly after
- **Summary:** Led the Crusaders during the war. After Ulic bested him in single combat, he pledged the clans to Ulic's cause, fighting with Basilisk war droids. A warrior of immense prowess bound by an honorable code. He died on Dxun, his mask passing down the Mandalorian line.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 88 | | ForceSense | — |
| Agility | 80 | | Meditation | — |
| Endurance | 90 | | ForceKnowledge | — |
| Willpower | 88 | | ForceControl | — |
| Charisma | 82 | | ForceOutput | — (not Force-sensitive) |
| Intelligence | 80 | | | |

- **Lightsaber Forms / Bladework:** A master of **Mandalorian arms, beskar'gam armor, and Basilisk war droids** — not a saber duelist, but able to challenge Force-users in open war through superior equipment, ferocity, and tactics.
  **Form ratings (game stats):** *(none — non-saber warrior; Melee/Ranged combat rating ≈ 88, expressed through core stats + Mandalorian gear)*
- **Force Abilities (game stats):** N/A — not Force-sensitive.
- **Signature Ability:** **Mandalorian war-leader** — supreme warrior-commander in full battle-armor with Basilisk war droids, able to challenge Force-users in open war.
- **Notable Feats:** Led the Crusaders; pledged the clans to Ulic after losing in single combat; spearheaded the droid assaults; died battling the beasts of Dxun.
- **Alignment:** N/A (warrior's code).
- **Tier:** Elite (non-Force warrior-commander); legendary-tier physical prowess for a mortal.

---

## Aleema Keto
- **Sheet snapshot:** Prime — Krath sorceress, co-ruler of the Krath
- **Species / Affiliation / Rank:** Human (Tetan noble) · Krath · Sith sorceress / co-ruler
- **Lifespan:** Founded the Krath ~3,998 BBY; killed 3,996 BBY by Exar Kun's manipulation at the Cron Cluster
- **Summary:** A vain, cruel Tetan aristocrat who, with her cousin Satal, learned the dark arts from Freedon Nadd's teachings and founded the Krath. A gifted Sith **illusionist** who conjured battlefield phantasms. Treacherous to the end, she was manipulated by Kun into triggering the Cron Supernova.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 50 | | ForceSense | 76 |
| Agility | 60 | | Meditation | 70 |
| Endurance | 56 | | ForceKnowledge | 84 |
| Willpower | 80 | | ForceControl | 82 |
| Charisma | 80 | | ForceOutput | 82 |
| Intelligence | 80 | | | |

- **Lightsaber Forms / Bladework:** A sorceress, not a duelist — avoids melee entirely.
  **Form ratings (game stats):** *(none)*
- **Force Abilities (game stats):** Mind Trick 84 *(Force Projection 95% — mass battlefield illusions)* · Sith Alchemy 70 *(Midi-chlorian Manipulation 50%)* · Force Lightning 55 *(Force Shock 55%)* · Telekinesis 52 *(Force Push 48%)*
- **Signature Ability:** **Sith battlefield illusion** — conjuring massed, convincing phantasms to deceive and terrorize enemy forces.
- **Notable Feats:** Co-founded the Krath; deployed mass illusions throughout the war; triggered (under Kun's manipulation) the Cron Supernova that destroyed Ossus.
- **Alignment:** Dark side.
- **Tier:** Master (Sith sorcery / illusion); weak physical.

---

## Satal Keto
- **Sheet snapshot:** Prime — Krath co-founder
- **Species / Affiliation / Rank:** Human (Tetan noble, heir) · Krath · Sith adept / co-ruler
- **Lifespan:** Founded the Krath ~3,998 BBY; killed during the war by Ulic Qel-Droma
- **Summary:** Aleema's cousin and co-founder of the Krath. Together they obtained Sith knowledge from Freedon Nadd and built the Krath into a dark-side power. Cruel and grasping, slain by Ulic.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 54 | | ForceSense | 72 |
| Agility | 60 | | Meditation | 66 |
| Endurance | 58 | | ForceKnowledge | 80 |
| Willpower | 76 | | ForceControl | 76 |
| Charisma | 74 | | ForceOutput | 76 |
| Intelligence | 78 | | | |

- **Lightsaber Forms / Bladework:** An adept, not a duelist; minimal blade skill.
  **Form ratings (game stats):** Shii-Cho 35
- **Force Abilities (game stats):** Sith Alchemy 65 *(Midi-chlorian Manipulation 48%)* · Force Lightning 60 *(Force Shock 60%, Chain Lightning 40%)* · Mind Trick 58 *(Force Persuasion 50%)* · Telekinesis 52 *(Force Push 48%)*
- **Signature Ability:** **Sith sorcery** — dark-side magic learned directly from Freedon Nadd's teachings.
- **Notable Feats:** Co-founded the Krath and seized the Empress Teta system; helped spread the Sith knowledge that ignited the war.
- **Alignment:** Dark side.
- **Tier:** Veteran–Master (Sith sorcery); weak physical.

---

## Freedon Nadd
- **Sheet snapshot:** Prime — fallen Jedi, Dark Lord of Onderon (as a living being)
- **Species / Affiliation / Rank:** Human · Jedi → Sith · Dark Lord of the Sith, King of Onderon
- **Lifespan:** Lived ~4,400–4,350 BBY; persisted as a Dark Lord spirit for centuries afterward
- **Summary:** A fallen Jedi who sought Naga Sadow's dark knowledge, became a Sith Lord, and conquered Onderon. Long after death his spirit manipulated events for centuries — setting the Keto cousins on the Sith path, foretelling Ulic's fall, and trying to use Exar Kun to regain a body, only for Kun to destroy his spirit. *(This sheet is his living prime.)*

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 74 | | ForceSense | 86 |
| Agility | 76 | | Meditation | 82 |
| Endurance | 76 | | ForceKnowledge | 92 |
| Willpower | 94 | | ForceControl | 92 |
| Charisma | 84 | | ForceOutput | 90 |
| Intelligence | 90 | | | |

- **Lightsaber Forms / Bladework:** A capable duelist trained as a Jedi before his fall, fighting on a solid foundation hardened by Sith aggression — but his true power was always sorcery.
  **Form ratings (game stats):** Shii-Cho 76 · Makashi 78 · Shien/Djem So 70
- **Force Abilities (game stats):** Sith Alchemy 85 *(Midi-chlorian Manipulation 80%)* · Mind Probe 84 *(Mind Control 82%)* · Force Lightning 82 *(Chain Lightning 78%)* · Telekinesis 80 *(Force Push 78%)* · Force Sense 86 *(Farsight 70%)*
- **Unique techniques:** **Spirit-persistence** *(bound his consciousness beyond death, manipulating events for centuries)*
- **Signature Ability:** **Sith spirit-persistence** — bound his consciousness beyond death, manipulating Onderon and the galaxy as a Dark Lord spirit for centuries.
- **Notable Feats:** Conquered and ruled Onderon; seeded Sith teachings into the royal line and the Krath; foretold Ulic's fall and lured Exar Kun to the dark from beyond the grave.
- **Alignment:** Dark side.
- **Tier:** High Master–Legendary (Sith sorcery / spirit-persistence).

---

# SECONDARY FIGURES (compact bench)

*(Core adds INT after CHA; Force adds FOut after FCtrl. Forms/abilities columns give the headline numeric ratings.)*

| Name | Species | Role | STR | AGI | END | WIL | CHA | INT | FSense | Med | FKnow | FCtrl | FOut | Top Forms (game stats) | Top Force Abilities (game stats) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sylvar | Cathar | Jedi Knight, fierce duelist | 78 | 80 | 76 | 74 | 64 | 64 | 74 | 64 | 66 | 74 | 76 | Shii-Cho 72 · Ataru 76 · Juyo 60 | Force Body 74 *(Speed 72%, Strength 65%)* · Telekinesis 66 *(Push 60%)* |
| Crado | Cathar | Sylvar's mate; fell to Kun | 74 | 74 | 72 | 66 | 60 | 62 | 70 | 60 | 64 | 70 | 72 | Shii-Cho 68 · Ataru 70 | Force Body 70 *(Speed 66%)* · Force Lightning 50 *(Shock 50%)* |
| Dace Diath | Human | Jedi Knight | 64 | 70 | 66 | 76 | 68 | 70 | 72 | 66 | 68 | 72 | 70 | Shii-Cho 70 · Soresu 64 | Telekinesis 68 *(Push 60%)* · Force Sense 72 *(Precog 60%)* |
| Shoaneb Culu | Miraluka | Jedi Knight (Force-sees) | 58 | 66 | 60 | 78 | 66 | 74 | 86 | 72 | 74 | 74 | 70 | Shii-Cho 62 · Makashi 58 | Force Sense 86 *(Force Sight 90%)* · Telekinesis 66 |
| Qrrrl Toq | (large) | Jedi Knight, brawler | 80 | 60 | 80 | 72 | 58 | 58 | 68 | 60 | 60 | 66 | 70 | Shii-Cho 66 · Shien/Djem So 64 | Force Body 66 *(Strength 70%)* · Telekinesis 60 |
| Oss Wilum | Vultan | Jedi Knight, Arca's student | 62 | 64 | 64 | 74 | 64 | 66 | 72 | 66 | 68 | 70 | 68 | Shii-Cho 64 · Soresu 58 | Telekinesis 66 · Battle Meditation 55 *(Valor 50%)* |
| Odan-Urr (elderly) | Draethos | Loremaster (see Era 03) | 50 | 50 | 58 | 88 | 76 | 95 | 88 | 92 | 96 | 78 | 72 | Shii-Cho 55 | Battle Meditation 85 *(Valor 88%)* · Force Sense 88 *(Precog 80%)* |
| King Ommin | Human | Naddist sorcerer-king | 30 | 28 | 50 | 82 | 70 | 82 | 78 | 74 | 86 | 80 | 80 | *(none)* | Sith Alchemy 80 *(Midi 70%)* · Force Lightning 72 *(Chain 60%)* |
| Queen Amanoa | Human | Naddist queen of Iziz | 48 | 50 | 52 | 76 | 70 | 72 | 72 | 68 | 78 | 74 | 74 | *(none)* | Sith Alchemy 65 · Force Lightning 60 *(Shock 58%)* |

---

## QUICK-REFERENCE TIER TABLE

| Character | Affiliation | Primary Tier | Standout Stat(s) | Peak Form |
|---|---|---|---|---|
| Exar Kun (Dark Lord) | Sith Empire (Kun) | **Legendary** | AGI 100 / FCtrl 102 / WIL 105 / FOut 102 | **Niman 110** |
| Nomi Sunrider | Jedi Order | **Legendary** | Med 96 / FCtrl 95 (battle med. / Force Light) | Shii-Cho 60 |
| Ulic Qel-Droma (Dark Lord) | Sith (Kun's apprentice) | **Legendary**-adjacent | AGI 90 / FCtrl 94 / FOut 92 | Djem So 92 |
| Freedon Nadd | Sith / Onderon | High Master–Legendary | FKnow 92 / FCtrl 92 / INT 90 | Makashi 78 |
| Master Thon | Jedi Order | High Master–Legendary | WIL 94 / Med 94 / FOut 90 | *(no forms)* |
| Vodo-Siosk Baas | Jedi Order | High Master | FKnow 92 / Med 90 / INT 88 | Shii-Cho 75 |
| Arca Jeth | Jedi Order | High Master | Meditation 94 | Shii-Cho 66 |
| Exar Kun (Jedi) | Jedi Order | Elite | AGI 86 / INT 88 (all-7 forms) | **Niman 86** |
| Ulic Qel-Droma (Jedi) | Jedi Order | Elite | CHA 86 / AGI 82 | Djem So 78 |
| Mandalore the Indomitable | Mandalorians | Elite (non-Force) | END 90 / STR 88 | *(no forms)* |
| Aleema Keto | Krath | Master | FKnow 84 / FOut 82 (illusion) | *(no forms)* |
| Cay Qel-Droma | Jedi Order | Veteran | AGI 70 / INT 82 (mechanic) | Shii-Cho 62 |
| Satal Keto | Krath | Veteran–Master | ForceKnowledge 80 | Shii-Cho 35 |
| Tott Doneeta | Jedi Order | Veteran | ForceSense 74 (animal bond) | Shii-Cho 60 |

---

*Era 04/05 of the Star Wars Legends character-sheet series. Stats are prime-version, galaxy-wide scale. **Now fully game-ready: numeric Form ratings (0–150) and numeric Force Ability stats (base level 0–150 + sub-ability proficiency 0–100%) for every combatant**, alongside the prose descriptions. Era-unique powers — Force Light, Force-severing, spirit-binding — are flagged as non-registry signature techniques.*

> **Cross-era appearance notes:**
> - **Marka Ragnos** appears here only as a Force ghost. Full stats in Era 03.
> - **Naga Sadow's** tomb on Yavin 4 figures into Kun's rise. Full stats in Era 03.
> - **Odan-Urr** (Era 03) makes his final appearance here, elderly, slain by Exar Kun. Bench entry reflects his aged state; loremaster INT 95 preserved.
> - **Exar Kun's spirit** survives bodily death, bound to Yavin 4 for ~4,000 years (menacing Luke's students ~11 ABY). Reuse the Dark Lord sheet as a non-corporeal entity when we reach that era.
> - **Mandalore the Indomitable's** death on Dxun passes the Mask down toward Mandalore the Ultimate (Era 06).

> **CHANGE-NOTES (characters who fundamentally shifted):**
> - **Exar Kun — two sheets (Jedi → Dark Lord).** The fall amplified him into the **legendary** band: AGI 86→100, FCtrl 86→102, WIL 88→105, FOut 84→102. His form ratings climb across the board, with **Niman 86→110** — capturing both "master of all seven forms" and "specialized in Form VI, made it viable in combat." Niman is his single highest form on both sheets.
> - **Ulic Qel-Droma — two sheets (Jedi → Dark Lord).** Dark-side amplification: FOut 82→92, Force Body to 100 (Strength/Speed both 93–95%), form ratings up ~10 each with Juyo added. **Post-Ossus he is Force-stripped — set all Force stats and Force abilities to 0**; his form ratings become inert muscle-memory (unusable without the Force). Flagged on his sheet for a future "Force-stripped Ulic" mini-profile if wanted.
> - **Freedon Nadd** has a living sheet here but only manifests as a spirit this era. The living stats represent his ceiling.
