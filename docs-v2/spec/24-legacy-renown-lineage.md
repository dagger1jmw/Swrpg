# 24 — Legacy, Renown and Lineage (legacy V170 audit)

Scope:
- `characterSheet.renown`
- `worldState.legacyChanges` and `worldState.lineageRecord`
- the prompt sections LEGACY SYSTEM (`legacy/index.html:2732-2737`) and RENOWN (`2748-2750`)
- the World Log panel sections that display them (`legacy/index.html:1423-1426`, `8122-8145`)
- the sheet Renown section (`7566-7577`)

## What it does for the player

- **Renown:** the per-faction reputation numbers appear on the sheet when above 0. They are injected into the AI context each turn.
- **Legacy Changes and Lineage:** World Log panel sections meant to show player-caused changes to galactic norms (with Strength ratings) and ancestors. The Master Prompt v7.1 Part XVI describes a full multi-generation Legacy System: Legacy Succession screen, hybrid descendant creation, Lineage Impressions, and Legacy Change Challenges.
- In V170 **none of the Legacy/Lineage mechanics exist in code**. The panels can only ever show "None established" / "No ancestors yet".

## Rules and formulas

| Rule | Value | Source |
|---|---|---|
| Renown factions (initial) | jediOrder, sith, republic, underworld, mandalorians, all 0 | `legacy/index.html:3423` |
| Renown injected to AI | Jedi, Sith, Republic, Underworld (Mandalorians omitted) | `4085` |
| Renown bands (prompt only) | 0-20 Unknown, 21-40 Noticed, 41-60 Known, 61-80 Renowned, 81-100 Legendary; "only increases if witnessed or reported" | `2748-2750`; Master Prompt v7.1 §Renown System (lines 114-116) |
| Renown write path | AI SHEET JSON only (there is no tag and no code rule) | the SHEET overwrite described in the v170-audit; no `renown` writes found besides init `3423` |
| Legacy Change strengths | Fragile → Established → Entrenched → Foundational (CSS class `legacy-<strength>`) | prompt `2736`; `8127`; Master Prompt v7.1 Part XVI |
| Legacy/Lineage protection | snapshot before the WORLD JSON parse and restore after it | `4889-4890`, `4910-4911` |
| Legacy changes injected to AI | `JSON.stringify(ws.legacyChanges)` every turn | `4096` |

## State read / written

- `characterSheet.renown{jediOrder, sith, republic, underworld, mandalorians}`: written by the init (`3423`) and the AI SHEET JSON; read by `buildContext` (`4085`) and `updateCharacterSheet` (`7567-7576`).
- `worldState.legacyChanges[]` `{name, strength, description}` and `worldState.lineageRecord[]` `{name, era, dominantAbilities[]}`: written only by the init (`3435`) and `normalizeWorldState` (`3950-3951`), and restored from the snapshot on every turn. Read by `updateWorldState` (`8123-8145`) and `buildContext` (`4096`).

## AI provides vs. code computes

- **Renown:** the AI decides the values entirely. Code only displays them.
- **Legacy and Lineage:** the prompt asks the AI to maintain them, but the AI's WORLD JSON edits are reverted, and no CHANGES tag exists. Code computes nothing.

## Known bugs and fragile spots

1. **Legacy Changes and Lineage are dead features.** The WORLD snapshot/restore (V125 fix) reverts any AI write (`4889-4890`, `4910-4911`), and no `LEGACY_*` or `LINEAGE_*` tag exists (no handler in the CHANGES switch). The panels can never populate in a new campaign.
2. **Renown can be rewritten freely** by the AI every turn through the SHEET JSON. There is no witnessed/reported rule in code and no bounds check. Mandalorian renown is tracked but never shown to the AI (`4085`).
3. **Renown and legacy entries are rendered unescaped** as `innerHTML` (`7573`, `8129-8142`).
4. **No death or retirement flow exists**, so the "Legacy Succession screen" in the prompt (`2733`) is something the AI may improvise in prose with no UI support.

## Conflicts between sources

- **Legacy system:** Master Prompt v7.1 Part XVI (lines 625-700+) specifies Lineage Impressions as weighted probabilities, descendant creation, Legacy Change Challenges (pause the simulation and notify the player), and a Lineage Record that is "always available". Code implements only empty display slots, and the WORLD protection makes even AI-maintained records impossible.
- **Renown factions:** the Master Prompt lists 4 renown factions (Jedi Order, Sith, Republic, Underworld). Code initializes 5 (adds mandalorians).
- **Simulation challenges:** the prompt says a Legacy Change Challenge should pause the "simulation". The training simulator (`17-training-simulator.md`) has no such hook.

## Replaced by

None — needs a v2 spec (reputation/renown, and multi-generation legacy if kept). `ai-events.md` sets the rule that applies: the AI may propose a renown or legacy event, and code validates and applies it.

## Open questions for Jared

1. Is the multi-generation Legacy System (descendants, Lineage Impressions, Legacy Changes) in scope for v2, or is it deferred or dropped?
2. Should renown be numeric per faction with code-owned rules (witnessed or reported events only), or narrative only? Which factions: the Master Prompt's 4, or code's 5 (with Mandalorians)?
