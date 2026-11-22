// Era 09 figures added in lore batch 19 (D-391), generated from the research-bot files
// Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Index.md and Part1-3b. Facts (species, sex, homeworld, birth and death,
// ranks, teachers, forms and powers, alignment) come from the lore files; role, archetype and estimated birth years are
// design (birthSource 'estimate': an adult at the first year the files date them). No levels are hand set:
// 'provisional' entries (active adults in 3661 BBY) take the npc-generation closed form for their archetype and age,
// for Jared's review; 'factsOnly' entries (children, unborn or dead in 3661 BBY) age in the same way when they appear.
import type { CanonNpc } from './types';

export const ERA_09_ADDITIONS: readonly CanonNpc[] = [
  {
    canonId: "lore:aryn-leneer",
    name: "Aryn Leneer",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      homeworld: "Balmorra",
      group: "Jedi / light side",
      summary: "female Human from Balmorra; green eyes (infobox). Jedi Knight; former Padawan of Ven Zallow.",
      teachers: "Master Ven Zallow (infobox).",
      formsAndPowers: "noted for \"Force empathy\". The page names Force lightning only in the section on her quest for revenge.",
      alignment: "light side, but she disobeyed the Council to hunt Malgus, and the Council disowned her.",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Aryn Leneer"
    }
  },
  {
    canonId: "lore:sajar",
    name: "Sajar",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human, once \"Darth Sajar\" of the Dark Council. Green eyes (infobox). Dark Lord on the Dark Council during the war; gave up his seat to become Braga's Padawan; still a Padawan in 3642 BBY.",
      teachers: "Master Tol Braga (infobox).",
      formsAndPowers: "none named in the digest.",
      alignment: "Sith, then redeemed before 3653 BBY; slipped back toward the dark side on Quesh in 3642 BBY.",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Sajar"
    }
  },
  {
    canonId: "lore:fortris-gall",
    name: "Fortris Gall",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediGuardian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; blue eyes, blond hair (infobox). Used Jar'Kai when needed. Jedi Knight, trained by Orgus Din;.",
      teachers: "Orgus Din (infobox).",
      formsAndPowers: "Jar'Kai.",
      alignment: "light side; stopped Dar'Nala from murdering Baras.",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Fortris Gall"
    }
  },
  {
    canonId: "lore:nomen-karr",
    name: "Nomen Karr",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediGuardian",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; undercover alias \"Lord Retrost\"; Baras's personal nemesis. Infobox eyes: \"Blue, orange (dark side)\" (infobox). one of the Order's \"most seasoned veterans\" in the Cold War.",
      teachers: "Somminick Timmns and Jaesa Willsaam (infobox).",
      formsAndPowers: "excelled at Soresu; the page also names Form IV, Force push and Force choke.",
      alignment: "touched the dark side behind Imperial lines but stayed true to the Code. The orange dark-side eyes are a game-path variant [unclear].",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Nomen Karr"
    }
  },
  {
    canonId: "lore:warren-sedoru",
    name: "Warren Sedoru",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3726,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human. became one of the Order's most acclaimed Knights. The page intro calls him a Padawan, while the Vitiate page calls him a Jedi Master by c. 3642 BBY [conflict].",
      teachers: "Master Tol Braga.",
      formsAndPowers: "\"among the strongest and most resolute Jedi of his time\".",
      alignment: "light side; after his war injuries his Force connection weakened, and in 3653 BBY he turned to peace.",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Warren Sedoru"
    }
  },
  {
    canonId: "lore:ardun-kothe",
    name: "Ardun Kothe",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediGuardian",
    birthBby: 3696,
    birthSource: "lore",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      homeworld: "Dantooine",
      group: "Jedi / light side",
      summary: "male Human, born on Dantooine (infobox). Jedi Knight; left the Order and joined the SIS when the Treaty was signed in 3653 BBY; given special Senate sanction around 3642 BBY; died 3641 BBY in the Quesh war (lore batch 20, ruling 20).",
      alignment: "light side; no fall.",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Ardun Kothe"
    }
  },
  {
    canonId: "lore:belth-allusis",
    name: "Belth Allusis",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3671,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; gray hair; Jedi Master and respected High Council member; led the defense of Bothawui in 3671 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:oteg",
    name: "Oteg",
    speciesId: "other",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3844,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male, of Yoda's species; Jedi Master; after the Treaty, High Council; later left the Council to command the First Expeditionary Fleet as Fleet Admiral, with Satele's approval",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:shol-bestros",
    name: "Shol Bestros",
    speciesId: "miraluka",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3726,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Miraluka; joined the Order late after Kao Cen Darach recruited him; Jedi Master and High Council member; on Tython in the Cold War",
      teachers: "advised the Padawan Gnost-Dural",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:jerbhen-hulis",
    name: "Jerbhen Hulis",
    speciesId: "miraluka",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3723,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Miraluka; Jedi Master in the war and Cold War; in 3678 BBY hunted Exal Kressh aboard the Grace of Champalan Tides",
      teachers: "an unidentified Padawan",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:wyellett",
    name: "Wyellett",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; white hair; Jedi Master, \"one of the great Jedi heroes\" of the war; took Darth Baras's lightsaber after a duel; captured, and his transport crashed at Hoth; found by Xerender in 3642 BBY; died 3641 BBY in the fighting on Hoth (lore batch 20, ruling 20)",
      teachers: "apprentice Xerender",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:xerender",
    name: "Xerender",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3642,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; Padawan of Wyellett; dueled Baras with him in the war; Jedi Knight by 3642 BBY",
      teachers: "Master Wyellett; Padawan Sewlor",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:bengel-morr",
    name: "Bengel Morr",
    speciesId: "nautolan",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3698,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Nautolan; pale blue skin; Orgus Din's Padawan; in the Temple at the Sacking, 3653 BBY; driven insane and fell to the dark side; trained the Dark Jedi Callef; defeated by the Hero of Tython; later served under the Hero on Corellia",
      teachers: "Master Orgus Din; apprentice Callef",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:tasiele-shan",
    name: "Tasiele Shan",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediGuardian",
    birthBby: 3724,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Jedi / light side",
      summary: "female Human; Jedi Knight in the century before the war; bore Satele on Brentaal IV in 3699 BBY; exiled after challenging the Order's views on attachment",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:parkanas-tark",
    name: "Parkanas Tark",
    speciesId: "human",
    faction: "jediOrder",
    role: "padawan",
    archetype: "jediGuardian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; red eyes (dark side); Padawan, the youngest member of the Malachor III expedition; left behind there, fell to the spirit of Terrak Morrhage, and became Lord Vivicar; spread a Force-plague in the Cold War; stopped by the Barsen'thor",
      teachers: "influenced by Terrak Morrhage",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:kellian-jarro",
    name: "Kellian Jarro",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3698,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; Jedi Master; during the Sacking (3653 BBY) killed over a hundred Mandalorian commandos in Galactic City; later confronted aboard the Aurora by the Hunter (the bounty-hunter protagonist) and died there in 3643 BBY",
      teachers: "Padawan Thendys Noori",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:yuon-par",
    name: "Yuon Par",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3688,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Jedi / light side",
      summary: "female Human; Jedi Master in the Cold War; with Syo Bakarn, met a young Padawan in 3643 BBY",
      teachers: "the Barsen'thor",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:leeha-narezz",
    name: "Leeha Narezz",
    speciesId: "nautolan",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediGuardian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Jedi / light side",
      summary: "female Nautolan; Knighted during the war; joined Tol Braga's strike team against the Emperor",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:aurei-eadon",
    name: "Aurei Eadon",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3709,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; Jedi Master; around 3664 BBY guarded a Republic envoy against Shae Vizla and killed her brother",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:ako-domi",
    name: "Ako Domi",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediSentinel",
    birthBby: 3674,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Jedi / light side",
      summary: "male Human; legendary Jedi Knight; captured at the Battle of Sullust; sent to Shadow Town on Nar Shaddaa in 3649 BBY, where he fell and called himself a Sith",
      teachers: "two inmate apprentices",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:nadia-grell",
    name: "Nadia Grell",
    speciesId: "other",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3664,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Jedi / light side",
      summary: "female Sarkhai; Padawan, later Knight, in the Galactic War; Senator of Sarkhai after her father died",
      teachers: "Master: the Barsen'thor",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:ashara-zavros",
    name: "Ashara Zavros",
    speciesId: "togruta",
    faction: "jediOrder",
    role: "jediMaster",
    archetype: "jediGuardian",
    birthBby: 3662,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Jedi / light side",
      summary: "female Togruta; Jedi Padawan, taken into the Order at age five; lured to the dark side by Lord Kallig (Darth Nox)",
      teachers: "Master: Darth Nox (infobox lists her as Nox's apprentice)",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:meetra-surik",
    name: "Meetra Surik",
    speciesId: "human",
    faction: "jediOrder",
    role: "jediKnight",
    archetype: "jediGuardian",
    birthBby: 3990,
    birthSource: "estimate",
    deathBby: 3950,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    note: "birth year: design estimate, the Jedi Exile of the Old Sith Wars, dead by 3,950 BBY (appears here as a spirit)",
    facts: {
      sex: "female",
      group: "Jedi / light side",
      summary: "female Human; died long before this era; as a spirit she reached out around 3642 BBY to start the rescue of Revan",
      source: "SW_Characters_09_GGW_ColdWar_Part1.md › Other light-side figures (table)"
    }
  },
  {
    canonId: "lore:darth-ekkage",
    name: "Darth Ekkage",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Sith / dark side",
      summary: "female Human; Baras's sister; Dark Councilor in the war; led Sith infiltrators and the Red Legion; captured by the Jedi and held on Belsavis; died there in 3641 BBY when the Empire invaded (lore batch 20, ruling 19)",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-vengean",
    name: "Darth Vengean",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; orange eyes; Dark Councilor and the Council's military leader; warmonger",
      teachers: "apprentices Baras and Draahg",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-azamin",
    name: "Darth Azamin",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3653,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "Human or Pureblood; Dark Councilor, Sphere of Military Strategy; killed by Jedi at his stronghold near the war's end",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-decimus",
    name: "Darth Decimus",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; joined the Council in the war's last months after Azamin died; Sphere of Military Strategy; led the invasion of Corellia",
      teachers: "right hand Darth Charnus",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-ravage",
    name: "Darth Ravage",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Dark Councilor in the Cold War",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-mortis",
    name: "Darth Mortis",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3628,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; orange eyes, pale skin; Dark Councilor, Sphere of Laws and Justice",
      teachers: "apprentice Zavrasha",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-rictus",
    name: "Darth Rictus",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithInquisitor",
    birthBby: 3761,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "not stated; Dark Councilor, Sphere of Mysteries (\"Keeper of Mysteries\"); oldest Councilor by 3640 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-karrid",
    name: "Darth Karrid",
    speciesId: "other",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithInquisitor",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Sith / dark side",
      summary: "female Falleen; former Jedi; Sith under Malgus in the late war; commanded the Ascendant Spear; head of Technology after Hadra",
      teachers: "trained by Gnost-Dural, then Malgus",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-hadra",
    name: "Darth Hadra",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithInquisitor",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Sith / dark side",
      summary: "female Human; head of Technology after Mekhis",
      teachers: "apprentice Arosh",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-arkous",
    name: "Darth Arkous",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3637,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Sith; Dark Councilor in the Galactic War; GGW veteran; secret Revanite",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-arho",
    name: "Darth Arho",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Dark Councilor; commanded on Ilum",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:darth-ikoral",
    name: "Darth Ikoral",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithWarrior",
    birthBby: 3757,
    birthSource: "estimate",
    deathBby: 3642,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Sith (species); Vindican's Master; led an expedition to find Purebloods around 3712 BBY",
      teachers: "apprentices Vindican and Kherus",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Dark Councilors and senior Sith (table)"
    }
  },
  {
    canonId: "lore:raptus",
    name: "Raptus",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3638,
    deathSource: "lore",
    unavailable: [
      {
        fromBby: 3668,
        toBby: 3641,
        reason: "a Dread Master, prisoner on Belsavis from 3,668 to c. 3,641 BBY (lore batch 19)"
      }
    ],
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Dread Masters (collective)"
    }
  },
  {
    canonId: "lore:bestia",
    name: "Bestia",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3638,
    deathSource: "lore",
    unavailable: [
      {
        fromBby: 3668,
        toBby: 3641,
        reason: "a Dread Master, prisoner on Belsavis from 3,668 to c. 3,641 BBY (lore batch 19)"
      }
    ],
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Dread Masters (collective)"
    }
  },
  {
    canonId: "lore:brontes",
    name: "Brontes",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3638,
    deathSource: "lore",
    unavailable: [
      {
        fromBby: 3668,
        toBby: 3641,
        reason: "a Dread Master, prisoner on Belsavis from 3,668 to c. 3,641 BBY (lore batch 19)"
      }
    ],
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Dread Masters (collective)"
    }
  },
  {
    canonId: "lore:calphayus",
    name: "Calphayus",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    unavailable: [
      {
        fromBby: 3668,
        toBby: 3641,
        reason: "a Dread Master, prisoner on Belsavis from 3,668 to c. 3,641 BBY (lore batch 19)"
      }
    ],
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Dread Masters (collective)"
    }
  },
  {
    canonId: "lore:styrak",
    name: "Styrak",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3638,
    deathSource: "lore",
    unavailable: [
      {
        fromBby: 3668,
        toBby: 3641,
        reason: "a Dread Master, prisoner on Belsavis from 3,668 to c. 3,641 BBY (lore batch 19)"
      }
    ],
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Dread Masters (collective)"
    }
  },
  {
    canonId: "lore:tyrans",
    name: "Tyrans",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3638,
    deathSource: "lore",
    unavailable: [
      {
        fromBby: 3668,
        toBby: 3641,
        reason: "a Dread Master, prisoner on Belsavis from 3,668 to c. 3,641 BBY (lore batch 19)"
      }
    ],
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Sith / dark side",
      summary: "",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Dread Masters (collective)"
    }
  },
  {
    canonId: "lore:tarnis",
    name: "Tarnis",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human, son of Darth Angral; green eyes (infobox). Sith Lord before the Sacking; after the Treaty, undercover as the Republic scientist \"Eli Tarnis\" in the superweapon projects.",
      teachers: "Master Praven (infobox).",
      formsAndPowers: "Force lightning.",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Tarnis"
    }
  },
  {
    canonId: "lore:praven",
    name: "Praven",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Sith Pureblood; red skin, red-orange eyes. Sith Warrior trained by Angral; took part in the 3653 BBY Temple attack; later a Jedi Padawan who fought at Corellia in 3640 BBY;.",
      teachers: "Master Angral; apprentice Tarnis (infobox).",
      formsAndPowers: "Force barrier; Force lightning.",
      alignment: "Sith, then redeemed.",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Praven"
    }
  },
  {
    canonId: "lore:adraas",
    name: "Adraas",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3653,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human. Sith Lord; the Dark Council sent him to Ord Radama in 3660 BBY; second-in-command of the Temple infiltration at the Sacking.",
      formsAndPowers: "Force lightning.",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Adraas"
    }
  },
  {
    canonId: "lore:darth-venemal",
    name: "Darth Venemal",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3660,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; with Malgus he led the Rim Campaign and the attack on Ord Radama in 3660 BBY; stayed in Livien Magnus and died with its people; death c. 3660 BBY on Ord Radama (infobox);. In 3661 BBY: in the Rim Campaign [inferred from c. 3661–3660 BBY]; in 3653 BBY: dead.",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Darth Venemal"
    }
  },
  {
    canonId: "lore:darth-lachris",
    name: "Darth Lachris",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3642,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Sith / dark side",
      summary: "female Human; orange (dark-side) eyes; Master Darth Marr; apprentice Lerek Serrus; died c. 3642 BBY on Balmorra (infobox). Part of the 3653 BBY invasion force at Coruscant. Appointed Governor of Balmorra; defeated by the Barsen'thor. In 3661 BBY: not stated.",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Darth Lachris"
    }
  },
  {
    canonId: "lore:calypho",
    name: "Calypho",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3723,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Sith Lord; Teneb Kel's Master; arrested for heresy by Councilors including Marr and Vowrawn around 3678 BBY; taught that foresight sharpens near death",
      teachers: "apprentice Thanaton",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:darth-skotia",
    name: "Darth Skotia",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; cyborg; Dark Lord on Dromund Kaas; Thanaton's ally and Zash's rival; murdered on Zash's orders",
      teachers: "several apprentices",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:nefarid",
    name: "Nefarid",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Angral's apprentice; took the Death Mark laser",
      teachers: "Master Angral",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:darth-vich",
    name: "Darth Vich",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3681,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      group: "Sith / dark side",
      summary: "Human or Sith; young Sith Lord by 3681 BBY; raised a Rattataki army; the Council crushed his followers",
      teachers: "dozens of Rattataki acolytes",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:darth-gravus",
    name: "Darth Gravus",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3700,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    note: "birth year: design estimate, a Dark Councilor by the Galactic War, so an adult in 3661",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Sith overseer of Taris in 3642 BBY; Council candidate in 3640 BBY; killed by Karrid",
      teachers: "apprentice Thana Vesh",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:darth-charnus",
    name: "Darth Charnus",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithWarrior",
    birthBby: 3688,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Decimus's right hand; hunted the Order of Revan in 3643 BBY",
      teachers: "Master Decimus; apprentice Emic Sandor",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:darth-serevin",
    name: "Darth Serevin",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Pureblood; Sith Lord in the Cold War; later joined Malgus's breakaway Empire",
      teachers: "apprentice Berow",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:darth-tormen",
    name: "Darth Tormen",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Sith; Darth who employed the bounty hunter Hunter",
      teachers: "apprentice Vindis",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:harkun",
    name: "Harkun",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3688,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Overseer of acolytes at the Korriban academy under Zash; gathered her new class around 3643 BBY",
      teachers: "his acolytes included Darth Nox, Ffon Althe, Xalek and Lana Beniko",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:spindrall",
    name: "Spindrall",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3720,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    note: "birth year: design estimate, on record as an active hermit in the tomb of Ajunta Pall in 3661 (D-376)",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; yellow eyes; elder Sith prophet and Lord living in Ajunta Pall's tomb; tested Zash's class around 3643 BBY",
      teachers: "acolytes",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:tremel",
    name: "Tremel",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Sith Overseer at Korriban; informally taught the future Wrath",
      teachers: "the Wrath (informal)",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:ffon-althe",
    name: "Ffon Althe",
    speciesId: "sithPureblood",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      homeworld: "Korriban",
      group: "Sith / dark side",
      summary: "male Pureblood from Korriban; acolyte favored by Harkun",
      teachers: "Overseer Harkun",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:grathan",
    name: "Grathan",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Human; Sith Lord who rebelled against the Council from a base on Dromund Kaas; defeated by Baras's apprentice",
      teachers: "several apprentices",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:khem-val",
    name: "Khem Val",
    speciesId: "other",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 5501,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    fixed: "an ancient Dashade, kept in stasis for millennia; does not age on the human curve",
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Dashade; red eyes, gray skin; Tulak Hord's servant, revived to serve Darth Nox; resists the Force",
      teachers: "Masters Tulak Hord and Darth Nox",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:xalek",
    name: "Xalek",
    speciesId: "other",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3665,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Sith / dark side",
      summary: "male Kaleesh; Nox's apprentice; Sith Lord after Nox disappeared",
      teachers: "Harkun; Darth Nox",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:jaesa-willsaam",
    name: "Jaesa Willsaam",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithAcolyte",
    archetype: "sithWarrior",
    birthBby: 3664,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Sith / dark side",
      summary: "female Human; orange (dark-side) eye variant; Jedi Padawan of Nomen Karr; then the Wrath's apprentice",
      teachers: "Yonlach, Nomen Karr, the Wrath",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:lana-beniko",
    name: "Lana Beniko",
    speciesId: "human",
    faction: "sithEmpire",
    role: "sithLord",
    archetype: "sithWarrior",
    birthBby: 3682,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      homeworld: "Dromund Kaas",
      group: "Sith / dark side",
      summary: "female Human from Dromund Kaas; yellow (dark-side) eyes; Sith Lord; adviser to Darth Arkous; helped plan the Tython assault in 3637 BBY; later called the former Sith Intelligence Minister",
      teachers: "Overseer Harkun",
      source: "SW_Characters_09_GGW_ColdWar_Part2.md › Other Sith Lords, apprentices, academy staff and dark-side users (table)"
    }
  },
  {
    canonId: "lore:berooken",
    name: "Berooken",
    speciesId: "monCalamari",
    faction: "republic",
    role: "politician",
    archetype: "civilian",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3653,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Mon Calamari (infobox). Supreme Chancellor \"during the latter days\" of the war; in office 3654–3653 BBY.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Berooken"
    }
  },
  {
    canonId: "lore:paran-am-ris",
    name: "Paran Am-Ris",
    speciesId: "cerean",
    faction: "republic",
    role: "politician",
    archetype: "civilian",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Cerean (infobox). senator from Cerea; led the Republic delegation on Alderaan c. 3653 BBY; interim Chancellor after Berooken's death; signed the Treaty of Coruscant on the Empire's terms.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Paran Am-Ris"
    }
  },
  {
    canonId: "lore:dorian-janarus",
    name: "Dorian Janarus",
    speciesId: "human",
    faction: "republic",
    role: "politician",
    archetype: "civilian",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      homeworld: "Coruscant",
      group: "Republic (non-Force)",
      summary: "male Human from Coruscant (infobox). long-serving senator of Coruscant. Elected Chancellor unanimously \"sometime after\" the Treaty, replacing Am-Ris: 3653 BBY, re-elected 3649 and 3645 BBY (lore batch 20, ruling 13).",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Dorian Janarus"
    }
  },
  {
    canonId: "lore:silara-panteer-and-gaul-panteer",
    name: "Silara Panteer and Gaul Panteer",
    speciesId: "human",
    faction: "republic",
    role: "politician",
    archetype: "civilian",
    birthBby: 3712,
    birthSource: "estimate",
    deathBby: 3650,
    deathSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      homeworld: "Alderaan",
      group: "Republic (non-Force)",
      summary: "both Human, from Alderaan (infobox);. Silara was queen from some time before 3667 BBY. Gaul was Alderaan's senator by 3653 BBY and voted to secede after the Treaty. Both died \"several years after 3653 BBY\" (lore batch 20; the death year 3650 is an estimate).",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Silara Panteer and Gaul Panteer"
    }
  },
  {
    canonId: "lore:jebevel-madon",
    name: "Jebevel Madon",
    speciesId: "unknown",
    faction: "republic",
    role: "politician",
    archetype: "civilian",
    birthBby: 3677,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      group: "Republic (non-Force)",
      summary: "not stated; Chancellor from 3632 BBY after Saresh; a puppet of hers; resigned after 3630 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Minor Republic political figures"
    }
  },
  {
    canonId: "lore:galena-rans",
    name: "Galena Rans",
    speciesId: "mirialan",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Republic (non-Force)",
      summary: "Mirialan female; veteran of the 439th bomber wing; married Supreme Commander Rans; Chancellor after Madon resigned",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Minor Republic political figures"
    }
  },
  {
    canonId: "lore:elin-garza",
    name: "Elin Garza",
    speciesId: "human",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3696,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      homeworld: "Coruscant",
      group: "Republic (non-Force)",
      summary: "female Human from Coruscant (infobox). forged her papers and enlisted at 15 in 3681 BBY. Lieutenant and platoon commander in the 45th Infantry Division. Fought a ten-month campaign on Bomodon in 3673 BBY. Helped found the Special Forces division. General.",
      alignment: "after the Treaty she was repeatedly accused of covert strikes on the Empire; the Ando Prime abandonment came from one.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Elin Garza"
    }
  },
  {
    canonId: "lore:marcus-trant",
    name: "Marcus Trant",
    speciesId: "human",
    faction: "republic",
    role: "official",
    archetype: "smuggler",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Human (infobox). SIS decryption analyst; field agent from 3681 BBY; on Bomodon 3674 BBY; Bureau Chief on Nar Shaddaa 3654 BBY. Director of SIS three years after the Treaty, i.e. c. 3650 BBY [inferred].",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Marcus Trant"
    }
  },
  {
    canonId: "lore:rans",
    name: "Rans",
    speciesId: "human",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Human (infobox). Supreme Commander during the Great War and Cold War. Married Galena Rans. \"Totally outplayed\" by the Sith plan for the Sacking. Later led at Ilum, where he was captured and rescued, then retired.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Rans"
    }
  },
  {
    canonId: "lore:stantorrs",
    name: "Stantorrs",
    speciesId: "duros",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Duros (infobox). Supreme Commander during the Cold War; in 3643 BBY he sent his aide Ula Vii (an Imperial spy) as envoy to Nal Hutta; replaced by Rans. 3661 BBY / 3653 BBY: not stated.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Stantorrs"
    }
  },
  {
    canonId: "lore:harron-tavus",
    name: "Harron Tavus",
    speciesId: "human",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Human (infobox). Special Forces lieutenant in the Minos Cluster with Orgus Din; with Din during the Sacking; later a captain, then commander of Havoc Squad in the Cold War;. Led Havoc's defection to the Empire c. 3643 BBY.",
      alignment: "turned against the Republic over the Ando Prime abandonment. Defeated aboard the Justice, he surrendered with regret.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Harron Tavus"
    }
  },
  {
    canonId: "lore:var-suthra",
    name: "Var Suthra",
    speciesId: "monCalamari",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Mon Calamari (infobox). Fought beside Orgus Din; after seeing the Sacking he began superweapon projects such as Project Nebula; a general in the Cold War, running military technology development;. 3661 BBY / 3653 BBY: not stated / on Coruscant for the Sacking.",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Var Suthra"
    }
  },
  {
    canonId: "lore:zeerid-korr",
    name: "Zeerid Korr",
    speciesId: "human",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Human (infobox). A Havoc Squad commando and star pilot; friend of Aryn Leneer from the Battle of Balmorra. He left the army after his wife Val died and his daughter Arra was crippled, then flew for the Exchange. In 3653 BBY he flew Leneer to Coruscant to face Malgus, then retired to farm on Dan",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Zeerid Korr"
    }
  },
  {
    canonId: "lore:nico-okarr",
    name: "Nico Okarr",
    speciesId: "human",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "male Human (infobox). One of the most celebrated spacers of the Outer Rim before the war. Captured on Korriban in 3681 BBY, he helped Satele and Malcom escape, then vanished; a Korriban artifact kept him from aging until 3631 BBY. 3661 BBY / 3653 BBY: missing (not seen until 3631 BBY).",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › Nico Okarr"
    }
  },
  {
    canonId: "lore:elara-dorne",
    name: "Elara Dorne",
    speciesId: "human",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3669,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Republic (non-Force)",
      summary: "Human female, Dromund Kaas; Imperial medic from 3648 BBY; defected 3646 BBY; Havoc 3643 BBY (Meteor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:tanno-vik",
    name: "Tanno Vik",
    speciesId: "other",
    faction: "republic",
    role: "soldier",
    archetype: "soldier",
    birthBby: 3676,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Weequay male, Nar Shaddaa; orphan gang member, then an insubordinate Republic soldier; demolitions (Meteor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:m1-4x",
    name: "M1-4X",
    speciesId: "droid",
    faction: "republic",
    role: "droid",
    archetype: "civilian",
    birthBby: 3668,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      group: "Republic (non-Force)",
      summary: "war droid; Project Ignition prototype finished by Dr. Deduun with Tavus's backing (Meteor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:yuun",
    name: "Yuun",
    speciesId: "other",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3670,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Gand male (findsman, Force-sensitive); Havoc engineer from the start of the Galactic War (Meteor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:fideltin-rusk",
    name: "Fideltin Rusk",
    speciesId: "other",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3682,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Chagrian male, Mindor; enlisted young; reckless, costly commander; his parents' colony destroyed 3650 BBY (Hero of Tython)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:t7-o1",
    name: "T7-O1",
    speciesId: "droid",
    faction: "republic",
    role: "droid",
    archetype: "civilian",
    birthBby: 3844,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Republic (non-Force)",
      summary: "astromech; Ven Zallow's partner; undercover with Okarr 3681 BBY; lent to the SIS c. 3663 BBY; in the Temple during the Sacking (Hero of Tython)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:doc",
    name: "\"Doc\"",
    speciesId: "human",
    faction: "republic",
    role: "soldier",
    archetype: "soldier",
    birthBby: 3670,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Human male, Ralltiir; xenopathologist, graduated by 3647 BBY; Outer Rim combat medic (Hero of Tython)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:corso-riggs",
    name: "Corso Riggs",
    speciesId: "human",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3665,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Human male, Ord Mantell; rancher's son; Viidu's gunman, betrayed by Skavak (Voidhound)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:bowdaar",
    name: "Bowdaar",
    speciesId: "wookiee",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3838,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Wookiee male, Kashyyyk; gladiator slave over a century, >10,000 bouts; Drooga's pet fighter by 3643 BBY (Voidhound)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:risha-drayen",
    name: "Risha Drayen",
    speciesId: "human",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3664,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Republic (non-Force)",
      summary: "Human female, Nar Shaddaa; daughter of Nok Drayen and heir of Dubrillion (Voidhound)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:guss-tuno",
    name: "Guss Tuno",
    speciesId: "monCalamari",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3675,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      homeworld: "Varn",
      group: "Republic (non-Force)",
      summary: "Mon Calamari male (Force-sensitive), Dac; born on Varn; failed Padawan of Lorenn; \"Lord Struction\" con on Nar Shaddaa (Voidhound)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:qyzen-fess",
    name: "Qyzen Fess",
    speciesId: "trandoshan",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3675,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Trandoshan male; big-game hunter; friend of Yuon Par; on Tython 3643 BBY (Barsen'thor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:tharan-cedrax",
    name: "Tharan Cedrax",
    speciesId: "human",
    faction: "republic",
    role: "scholar",
    archetype: "civilian",
    birthBby: 3672,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Human male, Anaxes; slicer and xeno-engineer on Nar Shaddaa (Barsen'thor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:holiday",
    name: "Holiday",
    speciesId: "droid",
    faction: "republic",
    role: "scholar",
    archetype: "civilian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Republic (non-Force)",
      summary: "holographic lifeform; Cedrax's assistant; slicer and mathematical savant",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:zenith",
    name: "Zenith",
    speciesId: "twilek",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3678,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Twi'lek male, Balmorra; Balmorran resistance fighter against the Empire (Barsen'thor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:felix-iresso",
    name: "Felix Iresso",
    speciesId: "human",
    faction: "republic",
    role: "soldier",
    archetype: "soldier",
    birthBby: 3673,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Human male, Rehemsa; son of war refugees; career soldier; Eight-Hour Invasion of Dubrillion (Barsen'thor)",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:arra-yooms",
    name: "Arra Yooms",
    speciesId: "human",
    faction: "republic",
    role: "civilian",
    archetype: "civilian",
    birthBby: 3662,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Republic (non-Force)",
      summary: "Human female; Zeerid Korr's daughter on Vulta; lost her legs in the accident that killed her mother",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:korvan",
    name: "Korvan",
    speciesId: "human",
    faction: "republic",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Republic (non-Force)",
      summary: "Human male; Republic general on Quesh in the Cold War; veteran of Dantooine and Velmor",
      source: "SW_Characters_09_GGW_ColdWar_Part3a.md › C. Republic-side companions and others"
    }
  },
  {
    canonId: "lore:vasil-dorne",
    name: "Vasil Dorne",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3703,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "male Human (infobox). Born around 3703 BBY (page text) or c. 3706 BBY (infobox);. Enlisted 3685 BBY; garrison commander 3665 BBY; special attaché to the Ministry of Intelligence in 3653 BBY, then trained Intelligence operatives in combat. Father of Elara Dorne (Part3a). 3661 BBY / 3653 BBY: garrison",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Vasil Dorne"
    }
  },
  {
    canonId: "lore:zellos",
    name: "Zellos",
    speciesId: "human",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "male Human (infobox). Grand Moff who led the second Imperial invasion of Bothawui, a long ground war against guerrillas under Jedi Master Belth Allusis. Dates not stated. 3661 BBY / 3653 BBY: not stated.",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Zellos"
    }
  },
  {
    canonId: "lore:shareis",
    name: "Shareis",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3705,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "male, species not stated; War Minister; ignored Malgus's supply requests at Ord Radama (c. 3660 BBY)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial ministers and commanders"
    }
  },
  {
    canonId: "lore:shullis-khamarr",
    name: "Shullis Khamarr",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3688,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Imperial (non-Force)",
      summary: "female; Minister of Logistics, a favourite of the Council, as late as 3643 BBY; involved in the Ord Radama supply chain",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial ministers and commanders"
    }
  },
  {
    canonId: "lore:layek-davos",
    name: "Layek Davos",
    speciesId: "human",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3642,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male; admiral; fought at the Imperial victory at Hoth; later head of Imperial Search and Recovery; died 3642 BBY on Hoth (infobox)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial ministers and commanders"
    }
  },
  {
    canonId: "lore:broysc",
    name: "Broysc",
    speciesId: "human",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3698,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male; Moff; Quinn's commander at Druckenwell (3653 BBY), where he court-martialled Quinn and took credit; died c. 3641 BBY on the Wrath's interceptor (infobox)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial ministers and commanders"
    }
  },
  {
    canonId: "lore:tarrick",
    name: "Tarrick",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3706,
    birthSource: "estimate",
    deathBby: 3653,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Imperial (non-Force)",
      summary: "not stated; Moff; assassinated by Pierce's black-ops team before 3653 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial ministers and commanders"
    }
  },
  {
    canonId: "lore:keeper",
    name: "Keeper",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3706,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male; head of the Operations Division, answering only to the Minister; later promoted Minister of Intelligence",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:shara-jenn",
    name: "Shara Jenn",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3667,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Imperial (non-Force)",
      summary: "Human female; Cipher Nine's handler; Keeper from 3642 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:watcher-x",
    name: "Watcher X",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "civilian",
    birthBby: 3685,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male (genetically enhanced); engineered in the womb; joined at 21; Operation Undertow 3664 BBY led to his forced retirement",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:fixer-seven",
    name: "Fixer Seven",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "official",
    archetype: "civilian",
    birthBby: 3689,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Imperial (non-Force)",
      summary: "not stated; badly hurt in Operation Undertow, 3664 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:cipher-twelve",
    name: "Cipher Twelve",
    speciesId: "unknown",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3672,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "male; \"old guard\" Cipher Agent; Lokin called him the finest; killed by a Hapan royal assassin",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:ula-vii",
    name: "Ula Vii",
    speciesId: "other",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3668,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Epicanthix male, Panatha; Intelligence agent posing as Stantorrs's aide, c. 3643 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:hunter",
    name: "Hunter",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3670,
    birthSource: "lore",
    deathBby: 3640,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Imperial (non-Force)",
      summary: "Human female; Star Cabal operative raised from childhood; disguised as a male SIS agent",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial Intelligence"
    }
  },
  {
    canonId: "lore:malavai-quinn",
    name: "Malavai Quinn",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3680,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male, Dromund Kaas; son of Rymar Quinn; lieutenant at Druckenwell 3653 BBY; Baras's agent (Wrath)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:vette",
    name: "Vette",
    speciesId: "twilek",
    faction: "sithEmpire",
    role: "official",
    archetype: "civilian",
    birthBby: 3664,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      homeworld: "Ryloth",
      group: "Imperial (non-Force)",
      summary: "Rutian Twi'lek female, born on Ryloth; slave freed by Nok Drayen; thief (Wrath)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:pierce",
    name: "Pierce",
    speciesId: "human",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3671,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male, Ziost; black ops from his teens; lieutenant; Tarrick hit (Wrath)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:broonmark",
    name: "Broonmark",
    speciesId: "other",
    faction: "sithEmpire",
    role: "official",
    archetype: "civilian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Talz male, Alzoc III; killer who served the Republic, then the Empire (Wrath)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:kaliyo-djannis",
    name: "Kaliyo Djannis",
    speciesId: "rattataki",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3672,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Imperial (non-Force)",
      summary: "Rattataki female, Rattatak; anarchist; Nem'ro's enforcer (Cipher Nine)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:eckard-fixer-fifteen-lokin",
    name: "Eckard \"Fixer Fifteen\" Lokin",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3707,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human/Rakghoul male, Dromund Kaas; doctor; on the Warhammer at the start of the war (Cipher Nine)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:vector-hyllus",
    name: "Vector Hyllus",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3669,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male, Jurio; diplomat turned Killik Joiner (Cipher Nine)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:raina-temple",
    name: "Raina Temple",
    speciesId: "human",
    faction: "sithEmpire",
    role: "official",
    archetype: "smuggler",
    birthBby: 3666,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Imperial (non-Force)",
      summary: "Human female, Dromund Kaas; untrained Force-sensitive hidden by her father; served in the Chiss forces (Cipher Nine)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:scorpio",
    name: "SCORPIO",
    speciesId: "droid",
    faction: "sithEmpire",
    role: "droid",
    archetype: "civilian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      group: "Imperial (non-Force)",
      summary: "Iokath AI; guardian of a Belsavis ward; Star Cabal partner (Cipher Nine)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:talos-drellik",
    name: "Talos Drellik",
    speciesId: "human",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3669,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male, Dromund Kaas; son of Moff Drellik; archaeologist lieutenant (Nox)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:andronikos-revel",
    name: "Andronikos Revel",
    speciesId: "human",
    faction: "sithEmpire",
    role: "officer",
    archetype: "soldier",
    birthBby: 3678,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Imperial (non-Force)",
      summary: "Human male, Corellia; Republic Navy captain turned pirate (Nox)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Imperial-side companions"
    }
  },
  {
    canonId: "lore:mandalore-the-lesser",
    name: "Mandalore the Lesser",
    speciesId: "human",
    faction: "mandalorians",
    role: "officer",
    archetype: "mandalorian",
    birthBby: 3692,
    birthSource: "estimate",
    deathBby: 3660,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "male Human (infobox). a Geonosis arena gladiator whose fights Imperial Intelligence rigged; took the title Mandalore in 3667 BBY.",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Mandalore the Lesser"
    }
  },
  {
    canonId: "lore:jicoln-cadera",
    name: "Jicoln Cadera",
    speciesId: "human",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "Human male; leader of the pro-Republic Crusader's schism; opposed the Vindicated",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:torian-cadera",
    name: "Torian Cadera",
    speciesId: "human",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3660,
    birthSource: "lore",
    snapshotBby: 3659,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "Human male, Geonosis; Jicoln's son; joined the Hunter after Taris; on Dromund Kaas 3642 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:akaavi-spar",
    name: "Akaavi Spar",
    speciesId: "zabrak",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3670,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Mandalorian / Hunter circle",
      summary: "Zabrak female, Kamar; Clan Spar warrior; Balmorra 3642 BBY (Voidhound)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:dao-stryver",
    name: "Dao Stryver",
    speciesId: "other",
    faction: "mandalorians",
    role: "officer",
    archetype: "mandalorian",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "female",
      group: "Mandalorian / Hunter circle",
      summary: "Gektl female; Mandalore's champion; Sebaddon; Star Cabal",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:braden",
    name: "Braden",
    speciesId: "human",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "Human male; bounty hunter; hunting Dalborra on Dantooine at the Treaty; Mako's mentor",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:mako",
    name: "Mako",
    speciesId: "human",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3662,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "female",
      group: "Mandalorian / Hunter circle",
      summary: "Human female, Nar Shaddaa; orphan slicer found by Braden (Grand Champion)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:gault-rennow",
    name: "Gault Rennow",
    speciesId: "other",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3697,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "Devaronian male; con artist; broke the Hydian blockade with Hylo in 3660 BBY, then betrayed her (Grand Champion)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:skadge",
    name: "Skadge",
    speciesId: "other",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3678,
    birthSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "Houk male, Lijuter; Black Sun thug jailed on Belsavis by Zale Barrows (Grand Champion)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:blizz",
    name: "Blizz",
    speciesId: "jawa",
    faction: "independent",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3686,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Mandalorian / Hunter circle",
      summary: "Jawa male, Tatooine; Slam Streever's \"ferret\"; travelled with the Grand Champion",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › Other Mandalorians and the Grand Champion's circle"
    }
  },
  {
    canonId: "lore:karagga-the-unyielding",
    name: "Karagga the Unyielding",
    speciesId: "hutt",
    faction: "underworld",
    role: "criminal",
    archetype: "civilian",
    birthBby: 4460,
    birthSource: "estimate",
    deathBby: 3639,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    note: "birth year: design estimate, \"over 800 years old\" by the Cold War",
    facts: {
      sex: "male",
      group: "Underworld / Hutt",
      summary: "Hutt male; Supreme Mogul of the Hutt Cartel for nearly two centuries by the Cold War; over 800 years old",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:suudaa-nemro",
    name: "Suudaa Nem'ro",
    speciesId: "hutt",
    faction: "underworld",
    role: "criminal",
    archetype: "civilian",
    birthBby: 4241,
    birthSource: "lore",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Underworld / Hutt",
      summary: "Hutt male; gang boss of Jiguuna on Hutta; sponsored Braden's protégé in 3643 BBY",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:tassaa-bareesh",
    name: "Tassaa Bareesh",
    speciesId: "hutt",
    faction: "underworld",
    role: "criminal",
    archetype: "civilian",
    birthBby: 3800,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    note: "birth year: design estimate, a long-lived Hutt crime lord by the Cold War",
    facts: {
      sex: "female",
      group: "Underworld / Hutt",
      summary: "Hutt female; Bareesh Cartel matriarch; held the 3643 BBY artifact auction",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:nok-drayen",
    name: "Nok Drayen",
    speciesId: "human",
    faction: "underworld",
    role: "criminal",
    archetype: "smuggler",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3643,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    note: "birth year: design estimate, a rising smuggler in 3661 (D-385)",
    facts: {
      sex: "male",
      group: "Underworld / Hutt",
      summary: "Human male, Dubrillion; Star Cabal crime lord; wiped out the Mandellia shadowport with one nerve-toxin torpedo; at a Nar Shaddaa meeting in 3653 BBY, where he was betrayed and infected",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:hylo-visz",
    name: "Hylo Visz",
    speciesId: "mirialan",
    faction: "underworld",
    role: "smuggler",
    archetype: "smuggler",
    birthBby: 3683,
    birthSource: "estimate",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    note: "birth year: design estimate, a young Cartel smuggler in 3661 (D-385)",
    facts: {
      sex: "female",
      group: "Underworld / Hutt",
      summary: "Mirialan female; led the smugglers who broke the Hydian Way blockade (Jedi sent in 3661 BBY; Republic paying by 3660 BBY)",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:zale-barrows",
    name: "Zale Barrows",
    speciesId: "human",
    faction: "underworld",
    role: "smuggler",
    archetype: "smuggler",
    birthBby: 3685,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Underworld / Hutt",
      summary: "Human male; smuggler and privateer; blockade attack 3660 BBY; Free Spacers Fleet at Dantooine and Coruscant; then Belsavis ferryman",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:vrath-xizor",
    name: "Vrath Xizor",
    speciesId: "human",
    faction: "underworld",
    role: "criminal",
    archetype: "civilian",
    birthBby: 3686,
    birthSource: "estimate",
    deathBby: 3653,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "provisional",
    facts: {
      sex: "male",
      group: "Underworld / Hutt",
      summary: "Human male; ex-Imperial sniper; Hutt mercenary sent to stop Zeerid Korr",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  },
  {
    canonId: "lore:jewla-nightbringer",
    name: "Jewl'a Nightbringer",
    speciesId: "zabrak",
    faction: "underworld",
    role: "bountyHunter",
    archetype: "bountyHunter",
    birthBby: 3670,
    birthSource: "estimate",
    deathBby: 3641,
    deathSource: "lore",
    snapshotBby: 3661,
    levels: {},
    statsSource: "factsOnly",
    note: "birth year: design estimate, a child in the lower levels during the 3661 food riots (D-385)",
    facts: {
      sex: "female",
      group: "Underworld / Hutt",
      summary: "Zabrak female, Coruscant; the most feared bounty hunter of her day; grew up in Coruscant's lower levels",
      source: "SW_Characters_09_GGW_ColdWar_Part3b.md › C. Underworld and Hutts"
    }
  }
];
