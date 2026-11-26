// Canon figures' traits (M8 checklist item 16; spec/traits.md section 8): only what the lore files say of the figure, each
// with its line. For Jared's review (report: docs-v2/reports/m8-traits.md). A figure not listed gets no traits from the lore
// and none at random (the narrator plays it from its facts). Ties name a canon partner where the lore gives one.
// P1/P2/P3a/P3b = Docs/SWRPG lore/SW_Characters_09_GGW_ColdWar_Part1/2/3a/3b.md; OLD09 = OLD_SW_Characters_09_GreatGalacticWar_ColdWar.md.

export interface CanonTraits {
  canonId: string;
  traits: readonly string[];
  /** A tie's canon partner: trait id -> partner canon id. */
  ties?: Readonly<Record<string, string>>;
  source: string;
}

export const CANON_TRAITS: readonly CanonTraits[] = [
  { canonId: 'lore:fideltin-rusk', traits: ['reckless', 'lostFamily'], source: 'P3a l.175: "enlisted young; reckless, costly commander; his parents\' colony destroyed 3650 BBY"' },
  { canonId: 'lore:corso-riggs', traits: ['frontierWorld', 'betrayed'], source: 'P3a l.178: "rancher\'s son; Viidu\'s gunman, betrayed by Skavak"' },
  { canonId: 'lore:bowdaar', traits: ['formerPrisoner'], source: 'P3a l.179: "gladiator slave over a century, >10,000 bouts"' },
  { canonId: 'lore:tanno-vik', traits: ['lostFamily', 'stubborn'], source: 'P3a l.172: "orphan gang member, then an insubordinate Republic soldier"' },
  { canonId: 'lore:vette', traits: ['slaveBorn'], source: 'P3b l.75: "slave freed by Nok Drayen" (enslaved as a child; the nearest origin)' },
  { canonId: 'lore:eleena-daru', traits: ['slaveBorn', 'loyal'], source: 'P3b l.48-52: "Malgus\'s lover and bodyguard"; "a slave in the Geonosis pens until Malgus freed her"' },
  { canonId: 'lore:mako', traits: ['lostFamily'], source: 'P3b l.119: "orphan slicer found by Braden"' },
  { canonId: 'lore:gault-rennow', traits: ['witty'], source: 'P3b l.120: "con artist; broke the Hydian blockade with Hylo in 3660 BBY, then betrayed her"' },
  { canonId: 'lore:nok-drayen', traits: ['betrayed'], source: 'P3b l.134: "at a Nar Shaddaa meeting in 3653 BBY, where he was betrayed and infected"' },
  { canonId: 'lore:darth-thanaton', traits: ['slaveBorn', 'rival'], ties: { rival: 'lore:darth-nox' }, source: 'P2 l.140: "born Teneb Kel, a slave"; OLD09 l.681: "rival to Darth Nox"' },
  { canonId: 'lore:darth-nox', traits: ['slaveBorn', 'rival'], ties: { rival: 'lore:darth-thanaton' }, source: 'P2 l.234: "born a slave; heir of Aloysius Kallig"; OLD09 l.681 (Thanaton, "rival to Darth Nox")' },
  { canonId: 'lore:darth-arkous', traits: ['warVeteran'], source: 'P2 l.202: "Dark Councilor in the Galactic War; GGW veteran"' },
  { canonId: 'lore:nomen-karr', traits: ['warVeteran'], source: 'P1 l.275: one of the Order\'s "most seasoned veterans" in the Cold War' },
  { canonId: 'lore:tasiele-shan', traits: ['outcast'], source: 'P1 l.346: "exiled after challenging the Order\'s views on attachment"' },
  { canonId: 'lore:korvan', traits: ['warVeteran'], source: 'P3a l.188: "veteran of Dantooine and Velmor"' },
  { canonId: 'lore:galena-rans', traits: ['warVeteran'], source: 'P3a l.74: "veteran of the 439th bomber wing"' },
  { canonId: 'lore:harron-tavus', traits: ['warVeteran', 'betrayed'], source: 'P3a (Harron Tavus): Special Forces in the Minos Cluster and at the Sacking; "turned against the Republic over the Ando Prime abandonment"' },
  { canonId: 'lore:scourge', traits: ['disciplined'], source: 'OLD09 l.116: "A powerful, disciplined warrior ... controlled ferocity (not berserker rage)"' },
  { canonId: 'lore:darth-marr', traits: ['disciplined', 'loyal'], source: 'OLD09 l.158: "the Empire\'s most respected and stalwart defender ... held the fractious Dark Council together"; l.169: "A disciplined, powerful duelist"' },
  { canonId: 'lore:darth-malgus', traits: ['ambitious'], source: 'OLD09 l.132: "he rebelled, declared a \'New Empire\'"' },
  { canonId: 'lore:satele-shan', traits: ['forbiddenBond'], ties: { forbiddenBond: 'lore:jace-malcom' }, source: 'OLD09 l.245 (Jace Malcom): "fell in love with Satele Shan, and fathered her secret son Theron"' },
  { canonId: 'lore:jace-malcom', traits: ['warVeteran', 'idealistic'], source: 'OLD09 l.245: "An elite Republic trooper ... A hardened, principled soldier"' },
  { canonId: 'lore:orgus-din', traits: ['warVeteran'], source: 'OLD09 l.296: "A pragmatic, battle-hardened Master and Great War veteran"' },
  { canonId: 'lore:darth-angral', traits: ['hotHeaded'], source: 'OLD09 l.296 and l.350: "the vengeful Darth Angral"; "vengeful warlord"' },
  { canonId: 'lore:darth-baras', traits: ['ambitious'], source: 'OLD09 l.327: "supremely cunning ... so he could pose as the Voice of the Emperor and seize control of the Empire"' },
  { canonId: 'lore:shae-vizla', traits: ['mandalorianClan'], source: 'OLD09 l.433: "One of the most legendary Mandalorian warriors of the era"' },
];
