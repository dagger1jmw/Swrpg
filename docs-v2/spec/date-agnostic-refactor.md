# Date-agnostic data and the NPC stat model

Jared, 2026-11-22. This is a design brief for Claude Code, written by the lore and design chat. Log it as a decision when you start.

## The principle
3661 BBY is the default start because it lets a character live through many major Old Republic events. It is not the frame for the data.
- Lore and data files hold **dated facts**.
- Everything that depends on the date is **calculated in game** for whatever date the campaign is at: age, rank, status, location, control, who's on the board, stats.
- Snapshot fields ("status in 3661", "status in 3653") are not the structure. Keep their wording only as cited facts inside the spans ("on record as active in 3661").

## 1. What to convert
- **Canon roster** (`era09GreatGalacticWar.ts`, `era09Additions.ts`, `era09Status.ts`):
  - Replace the single `role` and the `status3661`/`status3653` snapshots with dated spans:
    - **ranks and roles:** Padawan / Knight / Master, acolyte / Lord / Darth, offices, military ranks;
    - **status:** active, imprisoned, in stasis, missing, exiled, captured;
    - **location**, where it's on record;
    - birth and death years.
  - Each span carries its source wording and an estimate tag where it isn't stated.
  - `canonBoardAt`, link refusal, placements and the narrator's board view all query the spans at the campaign date.
- **Birth estimates:** drop batch 19's "25 at the earliest dated year" rule. Re-estimate each birth year from the figure's rank spans and facts, tagged `estimate`.
- **Placements** (`canonPlacements.ts`): convert to dated location spans.
- **Start options** (`startOptions.ts`): give each a valid date range. Offer starts by the picked date. Keep the 17 as they are, just date-keyed.
- **Spec 14 seeds:** treat them as a keyframe at 3661, so other start dates can have their own keyframes later.
- **Audit for baked-in 3661 assumptions:** control and leaders, the Order seat, world gates, species gates, era rules, the state block and the start form. Most are already dated spans. Fix any that aren't.

## 2. The NPC stat model
- **At least one complete stat line per canon figure** (required): every stat, set at a period the sources describe well. Record its year, the figure's age then, and the sources it rests on.
- **Partial anchors, as many as the sources support:** each covers only the stats a source shows. For example, a novel may document a figure's Force abilities at one age in detail but barely show their saber work. That novel anchors only the Force stats, at that age.
- **Any other age is calculated** by the existing age and progression maths, run forward and backward from the anchors:
  - Each stat uses its nearest relevant anchor. Between two anchors for the same stat, the maths fits between them.
  - Going backward is clamped at the archetype's baseline for that age.
- **Rank spans shape the curve:** a figure anchored as a Master isn't a Master-level fighter during their Padawan span.
- **Dated events apply on their dates:** injuries, lost limbs, falls, redemptions, imprisonment and stasis. A figure doesn't age or train in stasis.
- **Figures with no hand-set anchor:** the generator builds their complete line from archetype and rank at a chosen date, and the same maths runs from there.
- **When a campaign starts:** each figure's line is calculated once at the start date. After that the NPC progresses through the normal game systems, so the player can change their course.

## 3. How anchors are found (no heavy research pass)
1. **Works table:** build `src/data/canon/works.ts` listing each era work (novels, comics, games, flashpoints and class stories) with its in-universe date or range. Take it from the lore files: the timeline slice and the character files name most works. Mark any work whose date you can't find.
2. **Appearances:** for the hand-set figures (step 4), record which works they appear in and which abilities each work shows. List the gaps; the lore chat or the research bot fills them from each character's Wookieepedia appearances list.
3. **Age at a source** = the work's year minus the birth year. Anchors are set from that.

## 4. Corrections from the quick review (lore-batch-19 report)
- **Over-ranked in 3661** (a later rank applied too early). Fix with rank spans:
  - Lana Beniko: a youth in 3661; her Lord rank is Cold War.
  - Darth Karrid: a former Jedi Padawan. Check her rank in 3661.
  - Yuon Par and Aryn Leneer: Knights in 3661 (Aryn is a Knight in *Deceived*, 3653).
  - Warren Sedoru: Knight, then Master c. 3642 (batch 13).
  - Harkun: not in post in 3661 (batch 12); an Overseer, not a Lord.
  - Parkanas Tark: a 25-year-old Padawan, so check his birth year.
- **Implausible birth years:**
  - Tremel: born 3686e, but he's an Overseer whose son is an acolyte by 3643. Move it much earlier.
  - Darth Ikoral: a 96-year-old acolyte.
  - Oteg: 183 in 3661. Check his species.
  - Braden and Jicoln Cadera: probably older.
  - Fideltin Rusk: born 3680 per the planets file (Mindor), not 3682.
- **State and archetype:**
  - Khem Val: in stasis until found in the Cold War (a status span), and a warrior, not a Sith Lord.
  - Broonmark: a warrior, not an "official".
  - "Galena Rans" and "Rans": probably one person. Merge them if so.
- **Hand-set anchors first:**
  - Spindrall, Tremel and Ragate (Korriban);
  - Karagga (Nal Hutta);
  - Rans; Ven Zallow (Serenno);
  - the Jedi Council;
  - Malcom, Zym, Satele, Ngani Zho and Angral.

## 5. Tests
- Test at several dates (3681, 3667, 3661, 3653, 3643, 3640, 3630), not just 3661.
- The same figure's stats at three ages.
- A figure with a partial anchor: Force stats from one source, saber stats from the complete line.
- Stasis: no ageing and no growth during it.
- The board, starts and placements by date.
- Rerun the harness suites that touch these (the era profile, lifetime and sweep).
