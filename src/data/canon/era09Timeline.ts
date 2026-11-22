// Era 09 dated facts per figure (date-agnostic refactor, D-412): rank, role and office spans, status spans and
// location spans, with each span's source wording and an `estimate` tag where the sources don't date it. Built from the
// old roster roles, the master index's 3,661 and 3,653 status columns (lore batch 19; now cited facts inside one-year
// spans), the unavailable spans, the placements (D-401 [3]-[5]) and the leaders table, then reviewed by hand against the
// lore files and the brief's §4 corrections (docs-v2/spec/date-agnostic-refactor.md). Ranks the sources don't date
// start at their typical age (src/data/canon/rankAges.ts). Years are BBY as positive numbers, both ends inclusive; an
// absent `toBby` runs to the figure's death. Where spans overlap (an office inside a rank), the later-starting one is
// the figure's rank that year.
import type { CanonTimeline } from './types';

export const ERA_09_TIMELINE: Readonly<Record<string, CanonTimeline>> = {
  "lore:vitiate": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 5098,
        "toBby": 5092,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 5091,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Emperor",
        "fromBby": 3681,
        "toBby": 3640,
        "source": "Sith Emperor: SW_SWTOR_Era_Power_Structures_Part1; Timeline slice Part 2 (3,640: his Voice is killed); D-408 [3]"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Emperor, \"growing restless\" by 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:scourge": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3985,
        "toBby": 3979,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3978,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Emperor's Wrath; location not stated",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-malgus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3685,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3680,
        "toBby": 3668,
        "source": "from 3680 (roster, lore batch 19)"
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3667,
        "source": "Darth c. 3,667 (roster note, lore batch 19)"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Darth; Rim Campaign and Ord Radama, c. 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "missing",
        "fromBby": 3639,
        "toBby": 3629,
        "note": "missing after Ilum",
        "source": "believed killed at Ilum (3,640); in hiding until revealed alive at Ossus, c. 3,628 (Timeline slice Part 2, lore batch 20)"
      }
    ]
  },
  "lore:darth-marr": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3687,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3680,
        "toBby": 3668,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3667,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Dark Councilor",
        "fromBby": 3661,
        "toBby": 3636,
        "source": "Dark Councilor; Korriban and Ziost defence, 3,660 (status in 3,661)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Dark Councilor; Korriban/Ziost defence, 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:darth-baras": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3682,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3675,
        "toBby": 3663,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3662,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:darth-angral": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3690,
        "toBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3683,
        "toBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3670,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "overseeing the Rim Campaign, c. 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-jadus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3673,
        "toBby": 3667,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3666,
        "toBby": 3654,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3653,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:dread-masters": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3985,
        "toBby": 3979,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3978,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "the Dread Masters",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-vindican": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3725,
        "toBby": 3719,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3718,
        "toBby": 3706,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3705,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-vowrawn": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3701,
        "toBby": 3695,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3694,
        "toBby": 3682,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3681,
        "toBby": 3630,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Dark Councilor",
        "fromBby": 3661,
        "toBby": 3630,
        "source": "Dark Councilor (~55) (status in 3,661); Emperor from 3,629",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Emperor",
        "fromBby": 3629,
        "source": "later Emperor (3,629 BBY)"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Dark Councilor (~55)",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:darth-thanaton": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3680,
        "toBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3679,
        "toBby": 3679,
        "source": "from 3678 (roster, lore batch 19)"
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3678,
        "source": "Lord and Darth from 3,678 (roster note, lore batch 19)"
      },
      {
        "role": "sithLord",
        "title": "Dark Councilor",
        "fromBby": 3643,
        "toBby": 3640,
        "source": "on the Dark Council from c. 3,643 until his death in 3,640 (ruling 9)"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Darth, Ancient Knowledge [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:darth-zash": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3705,
        "toBby": 3699,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3698,
        "toBby": 3686,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-mekhis": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3705,
        "toBby": 3699,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3698,
        "toBby": 3686,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Dark Councilor",
        "fromBby": 3661,
        "toBby": 3643,
        "source": "head of the Sphere of Technology [inferred] (status in 3,661)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "head of Technology [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-acina": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3700,
        "toBby": 3694,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3693,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:exal-kressh": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3705,
        "toBby": 3699,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3698,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:eleena-daru": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3672,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "dies on Coruscant",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:rycus-kilran": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3674,
        "toBby": 3668,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3667,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "captain in the Sacking of Coruscant",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ]
  },
  "lore:zym": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3776,
        "toBby": 3768,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3767,
        "toBby": 3756,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3755,
        "toBby": 3741,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3740,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Grand Master",
        "fromBby": 3661,
        "toBby": 3653,
        "source": "Grand Master of the Jedi Order: D-379; D-390 [1]",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Grand Master [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:kao-cen-darach": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3736,
        "toBby": 3728,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3727,
        "toBby": 3716,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3715,
        "toBby": 3701,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3700,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:satele-shan": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3695,
        "toBby": 3687,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3686,
        "toBby": 3678,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3677,
        "toBby": 3652,
        "source": "from 3677 (roster, lore batch 19)"
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3651,
        "source": "from 3651 (roster, lore batch 19)"
      },
      {
        "role": "jediMaster",
        "title": "Grand Master",
        "fromBby": 3651,
        "toBby": 3636,
        "source": "Grand Master of the Jedi Order: D-283 amended"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Jedi; recalled to Coruscant over the Hydian blockade",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:orgus-din": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3711,
        "toBby": 3703,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3702,
        "toBby": 3691,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3690,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Minos Cluster front [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darnala": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3716,
        "toBby": 3708,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3707,
        "toBby": 3696,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3695,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:ngani-zho": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3736,
        "toBby": 3728,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3727,
        "toBby": 3716,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3715,
        "toBby": 3701,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3700,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "missing",
        "fromBby": 3652,
        "toBby": 3644,
        "note": "vanished after 3,653; killed c. 3,643 in the Vesla system",
        "source": "Part1 (vanished in 3,653)",
        "estimate": true
      },
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "raising Theron; takes him to Monastery c. 3661 BBY (timeline, lore batch 20)",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "locations": [
      {
        "place": "Monastery",
        "fromBby": 3661,
        "toBby": 3661,
        "doing": "has brought the young Theron Shan to learn focus from the Order of the Sacred Circle, away from the Order's eyes",
        "placed": true,
        "source": "Timeline slice Part 1 (c. 3,661); D-379"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:gnost-dural": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3701,
        "toBby": 3693,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3692,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3680,
        "toBby": 3654,
        "source": "from 3680 (roster, lore batch 19)"
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3653,
        "source": "from 3653 (roster, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:ven-zallow": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3711,
        "toBby": 3703,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3702,
        "toBby": 3691,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3690,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Rim Campaign, c. 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "locations": [
      {
        "place": "Serenno",
        "fromBby": 3661,
        "toBby": 3661,
        "doing": "a Jedi Master commanding the Republic base on Serenno, ahead of the Rim Campaign",
        "placed": true,
        "source": "D-402 [2]; SW_Planets_Travel_OldRepublic_Part1 (Serenno)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:jaric-kaedan": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3711,
        "toBby": 3703,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3702,
        "toBby": 3691,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3690,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "High Council member",
        "fromBby": 3652,
        "toBby": 3640,
        "source": "High Council after the Treaty; killed at Ilum, 3,640 (roster note)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:tol-braga": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3736,
        "toBby": 3728,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3727,
        "toBby": 3716,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3715,
        "toBby": 3701,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3700,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:syo-bakarn": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3674,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3665,
        "toBby": 3654,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3653,
        "toBby": 3644,
        "source": "from 3653 (roster, lore batch 19)"
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3643,
        "source": "from 3643 (roster, lore batch 19)"
      }
    ]
  },
  "lore:bela-kiwiiks": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3716,
        "toBby": 3708,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3707,
        "toBby": 3696,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3695,
        "toBby": 3664,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3663,
        "source": "a Master from 3,663 (ruling 3)"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Master with the military [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:revan": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3990,
        "toBby": 3982,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3981,
        "toBby": 3970,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3969,
        "toBby": 3955,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3954,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3950,
        "toBby": 3643,
        "note": "a prisoner of the Emperor",
        "source": "the Emperor's prisoner, in stasis, from 3,950 BBY until freed c. 3,643 BBY (lore batch 19)"
      }
    ]
  },
  "lore:jace-malcom": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3684,
        "toBby": 3667,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3666,
        "source": "from 3666 (roster, lore batch 19)"
      },
      {
        "role": "officer",
        "title": "Supreme Commander",
        "fromBby": 3640,
        "toBby": 3640,
        "source": "Supreme Commander of the Republic military: Timeline slice Part 2 (3,640); later years are not on record (D-411 [5]); D-408 [3]"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:leontyne-saresh": {
    "ranks": [
      {
        "role": "politician",
        "title": "senator",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "politician",
        "title": "Supreme Chancellor",
        "fromBby": 3640,
        "toBby": 3632,
        "source": "Supreme Chancellor: Timeline slice Part 2 (3,640, 3,632); D-408 [3]"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:aric-jorgan": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:theron-shan": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3641,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "locations": [
      {
        "place": "Monastery",
        "fromBby": 3661,
        "toBby": 3661,
        "doing": "in Ngani Zho's care",
        "placed": true,
        "shownAs": "Theron Shan (a child of about 5)",
        "source": "Timeline slice Part 1 (c. 3,661); D-379"
      }
    ]
  },
  "lore:hero-of-tython": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3661,
        "toBby": 3653,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3652,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3643,
        "source": "from 3643 (roster, lore batch 19)"
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, excluded from the 3,681-3,653 setting (D-378 [9]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:the-barsenthor": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3664,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3655,
        "toBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3645,
        "toBby": 3641,
        "source": "from 3645 (roster, lore batch 19)"
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3640,
        "source": "from 3640 (roster, lore batch 19)"
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, excluded from the 3,681-3,653 setting (D-378 [9]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:emperor-wrath": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3650,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3643,
        "source": "from 3643 (roster, lore batch 19)"
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, kept out of the 3,681-3,653 setting (D-378 [9] reasoning, D-401 [6]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-nox": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3652,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3643,
        "toBby": 3633,
        "source": "from 3643 (roster, lore batch 19)"
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3632,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, kept out of the 3,681-3,653 setting (D-378 [9] reasoning, D-401 [6]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:cipher-nine": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, kept out of the 3,681-3,653 setting (D-378 [9] reasoning, D-401 [6]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:the-grand-champion": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, kept out of the 3,681-3,653 setting (D-378 [9] reasoning, D-401 [6]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:voidhound": {
    "ranks": [
      {
        "role": "smuggler",
        "title": "smuggler",
        "fromBby": 3652,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, kept out of the 3,681-3,653 setting (D-378 [9] reasoning, D-401 [6]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:meteor": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3654,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3643,
        "source": "from 3643 (roster, lore batch 19)"
      }
    ],
    "status": [
      {
        "kind": "offRecord",
        "fromBby": 3681,
        "toBby": 3653,
        "note": "a Cold War protagonist, kept out of these years; identity unknown before",
        "source": "a Cold War protagonist, kept out of the 3,681-3,653 setting (D-378 [9] reasoning, D-401 [6]); identity unknown before (D-377); through 3,653 (D-411 [4])"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:kira-carsen": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3659,
        "toBby": 3651,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3650,
        "toBby": 3642,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3641,
        "source": "from 3641 (roster, lore batch 19)"
      }
    ]
  },
  "lore:shae-vizla": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3670,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "in the Temple during the Sacking",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:mandalore-the-vindicated": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3687,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "Mandalore",
        "fromBby": 3660,
        "toBby": 3636,
        "source": "Mandalore: Timeline slice Part 1 (3,660); Timeline slice Part 2 (3,636–3,630)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:aryn-leneer": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3682,
        "toBby": 3674,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3673,
        "toBby": 3662,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3661,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Knight in 3,661 (brief §4) and in Deceived (3,653), at 25 in 3,661"
  },
  "lore:sajar": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "faction": "sithEmpire",
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "toBby": 3672,
        "faction": "sithEmpire",
        "source": "estimate",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3671,
        "toBby": 3662,
        "faction": "sithEmpire",
        "source": "\"Darth Sajar\" (Part1)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Dark Councilor",
        "fromBby": 3661,
        "toBby": 3655,
        "faction": "sithEmpire",
        "source": "Dark Lord on the Dark Council during the war (Part1)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3654,
        "source": "gave up his seat to become Tol Braga's Padawan; redeemed before 3,653; still a Padawan in 3,642 (Part1)",
        "estimate": true
      }
    ],
    "birthBasis": "a Dark Councilor during the war, at 45 by 3,661"
  },
  "lore:fortris-gall": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3664,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3655,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3643,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Knight trained by Orgus Din, on Tython in the Cold War (3,643)"
  },
  "lore:nomen-karr": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3696,
        "toBby": 3688,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3687,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "one of the Order's most seasoned veterans in the Cold War: a Knight through the war"
  },
  "lore:warren-sedoru": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3698,
        "toBby": 3687,
        "source": "the page intro calls him a Padawan (Part1)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3686,
        "toBby": 3643,
        "source": "one of the Order's most acclaimed Knights (Part1)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3642,
        "source": "a Jedi Master by c. 3,642 (Vitiate page; batch 13; Part1 conflict ruling 4)"
      }
    ],
    "birthBasis": "born \"several decades before 3,681\" (Part1), read as 30 years"
  },
  "lore:ardun-kothe": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3683,
        "toBby": 3672,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3671,
        "toBby": 3654,
        "source": "Jedi Knight (Part1)",
        "estimate": true
      },
      {
        "role": "official",
        "title": "SIS agent",
        "fromBby": 3653,
        "faction": "republic",
        "source": "left the Order and joined the SIS when the Treaty was signed in 3,653; special Senate sanction c. 3,642 (Part1)"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Jedi [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:belth-allusis": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3712,
        "toBby": 3704,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3703,
        "toBby": 3692,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3691,
        "toBby": 3677,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Master and High Council member leading the defense of Bothawui in 3,671, at 45"
  },
  "lore:oteg": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3840,
        "toBby": 3832,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3831,
        "toBby": 3820,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3819,
        "toBby": 3805,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3804,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "of Yoda's species (lifespans near 900): 183 in 3,661 is young for it (brief §4 checked; kept)"
  },
  "lore:shol-bestros": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3708,
        "toBby": 3700,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3699,
        "toBby": 3688,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3687,
        "toBby": 3673,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3672,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "joined the Order late, recruited by Kao Cen Darach (died 3,681), read as at 12 in c. 3,700; a Master and High Council member in the Cold War"
  },
  "lore:jerbhen-hulis": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3714,
        "toBby": 3706,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3705,
        "toBby": 3694,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3693,
        "toBby": 3679,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3678,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Jedi Master hunting Exal Kressh in 3,678, at 40"
  },
  "lore:wyellett": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3702,
        "toBby": 3694,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3693,
        "toBby": 3682,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3681,
        "toBby": 3667,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "captured",
        "fromBby": 3665,
        "toBby": 3643,
        "note": "captured; his transport crashed on Hoth, where Xerender found him in 3,642",
        "source": "Part1; the capture year is an estimate (lore batch 20)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:xerender": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3680,
        "toBby": 3672,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3671,
        "toBby": 3660,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3659,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Wyellett's Padawan in the war, before Wyellett's capture (c. 3,665); a Knight by 3,642"
  },
  "lore:bengel-morr": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3657,
        "toBby": 3646,
        "source": "Orgus Din's Padawan; in the Temple at the Sacking, 3,653 (Part1)",
        "estimate": true
      },
      {
        "role": "darkJedi",
        "title": "Dark Jedi",
        "fromBby": 3645,
        "toBby": 3643,
        "faction": "independent",
        "source": "driven insane and fell to the dark side; trained the Dark Jedi Callef; defeated by the Hero of Tython (Part1)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi",
        "fromBby": 3642,
        "source": "later served under the Hero on Corellia (Part1)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "in the Jedi Temple",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "Orgus Din's Padawan, in the Temple at the Sacking (3,653) at 17"
  },
  "lore:tasiele-shan": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3720,
        "toBby": 3712,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3711,
        "toBby": 3700,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3699,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "exiled",
        "fromBby": 3698,
        "note": "exiled after challenging the Order's views on attachment",
        "source": "Part1",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:parkanas-tark": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3668,
        "toBby": 3664,
        "faction": "jediOrder",
        "source": "Padawan, the youngest member of the Malachor III expedition (Part1)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Lord Vivicar",
        "fromBby": 3663,
        "faction": "sith",
        "source": "left behind on Malachor III, fell to the spirit of Terrak Morrhage and became Lord Vivicar; spread a Force-plague in the Cold War (Part1)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "missing",
        "fromBby": 3665,
        "toBby": 3644,
        "note": "left behind on Malachor III",
        "source": "Part1 (left behind there)",
        "estimate": true
      }
    ],
    "birthBasis": "the youngest member of the Malachor III expedition, read as 16 at it (brief §4: not a 25-year-old Padawan); the expedition is undated, read as c. 3,665"
  },
  "lore:kellian-jarro": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3689,
        "toBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3680,
        "toBby": 3669,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3668,
        "toBby": 3654,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3653,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Coruscant, fighting Mandalorians",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a Jedi Master at the Sacking (3,653), at 40"
  },
  "lore:yuon-par": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3682,
        "toBby": 3674,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3673,
        "toBby": 3662,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3661,
        "toBby": 3647,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Knight in 3,661 (brief §4) at 25; a Master in the Cold War (3,643)"
  },
  "lore:leeha-narezz": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3674,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3665,
        "toBby": 3654,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3653,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "knighted during the war (by 3,653), at 25"
  },
  "lore:aurei-eadon": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3700,
        "toBby": 3692,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3691,
        "toBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3679,
        "toBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3664,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Jedi Master guarding an envoy c. 3,664, at 40"
  },
  "lore:ako-domi": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3663,
        "toBby": 3652,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3651,
        "toBby": 3650,
        "source": "a legendary Jedi Knight (Part1)",
        "estimate": true
      },
      {
        "role": "darkJedi",
        "title": "self-styled Sith",
        "fromBby": 3649,
        "faction": "independent",
        "source": "sent to Shadow Town on Nar Shaddaa in 3,649, where he fell and called himself a Sith (Part1)"
      }
    ],
    "status": [
      {
        "kind": "captured",
        "fromBby": 3651,
        "toBby": 3650,
        "note": "captured at the Battle of Sullust",
        "source": "Part1; the date is unclear (3,653 note)",
        "estimate": true
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "prisoner [unclear on the date]",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a legendary Knight, captured at Sullust before he was sent to Shadow Town in 3,649"
  },
  "lore:nadia-grell": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3660,
        "toBby": 3652,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3651,
        "toBby": 3640,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3639,
        "toBby": 3625,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3624,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:ashara-zavros": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3658,
        "toBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3649,
        "toBby": 3638,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3637,
        "toBby": 3623,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediMaster",
        "title": "Jedi Master",
        "fromBby": 3622,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:meetra-surik": {
    "ranks": [
      {
        "role": "initiate",
        "title": "Initiate",
        "fromBby": 3986,
        "toBby": 3978,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3977,
        "toBby": 3966,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "jediKnight",
        "title": "Jedi Knight",
        "fromBby": 3965,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:darth-ekkage": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3685,
        "toBby": 3679,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3678,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3642,
        "toBby": 3641,
        "note": "captured by the Jedi and held on Belsavis, where she died in 3,641",
        "source": "Part2 (lore batch 20, ruling 19); the capture year is an estimate",
        "estimate": true
      }
    ],
    "birthBasis": "Baras's sister (Baras born 3,697) and a Dark Councilor in the war"
  },
  "lore:darth-vengean": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3680,
        "toBby": 3674,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3673,
        "toBby": 3661,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3660,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Dark Councilor and the Council's military leader in the Cold War (c. 3,650), at 45"
  },
  "lore:darth-azamin": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3685,
        "toBby": 3679,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3678,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "assassinated",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a Dark Councilor killed near the war's end (3,653), at 47"
  },
  "lore:darth-decimus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3683,
        "toBby": 3677,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3676,
        "toBby": 3664,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3663,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "promoted to the Council",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "promoted to the Dark Council in the war's last months (3,653), at 45"
  },
  "lore:darth-ravage": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3675,
        "toBby": 3669,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3668,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Dark Councilor in the Cold War (c. 3,645), at 45"
  },
  "lore:darth-mortis": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3675,
        "toBby": 3669,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3668,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Dark Councilor in the Cold War (c. 3,645), at 45"
  },
  "lore:darth-rictus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3710,
        "toBby": 3704,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3703,
        "toBby": 3691,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3690,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "the oldest Councilor by 3,640: older than Vowrawn (born 3,716)"
  },
  "lore:darth-karrid": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3671,
        "toBby": 3658,
        "faction": "jediOrder",
        "source": "Kana Terrid, trained by Gnost-Dural (Part2)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "apprentice",
        "fromBby": 3657,
        "toBby": 3650,
        "source": "a Sith under Malgus in the late war (Part2)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3649,
        "source": "Darth Karrid; commanded the Ascendant Spear; head of Technology after Hadra (3,640) (Part2)",
        "estimate": true
      }
    ],
    "birthBasis": "Gnost-Dural's Padawan, a Sith under Malgus in the late war, a Darth by 3,640 (brief §4)"
  },
  "lore:darth-hadra": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3673,
        "toBby": 3667,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3666,
        "toBby": 3654,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3653,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "head of Technology (a Dark Councilor) after Mekhis died in 3,643, at 45"
  },
  "lore:darth-arkous": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3670,
        "toBby": 3664,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3663,
        "toBby": 3651,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Dark Councilor in the Galactic War (c. 3,640), at 45; a Great War veteran"
  },
  "lore:darth-arho": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3670,
        "toBby": 3664,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3663,
        "toBby": 3651,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Dark Councilor commanding on Ilum (3,640), at 45"
  },
  "lore:darth-ikoral": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3742,
        "toBby": 3736,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3735,
        "toBby": 3723,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3722,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "absent on the expedition [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "Vindican's master; a Darth leading an expedition c. 3,712; a long-lived Pureblood (96 in 3,661)"
  },
  "lore:raptus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "Dread Master Raptus",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:bestia": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "Dread Master Bestia",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:brontes": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "Dread Master Brontes",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:calphayus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "Dread Master Calphayus",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:styrak": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "Dread Master Styrak",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:tyrans": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3691,
        "toBby": 3685,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3684,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "imprisoned",
        "fromBby": 3668,
        "toBby": 3642,
        "note": "a prisoner in the Tomb on Belsavis, reported dead to the galaxy",
        "source": "Timeline slice Part 1 (3,668); held until the Imperial invasion of Belsavis (3,641)"
      }
    ],
    "locations": [
      {
        "place": "Belsavis",
        "fromBby": 3668,
        "toBby": 3642,
        "doing": "a prisoner in the Tomb, reported dead to the galaxy",
        "placed": true,
        "imprisoned": true,
        "shownAs": "Dread Master Tyrans",
        "source": "Timeline slice Part 1 (3,668); lore batch 19 master index, status in 3,661 (\"prisoner on Belsavis\")"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:tarnis": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3665,
        "toBby": 3659,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3658,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Darth Angral's son; a Sith Lord before the Sacking (3,653)"
  },
  "lore:praven": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3658,
        "toBby": 3654,
        "faction": "sithEmpire",
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithAcolyte",
        "title": "apprentice",
        "fromBby": 3653,
        "toBby": 3645,
        "faction": "sithEmpire",
        "source": "a Sith Warrior trained by Angral; took part in the 3,653 Temple attack (Part2)",
        "estimate": true
      },
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3644,
        "faction": "jediOrder",
        "source": "later a Jedi Padawan who fought at Corellia in 3,640 (Part2)",
        "estimate": true
      }
    ],
    "birthBasis": "Angral's apprentice in the 3,653 Temple attack, at 20"
  },
  "lore:adraas": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3675,
        "toBby": 3669,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3668,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Ord Radama, 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "a Sith Lord sent to Ord Radama in 3,660, at 30"
  },
  "lore:darth-venemal": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3681,
        "toBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3674,
        "toBby": 3662,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3661,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Rim Campaign [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "a Darth leading the Rim Campaign in 3,660, at 36"
  },
  "lore:darth-lachris": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3662,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3655,
        "toBby": 3643,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3642,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Sith Lord in the 3,653 invasion force; a Darth and Governor of Balmorra by 3,642"
  },
  "lore:calypho": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3708,
        "toBby": 3702,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3701,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Teneb Kel's master, arrested c. 3,678; kept"
  },
  "lore:darth-skotia": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3665,
        "toBby": 3659,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3658,
        "toBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Darth on Dromund Kaas, murdered in 3,643"
  },
  "lore:nefarid": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3648,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithAcolyte",
        "title": "apprentice",
        "fromBby": 3643,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Angral's apprentice when he died in 3,643, at 20"
  },
  "lore:darth-vich": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3688,
        "toBby": 3682,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a young Sith Lord by 3,681 (the old estimate had him born after his death)"
  },
  "lore:darth-gravus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3665,
        "toBby": 3659,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3658,
        "toBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Sith overseer of Taris in 3,642 and a Council candidate in 3,640"
  },
  "lore:darth-charnus": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3663,
        "toBby": 3657,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3656,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3643,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Decimus's right hand, a Darth hunting the Order of Revan in 3,643"
  },
  "lore:darth-serevin": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3665,
        "toBby": 3659,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3658,
        "toBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Sith Lord in the Cold War, a Darth by 3,642"
  },
  "lore:darth-tormen": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3665,
        "toBby": 3659,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3658,
        "toBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Darth",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "undated; a Darth employing the Hunter c. 3,643"
  },
  "lore:harkun": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3675,
        "toBby": 3668,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "official",
        "title": "Sith of the Academy staff",
        "fromBby": 3667,
        "toBby": 3656,
        "source": "estimate: a Sith, not a Lord (brief §4)",
        "estimate": true
      },
      {
        "role": "official",
        "title": "Overseer",
        "fromBby": 3655,
        "source": "Overseer of acolytes at the Korriban academy under Zash; gathered her new class c. 3,643 (Part2); not in post in 3,661 (batch 12)",
        "estimate": true
      }
    ],
    "birthBasis": "an Overseer at 35 from c. 3,655: not in post in 3,661 (brief §4, batch 12); Zash's class c. 3,643"
  },
  "lore:spindrall": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3705,
        "toBby": 3699,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3698,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "locations": [
      {
        "place": "Korriban",
        "fromBby": 3681,
        "toBby": 3644,
        "doing": "a hermit in Ajunta Pall's tomb",
        "placed": true,
        "source": "SW_Korriban_Academy_Part1; D-376"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:tremel": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3701,
        "toBby": 3695,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "official",
        "title": "Sith of the Academy staff",
        "fromBby": 3694,
        "toBby": 3682,
        "source": "estimate",
        "estimate": true
      },
      {
        "role": "official",
        "title": "Overseer",
        "fromBby": 3681,
        "source": "an Overseer at the Sith Academy for decades, administering the trials (SW_Korriban_Academy_Part1 §B; D-376)"
      }
    ],
    "locations": [
      {
        "place": "Korriban",
        "fromBby": 3681,
        "toBby": 3644,
        "doing": "an Overseer at the Sith Academy for decades, administering the trials",
        "placed": true,
        "shownAs": "Overseer Tremel",
        "source": "SW_Korriban_Academy_Part1 §B; D-376"
      }
    ],
    "birthBasis": "an Overseer at the Academy for decades from 3,681, whose son is an acolyte by 3,643 (brief §4)"
  },
  "lore:ffon-althe": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "an acolyte favoured by Harkun in 3,643, at 17"
  },
  "lore:grathan": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3655,
        "toBby": 3649,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3648,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Sith Lord in rebellion on Dromund Kaas c. 3,643"
  },
  "lore:khem-val": {
    "ranks": [
      {
        "role": "other",
        "title": "Dashade warrior",
        "fromBby": 5480,
        "source": "Tulak Hord's servant, revived to serve Darth Nox; resists the Force (Part2); a warrior, not a Sith Lord (brief §4)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "stasis",
        "fromBby": 5000,
        "toBby": 3644,
        "note": "in stasis in a tomb on Korriban until revived for Darth Nox",
        "source": "Part2 (revived to serve Darth Nox); the sleep's start is an estimate",
        "estimate": true
      }
    ],
    "birthBasis": "Tulak Hord's servant (before 5,500 BBY); in stasis from Hord's fall until found in the Cold War"
  },
  "lore:xalek": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3650,
        "toBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3643,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:jaesa-willsaam": {
    "ranks": [
      {
        "role": "padawan",
        "title": "Padawan",
        "fromBby": 3651,
        "toBby": 3643,
        "faction": "jediOrder",
        "source": "Jedi Padawan of Nomen Karr (Part2)",
        "estimate": true
      },
      {
        "role": "sithAcolyte",
        "title": "apprentice",
        "fromBby": 3642,
        "source": "then the Wrath's apprentice (Part2)",
        "estimate": true
      }
    ]
  },
  "lore:lana-beniko": {
    "ranks": [
      {
        "role": "sithAcolyte",
        "title": "acolyte",
        "fromBby": 3657,
        "toBby": 3650,
        "source": "an acolyte of Overseer Harkun (Part2)",
        "estimate": true
      },
      {
        "role": "sithLord",
        "title": "Sith Lord",
        "fromBby": 3649,
        "source": "Sith Lord; adviser to Darth Arkous; helped plan the Tython assault in 3,637 (Part2)",
        "estimate": true
      }
    ],
    "birthBasis": "a youth in 3,661 (brief §4); an acolyte of Overseer Harkun in the Cold War; a Sith Lord by 3,637"
  },
  "lore:berooken": {
    "ranks": [
      {
        "role": "politician",
        "title": "senator",
        "fromBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "politician",
        "title": "Supreme Chancellor",
        "fromBby": 3661,
        "toBby": 3653,
        "source": "Supreme Chancellor: D-363; D-381 (elected \"late in the war\", no date)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Chancellor on Coruscant; on the Jedi Council's advice he stayed home and sent Paran Am-Ris to Alderaan, then died in the Sacking",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:paran-am-ris": {
    "ranks": [
      {
        "role": "politician",
        "title": "senator",
        "fromBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "on Alderaan; he saw Berooken's death by holo and was pressed by Darth Baras to sign",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:dorian-janarus": {
    "ranks": [
      {
        "role": "politician",
        "title": "senator",
        "fromBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "politician",
        "title": "Supreme Chancellor",
        "fromBby": 3653,
        "toBby": 3640,
        "source": "Supreme Chancellor: Timeline slice Part 2 (elected shortly after the Treaty in 3,653; re-elected 3,649 and 3,645; killed 3,640); D-408 [3]"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "senator for Coruscant (date of first term not stated)",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "senator, then Chancellor-elect after the Treaty",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:silara-panteer-and-gaul-panteer": {
    "ranks": [
      {
        "role": "politician",
        "title": "senator",
        "fromBby": 3677,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Silara queen",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Silara queen; Gaul senator who led the secession",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:jebevel-madon": {
    "ranks": [
      {
        "role": "politician",
        "title": "senator",
        "fromBby": 3642,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:galena-rans": {
    "ranks": [
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3660,
        "toBby": 3628,
        "source": "veteran of the 439th bomber wing (Part3a)",
        "estimate": true
      },
      {
        "role": "politician",
        "title": "Supreme Chancellor",
        "fromBby": 3627,
        "source": "Chancellor after Madon resigned, \"early during the Third Galactic War\" (Timeline Part 2, after 3,628)",
        "estimate": true
      }
    ],
    "birthBasis": "a bomber-wing veteran of the war; Chancellor after 3,628 (Timeline Part 2)"
  },
  "lore:elin-garza": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3678,
        "toBby": 3672,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:marcus-trant": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "SIS field agent",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Bureau Chief, Nar Shaddaa",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:rans": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3688,
        "toBby": 3682,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "Supreme Commander",
        "fromBby": 3681,
        "toBby": 3640,
        "source": "Supreme Commander of the Republic military: D-360 [3]; D-386 [1]; SW_Characters_09_GGW_ColdWar_Part3a (Rans: Supreme Commander in the Great War and the Cold War; retired after Ilum); D-408 [3]",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Supreme Commander",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:stantorrs": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3688,
        "toBby": 3682,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3681,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:harron-tavus": {
    "ranks": [
      {
        "role": "officer",
        "title": "lieutenant",
        "fromBby": 3657,
        "toBby": 3650,
        "source": "Special Forces lieutenant in the Minos Cluster with Orgus Din; with Din during the Sacking (Part3a)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "captain",
        "fromBby": 3649,
        "toBby": 3644,
        "source": "later a captain, then commander of Havoc Squad in the Cold War (Part3a)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "commander",
        "fromBby": 3643,
        "faction": "sithEmpire",
        "source": "led Havoc's defection to the Empire c. 3,643 (Part3a)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "on Coruscant with Din during the Sacking",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a Special Forces lieutenant with Orgus Din before the Sacking (3,653), at about 25"
  },
  "lore:var-suthra": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3677,
        "toBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3670,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "fought beside Orgus Din; a general in the Cold War (c. 3,650), at 45"
  },
  "lore:zeerid-korr": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3672,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Havoc commando with a daughter born in 3,662; flew Aryn Leneer in 3,653"
  },
  "lore:nico-okarr": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3688,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "stasis",
        "fromBby": 3681,
        "toBby": 3632,
        "note": "vanished after the Korriban escape; a Korriban artifact kept him from ageing, unseen until 3,631",
        "source": "Part3a (missing, not seen until 3,631)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:elara-dorne": {
    "ranks": [
      {
        "role": "soldier",
        "title": "Imperial medic",
        "fromBby": 3648,
        "toBby": 3647,
        "faction": "sithEmpire",
        "source": "Imperial medic from 3,648 (Part3a)"
      },
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3646,
        "toBby": 3644,
        "source": "defected 3,646 (Part3a)"
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3643,
        "source": "Havoc Squad 3,643 (Meteor; Part3a)"
      }
    ]
  },
  "lore:tanno-vik": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3658,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:m1-4x": {
    "ranks": [
      {
        "role": "droid",
        "title": "droid",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:yuun": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3652,
        "toBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:fideltin-rusk": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3662,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "~21, serving",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "born 3,680 BBY on Mindor (the planets file; brief §4)"
  },
  "lore:t7-o1": {
    "ranks": [
      {
        "role": "droid",
        "title": "droid",
        "fromBby": 3844,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "with Zallow",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Coruscant",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:doc": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3652,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:corso-riggs": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3647,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:bowdaar": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3820,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "in the arenas",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "in the arenas",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ]
  },
  "lore:risha-drayen": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:guss-tuno": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3657,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:qyzen-fess": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3657,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:tharan-cedrax": {
    "ranks": [
      {
        "role": "scholar",
        "title": "civilian",
        "fromBby": 3652,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:holiday": {
    "ranks": [
      {
        "role": "scholar",
        "title": "civilian",
        "fromBby": 3630,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "made by or with Tharan Cedrax (born 3,672) as an adult (undated)"
  },
  "lore:zenith": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3660,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:felix-iresso": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:arra-yooms": {
    "ranks": [
      {
        "role": "civilian",
        "title": "civilian",
        "fromBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:korvan": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3672,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Republic general on Quesh in 3,642, a veteran of Dantooine and Velmor"
  },
  "lore:vasil-dorne": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3678,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "garrison commander [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:zellos": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3693,
        "toBby": 3687,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3686,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "the Grand Moff of the second invasion of Bothawui, read as the war of Belth Allusis (died 3,671), at 40"
  },
  "lore:shareis": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "War Minister (Ord Radama, c. 3660 BBY)",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:shullis-khamarr": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a minister in the Ord Radama supply chain (c. 3,660), at 45"
  },
  "lore:layek-davos": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3672,
        "toBby": 3666,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "an admiral in the Cold War; died 3,642"
  },
  "lore:broysc": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3677,
        "toBby": 3671,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3670,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Druckenwell",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a Moff at Druckenwell in 3,653, at 42"
  },
  "lore:tarrick": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3682,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "a Moff assassinated before 3,653"
  },
  "lore:keeper": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "undated; head of Operations c. 3,643, later Minister"
  },
  "lore:shara-jenn": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Cipher Nine's handler; Keeper from 3,642, at 38"
  },
  "lore:watcher-x": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3660,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "~24, post-Undertow",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:fixer-seven": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3664,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:cipher-twelve": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "an \"old guard\" Cipher agent, killed by 3,672"
  },
  "lore:ula-vii": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3643,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:hunter": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:malavai-quinn": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "~19, serving",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "lieutenant",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ]
  },
  "lore:vette": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3639,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:pierce": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3653,
        "toBby": 3647,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3646,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:broonmark": {
    "ranks": [
      {
        "role": "other",
        "title": "Talz warrior",
        "fromBby": 3662,
        "toBby": 3644,
        "faction": "republic",
        "source": "a killer who served the Republic (Part3a)",
        "estimate": true
      },
      {
        "role": "other",
        "title": "Talz warrior",
        "fromBby": 3643,
        "source": "then the Empire (Wrath)",
        "estimate": true
      }
    ],
    "birthBasis": "undated; a Wrath companion c. 3,643"
  },
  "lore:kaliyo-djannis": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3647,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:eckard-fixer-fifteen-lokin": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3682,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "~54",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:vector-hyllus": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:raina-temple": {
    "ranks": [
      {
        "role": "official",
        "title": "official",
        "fromBby": 3641,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:scorpio": {
    "ranks": [
      {
        "role": "droid",
        "title": "droid",
        "fromBby": 3686,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "in use as a droid",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:talos-drellik": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3651,
        "toBby": 3645,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3644,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:andronikos-revel": {
    "ranks": [
      {
        "role": "officer",
        "title": "Republic Navy captain",
        "fromBby": 3653,
        "toBby": 3646,
        "faction": "republic",
        "source": "Republic Navy captain (Part3a)",
        "estimate": true
      },
      {
        "role": "smuggler",
        "title": "pirate",
        "fromBby": 3645,
        "faction": "independent",
        "source": "turned pirate (Nox; Part3a)",
        "estimate": true
      }
    ]
  },
  "lore:mandalore-the-lesser": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3682,
        "toBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "Mandalore",
        "fromBby": 3667,
        "toBby": 3660,
        "source": "Mandalore: Timeline slice Part 1 (3,667, 3,660); D-382 [1], [4]"
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Mandalore; Hydian Way blockade",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "took the title Mandalore in 3,667, at 33"
  },
  "lore:jicoln-cadera": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3675,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "Torian's father (Torian born c. 3,660) and leader of the Crusader schism (brief §4: older)"
  },
  "lore:torian-cadera": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3640,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:akaavi-spar": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:dao-stryver": {
    "ranks": [
      {
        "role": "soldier",
        "title": "soldier",
        "fromBby": 3662,
        "toBby": 3656,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      },
      {
        "role": "officer",
        "title": "officer",
        "fromBby": 3655,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "undated; Mandalore's champion c. 3,643 (Sebaddon)"
  },
  "lore:braden": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3680,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Dantooine",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a veteran hunter and Mako's mentor, hunting Dalborra in 3,653 at about 53 (brief §4: older)"
  },
  "lore:mako": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3642,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:gault-rennow": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3677,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "smuggler with Hylo; blockade run",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ]
  },
  "lore:skadge": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3658,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:blizz": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "undated; travelled with the Grand Champion c. 3,643"
  },
  "lore:karagga-the-unyielding": {
    "ranks": [
      {
        "role": "criminal",
        "title": "criminal",
        "fromBby": 4440,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "Supreme Mogul [inferred]",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Supreme Mogul [inferred from \"nearly two centuries\"]",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "locations": [
      {
        "place": "Nal Hutta",
        "fromBby": 3681,
        "toBby": 3653,
        "doing": "Supreme Mogul of the Hutt Cartel [inferred], ruling from his palace on Nal Hutta",
        "placed": true,
        "source": "SW_NarShaddaa_HuttSpace_GGW_Part1 (entry B: \"ruled from a palace on Nal Hutta\"); D-385"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:suudaa-nemro": {
    "ranks": [
      {
        "role": "criminal",
        "title": "criminal",
        "fromBby": 4221,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ]
  },
  "lore:tassaa-bareesh": {
    "ranks": [
      {
        "role": "criminal",
        "title": "criminal",
        "fromBby": 3780,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:nok-drayen": {
    "ranks": [
      {
        "role": "criminal",
        "title": "criminal",
        "fromBby": 3676,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "crime lord",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      },
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "Nar Shaddaa",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "a crime lord in 3,661 (Risha born 3,664), at 35"
  },
  "lore:hylo-visz": {
    "ranks": [
      {
        "role": "smuggler",
        "title": "smuggler",
        "fromBby": 3663,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "smuggler leader; blockade run",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:zale-barrows": {
    "ranks": [
      {
        "role": "smuggler",
        "title": "smuggler",
        "fromBby": 3665,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3661,
        "toBby": 3661,
        "note": "blockade run, c. 3660 BBY",
        "source": "status in 3,661 BBY (master index, lore batch 19)"
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
  "lore:vrath-xizor": {
    "ranks": [
      {
        "role": "criminal",
        "title": "criminal",
        "fromBby": 3660,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "status": [
      {
        "kind": "active",
        "fromBby": 3653,
        "toBby": 3653,
        "note": "hunting Korr",
        "source": "status in 3,653 BBY (lore batch 19)"
      }
    ],
    "birthBasis": "an ex-Imperial sniper hunting Zeerid Korr in 3,653"
  },
  "lore:jewla-nightbringer": {
    "ranks": [
      {
        "role": "bountyHunter",
        "title": "bounty hunter",
        "fromBby": 3650,
        "source": "estimate: typical rank ages (D-412)",
        "estimate": true
      }
    ],
    "birthBasis": "kept: an estimate consistent with the rank facts (D-412 review)"
  },
};
