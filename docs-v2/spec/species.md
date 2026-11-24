# Species (v1)

Legends-only (CLAUDE.md). Lifespans and traits marked LORE CHECK must be confirmed against
Docs/SWRPG lore/ or Legends sources before M8; until then the values below are design
defaults, logged as such.

## 1. How species change the shared systems
Every species reuses the Human tables, rescaled. No separate curve per species.
  Age scaling (three ages per species since D-472): species age a maps to Human-equivalent age h by
    straight lines through birth (0 -> 0), adult (maturity -> 18), prime (the body's peak -> 30) and
    the end of a full life (lifespan -> 100; the last line carries on past it).
    A prime the lore does not give sits at the same share of adult life as a Human's 30, which keeps
    the old straight line from maturity to lifespan. Only the Wookiee has one (adult 18, prime 200).
  Body age b (D-472; src/engine/ageing.ts, src/data/ageing.config.ts, every number invented):
    up to prime b = h; after it b = 30 + (h - 30) * 70 / (70 + extension(Force Control)).
    extension: FC 0: 0 | 20: 1 | 40: 8 | 60: 22 | 80: 45 | 100: 80 | 110+: 100 Human-equivalent years
    (the body of 100 at 200). Yoda's species takes none: its 900 is a Jedi's lifespan already.
  Decline after prime, as a share of the peak, read at b (slow at first, faster towards old age):
    Strength, Endurance  30-35: 0 | 45: 2.5% | 55: 7.5% | 65: 15% | 75: 27.5% | 85: 43.75% | 100: 68.75% | 120: 90%
    Agility              30: 0 | 35: 1% | 45: 4.5% | 55: 11% | 65: 20% | 75: 33% | 85: 50% | 100: 76.5% | 120: 93%
    (Strength and Endurance keep the Human caps' old drop.) Nothing else declines.
  Body cap = (Human growth cap(b) * bodyScale + capBonus) * (1 - decline(b)).
  Physical performance = min(level * (1 - loss), body cap) + Force boost. The loss grows with each
    day's decline; a full year's training of the stat (150 h) keeps 40% of it away. It never falls:
    neither training nor a later rise in Force Control takes it back. A life before play, and every
    NPC's, counts as half-trained. Physical training past prime reads the body's age and is cut by the
    stat's decline, so an old body regains less. Canon sheets stand at their own date.
  Learning-speed age bands (progression-numbers sec 16) read h, not a (physical ones b, above).
  Rust, healing and everything else use the Human rules unless a trait says otherwise.
  Resist Aging (lore L-02): while maintained, h advances at 0.5x past maturity; lapsing
    makes h catch up at 2x until it reaches the true value.

## 2. Launch species (3,661 BBY Great Galactic War era)
  Superseded for ages and the species list by lore batch 21 (D-399): src/data/species.ts now has
  45 species (38 offered at creation, the Voss from c. 3,645 BBY; 7 NPC-only), each lifespan and
  maturity tagged lore / game stat / invented (was house default, D-472), and 23-species.md lists them. The table below
  keeps the traits (unchanged); its lifespans are the pre-batch design values.
  id          lifespan  maturity  bodyScale  traits
  human       100       18        1.00       none (baseline)
  twilek      100       18        1.00       lekku: Charisma learning x1.05 (D-113); dance/agility culture: Agility cap +5
  zabrak      100       18        1.00       resilience: Willpower learning x1.05 (D-113), pain penalties x0.9
  mirialan    100       18        1.00       Force-attuned culture: Force Control learning x1.05
  togruta     95        18        1.00       echolocation (montrals): +10% vs surprise contests
  miraluka    100       18        1.00       Force sight: no eyes; perception uses Force Sense; Force Sense learning x1.1; blinded if cut off from the Force
  chiss       110       18        1.00       tactical culture: tactics learning x1.1; Imperial ally (renown: Empire)
  cathar      100       18        1.05       claws and reflexes: unarmed base 8, Agility cap +5
  sith_pureblood 120    18        1.00       dark-side heritage: dark-tagged ability learning x1.05; Empire only
  rattataki   100       18        1.00       pain tolerance: pain penalties x0.85
  mon_calamari 100      18        0.95       amphibious; Intelligence learning x1.05
  wookiee     400       60        1.25       great strength: Strength cap +20; rage: anger state of mind triggers more easily
  Amended by D-113 (Jared): only physical stats have caps in v2, so the Twi'lek Charisma cap and
  the Zabrak Willpower cap became learning factors (x1.05, inside the 0.9-1.1 trait limit).
  All lifespans: LORE CHECK. Traits are design numbers in v2 terms (lore L-13 rule: lore
  defines the flavor, v2 specs define the mechanics), each logged.

## 3. Rules for traits
  Trait effects are limited to: a body-cap bonus (max +20), a learning factor on one
  category or skill (x0.9..x1.1), a contest modifier (+/-1 or a percentage up to 10%), or a
  narrative/story rule. Learning factors count inside the 2.8 cap and the 4.0x pace clamp.
  Every trait lives in src/data/species.ts with a source line or "design".

## 4. Character creation and NPCs
  Species is a creation choice (character-creation.md sec 1); default human.
  NPC generation uses the NPC's species for age scaling and body caps.
  Species availability by era and faction is data (e.g. sith_pureblood: Empire only).

## 5. Required tests
 1. Human tables are unchanged by the scaling code (human maps h = a).
 2. A 120-year-old Wookiee (adult 18, prime 200) maps to Human-equivalent age 24.7 and has that
    age's Human body cap times 1.25, plus the Strength bonus.
 3. A Wookiee child of 9 maps to Human-equivalent age 9.
 4. Resist Aging halves h's advance past maturity and catches up at 2x after lapsing.
 5. No trait pushes a learning factor outside 0.9..1.1 or breaks the 4.0x pace clamp.
 6. Every species row has a lifespan, maturity, bodyScale and a source or "design" note.
 7. D-472: the age map, the decline, the Force's stretch, training, NPCs (tests/m8/speciesAges.test.ts).
