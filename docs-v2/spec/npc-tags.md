# NPC tags

Moved from `SW_Legends_Galaxy_Timeline.md` on 24 Nov 2026 (D-484), when that file was retired. Design data, not lore: the numbers were written for the old simulator.

**Status: not built.** No code reads the tags, and no lore file, spec or test used them when they moved; canon NPCs are placed by the roster and the world network (npc-generation.md, world-events.md). This file is where the tags live if a feature needs them. Its "scripted event" is today's world event.

## The tags

Tags define deployment probability. Scripted events override tags when a character is explicitly placed at a date and location.

| Tag | HQ Presence | Deploy % | Mission Types |
|---|---|---|---|
| `[grandmaster]` | 90% | 5% | Never deploys except civilization-level crisis |
| `[council_member]` | 80% | 15% | Diplomatic summits, major crises only |
| `[jedi_archivist]` | 90% | 8% | Rare research expeditions; almost always in archives |
| `[battlemaster]` | 65% | 30% | Training trips, demonstration missions |
| `[temple_instructor]` | 70% | 20% | Field training trips, occasional crisis response |
| `[jedi_guardian]` | 40% | 55% | Combat, escort, border patrol, threat response |
| `[jedi_sentinel]` | 45% | 50% | Investigation, infiltration, criminal network disruption |
| `[jedi_consular]` | 55% | 40% | Diplomacy, Force research, healing missions |
| `[jedi_shadow]` | 25% | 70% | Undercover, espionage, Dark Side artifact retrieval |
| `[jedi_watchman]` | 30% | 60% | Stationed at regional post; sector patrol |
| `[jedi_general]` | 10% | 85% | Battlefield command — wartime only |
| `[jedi_healer]` | 70% | 25% | Deployed to battle zones; usually at Temple |
| `[padawan]` | 70% | 25% | Travels with Master only |
| `[youngling]` | 98% | 1% | Never deployed alone |
| `[sith_emperor]` | 95% | 1% | Throne world only; never directly engages |
| `[dark_council]` | 60% | 35% | Administrative; occasional field |
| `[sith_lord]` | 30% | 65% | Combat, conquest, personal agendas |
| `[sith_apprentice]` | 40% | 55% | With Master or assigned missions |
| `[sith_warrior]` | 20% | 75% | Front-line combat, conquest |
| `[sith_inquisitor]` | 35% | 60% | Interrogation, Force research, espionage |
| `[sith_assassin]` | 15% | 80% | Targeted elimination, covert operations |
| `[republic_military]` | 20% | 75% | Battlefield, patrol, garrison |
| `[diplomat]` | 50% | 45% | Negotiation missions, summits |
| `[smuggler]` | 10% | 85% | Always moving; rarely stays anywhere |

**Tag Stacking:** Multiple tags average their deployment percentages.
**Wartime Modifier:** During active major war, `[jedi_guardian]` +15%, `[jedi_general]` +20%, `[temple_instructor]` -10%.
**Scripted Override:** A character in a scripted event at a specific date has their location forced regardless of tags.
