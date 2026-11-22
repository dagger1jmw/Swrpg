# Lore batch 3, 2026-11-21: lightsaber combat (instructions for Claude Code)

Run this after the Force powers paste and the Purification amendment are committed. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy these research-bot files (reviewed in chat) into `Docs/SWRPG lore/`:

1. `SW_Lightsaber_Index_AllEras.md`
2. `SW_Lightsaber_Forms_AllEras_Part1.md`
3. `SW_Lightsaber_Forms_AllEras_Part2.md`
4. `SW_Lightsaber_SubgroupStyles_AllEras.md`
5. `SW_Lightsaber_Training_AllEras.md`
6. `SW_Lightsaber_WeaponVariants_AllEras.md`
7. `SW_Lightsaber_CombatTechniques_AllEras.md`
8. `SW_Lightsaber_Duels_AllEras.md`

These are the new source of truth for lightsaber forms. The forms content in `SW_Force_Abilities_Forms_v3_complete.md` stays in place until the bot's catalog check against it (Index item 6) comes back. Note that in the research queue and the lore index. Mark "lightsaber combat, all eras" done in `docs-v2/lore/RESEARCH_QUEUE.md` apart from that check.

## 2. Log decisions in docs-v2/decisions.md

Number them in sequence after the last D-number, with no duplicates. Each entry names its lore file. Numbers in brackets are the Index's decision numbers.

### Forms (M5/M6 form rules)

- **[1] When lightsabers became standard:** protosabers become the standard Jedi weapon c. 7000 BBY. The 5000 BBY date (Force-imbued sword page) is consistent with that, since protosabers are standard by then too. No change to the logged lightsaber-technology timeline.
- **[2] Niman origin:** from the Kashi Mer Royale Macheteros dual-blade style, adopted by the Legions of Lettow, then by the Jedi. The "from Jar'Kai" version is recorded as a conflict and not used.
- **[3] "Vaapad" before Windu:** follow the *Insider* 92 reconciliation. "Vaapad" was an old alternative name for Juyo (the creature has both names), so NPCs c. 1000 BBY may call Juyo "Vaapad". The Vaapad *variant*, with its own mechanics, is Windu's and Sora Bulq's creation in the late Republic. Karpyshyn's typo statement is recorded as [BTS].
- **[4] Juyo-Kos:** a Juyo variant (SWTOR-era Jedi refinement). It shares Juyo's profile, with no separate mechanics.
- **[5] Sith Shien:** an alias of Shien, flavor only.
- **[6] Niman mastery:** Drallig's "ten years or more" is a calibration target for the XP system (true mastery of a form takes about a decade of dedicated study), not a hard rule. Note for the Force/form XP review.
- **[7] NJO Strong/Medium/Fast:** catalogued as forms, era-gated to the New Jedi Order (from c. 13 ABY), labelled game-derived (*Jedi Outcast*, *Jedi Academy*).
- **[8] Dun Möch:** a dark-leaning technique. Used by a Jedi it is a minor dark deed, subject to the intent discount (D-330) where it's used calmly as a tactic rather than to humiliate.
- **[9] Tràkata:** allowed for Jedi with no alignment cost. Its reliance on deception is a conduct and reputation note with traditionalist Masters (M7), not a deed.
- **[10] Trispzest:** only for fighters who can fly or levitate (S'kytri, Maw).
- **[11] Thin entries:** Su ma is folded into Ataru as its rotation moves. Lus-ma is NPC-only (Dooku's students: Grievous, MagnaGuards) with a Form III-like profile. Juyo-Kos follows [4].
- **[12] Untrained dual-wielding:** its own penalty profile, separate from trained Jar'Kai (the second blade hinders without training).
- **Form VII access** (with [19] below): Juyo and Vaapad use the restricted availability class from the Force catalog revision. Before Ruusan, Masters won't teach it to the reckless. After Ruusan, Juyo goes to hand-picked students only, and Vaapad needs Windu's permission (only Depa Billaba received it). Juyo needs mastery of several other forms first.

### Sub-group styles

- **[13] Mandalorian anti-Jedi methods:** gear (beskar) plus the Jedi-hunter doctrine already logged. No invented named style.
- **[14] Matukai, Zeison Sha, Jensaarai:** recorded as Force traditions for NPCs and backgrounds, with their weapons (wan-shen, discblade, cortosis armour). Whether they're playable is decided in M7.
- **[15] Sith sword:** its dark-side amplification is mechanical (a modest boost to a dark-side wielder's dark powers). The size is set in the M8 equipment spec.
- **[16] Zeison Sha origin:** the New Sith Wars. The KOTOR II armour item is a game-item appearance and isn't used.
- **[17] Echani:** learnable by anyone with a teacher (special forces, the Royal Guard and Imperial Intelligence trained in it).

### Training (M7)

- **[18] First lightsaber, late Republic:** Initiates (younglings) build their first saber on Ilum in the Gathering, as shown in The Clone Wars (2008) "The Gathering" arc, which is Legends under rule 4. The Padawan page's forging ritual is the deeper crafting done during the apprenticeship. This extends the logged by-era rule (an Initiate Trial before Ruusan; a late-Padawan rite at Tython's Forge in 3653–3643 BBY).
- **[19] Form access by rank (post-Ruusan):** Initiates learn Forms I–VI basics with training sabers; Padawans spend a year or two on each of Forms II–V; Knights specialize; Form VII per the access rule above.
- **[20] Ataru c. 1000 BBY:** discouraged for Padawans (fewer teachers offer it); no lock and no penalty.
- **[21] NJO form access:** from c. 11 ABY the academy teaches the NJO styles and the three rings; the classic forms come back gradually as the Order rediscovers them (*The Jedi Path*, holocrons, the Drallig recording). Luke knows Ataru and Form V from the start.

### Weapon variants (M8)

- **[22] Training sabers:** amend the logged rule. The low-power setting is standard, and a fully trained Jedi can readjust one for real use in an emergency (an actual option, no longer flavor only).
- **[23] Saga Edition and other RPG claims:** usable as game data only where no narrative source gives a figure (rule 8, [last resort]), and always labelled as game stats. A shoto can be thrown like any saber; there's no special throwing bonus.
- **[24] Saberstaff:** no alignment cost. The Order frowns on it, which is a reputation note with traditionalist Masters (M7). Combat use is practically unheard of among Jedi by 32 BBY.
- **[25] Lightwhip:** a breakage rule. A heavy power blow (for example a Djem So power strike) can short it out.
- **[26] Electrostaff bisection setting:** dropped. Lethal shock and blunt trauma are enough.

### Combat techniques (M5/M8)

- **[27] Cortosis:** keep the logged split by purity: refined cortosis shorts a blade out, and cortosis weave only resists. That reconciles KOTOR's block-only portrayal with the later sources. Design default for the short: the blade is out for the rest of the exchange and can re-ignite the next exchange; purified Cortosis-Shield shorts it longer (set in M8). Mestare crystals are immune. Fast striking against cortosis only sparks.
- **[28] Marks of contact:** the alignment weight comes from the situation, not the cut: killing a disarmed, yielding or helpless opponent is a dark deed (as with Dooku's execution). Sai cha against droids or a great danger that resists non-lethal subdual is acceptable. Sai tok used by a Jedi is a minor dark deed ("Sith-like"). Tie this to strike intent (D-260).
- **[29] Tutaminis absorbing a blade:** the top Tutaminis tier from the Force catalog revision ("catching a blade"), gated by skill tier, not rank.
- **[30] Beskar:** stops the cut, but some blunt force carries through: a saber hit on beskar becomes a Vitality hit or a minor wound instead of a cut.
- **[31] Ysalamiri:** inside the bubble, Force powers and Force-assisted techniques stop working: precognition, Force-boosted leaps and speed, and the Force parts of Ataru, Niman and Vaapad. Plain blade skill still works.

### Duels and rankings

- **[32] Exar Kun's record:** both statements hold. As a student he sometimes lost to Baas in sparring; he was never defeated in a real duel.
- **[33] Rankings:** soft calibration targets for the duel harness, not hard per-era tiers.
- **[34] Comparisons across eras:** there are no lore rankings across eras. Results come from the characters' stats alone.

## 3. M5/M6 checks (add to docs-v2/spec/m6-integration-checklist.md, report-only)

- **Anchor duels for the duel harness:** check that the harness can reproduce these outcomes within plausible variance:
  - Lehon, 1000 BBY: Bane's Force power beats Kas'im's better swordsmanship.
  - Coruscant, 19 BBY: the form-switch feint catches Dooku.
  - Naboo, 32 BBY: the catwalk limits Qui-Gon's Ataru.
  - Byss, 10 ABY: strength breaks a blade-lock.
  - Mustafar, 19 BBY: Soresu holds against a furious Form V.

  Report which the current engine can express (terrain, form switching, blade-locks) and which need new rules. Don't build anything.
- **Form matchup table:** compare the engine's form-counter rules with the sourced matchups in Forms Part 1. List any rule with no source, and any sourced matchup the engine lacks.
- **Vaapad:** the Vaapad and Juyo drafts awaiting review should use the access rule above and the "superconducting loop" (power drawn from a dark-sided opponent at a corruption cost) as their lore basis.

## 4. Commit

One commit for all of the above.
