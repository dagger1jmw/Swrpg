# Lore batch 21: species (Old Republic era)

2026-11-21. Batch file: `docs-v2/lore/batches/lore-batch-21-species.md`. Decisions: D-398 (parser and species data) and D-399 (the rulings, numbered as in the batch: D-399 [1]–[21]). The last number in use before the batch was D-397. The 21 rulings are one entry with numbered items, as in batches 19 and 20, rather than 21 separate numbers.

## Files added
- `Docs/SWRPG lore/SW_Species_OldRepublic_Part1.md`: Humans, Sith Purebloods and 18 core species.
- `Docs/SWRPG lore/SW_Species_OldRepublic_Part2.md`: 25 more species, plus cyborgs, Zakuulans and rakghouls.
- `Docs/SWRPG lore/SW_Species_OldRepublic_Part3.md`: comparison table, ageing findings, conflicts, Game notes and decisions.

## Lore index (D-398)
The parser did not cover species files, so it was extended in the same way as batch 19, with tests; the older layouts are unchanged.
- **Chunks:** each `### Name` entry with a "**Type:** species" bullet becomes a `species` chunk. 45 were added, and no other chunk changed (index 820 → 865 chunks).
- **When they are sent:** species chunks have no base score and no place matching. They are sent only when the species is named, so they never crowd out era lore.
- **The Sith exception:** plain "sith" is not a species name, because it names the Order far more often. The species answers to "Sith Pureblood(s)", "Sith hybrid(s)" and "Pureblood(s)".

## Species data: it existed, so it was updated
`src/data/species.ts` already had lifespan and maturity fields (12 species), so no checklist item was needed. Changes:
- **Size:** 45 species. 38 are offered at creation: the 35 playable-ready species plus Mirialan, Rattataki and Voss. Seven are NPC-only (Houk, Gormak, Gektl, Yoda's species, Sarkhai, Echani, Aqualish).
- **Source tags:** every lifespan and maturity has an `ageSource` tag (lore, game stat or house default), a basis citing the species file, and `unverified` for Aqualish and Gran. The tag is a separate field because `source` already holds the trait source.
- **Rule for turning the bands into numbers:** lifespan is the stated lore average if there is one, else the game book's venerable age or maximum, else the Human 100. Maturity is the book's adult age, else 18. This reproduces the earlier Togruta value (95).
- **Values changed:**
  - Chiss 110/18 → 80/10. The 10 comes from "like a 20-year-old Human at 10".
  - Zabrak 100 → 80, the SWTOR codex figure, tagged lore.
  - Miraluka 100 → 84.
  - Cathar 100 → 90.
  - Sith Pureblood 120 → 100, the Human baseline.
- **Values unchanged:** Human, Twi'lek, Mirialan, Togruta, Rattataki, Mon Calamari and Wookiee.
- **Traits:** the 33 new species have none yet (traits are design work for M8) and bodyScale 1.0.
- **Era gate:** `knownFrom` (Voss: 3,645 BBY) and `speciesOfferedAt(year)` enforce it. computeCreation rejects a player species that is not offered for the start year, and the creation form lists only the offered ones. NPCs may be any species in the table.
- **Ageing signs:** the three signs from ruling 8 are in `ageingSigns`.
- **Effect on NPCs:** canon NPCs whose species was missing from the table used to age as Humans. They now use their own bands: Hutt ×3, Nautolan ×2, Duros, Cerean, Trandoshan and Jawa.

## Spec edits
- **23-species.md:** new sections: sources, ageing tags and the rule for turning bands into numbers, who can be played, the era gating rule (with a note that later start eras need the same check), the setting rulings (Ryloth [inferred], the Mother Machine as rumour, homeworld control), a one-line table for each of the 38 playable species, and the ten thin species with the reason each is thin.
- **species.md §2:** notes that lore batch 21 supersedes its ages and species list. The traits are unchanged.
- **progression-numbers.md §11 and §16:** the species bands feed the age map, and the body-cap maths is unchanged. Force longevity is recorded as a design item.
- **m6-integration-checklist.md item 33:** Species longevity for Force-sensitives (ruling 5), a design item, not code.

## Era 09 files and roster (rulings 9–13)
- The roster already matched the rulings: Yuun born 3,670, Xalek born 3,665, Exal Kressh a Sith hybrid (species 'other').
- Conflict notes were added in the character files and in the roster's new `facts.conflicts` field for Yuun, Xalek, Broonmark and Ula Vii, plus Exal Kressh's note. A roster test checks all five.

## Species the roster spells differently
The roster's `speciesId` is `'other'` for these figures, although their species is now in the table. The NPC entity enum (src/data/entities.config.ts) doesn't list these species, so the roster can't name them yet:

| Figure | Species | Roster id |
|---|---|---|
| Nadia Grell | Sarkhai | other |
| Darth Karrid | Falleen | other |
| Khem Val | Dashade | other |
| Xalek | Kaleesh | other |
| Tanno Vik | Weequay | other |
| Yuun | Gand | other |
| Fideltin Rusk | Chagrian | other |
| Ula Vii | Epicanthix | other |
| Broonmark | Talz | other |
| Gault Rennow | Devaronian | other |

Exal Kressh's 'other' is correct (a hybrid). Spelling otherwise matches: the table's snake_case ids (`kel_dor`, `mon_calamari`) map to the entity enum's camelCase (`kelDor`, `monCalamari`) through creationSpecies. A question for Jared: extend the entity enum to the new species and fix these ten?

## Research queue
- Species is marked done; the old "Species traits, lifespans and ageing" gap is closed.
- Low-priority follow-up added: look for lore lifespans for the 15 unsourced species.
- The lore README has a new Species section.

## Tests and checks
- `npm test`: 108 files, 1,142 tests, all pass (13.8 s).
- `npm run typecheck` and `npm run lint`: clean.
- New tests:
  - species parsing and retrieval (the chunk kind, plurals, the "Sith" exception, sent only when named);
  - the species table (45 species, every age tagged, 37 offered in 3,661 and 38 from 3,645, the seven NPC-only, rulings 2–6 and 19);
  - the creation gate (Voss rejected in 3,661 and accepted later, Houk rejected for players and accepted for NPCs, Kel Dor accepted);
  - the five roster conflicts.

## Questions for Jared
1. **Wookiee maturity.** The linear age map can't fit both the books' adult age of 18 and a prime at about 200. Maturity stays at the earlier design's 60, tagged house default, which puts Bowdaar (about 177) at a Human-equivalent age of 46. Keep it, or settle it when a non-linear age map is designed?
2. **Bodies for the new species.** All 33 new species use bodyScale 1.0. That covers Jawas (about 1 m tall) and Hutts (1,500 kg), and Hutts are offered at creation as playable-ready (ruling 20). Leave this until the M8 traits, or set body scales now?
3. **The NPC entity enum.** Extend it so the ten figures above can carry their species?
