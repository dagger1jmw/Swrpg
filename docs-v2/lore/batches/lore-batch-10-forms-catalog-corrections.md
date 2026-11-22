# Lore batch 10: lightsaber forms catalog check, corrections and retirement of v3 forms content

One commit. Run after lore batch 3 (lightsaber combat), which this batch completes.

## Inputs
Copy into `Docs/SWRPG lore/` (or the repo's lore folder, wherever batch 3 put the lightsaber files):
- `SW_Lightsaber_Forms_Catalog_Check_Part1.md`
- `SW_Lightsaber_Forms_Catalog_Check_Part2.md`
- `SW_Lightsaber_Index_AllEras.md` (replaces the batch 3 copy; it now points to the check instead of a placeholder)

## What this batch does
Batch 3 kept the lightsaber content of `SW_Force_Abilities_Forms_v3_complete.md` canonical until the catalog check. The check is done, so:
1. Apply every correction below to the lightsaber content of v3 (the `## LIGHTSABER FORMS` section and the lightsaber lines elsewhere that Part 1 lists, using its line numbers as a guide; find by text if they have moved).
2. Any M6 data or spec that copied forms lore from v3 (look in `force-catalog-m6.md`, `src/data/`, the form unlock triggers and the worldstate flags) gets the same fixes. List every file touched in the report.
3. Matches (53 items) need no change. Do not rewrite text that matched.
4. Design-only items (Part 1 §E: difficulty, stat gates, costs, multipliers) stay as they are unless a ruling below changes them.

## Rulings on the 16 decisions (Part 2)
1. **Vaapad before Windu:** the name existed in the New Sith Wars as an old name for Form VII (*Book of Sith*, *Path of Destruction*, reconciled by *Star Wars Insider* 92; consistent with batch 3). Windu's technique (channelling one's own darkness through the blade) is late Republic. Pre-Windu "Vaapad" is an alias of Juyo, not the Windu technique. Karpyshyn's typo comment stays [BTS].
2. **Niman origin:** Kashi Mer Royale Macheteros, then the Legions of Lettow, then the Jedi. Note "developed from Jar'Kai" as the minority version in one line.
3. **Niman weaknesses:** keep the named ones (relaxed bladework; nearly hopeless against a Makashi user). Delete "No single weakness or strength".
4. **Niman difficulty:** easy to learn, at least 10 years to master (Drallig). Change the Difficulty column from Advanced to Beginner; the long mastery curve is the design expression. Flag in the report if this breaks any harness gate.
5. **Ventress:** restore her as a skilled Makashi user, not a master, often with two blades. Reverse the 2026-11-20 removal note.
6. **Makashi:** "footwork-centred, minimal energy expenditure". Remove "minimal footwork" and "minimal movement" wherever they appear.
7. **Vaapad mastery:** Billaba became a master; Vos completed his mastery at Saleucami; Windu was the last master after Bulq and Billaba died. Delete the Yoda quote "One student alone, to mastery has risen" everywhere (no source found, Canon or Legends).
8. **Clone Wars Vaapad teachers:** Windu, and only with his personal permission; Bulq, unsanctioned. Billaba is not a teacher.
9. **Vaapad gate:** replace `maceLiving` ("Vaapad teachable"), `maceTrustEstablished` ("Vaapad learning begins"), the Vaapad half of `jediCouncilPermission`, and the line-2696 trigger ("Verify Mace Windu alive + Prequel era") with one gate: **a teacher OR records.**
   - Teacher: Windu's personal permission; Bulq (unsanctioned, carries a corruption risk on learning); or any living Vaapad master (Billaba, Vos while alive, or a PC who has mastered it).
   - Records: from the New Jedi Order onward, the recovered records (*The Jedi Path*, the Great Holocron), preserved into the Legacy era.
   - Before Windu creates it, no Vaapad technique exists (the name refers to Juyo, ruling 1).
   - Keep the design gates (light side only, Juyo 61+).
   - `jediCouncilPermission` stays for Juyo only.
10. **Trispzest:** open to characters who fly or levitate (S'kytri, Maw), not just winged species.
11. **Saberstaff:** remove "does more damage" and "less precise". Replace with what Legends gives: wide coverage and surprise against foes with no experience of it; power and penetration actions are hard to apply; elaborate flourishes leave the user open. A damage bonus applies only to thrown saberstaffs. Add to the lore note: invented by Sith Lords, Exar Kun the first recorded user.
12. **Revan as a Niman user:** keep as [unclear] in the lore text; build nothing mechanical on it.
13. **Telekinetic combat peak:** Darth Traya, with at least three sabers against Meetra Surik. Remove Luke.
14. **Dun Möch:** replace "Considered a dishonor by the Jedi Order" with "a Sith doctrine; Jedi use is rare and debated". The batch 3 design (minor dark deed with the D-330 intent discount) is unchanged.
15. **Tradition column:** Soresu, Ataru, Niman and Sokan become "Jedi origin; also Sith". This must not block Sith or Dark Jedi characters from learning them; check the learning-class code.
16. **Missing items:**
    - **Juyo-Kos:** Juyo variant, Great Galactic War / SWTOR era, Jedi only, Jaric Kaedan as the named master. Restricted like Juyo. Thin source: playable, marked review.
    - **Reverse Shien grip:** a Form V variant (long sweeping strikes against several foes; rare). Named users per Part 2. Also the Jensaarai's style.
    - **Personal Form V variants** (Bane, Zannah, Vader): NPC lore notes only, used for those NPCs' fighting descriptions.
    - **Kas'im's two-saber Ataru:** NPC lore note.
    - **Praetoria Vonil / Praetoria Ishu:** Imperial Knight team styles, Legacy era, gated to the Imperial Knights tradition, learned in addition to the classical forms.
    - **Three rings of defence:** a technique layer under the NJO Strong/Medium/Fast styles (outer, middle, inner guards); no new mechanics now, narrator flavour plus the existing style mechanics.
    - **Mounted lightsaber combat:** technique note (one-handed, low lunges and diagonal slashes from height, protect the mount).
    - **Form alternative names** (Way of the Sarlacc, etc.) and **named moves** (about 25, plus Tràkata, Sokan, Jar'Kai, basic moves and ready stances): add a "Named maneuvers" table to the forms section, each tied to its form, for the narrator to use. They are flavour names on existing actions; no new mechanics in M6. Add an M7 checklist item to consider giving signature moves effects.
    - Saber-variant notes and sub-group styles are already covered by batch 3's files; just cross-reference them.

## Other corrections and unsourced items (Part 1)
- **Juyo, Old Republic (A16):** "available to Jedi in the Old Republic era, but only to students their teacher judged steady; its status swung between frowned-upon and taboo." Add era access: post–New Sith Wars, Vaunk hand-picked a few students a year; Clone Wars, Drallig refused Anakin.
- **Galen Marek (A18):** call him a Dark Jedi, not Sith.
- **Makashi "high mental and willpower requirements" (A4):** unsourced; remove the lore claim. If a stat gate depends on it, keep the gate as design and say so in the report.
- **Lightsaber pike (A40):** "the double-bladed Temple Guard pike fights like a saberstaff"; the polearm type has no stated weaknesses.
- **Free form switch (C1):** remove "(Palpatine and Dooku moved between forms fluidly)"; replace with "Sidious was a master of all seven forms". The mechanic stays.
- **Saber Barrier (D3):** remove "or exceptional speed"; it needs multiple sabers (Windu with one is the sourced exception).
- **Saber Throw (D1):** add that protosabers (corded) cannot be thrown.
- **Form Zero (B2):** named by Skarch Vaunk in *The Jedi Path*, supported by Yoda; Kyle Katarn taught a version in the NJO.
- **Force Valor (D6):** "necessary" in place of "physically impossible".
- **Tutaminis (D8):** "a rare few masters could catch or dispel a blade or bolt (Nejaa Halcyon, Satele Shan)". Delete "nearly impossible to harm with energy weapons at close range". Consistent with batch 3's ruling that catching a blade is the top tier.
- **Je'daii Force-imbued swords (D10):** keep, tagged [gray] for the *Force and Destiny* citation, with the pre-2014 Legends backing noted.

## Decisions
Enter as D-entries, numbered in sequence at entry time:
- Lightsaber forms catalog check adopted; v3 lightsaber content corrected and now matches the research set (rulings 1–16 above in one entry, with the Vaapad gate as its own entry).
- Vaapad gate: teacher or records (ruling 9), replacing the Mace-alive flags.
- Named maneuvers are flavour in M6; effects deferred to M7.

## Tests
- `npm test`, plus `mortals` and `spread` (20 seeds, 8 workers) if any form data, gate or Difficulty value used by the sims changed.
- Add a test that Vaapad is learnable in the NJO era from records with Windu dead, and not learnable before Windu creates it.
- Add a test that a Sith character can learn Soresu, Ataru, Niman and Sokan.

## Report
Write `docs-v2/reports/lore-batch-10.md`: files touched, every item changed with its Part 1/2 ID, any harness change, anything the corrections couldn't map cleanly. Commit.
