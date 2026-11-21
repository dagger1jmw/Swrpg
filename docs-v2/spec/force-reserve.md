<!-- Exported 2026-11-21 from the claude.ai doc "SWRPG M6 — Force Reserve System Spec" (https://claude.ai/artifact/LKSHzUgtMoibFVfU3oroHj, rev 56). The repo copy is the build reference; design changes go in the doc first, then re-export. Repo-only amendment since the export: §4 pain focus strain and the precognition paragraph (D-282, 2026-11-21); copy into the doc before the next re-export. -->

# SWRPG M6 — Force Reserve System Spec (draft for review)

Nov 20, 2026 · @Jared Wright

## 1. Summary

The Force system runs on two layers: a **pool** that measures how much of the Force you can comfortably channel, and **strain** that measures how tired your body and mind are from the focus it takes. The Force itself is never used up. What runs out is the user.

- **Pool** is the fuel and the comfort range. It drains with use and refills with rest and meditation. A bigger pool means the same act takes a smaller share of you.
- **Strain** barely moves while the pool is healthy. It climbs steeply once the pool drops below your comfort line, and it also rises from juggling abilities, long upkeep, pain and fear.
- **Output is never capped by tiredness.** You can always attempt your maximum. Tiredness changes what it costs, not what you can reach for.
- **Empty is not a wall.** At zero pool you can keep drawing, but each use is a Willpower contest with backlash and a rising collapse chance.
- **The AI narrates, the engine does the math.** The AI outputs a structured line and receives tier labels, never raw numbers.

All numbers below are starting defaults for config. They are there to make the shape concrete and will be tuned against the duel tables and lifetime profiles.

| Decision | Status |
| --- | --- |
| Pool plus strain, two layers | Agreed |
| Potential sets starting pool, pool ceiling and growth speed | Agreed |
| Free uses at mastery for uncontested basics | Agreed |
| No output cap from tiredness, cost rises exponentially instead | Agreed |
| Curves capped | Agreed |
| Drawing continues past empty as a Willpower contest | Agreed |
| Meditation refills pool, sleep clears strain | Agreed |
| High strain slows pool refill | Agreed |
| Huge feats leave strain into the next day | Agreed |
| Anger as dark-side fuel, nexus sites, tier labels, conditioning decay | Agreed |
| Scale classes, doubt and fear costs, outside power sources, Force-only duels | Agreed |
| Job of each Force stat (section 2) | Agreed |
| Alignment model (its own spec, next) | Open |

## 2. Core values

These values describe a Force user. Potential is natural. Everything else is earned on top of it.

| Value | What it is | What sets it | How it changes |
| --- | --- | --- | --- |
| Potential | Midi-chlorian strength, rated 1 to 100 | Birth | Only rare story events (Sith alchemy, a nexus, a ritual) |
| Pool ceiling | The largest pool this person could ever have | 500 × (midi-chlorian count ÷ 10,000)^1.5 (section 11) | Follows Potential |
| Pool max | Current depth of connection, in pool points | Starts at 30% of the ceiling | Grows toward the ceiling through meditation, study and hard use |
| Pool current | Fuel left right now, 0 to pool max | Use and recovery | Drains with draws, refills with rest |
| Efficiency | How cheaply you perform one ability | Ability level and Force Control | Grows with the ability's XP |
| Conditioning | How used you are to heavy drawing, 0 to 100 | Real combat and sustained use | Rises with use, fades slowly without it |
| Strain | Tiredness of body and mind from focus, 0 to 1.0 and beyond | Draws and focus load | Clears with sleep and rest |

**Potential does three jobs.** It sets the starting pool, the ceiling, and how fast the pool grows. An untrained Anakin (27,700 midi-chlorians) has a ceiling of about 2,300 and starts at 30% of it, about 690. An average Knight (10,000) has a ceiling of 500, and worked to 70% holds 350. Talent has a far higher ceiling and gets there faster. Training decides how much of it is used.

**Conditioning sets two comfort ranges:**

- **Comfort line:** the pool level below which strain starts to bite. 50% of pool max at Conditioning 0, falling to 20% at Conditioning 100.
- **Usual rate:** how much you can draw per combat round without extra strain. 2% of pool max at Conditioning 0, rising to 8% at Conditioning 100.
- **Upkeep slots:** how many abilities you can maintain at once without focus strain. 2 at Conditioning 0, plus 1 per 25 points, up to 6.

**Job of each Force stat** (agreed):

| Stat | Job |
| --- | --- |
| Force Output | Largest effect you can attempt, and raw strength of the effect |
| Force Control | Efficiency, and precision |
| Meditation | Pool refill speed, pool growth, calm under pressure |
| Force Sense | Precognition, awareness, range |
| Force Knowledge | Which abilities you can learn, and ritual or lore-gated techniques |

**Setting Potential at character creation.** The player either picks a Potential directly, or picks a path and rolls it.

- Picking a Force path (Jedi, Sith, other Force traditions) guarantees a Potential high enough for that path, rolled within its band.
- Picking a non-Force path rolls freely, so a character may turn out sensitive or not.
- Once set, Potential is visible in a menu of the character sheet, not on the main screen.

**Awakening: access before training.** Higher Potential means a larger pool from birth and more access to it untrained. But until a character is awakened, they can only reach part of their pool.

| State | Pool access | What it looks like |
| --- | --- | --- |
| Unawakened | 20% of pool max + 0.4% per point of Potential (Potential 100 reaches 60%, Potential 50 reaches 40%) | Unconscious use only: sharper reflexes and aim, instinctive piloting, flashes of danger sense, dreams that may be visions |
| Emotional surge | The full pool, once, in a moment of extreme emotion | An outburst the character does not control, often destructive. Dark-side drift if driven by rage or fear |
| Awakened | The full pool | Deliberate use. Training now grows the pool toward the ceiling |

- **Awakening happens** when formal training begins, when someone teaches the character to recognize the Force, or after an emotional surge the character later learns to repeat.
- **Unconscious uses** never need a structured line from the AI. The engine applies them passively: a reflex and aim bonus scaled by Potential, and occasional danger-sense or vision prompts.
- **Lore anchors:** young Anakin's podracing reflexes and his dream of being a Jedi, Luke's womp rat shooting and natural piloting, and children in the Clone Wars era moving objects. Surges: Palpatine killing his family and Bane killing his father before formal training. These go on the lore-check list.

## 3. Draw: what a use costs the pool

Draw is the pool points one use takes. It depends on how hard the ability is, how big the effect is, how hard you push, your state of mind, and your efficiency.

**Rounds (look-over fix, 2026-11-21).** One combat round is one M5 exchange, about 5 to 10 seconds. Every "per round" cost in this spec and in the catalog spec uses that unit.

```latex
\text{draw} = \frac{\text{base cost} \times \text{scale} \times \text{effort} \times \text{state}}{\text{efficiency}}
```

| Factor | Default values |
| --- | --- |
| Base cost | 10 x the ability's difficulty tier (Basic 1.0, Moderate 1.5, Complex 2.5, Advanced 4.0) |
| Effort | Light 0.5, normal 1.0, strong 1.5, all-out 2.0 |
| State | Calm and confident 0.85, neutral 1.0, doubt or fear up to 1.5 |
| Tired focus | State is multiplied by 1 + 0.5 x strain, capped at 1.5 |
| Efficiency | 1 + ability level / 50 + Force Control / 100 |

**Scale classes.** Size costs more, but on a gentle curve that mastery flattens, so "size matters not" holds for a Master.

| Class | Example | Scale factor | Pool max needed to attempt |
| --- | --- | --- | --- |
| 0 | Hand-held object | 1.0 | None |
| 1 | A person | 1.5 | None |
| 2 | Speeder, boulder | 2.25 | None |
| 3 | Starfighter | 3.4 | 150 |
| 4 | Freighter, building | 5.0 | 300 |
| 5 | Capital ship | 7.6 | 600 |
| 6 | Celestial (a storm, a black hole) | 11.4 | 900 |

- **Mastery relief:** the part of the scale factor above 1.0 shrinks by 0.6% per ability level, up to 60% at level 100.
- **Feat gates:** the last column is a hard requirement, however rested you are. Class 6 is out of reach without an immense connection.
- **Sustained abilities** (Valor, barrier, precognition) draw per combat round, or per minute outside combat.

**Free uses.** A use draws nothing and adds no strain when all of these hold:

1. The ability is Basic or Moderate tier.
2. Ability level is at or above the free threshold (40 for Basic, 60 for Moderate).
3. Effort is light or normal, and scale class is 0 or 1.
4. Nothing is contesting it. A guarded mind, a resisting target or a countering Force user always costs.

**Worked example, a normal Push on a person:**

| Character | Level, Control | Efficiency | Draw | Pool max | Share of pool |
| --- | --- | --- | --- | --- | --- |
| Padawan | 20, 20 | 1.6 | 9.0 | 150 | 6.0% |
| Knight | 50, 50 | 2.5 | 5.4 | 350 | 1.5% |
| Master | 90, 80 | 3.6 | 3.4 | 600 | 0.6% |

The same Push costs the Padawan ten times the share it costs the Master. Uncontested, the Knight and Master would pay nothing at all.

## 4. Strain: how hard the drawing feels

Strain from a draw is the share of your pool it took, multiplied by how deep into your reserves you are and how far above your usual rate you are drawing.

```latex
\text{strain gained} = \frac{\text{draw}}{\text{pool max}} \times \min(8,\ \text{depth} \times \text{rate}) + \text{focus strain}
```

**Depth multiplier.** It reads the pool level at the moment of the draw.

- At or above the comfort line: 0.25. Drawing inside your comfort range barely registers.
- Below the line: 0.25 x 32^d, where d runs from 0 at the comfort line to 1 at empty. It is continuous at the line and reaches 8 at empty.

**Rate multiplier.** It compares everything drawn this round with your usual rate.

- At or below the usual rate: 1.
- Above it: 2^(ratio - 1), capped at 4. A burst at twice your usual rate doubles the strain. A big single attack always costs something extra, which is the point.

**Combined cap:** depth x rate never exceeds 8, so long fights stay tunable.

**Worked example.** One attack that draws 10% of pool max, comfort line at 40%, usual rate 5% (so rate x2):

| Pool when used | Depth | Strain gained | How it reads |
| --- | --- | --- | --- |
| 90% | 0.25 | 0.05 | Taxing but fine |
| 40% | 0.25 | 0.05 | Still inside comfort |
| 25% | 0.92 | 0.18 | Starting to hurt |
| 11% | 3.1 | 0.62 | Pouring everything into it |
| 0% | 8 (capped) | 0.80 | Running on will |

**How the two bars move in a steady duel** (upkeep only, at the usual rate):

| Pool | Strain at the end of the stretch |
| --- | --- |
| 100% to 70% | About 0.08 |
| 70% to 40% | About 0.15, near 0.2 with focus strain |
| 40% to 10% | About 0.5 |
| 10% to 0% | About 1.0 and past it |

The bars drift apart early and converge late. A fighter who reaches empty arrives at roughly full strain, which is where the Willpower zone starts.

**Focus strain: sources that do not come from the pool.**

| Source | Default |
| --- | --- |
| Juggling | +0.01 per round for each maintained ability beyond your upkeep slots |
| Duration | +0.001 per round per maintained ability, even inside comfort |
| Pain | Once per new wound taken while holding any sustained ability: moderate +0.05, severe +0.15, critical or mortal +0.30 (tunable). A wound already carried adds nothing per round (D-282, amended 2026-11-21) |
| Fear and doubt | +0.01 per round under emotional pressure, reduced or removed by Meditation and Jedi calm |

**Precognition (D-282, 2026-11-21).** Precognitive defense is a sustained draw every exchange while held: base 5 (the catalog's Complex sustained cost) × state ÷ efficiency. Its trigger chance is unchanged (D-244: min(0.5, Force Sense / 200), +0.10 centered). The senses go dark at the running-on-will tier (section 5). Measured in `docs-v2/testing/precog-m6-trial-2.md`.

**What strain does.** It does not cap output. It raises draw costs through the tired-focus factor in section 3, slows pool refill (section 6), and past 1.0 it triggers backlash and collapse (section 5). The M5 sequence-cap reduction for a meter above 1.0 stays as built.

## 5. Past empty: the Willpower zone

Drawing never stops at zero pool. The Force is still there. What is gone is everything you can draw on comfortably, so each further use is a contest of will.

**Overdraw.** A use that needs more pool than you have left takes the pool to 0, and the unmet part is overdraw. Any use at 0 pool is all overdraw.

**Each overdraw use needs a Willpower check.**

| Rule | Default |
| --- | --- |
| Target | A base difficulty, +1 step for each overdraw use this scene, +1 step per 0.1 strain above 1.0 |
| Success | Full effect at full output. Strain is gained at the capped x8 rate |
| Failure | The draw fizzles. Half the strain is still gained, and backlash lands |

**Backlash and collapse** (extends what M5 built):

- **Backlash:** every point of strain above 1.0 spills into mental fatigue, as built.
- **Collapse:** each use above 1.0 strain carries a collapse chance. It starts at the built 5% and rises 5 points with each further use, capped at 50%. Collapse means Incapacitated for 1 to 3 hours, as built.
- **Physical toll:** backlash from overdraw also costs Vitality, scaled by the age penalty. A fighter in their prime shrugs off the first few. An old one pays quickly. This is Dooku on the *Invisible Hand*.

**Anger as fuel.** A user willing to draw on the dark side can burn anger instead of willpower.

- The Willpower check is replaced by an automatic success, at an alignment cost per use.
- The backlash threshold moves from 1.0 to 1.3 while anger is channeled, matching the M5 anger limit.
- It is easier than willpower every single time, which is the temptation.

**Force Body** is the formal technique for this zone: it holds physical fatigue back as a debt that lands all at once when it ends. Its logged M6 design stays as written, and it uses the same Vitality toll.

To confirm against the as-built M5 code: whether 1.3 is currently a hard ceiling on the meter or the point where backlash starts under anger.

**Exhaustion effects** (agreed 2026-11-20, from Wookieepedia's [Personal Force reservoir](https://starwars.fandom.com/wiki/Personal_Force_reservoir) page):

| Effect | Trigger | Rule | Lore basis |
| --- | --- | --- | --- |
| Senses go dark | The "running on will" tier | Passive senses switch off: danger sense, precognitive defense, ambient Force awareness. They return after a centering moment in a lull, or once strain drops back below 1.0 | Dooku's Force exhaustion on the *Invisible Hand* shut down his natural Force senses until a moment of introspection |
| No self-refresh | Pool below 15% | Using the Force to refresh or heal yourself stops working until you rest or meditate | Corran Horn had burned off most of his reservoir and could not use the Force to refresh himself |
| Thin-stretched | A huge sustained ability (class 4+ or Battle Meditation) held past empty | A short helpless stun after it ends: no actions for 1 to 3 rounds, then the usual deep strain | Darth Caedus overused battle meditation at Fondor and could not move or think clearly for a while |
| Oneness | Story event only | A brief surge past your pool ceiling and maximum output. Afterwards, heavy but temporary exhaustion: the pool drops to empty, strain goes past 1.0, and deep strain lingers into the next day. No permanent damage | Luke Skywalker and Jacen Solo reached it |

On Oneness: the Personal Force reservoir page says the state damages the body. The "no permanent damage" rule is a design decision, made because Luke and Jacen show no lasting harm.

## 6. Recovery

The two bars recover in different ways: meditation mainly refills the pool, and sleep mainly clears strain. That keeps them distinct and makes both worth doing.

| Activity | Pool refilled per hour | Strain cleared per hour |
| --- | --- | --- |
| Meditation | 25% of pool max, scaled by the Meditation stat | 0.05 |
| Sleep | 8% | 0.12 |
| Quiet rest | 5% | 0.04 |
| Normal activity | 2% | 0 |

- **A full night** (8 hours of sleep) clears about 1.0 strain and refills roughly two thirds of the pool. An hour of meditation on top brings the pool back to full.
- **Tired refill:** pool refill is multiplied by 1 - 0.5 x strain, with a floor of 0.35. After a hard fight you refill slowly until you have slept.
- **Centering in a lull:** a short meditation during a break in a fight restores 3% to 8% of pool max by Meditation stat, clears no strain, and needs a round where you are not being attacked. Once per lull.

**Deep strain from huge feats.** A single draw above half your pool max, or any class 4+ feat, turns 30% of the strain it caused into deep strain.

- Deep strain sits under the normal meter as a floor. Ordinary strain cannot drop below it.
- Sleep alone clears half of it per night. A night's sleep plus a proper meditation session clears all of it.
- The result: you still feel a huge feat the next day, and proper rest and meditation take care of it. It is not a multi-day injury.

**Alignment touches recovery** (details in section 8): calm, light-aligned users meditate more effectively. Heavy dark-side users recover less from meditation and more from feeding their anger.

## 7. Growth

Pool max grows toward the ceiling Potential sets, fast at first and slower as it gets close. Natural talent has the highest ceiling and the fastest growth, but anyone can work their pool close to their own ceiling.

```latex
\text{pool gain} = \text{activity value} \times \frac{\text{Potential}}{50} \times \left(1 - \frac{\text{pool max}}{\text{ceiling}}\right)
```

| Source of pool growth | Notes |
| --- | --- |
| Deep meditation | The main source. Scaled by the Meditation stat |
| Study of the Force | Smaller, steady. Scaled by Force Knowledge. Holocrons and teachers count here |
| Training near your limits | A session that ends below the comfort line without a collapse. Good gains |
| Overreach training | Deliberately entering the Willpower zone. The largest gains, with real backlash and injury risk |
| Major real feats | A one-time bump for a first class 4+ feat or a survived overdraw in real danger |

**Conditioning** rises from real use, not drills alone:

- Rounds of real combat spent drawing above your usual rate.
- Rounds spent maintaining more abilities than your upkeep slots.
- Sparring counts at a reduced share. Solo drills count for little.
- It fades by about 1 point per month without heavy use, down to a floor of half its peak.

**Efficiency** needs nothing new. It comes from ability levels and Force Control, which already grow through the XP system.

**How three characters come out of this:**

| Character type | Potential | Pool | Efficiency | Conditioning |
| --- | --- | --- | --- | --- |
| Raw prodigy (young Anakin) | Very high | Large from the start, fast growth | Low | Low |
| Disciplined Knight (Obi-Wan) | Solid | Worked close to its ceiling | Very high in a few abilities | Moderate |
| Force-dominant Sith Lord | High | Large, plus outside sources | High in signature powers | Very high |

**Cybernetic replacement lowers the pool ceiling (agreed 2026-11-20).** Replacing living body with machine dulls the connection: you feel the Force less. Efficiency and skill are untouched, which is why Vader still uses the Force freely in combat.

| Replacement | Ceiling loss |
| --- | --- |
| Hand or minor part | 5%, plus 15 points |
| Major limb (arm or leg) | 10%, plus 15 points |
| Extensive life support (burns, artificial lungs) | 20%, plus 15 points |

- **Pool max** is capped at the new ceiling. Potential itself does not change.
- **Percentage plus flat** is deliberate. A huge connection shrugs off most of the loss in practice. For an average Jedi, the same loss can drop them below feat gates and comfort levels, so it is a major blow.
- **Calibration:** Vader lost four limbs and needed full life support: 4 × 10% + 20% = 60% off his ceiling, plus 5 × 15 = 75 points (the flat cut stacks per replacement too, clarified 2026-11-21). That takes Anakin's intended 2× Palpatine down to about 0.8×, matching Lucas's 2005 statement. Luke's lost hand (5%) leaves him able to reach Anakin's intended level.
- **Source of the event:** amputations and replacements come from the injury and health system. The loss applies when the cybernetic is fitted.

This supersedes the earlier architecture §15 note (about 2% for a hand and 5% per limb, as a learning multiplier). The 5/10/20% loss plus 15 points off the ceiling above is the rule (look-over fix, 2026-11-21).

**Learning abilities.** Each ability in the catalog gets a learning class that sets how it can be acquired.

| Class | How it is learned | Examples |
| --- | --- | --- |
| Manifestation | Discoverable through use. Raw expressions of the Force come easily, especially at high Potential | Telekinesis, reflex and body enhancement, Force sense, Push, Valor |
| Taught, can manifest | Normally learned from a teacher, holocron or text. Can also manifest on its own in a moment of real need, through a check scaled by Potential, relevant stats and stakes | Electric Judgment (Plo Koon developed it to save someone, as far as known), healing, Battle Meditation |
| Ritual and lore-locked | Holocron, text or artifact only, unless its creator is alive in the chosen era and can teach it | Sith alchemy, Essence Transfer, Thought Bomb |

- A manifested ability starts at a low level and grows like any other.
- Era availability (common, rare, lost, forbidden) from the catalog still applies on top of the learning class.
- Plo Koon and Electric Judgment go on the lore-check list.

## 8. Dark side, light side and outside power

The reserve system gives each side a different way to pay for power. The alignment model itself (one scale or two scores) is still open and gets its own spec. This section only fixes the hooks the reserve system needs.

|  | Dark side | Light side |
| --- | --- | --- |
| In the Willpower zone | Burn anger for an automatic success, at an alignment cost | Willpower check only |
| Backlash threshold | 1.3 while channeling anger | 1.0 |
| Draw costs | Cheaper offensive dark abilities while angry | State factor 0.85 while calm and confident |
| Fear and doubt strain | Feeds anger instead of adding strain | Reduced or removed by serenity |
| Recovery | Weaker meditation refill at high dark scores | Stronger meditation refill |
| Calm abilities (healing, Battle Meditation) | Cost more as the dark score rises | Normal |
| Long-term price | Corruption builds into physical decay | Slow to build, needs discipline |

**Dark surge (agreed 2026-11-20, revised 2026-11-21).** The dark side gives a real surge of power when someone lets go and uses hatred and anger to fuel the fight, at any time, not only when exhausted. It is the rush of crossing over: quick, strong, unstable and corrupting. Someone who already lives in the dark side has nothing left to let go of, so the surge fades as Dark rises and is gone once they have fallen; for them the power is already in their numbers. This is how a turning Jedi can briefly overpower a stronger enemy.

| Rule | Default |
| --- | --- |
| Who can use it | Any Force user who chooses to open to the dark side. No minimum Dark score: even Yoda felt it |
| Output and efficiency | Maximum output and efficiency rise by how hard the user lets go: +15% for a flicker of anger, +25% for tapping into anger and hatred (Luke against Vader at Endor, who then stopped himself), +35% for full surrender (Knightfall Anakin; the dark self Yoda saw in his vision in Dark Rendezvous) |
| Fading with Dark | Full strength at Dark 0, falling in a straight line to zero at the fall (Dark 50+ and higher than Light, alignment spec section 6). It fades by Dark, not immersion, because a controlled Sith like Dooku has high Dark but low immersion (revised 2026-11-21). Embraced dark users (Dooku, Sidious, Vader) don't surge: their power is their baseline. A player who falls turns the surge into real growth through the dark-side growth bonuses (M6/M7), not a standing multiplier |
| NPCs | Established dark-side NPCs never surge; canon levels and generated Sith already include their dark power. A Jedi or gray NPC surges only when the story has them give in (AI-proposed, code-validated). Ordinary Jedi-versus-Sith duels are unchanged; re-measure only the turning case |
| Cost each round | +1 Dark and +2 immersion per round held (halved while Gray), on top of normal dark-tagged costs |
| Instability | Ending it takes a Willpower check that gets harder each round it was held. A failure keeps it running another round. Letting go is hard, which is the point |
| What it locks out | Calm and precise light-side work (healing others, Battle Meditation, Force Light, Force Harmony) cannot be used while surging |
| Stacking | Works with anger fuel in the Willpower zone. Counts as channeling the dark side, so the Sith eyes rules apply |

**The light side's answer** is not a surge. It is better efficiency, recovery and endurance over time. The light side's greatest feats come from very high Potential plus serenity: Oneness, Force Harmony and the Skywalker line. The engine should make the strongest light-side feats possible, but only for characters with exceptional Potential and deep training, while the dark side offers big power to anyone willing to pay for it.

**Outside power sources.** These are how the strongest Sith in Legends went past any natural pool. Each grants borrowed pool on top of pool max. All are rare, lore-gated, and scheduled for M6 or M7 as options.

| Source | Legends example | What it gives | What it costs |
| --- | --- | --- | --- |
| Life drain | Vitiate and Nathema | A large one-time or ongoing borrowed pool | Heavy alignment and corruption cost. Victims and places are destroyed |
| Bound spirits | Darth Nox | Borrowed pool per bound spirit | Corruption and an instability risk that grows with each spirit |
| Artifacts and rituals | Sith amulets, alchemy | A fixed bonus while worn or active | Alignment cost, decay, and the item can be lost |

- Borrowed pool drains first and does not count toward the comfort line, so it extends a fight without raising strain.
- Corruption drives the bodily decay seen in the most powerful Sith. It should be a tracked value, not flavor.
- A counterpart to outside power: the Force meld, which links allied Force users so they draw strength from each other. Rules below.

**Force meld.** In Legends it is a refinement of Battle Meditation that joins the minds of allied Force-sensitives so they act as one and draw strength from each other. Battle Meditation sways everyone on a battlefield, sensitive or not. The meld only links and strengthens the Force users on your side, which is why it is easier to learn. It is rare and dangerous.

| Rule | Default | Lore basis |
| --- | --- | --- |
| Anchor | One participant holds the meld. Anchoring needs high Meditation and pool max, and a large meld needs a master | Kenobi's warning that a single-entity meld takes a master of great power and depth |
| Shared pool | Members draw from a common pool. Each pays in up to their own comfort range, so strain spreads across the group | Members draw strength from each other |
| Coordination | Bonus to coordinated attacks and defense for every member, scaling with meld size and cohesion | The Myrkr strike team, Twin Suns Squadron |
| Upkeep | The anchor pays a sustained draw and uses upkeep slots. Each member pays a small focus strain per round | Design default |
| Cohesion | Members with divided goals or clashing alignment lower cohesion. At low cohesion the bonuses turn into penalties | A divided meld becomes a liability |
| Shared pain | A member's wound or death, or a great disturbance, lands on every member as strain. Pain from minds the meld is touching can stun members | Pain received through enhanced senses |
| Dark-side drift | In a light-majority meld, one member's dark-side shift is slowed while melded | The majority can stop one member slipping |
| Identity blur | Long or frequent melds build a merge value. At high merge, members risk losing individual will, as a story event | Finishing each other's thoughts; the Dark Nest Crisis |
| Era | Known to the ancient Jedi but rare. Redeveloped in the New Jedi Order era | Awdrysta Pina at Columus, Jorus C'baoth, Anakin Solo |

The meld is not limited to the light side: the Dark Nest Crisis grew partly out of its drawbacks. The light-majority effect only applies to light-aligned melds.

Source: [Force-meld, Wookieepedia (Legends)](https://starwars.fandom.com/wiki/Force-meld/Legends), as pasted in the review comments.

**Deferred (look-over fix, 2026-11-21):** Force meld and Battle Meditation wait for the ally system. Allies have been story-only since M5, so neither is built until allies exist in the engine.

**Already logged for M6 and unchanged:** Force Valor (pool draw for physical stats), Battlemind (pool draw for endurance, synergy with Vaapad and Juyo), Force Body (the only way past the fatigue cap, with a deferred crash), and Endure. Their costs now read as draw per round.

## 9. Places

Locations modify draw costs and recovery through a small set of site types. This is data only: each location in the lore database gets a site type and a strength from 1 to 3, and the engine applies the modifiers.

| Site type | Examples | Effect at strength 1 (scales with strength) |
| --- | --- | --- |
| Dark nexus | Korriban, Dromund Kaas, Malachor V | Dark abilities draw 10% less. Anger refills pool. Light meditation refill 15% lower. Fear strain for the unprepared |
| Light nexus | Tython, Ilum, the Jedi Temple | Meditation refill 15% higher. Pool growth from meditation 10% higher |
| Living Force site | Dagobah, deep wilderness worlds | Sense abilities draw less. Meditation refill slightly higher for either side |
| Force void | Ysalamiri bubble (Myrkr) | No drawing at all inside it. The pool is untouched, only unreachable |
| Wound in the Force | Nathema | Drawing costs far more and meditation barely refills. Deeply disorienting |

- Every site entry cites its lore section, with era tags where a site changes over time.
- The AI is told the site type and strength as a label, so it can narrate the place without numbers.

## 10. Combat and Force-dominant builds

A duel carried entirely by the Force must be possible for a character built for it, and must still have counters so sabers stay relevant.

**What a Force-dominant build needs** (Nox, Vitiate, Palpatine, or a telekinesis-heavy Jedi):

| Piece | Why |
| --- | --- |
| High Potential and a large pool | Each attack takes a small share |
| Very high Conditioning | A constant barrage sits inside the usual rate, so the rate multiplier stays at 1 |
| High efficiency in a few signature powers | Lowers draw where it matters |
| Anger fuel or outside sources | A way to keep going past the pool |

Most Jedi and Sith will not qualify, which is intended. A Knight who tries it burns through the comfort range in a few rounds.

**Engine requirements:**

1. Force actions resolve as full attacks that can win a fight alone, not as add-ons to a saber exchange.
2. Counters exist and cost the defender: blocking lightning with a saber, Tutaminis absorption, Force barriers, Willpower resistance to mental and grip attacks.
3. Damage or a won contest can break a maintained ability, forcing a re-draw.
4. Precognitive defense becomes a sustained draw per round instead of a load per trigger.
5. Combat code keeps calling the `forceMeter` interface. Nothing in combat computes draw or strain itself.

**Scenarios the system must reproduce.** These become harness tests:

| Scenario | Expected result |
| --- | --- |
| Padawan and Master use the same Push | The Padawan pays roughly ten times the share of pool |
| Aging master against a prodigy in his prime (Dooku and Anakin) | The older fighter hits the comfort line and the Vitality toll first, while the younger is still fresh |
| Knight holding Valor and a barrier for a full duel | Strain stays under about 0.2 until the pool nears the comfort line |
| The same big attack early and late in a fight | Late costs several times the strain |
| Force-dominant Sith Lord against a saber duelist | A Force-only win is possible, and the duelist's counters can also win |
| Force-dominant build attempted by an average Knight | Runs dry within a few rounds |
| Yoda-class master lifts a starfighter, a doubting student fails to | Mastery relief and the state factor explain the gap |

**Power calibration anchors** (proposed 2026-11-20, from Lucas's 2005 interviews and *Yoda: Dark Rendezvous*). "Effective power" means what a character can bring to bear: pool, efficiency, conditioning and outside sources together.

| Profile | Target relative to Palpatine at his peak |
| --- | --- |
| Anakin, fully trained and uninjured | About 2× |
| Vader after Mustafar | About 0.8× |
| Luke at his peak | Able to reach Anakin's intended level |
| Yoda opening himself to the dark side | Briefly enough to overpower Palpatine. Used as a check on how strong a dark-side surge feels |

## 11. NPC Potential values

Canon characters get Potential from the lore docs first. Where the docs are silent, the value is estimated against characters whose standing is known, and the estimate is flagged.

**Process:**

1. Claude Code searches `Docs/lore/` for any stated midi-chlorian count or direct statement of raw Force strength for each roster NPC.
2. Found: the value is set from it and cites the lore section.
3. Not found: the NPC goes into a questions file with a proposed band and the reasoning (feats, reputation, comparisons to anchored characters).
4. You approve or adjust the flagged values before they enter the roster.

**Proposed bands** (estimates to tune, not lore):

| Midi-chlorian count | Potential | Meaning | Examples |
| --- | --- | --- | --- |
| Under 2,500 | 1 to 10 | Barely sensitive | Most beings |
| 2,500 to 7,000 | 11 to 39 | Sensitive, below the Jedi minimum | Service Corps range, minor adepts |
| 7,000 | 40 | Jedi minimum |  |
| 10,000 | 50 | Average Jedi | Most Knights and Lords |
| 13,000 | 65 | Strong Master | Council-level talent |
| 17,300 | 85 | Generational | Palpatine |
| 19,000 to 19,500 | about 90 | Generational | Yoda |
| 27,700 | 100 | Once in an age | Anakin, Luke, Leia |

Potential is read off this table, straight-line between the anchor rows. The engine stores the count. Potential is the 1 to 100 label used for awakening, growth speed and the UI.

- The top anchor is Anakin, with a count stated as over 20,000, the highest known. Yoda sits below him but above Palpatine, at 19,000 to 19,500 (about Potential 90). Qui-Gon says not even Yoda's count is that high, and in Yoda: Dark Rendezvous Yoda senses he could overpower Palpatine. Luke and Leia share Anakin's Potential (proposed 100), so their differences come from training, not talent. Basis: George Lucas in 2005 (the Rolling Stone and Vanity Fair interviews, and the Return of the Jedi DVD commentary). He said Anakin was meant to surpass the Emperor and that Luke could become what Anakin was supposed to be. Books and other media imply Leia shares it. These are interview statements gathered from secondary sources, not quotes we have checked. Every other placement needs a lore check.
- Potential is not power. A Potential 55 Master with a worked pool, high efficiency and high conditioning beats a Potential 85 novice.
- Already noted under section 15 of the M5 log: Kolar, Tiin, Fisto and Windu get canon levels, not pace estimates, when the Clone Wars roster is added. Their Potential goes through the same process.

**Midi-chlorian counts (curve agreed 2026-11-20).** Legends gives Anakin "over 20,000". A 2016 canon reference book gives exact counts, and they are used only where they agree with Lucas and Legends. They are design anchors, not lore.

- **Taken from the book:** Anakin 27,700; the Jedi minimum of 7,000; the average Jedi at 10,000.
- **Rejected from the book:** Palpatine 20,500, Yoda 17,700 and Luke 14,500. These contradict Lucas's 2005 statements (Anakin's potential twice Palpatine's, and Luke able to become what Anakin could not) and *Yoda: Dark Rendezvous*.
- **Set by design:** Palpatine at about 17,300, Yoda at 19,000 to 19,500, Luke and Leia at 27,700.
- **Why the ceiling uses the count to the power 1.5:** a straight-line ceiling would make Anakin only 1.6× Palpatine. The curve makes connection matter more at the top end, and matches Lucas. Chosen because the published counts contradict Lucas's statements, and his statements are the closest thing to real measurements.

**Exception to the Legends-only rule (logged 2026-11-21):** the midi-chlorian numbers taken from the 2016 canon book (Anakin's 27,700) are used as design anchors for the curve only, because Legends gives no exact counts. They set numbers, not lore.

| Character | Count | Pool ceiling |
| --- | --- | --- |
| Jedi minimum | 7,000 | about 290 |
| Average Jedi | 10,000 | 500 |
| Strong Master | 13,000 | about 740 |
| Palpatine | 17,300 | about 1,140 |
| Yoda | 19,250 | about 1,340 |
| Anakin, Luke, Leia | 27,700 | about 2,300 |

Checks: Anakin's ceiling is 2.03× Palpatine's. Vader, after the 60% cybernetic loss in section 7, sits at about 0.76×, close to Lucas's 80%. Yoda's ceiling is above Palpatine's, as *Dark Rendezvous* implies. Only the strongest clear the celestial feat gate of 900.

- **In-world readings:** a blood test reports the count with a few percent of noise. Sense Force Potential describes the band in words unless the user is very skilled.

## 12. AI narration rules

The AI receives one tier label for the character's Force state and never sees pool or strain numbers. The engine picks the worse of the two conditions.

| Label | Pool | Strain | Narration cue |
| --- | --- | --- | --- |
| Fresh | Above 70% | Under 0.15 | The Force comes easily |
| Taxed | Above the comfort line | Under 0.4 | Working, focused, in control |
| Strained | Below the comfort line | 0.4 to 0.75 | Effort shows. Each act takes concentration |
| Exhausted | Under 10% | 0.75 to 1.0 | The connection is hard to hold. Body and mind are failing |
| Running on will | Empty | Above 1.0 | Every act is forced through by will or rage |

**Prompt rules:**

1. The AI never changes Force state. It proposes one structured event per use (for example: Force Push at all-out effort, or Force Barrier at normal effort, sustained), and the engine does all the math. The event schema is decided during integration (look-over fix, 2026-11-21: these were written as text lines like FORCE\_USE before).
2. Force state is injected as READ ONLY labels, the same pattern as the XP state.
3. The AI never says a character is "out of Force" or has "no Force left". The Force is always there. It narrates the connection slipping, focus fraying, or the cost of holding on.
4. A failed Willpower check is narrated as the effort failing or the focus breaking, not as an empty tank.
5. Free uses still get the structured line. The engine decides they cost nothing.
6. Site labels (section 9) and anger channeling are passed the same way, as labels.

**Player UI:** two bars on the character panel, pool and strain, with the comfort line marked on the pool bar and deep strain shown as a shaded floor on the strain bar. Layout is iPad-first.

## 13. Implementation notes

The M5 strain meter and the `forceMeter` interface stay. Pool, conditioning and the multipliers go behind that interface, so combat code does not change. File names below follow what was requested in M5 and should be checked against the as-built code.

**New character state:**

| Field | Type | Notes |
| --- | --- | --- |
| `potential` | 1 to 100 | Fixed at character creation |
| `poolMax` | Number | Starts at 30% of the ceiling |
| `poolCurrent` | Number | 0 to `poolMax` |
| `borrowedPool` | Number | From outside sources. Drains first |
| `conditioning` | 0 to 100 | With a stored peak for the decay floor |
| `strain` | Number | The existing meter |
| `deepStrain` | Number | Floor under `strain` |
| `overdrawUsesThisScene` | Integer | Resets when the scene ends |

**Interface additions** (same module, same callers): draw for an ability use, strain for a draw, the free-use check, the feat gate check, the overdraw Willpower check, recovery per activity, pool growth, conditioning gain and decay, and the tier label.

**Config:** every number in this spec lives in one Force config file: pool per Potential, starting share, comfort line range, usual rate range, upkeep slots, depth base and floor, rate base and cap, combined cap, focus strain values, free thresholds, scale factors and gates, mastery relief, state factors, recovery rates, deep strain share, collapse ramp, growth values, site modifiers.

**Build order:**

1. Read-only report on the as-built meter (limit, load formula, recovery, backlash, collapse, anger limit) so this spec is reconciled with the code before anything changes.
2. State, config and save migration. Save migrations stay standard: every changed slice ships one, as in earlier milestones (look-over fix, 2026-11-21; the old "no save migration" line is removed).
3. Draw, strain, free uses and feat gates behind `forceMeter`.
4. Willpower zone, backlash ramp, Vitality toll.
5. Recovery, deep strain, growth, conditioning.
6. Tier labels, prompt rules, two-bar UI.
7. Harness scenarios from section 10, then re-measure.

**Re-measure after the change:** the duel tables, precognitive defense, and the lifetime profiles, using the dependency list from the M5 close-out. The Sidious-like profile is re-run as the check on "most powerful Force user of his era", this time with Force use in its trials.

**Out of scope for this spec:** the alignment model, the full ability catalog with per-ability costs, the Sith Order schedule, and the form-system items logged from the Sidious report (secondary-form growth, free form switch, cleave). Each gets its own M6 or M7 spec.

Commit before starting, one fresh Claude Code session per build step, and log every default in this spec as a decision.

## 14. Open questions

These are the places where the spec goes beyond what was agreed, or where a number or lore point still needs your call.

**Additions confirmed on 2026-11-20 (all agreed):**

- The job of each Force stat (section 2). Is Output for effect size, Control for efficiency, Meditation for recovery, Sense for precognition, Knowledge for learning the right split?
- Upkeep slots tied to Conditioning (2 to 6).
- Rate multiplier applies to single big attacks, so a large strike always costs extra strain even when fresh.
- Collapse chance ramps from 5% to a 50% cap, instead of the flat 5% built in M5.
- Vitality toll from overdraw, scaled by age.
- Precognitive defense changes from a load per trigger to a sustained draw per round.
- Dark side details in section 8: fear feeding anger instead of adding strain, cheaper offensive dark abilities while angry, weaker meditation at high dark scores.
- Force meld rules in section 8, drafted from the Legends entry. The defaults need your review.
- Overreach training as the fastest and riskiest way to grow the pool.

**Decisions made on 2026-11-20:**

- Alignment gets its own spec, worked out next.
- Age does not shrink the pool. High Potential means a large pool from childhood, gated by awakening instead (section 2).
- No save migration. The rebuild starts with fresh characters, as testing already does.
- Potential is chosen at creation, or rolled after picking a path, and shown in a character sheet menu (section 2).
- Abilities have learning classes: manifestation, taught but can manifest, and ritual (section 7).

**Numbers most likely to need tuning:** starting pool share (30%), comfort line range (50% to 20%), usual rate range (2% to 8%), the depth base (32), the combined cap (8), and the free thresholds (40 and 60).

**Lore points to verify against `Docs/lore/` before they are cited in code or prompts.** I wrote these from memory and did not look them up:

- Confirmed 2026-11-20 (Personal Force reservoir page): Dooku's Force exhaustion in the *Revenge of the Sith* novelization.
- Qui-Gon meditating mid-duel against Maul as the model for centering in a lull.
- Anakin's midi-chlorian count as the top anchor, and any other stated counts. (Luke and Leia: sourced to Lucas's 2005 interviews, 2026-11-20.)
- Vitiate draining Nathema, and Darth Nox binding spirits, as the models for outside power sources.
- Site assignments in section 9, especially Nathema as a wound in the Force and Malachor V as a dark nexus.
- The awakening examples in section 2: Palpatine killing his family and Bane killing his father before formal training.
- Plo Koon developing Electric Judgment out of need, without a teacher.
