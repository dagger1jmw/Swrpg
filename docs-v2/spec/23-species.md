# 23 — Species (legacy V170 audit)

Audited file: `legacy/index.html` (V170). Read-only audit.

**Summary: species has no mechanical effect in V170.** It is a dropdown at creation, a string on the sheet, and a word in the AI context. There is no species data table, no lifespan, no traits, no species-based aging and no stat modifiers. legacy/CLAUDE.md's V165 log says the same: "Species confirmed to have no mechanical hook anywhere in the codebase — left as display-only."

## What it does for the player

- The player picks a species at creation (HTML 1199-1212): Human, Twi'lek, Mirialan, Togruta, Zabrak, Kel Dor, Nautolan, Chiss, Miraluka, Cathar, Kaleesh, "Other (specify in backstory)".
- It is shown in the sheet header (7354) and sent to the AI each turn (`SPECIES:` in sheetSummary, 4029). It also appears in the transition-scene prompt (12298) and the summarizer instructions (3658).
- Age advances on the calendar for every species the same way (`computeAge`, 7812-7825). Nothing ever ends or slows a life by species.

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Species options | 11 + "Other" | HTML 1199-1212 |
| Default | 'Human' | 3373 |
| Stat effect | None | grep `species`: only 1199, 1724, 3373, 3402, 3658, 4029, 7354, 12298 plus LORE_DATABASE prose |
| Age | `currentYear − birthYear`, −1 if before the birthday; the same for all species | 7816-7824 |
| Lifespan / max age | None; `lifespan` appears once, inside a LORE_DATABASE note string | 10373 |
| Age input range | 3..120 regardless of species | HTML 1217 |
| NPC species | Not a field; only inside description strings ("Kel Dor. Grand Master…", 3576) | 3573-3626 |

## State read / written

- `characterSheet.species` (string): set at creation (3402). It is **not** protected around the SHEET parse (4784-4803), so the AI's SHEET JSON can change or erase it.
- `characterSheet.age`, `characterSheet.birthday`: see 01-character-creation.md. They are species-independent.

## AI provides vs. code computes

- AI: everything species-related is narrative. Species traits (Miraluka Force sight, Kel Dor breath masks, Chiss vision) come only from the model's own knowledge.
- Code: stores and displays the string.

## Known bugs and fragile spots

1. **Species is not a protected field.** The AI can rewrite it through SHEET JSON (4775); the SHEET template sends `"species":""` (1724).
2. **The age range ignores species.** The input allows 3-120 (HTML 1217). A Kel Dor or Togruta Master older than 120 cannot be entered, and the Jedi rank brackets (3307) assume human ages.
3. **"Other" species is free text** stored only in the backstory, and the backstory itself is unprotected (see 01-character-creation.md, bug 2).
4. **NPC species is not data.** Canon NPC species exist only in prose, so no rule can use them.

## Conflicts between sources

- **Master Prompt v7.1 Part II** lists "Species and Homeworld" as required creation data (line 53) and Part XVI says species is inherited in same-species lineages (line 644). V170 stores species but leaves homeworld blank ('' at 3402) and has no lineage use of species.
- **Lore lifespans.** Character sheets record long-lived individuals (Yoda ~900, SW_Characters_11 line 141; "long-lived Draethos", SW_Characters_03 line 189). The Force ability **Resist Aging** (SW_Force_Abilities_Forms_v3_complete.md, Meditation 41+, FC 30+, FK 21+) "explains why experienced Jedi Masters … live for centuries". V170 models neither species lifespan nor Resist Aging's effect on aging.
- **Lore species traits.** Iktotchi innate precognition (LORE_DATABASE note 9721-9726) and Barabel instincts (10225) are recorded only as NPC note text. The lore files have no species trait table.
- **docs-v2/spec/progression-numbers.md §11** defines a human body cap by age and says "Other species get their own tables". §16 says "Long-lived species map these bands onto their own life stages". **ai-events.md** `npcIntroduced` carries `species`. None of these species tables exist yet, in V170 or in the lore files.

## Replaced by

- Human physical body cap by age: **Replaced by progression-numbers.md §11** (human only).
- Age-band learning modifiers: **Replaced by progression-numbers.md §16** (human; long-lived species mapping stated but not defined).
- NPC species as an input: **Replaced by npc-generation.md §4/§5** and ai-events.md `npcIntroduced`.
- Species data table (lifespan, life-stage mapping, body-cap table, traits), the player species list, and Resist Aging's effect on aging: **None — needs a v2 spec.**

## Open questions for Jared

1. Which species must v2 support at launch? The V170 list of 11, or only Human for Jared plus species data for canon NPCs (Kel Dor for Zym and Gnost-Dural, Twi'lek, Zabrak, etc.)?
2. Should species give traits with mechanical effects (for example Miraluka Force sight, Iktotchi precognition, Kel Dor low-light vision), or stay narrative?
3. Where should species lifespans and body-cap tables come from, since Docs/SWRPG lore/ has no species table? Is it OK to add one to the lore folder, or should it live in a v2 spec?
4. Should Resist Aging actually slow aging (body cap and lifespan) in v2?

---

# v2 species (lore batch 21, D-399)

## Sources
The lore source for species is `Docs/SWRPG lore/SW_Species_OldRepublic_Part1.md` (Human, Sith Purebloods and 18 core species), `_Part2.md` (25 more species; cyborgs, Zakuulans and rakghouls) and `_Part3.md` (comparison table, ageing findings, conflicts, Game notes, decisions). This spec records only the rulings and the data fields; the facts stay in those files. The game data is `src/data/species.ts`. Each species entry is also in the narrator's lore index, sent only when the species is named (D-398, parser).

## Ageing data: where each number comes from
Every lifespan and maturity in `src/data/species.ts` carries a tag in `ageSource`:
- `lore`: stated in a novel, comic, game text or codex;
- `game stat`: from an RPG sourcebook (mostly the Ultimate Alien Anthology, UAA). Infobox ages whose source could not be checked also carry `unverified` (Aqualish, Gran);
- `invented`: our own choice (was `house default`; D-472).

Game-book age bands are the default ageing tables where no lore exists; where lore gives a figure, lore wins. The 15 species with no lifespan source use the Human bands as an invented default (lifespan 100, maturity 18): Sith Purebloods, Twi'leks, Mirialans, Rattataki, Mon Calamari, Rodians, Nikto, Devaronians, Houk, Sullustans, Voss, Gormak, Gektl, Echani and Sarkhai. Revisit a species if a source turns up.

**How the bands become the two numbers** (`lifespan` = the age at Human-equivalent 100, `maturity` = the age at Human-equivalent 18; species.md §1): lifespan is the stated average lifespan when lore gives one, else the game book's venerable age or stated maximum, else the Human 100. Maturity is the book's adult age where given, else 18.

**Not species traits:** Scourge's immortality (a ritual) and Khem Val's centuries in stasis (an outside cause) never feed species data. **Force-sensitive longevity** (up to about 200 for Humans and Human-baseline species) is a design item: m6-integration-checklist.md item 33.

**Ageing signs** (flavour the narrator may use; `ageingSigns`):
- Trandoshans stop regrowing limbs at about 54 (game stat). This is mechanical only once limb loss exists.
- Sullustan eyes start failing after 30 (lore).
- Old Purebloods get mottled skin and withered tendrils (lore).

## Who can be played
- **Offered at character creation (38):** the 35 playable-ready species, plus three thin ones with good culture sources (Mirialan, Rattataki, Voss).
- **NPC-only (7):** Houk, Gormak, Gektl, Yoda's species, Sarkhai, Echani and Aqualish.
- **Not species:** cyborgs are a variant of any species. Zakuulans are Humans (use the Human entry), and rakghouls are not playable.
- Sith Purebloods stay Empire-only (species.md §4).

**Era gating rule:** a species can be picked only if its people are known to the side and the era of the start. In code this is `knownFrom` in species.ts and `speciesOfferedAt(year)`, and computeCreation rejects anything else.
- For the 3,661 BBY start the only gated case is the **Voss**, unknown to the galaxy until the rediscovery c. 3,645 BBY. No Voss player characters before then: a backstory exception is not offered at creation, and Voss NPCs before 3,645 need a story reason.
- **Kaleesh (lore batch 22, D-402 [10]; amends D-399 [21]):** Kalee is in Wild Space, and its page says the Kaleesh were "only recently contacted by the Galactic War" (SW_Planets_Travel_OldRepublic_Part2, Kalee). That does not put contact before 3,661, so the Kaleesh are NPC-only at the 3,661 start, gated like the Voss. Offered from the Galactic War, 3,641 [inferred] (D-405 [1]: kept, tagged inferred). 36 species are offered in 3,661.
- **Later start eras need the same check** as more gates are found.

**Setting rulings:**
- Ryloth is Hutt-controlled in 3,661 BBY [inferred] (the clans regained it "sometime after 3,643 BBY"). Tag it inferred wherever it appears.
- The Mother Machine claim that Twi'leks and Zabraks were made by it is an in-world rumour only.
- Homeworld control not stated in the files stays blank. Purely local colour may be invented, tagged `invented`, and must not contradict galactic control.
- The Cerean Force rate and languages rest on a gray-window book and are accepted.

## The playable species
One line each, giving:
- lifespan / maturity, with their tags;
- Force;
- languages;
- standing in 3,661 BBY (Republic and Empire);
- naming conventions where the file gives them.

"—" means not stated, left blank under ruling 18. P1 and P2 are SW_Species_OldRepublic_Part1 and Part2 (the species' own entry).

| Species | Lifespan / maturity | Force | Languages | 3,661 BBY standing | Naming | Cite |
|---|---|---|---|---|---|---|
| Human | 100 game stat / 18 invented | no rate stated | Basic and many others | most common in both powers; a favoured "master race" in the Empire | — | P1 |
| Sith Pureblood | 100 invented / 18 invented | non-sensitives "extremely rare" | Sith | Empire only: the privileged caste; Korriban is Imperial | — | P1 |
| Chiss | 80 game stat / 10 lore | rare; Force use forbidden at home | Cheunh; trade languages | the Ascendancy is the Empire's ally | — | P1 |
| Twi'lek | 100 invented / 18 invented | lekku possibly sensitive; no tradition | Twi'leki (Ryl), lekku sign | Ryloth Hutt-controlled [inferred]; many slaves in the Empire | — | P1 |
| Zabrak | 80 lore / 18 invented | no rate stated | Zabraki, Basic | Iridonia contested between both powers | — | P1 |
| Mirialan (thin) | 100 invented / 18 invented | religious Force belief | Mirialan, Basic | Mirial a refuge, Republic-aligned [inferred] | — | P1 |
| Miraluka | 84 game stat / 18 invented | whole species | Miralukese | Alpheridies: not stated | — | P1 |
| Cathar | 90 game stat / 18 game stat | often Jedi | Catharese | most sided with the Republic | — | P1 |
| Rattataki (thin) | 100 invented / 18 invented | many among Vich's captives | Rattataki | Rattatak partly Sith-occupied | — | P1 |
| Togruta | 95 game stat / 18 game stat | special affinity | Togruti | Shili: not stated | — | P1 |
| Kel Dor | 70 game stat / 18 invented | silver eyes mark affinity | Kel Dor, Basic | Dorin: not stated | given names copy the sounds of Dorin's atmosphere | P1 |
| Mon Calamari | 100 invented / 18 invented | no rate stated | Mon Calamarian, Basic | Republic member | — | P1 |
| Wookiee | 400 lore / 18 game stat, prime 200 lore | no rate stated | Shyriiwook and others; cannot speak Basic | Kashyyyk: not stated (joined the Republic) | — | P1 |
| Trandoshan | 60 game stat / 15 game stat | uncommon | Dosh | Trandosha: not stated | — | P1 |
| Rodian | 100 invented / 18 invented | no era rate | Rodese, Basic, Huttese | not stated (annexed by the Empire in 3,653) | — | P1 |
| Duros | 70 game stat / 15 game stat | no rate stated | Durese | Duro: not stated; a favoured species in Imperial field hospitals | — | P1 |
| Bothan | 85 game stat / 17 game stat | no rate stated | Bothese, Botha, Wrendui | Bothawui Republic-defended | — | P1 |
| Cerean | 70 game stat / 15 game stat | about Human [gray] | Cerean, Basic | Cerea: not stated | — | P1 |
| Nautolan | 70 game stat / 18 invented | respected; no Force culture | Anselmian, Basic | Glee Anselm: not stated | — | P1 |
| Devaronian | 100 invented / 18 invented | higher than other species | Basic, Devaronese | Devaron: not stated | — | P1 |
| Gand | 95 game stat / 18 invented | the findsmen | Gand | Gand: not stated | — | P2 |
| Kaleesh (from 3,641; D-402 [10]) | 80 game stat / 18 invented | a blessing; no Jedi known | Kaleesh | Kalee in Wild Space, only recently contacted | — | P2 |
| Nikto | 100 invented / 18 invented | no rate stated | Nikto | Kintan, Hutt Space [inferred] | — | P2 |
| Weequay | 90 game stat / 18 invented | many; some Jedi | Sriluurian | Sriluur: not stated | — | P2 |
| Talz | 52 game stat / 18 invented | not stated | chirps and buzzes | not stated (a Cold War Senator) | — | P2 |
| Epicanthix | 130 lore / 18 invented | mind shielding | Epicant | Panatha: not stated | — | P2 |
| Falleen | 250 game stat / 18 invented | resist mind tricks | Falleen | not stated | — | P2 |
| Hutt | 1,000 lore / 200 lore | rare; mind-shielded | Huttese | Nal Hutta neutral | personal, clan and family names (Zorba Desilijic Tiure) | P2 |
| Jawa | 80 game stat / 18 invented | not stated | Jawaese | Tatooine: not stated | — | P2 |
| Voss (thin; from c. 3,645) | 100 invented / 18 invented | high rate; the Mystics | Voss, Basic | independent and unknown to outsiders | — | P2 |
| Dashade | 85 game stat / 18 invented | resistant | Dashadi | near-extinct (Urkupp destroyed in 3,996) | — | P2 |
| Chagrian | 76 game stat / 18 invented | not stated | Chagri | Champala: not stated | — | P2 |
| Selkath | 100 game stat / 18 invented | not stated | Selkatha | Manaan neutral | — | P2 |
| Sullustan | 100 invented / 18 invented | not stated | Sullustese | Sullust: not stated | — | P2 |
| Ithorian | 85 game stat / 18 invented | many; priest-healers | Ithorese | Ithor: not stated | — | P2 |
| Arkanian | 103 game stat / 15 game stat | not stated | Arkanian | Republic | — | P2 |
| Zeltron | 80 game stat / 18 invented | empathic telepathy | Basic | Zeltros: not stated | — | P2 |
| Gran | 79 game stat, unverified / 18 invented | not stated | Gran | Kinyen: not stated | — | P2 |

## The ten thin species, and why
A species is thin when at least two of these are missing: body numbers, lifespan, culture and era (see each entry's readiness mark in P1 and P2).
- **Mirialan** (offered): no height or lifespan; culture well sourced.
- **Rattataki** (offered): no height or lifespan; culture and era sourced (Vich's captives).
- **Voss** (offered from c. 3,645 BBY): no height or lifespan; culture well sourced.
- **Houk:** no lifespan and no era detail.
- **Gormak:** no body numbers or lifespan; culture only as the Voss's rivals.
- **Gektl:** no body numbers, lifespan or language.
- **Yoda's species:** no culture or homeworld; only Jedi known.
- **Sarkhai:** no body numbers, lifespan or language.
- **Echani:** no numbers at all.
- **Aqualish:** ages from an unchecked infobox; little culture or era detail.
