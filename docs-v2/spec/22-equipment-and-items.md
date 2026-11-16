# 22 — Equipment and Items (legacy V170 audit)

Audited file: `legacy/index.html` (V170). Read-only audit.

**Summary: V170 has almost no item system.** There are no weapon or armor stats, no item objects, no prices, no encumbrance and no shops. What exists is: a lightsaber color/type pair (cosmetic plus a prompt reminder), a free-text `inventory` string array, and a `credits` number. The AI owns the inventory and credits.

## What it does for the player

- **Lightsaber panel.** The sheet sidebar has 9 color swatches and a type dropdown (`renderCharacterSheet` section, 7529-7545). The choice is saved and shown as "● green training saber".
- **Every turn the AI is told** `LIGHTSABER: GREEN training saber — blade is ALWAYS green glowing plasma ... NEVER 'clang'...` (4062). A prompt section, "LIGHTSABER SENSORY CANON" (2752-2764), sets the sound rules (hum, whoosh, crackle; never metallic).
- **Inventory and credits** are shown on the sheet only when the inventory is not empty (7580-7587). Credits are therefore hidden when the inventory is empty. They are sent to the AI as `INVENTORY: a, b | CREDITS: n` (4084).

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Lightsaber colors | blue, green, yellow, purple, orange, white, cyan, viridian, red | 7531 |
| Lightsaber types | training, standard, shoto, double-bladed, curved-hilt | 7534 |
| Default lightsaber | `{ color:'green', type:'training' }`, seeded if missing in `syncMasterXPToSheet()` | 7205-7207 |
| Mechanical effect of color/type | **None.** It is not read by rolls, forms or strain | grep: only 4062, 4764, 4798, 7205, 7530-7544 |
| Inventory start | `[]` (strings) | 3422 |
| Credits start | 0 | 3422 |
| `CREDITS=` tag | Sets `characterSheet.credits` to an absolute value | 5887 |
| Form key normalization (lightsaber forms, not items) | `_FORM_CANON` map | 4839-4848 |
| Canonical form keys | ShiiCho, Makashi, Soresu, Ataru, Shien, DjemSo, ShienDjemSo, Niman, Juyo, Vaapad, JarKai, KiiShikk | 10737 |

There are no crystal, hilt, armor, blaster or weapon-damage fields anywhere in the code. A search for weapon/armor/blaster/crystal finds only prompt prose, lore notes in LORE_DATABASE, and the `KyberResonance` Force ability (8922).

## State read / written

- `characterSheet.lightsaber = { color, type }`: written by the sidebar `onclick`/`onchange` (7538, 7541) and seeded at 7205. It is snapshotted and restored around the SHEET parse (4764, 4798), so the AI cannot change it.
- `characterSheet.inventory` (string[]) and `characterSheet.credits` (number): written by AI SHEET JSON (full replace, 4775) and by `CREDITS=` (5887). They are **not** in the restore list (4784-4803).

## AI provides vs. code computes

- AI: the full inventory contents and the credit balance, through SHEET JSON every turn. Code does no validation, arithmetic or logging of what was gained or spent.
- Code: only the player-chosen lightsaber color/type, which it protects from AI overwrites. It also injects the color into the prompt as a reminder.

## Known bugs and fragile spots

1. **The blade-color scrub from V144 is gone.** Docs/updates.md (V144 "Fix 3", lines ~625-629) describes `scrubBladeColor()` rewriting off-canon color words in the narrative. That function no longer exists in V170 (grep for `scrubBladeColor` and `scrub` returns no code hits). Only the prompt reminder is left.
2. **The AI can silently wipe the inventory and credits.** SHEET JSON replaces the whole sheet (4775), and neither field is restored. An omitted `inventory` key empties it.
3. **Credits are hidden when the inventory is empty**, because the credits line sits inside `if (inv.length > 0)` (7581-7586).
4. **Inventory items are assumed to be strings.** They are joined with ", " (4084) and rendered as `${item}` (7583). If the AI writes objects, the player sees "[object Object]". The values are also inserted as raw HTML (7583), which allows HTML injection from AI text.
5. **The `CREDITS=` tag is not taught in the prompt's CHANGES template** (grep: the only hit is the parser at 5887), so it is effectively dead. Credits change only through SHEET JSON.
6. **The type "double-bladed" is cosmetic.** It does not need the lore's `DoubleBlade` form ≥ 10 (see Conflicts) and does not affect rolls. There is no dual-wield (Jar'Kai) weapon state, even though JarKai is a trainable form (10737).
7. **The default saber ignores faction.** A Sith gets a green training saber, and non-Force factions get a lightsaber line injected into every prompt (4062 has no faction check).
8. **No crystal state.** Master Prompt v7.1 "Kyber Crystal Bond" (bonus to saber rolls; shattered crystal is a major event) is not implemented.

## Conflicts between sources

- **Docs/SW_Legends_RPG_Master_Prompt_v7_1.md "Kyber Crystal Bond"** (lines 595-597): a bonded crystal gives "a small but consistent bonus to lightsaber combat rolls". V170 has no crystal and no bonus.
- **Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md, Form Notes.** The saberstaff "Requires separate weapon … Requires DoubleBlade ≥ 10 before the second blade can be activated"; Jar'Kai "Requires two forms each at Apprentice (21+)". V170 has no `DoubleBlade` form key (10737) and no gating on the type dropdown.
- **Same lore file, "Kyber Resonance"**: "A Sith bleeds their crystal through a similar but dark-side process." (Note for Jared: crystal "bleeding" is from current Disney canon. Legends Sith mostly used synthetic red crystals. Recorded only; the lore file is the stated canon source.)
- **Form key lists differ.** The lore form table has `ShienDjemSo` as one form plus `Trakat`, `Sokan`, `DunMoch`, `ZeroGravity`, `DoubleBlade`. The code has separate `Shien`, `DjemSo` and `ShienDjemSo` plus `KiiShikk` (10737, 4840-4843). KiiShikk is not in the lore form table.
- **Prompt claim** (2756): "Silver blades … would never appear on a standard training saber". There is no lore source for this. The color list includes viridian, cyan and white, and no lore file defines a blade-color list.
- **Master Prompt v7.1 Part III** lists "Inventory and known secrets" as tracked character data (line 112). V170 tracks inventory only as AI free text.

## Replaced by

- Inventory changes from the AI: **Replaced by ai-events.md** (`itemGained` / `itemLost { itemRef | newItem { name, kind } }`). The AI no longer writes the inventory directly.
- Item model, weapon/armor stats, lightsaber build (color, crystal, hilt, single/dual/staff), credits economy: **None — needs a v2 spec.**

## Open questions for Jared

1. Should lightsaber properties (color, crystal, hilt, single/shoto/staff/dual) have any mechanical effect in v2 (rolls, forms gating), or stay cosmetic plus a prompt reminder?
2. Should the Master Prompt's "Kyber Crystal Bond" roll bonus be a v2 rule, and does the lore's "Sith bleed their crystal" line stand, or should Legends synthetic crystals be used?
3. Should v2 track credits as a real economy (income, prices), or as narrative only?
4. Do you want armor and blasters with stats in v2 (needed for non-Force factions like Republic, Mandalorian and Bounty Hunter), or is the game Jedi-focused enough to skip them?
5. Should the saberstaff and Jar'Kai keep the lore gating (DoubleBlade ≥ 10; two forms at 21+)?
