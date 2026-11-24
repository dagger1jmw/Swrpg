// Species traits (Jared, 2026-11-24; M8 checklist item 3, D-473; design notes "Species traits framework"). Every trait cites
// the species files; a trait with no source is not here (docs-v2/lore/RESEARCH_QUEUE.md lists the gaps). The lore gives the
// direction, never the number: EVERY number in an `effect` and the size rule are `invented`, for Jared to rule on.
// Drawbacks only where the lore gives one. Traits shown as text reach the player's sheet and the narrator.
import type { HazardType } from './health.config';
import type { PhysicalStat } from './skills';

export const TRAIT_KINDS = ['body', 'senses', 'resistances', 'needs', 'social', 'force'] as const;
export type TraitKind = (typeof TRAIT_KINDS)[number];

export type TraitEffect =
  /** Added to the ceiling of a physical stat (training never passes it). */
  | { kind: 'cap'; stat: PhysicalStat; value: number }
  /** A hide or shell: armor points under any armor worn. */
  | { kind: 'hide'; value: number }
  /** A hazard's damage, multiplied. */
  | { kind: 'hazard'; type: HazardType; factor: number }
  /** A Force trait (forceResistance.config SPECIES_FORCE_TRAITS holds the rule). */
  | { kind: 'forceTrait'; trait: 'mindImmune' | 'mindResistant' | 'forceResistant' };

export interface SpeciesTrait {
  kind: TraitKind;
  text: string;
  source: string;
  drawback?: true;
  effects?: readonly TraitEffect[];
  /** The years a social trait holds (negative = BBY); absent = always. */
  years?: readonly [number, number];
}

const P1 = 'SW_Species_OldRepublic_Part1';
const P2 = 'SW_Species_OldRepublic_Part2';

type Row = readonly [TraitKind, string, (Omit<Partial<SpeciesTrait>, 'kind' | 'text'> | undefined)?];
const of = (file: string, entry: string, rows: readonly Row[]): readonly SpeciesTrait[] => rows.map(([kind, text, extra]) => ({ kind, text, source: `${file}, ${entry}`, ...extra }));
const D = { drawback: true } as const;
const cap = (stat: PhysicalStat, value: number): TraitEffect => ({ kind: 'cap', stat, value });

/** By species-table id. The Wookiee, traited before this, gains only the drawback the design notes name. */
export const SPECIES_TRAITS: Readonly<Record<string, readonly SpeciesTrait[]>> = {
  wookiee: of(P1, 'Wookiee', [['social', 'cannot speak Basic, though they understand it', D]]),
  kel_dor: of(P1, 'Kel Dor', [
    ['needs', 'off Dorin must wear an antiox mask and goggles; effectively blind without the goggles', D],
    ['senses', 'low-light vision, sees twice as far as normal (game stat)'],
    ['resistances', 'survives briefly in vacuum'],
    ['force', 'silver irises are often seen as a mark of Force affinity'],
  ]),
  trandoshan: of(P1, 'Trandoshan', [
    ['body', 'sturdier and much stronger than Humans', { effects: [cap('strength', 10), cap('endurance', 5)] }],
    ['body', 'cold-blooded; slowly regrows lost limbs until about 54 (game stat)'],
    ['senses', 'sensitive eyes that see far into the infrared'],
    ['force', 'Force-sensitivity is uncommon'],
  ]),
  rodian: of(P1, 'Rodian', [
    ['senses', 'multifaceted eyes that see into the infrared; antennae sense vibration; Rodians tell each other apart by scent'],
    ['social', 'a musky scent that overwhelms most Humans', D],
    ['social', 'lisps in Basic and struggles with r, l and s', D],
  ]),
  duros: of(P1, 'Duros', [
    ['senses', 'no nose; smells through organs below the eyes'],
    ['body', 'superior astronavigators'],
    ['social', 'common among Imperial slaves, yet treated in Imperial field hospitals', { years: [-3681, -3640] }],
  ]),
  bothan: of(P1, 'Bothan', [['social', 'fur ripples with emotion (wrendui) and betrays a lie to anyone who can read it', D]]),
  cerean: of(P1, 'Cerean', [
    ['body', 'a binary brain, fed by an extra heart, focuses on many things at once'],
    ['force', 'Force-sensitivity about as common as in Humans [gray]'],
  ]),
  nautolan: of(P1, 'Nautolan', [
    ['senses', 'low-light vision; head-tendrils smell pheromones and read emotions, best underwater'],
    ['body', 'breathes underwater and in air; a tough skeleton resists glancing blows'],
    ['social', 'cannot fully speak their own language in air', D],
  ]),
  devaronian: of(P1, 'Devaronian', [
    ['resistances', 'highly resistant to poison; sulfur acts as a stimulant', { effects: [{ kind: 'hazard', type: 'poison', factor: 0.25 }] }],
  ]),
  gand: of(P2, 'Gand', [
    ['body', 'an exoskeleton with regenerative properties; natural armour shrugs off crippling injuries', { effects: [{ kind: 'hide', value: 2 }] }],
    ['needs', 'lunged Gands need breathing gear off Gand', D],
    ['resistances', 'lungless Gands do not breathe and are immune to poison gas'],
    ['force', 'the findsmen, a Force-sensitive tradition; some speak mind to mind within 60 m'],
    ['social', 'Gand scavengers on Coruscant felt victimised by discriminatory laws', { years: [-3653, -3642] }],
  ]),
  kaleesh: of(P2, 'Kaleesh', [
    ['senses', 'thermal pits under the eyes see in the dark'],
    ['body', 'five claws on each foot'],
    ['social', 'recognised by both sides as proud, honourable and deadly warriors'],
    ['social', 'several were Imperial slaves; treated in Imperial field hospitals', { years: [-3681, -3640] }],
    ['force', 'sensitivity is held a blessing from the ancestors; no Kaleesh Jedi are known'],
  ]),
  nikto: of(P2, 'Nikto', [
    ['body', 'leathery skin, sometimes with spikes and horns; each subspecies is shaped to its own environment'],
    ['social', 'long used by the Hutts to hold Hutt Space'],
  ]),
  weequay: of(P2, 'Weequay', [
    ['resistances', 'a thick hide that resists blunt trauma, burns, blaster fire and cuts', { effects: [{ kind: 'hide', value: 2 }, { kind: 'hazard', type: 'fire', factor: 0.75 }, { kind: 'hazard', type: 'impact', factor: 0.75 }, { kind: 'hazard', type: 'fall', factor: 0.75 }] }],
    ['senses', 'clan pheromones that no other species or clan understands'],
    ['force', 'many were Force-sensitive and joined the Jedi'],
  ]),
  houk: of(P2, 'Houk', [
    ['body', 'among the strongest humanoids, rivalled only by Wookiees', { effects: [cap('strength', 15)] }],
    ['social', 'short-tempered; tends to solve problems violently', D],
  ]),
  talz: of(P2, 'Talz', [
    ['body', 'built for heavy labour; fierce claws', { effects: [cap('strength', 5), cap('endurance', 5)] }],
    ['senses', 'two pairs of eyes, the larger for night'],
    ['resistances', 'built for cold'],
  ]),
  epicanthix: of(P2, 'Epicanthix', [['force', 'some (not all) have an unconscious talent that shields the mind from the Force']]),
  falleen: of(P2, 'Falleen', [
    ['body', 'very quick reflexes', { effects: [cap('agility', 5)] }],
    ['body', 'cold-blooded; semi-aquatic, holds the breath underwater for a long time'],
    ['social', 'pheromones make them nearly irresistible; the skin reddens as they are released'],
    ['force', 'one of the few species resistant to mind tricks', { effects: [{ kind: 'forceTrait', trait: 'mindResistant' }] }],
  ]),
  hutt: of(P2, 'Hutt', [
    ['resistances', 'resists many poisons, diseases and all but the most corrosive chemicals', { effects: [{ kind: 'hazard', type: 'poison', factor: 0.5 }] }],
    ['senses', 'sees ultraviolet light'],
    ['social', 'clan crime lords; owning slaves is a status symbol'],
    ['social', 'a strong body odour', D],
    ['force', 'the mind resists Force mind tricks; rarely Force-sensitive', { effects: [{ kind: 'forceTrait', trait: 'mindImmune' }] }],
  ]),
  jawa: of(P2, 'Jawa', [
    ['senses', 'exceptional night vision; scent carries identity, health, clan and mood'],
    ['resistances', 'a strong immune system'],
    ['social', 'very passive; puts up little resistance', D],
  ]),
  dashade: of(P2, 'Dashade', [
    ['body', 'powerful claws; dissipates heat and is hard to detect on life-form sensors'],
    ['resistances', 'resistant to radiation'],
    ['force', 'partly resistant to the Force', { effects: [{ kind: 'forceTrait', trait: 'forceResistant' }] }],
  ]),
  chagrian: of(P2, 'Chagrian', [
    ['body', 'fully amphibious as adults'],
    ['senses', 'acute low-light vision'],
    ['senses', 'those raised on Champala lose the sense of taste by adulthood', D],
  ]),
  selkath: of(P2, 'Selkath', [
    ['body', 'retractable venom-tipped claws; using them in a fight is dishonourable'],
    ['body', 'camouflage skin'],
    ['social', 'finds it rude to be approached without showing a wish to talk'],
  ]),
  sullustan: of(P2, 'Sullustan', [
    ['senses', 'excellent directional hearing; sees up to 20 m in the dark; an exceptional sense of direction'],
    ['senses', 'the eyes start failing after 30', D],
  ]),
  ithorian: of(P2, 'Ithorian', [
    ['body', 'a sonic bellow, far stronger in the Force-trained; speaks in stereo'],
    ['force', 'many are Force-sensitive; each herd was led by a Force-sensitive priest-healer'],
  ]),
  arkanian: of(P2, 'Arkanian', [
    ['senses', 'sees in the infrared'],
    ['senses', 'eyes sensitive to extreme heat', D],
    ['social', 'see themselves as among the most intelligent beings and are easily offended', D],
  ]),
  zeltron: of(P2, 'Zeltron', [
    ['social', 'potent pheromones; widely considered attractive'],
    ['force', 'limited empathic telepathy that projects and reads emotions'],
  ]),
  gran: of(P2, 'Gran', [
    ['senses', 'excellent vision with more colours than most species, infrared included'],
    ['needs', 'left alone too long can go mad or die of loneliness; usually dies within days of a mate', D],
  ]),
  voss: of(P2, 'Voss', [
    ['force', 'a high rate of Force-sensitivity'],
    ['social', 'reserved, speaking little'],
  ]),
  gormak: of(P2, 'Gormak', [['social', 'a talent for technology rivalling top galactic minds; hostile to the Voss and to off-worlders']]),
  gektl: of(P2, 'Gektl', [['body', 'a tough survivor that can shed skin, even its tail, to escape danger', { effects: [cap('endurance', 5)] }]]),
  yodas_species: of(P2, "Yoda's species", [['force', 'every known member was a Jedi']]),
  sarkhai: of(P2, 'Sarkhai', [['force', 'Force-sensitives are uncommon']]),
  echani: of(P2, 'Echani', [
    ['senses', 'reads people through body language; combat is the truest communication, and Echani generals seem to predict an opponent'],
    ['body', 'prefers light armour and agility'],
  ]),
  aqualish: of(P2, 'Aqualish', [['force', 'Force-sensitives are rare']]),
};

/** The Human height the species files give (1.70-1.80 m), as one figure. */
export const HUMAN_HEIGHT = 1.75;
/**
 * Body scale by lore size (D-473): the middle of the stated height over a Human's. It scales Strength and Endurance; a
 * species' Agility ceiling is the Human one plus its own traits (invented rule: height says nothing about quickness). The
 * Hutt has no height, only a mass of 1,500 kg: 1.5 stays, invented.
 */
export const SPECIES_HEIGHT: Readonly<Record<string, { m: number; stated: string; tag: 'lore' | 'game stat' }>> = {
  kel_dor: { m: 1.7, stated: '1.4-2 m', tag: 'lore' },
  trandoshan: { m: 2, stated: '2 m', tag: 'lore' },
  rodian: { m: 1.6, stated: '1.5-1.7 m', tag: 'lore' },
  duros: { m: 1.95, stated: '1.7-2.2 m', tag: 'game stat' },
  bothan: { m: 1.55, stated: '1.5-1.6 m', tag: 'lore' },
  cerean: { m: 2, stated: '2 m', tag: 'lore' },
  nautolan: { m: 1.8, stated: '1.8 m', tag: 'lore' },
  devaronian: { m: 1.6, stated: '1.6 m', tag: 'game stat' },
  gand: { m: 1.65, stated: '1.5 / 1.8 m', tag: 'game stat' },
  kaleesh: { m: 1.7, stated: '1.6-1.8 m', tag: 'game stat' },
  nikto: { m: 1.8, stated: '1.8 m', tag: 'lore' },
  weequay: { m: 1.75, stated: '1.6-1.9 m', tag: 'lore' },
  houk: { m: 2.2, stated: '2.2 m', tag: 'game stat' },
  talz: { m: 2.25, stated: '2-2.5 m', tag: 'lore' },
  epicanthix: { m: 2.15, stated: '1.8-2.5 m', tag: 'game stat' },
  falleen: { m: 1.5, stated: '1.4-1.6 m', tag: 'lore' },
  jawa: { m: 1, stated: '1 m', tag: 'game stat' },
  dashade: { m: 1.85, stated: '1.7-2 m', tag: 'lore' },
  chagrian: { m: 1.9, stated: '1.9 m', tag: 'lore' },
  selkath: { m: 1.5, stated: '1.5 m', tag: 'lore' },
  sullustan: { m: 1.4, stated: '1-1.8 m', tag: 'lore' },
  ithorian: { m: 2.05, stated: '1.8-2.3 m', tag: 'lore' },
  arkanian: { m: 1.8, stated: '1.8 m', tag: 'lore' },
  zeltron: { m: 1.8, stated: '1.8 m', tag: 'lore' },
  gran: { m: 1.65, stated: '1.5-1.8 m', tag: 'lore' },
  yodas_species: { m: 0.7, stated: '0.7 m', tag: 'lore' },
  aqualish: { m: 1.85, stated: '1.7-2.0 m', tag: 'lore' },
};

export const traitsOf = (speciesId: string, year?: number): readonly SpeciesTrait[] =>
  (SPECIES_TRAITS[speciesId] ?? []).filter((t) => !t.years || year === undefined || (year >= t.years[0] && year <= t.years[1]));
const effectsOf = (speciesId: string): readonly TraitEffect[] => traitsOf(speciesId).flatMap((t) => t.effects ?? []);

/** A species' ceiling bonuses from its traits. */
export function traitCapBonus(speciesId: string): Partial<Record<PhysicalStat, number>> {
  const out: Partial<Record<PhysicalStat, number>> = {};
  for (const e of effectsOf(speciesId)) if (e.kind === 'cap') out[e.stat] = (out[e.stat] ?? 0) + e.value;
  return out;
}
/** Armor points of the hide (0 = none). */
export const traitHide = (speciesId: string): number => effectsOf(speciesId).reduce((n, e) => n + (e.kind === 'hide' ? e.value : 0), 0);
/** The share of a hazard's damage that reaches the body. */
export const traitHazardFactor = (speciesId: string, type: HazardType): number => effectsOf(speciesId).reduce((f, e) => f * (e.kind === 'hazard' && e.type === type ? e.factor : 1), 1);
