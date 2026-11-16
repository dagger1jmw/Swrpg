# Lore checks for the Phase 1 answers (2026-11-16)

Results for every LORE CHECK item in phase1-answers.md, plus the answers that depend on whether a Legends source exists (Q18, Q30, Q61), plus problems found while re-checking Phase 1 under the Legends-only rule (CLAUDE.md).

**Sources.** `Docs/SWRPG lore/` first (cited as file:line). Where those files are silent, Legends knowledge from memory is given only when I am confident, and is marked **(Legends, outside the lore files)**. Anything I could not confirm is marked **FLAG** with what would settle it. Nothing here is a guess presented as fact.

**Status key:**
- **Answered:** settled by the lore files.
- **Answered (Legends):** settled by Legends knowledge outside the lore files.
- **Partly:** answered in part.
- **Lore silent:** no source in the lore files.
- **FLAG:** needs your decision or a source.

## Summary

| ID | Question | Result | Status |
|---|---|---|---|
| L-01 | Q2 Hydian Way blockade dates | Begins 3,661 BBY, broken 3,660 BBY | Answered |
| L-02 | Q3 Resist Aging slows aging | Yes; lapsing accelerates aging | Answered |
| L-03 | Q12 Old Republic Order differences in 3,661 BBY | The Order is on **Coruscant**, not Tython; ages and trials not in the lore | Partly, FLAG |
| L-04 | Q13 Battlemaster, Emperor's Wrath in the era | Both exist; Scourge is the Wrath in 3,661; the Battlemaster in 3,661 is not named | Partly |
| L-05 | Q22 Shatterpoint tier unlocks | Lore table by level; built on the old level scale | Answered, FLAG |
| L-06 | Q24 Kii-Shikk | No source in the lore files; none known in Legends | Lore silent → drop |
| L-07 | Q25 Force Plague | Later stage of Force Affliction (dark sub-ability) | Answered |
| L-08 | Q28 "Force Fortitude" → Battlemind | The lore never uses "Force Fortitude"; the mapping is a legacy guess | Lore silent, FLAG |
| L-09 | Q28 "ForceBodyControl" → Force Body | The lore never uses the name; Force Body is narrower than "body control" | Lore silent, FLAG |
| L-10 | Q28 ForceHeal split | Lore has Force Heal (Self) and Force Heal (Others) | Answered |
| L-11 | Q38 Satele's lightsaber in 3,661 BBY | Lore gives forms only; blade type not stated | Lore silent, FLAG |
| L-12 | Q54 Faction list for 3,661 BBY | Republic, Sith Empire, Jedi Order, Mandalorians supported; Chiss as an Empire ally; Hutts not in the lore | Partly, FLAG |
| L-13 | Q18 Talents with no code | Lore file defines effects for all four | Answered, FLAG |
| L-14 | Q61 Crystal "bleeding" | Disney-era idea in two lore files; follow Legends | Answered (Legends) |
| L-15 | Q30 The 16 non-catalog ability names | 6 map to existing entries or are not abilities; 1 is an umbrella term; 9 lore silent | Partly, FLAG |
| L-16 | "Cold War of 3,661 BBY" wording | 3,661 BBY is the Great Galactic War (year 20); the Cold War is 3,653–3,642 | Answered, FLAG (wording in your files) |
| L-17 | Q47 week length | Your answer says 7-day weeks; the Legends sources in v170-audit.md give 5-day weeks | FLAG |
| L-18 | Q20/Q21 vs the lore's Shatterpoint rules | v2 drops Path A, focus and tunnel vision, which the lore file defines | FLAG |

## Resolutions (Jared, 2026-11-16)

Every flag above is resolved. Each decision is logged with its reason in decisions.md (2026-11-16, D-01 to D-10). The details below are kept as the research record.

| ID | Resolution | Decision |
|---|---|---|
| L-01, L-02, L-07, L-10 | Answered by the lore; no decision needed | — |
| L-03 | Starts before 3,653 BBY use the Coruscant Temple under Grand Master Zym; Tython only for starts from 3,653. ranks.md notes that its age and trial rules are a design choice based on prequel-era practice | D-02 |
| L-04 | Titles exist as the lore says (Scourge holds Emperor's Wrath in 3,661); no holder named for Battlemaster | — |
| L-05 | Shatterpoint perception bands re-anchored to v2 tiers: physical 1+, combat 21+, personal 41+, relational 61+, situational 81+, events 101+ | D-06 |
| L-06 | Kii-Shikk dropped (no Legends source) | — |
| L-08, L-09 | Aliases "ForceFortitude", "Force Fortitude", "Fortitude" and "ForceBodyControl" removed; unknown names are rejected | D-07 |
| L-11 | Satele Shan uses a **blue double-bladed lightsaber** in 3,661 BBY (Legends: double-bladed during the Great Galactic War; a single green blade only later in the Cold War) | D-04 |
| L-12 | Renown tracks: Republic, Sith Empire, Jedi Order, Sith, Mandalorians, Underworld. Chiss count as Empire | D-08 |
| L-13, L-18 | Golden Rule 3 amended: story facts in the lore are authoritative; game-mechanics sections are inputs that specs may override, with every override logged. All four talents kept, translated to v2 terms | D-05 |
| L-14 | Crystal "bleeding" replaced with the Legends version in the two lore lines (one-time Docs/ exception) | D-10 |
| L-15 | Dominate Mind is a catalog candidate; Battle Meld is era-gated (not in 3,661); UnifyingForcePerception dropped; five unsourced names listed in force-catalog-questions.md | D-09 |
| L-16 | "Cold War" replaced with "Great Galactic War (year 20)" for 3,661 BBY in phase1-answers.md and character-creation.md; default start stays 3,661 BBY | D-01 |
| L-17 | 7-day weeks and 12 months are Legends-sourced (HoloNet News and *The Essential Atlas*, per Wookieepedia "Standard week/Legends") | D-03 |

## Details

### L-01 — Hydian Way blockade (Q2)
- **Answer:** the blockade **begins in 3,661 BBY** (Year 20 of the Great Galactic War) and is **broken in 3,660 BBY** (Year 21), when Hylo Visz leads a convoy and the Republic Navy joins after an SIS tip.
- **Source:** SW_Legends_Galaxy_Timeline.md:381 (begins), :382 (Battle near Devaron, Jedi squadrons wiped out), :383 and :385 (Coruscant riots begin, Temple rationing), :391 (blockade broken, 3,660), :392 (riots end, rationing eases).
- **Legends check:** this is SWTOR material, so it is Legends. The Phase 1 finding (BUG-028) was judged against this Legends timeline, not Disney canon, and stands.
- **Precise cause of BUG-028:** the timeline's seed block is headed "FACTION STATE SEEDS (3,660 BBY)" and labelled "Year 21 … blockade just broken" (:475-479). It is internally consistent; legacy copied that 3,660 seed into the 3,661 start.
- **For Q2 (start date is a creation choice):** a start in 3,661 BBY opens during the blockade; a start in 3,660 or later opens after it breaks.
- **FLAG (small):** I could not confirm the exact year of the break from a Legends source outside the lore file. The lore timeline is the source of truth here, so this needs no action unless you know otherwise.

### L-02 — Resist Aging (Q3)
- **Answer:** yes. Resist Aging slows aging. It is passive once developed, needs daily meditation, and **lapsing causes accelerated aging**. It is not immortality.
- **Prerequisites:** Meditation 41+, ForceControl 30+, ForceKnowledge 21+; D = 4.0 (Advanced); Neutral.
- **Source:** SW_Force_Abilities_Forms_v3_complete.md:718-725.
- **FLAG (minor):** the lore note says it "explains why experienced Jedi Masters like Yoda live for centuries". As I recall, Legends attributes Yoda's 900 years mainly to his species' long lifespan, so treat the Yoda line as the lore file's own gloss. The effect itself (slows the body-cap decline) is supported. The size of the effect is not given; it is a design number for the species/health spec.

### L-03 — The Old Republic Order in 3,661 BBY (Q12)
- **Location (Answered; this corrects the question's premise):** in 3,661 BBY the Order is based in the **Jedi Temple on Coruscant**, led by **Grand Master Zym**.
  - Sources: Timeline :383, :385 (Coruscant riots, Temple on rationing, Zym); SW_Characters_09_GreatGalacticWar_ColdWar.md:59 ("Grand Master Zym still leads the Jedi").
  - The move to **Tython** comes only after the Sacking of Coruscant and the Treaty of Coruscant in 3,653 BBY (Timeline :410-412, :421: "The Jedi Order, driven from Coruscant, relocates to Tython").
  - So ranks.md and the routines should use the Coruscant Temple for a 3,661 start, and Tython only for starts after 3,653.
- **Ages and trials (Lore silent):** no lore file states the Initiate Trials age, a Padawan-selection cutoff at 13, the Council of Reassignment, or the five Knight Trials. (12-milestones-rank-life-stage.md, Conflicts, already noted that these came only from legacy code.)
  - **(Legends, outside the lore files):** the Padawan cutoff at 13, the Service Corps, and the five Knight Trials (Skill, Courage, Flesh, Spirit, Insight) are Legends material, but from the prequel era (about 32 BBY), not the Old Republic.
- **Data points in the lore** (useful for the lifetime tests, not rules):
  - Satele Shan, born 3,699 BBY (SW_Characters_09:194), was a Padawan when Kao Cen Darach died in 3,681 BBY (:681). That is about age 18.
  - She was a Knight by the Battle of Alderaan in 3,667 (:195), at about age 32.
  - Obi-Wan was knighted at about 25 (SW_Characters_11, cited in 12-milestones).
- **FLAG:** I'm not confident about Old Republic-specific Order practice (for example, whether older recruits or looser age limits were normal before the Ruusan Reformation). Treat the prequel-era rules in ranks.md as a design choice for 3,661, not as attested lore. If you want this pinned down, it needs a SWTOR codex or novel source.

### L-04 — Battlemaster and Emperor's Wrath (Q13)
- **Emperor's Wrath (Answered):** it exists in the era and is held by **Lord Scourge**, made immortal about 3,950 BBY, who "served as the Wrath ~300 years". So he holds it in 3,661 BBY.
  - Source: SW_Characters_09:107-112, :128. The title passes later (the "former apprentice (the Emperor's Wrath)" who kills Baras about 3,641 BBY, :333).
  - Implication: a player can't hold the title in 3,661 while Scourge does, unless the story removes him.
- **Jedi Battlemaster (Partly):** the role exists in the era.
  - Kao Cen Darach, "Jedi Battlemaster", died in 3,681 BBY (SW_Characters_09:681).
  - Jaric Kaedan, "Jedi Master/Battlemaster; Council", led the strike that captured the Dread Masters (:695). By the SWTOR storyline that is during the Galactic War, after 3,661.
  - The Hero of Tython also becomes Battlemaster later (:471).
  - **Lore silent** on who holds the post in 3,661 BBY. FLAG if you want a named holder.
- **Also in the lore for this era:** "Barsen'thor" (a Jedi title, cited in 12-milestones Conflicts) and the Dark Council (already in ranks.md).

### L-05 — Shatterpoint tier unlocks (Q22)
- **Answer (lore table, both paths):**

  | Level | Tier | What can be perceived |
  |---|---|---|
  | 1–5 | T1 | Physical structural weaknesses (objects, materials, mechanisms) |
  | 6–10 | T1 | Combat shatterpoints (stance flaws, injuries, openings) |
  | 11–20 | T1/T2 | Personal (psychological fractures, defining decisions) |
  | 21–35 | T2 | Relational (relationships, alliances) |
  | 36–50 | T2/T3 | Situational (pivotal moments in unfolding events) |
  | 51+ | T3 | Event (fulcrums of history; Windu-tier) |

- **Source:** SW_Force_Abilities_Forms_v3_complete.md, the "Proficiency Scope by Level" table in the Shatterpoint section (heading at :459). The ability's Legends basis is Matthew Stover's *Shatterpoint* novel (2003), which the lore cites.
- **FLAG:** these level bands were written for the legacy 100 × 1.07^n scale and a separate 500 × 1.07^n Shatterpoint track. Under progression-numbers.md the same level number means a different amount of training. Decide whether to keep the bands as level numbers or re-anchor them to the new tiers (for example, T3 at Master tier).

### L-06 — Kii-Shikk (Q24)
- **Lore silent:** no lore file mentions Kii-Shikk; the lore form table has no such form (05-force-abilities.md, Conflicts).
- **(Legends, outside the lore files):** I know of no Legends lightsaber form by that name.
- **Result:** under your answer ("keep it only if a Legends source exists"), drop it.
- **FLAG (low):** if you remember where legacy got it from, tell me and I'll check that source.

### L-07 — Force Plague (Q25)
- **Answer:** the lore lists it as the **later stage of Force Affliction**, a dark-side sub-application in the Force Stasis family: "Force Affliction → Force Plague 🔴".
  - Anchor: ForceControl + Dark Side. D = 2.5.
  - Prerequisites: Force Slow 20+, Dark Side 25+.
  - "Force Plague can persist for days."
- **Source:** SW_Force_Abilities_Forms_v3_complete.md:1565-1569.
- **Result:** model it as a stage of Force Affliction, not its own ability. It is not a Disney-era idea.

### L-08 — "Force Fortitude" → Battlemind (Q28)
- **Lore silent:** "Force Fortitude" appears nowhere in the lore files. The only "fortitude" is the Willpower stat description (SW_Force_Abilities_Forms_v3_complete.md:23).
- **What the lore says Battlemind is (:873-879):** calm, focused clarity in combat that suppresses fear and doubt. Meditation-anchored, Light Side, Meditation 21+ and Willpower 20+.
- **Why this is a guess:** the legacy alias (`legacy/index.html:8952-8954`) maps "ForceFortitude" and "Fortitude" to Battlemind. That is a guess. "Fortitude" could as easily mean Force Valor (:635), pain control, or Force Body.
- **FLAG:** decide whether "Force Fortitude" should map to Battlemind or be rejected as an unknown name. I recommend rejecting it, so the AI must use catalog names.

### L-09 — "ForceBodyControl" → Force Body (Q28)
- **Lore silent:** the name never appears.
- **Why the mapping is too narrow:** Force Body (:708-716) is specifically "converting Force energy into physical endurance … ignore mortal wounds … burning … life Force" (D = 4.0; ForceEndurance 30+ and ForceControl 30+). General "body control" is the whole **Body Enhancement family** (:557-559: Force Jump, Speed, Enhanced Reflexes, Endurance, Breath Control, Heal Self, Camouflage and others).
- **FLAG:** decide whether to drop the alias, so an unknown name is rejected, rather than silently turning a general term into the most dangerous ability in the family.

### L-10 — ForceHeal split (Q28)
- **Answer:** the lore distinguishes the two.
  - **Force Heal (Self)** (:625-631): Meditation + ForceControl, D = 2.5, Light, Meditation 21+ and ForceControl 15+. Cannot regrow limbs or organs.
  - **Force Heal (Others)** (:1005-1011): needs ForceHeal (Self) 21+ and Light Side 10+, and close contact. "More demanding than self-healing."
- **Result:** split it. Legacy already has a `ForceHealSelf` key (`legacy/index.html:8822`). The legacy lore database's 12 bare "ForceHeal" uses need mapping per NPC (see L-15).

### L-11 — Satele Shan's lightsaber in 3,661 BBY (Q38)
- **Lore silent on the blade:** her sheet gives forms only: Ataru 88 (primary), Soresu 82, Niman 80, Shii-Cho 78. Her style is "fluid, acrobatic, Force-speed-driven … leaning on telekinesis, Force barriers" (SW_Characters_09, Satele section, :190-208). Nothing says single or double blade.
- **Legacy:** the legacy lore database says "Double-bladed lightsaber" (`legacy/index.html:9057`), with no source.
- **FLAG:** I'm not confident from memory which she uses in SWTOR material, so I won't guess.
  - Until it's sourced, give her a single blade, which matches her listed forms; none of them is a saberstaff form.
  - Settling it needs a SWTOR source (the *Hope* cinematic, a codex entry, or the *Deceived* novel).

### L-12 — Factions for renown in 3,661 BBY (Q54)
- **Supported by the lore:**
  - **Galactic Republic**, including the Republic military and the SIS (Timeline :391).
  - **Sith Empire**, including Imperial Intelligence and the Dark Council (Timeline :305-311; SW_Characters_09 many).
  - **Jedi Order.**
  - **Mandalorians**, unified under Mandalore the Lesser with Imperial backing (Timeline :374-375 and :381, "Imperial Intelligence sponsors Mandalorian gladiator", "Mandalore the Lesser unifies clans").
- **In the lore, but best as a sub-faction:** the **Chiss**, an Empire ally ("Chiss alliance secured", Timeline :311). Treat them as part of the Empire for renown unless the player operates in Chiss space.
- **Partly:** the smuggler underworld (Hylo Visz is a smuggler; Nar Shaddaa appears at Timeline :374).
- **Lore silent:** the lore files never name the **Hutt Cartel** for this era.
- **FLAG:** decide whether to add an "Underworld / Hutt Cartel" renown track. The lore supports the underworld as a setting but doesn't define the faction.
- **Separate tracks?** "Sith" and "Jedi" as renown separate from Empire and Republic are a design choice. The lore treats the Dark Council as part of the Empire and the Order as allied to, but separate from, the Republic.

### L-13 — Talents that had no code (Q18)
- **Answer:** the lore file defines an effect for all four:
  - **Combat Intuition:** +1 to all combat rolls when outnumbered.
  - **Dark Affinity:** dark-side ability Force strain ×0.85, and alignment drift accelerates.
  - **Living Force Connection:** passive environmental Force Sense; Animal Bond strain-free.
  - **Precognitive Edge:** Precognitive Reflexes unlocks one tier earlier.
- **Source:** SW_Force_Abilities_Forms_v3_complete.md, the Innate Talents table (:1604-1617).
- **FLAG:** these are game-design effects written into the lore file, not facts from Legends stories. Your rule keeps a talent "only if the Legends lore defines an effect". By that wording all four stay, but each effect must be translated to v2 terms: strain becomes Force load, "+1 to rolls" becomes a circumstance modifier, "one tier earlier" becomes a level shift. Confirm that the lore file counts as "Legends lore" for game-design entries like these.

### L-14 — Crystal "bleeding" (Q61; Legends-only rule)
- **Disney-era idea found in two lore files:**
  - SW_Force_Abilities_Forms_v3_complete.md:1434 (Kyber Resonance): "A Sith bleeds their crystal through a similar but dark-side process."
  - SW_Characters_11_RepublicEra_RiseOfEmpire.md:269 (Dooku): Darth Tyranus "adds … a bled red blade".
- **(Legends, outside the lore files):** crystal bleeding comes from post-2014 Disney material. In Legends, Sith mostly used synthetic red crystals, and Jedi attuned natural crystals through meditation during construction.
- **Result:** both lore lines are recorded as conflicts with Legends; follow Legends. I updated 22-equipment-and-items.md. The lore files themselves are unchanged (`Docs/` is read-only). Fix them yourself if you want the canon files clean.

### L-15 — The 16 non-catalog ability names in the legacy lore database (Q30)

| Legacy name | Uses | Result | Source |
|---|---|---|---|
| ForceHeal | 12 | Map to Force Heal (Self) or (Others) per NPC | Lore :625, :1005 |
| MindManipulation | 1 | Map to **Mind Trick** family | Lore :734 |
| ForceConcealment | 1 | Map to **Force Camouflage / Force Cloak** | Lore :648, :658 |
| SithSorcery | 3 | Not one ability; the lore uses it as the umbrella for the Sith Alchemy section (e.g. Summon Fear). Map per NPC to specific entries | Lore :774, :1521-1526 |
| ForceHealingResurrection | 1 | Lore silent. Nearest entries: Transfer Essence (:1492) or the Plagueis-related notes (:1059, :1488). FLAG: no Legends ability by that name that I know | — |
| Meditation, ForceOutput, ForceKnowledge | 2, 1, 1 | Not abilities: these are Force stats. Drop as abilities | Lore stat table :1-30 |
| ForceDarkSide | 1 | Not an ability (alignment). Drop | — |
| MindDomination | 5 | Lore silent. (Legends, outside the lore files) "Dominate Mind" is a KOTOR Force power, so a Legends source exists. Candidate catalog addition | FLAG to confirm |
| BattleMeld | 2 | Lore silent. (Legends, outside the lore files) the Jedi battle meld is New Jedi Order-era Legends. Candidate addition, era-gated | FLAG to confirm |
| UnifyingForcePerception | 1 | Lore silent. The Unifying Force is a Legends philosophy (New Jedi Order era), not a named power. Suggest dropping | FLAG |
| Possession | 1 | Lore silent. Sith spirit possession occurs in Legends stories, but I can't name a defined power with confidence | FLAG |
| Multipresence | 1 | Lore silent. No Legends power by that name that I'm sure of | FLAG |
| MindWalking | 1 | Lore silent. I believe Luke "mind-walks" in *Fate of the Jedi*, but I'm not certain enough to cite it | FLAG |
| ForcePsychosis | 1 | Lore silent. No Legends power by that name that I know | FLAG |

Per your Q30 answer, the FLAG rows go to force-catalog-questions.md when the catalog is built. The counts come from 05-force-abilities.md's Conflicts table.

### L-16 — "Cold War of 3,661 BBY" (re-check under the Legends rule)
- **Answer:** 3,661 BBY is **Year 20 of the Great Galactic War** (3,681–3,653 BBY). The **Cold War** runs 3,653–3,642 BBY, from the Treaty of Coruscant to the Galactic War.
- **Source:** Timeline :305-311, :377 ("3,661 BBY — Year 20"), :411-417 ("COLD WAR — 3,653–3,642 BBY"); SW_Characters_09:59 ("the Great Galactic War is ongoing (year 20 of 28)").
- **Where the wrong label appears:** phase1-answers.md (Legends rule paragraph, "the Cold War of 3,661 BBY"; Q1 "3,661 BBY (Cold War)") and character-creation.md §1 ("era (default 3,661 BBY, Cold War)").
- **FLAG:** I didn't edit those files, since they are your decisions. Change "Cold War" to "Great Galactic War" in both, or change the default start year if you meant a Cold War start (3,653–3,642).
- **What depends on it:** the start date decides whether Zym or Satele leads the Order, Coruscant or Tython, and whether the blockade is running (L-01, L-03).

### L-17 — Week length (Q47)
- **What the sources say:** your answer says "7-day weeks". v170-audit.md:77-78 cites two Legends calendars: the original (5-day weeks, 10 months, fete weeks) and the later 12-month / 368-day reform used by *The Essential Atlas*. The five Legends weekday names (Primeday, Centaxday, Taungsday, Zhellday, Benduday) imply a 5-day week. The lore files say nothing about the calendar.
- **FLAG:** I can't confirm from the cited sources that the 12-month reform uses 7-day weeks. If it doesn't, a 7-day week is an invention, and under the Legends-only rule it should be a logged decision rather than presented as Legends.

### L-18 — v2 Shatterpoint decisions vs the lore file (Q20, Q21)
- **What the lore file defines:**
  - **Path A**, learned without the talent, capped at level 20 (SW_Force_Abilities_Forms_v3_complete.md:459-480).
  - **ShatterSense** seeding at **level 5**.
  - **Focus / awareness-bandwidth** levels with **tunnel vision** above 70.
  - **Interpretation strain** (20–40 on Path A, ×0.3 with the talent).
- **What v2 decided:** remove Path A (Q20), compute ShatterSense's starting level at creation (Q20), drop focus and tunnel vision, and charge Force load 0.3 per read (Q21).
- **FLAG:** CLAUDE.md Golden Rule 3 says never contradict `Docs/SWRPG lore/`. These lore entries are game-mechanics design, not story facts, and Mace Windu's natural gift (the Legends basis) is preserved either way. Confirm that game-mechanics sections of the lore file can be overridden by v2 specs, and log it in decisions.md. Otherwise the rule is technically broken here and in L-13.
