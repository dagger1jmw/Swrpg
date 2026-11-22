# 16 — Lore Injection (legacy V170 audit)

Audited: `legacy/index.html` (V170). All line numbers were checked against the file.

## What it does for the player
Every turn, the AI receives a "LORE CONTEXT" block inside the authoritative state. It contains:
- the era situation, faction power and morale, and Temple supply;
- up to 5 recent and 4 upcoming timeline events (upcoming ones marked GM-only);
- a list of active-era canon NPCs with Force stats;
- the immutable "power ceiling" (Abeloth, Luke, Vitiate, …);
- rules (anchor stats, prereqs, sub-abilities, proficiency cap) for each Force ability the player knows.

The aim is to keep the AI on canon and stop it inflating NPC power.

## Rules and formulas
| Rule | Value | Source |
|---|---|---|
| `LORE_DATABASE` | `currentEra` (8967-8983), `apexCeiling` (8987-9007), `characters` (9013-~10438), `timeline.events` (10439-10488); ends 10489 | legacy/index.html:8964-10489 |
| Stated source | "SW_Characters_09, SW_Characters_09B, SW_Legends_Galaxy_Timeline" | legacy/index.html:8962 |
| Current BBY | `inGameDate.match(/(\d{3,5})\s*BBY/)`, else `currentEra.dateBBY` (3661) | legacy/index.html:11024-11026 |
| Timeline window | events with abs(date − BBY) ≤ 30; past = date ≥ BBY (top 8, prompt shows 5); future = date < BBY (top 5, prompt shows 4) | legacy/index.html:10494-10496, 11046-11057 |
| War-era gate | 3681 ≥ BBY ≥ 3636 → factionStates, temple and situationNow included | legacy/index.html:10497-10502 |
| Era label | always `currentEra.label` ("3,661 BBY — Year 20 of the Great Galactic War") | legacy/index.html:10499, 8968 |
| Active NPCs | every `characters` entry with `statusIn3661` not starting "NOT ACCESSIBLE" (18 entries carry `statusIn3661`), **regardless of date** | legacy/index.html:10506-10510 |
| NPC line | `name [tier] FC:x FOut:y — status (115 chars)` | legacy/index.html:11061-11069 |
| Apex lines | TRANSCENDENT, S, A + rule | legacy/index.html:11072-11078 |
| Ability rules | `FORCE_ABILITY_RULES[key]` or a pointer to SW_Force_Abilities_Forms_v3_complete.md; profCap: ≤20→25%, ≤40→50%, ≤60→70%, ≤80→85%, else 100% | legacy/index.html:10518-10556, 11081-11095 |
| Shatterpoint line | added if shatterpoint perception or SP level > 0 | legacy/index.html:11096-11101 |
| Failure mode | any exception → returns `''` silently | legacy/index.html:11105-11107 |
| When injected | each `buildContext()` call (main request, truncation continuation, missing-choices retry) | legacy/index.html:4119, 4604, 4656, 4688 |
| Second canon NPC table | `CANON_PROFILES_3661BBY` (5 NPCs) seeded into `characterProfiles` on new game and on load | legacy/index.html:3573-3637, 3443, 8325 |

**Token budget:** the code has no limit or measure. My estimate for a 3661 BBY start with no Force abilities is about 15 NPC lines × ~150 chars + ~9 timeline lines + ~5 ceiling and situation lines ≈ 3.5–4.5k chars (~1k tokens) per request. This was not measured: running the code offline failed while extracting the file. The block grows with the player's ability count. It is sent again in full on every request, including retries.

## State read / written
- **Reads:** `worldState.inGameDate`, `characterSheet.forceAbilities`, `innateTalents`, `spGetLevel()`.
- **Writes:** nothing. This is the one pure-ish piece in this area, apart from the `statToTier` dependency.
- `CANON_PROFILES_3661BBY` **writes** `worldState.characterProfiles[name]` when the name is missing (3633-3635).

## AI provides vs. code computes
Code selects and formats all of it. The AI only reads it. Nothing checks that the AI's narration respects it.

## Known bugs and fragile spots
1. **Non-3661 eras get the wrong lore.**
   - Clone Wars (`22`) and GCW (`1`) campaigns fail the `\d{3,5}` match and fall back to 3661 (11025-11026). They receive Great Galactic War lore and NPCs.
   - Even when the year parses (for example 3958 Jedi Civil War), `activeNPCs` is always the 3661 list (10506-10510) and the era label is always 3661 (10499).
   - ABY dates never match the `BBY` regex.
2. **Two different stat sheets for the same canon NPCs.** For example:
   - Satele Shan: `CANON_PROFILES_3661BBY` forceSense 72 / Ataru 75 (3589-3590) vs `LORE_DATABASE` fS 82 / Ataru 80 (9059-9060).
   - Zym: Soresu 72 (3579) vs 76 (9070).
   - Malgus: forceControl 85 (3601) vs fC 90 (9039).
3. **Satele's tier contradicts her status in the same entry.** Her tier is 'Master' (9055), but `statusIn3661` says "Jedi Knight" (9057).
4. **The timeline window is wide.** ±30 years with "upcoming" events shown as GM-only. If the date is unparseable, the fallback still shows 3661 future events.
5. **Silent failure.** The whole lore block silently becomes empty on any exception (11105-11107).
6. **Typo.** "Satelel" appears at 9131, 9289, 10442, 10452, 10454 and 10476.

## Conflicts between sources (LORE_DATABASE vs Docs/SWRPG lore/)
| # | Legacy says | Canon file says | Severity |
|---|---|---|---|
| 1 | `situationNow` (3661): "Hydian Way blockade just broken by Hylo Visz. Coruscant riots ended." (8982); factionStates `blockadeActive:false`, Temple "rationing easing" (8976-8980) | Timeline: in 3,661 BBY (Year 20) the blockade **begins**, Coruscant riots **begin** and the Temple goes **on rationing**. The blockade is broken in **3,660 BBY (Year 21)** (Timeline lines 381-391). The seed block legacy copied is labeled "3,660 BBY / Year 21" (Timeline lines 476-489) | High: the campaign opens on the wrong side of the defining event of its year |
| 2 | Hylo Visz `statusIn3661`: "Just broke the Hydian Way blockade" (9114) | Broken in 3,660 BBY (Timeline line 391) | High |
| 3 | LORE_DATABASE contradicts itself: its own timeline has 3661 "Blockade begins … Jedi Temple on rationing" and 3660 "blockade broken" (10458-10465) | (internal) | High |
| 4 | Satele Shan: "Daughter of Bastila Shan" (9061) | "A **descendant** of the legendary Revan and Bastila Shan"; born 3,699 BBY (SW_Characters_09 lines 194-195). Bastila lived ~300 years earlier | High |
| 5 | Jace Malcom: "Republic SIS hero of Alderaan" (9105) | "An elite Republic **trooper** … rose to Supreme Commander" (SW_Characters_09 line ~252) | Med |
| 6 | Satele becomes Grand Master "~3,648 BBY after the Order relocates to Tython" (9057, 10476) | "attains that after the Sacking/Treaty era" (SW_Characters_09 line 214), no exact year | Low (not a contradiction; the legacy year is more specific than canon). *Later ruling: Grand Master 3,651 BBY ("D-283 amended"); the legacy ~3,648 is not used.* |
| 7 | `currentEra.label` "Year 20 of the Great Galactic War" with Year-21 faction seeds | Timeline: 3,661 = Year 20 and 3,660 = Year 21 (lines 377, 386) | Med (mixed years) |

Items I checked that agree with canon: Zym killed at the Sacking of Coruscant (3653); Malgus defeated at Alderaan (3667); Theron born ~3666 (age ~5 in 3661); Marr on the Dark Council from the war's start; the Abeloth / Luke / Vitiate apex ordering (SW_Characters_09 lines 44-52).

## Replaced by
- NPC power figures: Replaced by npc-generation.md (canon NPCs get hand-set values checked against the curve).
- Force ability rules: Replaced by force-catalog.md.
- Lore selection and injection: **None — needs a v2 spec.** v170-audit.md "What to keep" says LORE_DATABASE content should be checked against `Docs/SWRPG lore/` and merged there.

## Open questions for Jared
1. Does the campaign open before or after Hylo Visz breaks the blockade? Canon puts the break in 3660 BBY, but legacy runs 3661 as if it already happened.
2. Should v2 support eras other than 3661 BBY at launch? If yes, lore selection must be keyed by date for all eras.
3. Should the "FUTURE EVENTS (GM-only)" injection stay? It risks spoilers and forced railroading.
4. For a canon NPC that has two legacy stat sheets, which one (if either) should seed v2, or should both be regenerated per npc-generation.md?
