# Star Wars Legends — Character Sheets
## Era 03: Golden Age of the Sith & the Great Hyperspace War (≈5,100–4,990 BBY)

---

## ABOUT THIS DOCUMENT

Character reference for the Golden Age of the Sith under Dark Lord Marka Ragnos and the **Great Hyperspace War** (5,000 BBY) — the first galaxy-spanning Sith-Republic war, sparked when the hyperspace scouts Gav and Jori Daragon stumbled into Sith space. Drawn from *Tales of the Jedi — The Golden Age of the Sith* and *The Fall of the Sith Empire* (Dark Horse), plus supporting Legends sources.

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
- **Intelligence** — the masterminds top it: **Vitiate (origin) and Naga Sadow**, with the loremaster **Odan-Urr** matching them on pure scholarship.
- **ForceOutput** = raw power/magnitude (distinct from ForceControl, which is finesse).

### NEW IN THIS PASS — game-ready numeric stats
Every combatant now carries **numeric stats**:
- **Bladework rating (game stats):** formal lightsaber forms were still not codified. Jedi use lightsabers; the Sith favor Force-imbued swords and sorcery. Each armed fighter gets a single **Armed-Combat / Bladework rating** (0–150). In the engine, enter in the foundational combat slot (`lightsaberForms.ShiiCho` as "base armed combat") or a custom `Bladework` entry. Non-combatants show *(none)*.
- **Force Abilities (game stats):** each registry ability at base level 0–150 (→ `forceAbilities.*`), with notable sub-ability proficiency percentages 0–100 in parentheses (→ `forceAbilityProficiency`). Bands: Novice 0–25 · Developing 26–50 · Proficient 51–70 · Expert 71–90 · Mastered 91–100.
- Abilities sharing a name with a Force stat (Force Sense) use that stat value as the base level.
- **Unique techniques** (Sith sorcery, meditation-sphere battle-magic, mass life-drain, spirit transcendence) flagged separately where they exceed a clean registry mapping.

### Era Notes on Scaling
The apex of the **first** Sith Empire. Marka Ragnos and Naga Sadow are the legendary figures — **per specialty**: Sadow's sorcery/alchemy/battle-magic is legendary, his dueling merely high-Master. The Jedi side is comparatively modest — scholars and battle-meditation users (Odan-Urr, Memit Nadill) rather than legendary duelists.

### Era Notes on Combat
**No legendary duelist appears this era** — its legends are sorcerers and battle-meditation tacticians, so most Bladework ratings are modest and the real power sits in Force abilities.

### Schema
Each sheet: **Core Stats** (6) · **Force Stats** (5) · **Lightsaber Forms/Bladework** (method + numeric rating) · **Force Abilities (game stats)** (numeric) · **Unique techniques** (where any) · **Signature Ability** · **Notable Feats** · **Alignment**.

---

# THE SITH EMPIRE

---

## Marka Ragnos — Dark Lord of the Golden Age
- **Sheet snapshot:** Prime — Dark Lord of the Sith, ruler of the Golden Age
- **Species / Affiliation / Rank:** Sith (half-breed) · Sith Empire · Dark Lord of the Sith
- **Lifespan:** Reigned ~100 years; died 5,000 BBY of old age; persisted as a Force ghost for a thousand years
- **Summary:** The Dark Lord whose century-long, iron-fisted reign defined the Golden Age. His death triggered the Sadow-Kressh succession crisis, and his spirit warned the rivals that only the worthy should succeed him. A millennium later he crowned Exar Kun as Dark Lord (Era 05).

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 84 | | ForceSense | 90 |
| Agility | 78 | | Meditation | 95 |
| Endurance | 86 | | ForceKnowledge | 100 |
| Willpower | 105 | | ForceControl | 100 |
| Charisma | 95 | | ForceOutput | 98 |
| Intelligence | 92 | | | |

- **Lightsaber Forms / Bladework:** Wields heavy **Sith war-blades** in a commanding style backed by overwhelming sorcery. A warrior-king who breaks rivals with raw power and presence. Held off every challenger for a century.
  **Bladework rating (game stats):** 85
- **Force Abilities (game stats):** Sith Sorcery 100 *(the dominion-magic that held an empire for 100 years)* · Force Lightning 88 *(Chain Lightning 82%)* · Telekinesis 88 *(Force Push 82%, Force Throw 82%)* · Mind Probe 85 *(Mind Control 82% — domination of rivals)* · Force Sense 90
- **Unique techniques:** **Spirit transcendence** *(persisted as a Force ghost for 1,000 years)*
- **Signature Ability:** **Dark Lord's dominion & spirit transcendence** — held a fractious empire for a century; retained full conscious power as a Force ghost.
- **Notable Feats:** Reigned ~100 years; presided over the Golden Age; manifested as a ghost to guide his succession; crowned Exar Kun a millennium later.
- **Alignment:** Dark side.
- **Tier:** **Legendary** (Sith sorcery / will / longevity).

---

## Naga Sadow — Dark Lord who waged the Great Hyperspace War
- **Sheet snapshot:** Prime — master Sith alchemist, Dark Lord of the Sith
- **Species / Affiliation / Rank:** Sith (mostly Human-featured) · Sith Empire · Viceroy of Khar Shian → Dark Lord
- **Lifespan:** Seized the Dark Lordship and waged the Great Hyperspace War in 5,000 BBY; fled to Yavin 4 and died there centuries later
- **Summary:** A master Sith alchemist and sorcerer who seized on the Daragons' arrival to win the Dark Lordship over Ludo Kressh. He launched the Great Hyperspace War, relying on surprise, Force illusions, and his **meditation sphere** to direct his fleets. His overconfidence undid him; he fled to Yavin 4, where his Massassi worshipped him. His surviving order seeded Vitiate's rebuilt Empire.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 74 | | ForceSense | 92 |
| Agility | 72 | | Meditation | 100 |
| Endurance | 78 | | ForceKnowledge | 104 |
| Willpower | 100 | | ForceControl | 102 |
| Charisma | 90 | | ForceOutput | 100 |
| Intelligence | 95 | | | |

- **Lightsaber Forms / Bladework:** Fights through sorcery, illusion, and Sith blades rather than dueling — a high-Master swordsman who would always rather warp a battle with magic. His true weapon is the meditation sphere.
  **Bladework rating (game stats):** 72
- **Force Abilities (game stats):** Sith Alchemy 104 *(**Midi-chlorian Manipulation** 95% — master alchemist, Massassi enhancement)* · Battle Meditation 104 *(**meditation-sphere battle-magic** 95% — directed entire fleets)* · Mind Trick 92 *(**Force Projection** 95% — mass battlefield illusions)* · Force Lightning 85 *(Chain Lightning 82%)* · Telekinesis 85 *(Force Push 82%)*
- **Unique techniques:** **Meditation-sphere battle-magic** *(amplified his power to direct fleets across multiple worlds)*
- **Signature Ability:** **Meditation-sphere battle-magic & Force illusion** — directing entire fleets and unleashing mass illusions; master Sith alchemist.
- **Notable Feats:** Seized the Dark Lordship; launched the Great Hyperspace War; conducted simultaneous multi-world invasions; ignited the star at Primus Goluud.
- **Alignment:** Dark side.
- **Tier:** **Legendary** (Sith sorcery / alchemy / battle-magic); high-Master dueling.

---

## Ludo Kressh — conservative rival for the Dark Lordship
- **Sheet snapshot:** Prime — Sith Lord, Sadow's great rival
- **Species / Affiliation / Rank:** Sith (half-breed) · Sith Empire · Sith Lord; father of Kressh the Younger
- **Lifespan:** Killed during the Great Hyperspace War (5,000 BBY) when Sadow rammed a ship into his flagship
- **Summary:** A powerful, conservative Sith Lord and Sadow's bitter rival. An isolationist who correctly judged the Daragons a threat, he faked his own death to expose Sadow's treachery — but his schemes failed and Sadow killed him.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 78 | | ForceSense | 84 |
| Agility | 74 | | Meditation | 82 |
| Endurance | 80 | | ForceKnowledge | 90 |
| Willpower | 92 | | ForceControl | 90 |
| Charisma | 80 | | ForceOutput | 84 |
| Intelligence | 82 | | | |

- **Lightsaber Forms / Bladework:** Wields a **Force-imbued sword** in an aggressive, dark-amplified style — using Battlemind and the dark side to boost speed and strength mid-duel. Harder-edged in melee than the sorcerous Sadow.
  **Bladework rating (game stats):** 78
- **Force Abilities (game stats):** Battlemind 82 *(combat-clarity amplification)* · Force Body 80 *(Force Speed 82%, Force Strength 82%)* · Sith Alchemy 65 *(devised a protective device for his son)* · Force Lightning 60 *(Chain Lightning 55%)* · Telekinesis 80 *(Force Push 82%)*
- **Signature Ability:** **Battlemind & dark-side amplification** — amplified his speed, strength, and rage; a proficient Sith alchemist and sorcerer.
- **Notable Feats:** Contested Sadow for the Dark Lordship; faked his own death and ambushed Sadow's fortress; nearly defeated Sadow in their final fleet duel.
- **Alignment:** Dark side.
- **Tier:** High Master (Sith warrior / sorcerer).

---

## Simus — Sith Council elder, Sadow's master
- **Sheet snapshot:** Prime — Sith Lord and teacher
- **Species / Affiliation / Rank:** Sith · Sith Empire · Sith Lord / warlord, Sith Council member
- **Lifespan:** Active under Ragnos's reign; reduced to a disembodied living head sustained by sorcery
- **Summary:** The Sith warlord who trained Naga Sadow. By the late Golden Age he was a living, talking severed head sustained by Sith alchemy — continuing to advise and scheme.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 30 | | ForceSense | 80 |
| Agility | 20 | | Meditation | 82 |
| Endurance | 60 | | ForceKnowledge | 90 |
| Willpower | 88 | | ForceControl | 78 |
| Charisma | 70 | | ForceOutput | 70 |
| Intelligence | 88 | | | |

- **Lightsaber Forms / Bladework:** Physically incapacitated — a disembodied head.
  **Bladework rating (game stats):** *(none)*
- **Force Abilities (game stats):** Sith Alchemy 78 *(**life-sustaining sorcery** 95% — kept his own severed head alive)* · Mind Probe 80 *(Mind Control 70% — counsel and manipulation)* · Force Sense 80 · Telekinesis 50
- **Unique techniques:** **Unnatural persistence** *(kept alive as a disembodied head through Sith sorcery)*
- **Signature Ability:** **Unnatural persistence** — retained his full knowledge and cunning as a living head.
- **Notable Feats:** Trained Naga Sadow; survived as a living head; advised the Sith Council.
- **Alignment:** Dark side.
- **Tier:** Master (Sith knowledge); physical stats reflect his disembodied state.

---

## Tenebrae / Lord Vitiate — origin of the immortal Sith Emperor
- **Sheet snapshot:** **Origin / early prime** — the young Lord Vitiate (NOT his later god-emperor apex; see note)
- **Species / Affiliation / Rank:** Sith (human-presenting hybrid) · Sith Empire (Medriaas/Nathema) · Lord
- **Lifespan:** Born ~5,113 BBY; killed his father ~5,100 BBY; named Lord Vitiate at 13; performed the Nathema ritual ~5,000 BBY; led the exodus to Dromund Kaas (4,980 BBY); destroyed permanently ~3,630 BBY
- **Summary:** Born on the fringe world Medriaas with a terrifyingly strong dark-side connection, the boy Tenebrae massacred thousands before age ten. He killed his true father Lord Dramath in a duel and imprisoned his spirit. Named Lord Vitiate by Marka Ragnos at thirteen, he withdrew to Nathema for a century — then, after Sadow's defeat, summoned the surviving Sith Lords, **mentally enslaved them, and drained the life of every Sith Lord and the entire planet**, making himself effectively immortal. As the self-proclaimed Sith Emperor he led a 20-year exodus to Dromund Kaas and founded the reconstituted Empire.

| Core (origin) | Value | | Force (origin) | Value |
|---|---|---|---|---|
| Strength | 70 | | ForceSense | 95 |
| Agility | 74 | | Meditation | 92 |
| Endurance | 78 | | ForceKnowledge | 100 |
| Willpower | 105 | | ForceControl | 102 |
| Charisma | 92 | | ForceOutput | 100 |
| Intelligence | 98 | | | |

- **Lightsaber Forms / Bladework:** Duels capably — he killed his own father in single combat as a youth — but is defined by sorcery and mind power, not the blade. The blade is a formality; his will is the weapon.
  **Bladework rating (game stats):** 70
- **Force Abilities (game stats):** Mind Probe 102 *(**Mind Control** 95% — enslaved an entire conclave of Sith Lords)* · Sith Alchemy 100 *(**mass life-drain ritual** 95% — drained a whole planet)* · Sith Sorcery 85 *(spirit-severing — imprisoned his father's spirit)* · Force Lightning 85 *(Chain Lightning 82%)* · Telekinesis 82 *(Force Push 82%)*
- **Unique techniques:** **Mass life-drain** *(drained the life of every surviving Sith Lord and all of Nathema — foundation of his immortality)*
- **Signature Ability:** **Mass life-drain & mind domination** — even at this early stage, enslaving an entire conclave of Sith Lords and draining a whole planet to extend his own life.
- **Notable Feats:** Killed and spirit-imprisoned his father; impressed Marka Ragnos at 13; drained every surviving Sith Lord and all of Nathema; founded the reconstituted Sith Empire on Dromund Kaas.
- **Alignment:** Dark side (absolute).
- **Tier:** **Legendary** even at origin — and still far below his eventual apex.

> **Important scaling note:** These are his **origin-era** stats (~5,000 BBY). Over ~1,400 years he became the most powerful dark-side being in galactic history. His **true apex sheet** (130–150 band, mass-scale powers like draining the entire population of Ziost) belongs to the **Great Galactic War / SWTOR era (Era 09+)**. Do not use this sheet for the later god-emperor.

---

# THE REPUBLIC & JEDI ORDER

---

## Odan-Urr — Jedi scholar and battle-meditation prodigy
- **Sheet snapshot:** Prime — Jedi Master, sage, and Keeper of lore
- **Species / Affiliation / Rank:** Draethos · Jedi Order · Knight (this era) → revered Master and lore-keeper
- **Lifespan:** Young Jedi during the Great Hyperspace War (5,000 BBY); long-lived Draethos, slain by Exar Kun ~3,996 BBY
- **Summary:** A bookish Draethos scholar whose precognitive visions gave the first warning of the Sith invasion. At Kirrek he and Memit Nadill used **battle meditation** to turn the tide. He befriended Jori Daragon, gave her a lightsaber, and became one of history's great loremasters, founding the great Jedi library. *(Appears again in Era 05.)*

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 54 | | ForceSense | 88 |
| Agility | 58 | | Meditation | 92 |
| Endurance | 64 | | ForceKnowledge | 96 |
| Willpower | 88 | | ForceControl | 78 |
| Charisma | 76 | | ForceOutput | 72 |
| Intelligence | 95 | | | |

- **Lightsaber Forms / Bladework:** Wields a lightsaber competently but is no duelist — a scholar who fights defensively and prefers to win through the Force and the mind.
  **Bladework rating (game stats):** 55
- **Force Abilities (game stats):** Battle Meditation 90 *(Force Valor 82% — turned the Battle of Kirrek)* · Force Sense 88 *(**Precognition** 82% — foresaw the Sith invasion)* · Telekinesis 60 · Meditation discipline 82
- **Unique techniques:** **Loremaster** *(one of history's greatest Jedi loremasters; founded the Great Library)*
- **Signature Ability:** **Battle meditation** — bolstering allies and breaking enemies, paired with strong precognitive visions.
- **Notable Feats:** Foresaw the Sith invasion; helped win Kirrek; became a great loremaster; lived nearly 600 years.
- **Alignment:** Light side.
- **Tier:** High Master (Force knowledge / battle meditation); standard-tier combatant.

---

## Memit Nadill — Jedi Master, adviser to Empress Teta
- **Sheet snapshot:** Prime — Jedi Master and war adviser
- **Species / Affiliation / Rank:** Human · Jedi Order · Master; chief Jedi adviser to Empress Teta
- **Lifespan:** Active during the Unification Wars and the Great Hyperspace War (5,000 BBY)
- **Summary:** Empress Teta's most trusted Jedi adviser and a battle-meditation practitioner alongside Odan-Urr. A more experienced warrior-Jedi than the scholarly Odan-Urr, he carried the first warning of the invasion to Coruscant.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 64 | | ForceSense | 82 |
| Agility | 70 | | Meditation | 86 |
| Endurance | 68 | | ForceKnowledge | 80 |
| Willpower | 82 | | ForceControl | 80 |
| Charisma | 78 | | ForceOutput | 76 |
| Intelligence | 80 | | | |

- **Lightsaber Forms / Bladework:** A seasoned warrior-Jedi, more practiced in the field than Odan-Urr. Solid, dependable bladework backed by battle meditation.
  **Bladework rating (game stats):** 70
- **Force Abilities (game stats):** Battle Meditation 80 *(Force Valor 82% — co-won Kirrek)* · Telekinesis 75 *(Force Push 62%)* · Force Sense 82 *(Precognitive Reflexes 60%)* · Force Barrier 60
- **Signature Ability:** **Battle meditation** — co-wielded with Odan-Urr to turn Kirrek; a seasoned battlefield Jedi and statesman.
- **Notable Feats:** Adviser to Empress Teta; rescued the Daragons; carried the warning to Coruscant; helped win Kirrek.
- **Alignment:** Light side.
- **Tier:** Master (Force / battle meditation).

---

## Master Ooroo — Celegian Jedi sage
- **Sheet snapshot:** Prime — Jedi Master, teacher of Odan-Urr
- **Species / Affiliation / Rank:** Celegian (ammonia-breathing, in a sealed globe) · Jedi Order · Master
- **Lifespan:** Active during the Great Hyperspace War; died at the Battle of Kirrek (5,000 BBY)
- **Summary:** A telepathic, ammonia-dwelling Master and mentor to Odan-Urr. Powerful despite his physical fragility, he defeated a massed force of Massassi at Kirrek but sacrificed his life doing so.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 20 | | ForceSense | 86 |
| Agility | 30 | | Meditation | 90 |
| Endurance | 50 | | ForceKnowledge | 90 |
| Willpower | 90 | | ForceControl | 92 |
| Charisma | 74 | | ForceOutput | 82 |
| Intelligence | 88 | | | |

- **Lightsaber Forms / Bladework:** Non-physical combatant; fights purely through the Force.
  **Bladework rating (game stats):** *(none)*
- **Force Abilities (game stats):** Telekinesis 92 *(**mass Force projection** 82% — destroyed a massed Massassi assault single-handedly)* · Mind Trick 80 *(Force Persuasion 82% — telepathy)* · Meditation discipline 90 · Force Sense 86 *(Environmental Force Sense 82%)*
- **Unique techniques:** **Telepathic Force mastery** *(devastating power despite near-total physical limitation)*
- **Signature Ability:** **Telepathic Force mastery** — a purely mental Force-user who defeated a massed Massassi force single-handedly.
- **Notable Feats:** Trained Odan-Urr; warned of the Sith threat; destroyed a massed Massassi assault at Kirrek at the cost of his life.
- **Alignment:** Light side.
- **Tier:** High Master (Force); physical stats reflect Celegian frailty.

---

## Empress Teta — monarch of the Koros system
- **Sheet snapshot:** Prime — Empress of the seven-world Koros system
- **Species / Affiliation / Rank:** Human · Koros system / Galactic Republic · Empress (warlord-monarch)
- **Lifespan:** Unified the Koros system in the Unification Wars; reigned during and after the Great Hyperspace War (5,000 BBY)
- **Summary:** The monarch who united the seven worlds of the Koros system. She trusted her Jedi advisers' warnings about the Sith, alerted Coruscant, and personally led the Koros fleet that pursued Naga Sadow — a decisive contribution to victory.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 60 | | ForceSense | — |
| Agility | 66 | | Meditation | — |
| Endurance | 64 | | ForceKnowledge | — |
| Willpower | 84 | | ForceControl | — |
| Charisma | 90 | | ForceOutput | — (not Force-sensitive) |
| Intelligence | 84 | | | |

- **Lightsaber Forms / Bladework:** A capable warrior-monarch who can hold her own, but leads through command and statecraft rather than personal combat.
  **Bladework rating (game stats):** 60
- **Force Abilities (game stats):** N/A — not Force-sensitive.
- **Signature Ability:** **Unifier-monarch** — uniting seven feuding worlds and commanding fleets; the will to act on the Sith threat when the Senate dithered.
- **Notable Feats:** Won the Unification Wars; raised the alarm to Coruscant; led the Koros fleet that broke Sadow's invasion.
- **Alignment:** N/A (Republic monarch).
- **Tier:** Elite (non-Force monarch / commander); legendary-tier leadership for a mortal.

---

## Gav Daragon — hyperspace scout turned reluctant Sith pawn
- **Sheet snapshot:** Prime — hyperspace explorer, briefly Sadow's protégé
- **Species / Affiliation / Rank:** Human · independent hyperspace scout → Naga Sadow's protégé · pilot
- **Lifespan:** Triggered the war in 5,000 BBY; killed that same year over Primus Goluud
- **Summary:** Half of the sibling scout team whose accidental jump lit the fuse of the war. Groomed as a Sith pawn, he turned on Sadow at Primus Goluud — transmitting the Sith coordinates to Empress Teta and dying in the blast that destroyed Sadow's meditation sphere.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 52 | | ForceSense | 55 |
| Agility | 66 | | Meditation | 40 |
| Endurance | 56 | | ForceKnowledge | 42 |
| Willpower | 64 | | ForceControl | 48 |
| Charisma | 62 | | ForceOutput | 48 (latent, minimally trained) |
| Intelligence | 64 | | | |

- **Lightsaber Forms / Bladework:** A pilot, not a swordsman.
  **Bladework rating (game stats):** 35
- **Force Abilities (game stats):** Force Sense 55 *(**Precognitive Reflexes** 38% — ace-navigator instinct)* · Telekinesis 15 *(latent, barely trained)*
- **Signature Ability:** **Ace hyperspace navigator** — jumps that reached farther than any recorded Republic vessel.
- **Notable Feats:** Accidentally discovered Sith space; guided then betrayed Sadow's fleet; transmitted the coordinates that enabled the Republic's counterattack.
- **Alignment:** Neutral; briefly dark-influenced, died turning against the Sith.
- **Tier:** Trained (gifted pilot, latent Force potential).

---

## Jori Daragon — hyperspace scout, the Republic's warning
- **Sheet snapshot:** Prime — hyperspace explorer and war heroine
- **Species / Affiliation / Rank:** Human · independent hyperspace scout · pilot
- **Lifespan:** Triggered the war in 5,000 BBY; survived it; died later of natural causes
- **Summary:** The other half of the Daragon team. She delivered the warning that let the Republic mount a last-ditch defense. Odan-Urr recognized her Force potential and gave her a lightsaber. She survived the war and inherited Aarrba's repair dock.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 50 | | ForceSense | 52 |
| Agility | 68 | | Meditation | 38 |
| Endurance | 56 | | ForceKnowledge | 40 |
| Willpower | 70 | | ForceControl | 46 |
| Charisma | 64 | | ForceOutput | 46 (latent, minimally trained) |
| Intelligence | 68 | | | |

- **Lightsaber Forms / Bladework:** Given a lightsaber by Odan-Urr but never properly trained; fights on raw nerve and pilot's reflexes.
  **Bladework rating (game stats):** 40
- **Force Abilities (game stats):** Force Sense 52 *(Precognitive Reflexes 38% — pilot's instinct)* · Telekinesis 15 *(latent)*
- **Signature Ability:** **Ace hyperspace navigator** — a bold, resourceful pilot and survivor.
- **Notable Feats:** Delivered the warning that saved the Republic's defense; penetrated Empress Teta's palace to be heard; survived the war.
- **Alignment:** Neutral / light-leaning.
- **Tier:** Trained (gifted pilot, latent Force potential).

---

# SECONDARY FIGURES (compact bench)

*(Core adds INT after CHA; Force adds FOut after FCtrl. Combat = numeric Bladework rating; abilities give headline ratings.)*

| Name | Species | Role / Affiliation | STR | AGI | END | WIL | CHA | INT | FSense | Med | FKnow | FCtrl | FOut | Bladework | Top Force Abilities (game stats) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Kressh the Younger | Sith | Ludo Kressh's son; later warlord | 74 | 72 | 76 | 84 | 74 | 78 | 78 | 74 | 80 | 82 | 80 | 76 | Force Lightning 78 *(Chain 62%)* · Battlemind 75 · Telekinesis 74 |
| Ood Bnar | Neti | Jedi Master, friend of Odan-Urr | 70 | 50 | 90 | 92 | 72 | 90 | 84 | 88 | 92 | 84 | 80 | 55 | Force Barrier 84 *(Absorb 80%)* · Telekinesis 82 · Force Heal 80 |
| Ssk Kahorr | Cha'a | Merchant the Daragons owed | 30 | 40 | 45 | 60 | 66 | 66 | — | — | — | — | — | 30 | N/A — non-Force |
| Aarrba the Hutt | Hutt | Repair-dock owner, the Daragons' guardian | 40 | 20 | 70 | 70 | 64 | 60 | — | — | — | — | — | 30 | N/A — non-Force |
| Massassi warriors | Massassi | Sadow's elite shock troops | 80 | 70 | 82 | 70 | 40 | 40 | 50 | 40 | 45 | 55 | 55 | 70 | Force Body 55 *(Strength 60%)* — alchemically enhanced berserkers |
| Lord Dramath | Sith | Ruler of Medriaas; Tenebrae's father | 68 | 66 | 70 | 80 | 74 | 78 | 76 | 72 | 82 | 80 | 80 | 75 | Sith Sorcery 80 · Sith Alchemy 70 · Force Lightning 72 |

---

## QUICK-REFERENCE TIER TABLE

| Character | Affiliation | Primary Tier | Standout Stat(s) | Bladework |
|---|---|---|---|---|
| Marka Ragnos | Sith Empire | **Legendary** | WIL 105 / FKnow 100 / FCtrl 100 / FOut 98 | 85 |
| Naga Sadow | Sith Empire | **Legendary** | FKnow 104 / FCtrl 102 / Med 100 / FOut 100 | 72 |
| Tenebrae / Vitiate (origin) | Sith Empire | **Legendary** | WIL 105 / FCtrl 102 / **INT 98** / FOut 100 | 70 |
| Ludo Kressh | Sith Empire | High Master | WIL 92 / FKnow 90 | 78 |
| Odan-Urr | Jedi Order | High Master | ForceKnowledge 96 / **INT 95** / Med 92 | 55 |
| Master Ooroo | Jedi Order | High Master | ForceControl 92 / Med 90 | *(none)* |
| Simus | Sith Empire | Master | ForceKnowledge 90 / INT 88 (disembodied) | *(none)* |
| Memit Nadill | Jedi Order | Master | Meditation 86 | 70 |
| Empress Teta | Koros / Republic | Elite (non-Force) | CHA 90 / INT 84 | 60 |
| Gav Daragon | scout → Sith pawn | Trained | AGI 66 | 35 |
| Jori Daragon | scout | Trained | WIL 70 / INT 68 | 40 |

---

*Era 03 of the Star Wars Legends character-sheet series. Stats are prime-version, galaxy-wide scale. **Now fully game-ready: numeric Bladework ratings and numeric Force Ability stats (base level + sub-ability proficiency %) for every character.** This era's signatures are Sith sorcery/alchemy and Battle Meditation; formal lightsaber forms did not exist yet, so Bladework is a single Armed-Combat rating.*

> **Cross-era appearance notes:**
> - **Marka Ragnos** reappears as a Force ghost in Era 05, crowning Exar Kun. No new sheet needed.
> - **Odan-Urr** reappears in Era 05, elderly, killed by Exar Kun. Prime stats above remain valid.
> - **Naga Sadow's** tomb on Yavin 4 touches Exar Kun's fall (Era 05). Same being.
> - **Tenebrae / Vitiate** returns at his true legendary apex as the **Sith Emperor / Valkorion** (Era 09+) — that incarnation gets its own dedicated apex sheet, deep in the 130–150 band. Do not use the origin stats for the god-emperor.
