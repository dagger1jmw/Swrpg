# The other three tag maps against D-489's rules (2026-11-24; m8-tagmap-14b)

Nothing is changed. Each finding has a number so you can rule on it ("A3 yes, A7 no").

**Rules**

| Code | Rule |
|---|---|
| T1 | Realistic for a PC to be there |
| T2 | Standing and power the PC needs (rank, trust, fighting strength) |
| T3 | What kind of PC (side, role, ties) |
| D | Top duelists: at least a Master; a regular Master only holds one off briefly; beating one, or holding one off for long, is top tier |
| P | No premonitions as a reason or a lead |
| C | Closed systems are unbreakable; changed only earlier |

**Counts**

| Map | Findings | Read |
|---|---|---|
| A. 3,661-3,640, encoded | 29 (6 across the network, 23 on events) | all 78 events, 31 conditions, the scenes, PP-1 and PP-2, and the rules code |
| B. 3,640-1,000 | 26 | every row, PP-9 to PP-13 |
| C. 1,000 BBY-4 ABY | 30 | every row, PP-0, PP-3 to PP-8 |

The short version:

- **A fails most, for one reason:** the engine never asks who the player is or how strong. A1 to A3 fix most of the rest.
- **B and C mostly name who the player is** in the reworked plot points. Their failures are duels without the power bar, closed rooms, and rows whose guard does not match their plot point.
- **Twelve findings touch a specific ruling of yours.** They are marked **[ruled]** and listed at the end. The rest of PP-0 and PP-3 to PP-13 you reviewed too, before D-489.

---

## A. 3,661-3,640 BBY (world-event-tags-draft.md, src/data/worldNetwork3661.ts, src/features/world)

### Across the whole network

| # | Where | Rule | What fails | Suggested fix |
|---|---|---|---|---|
| A1 | All 31 conditions, all prerequisites, all scenes (`ConditionTag`, `actionMeets`, `fightMeets`) | T2, T3 | A test matches a place, a person and a kind of action. Nothing reads the player's side, rank or trust. Beyond the roll itself, a shop clerk and a Council Master count the same, and an Imperial can break a condition meant for the Republic | Add `who` to conditions, prerequisites and scenes: sides, roles, a minimum standing, optional ties. Nothing counts unless the player fits. The "who" for each condition is in the rows below |
| A2 | Fights and deaths of top duelists: the crucial roles of Malgus (3 events), Revan and the Emperor; `beat('darth-malgus')`; `taken('darth-malgus')` as foreknowledge | D | Any recorded win counts. Nothing says a PC below the bar fails however the rolls go. A foe an ally finished also counts as the player's (`wonFight` drops only foes an ally is *still* fighting) | Add a power bar to people and fights: below it, the fight can only buy time. Credit a top duelist only when the player fought them to the end. **Your call: who is on this map's list?** I suggest Malgus, Marr, Revan, the Emperor, Satele, Zallow and Zym |
| A3 | `SLEUTH` includes `forceSense`: 18 of the 31 conditions | P | Sensing something in the Force counts as investigating, as foreknowledge and as the break itself | Take `forceSense` out of every world-event test |
| A4 | `leadOnRecord` (selectors.ts) | P | Any fact or thread learned in a scene is a lead. One that came from a vision counts like any other | Mark facts and threads that come from a vision, dream or Force sense, and leave them out of leads |
| A5 | `SPEECH` includes `mindTrick`: 17 of the 31 conditions | T2 | A mind trick on Zym, Zallow, Satele, Malgus or a Chancellor counts as persuading them | Drop `mindTrick` when the person is a Force-user or guarded by them; for the rest keep it only where the PC is a Force-user |
| A6 | `force('Korriban')`, `force('Maelstrom')` (E.3660.korriban, E.3642.maelstrom) | T1, T2 | Any use of the Force at the place counts toward breaking a planet's defences or freeing Revan | Remove both tests |

### Event by event

"Who" is what A1's gate would hold.

| # | Condition (guard) | Rule | What fails | Suggested fix |
|---|---|---|---|---|
| A7 | E.3661.devaron, the blockade holds (medium) | T2, T3 | One won serious fight with Mandalorians anywhere on the Hydian Way before the battle makes the Jedi strike succeed | Who: a Jedi or Republic officer in the strike. Only during the battle, at Devaron; one fight is not enough |
| A8 | E.3661.belsavis_shange, secret (medium, not crucial) | T1, T3 | Belsavis is closed and secret, but anyone with a lead on the place can investigate there | Who: SIS or prison staff |
| A9 | E.3660.hydian_battle, Hutt backing (medium) | T2, T3 | Talking to anyone on Nal Hutta or Nar Shaddaa ends the Hutts' backing | Test it on a Hutt figure. Who: in a Hutt's service, a cartel contact, or an Imperial agent to the Hutts. Pickets: a Mandalorian officer or the Imperial liaison |
| A10 | E.3660.riots_end, supply restored (low) | T2 | One won fight with any smuggler or Republic crew stops every relief convoy | Medium. Who: commands the raiders (Mandalorian or Imperial) |
| A11 | E.3660.korriban, defences (high) | T1, T2, T3 | Two won serious fights with Sith at Korriban, any time from 3,660. An acolyte's own duels at the Academy would bring the planet down | Only during the assault. Who: a Knight or officer leading part of it, or a Sith defector with the defence plans. Very high; fights alone do not count |
| A12 | E.3659.visz_rumour, betrayal (low); E.3658.xandret, escape (medium) | T3 | Anyone with a lead. Kaas City is open only to Imperials, and one test is talking to Darth Baras | Visz: someone in Visz's circle or the Hutts'. Xandret: Imperial Intelligence, a Cipher, or a Sith household on Dromund Kaas; drop the Baras test |
| A13 | E.3654.peace_offer, deception (high) | T1, T2, D | Republic PCs can investigate Dromund Kaas. Having *met* any of seven Dark Councillors is a lead. Capturing Angral breaks it outright, and capturing Malgus is foreknowledge. One good talk with Zym or Berooken is believed whoever the player is | Very high. Prerequisites: the Council's orders seen by a Sith-side defector or Intelligence source, and proof carried out. Belief needs Knight standing or physical proof (as PP-15) |
| A14 | E.3653.alderaan_conference, attention (high) | T2, T3 | As A13. Foreknowledge can come from looking around Alderaan | Who: the delegation, its Jedi escort, or the SIS. Same belief test |
| A15 | E.3653.temple_strike, unaware (high), and the scene `coruscant-warned` | T1, T2, P | The target is known only inside Angral's fleet and Malgus's team, yet it can be learned by investigating Alderaan. The warning is one roll | As PP-21: only through a Sith-side defector (or someone already holding A13's proof). Very high, with the belief test |
| A16 | E.3653.temple_strike, reach (medium) | T2, D | One won serious fight with any Imperial at the Temple, any time from the start of 3,653, stops Malgus's strike. Beating Adraas does too | Only during the strike. Stopping Malgus in the Temple is top tier (Zallow, a Master, dies trying). An earlier route: the shuttle is refused or brought down (high; Coruscant traffic control or Temple security with a lead). A won fight there saves people, not the Temple |
| A17 | E.3653.temple_strike, grid (medium, not crucial) | T2, T3 | Any investigation or fight on Coruscant | Who: Republic security, SIS or a Jedi who can reach the grid controls; high |
| A18 | E.3653.sacking, hold (high): the PP-1 hinge | T2, C | With weak ground control, two won street fights drive off an armada, and beating Angral alone does it. Angral is guarded by the fleet | Who: an officer or Jedi leading Republic forces. Very high: prerequisites, a force to lead and a lead on the fleet. Angral: only if the player can reach Angral on the ground. The navy half waits for ship combat |
| A19 | E.3653.zym, unguarded (medium) | T2 | Anyone Zym meets can talk Zym into guards | Who: a Jedi, or Temple or Senate security. Beating Braden stays |
| A20 | E.3653.deaths, Eleena (medium) | D, C | Breaks by beating Malgus at medium. Malgus kills Eleena alone with her, by his own choice | Unbreakable at the moment. Earlier: she leaves Malgus's side (high; someone close to her) |
| A21 | E.3653.deaths, Adraas (medium) | T1, D | Talking to Adraas saves Adraas. Malgus kills Adraas at Adraas's own manse | Who: in Adraas's household, warning before it. Standing between them is top tier |
| A22 | E.3653.ord_mantell_fleet, unexposed (medium) | T2, T3 | Anyone who looks around Ord Mantell exposes an admiral | Who: a Republic officer, investigator or SIS agent, with evidence (belief test) |
| A23 | E.3653.temple_shelved, hostile (medium) | T2 | One decisive talk with Am-Ris, Janarus or Saresh turns the Senate | High. Who: a senator, a senator's aide with access, or a Master speaking for the Order |
| A24 | E.3653.alderaan_secession, anger (low) | T2 | One talk with Panteer keeps Alderaan in the Republic | Medium. Who: an Alderaanian noble or aide, a senator, or a Jedi envoy |
| A25 | E.3643.quesh (medium), E.3642.balmorra_freed (high), E.3642.taris_invasion (medium), E.3641.belsavis (medium) | T2, T3 | One or two won fights by a trooper stop a treaty, a planetary rising, an invasion and a prison raid. On Belsavis a fight is also the foreknowledge | Who: command rank on the right side (Quesh: an Imperial or cartel agent). Fights count only under that command, during the event. Taris and Belsavis to high. A fight is never foreknowledge |
| A26 | E.3643.desolator, secret (medium), and Angral's role | T2, C | A Dark Lord's superweapon at medium, believed from anyone. Killing Angral aboard Angral's flagship would count like any other win | High, with the belief test. Who: a Jedi or SIS agent on Tarnis's trail. Aboard the flagship is a closed system unless the PC already serves there |
| A27 | E.3642.maelstrom, imprisoned (high), and Revan's role | T1, C, D | A secret prison. Fights or the Force at the Maelstrom free Revan, and "having met Revan" is a lead nobody can have | Closed except to the Republic strike team (once it has the location) and the Emperor's own jailers. Freeing Revan early: very high. Killing the prisoner: unbreakable |
| A28 | E.3642.plan_zero and E.3641.baras_council (Baras: C); E.3640.ilum (Malgus: C); E.3640.voss (the Emperor: C); E.3640.voice | D, C | A lost role is the only way to break them, with no bar. The Emperor in the Dark Heart and the Voice's throne room are closed | Baras: at least a Master, and someone who can reach Baras. Malgus: top tier. Voss and the Voice: unbreakable. E.3653.decimus (Azamin) also needs a "who" |
| A29 | Scenes `treaty-incident-*` (medium): PP-2's early collapse | T2 | A won lethal fight with one soldier on Balmorra, Taris, Alderaan or Ord Mantell is a diplomatic incident | Who: a serving soldier, agent, Jedi or Sith, so that it can be blamed on a side. Alternative 3's "three leaders lost" in PP-1 takes A2's bar |

**Passed:** the Treaty's hostage condition, E.3661.riots (standing at the start), the Great Hunt and the Lesser, Hylo Visz's stopping (your ruling 4), E.3651.tython, the PP-2 tracker (four of seven), and every event with no condition and no top duelist.

---

## B. 3,640-1,000 BBY (world-event-tags-3640-1000BBY-draft.md; not encoded)

| # | Where (guard) | Rule | What fails | Suggested fix |
|---|---|---|---|---|
| B1 | E.3638.makeb, core stabilised (medium) | T2, T3 | Nobody is named | Who: an Imperial engineer or officer on Makeb, or Cartel or Republic saboteurs with access; high |
| B2 | E.3637.yavin4, the slaughter (high); PP-9 alternative 3 | T2, D | No prerequisite, no "who". "Revan's war is ended" means beating Revan. A coalition is made or stopped by Satele and Marr | Very high. Who: an adviser or envoy to Satele, Marr, Theron or Lana. Prerequisites: a lead on the Order of Revan's site, and a lead on what the Emperor gains. Beating Revan: top tier |
| B3 | E.3636.ziost (no condition) | C | Vitiate possesses a world; not declared | Declare unbreakable once it starts. Earlier: B2, or getting people off Ziost (saves people only) |
| B4 | PP-9 step 1, the Korriban raid (low) | T2, D | Posting to Korriban at low guard repels two princes of Zakuul, or keeps Arcann whole | Repelling the raid: very high, command rank. Atroxa living: high (on Atroxa's guard). Arcann unmaimed: top tier, or never |
| B5 | PP-9 step 2, Thexan (high) | T1, C, D | The scene is Valkorion's throne room and two princes. "Someone stops the fight" needs a PC in the room who can hold Arcann | Closed. Only step 1 can change it |
| B6 | PP-9 step 3, Marr's expedition (medium) | T2, D | Five different feats at one medium guard. Turning a fleet needs command; killing the Outlander is beating a protagonist | Split: ordered home, high (Marr's or the Republic commander's staff); the ship gets away with the Outlander, very high (captain or pilot of that ship); killing the Outlander, top tier; Marr escaping, high |
| B7 | PP-9 step 4, the escape (very high) **[ruled]** | C, T1 | A flagship full of Knights of Zakuul, Arcann aboard. Arcann brought two survivors, Marr and the Outlander, so a third captive has to be added | By the rule, closed: alternative 2 moves to B6's "gets away". Or keep it as your named exception |
| B8 | E.3636.conquest, the Fleet answers the Throne (high) | T1, C | No step reaches it and nobody is named | Unbreakable (the Throne in the Spire) |
| B9 | PP-10 step 1, Lana's search (medium) | T2, D | "Caught or killed" at medium. Lana is elite, and the network spans worlds | High. Who: Knights or Zakuul intelligence with authority over the hunt, or a trusted member of the cell. Beating Lana: at least a Master |
| B10 | PP-10 step 2, the break-in (high) | T2 | No prerequisite. "The antidote is missing" needs someone in the cell | Split: Spire security (high; prerequisite: posted to the vault levels), the cell (high; prerequisite: trusted by Lana or Koth) |
| B11 | PP-10 steps 3 and 4 (medium) | T2, D | Vaylin catching them, or the clamps holding, with nobody named. Any fight with Vaylin is a fight with a top duelist | Who: Vaylin's hunters or the Fleet's command; Heskal's Scions or Asylum's dockmaster. Vaylin: top tier |
| B12 | E.3630.zakuul, the fight in the Commander's mind (high) | C | Inside one mind | Unbreakable itself; only the three tags before it (alternative 3) |
| B13 | PP-10 alternative 3: Arcann killed at Odessen (medium); Vaylin dies elsewhere (high) | D | Killing Arcann or Vaylin without the bar | Both top tier. Arcann never turned: high, through Senya (a trusted ally of hers) |
| B14 | PP-10 alternative 4 (Zildrog): expose the Order (medium), GEMINI 16 (high), Copero (high), move the Fleet (medium) **[ruled]** | T2, T3 | No "who" and no prerequisites. Ordering the Fleet needs the Throne | Who: the Alliance's inner circle, or Theron's contacts. Step 4 very high: the Commander's council. Step 1 needs the belief test |
| B15 | E.3626.tenebrae | C | Inside Satele's mind; not declared | Declare unbreakable |
| B16 | PP-12 step 2, the disappearance (medium) | D | Taking a Jedi Master alone, in hiding, at medium | Finding Phanius: medium. Stopping Phanius: at least a Master, or bringing the Council. Very high alone |
| B17 | PP-12 step 3, among the clans (high) | T2 | Exposed to whom? A clan servant's word changes nothing | As the Ziost frame (PP-14): only through a clan lord. Prerequisites: in a clan, and a lead on the missing Master |
| B18 | E.2000.schism, the clans accept Phanius (medium) | T3 | No step reaches it | Fold it into step 3 |
| B19 | E.1466.mizra, the coordinator is killed (medium) | T1, T3, P | Nobody named; the easy reading is a Jedi who senses the sniper | High. Who: the coordinator's guard, or a Sith scout who fails the shot. Prerequisite: a lead on the sniper (a captured order, a spotter). Not a sense of danger |
| B20 | PP-13 alternative 1, Bane's order to Nyras (high) **[ruled]** | T2 | "In the Sith fleet or near Kaan's tent": rank and file cannot stop an admiral | Who: Nyras's staff, the courier, or a Lord who can countermand. Very high. Prerequisites: aboard Nyras's ship, and a lead on the order |
| B21 | PP-13 alternative 1, Farfalla's relief (medium), the envoy (medium) **[ruled]** | T2 | Beating a relief fleet needs command. The envoy's killing needs a place in a camp | Fleet: command rank, high. Envoy: who: a soldier or aide on either camp's guard; high. Hoth's vision of Pernicar is lore and is never a lead |
| B22 | PP-13 alternative 2, the Academy (high) **[ruled]** | T2 | A student's doubts about Bane reach Qordis and count | Only with proof, through an instructor. Student duels stay, as both are students then |
| B23 | PP-13 alternative 2, Lehon (high) **[ruled]** | D, T3 | Finishing Bane with Kas'im, at high. Kas'im, a top duelist, loses | Top tier, very high. Who: a Brotherhood Lord Kaan trusts. Taking the holocron first: very high, with a lead to the temple |
| B24 | PP-13 alternative 2, the drone (high); E.1000.bane_lehon, Bane reaches the holocron (high) **[ruled]** | T1, T3 | Nobody would be at Lehon or know of the drone | Drone: who: Kaan's signals staff on Ruusan; very high, two prerequisites. The row follows B23 |
| B25 | PP-13 alternative 2, Ambria (medium) **[ruled]** | T1, D | Why is the PC there? Even poisoned, Bane kills everyone in reach | High. Who: the family, Caleb's patient or helper, or a hunter Kaan or Githany sent. Striking Bane then: at least a Master (weakened), top tier once healed |
| B26 | PP-13 alternative 3, hold Bane until the bomb (very high) **[ruled]** | D | Right in spirit, but not marked | Mark top tier. Who: an Army of Light Jedi or a Brotherhood Sith at the cave |

**Passed:** PP-11 (no steps), PP-12 steps 1 and 4 and alternative 3, the Apatros and Kashyyyk window (Dessel is nobody yet; add "who": a miner, a Republic soldier or a Gloom Walker), the holocron mission on Nathema, and the local rows.

---

## C. 1,000 BBY-4 ABY (world-event-tags-1000BBY-4ABY-draft.md; not encoded)

| # | Where (guard) | Rule | What fails | Suggested fix |
|---|---|---|---|---|
| C1 | E.1000.thought_bomb, Bane is outside the cave (high) | D | The same feat as B26, which is very high | Very high, top tier |
| C2 | E.1000.reformation, the Senate ratifies (medium); PP-0 R2 | T2, T3 | Nobody is named; R2 says only "high-standing" | Ratification: high; a senator, or an adviser to Valorum. R2: a Jedi Master or Jedi Lord with a following |
| C3 | E.65.sidious, Plagueis finds Palpatine (high) | T1, C | No step, and no reason for a PC to be between two unknown men | Unbreakable, unless the PC serves Damask Holdings or House Palpatine with a lead |
| C4 | E.32.anakin_freed, Qui-Gon lands on Tatooine (medium) | T3 | Nobody is named | High. Who: the royal ship's crew, the handmaidens or the escort, with a reason to choose another port |
| C5 | E.32.election, Palpatine's identity stays secret (high) | T2 | The row says high; PP-3 alternative 3 says very high | Very high in the row |
| C6 | PP-3 step 1, Eriadu (high) | T2 | No prerequisite. Escorts cannot stop the murders by being there | Prerequisite: a lead inside the Nebula Front. Showing the manipulation needs the belief test |
| C7 | PP-3 step 3, the Naboo stall (medium) | T2 | A committee aide cannot force the Senate | High. Who: a senator, or a Jedi Master reporting for the Council. An aide can only feed one of them |
| C8 | PP-3 step 4, the Queen's motion (medium) | T2 | Any handmaiden or escort can talk the Queen out of it | High. Who: someone the Queen trusts (a close handmaiden, Panaka's staff, Qui-Gon's circle) |
| C9 | PP-4 step 1, the order (high) | T2, T3 | A Kaminoan contact cannot stop an order | Who: a Jedi Sifo-Dyas trusts, or Damask Holdings' inner staff |
| C10 | PP-4 step 2, Sifo-Dyas on the Pyke mission (high) | D, C | Dooku arranges the killing; saving Sifo-Dyas by fighting Dooku is a top duel | Escape before the ambush: high, with a lead on the Pykes. Fighting Dooku: top tier |
| C11 | E.22.powers_vote (medium) against PP-4 step 4 (high) | T2 | Two guards for one thing. Keeping Amidala on Coruscant is open to any guard | High in both. Who: a senator with votes to move, or someone Amidala trusts; prerequisite: a lead on the attempts |
| C12 | E.22.marriage, kept secret (medium); PP-5 part A step 4 (no guard) | T3 | Nobody is named | High. Who: Naboo or Padmé's household, or a Jedi close to Anakin |
| C13 | E.19.windu, Anakin chooses Sidious (high); Sidious survives (high) | T2 | The rows say high; PP-5 says very high | Very high in both rows |
| C14 | PP-5 part B, the arrest (very high) **[ruled]** | D | "Outcomes about equally likely" whoever the player is. A regular Council Master falls as fast as Fisto | Outcomes 1 and 2b need a top-tier player. A Master below it: 2a, or a moment bought for Windu |
| C15 | E.19.order66, the clones obey and the Jedi are scattered (high, medium); PP-5 part C | T3 | No "who" | Obey: a Jedi General of that unit, or an ARC or commando, with trust built in play. Scattered: the Council or the High Command staff; high |
| C16 | E.19.knightfall, E.19.mustafar, E.19.coruscant (the Dooku duel) | D, C | Vader and Dooku duels, not declared | Knightfall: beating Vader is top tier; defenders can save people. Mustafar, and the duel aboard the *Invisible Hand*: closed |
| C17 | E.19.twins, the twins stay hidden (high) | T1, T3 | No step | Very high. Who: Organa's ship or Polis Massa staff, or an Imperial investigator with a lead on Padmé. Otherwise closed |
| C18 | E.32.battle_naboo, E.32.plagueis_killed | D, C | The Maul duel has no bar; Plagueis dies asleep beside Sidious | Maul: at least a Master, top tier to beat. Plagueis: closed |
| C19 | PP-6 step 1, Galen's recruiting (high) | T2 | Exposing Galen needs belief, not only leads | Belief test: the cell's trust, or proof |
| C20 | PP-6 step 2, the raid (high) | D | Vader leads it. Getting the leaders out past Vader means holding Vader | Seeing the build-up first: high. Holding Vader: a Master, briefly; longer is top tier |
| C21 | PP-6 step 3, the Death Star rescue (very high) **[ruled]** | C, D | The fight is in the Emperor's chamber. Galen nearly kills Vader and Sidious | Inside the chamber: closed. The step is the hangar and the prisoners' way out |
| C22 | PP-6 alternative 3, Galen survives (very high) **[ruled]** | C, D | A PC would have to hold Sidious in a closed room | By the rule, only an earlier change (Galen never goes up, or the prisoners are not taken there). Or keep it as your named exception, top tier |
| C23 | E.2.corellian_treaty, the cells agree (medium) | T3 | Nobody is named | High. Who: an aide or officer of one of the three senators, or Kota's militia |
| C24 | E.0.plans (high) against PP-7 step 1 (medium) | T2 | Two guards. "Breaking Toprawa" needs command | High in both. Who: Imperial Intelligence or a garrison officer; a traitor needs a place in the cell |
| C25 | PP-7 step 3, the homing beacon (medium) | T1 | Leia's rescue party is Luke, Han, Chewbacca, Obi-Wan and the droids: a closed group | Who: an Alliance technician at Yavin who sweeps the *Falcon*; high. Leia's own remark that the escape was too easy is a lead |
| C26 | PP-7 step 4, the trench (very high), and the row "the weakness is exploited" (high) | T2, C | Two prerequisites missing. The row reads as if Luke's shot could be broken, which PP-7 says it cannot | Prerequisites: in Vader's flight, and warned of the *Falcon* or the target. Reword the row: "Luke gets the shot" |
| C27 | PP-7, Alderaan: Leia not captured; E.0.kenobi | D, C | "A Jedi strong enough to beat Vader", without the tier; the Kenobi duel is not declared | Top tier. The Kenobi duel: closed (Obi-Wan's own choice) |
| C28 | PP-8 step 1, the plans (medium) | T2 | A high-ranking Imperial working against the Emperor's design, or the Bothans failing, at medium | High; Imperial side very high. Who: the *Suprosa* convoy's command, the Bothan Spynet or Madine's commandos |
| C29 | E.4.endor, Anakin turns back (high); the shield falls (medium) | C, T3 | Your own example: the throne room is unbreakable. The shield row has no "who" | Anakin: unbreakable, except Vader's or the Emperor's earlier death (top tier). Shield: only through PP-8 step 3 |
| C30 | Roles Vader, Dooku, Maul, Sidious, Plagueis, Yoda, Mace and Anakin where a lost role alone breaks an event | D | As A2 | List them as this map's top duelists, with the bar. Grievous: at least a Master |

**Passed:** PP-3 step 2, PP-4 steps 3 and 5, PP-5 part A steps 1 to 3 (they are the pattern for your three tests), PP-7 step 2, PP-8 step 2 and step 3 (your own example), PP-0 R1 and R3, and E.16.maul_dies. No step in this map rests on a premonition; Anakin's and Luke's visions are lore and are used only as what they tell others.

---

## For you

1. **Findings that touch your earlier rulings:** B7, B14, B20 to B26 (PP-9, PP-10, PP-13) and C14, C21, C22 (PP-5, PP-6). **Does D-489 override them, or do some stay as named exceptions?** I'd override the guards and bars (B14, B20 to B26, C14). B7, C21 and C22 remove a step or alternative you agreed to, so those need a yes each.
2. **Who are the top duelists of maps A, B and C?** My lists: A, in A2. B: Arcann, Thexan, Vaylin, the Outlander, Malgus, Revan, Bane, Kas'im. C, in C30.
3. **Should A1, A2 and A3 be built first?** They are code and cover most of A. The rows of A would follow as data.
4. **Also seen, not one of the four rules:** many high and very high guards in B and C name no prerequisite. The network's own checks would refuse them when they are encoded.

Not read: the 4-44 ABY draft in docs-v2/spec, which is not committed.
