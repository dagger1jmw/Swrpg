# Lore batch 9, 2026-11-21: Dromund Kaas and Kaas City (instructions for Claude Code)

Run this after lore batch 8. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy into `Docs/SWRPG lore/` (research bot, reviewed in chat):
1. `SW_Dromund_Kaas_KaasCity_OldRepublic_Part1.md` (the planet, Kaas City, the Citadel, the Dark Temple, location table)
2. `SW_Dromund_Kaas_KaasCity_OldRepublic_Part2.md` (daily life, other Imperial worlds, NPCs)

Mark the topic done in `docs-v2/lore/RESEARCH_QUEUE.md` and add both files to the lore index.

## 2. Log decisions in docs-v2/decisions.md (setting data)

Number them in sequence after the last D-number. Each entry names its lore file. Numbers in brackets are the bot's decision numbers.

### Where Imperial Force-sensitives train

- **[1] Academies in 3681–3653 BBY:** Korriban is the main acolyte academy from its recapture in 3681 BBY. Force-sensitives found anywhere in the Empire are sent there "willing or not". This includes Force-sensitive slaves during the war, a sourced route for a slave-born start. The Dromund Kaas Sith Academy (attested before the war for Scourge and Malgus) continues as a lesser academy, tagged [inferred] for the window. The Sith Sanctum in the Citadel is the Sith Order's headquarters.
- **Imperial-born childhood (design default, consistent with the logged recruitment rule):** wealthy families may hire private Force instructors before the academy (as Malgus had). Families who hide a child's Force-sensitivity are punished (Thana Vesh's family is the sourced example). The age of testing and of departure is not sourced; it's set in M7.

### Kaas City layout (consistent with the Coruscant rule)

- **[2] Layout in the window:** attested places are fact (the Citadel, Sith Sanctum, Dark Council chamber, the Emperor's chambers, parade streets, air taxis, the spaceport with customs). Kaas City wasn't sacked, so long-standing places attested both before and after the window (the Nexus Room, Larvit's store) may be used in the window, tagged "unconfirmed in window". SWTOR Cold War places with no date (the Galactic Trade Center, the opera, Kaas Falls) may be used under the same tag. Invented places get the `invented` flag.
- **Not available before 3653 BBY:** the Spires of Victory (commissioned after the treaty), Vaiken Spacedock ([13], built in the Cold War), the Kaas City Expansion district and Outpost, Outpost Warden, the six named hubs as a district system, and the reopened Dark Temple.
- **Dark Temple:** sealed for the whole window (c. 4600 to 3643 BBY). For children it's a forbidden place and a legend.
- **[3] Hub 3's office:** Ministry of Logistics (post-window detail).
- **[4] Ministry of Logistics headquarters in the window:** the Imperial Citadel. It moves to Ziost in the Cold War.
- **[9] Passes and curfew in the window:** none is attested. Design default: a citizens-only public transit system with Ministry of Logistics passes, extended back from the Cold War as a campaign invention (tagged `invented`), because it fits the Ministry's long-standing control of transit. No standing curfew; martial law and curfews are emergency measures only (as after the c. 3950 BBY Purge riots).
- **Weather:** near-constant rain and lightning under permanent cloud, caused by the Emperor's dark-side rituals. Outdoor scenes default to storm.

### History and NPCs

- **[5] Calypho:** arrested on Korriban, held and judged in the Dark Council chamber on Dromund Kaas (c. 3678 BBY).
- **[6] Malgus:** born on Dromund Kaas in 3700 BBY, raised on his adoptive father's off-world estate, then sent to the Dromund Kaas academy.
- **[7] Vaiken's terentatek kill:** 4904 BBY.
- **[8] The 4980 BBY exodus:** a small founding population (eight transports, hundreds of people). The "whole remaining Empire" phrasing is treated as rhetoric.
- **[10] Location:** the Dromund system (Esstran sector, Stygian Caldera).
- **[11] Elara Dorne's enlistment:** 3648 BBY.
- **[12] Ord Radama:** a Republic-held world in the Esstran sector, contested in 3660 BBY (the Harrower Disaster, then the Reconquest). It isn't an Imperial home world.
- **Wartime Kaas City:** victory parades and ceremonies (3678 BBY), the Red Legion branded by Darth Ekkage, and the Dark Council headquartered in the Dromund Kaas chamber during the war. The capital is never reached by Republic attack. Late in the war, whole worlds are stripped for the war effort.
- **Society defaults (general, undated, nothing contradicts them for the window):** Sith purebloods and Humans are treated as master races. Slavery is hereditary and permanent (mostly Twi'leks, Duros and Zabraks). Non-Force-sensitive purebloods are killed or enslaved unless their family buys them a post. Every non-Force-sensitive adult is conscripted, with live-fire jungle training. The Emperor is revered as god and king, and the news is propaganda from the Outreach Bureau.

## 3. §15 notes for M7

- Game notes for an Imperial-born start (a military-family townhouse, private instructors, Imperial Guard sentries as childhood idols, the jungle edge, parade routes, departure for Korriban as the opening transition) and the slave-born Force-sensitive route are M7 candidates.

## 4. Commit

One commit for all of the above.
