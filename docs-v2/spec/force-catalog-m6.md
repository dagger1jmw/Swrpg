<!-- Exported 2026-11-21 from the claude.ai doc "SWRPG M6 — Force Ability Catalog Spec" (https://claude.ai/artifact/Hk5HFmY88zFae3j5NpxMaE, rev 48). Superseded doc: since 2026-11-21 this repo copy is canonical and the doc is no longer updated. -->

**Canonical (Jared, 2026-11-21):** this repo file is the source of truth for M6. The claude.ai design doc it was exported from is superseded and no longer maintained; design changes are made here and logged in docs-v2/decisions.md.

**Revised 2026-11-21 (Force powers research; docs-v2/lore/batches/force-catalog-revision.md; D-338 to D-349).** Repo-only changes, not in the old claude.ai doc:
- **Lore source changed (D-338).** The Force powers now rest on the six research files `Docs/SWRPG lore/SW_Force_Powers_Part1a.md` to `_Part3b.md`, which replace the Force powers sections of `SW_Force_Abilities_Forms_v3_complete.md`. The v3 file is still the source for the lightsaber forms (§5k) until lore batch 10. Part3b is a catalog check of this file; its findings are applied below, each marked "(Part3b xN)" or with its ruling.
- **Lore batch 5 (D-358):** tradition powers mapped and added in §5l; flow-walking's outsider date amended.
- **Rulings applied:** the Force created Anakin (D-339, §5j); flow-walking cannot change the past (D-340, §5i); Tutaminis and Force Absorb merged (D-341, §5c); sides (D-342); drops, and Purification kept as a crafting technique (D-343, §5h); lore-locks (D-344); Force-meld by era (D-345, §5c); the new forbidden class (D-346, §2-3); scale (D-347); new entries (D-348); "ShatterSense" renamed shatterpoint perception (D-349).
- **Sources rule (D-338):** citations of *The Clone Wars* (2008) on Legends pages are accepted; only the 2014 *Lost Missions* material is excluded.
- **New keys for Claude Code:** aliases `ForceAbsorb` → Tutaminis, `Kinetite` → Electric Judgment, `TelekineticBarrage` → Ballistakinesis; rejected names `CreateForceWraith` and `ForceTravel` (beside `Shadowstrike`); talent key `ShatterSense` → `shatterpointPerception`. New entries: `AltusSopor`, `LifeDetection`, `SenseForce`, `Vongsense`, `SummonStorm`, the lightning tiers, and the NPC-only `SithNecromancy` and `DarkPlague`.

# SWRPG M6 — Force Ability Catalog Spec (draft for review)

Nov 20, 2026 · @Jared Wright

## 1. Summary

The catalog started from `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md`, which lists about 140 Force abilities in 13 families and 14 lightsaber forms. Since 2026-11-21 its Force powers rest on `SW_Force_Powers_Part1a.md` to `_Part3b.md` (D-338); the v3 file stays the source for the lightsaber forms until lore batch 10. Most entries already have a difficulty tier, alignment and prerequisites. What they lack are the M6 fields: costs, sustained or instant, free-use eligibility, learning class and alignment weight.

**Approach:**

1. Most numbers come from formulas keyed to the difficulty tier the lore file already gives (section 3). Only abilities the lore treats as special get hand-set overrides, so we tune a few dozen values rather than 140 sets.
2. We go one family at a time. Each family gets a table like the telekinesis draft in section 5, which you check before the next family starts.
3. Every entry is checked against Legends. Section 4 has the first audit pass and what was done about it.

The existing field list in `docs-v2/spec/force-catalog.md` stays. This spec adds to it.

The full check of the lore file against every Wookieepedia Legends Force power is in Wookieepedia audit.

## 2. Entry fields: the M6 additions

These fields join the existing list in `force-catalog.md` (id, family, parent, use tag, side, prerequisites, contest group, output, drills, synergy, availability). They tie each ability to the reserve and alignment specs.

| Field | Values | Feeds |
| --- | --- | --- |
| Difficulty tier | Basic 1.0, Moderate 1.5, Complex 2.5, Advanced 4.0 (already in the lore file) | Base cost, free-use threshold |
| Cost type | Instant, sustained, or ritual | How draw is charged |
| Scale applies | Yes or no. Yes for abilities whose effect size varies (lifting, pushing, healing a crowd) | Scale classes and feat gates |
| Free-use eligible | Yes or no. Never for abilities that always face resistance | Free uses |
| Learning class | Manifestation, taught but can manifest, ritual and lore-locked, or forbidden (D-346) | How it is acquired |
| Tradition lock | None, or the tradition that must teach it (Aing-Tii, Fallanassi, Sith, Je'daii) | Learning |
| Alignment tag | Neutral, light, or dark with a weight: lesser, standard or severe | Dark and Light gains, immersion |
| Corruption cost | Usually 0. Set for Sith alchemy and forbidden arts | Corruption |
| Override notes | Any hand-set value, with its lore citation | Review |

The old prose field "Force load" is replaced by the computed draw from these fields.

## 3. How the numbers are set

Every cost falls out of the difficulty tier and the cost type, using the reserve spec's draw formula. Effort, state, scale and efficiency then apply on top, as that spec describes.

**Rounds (look-over fix, 2026-11-21):** one combat round is one M5 exchange, about 5 to 10 seconds. Every "per round" cost in this catalog uses that unit.

| Cost type | Base cost | When it is charged |
| --- | --- | --- |
| Instant | 10 x tier (Basic 10, Moderate 15, Complex 25, Advanced 40) | Once per use |
| Sustained | 2 x tier per combat round, or per minute outside combat | Every round it is held. Also uses an upkeep slot |
| Ritual | 50 x tier, paid once | When cast, outside combat. Usually takes minutes to hours |

**Defaults by tier:**

| Tier | Free use at ability level | Default dark weight if dark-tagged | Default learning class |
| --- | --- | --- | --- |
| Basic 1.0 | 40 | Lesser | Manifestation |
| Moderate 1.5 | 60 | Lesser | Manifestation or taught (by family) |
| Complex 2.5 | Never | Standard | Taught, can manifest |
| Advanced 4.0 | Never | Severe | Taught, can manifest, or ritual |

**Overrides** are set by hand only where the lore makes an ability special. Examples:

- Force Choke is standard-weight dark, except a brief use to knock someone out (section 4).
- Force Valor's upkeep is one step cheaper than its tier (3 per round instead of 5), because it is usually held together with Force Speed. Its learning difficulty does not change.
- Thought Bomb and Transfer Essence are rituals with large Corruption costs.
- Shatterpoint keeps its own rules from D-63, including the 0.3 load per read, converted to draw.

This keeps the tuning to a short list of overrides and the six reserve-spec defaults, instead of 140 hand-made cost tables.

**Forbidden availability class (D-346, Jared 2026-11-21).** A power the Jedi Order forbids:
- A Knight can't learn it without a Master's permission. Masters may study it under controlled conditions.
- Learning it covertly risks the character's standing in the Order (M7 hook: Order reputation).
- Forbidden powers and their dates:
  - **Electric Judgment:** forbidden to Knights; controlled study by Masters from 990 BBY; used openly by the New Jedi Order.
  - **Deadly Sight:** forbidden.
  - **Morichro:** forbidden by 1000 BBY; Yaddle is the exception.
- The class sets who may learn the power. Its side, tier and costs are unchanged.

## 4. Audit findings (first pass)

This pass checked the entries I had doubts about. Every other entry still gets checked during its family's pass. All fixes below are now in the lore file and the questions file (2026-11-20).

**Corrections:**

| Entry | Lore file said | Fixed to | Status |
| --- | --- | --- | --- |
| Dark Transfer | Developed by Darth Plagueis, a compassionate use shown by Abeloth | An ancient Sith technique credited to Karness Muur, creator of the rakghoul plague. Muur's essence in the Muur Talisman used Celeste Morne to begin healing Darth Krayt, which taught Krayt the technique. Cade Skywalker manifested it instinctively ([Wookieepedia](https://starwars.fandom.com/wiki/Dark_transfer)). Learning class: taught, can manifest | Done |
| Battle Meld (questions file) | Not available in 3,661 BBY | Available in every era as rare. Added to the lore file as Force Meld. **Superseded by D-345:** rare in the Old Order (Jorus C'baoth), unavailable 19 BBY to 25 ABY, revived from 25 ABY (Anakin Solo redeveloped it; Part3b f6) | Done |

**Missing abilities:**

| Ability | Placement | Source | Status |
| --- | --- | --- | --- |
| Force Concealment (Force stealth) | Defense family | [Wookieepedia: Force stealth](https://starwars.fandom.com/wiki/Force_stealth) | Added |
| Morichro | Body family, after Hibernation Trance | [Wookieepedia: Morichro (Legends)](https://starwars.fandom.com/wiki/Morichro/Legends) | Added |
| Force Meld | Defense family, after Battle Meditation | [Wookieepedia: Force-meld](https://starwars.fandom.com/wiki/Force-meld) | Added |
| Dominate Mind | Mental family, under Mind Trick | [Wookieepedia: Mind trick (Legends), §Mind control](https://starwars.fandom.com/wiki/Mind_trick/Legends) (was cited to an Archivum mirror; Part3b b8). No standalone page | Added |
| Mask (Sith Alchemy) | Under Sith Alchemy | [Wookieepedia: Mask (Sith Alchemy)](<https://starwars.fandom.com/wiki/Mask_(Sith_Alchemy)>) (was cited to an Archivum mirror; Part3b b8). Created for the Wizards of the Coast roleplaying game by Gary M. Sarli | Added |

**Sourced after review:**

- **Dimension Shift** stays, but its entry was wrong. Per [Wookieepedia](https://starwars.fandom.com/wiki/Dimension_Shift), it makes an object vanish into another dimension or by compressing it, and the user recalls it later through a link. The lore file had described it as making the user intangible, with a Teleportation prerequisite. Corrected: Master Plett used it for hidden doors and cupboards on Belsavis, Leia learned it from Irek Ismaren, and Jorj Car'das showed it. The name is conjectural.
- **Force Camouflage and Force Cloak are one power.** Per [Wookieepedia](https://starwars.fandom.com/wiki/Force_cloak), Force camouflage is another name for Force cloak. The lore file's two entries are merged into one Force Cloak entry with two methods: bending light and sound, which also fools droids, or a mind trick that erases you from observers' minds, which does not. It hides the body only. Hiding your presence is Force Concealment. The questions file notes that any `ForceCamouflage` alias in code should point to Force Cloak.

**Checked and fine:** Sutta Chwituskak (the Sith name for Bolt of Hatred, ancient Sith sorcery), Art of the Small (Vergere, New Jedi Order era).

**Choke, Grip and Crush (resolved):**

- **Force Choke is dark-tagged.** It is purely offensive, so nearly every use is dark. The exception is a brief use to knock someone out, not to punish or kill, as Luke did twice. That use adds no Dark.
- **Force Grip and Force Crush are neutral.** They are applications of telekinesis with uses outside combat, and Jedi have used both without channeling the dark side. Harming a living being with them is judged as a deed.
- The lore file entry and the alignment spec are both updated to match.

## 5. Telekinesis family: draft

This is the first family worked through, as the pattern for the rest. Tiers and prerequisites come from the lore file. Cost type, free use, learning class and alignment weight are my proposals using the section 3 defaults.

| Ability | Tier | Cost type | Base cost | Scale | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Telekinesis | Basic (proposed, lore gives none) | Instant, or sustained to hold | 10, or 2 per round | Yes | Level 40, uncontested | Manifestation | Neutral |
| Force Push | Basic | Instant | 10 | Yes | Level 40, objects only | Manifestation | Neutral |
| Force Pull | Basic | Instant | 10 | Yes | Level 40, objects only | Manifestation | Neutral |
| Force Disarm | Basic | Instant | 10 | No | No, it targets someone | Manifestation | Neutral |
| Force Throw | Moderate | Instant | 15 | Yes | No, it targets someone | Manifestation | Neutral |
| Force Levitation | Moderate | Sustained | 3 per round | Yes | Level 60, self only | Manifestation | Neutral |
| Force Wave | Moderate | Instant | 15 | Yes | No | Taught, can manifest | Neutral |
| Force Blast | Moderate | Instant | 15 | Yes | No | Taught, can manifest | Neutral |
| Projected Fighting | Moderate | Instant | 15 | No | No | Taught | Neutral |
| Force Whirlwind | Complex | Sustained | 5 per round | Yes | No | Taught, can manifest | Neutral |
| Force Shockwave | Complex | Instant | 25 | Yes | No | Taught, can manifest | Neutral |
| Force Burst | Complex | Instant | 25 | Yes | No | Taught | Neutral |
| Force Wind | Complex | Sustained | 5 per round | Yes | No | Taught | Dark, standard (D-342: an ancient Sith technique) |
| Saber Throw | Complex | Instant | 25 | No | No | Taught, can manifest | Neutral |
| Ballistakinesis (was Telekinetic Barrage) | Complex | Instant | 25 | Yes | No | Lore-locked (Jensaarai tradition; D-344) | Neutral |
| Force Wound | Complex (raised from Moderate) | Instant | 25 | No | No | Taught, can manifest | Dark, standard |
| Force Choke | Complex | Sustained | 5 per round | No | No | Taught, can manifest | Dark, standard. None for a brief knockout |
| Force Grip | Complex | Sustained | 5 per round | Yes | No | Taught, can manifest | Neutral |
| Force Orb | Complex | Sustained | 5 per round | No | No | Taught | Neutral |
| Force Sphere | Complex | Sustained | 5 per round | No | No | Taught | Dark, standard (D-342; Darth Maul only) |
| Saber Barrier | Advanced | Sustained | 8 per round | No | No | Taught | Neutral |
| Telekinetic Lightsaber Combat | Advanced | Sustained | 8 per round | No | No | Taught | Neutral |
| Force Repulse | Advanced | Instant | 40 | Yes | No | Taught, can manifest | Neutral |
| Force Flight | Advanced | Sustained | 8 per round | Yes | No | Taught | Neutral |
| Combustion | Advanced | Instant | 40 | Yes | No | Taught | Neutral |
| Force Rend | Advanced | Instant | 40 | No | No | Taught | Dark, severe |
| Force Crush | Advanced | Instant | 40 | Yes | No | Taught | Neutral |
| Force Kill | Advanced | Instant | 40 | No | No | Taught | Dark, severe |

Rows are ordered by tier. **Progression check on Force Wound:** raising Wound to Complex keeps the dark line climbing: Telekinesis (Basic) → Wound (Complex) → Rend (Advanced). Its prerequisites (Telekinesis 21+; Rend needs Wound 30+) are unchanged, so nothing that depends on it breaks. Only Wound's learning cost rises, from Moderate to Complex.

**Notes:**

- Wound, Rend, Choke, Grip and Crush take their tiers from the lore file's combined entries. Only Telekinesis itself has no tier, so Basic is proposed.
- Choke as "can manifest" fits Legends: it can surface on its own in a moment of rage. Grip and Crush scale with the size of what is held or crushed.
- Push and Pull are only free against objects. Against a person they are contested by the avoidable group (D-192), so they always cost.
- Saber Barrier and Telekinetic Lightsaber Combat are "taught" only: precise, trained techniques that do not appear under stress.
- Lore check for this family: done in the 2026-11-21 revision. Force Orb has a Legends basis as a section of Telekinesis/Legends (Kit Fisto, Battle of Mon Calamari). Force Sphere is a dark side power (Darth Maul). Kinetite is not a telekinesis power: it is an application of Electric Judgment (§5c), energy packed into a ball of kinetic force (Part3b b3, c5, d9; D-342). The old `Kinetite` key resolves to Electric Judgment.
- **Ballistakinesis** (Part3b b10, f4; D-344) is the Legends name for the old "Telekinetic Barrage", a Jensaarai power. It is learned from the Jensaarai. The old `TelekineticBarrage` key resolves to Ballistakinesis.
- **Force Wind** is dark (D-342). Part 2a records it as neutral, but the Telekinesis page calls it an ancient Sith technique (Part3b c3).

## 5b. Body enhancement family: draft

The second family, drafted 2026-11-20 with the section 3 defaults. Every entry was checked against its Wookieepedia Legends page. Battlemind and Force Enrage live in other families but are included because they work with Valor and Force Body.

| Ability | Tier | Cost type | Base cost | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- |
| Force Jump | Basic | Instant | 10 | Level 40, normal effort | Manifestation | Neutral |
| Enhance Attribute | Basic | Instant burst | 10 | Level 55: free outside combat, half cost in combat | Manifestation | Neutral |
| Force Speed | Moderate | Sustained (short bursts are instant, 15) | 3 per round | Level 70: bursts free outside combat, half cost in combat | Manifestation | Neutral |
| Remove Fatigue | Moderate | Sustained | 3 per round, or per minute out of combat | Level 60 | Manifestation | Neutral |
| Breath Control | Moderate | Sustained, per minute | 3 | Level 60 | Taught | Neutral |
| Tapas | Moderate | Sustained, per minute | 3 | Level 60 | Taught | Neutral |
| Alchaka | Moderate | Training activity, no draw | 0, physical load instead | Not applicable | Taught | Neutral, light leaning |
| Control Pain | Complex | Sustained while injured | 5 per round | Never | Taught, can manifest | Neutral |
| Force Heal (Self) | Complex | Instant per healing use | 25, scaled by wound severity | Never | Taught, can manifest | Neutral (D-342; was Light) |
| Force Valor | Complex | Sustained | 3 per round (override) | Never | Taught | Light |
| Battlemind (Mental family) | Complex | Sustained | 5 per round | Never | Taught, can manifest | Neutral (correction below) |
| Force Enrage (Dark family) | Moderate | Sustained | 3 per round | Never | Can manifest | Dark, standard |
| Hibernation Trance | Complex | Entry cost, then no upkeep | 25 to enter | Never | Taught | Neutral |
| Force Sustenance | Complex | Daily | 25 per day, in place of food | Never | Taught | Neutral |
| Crucitorn | Advanced | Sustained | 8 per round | Never | Taught | Neutral |
| Force Body | Advanced | Sustained, builds a fatigue debt | 8 per round | Never | Taught | Neutral |
| Morichro | Advanced | Self: entry cost. Others: instant, contested by Willpower | 40 | Never | Lore-locked; forbidden from 1000 BBY, Yaddle the exception (D-346) | Light |
| Force Cloak | Advanced | Sustained, extremely taxing | 8 per round | Never | Taught, but extremely difficult without natural talent (natural talent lowers the cost) | Neutral |
| *Altus sopor* (new, D-348) | Basic | Sustained focus | 2 per round, or per minute out of combat | Level 40, outside combat | Taught (Initiates) | Neutral |

Longevity through the Force is passive and has no cost. No Legends page has that name (Part3b b11); its support is Plagueis halting his ageing through midi-chlorian manipulation and the Palawa trance stopping ageing.

**New entry: *altus sopor*** (D-348; Part1a §C3; Part3b a3). One of the three core Control techniques of *The Jedi Path*, taught to Initiates. It increases focus on the Force; developed further, the user "merges into the Force" and becomes invisible even to the most acute senses. The source does not say whether that is physical or only in the Force, so the deep use stays a story effect until a later pass.

**Revision notes (2026-11-21, Part3b):**
- **Force healing is neutral (D-342; Part3b c9, d6).** It used to be light, on the view that dark-side healing is Dark Transfer. Legends says the belief that dark users could not heal was wrong: Darth Sion and Darth Bane healed through the dark side, often at a terrible price. Healing itself is neutral. Healing by stealing another's vitality stays dark: Force drain (drain life), Dark Transfer and the death field.
- **Names (Part3b b12):** Force Heal (Self) and Force Heal (Others) are game names. Legends calls it Force healing, with Force Assist for others and *curato salva* for self-healing (already an alias).
- **Force Cloak (Part3b d12, f9):** "more of a natural talent, for it is extremely difficult to learn otherwise", and extremely taxing to hold. Era: found mainly among the Jedi before the Empire; that knowledge was lost; the Disciples of Twilight perfected it (c. 900 BBY onward).
- **Morichro (Part3b f10; D-346):** known by 24,500 BBY, unchecked until about 5000 BBY, forbidden to Knights by 1000 BBY, revived by Yaddle. Legends doesn't say its status in 3,661 BBY, so the game treats it as lore-locked then and forbidden from 1000 BBY.
- **Crucitorn (Part3b c17):** Wookieepedia files it Alter + Mind; the Sith put it in the Mind school. It stays in this family for its body effect.

**Combat boosts are never free in a fight (agreed 2026-11-20).** Enhance Attribute and Force Speed bursts get a mastery price cut instead: at level 55 (Enhance Attribute) and level 70 (Force Speed), they cost half in combat and nothing outside it. Using them stays a choice in a duel, but a cheap one for a master. Force Jump keeps its normal free use at level 40, because it is movement rather than combat power.

**How the sustained boosts stack in a fight.** A Knight running Valor (3), Force Speed (3) and Remove Fatigue (3) pays 9 per round before efficiency, about 3.6 after. That is inside his usual draw rate, so long fights are sustainable, as agreed. Adding Battlemind and Force Body takes him past his upkeep slots and into real strain.

**Corrections found against Wookieepedia (all applied to the lore file 2026-11-20). Also decided: Force Heal (Self) stays light side, since dark-side healing is Dark Transfer (superseded by D-342: neutral); Morichro is classed light side; the entry-fee and daily cost models are accepted:**

| Entry | Lore file says | Wookieepedia (Legends) says | Proposed fix |
| --- | --- | --- | --- |
| Battlemind | Light side | A Control power; Darth Maul used it, and Mace Windu combined it with dark side power for Vaapad | Make it neutral. Force Valor keeps it as a prerequisite |
| Alchaka | An Old Republic era Jedi practice | Developed by early Je'daii Masters at the Stav Kesh academy on Tython; an advanced form of moving meditation | Fix the origin. Available in every era from the Je'daii onward |
| Tapas | Regulates temperature both ways; Luke and Obi-Wan used it | Keeping warm in the cold, including vacuum; Jacen Solo used it at Ebaq 9 | Keep warmth only, or mark cooling as unsourced. Replace the examples with Jacen |
| Breath Control | Allows survival in vacuum for short periods | Lets the user go without breathing for hours or even days, but does not stop anything entering or leaving the lungs; vacuum may need a Force barrier as well | Remove the vacuum claim, or require a Force barrier for it |
| Control Pain | Pain suppression only | Also negates the effect of a stun blast | Add stun negation |
| Crucitorn | No school noted | The Sith classed it in the Mind school; Darth Bane wrote about it in the Book of Sith | Add as a note |
| Force Body | General description | First appeared in Knights of the Old Republic II; called Noble Sacrifice and Consumption in The Old Republic, and Prolong Force in the roleplaying game | Add as aliases |
| Force Speed | Speed only | Also called burst of speed, Force sprint or Force reflex; the user perceives the world in slow motion | Already merged with reflexes; add the aliases |

## 5c. Defense family: draft

The third family, drafted 2026-11-20 and checked against Wookieepedia Legends. These are the counters that keep Force-heavy duels balanced. Most are reactive (charged when an attack comes in) or sustained.

| Ability | Tier | Cost type | Base cost | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- |
| Force Barrier | Basic | Sustained | 2 per round | Outside combat only, level 40 | Manifestation | Neutral |
| Thought Shield | Basic | Passive once trained | 0 from level 40; 2 per round before that | Level 40 (becomes second nature) | Taught | Neutral |
| Force-flash | Basic | Instant | 10 | Level 40, fuzzing a holocam only (the blinding flash is never free) | Taught | Neutral |
| Force Resistance | Moderate | Passive, plus an active aura | Passive free; aura 3 per round | Passive always | Taught | Neutral |
| Energy Resistance | Moderate | Sustained | 3 per round | Never | Taught | Light leaning |
| Tutaminis (absorbs Force Absorb, D-341) | Basic; tiers by level: ordinary energy, then lightning, then catching a lightsaber blade | Reactive, per absorbed attack | 10, scaled by the attack's size | Never | Taught | Light |
| Force Deflection | Complex | Reactive, per deflection | 25, scaled by the attack's size | Never | Taught | Neutral |
| Protection Bubble | Complex | Sustained; must be still to cast | 5 per round | Never | Taught | Neutral |
| Force Concealment | Complex | Sustained, per minute | 5 | Override: free from level 61 outside combat, half cost in combat | Taught | Neutral |
| Force Clouding | Complex | Sustained, per minute | 5 | Same override as Concealment | Lore-locked (Sith) | Dark, lesser |
| Force Scattering | Complex | Sustained, per minute | 5 | Never | Taught | Neutral |
| Force Suppression | Complex | Sustained, contested by Willpower and Force Resistance | 5 per round | Never | Taught | Neutral |
| Force Meld | Complex | Sustained (reserve spec rules) | Anchor 5 per round, each member 1 | Never | Taught; rare in the Old Order, unavailable 19 BBY to 25 ABY, revived from 25 ABY (D-345) | Light leaning |
| Force Breach | Advanced (proposed up from Complex) | Instant, contested | 40 | Never | Taught | Neutral |
| False Light Side Aura | Advanced | Ritual | 200, lasts until broken | Never | Lore-locked (Sith) | Dark, lesser |
| Sever Force | Advanced | Instant, contested | 40 | Never | Taught (rare) | Light (correction below) |
| Battle Meditation | Advanced | Sustained; scale class sets the cost for squads, armies and fleets | 8 per round | Never | Taught | Neutral (D-342; Sith battle meditation's domination is a dark deed) |
| Electric Judgment (with kinetite as an application) | Advanced | Instant, or sustained as a stream | 40, or 8 per round | Never | Forbidden: Knights need a Master's permission; controlled study by Masters from 990 BBY; open in the New Jedi Order (D-346) | Light |
| Wall of Light | Advanced | Group effort; every participant pays | 8 per round each, needs several Jedi | Never | Taught | Light |

**Answering an energy attack (agreed 2026-11-20; one power since D-341).** Tutaminis gives three choices when an energy or Force attack comes in, each paying the reactive cost:

1. **Absorb:** the pool refills by a share of what the attacker spent: 0.5 at base, rising with ability level to 0.8 at mastery, capped at the absorber's own draw.
2. **Redirect:** forgo absorption and send the attack back at the attacker. No pool gain. (Yoda absorbed Dooku's lightning in 22 BBY.)
3. **Release:** discharge absorbed energy as an outward burst. Absorbing more than the user can hold at once forces a release whether they want it or not. The old example, Yoda against Palpatine in the Senate, was not found on the Tutaminis page (Part3b d11), so the release is a design rule without a named Legends example.

**Tutaminis and Force Absorb are one power (D-341; Part3b b1, c15).** "Force absorb" redirects to Tutaminis on Wookieepedia. Tutaminis was taught in the very first classes at Jedi academies, so its base tier is Basic. What it can take grows with level (design defaults for the tier gates):
- **Ordinary energy** (blaster fire, heat, sound) from the start. Luke shielded himself from an AT-AT's fire (10 ABY).
- **Lightning** from level 41.
- **Catching a lightsaber blade** from level 61. Nejaa Halcyon and Satele Shan caught blades bare-handed.

The old `ForceAbsorb` key resolves to Tutaminis. It is filed light side; Legends also records Sith users (a Kel Dor Sith Lord turning blaster fire into lightning; Lost Tribe Sith), so a Sith can learn it (Part3b c6).

**Revision notes (2026-11-21, Part3b):**
- **Force-flash (Part3b d4, e4; D-347)** has two uses under one name: fuzzing a holocam, and a blinding flash of light. Abeloth's flash affected ships' visuals across the whole Exodo system; that system scale is Abeloth's alone, never a player scale.
- **Battle meditation (Part3b c1; D-342)** is neutral. Sith battle meditation (Skere Kaan, Nial Declann, Palpatine, Caedus) dominates its subjects, and that domination is a dark deed.
- **Electric Judgment (Part3b f7; D-346)** is in the forbidden class: prohibited to Jedi Knights (on Sabla-Mandibu's forbidden list), studied by Masters under controlled conditions from at least 990 BBY, "uncommon and controversial", and used openly by the New Jedi Order. Kinetite, energy packed into a ball of kinetic force, is one of its applications (Part3b b3).
- **Force-meld (Part3b f6; D-345):** ancient use on Columus (Awdrysta Pina) and rare use in the Old Order (Jorus C'baoth). It is unavailable from 19 BBY to 25 ABY. Anakin Solo redeveloped it for the New Jedi Order during the Yuuzhan Vong War.
- **Force resistance and hibernation trance** stay neutral (D-342), although Wookieepedia files both light side (Part3b c7).

**Corrections found against Wookieepedia (all applied to the lore file 2026-11-20, including the Tutaminis, Force Absorb and Force Breach tier changes and the Concealment free-use exception):**

| Entry | Lore file says | Wookieepedia (Legends) says | Proposed fix |
| --- | --- | --- | --- |
| Sever Force | Permanent and irreversible; dark if offensive | A non-lethal light side power that blocks the target's connection with a wall of light side energy. Odan-Urr called it the most powerful attack a Jedi could perform. Usually lasting, but not always permanent | Make it light side and usually lasting rather than always permanent. Destroying midi-chlorians (Plagueis) is a different method |
| Tutaminis | Advanced | Taught in the very first classes at Jedi academies; the basics are mastered by graduation, and it develops over a lifetime | Lower to Complex. Force Absorb becomes the advanced application (superseded by D-341: one power, base tier Basic) |
| Battle Meditation | The user is immobile, a strategic anchor and not a combatant | Also effective in small skirmishes and duels, not only armies and fleets. Also called Enhanced Coordination | Large scale needs stillness; small scale can be used in a fight |
| Electric Judgment | Stuns and incapacitates rather than kills | Bolts of variable intensity; also called Emerald Lightning; once forbidden by the Order; Plo Koon, Luke Skywalker and Jacen Solo used it | Variable intensity, set by effort; add the alias and users |
| Force Resistance | General resistance | At novice level it is Force resistance; mastered, it becomes Force immunity, which can render some powers inert. Jedi Sentinels specialize in it | Add Force immunity at high levels |
| Force Barrier | Personal field | Also called Force shield, Force of Will or Force defense; can protect the user, a friend or even a foe; holds only a few attacks before collapsing, depending on strength | Add aliases and use on others |
| Protection Bubble | Shell around several people | The user must be still to cast it and sometimes to hold it; it can be cast around an attacker to trap them in their own attack | Add the stillness rule and the trap use |
| Force Breach | Tearing through a barrier | Advanced mastery of Force Suppression in the Old Sith Wars era; later the name was also used for rupturing shatterpoints | Note it as the advanced form of Suppression |

**Questions:**

All four questions resolved on 2026-11-20: tier changes, absorb share (0.5 rising to 0.8), the Concealment and Clouding exception, and the corrections are all approved.

## 5d. Sensory family: draft

The fourth family, drafted 2026-11-20 and checked against Wookieepedia Legends. For sensory abilities, **scale class measures distance instead of size**: across a room, a city, a planet, a system, the galaxy.

| Ability | Tier | Cost type | Base cost | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- |
| Force Sense | Foundational | Passive; active reaching out is instant | 0 passive; 10 active, scaled by distance | Passive always; active at level 40, short range | Manifestation | Neutral |
| Life Detection (*prima vitae*; new, D-348) | Basic | Passive within about 10 m; active reaching out is instant, scaled by distance | 0 passive; 10 active | Passive always; active at level 40, short range | Manifestation (taught to Padawans) | Neutral |
| Sense Force (*tactus otium*; new, D-348) | Basic | Instant | 10 | Level 40 | Manifestation (taught to Padawans) | Neutral |
| Force Empathy | Basic | Instant | 10 | Level 40, surface emotions only. Reading guarded feelings is contested by Thought Shield | Manifestation | Neutral |
| Force Sight | Basic (proposed down from Moderate) | Sustained | 2 per round | Level 40, outside combat | Manifestation | Neutral |
| Telepathy | Moderate | Instant per message, scaled by distance | 15 | Level 60, short range with a willing or familiar mind | Taught, can manifest | Neutral |
| Sense Force Potential | Moderate | Instant | 15 | Level 60 | Taught | Neutral |
| Precognition | Complex | Sustained in combat (precognitive defense) | 5 per round | Never in combat | Taught, can manifest | Neutral |
| Farsight | Complex | Instant, needs meditation; scaled by distance | 25 | Never | Taught, can manifest | Neutral |
| Psychometry | Complex | Instant | 25 | Never | Taught, can manifest | Neutral; reading a dark object risks taint |
| Instinctive Astrogation | Complex | Instant per hyperspace jump | 25 | Never | Manifestation | Neutral |
| Technometry | Complex | Instant to read, sustained to control | 25, or 5 per round | Never | Taught | Neutral |
| Battle Precognition | Advanced | Sustained in combat | 8 per round | Never | Taught | Neutral |
| Fighting-sight (Aing-Tii) | Advanced | Sustained in combat | 8 per round | Never | Tradition-locked | Neutral |
| Vongsense (new, D-348) | Complex | Sustained while reaching out | 5 per round | Never | Manifestation, usually after a physical or mental bond with Yuuzhan Vong biotechnology; from 25 ABY | Neutral |
| Force Vision | Advanced | Deliberate attempt: meditation, cost plus a check. Involuntary visions: story events, no cost | 40 per attempt | Never | Can manifest | Neutral |
| Shatterpoint | Advanced | Instant per read, × depth (combat ×1 up to event ×5), plus fixed focus strain (+0.05 to +0.25). Replaces the old 0.3 load; D-63 otherwise unchanged | 40 | Never | Taught, or innate (shatterpoint perception) | Neutral |

**Force Vision is mostly a story tool.** Wookieepedia calls visions extremely rare and uncontrollable: many meditate for one and few succeed. Involuntary visions are triggered by the engine and the AI as events, at no cost. Deliberate attempts cost pool and usually fail. The Skywalker line is noted as especially prone, which could be an innate talent that raises the chance.

**Revision notes (2026-11-21, Part3b):**
- **New core Sense techniques (D-348; Part3b a1, a2; Part1b §S2, §S3).** Life Detection (*prima vitae*) finds living beings at long range, tells friend from foe and whether a newcomer can use the Force; it works subconsciously within about 10 m. Life Sense (a specific target's presence and condition) and Life web (large groups of one species, 100,000 or more) are applications. Sense Force (*tactus otium*) senses the ambient Force in a place, person or object and whether it is light or dark, and warns of dark-side sites. Both are taught to Padawans.
- **Vongsense (D-348; Part3b a8; Part3a §T5)** is the only way to sense the Yuuzhan Vong, who are otherwise invisible in the Force. From 25 ABY. Anakin Solo found it after attuning a lambent crystal; Tahiri Veila and Jacen Solo after their ordeals. Some Jedi must drop their usual connection to the Force to use it. Not a dark act.
- **Shatterpoint perception (D-349)** is the new name for the innate talent formerly called "ShatterSense" (Part3b b9: a game label). "Vision-prone" is also a game label, echoing a phrase used of Sidious, not a named Legends talent.
- **Psychometry names (Part3b b4).** "Force Echo" and "Force Memory" have no Legends page; on Wookieepedia "echo in the Force" means a Wound in the Force, a mass-death disturbance. The old keys still resolve to Psychometry, but the narrator doesn't use those names for object reading.
- **Distance classes (Part3b e6).** Galaxy-wide sensing in Legends is recorded only for mass-death disturbances (Order 66, Alderaan) and close bonds. No one senses deliberately across the galaxy, so the galaxy class is reserved for those two cases.

**Corrections found against Wookieepedia (applied 2026-11-20; scale-as-distance, the Psychometry merge, the Force Vision model and the Vision-prone talent are agreed):**

| Entry | Lore file says | Wookieepedia (Legends) says | Proposed fix |
| --- | --- | --- | --- |
| Postcognition | Its own name | The page is "Psychometry", also called postcognition, tai vordrax or telemetry. Easier on personal objects used often; reading an object used for dark deeds can taint the user; sometimes the user's eyes glow | Rename to Psychometry, add the taint rule |
| Force Memory / Force Echo (Knowledge family) | A separate entry | The audit matched it to the same Psychometry page | Merge into Psychometry |
| Force Sight | Moderate | A basic ability, a variation of Force sense; sees in darkness and through walls; trained users can counter Force persuasion and Force blinding; the Miraluka rely on it constantly | Lower to Basic; add the counters and the Miraluka note |
| Fighting-sight | Accessible from about 40 BBY | An Aing-Tii technique that first appears in Legacy of the Force: Invincible; Jysella Horn shows it in Fate of the Jedi | Fix the era: available once contact with the Aing-Tii exists (New Republic era onward). 40 BBY looks like a typo for 40 ABY |
| Force Empathy | Reads emotions | Adept users can pick up motivations, hidden feelings and even deeply guarded secrets; Anakin discovered it at 17 on Romin | Add the depth by level |
| Precognition | Combat foresight | Also covers guiding premonitions and warnings, and the Sith use it too | Add a note |
| Force Vision | Meditation visions | The cornerstone of the Unifying Force; occur in some Padawans' Trial of the Spirit; the Skywalker line is especially prone | Add notes |

**Questions:**

All questions resolved on 2026-11-20, including the new Shatterpoint cost: base 40 divided by efficiency, multiplied by read depth, plus a fixed focus strain per read.

## 5e. Dark side family: draft

The fifth family, drafted 2026-11-20 and checked against Wookieepedia Legends. Every entry here is dark-tagged, so each use also adds Dark and immersion by its weight (alignment spec, section 3). None are free-use: they are almost all contested attacks.

| Ability | Tier | Cost type | Base cost | Learning class | Dark weight |
| --- | --- | --- | --- | --- | --- |
| Force Shock | Basic | Instant | 10 | Taught, can manifest | Lesser |
| Force Enrage | Moderate | Sustained | 3 per round | Can manifest | Standard |
| Hatred | Moderate | Instant; can be triggered involuntarily | 15 | Can manifest | Standard |
| Force Lightning | Complex (lore gives none) | Instant, or sustained as a stream | 25, or 5 per round | Taught, can manifest | Standard |
| Chain Lightning | Complex | Instant; scale counts targets | 25 | Taught | Standard |
| Lightning tiers: Force Tempest, Sith barrage, Lightning Shield, Lightning Grenade (Bomb), Sith Seeker, Lightning Burst (D-348; replaces "Other lightning variants") | Complex | Instant (Lightning Shield sustained, 5 per round) | 25 | Taught, as tiers of Force Lightning | Standard |
| Force Drain | Complex | Instant, or sustained | 25, or 5 per round | Taught | Standard |
| Force Scream | Complex | Instant; usually involuntary | 25 | Can manifest | Standard |
| Waves of Darkness | Complex | Sustained | 5 per round | Lore-locked (Sith sorcery) | Standard |
| Dark Energy Trap | Complex | Instant per trap placed | 25 | Lore-locked (Sith sorcery) | Standard |
| Corruption | Complex | Instant | 25 | Taught | Standard |
| Cryokinesis | Complex | Instant | 25 | Taught | Standard |
| Force Storm (Lightning) | Advanced | Sustained; a radius around the user (D-347; fleet scale belongs to Force Storm (Wormhole)) | 8 per round | Taught | Severe |
| Force Maelstrom | Advanced | Sustained | 8 per round | Taught | Severe |
| Force Destruction | Advanced | Instant after a charge-up round | 40 | Taught | Severe |
| Deadly Sight | Advanced | Sustained gaze; hits everyone in view | 8 per round | Forbidden (D-346) | Severe |
| Crush Opposition | Advanced | Sustained | 8 per round | Taught | Standard |
| Heart Stun | Advanced | Instant, contested | 40 | Taught | Standard |
| Consume Essence | Advanced | Sustained | 8 per round | Taught | Standard |
| Sutta Chwituskak | Advanced | Instant | 40 | Lore-locked (Sith sorcery) | Standard |
| Darkshear | Advanced | Instant, or sustained burst | 40, or 8 per round | Lore-locked (Sorcerers of Rhand) | Severe |
| Darksight (corrected below) | Advanced | Meditation | 40 per reading | Lore-locked: mainly the Sorcerers of Rhand and the Nightsisters, rarely others (D-344) | Standard |
| Possession | Advanced | Ritual to seize, then sustained | 200, then 8 per round | Lore-locked | Severe |

**Dropped (D-343):** Create Force Wraith. Its details come only from unlicensed *Polyhedron* articles that Wookieepedia keeps in Behind the Scenes (Part3b b6). Force Wraiths may still appear in a story as Sith-aligned spirits; no one learns to make them. The old key is a rejected name.

**Revision notes (2026-11-21, Part3b):**
- **Lightning tiers (D-348; Part3b a18; Part2b §D).** The named variants become tiers of Force Lightning, each needing Force Lightning first: Force Tempest (lightning from all limbs in a whirlwind), Sith barrage (a bolt rising from the ground), Lightning Shield (a sheath of lightning that shocks nearby foes and can let the user float), Lightning Grenade or Bomb (a gripped target charged until it explodes, killing bystanders too), Sith Seeker (a push, then an uncontrolled expanding ball of lightning) and Lightning Burst (arcs to adjacent enemies). Force shock, chain lightning and Force storm (lightning) keep their own rows. Vader's storm-called variant stays a note (fighting-game source).
- **Force Storm (Lightning) (D-347; Part3b e2)** hits every foe within a radius around the user (KotOR). No fleet-scale feat is recorded; the fleet-wrecking storms are Force Storm (Wormhole), §5i.
- **Darksight (D-344; Part3b f3):** the page names "other names by other Force users", so it is mainly a Rhandite and Nightsister art, learnable rarely by others.
- **Deadly Sight (D-346; Part3b f8):** forbidden to Knights; "extremely rare" until its use exploded in the late New Sith Wars.
- **Two versions in Legends, kept as the catalog has them (Part3b c13, c14):** Force Lightning (the Je'daii used it openly; strong-willed Jedi could learn it; most Councils forbade it) and Force Drain (New Jedi Order members were permitted to use it in the Disciples of Ragnos crisis, 14 ABY) stay dark. Force Destruction stays severe dark, although Kyle Katarn and Mara Jade are listed users. The narrator may describe these exceptions; a light-side user still takes the dark weight.
- **NPC and story powers (D-348; Part3b a15, a16).** Not learnable by the player; held by NPCs and used as story events:
  - **Sith necromancy** (*Tsaiwinokka Hoyakut*): Sith alchemy and incantation to reanimate the dead. Graush raised armies of Korriban zombies; Sorzus Syn kept a copy. Before 6900 BBY. Severe dark.
  - **Dark Plague:** a Force-influenced disease that drives Jedi mad and makes them puppets ("the darkness is coming"). Terrak Morrhage made it; Lord Vivicar revived it in the Cold War (SWTOR, the game's era). Severe dark.

**Two mechanics from the sources:**

- **Drain Force refills the pool.** Wookieepedia describes Force drain as a spectrum: drain life heals the user from a victim's vitality, and drain Force restores the user's Force energy from the victim's. Proposal: drain Force refills the pool by the same share as absorbing (0.5 rising to 0.8 with mastery). Consume Essence does the same from the death and anger around the user, as Maul did after Qui-Gon fell. These are the everyday dark-side versions of outside power.
- **Involuntary dark powers.** Force Scream and Hatred often happen without the user choosing. Proposal: the engine can trigger them at high strain, in a rage state, or in a lost fight, if the character knows them or has a high enough Dark score. They count as dark deeds.

**Corrections found against Wookieepedia (applied 2026-11-20, along with both mechanics and the Deadly Sight era rule):**

| Entry | Lore file says | Wookieepedia (Legends) says | Proposed fix |
| --- | --- | --- | --- |
| Darksight | Seeing by the dark side: in darkness, sensing nexuses and Sith artifacts | The Sorcerers of Rhand's name (the Nightsisters call it Heartshadow) for foreseeing possible futures and manipulating events to bring about the one that serves the Dark. Cronal learned it from the Rhandites | Rewrite completely as dark-side foresight and manipulation, lore-locked (D-344: mainly Rhand and the Nightsisters, rarely others) |
| Sutta Chwituskak | An ancient power of unknown mechanism, perhaps domination | The formal Sith name ("Flung Spears") for the Bolt of Hatred, an ancient sorcery. First appeared in The Freedon Nadd Uprising | Rewrite as the Bolt of Hatred, a projected bolt of dark sorcery |
| Dark Energy Trap | Triggers on contact for damage or mental disruption | Concentrated dark-side power, a faint purple shimmer, that immobilizes a skilled Force user for a time and can hold an unskilled one indefinitely. Tyranus used them on Korriban | Rewrite as an immobilizing trap |
| Darkshear | A blade of compressed darkness that bypasses defenses | A Rhandite power: a spear of the Dark that inflicts years of atrophy at once. Armor rusts, power cells drain, a person can age thirty years; bacta or prosthetics may be needed | Rewrite the effect; lore-lock to the Sorcerers of Rhand |
| Deadly Sight | Extremely rare | Projects fury through a glare that blisters skin and vaporizes extremities, hurting everyone in view, allies included. Rare once, but its use exploded in the last decades of the New Sith Wars; forbidden to Jedi Knights | Add the hits-everyone rule and the era note; consider lowering the prerequisites for that era |
| Waves of Darkness | An aura of dread | Sith sorcery: palpable waves of darkness with thunderous noise, causing despair and confusion and compelling those held long enough to flee. Queen Amanoa (Onderon, about 4,000 BBY) and Tyranus used it | Add Sith Sorcery as a prerequisite; add the flee effect |
| Force Drain | One power | A spectrum: drain life (dark healing) and drain Force (restoring Force energy), scaling in area with mastery | Split the two uses in the notes |
| Force Lightning | No tier | Branches into many forks to hit several foes; can be delivered by touch | Set Complex; add the notes |
| Force Enrage | Dark rage | Very few Jedi used it without falling; Jaden Korr did, and Luke used dark rage against Caedus | Add the notes |

**Questions:**

All four questions approved on 2026-11-20.

## 5f. Mental and social family: draft

The sixth family, drafted 2026-11-20 and checked against Wookieepedia Legends (mostly the Mind trick page, which holds persuasion, confusion, fear, control, corrupt, Mind Twist, illusion and projection as sections). Nearly every entry is contested against the target's Willpower, so only Comprehend Speech gets free use.

| Ability | Tier | Cost type | Base cost | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- |
| Mind Trick | Basic | Instant, contested | 10 | No (contested) | Taught, can manifest | Neutral (personal gain judged) |
| Comprehend Speech | Basic | Instant per conversation | 10 | Level 40 | Taught, can manifest | Neutral |
| Force Persuasion | Complex | Instant, contested; scale = distance | 25 | No | Taught | Neutral |
| Force Confusion | Complex | Instant, contested | 25 | No | Taught | Neutral (turning someone on their side is judged) |
| Force Fear | Complex | Instant, contested | 25 | No | Taught, can manifest | Dark, standard (a scare to defuse: lesser) |
| Mind Probe (absorbs Drain Knowledge) | Complex (was Advanced) | Instant per probe | 25 | No | Taught | Dark, standard |
| Memory Walk | Complex | Sustained | 5 per round | No | Taught | Dark, standard |
| Mind Shard | Complex | Instant, contested | 25 | No | Taught | Neutral (was Dark) |
| Neural Storm | Complex | Instant, contested | 25 | No | Taught | Neutral |
| Battlemind | Complex | Sustained | 5 per round | No | Taught | Neutral |
| Force Horror | Advanced | Instant; scale counts targets | 40 | No | Taught | Dark, standard |
| Force Insanity | Advanced | Instant; scale counts targets | 40 | No | Taught | Dark, severe |
| Mind Control | Advanced | Sustained; scale counts targets | 8 per round | No | Taught | Dark, standard |
| Force Corrupt | Advanced | Sustained; scale counts targets | 8 per round | No | Taught | Dark, standard |
| Mind Twist | Advanced | Instant, contested | 40 | No | Taught (Daegen Lok's technique) | Dark, standard |
| Force Illusion | Advanced | Sustained; scale = range (interstellar only at the top tier and amplified, D-347) | 8 per round | No | Taught | Neutral |
| Dopplegänger (was Force Projection) | Advanced | Sustained | 8 per round | No | Taught | Neutral |
| Memory Rub | Advanced | Instant, contested | 40 | No | Lore-locked (Sith sorcery) | Dark, standard (D-342; was Neutral) |
| Theran Force-listening | Advanced | Meditation | 40 per session | No | Taught by the Therans (anyone they teach can learn it; D-344) | Neutral |

**Resistance.** Wookieepedia names species that resist mind tricks: Hutts, Toydarians, Falleen, Geonosians, Dashade, Yinchorri and Kloodavians. Nikto are unusually easy to trick. A cybernetic brain blocks it (Lobot), and so does a target who knows the trick is coming. Resistance raises the contest rather than making it impossible: Revan persuaded a Hutt, Luke couldn't.

**Illusions.** A Force illusion hits every sense, even cameras and cybernetic eyes, but barely touches Force users, Hutts or the Yuuzhan Vong. It can't make something vanish: that takes Fallanassi Force immersion, not Force Cloak (Part3b d5).

**Illusion range (D-347; Part3b e3).** Up to thousands of kilometres normally, tiring at extreme range. Interstellar illusions exist only at the top tier and only when amplified: Naga Sadow projected war beasts onto the battlefields of Koros Major, Coruscant and other worlds from his meditation sphere (5000 BBY), and the Fallanassi's group illusion of a fleet turned the Battle of N'zoth (17 ABY).

**Revision notes (2026-11-21, Part3b):**
- **Memory Rub (D-342; Part3b c4)** is dark: Part 2b files it as an application of Sith sorcery, and the stand-alone Wookieepedia page is Canon. It needs Sith Sorcery.
- **Theran Force-listening (D-344; Part3b f2)** is learnable from the Therans. Qui-Gon Jinn and Obi-Wan Kenobi used it; Jacen learned it from the Therans after the Yuuzhan Vong War; Jaina used it.
- **Force Whisper (Part3b b5).** The name redirects to Mind trick/Legends, not Telepathy. The 2026-11-20 merge into Telepathy stands, because the old entry described telepathic messaging, but the narrator doesn't use "Force whisper" as a name for telepathy. Masquerade, an illusion laid over the user's own face, is an application, not a separate power. The dark version is mindforms: Sith sorcery illusions (Naga Sadow, Aleema Keto, Nightsister illusion spells) that can wound a victim who believes in them. Mindforms need Sith Sorcery.

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Drain Knowledge | Merged into Mind Probe; old key `DrainKnowledge` resolves there | Wookieepedia: "the mind probe, also known as Drain Knowledge". The current entry (victim permanently loses the knowledge) has no source |
| Mind Probe | Tier Advanced → Complex; drop the "Sith Inquisitors" note; add users (Revan, Kreia, the Sith Emperor on Revan, Tyranus, Sidious, Vader, Jerec, Joruus C'baoth) | A common Sith interrogation tool, not a rare art. Revan also pushed Basic into The One's mind, so knowledge can go both ways |
| Force Projection | Renamed Dopplegänger (aliases Similfuturus, Force shadow, Force projection). Rewritten: a short-lived duplicate of the user or an object, seen by everyone and by droid sensors, which can absorb one attack and fades if the user is hurt | The Legends power is Darth Ramage's apparition (Jax Pavan learned it from his holocron), not a purely mental image. Users: Plagueis, Tyranus, Luke, Xesh |
| Force Phantom (knowledge family) | Rewritten as the Sith ritual: lifelike, physical apparitions built from another creature's siphoned life force and projected across space; the anchor creature dies when its phantom is destroyed. Dark, severe; lore-locked (Darth Vectivus, rediscovered by Lumiya and Alema Rar); needs Sith Sorcery. Ritual 200, then 8 per round | The current entry describes a Dopplegänger and cites Crait, which is Disney canon |
| Force Illusion | Prerequisite Force Projection removed (Mind Trick 41+ only); Dopplegänger now requires Force Illusion 21+; add the range note (up to thousands of kilometres, tiring at extreme range; interstellar only at the top tier and amplified, D-347) | Wookieepedia calls projection "possibly a variation of Force illusion", so the order was backwards |
| Force Horror, Force Insanity | Both become area powers that hit several enemies; Insanity reaches further. Horror: catatonic panic. Insanity: frenzied madness | The current entries describe single-target attacks |
| Force Fear | Notes: dark by default, but a scare used to defuse a fight (Luke scaring off animals on Coruscant) takes lesser weight | Wookieepedia: classified dark because fear is a dark emotion, "but it was the intent behind its use that counted" |
| Mind Control | Replace "permanent mental damage" with a game rule: harm to the victim grows with how long they are held. Add Onimi controlling Shimrra | The permanent-damage line has no source |
| Memory Walk | Remove the Fallanassi "Blood Trail" line; add Rokur Gepta (who discovered it), Githany (taught by her Jedi Master, used it to restore Bane's hold on the dark side), Zannah, Cade vs Maladi, Wyyrlok vs Krayt; hours of it can kill over weeks | Blood Trail has no source |
| Mind Shard | Prerequisite Mind Probe 21+ → Telepathy 21+; drop the Dark Side requirement and "permanent damage" note; effect: pain that can break the target's hold on a Force power | Wookieepedia doesn't call it dark. Kyp Durron used a psychic blast like it; Bane recommended it to Sith |
| Comprehend Speech | Prerequisite becomes Telepathy 15+; notes: understand, not speak; fails on cultures that refuse contact (Tusken Raiders); easier when the speaker is Force-sensitive. The Nightsister version, the Spell of Interpretation, lets the caster speak the language too | Wookieepedia calls it "possibly an extension of the Telepathy power" |
| Mind Trick | Update the resistant species list and the cybernetic brain rule above; worry or distraction makes it fail | Wookieepedia |

**Questions:**

1. Force Fear: dark by default, lesser weight when used only to defuse. Agree?
2. Mind Probe down to Complex, since so many Sith used it?
3. Mind Shard neutral, judged by the deed like any attack, since nothing calls it dark?
4. Memory Walk: Gepta found victims were slightly sharper after a short session. Keep that as a rare side effect (a small Intelligence gain after recovery), or leave it as flavour?

All four questions approved on 2026-11-20. Memory Walk's Intelligence gain after recovery is a game rule. New aliases for Claude Code: `DrainKnowledge` → Mind Probe, `ForceProjection` → Dopplegänger.

## 5g. Healing and light side families: draft

The seventh and eighth families, drafted 2026-11-20 and checked against Wookieepedia Legends, including its Force healing category. Force Heal (Self) was settled in the body pass. Meditation costs use 10 × tier per session, like Darksight.

| Ability | Tier | Cost type | Base cost | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- |
| Detoxify Poison | Moderate | Meditation | 15 per session | Level 60 | Taught, can manifest | Neutral |
| Cure Disease | Moderate | Meditation (1 to 20 hours) | 15 per hour | Level 60 | Taught | Light (was Neutral) |
| Floating Meditation | Moderate | Meditation | 15 per session | Level 60 | Can manifest | Neutral (was Light leaning) |
| Force Heal (Others) | Complex | Instant per treatment; scale = wound severity | 25 | No | Taught | Neutral (D-342; was Light) |
| Revitalize | Complex | Instant | 25 | No | Taught | Light |
| Transfer Force | Complex | Instant, plus a Vitality toll on the giver | 25 | No | Taught | Neutral (D-342; was Light) |
| Reduce Injury (new) | Complex | Instant reaction to a hit | 25 | No | Taught | Neutral |
| Voss healing ritual (new) | Complex | Ritual, shared among participants | 125 | No | Lore-locked (Voss healers) | Neutral (D-342; was Light). Fulminiss's corrupted version: Dark, severe |
| Force Light | Complex | Instant; ritual to cleanse a place | 25, or 125 | No | Taught | Light |
| Serenity (Trance) | Complex | Meditation in a lull | 25 | No | Taught | Light |
| Cleanse Mind | Complex | Instant | 25 | No | Taught | Light |
| Malacia | Complex | Instant, contested | 12 (half: it turns the target's own energy) | No | Taught | Light |
| Revelation | Complex | Instant | 25 | No | Lore-locked (Disciples of Twilight) | Light |
| Inspire | Complex | Sustained; scale counts allies | 5 per round | No | Taught | Light |
| Force Enlightenment | Advanced | Sustained | 8 per round | No | Taught | Light |
| Force Harmony | Advanced | Sustained, shared among participants | 8 per round | No | Taught | Light |
| Revitalization of the Whuffa (new) | Advanced | Ritual | 200 | No | Lore-locked (Nightsisters) | Neutral |
| Dark Transfer | Advanced | Instant to save the dying; ritual to revive the just-dead | 40, or 200 | No | Lore-locked, can manifest (Cade) | Dark, severe |

**Revision notes (2026-11-21, Part3b):**
- **Force healing, Transfer Force and the Voss ritual are neutral (D-342; Part3b c9, c10).** None is filed light side on Wookieepedia. Healing by stealing vitality stays dark (Force drain, Dark Transfer, the death field), and so does Fulminiss's corruption of the Voss ritual.
- **Revelation (Part3b f11):** the Disciples of Twilight were founded about 900 BBY, and the power's only source is the *Legacy Era Campaign Guide*. Use before the Legacy era is an inference, so the narrator gives it to Disciples of any era after 900 BBY but never names an earlier user.

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Revelation | Rewritten: locating enemies, each silhouetted by a faint shimmering light. Lore-locked to the Disciples of Twilight (Legacy era). Prerequisites ForceSense 41+, Light Side 20+ | The current entry (seeing hidden truths and motives) has no source. Wookieepedia: "formulated by the Disciples of Twilight" |
| Transfer Force | Rewritten: giving part of one's own life force to save someone mortally wounded. Costs the giver Vitality (alignment and reserve specs). Luke used it on Wedge Antilles | The current entry (sharing Force reserves to boost abilities) has no source |
| Revitalize | Works on the wounded and unconscious too, organics only (not droids). Kreia used it on Hanharr and Colonel Tobin; Luke offered it to an exhausted Mara | Wookieepedia |
| Force Enlightenment | Summary: raises the user's most-trained powers to the best they have ever managed in training (Meetra Surik: Force Speed, Force Armor, Force Valor), rather than all abilities | Wookieepedia |
| Force Light | Add: weakens a darksider's connection to the Force; purges or contains dark nexuses, spirits and possessed people; severs a Sith battlelord's bond with followers. Thon cleansed all of Ambria (ritual scale); Arca Jeth purged Freedon Nadd's sarcophagus; Yaddle, Nomi Sunrider, Shae Koda | Wookieepedia |
| Cure Disease | Alignment Neutral → Light; takes an hour, up to 20 hours for the worst diseases; clears present and future effects, not past damage; absorbs Control Disease and Control Another's Disease as aliases. Cilghal | Wookieepedia lists it as a light side power |
| Detoxify Poison | Add: also clears alcohol (Luke stayed sober); not light-only (Dooku shook off the Karatos Plague, Cade resisted Maladi's poison); past damage isn't healed. Detoxify Poison in Another becomes an application (easier with someone close, and nearby) | Wookieepedia |
| Serenity (Trance) | Prerequisite Meditation 30+ → 51+ | Wookieepedia: "almost only attainable by Jedi Masters" |
| Malacia | Base cost halved; organics only; Oppo Rancisis taught it | Wookieepedia: the user transforms the target's energy "rather than using their own" |
| Floating Meditation | Alignment → Neutral; Luke found it by accident, so it can manifest | Galen Marek used it as Vader's apprentice |
| New: Reduce Injury | Lessens the damage of a strike, even one that would kill; the user is still wounded, one step less | Wookieepedia, Force healing category |
| New: Revitalization of the Whuffa | Nightsister technique that revitalizes the body, and with enough will regrows a limb. The one exception to Force healing not regrowing limbs | Wookieepedia, Dathomir Magic |
| New: Voss healing ritual | Healers draw strength from many to heal one patient; ancient by the Cold War. Darth Fulminiss corrupted it to drive people mad at great distances (that version is Dark, severe) | Wookieepedia. It fits your SWTOR-era start |
| Aliases and applications | Accelerate Healing, Healing meditation and curato salva → Force Heal (Self); Control Another's Pain → Control Pain; Remove Another's Fatigue → Remove Fatigue; Place in Hibernation Trance and the Palawa hibernation trance (decades without ageing) → Hibernation Trance | Each is the same power used on another person, or a named variant |
| Out of scope | Lessen injury (a Ta-Ree spell of Kathol), Water of Life and Blackroot (Nightsister items, not powers) | Equipment or a single closed tradition |

**Questions:**

1. Malacia at half cost, since it turns the target's own energy against them?
2. Serenity raised to Meditation 51+, since it's almost only for Masters?
3. Add the three new entries: Reduce Injury, Revitalization of the Whuffa (limb regrowth) and the Voss healing ritual with Fulminiss's corrupted version?
4. Floating Meditation neutral and Cure Disease light, following Wookieepedia?

All four questions approved on 2026-11-20. New aliases for Claude Code: `AccelerateHealing`, `HealingMeditation`, `CuratoSalva` → Force Heal (Self); `ControlDisease`, `ControlAnothersDisease` → Cure Disease; `ControlAnothersPain` → Control Pain; `RemoveAnothersFatigue` → Remove Fatigue; `PlaceInHibernationTrance` → Hibernation Trance.

## 5h. Nature, knowledge and miscellaneous families: draft

The ninth to eleventh families, drafted 2026-11-20 and checked against Wookieepedia Legends. Sith Alchemy entries that sit at the end of the knowledge section wait for the forbidden arts pass. Bonds and Oneness have no per-use cost: they are formed once, or happen as story events.

| Ability | Tier | Cost type | Base cost | Free use | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- | --- |
| Animal Bond | Basic | Instant; contested to control a hostile beast | 10 | Level 40 (calming) | Taught (younglings), can manifest | Neutral |
| Force Slow (moved out of Stasis) | Basic | Instant, contested | 10 | No | Taught | Dark, lesser (Force Exhaustion, the Jedi Guardian version: Neutral) |
| Force Bellow | Basic | Instant | 10 | Level 40 (voice only) | Taught | Neutral |
| Force Familiar | Moderate | Formed once, by meditation | 15 | n/a | Taught (a Vjun art) | Neutral |
| Plant Surge | Moderate | Instant, or sustained to entangle | 15, or 3 per round | Level 60 (growing plants) | Taught | Light |
| Pyrokinesis | Moderate | Instant | 15 | Level 60 (lighting a fire) | Taught, can manifest | Neutral (was "aggressive use drifts Dark") |
| Force Weapon | Moderate | Sustained | 3 per round | No | Taught | Neutral |
| Force Blinding | Moderate | Instant, contested | 15 | No | Taught | Light leaning |
| Force Stun | Moderate | Instant, contested | 15 | No | Taught | Neutral (D-342; was Light) |
| Force Stasis | Complex | Sustained, contested | 5 per round | No | Taught | Light |
| Alter Environment | Complex | Instant or sustained; scale = area | 25, or 5 per round | No | Taught | Neutral |
| Summon Storm (Force storm (weather); new, D-348) | Complex | Sustained while the storm forms, then it runs for hours; scale = area | 5 per round, or per minute out of combat | No | Taught | Neutral (most users are darksiders; the deed is judged) |
| Ionize | Complex | Instant | 25 | No | Taught | Light leaning |
| Force Affliction | Complex | Instant, worsens over time | 25 | No | Taught | Dark, standard |
| Force Bond | Complex | Formed once (can form on its own); active draw 25 | 25 | n/a | Can manifest | Neutral |
| Life Bond | Complex | Formed once, permanent | 25 | n/a | Can manifest | Neutral |
| Purification (Crystal): a crafting technique, not a combat power (D-343) | Advanced (Knight and up) | Long meditation during downtime or crafting; never in a scene | 40 per session | No | Taught (Jedi Order technique, rarely used; available whenever the Jedi Order exists) | Light (the act is a light deed) |
| Mechu-deru | Complex | Instant, or sustained | 25, or 5 per round | No | Taught (rare) | Dark, standard |
| Force Scribe | Complex (was Basic) | Instant per inscription | 25 | No | Lore-locked (Fallanassi) | Neutral |
| Stasis Field | Advanced (was Complex) | Instant; scale counts targets | 40 | No | Taught (Knights and Masters) | Light |
| Force Plague | Advanced (split from Affliction) | Instant, worsens over time | 40 | No | Taught | Dark, standard |
| Electronic Manipulation | Advanced | Instant | 40 | No | Taught | Dark, lesser |
| Mind Walking | Advanced | Meditation | 40 per session | No | Lore-locked (Mind Walkers) | Neutral |
| Force Ghost | Advanced | Learned in life; used after death | none | n/a | Lore-locked, story event | Neutral (Sith variants dark) |
| Oneness | Advanced | Story event; surge past the pool ceiling | reserve spec | n/a | Story event | Neutral (D-342; was Light) |

**Purification (Crystal) is kept as a crafting technique (D-343, Jared 2026-11-21).** The research bot tagged it "Canon only" (Part3b b2). That was wrong: the Lightsaber crystal/Legends page describes it as an advanced Jedi technique for cleansing dark-side synthetic crystals, used rarely, and Jaden Korr does it in *Riptide* (41 ABY), turning a Dark Jedi's red crystal into a yellow-bladed Jedi crystal through meditation.
- Light side: the act is a light deed.
- Advanced tier, Knight and up. A Jedi Order technique, rarely used, available whenever the Jedi Order exists.
- Works only on synthetic crystals made by dark-side users. It removes the dark taint so the crystal can go into a Jedi lightsaber, and the blade colour changes.
- Takes a long meditation during downtime or crafting. It can't be used in a scene.
- Links to lightsaber crafting and the crystal lore: `SW_Lightsabers_Crystals_Materials_AllEras.md`, "Synthetic lightsaber crystals" (Sith-made red synthetic crystals).

**Summon Storm (D-348; Part3b a14; Part2a §C).** Conjures a storm several kilometres across that lasts hours, with rain, wind and lightning that can ground aircraft. Outdoors only, and limited by the local climate (a sandstorm in a desert, not rain). "Not inherently a dark side ability", but most users are darksiders. Alter Environment keeps steering an existing storm.

**Revision notes (2026-11-21, Part3b):**
- **Force Stun (D-342; Part3b c11)** is neutral; Wookieepedia gives the stun and stasis family no side.
- **Oneness (D-342; Part3b c8)** is neutral: filed under Control with no side. Rare dark cases exist (King Ommin "became one with the dark side"; Leia did so through anger).
- **Force Blinding (Part3b c12)** has two versions in Legends ("a powerful tool of the light side" for Jedi, yet listed in the Sith Offense school). It stays light leaning.
- **Force Ghost (Part3b f12):** lost for millennia, rediscovered by Qui-Gon Jinn, and preserved among the Ysanna. Before Qui-Gon only the Ysanna tradition knows it among the light side.
- **Ionize and Force Stasis (Part3b c18, c19):** Wookieepedia files both light side + Alter, which matches this catalog; the "neither" in Part 2a is Part 2a's error.

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Alter Environment | Notes rewritten: whirlwinds and fog to attack or hide in, sub-zero cold in seconds or burning heat, electrical discharge over open ground, emptying the air from an area or raising its pressure to burst eardrums, small quakes and fissures, flash floods, steering an existing storm. Drop "subtle, slow, cannot conjure from nothing". Gavar Khai (Sith) quote | Wookieepedia describes a far stronger power than the current entry |
| Force Scribe | Rewritten: an upper-tier Fallanassi technique, using the White Current to inscribe words that never fade and that only White Current adepts can see, read, change or erase (they can also sense where scribing is). Drop the holocron claim | The current entry (precise Force engraving, used for holocrons) has no source |
| Force Stasis tree | Wookieepedia's ladder: Force Stun (deadens the senses, catatonic for a moment), Force Stasis (freezes the target in place), Stasis Field (several targets at once, Knights and Masters). Willpower resists; no effect on droids. Kavar could stun several at once. Light side | Wookieepedia lists it as a light side power; the parent had no tier |
| Force Slow | Moved out of the Stasis tree into its own entry, with Affliction and Plague under it. Dark, lesser: clouds the mind and slows body and thought (Juhani used it). Force Exhaustion is the Jedi Guardian version from the Cold War and Galactic War, Neutral. Affliction (fast poison, can kill if the user is strong) is Complex; Plague (worse, keeps worsening; Traya and Nihilus used it on the Exile) becomes Advanced | Wookieepedia: "Force Slow was a dark side Force power", the milder version of Affliction and Plague |
| Electronic Manipulation | Prerequisite Ionize 21+ → Tutaminis 15+ and Mind Trick 21+; restores altered versions of the device's original programming, never rewrites it whole | Wookieepedia: it needs "knowledge of absorbing energy and affecting the minds of other living beings" |
| Mechu-deru | Replace "Jedi Sentinels developed a benign version" with "a few Jedi tech specialists used it"; add Belia Darzu, Cronal, and the subelectronic converter implant that speeds up learning it | Wookieepedia |
| Animal Bond | Add control: a calmed beast can serve as a mount or guard (Beast Trick, Beast Control). Taught to younglings. Kreia taught it to the Exile; Tott Doneeta rode a boma | Wookieepedia |
| Pyrokinesis | Drop "aggressive use drifts Dark" (an attack is judged by the deed). Add Brakiss teaching Zekk, Yarael Poof, Leia lighting candles; conjuring fire from the sky overlaps Alter Environment | Wookieepedia doesn't tag it dark |
| Force Weapon | Add: a Force-imbued weapon can block a lightsaber unharmed. The Je'daii and Jedi called it Vur Tepe; the Zeison Sha used it on discblades; Vodo-Siosk Baas on his staff against Exar Kun | Wookieepedia |
| Force Bellow | Add: Ithorian Jedi used it to blast obstructions (Roron Corobb against Grievous); Joruus C'baoth | Wookieepedia |
| Force Whisper | Merged into Telepathy as projective messaging; old key `ForceWhisper` resolves there | Wookieepedia has no page for it (the name redirects to Mind trick), and the entry describes telepathic messaging |

**Questions:**

1. Force Whisper: merge into Telepathy, since that's what the entry describes, even though Wookieepedia redirects the name to Mind trick?
2. Force Slow: split out as its own dark (lesser) power, with Force Exhaustion as the neutral Jedi version, and Plague raised to Advanced?
3. Force Scribe: rewrite as the Fallanassi technique and lock it to them?
4. Alter Environment: keep it Complex and let the scale classes handle quakes and storms, or raise it to Advanced? I'd keep it Complex: size is already priced by scale.

All four questions approved on 2026-11-20; Alter Environment stays Complex. New aliases for Claude Code: `ForceWhisper` → Telepathy; `ForceExhaustion` → Force Slow; `ForceStasisField` → Stasis Field. Force Slow, Affliction and Plague moved out of the Stasis tree into their own entry.

## 5i. Space-time family: draft

The twelfth family, drafted 2026-11-20 and checked against Wookieepedia Legends. Every entry is Advanced. Four of the eight had their tradition or effect wrong.

| Ability | Tier | Cost type | Base cost | Learning class | Alignment |
| --- | --- | --- | --- | --- | --- |
| Teleportation | Advanced | Instant; scale = distance | 40 | Taught (rare) | Neutral |
| Fold Space | Advanced | Instant; scale = mass and distance | 40 | Taught by the Aing-Tii; outsiders from 43.5 ABY (D-344) | Neutral |
| Phase | Advanced | Sustained | 8 per round | Taught (rare); no Killik lock (D-344) | Neutral (reaching into a body to kill is judged) |
| Dimension Shift | Advanced | Instant per object | 40 | Taught, can be rediscovered | Neutral |
| Art of the Small | Advanced | Meditation; sustained to hide | 40, or 8 per round | Taught | Neutral |
| Flow-Walking | Advanced | Meditation per walk | 40 | Lore-locked (Aing-Tii); taught to an outsider by c. 30 ABY (Jacen Solo, D-358) | Neutral |
| Force Storm (Wormhole) | Advanced | Ritual; scale up to a planet per storm (fleets too) | 200 | Lore-locked (Book of Anger, Darkstaff) | Dark, severe |

**Dropped (D-343):** Force Travel. Its page carries Wookieepedia's non-canon Legends banner, like *Infinities* (Part3b b7). The old key is a rejected name.

**Revision notes (2026-11-21, Part3b):**
- **Flow-walking cannot change the past (D-340).** Caedus admits this in *Legacy of the Force*. The Wookieepedia intro says the opposite ("they could alter the past, and thereby change the course of the future"; Part3b d2). The game follows the novels: a walker can watch the past and leave an imprint, as Jacen did, but cannot change what happened. Time-drifting, physical travel along the threads of the Force, stays dropped (Part3b d3, a19).
- **Fold space (D-344; Part3b f1)** is an Aing-Tii technique. Outsiders can learn it from them from 43.5 ABY, when Tadar'Ro taught Luke. Abeloth used it, and Luke and Leia did inside the Monolith (45 ABY).
- **Phase (D-344; Part3b d8, f5)** is rare, with no Killik lock. The Killik origin is Raynar Thul's claim; Leia suggested the Celestials; An'ya Kuro used it with no Killik link.
- **Teleportation (Part3b d7):** Wookieepedia hedges the four-feet and "anywhere they can clearly see" figures with "could likely". They stay as design defaults, marked as estimates.
- **Force Storm (Wormhole) dangers (Part3b d10):** Sidious first admitted he could not fully control it; those who lose control are consumed; the storm ends if its maker dies; Jedi "if they banded together" could conjure one, at extreme risk of corruption. **Scale (Part3b e5; D-347):** wormholes from under 100 m to over 1 km; one tore up Coruscant's surface and much of the Imperial Palace. A single storm reaches a planet's surface or a fleet. Sending storms "across many systems" (Sidious, 10 ABY) is beyond one storm and stays a story event.

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Teleportation | Drop "almost no documented cases". Users: Vitiate, Darth Jadus, Dread Masters Tyrans and Raptus (your SWTOR era), Mother Talzin (as green mist), Abeloth, some of Palpatine's Force Adepts. A beginner moves about four feet; a master anywhere they can clearly see. Prerequisite ForceControl 81+ → 61+ | Wookieepedia: rare and costly, but well documented |
| Fold Space | Tradition Fallanassi → Aing-Tii (also called Transmigrate). Moves objects, or possibly oneself, instantly. Tadar'Ro taught Luke; Abeloth used it; Luke and Leia used it inside the Monolith. Application: Aura of Freedom, letting the user and nearby allies resist being moved by the Force | Wookieepedia. Force teleportation redirects here |
| Phase | No longer Fallanassi. Passing through walls and doors, or reaching into someone's body to deadly effect. An'ya Kuro used it; Bazel Warv used it under Force psychosis. Raynar Thul said the Killiks developed it while building the Maw; Leia suspected the Celestials. Drop "invisible to Force perception" | Wookieepedia |
| Flow-Walking | Remove Luke as a learner (Ben learned it and swore never to do it again). The past can't be changed (Caedus lied to Tahiri about that), but a walker can leave an imprint in the past, as Jacen did to link Leia to a crash site. Users must stay anchored or lose themselves in the flow. Drop "time-drifting" physical travel | Wookieepedia. Luke warns that the wanting behind it leads many to the dark side |
| Art of the Small | Credit Vergere (who named it), not Ood Bnar. Taught to Jacen Solo, Cilghal, Ben and Mara; Onimi used it to make toxins and control Shimrra; Allana Solo used it to hide. Took talented Knights a year or two. Uses: molecular healing, and hiding one's presence completely. Drop "hiding inside a living body" | Wookieepedia |
| Force Storm (Wormhole) | Prerequisite Force Lightning storm → mastery across disciplines (Telekinesis 61+, ForceSense 61+, ForceControl 91+, Dark Side 90+). Add the Darkstaff storm that threw Darth Rivan forward in time, Sidious recording it in the Book of Anger, and the storm that consumed him at Pinnacle Base | Wookieepedia: it "required mastery in many different Force disciplines" |
| Force Travel | Dark weight steps up with distance and unfamiliarity: a short hop somewhere familiar is standard; far or unfamiliar is severe (superseded by D-343: dropped, non-canon source) | Wookieepedia: more corrupting the farther and less familiar the destination |

**Questions:**

1. Phase: lock it to Killik memories (Joining, or rediscovery like An'ya Kuro) now that it isn't Fallanassi?
2. Teleportation: lower the prerequisite to ForceControl 61+, since several SWTOR-era Sith used it?
3. Flow-Walking: allow Jacen's imprint trick as the only way to touch the past?
4. Force Travel: dark weight standard for short familiar hops, severe for far or unfamiliar ones?

All four questions approved on 2026-11-20. New alias for Claude Code: `ForceTeleportation` → Fold Space. Superseded on 2026-11-21: the Killik lock on Phase (D-344) and Force Travel itself (D-343, dropped).

## 5j. Sith alchemy and forbidden arts: draft

The thirteenth and last ability family, drafted 2026-11-20 and checked against Wookieepedia Legends. Nearly everything here is a lore-locked ritual. Sith Sorcery and Mask were settled earlier and are listed only for their cost.

| Ability | Tier | Cost type | Base cost | Learning class | Dark weight |
| --- | --- | --- | --- | --- | --- |
| Taint | Complex | Instant; ritual to taint a place | 25, or 125 | Taught | Standard |
| Sith Sorcery workings | Advanced | Ritual or sustained, per working | 200, or 8 per round | Lore-locked (Sith texts) | Standard; severe for the big workings |
| Summon Fear | Advanced | Sustained; worse the longer it's held | 8 per round | Lore-locked (Sith sorcery) | Severe |
| Sith Alchemy | Advanced | Ritual per working | 200 | Lore-locked (Sith teaching; Je'daii at Anil Kesh) | Standard; severe for Sithspawn |
| Mask | Advanced | Ritual | 200, plus a little Corruption | Lore-locked | Standard |
| Mechu-deru Vitae | Advanced | Ritual | 200 | Lore-locked (Belia Darzu) | Severe |
| Stygian Art | Advanced | Ritual | 200 | Lore-locked (Cronal) | Severe |
| Force Walk | Advanced | Ritual to bind a ghost; drawing on it adds power | 200 | Lore-locked (Ergast's holocron) | Severe |
| Supernova | Advanced | Ritual; needs Sith crystals; backfire risk | 200; scale up to a binary star (D-347) | Lore-locked | Severe |
| Midi-chlorian Manipulation | Advanced | Ritual | 200 | Story event (Plagueis) | Severe |
| Sith necromancy (NPC/story, D-348) | Advanced | Ritual | 200 | NPC and story only | Severe |
| Dark Plague (NPC/story, D-348) | Advanced | Ritual to make; spreads as a disease | 200 | NPC and story only | Severe |
| Essence Transfer | Advanced | Ritual; destroys the current body | 200 | Story event | Severe |
| Thought Bomb | Advanced | Group ritual of many Sith Lords; kills the casters | All participants' pools | Lore-locked (Revan's holocron) | Severe |

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Shadowstrike | Dropped. On Wookieepedia it's a Ta-Ree spell of Kathol that lands blows without touching; the entry's dark lightsaber strike that cuts through Force barriers has no source | Out of scope, like Lessen injury |
| Sith Alchemy | Prerequisites ForceKnowledge 81+, Dark 80+ → 51+ and 40+, plus Sith teaching. Add the Je'daii version (Force alchemy at Anil Kesh, the Temple of Science: permitted, but it meant leaning into the dark side). Alignment "extreme drift" → standard per working, severe for Sithspawn | Wookieepedia: practised by Sorzus Syn onward and by many Sith alchemists, not a handful of masters. Mask already needs only 51 and 40 |
| Thought Bomb | Rewritten as a group ritual: the focused will of many unified Sith Lords. It annihilates every Force-sensitive in its radius, body and spirit, and traps their souls in an orb. Origin in Vitiate's Ritual of Nathema; Revan recorded it in his holocron, hidden on Lehon until Lord Kaan found it in 1000 BBY | Wookieepedia. The entry's single-user prerequisites don't fit |
| Summon Fear | Prerequisite adds Sith Sorcery 21+; effects by duration: short, the victim wakes with little memory; longer, coma with the mind destroyed; longest, death. Revan used it; Bane shook it off because he'd conquered his fears long before | Wookieepedia, "Summon fear" |
| Midi-chlorian Manipulation | Add: create, maintain or save life; Plagueis made creatures conceive alone and bypassed a Yinchorri's telepathic immunity. Mark "the Force made Anakin as a counterbalance" as in-universe speculation, not fact (superseded by D-339: the Force created Anakin is fact; only the link to Plagueis's experiments is belief) | Wookieepedia |
| Essence Transfer | Add: can go into an object as well as a body; ancient Sith haunted their tombs to possess intruders; later masters used clones (Palpatine). The ritual destroys the current body (Darth Andeddu) | Wookieepedia |
| Taint | Add: Luke beheading Lumiya in revenge tainted the place; tainting can mark a place so it seems the user is still there; it can seduce people to the dark side | Wookieepedia |
| Supernova | Add: Exar Kun; an uncontrolled core can kill the caster or chain-react (the Cron Cluster) | Wookieepedia |

**Questions:**

1. Drop Shadowstrike, since it's a Ta-Ree spell and the entry has no source?
2. Lower Sith Alchemy to ForceKnowledge 51+ and Dark 40+, with the Je'daii exception?
3. Thought Bomb as a group ritual of many Sith Lords, using Revan's holocron?
4. Keep the Anakin line about Midi-chlorian Manipulation only as in-universe speculation?

All four questions approved on 2026-11-20. Shadowstrike is removed: Claude Code should list `Shadowstrike` as a rejected name.

**The Force created Anakin (D-339, Jared 2026-11-21; replaces the 2026-11-20 wording).** In the game world it is fact that the Force created Anakin: his conception was the Force's own act, and Shmi had no father for him. Whether Plagueis's (and Sidious's) experiments provoked it stays their belief, unresolved. The narrator may present it as what they believed, never as confirmed. Part3b d1 notes that Wookieepedia gives the whole account as Plagueis's belief (he counted his attempt a failure, "believing" Anakin was created by the Force to end the Sith); the ruling makes the creation itself fact and leaves only the cause as belief. Plagueis's 20,000-count "created being" stays his own speculation. Midi-chlorian Manipulation keeps its tier and availability.

**Revision notes (2026-11-21, Part3b):**
- **Supernova (D-347; Part3b e1)** reaches up to a binary star: Naga Sadow made the Denarii binary suns collide (5000 BBY). It needs Sith crystals, and it can backfire: Aleema Keto's attempt ignited nine other stars and made the Cron Drift (about 3996 BBY).
- **Sith necromancy and Dark Plague (D-348)** are NPC and story powers; details in §5e.
- **Gaps noted, not added (Part3b §a):** Magnify Senses and Shift Sense, truth-sense and Eyes of the Force, Sense Path, Force Track, Art of Movement, the RPG-derived Control powers, Quey'tek meditation, Fallanassi Force immersion, *hassat-durr* and *ayna-seff*, Field Detection and Shadow Vision, Aing-Tii ship-jumping, the named Sith sorcery spells, and the very obscure species and single-source powers (Part3b a4–a7, a9–a13, a17, a20–a30). They stay in the lore files for the narrator and a later pass. Fallanassi Force immersion is cited in §5f as the way to make something vanish.

## 5k. Lightsaber forms: draft

The last pass, drafted 2026-11-20 and checked against Wookieepedia Legends (mainly "Lightsaber combat" and "Form VII"). It does two things: fixes the form list, and settles the M6 form rules already recorded in architecture §15 (D-187 and the M5 findings). Forms draw no Force pool; their costs are in the combat spec, which stays as built.

**Form rules for M6:**

| Rule | Proposal | Lore and evidence |
| --- | --- | --- |
| Second-form growth | A secondary form's drill ceiling uses its own E plus half the main form's E (design default; Claude Code tunes it with the lifetime harness). Fighting in a secondary form during a duel earns E for that form | M5 measured second forms stalling: Obi-Wan's went from 51 to 53 over twenty years. Palpatine mastered all seven forms |
| Free form switch | Switching forms costs 0 advantage when both forms are 61+ (Master tier); the M5 switch cost applies below that | Sidious was a master of all seven forms (the old "Palpatine and Dooku moved between forms fluidly" is unsourced; lore batch 10, C1). The mechanic stays |
| Cleave | Keep the advantage after taking out a minion, while fighting in Shii-Cho or Shien at 41+ against a group | Wookieepedia: Shii-Cho was "specialized towards engaging multiple opponents"; Shien was built for Jedi who "were often outnumbered". Sokan, the earlier candidate, is about terrain, not crowds |
| Makashi precision | Aimed-strike penalty shrinks from −2 at Makashi 0 to none at 61+, only while fighting in Makashi (as recorded in D-187) | Makashi "relied on precision swordplay"; timing and accuracy over strength |
| Marks of contact | Now sourced, so the lore entry can be written (list below). Each targeting mark is a learnable technique that lowers the aim penalty for its own target from −2 toward 0 | Wookieepedia: "All Jedi forms involve the same marks of contact" |

**The marks of contact** (Wookieepedia, "Lightsaber combat"):

| Mark | Meaning | Game use |
| --- | --- | --- |
| Sun djem | Disarming the opponent, usually without harming them (Shii-Cho's Disarming Slash) | A disarm action |
| Shiim | A minor edge wound, anywhere on the body | No aiming needed |
| Cho mai | Cutting off the weapon hand | Aimed: hand |
| Cho sun | Cutting off the weapon arm | Aimed: arm |
| Cho mok | Cutting off a limb | Aimed: limb |
| Shiak | A stab | Aimed: torso |
| Sai cha | Beheading (zones 2 and 3) | Aimed: head |
| Sai tok | Cutting someone in half, usually at the waist | Aimed: torso, higher difficulty |
| Mou kei | A circular cut at several limbs at once | One aimed strike, two limbs, higher difficulty |

**Corrections to the form list** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Vaapad | Drop "Prequel Era only; requires Mace Windu alive". Created by Mace Windu and Sora Bulq; Depa Billaba and Quinlan Vos also used it. Before then it doesn't exist; in the Clone Wars it's taught by Windu, Bulq or Billaba; from the New Jedi Order on it can be learned from the recovered records, which survived into the Legacy era | Wookieepedia, "Form VII" |
| Juyo | "Requires Council permission" becomes an era note. In the Old Republic era Juyo was practised by Jedi Masters Kavar, Zez-Kai Ell and Vrook Lamar; it became restricted later (Cin Drallig refused to teach Anakin). Sith use it freely (Maul, Galen Marek) | Wookieepedia. This matters for your 3661 BBY start, where Juyo is open to Jedi |
| Niman | Drop Kit Fisto (a Shii-Cho master). Users: Exar Kun (mastered it), Revan, Darth Maul and Anakin as a second form. Origin: the Kashi Mer dual-blade style, adopted by the Legions of Lettow, then by the Jedi | Wookieepedia |
| Makashi | Drop Asajj Ventress as a named user; keep Dooku. Note curved hilts, made for it | Wookieepedia names Dooku |
| Sokan | A principle more than a form, from the Great Hyperspace War: using terrain and tumbling to close distance (Obi-Wan's high ground) | Wookieepedia |
| Tràkata | Add: Jedi avoided it because it relies on deception; Sith struggled with it because it needs calm tactics, not rage | Wookieepedia |
| Jar'Kai | Add origin: the Yovshin Swordsmen, named for a city on Atrisia | Wookieepedia |
| Zero-G Combat | Dropped as a form; it becomes an environment modifier that training can reduce | No Legends form by that name |
| New: Telekinetic Lightsaber Combat | Wielding sabers by telekinesis: range stops mattering and several sabers become possible. Extremely difficult; needs high Telekinesis. Covers the saber throw at low levels and Luke's many-saber feats at the top | Wookieepedia, "Lightsaber combat" |
| New: Lightwhip and Lightsaber Pike | Weapon-specific styles. Lightwhip: long reach, wraps around a parry, rare enough that duelists aren't trained against it (Lumiya). Pike: phrik shaft for reach, blocking and leverage | Wookieepedia |
| Notes only | Trispzest (S'kytri aerial combat, lore-locked to winged species); Strong, Medium and Fast styles (New Jedi Order names; Medium is based on Niman); Form "Zero" (Yoda's ethic of not drawing the saber, not a form); Lus-ma (obscure; one Grievous counter); su ma (Ataru's spins, somersaults and cartwheels) | Wookieepedia |

**Questions:**

1. Cleave on Shii-Cho and Shien at 41+, instead of Shii-Cho and Sokan?
2. Second-form growth: start the default at half the main form's E and let Claude Code tune it with the harness?
3. Zero-G: drop it as a form and make it an environment modifier, since Legends has no such form?
4. Add Telekinetic Lightsaber Combat, Lightwhip and Lightsaber Pike as forms, with the rest as notes?

All four questions approved on 2026-11-20. Change from the draft: the Strong, Medium and Fast styles became learnable forms (`StrongStyle`, `MediumStyle`, `FastStyle`), era-locked to after Luke founds the New Jedi Order, as the way early New Jedi Order students learn (Jared's decision, and it matches Wookieepedia: Luke's new Order had to rebuild lightsaber combat from scratch, and Kam Solusar taught the three rings of defense these styles are named for). New form keys: `TKSaber`, `Lightwhip`, `SaberPike`; `ZeroGravity` becomes environment training, not a form.

**Lore batch 10 corrections (2026-11-21; D-369 to D-371; lore: SW_Lightsaber_Forms_Catalog_Check_Part1.md and _Part2.md).** The forms catalog check is applied; the v3 lightsaber content now matches the SW_Lightsaber_* research set. These supersede the 2026-11-20 rows above where they differ:
- **Makashi:** footwork-centred, minimal energy expenditure ("minimal footwork" removed; the "high mental and willpower requirements" claim is unsourced and removed, and no stat gate depended on it). Asajj Ventress is restored as a skilled Makashi user, not a master, often with two blades (reverses the 2026-11-20 removal).
- **Niman:** named weaknesses (relaxed bladework; nearly hopeless against Makashi); easy to learn, at least ten years to master, so its difficulty is Beginner. Revan stays [unclear], with nothing mechanical built on it. Origin as logged (D-350 [2]), with "from Jar'Kai" noted as the minority version.
- **Juyo:** available to Old Republic Jedi only for students judged steady; its status swung between frowned-upon and taboo. After the New Sith Wars Vaunk hand-picked a few students a year; Drallig refused Anakin. Galen Marek is a Dark Jedi, not a Sith. Council permission stays for Juyo only.
- **Vaapad:** gate "a teacher or records" (D-370), replacing the Mace-alive flags; pre-Windu "Vaapad" is an alias of Juyo. Billaba and Vos mastered it too. The unsourced Yoda quote is removed. Clone Wars teachers are Windu (with his permission) and Bulq (unsanctioned); Billaba is not a teacher.
- **Juyo-Kos** (Great Galactic War, Jedi only, Jaric Kaedan; restricted like Juyo; review), **reverse Shien grip** (a Form V variant; also the Jensaarai style), **Praetoria Vonil and Ishu** (Imperial Knights, Legacy era), the **three rings of defense** (flavour under the NJO styles), **mounted combat** (a technique note) and a **Named maneuvers** table (flavour only in M6; D-371) are added. Personal Form V variants (Bane, Zannah, Vader) and Kas'im's two-saber Ataru are NPC lore notes.
- **Tradition:** Soresu, Ataru, Niman and Sokan are "Jedi origin; also Sith"; nothing blocks Sith or Dark Jedi from learning them (tested).
- **Others:** Trispzest is open to fliers and levitators (Maw), not only winged species; Form Zero is named by Skarch Vaunk, supported by Yoda; Dun Möch is "a Sith doctrine; Jedi use is rare and debated" (the D-350 [8] design is unchanged); the saberstaff loses "more damage, less precise" (wide coverage and surprise; power and penetration hard to apply; flourishes leave the user open; a damage bonus only when thrown; invented by Sith Lords, Exar Kun first); the double-bladed Temple Guard pike fights like a saberstaff; Telekinetic Lightsaber Combat's peak is Darth Traya with three sabers, not Luke; Saber Barrier needs multiple sabers (Windu with one the exception); protosabers can't be thrown.

**Zero-G confirmed (look-over item 6, 2026-11-21):** zero or low gravity is an environment modifier, a penalty that training in it reduces; it is not a form. Converting the code's `zeroG` form (its drill, matchup and terrain entry) and migrating saves is an integration item, not a spec change.

## 5l. Tradition powers: mapping and additions (lore batch 5)

Added 2026-11-21 (D-358; lore: `SW_Force_Traditions_AllEras_Part1.md` and `_Part2.md`, the cross-era tables and entries). The traditions files name powers by Wookieepedia page title. Each named power is mapped to its catalog entry below. Powers with no entry are added as **tradition-gated, marked "review"**: their tiers and costs are the §3 defaults, set without a family pass, and wait for Jared's review.

**Lore-lock amendments (D-358):**
- **Aing-Tii flow-walking** was taught to an outsider by c. 30 ABY (Jacen Solo, after the Yuuzhan Vong War). Fold space taught to outsiders stays from 43.5 ABY (Luke and Ben); decision [5] lets a Force-sensitive player learn it from the Aing-Tii inside that gate.
- **Theran Force-listening:** the technique page credits Qui-Gon, Obi-Wan and Ahsoka (TCW, accepted under D-338) with using it, which confirms D-344's loosened lock.
- **Darksight:** the Sorcerers of Rhand, plus the Nightsisters, who call it "heartshadow". This matches D-344.

**Mapping (tradition: named power → catalog entry):**

| Tradition (file) | Named power | Catalog entry |
|---|---|---|
| Guardians of the Breath (P1) | Healing; crop-growing | Force Heal (Others); Plant Surge |
| Followers of Palawa (P1) | Decades-long ageless trance | Hibernation Trance (Palawa trance alias, §5g). Teräs Käsi is a martial art, not a power |
| Legions of Lettow (P1) | Force-imbued blades | Force Weapon (held) |
| Order of the Terrible Glare (P1) | Illusions; soul snares | Force Illusion. Soul snares (crystal prisms that trap a soul) are artifacts, not a power: story items, no entry |
| Baran Do Sages (P1) | Precognition; white lightning; Force whirlwind; *ayna-seff* | Precognition; *hassat-durr* (a §5j gap, not added; "not of the dark side"); Force Whirlwind; *ayna-seff* (added below) |
| Aing-Tii monks (P1) | Flow-walking; fold space ("Force teleportation"); Fighting-sight | Flow-Walking; Fold Space (alias `ForceTeleportation`); Fighting-sight (already an entry, §5d) |
| Luka Sene (P1) | Farsight; Field Detection | Farsight; Field Detection (added below) |
| Gand findsmen (P1) | Divination rituals | Farsight and Force Sense, framed as religious ritual (D-358 [3]). Gand martial arts: not a power |
| Jal Shey (P1) | Force-imbued armour and gear | Force Imbuing, gear (added below) |
| Wardens of the Sky (P1) | Unarmed Force martial art | Enhance Attribute and Force Speed, as a fighting style |
| Sorcerers of Tund (P1) | Illusion; deception; shapeshifting | Force Illusion; Mind Trick; Masquerade (an application of Force Illusion) |
| Krath (P1) | Sith magic (illusions) | Mindforms (Force Illusion with Sith Sorcery) |
| Ysanna (P1) | Force ghost; projectile guidance | Force Ghost; Projectile Guidance (added below) |
| Keetael (P1) | Force tracking; guided ranged attacks; visions | Life Detection (Life Sense application; Force Track itself is a §5j gap); Projectile Guidance; Farsight |
| Voss Mystics (P1) | Prophecy; healing | Force Vision; Voss healing ritual |
| Knights of Zakuul (P1) | Scion foresight | Force Vision and Precognition. Shield group tactics: combat, not a power |
| Ember of Vahl (P1) | Flame trance; fire resistance; flaming weapons | Force Vision (meditation trance); Energy Resistance; Force Imbuing, gear |
| Sorcerers of Rhand (P1) | Darksight | Darksight |
| Matukai (P1) | Body-channelled Force | Body family (Enhance Attribute, Control Pain, Force Body) |
| Zeison Sha (P1) | Telekinesis; discblade | Telekinesis; Saber Throw (discblade) |
| Witches of Dathomir (P2) | "Spells"; rancor taming | The catalog's powers, cast as spells (D-358 [14]); Animal Bond |
| Nightsisters (P2) | Illusion spells; spirit ichor; Force-imbued weapons; control web | Force Illusion (mindforms for Shadow Magic); Spirit Ichor, Force Imbuing (gear) and Control Web (added below) |
| Disciples of Twilight (P2) | Light-bending; Cloak of Shadow; Shadow Armor | Force Cloak (light-bending; Cloak of Shadow is a section of the Force cloak page, so it maps there as the Disciples' variant); Shadow Armor (added below); Revelation (§5g) |
| Shapers of Kro Var (P2) | Earth, fire, water and air shaping | Elemental Shaping (added below) |
| Seyugi Dervishes (P2) | Target location | Life Detection (Life Sense application) |
| Theran Listeners (P2) | Theran Force-listening | Theran Force-listening |
| Bando Gora (P2) | Drug-and-Force mind control | Mind Control |
| The Wyrd (P2) | Flight; storm summoning; lightning; Drain Knowledge | Force Flight; Summon Storm; Force Lightning; Mind Probe (Drain Knowledge is already its alias) |
| Korunnai (P2) | Parasite expulsion | Parasite Expulsion (added below) |
| Tyia (P2) | Stun by telekinesis | Force Stun; Telekinesis |
| Fallanassi (P2) | Illusions; Meditation of Immersion | Force Illusion; Force Immersion (added below; until now cited only in §5f) |
| Agents of Ossus (P2) | Concealment | Force Concealment |
| Bosph ela b'Yentarr (P2) | Farseeing; hunting senses; healing | Farsight; Life Detection; Force Heal (Others) |
| Kilian Rangers (P2) | Blaster deflection with shield gauntlets | Force Deflection (with gear) |
| Mind Walkers (P2) | Travelling "beyond shadows" | Mind Walking |
| Jensaarai, Imperial Knights (P2) | See the sub-group styles file | Ballistakinesis (Jensaarai, §5); forms in §5k |
| Dai Bendu, Blazing Chain, Shasa, Mecrosa, Antarian Rangers, Potentium, Altisian Jedi, Iron Knights, Paladins (P1, P2) | None named, or non-Force skills | No entry |

**Additions (tradition-gated, review):**

| Ability | Tier (default) | Cost type | Base cost | Learning class | Alignment | Source |
|---|---|---|---|---|---|---|
| Field Detection | Complex | Instant | 25 | Tradition-locked (Luka Sene; a Luka Sene mentor) | Neutral | Perceiving energy fields; P1 Luka Sene |
| *Ayna-seff* | Complex | Meditation | 25 per session | Tradition-locked (Baran Do; Jacen Solo learned it, 34 ABY) | Neutral | P1 Baran Do; Part3b a13 |
| Projectile Guidance | Moderate | Instant per shot | 15 | Tradition-locked (Ysanna, who perfected it; Keetael) | Neutral | Guiding ranged weapons; P1 Ysanna, Keetael |
| Force Imbuing (gear) | Complex | Ritual per item (crafting) | 125 | Tradition-locked (Jal Shey armour and gear; Nightsister weapons; Ember of Vahl flaming weapons) | Neutral (Nightsister and Vahl versions dark, standard) | P1 Jal Shey, Ember of Vahl; P2 Nightsisters. Force Weapon stays the held, in-combat version |
| Control Web | Advanced | Group power; every participant pays, sustained | 8 per round each | Tradition-locked (Nightsisters; Lost Tribe Sith forced captives to teach it) | Dark, standard | Several Nightsisters together control creatures' minds; P2 Nightsisters |
| Spirit Ichor | Advanced | Ritual | 200 | NPC and story only (Nightsister shamans) | Dark, standard | Channelled by shamans (the Water of Life); P2 Nightsisters |
| Shadow Armor | Advanced | Sustained | 8 per round | Tradition-locked (Disciples of Twilight, c. 900 BBY on) | Neutral | Invisibility; P2 Disciples of Twilight (Shadow armor page) |
| Elemental Shaping | Complex | Instant or sustained; scale = area | 25, or 5 per round | Tradition-locked (Shapers of Kro Var, c. 1000 BBY on) | Neutral | Earth, fire, water and air shaping; a tradition form of Alter Environment; P2 |
| Parasite Expulsion | Complex | Instant | 25 | Unique (Kar Vastor); NPC only | Neutral | Drove brain parasites out of a body, a power unknown to the Jedi; Vastor paid with the loss of comprehensible speech; P2 Korunnai |
| Force Immersion | Advanced | Meditation, then sustained | 40, then 8 per round | Tradition-locked (Fallanassi; Luke and Jacen briefly) | Neutral | Meditation of Immersion: invisibility; masters take objects and places with them; sees through cloaks and illusions; P2 Fallanassi; Part3b a12 |
| Ta-Ree powers (Pyrospray, Shadowstrike and others) | per power | per power | — | NPC only; usable mainly inside the Kathol sector | Neutral | A twisted form of the Force after the Kathol Rift disaster; P1 Aing-Tii neighbours. `Shadowstrike` stays a rejected name for the player |

## 6. Family pass plan and repo files

Each pass fills the family's table, checks every entry against Legends, and logs anything unsourced in the questions file.

| Order | Family | Entries | Why this order |
| --- | --- | --- | --- |
| 1 | Telekinesis | 20 | Combat core. Drafted in section 5 |
| 2 | Body enhancement | 17, plus Morichro | Valor, Battlemind and Force Body tie straight into the reserve spec |
| 3 | Defense | 11, plus Force Concealment | Counters for Force-heavy duels, and Concealment for alignment |
| 4 | Sensory | 12 | Precognition is already in combat |
| 5 | Dark side | 15 | Alignment weights |
| 6 | Mental and social | 15, plus Dominate Mind |  |
| 7 | Healing and light side | 12, plus Force Meld |  |
| 8 | Nature, knowledge, misc | 17 | Mostly non-combat |
| 9 | Space and time, Sith alchemy and forbidden arts | 13 | Mostly rituals and tradition-locked |
| 10 | Lightsaber forms | 14 | Folded in with the secondary-form growth, free switch and cleave items |

**Repo files this touches:**

- `docs-v2/spec/force-catalog.md`: add the section 2 fields and the section 3 formulas.
- `docs-v2/spec/force-catalog-questions.md`: fix the Battle Meld era note, add Dimension Shift as unsourced, move Dominate Mind into the catalog once its fields are set.
- `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md`: correct Dark Transfer and add the missing entries. This was the source of truth, so the fixes went there first. Since 2026-11-21 (D-338) the Force powers source is `SW_Force_Powers_Part1a.md` to `_Part3b.md`; the v3 file's powers sections are superseded, and its lightsaber forms stay current until lore batch 10.
- `docs-v2/spec/alignment.md`: the existing v1 alignment spec (one scale from -100 to +100 with dark pressure and philosophies). The new alignment spec replaces it. Its philosophy offsets might be worth keeping (section 7).

## 7. Open questions

- [ ] Are the section 3 formulas and defaults the right base, with overrides only where lore needs them?
- [ ] The telekinesis table in section 5: anything to change before it becomes the pattern?
- [ ] Should the old alignment spec's Force philosophies (Living Force, Unifying Force, Jedi orthodox, Sith passion and so on) carry into the new alignment system, for example as small modifiers to Light and Dark gains? They are not in the new spec yet.
- [ ] Sustained cost at 2 x tier per round: with a Knight's efficiency that is 1 to 3 pool points a round. Does that feel right for holding Valor or a barrier all fight, or should sustained abilities cost more?

Resolved on 2026-11-20: Choke is dark except a brief knockout, Grip and Crush are neutral, and Dimension Shift stays. The telekinesis table is accepted as the pattern. Holding abilities should be sustainable for long fights from senior Knight upward.
