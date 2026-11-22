# Force scale check: reserve spec vs the Legends scale anchors

2026-11-21. **Report only, no changes.** Asked for in `docs-v2/lore/batches/force-catalog-revision.md`.

**What was compared:**
- **The game side:**
  - `docs-v2/spec/force-reserve.md` §3: scale classes, scale factors and feat gates (the pool max needed to attempt).
  - §11: pool ceilings by midi-chlorian count.
  - §5 and §9: past empty, thin-stretched, the meld.
  - The distance classes in `force-catalog-m6.md` §5d.
- **The lore side:** the scale-anchor tables in `SW_Force_Powers_Part1a.md` (Control, Sense, mind), `_Part2a.md` (telekinesis, mind influence, destruction) and `_Part3a.md`.

**The feat gates, for reference:**

| Class | Example | Factor | Pool max needed |
|---|---|---|---|
| 3 | Starfighter | 3.4 | 150 |
| 4 | Freighter, building | 5.0 | 300 |
| 5 | Capital ship | 7.6 | 600 |
| 6 | Celestial (a storm, a black hole) | 11.4 | 900 |

- **Meaning in counts.** Pool max can't exceed the ceiling, 500 × (count ÷ 10,000)^1.5. So the class 5 gate needs a count of at least about 11,300, with the pool worked to its ceiling. Class 6 needs about 14,800.
- **An average Knight** (count 10,000, ceiling 500) can never lift a capital ship alone.

## Verdict

- **Telekinesis:** the anchors fit the classes and gates. The one gap is pooled feats: Dorsk 81's 17 Star Destroyers has no rule.
- **Sensing range:** **not covered.** The catalog names distance classes, but the reserve spec gives them no factors or gates.
- **Battle meditation:** fits as written. The fleet-scale anchors either clear the gate or were amplified by something the reserve spec treats as outside power. It stays deferred until allies exist (reserve §9).

## 1. Telekinesis

| Anchor (Part 2a) | Class | Gate | Fit |
|---|---|---|---|
| Yoda lifts Luke's X-wing out of the swamp (3 ABY) | 3 (starfighter) | 150 | **Fits.** Yoda's ceiling is about 1,340, so the gate is far below him. At his level the mastery relief cuts the factor from 3.4 to about 2.0, so it is cheap, as *Episode V* shows |
| Galen Marek pulls a falling Star Destroyer into a controlled crash (2 BBY) | 5 (capital ship) | 600 | **Fits if** his design count is at least about 11,300 with a worked pool. He has no design count yet; set one at or above that when his profile is built. The feat took long, visible effort, which matches a large sustained draw near his limit |
| Darth Nihilus pulls a battlecruiser out of Malachor V's gravity well (3960 BBY) | 5, plus the gravity well | 600 | **Fits.** Nihilus fed on drained life: reserve §8's life-drain source gives borrowed pool on top of pool max. The gravity well is a difficulty, not a new class |
| Kyp Durron moves a black hole back onto a Vong ship (Yuuzhan Vong War) | 6 (the class's own example) | 900 | **Fits** for a very strong user. Kyp's count needs to be at least about 14,800 |
| Dorsk 81 pushes 17 Star Destroyers out of the Yavin system, channelling every Praxeum Jedi (12 ABY); it kills him | Beyond 5. Seventeen capital ships, so about class 6 | 900 | **Gap.** The gate checks one user's pool max, and no rule pools pools. The meld's shared pool (reserve §9) is deferred until allies exist. The death fits: a draw past empty runs into the Willpower zone, and collapse and the Vitality toll (reserve §5) can kill. **Suggestion for when the meld is built:** a channelled or melded feat checks the gate against the members' combined pool max; the channeller takes the overdraw, and the Vitality toll can kill at that size |
| Streen downs four TIE fighters with Force Wind (12 ABY); Yoda raises a mass of droids (19 BBY); Palpatine throws Senate pods (19 BBY) | 2–3, several targets | ≤150 | **Fits.** Scale counts targets in the catalog |

## 2. Sensing range

**The catalog** (§5d) says that for sensory powers, "scale class measures distance": a room, a city, a planet, a system, the galaxy. **The reserve spec** defines its classes by size only, so these distance classes have no factor and no gate.

| Anchor (Part 1a) | What it implies |
|---|---|
| Life Detection works subconsciously within about 10 m (game book) | The free, passive class is about a room |
| Telepathy: about 1,000 km typical between Force-sensitives; a few km to non-sensitives; no apparent limit for the Jacen–Jaina twin bond | Planetary range between two sensitives is ordinary. Range depends on the target, and a bond removes the limit |
| A friend or relative in mortal danger, sensed from up to 10,000 light-years (game book) | Personal ties extend far beyond any deliberate range |
| Padawans feel their Master "light-years away" through the bond (*The Jedi Path*) | Same: bonds ignore distance classes |
| Keetael farsight tracks quarry over "even interstellar" distances | A tradition can reach system range or beyond |
| Yoda feels the Jedi die across the galaxy (19 BBY); Obi-Wan feels Alderaan (0 BBY); planet-killing is "sensed from anywhere in the galaxy" (game book) | Galaxy range happens only for mass-death disturbances |

**Findings:**
1. **Distance needs its own table.** A suggestion for the reserve spec, not adopted: factors on the same curve as size (room 1.0, city 1.5, planet 2.25, system 3.4) and gates only at system range. Mastery relief applies as for size.
2. **Bonds and disturbances ignore the classes.** A Force-bond or life bond carries at any distance at no extra cost, and a mass-death disturbance reaches everyone. The catalog already reserves the galaxy class for these two cases (revision of §5d, Part3b e6).
3. **The target matters.** Telepathy to a non-sensitive reaches only a few km. A target modifier (sensitive, non-sensitive, bonded) would carry this better than a bigger class.

## 3. Battle meditation

**The game side:**
- The catalog: Advanced, sustained, 8 per round, with scale classes for squads, armies and fleets. Neutral since D-342.
- The reserve spec: thin-stretched if held past empty (Caedus at Fondor). Deferred until allies exist (§9).

| Anchor (Part 1a) | Fit |
|---|---|
| Bastila Shan touches two enormous fleets, boosted by the Star Forge (3956 BBY) | **Fits.** Fleet scale is about class 5–6. The Star Forge counts as an artifact source of borrowed pool (reserve §8). Without it she would not clear the gate, as the source suggests |
| Joruus C'baoth raises Thrawn's ships' victory rate by 40% and at times commands fleets "from across star systems" (9 ABY) | **Fits** for a Master-level clone. Across star systems combines fleet size with system distance (finding 2.1); that only works if distance and size both apply |
| The Imperial fleet falls into chaos when the Emperor's influence ends at his death (4 ABY) | **Fits.** It is a sustained effect that ends when the holder does. Sith battle meditation dominates its subjects, a dark deed (D-342) |
| Caedus at Fondor overused it and was stunned (thin-stretched) | **Fits.** Reserve §5 already models this |

**Battle meditation finding.** The 40% victory-rate figure is the only measured effect size in Legends. When battle meditation is built with allies, use it as the calibration target for the coordination bonus at fleet scale.

## Summary of suggestions (none adopted)

1. **Pooled feats.** Channelled or melded feats check the gate against the members' combined pool max. Build with the meld.
2. **Distance.** A distance table for sensory powers on the size curve, with gates only from system range. Bonds and disturbances are exempt.
3. **Target.** A target modifier for telepathy and sensing (sensitive, non-sensitive, bonded).
4. **Calibration.** Calibrate battle meditation's fleet-scale bonus to C'baoth's +40%.
5. **Design counts.** Give Galen Marek and Kyp Durron design counts at or above the gates their feats need (about 11,300 and 14,800).
