# m8-lore-j: send-guards, the 25-138 ABY sets, a test over every set (2026-11-24; D-488)

npm test 1,581 of 1,581 (24 s); typecheck and lint clean.

## 1. Send-guards

The four rows say "a send-guard (Jared, 24 Nov 2026), not a lore date".

## 2. Passages changed

| Set | Passages | Rows and lines | Asked for |
|---|---|---|---|
| 25-44 ABY | 6 | 6 | yes |
| 45-138 ABY | 19 | 14 | yes |
| 19 BBY-4 ABY | 12 | 10 | caught by the test |
| Martial cultures | 106 | 88 | caught by the test |
| Character files 07, 11, 13, 16, 18 | 11 | 11 | caught by the test |
| 3,996-3,951; 3,600-2,001; 1,000-33; 32-19; Mandalorians; species; planets | 9 | 9 | caught by the test |

- **The two sets were already fairly clean**, as they were cleaned in part when they were indexed.
- **Counted:** changes outside the Source column. The send-guard notes of section 1 are not in the table.
- **Dropped by the reader, so not counted:** in every character file, cross-era notes, "(Era 13)", sheet references and stat figures in brackets ("Control 94", "rating ≈ 86"). The files keep them.

## 3. Parsing

Checked in the two sets:

| m8-lore-i fix | Found |
|---|---|
| Decades | none |
| Undated spans of 100+ years | none (the longest are 85 and 82 years) |
| "c." splits | none left |
| Overview cut-offs | none here; four sentences in the 1,000-33, 19 BBY-4 ABY and 3,600-2,001 sets that could never be sent, fixed |
| Duplicate era names | none |

New:

- **Names with a dash in the heading's brackets:** "Luke Skywalker (NJO — Grand Master)" was indexed as "Luke Skywalker (NJO". Luke could not be found by his name in any era from 19 BBY to 44 ABY; nor Obi-Wan in two eras, or Mara Jade, Tahiri Veila and the reborn Palpatine in one each. Fixed.
- **"(undated)" and "(no year)"** were shown to the narrator in dates. They are not now.
- **The Long Gap overview** said Jagged Fel was Emperor from 46 ABY on. It says so from 121 ABY now (a send-guard).

## 4. The test

"no set sends research wording or bracketed story titles to the narrator", in tests/lore/lore.test.ts. It fails on:

- **Any chunk of the index** (every set, characters, planets, species, martial) with research wording, a source tag, a file or ruling reference, or a bracket that names a publication.
- **Any italic bracket in a narrator cell** of the timeline, Mandalorian and martial files that is not on a short list of words and ships. This found three titles the search had missed ("Droids, 1995", "Death Star", "Bounty Hunter Code").
- **Any overview sentence** that can never be sent in its era.

## 5. For you

1. **Is 121 ABY right as the send-guard for Jagged Fel as Emperor?** It is the last year of the Long Gap; the row itself stays "between 45 and 127 ABY". I recommend keeping it.

## 6. Couldn't apply

Nothing.
