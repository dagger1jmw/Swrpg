# Lore batch 4, 2026-11-21: Jedi ranks, councils and roles (instructions for Claude Code)

Run this after lore batch 3. Read the whole file first, then carry it out in order. Don't change game code. One commit at the end.

## 1. Add the lore files

Copy into `Docs/SWRPG lore/` (research bot, reviewed in chat):
1. `SW_Jedi_Ranks_Councils_Roles_AllEras_Part1.md`
2. `SW_Jedi_Ranks_Councils_Roles_AllEras_Part2.md`

Mark "Jedi ranks, councils and roles, all eras" done in `docs-v2/lore/RESEARCH_QUEUE.md`, and add both files to the lore index. These files extend `SW_Jedi_Order_Ranks_Council_OldRepublic.md`; they don't replace it.

## 2. Log decisions in docs-v2/decisions.md (M7)

Number them in sequence after the last D-number. Each entry names its lore file. "P1-n" and "P2-n" are the files' decision numbers.

### Councils and leadership

- **[P1-1] High Council origin:** the founders' councils existed from the Order's start. An inner circle of 12 Masters existed by the Great Hyperspace War (5000 BBY) with no fixed home, and it was formally constituted by 3997 BBY. The "after the Great Sith War" version is the move to a Coruscant spire, not the founding.
- **[P1-3] Grand Master and Master of the Order:** two offices, often held by one person. Grand Master is the head of the whole Order, for life or until given up. Master of the Order is the elected leader of the High Council. The engine stores them as two flags an NPC can hold together.
- **[P1-4] Nomi Sunrider:** recognized as overall leader at Exis Station (3986 BBY). Treat her as Grand Master in effect; she is on the Grand Master list.
- **[P1-5] Fae Coven:** Grand Master from c. 990 BBY for at least a century; end date unset (after 896 BBY).
- **[P1-6] Yoda:** the office of Grand Master ends with the Order in 19 BBY. Survivors and the narrator may still call him Grand Master until his death (4 ABY), as a courtesy.
- **[P1-9] Awdrysta Pina:** keep as Grand Master (by 24,500 BBY), [gray]. It fits.
- **[P1-11] Legacy era:** Kol Skywalker is "head of the Council". Leave the formal titles (Grand Master, Master of the Order) unset; the Master of the Order reading is Wookieepedia's own inference.
- **[P2-1] Service Corps:** overseen by the Council of Reassignment. This confirms the decision already logged.
- **[P2-2] NJO Masters' Council:** formed during the Yuuzhan Vong War, continued to 35 ABY, and formalized as the 12-seat High Council in 36 ABY.
- **[P2-4] Gray items kept:** the High Council appoints members by unanimous vote (backed by *The Jedi Path*'s rule for all Coruscant Councils), and the Jedi Artisan role. Both fit.
- **[P2-10] Anakin on the Council:** the first Knight appointed by a Chancellor. Knights had sat before during the transition to Master (Ki-Adi-Mundi).
- **Late Republic structure (design default):** the High Council has 12 seats (5 for life, 4 long-term, 3 limited-term), plus the Councils of First Knowledge, Reconciliation and Reassignment (5 seats each). All four are dissolved in 19 BBY.
- **SWTOR era (default start, c. 3661 BBY):** Grand Master Zym until 3653 BBY, then Satele Shan. Keep the logged Satele dates (Master 3651, Grand Master c. 3648, term ends c. 3636); the new file's 3651–3636 range is consistent with them. Council members are rarely together, for security. Wartime succession: Jedi summoned to replace fallen Councilors often serve only until stability returns. Barsen'thor is a ceremonial title, given only twice before the Cold War-era Consular received it.

### Rank and membership

- **[P1-2] Becoming a Master:** the High Council promotes at its discretion. The usual grounds are training a Padawan to Knighthood, modified Trials or noted service, and some Knights are never promoted. Where Masters may train several apprentices (before c. 3996 BBY, and in the NJO), training several to Knighthood is the common path. Self-declared Masters are accepted in the Old and New Sith Wars and in times of disbandment, with a reputation cost among orthodox NPCs. In the NJO, promotion is by Luke or the Council, for mastery or deeds.
- **[P1-7] Jedi Lords:** feudal Jedi Lords existed for centuries in the New Sith Wars. The Grand Council period (c. 1100–1000 BBY) is the best documented. The title is renounced at Ruusan.
- **[P1-8] Order size after the Jedi Civil War:** fewer than 100. Most of them gathered at Katarr (the "last known hundred") and died there, leaving only scattered survivors (Surik and the Lost Jedi).
- **[P2-3] Order size before the Purge:** design default of about 10,000 Knights and Masters in 19 BBY, from "fewer than 100 survivors, about one percent" (*Star Wars Insider* 87). Initiates, Padawans and the Service Corps come on top. Label it a design default derived from lore. Lucas's 1977 "several hundred thousand" predates the prequels and stays as [BTS], not used.
- **[P2-5] Right of Denial:** keep as a Clone Wars Padawan option to refuse a military rank (handing the lightsaber in to the Temple), [last resort].
- **[P2-6] Sentinel title:** available in every Republic era (it appears in the Jedi Civil War). In the NJO the role exists without the title until it returns by c. 137 ABY.
- **[P2-7] SWTOR advanced classes:** Sage, Shadow and the rest are flavor names for that era only; they have no mechanics of their own.
- **[P2-9] The Lost Twenty:** only Masters who resigned voluntarily (Dooku the 20th, 32 BBY). Knights who left, such as Bardan Jusik, aren't counted, and exiles and expulsions are separate.
- **[P2-11] Ossus survivors:** accept the reconciliation. About half the Order survived, mostly the half that hadn't withdrawn to Ossus.
- **Expulsion (design default):** in Republic eras, a hearing before the Council of Reconciliation with testimony. Outcomes are exile, stripped rank, or reassignment to the Service Corps.

### For M7 design (§15 note, not decisions)

- A player Jedi's path to the Council: Master rank, then noted as "Old Guard", then a limited-term seat in a crisis, then a long-term seat, then a lifetime seat on a vacancy. In the Clone Wars a Chancellor's appointment gives a seat without Master rank. In the NJO a seat opens by unanimous vote, and vacancies can last years.
- NPC role generation: draw from the specialist roles table filtered by era. There's no Service Corps after 19 BBY, and Jedi Generals exist only in war eras.
- The Clone Wars order of battle (10 High Generals, 20 Senior Generals, 80 corps, 320 legions, 1,280 regiments with Padawan Commanders) is the default for a Jedi's wartime posting.

## 3. Research queue

Add to the Force traditions entry: make sure it covers the Paladins, the Iron Knights, Potentium followers and the Corellian Jedi (P2-8).

## 4. Commit

One commit for all of the above.
