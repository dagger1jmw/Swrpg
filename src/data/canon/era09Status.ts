// Era 09 status snapshots (lore batch 19, D-391): who is on the board at the default start (3661 BBY) and at the
// Sacking (3653 BBY), from the master index's "Status in 3661 BBY" column and each entry's "3661 BBY / 3653 BBY" line
// (Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_*). 'notStated' figures are placed by their birth and death years.
import type { CanonStatus } from './types';

export const ERA_09_STATUS: Readonly<Record<string, { status3661: CanonStatus; status3653?: string }>> = {
  "lore:zym": {
    status3661: {
      kind: "active",
      note: "Grand Master [inferred]"
    }
  },
  "lore:satele-shan": {
    status3661: {
      kind: "active",
      note: "Jedi; recalled to Coruscant over the Hydian blockade"
    }
  },
  "lore:kao-cen-darach": {
    status3661: {
      kind: "dead",
      note: "dead"
    }
  },
  "lore:darnala": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:ngani-zho": {
    status3661: {
      kind: "notStated",
      note: "not stated (raising Theron)"
    }
  },
  "lore:orgus-din": {
    status3661: {
      kind: "active",
      note: "Minos Cluster front [inferred]"
    }
  },
  "lore:gnost-dural": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:ven-zallow": {
    status3661: {
      kind: "active",
      note: "Rim Campaign, c. 3660 BBY"
    }
  },
  "lore:aryn-leneer": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:syo-bakarn": {
    status3661: {
      kind: "child",
      age: 17,
      note: "not stated (~17)"
    }
  },
  "lore:bela-kiwiiks": {
    status3661: {
      kind: "active",
      note: "Master with the military [inferred]"
    }
  },
  "lore:jaric-kaedan": {
    status3661: {
      kind: "notStated",
      note: "not stated (Knight [inferred])"
    }
  },
  "lore:tol-braga": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:sajar": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:kira-carsen": {
    status3661: {
      kind: "child",
      age: 2,
      note: "~2"
    }
  },
  "lore:revan": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner of the Emperor"
    }
  },
  "lore:fortris-gall": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:nomen-karr": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:warren-sedoru": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:ardun-kothe": {
    status3661: {
      kind: "active",
      note: "Jedi [inferred]"
    }
  },
  "lore:hero-of-tython": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:the-barsenthor": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:belth-allusis": {
    status3661: {
      kind: "dead",
      note: "dead"
    },
    status3653: "dead"
  },
  "lore:oteg": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:shol-bestros": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:jerbhen-hulis": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:wyellett": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:xerender": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:bengel-morr": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "in the Jedi Temple"
  },
  "lore:tasiele-shan": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:parkanas-tark": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:kellian-jarro": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "Coruscant, fighting Mandalorians"
  },
  "lore:yuon-par": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:leeha-narezz": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:aurei-eadon": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:ako-domi": {
    status3661: {
      kind: "child",
      age: 13,
      note: "not stated; age from the birth year"
    },
    status3653: "prisoner [unclear on the date]"
  },
  "lore:nadia-grell": {
    status3661: {
      kind: "child",
      age: 3,
      note: "aged about 3 [inferred]"
    },
    status3653: "aged about 11 [inferred]"
  },
  "lore:ashara-zavros": {
    status3661: {
      kind: "child",
      age: 0,
      note: "infant [inferred]"
    },
    status3653: "aged about 9 [inferred]"
  },
  "lore:meetra-surik": {
    status3661: {
      kind: "dead",
      note: "spirit"
    },
    status3653: "spirit"
  },
  "lore:vitiate": {
    status3661: {
      kind: "active",
      note: "Emperor, \"growing restless\" by 3660 BBY"
    }
  },
  "lore:scourge": {
    status3661: {
      kind: "notStated",
      note: "Emperor's Wrath; location not stated"
    }
  },
  "lore:darth-malgus": {
    status3661: {
      kind: "active",
      note: "Darth; Rim Campaign and Ord Radama, c. 3660 BBY"
    }
  },
  "lore:darth-marr": {
    status3661: {
      kind: "active",
      note: "Dark Councilor; Korriban/Ziost defence, 3660 BBY"
    }
  },
  "lore:darth-baras": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:darth-angral": {
    status3661: {
      kind: "active",
      note: "overseeing the Rim Campaign, c. 3660 BBY"
    }
  },
  "lore:darth-jadus": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:darth-vindican": {
    status3661: {
      kind: "dead",
      note: "dead"
    }
  },
  "lore:darth-thanaton": {
    status3661: {
      kind: "active",
      note: "Darth, Ancient Knowledge [inferred]"
    }
  },
  "lore:darth-mekhis": {
    status3661: {
      kind: "active",
      note: "head of Technology [inferred]"
    }
  },
  "lore:darth-vowrawn": {
    status3661: {
      kind: "active",
      note: "Dark Councilor (~55)"
    }
  },
  "lore:darth-acina": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:darth-ekkage": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-vengean": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-azamin": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "assassinated"
  },
  "lore:darth-decimus": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "promoted to the Council"
  },
  "lore:darth-ravage": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-mortis": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-rictus": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-karrid": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-hadra": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-arkous": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-arho": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-ikoral": {
    status3661: {
      kind: "active",
      note: "absent on the expedition [inferred]"
    },
    status3653: "—"
  },
  "lore:dread-masters": {
    status3661: {
      kind: "imprisoned",
      note: "prisoners on Belsavis"
    }
  },
  "lore:raptus": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner on Belsavis"
    }
  },
  "lore:bestia": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner on Belsavis"
    }
  },
  "lore:brontes": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner on Belsavis"
    }
  },
  "lore:calphayus": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner on Belsavis"
    }
  },
  "lore:styrak": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner on Belsavis"
    }
  },
  "lore:tyrans": {
    status3661: {
      kind: "imprisoned",
      note: "prisoner on Belsavis"
    }
  },
  "lore:emperor-wrath": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:darth-nox": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:darth-zash": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:exal-kressh": {
    status3661: {
      kind: "dead",
      note: "dead"
    }
  },
  "lore:tarnis": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:praven": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:adraas": {
    status3661: {
      kind: "active",
      note: "Ord Radama, 3660 BBY"
    }
  },
  "lore:darth-venemal": {
    status3661: {
      kind: "active",
      note: "Rim Campaign [inferred]"
    }
  },
  "lore:darth-lachris": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:calypho": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-skotia": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:nefarid": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-vich": {
    status3661: {
      kind: "dead",
      note: "dead"
    },
    status3653: "dead"
  },
  "lore:darth-gravus": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-charnus": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-serevin": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:darth-tormen": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:harkun": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:spindrall": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:tremel": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:ffon-althe": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:grathan": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:khem-val": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:xalek": {
    status3661: {
      kind: "child",
      age: 4,
      note: "aged about 4 [inferred]"
    },
    status3653: "about 12 [inferred]"
  },
  "lore:jaesa-willsaam": {
    status3661: {
      kind: "child",
      age: 3,
      note: "aged about 3 [inferred]"
    },
    status3653: "about 11 [inferred]"
  },
  "lore:lana-beniko": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:berooken": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "Chancellor on Coruscant; on the Jedi Council's advice he stayed home and sent Paran Am-Ris to Alderaan, then died in the Sacking."
  },
  "lore:paran-am-ris": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "on Alderaan; he saw Berooken's death by holo and was pressed by Darth Baras to sign."
  },
  "lore:dorian-janarus": {
    status3661: {
      kind: "notStated",
      note: "senator for Coruscant (date of first term not stated)"
    },
    status3653: "senator, then Chancellor-elect after the Treaty."
  },
  "lore:leontyne-saresh": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:silara-panteer-and-gaul-panteer": {
    status3661: {
      kind: "active",
      note: "Silara queen"
    },
    status3653: "Silara queen; Gaul senator who led the secession."
  },
  "lore:jebevel-madon": {
    status3661: {
      kind: "child",
      age: 16,
      note: "not stated; age from the birth year"
    },
    status3653: "—"
  },
  "lore:galena-rans": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "not stated"
  },
  "lore:jace-malcom": {
    status3661: {
      kind: "notStated",
      note: "not stated (serving)"
    },
    status3653: "not stated."
  },
  "lore:elin-garza": {
    status3661: {
      kind: "notStated",
      note: "not stated (serving)"
    }
  },
  "lore:marcus-trant": {
    status3661: {
      kind: "active",
      note: "SIS field agent"
    },
    status3653: "Bureau Chief, Nar Shaddaa."
  },
  "lore:rans": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "Supreme Commander."
  },
  "lore:stantorrs": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:harron-tavus": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "on Coruscant with Din during the Sacking."
  },
  "lore:var-suthra": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:theron-shan": {
    status3661: {
      kind: "child",
      age: 5,
      note: "~5, in Zho's care"
    },
    status3653: "about 13 [both inferred from 3666 BBY]."
  },
  "lore:zeerid-korr": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:meteor": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:voidhound": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:nico-okarr": {
    status3661: {
      kind: "active",
      note: "missing (unaging, unseen until 3631 BBY)"
    }
  },
  "lore:aric-jorgan": {
    status3661: {
      kind: "child",
      age: 12,
      note: "~12"
    },
    status3653: "~20, service not stated"
  },
  "lore:elara-dorne": {
    status3661: {
      kind: "child",
      age: 8,
      note: "~8"
    },
    status3653: "~16 (or ~4 / ~12)"
  },
  "lore:tanno-vik": {
    status3661: {
      kind: "child",
      age: 15,
      note: "~15"
    },
    status3653: "~23"
  },
  "lore:m1-4x": {
    status3661: {
      kind: "unborn",
      note: "not built"
    },
    status3653: "not built [inferred]"
  },
  "lore:yuun": {
    status3661: {
      kind: "child",
      age: 9,
      note: "~9"
    },
    status3653: "~17"
  },
  "lore:fideltin-rusk": {
    status3661: {
      kind: "active",
      note: "~21, serving"
    },
    status3653: "~29, serving"
  },
  "lore:t7-o1": {
    status3661: {
      kind: "active",
      note: "with Zallow"
    },
    status3653: "Coruscant"
  },
  "lore:doc": {
    status3661: {
      kind: "child",
      age: 9,
      note: "~9"
    },
    status3653: "~17"
  },
  "lore:corso-riggs": {
    status3661: {
      kind: "child",
      age: 4,
      note: "~4"
    },
    status3653: "~12"
  },
  "lore:bowdaar": {
    status3661: {
      kind: "active",
      note: "in the arenas"
    },
    status3653: "in the arenas"
  },
  "lore:risha-drayen": {
    status3661: {
      kind: "child",
      age: 3,
      note: "~3"
    },
    status3653: "~11"
  },
  "lore:guss-tuno": {
    status3661: {
      kind: "child",
      age: 14,
      note: "~14"
    },
    status3653: "~22"
  },
  "lore:qyzen-fess": {
    status3661: {
      kind: "child",
      age: 14,
      note: "~14"
    },
    status3653: "~22"
  },
  "lore:tharan-cedrax": {
    status3661: {
      kind: "child",
      age: 11,
      note: "~11"
    },
    status3653: "~19"
  },
  "lore:holiday": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "—"
  },
  "lore:zenith": {
    status3661: {
      kind: "child",
      age: 3,
      note: "~3"
    },
    status3653: "~11"
  },
  "lore:felix-iresso": {
    status3661: {
      kind: "child",
      age: 12,
      note: "~12"
    },
    status3653: "~20"
  },
  "lore:arra-yooms": {
    status3661: {
      kind: "child",
      age: 0,
      note: "infant"
    },
    status3653: "~9"
  },
  "lore:korvan": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:rycus-kilran": {
    status3661: {
      kind: "notStated",
      note: "not stated (~31)"
    },
    status3653: "captain in the Sacking of Coruscant."
  },
  "lore:vasil-dorne": {
    status3661: {
      kind: "active",
      note: "garrison commander [inferred]"
    }
  },
  "lore:zellos": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:shareis": {
    status3661: {
      kind: "active",
      note: "War Minister (Ord Radama, c. 3660 BBY)"
    },
    status3653: "not stated"
  },
  "lore:shullis-khamarr": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:layek-davos": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:broysc": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "Druckenwell"
  },
  "lore:tarrick": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:eleena-daru": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "dies on Coruscant."
  },
  "lore:keeper": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:shara-jenn": {
    status3661: {
      kind: "child",
      age: 6,
      note: "not stated; age from the birth year"
    }
  },
  "lore:watcher-x": {
    status3661: {
      kind: "active",
      note: "~24, post-Undertow"
    },
    status3653: "~32"
  },
  "lore:fixer-seven": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:cipher-twelve": {
    status3661: {
      kind: "dead",
      note: "dead"
    },
    status3653: "dead"
  },
  "lore:ula-vii": {
    status3661: {
      kind: "child",
      age: 7,
      note: "not stated; age from the birth year"
    }
  },
  "lore:hunter": {
    status3661: {
      kind: "child",
      age: 9,
      note: "~9"
    },
    status3653: "~17"
  },
  "lore:cipher-nine": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:malavai-quinn": {
    status3661: {
      kind: "active",
      note: "~19, serving"
    },
    status3653: "lieutenant"
  },
  "lore:vette": {
    status3661: {
      kind: "child",
      age: 3,
      note: "~3"
    },
    status3653: "~11"
  },
  "lore:pierce": {
    status3661: {
      kind: "child",
      age: 10,
      note: "~10"
    },
    status3653: "~18"
  },
  "lore:broonmark": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:kaliyo-djannis": {
    status3661: {
      kind: "child",
      age: 11,
      note: "~11"
    },
    status3653: "~19"
  },
  "lore:eckard-fixer-fifteen-lokin": {
    status3661: {
      kind: "active",
      note: "~54"
    },
    status3653: "~62"
  },
  "lore:vector-hyllus": {
    status3661: {
      kind: "child",
      age: 8,
      note: "~8"
    },
    status3653: "~16"
  },
  "lore:raina-temple": {
    status3661: {
      kind: "child",
      age: 5,
      note: "~5"
    },
    status3653: "~13"
  },
  "lore:scorpio": {
    status3661: {
      kind: "active",
      note: "in use as a droid"
    }
  },
  "lore:talos-drellik": {
    status3661: {
      kind: "child",
      age: 8,
      note: "~8"
    },
    status3653: "~16"
  },
  "lore:andronikos-revel": {
    status3661: {
      kind: "child",
      age: 17,
      note: "~17"
    },
    status3653: "~25"
  },
  "lore:mandalore-the-lesser": {
    status3661: {
      kind: "active",
      note: "Mandalore; Hydian Way blockade"
    },
    status3653: "dead per the infobox; see Uncertainty."
  },
  "lore:mandalore-the-vindicated": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:shae-vizla": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "in the Temple during the Sacking."
  },
  "lore:jicoln-cadera": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:torian-cadera": {
    status3661: {
      kind: "unborn",
      note: "not born"
    },
    status3653: "~7"
  },
  "lore:akaavi-spar": {
    status3661: {
      kind: "child",
      age: 9,
      note: "~9"
    },
    status3653: "~17"
  },
  "lore:dao-stryver": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:braden": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "Dantooine"
  },
  "lore:mako": {
    status3661: {
      kind: "child",
      age: 0,
      note: "infant"
    },
    status3653: "~9"
  },
  "lore:gault-rennow": {
    status3661: {
      kind: "active",
      note: "smuggler with Hylo; blockade run"
    },
    status3653: "not stated"
  },
  "lore:skadge": {
    status3661: {
      kind: "child",
      age: 17,
      note: "~17"
    },
    status3653: "~25"
  },
  "lore:blizz": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:the-grand-champion": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:karagga-the-unyielding": {
    status3661: {
      kind: "active",
      note: "Supreme Mogul [inferred]"
    },
    status3653: "Supreme Mogul [inferred from \"nearly two centuries\"]"
  },
  "lore:suudaa-nemro": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:tassaa-bareesh": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    }
  },
  "lore:nok-drayen": {
    status3661: {
      kind: "active",
      note: "crime lord"
    },
    status3653: "Nar Shaddaa"
  },
  "lore:hylo-visz": {
    status3661: {
      kind: "active",
      note: "smuggler leader; blockade run"
    },
    status3653: "not stated"
  },
  "lore:zale-barrows": {
    status3661: {
      kind: "active",
      note: "blockade run, c. 3660 BBY"
    },
    status3653: "not stated"
  },
  "lore:vrath-xizor": {
    status3661: {
      kind: "notStated",
      note: "not stated"
    },
    status3653: "hunting Korr"
  },
  "lore:jewla-nightbringer": {
    status3661: {
      kind: "child",
      age: 9,
      note: "not stated; age from the birth year"
    }
  }
};
