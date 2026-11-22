# Force catalog revision (Force powers research, with point 1 and the Purification amendment)

One commit. Run this first, before lore batch 3. This file combines three items Jared gave in chat earlier: the Force powers paste (with its amended first instruction), the Purification amendment, and the point 1 ruling. They are merged here so the decision log stays in order.

## Inputs
The six research-bot files are already untracked in `Docs/SWRPG lore/`:
- `SW_Force_Powers_Part1a.md`, `_Part1b.md`, `_Part2a.md`, `_Part2b.md`, `_Part3a.md`, `_Part3b.md`

Commit them with this batch. They replace the **Force powers sections** of `SW_Force_Abilities_Forms_v3_complete.md` as the Force catalog's source of truth. The v3 file's **lightsaber forms content is not retired here**: lore batches 3 and 10 handle it (batch 10 applies the forms catalog check and retires it). Mark the v3 powers sections superseded in the research queue and the lore index; leave its forms sections marked current until batch 10.

## Revise `docs-v2/spec/force-catalog-m6.md`
Revise the build reference per Part3b's catalog check, with these rulings. Log them as decisions (numbered in sequence at entry time) and note the repo-only changes in the spec's header.

1. **Midi-chlorian manipulation:** "the Force created Anakin" is fact in the game world. Anakin's conception was the Force's own act; Shmi had no father for him. Whether Plagueis's (and Sidious's) experiments provoked it stays their belief, unresolved: the narrator may present it as what they believed, never as confirmed. Midi-chlorian manipulation itself keeps its existing tier and availability.
2. **Flow-walking:** keep "the past cannot be changed" (Caedus admits this in *Legacy of the Force*); time-drifting stays dropped. Record the conflict with the wiki intro.
3. **Tutaminis and Force Absorb:** merge into one power, Tutaminis, base tier Basic, with tiers: absorb ordinary energy, then lightning, then catching a lightsaber blade.
4. **Sides:** battle meditation neutral (Sith battle meditation's domination is a dark deed); Force Sphere dark; Force Wind dark; memory rub dark (Sith sorcery); hibernation trance, Force resistance, Oneness, Force healing, Transfer Force, the Voss ritual and Force stun neutral. Dark healing (drain, dark transfer, death field) stays dark. Kinetite becomes an application of Electric Judgment (light, forbidden class), not a standalone telekinesis power.
5. **Drops:** drop Create Force Wraith (unlicensed source) and Force Travel (non-canon). **Do not drop Purification (Crystal).** The bot's "Canon only" tag was wrong: the Lightsaber crystal/Legends page describes it as an advanced Jedi technique for cleansing dark-side synthetic crystals, used rarely, and Jaden Korr does it in *Riptide* (41 ABY), turning a Dark Jedi's red crystal into a yellow-bladed Jedi crystal through meditation. Keep it as a **crafting technique**, not a combat power:
   - light side (the act is a light deed);
   - advanced tier (Knight and up), a Jedi Order technique, rarely used;
   - applies only to synthetic crystals made by dark-side users; it removes the dark taint so the crystal can go into a Jedi lightsaber, and the blade colour changes;
   - takes a long meditation during downtime or crafting; it can't be used in a scene;
   - available whenever the Jedi Order exists;
   - link it to the lightsaber crafting and crystal lore.
   Log the ruling (cite *Riptide*) and note the bot's tagging error in the research queue so later files get checked for the same mistake. (The research bot's rule 3 has since been updated to check Legends pages before any Canon-only tag.)
6. **Lore-locks:** fold space taught by the Aing-Tii (outsiders from 43.5 ABY); Theran Force-listening learnable from the Therans; Darksight mainly Sorcerers of Rhand and Nightsisters, rarely others; Telekinetic Barrage renamed Ballistakinesis and made a Jensaarai tradition; Phase rare, with no Killik lock.
7. **Force-meld:** rare in the Old Order (Jorus C'baoth), unavailable 19 BBY–25 ABY, revived from 25 ABY.
8. **Forbidden availability class (new):** Knights can't learn a forbidden power without a Master's permission; Masters may study it under control. Electric Judgment: forbidden to Knights, controlled study from 990 BBY, used openly by the New Jedi Order. Deadly Sight: forbidden. Morichro: forbidden by 1000 BBY (Yaddle the exception). Covert learning risks Order reputation (M7 hook).
9. **Scale:** Supernova tops out at a binary star (needs Sith crystals; backfire risk). Force storm (lightning) is a radius around the user; fleet scale belongs to Force storm (wormhole). Force illusion is interstellar only at the top tier, and amplified (meditation sphere, group work). Force-flash has two uses; system scale is Abeloth only.
10. **Add:** Life Detection (*prima vitae*), Sense Force (*tactus otium*), *altus sopor*, Summon Storm, Vongsense (from 25 ABY), and the named lightning variants as lightning tiers. Add Sith necromancy and Dark Plague as NPC/story powers.
11. **Sources:** TCW (2008) citations on Legends pages are accepted; exclude only 2014 Lost Missions material.
12. **Rename "ShatterSense"** to shatterpoint perception everywhere (ordered earlier, not yet done).
13. **Everything else in Part3b:** apply its other conflicts that have no ruling above (names, era notes, dangers, Force healing's broader dark use, Force cloak difficulty and era, Morichro and Force ghost era notes) as Part3b states them. List each change in the report.

## Scale check (report only, no changes)
Compare the reserve spec's scale classes and feat gates against the scale anchors in Part1a and Part2a:
- telekinesis: Yoda's X-wing, Galen Marek's Star Destroyer, Nihilus's battlecruiser, Dorsk 81's 17 Star Destroyers (pooled, and fatal);
- sensing range;
- battle meditation.
Write `docs-v2/testing/force-scale-check.md`.

## Report
List every catalog change with its ruling or Part3b reference, the D-entries, and the queue and index updates. Commit.

## Then
Continue with lore batches 3 to 18, in order (`lore-batch-3-lightsaber-combat.md` through `lore-batch-18-imperial-military-intelligence-ggw.md`). Each is one commit. Several later batches edit files added by earlier ones, so don't reorder them. If a batch refers to research files that aren't in `Docs/SWRPG lore/`, stop and list what's missing rather than skipping it.
