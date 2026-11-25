# World event tag map, 3661–3640 BBY (draft for review)

Design data for the tag network in the M8 design notes ("World events: the tag network and divergence"). Drafted by Claude, 23 Nov 2026. **Reviewed by Jared 2026-11-23 (rulings in section 6); built in src/data/worldNetwork3661.ts (M8 Phase B, D-467). Brought to D-489's design rules 2026-11-24 (D-490, D-492): section 7 says who can break what.**

- **Facts** (dates, who, what happened) come from SW_Timeline_3700_3600BBY Part 1 and Part 2; each event names its timeline row. No new lore is added.
- **Tags are design calls**: which roles are replaceable, which conditions are crucial, and how hard they are to break. They are not lore.
- **Scope:** M8 checklist items 1 and 8 (3661–3640), plus the Treaty's collapse in 3641. The Eternal Empire and later events are left for a later pass.

## How to read it

**IDs.** Events are `E.<year>.<name>`; outcomes are `O.<name>`. An event *consumes* outcomes (its inputs) and *produces* outcomes that later events consume. That is the network the ripple walks.

**Roles.** `R` = replaceable: if the person is gone, someone of similar standing takes over and nothing downstream changes. `C` = crucial: if they are gone, the event diverges.

**Conditions.** Each has a crucial flag and a guard (how hard it is to break):
- **low:** one scene or a single good roll can break it;
- **medium:** needs a deliberate effort (a mission, an investigation, a won fight);
- **high:** needs foreknowledge or extraordinary action, such as uncovering a secret held at the top or killing a heavily protected figure.
- **very high** (Jared, 2026-11-23): harder than high. Several steps that each must succeed, or a much harder feat.

**Standing state.** Outcomes marked *(start)* are already true at the 3661 start (the M7 control table and D-400). Events can consume them.

**Plot points.** Events marked **[PP-n]** feed a major plot point tracker (section 4). Only those get authored alternatives; everything else diverges under the narrator's direction.

**Protagonist roles (ruled).** Players never follow a SWTOR class-protagonist path. The class heroes (Hero of Tython, the Emperor's Wrath, Darth Nox and others) are always NPCs, written as `NPC (protagonist)`. If the timeline diverges, each still exists and takes a key role similar to their own in that time frame.

---

## 1. War years, 3661–3654

| ID | Date | Event (timeline row) | Roles | Conditions | Consumes | Produces |
|---|---|---|---|---|---|---|
| E.3661.blockade | 3661 *(start)* | Mandalorian Blockade of the Hydian Way (P1, 3661 row 1) | Mandalore the Lesser: R | — (standing at start) | — | O.blockade_active |
| E.3661.devaron | 3661 | Battle near Devaron: a Jedi strike on the blockade fails (P1, 3661 row 2) | Jedi strike leader: R | The blockade holds: crucial, medium | O.blockade_active | O.devaron_failed |
| E.3661.riots | 3661 | Coruscant riots begin as supplies are cut (P1, 3661 row 3) | — | The blockade cuts supply: crucial, low (ending the blockade early prevents them) | O.blockade_active | O.coruscant_riots |
| E.3661.satele_recall | 3661 | Satele Shan recalled to Coruscant (P1, 3661 row 4) | Satele Shan: C (her later arc depends on it) | — | — | O.satele_on_coruscant |
| E.3661.belsavis_shange | 3661 | SIS imprison Prince Shange in the Belsavis Tomb (P1, 3661 row 5) | SIS team: R; Shange: C | The capture is secret: not crucial, medium | — | O.shange_imprisoned |
| E.3661.raxxus | c. 3661 | Lord Raxxus imprisoned on Belsavis (P1, 3661 row 6) | Raxxus: C | — | — | O.raxxus_imprisoned |
| E.3661.theron | c. 3661 | Ngani Zho brings Theron Shan to Monastery (P1, 3661 row 7) | Ngani Zho: R; Theron: C | — | — | O.theron_trained |
| E.3661.rim_campaign | c. 3661–3660 | The Rim Campaign begins (P1, 3661 row 8) | — | — | — | O.rim_campaign |
| E.3660.hydian_battle | 3660 | Battle on the Hydian Way: Hylo Visz's smugglers break the blockade (P1, 3660 row 1) | Hylo Visz: R, but only if he fails or is killed before he can break the blockade (then another smuggler captain leads and takes his fame); otherwise Visz breaks it. Republic Navy: R | Hutt backing for the run: crucial, medium. Mandalorian pickets can be beaten: not crucial, medium | O.blockade_active | O.blockade_broken; O.visz_famous |
| E.3660.riots_end | 3660 | Coruscant riots end with the blockade's fall (P1, 3660 row 2) | — | Supply restored: crucial, medium | O.blockade_broken; O.coruscant_riots | O.riots_ended |
| E.3660.ord_radama | 3660 | Ord Radama taken, then retaken; the Harrower falls on Livien Magnus, killing Venemal (P1, 3660 row 3) | Malgus: R for this battle (another commander); Venemal: R | — | O.rim_campaign | O.ord_radama_republic; O.venemal_dead |
| E.3660.ashas_serenno | c. 3660 | Battles of Ashas Ree and Serenno (P1, 3660 row 5) | Malgus: R for this battle | — | O.rim_campaign | — |
| E.3660.ziost | 3660 | Battle of Ziost (P1, 3660 row 6) | Darth Marr: R for this battle | — | O.rim_campaign | — |
| E.3660.korriban | 3660 | Failed Jedi assault on Korriban; it stays Imperial (P1, 3660 row 7) | Jedi leaders: R | Korriban's defences hold: crucial, very high | O.rim_campaign | O.korriban_imperial |
| E.3660.great_hunt | c. 3660 | Artus Lok wins the Great Hunt, kills Mandalore the Lesser, becomes Mandalore the Vindicated (P1, 3660 row 8) | Artus Lok: R (another hunter wins and takes the mask); Lesser: C (he must be alive to be killed in the Hunt) | The Lesser is discredited after the blockade: not crucial, low | O.blockade_broken (not required: if the blockade still stands, the Hunt happens anyway, later or for other reasons) | O.new_mandalore |
| E.3660.crusader_schism | c. 3660 | Crusader's schism among the Mandalorians; Project 32 (P1, 3660 row 10) | — | — | O.new_mandalore | O.mandalorian_schism |
| E.3660.barrows_seventh | 3660–3653 | Zale Barrows defeats the Imperial Seventh Fleet (P1, 3660 row 11) | Zale Barrows: R | — | — | O.barrows_fleet |
| E.3659.visz_rumour | 3659 | Hylo Visz rumoured dead after double-crossing the Hutts (P1, 3659) | Visz: C | Visz is alive and betrays the Hutts: crucial, low | O.visz_famous | O.visz_gone |
| E.3658.xandret | 3658 | Lema Xandret defects from the Empire (P1, 3658) | Xandret: C | Her escape succeeds: crucial, medium | — | O.xandret_defected |
| E.3655.odacer | 3655 | Odacer-Faustin academy running (P1, 3655) | — | — | — | O.odacer_academy |
| E.3654.peace_offer | 3654 | The Dark Council offers peace; the conference and the Sacking follow **[PP-1]** (P1, 3654 row 1) | Dark Council: R (as a body) | **The peace offer is a deception: crucial, very high** | — | O.peace_talks |
| E.3654.minos_end | 3654–3653 | Minos Cluster fighting ends; the Empire withdraws (P1, 3654 row 2; 3653 row 1) | — | — | O.peace_talks | O.minos_quiet |
| E.3654.trant_narshaddaa | 3654 | Marcus Trant becomes SIS chief on Nar Shaddaa (P1, 3654 row 3) | Trant: R | — | — | O.trant_sis |
| E.3654.rhen_var | c. 3654–3653 | Darth Mekhis seizes Rhen Var; Satele leads the defence (P1, 3654 row 4) | Mekhis: R; Satele: R for this battle | — | — | O.rhen_var_imperial |

## 2. The Sacking and the Treaty, 3653 **[PP-1]**

| ID | Date | Event (timeline row) | Roles | Conditions | Consumes | Produces |
|---|---|---|---|---|---|---|
| E.3653.druckenwell | 3653 | Battle of Druckenwell (P1, 3653 row 1) | — | — | — | — |
| E.3653.alderaan_conference | 3653 | Peace conference on Alderaan (P1, 3653 row 2) | Paran Am-Ris: R; Dar'Nala: R; Satele: R | **The conference draws Republic and Jedi attention away from Coruscant: crucial, high** | O.peace_talks | O.republic_distracted |
| E.3653.temple_strike | 3653 | Malgus and Adraas destroy the Jedi Temple and disable Coruscant's defence grid **[PP-1]** (P1, 3653 row 3) | **Malgus: C** (for the Temple strike); Adraas: R; the strike team: R | The Republic doesn't know: crucial, very high. The strike team reaches the Temple: crucial, high. Those in the Temple are trapped: not crucial, medium (a won fight, or a Master's moment against Malgus, saves people, not the Temple). The defence grid can be disabled: not crucial, high. (Breaking the Temple strike saves the Temple but does not by itself stop the Sacking; see PP-1) | O.republic_distracted | O.temple_destroyed (or O.temple_saved + O.weak_ground_control if broken); O.grid_down (unless that condition is broken); O.zallow_dead |
| E.3653.sacking | 3653 | Angral's armada takes Coruscant; two days of martial law **[PP-1]** (P1, 3653 row 4) | Angral: R (another Lord of similar rank); the armada: R | **The Empire takes and holds Coruscant: crucial, very high (the PP-1 hinge).** The grid is down: medium. If O.weak_ground_control, the occupation is contestable (see PP-1) | O.grid_down; O.weak_ground_control (optional) | O.coruscant_occupied; O.berooken_dead |
| E.3653.treaty | 3653 | Treaty of Coruscant: the Republic signs, withdraws from many fronts, cedes systems **[PP-1]** (P1, 3653 row 5) | Republic delegation: R; Dark Council: R | The capital is held hostage: crucial, medium | O.coruscant_occupied; O.peace_talks | **O.treaty_signed**; O.systems_ceded |
| E.3653.chancellor | 3653 | Berooken killed; Am-Ris interim; Janarus elected (P1, 3653 row 6) | Am-Ris: R; Janarus: R | — | O.berooken_dead | O.janarus_chancellor |
| E.3653.zym | 3653 | Zym survives the Sacking, then is killed by the bounty hunter Braden (P1, 3653 row 7) | Zym: C; Braden: R | Zym is unguarded after the Treaty: crucial, medium | O.treaty_signed | O.grand_master_vacant |
| E.3653.deaths | 3653 | Dar'Nala, Ven Zallow, Eleena Daru and Adraas die (P1, 3653 row 8) | each: C for their own death | Dar'Nala dies on Dantooine: not crucial, medium. Eleena Daru dies: not crucial, high (she leaves Malgus's side earlier; the moment itself is unbreakable). Adraas dies: not crucial, medium (standing between them is top tier) | O.temple_destroyed | — |
| E.3653.dantooine | 3653 | Barrows's Free Spacers beat the Imperial Third Fleet at Dantooine (P1, 3653 row 9) | Barrows: R | — | O.barrows_fleet | — |
| E.3653.riots_after | 3653 | Coruscant riots after the Sacking (P1, 3653 row 10) | — | — | O.coruscant_occupied | O.coruscant_unrest |
| E.3653.decimus | c. 3653 | Azamin assassinated; Decimus succeeds (P1, 3653 row 11) | Decimus: R; Azamin: C | — | — | O.decimus_council |
| E.3653.hutt_treaty | 3653 | Hutt–Imperial treaty keeps the Hutt Cartel neutral (P1, 3653 row 13) | Hutt Cartel: R (as a body) | — | — | **O.hutt_neutral** |
| E.3653.ord_mantell_fleet | 3653 | A corrupt admiral sells Ord Mantell's fleet; the Republic all but abandons it (P1, 3653 row 15) | the admiral: R | The sale goes unexposed: crucial, medium | O.treaty_signed | O.ord_mantell_abandoned |
| E.3653.senate_blame | 3653 | The Senate blames the Jedi for the loss (P1, 3653 row 17) | — | — | O.treaty_signed; O.temple_destroyed | O.senate_distrusts_jedi |
| E.3653.temple_shelved | 3653 | The Senate votes to put off rebuilding the Coruscant Temple; Am-Ris tells Zym (SW_Coruscant_Jedi_Temple_OldRepublic_Part1; moved from 3650, D-476) | — | The Senate is hostile: crucial, high | O.temple_destroyed; O.senate_distrusts_jedi | O.rebuilding_postponed; O.temple_rebuilding (only if the Senate agrees to rebuild: the Order stays and lives in the Temple during repairs, D-477) |
| E.3653.balmorra_ceded | after 3653 | Republic ends support for Balmorra; it stays Imperial (P1, 3653 row 18) | — | — | O.systems_ceded | O.balmorra_imperial |

## 3. The Cold War, 3653–3642, and the war's return, 3641–3640

| ID | Date | Event (timeline row) | Roles | Conditions | Consumes | Produces |
|---|---|---|---|---|---|---|
| E.3653.alderaan_secession | after 3653 | Gaul Panteer walks out; Alderaan secedes; the Alderaan Civil War (P2, Cold War row 2) | Gaul Panteer: R | Anger at the Treaty: crucial, medium | O.treaty_signed | O.alderaan_civil_war |
| E.3653.ord_mantell_war | after 3653 | Separatist War on Ord Mantell (P2, row 4) | — | — | O.ord_mantell_abandoned | O.ord_mantell_war |
| E.3651.tython | 3651 | Satele rediscovers Tython and becomes Grand Master (P2, row 5) | Satele: R (another Jedi finds Tython and leads; her later arc changes) | — | O.grand_master_vacant (optional: Tython is found either way) | O.tython_found; O.grand_master_set (only if the vacancy came about) |
| E.3650.tython_begun | 3650 | The Order starts building its Temple on Tython (P2, row 7; D-476) | — | — | O.rebuilding_postponed; O.tython_found | **O.order_on_tython** |
| E.3650.trant_director | 3650 | Trant becomes SIS Director (P2, row 8) | Trant: R | — | O.trant_sis | O.trant_director |
| E.3650.mindor | 3650 | An illegal Imperial incursion wipes out a Chagrian colony on Mindor (P2, row 9) | Fideltin Rusk: R | — | O.treaty_signed | — |
| E.3649.janarus | 3649, 3645 | Janarus re-elected (P2, rows 11 and 16) | Janarus: R | — | O.janarus_chancellor | — |
| E.3649.starbender | 3649 | Operation Starbender (P2, row 12) | — | — | — | — |
| E.3648.taris | 3648 | Taris Resettlement begins; the Endar Rebirth is lost (P2, row 13) | — | — | — | O.taris_resettled |
| E.3648.makeb | 3648 | The InterStellar Regulators win the Makeb contract (P2, row 14) | — | — | — | O.makeb_regulators |
| E.3647.tython_temple | 3647 | Tython Temple completed (P2, row 15) | — | — | O.order_on_tython | O.tython_temple |
| E.3645.odacer_sickness | 3645 | "The Sickness" at Odacer-Faustin; a Sith warship crashes on Geonosis (P2, row 17) | Darth Scabrous: C | — | O.odacer_academy | — |
| E.3645.blackstar | 3645 | Blackstar Squad's covert mission to Hutta (P2, row 18) | — | — | O.hutt_neutral | — |
| E.3644.krikthasi | 3644 | Krikthasi Massacre on Balmorra (P2, row 19) | — | — | O.balmorra_imperial | — |
| E.3643.quesh | c. 3643 | Three Hutt families break the treaty to help the Republic on Quesh **[PP-2]** (P2, row 21) | the families: R | The families' deal goes ahead: crucial, medium | O.hutt_neutral | O.hutt_treaty_cracked |
| E.3643.sebaddon | 3643 | Jet Nebula finds the Cinzia: the Sebaddon affair and the Hex droid crisis **[PP-2]** (P2, row 22) | Jet Nebula: R | — | O.xandret_defected | O.sebaddon_incident |
| E.3643.flesh_raiders | 3643 | Bengel Morr's Flesh Raiders attack the Jedi on Tython (P2, row 23) | Hero of Tython: NPC (protagonist); Morr: R | — | O.order_on_tython | — |
| E.3643.exchange_out | c. 3643 | Exchange beaten by the Shadow Syndicate, driven from the Corellian sector (P1, 3653 row 14; ruled c. 3643: D-384 [3], moved from 3653, D-476) | — | — | — | O.exchange_weakened |
| E.3643.desolator | 3643 | Desolator crisis: Angral destroys Uphrades; Angral, Tarnis, Nefarid and Orgus Din die **[PP-2]** (P2, row 24) | **Angral: C** (it's his personal war; if he died earlier, this event diverges); Hero of Tython: NPC (protagonist); Orgus Din: R | Angral's superweapon is kept secret: crucial, high | O.treaty_signed | O.uphrades_destroyed; O.angral_dead |
| E.3643.esseles | 3643 | Kilran's Emperor's Glory attacks the Esseles (P2, row 26) | Kilran: R | — | — | — |
| E.3643.council_changes | 3643 | Hadra succeeds Mekhis; Jadus fakes his death, Zhorrid takes his seat; Skotia murdered, Zash a Darth (P2, rows 27–28) | each: R | — | — | O.council_shift_3643 |
| E.3642.balmorra_freed | 3642 | Balmorra freed by the Republic and the resistance **[PP-2]** (P2, row 31) | the resistance: R | The resistance and the Republic can take Balmorra: crucial, high | O.balmorra_imperial | O.balmorra_republic |
| E.3642.taris_invasion | 3642 | The Empire invades Taris, halting the resettlement **[PP-2]** (P2, row 32) | Saresh: R | The Empire can land on Taris: crucial, high | O.taris_resettled | O.taris_imperial |
| E.3642.maelstrom | 3642 | A Republic team frees Revan from the Maelstrom; the Foundry; Malgus takes the station; Kilran dies **[PP-2]** (P2, rows 33–34) | Revan: C (killing the prisoner is out of everyone's reach); Malgus: C; strike team: R | Revan is still imprisoned: crucial, very high (start) | — (Malgus himself is the crucial role) | O.revan_free; O.foundry_malgus |
| E.3642.plan_zero | 3642–3641 | Destruction of the War Trust; Baras's Plan Zero **[PP-2]** (P2, rows 37–38) | Baras: C; Emperor's Wrath: NPC (protagonist) | — | — | O.plan_zero |
| E.3641.treaty_collapse | mid-3641 | The Treaty officially collapses; the Galactic War begins **[PP-2]** (P2, Galactic War row 1) | — | See plot point PP-2 | O.treaty_signed | **O.galactic_war** |
| E.3641.braga | 3641 | Tol Braga's strike team tries to capture the Emperor and is turned (P2, row 2) | Tol Braga: R | — | O.galactic_war | O.braga_turned |
| E.3641.baras_council | 3641 | Baras's apprentice kills Vengean; Baras takes his seat (P2, row 3) | Baras: C; Wrath: NPC (protagonist) | — | O.plan_zero | O.baras_council |
| E.3641.belsavis | 3641 | The Empire invades Belsavis and frees the Dread Masters (P2, row 4) | — | The prison still holds them: crucial, high | O.galactic_war; O.shange_imprisoned; O.raxxus_imprisoned | O.dread_masters_free |
| E.3641.chancellor_vote | 3641 | Supreme Chancellor election (P2, row 5) | — | — | O.janarus_chancellor | — |
| E.3641.fronts | 3641 | Quesh war, Hoth, the Alderaan Civil War continues (P2, row 6) | — | — | O.galactic_war; O.alderaan_civil_war | — |
| E.3640.karrid | 3640 | Karrid's renewed assault from the Ascendant Spear (P2, row 10) | Karrid: R | — | O.galactic_war | — |
| E.3640.corellia | 3640 | Battle of Corellia; Decimus, Hadra and Acharon die (P2, row 11) | Decimus: R | — | O.galactic_war; O.decimus_council | O.corellia_contested |
| E.3640.ilum | 3640 | Battle of Ilum: Malgus declares himself Emperor and is defeated (P2, rows 12–13) | **Malgus: C** | — | O.galactic_war; O.foundry_malgus | O.malgus_defeated; O.ilum_contested |
| E.3640.voss | c. 3640 | The Emperor is trapped in the Dark Heart on Voss (P2, row 14) | the Emperor: C | — (**closed**, D-490) | — | O.emperor_trapped |
| E.3640.voice | 3640 | Hero of Tython kills the Emperor's Voice; power passes to the Dark Council (P2, row 15) | Hero of Tython: NPC (protagonist) | — (**closed**, D-490) | O.galactic_war | O.dark_council_rules |
| E.3640.council_deaths | 3640 | Thanaton killed (Nox takes his Sphere); Baras dies; Karrid dies; Acina heads Technology (P2, row 16) | each: R | — | O.baras_council | — |
| E.3640.janarus_dies | 3640 | Janarus killed aboard the Founder; Saresh becomes Chancellor; Malcom Supreme Commander (P2, rows 17–18) | Janarus: C; Saresh: R; Malcom: R | — | O.janarus_chancellor | O.saresh_chancellor |

---

## 4. Major plot points (trackers)

Only these two get authored alternatives (as the design notes require). Every other divergence runs on the narrator's direction from the broken tags.

### PP-1: The Sacking and the Treaty (3654–3653)
- **The hinge (ruled by Jared):** the one crucial condition is **the Empire takes and holds Coruscant**. If it breaks, PP-1 diverges. Nothing else alone triggers it.
- **How the steps feed it:**
  - Exposing the deception (the peace offer, the conference cover, the Republic not knowing) can stop the attack before it starts: the hinge breaks.
  - Saving the Temple (breaking the Temple strike) does **not** by itself break the hinge. If the Sith navy still takes Coruscant, there's little anyone can do about the fleet. But the Empire's ground control is weaker (O.weak_ground_control), which opens a window: more time to strike at the occupying navy.
  - Keeping the defence grid up, or breaking the occupying navy in that window, breaks the hinge.
- **Alternatives** (from the design notes; the code picks the best fit from the state at the time):
  1. **Peace by attrition:** the war grinds on until both sides are drained; a later, looser peace; the Republic much less restricted.
  2. **A treaty favouring the winner:** whoever holds the advantage when the Sacking fails gains major freedoms; the other side is restricted.
  3. **Total defeat of one side.**
- **What follows:** O.treaty_signed is never produced, so every event that consumes it diverges (the Cold War events, Alderaan's secession, the Desolator crisis and others). The Cold War happens much later or not at all. Malgus's later story is gone only if Malgus himself was killed.
- **If only the Temple is saved and Coruscant still falls:** the Treaty goes ahead as recorded, minus O.temple_destroyed. The events that consume it (the Senate shelving the Temple in 3650, the move to Tython) are re-checked: the Order may stay on Coruscant, and Tython becomes a second site instead of a relocation.

### PP-2: The Treaty's collapse (3643–3641)
- **Tracked tags:** the Cold War flare-ups that build toward open war: O.hutt_treaty_cracked, O.sebaddon_incident, O.uphrades_destroyed, O.balmorra_republic, O.taris_imperial, O.revan_free, O.plan_zero.
- **Normal path (confirmed by Jared):** with most of them produced, the Treaty collapses in mid-3641 as recorded.
- **Divergence:** if the player prevents enough flare-ups (design default: **four or more of the seven**), the collapse is delayed; if they make things worse (extra incidents added through play), it comes early. Alternatives:
  1. **Collapse on time** (default).
  2. **Collapse delayed:** the Cold War lasts longer; 3641–3640 events wait, adjusted to the new date.
  3. **Collapse early:** open war resumes before mid-3641.
- **Only applies if PP-1 went as recorded.** If the Treaty was never signed, PP-2 doesn't exist.

## 5. Convergence anchors

Events whose crucial tags don't depend on the war's outcome, so they still fire after a divergence, adjusted to the new state:
- E.3660.great_hunt (the Mandalorian succession happens regardless; only its date and cause shift);
- E.3651.tython (some Jedi still find Tython, though the reason to move there may change);
- E.3645.odacer_sickness, E.3643.sebaddon (personal or local chains);
- E.3640.voss (the Emperor's own plans);
- the Eternal Empire's arrival, beyond this map (named in the design notes as the main example).

## 6. Rulings (Jared, 2026-11-23)
1. **Protagonists:** players never follow SWTOR class-protagonist paths. The class heroes are NPCs; if the timeline diverges, each takes a key role similar to their own in that time frame.
2. **PP-1 trigger:** one crucial condition, the Empire taking and holding Coruscant. Saving the Temple alone doesn't break it, but weakens Imperial ground control and gives time to strike at the navy.
3. **PP-2 trigger:** four of the seven flare-ups prevented delays the collapse. Agreed.
4. **Hylo Visz:** he breaks the blockade unless he fails or is killed first; only then does another smuggler take his place and his fame.

## 7. Who can break what (D-490; rules check A1 to A29)

D-489's rules apply to every row: the three tests, the top-duelist bar, no premonitions, closed systems unbreakable. Nothing counts unless the player fits "who". **Posts** are in src/data/worldPosts.ts; "Knight" is a Jedi Knight's standing (a Sith Lord's on the Sith side). **Belief test** (as PP-15): a Knight's standing, or physical proof carried out of a scene.

**Top duelists on this map:** Malgus, Marr, Revan, Satele, Scourge, Zallow, Zym. **The Emperor is beyond any duelist:** no fight with the Emperor can be won (D-493). Below Master: cannot win. A bounty hunter or Mandalorian of the first rank, with a plan recorded in play: a short delay, never a win (D-493). A Master: a short delay, never a win. Yoda's or Mace's level: can win, or hold long. **Baras:** at least a Master, who can reach Baras. **Azamin:** someone who can reach Azamin. **Angral:** on the ground, or by someone who serves aboard the flagship. A foe an ally fought is never the player's.

**Closed:** the Emperor in the Dark Heart (E.3640.voss), the Voice's throne room (E.3640.voice), killing Revan in the Maelstrom, Eleena's death at the moment itself.

| Condition | Guard | Who | Steps |
|---|---|---|---|
| `E.3661.devaron`, the blockade holds | medium | a Jedi Knight or a Republic officer in the strike | only during the battle, at Devaron; one fight is not enough |
| `E.3661.riots`, supply cut | low | Republic, Jedi or underworld | standing at the 3661 start |
| `E.3661.belsavis_shange`, secret | medium | the SIS or the prison's staff | an inquiry at Belsavis |
| `E.3660.hydian_battle`, Hutt backing | medium | in a Hutt's service, a cartel contact, or the Imperial agent to the Hutts | with a Hutt figure; prerequisite: the run is known |
| `E.3660.hydian_battle`, pickets | medium | a Mandalorian officer or the Imperial liaison | with Mandalore the Lesser |
| `E.3660.riots_end`, supply restored | medium | commands the raiders (Mandalorian or Imperial) | won fights on the Hydian Way |
| `E.3660.korriban`, defences | very high | a Jedi Knight or an officer leading part of the assault; a Sith who brings the defence plans | leading, only during the assault; fights alone never count. Prerequisites: (a) how Korriban is defended, (b) where the assault lands |
| `E.3660.great_hunt`, discredited | low | a Mandalorian or the Imperial liaison | with Mandalore the Lesser, or the blockade still holds |
| `E.3659.visz_rumour`, betrayal | low | Visz's circle or the Hutts' | prerequisite: the betrayal is known |
| `E.3658.xandret`, escape | medium | Imperial Intelligence, a Sith household on Dromund Kaas, a Councillor's staff | prerequisite: that Xandret means to run |
| `E.3654.peace_offer`, deception | very high | belief test | prerequisites: (a) the Council's orders seen by a Sith-side insider or an Intelligence source, (b) proof carried out (scene) |
| `E.3653.alderaan_conference`, attention | high | the delegation, its Jedi escort, or the SIS; belief test | prerequisite: that the conference is a cover |
| `E.3653.temple_strike`, unaware | very high | belief test | prerequisites: (a) the target, seen only from inside Malgus's team or Angral's fleet, or by a holder of the peace offer's proof, (b) proof in hand (scene). The warning scene asks the same |
| `E.3653.temple_strike`, reach | high | Coruscant traffic control or Temple security | the shuttle is refused or brought down; prerequisite: a lead on it. Stopping Malgus in the Temple is top tier |
| `E.3653.temple_strike`, those trapped | medium | Republic or Jedi | during the strike: a won fight, or Malgus held off by a Master |
| `E.3653.temple_strike`, grid | high | Republic security, the SIS or a Jedi Knight | prerequisite: that the grid is a target |
| `E.3653.sacking`, hold | very high | a Republic commander, or a Jedi Master with a following | only during the occupation. Prerequisites: (a) weak ground control, (b) a lead on the fleet. Angral on the ground only. The navy half waits for ship combat |
| `E.3653.zym`, unguarded | medium | a Jedi, or Temple or Senate security | prerequisite: the bounty is known. Beating Braden counts |
| `E.3653.deaths`, Dar'Nala | medium | Republic or Jedi | |
| `E.3653.deaths`, Eleena | high | trusted by Eleena, or in Malgus's team | earlier: she leaves Malgus |
| `E.3653.deaths`, Adraas | medium | in Adraas's household | a warning before it |
| `E.3653.ord_mantell_fleet`, unexposed | medium | a Republic officer, an investigator or the SIS | prerequisite: evidence of the sale |
| `E.3653.temple_shelved`, hostile | high | a senator or an aide with access, or a Jedi Master | prerequisite: which votes can be moved (or the Senate never turned on the Jedi) |
| `E.3653.alderaan_secession`, anger | medium | an Alderaanian noble or aide, a senator, or a Jedi envoy | prerequisite: that Panteer means to walk out |
| `E.3643.quesh`, deal | medium | an Imperial officer or agent, or a cartel agent | fights only during it; prerequisite: the deal is known |
| `E.3643.desolator`, secret | high | a Jedi Knight or the SIS | prerequisite: on Tarnis's trail |
| `E.3642.balmorra_freed`, rising | high | an Imperial officer with a command, or a Sith Lord | fights and leading only during it; prerequisite: the rising is known |
| `E.3642.taris_invasion`, landing | high | a Republic officer with a command, or a Jedi Knight | the same; prerequisite: the invasion is known |
| `E.3642.maelstrom`, imprisoned | very high | the Republic strike team, or the Emperor's jailers | prerequisites: (a) where Revan is held, (b) how the prison holds Revan |
| `E.3641.belsavis`, held | high | a Republic officer with a command, the prison's staff, or a Jedi Knight | a fight is never foreknowledge; prerequisite: the invasion is known |
| Scenes: treaty incidents (PP-2) | medium | a serving soldier, sailor or agent, a Jedi or a Sith | a lethal fight that can be blamed on a side |
| Scene: Hylo Visz stopped (ruling 4) | medium | anyone | |

E.3653.treaty (the hostage) and E.3653.sacking (the grid is down) break only through an earlier outcome.
