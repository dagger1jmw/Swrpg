# Alignment spec vs dark-side lore: audit

2026-11-21. Report only: no spec was changed.

**Compared:** `docs-v2/spec/alignment-m6.md` (export of rev 30) against `Docs/SWRPG lore/SW_DarkSide_Fall_Corruption_Redemption_Part1.md`, `_Part2.md` and `_Part3.md` (Old Republic to 1000 BBY; 1000 BBY–4 ABY; 4 ABY onward).

**Finding types:**
- **Contradicts:** the spec says one thing and the lore says another.
- **Unsupported:** the spec assumes something the lore does not back.
- **Missing:** the lore says something matters and the spec has no rule for it.

**Lore references:** P1, P2 and P3 are the three parts, followed by the section (for example "P2 §4" is Part 2, Section 4, Physical corruption). "Game notes" in the lore files are the bot's suggestions, not lore; they are quoted here only where they summarise the lore's own cases.

**Numbers:** every number below comes from the spec's own tables. Where the spec's rules produce a result, the arithmetic is shown.

## Summary

| # | Topic | Type | Finding | Weight |
|---|---|---|---|---|
| 1 | Redemption | Contradicts | Redemption from deep Dark leaves the character still fallen by the spec's own rule | High |
| 2 | Outside pressure | Missing | Dark places, spirits, artifacts and dark mentors speed falls in the lore; in the spec they add only immersion, which never raises Dark | High |
| 3 | Fall speed | Missing | No fall-speed target. The spec's caps let a Knight fall in about 3 scenes; the lore's falls run from days (outside force) to years (self-driven) | High |
| 4 | Redemption | Missing | Lore redemptions often happen *to* the character (cut off from the Force, a mind wipe, a loved one's appeal, the power fading); the spec only allows the character's own deed at a temptation moment | Medium |
| 5 | Redemption | Missing | Shim's Stage 4 requires the act be done *without* the dark side, and a Dark Jedi unwilling to give up the powers cannot be saved | Medium |
| 6 | Lasting hold | Missing | Every later-era redemption keeps a hold that flares under stress (guilt, a shadow, Revan's dark half); the spec has the hold table but no flare | Medium |
| 7 | Fall speed | Unsupported | The context modifiers reduce Dark for good motives; the lore says "for the mission" and "to save a loved one" are the classic route to the fall (Shim's Stage 3) | Medium |
| 8 | Physical corruption | Contradicts | The spec says a redeemed character's skin colour returns; Vader's skin stayed white at his redemption, and only his eyes returned | Medium |
| 9 | Physical corruption | Missing | Corruption varies widely by person in the lore (Ulic, Kun, Revan and Dooku unmarked; Caedus eyes only after a year; Teneniel Djo marked at once); the spec has one fixed rate | Medium |
| 10 | Madness | Missing | The spec has no madness at all; the lore treats the dark side as an amplifier of existing instability, with paranoia as the common form | Medium |
| 11 | Gray use | Contradicts | The lore says Gray Jedi are "free of dark-side corruption"; the spec keeps 25% of Corruption build-up | Low |
| 12 | Gray use | Unsupported | The spec's Gray is a score band; in the lore, "Gray" is mostly an institutional label for defying the Council (Qui-Gon, the Gray Paladins), not dark-side use | Low |
| 13 | Gray use | Missing | Light-side Jedi who use dark powers as tools (Kyle Katarn, Jaden Korr) or dark-tinged forms (Windu's Vaapad) stay light in the lore; under the spec every dark-tagged use adds Dark | Medium |
| 14 | Gray use | Missing | Vaapad and Juyo are recorded fall routes with a user-dependent risk; the spec has no rule for them | Low |
| 15 | Physical corruption | Contradicts | Dooku is the spec's "Normal" eye example; the lore records his eyes turning yellow in anger | Low |
| 16 | Physical corruption | Contradicts | The spec's "Fading" example is Anakin at the end of *Return of the Jedi*; the lore has his eyes blue again at once, at his redemption | Low |
| 17 | Physical corruption | Unsupported | The Sith alchemy mask rests on the lore's weaker version of Palpatine's face (alchemy); the lore's best fit is his own deflected lightning | Low |
| 18 | Physical corruption | Missing | The dark side also prolongs life (Andeddu, Sion, Krayt) and its healing is temporary, with named exceptions; the spec has only the costs | Low |
| 19 | Outside pressure | Contradicts | A non-Force-sensitive (Colonel Tobin) was twisted and driven mad by exposure to Nihilus; the spec gives non-Force-sensitives no effects | Low |
| 20 | Gray use | Missing | The light side can unbalance a user too (Darth Gravid); the spec has no downside to high Light | Low |
| 21 | Fall speed | Missing | No tags for the deeds the lore names as near points of no return: taking up a Sith artifact, killing a loved one or ally | Low |
| 22 | Outside pressure | Missing | Dark sites mask presence (Yoda hid beside the Cave of Evil); the sensing rules ignore location | Low |

## 1. Redemption leaves the character fallen (Contradicts; High)

**Spec (§6).** Redemption: Dark falls by 30% of its value, Light gains 15, immersion drops to 0. The fall: Dark 50+ and Dark higher than Light.

**The arithmetic.** Dark D and Light L become 0.7D and L + 15. The character is still fallen when 0.7D ≥ 50 and 0.7D > L + 15, that is from Dark about 72 up.
- Sith Lord archetype (Light 5, Dark 75): after redemption Dark 52.5, Light 20. Still fallen; lean label "Dark" (difference 32.5).
- Dark Lord archetype (Light 0, Dark 90), the Vader case: Dark 63, Light 15. Still fallen; lean "Dark".
- The hold table then removes only 0.08 Dark per Light point at Dark 50–74, so the climb out takes about 30 more Light points.

**Lore.** Vader returns "as a Jedi spirit" with blue eyes (P2 §3). Luke on Byss and Kyp return in one arc (P3 §3). Bastila returns "within the same battle" (P1 falls table). Their redemptions are complete turns back, though with a lasting hold (finding 6).

**For Jared.** The redemption effect needs to end the fall: for example, set Dark below both 50 and Light, or clear the fallen flag directly and leave the hold to finding 6's mechanism.

## 2. Outside pressure does not speed the fall (Missing; High)

**Spec (§9, §7).** Dark nexus sites add immersion while you draw there. Outside power sources add Corruption and immersion. Immersion drives the eyes and Corruption, not Dark, so none of these moves a character toward the fall.

**Lore.** Outside forces are the lore's main fall accelerant:
- Wounds in the Force cause a "rapid fall to the dark side or worse"; Revan used Malachor V to break Jedi quickly; Nihilus fell immediately (P1 §1, §7, falls table).
- A Sith spirit turned Kyp in days to weeks; the reborn Emperor turned Luke within months (P3 §1, falls table). The P3 Game notes summarise: outside dark forces produce falls in days to months, self-driven falls take years.
- Sith amulets multiplied Kun's anger "a hundredfold" (P1 §1, §7); Sith holocrons corrupted Atris (P1 §7).
- Persons as nexuses: Sidious carried one, Vader had a similar aura, Bastila felt Malak's (P2 §7).
- Dark mentors feed dependencies: Caedus kept Tahiri "never fully satisfied" with flow-walking (P3 §1).
- Torture: Bastila fell in about a week under Malak's torture; Komari Vosa fell under Bando Gora torture (P1 and P2 falls tables). This bears on the conversion-by-torture check (D-319).
- Site strength changes by era: Korriban's pull had faded by c. 1000 BBY (Bane) and was strong again c. 23 BBY (P1 §7, P2 §7).

**For Jared.** A pressure input to Dark (or to the temptation threshold) from places, artifacts, spirits, dark mentors, torture and dark persons nearby, with per-site strength by era.

## 3. No fall-speed target (Missing; High)

**Spec.** The fall is pure accumulation. The only brakes are the per-scene cap (+15 Dark from deeds) and the temptation pacing (one per scene, a cool-down). There is no per-day limit and no fall-speed target in §10's harness list.

**The arithmetic.** A Jedi Knight (Light 60, Dark 5) taking the full deed cap each scene, with each Dark gain wearing away 25% of that in Light: after n scenes Dark is 5 + 15n and Light is 60 − 3.75n. Dark passes 50 and Light at n = 3, so the Knight falls in 3 scenes, which can be one day. Force-use Dark (§3) is outside the deed cap and makes it faster.

**Lore.** The falls tables give the range:

| Pressure | Cases | Time to fall |
|---|---|---|
| Self-driven, slow | Dooku, Jacen Solo, Cade Skywalker | About 12 to 13 years; about 7 years wavering |
| Slow, with a tipping act | Anakin | About 3 years; the final turn in under a day |
| A war and a mentor | Revan, Quinlan Vos | About 1–2 years |
| Sith teaching and an artifact | Ulic, Exar Kun | Weeks to months |
| An outside dark force | Kyp; Luke on Byss | Days to weeks; months |
| Torture | Bastila | About a week |
| A wound in the Force | Nihilus | Immediate |

The lore's model is "a pattern with decisive moments" (P1 §1): slow pressure plus a tipping act. No source gives a fixed number of dark acts that makes a fall final (P1 §1, Not found).

**For Jared.** A harness target for the M6 re-measure, for example: a Knight with no outside pressure takes months of repeated dark deeds to fall; outside pressure compresses it to days or weeks. The fast 3-scene path is then a tuning question for the caps, not a formula change.

## 4. Redemption that happens to the character (Missing; Medium)

**Spec (§6).** The only trigger is the character's own major or extreme `sacrifice`, `mercy` or `forgiveness` deed at a temptation moment while Dark is 50+.

**Lore.** Several redemptions are done to the character or come from outside:
- Ulic: cut off from the Force by Nomi Sunrider (P1 §3).
- Revan: a Council mind wipe (P1 §3).
- Depa Billaba: the dark power faded (P2 §3).
- A loved one's appeal: Bastila (Revan's love), Luke on Byss (Leia's presence), Kyp (Han's appeals), Quinlan Vos (Aayla and Tholme), Cade (his love for Deliah) (P1–P3 §3).
- P1 §3 Not found: no Old Republic redemption happened without a personal bond or a defeat.

**For Jared.** Story-event triggers the engine can fire (cut off from the Force, mind wipe, a bonded NPC's appeal at a temptation moment), alongside the deed trigger.

## 5. Shim's conditions for redemption (Missing; Medium)

**Lore (P1 §1, Stage 4).**
- A slightly tainted Jedi can atone through meditation, reflection and absolution. The spec supports this: meditation and the hold table at Dark under 50.
- A true Dark Jedi can be redeemed only by a selfless, heroic act done *without the dark side*.
- A Dark Jedi unwilling to give up the powers cannot be saved.

**Spec.** The trigger does not check whether the act used the dark side, and nothing asks the character to give up dark powers. Kyp refused his powers for a time after his redemption (P3 §3).

**For Jared.** A condition that the redeeming act draws no dark-side power that scene, and optionally a period of giving up dark-tagged abilities.

## 6. The lasting hold and relapse (Missing; Medium)

**Spec.** After redemption "the hold table still applies, so staying redeemed takes continued work". There is a `redeemed` flag but no rule that reads it.

**Lore.**
- Every redemption in P3 keeps some hold: "the shadow of the dark side continued to haunt" Luke; Kyp's and Tahiri's guilt; Cade's "fragile line". P3 §3 Not found: no redemption in that era without lasting guilt or relapse.
- Revan's dark half split off under torture and later led the Revanites (P1 §3; a [conflict], developer's call).
- Kyle Katarn came "dangerously close" again after returning (P3 §3).

**For Jared.** The `redeemed` flag lowers the temptation threshold, or adds a stress-triggered temptation moment, so the hold "can flare under stress" (the P3 Game notes summarise it this way).

## 7. Good motives reduce Dark in the spec, but the lore names them as the route to the fall (Unsupported; Medium)

**Spec (§4).** Context modifiers: `provoked` ×0.75 on Dark, `defending_others` ×0.5 on Dark for `excessive_force`, `coerced` ×0.5.

**Lore.**
- Shim's Stage 2 is the delusion that the dark side is a usable shortcut to good ends; Stage 3 is "the end justifies the means" (P1 §1).
- Shim warns that infiltrating the Sith or trying to save loved ones from death are the classic ways famous Jedi explained away their acts: Quinlan Vos's murders as a Dark Acolyte "for the mission", Anakin's betrayal of Windu to save his wife (P2 §1).
- Jacen's acts "for the sake of... a greater good" began his fall (P3 falls table). Corran Horn knew his own excuse was "a justification" (P3 §1).
- Stage 1's "acts of haste" (rushing to help friends) are themselves steps onto the dark path (P1 §1).

`provoked` and `coerced` have no lore basis either way. `defending_others` is not contradicted for proportionate defence, but the lore gives no reason to discount a dark act because its goal was good.

**For Jared.** Keep `coerced` (no lore against it). Narrow or drop `provoked` and `defending_others`, or add the rule that a good motive never reduces `murder`, `torture`, `betrayal` or `atrocity`.

## 8. A redeemed character's skin colour (Contradicts; Medium)

**Spec (§7).** "Surface signs scale with Corruption times immersion, so a redeemed character's skin colour returns while the lasting damage stays."

**Lore (P2 §3, §4).** At his redemption Vader's eyes were blue again, but his skin stayed pale "white"; it "did not recover". The P2 Game notes summarise: "Vader shows permanent pallor with eyes that return at redemption."

**For Jared.** Either pallor joins the lasting damage at high Corruption (the eyes still clear), or Vader is a logged exception. P1 §4 Not found: no Old Republic case of corruption reversing after a redemption.

## 9. Corruption varies by person (Missing; Medium)

**Spec (§7).** One rate: while immersion is 40+, each dark-side draw adds Corruption equal to 2% of the draw's share of pool max. Surface signs come in fixed tiers.

**Lore.**
- The general rule: effects "progress with time and immersion" and are not immediate (P1 §4). The spec's immersion model fits this.
- But the spread is wide (P3 §4 [conflict], best fit: "severity and speed vary by person and by how intensely the dark side is used"):
  - No recorded marks: Ulic, Exar Kun and Revan as Sith (P1 §4; the pages are silent, not denying it); Dooku and Starkiller, eyes only in anger (P2 §4); Luke at Endor; Kyle Katarn.
  - Eyes only after a year of dark-side use: Caedus (P3 §4).
  - Instant: Teneniel Djo's burst blood vessel after one dark-side kill (P3 §4).
  - Uncontrolled power: Gantoris burned "from the inside out" (P3 §4).
- The symptom list also includes whites turning black or red, loss of hair colour, the look of rapid ageing and a lower, raspier voice (P1 §4). The spec's tiers name pallor, gray skin, dark veins, a ravaged look and disfigurement.

**For Jared.** A per-character corruption-resistance factor (from Willpower or a trait), and the voice, hair and ageing signs added to the surface list.

## 10. Madness (Missing; Medium)

**Spec.** No rule. Madness is not mentioned.

**Lore.**
- Cause or amplifier: the dark-side users who went insane were all disturbed or traumatised before they fell, and the dark side made it worse (P2 §6, P3 §6 [conflict], best fit: amplifier). Depa Billaba's trauma came first.
- Paranoia is the common form: Vader (P2 §6), Caedus (P3 §6). Distrust and quick anger come with the dark side generally (P2 §6).
- Hunger rather than madness: Nihilus (P1 §6). Isolation: Exar Kun's "half-mad" spirit (P1 §6, P3 §6).
- Mustafar: Anakin's fighting "degenerating into total madness" (P2 §5).
- Outside-caused: Force psychosis (c. 43 ABY) came from the entity Abeloth, eased when the victim was cut off from the Force and lifted when she was defeated (P3 §6). Yuon Par's "maddening dark side illness" was made by a Sith Lord (P1 §6).
- No Jedi term for dark-side madness as a diagnosis was found in any era (P1–P3 §6, Not found).

**For Jared.** A madness state that needs an existing trauma flag (a severe wound, a loved one's death, torture) plus high immersion, with paranoia as its first stage, read by the narrator as a label. Outside-caused afflictions (Force psychosis) as story events.

## 11. Gray Jedi and Corruption (Contradicts; Low)

**Spec (§6).** While Gray: Corruption build-up ×0.25.

**Lore (P1 §8).** Gray Jedi drew on the dark side "without being corrupted by it or embracing it entirely" and were "free of dark-side corruption". P3 §8 Not found: no Legends rule explains how they avoid it.

**For Jared.** ×0 instead of ×0.25, or keep ×0.25 logged as a design choice for balance.

## 12. "Gray" as a score band (Unsupported; Low)

**Spec (§6).** Gray is a lean label: both Light and Dark 40+ and within 15 of each other.

**Lore.**
- The term dates to the Old Sith Wars, for Jedi who rejected the Council's right to reinterpret the Code (P1 §8).
- Qui-Gon was thought Gray for his disagreements with the Council, "not necessarily" dark-side experimentation (P2 §8). The Gray Paladins were Gray for their methods (blasters, little reliance on the Force), not dark-side use (P2 §8).
- Kyle Katarn used both sides but is called a light-side Jedi, not Gray (P3 §8). Windu used Vaapad and is "not automatic proof of being Gray" (P2 §8).
- The Imperial Knights and the Jensaarai were called Gray as orders (P3 §8).

The spec's band matches Jolee Bindo and the Gray Jedi of P1 §8. It does not match the lore's other main use of the word, which the spec's philosophies (§9: Gray or balance) partly cover.

**For Jared.** Keep the band for the mechanics, and let the narrator's "Gray" label also come from philosophy and standing with the Council.

## 13. Light-side users of dark powers (Missing; Medium)

**Spec (§3).** Dark-tagged abilities add Dark "whatever the intent", except a brief knockout Choke. Gray halves it.

**Lore.**
- Kyle Katarn freely used light- and dark-side powers as "mere tools" and taught his apprentices to do the same; Jaden Korr used both Force lightning and Electric Judgment. Kyle sat on the High Council (P3 §8).
- Jolee Bindo used Force lightning (P1 §8). Some Potentium followers believed lightning and choking were fine with good intentions; the Council said studying the Force's limits leads to the dark side (P2 §8).
- Institutional distrust: Quist's *The Jedi Path* called Gray Jedi a threat; the Potentium was expelled and later called heretical (P1 §8, P3 §8).

Under the spec, Kyle's career of dark-tagged use would push him into the Dark band, which the lore does not show. The lore offers no mechanism either (finding 11).

**For Jared.** Either Kyle-style use is a logged exception (the "tools" philosophy halves or removes Dark from dark-tagged use, with the Order's distrust as the cost), or the lore case is accepted as outside the model.

## 14. Vaapad and Juyo (Missing; Low)

**Lore.**
- Juyo led many Jedi to fall in the New Sith Wars, so the Council restricted it (P1 §1).
- Vaapad leads "through the penumbra of the dark side". Only Windu fully mastered it and Vos came close; the two other advanced users, Depa Billaba and Sora Bulq, fell (P2 §5; [conflict], best fit: a light-side form whose safety depends on the user, and very risky).

**Spec.** No rule. Vaapad's combat stream would add Dark only through anger fuel, if at all.

**For Jared.** A fall-risk rule for Vaapad and Juyo use (the forms' own entries in the Force lore file), for M6 or the form rules.

## 15. Dooku's eyes (Contradicts; Low)

**Spec (§7, §11).** Dooku is the "Normal" eye example: "high Dark, controlled, low immersion". §11 marks it resolved.

**Lore (P2 §4).** Dooku shows no degeneration, but "his eyes turned yellow only in anger" (TCW "Witches of the Mist"). Starkiller is the same (P2 §4).

The spec's own Flicker state (channeling anger or rage with Dark 30+, during the moment only) fits him. Only the example is wrong. Ventress (pale blue eyes) is correct as "Normal".

## 16. Anakin as the "Fading" example (Contradicts; Low)

**Spec (§7).** Fading: the eyes step down one state per few days. Example: "Anakin unmasked at the end of *Return of the Jedi*".

**Lore (P2 §3, §4).** His eyes were blue again at death, at his redemption. The spec's redemption rule (immersion to 0, the eyes clear) already models this; the Fading example describes a gradual fade the lore does not show.

## 17. The Sith alchemy mask and Palpatine's face (Unsupported; Low)

**Spec (§8).** Palpatine's hidden face is a Sith alchemy mask; before his reveal he has "Dark 90+ and very high Corruption hidden by the Mask". The spec flags this as a design choice.

**Lore (P2 §4, [conflict]).**
- Version A: his own lightning, deflected back by Windu, disfigured him. The DS page agrees the change came "mostly" from the lightning.
- Version B: he may have used Sith alchemy to hide his true face as Senator and Chancellor (Jedi Counseling 71).
- The file's best fit is A, "with B as an optional extra layer".

The mask itself is attested, but the spec builds its reveal on the weaker version. Under Version A, Palpatine's face is a lightning wound, which the spec's own §7 assigns to the health system, not to Corruption.

**For Jared.** No change needed if the mask stays an optional layer. Note it in the Sidious-like harness profile so it does not assume the mask is the only cause of his face.

## 18. The dark side's gains to the body (Missing; Low)

**Spec (§7).** Corruption only costs: slower healing, lower Vitality, earlier ageing, a shortened lifespan, failing.

**Lore.**
- The costs match: Bane aged rapidly from dark-side use (P2 §4); Ommin needed an exoskeleton; Sion was held together only by the dark side; Nihilus bound his spirit into his armour (P1 §4). The spec's 95 tier ("survival depends on the dark side") fits Sion and Nihilus.
- But the dark side also prolongs life: Darth Andeddu lived for centuries; Sion's hate gave him immortality (P1 §5, P2 §4).
- Dark-side healing lasts only while the user keeps channelling (Vader's lungs), with named exceptions: the dark transfer (Krayt, Cade), Caedus's self-healing and healing trances (P2 §5, P3 §5).

These belong partly to the Force catalog (healing) rather than alignment. They are listed so the catalog and §7 agree.

## 19. A non-Force-sensitive corrupted by exposure (Contradicts; Low)

**Spec (§9).** Scores are tracked for everyone, but have mechanical effects only for Force-sensitives.

**Lore (P1 §4, §6).** Colonel Tobin, who was not Force-sensitive, took on a twisted body and a dark-sider's look and went mad from being near Nihilus.

An edge case. It fits finding 2's "persons as nexuses" if that is built.

## 20. The light side can unbalance a user (Missing; Low)

**Lore (P2 §3, §6; P3 §8).** Darth Gravid's turn to the light side "eventually drove him insane" (a [conflict]: a redemption by the DS page, madness by the Light side page). Several Gray Jedi held that wholly submitting to either side harms the user.

**Spec.** High Light has only benefits.

The lore has a single case, and it is disputed. This is a note, not a recommendation.

## 21. Deeds the lore weighs most (Missing; Low)

**Lore.** Deeds named as turning points or near points of no return:
- Taking up a Sith artifact (Kun's amulet) (P1 Game notes, from P1 §2 and §7).
- Killing a loved one or an ally: Ulic killing his brother Cay; Jacen killing Mara; Tahiri killing Pellaeon (P1 §3, P3 falls table).
- Anger-driven killing (Ulic and Satal Keto) (P1 §1).
- Refusing a kill order as a strong pull back (Cade) (P3 Game notes, from P3 §2).

**Spec (§4).** `murder`, `atrocity` and `betrayal` cover most of these at major or extreme. There is no tag for taking up a Sith artifact or accepting Sith teaching, and no rule that killing a loved one or an ally sits above `murder`.

## 22. Dark sites mask presence (Missing; Low)

**Lore (P2 §7).** Yoda lived near the Cave of Evil during the Empire because it masked his light-side signature.

**Spec (§8).** Sensing is the sensor's Force Sense against the target's Concealment; location plays no part.

## What the lore supports

These parts of the spec match the lore:
- **Dark rises fast and lets go slowly; the hold deepens.** "Like a strong, addictive narcotic" (P1 §1). Shim: minor taint is atoned for by meditation, a true fall needs more (P1 §1).
- **Surface signs follow immersion; damage underneath lasts.** Effects "progress with time and immersion" (P1 §4). No Old Republic case of corruption reversing (P1 §4).
- **The eyes as a separate, reversible sign.** Dooku and Starkiller (eyes only in anger), Vader's eyes returning at redemption (P2 §4), Caedus's eyes changing first (P3 §4).
- **The 95 tier.** Survival depending on the dark side: Sion, Nihilus, Ommin (P1 §4).
- **Temptation triggers.** Threats to loved ones and the death of a loved one (P2 §1); "acts of haste" (P1 §1); the dark side looking for openings.
- **A temptation can be refused.** Kenobi and Jaina Solo after a loved one's death (P2 §1, P3 §1); Corran Horn refusing Kun (P3 §2); Luke throwing away his saber at Endor (P2 §5).
- **Killers of innocents can still be redeemed.** Anakin and Kyp (P2 §3, P3 §3); Shim's contrary recording is an in-universe opinion (best fit).
- **The dark side as a combat boost with a judgment cost.** Quick to aid in combat; anger, pride and fear cloud judgment (P2 §5).
- **Alignment is not allegiance.** Anakin leaning dark inside the Order (P2 §2).

## Spec §11 lore checks this audit can now answer

| Spec item | Answer from the lore |
|---|---|
| Redemption models: Revan, Bastila Shan, Ulic Qel-Droma | Checked (P1 §3). All three involve a bond or a defeat; Revan's completeness is a [conflict] (findings 4–6) |
| Gray examples: Jolee Bindo | Confirmed (P1 §8): emotional, "only in gray", used Force lightning |
| Gray examples: the Je'daii banning dark-side use | Not as written. The lore has the Je'daii trying to walk the line until a split between followers of each side led to the Force Wars (P1 §8); no ban is described in these files |
| Sith tradition profiles (Banite secrecy vs the Empire's open display) | Not covered by these three files. The Sith Training all-eras files (D-308..D-318) are the place to check |
