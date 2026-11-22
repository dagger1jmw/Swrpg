# Star Wars Legends RPG — Force Abilities & Lightsaber Forms Master List v3.0 (Complete)

> **What's new in v3:** ForceOutput and Intelligence stats added to the system. Proficiency system for sub-abilities added with math grounded in the existing `100 × 1.07^n` XP curve. Anchor stat annotations added to each ability family and sub-ability. Difficulty tier annotations added to sub-abilities. JS implementation spec added at the end.
>
> **v3 Complete edition:** All v2 ability summaries, notes, and sections fully merged. Single canonical reference — no external lookups needed.

This document is the canonical reference for all learnable abilities in the game.
Use this to keep the AI and simulation system consistent. Add new entries as the game expands.

**Alignment Key:** 🔵 Light Side · 🔴 Dark Side · ⚪ Neutral/Universal
**Restriction Key:** ⚠️ Era/Faction/Person locked · 🔒 Requires specific prerequisite chain

---

## STAT SYSTEM (v3 — full stat list)

### Core Stats (characterSheet.stats)
| Stat | Description |
|---|---|
| `strength` | Physical power — raw muscle, melee force, carrying capacity |
| `agility` | Speed, reflexes, coordination, acrobatics |
| `endurance` | Stamina, pain tolerance, strain resistance |
| `willpower` | Mental resolve, resistance to dark side, emotional fortitude |
| `charisma` | Social influence, presence, leadership |
| `intelligence` | **[NEW v3]** Reasoning, tactical acumen, learning speed, cunning. Distinct from Willpower (resolve), Charisma (social), and ForceKnowledge (Force lore). Key for strategists, investigators, scholars. Primary training paths: study, analysis, simulation. |

### Force Stats (characterSheet.forceStats)
| Stat | Description |
|---|---|
| `forceSense` | Perception through the Force — danger sense, life detection, empathy, precognition |
| `meditation` | Inner attunement — battle meditation, Force-trance, calm under pressure, healing trance |
| `forceKnowledge` | Breadth and depth of Force technique lore — theory, history, esoteric arts |
| `forceControl` | Precision and finesse — how honed and refined the application of the Force is |
| `forceOutput` | **[NEW v3]** Raw power and magnitude — how much Force energy can be channeled or unleashed at once |

> **The Output/Control distinction is critical.** A raw powerhouse has high Output but low Control; a refined master has high Control but potentially moderate Output. Training them independently produces genuinely different characters:
> - Force Repulse, Force Lightning, Force Storm → scale primarily with **ForceOutput**
> - Force Choke, Force Levitation, Force Stasis, precise telekinesis → scale primarily with **ForceControl**
> - Most abilities use a weighted blend of both

---

## PROFICIENCY SYSTEM (v3)

### Why it exists
Each Force ability family (Telekinesis, Force Lightning, etc.) has a **base ability level** tracked in `masterXP.forceAbilities`. Sub-applications (Force Push, Force Choke, Chain Lightning, etc.) share the same family foundation. But a character with 94 Force Lightning shouldn't automatically be expert at Force Storm just because they unlocked it. Sub-ability **proficiency** represents how much deliberate practice you've put into that specific application.

### Storage format
```
masterXP.forceAbilityProficiency = {
  "ForceLightning.ForceShock":    { totalProfXP: 0 },
  "ForceLightning.ChainLightning":{ totalProfXP: 0 },
  "ForceLightning.ForceStorm":    { totalProfXP: 0 },
  "Telekinesis.ForcePush":        { totalProfXP: 0 },
  ...
}
```
Keys are `"ParentAbility.SubAbility"`. Proficiency percentage (0–100%) is always **derived** from totalProfXP — never stored directly.

### The proficiency cost curve
Uses the same `1.07` exponential base as the main XP system, tuned for a 0–100% range:

```javascript
function profCostPerPoint(pct, D) {
  // pct = current percentage (0-99)
  // D = difficulty multiplier (1.0 / 1.5 / 2.5 / 4.0)
  return Math.floor(D * 20 * Math.pow(1.07, pct * 0.8));
}

function deriveProficiency(totalProfXP, D) {
  let pct = 0;
  let remaining = Math.max(0, totalProfXP);
  while (pct < 100) {
    const cost = profCostPerPoint(pct, D);
    if (remaining < cost) break;
    remaining -= cost;
    pct++;
  }
  return {
    percentage: pct,
    current: Math.round(remaining),
    required: pct < 100 ? profCostPerPoint(pct, D) : 0
  };
}
```

### Total investment by difficulty
| Difficulty | D value | Total XP (0→100%) | Equivalent base-ability milestone |
|---|---|---|---|
| **Basic** | 1.0 | ~81,700 XP | Same as reaching base ability **level 60** |
| **Moderate** | 1.5 | ~122,550 XP | Same as reaching base ability **level 67** |
| **Complex** | 2.5 | ~204,250 XP | Same as reaching base ability **level 73** |
| **Advanced** | 4.0 | ~326,800 XP | Same as reaching base ability **level 80** |

**What this means in practice** (supervised training at standard intensity = 15 XP/hour):
- 0% → Novice (25%) at D=1.0: **~680 hours** ≈ 4–6 months of regular practice
- 0% → Journeyman (70%) at D=4.0: **~4,000+ hours** ≈ several years of dedicated work
- Mastery (90%+) of any sub-ability is a genuine multi-year achievement

### Proficiency tiers
| Range | Tier | What it means |
|---|---|---|
| 0–25% | **Novice** | Unlocked; functional but rough. High Strain cost, imprecise results, risk of collateral. |
| 26–50% | **Developing** | Getting reliable results; Strain starts normalizing. |
| 51–70% | **Proficient** | Solid combat utility; controlled execution; Strain near baseline. |
| 71–90% | **Expert** | Refined application; Strain significantly reduced; results consistently precise. |
| 91–100% | **Mastered** | Near-perfect expression; minimum Strain; the ability is a genuine signature. |

### Two discount factors that reward doing the groundwork

**1. Base Ability Factor**
| Base Ability Level | Cost Multiplier |
|---|---|
| 0–19 | ×1.00 (no discount) |
| 20–39 | ×0.90 |
| 40–59 | ×0.75 |
| 60–79 | ×0.60 |
| 80–100 | ×0.50 |

**2. ForceControl Factor**
| ForceControl | Cost Multiplier |
|---|---|
| 0–19 | ×1.25 (harder) |
| 20–39 | ×1.10 |
| 40–59 | ×1.00 (baseline) |
| 60–79 | ×0.85 |
| 80–100 | ×0.70 |

**Applying the factors:** When awarding proficiency XP from a training session, multiply the session's contribution by `1 / (BaseAbilityFactor × ControlFactor)`. A session that normally contributes 15 XP toward proficiency, with base ability at 65 (factor 0.60) and ForceControl at 70 (factor 0.85), actually contributes `15 / (0.60 × 0.85) = 29.4 XP`.

### Soft cap
| Base Ability Level | Max Effective Proficiency |
|---|---|
| 0–20 | 25% |
| 21–40 | 50% |
| 41–60 | 70% |
| 61–80 | 85% |
| 81–100 | 100% |

### Trickle rates
- **Training base ability → sub-ability proficiency:** Each training session on the parent ability grants **5% of base XP earned as proficiency XP** to all *already-unlocked* sub-abilities.
- **Training a sub-ability → base ability:** Each dedicated sub-ability session grants **20% of proficiency XP earned back to the base ability** as regular XP (capped at the base ability's `xpRequired` for the current level).

### For NPC character sheets
NPCs don't track proficiency numerically. Use the tier label instead:
```
Force Lightning   (94)  [ForceOutput anchor]
  Force Shock       ● Expert
  Chain Lightning   ● Proficient
  Force Storm       ◌ Novice
```

---

## LIGHTSABER FORMS

| Key (masterXP path) | Display Name | Tradition | Style | Difficulty |
|---|---|---|---|---|
| `ShiiCho` | Shii-Cho (Form I) | Universal | Wide sweeping strikes, disarming | Beginner |
| `Makashi` | Makashi (Form II) | Jedi / Sith | Precise dueling, footwork-centred, minimal energy expenditure | Intermediate |
| `Soresu` | Soresu (Form III) | Jedi origin; also Sith | Defensive, deflection focus | Intermediate |
| `Ataru` | Ataru (Form IV) | Jedi origin; also Sith | Acrobatic, aggressive, Force-enhanced | Intermediate |
| `ShienDjemSo` | Shien / Djem So (Form V) | Jedi / Sith | Power strikes, counter-attack | Intermediate |
| `Niman` | Niman (Form VI) | Jedi origin; also Sith | Balanced, Force integration | Beginner (easy to learn; at least ten years to master) |
| `Juyo` | Juyo (Form VII) | Jedi / Sith | Ferocious, unpredictable | Advanced (restricted for Jedi in later eras) |
| `JuyoKos` | Juyo-Kos (Juyo variant) | Jedi | Juyo refinement (Great Galactic War era) | Advanced (restricted like Juyo; review) |
| `Vaapad` | Vaapad (Form VII variant) | Jedi | Channels darkness, requires mastery | Advanced / Lore-locked |
| `Trakat` | Tràkata | Neutral | Blade deactivation feints | Advanced |
| `JarKai` | Jar'Kai | Neutral | Dual-blade coordination | Advanced |
| `Sokan` | Sokan | Jedi origin; also Sith | Terrain principle, mobility | Advanced |
| `DunMoch` | Dun Möch | Sith-leaning | Psychological warfare + combat | Restricted |
| `DoubleBlade` | Saberstaff (Double-bladed) | Neutral | Extended weapon, spinning defense | Advanced |
| `TKSaber` | Telekinetic Lightsaber Combat | Neutral | Sabers wielded by telekinesis | Advanced |
| `Lightwhip` | Lightwhip Combat | Neutral | Flexible energy whip, long reach | Advanced |
| `SaberPike` | Lightsaber Pike Combat | Neutral | Polearm reach and leverage | Advanced |
| `StrongStyle` | Strong Style (outer ring) | New Jedi Order era | Wide power strikes | Intermediate (era-locked) |
| `MediumStyle` | Medium Style (middle ring) | New Jedi Order era | Balanced; usually taught first | Beginner (era-locked) |
| `FastStyle` | Fast Style (inner ring) | New Jedi Order era | Quick chained cuts, blaster defense | Intermediate (era-locked) |

### Form Notes

**Learning class (2026-11-20):** every form is Taught, except Vaapad (Lore-locked: a teacher or the recovered records, see the Vaapad note), the Strong, Medium and Fast styles (era-locked to the New Jedi Order), and Dun Möch (Sith teaching). Learning classes are Taught, Can manifest, Lore-locked and Story event; lore-locked and story-event entries are gated by story flags (Q50), and stat prerequisites stay numeric.

**Shii-Cho (Form I):** The oldest and most fundamental form. Broad, sweeping strikes designed to disarm multiple opponents. Emphasizes wide coverage over precision. All characters begin here — solo practice unlocks at stat ≥ 15.

**Makashi (Form II):** Elegant dueling form developed as a direct counter to other lightsaber wielders. Footwork-centred, with maximum precision and minimal energy expenditure; low physical demand. Count Dooku was its best-known master; practitioners often used curved hilts built for it. Asajj Ventress used it (skilled, not a master), often with two blades. (Corrected 2026-11-21, lore batch 10: the 2026-11-20 removal of Ventress is reversed; "minimal footwork" and the unsourced "high mental and willpower requirements" are removed.)

**Soresu (Form III):** The most defensive of all forms. Tight, economical movements designed to deflect blaster bolts and weather overwhelming attacks. Emphasizes endurance and patience. Mastered by Obi-Wan Kenobi.

**Ataru (Form IV):** Highly acrobatic, Force-augmented form emphasizing speed and aggression. Devastating in open spaces but exhausting and impractical in confined areas. Used by Yoda and Qui-Gon Jinn.

**Shien / Djem So (Form V):** Two related sub-variants — Shien optimizes blaster deflection back at shooters; Djem So emphasizes powerful, dominating saber strikes. Both are strength-focused counter-attacking forms. Used by Anakin Skywalker and Darth Vader.

**Niman (Form VI):** The "diplomat's form" — a moderate blend of Forms I, III, IV and V integrated with Force use. Allows Force powers to be woven seamlessly into combat. Its named weaknesses: relaxed bladework, and most Niman users find it almost impossible to beat a Makashi user. Easy to learn, but at least ten years to master (Cin Drallig). Deadly once truly mastered, as Exar Kun showed; Darth Maul and Anakin used it as a second form; Revan is named as a user in one uncited sentence [unclear]. Began as the Kashi Mer dual-blade style of the Royale Macheteros, adopted by the Legions of Lettow and then refined by the Jedi (a minority version has it developed from Jar'Kai). (Corrected 2026-11-21, lore batch 10.) (Corrected 2026-11-20: Kit Fisto removed; he was a Shii-Cho master.)

**Juyo (Form VII):** The most vicious and unpredictable form, drawing on a deep emotional link to fuel attacks ("seemingly unconnected staccato sequences": Cin Drallig). High mental strain. Dangerous to the practitioner's alignment. Era note: in the Old Republic era it was practised by Jedi Masters Kavar, Zez-Kai Ell and Vrook Lamar; it was available to Jedi then, but only to students their teacher judged steady, and its status swung between frowned-upon and taboo. After the New Sith Wars, Skarch Vaunk hand-picked a few students a year; in the Clone Wars, Drallig refused to teach Anakin. Sith and Dark Jedi use it without reservation (Darth Maul; the Dark Jedi Galen Marek). Before the late Republic, "Vaapad" is an old name for Juyo. (Corrected 2026-11-20 and 2026-11-21, lore batch 10.)

**Vaapad (Form VII variant):** ⚠️ **Lore-locked.** Created by Mace Windu and Sora Bulq late in the Republic; Depa Billaba and Quinlan Vos also used it. The Vaapad technique doesn't exist before then: in the New Sith Wars "Vaapad" is an old name for Form VII, an alias of Juyo (*Book of Sith*, *Path of Destruction*, reconciled by *Star Wars Insider* 92; Karpyshyn's typo comment is [BTS]). **Gate: a teacher or records.** Teacher: Windu, with his personal permission; Sora Bulq, unsanctioned (learning from him carries a corruption risk); or any living Vaapad master (Billaba, Vos while alive, or a character who has mastered it). Records: from the New Jedi Order onward, the recovered records (*The Jedi Path*, the Great Holocron), preserved into the Legacy era. Light Side only, requires Juyo 61+. (Corrected 2026-11-20: was "Prequel Era only; requires Mace Windu alive".) A refined variant of Juyo that channels the practitioner's own darkness *and* the opponent's dark side energy back through the blade (one half of a "superconducting loop" with the darkness in the foe). Billaba became a master of it; Vos completed his mastery at Saleucami; Windu was its last master only after Bulq and Billaba died. Attempting without guidance risks rapid Dark Side corruption. (Corrected 2026-11-21, lore batch 10: the unsourced Yoda quote and "only Windu mastered it" are removed.)

**Tràkata:** Neutral technique of deactivating and reactivating the blade mid-combat to feint and confuse opponents. Not a full form — functions as a supplemental style layered onto another form. Some traditionalists consider it dishonorable: the Jedi avoided it because it relies on deception, and the Sith struggled with it because it needs calm tactics rather than rage.

**Jar'Kai:** Dual-blade fighting style. Not a single form but a coordinated system for wielding two sabers simultaneously, drawing on multiple form disciplines. Requires two forms each at Apprentice (21+). Developed by the Yovshin Swordsmen and named for the city of Jar'Kai on Atrisia, where the first dueling sabers were made.

**Sokan:** More a principle than a true form, developed by Jedi Knights during the Great Hyperspace War: using terrain — ledges, cover, elevation — and quick tumbling to close distance and force opponents into bad positions (Obi-Wan's high ground on Mustafar). Before the Clone Wars, practitioners folded in Ataru's kinetic elements.

**Dun Möch:** 🔴 Restricted Sith technique combining combat with psychological warfare — taunts that expose an opponent's inner doubts and break their concentration. Done properly it needs patience and control, rare among the Sith; Darth Bane's defeat of Sirak at the Korriban academy is a classic example. Causes Dark Side drift on use. A Sith doctrine; Jedi use is rare and debated. (Corrected 2026-11-21, lore batch 10.)

**Zero-G Combat:** Removed as a form 2026-11-20 (Legends has no such form). Zero or low gravity is an environment modifier that training in it reduces; the old key `ZeroGravity` becomes that training.

**Saberstaff (Double-bladed):** Requires separate weapon. Spinning defense and wide-area coverage. High difficulty. Associated with Darth Maul and Zabrak culture. Requires DoubleBlade ≥ 10 before the second blade can be activated in combat. Wide coverage, and surprise against foes with no experience of it: so few understand it that few know how to fight against it. Styles built on power or penetration are hard to apply with it, and elaborate flourishes leave the user open. A damage bonus applies only to thrown saberstaffs. Invented by Sith Lords; Exar Kun is the first recorded user. (Corrected 2026-11-21, lore batch 10.)

**Telekinetic Lightsaber Combat:** Wielding lightsabers by telekinesis: range stops mattering and several sabers at once become possible. Extremely difficult; requires Telekinesis 41+ and grows with it. The saber throw is its basic form; its sourced peak is Darth Traya wielding at least three sabers against Meetra Surik. (Corrected 2026-11-21, lore batch 10.) (Added 2026-11-20.)

**Lightwhip Combat:** A rare, exotic weapon wielded like a whip: reach of several meters, and it flexes around a parrying blade. Duelists trained for an energy blade or a solid weapon are not ready for one that is both (Lumiya). (Added 2026-11-20.)

**Lightsaber Pike Combat:** A lightsaber on a long shaft of lightsaber-resistant alloy such as phrik: much greater reach, the shaft blocks strikes, and the long handle gives leverage for power attacks. The double-bladed Temple Guard pike fights like a saberstaff; the polearm type has no stated weaknesses. (Corrected 2026-11-21, lore batch 10.) (Added 2026-11-20.)

**Strong, Medium and Fast Styles (New Jedi Order):** ⚠️ **Era-locked:** available once Luke Skywalker founds the New Jedi Order; this is how early New Jedi Order students learn. With so much of the old Order's knowledge lost, Luke's new Order had to essentially start lightsaber combat from scratch: Kam Solusar (trained by Palpatine's Dark Side Elite) taught the students the three rings of defense, the outer, middle and inner rings that these styles are named for, and Corran Horn added unarmed technique. The strong style was also used by Dark Jedi of the era such as Desann and the Disciples of Ragnos. (Era lock set 2026-11-20; Wookieepedia, "Lightsaber combat", Redevelopment section.) Strong (outer ring): wide, powerful strikes that batter through defenses and win blade locks, but slow and poor against blasters. Medium (middle ring): a balance of speed and power, usually taught first, a foundation for other forms; based on Niman. Fast (inner ring): short, quick cuts chained almost indefinitely, the best blaster defense of the three, strong with Force Speed, but light on power and short on reach. Users: Kyle Katarn, Jaden Korr.

**Notes only (not learnable forms):** Trispzest, S'kytri aerial combat blending Form VII with flight (Kharys), open to characters who fly or levitate (S'kytri; the legless, levitating Dark Jedi Maw); Form "Zero", the ethic of knowing when not to draw the saber, named by Skarch Vaunk in *The Jedi Path* and supported by Yoda (Kyle Katarn taught a version in the New Jedi Order); Lus-ma, an obscure style Dooku taught Grievous and the MagnaGuards; su ma, Ataru's spins, somersaults and cartwheels.

**Juyo-Kos (added 2026-11-21, lore batch 10):** a Jedi refinement of Juyo from the Great Galactic War (SWTOR era); Jaric Kaedan was its named master ("a living weapon"). Jedi only, restricted like Juyo. Thin source: playable, marked review.

**Reverse Shien grip (added 2026-11-21):** a Form V variant with the hilt held backward for long sweeping strikes against several foes; rare. Users: Revan, Quinlan Vos, Adi Gallia, Ahsoka Tano, Galen Marek; favoured by Palpatine's Saber Guard. Also the Jensaarai's style.

**NPC lore notes (added 2026-11-21; for those NPCs' fighting descriptions only):** personal Form V variants: Bane's hyper-aggressive Djem So, Zannah's purely offensive Djem So, Vader's post-Mustafar variant with Juyo and Makashi elements. Kas'im's secret two-saber Ataru (he called Jar'Kai flawed).

**Praetoria Vonil and Praetoria Ishu (added 2026-11-21):** offensive and defensive team styles unique to the Imperial Knights (Legacy era), learned in addition to the classical forms; gated to the Imperial Knights tradition.

**Three rings of defense (added 2026-11-21):** the technique layer under the New Jedi Order's Strong, Medium and Fast styles: the outer ring (four diagonal guards), the middle ring (right-angle guards, good for blast deflection) and the inner ring (navel guard; parry, then counter). Narrator flavour on the existing style mechanics; no new mechanics.

**Mounted lightsaber combat (added 2026-11-21):** a technique note. One-handed; low lunges and diagonal slashes from height; the rider must protect the mount; studied in the Temple.

**Cross-references:** saber variants (shoto, curved hilt and lightfoil, crossguard, dual-phase, training saber, protosaber, long-handle saber) are in SW_Lightsaber_WeaponVariants_AllEras.md; sub-group styles that meet sabers (Teräs Käsi, Echani, Matukai, Jensaarai, Zeison Sha, Mandalorian methods, Sith swords) are in SW_Lightsaber_SubgroupStyles_AllEras.md.

#### Named maneuvers (added 2026-11-21, lore batch 10)

Flavour names on existing actions for the narrator; no new mechanics in M6 (signature-move effects are an M7 question).

| Form or technique | Alternative names | Named moves |
|---|---|---|
| Shii-Cho (Form I) | Way of the Sarlacc; Determination Form | Sarlacc Sweep; Disarming Slash |
| Makashi (Form II) | Way of the Ysalamiri; Contention Form | Contentious opportunity; Makashi riposte |
| Soresu (Form III) | Way of the Mynock; Resilience Form | Deflecting slash; circle of shelter |
| Ataru (Form IV) | Way of the Hawk-Bat; Aggression Form | Hawk-Bat Swoop; Saber Swarm; su ma (jung su ma spin, ton su ma somersault, en su ma cartwheel) |
| Shien / Djem So (Form V) | Way of the Krayt Dragon; Perseverance Form | Barrier of Blades; Shien Deflection; Falling Avalanche; Fluid Riposte |
| Niman (Form VI) | Way of the Rancor; Moderation Form | Draw Closer; pushing slash |
| Juyo (Form VII) | Way of the Vornskr; Ferocity Form | Assured Strike; Vornskr's Ferocity; Swift Flank; Tempered Aggression |
| Tràkata | — | Pass the Blade; Unbalancing Block; Flash Slash |
| Sokan | — | High Ground Defense; Unhindered Charge |
| Jar'Kai | — | Rising Whirlwind; Twin Strike |
| Basic moves | — | Jung; jung ma; shun; sai; Flowing Water; Falling Leaf; dulon; kai-kan |
| Ready stances | — | Jedi Ready; Defensive Neutral; Offensive Neutral; Center of Being |

### Form Rules (M6, 2026-11-20)

- **Second-form growth:** a secondary form's drill ceiling uses its own E plus half the main form's E (design default, tuned with the lifetime harness), and fighting in a secondary form during a duel earns E for that form. Fixes the measured stall (Obi-Wan's second form 51 → 53 over twenty years).
- **Free form switch:** switching forms costs 0 advantage when both forms are 61+ (Sidious was a master of all seven forms). Below that, the M5 switch cost applies.
- **Cleave:** while fighting in Shii-Cho or Shien at 41+ against a group, the fighter keeps the advantage after taking out a minion. Shii-Cho was specialized for multiple opponents; Shien was built for Jedi who were often outnumbered.
- **Makashi precision:** while fighting in Makashi, the aimed-strike penalty shrinks from −2 at 0 to none at 61+ (D-187).
- **Marks of contact:** every Jedi form uses the same marks. Each targeting mark is a learnable technique that lowers the aimed-strike penalty for its own target from −2 toward 0 with technique skill.

| Mark | Meaning | Game use |
|---|---|---|
| Sun djem | Disarming the opponent, usually without harming them (Shii-Cho's Disarming Slash) | Disarm action |
| Shiim | A minor wound from the blade's edge, anywhere on the body | No aiming needed |
| Cho mai | Cutting off the weapon hand | Aimed: hand |
| Cho sun | Cutting off the weapon arm | Aimed: arm |
| Cho mok | Cutting off a limb | Aimed: limb |
| Shiak | A stab | Aimed: torso |
| Sai cha | Beheading, a sideswipe at side and neck (zones 2 and 3) | Aimed: head |
| Sai tok | Cutting the opponent in half, usually at the waist | Aimed: torso, higher difficulty |
| Mou kei | A circular cut at several major limbs | One aimed strike hits two limbs, higher difficulty |

**Source:** Wookieepedia (Legends), "Lightsaber combat": https://starwars.fandom.com/wiki/Lightsaber_combat/Legends; "Form VII": https://starwars.fandom.com/wiki/Form_VII/Legends

---

## FORCE ABILITIES

---

### ⚪ TELEKINESIS FAMILY
*Moving objects and people with the Force. The foundational active ability — almost everything physical in the Force traces back here.*
**Anchor Stats:** Burst sub-abilities (Push, Wave, Repulse) → **ForceOutput** primary. Sustained/precise sub-abilities (Choke, Levitation) → **ForceControl** primary. Directional (Pull, Throw) → blend of both.

---

#### Telekinesis ⚪
**Summary:** The ability to move objects with the mind. Ranges from nudging small items to hurling massive structures. The root ability from which most physical Force powers branch.
**Alignment:** Neutral
**Prerequisites:** ForceControl 5+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Foundational. Must be learned before any sub-application below.

> **Sub-applications (all require Telekinesis as root):**

---

#### ↳ Force Push ⚪
**Anchor Stat:** ForceOutput (magnitude of push) + ForceControl (direction/precision)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** A directed burst of telekinetic force that repels a target away from the user. One of the most commonly used combat applications.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 10+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Can be used defensively (deflecting attacks) or offensively (throwing enemies off ledges, creating space).

---

#### ↳ Force Pull ⚪
**Anchor Stat:** ForceControl (precision of grip and vector)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** The inverse of Force Push — draws a target toward the user. Used to disarm opponents, retrieve objects, or drag enemies into melee range.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 10+
**Learning class:** Can manifest (develops on its own, without a teacher)

---

#### ↳ Force Throw ⚪
**Anchor Stat:** ForceOutput (velocity) + ForceControl (targeting)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Grabs an object (or person) and hurls it as a projectile at high velocity. More controlled than Push but requires locking onto a specific object first.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 15+
**Learning class:** Can manifest (develops on its own, without a teacher)

---

#### ↳ Force Levitation ⚪
**Anchor Stat:** ForceControl (sustained precision)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Sustained lifting and precise positioning of heavy or large objects. Requires continuous concentration unlike the burst applications of Push/Pull.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 21+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** High Force Strain from sustained concentration. Commonly used in training (levitating rocks) and construction/utility contexts.

---

#### ↳ Force Wave ⚪
**Anchor Stat:** ForceOutput (the burst power is the whole point)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** An omnidirectional pulse of telekinetic force radiating outward from the user, pushing everything in a wide arc simultaneously.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 21+, ForceControl 15+
**Learning class:** Taught, can manifest
**Notes:** Less precise than Push but covers a full area. Useful against multiple opponents.

---

#### ↳ Force Whirlwind ⚪
**Anchor Stat:** ForceControl (sustaining the vortex precisely)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Telekinetically generates a cyclone of air and debris around a target, trapping them in a spinning vortex. Can incapacitate without direct contact.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 30+, ForceControl 20+
**Learning class:** Taught, can manifest
**Notes:** High Strain. Requires sustained concentration to maintain.

---

#### ↳ Saber Throw ⚪
**Anchor Stat:** ForceControl (guiding flight path) + ForceSense (awareness of the arc)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** The user telekinetically throws their lightsaber in a guided arc, controlling its flight path and returning it to hand. A precise and distinctive technique.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 15+, any lightsaber form 10+
**Learning class:** Taught, can manifest
**Notes:** The saber can be guided around obstacles. Leaves the user temporarily unarmed — high risk, high reward. Protosabers (corded to a power pack) cannot be thrown. (Corrected 2026-11-21, lore batch 10.)

---

#### ↳ Saber Barrier ⚪
**Anchor Stat:** ForceControl (maintaining multiple blades in a defensive pattern simultaneously)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Multiple lightsabers held telekinetically as a defensive screen of spinning blades.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 30+, any lightsaber form 21+
**Learning class:** Taught
**Notes:** Extremely high Force Strain to maintain. Requires multiple sabers (Mace Windu with one is the sourced exception). (Corrected 2026-11-21, lore batch 10.)

---

#### ↳ Telekinetic Lightsaber Combat ⚪
**Anchor Stat:** ForceControl (split attention between combat awareness and fine TK)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Fighting with a lightsaber entirely through telekinesis — the user's hand never touches the hilt. The saber flies freely under mental direction.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 41+, any lightsaber form 30+
**Learning class:** Taught
**Notes:** Master-tier technique. Requires splitting concentration between combat awareness and fine telekinetic control simultaneously.

---

#### ↳ Ballistakinesis ⚪
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Using telekinesis to accelerate a handful of small objects to lethal speed. Not especially accurate, but when blanketing an area with debris accuracy matters little. Evasion is possible but difficult.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 41+
**Learning class:** Taught, can manifest
**Notes:** Wookieepedia names the Jensaarai as users, but it is not limited to them: it matches one of the first Jedi Sage abilities in Star Wars: The Old Republic, under a different name. Formerly listed as Telekinetic Barrage (the old key resolves here). (Reviewed 2026-11-20, Wookieepedia audit.)
**Source:** Wookieepedia (Legends), "Ballistakinesis": https://starwars.fandom.com/wiki/Ballistakinesis
---

#### ↳ Force Repulse ⚪
**Anchor Stat:** ForceOutput (this is a pure power burst — the larger, the more destructive)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An explosive burst of telekinetic energy released from the user's own body, violently repelling everything nearby.
**Alignment:** Neutral (lethal intent edges toward Dark)
**Prerequisites:** Telekinesis 61+
**Learning class:** Taught, can manifest
**Notes:** Galen Marek's signature. One of the clearest Output-dominant abilities in the game — low proficiency + high Output = powerful but indiscriminate; high proficiency adds containment and direction. Strain at Novice proficiency is extreme; at Mastered it becomes (merely) very high.

---

#### ↳ Force Wound → Force Rend 🔴  *(dark line — harmful intent)*
**Anchor Stat:** ForceControl + ForceOutput
**Difficulty Tier:** Wound D=2.5 · Rend D=4.0 *(Wound raised from 1.5 on 2026-11-20)*
**Summary:**
- *Force Wound:* Telekinetically constricts a target's internal organs or musculature, causing immediate pain and debilitation without contact. The intent is specifically to harm living tissue — this is what makes it dark side.
- *Force Rend:* Telekinetically tears a target or object apart at near-molecular level. Exceedingly rare, Sith-only. The lethal endpoint of the dark wound line.
**Alignment:** 🔴 Dark Side. The defining quality is intent to damage living tissue — not the technique itself, but the purpose.
**Prerequisites:** Force Wound: Telekinesis 21+, Dark Side 1+ · Force Rend: Force Wound 30+, Dark Side 60+
**Learning class:** Force Wound: Taught, can manifest. Force Rend: Taught.
**Notes:** The Jedi Order forbids Force Wound and everything on this line. A character who begins using Wound risks accelerating down this path.

#### ↳ Force Choke → Force Grip → Force Crush ⬜/🔴  *(telekinetic grip line — Choke is dark-tagged, Grip and Crush are neutral)*
**Anchor Stat:** ForceControl (precision) + ForceOutput (holding power)
**Difficulty Tier:** Choke D=2.5 · Grip D=2.5 · Crush D=4.0
**Summary:**
- *Force Choke:* Telekinetic constriction of the throat or airway. Non-lethal in short bursts, lethal if sustained. A purely offensive application with no use outside harming or subduing a living being, so nearly every use is dark side in nature. The one exception is using it briefly to knock someone unconscious, not to punish or kill: Luke Skywalker used it this way on two occasions.
- *Force Grip:* Full-body telekinetic immobilization — more powerful and precise than Choke, locking the target completely rather than targeting just the throat. Useful for restraint, disarming, or holding targets without physical contact.
- *Force Crush:* Catastrophic compression via the Force. Primarily applied to droids, machinery, armor, and objects. Can be lethal against living targets; sustained lethal use against living beings generates dark side pressure through the alignment system.
**Alignment:** 🔴 Force Choke is dark-tagged: each use adds Dark, except a brief use to render someone unconscious without punishment or lasting harm. ⬜ Force Grip and Force Crush are neutral applications of telekinesis, with uses outside combat (restraint, lifting, crushing droids, machinery and objects). Harmful use of Grip or Crush against living beings is judged as a deed (alignment deed tags), not by the ability.
**Prerequisites:** Force Choke: Telekinesis 21+, ForceControl 10+ · Force Grip: Force Choke 15+ · Force Crush: Force Grip 21+
**Learning class:** Force Choke and Force Grip: Taught, can manifest. Force Crush: Taught.
**Notes:** Jedi have used Force Grip and Force Crush throughout Legends without channeling the dark side. Force Choke is the one application of this line Legends treats as dark in nature. It can manifest unbidden in a moment of rage. Force Wound is a separate, darker branch — knowing Choke does not lead there automatically. (Alignment updated 2026-11-20, M6 catalog review.)

---

#### ↳ Kinetite ⚪/🔴
**Anchor Stat:** ForceOutput (compression magnitude) + ForceControl (formation before throw)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Compresses telekinetic energy into a crackling ball of kinetic force that can be hurled at a target like a grenade, exploding on impact.
**Alignment:** Neutral/Dark-leaning
**Prerequisites:** Telekinesis 30+, ForceControl 25+
**Learning class:** Taught
**Notes:** Rare technique. Requires intense concentration to form. Explodes with concussive force on contact.

---

#### ↳ Force Orb ⚪
**Anchor Stat:** ForceControl (sustained formation)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Creates a contained sphere of Force energy that can trap objects or serve as a projectile. Unlike Kinetite, it can be sustained rather than immediately detonating.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 25+, ForceControl 20+
**Learning class:** Taught

---

#### ↳ Force Sphere ⚪
**Anchor Stat:** ForceControl (maintaining a shell rather than directed burst)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A telekinetic barrier formed into a spherical shell around the user, deflecting physical objects and projectiles. Different from Force Barrier (which is energy-based) — this is physically solid.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 30+, ForceBarrier 15+
**Learning class:** Taught

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### ↳ Force Disarm ⚪
**Anchor Stats:** ForceControl
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Pulling a weapon from an opponent's grasp, optionally into the user's own hand.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 15+, Force Pull 10+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** A section of the Telekinesis article. Yoda disarmed Asajj Ventress this way; Darth Vader disarmed Han Solo on Bespin. A stronger user can overwhelm the target's resistance. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Telekinesis" (Force Disarm section): https://starwars.fandom.com/wiki/Telekinesis/Legends

---

#### ↳ Force Blast ⚪
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** A more powerful, far more violent version of Force Push that blasts opponents and obstacles aside. The Felucian shamans' variant, the sickening blast, also harms the target's physical condition.
**Alignment:** Neutral
**Prerequisites:** Force Push 30+, ForceOutput 25+
**Learning class:** Taught, can manifest
**Notes:** Galen Marek and Darth Vader used it. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Telekinesis" (Force Blast section): https://starwars.fandom.com/wiki/Telekinesis/Legends; https://starwars.fandom.com/wiki/Force_blast

---

#### ↳ Force Shockwave ⚪
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Emitting a destructive ring of energy that damages or destroys everything in its radius. Also called Focus Shockwave or Force Bomb.
**Alignment:** Neutral
**Prerequisites:** Force Push 30+, ForceOutput 30+
**Learning class:** Taught, can manifest
**Notes:** Obi-Wan Kenobi used it in the Clone Wars; Savage Opress released a similar pulse against battle droids. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Shockwave": https://starwars.fandom.com/wiki/Force_Shockwave

---

#### ↳ Force Burst ⚪
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A sphere of concentrated Force energy sent at a target with great speed and accuracy. Its strength depends on the time and energy put into it, from huge and explosive to small but deadly.
**Alignment:** Neutral (not exclusive to the dark side; the Sith variant is reddish)
**Prerequisites:** Telekinesis 41+, ForceControl 30+
**Learning class:** Taught
**Notes:** Similar to Force Destruction but not dark-tagged. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Burst": https://starwars.fandom.com/wiki/Force_Burst

---

#### ↳ Force Kill 🔴
**Anchor Stats:** ForceControl + ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Telekinetically destroying a victim's organs, such as stopping the heart. Listed among the derivatives of Force Grip.
**Alignment:** Dark Side, severe
**Prerequisites:** Force Choke 30+, Dark Side 40+
**Learning class:** Taught
**Notes:** Darth Tyranus killed the dealer Auben this way on Korriban; Darth Bane killed his father by squeezing his heart; Darth Vader could stop a heart or freeze lungs. Related: Heart Stun. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Telekinesis" (Force Kill section): https://starwars.fandom.com/wiki/Telekinesis/Legends

---

#### ↳ Force Flight ⚪
**Anchor Stats:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Telekinetically moving oneself toward a destination: levitation taken to an extreme. Takes great concentration.
**Alignment:** Neutral
**Prerequisites:** Force Levitation 41+, ForceControl 41+
**Learning class:** Taught
**Notes:** The Dark Jedi Maw relied on it after losing his lower body. Tyranus, Vader and Sidious may have had it. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Telekinesis" (Force Flight section): https://starwars.fandom.com/wiki/Telekinesis/Legends

---

#### ↳ Projected Fighting ⚪
**Anchor Stats:** ForceOutput + Strength
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Striking an opponent at range without contact, the Force acting as an extension of one's body in hand-to-hand combat. Damage depends on the user's physical strength; it can be pulled to stun.
**Alignment:** Neutral
**Prerequisites:** Telekinesis 21+, unarmed combat training
**Learning class:** Taught
**Notes:** Defended against like a normal unarmed attack, or with the Force by Force-sensitives. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Telekinesis" (Projected fighting section): https://starwars.fandom.com/wiki/Telekinesis/Legends

---

#### ↳ Force Wind 🔴
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Manipulating air currents into a destructive tornado that lifts and flings targets. An ancient Sith technique.
**Alignment:** Dark Side, standard
**Prerequisites:** Telekinesis 41+, Dark Side 20+
**Learning class:** Taught
**Notes:** Streen used it on Yavin 4, including to smash TIE fighters into each other. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Wind": https://starwars.fandom.com/wiki/Force_Wind

---

#### ↳ Combustion ⚪
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Causing objects to explode by sheer will (High Galactic: Flamusfracta). Harder or easier depending on the object's size, density and flammability. Rarely used on people, with devastating effect.
**Alignment:** Neutral (lethal use against people is judged as a deed)
**Prerequisites:** Telekinesis 51+, ForceOutput 41+
**Learning class:** Taught
**Notes:** Yarael Poof used it. Replaces the former Fiery Energy entry (canon only). (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Combustion": https://starwars.fandom.com/wiki/Combustion

---

### ⚪ SENSORY FAMILY
*Perceiving the world through the Force. From basic awareness to visions of other times.*
**Anchor Stats:** All sensory abilities anchor to **ForceSense** as primary, with **Meditation** secondary for sustained or deep perception abilities.

---

#### Force Sense ⚪
**Difficulty Tier: N/A (foundational — not a sub-ability)**
**Summary:** The baseline awareness of the Force — sensing living beings nearby, detecting danger, feeling disturbances. The foundation of all sensory Force abilities.
**Alignment:** Neutral
**Prerequisites:** ForceStats.ForceSense 1+ (built in)
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Always active at a low level. Training amplifies range, clarity, and subtlety. Usually one of the first things taught to a Jedi. Applications in Legends: feeling the surrounding environment and the bonds between living things (absorbs the former Environmental Force Sense entry); danger sense, a tingling warning just before a threat that does not say where it comes from; locating hidden beings at a distance and through barriers, and for advanced users like Kyle Katarn and Jaden Korr, sensing a nearby being's health; feeling great disturbances such as mass deaths from anywhere in the galaxy; sensing a close friend or relative in mortal danger from great distances, closely related to Farsight; and heightened perception of patterns and situations (absorbs the former Force Insight entry). Sensing through the Force is never fully under the user's control. Its counter-application, **clear mind**, hides the user from others trying to sense them; some Jedi Sentinels used it on covert missions (see Force Concealment). Old keys `EnvironmentalForceSense` and `ForceInsight` resolve here. (Reviewed 2026-11-20, Wookieepedia audit.)
**Source:** Wookieepedia (Legends), "Force sense": https://starwars.fandom.com/wiki/Force_sense/Legends

---

#### Force Empathy ⚪
**Anchor Stat:** ForceSense (reading emotional resonance)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Reading the emotional state of others through the Force — sensing fear, joy, pain, deception, or intent without the target speaking. Stronger than basic Sense.
**Alignment:** Neutral
**Prerequisites:** ForceSense 10+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Can be done passively (ambient emotional reading) or actively (deliberate probing). Active use is noticeable to Force-sensitive targets. Depth grows with skill: surface emotions first, then motivations, hidden feelings and even deeply guarded secrets (contested by Thought Shield). Anakin Skywalker discovered it at 17 on Romin. (Corrected 2026-11-20, sensory family pass.)
**Source:** Wookieepedia (Legends), "Force empathy": https://starwars.fandom.com/wiki/Force_empathy/Legends

---

#### Force Sight ⚪
**Anchor Stat:** ForceSense (perceiving Force flows directly)
**Difficulty Tier: D=1.0 (Basic)** *(lowered from Moderate 2026-11-20)*
**Summary:** Perceiving the living Force directly — seeing it flow through beings, objects, and environments. Can be used to see in darkness or beyond physical sight.
**Alignment:** Neutral
**Prerequisites:** ForceSense 21+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Allows a trained user to perceive the world purely through Force connections, bypassing normal vision. A basic variation of Force sense that sees in darkness and through walls. Trained users can counter Force persuasion and Force blinding. The Miraluka rely on it constantly to make up for their blindness: they see auras rather than colors, distinguish living beings and their alignment, and see through most objects. (Corrected 2026-11-20, sensory family pass.)
**Source:** Wookieepedia (Legends), "Force sight": https://starwars.fandom.com/wiki/Force_sight

---

#### Precognition ⚪
**Anchor Stat:** ForceSense (reading incoming threats) + ForceControl (acting on the read in time)
**Difficulty Tier: D=2.5 (Complex)** — the passive always-on version requires sustained refinement
**Summary:** Sensing what is about to happen a fraction of a second before it does — allowing the user to react to attacks before they're launched. The combat application of foresight.
**Alignment:** Neutral
**Prerequisites:** ForceSense 21+, ForceControl 10+
**Learning class:** Taught, can manifest
**Notes:** Also called danger sense. Covers guiding premonitions and warnings as well as combat foresight, and the Sith use it too. This is largely what makes Jedi seem impossibly fast to normal opponents. Passive when trained enough. Formerly listed as Precognitive Reflexes. (Renamed or merged 2026-11-20 to match Wookieepedia.)
**Source:** Wookieepedia (Legends), "Precognition": https://starwars.fandom.com/wiki/Precognition/Legends

---

#### Force Vision ⚪
**Anchor Stat:** ForceSense (cannot be directed — visions surface through it)
**Difficulty Tier: D=4.0 (Advanced)** — cannot be fully controlled even at Grandmaster
**Summary:** Visions of past, present, or future events through the Force — involuntary flashes or deliberately induced meditation visions. Notoriously unreliable and difficult to interpret.
**Alignment:** Neutral
**Prerequisites:** ForceSense 41+
**Learning class:** Can manifest
**Notes:** Cannot be fully controlled. What is seen may be symbolic, literal, or conditional. Misinterpreting a vision has historically caused great harm (e.g. Anakin Skywalker). Considered the cornerstone of the Unifying Force. Visions are extremely rare and uncontrollable: many meditate for one and few succeed. They sometimes occur in a Padawan's Trial of the Spirit. The Skywalker line (Anakin, Luke, Jacen Solo, Ben Skywalker) is especially prone; proposed innate talent: Vision-prone. In the engine, involuntary visions are story events at no cost; deliberate attempts cost pool and usually fail (M6 catalog). (Corrected 2026-11-20, sensory family pass.)
**Source:** Wookieepedia (Legends), "Force vision": https://starwars.fandom.com/wiki/Force_vision/Legends

---

#### ↳ Battle Precognition ⚪
**Anchor Stats:** ForceSense (perception of the whole engagement) + ForceControl (filtering signal from noise)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** In the midst of combat, perceiving the flow of the entire engagement — anticipating enemy movements, identifying tactical openings, sensing the moment a battle turns.
**Alignment:** Neutral
**Prerequisites:** ForceSense 61+, ForceControl 41+
**Learning class:** Taught
**Source note:** A variant of Precognition: sensing and foretelling the flows of the Force while engaged in battle. Another variant, **Blink**, is an unconscious form from latent Force-sensitivity (the stormtrooper sergeant Nova Stihl), which fits the unawakened uses in the M6 reserve spec. Formerly listed as Battle Foresight (the old key resolves here). (Reviewed 2026-11-20, Wookieepedia audit.)
**Source:** Wookieepedia (Legends), "Precognition": https://starwars.fandom.com/wiki/Precognition/Legends
---

#### Shatterpoint ⚪ — Two Distinct Abilities

> **These are two separate named abilities in-game:**
> - **Shatterpoint** — the learned path. Displayed on the sheet only for Path A characters (no ShatterSense talent).
> - **Shatterpoint (Innate)** — the born-with path. Displayed on the sheet for `ShatterSense` talent holders. Never appears alongside regular Shatterpoint.

**Summary:** The perception of fracture points — places, moments, objects, or people that are at a critical breaking point where the right action causes the greatest change. More perception than power: not what *is*, but what *could be* and where the lever is.
**Learning class:** Taught, or innate (shatterpoint talent)

**Prerequisites (Path A — Shatterpoint):** ForceSense 61+, ForceKnowledge 51+, Battle Precognition 41+, Meditation 41+
**Prerequisites (Path B — Shatterpoint Innate):** `ShatterSense` talent flag active (see Innate Talents)

**MECHANICAL TIER: Unique — separate XP track with dual-path mechanics.**
Shatterpoint uses a completely separate XP track from all other abilities. It is **never** stored in `masterXP.forceAbilities`. It has its own track at `masterXP.shatterpoint.main`. The standard XP engine must never process it. The CHANGES block tag `SHATTERPOINT_XP=` routes to `spApplyXP()` which applies the ×0.1 multiplier automatically for `ShatterSense` holders — the AI never pre-applies this reduction.

**Cost (M6, agreed 2026-11-20):** each read is an Advanced instant use: base 40 pool points divided by efficiency, multiplied by the depth of what is read (physical weaknesses or combat ×1, a person ×1.5, a relationship ×2.25, a situation ×3.4, an event ×5). Each read also adds a fixed focus strain that does not depend on skill: +0.05 for combat, rising to +0.25 for an event. This replaces the old flat 0.3 Force load per read. The D-63 rules (depth gates, misreads, once per fight in combat) are otherwise unchanged.

##### Path A — Shatterpoint (Standard Learning, no innate talent)
Learnable through decades of dedicated training. Per the *Shatterpoint* novel, Mace Windu describes Jedi Masters who spent entire lifetimes working toward a level of perception he possessed naturally at age 7.

- **XP Formula:** `xpRequired(level) = floor(500 × 1.07^level)` — ×5 the standard formula. Level 1 costs ~2,500 XP. Level 5 costs ~15,000 XP total.
- **Force Strain (interpretation):** 20–40 per attempt, scaling with tier depth. Tier 1 reads: 20 strain. Tier 2 reads: 35 strain. Tier 3 reads: not achievable on Path A.
- **Proficiency ceiling:** Hard cap at **level 20** (~57,000 lifetime XP). Limited to Tier 1 and basic Tier 2. Tier 3 permanently beyond reach without innate talent.
- **Reliability:** Below level 10, perception itself is unreliable — must roll even to notice a shatterpoint exists. Above level 10, reliable for Tier 1; Tier 2 perception still requires interpretation roll.

##### Path B — Shatterpoint (Innate) (`ShatterSense` talent)
Born with the perception. Training does not create the ability; it refines and deepens what is already present.

- **Prerequisites:** None — present at birth, seeded at **Level 5** when `ShatterSense` talent is active.
- **XP Formula:** Same high-cost formula as Path A, but **×0.1 XP multiplier** — 90% reduction.
- **Force Strain (interpretation):** ×0.3 of standard (≈6–12 per attempt vs Path A's 20–40). At high proficiency, Tier 1 perception is essentially strain-free.
- **Perception:** Passive and automatic. No roll to perceive — shatterpoints surface like Force Sense surfaces presence. Roll is only for *interpretation*.
- **Proficiency ceiling:** Uncapped. At Level 50+, approaches Mace Windu's full canonical capability.
- **Starting level:** Characters with `ShatterSense` seed at Level 5 automatically.

##### Proficiency Scope by Level (both paths)
| Level | Tier | What Can Be Perceived |
|---|---|---|
| 1–5 | T1 | Physical structural weaknesses — objects, materials, mechanisms |
| 6–10 | T1 | Combat shatterpoints — stance flaws, injuries, openings in a duel |
| 11–20 | T1/T2 | Personal shatterpoints — psychological fractures, defining decisions |
| 21–35 | T2 | Relational shatterpoints — fractures in relationships, alliances |
| 36–50 | T2/T3 | Situational shatterpoints — pivotal moments in unfolding events |
| 51+ | T3 | Event shatterpoints — perceiving the fulcrums of history (Windu-tier) |

Path A caps at Level 20. Path B is uncapped.

##### Awareness Bandwidth in Game
| Depth | Focus Cost |
|---|---|
| Tier 1 — brief tactical read | 20–40 |
| Tier 1 — sustained combat focus | 35–50 |
| Tier 2 — personal read | 50–70 |
| Tier 3 — situational read | 80–90 |

| Focus Level | Ambient Awareness Impact |
|---|---|
| 0–40 | Normal. No degradation. |
| 41–70 | Reduced. May miss peripheral events and beings not in primary focus. |
| 71–100 | **Tunnel Vision active.** Ambient Force awareness severely reduced. Can be surprised by threats not directly in focus. |

**Vaapad amplification:** When Vaapad is active simultaneously with deep Shatterpoint focus, awareness bandwidth cost is multiplied by ×1.3.

##### Rarity Rule
Most scenes have no shatterpoints. The ability is not a combat scanner that pings on every opponent — it is the perception of genuine fracture points, which are rare because genuinely pivotal moments are rare. When deciding whether a shatterpoint exists: ask whether this moment, person, or object is genuinely at a fracture point where one action changes the larger trajectory.

**Notes:** ⚠️ The `ShatterSense` flag is set at character creation or by explicit player override only. The AI cannot grant or remove it. Path A and Path B are permanent — there is no mechanic that converts a Path A learner into a Path B practitioner mid-campaign.

---

#### Farsight ⚪
**Anchor Stats:** ForceSense + Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Extending perception far beyond normal range — sensing events, people, or places at a great distance through the Force, sometimes across planetary distances.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, Meditation 20+
**Learning class:** Taught, can manifest
**Notes:** Distinct from Force Vision — Farsight perceives the *present* at a distance, not the future. Range and clarity depend heavily on emotional connection to the target.

---

#### Psychometry ⚪
**Anchor Stats:** ForceSense + ForceKnowledge (interpreting what's perceived)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Reading the Force residue of past events in an object or location — sensing what happened there, who was present, and strong emotions that were felt. Also called postcognition, tai vordrax or telemetry. The user experiences the events as if present: sights, sounds, and the emotional and physical feelings of whoever used the object. Absorbs the former Force Memory / Force Echo entry, including its broader reading of a place's history.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceKnowledge 15+
**Learning class:** Taught, can manifest
**Notes:** Triggered by touching objects or entering locations with significant Force imprints. Strong trauma or dark side events leave vivid impressions. Easiest on personal objects used often; harder on objects used once or by many people. Reading an object used for dark deeds such as murder can taint the user (a lesser Dark gain). Sometimes the user's eyes glow. Old keys `Postcognition`, `ForceMemory` and `ForceEcho` resolve here. (Corrected 2026-11-20, sensory family pass.)
**Source:** Wookieepedia (Legends), "Psychometry": https://starwars.fandom.com/wiki/Psychometry/Legends

---

#### Fighting-sight (Aing-Tii) ⚪ ⚠️
**Anchor Stats:** ForceSense (hyper-precise present-awareness) + ForceControl (acting on it)
**Difficulty Tier: D=4.0 (Advanced)** — faction-locked; can only be trained via Aing-Tii teaching
**Summary:** A unique Aing-Tii ability that grants hyper-precise awareness of the immediate present — all objects, beings, and their trajectories simultaneously — enabling the practitioner to fight with uncanny precision even blindfolded.
**Alignment:** Neutral (Aing-Tii see the Force as a spectrum, not light/dark)
**Tradition:** Aing-Tii (tradition-locked)
**Prerequisites:** ForceSense 41+, ForceControl 30+, Aing-Tii approval required
**Learning class:** Lore-locked (Aing-Tii)
**Notes:** ⚠️ **Faction-locked — requires contact with and approval from the Aing-Tii of the Kathol Rift.** The Aing-Tii rarely share their techniques with outsiders. Jacen Solo and Luke Skywalker are among the few non-Aing-Tii to learn this. Era: available once contact with the Aing-Tii exists, from the New Republic era onward (the earlier "40 BBY" was a typo). First appears in Legacy of the Force: Invincible; Jysella Horn shows it in Fate of the Jedi. Formerly listed as Aing-Tii Fighting-Sight. (Renamed or merged 2026-11-20 to match Wookieepedia.)
**Source:** Wookieepedia (Legends), "Fighting-sight": https://starwars.fandom.com/wiki/Fighting-sight

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Telepathy ⚪
**Anchor Stats:** ForceSense + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Reading and interacting with other minds, and communicating thought to thought. Range is theoretically unlimited, but the telepath usually must sense the person; about 1,000 km is a typical limit with Force-sensitives and a few kilometers with non-sensitives.
**Alignment:** Neutral
**Prerequisites:** ForceSense 15+
**Learning class:** Taught, can manifest
**Notes:** Every Force user can potentially learn it. Includes Force whisper, the directed one-way form: sending thoughts, words or images into one person's mind across distance without entering it, possibly without the target knowing who sent it. Force Whisper was merged here 2026-11-20 (Wookieepedia has no page for it); the old key `ForceWhisper` resolves here. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Telepathy": https://starwars.fandom.com/wiki/Telepathy/Legends

---

#### Sense Force Potential ⚪
**Anchor Stats:** ForceSense
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Judging how strong a person's connection to the Force is. Pairs with the Potential value in the M6 reserve spec.
**Alignment:** Neutral
**Prerequisites:** ForceSense 25+
**Learning class:** Taught
**Notes:** The Sith of Bane's line used it to choose apprentices; Bane found Zannah's potential this way. Darth Vader sensed the boy Reezen. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Sense Force Potential": https://starwars.fandom.com/wiki/Sense_Force_Potential

---

#### Instinctive Astrogation ⚪
**Anchor Stats:** ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Finding a fast, safe hyperspace route without a navicomputer or astromech by sensing the safest path. Can be learned through practice without formal training.
**Alignment:** Neutral
**Prerequisites:** ForceSense 25+, Piloting skill
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Tron Nixx developed it unknowingly; Saesee Tiin and Kyp Durron were adept. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Instinctive astrogation": https://starwars.fandom.com/wiki/Instinctive_astrogation

---

#### Technometry ⚪
**Anchor Stats:** ForceSense + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Tapping into and reading technological devices through the Force, and in some cases controlling them.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceKnowledge 21+
**Learning class:** Taught
**Notes:** Appears from Knights of the Old Republic II through Fate of the Jedi. Overlaps with Electronic Manipulation at the control end. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Technometry": https://starwars.fandom.com/wiki/Technometry

---

### ⚪ BODY ENHANCEMENT FAMILY
*Using the Force to push the physical body beyond its natural limits.*
**Anchor Stats:** Speed/strength burst abilities → **ForceOutput** primary. Sustained regulation abilities (Endurance, Breath Control, Tapas) → **Meditation** primary. Precise body control (Force Heal Self, Force Cloak) → **ForceControl** primary.

---

#### Force Jump ⚪
**Anchor Stat:** ForceOutput (height and distance are raw power)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Channeling the Force through the legs to leap far higher and farther than physically possible. One of the first enhancement abilities Jedi learn.
**Alignment:** Neutral
**Prerequisites:** ForceControl 5+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** One of the most visually distinctive Jedi abilities. Height and distance scale with stat level.

---

#### Force Speed ⚪
**Anchor Stat:** ForceOutput (burst acceleration) + ForceControl (sustained without burning out)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Accelerating the body to move faster than humanly possible — a blur of motion that makes the user nearly impossible to track with the naked eye. Covers more than running: accelerated reflexes and reaction time are part of the same power.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Very high Physical Strain from sustained use. Short bursts are manageable; sustained Force Speed is exhausting. Also called burst of speed, Force sprint or Force reflex; the user perceives the world as if in slow motion. The Matukai also used it. Absorbs the former Force-Enhanced Reflexes entry (the old key resolves here). (Renamed or merged 2026-11-20 to match Wookieepedia.)
**Source:** Wookieepedia (Legends), "Force speed": https://starwars.fandom.com/wiki/Force_speed/Legends

---

#### Enhance Attribute ⚪
**Anchor Stat:** ForceOutput (pure amplification burst)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Channeling Force energy into the body to temporarily amplify a physical attribute, most often strength, far beyond natural limits.
**Alignment:** Neutral
**Prerequisites:** ForceControl 15+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Not sustained — short explosive bursts. Strain accumulates quickly. Synergizes with Djem So and other strength-based lightsaber forms; Anakin Skywalker thought every Jedi should be able to use it for Form V. Formerly listed as Force Strength. (Renamed or merged 2026-11-20 to match Wookieepedia.)
**Source:** Wookieepedia (Legends), "Enhance Attribute": https://starwars.fandom.com/wiki/Enhance_Attribute
> ⚠️ **Stat reference note:** `EnhanceAttribute` as a prerequisite elsewhere in this document (e.g., Force Enrage) refers to *this learnable ability* at the specified level — not to any core or Force stat. There is no stat by that name in the system. (The old key `ForceStrength` should resolve to Enhance Attribute.)

---

#### Remove Fatigue ⚪
**Anchor Stat:** Meditation (sustained regulation) + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Using the Force to shed fatigue, letting the body keep functioning past its natural exhaustion threshold.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+, Endurance 10+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** The foundational endurance technique. Battlemind, Force Valor and Force Body each extend endurance in their own way; Force Body is the extreme version, going past the body's limits with a deferred crash. Formerly listed as Force Endurance (the old key `ForceEndurance` resolves here). (Reviewed 2026-11-20, Wookieepedia audit.)
**Source:** Wookieepedia (Legends), "Remove Fatigue": https://starwars.fandom.com/wiki/Remove_Fatigue
**Applications (2026-11-20):** Remove Another's Fatigue, expelling the toxins of fatigue from someone else's body (old key `RemoveAnothersFatigue`).

---

#### Control Pain ⚪
**Anchor Stats:** ForceControl (precision suppression) + Meditation (sustained inner attunement)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling the Force inward to suppress the neural signals of pain — allowing the user to continue functioning at full capacity despite injury. Does not heal wounds; it separates the mind from the body's distress signals.
**Alignment:** Neutral
**Prerequisites:** ForceControl 25+, Meditation 20+
**Learning class:** Taught, can manifest
**Notes:** In the game engine, Control Pain level directly equals percentage mitigation of injury roll penalties (level 40 = 40% penalty reduction, level 100 = full suppression). Costs Force Strain per combat round whenever active with unhealed injuries present. Also negates the effect of a stun blast, letting the user act normally. Distinct from Force Heal — it does not close wounds or accelerate recovery, only prevents injury from degrading performance. Can be used in conjunction with dark-side Pain Channeling, but the two represent opposite philosophies: Control Pain maintains Jedi clarity by transcending the pain; Pain Channeling embraces it as fuel.
> ⚠️ **Engine note:** The `ControlPain` key in FORCE_ABILITY_CATALOG and CHANGES block tags is the JS identifier. Display name is "Control Pain" (two words).
**Source:** Wookieepedia (Legends), "Control Pain": https://starwars.fandom.com/wiki/Control_Pain
**Applications (2026-11-20):** Control Another's Pain, suppressing someone else's pain, easier with someone close and nearby (old key `ControlAnothersPain`).

---

#### Crucitorn ⚪
**Anchor Stats:** Meditation + Willpower
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Enduring physical pain by transcending physical sensation through the Force. Where Control Pain is the foundational ability that suppresses an injury's effects so the user can function as if it were not there, Crucitorn goes beyond the body's signals altogether.
**Alignment:** Neutral
**Prerequisites:** Control Pain 41+, Meditation 41+, Willpower 30+
**Learning class:** Taught
**Notes:** The Legends counterpart to the canon technique Endure (the old key `Endure` resolves here). The Sith classed it in their Mind school, and Darth Bane wrote about it in an essay later collected in the Book of Sith. Ties into the M6 reserve spec alongside Force Body and Battlemind. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed.)
**Source:** Wookieepedia (Legends), "Crucitorn (technique)": https://starwars.fandom.com/wiki/Crucitorn_(technique)

---

#### Force Heal (Self) 🔵
**Anchor Stats:** Meditation (attunement to body's state) + ForceControl (directing healing energy)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling the Force into one's own body to accelerate natural healing — closing wounds, neutralizing toxins, recovering from injury far faster than normal.
**Alignment:** Light Side
**Prerequisites:** Meditation 21+, ForceControl 15+
**Learning class:** Taught, can manifest
**Notes:** Cannot heal missing limbs or regenerate organs. Works best on wounds, internal damage, and illness. High Force Strain.
**Also covers (2026-11-20):** Accelerate Healing (which also makes medpacs work better), healing meditation (Ki-Adi-Mundi) and curato salva, the Jedi umbrella name for self-healing techniques. Old keys `AccelerateHealing`, `HealingMeditation`, `CuratoSalva` resolve here.
**Alignment note (2026-11-20):** stays light side. Dark-side healing is its own ability, Dark Transfer.
**Source:** Wookieepedia (Legends), "Force healing": https://starwars.fandom.com/wiki/Force_healing/Legends

---

#### Force Valor 🔵
**Anchor Stats:** ForceOutput (physical acceleration and amplification) + Meditation (sustained attunement and ally projection)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A comprehensive Force-enhanced amplification of the user's own physical and mental performance — accelerating speed, reflexes, and striking power while sharpening accuracy and resolve. At higher levels, the resonant clarity radiates outward passively, extending a measure of the same enhancement to nearby allies.
**Alignment:** Light Side
**Prerequisites:** Battlemind 15+, ForceOutput 15+
**Learning class:** Taught
**Upkeep override (M6, 2026-11-20):** held at one step cheaper than its tier (3 per round instead of 5), because it is usually held together with Force Speed. Its learning difficulty is unchanged.
**Notes:** Distinct from its three closest relatives: **Battlemind** (internal mental focus only, no physical component, no ally effect), **Force Enrage** (dark side counterpart — amplifies through anger at the cost of control and sanity), and **Battle Meditation** (strategic-scale perception shift affecting an entire battle rather than individual performance). Force Valor is the complete self-amplification package — physical and mental, self and allies.
- Self-enhancement: the body moves and reacts faster, leaps farther and higher, strikes more powerfully, and fights with sharper accuracy.
- Ally aura: at higher proficiency levels, the resonant clarity field extends passively to nearby Force-sensitives and non-sensitives alike — boosting their resolve and reaction time without requiring them to channel the Force themselves.
- Yoda relied on Force Valor to compensate for the physical limitations of extreme old age, maintaining the speed and power requirements of Form IV (Ataru) in combat. It was necessary for a practitioner of Form IV at his age. (Corrected 2026-11-21, lore batch 10.)

---

#### Force Cloak (Force Camouflage) ⚪
**Anchor Stat:** ForceControl (holding the bend of light and sound, or the mind-trick erasure)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Making oneself nearly invisible to sight. Two methods: bending light and sound waves around the body, which also hides the user from droids and the Yuuzhan Vong; or an advanced mind trick that erases the user's presence from observers' minds, which does not fool droids or other nonliving beings. Hides the body, not the Force presence: hiding from Force-sensitives is Force Concealment, and a user wanting both must hold both.
**Alignment:** Neutral
**Prerequisites:** ForceControl 41+ (light-bending method: Telekinesis 30+; mind-trick method: MindTrick 30+)
**Learning class:** Taught (natural talent lowers the cost)
**Notes:** ⚠️ Rare. Extremely hard to learn, so it usually comes as a natural talent (a natural talent lowers the learning cost). Physically and mentally taxing to maintain; the concentration it demands limits what else the user can do. Practiced since the early Republic, origin lost; the Jedi kept it in the Great Holocron. Users include Juhani (natural talent), Darth Traya, the Tholme–Quinlan Vos–Aayla Secura lineage, Anakin Skywalker, Darth Maul, Maris Brood, Jaden Korr and Lomi Plo; the Disciples of Twilight later perfected it. (Merged 2026-11-20: the lore file previously listed Force Camouflage and Force Cloak as separate abilities; Wookieepedia treats them as one power.)
**Source:** Wookieepedia (Legends), "Force cloak": https://starwars.fandom.com/wiki/Force_cloak
---

#### Breath Control ⚪
**Anchor Stat:** Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Suppressing the body's instinct to shut down without oxygen, conserving the air in the lungs to go without breathing far longer than normal; skilled practitioners may hold their breath for hours or even days.
**Alignment:** Neutral
**Prerequisites:** Meditation 15+, Endurance 10+
**Learning class:** Taught
**Notes:** Does not stop anything entering or leaving the respiratory system, so toxic air or vacuum also needs a Force barrier or other protection. Also used to slow bleeding and regulate the body in extremes. (Corrected 2026-11-20, body family pass.)
**Source:** Wookieepedia (Legends), "Breath control": https://starwars.fandom.com/wiki/Breath_control

---

#### Tapas ⚪
**Anchor Stat:** Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Concentrating on the Force to retain body heat, keeping warm in cold environments, including vacuum.
**Alignment:** Neutral
**Prerequisites:** Meditation 21+, Endurance 10+
**Learning class:** Taught
**Notes:** Survival ability. Jacen Solo used it at the Battle of Ebaq in 28 ABY. Cooling the body in heat is not part of the Legends technique. (Corrected 2026-11-20, body family pass.)
**Source:** Wookieepedia (Legends), "Tapas": https://starwars.fandom.com/wiki/Tapas

---

#### Hibernation Trance ⚪
**Anchor Stat:** Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Entering a Force-induced state of suspended animation — dramatically slowing metabolism, heartbeat, and brain activity to the point of appearing dead, while using minimal resources.
**Alignment:** Neutral
**Prerequisites:** Meditation 30+, Breath Control 15+
**Learning class:** Taught
**Notes:** Can be held for hours or days. Used to survive injury, vacuum, or captivity. The user cannot act during the trance — they are functionally unconscious.
**Applications (2026-11-20):** Place in Hibernation Trance puts another being into it: needs contact and consent, and cannot be used as an attack (old key `PlaceInHibernationTrance`). The Palawa hibernation trance, developed by the Followers of Palawa before 24,500 BBY, let practitioners sleep for decades (over seventy years recorded) without ageing; Arden Lyn knew it. Lore-locked variant.

---

#### Morichro 🔵 ⚠️
**Anchor Stats:** ForceControl + Meditation
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Slowing a being's bodily functions, such as breathing and heart rate. On oneself it allows long suspended animation: a trained user can survive over a year without food, water or air, though not vacuum. On another it can induce mild catatonia, long-term suspended animation, or death. An unmonitored target may never wake, or may die of dehydration or starvation.
**Alignment:** Light Side, but forbidden. Wookieepedia lists it among light side powers; dark side users generally avoided it because it requires mastering a less malicious use of the Force first. Using it to kill is judged as a deed. (Corrected 2026-11-20, body family pass.)
**Prerequisites:** Meditation 41+, ForceControl 41+, Hibernation Trance 21+, Jedi Master who knows it (lore-locked)
**Learning class:** Lore-locked
**Notes:** ⚠️ **Forbidden Jedi art.** Known to Jedi since about 24,500 BBY. The Council classified it as forbidden around 5,000 BBY, and by 1,000 BBY banned teaching it to all but a select few Masters; Knights were never permitted it. Awdrysta Pina used it against Arden Lyn during the First Great Schism. Yaddle revived knowledge of it in the Order's final centuries; Jedi healers used it in the Clone Wars, and Kyp Durron and Anakin Solo used it to survive. First appeared in *The Emperor's Pawns* article, spelled "Mortichro". (Added 2026-11-20, M6 catalog review.)
**Source:** Wookieepedia (Legends), "Morichro": https://starwars.fandom.com/wiki/Morichro/Legends

---

#### Alchaka ⚪ ⚠️
**Anchor Stat:** Meditation (Force-body conditioning)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** An intensely physical Force-meditation technique — a ritualized series of movements and postures repeated to the point of exhaustion to synchronize body and Force. Not combat-relevant but deep spiritual conditioning.
**Alignment:** Neutral (Light Side leaning — Jedi practice)
**Prerequisites:** Meditation 15+, any lightsaber form 10+
**Learning class:** Taught
**Notes:** Developed by the early Je'daii Masters of the Stav Kesh academy on Tython as a martial meditation; considered an advanced form of moving meditation. Available in every era from the Je'daii onward. Completing it correctly leaves the practitioner on the brink of exhaustion. Provides passive bonuses to Force attunement and strain recovery when practiced regularly. (Corrected 2026-11-20, body family pass.)
**Source:** Wookieepedia (Legends), "Alchaka": https://starwars.fandom.com/wiki/Alchaka

---

#### Force Body ⚪
**Anchor Stats:** ForceOutput (burning through personal Force reserves) + ForceControl (directing it)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Converting Force energy directly into physical endurance — allowing the user to ignore mortal wounds and keep fighting at the cost of burning through their own life Force.
**Alignment:** Neutral (extremely dangerous; Light Side users view it as a last resort)
**Prerequisites:** RemoveFatigue 30+, ForceControl 30+
**Learning class:** Taught
**Notes:** Severe risk. Every wound ignored with Force Body still exists physically — the user is burning life force to remain conscious. Death or permanent injury is likely if overused. A solid connection to the Force and physical durability are needed to use it safely. Also known as Noble Sacrifice and Consumption (Star Wars: The Old Republic) and Prolong Force (roleplaying game); first appeared in Knights of the Old Republic II. (Corrected 2026-11-20, body family pass.)
**Source:** Wookieepedia (Legends), "Force Body": https://starwars.fandom.com/wiki/Force_Body

---

#### Longevity through the Force (passive, not an ability)
**Summary:** Deep meditation and a deep connection to the Force slow aging. This is not a learnable ability: it is a passive effect for the age system, scaled by Meditation and connection. Very long lives such as Yoda's (and Yaddle's, about 450) come from their species, not a technique.
**Learning class:** None (passive; grows with Force mastery)
**Notes:** Replaces the former Resist Aging entry, which had no Legends source. (Reviewed 2026-11-20, Wookieepedia audit.)
---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Force Sustenance ⚪
**Anchor Stats:** Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Sustaining oneself with the Force alone, without food, and for short periods even in vacuum.
**Alignment:** Neutral
**Prerequisites:** Meditation 41+, Breath Control 21+
**Learning class:** Taught
**Notes:** Darth Bane stopped needing food through it; Luke Skywalker learned a similar use as a Master. Mind Walking can amplify it. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Sustenance": https://starwars.fandom.com/wiki/Force_Sustenance

---

### ⚪ MENTAL & SOCIAL FAMILY
*Influencing, reading, and interacting with other minds.*
**Anchor Stats:** Mind influence abilities → **ForceControl** (precision of mental touch) + **ForceSense** (reading the target's resistance). Analytical abilities → **ForceKnowledge** + **Meditation**.

---

#### Mind Trick ⚪
**Anchor Stats:** ForceControl + ForceSense (reading whether the trick is landing)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Using the Force to influence the thoughts of susceptible beings — planting suggestions, altering perceptions, or causing the target to forget. Works best on weak-willed or unfocused minds.
**Alignment:** Neutral
**Prerequisites:** ForceControl 15+, Willpower 10+
**Learning class:** Taught, can manifest
**Notes:** Works best on the weak-minded; strong wills, targets who know the trick is coming, and minds without conventional thought (droids) resist or are immune. A cybernetically enhanced brain blocks it (Lobot). Resistant species: Hutts, Toydarians, Falleen, Geonosians, Dashade, Yinchorri, Kloodavians (resistance raises the contest rather than making it impossible: Revan persuaded Motta the Hutt, Luke failed on Jabba). Nikto are unusually susceptible. Worry or distraction breaks the user's concentration and the trick fails. Can manifest untrained (Corran Horn). The classic "these aren't the droids you're looking for." (Corrected 2026-11-20, mental family pass.)
**Source:** Wookieepedia (Legends), "Mind trick": https://starwars.fandom.com/wiki/Mind_trick/Legends

> **Sub-applications:**

#### ↳ Force Persuasion ⚪
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A more powerful and sustained form of mind influence — strong enough to overcome resistance in moderately strong-willed targets.
**Alignment:** Neutral
**Prerequisites:** MindTrick 21+, Charisma 15+
**Learning class:** Taught
**Notes:** More force required; more noticeable to Force-sensitives nearby. Covers the KOTOR powers Affect Mind and, at high levels, Dominate Mind (a persuasion very few can resist), which are persuasion rather than control.

#### ↳ Mind Control 🔴
**Anchor Stats:** ForceControl (overriding a will entirely requires extreme precision)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Total domination of another mind — overriding their will entirely, making them act against their deepest instincts.
**Alignment:** Dark Side — causes significant drift
**Prerequisites:** MindTrick 30+, ForceControl 30+, Dark Side drift 15+
**Learning class:** Taught
**Cost:** Sustained, 8 per round; scale counts targets. (Set 2026-11-20.)
**Notes:** Forbidden by the Jedi Order. Game rule: harm to the victim grows with how long they are held (no source sets a fixed outcome). Onimi controlled Supreme Overlord Shimrra for years, losing his grip when distracted. Also known as dominate mind or control mind: the dark-side counterpart of the mind trick, far more invasive, taking complete control of the victim's mind. Higher mastery allows more people to be controlled. The old key `DominateMind` resolves here. (Merged 2026-11-20: Dominate Mind was briefly a separate entry based on the KOTOR power.)
**Source:** Wookieepedia (Legends), "Mind trick" (Mind control section): https://starwars.fandom.com/wiki/Mind_trick/Legends

#### ↳ Dopplegänger ⚪
**Anchor Stats:** ForceControl + ForceOutput (sustaining the duplicate requires power)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Creating a short-lived duplicate of oneself or an external object, visually indistinguishable from the real thing. Also called Similfuturus, Force shadow, or Force projection.
**Alignment:** Neutral
**Prerequisites:** Force Illusion 21+, ForceControl 25+
**Learning class:** Taught
**Cost:** Sustained, 8 per round.
**Notes:** Unlike a Force illusion, everyone around sees it, droid audio and video sensors included. The user perceives through its senses and can move objects near it with telekinesis to sell it. It can take the hit from one attack, and fades if the user is injured and stops concentrating. Masters can make duplicates of other people or of objects (extra droids). Darth Ramage recorded it in his holocron; Jax Pavan learned it from there. Users: Darth Plagueis (fooled Sidious in training), Darth Tyranus, Luke Skywalker, Xesh (the Force Hounds' Force shadow, a scouting form invisible to most). Formerly listed as Force Projection, described as a purely mental image. The old key `ForceProjection` resolves here. (Renamed and rewritten 2026-11-20.)
**Source:** Wookieepedia (Legends), "Dopplegänger": https://starwars.fandom.com/wiki/Dopplegänger; "Mind trick" (Force projection section): https://starwars.fandom.com/wiki/Mind_trick/Legends

#### ↳ Force Fear 🔴
**Anchor Stats:** ForceControl (precision) + ForceSense (reading the target's specific vulnerabilities)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A dark-side application of Mind Trick — rather than planting a suggestion, projecting the sensation of all-consuming terror directly into a target's mind. Overwhelms rational thought with irrational fear.
**Alignment:** Dark Side — causes drift
**Prerequisites:** MindTrick 21+, Dark Side drift 10+
**Learning class:** Taught, can manifest
**Notes:** Strikes the primal fears in every being's subconscious; victims cower or flee. Classed as dark because fear is a dark emotion, but Wookieepedia notes intent counts: a scare used only to defuse a fight (Luke jolting a pack of Coruscant predators with fear) takes Lesser dark weight instead of Standard. Distinct from **Summon Fear** (Sith sorcery, see Sith Alchemy section) — Force Fear is a targeted mind-influence application; Summon Fear draws on the dark side itself to manifest dread rather than projecting it through Force Touch.

#### ↳ Force Horror 🔴
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An advanced Force Fear that drives several enemies at once into a catatonic state of panic, harder to defend against than basic Force Fear.
**Alignment:** Dark Side — standard weight
**Prerequisites:** ForceFear 21+, Dark Side 30+
**Learning class:** Taught
**Cost:** Instant, 40; scale counts targets.
**Notes:** Victims freeze in panic for the scene or until shaken out of it. Formerly described as a single-target attack. (Corrected 2026-11-20, mental family pass.)
**Source:** Wookieepedia (Legends), "Mind trick" (Force fear section): https://starwars.fandom.com/wiki/Mind_trick/Legends

#### ↳ Force Insanity 🔴
**Anchor Stats:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The most advanced form of Force Fear: several enemies over a wider range than Force Horror are driven into frenzied madness and deranged mania as their situation suddenly seems hopeless.
**Alignment:** Dark Side — severe weight
**Prerequisites:** ForceHorror 21+, Dark Side 50+
**Learning class:** Taught
**Cost:** Instant, 40; scale counts targets.
**Notes:** Victims may attack anything nearby, flee blindly or collapse. Recovery takes time. Formerly described as a single-target attack. (Corrected 2026-11-20, mental family pass.)
**Source:** Wookieepedia (Legends), "Mind trick" (Force fear section): https://starwars.fandom.com/wiki/Mind_trick/Legends

---

#### Mind Probe 🔴
**Anchor Stats:** ForceControl (surgical entry) + ForceSense (navigating the target's mind)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A telepathic dark side ability, also called Drain Knowledge, that invades a mind and steals deep memories and information without consent, violently and mercilessly.
**Alignment:** Dark Side — standard weight
**Prerequisites:** Telepathy 21+, ForceControl 30+
**Learning class:** Taught
**Cost:** Instant, 25 per probe.
**Notes:** Goes beyond reading surface thoughts. May damage the subject psychologically; resisted by strong will. Knowledge can go the other way: Revan ripped Rakatan from The One's mind and pushed Basic into his. Users: Revan, Kreia (on Atton Rand), the Sith Emperor (on Revan for 300 years), Darth Bane (a rancor's memories), Darth Maul, Darth Tyranus (on Obi-Wan), Darth Sidious and Darth Vader (on Luke), Jerec, Joruus C'baoth. The separate Drain Knowledge entry is merged here; the old key `DrainKnowledge` resolves here. (Corrected 2026-11-20, mental family pass: tier lowered from Advanced.)
**Source:** Wookieepedia (Legends), "Mind probe (Force power)": https://starwars.fandom.com/wiki/Mind_probe_(Force_power)/Legends

#### Memory Walk (Torture by Chagrin) 🔴
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Reaching into a victim's mind and forcing them to relive all their worst memories, painful and embarrassing alike, over and over until it almost seems to cause physical pain.
**Alignment:** Dark Side — standard weight
**Prerequisites:** MindProbe 30+, Dark Side 25+
**Learning class:** Taught
**Cost:** Sustained, 5 per round.
**Notes:** Discovered by the Sorcerer of Tund Rokur Gepta, and used for millennia by the Sorcerers of Tund and the Sith. Side effect (game rule from Gepta's finding): after a brief session and full recovery, the victim gains a small Intelligence boost. Sustained for hours it can kill over weeks as the mind finally snaps. Githany learned it from her Jedi Master and used it to restore Bane's hold on the dark side; Darth Zannah mastered it as a weapon; Cade Skywalker and Darth Maladi used it on each other; Darth Wyyrlok III used it against Darth Krayt. (Corrected 2026-11-20, mental family pass: the unsourced Fallanassi "Blood Trail" note removed.)
**Source:** Wookieepedia (Legends), "Memory Walk": https://starwars.fandom.com/wiki/Memory_Walk

---

#### Mind Shard ⚪
**Anchor Stats:** ForceControl + ForceSense (precision psychic attack)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Mentally splintering an opponent's mind, wracking them with pain. Can make the target lose focus on a Force power so it dissipates.
**Alignment:** Neutral — an attack, judged by the deed like any other
**Prerequisites:** Telepathy 21+, ForceControl 20+
**Learning class:** Taught
**Cost:** Instant, 25, contested.
**Notes:** Kyp Durron used a psychic blast like it to stagger Jedi on Hapes. Darth Bane wrote that it was a helpful power for a Sith to learn. Wookieepedia also calls it "a mind twist"; that is not Daegen Lok's Mind Twist, which stays its own entry. (Corrected 2026-11-20, mental family pass: was Dark Side with a Mind Probe prerequisite.)
**Source:** Wookieepedia (Legends), "Mind Shard": https://starwars.fandom.com/wiki/Mind_Shard

---

#### Comprehend Speech ⚪
**Anchor Stats:** ForceSense + ForceKnowledge
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Understanding the general meaning of any spoken language through the Force, also called Language Absorption. It does not let the user speak it.
**Alignment:** Neutral
**Prerequisites:** Telepathy 15+
**Learning class:** Taught, can manifest
**Cost:** Instant, 10 per conversation; free at level 40.
**Notes:** Possibly an extension of Telepathy. Nuances can slip past (Obi-Wan with the Nelvaanian shaman). Fails on cultures that refuse contact (Revan could not understand the Sand People). Easier when the speaker is Force-sensitive: Luke understood the Qom Jha without trying, so it can manifest. The Witches of Dathomir's version, the Spell of Interpretation, lets the caster speak the language too, droidspeak included, for as long as the spell lasts. Users: Revan, Qui-Gon Jinn, Obi-Wan Kenobi, Mace Windu, Luke Skywalker, Leia Organa Solo, Teneniel Djo. (Corrected 2026-11-20, mental family pass.)
**Source:** Wookieepedia (Legends), "Comprehend Speech": https://starwars.fandom.com/wiki/Comprehend_Speech; "Spell of Interpretation": https://starwars.fandom.com/wiki/Spell_of_Interpretation

---

#### Theran Force-listening ⚪ ⚠️
**Anchor Stats:** Meditation + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A deep meditative technique of the Theran Listeners — allowing the user to hear the voice of the Force itself speaking through living things, providing guidance and insight unavailable through normal sense or meditation.
**Alignment:** Neutral (Light Side leaning)
**Prerequisites:** Meditation 41+, ForceSense 30+
**Learning class:** Lore-locked (Theran Listeners)
**Notes:** ⚠️ **Faction-locked — primarily a Theran Listener tradition.** Extremely rare outside this tradition. Requires complete stillness and silence to initiate. Formerly listed as Force Listening. (Renamed or merged 2026-11-20 to match Wookieepedia.)
**Source:** Wookieepedia (Legends), "Theran Force-listening": https://starwars.fandom.com/wiki/Theran_Force-listening

---

#### Battlemind ⚪
**Anchor Stat:** Meditation (stillness under pressure)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A Force-enhanced mental state of absolute focus and calm in combat — suppressing fear, doubt, and distraction, allowing perfect clarity under lethal pressure.
**Alignment:** Neutral. Used by Jedi and Sith alike: Darth Maul had it, and Mace Windu combined it with dark side power to create Vaapad. (Corrected 2026-11-20, body family pass.)
**Prerequisites:** Meditation 21+, Willpower 20+
**Learning class:** Taught, can manifest
**Cost:** Sustained, 5 per round.
**Notes:** Different from Force Enrage (which amplifies anger) — Battlemind amplifies calm clarity. Used by Jedi to maintain composure in overwhelming situations.
**Source:** Wookieepedia (Legends), "Battlemind": https://starwars.fandom.com/wiki/Battlemind

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### ↳ Force Confusion ⚪
**Anchor Stats:** ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** An advanced mind trick that temporarily makes an enemy fight as an ally. Quicker to use than affect mind in battle.
**Alignment:** Neutral (making someone harm their own side is judged as a deed)
**Prerequisites:** Mind Trick 30+
**Learning class:** Taught
**Cost:** Instant, 25, contested.
**Notes:** Especially useful when outnumbered. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the mental family pass.)
**Source:** Wookieepedia (Legends), "Mind trick" (Force confusion section): https://starwars.fandom.com/wiki/Mind_trick/Legends

---

#### ↳ Force Corrupt 🔴
**Anchor Stats:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Forcing targets to the user's side while slowly draining their life.
**Alignment:** Dark Side, standard
**Prerequisites:** Force Confusion 21+, Dark Side 30+
**Learning class:** Taught
**Notes:** Imperial Force users in the Galactic Civil War, possibly Mara Jade and Palpatine, used it on enemy soldiers. Cost: sustained, 8 per round; scale counts targets. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the mental family pass.)
**Source:** Wookieepedia (Legends), "Mind trick" (Force corrupt section): https://starwars.fandom.com/wiki/Mind_trick/Legends

---

#### ↳ Mind Twist 🔴
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Intruding into a mind and twisting its perception of reality, strongly enough for the body to react (burn marks from an imagined fire).
**Alignment:** Dark Side, standard
**Prerequisites:** Mind Trick 41+, Dark Side 20+
**Learning class:** Taught (Daegen Lok's technique)
**Notes:** Developed by Daegen Lok (Dawn of the Jedi era): he convinced Xesh he was suffocating and Bel Zana that she was burning, until burn marks appeared. Cost: instant, 40, contested. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the mental family pass.)
**Source:** Wookieepedia (Legends), "Mind trick" (Mind Twist section): https://starwars.fandom.com/wiki/Mind_trick/Legends

---

#### ↳ Force Illusion ⚪
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Projecting an image into the minds of beings in range, from a pillar of fire to a fleet of warships, controlled by the user's imagination.
**Alignment:** Neutral
**Prerequisites:** Mind Trick 41+
**Learning class:** Taught
**Cost:** Sustained, 8 per round; scale = range (up to thousands of kilometres, enough for capital-ship combat, and tiring at extreme range).
**Notes:** Unlike a hologram it can be steered mentally, and it hits every sense, even cameras and cybernetic eyes (playback afterwards shows nothing). It has little or no effect on Force users, Hutts or the Yuuzhan Vong. It cannot make something vanish (that is Force Cloak) and has no substance: a hand passes through. Applications: masquerade (an image laid over the user's own appearance); Yarael Poof read an army's fears and projected them. Dark version, mindforms: Sith sorcery illusions (Naga Sadow, Aleema Keto, Nightsister illusion spells, Darth Wyyrlok) that distort every sense and can wound a victim who believes them; they need Sith Sorcery, carry Dark standard weight, and break if the victim stops believing or a strong light side attack interrupts the caster. Users: Corran Horn, Yarael Poof, Lumiya, the Fallanassi (White Current illusions, which can be as real or unreal as they choose). (Added 2026-11-20 from the Wookieepedia audit; confirmed in the mental family pass. The Force Projection prerequisite was dropped: projection is a variation of illusion, so Dopplegänger now requires this.)
**Source:** Wookieepedia (Legends), "Mind trick" (Force illusion section): https://starwars.fandom.com/wiki/Mind_trick/Legends

---

#### Memory Rub ⚪
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Altering or erasing another's memories or learned skills.
**Alignment:** Neutral (non-consensual use is judged as a deed)
**Prerequisites:** Telepathy 30+, Mind Trick 30+
**Learning class:** Taught
**Notes:** Obi-Wan Kenobi erased the memory of the buyer of the Soulless One on Nar Shaddaa. Yoda decided against using it on Arhul Hextrophon because hurting someone like that was not the Jedi way. Luke and Corran Horn used it reluctantly; Jacen Solo learned it from the Fallanassi and used it on Ben; Darth Maladi shook off Cade's attempt. Cost: instant, 40, contested. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the mental family pass.)
**Source:** Wookieepedia (Legends), "Memory rub": https://starwars.fandom.com/wiki/Memory_rub/Legends

---

#### Neural Storm ⚪
**Anchor Stats:** ForceOutput + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Overloading a victim's neural network with psychic energy for extreme but momentary disorientation.
**Alignment:** Neutral
**Prerequisites:** Telepathy 21+
**Learning class:** Taught
**Notes:** The only source is the Ultimate Alien Anthology. Cost: instant, 25, contested. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the mental family pass.)
**Source:** Wookieepedia (Legends), "Neural Storm": https://starwars.fandom.com/wiki/Neural_Storm

---

### ⚪ DEFENSE FAMILY
*Protecting oneself and others from harm.*
**Anchor Stats:** All Force Barrier family → **ForceControl** (sustaining a precise energy shell) + **ForceOutput** (how strong the shell is). Healing/absorb → **Meditation** primary.

---

#### Force Barrier ⚪
**Anchor Stats:** ForceControl (shell precision) + ForceOutput (shell strength)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Generating a telekinetic field of Force energy around the user that deflects physical impacts, mitigates energy attacks, and generally reduces incoming damage. Every Padawan-level Force user has a passive version.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+
**Learning class:** Can manifest (develops on its own, without a teacher)
**Notes:** Always partially active for trained Force users. Can be raised around the user, a friend, or even a foe. Holds only a few attacks before collapsing, depending on the user's strength; breaks under sustained pressure, overwhelming power, or high strain. Recovers slowly. Also called Force shield, Force of Will or Force defense. (Corrected 2026-11-20, defense family pass.)
**Source:** Wookieepedia (Legends), "Force barrier": https://starwars.fandom.com/wiki/Force_barrier/Legends

> **Sub-applications:**

#### ↳ Protection Bubble ⚪
**Anchor Stats:** ForceControl + ForceOutput (scale of protection)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting the Force Barrier outward into a spherical shell large enough to protect multiple people simultaneously.
**Alignment:** Neutral
**Prerequisites:** ForceBarrier 30+, ForceControl 25+
**Learning class:** Taught
**Notes:** Drains Force rapidly. The user must be still to cast it and sometimes to hold it. Can also be cast around an attacker to trap them inside their own attack. Darth Bane used it. (Corrected 2026-11-20, defense family pass.)
**Source:** Wookieepedia (Legends), "Protection bubble": https://starwars.fandom.com/wiki/Protection_bubble

---

#### Tutaminis 🔵
**Anchor Stats:** Meditation (the energy dissipation discipline requires deep attunement) + ForceControl
**Difficulty Tier: D=2.5 (Complex)** *(lowered from Advanced 2026-11-20)*
**Summary:** The Jedi discipline of energy dissipation — the art of absorbing, redirecting, or nullifying any incoming energy through the body or hands. **Tutaminis is the parent discipline** from which Force Absorb (a specific sub-application) derives. Demonstrated by Yoda (absorbing Dooku's Force Lightning through his hands) and Mace Windu. The basics are taught in the very first classes at Jedi academies and expected by graduation; mastery takes a lifetime.
**Alignment:** Light Side
**Prerequisites:** ForceBarrier 21+, Meditation 21+, ForceControl 21+
**Learning class:** Taught
**Notes:** At high proficiency, a practitioner can absorb blaster bolts and other energy channeled through the hands or body; a rare few masters could catch or dispel a blade or bolt (Nejaa Halcyon, Satele Shan). (Corrected 2026-11-21, lore batch 10; catching a blade is the top Tutaminis tier, D-341.) Absorbed energy can heal the user or power other Force abilities. **Three ways to answer an energy attack (M6, 2026-11-20):** (1) **Absorb** it: the pool refills by a share of what the attacker spent, 0.5 at base rising to 0.8 with mastery, capped at the absorber's own draw. (2) **Redirect** it: forgo absorption and send the attack back at the attacker, as Yoda did with Dooku's lightning; no pool gain. (3) **Release** it: discharge absorbed energy as an outward burst, as Yoda did against Palpatine in the Senate. Absorbing too much at once, past the user's capacity, forces a release whether the user wants it or not. (Corrected 2026-11-20, defense family pass.)
**Source:** Wookieepedia (Legends), "Tutaminis": https://starwars.fandom.com/wiki/Tutaminis

> **Sub-application:**

#### ↳ Force Absorb 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)** *(raised from Complex 2026-11-20; the advanced application of Tutaminis)*
**Summary:** A specific application of Tutaminis — actively drawing in Force-based attacks (telekinesis bursts, Force Lightning, Force pushes) and neutralizing or converting them into the user's own reserves.
**Alignment:** Light Side
**Prerequisites:** Tutaminis 15+, Meditation 15+
**Learning class:** Taught
**Notes:** Focused on Force-energy specifically (rather than physical-energy attacks, which require higher Tutaminis mastery). Passive Force attacks can be absorbed at lower proficiency; concentrated lightning or Sith sorcery requires significant skill. Uses the Tutaminis absorb, redirect and release rules; the absorb share rises from 0.5 to 0.8 with mastery. (Corrected 2026-11-20, defense family pass.)

---

#### Force Resistance ⚪
**Anchor Stats:** Willpower + ForceControl (passive defense)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Strengthening the mind and body against Force-based attacks — reducing the effectiveness of Mind Tricks, Force Lightning, Force Drain, and similar assaults.
**Alignment:** Neutral
**Prerequisites:** ForceBarrier 15+, Willpower 20+
**Learning class:** Taught
**Notes:** Passive defense that scales with training. A high-resistance user can partially shrug off abilities that would otherwise be devastating. At novice level this is Force resistance; mastered, it becomes **Force immunity**, which can render some Force powers entirely inert. Jedi Sentinels specialize in it against the dark side. (Corrected 2026-11-20, defense family pass.)
**Source:** Wookieepedia (Legends), "Force resistance": https://starwars.fandom.com/wiki/Force_resistance

---

#### Force Concealment (Force Stealth) ⚪
**Anchor Stats:** ForceControl + Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Hiding one's Force alignment, one's ability to use the Force, or one's entire presence from other Force-sensitives. Distinct from Force Cloak (also called Force Camouflage), which hides the body from sight. Variants include shrinking one's presence in the Force to almost nothing (Vergere), hiding emotions under stress (Jacen Solo), choosing exactly who can sense you (Luke Skywalker), and the Quey'tek meditation, which masks a dark signature so it appears benevolent.
**Alignment:** Neutral. The Quey'tek variant is a dark-side technique.
**Prerequisites:** ForceControl 25+, Meditation 20+
**Learning class:** Taught
**Notes:** Contested by Force Sense. At high mastery it becomes a free use (M6 reserve spec), so it can be held without upkeep. Darth Sidious hid his dark nature from the Jedi High Council for over three decades, even in the same room. Obi-Wan Kenobi and Yoda used it in exile; Vergere, Darth Traya and the Jensaarai used it to evade enemies; Asajj Ventress, Darth Tyranus and Darth Maul used Quey'tek. Alternate names: Force Concealment, Buried Presence, Force Stealth. (Added 2026-11-20, M6 catalog review.)
**Source:** Wookieepedia (Legends), "Force stealth": https://starwars.fandom.com/wiki/Force_stealth

> **Sub-applications:**

#### ↳ Force Clouding 🔴
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A Sith technique: pulling one's dark power inward and wearing a mask of insignificance, to hide in plain sight among Jedi.
**Alignment:** Dark Side, lesser
**Prerequisites:** Force Concealment 21+, Dark Side 20+, Sith teaching
**Learning class:** Lore-locked (Sith)
**Notes:** Used by the Order of the Sith Lords. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Clouding": https://starwars.fandom.com/wiki/Force_Clouding

#### ↳ False Light Side Aura 🔴
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Sith magic that disguises a dark aura as a light one. Related to the Quey'tek meditation.
**Alignment:** Dark Side, lesser
**Prerequisites:** Force Clouding 21+, Dark Side 30+
**Learning class:** Lore-locked (Sith)
**Notes:** First appeared in Darth Bane: Rule of Two. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "False light side aura": https://starwars.fandom.com/wiki/False_light_side_aura

---

#### Wall of Light 🔵 ⚠️
**Anchor Stats:** ForceOutput (requires multiple users' combined power) + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A devastating Light Side technique — multiple Jedi combining their Force power to create a wall of pure light side energy that severs an area from the dark side of the Force, destroying or driving out dark side entities, spirits, and Sith.
**Alignment:** Light Side only
**Prerequisites:** Tutaminis 21+, ForceControl 41+, ForceKnowledge 41+, Light Side alignment 30+
**Learning class:** Taught
**Notes:** ⚠️ **Requires multiple Force-users acting in concert — cannot be performed alone.** One of the most powerful Light Side techniques in Legends. Used to destroy Exar Kun's spirit on Yavin IV. The massive Force expenditure required is extremely debilitating for all participants.

---

#### Force Suppression ⚪
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Dampening or temporarily nullifying the Force connection of another being — making it difficult or impossible for them to use Force abilities.
**Alignment:** Neutral (Light Side uses it to restrain; Dark Side uses it to dominate)
**Prerequisites:** ForceControl 41+, ForceKnowledge 30+
**Learning class:** Taught
**Notes:** Does not permanently sever the connection (that is Sever Force). Temporary suppression during a confrontation.

> **Sub-application:**

#### ↳ Force Breach ⚪
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=4.0 (Advanced)** *(raised 2026-11-20)*
**Summary:** Actively tearing through a Force Barrier or Force protection to expose the opponent underneath.
**Notes:** Wookieepedia's "Force Breach" is a disambiguation between injuring through shatterpoints and Force suppression; kept here as an application of Force Suppression (2026-11-20). In the Old Sith Wars era, Force Breach was the name for advanced mastery of Force Suppression; in the Cold War era the name was applied to rupturing shatterpoints. (Corrected 2026-11-20, defense family pass.)
**Alignment:** Neutral
**Prerequisites:** ForceSuppression 15+
**Learning class:** Taught

---

#### Sever Force 🔵 ⚠️
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A non-lethal power that interrupts or blocks a being's connection to the Force with a wall of light side energy afflicting the target's mind. Usually lasting, but not always permanent.
**Alignment:** Light Side
**Prerequisites:** ForceControl 61+, ForceKnowledge 51+, ForceSuppression 30+
**Learning class:** Taught (rare)
**Notes:** ⚠️ **Exceptionally rare and grave.** The Jedi Order considers this only in extreme circumstances — it is equivalent to destroying a core part of a person's identity. The ancient Jedi scholar Odan-Urr called severing a connection the most powerful attack a Jedi could perform. Destroying a person's midi-chlorians, as Darth Plagueis discovered, is a different and darker method. (Corrected 2026-11-20, defense family pass.)
**Source:** Wookieepedia (Legends), "Sever Force": https://starwars.fandom.com/wiki/Sever_Force/Legends

---

#### Battle Meditation 🔵
**Anchor Stat:** Meditation — this is the defining Meditation ability; ForceOutput matters for range/scale
**Difficulty Tier: D=4.0 (Advanced)** — mastering this to any meaningful level takes years
**Summary:** The user extends their consciousness across an entire battlefield through the Force — coordinating allied forces, amplifying their cohesion and morale while inducing confusion and despair in enemies. Strategic ability.
**Alignment:** Light Side (a Dark Side variant exists but is destabilizing)
**Prerequisites:** Meditation 61+, ForceControl 41+, ForceKnowledge 30+
**Learning class:** Taught
**Notes:** One of the most strategically powerful Force abilities in Legends. Nomi Sunrider, Bastila Shan, and Darth Nihilus (inverted) are notable practitioners. Extremely rare. At army or fleet scale the practitioner must stay still and becomes a strategic anchor; at small scale it also works in skirmishes and duels. Also called Enhanced Coordination. (Corrected 2026-11-20, defense family pass.) Distinct from Battle Precognition (personal) — Battle Meditation affects entire allied forces.
> **Innate Talent:** `BattleMeditationAffinity` — XP cost ×0.3, Force Strain ×0.6. Equivalent innate case to ShatterSense. Bastila Shan is the canonical example. See Innate Talents section.
**Source:** Wookieepedia (Legends), "Battle meditation": https://starwars.fandom.com/wiki/Battle_meditation/Legends
---

#### Force Meld 🔵
**Anchor Stats:** Meditation + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Joining the minds of allied Force-sensitives so they act as a single entity and draw strength from each other. A refinement of Battle Meditation: where Battle Meditation sways Force users and non-sensitives on both sides, the meld coordinates and strengthens only the Force-sensitives on the user's side, which makes it easier to master.
**Alignment:** Light Side leaning. Not limited to the light side; its drawbacks fed the Dark Nest Crisis.
**Prerequisites:** Meditation 30+, ForceSense 30+ (anchoring a large meld: Meditation 51+)
**Learning class:** Taught
**Notes:** Known to the ancient Jedi, though dangerous: the Jedi under Grandmaster Awdrysta Pina used it to defeat the Legions of Lettow on Columus. Jorus C'baoth performed it at least eight times. Anakin Solo redeveloped it in the Yuuzhan Vong War; Jacen Solo used it on the Myrkr mission; Jaina Solo refined it for starfighter squadrons. Obi-Wan Kenobi warned it takes a Master of great power and depth to form a single-entity meld without destroying the minds involved. Pain and great disturbances are shared by all members. A light-side majority can keep one member from slipping to the dark side. A meld divided in purpose becomes a liability. Long use blurs identities. Available in every era as rare. Full rules: M6 reserve spec, Force meld. (Added 2026-11-20, M6 catalog review.)
**Source:** Wookieepedia (Legends), "Force-meld": https://starwars.fandom.com/wiki/Force-meld

---

#### Electric Judgment 🔵 ⚠️
**Anchor Stat:** ForceControl (channeling compassion rather than hatred is the key precision act)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A light side variant of Force Lightning — channeling Force energy through the hands as a bolt of golden or purple-white light. Bolts of variable intensity, set by effort, from stunning to deadly. Also called Emerald Lightning; it can show yellow-orange, green, white or gold.
**Alignment:** Light Side (distinct from Force Lightning's Dark Side nature)
**Prerequisites:** ForceControl 41+, Willpower 40+, Light Side 40+
**Learning class:** Taught, can manifest
**Notes:** ⚠️ **Controversial and rare.** It was at one time classed as forbidden within the Jedi Order. Plo Koon, Luke Skywalker and Jacen Solo used it. The Jedi Council historically discouraged it due to its visual similarity to Sith lightning, regardless of alignment. The technique channels compassion rather than hatred — intent is everything; the Jedi's use comes from a sense of determined justice. (Corrected 2026-11-20, defense family pass.)
**Source:** Wookieepedia (Legends), "Electric Judgment": https://starwars.fandom.com/wiki/Electric_Judgment

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Thought Shield ⚪
**Anchor Stats:** Willpower + Meditation
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Keeping one's thoughts, emotions and motives hidden. In battle it stops an enemy reading your next move.
**Alignment:** Neutral
**Prerequisites:** Willpower 10+, Meditation 10+
**Learning class:** Taught
**Notes:** Taught to Padawans from the earliest age; with practice it becomes second nature. Contests Telepathy and Mind Probe. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Thought shield": https://starwars.fandom.com/wiki/Thought_shield

---

#### Force Deflection (Rebuke) ⚪
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Deflecting incoming attacks, including blaster bolts, with the Force alone.
**Alignment:** Neutral
**Prerequisites:** ForceControl 30+, Force Barrier 21+
**Learning class:** Taught
**Notes:** Used by those without a lightsaber. Master Thon repelled a pirate salvo; Nomi Sunrider deflected a bolt barehanded. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force deflection": https://starwars.fandom.com/wiki/Force_deflection/Legends

---

#### Energy Resistance ⚪
**Anchor Stats:** ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** A barrier of energy-absorbing force around the user that reduces damage from energy weapons. Advanced forms also protect allies and grant immunity to poison and disease.
**Alignment:** Light Side leaning
**Prerequisites:** Force Barrier 15+
**Learning class:** Taught
**Notes:** Common among Jedi in the Jedi Civil War. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Energy resistance": https://starwars.fandom.com/wiki/Energy_resistance

---

#### Force Scattering ⚪
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Imprinting one's presence across an area so other Force users cannot find your exact location.
**Alignment:** Neutral
**Prerequisites:** Force Concealment 21+
**Learning class:** Taught
**Notes:** Kueller used it on Pydyr before confronting Luke Skywalker. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force scattering": https://starwars.fandom.com/wiki/Force_scattering

---

#### Force-flash ⚪
**Anchor Stats:** ForceControl
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Briefly fuzzing a security holocam to pass unseen, or producing a blinding flash of light.
**Alignment:** Neutral
**Prerequisites:** ForceControl 15+
**Learning class:** Taught
**Notes:** Seff Hellin used it in his prison raid; Abeloth's flash blinded ships across a system. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force-flash": https://starwars.fandom.com/wiki/Force-flash

---

### 🔵 HEALING FAMILY
*Restoring life, health, and vitality.*
**Anchor Stats:** All healing abilities anchor to **Meditation** primary + **ForceControl** secondary. Dark Transfer adds ForceKnowledge.

---

#### Force Heal (Others) 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Channeling healing Force energy into another person's body — accelerating recovery from wounds, illness, or injury.
**Alignment:** Light Side
**Prerequisites:** ForceHeal (Self) 21+, Light Side alignment 10+
**Learning class:** Taught
**Cost:** Instant, 25 per treatment; scale = wound severity.
**Notes:** More demanding than self-healing. Requires physical contact or very close proximity; easier on someone the healer is close to.

---

#### Revitalize 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Restoring stamina, consciousness, and alertness to an incapacitated or exhausted ally — bringing them back to fighting capacity.
**Alignment:** Light Side
**Prerequisites:** ForceHeal (Others) 21+, Meditation 20+
**Learning class:** Taught
**Cost:** Instant, 25.
**Notes:** Cannot restore HP directly — it restores functional capacity. A character revitalized after major injury can act but their wounds remain. Works on the exhausted, wounded or unconscious; organics only (not droids). Kreia used it to save Hanharr and Colonel Tobin; Luke offered it to an exhausted Mara Jade. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Revitalize": https://starwars.fandom.com/wiki/Revitalize

---

#### Transfer Force 🔵
**Anchor Stats:** ForceControl + Meditation
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Giving part of one's own life force to someone mortally wounded, saving their life.
**Alignment:** Light Side
**Prerequisites:** ForceHeal (Others) 30+, ForceControl 25+
**Learning class:** Taught
**Cost:** Instant, 25, plus a Vitality toll on the giver (reserve spec).
**Notes:** Luke Skywalker used it to heal Wedge Antilles. On Mortis the dying Daughter gave the rest of her life force, through Anakin, to revive Ahsoka Tano. The former entry (sharing Force reserves to boost someone's abilities) had no source. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Transfer Force": https://starwars.fandom.com/wiki/Transfer_Force

---

#### Reduce Injury ⚪
**Anchor Stats:** ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Lessening the damage of a strike as it lands, even one that would have killed. The user is still wounded, but less severely.
**Alignment:** Neutral
**Prerequisites:** Force Heal (Self) 21+, Control Pain 15+
**Learning class:** Taught
**Cost:** Instant reaction, 25.
**Notes:** Also called wound reduction. Game rule: lowers the wound by one severity step. (Added 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Reduce Injury": https://starwars.fandom.com/wiki/Reduce_Injury

---

#### Voss Healing Ritual 🔵 ⚠️
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A Voss ritual in which healers draw strength from many people to heal one injured patient.
**Alignment:** Light Side
**Prerequisites:** Force Heal (Others) 30+, Meditation 30+, taught by Voss healers
**Learning class:** Lore-locked (Voss healers)
**Cost:** Ritual, 125, shared among the participants.
**Notes:** ⚠️ **Lore-locked (Voss healers).** Common and ancient by the Cold War. The Sith Lord Darth Fulminiss learned it and corrupted it to drive people mad across great distances; that version is Dark Side, severe weight, and needs Sith Sorcery. (Added 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Voss healing ritual": https://starwars.fandom.com/wiki/Voss_healing_ritual

---

#### Revitalization of the Whuffa ⚪ ⚠️
**Anchor Stats:** ForceControl + Willpower
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A Nightsister technique that revitalizes the body and, with sufficient will, regrows a lost limb. Named for the regenerating Whuffa worm.
**Alignment:** Neutral
**Prerequisites:** Force Heal (Self) 41+, Willpower 41+, taught by the Witches of Dathomir
**Learning class:** Lore-locked (Nightsisters)
**Cost:** Ritual, 200.
**Notes:** ⚠️ **Lore-locked (Nightsisters / Witches of Dathomir).** The one exception to Force healing being unable to regrow limbs. (Added 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Revitalization of the Whuffa": https://starwars.fandom.com/wiki/Revitalization_of_the_Whuffa

---

#### Detoxify Poison ⚪
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Using the Force to neutralize toxins, venoms, or chemical agents in one's own or another's body.
**Alignment:** Neutral
**Prerequisites:** Meditation 15+, ForceHeal 10+
**Learning class:** Taught, can manifest
**Cost:** Meditation, 15 per session; free at level 60 (uncontested).
**Notes:** Works against biological toxins and most chemical agents. High-tech or exotic poisons (like Sith alchemical substances) are harder to neutralize. Also clears alcohol (Luke stayed sober). Needs extended concentration and removes present and future effects, not past damage. Not light-only: Count Dooku shook off the Karatos Plague Jango Fett poisoned him with, and Cade Skywalker resisted Darth Maladi's poison. Detoxify Poison in Another is an application, easier with someone close and nearby. Can manifest. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Detoxify Poison": https://starwars.fandom.com/wiki/Detoxify_Poison

---

#### Cure Disease ⚪
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Channeling Force energy to fight and eliminate disease or infection within a body, one's own or another's.
**Alignment:** Light Side (Wookieepedia lists it as a light side power; corrected 2026-11-20)
**Prerequisites:** ForceHeal (Self) 15+
**Learning class:** Taught
**Cost:** Meditation, 15 per hour; free at level 60 (uncontested).
**Notes:** Less effective against engineered or Force-enhanced diseases. Usually takes an hour or more of concentration, up to 20 hours for the most persistent diseases; a long-standing disease fought by directing one's own antibodies can take weeks. Clears the present and future effects only, not damage already done. On another person it is easier with someone close and nearby. Absorbs Control Disease and Control Another's Disease (old keys `ControlDisease`, `ControlAnothersDisease` resolve here). Cilghal used it. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Cure Disease": https://starwars.fandom.com/wiki/Cure_Disease; "Control Disease": https://starwars.fandom.com/wiki/Control_Disease

---

#### Dark Transfer 🔴/🔵 ⚠️
**Anchor Stats:** ForceKnowledge + Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Drawing on the dark side to heal someone on the brink of death, or at full strength to revive someone who has just died. The user perceives wounds and weakness as broken red lines (shatterpoints) and mends them with the Force; the same points can be used to destroy instead.
**Alignment:** 🔴 Dark Side. Some Jedi regard it as imposing one's own will in defiance of the will of the Force.
**Prerequisites:** ForceHeal (Others) 61+, Shatterpoint 21+, Dark Side 30+ — OR manifests instinctively under extreme need (Cade Skywalker)
**Learning class:** Lore-locked, can manifest (Cade)
**Cost:** Instant, 40, to save someone on the brink of death; ritual, 200, to revive someone who has just died. Dark, severe weight. (Set 2026-11-20.)
**Notes:** ⚠️ **Ancient Sith technique, exceptionally rare.** Credited to Karness Muur, one of the ancient Sith Lords and creator of the rakghoul plague, though it may be older still. Muur's essence, preserved in the Muur Talisman, used Celeste Morne's body to begin healing Darth Krayt, which gave Krayt his first understanding of it; Krayt learned the rest through his own death and revival. Cade Skywalker manifested it instinctively without a teacher, and used it around 137 ABY to revive Marasiah Fel on Vendaxa. Arcs of Force lightning appear around the user while it is used. Learning class: taught, can manifest. (Corrected 2026-11-20: earlier text credited Darth Plagueis and Abeloth, which is wrong.)
**Source:** Wookieepedia (Legends), "Dark transfer": https://starwars.fandom.com/wiki/Dark_transfer

---

### 🔵 LIGHT SIDE FAMILY
*Powers accessible only to those aligned with the Light Side of the Force.*
**Anchor Stats:** Varies by ability — Meditation dominant for calm/aura abilities, ForceOutput for Force Light, ForceControl for Malacia.

---

#### Force Light 🔵
**Anchor Stats:** ForceOutput + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting a pulse or sustained beam of pure light side Force energy — anathema to dark side beings and entities. Purifies dark side corruption in objects, places, and beings.
**Alignment:** Light Side
**Prerequisites:** ForceBarrier 30+, ForceKnowledge 30+, Light Side 30+
**Learning class:** Taught
**Cost:** Instant, 25; ritual, 125, to cleanse a place.
**Notes:** Effective against Sith spirits, dark side nexuses, and Force wraiths. Against a darksider it weakens their connection to the Force. It can purge or contain dark manifestations in places, spirits or people (sometimes to their harm), and sever a Sith battlelord's bond with followers. Thon cleansed the whole of Ambria, isolating the darkness in a lake; Arca Jeth purged Freedon Nadd's sarcophagus at Iziz; Yaddle, Nomi Sunrider and Shae Koda also used it. Not a standard combat tool. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Force Light": https://starwars.fandom.com/wiki/Force_Light

---

#### Force Enlightenment 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A supplementary light side state that pushes the user's most-trained Force powers to the highest degree they have ever reached in training, all at once.
**Alignment:** Light Side
**Prerequisites:** Meditation 61+, ForceControl 51+, all primary abilities at Adept tier
**Learning class:** Taught
**Cost:** Sustained, 8 per round.
**Notes:** Cannot be forced or rushed — arises from complete serenity. Brief duration. Meetra Surik learned it after talking with Masters Vrook Lamar, Kavar and Zez-Kai Ell; it enlightened her Force Speed, Force Armor and Force Valor. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Force Enlightenment": https://starwars.fandom.com/wiki/Force_Enlightenment

---

#### Serenity (Trance) 🔵
**Anchor Stats:** Meditation + Willpower
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A calm meditative trance used to center oneself, even in the middle of a fight: Qui-Gon Jinn knelt in it behind the laser gates during his duel with Darth Maul.
**Alignment:** Light Side
**Prerequisites:** Meditation 51+ (Wookieepedia: almost only attainable by Jedi Masters; raised 2026-11-20)
**Learning class:** Taught
**Cost:** Meditation in a lull, 25.
**Notes:** A brief state to regain focus and power. This is the lore basis for "centering in a lull" in the M6 reserve spec. Calming other people is a Mind Trick application, and calming animals is Animal Bond; together these replace the former Aura of Serenity entry, which had no Legends source. Not to be confused with Serenity, the Force Priestess. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed.)
**Source:** Wookieepedia (Legends), "Serenity (trance)": https://starwars.fandom.com/wiki/Serenity_(trance)

---

#### Cleanse Mind 🔵
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Negating an ongoing mind-affecting Force power on oneself or an ally within line of sight.
**Alignment:** Light Side
**Prerequisites:** Thought Shield 21+, Meditation 30+
**Learning class:** Taught
**Notes:** A crucial power of Jedi Consulars. Counters Mind Trick applications, Force Fear, Force Corrupt and similar effects. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed.)
**Source:** Wookieepedia (Legends), "Cleanse Mind": https://starwars.fandom.com/wiki/Cleanse_Mind
---

#### Malacia 🔵
**Anchor Stats:** ForceControl + ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Disrupting a target's inner ear through the Force — causing severe disorientation, nausea, and loss of balance without any physical damage. Non-lethal incapacitation.
**Alignment:** Light Side (uniquely non-harmful; considered acceptable by most of the Jedi Order)
**Prerequisites:** ForceControl 41+, MindTrick 21+
**Learning class:** Taught
**Cost:** Instant, 12, contested: half the usual base, because the user turns the target's own energy against them instead of spending their own.
**Notes:** One of the few combat Force abilities the Jedi Order broadly approves of, as it incapacitates without causing injury (severe enough to make targets vomit). Organics only. Described in Asli Krimsan's holocron and the Great Holocron; Oppo Rancisis taught it. Old Republic Jedi rarely used it, preferring Force Push or Mind Trick. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Malacia": https://starwars.fandom.com/wiki/Malacia

---

#### Floating Meditation 🔵
**Anchor Stats:** Meditation + Telekinesis (the ability, not the stat)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** During deep meditative states, levitating the body above the ground — a visible manifestation of deep Force communion.
**Alignment:** Neutral (Galen Marek used it as Vader's apprentice; corrected 2026-11-20)
**Prerequisites:** Meditation 41+, Telekinesis 21+
**Learning class:** Can manifest
**Cost:** Meditation, 15 per session; free at level 60.
**Notes:** Also called Rising Meditation. No combat application; nearby objects often circle the user, and it can be held during Battle Meditation (Bastila Shan). Can manifest: Luke discovered it by accident. Users: Revan, Barriss Offee, Jacen Solo. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Floating Meditation": https://starwars.fandom.com/wiki/Floating_Meditation

---

#### Revelation 🔵 ⚠️
**Anchor Stats:** ForceSense
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Locating enemies through the Force: each one is silhouetted by a faint shimmering light that gives away where they are.
**Alignment:** Light Side
**Prerequisites:** ForceSense 41+, Light Side 20+
**Learning class:** Lore-locked (Disciples of Twilight)
**Cost:** Instant, 25.
**Notes:** ⚠️ **Lore-locked:** formulated by the Disciples of Twilight (Legacy era). The former entry (seeing hidden truths, motives and identities) had no source. (Corrected 2026-11-20, healing and light side pass.)
**Source:** Wookieepedia (Legends), "Revelation": https://starwars.fandom.com/wiki/Revelation

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Inspire 🔵
**Anchor Stats:** Meditation + Charisma
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Filling allies with hope and courage to face terrible odds, possibly making them slightly more resistant to injury.
**Alignment:** Light Side
**Prerequisites:** Meditation 30+, Charisma 21+
**Learning class:** Taught
**Cost:** Sustained, 5 per round; scale counts allies.
**Notes:** First appeared in Knights of the Old Republic II. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the healing and light side pass.)
**Source:** Wookieepedia (Legends), "Inspire": https://starwars.fandom.com/wiki/Inspire

---

#### Force Harmony 🔵
**Anchor Stats:** Meditation + ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Several willing Force users joining their energies into a pure manifestation of the light side, protecting them from dark side powers and able to sever an opponent from the dark side.
**Alignment:** Light Side
**Prerequisites:** Meditation 51+, Light Side 50+, two or more participants
**Learning class:** Taught
**Notes:** Luke, Leia and the unborn Anakin Solo used it against the reborn Palpatine, turning his Force storm on him. Cost: sustained, 8 per round, shared among participants. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the healing and light side pass.)
**Source:** Wookieepedia (Legends), "Force harmony": https://starwars.fandom.com/wiki/Force_harmony

---

### 🔴 DARK SIDE FAMILY
*Powers accessible only to those who have embraced the dark side of the Force.*
**Anchor Stats:** Destructive/discharge abilities (Lightning, Rage, Drain) → **ForceOutput** primary. Psychological/subtle dark abilities (Fear, Subjugate, Memory Walk) → **ForceControl** primary.

---

#### Force Lightning 🔴
**Difficulty Tier: D=2.5 (Complex)** *(set 2026-11-20)*
**Anchor Stat:** ForceOutput (the discharge itself) — ForceControl governs precision and Strain efficiency
**Summary:** Channeling raw dark side energy through the hands as destructive electrical discharge — one of the most iconic and feared Sith abilities. Causes extreme pain and physical damage.
**Alignment:** Dark Side — use causes drift regardless of intent
**Prerequisites:** ForceControl 41+, Dark Side alignment 20+
**Learning class:** Taught, can manifest
**Notes:** **Requires organic limbs.** Cybernetic hands cannot channel Force Lightning (Darth Vader's limitation). High Force Strain per use. Powerful discharges branch into dozens of forks, so skilled users can strike several foes at once; it can also be sent through a touch. Commonly called Sith lightning. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Force lightning": https://starwars.fandom.com/wiki/Force_lightning/Legends

> **Sub-applications:**

#### ↳ Force Shock 🔴
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** A minor, quick discharge of Force Lightning — less powerful but faster and less draining. A "snap" of electrical Force energy.
**Alignment:** Dark Side
**Prerequisites:** ForceLightning 10+
**Learning class:** Taught, can manifest
**Notes:** Can be used as a quick distracting attack or intimidation tool.

#### ↳ Chain Lightning 🔴
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Force Lightning that arcs between multiple targets — a single bolt that leaps from person to person in a chain.
**Alignment:** Dark Side
**Prerequisites:** ForceLightning 30+, Dark Side 30+
**Learning class:** Taught
**Notes:** Exponentially more draining than standard Lightning. Requires clear lines between targets.

#### ↳ Force Storm (Lightning) 🔴
**Anchor Stat:** ForceOutput — the definitive raw-power expression
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A massive, sustained electrical maelstrom that fills an area with arcing lightning — area-of-effect devastation.
**Alignment:** Dark Side — severe drift
**Prerequisites:** ForceLightning 61+, Dark Side 60+
**Learning class:** Taught
**Notes:** ⚠️ One of the most destructive single-user abilities in Legends. Used by Palpatine. Extreme Force drain; endangers the user if sustained. A perfect case of the Output/Control gap: high Output + minimal proficiency = powerful but wild and indiscriminate; high proficiency + strong Output = the controlled, fleet-devastating storm of a Palpatine.

---

#### ↳ Other Force Lightning Variants 🔴
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Lightning applications with game-specific origins: Force Tempest (lightning from all limbs in a whirlwind), Sith Barrage (a bolt up from the ground), Lightning Shield (a protective field that also shocks nearby enemies), Lightning Grenade and Lightning Bomb (lightning made to explode in or out of a victim), Sith Seeker (a push followed by an uncontrolled ball of lightning), Lightning Burst (arcs to adjacent enemies). Hassat-durr is a separate white-lightning version used by the Baran-Do Sages, which is not dark side.
**Alignment:** Dark Side, standard (Hassat-durr: Neutral)
**Prerequisites:** Force Lightning 30+ (Lightning Grenade and Seeker: also Telekinesis 30+)
**Learning class:** Taught
**Notes:** Treat each as an application of Force Lightning, not its own track. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force lightning" (Variants section): https://starwars.fandom.com/wiki/Force_lightning/Legends

---

#### Force Drain 🔴
**Anchor Stats:** ForceOutput (magnitude of leeching) + ForceControl (sustaining without destabilizing)
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Leeching life force, Force energy, or physical vitality from living beings to sustain and empower oneself. The parasitic dark side power.
**Alignment:** Dark Side
**Prerequisites:** ForceControl 30+, Dark Side 25+
**Learning class:** Taught
**Notes:** Addictive tendency — each use makes the temptation stronger. At high levels (Darth Nihilus, Vitiate), can drain an entire planet's population. A spectrum of techniques: **drain life** heals the user from a victim's vitality (dark healing), and **drain Force** restores the user's Force energy from the victim's. Mastery scales the area, sometimes dramatically. In the engine, drain Force refills the pool by the same share as absorbing (0.5 rising to 0.8 with mastery). (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Force drain": https://starwars.fandom.com/wiki/Force_drain/Legends

---

#### Force Enrage 🔴
**Anchor Stat:** ForceOutput (rage amplifies raw power directly)
**Difficulty Tier: D=1.5 (Moderate)** — easy to start, hard to stop
**Summary:** Channeling anger, hatred, and emotion into a surge of Force-enhanced physical power — temporarily amplifying speed, strength, and aggression dramatically at the cost of control and alignment.
**Alignment:** Dark Side — severe drift
**Prerequisites:** EnhanceAttribute 15+, Dark Side drift 20+
**Learning class:** Can manifest
**Notes:** *(Prerequisite refers to the Enhance Attribute body enhancement ability at level 15+, not a stat — see stat reference note in that entry.)* During Force Rage the user is difficult to reason with and may attack allies. The crash afterward leaves significant physical strain and mental exhaustion. Addictive. Alias: Force Rage (the old key `ForceRage` resolves here). (Renamed or merged 2026-11-20 to match Wookieepedia.) Very few Jedi used it without falling; Jaden Korr was one. Luke Skywalker used dark rage against Darth Caedus in 40 ABY.
**Source:** Wookieepedia (Legends), "Force Enrage": https://starwars.fandom.com/wiki/Force_Enrage

---

#### Force Scream 🔴
**Anchor Stats:** ForceOutput (the burst) + Willpower
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A psychic burst of raw emotional pain, grief, or rage released through the Force — a wave of Force energy that disrupts concentration and causes psychological pain to those nearby.
**Alignment:** Dark Side leaning (can emerge involuntarily from trauma — less alignment cost if involuntary)
**Prerequisites:** Dark Side drift 40+, Willpower 40+
**Learning class:** Can manifest
**Notes:** Often triggered involuntarily by great trauma or grief (Darth Vader on learning of Padmé's death). A controlled version can be used as a weapon. The engine may trigger it involuntarily when a character who knows it, or has a high Dark score, is in a rage state, badly strained or losing a fight; it then counts as a dark deed. (Agreed 2026-11-20.)
**Source:** Wookieepedia (Legends), "Force scream": https://starwars.fandom.com/wiki/Force_scream/Legends
---

#### Waves of Darkness 🔴
**Anchor Stats:** ForceOutput + Dark Side alignment
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Projecting an aura of pure dark side Force energy outward — causing dread, disorientation, and despair in all nearby beings. Environmental dark side manifestation.
**Alignment:** Dark Side — severe drift
**Prerequisites:** Sith Sorcery, Dark Side 50+, ForceControl 41+
**Learning class:** Lore-locked (Sith sorcery)
**Notes:** Area effect. Corrupts Force nexuses and weakens Light Side users in the affected area. Conjured through Sith sorcery as palpable, often visibly dark waves with roaring, thunderous sound. Victims feel intense despair and confusion and, if held long enough, are compelled to flee. Queen Amanoa used it on Onderon around 4,000 BBY, and Darth Tyranus used it against Obi-Wan Kenobi and Anakin Skywalker in 23 BBY. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Waves of darkness": https://starwars.fandom.com/wiki/Waves_of_darkness

---

#### Darksight 🔴
**Anchor Stat:** ForceSense (dark-attuned perception)
**Difficulty Tier: D=4.0 (Advanced)** *(raised 2026-11-20 with the rewrite)*
**Summary:** Foreseeing various possible futures and using that knowledge to manipulate events toward the outcome that serves the Dark. Called Darksight by the Sorcerers of Rhand and Cronal, and Heartshadow by the Nightsisters of Dathomir.
**Alignment:** Dark Side
**Prerequisites:** ForceSense 51+, Precognition 30+, Dark Side 40+, taught by the Sorcerers of Rhand or the Nightsisters (lore-locked)
**Learning class:** Lore-locked (Rhand, Nightsisters)
**Notes:** Complementary ability to Force Sight (which perceives the living Force) — Darksight perceives the dark currents specifically. Sith naturally develop this. The Rhandites believed a future could only be made possible if it aligned with the Dark. Cronal learned it from them and used it in his war against the New Republic. Replaces the old description (seeing in darkness by the dark side), which had no Legends source. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Darksight": https://starwars.fandom.com/wiki/Darksight

---

#### Dark Energy Trap 🔴
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** An intense concentration of dark side power, conjured through Sith sorcery, that appears as a faint purple shimmer in the air. It immobilizes even a skilled Force-sensitive for a time, and can hold an unskilled being indefinitely.
**Alignment:** Dark Side
**Prerequisites:** Sith Sorcery, ForceControl 41+, Dark Side 30+
**Learning class:** Lore-locked (Sith sorcery)
**Notes:** Requires preparation time. Used by Sith to protect locations or objects. Darth Tyranus used dark energy traps, alongside waves of darkness, against a Jedi team in the Valley of the Dark Lords on Korriban in 23 BBY. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Dark energy trap": https://starwars.fandom.com/wiki/Dark_energy_trap

---

#### Deadly Sight 🔴 ⚠️
**Anchor Stats:** ForceOutput (magnitude of destruction) + ForceControl (sustained, directed gaze)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Harnessing fury and hatred and projecting them through an intense glare: the victim's skin blisters and extremities vaporize. It hurts everyone in the user's field of vision, allies and civilians included.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** Dark Side 70+, ForceControl 71+. Late New Sith Wars era (Brotherhood of Darkness): Dark Side 40+, ForceControl 51+, because the technique was widely taught then
**Learning class:** Taught
**Notes:** ⚠️ **Exceptionally rare — considered legendary even among the Sith.** Few practitioners in all of recorded history. Massive Force drain. Direct sustained eye contact required. Once extremely rare even among the Sith, its use exploded in the last decades of the New Sith Wars. The Jedi Order forbade it to Jedi Knights. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Deadly Sight": https://starwars.fandom.com/wiki/Deadly_Sight

---

#### Crush Opposition 🔴
**Anchor Stats:** ForceOutput + Willpower
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Sapping the willpower of everyone around the user, to a degree and radius that grow with skill.
**Alignment:** Dark Side, standard
**Prerequisites:** Force Fear 21+, Dark Side 30+
**Learning class:** Taught
**Notes:** Replaces the former Force Subjugate entry, which had no Legends source; breaking a will completely is Mind Control. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed.)
**Source:** Wookieepedia (Legends), "Crush Opposition": https://starwars.fandom.com/wiki/Crush_Opposition

---

#### Corruption 🔴
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Hurling a bolt of pure dark side energy.
**Alignment:** Dark Side, standard
**Prerequisites:** ForceOutput 30+, Dark Side 25+
**Learning class:** Taught
**Notes:** Not the same as Force Corrupt (the mind trick variant) or the Corruption value in the alignment system. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed.)
**Source:** Wookieepedia (Legends), "Corruption": https://starwars.fandom.com/wiki/Corruption
---

#### Sutta Chwituskak 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The Bolt of Hatred: an ancient Sith sorcery that hurls a bolt of concentrated dark side hatred at a target. Sutta Chwituskak ("Flung Spears") is its formal Sith name.
**Alignment:** Dark Side
**Prerequisites:** Sith Sorcery, ForceKnowledge 61+, Dark Side 60+ (lore-locked)
**Learning class:** Lore-locked (Sith sorcery)
**Notes:** ⚠️ **Ancient Sith technique.** Extremely obscure. Likely era-locked to early Sith Empire periods. First appeared in Tales of the Jedi: The Freedon Nadd Uprising; named in the Book of Sith. Replaces the old "unknown mechanism" description. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Sutta Chwituskak": https://starwars.fandom.com/wiki/Sutta_Chwituskak

---

#### Spear of Midnight Black (Darkshear) 🔴 ⚠️
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An arcane power that channels the Dark in a sustained, directed burst, or forges it into an imperceptible spear of midnight black. A strike inflicts years of atrophy in a single moment: armor rusts and turns brittle, power cells drain, machinery jams, and a person can age thirty years at once as heart, lungs and joints fail.
**Alignment:** Dark Side — severe drift
**Prerequisites:** Dark Side 60+, ForceControl 61+, taught by the Sorcerers of Rhand (lore-locked)
**Learning class:** Lore-locked (Sorcerers of Rhand)
**Notes:** ⚠️ **Extremely rare Sith technique.** Associated with ancient Sith sorcerers. The technique leaves a distinctive dark side signature in the Force. Damage can sometimes be reversed with bacta, but may need prosthetic replacement. A power of the Sorcerers of Rhand. (Corrected 2026-11-20, dark side family pass.)
**Source:** Wookieepedia (Legends), "Darkshear": https://starwars.fandom.com/wiki/Darkshear

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Force Destruction 🔴
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Dark side energy stored in the body and released as a massive sphere that paralyzes or vaporizes everything in a large radius, with backlash beyond it.
**Alignment:** Dark Side, severe
**Prerequisites:** ForceOutput 61+, Dark Side 50+
**Learning class:** Taught
**Notes:** Extremely exhausting, so unreliable as a routine attack. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Destruction": https://starwars.fandom.com/wiki/Force_Destruction

---

#### Force Maelstrom 🔴
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A storm of dark-side energy and lightning around the user that strikes everything nearby.
**Alignment:** Dark Side, severe
**Prerequisites:** Force Lightning 41+, Dark Side 50+
**Learning class:** Taught
**Notes:** Darth Malgus used it; Darth Sidious mastered it as a step toward Force storm. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Force Maelstrom": https://starwars.fandom.com/wiki/Force_Maelstrom

---

#### Hatred 🔴
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** An often involuntary release of the dark side: the user's hate radiates from them in palpable waves.
**Alignment:** Dark Side, standard
**Prerequisites:** Dark Side 25+ (can manifest involuntarily)
**Learning class:** Can manifest
**Notes:** Allana Solo used it in fear and anger in 43 ABY. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.) The engine may trigger it involuntarily when a character who knows it, or has a high Dark score, is in a rage state, badly strained or losing a fight; it then counts as a dark deed. (Agreed 2026-11-20.)
**Source:** Wookieepedia (Legends), "Hatred": https://starwars.fandom.com/wiki/Hatred

---

#### Heart Stun 🔴
**Anchor Stats:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Halting the heart in a kind of stasis, to capture a target without a fight, or fatally.
**Alignment:** Dark Side, standard
**Prerequisites:** Force Choke 21+, ForceControl 41+
**Learning class:** Taught
**Notes:** Rumored to have kept General Grievous alive; Darth Maul used it fatally. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Heart stun": https://starwars.fandom.com/wiki/Heart_stun

---

#### Cryokinesis 🔴
**Anchor Stats:** ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Drawing heat out of a target so it drops rapidly in temperature, becoming cold and fragile. Cannot shape ice despite the name.
**Alignment:** Dark Side, standard
**Prerequisites:** ForceControl 30+, Dark Side 20+
**Learning class:** Taught
**Notes:** First mentioned in the Jedi Academy Training Manual. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Cryokinesis": https://starwars.fandom.com/wiki/Cryokinesis

---

#### Create Force Wraith 🔴
**Anchor Stats:** ForceKnowledge + ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Creating a being of dark side energy. Each use seduces the user further to the dark side.
**Alignment:** Dark Side, severe
**Prerequisites:** ForceKnowledge 51+, Dark Side 50+
**Learning class:** Lore-locked
**Notes:**  (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Create Force Wraith": https://starwars.fandom.com/wiki/Create_Force_Wraith

---

#### Consume Essence 🔴
**Anchor Stats:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Feeding on the anger, strength and death around the user to gain strength.
**Alignment:** Dark Side, standard
**Prerequisites:** Force Drain 21+, Dark Side 30+
**Learning class:** Taught
**Notes:** Darth Maul fed on his opponents' anger after Qui-Gon fell; Darth Krayt used it to hold off his Vong implants. First identified in Star Wars: The Old Republic. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.) In the engine it refills the pool from the death and anger around the user, by the same share as absorbing (0.5 rising to 0.8 with mastery). (Agreed 2026-11-20.)
**Source:** Wookieepedia (Legends), "Consume Essence": https://starwars.fandom.com/wiki/Consume_Essence

---

#### Possession 🔴
**Anchor Stats:** ForceKnowledge + Meditation
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A spirit or essence taking over a living being's body and directing it.
**Alignment:** Dark Side, severe
**Prerequisites:** ForceKnowledge 71+, Dark Side 70+ (or as a spirit)
**Learning class:** Lore-locked
**Notes:** Vitiate shared his essence with the Children of the Emperor and possessed nearly every being on Ziost; Mother Talzin possessed Dooku. Resolves the Possession item in the questions file. (Added 2026-11-20 from the Wookieepedia audit. Tier and prerequisites proposed; confirm in the family pass.)
**Source:** Wookieepedia (Legends), "Possession": https://starwars.fandom.com/wiki/Possession/Legends

---

### ⚪ TELEPORTATION & SPACE/TIME FAMILY
*The rarest abilities — manipulating the fabric of space and time through the Force.*
**Anchor Stats:** ForceControl (folding space) + ForceSense (perceiving where you're going). Meditation dominant for faction techniques (Phase, Fold Space).

---

#### Flow-Walking ⚪ ⚠️
**Anchor Stats:** ForceSense + Meditation
**Difficulty Tier: D=4.0 (Advanced)** — faction-locked AND inherently advanced
**Summary:** A rare Aing-Tii technique of flowing along the currents of the Force to view the past and the future firsthand.
**Alignment:** Neutral (Aing-Tii tradition). Luke Skywalker warns that the wanting behind it starts many down the path to the dark side.
**Prerequisites:** ForceSense 61+, ForceControl 51+, must be taught by Aing-Tii
**Learning class:** Lore-locked (Aing-Tii)
**Cost:** Meditation, 40 per walk.
**Notes:** ⚠️ **Faction-locked — Aing-Tii monks.** Jacen Solo and Ben Skywalker learned it from the Aing-Tii; Ben was so overwhelmed by one walk that he swore never to do it again. The past cannot be changed (Darth Caedus lied to Tahiri Veila that it could: "the splash is real, but the river doesn't change"). The one way to touch the past is to leave an imprint of oneself in it, as Jacen did to link Leia to the Tachyon Flier crash site. Walkers must stay anchored in the present or risk losing themselves in the flow, and leave a blur as they travel. Jacen watched the Jedi Temple raid and Jedi Council meetings this way. The former "time-drifting" physical travel note had no source; Luke never learned it. (Corrected 2026-11-20, space-time pass.)
**Source:** Wookieepedia (Legends), "Flow-walking": https://starwars.fandom.com/wiki/Flow-walking

---

#### Teleportation ⚪ ⚠️
**Anchor Stats:** ForceControl + ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Moving oneself (or, for some, others) from one place to another almost instantly.
**Alignment:** Neutral
**Prerequisites:** ForceControl 61+, ForceSense 51+
**Learning class:** Taught (rare)
**Cost:** Instant, 40; scale = distance.
**Notes:** ⚠️ Among the most uncommon of rare powers; costs more and takes longer to master than most. A beginner moves about four feet; a master can go anywhere they can clearly see. Users: Vitiate (anywhere in his vicinity), Darth Jadus, Dread Master Tyrans (between falling floor tiles) and Dread Master Raptus (teleporting others away from himself), Mother Talzin (as green mist), Abeloth, some of Palpatine's Force Adepts; Plagueis spoke of Sith who moved instantly through time and space. Rarely used by Jedi. Related: Fold Space (Aing-Tii) and Force Travel (dark). The former "almost no documented cases" note was wrong. (Corrected 2026-11-20, space-time pass.)
**Source:** Wookieepedia (Legends), "Teleportation (Force power)": https://starwars.fandom.com/wiki/Teleportation_(Force_power)/Legends

---

#### Phase ⚪ ⚠️
**Anchor Stats:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Passing through solid matter such as walls and doors. It can also be used to reach into someone's body to deadly effect.
**Alignment:** Neutral (reaching into a body to kill is judged as a deed)
**Prerequisites:** ForceControl 51+, Meditation 41+
**Learning class:** Lore-locked (Killik memories)
**Cost:** Sustained, 8 per round.
**Notes:** ⚠️ **Lore-locked:** learned only through Killik memories (being Joined to a nest) or rare rediscovery, as An'ya Kuro did. Raynar Thul said the Killiks developed it while building the Maw; Leia suspected the Celestials, since the Killiks absorb the memories of anyone Joined to them. Bazel Warv used it while suffering Force psychosis. Formerly listed as a Fallanassi technique that also hid the user from Force perception; neither has a source. (Corrected 2026-11-20, space-time pass.)
**Source:** Wookieepedia (Legends), "Phase": https://starwars.fandom.com/wiki/Phase

---

#### Fold Space ⚪ ⚠️
**Anchor Stats:** ForceControl + ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Bending space to move an object, or possibly oneself, instantly from one place to another. Also called Transmigrate.
**Alignment:** Neutral (Aing-Tii tradition)
**Prerequisites:** Meditation 51+, ForceControl 51+, taught by the Aing-Tii
**Learning class:** Lore-locked (Aing-Tii)
**Cost:** Instant, 40; scale = mass and distance.
**Notes:** ⚠️ **Lore-locked — Aing-Tii (Kathol Rift).** Tadar'Ro taught it to Luke Skywalker in 43.5 ABY; Abeloth used it in 44 ABY; Luke and Leia used it inside the Monolith. With the right technology it can move ships. Application: **Aura of Freedom**, letting the user and nearby allies resist being moved by the Force. Formerly listed as a Fallanassi technique. Old key `ForceTeleportation` resolves here. (Corrected 2026-11-20, space-time pass.)
**Source:** Wookieepedia (Legends), "Fold space": https://starwars.fandom.com/wiki/Fold_space

---

#### Art of the Small ⚪ ⚠️
**Anchor Stats:** Meditation + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Shrinking one's Force presence to microscopic size in meditation, perceiving the universe at the molecular scale and rearranging molecules, taking them apart or building new ones.
**Alignment:** Neutral
**Prerequisites:** Meditation 51+, ForceControl 41+
**Learning class:** Taught
**Cost:** Meditation, 40; sustained 8 per round to stay hidden.
**Notes:** ⚠️ Extremely rare. Took talented Jedi Knights a year or two to master. Uses: molecular healing (eliminating toxins, rebuilding cells and proteins) and hiding one's presence completely, even invisibility. Named by Vergere, who gave her tears healing properties for Mara and taught it to Jacen Solo and Cilghal. Jacen taught Ben, who taught Mara; Allana Solo used it to hide. Onimi's control was greater still: he made toxins in his own body and used them to control Shimrra. Formerly credited to Ood Bnar, with a "hiding inside a living body" use; neither has a source. (Corrected 2026-11-20, space-time pass.)
**Source:** Wookieepedia (Legends), "Art of the Small": https://starwars.fandom.com/wiki/Art_of_the_Small

---

#### Dimension Shift ⚪ ⚠️
**Anchor Stats:** ForceControl + ForceOutput
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Making an object vanish, either by moving its matter into an alternate dimension or by compressing its molecules, so other things can pass through the space it occupied. The user can later recall it from anywhere through a link set up beforehand, restoring it so precisely that no trace of the disappearance remains. Used to hide doors, cupboards and objects. It works on matter the user links to, not on the user's own body; passing through walls is Phase.
**Alignment:** Neutral
**Prerequisites:** ForceControl 61+, Telekinesis 41+, Force-strong users only (pool gate in the M6 reserve spec)
**Learning class:** Taught, can be rediscovered
**Cost:** Instant, 40 per object. (Set 2026-11-20.)
**Notes:** ⚠️ Rare. Jedi Master Plett used it to make cupboards and doors in his house on Belsavis. Irek Ismaren rediscovered it on Belsavis, and Leia Organa Solo learned it while his prisoner. Jorj Car'das demonstrated it, possibly learned from the Aing-Tii. Learning class: taught, can be rediscovered. The name is conjectural (Wookieepedia). (Corrected 2026-11-20: the lore file previously described it as making the user intangible, with a Teleportation prerequisite.)
**Source:** Wookieepedia (Legends), "Dimension Shift": https://starwars.fandom.com/wiki/Dimension_Shift. Appearances per Jared: *Children of the Jedi* (first) and *Vision of the Future*.
---

#### Force Storm (Wormhole) 🔴 ⚠️
**Anchor Stats:** ForceOutput + ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A volatile dark side power that creates hyperspace wormholes able to displace objects across vast distances and tear apart the surfaces of entire planets.
**Alignment:** Dark Side — severe weight
**Prerequisites:** Dark Side 90+, ForceControl 91+, Telekinesis 61+, ForceSense 61+ (mastery across many disciplines)
**Learning class:** Lore-locked (Book of Anger, Darkstaff)
**Cost:** Ritual, 200; scale up to a planet.
**Notes:** ⚠️ **Lore-locked:** the technique is recorded in Darth Sidious's Book of Anger, the first volume of his Dark Side Compendium. Incredibly difficult to control once unleashed. The Sith artifact the Darkstaff made one in the New Sith Wars that annihilated Darth Rivan's army and threw him forward in time to the Light and Darkness War. Sidious rediscovered it nearly a thousand years later, used one to seize Luke from Coruscant, and was consumed by his own storm at Pinnacle Base when his control was negated. (Corrected 2026-11-20, space-time pass.)
**Source:** Wookieepedia (Legends), "Force storm (wormhole)": https://starwars.fandom.com/wiki/Force_storm_(wormhole)

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Force Travel 🔴
**Anchor Stats:** ForceOutput + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Travelling great distances instantly through a momentary rift in space. More corrupting the farther and less familiar the destination.
**Alignment:** Dark Side. Weight grows with the jump: a short hop to a familiar place is standard; a far or unfamiliar destination is severe.
**Prerequisites:** ForceOutput 61+, ForceKnowledge 51+, Dark Side 50+
**Learning class:** Taught
**Cost:** Instant, 40; scale = distance.
**Notes:** It breaks the normal rules of the galaxy by ripping the Force asunder, which is why it corrupts. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the space-time pass.)
**Source:** Wookieepedia (Legends), "Force travel": https://starwars.fandom.com/wiki/Force_travel

---

### ⚪ NATURE & ENVIRONMENT FAMILY
*Interacting with the living Force through plants, animals, and the environment.*
**Anchor Stats:** Animal Bond → **ForceSense** (living Force empathy). Plant Surge → ForceSense + Meditation. Environmental manipulation → ForceSense + ForceControl.

---

#### Animal Bond ⚪
**Anchor Stat:** ForceSense (living Force empathy)
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Communicating with, calming, or forming a deep empathic bond with non-sentient animals through the Force.
**Alignment:** Neutral
**Prerequisites:** ForceSense 21+
**Learning class:** Taught (younglings), can manifest
**Cost:** Instant, 10; contested to control a hostile beast. Free at level 40 for calming.
**Notes:** Passive calming is automatic. An active bond allows rudimentary communication of intent and emotion. Also called Animal friendship, Beast Control or Beast Trick: a calmed beast can be controlled and used as a mount or guard. Taught to many younglings as a passive ability. Kreia taught it to the Exile; Tott Doneeta befriended and rode a boma on Onderon. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Animal bond": https://starwars.fandom.com/wiki/Animal_bond

---

#### Plant Surge 🔵
**Anchor Stats:** ForceSense + Meditation
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Channeling Force energy into plant life to accelerate growth, direct vines or branches, or revitalize dying vegetation. Also known as Consitor Sato.
**Alignment:** Light Side
**Prerequisites:** ForceSense 21+, Meditation 15+
**Learning class:** Taught
**Cost:** Instant, 15, or sustained 3 per round to entangle. Free at level 60 for growing plants.
**Notes:** Primarily utility and survival application. In battle, plants can grow and twist around opponents in seconds, ensnaring them; the Jedi used this to end fights with minimal violence. Kar Vastor used it on Haruun Kal. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Plant Surge": https://starwars.fandom.com/wiki/Plant_Surge

---

#### Pyrokinesis ⚪
**Anchor Stat:** ForceControl (molecular agitation precision)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Telekinetically exciting molecules in combustible material to generate fire — creating or directing flame through Force-driven molecular agitation.
**Alignment:** Neutral (an attack is judged by the deed)
**Prerequisites:** Telekinesis 25+, ForceControl 20+
**Learning class:** Taught, can manifest
**Cost:** Instant, 15. Free at level 60 for lighting a fire.
**Notes:** Pyrokinesis is a purely physical application of telekinesis at the molecular level: rubbing air molecules together to make heat, or steering existing fire. Conjuring flames from the sky overlaps Alter Environment. Brakiss taught it to Zekk; Yarael Poof set objects alight; Leia lit candles with it. Can manifest. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Pyrokinesis": https://starwars.fandom.com/wiki/Pyrokinesis

---

#### Alter Environment ⚪
**Anchor Stats:** ForceSense + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Influencing environmental conditions through the Force — shifting wind, affecting temperature, creating fog, or directing natural energies.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceControl 30+
**Learning class:** Taught
**Cost:** Instant, 25, or sustained 5 per round; scale = area.
**Notes:** A family of techniques for manipulating nature, to attack or to shield: Force whirlwinds and fog, sub-zero cold in seconds or burning heat, electrical discharges across open ground, emptying the air from an area or raising its pressure to burst eardrums, small earthquakes and fissures, flash floods from moisture in the air, and steering existing storms. The Sith Gavar Khai: "with the Force, we can bend even heat and cold to our will." Size is priced by the scale classes. The former note ("subtle and slow; cannot conjure weather from nothing") had no source. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Alter Environment": https://starwars.fandom.com/wiki/Alter_Environment

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Ionize (Mechu Macture) ⚪
**Anchor Stats:** ForceControl + ForceOutput
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Overloading and damaging electronic systems such as droids with a stream of ions.
**Alignment:** Light Side leaning
**Prerequisites:** ForceControl 30+
**Learning class:** Taught
**Notes:** Discovered by Arca Jeth during the Great Droid Revolution; common among Jedi in the Jedi Civil War; later used by Luke Skywalker. Cost: instant, 25. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Ionize": https://starwars.fandom.com/wiki/Ionize

---

#### Electronic Manipulation 🔴
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Reprogramming or controlling machines through the Force. Harder on intelligent or hostile droids and for larger changes.
**Alignment:** Dark Side, lesser (requires embracing inner rage; the Jedi avoided it)
**Prerequisites:** Tutaminis 15+, Mind Trick 21+ (Wookieepedia: it needs knowledge of absorbing energy and of affecting minds)
**Learning class:** Taught
**Cost:** Instant, 40.
**Notes:** The Sith channel their anger into the device. It restores altered versions of the device's original programming; it cannot rewrite it entirely. Harder on intelligent droids and for bigger changes. Not mechu-deru. First appeared in Dark Apprentice. (Added 2026-11-20 from the Wookieepedia audit; corrected in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Electronic Manipulation": https://starwars.fandom.com/wiki/Electronic_Manipulation

---

#### Force Familiar ⚪
**Anchor Stats:** ForceSense
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** A bond in the Force with an animal companion.
**Alignment:** Neutral
**Prerequisites:** Animal Bond 21+
**Learning class:** Taught (a Vjun art)
**Cost:** Formed once by meditation, 15.
**Notes:** An art on the Force-steeped world of Vjun: Viscountess Whirry Malreaux's familiar was the Vjun fox Miss Vix. First appeared in Yoda: Dark Rendezvous. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force familiar": https://starwars.fandom.com/wiki/Force_familiar

---

### ⚪ KNOWLEDGE & ARCANE FAMILY
*Abilities that access deep Force knowledge, history, or metaphysical secrets.*
**Anchor Stats:** All abilities in this family → **ForceKnowledge** primary + **Meditation** secondary.

---

#### Force Bond ⚪
**Anchor Stats:** ForceSense + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A deep, sustained Force connection between two individuals — allowing emotional and sensory communication across great distances, awareness of each other's wellbeing, and in some cases shared experiences.
**Alignment:** Neutral
**Prerequisites:** ForceSense 30+, ForceControl 20+
**Learning class:** Can manifest
**Cost:** Formed once (25), or on its own; drawing on the partner's strength is an instant 25.
**Notes:** Can form involuntarily between people with strong emotional connections (master/padawan, close companions). Once formed, difficult to sever. Can be exploited by enemies who learn of it. Also called a Force chain or Jedi kinship. Shares feelings, thoughts and images across distance and improves coordination in battle; one partner's will can bolster the other, or draw on their strength. If one suffers or dies, the other feels it (Meetra Surik). (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force bond": https://starwars.fandom.com/wiki/Force_bond

---

#### Purification (Crystal) 🔵
**Anchor Stats:** Meditation + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** An advanced Jedi technique for cleansing a crystal made or used by a dark-side user of its former owner's hate, imbuing it with the light side through meditation.
**Alignment:** Light Side
**Prerequisites:** Meditation 41+, ForceKnowledge 30+
**Learning class:** Taught
**Notes:** In 41 ABY Jaden Korr banished the dark side from a Dark Jedi's red crystal and turned it into a yellow-bladed Jedi weapon. Replaces the former Kyber Resonance entry, which appears to be a canon-only idea. Cost: meditation, 25 per session. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Purification": https://starwars.fandom.com/wiki/Purification/Legends; "Lightsaber crystal": https://starwars.fandom.com/wiki/Lightsaber_crystal/Legends
---

#### Force Phantom 🔴 ⚠️
**Anchor Stats:** ForceControl (shaping the phantom) + ForceOutput (projecting it across space)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An elaborate Sith ritual (Sith phantasms) that builds lifelike, physical apparitions from the siphoned Force energy of another living creature and projects them across space to serve the creator.
**Alignment:** Dark Side — severe weight
**Prerequisites:** Sith Sorcery 30+, Dopplegänger 21+, Dark Side 50+
**Learning class:** Lore-locked (Darth Vectivus's ritual; rediscovered by Lumiya)
**Cost:** Ritual, 200 to create, then sustained 8 per round while it acts.
**Notes:** ⚠️ **Lore-locked.** Developed and perfected by Darth Vectivus; thought lost until Lumiya and later Alema Rar mastered it in the Second Galactic Civil War. Phantoms are corporeal and can harm the living. Each is anchored to the creature it was drawn from, which dies when the phantom is destroyed. Needs considerable mental reserve and strength of will. Formerly this entry described a Dopplegänger and cited Crait, which is Disney canon. (Rewritten 2026-11-20, mental family pass.)
**Source:** Wookieepedia (Legends), "Force phantom": https://starwars.fandom.com/wiki/Force_phantom

---

#### Mechu-deru 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** An intuitive Force-based understanding and control of mechanical systems — computers, droids, and starships can be influenced or reprogrammed through direct Force connection.
**Alignment:** Dark Side (Sith origin — the Jedi avoided it except rare tech-specialists)
**Prerequisites:** ForceKnowledge 30+, ForceControl 25+, Dark Side drift or Jedi tech specialist training
**Learning class:** Taught (rare)
**Cost:** Instant, 25, or sustained 5 per round.
**Notes:** ⚠️ Invented by the ancient Sith, and obscure even among them. The Jedi avoided it, leaving it to a small number of Jedi tech specialists. Lets the user instinctively understand machinery and bind it to their will. A cybernetic implant, the subelectronic converter, speeds up learning it. Belia Darzu's variant, mechu-deru vitae, made her technobeast army; Cronal later unearthed her secrets and used it on machines and living subjects, himself included. Can be used to create horrific machine-organic hybrid Sithspawn ("technobeasts"). Requires physical contact with or proximity to the machine. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Mechu-deru": https://starwars.fandom.com/wiki/Mechu-deru

---

#### Force Scribe ⚪ ⚠️
**Anchor Stats:** ForceControl + ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** An upper-tier Fallanassi technique that uses the White Current to inscribe words on objects. The writing never fades and can only be seen, read, altered or erased by someone trained in the White Current.
**Alignment:** Neutral
**Prerequisites:** ForceControl 30+, ForceKnowledge 30+, Fallanassi training
**Learning class:** Lore-locked (Fallanassi)
**Cost:** Instant, 25 per inscription.
**Notes:** ⚠️ **Lore-locked (Fallanassi).** A White Current adept can also sense whether an object carries scribing, and where. The former entry (precise Force engraving used for holocrons) had no source. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force scribe": https://starwars.fandom.com/wiki/Force_scribe

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Force Ghost ⚪
**Anchor Stats:** Meditation + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Preserving one's identity after death by guarding one's essence against being absorbed into the Force, and continuing to interact with the living. Some Sith combined similar techniques with essence transfer.
**Alignment:** Neutral (Jedi practice; Sith variants are dark)
**Prerequisites:** Meditation 81+, ForceKnowledge 61+, a teacher who knows it (lore-locked)
**Learning class:** Lore-locked, story event
**Notes:** A major story ability; acquiring it should be a story event. No pool cost: it is learned in life and used after death. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force ghost": https://starwars.fandom.com/wiki/Force_ghost/Legends

---

#### Life Bond ⚪
**Anchor Stats:** ForceSense + ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A permanent mental link with another person: shared senses, limited telepathy, and linked injury and dark-side susceptibility.
**Alignment:** Neutral
**Prerequisites:** Force Bond 21+
**Learning class:** Can manifest
**Notes:** Gorc and Pic shared one; Gorc's death sent Pic into a frenzy. Formed once and permanent; can form on its own. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Life Bond": https://starwars.fandom.com/wiki/Life_Bond

---

#### Mind Walking ⚪
**Anchor Stats:** Meditation + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Leaving the body in deep meditation to enter the realm "beyond shadows".
**Alignment:** Neutral (dangerous)
**Prerequisites:** Meditation 61+, taught by Mind Walkers (lore-locked)
**Learning class:** Lore-locked (Mind Walkers)
**Notes:** Learned by Jacen Solo after the Yuuzhan Vong War, later by Luke and Ben Skywalker. Resolves the MindWalking item in the questions file. Cost: meditation, 40 per session. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Mind Walking": https://starwars.fandom.com/wiki/Mind_Walking

---

#### Oneness ⚪
**Anchor Stats:** Meditation
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A state of union with the Force: becoming an extension of the Force in perfect calm, with brief access to power far beyond normal limits, followed by heavy but temporary exhaustion.
**Alignment:** Light Side (rarely dark, with severe temptation)
**Prerequisites:** Story event only
**Learning class:** Story event
**Notes:** Luke Skywalker reached it more than once. Mechanics: M6 reserve spec, as a surge past the pool ceiling with a heavy temporary cost and no permanent damage (design decision, 2026-11-20). (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Oneness": https://starwars.fandom.com/wiki/Oneness/Legends

---

### 🔴 SITH ALCHEMY & FORBIDDEN ARTS
**Anchor Stats:** ForceKnowledge (all of these require deep lore mastery) + Dark Side (alignment gating). ForceOutput relevant for Thought Bomb and Force Storm.
**Note:** These abilities have no sub-ability proficiency tracks — each is individually learned through lore access and story events, not proficiency drilling.

---

#### Sith Sorcery 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceOutput
**Summary:** Sith magic: an arcane expression of the Force first developed by the original Sith species to manipulate the dark side. Its applications range across acts of violence, altering another's perceptions, empowering artifacts, places and weapons, disturbing the natural order, healing, incantations, necromancy, protection, and twisting life. Sith Alchemy (altering living things and matter) is its close sibling; Supernova, Sutta Chwituskak and other named workings are specific applications.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** ForceKnowledge 61+, Dark Side 50+, Sith teaching, a holocron or Sith texts (lore-locked)
**Learning class:** Lore-locked (Sith texts)
**Notes:** ⚠️ **Sith tradition only.** No proficiency track of its own beyond the workings a character has learned; each named working is learned separately as a ritual. Masters include Naga Sadow, Marka Ragnos and the One Sith loremasters such as Darth Wyyrlok. (Added 2026-11-20 after the character-file audit found it referenced but missing.)
**Source:** Wookieepedia (Legends), "Sith sorcery": https://starwars.fandom.com/wiki/Sith_sorcery/Legends

---

#### Sith Alchemy 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceOutput (raw power needed to alter matter)
**Summary:** Using the dark side of the Force to alter the fundamental nature of living organisms, objects, and matter — creating monsters, enhanced weapons, and warped creatures.
**Alignment:** Dark Side — standard weight per working; severe for creating Sithspawn
**Prerequisites:** ForceKnowledge 51+, Dark Side 40+, Sith teaching or texts (lowered 2026-11-20)
**Learning class:** Lore-locked (Sith teaching; Je'daii at Anil Kesh)
**Notes:** ⚠️ **Faction and era locked — Sith tradition only.** Requires access to Sith texts and extensive study. Products of Sith alchemy (Sithspawn, alchemically forged weapons) are powerful but unstable.
**Cost:** Ritual, 200 per working.
**Additions (2026-11-20):** Force alchemy uses the dark side to permanently alter an item or living being; the Jedi reject it as treason against the Force's will. Practised from Sorzus Syn onward by many Sith alchemists. Je'daii exception: Force alchemy was taught at Anil Kesh, the Temple of Science on Tython, as a permitted study even though it meant leaning into the dark side (Dawn of the Jedi era). (Corrected 2026-11-20, forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Sith alchemy": https://starwars.fandom.com/wiki/Sith_alchemy/Legends

> **Sub-application:**

#### ↳ Mask (Sith Alchemy) 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl
**Difficulty Tier:** Ritual (cast outside combat)
**Summary:** A Sith alchemy ritual that conceals the user's true appearance: features, age, disfigurement, the marks of the dark side, even species with great skill. It lasts until the user drops it. As a product of the dark side, it is vulnerable to powerful blasts of dark side energy, which can melt it away and make further concealment difficult.
**Alignment:** Dark Side. Casting costs a small amount of Corruption.
**Prerequisites:** ForceKnowledge 51+, Dark Side 40+, taught by a Sith master who knows it or learned from a Sith holocron or text (lore-locked). Does not require full Sith Alchemy.
**Learning class:** Lore-locked
**Notes:** ⚠️ Darth Sidious may have used it to hide his true appearance behind the face of the Naboo politician Palpatine; when Mace Windu reflected his lightning, the Mask would have melted away. George Lucas told Ian McDiarmid to think of Palpatine's face as a mask. Hides appearance only; hiding one's presence is Force Concealment. Breaks on collapse, past 1.0 strain while channeling the dark side, or a major dark-side release (M6 alignment spec). Created for the Wizards of the Coast Star Wars Roleplaying Game by Gary M. Sarli. Design choice between competing explanations of Palpatine's face. (Added 2026-11-20, M6 catalog review.)
**Source:** "Mask (Sith Alchemy)" (Wookieepedia mirror): https://starwars.archivum.wiki/article/Mask_(Sith_Alchemy)

---

#### Midi-chlorian Manipulation 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + ForceControl (surgical precision on biological substrates)
**Summary:** Directly manipulating midi-chlorians — the microscopic Force-sensitive organisms in every living thing — to create life, sustain life past its natural end, or corrupt Force-sensitivity.
**Alignment:** Dark Side (defying the natural will of the Force)
**Prerequisites:** Sith Alchemy 30+, ForceKnowledge 91+, Dark Side 90+
**Learning class:** Story event (Plagueis)
**Notes:** ⚠️ **Exceptionally rare — achieved by only a handful of beings in all of history.** Darth Plagueis mastered it. Acquiring this ability should be a major story event with significant consequences. Represents the apex of the ForceControl axis — governing life at the microscopic level.
**Cost:** Ritual, 200. Story event.
**Additions (2026-11-20):** Creates, maintains or saves life by influencing midi-chlorians. Plagueis argued the Force accepts this direction only from a worthy Sith Lord. He made creatures conceive without a second partner and bypassed a Yinchorri's natural immunity to telepathy. Anakin: Plagueis tried to impose his will on the Force to create a being of the Force, and judged it a failure; the Force itself created Anakin Skywalker in response, to bring an end to the Sith. Palpatine never fully mastered it before killing Plagueis, which is why he relied on essence transfer. (Corrected 2026-11-20, forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Midi-chlorian manipulation": https://starwars.fandom.com/wiki/Midi-chlorian_manipulation

---

#### Essence Transfer 🔴 ⚠️
**Anchor Stats:** ForceKnowledge + Meditation + Dark Side alignment
**Summary:** The ability to transfer one's own consciousness into another body — achieving a form of immortality by abandoning one's dying physical shell and inhabiting a new host.
**Alignment:** Dark Side — extreme drift
**Prerequisites:** Dark Side 80+, ForceKnowledge 71+, Meditation 51+
**Learning class:** Story event
**Notes:** ⚠️ **Sith technique — era and faction considerations apply.** Palpatine used this repeatedly in Legends. The process destroys the host's original personality. A character pursuing this path should be considered firmly on the Sith path. Formerly listed as Transfer Essence (the old key resolves here). (Renamed or merged 2026-11-20 to match Wookieepedia.)
**Source:** Wookieepedia (Legends), "Essence transfer": https://starwars.fandom.com/wiki/Essence_transfer
**Cost:** Ritual, 200; the ritual destroys the current body. Story event.
**Additions (2026-11-20):** Also called transfer life, transference, reincarnation or spirit transference. The spirit can go into another body or into an inanimate object. Ancient Sith Lords used it to haunt their tombs and possess anyone who opened their sarcophagi; later masters used cloned bodies (Palpatine). Darth Andeddu: "Attempting it will cause the current vessel to be destroyed." (Corrected 2026-11-20, forbidden arts pass.)

---

#### Thought Bomb 🔴 ⚠️
**Anchor Stats:** Willpower + ForceOutput (pooled across every caster)
**Difficulty Tier:** Group ritual
**Summary:** An ancient ritual in which the focused will of many unified Sith Lords unleashes the full volatility of the dark side. On detonation it annihilates every Force-sensitive in the blast radius, body and spirit, and pulls their fragmented souls into a vortex of torment that settles into a silver orb.
**Alignment:** Dark Side — severe weight; taking part is an irreversible alignment collapse
**Prerequisites:** Revan's holocron (or its knowledge), Dark Side 80+, Sith Sorcery 41+, and many Sith Lords taking part
**Learning class:** Lore-locked (Revan's holocron)
**Cost:** Group ritual; draws every participant's pool, and the casters die in the blast.
**Notes:** ⚠️ **One of the most catastrophic and forbidden abilities in all of Legends.** Its origins go back to Vitiate's Ritual of Nathema. Darth Revan discovered its secrets in the Jedi Civil War and recorded them in his holocron, hidden in a temple on Lehon until Lord Kaan found it in 1000 BBY and detonated it on Ruusan with the Brotherhood of Darkness. Formerly written as a single-user power. (Corrected 2026-11-20, forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Thought bomb": https://starwars.fandom.com/wiki/Thought_bomb

---

#### Summon Fear 🔴 ⚠️
**Anchor Stats:** ForceKnowledge (Sith sorcery mastery) + Dark Side (the ability channels the dark side itself, not just the user's own Force influence)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A Sith sorcery technique that draws on the dark side of the Force to manifest a target's deepest, most primal fears — not by projecting an emotion through Force Touch (as Force Fear does) but by reaching into the dark side itself and pulling horror into being around the target. The target experiences their worst fears as vivid, inescapable reality. Darth Zannah was one of its most proficient practitioners; Darth Maul also demonstrated it, confirming it survived the Rule of Two and Darth Gravid's purge of Sith knowledge intact.
**Alignment:** Dark Side — severe drift
**Prerequisites:** ForceKnowledge 51+, Dark Side 40+, Sith Sorcery 21+, `sithTextAccess` flag required
**Learning class:** Lore-locked (Sith sorcery)
**Cost:** Sustained, 8 per round; worse the longer it is held.
**Notes:** ⚠️ **Sith sorcery — distinct from the Mind Trick family.** Force Fear (Mind Trick sub-application) is a precision targeted mind-influence; Summon Fear uses a fundamentally different mechanism — it channels the dark side's inherent dread directly, making it harder to resist (even for strong-willed targets who can block mind tricks) and affecting a wider area at high proficiency. Not era-locked — the technique survived through the Rule of Two and is part of the Sith tradition accessible to any Sith with sufficient dark side knowledge. Requires Sith text access or a Sith mentor to discover, but no specific era restriction applies.
**Additions (2026-11-20):** Cast with an intricate pattern of the fingers; takes seconds. The victim's fears appear as demons or monsters, more real the longer the spell is held. Short: the victim wakes with little memory of it. Longer: coma, the mind virtually destroyed. Longest: death. Revan used it hunting Tenebrae. Zannah drove Cyndra mad with it, used it on Sarro Xaj and on Darovit, and turned it on Bane, who shook it off because he had conquered his fears long before. (Corrected 2026-11-20, forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Summon fear": https://starwars.fandom.com/wiki/Summon_fear

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Force Walk 🔴
**Anchor Stats:** Willpower + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** An ancient Sith technique binding restless Force ghosts to the living, so the user can draw on their power. Binding an unwilling ghost gives more power than a willing one.
**Alignment:** Dark Side, severe
**Prerequisites:** ForceKnowledge 61+, Dark Side 60+, Willpower 51+, Sith teaching (lore-locked)
**Learning class:** Lore-locked (Ergast's holocron)
**Notes:** Its masters rose quickly and then faded mysteriously. Only Darth Nox and Lord Ergast bound more than one ghost. An outside power source in the M6 reserve spec. Cost: ritual, 200, to bind a ghost. Lore-locked (Ergast's holocron). (Added 2026-11-20 from the Wookieepedia audit; confirmed in the forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Force walk": https://starwars.fandom.com/wiki/Force_walk

---

#### Taint 🔴
**Anchor Stats:** ForceKnowledge
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Tainting an object or person so it radiates the dark side, causing pain to light-side users and stunning neutral beings who touch it.
**Alignment:** Dark Side, standard
**Prerequisites:** ForceKnowledge 41+, Dark Side 40+
**Learning class:** Taught
**Cost:** Instant, 25; ritual, 125, to taint a place.
**Notes:** The tainted thing radiates the dark side to Force-sensitives and can seduce people toward it. It can also mark a place so it seems the user is still there after leaving. When Luke beheaded Lumiya in revenge, the act tainted the place. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Taint": https://starwars.fandom.com/wiki/Taint

---

#### Supernova (Sith Magic) 🔴
**Anchor Stats:** ForceOutput + ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Sith sorcery, amplified by Sith crystals, that rips the core from a star; the core can be hurled as a weapon. Can backfire on the caster.
**Alignment:** Dark Side, severe
**Prerequisites:** Sith Sorcery mastery, ForceKnowledge 81+, Dark Side 80+, Sith crystals
**Learning class:** Lore-locked
**Cost:** Ritual, 200; scale = a star.
**Notes:** Only the strongest dark side masters can control it; a weaker caster is likely consumed by the freed core, or sets off a chain of supernovae as in the Cron Cluster. Exar Kun: "Here is the power to wrench fire from the stars." (Added 2026-11-20 from the Wookieepedia audit; confirmed in the forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Supernova (Sith magic)": https://starwars.fandom.com/wiki/Supernova_(Sith_magic)

---

#### Stygian Art 🔴
**Anchor Stats:** ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Blending technology with Sith alchemy to sow creation from destruction.
**Alignment:** Dark Side, severe
**Prerequisites:** Mechu-deru 41+, Sith Alchemy 21+
**Learning class:** Lore-locked (Cronal)
**Cost:** Ritual, 200.
**Notes:** Devised by the former Emperor's Hand Cronal after the Galactic Civil War, once he abandoned his Rhandite philosophy; he "resculpted" the natives of Trailia, technobeasts among them. Lore-locked. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Stygian Art": https://starwars.fandom.com/wiki/Stygian_Art

---

#### Mechu-deru Vitae 🔴
**Anchor Stats:** ForceKnowledge
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** Creating technobeasts with a technovirus that converts flesh into metal.
**Alignment:** Dark Side, severe
**Prerequisites:** Mechu-deru 41+, Sith Alchemy 30+
**Learning class:** Lore-locked (Belia Darzu)
**Cost:** Ritual, 200.
**Notes:** Derived from mechu-deru by the Sith Lord Belia Darzu, who combined it with Sith alchemy to make a technovirus. Lore-locked. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the forbidden arts pass.)
**Source:** Wookieepedia (Legends), "Mechu-deru vitae": https://starwars.fandom.com/wiki/Mechu-deru_vitae

---

### ⚪ MISCELLANEOUS ABILITIES

---

#### Force Stasis / Force Stun 🔵
**Anchor Stats:** ForceControl (pinning and sustaining)
**Difficulty Tier: D=1.5 (Moderate)** (Force Stun)
**Summary:** Deadening a target's senses and perceptions through the Force, putting them into a brief catatonic state that prevents most movement. The ladder runs Force Stun, Force Stasis, Stasis Field.
**Alignment:** Light Side (Wookieepedia lists it as a light side power)
**Prerequisites:** ForceControl 25+, Willpower 20+
**Learning class:** Taught
**Cost:** Force Stun: instant, 15, contested.
**Notes:** Non-lethal incapacitation preferred by Jedi, used against many opponents or to disable someone long enough to flee or arrest them ("kinder than breaking her wrist": Bardan Jusik). Strong willpower resists it; no effect on droids or other inorganic beings. Kavar could stun several targets at once. Force Slow is not part of this tree: it is a separate dark side power. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force Stasis": https://starwars.fandom.com/wiki/Force_Stasis/Legends

> **Sub-applications:**

#### ↳ Force Stasis 🔵
**Anchor Stat:** ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** A stronger Force Stun: deadens the senses into a near-catatonic state, freezing the target in place. Useful when outnumbered in tight spots.
**Prerequisites:** Force Stun 21+, ForceControl 30+
**Learning class:** Taught
**Cost:** Sustained, 5 per round, contested.

#### ↳ Stasis Field 🔵
**Anchor Stat:** ForceControl + ForceOutput (scale)
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** The highest level of Force Stun: puts several enemies into brief, harmless catatonic states at once, for quick escapes, to slip past opponents or to arrest them.
**Prerequisites:** Force Stasis 30+, ForceControl 35+
**Learning class:** Taught (Knights and Masters)
**Cost:** Instant, 40; scale counts targets.
**Notes:** Usually learned by Jedi Knights and Masters. Formerly "Force Stasis Field", Complex.

---

#### Force Slow 🔴
**Anchor Stat:** ForceControl
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** A dark side power that clouds the target's mind, slowing them down mentally and physically.
**Alignment:** Dark Side, lesser. Force Exhaustion, the Jedi Guardian version used in the Cold War and Galactic War to wear enemies down gradually, is Neutral.
**Prerequisites:** ForceControl 15+
**Learning class:** Taught
**Cost:** Instant, 10, contested.
**Notes:** Used by Sith and Dark Jedi around 3956 BBY; Juhani used it. The mildest of three poison-like powers. Formerly a neutral sub-application of Force Stasis. Old key `ForceExhaustion` resolves here. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force Slow": https://starwars.fandom.com/wiki/Force_Slow/Legends

> **Sub-applications:**

#### ↳ Force Affliction 🔴
**Anchor Stat:** ForceControl
**Difficulty Tier: D=2.5 (Complex)**
**Summary:** Works like a fast-acting poison, quickly debilitating the target; it worsens over time and can kill if the user is strong enough.
**Alignment:** Dark Side, standard
**Prerequisites:** Force Slow 20+, Dark Side 25+
**Learning class:** Taught
**Cost:** Instant, 25.
**Notes:** Revan used a mass version (SWTOR, Shadow of Revan).

#### ↳ Force Plague 🔴
**Anchor Stat:** ForceControl
**Difficulty Tier: D=4.0 (Advanced)**
**Summary:** A more powerful Force Affliction that works like a fast-acting toxin, horribly debilitating its victims and worsening over time.
**Alignment:** Dark Side, standard
**Prerequisites:** Force Affliction 21+, Dark Side 30+
**Learning class:** Taught
**Cost:** Instant, 40.
**Notes:** Darth Traya and Darth Nihilus tried it on Meetra Surik. Split from Force Affliction 2026-11-20.

---

#### Force Weapon ⚪
**Anchor Stats:** ForceControl + Telekinesis (the ability)
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** Imbuing a conventional (non-lightsaber) weapon with Force energy — making it more durable, sharper, and capable of interacting with Force-based defenses.
**Alignment:** Neutral
**Prerequisites:** ForceControl 21+, Telekinesis 15+
**Learning class:** Taught
**Cost:** Sustained, 3 per round.
**Notes:** Allows a skilled Force-user to fight effectively without a lightsaber in unusual circumstances. A Force-imbued weapon can block a lightsaber without being damaged. The Je'daii and later the Jedi imbued swords this way (Vur Tepe; the Je'daii line is cited to the *Force and Destiny Core Rulebook*, [gray], backed by pre-2014 Legends on Je'daii Force-imbued swords); most users came from outside the Order, like the Zeison Sha with their discblades. Vodo-Siosk Baas used it on his staff against Exar Kun. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force weapon": https://starwars.fandom.com/wiki/Force_weapon

---

#### Force Bellow ⚪
**Anchor Stats:** ForceOutput + Charisma
**Difficulty Tier: D=1.0 (Basic)**
**Summary:** Amplifying one's voice through the Force to project commands, battle cries, or warnings with superhuman volume and resonance — enough to stagger or intimidate those nearby.
**Alignment:** Neutral
**Prerequisites:** ForceControl 10+, Charisma 10+
**Learning class:** Taught
**Cost:** Instant, 10. Free at level 40 for amplifying the voice only.
**Notes:** Simple utility ability, to communicate or to attack. Ithorian Jedi amplified their voices enough to destroy obstructions (Roron Corobb against General Grievous). Joruus C'baoth bellowed Thrawn's name across the Chimaera's bridge. (Corrected 2026-11-20, nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force bellow": https://starwars.fandom.com/wiki/Force_bellow

---

> **Added from the Wookieepedia audit (2026-11-20):**

#### Force Blinding 🔵
**Anchor Stats:** ForceOutput
**Difficulty Tier: D=1.5 (Moderate)**
**Summary:** A burst of Force energy that overwhelms the target's optic nerves, causing temporary blindness. Force Sight defends against it.
**Alignment:** Light Side leaning (classically light; the dark side uses it too)
**Prerequisites:** ForceOutput 15+, ForceControl 15+
**Learning class:** Taught
**Cost:** Instant, 15, contested.
**Notes:** Classified by the Sith in the Offense school. Dark users: Yun, Dark Mara. (Added 2026-11-20 from the Wookieepedia audit; confirmed in the nature/knowledge/misc pass.)
**Source:** Wookieepedia (Legends), "Force blinding": https://starwars.fandom.com/wiki/Force_blinding

---

## INNATE TALENTS (Non-trainable — character creation or player override only)

**Registry rules:**
- Set in `characterSheet.innateTalents[]` as an array of key strings
- AI cannot add or remove entries — player override only
- Effects are applied automatically by the JS engine whenever relevant calculations run
- Can be modified mid-campaign via the player override UI panel

| Key | Display Name | Effect | Notes |
|---|---|---|---|
| `NaturalTelekineticBurst` | Natural Telekinetic Burst | All Telekinesis family Force Strain cost ×0.8 | Jared's current innate talent |
| `CombatIntuition` | Combat Intuition | +1 to all combat rolls when outnumbered | |
| `ForceSensitiveHealer` | Force-Sensitive Healer | All healing ability XP gain ×1.3 | |
| `IronMind` | Iron Mind | Mental Strain accumulates at ×0.8 rate | |
| `ForceReservoir` | Force Reservoir | maxForceBarrier +20 | |
| `BladeIntuition` | Blade Intuition | First lightsaber form starts with 5 bonus levels | Applied at character creation only |
| `DarkAffinity` | Dark Affinity | Dark Side ability Force Strain ×0.85; alignment drift accelerates | |
| `UnbreakableSpirit` | Unbreakable Spirit | At 90+ strain, XP penalty is ×0.3 instead of ×0.1 | |
| `QuickStudy` | Quick Study | All ForceKnowledge XP gains ×1.2 | |
| `ShatterSense` | Shatterpoint Innate Talent | See Shatterpoint Path B entry — ×0.1 XP cost, 70% strain reduction, uncapped track, passive perception | See Shatterpoint section for full mechanical spec |
| `BattleMeditationAffinity` | Battle Meditation Affinity | Battle Meditation XP cost ×0.3, Force Strain ×0.6. Equivalent innate case to ShatterSense — Bastila Shan is the canonical example | Separate from ShatterSense; can hold both |
| `LivingForceConnection` | Living Force Connection | Force Sense environmental awareness always active passively; Animal Bond strain-free | Qui-Gon Jinn archetype |
| `PrecognitiveEdge` | Precognitive Edge | Precognition activates one tier earlier than normal prerequisite | |

**Design note:** The `ShatterSense` and `BattleMeditationAffinity` talents are in the same category — abilities that *can* be learned without innate talent but which innate talent holders reach at a fraction of the cost and to a depth no standard learner can match.

---

## INNATE ABILITIES (Separate class — present from birth, not learnable)

Distinct from Innate Talents (which modify how learned abilities work). These abilities have no learnable path — they either exist in the character or they don't. No XP track. No training. No prerequisites.

**Registry rules:**
- Set in `characterSheet.innateAbilities[]`
- AI cannot set these — player/creation override only

| Key | Display Name | Description |
|---|---|---|
| `NaturalTelekineticBurst_passive` | Telekinetic Burst (Passive) | Passive burst of telekinetic force under extreme emotional stress — not controlled by the user, triggers automatically. Represents Jared's established innate talent manifesting involuntarily. Not a trained ability — it simply happens. |

**Note on Shatterpoint:** Although Shatterpoint has an innate talent flag (`ShatterSense`), it also has a learnable path. It does NOT belong in this table. See the Shatterpoint entry for the dual-path spec.

---

## WORLDSTATE FLAGS (Story-locked ability prerequisites)

These flags live in `worldState.storyFlags{}` and gate abilities that require specific story conditions regardless of stat level. The AI sets them when the relevant story event occurs. The player can override.

| Flag Key | Set When | Gates |
|---|---|---|
| `vaapadTeacherOrRecords` | A Vaapad teacher (Windu with his permission; Bulq, unsanctioned; or a living Vaapad master) or, from the New Jedi Order on, the recovered Form VII records | Vaapad learnable (replaces `maceLiving` and `maceTrustEstablished`, 2026-11-21, lore batch 10) |
| `aingTiiContact` | Character has made peaceful contact with Aing-Tii monks | Flow-walking, Fighting-Sight discoverable |
| `aingTiiApproved` | Aing-Tii have agreed to teach the character | Flow-walking, Fighting-Sight learnable |
| `fallanassiContact` | Character has made contact with the Fallanassi | Phase, Fold Space discoverable |
| `jediArchiveAccess` | Character has access to Jedi Temple Archives | Advanced theory abilities discoverable via research |
| `sithTextAccess` | Character has access to Sith holocron or scroll | Sith-origin abilities discoverable |
| `jediCouncilPermission` | Jedi Council has granted permission | Juyo learnable (Juyo only since 2026-11-21; Vaapad uses `vaapadTeacherOrRecords`) |
| `masterAssigned` | Character has been formally assigned a Jedi Master | Padawan mandatory training rows active |
| `padawanAssigned` | Character has been assigned a Padawan | Knight instruction mandatory row active |

---

## LIFE STAGE VALUES

Stored in `characterSheet.lifeStage`. Set by AI via `LIFE_STAGE:` tag in CHANGES block when a story transition occurs. Never set by stat threshold — it is always a story/institutional recognition.

| Value | Description | Mandatory Training |
|---|---|---|
| `youngling` | Temple student, not yet assigned to a Master | Morning Forms, Group Meditation, Force Fundamentals |
| `padawan` | Assigned to a Master, undergoing apprenticeship | Training with Master, Solo Practice |
| `knight` | Passed the Trials, independent Jedi Knight | None mandatory (professional autonomy) |
| `knight_with_padawan` | Knight who has accepted an apprentice | Padawan Instruction |
| `master` | Formally elevated to Jedi Master by Council | None mandatory |
| `master_with_padawan` | Master with an active apprentice | Padawan Instruction |
| `council_member` | Seat on the Jedi High Council | Council Duties (narrative time cost) |

---

## PROGRESSION UNLOCK TRIGGERS (for simulation auto-unlock)

| Condition | Activity Unlocked |
|---|---|
| Any `lightsaberForms.*` key added | "[Form] Basics" drill auto-added |
| Any `forceAbilities.*` key added | "[Ability] Practice" drill auto-added |
| `lightsaberForms.ShiiCho` ≥ 15 | "Shii-Cho Solo Practice" (supervised always available) |
| `lightsaberForms.ShiiCho` ≥ 21 | "Shii-Cho Advanced Sequences" |
| `lightsaberForms.Makashi` ≥ 21 | "Makashi Precision Footwork" |
| `lightsaberForms.Soresu` ≥ 10 | "Soresu Deflection Drills (Blaster)" |
| `lightsaberForms.Ataru` ≥ 21 | "Ataru Acrobatic Sequences" |
| `forceStats.forceSense` ≥ 10 | "Force Sense Active Scanning" |
| `forceStats.meditation` ≥ 15 | "Deep Force Immersion" |
| Two saber forms both ≥ 21 | "Form Combination Drills" |
| Two saber forms both exist | "Dual Saber Practice" |
| Any Force ability ≥ Apprentice tier (21+) | "Force-Enhanced Athletics" |
| `lightsaberForms.Vaapad` unlocked | Verify `vaapadTeacherOrRecords`, Juyo 61+, light side; Vaapad exists only from its late-Republic creation (lore batch 10) |
| `forceAbilities.FlowWalking` unlocked | ⚠️ Verify Aing-Tii contact established |
| Any `forceAbilityProficiency` key gains first point | "[Sub-Ability] Focused Practice" drill auto-added |
| Sub-ability proficiency reaches 25% (Novice) | "[Sub-Ability] Developing Application" drill unlocked |
| Sub-ability proficiency reaches 51% (Journeyman) | "[Sub-Ability] Journeyman Refinement" drill unlocked |
| `forceStats.forceOutput` ≥ 10 | "Raw Force Channeling" exercise unlocked |
| `stats.intelligence` ≥ 15 | "Strategic Analysis" study unlocked |

---

## JS IMPLEMENTATION CHANGES REQUIRED

The following changes to `starwars_rpg_V97.html` (or successor version) are needed to implement v3. All reference specific existing code structures.

### 1. Add `forceOutput` to the valid Force Stats set
**Location:** `syncMasterXPToSheet()` function (line ~4990)
```javascript
// Change this line:
const VALID_FS = new Set(['forceSense','meditation','forceKnowledge','forceControl']);
// To:
const VALID_FS = new Set(['forceSense','meditation','forceKnowledge','forceControl','forceOutput']);
```

**Location:** The `validFS` set guard earlier in the file (line ~2857):
```javascript
const validFS = new Set(['forceSense','meditation','forceKnowledge','forceControl','forceOutput']);
```

**Location:** Both `fsMap`/`fsMap2` narrative XP parsing maps (lines ~3601, ~3636):
```javascript
// Add to each map:
forceoutput: 'forceStats.forceOutput'     // fsMap2
forceoutput: 'forceOutput'                // fsMap
```

### 2. Add `intelligence` to the core stats maps
**Location:** Both `stMap`/`stMap2` narrative XP parsing maps (lines ~3601, ~3636):
```javascript
// Add to each map:
intelligence: 'stats.intelligence'        // stMap2
intelligence: 'intelligence'              // stMap
```

### 3. Add `forceOutput` and `intelligence` to SIM_ACTIVITIES
**In `SIM_ACTIVITIES` array:**
```javascript
{ key:'force_output_drills', label:'Raw Force Output Training',
  weights:[{p:'forceStats.forceOutput',w:1.0},{p:'forceStats.forceControl',w:0.3},{p:'stats.willpower',w:0.3}],
  strainBias:{f:2.2,p:0.3,m:0.8}, defaultIntensity:'intense',
  unlock:cs=>(cs.forceStats?.forceOutput||0)>=1 || (cs.forceAbilities?.Telekinesis||0)>=20 },

{ key:'intelligence_study', label:'Strategic Study / Analysis',
  weights:[{p:'stats.intelligence',w:1.0},{p:'forceStats.forceKnowledge',w:0.2},{p:'stats.willpower',w:0.2}],
  strainBias:{f:0.1,p:0.0,m:1.6}, defaultIntensity:'casual',
  unlock:cs=>true },
```

### 4. Add the proficiency XP system to masterXP
**In masterXP initialization** (line ~4096):
```javascript
let masterXP = { forceStats:{}, stats:{}, forceAbilities:{}, lightsaberForms:{},
                 forceAbilityProficiency:{} }; // ADD forceAbilityProficiency
```

**New functions to add (after the existing XP functions, ~line 4980):**
```javascript
// Cost per 1% of proficiency — grounded in same 1.07 curve as main system
function profCostPerPoint(pct, D) {
  return Math.floor(D * 20 * Math.pow(1.07, pct * 0.8));
}

// Derive proficiency percentage from lifetime proficiency XP
function deriveProficiency(totalProfXP, D) {
  let pct = 0;
  let remaining = Math.max(0, totalProfXP || 0);
  while (pct < 100) {
    const cost = profCostPerPoint(pct, D);
    if (remaining < cost) break;
    remaining -= cost;
    pct++;
  }
  return { percentage: pct, current: Math.round(remaining),
           required: pct < 100 ? profCostPerPoint(pct, D) : 0 };
}

// Proficiency discount factors
function profBaseAbilityFactor(baseLevel) {
  if (baseLevel >= 80) return 0.50;
  if (baseLevel >= 60) return 0.60;
  if (baseLevel >= 40) return 0.75;
  if (baseLevel >= 20) return 0.90;
  return 1.00;
}
function profControlFactor(forceControl) {
  if (forceControl >= 80) return 0.70;
  if (forceControl >= 60) return 0.85;
  if (forceControl >= 40) return 1.00;
  if (forceControl >= 20) return 1.10;
  return 1.25;
}

// Apply proficiency XP to a sub-ability
// abilityKey = "ForceLightning", subKey = "ForceStorm", D = difficulty
function applyProficiencyXP(abilityKey, subKey, rawXP) {
  if (!rawXP || rawXP <= 0) return { profAdded: 0, newPct: 0 };
  const compositeKey = `${abilityKey}.${subKey}`;
  if (!masterXP.forceAbilityProficiency) masterXP.forceAbilityProficiency = {};
  if (!masterXP.forceAbilityProficiency[compositeKey])
    masterXP.forceAbilityProficiency[compositeKey] = { totalProfXP: 0, D: 1.0 };

  const entry = masterXP.forceAbilityProficiency[compositeKey];
  const baseLevel = characterSheet?.forceAbilities?.[abilityKey] || 0;
  const fc = characterSheet?.forceStats?.forceControl || 0;
  const discount = profBaseAbilityFactor(baseLevel) * profControlFactor(fc);
  const effectiveXP = rawXP / discount;

  const before = deriveProficiency(entry.totalProfXP, entry.D);
  entry.totalProfXP += effectiveXP;
  const after  = deriveProficiency(entry.totalProfXP, entry.D);
  return { profAdded: Math.round(effectiveXP), newPct: after.percentage,
           pctGained: after.percentage - before.percentage };
}

// Trickle: when base ability XP is gained, spread 5% to all unlocked sub-ability proficiencies
function profTrickleFromBase(abilityKey, baseXPGained) {
  if (!masterXP.forceAbilityProficiency) return;
  const trickleXP = baseXPGained * 0.05;
  for (const [compositeKey, entry] of Object.entries(masterXP.forceAbilityProficiency)) {
    if (compositeKey.startsWith(abilityKey + '.') && entry.totalProfXP > 0) {
      entry.totalProfXP += trickleXP;
    }
  }
}

// Get effective proficiency (capped by soft cap)
function getEffectiveProficiency(abilityKey, subKey) {
  const compositeKey = `${abilityKey}.${subKey}`;
  const entry = masterXP.forceAbilityProficiency?.[compositeKey];
  if (!entry) return 0;
  const raw = deriveProficiency(entry.totalProfXP, entry.D).percentage;
  const baseLevel = characterSheet?.forceAbilities?.[abilityKey] || 0;
  const softCap = baseLevel >= 80 ? 100 : baseLevel >= 60 ? 85 :
                  baseLevel >= 40 ? 70  : baseLevel >= 20 ? 50 : 25;
  return Math.min(raw, softCap);
}

// Get proficiency tier label
function profTierLabel(pct) {
  if (pct >= 91) return 'Mastered';
  if (pct >= 71) return 'Expert';
  if (pct >= 51) return 'Proficient';
  if (pct >= 26) return 'Developing';
  return 'Novice';
}
```

### 5. Update buildSave / loadFromSave to persist proficiency
**In `buildSave()`** — no change needed; masterXP is already saved wholesale.

**In `loadFromSave()`** — after the masterXP migration loop, add:
```javascript
// Migrate: if no forceAbilityProficiency exists, initialize empty
if (!masterXP.forceAbilityProficiency) masterXP.forceAbilityProficiency = {};
```

### 6. Add proficiency rendering to the character sheet sidebar
**In `updateCharacterSheet()`**, in the Force Abilities section, after each ability's XP bar:
```javascript
// For each unlocked sub-ability in forceAbilityProficiency:
const subKeys = Object.keys(masterXP.forceAbilityProficiency || {})
  .filter(k => k.startsWith(abilityKey + '.'));
for (const compositeKey of subKeys) {
  const subName = compositeKey.split('.')[1];
  const effectivePct = getEffectiveProficiency(abilityKey, subName);
  const tier = profTierLabel(effectivePct);
  // Render: "  ↳ ForceStorm: Novice (12%)" with a thin progress bar
}
```

### 7. Add proficiency CHANGES block tag for AI use
The AI can award proficiency via the CHANGES block:
```
PROFICIENCY: ForceLightning.ForceStorm,150
```
This awards 150 raw proficiency XP to Force Storm's track, which then gets discount factors applied.

**In the CHANGES block parsing** (the large switch statement ~line 3000):
```javascript
case 'PROFICIENCY': {
  // Format: AbilityKey.SubKey,xpAmount
  const profParts = trimmed.slice(12).split(',').map(s=>s.trim());
  const [compositeKey, xpStr] = profParts;
  const dotIdx = compositeKey.indexOf('.');
  if (dotIdx > 0) {
    const abilKey = compositeKey.slice(0, dotIdx);
    const subKey  = compositeKey.slice(dotIdx + 1);
    const profXP  = parseFloat(xpStr) || 0;
    if (profXP > 0) {
      const res = applyProficiencyXP(abilKey, subKey, profXP);
      if (res.pctGained > 0) {
        turnXPLog.push({ label: `${subKey} proficiency`, xpAdded: res.profAdded,
                         levelUps: 0, newStat: res.newPct, type: 'proficiency' });
      }
    }
  }
  break;
}
```

### 8. Update the AI system prompt
Add to the GM system prompt's CHANGES block documentation:
```
PROFICIENCY: AbilityKey.SubKey,xpAmount
  — awards proficiency XP toward a specific sub-ability application
  — AbilityKey must match the parent forceAbilities key exactly
  — xpAmount uses same scale as XP: standard supervised training (1hr) ≈ 15 XP
  — Use this when the character specifically practices a sub-application, not just the base ability
  — Example: PROFICIENCY: ForceLightning.ForceStorm,15
```

