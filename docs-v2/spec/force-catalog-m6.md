<!-- Exported 2026-11-21 from the claude.ai doc "SWRPG M6 — Force Ability Catalog Spec" (https://claude.ai/artifact/Hk5HFmY88zFae3j5NpxMaE, rev 48). The repo copy is the build reference; design changes go in the doc first, then re-export. -->

# SWRPG M6 — Force Ability Catalog Spec (draft for review)

Nov 20, 2026 · @Jared Wright

## 1. Summary

The catalog starts from `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md`, which lists about 140 Force abilities in 13 families and 14 lightsaber forms. Most entries already have a difficulty tier, alignment and prerequisites. What they lack are the M6 fields: costs, sustained or instant, free-use eligibility, learning class and alignment weight.

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
| Learning class | Manifestation, taught but can manifest, or ritual and lore-locked | How it is acquired |
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

## 4. Audit findings (first pass)

This pass checked the entries I had doubts about. Every other entry still gets checked during its family's pass. All fixes below are now in the lore file and the questions file (2026-11-20).

**Corrections:**

| Entry | Lore file said | Fixed to | Status |
| --- | --- | --- | --- |
| Dark Transfer | Developed by Darth Plagueis, a compassionate use shown by Abeloth | An ancient Sith technique credited to Karness Muur, creator of the rakghoul plague. Muur's essence in the Muur Talisman used Celeste Morne to begin healing Darth Krayt, which taught Krayt the technique. Cade Skywalker manifested it instinctively ([Wookieepedia](https://starwars.fandom.com/wiki/Dark_transfer)). Learning class: taught, can manifest | Done |
| Battle Meld (questions file) | Not available in 3,661 BBY | Available in every era as rare. Added to the lore file as Force Meld | Done |

**Missing abilities:**

| Ability | Placement | Source | Status |
| --- | --- | --- | --- |
| Force Concealment (Force stealth) | Defense family | [Wookieepedia: Force stealth](https://starwars.fandom.com/wiki/Force_stealth) | Added |
| Morichro | Body family, after Hibernation Trance | [Wookieepedia: Morichro (Legends)](https://starwars.fandom.com/wiki/Morichro/Legends) | Added |
| Force Meld | Defense family, after Battle Meditation | [Wookieepedia: Force-meld](https://starwars.fandom.com/wiki/Force-meld) | Added |
| Dominate Mind | Mental family, under Mind Trick | Wookieepedia "Mind trick" (Legends), via [Archivum mirror](https://starwars.archivum.wiki/article/force_illusion). No standalone page | Added |
| Mask (Sith Alchemy) | Under Sith Alchemy | [Archivum mirror of Wookieepedia](<https://starwars.archivum.wiki/article/Mask_(Sith_Alchemy)>). Created for the Wizards of the Coast roleplaying game by Gary M. Sarli | Added |

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
| Force Wind | Complex | Sustained | 5 per round | Yes | No | Taught | Dark, standard |
| Saber Throw | Complex | Instant | 25 | No | No | Taught, can manifest | Neutral |
| Telekinetic Barrage (Ballistakinesis, pending) | Complex | Instant | 25 | Yes | No | Taught, can manifest | Neutral |
| Force Wound | Complex (raised from Moderate) | Instant | 25 | No | No | Taught, can manifest | Dark, standard |
| Force Choke | Complex | Sustained | 5 per round | No | No | Taught, can manifest | Dark, standard. None for a brief knockout |
| Force Grip | Complex | Sustained | 5 per round | Yes | No | Taught, can manifest | Neutral |
| Kinetite | Complex | Instant | 25 | No | No | Taught | Neutral, dark if used to kill |
| Force Orb | Complex | Sustained | 5 per round | No | No | Taught | Neutral |
| Force Sphere | Complex | Sustained | 5 per round | No | No | Taught | Neutral |
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
- Lore check for this family: confirm Kinetite, Force Orb and Force Sphere sources during the pass.

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
| Force Heal (Self) | Complex | Instant per healing use | 25, scaled by wound severity | Never | Taught, can manifest | Light (see questions) |
| Force Valor | Complex | Sustained | 3 per round (override) | Never | Taught | Light |
| Battlemind (Mental family) | Complex | Sustained | 5 per round | Never | Taught, can manifest | Neutral (correction below) |
| Force Enrage (Dark family) | Moderate | Sustained | 3 per round | Never | Can manifest | Dark, standard |
| Hibernation Trance | Complex | Entry cost, then no upkeep | 25 to enter | Never | Taught | Neutral |
| Force Sustenance | Complex | Daily | 25 per day, in place of food | Never | Taught | Neutral |
| Crucitorn | Advanced | Sustained | 8 per round | Never | Taught | Neutral |
| Force Body | Advanced | Sustained, builds a fatigue debt | 8 per round | Never | Taught | Neutral |
| Morichro | Advanced | Self: entry cost. Others: instant, contested by Willpower | 40 | Never | Lore-locked | Light, forbidden |
| Force Cloak | Advanced | Sustained | 8 per round | Never | Taught (natural talent lowers the cost) | Neutral |

Longevity through the Force is passive and has no cost.

**Combat boosts are never free in a fight (agreed 2026-11-20).** Enhance Attribute and Force Speed bursts get a mastery price cut instead: at level 55 (Enhance Attribute) and level 70 (Force Speed), they cost half in combat and nothing outside it. Using them stays a choice in a duel, but a cheap one for a master. Force Jump keeps its normal free use at level 40, because it is movement rather than combat power.

**How the sustained boosts stack in a fight.** A Knight running Valor (3), Force Speed (3) and Remove Fatigue (3) pays 9 per round before efficiency, about 3.6 after. That is inside his usual draw rate, so long fights are sustainable, as agreed. Adding Battlemind and Force Body takes him past his upkeep slots and into real strain.

**Corrections found against Wookieepedia (all applied to the lore file 2026-11-20). Also decided: Force Heal (Self) stays light side, since dark-side healing is Dark Transfer; Morichro is classed light side; the entry-fee and daily cost models are accepted:**

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
| Force-flash | Basic | Instant | 10 | Level 40, against cameras only | Taught | Neutral |
| Force Resistance | Moderate | Passive, plus an active aura | Passive free; aura 3 per round | Passive always | Taught | Neutral |
| Energy Resistance | Moderate | Sustained | 3 per round | Never | Taught | Light leaning |
| Tutaminis | Complex (proposed down from Advanced) | Reactive, per absorbed attack | 25, scaled by the attack's size | Never | Taught | Light |
| Force Deflection | Complex | Reactive, per deflection | 25, scaled by the attack's size | Never | Taught | Neutral |
| Protection Bubble | Complex | Sustained; must be still to cast | 5 per round | Never | Taught | Neutral |
| Force Concealment | Complex | Sustained, per minute | 5 | Override: free from level 61 outside combat, half cost in combat | Taught | Neutral |
| Force Clouding | Complex | Sustained, per minute | 5 | Same override as Concealment | Lore-locked (Sith) | Dark, lesser |
| Force Scattering | Complex | Sustained, per minute | 5 | Never | Taught | Neutral |
| Force Suppression | Complex | Sustained, contested by Willpower and Force Resistance | 5 per round | Never | Taught | Neutral |
| Force Meld | Complex | Sustained (reserve spec rules) | Anchor 5 per round, each member 1 | Never | Taught | Light leaning |
| Force Absorb | Advanced (proposed up from Complex) | Reactive, per absorbed Force attack | 40, scaled by the attack's size | Never | Taught | Light |
| Force Breach | Advanced (proposed up from Complex) | Instant, contested | 40 | Never | Taught | Neutral |
| False Light Side Aura | Advanced | Ritual | 200, lasts until broken | Never | Lore-locked (Sith) | Dark, lesser |
| Sever Force | Advanced | Instant, contested | 40 | Never | Taught (rare) | Light (correction below) |
| Battle Meditation | Advanced | Sustained; scale class sets the cost for squads, armies and fleets | 8 per round | Never | Taught | Light |
| Electric Judgment | Advanced | Instant, or sustained as a stream | 40, or 8 per round | Never | Taught, can manifest | Light |
| Wall of Light | Advanced | Group effort; every participant pays | 8 per round each, needs several Jedi | Never | Taught | Light |

**Answering an energy attack (agreed 2026-11-20).** Tutaminis and Force Absorb give three choices when an energy or Force attack comes in, each paying the reactive cost:

1. **Absorb:** the pool refills by a share of what the attacker spent: 0.5 at base, rising with ability level to 0.8 at mastery, capped at the absorber's own draw.
2. **Redirect:** forgo absorption and send the attack back at the attacker, as Yoda did with Dooku's lightning. No pool gain.
3. **Release:** discharge absorbed energy as an outward burst, as Yoda did against Palpatine in the Senate. Absorbing more than the user can hold at once forces a release whether they want it or not.

**Corrections found against Wookieepedia (all applied to the lore file 2026-11-20, including the Tutaminis, Force Absorb and Force Breach tier changes and the Concealment free-use exception):**

| Entry | Lore file says | Wookieepedia (Legends) says | Proposed fix |
| --- | --- | --- | --- |
| Sever Force | Permanent and irreversible; dark if offensive | A non-lethal light side power that blocks the target's connection with a wall of light side energy. Odan-Urr called it the most powerful attack a Jedi could perform. Usually lasting, but not always permanent | Make it light side and usually lasting rather than always permanent. Destroying midi-chlorians (Plagueis) is a different method |
| Tutaminis | Advanced | Taught in the very first classes at Jedi academies; the basics are mastered by graduation, and it develops over a lifetime | Lower to Complex. Force Absorb becomes the advanced application |
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
| Force Vision | Advanced | Deliberate attempt: meditation, cost plus a check. Involuntary visions: story events, no cost | 40 per attempt | Never | Can manifest | Neutral |
| Shatterpoint | Advanced | Instant per read, × depth (combat ×1 up to event ×5), plus fixed focus strain (+0.05 to +0.25). Replaces the old 0.3 load; D-63 otherwise unchanged | 40 | Never | Taught, or innate (ShatterSense) | Neutral |

**Force Vision is mostly a story tool.** Wookieepedia calls visions extremely rare and uncontrollable: many meditate for one and few succeed. Involuntary visions are triggered by the engine and the AI as events, at no cost. Deliberate attempts cost pool and usually fail. The Skywalker line is noted as especially prone, which could be an innate talent that raises the chance.

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
| Other lightning variants | Complex | Instant | 25 | Taught | Standard |
| Force Drain | Complex | Instant, or sustained | 25, or 5 per round | Taught | Standard |
| Force Scream | Complex | Instant; usually involuntary | 25 | Can manifest | Standard |
| Waves of Darkness | Complex | Sustained | 5 per round | Lore-locked (Sith sorcery) | Standard |
| Dark Energy Trap | Complex | Instant per trap placed | 25 | Lore-locked (Sith sorcery) | Standard |
| Corruption | Complex | Instant | 25 | Taught | Standard |
| Cryokinesis | Complex | Instant | 25 | Taught | Standard |
| Force Storm (Lightning) | Advanced | Sustained; scale up to fleets | 8 per round | Taught | Severe |
| Force Maelstrom | Advanced | Sustained | 8 per round | Taught | Severe |
| Force Destruction | Advanced | Instant after a charge-up round | 40 | Taught | Severe |
| Deadly Sight | Advanced | Sustained gaze; hits everyone in view | 8 per round | Taught | Severe |
| Crush Opposition | Advanced | Sustained | 8 per round | Taught | Standard |
| Heart Stun | Advanced | Instant, contested | 40 | Taught | Standard |
| Consume Essence | Advanced | Sustained | 8 per round | Taught | Standard |
| Sutta Chwituskak | Advanced | Instant | 40 | Lore-locked (Sith sorcery) | Standard |
| Darkshear | Advanced | Instant, or sustained burst | 40, or 8 per round | Lore-locked (Sorcerers of Rhand) | Severe |
| Darksight (corrected below) | Advanced | Meditation | 40 per reading | Lore-locked (Rhand, Nightsisters) | Standard |
| Create Force Wraith | Advanced | Ritual | 200 | Lore-locked | Severe |
| Possession | Advanced | Ritual to seize, then sustained | 200, then 8 per round | Lore-locked | Severe |

**Two mechanics from the sources:**

- **Drain Force refills the pool.** Wookieepedia describes Force drain as a spectrum: drain life heals the user from a victim's vitality, and drain Force restores the user's Force energy from the victim's. Proposal: drain Force refills the pool by the same share as absorbing (0.5 rising to 0.8 with mastery). Consume Essence does the same from the death and anger around the user, as Maul did after Qui-Gon fell. These are the everyday dark-side versions of outside power.
- **Involuntary dark powers.** Force Scream and Hatred often happen without the user choosing. Proposal: the engine can trigger them at high strain, in a rage state, or in a lost fight, if the character knows them or has a high enough Dark score. They count as dark deeds.

**Corrections found against Wookieepedia (applied 2026-11-20, along with both mechanics and the Deadly Sight era rule):**

| Entry | Lore file says | Wookieepedia (Legends) says | Proposed fix |
| --- | --- | --- | --- |
| Darksight | Seeing by the dark side: in darkness, sensing nexuses and Sith artifacts | The Sorcerers of Rhand's name (the Nightsisters call it Heartshadow) for foreseeing possible futures and manipulating events to bring about the one that serves the Dark. Cronal learned it from the Rhandites | Rewrite completely as dark-side foresight and manipulation, lore-locked |
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
| Force Illusion | Advanced | Sustained; scale = range | 8 per round | No | Taught | Neutral |
| Dopplegänger (was Force Projection) | Advanced | Sustained | 8 per round | No | Taught | Neutral |
| Memory Rub | Advanced | Instant, contested | 40 | No | Taught | Neutral (non-consensual use judged) |
| Theran Force-listening | Advanced | Meditation | 40 per session | No | Lore-locked (Theran Listeners) | Neutral |

**Resistance.** Wookieepedia names species that resist mind tricks: Hutts, Toydarians, Falleen, Geonosians, Dashade, Yinchorri and Kloodavians. Nikto are unusually easy to trick. A cybernetic brain blocks it (Lobot), and so does a target who knows the trick is coming. Resistance raises the contest rather than making it impossible: Revan persuaded a Hutt, Luke couldn't.

**Illusions.** A Force illusion hits every sense, even cameras and cybernetic eyes, but barely touches Force users, Hutts or the Yuuzhan Vong. It can't make something vanish (that's Force Cloak). Masquerade, an illusion laid over the user's own face, is an application, not a separate power. The dark version is mindforms: Sith sorcery illusions (Naga Sadow, Aleema Keto, Nightsister illusion spells) that can wound a victim who believes in them. Mindforms need Sith Sorcery.

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Drain Knowledge | Merged into Mind Probe; old key `DrainKnowledge` resolves there | Wookieepedia: "the mind probe, also known as Drain Knowledge". The current entry (victim permanently loses the knowledge) has no source |
| Mind Probe | Tier Advanced → Complex; drop the "Sith Inquisitors" note; add users (Revan, Kreia, the Sith Emperor on Revan, Tyranus, Sidious, Vader, Jerec, Joruus C'baoth) | A common Sith interrogation tool, not a rare art. Revan also pushed Basic into The One's mind, so knowledge can go both ways |
| Force Projection | Renamed Dopplegänger (aliases Similfuturus, Force shadow, Force projection). Rewritten: a short-lived duplicate of the user or an object, seen by everyone and by droid sensors, which can absorb one attack and fades if the user is hurt | The Legends power is Darth Ramage's apparition (Jax Pavan learned it from his holocron), not a purely mental image. Users: Plagueis, Tyranus, Luke, Xesh |
| Force Phantom (knowledge family) | Rewritten as the Sith ritual: lifelike, physical apparitions built from another creature's siphoned life force and projected across space; the anchor creature dies when its phantom is destroyed. Dark, severe; lore-locked (Darth Vectivus, rediscovered by Lumiya and Alema Rar); needs Sith Sorcery. Ritual 200, then 8 per round | The current entry describes a Dopplegänger and cites Crait, which is Disney canon |
| Force Illusion | Prerequisite Force Projection removed (Mind Trick 41+ only); Dopplegänger now requires Force Illusion 21+; add the range note (up to thousands of kilometres, tiring at extreme range) | Wookieepedia calls projection "possibly a variation of Force illusion", so the order was backwards |
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
| Force Heal (Others) | Complex | Instant per treatment; scale = wound severity | 25 | No | Taught | Light |
| Revitalize | Complex | Instant | 25 | No | Taught | Light |
| Transfer Force | Complex | Instant, plus a Vitality toll on the giver | 25 | No | Taught | Light |
| Reduce Injury (new) | Complex | Instant reaction to a hit | 25 | No | Taught | Neutral |
| Voss healing ritual (new) | Complex | Ritual, shared among participants | 125 | No | Lore-locked (Voss healers) | Light |
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
| Force Stun | Moderate | Instant, contested | 15 | No | Taught | Light |
| Force Stasis | Complex | Sustained, contested | 5 per round | No | Taught | Light |
| Alter Environment | Complex | Instant or sustained; scale = area | 25, or 5 per round | No | Taught | Neutral |
| Ionize | Complex | Instant | 25 | No | Taught | Light leaning |
| Force Affliction | Complex | Instant, worsens over time | 25 | No | Taught | Dark, standard |
| Force Bond | Complex | Formed once (can form on its own); active draw 25 | 25 | n/a | Can manifest | Neutral |
| Life Bond | Complex | Formed once, permanent | 25 | n/a | Can manifest | Neutral |
| Purification (Crystal) | Complex | Meditation | 25 per session | No | Taught | Light |
| Mechu-deru | Complex | Instant, or sustained | 25, or 5 per round | No | Taught (rare) | Dark, standard |
| Force Scribe | Complex (was Basic) | Instant per inscription | 25 | No | Lore-locked (Fallanassi) | Neutral |
| Stasis Field | Advanced (was Complex) | Instant; scale counts targets | 40 | No | Taught (Knights and Masters) | Light |
| Force Plague | Advanced (split from Affliction) | Instant, worsens over time | 40 | No | Taught | Dark, standard |
| Electronic Manipulation | Advanced | Instant | 40 | No | Taught | Dark, lesser |
| Mind Walking | Advanced | Meditation | 40 per session | No | Lore-locked (Mind Walkers) | Neutral |
| Force Ghost | Advanced | Learned in life; used after death | none | n/a | Lore-locked, story event | Neutral (Sith variants dark) |
| Oneness | Advanced | Story event; surge past the pool ceiling | reserve spec | n/a | Story event | Light |

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
| Fold Space | Advanced | Instant; scale = mass and distance | 40 | Lore-locked (Aing-Tii; was Fallanassi) | Neutral |
| Force Travel | Advanced | Instant; scale = distance | 40 | Taught | Dark; weight grows with distance and unfamiliarity |
| Phase | Advanced | Sustained | 8 per round | Lore-locked (Killik memories; was Fallanassi) | Neutral (reaching into a body to kill is judged) |
| Dimension Shift | Advanced | Instant per object | 40 | Taught, can be rediscovered | Neutral |
| Art of the Small | Advanced | Meditation; sustained to hide | 40, or 8 per round | Taught | Neutral |
| Flow-Walking | Advanced | Meditation per walk | 40 | Lore-locked (Aing-Tii) | Neutral |
| Force Storm (Wormhole) | Advanced | Ritual; scale up to a planet | 200 | Lore-locked (Book of Anger, Darkstaff) | Dark, severe |

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Teleportation | Drop "almost no documented cases". Users: Vitiate, Darth Jadus, Dread Masters Tyrans and Raptus (your SWTOR era), Mother Talzin (as green mist), Abeloth, some of Palpatine's Force Adepts. A beginner moves about four feet; a master anywhere they can clearly see. Prerequisite ForceControl 81+ → 61+ | Wookieepedia: rare and costly, but well documented |
| Fold Space | Tradition Fallanassi → Aing-Tii (also called Transmigrate). Moves objects, or possibly oneself, instantly. Tadar'Ro taught Luke; Abeloth used it; Luke and Leia used it inside the Monolith. Application: Aura of Freedom, letting the user and nearby allies resist being moved by the Force | Wookieepedia. Force teleportation redirects here |
| Phase | No longer Fallanassi. Passing through walls and doors, or reaching into someone's body to deadly effect. An'ya Kuro used it; Bazel Warv used it under Force psychosis. Raynar Thul said the Killiks developed it while building the Maw; Leia suspected the Celestials. Drop "invisible to Force perception" | Wookieepedia |
| Flow-Walking | Remove Luke as a learner (Ben learned it and swore never to do it again). The past can't be changed (Caedus lied to Tahiri about that), but a walker can leave an imprint in the past, as Jacen did to link Leia to a crash site. Users must stay anchored or lose themselves in the flow. Drop "time-drifting" physical travel | Wookieepedia. Luke warns that the wanting behind it leads many to the dark side |
| Art of the Small | Credit Vergere (who named it), not Ood Bnar. Taught to Jacen Solo, Cilghal, Ben and Mara; Onimi used it to make toxins and control Shimrra; Allana Solo used it to hide. Took talented Knights a year or two. Uses: molecular healing, and hiding one's presence completely. Drop "hiding inside a living body" | Wookieepedia |
| Force Storm (Wormhole) | Prerequisite Force Lightning storm → mastery across disciplines (Telekinesis 61+, ForceSense 61+, ForceControl 91+, Dark Side 90+). Add the Darkstaff storm that threw Darth Rivan forward in time, Sidious recording it in the Book of Anger, and the storm that consumed him at Pinnacle Base | Wookieepedia: it "required mastery in many different Force disciplines" |
| Force Travel | Dark weight steps up with distance and unfamiliarity: a short hop somewhere familiar is standard; far or unfamiliar is severe | Wookieepedia: more corrupting the farther and less familiar the destination |

**Questions:**

1. Phase: lock it to Killik memories (Joining, or rediscovery like An'ya Kuro) now that it isn't Fallanassi?
2. Teleportation: lower the prerequisite to ForceControl 61+, since several SWTOR-era Sith used it?
3. Flow-Walking: allow Jacen's imprint trick as the only way to touch the past?
4. Force Travel: dark weight standard for short familiar hops, severe for far or unfamiliar ones?

All four questions approved on 2026-11-20. New alias for Claude Code: `ForceTeleportation` → Fold Space.

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
| Supernova | Advanced | Ritual, amplified by Sith crystals | 200; scale = a star | Lore-locked | Severe |
| Midi-chlorian Manipulation | Advanced | Ritual | 200 | Story event (Plagueis) | Severe |
| Essence Transfer | Advanced | Ritual; destroys the current body | 200 | Story event | Severe |
| Thought Bomb | Advanced | Group ritual of many Sith Lords; kills the casters | All participants' pools | Lore-locked (Revan's holocron) | Severe |

**Corrections** (applied 2026-11-20):

| Entry | Change | Why |
| --- | --- | --- |
| Shadowstrike | Dropped. On Wookieepedia it's a Ta-Ree spell of Kathol that lands blows without touching; the entry's dark lightsaber strike that cuts through Force barriers has no source | Out of scope, like Lessen injury |
| Sith Alchemy | Prerequisites ForceKnowledge 81+, Dark 80+ → 51+ and 40+, plus Sith teaching. Add the Je'daii version (Force alchemy at Anil Kesh, the Temple of Science: permitted, but it meant leaning into the dark side). Alignment "extreme drift" → standard per working, severe for Sithspawn | Wookieepedia: practised by Sorzus Syn onward and by many Sith alchemists, not a handful of masters. Mask already needs only 51 and 40 |
| Thought Bomb | Rewritten as a group ritual: the focused will of many unified Sith Lords. It annihilates every Force-sensitive in its radius, body and spirit, and traps their souls in an orb. Origin in Vitiate's Ritual of Nathema; Revan recorded it in his holocron, hidden on Lehon until Lord Kaan found it in 1000 BBY | Wookieepedia. The entry's single-user prerequisites don't fit |
| Summon Fear | Prerequisite adds Sith Sorcery 21+; effects by duration: short, the victim wakes with little memory; longer, coma with the mind destroyed; longest, death. Revan used it; Bane shook it off because he'd conquered his fears long before | Wookieepedia, "Summon fear" |
| Midi-chlorian Manipulation | Add: create, maintain or save life; Plagueis made creatures conceive alone and bypassed a Yinchorri's telepathic immunity. Mark "the Force made Anakin as a counterbalance" as in-universe speculation, not fact | Wookieepedia |
| Essence Transfer | Add: can go into an object as well as a body; ancient Sith haunted their tombs to possess intruders; later masters used clones (Palpatine). The ritual destroys the current body (Darth Andeddu) | Wookieepedia |
| Taint | Add: Luke beheading Lumiya in revenge tainted the place; tainting can mark a place so it seems the user is still there; it can seduce people to the dark side | Wookieepedia |
| Supernova | Add: Exar Kun; an uncontrolled core can kill the caster or chain-react (the Cron Cluster) | Wookieepedia |

**Questions:**

1. Drop Shadowstrike, since it's a Ta-Ree spell and the entry has no source?
2. Lower Sith Alchemy to ForceKnowledge 51+ and Dark 40+, with the Je'daii exception?
3. Thought Bomb as a group ritual of many Sith Lords, using Revan's holocron?
4. Keep the Anakin line about Midi-chlorian Manipulation only as in-universe speculation?

All four questions approved on 2026-11-20. On Anakin, Jared confirmed the Legends account and Wookieepedia agrees: Plagueis tried to impose his will on the Force to create a being, and the Force itself created Anakin in response, to end the Sith. Written as fact, not speculation. Shadowstrike is removed: Claude Code should list `Shadowstrike` as a rejected name.

## 5k. Lightsaber forms: draft

The last pass, drafted 2026-11-20 and checked against Wookieepedia Legends (mainly "Lightsaber combat" and "Form VII"). It does two things: fixes the form list, and settles the M6 form rules already recorded in architecture §15 (D-187 and the M5 findings). Forms draw no Force pool; their costs are in the combat spec, which stays as built.

**Form rules for M6:**

| Rule | Proposal | Lore and evidence |
| --- | --- | --- |
| Second-form growth | A secondary form's drill ceiling uses its own E plus half the main form's E (design default; Claude Code tunes it with the lifetime harness). Fighting in a secondary form during a duel earns E for that form | M5 measured second forms stalling: Obi-Wan's went from 51 to 53 over twenty years. Palpatine mastered all seven forms |
| Free form switch | Switching forms costs 0 advantage when both forms are 61+ (Master tier); the M5 switch cost applies below that | Palpatine and Dooku moved between forms fluidly |
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

**Zero-G confirmed (look-over item 6, 2026-11-21):** zero or low gravity is an environment modifier, a penalty that training in it reduces; it is not a form. Converting the code's `zeroG` form (its drill, matchup and terrain entry) and migrating saves is an integration item, not a spec change.

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
- `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md`: correct Dark Transfer and add the missing entries. This is the source of truth, so the fixes go here first.
- `docs-v2/spec/alignment.md`: the existing v1 alignment spec (one scale from -100 to +100 with dark pressure and philosophies). The new alignment spec replaces it. Its philosophy offsets might be worth keeping (section 7).

## 7. Open questions

- [ ] Are the section 3 formulas and defaults the right base, with overrides only where lore needs them?
- [ ] The telekinesis table in section 5: anything to change before it becomes the pattern?
- [ ] Should the old alignment spec's Force philosophies (Living Force, Unifying Force, Jedi orthodox, Sith passion and so on) carry into the new alignment system, for example as small modifiers to Light and Dark gains? They are not in the new spec yet.
- [ ] Sustained cost at 2 x tier per round: with a Knight's efficiency that is 1 to 3 pool points a round. Does that feel right for holding Valor or a barrier all fight, or should sustained abilities cost more?

Resolved on 2026-11-20: Choke is dark except a brief knockout, Grip and Crush are neutral, and Dimension Shift stays. The telekinesis table is accepted as the pattern. Holding abilities should be sustainable for long fights from senior Knight upward.
