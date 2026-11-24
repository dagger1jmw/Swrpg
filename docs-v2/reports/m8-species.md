# M8 items 2 and 3: species ages and traits, and two small items (2026-11-24; D-471 to D-473)

- **Starting point:** commit `277bd7e`. The tag is `m8-species`. One commit per item: `7f6d0cb`, `3a8eeca`, `fd6f02c`.
- **Both items are built and tested, and two calibration gates now fail.** Nothing was retuned; both need your ruling (section 1).

| Check | Result | Runtime |
|---|---|---|
| test:all, small items | 1,541 of 1,541 | 983 s |
| test:all, item 2 | 1,559 of 1,560 (Luke's physical peak) | 1,135 s |
| test:all, item 3 | 1,571 of 1,573 (Luke again; and the lore-index check, below) | 1,162 s |
| Spread, 20 seeds, after item 3 | every gate 20/20 but Luke's physical peak 0/20; the per-hour table gate fails | 1,675 s |
| Band-effect probe | no value moved; nothing flagged | - |
| typecheck, lint | clean | - |

The lore-index failure is not from this work. Your other chat was saving timeline files into `Docs/SWRPG lore/` during the
run. The check passes re-run. I did not commit those files or `lore-overnight-2026-11-24.md`.

## 1. Gates that moved, for your ruling

**1. Luke's physical peak: 89, gate 58–68 (all 20 seeds).**
- **Cause:** the Force Control stretch. Luke's Force Control is 110 at 60, so his body of 60 reads as about 42. With it, his
  performance is still rising at 89.
- **It is the ruling, not the top figure.** I scaled the extension and re-ran him (one seed): 0% of it peaks at 65, 10% at
  70, 20% at 75, 35% at 86, and 50% and more at the end of the run. Even 7–10 extra years break the gate.
- **The conflict:** the gate rests on *Fate of the Jedi* (his peak in the early 60s). A Force Master's body ageing decades more slowly cannot also peak there.
- **Options:** (a) drop the gate and state the new peak; (b) let the stretch start later than prime, or cut the stretch of
  Luke's own life; (c) let the Force boost saturate, so the body alone sets the peak. I recommend (a).

**2. The Average's per-hour table: worst −28.2% (Strength at 90), band ±5%.** Milestones and the K gate hold (41 at 16.01 years, band 15.9–16.1). Two causes:

| Off the table (over 5%) | Cause |
|---|---|
| Strength, Agility and Endurance at 70–98 (−28% to +11%) | Physical training past prime is cut by the body's decline (ruled: an old body regains less) |
| Meditation +7/+15/+26% at 80/90/98, Willpower +10/+15/+25%, Force Knowledge +10/+16% at 90/98, Ataru +6/+9% at 90/98 | The stretch keeps the Average's Endurance up in old age, so they are less tired; the table had measured an exhausted 98-year-old |

The table is the 4.0x clamp's reference, so it touches characters of 70 and over. **Ruling needed:** re-measure those rows, or keep the old table for them.

**Nothing else moved:** every other gate is 20/20. Median milestones (years of training to 21 / 41 / 61 / 81 / 101):

| Profile | Medians |
|---|---|
| Average | 5.13 / 16.01 / 30.8 / 51.8 / 78.2 |
| Obi-Wan | 4.09 / 12.5 / 20.7 / 34.5 / 52.8 |
| Anakin | 1.20 / 3.51 / 7.0 / 12.6 / 18.0 |
| Luke | 1.69 / 5.46 / 11.5 / 20.2 / 31.7 |

**The probe:** Ragate (75) and Darth Zash (80) are marked reviewed, and the flag list is empty. Oteg still reads 35.1.

## 2. Small items (D-471)

- **Map:** PP-5 and PP-6 are committed and load. New gaps 15–20 are in `m8-world-b.md`: outcomes about equally likely; trust
  and rank as conditions; survivors tracked as people; the player dying on the recorded path; an opposing player's success;
  and PP-6's alternatives that need no break (covered by a tracker expression).
- **Captivity:** the engine alone ends it: an escape check the player chooses (one a day), a daily rescue chance from allies, or
  release, ransom or transfer at 14 days. Rules: spec/blockades.md section 5.
- **Design calls to check:**
  - Winning a real fight while held frees the character.
  - A fight's captive is no longer freed by moving place.
  - Release and ransom return the ship. A break-out keeps it only on a margin of 8 or more.
  - One transfer at most.
  - Captors who take prisoners to kill them follow the same limit.

## 3. Species ages (D-472)

- **Three ages** on straight lines, read as Human 18, 30 and 100. Only the Wookiee has a lore prime (200). The others sit at the same share of adult life as a Human's 30, so they read exactly as before. `house default` is now `invented`.
- **Decline:** Strength and Endurance keep the drop the caps already had; Agility starts sooner. The trained level now falls too, not only the cap.
- **Training** keeps back up to 40% of the loss and never reverses it. Physical training past prime is cut by the decline.
- **NPCs** count as half-trained. A canon sheet stands at its own date and falls after it.

**Checked against the curve** (body = Human-equivalent age the body shows):

| Figure | Age | Force Control | Reads as (h) | Body | Result |
|---|---|---|---|---|---|
| Bowdaar, 3661 BBY | 177 | 4 | 28.5 | 28.5 | In his prime; Strength ceiling 120, no loss |
| A Wookiee of 300 / 400 | - | 0 | 65 / 100 | 65 / 100 | Strength ceiling 102 / 37.5 |
| Yoda | 300 / 600 / 900 | 100 / 110 / 110 | 44 / 72 / 100 | same | Agility ceiling 77 / 57 / 19. He is not in the rosters: Force Control is assumed |
| Oteg, 3642 BBY | 202 | 60 | 35.1 | 35.1 | Barely past prime |
| Zym | 120 | 72 | 81 | 64 | Agility 33 |
| Tol Braga | 85 | 66 | 60 | 51 | Agility 42 |
| Orgus Din | 72 | 60 | 72 | 62 | Agility 45 |
| Kao Cen Darach | 59 (Zabrak) | 60 | 72 | 62 | Agility 53 |
| Bela Kiwiiks | 70 | 58 | 73 | 63.5 | Agility 44 |
| Ngani Zho | 80 | 60 | 80 | 68 | Agility 37 |
| Darth Zash, Mekhis | 80 | 47 | 80 | 72 | Agility 38, 37 |
| Darth Marr, Vowrawn | 62, 71 | 78, 47 | 62, 71 | 50, 65 | Agility 48, 35 |
| Vandar Tokare | - | - | - | - | **Not checkable:** no age, birth year or species in the lore files |

Scourge and Khem Val are `fixed`; their ages never touch them.

**To know**
- **Long lives learn slowly in the closed form.** A Wookiee's years from 18 to 200 count as 12 Human years of training, so a
  200-year-old Wookiee Knight from the generator is trained like a 30-year-old Human. This affects only Wookiees and needs a ruling.
- **An active Force Master's body can hold level to about 90.** The generator's Jedi Guardian reads Agility 48 at 45 and 49 at 90, because training and high Force Control offset the decline. Weaker Force users fall (a Consular's goes from 44 to 34).
- **D-399 [5]** (Human-baseline species only) is replaced: the stretch covers every species in Human-equivalent years. Yoda's species is excepted, since its 900 comes from Jedi.

## 4. Species traits (D-473)

- **33 species, each trait citing its entry** (a test opens the file and checks that the entry exists). Six kinds. Drawbacks only where the lore gives one. A dated social trait holds only in its years.
- **What the engine applies:** Strength, Agility and Endurance ceilings; body scale; hides; poison, fire, impact and fall
  hazards; resistance to mind tricks and the Force. **The rest is told to the narrator and shown on the sheet:** senses, needs,
  social traits, radiation, cold, disease, vacuum, claws, venom, the bellow, limb regrowth.
- **Body scales from lore height** for 27 species; 1.0 where there is none (Voss, Gormak, Gektl, Echani, Sarkhai). Talz 1.29, Houk 1.26, Epicanthix 1.23, Ithorian 1.17, Trandoshan and Cerean 1.14, Jawa 0.57, Yoda's species 0.4. The Hutt keeps 1.5: no height, only a mass.
- **Exceptions:** `ownForceTraits` on CanonNpc, beside `insideForce`. No figure uses it yet; Ula Vii may, but the file does not say he is shielded.

**Please check**
1. **Size no longer scales Agility for these 33.** At 1.5 a Hutt would have been the quickest body in the game. The 12 older species are unchanged (a Wookiee's Agility ceiling is still 100). Should they follow?
2. **Height as strength** gives thin species a high ceiling (Duros 1.11, Cerean 1.14), and the Hutt ties the Wookiee at Strength 120. The Houk reach 116, just under the Wookiee.
3. **+3 to the two Force resistances** passes species.md's old limit of 1.

## 5. Every `invented` number

| Where | Numbers |
|---|---|
| Captivity: security | Blockade 60, +5 per point of strength or alertness over 3; fight 45, +3 per captor (up to 8), +15 named; range 20–110 |
| Captivity: escape | One try a day; a clear failure adds 5, a bad one 10 and 3 days' wait; at most 20; the ship on a margin of 8; the 7 skills that may be used |
| Captivity: rescue (a day) | Side 0.5%, master 1%, friend 0.3% (close 0.6%), crew x1.5; 6 friends; friend from 20, close from 60; scaled around security 60 (x0.2–1.5); at most 6% |
| Captivity: limit | 14 days; released 40%, ransomed 35%, transferred 25%; ransom 5,000 credits; a transfer adds 15 and happens once |
| Ages | Prime at Human 30; every species' prime but the Wookiee's (30 for a 100-year life; for example Hutt 317, Falleen 52, Trandoshan 21.6); every lifespan and maturity tagged `invented` in src/data/species.ts (lifespan: 15 species and Kel Dor) |
| Decline, Strength and Endurance | 35: 0, 45: 2.5%, 55: 7.5%, 65: 15%, 75: 27.5%, 85: 43.75%, 100: 68.75%, 120: 90% |
| Decline, Agility | 35: 1%, 45: 4.5%, 55: 11%, 65: 20%, 75: 33%, 85: 50%, 100: 76.5%, 120: 93% |
| Force Control stretch | 0: 0, 20: 1, 40: 8, 60: 22, 80: 45, 100: 80, 110: 100 Human-equivalent years (a Master of 110 has the body of 100 at 200, the "up to 200" of Forceful Humans) |
| Training against age | Full training 150 h a year keeps 40%; a life before play and every NPC count as 50%; physical training is cut by the stat's decline |
| Ceilings | Trandoshan Strength +10, Endurance +5; Houk Strength +15; Talz Strength +5, Endurance +5; Falleen Agility +5; Gektl Endurance +5 |
| Body | Scale = height / 1.75 m; Agility unscaled (33 species); Hutt 1.5 |
| Resistances | Hide 2 (Weequay, Gand); poison x0.25 Devaronian, x0.5 Hutt; fire, impact, fall x0.75 Weequay; Force and mind resistance +3 |

## 6. Research gaps (all in docs-v2/lore/RESEARCH_QUEUE.md)

**Ages**
- **No lifespan:** Sith Pureblood, Twi'lek, Mirialan, Rattataki, Mon Calamari, Rodian, Nikto, Devaronian, Houk, Sullustan, Voss, Gormak, Gektl, Echani, Sarkhai. Kel Dor stays at 150.
- **No prime** for any species but the Wookiee, and no adult age for most of those at 18.
- **Yoda's species** apart from the Jedi; **Vandar Tokare;** how far Force Control lengthens a life (the ages of old Human Masters of known mastery); which stat fails first.

**Traits**
- **No height:** Hutt, Voss, Gormak, Gektl, Echani, Sarkhai (Mirialan, Rattataki and Sith Pureblood among the older twelve).
- **Thin entries:** Epicanthix, Yoda's species, Sarkhai, Aqualish, Gormak, Gektl, Voss, Nikto, Bothan.
- **Epicanthix shield:** how common, and Ula Vii.
- **Amphibious species drying out:** in the design notes, not in the files. Not built.
- **How strong:** the Force, mind, poison and hide resistances; Selkath venom; the Ithorian bellow; how long a Kel Dor lasts in vacuum.
- **Quickness** of the Hutt and of any species but the Falleen; **Nikto subspecies;** Force-sensitivity rates; how other cultures treat each species, dated.
