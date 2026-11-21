# 05 — Force Abilities and Lightsaber Forms (legacy V170 audit)

Scope: `FORCE_ABILITY_CATALOG`, `FORCE_ABILITY_ALIASES`, `FORCE_ABILITY_RULES`, `repairForceAbilities`, the sub-ability proficiency system, lightsaber form lists and key normalization, the Force Barrier field and its phrase regexes, and NPC root-only Force abilities (V164). Read-only audit of `legacy/index.html` (V170). Canon: `Docs/SWRPG lore/SW_Force_Abilities_Forms_v3_complete.md` (called "the lore doc" below; line numbers refer to that file).

## What it does for the player

- The player has a list of Force abilities, each with a level from 0 up, shown in the sidebar with an XP bar (legacy/index.html:7455-7500). Sub-applications (Force Push, Chain Lightning...) are not levels. Each one shows as a proficiency percentage with a tier label (Novice / Developing / Proficient / Expert / Mastered) under its parent (legacy/index.html:7473-7497).
- **No unlock step.** The prompt tells the AI that the first `TRAINING: forceAbilities.X` tag is the unlock (prompt text, legacy/index.html:2386-2387). Code does not check prerequisites, alignment gates or story flags when an ability first appears. Prerequisites are only checked when the **simulator** lists sub-ability proficiency drills (legacy/index.html:11266-11287, via `simCheckPrereqs` 11189-11207).
- Lightsaber forms are levels in `characterSheet.lightsaberForms`. They appear when the AI writes them into the SHEET JSON or awards XP to them. Character creation seeds only Shii-Cho (legacy/index.html:3398).
- A "Force Barrier" integrity bar (0-100) appears once `forceBarrier` is non-null (legacy/index.html:7386-7394). Nothing in the roll engine reads it. It is display only.
- In the simulator, every known root ability gets an auto-generated practice activity (legacy/index.html:11236-11264), and every known form gets one too (11213-11234).
- NPCs: Force-capable archetypes get 2-3 root abilities at a level near their Force Control/Force Output average, with no sub-ability tracking (legacy/index.html:3098-3111).

## Rules and formulas

| Constant / formula | Value | Source |
|---|---|---|
| Catalog size | 131 entries: 96 roots (`par:null`) and 35 sub-applications, in 13 families (TK 20, Sensory 11, Body 16, Mental 16, Defense 11, Healing 6, Light 6, Dark 15, SpaceTime 7, Nature 4, Arcane 6, SithAlchemy 6, Misc 7) | legacy/index.html:8774-8946 (counted by evaluating the object) |
| Entry shape | `{fam, label, par, D, align, anchors[], prereqs{}, flags[], special?}` | legacy/index.html:8764-8773 (header comment) |
| `prereqs` keys | lower-case stat key = stat level; catalog key = ability level; `anySaberForm:N` = highest form level ≥ N; `darkSide:N` = alignment ≤ −N; `lightSide:N` = alignment ≥ N | legacy/index.html:8770-8771; checked at 11189-11207 |
| `D` (sub-ability difficulty) | 1.0 / 1.5 / 2.5 / 4.0; null for roots without a track | legacy/index.html:8767; lore doc "Total investment by difficulty" (line 87) |
| Proficiency cost per 1% | `floor(D × 20 × 1.07^(pct × 0.8))` | legacy/index.html:7212-7214; lore doc 64-68 |
| Proficiency derivation | Walk pct from 0 to 100, subtracting each step's cost until XP runs out | legacy/index.html:7217-7228; lore doc 70-84 |
| Base-ability discount | base ≥80 ×0.50, ≥60 ×0.60, ≥40 ×0.75, ≥20 ×0.90, else ×1.00 | legacy/index.html:7231-7237; lore doc 111-118 |
| ForceControl discount | FC ≥80 ×0.70, ≥60 ×0.85, ≥40 ×1.00, ≥20 ×1.10, else ×1.25 | legacy/index.html:7240-7246; lore doc 120-127 |
| Effective proficiency XP | `rawXP / (baseFactor × fcFactor)` | legacy/index.html:7261-7262; lore doc 129 |
| Soft cap (sidebar and effective %) | base ≥80 → 100%, ≥60 → 85%, ≥40 → 70%, ≥20 → 50%, else 25% | legacy/index.html:7293-7296 |
| Soft cap (AI context string) | base ≤20 → 25%, ≤40 → 50%, ≤60 → 70%, ≤80 → 85%, else 100% | legacy/index.html:11090 (boundaries differ from 7294; see bug 11) |
| Trickle sub → parent | 20% of **raw** proficiency XP added to the parent as normal XP | legacy/index.html:7268-7270; lore doc 142 (lore caps it at the parent's xpRequired; code does not) |
| Trickle parent → subs | 5% of base XP added to every sub entry that already has `totalProfXP > 0` | legacy/index.html:7277-7285 (called from 7163); lore doc 141 |
| Proficiency tiers | ≥91 Mastered, ≥71 Expert, ≥51 Proficient, ≥26 Developing, else Novice | legacy/index.html:7300-7306; lore doc 100-107 |
| PROFICIENCY: prompt XP scale | 0.5h casual 8, 0.5h standard 10, 0.5h intense 13, 1h standard 15, 1h intense 20, 1h overwhelming 30 | legacy/index.html:1846 (prompt) |
| TRAINING: on a sub-ability key | `calcTrainingXP(hours, intensity, difficulty, outcome, parentLevel)` goes to `applyProficiencyXP(par, sub, xp)` | legacy/index.html:5123-5138 |
| Talent: ForceSensitiveHealer | Healing-family abilities and ForceHealSelf XP ×1.3 | legacy/index.html:6994-7001 |
| Talent: BattleMeditationAffinity | `forceAbilities.BattleMeditation` XP ÷0.3 (about ×3.33) | legacy/index.html:7002-7005 |
| Sim activity weights for an ability | the ability 1.0, first anchor 0.5, second anchor 0.3 | legacy/index.html:11247-11251 |
| Sim strain bias by family | `FAM_STRAIN_BIAS` (TK f1.8/p0.3/m0.8 ... SithAlchemy f2.2/p0.3/m1.3) | legacy/index.html:8684-8698 |
| Sim strain bias for proficiency drills | f1.6 / p0.3 / m0.8 (flat) | legacy/index.html:11282 |
| Anchor → sim stat path | `ANCHOR_TO_SIM_PATH` (11 entries; no ability anchors) | legacy/index.html:8670-8682 |
| NPC ability level | `round(((fC + fOut)/2) × U(0.85, 1.15))`, clamped to [1, pool.forceMax] | legacy/index.html:3104-3111 |
| NPC archetype abilities | Guardian: Telekinesis, ForceSpeed. JediConsular: Telekinesis, MindTrick, ForceBarrier. SithInquisitor: Telekinesis, ForceLightning | legacy/index.html:3031-3039 |
| Form keys (label detection) | `CANON_FORM_KEYS` = ShiiCho, Makashi, Soresu, Ataru, Shien, DjemSo, ShienDjemSo, Niman, Juyo, Vaapad, JarKai, KiiShikk | legacy/index.html:10737 |
| Form key normalization | `_FORM_CANON`: strip non-alphanumerics, lower-case, look up, else capitalize the first letter | legacy/index.html:4839-4848 |
| Form display labels | `FORM_DISPLAY_LABELS` (ShiiCho, DjemSo, ShienDjemSo, JarKai, KiiShikk) | legacy/index.html:8651-8653 |
| Form sim weights | `FORM_WEIGHT_PROFILES` for Shien, DjemSo, ShienDjemSo, Niman, Juyo, Vaapad, JarKai, KiiShikk | legacy/index.html:8640-8649 |
| Default form sim weights | `FORM_DEFAULT_WEIGHTS` = strength 0.4, agility 0.4, endurance 0.3, forceControl 0.2 | legacy/index.html:8650 |
| Primary-form resolution (padawan mandatory row) | highest-level form, else ShiiCho | legacy/index.html:8660-8667 |
| Hardcoded saber sim activities | ShiiCho basic/advanced, Makashi basic/footwork (≥21), Soresu basic/deflect, Ataru basic/acrobatics, Live Sparring | legacy/index.html:8606-8614 |
| Form counters (prompt only, stated twice) | Makashi vs ShiiCho +2; DjemSo vs Makashi +2; Soresu vs Ataru: Ataru user +1 physical strain/round; Ataru in confined space −3; Vaapad vs dark +3 | legacy/index.html:1995-2000 and 2296-2302 |
| Force Barrier field | `forceBarrier` 0-100 or null; `maxForceBarrier` default 100; prompt says start at 20-40 | legacy/index.html:2306-2319 (prompt); default 3410 |

## State read / written

- `characterSheet.forceAbilities`: `{Key: level}`. Written by the SHEET JSON overwrite (legacy/index.html:4775), `syncMasterXPToSheet` (7192), the CHANGES default `Key=value` case (5888-5894), the markdown fallback (6087-6097) and `repairForceAbilities` (7093). Read by the sidebar (7456), the context line (4060), the AI rules block (11081), the sim (11200, 11246, 11271), the proficiency discount (7259, 7293) and the roll engine's `getLiveStatValue` (10570).
- `characterSheet.forceAbilitiesXP`: `{Key:{current, required, totalXP}}`, a display mirror (7186). Also written by the `XP_` CHANGES prefix (5328-5333) and the narrative regex (6022-6026).
- `masterXP.forceAbilities`: `{Key:{totalXP}}`, the stated source of truth (6536). Written by `applyXPToSheet` (7127-7166) and `repairForceAbilities` (7094). Restored on load (8279-8291).
- `masterXP.forceAbilityProficiency`: `{"Parent.Sub":{totalProfXP, D}}`. Written by `applyProficiencyXP` (7249-7274) and `profTrickleFromBase` (7277-7285). Restored on load (8296-8298).
- `characterSheet.lightsaberForms`, `characterSheet.lightsaberFormsXP`, `masterXP.lightsaberForms`: same pattern. Keys are normalized at 4838-4870.
- `characterSheet.forceBarrier`, `characterSheet.maxForceBarrier`: written by `FORCE_BARRIER=` (5535), the SHEET JSON, the narrative regex (5959-5969) and the manual sync prompt (8552-8559).
- `characterSheet.aptitudes`: catalog keys are stripped from it (4766-4772, 4824-4830, 7054-7058, 11634-11639).
- `worldState.storyFlags` / `characterSheet.storyFlags`: the catalog's `flags` field refers to these, but **no code reads catalog `flags`**. A search for `.flags` and for every flag key finds only the toggle UI (11661-11681).
- `worldState.characterProfiles[name].stats.forceAbilities`: NPC root abilities (3106-3110).
- `characterSheet.alignment`: read for the `darkSide`/`lightSide` prereqs (11193, 11195).

## AI provides vs. code computes

| AI provides | Code computes |
|---|---|
| Which ability is trained or used (the `TRAINING:` / `XP:` / `PROFICIENCY:` key) | The XP amount from hours × intensity × difficulty × outcome × tier multiplier (calcTrainingXP), plus talent multipliers and momentum |
| The proficiency XP number in `PROFICIENCY:` (raw, from the prompt's scale) | Discount factors, % derivation, soft cap, trickle in both directions |
| The first use of a new ability (that **is** the unlock), and whether its prereqs are met (enforced by the prompt only) | Nothing at unlock time. Prereq checks exist only for the sim's proficiency activity list |
| Ability levels in the SHEET JSON (meant to be read-only) | `syncMasterXPToSheet` overwrites levels for keys already in masterXP. AI-written keys **not** in masterXP keep the AI's number, and that number later becomes the masterXP seed (7136-7155) |
| The Force Barrier integrity number (SHEET, `FORCE_BARRIER=`, prose) | Only clamping in the regex path. No formula ties it to Force Control, ability level or damage |
| Form keys, in any spelling | Normalization via `_FORM_CANON` |
| Which sub-application an NPC uses (narrated) | NPC root ability levels from the archetype |
| Ability key names (told to "match FORCE_ABILITY_CATALOG", 2390) | The catalog key list is **never sent** to the AI. Only the player's own ability keys (4060) and `FORCE_ABILITY_RULES` entries for owned keys (11086-11098) are sent |

## Known bugs and fragile spots

1. **No unlock gating.** `applyXPToSheet` (legacy/index.html:7127) creates any `forceAbilities.<key>` on first XP with no catalog, prereq, alignment or flag check. Dark-side, Sith-text and era-locked abilities (SithAlchemy, FlowWalking, Vaapad) unlock whenever the AI emits the tag. The only guard is the prompt (2387-2390).
2. **Catalog `flags` are dead data.** No code reads them, and no CHANGES tag sets story flags (a search for `STORY_FLAG` finds nothing). The flags exist only as a player toggle grid (11661-11681). CLAUDE.md §8 and the lore doc (line 1641) say "the AI sets them". In V170 it cannot.
3. **Non-catalog keys lose XP on reload.** The main SHEET path (4775-4871) and the TRAINING:/XP: handlers (5109-5222) accept unknown keys such as `ForceHeal` and give them masterXP. `repairForceAbilities` runs only on load (8321) and drops any key not in the catalog or the alias map (7078), so that XP is lost for good. The prompt itself warns about this (2390). `LORE_DATABASE` uses `ForceHeal` 12 times, so the AI is shown the bad key.
4. **The AI never sees the catalog.** The prompt says to use only catalog keys (2390), but no code sends the key list. `FORCE_ABILITY_RULES` (10518-10556) is sent for owned keys, and it contradicts the catalog (bug 5).
5. **`FORCE_ABILITY_RULES` contradicts the catalog.** Three of its 15 keys (`ForceHeal`, `ForceKnowledge`, `Meditation`) are not in the catalog, and `ForceBody` is given subs it does not have. It lists 21 sub names that are not in the catalog: TelekineticBurst, ForceSurge, BattlePrecognition, DangerSense, CombatPrecognition, ForceDefense, Persuade, ForceConfusion, Dominate, HealOthers, WoundClosure, ForceRevitalize, DarkBattleMeditation, ForceHistory, ForceWisdom, HealingTrance, ForceTrance, MindShield, AlignedMeditation, LightningBurst and LifeDrain. Prereq values differ too:
   - ForceWave: TK≥10 vs 21 (8782)
   - ChainLightning: FL≥10 vs 30 (8890)
   - BattleForesight: FS≥21 vs FS61+FC41 (8808)
   - BattleMeditation: Med21+Will20 (which is Battlemind's, 8852) vs Med61+FC41+FK30 (8867)
   - ForceDrain: dark30+TK21 vs FC30+dark25 (8892)
   - SithAlchemy: FK61+dark60 vs FK81+dark80 (8929)
   - Tutaminis, ForceAbsorb and ForceSuppression are listed as ForceBarrier subs. In the catalog they are roots, or a Tutaminis sub.

   This text goes to the AI every turn for any owned key (11091-11094), so it teaches non-catalog names, which are then purged on load (bug 3).
6. **Sub-abilities used as prerequisites can never be met in the sim.** `simCheckPrereqs` compares `cs.forceAbilities[key]` (a level) for catalog keys (11199-11200). Sub-abilities are tracked as proficiency %, not levels. So ForceAffliction (needs ForceSlow:20, 8942), ForceSubjugate (MindControl:21, 8899) and ForceStormWormhole (ForceStorm:41, 8911) are unreachable. ForceRend, ForceGrip, ForceCrush, ForceHorror and ForceInsanity are reachable only through a side effect (bug 7).
7. **Nested sub-abilities give a sub-ability a level.** For ForceRend (par ForceWound), `applyProficiencyXP('ForceWound','ForceRend')` trickles 20% to `applyXPToSheet('forceAbilities.ForceWound')` (7270). That creates a level track for a sub-ability in `masterXP.forceAbilities`. The sidebar hides it (7462), but prereq checks and the parent discount (7259) read it. The same happens for ForceChoke→ForceGrip→ForceCrush and ForceFear→ForceHorror→ForceInsanity. Until that side-effect level exists, the parent discount and soft cap for these use 0.
8. **An `XP:` tag on a sub-ability key is not redirected.** TRAINING: redirects subs to proficiency (5124-5138), but `XP: forceAbilities.ForcePush,150` (5205-5222) writes a level track for the sub into masterXP instead.
9. **The prompt contradicts the code on sub-ability TRAINING.** The prompt says sub-abilities "are NOT valid TRAINING: targets" (1835). The code accepts them and redirects them (5123-5138).
10. **`PROFICIENCY:` does not require the parent to be known.** The handler (5174-5198) checks only that `catalog[sub].par === abilKey`. With an unknown parent it still creates proficiency and trickles 20% into a brand-new parent level via 7270. That is a back-door unlock.
11. **Soft-cap boundaries disagree.** The sidebar/effective code uses `>=20 → 50%` (7295). The AI-context string uses `<=20 → 25%` (11090). The lore doc uses 0-20 → 25% (line 134). So level 20 gets 50% in one place and 25% in the other.
12. **The lore cap on the 20% trickle-back is missing.** Lore line 142 caps it at the parent's `xpRequired`. Code applies it uncapped (7269-7270).
13. **The `repairForceAbilities` merge loses or over-credits data.** When an alias and a canonical key collapse into one, object values are summed into `{totalXP: a+b}` and every other field is dropped (7082). Numbers take the max. A number/object mix is skipped silently (7081-7085). Summing over-credits when the AI recorded the same progress under two names.
14. **Kii-Shikk normalization bug.** The `_FORM_CANON` key is `'kii-shikk'`, with a hyphen (4843), but the lookup uses the hyphen-stripped string (4846). So `Kii-Shikk` becomes `Kiishikk` (lower-case s), not `KiiShikk`, and then misses `FORM_WEIGHT_PROFILES.KiiShikk`, `FORM_DISPLAY_LABELS` and `CANON_FORM_KEYS`. Unknown spellings such as "Soresu (Form III)" also become junk keys (`Soresuformiii`, 4847).
15. **The form merge keeps the larger XP entry and throws away the other** (4854). Progress logged under two spellings is lost, not summed. `repairForceAbilities` does the opposite and sums (bug 13).
16. **Form prerequisites are not checked anywhere.** Lore requires Juyo 61+ and the maceLiving flag for Vaapad, Council permission for Juyo, and two forms at 21+ for Jar'Kai (lore 188-194). In code, a form exists as soon as the AI writes it.
17. **The Force Barrier regexes are loose** (5959, 5963).
    - `barrier.*(?:dissipat|fad|releas|drop|collaps|fell|broke|shatter)` zeroes the barrier for any line like "the barrier held as he dropped to one knee". It also fires on an opponent's barrier or a building's.
    - `(?:Force\s*Barrier|barrier)[^.\n]*?(?::|at|to|=)\s*(\d+)` matches "barrier ... up to 3 meters" and sets the barrier to 3.
    - Both regexes turn a `null` (unlearned) barrier into a number, which makes the bar appear.
18. **The Force Barrier field has no link to the ForceBarrier ability, and nothing mechanical reads it.** It is used only for display (4064, 7386-7394). The prompt says "Every Padawan+ Force user has a passive Force barrier always active" (2307), while the catalog says ForceBarrier needs FC10 (8858). The prompt also says "strain 9+" (2310), left over from a 0-10 strain scale. Strain now runs 0-100.
19. **`simCheckPrereqs` mixes `cs` and the global `characterSheet`** (11193 vs 11197-11203). `anySaberForm` takes `Math.max(...Object.values(lightsaberForms))`, which returns NaN if any value is an object (11197-11198).
20. **ControlPain values disagree with lore.** Code has FC20/Med15 and D null (8816). Lore has FC25/Med20 and D 2.5 (lore 604-608).
21. **NPC archetype abilities skip catalog gates.** Any SithInquisitor gets ForceLightning regardless of alignment (3037). JediConsular's `primaryForm:'Makashi'` (3034) is an unusual choice. Low impact, NPC side only.
22. **Shatterpoint is both a catalog root and a separate track.** It is deleted from forceAbilities at 4807-4809, 7059-7063, 6735-6737 and 6760-6762, and blocked in the TRAINING:/XP: handlers (5120, 5212). Four separate guards protect one rule.

## Conflicts between sources

| Topic | Lore doc | Code | Other docs |
|---|---|---|---|
| Lightsaber form list | ShiiCho, Makashi, Soresu, Ataru, **ShienDjemSo** (one key), Niman, Juyo, Vaapad, **Trakat, JarKai, Sokan, DunMoch, ZeroGravity, DoubleBlade** (lore 157-172) | Separate `Shien` and `DjemSo` keys plus `ShienDjemSo`, and **KiiShikk** (not in lore). No Trakat, Sokan, DunMoch, ZeroGravity or DoubleBlade (legacy/index.html:10737, 4839-4843, 8640-8653) | CLAUDE.md §7H shows `Shien/Djem So` → `ShienDjemSo`; the V141 changelog adds `DjemSo` |
| Force Plague | Paired with Force Affliction (lore 1565) | No entry | — |
| ControlPain | FC25+, Med20+, D=2.5 (lore 604-608) | FC20, Med15, D null (8816) | — |
| Sith-text flag on Shadowstrike / MidiChlorianManipulation / TransferEssence | Not in their prereqs (lore 1483-1516) | `flags:['sithTextAccess']` (8930-8933) | CLAUDE.md §6 says all of them need sithTextAccess |
| Dark Transfer prereq | MidiChlorian 30+ **OR extreme innate talent** (lore 1055) | AND only (8876) | — |
| Force Enlightenment | Also "all primary abilities at Adept tier" (lore 1081) | Dropped (8880) | "Adept" is not a tier in CLAUDE.md §3D |
| Mechu-deru | "Dark Side drift **or** Jedi Sentinel specialization" (lore 1448) | No alignment or specialization prereq; align dark (8924) | — |
| Alignment tags | Kinetite Neutral/Dark-leaning; Force Stasis Light-leaning; Sever Force and Dark Transfer dual; Floating Meditation Light-leaning | neutral / neutral / neutral / dark / neutral | — |
| Anchors | Force Scream: ForceOutput + Willpower. Floating Meditation and Force Weapon include the Telekinesis ability | One anchor each; ability anchors not supported (`ANCHOR_TO_SIM_PATH` 8670-8682) | — |
| Soft-cap boundary at level 20 | 0-20 → 25% (lore 134) | 50% at 7295, 25% at 11090 | CLAUDE.md §4F matches lore |
| Trickle-back cap | Capped at parent's xpRequired (lore 142) | Uncapped (7269) | CLAUDE.md §4F mentions no cap |
| Talent ForceReservoir | maxForceBarrier +20 (lore 1609) | forceOutput XP ×1.3 (6988, 8736) | CLAUDE.md V128 log: ×1.3 |
| Talent BladeIntuition | +5 levels to the first form at creation (lore 1610) | lightsaberForms XP ×1.3 (6985) | V128 changed it on purpose |
| ShatterSense cost | "×0.1 XP cost" (lore 1614) | Separate 500×1.07^n track | CLAUDE.md §4B: "No cost discount" |
| Innate passive TK burst key | `NaturalTelekineticBurst_passive` (lore 1633) | `TelekineticBurstPassive` (8749) | — |
| Who sets story flags | "The AI sets them when the relevant story event occurs" (lore 1641) | No tag exists, and code never reads them | CLAUDE.md §8 repeats the lore claim |
| Barrier for every Padawan | Force Barrier needs FC10+ (lore 889-893) | Prompt: "Every Padawan+ Force user has a passive Force barrier always active" (2307) | — |
| `FORCE_ABILITY_RULES` vs catalog | — | Two in-code tables disagree (bug 5) | CLAUDE.md §9G calls RULES "tuned for concise AI consumption" |
| Sim unlock triggers | Lore 1674-1696 lists Soresu Deflection at ≥10, "Form Combination Drills", "Dual Saber Practice", and "[Sub-Ability] Developing/Journeyman" drills | Not built. Proficiency drills are offered for any sub whose prereqs pass (11266-11287). Soresu deflect unlock is coded separately at 8611 | — |
| Ability keys in the lore database | — | `LORE_DATABASE` keyAbilities use 16 non-catalog keys: ForceHeal (12), MindDomination (5), SithSorcery (3), Meditation (2), BattleMeld (2), UnifyingForcePerception, Possession, Multipresence, MindWalking, MindManipulation, ForcePsychosis, ForceOutput, ForceKnowledge, ForceHealingResurrection, ForceDarkSide, ForceConcealment (legacy/index.html:8961-10512) | The `Docs/SWRPG lore/` character files were not cross-checked here |

## Coverage table (legacy catalog → lore doc)

All 131 catalog entries map to a lore heading. The lore doc has one ability with no code entry: **Force Plague** (lore 1565, paired with Force Affliction). "matches lore" means family placement, parent, D, alignment and prerequisites all agree. Story-flag gates exist in code only as metadata (bug 2). Aliases come from `FORCE_ABILITY_ALIASES` (legacy/index.html:8951-8959). D is shown as written in code (1 = 1.0, 4 = 4.0).

| Code id (line) | Label | Fam | Parent | D | Side | Prereqs (code) | Flags | Aliases | Lore heading (line) | Mismatch notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Telekinesis (8777) | Telekinesis | TK | — | null | neutral | forceControl:5 | — | — | Telekinesis (216) | matches lore |
| ForcePush (8778) | Force Push | TK | Telekinesis | 1 | neutral | Telekinesis:10 | — | — | Force Push (226) | matches lore |
| ForcePull (8779) | Force Pull | TK | Telekinesis | 1 | neutral | Telekinesis:10 | — | — | Force Pull (236) | matches lore |
| ForceThrow (8780) | Force Throw | TK | Telekinesis | 1.5 | neutral | Telekinesis:15 | — | — | Force Throw (245) | matches lore |
| ForceLevitation (8781) | Force Levitation | TK | Telekinesis | 1.5 | neutral | Telekinesis:21 | — | — | Force Levitation (254) | matches lore |
| ForceWave (8782) | Force Wave | TK | Telekinesis | 1.5 | neutral | Telekinesis:21, forceControl:15 | — | — | Force Wave (264) | matches lore |
| ForceWhirlwind (8783) | Force Whirlwind | TK | Telekinesis | 2.5 | neutral | Telekinesis:30, forceControl:20 | — | — | Force Whirlwind (274) | matches lore |
| SaberThrow (8784) | Saber Throw | TK | Telekinesis | 2.5 | neutral | Telekinesis:15, anySaberForm:10 | — | — | Saber Throw (284) | matches lore |
| SaberBarrier (8785) | Saber Barrier | TK | Telekinesis | 4 | neutral | Telekinesis:30, anySaberForm:21 | — | — | Saber Barrier (294) | matches lore |
| TelekineticLightsaberCombat (8786) | TK Lightsaber Combat | TK | Telekinesis | 4 | neutral | Telekinesis:41, anySaberForm:30 | — | — | Telekinetic Lightsaber Combat (304) | matches lore |
| TelekineticBarrage (8787) | Telekinetic Barrage | TK | Telekinesis | 2.5 | neutral | Telekinesis:41 | — | — | Telekinetic Barrage (314) | matches lore |
| ForceRepulse (8788) | Force Repulse | TK | Telekinesis | 4 | neutral | Telekinesis:61 | — | — | Force Repulse (324) | matches lore |
| ForceWound (8789) | Force Wound | TK | Telekinesis | 1.5 | dark | Telekinesis:21, darkSide:1 | — | — | Force Wound → Force Rend (334) | matches lore |
| ForceRend (8790) | Force Rend | TK | ForceWound | 4 | dark | ForceWound:30, darkSide:60 | — | — | Force Wound → Force Rend (334) | Nested sub (par ForceWound). Prereq ForceWound is a sub — level only exists via trickle-back side effect |
| ForceChoke (8791) | Force Choke | TK | Telekinesis | 2.5 | neutral | Telekinesis:21, forceControl:10 | — | — | Force Choke → Force Grip → Force Crush (344) | matches lore |
| ForceGrip (8792) | Force Grip | TK | ForceChoke | 2.5 | neutral | ForceChoke:15 | — | — | Force Choke → Force Grip → Force Crush (344) | Nested sub (par ForceChoke) — same nested-sub issue |
| ForceCrush (8793) | Force Crush | TK | ForceGrip | 4 | neutral | ForceGrip:21 | — | — | Force Choke → Force Grip → Force Crush (344) | Nested sub (par ForceGrip) — same nested-sub issue |
| Kinetite (8794) | Kinetite | TK | Telekinesis | 2.5 | neutral | Telekinesis:30, forceControl:25 | — | — | Kinetite (357) | Lore align "Neutral/Dark-leaning"; code neutral |
| ForceOrb (8795) | Force Orb | TK | Telekinesis | 2.5 | neutral | Telekinesis:25, forceControl:20 | — | — | Force Orb (367) | matches lore |
| ForceSphere (8796) | Force Sphere | TK | Telekinesis | 2.5 | neutral | Telekinesis:30, ForceBarrier:15 | — | — | Force Sphere (376) | matches lore |
| ForceSense (8802) | Force Sense | Sensory | — | null | neutral | none | — | — | Force Sense (391) | Lore prereq "ForceStats.ForceSense 1+ (built in)"; code {}. Ability key ForceSense collides (case only) with stat forceStats.forceSense |
| ForceEmpathy (8803) | Force Empathy | Sensory | — | 1 | neutral | forceSense:10 | — | — | Force Empathy (400) | FORCE_ABILITY_RULES lists it as ForceSense sub at FS>=30 (catalog root, FS10) |
| ForceSight (8804) | Force Sight | Sensory | — | 1.5 | neutral | forceSense:21 | — | — | Force Sight (410) | matches lore |
| PrecognitiveReflexes (8805) | Precognitive Reflexes | Sensory | — | 2.5 | neutral | forceSense:21, forceControl:10 | — | — | Precognitive Reflexes (420) | matches lore |
| EnvironmentalForceSense (8806) | Environmental Force Sense | Sensory | — | 2.5 | neutral | forceSense:30 | — | — | Environmental Force Sense (430) | matches lore |
| ForceVision (8807) | Force Vision | Sensory | — | 4 | neutral | forceSense:41 | — | — | Force Vision (440) | matches lore |
| BattleForesight (8808) | Battle Foresight | Sensory | — | 4 | neutral | forceSense:61, forceControl:41 | — | — | Battle Foresight (450) | FORCE_ABILITY_RULES says FS>=21 vs catalog FS61+FC41 |
| Shatterpoint (8809) | Shatterpoint | Sensory | — | null | neutral | forceSense:61, forceKnowledge:51, BattleForesight:41, meditation:41 | — | — | Shatterpoint (459) | Path B (ShatterSense) lives on separate masterXP.shatterpoint track; key deleted from forceAbilities for ShatterSense holders (4807, 7060) |
| Farsight (8810) | Farsight | Sensory | — | 2.5 | neutral | forceSense:30, meditation:20 | — | — | Farsight (526) | matches lore |
| Postcognition (8811) | Postcognition | Sensory | — | 2.5 | neutral | forceSense:30, forceKnowledge:15 | — | — | Postcognition (536) | matches lore |
| AingTiiFightingSight (8812) | Aing-Tii Fighting-Sight | Sensory | — | 4 | neutral | forceSense:41, forceControl:30 | aingTiiContact, aingTiiApproved | — | Aing-Tii Fighting-Sight (546) | flags aingTiiContact+aingTiiApproved (never checked by code) |
| ControlPain (8816) | Control Pain | Body | — | null | neutral | forceControl:20, meditation:15 | — | — | Control Pain (604) | MISMATCH: lore FC25+/Med20+, D=2.5; code FC20/Med15, D=null |
| ForceJump (8817) | Force Jump | Body | — | 1 | neutral | forceControl:5 | — | — | Force Jump (563) | matches lore |
| ForceSpeed (8818) | Force Speed | Body | — | 1.5 | neutral | forceControl:10 | — | — | Force Speed (573) | matches lore |
| ForceStrength (8819) | Force Strength | Body | — | 1 | neutral | forceControl:15 | — | — | Force Strength (583) | matches lore |
| ForceEndurance (8820) | Force Endurance | Body | — | 1.5 | neutral | forceControl:10, endurance:10 | — | — | Force Endurance (594) | matches lore |
| ForceEnhancedReflexes (8821) | Force-Enhanced Reflexes | Body | — | 2.5 | neutral | forceSense:15, forceControl:10 | — | — | Force-Enhanced Reflexes (615) | matches lore |
| ForceHealSelf (8822) | Force Heal (Self) | Body | — | 2.5 | light | meditation:21, forceControl:15 | — | — | Force Heal (Self) (625) | LORE_DATABASE uses non-catalog "ForceHeal" 12 times; no alias, ambiguous Self vs Others |
| ForceValor (8823) | Force Valor | Body | — | 2.5 | light | Battlemind:15, forceOutput:15 | — | — | Force Valor (635) | matches lore |
| ForceCamouflage (8824) | Force Camouflage | Body | — | 4 | neutral | forceControl:41 | — | — | Force Camouflage (648) | matches lore |
| ForceCloak (8825) | Force Cloak | Body | ForceCamouflage | 4 | neutral | ForceCamouflage:30 | — | — | Force Cloak (658) | matches lore |
| BreathControl (8826) | Breath Control | Body | — | 1.5 | neutral | meditation:15, endurance:10 | — | — | Breath Control (668) | matches lore |
| Tapas (8827) | Tapas | Body | — | 1.5 | neutral | meditation:21, endurance:10 | — | — | Tapas (678) | matches lore |
| HibernationTrance (8828) | Hibernation Trance | Body | — | 2.5 | neutral | meditation:30, BreathControl:15 | — | — | Hibernation Trance (688) | matches lore |
| Alchaka (8829) | Alchaka | Body | — | 1.5 | neutral | meditation:15, anySaberForm:10 | — | — | Alchaka (698) | Lore align "Neutral (Light leaning)" |
| ForceBody (8830) | Force Body | Body | — | 4 | neutral | ForceEndurance:30, forceControl:30 | — | ForceBodyControl | Force Body (708) | Alias ForceBodyControl maps here. FORCE_ABILITY_RULES treats ForceBody as parent of ForceStrength/ForceCamouflage with prereq FC>=5 — contradicts catalog |
| ResistAging (8831) | Resist Aging | Body | — | 4 | neutral | meditation:41, forceControl:30, forceKnowledge:21 | — | — | Resist Aging (718) | matches lore |
| MindTrick (8837) | Mind Trick | Mental | — | 1 | neutral | forceControl:15, willpower:10 | — | — | Mind Trick (734) | matches lore |
| ForcePersuasion (8838) | Force Persuasion | Mental | MindTrick | 2.5 | neutral | MindTrick:21, charisma:15 | — | — | Force Persuasion (744) | matches lore |
| MindControl (8839) | Mind Control | Mental | MindTrick | 4 | dark | MindTrick:30, forceControl:30, darkSide:15 | — | — | Mind Control (752) | matches lore |
| ForceProjection (8840) | Force Projection | Mental | MindTrick | 2.5 | neutral | MindTrick:21, forceControl:25 | — | — | Force Projection (760) | matches lore |
| ForceFear (8841) | Force Fear | Mental | MindTrick | 2.5 | dark | MindTrick:21, darkSide:10 | — | — | Force Fear (768) | matches lore |
| ForceHorror (8842) | Force Horror | Mental | ForceFear | 4 | dark | ForceFear:21, darkSide:30 | — | — | Force Horror (776) | Nested sub (par ForceFear) |
| ForceInsanity (8843) | Force Insanity | Mental | ForceHorror | 4 | dark | ForceHorror:21, darkSide:50 | — | — | Force Insanity (784) | Nested sub (par ForceHorror) |
| MindProbe (8844) | Mind Probe | Mental | — | 4 | dark | forceControl:41, forceSense:30 | — | — | Mind Probe (794) | Lore align "Dark Side leaning"; code dark |
| DrainKnowledge (8845) | Drain Knowledge | Mental | — | 2.5 | dark | MindProbe:21, darkSide:20 | — | — | Drain Knowledge (804) | matches lore |
| MemoryWalk (8846) | Memory Walk | Mental | — | 2.5 | dark | MindProbe:30, darkSide:25 | — | — | Memory Walk (Torture by Chagrin) (814) | Lore alt name "Torture by Chagrin" — no alias |
| MindShard (8847) | Mind Shard | Mental | — | 2.5 | dark | MindProbe:21, darkSide:20 | — | — | Mind Shard (824) | matches lore |
| ForceInsight (8848) | Force Insight | Mental | — | 1.5 | neutral | forceKnowledge:21, meditation:15 | — | — | Force Insight (834) | matches lore |
| ForceComprehension (8849) | Force Comprehension | Mental | — | 1.5 | neutral | forceKnowledge:15, meditation:10 | — | — | Force Comprehension (843) | matches lore |
| ComprehendSpeech (8850) | Comprehend Speech | Mental | — | 1 | neutral | forceKnowledge:21, forceSense:15 | — | — | Comprehend Speech (853) | matches lore |
| ForceListening (8851) | Force Listening | Mental | — | 4 | neutral | meditation:41, forceSense:30 | — | — | Force Listening (863) | matches lore |
| Battlemind (8852) | Battlemind | Mental | — | 2.5 | light | meditation:21, willpower:20 | — | ForceFortitude, Force Fortitude, Fortitude, ForceBattlemind, BattleMind | Battlemind (873) | Aliases ForceFortitude/Fortitude map here (no lore basis found for "Force Fortitude") |
| ForceBarrier (8858) | Force Barrier | Defense | — | 1 | neutral | forceControl:10 | — | ForceBarrier2 | Force Barrier (889) | Separate numeric field characterSheet.forceBarrier (0-100) is unrelated to the ability level; alias ForceBarrier2. Prompt names "ForceArmor" but alias map lacks it |
| ProtectionBubble (8859) | Protection Bubble | Defense | ForceBarrier | 2.5 | neutral | ForceBarrier:30, forceControl:25 | — | — | Protection Bubble (899) | matches lore |
| Tutaminis (8860) | Tutaminis | Defense | — | 4 | light | ForceBarrier:21, meditation:21, forceControl:21 | — | — | Tutaminis (909) | matches lore |
| ForceAbsorb (8861) | Force Absorb | Defense | Tutaminis | 2.5 | light | Tutaminis:15, meditation:15 | — | — | Force Absorb (919) | matches lore |
| ForceResistance (8862) | Force Resistance | Defense | — | 1.5 | neutral | ForceBarrier:15, willpower:20 | — | — | Force Resistance (929) | matches lore |
| WallOfLight (8863) | Wall of Light | Defense | — | 4 | light | Tutaminis:21, forceControl:41, forceKnowledge:41, lightSide:30 | — | — | Wall of Light (939) | matches lore |
| ForceSuppression (8864) | Force Suppression | Defense | — | 2.5 | neutral | forceControl:41, forceKnowledge:30 | — | — | Force Suppression (949) | matches lore |
| ForceBreach (8865) | Force Breach | Defense | ForceSuppression | 2.5 | neutral | ForceSuppression:15 | — | — | Force Breach (959) | matches lore |
| SeverForce (8866) | Sever Force | Defense | — | 4 | neutral | forceControl:61, forceKnowledge:51, ForceSuppression:30 | — | — | Sever Force (968) | Lore align Dark/Light by use; code neutral |
| BattleMeditation (8867) | Battle Meditation | Defense | — | 4 | light | meditation:61, forceControl:41, forceKnowledge:30 | — | — | Battle Meditation (978) | FORCE_ABILITY_RULES prereq (Med21+Will20) is actually Battlemind's; BattleMeditationAffinity talent XP ×(1/0.3) at 7003 |
| ElectricJudgment (8868) | Electric Judgment | Defense | — | 4 | light | forceControl:41, willpower:40, lightSide:40 | — | — | Electric Judgment (989) | matches lore |
| ForceHealOthers (8871) | Force Heal (Others) | Healing | — | 2.5 | light | ForceHealSelf:21, lightSide:10 | — | — | Force Heal (Others) (1005) | matches lore |
| Revitalize (8872) | Revitalize | Healing | — | 2.5 | light | ForceHealOthers:21, meditation:20 | — | — | Revitalize (1015) | matches lore |
| TransferForce (8873) | Transfer Force | Healing | — | 2.5 | light | ForceHealOthers:30, ForceBarrier:15 | — | — | Transfer Force (1025) | matches lore |
| DetoxifyPoison (8874) | Detoxify Poison | Healing | — | 1.5 | neutral | meditation:15, ForceHealSelf:10 | — | — | Detoxify Poison (1035) | Lore says "ForceHeal 10+" (ambiguous); code reads as ForceHealSelf |
| CureDisease (8875) | Cure Disease | Healing | — | 1.5 | neutral | ForceHealSelf:15 | — | — | Cure Disease (1045) | matches lore |
| DarkTransfer (8876) | Dark Transfer | Healing | — | 4 | dark | ForceHealOthers:61, MidiChlorianManipulation:30 | — | — | Dark Transfer (1055) | Lore "...MidiChlorianManipulation 30+ OR extreme innate talent" — OR branch dropped; lore align Dark/Light, code dark |
| ForceLight (8879) | Force Light | Light | — | 2.5 | light | ForceBarrier:30, forceKnowledge:30, lightSide:30 | — | — | Force Light (1071) | matches lore |
| ForceEnlightenment (8880) | Force Enlightenment | Light | — | 4 | light | meditation:61, forceControl:51 | — | — | Force Enlightenment (1081) | Lore also requires "all primary abilities at Adept tier" — dropped |
| AuraOfSerenity (8881) | Aura of Serenity | Light | — | 2.5 | light | meditation:41, willpower:30 | — | — | Aura of Serenity (1091) | matches lore |
| Malacia (8882) | Malacia | Light | — | 2.5 | light | forceControl:41, MindTrick:21 | — | — | Malacia (1100) | matches lore |
| FloatingMeditation (8883) | Floating Meditation | Light | — | 1.5 | neutral | meditation:41, Telekinesis:21 | — | — | Floating Meditation (1110) | Lore align "Light leaning (Neutral in pure practice)"; lore anchors include Telekinesis ability; code anchors meditation only |
| Revelation (8884) | Revelation | Light | — | 2.5 | light | forceSense:41, forceKnowledge:30, lightSide:20 | — | — | Revelation (1120) | matches lore |
| ForceLightning (8888) | Force Lightning | Dark | — | null | dark | forceControl:41, darkSide:20 | — | — | Force Lightning (1137) | FORCE_ABILITY_RULES lists ChainLightning at FL>=10 (catalog 30) and non-catalog LightningBurst |
| ForceShock (8889) | Force Shock | Dark | ForceLightning | 1 | dark | ForceLightning:10 | — | — | Force Shock (1146) | matches lore |
| ChainLightning (8890) | Chain Lightning | Dark | ForceLightning | 2.5 | dark | ForceLightning:30, darkSide:30 | — | — | Chain Lightning (1153) | matches lore |
| ForceStorm (8891) | Force Storm (Lightning) | Dark | ForceLightning | 4 | dark | ForceLightning:61, darkSide:60 | — | — | Force Storm (Lightning) (1160) | Label "Force Storm (Lightning)"; AI "ForceStorm" can never mean the Wormhole ability |
| ForceDrain (8892) | Force Drain | Dark | — | 2.5 | dark | forceControl:30, darkSide:25 | — | — | Force Drain (1170) | FORCE_ABILITY_RULES says dark>=30+Telekinesis>=21 vs catalog FC30+dark25 |
| ForceRage (8893) | Force Rage | Dark | — | 1.5 | dark | ForceStrength:15, darkSide:20 | — | — | Force Rage (1180) | matches lore |
| ForceScream (8894) | Force Scream | Dark | — | 2.5 | dark | darkSide:40, willpower:40 | — | — | Force Scream (1190) | Lore anchors ForceOutput + Willpower; code forceOutput only; lore align "Dark leaning" |
| WavesOfDarkness (8895) | Waves of Darkness | Dark | — | 2.5 | dark | darkSide:50, forceControl:41 | — | — | Waves of Darkness (1200) | Lore anchor includes Dark Side alignment (not a stat) |
| Darksight (8896) | Darksight | Dark | — | 1.5 | dark | forceSense:21, darkSide:15 | — | — | Darksight (1210) | matches lore |
| DarkEnergyTrap (8897) | Dark Energy Trap | Dark | — | 2.5 | dark | forceControl:41, darkSide:30 | — | — | Dark Energy Trap (1220) | matches lore |
| DeadlySight (8898) | Deadly Sight | Dark | — | 4 | dark | darkSide:70, forceControl:71 | — | — | Deadly Sight (1230) | matches lore |
| ForceSubjugate (8899) | Force Subjugate | Dark | — | 4 | dark | MindControl:21, darkSide:30 | — | — | Force Subjugate (1240) | Prereq MindControl is a sub-ability — unreachable as level |
| SuttaChwituskak (8900) | Sutta Chwituskak | Dark | — | 4 | dark | forceKnowledge:61, darkSide:60 | — | — | Sutta Chwituskak (1250) | matches lore |
| FieryEnergy (8901) | Fiery Energy | Dark | — | 1.5 | dark | darkSide:30, Telekinesis:21 | — | — | Fiery Energy (1260) | Lore anchor includes Dark Side alignment (not a stat) |
| SpearOfMidnightBlack (8902) | Spear of Midnight Black | Dark | — | 4 | dark | darkSide:60, forceControl:61 | — | — | Spear of Midnight Black (Darkshear) (1270) | Lore alt name "Darkshear" — no alias |
| FlowWalking (8905) | Flow-Walking | SpaceTime | — | 4 | neutral | forceSense:61, forceControl:51 | aingTiiContact, aingTiiApproved | — | Flow-Walking (1286) | flags never checked by code |
| Teleportation (8906) | Teleportation | SpaceTime | — | 4 | neutral | forceControl:81, forceSense:61 | — | — | Teleportation (1296) | matches lore |
| Phase (8907) | Phase | SpaceTime | — | 4 | neutral | meditation:51, forceControl:41 | fallanassiContact | — | Phase (1306) | flag never checked |
| FoldSpace (8908) | Fold Space | SpaceTime | — | 4 | neutral | meditation:51, forceControl:51 | fallanassiContact | — | Fold Space (1316) | flag never checked |
| ArtOfTheSmall (8909) | Art of the Small | SpaceTime | — | 4 | neutral | meditation:51, forceControl:41 | — | — | Art of the Small (1326) | matches lore |
| DimensionShift (8910) | Dimension Shift | SpaceTime | — | 4 | neutral | forceControl:61, Teleportation:15 | — | — | Dimension Shift (1336) | matches lore |
| ForceStormWormhole (8911) | Force Storm (Wormhole) | SpaceTime | — | 4 | dark | darkSide:90, forceControl:91, ForceStorm:41 | — | — | Force Storm (Wormhole) (1346) | Prereq ForceStorm is a sub-ability (proficiency %), compared as a level — unreachable in sim (see bugs) |
| AnimalBond (8914) | Animal Bond | Nature | — | 1 | neutral | forceSense:21 | — | — | Animal Bond (1362) | matches lore |
| PlantSurge (8915) | Plant Surge | Nature | — | 1.5 | light | forceSense:21, meditation:15 | — | — | Plant Surge (1372) | matches lore |
| Pyrokinesis (8916) | Pyrokinesis | Nature | — | 1.5 | neutral | Telekinesis:25, forceControl:20 | — | — | Pyrokinesis (1382) | matches lore |
| AlterEnvironment (8917) | Alter Environment | Nature | — | 2.5 | neutral | forceSense:30, forceControl:30 | — | — | Alter Environment (1392) | matches lore |
| ForceEcho (8920) | Force Memory / Force Echo | Arcane | — | 2.5 | neutral | forceKnowledge:41, meditation:30 | — | — | Force Memory / Force Echo (1408) | Lore name "Force Memory / Force Echo" — no ForceMemory alias |
| ForceBond (8921) | Force Bond | Arcane | — | 2.5 | neutral | forceSense:30, forceControl:20 | — | — | Force Bond (1418) | matches lore |
| KyberResonance (8922) | Kyber Resonance | Arcane | — | 1.5 | neutral | forceKnowledge:30 | — | — | Kyber Resonance (1428) | matches lore |
| ForcePhantom (8923) | Force Phantom | Arcane | — | 4 | neutral | ForceSight:41, forceControl:41 | — | — | Force Phantom (1438) | matches lore |
| MechuDeru (8924) | Mechu-deru | Arcane | — | 2.5 | dark | forceKnowledge:30, forceControl:25 | — | — | Mechu-deru (1448) | Lore prereq adds "Dark Side drift or Jedi Sentinel specialization" — dropped; align dark |
| ForceScribe (8925) | Force Scribe | Arcane | — | 1 | neutral | forceControl:15 | — | — | Force Scribe (1458) | matches lore |
| SithAlchemy (8929) | Sith Alchemy | SithAlchemy | — | null | dark | forceKnowledge:81, darkSide:80 | sithTextAccess | — | Sith Alchemy (1474) | flag from lore note "Requires access to Sith texts" |
| MidiChlorianManipulation (8930) | Midi-chlorian Manipulation | SithAlchemy | — | null | dark | SithAlchemy:30, forceKnowledge:91, darkSide:90 | sithTextAccess | — | Midi-chlorian Manipulation (1483) | Lore has no explicit flag; code adds sithTextAccess |
| TransferEssence (8931) | Transfer Essence | SithAlchemy | — | null | dark | darkSide:80, forceKnowledge:71, meditation:51 | sithTextAccess | — | Transfer Essence (1492) | sithTextAccess flag is code interpretation of lore note "Sith technique" |
| ThoughtBomb (8932) | Thought Bomb | SithAlchemy | — | null | dark | darkSide:95, forceControl:91, SithAlchemy:41 | sithTextAccess | — | Thought Bomb (1501) | "Sith ritual knowledge" mapped to sithTextAccess |
| Shadowstrike (8933) | Shadowstrike | SithAlchemy | — | 2.5 | dark | darkSide:50, anySaberForm:61, forceControl:41 | sithTextAccess | — | Shadowstrike (1510) | Code adds sithTextAccess flag; lore lists no flag |
| SummonFear (8934) | Summon Fear | SithAlchemy | — | 4 | dark | forceKnowledge:51, darkSide:40 | sithTextAccess | — | Summon Fear (1520) | Matches lore incl. sithTextAccess (flag never checked by code) |
| ForceWhisper (8938) | Force Whisper | Misc | — | 1 | neutral | forceSense:20, forceControl:15 | — | — | Force Whisper (1534) | matches lore |
| ForceStasis (8939) | Force Stasis | Misc | — | null | neutral | forceControl:25, willpower:20 | — | — | Force Stasis / Force Stun (1544) | Lore name "Force Stasis / Force Stun", align "Light leaning"; code neutral; no ForceStun alias |
| ForceSlow (8940) | Force Slow | Misc | ForceStasis | 1 | neutral | forceControl:15 | — | — | Force Slow (1553) | matches lore |
| ForceStasisField (8941) | Force Stasis Field | Misc | ForceStasis | 2.5 | light | ForceStasis:30, forceControl:35 | — | — | Force Stasis Field (1559) | matches lore |
| ForceAffliction (8942) | Force Affliction | Misc | ForceStasis | 2.5 | dark | ForceSlow:20, darkSide:25 | — | — | Force Affliction → Force Plague (1565) | Lore pairs it with Force Plague — Plague has no code entry. Prereq ForceSlow is a sub-ability (unreachable as level) |
| ForceWeapon (8943) | Force Weapon | Misc | — | 1.5 | neutral | forceControl:21, Telekinesis:15 | — | — | Force Weapon (1573) | Lore anchors include Telekinesis ability; code forceControl only |
| ForceBellow (8944) | Force Bellow | Misc | — | 1 | neutral | forceControl:10, charisma:10 | — | — | Force Bellow (1583) | matches lore |

> Note (2026-11-20): Shadowstrike (its row in the table above) was rejected in D-278 as a Ta-Ree spell, not a Force power; the table is kept as the original audit.

### Alias map and collisions

| Alias (legacy/index.html:8951-8959) | Maps to | Note |
|---|---|---|
| ForceFortitude, Force Fortitude, Fortitude | Battlemind | The lore doc has no "Force Fortitude". This mapping was a legacy judgment call |
| ForceBattlemind, BattleMind | Battlemind | Case and prefix variants; safe |
| ForceBarrier2 | ForceBarrier | Safe |
| ForceBodyControl | ForceBody | Questionable. "Body control" could just as well mean ControlPain, ForceEndurance or BreathControl. `FORCE_ABILITY_RULES` also uses ForceBody differently, as the parent of ForceStrength/ForceCamouflage (10525-10527) |

Collisions and gaps:
- **ForceHeal** (12 uses in LORE_DATABASE, and a key in FORCE_ABILITY_RULES at 10535) has no alias. It could mean ForceHealSelf or ForceHealOthers.
- **ForceArmor** is named in the prompt as meaning ForceBarrier (2390), but it is not in the alias map.
- **ForceStorm** is the Lightning sub-ability (8891). The Wormhole ability is `ForceStormWormhole` (8911). If the AI writes "ForceStorm" meaning the space/time ability, it resolves to the wrong one.
- **ForceSense** is both an ability (8802) and a stat (`forceStats.forceSense`). `ForceKnowledge`, `Meditation` and `ForceOutput` are also used as *ability* keys in FORCE_ABILITY_RULES and LORE_DATABASE. Prereq parsing tells abilities from stats by letter case alone (11199-11203).
- **TelekineticBurst** (a RULES sub-ability, 10520) collides with the talent `NaturalTelekineticBurst` and the innate ability `TelekineticBurstPassive`.
- Missing alternate names from the lore doc: TortureByChagrin → MemoryWalk, Darkshear → SpearOfMidnightBlack, ForceMemory → ForceEcho, ForceStun → ForceStasis. ForcePlague has no catalog entry to point to.
- The `_FORM_CANON` aliases `jar` → JarKai and `kii` → KiiShikk match only those exact stripped strings (4842-4843).

## Replaced by

- `force-catalog.md`: the catalog itself (fields, aliases, synergy, form matchups, availability). The legacy catalog is a coverage source only.
- `progression-numbers.md`: the XP curve and sub-ability synergy that replace the proficiency cost curve, discounts, soft cap and trickle. Per v170-audit: parent → sub 0.10, sub → parent 0.15.
- `training-routines.md`: sim activity generation (`simBuildActivityOptions`, `FORM_WEIGHT_PROFILES`, `FAM_STRAIN_BIAS`).
- `health.md`: Force Barrier integrity and the per-family strain bias. A Force load per use replaces both.
- `ai-events.md`: the TRAINING:/XP:/PROFICIENCY:/FORCE_BARRIER= tags and all narrative regex.
- `rolls.md`: form counter bonuses (matchups of −1/0/+1).
- `npc-generation.md`: NPC archetype ability lists and levels.
- `alignment.md`: the `darkSide`/`lightSide` prereq gates.
- **None — needs a v2 spec:** the unlock/learning rule. Who may start a new ability or form, how prereqs, teachers and story flags are checked, and how story flags get set.

## Open questions for Jared

1. Should the v2 lightsaber form list follow the lore doc (one `ShienDjemSo` key, plus Tràkata, Sokan, Dun Möch, Zero-G and Saberstaff) or the code (separate Shien and Djem So, plus Kii-Shikk)? Do you want Kii-Shikk, given it is not in the lore doc?
2. Force Plague is in the lore doc but not the code. Should it be its own ability, a stage of Force Affliction, or dropped?
3. Control Pain: the lore doc says FC 25 / Meditation 20 with D=2.5. The code says FC 20 / Meditation 15 with no sub-ability track. Which is right?
4. Should Shadowstrike, Midi-chlorian Manipulation and Transfer Essence require Sith-text access (as the code does) or not (as the lore prereqs read)?
5. Story flags (Aing-Tii, Fallanassi, Sith texts, Council permission, Mace Windu): who sets them in v2? Story events the AI proposes and code checks, or the player only?
6. Are the aliases "Force Fortitude → Battlemind" and "ForceBodyControl → Force Body" correct, or should they map elsewhere or be rejected?
7. Does "ForceHeal" (used for many canon NPCs) mean Force Heal (Self), Force Heal (Others), or a family name for both?
8. Is the Force Barrier a learned ability (lore doc: FC 10+), or does every Padawan have it passively (old prompt)? Should v2 keep a separate barrier integrity meter at all, or fold it into the Force meter and health model?
9. The lore doc's innate talent effects (Force Reservoir = +20 max barrier; Blade Intuition = +5 levels at creation; ShatterSense = ×0.1 cost) differ from what the code does. Which is canon for v2?
10. Some lore prerequisites are not plain numbers ("OR extreme innate talent", "all primary abilities at Adept tier", "Jedi Sentinel specialization"). Should they stay as story-checked conditions, or become numbers?
11. The lore database uses 16 ability names that are not in the catalog (MindDomination, SithSorcery, BattleMeld, Multipresence, MindWalking and others). Should they become catalog entries, aliases of existing entries, or be rewritten in the character files?
