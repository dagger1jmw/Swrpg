# M8 species, answers (2026-11-24; D-474)

Every answer is built and tested, and every gate passes. Tag: `m8-species-2`.

| Check | Result | Runtime |
|---|---|---|
| test:all | 1,581 of 1,581 | 961 s |
| Spread, 20 seeds x 4 profiles | every gate 20/20; Y_avg worst +2.3%; per-hour table worst 2.3% (band ±5%, 129 points) | 1,382 s |
| Band-effect probe | one new flag: Oteg (below) | - |
| typecheck, lint | clean | - |

## 1. What was done

1. **Luke's two gates** replace the old one and pass on 20 of 20 seeds.
   - Body: Strength peaks at 53–56, Agility at 66 and Endurance at 67. I read "physical stats" as the body without the Force boost; with the boost his performance still rises to 89. "Slowly" is at most 5% off the peak at 75 (invented).
   - Force: Force Control, Force Sense and Force Speed still rise at 63. No other profile gate mixes body and Force.
2. **Per-hour table:** the 70, 80, 90 and 98 rows re-measured from the 20-seed run taken after D-473 (nothing in D-474 changes a Human's training); this spread confirms them. No milestone moved.
3. **Training in real years:** childhood runs at the species' pace, then a year is a year. Rank ages, learning speed outside the body, the mind's natural levels and the canon knowledge bands follow it. The body and the clamp's table stay on Human-equivalent age.
   - *Checked on the day loop* (Wookiee Guardian, 3 seeds, 258 s; tests/sweep/longLives.test.ts): at 200 the loop reaches main form 128.5 (generator 132.6), Force Control 108.5 (115.7), Willpower 126 (134).
   - *Short lives:* a Trandoshan Knight of 45 was 94 in its main form and is now 72; a Zabrak of 45 was 80, now 72.
   - *Species ceilings* now hold generated NPCs too.
   - *Bug found and fixed:* generated Jedi or Sith of a species that grows up early or late (a Chiss or Hutt) had no levels at all.
4. **Bodies:** size no longer touches Agility or Strength. Set from cited entries: Wookiee Strength 120, Agility 100; Hutt Strength 120; Houk 115; Trandoshan 100; Talz +5; Mirialan Agility 90. All others are 80 (plus the Twi'lek and Cathar +5 Agility). The +3 is in species.md. Vandar Tokare's age is queued.
5. **Captivity:** accepted, recorded.

**Lore:** the 16 timeline files and the overnight report are committed and indexed; the lore check passes. The map corrections are applied. Four row ids changed with their dates, and one row is new: `E.990.valley_memorial`, since the 1000 BBY map had no row for the Valley. One test changed, for a renamed row. `lore-rulings-2026-11-24.md` appeared in the repo during the run; I left it uncommitted.

## 2. Questions for you

1. **Very old characters outrank the era's apex.** A 200-year-old average Wookiee Knight generates at 132.6 (cap 135); Vitiate's best form is 100 and his Force Output 125. The loop agrees, so this is the ruling at work. Keep it, or lower the cap for figures without talent?
2. **Second forms.** The generator gives that Wookiee Ataru 112; the loop gives 64, because the drill ceiling holds it. A Human of 100 already differs (74 against 50). Cap the generator's second forms?
3. **Oteg** (202): Force Knowledge 18 to 37 and Meditation 21 to 45. Keep, as Zash and Ragate were?
4. **Should size stop scaling Endurance?** Your ruling names only Agility and Strength, so it still does (Talz 108, Jawa 46).
5. **Hutts:** immune to mind tricks (existing Force lore), stronger than +3. Immune or +3? Their entry gives toughness and mass, no word on strength, so 120 rests on your ruling.
6. **The draft timelines reach the narrator now,** beside the old timeline's rows for the same years. They include TCW-only rows (Ahsoka's birth, 36 BBY), and Ahsoka doesn't exist by your rule 4a. Filter `[S-canon]` rows until reviewed?
7. **Bowdaar** (177, not a Force user) has Force Control 18 from long meditation (was 4). Should people who aren't Force-sensitive gain it?
