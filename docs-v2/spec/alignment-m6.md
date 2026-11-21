<!-- Exported 2026-11-21 from the claude.ai doc "SWRPG M6 — Alignment System Spec" (https://claude.ai/artifact/VPpMJAFgQVJfGXjpFM7RUm, rev 30). Superseded doc: since 2026-11-21 this repo copy is canonical and the doc is no longer updated. Changes made in the repo after the export (Jared's rulings, 2026-11-21): §3 the intent discount (D-330); §6 redemption (D-331) and its event path for a mind wipe or severance (D-331 amended); §7 skin after redemption (D-325); §9 pressure multipliers and Korriban's pull by era (D-329). -->

**Canonical (Jared, 2026-11-21):** this repo file is the source of truth for M6. The claude.ai design doc it was exported from is superseded and no longer maintained; design changes are made here and logged in docs-v2/decisions.md.

# SWRPG M6 — Alignment System Spec (draft for review)

2026-11-20 · @Jared Wright

## 1. Summary

Alignment uses three stored values (Light, Dark and Corruption) plus one derived value, immersion. Dark rises fast and lets go slowly. Light builds slowly through discipline. Corruption is lasting physical damage. Immersion measures how deep in the dark side you are right now, and it drives the eyes and the build-up of Corruption.

The engine owns every number. The AI only picks tags from a fixed list, and it never sees or changes the values. All numbers below are starting defaults for config.

| Decision | Status |
| --- | --- |
| Three values: Light, Dark, Corruption | Agreed |
| Sith eyes come from immersion, not Corruption, and fade when immersion drops | Agreed |
| Palpatine's hidden face is a Sith alchemy mask: a ritual effect that lasts until removed or broken | Agreed, flagged as a design choice between sources |
| Deeds use a broad fixed tag list that the AI applies | Agreed |
| Temptation choices look like any other choice, and are tagged in the background | Agreed |
| Dark typed input during a temptation moment gets the same tags plus severity | Agreed |
| Exact values in a menu, a lean label on the main screen | Agreed |
| Corruption damage is permanent. Surface signs (skin colour, eyes) can return to normal | Agreed |
| Alignment and allegiance are separate | Proposed |
| Scores tracked for everyone, effects only for Force-sensitives | Proposed |

## 2. The values

Two scores measure your relationship with each side, one measures the damage, and one measures where you are right now.

| Value | Range | What it means | How it moves |
| --- | --- | --- | --- |
| Light | 0 to 100 | Attunement to the light side: calm, compassion, discipline | Slow gains. Each Dark gain also wears away 25% of that amount in Light |
| Dark | 0 to 100 | The hold the dark side has on you: anger, fear, hunger for power | Gains at twice the rate of Light. Falls only through atonement and meditation, slower the higher it is |
| Corruption | 0 to 100 | Lasting physical damage from deep dark-side use | Builds while immersed, and from outside power sources and Sith alchemy. Never falls |
| Immersion (derived) | 0 to 100 | How deep in the dark side you have been recently | Rises with dark draws, anger fuel and dark deeds. Fades about 3 points a day without them |

**The hold.** Light gains also lower Dark, but less as Dark gets higher:

| Dark score | Dark removed per point of Light gained | Dark removed per meditation session |
| --- | --- | --- |
| Under 25 | 0.25 | 0.5 |
| 25 to 49 | 0.15 | 0.3 |
| 50 to 74 | 0.08 | 0.15 |
| 75 and above | 0.03 | 0.05 |

Once the dark side has a strong hold, slow work alone barely moves it. Climbing back from deep Dark takes a redemption event (section 6).

**NPC values (agreed 2026-11-21, look-over item 3).** Eyes, sensing and concealment read an NPC's values, so every Force-sensitive NPC needs them.

| Archetype | Light | Dark | Corruption | Immersion |
| --- | --- | --- | --- | --- |
| Youngling or Padawan | 40 | 5 | 0 | 0 |
| Jedi Knight | 60 | 5 | 0 | 0 |
| Jedi Master | 75 | 3 | 0 | 0 |
| Gray Jedi, Je'daii-style balance | 45 | 40 | 0 | 5 |
| Fallen or Dark Jedi | 15 | 60 | 10 | 30 |
| Sith acolyte or apprentice | 10 | 55 | 10 | 40 |
| Sith Lord | 5 | 75 | 30 | 50 |
| Dark Lord, Sith Master | 0 | 90 | 60 | 70 |
| Non-Force-sensitive | tracked, no effect (section 9) |  |  |  |

- **Generated NPCs** start from their archetype, with up to ±10 random spread on Light and Dark so no two are identical.
- **Canon NPCs** get hand-set values from their lore character file, per era snapshot, the same way canon levels are set (npc-generation §5). Examples: Dooku has high Dark, low immersion and normal eyes (the eye table); Palpatine before his reveal has Dark 90+ and very high Corruption hidden by the Mask.
- **NPC values don't drift day to day.** Immersion stays at its archetype value. Values change only through story events (a fall, a redemption) or the NPC's own deed events in a scene.

## 3. Force use and emotion

These changes are automatic. The engine applies them from the structured Force lines it already reads, with no AI judgment involved.

| Trigger | Dark | Light | Immersion |
| --- | --- | --- | --- |
| Dark-tagged ability, lesser (Force Shock, Darksight) | +0.5 per use |  | +1 |
| Dark-tagged ability, standard (Choke, Force Wound, Lightning, Drain) | +1 per use |  | +2 |
| Dark-tagged ability, severe (Rend, Force Storm, Essence Transfer) | +3 per use |  | +5 |
| Anger used as fuel in the Willpower zone | +1 per use |  | +2 |
| Drawing while in a fear or rage state | +0.3 per draw |  | +0.5 |
| Drawing while calm and confident |  | +0.1 per draw, max +1 per scene |  |
| Light-tagged ability (Force Light, Aura of Serenity) |  | +0.3 per use |  |
| Meditation session | Reduced by the hold table | +0.5 |  |

- Dark-tagged abilities add Dark whatever the intent, except as follows. Force Choke used briefly to knock someone out, not to punish or kill, as Luke did twice, adds no Dark.
- **Intent discount (D-330, Jared, 2026-11-21; repo-only amendment).** A dark-tagged power used calmly with light intent, as a tool (Kyle Katarn, Jolee Bindo), gives a small Dark gain (+0.2), no immersion and no Corruption, and at most one such gain per scene; further calm uses that scene add nothing. Calm with light intent means: no fear or rage state, no anger fuel that scene, and no dark deed tag on the use. Anything else takes the table value, and anger deeds count in full. Force Grip and Force Crush are neutral telekinesis, so harming someone with them is judged as a deed instead.
- Electric Judgment is the one exception the lore draws: the same visual, channeled through compassion. It is light-tagged, as the catalog already notes.
- Neutral abilities change nothing on their own. Using Push to save a life or to murder someone is a deed, and gets tagged as one.

**Dark surge:** opening to the dark side for raw power (reserve spec, section 8) costs +1 Dark and +2 immersion each round it is held, halved while Gray. The surge is the rush of first letting go: it fades as Dark rises and is gone at the fall (Dark 50+ and higher than Light), so fallen characters and established Sith don't surge (revised 2026-11-21). Choosing to surge in a temptation moment is a temptation choice, so it carries the ×1.5 multiplier for that round. Choosing not to, as Yoda did facing Dooku, earns `resisted_temptation`.

## 4. Deeds: the tag list

A broad fixed list of deed tags, each with a side and a severity, covers what a character does. The AI picks the tag and severity that fit and outputs them on a structured line. The engine looks up the value and applies it.

Each deed is one **structured deed event** with three fields: the tag, the severity, and whether it was a temptation. The event schema is decided during integration (look-over fix, 2026-11-21: this was written as an `ALIGN:` text line before).

**Dark tags:**

| Tag | Covers |
| --- | --- |
| `excessive_force` | Violence beyond what the situation needs, wounding a beaten foe |
| `murder` | Killing someone helpless, surrendered or not a threat |
| `torture` | Inflicting pain for information, punishment or pleasure |
| `atrocity` | Mass killing, killing children, destroying communities |
| `cruelty` | Humiliation, tormenting, harm for its own sake |
| `domination` | Coercion, mind domination, enslavement, breaking someone's will |
| `betrayal` | Turning on allies, breaking sworn trust |
| `deceit_for_gain` | Lying or manipulating for personal power or profit |
| `greed` | Theft, extortion, taking power or wealth at others' expense |
| `vengeance` | Acting on revenge or hatred |
| `indulged_anger` | Letting rage drive a choice, lashing out |
| `fear_driven` | Harming others out of fear or to protect yourself at their cost |
| `abandonment` | Leaving people to die to save yourself |

**Light tags:**

| Tag | Covers |
| --- | --- |
| `mercy` | Sparing a defeated or helpless enemy |
| `compassion` | Helping someone in need at a cost to yourself |
| `sacrifice` | Risking or giving up your life, power or goals for others |
| `restraint` | Choosing de-escalation or the least force needed |
| `protection` | Defending the helpless |
| `honesty_at_cost` | Telling the truth when a lie would serve you better |
| `forgiveness` | Letting go of a grudge or a chance for revenge |
| `self_mastery` | Mastering anger or fear in a moment of strong pressure |
| `resisted_temptation` | Choosing a non-dark path at a temptation moment (applied by the engine, section 5) |

**Severity values:**

| Severity | Dark tag | Light tag |
| --- | --- | --- |
| Minor | +1 | +0.5 |
| Moderate | +3 | +1.5 |
| Major | +6 | +3 |
| Extreme | +12 | +6 |

**Rules the engine enforces:**

- A per-scene cap of +15 Dark and +6 Light from deeds, except for fall and redemption events.
- Severity limits per tag: `atrocity` is always major or extreme, `indulged_anger` is never extreme, and so on. An out-of-range severity is clamped and logged.
- An unknown tag is ignored and logged, never guessed at.
- Context modifiers the AI can add: `provoked` (x0.75 on Dark), `defending_others` (x0.5 on Dark for `excessive_force`), `coerced` (x0.5).
- Dark deeds add immersion: 1 point per point of Dark gained.

## 5. Temptation moments

A temptation is an ordinary selectable choice with nothing on screen to mark it. The tag lives in the background, so the player chooses on the merits of the story, not the meter.

**When the engine opens one.** It flags a scene as a temptation moment when one of these holds:

- The character is in a fear or rage state, or at high strain.
- The character is losing a fight, or someone they care about is threatened or hurt.
- An enemy is at their mercy.
- A shortcut to power, revenge or safety is on offer.
- The character's Dark is 25 or higher and the scene gives an opening (the dark side looks for chances).

**How it works:**

1. The engine tells the AI the scene is a temptation moment.
2. Among the choices it offers, the AI includes at least one dark option and attaches a hidden deed event to it (tag, severity, temptation), which the player never sees.
3. The UI shows only the text. Every choice looks the same.
4. Picking the dark option applies its tag with a x1.5 temptation multiplier.
5. Picking a non-dark option applies `resisted_temptation`: +1 Light, +2 if the pressure was strong (rage, a loved one in danger), and +1 to Willpower XP.
6. **Typed input:** if the player types their own action during a temptation moment and it is dark, the AI tags it the same way, with the deed tag, a severity and `temptation`.

**Pacing:** at most one temptation moment per scene, and a cool-down of a few scenes after one, so they stay meaningful rather than constant.

## 6. Thresholds, lean, the fall and redemption

**Lean label.** The main screen shows one label, worked out from the two scores. The exact values are in the character sheet menu.

| Label | Rule |
| --- | --- |
| Paragon of the light | Light 75+ and Dark under 10 |
| Light | Light minus Dark is 30 or more |
| Leaning light | Light minus Dark is 10 to 29 |
| Balanced | Both under 25 and within 10 of each other |
| Gray | Both 40+ and within 15 of each other |
| Leaning dark | Dark minus Light is 10 to 29 |
| Dark | Dark minus Light is 30 or more |
| Consumed | Dark 85+ and Light under 10 |

Where two labels could apply, Gray and the extremes win over the middle labels.

**Dark thresholds:**

| Dark | Effect |
| --- | --- |
| 25 | Touched. Sensitive Masters may notice something unless it is concealed. Temptation openings begin |
| 50 | **The fall**, if Dark is also higher than Light: a story event. The AI is told the character has fallen. The Order only reacts to what its NPCs sense (section 8) and learn in the story |
| 75 | Deep hold: Light gains barely touch Dark (the hold table) |
| 85 | Consumed |

**Light thresholds** gate light-side abilities from the catalog (for example Force Light at 30, Electric Judgment at 40) and improve meditation (reserve spec, section 6).

**Balance (the Gray lean).** Holding both sides in balance protects you from the dark side's side effects, but not from falling.

| While Gray | Effect |
| --- | --- |
| Dark from dark-tagged Force use | x0.5 |
| Corruption build-up | x0.25 |
| Dark-side penalties from the reserve spec (weaker meditation, costlier calm abilities) | Do not apply |
| Dark from deeds | Full value. Balance does not excuse what you do |

- Balance is unstable. Light still wears away with every Dark gain, so staying Gray takes steady light-side practice.
- If Dark pulls 15 or more ahead of Light, the Gray lean is lost and the normal rules return at once. From there the fall works as usual.
- Lore model: the Je'daii held the Ashla and the Bogan in balance, until enough of them leaned on the dark side that its use was banned. This goes on the lore-check list.

**Redemption (D-331, Jared, 2026-11-21; repo-only amendment).** It takes a pivotal act, not just time, and it works at any depth.

- **Trigger:** a redemption act, Shim's Stage 4: a selfless act done without the dark side (no dark-side draw that scene), at real cost. The engine reads it as a `sacrifice`, `mercy` or `forgiveness` deed of major or extreme severity while fallen. The cost is a story matter, not a mechanic.
- **Effect:** the character moves from fallen to redeemed, however deep their Dark is. Dark drops to just below the fall line (49, if it was higher), Light gains 15, and immersion drops to 0, so the eyes clear (section 7). Corruption does not reset, and the skin's physical corruption stays.
- **After it:** Dark falls only through atonement over time (meditation and Light gains, the hold table). The lasting hold stays: while redeemed, a stress trigger (a fear or rage state, high strain, a loved one threatened) opens a temptation moment even inside the cool-down, still at most one per scene.
- **Event path (D-331 amended, Jared, 2026-11-21; repo-only amendment):** the event path: an explicit engine event of a mind wipe or severance from the Force clears the fallen flag. Dark drops to 49 if higher; Corruption and the skin's corruption are unchanged; immersion drops to 0 (design default: the character cannot draw on the Force, or no longer remembers how). There is **no Light +15**, and the redeemed flag is not set: the character must still choose the light afterwards. The redeemed flag (and its stress-flare rule) is set at the character's first light choice at a temptation moment (`resisted_temptation`, or a light deed of moderate or higher severity) (design default). Until then a single dark deed can push Dark back over the fall line. The event needs a visible cause, like a narrator's interrupted fight end (D-217): the narrator cannot declare it. The cause is an AI event in the same reply naming who does it, which the engine checks before it emits the engine event. Mind wipe: the target is captured or subdued and the actors are a council or Masters able to do it (Revan, the Jedi Council, 3956 BBY). Severance: the actor holds a Force-severing technique (Nomi Sunrider: a unique technique, Characters_04-05), or the target is at a wound in the Force at the moment of a catastrophe (Meetra Surik at Malachor V, Characters_06). A refused cause leaves alignment untouched and is logged. A severance also gives the severed status (M6 checklist item 26, proposal).
- **Minor taint** (Dark under 50, not fallen) is atoned for by reflection: meditation and the hold table, with no redemption event.
- **Lore models:** Revan, Bastila Shan, Ulic Qel-Droma, Anakin at the end of *Return of the Jedi*, Kyp Durron (SW_DarkSide_Fall_Corruption_Redemption_Part1-3.md §3). Shim's "a killer of innocents can't be redeemed" is an in-universe opinion, not a rule (D-328).

## 7. Immersion, eyes and Corruption

Immersion decides what shows on the surface. Corruption decides what lasts. The eyes and the skin can return to normal when immersion falls. The damage underneath does not.

**Eye states** (driven by immersion and Dark):

| State | Rule | Example |
| --- | --- | --- |
| Normal | Below the other rules | Dooku and Ventress: high Dark, controlled, low immersion |
| Flicker | Channeling anger or rage with Dark 30+, during the moment only | Anakin during his fall |
| While channeling | Dark 50+ and immersion 40+, whenever drawing on the dark side | A practicing Sith in a fight |
| Constant | Dark 60+ and immersion 75+, even at rest | Palpatine once revealed |
| Fading | Immersion drops below a rule's threshold. The eyes step down one state per few days | Anakin unmasked at the end of *Return of the Jedi* |

- Species with naturally yellow or red eyes get a natural eye colour flag, so the engine and the AI never read those eyes as a dark-side sign. Sith eyes are a distinct look: darker yellow with red rings. Savage Opress is the model: pale yellow natural eyes before his ritual, signature Sith eyes after it.

**How Corruption builds:**

- While immersion is 40+, each dark-side draw adds Corruption equal to 2% of the draw's share of pool max.
- Outside power sources and Sith alchemy add Corruption directly (reserve spec, section 8).
- It never falls, including after redemption.

**Corruption effects:**

| Corruption | Surface signs (fade as immersion falls) | Lasting damage (permanent) |
| --- | --- | --- |
| 20 | Pallor while immersed | None yet |
| 40 | Grayed, sickly skin and dark veins while immersed | Slower natural healing |
| 60 | Ravaged look while immersed | Lower max Vitality. The age penalty arrives earlier |
| 80 | Severe disfigurement while immersed | Shortened lifespan, physical stats capped below peak |
| 95 | Body visibly failing | Survival depends on the dark side or outside power |

Surface signs scale with Corruption times immersion, but at redemption the eyes recover and the skin does not (D-325, D-331; repo-only amendment): skin pallor and marks already gained stay, as Vader's did, while the eyes clear. Visible injuries, like scars or burns from Force Lightning, are wounds tracked by the health system, not Corruption.

## 8. Sensing, concealment and the Sith alchemy mask

Hiding as a Sith takes two separate things: hiding what others sense, and hiding what they see.

**Sensing the dark side.** A Force user can read another's Dark through Force Sense.

- Contest: the sensor's Force Sense against the target's Concealment (or a fixed difficulty if they have none).
- A clear win reveals the lean and a rough sense of immersion. A narrow win gives only unease: "something is wrong".
- Passive sensing runs automatically against anyone with Dark 25+. Active probing is a deliberate action.

**Concealment (a skill).** It hides your Dark and immersion from sensing.

- Sustained, so it costs a draw per minute like any maintained ability.
- At high mastery it becomes a free use (reserve spec, section 3). This is how Palpatine could sit in front of the Council with no upkeep.
- It does not hide your eyes or your skin.

**The Sith alchemy mask (a ritual).** It hides your appearance.

| Rule | Default |
| --- | --- |
| Hides | Eyes, skin and the visible signs of Corruption |
| Learning class | Ritual, lore-locked to the Sith tradition. A holocron or a living Sith master who knows it. Can pass from master to apprentice in the Rule of Two line |
| Casting | A ritual outside combat. A one-time draw and +1 Corruption |
| Duration | Until the caster drops it, or it breaks |
| Breaks on | Collapse, going past 1.0 strain while channeling the dark side, or a class 4+ dark-side release |
| Recasting | Needs the full ritual again, so a broken mask cannot be fixed mid-fight |

The break rule gives the engine a clean reveal moment, like Palpatine unleashing himself against Mace Windu.

This is a design choice between competing explanations. None of the sources state outright how Palpatine hid his face. The sources to check are listed in section 11.

**Sith traditions differ.** Each tradition is a profile the engine and the AI read, tagged by era.

| Tradition | How it treats the dark side's marks | Mechanics |
| --- | --- | --- |
| Rule of Two (Banite) | Hide everything. Survival depends on staying unseen | Concealment and the mask taught early. Masters pass the mask down. Visible marks are a failure |
| Sith Empire | Show it openly. Eyes and Corruption are marks of rank and power | No concealment expected. Imperial NPCs respect visible marks. Academy training on Korriban |
| Other traditions (for example the Brotherhood of Darkness) | Set per tradition from the lore docs | Filled in as each era is built |

The same yellow eyes that earn respect on Dromund Kaas get a character hunted in the Republic. NPC reactions read the tradition and the setting, not just the eyes.

## 9. Connections to other systems

Alignment reads into the reserve system and the catalog, and stays separate from faction and reputation.

| System | What alignment does there |
| --- | --- |
| Force reserve spec | Anger fuel (+Dark), the dark surge (+Dark and immersion per round), cheaper dark offense while angry, weaker meditation refill at high Dark, costlier calm abilities (healing, Battle Meditation), stronger meditation at high Light |
| Force meld | A light-majority meld slows one member's Dark gain while melded |
| Nexus sites | Dark nexus sites add immersion while you draw there. Light nexus sites boost meditation's effect on Dark |
| Ability catalog | Light and Dark requirements read straight from the two scores |
| Outside power sources | Add Corruption and immersion directly |
| Pressure (D-329) | Dark places, artifacts, mentors, spirits and torture multiply Dark gains, as below |
| Lifetime profiles and the Sith Order schedule (M7) | Profiles need alignment events so the Sidious-like check can be re-run |

**Pressure multipliers (D-329, Jared, 2026-11-21; repo-only amendment).** A pressure factor P, the product of the sources present, capped at 4. P multiplies Dark from deeds and from dark-tagged Force use, multiplies the per-scene deed cap (+15), and divides the temptation cool-down (rounded down). Targets: the D-324 fall speeds (self-driven years; outside pressure days to months; torture about a week; a wound in the Force immediate).

| Source | P |
| --- | --- |
| A wound in the Force (Malachor V, 3,960–3,951 BBY) | 3 |
| Byss (the reborn Emperor, 10–11 ABY) | 2 |
| A dark spirit or entity working on the character (Exar Kun on Kyp) | 2 |
| Korriban, by era (below) | 1.1 to 1.5 |
| Yavin 4's temples while Kun's spirit is there (to 11 ABY) | 1.5 |
| The Dagobah cave, while inside (it also masks presence from sensing) | 1.5 |
| A carried Sith artifact (an amulet, a Sith holocron in use) | 1.5 |
| A Sith mentor actively turning the character | 1.25 |
| Torture (also one temptation moment each scene of captivity) | 1.5 |

Korriban's pull by era:

| Year | Korriban's pull (P) | Basis |
| --- | --- | --- |
| To 3,951 BBY (the ancient Sith to the KOTOR era) | 1.5, strong | Lore: the tombs' permanent dark aura and dark-side pools (*KotOR II*) |
| 3,636 BBY | 1.5, strong | Design default: the Imperial academy era; the lore files give no reading |
| c. 1,000 BBY | 1.1, faded | Lore: Bane found the dark side had "retreated from the ancient edifices long ago" |
| c. 23 BBY | 1.5, strong | Lore: a pull "powerful, insistent, irresistible" (*Jedi Quest*) |
| After 23 BBY | 1.5 | Design default |

Straight-line between the rows. Lore: SW_DarkSide_Fall_Corruption_Redemption_Part1.md §7 and Part2.md §7.

**Alignment is not allegiance.** A Jedi can lean dark and still belong to the Order, as Anakin did. A Sith can have Light in them. Faction standing is its own system, and the Order reacts to what it senses and learns, not to the raw score.

**Non-Force users.** Scores are tracked for everyone, since the Force runs through all living things, but they only have mechanical effects for Force-sensitives. For everyone else, deeds feed reputation, which is a separate system for later.

**Force philosophies (agreed 2026-11-20).** A philosophy is a creation-time choice, revisable through story. It shapes how alignment moves without becoming another meter.

- **What counts as practice:** each philosophy defines which activities and deeds earn Light (or Dark, for Sith schools).
- **Small tilts only:** at most 10 to 20% on Light or Dark gains. Never larger.
- **Reactions:** teachers, orders and NPCs respond to your school.

| Philosophy | Light comes from | Tilt |
| --- | --- | --- |
| Living Force | Mindfulness of the present, compassion, nature | Light gains from compassion and mercy deeds +15% |
| Unifying Force | Long-view meditation, destiny, prophecy | Light from meditation +10%; Light from in-the-moment deeds −10% |
| Jedi orthodox | Discipline, duty, the Code | Light from self_mastery and restraint +15% |
| Jedi Sentinel | Service in the field, protection | Light from protection deeds +15% |
| Gray or balance (Je'daii) | Holding light and dark in balance | Balance rules (section 6) start 5 points sooner |
| Warrior traditions | Honor in combat | Neutral; no Light from meditation |
| Sith passion | Strength through passion | Dark from anger fuel −10% (it comes naturally); meditation lowers Dark less |
| Sith inquisitor (sorcery) | Knowledge and dark sorcery | Dark from dark-tagged rituals −10%; Corruption from rituals +10% |

The list comes from the existing v1 alignment spec (`docs-v2/spec/alignment.md`). The tilt values are starting proposals.

## 10. AI rules, UI and implementation

**AI rules:**

1. The AI never changes alignment values. It only proposes structured deed events and hidden choice tags from the fixed list.
2. The AI receives READ ONLY labels: the lean, the eye state, whether the character has fallen, whether a mask is up, and whether the current scene is a temptation moment. Never raw numbers.
3. The AI never reveals that a choice is a temptation, or that a value changed.
4. The fall and redemption events are announced to the AI by the engine, and narrated as story, not as a meter crossing a line.
5. The tag list and severity guidance go in the system prompt with short examples for each tag.

**UI:**

- Main screen: the lean label only.
- Character sheet menu: exact Light, Dark and Corruption, plus Potential (reserve spec, section 2).
- An alignment log in the same menu, listing each change with its tag and the scene. Proposed: it makes AI tagging reviewable without putting anything on the main screen.

**New character state:**

| Field | Notes |
| --- | --- |
| `light`, `dark`, `corruption` | 0 to 100 |
| `immersion` | Derived value, stored for decay |
| `fallen`, `redeemed` | Event flags with dates |
| `maskActive` | Sith alchemy mask |
| `naturalEyeColor` | Species flag |
| `temptationCooldown` | Scenes until the next temptation moment can open |
| `alignmentLog` | Change history for the menu |

**Build order:**

1. State, config and the tag list.
2. Engine changes from Force use and emotion (section 3).
3. Deed event handling, severity limits, scene caps, context modifiers.
4. Temptation moments: flags, hidden choice tags, typed-input tagging, `resisted_temptation`.
5. Thresholds, lean labels, fall and redemption events.
6. Immersion, eyes, Corruption and its effects.
7. Sensing, Concealment and the mask.
8. Prompt rules, UI, alignment log.
9. Harness tests: a steady Jedi stays light, repeated anger fuel produces a fall, a redemption event clears the eyes but keeps Corruption, a controlled dark user (Dooku-like) keeps normal eyes, and the Sidious-like profile shows constant eyes and Corruption without revealing it while masked.

## 11. Open questions and lore checks

**Additions confirmed on 2026-11-20 (all agreed):**

- Each Dark gain wears away 25% of that amount in Light.
- The hold table values, and meditation lowering Dark.
- The fixed numbers for Force use (section 3) and deed severities (section 4).
- Context modifiers: `provoked`, `defending_others`, `coerced`.
- Temptation pacing: one per scene with a cool-down.
- `resisted_temptation` also giving Willpower XP.
- Lean label rules and the fall at Dark 50 while above Light.
- Redemption trigger and its effect (Dark -30%, Light +15, immersion to 0).
- Corruption tiers and their lasting effects.
- Mask casting cost of +1 Corruption.
- An alignment log in the character sheet menu.
- Alignment separate from allegiance, and tracked for non-Force users without effects.

**Decisions made on 2026-11-20:**

- Balance gives real protection from dark-side side effects but no protection from falling (section 6).
- The Order reacts only to what its NPCs sense and learn in the story.
- Sith traditions differ, and each has a profile (section 8).

**Lore points to verify against `Docs/lore/`.** I wrote these from memory and did not look them up:

- Palpatine's hidden face: confirmed as a recorded Legends idea by Wookieepedia's Mask (Sith Alchemy) page. *Sithisis* and *Star Wars Insider* #82 remain optional reading.
- Maul and Savage: resolved. Zabrak natural eyes can be yellow; Sith eyes (darker yellow, red rings) came with Savage's turn.
- Dooku and Ventress: resolved. They keep normal eyes.
- Plagueis on fallen Jedi not becoming true Sith: resolved as Plagueis's own ideology, not a rule. The engine does not depend on it; it goes in his character profile as a philosophy if he appears.
- Palpatine hiding his presence from the Jedi Council: confirmed by Wookieepedia's Force stealth page.
- Redemption models: Revan, Bastila Shan, Ulic Qel-Droma. Still to check.
- Gray examples: Jolee Bindo, and the Je'daii banning dark-side use after too many leaned on it. Still to check.
- Sith tradition profiles: Banite secrecy versus the Sith Empire's open display. Still to check.
