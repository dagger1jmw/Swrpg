# m8-lore-i: send-guards, and the sets before 3,700 BBY cleaned (2026-11-24; D-487)

npm test 1,580 of 1,580 (25 s); typecheck and lint clean.

## 1. Send-guards

Kept: Zakuul from 3,756 BBY, Canderous Ordo's death and Bastila Shan's noetikon from 3,900 BBY. The three rows now say "a send-guard (Jared, 24 Nov 2026), not a lore date".

## 2. Passages changed

| Set (BBY) | Passages | Rows and overview lines |
|---|---|---|
| 36,453-5,001 | 108 | 84 |
| 5,000-3,997 | 16 | 11 |
| 3,996-3,951 | 36 | 23 |
| 3,950-3,701 | 33 | 25 |
| **Total** | **193** | **143** |

- **Counted:** every change outside the Source column. That includes the date fixes of section 3, the reordered overviews and the three notes of section 1.
- **Titles and remarks:** "(*Into the Void*)", "(SWTOR Encyclopedia)", "date derived from ...", "Older sources give 25,000 BBY" and the like are notes. Source cells are unchanged.
- **Real-world dates:** "BTC" dates in the Date cells are notes too.

## 3. Headings and dates fixed on the way

- **Decades and centuries:** "11,600s BBY" was not read as a date, so its row was "this year" for the whole era (a thousand years and more). Read now, in the later sets too ("690s", "2500s BBY").
- **Undated centuries:** rows such as "undated (c. 35,000-c. 25,200 BBY)" were also "this year" throughout. An undated row over 100 years or more is background now: 13 rows here, 5 in the New Sith Wars. Four of these have a start date I chose, marked as a send-guard.
- **"c.":** "c. 5,100 BBY" cut a sentence in two, in overviews and in planet entries.
- **Overviews:** one date after an era's end kept every later sentence from ever being sent (nearly all of the Great Sith War's and the Restoration Period's). Fixed in the parser. I also moved what a war's overview says about its end to its last sentence.
- **"Old Republic Recovery" named two eras** and their overviews merged. The later one is now "The Eve of War, 3,700-3,681 BBY". The test that should have caught this skipped files with Windows line ends; it reads them now.
- **"Before the Tython Era"** was read as the single year 36,453 BBY. It has a span.
- **Alias:** "Jedi Order" is stored as "order", so any player line with that word would have brought a background row in. Dropped for background rows.

## 4. For you

1. **Are the four new send-guards right?** The Jedi back in peace on Ossus from 10,866 BBY ("a few generations after" 10,966); the Dark Council reorganised from 4,680 BBY ("a few centuries after" 4,980); the Republic's decline "after Almas" and the Draggulch Period's "last centuries" from 1,250 BBY. I recommend keeping them.
2. **Three story titles remain after 4 ABY** (45, 123 and 127-130 ABY: "Good Hunting", *The Essential Guide to Warfare*, the *Legacy Era Campaign Guide*). Outside this run. **Clean the 25-138 ABY sets with the same wide search next?**

## 5. Couldn't apply

Nothing.
