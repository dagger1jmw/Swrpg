# Star Wars Legends — Character Sheets
## Era 01: Dawn of the Jedi (36,453–25,783 BBY)

---

## ABOUT THIS DOCUMENT

Character reference for the Dawn of the Jedi era, drawn from the *Dawn of the Jedi* comic trilogy (*Force Storm*, *The Prisoner of Bogan*, *Force War*) and the novel *Into the Void*. Stats represent each character **at their prime**, on a **galaxy-wide Legends scale** (consistent across every era doc). Scale down for younger/weaker versions as needed in play.

### Stat Scale (galaxy-wide, all of Legends)
| Band | Range | Meaning |
|---|---|---|
| Novice / civilian | 10–40 | Untrained or non-combatant |
| Trained | 40–60 | Competent Knight-equivalent, rank-and-file warrior |
| Veteran / elite | 60–85 | Seasoned Knight, skilled commander |
| Master | 85–100 | Master-tier; the ceiling for nearly all Force users |
| **Legendary** | **100–150** | Mastery far beyond what any normal Jedi or Sith achieves. **Per-stat, not blanket.** |

### Stat tiers (matches game engine)
Initiate 0–20 · Padawan 21–40 · Knight 41–60 · Master 61–80 · Grandmaster 81–100 · Legendary 101–150 · Transcendent 151+

### Stats in use (v3 — six core, five Force)
**Core:** Strength · Agility · Endurance · Willpower · Charisma · **Intelligence**. **Force:** ForceSense · Meditation · ForceKnowledge · ForceControl · **ForceOutput**.
- **Intelligence** = reasoning, tactical/strategic acumen, learning speed, cunning.
- **ForceOutput** = raw power/magnitude (distinct from ForceControl, which is finesse).

### NEW IN THIS PASS — game-ready numeric stats
Every combatant now carries **numeric stats**, not just prose:
- **Bladework rating (game stats):** since formal lightsaber forms did not exist this era, each armed fighter gets a single **Armed-Combat / Bladework rating** (0–150) representing overall skill with Forcesabers, metal blades, or melee weapons. In the engine, enter this in the foundational combat slot (`lightsaberForms.ShiiCho` is the closest key, representing "base armed combat") or as a custom `Bladework` entry. Non-combatants show *(none)*.
- **Force Abilities (game stats):** each registry ability at base level 0–150 (→ `forceAbilities.*`), with notable sub-ability proficiency percentages 0–100 in parentheses (→ `forceAbilityProficiency`). Proficiency bands: Novice 0–25 · Developing 26–50 · Proficient 51–70 · Expert 71–90 · Mastered 91–100.
- Abilities sharing a name with a Force stat (Force Sense) use that stat value as their base level.
- **Unique techniques** with no registry entry (spirit transcendence, Force-smithing, beast-bonding) are flagged separately.

### Era Notes on Scaling
The Dawn of the Jedi era is the **dawn of Force tradition** — raw and experimental, with techniques less refined than later eras. This shows in the **Output/Control split**: many Je'daii channel large raw Output without refined Control. A handful reach legendary tier (Rajivari, Xesh, Skal'nas); most sit in the veteran-to-Master bands.

### Era Notes on Combat
**Formal lightsaber forms did not exist.** The Je'daii fought with Force-imbued metal blades (Madog steel) and reverse-engineered Rakatan **Forcesabers**. Bladework entries describe combat method **plus a numeric Armed-Combat rating** (see above).

### Schema
Each sheet: **Core Stats** (6) · **Force Stats** (5) · **Lightsaber Forms/Bladework** (method + numeric rating) · **Force Abilities (game stats)** (numeric) · **Unique techniques** (where any) · **Signature Ability** · **Notable Feats** · **Alignment**.

---

# JE'DAII ORDER

---

## Rajivari
- **Sheet snapshot:** Prime — founding Je'daii Master / war general
- **Species / Affiliation / Rank:** Human · Je'daii Order, later founding member of the Jedi Order · Master / General
- **Lifespan:** Active ~25,805 BBY (Despot War); died in the Force Wars (ended 25,783 BBY); persisted as a Force ghost for millennia thereafter
- **Summary:** One of the wisest and most powerful founding Masters. Led armies in the Despot War and the Rakatan invasion, mentored Ketu, and helped found the Jedi Order — then broke away, convinced the Force should be used to rule. Defeated and killed at Kaleth, he endured as a Force ghost guarding the Fount of Rajivari for thousands of years.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 70 | | ForceSense | 95 |
| Agility | 78 | | Meditation | 100 |
| Endurance | 72 | | ForceKnowledge | 102 |
| Willpower | 108 | | ForceControl | 100 |
| Charisma | 95 | | ForceOutput | 100 |
| Intelligence | 95 | | | |

- **Lightsaber Forms / Bladework:** Wielded the **First Blade**, a precursor proto-saber. Fights as a complete swordsman-sage — economical, patient, overwhelming when committed — fusing blade-work with telekinetic battlefield control.
  **Bladework rating (game stats):** 80
- **Force Abilities (game stats):** Telekinesis 90 *(Force Push 85%, Force Throw 65%, Force Wave 62%)* · Force Sense 95 *(Precognitive Reflexes 82%, Farsight 62%)* · Battle Meditation 90 *(Force Valor 65%)* · Mind Trick 82 *(Force Persuasion 80%)* · Force Barrier 85
- **Unique techniques:** **Spirit transcendence** *(retained full conscious power as a Force ghost for millennia)*
- **Signature Ability:** **Spirit transcendence** — among the earliest beings to retain full consciousness and power after death.
- **Notable Feats:** Called "immeasurably powerful"; drew an army to his philosophy; claimed the First Blade; co-founded the Jedi Order; endured as a guardian ghost for millennia.
- **Alignment:** Began in Balance; fell to a conquest-driven dark philosophy late in life.
- **Tier:** **Legendary** (Force / wisdom / leadership); Master-tier duelist.

---

## Ketu
- **Sheet snapshot:** Prime — Temple Master of Akar Kesh, leader of the Je'daii Council
- **Species / Affiliation / Rank:** Human · Je'daii Order · Temple Master (Balance), Council leader
- **Lifespan:** Took Council leadership ~25,805 BBY; active through the Force War
- **Summary:** The Order's wisest leader and the voice of Balance. Carried no weapon, leading through insight. He ordered the great group meditation that quelled the planet-wide Force storm, exiled Xesh to Bogan, and mobilized the Order for war.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 58 | | ForceSense | 88 |
| Agility | 60 | | Meditation | 94 |
| Endurance | 62 | | ForceKnowledge | 90 |
| Willpower | 92 | | ForceControl | 82 |
| Charisma | 88 | | ForceOutput | 76 |
| Intelligence | 90 | | | |

- **Lightsaber Forms / Bladework:** Carried no weapon by principle.
  **Bladework rating (game stats):** *(none)*
- **Force Abilities (game stats):** Battle Meditation 95 *(Force Valor 82% — the "Communion of Masters")* · Force Sense 88 *(Farsight 62%)* · Telekinesis 50 *(defensive only)* · Force Barrier 80
- **Unique techniques:** **Communion of Masters** *(coordinating the combined meditative will of the Council)*
- **Signature Ability:** **Communion of Masters** — focusing the Council's combined will into a single effect (precursor to formalized Battle Meditation).
- **Notable Feats:** Directed the Council meditation that dispelled a planet-wide Force storm; guided the Order through war.
- **Alignment:** Balance.
- **Tier:** High Master (Force / leadership).

---

## Quan-Jang
- **Sheet snapshot:** Prime — Temple Master of Anil Kesh (Science / Alchemy)
- **Species / Affiliation / Rank:** Human · Je'daii Order · Temple Master (Science), Council member
- **Lifespan:** Active through the Despot War and Rakatan invasion
- **Summary:** Master alchemist and teacher of Daegen Lok and Shae Koda. Served as the focal conduit for the Council's combined meditation against the Force storm — apparently dying in the act before being healed at Mahara Kesh — and counseled Shae Koda on Balance throughout the war.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 56 | | ForceSense | 80 |
| Agility | 60 | | Meditation | 86 |
| Endurance | 62 | | ForceKnowledge | 90 |
| Willpower | 86 | | ForceControl | 88 |
| Charisma | 70 | | ForceOutput | 80 |
| Intelligence | 88 | | | |

- **Lightsaber Forms / Bladework:** Scholar-alchemist, non-combatant.
  **Bladework rating (game stats):** *(none)*
- **Force Abilities (game stats):** Sith Alchemy 85 *(Midi-chlorian Manipulation 62% — flesh-shaping, matter manipulation)* · Force Heal 78 · Battle Meditation 70 *(focal conduit for combined-Master meditation)* · Telekinesis 50 · Force Barrier 78
- **Signature Ability:** **Force alchemy** — flesh-shaping and matter manipulation; able to channel the combined power of many Masters.
- **Notable Feats:** Focal point of the meditation that ended the great Force storm; subdued the rancor-dragon Butch; master of Anil Kesh's alchemical sciences.
- **Alignment:** Balance.
- **Tier:** High Master (Force / alchemy).

---

## Tem Madog
- **Sheet snapshot:** Prime — Temple Master of Vur Tepe (the Forge)
- **Species / Affiliation / Rank:** Cathar · Je'daii Order · Temple Master (Forge), war general
- **Lifespan:** Active through the Rakatan invasion
- **Summary:** Master metallurgist who created the nearly unbreakable Madog steel. He oversaw the mass-production of Forcesabers (with Xesh's guidance) to arm the Order, fighting as a front-line general on Shikaakwa.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 78 | | ForceSense | 72 |
| Agility | 70 | | Meditation | 70 |
| Endurance | 80 | | ForceKnowledge | 82 |
| Willpower | 82 | | ForceControl | 80 |
| Charisma | 68 | | ForceOutput | 82 |
| Intelligence | 80 | | | |

- **Lightsaber Forms / Bladework:** A powerful, grounded warrior-smith. Fights with his own forged Forcesaber in a direct, heavy, durable style — relying on strength and superior weapons of his own making. A general who anchors a line.
  **Bladework rating (game stats):** 78
- **Force Abilities (game stats):** Sith Alchemy 80 *(Force-smithing — Midi-chlorian Manipulation 55%)* · Telekinesis 55 *(Force Push 52%)* · Force Body 58 *(Force Strength 60%, Force Endurance 58%)* · Force Barrier 55
- **Unique techniques:** **Force-smithing** *(forging Force-imbued Madog steel)*
- **Signature Ability:** **Force-smithing** — forging the toughest metal of the era; mass-produced the Order's Forcesabers.
- **Notable Feats:** Created Madog steel; mass-produced Forcesabers; served as a battlefield general.
- **Alignment:** Balance.
- **Tier:** High Master (artisan / warrior-leader).

---

## Ters Sendon
- **Sheet snapshot:** Prime — Je'daii Master and chronicler
- **Species / Affiliation / Rank:** Zabrak · Je'daii Order, later founding member of the Jedi Order · Master / lore-keeper
- **Lifespan:** Active through the Force War and the founding of the Jedi Order
- **Summary:** Keeper of histories at Kaleth who discovered the Kwa Holocron. He mentored Tasha Ryo, guided her to unlock the holocron, and was with her when she sacrificed herself to weaponize the Tho Yor. A founding chronicler of the Jedi Order.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 56 | | ForceSense | 78 |
| Agility | 60 | | Meditation | 82 |
| Endurance | 58 | | ForceKnowledge | 88 |
| Willpower | 80 | | ForceControl | 70 |
| Charisma | 72 | | ForceOutput | 62 |
| Intelligence | 86 | | | |

- **Lightsaber Forms / Bladework:** Scholar; minimal combat.
  **Bladework rating (game stats):** 35
- **Force Abilities (game stats):** Force Sense 78 *(Postcognition 62% — reading the history of places/objects)* · Meditation discipline 72 · Telekinesis 35
- **Unique techniques:** **Holocron lore** *(discovering and interpreting ancient Force artifacts)*
- **Signature Ability:** **Holocron lore** — discovering and interpreting ancient Force artifacts (the Kwa Holocron).
- **Notable Feats:** Found and interpreted the Kwa Holocron; guided Tasha Ryo to the Tho Yor; founding chronicler of the Jedi Order.
- **Alignment:** Balance / light.
- **Tier:** Master (scholar / Force sage).

---

## Daegen Lok
- **Sheet snapshot:** Prime — Je'daii Master / "Sword of Tython" / war general
- **Species / Affiliation / Rank:** Human · Je'daii Order (later exile, then Je'daii General) · Master
- **Lifespan:** Despot War hero (25,805 BBY); promoted to Master ~25,800 BBY; exiled ~7 years; central figure of the invasion
- **Summary:** A Despot War hero who assassinated Queen Hadiya to end the war. After sharing a vision of an army wielding "blades of fire," the Council deemed him mad and exiled him to Bogan, where he grew dark and manipulative. He recruited Xesh, built Forcesabers, was betrayed and re-imprisoned — then recalled to lead the Je'daii as general when his vision came true.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 72 | | ForceSense | 85 |
| Agility | 75 | | Meditation | 76 |
| Endurance | 74 | | ForceKnowledge | 88 |
| Willpower | 98 | | ForceControl | 92 |
| Charisma | 82 | | ForceOutput | 88 |
| Intelligence | 90 | | | |

- **Lightsaber Forms / Bladework:** The "Sword of Tython" — an aggressive, intimidating duelist who fights with a Forcesaber and channels controlled dark emotion into his strikes. Combines blade pressure with mind attacks, unbalancing an opponent psychologically before finishing physically.
  **Bladework rating (game stats):** 85
- **Force Abilities (game stats):** Mind Trick 88 *(**Mind Twist** 95% — signature, Force Persuasion 82%)* · Force Sense 85 *(Force Vision 62% — the prophetic Chasm vision)* · Telekinesis 80 *(Force Push 82%)* · Force Body 60 *(Force Speed 58%)* · Force Barrier 55
- **Signature Ability:** **Mind Twist** — an advanced mind trick that draws out a victim's deepest fear and makes it physically real (mapped in-engine as a Mastered dark-side Mind Trick specialization).
- **Notable Feats:** Assassinated Queen Hadiya; shared the prophetic Chasm vision; built the Je'daii's first Forcesabers; led the Order as a war general.
- **Alignment:** Dark-leaning (walked the edge of Bogan).
- **Tier:** **Legendary** (dark-side Force / mind techniques among Je'daii); Master-tier duelist.

---

## Xesh ("Tau")
- **Sheet snapshot:** Prime — Force Hound of the Infinite Empire → Je'daii
- **Species / Affiliation / Rank:** Human · Rakatan Infinite Empire (Force Hound) → Je'daii Order · elite warrior
- **Lifespan:** Captured as a child; central figure of the invasion (25,793–25,792 BBY); survives the war
- **Summary:** Enslaved and branded as a child, his empathy stripped by Rakatan pain-machines, Xesh became the finest Force Hound in the entire Infinite Empire. He located Tython, triggered a planet-wide Force storm, and after exile and manipulation by Daegen Lok, rejected the dark, joined the Je'daii, reclaimed his self-given name "Tau," and killed Predor Skal'nas to end the war.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 95 | | ForceSense | 90 |
| Agility | 105 | | Meditation | 64 |
| Endurance | 96 | | ForceKnowledge | 78 |
| Willpower | 100 | | ForceControl | 104 |
| Charisma | 55 | | ForceOutput | 102 |
| Intelligence | 64 | | | |

- **Lightsaber Forms / Bladework:** A **relentless, overwhelming-offense** fighter built on Rakatan war-training — explosive aggression, no hesitation, an instinct to break an opponent's weapon and guard before killing. Wields the **Forcesaber**, channeling rage and pain into the blade, integrating Force lightning mid-swing and telekinetic shoves to control distance. Treats the duel as a hunt.
  **Bladework rating (game stats):** 104
- **Force Abilities (game stats):** Force Lightning 88 *(Force Shock 82%, Chain Lightning 62%)* · Force Barrier 90 *(Force Absorb 82% → Tutaminis 60% — drew power from a Force storm)* · Telekinesis 95 *(Force Push 82%, Force Throw 65%)* · Force Sense 90 *(Precognitive Reflexes 85%)* · Force Body 80 *(Force Speed 82%, Force Strength 80%)*
- **Unique techniques:** **Lightning absorption** *(the only being able to both hurl and absorb/redirect Force lightning, drawing power from a Force storm itself)*
- **Signature Ability:** **Forcesaber mastery & lightning absorption** — the only being able to ignite his Forcesaber by will alone; can hurl and absorb/redirect Force lightning.
- **Notable Feats:** Reckoned the best Force Hound in the entire Infinite Empire; broke the Madog-steel blades of three Je'daii in seconds; killed Predor Tul'kar and ultimately Predor Skal'nas.
- **Alignment:** Born to the dark; moves toward Balance/light by the end.
- **Tier:** **Legendary** (dueling / combat); legendary ForceControl & Output.

---

## Shae Koda
- **Sheet snapshot:** Prime — Je'daii Journeyer → Ranger
- **Species / Affiliation / Rank:** Human (Dathomiri descent) · Je'daii Order · Journeyer/Ranger
- **Lifespan:** Orphaned in the Despot War (25,805 BBY); central protagonist of the invasion; survives
- **Summary:** One of three Journeyers who shared the vision of Xesh, she became his champion and eventual lover, repeatedly pulling him back from the dark and from Rakatan control.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 60 | | ForceSense | 72 |
| Agility | 68 | | Meditation | 65 |
| Endurance | 64 | | ForceKnowledge | 68 |
| Willpower | 80 | | ForceControl | 72 |
| Charisma | 70 | | ForceOutput | 68 |
| Intelligence | 66 | | | |

- **Lightsaber Forms / Bladework:** A capable Ranger who fights mounted on her rancor-dragon Butch as often as on foot, mixing blade work with beast-coordinated attacks.
  **Bladework rating (game stats):** 66
- **Force Abilities (game stats):** Sith Alchemy 55 *(beast-bonding 82%)* · Telekinesis 55 *(Force Push 60%)* · Force Sense 60 · Force Body 35 *(Force Strength 38%)*
- **Unique techniques:** **Beast-bonding alchemy** *(created and bonded her rancor-dragon mount, Butch)*
- **Signature Ability:** **Beast-bonding alchemy** — created and bonded her rancor-dragon mount through flesh alchemy.
- **Notable Feats:** Ignited Xesh's Forcesaber through sheer rage; repeatedly recovered Xesh from the dark side and Rakatan control.
- **Alignment:** Balance (tempted toward the dark by attachment).
- **Tier:** Veteran (gifted Journeyer).

---

## Sek'nos Rath
- **Sheet snapshot:** Prime — Je'daii Journeyer
- **Species / Affiliation / Rank:** Sith species (red-skinned; *not* the Sith Order) · Je'daii Order · Journeyer/Ranger
- **Lifespan:** Active during the invasion; grandson of Master Thok Rath and Temple Master Miarta Sek
- **Summary:** Cocky and fame-seeking, raised on tales of great Je'daii warriors. A vision-sharer disgusted by the Order's adoption of dark-side Forcesabers — yet ultimately gave fully into the dark side himself to defeat the Force Hound Trill.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 66 | | ForceSense | 70 |
| Agility | 70 | | Meditation | 58 |
| Endurance | 66 | | ForceKnowledge | 64 |
| Willpower | 68 | | ForceControl | 76 |
| Charisma | 66 | | ForceOutput | 78 |
| Intelligence | 60 | | | |

- **Lightsaber Forms / Bladework:** An eager, flashy young duelist who fights to impress — aggressive and athletic, but undisciplined. Wins through raw talent and ferocity.
  **Bladework rating (game stats):** 70
- **Force Abilities (game stats):** Force Lightning 55 *(**Force Shock** 82% — developed lightning "balls")* · Telekinesis 55 *(Force Push 60%)* · Force Body 35 *(Force Speed 40%)* · Force Sense 38
- **Signature Ability:** **Force lightning** — developed the ability to form and hurl "balls" of lightning (a raw-Output specialization).
- **Notable Feats:** Vision-sharer; killed the Force Hound Trill; surrendered fully to the dark side to win that duel.
- **Alignment:** Balance, with a documented fall to the dark in combat.
- **Tier:** Veteran (gifted Journeyer).

---

## Tasha Ryo
- **Sheet snapshot:** Prime — Je'daii Journeyer and Seer
- **Species / Affiliation / Rank:** Twi'lek · Je'daii Order · Journeyer/Seer · daughter of Baron Volnos Ryo and Temple Master Kora Ryo
- **Lifespan:** Active during the invasion; sacrificed her mortal body to weaponize the Tho Yor
- **Summary:** Torn between her Je'daii duty and her crime-lord father. A vision-sharer whose precognition repeatedly saved the Order. She unlocked the Kwa Holocron and gave up her mortal body to weaponize the Tho Yor against the Rakatan fleet.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 52 | | ForceSense | 92 |
| Agility | 62 | | Meditation | 80 |
| Endurance | 56 | | ForceKnowledge | 78 |
| Willpower | 82 | | ForceControl | 84 |
| Charisma | 70 | | ForceOutput | 74 |
| Intelligence | 76 | | | |

- **Lightsaber Forms / Bladework:** Carried no weapon; fought with the Force alone.
  **Bladework rating (game stats):** *(none)*
- **Force Abilities (game stats):** Force Sense 92 *(**Force Vision / Precognition** 95% — signature Seer gift, Farsight 82%)* · Telekinesis 84 *(Force Throw 82%, Force Push 82% — palm-sized fields to deflect slugthrower rounds)* · Force Barrier 55
- **Unique techniques:** **Holocron-unlocking** *(unlocked the Kwa Holocron)*
- **Signature Ability:** **Force Sight / Precognition (Seer)** — clairvoyant visions paired with exceptional fine-control telekinesis.
- **Notable Feats:** Disarmed and threw Xesh with telekinesis; deflected slugthrower rounds with palm-sized telekinetic fields; unlocked the Kwa Holocron; sacrificed herself to fire the Tho Yor.
- **Alignment:** Balance / light.
- **Tier:** Veteran with **rare Seer specialization** (ForceSense reaches Grandmaster).

---

## Hawk Ryo
- **Sheet snapshot:** Prime — Je'daii Ranger and ace pilot
- **Species / Affiliation / Rank:** Twi'lek · Je'daii Order · Ranger · brother of Baron Volnos Ryo, uncle of Tasha Ryo
- **Lifespan:** Active through the Despot War and invasion
- **Summary:** Shared Daegen Lok's Chasm vision but recanted and stayed silent as Lok was exiled — a guilt that defines him. He became the first to ignite Xesh's captured Forcesaber by drawing on Bogan, and led the Je'daii's starfighter squadrons.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 62 | | ForceSense | 68 |
| Agility | 72 | | Meditation | 60 |
| Endurance | 64 | | ForceKnowledge | 62 |
| Willpower | 72 | | ForceControl | 66 |
| Charisma | 66 | | ForceOutput | 64 |
| Intelligence | 68 | | | |

- **Lightsaber Forms / Bladework:** A scrappy, practical fighter, more at home in a cockpit than a duel. Competent with a Forcesaber but relies on instinct and aggression.
  **Bladework rating (game stats):** 64
- **Force Abilities (game stats):** Force Sense 68 *(**Precognitive Reflexes** 82% — Force-assisted piloting)* · Force Body 55 *(Force Speed 62%)* · Telekinesis 35 · Force Barrier 35
- **Signature Ability:** **Force-assisted piloting** — an ace Hunter-class starfighter pilot and squadron leader.
- **Notable Feats:** First to ignite Xesh's Forcesaber by channeling controlled anger; led Red and Blue squadrons in the defense of the Tython system.
- **Alignment:** Balance.
- **Tier:** Veteran (warrior / pilot-leader).

---

## Rori Fenn
- **Sheet snapshot:** Prime — Je'daii Ranger and pilot
- **Species / Affiliation / Rank:** Human · Je'daii Order · Ranger · sister of Temple Master Jake Fenn
- **Lifespan:** Active through the invasion
- **Summary:** A former romantic partner of Hawk Ryo who struggled with Balance by falling to the **light** side, and so was exiled to the moon Ashla to meditate on the dark. She joined the hunt for Xesh and Lok and fought as a pilot in the invasion.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 58 | | ForceSense | 66 |
| Agility | 70 | | Meditation | 68 |
| Endurance | 60 | | ForceKnowledge | 60 |
| Willpower | 70 | | ForceControl | 64 |
| Charisma | 64 | | ForceOutput | 60 |
| Intelligence | 64 | | | |

- **Lightsaber Forms / Bladework:** A nimble, light-footed fighter and pilot; favors evasion and precision over power.
  **Bladework rating (game stats):** 60
- **Force Abilities (game stats):** Force Sense 66 *(Precognitive Reflexes 62%)* · Meditation discipline 68 *(strongly light-attuned)* · Telekinesis 35 · Force Body 35 *(Force Speed 38%)*
- **Unique techniques:** **Luminous affinity** *(drawn so strongly to the light she required exile to Ashla to rebalance)*
- **Signature Ability:** **Luminous affinity** — a mirror of the usual dark-side exile to Bogan.
- **Notable Feats:** Capable Ranger and starfighter pilot in the defense of the system.
- **Alignment:** Balance (over-inclined to the light).
- **Tier:** Trained–Veteran (warrior / pilot). *Sparsely documented.*

---

# RAKATAN INFINITE EMPIRE

---

## Predor Skal'nas
- **Sheet snapshot:** Prime — supreme Rakatan commander
- **Species / Affiliation / Rank:** Rakata · Infinite Empire · Predor (overlord), aspiring Over-Predor
- **Lifespan:** Active during the invasion of the Tython system; killed by Xesh at the Prime Gate
- **Summary:** Ruthless even by Rakatan standards. He installed memory blocks in Xesh to use him as a spy and sought the Kwa Infinity Gate on Tython to reverse the Rakata's fading Force connection. He killed his own sub-commander Ceh'let with Force lightning and was finally cut down by Xesh, his death shattering the Rakatan war effort.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 80 | | ForceSense | 90 |
| Agility | 78 | | Meditation | 68 |
| Endurance | 85 | | ForceKnowledge | 95 |
| Willpower | 100 | | ForceControl | 102 |
| Charisma | 75 | | ForceOutput | 100 |
| Intelligence | 95 | | | |

- **Lightsaber Forms / Bladework:** A towering, brutal combatant who relies overwhelmingly on Force power rather than blade-work — telekinesis and lightning to dominate, raw strength as a finisher. Fights like a force of nature.
  **Bladework rating (game stats):** 80
- **Force Abilities (game stats):** Force Lightning 102 *(Chain Lightning 95%, Force Storm 82% — killed Ceh'let outright)* · Telekinesis 95 *(Force Push 82%, Force Throw 95% — hurled both Force Hounds apart)* · Mind Probe 88 *(**Dark conditioning / memory blocks** 95% — signature)* · Sith Alchemy 80 *(Rakatan Force-tech integration)* · Force Sense 90 *(Farsight 82%)*
- **Signature Ability:** **Dark conditioning** — Rakatan mind-control technology used to install hidden memory blocks and commands in captured Force Hounds.
- **Notable Feats:** Hurled both Force Hounds apart with telekinesis; killed Sub-Predor Ceh'let with Force lightning; nearly conquered Tython and seized the Infinity Gate.
- **Alignment:** Dark side.
- **Tier:** **Legendary** (dark-side power / warlord).

---

## Predor Tul'kar
- **Sheet snapshot:** Prime — Rakatan Predor, Xesh's master
- **Species / Affiliation / Rank:** Rakata · Infinite Empire · Predor
- **Lifespan:** Active early in the invasion; killed by Xesh (under Skal'nas's control) aboard the *Devourer*
- **Summary:** Discovered Xesh's potential and trained him as a Force Hound, valuing him so highly he would defy even Skal'nas to keep him. Cruel and arrogant, he was murdered by his own prized Force Hound.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 75 | | ForceSense | 78 |
| Agility | 70 | | Meditation | 60 |
| Endurance | 78 | | ForceKnowledge | 80 |
| Willpower | 82 | | ForceControl | 85 |
| Charisma | 68 | | ForceOutput | 82 |
| Intelligence | 78 | | | |

- **Lightsaber Forms / Bladework:** A powerful Rakatan warrior-commander who leads through dominance and lightning rather than swordplay.
  **Bladework rating (game stats):** 76
- **Force Abilities (game stats):** Force Lightning 82 *(Force Shock 82%, Chain Lightning 62%)* · Telekinesis 80 *(Force Push 82%)* · Mind Probe 65 *(Force Hound conditioning 60%)* · Force Sense 78 *(Farsight 62%)*
- **Signature Ability:** **Force Hound mastery** — training and commanding Force-sensitive slaves to hunt Force-rich worlds.
- **Notable Feats:** Discovered and trained Xesh, the Empire's finest Force Hound.
- **Alignment:** Dark side.
- **Tier:** High Master (dark-side commander).

---

## Trill
- **Sheet snapshot:** Prime — rival Force Hound
- **Species / Affiliation / Rank:** Force-sensitive humanoid · Infinite Empire (Force Hound of Skal'nas) · warrior/spy
- **Lifespan:** Active during the invasion; killed by Sek'nos Rath
- **Summary:** Xesh's childhood broodmate who swore a blood oath with him — then took his mercy as the ultimate betrayal. She tracked Xesh across the galaxy, infiltrated the Je'daii by manipulating Sek'nos Rath, and spied for Skal'nas before being killed.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 68 | | ForceSense | 82 |
| Agility | 78 | | Meditation | 55 |
| Endurance | 70 | | ForceKnowledge | 65 |
| Willpower | 75 | | ForceControl | 80 |
| Charisma | 60 | | ForceOutput | 76 |
| Intelligence | 66 | | | |

- **Lightsaber Forms / Bladework:** A fast, predatory Force Hound — agile and aggressive, trained to hunt and kill. Wields a Forcesaber with relentless Rakatan-bred offense, a step below Xesh.
  **Bladework rating (game stats):** 78
- **Force Abilities (game stats):** Force Sense 82 *(**Farsight / planet-tracking projection** 82% — signature)* · Force Lightning 55 *(Force Shock 62%)* · Telekinesis 55 *(Force Push 60%)* · Force Body 60 *(Force Speed 82%)*
- **Signature Ability:** **Planet-tracking projection** — the Force Hound power of casting one's mind across space to locate Force-rich worlds.
- **Notable Feats:** Tracked Xesh across the galaxy; infiltrated the Je'daii through deception.
- **Alignment:** Dark side.
- **Tier:** Veteran–high (Force Hound).

---

## Ceh'let
- **Sheet snapshot:** Prime — Rakatan Sub-Predor
- **Species / Affiliation / Rank:** Rakata (female) · Infinite Empire · Sub-Predor
- **Lifespan:** Active during the invasion; killed by Skal'nas
- **Summary:** Commanded the failed Rakatan assault on Shikaakwa and challenged Skal'nas over the heavy losses — only to be killed by his Force lightning once he revealed his true goal.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 70 | | ForceSense | 70 |
| Agility | 68 | | Meditation | 55 |
| Endurance | 72 | | ForceKnowledge | 68 |
| Willpower | 75 | | ForceControl | 75 |
| Charisma | 62 | | ForceOutput | 70 |
| Intelligence | 70 | | | |

- **Lightsaber Forms / Bladework:** A Rakatan field commander — competent in personal combat but built for leading assaults.
  **Bladework rating (game stats):** 68
- **Force Abilities (game stats):** Telekinesis 65 *(Force Push 60%)* · Force Lightning 35 *(Force Shock 40%)* · Force Sense 70
- **Signature Ability:** **Fleet command** — Rakatan naval/ground assault leadership.
- **Notable Feats:** Commanded the assault on Shikaakwa.
- **Alignment:** Dark side.
- **Tier:** Veteran (commander). *Minor character.*

---

# DESPOT WAR & NON-FORCE FIGURES

---

## Queen Hadiya
- **Sheet snapshot:** Prime — the Despot Queen
- **Species / Affiliation / Rank:** Twi'lek · Despot Army / the Nine Houses of Shikaakwa · Kral (overlord)
- **Lifespan:** United Shikaakwa and conquered the Settled Worlds; launched the Despot War on Tython (25,805 BBY); killed that same campaign
- **Summary:** A charismatic, ruthless leader who rallied her system by demonizing the Je'daii and the Force itself. She personally slew many Je'daii at the Battle of Kaleth before being assassinated by her own general and lover, Daegen Lok.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 68 | | ForceSense | — |
| Agility | 72 | | Meditation | — |
| Endurance | 70 | | ForceKnowledge | — |
| Willpower | 84 | | ForceControl | — |
| Charisma | 92 | | ForceOutput | — (not Force-sensitive) |
| Intelligence | 82 | | | |

- **Lightsaber Forms / Bladework:** A genuinely dangerous melee fighter who led from the front, cutting down Force-users at Kaleth through skill, ferocity, and numbers. Fights with vibro-melee weapons and battlefield cunning.
  **Bladework rating (game stats):** 78
- **Force Abilities (game stats):** N/A — not Force-sensitive.
- **Signature Ability:** **Charismatic warlord** — uniting fractious crime barons and an entire system through force of personality and battlefield command.
- **Notable Feats:** United the Nine Houses; conquered the Settled Worlds; personally killed multiple Je'daii at Kaleth.
- **Alignment:** N/A (mortal warlord, anti-Force ideology).
- **Tier:** Elite (non-Force warrior-leader); legendary-tier **leadership/charisma** for a mortal.

---

## Baron Volnos "Ox" Ryo
- **Sheet snapshot:** Prime — crime lord of Shikaakwa
- **Species / Affiliation / Rank:** Twi'lek · Clan Ryo (the Ryo Syndicate) · Baron
- **Lifespan:** Active through the Despot War and the invasion; ultimate fate undocumented
- **Summary:** A vengeful crime baron — a former heavyweight champion nicknamed "Ox" — forced to take the title after Hadiya murdered his family. He publicly pledged loyalty to Hadiya while secretly helping Daegen Lok assassinate her. Estranged husband of Kora Ryo and father of Tasha Ryo.

| Core | Value | | Force | Value |
|---|---|---|---|---|
| Strength | 60 | | ForceSense | — |
| Agility | 52 | | Meditation | — |
| Endurance | 62 | | ForceKnowledge | — |
| Willpower | 72 | | ForceControl | — |
| Charisma | 80 | | ForceOutput | — (not Force-sensitive) |
| Intelligence | 74 | | | |

- **Lightsaber Forms / Bladework:** A former heavyweight champion, dangerous in a brawl, but relies on droids and soldiers.
  **Bladework rating (game stats):** 58
- **Force Abilities (game stats):** N/A — not Force-sensitive.
- **Signature Ability:** **Criminal empire** — commands the Ryo Syndicate's resources, soldiers, and fortress.
- **Notable Feats:** Secretly enabled the assassination of Queen Hadiya; held Ryo Fortress as the command center for the defense of Shikaakwa.
- **Alignment:** N/A (self-interested crime lord).
- **Tier:** Veteran (non-Force leader / crime lord).

---

# SECONDARY FIGURES (compact bench)

*(Core adds INT after CHA; Force adds FOut after FCtrl. Combat = numeric Bladework rating; abilities give headline ratings.)*

| Name | Species | Role / Affiliation | STR | AGI | END | WIL | CHA | INT | FSense | Med | FKnow | FCtrl | FOut | Bladework | Top Force Abilities (game stats) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Jake Fenn | Human | Temple Master of Bodhi (Arts); general | 64 | 66 | 66 | 80 | 74 | 78 | 76 | 80 | 78 | 74 | 74 | 66 | Battle Meditation 78 *(Valor 70%)* · Telekinesis 70 |
| Kora Ryo | Twi'lek | Temple Master of Kaleth (Knowledge) | 54 | 60 | 58 | 82 | 72 | 86 | 80 | 84 | 86 | 74 | 70 | 40 | Force Sense 80 *(Farsight 65%)* · Battle Meditation 72 |
| Miarta Sek | Sith species | Temple Master of Qigong Kesh (Force Skills) | 58 | 64 | 60 | 80 | 70 | 82 | 82 | 80 | 84 | 84 | 80 | 60 | Telekinesis 82 *(Push 75%)* · Force Sense 82 |
| Thok Rath | Sith species | Je'daii Master; warrior | 70 | 70 | 70 | 78 | 66 | 70 | 72 | 72 | 76 | 74 | 74 | 72 | Force Body 72 *(Strength 70%)* · Telekinesis 70 |
| Lha-Mi | (unspecified) | Temple Master of Stav Kesh (Martial Arts) | 80 | 82 | 78 | 82 | 66 | 72 | 74 | 70 | 78 | 76 | 78 | 82 | Force Body 78 *(Speed 75%, Strength 72%)* · Telekinesis 70 |
| Naro & Calleh | Selkath | Mated Temple Masters of Mahara Kesh (Healing) | 50 | 56 | 56 | 80 | 74 | 80 | 78 | 84 | 82 | 80 | 66 | *(none)* | Force Heal 84 *(self/other)* · Meditation 82 |
| Master Ruhr | (unspecified) | Temple Master of Padawan Kesh (academy) | 56 | 60 | 60 | 78 | 76 | 82 | 76 | 80 | 80 | 72 | 72 | 55 | Battle Meditation 72 · Telekinesis 68 |
| Dam-Powl | Cathar | Acting alchemy Master, Anil Kesh | 64 | 66 | 66 | 80 | 70 | 84 | 78 | 80 | 84 | 82 | 76 | 55 | Sith Alchemy 80 *(Midi 60%)* · Force Heal 75 |
| Predor Ore'mun | Rakata | Skal'nas's spy | 70 | 66 | 72 | 70 | 60 | 70 | 72 | 55 | 66 | 72 | 62 | 68 | Telekinesis 65 · Force Sense 72 *(Farsight 60%)* |

---

## QUICK-REFERENCE TIER TABLE

| Character | Affiliation | Primary Tier | Standout Stat(s) | Bladework |
|---|---|---|---|---|
| Rajivari | Je'daii → Jedi | **Legendary** | FKnow 102 / Med 100 / FCtrl 100 / FOut 100 | 80 |
| Xesh | Force Hound → Je'daii | **Legendary** | AGI 105 / FCtrl 104 / FOut 102 | **104** |
| Predor Skal'nas | Infinite Empire | **Legendary** | FCtrl 102 / FOut 100 / WIL 100 / INT 95 | 80 |
| Daegen Lok | Je'daii | **Legendary** | Mind Twist; WIL 98 / INT 90 | 85 |
| Ketu | Je'daii | High Master | Meditation 94 / INT 90 | *(none)* |
| Quan-Jang | Je'daii | High Master | ForceKnowledge 90 / INT 88 | *(none)* |
| Tem Madog | Je'daii | High Master | STR 78 / FOut 82 / Force-smithing | 78 |
| Ters Sendon | Je'daii → Jedi | Master | ForceKnowledge 88 / INT 86 | 35 |
| Predor Tul'kar | Infinite Empire | High Master | ForceControl 85 | 76 |
| Tasha Ryo | Je'daii | Veteran (+Seer) | ForceSense 92 (Precognition Mastered) | *(none)* |
| Queen Hadiya | Despot Army | Elite (non-Force) | CHA 92 / INT 82 | 78 |
| Trill | Infinite Empire | Veteran–high | ForceSense 82 (Farsight) | 78 |
| Sek'nos Rath | Je'daii | Veteran | FOut 78 (lightning) | 70 |
| Shae Koda | Je'daii | Veteran | WIL 80 / alchemy | 66 |
| Baron Volnos Ryo | Clan Ryo | Veteran (non-Force) | CHA 80 / INT 74 | 58 |
| Hawk Ryo | Je'daii | Veteran | AGI 72 (pilot) | 64 |
| Ceh'let | Infinite Empire | Veteran | INT 70 (commander) | 68 |
| Rori Fenn | Je'daii | Trained–Veteran | AGI 70 (pilot) | 60 |

---

*Era 01 of the Star Wars Legends character-sheet series. Stats are prime-version, galaxy-wide scale. **Now fully game-ready: numeric Bladework ratings and numeric Force Ability stats (base level + sub-ability proficiency %) for every character.** Formal lightsaber forms did not exist this era — Bladework is a single Armed-Combat rating, enterable in the engine's foundational combat slot.*
