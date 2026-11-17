# Species (v1)

Legends-only (CLAUDE.md). Lifespans and traits marked LORE CHECK must be confirmed against
Docs/SWRPG lore/ or Legends sources before M8; until then the values below are design
defaults, logged as such.

## 1. How species change the shared systems
Every species reuses the Human tables, rescaled. No separate curve per species.
  Age scaling: species age a maps to Human-equivalent age h:
    below maturity:  h = a * 18 / maturity      (childhood at the species' own pace)
    from maturity:   h = 18 + (a - maturity) * 82 / (lifespan - maturity)
    (continuous at maturity; h reaches 100 at the species' lifespan)
  Body cap(age) = Human body cap(h) * bodyScale, plus capBonus per physical stat.
  Learning-speed age bands (progression-numbers sec 16) read h, not a.
  Rust, healing and everything else use the Human rules unless a trait says otherwise.
  Resist Aging (lore L-02): while maintained, h advances at 0.5x past maturity; lapsing
    makes h catch up at 2x until it reaches the true value.

## 2. Launch species (3,661 BBY Great Galactic War era)
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
 2. A 120-year-old Wookiee maps to Human-equivalent age 32.5 and has that age's Human body
    cap times 1.25, plus the Strength bonus.
 3. A Wookiee child of 30 maps to Human-equivalent age 9.
 4. Resist Aging halves h's advance past maturity and catches up at 2x after lapsing.
 5. No trait pushes a learning factor outside 0.9..1.1 or breaks the 4.0x pace clamp.
 6. Every species row has a lifespan, maturity, bodyScale and a source or "design" note.
