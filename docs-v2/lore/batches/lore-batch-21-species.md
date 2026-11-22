# Lore batch 21: species (Old Republic era)

One commit. Run after batch 20.

**Inputs** (in `Docs/SWRPG lore/`):
- SW_Species_OldRepublic_Part1.md: Humans, Sith Purebloods and 18 core species
- SW_Species_OldRepublic_Part2.md: 25 more species, plus cyborgs, Zakuulans and rakghouls (variant or non-playable)
- SW_Species_OldRepublic_Part3.md: comparison table, ageing findings, conflicts, Game notes, decisions, checklist

This is the first lore source for `23-species.md` and for the lifespan and body-cap parts of the progression spec. Give each ruling below the next free D-number. Batches 19 and 20 used some numbers, so check the last one in use first.

## Step 1: Read and index

1. Add the three files to the lore index if the parser covers this layout. If it doesn't, extend the parser the way batch 19 did, with tests, and leave the older layouts working.
2. Don't copy the species files into the specs. The specs cite them and record only the rulings and the data fields below.

## Step 2: Rulings

**Ageing data: where each number comes from**

Every lifespan or age-band number in game data gets a source tag:
- `lore`: stated in a novel, comic, game text or codex
- `game stat`: from an RPG sourcebook
- `house default`: our own choice

1. **Game-book age bands are the default ageing tables** for any species with no lore source. This mostly means the Ultimate Alien Anthology. Tag them `game stat`. Where lore gives a figure, the lore figure wins.
2. **Human baseline for unsourced species.** The 15 species with no lifespan source get the Human bands as a `house default`: Purebloods, Twi'leks, Mirialans, Rattataki, Mon Calamari, Rodians, Voss, and the others listed in Part3. Revisit a species if a source turns up later.
3. **Falleen:** most live to about 250, and 400 is the rare maximum.
4. **Wookiees:** prime around 200; soft cap about 400, with rare cases beyond. Bowdaar is about 177 in 3661 BBY, so he is in his prime.
5. **Force-sensitive longevity**, up to about 200, plus the elite medicine case of up to about 300: this applies to Humans and to species on the Human baseline (ruling 2). It does not apply to species with their own lifespan data, such as Hutts, Wookiees, Chiss, Falleen, Yoda's species and Epicanthix, until we design a scaled rule for them. The 800-year-old Jedi is an exception, not a rule. Add this to the checklist as a design item, not code.
6. **Zabraks:** accept the SWTOR codex figure of 80 as their average lifespan, tagged `lore`. Any maximum comes from game stats.
7. **Not species traits:** Scourge's immortality (a ritual) and Khem Val's centuries in stasis (an outside cause). Neither feeds species data.
8. **Ageing signs** go into species data as flavour, with their tags:
   - Trandoshans stop regrowing limbs at about 54 (`game stat`).
   - Sullustan eyes start failing after 30 (`lore`).
   - Old Purebloods get mottled skin and withered tendrils (`lore`).
   The narrator may use these. Only the Trandoshan one is mechanical, and it waits until limb loss exists in the game.

**Conflicts with the character files.** The character's own page wins.

9. **Yuun:** born 3670 BBY. Record 3668 (the Gand planet page) as a conflict.
10. **Xalek:** born 3665 BBY. Record 3664 (the Kalee page) as a conflict.
11. **Exal Kressh:** a hybrid, per the best fit. Record the Pureblood line on the species page as a conflict. Fix her species in the Era 09 file and the roster if they say otherwise.
12. **Talz:** keep the Cold War Talz, Broonmark included. Read "found around 15 BBY" as a later rediscovery after contact was lost.
13. **Epicanthix:** keep the Cold War Imperial Intelligence spies, Ula Vii included. Read the Palpatine-era "first contact" as the later Empire's contact, not the first ever.

**Setting**

14. **Ryloth is Hutt-controlled in 3661 BBY** [inferred], from its being "regained sometime after 3643 BBY". Tag it `inferred` wherever it appears.
15. **Voss:** no Voss player characters before the rediscovery c. 3645 BBY. A backstory may explain an exception, but that isn't offered at character creation for the 3661 start. Voss NPCs before 3645 also need a story reason.
16. **The Mother Machine claim** that Twi'leks and Zabraks were made by it is an in-world rumour only, never fact.
17. **Cerean:** accept the gray-window Force-sensitivity rate and language detail (rule 7).
18. **Homeworld control in 3661:** where the files don't state it, leave it blank. Don't invent it. Purely local colour may be invented, tagged `invented`, and must not contradict galactic control.
19. **Aqualish and Gran ages** come from infoboxes whose sources couldn't be checked. Keep them, tagged `game stat` with the word "unverified".

**Character creation**

20. **Offered at character creation:** the 35 playable-ready species, plus three thin ones: Mirialan, Rattataki and Voss (Voss gated by ruling 15). The other seven thin species are NPC-only for now: Houk, Gormak, Gektl, Yoda's species, Sarkhai, Echani and Aqualish. Cyborgs are a variant, not a species. Zakuulans and rakghouls aren't playable.
21. **Era gating:** a species can be picked only if its people are known to the side and the era of the start. Voss is the only gated case for 3661 so far. Note in `23-species.md` that later start eras need the same check.

## Step 3: Spec and data edits

1. **`23-species.md`:**
   - add a source section pointing to the three files;
   - add the playable list (ruling 20) and the gating rule (rule 21);
   - for each playable species: lifespan bands with tags, Force-sensitivity notes, languages, standing in the Republic and the Empire in 3661, naming conventions (a short line each, citing the file);
   - list the ten thin species and why each is thin.
2. **Progression spec (lifespans and body caps):**
   - replace any placeholder lifespans with the species bands above;
   - record the Force-longevity rule (ruling 5) as a design item;
   - leave body-cap maths unchanged and note where the species bands should feed it.
3. **Species game data:**
   - If the code has species data with lifespan or age fields, update them from the bands and add a `source` field with the three tags.
   - If it doesn't, don't build the system in this batch. Add a checklist item: "Species data: lifespan bands and source tags (batch 21)".
4. **Era 09 character file and canon roster:** apply rulings 9 to 13. Add a conflict note to each of Yuun, Xalek, Exal Kressh, Broonmark and Ula Vii.
5. **Research queue:** mark species done. Add a follow-up to look for lore lifespans for the 15 unsourced species, low priority.

## Step 4: Checks

- `npm test`, typecheck and lint clean.
- If roster tests cover species, the five characters above pass.
- Report: the D-numbers used; whether species data existed or a checklist item was added; any species in the files that the roster spells differently.
