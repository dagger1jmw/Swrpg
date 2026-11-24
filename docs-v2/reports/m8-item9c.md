# M8 item 9, second answers, and the lore rulings (2026-11-24; D-477)

Built, tested and pushed. Tag: `m8-item9c`. test:all: 1,617 of 1,617 (966 s); typecheck and lint clean.

## 1. Your answers

1. **Tython:** the Order has no seat from the Treaty to 3,651 (the narrator is told it is scattered and without a seat), then Tython from 3,650, its Temple from 3,647. The contradiction with Tython's gate is gone.
2. **Dress:** plain tunics, no braid, to mid-3,641. Nothing changes on the day of the Treaty.
3. **The Senate agrees to rebuild:** the Order stays on Coruscant and lives in the Temple during repairs; Tython is still found, with no move.
4. **The two timeline rows** are corrected and cleared from the queue.

**Also:** the design notes are at revision 49, and PP-5 alternative 2 points at the warning race.

## 2. The lore rulings

- **All 16 files:** every ruled row carries "Ruled 24 Nov 2026: <version>" (104 by hand, 22 by rule), with the losing version inside its [conflict] tag, and every Decisions list is answered.
- **Ahsoka:** her rows have her as Plo Koon's apprentice, and a new row has her die in Order 66. Where is not on record, so it is queued.
- **The maps:** Maul's origin and return, the Pyke mission, Ahsoka, the Death Star's route, the Declaration, the Sith Empire's end, Phanius's holocron (a clue in PP-12 step 1), the Ruusan blockade, the Zeison Sha, Uba and Mizra.
- **The narrator's index** (src/lore/parse.ts) no longer sends "[Ruled ...]" or "[S-canon]" tags, and drops six rows ruled "not used" (the files keep them).
- **Queued:** whether *Darth Plagueis* has Maul's title given behind Plagueis's back; the character files that disagree with the rulings, which I did not edit.

## 3. Every default

**Best fit stated by the set**
- *3,600–2,001 BBY:* last Alsakan Conflict 3,017; Hapes sealed c. 3,100 (*Star Home* with it); Temple work in stages (3,519, c. 3,500, 2,510); Iktotchi c. 3,500; Paecian collapse c. 2,992; *Sayings* stored 3,000; Saffa c. 2,219; Rori 2,032.
- *2,000–1,000 BBY:* Third Ruusan 1,002; Kashyyyk and Hsskhor 1,003; Balowa 1,002; "over four centuries" since a non-Jedi Chancellor; the Valley after 990; Gap Nine; Bane supplies the thought bomb.
- *999–33 BBY:* the Jedi, tricked, at Galidraan; Plagueis born 147–120; Taa finds the Valorum money and Antilles prosecutes; the same six Directorate dead; Jango 66.
- *32–19 BBY:* Jabiim 21, Praesitlyn c. 20; Grievous rebuilt against his will, and his strength and cough as in the 2003 series; Ventress Rattataki, vanishes after Boz Pity; Adi Gallia at Boz Pity; Tambor captured on Metalorn; Mygeeto about two years with a final assault.
- *19 BBY–4 ABY:* Ghorman c. 19; Torbin 4 BBY; the Death Star by Seswenna and Patriim to Despayre in 3 BBY; game-only campaigns as background.

**No best fit stated: my pick (please check these)**
- *3,600–2,001 BBY:* Desolous left open after c. 3,522; the unreferenced 2,032 lines and the Kesh rows kept.
- *2,000–1,000 BBY:* Fourth Ruusan 1,001; Harpori 1,003 (Krul dies in 1,002); Hoth 1,004; the Ruusan skirmish kept apart from the Fifth Battle; Wud Mortull 1,010; Laa after the storm; the Return 1,058; the Zeison Sha an older order; the Mizra Jedi captured; Uba a Republic strike; Kiffex c. 1,032; *Sayings* printed c. 1,489; Dessel in the mines 1,013; Ruin dies after 2,000, undated.
- *999–33 BBY:* BR-0371 in 32; Baltizaar 39; Qui-Gon takes Obi-Wan 44; *Chu'unthor* launched c. 440, crashed 340; Plagueis's apprenticeship undated; Finis Valorum born by c. 87 on Coruscant; the Skywalkers enslaved to Gardulla 38.
- *32–19 BBY:* 501st founded 22; Reflex Amendment 21; Ord Cestus 22; Foerost 20; Umbara late 21; no "historians disagree" on Grievous.
- *19 BBY–4 ABY:* the Purge ends 0 BBY; Tarkin made Moff after Ghorman; Boda 19; the *Falcon* 5 BBY; Cloud City 1 ABY; the Declaration at the Corellian System Meetings; the war from 2 BBY; Ylesia 1 BBY; Treitamma before the Treaty; *TFU II* kept; Kalakar Six a clone or doppelgänger; Lord Tion 0 BBY; Tarkin dies 35:3:8; Firrerreo 0 BBY; *Demolition* left out; Irek Ismaren 4 BBY.

**By rule, the date the row already had** (year page against the galaxy timeline or another page): Expansion Zone ends 704; Yinchorr charted 500; Clan Vos 331; Varonat 242; Almas 177; Bakura 149; Elomin 120; Kursid c. 104; Mos Espa 80; Blix Annon 76; Jorus C'baoth 70; Shmi sold 66; Bitthaevrian War c. 65–60; Yinchorri seat 58; Vosa 52; Summertime War c. 52; *Katana* 45; Stark War 44; Poggle 33; Padmé elected 33; Lando's Cloud City news c. 2 ABY; Grievous rebuilt c. 29.

## 4. Questions for you

1. **Captain Rex:** the source rule lets TCW-only characters stand, but the file gives Rex's role to Appo. Which?
2. **Where does Ahsoka die?** The design notes put her with Plo Koon's unit, so Cato Neimoidia with him?
