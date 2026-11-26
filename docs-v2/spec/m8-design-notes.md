# SWRPG M8 design notes

> Exported from the Claude Docs "SWRPG M8 design notes" (revision 68) on 25 Nov 2026. The Claude Docs version is the working copy; this file is re-exported when it changes.

Nov 23, 2026 · @Jared Wright

Design notes for M8 held here until they're ready to hand to Claude Code; each section says which checklist item it replaces or adds.

## Running a blockade (replaces checklist item 4)

One general system for getting past any blockade at any date; the Hydian Way blockade of 3661–3660 is the first instance in the data. A blockade closes the hyperspace routes in and out, so every approach needs resources, connections or exceptional skill.

| Approach | Difficulty | What it needs |
| --- | --- | --- |
| Ride under protection | Lowest chance of being stopped | A convoy or business the blockaders leave alone (e.g. Hutt-backed shipping in 3661), or papers from a permitted party. More expensive or tied to a business deal. Overlaps with smuggling and forged ID |
| Undercover (renamed from "talk through", 24 Nov 2026) | Hard | Fake identities and codes, standard military and intelligence tradecraft. Needs connections to obtain; not a bluff anyone can make |
| Smuggling | Very hard | Paying a smuggler or network that knows the blockade. Expensive |
| Sneak through | Extremely hard | Specialised tech (sensor masking, stealth systems) plus precise timing of patrol gaps. Without the tech it isn't an option |
| Go around | Scales with the blockade's age (below) | Drop out of hyperspace beyond sensor range, travel sublight around the blockade, and either slip in close or land outside patrol range and go in on foot |
| Force through | Needs a fleet | A fleet, or being one of the best pilots in existence |

### Blockade levels

Each blockade has a level, from a trade blockade to an all-out military one. The level sets how strict the pickets are and how hard every approach gets.

1. **Trade blockade:** stops commercial shipping; little interest in individuals.
2. **Enforced blockade:** ships stopped and searched; patrols on the main routes.
3. **Military blockade:** a full cordon, tight patrols, the response to a caught ship escalates to force (the Hydian Way, 3661).

The exact rungs are set at build time.

### Going around: difficulty by the blockade's age

| Blockade age | Difficulty | Why |
| --- | --- | --- |
| First few days | Medium | The blockade is still forming and laying patrol routes. The routes are hard to avoid but there may be holes, except against a trained military like the Empire |
| Established | Very hard | Tight patrols to get through |
| Long-standing | Hardest by ship | Ground sensors alert to unauthorised ships slipping in |

**The safest way around:** land outside patrol range and go in on foot. Patrol coverage outside the city and sensor range are numbers kept behind a knowledge wall. Without the knowledge you can only guess where it's safe to land.

### Knowledge of blockade tactics

A character can know the safe landing distance in two ways:

- **Training:** military or intelligence training in blockade tactics gives a tag on the character ("knows blockade tactics").
- **Observation:** watching the blockade long enough gives the same knowledge for that specific blockade.

The known value can be a range rather than an exact figure, tighter for the trained. Implementation stays simple: the blockade event carries a tag, the character carries a knowledge tag, and when both match, the turn's options include "land outside patrol range" with the known distance. Without the tag the option isn't offered, or is offered as a guess.

### Further rules (agreed Nov 23)

- **Observed knowledge goes stale.** Training gives a general range that never expires. Observation gives the exact figures for one blockade but fades after a few weeks, as patrol patterns shift.
- **The trek on foot is its own risk.** It costs days and brings terrain, wildlife and ground patrols. The ship left outside can be found, a complication for the way out.
- **Getting out is as hard as getting in.** Leaving uses the same approaches; a longer stay means a better-established blockade on the way out.
- **The Force helps but doesn't replace knowledge.** A Jedi's danger sense can warn of a patrol about to find them, a lucky break, never the knowledge of where it's safe to land.
- **Level matters more than age at the low end.** A trade blockade barely tightens with time; the age scale applies mainly to military blockades.
- **Life inside the blockade:** shortages and prices on the blockaded world feed the economy work (e.g. the planned Coruscant food-price index).

**Each blockade records** (dated, like everything else): who runs it and when; its level; its start date (which sets its age); picket strength and alertness; patrol coverage outside the city; sensor coverage, which grows the longer it stands; ground patrols; corruptibility; the response to a caught ship (hail, warn, board, fire, capture); which factions or businesses pass freely.

**Open questions for build time:**

- The checks for each approach and what each draws on.
- Costs and failure consequences: fines, seized cargo, capture, a damaged ship, debts.
- Whether a failed approach can turn into another (a failed bluff becomes a run).
- Renown for a famous run.
- Tie the Hydian Way instance to the 3660 breakthrough (checklist item 1).

## Weapon-type proficiency (new checklist item 13)

Each weapon type gets its own XP and level: a simple measure of how well versed you are with that specific weapon, separate from the form or skill itself. It gives a real reason to specialise.

| Weapon family | Types | How much XP is shared between types |
| --- | --- | --- |
| Lightsabers | Single blade, dual blades (Jar'Kai covers the technique), saberstaff, and the exotic types from SW\_Lightsaber\_WeaponVariants\_AllEras | High. An unfamiliar configuration starts with a small penalty that closes quickly with use. Exotic types further from a standard hilt (lightwhip and similar) share less |
| Blasters | Pistol, rifle, sniper rifle, repeater/heavy (more at build time) | Moderate between close relatives (pistol and carbine, rifle and sniper); little across (pistol vs repeater) |
| Melee | Vibroblade, warblade, electrostaff and others | Decided per family at build time |

**Why lightsabers share so much:** a trained duelist picks up a second blade or a saberstaff competently. Anakin and Barriss both used two blades with little practice shown. Long dedicated training still gives the edge: Maul switched between staff and single blade because he trained with both.

**Effect:** proficiency scales how much of the character's form or skill they can bring to bear with that weapon. For lightsabers the gap is small; for blasters and dissimilar melee weapons it's larger. Being a good shot with a rifle doesn't make you good with a pistol.

**All-in-one weapons** (Cal Kestis style) use the proficiency of whichever configuration is active, so switching isn't free, but for lightsabers the cost is light.

Gains come from using and training with that weapon type, and teachers multiply them as elsewhere. The progression rules below are agreed (Jared, 2026-11-23); exact rates are tuned and tagged at build time.

**Progression (agreed 2026-11-23):**

- **Scale:** proficiency is 0–100% per weapon type, separate from the 0–150 skill scale. It measures familiarity, not fighting ability.
- **Effect:** effective skill = skill × (floor + (1 − floor) × proficiency). Floors (what you keep with a fully unfamiliar weapon): another lightsaber configuration 85%; a close blaster relative 60%; a distant blaster type 40%; a different melee family 50%.
- **Growth is fast** next to skills: regular practice takes a type from 0 to about 75% in a few months and to 100% in a year or two, slowing near the top. Real combat counts for more than drills.
- **Spillover:** a share of each proficiency gain goes to related types, at the sharing levels in the table above. The underlying skill (form, Blaster) grows as normal whichever type is used.
- **Fading:** unused proficiency fades slowly to a floor of about half its peak, and returns quickly with use.
- **Starting values:** Jedi have full single-blade proficiency from Initiate training; soldiers their issued rifle; smugglers a pistol; character creation can add a second. Canon figures default to full with their known weapons, partial with related ones.
- **Teachers** multiply proficiency gains as they do skill XP.
- **Calibration:** characters use their main weapon at 100%, so current numbers don't change; proficiency only matters when someone switches weapons.

## Species traits framework (checklist item 3)

A framework for the 33 species without traits, agreed Nov 23; every trait cites the lore.

1. **What a trait can be:**
   - Body: size, strength and agility ranges and ceilings (Wookiee strength, Jawa size).
   - Senses: low-light vision, smell, empathic senses.
   - Resistances: cold, heat, toxins, radiation, vacuum.
   - Needs: a Kel Dor breather away from Dorin, aquatic species drying out.
   - Social: how other cultures treat the species (prejudice against Twi'leks, Hutt standing).
   - Force: affinity or resistance (Miraluka Force sight, Hutt resistance to mind tricks, Yuuzhan Vong outside the Force).
2. **How big a trait can be:** traits set a species' natural ranges and ceilings, and training moves a character within that range. Ceilings can sit far apart: a Wookiee's strength (tearing arms from sockets) is beyond any trained Human, and only Force enhancement could close a gap like that. Training never lifts a character past their species' ceiling.
3. **Positive and negative together:** yes for most species, but only where the lore gives a downside (the Kel Dor breather; Wookiees unable to speak Basic). No drawbacks invented for balance.
4. **Sources:** every trait cites the lore. The "Game notes" in SW\_Species\_OldRepublic\_Part3 are candidates, not rulings.
5. **Over a lifetime:** traits are mostly fixed, but physical traits follow the species' prime and decline from the age work (checklist item 2).
6. **Exceptions:** individuals who break their species' rule use a per-character flag (the Onimi pattern).

## Species ages: adult, prime and decline (checklist item 2)

Every species gets separate adult and prime ages, with the body peaking at prime and declining slowly after it; agreed Nov 23.

- **Three ages per species:** adult (maturity), prime (the body's peak) and lifespan. Wookiees can then be adult at 18 and in their prime around 200.
- **Decline is universal:** every species' body weakens after prime. It's slow at first and speeds up towards old age. The rate is set at build time in Human-equivalent years, so one curve serves every species.
- **What declines:** the physical stats (Strength, Agility, Endurance) and the body caps. Agility and speed can fall first. Willpower, Intelligence, Charisma, Force skills and form knowledge don't decline with the body, so an old Master keeps their skill while their body slows.
- **The Force slows it:** mastery of Force Control prevents decay and illness and adds decades to a Jedi's life ([Jedi Initiate/Legends](https://starwars.fandom.com/wiki/Jedi_Initiate/Legends), "Instruction"). It's calculated by stretching the normal decline curve: the same Human curve from prime to end of life, spread over a lifespan several decades longer. Only the years after prime stretch, so childhood and prime are unchanged. Body age after prime = prime + (age − prime) × (normal decline span ÷ extended decline span). The extra decades scale with Force Control, from little for the untrained to the full extension for Masters with very high Control. The top figure is set at build time against long-lived Human Masters in the lore. It delays age, it doesn't stop it.
- **Training still counts:** training slows the loss but can't reverse it past prime, and an old body regains less from training.
- **Open for build time:** the decline curve's shape and rates; how strongly Force Control slows it; re-check Bowdaar (about 177 in 3661, in his prime) and very old Masters (Yoda, Vandar Tokare) against the curve.

## World events: the tag network and divergence (checklist items 1 and 8)

Events follow the recorded timeline unless the player breaks a tag the event depends on; agreed Nov 23.

### Tags on every event

| Tag kind | What it records | Example (the Sacking of Coruscant, 3653 BBY) |
| --- | --- | --- |
| Role | Who carries it out, marked replaceable or crucial | Angral leading the armada: replaceable (another Lord of similar rank takes over) |
| Condition | What must hold for the event to happen as recorded, marked crucial or not, with a guard (how hard it is to break: low, medium, high or very high; very high, ruled 23 Nov 2026, takes several steps that each must succeed, or a much harder feat) | The Republic doesn't know: crucial, heavily guarded. The Alderaan conference as cover. The strike team on the Temple |
| Outcome | What the event produces; later events consume these, linking the network | Coruscant occupied, the Temple destroyed, the Treaty signed |

### The ripple

- A broken replaceable role means **substitution**; nothing downstream changes.
- A broken crucial condition means the event **diverges**: altered or cancelled.
- A divergence changes its outcomes, so every event consuming them is re-checked. Inputs intact: it goes ahead. Inputs broken: it diverges too, and the ripple spreads.
- Dated facts that depend on a diverged outcome stop applying: control, leaders and seats freeze at the divergence instead of following the lore.

### Major plot points and alternatives

- **Only massive, story-changing events get authored alternatives.** Each major plot point has a tracker over the tags related to it. When enough related tags break, the story change kicks in.
- **Several alternatives per plot point,** each with criteria tags. The most fitting one is chosen from the current state. Example, the war if the Sacking fails (the Jedi ambush the strike team, Malgus is killed, Coruscant is prepared): all of Malgus's later story is gone, the Treaty isn't signed and the war goes on. Then the alternatives are: peace by attrition (both sides too drained; the Republic much less restricted), a treaty favouring the winner (one side gains major freedoms, the other is restricted), or total defeat of one side. The Cold War happens much later or not at all.
- **Everything else runs on the narrator's direction:** parameters and a heading, not a script per event. No micromanaging minor events.

### Bringing history back (convergence)

- After a divergence, the story converges back towards the recorded timeline where it plausibly can, but **never by reconnecting a broken tag.** Malgus doesn't come back to fulfil his events.
- Convergence happens through events whose crucial tags were never touched. They still fire, adjusted to the new state. Example: the Eternal Empire's conquest doesn't depend on the war's outcome, so it still comes, and finds the Republic and Empire weaker than recorded; worst case, both are too weak to resist.
- Code decides what happened (which tags broke, which alternative applies, which events still hold); the narrator writes how it reads.

## Wartime postings (checklist item 11)

Jedi and Sith are posted to the fronts the world events create, by the same rules on both sides; agreed Nov 23.

### Who goes

- **Masters:** the primary pool for command.
- **Knights:** the main pool, supporting Masters in command or posted on their own.
- **Padawans:** go wherever their Master is posted.
- **Initiates:** never posted.
- **Sith:** the same structure; apprentices follow their Lord.

### Kinds of posting

Frontline combat attached to a military unit; defending a threatened world; diplomatic missions; intelligence and infiltration; healing and relief; training troops; garrison or patrol on a quiet front.

### What decides the assignment

- **Archetype** sets the usual pattern: Consulars lean diplomatic, Guardians lean frontline.
- **Nature tag:** each character's own inclinations (combat, diplomacy, Force-first fighting, investigation and stealth, healing, scholarship), so a combat-inclined Consular who prefers the Force to the lightsaber gets sent where that fits. Uncommon, but possible. The nature comes from the character's history and choices and can drift with how they act.
- **Reputation:** earned titles steer assignments. Kenobi, nicknamed "the Negotiator", draws sensitive political missions where a typical Knight would go to the battlefield.

### Life on a posting

- The Temple routine is replaced by a field routine: fewer training hours, set by how intense the front is; combat replaces drills as the main XP source; study nearly stops.
- Master sessions continue when the Master is posted alongside.
- **Meditation grows in importance and time**, to manage the higher fatigue.
- Fight frequency comes from the front's state in the world event data: frequent on an active front, rare in a quiet sector.
- Effects: much more combat XP and much less study; renown in the region; injury and death risk; dark side pressure from war; relationships with the people you serve beside.

### Ending a posting

Objective met; the front closes; Council recall (or the Lord's, for Sith); serious injury; the Master's decision; or a world event ends it (e.g. the Treaty).

### Troops and officers: one system for both sides

Every commander, Jedi or Sith, builds a relationship with the troops under them. Two values per unit and per named officer:

| Value | Built by | Effect in the field |
| --- | --- | --- |
| Bond (respect, loyalty) | Getting to know them, fair treatment, sharing danger, protecting them, giving credit | Morale boosts in combat with you; initiative (they improvise, volunteer, take risks for you); honest reports, including bad news; low desertion |
| Fear | Killing or punishing officers, contempt, cruelty, Force intimidation | Efficient out of necessity, strict obedience, machine-like; no morale boost; they hide failures to avoid punishment; at extremes, or when you look weak, betrayal or mutiny |

**Further rules (Claude's suggestions, accepted by Jared Nov 23):**

- **Competence earns respect on its own.** Winning battles and keeping people alive raises respect whether you're warm or cold, so a harsh but brilliant commander can still be respected.
- **Named officers and the unit:** a few named officers tracked as people; the rest of the unit as one set of values.
- **Reputation travels:** soldiers talk, and a new unit arrives already knowing yours.
- **Fear needs presence:** a feared commander's unit holds while they're watching; when the commander is absent or losing, morale can collapse.
- **Expectations differ by side:** Imperial troops expect Sith cruelty, so a Sith who treats them well gains bond quickly but may look weak to rival Sith. A Jedi ruling by fear shocks the troops and brings dark side pressure.
- **Losses hurt:** the death of an officer you're bonded to hits morale and the character. For a Jedi, the grief also tests attachment.

## Equipment (spec 22)

The narrator can name items freely, but the code owns their stats. An item the narrator invents maps to a generic class; it never gets stats from the narrator.

### Items as data

One catalog, like crystals.ts. Each item has:

- a class, which sets the damage or armour base from health.md;
- dated availability: first seen, common, restricted, and by which side;
- price anchors from the economy files;
- property tags: saber-resistant, shield-piercing, stun setting, anti-Jedi.

### Weapons

The health.md class bases stay. Named models adjust them slightly: damage within the class, accuracy of ±1 at most, range, rapid fire and a stun setting. Quality tiers (shoddy, standard, military, masterwork) give small bonuses. Power cells are counted as packs, not shots.

Rapid fire (Jared): a saberstaff takes no penalty against rapid fire and gets +1 on normal deflection. A single blade keeps the −1 against rapid fire. *Confirmed (Jared): a double blade has to move less, because it can block and deflect in two places at once, and it needs only 90 degrees of rotation to bring a blade to bear, where a single blade needs 180.*

### Armour

- Classes are light, medium and heavy. Heavy armour lowers dodge and stealth.
- **Jedi robes have zero defence (Jared).** Robes are just robes. A Jedi who wants protection chooses armour. In the Great Galactic War and the Cold War, many Jedi Knights wore parts of a suit or a full suit of heavy armour into battle ([Jedi armor](https://starwars.fandom.com/wiki/Jedi_armor)), so armour is a normal choice for a Jedi in this era.
- Armour is worn by location: helmet, chest, arms, legs. A chestplate does not protect a leg.
- Material sets saber resistance (the lore's cortosis split):
  - cortosis weave resists a blade;
  - refined cortosis (shields, gauntlets) shorts a blade out for a few exchanges;
  - beskar resists and deflects bolts;
  - phrik weapons can parry a saber.
- *Ruled (Jared):* armour does not restrict the Force. Its effects are physical only. Heavier armour costs Agility and movement by class, unless the wearer augments their body (Force body abilities) to keep the same mobility. Against Force lightning, armour gives no protection: metal conducts, so lightning ignores armour value. It deals no extra damage either, since a direct hit is already severe. Confirmed by Jared.

### Personal shields

They were nearly lost after the Jedi Civil War, so in this era they're rare elite issue. A shield is a pool that absorbs blaster damage before armour, wears down as it's hit, and recharges between fights. Standard shields don't stop melee, but Echani and Mandalorian models do. Vibroblades cut through. Sabers go through shields too: the only line saying otherwise has no source.

### Lightsabers and crystals (Jared)

- Saber type matters mechanically. The lore gating stays: a saberstaff needs DoubleBlade 10+, and Jar'Kai needs two sabers and two forms at 21+. A shoto works off-hand.
- **The crystal sets the colour.** Which crystal a character finds depends on their personality, the class they lean towards, and the location (the crystal catalog's sources). Sith use synthetic red crystals (Legends).
- A bonded crystal gives a small bonus (+0.5) after attunement time.

### Getting gear

- **Issued:** the Order's quartermaster for Jedi, who own almost nothing personally, or the military by rank.
- **Bought:** dated prices, plus black-market markups for restricted items.
- **Also:** looted, gifted, or crafted later.

Credits are a real economy, tied to the economy design.

### Carrying (Jared): no weight, but every item needs a place

- Every carried item needs a place on the body:
  - a utility belt for small items (the saber, comlink, medpac, a few small tools);
  - holsters (two hip, one back for a long weapon);
  - armour or clothing pockets;
  - a backpack, if the character has one, for more and bigger items.
- A Jedi usually carries a belt, a saber and little else, unless they bring a backpack. Most troopers are the same.
- Anything beyond the slots has to be held in hand, and a full hand can't fight.
- Bulky loads cost stealth and speed.
- Items are tagged small, medium (pistol), large (rifle) or bulky (heavy weapon, crate).

### Condition

Items are fine, worn, damaged or broken. A saber that hits a weapon without saber resistance destroys it. Armour degrades after severe hits.

### Blasters and armour stats

Lore is in: SW\_Weapons\_Classes\_AllEras.md and SW\_Weapons\_Armor\_Named.md (Docs/SWRPG lore), with the sorted worklist and category index in docs-v2/lore. Rulings (Jared, 2026-11-23): (1) named items dated to the Jedi Civil War (c. 3956 BBY, mostly KOTOR) are available in 3681–3640 BBY as long-lived designs, tagged "unconfirmed in window", unless a page dates their end; (2) infobox prices are game stats from mixed books and eras, used only for relative cost, with the economy files setting actual prices. The class table is the next design step.

### Class table (Jared, 2026-11-23: defaults for Claude Code to tune)

Damage builds on the health.md bases (unarmed 5, melee 12, pistol 15, rifle 20, heavy 30, saber 40).

- **Blasters:**
  - hold-out 10 (very short range, 6 shots, concealable, restricted);
  - pistol 15 (short range);
  - heavy pistol 18 (short range, drains its pack twice as fast, restricted);
  - carbine 18 (medium range, faster fire);
  - rifle 20 (long range);
  - heavy rifle 24 (medium range, 30 shots, autofire);
  - sniper 22 (extreme range; aimed shots at −1 instead of −2);
  - light repeater 24 (autofire, military only);
  - heavy repeater and personal cannon 30 (bulky, poor handheld accuracy, 20 shots);
  - scattergun 22 up close, falling with range, can hit several minions.
- **Exotic ranged:**
  - disruptor pistol 24, rifle 30 (short range, 3–5 shots, shield-piercing, armour counts half, illegal);
  - sonic pistol 13, rifle 18 (can't be deflected; a hit disorients for one exchange (Jared: yes); pierces weak shields);
  - charric 20 (can't be deflected; heavy impact, see below);
  - ion (Vitality only against living targets; heavy damage to droids, shields and cybernetics);
  - flamethrower 25, cone (can't be blocked; armour as below; sets alight; explodes if hit);
  - bowcaster 24 within 30 m (off-world users without the Wookiee build take a penalty);
  - needler 8 plus toxin (10 shots) and ripper 15, both shield-piercing;
  - slugthrowers as ruled, with armour ×1.5 against slugs.
- **Melee:**
  - vibroknife 10, vibroblade 12, vibrosword 16 (two-handed), vibro-ax 20, sword 12, quarterstaff 8;
  - force pike 14 (reach, stun setting);
  - electrostaff 16 lethal, with a stun setting;
  - stun baton (stun only).
  - **Cortosis weave** makes a weapon saber-resistant, so it can parry a saber. It's the default on vibroswords and on Echani, Zabrak, Krath and Sith blades in the Old Republic.
- **Grenades:**
  - fragmentation 20 in a 3–4 m radius;
  - concussion 15 (anti-vehicle);
  - thermal detonator 40, large radius, restricted;
  - effect types: sonic (stun, deafen), ion (droids, shields), gas (breathers only), stun (organics), adhesive (rooted), fire.
- **Armour:**
  - light 3, medium 6, heavy 10, applied per location;
  - tags: energy-absorbing (Electromesh, armorweave, +2 against energy), sonic-dampened (powered and Krath suits), saber-resistant (cortosis, phrik, beskar; beskar also deflects bolts);
  - blast vest: torso only, 1 against energy, 6 against shrapnel and slugs.
- **Personal shields:** an energy pool against blaster and sonic damage, refilled between fights. Echani and Mandalorian models also stop melee. Disruptors, rippers, needlers and slugs pierce them; an ion hit knocks them out.
- **Named variants and quality tiers** modify their class: about ±10% damage, ±1 accuracy, plus tags.

**Armour against special weapons (Jared):**

- **Disruptors:** armour counts half.
- **Electrostaffs and other electrical weapons:** metal armour conducts, so it gives no protection. Non-metal armour (fibre, mesh, padded) counts half.
- **Flamethrowers:** armour protects for a moment, then heats up. Full value on the first exposure, then it falls to nothing over continued exposure, unless the armour is heat-resistant (thermal protection such as Creshaldyne blast armour; the Krath elemental suit).

**Heavy impacts on a block (Jared):** charric bolts, heavy repeaters and cannon bolts.

- Deflecting or blocking them **costs more strain**, a heavier load per block.
- They don't normally risk the saber. Legends Jedi and Sith deflect even walker and starship fire (Mara Jade against an AT-AT, Jaina against a Star Destroyer, Vader), though those are exceptional duelists.
- Only when the defender's strain is high or the block is worn down (deep on the advantage track) is there a **low** chance that the impact knocks the guard arm aside, leaving an opening for the next strike. The saber isn't lost.

### Realistic damage (Jared): a square hit means a square hit

**Jared's ruling:** grazes are fine and expected, and they stay Vitality-only. A solid, clean or critical hit must land as a real hit. Vitality never lets a square hit pass as a scratch. Most ordinary people go down from one square hit. A Force user can keep going only through abilities (pain suppression, health §8, and the like), at their Force cost.

Why this works here: in a text game, saber fights can run many exchanges before anyone lands a hit, so a realistic hit model doesn't make fights a coin toss. Blasters can kill fast on a hit, and that's fine.

**Blasters and other non-saber weapons.** The D-161 margin curve is the gap, because a solid hit at margin 11 is only a minor wound. The change:

- below margin 8 stays a graze, Vitality only;
- a solid hit or better sets a severity floor by location: an unarmoured torso or head takes at least severe, so most ordinary people are out, and a limb takes at least moderate;
- armour at that location lowers the floor: medium by about one band, heavy by about two;
- clean and critical hits keep climbing from there.

**Lightsabers.** A graze, meaning only the tip of the blade, stays Vitality-only. A square slash across the chest is major to fatal: a solid hit to the torso or head is at least critical, and a clean or critical hit is mortal, as today. The current solid result (50% bypass, a severe wound, and 20 off Vitality, so the fight can go on) is too soft for the torso.

**Limb hits take you out of a duel without killing (the Dooku and Obi-Wan model, Attack of the Clones).** A slash to the weapon arm and a stab to the leg: no major damage, but the pain makes the target drop the saber and struggle to walk.

- A moderate or worse wound to the weapon arm or hand forces a drop: a Willpower check, or the weapon is dropped. Pain suppression helps.
- A moderate or worse wound to a leg slows movement and lowers dodge and the agility forms. A severe leg wound makes standing a struggle.
- These come on top of the location penalties that already exist (arm: saber and Strength; leg: Agility).
- Severing still needs W 35+.

**Wound depth decides what still works (Jared).** A cut is judged by how deep it goes, and the loss of function follows the anatomy:

- **Graze:** skin and the surface only. The muscle still works. Vitality, plus a minor wound at most.
- **Partial cut:** part of the muscle is cut through, for example half of a bicep. The limb still works but is much slower and weaker until it heals: a large location penalty to speed and Strength for that limb.
- **Muscle severed:** that muscle no longer works until it's healed or replaced. With most of the bicep cut through, the arm can't lift. That limb's actions fail: no saber grip in that hand, no standing on that leg.
- **To the bone:** critical, whatever the location.

Severing a whole limb still needs W 35+ from a saber.

**Blasters: the margin picks the location (Jared).** The bigger the margin, the more vital the location. A narrow hit favours the limbs; a large one favours the torso and then the head. Design defaults, to tune: margin 8–11 mostly limbs, 12–16 mostly torso, 17+ torso or head. An aimed shot still chooses its location, at −2 as today (D-171).

**Cover (Jared).**

- Shooting at a target in cover needs a bigger margin to hit, because you have to land the shot in the moment they look, aim, fire and duck back, while you do the same.
- A hit on a target in cover is deadlier. Only the head, shoulders and arms are exposed, in a compact area, so cover uses its own location table: head and shoulders weighted heavily, arms for the rest, and no legs. Design default: head 40%, shoulders and upper torso 30%, arms and hands 30%.
- **Suppressing fire** keeps opponents from leaving cover. While suppressed, a target who peeks or fires risks a hit at a lower margin; one who stays down can't fire. That buys time for allies to close in, flank or do something else. It ties into the build-up track that already exists for firefights (rolls §4) and into the Tactics skill.

Cost: re-measure the D-267 mortal-wound targets and the duel lengths, and rewrite health tests 3 to 5 to match.

## Economy

As built: [economy.md](economy.md) (M8 item 5, D-510).

The economy runs on the lore files SW\_Economy\_\* (in Docs/SWRPG lore/, with the rulings already made). The code owns every credit. The narrator reports what happens (bought X, was paid, paid a bribe); the code looks up the price, applies the modifiers and changes the balance. Any amount the narrator invents is ignored.

### Prices

- Each good or service has a base price built from the files' anchors: in-universe first, game stat as backup. The table records the sources for each base.
- **The credit is stable across eras (Jared: no need to overcomplicate it).** Dates move prices only through events.
- Modifiers multiply the base:
  - **location:** cheap Core manufactured goods; dearer in the Outer Rim and Hutt space; dearer still on remote worlds;
  - **legality:** restricted items are black market only, at ×2–5;
  - **dated events:** the Hydian blockade's Coruscant food index (3661–3660, invented numbers), the post-Treaty depression in Republic space (at least a decade from 3653), and wartime shortages of military goods;
  - **haggling:** a Charisma contest moves the price within ±20% (Jared: yes).
- Selling: about 50% of base to a dealer; a fence pays 25–40% for stolen or restricted goods.

### Currencies (Jared: yes, the easiest solution)

- The Republic credit and the Sith Empire's Imperial credit are separate currencies. No exchange rate is on record, so they have equal face value, but each is refused on the other side's core worlds. Money changers in border and neutral space take a 10–20% cut (invented).
- Hutt coins on Tatooine and in Hutt space, at the WotC rates (peggat 40, trugut 10, wupiupi 0.625). Credits are accepted there with a markup.

### Income

- **Military:** monthly pay by rank (an invented ladder matched to the game anchors), plus issued kit.
- **Everyone else:** wages by job (game defaults of 500, 2,000 and 3,200 cr a month), bounties by tier, mercenary contracts, smuggling cuts, and jobs paid by risk and tier.
- Wages are paid as calendar time passes, so time jumps pay out too.

### Jedi and money (Jared)

- The Order provides room, board and gear by rank (the quartermaster), and issues expense funds for missions.
- **On a standard mission, a Jedi declines rewards on principle.** It's their duty, and they don't need the money. Most Jedi refuse naturally, so the narrator plays a Jedi NPC as declining by default.
- **No mechanical penalty for accepting,** unless another Jedi sees it or the Order finds out. Then it's a conduct matter with the Order.
- **Stranded or cut off (the Exile in KOTOR II):** honest odd jobs for pay are fine. A Jedi would earn money through something honourable rather than steal. Stealing or extortion is a dark-side choice that falls to the alignment system.

**Consequences scale with the pattern (Jared):**

- **Accepting a reward now and then,** if seen or found out: at most a reprimand from someone in the Order, or the judgement of the Jedi you're with.
- **If it keeps happening:** a reputation for it with other Jedi (renown, spec 24).
- **Real consequences come from amassing wealth and buying many material things.** That's attachment, against the Order's teaching on possessions. What counts (Jared, 25 Nov 2026): personal holdings over 25,000 cr. Order-issued gear, mission funds and Order ships never count, and neither does a personal ship or droid taken in play (a Jedi who beats a smuggler and escapes in his ship, droid aboard, keeps them). It brings serious standing consequences with the Order, as world reactions and not a single penalty (pairs with renown and alignment).
- **This kind of Jedi is the player's choice.** Among NPCs it's tied to alignment, kept simple: a less firmly light-aligned Jedi NPC might keep a reward occasionally, and that's all. It's rare, and a normal playthrough might show one Jedi accepting once. No NPC Jedi amasses wealth.

### Living costs (Jared: yes, easier to track over long stretches)

- A **lifestyle tier** (poor, modest, comfortable, wealthy) is charged automatically each day, anchored on the 50 cr/day budget traveller. The Temple and barracks are free.
- A specific meal or room can still be bought for the story.
- Ship upkeep (docking, fuel, repairs) comes from the running-costs table.

### Debt (Jared: yes, a full system)

- Loans from banks (lower interest), Hutts or the Exchange (300%+). Repayments follow the calendar.
- A missed payment escalates: a warning, then collectors, then a bounty on the debtor.
- The canon model is Zeerid Korr's 100,000 cr Exchange advance (3653).

### Bribes and NPC wealth

- A bribe is judged against the target's monthly pay, with a Charisma check. An honest official may refuse any amount.
- Generated NPCs carry credits by archetype and job, so loot and robbery produce believable sums.

## Renown and factions (spec 24)

All answers below are Jared's ("yes to all"). The code owns every number. The narrator reports deeds and witnesses; it never sets renown.

### Fame and standing, per faction

- **Fame:** how well known you are to the faction. The bands are Unknown, Noticed, Known, Renowned and Legendary.
- **Standing:** how the faction feels about you, from hated to honoured.
- The two are separate (the Empire can know you well and hate you), and effects read both together.

### Factions are dated data

The starting list for this era: the Jedi Order, the Republic (government and military), the Sith Empire (Sith, military and Intelligence), the Hutt Cartel, the Exchange, the Mandalorians, the Bounty Hunters' Guild, plus fame on individual worlds. Factions appear and disappear on their dates, like the control table.

### Only witnessed or reported deeds count

- The narrator reports a deed and its witnesses. The code sets the change from the deed's size and the witnesses.
- Word spreads with distance and time: a deed on Nar Shaddaa reaches the Hutts fast and Coruscant later. Major events are broadcast by the HoloNet.

### Reputation tags

What you're known for: merciful, ruthless, honourable, keeps rewards, war hero, and so on. Tags come from repeated patterns, and NPCs react to them as well as to the numbers.

### Effects

- How NPCs treat you; haggling and bribes; access to Council missions, Imperial contacts and Hutt jobs.
- Danger: a notorious enemy of the Empire gets a bounty on their head.
- Recognition: Jedi robes or famous armour give you away; a disguise keeps you unknown.

### Change over time

Fame fades slowly without new deeds, but Legendary never fades. Standing lasts a long time; grudges soften only with time or amends.

### Family legacy (Jared; built after M8)

- Renown passes down by family name.
- If no one in the family does anything notable, the family's reputation fades over generations into the history books.
- After that, a faint recognition remains: someone who carries the name may be recognised ("any relation to…?"), but it's only a flicker.
- A descendant's new deeds revive the family's renown.
- The rest of multi-generation play (descendants, inherited traits, succession) waits until after M8. A kept campaign follows one life first.

## Sith acolyte curriculum

Agreed by Jared (2026-11-23). Lore: SW\_Sith\_Academies\_AllEras.md (new; Claude's Chrome read), SW\_Sith\_Academies\_Training\_OldRepublic.md and SW\_Korriban\_Academy\_Part1/2. The Sith version of the Jedi Initiate curriculum, for the reconstituted Sith Empire's academies (Korriban, Dromund Kaas and the lesser academies).

### Before the Academy

- High-born children may have private tutors at home: some Force basics (Malgus; Ffon Althe arrived with advanced training).
- Slaves and low-born children get nothing until they're found.
- **Default intake age about 12.** Groomed high-born children can come younger, and slaves arrive whenever they're found. No entry age is on record.

### The acolyte stage

- **Saber:** lightsaber basics with a warblade or training saber. Then the Blademaster or combat master assigns each acolyte a form suited to their body and style (the general academy method, applied to this era \[inferred\]). Warriors lean toward Djem So, Shien, Juyo or Jar'Kai; Inquisitors toward the Force and the saberstaff.
  - The warblade or training saber trains saber forms at a reduced share, under the weapon-type rule.
  - The pelko-barb training saber \[inferred for Korriban\]: a hit numbs the limb for a while, with no lasting wound.
  - The red lightsaber comes only with apprenticeship.
- **Daily block:**
  - a morning saber class, followed by supervised challenges between acolytes (real injury risk);
  - a class-taught offensive Force lesson (telekinesis first, then telepathy and lightning);
  - the Sith Code and history;
  - a large self-study share.
- **Teaching:** an Overseer teaches one-to-many, so the teacher multiplier is lower than for a Jedi master and Padawan. Self-study is larger than in the Jedi curriculum. Top students earn private Blademaster sessions.
- **Trials as events:** tomb expeditions, beasts, judging prisoners, endurance, the wilds.
- **Prestige:** the code tracks each acolyte's standing in their class, earned from trials, challenges and artifacts. A Lord takes an acolyte as apprentice on prestige, not age. That's usually 3–8 years, and faster for the exceptional (Bane passed students trained since birth within months).

### The apprentice stage

- The red lightsaber; the form deepens under the master.
- Master quality varies by master, from dedicated teacher to one who mostly uses the apprentice as an agent ("teaching was not necessarily the Master's responsibility").
- Missions provide the field XP.

### Danger

Acolyte deaths are real. Generated Sith NPCs come from the survivors, and a player acolyte faces genuinely lethal trials.

### Calibration

The Sith archetypes pass their gates today. Once this is built, Claude Code re-measures the Sith paces and gates, as it did for the Jedi curriculum.

## Medicine

As built: [medicine.md](medicine.md) (M8 item 6, D-511). Ruled after the build (Jared, 25 Nov 2026): bacta is cheaper than kolto in every era (tank about 400 a day against kolto's 600); what changes by date is availability (before the switch-over bacta only on Core worlds and at the Temple; after it, kolto is rare).

Builds on health.md §7 (base healing times and rate multipliers stay), SW\_Kolto\_Bacta.md and the wound depth rules above. The code sets care levels, times, outcomes and costs; the narrator describes them.

### Levels of care

- **None:** ×1, with the untreated risks below.
- **Field care** (a medpac, or a medic with supplies): stabilizes (mortal becomes critical, as today), dresses wounds and stops bleeding. It doesn't speed healing; it removes the untreated risks.
- **A medical facility** (medcenter, ship's medbay, the Temple's Halls of Healing): ×2, as today.
- **Tanks (Jared):** bacta is more effective than kolto (and cheaper once it takes over), which is why kolto was replaced. Kolto tank ×4 (as today); bacta tank ×5 (design default). In this era kolto is the standard and bacta a rarer, dearer import from Thyferra. After the switch-over (the 2000 BBY placeholder) bacta is the standard and cheaper. A patient in a tank does nothing else.
- **Force healing:** stacks, as today.

### Medpacs

First aid, not instant healing: they stabilize, treat wounds and dull pain briefly. Consumable; kolto medpacs in this era.

### Untreated wounds (Jared: depends on the weapon)

- **Blades, claws, slugs and shrapnel:** a moderate or worse wound left untreated past a day risks infection, which slows healing. A severe or worse one also bleeds, draining Vitality and possibly worsening.
- **Blasters and lightsabers:** the heat cauterizes the wound on most species, so the bleeding and infection risk is much lower. A species note can exempt those that don't cauterize.
- Field care removes the risks.

### Wound depth heals without surgery (Jared)

The body regrows muscle on its own, and bacta and kolto are very good at it (Corran Horn was left with only a small scar after a shot through him). So:

- a **partial cut** heals as severe, with the limb slow and weak while it heals;
- a **severed muscle** heals as critical, and the muscle doesn't work until it has healed. No surgery is needed;
- a cut **to the bone** is critical and needs setting (field care or a facility).

### How a wound heals: the treatment roll (Jared)

- When a severe or worse wound finishes healing, an outcome roll decides how it healed. It replaces the flat lasting-injury chances in health §7 (10 / 35 / 70%), which stay as the untreated baseline.
- The roll uses treatment quality: the operator's Medicine skill plus the care level (bacta, then kolto, then a facility, then field care, then nothing) against the wound's severity.
- **Outcomes by threshold:**
  - **clean:** no mark;
  - **scar:** cosmetic only;
  - **minor lasting injury:** small, adaptable;
  - **lasting injury:** the progression spec §18 rules.
- A bacta tank with a skilled operator usually gives clean or scar, even for a critical wound.
- **Surgery (Jared: a roll):** for what needs a surgeon (fitting a prosthetic, internal injuries, removing a toxin source or shrapnel). It needs a facility and a high Medicine skill. Success gives the full benefit; failure gives a weaker result, or worse on a bad miss.

### Prosthetics and cybernetics

Already designed:

- quality tiers and adaptation (basic prosthetic up to 80%, quality cybernetic 100%; progression spec §18);
- the Force ceiling (D-323: a single limb never lowers it; only losing a large share of the body does; cybernetic hands and arms block lightning).

M8 adds the rest:

- cost and availability by date (cybernetic implants up to 7,500 cr in 3956 BBY);
- fitting surgery (the surgery roll);
- a hit to a prosthetic becomes equipment damage (health §5 left this to M8).

### Toxins (Jared: yes)

A poisoned wound (darts, anti-Jedi gear, venom) carries a toxin. It's treated with an antidote (medpac or facility) or with Force abilities that purge poison.

### Cost and access

- Free for Jedi in the Temple's healers, and for soldiers in military medbays.
- Everyone else pays medcenter prices from the economy files, by care level and world.

## Ships and space combat

Ships are data the code owns, like gear in spec 22. Gemini narrates; the code decides speed, damage, cargo and outcomes. Lore: SW\_Starships\_Classes.md (classes, modifications, rulings) and SW\_Space\_Tactics.md (tactics). Rolls, shields, damage and the tracks as built: [combat-scales.md](combat-scales.md) (D-505).

### Ships as data

- **Class templates:** one record per class with stock stats: type and size, crew, passengers, cargo, consumables, hyperdrive class, sublight speed, shields, hull, weapons, price new and used, legality, factions, date range. Gaps are filled from comparable ships and tagged invented.
- **Individual ships:** a copy of the class plus their own history: name, owner, transponder (real, altered or missing), installed mods, condition and damage, cargo, crew aboard, reputation.
- **Hyperdrives (ruling):** drives improved by the Mandalorian Wars. After that, ordinary ships are Class 2–3 and exceptional ones Class 1; older designs keep slow drives unless refitted.
- **Modifications (lore):** private freighters are normally heavily customized (the Dynamic-class was built for it). Heavy mods trade reliability for performance (the Ebon Hawk: Class 1 drive, double speed, temperamental hyperdrive). Altering or removing a transponder is hard, expensive and illegal; ships with no ID draw scrutiny; military and police ships can scan for a ship's true identity. Smuggling compartments defeat customs searches; sensor masking hides energy signatures.
- **Status:** damage and repair, mods, travel, customs and scans, and ownership are now designed below. Ground command (formations plus locations and objectives) is a future item.

### Dogfights (fighters and freighters)

- **Turns** are a few seconds each. Fights are short; two skilled pilots or strong shields make them last longer.
- **Position** is tracked for each pair: head-on, on someone's tail, being tailed, broken off; range close, medium or long.
- **Manoeuvres each turn,** from the lore: defensive (break, jink, scissors, stall, Koiogran turn, power pivot, terrain-following); attacking (snap shot, Reverse Throttle Hop and Tallon Roll as counters to a break, loop back for another pass); pair and group (trap, Under Split, Corellian Slip, Feint and Backstab). Slip-jaws only for droid or Force-aided pilots.
- **Opposed piloting roll** (skill + ship handling + mods); the margin decides the new position. Gemini narrates the sequence after the code decides it.
- **Shots** only from a good position: full from the tail, brief head-on, penalty from the side. Gunnery against evasion. Jinking adds defence but costs your own shots; lore drawback for the attacker: focusing on a jinking target leaves him open to other fighters.
- **Hits by margin:** low hits shields (on the facing hit), solid reaches the hull, big knocks out a system (engines, weapons, astromech, cockpit).
- **Torpedo lock is near-fatal:** the target gets one last evasion roll (or decoys if fitted); fail and it's usually over.
- **Power and shields** (set each turn with the manoeuvre): shift reactor power between lasers, shields and engines (boost one, weaken another); angle shields front, back or even (stronger on one side, thin on the other).
- **Crew roles on freighters:** pilot; gunners in turrets (any direction); engineer (power and shields); droid or tech repairs mid-fight.
- **Force users** get a sense bonus to anticipate.
- **Against capital ships:** hull skimming and trench runs get under the big guns; torpedo volleys on one shield facing; the captain can roll the ship to show fresh shields.

### Fleet battles (capital ships)

- **Rounds** are a few minutes each.
- **Command** goes by rank, but the story can hand it to anyone (officers above you dead).
- **Formations** (lore-based): exchange (no edge; better ships win), Cap the T (beats a column advancing, such as a Slash), Slash (beats spread lines; breaks up if the lead ship falls), Fake (looks like a brawl charge, then wheels into a broadside; beats commanders who break formation, loses to ones who hold), Brawl (melee; adds randomness, the outnumbered side's gamble), Pincer or envelop (beats a Slash, stretched thin), Screen (protects carriers and transports), Feigned retreat (beats an enemy that pursues), Withdraw.
- **A formation is a commitment:** chosen at the start, it lasts until changed; its matchup bonus applies every round.
- **Reforming takes 1–2 rounds** at a penalty with no bonus; a good Tactics roll makes it one round, a bad one leaves gaps. Planned transitions (the Fake, the payoff of a feigned retreat) carry no penalty if done on schedule.
- **Forced breaks:** heavy losses or losing a key ship (a Slash's lead, a command ship) break the formation; the fleet fights as a brawl until it reforms.
- **Orders inside a formation each round:** focus fire, advance, hold or fall back (changes range), launch or recall fighters, roll damaged ships.
- **Matchup roll:** Tactics skill + formation matchup + intel + crew quality. Scouts or sensor ships can reveal the enemy formation a round early or catch them reforming.
- **Composition matters through range and time:** ships rated for firepower against capital ships, point defence, fighters carried, toughness and speed. Carriers need a round to launch and their fighters do damage over several rounds; battleships hit hard from the first round at close or medium range. Close fast and the carrier dies first; hold range and the swarm grinds the battleship down.
- **Damage states:** shields down, damaged, crippled, disabled (can be boarded), destroyed.
- **The two scales link:** a player flying in a fleet battle has their dogfight results feed into it as modifiers.
- **Old Republic example:** the Vanjervalis Chain (Hammerheads slaved to an Inexpugnable; weakness: the link can be hacked).

### Tactics menu

Before each turn (dogfight or fleet), a menu shows the current formation or position, the moves available, what each is strong and weak against, known enemy information, and the reform cost if switching.

### Battle map

Keyboard symbols, under about 40 characters wide. Arrows show facing (each side points at the other); letters are ship classes with a legend underneath; a number after a letter is a group of that many ships; the shape is the formation; the gap shows range; X marks a destroyed ship. Redrawn only when something changes (movement, a formation change, a ship destroyed).

```
ROUND 2 · Range: MEDIUM
REPUBLIC [Line]       SITH [Wedge]

    H>                      <T2
    H>                  <T2
 C> T>      · · · ·   <H
    H>                  <T2
    H>                      <T2

H> Hammerhead x4    <H Harrower x1
T> Thranta x1       <T Terminus x8
C> Carrier x1
```

### Damage and repair

- **Systems that can be hit:** shields (fore and aft), hull, engines, hyperdrive, weapons (per mount), sensors, life support; on fighters also the astromech and cockpit. The hit's margin picks the system, as personal combat picks locations.
- **States:** working, damaged (penalty), disabled (offline), destroyed (needs replacing).
- **Hull** is a pool like Vitality. It does not regenerate: it only comes back through repair. At zero the ship is crippled and can break up.
- **Field repairs:** a crew member rolls the new Repair skill (droids at their programmed skill) to patch a damaged system, mid-fight or after. Patches are temporary and may fail under strain (the Ebon Hawk's hyperdrive).
- **Shipyard repairs:** credits and time, scaled by ship size and damage. Destroyed systems need a shipyard or replacement parts.
- **Condition carries over:** a battered ship is more prone to breakdowns until properly overhauled (as equipment condition, spec 22).
- **Repair skill:** its own skill (Jared, 2026-11-23). Also feeds mods and droid work.

### Modifications

- **Capacity points by class:** high for the Dynamic-class (built for it), low for military ships. Each mod uses points.
- **Types:** engines and hyperdrive, weapons, shields and armour, sensors and jammers, cargo space against hidden compartments, illegal gear (transponder masks, sensor masking).
- **Over capacity is allowed** but every point over adds breakdown risk (the Ebon Hawk: faster than stock, temperamental hyperdrive).
- **Installation:** credits and time; big mods need a shipyard, small ones a skilled crew member (Repair). Factory upgrade kits are the expensive, reliable option.
- **Legality:** military-grade weapons and ID-altering gear are illegal in Republic or Imperial space; found by scans; raise the ship's notoriety if discovered.

### Travel

- **Charted routes:** trip time = base route time × hyperdrive class (Class 1 is the base; Class 2 doubles it). Established routes are safe, help is nearby and times are predictable (lore: [Hyperspace/Legends](https://starwars.fandom.com/wiki/Hyperspace/Legends), Navigation).
- **Off the charted routes:** many short, careful jumps, because mass shadows (planets, stars, gas giants, even comets) can pull a ship out of hyperspace into a collision ([Mass shadow/Legends](https://starwars.fandom.com/wiki/Mass_shadow/Legends)). Each leg needs an astrogation roll; trip time stretches with the number of legs; a failed roll means a dangerous reversion or misjump. Hazards stretch even charted trips (Coruscant to Alderaan took about 16 hours through part of the uncharted Deep Core). Navicomputer charts and astromechs help; Givin and Siniteen can calculate jumps in their heads.
- **Running costs:** fuel per jump, consumables (the class's listed duration), docking fees and upkeep, through the economy and lifestyle tier.
- **Time passes:** travel days advance the calendar and world events.
- **Passage:** liners and freighters for those without a ship, priced by distance and berth.

### Customs and scans

- **Where:** controlled systems, blockades, military checkpoints. Dense in the Core and war zones, light in the Outer Rim and Hutt space.
- **The check:** inspector's scan skill plus equipment against concealment (compartment quality, sensor masking, transponder state, crew bluffing). Transponder checks catch altered or missing IDs; military and police ships can scan for a true identity. Hidden compartments beat basic searches, not a thorough boarding inspection.
- **Outcomes:** clean pass, fine or bribe, impounded cargo or ship, arrest, or a chase. Standing (a Jedi, a known faction member) changes how strictly you're searched.
- **Notoriety:** a ship caught once is flagged and searched more often until its ID changes.

### Ownership

- **Getting a ship:** buy new or used (haggling ±20%), finance through the debt system, win, salvage or steal, or be issued one.
- **Jedi (Jared, 2026-11-23):** Jedi can own ships, and a ship issued to a Jedi is effectively theirs: no checkout process, free personal use (Anakin flew his starfighter to see Padmé), and it can be customized. Two kinds: (1) an issued starfighter, built for dogfighting within a squadron; (2) a personal ship for Jedi who travel a lot on missions away from front-line command (special operations, missions against the Sith), like the SWTOR class-story ships (the Defender) or Revan's Ebon Hawk. Commanders and front-line postings fly fleet ships.
- **Sith:** Imperial assignments (the same ownership-in-practice applies to those issued personal ships).
- **Smugglers and bounty hunters:** own heavily modified ships.
- **Stolen ships** keep their old transponder until changed; the original owner may hunt them (Davik and the Ebon Hawk).
- **Crew:** paid crew get wages; companions serve for a share or loyalty; unpaid crew lose loyalty and may leave.
- **Ship renown:** famous ships are recognised (renown system), which helps and hurts; another reason to change an ID.
- **Ruled:** breakdown risk (ruled by Jared, 2026-11-23): a roll when the ship is pushed (emergency jumps, overloaded systems, hard manoeuvres, running damaged), plus a small chance on every jump for badly worn or heavily over-modded ships. A well-kept stock ship almost never breaks down; the Ebon Hawk is temperamental.

## Ground command (checklist item 14)

Agreed by Jared (2026-11-24). Built on the fleet battles: the plan comes first, and execution is harder to change than in space. Works at every scale, from a squad leader planning a raid to an army. Sector rolls, matchups, breakthroughs and morale as built: [combat-scales.md](combat-scales.md) (D-505).

### When it applies

- **Only from a planning scene** before the battle: a command centre, a briefing, or a council in the field before combat. Without a plan, the fight is ordinary combat and the troops follow their standing orders.
- **Who plans:** by rank, as with fleets; the story can hand command to the player (the officers above them dead).
- **Jedi plan alongside the officers.** A Jedi general sits in the planning with the unit's officers, and then leads from the front.

### The plan

Set in the planning scene, then fixed:

- **Objectives:** a primary, and optionally a secondary.
- **The manoeuvre:** frontal assault, flanking, envelopment, defence in depth, ambush, feint, siege or encirclement, infiltration or raid, or fighting withdrawal. Each has matchups against the others, as fleet formations do.
- **Sectors:** which unit goes where, and who leads each.
- **Support:** artillery, armour and air, where available.
- **A reserve**, held back to commit later.
- **Up to two contingencies** written in advance ("if X, do Y"); they carry out without penalty.

### Before the battle

Scouting and intelligence uncover the enemy's positions and likely plan (Stealth, Intelligence, recon units). Terrain and weather are modifiers.

### The map: a grid with a terrain key

- **A lettered and numbered grid** (columns A–F, rows 1–6 for a typical battle; larger when needed), each square one sector, kept within the keyboard-map width.
- **A key below the map** lists each feature and its square: ridges, rivers, forests, structures, bridges and other chokepoints, and the objectives. Planning is done from it.
- **Terrain matters:** cover, high ground, chokepoints, what armour can cross, and artillery lines of sight.
- **Unscouted squares stay unknown** until recon reveals them; scouting changes both the map and the key.
- **Known places use the lore:** a battle at a known site (Ruusan, Geonosis, Jabiim) takes its features from the lore files. Elsewhere the narrator generates them, tagged invented, and they stay fixed once shown.
- **Redrawn only when something changes:** a unit moves, a sector falls, a feature is destroyed.

```
PLAN · Ruusan plains · Day 1, dawn
    A    B    C    D    E    F
1   .    ^    ^    ~    .    .
2   .    ^    .    ~    #    r2
3   i2   .    .    =    #    r3
4   i3   .    *    ~    .    .
5   a1   .    .    ~    .    T
6   .    .    .    ~    .    .

Units:  i infantry  a armour  r enemy  T Sith HQ
Terrain:
  B1–B2  ridge: high ground, cover, slows armour
  D1–D6  river: impassable for armour except the bridge
  D3     bridge (=): the only crossing; a chokepoint
  E2–E3  fortified ruins (#): heavy cover, held by the enemy
  C4     objective (*): supply cache
  Unknown: F1–F6 not yet scouted
```

### The battle

- **Runs in phases** of an hour or more. Each phase compares the two plans, adjusted for troop quality and morale (bond or fear, from the postings system), support, and the commander's Tactics roll.
- **The player's own fight** on the front line is a modifier for their sector, as dogfights feed a fleet battle.

### Changing the plan

- **Officers keep direct lines to the Jedi and to every squad leader** (Jared). With a command post in contact, the plan can change in real time when needed, and the officers give tactical support: the overall picture, relayed reports, coordinated fire.
- **A front-line commander** changes their own sector at once.
- **Without a command post in contact** (cut off, jammed, or no officers), wider changes take a whole phase to spread and carry a penalty; only the plan and its contingencies hold.
- **High-bond units improvise** in their own sector; fear-ruled units follow orders to the letter, even past the point where they make sense.

### Jedi and Sith at the front

- **They lead a sector in person:** their presence raises morale there, and they fight.
- **Their own view is their sector;** the wider picture comes through the officers' lines.
- **A player commanding from the post** (the officer archetype) sees the whole battle but doesn't fight or raise morale at the front.

### Battle meditation

The lore's own ground-command tool (Bastila Shan; the coordinator at Mizra; Kaan at Ruusan): a trained user improves the whole side's rolls. Its weakness is also lore: kill the coordinator and the side routs, as at Mizra.

### Results

Objectives taken or held, casualties and morale; a won or lost major battle for the world events. Planning a battle gives Tactics XP (item 12).

## Order 66: the warning race (PP-5 alternative 2)

Agreed by Jared (2026-11-24). Fires only when Sidious escapes his office alive and exposed, leaving two or three surviving Jedi who know he is a Sith Lord (world-event-tags-1000BBY-4ABY-draft.md, PP-5 alternative 2).

### Two clocks

- **Palpatine's clock:** he can only send instructions from a HoloNet relay or a starship transceiver. Most likely he contacts Mas Amedda, who has easier access to either, to send the order. The engine sets the time from how he escaped and where the nearest relay or transceiver is: minutes, not hours.
- **The Jedi's clock:** the survivors can most likely use the comm in Palpatine's own office, at once. Otherwise they reach the Temple and send the warning from there (in Legends, Kenobi and Yoda later recode the Temple's recall beacon; here the Temple's systems send the warning instead). The time depends on their wounds, transport and whether the office comm still works.
- **The player is one of the survivors,** so their actions move the Jedi's clock: thinking to use the office comm, getting transport, fighting through, reaching the Temple.

### Who wins sets the picture

- **Warning first:** Jedi everywhere have a little time to break away from their clones before the order lands; many survive.
- **Order first:** in the field it plays out mostly as recorded, but the Temple is warned once the survivors reach it, and Jedi who weren't with clone units can still be reached.

### On Coruscant

- **The Coruscant Guard and the 501st get the order early,** because it is now a race. The 501st is on Coruscant and receives it alongside the Guard (Jared).
- **Palpatine's next move** (engine-weighted, narrator-told): an emergency session of the Senate to turn the Republic against the Jedi (more likely), or an immediate attack on the Temple with the Coruscant Guard and the 501st (less likely).
- **Who leads an attack on the Temple depends on Anakin** (Jared): in variant 2a (Anakin escapes with Sidious), Vader leads the 501st against the Temple as in the recorded raid, though the Temple has been warned. In variant 2b (Sidious escapes alone, Anakin sides with the Jedi), there is no Vader to lead it, so an attack uses the Coruscant Guard and the 501st together.

### Each Jedi's fate

- **An engine roll per Jedi** (numbers invented), adjusted for: where they were (with a clone unit, at the Temple, on a mission without clones, travelling); their unit (ARC troopers and commandos with a high bond can refuse); **danger sense** (Force sense and skill, a real factor: in Legends several survivors sensed it coming); combat ability if it comes to a fight; and whether the warning reached them before the order.
- **Canon survivors are guaranteed** (Jared), unless a player kills them: they survived the worst case. Jedi recorded as dead can survive. This is where Ahsoka's chance comes from (with Plo Koon's unit).
- **Results go to the narrator as a list** of who survived and where. Every survivor is tracked as a person and feeds later events (more Jedi in hiding, a different Purge).

### After the escape (agreed by Jared, 2026-11-24)

- **Order 66 goes first,** through Mas Amedda, within minutes. The clones act on it at once; their loyalty can only shift later, if the Senate turns.
- **The Senate session takes hours** to gather and open; by then the order has done most of its damage.
- **The Jedi defend the Temple.** No Council-level Jedi leaves to testify while two clone legions attack it.
- **Palpatine most likely wins the Senate.** Outcomes, weighted: the Senate backs him (the default: Jedi outlawed, the Empire comes, later and contested); the Senate splits (unlikely: civil war, loyal systems and clone units on each side); the Senate removes him (very unlikely: most clones stand down, Palpatine hides as a hunted Sith). The long odds come from someone speaking for the Jedi without taking a fighter from the Temple: the Delegation of 2000, Padmé, or a player not needed in the defence (a senator, an aide, a late-arriving Jedi), with evidence found in play. Clones follow the Senate's verdict, since their loyalty is to the Republic first.
- **The Separatist Council:** if Palpatine holds the Senate, he kills the Council himself as soon as he can (variant 2b has no Vader to send). Ending the war is still in his interest: it frees him to hunt the Jedi and build the Empire. If he loses the Senate, the Council lives and the narrator directs the war.
- **Variant 2a:** the warning names Anakin as a traitor. He knows the Jedi's codes, the Temple's defences and who is posted where, so his raid is better aimed, but every warned Jedi knows to avoid him.
- **Variant 2b:** Padmé most likely lives (in the lore she dies of Anakin's fall); the twins are born to living parents. The narrator directs it; no forced death.
- **Palpatine stays dangerous:** the Coruscant Guard, Mas Amedda, the loyalist senators and his secrecy as Sidious remain. He is a Sith in hiding when exposed, directed by the narrator, with no fixed plan written for him.

## Droids

As built: [droids.md](droids.md) (M8 item 7, D-512).

Agreed by Jared (2026-11-23). Lore: SW\_Droids\_Classes.md (classes, restraining bolts, memory wipes, legal status, the Great Droid Revolution, Ionize, Old Republic models with prices).

### Droids as data

- **Model templates:** class (one to five), maker, price, base skills and programming, equipment, locomotion, date range. Prices from the KOTOR Campaign Guide where known, tagged (game stat); gaps filled from comparable models and tagged invented.
- **Individual droids:** a copy of the model plus their own history: name or designation, owner, installed modules, condition and damage, time since last memory wipe, personality traits, restraining bolt fitted or not.

### Skills

- **By class and programming:** class one medical and sciences; class two Repair, astrogation and slicing; class three languages and social skills; class four combat and security; class five labour.
- **Upgraded by modules, not training:** new skills or higher ratings come from installed modules and reprogramming (credits, a Repair or programming roll, a shop for big jobs). Droids do learn a little from experience while their memory isn't wiped.

### Memory and personality

- **Factory droids** come with a basic personality, not the full character of an R2, a T3 or an HK.
- **Personality grows** with time since the last memory wipe: quirks, opinions, loyalty, independent judgement (lore: unwiped T3s formed gangs; G0-T0 developed its own motives). A droid never wiped can become a full companion over time.
- **Full-personality companions** come only from droids that aren't fresh from the factory: second-hand units, salvage, a droid with a past (HK-47, T3-M4).
- **Wiping** resets personality, quirks and accumulated learning to factory programming. It's a hard choice, not an evil one: droids are wiped routinely in the galaxy, so wiping is not a dark-side act (Jared). Companions may react to it.
- **Restraining bolts:** force obedience to a caller; some droids resist them. How the player treats a droid companion can matter to the story and other companions, but droids don't count as people for alignment.

### Combat and damage

- **System states like ships:** working, damaged, disabled, destroyed, by location (limbs, sensors, motivator, processor, weapons). Droids take no wounds and don't bleed; they're repaired (Repair skill, parts, a shop), not healed.
- **Vulnerable to ion weapons and Ionize** (the Force power from the Great Droid Revolution); EMP-type effects disable rather than wound.
- **Shields:** some models carry personal shields (the Mark I assault droid's bubble briefly stops blaster bolts and lightsaber strikes).

### Companions and roles

- **Astromechs on ships:** astrogation, in-flight repair and a co-pilot role, tying into the ship rules (the T3's starfighter interface).
- **Protocol droids:** translation and social support. **Combat droids:** escort and guard.
- **Players:** droids are companions and NPCs only; players can't play a droid (Jared).
- **Legal status:** droids are property, bought, sold, stolen and impounded like gear; droid rights is a contested movement in the world.

## Holocrons and Ossus (open calls, settled)

Agreed by Jared (2026-11-23).

### Holocrons as teachers

- **Yes, with limits.** The gatekeeper is an imprint of the maker and can teach what they knew: Force Knowledge, technique theory, and specific abilities the maker had.
- **Teacher multiplier** between self-study and a living master: it can talk and demonstrate, but can't watch and correct like a master.
- **Capped** at the maker's level in that subject; past that it has nothing to teach.
- **No physical training:** forms practice still needs a partner or a training droid.
- **Access is gated:** Jedi holocrons sit in the Archives behind permission; opening one takes the Force.
- **Sith holocrons** pull toward the dark side: studying them adds alignment risk.

### Holocrons with no known date

- **Maker known:** the holocron exists from the maker's lifetime.
- **Maker unknown:** it exists from the first date the lore places it somewhere.
- **No date at all:** not placed in the world. The story can still introduce a generic "ancient holocron" built from the catalog, with nothing invented about a named one.

### Ossus: no Force bonus

- No Legends source makes Ossus a nexus or vergence; Nomi Sunrider's line that the Force "permeates everything" there is flavour, from before the planet was ruined ([Ossus/Legends](https://starwars.fandom.com/wiki/Ossus/Legends)).
- After the Cron Supernova (3996 BBY) it is arid and toxic; its only natives are the Ysanna, descendants of surviving Jedi who forgot the Force and treat it as magic. The Jedi value it as a ruin and dig site.
- **Its value in the game:** the Great Jedi Library ruins, artifacts and holocrons, the Ysanna, the toxic environment. No training bonus.
- The later SWTOR Jedi colony on Ossus is a world event if the campaign reaches it, still with no bonus.

## Non-Force skills and archetypes (checklist items 10 and 12)

As built: [skills-m8.md](skills-m8.md) (M8 items 10 and 12, D-513).

Agreed by Jared, 25 Nov 2026. Every XP source is a structured line from code, never the narrator. Teachers multiply gains as everywhere else, and every number is set and tagged at build time. Item 10 (the officer) is folded in.

### XP from play

- **Charisma:** a conversation earns XP only when code logs a social line (something at stake, or a relationship changes); more lines the same day earn less. Target: an ordinary sociable adult reaches about 30–40 by age 30; diplomats 60–80.
- **Persuasion:** success 1.0, failure 0.25, scaled by the stakes and the opponent's level.
- **Tactics from command:** stakes × outcome × size of command. A loss still teaches, at about half, as with form XP. The fleet and ground battles (combat-scales) supply the events.
- **Tactics from personal combat:** each strike earned by reaching +3 on the advantage track gives a small Tactics share.
- **Discussing tactics:** with a master, the full teacher multiplier; with a peer, half the base rate.
- **Cultural insight (Intelligence 80+, the Thrawn model):** studying a culture's art or history gives Tactics and an insight bonus against that culture's forces: +1, at most +2, in fleet and ground rolls.
- **Intelligence:** academic study, staff work and negotiations, plus 0.2 of any Tactics XP earned in the field (study already gives 0.4).
- **Melee, Blaster, Stealth:** field use in fights, as with the other combat skills; teachers make training more effective.

### New activities

| Activity | Primary | Secondary | Open to |
| --- | --- | --- | --- |
| Staff work (planning, logistics, intelligence analysis) | Intelligence | Tactics 0.5 | Officers, staff postings, intelligence services |
| Negotiation and political work | Charisma | Intelligence 0.3 | Anyone; you learn win or lose |
| Hunting (physical load) | Stealth | Tracking | Anyone |
| Tradecraft | Investigation | Stealth 0.3, Charisma 0.3 | Intelligence services |
| Melee style training | Melee | The style's proficiency | Needs a teacher or a recorded source |

Intelligence field operations earn XP from their stakes and outcome, as commanding does. The Jedi and Sith curricula get a Melee weight in the order requirements (Padawans and acolytes).

### Melee styles

- **One Melee skill does the real work.** Styles (Echani, Teräs Käsi, Stava, K'tara, Hijkata, Mandalorian and the rest from SW\_Martial\_Cultures Part 3, each dated and tied to its culture) are proficiencies on top, 0–100%, built like weapon proficiency.
- **A style must be trained to be had.** Starting one needs a teacher or a recorded source (a manual or a holocron of that art); the rulings on who teaches outsiders apply. After that, training and fighting both grow it. Training a style also gives Melee XP.
- **Almost no overlap:** each style is learned on its own.
- **Higher Melee learns styles faster:** up to +50% at Melee 100, on a smooth curve.
- **No style costs nothing:** you fight at plain Melee. A style adds up to +5 on the skill scale at 100%, plus one situational edge from its lore (Echani reading an opponent, Mandalorian fighting armoured with mixed weapons). **Teräs Käsi is the exception, a flat higher bonus (Jared): the Followers of Palawa created it to fight the Jedi, but it gets no bonus against Force users. Its masters strike as hard as a blaster pistol or slugthrower and punch through body armour, and its practitioners are extremely fast.**
- **Stacking:** weapon proficiency multiplies the skill; the style adds to it. Some styles are unarmed-only (Teräs Käsi), some cover weapons (Echani, Mandalorian).
- **Fading:** as weapons, slowly to about half the peak, back quickly with use.
- **Game-derived powers** (Matukai, Teräs Käsi meditation healing and strike power and the like): not built now; possible style perks later.
- **Duel tiers still rule:** no style lets a non-Force fighter beat a top duelist.

### Training programmes

- Dated programmes a character can enrol in, each with entry rules and curriculum weights. Lengths from the sources: Carida stormtrooper programme 2 years (full course 4), Carida flight school 2, Prefsbelt IV 3, Royal Guard 1, Raithal 1, verd'goten ages 8–13, hrrtayyk about 12; clone regulars and commandos as in the lore.
- Where the sources give no length: officer academies 3–4 years, universities 4. Senatorial apprenticeships stay story-only.

### Archetypes

| Archetype | Focus |
| --- | --- |
| Officer | Tactics, then Intelligence, then Charisma; a smaller Blaster share; Piloting for naval officers |
| Intelligence officer: analyst | Intelligence and Investigation, then Charisma |
| Intelligence officer: field agent | Stealth, Charisma, Blaster and Melee, then Investigation |
| Senator or politician | Charisma, then Intelligence; little combat |
| Scholar | Intelligence, then Investigation; Force Knowledge where it fits |

- **Intelligence officers** are the spy networks (Imperial Intelligence, the SIS, Alliance and New Republic Intelligence, the Bothan SpyNet). They are ahead of a line officer on most stats, behind only on Tactics. Analyst and field agent are two lines: a character can move from one to the other, but NPCs are generated on one.
- **Senators:** the archetype covers generation and stat lines only. A Senate seat is a story event (an election, an appointment), not a rank.
- **Canon anchors:** the existing canon sheets; add sheets where a key figure has none (Thrawn, Tarkin, Mon Mothma, Malavai Quinn, Ysanne and Armand Isard, Airen Cracken, Cipher Nine, Watcher Two).

### Rank ladders

ranks.md §3 says only that non-Force careers earn faction ranks by service, skill and deeds. Each faction now gets ladders as dated data, with lore titles where a faction's differ: army lieutenant → captain → major → colonel → general; navy ensign → captain → commodore → admiral; intelligence agent → handler → section chief → director. Promotion takes years of service, a skill minimum and recorded deeds.

### Gunnery and Repair

Two new non-Force skills (combat-scales D-505 and fix12 D-506; scope from the lore chat, 25 Nov 2026). Until they exist, the combat rules stand in Piloting for a pilot's shots and Blaster for a turret gunner.

**Gunnery (ruled): any weapon fired from a mount.**

- A starfighter's lasers, ion cannons and torpedoes (fired by the pilot); freighter turrets; capital-ship turbolaser, ion cannon and point-defence batteries.
- Guns on ground vehicles (tank cannons, AT-AT guns); fixed emplacements (anti-orbital and artillery batteries); crew-served tripod guns such as the E-Web.
- Weapons a person carries, heavy ones included (repeating blasters, rocket launchers, flamethrowers), stay under the personal weapon-type proficiencies. Blaster stays personal arms.

**Repair (ruled, Jared, 25 Nov 2026): anything mechanical, in combat too.**

- Ship, vehicle and droid maintenance and field repairs.
- Restoring knocked-out systems mid-fight (the freighter engineer, astromech repairs); swapping a burnt-out shield projector; bringing a ship back after an ion hit.
- Repairing weapon and armour condition (equipment spec).
- Modifying and upgrading anything mechanical (droids, ships, vehicles, gear) is Repair's work too, opening up at higher levels: upgrading a droid is a Repair job. Slicing (computers and security) stays separate.

|  | Gunnery | Repair |
| --- | --- | --- |
| Trained by | Pilots, alongside Piloting (every sortie trains both); gunners, vehicle crews and artillery as their career | Mechanics, engineers and military techs as their career |
| XP from use (combat XP rules) | Shots taken in a battle, scaled by margin and stakes | Repairs made in a fight, or during upkeep (travel, docking) |
| Activities | Simulator and gunnery range, with teachers | Repair and maintenance work |
| Secondary weights | Agility 0.3, Intelligence 0.2 | Intelligence 0.3 |
| Needs | A mounted weapon | A tool kit and spare parts for anything beyond quick fixes; parts come from the economy (item 5) |
| Canon anchors | Wedge Antilles and the Rogue Squadron pilots; Han and Chewbacca on the Falcon's quad guns | Chewbacca, Bao-Dur, T3-M4, R2-D2 |

- **Archetypes and careers:** add or adjust starfighter pilot, ship gunner, and engineer or mechanic; the soldier, naval officer and smuggler lines take a share. Droids: astromechs repair, and some droids crew guns (droids section).
- **Generated NPCs:** both join the training schedules, and the years-trained stop applies.
- **Build step:** once both skills exist, the combat-scales caller uses them in place of the Piloting and Blaster stand-ins.

### After the build

Audit what trains Melee, Blaster and Stealth today, then re-measure the archetype paces and the canon NPC ranges for Intelligence, Tactics, Charisma, Melee, Blaster, Stealth, Gunnery and Repair.

**Teräs Käsi in numbers (confirmed by Jared, 25 Nov 2026):**

- Style bonus up to +10 at 100% (other styles +5).
- A master's strikes count as blaster-pistol damage in the realistic damage rules and partly ignore light and medium body armour, scaling up with proficiency.
- Speed: +2 on the melee contest that moves the advantage track.
- **Anticipation at mastery** (the art trains senses to anticipate strikes with ease): a precognition-like defence that works the way Force Sense's precognitive defence does, in melee and at close range only. Master (proficiency 100% and Melee 81+, High Master tier): half the defence a Force user of that tier gets from Force Sense. Grandmaster (Melee 101+, Legendary tier): the full equivalent. It doesn't stack with the fighter's own Force Sense; the higher one applies.
- Duel tiers still rule.

Sources: power from *Threats of the Galaxy* and *Hero's Guide* (RPG books); speed and anticipation from the game guides and *The Clone Wars Campaign Guide*: mechanics inputs only, never narrator lore.

## Starting traits and formative events (character creation)

Agreed by Jared, 25 Nov 2026. Traits give a character a personality and a history the code can use; formative events build them in play-like scenes before the campaign starts. Both extend character-creation.md (talents, background flags, backstory facts, philosophy), which has no personality today. Catalogs are drafted with Jared; numbers are set and tagged at build time.

### Traits

- **What a trait is:** a backstory fact with a small mechanical hook and a narrator note. Every trait cuts both ways. Example, *Hot-headed*: +1 in the advantage-track contest when pressing an attack; −2 Willpower against provocation; more dark pressure when angered.
- **Four kinds:** origin (how you were raised: Temple-raised, Coruscant underlevels, noble house, military family, farm world, slave-born, refugee); temperament (patient, hot-headed, curious, stubborn, compassionate, ambitious, reckless, cautious); scars and experience (war veteran, massacre survivor, betrayed, lost family, former prisoner); ties (a rival, a debt, a contact, a protector, a family you still see).
- **At the start:** one origin, one temperament, one scar or tie; an optional fourth with a flaw-heavy trait.
- **Weight:** small. ±1–2 on rolls in the trait's situation, ±10–20% learning speed on linked activities, reaction shifts with specific factions or kinds of NPC. Never touches the duel tiers or the 4.0× pace cap. Separate from talents: no aptitude traits (a "gifted pilot" is a talent).
- **Dated and gated:** traits are dated data, filtered by path, species, homeworld and era ("Sacking of Coruscant survivor" only for someone alive there in 3,653; Temple-raised Jedi choose from a narrower origin list). Ties link to a generated NPC, or a canon one where the lore allows.
- **Change in play:** slowly, through recorded events only: a fear overcome after facing it several times; a betrayal or massacre adds a scar; a tie ends when the person dies. The narrator may suggest a change; the code decides.
- **Jedi and alignment:** some traits press on Jedi teaching ("Attached to family" raises attachment pressure; "Compassionate" eases dark pressure from mercy), through the alignment system.
- **NPCs:** canon figures get traits from the lore (Anakin impatient and attached; Obi-Wan patient and dry-witted); generated NPCs get one or two at random. The narrator plays them consistently; the effects apply to NPCs too.
- **Choosing:** from a list filtered as above, with a "suggest from my backstory" option and the formative events' suggestions.
- **Catalog:** about 35–40 traits to start, drafted with Jared, built as data.

### Formative events (the growing-up quiz)

- **What it is:** short "this happened, what did you do?" scenes covering the years before play. Example: an initiate finds an Archives text describing a dark-side technique: ask a Master, look for more, or try it (a choke, yes; lightning, never, beyond an initiate). A friend wants to prank an instructor: join, stay out, or report him. Sneaking out at night to cause mischief around the Temple.
- **When:** the beginning stage only, once. A character starting older gets one round at creation covering childhood to the start age; a youngling start plays the first days, and when the player skips ahead (to the Trials, say) the quiz covers the skipped years. Never again after that.
- **How many:** one or two per stage covered (Initiate, early Padawan, late Padawan): 4–8 scenes.
- **Fit:** events are dated data by path, age and date (Jedi Temple scenes; Sith academy rivalry and cruelty; cadet barracks and a first battle; street gangs and survival). Options fit what a child can do. A youngling in 3,653 may live through the Sacking.
- **What an answer does (never combat stats or skill numbers):** a backstory fact the narrator can use later; trait leanings, with traits suggested at the end for the player to accept or swap; a small alignment and dark-pressure nudge (about ±2 an event, ±10 overall; trying the choke adds a little dark pressure and a "knows of the technique" flag, not the power); relationships (the friend becomes an NPC with bond or rivalry from what you did; reporting him earns an instructor's trust and a peer's resentment); a little standing with the Order, academy or unit.
- **Answers:** 3 or 4 fixed choices, plus an optional one-line note of the player's own for narrator colour only. The code decides every effect.
- **NPCs** don't take it.
- **Pool:** about 30 events to start, drafted with Jared (the Jedi youngling and Padawan set first, then Sith, military and civilian), built as data.

### Trait catalog (agreed by Jared, 25 Nov 2026; numbers are placeholders, tuned and tagged at build)

44 traits: 12 origins, 14 temperaments, 10 scars, 8 ties. A starting character takes one origin, one temperament and one scar or tie.

**Origins** (filtered by path, species, homeworld and date). **Temple-raised needs arrival at the Temple before age 10;** a Jedi who arrived at 10 or older takes an ordinary origin for the life before.

| Trait | Good side | Bad side | Narrator note |
| --- | --- | --- | --- |
| Temple-raised (Jedi; arrived before 10) | Jedi Code and lore study +10%; trusted inside the Temple | −2 with criminals and the street; naive about money | Sheltered, formal, knows no other home |
| Coruscant underlevels | +1 Stealth and Investigation in cities; street contacts | Upper-level NPCs cool; low start money | Streetwise, wary of uniforms |
| Noble house | +2 Charisma with elites; start money | Commoners and criminals distrust; family obligations | Polished; upholds a name |
| Military family | Tactics study +10%; +1 Willpower against fear | −1 improvising outside doctrine | Respects rank |
| Farm or frontier world | Endurance training +10%; +1 tracking and survival in the wild | −1 with Core etiquette and elites | Plain-spoken, practical |
| Slave-born (where slavery exists on the date) | +2 Willpower against domination and pain | Slavers may recognise you; distrust of authority | Freedom above all |
| Refugee | +1 adapting to new places; extra languages | Trust comes slowly; low start money | Has lost a home once |
| Spacer-born | Piloting and Repair learning +10% | −1 Charisma with planetside authorities | At home aboard a ship |
| Imperial-born (Sith Empire) | Knows Imperial custom; Imperials react better | Republic suspicion | Raised under the Emperor's order |
| Academy-raised (Sith) | +2 Willpower against pain | Bonds form more slowly | Trusts no one completely |
| Mandalorian clan-born | Melee and armour learning +10%; clan ties | Outsiders wary; bound by clan honour | Measures people by deeds |
| Criminal family | Fences pay a little more; underworld contacts | Law enforcement reacts badly | Knows how deals work |

**Temperaments** (can shift in play)

| Trait | Good side | Bad side | Narrator note |
| --- | --- | --- | --- |
| Hot-headed | +1 on the advantage track when pressing an attack | −2 Willpower against provocation; more dark pressure when angry | Quick to anger and act |
| Patient | Meditation +10%; +2 Willpower against provocation | −1 in the first exchange of a sudden fight | Waits, watches, then moves |
| Curious | Study and Investigation +10–15% | More temptation hooks (forbidden knowledge) | Asks one question too many |
| Stubborn | +2 against persuasion and mind tricks | −1 in negotiations needing compromise | Hard to move once decided |
| Compassionate | Mercy eases dark pressure; +1 with the suffering | More attachment pressure; −2 against pity ploys | Can't walk past someone in need |
| Ambitious | XP from deeds and standing gains +10% | Elders and rivals wary of your eagerness. Not a dark trait in itself (Jared): ambition can mean striving to be a great Jedi; dark pressure comes only from dark acts done for it (sabotage, betrayal) | Wants to rise, and shows it |
| Reckless | +1 on bold, risky moves | −1 on defence; more injuries | Acts first |
| Cautious | +1 spotting traps and ambushes | −1 on bold moves; slow under pressure | Plans for the worst |
| Witty | +1 in social contests | Formal and proud NPCs take offence | Jokes when tense |
| Disciplined | Drills +5%; less training fatigue | −1 when things turn chaotic | Keeps the routine |
| Proud | +2 Willpower against intimidation | −2 against taunts in a duel; can't back down | Never shows weakness |
| Loyal | Bonds with companions grow faster | Can be worked through friends; betrayal cuts deeper | Stands by their people |
| Reserved | Meditation and Stealth +5% | Relationships grow more slowly | Quiet, hard to read |
| Idealistic | +2 Willpower against despair | A broken ideal can become a scar | Believes things can be better |

**Scars and experience** (filtered by date and what the character lived through)

| Trait | Good side | Bad side | Narrator note |
| --- | --- | --- | --- |
| War veteran (needs war years) | +2 Willpower against fear in battle | Nightmares: a little more fatigue; −1 under bombardment | Has seen the front |
| Massacre survivor (dated: the Sacking, Ossus, Order 66) | +1 spotting ambushes | Hatred: dark pressure around those responsible | Survived when others didn't |
| Betrayed by a friend | +2 sensing lies and deception | Trust and bonds grow more slowly | Doesn't forget |
| Lost family | +2 Willpower (resolve) | Grief: dark pressure at reminders; an attachment test for Jedi | Carries the loss |
| Former prisoner | +2 Willpower against interrogation and hardship | −1 when confined or captured again | Knows what a cell is like |
| Brush with the dark side | +2 sensing dark-side users | Dark pressure starts a little higher; teachers keep watch | Knows the pull from inside |
| Outcast or exile | +1 self-reliance when alone | The group you left is hostile | Belongs nowhere fully |
| First kill, young | Steadier in a first lethal fight | Guilt; weighs on a Jedi's alignment | Remembers the face |
| Disgraced (a public failure) | XP +5% from proving yourself | Lower starting standing | Has something to prove |
| Disaster survivor (a crash, plague, dead world) | +1 against despair; endurance in hardship | A trigger fear tied to the disaster | Lived through the worst day |

**Ties** (each a real NPC: generated, or canon where the lore allows)

| Trait | Good side | Bad side | Narrator note |
| --- | --- | --- | --- |
| Rival | XP +10% after the rival outdoes you | Works against you when they can | Always measuring against you |
| Old debt | Start money, gear or a ship | A creditor (economy debt rules) | Someone is owed |
| Contact | Information and leads in their trade | Favours owed back | Knows a person who knows |
| Protector or patron | Intercedes once in a crisis | Obligation; their enemies become yours | Someone powerful watches over you |
| Family you still see | A safe haven and support | Leverage for enemies; attachment pressure for Jedi | Home still exists |
| Ward (a sibling, an orphan) | +2 Willpower defending them | They can be threatened or taken | Someone depends on you |
| Forbidden bond (a Jedi's secret attachment) | Strong motive; Willpower when they're in danger | Heavy attachment pressure; must stay secret | A love the Order wouldn't allow |
| Outside mentor | Teacher's bonus in their field | Their reputation follows you | Taught by someone the Order didn't choose |

### Formative events: Jedi Initiate set (ages about 5–13; agreed by Jared, 25 Nov 2026)

Key: *leans* = traits suggested at the end; A = alignment nudge; S = standing with the Order. A character covering the Initiate years draws 2–4; some depend on age (the Gathering, the selection).

| # | Event | Choices and effects |
| --- | --- | --- |
| 1 | **The forbidden text.** An Archives text describes a dark-side technique (a choke). | Take it to a Master: leans Disciplined or Idealistic; S +1; A +1. Look for more in secret: leans Curious; flag "knows of the technique"; A −1. Try it on a training droid: leans Curious or Reckless; same flag; dark pressure +2; A −2. Put it back and forget it: no lean. |
| 2 | **The prank.** A friend wants to prank your instructor. | Join in: leans Witty or Loyal; bond up; if caught (a roll), S −1. Stay out: leans Cautious or Reserved. Report him: leans Disciplined; the instructor trusts you; the friend turns rival. Talk him out of it: leans Patient or Compassionate; small bond. |
| 3 | **Out after curfew.** A friend wants to sneak out at night. | Go and cause mischief: leans Reckless or Witty; bond up; if caught, S −1. Go but only explore (find somewhere hidden in the Temple): leans Curious; a backstory fact. Refuse: leans Disciplined. |
| 4 | **Lost and mocked.** A clanmate beats you sparring and gloats. | Train harder alone: leans Disciplined or Proud; the clanmate can become a Rival tie. Strike back in anger: leans Hot-headed; dark pressure +1; A −1. Ask the instructor what went wrong: leans Patient. Laugh it off: leans Witty. |
| 5 | **A friend falling behind.** A clanmate may go to the Service Corps. | Help them at your own cost: leans Compassionate or Loyal; strong bond. Focus on yourself: leans Ambitious. Tell a Master: leans Disciplined. |
| 6 | **The Gathering.** A vision in the crystal cave frightens you. | Face it and press on: leans Idealistic or Proud. Leave, then try again: leans Patient or Cautious. It shows something dark and you never tell: leans Reserved; flag "a vision kept secret". |
| 7 | **A tie from outside.** Word from your birth family (if you remember them), or a friendship the Masters warn about deepens. | Keep in touch in secret: leans Loyal; attachment pressure; points to the Forbidden bond or Family tie. Tell the Masters and let go: leans Disciplined; A +1. Ask openly what's allowed: leans Idealistic. |
| 8 | **Not yet chosen.** Nearly 13 and no Knight has taken you. | Shine at the tournament: leans Ambitious or Proud. Meditate and trust the Force: leans Patient. Approach a Knight yourself: leans Witty or Ambitious; shapes who your master becomes. |
| 9 | *Dated:* **The Sacking of Coruscant** (3,653, only if at the Temple). | Hide the younger ones: leans Compassionate or Loyal. Fight: leans Reckless or Hot-headed. Flee as ordered: leans Disciplined. All three give the Massacre survivor scar. |

### Formative events: Jedi Padawan set (ages about 13–20; agreed by Jared, 25 Nov 2026)

Same key. A character covering the Padawan years draws 3–5.

| # | Event | Choices and effects |
| --- | --- | --- |
| 1 | **Your master's flaw.** You see your master break a rule (a lie to the Council, too much force, a hidden attachment). | Confront them privately: leans Idealistic or Stubborn; the bond is tested. Report it to the Council: leans Disciplined; S +1; the bond cools. Keep their secret: leans Loyal; bond up. Copy them: leans Reckless; A −1. |
| 2 | **The pirate who surrenders.** You disarm a pirate who just killed a villager. | Take him in alive: leans Disciplined or Compassionate; A +1. Let him go: leans Compassionate. Strike him down in anger: leans Hot-headed; A −2; dark pressure +2; the First kill scar. |
| 3 | **The grateful stranger.** A local offers a rich reward. | Decline: leans Disciplined or Idealistic. Accept quietly: no temperament lean; a hidden mark under the economy's Jedi reward rule. Accept and give it to the needy: leans Compassionate; a backstory fact. |
| 4 | **Falling for someone** on a mission world, or a fellow Padawan. | End it: leans Disciplined; A +1. Keep it secret: the Forbidden bond tie; attachment pressure. Tell your master: leans Idealistic; their reaction becomes a backstory fact. |
| 5 | **The order to withdraw**, leaving villagers behind. | Obey: leans Disciplined; a backstory fact. Disobey and save them: leans Compassionate or Reckless; S −1; the bond with your master is tested. Find a third way: leans Witty or Cautious; a short roll decides how well it worked. |
| 6 | **Your mistake.** People die on a mission because of something you did. | Confess everything: leans Idealistic; S −1 now, trust later. Blame circumstances: leans Proud; A −1. Bury yourself in training: leans Disciplined or Reserved. If public: the Disgraced scar. |
| 7 | **The dark warrior.** A dark-side user beats you and offers to teach you. | Refuse and meditate it away: leans Patient; A +1. Win the rematch through anger: leans Hot-headed; dark pressure +3; the Brush with the dark side scar. Run and tell no one: leans Cautious or Reserved; flag "a dark encounter kept secret". |
| 8 | **The rival Padawan** is chosen ahead of you for an honour. | Beat them fairly next time: leans Ambitious or Proud; can become a Rival tie. Congratulate them: leans Patient or Compassionate; a friendship. Undermine them: leans Ambitious; A −2 (for the act); Rival tie. |
| 9 | **Injustice the Republic tolerates:** slavery ignored for a treaty. | Follow orders: leans Disciplined. Free them in secret: leans Idealistic or Reckless; S −1 if found out; Slave-born NPCs react well. Take it to the Council: leans Idealistic; S +1. |
| 10 | *Dated:* **Your first battle**, if the Padawan years fall in a war. | Lead from the front: leans Reckless or Proud. Protect the wounded: leans Compassionate. Hold the line as ordered: leans Disciplined. All three give the War veteran scar. |

### Formative events: Sith acolyte set (Korriban, ages about 8–18; agreed by Jared, 25 Nov 2026)

Same key; S = standing with your overseer, later your Lord. Sith start at alignment −30, so a light choice moves toward the light, and several can seed a redemption.

| # | Event | Choices and effects |
| --- | --- | --- |
| 1 | **The rival's plot.** An acolyte means to frame you for a theft. | Strike first and frame him: leans Ambitious or Cautious; A −1; S +1. Expose him to the overseer: leans Disciplined; S +1; he becomes a Rival tie. Confront him openly: leans Proud or Hot-headed; a duel (a roll). Warn him off quietly: leans Witty; he owes you. |
| 2 | **The slave who helps.** A slave sneaks you food after a punishment. | Protect them in return: leans Compassionate; A +2; a Ward tie; S −1 if seen. Ignore it: leans Reserved. Report them for favour: leans Ambitious; A −2; S +1. |
| 3 | **The tomb's whisper.** A spirit offers power during a tomb trial. | Bargain with it: leans Ambitious or Curious; dark pressure +3; flag "a spirit's bargain". Take only what you came for: leans Disciplined or Cautious. Take a relic and hide it: leans Curious or Reserved; flag "a hidden relic". |
| 4 | **Ambushed.** A rival attacks in the dark and you win. | Kill him: leans Hot-headed or Proud; A −2; the First kill scar. Spare him and own him: leans Witty or Cautious; an ally or Contact tie. Drag him before the overseer: leans Disciplined; S +1. |
| 5 | **The lesson in pain.** An overseer orders you to torture a prisoner. | Obey: leans Disciplined; A −3; S +1. Refuse: leans Idealistic or Stubborn; A +2; S −2; punished (Former prisoner or Betrayed scar, by roll). Fake it convincingly: leans Witty or Compassionate; A +1; caught on a roll. |
| 6 | **The runaway.** A fellow acolyte tries to flee. | Help them escape: leans Compassionate or Loyal; A +2; S −2 if caught. Turn them in: leans Ambitious or Disciplined; A −1; S +1. Look away: leans Reserved or Cautious. |
| 7 | **The forbidden holocron** holds a technique beyond your rank. | Hand it to the overseer: leans Disciplined; S +1. Study it in secret: leans Curious or Ambitious; flag "knows of the technique". Trade it to a Lord: leans Witty or Ambitious; a Protector or patron tie. |
| 8 | **Chosen as an apprentice.** A Lord is choosing. | Show ruthlessness: leans Hot-headed or Proud; A −1. Show cunning: leans Witty or Cautious. Show restraint and control: leans Patient or Disciplined. Shapes which Lord takes you. |
| 9 | *Dated:* **Your first battle**, if the academy years fall in a war. | Lead the charge: leans Reckless or Proud. Kill without hesitation: leans Disciplined; A −1. Save a comrade: leans Loyal; A +1. All three give the War veteran scar. |

### Formative events: military set (cadet and early service, ages about 14–20; agreed by Jared, 25 Nov 2026)

Same key; S = standing with your unit or command. Republic or Imperial academies, Carida, Prefsbelt and the like.

| # | Event | Choices and effects |
| --- | --- | --- |
| 1 | **The hazing.** Senior cadets torment a struggling recruit. | Join in: leans Proud or Ambitious; A −1. Step in and stop it: leans Compassionate or Idealistic; the recruit becomes a friend or Ward; the seniors resent you. Report it: leans Disciplined; S +1; the seniors resent you. Stay out: leans Reserved or Cautious. |
| 2 | **The stolen exam.** A squadmate has the answers. | Use them: leans Ambitious or Reckless; caught on a roll (Disgraced scar). Report it: leans Disciplined or Idealistic; S +1; the squad distrusts you. Refuse quietly and study: leans Disciplined or Proud. |
| 3 | **The unfair punishment.** The whole squad punished for one cadet's mistake. | Take the blame: leans Loyal; strong squad bond; S −1. Keep quiet and endure: leans Disciplined or Patient. Protest: leans Stubborn or Idealistic; the instructor marks you (a roll). |
| 4 | **The exercise gone wrong.** A squadmate badly hurt. | Finish the objective: leans Disciplined or Ambitious; S +1; the squadmate cools. Carry them back: leans Loyal or Compassionate; strong bond; the exercise failed. Improvise and do both: leans Witty or Reckless; a roll decides. |
| 5 | **The illegal order.** First posting: force ordered against unarmed civilians. | Obey: leans Disciplined; A −3. Refuse: leans Idealistic or Stubborn; A +2; S −2; possibly the Outcast or exile scar. Stall and find another way: leans Witty or Cautious; A +1; a roll decides. |
| 6 | **The barracks black market.** A sergeant offers you a cut. | Take it: leans Ambitious; a Contact tie; caught on a roll. Report it: leans Disciplined; S +1; enemies in the ranks. Buy but stay out of the trade: leans Witty. |
| 7 | **The friend who wants to desert.** | Help them go: leans Loyal or Compassionate; S −2 if found out. Talk them into staying: leans Patient or Loyal; bond up. Report them: leans Disciplined; S +1; they become a Rival or hate you. |
| 8 | **The patron's offer.** A highborn officer offers advancement for loyalty. | Accept: the Protector or patron tie. Decline: leans Proud or Idealistic. Accept and keep your own counsel: leans Witty or Cautious; the patron tie, which can turn later. |
| 9 | *Dated:* **Your first battle**, if service falls in a war. | Lead from the front: leans Reckless or Proud. Protect the wounded: leans Compassionate. Hold the line: leans Disciplined. All three give the War veteran scar. |

### Formative events: civilian set (childhood to about 18; agreed by Jared, 25 Nov 2026)

Same key; S = standing in your community (the street, your house, your crew). A civilian draws 3–5: mostly from their upbringing's list, plus one or two from "Anyone".

**Street kid** (underlevels, slums, Nar Shaddaa)

| # | Event | Choices and effects |
| --- | --- | --- |
| 1 | **The gang's test.** Steal from a shopkeeper who's been kind to you, and the gang takes you in. | Do it: leans Ambitious or Reckless; a Contact tie in the gang; A −1. Refuse: leans Idealistic or Stubborn; the gang makes life hard. Fake it and warn the shopkeeper: leans Witty or Compassionate; a roll decides; the shopkeeper becomes a Protector or Contact. |
| 2 | **The security sweep.** You and a friend are caught; one can run. | Take the fall: leans Loyal; the Former prisoner scar; strong bond. Run yourself: leans Cautious; the friend may resent you. Talk your way out: leans Witty; a roll decides. |
| 3 | **The hungry younger kid** on your street. | Share what you have: leans Compassionate; a Ward tie. Teach them to survive: leans Patient or Loyal; a Ward or Contact tie. Keep your food: leans Reserved or Cautious. |
| 4 | **The crime lord's errand.** A Hutt's agent pays well to carry a package. | Do it: leans Ambitious; an Old debt or Contact tie in the underworld. Refuse: leans Cautious. Open it first: leans Curious; a roll decides what you learn and who learns you looked. |

**Noble child** (great houses, Alderaan, Imperial nobility)

| # | Event | Choices and effects |
| --- | --- | --- |
| 5 | **The servant's mistake.** A servant breaks an heirloom and begs you not to tell. | Cover for them: leans Compassionate or Loyal; the servant becomes a Contact. Tell your parents: leans Disciplined; S +1. Use it as leverage: leans Witty or Ambitious; A −1; the servant owes and resents you. |
| 6 | **The arranged match** to secure an alliance. | Accept: leans Disciplined or Loyal; S +1. Defy them: leans Stubborn or Idealistic; S −2; possibly the Outcast or exile scar. Agree, then quietly undermine it: leans Witty or Cautious; a roll decides. |
| 7 | **The rival heir** insults you at court. | Answer with wit: leans Witty; a Rival tie. Challenge them to a duel: leans Proud or Hot-headed; a roll; a Rival tie. Rise above it: leans Patient or Reserved; S +1. |
| 8 | **The family secret.** Your family's wealth rests on something shameful. | Confront them: leans Idealistic; S −1; family strained. Stay silent: leans Loyal or Reserved. Use it later: leans Ambitious; flag "knows the family secret". |

**Spacer kid** (raised aboard freighters and stations)

| # | Event | Choices and effects |
| --- | --- | --- |
| 9 | **The pirate boarding.** | Hide the crew's valuables: leans Cautious or Witty. Fight: leans Reckless or Hot-headed; the First kill scar on a roll. Bargain: leans Witty; a pirate becomes a Contact. |
| 10 | **The engine failure** deep in space, the adults hurt. | Fix it yourself: leans Disciplined or Curious; a backstory fact (good with machines). Call for help on an open channel: leans Cautious; strangers may answer. Steady the crew while you work: leans Patient; strong crew bond. |
| 11 | **Port freedom.** A night alone on a wild port world. | Explore the city: leans Curious or Reckless; a backstory fact; a Contact on a roll. Stay aboard: leans Cautious or Reserved. Find work for a few credits: leans Ambitious or Witty. |

**Anyone**

| # | Event | Choices and effects |
| --- | --- | --- |
| 12 | *Dated:* **A disaster** your world lived through (plague, bombardment, invasion). | Help others escape: leans Compassionate or Loyal. Save your family first: leans Loyal; the Family you still see tie. Survive alone: leans Reserved or Cautious. All three give the Disaster survivor scar, or Lost family on a bad roll. |
| 13 | **A Force moment** (Force-sensitive outsiders): you sense danger, move an object, know a lie. | Hide it: leans Reserved or Cautious; flag "hidden gift". Tell someone you trust: leans Loyal or Idealistic; that person becomes a tie. Use it for advantage: leans Ambitious or Witty; A −1. |

**The pool is complete:** 52 events (Initiate 9, Padawan 10, Sith 9, military 9, civilian 13 with 2 shared).
