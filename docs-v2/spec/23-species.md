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
