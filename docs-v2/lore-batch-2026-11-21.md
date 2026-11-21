# Lore batch, 2026-11-21: instructions for Claude Code

Run this only after the overnight-fix work is committed. Read the whole file first, then carry it out in order. Don't change any game code. Make a single commit at the end.

## 1. Add the lore files

Copy these research-bot files (all reviewed in chat) into `Docs/SWRPG lore/`:

1. `SW_Lightsabers_Crystals_Materials_AllEras.md`
2. `SW_Weapons_Armor_AllEras.md`
3. `SW_Jedi_Daily_Life_Training_OldRepublic.md`
4. `SW_Sith_Academies_Training_OldRepublic.md`
5. `SW_Jedi_Training_AllEras_Part1.md`
6. `SW_Jedi_Training_AllEras_Part2.md`
7. `SW_Sith_Training_AllEras_Part1.md`
8. `SW_Sith_Training_AllEras_Part2.md`

If `SW_Jedi_Order_Ranks_Council_OldRepublic.md` is not in `Docs/SWRPG lore/` yet, or its decisions are not logged (Satele Shan: Knight in 3661 and at the 3653 talks; Master and Council seat 3651; Grand Master c. 3648 after the move to Tython; term ends c. 3636; Coruscant Temple rebuilt c. 3500 BBY), stop and tell me before going on.

## 2. Log decisions in docs-v2/decisions.md

Number them in sequence after the last existing D-number, with no duplicates. Group them by milestone as below. Each entry names its lore file.

### M8: equipment

- **Lightsaber technology by era** (lightsaber file + Jedi all-eras Part 1):
  - Before c. 15,500 BBY: Force-imbued blades are the Jedi weapon, and they remain the main weapon on early Ossus.
  - Forcesaber (Rakatan-derived; copied by the Je'daii in the Force Wars, c. 25,793 BBY): powered through the dark side by lab-grown crystals, with no power source. It can only be used by drawing on the dark side, and every use counts as dark-side use (an M6 alignment deed).
  - c. 15,500 BBY: the first lightsabers. Unstable, overheat after short use, rare and cumbersome.
  - c. 7000 BBY (Hundred-Year Darkness) to the Great Hyperspace War: protosabers are common. The hilt is cabled to a belt power pack. No saber throw, no telekinetic saber combat.
  - After the Great Hyperspace War (complete by c. 4800 BBY): modern self-contained lightsabers (the Sith moved the power cell into the hilt). From the Great Sith War (c. 4000 BBY) on, all sabers are modern.
  - The First Blade is a unique SWTOR prototype.
- **Training sabers:** a permanent low-power setting (matches M5's training-saber mode); a trained Jedi can overload one in an emergency (flavor only). Old Republic training sabers use bondar (stun) crystals; later eras use low-grade Adegan crystals. SWTOR-era Padawans (3653–3643 BBY) use electroblade practice swords until the Forge rite. All are Vitality-only.
- **Mass production:** lightsaber components can be mass-produced, but assembly is by hand, so stock sabers exist (Brotherhood of Darkness, the Reborn, Imperial Knights).
- **Crystal sources:** Adega first, Ilum from c. 22,800 BBY.
- **Cortosis by purity:** refined cortosis (shields, gauntlets, cortosis rounds) shuts a lightsaber off for a short time; the exact duration is a default for the M8 spec (sources range from "temporarily" to "several minutes"). Trace cortosis-weave in armour and vibroblades only resists, like phrik.
- **Electrostaffs:** phrik by default in the Clone Wars, though not every staff (so cheap staffs can be cut). Imperial riot-trooper staffs are cortosis. Electrostaffs bypass armour and neutralize personal shields.
- **Armour against blasters:** good military armour reduces a blaster hit but never makes the wearer immune. Light armour and blast vests barely help against blasters but do help against slugs and shrapnel.
- **What a saber can do against each attack:** blaster bolts can be deflected and redirected; slugs can be blocked but not redirected; stun can be blocked (dissipated, as Ahsoka does in TCW "The Jedi Who Knew Too Much") but not redirected, at a slightly harder block; flame and sonic attacks can't be blocked with the blade (only a costly Force barrier).
- **Personal energy shields by era**, like beskarChance: prominent in the Mandalorian Wars and the Jedi Civil War, rare by the Clone Wars, nearly lost from the Galactic Civil War to the Vong War. Shield-piercing weapons (Mandalorian ripper, disintegrator, disruptors) and vibroweapons beat them.
- **Era kit:** pulse-wave blasters only up to about the Great Sith War (they lost out to triple blasters; the self-contained blaster appeared before the Mandalorian Wars). Cortosis-weave vibroswords common around 3956 BBY, rare by the Galactic Civil War. Bowcaster: 6–10 quarrels standard.
- **Money:** Padawans aren't given funds; the Master manages them.

### M7: Jedi Order

- **Apprentices per Master, by era:** several before c. 3996 BBY (praxeums up to about 20); after the Great Sith War, Masters are asked to take one, with exceptions (the default for the KOTOR and SWTOR eras; in practice students also learn from several teachers); lapsed in the New Sith Wars; strict at Ruusan (1000 BBY); several again in the New Jedi Order; one at a time in the Legacy era.
- **Marriage:** normal c. 4000 BBY, discouraged after 3996 BBY, forbidden by the late Republic (secret relationships in the SWTOR era); Corellian Jedi excepted; allowed again in the New Jedi Order and Legacy eras.
- **The era table:** age of entry, apprentices per Master, how knighting works and family rules for each era (Je'daii; early Order; c. 3996–3950; SWTOR; New Sith Wars; late Republic; Dark Times; New Jedi Order; Legacy), as given in the Jedi all-eras cross-era table and Game notes, with the apprentice and marriage rules above.
- **Je'daii:** one-on-one Padawan training away from Padawan Kesh; Journeyers start the two-year Great Journey in their late teens; ranks initiate → Padawan → Journeyer → Ranger → Master → Temple Master.
- **Default Temple day** (general, *The Jedi Path*): morning Force study (Control, Sense, Alter), midday classes, afternoon physical and lightsaber training (Forms I–VI with training sabers), five meditations a day. Wartime and Tython eras run looser: field tasks, Council-approved solo Padawan missions, fewer formal classes. Padawans set their own schedule around missions.
- **Progression:** Initiate Trials can be retaken, but there's no extra year ("progress or leave"). The usual cutoff for being chosen is about 13; before Ruusan, adolescents and adults can be recruited. Initiates get real sabers only after showing strike control (the Sevinte cadence). Clan size: about ten.
- **Knighthood:** the High Council rules on readiness. In wartime, deeds can count toward the Trials, and Masters can knight in the field. Which Trials the Old Republic used is still open.
- **Saber construction by era:** an Initiate Trial before Ruusan in general; a late-Padawan rite at Tython's Forge (Vur Tepe) in 3653–3643 BBY.
- **Failing or not being chosen** leads to the Service Corps (AgriCorps, MedCorps, EduCorps, ExplorCorps) under the Council of Reassignment: a non-combat career branch. ExplorCorps sees the most fighting.
- **Clone Wars:** Padawans as Jedi Commanders (one per regiment), faster promotion, fewer sent to the Service Corps, orphaned Padawans pooled at the Temple. Anakin knighted after Praesitlyn in a secret ceremony without Trials.
- **Grand Master date:** Shigar Konshi's selection by a "recently appointed" Grand Master is consistent with the logged c. 3648. No change.
- **Not used:** the *Jedi Academy* children's books' school-style Temple.

### M7: Sith and other dark-side orders

- **Sith rank names by era** (the narrator uses the era's names), from the Sith all-eras cross-era table:
  - Ancient Empire: castes (Kissai priest-teachers, Massassi warriors), Sith Lords, the ten-member Sith Council, the Dark Lord.
  - Kun's Brotherhood of the Sith (c. 3996): disciples, Sith Lord, Dark Lord.
  - Imperial (Vitiate's Empire, to 3636): acolyte → apprentice → Sith Lord → Darth → Dark Council (12 Dark Lords, one Sphere each) → Emperor's Wrath → Emperor, with Overseer and Assistant Overseer as staff roles.
  - Revan and the Triumvirate (3959–3951): Dark Lord, apprentice, Shadow Hand, assassins and marauders; self-styled "Lord of" titles.
  - Brotherhood of Darkness (1010–1000): all Masters are "Dark Lords of the Sith"; Darth is discouraged.
  - JCW-era Korriban: "true Sith" status is earned through prestige.
  - Rule of Two (1000 BBY–4 ABY): Master and apprentice only.
  - Lost Tribe: Tyro → apprentice → Saber → Master → Lord → High Lord → Grand Consort → Grand Lord.
  - One Sith: acolyte → apprentice → Lord/Lady → Darth (by merit only), plus the offices of Hand, Fist, Voice/Regent, Loremaster and Inquisitor.
- **"Darth" by era:** granted by the Emperor to high Lords (Vitiate did not use it as a young Lord); banned by Kaan; chosen by the Master at the oath (Rule of Two; some kept birth names); self-styled (Triumvirate, Caedus); merit only (One Sith, so not every Sith is a Darth).
- **Shadow Hand:** a single sworn subordinate who is both apprentice and second-in-command.
- **Non-Sith darksiders:** from 1000 BBY to 4 ABY only the Rule of Two pair are Sith. Dark Acolytes, Dooku's assassins, Inquisitors, Emperor's Hands, Prophets of the Dark Side, the Royal Guard's Force-trained elite, the Dark Side Elite, Jerec's Dark Jedi, the Shadow Academy's Dark Jedi and the Reborn are not Sith. The narrator must not call them Sith.
- **Class size per instructor:** about 6 (Imperial Korriban), 3–4 (JCW Korriban), 20+ (Brotherhood Korriban); Brotherhood lesser academies train one role each (acolytes: Dathomir, Iridonia; assassins and spies: Ryloth, Umbara, Nar Shaddaa; warriors and marauders: Honoghr, Gentes, Gamorr). The acolyte stage normally lasts several years from a young age; SWTOR-style fast tracks are exceptional.
- **Imperial recruitment:** training at the Academy is mandatory by law for all Force-sensitives in Imperial territory, and parents who hide a child are punished. Slaves could be taken as apprentices during the Great Galactic War; slave and alien acolyte classes became policy in the Cold War and were still resented. Killing among Imperial acolytes is forbidden and punishable by death, but common, disguised as tomb accidents.
- **The Sith Blademaster** is the counterpart of the Jedi Battlemaster. Brotherhood practice: sequences from all seven forms, one assigned key form per student, a critique after each bout, and challenges at the end of class that could be lethal.
- **Sith sparring:** training bouts are non-lethal (Brotherhood pelko-barbed training sabers burn and briefly numb a limb), but challenges and trials use real weapons. M7 adds a challenge mode that uses the full M5 wound rules. Lethal trials by era: the Inquisitor audition (those not chosen are executed), the Royal Guard's final duel to the death, the Shadow Academy's knife drill, Rule of Two survival tests (Maul on Hypori).
- **Killing the Master:** the promotion step under the Rule of Two (when the apprentice has surpassed the Master) and the One Sith (on the Dark Lord's order, with the Master allowing it).
- **Weapons:** a warblade or training saber during the trials, a lightsaber at apprenticeship (often the master's own as a gift). Apprentice Inquisitors use lightfoils.
- **Conflict picks:** slaves and aliens admitted gradually; Harkun's first class had 7; Gerr was badly injured, not killed; Vindican was a Sith Lord in 3681 (keep the name Darth Vindican); JCW admission by Sith Medallion; the Korriban Academy was founded by Exar Kun's disciples in 3996 BBY; Darth Rivan was betrayed by his apprentice; Emperor's Hands start training after developing (Mara Jade the exception); Inquisitor recruitment is staged, with Byss as the founding cohort.

### M6 checks (add to docs-v2/spec/m6-integration-checklist.md)

- **Re-measure list:** a simulated Sith-academy run (interrogation, judging prisoners, trial killings) to check how fast Dark climbs under the per-turn and per-scene deed caps.
- **Conversion by torture:** a captured Jedi (after capture by subduing, D-262) may face a conversion arc. Torture works only through temptation moments and corruption pressure; it never sets alignment directly. A fall still comes from the character's own deeds.
- **Step 1 review check:** Orgus Din (weak Force aptitude, Council-level combat skill "through endless practice"). Low Potential and talent plus heavy drilling must still reach high skill.

### Engine check (report only, don't change code)

- **Era gating of "Sith" opponents (D-213):** report whether the engine can generate a generic "Sith" opponent between 1000 BBY and c. 25 ABY. Per the Sith all-eras file, dark-side opponents in those years should be Dark Jedi, Dark Acolytes or Inquisitors, with "Sith" reserved for named Masters and apprentices. Propose the fix; don't build it.

## 3. architecture §15 notes

- M8 equipment-spec ideas from the lightsaber file's Game notes: crystal slots (one primary, up to two focusing), crystal modifiers by rarity, cortosis shut-off versus parry-only materials, the ultrachrome melt threshold, synthetic blades that can break a Jedi blade, crystal availability by era (Ilum-only for Jedi between Ruusan and the Purge; sites razed under the Empire).
- Prepared Jedi hunters (next to the existing traps note): Revan's and HK-47's doctrine of flame, slugs, sonics, mines, nets, attacks on companions and sniping from cover.

## 4. Research queue and lore index

Create `Docs/SWRPG lore/RESEARCH_QUEUE.md`. For every file in `Docs/SWRPG lore/`, list:
- file name, a one-line scope, the eras it covers, and its size;
- origin: "bot (reviewed)" for the research-bot files, otherwise "pre-bot";
- every D-number and spec file that cites it or relies on its facts;
- for pre-bot files: a proposed redo topic for the research bot, as a one-paragraph brief (subject, eras, which game systems use it);
- priority: 1 = feeds M6 (Force powers, alignment, the dark side); 2 = M7 (Orders, ranks, schedules); 3 = M8 (equipment, lineage); 4 = background only.

Add a section "Gaps (no file yet)":
- Yuuzhan Vong weapons and armour (queued; vonduun crab armour resists lightsabers);
- any topic the specs or §15 refer to that has no lore file.

Mark "Jedi training, all eras" and "Sith training, all eras" done.

Also create or update `Docs/SWRPG lore/README.md`, listing each lore file with its one-line scope.

## 5. Commit

One commit for all of the above.
